#!/usr/bin/env -S npx tsx
// Enrichit data/comparateur-index.json avec rankBands (rang national à deux bornes, POINTS DE BASE) pour
// les 10 critères de mismatch v1. Il LIT et RÉÉCRIT l'index en place : il n'efface RIEN (contrairement à
// build-comparateur-index.mjs, qui régénère et où nature/écoles/bruit/industrie, injectés après coup par
// les populate-*, disparaîtraient).
//
// Le rang est bâti sur mismatchRawScore (l'ORDRE CANONIQUE du comparateur, déjà nullable) : le dossier ne
// re-dérive aucune formule. Une commune sans la donnée n'entre pas dans la distribution et n'a pas de bande
// -> le dossier rendra uncertain, jamais un rang inventé.
//
// ATOMIQUE : écrit un .tmp, VALIDE, puis renomme. Une interruption ne corrompt jamais l'index principal. Il
// REFUSE (exit 1) sur anomalie : distribution dégénérée, bande hors [0,1], low > high, enrichissement perdu.
//
// Lancer : npx tsx scripts/populate-mismatch-rank.mts
import fs from "node:fs/promises";
import path from "node:path";
import { mismatchRawScore, MISMATCH_RANK_KEYS } from "../src/lib/comparateur-scores.ts";
import type { IndexCommune } from "../src/lib/comparateur-vie.ts";
import { assertIndexWorktree } from "./lib/require-index-worktree.mjs";

assertIndexWorktree();

const idxPath = path.join(process.cwd(), "data", "comparateur-index.json");
const idx = JSON.parse(await fs.readFile(idxPath, "utf8")) as {
  communes: (IndexCommune & { rankBands?: Record<string, [number, number]> })[];
};
const communes = idx.communes;

const report: string[] = [];
const die = (msg: string): never => {
  console.error(`REFUS: ${msg}`);
  process.exit(1);
};

for (const key of MISMATCH_RANK_KEYS) {
  const vals = communes
    .map((c) => mismatchRawScore(key, c))
    .filter((v): v is number => v != null)
    .sort((a, b) => a - b);
  const N = vals.length;
  if (N < communes.length * 0.5) die(`${key} ne couvre que ${N}/${communes.length} communes`);
  if (vals[0] === vals[N - 1]) die(`${key} a une distribution constante`);

  const lowIdx = (v: number) => {
    let lo = 0, hi = N;
    while (lo < hi) { const m = (lo + hi) >> 1; if (vals[m]! < v) lo = m + 1; else hi = m; }
    return lo;
  };
  const highIdx = (v: number) => {
    let lo = 0, hi = N;
    while (lo < hi) { const m = (lo + hi) >> 1; if (vals[m]! <= v) lo = m + 1; else hi = m; }
    return lo;
  };

  let tieMax = 0;
  for (const c of communes) {
    const v = mismatchRawScore(key, c);
    if (v == null) continue;
    const low = lowIdx(v) / N, high = highIdx(v) / N;
    if (low < 0 || high > 1 || low > high) die(`${key} produit une bande invalide sur ${c.insee}`);
    tieMax = Math.max(tieMax, high - low);
    if (!c.rankBands) c.rankBands = {};
    c.rankBands[key] = [Math.round(low * 10000), Math.round(high * 10000)];
  }
  report.push(`${key.padEnd(26)} ${String(N).padStart(6)} valeurs · ex æquo max ${(tieMax * 100).toFixed(1)} %`);
}

console.log(report.join("\n"));

// Écriture ATOMIQUE, précédée d'une validation : rien n'a été effacé, le rang est bien là.
const tmp = idxPath + ".tmp";
await fs.writeFile(tmp, JSON.stringify(idx));
const check = JSON.parse(await fs.readFile(tmp, "utf8")) as typeof idx;
const c0 = check.communes[0] as Record<string, unknown>;
if (!c0.nature || !c0.calmeSonore) die("un enrichissement existant a disparu (nature / calmeSonore)");
if (!check.communes.some((c) => c.rankBands)) die("aucun rankBands écrit");
await fs.rename(tmp, idxPath);
console.log(`\nÉcrit atomiquement sur ${communes.length} communes.`);
