// FUT-127 · DIAGNOSTIC DU MOTEUR, LECTURE SEULE. Aucun réseau, aucun appel Anthropic, aucune écriture
// hors de ce dossier d'audit.
//
// Lancer depuis la racine du dépôt :
//   node docs/audits/2026-10-22-fut127-risques-naturels/diagnostic-moteur.mts
//
// Ce que ce script rejoue : la VRAIE chaîne de production (mapCommuneToModuleFacts sur l'entrée RÉELLE
// de l'index, runRules, composeFacts, assembleDossier, lireDossier du Relevé, et le rendu des cartes par
// les composants de production), sur des projets construits pour l'audit.
//
// Ce qui est SIMULÉ, et dit comme tel : le projet du lecteur (priorités, intention), et les faits
// logement. Ces derniers sont construits par les fonctions de production (`buildRegulatoryPlans`,
// `deriveLogementCoverage`, `buildLogementFacts`) à partir des réponses Géorisques RÉELLES relevées le
// 22/10/2026 et archivées dans `releves-georisques/` (aucune donnée inventée pour le zonage).
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import path from "node:path";

const racine = pathToFileURL(`${process.cwd()}/`).href;
const ICI = path.join(process.cwd(), "docs/audits/2026-10-22-fut127-risques-naturels");
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
register(`data:text/javascript,${encodeURIComponent(hook)}`);

type M = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const imp = (p: string) => import(pathToFileURL(path.join(process.cwd(), p)).href);
const { renderToStaticMarkup } = await import("react-dom/server");
const { createElement, Fragment } = await import("react");
const { FactCompositionCard } = await imp("src/components/report/FactCompositionCard.tsx");
const { FactBody, EvidenceRow } = await imp("src/components/report/DecisionFactRenderParts.tsx");
const D: M = {
  ...(await imp("src/lib/decision/module-facts-map.ts")),
  ...(await imp("src/lib/decision/materiality-rules.ts")),
  ...(await imp("src/lib/decision/decision-assembler.ts")),
  ...(await imp("src/lib/decision/fact-compositions.ts")),
  ...(await imp("src/lib/decision/logement-facts.ts")),
  ...(await imp("src/lib/decision/logement-coverage.ts")),
  ...(await imp("src/lib/decision/conditions.ts")),
  ...(await imp("src/lib/decision/inondation-lecture.ts")),
  ...(await imp("src/lib/decision/catnat-evidence.ts")),
  ...(await imp("src/lib/pprn-zonage.ts")),
  ...(await imp("src/lib/onrn-sinistralite.ts")),
  ...(await imp("src/components/releve/lecture-dossier.ts")),
  ...(await imp("src/lib/hard-constraints-hydrate.ts")),
  ...(await imp("src/lib/user-project.ts")),
};

const texte = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&#x27;|&apos;/g, "'").replace(/&quot;/g, "\"")
  .replace(/&amp;/g, "&").replace(/&nbsp;| /g, " ").replace(/\s+/g, " ").trim();
const rendreFait = (f: unknown) => texte(renderToStaticMarkup(createElement(Fragment, null,
  createElement(FactBody, { fact: f } as never), createElement(EvidenceRow, { fact: f, color: "var(--info)" } as never))))
  + ((f as M).action?.detail ? ` [détail du geste : ${(f as M).action.detail}]` : "") + ((f as M).limitation ? ` [limite : ${(f as M).limitation}]` : "");
const rendreCompo = (c: M, abs: unknown[]) => texte(renderToStaticMarkup(createElement(FactCompositionCard, { composition: c, color: "var(--info)", absorbedFacts: abs } as never)));

// ── L'index RÉEL ───────────────────────────────────────────────────────────────────────────────
const index = JSON.parse(gunzipSync(readFileSync(path.join(process.cwd(), "data/comparateur-index.json.gz"))).toString("utf8"));
const entree = (insee: string) => index.communes.find((c: M) => c.insee === insee);

// ── Les relevés Géorisques RÉELS (22/10/2026) → résumés tels que georisques.ts les construit ─────
const releve = (cle: string) => JSON.parse(readFileSync(path.join(ICI, "releves-georisques", `${cle}.json`), "utf8"));
function resumes(cle: string) {
  const r = releve(cle);
  const point = { regulatoryPlans: D.buildRegulatoryPlans(r.v2_pprn_point.body.content), rga: r.v2_rga_point.body.content?.[0] ? { label: r.v2_rga_point.body.content[0].exposition } : null };
  const parc = r.v2_pprn_parcelle_formatApp
    ? { regulatoryPlans: D.buildRegulatoryPlans(r.v2_pprn_parcelle_formatApp.body.content), rga: r.v2_rga_parcelle_formatApp.body.content?.[0] ? { label: r.v2_rga_parcelle_formatApp.body.content[0].exposition } : null }
    : null;
  return { point, parc, label: r.adresse.label };
}

type Cas = {
  cle: string; insee: string; intent: "achat" | "location" | null; relation?: M | null;
  inondation?: number; confirme?: boolean;
  logement?: { releve: string } | { georisques: "muet" } | null;
  note: string;
};

async function dossier(c: Cas) {
  const e = entree(c.insee);
  const adresse = c.logement != null;
  const base = D.mapCommuneToModuleFacts(e, {}, { hasAddress: adresse, tailleVille: e.population, tailleVilleSource: "commune", climat: null });
  let logement: M | undefined;
  let lectureModule: M | null = null;
  let resumeGeo: M | null = null;
  if (adresse) {
    const sini = await D.getOnrnSinistralite(c.insee);
    let gAddr = null, gParc = null, label = "Adresse témoin";
    if ("releve" in c.logement!) {
      const r = resumes(c.logement.releve);
      gAddr = r.point; gParc = r.parc; label = r.label;
    }
    const cov = D.deriveLogementCoverage({ georisquesAddress: gAddr, georisquesParcel: gParc, cavites: [], heritage: { items: [], sourceStatus: "ok" }, sinistralite: sini });
    logement = D.buildLogementFacts({ ...cov, fetchedAt: "2026-10-22T00:00:00.000Z" }, null, label);
    // La lecture inondation du MODULE Logement, telle que LogementModule.tsx la compose.
    const g = gParc ?? gAddr;
    lectureModule = D.construireLectureInondation({
      zonage: D.zonageInondationDepuisPlans(g ? (g.regulatoryPlans ?? []) : null),
      catnat: D.catnatInondationDepuisIndex(e),
      onrn: sini?.inondation ?? { kind: "indispo" },
    });
    resumeGeo = { point: gAddr?.regulatoryPlans, parcelle: gParc?.regulatoryPlans, zonageLu: D.zonageInondationDepuisPlans(g ? (g.regulatoryPlans ?? []) : null) };
  }
  const facts = { ...base, hasAddress: adresse, ...(logement ? { logement } : {}), ...(c.relation ? { relationAuLieu: c.relation } : adresse ? { relationAuLieu: { echelle: "adresse", relation: null } } : {}) };
  let project = D.normalizeUserProject({
    posture: "recherche", intent: c.intent, rawText: "…", updatedAt: "2026-10-22T00:00:00.000Z",
    parsed: { reformulation: "audit FUT-127", hardConstraints: {}, preferences: [{ key: "acces_soins", weight: 2 }, { key: "faible_risque_inondation", weight: c.inondation ?? 3 }] },
  });
  if (c.confirme) project = D.normalizeUserProject({ ...project, conditions: [D.buildConfirmation(project, { kind: "preference", key: "faible_risque_inondation" }, "2026-10-22T00:00:00.000Z")] });
  const ctx = {
    constraints: D.hydrateHardConstraints({}, { byName: () => null, plmByName: () => null }),
    point: adresse ? { lat: e.lat, lon: e.lon, grain: "address", source: "address_geocoder", label: "adresse d'audit" } : { lat: e.lat, lon: e.lon, grain: "commune_reference", source: "commune_centroid", label: e.nom },
    conventionsVersion: D.PRODUCT_CONVENTIONS_VERSION,
  };
  const run = D.runRules(facts, project, ctx);
  const comps = D.composeFacts(run, facts, project);
  const d = D.assembleDossier(run, project, adresse ? "commune+adresse" : "commune", e.nom, comps, null);
  const lecture = D.lireDossier(d);
  const evalInond = run.evaluations.find((x: M) => x.ruleId === "territoire.inondation-exposition");
  const evalPpr = run.evaluations.find((x: M) => x.ruleId === "logement.zone-reglementee");
  const cartes = d.sections.flatMap((s: M) => s.cards.map((k: M) => ({ section: s.key, id: k.kind === "fact" ? k.fact.id : k.composition.id,
    texte: k.kind === "fact" ? rendreFait(k.fact) : rendreCompo(k.composition, d.absorbedFacts.filter((f: M) => k.composition.absorbedFactIds.includes(f.id))) })));
  const pertinentes = cartes.filter((k: M) => /inondation|logement:zone-reglementee|condition:faible_risque_inondation|logement:sinistralite/.test(k.id));
  return {
    cas: c.cle, note: c.note, commune: `${e.nom} (${e.insee})`, indexInondation: e.inondation,
    issueRegleInondation: evalInond ? `${evalInond.outcome} (${evalInond.reason})` : null,
    issueReglePpr: evalPpr ? `${evalPpr.outcome} (${evalPpr.reason})` : null,
    verdict: `${lecture.verdict.etiquette} · ${lecture.verdict.titre}`,
    priorites: lecture.priorites,
    condition: run.facts.filter((f: M) => f.id?.includes("condition:faible_risque_inondation")).map((f: M) => ({ signal: f.signal, texte: rendreFait(f) })),
    cartes: pertinentes,
    geo: resumeGeo,
    lectureInondationModule: lectureModule ? { groupes: lectureModule.groupes, pourquoi: lectureModule.pourquoi } : null,
  };
}

const CAS: Cas[] = [
  { cle: "A1", insee: "17300", intent: "achat", logement: null, note: "La Rochelle, dossier communal, acheteur, priorité inondation (poids 3)" },
  { cle: "A2", insee: "17300", intent: null, logement: null, note: "La Rochelle, dossier communal, sans intention (voix neutre)" },
  { cle: "A3", insee: "17300", intent: null, relation: { echelle: "commune", relation: "current_residence", origine: "confirmed_by_user" }, logement: null, note: "La Rochelle, dossier communal, habitant" },
  { cle: "A4", insee: "17300", intent: "location", logement: null, note: "La Rochelle, dossier communal, futur locataire" },
  { cle: "B1", insee: "17300", intent: "achat", logement: { releve: "lr-quai-duperre-num" }, note: "La Rochelle, Dossier Adresse, Quai Duperré (zone orange Os1 du PPR littoral, relevé réel)" },
  { cle: "B2", insee: "17300", intent: "achat", logement: { releve: "lr-rue-palais" }, note: "La Rochelle, Dossier Adresse, 12 rue du Palais (hors zone réglementée, relevé réel)" },
  { cle: "B3", insee: "17300", intent: "location", logement: { releve: "lr-minimes-num" }, note: "La Rochelle, Dossier Adresse, locataire, zone bleue Bs (relevé réel)" },
  { cle: "C1", insee: "17091", intent: "achat", logement: null, note: "Charron, dossier communal (3 reconnaissances inondation : rang 52)" },
  { cle: "C2", insee: "17091", intent: "achat", logement: { releve: "charron-num" }, note: "Charron, Dossier Adresse, zone ROUGE Rs2 « submersible aléa très fort » (relevé réel)" },
  { cle: "C3", insee: "17091", intent: "achat", confirme: true, logement: { releve: "charron-num" }, note: "Charron, Dossier Adresse, inondation CONFIRMÉE comme condition" },
  { cle: "C4", insee: "17094", intent: "achat", logement: { releve: "chatel-num" }, note: "Châtelaillon, 10 bd de la Mer : rouge Rs3 au point, orange Os à la parcelle (relevé réel)" },
  { cle: "D1", insee: "17300", intent: "achat", logement: { georisques: "muet" }, note: "La Rochelle, Dossier Adresse, Géorisques sans réponse (point et parcelle)" },
];

const out: M[] = [];
for (const c of CAS) out.push(await dossier(c));
writeFileSync(path.join(ICI, "diagnostic-moteur.sortie.json"), JSON.stringify(out, null, 1));
for (const o of out) {
  console.log(`\n══ ${o.cas} · ${o.note}`);
  console.log(`   index : ${JSON.stringify(o.indexInondation)} | règle inondation : ${o.issueRegleInondation} | règle PPR : ${o.issueReglePpr}`);
  console.log(`   verdict : ${o.verdict}`);
  if (o.priorites) console.log(`   ${o.priorites.titre} : ${o.priorites.gestes.map((g: M) => g.libelle).join(" | ")}`);
  for (const k of o.condition) console.log(`   CONDITION [${k.signal}] ${k.texte.slice(0, 600)}`);
  for (const k of o.cartes) console.log(`   CARTE ${k.id} [${k.section}] ${k.texte.slice(0, 700)}`);
  if (o.geo) console.log(`   zonage lu par le module : ${JSON.stringify(o.geo.zonageLu)}`);
  if (o.lectureInondationModule) console.log(`   LECTURE INONDATION DU MODULE : ${JSON.stringify(o.lectureInondationModule.groupes)}`);
}
