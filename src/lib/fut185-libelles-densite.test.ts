// FUT-185 · UNE DENSITÉ MOYENNE N'EST NI UNE RURALITÉ NI UNE DÉPENDANCE À LA VOITURE.
//
// Avant FUT-185, toute commune sous 1 500 hab/km² recevait `rural_peri_urbain` (34 134 communes sur 34 788,
// dont 3 612 communes urbaines au sens de la grille Insee 2025 : Nîmes, Aix-en-Provence, Avignon, Colmar…).
// L'accueil en tirait « dépendance à la voiture » (accroche, introduction des questions) et une carte
// « le quotidien dépend largement de la voiture », sourcée « INSEE MOBPRO » sans lire MOBPRO, que la seule
// catégorie montagne suffisait aussi à produire (Grenoble, 32 % de trajets domicile-travail en voiture).
//
// Ces tests lisent les SORTIES RÉELLES (getHeroCopy, getQuestionIntro, getPreviewCards) sur l'index publié,
// pour toutes les communes, puis sur des cas nommés. « La carte apparaît » et « la carte dit vrai » sont deux
// assertions distinctes : chaque carte Mobilité est rapprochée de la mesure de l'index.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import {
  carteMobilite,
  carteMobiliteMachineASous,
  getEmptyStateCopy,
  getHeroCopy,
  getPreviewCards,
  getQuestionIntro,
  MACHINE_A_SOUS_MOBPRO,
  SOURCE_MOBPRO,
  type CarteApercu,
} from "./accueil/recits.ts";
import { construirePromptUtilisateur, type ContexteQna } from "./accueil/qna.ts";
import { deriveTerritoryType } from "./territory-mood.ts";

const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (spec.startsWith("@/")) return next(${JSON.stringify(racine)} + "src/" + spec.slice(2) + ".ts", ctx);
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\\.[cm]?[jt]s$|\\.json$/.test(spec)) {
    try { return await next(spec + ".ts", ctx); } catch { return next(spec, ctx); }
  }
  return next(spec, ctx);
}`;

type Commune = {
  insee: string; nom: string; densite: number | null;
  mobilite?: { part_voiture: number; dependance: number } | null;
} & Record<string, unknown>;
const COMMUNES: Commune[] = JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8")).communes;
const PAR = new Map(COMMUNES.map((c) => [c.insee, c]));
const commune = (insee: string) => {
  const c = PAR.get(insee);
  assert.ok(c, `${insee} absent de l'index`);
  return c;
};

let categoriesDe: (c: Commune) => string[];
before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  const vie = await import(`${racine}src/lib/comparateur-vie.ts`);
  categoriesDe = vie.deriveCategoriesFromEntry;
});

// Ce que l'accueil fait d'une commune reconnue de l'index (FutureELanding.tsx) : catégories de l'index, part
// voiture de /api/landing-signals, cadrage contextualisé dès qu'une catégorie autre que « all » existe.
function accueil(c: Commune, cats = categoriesDe(c)) {
  const usedFallback = cats.every((k) => k === "all");
  const mobilite = c.mobilite ? { partVoitureDomicileTravail: c.mobilite.part_voiture } : null;
  const cartes = getPreviewCards(c.nom, cats, {}, null, "2050", mobilite);
  return {
    cats,
    hero: getHeroCopy(c.nom, cats, usedFallback),
    intro: getQuestionIntro(c.nom, cats, usedFallback),
    vide: getEmptyStateCopy(cats),
    cartes,
    mobilite: cartes.find((k) => k.cle === "mobilite") ?? null,
  };
}
const texte = (k: CarteApercu) => [k.titre, k.valeur, k.fait, k.lecture, k.limite, k.source].filter(Boolean).join(" ");
const pct = (c: Commune) => Math.round(c.mobilite!.part_voiture * 100);

// Les catégories de la table manuelle (Supabase `communes_categorization`) qui portent ces clés, relevées le
// 10/11/2026 (docs/audits/2026-11-10-fut185-libelles-densite/table-manuelle-2026-11-10.json). Elles passent
// AVANT l'index dans l'accueil, et ne reposent sur aucune mesure.
const MANUELLES: string[][] = JSON.parse(
  readFileSync("docs/audits/2026-11-10-fut185-libelles-densite/table-manuelle-2026-11-10.json", "utf8"),
).lignes.map((r: { categories: string[] }) => r.categories);

// ── Catégories ──────────────────────────────────────────────────────────────────────────────

test("national : plus aucune commune ne reçoit `rural_peri_urbain` de l'index", () => {
  const avec = COMMUNES.filter((c) => categoriesDe(c).includes("rural_peri_urbain"));
  assert.deepEqual(avec.map((c) => c.insee), []);
});

test("national : `periurbain_dependance_auto` garde sa règle exacte (densité < 1 500 ET part voiture au 60e percentile ou plus)", () => {
  let n = 0;
  for (const c of COMMUNES) {
    const attendu = c.densite != null && c.densite < 1500 && c.mobilite != null && c.mobilite.dependance >= 60;
    assert.equal(categoriesDe(c).includes("periurbain_dependance_auto"), attendu, `${c.nom} (${c.insee})`);
    if (attendu) n++;
  }
  assert.equal(n, 12203); // inchangé par FUT-185 (rejeu national du 10/11/2026)
});

test("national : les autres catégories gardées par la densité ne changent pas (agricole, forestier, vie locale)", () => {
  // Leurs seuils OSO (30 %, 35 %) relèvent de FUT-182 ; FUT-185 ne les touche pas. FUT-182 (10/11/2026) : mêmes seuils,
  // désormais en % des TERRES (serres comprises dans les cultures) et avant arrondi : +143 / −4 et +122 / −8 communes.
  const compte = (k: string) => COMMUNES.filter((c) => categoriesDe(c).includes(k)).length;
  assert.deepEqual(
    { rural_agricole: compte("rural_agricole"), rural_forestier: compte("rural_forestier"), faible_vie_locale: compte("faible_vie_locale") },
    { rural_agricole: 17109, rural_forestier: 13494, faible_vie_locale: 20749 }, // 16 970 et 13 380 avant FUT-182
  );
});

// ── Cadrage : aucune « dépendance à la voiture » ─────────────────────────────────────────────

test("national : ni l'accroche, ni l'introduction des questions ne parlent de voiture, catégories de l'index ou table manuelle", () => {
  for (const c of COMMUNES) {
    const a = accueil(c);
    assert.doesNotMatch(a.hero, /voiture/, `${c.nom} hero`);
    assert.doesNotMatch(a.intro, /voiture/, `${c.nom} intro`);
  }
  for (const cats of [...MANUELLES, ["rural_peri_urbain"], ["periurbain_dependance_auto"], ["rural_peri_urbain", "periurbain_dependance_auto"]]) {
    for (const fb of [true, false]) {
      assert.doesNotMatch(getHeroCopy("X", cats, fb) + getQuestionIntro("X", cats, fb), /voiture|périurbain|rural/i, cats.join(","));
    }
  }
});

test("état vide : il annonce des déplacements seulement quand la part voiture mesurée ouvre les questions sur la voiture", () => {
  for (const c of COMMUNES) {
    const a = accueil(c);
    // Le littoral et la montagne passent avant (Apremont) ; ailleurs, l'annonce suit exactement la catégorie.
    const prioritaire = a.cats.includes("littoral") || a.cats.includes("montagne");
    assert.equal(/déplacements/.test(a.vide), !prioritaire && a.cats.includes("periurbain_dependance_auto"), c.nom);
  }
  assert.doesNotMatch(getEmptyStateCopy(["rural_peri_urbain"]), /déplacements/);
});

// ── Carte Mobilité : elle apparaît avec la mesure, et dit la mesure ─────────────────────────────

test("national : la carte Mobilité existe si et seulement si la part voiture MOBPRO est mesurée", () => {
  for (const c of COMMUNES) assert.equal(accueil(c).mobilite != null, c.mobilite != null, c.nom);
});

test("national : chaque carte Mobilité dit la part de l'index, sous la source MOBPRO, et rien d'autre", () => {
  for (const c of COMMUNES) {
    const m = accueil(c).mobilite;
    if (!m) continue;
    assert.equal(m.valeur, `${pct(c)} %`, c.nom);
    assert.match(m.fait, new RegExp(`, ${pct(c)} % des actifs en emploi qui y habitent vont travailler en voiture\\.$`), c.nom);
    assert.equal(m.source, SOURCE_MOBPRO);
    assert.match(m.limite!, /domicile-travail/);
  }
});

test("national : plus aucune phrase « dépend largement de la voiture » ni « transports et courtes distances », sur aucune carte", () => {
  for (const c of COMMUNES) {
    for (const k of accueil(c).cartes) assert.doesNotMatch(texte(k), /dépend largement|courtes distances|pèsent dans les trajets/, `${c.nom} ${k.cle}`);
  }
});

test("aucune carte ne porte la source MOBPRO sans montrer la mesure, même avec toutes les catégories", () => {
  const toutes = ["periurbain_dependance_auto", "rural_peri_urbain", "rural_agricole", "rural_forestier", "rural_viticole", "montagne", "littoral"];
  for (const mobilite of [undefined, null, { partVoitureDomicileTravail: null }, { partVoitureDomicileTravail: Number.NaN }, { partVoitureDomicileTravail: 1.2 }]) {
    const cartes = getPreviewCards("Saint-Exemple", toutes, {}, null, "2050", mobilite);
    assert.ok(!cartes.some((k) => k.cle === "mobilite" || /MOBPRO/.test(k.source)), JSON.stringify(mobilite));
  }
  assert.equal(carteMobilite("X", { partVoitureDomicileTravail: 0 })!.valeur, "0 %");
  assert.equal(carteMobilite("X", { partVoitureDomicileTravail: 1 })!.valeur, "100 %");
});

// ── Cas nommés : les phrases réellement rendues ─────────────────────────────────────────────

const GENERIQUE = (nom: string, de: string) =>
  `futur•e décode les données publiques pour projeter l'impact du changement climatique sur votre quotidien. Accédez à une première lecture personnalisée de l'évolution ${de} à travers le prisme du climat, de la santé et du logement.`;

test("villes urbaines sous 1 500 hab/km² : textes rendus, sans ruralité ni voiture déduite", () => {
  const attendu: Record<string, { hero: string; intro: string; mob: string }> = {
    // Nîmes, Avignon : l'angle méditerranéen passait déjà avant ; seule la carte et les questions changent.
    "30189": { hero: "futur•e croise chaleur, qualité de l'air, mobilité et logement pour lire ce que vivre à Nîmes veut vraiment dire dans un territoire où les étés se réchauffent.", intro: "À Nîmes, le futur se joue déjà entre chaleur, nuits tropicales et météo propice aux feux.", mob: "À Nîmes, 66 % des actifs en emploi qui y habitent vont travailler en voiture." },
    "84007": { hero: "futur•e croise chaleur, qualité de l'air, mobilité et logement pour lire ce que vivre à Avignon veut vraiment dire dans un territoire où les étés se réchauffent.", intro: "À Avignon, le futur se joue déjà entre chaleur, nuits tropicales et météo propice aux feux.", mob: "À Avignon, 65 % des actifs en emploi qui y habitent vont travailler en voiture." },
    "13001": { hero: "futur•e croise chaleur, qualité de l'air, mobilité et logement pour lire ce que vivre à Aix-en-Provence veut vraiment dire dans un territoire où les étés se réchauffent.", intro: "À Aix-en-Provence, le futur se joue déjà entre chaleur, nuits tropicales et météo propice aux feux.", mob: "À Aix-en-Provence, 63 % des actifs en emploi qui y habitent vont travailler en voiture." },
    "68066": { hero: GENERIQUE("Colmar", "de Colmar"), intro: "À Colmar, le futur se joue entre chaleur, sols plus souvent secs et vie agricole.", mob: "À Colmar, 62 % des actifs en emploi qui y habitent vont travailler en voiture." },
    "29232": { hero: GENERIQUE("Quimper", "de Quimper"), intro: "À Quimper, le futur se joue déjà entre chaleur, logement et qualité de vie.", mob: "À Quimper, 78 % des actifs en emploi qui y habitent vont travailler en voiture." },
    "18033": { hero: GENERIQUE("Bourges", "de Bourges"), intro: "À Bourges, le futur se joue déjà entre chaleur, logement et qualité de vie.", mob: "À Bourges, 73 % des actifs en emploi qui y habitent vont travailler en voiture." },
    "79191": { hero: GENERIQUE("Niort", "de Niort"), intro: "À Niort, le futur se joue entre chaleur, sols plus souvent secs et vie agricole.", mob: "À Niort, 70 % des actifs en emploi qui y habitent vont travailler en voiture." },
    "85191": { hero: GENERIQUE("La Roche-sur-Yon", "de La Roche-sur-Yon"), intro: "À La Roche-sur-Yon, le futur se joue déjà entre chaleur, logement et qualité de vie.", mob: "À La Roche-sur-Yon, 74 % des actifs en emploi qui y habitent vont travailler en voiture." },
    "17094": { hero: "futur•e lit Châtelaillon-Plage à travers ses enjeux côtiers : risques recensés, érosion du trait de côte, chaleur estivale et qualité de vie. Pas une carte générale du climat, mais ce que ce territoire change concrètement pour vos décisions.", intro: "À Châtelaillon-Plage, le futur se joue déjà entre chaleur, littoral et qualité de vie.", mob: "À Châtelaillon-Plage, 72 % des actifs en emploi qui y habitent vont travailler en voiture." },
  };
  for (const [insee, t] of Object.entries(attendu)) {
    const c = commune(insee);
    assert.ok(c.densite! < 1500, `${c.nom} doit rester un cas sous 1 500 hab/km²`);
    const a = accueil(c);
    assert.equal(a.hero, t.hero, `${c.nom} hero`);
    assert.equal(a.intro, t.intro, `${c.nom} intro`);
    assert.equal(a.mobilite?.fait, t.mob, `${c.nom} carte`);
    assert.ok(!a.cats.includes("rural_peri_urbain"), c.nom);
  }
});

test("montagne : l'altitude ou le relief ne disent plus rien de la voiture (Grenoble, Chamonix, Briançon, Corte, Mont-Dauphin)", () => {
  for (const insee of ["38185", "74056", "05023", "2B096", "05082"]) {
    const c = commune(insee);
    const a = accueil(c);
    assert.ok(a.cats.includes("montagne"), `${c.nom} porte bien la catégorie montagne`);
    assert.doesNotMatch(a.hero + a.intro, /voiture/, c.nom);
    // La seule phrase sur la voiture est la mesure : Grenoble 32 %, Chamonix 49 %.
    assert.equal(a.mobilite?.valeur, `${pct(c)} %`, c.nom);
  }
  assert.equal(accueil(commune("38185")).mobilite?.valeur, "32 %");
  assert.equal(accueil(commune("74056")).mobilite?.valeur, "49 %");
});

test("communes rurales : pas décrites comme urbaines (Sèvremoine, Bony, Janville-en-Beauce, Bouffignereux, Bressuire)", () => {
  for (const insee of ["49301", "02100", "28199", "02104", "79049"]) {
    const c = commune(insee);
    const a = accueil(c);
    assert.ok(!a.cats.some((k) => k.startsWith("urbain_dense")), c.nom);
    assert.doesNotMatch([a.hero, a.intro, ...a.cartes.map(texte)].join(" "), /urbain|\bville\b|courtes distances|transports/i, c.nom);
    if (c.mobilite) assert.equal(a.mobilite?.valeur, `${pct(c)} %`, c.nom);
    else assert.equal(a.mobilite, null, `${c.nom} : sans mesure, aucune carte Mobilité`);
  }
  // Sèvremoine (88 %) et Bouffignereux (sans mesure MOBPRO) : cadrage général, carte mesurée ou absente.
  assert.equal(accueil(commune("49301")).mobilite?.fait, "À Sèvremoine, 88 % des actifs en emploi qui y habitent vont travailler en voiture.");
  assert.equal(accueil(commune("02104")).mobilite, null);
});

test("FUT-140 : un arrondissement PLM reste un cœur urbain, sans voiture déduite (Paris 1er, Lyon 1er, Marseille 1er)", () => {
  for (const insee of ["75101", "69381", "13201"]) {
    const c = commune(insee);
    const a = accueil(c);
    assert.ok(a.cats.some((k) => k.startsWith("urbain_dense")), c.nom);
    assert.ok(!a.cats.some((k) => k.startsWith("rural") || k.startsWith("periurbain")), c.nom);
    assert.doesNotMatch(a.hero + a.intro, /voiture/, c.nom);
  }
});

// ── Machine à sous ─────────────────────────────────────────────────────────────────────────

test("machine à sous : les cartes Mobilité portent la mesure de la ville ; Vannes et La Rochelle n'ont pas dérivé de l'index", () => {
  assert.equal(MACHINE_A_SOUS_MOBPRO.Vannes, commune("56260").mobilite!.part_voiture);
  assert.equal(MACHINE_A_SOUS_MOBPRO["La Rochelle"], commune("17300").mobilite!.part_voiture);
  const attendu = { Lyon: "29 %", Marseille: "52 %", Vannes: "68 %", "La Rochelle": "53 %" } as const;
  for (const [v, valeur] of Object.entries(attendu) as [keyof typeof attendu, string][]) {
    const k = carteMobiliteMachineASous(v);
    assert.equal(k.valeur, valeur, v);
    assert.equal(k.titre, `Aller travailler en voiture · ${v}`);
    assert.equal(k.source, SOURCE_MOBPRO);
    assert.doesNotMatch(texte(k), /vélo|métro|tram|à pied|courtes distances|tient encore/);
  }
});

// ── Garde-fou /qna et snapshots ──────────────────────────────────────────────────────────────

test("/qna : le modèle ne reçoit plus aucune catégorie éditoriale", () => {
  const contexte = { commune: "Rodez", tensionId: "quitter_ville", questionLabel: "Quitter la ville pour Rodez ?", faits: {} } as unknown as ContexteQna;
  const json = JSON.stringify(construirePromptUtilisateur({ contexte, questionType: "preset", freeTextQuestion: null, territorySignals: null }));
  assert.doesNotMatch(json, /commune_categories|rural|periurbain|urbain_dense|montagne|littoral/);
});

test("snapshots Territoire : le type d'ambiance ne lit pas `rural_peri_urbain` (aucune empreinte ne bouge)", () => {
  for (const c of COMMUNES) {
    const cats = categoriesDe(c);
    assert.equal(deriveTerritoryType(c.insee, cats), deriveTerritoryType(c.insee, [...cats, "rural_peri_urbain"]), c.nom);
  }
});
