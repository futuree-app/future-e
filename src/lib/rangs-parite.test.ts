// FUT-136 · LE GARDE PERMANENT DES RANGS : chaque bande publiée est celle que donne le score d'aujourd'hui.
//
// Les règles d'accord et de désaccord du dossier (mismatch-rules, alignment-rules) ne lisent pas le score : elles
// lisent la bande `rankBands`, figée dans l'index au moment de l'enrichissement. Une bande est donc un seuil figé
// qui se déguise en donnée (AGENTS.md) : quand un score change sans que son rang soit recalculé, le dossier continue
// de classer sur l'ancien. C'est arrivé trois fois sans qu'aucun test ne le voie : les services (bandes bâties le
// 16/07 sur l'éloignement, score passé à la centralité ANCT le 04/08), les écoles et la culture (rescorées le 21/08).
// Valserhône, centre structurant noté 87, était rangée parmi les 20 % de communes les moins bien dotées.
//
// Ce test RECALCULE chaque bande, pour TOUTES les clés présentes et TOUTES les communes, à partir de
// `mismatchRawScore` (l'ordre canonique du comparateur), sans réutiliser le code de `populate-mismatch-rank.mts` :
// le même contrat, écrit une seconde fois. Il échoue au moindre écart : bande fausse, bande sans score, score sans bande.
//
// LE CONTRAT DU RANG (points de base, 0..10000) : sur les N communes dont le score existe,
//   bas  = (nombre de communes au score STRICTEMENT inférieur) / N
//   haut = (nombre de communes au score inférieur OU ÉGAL) / N
// arrondis au point de base. Les ex æquo partagent la même bande [bas, haut], qui porte leur largeur.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { mismatchRawScore, MISMATCH_RANK_KEYS } from "./comparateur-scores.ts";
import type { IndexCommune, PreferenceKey } from "./comparateur-vie.ts";

type Bande = [number, number];
type Commune = IndexCommune & { rankBands?: Record<string, Bande> };
type Ecarts = { fausses: string[]; sansScore: string[]; sansBande: string[] };

// LES EXCEPTIONS ADMISES : une commune dont le score existe mais qui n'a pas de bande, avec sa raison. Vide
// aujourd'hui. Y ajouter une ligne doit se justifier ici même, jamais en élargissant le test.
const SANS_BANDE_ADMIS: Partial<Record<PreferenceKey, Record<string, string>>> = {};

// Les bandes attendues d'une clé, recalculées par comptage des valeurs (aucun tri partagé avec le script).
function bandesAttendues(key: PreferenceKey, communes: Commune[]): Map<string, Bande> {
  const effectif = new Map<number, number>();
  let n = 0;
  for (const c of communes) {
    const v = mismatchRawScore(key, c);
    if (v == null) continue;
    effectif.set(v, (effectif.get(v) ?? 0) + 1);
    n++;
  }
  const dessous = new Map<number, number>();
  let cumul = 0;
  for (const v of [...effectif.keys()].sort((a, b) => a - b)) {
    dessous.set(v, cumul);
    cumul += effectif.get(v)!;
  }
  const out = new Map<string, Bande>();
  for (const c of communes) {
    const v = mismatchRawScore(key, c);
    if (v == null) continue;
    const bas = dessous.get(v)!, haut = bas + effectif.get(v)!;
    out.set(c.insee, [Math.round((bas / n) * 10000), Math.round((haut / n) * 10000)]);
  }
  return out;
}

function comparer(key: PreferenceKey, communes: Commune[]): Ecarts {
  const attendues = bandesAttendues(key, communes);
  const admis = SANS_BANDE_ADMIS[key] ?? {};
  const e: Ecarts = { fausses: [], sansScore: [], sansBande: [] };
  for (const c of communes) {
    const publiee = c.rankBands?.[key];
    const attendue = attendues.get(c.insee);
    if (!attendue) {
      if (publiee) e.sansScore.push(`${c.insee} [${publiee}]`);
    } else if (!publiee) {
      if (!admis[c.insee]) e.sansBande.push(`${c.insee} score ${mismatchRawScore(key, c)}`);
    } else if (publiee[0] !== attendue[0] || publiee[1] !== attendue[1]) {
      e.fausses.push(`${c.insee} score ${mismatchRawScore(key, c)} : publiée [${publiee}], attendue [${attendue}]`);
    }
  }
  return e;
}

const resume = (key: string, e: Ecarts): string | null => {
  const total = e.fausses.length + e.sansScore.length + e.sansBande.length;
  if (total === 0) return null;
  return `${key} : ${e.fausses.length} bandes fausses, ${e.sansScore.length} bandes sans score, ${e.sansBande.length} scores sans bande`
    + ` (ex. ${[...e.fausses, ...e.sansScore, ...e.sansBande].slice(0, 3).join(" ; ")})`;
};

// ── L'INDEX PUBLIÉ ─────────────────────────────────────────────────────────────────────────────────
// L'index canonique est le .gz versionné : présent en CI et sur clone frais.
const communes: Commune[] = JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8")).communes;
const clesPubliees = [...new Set(communes.flatMap((c) => Object.keys(c.rankBands ?? {})))].sort();

test("toute clé de rang publiée est une clé classée par mismatchRawScore, et toute clé classée est publiée", () => {
  // Une clé inconnue de mismatchRawScore échapperait au recalcul : elle n'a pas le droit d'exister.
  assert.deepEqual(clesPubliees.filter((k) => !(MISMATCH_RANK_KEYS as string[]).includes(k)), []);
  // Une clé classée sans aucune bande rendrait tous ses verdicts « incertains » sans rien dire.
  assert.deepEqual(MISMATCH_RANK_KEYS.filter((k) => !clesPubliees.includes(k)), []);
});

test("chaque bande publiée est exactement celle que donne le score, sur toutes les clés et toutes les communes", () => {
  const echecs = MISMATCH_RANK_KEYS.map((k) => resume(k, comparer(k, communes))).filter((x): x is string => x != null);
  assert.deepEqual(echecs, [], `\n${echecs.join("\n")}\nRecalculer : npx tsx scripts/populate-mismatch-rank.mts --recalculer <clés>`);
});

test("chaque clé classe au moins la moitié des communes, et ses bandes restent dans [0, 10000]", () => {
  for (const k of MISMATCH_RANK_KEYS) {
    const avecScore = communes.filter((c) => mismatchRawScore(k, c) != null).length;
    assert.ok(avecScore >= communes.length / 2, `${k} : ${avecScore}/${communes.length} communes classées`);
    for (const c of communes) {
      const b = c.rankBands?.[k];
      if (b) assert.ok(b[0] >= 0 && b[1] <= 10000 && b[0] <= b[1], `${k} ${c.insee} [${b}]`);
    }
  }
});

test("les exceptions admises désignent des communes réelles, dont le score existe et qui n'ont pas de bande", () => {
  for (const [k, liste] of Object.entries(SANS_BANDE_ADMIS)) {
    for (const [insee, raison] of Object.entries(liste ?? {})) {
      const c = communes.find((x) => x.insee === insee);
      assert.ok(c, `${k} ${insee} : commune absente de l'index`);
      assert.ok(raison.trim().length > 0, `${k} ${insee} : raison vide`);
      assert.notEqual(mismatchRawScore(k as PreferenceKey, c), null, `${k} ${insee} : le score est absent, l'exception est inutile`);
      assert.equal(c.rankBands?.[k], undefined, `${k} ${insee} : la bande existe, l'exception est inutile`);
    }
  }
});

// ── LE GARDE DÉTECTE UNE VRAIE DÉRIVE ──────────────────────────────────────────────────────────────
// Un mini-index cohérent, puis les trois façons dont l'index réel a dérivé.
const mini = (scores: (number | null)[]): Commune[] => {
  const cs = scores.map((s, i) => ({ insee: `0${i}`, nom: `C${i}`, ecoles: s == null ? undefined : { score: s } }) as unknown as Commune);
  const attendues = bandesAttendues("acces_ecoles", cs);
  for (const c of cs) { const b = attendues.get(c.insee); if (b) c.rankBands = { acces_ecoles: b }; }
  return cs;
};

test("synthétique : un index cohérent passe, et les ex æquo partagent leur bande", () => {
  const cs = mini([10, 20, 20, 40, null]);
  assert.deepEqual(comparer("acces_ecoles", cs), { fausses: [], sansScore: [], sansBande: [] });
  assert.deepEqual(cs.map((c) => c.rankBands?.acces_ecoles ?? null), [[0, 2500], [2500, 7500], [2500, 7500], [7500, 10000], null]);
});

test("synthétique : un score qui change sans recalcul des bandes est détecté (le cas des écoles et de la culture)", () => {
  const cs = mini([10, 20, 30, 40]);
  (cs[0] as unknown as { ecoles: { score: number } }).ecoles.score = 35; // rescoré, bandes non recalculées
  const e = comparer("acces_ecoles", cs);
  assert.equal(e.fausses.length, 3); // la commune rescorée, et les deux qu'elle a dépassées
  assert.match(e.fausses[0]!, /^00 score 35 : publiée \[0,2500\], attendue \[5000,7500\]$/);
});

test("synthétique : une bande sans score et un score sans bande sont détectés (le cas des services)", () => {
  const cs = mini([10, 20, 30, 40]);
  (cs[1] as unknown as { ecoles?: unknown }).ecoles = undefined; // score retiré, bande restée
  delete cs[3]!.rankBands; // score présent, bande jamais écrite
  const e = comparer("acces_ecoles", cs);
  assert.deepEqual(e.sansScore, ["01 [2500,5000]"]);
  assert.deepEqual(e.sansBande, ["03 score 40"]);
  // La bande restée fausse, elle aussi : sans la commune retirée, la distribution n'a plus que trois valeurs.
  assert.ok(e.fausses.length > 0);
});
