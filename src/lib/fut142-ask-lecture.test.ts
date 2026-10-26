// FUT-142 · ASKFUTURE NE FAIT PAS D'UN ORDRE D'AFFICHAGE UN PALMARÈS.
//
// Chaîne testée de bout en bout, sans appel Anthropic : vrai moteur sur l'index réel → contexte construit par
// la fonction qu'appelle la page (`contexteAsk`) → VRAIE route /api/comparateur-vie/ask → prompt reçu par un
// modèle simulé → réponse renvoyée, ou repli si le garde de sortie la refuse. Le SDK Anthropic, PostHog et le
// client Supabase du compteur de budget sont remplacés par des doubles ; la limite par adresse, le compteur de
// deux questions, la réservation du budget et le routage vers le rapport sont ceux de la route.
import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { contexteAsk, lectureDuContexte } from "./comparateur/lecture-ask.ts";
import { affirmationsNonEtablies, premisseNonEtablie, reponseDeRepli } from "./comparateur/garde-ask.ts";
import { modeQuestions, questionsSuggerees } from "./comparateur/questions-ask.ts";
import { sessionReconstituable } from "./comparateur/session-ou-vivre.ts";
import { preferencesToLabels } from "./comparateur-labels.ts";

const racine = pathToFileURL(`${process.cwd()}/`).href;
const doubles: Record<string, string> = {
  "server-only": "export{}",
  "@anthropic-ai/sdk": "export default class { constructor() { this.messages = { create: (...a) => globalThis.__fut142.modele(...a) }; } }",
  "@/lib/posthog-server": "export function getPostHogClient() { return globalThis.__fut142.posthog; }",
  "@supabase/supabase-js": "export function createClient() { return { rpc: (...a) => globalThis.__fut142.rpc(...a) }; }",
};
const hook = `
const doubles = ${JSON.stringify(doubles)};
async function premier(candidats, ctx, next) {
  for (const c of candidats.slice(0, -1)) { try { return await next(c, ctx); } catch {} }
  return next(candidats[candidats.length - 1], ctx);
}
export async function resolve(spec, ctx, next) {
  if (doubles[spec] != null) return { url: "data:text/javascript," + encodeURIComponent(doubles[spec]), shortCircuit: true };
  if (spec === "next/server") return next("next/server.js", ctx);
  if (spec.startsWith("@/")) {
    const b = ${JSON.stringify(racine)} + "src/" + spec.slice(2);
    return premier([b + ".ts", b + ".tsx", b], ctx, next);
  }
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\\.[cm]?[jt]sx?$|\\.json$/.test(spec)) {
    return premier([spec + ".ts", spec + ".tsx", spec], ctx, next);
  }
  return next(spec, ctx);
}`;

type M = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
let V: M;
let POST: (r: unknown) => Promise<Response>;
let NextRequest: new (url: string, init: M) => unknown;

// ── Les doubles : ce que la route appelle, dans l'ordre ─────────────────────────────────────────────
type Appel = { quoi: "modele" | "budget" | "capture"; detail?: M };
const etat: { appels: Appel[]; reponse: M; budgetEpuise: boolean } = { appels: [], reponse: {}, budgetEpuise: false };
const g = globalThis as M;
g.__fut142 = {
  modele: async (req: M) => {
    etat.appels.push({ quoi: "modele", detail: req });
    return { content: [{ type: "tool_use", name: "askfuture_comparateur", input: etat.reponse }] };
  },
  posthog: { capture: (e: M) => etat.appels.push({ quoi: "capture", detail: e }), shutdown: async () => {} },
  rpc: async (_nom: string, args: M) => {
    etat.appels.push({ quoi: "budget", detail: args });
    return { data: etat.budgetEpuise, error: null };
  },
};

before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  V = await import("./comparateur-vie.ts");
  ({ POST } = await import("../app/api/comparateur-vie/ask/route.ts"));
  ({ NextRequest } = await import("next/server.js" as string));
});
beforeEach(() => {
  etat.appels = [];
  etat.budgetEpuise = false;
  etat.reponse = { answer: "Réponse simulée.", routes_to_report: false, focus_rang: null };
});

// ── Construire ce que la page envoie, sur le vrai moteur ────────────────────────────────────────────
async function recherche(reformulation: string, departements: string[], preferences: M[], n = 3) {
  const parsed = { reformulation, hardConstraints: { departements }, preferences };
  const o = await V.matchProjects(parsed);
  const top = o.results.slice(0, n);
  assert.equal(top.length, n, "assez de communes pour le scénario");
  // Comme le moteur : la couverture agrégée porte sur les cartes affichées.
  const outcome = { ...o, couverture: V.couvertureDesResultats(top) };
  return { parsed, outcome, top };
}
/** L'appel exact de `sendAsk` (OuVivreClient) : le vrai contrat client. */
const contexteDePage = (r: { parsed: M; outcome: M; top: M[] }, synthese = "Synthèse affichée.") =>
  contexteAsk({
    reformulation: r.parsed.reformulation,
    criteres: preferencesToLabels(r.parsed.preferences),
    inondationDeclaree: r.parsed.preferences.some((p: M) => p.key === "faible_risque_inondation"),
    outcome: r.outcome as never,
    synthese,
    top: r.top as never,
  });

let ip = 0;
async function poser(body: M, opts: { cookie?: string; adresse?: string } = {}) {
  const headers: M = { "content-type": "application/json", "x-forwarded-for": opts.adresse ?? `10.42.${Math.floor(++ip / 250)}.${ip % 250}` };
  if (opts.cookie) headers.cookie = opts.cookie;
  const res = await POST(new NextRequest("http://localhost/api/comparateur-vie/ask", { method: "POST", body: JSON.stringify(body), headers }));
  const json = await res.json();
  const modele = etat.appels.find((a) => a.quoi === "modele")?.detail;
  const contexte = modele ? JSON.parse(modele.messages.at(-1).content.split("\n\nQUESTION : ")[0].replace(/^[^\n]*\n/, "")) : null;
  return { res, json, modele, contexte };
}
const corps = (context: M, question: string, history: M[] = []) => ({ question, context, focus: null, history, distinctId: "fut142" });

const QUESTION_LR = "Pourquoi La Rochelle est-elle le meilleur choix pour éviter les inondations ?";
const VICTOIRE_LR = "La Rochelle est votre meilleur choix car cette commune correspond le mieux à vos priorités face aux inondations.";
const PRUDENTE_LR =
  "La Rochelle apparaît parmi les territoires à examiner, mais cette recherche n'établit pas qu'elle est le meilleur choix face aux inondations. "
  + "Les données présentées portent sur des faits historiques et ne permettent pas d'affirmer une faible probabilité d'inondation future.";

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// 1 · Le scénario du ticket : exploration inondation en Charente-Maritime
// ════════════════════════════════════════════════════════════════════════════════════════════════════

const CM = ["Je veux éviter les inondations en Charente-Maritime", ["17"], [{ key: "faible_risque_inondation", weight: 3 }]] as const;

test("exploration inondation (17) : le contexte de la page dit l'exploration et la couverture, carte par carte", async () => {
  const r = await recherche(CM[0], [...CM[1]], [...CM[2]]);
  assert.deepEqual(r.top.map((t: M) => t.nom), ["La Rochelle", "Saintes", "Rochefort"]);
  const ctx = contexteDePage(r);
  assert.equal(ctx.lecture!.exploration, true);
  assert.equal(ctx.lecture!.couverture, "sans_priorite");
  assert.equal(ctx.lecture!.ordre, r.outcome.inondation.ordre);
  assert.ok(ctx.lecture!.transparence_inondation);
  assert.deepEqual(ctx.territoires!.map((t) => t.couverture?.etat), ["sans_priorite", "sans_priorite", "sans_priorite"]);
  // Le contrat reste qualitatif : ni INSEE, ni score, ni compatibilité.
  assert.doesNotMatch(JSON.stringify(ctx), /"insee"|compatibility|"score"/);
  assert.equal(lectureDuContexte(ctx).mode, "exploration_inondation");
});

test("exploration inondation, « meilleur choix » : prompt prévenu, réponse de victoire remplacée par le repli", async () => {
  const r = await recherche(CM[0], [...CM[1]], [...CM[2]]);
  etat.reponse = { answer: VICTOIRE_LR, routes_to_report: false, focus_rang: 1 };
  const { res, json, modele, contexte } = await poser(corps(contexteDePage(r), QUESTION_LR));
  assert.equal(res.status, 200);
  // Ce que le modèle a reçu.
  assert.equal(contexte.lecture.mode, "exploration_inondation");
  assert.equal(contexte.lecture.exploration_inondation, true);
  assert.equal(contexte.lecture.nombre_de_territoires, 3);
  assert.equal(contexte.lecture.ordre_affichage, r.outcome.inondation.ordre);
  assert.match(contexte.question_a_premisse, /meilleur choix/);
  assert.deepEqual(contexte.territoires.map((t: M) => [t.position, t.commune, t.couverture_priorites]), [
    [1, "La Rochelle", "sans_priorite"], [2, "Saintes", "sans_priorite"], [3, "Rochefort", "sans_priorite"],
  ]);
  assert.ok(!("rang" in contexte.territoires[0]), "plus de « rang » : une position d'affichage");
  assert.match(modele.system, /"exploration_inondation"/);
  // Ce que le lecteur reçoit : le repli, qui ne désigne aucun gagnant.
  assert.notEqual(json.answer, VICTOIRE_LR);
  assert.match(json.answer, /^Les communes de La Rochelle, Saintes et Rochefort sont proposées pour être examinées, pas classées/);
  assert.deepEqual(affirmationsNonEtablies(json.answer, "exploration_inondation"), []);
  assert.equal(json.remaining, 1);
  const repondu = etat.appels.find((a) => a.quoi === "capture" && a.detail!.event === "life_ask_answered")!.detail!;
  assert.equal(repondu.properties.reponse_remplacee, true);
  assert.equal(repondu.properties.mode_lecture, "exploration_inondation");
  assert.equal(repondu.properties.premisse_rectifiee, true);
});

test("exploration inondation : une réponse prudente et factuelle est rendue telle quelle", async () => {
  const r = await recherche(CM[0], [...CM[1]], [...CM[2]]);
  etat.reponse = { answer: PRUDENTE_LR, routes_to_report: true, focus_rang: 1 };
  const { json } = await poser(corps(contexteDePage(r), QUESTION_LR));
  assert.equal(json.answer, PRUDENTE_LR);
  assert.equal(json.routesToReport, true, "le routage vers le rapport est conservé");
  assert.equal(json.focusRang, 1);
});

test("exploration inondation, une seule commune : repli au singulier, sans autre commune", async () => {
  const r = await recherche(CM[0], [...CM[1]], [...CM[2]], 1);
  etat.reponse = { answer: "La Rochelle est la moins exposée aux inondations.", routes_to_report: false };
  const { json, contexte } = await poser(corps(contexteDePage(r), "La Rochelle est-elle à l'abri des crues ?"));
  assert.equal(contexte.lecture.nombre_de_territoires, 1);
  assert.match(json.answer, /^La commune de La Rochelle est proposée pour être examinée, pas classée :/);
  assert.doesNotMatch(json.answer, /Saintes|Rochefort|les communes/);
});

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// 2 · Classement réel, couverture complète : les questions comparatives restent utiles
// ════════════════════════════════════════════════════════════════════════════════════════════════════

const CLASSE = ["Soins et nature en Charente-Maritime", ["17"], [{ key: "acces_soins", weight: 2 }, { key: "nature", weight: 3 }]] as const;

for (const n of [1, 2, 3]) {
  test(`classé, couverture complète, ${n} commune${n > 1 ? "s" : ""} : mode classé, comparaison légitime acceptée`, async () => {
    const r = await recherche(CLASSE[0], [...CLASSE[1]], [...CLASSE[2]], n);
    const ctx = contexteDePage(r);
    assert.equal(ctx.lecture!.exploration, false);
    assert.equal(ctx.lecture!.couverture, "complete");
    assert.ok(ctx.territoires!.every((t) => t.couverture?.etat === "complete"));
    const [c0, c1] = r.top.map((t: M) => t.nom);
    // La question suggérée par FUT-139 dans ce mode.
    const question = questionsSuggerees(r.top, modeQuestions(r.outcome, r.top))[0];
    assert.equal(question, c1 ? `Pourquoi ${c0} plutôt que ${c1} ?` : `Pourquoi ${c0} ressort pour mon projet ?`);
    const legitime = c1
      ? `${c0} ressort devant ${c1} grâce à un meilleur équilibre entre accès aux soins et nature. ${c1} reste plus proche d'autres atouts. Le rapport permet de vérifier ce compromis.`
      : `${c0} ressort sur vos priorités grâce à son accès aux soins et à la nature, avec un compromis sur d'autres critères. Le rapport permet de le vérifier.`;
    etat.reponse = { answer: legitime, routes_to_report: false, focus_rang: 1 };
    const { json, contexte } = await poser(corps(ctx, question));
    assert.equal(contexte.lecture.mode, "classe");
    assert.equal(contexte.lecture.ordre_affichage, null);
    assert.equal(contexte.question_a_premisse, undefined, "question comparative légitime : aucune prémisse signalée");
    assert.equal(json.answer, legitime, "réponse comparative conservée en mode classé");
  });
}

test("classé : une prémisse jamais établie (« correspond parfaitement ») est signalée, la réponse qui l'accorde remplacée", async () => {
  const r = await recherche(CLASSE[0], [...CLASSE[1]], [...CLASSE[2]]);
  const c0 = r.top[0].nom;
  etat.reponse = { answer: `${c0} correspond parfaitement à vos besoins.`, routes_to_report: false };
  const { json, contexte } = await poser(corps(contexteDePage(r), `Pourquoi ${c0} correspond parfaitement à mes besoins ?`));
  assert.match(contexte.question_a_premisse, /correspond parfaitement/);
  assert.match(json.answer, /^Ces territoires ressortent sur les priorités que vous avez déclarées, mais aucun n'est pour autant un choix parfait/);
});

test("classé avec inondation déclarée (hors exploration) : classé, mais aucune commune « moins risquée »", async () => {
  const r = await recherche("Inondation, soins et nature", ["17"], [{ key: "faible_risque_inondation", weight: 2 }, { key: "acces_soins", weight: 3 }, { key: "nature", weight: 2 }]);
  const ctx = contexteDePage(r);
  assert.equal(ctx.lecture!.exploration, false);
  assert.equal(lectureDuContexte(ctx).mode, "classe");
  const q = "Quelle commune est la moins risquée face aux inondations ?";
  etat.reponse = { answer: `${r.top[0].nom} est la moins risquée face aux inondations des trois.`, routes_to_report: false };
  const { json, contexte } = await poser(corps(ctx, q));
  assert.match(contexte.question_a_premisse, /moins risquée face aux inondations/);
  assert.ok(contexte.lecture.transparence_inondation);
  assert.doesNotMatch(json.answer, /moins risquée/);
});

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// 3 · Couverture partielle, nulle, absente ou inconnue : jamais classé
// ════════════════════════════════════════════════════════════════════════════════════════════════════

test("Paris, priorités en partie mesurées (une carte) : couverture incomplète, priorités non mesurées transmises", async () => {
  const r = await recherche("Calme et culture à Paris", ["75"], [{ key: "cadre_calme", weight: 3 }, { key: "acces_culture", weight: 2 }], 1);
  const ctx = contexteDePage(r);
  assert.equal(ctx.territoires![0].couverture?.etat, "partielle");
  etat.reponse = { answer: "Paris est le meilleur choix pour un cadre calme et la culture.", routes_to_report: false };
  const { json, contexte } = await poser(corps(ctx, "Pourquoi Paris est le meilleur choix ?"));
  assert.equal(contexte.lecture.mode, "couverture_incomplete");
  assert.deepEqual(contexte.territoires[0].priorites_non_mesurees, r.top[0].couverture.nonMesurees);
  assert.ok(contexte.territoires[0].priorites_non_mesurees.length > 0);
  assert.match(json.answer, /^L'affichage de Paris ne vaut pas classement sur toutes vos priorités : certaines priorités ne sont pas mesurées ici \(/);
  assert.match(json.answer, new RegExp(r.top[0].couverture.nonMesurees[0]));
});

test("Paris, aucune priorité mesurée : couverture incomplète", async () => {
  const r = await recherche("Calme à Paris", ["75"], [{ key: "cadre_calme", weight: 3 }], 1);
  const ctx = contexteDePage(r);
  assert.equal(ctx.lecture!.couverture, "aucune");
  assert.equal(lectureDuContexte(ctx).mode, "couverture_incomplete");
});

test("contexte sans lecture (page ancienne) ou aux faits altérés : lu comme inconnu, jamais comme complet", async () => {
  const r = await recherche(CLASSE[0], [...CLASSE[1]], [...CLASSE[2]]);
  const base = contexteDePage(r);
  assert.equal(lectureDuContexte(base).mode, "classe", "témoin : le contexte intact est classé");
  const alterations: [string, (c: M) => void, string?][] = [
    ["lecture absente", (c) => { delete c.lecture; }, "inconnue"],
    ["lecture null", (c) => { c.lecture = null; }, "inconnue"],
    ["exploration absente", (c) => { delete c.lecture.exploration; }],
    ["exploration null", (c) => { c.lecture.exploration = null; }],
    ["exploration non booléenne", (c) => { c.lecture.exploration = "non"; }],
    ["couverture globale absente", (c) => { delete c.lecture.couverture; }, "inconnue"],
    ["couverture globale null", (c) => { c.lecture.couverture = null; }, "inconnue"],
    ["couverture globale inconnue", (c) => { c.lecture.couverture = "totale"; }, "inconnue"],
    ["couverture globale partielle", (c) => { c.lecture.couverture = "partielle"; }, "partielle"],
    ["couverture d'une carte absente", (c) => { delete c.territoires[1].couverture; }],
    ["couverture d'une carte null", (c) => { c.territoires[2].couverture = null; }],
    ["état de carte absent", (c) => { delete c.territoires[0].couverture.etat; }],
    ["état de carte inconnu", (c) => { c.territoires[0].couverture.etat = "complète"; }],
  ];
  for (const [nom, alterer, couverture] of alterations) {
    const c = JSON.parse(JSON.stringify(base));
    alterer(c);
    const l = lectureDuContexte(c);
    assert.equal(l.mode, "couverture_incomplete", nom);
    if (couverture) assert.equal(l.couverture, couverture, nom);
    etat.appels = [];
    etat.reponse = { answer: `${r.top[0].nom} ressort devant ${r.top[1].nom}, c'est la meilleure option.`, routes_to_report: false };
    const { res, json, contexte } = await poser(corps(c, `Pourquoi ${r.top[0].nom} plutôt que ${r.top[1].nom} ?`));
    assert.equal(res.status, 200, nom);
    assert.equal(contexte.lecture.mode, "couverture_incomplete", nom);
    assert.match(json.answer, new RegExp(`^L'ordre de ${r.top[0].nom}, ${r.top[1].nom} et ${r.top[2].nom} ne vaut pas classement sur toutes vos priorités`), nom);
  }
});

test("inondation déclarée mais mode d'exploration absent de l'outcome : la page envoie « inconnu », pas « non »", async () => {
  const r = await recherche(CM[0], [...CM[1]], [...CM[2]]);
  const outcome = { ...r.outcome };
  delete outcome.inondation;
  const ctx = contexteDePage({ ...r, outcome });
  assert.equal(ctx.lecture!.exploration, null);
  assert.equal(lectureDuContexte(ctx).mode, "couverture_incomplete");
  // Carte sans couverture côté page : transmise sans couverture, jamais complétée.
  const top = r.top.map((t: M, i: number) => (i === 1 ? { ...t, couverture: undefined } : t));
  assert.equal(contexteDePage({ ...r, top }).territoires![1].couverture, null);
});

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// 4 · Sessions restaurées et historique
// ════════════════════════════════════════════════════════════════════════════════════════════════════

test("session restaurée (FUT-139) : le contexte rebâti depuis l'instantané est celui de la recherche d'origine", async () => {
  for (const s of [CM, CLASSE]) {
    const r = await recherche(s[0], [...s[1]], [...s[2]]);
    const instantane = JSON.parse(JSON.stringify({ v: 5, parsed: r.parsed, outcome: r.outcome }));
    assert.ok(sessionReconstituable(instantane));
    const restaure = { parsed: instantane.parsed, outcome: instantane.outcome, top: instantane.outcome.results.slice(0, 3) };
    assert.deepEqual(contexteDePage(restaure), JSON.parse(JSON.stringify(contexteDePage(r))));
  }
});

test("session restaurée incohérente : FUT-139 la rejette ; si elle passait, la route resterait prudente", async () => {
  const r = await recherche(CM[0], [...CM[1]], [...CM[2]]);
  const instantane = JSON.parse(JSON.stringify({ v: 5, parsed: r.parsed, outcome: r.outcome }));
  delete instantane.outcome.inondation;
  assert.equal(sessionReconstituable(instantane), false, "règle de restauration FUT-139 inchangée");
  const ctx = contexteDePage({ parsed: instantane.parsed, outcome: instantane.outcome, top: instantane.outcome.results.slice(0, 3) });
  assert.notEqual(lectureDuContexte(ctx).mode, "classe");
});

test("historique contenant un classement injustifié : transmis sans réécriture, signalé, jamais repris", async () => {
  const r = await recherche(CM[0], [...CM[1]], [...CM[2]]);
  const history = [
    { role: "user", content: "Pourquoi La Rochelle plutôt que Saintes ?" },
    { role: "assistant", content: "La Rochelle est votre meilleur choix, elle arrive devant Saintes." },
  ];
  etat.reponse = { answer: "Comme indiqué, La Rochelle reste la meilleure option face aux inondations.", routes_to_report: false };
  const { json, modele, contexte } = await poser(corps(contexteDePage(r), "Et Rochefort ?", history));
  assert.deepEqual(modele.messages.slice(0, 2), history, "les anciens messages ne sont pas réécrits");
  assert.match(contexte.historique_a_ne_pas_reprendre, /ne le reprenez pas/);
  assert.equal(contexte.question_a_premisse, undefined);
  assert.match(modele.system, /L'HISTORIQUE DE CONVERSATION/);
  assert.match(json.answer, /^Les communes de La Rochelle, Saintes et Rochefort sont proposées pour être examinées/);
});

test("historique prudent : aucun signalement", async () => {
  const r = await recherche(CM[0], [...CM[1]], [...CM[2]]);
  const history = [{ role: "user", content: "Que disent les inondations passées de ces communes ?" }, { role: "assistant", content: PRUDENTE_LR }];
  const { contexte } = await poser(corps(contexteDePage(r), "Et Saintes ?", history));
  assert.equal(contexte.historique_a_ne_pas_reprendre, undefined);
});

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// 5 · Signaux qualitatifs : les questions légitimes restent servies
// ════════════════════════════════════════════════════════════════════════════════════════════════════

test("exploration : une question sur un signal qualitatif n'est pas une prémisse, sa réponse relative est conservée", async () => {
  const r = await recherche(CM[0], [...CM[1]], [...CM[2]]);
  const ctx = contexteDePage(r);
  assert.ok(Object.keys(ctx.territoires![0].signaux ?? {}).length > 0, "des signaux sont transmis");
  const q = "Laquelle est la plus exposée à la chaleur ?";
  const reponse = "Parmi les trois, Saintes semble plus exposée à la chaleur estivale que La Rochelle, plus tempérée par la mer. Ce constat ne classe pas les communes sur votre demande.";
  etat.reponse = { answer: reponse, routes_to_report: false };
  const { json, contexte } = await poser(corps(ctx, q));
  assert.equal(contexte.question_a_premisse, undefined);
  assert.deepEqual(contexte.territoires[0].signaux, ctx.territoires![0].signaux);
  assert.equal(json.answer, reponse);
});

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// 6 · Le garde : refuse les victoires, laisse passer les mises en garde
// ════════════════════════════════════════════════════════════════════════════════════════════════════

test("garde : tournures refusées hors classement", () => {
  for (const t of [
    VICTOIRE_LR,
    "Saintes arrive devant Rochefort grâce à son cadre.",
    "Rochefort est la plus adaptée à votre projet.",
    "C'est Saintes qui correspond le mieux à votre demande.",
    "Ce n'est pas un hasard, La Rochelle est la meilleure option.",
    "Ce n'est pas un hasard si La Rochelle est la meilleure option.",
    "Saintes est épargnée par les crues.",
    "Rochefort présente un faible risque d'inondation.",
    "Saintes est la moins exposée aux inondations des trois.",
    "Je vous recommande Saintes.",
  ]) assert.ok(affirmationsNonEtablies(t, "couverture_incomplete").length > 0, t);
});

test("garde : mises en garde et faits légitimes acceptés, dans tous les modes", () => {
  for (const mode of ["classe", "exploration_inondation", "couverture_incomplete"] as const) {
    for (const t of [
      PRUDENTE_LR,
      "On ne peut pas conclure que La Rochelle est le meilleur choix.",
      "Rien n'indique que Saintes soit plus sûre face aux crues.",
      "Aucune commune n'est sans risque : cela se vérifie à l'adresse.",
      "Aucun sinistre d'inondation indemnisé répertorié, ce qui ne prouve pas l'absence de risque.",
      "De 1995 à 2021, peu de sinistres indemnisés, ce qui ne garantit pas un faible risque d'inondation.",
      "Parmi les trois, Narbonne semble plus exposée à la chaleur estivale que Quimper.",
      "Pour mieux comparer ces communes, précisez vos priorités.",
      "Vous cherchez un faible risque d'inondation : cette priorité ne se compare pas d'une commune à l'autre.",
      "Saintes est-elle le meilleur choix ?",
    ]) assert.deepEqual(affirmationsNonEtablies(t, mode), [], `${mode} : ${t}`);
  }
});

test("garde : en mode classé, le vocabulaire du classement est permis, les affirmations jamais établies non", () => {
  assert.deepEqual(affirmationsNonEtablies("Narbonne ressort devant Quimper : elle offre le meilleur équilibre entre soins et mer.", "classe"), []);
  assert.ok(affirmationsNonEtablies("Narbonne est votre meilleur choix.", "classe").length > 0);
  assert.ok(affirmationsNonEtablies("Narbonne correspond parfaitement à vos besoins.", "classe").length > 0);
});

test("prémisses : les formulations du ticket sont repérées hors classement, les comparaisons légitimes non en classé", () => {
  const hors = "exploration_inondation";
  assert.equal(premisseNonEtablie(QUESTION_LR, hors), "meilleur choix");
  assert.match(premisseNonEtablie("Pourquoi La Rochelle est-elle devant Saintes ?", hors)!, /devant/);
  assert.equal(premisseNonEtablie("Pourquoi La Rochelle correspond parfaitement à mes besoins ?", hors), "correspond parfaitement");
  assert.match(premisseNonEtablie("Quelle commune est la moins risquée face aux inondations ?", hors)!, /moins risquée/);
  assert.equal(premisseNonEtablie("Que disent les inondations passées de ces communes ?", hors), null);
  assert.equal(premisseNonEtablie("Pourquoi La Rochelle est-elle devant Saintes ?", "classe"), null);
  assert.equal(premisseNonEtablie("Pourquoi Paris plutôt que Lyon ?", "classe"), null);
  assert.equal(premisseNonEtablie("Pourquoi Paris est-il le meilleur choix ?", "classe"), "meilleur choix");
});

test("repli : dans chaque mode, à 1, 2 et 3 communes, il passe le garde et respecte la forme d'AskFuture", () => {
  const noms = ["La Rochelle", "Saintes", "Rochefort"];
  for (const mode of ["classe", "exploration_inondation", "couverture_incomplete"] as const) {
    for (const n of [1, 2, 3]) {
      for (const nonMesurees of [[], ["un cadre calme"]]) {
        const l = { mode, exploration: false, couverture: "inconnue", ordre: null, transparence: null, communes: noms.slice(0, n).map((nom) => ({ nom, couverture: "inconnue", nonMesurees })) } as never;
        const t = reponseDeRepli(l);
        for (const m of ["classe", "exploration_inondation", "couverture_incomplete"] as const) assert.deepEqual(affirmationsNonEtablies(t, m), [], `${mode}/${n} : ${t}`);
        assert.doesNotMatch(t, /\d|—|!/, t);
        for (const nom of noms.slice(0, n)) if (mode !== "classe" || n === 1) assert.ok(t.includes(nom), t);
        for (const nom of noms.slice(n)) assert.ok(!t.includes(nom), t);
        const mots = t.split(/\s+/).length;
        assert.ok(mots <= 100, `${mots} mots : ${t}`);
      }
    }
  }
});

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// 7 · Les protections existantes sont inchangées
// ════════════════════════════════════════════════════════════════════════════════════════════════════

test("limite de deux questions : la troisième est refusée (402) sans budget ni modèle ; le cookie compte", async () => {
  const r = await recherche(CM[0], [...CM[1]], [...CM[2]]);
  const ctx = contexteDePage(r);
  const un = await poser(corps(ctx, "Que disent les inondations passées de ces communes ?"));
  assert.equal(un.json.remaining, 1);
  assert.match(un.res.headers.get("set-cookie")!, /comparateur_ask_count=1/);
  assert.equal(un.res.headers.get("X-Comparateur-Ask-Remaining"), "1");
  etat.appels = [];
  const deux = await poser(corps(ctx, "Et Saintes ?"), { cookie: "comparateur_ask_count=1" });
  assert.equal(deux.json.remaining, 0);
  assert.match(deux.res.headers.get("set-cookie")!, /comparateur_ask_count=2/);
  etat.appels = [];
  const trois = await poser(corps(ctx, "Et Rochefort ?"), { cookie: "comparateur_ask_count=2" });
  assert.equal(trois.res.status, 402);
  assert.deepEqual(trois.json, { error: "limit", limit: 2 });
  assert.deepEqual(etat.appels.map((a) => a.quoi), ["capture"]);
  assert.equal(etat.appels[0].detail!.event, "life_ask_limit_reached");
});

test("ordre des gardes : budget réservé après validation, juste avant le modèle ; budget épuisé → 503 sans modèle", async () => {
  const r = await recherche(CM[0], [...CM[1]], [...CM[2]]);
  const ctx = contexteDePage(r);
  await poser(corps(ctx, QUESTION_LR));
  assert.deepEqual(etat.appels.map((a) => a.quoi === "capture" ? a.detail!.event : a.quoi), ["life_ask_submitted", "budget", "modele", "life_ask_answered"]);
  assert.equal(etat.appels[1].detail!.p_poids, 2, "poids ask_comparateur inchangé");
  etat.appels = [];
  etat.budgetEpuise = true;
  const { res } = await poser(corps(ctx, QUESTION_LR));
  assert.equal(res.status, 503);
  assert.ok(!etat.appels.some((a) => a.quoi === "modele"));
});

test("contexte absent ou invalide : 400 avant tout budget et tout modèle", async () => {
  const r = await recherche(CM[0], [...CM[1]], [...CM[2]]);
  const ctx = contexteDePage(r);
  const invalides: [string, M | undefined, string][] = [
    ["sans contexte", undefined, "Contexte comparateur manquant."],
    ["sans territoires", { ...ctx, territoires: [] }, "Contexte comparateur manquant."],
    ["quatre territoires", { ...ctx, territoires: [...ctx.territoires!, ctx.territoires![0]] }, "Contexte comparateur invalide."],
    ["territoire sans nom", { ...ctx, territoires: [{ ...ctx.territoires![0], nom: "" }] }, "Contexte comparateur invalide."],
    ["territoire null", { ...ctx, territoires: [null] }, "Contexte comparateur invalide."],
  ];
  for (const [nom, c, erreur] of invalides) {
    etat.appels = [];
    const { res, json } = await poser({ question: QUESTION_LR, context: c, history: [] });
    assert.equal(res.status, 400, nom);
    assert.equal(json.error, erreur, nom);
    assert.deepEqual(etat.appels, [], `${nom} : ni budget, ni modèle, ni télémétrie`);
  }
  const court = await poser(corps(ctx, "ok"));
  assert.equal(court.res.status, 400);
});

test("limite par adresse : la sixième requête de la minute est refusée (429) avant le modèle", async () => {
  const r = await recherche(CM[0], [...CM[1]], [...CM[2]]);
  const ctx = contexteDePage(r);
  const statuts: number[] = [];
  for (let i = 0; i < 6; i++) {
    etat.appels = [];
    statuts.push((await poser(corps(ctx, "Que disent les inondations passées ?"), { adresse: "192.0.2.142" })).res.status);
  }
  assert.deepEqual(statuts, [200, 200, 200, 200, 200, 429]);
  assert.deepEqual(etat.appels, []);
});

test("sortie du modèle sans outil : 502 inchangé", async () => {
  const r = await recherche(CM[0], [...CM[1]], [...CM[2]]);
  const avant = g.__fut142.modele;
  g.__fut142.modele = async () => ({ content: [{ type: "text", text: "La Rochelle est le meilleur choix." }] });
  try {
    const { res } = await poser(corps(contexteDePage(r), QUESTION_LR));
    assert.equal(res.status, 502);
  } finally {
    g.__fut142.modele = avant;
  }
});

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// 8 · Le câblage : la page envoie bien ce contrat, le prompt a perdu ses présupposés
// ════════════════════════════════════════════════════════════════════════════════════════════════════

test("câblage : sendAsk construit son contexte avec contexteAsk, et le prompt n'affirme plus que le moteur a décidé", () => {
  const page = readFileSync("src/app/(public)/ou-vivre/OuVivreClient.tsx", "utf8");
  const envoi = page.slice(page.indexOf('fetch("/api/comparateur-vie/ask"'), page.indexOf("focus: null,", page.indexOf('fetch("/api/comparateur-vie/ask"')));
  assert.match(envoi, /context: contexteAsk\(\{/);
  assert.match(envoi, /inondationDeclaree:/);
  const route = readFileSync("src/app/api/comparateur-vie/ask/route.ts", "utf8");
  assert.doesNotMatch(route, /Le moteur a déjà\s+décidé/);
  assert.doesNotMatch(route, /expliquer POURQUOI le comparateur a fait ressortir/);
  for (const m of ['"classe"', '"exploration_inondation"', '"couverture_incomplete"', "LA PRÉMISSE DE LA QUESTION", "L'HISTORIQUE DE CONVERSATION"]) assert.ok(route.includes(m), m);
  // Appel réel n° 4 du 26/10 : en mode classé, le modèle a expliqué l'ordre par un trait hors classement.
  assert.match(route, /Seuls "raisons" et "compromis" expliquent l'ordre/);
  // Frontière inchangée : aucun accès à la donnée profonde, à l'index ou au moteur.
  const imports = route.split("\n").filter((l) => l.startsWith("import ")).join("\n");
  for (const interdit of ["commune-enrichment", "georisques", "comparateur-vie", "comparateur-index", "supabase"]) assert.ok(!imports.includes(interdit), interdit);
  assert.doesNotMatch(route, /matchProjects\(/);
});
