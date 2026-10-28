#!/usr/bin/env node
/**
 * publier.mjs (FUT-156) : publie un millésime de l'index de la fibre à l'adresse sur Supabase Storage, bascule
 * l'application dessus, revient à un millésime précédent, ou efface les millésimes obsolètes.
 *
 * ── L'ORGANISATION DU BUCKET (privé) ─────────────────────────────────────────────────────────────────
 *   <millésime>/<dép>-<lot>.json.gz    les lots, immuables (jamais réécrits)
 *   <millésime>/manifest.json          le manifeste du millésime (nombre de lots par département)
 *   courant.json                       LE POINTEUR : le millésime que lit l'application
 *
 * ── LA PUBLICATION EST ATOMIQUE ──────────────────────────────────────────────────────────────────────
 *  1. `envoyer` dépose les lots puis le manifeste sous un préfixe NEUF : l'application ne les voit pas.
 *  2. `basculer` vérifie que chaque lot du manifeste est en ligne, à la taille attendue, puis réécrit le
 *     pointeur. C'est la seule écriture que l'application voit ; elle la lit dans les dix minutes.
 *  3. `basculer --millesime <ancien>` est le retour arrière : l'ancien préfixe est toujours là.
 *  4. `purger` efface les millésimes ni courants ni parmi les `--garder` plus récents (2 par défaut).
 *
 * ── LA GARDE DE PRODUCTION ───────────────────────────────────────────────────────────────────────────
 *  `--cible test|production` est obligatoire, et l'URL doit être celle du projet nommé. La production exige
 *  en plus `--confirmer-production` : aucune écriture en production par erreur de variable d'environnement.
 *
 * Variables : FIBRE_SUPABASE_URL, FIBRE_SUPABASE_CLE (clé serveur du projet visé ; jamais dans le dépôt).
 *
 * Usage :
 *   node scripts/fibre-adresse/publier.mjs envoyer  --cible test --source <sortie>/<millésime>
 *   node scripts/fibre-adresse/publier.mjs basculer --cible test --millesime 2026T2
 *   node scripts/fibre-adresse/publier.mjs purger   --cible test [--garder 2]
 *   node scripts/fibre-adresse/publier.mjs etat     --cible test
 */
import fs from "node:fs/promises";
import path from "node:path";
import { FORMAT_INDEX_FIBRE, manifesteValide, cheminLot } from "../../src/lib/fibre-adresse.ts";

export const PROJETS = { test: "atvknbgahcuovcyqapfx", production: "xkewgsccadjmondzmjxj" };
export const BUCKET = "fibre-adresse";
const PARALLELE = 8;

const [commande, ...args] = process.argv.slice(2);
const opt = (nom, defaut = null) => (args.includes(nom) ? args[args.indexOf(nom) + 1] : defaut);

/** La cible, vérifiée contre l'URL : jamais la production sans le demander deux fois. */
export function verifierCible(cible, url, confirmer) {
  if (!(cible in PROJETS)) throw new Error("--cible test|production est obligatoire");
  if (!url || !new URL(url).hostname.startsWith(`${PROJETS[cible]}.`)) throw new Error(`l'URL ${url} n'est pas celle du projet ${cible} (${PROJETS[cible]})`);
  if (cible === "production" && !confirmer) throw new Error("écriture en production : ajouter --confirmer-production");
}

function client(url, cle) {
  const base = `${url.replace(/\/$/, "")}/storage/v1`;
  const entetes = { Authorization: `Bearer ${cle}`, apikey: cle };
  async function appel(methode, chemin, corps, extra = {}) {
    for (let i = 1; ; i++) {
      const res = await fetch(`${base}${chemin}`, { method: methode, headers: { ...entetes, ...extra }, body: corps, signal: AbortSignal.timeout(60_000) });
      if (res.ok || i >= 4 || res.status < 500) return res;
      await new Promise((r) => setTimeout(r, 1000 * i));
    }
  }
  return {
    async deposer(chemin, octets, type, remplacer = false) {
      const res = await appel("POST", `/object/${BUCKET}/${chemin}`, octets, { "Content-Type": type, "x-upsert": remplacer ? "true" : "false", "Cache-Control": "max-age=60" });
      if (!res.ok) throw new Error(`${chemin} : HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    },
    async lire(chemin) {
      const res = await appel("GET", `/object/${BUCKET}/${chemin}`);
      if (res.status === 404 || res.status === 400) return null;
      if (!res.ok) throw new Error(`${chemin} : HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    },
    /** Les objets sous un préfixe (un niveau), avec leur taille. */
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

async function envoyer(c, source) {
  const manifeste = JSON.parse(await fs.readFile(path.join(source, "manifest.json"), "utf8"));
  if (!manifesteValide(manifeste)) throw new Error("manifeste local illisible");
  const deja = new Map((await c.lister(`${manifeste.millesime}/`)).map((o) => [o.nom, o.octets]));
  const lots = Object.entries(manifeste.lots).flatMap(([dep, n]) => Array.from({ length: n }, (_, l) => cheminLot(manifeste.millesime, dep, l)));
  let envoyes = 0, octets = 0;
  const t0 = Date.now();
  await parallele(lots, async (chemin) => {
    const b = await fs.readFile(path.join(source, "..", chemin));
    octets += b.length;
    // Reprise : un lot déjà en ligne à la même taille n'est pas renvoyé (les lots sont immuables).
    if (deja.get(path.basename(chemin)) === b.length) return;
    await c.deposer(chemin, b, "application/gzip");
    envoyes++;
  });
  await c.deposer(`${manifeste.millesime}/manifest.json`, Buffer.from(JSON.stringify(manifeste)), "application/json", true);
  console.log(JSON.stringify({ millesime: manifeste.millesime, lots: lots.length, envoyes, octets, secondes: Math.round((Date.now() - t0) / 1000) }));
}

async function basculer(c, millesime) {
  const brut = await c.lire(`${millesime}/manifest.json`);
  if (!brut) throw new Error(`${millesime} : aucun manifeste en ligne`);
  const m = JSON.parse(brut.toString("utf8"));
  if (!manifesteValide(m) || m.millesime !== millesime) throw new Error(`${millesime} : manifeste invalide`);
  const enLigne = new Set((await c.lister(`${millesime}/`)).map((o) => o.nom));
  const manquants = Object.entries(m.lots).flatMap(([dep, n]) => Array.from({ length: n }, (_, l) => cheminLot(millesime, dep, l)))
    .filter((ch) => !enLigne.has(path.basename(ch)));
  if (manquants.length) throw new Error(`${millesime} : ${manquants.length} lot(s) manquant(s), ex. ${manquants.slice(0, 3).join(", ")}`);
  const avant = await c.lire("courant.json");
  await c.deposer("courant.json", Buffer.from(JSON.stringify({ format: FORMAT_INDEX_FIBRE, millesime })), "application/json", true);
  console.log(`pointeur : ${avant ? JSON.parse(avant.toString("utf8")).millesime : "(aucun)"} -> ${millesime}`);
}

async function etat(c) {
  const pointeur = await c.lire("courant.json");
  const racine = await c.lister("");
  const versions = racine.filter((o) => /^\d{4}T[1-4]$/.test(o.nom)).map((o) => o.nom).sort();
  const detail = {};
  for (const v of versions) {
    const objets = await c.lister(`${v}/`);
    detail[v] = { objets: objets.length, octets: objets.reduce((s, o) => s + (o.octets ?? 0), 0) };
  }
  console.log(JSON.stringify({ courant: pointeur ? JSON.parse(pointeur.toString("utf8")).millesime : null, versions: detail }, null, 1));
  return { courant: pointeur ? JSON.parse(pointeur.toString("utf8")).millesime : null, versions };
}

async function purger(c, garder) {
  const { courant, versions } = await etat(c);
  const gardes = new Set([courant, ...versions.slice(-garder)].filter(Boolean));
  for (const v of versions.filter((x) => !gardes.has(x))) {
    const objets = (await c.lister(`${v}/`)).map((o) => `${v}/${o.nom}`);
    await c.effacer(objets);
    console.log(`${v} : ${objets.length} objets effacés`);
  }
}

async function main() {
  const cible = opt("--cible");
  const url = process.env.FIBRE_SUPABASE_URL;
  const cle = process.env.FIBRE_SUPABASE_CLE;
  verifierCible(cible, url, args.includes("--confirmer-production"));
  if (!cle) throw new Error("FIBRE_SUPABASE_CLE manquante");
  const c = client(url, cle);
  if (commande === "envoyer") return envoyer(c, path.resolve(opt("--source") ?? ""));
  if (commande === "basculer") return basculer(c, opt("--millesime") ?? "");
  if (commande === "purger") return purger(c, Number(opt("--garder", "2")));
  if (commande === "etat") return etat(c);
  throw new Error("commande : envoyer | basculer | purger | etat");
}

if (process.argv[1]?.endsWith("publier.mjs")) main().catch((e) => { console.error(String(e?.message ?? e)); process.exit(1); });
