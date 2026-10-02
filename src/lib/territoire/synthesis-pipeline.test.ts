// FUT-6 : la chaîne génération → contrôles → une régénération → déterministe, et le cache générique.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildTerritoireSnapshot } from "./facts.ts";
import { withHash } from "../facts/hash.ts";
import { projectForSynthesis } from "./synthesis-contract.ts";
import { produceSynthesis } from "./synthesis-pipeline.ts";
import { ensureTerritoireSynthesis, type EnsureDeps } from "./synthesis-ensure.ts";
import { synthesisCacheKey } from "./synthesis-cache.ts";
import type { StoredSynthesis, TerritoireStore } from "../server/territoire-facts-store.ts";
import { auditSyntheses, chatelaillonInputs } from "./__fixtures__/chatelaillon.ts";

const T0 = "2026-09-28T00:00:00.000Z";
const SNAP = withHash(buildTerritoireSnapshot(chatelaillonInputs(), T0));
const P = projectForSynthesis(SNAP, "gwl20");
const [MAUVAISE] = auditSyntheses();
const BONNE = `Châtelaillon-Plage à l'horizon 2050

## Ce qui domine

Les sols resteraient secs 136 jours par an d'ici 2050, dans une commune à l'occupation mixte.

## Ce qui tient, ce qui se tend

La population progresse de 0,62 % par an. Des périmètres d'inondation et de submersion marine sont recensés.

## Ce qu'on sous-estime ici

Les restrictions d'eau en vigueur rappellent que la sécheresse n'attend pas 2050.`;

/** Un générateur simulé : rend ses réponses dans l'ordre, et compte les appels. */
function fakeModel(...answers: (string | Error)[]) {
  const calls: string[] = [];
  const generate = async (user: string) => {
    calls.push(user);
    const a = answers[calls.length - 1];
    if (a instanceof Error) throw a;
    return a;
  };
  return { generate, calls };
}

// ── La chaîne ────────────────────────────────────────────────────────────────────────────────

test("valide du premier coup : 1 appel, origine « model »", async () => {
  const m = fakeModel(BONNE);
  const r = await produceSynthesis({ projection: P, horizon: "gwl20", generate: m.generate, reserveBudget: async () => true });
  assert.equal(r.origin, "model");
  assert.equal(m.calls.length, 1);
  assert.equal(r.text, BONNE);
});

test("refusée puis valide : 2 appels, et la seconde consigne CITE les erreurs", async () => {
  const m = fakeModel(MAUVAISE, BONNE);
  const r = await produceSynthesis({ projection: P, horizon: "gwl20", generate: m.generate, reserveBudget: async () => true });
  assert.equal(r.origin, "model_retry");
  assert.equal(m.calls.length, 2);
  assert.match(m.calls[1], /VOTRE VERSION PRÉCÉDENTE A ÉTÉ REFUSÉE/);
  assert.match(m.calls[1], /densite:requalifiee-dense/);
  assert.equal(r.rejections.length, 1);
});

test("refusée deux fois : synthèse déterministe, jamais un 3e appel, motifs journalisés", async () => {
  const m = fakeModel(MAUVAISE, MAUVAISE, BONNE);
  const r = await produceSynthesis({ projection: P, horizon: "gwl20", generate: m.generate, reserveBudget: async () => true });
  assert.equal(r.origin, "deterministic");
  assert.equal(m.calls.length, 2);
  assert.equal(r.rejections.length, 2);
  assert.equal(r.cacheable, true);
  assert.match(r.text, /^Châtelaillon-Plage à l'horizon 2050\n\n## Le territoire aujourd'hui/);
});

test("modèle indisponible : déterministe, NON mis en cache (une visite suivante retentera)", async () => {
  const m = fakeModel(new Error("529 overloaded"));
  const r = await produceSynthesis({ projection: P, horizon: "gwl20", generate: m.generate, reserveBudget: async () => true });
  assert.equal(r.origin, "deterministic");
  assert.equal(r.cacheable, false);
});

// ── La clé de cache : générique ─────────────────────────────────────────────────────────────

test("clé : deux lecteurs, même snapshot, même horizon, même version → même clé", () => {
  // La fonction n'accepte que (empreinte, horizon) : aucune donnée de lecteur ne peut l'atteindre.
  assert.equal(synthesisCacheKey.length, 2);
  assert.equal(synthesisCacheKey(SNAP.hash, "gwl20"), synthesisCacheKey(SNAP.hash, "gwl20"));
  assert.notEqual(synthesisCacheKey(SNAP.hash, "gwl20"), synthesisCacheKey(SNAP.hash, "gwl30"));
});

test("clé : un changement de faits change la clé, pas une nouvelle lecture à valeur identique", () => {
  const relu = chatelaillonInputs();
  relu.vigieau = { ...relu.vigieau!, consultedAt: "2031-06-01T00:00:00.000Z" };
  assert.equal(withHash(buildTerritoireSnapshot(relu, T0)).hash, SNAP.hash);
  const change = chatelaillonInputs();
  change.saisonnalitePct = 12;
  assert.notEqual(withHash(buildTerritoireSnapshot(change, T0)).hash, SNAP.hash);
});

// ── ensure : cache, réservation, budget ─────────────────────────────────────────────────────

function memoryStore() {
  const rows = new Map<string, { status: "pending" | "ready"; text?: string; origin?: string; lease?: number }>();
  const store: TerritoireStore = {
    async persistSnapshot() { return true; },
    async readSnapshot() { return SNAP; },
    async readSynthesis(key, now): Promise<StoredSynthesis | null> {
      const r = rows.get(key);
      if (!r) return null;
      if (r.status === "ready") return { status: "ready", text: r.text!, origin: r.origin as "model" };
      return (r.lease ?? 0) > now.getTime() ? { status: "pending" } : null;
    },
    async readSyntheses() { return new Map(); },
    async claim(row, now) {
      const r = rows.get(row.key);
      if (!r || (r.status === "pending" && (r.lease ?? 0) < now.getTime())) {
        rows.set(row.key, { status: "pending", lease: now.getTime() + 150_000 });
        return true;
      }
      return false;
    },
    async complete(key, r) { rows.set(key, { status: "ready", text: r.text, origin: r.origin }); },
    async release(key) { if (rows.get(key)?.status === "pending") rows.delete(key); },
  };
  return { store, rows };
}

function deps(store: TerritoireStore, generate: (s: string, u: string) => Promise<string>, budget = true): EnsureDeps {
  return { store, reserveBudget: async () => budget, generate };
}

test("cache manqué puis touché : le second lecteur ne coûte AUCUN appel au modèle", async () => {
  const { store } = memoryStore();
  let calls = 0;
  const gen = async () => { calls++; return BONNE; };
  const a = await ensureTerritoireSynthesis(SNAP, "gwl20", deps(store, gen));
  const b = await ensureTerritoireSynthesis(SNAP, "gwl20", deps(store, gen));
  assert.equal(a.status === "ready" && a.cached, false);
  assert.equal(b.status === "ready" && b.cached, true);
  assert.equal(b.status === "ready" && b.modelCalls, 0);
  assert.equal(calls, 1);
});

test("génération en cours : un second appel rend « pending » et ne paie pas une seconde fois", async () => {
  const { store } = memoryStore();
  let calls = 0;
  let release!: () => void;
  const gen = () => { calls++; return new Promise<string>((r) => { release = () => r(BONNE); }); };
  const first = ensureTerritoireSynthesis(SNAP, "gwl20", deps(store, gen));
  await new Promise((r) => setTimeout(r, 0));
  const second = await ensureTerritoireSynthesis(SNAP, "gwl20", deps(store, gen));
  assert.equal(second.status, "pending");
  release();
  await first;
  assert.equal(calls, 1);
});

test("budget refusé : la clé est libérée, aucun appel", async () => {
  const { store, rows } = memoryStore();
  let calls = 0;
  const r = await ensureTerritoireSynthesis(SNAP, "gwl20", deps(store, async () => { calls++; return BONNE; }, false));
  assert.equal(r.status, "unavailable");
  assert.equal(calls, 0);
  assert.equal(rows.size, 0);
});

test("au plus 2 appels au modèle par nouvelle clé, même quand tout est refusé", async () => {
  const { store } = memoryStore();
  let calls = 0;
  const r = await ensureTerritoireSynthesis(SNAP, "gwl20", deps(store, async () => { calls++; return MAUVAISE; }));
  assert.equal(calls, 2);
  assert.equal(r.status === "ready" && r.origin, "deterministic");
});

// ── La synthèse Territoire ne reçoit plus AUCUN contexte de lecteur ─────────────────────────

const lire = (f: string) => readFileSync(f, "utf8").split("\n").filter((l) => !l.trimStart().startsWith("//")).join("\n");

test("la route de synthèse n'accepte ni workbook, ni attentes, ni relation", () => {
  const src = lire("src/app/api/synthesize-quartier/route.ts");
  assert.doesNotMatch(src, /workbook|discovery|relation|reperes|attentes/i);
});

test("la consigne et la projection n'ont plus de section personnelle", () => {
  const src = lire("src/lib/territoire/synthesis-contract.ts");
  assert.doesNotMatch(src, /reperes_terrain|attentes_decouverte|relation_a_la_commune|current_residence/);
  assert.doesNotMatch(JSON.stringify(P), /workbook|relation|attentes|reperes/);
});

test("le composant de synthèse n'affiche plus le workbook ni les attentes de découverte", () => {
  const src = lire("src/components/report/QuartierSynthesis.tsx");
  assert.doesNotMatch(src, /QuartierWorkbook|workbook|discovery|report-context/);
});

test("modifier le workbook n'invalide rien : la page Territoire ne le lit plus", () => {
  const page = lire("src/app/(account)/rapport/quartier/page.tsx");
  assert.doesNotMatch(page, /workbook_quartier|discovery_workbook|getReportContext/);
});

test("les données existantes restent intactes : aucune migration FUT-6 ne touche workbook ni repères", () => {
  const sql = readFileSync("supabase/34_territoire_facts.sql", "utf8") + readFileSync("supabase/34_territoire_facts_down.sql", "utf8");
  assert.doesNotMatch(sql, /workbook|terrain_observations|report_context|user_profiles/);
  // Et les chemins d'écriture restent en place, pour AskFuture et la future Lecture pour votre projet.
  assert.match(readFileSync("src/app/api/terrain-observations/route.ts", "utf8"), /terrain_observations/);
  // AskFuture lit toujours le carnet : depuis FUT-16, la mise en forme du profil (dont `workbook_quartier`)
  // vit dans le module pur du system prompt, que la route appelle.
  assert.match(
    readFileSync("src/app/api/ask/route.ts", "utf8") + readFileSync("src/lib/ask/system-prompt.ts", "utf8"),
    /workbook_quartier/,
  );
});

// ── Budget : une réservation avant CHAQUE appel payant (correction du 28/09) ────────────────

function budget(...answers: boolean[]) {
  let n = 0;
  return { reserve: async () => answers[n++] ?? true, count: () => n };
}

test("budget : validé au premier coup → 1 réservation, 1 appel", async () => {
  const m = fakeModel(BONNE);
  const b = budget(true, true);
  const r = await produceSynthesis({ projection: P, horizon: "gwl20", generate: m.generate, reserveBudget: b.reserve });
  assert.equal(r.origin, "model");
  assert.equal(b.count(), 1);
  assert.equal(m.calls.length, 1);
});

test("budget : refusé puis validé → 2 réservations, 2 appels", async () => {
  const m = fakeModel(MAUVAISE, BONNE);
  const b = budget(true, true);
  await produceSynthesis({ projection: P, horizon: "gwl20", generate: m.generate, reserveBudget: b.reserve });
  assert.equal(b.count(), 2);
  assert.equal(m.calls.length, 2);
});

test("budget : seconde réservation refusée → 1 appel, puis déterministe non figé", async () => {
  const m = fakeModel(MAUVAISE, BONNE);
  const b = budget(true, false);
  const r = await produceSynthesis({ projection: P, horizon: "gwl20", generate: m.generate, reserveBudget: b.reserve });
  assert.equal(m.calls.length, 1);
  assert.equal(r.origin, "deterministic");
  assert.equal(r.cacheable, false);
  assert.equal(r.budgetRefused, true);
});

test("budget : première réservation refusée → aucun appel", async () => {
  const m = fakeModel(BONNE);
  const r = await produceSynthesis({ projection: P, horizon: "gwl20", generate: m.generate, reserveBudget: budget(false).reserve });
  assert.equal(m.calls.length, 0);
  assert.equal(r.modelCalls, 0);
});

test("budget : cache touché → 0 réservation, 0 appel", async () => {
  const { store } = memoryStore();
  let reservations = 0;
  let calls = 0;
  const d: EnsureDeps = {
    store,
    reserveBudget: async () => { reservations++; return true; },
    generate: async () => { calls++; return BONNE; },
  };
  await ensureTerritoireSynthesis(SNAP, "gwl20", d);
  const before = { reservations, calls };
  const hit = await ensureTerritoireSynthesis(SNAP, "gwl20", d);
  assert.equal(hit.status === "ready" && hit.cached, true);
  assert.deepEqual({ reservations, calls }, before);
});


// ── Limite par adresse : jamais sur un cache (correction du 28/09) ───────────────────────────

test("route : le GET de lecture n'applique pas la limite par adresse", () => {
  const src = lire("src/app/api/synthesize-quartier/route.ts");
  const get = src.slice(src.indexOf("export async function GET"), src.indexOf("export async function POST"));
  assert.doesNotMatch(get, /limiteParAdresse\(/);
});

test("route : le POST lit le cache AVANT d'appliquer la limite, qui précède la génération", () => {
  const src = lire("src/app/api/synthesize-quartier/route.ts");
  const post = src.slice(src.indexOf("export async function POST"));
  const cache = post.indexOf("readSynthesis(");
  const limite = post.indexOf("limiteParAdresse(");
  const generation = post.indexOf("ensureTerritoireSynthesis(");
  assert.ok(cache >= 0 && limite > cache && generation > limite, "ordre attendu : cache, limite, génération");
  assert.match(post.slice(cache, limite), /status === "ready"[\s\S]*status === "pending"/);
});

test("client : toute réponse d'erreur est terminale, sans relances", () => {
  const src = lire("src/components/report/QuartierSynthesis.tsx");
  assert.equal((src.match(/if \(!res\.ok\)/g) ?? []).length, 2, "POST et GET doivent tous deux traiter les erreurs");
  assert.match(src, /enrichedUnavailable/);
});
