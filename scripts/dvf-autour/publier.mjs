#!/usr/bin/env node
/**
 * publier.mjs (FUT-138, échelle Logement) : publie une édition des tuiles des ventes autour d'une adresse sur
 * Supabase Storage (bucket PRIVÉ `prix-autour`), puis bascule l'application dessus. Même protocole que le
 * débroussaillement (scripts/debroussaillement/publier.mjs, revue indépendante du 29/10/2026), en plus court :
 *
 *   <édition>/t/<tx>_<ty>.json.gz    les tuiles, immuables (dépôt sans écrasement, relues octet par octet)
 *   <édition>/c/<dép>.json.gz        la référence communale par département (champ `achat` de l'index), immuable
 *   <édition>/b/<bx>_<by>.json       les index de bloc (tuiles et empreintes), déposés après leurs tuiles
 *   <édition>/manifest.json          déposé en DERNIER : son absence signale un envoi inachevé, que la reprise complète
 *   courant.json                     LE POINTEUR (édition + SHA-256 du manifeste) : la seule écriture qui remplace,
 *                                    la seule que l'application voit, dans les dix minutes
 *
 * Une édition publiée ne se modifie jamais : un contenu différent se reconstruit sous une révision
 * (`construire.mjs --revision 2`). Retour arrière : `basculer --edition <ancienne>`.
 *
 * GARDE DE PRODUCTION : `--cible test|production` obligatoire, URL vérifiée contre le projet nommé, et
 * `--confirmer-production` pour la production. Le bucket n'est jamais créé ici : il se crée (privé) à la main.
 * RIEN N'EST PUBLIÉ SANS LE GO FINAL DU PORTEUR (brief FUT-138).
 *
 * Variables : PRIX_AUTOUR_SUPABASE_URL, PRIX_AUTOUR_SUPABASE_CLE (clé serveur du projet visé).
 *
 *   node scripts/dvf-autour/publier.mjs envoyer  --cible test --source data/cache-logement/dvf-autour/2026-10-20
 *   node scripts/dvf-autour/publier.mjs basculer --cible test --edition 2026-10-20
 *   node scripts/dvf-autour/publier.mjs etat     --cible test
 */
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { blocValide, FORMAT_PRIX_AUTOUR, manifesteValide } from "../../src/lib/prix-autour.ts";

// Recopiés de scripts/debroussaillement/publier.mjs plutôt qu'importés : ce module lance son `main` dès que le script
// exécuté s'appelle « publier.mjs », ce qui serait le cas ici.
export const PROJETS = { test: "atvknbgahcuovcyqapfx", production: "xkewgsccadjmondzmjxj" };
export function verifierCible(cible, url, confirmer) {
  if (!(cible in PROJETS)) throw new Error("--cible test|production est obligatoire");
  if (!url || !new URL(url).hostname.startsWith(`${PROJETS[cible]}.`)) throw new Error(`l'URL ${url} n'est pas celle du projet ${cible} (${PROJETS[cible]})`);
  if (cible === "production" && !confirmer) throw new Error("écriture en production : ajouter --confirmer-production");
}

export const BUCKET = "prix-autour";
const PARALLELE = 8;
const EDITION = /^\d{4}-\d{2}-\d{2}(\.\d+)?$/;
const sha256 = (b) => createHash("sha256").update(b).digest("hex");

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
      if (remplacer && chemin !== "courant.json") throw new Error(`${chemin} : seul courant.json peut être remplacé`);
      const res = await appel("POST", `/object/${BUCKET}/${chemin}`, octets, {
        "Content-Type": type, "x-upsert": remplacer ? "true" : "false", "Cache-Control": remplacer ? "no-cache" : "max-age=86400",
      });
      if (!res.ok) throw new Error(`${chemin} : HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    },
    async lire(chemin) {
      const res = await appel("GET", `/object/${BUCKET}/${chemin}?cacheNonce=${Date.now()}`);
      if (res.status === 404 || res.status === 400) return null;
      if (!res.ok) throw new Error(`${chemin} : HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    },
  };
}

async function parallele(elements, f) {
  let i = 0;
  await Promise.all(Array.from({ length: PARALLELE }, async () => { while (i < elements.length) await f(elements[i++]); }));
}

/**
 * Les fichiers de l'édition, vérifiés : chaque index de bloc est lu (`lireOctets`, local ou distant), contrôlé contre
 * l'empreinte du manifeste, puis ses tuiles sont listées. Ordre de dépôt : tuiles, fichiers communaux, index de bloc ;
 * le manifeste vient après tout le reste (dans `envoyer`).
 */
export async function fichiersDeLEdition(m, lireOctets) {
  const tuiles = [], blocs = [], communes = [];
  for (const [kb, eb] of Object.entries(m.blocs)) {
    const chemin = `${m.edition}/b/${kb}.json`;
    const brut = await lireOctets(chemin);
    verifierOctets(brut, eb, chemin);
    const b = JSON.parse(brut.toString("utf8"));
    if (!blocValide(b, { edition: m.edition, bloc: kb })) throw new Error(`intégrité : bloc ${kb} invalide`);
    blocs.push({ chemin, attendu: eb });
    for (const [kt, et] of Object.entries(b.tuiles)) tuiles.push({ chemin: `${m.edition}/t/${kt}.json.gz`, attendu: et });
  }
  for (const [dep, e] of Object.entries(m.communes)) communes.push({ chemin: `${m.edition}/c/${dep}.json.gz`, attendu: e });
  return [...tuiles, ...communes, ...blocs];
}

function verifierOctets(b, attendu, chemin) {
  if (!b || b.length !== attendu.octets || sha256(b) !== attendu.sha256) throw new Error(`intégrité : ${chemin}, taille ou SHA-256 différent de la construction`);
}

export async function envoyer(c, source) {
  const brut = await fs.readFile(path.join(source, "manifest.json"));
  const m = JSON.parse(brut.toString("utf8"));
  if (!manifesteValide(m) || !EDITION.test(m.edition)) throw new Error("manifeste local illisible");
  const distant = await c.lire(`${m.edition}/manifest.json`);
  if (distant && !distant.equals(brut)) throw new Error(`${m.edition} : un autre manifeste est déjà en ligne ; reconstruire sous une révision`);
  const local = (chemin) => fs.readFile(path.join(source, chemin.slice(m.edition.length + 1)));
  const fichiers = await fichiersDeLEdition(m, local);
  let envoyes = 0, deja = 0, octets = 0;
  // Les index de bloc en dernier (avant le manifeste) : un bloc en ligne garantit que ses tuiles le sont.
  const blocs = fichiers.filter((x) => x.chemin.includes("/b/"));
  await parallele(fichiers.filter((x) => !x.chemin.includes("/b/")), envoyer1);
  await parallele(blocs, envoyer1);
  async function envoyer1({ chemin, attendu }) {
    const local = await fs.readFile(path.join(source, chemin.slice(m.edition.length + 1)));
    verifierOctets(local, attendu, chemin);
    const enLigne = await c.lire(chemin);
    if (enLigne) { verifierOctets(enLigne, attendu, chemin); deja++; return; }
    await c.deposer(chemin, local, chemin.endsWith(".gz") ? "application/gzip" : "application/json");
    verifierOctets(await c.lire(chemin), attendu, chemin);
    envoyes++; octets += local.length;
  }
  if (!distant) await c.deposer(`${m.edition}/manifest.json`, brut, "application/json");
  const relu = await c.lire(`${m.edition}/manifest.json`);
  if (!relu?.equals(brut)) throw new Error(`${m.edition} : manifeste relu différent de celui envoyé`);
  console.log(JSON.stringify({ edition: m.edition, fichiers: fichiers.length, envoyes, deja, octets }));
}

export async function basculer(c, edition) {
  if (!EDITION.test(edition)) throw new Error(`édition invalide : ${edition}`);
  const brut = await c.lire(`${edition}/manifest.json`);
  if (!brut) throw new Error(`${edition} : aucun manifeste en ligne`);
  const m = JSON.parse(brut.toString("utf8"));
  if (!manifesteValide(m) || m.edition !== edition) throw new Error(`${edition} : manifeste invalide`);
  const fichiers = await fichiersDeLEdition(m, (chemin) => c.lire(chemin));
  await parallele(fichiers, async ({ chemin, attendu }) => verifierOctets(await c.lire(chemin), attendu, chemin));
  const avant = await c.lire("courant.json");
  await c.deposer("courant.json", Buffer.from(JSON.stringify({ format: FORMAT_PRIX_AUTOUR, edition, manifeste: sha256(brut) })), "application/json", true);
  console.log(`pointeur : ${avant ? JSON.parse(avant.toString("utf8")).edition : "(aucun)"} -> ${edition}`);
}

async function main() {
  const [commande, ...args] = process.argv.slice(2);
  const opt = (nom) => (args.includes(nom) ? args[args.indexOf(nom) + 1] : null);
  const url = process.env.PRIX_AUTOUR_SUPABASE_URL;
  const cle = process.env.PRIX_AUTOUR_SUPABASE_CLE;
  verifierCible(opt("--cible"), url, args.includes("--confirmer-production"));
  if (!cle) throw new Error("PRIX_AUTOUR_SUPABASE_CLE manquante");
  const c = client(url, cle);
  if (commande === "envoyer") return envoyer(c, path.resolve(opt("--source") ?? ""));
  if (commande === "basculer") return basculer(c, opt("--edition") ?? "");
  if (commande === "etat") {
    const p = await c.lire("courant.json");
    return console.log(p ? p.toString("utf8") : "(aucun pointeur)");
  }
  throw new Error(`commande : envoyer | basculer | etat (projets : ${Object.keys(PROJETS).join(", ")})`);
}

if (process.argv[1]?.endsWith(path.join("dvf-autour", "publier.mjs"))) main().catch((e) => { console.error(String(e?.message ?? e)); process.exit(1); });
