// FUT-151 · UNE COMMUNE QUI NE SATISFAIT AUCUNE PRIORITÉ N'AFFICHE AUCUN AVANTAGE FABRIQUÉ.
//
// Reproduction : Châteauneuf-le-Rouge (13), recherche « faible exposition aux feux ». Sous-score 3/100, et la carte
// disait à la fois « + météo moins propice aux feux » (repli sur le meilleur critère relatif) et « Compromis :
// météo plus souvent propice aux feux ». Ces tests vérifient ce que les cartes RACONTENT, pas seulement qu'elles
// apparaissent : chaque texte est ramené à la priorité qu'il exprime, puis confronté à son sous-score.
// Vrai moteur sur l'index réel ; les routes de synthèse et d'AskFuture reçoivent un modèle simulé, aucun appel Anthropic.
import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { contexteAsk } from "./comparateur/lecture-ask.ts";
import { libelleCarteSansFavorable, phraseSansFavorable, porteeSansFavorable } from "./comparateur/portee-favorable.ts";
import { preferencesToLabels } from "./comparateur-labels.ts";

const racine = pathToFileURL(`${process.cwd()}/`).href;
const doubles: Record<string, string> = {
  "server-only": "export{}",
  "@anthropic-ai/sdk": "export default class { constructor() { this.messages = { create: (...a) => globalThis.__fut151.modele(...a) }; } }",
  "ai": "export function streamText(a) { return globalThis.__fut151.stream(a); }",
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
(globalThis as M).__fut151 = {
  stream: (a: M) => {
    etat.synthese.push(a);
    return { textStream: (async function* () { yield "Synthèse simulée."; })() };
  },
  modele: async (req: M) => {
    etat.modele.push(req);
    return { content: [{ type: "tool_use", name: "askfuture_comparateur", input: { answer: "Réponse simulée.", routes_to_report: false, focus_rang: null } }] };
  },
};

before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  V = await import("./comparateur-vie.ts");
  ({ POST: SYNTHESE } = await import("../app/api/comparateur-vie/synthesize/route.ts"));
  ({ POST: ASK } = await import("../app/api/comparateur-vie/ask/route.ts"));
  ({ NextRequest } = await import("next/server.js" as string));
});
beforeEach(() => { etat.synthese = []; etat.modele = []; });

const recherche = (departements: string[] | null, preferences: M[]) =>
  V.matchProjects({ reformulation: "FUT-151", hardConstraints: departements ? { departements } : {}, preferences });

// ── Ramener chaque texte rendu à la priorité qu'il exprime ──────────────────────────────────────────
const cles = (): string[] => V.PREFERENCE_KEYS;
/** Les priorités dont la phrase POSITIVE est ce texte, pour cette commune. */
const clesPositives = (texte: string | null, c: M): string[] => (texte ? cles().filter((k) => V.reasonText(k, c) === texte) : []);
/** Les priorités qu'un compromis présente comme un retrait (absolu ou « qu'à X »). */
function clesNegatives(texte: string | null, c: M): string[] {
  if (!texte) return [];
  const t = texte.replace(/^En échange, /, "").replace(/\.$/, "");
  return cles().filter((k) => V.raisonNeg(k, c) === t || (V.COMPROMIS_NEG[k] && t.startsWith(`${V.COMPROMIS_NEG[k]} qu'à `)));
}
// Les traits distinctifs qui louent une priorité (cf. `key` dans buildDistinctive).
const DISTINCTIF: [RegExp, string][] = [
  [/^la plus proche de grands espaces naturels/, "nature"],
  [/^le meilleur accès aux médecins/, "acces_soins"],
  [/^le bassin d'emploi le plus dynamique/, "viabilite_emploi"],
  [/^les étés les plus supportables/, "faible_chaleur"],
  [/^les hivers les plus doux/, "douceur_climat"],
];
const cleDistinctive = (t: string | null) => (t ? DISTINCTIF.find(([re]) => re.test(t))?.[1] ?? null : null);

/** La lecture d'une carte ramenée à ses priorités : ce qu'elle loue, ce qu'elle présente comme un retrait. */
async function lecture(r: M, declarees: string[]) {
  const c = await V.getCommuneEntry(r.insee);
  assert.ok(c, `${r.nom} dans l'index`);
  const raisons = r.reasons.map((t: string) => {
    const k = clesPositives(t, c).filter((x) => declarees.includes(x));
    assert.ok(k.length > 0, `${r.nom} : la raison « ${t} » se rattache à une priorité déclarée`);
    return k;
  }).flat();
  const decouverte = clesPositives(r.decouverte, c);
  const compromis = clesNegatives(r.compromis, c);
  const tradeoff = r.tradeoff ? [...clesNegatives(`En échange, ${r.tradeoff}.`, c)] : [];
  return { c, raisons, decouverte, compromis, tradeoff, distinctive: cleDistinctive(r.distinctive) };
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// 1 · La reproduction du ticket
// ════════════════════════════════════════════════════════════════════════════════════════════════════

test("Châteauneuf-le-Rouge, feux : aucune raison fabriquée, l'absence de priorité favorable est dite", async () => {
  const o = await recherche(["13"], [{ key: "faible_risque_feu", weight: 3 }]);
  const r = o.results.find((x: M) => x.nom === "Châteauneuf-le-Rouge");
  assert.ok(r, "Châteauneuf-le-Rouge reste proposée (le classement ne change pas)");
  const c = await V.getCommuneEntry(r.insee);
  assert.ok(V.subScore("faible_risque_feu", c) < V.SEUIL_RAISON, "le sous-score feu est bien défavorable");
  assert.deepEqual(r.reasons, []);
  assert.equal(r.sansPrioriteFavorable, true);
  // Plus aucune lecture ne dit le point fort fabriqué ; le compromis, lui, reste dit.
  const lu = [r.reasons.join(" "), r.decouverte, r.distinctive].join(" | ");
  assert.doesNotMatch(lu, /moins propice aux feux/);
  assert.match(r.compromis, /plus souvent propice aux feux/);
  // Aucune carte de la recherche (trio et pistes) ne loue la météo des feux.
  for (const x of [...o.results.slice(0, 3), ...o.pistes]) {
    assert.deepEqual(x.reasons, [], x.nom);
    assert.equal(x.sansPrioriteFavorable, true, x.nom);
  }
  assert.equal(o.message, V.MESSAGE_SANS_FAVORABLE);
  assert.doesNotMatch(o.message, /correspond|convenir|réunit/);
});

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// 2 · Un, plusieurs, aucun critère favorable ; critères manquants
// ════════════════════════════════════════════════════════════════════════════════════════════════════

test("un critère favorable (feux, Finistère–Morbihan) : la raison est dite, et seulement si le sous-score l'établit", async () => {
  const o = await recherche(["29", "56"], [{ key: "faible_risque_feu", weight: 3 }]);
  for (const r of o.results.slice(0, 3)) {
    const c = await V.getCommuneEntry(r.insee);
    assert.ok(V.subScore("faible_risque_feu", c) >= V.SEUIL_RAISON, r.nom);
    assert.deepEqual(r.reasons, ["météo moins propice aux feux"], r.nom);
    assert.equal(r.sansPrioriteFavorable, undefined, r.nom);
  }
  assert.notEqual(o.message, V.MESSAGE_SANS_FAVORABLE);
});

test("plusieurs critères favorables (soins + nature, 17) : chaque raison est une priorité déclarée au-dessus du seuil", async () => {
  const prefs = [{ key: "acces_soins", weight: 2 }, { key: "nature", weight: 3 }];
  const o = await recherche(["17"], prefs);
  for (const r of o.results.slice(0, 3)) {
    const { c, raisons } = await lecture(r, prefs.map((p) => p.key));
    assert.ok(raisons.length >= 1, r.nom);
    for (const k of raisons) assert.ok(V.subScore(k, c) >= V.SEUIL_RAISON, `${r.nom} : ${k}`);
    // Les priorités au-dessus du seuil sont toutes dites, dans l'ordre du projet (poids, puis ordre déclaré).
    const attendues = ["nature", "acces_soins"].filter((k) => V.subScore(k, c) >= V.SEUIL_RAISON);
    assert.deepEqual(raisons, attendues, r.nom);
  }
});

test("mélange (feux + soins, 13) : une carte dit ses vraies raisons, jamais la priorité sous le seuil", async () => {
  const prefs = [{ key: "faible_risque_feu", weight: 3 }, { key: "acces_soins", weight: 3 }];
  const o = await recherche(["13"], prefs);
  for (const r of [...o.results.slice(0, 3), ...o.pistes]) {
    const { c, raisons } = await lecture(r, prefs.map((p) => p.key));
    for (const k of raisons) assert.ok(V.subScore(k, c) >= V.SEUIL_RAISON, `${r.nom} : ${k}`);
    if (V.subScore("faible_risque_feu", c) < V.SEUIL_RAISON) assert.ok(!raisons.includes("faible_risque_feu"), r.nom);
    const aucune = prefs.every((p) => (V.subScore(p.key, c) ?? 0) < V.SEUIL_RAISON);
    assert.equal(r.sansPrioriteFavorable === true, aucune, r.nom);
  }
});

test("critères manquants : une priorité non mesurée n'est ni une raison ni une absence de priorité favorable", async () => {
  // Paris : le calme n'est pas mesuré, la culture l'est (couverture partielle) ; puis le calme seul (aucune).
  const partielle = await recherche(["75"], [{ key: "cadre_calme", weight: 3 }, { key: "acces_culture", weight: 2 }]);
  const p = partielle.results[0];
  assert.equal(p.couverture.etat, "partielle");
  for (const t of p.reasons) assert.ok(!/calme/.test(t), "le calme non mesuré n'est jamais une raison");
  const aucune = await recherche(["75"], [{ key: "cadre_calme", weight: 3 }]);
  const a = aucune.results[0];
  assert.equal(a.couverture.etat, "aucune");
  assert.deepEqual(a.reasons, []);
  assert.equal(a.sansPrioriteFavorable, undefined, "rien de mesuré : la couverture le dit, pas ce marqueur");
  // Sans priorité du tout, rien n'est marqué non plus.
  const sans = await recherche(["17"], []);
  for (const r of sans.results.slice(0, 3)) assert.equal(r.sansPrioriteFavorable, undefined, r.nom);
});

test("trois communes toutes défavorables : trois cartes sans raison, message honnête, comparaison sans point fort inventé", async () => {
  for (const [dep, prefs] of [
    [["13"], [{ key: "faible_risque_feu", weight: 3 }, { key: "faible_chaleur", weight: 2 }]],
    [["83"], [{ key: "faible_secheresse", weight: 3 }]],
    [["48"], [{ key: "acces_transports", weight: 3 }, { key: "mobilite_quotidienne", weight: 2 }]],
  ] as const) {
    const o = await recherche([...dep], [...prefs]);
    const top = o.results.slice(0, 3);
    assert.equal(top.length, 3);
    for (const r of top) {
      assert.deepEqual(r.reasons, [], `${dep} ${r.nom}`);
      assert.equal(r.sansPrioriteFavorable, true, `${dep} ${r.nom}`);
    }
    assert.equal(o.message, V.MESSAGE_SANS_FAVORABLE, dep.join());
  }
});

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// 3 · Aucune lecture ne dit un même critère point fort ET compromis (balayage de l'index réel)
// ════════════════════════════════════════════════════════════════════════════════════════════════════

const PROJETS: M[][] = [
  [{ key: "faible_risque_feu", weight: 3 }],
  [{ key: "faible_chaleur", weight: 3 }, { key: "acces_soins", weight: 2 }],
  [{ key: "acces_soins", weight: 3 }, { key: "calme_sonore", weight: 2 }, { key: "air_sain", weight: 1 }],
  [{ key: "nature", weight: 3 }, { key: "vie_locale", weight: 2 }, { key: "faible_secheresse", weight: 2 }],
  [{ key: "acces_transports", weight: 3 }, { key: "faible_dependance_auto", weight: 2 }, { key: "acces_services", weight: 2 }],
  [{ key: "viabilite_emploi", weight: 3 }, { key: "acces_ecoles", weight: 2 }, { key: "douceur_climat", weight: 1 }],
];
const DEPTS = [null, ["13"], ["84"], ["06"], ["29"], ["59"], ["63"], ["33"], ["67"], ["2A"], ["48"], ["75"]];

test("balayage : raisons au-dessus du seuil, marqueur exact, et jamais un critère loué et retiré sur la même carte", async () => {
  let cartes = 0;
  let sansFavorable = 0;
  for (const dep of DEPTS) for (const prefs of PROJETS) {
    const o = await recherche(dep, prefs);
    const declarees = prefs.map((p) => p.key);
    for (const r of [...o.results.slice(0, 3), ...o.pistes]) {
      cartes++;
      const { c, raisons, decouverte, compromis, tradeoff, distinctive } = await lecture(r, declarees);
      const ctx = `${dep ?? "France"} ${declarees.join("+")} · ${r.nom}`;
      for (const k of raisons) assert.ok(V.subScore(k, c) >= V.SEUIL_RAISON, `${ctx} : raison ${k} sous le seuil`);
      const mesurees = declarees.filter((k) => V.subScore(k, c) != null);
      const aucune = mesurees.length > 0 && mesurees.every((k) => V.subScore(k, c) < V.SEUIL_RAISON);
      assert.equal(r.sansPrioriteFavorable === true, aucune, `${ctx} : marqueur`);
      if (aucune) { sansFavorable++; assert.deepEqual(r.reasons, [], ctx); }
      // La carte : sa confirmation (reasons[0]) et sa découverte, face à son compromis.
      const louees = new Set([...raisons, ...decouverte]);
      for (const k of compromis) assert.ok(!louees.has(k), `${ctx} : « ${k} » à la fois point fort et compromis`);
      // Revue FUT-151 : un critère favorable dans l'absolu n'est jamais un compromis ; la formulation absolue d'un
      // simple retrait (sans « qu'à X ») suppose une vraie faiblesse ; une vraie faiblesse reste dite.
      for (const k of compromis) {
        const sc = V.subScore(k, c);
        assert.ok(sc == null || sc < V.SEUIL_RAISON, `${ctx} : compromis « ${k} » sur un critère favorable (${Math.round(sc)})`);
        if (!/ qu'à /.test(r.compromis) && !tradeoff.includes(k)) assert.ok(sc < V.SEUIL_FAIBLESSE, `${ctx} : « ${r.compromis} » pour ${Math.round(sc)}`);
      }
      if (r.tradeoff) assert.ok(r.compromis, `${ctx} : faiblesse absolue « ${r.tradeoff} » tue`);
      // Le trait distinctif (synthèse, AskFuture) ne loue ni le compromis de la carte ni sa faiblesse absolue.
      if (distinctive) {
        assert.ok(!compromis.includes(distinctive), `${ctx} : distinctif sur le compromis (${r.distinctive})`);
        assert.ok(!tradeoff.includes(distinctive), `${ctx} : distinctif sur la faiblesse absolue (${r.distinctive})`);
      }
    }
  }
  assert.ok(cartes > 300, `assez de cartes lues (${cartes})`);
  assert.ok(sansFavorable > 20, `le balayage contient des cartes sans priorité favorable (${sansFavorable})`);
});

// Les trois contradictions que le balayage trouvait sur le code de base, chacune sur un champ différent.
const carte = async (dep: string[] | null, prefs: M[], nom: string) => {
  const o = await recherche(dep, prefs);
  const r = [...o.results.slice(0, 3), ...o.pistes].find((x: M) => x.nom === nom);
  assert.ok(r, `${nom} proposée`);
  return r;
};

test("compromis : Bagnères-de-Bigorre n'est plus « bon accès aux médecins » ET « zone sous-dotée en médecins »", async () => {
  const r = await carte(null, [{ key: "faible_chaleur", weight: 3 }, { key: "acces_soins", weight: 2 }], "Bagnères-de-Bigorre");
  assert.ok(r.reasons.includes("bon accès aux médecins"));
  assert.doesNotMatch(r.compromis, /médecins|soins/);
});

test("découverte : Breil-sur-Roya ne loue plus le calme que son compromis lui retire", async () => {
  const r = await carte(["06"], [{ key: "faible_chaleur", weight: 3 }, { key: "acces_soins", weight: 2 }], "Breil-sur-Roya");
  // Sur 1f75afd : découverte « à l'écart des grandes infrastructures bruyantes » (calme 95/100), compromis « environnement
  // assez maillé d'infrastructures bruyantes ». Le calme n'est plus ni l'un ni l'autre à la fois, et n'est plus un compromis.
  const loueLeCalme = r.decouverte === "à l'écart des grandes infrastructures bruyantes";
  assert.ok(!(loueLeCalme && /bruyant/.test(r.compromis)), "le même critère loué et retiré");
  assert.doesNotMatch(r.compromis, /bruyant/, "calme 95/100 : pas un compromis");
});

test("trait distinctif : Vaison-la-Romaine n'a plus « les étés les plus supportables » à côté de « étés chauds »", async () => {
  const r = await carte(["84"], [{ key: "acces_soins", weight: 3 }, { key: "calme_sonore", weight: 2 }, { key: "air_sain", weight: 1 }], "Vaison-la-Romaine");
  assert.equal(r.compromis, "En échange, étés chauds."); // FUT-154 : « chaleur en hausse » jusque-là
  assert.doesNotMatch(r.distinctive ?? "", /étés/);
});

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// 4 · Comparaison : une avance relative n'est jamais dite comme un point fort
// ════════════════════════════════════════════════════════════════════════════════════════════════════

test("comparaison : « se distingue par » ne nomme que des points forts au palier favorable", async () => {
  let relatives = 0;
  for (const dep of DEPTS) for (const prefs of PROJETS.slice(0, 3)) {
    const o = await recherche(dep, prefs);
    const trio = o.results.slice(0, 3);
    if (trio.length < 2) continue;
    const nom = new Map(trio.map((r: M) => [r.insee, r.nom]));
    const entree = new Map<string, M>();
    for (const r of trio) entree.set(r.insee, await V.getCommuneEntry(r.insee));
    for (const th of o.comparaisonComplete.themes) {
      for (const l of th.lignes) {
        if (l.avantage.type !== "avantage" || l.avantage.insees.length !== 1) continue;
        const dim = V.DIMENSIONS.find((d: M) => d.id === l.id);
        const lead = l.avantage.insees[0];
        const cell = l.cellules.find((x: M) => x.insee === lead);
        // Le palier favorable, celui de la matrice (bandIndex : sous-score ≥ 66).
        const favorable = (V.subScore(dim.key, entree.get(lead)) ?? 0) >= 66;
        // La forme « se distingue par sa météo moins propice aux feux » n'apparaît que pour un palier favorable.
        if (!favorable && th.synthese.includes(`${nom.get(lead)} se distingue par`)) {
          assert.ok(!th.synthese.includes(dim.forte), `${th.id} : « ${dim.forte} » dit pour un palier « ${cell.palier} »`);
        }
        if (!favorable && /à un niveau intermédiaire/.test(th.synthese)) relatives++;
      }
      if (/fait mieux que/.test(th.synthese)) assert.match(th.synthese, /à un niveau intermédiaire\.$/);
    }
  }
  assert.ok(relatives > 0, "le balayage rencontre des avances relatives dites comme telles");
});

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// 5 · Ce qui part vers la synthèse et AskFuture (modèle simulé)
// ════════════════════════════════════════════════════════════════════════════════════════════════════

test("synthèse : la vraie route transmet l'absence de priorité favorable, et sa consigne interdit d'en faire un atout", async () => {
  const o = await recherche(["13"], [{ key: "faible_risque_feu", weight: 3 }]);
  const top = o.results.slice(0, 3);
  // Le corps exact de `runSynthesis` (OuVivreClient) pour les champs concernés.
  const body = {
    project: "Je veux être loin des feux, dans les Bouches-du-Rhône.",
    reformulation: "FUT-151",
    preferences: [{ key: "faible_risque_feu", weight: 3 }],
    results: top.map((r: M) => ({ nom: r.nom, region: r.region, reasons: r.reasons, tradeoff: r.tradeoff, distinctive: r.distinctive, prioritesNonMesurees: r.couverture?.nonMesurees ?? [], sansPrioriteFavorable: r.sansPrioriteFavorable === true })),
    outcome: { perfectMatch: o.perfectMatch, message: o.message, exploration: false, couverture: o.couverture },
  };
  const res = await SYNTHESE(new NextRequest("http://localhost/api/comparateur-vie/synthesize", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", "x-forwarded-for": "10.151.0.1" } }));
  assert.equal(res.status, 200);
  assert.equal(await res.text(), "Synthèse simulée.");
  const appel = etat.synthese[0];
  const payload = JSON.parse(appel.prompt.split("DONNÉES :\n")[1]);
  assert.equal(payload.message_moteur, V.MESSAGE_SANS_FAVORABLE);
  for (const t of payload.territoires) {
    assert.deepEqual(t.raisons, [], t.commune);
    assert.equal(t.aucune_priorite_favorable, "toutes_mesurees", t.commune);
  }
  assert.doesNotMatch(appel.prompt, /moins propice aux feux/);
  assert.match(appel.system, /Si un territoire porte "aucune_priorite_favorable", aucune des priorités MESURÉES/);
  assert.match(appel.system, /ne présentez jamais un critère demandé comme son point\s+fort/);
  // Une commune qui a des raisons ne porte pas le marqueur (un `false` n'est jamais traduit en « vrai »).
  etat.synthese = [];
  const fav = await recherche(["29", "56"], [{ key: "faible_risque_feu", weight: 3 }]);
  const b2 = { ...body, results: fav.results.slice(0, 3).map((r: M) => ({ nom: r.nom, reasons: r.reasons, sansPrioriteFavorable: r.sansPrioriteFavorable === true })) };
  await SYNTHESE(new NextRequest("http://localhost/api/comparateur-vie/synthesize", { method: "POST", body: JSON.stringify(b2), headers: { "content-type": "application/json", "x-forwarded-for": "10.151.0.2" } }));
  const p2 = JSON.parse(etat.synthese[0].prompt.split("DONNÉES :\n")[1]);
  for (const t of p2.territoires) assert.equal(t.aucune_priorite_favorable, null, t.commune);
});

test("AskFuture : le contexte construit par la page porte le marqueur, la route le transmet au modèle et sa consigne le lit", async () => {
  const prefs = [{ key: "faible_risque_feu", weight: 3 }];
  const o = await recherche(["13"], prefs);
  const top = o.results.slice(0, 3);
  const ctx = contexteAsk({
    reformulation: "FUT-151", criteres: preferencesToLabels(prefs), inondationDeclaree: false,
    outcome: { ...o, couverture: V.couvertureDesResultats(top) } as never, synthese: "Synthèse affichée.", top: top as never,
  });
  for (const t of ctx.territoires!) {
    assert.deepEqual(t.raisons, [], t.nom);
    assert.equal(t.aucune_priorite_favorable, true, t.nom);
  }
  const res = await ASK(new NextRequest("http://localhost/api/comparateur-vie/ask", {
    method: "POST",
    body: JSON.stringify({ question: "Pourquoi Châteauneuf-le-Rouge ressort-elle pour les feux ?", context: ctx, focus: null, history: [], distinctId: "fut151" }),
    headers: { "content-type": "application/json", "x-forwarded-for": "10.151.1.1" },
  }));
  assert.equal(res.status, 200);
  const req = etat.modele[0];
  assert.ok(req, "le modèle simulé a été appelé");
  const contexte = JSON.parse(req.messages.at(-1).content.split("\n\nQUESTION : ")[0].replace(/^[^\n]*\n/, ""));
  for (const t of contexte.territoires) {
    assert.deepEqual(t.raisons, [], t.commune);
    assert.equal(t.aucune_priorite_favorable, "toutes_mesurees", t.commune);
  }
  const systeme = typeof req.system === "string" ? req.system : JSON.stringify(req.system);
  assert.match(systeme, /Quel que soit le mode, un territoire qui porte "aucune_priorite_favorable" n'atteint/);
  // Un contexte forgé qui n'envoie rien ne devient jamais « aucune priorité favorable » (ni l'inverse).
  etat.modele = [];
  const forge = { ...ctx, territoires: ctx.territoires!.map((t) => ({ ...t, aucune_priorite_favorable: "oui" as never })) };
  await ASK(new NextRequest("http://localhost/api/comparateur-vie/ask", {
    method: "POST",
    body: JSON.stringify({ question: "Et l'été ?", context: forge, focus: null, history: [], distinctId: "fut151b" }),
    headers: { "content-type": "application/json", "x-forwarded-for": "10.151.1.2" },
  }));
  const c2 = JSON.parse(etat.modele[0].messages.at(-1).content.split("\n\nQUESTION : ")[0].replace(/^[^\n]*\n/, ""));
  for (const t of c2.territoires) assert.equal(t.aucune_priorite_favorable, null, t.commune);
});

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// 6 · La page : elle ne promet rien que la carte ne tienne
// ════════════════════════════════════════════════════════════════════════════════════════════════════

test("page « Où vivre » : libellé de carte, en-tête et repli disent l'absence de priorité favorable ; le corps l'envoie", () => {
  const code = readFileSync(new URL("../app/(public)/ou-vivre/OuVivreClient.tsx", import.meta.url), "utf8");
  assert.match(code, /const portee = porteeSansFavorable\(\{ marque: r\.sansPrioriteFavorable, etat, nonMesurees: r\.couverture\?\.nonMesurees \}\);\s*if \(portee\) return \{ libelle: libelleCarteSansFavorable\(portee, inondation\)/);
  assert.match(code, /top\.some\(\(r\) => r\.sansPrioriteFavorable\)\) && outcome\?\.message/);
  assert.match(code, /sansPrioriteFavorable: r\.sansPrioriteFavorable === true/);
  const pack = readFileSync(new URL("../app/(public)/comparateur/pack-decision/PackUnlockedView.tsx", import.meta.url), "utf8");
  assert.match(pack, /\{portee\(r\) && \(/);
  assert.match(pack, /phraseSansFavorable\(portee\(r\)!\)/);
  // Le repli « deux meilleurs aspects relatifs » a disparu du moteur.
  const moteur = readFileSync(new URL("./comparateur-vie.ts", import.meta.url), "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(moteur, /if \(reasons\.length === 0\) reasons =/);
});

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// 7 · Revue de la PR #99 : les faux compromis, et la portée de « aucune priorité favorable »
// ════════════════════════════════════════════════════════════════════════════════════════════════════

test("revue · Bagnères-de-Bigorre (air pur, France) : plus de « sols exposés à la sécheresse » avec 91/100", async () => {
  const r = await carte(null, [{ key: "air_sain", weight: 3 }], "Bagnères-de-Bigorre");
  const c = await V.getCommuneEntry(r.insee);
  assert.ok(V.subScore("faible_secheresse", c) >= 90);
  assert.doesNotMatch(r.compromis, /sécheresse/);
});

test("revue · Aytré (train, moins de voiture, services, 17) : plus de « peu de lieux de vie » avec 86/100", async () => {
  const r = await carte(["17"], [{ key: "acces_transports", weight: 3 }, { key: "faible_dependance_auto", weight: 2 }, { key: "acces_services", weight: 2 }], "Aytré");
  const c = await V.getCommuneEntry(r.insee);
  assert.ok(V.subScore("vie_locale", c) >= 85);
  assert.doesNotMatch(r.compromis, /lieux de vie|vie locale/);
});

test("revue · favorable mais un peu derrière : Châtelaillon-Plage (soins 84) n'a plus « l'offre de soins est plus limitée qu'à Aytré »", async () => {
  const r = await carte(["17"], [], "Châtelaillon-Plage");
  const c = await V.getCommuneEntry(r.insee);
  assert.ok(V.subScore("acces_soins", c) >= V.SEUIL_RAISON);
  assert.doesNotMatch(r.compromis, /soins/);
});

test("revue · une vraie faiblesse reste visible : Châteauneuf-le-Rouge garde « météo plus souvent propice aux feux »", async () => {
  const o = await recherche(["13"], [{ key: "faible_risque_feu", weight: 3 }]);
  const r = o.results.find((x: M) => x.nom === "Châteauneuf-le-Rouge");
  assert.equal(r.compromis, "En échange, météo plus souvent propice aux feux.");
  // Ses voisines, aussi faibles sur les feux, ont toutes un compromis (le leur, ou la faiblesse partagée).
  for (const x of o.results.slice(0, 3)) assert.ok(x.compromis, x.nom);
});

test("revue · trois communes favorables partout : aucun défaut fabriqué pour remplir la carte", async () => {
  // Bagnères-de-Bigorre, Gérardmer, Aurillac : ≥ 55 sur chacune des neuf dimensions de compromis. Par la porte du
  // comparateur (communes nommées, aucune faiblesse absolue possible) : aucune carte ne reçoit de compromis.
  const seeded = await V.seedComparaison(["65059", "88196", "15014"]);
  assert.equal(seeded.trio.length, 3);
  for (const r of seeded.trio) {
    const c = await V.getCommuneEntry(r.insee);
    for (const k of ["faible_chaleur", "faible_secheresse", "air_sain", "acces_soins", "acces_services", "calme_sonore", "faible_exposition_industrielle", "vie_locale", "faible_dependance_auto"]) {
      assert.ok(V.subScore(k, c) >= V.SEUIL_RAISON, `${r.nom} ${k}`);
    }
    assert.equal(r.compromis, "", r.nom);
  }
});

test("revue · portée : les quatre situations de couverture se disent sans ambiguïté", () => {
  // Toutes mesurées, aucune favorable.
  assert.equal(porteeSansFavorable({ marque: true, etat: "complete", nonMesurees: [] }), "toutes_mesurees");
  // Certaines mesurées, aucune d'elles favorable.
  assert.equal(porteeSansFavorable({ marque: true, etat: "partielle", nonMesurees: ["un cadre calme"] }), "parmi_celles_mesurees");
  // Aucune mesurée : rien n'a été comparé au seuil (même si un client l'affirme).
  assert.equal(porteeSansFavorable({ marque: true, etat: "aucune", nonMesurees: ["un cadre calme"] }), null);
  assert.equal(porteeSansFavorable({ marque: true, etat: "sans_priorite" }), null);
  // Certaines favorables, d'autres non mesurées : pas de marqueur.
  assert.equal(porteeSansFavorable({ marque: undefined, etat: "partielle", nonMesurees: ["un cadre calme"] }), null);
  // Inconnu, ou « complète » qui déclare des non mesurées : jamais « toutes ».
  assert.equal(porteeSansFavorable({ marque: true, etat: null }), "parmi_celles_mesurees");
  assert.equal(porteeSansFavorable({ marque: true, etat: "complete", nonMesurees: ["x"] }), "parmi_celles_mesurees");
  assert.equal(porteeSansFavorable({ marque: "oui", etat: "complete" }), null);
  assert.equal(libelleCarteSansFavorable("parmi_celles_mesurees"), "Aucune priorité favorable parmi celles mesurées ici");
  assert.doesNotMatch(phraseSansFavorable("parmi_celles_mesurees"), /Aucune de vos priorités/);
  assert.equal(phraseSansFavorable("toutes_mesurees"), "Aucune de vos priorités n'est favorable ici.");
});

test("revue · couverture partielle de bout en bout (Paris, calme + étés frais) : moteur, /synthesize, /ask et texte disent « parmi celles mesurées »", async () => {
  const prefs = [{ key: "cadre_calme", weight: 3 }, { key: "faible_chaleur", weight: 2 }];
  const o = await recherche(["75"], prefs);
  const top = o.results.slice(0, 1);
  const r = top[0];
  // Le moteur : le calme n'est pas mesuré, la chaleur l'est et n'est pas favorable.
  assert.equal(r.couverture.etat, "partielle");
  assert.deepEqual(r.couverture.nonMesurees, ["un cadre calme"]);
  assert.equal(r.sansPrioriteFavorable, true);
  assert.deepEqual(r.reasons, []);
  const portee = porteeSansFavorable({ marque: r.sansPrioriteFavorable, etat: r.couverture.etat, nonMesurees: r.couverture.nonMesurees });
  assert.equal(portee, "parmi_celles_mesurees");
  // Le texte de la carte et du Pack.
  assert.equal(libelleCarteSansFavorable(portee!), "Aucune priorité favorable parmi celles mesurées ici");
  assert.match(phraseSansFavorable(portee!), /parmi celles mesurées ici ; les autres ne sont pas mesurées/);
  // L'en-tête : la couverture prime, jamais le message « aucune de vos priorités ».
  assert.notEqual(o.message, V.MESSAGE_SANS_FAVORABLE);
  // /synthesize, avec le corps exact de la page.
  const body = {
    project: "Calme et fraîcheur à Paris.", reformulation: "FUT-151", preferences: prefs,
    results: top.map((x: M) => ({ nom: x.nom, reasons: x.reasons, tradeoff: x.tradeoff, prioritesNonMesurees: x.couverture?.nonMesurees ?? [], sansPrioriteFavorable: x.sansPrioriteFavorable === true })),
    outcome: { perfectMatch: o.perfectMatch, message: o.message, exploration: false, couverture: o.couverture },
  };
  await SYNTHESE(new NextRequest("http://localhost/api/comparateur-vie/synthesize", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", "x-forwarded-for": "10.151.2.1" } }));
  const appel = etat.synthese[0];
  const t = JSON.parse(appel.prompt.split("DONNÉES :\n")[1]).territoires[0];
  assert.equal(t.aucune_priorite_favorable, "parmi_celles_mesurees");
  assert.deepEqual(t.priorites_non_mesurees, ["un cadre calme"]);
  assert.match(appel.system, /dites « parmi celles mesurées ici », jamais « aucune\s+de vos priorités »/);
  assert.doesNotMatch(appel.system, /ses priorités déclarées sont mesurées et\s+aucune/);
  // /ask, avec le contexte construit par la page.
  const ctx = contexteAsk({
    reformulation: "FUT-151", criteres: preferencesToLabels(prefs), inondationDeclaree: false,
    outcome: { ...o, couverture: V.couvertureDesResultats(top) } as never, synthese: "Synthèse affichée.", top: top as never,
  });
  await ASK(new NextRequest("http://localhost/api/comparateur-vie/ask", {
    method: "POST",
    body: JSON.stringify({ question: "Paris est-elle calme ?", context: ctx, focus: null, history: [], distinctId: "fut151c" }),
    headers: { "content-type": "application/json", "x-forwarded-for": "10.151.2.2" },
  }));
  const req = etat.modele[0];
  const contexte = JSON.parse(req.messages.at(-1).content.split("\n\nQUESTION : ")[0].replace(/^[^\n]*\n/, ""));
  assert.equal(contexte.territoires[0].aucune_priorite_favorable, "parmi_celles_mesurees");
  assert.deepEqual(contexte.territoires[0].priorites_non_mesurees, ["un cadre calme"]);
  const systeme = typeof req.system === "string" ? req.system : JSON.stringify(req.system);
  assert.match(systeme, /jamais « aucune de vos priorités »/);
});

test("revue · aucune priorité mesurée : pas de marqueur, et un client qui l'affirme quand même n'est pas cru par /ask", async () => {
  const o = await recherche(["75"], [{ key: "cadre_calme", weight: 3 }]);
  const top = o.results.slice(0, 1);
  assert.equal(top[0].couverture.etat, "aucune");
  assert.equal(top[0].sansPrioriteFavorable, undefined);
  const ctx = contexteAsk({
    reformulation: "FUT-151", criteres: preferencesToLabels([{ key: "cadre_calme", weight: 3 }]), inondationDeclaree: false,
    outcome: { ...o, couverture: V.couvertureDesResultats(top) } as never, synthese: "Synthèse affichée.", top: top as never,
  });
  const forge = { ...ctx, territoires: ctx.territoires!.map((t) => ({ ...t, aucune_priorite_favorable: true })) };
  await ASK(new NextRequest("http://localhost/api/comparateur-vie/ask", {
    method: "POST",
    body: JSON.stringify({ question: "Et le calme ?", context: forge, focus: null, history: [], distinctId: "fut151d" }),
    headers: { "content-type": "application/json", "x-forwarded-for": "10.151.2.3" },
  }));
  const contexte = JSON.parse(etat.modele[0].messages.at(-1).content.split("\n\nQUESTION : ")[0].replace(/^[^\n]*\n/, ""));
  assert.equal(contexte.territoires[0].aucune_priorite_favorable, null);
});

