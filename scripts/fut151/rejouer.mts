// FUT-151 · Rejoue des recherches « Où vivre » sur l’index réel et fige classements, scores et textes rendus.
// Usage : node scripts/fut151/rejouer.mts <sortie.json>   (aucun réseau, aucun modèle).
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";

const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const ts = createRequire(${JSON.stringify(racine)} + "package.json")("typescript");
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
  if (spec === "next/link") return next("next/link.js", ctx);
  return next(spec, ctx);
}
export async function load(url, ctx, next) {
  if (!url.endsWith(".tsx")) return next(url, ctx);
  const fichier = fileURLToPath(url);
  const { outputText } = ts.transpileModule(readFileSync(fichier, "utf8"), {
    fileName: fichier,
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return { format: "module", source: outputText, shortCircuit: true };
}`;

type P = { key: string; weight: number };
const CAS: { id: string; dep?: string[]; prefs: P[] }[] = [
  // La reproduction du ticket : Châteauneuf-le-Rouge, seul critère « feux », aucun favorable.
  { id: "feu-13", dep: ["13"], prefs: [{ key: "faible_risque_feu", weight: 3 }] },
  { id: "feu-chaleur-13", dep: ["13"], prefs: [{ key: "faible_risque_feu", weight: 3 }, { key: "faible_chaleur", weight: 2 }] },
  { id: "feu-soins-13", dep: ["13"], prefs: [{ key: "faible_risque_feu", weight: 3 }, { key: "acces_soins", weight: 3 }] },
  { id: "chaleur-84", dep: ["84"], prefs: [{ key: "faible_chaleur", weight: 3 }] },
  { id: "secheresse-83", dep: ["83"], prefs: [{ key: "faible_secheresse", weight: 3 }] },
  { id: "transports-48", dep: ["48"], prefs: [{ key: "acces_transports", weight: 3 }, { key: "mobilite_quotidienne", weight: 2 }] },
  { id: "feu-29-56", dep: ["29", "56"], prefs: [{ key: "faible_risque_feu", weight: 3 }] },
  { id: "soins-nature-17", dep: ["17"], prefs: [{ key: "acces_soins", weight: 2 }, { key: "nature", weight: 3 }] },
  { id: "calme-culture-75", dep: ["75"], prefs: [{ key: "cadre_calme", weight: 3 }, { key: "acces_culture", weight: 2 }] },
  { id: "etudiant-23", dep: ["23"], prefs: [{ key: "vie_etudiante", weight: 3 }] },
  { id: "inondation-17", dep: ["17"], prefs: [{ key: "faible_risque_inondation", weight: 3 }] },
  { id: "inondation-feu-13", dep: ["13"], prefs: [{ key: "faible_risque_inondation", weight: 3 }, { key: "faible_risque_feu", weight: 2 }] },
  { id: "sans-priorite-17", dep: ["17"], prefs: [] },
  { id: "national-fraicheur", prefs: [{ key: "faible_chaleur", weight: 3 }, { key: "acces_soins", weight: 2 }] },
  { id: "national-mer-calme", prefs: [{ key: "proximite_mer", weight: 3 }, { key: "calme_sonore", weight: 2 }, { key: "air_sain", weight: 1 }] },
  { id: "national-culture-transports", prefs: [{ key: "acces_culture", weight: 3 }, { key: "acces_transports", weight: 2 }, { key: "faible_dependance_auto", weight: 2 }] },
  { id: "national-nature-calme-sec", prefs: [{ key: "nature", weight: 3 }, { key: "cadre_calme", weight: 2 }, { key: "faible_secheresse", weight: 2 }] },
  { id: "national-emploi-ecoles", prefs: [{ key: "viabilite_emploi", weight: 3 }, { key: "acces_ecoles", weight: 2 }, { key: "vie_locale", weight: 1 }] },
  { id: "mer-feu-06", dep: ["06"], prefs: [{ key: "proximite_mer", weight: 2 }, { key: "faible_risque_feu", weight: 3 }, { key: "air_sain", weight: 2 }] },
  { id: "calme-industrie-59", dep: ["59"], prefs: [{ key: "calme_sonore", weight: 3 }, { key: "faible_exposition_industrielle", weight: 3 }, { key: "air_sain", weight: 2 }] },
];

const sortie = process.argv[2];
if (!sortie) throw new Error("usage : rejouer.mts <sortie.json>");
register(`data:text/javascript,${encodeURIComponent(hook)}`);
const V = await import("../../src/lib/comparateur-vie.ts");
const carte = (r: Record<string, any>) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
  insee: r.insee, nom: r.nom, compatibility: r.compatibility, couverture: r.couverture?.etat ?? null,
  sansPrioriteFavorable: r.sansPrioriteFavorable ?? false,
  reasons: r.reasons, decouverte: r.decouverte, tradeoff: r.tradeoff, compromis: r.compromis, distinctive: r.distinctive,
});
const out: Record<string, unknown> = {};
for (const c of CAS) {
  const parsed = { reformulation: c.id, hardConstraints: c.dep ? { departements: c.dep } : {}, preferences: c.prefs };
  const o = await V.matchProjects(parsed as never);
  out[c.id] = {
    parsed,
    // Ce que le classement décide : ordre, scores, et ce qui en découle.
    classement: {
      perfectMatch: o.perfectMatch, bestCompatibility: o.bestCompatibility, candidates: o.candidates, couverture: o.couverture,
      results: o.results.map((r: Record<string, unknown>) => [r.insee, r.compatibility]),
      pistes: o.pistes.map((r: Record<string, unknown>) => [r.insee, r.compatibility]),
      avantages: o.comparaisonComplete.themes.flatMap((t: any) => t.lignes.map((l: any) => [l.id, l.avantage, l.cellules.map((x: any) => x.palier)])), // eslint-disable-line @typescript-eslint/no-explicit-any
    },
    // Ce que le lecteur lit.
    textes: {
      message: o.message,
      cartes: o.results.slice(0, 3).map(carte),
      pistes: o.pistes.map(carte),
      resume: o.comparaisonComplete.resume, arbitrage: o.comparaisonComplete.arbitrage,
      syntheses: o.comparaisonComplete.themes.map((t: Record<string, unknown>) => [t.id, t.synthese]),
    },
  };
}
writeFileSync(sortie, JSON.stringify(out, null, 1) + "\n");
console.log(`${Object.keys(out).length} recherches figées dans ${sortie}`);
