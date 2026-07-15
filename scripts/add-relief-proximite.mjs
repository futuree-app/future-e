#!/usr/bin/env node
/**
 * add-relief-proximite.mjs — précalcul « proximité au relief ».
 *
 * POURQUOI. Le moteur savait traiter « à la montagne / en altitude » (altitude
 * propre de la commune) et « près des Alpes » (massif nommé → départements), mais
 * pas « proche d'une montagne » : Grenoble (214 m) et Toulouse (135 m) sont
 * indiscernables par l'altitude seule, et l'approximation par département fait
 * remonter Toulouse/Nice/Strasbourg (préfectures de plaine ou de littoral d'un
 * département classé « massif »). Ce critère tombait donc à ZÉRO, et la synthèse
 * le rationalisait après coup. Cf. analyse 2026-06-01.
 *
 * QUOI. Pour chaque commune, on calcule l'altitude maximale parmi les communes
 * situées dans un rayon de RAYON_KM, à partir des seules altitudes déjà dans
 * l'index (aucune source externe). On en tire relief_proximite (0–100) : « y a-t-il
 * un vrai massif à portée ? ». Grenoble → 95, Annecy → 84, Pau → 69, Toulouse → 0.
 *
 * CHOIX (validé sur cibles, cf. journal). reliefMax (et non la DENSITÉ de communes
 * hautes) : la densité avantage les Alpes (massif large) et pénalise injustement
 * les Pyrénées (chaîne étroite), faisant tomber Pau à 23. reliefMax est juste pour
 * les deux. Effet de bord assumé : la Côte d'Azur ressort à ~66 (un sommet est tout
 * près), sous les vraies villes de montagne ; défendable pour la randonnée, et
 * c'est un bonus de score, pas un filtre.
 *
 * LIMITE assumée (à divulguer au gate) : l'altitude vient du centroïde communal et
 * le rayon est circulaire (pas de notion de versant ni d'accès routier). On approche
 * « un massif est proche », pas « le sentier est à 20 minutes ».
 *
 * Idempotent : relit l'index, (re)calcule, réécrit { meta, communes }.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { assertIndexWorktree } from "./lib/require-index-worktree.mjs";

assertIndexWorktree();

const RAYON_KM = 35;
// Courbe altitude max alentour → score. 500 m = plaine (0), 2500 m = haute
// montagne à portée (100). Bornes calées sur les cibles (Grenoble 2315 → 95).
const CURVE = [
  [500, 0],
  [900, 25],
  [1300, 55],
  [1800, 80],
  [2500, 100],
];

function lerp(pts, x) {
  if (x <= pts[0][0]) return pts[0][1];
  const last = pts[pts.length - 1];
  if (x >= last[0]) return last[1];
  for (let i = 1; i < pts.length; i++) {
    if (x <= pts[i][0]) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return last[1];
}

function haversineKm(la1, lo1, la2, lo2) {
  const R = 6371;
  const r = Math.PI / 180;
  const dla = (la2 - la1) * r;
  const dlo = (lo2 - lo1) * r;
  const a =
    Math.sin(dla / 2) ** 2 +
    Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(dlo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function main() {
  const root = process.cwd();
  const file = path.join(root, "data", "comparateur-index.json");
  const { meta, communes } = JSON.parse(await fs.readFile(file, "utf8"));

  // Grille spatiale (maille ~0,25°) pour éviter le O(n²) : on ne compare qu'aux
  // communes des cellules voisines, largement au-delà du rayon.
  const CELL = 0.25;
  const cellKey = (la, lo) => `${Math.floor(la / CELL)},${Math.floor(lo / CELL)}`;
  const grid = new Map();
  const geo = communes.filter((c) => c.lat != null && c.lon != null && c.altitude != null);
  for (const c of geo) {
    const k = cellKey(c.lat, c.lon);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(c);
  }
  const SPAN = 3; // 3 cellules ≈ 0,75° ≈ 80 km de demi-fenêtre, > 35 km partout

  const t0 = Date.now();
  let withRelief = 0;
  for (const c of communes) {
    if (c.lat == null || c.lon == null || c.altitude == null) {
      c.relief_proximite = null;
      continue;
    }
    const lc = Math.floor(c.lat / CELL);
    const oc = Math.floor(c.lon / CELL);
    let maxAlt = c.altitude;
    for (let i = -SPAN; i <= SPAN; i++) {
      for (let j = -SPAN - 1; j <= SPAN + 1; j++) {
        const cell = grid.get(`${lc + i},${oc + j}`);
        if (!cell) continue;
        for (const o of cell) {
          if (o.altitude <= maxAlt) continue;
          if (haversineKm(c.lat, c.lon, o.lat, o.lon) <= RAYON_KM) maxAlt = o.altitude;
        }
      }
    }
    c.relief_proximite = Math.round(lerp(CURVE, maxAlt));
    if (c.relief_proximite >= 40) withRelief++;
  }

  meta.reliefProximite = {
    rayon_km: RAYON_KM,
    methode:
      "altitude max des communes dans un rayon (centroïdes IGN), courbe 500→0 / 2500→100",
    usage: "critère « proche d'une montagne » (proximité au relief), bonus de score",
    limite:
      "approche « un massif est proche », pas l'accès réel au sentier (centroïde, rayon circulaire, pas de versant)",
  };
  if (!meta.approximations.some((a) => a.startsWith("relief_proximite"))) {
    meta.approximations.push(
      `relief_proximite : altitude max dans ${RAYON_KM} km à partir des altitudes de l'index. Approche la proximité d'un massif (Grenoble/Annecy/Pau ressortent, Toulouse/Strasbourg non), pas l'accès réel au relief.`,
    );
  }

  await fs.writeFile(file, JSON.stringify({ meta, communes }), "utf8");
  console.log(
    `✓ relief_proximite calculé en ${((Date.now() - t0) / 1000).toFixed(1)} s : ${communes.length} communes, ${withRelief} avec score ≥ 40.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
