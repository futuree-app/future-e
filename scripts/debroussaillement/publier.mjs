#!/usr/bin/env node
/**
 * publier.mjs (FUT-149) : publie une édition des tuiles du zonage du débroussaillement obligatoire sur Supabase
 * Storage, bascule l'application dessus, revient à une édition précédente, ou efface les éditions obsolètes.
 * Même patron que la fibre à l'adresse (FUT-156, `scripts/fibre-adresse/publier.mjs`).
 *
 * ── L'ORGANISATION DU BUCKET (privé) ─────────────────────────────────────────────────────────────────
 *   <édition>/t/<ix>_<iy>.json.gz      les tuiles, immuables (jamais réécrites)
 *   <édition>/manifest.json            le manifeste de l'édition (couverture, profils, tuiles et empreintes)
 *   courant.json                       LE POINTEUR : l'édition que lit l'application
 *
 * ── LA PUBLICATION EST ATOMIQUE ──────────────────────────────────────────────────────────────────────
 *  1. `envoyer` dépose les tuiles puis le manifeste sous un préfixe NEUF : l'application ne les voit pas.
 *  2. `basculer` vérifie que chaque tuile du manifeste est en ligne, avec la taille et le SHA-256 attendus, puis
 *     réécrit le pointeur. C'est la seule écriture que l'application voit ; elle la lit dans les dix minutes.
 *  3. `basculer --edition <ancienne>` est le retour arrière : l'ancien préfixe est toujours là.
 *  4. `purger` efface les éditions ni courantes ni parmi les `--garder` plus récentes (2 par défaut).
 *
 * ── LA GARDE DE PRODUCTION ───────────────────────────────────────────────────────────────────────────
 *  `--cible test|production` est obligatoire, et l'URL doit être celle du projet nommé. La production exige en
 *  plus `--confirmer-production`. Le bucket n'est jamais créé par ce script : il se crée (privé) à la main.
 *
 * Variables : DEBROUSSAILLEMENT_SUPABASE_URL, DEBROUSSAILLEMENT_SUPABASE_CLE (clé serveur du projet visé).
 *
 * Usage :
 *   node scripts/debroussaillement/publier.mjs envoyer  --cible test --source <sortie>/<édition>
 *   node scripts/debroussaillement/publier.mjs basculer --cible test --edition 2026-03-01
 *   node scripts/debroussaillement/publier.mjs purger   --cible test [--garder 2]
 *   node scripts/debroussaillement/publier.mjs etat     --cible test
 */
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { FORMAT_TUILES_DEBROUSSAILLEMENT, manifesteValide } from "../../src/lib/debroussaillement.ts";

export const PROJETS = { test: "atvknbgahcuovcyqapfx", production: "xkewgsccadjmondzmjxj" };
export const BUCKET = "debroussaillement";
const PARALLELE = 8;

const [commande, ...args] = process.argv.slice(2);
const opt = (nom, defaut = null) => (args.includes(nom) ? args[args.indexOf(nom) + 1] : defaut);

/** La cible, vérifiée contre l'URL : jamais la production sans le demander deux fois. */
export function verifierCible(cible, url, confirmer) {
  if (!(cible in PROJETS)) throw new Error("--cible test|production est obligatoire");
  if (!url || !new URL(url).hostname.startsWith(`${PROJETS[cible]}.`)) throw new Error(`l'URL ${url} n'est pas celle du projet ${cible} (${PROJETS[cible]})`);
  if (cible === "production" && !confirmer) throw new Error("écriture en production : ajouter --confirmer-production");
}

export function client(url, cle, f = fetch) {
  const base = `${url.replace(/\/$/, "")}/storage/v1`;
  const entetes = { Authorization: `Bearer ${cle}`, apikey: cle };
  async function appel(methode, chemin, corps, extra = {}) {
    for (let i = 1; ; i++) {
      const res = await f(`${base}${chemin}`, { method: methode, headers: { ...entetes, ...extra }, body: corps, signal: AbortSignal.timeout(60_000) });
      if (res.ok || i >= 4 || res.status < 500) return res;
      await new Promise((r) => setTimeout(r, 1000 * i));
    }
  }
  return {
    async deposer(chemin, octets, type, remplacer = false) {
      // Une tuile est immuable : elle peut rester en cache. Le pointeur et le manifeste, jamais.
      const cache = remplacer ? "no-cache" : "max-age=86400";
      const res = await appel("POST", `/object/${BUCKET}/${chemin}`, octets, { "Content-Type": type, "x-upsert": remplacer ? "true" : "false", "Cache-Control": cache });
      if (!res.ok) throw new Error(`${chemin} : HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    },
    async lire(chemin) {
      // Un paramètre unique contourne le cache du CDN : l'objet relu est celui qui vient d'être écrit.
      const res = await appel("GET", `/object/${BUCKET}/${chemin}?cacheNonce=${Date.now()}`);
      if (res.status === 404 || res.status === 400) return null;
      if (!res.ok) throw new Error(`${chemin} : HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    },
    async lister(prefixe) {
      const out = [];
      for (let offset = 0; ; offset += 1000) {
        const res = await appel("POST", `/object/list/${BUCKET}`, JSON.stringify({ prefix: prefixe, limit: 1000, offset }), { "Content-Type": "application/json" });
        if (!res.ok) throw new Error(`liste ${prefixe} : HTTP ${res.status}`);
        const page = await res.json();
        out.push(...page.map((o) => ({ nom: o.name, octets: o.metadata?.size ?? null })));
        if (page.length < 1000) return out;
      }
    },
    async effacer(chemins) {
      for (let i = 0; i < chemins.length; i += 500) {
        const res = await appel("DELETE", `/object/${BUCKET}`, JSON.stringify({ prefixes: chemins.slice(i, i + 500) }), { "Content-Type": "application/json" });
        if (!res.ok) throw new Error(`effacement : HTTP ${res.status}`);
      }
    },
  };
}

async function parallele(elements, f) {
  let i = 0;
  await Promise.all(Array.from({ length: PARALLELE }, async () => { while (i < elements.length) await f(elements[i++]); }));
}

const sha256 = (b) => createHash("sha256").update(b).digest("hex");

/** Les tuiles qui ont un fichier, avec l'empreinte écrite à la construction. */
export function fichiersDuManifeste(m) {
  return Object.entries(m.tuiles).filter(([, t]) => !("plein" in t)).map(([cle, t]) => {
    if (!/^-?\d+_-?\d+$/.test(cle) || !Number.isSafeInteger(t.octets) || t.octets <= 0 || !/^[a-f0-9]{64}$/.test(t.sha256 ?? "")) {
      throw new Error(`intégrité : tuile ${cle} sans empreinte valide`);
    }
    return { chemin: `${m.edition}/t/${cle}.json.gz`, attendu: t };
  });
}

function verifierOctets(b, attendu, chemin) {
  if (!b || b.length !== attendu.octets || sha256(b) !== attendu.sha256) throw new Error(`intégrité : ${chemin}, taille ou SHA-256 différent de la construction`);
}

export async function envoyer(c, source) {
  const m = JSON.parse(await fs.readFile(path.join(source, "manifest.json"), "utf8"));
  if (!manifesteValide(m)) throw new Error("manifeste local illisible");
  const fichiers = fichiersDuManifeste(m);
  const deja = new Set((await c.lister(`${m.edition}/t/`)).map((o) => o.nom));
  let envoyes = 0, octets = 0;
  const t0 = Date.now();
  await parallele(fichiers, async ({ chemin, attendu }) => {
    const b = await fs.readFile(path.join(source, "t", path.basename(chemin)));
    verifierOctets(b, attendu, chemin);
    octets += b.length;
    if (!deja.has(path.basename(chemin))) {
      await c.deposer(chemin, b, "application/gzip");
      envoyes++;
    }
    // Reprise ET nouvel envoi : relire les octets, jamais se fier au nom ou à la taille seule.
    verifierOctets(await c.lire(chemin), attendu, chemin);
  });
  await c.deposer(`${m.edition}/manifest.json`, Buffer.from(JSON.stringify(m)), "application/json", true);
  console.log(JSON.stringify({ edition: m.edition, tuiles: fichiers.length, envoyes, octets, secondes: Math.round((Date.now() - t0) / 1000) }));
}

export async function basculer(c, edition) {
  const brut = await c.lire(`${edition}/manifest.json`);
  if (!brut) throw new Error(`${edition} : aucun manifeste en ligne`);
  const m = JSON.parse(brut.toString("utf8"));
  if (!manifesteValide(m) || m.edition !== edition) throw new Error(`${edition} : manifeste invalide`);
  await parallele(fichiersDuManifeste(m), async ({ chemin, attendu }) => verifierOctets(await c.lire(chemin), attendu, chemin));
  const avant = await c.lire("courant.json");
  await c.deposer("courant.json", Buffer.from(JSON.stringify({ format: FORMAT_TUILES_DEBROUSSAILLEMENT, edition })), "application/json", true);
  console.log(`pointeur : ${avant ? JSON.parse(avant.toString("utf8")).edition : "(aucun)"} -> ${edition}`);
}

async function etat(c) {
  const pointeur = await c.lire("courant.json");
  const editions = (await c.lister("")).filter((o) => /^\d{4}-\d{2}-\d{2}$/.test(o.nom)).map((o) => o.nom).sort();
  const detail = {};
  for (const v of editions) {
    const objets = await c.lister(`${v}/t/`);
    detail[v] = { tuiles: objets.length, octets: objets.reduce((s, o) => s + (o.octets ?? 0), 0) };
  }
  const courant = pointeur ? JSON.parse(pointeur.toString("utf8")).edition : null;
  console.log(JSON.stringify({ courant, editions: detail }, null, 1));
  return { courant, editions };
}

async function purger(c, garder) {
  const { courant, editions } = await etat(c);
  const gardes = new Set([courant, ...editions.slice(-garder)].filter(Boolean));
  for (const v of editions.filter((x) => !gardes.has(x))) {
    const objets = [...(await c.lister(`${v}/t/`)).map((o) => `${v}/t/${o.nom}`), `${v}/manifest.json`];
    await c.effacer(objets);
    console.log(`${v} : ${objets.length} objets effacés`);
  }
}

async function main() {
  const cible = opt("--cible");
  const url = process.env.DEBROUSSAILLEMENT_SUPABASE_URL;
  const cle = process.env.DEBROUSSAILLEMENT_SUPABASE_CLE;
  verifierCible(cible, url, args.includes("--confirmer-production"));
  if (!cle) throw new Error("DEBROUSSAILLEMENT_SUPABASE_CLE manquante");
  const c = client(url, cle);
  if (commande === "envoyer") return envoyer(c, path.resolve(opt("--source") ?? ""));
  if (commande === "basculer") return basculer(c, opt("--edition") ?? "");
  if (commande === "purger") return purger(c, Number(opt("--garder", "2")));
  if (commande === "etat") return etat(c);
  throw new Error("commande : envoyer | basculer | purger | etat");
}

if (process.argv[1]?.endsWith("publier.mjs")) main().catch((e) => { console.error(String(e?.message ?? e)); process.exit(1); });
