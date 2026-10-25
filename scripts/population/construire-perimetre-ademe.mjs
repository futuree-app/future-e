#!/usr/bin/env node
// FUT-109 · Construit `data/perimetre-ademe-cog2025.json` : la géographie de chaque champ ADEME `data_communes`
// que lisent l'index et l'application, et le traitement des communes du référentiel modifiées après le
// 01/01/2024 (abstention ou rattachement de l'ancien code). Règle et raisons : scripts/lib/perimetre-ademe.mjs.
// Le script REFUSE si une preuve tombe : population 2022 d'une commune nouvelle différente de la somme des
// populations légales 2022 de ses communes, densité dont la surface implicite n'est pas la surface fusionnée,
// champ lu par l'index dont la géographie ne se décide pas.
//
// Sources :
//   --telecharger <json>  écrit les lignes ADEME (API data-fair publique, sans clé), puis s'arrête
//   --lignes <json>       ces lignes (leur sha256 est inscrit dans la sortie)
//   --pl2022 <csv>        Insee, populations légales 2022 (limites au 01/01/2024), donnees_communes.csv de
//                         https://www.insee.fr/fr/statistiques/fichier/8290591/ensemble.zip
//
// Usage :
//   node scripts/population/construire-perimetre-ademe.mjs --telecharger /tmp/ademe-lignes.json
//   node scripts/population/construire-perimetre-ademe.mjs --lignes /tmp/ademe-lignes.json --pl2022 <csv>
// Écrit aussi src/lib/perimetre-ademe.generated.ts (lu par src/lib/commune-data.ts).
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { lireCsv } from "../lib/population-grain.mjs";
import {
  CHAMPS, GEOGRAPHIE_LIGNES, GEOGRAPHIE_RECENTE, classerChamps, fusionsPosterieures, traitements, valeur,
} from "../lib/perimetre-ademe.mjs";

const DATASET = "https://data.ademe.fr/data-fair/api/v1/datasets/8ggfo546-mtjxy4lbqxcl462";
const SORTIE = path.join(process.cwd(), "data", "perimetre-ademe-cog2025.json");
const SORTIE_TS = path.join(process.cwd(), "src", "lib", "perimetre-ademe.generated.ts");
const REFERENTIEL = path.join(process.cwd(), "data", "population-referentiel-cog2025.json");

const arg = (nom) => {
  const i = process.argv.indexOf(`--${nom}`);
  return i > 0 ? process.argv[i + 1] : null;
};
const echouer = (m) => { console.error(`REFUS: ${m}`); process.exit(1); };
const sha = (buf) => createHash("sha256").update(buf).digest("hex");

const cible = arg("telecharger");
if (cible) {
  const select = ["code_commune_insee", "commune", ...CHAMPS.map((c) => c.source)].join(",");
  const lignes = [];
  let after = null;
  for (;;) {
    const u = new URL(`${DATASET}/lines`);
    u.searchParams.set("size", "10000");
    u.searchParams.set("select", select);
    u.searchParams.set("sort", "_i");
    if (after) u.searchParams.set("after", after);
    const r = await fetch(u);
    if (!r.ok) echouer(`ADEME ${r.status} ${r.statusText}`);
    const j = await r.json();
    lignes.push(...j.results);
    if (!j.next || j.results.length === 0) break;
    after = new URL(j.next).searchParams.get("after");
  }
  writeFileSync(cible, JSON.stringify({ dataset: DATASET, recupere: new Date().toISOString(), lignes }));
  console.log(`✓ ${lignes.length} lignes ADEME écrites dans ${cible}`);
  process.exit(0);
}

const fichierLignes = arg("lignes");
const fichierPl22 = arg("pl2022");
if (!fichierLignes || !fichierPl22) echouer("préciser --lignes et --pl2022 (voir l'en-tête du script)");
const brutLignes = readFileSync(fichierLignes);
const brutPl22 = readFileSync(fichierPl22);
const brutRef = readFileSync(REFERENTIEL);
const { lignes, recupere } = JSON.parse(brutLignes.toString("utf8"));
const referentiel = JSON.parse(brutRef.toString("utf8")).communes;
const pl22 = new Map(lireCsv(brutPl22.toString("utf8"), ";").map((r) => [r.COM, Number(r.PMUN)]));
if (pl22.size < 34000) echouer(`${fichierPl22} n'est pas un fichier de populations légales (colonnes COM, PMUN)`);
const parCode = new Map(lignes.map((l) => [l.code_commune_insee, l]));

// 1. La géographie de chaque champ.
const champs = classerChamps(lignes, referentiel);
const indecis = CHAMPS.filter((c) => c.index && champs[c.source].geographie == null).map((c) => c.source);
if (indecis.length) echouer(`géographie indécidable pour des champs de l'index : ${indecis.join(", ")}`);

// 2. Les champs « 2025 » sont calculés sur la commune fusionnée, pas seulement retirés des communes absorbées.
const fusions = fusionsPosterieures(referentiel);
const ecartsPop = [];
const ratios = [];
for (const [k, absorbees] of Object.entries(fusions)) {
  const membres = [k, ...absorbees];
  const l = parCode.get(k);
  const somme = membres.reduce((t, c) => t + (pl22.get(c) ?? NaN), 0);
  const p22 = valeur(l?.population_au_dernier_recensement_2022);
  if (p22 !== somme) ecartsPop.push(`${k} : ADEME ${p22}, somme des populations légales 2022 ${somme}`);
  const surfaceImplicite = p22 / valeur(l?.densite_de_population_2022);
  const fusionnee = membres.reduce((t, c) => t + (valeur(parCode.get(c)?.surfcom2024) ?? NaN), 0) / 1e6;
  const ancienne = valeur(l?.surfcom2024) / 1e6;
  ratios.push({ k, fusionnee: surfaceImplicite / fusionnee, ancienne: surfaceImplicite / ancienne });
}
if (ecartsPop.length) echouer(`population 2022 hors du périmètre fusionné :\n  ${ecartsPop.join("\n  ")}`);
const touches = new Set(Object.entries(referentiel).flatMap(([k, r]) => [k, ...r.codesRepris]));
const national = lignes
  .filter((l) => !touches.has(l.code_commune_insee))
  .map((l) => (valeur(l.population_au_dernier_recensement_2022) / valeur(l.densite_de_population_2022)) / (valeur(l.surfcom2024) / 1e6))
  .filter((r) => Number.isFinite(r) && r > 0)
  .sort((a, b) => a - b);
const quantile = (q) => national[Math.floor(q * (national.length - 1))];
const [bas, haut] = [quantile(0.01), quantile(0.99)];
const horsBande = ratios.filter((r) => !(r.fusionnee >= bas && r.fusionnee <= haut) || Math.abs(Math.log(r.fusionnee)) >= Math.abs(Math.log(r.ancienne)));
if (horsBande.length) echouer(`densité 2022 hors du périmètre fusionné : ${horsBande.map((r) => r.k).join(", ")}`);
const arrondi = (x) => Number(x.toFixed(3));

// 3. Le traitement des communes modifiées après le 01/01/2024.
const communes = traitements(referentiel, lignes, champs);

const sortie = {
  schema: "FUT-109 · géographie des champs ADEME data_communes et traitement des communes du référentiel modifiées après le 01/01/2024",
  regle: "scripts/lib/perimetre-ademe.mjs",
  sources: {
    ademe: { dataset: DATASET, recupere, sha256: sha(brutLignes) },
    pl2022: { url: "https://www.insee.fr/fr/statistiques/8290591", sha256: sha(brutPl22) },
    referentiel: { fichier: "data/population-referentiel-cog2025.json", sha256: sha(brutRef) },
  },
  geographies: { lignes: GEOGRAPHIE_LIGNES, recente: GEOGRAPHIE_RECENTE },
  champs,
  preuves: {
    population2022: `${Object.keys(fusions).length}/${Object.keys(fusions).length} communes nouvelles du ${GEOGRAPHIE_RECENTE} : population_au_dernier_recensement_2022 = somme des populations légales 2022 de leurs communes`,
    densite2022: {
      constat: `${ratios.length}/${ratios.length} : la surface implicite (population 2022 ÷ densité 2022) est la surface fusionnée (somme des surfcom2024), pas celle de l'ancienne commune`,
      rapportSurfaceFusionnee: [arrondi(Math.min(...ratios.map((r) => r.fusionnee))), arrondi(Math.max(...ratios.map((r) => r.fusionnee)))],
      rapportAncienneSurface: [arrondi(Math.min(...ratios.map((r) => r.ancienne))), arrondi(Math.max(...ratios.map((r) => r.ancienne)))],
      bandeNationaleP01P99: [arrondi(bas), arrondi(haut)],
    },
  },
  communes,
};
writeFileSync(SORTIE, `${JSON.stringify(sortie, null, 1)}\n`);

// L'extrait pour l'application : les champs qu'elle ne lit pas sur un territoire modifié depuis (géographie des
// lignes, ou indécidable : un champ clairsemé n'est jamais présumé au bon périmètre), et la conduite par commune.
const nonLus = CHAMPS.filter((c) => !c.index && champs[c.source].geographie !== GEOGRAPHIE_RECENTE).map((c) => c.source);
const parCommune = Object.fromEntries(Object.entries(communes).map(([k, t]) => [k, t.traitement === "rattachement" ? { traitement: t.traitement, depuis: t.depuis } : { traitement: t.traitement }]));
writeFileSync(SORTIE_TS, `// GÉNÉRÉ par scripts/population/construire-perimetre-ademe.mjs — ne pas éditer à la main.
// FUT-109 : ADEME data_communes mêle deux géographies (01/01/2024 et 01/01/2025). Preuves et règle :
// data/perimetre-ademe-cog2025.json, scripts/lib/perimetre-ademe.mjs.

/** Champs ADEME non lus pour une commune au territoire modifié après le ${GEOGRAPHIE_LIGNES} : ils décrivent l'ancien. */
export const CHAMPS_ADEME_ANCIENNE_GEOGRAPHIE: readonly string[] = ${JSON.stringify([...CHAMPS.filter((c) => c.index && champs[c.source].geographie === GEOGRAPHIE_LIGNES).map((c) => c.source), ...nonLus].filter((s) => !["population_totale_2021", "surfcom2024"].includes(s)).sort())};

/** Communes modifiées après le ${GEOGRAPHIE_LIGNES} : abstention sur ces champs, ou rattachement de l'ancien code. */
export const PERIMETRE_ADEME: Readonly<Record<string, { traitement: "abstention" } | { traitement: "rattachement"; depuis: string }>> = ${JSON.stringify(parCommune)};
`);
const n = Object.values(communes);
console.log(`✓ ${SORTIE} : ${n.filter((t) => t.traitement === "abstention").length} abstentions, ${n.filter((t) => t.traitement === "rattachement").length} rattachements`);
for (const c of CHAMPS) console.log(`  ${(champs[c.source].geographie ?? "indécidable").padEnd(11)} ${champs[c.source].absorbees.padStart(6)} absorbées  ${c.source}`);
