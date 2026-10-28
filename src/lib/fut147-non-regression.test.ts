// FUT-147 · NON-RÉGRESSION. Ajouter la mémoire des incendies ne change :
//   - ni les communes, ni les scores, raisons, compromis, couvertures et paliers du comparateur : les mêmes
//     projets et les mêmes trios, rejoués sur la branche, rendent EXACTEMENT la référence capturée sur `main`
//     avant le chantier (`scripts/fut147/capturer-reference.mjs`, commit 4d75603f). Seuls diffèrent la ligne
//     « Incendies observés » du Dossier comparatif et le champ `incendiesObserves` des cartes ;
//   - ni l'empreinte du snapshot Territoire, donc ni la clé du cache de la synthèse rédigée (arbitrage C6) :
//     une synthèse encore valide est servie sans aucun appel au modèle ;
//   - ni ce que reçoivent la synthèse rédigée et AskFuture.
// Aucun appel réseau, aucun appel à un modèle : le générateur est un espion qui échoue s'il est appelé.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { buildTerritoireSnapshot } from "./territoire/facts.ts";
import { withHash } from "./facts/hash.ts";
import { chatelaillonInputs } from "./territoire/__fixtures__/chatelaillon.ts";
import { synthesisCacheKey } from "./territoire/synthesis-cache.ts";
import { ensureTerritoireSynthesis } from "./territoire/synthesis-ensure.ts";
import type { TerritoireStore } from "./server/territoire-facts-store.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */
type M = any;
let V: M;
let L: M;

const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
async function premier(candidats, ctx, next) {
  for (const c of candidats.slice(0, -1)) { try { return await next(c, ctx); } catch {} }
  return next(candidats[candidats.length - 1], ctx);
}
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (spec.startsWith("@/")) {
    const b = ${JSON.stringify(racine)} + "src/" + spec.slice(2);
    return premier([b + ".ts", b + ".tsx", b], ctx, next);
  }
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\\.[cm]?[jt]sx?$|\\.json$/.test(spec)) {
    return premier([spec + ".ts", spec + ".tsx", spec], ctx, next);
  }
  return next(spec, ctx);
}`;

before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  V = await import("./comparateur-vie.ts");
  L = await import("./comparateur/lecture-ask.ts");
});

const REF = JSON.parse(readFileSync("src/lib/__fixtures__/fut147-reference-comparateur.json", "utf8"));
const BASE = [{ key: "eviter_isolement", weight: 0.5, baseline: true }, { key: "viabilite_emploi", weight: 0.5, baseline: true }];
// Les mêmes entrées que la capture (scripts/fut147/capturer-reference.mjs), recopiées : la référence ne
// dépend pas du code testé.
const PROJETS: Record<string, M[]> = {
  "feu 3 + nature 2 + cadre calme 2": [{ key: "faible_risque_feu", weight: 3 }, { key: "nature", weight: 2 }, { key: "cadre_calme", weight: 2 }],
  "feu 2 + soins 2 + étés frais 1": [{ key: "faible_risque_feu", weight: 2 }, { key: "acces_soins", weight: 2 }, { key: "faible_chaleur", weight: 1 }],
  "feu 3 seule": [{ key: "faible_risque_feu", weight: 3 }],
  "nature 2 + calme 2 (sans feu)": [{ key: "nature", weight: 2 }, { key: "calme_sonore", weight: 2 }],
  "mer 3 + feu 1": [{ key: "proximite_mer", weight: 3 }, { key: "faible_risque_feu", weight: 1 }],
};
const TRIOS: Record<string, string[]> = {
  "Finistère intérieur": ["29016", "29162", "29103"],
  "Maures": ["83067", "83063", "83148"],
  "Marseille, Aix, Toulon": ["13208", "13001", "83137"],
  "Lyon, Brasparts": ["69383", "29016"],
};
const extraire = (r: M) => ({
  insee: r.insee, compatibility: r.compatibility, reasons: r.reasons, tradeoff: r.tradeoff, compromis: r.compromis,
  decouverte: r.decouverte, distinctive: r.distinctive, identite: r.identite, couverture: r.couverture ?? null,
  sansPrioriteFavorable: r.sansPrioriteFavorable ?? false, signaux: r.signaux, inondation: r.inondation ?? null,
});
/** Le Dossier comparatif SANS la ligne ajoutée : ce qui doit rester identique à la référence. */
const sansIncendies = (cc: M) => ({ ...cc, themes: cc.themes.map((t: M) => ({ ...t, lignes: t.lignes.filter((l: M) => l.id !== "incendies_observes") })) });
const ligneIncendies = (cc: M) => cc.themes.flatMap((t: M) => t.lignes).find((l: M) => l.id === "incendies_observes");

for (const [nom, prefs] of Object.entries(PROJETS)) {
  test(`comparateur « ${nom} » : communes, scores, raisons, compromis et Dossier comparatif identiques à main`, async () => {
    const o = await V.matchProjects({ reformulation: nom, preferences: [...prefs, ...BASE], hardConstraints: {} });
    const ref = REF.projets[nom];
    assert.equal(o.candidates, ref.candidates);
    assert.deepEqual(o.results.map(extraire), ref.results);
    assert.deepEqual(o.pistes.map(extraire), ref.pistes);
    assert.deepEqual(sansIncendies(o.comparaisonComplete), ref.comparaisonComplete);
    // La ligne de carte n'existe qu'avec la priorité feu, et seulement pour un feu d'au moins 10 ha.
    const feu = prefs.some((p) => p.key === "faible_risque_feu");
    for (const r of [...o.results, ...o.pistes]) {
      if (!feu) assert.equal(r.incendiesObserves, undefined, r.insee);
      if (r.incendiesObserves) assert.match(r.incendiesObserves, /^Incendies observés : un incendie dont le départ a été enregistré .* ha au total en \d{4}\.$/);
    }
    // Le Dossier comparatif n'a aucun gagnant sur cette ligne, quand elle existe.
    const l = ligneIncendies(o.comparaisonComplete);
    if (l) assert.deepEqual(l.avantage, { type: "neutre" });
  });
}

for (const [nom, insees] of Object.entries(TRIOS)) {
  test(`Dossier comparatif « ${nom} » : tout est identique à main hors « Incendies observés »`, async () => {
    const s = await V.seedComparaison(insees);
    assert.deepEqual(s.trio.map(extraire), REF.trios[nom].trio);
    assert.deepEqual(sansIncendies(s.comparaison), REF.trios[nom].comparaison);
  });
}

test("Dossier comparatif : la ligne « Incendies observés » suit « Météo propice aux feux », sans gagnant ni alerte", async () => {
  const s = await V.seedComparaison(TRIOS["Finistère intérieur"]);
  const risques = s.comparaison.themes.find((t: M) => t.id === "risques");
  const ids = risques.lignes.map((l: M) => l.id);
  assert.equal(ids[ids.indexOf("feu") + 1], "incendies_observes");
  const l = ligneIncendies(s.comparaison);
  assert.equal(l.label, "Incendies observés");
  assert.deepEqual(l.avantage, { type: "neutre" });
  assert.deepEqual(l.cellules.map((c: M) => c.palier), [
    "Un feu de 1 917 ha au total en 2022",
    "Pas de feu de 10 ha ou plus enregistré au départ de la commune",
    "Pas de feu de 10 ha ou plus enregistré au départ de la commune",
  ]);
  assert.ok(l.cellules.every((c: M) => c.alerte === false));
  // La ligne météo ne reçoit rien : son qualificatif est celui de main.
  const feuRef = REF.trios["Finistère intérieur"].comparaison.themes.flatMap((t: M) => t.lignes).find((x: M) => x.id === "feu");
  assert.deepEqual(risques.lignes.find((x: M) => x.id === "feu"), feuRef);
});

test("Dossier comparatif : pas de ligne quand aucune commune du trio n'a de feu de 10 ha (Marseille compris, à 1 065 ha, l'a)", async () => {
  const m = await V.seedComparaison(TRIOS["Marseille, Aix, Toulon"]);
  const l = ligneIncendies(m.comparaison);
  assert.equal(l.cellules[0].qualifier, "parti de Marseille, toute la ville");
  const sans = await V.seedComparaison(["69383", "69384"]);
  assert.equal(ligneIncendies(sans.comparaison), undefined);
});

test("AskFuture du comparateur : le contexte transmis ne porte pas les incendies observés", async () => {
  const o = await V.matchProjects({ reformulation: "x", preferences: [...PROJETS["feu 3 seule"]!, ...BASE], hardConstraints: {} });
  const top = o.results.slice(0, 3).map((r: M) => ({ ...r, incendiesObserves: r.incendiesObserves ?? "Incendies observés : TEST" }));
  const ctx = L.contexteAsk({ reformulation: "x", criteres: [], inondationDeclaree: false, outcome: o, synthese: "", top });
  assert.doesNotMatch(JSON.stringify(ctx), /Incendies observés|incendiesObserves/);
});

test("synthèse rédigée du comparateur : la charge du navigateur ne liste pas le champ", () => {
  const src = readFileSync("src/app/(public)/ou-vivre/OuVivreClient.tsx", "utf8");
  const charge = src.slice(src.indexOf("results: top.map((r) => ({"), src.indexOf("outcome: { perfectMatch"));
  assert.ok(charge.length > 100);
  assert.doesNotMatch(charge, /incendies/i);
  assert.doesNotMatch(readFileSync("src/app/api/comparateur-vie/synthesize/route.ts", "utf8"), /incendies|bdiff/i);
});

// ── Territoire : l'empreinte et le cache de la synthèse ─────────────────────────────────────

// Calculés sur `main` (4d75603f) avant FUT-147, avec la même entrée et la même date.
const HASH_MAIN = "cc3ac648613039db2c467665f3cb3102cf4097490b6884da6b1f3731aa93b53f";
const CLE_MAIN = "7f7921d5b9e6f3060e3e327655130e9a808dfefd97d7cac576c43c5833adc5f9";

test("Territoire : l'empreinte du snapshot et la clé du cache de synthèse sont celles de main", () => {
  const s = withHash(buildTerritoireSnapshot(chatelaillonInputs(), "2026-10-01T00:00:00.000Z"));
  assert.equal(s.hash, HASH_MAIN);
  assert.equal(synthesisCacheKey(s.hash, "gwl20"), CLE_MAIN);
  assert.ok(!s.facts.some((f) => /incendie|bdiff|wildfire_history/i.test(f.key)), "aucun fait BDIFF dans le snapshot");
});

test("Territoire : une synthèse encore valide est servie sans AUCUN appel au modèle", async () => {
  const s = withHash(buildTerritoireSnapshot(chatelaillonInputs(), "2026-10-01T00:00:00.000Z"));
  let appels = 0;
  const store: TerritoireStore = {
    persistSnapshot: async () => true,
    readSnapshot: async () => s,
    readSynthesis: async (key) => (key === CLE_MAIN ? { status: "ready", text: "Synthèse déjà rédigée.", origin: "model" } : null),
    readSyntheses: async () => new Map(),
    claim: async () => { throw new Error("claim ne doit pas être appelé"); },
    complete: async () => { throw new Error("complete ne doit pas être appelé"); },
    fail: async () => { throw new Error("fail ne doit pas être appelé"); },
    release: async () => {},
  };
  const r = await ensureTerritoireSynthesis(s, "gwl20", {
    store,
    reserveBudget: async () => { appels++; return true; },
    generate: async () => { appels++; throw new Error("appel au modèle interdit"); },
  });
  assert.equal(r.status, "ready");
  assert.equal(r.status === "ready" && r.modelCalls, 0);
  assert.equal(appels, 0);
});

test("Territoire : la mémoire des incendies est lue à côté du snapshot, jamais dedans", () => {
  const page = readFileSync("src/app/(account)/rapport/quartier/page.tsx", "utf8");
  assert.match(page, /getMemoireIncendies\(inseeCode\)/);
  assert.match(page, /incendies=\{incendies\}/);
  for (const f of ["src/lib/server/territoire-snapshot.ts", "src/lib/territoire/facts.ts", "src/lib/territoire/synthesis-contract.ts", "src/lib/territoire/screen.ts"]) {
    assert.doesNotMatch(readFileSync(f, "utf8"), /bdiff|incendies-observes|MemoireIncendies/i, f);
  }
});

test("IA : les prompts, contrats et routes de synthèse sont identiques à main, octet pour octet", () => {
  for (const f of [
    "src/lib/ask/system-prompt.ts", "src/lib/territoire/synthesis-contract.ts",
    "src/lib/comparateur/lecture-ask.ts", "src/app/api/comparateur-vie/synthesize/route.ts", "src/app/api/comparateur-vie/ask/route.ts",
  ]) {
    assert.equal(readFileSync(f, "utf8"), execFileSync("git", ["show", `4d75603f:${f}`], { encoding: "utf8", maxBuffer: 1 << 26 }), f);
  }
});

// FUT-160 (28/10/2026) a dû toucher `facts.ts` : une panne Géorisques s'y enregistre `source_unavailable`. Ce
// statut n'atteint ni l'écran ni la synthèse (`valueOf` et `synthesisFacts` ne lisent que `ok`, cf.
// `territoire/fut160-statut-source.test.ts`). Le registre reste figé pour tout le reste : aucune ligne retirée,
// et seules ces lignes ajoutées.
test("IA : le registre des faits Territoire n'a changé que du statut de panne Géorisques (FUT-160)", () => {
  const f = "src/lib/territoire/facts.ts";
  const diff = execFileSync("git", ["diff", "--no-color", "-U0", "4d75603f", "--", f], { encoding: "utf8", maxBuffer: 1 << 26 });
  const lignes = diff.split("\n").filter((l) => /^[+-]/.test(l) && !/^(\+\+\+|---) /.test(l));
  assert.deepEqual(lignes.filter((l) => l.startsWith("-")), [], "aucune ligne retirée");
  const admises = [
    /^\+ {2}\/\*\*$/, /^\+ {3}\* FUT-160 · /, /^\+ {3}\* comme VigiEau, et plus `missing`\./, /^\+ {3}\*\/$/,
    /^\+ {2}georisquesIndisponible\?: boolean;$/, /^\+ {2}catnatIndisponible\?: boolean;$/,
    /^\+ {6}status: i\.georisques \? "ok" : i\.georisquesIndisponible \? "source_unavailable" : "missing",$/,
    /^\+ {6}status: i\.catnat \? "ok" : i\.catnatIndisponible \? "source_unavailable" : "missing",$/,
  ];
  for (const l of lignes) assert.ok(admises.some((a) => a.test(l)), `ligne non admise dans ${f} : ${l}`);
});
