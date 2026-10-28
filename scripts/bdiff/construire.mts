// FUT-147 · Construit `data/bdiff-incendies.json` depuis les exports BDIFF collectés par
// `scripts/bdiff/telecharger.mjs` et le référentiel communal de l'Insee. Toute la règle vit dans
// `src/lib/data/bdiff-incendies.ts` (pur, testé) ; ce script ne fait que lire, vérifier et écrire.
//
//   node scripts/bdiff/telecharger.mjs                       # exports 2006-2025 dans data/source/bdiff/
//   curl -o data/source/bdiff/cog/v_commune_2025.csv     https://www.insee.fr/fr/statistiques/fichier/8377162/v_commune_2025.csv
//   curl -o data/source/bdiff/cog/v_mvt_commune_2025.csv https://www.insee.fr/fr/statistiques/fichier/8377162/v_mvt_commune_2025.csv
//   node scripts/bdiff/construire.mts [--cache data/source/bdiff] [--de 2006] [--a 2025]
//
// REFUSE (exit 1) : une campagne manquante ou dont l'empreinte ne correspond plus au manifeste, un export
// incohérent (cf. `construireTableIncendies`), un code rattaché absent du référentiel. Écriture atomique.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  construireTableIncendies, resolveurCog, type CampagneAConstruire, type MouvementCog,
} from "../../src/lib/data/bdiff-incendies.ts";

const arg = (nom: string, defaut: string): string => {
  const i = process.argv.indexOf(`--${nom}`);
  return i > 0 ? process.argv[i + 1]! : defaut;
};
const die = (m: string): never => {
  console.error(`REFUS: ${m}`);
  process.exit(1);
};
const sha256 = (b: Buffer): string => createHash("sha256").update(b).digest("hex");

const CACHE = arg("cache", "data/source/bdiff");
const DE = Number(arg("de", "2006"));
const A = Number(arg("a", "2025"));
const SORTIE = path.join(process.cwd(), "data", "bdiff-incendies.json");

// CSV de l'Insee : virgules, champs entre guillemets, sans virgule interne dans les colonnes lues.
function lireCsvInsee(fichier: string): Record<string, string>[] {
  const lignes = readFileSync(fichier, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  const entete = lignes[0]!.split(",").map((c) => c.replace(/"/g, ""));
  return lignes.slice(1).map((l) => {
    const v = l.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.map((x) => x.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"'));
    return Object.fromEntries(entete.map((c, k) => [c, v[k] ?? ""]));
  });
}

const fichierManifeste = path.join(CACHE, "manifeste.json");
if (!existsSync(fichierManifeste)) die(`${fichierManifeste} absent : lancer scripts/bdiff/telecharger.mjs`);
const manifeste = JSON.parse(readFileSync(fichierManifeste, "utf8")) as {
  source: string;
  annees: Record<string, { luLe: string; sha256: string; campagnesInconnues: string[] }>;
};

const campagnes: CampagneAConstruire[] = [];
for (let annee = DE; annee <= A; annee++) {
  const m = manifeste.annees[annee];
  const fichier = path.join(CACHE, `bdiff-${annee}.csv`);
  if (!m || !existsSync(fichier)) die(`campagne ${annee} absente du cache`);
  const brut = readFileSync(fichier);
  if (sha256(brut) !== m!.sha256) die(`campagne ${annee} : le CSV ne correspond plus au manifeste`);
  campagnes.push({ annee, texte: brut.toString("utf8"), departementsInconnus: m!.campagnesInconnues, sha256: m!.sha256, luLe: m!.luLe });
}

const fichierCommunes = path.join(CACHE, "cog", "v_commune_2025.csv");
const fichierMouvements = path.join(CACHE, "cog", "v_mvt_commune_2025.csv");
if (!existsSync(fichierCommunes) || !existsSync(fichierMouvements)) die("référentiel Insee absent (voir l'en-tête du script)");
const lignesCommunes = lireCsvInsee(fichierCommunes).filter((r) => r.TYPECOM === "COM");
const communes = new Set(lignesCommunes.map((r) => r.COM!));
const libelles = new Map(lignesCommunes.map((r) => [r.COM!, r.LIBELLE!]));
if (communes.size < 34_000) die(`référentiel Insee incomplet : ${communes.size} communes`);
const mouvements = lireCsvInsee(fichierMouvements) as unknown as MouvementCog[];

let table;
try {
  table = construireTableIncendies({
    campagnes,
    resoudre: resolveurCog(communes, mouvements),
    nomActuel: (insee) => libelles.get(insee),
    meta: {
      source: manifeste.source,
      cog: { millesime: "COG 2025", mouvementsSha256: sha256(readFileSync(fichierMouvements)) },
      licence: {
        ficheDataGouv: "Licence Ouverte 2.0 (lov2), https://www.data.gouv.fr/datasets/base-de-donnees-sur-les-incendies-de-forets-en-france-bdiff, lue le 28/10/2026",
        mentionExport: "Mentions légales jointes à l'export, § 7 : « Toutes diffusions ou utilisations à des fins commerciales ou publicitaires sont exclues. »",
        decision: "Le porteur retient la Licence Ouverte 2.0 de la fiche data.gouv.fr comme base de réutilisation (28/10/2026), et en assume la justification. Source citée : bdiff.agriculture.gouv.fr.",
      },
    },
  });
} catch (e) {
  die(e instanceof Error ? e.message : String(e));
}
for (const insee of Object.keys(table!.communes)) if (!communes.has(insee)) die(`${insee} rattaché hors référentiel`);

const tmp = `${SORTIE}.${process.pid}.tmp`;
writeFileSync(tmp, `${JSON.stringify(table)}\n`);
renameSync(tmp, SORTIE);
const t = table!;
const feux = Object.values(t.communes).reduce((s, e) => s + e.nombre, 0);
console.log(`bdiff-incendies : ${Object.keys(t.communes).length} communes, ${feux} feux rattachés (${t.meta.periode}).`);
console.log(`non rattachés : ${t.meta.nonRattachees.map((n) => `${n.code} ${n.nom} (${n.feux})`).join(", ") || "aucun"} ; doublons retirés : ${t.meta.doublonsRetires}.`);
console.log(`départements sans fiche : ${t.meta.departementsSansFiche.join(", ") || "aucun"}.`);
