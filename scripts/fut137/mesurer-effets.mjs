// FUT-137 · MESURE DE L'AVANT / APRÈS sur ce que lit le lecteur, par les fonctions du comparateur et du dossier
// (aucune règle recopiée ici, sauf la bande d'affichage `bandIndex`, privée, rappelée ci-dessous).
//
//   node scripts/fut137/mesurer-effets.mjs --avant <index main .json|.gz> --apres <index branche .json|.gz> [--sortie <json>]
//
// Lit aussi data/vie-locale-rattachements-rna.json (bilan de la branche) et data/population-referentiel-cog2025.json
// (codes repris par FUT-109) pour dire combien d'associations étaient comptées AVANT : direct + codes repris.
import { createJiti } from "jiti";
import { readFileSync, writeFileSync } from "node:fs";
import zlib from "node:zlib";

const racine = process.cwd() + "/";
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const CV = await jiti.import(racine + "src/lib/comparateur-vie.ts");
const MF = await jiti.import(racine + "src/lib/decision/mismatch-facts.ts");

const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : null; };
const lire = (f) => JSON.parse((f.endsWith(".gz") ? zlib.gunzipSync(readFileSync(f)) : readFileSync(f)).toString("utf8"));
const avant = lire(arg("avant"));
const apres = lire(arg("apres"));
const A = new Map(avant.communes.map((c) => [c.insee, c]));
const B = new Map(apres.communes.map((c) => [c.insee, c]));
if (A.size !== B.size || [...A.keys()].some((k) => !B.has(k))) throw new Error("les deux index n'ont pas les mêmes communes");

// comparateur-vie.ts, `bandIndex` (privée) : la bande des paliers affichés et des signaux ambiants.
const bande = (s) => (s == null ? null : s >= 66 ? 0 : s < 34 ? 2 : 1);
const verdict = (c) => {
  const b = c.rankBands?.vie_locale;
  const band = b ? { low: b[0] / 10000, high: b[1] / 10000 } : null;
  return MF.classifyPosition({ key: "vie_locale", rawValue: band ? band.low : null, band, universe: "communes_france", distributionVersion: "-" });
};
const IDENTITES_VIE_LOCALE = ["Pour vivre en montagne dans une commune qui reste animée.", "Pour une petite ville qui reste vraiment vivante."];
const identites = (c) => CV.buildIdentiteCandidates(c).filter((p) => IDENTITES_VIE_LOCALE.includes(p));
const faible = (c) => CV.deriveCategoriesFromEntry(c).includes("faible_vie_locale");

const n = { notes: 0, notesPlusDunPoint: 0, ecartMax: 0, nullVersValeur: 0, valeurVersNull: 0, assosPct: 0, lieuxPct: 0,
  paliers: 0, raisons: 0, raisonsGagnees: 0, raisonsPerdues: 0, seuilIdentite60: 0, identites: 0, categoriesFaible: 0,
  categoriesGagnees: 0, categoriesPerdues: 0, verdicts: 0, bandesRang: 0, verdictsDetail: {} };
const lignes = [];
for (const [k, a] of A) {
  const b = B.get(k);
  const [va, vb] = [a.vieLocale ?? null, b.vieLocale ?? null];
  const [sa, sb] = [CV.subScore("vie_locale", a), CV.subScore("vie_locale", b)];
  const d = { insee: k, nom: b.nom, population: b.population };
  if (JSON.stringify(va) !== JSON.stringify(vb)) {
    if (va && vb) {
      if (va.score !== vb.score) {
        n.notes++;
        const e = Math.abs(vb.score - va.score);
        if (e > 1) n.notesPlusDunPoint++;
        n.ecartMax = Math.max(n.ecartMax, e);
      }
      if (va.assos_pct !== vb.assos_pct) n.assosPct++;
      if (va.lieux_pct !== vb.lieux_pct) n.lieuxPct++;
    } else if (!va && vb) { n.nullVersValeur++; n.notes++; } else if (va && !vb) { n.valeurVersNull++; n.notes++; }
    Object.assign(d, { avant: va, apres: vb });
  }
  if (bande(sa) !== bande(sb)) { n.paliers++; d.palier = [bande(sa), bande(sb)]; }
  const [ra, rb] = [(sa ?? -1) >= CV.SEUIL_RAISON, (sb ?? -1) >= CV.SEUIL_RAISON];
  if (ra !== rb) { n.raisons++; if (rb) n.raisonsGagnees++; else n.raisonsPerdues++; d.raison = rb ? "gagnée" : "perdue"; }
  if (((sa ?? 0) >= 60) !== ((sb ?? 0) >= 60)) n.seuilIdentite60++;
  const [ia, ib] = [identites(a), identites(b)];
  if (JSON.stringify(ia) !== JSON.stringify(ib)) { n.identites++; d.identites = [ia, ib]; }
  const [fa, fb] = [faible(a), faible(b)];
  if (fa !== fb) { n.categoriesFaible++; if (fb) n.categoriesGagnees++; else n.categoriesPerdues++; d.faible = fb ? "gagnée" : "perdue"; }
  if (JSON.stringify(a.rankBands?.vie_locale) !== JSON.stringify(b.rankBands?.vie_locale)) n.bandesRang++;
  const [xa, xb] = [verdict(a), verdict(b)];
  if (xa !== xb) { n.verdicts++; const cle = `${xa} -> ${xb}`; n.verdictsDetail[cle] = (n.verdictsDetail[cle] ?? 0) + 1; d.verdict = [xa, xb]; }
  // Les autres champs ne doivent pas bouger (périmètre) : vieLocale et rankBands.vie_locale seulement.
  const autresA = { ...a, vieLocale: null, rankBands: { ...a.rankBands, vie_locale: null } };
  const autresB = { ...b, vieLocale: null, rankBands: { ...b.rankBands, vie_locale: null } };
  if (JSON.stringify(autresA) !== JSON.stringify(autresB)) (n.horsPerimetre ??= []).push(k);
  if (Object.keys(d).length > 3) lignes.push(d);
}

// Les associations : AVANT, l'index de main comptait les codes en vigueur et les seuls codes repris de FUT-109.
const bilan = JSON.parse(readFileSync("data/vie-locale-rattachements-rna.json", "utf8"));
const fut109 = JSON.parse(readFileSync("data/population-referentiel-cog2025.json", "utf8")).communes;
const repris = new Set(Object.values(fut109).flatMap((c) => c.codesRepris));
let dejaRepris = 0;
const ajoutees = {};
for (const [code, { associations, commune }] of Object.entries(bilan.parCodeDisparu)) {
  if (repris.has(code)) { dejaRepris += associations; continue; }
  (ajoutees[commune] ??= { associations: 0, codes: [] }).associations += associations;
  ajoutees[commune].codes.push(code);
}
const nonRattacheesApres = Object.values(bilan.nonRattachees).reduce((s, v) => s + v, 0);
const associations = {
  total: bilan.total,
  rattacheesAvant: bilan.direct + dejaRepris,
  rattacheesApres: bilan.direct + bilan.rattachees,
  nonRattacheesAvant: bilan.total - bilan.direct - dejaRepris,
  nonRattacheesApres,
  nonRattacheesParMotif: bilan.nonRattachees,
  communesDontLeNombreChange: Object.keys(ajoutees).length,
  codesNouvellementRattaches: Object.values(ajoutees).reduce((s, v) => s + v.codes.length, 0),
};
for (const l of lignes) if (ajoutees[l.insee]) l.associationsAjoutees = ajoutees[l.insee].associations;
const ecart = (l) => (l.avant && l.apres ? l.apres.score - l.avant.score : 0);
const plusAffectees = [...lignes].filter((l) => l.avant && l.apres).sort((x, y) => Math.abs(ecart(y)) - Math.abs(ecart(x)) || x.insee.localeCompare(y.insee)).slice(0, 25)
  .map((l) => ({ insee: l.insee, nom: l.nom, population: l.population, associationsAjoutees: ajoutees[l.insee]?.associations ?? 0, score: [l.avant.score, l.apres.score], assosPct: [l.avant.assos_pct, l.apres.assos_pct], verdict: l.verdict ?? null }));
// Communes qui reçoivent des associations SANS que leur note change, et l'inverse (effet de distribution).
const recoiventSansChanger = Object.keys(ajoutees).filter((k) => JSON.stringify(A.get(k).vieLocale) === JSON.stringify(B.get(k).vieLocale)).length;
const changentSansRecevoir = lignes.filter((l) => (l.avant || l.apres) && !ajoutees[l.insee]).length;

const sortie = { associations, effets: n, recoiventSansChanger, changentSansRecevoir, plusAffectees, lignes };
console.log(JSON.stringify({ associations, effets: { ...n, horsPerimetre: n.horsPerimetre?.length ?? 0 }, recoiventSansChanger, changentSansRecevoir }, null, 1));
console.table(plusAffectees.slice(0, 15).map((l) => ({ ...l, score: l.score.join(" → "), assosPct: l.assosPct.join(" → "), verdict: l.verdict?.join(" → ") ?? "" })));
if (arg("sortie")) writeFileSync(arg("sortie"), JSON.stringify(sortie, null, 1) + "\n");
