#!/usr/bin/env node
/**
 * populate-emploi-arrondissements.mjs — FUT-109 : les 45 arrondissements de Paris, Lyon et Marseille reçoivent
 * l'emploi de la zone d'emploi de leur ville (règle et source : scripts/lib/emploi-arrondissements.mjs). Aucune
 * autre commune n'est touchée. build-comparateur-index.mjs applique la même règle à une reconstruction.
 *   node scripts/populate-emploi-arrondissements.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { assertIndexWorktree } from "./lib/require-index-worktree.mjs";
import { emploiArrondissement } from "./lib/emploi-arrondissements.mjs";

assertIndexWorktree();
const root = process.cwd();
const file = path.join(root, "data", "comparateur-index.json");
const raw = JSON.parse(await fs.readFile(path.join(root, "data", "communes-emploi.json"), "utf8"));
const emploiMap = raw.data ?? raw;
const { meta, communes } = JSON.parse(await fs.readFile(file, "utf8"));
let n = 0;
for (const c of communes) {
  if (c.emploi != null) continue;
  const e = emploiArrondissement(c.insee, emploiMap);
  if (e) { c.emploi = e; n++; }
}
meta.emploiArrondissements = {
  regle: "un arrondissement de Paris, Lyon ou Marseille reçoit l'emploi (taille, diversité) de la zone d'emploi de sa ville ; l'indicateur est défini à la maille ZE2020 et hérité par commune (FUT-109)",
  source: "Insee, zones d'emploi 2020, composition communale au 01/01/2026 : 75056 → 1109, 69123 → 8421, 13055 → 9312 (scripts/lib/emploi-arrondissements.mjs)",
};
await fs.writeFile(file, JSON.stringify({ meta, communes }), "utf8");
console.log(`✓ emploi des arrondissements : ${n} communes reçoivent la zone d'emploi de leur ville.`);
