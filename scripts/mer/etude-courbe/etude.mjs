// FUT-33 (2B.2 B) : ÉTUDE de la courbe « près de la mer ». AUCUN code produit n'est modifié.
// Le vrai moteur (src/lib/comparateur-vie.ts) est chargé par jiti, avec src/lib/mer-recherche.ts remplacé par
// mer-recherche-etude.ts (courbe choisie par COURBE_MER). Les requêtes passent dans le VRAI parseur.
// Usage (racine du dépôt) : node scripts/mer/etude-courbe/etude.mjs <.env> > scripts/mer/fixtures/etude-courbe-2b2b.json
import { createJiti } from "jiti";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const src = fileURLToPath(new URL("../../../src/", import.meta.url));
const ici = fileURLToPath(new URL("./", import.meta.url));
const jiti = createJiti(import.meta.url, {
  alias: { "server-only": ici + "vide.mjs", "@/lib/mer-recherche": ici + "mer-recherche-etude.ts", "@/": src },
});
const vie = await jiti.import(src + "lib/comparateur-vie.ts");
const { COURBES } = await jiti.import(ici + "mer-recherche-etude.ts");
const { parserReel } = await jiti.import(fileURLToPath(new URL("../parseur-reel.mts", import.meta.url)));
const env = process.argv[2];

const index = JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8")).communes;
const parNom = new Map(index.map((c) => [`${c.nom}|${c.dept}`, c]));
const PANEL = [
  "Perros-Guirec|22", "Lannion|22", "Brest|29", "La Rochelle|17", "Châtelaillon-Plage|17", "Vannes|56", "Narbonne|11",
  "Morlaix|29", "Montpellier|34", "Rochefort|17", "Lacanau|33", "Caen|14", "Carcans|33", "Arles|13", "Béziers|34",
  "Nîmes|30", "Saintes|17", "Pessac|33", "Bordeaux|33", "Nantes|44", "Rennes|35", "Niort|79", "Angers|49",
  "Poitiers|86", "Toulouse|31", "Lyon|69", "Annecy|74", "Clermont-Ferrand|63",
].map((k) => { const c = parNom.get(k) ?? index.find((x) => x.nom.startsWith(k.split("|")[0]) && x.dept === k.split("|")[1]); if (!c) throw new Error(k); return c; });

const REQUETES = [
  "Une petite ville près de la mer.",
  "Une ville moyenne près de la mer, avec un train pour Paris.",
  "Proche de la mer, mais pas trop chaud l'été.",
  "Une petite ville vivante près du littoral.",
];

// Le score de classement du moteur, recalculé sur TOUTES les communes (matchProjects n'en rend que 5) :
// même plancher de viabilité, même moyenne pondérée de subScore. Aucune contrainte dure, aucune ancre dans
// ces requêtes (vérifié) : le bonus souple est nul.
function classement(parsed) {
  const prefs = parsed.preferences.filter((p) => vie.PREFERENCE_KEYS.includes(p.key))
    .map((p) => ({ key: p.key, weight: Math.min(3, Math.max(1, Math.round(p.weight) || 1)) }));
  const hasIso = prefs.some((p) => p.key === "eviter_isolement");
  const hasEmp = prefs.some((p) => p.key === "viabilite_emploi");
  if (hasEmp || parsed.emploiHorsSujet === true) { if (!hasIso) prefs.push({ key: "eviter_isolement", weight: 1 }); }
  else if (!hasIso) prefs.push({ key: "eviter_isolement", weight: 0.5 }, { key: "viabilite_emploi", weight: 0.5 });
  const totalW = prefs.reduce((s, p) => s + p.weight, 0);
  const scores = index.map((c) => {
    let s = 0;
    for (const p of prefs) { const v = vie.subScore(p.key, c); if (v != null) s += p.weight * v; }
    return { c, score: s / totalW };
  }).sort((a, b) => b.score - a.score);
  const rang = new Map(scores.map((x, i) => [x.c.insee, i + 1]));
  const top = (n) => scores.slice(0, n).map((x) => x.c.mer_centre_km).sort((a, b) => a - b);
  const med = (l) => l[Math.floor(l.length / 2)];
  return {
    rang, scores,
    resume: {
      mediane_mer_top20_km: med(top(20)), mediane_mer_top100_km: med(top(100)),
      part_top100_a_10km_ou_moins: top(100).filter((d) => d <= 10).length / 100,
      part_top1000_a_10km_ou_moins: top(1000).filter((d) => d <= 10).length / 1000,
      part_top1000_au_dela_de_30km: top(1000).filter((d) => d > 30).length / 1000,
    },
    prefs,
  };
}

// LES SEUILS QUE LA COURBE DÉCIDE SANS LES NOMMER : paliers du Dossier comparatif (bandIndex : >= 66 « En bord
// de mer », < 34 « Loin de la mer »), raison de carte (score >= 55), compromis « éloignée du littoral » (< 50).
function distancePour(courbe, score) { let lo = 0, hi = 400; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (courbe(m) >= score) lo = m; else hi = m; } return Math.round(lo * 10) / 10; }
const seuilsImplicites = Object.fromEntries(["A", "B", "C"].map((k) => [k, {
  palier_en_bord_de_mer_jusqua_km: distancePour(COURBES[k], 66), palier_loin_de_la_mer_au_dela_km: distancePour(COURBES[k], 34),
  raison_de_carte_jusqua_km: distancePour(COURBES[k], 55), compromis_eloignee_au_dela_km: distancePour(COURBES[k], 50),
}]));
const sortie = { seuilsImplicites, courbes: { A: "linéaire, 0 à 150 km", B: "exponentielle, 100·e^(-d/25)", C: "rationnelle, 100/(1+(d/20)²)" }, panel: [], requetes: [] };
for (const c of PANEL) {
  sortie.panel.push({ commune: c.nom, mer_centre_km: c.mer_centre_km, A: Math.round(COURBES.A(c.mer_centre_km)), B: Math.round(COURBES.B(c.mer_centre_km)), C: Math.round(COURBES.C(c.mer_centre_km)) });
}
for (const texte of REQUETES) {
  const parsed = await parserReel(texte, env);
  const hc = parsed.hardConstraints ?? {};
  const dur = Object.entries(hc).filter(([, v]) => v && (typeof v !== "object" || (Array.isArray(v) ? v.length : Object.keys(v).length)) && !(v?.active === false));
  const r = { texte, preferences: parsed.preferences, contraintes_dures: Object.fromEntries(dur), sizeWord: parsed.sizeWord ?? null, parCourbe: {} };
  for (const k of ["A", "B", "C"]) {
    process.env.COURBE_MER = k;
    const cl = classement(parsed);
    const vrai = await vie.matchProjects(parsed);
    r.parCourbe[k] = {
      ...cl.resume,
      rangs: Object.fromEntries(PANEL.map((c) => [c.nom, cl.rang.get(c.insee)])),
      top10_recalcule: cl.scores.slice(0, 10).map((x) => `${x.c.nom} (${x.c.mer_centre_km} km)`),
      top5_moteur: vrai.results.map((x) => `${x.nom} (${index.find((c) => c.insee === x.insee)?.mer_centre_km} km)`),
    };
  }
  sortie.requetes.push(r);
}
console.log(JSON.stringify(sortie, null, 1));
