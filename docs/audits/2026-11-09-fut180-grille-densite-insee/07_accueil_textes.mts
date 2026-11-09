// Exécute le VRAI code de l'accueil (aucune réimplémentation) sur chaque commune de l'index :
//   deriveCategoriesFromEntry (src/lib/comparateur-vie.ts), comme la route /api/landing-signals ;
//   getHeroCopy, getQuestionIntro, getEmptyStateCopy, getPreviewCards (src/lib/accueil/recits.ts),
//   comme FutureELanding.tsx une fois une commune saisie et reconnue (usedFallback = false).
// Usage : node 07_accueil_textes.mts <racine_du_depot_a_la_revision> <index.json.gz> <sortie.jsonl>
// Hook de résolution : même patron que src/lib/fut109-absences-comparateur.test.ts.
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

const [racineDepot, indexGz, sortie] = process.argv.slice(2);
const racine = pathToFileURL(`${racineDepot.replace(/\/$/, "")}/`).href;
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
const communes = JSON.parse(gunzipSync(readFileSync(indexGz)).toString("utf8")).communes;

// Les catégories que comparateur-vie.ts n'émet QUE si `peuDense` (densité connue et < 1 500 hab/km², l. 818).
// Le contrefactuel rejoue les mêmes fonctions sans elles : une phrase présente avec, absente sans,
// est imputable à la règle de densité ; sinon une autre catégorie (montagne, littoral…) la produit déjà.
const PORTEES_PAR_PEU_DENSE = new Set(["rural_peri_urbain", "periurbain_dependance_auto", "rural_agricole", "rural_forestier", "faible_vie_locale"]);

function textes(nom: string, cats: string[]) {
  // usedFallback est faux dès que des catégories autres que « all » existent (FutureELanding.tsx).
  const usedFallback = cats.every((k) => k === "all");
  const hero: string = recits.getHeroCopy(nom, cats, usedFallback);
  const intro: string = recits.getQuestionIntro(nom, cats, usedFallback);
  const vide: string = recits.getEmptyStateCopy(cats);
  // Indicateurs et Géorisques vides : la carte « mobilité » ne lit que les catégories.
  const cartes: { cle: string; fait: string }[] = recits.getPreviewCards(nom, cats, {}, null, "2050");
  const mobilite = cartes.find((k) => k.cle === "mobilite")?.fait ?? null;
  return {
    hero_voiture: /voiture/.test(hero), intro_voiture: /voiture/.test(intro), vide_deplacements: /déplacements/.test(vide),
    carte_mobilite_affichee: mobilite != null, carte_voiture: mobilite != null && /voiture/.test(mobilite),
  };
}

const lignes: string[] = [];
for (const c of communes) {
  const cats: string[] = vie.deriveCategoriesFromEntry(c);
  const sans = textes(c.nom, cats.filter((k) => !PORTEES_PAR_PEU_DENSE.has(k)));
  lignes.push(JSON.stringify({ insee: c.insee, cats, rural_peri_urbain: cats.includes("rural_peri_urbain"), ...textes(c.nom, cats), sans_peu_dense: sans }));
}
writeFileSync(sortie, lignes.join("\n") + "\n");
console.log(`accueil : ${lignes.length} communes évaluées -> ${sortie}`);
