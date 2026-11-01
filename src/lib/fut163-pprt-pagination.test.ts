// FUT-163 (31/10/2026) · PAGINATION PPRT AU POINT : une page incomplète ne prouve jamais l'absence d'un plan.
//
// Contre-revue indépendante (NO GO) : `getIndustrieAdresse` acceptait la page au point même quand
// `lirePagePprt` la disait incomplète (`complete === false`). Zéro plan lu sur trois annoncés devenait « Non.
// Aucun plan de prévention des risques technologiques n'est recensé… » : une fausse conclusion d'absence
// réglementaire. Chaque cas part ici d'une réponse Géorisques simulée, traverse la VRAIE collecte, et s'arrête
// sur le texte RÉELLEMENT AFFICHÉ par la section Logement (rendu React, balises retirées).
import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { reponsePprt, type LectureIndustrieAdresse } from "./industrie-adresse.ts";
import { sourcesAbsentes } from "./logement-report-version.ts";

const fx = (n: string) => JSON.parse(readFileSync(new URL(`./__fixtures__/fut167/${n}.json`, import.meta.url), "utf8"));
const FEYZIN = fx("pprt-point-feyzin-ramboz");
const PLAN_FEYZIN = FEYZIN.content[0];
const COMMUNE_VIDE = { totalElements: 0, content: [] };
const COLLECTE = "2026-10-31T10:00:00.000Z";

const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const ts = createRequire(${JSON.stringify(racine)} + "package.json")("typescript");
async function premier(c, ctx, next) { for (const x of c.slice(0, -1)) { try { return await next(x, ctx); } catch {} } return next(c[c.length - 1], ctx); }
export async function resolve(s, ctx, next) {
  if (s === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (s.startsWith("@/")) { const b = ${JSON.stringify(racine)} + "src/" + s.slice(2); return premier([b + ".ts", b + ".tsx", b], ctx, next); }
  if ((s.startsWith("./") || s.startsWith("../")) && !/\\.[cm]?[jt]sx?$|\\.json$|\\.css$/.test(s)) return premier([s + ".ts", s + ".tsx", s], ctx, next);
  if (s === "next/link") return next("next/link.js", ctx);
  return next(s, ctx);
}
export async function load(url, ctx, next) {
  if (url.endsWith(".css")) return { format: "module", source: "export default new Proxy({}, { get: (_, k) => String(k) });", shortCircuit: true };
  if (!url.endsWith(".tsx")) return next(url, ctx);
  const f = fileURLToPath(url);
  const { outputText } = ts.transpileModule(readFileSync(f, "utf8"), { fileName: f, compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
  return { format: "module", source: outputText, shortCircuit: true };
}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SRV: any;
let afficher: (l: LectureIndustrieAdresse) => string;
before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  SRV = await import(`${racine}src/lib/server/industrie-adresse.ts`);
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { createElement } = await import("react");
  const { IndustrieAdresseSection } = await import(`${racine}src/components/report/logement/IndustrieAdresseSection.tsx`);
  afficher = (l) => renderToStaticMarkup(createElement(IndustrieAdresseSection, { lecture: l, collecteeLe: COLLECTE }))
    .replace(/<[^>]+>/g, " ").replace(/&#x27;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&")
    .replace(/ /g, " ").replace(/\s+/g, " ").trim();
});
const fetchReel = globalThis.fetch;
const jetonReel = process.env.GEORISQUES_API_TOKEN;
beforeEach(() => { globalThis.fetch = fetchReel; process.env.GEORISQUES_API_TOKEN = "jeton-test"; });
process.on("exit", () => { process.env.GEORISQUES_API_TOKEN = jetonReel; });

/** Géorisques simulé : la page au point (v2) et la liste de la commune (v1). `null` = panne (503). */
function georisques(point: unknown | null, commune: unknown | null = COMMUNE_VIDE) {
  globalThis.fetch = (async (input: string | URL) => {
    const u = new URL(String(input));
    const r = u.pathname.startsWith("/api/v2") ? point : commune;
    return r == null ? new Response("panne", { status: 503 }) : Response.json(r);
  }) as typeof fetch;
}
const collecter = () => SRV.getIndustrieAdresse({ lat: 45.68035, lon: 4.84605, citycode: "69199", precision: "numero" }) as Promise<LectureIndustrieAdresse>;
const AUCUN_PLAN = /Aucun plan de prévention des risques technologiques n'est recensé/;
const HORS_PERIMETRE = /Hors périmètre réglementé/;

test("totalElements = 3, un seul plan reçu : le plan est dit, la liste n'est jamais présentée comme complète", async () => {
  georisques({ totalElements: 3, content: [PLAN_FEYZIN] });
  const l = await collecter();
  assert.deepEqual(l.pprtPoint.etat === "lu" && [l.pprtPoint.plans.length, l.pprtPoint.annonces], [1, 3]);
  assert.equal(reponsePprt(l), "dans_un_plan");
  const ecran = afficher(l);
  assert.match(ecran, /Oui\. Le point de cette adresse est dans le périmètre réglementé du plan « Vallée de la chimie » \(base GASPAR, consultée le 31\/10\/2026\)\. La base annonce 3 plans à ce point, un seul a pu être lu : cette liste n'est pas complète, l'état des risques la donne en entier\./);
  assert.doesNotMatch(ecran, AUCUN_PLAN);
  assert.ok(sourcesAbsentes({ industrieAdresse: l } as never).includes("pprt_point"), "la lecture partielle est nommée");
});

test("totalElements = 1, un plan reçu : lecture complète, aucune réserve de pagination", async () => {
  georisques(FEYZIN);
  const l = await collecter();
  assert.equal(l.pprtPoint.etat === "lu" && l.pprtPoint.annonces, undefined);
  assert.equal(reponsePprt(l), "dans_un_plan");
  const ecran = afficher(l);
  assert.match(ecran, /Oui\. Le point de cette adresse est dans le périmètre réglementé du plan « Vallée de la chimie »/);
  assert.doesNotMatch(ecran, /n'est pas complète|annonce/);
  assert.equal(sourcesAbsentes({ industrieAdresse: l } as never).includes("pprt_point"), false);
});

test("zéro plan, lecture complète (point et commune) : « Non. Aucun plan… » reste légitime", async () => {
  georisques({ totalElements: 0, content: [] });
  const l = await collecter();
  assert.equal(reponsePprt(l), "aucun_plan");
  const ecran = afficher(l);
  assert.match(ecran, /Non\. Aucun plan de prévention des risques technologiques n'est recensé sur la commune ni au point de cette adresse/);
  assert.match(ecran, HORS_PERIMETRE);
});

test("zéro plan, lecture incomplète : non déterminable, JAMAIS « aucun plan »", async () => {
  // Deux formes : une page vide qui annonce deux plans, et des plans annoncés mais illisibles (sans identifiant).
  for (const page of [{ totalElements: 2, content: [] }, { totalElements: 2, content: [{ libPpr: "sans identifiant" }, {}] }]) {
    georisques(page);
    const l = await collecter();
    assert.equal(reponsePprt(l), "non_determinable", JSON.stringify(page));
    const ecran = afficher(l);
    assert.match(ecran, /Non déterminable : la base annonce 2 plans au point de cette adresse, mais leur liste n'a pas pu être lue le 31\/10\/2026\. Rien n'en est déduit/);
    assert.doesNotMatch(ecran, AUCUN_PLAN);
    assert.doesNotMatch(ecran, HORS_PERIMETRE);
    assert.ok(sourcesAbsentes({ industrieAdresse: l } as never).includes("pprt_point"));
  }
  // Un seul plan annoncé : le singulier.
  georisques({ totalElements: 1, content: [] });
  assert.match(afficher(await collecter()), /la base annonce un plan au point de cette adresse/);
});

test("plan positif dans une page partielle, commune sans plan lue : le plan au point l'emporte, sans exhaustivité", async () => {
  georisques({ totalElements: 2, content: [PLAN_FEYZIN] }, COMMUNE_VIDE);
  const l = await collecter();
  assert.equal(reponsePprt(l), "dans_un_plan");
  const ecran = afficher(l);
  assert.match(ecran, /La base annonce 2 plans à ce point, un seul a pu être lu/);
  assert.match(ecran, /Dans un plan de prévention/);
  assert.doesNotMatch(ecran, AUCUN_PLAN);
});

test("API indisponible au point : non déterminable, la panne n'est jamais une absence", async () => {
  georisques(null, COMMUNE_VIDE);
  const l = await collecter();
  assert.equal(l.pprtPoint.etat, "indisponible");
  assert.equal(reponsePprt(l), "non_determinable");
  const ecran = afficher(l);
  assert.match(ecran, /Non déterminable : la base des plans n'a pas répondu le 31\/10\/2026/);
  assert.doesNotMatch(ecran, AUCUN_PLAN);
});

test("la lecture communale garde son contrôle : une liste communale incomplète n'est jamais lue", async () => {
  georisques({ totalElements: 0, content: [] }, { totalElements: 3, content: [{ idGaspar: "A", libPpr: "Plan A" }] });
  const l = await collecter();
  assert.equal(l.pprtCommune.etat, "indisponible");
  assert.equal(reponsePprt(l), "incomplet");
  assert.doesNotMatch(afficher(l), AUCUN_PLAN);
});

test("les phrases des lectures partielles respectent les interdits de la section", async () => {
  const { texteIndustrieAdresse, PHRASES_INTERDITES } = await import("./industrie-adresse.ts");
  for (const page of [{ totalElements: 3, content: [PLAN_FEYZIN] }, { totalElements: 2, content: [] }]) {
    georisques(page);
    const t = texteIndustrieAdresse(await collecter(), COLLECTE);
    for (const x of [t.constat, ...t.pourCeBien, t.marge.valeur]) assert.doesNotMatch(x, PHRASES_INTERDITES, x);
  }
});
