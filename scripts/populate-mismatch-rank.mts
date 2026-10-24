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
//
// RECALCUL DÉCLARÉ : `--recalculer vie_locale,croissance_demographique` ne recalcule QUE ces clés, parce que
// leur score source a été recalculé (FUT-109 : population au grain du COG 2025), et rapporte le nombre de
// bandes modifiées par clé. Les autres clés ne sont pas touchées : leurs bandes restent celles de l'index.
//
// RETRAIT DÉCLARÉ : `--retirer-orphelines acces_services` retire, pour ces clés, la seule bande des communes
// dont le score est devenu null (FUT-109 : commune sans ligne ADEME, plus de niveau de centralité), sans
// recalculer les autres : une bande sans score affirmerait un rang. Toute autre modification reste refusée.
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

const iRecalc = process.argv.indexOf("--recalculer");
const RECALCULER = new Set(iRecalc > 0 ? (process.argv[iRecalc + 1] ?? "").split(",").filter(Boolean) : []);
const iOrph = process.argv.indexOf("--retirer-orphelines");
const ORPHELINES = new Set(iOrph > 0 ? (process.argv[iOrph + 1] ?? "").split(",").filter(Boolean) : []);
for (const k of [...RECALCULER, ...ORPHELINES]) {
  if (!(MISMATCH_RANK_KEYS as string[]).includes(k)) {
    console.error(`REFUS: ${k} n'est pas une clé de mismatch`);
    process.exit(1);
  }
}

const report: string[] = [];
const die = (msg: string): never => {
  console.error(`REFUS: ${msg}`);
  process.exit(1);
};

// SNAPSHOT des bandes existantes AVANT recalcul : le diff sémantique (après la boucle) prouve qu'aucune
// bande d'une clé déjà présente ne bouge (migration mesurée, pas seulement « déterministe »).
const OLD_KEYS = MISMATCH_RANK_KEYS.filter((k) => communes.some((c) => c.rankBands?.[k]));
const oldBands = new Map<string, Map<string, string>>();
for (const k of OLD_KEYS) {
  const m = new Map<string, string>();
  for (const c of communes) if (c.rankBands?.[k]) m.set(c.insee, JSON.stringify(c.rankBands[k]));
  oldBands.set(k, m);
}

for (const key of MISMATCH_RANK_KEYS.filter((k) => RECALCULER.size === 0 || RECALCULER.has(k))) {
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

  // Preuve percentile <-> rang pour les clés dont le score EST déjà un percentile national 0-100
  // (rang recalculé ~= score/100). Seuils d'échec DURS (« faible » n'est pas testable).
  const PERCENTILE_KEYS = ["ensoleillement_recherche", "douceur_climat"];
  const isPct = PERCENTILE_KEYS.includes(key);
  let tieMax = 0;
  const errs: number[] = [];
  for (const c of communes) {
    const v = mismatchRawScore(key, c);
    if (v == null) {
      // Sans la donnée, pas de bande : une bande d'avant (score depuis retiré, FUT-109) affirmerait un rang.
      if (c.rankBands) delete c.rankBands[key];
      continue;
    }
    const low = lowIdx(v) / N, high = highIdx(v) / N;
    if (low < 0 || high > 1 || low > high) die(`${key} produit une bande invalide sur ${c.insee}`);
    tieMax = Math.max(tieMax, high - low);
    if (isPct) errs.push(Math.abs((low + high) / 2 - v / 100));
    if (!c.rankBands) c.rankBands = {};
    c.rankBands[key] = [Math.round(low * 10000), Math.round(high * 10000)];
  }
  let pctProof = "";
  if (isPct) {
    errs.sort((a, b) => a - b);
    const errMax = errs[errs.length - 1] ?? 0, errP95 = errs[Math.floor(errs.length * 0.95)] ?? 0;
    if (N !== communes.length) die(`${key}: validCount ${N} != ${communes.length} (percentile doit couvrir toutes les communes)`);
    if (errMax > 0.02) die(`${key}: |rankMid - pct/100| max ${errMax.toFixed(4)} > 0.02 (le rang ne colle plus au percentile source)`);
    pctProof = ` · errMax ${(errMax * 100).toFixed(2)} pt · errP95 ${(errP95 * 100).toFixed(2)} pt`;
  }
  report.push(`${key.padEnd(26)} ${String(N).padStart(6)} valeurs · ex æquo max ${(tieMax * 100).toFixed(1)} %${pctProof}`);
}

for (const key of MISMATCH_RANK_KEYS.filter((k) => ORPHELINES.has(k) && !RECALCULER.has(k))) {
  let n = 0;
  for (const c of communes) if (c.rankBands?.[key] && mismatchRawScore(key, c) == null) { delete c.rankBands[key]; n++; }
  report.push(`retrait déclaré : ${key} · ${n} bandes sans score retirées`);
}

// DIFF SÉMANTIQUE : aucune bande d'une clé existante ne doit avoir changé (seule ensoleillement s'ajoute).
let changed = 0;
for (const k of OLD_KEYS) {
  const m = oldBands.get(k)!;
  let n = 0;
  for (const c of communes) {
    const avant = m.get(c.insee), apres = JSON.stringify(c.rankBands?.[k]);
    if (apres === avant) continue;
    // Un retrait déclaré n'est admis que s'il retire une bande, sans en modifier aucune.
    if (ORPHELINES.has(k) && !RECALCULER.has(k) && apres === undefined) continue;
    n++;
  }
  if (RECALCULER.has(k)) report.push(`recalcul déclaré : ${k} · ${n} bandes modifiées`);
  else changed += n;
}
if (changed > 0) die(`régression: ${changed} bandes de clés EXISTANTES ont changé (attendu 0)`);
report.push(`diff sémantique OK : 0 bande modifiée hors recalcul déclaré (${OLD_KEYS.length - RECALCULER.size} clés)`);

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
