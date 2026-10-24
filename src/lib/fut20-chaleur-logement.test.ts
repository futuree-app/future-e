import { test, before } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-20 (16/10/2026) : LA CHALEUR DE LA COMMUNE, LUE À CE LOGEMENT, DANS LE PROJET DU LECTEUR.
//
// Avant : à Nîmes, pour un lecteur qui veut éviter les fortes chaleurs, deux cartes sans lien. L'une
// (« Ce qui correspond moins bien ») demandait de « regarder comment le logement tient l'été » ; une
// autre (« À contrôler ») disait que le diagnostic classait son confort d'été insuffisant, avec un
// autre geste. Après : une seule carte, deux échelles nommées, un seul geste ciblé (cadrage FUT-85 §F).
//
// Ces tests suivent la VRAIE chaîne (règles, conditions, compositions, assemblage, artefact) sur les
// VRAIES données DRIAS du dépôt (lecture seule de `drias-json.ts`) et les fixtures logement FUT-87, et
// lisent le TEXTE RENDU par les composants de production (react-dom/server). « La carte apparaît » et
// « la carte dit vrai » sont deux assertions distinctes (AGENTS.md) : les deux sont faites.
//
// L'ÉTAT « AVANT » est reconstruit sans rien simuler : un `LogementFacts` sans `confortEte` est
// exactement ce que le moteur recevait avant FUT-20, et `lectureChaleurLogement` rend alors `null`.
// Aucun réseau, aucun appel Anthropic.
// ════════════════════════════════════════════════════════════════════════════════════════════

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
let D: M; // modules du moteur
let rendreComposition: (c: unknown, absorbes: unknown[]) => string;
let rendreFait: (f: unknown) => string;
let getClimatDataCommune: (insee: string) => Promise<{ commune: { s?: unknown } } | null>;

before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { createElement, Fragment } = await import("react");
  const { FactCompositionCard } = await import("../components/report/FactCompositionCard.tsx");
  const { FactBody, EvidenceRow } = await import("../components/report/DecisionFactRenderParts.tsx");
  rendreComposition = (c, absorbes) => renderToStaticMarkup(createElement(FactCompositionCard, { composition: c, color: "var(--orange)", absorbedFacts: absorbes } as never));
  rendreFait = (f) => renderToStaticMarkup(createElement(Fragment, null, createElement(FactBody, { fact: f } as never), createElement(EvidenceRow, { fact: f, color: "var(--orange)" } as never)));
  ({ getClimatDataCommune } = await import("./drias-json.ts"));
  D = {
    ...(await import("./decision/module-facts-map.ts")),
    ...(await import("./decision/materiality-rules.ts")),
    ...(await import("./decision/decision-assembler.ts")),
    ...(await import("./decision/fact-compositions.ts")),
    ...(await import("./decision/climat-facts.ts")),
    ...(await import("./decision/logement-facts.ts")),
    ...(await import("./decision/conditions.ts")),
    ...(await import("./decision/decision-artifact.ts")),
    ...(await import("./decision/dossier-view.ts")),
    ...(await import("../components/releve/lecture-dossier.ts")),
    ...(await import("../components/prototypes/fut87/fixture-logement.ts")),
    ...(await import("./hard-constraints-hydrate.ts")),
    ...(await import("./hard-constraints.ts")),
    ...(await import("./user-project.ts")),
    ...(await import("./stable-stringify.ts")),
  };
});

/** Le texte que lit le lecteur : balises retirées, entités décodées, espaces insécables normalisées. */
function texte(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&apos;/g, "'").replace(/&quot;/g, "\"").replace(/&amp;/g, "&").replace(/&nbsp;| /g, " ")
    .replace(/\s+/g, " ").trim();
}

// ── Les communes, et leurs vraies données DRIAS ───────────────────────────────────────────────
const COMMUNES: Record<string, { insee: string; nom: string; dept: string; lat: number; lon: number; pop: number }> = {
  nimes: { insee: "30189", nom: "Nîmes", dept: "30", lat: 43.84, lon: 4.36, pop: 148_000 },
  montpellier: { insee: "34172", nom: "Montpellier", dept: "34", lat: 43.61, lon: 3.88, pop: 300_000 },
  larochelle: { insee: "17300", nom: "La Rochelle", dept: "17", lat: 46.16, lon: -1.15, pop: 78_000 },
  briancon: { insee: "05023", nom: "Briançon", dept: "05", lat: 44.9, lon: 6.64, pop: 11_000 },
  jausiers: { insee: "04096", nom: "Jausiers", dept: "04", lat: 44.42, lon: 6.73, pop: 1_100 },
  saintdenis: { insee: "97411", nom: "Saint-Denis", dept: "974", lat: -20.88, lon: 55.45, pop: 150_000 },
};

type Logement = "temoin" | "immeuble" | "sans-dpe" | "a-bon" | "a-partiel" | "ancien";
type Opts = {
  logement?: Logement | null; // null = pas d'adresse
  chaleur?: number; // poids de faible_chaleur (0 = non déclarée)
  douceur?: boolean; // déclare douceur_climat (poids 3) et des hivers parmi les plus doux
  confirme?: boolean; // faible_chaleur confirmée comme condition
  climat?: "reel" | "absent" | "illisible" | "illisible-total";
  avant?: boolean; // l'état d'avant FUT-20 : aucun confortEte dans les faits logement
};

/** Les DPE des cas complémentaires, dérivés de la fixture témoin (champs publics de la base ADEME). */
function dpeDe(l: Logement): unknown {
  const t = D.casDeLogement("temoin").dpe;
  if (l === "a-bon") return { ...t, confort_ete: "bon", traversant: true, protection_solaire: true, inertie: "Lourde", date_dpe: "2022-06-01" };
  // A, mais rien de renseigné au-delà de l'indicateur.
  if (l === "a-partiel") return { ...t, confort_ete: "moyen", traversant: null, protection_solaire: null, inertie: null, ventilation: null, brasseur_air: null, date_dpe: null };
  // Un DPE antérieur à la réforme de 2021 : pas de bloc confort d'été, méthode d'avant.
  if (l === "ancien") return { ...t, confort_ete: null, traversant: null, protection_solaire: null, methode_dpe: "3CL-DPE 2012", date_dpe: "2017-05-12" };
  return D.casDeLogement(l).dpe;
}

const climats = new Map<string, unknown>();
async function climatDe(insee: string, mode: Opts["climat"]): Promise<unknown> {
  if (mode === "absent") return null;
  if (!climats.has(insee)) {
    const avertir = console.warn; console.warn = () => {};
    try { climats.set(insee, D.buildClimatFacts(((await getClimatDataCommune(insee))?.commune.s) ?? null)); } finally { console.warn = avertir; }
  }
  const c = climats.get(insee) as M | null;
  // Illisible : un axe sans valeur projetée (jamais 0). La règle doit rendre `uncertain`.
  if (mode === "illisible" && c) return { ...c, nuitsTropicales: { ...c.nuitsTropicales, projete: null, notable: false } };
  if (mode === "illisible-total" && c) {
    return { ...c, nuitsTropicales: { ...c.nuitsTropicales, projete: null, notable: false }, joursTresChauds: { ...c.joursTresChauds, projete: null, notable: false } };
  }
  return c;
}

async function dossier(commune: keyof typeof COMMUNES, o: Opts = {}) {
  const k = COMMUNES[commune];
  const climat = await climatDe(k.insee, o.climat);
  const entry = {
    insee: k.insee, nom: k.nom, dept: k.dept, region: "x", lat: k.lat, lon: k.lon, population: k.pop, densite: 500, altitude: 50,
    clim: {}, pct: {}, ...(o.douceur ? { rankBands: { douceur_climat: [8800, 9700] } } : {}),
  };
  const adresse = o.logement !== null;
  const base = D.mapCommuneToModuleFacts(entry, {}, { hasAddress: adresse, tailleVille: k.pop, tailleVilleSource: "commune", climat });
  let logement: M | undefined;
  if (adresse) {
    const cas = o.logement ?? "temoin";
    const fixture = ["temoin", "immeuble", "sans-dpe"].includes(cas) ? cas : "temoin";
    const dpe = dpeDe(cas);
    const confortEte = D.confortEteDepuisDpe(dpe);
    logement = {
      ...D.casDeLogement(fixture).faits,
      // Le même DPE gouverne le booléen de la règle et le fait structuré : jamais deux vérités.
      confortEteInsuffisant: confortEte.niveau === "logement" && confortEte.indicateur === "insuffisant",
      ...(o.avant ? {} : { confortEte }),
    };
  }
  const facts = { ...base, hasAddress: adresse, ...(logement ? { logement, relationAuLieu: { echelle: "adresse", relation: null } } : {}) };
  const prefs = [
    { key: "acces_soins", weight: 2 }, // une priorité sans rapport, pour que le verdict ait matière
    ...(o.chaleur ? [{ key: "faible_chaleur", weight: o.chaleur }] : []),
    ...(o.douceur ? [{ key: "douceur_climat", weight: 3 }] : []),
  ];
  let project = D.normalizeUserProject({
    posture: "recherche", intent: "achat", rawText: "…", updatedAt: "2026-09-01T00:00:00.000Z",
    parsed: { reformulation: "x", hardConstraints: {}, preferences: prefs },
  });
  if (o.confirme) {
    project = D.normalizeUserProject({ ...project, conditions: [D.buildConfirmation(project, { kind: "preference", key: "faible_chaleur" }, "2026-10-01T00:00:00.000Z")] });
  }
  const ctx = {
    constraints: D.hydrateHardConstraints({}, { byName: () => null, plmByName: () => null }),
    point: adresse
      ? { lat: k.lat, lon: k.lon, grain: "address", source: "address_geocoder", label: `1 rue de test, ${k.nom}` }
      : { lat: k.lat, lon: k.lon, grain: "commune_reference", source: "commune_centroid", label: k.nom },
    conventionsVersion: D.PRODUCT_CONVENTIONS_VERSION,
  };
  const run = D.runRules(facts, project, ctx);
  const comps = D.composeFacts(run, facts, project) as M[];
  const d = D.assembleDossier(run, project, adresse ? "commune+adresse" : "commune", k.nom, comps, null) as M;
  return { run, comps, d, project };
}

/** Tout ce que le lecteur voit des cartes du dossier, rendu par les composants de production. */
function cartesRendues(d: M): { id: string; texte: string }[] {
  return d.sections.flatMap((s: M) => s.cards.map((c: M) => c.kind === "composition"
    ? { id: c.composition.id, texte: texte(rendreComposition(c.composition, d.absorbedFacts.filter((f: M) => c.composition.absorbedFactIds.includes(f.id)))) }
    : { id: c.fact.id, texte: texte(rendreFait(c.fact)) }));
}
const toutLeTexte = (d: M): string => cartesRendues(d).map((c) => c.texte).join(" ¶ ");
const carteChaleur = (d: M): M | undefined =>
  d.compositions.find((c: M) => ["climate_comfort", "seasonal_climate_tradeoff", "ambient_heat_housing"].includes(c.patternId));
const idsVisibles = (d: M): string[] => d.sections.flatMap((s: M) => s.cards.map((c: M) => (c.kind === "fact" ? c.fact.id : c.composition.id)));
const gestesVisibles = (d: M): string[] => cartesRendues(d).flatMap((c) => [...c.texte.matchAll(/(Demandez|Vérifiez|Regardez|Renseignez)[^.¶]*?(?= ¶|$| Données| Voir)/g)].map((m) => m[0]));

// Aucune phrase de vécu, aucune prédiction intérieure, aucune compensation.
const INTERDIT_VECU = /vous aurez (trop )?chaud|température intérieure (sera|atteindra)|sera (trop )?chaud|compense|ce logement vous protégera|invivable/i;

// ═════════════════════════════════════ 1. NÎMES, A / B1 / C ═══════════════════════════════════

test("Les communes de référence ont les valeurs annoncées (DRIAS réel, 2050)", async () => {
  const v = async (insee: string) => ((await getClimatDataCommune(insee))!.commune.s as M).gwl20.v;
  assert.equal((await v("30189")).NORTX35D_yr, 14.4);
  assert.equal((await v("30189")).NORTR_yr, 69.1);
  assert.equal((await v("34172")).NORTX35D_yr, 7.6); // sous les 8 jours : déclenche par les nuits seules
  assert.equal((await v("34172")).NORTR_yr, 71.9);
  assert.equal((await v("17300")).NORTR_yr, 23.4); // sous les 25 nuits
  assert.equal((await v("05023")).NORTR_yr, 0.2);
  assert.equal((await v("04096")).NORTR_yr, 0);
  assert.equal(await getClimatDataCommune("97411"), null); // outre-mer : jamais de DRIAS métropolitain
});

test("Nîmes, avant FUT-20 : deux cartes chaleur, deux gestes, aucun lien (reproduction)", async () => {
  const { d } = await dossier("nimes", { chaleur: 3, avant: true });
  const ids = idsVisibles(d);
  assert.ok(ids.includes("30189:composition-confort-ete"));
  assert.ok(ids.includes("logement:confort-ete"), "la carte « Confort d'été insuffisant » est à part");
  const t = toutLeTexte(d);
  assert.match(t, /Regardez comment le logement tient l'été/);
  assert.match(t, /Demandez comment le logement se comporte en forte chaleur/);
});

test("Nîmes, A : une seule carte réunit commune, logement, projet, limite et un geste ciblé", async () => {
  const { d, run } = await dossier("nimes", { chaleur: 3 });
  const c = carteChaleur(d)!;
  assert.equal(c.patternId, "climate_comfort");
  assert.equal(c.displaySection, "mismatches");
  // La carte « Confort d'été insuffisant » est ABSORBÉE : plus de seconde carte, plus de second geste.
  assert.ok(!idsVisibles(d).includes("logement:confort-ete"));
  assert.deepEqual(c.absorbedFactIds, ["30189:climat-chaleur", "logement:confort-ete"]);
  const html = rendreComposition(c, d.absorbedFacts.filter((f: M) => c.absorbedFactIds.includes(f.id)));
  const t = texte(html);
  // Ce que le lecteur lit, dans l'ordre : le titre qui relie, la commune, le logement, la limite, le geste.
  const attendu = [
    "De fortes chaleurs projetées, et un confort d'été classé insuffisant",
    "À l'échelle de la commune",
    "Les jours au-dessus de 35 °C passeraient de 3 par an sur la période de référence 1976-2005 à 14 à l'horizon 2050. Les nuits tropicales, elles, passeraient de 33 à 69 par an",
    "À cette adresse",
    "Confort d'été insuffisant",
    "Le diagnostic de ce logement, daté du 18 mars 2024, classe son confort d'été comme insuffisant. Le logement n'est pas traversant et son inertie est légère. Le diagnostic ne dit pas si le logement dispose de protections solaires. Face aux fortes chaleurs projetées ici, ce classement et ces caractéristiques méritent une attention particulière.",
    "ne prédit pas la température que vous connaîtrez à l'intérieur",
    "Demandez si les fenêtres ont des volets ou des stores",
    "Demandez aussi si l'on peut aérer les chambres la nuit.",
    "L'aération de nuit ne rafraîchit que lorsque l'air extérieur est plus frais qu'à l'intérieur.",
  ];
  let pos = -1;
  for (const a of attendu) {
    const i = t.indexOf(a);
    assert.ok(i > pos, `« ${a} » absent ou hors d'ordre dans : ${t}`);
    pos = i;
  }
  // UN SEUL GESTE sur la carte, et l'ancien renvoi générique a disparu.
  assert.equal((html.match(/Demandez|Regardez|Vérifiez/g) ?? []).filter(Boolean).length >= 1, true);
  assert.doesNotMatch(t, /Regardez comment le logement tient l'été/);
  assert.doesNotMatch(t, /Demandez comment le logement se comporte en forte chaleur/);
  // Une caractéristique non renseignée n'est jamais dite absente.
  assert.doesNotMatch(t, /n'a pas de protections|sans protection|aucune protection/i);
  assert.doesNotMatch(t, INTERDIT_VECU);
  // Preuves, grains, dates : la commune au grain commune, le logement au grain adresse, daté.
  assert.deepEqual(c.evidence.map((e: M) => e.grain), ["commune", "commune"]);
  assert.equal(c.logement.evidence[0].grain, "adresse");
  assert.equal(c.logement.evidence[0].observedAt, "2024-03-18");
  assert.equal(c.logement.evidence[0].observedValue, "confort d'été insuffisant");
  assert.match(t, /Preuve · confort d'été insuffisant/);
  // Le constat absorbé reste dans le dossier, avec sa preuve et sa limite (le dépliable d'audit).
  const absorbe = d.absorbedFacts.find((f: M) => f.id === "logement:confort-ete");
  assert.ok(absorbe && absorbe.evidence.length === 1 && absorbe.limitation);
  assert.ok(run.facts.some((f: M) => f.id === "logement:confort-ete"), "le fait reste émis : la couverture le lit");
});

test("Nîmes, B1 : les caractéristiques de l'immeuble, jamais attribuées au logement", async () => {
  const { d } = await dossier("nimes", { chaleur: 3, logement: "immeuble" });
  const c = carteChaleur(d)!;
  const t = texte(rendreComposition(c, []));
  assert.match(t, /De fortes chaleurs projetées, et un confort d'été encore à vérifier/);
  assert.match(t, /Le diagnostic retrouvé, daté du 7 novembre 2023, a été établi à partir des données de l'immeuble : les caractéristiques qu'il décrit sont celles du bâtiment \(inertie lourde, VMC simple flux, isolation des murs : insuffisante, menuiseries : moyenne\), et il ne qualifie pas le confort d'été de ce logement\./);
  assert.match(t, /Il ne dit ni si le logement est traversant, ni s'il dispose de protections solaires\./);
  // Rien du bâtiment n'est dit DU logement, et aucun indicateur n'est cité.
  assert.doesNotMatch(t, /Le logement (n'est pas|est) traversant|son inertie est|classe son confort d'été|confort d'été (bon|moyen|insuffisant)/);
  assert.match(t, /Demandez si le logement est traversant/);
  assert.match(t, /Demandez si le logement est traversant Données et limites À vérifier Un logement traversant permet de créer un courant d'air d'une façade à l'autre\. Demandez aussi si les fenêtres ont des volets ou des stores, si l'on peut aérer les chambres la nuit et si le logement est sous les toits\. L'aération de nuit ne rafraîchit que lorsque l'air extérieur est plus frais qu'à l'intérieur\./);
  assert.equal(c.logement.evidence[0].observedValue, "diagnostic établi à partir des données de l'immeuble");
  assert.equal(c.logement.evidence[0].observedAt, "2023-11-07");
  // Aucun constat « Confort d'été insuffisant » n'a été émis (B1) : rien à absorber.
  assert.deepEqual(c.absorbedFactIds, ["30189:climat-chaleur"]);
  assert.doesNotMatch(t, INTERDIT_VECU);
});

test("Nîmes, C : aucun confort qualifié, le manque devient une vérification précise", async () => {
  const { d } = await dossier("nimes", { chaleur: 3, logement: "sans-dpe" });
  const t = texte(rendreComposition(carteChaleur(d)!, []));
  assert.match(t, /Aucun diagnostic rattaché à ce logement ne qualifie son confort d'été : on ne sait ni si le logement est traversant, ni s'il dispose de protections solaires\./);
  assert.match(t, /Ce qui n'est pas renseigné n'est pas absent/);
  assert.match(t, /Demandez si le logement est traversant/);
  assert.doesNotMatch(t, /inertie|confort d'été (bon|moyen|insuffisant)|n'est pas traversant/);
});

test("C : aucune preuve ADEME n'est présentée comme retrouvée (provenance et limites visibles)", async () => {
  // Revue PR #64 : en C, la carte citait « Source : Base DPE (ADEME) » (persisted_snapshot) sans aucun
  // diagnostic rattaché. Les trois cartes chaleur et la condition sont vérifiées sur leur rendu.
  const cas: [string, Opts][] = [
    ["écart déclaré", { chaleur: 3 }], ["constat non demandé", { chaleur: 0 }],
    ["compromis", { chaleur: 3, douceur: true }], ["condition", { chaleur: 3, confirme: true }],
  ];
  for (const [nom, o] of cas) {
    const { d, run } = await dossier("nimes", { ...o, logement: "sans-dpe" });
    const c = carteChaleur(d);
    const cond = run.facts.find((f: M) => f.id === "30189:condition:faible_chaleur");
    const cote = c ? (c.logement ?? c.items[1]) : cond.logement;
    assert.deepEqual(cote.evidence, [], `${nom} : aucune preuve DPE`);
    const t = c ? texte(rendreComposition(c, [])) : texte(rendreFait(cond));
    assert.doesNotMatch(t, /Base DPE|ADEME|daté du|confort d'été (bon|moyen|insuffisant)/, nom);
    assert.match(t, /Aucun diagnostic n'étant rattaché à ce logement, futur•e ne qualifie pas son confort d'été\./, nom);
    // Le dossier ne se fonde sur aucune preuve DPE fabriquée.
    assert.ok(!d.conclusionBasis.evidence.some((e: M) => e.factId === "logement.confort-ete"), nom);
  }
  // A et B1 gardent leur preuve datée, rattachée à un diagnostic précis.
  for (const [cas2, valeur, date] of [["temoin", "confort d'été insuffisant", "2024-03-18"], ["immeuble", "diagnostic établi à partir des données de l'immeuble", "2023-11-07"]] as const) {
    const e = carteChaleur((await dossier("nimes", { chaleur: 3, logement: cas2 })).d)!.logement.evidence;
    assert.equal(e.length, 1);
    assert.deepEqual([e[0].label, e[0].observedValue, e[0].observedAt, e[0].sourceMode, e[0].grain], ["Base DPE (ADEME)", valeur, date, "persisted_snapshot", "adresse"]);
  }
});

test("Nîmes, A « bon » : le logement ne corrige jamais la commune", async () => {
  const { d } = await dossier("nimes", { chaleur: 3, logement: "a-bon" });
  const c = carteChaleur(d)!;
  assert.equal(c.displaySection, "mismatches", "l'écart reste un écart");
  const t = texte(rendreComposition(c, []));
  assert.match(t, /classe son confort d'été comme bon\. Le logement est traversant, son inertie est lourde et des protections solaires sont renseignées\./);
  assert.match(t, /Ce classement ne change rien à l'exposition de la commune aux fortes chaleurs\./);
  assert.match(t, /De fortes chaleurs projetées, et ce qu'en dit le diagnostic.*Demandez si l'on peut aérer les chambres la nuit/);
  assert.doesNotMatch(t, INTERDIT_VECU);
});

test("DPE partiel ou ancien : rien n'est inventé, la date est dite quand elle existe", async () => {
  const partiel = carteChaleur((await dossier("nimes", { chaleur: 3, logement: "a-partiel" })).d)!;
  const tp = texte(rendreComposition(partiel, []));
  assert.match(tp, /Le diagnostic de ce logement classe son confort d'été comme moyen\. Le diagnostic ne dit ni si le logement est traversant, ni s'il dispose de protections solaires\./);
  assert.doesNotMatch(tp, /daté du|inertie/);
  assert.equal(partiel.logement.evidence[0].observedAt, undefined);
  const ancien = carteChaleur((await dossier("nimes", { chaleur: 3, logement: "ancien" })).d)!;
  const ta = texte(rendreComposition(ancien, []));
  // Avant 2021, le DPE n'a pas de bloc confort d'été : niveau bâtiment, pas d'indicateur.
  assert.match(ta, /Le diagnostic retrouvé, daté du 12 mai 2017, ne qualifie pas le confort d'été de ce logement\. Il renseigne : inertie légère/);
  assert.doesNotMatch(ta, /confort d'été (bon|moyen|insuffisant)|classe son confort/);
});

// ══════════════════════════════ 2. LES TROIS CARTES CHALEUR, ET LA CONDITION ═══════════════════

test("Compromis hivers doux / étés chauds : le logement porte le seul geste, sous le compromis", async () => {
  const { d } = await dossier("nimes", { chaleur: 3, douceur: true });
  const c = carteChaleur(d)!;
  assert.equal(c.patternId, "seasonal_climate_tradeoff");
  assert.equal(c.unfavorableSide.action, undefined, "le côté défavorable ne porte plus de geste");
  assert.equal(c.logement.action.label, "Demandez si les fenêtres ont des volets ou des stores");
  assert.ok(c.absorbedFactIds.includes("logement:confort-ete"));
  assert.ok(!idsVisibles(d).includes("logement:confort-ete"));
  const t = texte(rendreComposition(c, []));
  assert.match(t, /Des hivers doux, avec une exposition estivale à arbitrer/);
  assert.match(t, /À cette adresse.*confort d'été comme insuffisant/);
  // Le geste remonte dans « À contrôler en priorité » s'il y est retenu : jamais le renvoi générique.
  const gestes = (d.narrativePlan.priorityControl?.actions ?? []).map((a: M) => a.label);
  assert.ok(!gestes.includes("Regardez comment le logement tient l'été"));
});

test("Constat non demandé (poids 0) : une carte « À contrôler » unique, secondaire, deux échelles", async () => {
  for (const cas of ["temoin", "immeuble", "sans-dpe"] as const) {
    const { d } = await dossier("nimes", { chaleur: 0, logement: cas });
    const c = carteChaleur(d)!;
    assert.equal(c.patternId, "ambient_heat_housing", cas);
    assert.equal(c.displaySection, "verifications");
    assert.equal(c.materialityTier, "secondary");
    assert.ok(!idsVisibles(d).includes("30189:verification-chaleur-future"));
    assert.ok(!idsVisibles(d).includes("logement:confort-ete"));
    assert.deepEqual(c.items.map((i: M) => i.label), ["À l'échelle de la commune", "À cette adresse"]);
    assert.equal(c.items[0].action, undefined, "le constat territoire ne porte plus le geste générique");
    assert.match(c.items[0].signalConvention, /à partir de 10 jours par an au-dessus de 35 °C, ou de 39 nuits tropicales par an, hors priorité déclarée/);
    // Rangée avec les contrôles du territoire, comme le constat qu'elle porte.
    const groupes = D.controlesParEchelle(d);
    assert.equal(groupes.find((g: M) => g.cards.some((x: M) => x.kind === "composition" && x.composition.id === c.id)).echelle, "territoire");
  }
});

test("Montpellier : la carte est déclenchée par les nuits tropicales seules, et le dit", async () => {
  const declare = carteChaleur((await dossier("montpellier", { chaleur: 3 })).d)!;
  assert.equal(declare.patternId, "climate_comfort");
  assert.match(declare.summary, /^Les nuits tropicales passeraient de 35 par an sur la période de référence 1976-2005 à 72 à l'horizon 2050/);
  assert.doesNotMatch(declare.summary, /35 °C/, "les jours très chauds (7,6) sont sous le seuil : la carte n'en parle pas");
  assert.deepEqual(declare.evidence.map((e: M) => e.factId), ["climat.nuitsTropicales"]);
  assert.ok(declare.logement);
  const ambiant = carteChaleur((await dossier("montpellier", { chaleur: 0 })).d)!;
  assert.equal(ambiant.patternId, "ambient_heat_housing");
  assert.match(ambiant.items[0].signalConvention, /à partir de 39 nuits tropicales par an, hors priorité déclarée/);
});

test("Condition confirmée (D4) : la carte condition porte le logement et le geste ; aucune autre carte chaleur", async () => {
  const { d, run } = await dossier("nimes", { chaleur: 3, confirme: true });
  assert.equal(carteChaleur(d), undefined, "pas de composition : le mismatch est réuni dans la condition");
  const cond = run.facts.find((f: M) => f.id === "30189:condition:faible_chaleur");
  assert.equal(cond.signal, "defavorable", "le logement ne pèse pas sur le signal (FUT-110)");
  assert.ok(cond.logement);
  assert.equal(cond.action.label, "Demandez si les fenêtres ont des volets ou des stores");
  assert.ok(!idsVisibles(d).includes("logement:confort-ete"), "le constat logement est réuni, pas répété");
  const t = texte(rendreFait(cond));
  assert.match(t, /À cette adresse.*Confort d'été insuffisant.*daté du 18 mars 2024/);
  assert.equal((t.match(/Demandez si les fenêtres ont des volets/g) ?? []).length, 1, "un seul geste");
  // Le constat de la carte est celui d'avant : seul le côté logement s'ajoute.
  const avant = (await dossier("nimes", { chaleur: 3, confirme: true, avant: true })).run.facts.find((f: M) => f.id === "30189:condition:faible_chaleur");
  for (const k of ["statement", "signal", "status", "whyNotDecided", "consequence", "materialityTier"]) assert.deepEqual(cond[k], avant[k], k);
});

test("Condition confirmée, commune sous le seuil (La Rochelle) : rien ne s'ajoute", async () => {
  const { run } = await dossier("larochelle", { chaleur: 3, confirme: true });
  const cond = run.facts.find((f: M) => f.id === "17300:condition:faible_chaleur");
  assert.ok(cond, "la condition existe (lecture favorable)");
  assert.equal(cond.logement, undefined);
  assert.ok(run.facts.some((f: M) => f.id === "logement:confort-ete"), "la carte logement reste seule");
});

// ══════════════════════════════ 3. QUAND LA COMPOSITION NE S'AFFICHE PAS ═══════════════════════

test("La Rochelle (sous le seuil) : aucune composition, aucune phrase climatique, verdict inchangé", async () => {
  for (const chaleur of [0, 3]) {
    const { d } = await dossier("larochelle", { chaleur });
    const avant = (await dossier("larochelle", { chaleur, avant: true })).d;
    assert.equal(carteChaleur(d), undefined);
    assert.ok(idsVisibles(d).includes("logement:confort-ete"), "la carte logement reste seule, telle quelle");
    assert.deepEqual(idsVisibles(d), idsVisibles(avant));
    assert.equal(toutLeTexte(d), toutLeTexte(avant));
    assert.doesNotMatch(toutLeTexte(d), /nuits tropicales|35 °C|progress|hausse/i);
  }
});

test("Briançon et Jausiers : abstention, aucune affirmation de progression", async () => {
  for (const commune of ["briancon", "jausiers"] as const) {
    for (const chaleur of [0, 1, 3]) {
      const { d } = await dossier(commune, { chaleur });
      assert.equal(carteChaleur(d), undefined, `${commune} ${chaleur}`);
      const t = toutLeTexte(d);
      assert.doesNotMatch(t, /progress|hausse|plus chaud|nuits tropicales|fortes chaleurs projetées/i);
      assert.equal(t, toutLeTexte((await dossier(commune, { chaleur, avant: true })).d));
    }
  }
});

test("Donnée climatique manquante ou illisible, outre-mer : aucune composition, carte logement seule", async () => {
  for (const o of [{ climat: "absent" }, { climat: "illisible-total" }] as Opts[]) {
    for (const chaleur of [0, 3]) {
      const { d, run } = await dossier("nimes", { ...o, chaleur });
      assert.equal(carteChaleur(d), undefined, JSON.stringify(o));
      assert.ok(idsVisibles(d).includes("logement:confort-ete"));
      if (chaleur) assert.equal(run.evaluations.find((e: M) => e.ruleId === "territoire.climat-chaleur").outcome, "uncertain");
      assert.doesNotMatch(toutLeTexte(d), /fortes chaleurs projetées/);
    }
  }
  const om = await dossier("saintdenis", { chaleur: 3 });
  assert.equal(carteChaleur(om.d), undefined);
});

test("Un axe illisible : la carte suit ce que le moteur a établi, et ne parle jamais de l'axe non lu", async () => {
  // Doctrine du moteur, inchangée : un seul axe défavorable suffit. Nîmes garde 14 jours > 35 °C lus ;
  // les nuits tropicales, illisibles, ne sont ni citées ni prouvées.
  for (const chaleur of [0, 3]) {
    const { d } = await dossier("nimes", { climat: "illisible", chaleur });
    const c = carteChaleur(d)!;
    assert.ok(c, String(chaleur));
    const t = texte(rendreComposition(c, []));
    assert.match(t, /Les jours au-dessus de 35 °C passeraient de 3 par an/);
    assert.doesNotMatch(t, /nuits tropicales|69 nuits/);
    assert.ok(c.logement || c.items, "le logement est lu");
  }
});

test("Priorité chaleur faible (poids 1) : aucune carte chaleur, la carte logement reste seule", async () => {
  const { d } = await dossier("nimes", { chaleur: 1 });
  assert.equal(carteChaleur(d), undefined);
  assert.ok(idsVisibles(d).includes("logement:confort-ete"));
  assert.deepEqual(idsVisibles(d), idsVisibles((await dossier("nimes", { chaleur: 1, avant: true })).d));
});

test("Sans adresse : la composition d'avant, inchangée (renvoi « renseignez votre adresse »)", async () => {
  for (const o of [{ chaleur: 3 }, { chaleur: 3, douceur: true }, { chaleur: 0 }] as Opts[]) {
    const { d } = await dossier("nimes", { ...o, logement: null });
    const avant = (await dossier("nimes", { ...o, logement: null, avant: true })).d;
    assert.equal(D.stableStringify(d), D.stableStringify(avant), JSON.stringify(o));
  }
  const c = carteChaleur((await dossier("nimes", { chaleur: 3, logement: null })).d)!;
  assert.equal(c.logement, undefined);
  assert.equal(c.action.label, "Renseignez votre adresse pour descendre au niveau du logement");
});

// ══════════════════════════════ 4. INVARIANTS : VERDICT, CARTES, GESTES ════════════════════════

const MATRICE: [keyof typeof COMMUNES, Opts][] = [];
for (const commune of ["nimes", "montpellier", "larochelle", "briancon"] as const) {
  for (const logement of ["temoin", "immeuble", "sans-dpe", "a-bon"] as const) {
    for (const o of [{ chaleur: 0 }, { chaleur: 1 }, { chaleur: 2 }, { chaleur: 3 }, { chaleur: 3, douceur: true }, { chaleur: 3, confirme: true }] as Opts[]) {
      MATRICE.push([commune, { ...o, logement }]);
    }
  }
}

test("Matrice : verdict, orientation, registre et comptes d'écarts identiques avant / après", async () => {
  for (const [commune, o] of MATRICE) {
    const apres = (await dossier(commune, o)).d;
    const avant = (await dossier(commune, { ...o, avant: true })).d;
    const cle = `${commune} ${JSON.stringify(o)}`;
    assert.equal(apres.conclusionState, avant.conclusionState, cle);
    assert.equal(apres.narrativePlan.verdictLabel, avant.narrativePlan.verdictLabel, cle);
    assert.equal(apres.narrativePlan.verdictTone, avant.narrativePlan.verdictTone, cle);
    assert.equal(apres.narrativePlan.verdict.headline.text, avant.narrativePlan.verdict.headline.text, cle);
    assert.equal(apres.criteria.orientation, avant.criteria.orientation, cle);
    assert.equal(apres.criteria.coverage, avant.criteria.coverage, cle);
    assert.deepEqual(apres.criteria.registry.map((r: M) => [r.criterionKey, r.outcome]), avant.criteria.registry.map((r: M) => [r.criterionKey, r.outcome]), cle);
    // Les écarts : le même nombre de cartes « Ce qui correspond moins bien ».
    const ecarts = (x: M) => x.sections.find((s: M) => s.key === "mismatches")?.cards.length ?? 0;
    assert.equal(ecarts(apres), ecarts(avant), cle);
  }
});

test("Matrice : jamais deux cartes chaleur, jamais deux fois le même geste, jamais un fait absorbé deux fois", async () => {
  for (const [commune, o] of MATRICE) {
    const { d, comps, run } = await dossier(commune, o);
    const cle = `${commune} ${JSON.stringify(o)}`;
    const chaleur = d.compositions.filter((c: M) => ["climate_comfort", "seasonal_climate_tradeoff", "ambient_heat_housing"].includes(c.patternId));
    assert.ok(chaleur.length <= 1, cle);
    // Une carte chaleur ET la carte logement séparée : interdit quand les deux existent.
    const climatique = chaleur.length === 1 || run.facts.some((f: M) => f.id.endsWith(":condition:faible_chaleur") && f.logement);
    if (climatique) assert.ok(!idsVisibles(d).includes("logement:confort-ete"), cle);
    const g = gestesVisibles(d);
    assert.equal(new Set(g).size, g.length, `${cle} : ${g.join(" | ")}`);
    D.assertCompositionsValid(run, comps);
    // Un geste tient sur une ligne, sans point final (règle des cartes, appliquée aussi aux compositions).
    for (const c of comps) {
      for (const a of [c.action, c.logement?.action, ...(c.items ?? []).map((i: M) => i.action)].filter(Boolean)) {
        assert.ok(a.label.length <= 70 && !/[.!?]$/.test(a.label), `${cle} : ${a.label}`);
      }
    }
    const absorbes = comps.flatMap((c: M) => c.absorbedFactIds);
    assert.equal(new Set(absorbes).size, absorbes.length, cle);
    assert.doesNotMatch(toutLeTexte(d), INTERDIT_VECU, cle);
  }
});

test("Matrice : un fait de bâtiment n'est jamais dit du logement, un indicateur n'apparaît qu'au niveau A", async () => {
  for (const [commune, o] of MATRICE.filter(([, x]) => x.logement === "immeuble" || x.logement === "sans-dpe")) {
    const { d, run } = await dossier(commune, o);
    const cotes = [
      ...d.compositions.flatMap((c: M) => (c.logement ? [c.logement] : c.patternId === "ambient_heat_housing" ? [c.items[1]] : [])),
      ...run.facts.flatMap((f: M) => (f.logement ? [f.logement] : [])),
    ];
    for (const s of cotes) {
      assert.doesNotMatch(s.statement, /Le logement (n'est pas|est) traversant|son inertie|confort d'été comme|confort d'été (bon|moyen|insuffisant)/, `${commune} ${JSON.stringify(o)}`);
      assert.equal(s.status, undefined);
    }
  }
});

// ══════════════════════════════ 5. ARTEFACT, RELECTURE, AUTRES SURFACES ═════════════════════════

test("Artefact : la carte enrichie traverse la sérialisation, et le texte relu est le texte écrit", async () => {
  const { d, project } = await dossier("nimes", { chaleur: 3 });
  const art = D.buildDecisionArtifact(d, project, "2026-10-16T10:00:00.000Z", D.PRODUCT_CONVENTIONS_VERSION);
  assert.equal(art.engineVersion, "engine-7"); // FUT-127 : le moteur courant
  const relu = D.parseDecisionArtifact(JSON.parse(JSON.stringify(art)));
  assert.ok(relu);
  assert.equal(toutLeTexte(relu.dossier), toutLeTexte(d));
  const c = carteChaleur(relu.dossier)!;
  assert.equal(c.logement.label, "À cette adresse");
  // La conclusion figée se fonde aussi sur la preuve logement.
  assert.ok(relu.dossier.conclusionBasis.evidence.some((e: M) => e.factId === "logement.confort-ete" && e.grain === "adresse"));
  assert.ok(relu.dossier.conclusionBasis.factIds.includes("logement:confort-ete"));
});

test("Artefact engine-5 d'avant FUT-20 : relu et rendu exactement comme avant", async () => {
  // Une composition figée avant FUT-20 n'a pas de côté logement : le rendu courant doit être celui
  // de main (8d02e190), épinglé ici mot pour mot.
  // FUT-17 : l'artefact est RELU depuis sa forme figée (générée par main 5358667f), plus régénéré : le titre
  // sans logement a changé pour les nouvelles générations, et un artefact vendu garde le sien.
  const { readFileSync } = await import("node:fs");
  const figes = JSON.parse(readFileSync("src/lib/__fixtures__/fut17-artefacts-avant.json", "utf8"));
  const art = D.parseDecisionArtifact(figes["adresse-confort-ete-avant-fut20"].artefact);
  const c = carteChaleur(art.dossier)!;
  assert.equal(c.logement, undefined);
  assert.equal(texte(rendreComposition(c, [])), RENDU_MAIN_CONFORT_ETE);
  const { d: dt } = await dossier("nimes", { chaleur: 3, douceur: true, avant: true });
  assert.equal(texte(rendreComposition(carteChaleur(dt)!, [])), RENDU_MAIN_COMPROMIS);
  // La carte condition d'avant FUT-20 (sans côté logement) : le rendu de main, à l'identique.
  const { run: rc } = await dossier("nimes", { chaleur: 3, confirme: true, avant: true });
  const cond = rc.facts.find((f: M) => f.id === "30189:condition:faible_chaleur");
  assert.equal(cond.logement, undefined);
  assert.equal(texte(rendreFait(cond)), RENDU_MAIN_CONDITION);
});

test("Relevé (lecture-dossier) : la carte expose les deux échelles, ses preuves datées et un seul geste", async () => {
  const { d } = await dossier("nimes", { chaleur: 3 });
  const card = d.sections.flatMap((s: M) => s.cards).find((c: M) => c.kind === "composition" && c.composition.patternId === "climate_comfort");
  const e = D.lireCarteDuDossier(d, card);
  assert.deepEqual(e.grains, ["commune", "adresse"]);
  assert.ok(e.echelles.includes("territoire") && e.echelles.includes("logement"));
  assert.equal(e.cotes.length, 1);
  assert.equal(e.cotes[0].libelle, "À cette adresse");
  assert.equal(e.cotes[0].geste, undefined, "le côté ne porte pas de second geste");
  assert.equal(e.geste.libelle, "Demandez si les fenêtres ont des volets ou des stores");
  assert.equal(e.cotes[0].preuves[0].date, "2024-03-18");
});

test("La conclusion de l'artefact suit ce qui est affiché (FUT-20 ne compte pas une carte disparue)", async () => {
  for (const o of [{ chaleur: 3 }, { chaleur: 0 }, { chaleur: 3, douceur: true }] as Opts[]) {
    const { d } = await dossier("nimes", o);
    const p = d.narrativePlan;
    // Les gestes « À contrôler en priorité » visent des cartes RENDUES.
    for (const a of p.priorityControl?.actions ?? []) assert.ok(idsVisibles(d).includes(a.anchorId), a.anchorId);
    // Le registre des compositions nomme la relation, jamais l'ancien geste générique.
    const bloc = p.blocks.find((b: M) => b.key === "compositions_found");
    if (bloc) assert.doesNotMatch(bloc.fallbackText, /Regardez comment le logement/);
  }
});

// Le rendu de main 8d02e190 (FactCompositionCard d'avant FUT-20), relevé le 16/10/2026 sur ces mêmes
// compositions : il épingle la rétrocompatibilité des artefacts engine-5 déjà vendus.
const RENDU_MAIN_CONFORT_ETE = "Des étés plus difficiles à concilier avec votre projet Les jours au-dessus de 35 °C passeraient de 3 par an sur la période de référence 1976-2005 à 14 à l'horizon 2050. Les nuits tropicales, elles, passeraient de 33 à 69 par an : des nuits où la température ne redescend pas sous 20 °C, et où le corps peine à récupérer. Cette trajectoire est lue à l'échelle de la commune, pas de l'adresse ni du logement. Preuve · 14 jours à l'horizon 2050 Preuve · 69 nuits à l'horizon 2050 Regardez comment le logement tient l'été Données et limites À vérifier L'orientation, l'étage, l'épaisseur des murs, les protections solaires et la possibilité d'ouvrir la nuit pèsent sur l'inconfort ressenti.";
const RENDU_MAIN_CONDITION = "des étés plus frais Ouverte · plutôt défavorable Les jours au-dessus de 35 °C passeraient de 3 par an sur la période de référence 1976-2005 à 14 à l'horizon 2050. Les nuits tropicales, elles, passeraient de 33 à 69 par an : des nuits où la température ne redescend pas sous 20 °C, et où le corps peine à récupérer. Preuve · 14 jours à l'horizon 2050 Preuve · 69 nuits à l'horizon 2050";
const RENDU_MAIN_COMPROMIS = "Des hivers doux, avec une exposition estivale à arbitrer Ce qui correspond Les températures moyennes d'hiver figurent parmi les plus douces à l'échelle nationale. Preuve · parmi les 20 % de communes aux hivers les plus doux (référence 1976-2005) Ce qui appelle un arbitrage Les jours au-dessus de 35 °C passeraient de 3 par an sur la période de référence 1976-2005 à 14 à l'horizon 2050. Les nuits tropicales, elles, passeraient de 33 à 69 par an : des nuits où la température ne redescend pas sous 20 °C, et où le corps peine à récupérer. Cette trajectoire est lue à l'échelle de la commune, pas de l'adresse ni du logement. Preuve · 14 jours à l'horizon 2050 Preuve · 69 nuits à l'horizon 2050 Regardez comment le logement tient l'été Données et limites À vérifier L'orientation, l'étage, l'épaisseur des murs, les protections solaires et la possibilité d'ouvrir la nuit pèsent sur l'inconfort ressenti.";

// ══════════════════════════════ 6. LE CONTRAT DU FAIT LOGEMENT ═════════════════════════════════

test("confortEteDepuisDpe : A / B1 / C, et le booléen de la règle ne peut pas diverger", async () => {
  const { confortEteDepuisDpe, buildLogementFacts } = await import("./decision/logement-facts.ts");
  const a = confortEteDepuisDpe(D.casDeLogement("temoin").dpe);
  assert.equal(a.niveau, "logement");
  assert.equal(a.indicateur, "insuffisant");
  // `protection_solaire: false` est « non renseignées », jamais « absentes ».
  assert.deepEqual(a.nonRenseignees, ["protection"]);
  assert.ok(!a.caracteristiques.some((x) => x.cle === "protection"));
  assert.equal(a.dateDiagnostic, "2024-03-18");
  const b1 = confortEteDepuisDpe(D.casDeLogement("immeuble").dpe);
  assert.deepEqual([b1.niveau, b1.indicateur, b1.methode], ["batiment", null, "immeuble"]);
  assert.deepEqual(b1.nonRenseignees, ["traversant", "protection"]);
  const c = confortEteDepuisDpe(null);
  assert.deepEqual([c.niveau, c.indicateur, c.caracteristiques.length, c.dateDiagnostic], ["aucun", null, 0, null]);
  const data = {
    rga: { coverage: "none", label: null }, pprn: { coverage: "none", count: 0, label: null }, cavites: { coverage: "none", count: 0 },
    patrimoine: { coverage: "none", count: 0 }, sinistralite: { coverage: "none", active: false },
  };
  for (const cas of ["temoin", "immeuble", "sans-dpe"] as const) {
    const lf = buildLogementFacts(data as never, D.casDeLogement(cas).dpe);
    assert.equal(lf.confortEteInsuffisant, lf.confortEte!.niveau === "logement" && lf.confortEte!.indicateur === "insuffisant", cas);
  }
});

test("Le geste tient sur une ligne pour toutes les postures et tous les niveaux de preuve", async () => {
  const { lectureChaleurLogement } = await import("./decision/chaleur-logement.ts");
  const relations = [null, { echelle: "adresse", relation: "lives_here" }, { echelle: "adresse", relation: null, objectif: "rent" }];
  for (const intent of [null, "achat", "location"]) {
    for (const relationAuLieu of relations) {
      for (const cas of ["temoin", "immeuble", "sans-dpe", "a-bon", "a-partiel", "ancien"] as Logement[]) {
        const l = { ...D.casDeLogement("temoin").faits, confortEte: D.confortEteDepuisDpe(dpeDe(cas)) };
        const r = lectureChaleurLogement({ hasAddress: true, logement: l, relationAuLieu } as never, { intent } as never)!;
        assert.ok(r.action.label.length <= 70 && !/[.!?]$/.test(r.action.label), r.action.label);
        assert.equal(r.cote.action, undefined);
        assert.doesNotMatch(`${r.cote.statement} ${r.action.detail}`, INTERDIT_VECU);
      }
    }
  }
  // Sans adresse, ou sans fait structuré (producteur d'avant FUT-20) : rien.
  assert.equal(lectureChaleurLogement({ hasAddress: false, logement: undefined } as never, { intent: null }), null);
  assert.equal(lectureChaleurLogement({ hasAddress: true, logement: D.casDeLogement("temoin").faits } as never, { intent: null }), null);
});
