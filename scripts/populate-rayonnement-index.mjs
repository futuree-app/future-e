#!/usr/bin/env node
/**
 * populate-rayonnement-index.mjs — injecte le rayonnement solaire dans l'index.
 *
 * POURQUOI. Répare le critère `ensoleillement_recherche` qui affichait « ensoleillé »
 * mais mesurait température d'été + faible pluie (attribution fausse). On le remplace
 * par le rayonnement solaire ERA5 (data/communes-rayonnement.json), qui EST vraiment
 * du soleil. Récit qualitatif (très/moyennement/peu ensoleillé), jamais d'heures.
 *
 * QUOI. Lit communes-rayonnement.json, calcule le percentile national, et écrit
 * `rayonnement` (indice brut J/m²/j) + `rayonnement_pct` (0–100, haut = plus
 * ensoleillé) dans chaque commune de l'index. Non destructif, idempotent.
 *
 * LIMITE (à divulguer). ERA5-Land masque les océans : pour une commune côtière sur
 * presqu'île (ex. Brest), la maille terrestre valide la plus proche est intérieure
 * et un peu plus ensoleillée → le signal sous-estime la grisaille maritime. Validé
 * par QA (Pearson 0,93 / Spearman 0,87 vs heures Météo-France), artefact côtier assumé.
 *
 *   node scripts/populate-rayonnement-index.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { assertIndexWorktree } from "./lib/require-index-worktree.mjs";

assertIndexWorktree();

async function main() {
  const root = process.cwd();
  const file = path.join(root, "data", "comparateur-index.json");
  const ray = JSON.parse(
    await fs.readFile(path.join(root, "data", "communes-rayonnement.json"), "utf8"),
  );
  const { meta, communes } = JSON.parse(await fs.readFile(file, "utf8"));

  // Percentile national : rang du rayonnement parmi toutes les communes mesurées.
  const vals = Object.values(ray).filter((v) => v != null).sort((a, b) => a - b);
  const n = vals.length;
  const pctOf = (v) => {
    if (v == null) return null;
    // proportion de communes <= v (recherche binaire de la borne sup)
    let lo = 0, hi = n;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (vals[mid] <= v) lo = mid + 1;
      else hi = mid;
    }
    return Math.round((lo / n) * 100);
  };

  let withRay = 0;
  for (const c of communes) {
    const v = ray[c.insee] ?? null;
    c.rayonnement = v;
    c.rayonnement_pct = pctOf(v);
    if (v != null) withRay++;
  }

  meta.rayonnement = {
    source: "ERA5-Land (surface_solar_radiation_downwards), normale 1991-2020, via CDS",
    champ: "rayonnement (indice J/m²/j), rayonnement_pct (percentile national 0–100, haut = plus ensoleillé)",
    usage: "critère ensoleillement_recherche — récit QUALITATIF (très/moyennement/peu ensoleillé), jamais d'heures de soleil (non mesurées)",
    validation: "QA vs heures Météo-France : Pearson 0,93 / Spearman 0,87 (25 villes)",
    limite: "ERA5-Land masque les océans : communes côtières sur presqu'île (ex. Brest) légèrement surestimées (maille terrestre intérieure)",
  };

  await fs.writeFile(file, JSON.stringify({ meta, communes }), "utf8");

  const probe = ["29019", "56121", "06088", "34172", "59350"];
  for (const ic of probe) {
    const c = communes.find((x) => x.insee === ic);
    if (c) console.log(`${c.nom.padEnd(12)} rayonnement ${c.rayonnement} → percentile ${c.rayonnement_pct}`);
  }
  console.log(`✓ rayonnement injecté : ${withRay}/${communes.length} communes.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
