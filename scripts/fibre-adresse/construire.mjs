#!/usr/bin/env node
/**
 * construire.mjs (FUT-156) : construit l'index trimestriel de la fibre à l'adresse, hors de l'application.
 *
 * ── CE QUI EST TÉLÉCHARGÉ, ET CE QUI EST GARDÉ ────────────────────────────────────────────────────────
 *  - `Immeuble` (cartefibre, 835 Mo, national) : lu en flux, jamais écrit ; seuls restent, par département,
 *    `imb_id <tab> état` (≈ 120 Mo compressés pour la France), réutilisés si on relance.
 *  - Par département, l'un après l'autre : `base_imb` et `actuel` (Ma connexion internet) et la BAN.
 *    Téléchargés, vérifiés (taille publiée), construits, puis EFFACÉS (sauf `--garder-sources`). Le disque
 *    n'en porte jamais plus d'un département à la fois.
 *  - Ce qui reste : les lots (`<sortie>/<millésime>/<dép>-<lot>.json.gz`), le manifeste et le rapport.
 *
 * ── REPRISE ──────────────────────────────────────────────────────────────────────────────────────────
 *  Chaque département terminé écrit `<sortie>/<millésime>/_departements/<dép>.json` (statistiques, lots et
 *  leurs empreintes). Une relance saute les départements terminés et reprend les téléchargements partiels.
 *
 * ── CONTRÔLES (la construction s'arrête plutôt que d'écrire un index faux) ───────────────────────────
 *  - Les trois jeux Arcep sont du MÊME trimestre (lu dans les pages officielles, pas dans les URL).
 *  - Chaque fichier a la taille publiée ; `Immeuble` a le SHA-1 publié.
 *  - Aucune valeur inconnue d'état, de source d'immeuble ou de technologie.
 *  - Au moins 99,5 % des immeubles fibre de `base_imb` ont un état dans `Immeuble` (jointure IPE).
 *  - Avec `--precedent <rapport.json>` : la part d'adresses rattachées avec un état ne varie pas de plus de
 *    5 points par département d'un trimestre à l'autre, sauf `--accepter-ecarts`.
 *
 * Usage :
 *   node scripts/fibre-adresse/construire.mjs --cache <dossier> --sortie <dossier>
 *        [--trimestre last|2026_T2] [--departements 17,33] [--garder-sources]
 *        [--precedent <rapport.json>] [--accepter-ecarts] [--lot-brut <octets>]
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { catalogueMci, referentielOperateurs, ressourceBan, ressourceImmeuble, telecharger } from "./sources.mjs";
import { extraireImmeuble, extraitDepartement } from "./immeuble.mjs";
import { construireDepartement, decouper } from "./departement.mjs";
import { cheminLot, FORMAT_INDEX_FIBRE, finDeTrimestre } from "../../src/lib/fibre-adresse.ts";

const args = process.argv.slice(2);
const opt = (nom, defaut = null) => (args.includes(nom) ? args[args.indexOf(nom) + 1] : defaut);
const CACHE = path.resolve(opt("--cache") ?? fail("--cache requis"));
const SORTIE = path.resolve(opt("--sortie") ?? fail("--sortie requis"));
const TRIMESTRE = opt("--trimestre", "last");
const DEPS = opt("--departements");
const GARDER = args.includes("--garder-sources");
const PRECEDENT = opt("--precedent");
const ACCEPTER_ECARTS = args.includes("--accepter-ecarts");
/** Taille visée d'un lot, JSON brut. Environ cinq fois moins une fois compressé. */
const LOT_BRUT = Number(opt("--lot-brut", String(320_000)));
const JOINTURE_MIN = 0.995;
const ECART_MAX_POINTS = 5;

function fail(m) { console.error(m); process.exit(2); }
const sha256 = (b) => createHash("sha256").update(b).digest("hex");

/** Pour la comparaison des organisations : la taille compressée de chaque commune prise seule. */
function tailleParCommune(communes) {
  return Object.values(communes).map((c) => gzipSync(JSON.stringify(c), { level: 9 }).length);
}

async function main() {
  const t0 = Date.now();
  // 1. Le millésime, lu dans les trois publications.
  const [imbCat, eligCat] = await Promise.all([catalogueMci("base_imb", TRIMESTRE), catalogueMci("eligibilite", TRIMESTRE)]);
  if (imbCat.millesime !== eligCat.millesime) throw new Error(`base_imb (${imbCat.millesime}) et actuel (${eligCat.millesime}) ne sont pas du même trimestre`);
  const millesime = imbCat.millesime;
  const immeuble = await ressourceImmeuble(millesime); // échoue si cartefibre n'a pas encore publié ce trimestre
  if (!immeuble.sha1) console.warn("Immeuble : aucun SHA-1 publié, seule la taille sera vérifiée");
  const referentiel = await referentielOperateurs(millesime);
  const donneesAu = finDeTrimestre(millesime);
  console.log(`millésime ${millesime} (données au ${donneesAu})`);

  const cache = path.join(CACHE, millesime);
  const sortie = path.join(SORTIE, millesime);
  const etatsDeps = path.join(sortie, "_departements");
  await fsp.mkdir(etatsDeps, { recursive: true });

  // 2. Le fichier national des états, une seule fois.
  const imm = await extraireImmeuble(immeuble, cache);
  console.log(`Immeuble : ${imm.lignes} lignes, ${imm.illisibles} illisibles, ${imm.relues} relues par la droite${imm.cache ? " (cache)" : `, ${imm.secondes} s`}`);

  // 3. Les départements, un par un.
  const tous = Object.keys(imbCat.fichiers).filter((d) => d in eligCat.fichiers).sort();
  const deps = DEPS ? DEPS.split(",").map((d) => d.trim()) : tous;
  for (const d of deps) if (!tous.includes(d)) throw new Error(`département ${d} absent des publications du trimestre`);
  const precedent = PRECEDENT ? JSON.parse(await fsp.readFile(PRECEDENT, "utf8")) : null;

  for (const dep of deps) {
    const fait = path.join(etatsDeps, `${dep}.json`);
    if (fs.existsSync(fait)) { console.log(`${dep} : déjà construit`); continue; }
    const td = Date.now();
    const banSource = await ressourceBan(dep);
    if (!banSource) { console.warn(`${dep} : la BAN ne publie pas ce département, ignoré`); continue; }
    const src = path.join(cache, "sources", dep);
    const [mBase, mActuel, mBan] = await Promise.all([
      telecharger(imbCat.fichiers[dep], path.join(src, `base_imb_${dep}.csv.gz`)),
      telecharger(eligCat.fichiers[dep], path.join(src, `actuel_${dep}.csv.gz`)),
      telecharger(banSource, path.join(src, `adresses-${dep}.csv.gz`)),
    ]);
    const { communes, stats } = await construireDepartement({
      extraitImmeuble: extraitDepartement(cache, dep),
      baseImb: path.join(src, `base_imb_${dep}.csv.gz`),
      actuel: path.join(src, `actuel_${dep}.csv.gz`),
      ban: path.join(src, `adresses-${dep}.csv.gz`),
      referentiel,
    });
    const jointure = stats.immeublesFibre ? 1 - stats.immeublesFibreSansEtat / stats.immeublesFibre : 1;
    if (jointure < JOINTURE_MIN) throw new Error(`${dep} : jointure IPE ${(100 * jointure).toFixed(2)} % < ${100 * JOINTURE_MIN} %`);
    const avecEtat = ["D", "R", "Q", "E", "C", "S"].reduce((s, k) => s + (stats.parCode[k] ?? 0), 0);
    const part = stats.adresses ? avecEtat / stats.adresses : 0;
    const avant = precedent?.departements?.[dep]?.partAvecEtat;
    if (avant != null && Math.abs(100 * (part - avant)) > ECART_MAX_POINTS && !ACCEPTER_ECARTS) {
      throw new Error(`${dep} : part d'adresses avec un état ${(100 * avant).toFixed(1)} % -> ${(100 * part).toFixed(1)} %, écart supérieur à ${ECART_MAX_POINTS} points (--accepter-ecarts pour passer outre)`);
    }
    const lots = decouper(communes, dep, millesime, LOT_BRUT);
    const fichiersLots = [];
    for (const lot of lots) {
      const gz = gzipSync(JSON.stringify(lot), { level: 9 });
      const rel = cheminLot(millesime, dep, lot.lot);
      const f = path.join(SORTIE, rel);
      await fsp.mkdir(path.dirname(f), { recursive: true });
      await fsp.writeFile(`${f}.tmp`, gz);
      await fsp.rename(`${f}.tmp`, f);
      fichiersLots.push({ chemin: rel, octets: gz.length, sha256: sha256(gz), communes: Object.keys(lot.communes).length });
    }
    const parCommune = tailleParCommune(communes).sort((a, b) => a - b);
    const bilan = {
      departement: dep, millesime, secondes: Math.round((Date.now() - td) / 1000), jointureIpe: jointure, partAvecEtat: part,
      sources: { base_imb: mBase, actuel: mActuel, ban: mBan },
      stats, lots: fichiersLots,
      parCommune: { objets: parCommune.length, octets: parCommune.reduce((s, x) => s + x, 0), mediane: parCommune[Math.floor(parCommune.length / 2)] ?? 0, max: parCommune.at(-1) ?? 0 },
    };
    await fsp.writeFile(`${fait}.tmp`, JSON.stringify(bilan, null, 1));
    await fsp.rename(`${fait}.tmp`, fait);
    if (!GARDER) await fsp.rm(src, { recursive: true, force: true });
    console.log(`${dep} : ${stats.adresses} adresses, ${(100 * part).toFixed(1)} % avec un état, ${lots.length} lot(s), ${fichiersLots.reduce((s, l) => s + l.octets, 0)} o, ${bilan.secondes} s`);
  }

  // 4. Le manifeste et le rapport, à partir des départements terminés (ceux d'une relance compris).
  const bilans = {};
  for (const f of (await fsp.readdir(etatsDeps)).filter((x) => x.endsWith(".json"))) {
    const b = JSON.parse(await fsp.readFile(path.join(etatsDeps, f), "utf8"));
    bilans[b.departement] = b;
  }
  const manifeste = { format: FORMAT_INDEX_FIBRE, millesime, donneesAu, lots: Object.fromEntries(Object.entries(bilans).sort().map(([d, b]) => [d, b.lots.length])) };
  manifeste.empreintes = Object.fromEntries(Object.values(bilans).flatMap((b) => b.lots.map((l) => [l.chemin, { octets: l.octets, sha256: l.sha256 }])));
  await fsp.writeFile(path.join(sortie, "manifest.json"), JSON.stringify(manifeste));
  const rapport = {
    millesime, donneesAu, construitLe: new Date().toISOString(), secondes: Math.round((Date.now() - t0) / 1000),
    sources: { immeuble: { url: immeuble.url, sha1: imm.sha1, taille: immeuble.taille, lignes: imm.lignes, illisibles: imm.illisibles, etats: imm.etats } },
    departements: Object.fromEntries(Object.entries(bilans).sort().map(([d, b]) => [d, {
      adresses: b.stats.adresses, partAvecEtat: b.partAvecEtat, jointureIpe: b.jointureIpe, parCode: b.stats.parCode,
      parRattachement: b.stats.parRattachement, operateurs: b.stats.operateurs, lots: b.lots.length,
      octetsLots: b.lots.reduce((s, l) => s + l.octets, 0), parCommune: b.parCommune,
      pseudoOperateurs: b.stats.pseudoOperateurs, operateursHorsReferentiel: b.stats.operateursHorsReferentiel,
      lignesFibreEnDouble: b.stats.lignesFibreEnDouble, immeubleConflits: b.stats.immeubleConflits,
    }])),
  };
  await fsp.writeFile(path.join(sortie, "rapport.json"), JSON.stringify(rapport, null, 1));
  console.log(`manifeste : ${Object.keys(manifeste.lots).length} départements, ${Object.values(manifeste.lots).reduce((s, n) => s + n, 0)} lots`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("construire.mjs")) {
  main().catch((e) => { console.error(String(e?.stack ?? e)); process.exit(1); });
}
