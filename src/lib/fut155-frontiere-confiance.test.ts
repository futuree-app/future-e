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
import { readFileSync } from "node:fs";
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

// ── Passe 2 · le corps borné à 32 Kio, sur les octets réellement reçus ──────────────────────────────────────────

const MAX = 32 * 1024;
const octets = (s: string) => Buffer.byteLength(s, "utf8");
/** Le JSON de `base`, rembourré dans `champ` jusqu'à `cible` octets exactement (accents compris : 2 octets). */
function auxOctets(base: M, champ: (b: M, pad: string) => M, cible: number): string {
  const vide = JSON.stringify(champ(base, ""));
  const manque = cible - octets(vide);
  assert.ok(manque >= 0, `base déjà à ${octets(vide)} octets`);
  const pad = "é".repeat(Math.floor(manque / 2)) + "a".repeat(manque % 2);
  const s = JSON.stringify(champ(base, pad));
  assert.equal(octets(s), cible);
  return s;
}
const brut = async (route: "synthesize" | "ask", corps: BodyInit, entetes: Record<string, string> = {}) => {
  const POST = route === "synthesize" ? SYNTHESE : ASK;
  const init: M = { method: "POST", body: corps, headers: { "content-type": "application/json", "x-forwarded-for": `10.155.2.${++ip}`, ...entetes } };
  if (corps instanceof ReadableStream) init.duplex = "half";
  return POST(new NextRequest(`http://localhost/api/comparateur-vie/${route}`, init)) as Promise<Response>;
};
const flux = (s: string, morceau = 1000) => new ReadableStream({
  start(c) { const b = Buffer.from(s, "utf8"); for (let i = 0; i < b.length; i += morceau) c.enqueue(new Uint8Array(b.subarray(i, i + morceau))); c.close(); },
});
const corpsAsk = (ctx: M, extra: M = {}) => ({ question: "Laquelle regarder ?", context: ctx, focus: null, history: [], distinctId: "fut155", ...extra });

test("borne · /synthesize : 32 768 octets passent, 32 769 sont refusés en 413 sans appel ni budget", async () => {
  const pile = auxOctets(corpsDeLaPage("mer"), (b, pad) => ({ ...b, reformulation: `FUT-155 ${pad}` }), MAX);
  const ok = await brut("synthesize", pile);
  assert.equal(ok.status, 200);
  assert.equal(await ok.text(), "Synthèse simulée.");
  assert.equal(etat.synthese.length, 1);
  const trop = auxOctets(corpsDeLaPage("mer"), (b, pad) => ({ ...b, reformulation: `FUT-155 ${pad}` }), MAX + 1);
  const r = await brut("synthesize", trop);
  assert.equal(r.status, 413);
  assert.equal(etat.synthese.length, 1, "aucun appel de plus");
});

test("borne · /ask : 32 768 octets passent, 32 769 sont refusés en 413 sans appel", async () => {
  const ctx = contexteDeLaPage("mer");
  const avec = (b: M, pad: string) => ({ ...b, history: [{ role: "user", content: "Question ?" }, { role: "assistant", content: pad }] });
  const ok = await brut("ask", auxOctets(corpsAsk(ctx), avec, MAX));
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).answer, "Réponse simulée.");
  assert.equal(etat.modele.length, 1);
  const r = await brut("ask", auxOctets(corpsAsk(ctx), avec, MAX + 1));
  assert.equal(r.status, 413);
  assert.deepEqual(await r.json(), { error: "Corps trop volumineux." });
  assert.equal(etat.modele.length, 1, "aucun appel de plus");
});

test("borne · corps forgés : longues raisons, reformulation, historique, synthèse affichée → 413", async () => {
  const s = corpsDeLaPage("mer");
  const long = "raison forgée ".repeat(3000);
  for (const forge of [
    { ...s, results: s.results.map((r: M) => ({ ...r, reasons: [long] })) },
    { ...s, reformulation: long },
    { ...s, project: long },
  ]) assert.equal((await brut("synthesize", JSON.stringify(forge))).status, 413);
  const ctx = contexteDeLaPage("mer");
  for (const forge of [
    corpsAsk({ ...ctx, reformulation: long }),
    corpsAsk({ ...ctx, synthese: long }),
    corpsAsk(ctx, { history: Array.from({ length: 6 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: long.slice(0, 7000) })) }),
    corpsAsk(ctx, { question: long }),
  ]) assert.equal((await brut("ask", JSON.stringify(forge))).status, 413);
  assert.equal(etat.synthese.length + etat.modele.length, 0);
});

test("borne · les octets comptent, pas Content-Length : flux sans en-tête, ou en-tête qui ment", async () => {
  const trop = auxOctets(corpsDeLaPage("mer"), (b, pad) => ({ ...b, reformulation: pad }), MAX + 1);
  assert.equal((await brut("synthesize", flux(trop))).status, 413, "flux sans Content-Length");
  assert.equal((await brut("synthesize", flux(trop), { "content-length": "100" })).status, 413, "en-tête qui sous-déclare");
  const pile = auxOctets(corpsDeLaPage("mer"), (b, pad) => ({ ...b, reformulation: pad }), MAX);
  assert.equal((await brut("synthesize", flux(pile, 777))).status, 200, "à la borne, en morceaux");
  // Annoncé trop gros : refusé sans lire.
  assert.equal((await brut("ask", JSON.stringify(corpsAsk(contexteDeLaPage("mer"))), { "content-length": String(MAX + 1) })).status, 413);
  assert.equal(etat.synthese.length, 1);
  assert.equal(etat.modele.length, 0);
});

test("borne · les corps légitimes les plus lourds passent ; seul un pire cas pathologique est refusé", async () => {
  // Tous les récits activés (inondation, démographie, calme, sites industriels, héritage, littoral, logement) et
  // un projet au maximum de la page (2 000 caractères, tous accentués).
  const prefs = [
    { key: "faible_risque_inondation", weight: 3 }, { key: "croissance_demographique", weight: 2 }, { key: "calme_sonore", weight: 2 },
    { key: "faible_exposition_industrielle", weight: 2 }, { key: "proximite_mer", weight: 2 }, { key: "acces_soins", weight: 1 },
  ];
  const o = await V.matchProjects({ reformulation: "R".repeat(400), hardConstraints: {}, preferences: prefs, heritageIntent: true });
  const top = o.results.slice(0, 3);
  const synth = {
    project: "é".repeat(2000), reformulation: "é".repeat(400), preferences: prefs, heritageIntent: true,
    results: top.map((r: M) => ({
      nom: r.nom, region: r.region, reasons: r.reasons, tradeoff: r.tradeoff, pressionEco: r.pressionEco?.note ?? null,
      logement: r.logement, littoral: r.littoral, distinctive: r.distinctive, climatInondation: r.climatInondation,
      demographie: r.demographie, calmeSonore: r.calmeSonore, expoIndustrielle: r.expoIndustrielle, heritageIndustriel: r.heritageIndustriel,
      inondation: r.inondation ?? null, prioritesNonMesurees: r.couverture?.nonMesurees ?? [], sansPrioriteFavorable: r.sansPrioriteFavorable === true,
    })),
    outcome: { perfectMatch: o.perfectMatch, message: o.message, exploration: o.inondation?.exploration, couverture: o.couverture },
    perimetre: [], orientation: [],
  };
  const tailleSynth = octets(JSON.stringify(synth));
  // /ask : une synthèse au plafond de sortie (1 000 jetons, ~4 500 caractères), des questions de 1 000 caractères
  // (la page n'en borne pas la longueur) et des réponses au plafond de /ask (600 jetons, ~2 700 caractères).
  const fr = (n: number) => "Une phrase française ordinaire, où les accents pèsent deux octets à côté des autres. ".repeat(60).slice(0, n);
  const echange = (t: (n: number) => string, tours: number) =>
    Array.from({ length: tours }, () => [{ role: "user", content: t(1000) }, { role: "assistant", content: t(2700) }]).flat();
  const corpsDe = (t: (n: number) => string, tours: number) => corpsAsk(
    contexteAsk({ reformulation: t(400), criteres: preferencesToLabels(prefs), inondationDeclaree: true, outcome: o as never, synthese: t(4500), top: top as never }),
    { question: t(1000), history: echange(t, tours) },
  );
  // Parcours gratuit : la deuxième et dernière question porte une question et une réponse d'historique.
  const gratuit = octets(JSON.stringify(corpsDe(fr, 1)));
  // Cookie effacé : l'historique plein que la page envoie (six messages).
  const plein = octets(JSON.stringify(corpsDe(fr, 3)));
  // Le même, tout en caractères accentués (deux octets chacun) : le pire cas mesurable.
  const corps = corpsDe((n) => "é".repeat(n), 3);
  const tailleExtreme = octets(JSON.stringify(corps));
  console.log(`FUT-155 · corps légitimes : /synthesize ${tailleSynth} o ; /ask parcours gratuit ${gratuit} o, historique plein ${plein} o, tout accentué ${tailleExtreme} o (borne ${MAX})`);
  assert.ok(tailleSynth < MAX / 2, `synthèse : ${tailleSynth}`);
  assert.ok(gratuit < MAX / 2, `ask gratuit : ${gratuit}`);
  assert.ok(plein < MAX * 0.75, `ask plein : ${plein}`);
  // Ce pire cas dépasse : la page ne borne pas la longueur d'une question. Il reçoit un refus propre (réserve au PR).
  assert.ok(tailleExtreme > MAX, `ask extrême : ${tailleExtreme}`);
  assert.equal((await brut("ask", JSON.stringify(corps))).status, 413);
  const r1 = await brut("synthesize", JSON.stringify(synth));
  assert.equal(r1.status, 200);
  assert.equal(await r1.text(), "Synthèse simulée.");
  const r2 = await brut("ask", JSON.stringify(corpsDe(fr, 3)));
  assert.equal(r2.status, 200);
  assert.equal((await r2.json()).answer, "Réponse simulée.");
});

test("sortie · la synthèse borne sa génération (le fournisseur appliquait 128 000 jetons)", async () => {
  await synthese(corpsDeLaPage("mer"));
  assert.equal(etat.synthese[0].maxOutputTokens, 1000);
});

// ── Passe 2 · aucun repli favorable côté page, ni côté route, sur un état absent ────────────────────────────────

test("route · inondation déclarée sans mode lisible : couverture inconnue, jamais un classement", async () => {
  const prefs = [{ key: "faible_risque_inondation", weight: 3 }, { key: "faible_chaleur", weight: 3 }];
  const o = await V.matchProjects({ reformulation: "FUT-155", hardConstraints: {}, preferences: prefs });
  assert.equal(o.inondation.exploration, false, "le moteur donne toujours le mode");
  resultats.inond = { prefs, o };
  const b = corpsDeLaPage("inond");
  const normal = await synthese(b);
  assert.equal(normal.donnees.couverture_des_priorites, o.couverture);
  assert.equal(normal.donnees.exploration_sans_classement, false);
  for (const exploration of [undefined, null, "false"]) {
    const { donnees } = await synthese({ ...b, outcome: { ...b.outcome, exploration } });
    assert.equal(donnees.couverture_des_priorites, "inconnue", String(exploration));
    assert.equal(donnees.exploration_sans_classement, false);
  }
  // Sans inondation déclarée, le mode n'a pas à être transmis.
  const m = corpsDeLaPage("mer");
  assert.equal((await synthese({ ...m, outcome: { ...m.outcome, exploration: undefined } })).donnees.couverture_des_priorites, "complete");
});

test("page · le repli de synthèse : parcours normal inchangé, état absent sans arbitrage ni classement", async () => {
  const { repliSynthese, REPLI_ETAT_INCONNU } = await import("./comparateur/synthese-repli.ts");
  const p = { reformulation: "Projet.", preferences: MER };
  const top = resultats.mer.o.results.slice(0, 3);
  const complet = repliSynthese(p, top, false, { etat: "complete", message: null });
  assert.match(complet, /Les territoires qui ressortent se distinguent notamment par .* Aucun ne réunit tout/);
  const pa = resultats.paris.o;
  assert.equal(repliSynthese({ reformulation: "Projet.", preferences: PARIS }, pa.results, false, { etat: pa.couverture, message: pa.message }), `Projet. ${pa.message}`);
  for (const etatAbsent of [undefined, null]) {
    const r = repliSynthese(p, top, undefined, { etat: etatAbsent, message: null });
    assert.equal(r, `Projet. ${REPLI_ETAT_INCONNU}`);
    assert.doesNotMatch(r, /ressortent|arbitrage|réunit/);
  }
  // Inondation déclarée : exploration inconnue ne s'annonce pas comme une exploration, et ne classe rien.
  const pi = { reformulation: "Projet.", preferences: [{ key: "faible_risque_inondation" }] };
  const inconnu = repliSynthese(pi, top, undefined, { etat: undefined, message: null });
  assert.match(inconnu, /L'inondation ne favorise aucune commune/);
  assert.doesNotMatch(inconnu, /communes à explorer, sans classement favorable/);
  assert.match(repliSynthese(pi, top, true, { etat: "sans_priorite", message: null }), /communes à explorer, sans classement favorable/);
});

test("page · plus aucun repli « complete » ni « false » sur un état absent", () => {
  const client = readFileSync("src/app/(public)/ou-vivre/OuVivreClient.tsx", "utf8");
  assert.doesNotMatch(client, /\?\? "complete"/);
  assert.doesNotMatch(client, /exploration \?\? false/);
  assert.match(client, /exploration: matchOutcome\.inondation\?\.exploration,\n\s+couverture: matchOutcome\.couverture,/);
  assert.match(client, /exploration: outcomeMeta\.exploration, couverture: outcomeMeta\.couverture \}/);
  assert.match(client, /\(outcome\?\.couverture !== "complete" \|\| top\.some\(\(r\) => r\.sansPrioriteFavorable\)\) \? \(\n\s+outcome\?\.message \? <>\{outcome\.message\}<\/> : null/);
});
