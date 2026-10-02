#!/usr/bin/env node
// FUT-33 : la liste des communes classées « Mer » au titre de la loi Littoral, pour les pages qui n'ont besoin QUE
// de ce statut (ex. /inondation/[insee] : le bloc submersion marine). Dérivée de data/mer/mer-communes.json
// (loi_effective, héritage PLM) ; les communes PLM elles-mêmes (13055…) y figurent avec leurs arrondissements.
// Usage (racine du dépôt) : node scripts/mer/liste-communes-mer.mjs
import { readFileSync, writeFileSync } from "node:fs";

const table = JSON.parse(readFileSync("data/mer/mer-communes.json", "utf8"));
const iLoi = table.colonnes.indexOf("loi_effective");
const iSource = table.colonnes.indexOf("loi_source_commune");
const codes = new Set();
for (const [insee, v] of Object.entries(table.communes)) {
  if (!(v[iLoi] ?? []).includes("Mer")) continue;
  codes.add(insee);
  if (v[iSource]) codes.add(v[iSource]);
}
const liste = [...codes].sort();
writeFileSync("src/data/communes-loi-littoral-mer.json", JSON.stringify({
  source: "Loi Littoral (DGALN, COG 2022), classement « Mer » après héritage PLM ; data/mer/mer-communes.json",
  communes: liste,
}) + "\n");
console.log(`${liste.length} communes classées « Mer »`);
