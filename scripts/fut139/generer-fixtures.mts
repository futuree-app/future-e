// FUT-139 · Fixtures de recette : vrais résultats du moteur sur l'index réel, figés pour la page.
// Usage : node scripts/fut139/generer-fixtures.mts (aucun réseau, aucun modèle).
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


const CAS = [
  { id: "exploration-inondation", texte: "Je veux éviter les inondations en Charente-Maritime.", dep: ["17"], prefs: [{ key: "faible_risque_inondation", weight: 3 }] },
  { id: "classe-complet", texte: "De la nature et un médecin pas loin, en Charente-Maritime.", dep: ["17"], prefs: [{ key: "acces_soins", weight: 2 }, { key: "nature", weight: 3 }] },
  { id: "paris-partielle", texte: "Un cadre calme et de la culture, à Paris.", dep: ["75"], prefs: [{ key: "cadre_calme", weight: 3 }, { key: "acces_culture", weight: 2 }] },
  { id: "sans-priorite", texte: "Vivre en Charente-Maritime.", dep: ["17"], prefs: [] },
];

  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  const V = await import("../../src/lib/comparateur-vie.ts");
  const out: Record<string, unknown> = {};
  for (const c of CAS) {
    const parsed = { reformulation: c.texte, hardConstraints: { departements: c.dep }, preferences: c.prefs };
    const outcome = await V.matchProjects(parsed as never);
    out[c.id] = { texte: c.texte, parsed, outcome: { ...outcome, pistes: [] } };
  }
  writeFileSync("docs/audits/2026-10-26-fut139-questions-ask/fixtures.json", JSON.stringify(out) + "\n");
