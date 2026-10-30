// FUT-141 · Mise à jour CONTRÔLÉE de la référence figée de FUT-147 (src/lib/__fixtures__/fut147-reference-comparateur.json).
//
// La référence fige le comparateur de main pour prouver que FUT-147 n'a rien changé hors « Incendies observés ».
// FUT-141 change, à dessein, la vie étudiante : ses cellules, ses signaux, et la synthèse du thème qui la cite. Ce
// script rejoue les entrées de la référence (mêmes projets, mêmes trios que le test), liste chaque écart et REFUSE
// d'écrire si un seul écart ne relève pas de la vie étudiante. Sinon il remplace ces seules valeurs, au même format.
//   node scripts/fut141/maj-reference-fut147.mjs            # rapport
//   node scripts/fut141/maj-reference-fut147.mjs --ecrire   # met à jour la référence
import { createJiti } from "jiti";
import { readFileSync, writeFileSync } from "node:fs";

const racine = process.cwd() + "/";
const FICHIER = "src/lib/__fixtures__/fut147-reference-comparateur.json";
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const V = await jiti.import(racine + "src/lib/comparateur-vie.ts");
const REF = JSON.parse(readFileSync(FICHIER, "utf8"));

// Entrées recopiées de src/lib/fut147-non-regression.test.ts.
const BASE = [{ key: "eviter_isolement", weight: 0.5, baseline: true }, { key: "viabilite_emploi", weight: 0.5, baseline: true }];
const PROJETS = {
  "feu 3 + nature 2 + cadre calme 2": [{ key: "faible_risque_feu", weight: 3 }, { key: "nature", weight: 2 }, { key: "cadre_calme", weight: 2 }],
  "feu 2 + soins 2 + étés frais 1": [{ key: "faible_risque_feu", weight: 2 }, { key: "acces_soins", weight: 2 }, { key: "faible_chaleur", weight: 1 }],
  "feu 3 seule": [{ key: "faible_risque_feu", weight: 3 }],
  "nature 2 + calme 2 (sans feu)": [{ key: "nature", weight: 2 }, { key: "calme_sonore", weight: 2 }],
  "mer 3 + feu 1": [{ key: "proximite_mer", weight: 3 }, { key: "faible_risque_feu", weight: 1 }],
};
const TRIOS = { "Finistère intérieur": ["29016", "29162", "29103"], "Maures": ["83067", "83063", "83148"], "Marseille, Aix, Toulon": ["13208", "13001", "83137"], "Lyon, Brasparts": ["69383", "29016"] };
const extraire = (r) => ({
  insee: r.insee, compatibility: r.compatibility, reasons: r.reasons, tradeoff: r.tradeoff, compromis: r.compromis,
  decouverte: r.decouverte, distinctive: r.distinctive, identite: r.identite, couverture: r.couverture ?? null,
  sansPrioriteFavorable: r.sansPrioriteFavorable ?? false, signaux: r.signaux, inondation: r.inondation ?? null,
});
const sansIncendies = (cc) => ({ ...cc, themes: cc.themes.map((t) => ({ ...t, lignes: t.lignes.filter((l) => l.id !== "incendies_observes") })) });

// Un écart est « étudiant » s'il touche la ligne vie_etudiante, un signal vie_etudiante (y compris quand le jeu de
// signaux se recompose autour de lui), ou une synthèse dont l'un des deux textes parle d'études.
const ecarts = [];
const etudiant = (chemin, a, b) =>
  /lignes\[vie_etudiante\]/.test(chemin) ||
  (/\.signaux$/.test(chemin) && JSON.stringify([a, b]).includes("vie_etudiante")) ||
  (/\.synthese$/.test(chemin) && /étudiant|supérieur/.test(`${a} ${b}`));
function comparer(a, b, chemin, poser) {
  if (JSON.stringify(a) === JSON.stringify(b)) return;
  const etiquette = (x, i) => (x && typeof x === "object" && x.id ? x.id : i);
  if (/\.signaux$/.test(chemin) || /\.synthese$/.test(chemin) || a == null || b == null || typeof a !== "object" || typeof b !== "object") {
    ecarts.push({ chemin, avant: a, apres: b, etudiant: etudiant(chemin, a, b) });
    poser(b);
    return;
  }
  if (Array.isArray(a) !== Array.isArray(b) || (Array.isArray(a) && a.length !== b.length)) {
    ecarts.push({ chemin, avant: a, apres: b, etudiant: false });
    return;
  }
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const nom = Array.isArray(a) ? `[${etiquette(a[k], k)}]` : `.${k}`;
    comparer(a[k], b[k], chemin + nom, (v) => { a[k] = v; });
  }
}

for (const [nom, prefs] of Object.entries(PROJETS)) {
  const o = await V.matchProjects({ reformulation: nom, preferences: [...prefs, ...BASE], hardConstraints: {} });
  const ref = REF.projets[nom];
  comparer(ref.candidates, o.candidates, `projets[${nom}].candidates`, (v) => { ref.candidates = v; });
  comparer(ref.results, o.results.map(extraire), `projets[${nom}].results`, () => {});
  comparer(ref.pistes, o.pistes.map(extraire), `projets[${nom}].pistes`, () => {});
  comparer(ref.comparaisonComplete, sansIncendies(o.comparaisonComplete), `projets[${nom}].comparaisonComplete`, () => {});
}
for (const [nom, insees] of Object.entries(TRIOS)) {
  const s = await V.seedComparaison(insees);
  comparer(REF.trios[nom].trio, s.trio.map(extraire), `trios[${nom}].trio`, () => {});
  comparer(REF.trios[nom].comparaison, sansIncendies(s.comparaison), `trios[${nom}].comparaison`, () => {});
}

const hors = ecarts.filter((e) => !e.etudiant);
console.log(JSON.stringify({ ecarts: ecarts.length, horsVieEtudiante: hors.length, detail: ecarts }, null, 1));
if (hors.length) { console.error("REFUS : écart hors vie étudiante"); process.exit(1); }
if (process.argv.includes("--ecrire") && ecarts.length) {
  writeFileSync(FICHIER, JSON.stringify(REF, null, 1) + "\n");
  console.error(`référence mise à jour : ${ecarts.length} valeurs`);
}
