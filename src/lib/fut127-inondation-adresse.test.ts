import { test, before } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-127 (22/10/2026, engine-7) : L'INONDATION, LUE À L'ADRESSE, SANS FAUSSE ABSENCE NI FAUSSE RÉASSURANCE.
//
// Avant : à Charron, en zone rouge « zones submersibles en aléa très fort », un acheteur qui demandait un
// faible risque d'inondation lisait « Bonne correspondance », et le module Logement « Aucun plan de
// prévention des inondations ne réglemente ce point ». À La Rochelle, le dossier lisait la zone Os1 du
// plan littoral et renvoyait pourtant vers Géorisques en premier contrôle, sous une « exposition de la
// commune ressortant élevée » tirée du seul compte de reconnaissances CatNat.
//
// Ces tests suivent la VRAIE chaîne : l'entrée RÉELLE de l'index, la table GASPAR des plans
// (`data/gaspar-pprn-inondation.json`), les réponses Géorisques RÉELLES relevées le 22/10/2026
// (`__fixtures__/fut127/`), passées par les fonctions de production (`buildRegulatoryPlans`,
// `detailDuPlan`, `deriveLogementCoverage`, `buildLogementFacts`), puis les règles, les compositions,
// l'assemblage, la lecture du Relevé et le rendu des composants de production. Ce qui est simulé : le
// projet du lecteur. Aucun réseau, aucun appel Anthropic.
//
// « La carte apparaît » et « la carte dit vrai » sont deux assertions distinctes (AGENTS.md) : les deux
// sont faites, sur le texte rendu.
// ════════════════════════════════════════════════════════════════════════════════════════════

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

type M = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
let D: M;
let rendreFait: (f: unknown) => string;
let rendreAvertissement: (d: unknown) => string;
let rendreReglementaire: (g: unknown) => string;
let INDEX: Map<string, M>;
let PLANS: M;

before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { createElement, Fragment } = await import("react");
  const { FactBody, EvidenceRow } = await import("../components/report/DecisionFactRenderParts.tsx");
  const { AvertissementInondationAnterieure } = await import("../components/report/AvertissementInondationAnterieure.tsx");
  const { RegulatoryStatusBlock } = await import("../components/report/logement/RegulatorySection.tsx");
  rendreFait = (f) => renderToStaticMarkup(createElement(Fragment, null, createElement(FactBody, { fact: f } as never), createElement(EvidenceRow, { fact: f, color: "var(--info)" } as never)));
  rendreAvertissement = (d) => renderToStaticMarkup(createElement(AvertissementInondationAnterieure, { dossier: d, className: "x" } as never));
  rendreReglementaire = (g) => renderToStaticMarkup(createElement(RegulatoryStatusBlock, { georisques: g, heritage: { items: [], sourceStatus: "ok" } } as never));
  D = {
    ...(await import("./decision/module-facts-map.ts")),
    ...(await import("./decision/materiality-rules.ts")),
    ...(await import("./decision/decision-assembler.ts")),
    ...(await import("./decision/fact-compositions.ts")),
    ...(await import("./decision/logement-facts.ts")),
    ...(await import("./decision/logement-coverage.ts")),
    ...(await import("./decision/conditions.ts")),
    ...(await import("./decision/decision-artifact.ts")),
    ...(await import("./decision/inondation-lecture.ts")),
    ...(await import("./decision/inondation-anterieure.ts")),
    ...(await import("./decision/catnat-evidence.ts")),
    ...(await import("./decision/logement-verifications.ts")),
    ...(await import("./pprn-zonage.ts")),
    ...(await import("./data/gaspar-pprn-inondation.ts")),
    ...(await import("../components/releve/lecture-dossier.ts")),
    ...(await import("./decision/dossier-view.ts")),
    ...(await import("./hard-constraints-hydrate.ts")),
    ...(await import("./hard-constraints.ts")),
    ...(await import("./user-project.ts")),
  };
  const index = JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8"));
  INDEX = new Map(index.communes.map((c: M) => [c.insee, c]));
  PLANS = JSON.parse(readFileSync("data/gaspar-pprn-inondation.json", "utf8"));
});

/** Le texte que lit le lecteur : balises retirées, entités décodées, espaces insécables normalisées. */
function texte(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&apos;/g, "'").replace(/&quot;/g, "\"").replace(/&amp;/g, "&").replace(/&nbsp;| /g, " ")
    .replace(/\s+/g, " ").trim();
}

// ── Les relevés réels, passés par les fonctions de production ─────────────────────────────────
const fixture = (nom: string): M => JSON.parse(readFileSync(`src/lib/__fixtures__/fut127/${nom}.json`, "utf8"));
const DETAILS: Record<string, string> = {
  "17DDTM20100006": "pprn-detail-17DDTM20100006",
  "17DDTM20100014": "pprn-detail-17DDTM20100014",
  "17DDTM20100008": "pprn-detail-17DDTM20100008",
};
/** Les plans d'une réponse v2, complétés par leur détail réel, comme `georisques.ts` le fait. */
function plans(content: unknown, insee: string, avecAleas = true): M[] {
  return D.buildRegulatoryPlans(content).map((p: M) =>
    D.avecDetail(p, avecAleas && p.gasparId && DETAILS[p.gasparId] ? D.detailDuPlan(fixture(DETAILS[p.gasparId]!), insee) : null));
}
type Lieu = "charron" | "lr-duperre" | "lr-minimes" | "lr-palais" | "chatel";
const LIEUX: Record<Lieu, { fichier: string; insee: string }> = {
  charron: { fichier: "charron-num", insee: "17091" },
  "lr-duperre": { fichier: "lr-quai-duperre-num", insee: "17300" },
  "lr-minimes": { fichier: "lr-minimes-num", insee: "17300" },
  "lr-palais": { fichier: "lr-rue-palais", insee: "17300" },
  chatel: { fichier: "chatel-num", insee: "17094" },
};

/** Les résumés Géorisques d'un lieu (point, parcelle), ou leur absence (`muet`). */
function resumes(lieu: Lieu, o: { muet?: boolean; sansAleas?: boolean } = {}) {
  if (o.muet) return { point: null, parcelle: null, repli: false, label: "Adresse sans réponse" };
  const r = fixture(LIEUX[lieu].fichier);
  const insee = LIEUX[lieu].insee;
  const rga = (b: M) => (b.content?.[0] ? { label: b.content[0].exposition } : null);
  return {
    point: { regulatoryPlans: plans(r.v2_pprn_point.body.content, insee, !o.sansAleas), rga: rga(r.v2_rga_point.body) },
    parcelle: r.v2_pprn_parcelle_formatApp
      ? { regulatoryPlans: plans(r.v2_pprn_parcelle_formatApp.body.content, insee, !o.sansAleas), rga: rga(r.v2_rga_parcelle_formatApp.body) }
      : null,
    repli: Boolean(r.cadastre?.repli),
    label: r.adresse.label as string,
  };
}

type Opts = {
  adresse?: Lieu | null; // null = dossier communal
  muet?: boolean;
  intent?: "achat" | "location" | null;
  relation?: M | null;
  poids?: number;
  confirme?: boolean;
};

function dossier(insee: string, o: Opts = {}) {
  const entree = INDEX.get(insee)!;
  const adresse = o.adresse != null;
  const plansInondation = D.plansInondationDeLaCommune(PLANS, insee);
  const base = D.mapCommuneToModuleFacts(entree, {}, { hasAddress: adresse, tailleVille: entree.population, tailleVilleSource: "commune", climat: null, plansInondation });
  let logement: M | undefined;
  if (adresse) {
    const g = resumes(o.adresse!, { muet: o.muet });
    const cov = D.deriveLogementCoverage({
      georisquesAddress: g.point, georisquesParcel: g.parcelle, cavites: [],
      heritage: { items: [], sourceStatus: "ok" }, sinistralite: { secheresse: { kind: "indispo" }, inondation: { kind: "indispo" } },
      parcelleParRepli: g.repli,
    });
    logement = D.buildLogementFacts({ ...cov, fetchedAt: "2026-10-22T00:00:00.000Z" }, null, g.label);
  }
  const facts = {
    ...base, hasAddress: adresse, ...(logement ? { logement } : {}),
    relationAuLieu: o.relation ?? (adresse ? { echelle: "adresse", relation: null } : null),
  };
  let project = D.normalizeUserProject({
    posture: "recherche", intent: o.intent === undefined ? "achat" : o.intent, rawText: "…", updatedAt: "2026-10-22T00:00:00.000Z",
    parsed: { reformulation: "x", hardConstraints: {}, preferences: [{ key: "acces_soins", weight: 2 }, { key: "faible_risque_inondation", weight: o.poids ?? 3 }] },
  });
  if (o.confirme) {
    project = D.normalizeUserProject({ ...project, conditions: [D.buildConfirmation(project, { kind: "preference", key: "faible_risque_inondation" }, "2026-10-22T00:00:00.000Z")] });
  }
  const ctx = {
    constraints: D.hydrateHardConstraints({}, { byName: () => null, plmByName: () => null }),
    point: adresse
      ? { lat: entree.lat, lon: entree.lon, grain: "address", source: "address_geocoder", label: "adresse de test" }
      : { lat: entree.lat, lon: entree.lon, grain: "commune_reference", source: "commune_centroid", label: entree.nom },
    conventionsVersion: D.PRODUCT_CONVENTIONS_VERSION,
  };
  const run = D.runRules(facts, project, ctx);
  const comps = D.composeFacts(run, facts, project);
  const d = D.assembleDossier(run, project, adresse ? "commune+adresse" : "commune", entree.nom, comps, facts.relationAuLieu ?? null);
  return { run, d, facts, project, logement };
}

const carteInondation = (d: M): M | undefined =>
  d.sections.flatMap((s: M) => s.cards).map((c: M) => c.fact).find((f: M) => f && /^territoire\.inondation-/.test(f.ruleId));
const idsVisibles = (d: M): string[] => d.sections.flatMap((s: M) => s.cards.map((c: M) => (c.kind === "fact" ? c.fact.id : c.composition.id)));
const toutLeTexte = (d: M): string => d.sections.flatMap((s: M) => s.cards).map((c: M) => (c.kind === "fact" ? texte(rendreFait(c.fact)) : "")).join(" ¶ ");
const verdict = (d: M) => D.lireDossier(d).verdict;
const gestesPrioritaires = (d: M): string[] => D.lireDossier(d).priorites?.gestes.map((g: M) => g.libelle) ?? [];

// ═══════════════════════════════════ 1. CHARRON : LA FAUSSE RÉASSURANCE ═════════════════════════════

test("Charron, données réelles : zone rouge Rs2 au point et à la parcelle, plan littoral à aléas lus", () => {
  const g = resumes("charron");
  const z = D.zonageInondationDepuisPlans(g.parcelle!.regulatoryPlans);
  assert.equal(z.kind, "zone_inondation", "un plan littoral n'est plus classé étranger à l'inondation");
  assert.deepEqual(z.phenomenes, ["la submersion marine"]);
  const plan = g.parcelle!.regulatoryPlans[0];
  assert.equal(plan.hazardModel, "PPRN-L");
  assert.equal(plan.approvedAt, "2021-08-10");
  assert.equal(D.natureInondation(plan), "inondation");
  assert.equal(INDEX.get("17091")!.inondation.catnat, 3, "le compte CatNat qui rassurait à tort");
});

test("Charron, Dossier Adresse, acheteur : plus de « Bonne correspondance », la zone gouverne", () => {
  const { d, run } = dossier("17091", { adresse: "charron" });
  const v = verdict(d);
  assert.notEqual(v.etiquette, "Bonne correspondance");
  assert.notEqual(v.ton, "positive");
  const f = carteInondation(d)!;
  assert.equal(f.ruleId, "territoire.inondation-exposition");
  assert.equal(f.materialityTier, "decision_critical");
  assert.equal(f.status, "Zone d'interdiction");
  // NIVEAUX 1 ET 2, SUR LA FACE : ce qu'est l'adresse en mots courants, puis ce que cela change pour la
  // priorité. Ni code de zone, ni sigle, ni « régime » dans le constat (passe éditoriale du 23/10).
  assert.equal(f.statement,
    "Cette adresse est dans une zone réglementée pour la submersion marine. Certaines constructions et certains travaux y sont interdits. "
    + "Cela va à l'encontre de votre priorité : un faible risque d'inondation.");
  assert.doesNotMatch(f.statement, /Rs2|PPR|CatNat|régime|zonage/);
  // La ligne de limite empêche le contresens : interdire de construire n'est pas interdire d'habiter.
  assert.match(f.limitation, /il ne rend pas le logement existant inhabitable, mais peut lui imposer des aménagements/);
  const t = texte(rendreFait(f));
  for (const attendu of ["Zone d'interdiction", "Preuve · zone Rs2 · PPR Charron", "Preuve · 3 reconnaissances liées aux inondations depuis 1982"]) {
    assert.ok(t.includes(attendu), `« ${attendu} » absent de : ${t}`);
  }
  // NIVEAU 3, DANS « DONNÉES ET LIMITES » : rien de l'ancienne carte n'a disparu.
  for (const attendu of [
    "cette adresse est classée en zone Rs2 (« ensemble des zones submersibles en alea tres fort a court terme ») par le plan de prévention « PPR Charron », approuvé le 10 août 2021.",
    "Le plan range cette zone sous un régime d'interdiction",
    "Le plan réglemente la submersion marine et le recul du trait de côte.",
    "À l'échelle de la commune, 3 reconnaissances de catastrophe naturelle liées aux inondations depuis 1982.",
    "prépare celle de l'état des risques sans la remplacer",
  ]) assert.ok(f.signalConvention.includes(attendu), `« ${attendu} » absent de : ${f.signalConvention}`);
  // Le geste est ciblé, et le renvoi générique a disparu.
  assert.equal(f.action.label, "Demandez l'état des risques et vérifiez qu'il indique la zone Rs2");
  // Le verdict NOMME la carte (c'est le constat critique) ; la ligne « À contrôler » ne la répète pas
  // (`dejaNommes`, conclusion-plan.ts), et aucun renvoi générique n'y entre.
  assert.equal(v.titre, "Le principal point à contrôler à Charron : la zone réglementée pour l'inondation où se trouve l'adresse.");
  assert.doesNotMatch(gestesPrioritaires(d).join(" "), /Géorisques|ERRIAL/);
  // Une seule carte pour ce plan : « un plan s'applique » se tait, la carte inondation le porte.
  assert.ok(!idsVisibles(d).includes("logement:zone-reglementee"));
  // Jamais une incompatibilité : une préférence n'en produit pas.
  assert.equal(run.facts.some((x: M) => x.role === "incompatibility"), false);
  // Le registre : une réserve critique, plus une préférence « favorable ».
  const c = d.criteria.registry.find((x: M) => x.criterionKey === "faible_risque_inondation");
  assert.equal(c.outcome, "reserve");
  assert.equal(c.maxReserveTier, "decision_critical");
});

test("Charron, sans adresse : la commune couverte par un plan, jamais « non notable » ni favorable", () => {
  const { d } = dossier("17091", { adresse: null });
  assert.notEqual(verdict(d).etiquette, "Bonne correspondance");
  const f = carteInondation(d)!;
  assert.equal(f.ruleId, "territoire.inondation-lecture");
  assert.equal(f.statement, "À Charron, un plan de prévention réglemente certaines zones pour la submersion marine. Selon l'adresse, un bien peut se trouver dans l'une de ces zones, ou en dehors.");
  assert.match(f.limitation, /ils ne disent rien d'une adresse en particulier/);
  assert.match(f.signalConvention, /^À Charron, un plan de prévention des risques littoraux, « PPR Charron », approuvé le 10 août 2021, réglemente la submersion marine\./);
  const c = d.criteria.registry.find((x: M) => x.criterionKey === "faible_risque_inondation");
  assert.notEqual(c.outcome, "favorable");
});

test("Charron, inondation confirmée comme condition : plutôt défavorable à l'adresse, ouverte sans adresse", () => {
  const avec = dossier("17091", { adresse: "charron", confirme: true });
  const k = avec.run.facts.find((f: M) => f.role === "condition_check" && f.criterion.key === "faible_risque_inondation");
  assert.equal(k.signal, "defavorable");
  assert.doesNotMatch(texte(rendreFait(k)), /plutôt favorable|rien de défavorable/);
  const sans = dossier("17091", { adresse: null, confirme: true });
  const k2 = sans.run.facts.find((f: M) => f.role === "condition_check" && f.criterion.key === "faible_risque_inondation");
  assert.equal(k2.signal, "neutre", "un plan communal ne dit pas où est l'adresse");
});

// ═══════════════════════════════════ 1 bis. LA RÉSERVE MAJEURE (arbitrage du 23/10/2026) ═══════════

const ordreDeLecture = (d: M): string[] => D.lireDossier(d).sections.map((s: M) => s.cle);

test("Réserve majeure : l'étiquette dit la zone d'interdiction établie, et le titre nomme l'enjeu", () => {
  for (const o of [{ adresse: "charron" }, { adresse: "charron", intent: "location" }, { adresse: "charron", relation: { echelle: "adresse", relation: "j_y_habite" } }] as Opts[]) {
    const v = verdict(dossier("17091", o).d);
    assert.equal(v.etiquette, "Réserve majeure", JSON.stringify(o));
    assert.equal(v.ton, "caution", "une réserve n'est pas une incompatibilité");
    assert.equal(v.titre, "Le principal point à contrôler à Charron : la zone réglementée pour l'inondation où se trouve l'adresse.");
    // Jamais une impossibilité d'habiter, ni dans le verdict ni dans la carte qu'il nomme.
    const tout = `${v.titre} ${v.detail ?? ""} ${toutLeTexte(dossier("17091", o).d)}`;
    assert.doesNotMatch(tout, /interdit d'habiter|ne peut pas être habité|impossible d'y vivre|logement inhabitable/);
    assert.match(tout, /il ne rend pas le logement existant inhabitable/);
  }
});

test("Réserve majeure, strictement : ni l'incertitude, ni la donnée manquante, ni la divergence point / parcelle", () => {
  const cas: [string, string, Opts][] = [
    ["divergence Châtelaillon (une des lectures interdit)", "17094", { adresse: "chatel" }],
    ["risque concerné à confirmer (Quai Duperré)", "17300", { adresse: "lr-duperre" }],
    ["rattachement de repli (Minimes)", "17300", { adresse: "lr-minimes" }],
    ["Géorisques muet", "17300", { adresse: "lr-duperre", muet: true }],
    ["dossier communal", "17091", { adresse: null }],
    ["hors zone", "17300", { adresse: "lr-palais" }],
  ];
  for (const [nom, insee, o] of cas) {
    const { d } = dossier(insee, o);
    assert.notEqual(verdict(d).etiquette, "Réserve majeure", nom);
    assert.equal(carteInondation(d)?.materialityTier === "decision_critical", false, nom);
  }
  // La condition confirmée garde son propre verdict (FUT-7) : « Condition ouverte », plutôt défavorable.
  assert.equal(verdict(dossier("17091", { adresse: "charron", confirme: true }).d).etiquette, "Condition ouverte");
});

test("Réserve majeure avec une priorité favorable : la zone rouge passe avant, la correspondance reste visible", () => {
  // Le relevé réel de Charron (zone rouge Rs2) lu sur une commune où l'accès aux soins est favorable.
  const { d } = dossier("17300", { adresse: "charron" });
  assert.equal(verdict(d).etiquette, "Réserve majeure");
  assert.match(verdict(d).detail ?? "", /Par ailleurs, l'accès aux soins répond bien à votre projet\./, "la balance reste dite");
  assert.deepEqual(ordreDeLecture(d), ["verifications", "alignments"], "le Relevé lit la réserve d'abord");
  assert.deepEqual(D.sectionsDeLaMinute(d).map((s: M) => s.key), ["verifications", "alignments"], "la présentation classique aussi");
  assert.equal(D.sectionsDeLaMinute(d)[0].cards[0].fact.ruleId, "territoire.inondation-exposition", "et la carte inondation ouvre les contrôles");
  // Le dossier complet garde aussi la correspondance, juste après.
  assert.ok(d.sections.some((s: M) => s.key === "alignments" && s.cards.length > 0));
});

test("Sans réserve décisive, l'ordre des sections ne change pas : les correspondances ouvrent toujours", () => {
  for (const [insee, o] of [["17300", { adresse: "lr-duperre" }], ["17094", { adresse: "chatel" }], ["17300", { adresse: null }], ["17300", { adresse: "lr-palais" }]] as [string, Opts][]) {
    const { d } = dossier(insee, o);
    assert.equal(d.sections[0].key, "alignments", JSON.stringify(o));
    assert.equal(ordreDeLecture(d)[0], "alignments", JSON.stringify(o));
  }
});

// ═══════════════════════════════════ 2. LA ROCHELLE : LE RENVOI GÉNÉRIQUE ═══════════════════════════

test("La Rochelle, dossier communal : des faits datés à la place de « l'exposition ressort élevée »", () => {
  const { d } = dossier("17300", { adresse: null });
  const t = toutLeTexte(d);
  assert.doesNotMatch(t, /ressort élevée|exposition de la commune/);
  assert.doesNotMatch(t, /submersion marine exclue/);
  assert.match(t, /À La Rochelle, un plan de prévention réglemente certaines zones pour la submersion marine\./);
  assert.match(t, /Preuve · PPR La Rochelle, approuvé le 26 février 2019/);
  assert.match(t, /Preuve · 7 reconnaissances liées aux inondations depuis 1982/);
  const sc = carteInondation(d)!.signalConvention as string;
  assert.match(sc, /À La Rochelle, un plan de prévention des risques littoraux, « PPR La Rochelle », approuvé le 26 février 2019, réglemente la submersion marine\./);
  assert.match(sc, /n'indique ni la probabilité d'une inondation, ni la part du territoire exposée/);
  assert.doesNotMatch(gestesPrioritaires(d).join(" "), /Consultez l'état des risques \(Géorisques\)/);
});

test("La Rochelle, Quai Duperré : la zone Os1 est dite, son phénomène reste à confirmer (plan littoral à deux aléas)", () => {
  const { d } = dossier("17300", { adresse: "lr-duperre" });
  const f = carteInondation(d)!;
  // Le plan réglemente la submersion ET le recul du trait de côte ; le nom de la zone ne dit pas lequel
  // fonde Os1 : la lecture est prudente, non orientante, et jamais favorable.
  assert.equal(f.ruleId, "territoire.inondation-lecture");
  assert.equal(f.status, "Risque concerné à confirmer");
  assert.equal(f.materialityTier, "structuring");
  const t = texte(rendreFait(f));
  assert.ok(t.includes("Cette adresse est dans une zone d'un plan qui réglemente la submersion marine et le recul du trait de côte, sans que la donnée dise lequel de ces risques la concerne. Certaines constructions et certains travaux y sont interdits."), t);
  assert.ok(t.includes("Tant que ce point n'est pas éclairci, rien ne permet de dire que cette adresse répond à votre priorité : un faible risque d'inondation."), t);
  assert.ok(t.includes("Preuve · zone Os1 · PPR La Rochelle"), t);
  assert.ok(f.signalConvention.includes("Cette adresse est classée en zone Os1 par le plan de prévention « PPR La Rochelle », approuvé le 26 février 2019, qui réglemente la submersion marine et le recul du trait de côte."), f.signalConvention);
  assert.ok(f.signalConvention.includes("La donnée reçue ne dit pas lequel de ces phénomènes fonde cette zone."));
  assert.ok(f.signalConvention.includes("Le plan range cette zone sous un régime d'interdiction"));
  assert.equal(f.action.label, "Demandez l'état des risques et vérifiez la zone du bien");
  assert.doesNotMatch(gestesPrioritaires(d).join(" "), /Géorisques/);
  assert.notEqual(verdict(d).etiquette, "Bonne correspondance");
});

test("La Rochelle, Minimes : point en Bs1, parcelle de repli en Bs2, futur•e ne tranche pas", () => {
  const { d, logement } = dossier("17300", { adresse: "lr-minimes" });
  assert.equal(logement!.zonageInondation.rattachement, "ambigu");
  assert.equal(logement!.zonageInondation.parcelleParRepli, true);
  const f = carteInondation(d)!;
  assert.equal(f.status, "Zone à confirmer");
  assert.match(f.statement, /^Les données ne désignent pas la même zone pour cette adresse\. Tant que la zone du bien n'est pas confirmée, rien ne permet de dire/);
  assert.match(f.signalConvention, /le point géocodé de l'adresse tombe en zone Bs1, la parcelle cadastrale rattachée en zone Bs2/);
  assert.match(f.signalConvention, /futur•e ne tranche pas entre les deux lectures/);
});

test("La Rochelle, rue du Palais : hors zone, dit sans rassurer, et sans conclusion favorable", () => {
  const { d, run } = dossier("17300", { adresse: "lr-palais" });
  const f = carteInondation(d)!;
  assert.equal(f.status, "Hors zone inondation réglementée");
  assert.equal(f.materialityTier, "secondary");
  assert.equal(f.statement, "Cette adresse n'est dans aucune zone réglementée pour l'inondation.");
  assert.match(f.limitation, /^Ce n'est pas une garantie : un plan ne couvre que les phénomènes qu'il a étudiés/);
  assert.match(f.signalConvention, /La commune est couverte par le plan « PPR La Rochelle » : son zonage ne classe pas cette adresse/);
  const outcomes = run.evaluations.filter((e: M) => e.projectKeys.includes("faible_risque_inondation")).map((e: M) => e.outcome);
  assert.equal(outcomes.includes("satisfied"), false);
  assert.ok(outcomes.includes("neutral"));
});

// ═══════════════════════════════════ 3. CHÂTELAILLON : POINT ET PARCELLE ═════════════════════════════

test("Châtelaillon, 10 bd de la Mer : rouge Rs3 au point, orange Os à la parcelle, la divergence est dite", () => {
  const { d, logement } = dossier("17094", { adresse: "chatel" });
  const z = logement!.zonageInondation;
  assert.equal(z.etat, "zone");
  assert.equal(z.rattachement, "ambigu");
  assert.deepEqual(z.divergence, { point: "zone Rs3", parcelle: "zone Os", regimePoint: "03", regimeParcelle: "03" });
  const f = carteInondation(d)!;
  assert.equal(f.ruleId, "territoire.inondation-lecture", "un rattachement ambigu n'oriente pas");
  // Simplifier n'atténue pas : le premier niveau dit qu'une des deux lectures interdit des constructions.
  assert.match(f.statement, /^Les données ne désignent pas la même zone pour cette adresse, et l'une des deux interdit certaines constructions et certains travaux\./);
  assert.match(f.signalConvention, /tombe en zone Rs3, la parcelle cadastrale rattachée en zone Os/);
  assert.notEqual(f.materialityTier, "decision_critical");
});

// ═══════════════════════════════════ 4. DONNÉES MANQUANTES ═════════════════════════════════════════

test("Géorisques muet : l'adresse n'est pas lue, la commune l'est, le renvoi officiel devient la réponse", () => {
  const { d } = dossier("17300", { adresse: "lr-duperre", muet: true });
  const f = carteInondation(d)!;
  assert.equal(f.ruleId, "territoire.inondation-lecture");
  assert.match(f.statement, /^La zone de cette adresse n'a pas pu être lue : le service de l'État n'a pas répondu\./);
  assert.match(f.statement, /Avant de vous engager, vérifiez dans quelle zone se trouve le bien\.$/);
  assert.equal(f.action.label, "Demandez l'état des risques du bien : il indique sa zone");
  assert.match(f.action.detail, /Mes risques/);
  // L'inconnue de la source reste nommée à côté : jamais « aucun plan ».
  assert.ok(idsVisibles(d).includes("logement:zone-reglementee:unknown"));
  assert.doesNotMatch(toutLeTexte(d), /Aucun plan de prévention des inondations/);
});

test("Aléas du plan non lus (panne du détail, rapport antérieur) : jamais « aucun plan des inondations »", () => {
  // La Rochelle sans aléas : PPRN-L et une zone dont le nom ne dit pas le phénomène → aléa inconnu.
  const lr = resumes("lr-duperre", { sansAleas: true });
  const zlr = D.zonageInondationDepuisPlans(lr.parcelle!.regulatoryPlans);
  assert.equal(zlr.kind, "zonage_alea_inconnu");
  const l = D.construireLectureInondation({ zonage: zlr, catnat: D.catnatInondationDepuisCompte(7, "17300"), onrn: { kind: "aucun" } });
  const lignes = l.groupes.flatMap((g: M) => g.lignes).join(" ");
  assert.doesNotMatch(lignes, /Aucun plan de prévention des inondations/);
  assert.match(lignes, /sans que la donnée dise si cette zone concerne l'inondation/);
  // Charron sans aléas : le nom de la zone (« zones submersibles ») suffit.
  const ch = resumes("charron", { sansAleas: true });
  assert.equal(D.zonageInondationDepuisPlans(ch.parcelle!.regulatoryPlans).kind, "zone_inondation");
});

test("Aucun modèle de plan opposable de l'export GASPAR ne produit plus de fausse absence", () => {
  // Pour chaque modèle connu, un plan SANS aléas lus et sans indice dans son nom ou sa zone : la lecture
  // dit « inondation » ou « inconnue » pour tous ceux qui peuvent porter l'inondation, « autre » seulement
  // pour ceux qui ne le peuvent pas.
  const attendu: Record<string, string> = {
    "PPRN-I": "inondation", "PPRN-SM": "inondation", "PPRN-L": "inconnue", "PPRN-Multi": "inconnue",
    "PPRN-Mvt": "autre", "PPRN-RGA": "autre", "PPRN-IF": "autre", "PPRN-S": "autre", "PPRN-Av": "autre",
  };
  for (const [modele, nature] of Object.entries(attendu)) {
    assert.equal(D.natureInondation({ plan: "Plan témoin", hazardModel: modele, zones: [{ zoneName: "Zone R" }] }), nature, modele);
  }
});

// ═══════════════════════════════════ 5. LES PROJETS DU LECTEUR ═════════════════════════════════════

test("Les postures : acheteur, futur locataire, habitant du bien, sans intention", () => {
  const geste = (o: Opts) => carteInondation(dossier("17091", { adresse: "charron", ...o }).d)!.action;
  assert.match(geste({ intent: "achat" }).label, /^Demandez l'état des risques et vérifiez qu'il indique la zone Rs2$/);
  const loc = geste({ intent: "location" });
  assert.match(loc.label, /^Demandez au bailleur l'état des risques et vérifiez la zone Rs2$/);
  assert.doesNotMatch(`${loc.label} ${loc.detail}`, /ERRIAL|préparer/);
  const vit = geste({ intent: null, relation: { echelle: "adresse", relation: "lives_here" } });
  assert.match(vit.label, /^Retrouvez l'état des risques remis à l'achat ou au bail$/);
  const neutre = geste({ intent: null });
  assert.match(neutre.label, /^Comparez la zone Rs2 à l'état des risques du bien$/);
});

test("Poids 1 (secondaire) : la zone n'est pas matérialisée, et rien de favorable n'est fabriqué", () => {
  const { run } = dossier("17091", { adresse: "charron", poids: 1 });
  const ev = run.evaluations.find((e: M) => e.ruleId === "territoire.inondation-exposition");
  assert.equal(ev.outcome, "not_surfaced");
  assert.equal(run.evaluations.some((e: M) => e.projectKeys.includes("faible_risque_inondation") && e.outcome === "satisfied"), false);
});

test("Sans priorité inondation déclarée : la carte « plan applicable » reste, et dit zone et régime", () => {
  const entree = INDEX.get("17091")!;
  void entree;
  const { d } = dossier("17091", { adresse: "charron", poids: 0 });
  const ppr = d.sections.flatMap((s: M) => s.cards).map((c: M) => c.fact).find((f: M) => f?.id === "logement:zone-reglementee");
  assert.ok(ppr, "la carte du module Logement porte seule le plan");
  assert.equal(ppr.statement, "À cette adresse, un plan de prévention des risques s'applique : PPR Charron, zone Rs2 (zone d'interdiction).");
  assert.equal(carteInondation(d), undefined);
});

test("La liste « à vérifier » du module Logement garde le geste réglementaire, priorité déclarée ou non", () => {
  const { logement, project } = dossier("17091", { adresse: "charron" });
  const points = D.pointsAVerifier(logement, project, null);
  assert.ok(points.some((p: M) => p.id === "logement.zone-reglementee"), JSON.stringify(points));
});

// ═══════════════════════════════════ 6. DEUX PRÉSENTATIONS, UNE LECTURE ════════════════════════════

test("Parité : la présentation classique et le Relevé disent la même chose de l'inondation", () => {
  for (const [insee, o] of [["17091", { adresse: "charron" }], ["17300", { adresse: "lr-duperre" }], ["17300", { adresse: null }], ["17094", { adresse: "chatel" }]] as const) {
    const { d } = dossier(insee, o as Opts);
    const f = carteInondation(d)!;
    const lecture = D.lireDossier(d);
    const entree = lecture.sections.flatMap((s: M) => s.entrees).find((e: M) => e.ancre.endsWith(f.id.replace(/[^a-z0-9]+/gi, "-").toLowerCase()) || e.enonce === f.statement);
    assert.ok(entree, `${insee} : la carte est dans le Relevé`);
    assert.equal(entree.enonce, f.statement, `${insee} : même constat`);
    assert.equal(entree.geste?.libelle, f.action.label, `${insee} : même geste`);
    assert.equal(entree.nuance, f.limitation, `${insee} : même limite`);
    assert.ok(texte(rendreFait(f)).includes(f.statement.slice(0, 60)), `${insee} : rendu classique`);
  }
});

// ═══════════════════════════════════ 7. LE MODULE LOGEMENT ═════════════════════════════════════════

test("Module Logement, bloc réglementaire : risque concerné, approbation, vrai grain, portée de la lecture", () => {
  const g = resumes("charron");
  const t = texte(rendreReglementaire({ parcel: g.parcelle, address: g.point, commune: null }));
  assert.match(t, /PPR Charron · risque concerné : la submersion marine, le recul du trait de côte/);
  assert.match(t, /approuvé le 10 août 2021/);
  assert.match(t, /Grain : parcelle cadastrale rattachée à l'adresse/);
  assert.doesNotMatch(t, /pas à la géométrie de la parcelle/);
  assert.match(t, /prépare celle de l'état des risques sans la remplacer/);
});

// ═══════════════════════════════════ 8. LES ANALYSES ENREGISTRÉES ══════════════════════════════════

/** Un artefact figé avant FUT-127, tel qu'un dossier engine-6 l'a vendu : on ne fait qu'y relire. */
function artefactAncien(motif: "exposition_elevee" | "frequence_faible") {
  const { d, project } = dossier("17300", { adresse: null });
  const ancien = JSON.parse(JSON.stringify(d)) as M;
  if (motif === "exposition_elevee") {
    const carte = ancien.sections.flatMap((s: M) => s.cards).find((c: M) => c.kind === "fact" && c.fact.ruleId === "territoire.inondation-lecture");
    carte.fact.ruleId = "territoire.inondation-exposition";
    carte.fact.statement = "L'exposition de la commune à l'inondation ressort élevée. Consultez l'état des risques avant de vous engager. La commune a connu 7 reconnaissances de catastrophe naturelle liées aux inondations depuis 1982 (comptage administratif, pas une probabilité).";
  } else {
    const c = ancien.criteria.registry.find((x: M) => x.criterionKey === "faible_risque_inondation");
    c.outcome = "favorable";
    c.ruleIds = ["territoire.inondation-exposition"];
  }
  const a = D.buildDecisionArtifact(ancien, project, "2026-10-01T10:00:00.000Z", D.PRODUCT_CONVENTIONS_VERSION);
  return { ...a, engineVersion: "engine-6" };
}

test("Analyse figée « exposition élevée » : relue telle quelle, et contextualisée visiblement", () => {
  const a = artefactAncien("exposition_elevee");
  const relu = D.parseDecisionArtifact(JSON.parse(JSON.stringify(a)));
  assert.ok(relu);
  assert.equal(relu.engineVersion, "engine-6");
  assert.deepEqual(relu.dossier, a.dossier, "rien n'est réécrit");
  assert.match(toutLeTexte(relu.dossier), /ressort élevée/, "l'ancienne phrase reste lisible, telle qu'elle a été remise");
  const avert = texte(rendreAvertissement(relu.dossier));
  // Ce que le lecteur doit retenir d'abord, puis pourquoi, puis ce qui lui reste remis.
  assert.match(avert, /^Cette analyse date d'une version antérieure de futur•e : sa lecture des inondations n'est plus celle que nous appliquons\./);
  assert.match(avert, /nombre de catastrophes naturelles reconnues, qui retrace des indemnisations et ne mesure pas le risque/);
  assert.match(avert, /L'analyse ci-dessous reste celle qui vous a été remise\.$/);
  assert.match(rendreAvertissement(relu.dossier), /data-fut127="lecture-inondation-anterieure:exposition_elevee"/);
});

test("Analyse figée qui jugeait la priorité favorable sur un faible compte : contextualisée aussi", () => {
  const a = artefactAncien("frequence_faible");
  const relu = D.parseDecisionArtifact(JSON.parse(JSON.stringify(a)));
  assert.equal(relu.dossier.criteria.registry.find((x: M) => x.criterionKey === "faible_risque_inondation").outcome, "favorable");
  const avert = texte(rendreAvertissement(relu.dossier));
  assert.match(avert, /satisfaite parce que la commune comptait peu de catastrophes naturelles reconnues, ce qui ne démontre pas un faible risque/);
});

test("Analyse courante (engine-7) et analyses figées sans inondation : aucun avertissement", () => {
  for (const o of [{ adresse: "charron" }, { adresse: null }, { adresse: "lr-palais" }] as Opts[]) {
    const { d } = dossier(o.adresse ? LIEUX[o.adresse].insee : "17091", o);
    assert.equal(D.lectureInondationAnterieure(d), null);
    assert.equal(rendreAvertissement(d), "");
  }
  const anciens = JSON.parse(readFileSync("src/lib/__fixtures__/fut17-artefacts-avant.json", "utf8"));
  for (const [cle, a] of Object.entries(anciens)) {
    if (cle === "_note") continue;
    const brut = (a as M).artefact;
    const relu = D.parseDecisionArtifact(brut);
    assert.ok(relu, cle);
    assert.deepEqual(relu.dossier, brut.dossier, `${cle} : relu à l'identique`);
    assert.equal(D.lectureInondationAnterieure(relu.dossier), null, cle);
  }
});

test("Le moteur courant est engine-8 (engine-7 depuis FUT-127, engine-8 depuis FUT-167)", () => {
  assert.equal(D.ENGINE_VERSION, "engine-8");
});
