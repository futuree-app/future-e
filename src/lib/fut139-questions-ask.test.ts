// FUT-139 · LES QUESTIONS SUGGÉRÉES D'ASKFUTURE DISENT LE MODE DU RÉSULTAT.
//
// « Pourquoi Paris plutôt que Lyon ? » affirme que Paris a gagné. Cette question ne se propose que sur un vrai
// classement (priorités toutes mesurées, hors exploration). En exploration (FUT-129) ou à couverture incomplète
// (FUT-109), les chips et placeholders parlent des faits de chaque commune, sans victoire ni superlatif. Les
// résultats viennent du vrai moteur sur l'index réel, coupés comme l'interface (3 cartes, ou 1). Aucun appel Anthropic.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { modeQuestions, questionsSuggerees, placeholdersAsk, enteteAsk } from "./comparateur/questions-ask.ts";
import { sessionReconstituable } from "./comparateur/session-ou-vivre.ts";

const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const ts = createRequire(${JSON.stringify(racine)} + "package.json")("typescript");
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
  if (spec === "next/link") return next("next/link.js", ctx);
  return next(spec, ctx);
}
export async function load(url, ctx, next) {
  if (!url.endsWith(".tsx")) return next(url, ctx);
  const fichier = fileURLToPath(url);
  const { outputText } = ts.transpileModule(readFileSync(fichier, "utf8"), {
    fileName: fichier,
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return { format: "module", source: outputText, shortCircuit: true };
}`;

type M = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
let V: M;
before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  V = await import("./comparateur-vie.ts");
});

/** Ce que voit le lecteur : les `n` premières cartes, la couverture recalculée sur elles (comme le moteur). */
async function rendu(departements: string[], preferences: M[], n: number) {
  const o = await V.matchProjects({ reformulation: "FUT-139", hardConstraints: { departements }, preferences });
  const top = o.results.slice(0, n);
  assert.equal(top.length, n, "assez de communes pour le scénario");
  const outcome = { ...o, couverture: V.couvertureDesResultats(top) };
  const mode = modeQuestions(outcome, top);
  return { top, mode, chips: questionsSuggerees(top, mode), pool: placeholdersAsk(top, mode, preferences.map((p) => p.key)) };
}

// Une victoire comparative, une recommandation ou une correspondance, sous toutes leurs formes.
const VICTOIRE = /arbitrage|plutôt que|devant|en premier|ressort|la plus|le plus|meilleur|correspond|adaptée|gagner|vraiment pesé|écarte|laquelle|quelle commune|les séparent/i;
// Une seule carte : rien ne la compare à une autre.
const PLURIEL = /plutôt que|devant|laquelle|quelle commune|les séparent|ces communes|ces territoires|les territoires/i;

// Sur l'index réel, Paris (75) ne rend qu'une carte (les arrondissements se regroupent) : c'est le cas réel
// d'une seule commune à couverture incomplète. Le calme n'y est pas mesuré, la culture l'est.
const SCENARIOS = [
  { nom: "exploration inondation seule", dep: ["17"], prefs: [{ key: "faible_risque_inondation", weight: 3 }], mode: "exploration_inondation", n: [3, 1] },
  { nom: "priorités en partie mesurées (Paris)", dep: ["75"], prefs: [{ key: "cadre_calme", weight: 3 }, { key: "acces_culture", weight: 2 }], mode: "couverture_incomplete", n: [1] },
  { nom: "aucune priorité mesurée (Paris)", dep: ["75"], prefs: [{ key: "cadre_calme", weight: 3 }], mode: "couverture_incomplete", n: [1] },
  { nom: "sans priorité mesurable", dep: ["17"], prefs: [], mode: "couverture_incomplete", n: [3, 1] },
] as const;

const verifier = (r: { mode: string; chips: string[]; pool: string[] }, mode: string, n: number) => {
  assert.equal(r.mode, mode);
  assert.equal(r.chips.length, 3);
  const e = enteteAsk(r.mode as never, n);
  for (const q of [...r.chips, ...r.pool, e.surtitre, e.titre, e.invite]) {
    assert.doesNotMatch(q, VICTOIRE, q);
    if (n === 1) assert.doesNotMatch(q, PLURIEL, q);
  }
};

for (const s of SCENARIOS) {
  for (const n of s.n) {
    test(`${s.nom}, ${n} commune${n > 1 ? "s" : ""} : aucune question ne présente l'ordre comme une victoire`, async () => {
      verifier(await rendu([...s.dep], [...s.prefs], n), s.mode, n);
    });
  }
}

test("plusieurs communes à couverture partielle ou nulle : aucune victoire non plus", () => {
  for (const etats of [["complete", "partielle", "aucune"], ["partielle", "partielle", "partielle"], ["aucune", "aucune", "aucune"]] as const) {
    const top = etats.map((etat, i) => ({ nom: `Commune ${i + 1}`, littoral: i === 2 ? "recul du trait de côte" : null, couverture: { etat } }));
    const mode = modeQuestions({ couverture: etats.every((e) => e === "aucune") ? "aucune" : "partielle" }, top);
    verifier({ mode, chips: questionsSuggerees(top, mode), pool: placeholdersAsk(top, mode, ["nature", "viabilite_emploi"]) }, "couverture_incomplete", 3);
  }
});

test("Paris, priorités en partie mesurées : les textes réellement produits", async () => {
  const r = await rendu(["75"], [{ key: "cadre_calme", weight: 3 }, { key: "acces_culture", weight: 2 }], 1);
  assert.equal(r.top[0].couverture.etat, "partielle");
  assert.deepEqual(r.chips, [
    "Que montrent les données disponibles sur Paris ?",
    "Quels risques climatiques pèsent sur Paris ?",
    "Quelles priorités préciser pour affiner la recherche ?",
  ]);
  assert.deepEqual(enteteAsk(r.mode, 1), {
    surtitre: "Lire les faits",
    titre: "Que disent les données de ce territoire ?",
    invite: "Posez une question sur le territoire proposé, les faits qui le décrivent ou son évolution future.",
  });
});

test("exploration inondation : les textes réellement produits, à trois puis une commune", async () => {
  const trois = await rendu(["17"], [{ key: "faible_risque_inondation", weight: 3 }], 3);
  const c0 = trois.top[0].nom;
  const litt = trois.top.find((r: M) => r.littoral)?.nom;
  assert.deepEqual(trois.chips, [
    "Que disent les inondations passées de ces communes ?",
    litt ? `Le littoral est-il un sujet à ${litt} ?` : "Quels risques climatiques pèsent sur ces communes ?",
    "Quelles priorités préciser pour comparer ces communes ?",
  ]);
  assert.equal(trois.pool[0], "Que disent les inondations passées de ces communes ?");
  assert.deepEqual(enteteAsk(trois.mode, 3), {
    surtitre: "Lire les faits",
    titre: "Que disent les données de ces territoires ?",
    invite: "Posez une question sur les territoires proposés, les faits qui les décrivent ou leur évolution future.",
  });
  const une = await rendu(["17"], [{ key: "faible_risque_inondation", weight: 3 }], 1);
  assert.equal(une.chips[0], `Que disent les inondations passées de ${c0} ?`);
  assert.equal(une.chips[2], "Quelles priorités préciser pour affiner la recherche ?");
});

test("couverture partielle : la question de départage disparaît, même si la première carte est mesurée", () => {
  const top = [
    { nom: "A", littoral: null, couverture: { etat: "complete" as const } },
    { nom: "B", littoral: null, couverture: { etat: "partielle" as const } },
  ];
  const mode = modeQuestions({ couverture: "partielle" }, top);
  assert.equal(mode, "couverture_incomplete");
  assert.deepEqual(questionsSuggerees(top, mode, "l'Île-de-France"), [
    "Que montrent les données disponibles sur ces communes ?",
    "Qu'est-ce qui change en quittant l'Île-de-France ?",
    "Quelles priorités préciser pour comparer ces communes ?",
  ]);
  // Une carte non mesurée suffit, même si l'agrégat annoncé était complet.
  assert.equal(modeQuestions({ couverture: "complete" }, top), "couverture_incomplete");
});

test("classé, couverture complète : les questions de comparaison sont conservées", async () => {
  const prefs = [{ key: "acces_soins", weight: 2 }, { key: "nature", weight: 3 }];
  const trois = await rendu(["17"], prefs, 3);
  assert.equal(trois.mode, "classe");
  const [c0, c1] = trois.top.map((r: M) => r.nom);
  assert.equal(trois.chips[0], `Pourquoi ${c0} plutôt que ${c1} ?`);
  assert.equal(trois.chips[2], "Qu'est-ce qui a vraiment pesé ?");
  assert.equal(trois.pool[0], `Pourquoi ${c0} ressort devant ${c1} ?`);
  assert.ok(trois.pool.includes("Laquelle est la plus adaptée pour une retraite dans 20 ans ?"));
  assert.deepEqual(enteteAsk(trois.mode, 3), {
    surtitre: "Lire les arbitrages",
    titre: "Pourquoi ces territoires ressortent ?",
    invite: "Posez une question sur les territoires proposés, les compromis identifiés ou leur évolution future.",
  });

  const une = await rendu(["17"], prefs, 1);
  assert.equal(une.mode, "classe");
  assert.equal(une.chips[0], `Pourquoi ${c0} ressort pour mon projet ?`);
  assert.equal(enteteAsk(une.mode, 1).titre, "Pourquoi ce territoire ressort ?");
  for (const q of [...une.chips, ...une.pool]) assert.doesNotMatch(q, PLURIEL, q);
});

test("classé avec inondation déclarée (hors exploration) : le classement porte sur les autres critères, il reste comparable", async () => {
  const r = await rendu(["17"], [{ key: "faible_risque_inondation", weight: 2 }, { key: "acces_soins", weight: 3 }, { key: "nature", weight: 2 }], 3);
  assert.equal(r.mode, "classe");
  assert.match(r.chips[0], /plutôt que/);
});

test("aucun résultat : ni chip ni placeholder", () => {
  assert.deepEqual(questionsSuggerees([], "classe"), []);
  assert.deepEqual(placeholdersAsk([], "exploration_inondation"), []);
});

// ── Revue indépendante du 26/10 : une couverture absente n'est jamais une couverture complète. ──────────────

const NOMS = ["Paris", "Lyon", "Nantes"];
const communes = (n: number, couverture?: (i: number) => unknown) =>
  NOMS.slice(0, n).map((nom, i) => ({ nom, littoral: null, ...(couverture ? { couverture: couverture(i) } : {}) })) as M[];
const COMPLETE = () => ({ etat: "complete", nonMesurees: [] });

const textes = (top: M[], mode: ReturnType<typeof modeQuestions>) => {
  const e = enteteAsk(mode, top.length);
  return [...questionsSuggerees(top, mode), ...placeholdersAsk(top, mode, ["nature", "viabilite_emploi"]), e.surtitre, e.titre, e.invite];
};

for (const n of [1, 2, 3]) {
  test(`couverture inconnue, ${n} commune${n > 1 ? "s" : ""} : questions factuelles, jamais comparatives`, () => {
    const cas: [string, M | null | undefined, M[]][] = [
      ["outcome absent", undefined, communes(n)],
      ["outcome null", null, communes(n)],
      ["outcome vide", {}, communes(n)],
      ["agrégat absent, cartes complètes", { inondation: null }, communes(n, COMPLETE)],
      ["agrégat null, cartes complètes", { couverture: null }, communes(n, COMPLETE)],
      ["agrégat complet, cartes sans couverture", { couverture: "complete" }, communes(n)],
      ["agrégat complet, une carte null", { couverture: "complete" }, communes(n, (i) => (i === n - 1 ? null : COMPLETE()))],
      ["agrégat complet, une carte sans état", { couverture: "complete" }, communes(n, (i) => (i === n - 1 ? {} : COMPLETE()))],
      ["agrégat inconnu", { couverture: "inconnue" }, communes(n, COMPLETE)],
      ["agrégat partiel", { couverture: "partielle" }, communes(n, COMPLETE)],
      ["agrégat nul", { couverture: "aucune" }, communes(n, () => ({ etat: "aucune", nonMesurees: ["un cadre calme"] }))],
    ];
    for (const [nom, outcome, top] of cas) {
      const mode = modeQuestions(outcome as never, top as never);
      assert.equal(mode, "couverture_incomplete", nom);
      assert.equal(questionsSuggerees(top as never, mode)[0], `Que montrent les données disponibles sur ${n > 1 ? "ces communes" : "Paris"} ?`, nom);
      for (const q of textes(top, mode)) {
        assert.doesNotMatch(q, VICTOIRE, `${nom} : ${q}`);
        if (n === 1) assert.doesNotMatch(q, PLURIEL, `${nom} : ${q}`);
      }
    }
  });

  test(`couverture établie, ${n} commune${n > 1 ? "s" : ""} : la comparaison reste proposée`, () => {
    const top = communes(n, COMPLETE);
    const mode = modeQuestions({ couverture: "complete", inondation: { exploration: false } } as never, top as never);
    assert.equal(mode, "classe");
    assert.equal(questionsSuggerees(top as never, mode)[0], n > 1 ? "Pourquoi Paris plutôt que Lyon ?" : "Pourquoi Paris ressort pour mon projet ?");
    // L'exploration prime, même sur une couverture agrégée annoncée complète.
    assert.equal(modeQuestions({ couverture: "complete", inondation: { exploration: true } } as never, top as never), "exploration_inondation");
  });
}

test("aucune commune affichée : jamais classé", () => {
  assert.equal(modeQuestions({ couverture: "complete" } as never, []), "couverture_incomplete");
});

// Sessions : un instantané V5 bâti comme saveSession, sur de vrais résultats du moteur. `loadSession` garde ses
// contrôles de version et de fraîcheur, puis appelle `sessionReconstituable` (rendu réel : scripts/fut139/recette-ask.mjs).
async function session(departements: string[], preferences: M[]) {
  const o = await V.matchProjects({ reformulation: "FUT-139", hardConstraints: { departements }, preferences });
  const askMessages = [{ role: "user", content: "Pourquoi Paris plutôt que Lyon ?" }, { role: "assistant", content: "Réponse d'origine." }];
  return {
    v: 5, savedAt: 1_000_000, submittedText: "FUT-139",
    parsed: { reformulation: "FUT-139", hardConstraints: { departements }, preferences },
    outcome: JSON.parse(JSON.stringify(o)), synthesis: "Synthèse.", askMessages, askRemaining: 1, askLimit: false,
  } as M;
}
// Aller-retour JSON, comme le localStorage, puis la validation que `loadSession` applique.
const lire = (s: M): M | null => { const lu = JSON.parse(JSON.stringify(s)); return sessionReconstituable(lu) ? lu : null; };
const restituer = (s: M | null) => {
  if (!s) return null;
  const top = s.outcome.results.slice(0, 3);
  return { mode: modeQuestions(s.outcome, top), chips: questionsSuggerees(top, modeQuestions(s.outcome, top)) };
};

test("session V5 complète : restaurée telle quelle, messages AskFuture inchangés, mode recalculé", async () => {
  const classe = await session(["17"], [{ key: "acces_soins", weight: 2 }, { key: "nature", weight: 3 }]);
  const lu = lire(classe);
  assert.ok(lu, "session valide restaurée");
  assert.deepEqual(lu.askMessages, classe.askMessages, "aucune réécriture des anciens messages");
  assert.equal(restituer(lu)!.mode, "classe");
  assert.match(restituer(lu)!.chips[0], /plutôt que/);

  const explo = await session(["17"], [{ key: "faible_risque_inondation", weight: 3 }]);
  assert.equal(restituer(lire(explo))!.mode, "exploration_inondation");
  const paris = await session(["75"], [{ key: "cadre_calme", weight: 3 }, { key: "acces_culture", weight: 2 }]);
  assert.equal(restituer(lire(paris))!.mode, "couverture_incomplete");
});

test("session V5 aux champs manquants : rejetée, jamais complétée par « complete »", async () => {
  const classe = await session(["17"], [{ key: "acces_soins", weight: 2 }, { key: "nature", weight: 3 }]);
  const explo = await session(["17"], [{ key: "faible_risque_inondation", weight: 3 }]);
  const alterations: [string, M, (s: M) => void][] = [
    ["couverture agrégée absente", classe, (s) => { delete s.outcome.couverture; }],
    ["couverture agrégée null", classe, (s) => { s.outcome.couverture = null; }],
    ["couverture agrégée inconnue", classe, (s) => { s.outcome.couverture = "totale"; }],
    ["couverture de la 2e carte absente", classe, (s) => { delete s.outcome.results[1].couverture; }],
    ["couverture de la 1re carte null", classe, (s) => { s.outcome.results[0].couverture = null; }],
    ["état de carte absent", classe, (s) => { delete s.outcome.results[2].couverture.etat; }],
    ["priorités non mesurées absentes", classe, (s) => { delete s.outcome.results[0].couverture.nonMesurees; }],
    ["toutes les couvertures absentes", classe, (s) => { delete s.outcome.couverture; for (const r of s.outcome.results) delete r.couverture; }],
    ["exploration absente avec inondation déclarée", explo, (s) => { delete s.outcome.inondation; }],
    ["exploration non booléenne", explo, (s) => { s.outcome.inondation.exploration = "oui"; }],
    ["outcome absent", classe, (s) => { delete s.outcome; }],
    ["résultats absents", classe, (s) => { s.outcome.results = []; }],
    ["projet absent", classe, (s) => { delete s.parsed; }],
  ];
  for (const [nom, base, alterer] of alterations) {
    const s = JSON.parse(JSON.stringify(base));
    alterer(s);
    assert.equal(lire(s), null, nom);
  }
  assert.equal(sessionReconstituable(null), false);
  assert.equal(sessionReconstituable({}), false);
});
