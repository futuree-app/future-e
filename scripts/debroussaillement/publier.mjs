#!/usr/bin/env node
/**
 * publier.mjs (FUT-149) : publie une édition des tuiles du zonage du débroussaillement obligatoire sur Supabase
 * Storage, bascule l'application dessus, revient à une édition précédente, ou efface les éditions obsolètes.
 * Même patron que la fibre à l'adresse (FUT-156, `scripts/fibre-adresse/publier.mjs`).
 *
 * ── L'ORGANISATION DU BUCKET (privé) ─────────────────────────────────────────────────────────────────
 *   <édition>/t/<ix>_<iy>.json.gz      les tuiles, immuables (jamais réécrites)
 *   <édition>/manifest.json            le manifeste de l'édition (couverture, profils, tuiles et empreintes)
 *   courant.json                       LE POINTEUR : l'édition que lit l'application, et le SHA-256 de son manifeste
 *
 * ── LA PUBLICATION EST ATOMIQUE, ET UNE ÉDITION PUBLIÉE EST IMMUABLE (revue indépendante du 29/10/2026) ─────
 *  1. `envoyer` dépose les tuiles puis le manifeste sous le préfixe de l'édition. Il ne REMPLACE JAMAIS rien :
 *     - un manifeste déjà en ligne pour cette édition doit être identique à l'octet, sinon l'envoi est refusé
 *       avant toute écriture (c'est le cas d'une édition active qu'on tenterait de modifier) ;
 *     - une tuile déjà en ligne doit être identique (taille et SHA-256), sinon refus avant toute écriture ;
 *     - les dépôts se font sans écrasement (`x-upsert: false`) : même une course entre deux envois ne réécrit rien.
 *     Une reprise après interruption est donc idempotente : elle ne dépose que ce qui manque, et relit tout.
 *     Un contenu différent pour le même millésime IGN se publie sous une RÉVISION (`2026-03-01.2`, construite par
 *     `construire.py --revision 2`), c'est-à-dire sous un préfixe neuf.
 *  2. `basculer` vérifie que chaque tuile du manifeste est en ligne, avec la taille et le SHA-256 attendus, puis
 *     réécrit le pointeur `courant.json`, avec l'empreinte du manifeste vérifié. C'est la SEULE écriture qui
 *     remplace un objet, et la seule que l'application voit ; elle la lit dans les dix minutes.
 *  3. `basculer --edition <ancienne>` est le retour arrière : l'ancien préfixe est toujours là, inchangé.
 *  4. `purger` efface les éditions ni courantes ni parmi les `--garder` plus récentes (2 par défaut), dans l'ordre
 *     des dates puis des révisions (`2026-03-01.10` est plus récente que `2026-03-01.2`).
 *
 * ── NE JAMAIS RÉUTILISER UN IDENTIFIANT D'ÉDITION (contre-revue du 30/10/2026, R4) ─────────────────────
 *  Le protocole ne réécrit jamais une édition, mais rien n'empêche de la purger puis d'en publier une autre sous
 *  le même nom. L'application s'en protège : le pointeur porte l'empreinte du manifeste, et les tuiles gardées en
 *  mémoire sont indexées par la leur ; un contenu nouveau sous un ancien nom est donc relu, jamais mélangé.
 *  Le CDN, lui, peut garder l'ancienne tuile sous le même chemin (jusqu'à un jour, `max-age=86400`) : sa lecture
 *  échoue sur l'empreinte, et l'adresse est dite « indisponible » jusqu'à l'expiration. Un contenu nouveau prend
 *  donc TOUJOURS une révision neuve (`construire.py --revision N`), même après une purge.
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
import { EDITION, FORMAT_TUILES_DEBROUSSAILLEMENT, manifesteValide } from "../../src/lib/debroussaillement.ts";

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
      // Seul le pointeur se remplace : toute autre écriture se fait sans écrasement (édition immuable).
      if (remplacer && chemin !== "courant.json") throw new Error(`${chemin} : seul courant.json peut être remplacé`);
      // Tuiles et manifestes sont immuables : ils peuvent rester en cache. Le pointeur, seul objet remplacé, jamais.
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

/** Erreur de publication : l'envoi est refusé, rien n'a été écrit (ou seulement des tuiles absentes et vérifiées). */
export class RefusPublication extends Error {}

export async function envoyer(c, source) {
  const brutLocal = await fs.readFile(path.join(source, "manifest.json"));
  const m = JSON.parse(brutLocal.toString("utf8"));
  if (!manifesteValide(m)) throw new Error("manifeste local illisible");
  const fichiers = fichiersDuManifeste(m);
  // 1. Le manifeste en ligne, s'il existe, doit être celui-ci, à l'octet. Sinon : refus, AVANT toute écriture.
  const pointeur = await c.lire("courant.json");
  const active = pointeur ? JSON.parse(pointeur.toString("utf8")).edition : null;
  const distant = await c.lire(`${m.edition}/manifest.json`);
  if (distant && !distant.equals(brutLocal)) {
    throw new RefusPublication(`${m.edition} : déjà publiée avec un autre manifeste${active === m.edition ? " (c'est l'édition ACTIVE)" : ""} ; une édition publiée ne se modifie pas : reconstruire sous une révision (construire.py --revision N)`);
  }
  // 2. Les tuiles déjà en ligne doivent être identiques. Toutes sont vérifiées avant le premier dépôt.
  const deja = new Set((await c.lister(`${m.edition}/t/`)).map((o) => o.nom));
  for (const { chemin, attendu } of fichiers) verifierOctets(await fs.readFile(path.join(source, "t", path.basename(chemin))), attendu, chemin);
  await parallele(fichiers.filter(({ chemin }) => deja.has(path.basename(chemin))), async ({ chemin, attendu }) => {
    const b = await c.lire(chemin);
    if (!b || b.length !== attendu.octets || sha256(b) !== attendu.sha256) throw new RefusPublication(`${chemin} : déjà en ligne avec un autre contenu ; une édition publiée ne se modifie pas : reconstruire sous une révision`);
  });
  // 3. Dépôt de ce qui manque, sans écrasement, puis relecture de chaque octet.
  let envoyes = 0, octets = 0;
  const t0 = Date.now();
  await parallele(fichiers.filter(({ chemin }) => !deja.has(path.basename(chemin))), async ({ chemin, attendu }) => {
    const b = await fs.readFile(path.join(source, "t", path.basename(chemin)));
    await c.deposer(chemin, b, "application/gzip");
    envoyes++;
    octets += b.length;
    verifierOctets(await c.lire(chemin), attendu, chemin);
  });
  // 4. Le manifeste en dernier, sans écrasement : son absence signale un envoi inachevé, que la reprise complète.
  if (!distant) await c.deposer(`${m.edition}/manifest.json`, brutLocal, "application/json");
  const relu = await c.lire(`${m.edition}/manifest.json`);
  if (!relu || !relu.equals(brutLocal)) throw new Error(`${m.edition} : manifeste relu différent de celui envoyé`);
  console.log(JSON.stringify({ edition: m.edition, tuiles: fichiers.length, envoyes, octets, deja: deja.size, secondes: Math.round((Date.now() - t0) / 1000) }));
  return { envoyes, deja: deja.size };
}

export async function basculer(c, edition) {
  if (!EDITION.test(edition)) throw new Error(`édition invalide : ${edition}`);
  const brut = await c.lire(`${edition}/manifest.json`);
  if (!brut) throw new Error(`${edition} : aucun manifeste en ligne`);
  const m = JSON.parse(brut.toString("utf8"));
  if (!manifesteValide(m) || m.edition !== edition) throw new Error(`${edition} : manifeste invalide`);
  await parallele(fichiersDuManifeste(m), async ({ chemin, attendu }) => verifierOctets(await c.lire(chemin), attendu, chemin));
  const avant = await c.lire("courant.json");
  // L'empreinte du manifeste vérifié : l'application ne lira que celui-là (et le garde en mémoire par elle).
  await c.deposer("courant.json", Buffer.from(JSON.stringify({ format: FORMAT_TUILES_DEBROUSSAILLEMENT, edition, manifeste: sha256(brut) })), "application/json", true);
  console.log(`pointeur : ${avant ? JSON.parse(avant.toString("utf8")).edition : "(aucun)"} -> ${edition}`);
}

/**
 * L'ordre des éditions : par date, puis par révision (sans révision = 1). Un tri alphabétique plaçait
 * `2026-03-01.10` avant `2026-03-01.2`, et `purger` aurait effacé la plus récente.
 */
export function comparerEditions(a, b) {
  const [da, ra = "1"] = a.split(".");
  const [db, rb = "1"] = b.split(".");
  return da.localeCompare(db) || Number(ra) - Number(rb);
}

export async function etat(c) {
  const pointeur = await c.lire("courant.json");
  const editions = (await c.lister("")).filter((o) => EDITION.test(o.nom)).map((o) => o.nom).sort(comparerEditions);
  const detail = {};
  for (const v of editions) {
    const objets = await c.lister(`${v}/t/`);
    detail[v] = { tuiles: objets.length, octets: objets.reduce((s, o) => s + (o.octets ?? 0), 0) };
  }
  const courant = pointeur ? JSON.parse(pointeur.toString("utf8")).edition : null;
  console.log(JSON.stringify({ courant, editions: detail }, null, 1));
  return { courant, editions };
}

export async function purger(c, garder) {
  const { courant, editions } = await etat(c);
  if (!Number.isSafeInteger(garder) || garder < 1) throw new Error("--garder : un entier, au moins 1");
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
