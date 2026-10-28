// FUT-147 · La carte « Conditions favorables au feu » du module Territoire, rendue pour de vrai : la face
// reste la projection météo ; le volet a deux parties distinctes, « Ce que projette la météo » puis « Les
// incendies enregistrés depuis 2006 », avec la limite de surface visible et le détail replié dans « En
// savoir plus ». Données réelles (DRIAS lu par `drias-json.ts`, table BDIFF versionnée), aucun réseau,
// aucun modèle.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import { memoireIncendiesDeLaCommune, type MemoireIncendies, type TableIncendies } from "./data/bdiff-incendies.ts";
import { LIMITE_SURFACE } from "./incendies-observes.ts";

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

type Scenarios = Record<string, { h: string; v: Record<string, number> }>;
type Section = { label: string; paragraphs: string[]; link?: { label: string; href: string } | null; more?: string[] };
type Detail = { eyebrow: string; headline: string; why: string; whyLabel?: string; sections?: Section[] };
type Facteur = { label: string; val: string; detail?: Detail; tip?: string };

let facteurs: (scenarios: Scenarios | null, commune: string, incendies: MemoireIncendies | null) => Facteur[];
let volet: (detail: Detail) => string;
let drias: (insee: string) => Promise<Scenarios>;
const TABLE = JSON.parse(readFileSync("data/bdiff-incendies.json", "utf8")) as TableIncendies;
const memoire = (insee: string) => memoireIncendiesDeLaCommune(TABLE, insee);

before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { createElement } = await import("react");
  const mod = await import("../components/report/QuartierClimatData.tsx");
  const { MetricDrawer } = await import("../components/MetricDrawer.tsx");
  facteurs = (scenarios, commune, incendies) =>
    (mod.buildFactors as (...a: unknown[]) => Facteur[])(
      scenarios, "gwl20", null, null, null, null, commune,
      null, null, null, null, null, null, null, null, null, null, null, incendies,
    );
  volet = (detail) => texte(renderToStaticMarkup(createElement(MetricDrawer, { detail: detail as never, onClose: () => {} })));
  const { getClimatDataCommune } = await import("./drias-json.ts");
  drias = async (insee) => {
    const c = await getClimatDataCommune(insee);
    assert.ok(c?.commune.s, `données DRIAS de ${insee}`);
    return c.commune.s as Scenarios;
  };
});

function texte(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&apos;/g, "'").replace(/&quot;/g, "\"").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ").trim();
}
const FEU = "Conditions favorables au feu";
const carte = (fs: Facteur[]) => fs.find((f) => f.label === FEU)!;

test("Brasparts : face = projection 2050 inchangée ; volet en deux parties, la phrase validée et sa limite visibles", async () => {
  const s = await drias("29016");
  const avec = facteurs(s, "Brasparts", memoire("29016"));
  const sans = facteurs(s, "Brasparts", null);
  assert.equal(carte(avec).val, carte(sans).val, "la face ne lit pas BDIFF");
  assert.match(carte(avec).val, /jours\/an en 2050$/);
  const d = carte(avec).detail!;
  assert.equal(d.whyLabel, "Ce que projette la météo");
  assert.equal(d.sections?.[0]?.label, "Les incendies enregistrés depuis 2006");
  const rendu = volet(d);
  const iMeteo = rendu.indexOf("Ce que projette la météo");
  const iFeux = rendu.indexOf("Les incendies enregistrés depuis 2006");
  assert.ok(iMeteo >= 0 && iFeux > iMeteo, "la météo d'abord, les incendies ensuite");
  assert.ok(rendu.includes("Un incendie dont le départ a été enregistré sur la commune a parcouru 1 917 hectares au total en 2022."), "le rendu texte normalise l'espace insécable");
  assert.ok(rendu.includes(LIMITE_SURFACE), "la limite est visible, hors du repli");
  assert.ok(rendu.indexOf(LIMITE_SURFACE) < rendu.indexOf("En savoir plus"));
  assert.ok(rendu.includes("Fiche officielle de l'incendie 2022-5306"));
  assert.match(rendu, /En savoir plus.*Départs de feu de forêt recensés dans la base, 2006-2025 : 2, dont 2/);
});

test("les autres cartes du Territoire sont identiques avec ou sans la mémoire des incendies", async () => {
  const s = await drias("83067");
  const avec = facteurs(s, "Gonfaron", memoire("83067")).filter((f) => f.label !== FEU);
  const sans = facteurs(s, "Gonfaron", null).filter((f) => f.label !== FEU);
  assert.deepEqual(JSON.parse(JSON.stringify(avec)), JSON.parse(JSON.stringify(sans)));
});

test("Lyon, Paris, source indisponible : quatre états lisibles, aucun ne rassure", async () => {
  const s = await drias("69383");
  const lyon = volet(carte(facteurs(s, "Lyon", memoire("69383"))).detail!);
  assert.match(lyon, /ne recense pas de départ de feu de forêt à Lyon de 2006 à 2025/);
  assert.match(lyon, /Ce résultat ne permet donc pas de conclure/);
  const paris = volet(carte(facteurs(await drias("75111"), "Paris", memoire("75111"))).detail!);
  assert.match(paris, /ne contient aucune fiche pour ce département/);
  const ko = volet(carte(facteurs(s, "Lyon", { etat: "indisponible" })).detail!);
  assert.match(ko, /n'ont pas pu être lus/);
  for (const t of [lyon, paris, ko]) assert.doesNotMatch(t, /aucun incendie|épargn|à l'abri|risque faible|faible risque/i);
});

test("sans mémoire transmise (ancien appelant), le volet garde la seule partie météo", async () => {
  const d = carte(facteurs(await drias("29016"), "Brasparts", null)).detail!;
  assert.equal(d.sections, undefined);
  assert.doesNotMatch(volet(d), /incendies enregistrés/);
});
