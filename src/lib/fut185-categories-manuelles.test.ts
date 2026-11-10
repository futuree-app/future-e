// FUT-185 · REPRISE DE CONTRE-REVUE : LA TABLE MANUELLE ET ASKFUTURE.
//
// La table Supabase `communes_categorization` passe avant l'index dans l'accueil. Elle portait encore
// `rural_peri_urbain` pour 10 communes (Rodez…) et `periurbain_dependance_auto` pour 7 villes sans la mesure qui
// la fonde (Toulouse, Bordeaux…). Elles ouvraient « S'installer à X ? », « Quitter la ville pour X ? » et la
// question voiture ; AskFuture les écrivait au modèle comme « Catégories territoriales ». La vérification a aussi
// montré que 15 des 44 lignes portent le code INSEE d'une AUTRE commune que celle qu'elles nomment.
//
// Ces tests suivent les vrais chemins : la table et le catalogue de questions relevés le 10/11/2026 (lecture
// seule), le parcours de FutureELanding (ligne cherchée par code puis par nom, retenue si elle nomme la commune
// choisie), la vraie route `/api/landing-signals` sur l'index publié, `categoriesAccueil` puis `buildTensions`. Pour
// AskFuture, le texte exact du `system` (`referentielAskFuture` puis `construireSystemPrompt`) et le câblage de la
// route. Aucun appel au modèle ni à Supabase : la table est simulée par son relevé.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import {
  assainirCategoriesManuelles,
  categoriesAccueil,
  CLES_MANUELLES_SANS_MESURE,
  ligneManuelleConcorde,
} from "./accueil/categories-accueil.ts";
import { buildTensions, type QuestionCatalogue } from "./accueil/questions.ts";
import { deriveCategories } from "./commune-categories.ts";
import { construireSystemPrompt, referentielAskFuture } from "./ask/system-prompt.ts";

const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (spec === "next/server") return next("next/server.js", ctx);
  if (spec.startsWith("@/")) return next(${JSON.stringify(racine)} + "src/" + spec.slice(2) + ".ts", ctx);
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\\.[cm]?[jt]s$|\\.json$/.test(spec)) {
    try { return await next(spec + ".ts", ctx); } catch { return next(spec, ctx); }
  }
  return next(spec, ctx);
}`;

const D = "docs/audits/2026-11-10-fut185-libelles-densite/";
type Ligne = { commune_name: string; insee_code: string; categories: string[] };
const MANUELLE: Ligne[] = JSON.parse(readFileSync(`${D}table-manuelle-2026-11-10.json`, "utf8")).lignes;
const CATALOGUE: QuestionCatalogue[] = JSON.parse(readFileSync(`${D}catalogue-questions-2026-11-10.json`, "utf8")).lignes.map(
  (r: { id: string; categories: string[] | null; priority: number | null; is_active: boolean | null }) => ({
    id: r.id, categories: r.categories || [], priority: r.priority ?? 3, is_active: r.is_active ?? true,
  }),
);
const INDEX: { insee: string; nom: string }[] = JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8")).communes;
const NOM = new Map(INDEX.map((c) => [c.insee, c.nom]));
const ligne = (nom: string) => MANUELLE.find((r) => r.commune_name === nom)!;

/** Ce que renvoie la vraie route `/api/landing-signals` pour une commune. */
let signaux: (insee: string) => Promise<{ categories: string[]; source: string }>;
before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  const route = await import(`${racine}src/app/api/landing-signals/route.ts`);
  signaux = async (insee) => (await route.GET(new Request(`http://localhost/api/landing-signals?insee=${insee}`))).json();
});

/** Le parcours de FutureELanding pour la commune choisie (nom et code BAN) : ligne par code, puis par nom
 *  (`ilike` exact, insensible à la casse), retenue seulement si elle nomme la commune ; puis catégories et questions. */
async function parcours(nom: string, code: string) {
  const parCode = MANUELLE.find((r) => r.insee_code === code);
  const parNom = MANUELLE.find((r) => r.commune_name.toLowerCase() === nom.toLowerCase());
  const l = [parCode, parNom].find((r) => r && ligneManuelleConcorde(r.commune_name, nom)) ?? null;
  const s = await signaux(code);
  const r = categoriesAccueil({ manuelles: l?.categories ?? null, index: s.categories, departement: deriveCategories(code) });
  return { ...r, ligne: l?.commune_name ?? null, index: s.categories, questions: buildTensions(CATALOGUE, r.categories).map((t) => t.id) };
}
const questionsAvant = (cats: string[]) => buildTensions(CATALOGUE, cats).map((t) => t.id);

// Le vrai code de la commune que chaque ligne NOMME (index, même département), relevé le 10/11/2026.
const VRAI_CODE: Record<string, string> = {
  "Auribeau-sur-Siagne": "06007", "La Gaude": "06065", "Saint-Jeannet": "06122", Ceyreste: "13023", "Gémenos": "13042",
  Rognac: "13081", Roquevaire: "13086", Bauduen: "83015", "La Croix-Valmer": "83048", "La Crau": "83047",
  "Sanary-sur-Mer": "83123", "Six-Fours-les-Plages": "83129", "Trans-en-Provence": "83141", Richerenches: "84097", "Valréas": "84138",
};
const codeDe = (l: Ligne) => VRAI_CODE[l.commune_name] ?? l.insee_code;
const nomBan = (l: Ligne) => NOM.get(codeDe(l)) ?? l.commune_name; // « Chamonix-Mont-Blanc » ; Lyon, Marseille hors index

// Les 17 lignes concernées : catégories retenues et questions affichées après FUT-185, commune nommée choisie.
const MED = ["vectoriel", "mediterranee"];
const Q_MED = ["acheter_canicule", "enfants_sante", "canicule_vivable", "metier_exterieur"];
const ATTENDU: Record<string, { categories: string[]; questions: string[] }> = {
  Rodez: { categories: ["rural_agricole"], questions: ["enfants_sante", "eau_potable", "metier_exterieur", "valeur_immo"] },
  Toulouse: { categories: ["urbain_dense_sud"], questions: Q_MED },
  Bordeaux: { categories: ["urbain_dense_sud", "sud_ouest"], questions: Q_MED },
  "Auribeau-sur-Siagne": { categories: MED, questions: Q_MED },
  "La Gaude": { categories: MED, questions: Q_MED },
  "Saint-Jeannet": { categories: MED, questions: Q_MED },
  Aubagne: { categories: MED, questions: Q_MED },
  "Gémenos": { categories: MED, questions: Q_MED },
  "Les Pennes-Mirabeau": { categories: [...MED, "periurbain_dependance_auto"], questions: ["mobilite_fragile", "acheter_canicule", "enfants_sante", "canicule_vivable"] },
  Rognac: { categories: MED, questions: Q_MED },
  Roquevaire: { categories: MED, questions: Q_MED },
  "Salon-de-Provence": { categories: MED, questions: Q_MED },
  Vitrolles: { categories: MED, questions: Q_MED },
  Bauduen: { categories: [...MED, "rural_lacs"], questions: ["acheter_canicule", "enfants_sante", "baignade_ici", "canicule_vivable"] },
  "La Crau": { categories: MED, questions: Q_MED },
  "Roquebrune-sur-Argens": { categories: MED, questions: Q_MED },
  "Trans-en-Provence": { categories: MED, questions: Q_MED },
};

// ── La table ────────────────────────────────────────────────────────────────────────────────

test("table manuelle : exactement 17 lignes portent une clé sans mesure (10 rural_peri_urbain, 7 periurbain_dependance_auto)", () => {
  const avec = (k: string) => MANUELLE.filter((l) => l.categories.includes(k)).map((l) => l.commune_name).sort();
  assert.equal(MANUELLE.length, 44);
  assert.deepEqual(avec("rural_peri_urbain"), ["Auribeau-sur-Siagne", "Bauduen", "Gémenos", "La Crau", "La Gaude", "Rodez", "Roquebrune-sur-Argens", "Roquevaire", "Saint-Jeannet", "Trans-en-Provence"]);
  assert.deepEqual(avec("periurbain_dependance_auto"), ["Aubagne", "Bordeaux", "Les Pennes-Mirabeau", "Rognac", "Salon-de-Provence", "Toulouse", "Vitrolles"]);
  assert.deepEqual(Object.keys(ATTENDU).sort(), [...avec("rural_peri_urbain"), ...avec("periurbain_dependance_auto")].sort());
});

test("table manuelle : 15 lignes portent le code INSEE d'une autre commune que celle qu'elles nomment", () => {
  const fausses = MANUELLE.filter((l) => NOM.has(l.insee_code) && !ligneManuelleConcorde(l.commune_name, NOM.get(l.insee_code)));
  assert.deepEqual(fausses.map((l) => l.commune_name).sort(), Object.keys(VRAI_CODE).sort());
  for (const l of fausses) assert.ok(ligneManuelleConcorde(l.commune_name, NOM.get(VRAI_CODE[l.commune_name])), l.commune_name);
  assert.equal(NOM.get("83117"), "Saint-Paul-en-Forêt"); // la ligne « Sanary-sur-Mer », littorale, sur une commune des terres
});

test("concordance des noms : accents, casse, tirets, nom court ; jamais un autre nom ni un nom absent", () => {
  assert.ok(ligneManuelleConcorde("Chamonix", "Chamonix-Mont-Blanc"));
  assert.ok(ligneManuelleConcorde("Gémenos", "GEMENOS"));
  assert.ok(ligneManuelleConcorde("Saint-Jeannet", "Saint Jeannet"));
  assert.ok(!ligneManuelleConcorde("Sanary-sur-Mer", "Saint-Paul-en-Forêt"));
  assert.ok(!ligneManuelleConcorde("La Crau", "La Croix-Valmer"));
  assert.ok(!ligneManuelleConcorde("Rognac", "Rognes"));
  assert.ok(!ligneManuelleConcorde("Saint", "Sainte-Agnès"));
  for (const [a, b] of [[null, "Rodez"], ["Rodez", null], ["", "Rodez"], ["Rodez", undefined]] as const) assert.ok(!ligneManuelleConcorde(a, b));
});

// ── Accueil : la commune nommée par la ligne ────────────────────────────────────────────────

test("les 17 communes : catégories retenues et quatre questions affichées, une à une", async () => {
  for (const [nom, a] of Object.entries(ATTENDU)) {
    const l = ligne(nom);
    const r = await parcours(nomBan(l), codeDe(l));
    assert.equal(r.ligne, nom, `${nom} : sa ligne est retenue`);
    assert.equal(r.origine, "manuelle", nom); // la table reste prioritaire
    assert.equal(r.usedFallback, false, nom);
    assert.deepEqual(r.categories, a.categories, `${nom} catégories`);
    assert.deepEqual(r.questions, a.questions, `${nom} questions`);
  }
});

test("Rodez, Toulouse, Bordeaux : avant / après", async () => {
  assert.deepEqual(questionsAvant(ligne("Rodez").categories), ["acheter_rural", "mobilite_fragile", "enfants_sante", "quitter_ville"]);
  for (const nom of ["Toulouse", "Bordeaux"]) {
    assert.deepEqual(questionsAvant(ligne(nom).categories), ["mobilite_fragile", "acheter_canicule", "enfants_sante", "canicule_vivable"]);
  }
  for (const [nom, code] of [["Rodez", "12202"], ["Toulouse", "31555"], ["Bordeaux", "33063"]]) {
    const r = await parcours(nom, code);
    assert.ok(!r.index.includes("periurbain_dependance_auto"), `${nom} : l'index ne mesure pas la clé voiture`);
    assert.ok(!r.questions.some((q) => ["acheter_rural", "quitter_ville", "mobilite_fragile"].includes(q)), nom);
  }
});

test("44 lignes : plus jamais « S'installer à X ? » ni « Quitter la ville pour X ? » ; la clé voiture suit la mesure", async () => {
  for (const l of MANUELLE) {
    const r = await parcours(nomBan(l), codeDe(l));
    assert.equal(r.ligne, l.commune_name, `${l.commune_name} : retrouvée par son nom`);
    assert.ok(!r.categories.includes("rural_peri_urbain"), l.commune_name);
    assert.ok(!r.questions.includes("acheter_rural") && !r.questions.includes("quitter_ville"), l.commune_name);
    if (r.categories.includes("periurbain_dependance_auto")) assert.ok(r.index.includes("periurbain_dependance_auto"), l.commune_name);
  }
});

test("les 27 autres lignes sont intactes : mêmes catégories, mêmes questions", async () => {
  const autres = MANUELLE.filter((l) => !l.categories.some((k) => CLES_MANUELLES_SANS_MESURE.has(k)));
  assert.equal(autres.length, 27);
  for (const l of autres) {
    const r = await parcours(nomBan(l), codeDe(l));
    assert.deepEqual(r.categories, l.categories, l.commune_name);
    assert.deepEqual(r.questions, questionsAvant(l.categories), l.commune_name);
  }
});

// ── Accueil : la commune qui portait le code par erreur ──────────────────────────────────────

test("commune au code emprunté : la ligne d'une autre commune n'est plus appliquée, l'index parle", async () => {
  for (const nom of Object.keys(VRAI_CODE)) {
    const l = ligne(nom);
    const autre = NOM.get(l.insee_code)!;
    const r = await parcours(autre, l.insee_code);
    // La Crau porte 83048, le code de La Croix-Valmer, qui a sa propre ligne : c'est elle qui est retenue.
    const propre = MANUELLE.find((x) => ligneManuelleConcorde(x.commune_name, autre));
    assert.equal(r.ligne, propre?.commune_name ?? null, `${autre} (${l.insee_code})`);
    if (!propre) {
      assert.equal(r.origine, "index", autre);
      assert.deepEqual(r.categories, r.index, autre);
    }
  }
  // Saint-Paul-en-Forêt ne reçoit plus le littoral de Sanary-sur-Mer ; Cogolin garde le sien, mesuré par l'index.
  assert.ok(!(await parcours("Saint-Paul-en-Forêt", "83117")).categories.some((k) => k.startsWith("littoral")));
  assert.ok((await parcours("Cogolin", "83042")).categories.includes("littoral"));
});

// ── Règles de lecture, données absentes, replis ──────────────────────────────────────────────

test("toute autre clé d'une ligne est gardée, dans son ordre ; aucune clé n'est ajoutée", () => {
  for (const l of MANUELLE) {
    assert.deepEqual(assainirCategoriesManuelles(l.categories, null), l.categories.filter((k) => !CLES_MANUELLES_SANS_MESURE.has(k)), l.commune_name);
  }
  // L'index mesure la clé voiture, la ligne ne la porte pas : elle n'est pas ajoutée.
  assert.deepEqual(assainirCategoriesManuelles(MED, ["all", "periurbain_dependance_auto"]), MED);
  assert.deepEqual(assainirCategoriesManuelles([...MED, "periurbain_dependance_auto"], ["all", "periurbain_dependance_auto"]), [...MED, "periurbain_dependance_auto"]);
});

test("index muet : la clé voiture d'une ligne manuelle n'est pas gardée (une absence n'est pas un fait)", () => {
  const l = ligne("Les Pennes-Mirabeau"); // confirmée quand l'index répond
  for (const index of [null, undefined, []]) {
    assert.deepEqual(categoriesAccueil({ manuelles: l.categories, index, departement: deriveCategories(l.insee_code) }).categories, MED);
  }
});

test("ligne vidée par l'assainissement : l'accueil prend l'index, puis le département, jamais un « all » de façade", () => {
  const index = ["all", "urbain_dense_sud", "reseau_tc"];
  assert.deepEqual(categoriesAccueil({ manuelles: ["rural_peri_urbain"], index, departement: ["mediterranee"] }),
    { categories: index, origine: "index", usedFallback: false });
  assert.deepEqual(categoriesAccueil({ manuelles: ["rural_peri_urbain", "periurbain_dependance_auto"], index: null, departement: ["mediterranee"] }),
    { categories: ["mediterranee"], origine: "departement", usedFallback: false });
  assert.deepEqual(categoriesAccueil({ manuelles: ["rural_peri_urbain"], index: null, departement: null }),
    { categories: ["all"], origine: "aucune", usedFallback: true });
});

test("sans ligne manuelle : mêmes règles qu'avant (index, repli département, cadrage générique)", async () => {
  assert.deepEqual(categoriesAccueil({ manuelles: null, index: ["all", "montagne"], departement: ["montagne"] }),
    { categories: ["all", "montagne"], origine: "index", usedFallback: false });
  assert.deepEqual(categoriesAccueil({ manuelles: [], index: ["all"], departement: ["mediterranee"] }),
    { categories: ["all"], origine: "index", usedFallback: true });
  // Paris (75056) : absente de l'index, la route renvoie le repli département, sans aucune clé rurale ou voiture.
  const paris = await parcours("Paris", "75056");
  assert.equal((await signaux("75056")).source, "dept_fallback");
  assert.ok(!paris.categories.some((k) => CLES_MANUELLES_SANS_MESURE.has(k) || k.startsWith("rural")));
});

// ── AskFuture : le texte réellement transmis au modèle ───────────────────────────────────────

const ENRICHISSEMENT_VIDE = { ademe: null, drias: null, eau: null, vigieau: null, georisques: null, catnat: null, littoral: null, baignade: null };
const systemAsk = (insee: string, nom: string) =>
  construireSystemPrompt({ communeName: nom, communeInsee: insee, referentiel: referentielAskFuture(insee), enrichment: ENRICHISSEMENT_VIDE as never, profile: null });
/** Le bloc [Référentiel interne futur•e], seul. */
const blocReferentiel = (s: string) => { const d = s.indexOf("[Référentiel interne futur•e]"); return s.slice(d, s.indexOf("\n\n[", d)); };

test("AskFuture : Rodez, Toulouse, Bordeaux et les 44 lignes reçoivent leur seul code, aucun nom ni catégorie de la table", () => {
  for (const [insee, nom] of [["12202", "Rodez"], ["31555", "Toulouse"], ["33063", "Bordeaux"], ...MANUELLE.map((l) => [l.insee_code, l.commune_name])]) {
    const s = systemAsk(insee, nom);
    assert.equal(blocReferentiel(s), `[Référentiel interne futur•e]\nINSEE : ${insee}`, nom);
    assert.doesNotMatch(s, /Catégories territoriales|Nom commune \(référentiel interne\)/, nom);
    assert.ok(s.includes(`DONNÉES TERRITORIALES DISPONIBLES — ${nom} (INSEE ${insee})`), `${nom} : le nom vient de la requête`);
  }
  // Saint-Paul-en-Forêt (83117) : le modèle ne lit plus « Sanary-sur-Mer », le nom de la ligne au code emprunté.
  assert.doesNotMatch(systemAsk("83117", "Saint-Paul-en-Forêt"), /Sanary/);
});

test("AskFuture : la route ne lit plus la table, ne devine plus par département, et passe referentielAskFuture au modèle", () => {
  const code = readFileSync("src/app/api/ask/route.ts", "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(code, /communes_categorization|categories|deriveCategories|construireReferentiel/);
  assert.match(code, /const referentiel = referentielAskFuture\(communeInsee\);/);
  assert.match(code, /construireSystemPrompt\(\{\s*communeName,\s*communeInsee,\s*referentiel,/);
  const contexte = readFileSync("src/app/api/ask/context/route.ts", "utf8");
  assert.doesNotMatch(contexte, /communes_categorization|deriveCategories/);
});

test("accueil : FutureELanding exécute la concordance, categoriesAccueil et buildTensions, sans reprendre le code de la table", () => {
  const code = readFileSync("src/components/FutureELanding.tsx", "utf8").replace(/\/\/.*$/gm, "");
  assert.match(code, /import \{ categoriesAccueil, ligneManuelleConcorde \} from "@\/lib\/accueil\/categories-accueil";/);
  assert.match(code, /import \{ buildTensions \} from "@\/lib\/accueil\/questions";/);
  assert.match(code, /if \(!error && data && ligneManuelleConcorde\(data\.commune_name, nextCommune\.name\)\) \{/);
  assert.match(code, /categoriesAccueil\(\{\s*manuelles: matchedRow\?\.categories \?\? null,/);
  assert.match(code, /const inseeCode = nextCommune\.citycode \|\| null;/);
  assert.doesNotMatch(code, /matchedRow\?\.insee_code|function buildTensions|TERRITORY_TENSION_IDS/);
});
