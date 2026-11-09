// FUT-179 · LA DENSITÉ DE PARIS, LYON, MARSEILLE ET DE LEURS 45 ARRONDISSEMENTS, AU GRAIN ATTESTÉ.
//
// ADEME data_communes, d'où vient la densité de toutes les autres communes, n'a aucune ligne pour 75056, 69123,
// 13055, et ses lignes d'arrondissement n'ont pas de densité. On la RECALCULE avec la méthode ADEME, prouvée sur
// tout l'index avant d'être appliquée (cf. `validerMethode`) :
//   densité = population municipale 2022 (Insee, populations légales) / superficie Insee (km²).
// Chaque valeur est celle de SON périmètre : l'arrondissement pour un arrondissement, la commune entière pour la
// commune (somme des arrondissements / superficie de la commune, égale à la somme de leurs superficies).
//
// Entrées (téléchargées, non versionnées ; copie durable sous ~/Documents/futuree-fut179/telechargements/) :
//   1. comparateur.csv : Insee, base du comparateur de territoires (géographie 2026), mesure SUP ;
//      https://www.insee.fr/fr/statistiques/2521169 (comparateur_csv.zip)
//   2. donnees_communes.csv : Insee, populations légales 2022 (géographie au 01/01/2024), colonne PMUN ;
//      https://www.insee.fr/fr/statistiques/8290591 (ensemble.zip). Le fichier liste les ARRONDISSEMENTS à la place
//      de Paris, Lyon et Marseille.
// Sortie : src/lib/territoire/plm-densite.generated.ts
//
// Usage : node scripts/fut179/densite-plm.mjs <comparateur.csv> <donnees_communes.csv> [index.json.gz]
import { readFileSync, writeFileSync, createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import { createInterface } from "node:readline";
import { gunzipSync } from "node:zlib";

const [, , comparateurPath, popPath, indexPath = "data/comparateur-index.json.gz"] = process.argv;
if (!comparateurPath || !popPath) {
  console.error("usage : node scripts/fut179/densite-plm.mjs <comparateur.csv> <donnees_communes.csv> [index.json.gz]");
  process.exit(2);
}

const VILLES = {
  "75056": { nom: "Paris", arrondissements: Array.from({ length: 20 }, (_, i) => String(75101 + i)) },
  "69123": { nom: "Lyon", arrondissements: Array.from({ length: 9 }, (_, i) => String(69381 + i)) },
  "13055": { nom: "Marseille", arrondissements: Array.from({ length: 16 }, (_, i) => String(13201 + i)) },
};

const sha256 = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");

/** Superficie Insee (km²), par niveau « COM » ou « ARM ». Le fichier fait ~190 Mo : lu en flux. */
async function lireSuperficies(p) {
  const sup = new Map();
  let geoRef = null, millesime = null;
  const rl = createInterface({ input: createReadStream(p, "utf8"), crlfDelay: Infinity });
  for await (const l of rl) {
    // GEO_REF;GEO_OBJECT;GEO;TIME_PERIOD;DS;TAB_MEASURE;OBS_VALUE;…
    if (!l.includes(";DS_RP_SERIE_HISTORIQUE;SUP;")) continue;
    const c = l.split(";");
    if (c[1] !== "COM" && c[1] !== "ARM") continue;
    sup.set(`${c[1]}:${c[2]}`, Number(c[6]));
    geoRef ??= c[0];
    millesime ??= c[3];
  }
  return { sup, geoRef, millesime };
}

/** Population municipale 2022, par code (les arrondissements y remplacent les trois communes). */
function lirePopulations(p) {
  const pop = new Map();
  const lignes = readFileSync(p, "latin1").split(/\r?\n/);
  const entete = lignes[0].split(";");
  const iCom = entete.indexOf("COM"), iPmun = entete.indexOf("PMUN");
  if (iCom < 0 || iPmun < 0) throw new Error(`colonnes COM / PMUN introuvables : ${entete.join(";")}`);
  for (const l of lignes.slice(1)) {
    const c = l.split(";");
    if (c[iCom]) pop.set(c[iCom], Number(c[iPmun]));
  }
  return pop;
}

/**
 * LA PREUVE DE MÉTHODE : PMUN 2022 / SUP doit retrouver `densite_de_population_2022` d'ADEME (copiée dans l'index)
 * pour les communes qui l'ont. On ne publie rien si la médiane des écarts dépasse 0,5 %.
 */
function validerMethode(index, sup, pop) {
  const ecarts = [];
  for (const c of index) {
    if (typeof c.densite !== "number") continue;
    const s = sup.get(`COM:${c.insee}`), p = pop.get(c.insee);
    if (!s || !p) continue;
    ecarts.push(Math.abs(p / s / c.densite - 1));
  }
  ecarts.sort((a, b) => a - b);
  const q = (f) => ecarts[Math.floor(f * (ecarts.length - 1))];
  const r = {
    communes: ecarts.length,
    ecartMedianPct: Math.round(q(0.5) * 10000) / 100,
    ecartP90Pct: Math.round(q(0.9) * 10000) / 100,
    partSousUnPct: Math.round((ecarts.filter((e) => e <= 0.01).length / ecarts.length) * 1000) / 10,
  };
  if (r.communes < 30000 || q(0.5) > 0.005) throw new Error(`méthode non vérifiée : ${JSON.stringify(r)}`);
  return r;
}

const { sup, geoRef, millesime } = await lireSuperficies(comparateurPath);
const pop = lirePopulations(popPath);
const index = JSON.parse(gunzipSync(readFileSync(indexPath))).communes;
const validation = validerMethode(index, sup, pop);

const arrondi = (x) => Math.round(x * 100) / 100;
const zones = {};
for (const [code, v] of Object.entries(VILLES)) {
  let popVille = 0, supArr = 0;
  for (const a of v.arrondissements) {
    const p = pop.get(a), s = sup.get(`ARM:${a}`);
    if (!(p > 0) || !(s > 0)) throw new Error(`arrondissement ${a} incomplet : population ${p}, superficie ${s}`);
    popVille += p;
    supArr += s;
    zones[a] = { perimetre: "arrondissement", ville: v.nom, population2022: p, superficieKm2: s, habitantsParKm2: arrondi(p / s) };
  }
  const supVille = sup.get(`COM:${code}`);
  // La commune entière : la somme de ses arrondissements, sur SA superficie (qui doit être celle de leur réunion).
  if (!(supVille > 0) || Math.abs(supArr - supVille) > 0.05) throw new Error(`${v.nom} : superficie ${supVille} ≠ Σ arrondissements ${supArr}`);
  zones[code] = { perimetre: "commune", ville: v.nom, population2022: popVille, superficieKm2: supVille, habitantsParKm2: arrondi(popVille / supVille) };
}

const meta = {
  methode: "population municipale 2022 / superficie Insee, celle d'ADEME pour toutes les autres communes",
  population: { producteur: "Insee", jeu: "Populations légales 2022 (géographie au 01/01/2024), PMUN", url: "https://www.insee.fr/fr/statistiques/8290591", sha256: sha256(popPath) },
  superficie: { producteur: "Insee", jeu: `Base du comparateur de territoires (géographie ${geoRef}), SUP ${millesime}`, url: "https://www.insee.fr/fr/statistiques/2521169", sha256: sha256(comparateurPath) },
  validation,
};

const sortie = "src/lib/territoire/plm-densite.generated.ts";
writeFileSync(sortie, `// GÉNÉRÉ par scripts/fut179/densite-plm.mjs — ne pas éditer à la main.
// FUT-179 : densité de Paris, Lyon, Marseille (commune entière) et de leurs 45 arrondissements, chacune sur SON
// périmètre. Méthode et preuve : docs/audits/2026-11-09-fut179-plm-densite-occupation-sols.md.

export type DensitePLM = {
  perimetre: "commune" | "arrondissement";
  ville: string;
  population2022: number;
  superficieKm2: number;
  habitantsParKm2: number;
};

export const DENSITE_PLM_META = ${JSON.stringify(meta, null, 2)} as const;

export const DENSITE_PLM: Readonly<Record<string, DensitePLM>> = ${JSON.stringify(zones, null, 2)};
`);
console.log(`${Object.keys(zones).length} périmètres écrits dans ${sortie}`);
console.log("validation", validation);
for (const c of Object.keys(VILLES)) console.log(c, zones[c]);
