// FUT-185 · REPRISE DE CONTRE-REVUE : LA TABLE MANUELLE ET ASKFUTURE.
//
// La table Supabase `communes_categorization` passe avant l'index dans l'accueil. Elle portait encore
// `rural_peri_urbain` pour 10 communes (Rodez…) et `periurbain_dependance_auto` pour 7 villes sans la mesure qui
// la fonde (Toulouse, Bordeaux…). Elles ouvraient « S'installer à X ? », « Quitter la ville pour X ? » et la
// question voiture ; AskFuture les écrivait au modèle comme « Catégories territoriales ».
//
// Ces tests suivent les vrais chemins : la ligne manuelle relevée le 10/11/2026 (lecture seule), la vraie route
// `/api/landing-signals` sur l'index publié, `categoriesAccueil` puis `buildTensions` (la sélection exécutée par
// FutureELanding.tsx) avec le catalogue de production relevé le même jour, et, pour AskFuture, le texte exact du
// `system` (`referentielDepuisLigne` puis `construireSystemPrompt`, branchés dans la route : voir T7 de
// src/lib/ask/system-prompt.test.ts et le test de câblage ci-dessous). Aucun appel au modèle.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { assainirCategoriesManuelles, categoriesAccueil, CLES_MANUELLES_SANS_MESURE } from "./accueil/categories-accueil.ts";
import { buildTensions, type QuestionCatalogue } from "./accueil/questions.ts";
import { deriveCategories } from "./commune-categories.ts";
import { construireSystemPrompt, referentielDepuisLigne } from "./ask/system-prompt.ts";

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
const ligne = (insee: string) => MANUELLE.find((r) => r.insee_code === insee)!;

/** Ce que renvoie la vraie route `/api/landing-signals` pour une commune. */
let signaux: (insee: string) => Promise<{ categories: string[]; source: string; mobilite: unknown }>;
before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  const route = await import(`${racine}src/app/api/landing-signals/route.ts`);
  signaux = async (insee) => (await route.GET(new Request(`http://localhost/api/landing-signals?insee=${insee}`))).json();
});

/** Le parcours de l'accueil pour une commune de la table : catégories retenues puis les 4 questions affichées. */
async function accueil(l: Ligne) {
  const s = await signaux(l.insee_code);
  const r = categoriesAccueil({ manuelles: l.categories, index: s.categories, departement: deriveCategories(l.insee_code) });
  return { ...r, index: s.categories, questions: buildTensions(CATALOGUE, r.categories).map((t) => t.id) };
}
const questionsAvant = (l: Ligne) => buildTensions(CATALOGUE, l.categories).map((t) => t.id);

// Les 17 lignes concernées, relevées le 10/11/2026 : catégories retenues et questions affichées après FUT-185.
const MED = ["vectoriel", "mediterranee"];
const Q_MED = ["acheter_canicule", "enfants_sante", "canicule_vivable", "metier_exterieur"];
const ATTENDU: Record<string, { nom: string; categories: string[]; questions: string[] }> = {
  "12202": { nom: "Rodez", categories: ["rural_agricole"], questions: ["enfants_sante", "eau_potable", "metier_exterieur", "valeur_immo"] },
  "31555": { nom: "Toulouse", categories: ["urbain_dense_sud"], questions: Q_MED },
  "33063": { nom: "Bordeaux", categories: ["urbain_dense_sud", "sud_ouest"], questions: Q_MED },
  "06008": { nom: "Auribeau-sur-Siagne", categories: MED, questions: Q_MED },
  "06078": { nom: "La Gaude", categories: MED, questions: Q_MED },
  "06113": { nom: "Saint-Jeannet", categories: MED, questions: Q_MED },
  "13005": { nom: "Aubagne", categories: MED, questions: Q_MED },
  "13043": { nom: "Gémenos", categories: MED, questions: Q_MED },
  "13071": { nom: "Les Pennes-Mirabeau", categories: [...MED, "periurbain_dependance_auto"], questions: ["mobilite_fragile", "acheter_canicule", "enfants_sante", "canicule_vivable"] },
  "13082": { nom: "Rognac", categories: MED, questions: Q_MED },
  "13083": { nom: "Roquevaire", categories: MED, questions: Q_MED },
  "13103": { nom: "Salon-de-Provence", categories: MED, questions: Q_MED },
  "13117": { nom: "Vitrolles", categories: MED, questions: Q_MED },
  "83014": { nom: "Bauduen", categories: [...MED, "rural_lacs"], questions: ["acheter_canicule", "enfants_sante", "baignade_ici", "canicule_vivable"] },
  "83048": { nom: "La Crau", categories: MED, questions: Q_MED },
  "83107": { nom: "Roquebrune-sur-Argens", categories: MED, questions: Q_MED },
  "83143": { nom: "Trans-en-Provence", categories: MED, questions: Q_MED },
};

// ── Accueil : lecture de la table et filtrage ────────────────────────────────────────────────

test("table manuelle : exactement 17 lignes portent une clé sans mesure (10 rural_peri_urbain, 7 periurbain_dependance_auto)", () => {
  const avec = (k: string) => MANUELLE.filter((l) => l.categories.includes(k)).map((l) => l.insee_code).sort();
  assert.equal(MANUELLE.length, 44);
  assert.deepEqual(avec("rural_peri_urbain"), ["06008", "06078", "06113", "12202", "13043", "13083", "83014", "83048", "83107", "83143"]);
  assert.deepEqual(avec("periurbain_dependance_auto"), ["13005", "13071", "13082", "13103", "13117", "31555", "33063"]);
  assert.deepEqual(Object.keys(ATTENDU).sort(), [...avec("rural_peri_urbain"), ...avec("periurbain_dependance_auto")].sort());
});

test("les 17 communes : catégories retenues et quatre questions affichées, une à une", async () => {
  for (const [insee, a] of Object.entries(ATTENDU)) {
    const l = ligne(insee);
    assert.equal(l.commune_name, a.nom);
    const r = await accueil(l);
    assert.equal(r.origine, "manuelle", a.nom); // la table reste prioritaire
    assert.equal(r.usedFallback, false, a.nom);
    assert.deepEqual(r.categories, a.categories, `${a.nom} catégories`);
    assert.deepEqual(r.questions, a.questions, `${a.nom} questions`);
  }
});

test("Rodez, Toulouse, Bordeaux : avant / après", async () => {
  assert.deepEqual(questionsAvant(ligne("12202")), ["acheter_rural", "mobilite_fragile", "enfants_sante", "quitter_ville"]);
  assert.deepEqual(questionsAvant(ligne("31555")), ["mobilite_fragile", "acheter_canicule", "enfants_sante", "canicule_vivable"]);
  assert.deepEqual(questionsAvant(ligne("33063")), ["mobilite_fragile", "acheter_canicule", "enfants_sante", "canicule_vivable"]);
  // Rodez : centre urbain intermédiaire, 2 155 hab/km² ; Toulouse et Bordeaux : l'index ne mesure pas la clé voiture.
  for (const insee of ["12202", "31555", "33063"]) {
    const r = await accueil(ligne(insee));
    assert.ok(!r.index.includes("periurbain_dependance_auto"), insee);
    assert.ok(!r.questions.some((q) => ["acheter_rural", "quitter_ville", "mobilite_fragile"].includes(q)), insee);
  }
});

test("aucune ligne manuelle n'ouvre plus « S'installer à X ? » ni « Quitter la ville pour X ? » ; la question voiture suit la mesure", async () => {
  for (const l of MANUELLE) {
    const r = await accueil(l);
    assert.ok(!r.categories.includes("rural_peri_urbain"), l.commune_name);
    assert.ok(!r.questions.includes("acheter_rural") && !r.questions.includes("quitter_ville"), l.commune_name);
    if (r.categories.includes("periurbain_dependance_auto")) {
      assert.ok(r.index.includes("periurbain_dependance_auto"), `${l.commune_name} : clé voiture sans mesure`);
    }
  }
});

test("les 27 autres lignes sont intactes : mêmes catégories, mêmes questions (Ceyreste compris, que l'index mesure)", async () => {
  const autres = MANUELLE.filter((l) => !l.categories.some((k) => CLES_MANUELLES_SANS_MESURE.has(k)));
  assert.equal(autres.length, 27);
  for (const l of autres) {
    const r = await accueil(l);
    assert.deepEqual(r.categories, l.categories, l.commune_name);
    assert.deepEqual(r.questions, questionsAvant(l), l.commune_name);
  }
  // Ceyreste : l'index émet la clé voiture, la ligne ne la porte pas. Rien n'est ajouté à la table.
  const ceyreste = await accueil(ligne("13025"));
  assert.ok(ceyreste.index.includes("periurbain_dependance_auto"));
  assert.ok(!ceyreste.categories.includes("periurbain_dependance_auto"));
});

test("toute autre clé d'une ligne concernée est gardée, dans son ordre", () => {
  for (const l of MANUELLE) {
    const gardees = assainirCategoriesManuelles(l.categories, null);
    assert.deepEqual(gardees, l.categories.filter((k) => !CLES_MANUELLES_SANS_MESURE.has(k)), l.commune_name);
  }
});

// ── Données absentes, replis ────────────────────────────────────────────────────────────────

test("index muet : la clé voiture d'une ligne manuelle n'est pas gardée (une absence n'est pas un fait)", () => {
  const l = ligne("13071"); // Les Pennes-Mirabeau, confirmée quand l'index répond
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
  const paris = await signaux("75056");
  assert.equal(paris.source, "dept_fallback");
  const r = categoriesAccueil({ manuelles: null, index: paris.categories, departement: deriveCategories("75056") });
  assert.ok(!r.categories.some((k) => CLES_MANUELLES_SANS_MESURE.has(k) || k.startsWith("rural")));
});

// ── AskFuture : le texte réellement transmis au modèle ───────────────────────────────────────

const ENRICHISSEMENT_VIDE = { ademe: null, drias: null, eau: null, vigieau: null, georisques: null, catnat: null, littoral: null, baignade: null };
const systemAsk = (l: Ligne | null, insee: string, nom: string) =>
  construireSystemPrompt({ communeName: nom, communeInsee: insee, referentiel: referentielDepuisLigne(insee, l), enrichment: ENRICHISSEMENT_VIDE as never, profile: null });

test("AskFuture : Rodez, Toulouse, Bordeaux reçoivent leur identité, et rien de leurs catégories", () => {
  const attendu: Record<string, string> = {
    "12202": "INSEE : 12202\nNom commune (référentiel interne) : Rodez",
    "31555": "INSEE : 31555\nNom commune (référentiel interne) : Toulouse",
    "33063": "INSEE : 33063\nNom commune (référentiel interne) : Bordeaux",
  };
  for (const [insee, texte] of Object.entries(attendu)) {
    const l = ligne(insee);
    assert.equal(referentielDepuisLigne(insee, l), texte);
    const s = systemAsk(l, insee, l.commune_name);
    assert.ok(s.includes(`[Référentiel interne futur•e]\n${texte}\n`), insee);
  }
});

test("AskFuture : pour les 44 lignes et les communes sans ligne, aucune clé éditoriale n'atteint le modèle", () => {
  /** Le bloc [Référentiel interne futur•e] est EXACTEMENT l'identité : aucune clé ne peut s'y glisser. */
  const verifier = (s: string, insee: string, nom: string | null) => {
    assert.doesNotMatch(s, /Catégories territoriales/, insee);
    const debut = s.indexOf("[Référentiel interne futur•e]");
    const bloc = s.slice(debut, s.indexOf("\n\n[", debut));
    assert.equal(bloc, `[Référentiel interne futur•e]\nINSEE : ${insee}${nom ? `\nNom commune (référentiel interne) : ${nom}` : ""}`, insee);
  };
  for (const l of MANUELLE) verifier(systemAsk(l, l.insee_code, l.commune_name), l.insee_code, l.commune_name);
  // Sans ligne : plus de repli par département (Grenoble ne devient plus « montagne » par l'Isère).
  for (const [insee, nom] of [["38185", "Grenoble"], ["63113", "Clermont-Ferrand"], ["75056", "Paris"]]) {
    verifier(systemAsk(null, insee, nom), insee, null);
  }
});

test("AskFuture : la route ne lit que le nom dans la table et passe la ligne à referentielDepuisLigne", () => {
  const code = readFileSync("src/app/api/ask/route.ts", "utf8").replace(/\/\/.*$/gm, "");
  assert.match(code, /\.from\("communes_categorization"\)\s*\.select\("commune_name, insee_code"\)/);
  assert.match(code, /return referentielDepuisLigne\(insee, ligne\);/);
  assert.doesNotMatch(code, /categories|deriveCategories|construireReferentiel/);
  const contexte = readFileSync("src/app/api/ask/context/route.ts", "utf8");
  assert.doesNotMatch(contexte, /communes_categorization|deriveCategories/);
});

test("accueil : FutureELanding exécute categoriesAccueil et buildTensions, sans copie locale", () => {
  const code = readFileSync("src/components/FutureELanding.tsx", "utf8").replace(/\/\/.*$/gm, "");
  assert.match(code, /import \{ categoriesAccueil \} from "@\/lib\/accueil\/categories-accueil";/);
  assert.match(code, /import \{ buildTensions \} from "@\/lib\/accueil\/questions";/);
  assert.match(code, /categoriesAccueil\(\{\s*manuelles: matchedRow\?\.categories \?\? null,/);
  assert.doesNotMatch(code, /function buildTensions|TERRITORY_TENSION_IDS|matchedRow\.categories;/);
});
