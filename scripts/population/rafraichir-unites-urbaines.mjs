#!/usr/bin/env node
// FUT-176 · Resynchronise l'unité urbaine recopiée par FUT-109 après un changement des codes `uu` de l'index,
// SANS les fichiers Insee de population (qu'exige construire-referentiel.mjs) :
//   - `uu` de chaque commune de data/population-referentiel-cog2025.json et de POPULATIONS_HORS_GRAIN ;
//   - MILLESIMES_UNITES_URBAINES, recalculé avec la règle de construire-referentiel.mjs (une commune corrigée :
//     son millésime ; une autre commune peuplée : 2021 ; une absente sans mouvement : aucun).
// Contre-épreuve faite le 09/11/2026 : sur l'index d'avant FUT-176, le recalcul redonne la table versionnée à
// l'identique. Usage : node scripts/population/rafraichir-unites-urbaines.mjs <index.json> [--write]

import fs from "node:fs";
const indexPath = process.argv[2] ?? "data/comparateur-index.json";
const write = process.argv.includes("--write");
const { communes } = JSON.parse(fs.readFileSync(indexPath, "utf8"));
const ref = JSON.parse(fs.readFileSync("data/population-referentiel-cog2025.json", "utf8"));
const absentes = new Set(ref.absentesSansMouvement.map((a) => a.insee));
const uuDe = new Map(communes.map((c) => [c.insee, c.uu ?? null]));
const mUu = new Map();
for (const c of communes) {
  if (!c.uu) continue;
  const corr = ref.communes[c.insee];
  const m = corr ? corr.millesime : !absentes.has(c.insee) && c.population != null ? 2021 : null;
  if (m != null) mUu.set(c.uu, new Set([...(mUu.get(c.uu) ?? []), m]));
}
const uus = [...new Set(Object.keys(ref.communes).map((k) => uuDe.get(k)).filter(Boolean))].sort();
const bloc = uus.map((uu) => `  "${uu}": [${[...(mUu.get(uu) ?? [])].sort().join(", ")}],`).join("\n");
let ts = fs.readFileSync("src/lib/population-millesimes.generated.ts", "utf8");
const debut = ts.indexOf("export const MILLESIMES_UNITES_URBAINES");
const ouvre = ts.indexOf("{\n", debut) + 2, ferme = ts.indexOf("\n};", ouvre);
const actuel = ts.slice(ouvre, ferme);
console.log(actuel === bloc ? "MILLESIMES identique" : `MILLESIMES diffère :\n--- actuel\n${actuel}\n--- recalculé\n${bloc}`);
let changes = 0;
ts = ts.replace(/^  "(\w+)": \{ (.*)uu: (null|"\w+") \}, \/\/ (.*)$/gm, (l, k, mid, uu, nom) => {
  const n = uuDe.get(k); const s = n ? `"${n}"` : "null";
  if (s !== uu) { changes++; console.log(`  ${k} ${nom} : ${uu} -> ${s}`); }
  return `  "${k}": { ${mid}uu: ${s} }, // ${nom}`;
});
if (write) {
  ts = ts.slice(0, ts.indexOf("{\n", ts.indexOf("export const MILLESIMES_UNITES_URBAINES")) + 2) + bloc + ts.slice(ts.indexOf("\n};", ts.indexOf("{\n", ts.indexOf("export const MILLESIMES_UNITES_URBAINES")) + 2));
  fs.writeFileSync("src/lib/population-millesimes.generated.ts", ts);
  for (const [k, c] of Object.entries(ref.communes)) c.uu = uuDe.get(k) ?? null;
  fs.writeFileSync("data/population-referentiel-cog2025.json", JSON.stringify(ref, null, 1) + "\n");
  console.log("écrit");
}
console.log("uu modifiés", changes);
