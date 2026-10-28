// FUT-152 · Construit `src/lib/anciens-codes-communes.generated.ts` : pour chaque commune du COG 2025, les codes
// des communes qu'elle a absorbées (fusions, communes nouvelles, changements de code). Certaines sources
// gardent leurs fiches sous l'ancien code : CASIAS rattache encore 27 fiches à Octeville et Équeurdreville,
// que la recherche « 50129 » (Cherbourg-en-Cotentin) ne rend pas. Interroger la commune, c'est donc
// interroger aussi ses anciens codes.
//
// La règle de rattachement est celle de FUT-147 (`resolveurCog`, src/lib/data/bdiff-incendies.ts) : une seule
// définition de « ce code est devenu cette commune » dans le dépôt.
//
//   curl -o /tmp/cog/v_commune_2025.csv     https://www.insee.fr/fr/statistiques/fichier/8377162/v_commune_2025.csv
//   curl -o /tmp/cog/v_mvt_commune_2025.csv https://www.insee.fr/fr/statistiques/fichier/8377162/v_mvt_commune_2025.csv
//   node scripts/fut152/anciens-codes.mts --cog /tmp/cog
//
// REFUSE (exit 1) si un fichier manque ou si une commune connue du contrôle (Cherbourg-en-Cotentin, Annecy)
// perd ses anciens codes.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { resolveurCog, type MouvementCog } from "../../src/lib/data/bdiff-incendies.ts";

const arg = (nom: string, defaut: string): string => {
  const i = process.argv.indexOf(`--${nom}`);
  return i > 0 ? process.argv[i + 1]! : defaut;
};
const die = (m: string): never => {
  console.error(`REFUS: ${m}`);
  process.exit(1);
};

const COG = arg("cog", "data/source/cog");
const SORTIE = path.join(process.cwd(), "src", "lib", "anciens-codes-communes.generated.ts");

function lireCsvInsee(fichier: string): Record<string, string>[] {
  if (!existsSync(fichier)) die(`${fichier} absent`);
  const lignes = readFileSync(fichier, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  const entete = lignes[0]!.split(",").map((c) => c.replace(/"/g, ""));
  return lignes.slice(1).map((l) => {
    const v = l.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.map((x) => x.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"'));
    return Object.fromEntries(entete.map((c, k) => [c, v[k] ?? ""]));
  });
}
const sha256 = (f: string): string => createHash("sha256").update(readFileSync(f)).digest("hex");

const fCommunes = path.join(COG, "v_commune_2025.csv");
const fMouvements = path.join(COG, "v_mvt_commune_2025.csv");
const communes = new Set(lireCsvInsee(fCommunes).filter((r) => r.TYPECOM === "COM").map((r) => r.COM!));
const mouvements = lireCsvInsee(fMouvements) as unknown as MouvementCog[];
const resoudre = resolveurCog(communes, mouvements);

const anciens = new Map<string, Set<string>>();
for (const m of mouvements) {
  const code = m.COM_AV;
  if (m.TYPECOM_AV !== "COM" || communes.has(code)) continue; // un code toujours vivant n'est l'ancien de personne
  const actuel = resoudre(code);
  if (!actuel || actuel === code) continue;
  if (!anciens.has(actuel)) anciens.set(actuel, new Set());
  anciens.get(actuel)!.add(code);
}

const table = Object.fromEntries([...anciens].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, [...v].sort()]));
for (const [commune, attendus] of [["50129", ["50173", "50383"]], ["74010", ["74011", "74093", "74182", "74217", "74268"]]] as const) {
  for (const a of attendus) if (!table[commune]?.includes(a)) die(`${commune} ne porte plus l'ancien code ${a}`);
}

const total = Object.values(table).reduce((n, v) => n + v.length, 0);
const ts = `// GÉNÉRÉ par scripts/fut152/anciens-codes.mts — ne pas éditer à la main.
// COG Insee au 01/01/2025 : v_commune_2025.csv (sha256 ${sha256(fCommunes)}),
// v_mvt_commune_2025.csv (sha256 ${sha256(fMouvements)}).
// ${Object.keys(table).length} communes actuelles, ${total} anciens codes.

/** Pour une commune actuelle, les codes des communes qu'elle a absorbées. Absente : aucun ancien code. */
export const ANCIENS_CODES_COMMUNES: Readonly<Record<string, readonly string[]>> = ${JSON.stringify(table)};
`;
writeFileSync(`${SORTIE}.tmp`, ts);
renameSync(`${SORTIE}.tmp`, SORTIE);
console.log(`${SORTIE} : ${Object.keys(table).length} communes, ${total} anciens codes`);
