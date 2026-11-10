#!/usr/bin/env node
// FUT-182 · Recapture la référence de non-régression du comparateur (mêmes projets, mêmes trios que FUT-147), après le
// recalcul « nature » (secteur habité OSO 2023). La référence FUT-147 (`fut147-reference-comparateur.json`, capturée sur
// `main` 4d75603f) reste au dépôt, inchangée : elle dit ce que rendait le comparateur avant. FUT-182 change VOLONTAIREMENT
// le classement « Espaces naturels » ; la garde FUT-147 compare désormais à cette capture, qui retire la ligne et le champ
// « Incendies observés » exactement comme le test (`sansIncendies`), pour que la garde des feux reste ce qu'elle était.
//
//   node scripts/fut182/capturer-reference-comparateur.mjs src/lib/__fixtures__/fut182-reference-comparateur.json
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";

const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
async function premier(candidats, ctx, next) {
  for (const c of candidats.slice(0, -1)) { try { return await next(c, ctx); } catch {} }
  return next(candidats[candidats.length - 1], ctx);
}
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (spec.startsWith("@/")) {
    const b = ${JSON.stringify(racine)} + "src/" + spec.slice(2);
    return premier([b + ".ts", b + ".tsx", b], ctx, next);
  }
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\\.[cm]?[jt]sx?$|\\.json$/.test(spec)) {
    return premier([spec + ".ts", spec + ".tsx", spec], ctx, next);
  }
  return next(spec, ctx);
}`;
register(`data:text/javascript,${encodeURIComponent(hook)}`);
const V = await import(`${racine}src/lib/comparateur-vie.ts`);

const BASE = [{ key: "eviter_isolement", weight: 0.5, baseline: true }, { key: "viabilite_emploi", weight: 0.5, baseline: true }];
const PROJETS = {
  "feu 3 + nature 2 + cadre calme 2": [{ key: "faible_risque_feu", weight: 3 }, { key: "nature", weight: 2 }, { key: "cadre_calme", weight: 2 }],
  "feu 2 + soins 2 + étés frais 1": [{ key: "faible_risque_feu", weight: 2 }, { key: "acces_soins", weight: 2 }, { key: "faible_chaleur", weight: 1 }],
  "feu 3 seule": [{ key: "faible_risque_feu", weight: 3 }],
  "nature 2 + calme 2 (sans feu)": [{ key: "nature", weight: 2 }, { key: "calme_sonore", weight: 2 }],
  "mer 3 + feu 1": [{ key: "proximite_mer", weight: 3 }, { key: "faible_risque_feu", weight: 1 }],
};
const TRIOS = {
  "Finistère intérieur": ["29016", "29162", "29103"],
  "Maures": ["83067", "83063", "83148"],
  "Marseille, Aix, Toulon": ["13208", "13001", "83137"],
  "Lyon, Brasparts": ["69383", "29016"],
};
const extraire = (r) => ({
  insee: r.insee, compatibility: r.compatibility, reasons: r.reasons, tradeoff: r.tradeoff, compromis: r.compromis,
  decouverte: r.decouverte, distinctive: r.distinctive, identite: r.identite, couverture: r.couverture ?? null,
  sansPrioriteFavorable: r.sansPrioriteFavorable ?? false, signaux: r.signaux, inondation: r.inondation ?? null,
});
const sansIncendies = (cc) => ({ ...cc, themes: cc.themes.map((t) => ({ ...t, lignes: t.lignes.filter((l) => l.id !== "incendies_observes") })) });

const sortie = { capture: "FUT-182 B3 (secteur habité OSO 2023), sur main 6972d5a4 ; ligne « Incendies observés » retirée", projets: {}, trios: {} };
for (const [nom, prefs] of Object.entries(PROJETS)) {
  const o = await V.matchProjects({ reformulation: nom, preferences: [...prefs, ...BASE], hardConstraints: {} });
  sortie.projets[nom] = { results: o.results.map(extraire), pistes: o.pistes.map(extraire), comparaisonComplete: sansIncendies(o.comparaisonComplete), candidates: o.candidates };
}
for (const [nom, insees] of Object.entries(TRIOS)) {
  const s = await V.seedComparaison(insees);
  sortie.trios[nom] = { trio: s.trio.map(extraire), comparaison: sansIncendies(s.comparaison) };
}
writeFileSync(process.argv[2], `${JSON.stringify(sortie, null, 1)}\n`);
console.log("écrit :", process.argv[2]);
