// FUT-135 (revue du 25/10) · LES 487 COMMUNES DE LA REVUE : aucun récit ne leur prête une présence étudiante locale.
//
// Les 487 : vie_etudiante mesurée et ≥ 55 alors qu'aucun établissement du supérieur n'est recensé dans leur rayon
// (`etudesSup.weightedAccess === 0`) ; 255 au palier fort (≥ 66). Leur score vient de la part étudiante de leur
// agglomération. Sur les VRAIES sorties du moteur, hors réseau et sans appel Anthropic, pour chacune :
//   - candidats d'identité, traits d'une ville de référence ;
//   - comparaison complète avec Poitiers : palier, qualificatif, identité, découverte, signaux, synthèses ;
//   - carte de recherche réelle (son département, sa population exacte, priorité vie étudiante) : raisons,
//     identité, découverte, compromis, signaux. Les communes sous le plancher de réalisme du moteur (1 500 hab.)
//     n'apparaissent dans aucune recherche : elles sont comptées à part ;
//   - cartes et pistes des recherches « vie étudiante » de leurs départements.
// Règles vérifiées : jamais « ville étudiante » ; toute phrase étudiante d'une commune hors pôle nomme son
// agglomération ; elle dit l'absence d'établissement recensé dans le rayon (sur la cellule : en qualificatif) ;
// « forte » seulement au palier fort.
//   node scripts/fut135/controle-487.mjs
import { createJiti } from "jiti";
import { readFileSync } from "node:fs";
import zlib from "node:zlib";

const racine = process.cwd() + "/";
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const V = await jiti.import(racine + "src/lib/comparateur-vie.ts");
const { communes } = JSON.parse(zlib.gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8"));
await V.getCommuneEntry(communes[0].insee);

const POP_FLOOR = 1500; // comparateur-vie.ts
const parUU = new Map();
for (const c of communes) if (c.uu) parUU.set(c.uu, (parUU.get(c.uu) ?? 0) + 1);
const vie = (c) => V.subScore("vie_etudiante", c);
const set = communes.filter((c) => vie(c) != null && vie(c) >= 55 && c.etudesSup?.weightedAccess === 0);
const ids = new Set(set.map((c) => c.insee));
const fautes = [];
const verifier = (c, texte, ou, { rayon = true } = {}) => {
  if (!texte || !/tudiant/.test(texte)) return false;
  if (/ville étudiante/.test(texte)) fautes.push([c.insee, ou, "ville étudiante", texte]);
  if (rayon && !/aucun établissement supérieur recensé à moins de \d+ km/.test(texte)) fautes.push([c.insee, ou, "rayon absent", texte]);
  const pole = !c.uu || parUU.get(c.uu) === 1;
  if (!pole && !/agglomération/.test(texte)) fautes.push([c.insee, ou, "échelle absente", texte]);
  if (/^forte/i.test(texte) && vie(c) < 66) fautes.push([c.insee, ou, "forte sous 66", texte]);
  return true;
};

const compte = { communes: set.length, forte: set.filter((c) => vie(c) >= 66).length, sousPlancher: 0, cartesForcees: 0, raisonsEtudiantes: 0, cartesDepartements: 0, cellules: 0 };
for (const c of set) {
  if (V.buildIdentiteCandidates(c).includes("Pour une ville étudiante à taille humaine.")) fautes.push([c.insee, "candidat d'identité"]);
  for (const t of V.communeToPreferences(c).traits) verifier(c, t.text, "trait");

  const r = await V.seedComparaison([c.insee, "86194"]);
  const moi = r.trio.find((x) => x.insee === c.insee);
  if (/ville étudiante/.test(moi.identite)) fautes.push([c.insee, "identité (comparaison)", moi.identite]);
  for (const t of [moi.decouverte, ...Object.values(moi.signaux ?? {})]) verifier(c, t, "carte (comparaison)");
  const cell = r.comparaison.themes.flatMap((t) => t.lignes).find((l) => l.id === "vie_etudiante").cellules.find((x) => x.insee === c.insee);
  if (verifier(c, cell.palier, "palier", { rayon: false })) compte.cellules++;
  if (!/^aucun établissement supérieur recensé à moins de \d+ km$/.test(cell.qualifier ?? "")) fautes.push([c.insee, "qualificatif", cell.qualifier]);
  for (const s of r.comparaison.themes.map((t) => t.synthese)) if (s.includes(c.nom) && /sa vie étudiante/.test(s)) fautes.push([c.insee, "synthèse", s]);

  if (c.population < POP_FLOOR) { compte.sousPlancher++; continue; }
  const o = await V.matchProjects({ reformulation: "FUT-135", hardConstraints: { departements: [c.dept], communeSize: { min: c.population, max: c.population, unit: "commune" } }, preferences: [{ key: "vie_etudiante", weight: 3 }] });
  const x = [...o.results, ...o.pistes].find((y) => y.insee === c.insee);
  if (!x) { fautes.push([c.insee, "carte forcée introuvable"]); continue; }
  compte.cartesForcees++;
  if (x.reasons.some((t) => /tudiant/.test(t))) compte.raisonsEtudiantes++;
  if (/ville étudiante/.test(x.identite)) fautes.push([c.insee, "identité (recherche)", x.identite]);
  for (const t of [...x.reasons, x.decouverte, x.tradeoff, ...Object.values(x.signaux ?? {})]) verifier(c, t, "carte (recherche)");
}
for (const d of [...new Set(set.map((c) => c.dept))]) {
  for (const prefs of [[{ key: "vie_etudiante", weight: 3 }], [{ key: "nature", weight: 3 }, { key: "vie_etudiante", weight: 1 }]]) {
    const o = await V.matchProjects({ reformulation: "FUT-135", hardConstraints: { departements: [d] }, preferences: prefs });
    for (const x of [...o.results, ...o.pistes]) {
      if (!ids.has(x.insee)) continue;
      compte.cartesDepartements++;
      const c = communes.find((y) => y.insee === x.insee);
      if (/ville étudiante/.test(x.identite)) fautes.push([c.insee, "identité (département)", x.identite]);
      for (const t of [...x.reasons, x.decouverte, x.tradeoff, ...Object.values(x.signaux ?? {})]) verifier(c, t, "carte (département)");
    }
  }
}
console.log(JSON.stringify({ ...compte, fautes }, null, 2));
if (fautes.length) process.exit(1);
