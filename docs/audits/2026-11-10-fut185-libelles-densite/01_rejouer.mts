// FUT-185 · Exécute le VRAI code d'une révision sur chaque commune de l'index de cette révision.
//
// Usage : node 01_rejouer.mts <racine_du_code> <index.json.gz> <catalogue.json> <table-manuelle.json> <sortie.jsonl>
//
// Fonctions appelées telles quelles (aucune réimplémentation) :
//   - deriveCategoriesFromEntry (src/lib/comparateur-vie.ts), comme /api/landing-signals ;
//   - getHeroCopy, getQuestionIntro, getEmptyStateCopy, getPreviewCards (src/lib/accueil/recits.ts), comme
//     FutureELanding.tsx une fois la commune reconnue ;
//   - deriveTerritoryType (src/lib/territory-mood.ts), comme src/lib/server/territoire-snapshot.ts.
//   - depuis la reprise de FUT-185 (révision qui contient src/lib/accueil/questions.ts) : `buildTensions` et
//     `categoriesAccueil`, exécutés tels quels. Pour une révision antérieure, où `buildTensions` vivait non exporté
//     dans FutureELanding.tsx, le script emploie la copie `choisirQuestions` ci-dessous et la table manuelle telle
//     quelle, ce que faisait l'accueil. Le catalogue de questions est celui de production, relevé le 10/11/2026.
//
// Ce que voit l'accueil : les catégories de la table manuelle quand la commune y figure (44 lignes), sinon
// celles de l'index. L'aperçu reçoit la part voiture de l'index (l'ancienne signature ignore cet argument).
// Les cartes climat sont évaluées sans DRIAS ni Géorisques : la carte Mobilité, quand elle existe, occupe
// toujours l'une des deux places « profondeur » des quatre cartes, avec ou sans cartes climat.
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

const [racineCode, indexGz, catalogueJson, manuelleJson, sortie] = process.argv.slice(2);
const racine = pathToFileURL(`${racineCode.replace(/\/$/, "")}/`).href;
const hook = `
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (spec.startsWith("@/")) return next(${JSON.stringify(racine)} + "src/" + spec.slice(2) + ".ts", ctx);
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\\.[cm]?[jt]s$|\\.json$/.test(spec)) {
    try { return await next(spec + ".ts", ctx); } catch { return next(spec, ctx); }
  }
  return next(spec, ctx);
}`;
register(`data:text/javascript,${encodeURIComponent(hook)}`);

const vie = await import(`${racine}src/lib/comparateur-vie.ts`);
const recits = await import(`${racine}src/lib/accueil/recits.ts`);
const mood = await import(`${racine}src/lib/territory-mood.ts`);
const optionnel = async (chemin: string) => { try { return await import(`${racine}${chemin}`); } catch { return null; } };
const questionsReelles = await optionnel("src/lib/accueil/questions.ts");
const categoriesReelles = await optionnel("src/lib/accueil/categories-accueil.ts");
console.log(`sélection des questions : ${questionsReelles ? "buildTensions de la révision" : "copie de l'ancien buildTensions"} ; ` +
  `table manuelle : ${categoriesReelles ? "categoriesAccueil de la révision" : "lue telle quelle"}`);
type Commune = { insee: string; nom: string; mobilite?: { part_voiture: number; dependance: number } | null };
const communes: Commune[] = JSON.parse(gunzipSync(readFileSync(indexGz)).toString("utf8")).communes;

type Question = { id: string; categories: string[]; priority: number; is_active: boolean };
const catalogue: Question[] = JSON.parse(readFileSync(catalogueJson, "utf8")).lignes.map(
  (r: { id: string; categories: string[] | null; priority: number | null; is_active: boolean | null }) => ({
    id: r.id, categories: r.categories || [], priority: r.priority ?? 3, is_active: r.is_active ?? true,
  }),
);
const manuelle = new Map<string, string[]>(
  JSON.parse(readFileSync(manuelleJson, "utf8")).lignes.map((r: { insee_code: string; categories: string[] }) => [r.insee_code, r.categories]),
);

// ── Copie de buildTensions (FutureELanding.tsx jusqu'à 00fe22ec), pour les révisions antérieures ────
const TERRITORY = new Set(["calme_infra", "tc_sansvoiture", "croissance_transformation", "vielocale_reelle", "quitter_ville"]);
const FALLBACK = ["enfants_sante", "metier_general", "valeur_immo", "retraite_ici"];
function choisirQuestions(categories: string[]): string[] {
  const cats = categories.length > 0 ? categories : ["all"];
  const matching = catalogue
    .filter((t) => t.is_active && (t.categories.includes("all") || t.categories.some((c) => cats.includes(c))))
    .sort((a, b) => a.priority - b.priority);
  const seen = new Set<string>();
  const deduped = matching.filter((t) => { const k = t.id.split("_")[0]; if (seen.has(k)) return false; seen.add(k); return true; });
  const isT = (t: Question) => TERRITORY.has(t.id);
  const best = deduped.find(isT) ?? null;
  const out: Question[] = [];
  for (const t of deduped) {
    if (out.length >= 4) break;
    if (out.length === 3 && best && !out.some(isT) && !isT(t)) continue;
    out.push(t);
  }
  if (out.length < 4 && best && !out.some(isT)) out.push(best);
  for (const t of deduped) { if (out.length >= 4) break; if (!out.includes(t)) out.push(t); }
  for (const id of FALLBACK) {
    if (out.length >= 4) break;
    const f = catalogue.find((x) => x.id === id && x.is_active);
    if (f && !out.find((x) => x.id === f.id)) out.push(f);
  }
  return out.slice(0, 4).map((t) => t.id);
}

const lignes: string[] = [];
for (const c of communes) {
  const catsIndex: string[] = vie.deriveCategoriesFromEntry(c);
  const man = manuelle.get(c.insee);
  let cats: string[];
  let usedFallback: boolean;
  if (categoriesReelles) {
    // Commune de l'index : /api/landing-signals renvoie ses catégories d'index ; le repli département ne sert pas.
    ({ categories: cats, usedFallback } = categoriesReelles.categoriesAccueil({ manuelles: man ?? null, index: catsIndex, departement: null }));
  } else {
    cats = man && man.length > 0 ? man : catsIndex;
    usedFallback = !man && cats.every((k) => k === "all");
  }
  const mobilite = c.mobilite ? { partVoitureDomicileTravail: c.mobilite.part_voiture } : null;
  const cartes: { cle: string; fait: string; source: string; valeur?: string }[] =
    recits.getPreviewCards(c.nom, cats, {}, null, "2050", mobilite);
  const mob = cartes.find((k) => k.cle === "mobilite") ?? null;
  lignes.push(JSON.stringify({
    insee: c.insee, nom: c.nom, manuelle: Boolean(man), cats_index: catsIndex, cats,
    part_voiture: c.mobilite?.part_voiture ?? null, dependance: c.mobilite?.dependance ?? null,
    hero: recits.getHeroCopy(c.nom, cats, usedFallback),
    intro: recits.getQuestionIntro(c.nom, cats, usedFallback),
    vide: recits.getEmptyStateCopy(cats),
    mob_fait: mob?.fait ?? null, mob_source: mob?.source ?? null, mob_valeur: mob?.valeur ?? null,
    cartes: cartes.map((k) => k.cle),
    nature_fait: cartes.find((k) => k.cle === "nature" || k.cle === "vie-locale")?.fait ?? null,
    questions: questionsReelles ? questionsReelles.buildTensions(catalogue, cats).map((t: Question) => t.id) : choisirQuestions(cats),
    mood: mood.deriveTerritoryType(c.insee, catsIndex),
  }));
}
writeFileSync(sortie, lignes.join("\n") + "\n");
console.log(`${lignes.length} communes évaluées -> ${sortie}`);
