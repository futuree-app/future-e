// FUT-96 : texte réellement rendu par les deux présentations, sans réseau ni génération.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { mapCommuneToModuleFacts } from "./decision/module-facts-map.ts";
import { runRules } from "./decision/materiality-rules.ts";
import { assembleDossier } from "./decision/decision-assembler.ts";
import { composeFacts } from "./decision/fact-compositions.ts";
import { hydrateHardConstraints } from "./hard-constraints-hydrate.ts";
import { PRODUCT_CONVENTIONS_VERSION, type EvaluationContext } from "./hard-constraints.ts";
import { normalizeUserProject, type UserProject } from "./user-project.ts";
import type { IndexCommune, PreferenceKey } from "./comparateur-vie.ts";
import type { AlignmentFact, DecisionFact, Dossier } from "./decision/decision-fact.ts";

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
  // La section importe la conclusion rédigée (composant serveur) : elle n'est pas rendue ici (verdict
  // déterministe, logementStatus « pending »), mais son module doit se charger.
  if (spec === "next/headers" || spec === "next/cache") {
    return { url: "data:text/javascript,export const headers=async()=>new Map();export const cookies=async()=>({get:()=>undefined});export const unstable_cache=(f)=>f;export const revalidateTag=()=>{};", shortCircuit: true };
  }
  if (spec.startsWith("@/")) {
    const b = ${JSON.stringify(racine)} + "src/" + spec.slice(2);
    return premier([b + ".ts", b + ".tsx", b], ctx, next);
  }
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\\.[cm]?[jt]sx?$|\\.json$/.test(spec)) {
    return premier([spec + ".ts", spec + ".tsx", spec], ctx, next);
  }
  if (spec === "next/link") return next("next/link.js", ctx);
  if (spec === "next/navigation") return next("next/navigation.js", ctx);
  return next(spec, ctx);
}
export async function load(url, ctx, next) {
  if (url.endsWith(".css")) return { format: "module", source: "export default new Proxy({}, { get: (_, k) => String(k) });", shortCircuit: true };
  if (!url.endsWith(".tsx")) return next(url, ctx);
  const fichier = fileURLToPath(url);
  const { outputText } = ts.transpileModule(readFileSync(fichier, "utf8"), {
    fileName: fichier,
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return { format: "module", source: outputText, shortCircuit: true };
}`;

const COMMUNE = {
  insee: "17999", nom: "Villetest", dept: "17", region: "Nouvelle-Aquitaine", lat: 46.1, lon: -1.1,
  population: 30000, densite: 1200, mer_centre_km: 40, altitude: 10, clim: {}, pct: {},
} as unknown as IndexCommune;

const FAVORABLE: [number, number] = [9600, 9800]; // 1 - 0,96 = 4 % -> « les 5 % »

function projet(prefs: Partial<Record<PreferenceKey, number>>): UserProject {
  return normalizeUserProject({
    posture: "recherche", intent: null, rawText: "Vivre sans voiture.", updatedAt: "2026-10-22T00:00:00.000Z",
    parsed: { reformulation: "x", hardConstraints: {}, preferences: Object.entries(prefs).map(([key, weight]) => ({ key, weight })) },
  })!;
}

function dossier(p: UserProject, rangs: Partial<Record<PreferenceKey, [number, number]>>) {
  const entry = { ...COMMUNE, rankBands: rangs } as unknown as IndexCommune;
  const mf = mapCommuneToModuleFacts(entry, {}, {
    hasAddress: false, tailleVille: 30000, tailleVilleSource: "commune", climat: null, risquesDeclares: { wildfire: false },
  });
  const ctx: EvaluationContext = {
    constraints: hydrateHardConstraints({}, { byName: () => null, plmByName: () => null }),
    point: { lat: 46.1, lon: -1.1, grain: "commune_reference", source: "commune_centroid", label: "Villetest" },
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };
  const run = runRules(mf, p, ctx);
  const d = assembleDossier(run, p, "commune", mf.nom, composeFacts(run, mf, p), null);
  return { run, d };
}

const faits = (d: Dossier): DecisionFact[] =>
  d.sections.flatMap((s) => s.cards.flatMap((c) => (c.kind === "fact" ? [c.fact] : [])));
const voiture = (d: Dossier) =>
  faits(d).filter((f) => "projectKey" in f && f.projectKey === "faible_dependance_auto");


let rendre: (d: Dossier, presentation: "classique" | "releve") => string;
before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { createElement } = await import("react");
  const { DossierDecisionSection } = await import("../components/report/DossierDecisionSection.tsx");
  rendre = (d, presentation) => renderToStaticMarkup(createElement(DossierDecisionSection, {
    dossier: d, presentation, insee: "17999", scopeKey: "commune", logementStatus: "pending",
  }));
});
const texte = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ");
for (const presentation of ["classique", "releve"] as const) {
  test(`${presentation} : mobilité favorable, limitation existante visible et intacte`, () => {
    const { d } = dossier(projet({ faible_dependance_auto: 3 }), { faible_dependance_auto: FAVORABLE });
    const f = voiture(d)[0] as AlignmentFact;
    assert.equal(f.role, "alignment");
    assert.ok(f.limitation);
    const avant = JSON.stringify(d);
    const html = rendre(d, presentation);
    assert.ok(texte(html).includes(f.faceStatement));
    assert.ok(texte(html).includes(f.limitation));
    // Visible dans le corps de la carte, pas cachée dans des détails.
    assert.ok(html.includes(`>${f.limitation.replace(/'/g, "&#x27;")}</p>`));
    assert.equal(JSON.stringify(d), avant);
  });
  test(`${presentation} : sans limitation, aucune nuance ni texte artificiel`, () => {
    const { d } = dossier(projet({ faible_dependance_auto: 3 }), { faible_dependance_auto: FAVORABLE });
    const f = voiture(d)[0] as AlignmentFact;
    const limite = f.limitation!;
    delete f.limitation;
    const html = rendre(d, presentation);
    assert.ok(texte(html).includes(f.faceStatement));
    assert.ok(!texte(html).includes(limite));
    const carte = html.slice(html.indexOf("<li"), html.indexOf("</li>") + 5);
    assert.doesNotMatch(carte, /<p[^>]*><\/p>/);
  });
}
