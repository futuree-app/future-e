import { test, before } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";

// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-17 (19/10/2026) : RELECTURE SÉMANTIQUE DES COMPOSITIONS V1, SUR LE TEXTE QUE LE LECTEUR LIT.
//
// Ces tests rendent la section « Ma décision » de production (`DossierDecisionSection`, présentation
// classique, verdict déterministe) par react-dom/server, sur la vraie chaîne du moteur (règles,
// conditions, compositions, assemblage) et les vraies données DRIAS du dépôt. Ils vérifient ce que le
// dossier DIT : titres, constats, preuves, limites, gestes, verdict. « La carte apparaît » et « la carte
// dit vrai » sont deux assertions distinctes (AGENTS.md).
//
// Deux défauts démontrés et corrigés :
//   1. Le compromis hivers doux / étés chauds donnait au héros le sujet « l'exposition aux fortes
//      chaleurs », servi comme une PRIORITÉ du lecteur : « Nîmes répond moins bien à une de vos priorités :
//      l'exposition aux fortes chaleurs. » Le lecteur avait demandé l'inverse.
//   2. La carte chaleur sans logement s'intitulait « Des étés plus difficiles à concilier avec votre
//      projet » : une évolution que la classification ne lit pas (elle lit un niveau à 2050), et une saison
//      entière là où l'indicateur compte des jours au-dessus de 35 °C ou des nuits tropicales.
//
// LES ARTEFACTS FIGÉS (`__fixtures__/fut17-artefacts-avant.json`) ont été générés par main 5358667f, avant
// ces corrections. Ils ne sont jamais régénérés : ils sont ce qui a pu être vendu, et ils doivent se relire
// à l'identique. Aucun réseau, aucun appel Anthropic.
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
  // La section importe la conclusion rédigée (composant serveur) : elle n'est pas rendue ici (verdict
  // déterministe, logementStatus « pending »), mais son module doit se charger.
  if (spec === "next/headers" || spec === "next/cache") {
    return { url: "data:text/javascript,export const headers=async()=>new Map();export const cookies=async()=>({get:()=>undefined});export const unstable_cache=(f)=>f;export const revalidateTag=()=>{};", shortCircuit: true };
  }
  if (spec.startsWith("@/")) {
    const b = ${JSON.stringify(racine)} + "src/" + spec.slice(2);
    return premier([b + ".ts", b + ".tsx", b], ctx, next);
  }
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\\.[cm]?[jt]sx?$|\\.json$/.test(spec)) {
    return premier([spec + ".ts", spec + ".tsx", spec], ctx, next);
  }
  if (spec === "next/link") return next("next/link.js", ctx);
  if (spec === "next/navigation") return next("next/navigation.js", ctx);
  return next(spec, ctx);
}
export async function load(url, ctx, next) {
  if (url.endsWith(".css")) return { format: "module", source: "export default new Proxy({}, { get: (_, k) => String(k) });", shortCircuit: true };
  if (!url.endsWith(".tsx")) return next(url, ctx);
  const fichier = fileURLToPath(url);
  const { outputText } = ts.transpileModule(readFileSync(fichier, "utf8"), {
    fileName: fichier,
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return { format: "module", source: outputText, shortCircuit: true };
}`;

type M = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
let D: M;
let rendreSection: (d: unknown) => string;
let rendreComposition: (c: unknown) => string;
let getClimatDataCommune: (insee: string) => Promise<{ commune: { s?: unknown } } | null>;

before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { createElement } = await import("react");
  const { DossierDecisionSection } = await import("../components/report/DossierDecisionSection.tsx");
  const { FactCompositionCard } = await import("../components/report/FactCompositionCard.tsx");
  // `pending` : le verdict déterministe (ConclusionBlock), celui que la production affiche aussi en repli.
  rendreSection = (d) => renderToStaticMarkup(createElement(DossierDecisionSection, {
    dossier: d, insee: "x", scopeKey: "commune", presentation: "classique", logementStatus: "pending",
  } as never));
  rendreComposition = (c) => renderToStaticMarkup(createElement(FactCompositionCard, { composition: c, color: "x", absorbedFacts: [] } as never));
  ({ getClimatDataCommune } = await import("./drias-json.ts"));
  D = {
    ...(await import("./decision/module-facts-map.ts")),
    ...(await import("./decision/materiality-rules.ts")),
    ...(await import("./decision/decision-assembler.ts")),
    ...(await import("./decision/fact-compositions.ts")),
    ...(await import("./decision/climat-facts.ts")),
    ...(await import("./decision/logement-facts.ts")),
    ...(await import("./decision/conditions.ts")),
    ...(await import("./decision/autour-facts.ts")),
    ...(await import("./decision/decision-artifact.ts")),
    ...(await import("./decision/conclusion-hash.ts")),
    ...(await import("../components/prototypes/fut87/fixture-logement.ts")),
    ...(await import("./hard-constraints-hydrate.ts")),
    ...(await import("./hard-constraints.ts")),
    ...(await import("./user-project.ts")),
  };
});

/** Le texte que lit le lecteur : balises retirées, entités décodées, espaces normalisées. */
function texte(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&apos;/g, "'").replace(/&quot;/g, "\"").replace(/&amp;/g, "&").replace(/&nbsp;| /g, " ")
    .replace(/\s+/g, " ").trim();
}

// ── Les communes, et leurs vraies données DRIAS ───────────────────────────────────────────────
const COMMUNES = {
  nimes: { insee: "30189", nom: "Nîmes", dept: "30", lat: 43.84, lon: 4.36, pop: 148_000 },
  montpellier: { insee: "34172", nom: "Montpellier", dept: "34", lat: 43.61, lon: 3.88, pop: 300_000 },
  larochelle: { insee: "17300", nom: "La Rochelle", dept: "17", lat: 46.16, lon: -1.15, pop: 78_000 },
  briancon: { insee: "05023", nom: "Briançon", dept: "05", lat: 44.9, lon: 6.64, pop: 11_000 },
  salers: { insee: "15209", nom: "Salers", dept: "15", lat: 45.14, lon: 2.49, pop: 330 },
} as const;

type Opts = {
  commune: keyof typeof COMMUNES;
  logement?: "temoin" | "immeuble" | "sans-dpe" | null; // null : pas d'adresse
  prefs: Record<string, number>;
  confirme?: string[];
  entry?: Record<string, unknown>;
  scores?: Record<string, number>;
  faits?: Record<string, unknown>;
  logementFaits?: Record<string, unknown>;
  wildfire?: boolean;
  sansConfort?: boolean; // un producteur d'avant FUT-20 : aucun `confortEte`
  climat?: "reel" | "absent";
};

const climats = new Map<string, unknown>();
async function climatDe(insee: string): Promise<unknown> {
  if (!climats.has(insee)) {
    const avertir = console.warn; console.warn = () => {};
    try { climats.set(insee, D.buildClimatFacts(((await getClimatDataCommune(insee))?.commune.s) ?? null)); } finally { console.warn = avertir; }
  }
  return climats.get(insee);
}

function projetDe(o: Opts): unknown {
  const p = D.normalizeUserProject({
    posture: "recherche", intent: "achat", rawText: "…", updatedAt: "2026-09-01T00:00:00.000Z",
    parsed: { reformulation: "x", hardConstraints: {}, preferences: Object.entries(o.prefs).map(([key, weight]) => ({ key, weight })) },
  });
  if (!o.confirme?.length) return p;
  return D.normalizeUserProject({ ...p, conditions: o.confirme.map((key) => D.buildConfirmation(p, { kind: "preference", key }, "2026-10-01T00:00:00.000Z")) });
}

// LE MÊME ENCHAÎNEMENT que `assembleAddressDossier` / le dossier communal, sans I/O. Il reproduit à
// l'identique la génération des artefacts figés (mêmes entrées, même date).
async function dossier(o: Opts) {
  const k = COMMUNES[o.commune];
  const climat = o.climat === "absent" ? null : await climatDe(k.insee);
  const entry = {
    insee: k.insee, nom: k.nom, dept: k.dept, region: "x", lat: k.lat, lon: k.lon, population: k.pop, densite: 500, altitude: 50,
    clim: {}, pct: {}, ...(o.entry ?? {}),
  };
  const adresse = o.logement != null;
  const base = D.mapCommuneToModuleFacts(entry, o.scores ?? {}, {
    hasAddress: adresse, tailleVille: k.pop, tailleVilleSource: "commune", climat, risquesDeclares: { wildfire: o.wildfire ?? false },
  });
  let logement: M | undefined;
  if (adresse) {
    const dpe = D.casDeLogement(o.logement).dpe;
    const confortEte = D.confortEteDepuisDpe(dpe);
    logement = {
      ...D.casDeLogement(o.logement).faits,
      confortEteInsuffisant: confortEte.niveau === "logement" && confortEte.indicateur === "insuffisant",
      ...(o.sansConfort ? {} : { confortEte }),
      ...(o.logementFaits ?? {}),
    };
  }
  const facts = { ...base, hasAddress: adresse, ...(logement ? { logement, relationAuLieu: { echelle: "adresse", relation: null } } : {}), ...(o.faits ?? {}) };
  const project = projetDe(o);
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
  return { run, comps, d, project, vu: texte(rendreSection(d)) };
}

const DOUCEUR = { rankBands: { douceur_climat: [8800, 9700] } };
const composition = (d: M, patternId: string): M | undefined => d.compositions.find((c: M) => c.patternId === patternId);

// ═══════════════════════ 1. LE COMPROMIS NOMME LA PRIORITÉ DU LECTEUR ════════════════════════

test("Compromis hivers doux / étés chauds : le héros nomme « des étés supportables », jamais l'exposition comme priorité", async () => {
  const { d, vu } = await dossier({ commune: "nimes", logement: null, prefs: { faible_chaleur: 3, douceur_climat: 3 }, entry: DOUCEUR });
  assert.equal(composition(d, "seasonal_climate_tradeoff")?.headlineSubject, "des étés supportables");
  // Ce que le lecteur lit, en tête du dossier, puis la carte qui le démontre.
  assert.match(vu, /Arbitrage commune Nîmes répond moins bien à une de vos priorités : des étés supportables\. La douceur des hivers répond en revanche à votre projet\./);
  assert.match(vu, /Des hivers doux, avec une exposition estivale à arbitrer Ce qui correspond Les températures moyennes d'hiver/);
  assert.doesNotMatch(vu, /vos priorités[^.]*: l'exposition aux fortes chaleurs|moins bien pour l'exposition/);
});

test("Compromis : sur toutes les orientations atteignables, le sujet nommé est une priorité du lecteur", async () => {
  // Les gabarits du héros qui reçoivent ce sujet : « répond moins bien à une de vos priorités : X »,
  // « … et moins bien à une autre : X », « … mais moins bien pour X », et l'énumération de deux écarts.
  const extras: [Record<string, number>, string[], Record<string, unknown>][] = [
    [{}, [], {}],
    [{ acces_soins: 3 }, [], { acces_soins: [8500, 9000] }],
    [{ acces_soins: 2 }, [], { acces_soins: [8500, 9000] }],
    [{ acces_soins: 3 }, [], { acces_soins: [1000, 1500] }],
    [{ faible_risque_feu: 3 }, [], {}],
    [{ acces_soins: 3 }, ["acces_soins"], { acces_soins: [8500, 9000] }],
  ];
  let vus = 0;
  for (const [prefs, confirme, rangs] of extras) {
    for (const wc of [2, 3]) for (const wd of [2, 3]) for (const logement of [null, "temoin"] as const) {
      const { d, comps, vu } = await dossier({
        commune: "nimes", logement, prefs: { faible_chaleur: wc, douceur_climat: wd, ...prefs }, confirme,
        entry: { rankBands: { ...DOUCEUR.rankBands, ...rangs } },
      });
      if (!comps.some((c) => c.patternId === "seasonal_climate_tradeoff")) continue;
      vus++;
      const h = d.narrativePlan.verdict.headline.text as string;
      assert.doesNotMatch(h, /l'exposition aux fortes chaleurs/, h);
      // Quand le héros nomme la chaleur, il la nomme comme le lecteur l'a demandée.
      if (d.narrativePlan.verdict.headline.consumedCompositionIds?.length) assert.match(h, /des étés supportables/, h);
      assert.doesNotMatch(vu, /vos priorités[^.]*: [^.]*l'exposition aux fortes chaleurs|moins bien pour l'exposition/);
    }
  }
  assert.ok(vus >= 30, `matrice trop pauvre : ${vus}`);
});

// ═══════════════════════ 2. LA CARTE CHALEUR SANS LOGEMENT : LE NIVEAU, PAS L'ÉTÉ ═══════════════════

test("Sans adresse : la carte nomme le niveau projeté, et ce que disent ses preuves, limite et geste", async () => {
  const { vu } = await dossier({ commune: "nimes", logement: null, prefs: { faible_chaleur: 3, acces_soins: 2 } });
  const attendu = [
    "Nîmes répond moins bien à une de vos priorités : des étés supportables.",
    "Ce qui correspond moins bien",
    "De fortes chaleurs projetées à l'horizon 2050",
    "Les jours au-dessus de 35 °C passeraient de 3 par an sur la période de référence 1976-2005 à 14 à l'horizon 2050. Les nuits tropicales, elles, passeraient de 33 à 69 par an",
    "Cette trajectoire est lue à l'échelle de la commune, pas de l'adresse ni du logement.",
    "Preuve · 14 jours à l'horizon 2050 Preuve · 69 nuits à l'horizon 2050",
    "Renseignez votre adresse pour descendre au niveau du logement",
  ];
  let pos = -1;
  for (const a of attendu) {
    const i = vu.indexOf(a);
    assert.ok(i > pos, `« ${a} » absent ou hors d'ordre dans : ${vu}`);
    pos = i;
  }
  assert.doesNotMatch(vu, /étés plus|plus difficiles|étés très chauds/);
});

test("Montpellier (nuits seules) : ni saison entière ni jours au-dessus de 35 °C qui ne franchissent pas le seuil", async () => {
  const { vu, d } = await dossier({ commune: "montpellier", logement: null, prefs: { faible_chaleur: 3 } });
  const c = composition(d, "climate_comfort")!;
  const t = texte(rendreComposition(c));
  assert.match(t, /^De fortes chaleurs projetées à l'horizon 2050 Les nuits tropicales passeraient de 35 par an sur la période de référence 1976-2005 à 72 à l'horizon 2050/);
  assert.doesNotMatch(t, /35 °C|étés/);
  assert.match(vu, /Preuve · 72 nuits à l'horizon 2050/);
});

test("Avec adresse : les titres FUT-20 sont inchangés, et aucun titre ne dit une évolution ou une saison", async () => {
  const titres: Record<string, string> = {
    temoin: "De fortes chaleurs projetées, et un confort d'été classé insuffisant",
    immeuble: "De fortes chaleurs projetées, et un confort d'été encore à vérifier",
    "sans-dpe": "De fortes chaleurs projetées, et un confort d'été encore à vérifier",
  };
  for (const [logement, titre] of Object.entries(titres)) {
    const { d, vu } = await dossier({ commune: "nimes", logement: logement as Opts["logement"], prefs: { faible_chaleur: 3 } });
    assert.equal(composition(d, "climate_comfort")!.title, titre, logement);
    assert.ok(vu.includes(titre), logement);
    assert.doesNotMatch(vu, /étés plus|plus difficiles|étés très chauds/, logement);
  }
});

// ═══════════════════════ 3. CE QUI A ÉTÉ VENDU SE RELIT À L'IDENTIQUE ════════════════════════════

const FIGES = JSON.parse(readFileSync("src/lib/__fixtures__/fut17-artefacts-avant.json", "utf8")) as Record<string, M>;
// Les entrées exactes qui ont produit chaque artefact figé (générateur : main 5358667f).
const ENTREES: Record<string, Opts> = {
  "commune-confort-ete": { commune: "nimes", logement: null, prefs: { faible_chaleur: 3, acces_soins: 2 } },
  "commune-compromis": { commune: "nimes", logement: null, prefs: { faible_chaleur: 3, douceur_climat: 3 }, entry: DOUCEUR },
  "adresse-confort-ete-avant-fut20": { commune: "nimes", logement: "temoin", sansConfort: true, prefs: { faible_chaleur: 3, acces_soins: 2 } },
  "adresse-compromis": { commune: "nimes", logement: "temoin", prefs: { faible_chaleur: 3, douceur_climat: 2, acces_soins: 2 }, entry: { rankBands: { douceur_climat: [8800, 9700], acces_soins: [8500, 9000] } } },
};

test("Artefacts figés avant FUT-17 : relus et rendus mot pour mot, verdict et empreinte de conclusion inchangés", () => {
  for (const [nom, { artefact, attendu }] of Object.entries(FIGES).filter(([k]) => !k.startsWith("_"))) {
    const art = D.parseDecisionArtifact(JSON.parse(JSON.stringify(artefact)));
    assert.ok(art, nom);
    assert.equal(art.engineVersion, "engine-5", nom);
    const c = art.dossier.compositions.find((x: M) => ["climate_comfort", "seasonal_climate_tradeoff"].includes(x.patternId));
    // Le texte vendu, y compris l'ancienne formulation : rien n'est réécrit rétroactivement.
    assert.equal(texte(rendreComposition(c)), attendu.carte, nom);
    assert.equal(art.dossier.narrativePlan.verdict.headline.text, attendu.heros, nom);
    // Même plan, même empreinte : la conclusion rédigée d'un artefact n'est pas régénérée.
    assert.equal(D.buildConclusionHash(art.dossier.narrativePlan), attendu.hash, nom);
    // Le rendu complet d'un artefact figé ne dépend pas du générateur courant.
    assert.ok(texte(rendreSection(art.dossier)).includes(attendu.heros), nom);
  }
  assert.match(FIGES["commune-confort-ete"]!.attendu.carte, /^Des étés plus difficiles à concilier avec votre projet /);
  assert.match(FIGES["commune-compromis"]!.attendu.heros, /: l'exposition aux fortes chaleurs\.$/);
});

test("Nouvelle génération des mêmes entrées : seules les deux formulations corrigées changent", async () => {
  // Le reste du dossier est identique au figé : verdict (étiquette, ton, détail), orientation, état de
  // conclusion, couverture, registre des critères, cartes et sections, gestes, compositions. Les décisions
  // métier sont préservées ; seuls le titre sans logement et le sujet du compromis changent.
  const corrige = (s: string) => s
    .replaceAll("Des étés plus difficiles à concilier avec votre projet", "De fortes chaleurs projetées à l'horizon 2050")
    .replaceAll("\"headlineSubject\":\"l'exposition aux fortes chaleurs\"", "\"headlineSubject\":\"des étés supportables\"")
    .replaceAll("vos priorités : l'exposition aux fortes chaleurs.", "vos priorités : des étés supportables.");
  for (const [nom, o] of Object.entries(ENTREES)) {
    const { d, project } = await dossier(o);
    const neuf = D.buildDecisionArtifact(d, project, "2026-10-19T10:00:00.000Z", D.PRODUCT_CONVENTIONS_VERSION);
    const fige = FIGES[nom]!.artefact;
    const json = (x: unknown) => JSON.stringify(x);
    assert.equal(json(neuf.dossier), corrige(json(fige.dossier)), nom);
    for (const k of ["engineVersion", "conventionsVersion", "projectSnapshot"]) assert.deepEqual(neuf[k], fige[k], `${nom} : ${k}`);
  }
});

// ═══════════════════════ 4. LES BRANCHES DE CHAQUE COMPOSITION, LUES SUR LE RENDU ══════════════════

test("Chaleur ambiante (non demandée) : sans adresse, aucune composition ; avec adresse B1, deux échelles, rien du bâtiment attribué au logement", async () => {
  const commune = await dossier({ commune: "nimes", logement: null, prefs: { acces_soins: 2 } });
  assert.equal(composition(commune.d, "ambient_heat_housing"), undefined);
  assert.match(commune.vu, /Au-delà de vos priorités, ces constats sont établis pour ce lieu\. Les jours au-dessus de 35 °C passeraient/);
  assert.match(commune.vu, /futur•e signale cette exposition à partir de 10 jours par an au-dessus de 35 °C, ou de 39 nuits tropicales par an, hors priorité déclarée\./);
  const b1 = await dossier({ commune: "nimes", logement: "immeuble", prefs: { acces_soins: 2 } });
  const t = texte(rendreComposition(composition(b1.d, "ambient_heat_housing")));
  assert.match(t, /^De fortes chaleurs projetées, et un confort d'été encore à vérifier À l'échelle de la commune .* À cette adresse Le diagnostic retrouvé, daté du 7 novembre 2023, a été généré à partir des données de l'immeuble : il décrit le bâtiment .*, pas ce logement/);
  assert.match(t, /Preuve · diagnostic établi à l'immeuble/);
  assert.doesNotMatch(t, /Le logement (n'est pas|est) traversant|classe son confort d'été/);
});

test("Sous le seuil (La Rochelle), en montagne (Briançon), sans donnée : aucune carte chaleur, aucune progression", async () => {
  for (const o of [
    { commune: "larochelle", logement: "temoin", prefs: { faible_chaleur: 3 } },
    { commune: "briancon", logement: "temoin", prefs: { faible_chaleur: 3 } },
    { commune: "nimes", logement: "temoin", prefs: { faible_chaleur: 3 }, climat: "absent" },
  ] as Opts[]) {
    const { d, vu } = await dossier(o);
    assert.ok(!d.compositions.some((c: M) => ["climate_comfort", "seasonal_climate_tradeoff", "ambient_heat_housing"].includes(c.patternId)), o.commune);
    assert.doesNotMatch(vu, /fortes chaleurs projetées|passeraient|progression|plus difficiles/, `${o.commune} ${o.climat ?? ""}`);
  }
  // La Rochelle : la carte logement reste la sienne, sans relation climatique inventée.
  const { vu } = await dossier({ commune: "larochelle", logement: "temoin", prefs: { faible_chaleur: 3 } });
  assert.match(vu, /Confort d'été insuffisant Le diagnostic classe l'indicateur réglementaire de confort d'été de ce logement comme insuffisant\. Cet indicateur décrit le bâti, pas les conditions vécues/);
});

test("Feu : deux fondements, deux titres ; le geste suit le grain", async () => {
  const recense = await dossier({ commune: "larochelle", logement: null, prefs: { faible_risque_feu: 2 }, wildfire: true });
  assert.match(recense.vu, /Un risque de feu de forêt recensé pour la commune À La Rochelle, le risque de feu de forêt est officiellement recensé par l'État \(Géorisques\)\. L'indice de danger météorologique que futur•e projette reste sous son seuil de signalement ici/);
  assert.match(recense.vu, /Renseignez votre adresse pour descendre au niveau du terrain/);
  assert.doesNotMatch(recense.vu, /s'aggrave/);
  const trajectoire = await dossier({ commune: "nimes", logement: "temoin", prefs: { faible_risque_feu: 3 } });
  // « s'aggrave » est porté par la comparaison affichée (34 → 50 jours) : la référence existe et la valeur monte.
  assert.match(trajectoire.vu, /Une trajectoire de danger d'incendie qui s'aggrave Les jours où l'indice forêt-météo dépasse 40, seuil de danger météorologique très sévère, passeraient de 34 par an sur la période de référence 1976-2005 à 50 à l'horizon 2050\./);
  assert.match(trajectoire.vu, /Regardez la végétation autour du terrain/);
});

test("Petite taille : une cause, deux priorités du lecteur, et la limite qui interdit d'en conclure l'isolement", async () => {
  const { vu } = await dossier({ commune: "salers", logement: null, prefs: { prefere_grande_ville: 3, eviter_isolement: 3 } });
  assert.match(vu, /Salers répond moins bien à deux de vos priorités, pour la même raison : sa petite taille\./);
  assert.match(vu, /Une même petite taille joue sur plusieurs de vos priorités État observé Preuve · un village, population communale : environ 330 habitants/);
  assert.match(vu, /Cela ne permet pas de conclure à un isolement effectif/);
});

test("Argiles et plan de prévention : seulement si le plan dit la sécheresse ; chaque item garde son geste", async () => {
  const secheresse = await dossier({ commune: "larochelle", logement: "temoin", prefs: { acces_soins: 2 }, logementFaits: { pprnLabel: "PPR Retrait-gonflement des argiles (sécheresse)" } });
  assert.match(secheresse.vu, /Un sol argileux et la règle qui l'encadre L'exposition du sol Aléa moyen ou fort À cette adresse, le sol est exposé au retrait-gonflement des argiles\. L'exposition de la zone ne prouve pas un dommage sur ce bien\. Demandez l'historique des fissures et des sinistres La règle applicable/);
  assert.match(secheresse.vu, /Consultez le règlement de la zone en mairie/);
  // Le plan de la fixture est un plan INONDATION : aucune composition argiles, deux cartes séparées.
  const inondation = await dossier({ commune: "larochelle", logement: "temoin", prefs: { acces_soins: 2 } });
  assert.equal(composition(inondation.d, "clay_regulation_grouped"), undefined);
  assert.doesNotMatch(inondation.vu, /Un sol argileux et la règle/);
});

test("Conditions confirmées (FUT-110) : le sens reste celui de la commune, le constat d'adresse ne l'inverse pas", async () => {
  const snapshot = {
    center: { lat: 46.16, lon: -1.15 },
    bpe: { categories: [{ category: "sante", nearest: { distanceMeters: 553, typeLabel: "Médecin généraliste" }, searchCapMeters: 5000, withinWalkCount: 1 }] },
    osm: { potentiallyNoisyInfrastructure: [], nearestMappedGreenSpace: null, bboxRadiusMeters: 1500 },
    sourceStatus: { bpe: "complete", osmInfrastructure: "complete", osmGreenSpaces: "complete" },
    sources: { bpeVersion: "face3-2026-07-08e", osmFetchedAt: null, osmQueryVersion: "v1", bpeMillesime: "2025" },
    computedAt: "2026-09-21T10:00:00.000Z",
  };
  const { vu } = await dossier({
    commune: "larochelle", logement: "temoin", prefs: { acces_soins: 3 }, confirme: ["acces_soins"],
    entry: { rankBands: { acces_soins: [8500, 9000] } }, faits: { autour: D.buildAutourFacts(snapshot) },
  });
  assert.match(vu, /Une condition sans compromis reste ouverte à La Rochelle : un bon accès aux soins\. Les données disponibles sont plutôt favorables pour un bon accès aux soins\./);
  assert.match(vu, /Ouverte · plutôt favorable Pour l'accès aux soins, La Rochelle se situe parmi les 20 % de communes où il est le plus favorable en France\. Un médecin généraliste se trouve à environ 550 m de cette adresse\./);
  assert.match(vu, /Le sens de cette lecture vient de la commune, sans seuil fixé par vous\. Le constat autour de l'adresse ne l'oriente pas : il reste à vérifier\./);
  assert.doesNotMatch(vu, /plutôt défavorable/);
  // La chaleur confirmée : défavorable par la commune, le logement s'ajoute sans peser, un seul geste.
  const ch = await dossier({ commune: "nimes", logement: "temoin", prefs: { faible_chaleur: 3 }, confirme: ["faible_chaleur"] });
  assert.match(ch.vu, /Les données disponibles sont plutôt défavorables pour des étés plus frais\./);
  assert.match(ch.vu, /Ouverte · plutôt défavorable Les jours au-dessus de 35 °C passeraient/);
  assert.match(ch.vu, /À cette adresse Confort d'été insuffisant Le diagnostic de ce logement, daté du 18 mars 2024/);
  assert.equal((ch.vu.match(/Demandez si les fenêtres ont des volets ou des stores/g) ?? []).length, 1);
});

test("FUT-112 : aucune progression des nuits chaudes n'est affirmée dans le dossier rendu", async () => {
  const cas: Opts[] = [
    { commune: "nimes", logement: "temoin", prefs: { faible_chaleur: 3 } },
    { commune: "nimes", logement: "sans-dpe", prefs: { acces_soins: 2 } },
    { commune: "larochelle", logement: "immeuble", prefs: { faible_chaleur: 2 } },
    { commune: "briancon", logement: null, prefs: { faible_chaleur: 3 } },
    { commune: "montpellier", logement: "temoin", prefs: { faible_chaleur: 3, douceur_climat: 3 }, entry: DOUCEUR },
  ];
  for (const o of cas) {
    const { vu } = await dossier(o);
    assert.doesNotMatch(vu, /progression|de plus en plus|s'accél|deviennent plus nombreuses/, o.commune);
  }
});
