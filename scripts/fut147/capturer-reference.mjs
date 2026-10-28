#!/usr/bin/env node
// FUT-147 · Capture la RÉFÉRENCE de non-régression du comparateur : pour des projets et des trios fixés,
// les communes, scores, raisons, compromis, couverture et le Dossier comparatif complet. Lancé UNE fois
// sur `main` avant FUT-147 (commit 4d75603f), il écrit `src/lib/__fixtures__/fut147-reference-comparateur.json` ;
// le test `fut147-non-regression.test.ts` rejoue les mêmes entrées sur la branche et exige l'identité, la
// seule différence admise étant la ligne « Incendies observés » et le champ `incendiesObserves`.
//
//   node scripts/fut147/capturer-reference.mjs <sortie.json>
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";

const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
import { createRequire } from "node:module";
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

export const BASE = [{ key: "eviter_isolement", weight: 0.5, baseline: true }, { key: "viabilite_emploi", weight: 0.5, baseline: true }];
export const PROJETS = {
  "feu 3 + nature 2 + cadre calme 2": [{ key: "faible_risque_feu", weight: 3 }, { key: "nature", weight: 2 }, { key: "cadre_calme", weight: 2 }],
  "feu 2 + soins 2 + étés frais 1": [{ key: "faible_risque_feu", weight: 2 }, { key: "acces_soins", weight: 2 }, { key: "faible_chaleur", weight: 1 }],
  "feu 3 seule": [{ key: "faible_risque_feu", weight: 3 }],
  "nature 2 + calme 2 (sans feu)": [{ key: "nature", weight: 2 }, { key: "calme_sonore", weight: 2 }],
  "mer 3 + feu 1": [{ key: "proximite_mer", weight: 3 }, { key: "faible_risque_feu", weight: 1 }],
};
export const TRIOS = {
  "Finistère intérieur": ["29016", "29162", "29103"],
  "Maures": ["83067", "83063", "83148"],
  "Marseille, Aix, Toulon": ["13208", "13001", "83137"],
  "Lyon, Brasparts": ["69383", "29016"],
};

export const extraireResultat = (r) => ({
  insee: r.insee, compatibility: r.compatibility, reasons: r.reasons, tradeoff: r.tradeoff, compromis: r.compromis,
  decouverte: r.decouverte, distinctive: r.distinctive, identite: r.identite, couverture: r.couverture ?? null,
  sansPrioriteFavorable: r.sansPrioriteFavorable ?? false, signaux: r.signaux, inondation: r.inondation ?? null,
});

const sortie = { capture: "main 4d75603f, avant FUT-147", projets: {}, trios: {} };
for (const [nom, prefs] of Object.entries(PROJETS)) {
  const o = await V.matchProjects({ reformulation: nom, preferences: [...prefs, ...BASE], hardConstraints: {} });
  sortie.projets[nom] = { results: o.results.map(extraireResultat), pistes: o.pistes.map(extraireResultat), comparaisonComplete: o.comparaisonComplete, candidates: o.candidates };
}
for (const [nom, insees] of Object.entries(TRIOS)) {
  const s = await V.seedComparaison(insees);
  sortie.trios[nom] = { trio: s.trio.map(extraireResultat), comparaison: s.comparaison };
}
const fichier = process.argv[2];
if (fichier) writeFileSync(fichier, `${JSON.stringify(sortie, null, 1)}\n`);
else console.log(JSON.stringify(sortie).slice(0, 500));
