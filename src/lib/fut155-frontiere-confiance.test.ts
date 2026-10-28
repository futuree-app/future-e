// FUT-155 · LA FRONTIÈRE DE CONFIANCE DU COMPARATEUR : UN FAIT ABSENT, ILLISIBLE OU CONTRADICTOIRE N'EST PAS UNE CONCLUSION.
//
// /synthesize et /ask reçoivent du client ce que le moteur a calculé. Ni l'une ni l'autre ne peut l'attester : la
// réponse ne revient qu'à celui qui l'a demandée, rien n'est conservé, et un corps forgé ne trompe que son auteur.
// Ce qu'elles doivent garantir, c'est de ne jamais ÉLARGIR ce qui leur est transmis. Contre-épreuve du 29/10 :
//   - /synthesize lisait une couverture absente ou illisible comme « complete », et laissait passer « complete » à
//     côté d'une carte qui déclare des priorités non mesurées (/ask, elle, lit « inconnue » dans les trois cas) ;
//   - les deux routes transmettaient des raisons favorables à côté de « aucune priorité favorable », un état que le
//     moteur ne produit jamais ;
//   - /synthesize acceptait quarante communes, ou une commune sans nom, quand la page n'en envoie jamais plus de trois.
// Vrai moteur sur l'index réel ; les routes reçoivent un modèle simulé, aucun appel Anthropic.
import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { contexteAsk } from "./comparateur/lecture-ask.ts";
import { preferencesToLabels } from "./comparateur-labels.ts";

const racine = pathToFileURL(`${process.cwd()}/`).href;
const doubles: Record<string, string> = {
  "server-only": "export{}",
  "@anthropic-ai/sdk": "export default class { constructor() { this.messages = { create: (...a) => globalThis.__fut155.modele(...a) }; } }",
  "ai": "export function streamText(a) { return globalThis.__fut155.stream(a); }",
  "@ai-sdk/anthropic": "export function anthropic(m) { return m; }",
  "@/lib/posthog-server": "export function getPostHogClient() { return { capture() {}, async shutdown() {} }; }",
  "@supabase/supabase-js": "export function createClient() { return { rpc: async () => ({ data: false, error: null }) }; }",
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
let SYNTHESE: (r: unknown) => Promise<Response>;
let ASK: (r: unknown) => Promise<Response>;
let NextRequest: new (url: string, init: M) => unknown;
const etat: { synthese: M[]; modele: M[] } = { synthese: [], modele: [] };
(globalThis as M).__fut155 = {
  stream: (a: M) => {
    etat.synthese.push(a);
    return { textStream: (async function* () { yield "Synthèse simulée."; })() };
  },
  modele: async (req: M) => {
    etat.modele.push(req);
    return { content: [{ type: "tool_use", name: "askfuture_comparateur", input: { answer: "Réponse simulée.", routes_to_report: false, focus_rang: null } }] };
  },
};

const PARIS = [{ key: "cadre_calme", weight: 3 }, { key: "acces_culture", weight: 2 }]; // le calme n'est pas mesuré à Paris
const FEU = [{ key: "faible_risque_feu", weight: 3 }, { key: "faible_chaleur", weight: 3 }]; // aucune favorable dans le 13
const MER = [{ key: "faible_chaleur", weight: 3 }, { key: "acces_soins", weight: 2 }, { key: "proximite_mer", weight: 2 }];
const resultats: Record<string, { prefs: M[]; o: M }> = {};

before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  V = await import("./comparateur-vie.ts");
  ({ POST: SYNTHESE } = await import("../app/api/comparateur-vie/synthesize/route.ts"));
  ({ POST: ASK } = await import("../app/api/comparateur-vie/ask/route.ts"));
  ({ NextRequest } = await import("next/server.js" as string));
  const cherche = async (departements: string[] | null, prefs: M[]) =>
    ({ prefs, o: await V.matchProjects({ reformulation: "FUT-155", hardConstraints: departements ? { departements } : {}, preferences: prefs }) });
  resultats.paris = await cherche(["75"], PARIS);
  resultats.feu = await cherche(["13"], FEU);
  resultats.mer = await cherche(null, MER);
  // Les trois situations honnêtes que la contre-épreuve forge ensuite.
  assert.equal(resultats.paris.o.couverture, "partielle");
  assert.deepEqual(resultats.paris.o.results[0].couverture.nonMesurees, ["un cadre calme"]);
  assert.ok(resultats.feu.o.results.slice(0, 3).every((r: M) => r.sansPrioriteFavorable === true && r.reasons.length === 0));
  assert.equal(resultats.mer.o.couverture, "complete");
  assert.ok(resultats.mer.o.results.slice(0, 3).every((r: M) => r.reasons.length > 0 && !r.sansPrioriteFavorable));
});
beforeEach(() => { etat.synthese = []; etat.modele = []; });

let ip = 0;
/** Le corps EXACT que la page envoie (OuVivreClient, `streamSynthesis`). */
const corpsDeLaPage = (cas: string): M => {
  const { prefs, o } = resultats[cas];
  return {
    project: "FUT-155", reformulation: "FUT-155", preferences: prefs, heritageIntent: false,
    results: o.results.slice(0, 3).map((r: M) => ({
      nom: r.nom, region: r.region, reasons: r.reasons, tradeoff: r.tradeoff, distinctive: r.distinctive,
      prioritesNonMesurees: r.couverture?.nonMesurees ?? [], sansPrioriteFavorable: r.sansPrioriteFavorable === true,
    })),
    outcome: { perfectMatch: o.perfectMatch, message: o.message, exploration: o.inondation?.exploration ?? false, couverture: o.couverture ?? "complete" },
  };
};
const synthese = async (body: M) => {
  const res = await SYNTHESE(new NextRequest("http://localhost/api/comparateur-vie/synthesize", {
    method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", "x-forwarded-for": `10.155.0.${++ip}` },
  }));
  const appel = etat.synthese.at(-1);
  return { status: res.status, donnees: appel ? JSON.parse(appel.prompt.split("DONNÉES :\n")[1]) : null, system: appel?.system as string | undefined };
};
const ask = async (ctx: M) => {
  await ASK(new NextRequest("http://localhost/api/comparateur-vie/ask", {
    method: "POST", body: JSON.stringify({ question: "Laquelle regarder ?", context: ctx, focus: null, history: [], distinctId: "fut155" }),
    headers: { "content-type": "application/json", "x-forwarded-for": `10.155.1.${++ip}` },
  }));
  return JSON.parse(etat.modele.at(-1).messages.at(-1).content.split("\n\nQUESTION : ")[0].replace(/^[^\n]*\n/, ""));
};
const contexteDeLaPage = (cas: string) => {
  const { prefs, o } = resultats[cas];
  return contexteAsk({ reformulation: "FUT-155", criteres: preferencesToLabels(prefs), inondationDeclaree: false, outcome: o as never, synthese: "", top: o.results.slice(0, 3) as never });
};

// ── La couverture : absente, illisible ou contredite, elle est « inconnue », jamais « complete » ──────────────────

test("synthèse · parcours normal : la couverture du moteur passe telle quelle (partielle, complète)", async () => {
  assert.equal((await synthese(corpsDeLaPage("paris"))).donnees.couverture_des_priorites, "partielle");
  assert.equal((await synthese(corpsDeLaPage("mer"))).donnees.couverture_des_priorites, "complete");
  assert.equal((await synthese(corpsDeLaPage("feu"))).donnees.couverture_des_priorites, "complete");
});

test("synthèse · une couverture absente ou illisible est inconnue, jamais complète", async () => {
  const b = corpsDeLaPage("paris");
  for (const couverture of [undefined, null, "inconnue", "COMPLETE", 1]) {
    const { donnees } = await synthese({ ...b, outcome: { ...b.outcome, couverture } });
    assert.equal(donnees.couverture_des_priorites, "inconnue", String(couverture));
  }
  const sansOutcome = await synthese({ ...b, outcome: undefined });
  assert.equal(sansOutcome.donnees.couverture_des_priorites, "inconnue");
});

test("synthèse · « complete » contredite par une carte n'est pas crue (non mesurées déclarées, ou liste absente)", async () => {
  const b = corpsDeLaPage("paris");
  const contredite = await synthese({ ...b, outcome: { ...b.outcome, couverture: "complete" } });
  assert.equal(contredite.donnees.couverture_des_priorites, "inconnue");
  assert.deepEqual(contredite.donnees.territoires[0].priorites_non_mesurees, ["un cadre calme"], "la carte reste intacte");
  const m = corpsDeLaPage("mer");
  const sansListe = await synthese({ ...m, results: m.results.map(({ prioritesNonMesurees: _, ...r }: M) => r) });
  assert.equal(sansListe.donnees.couverture_des_priorites, "inconnue");
});

test("synthèse · la consigne dit quoi faire d'une couverture inconnue", async () => {
  const { system } = await synthese(corpsDeLaPage("paris"));
  assert.match(system!, /"partielle" ou "inconnue", ne dites pas que l'ensemble correspond au projet/);
});

// ── « Aucune priorité favorable » et des raisons favorables : la réserve gagne ─────────────────────────────────────

test("synthèse et ask · une carte marquée sans priorité favorable ne transmet aucune raison favorable", async () => {
  const b = corpsDeLaPage("feu");
  const forge = { ...b, results: b.results.map((r: M) => ({ ...r, reasons: ["météo moins propice aux feux"] })) };
  for (const t of (await synthese(forge)).donnees.territoires) {
    assert.deepEqual(t.raisons, [], t.commune);
    assert.equal(t.aucune_priorite_favorable, "toutes_mesurees");
  }
  const ctx = contexteDeLaPage("feu");
  const ctxForge = { ...ctx, territoires: ctx.territoires!.map((t) => ({ ...t, raisons: ["météo moins propice aux feux"] })) };
  for (const t of (await ask(ctxForge)).territoires) {
    assert.deepEqual(t.raisons, [], t.commune);
    assert.equal(t.aucune_priorite_favorable, "toutes_mesurees");
  }
});

test("synthèse et ask · parcours normal : les raisons du moteur passent intactes", async () => {
  const b = corpsDeLaPage("mer");
  const { donnees } = await synthese(b);
  assert.deepEqual(donnees.territoires.map((t: M) => t.raisons), b.results.map((r: M) => r.reasons));
  const ctx = contexteDeLaPage("mer");
  assert.deepEqual((await ask(ctx)).territoires.map((t: M) => t.raisons), ctx.territoires!.map((t) => t.raisons));
});

// ── Le cardinal : la page n'envoie jamais plus de trois communes, ni une commune sans nom ──────────────────────────

test("synthèse · plus de trois communes, ou une commune sans nom : refusé avant tout appel au modèle", async () => {
  const b = corpsDeLaPage("mer");
  assert.equal(b.results.length, 3);
  assert.equal((await synthese(b)).status, 200);
  etat.synthese = [];
  const quatre = await synthese({ ...b, results: [...b.results, { ...b.results[0], nom: "Quatrième" }] });
  assert.equal(quatre.status, 400);
  for (const r of [{ reasons: ["x"] }, { nom: "  " }, { nom: 42 }, null]) {
    assert.equal((await synthese({ ...b, results: [r] })).status, 400, JSON.stringify(r));
  }
  assert.equal(etat.synthese.length, 0, "aucun appel au modèle");
});
