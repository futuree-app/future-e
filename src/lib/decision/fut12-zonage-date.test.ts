// FUT-12 · CORRECTIF APRÈS LE NO GO DE LA CONTRE-REVUE (08/11/2026).
//
// LE DÉFAUT. La preuve du zonage inondation recevait la date de `plansLus` (parcelle d'abord, sinon
// point), alors que le zonage se choisit à part : une parcelle qui répond sans plan laisse la zone au
// point. Point lu le 4 novembre (zone trouvée), parcelle lue le 6 (aucun plan) : la preuve disait
// « consultée le 6 novembre » pour une zone lue le 4. Une preuve semblait vérifiée plus récemment
// qu'elle ne l'avait été.
//
// CE QUE CES TESTS VÉRIFIENT : la provenance PORTÉE PAR L'EvidenceRef du dossier (pas un champ
// intermédiaire), cas par cas, et que rien d'autre que cette date ne bouge.
import test from "node:test";
import assert from "node:assert/strict";
import { deriveLogementCoverage, type LogementCoverageInputs } from "./logement-coverage.ts";
import { buildLogementFacts } from "./logement-facts.ts";
import { runRules, RULE_INOND, RULE_INOND_LECTURE } from "./materiality-rules.ts";
import { mapCommuneToModuleFacts } from "./module-facts-map.ts";
import { lignesDeSource } from "./provenance-preuve.ts";
import { hydrateHardConstraints } from "../hard-constraints-hydrate.ts";
import { PRODUCT_CONVENTIONS_VERSION, type EvaluationContext } from "../hard-constraints.ts";
import { normalizeUserProject, type UserProject } from "../user-project.ts";
import type { RegulatoryPlan } from "../pprn-zonage.ts";
import type { IndexCommune } from "../comparateur-vie.ts";
import type { DecisionFact, EvidenceRef, ModuleFacts, RunResult } from "./decision-fact.ts";

const LE_4 = "2026-11-04T09:12:00.000Z";
const LE_6 = "2026-11-06T10:00:00.000Z";

// ── Fixtures ─────────────────────────────────────────────────────────────────────────────────

function planInondation(zoneCode: string, regimeCode = "03"): RegulatoryPlan {
  return {
    gasparId: "17DDTM20100006", plan: "PPRI de test", hazardModel: "PPRN-I", zoneRegExists: true, updatedAt: null,
    zones: [{ regimeCode, regime: regimeCode === "03" ? "Interdiction" : "Prescriptions", zoneCode, zoneName: `Zone ${zoneCode}` }],
    topRegimeRank: 0, aleas: [{ famille: "Inondation", sousAleas: ["Par une crue à débordement lent de cours d'eau"] }], approvedAt: "2019-02-26",
  };
}
/** Un plan littoral sans aléas lus : la donnée ne dit pas s'il porte sur l'inondation. */
const PLAN_LITTORAL: RegulatoryPlan = {
  gasparId: "17DDTM20100099", plan: "PPR littoral de test", hazardModel: "PPRN-L", zoneRegExists: true, updatedAt: null,
  zones: [{ regimeCode: "02", regime: "Prescriptions", zoneCode: "B1", zoneName: "Zone bleue B1" }],
  topRegimeRank: 1, aleas: null, approvedAt: "2015-06-01",
};
/** Un plan étranger à l'inondation : la parcelle répond AVEC un plan, mais sans zonage inondation. */
const PLAN_ARGILES: RegulatoryPlan = {
  gasparId: "17DDTM20100077", plan: "PPR retrait-gonflement des argiles", hazardModel: "PPRN-RGA", zoneRegExists: true, updatedAt: null,
  zones: [{ regimeCode: "02", regime: "Prescriptions", zoneCode: "G1", zoneName: "Zone G1" }],
  topRegimeRank: 1, aleas: [{ famille: "Mouvement de terrain", sousAleas: ["Tassements différentiels"] }], approvedAt: "2008-03-14",
};

type Lecture = { plans: RegulatoryPlan[]; consultedAt?: string } | null;
const resume = (l: Lecture) => (l ? { regulatoryPlans: l.plans, rga: null, ...(l.consultedAt ? { consultedAt: l.consultedAt } : {}) } : null);

function couverture(point: Lecture, parcelle: Lecture, over: Partial<LogementCoverageInputs> = {}) {
  return deriveLogementCoverage({
    georisquesAddress: resume(point), georisquesParcel: resume(parcelle),
    cavites: [], heritage: { items: [], sourceStatus: "ok" }, sinistralite: null, ...over,
  });
}

const ENTRY = { insee: "17300", nom: "La Rochelle", dept: "17", region: "Nouvelle-Aquitaine", lat: 46.16, lon: -1.15, population: 75000, densite: 2900, mer_centre_km: 1, altitude: 10, clim: {}, pct: {}, rankBands: {}, inondation: { risque: 52, catnat: 3 } } as unknown as IndexCommune;
const PROJET: UserProject = normalizeUserProject({
  posture: "recherche", intent: "achat", rawText: "…", updatedAt: "2026-09-01T00:00:00.000Z",
  parsed: { reformulation: "x", hardConstraints: {}, preferences: [{ key: "faible_risque_inondation", weight: 3 }] },
})!;
const CTX: EvaluationContext = {
  constraints: hydrateHardConstraints({}, { byName: () => null, plmByName: () => null }),
  point: { lat: 46.16, lon: -1.15, grain: "address", source: "address_geocoder", label: "1 rue du Test, La Rochelle" },
  conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
};

/** LE MÊME ENCHAÎNEMENT que le dossier d'adresse : couverture, faits Logement, règles. */
function moteur(cov: ReturnType<typeof couverture>): RunResult {
  const logement = buildLogementFacts({ ...cov, fetchedAt: "2026-11-08T00:00:00.000Z" }, null, "1 rue du Test");
  const base = mapCommuneToModuleFacts(ENTRY, {}, { hasAddress: true, tailleVille: 75000, tailleVilleSource: "commune" });
  const mf: ModuleFacts = { ...base, hasAddress: true, logement };
  return runRules(mf, PROJET, CTX);
}

const refs = (f: DecisionFact): EvidenceRef[] => (f.role === "compromise" ? f.sides.flatMap((s) => s.evidence) : f.evidence);
/** La preuve du zonage telle que le dossier la porte, avec le fait qui la porte. */
function preuveDuZonage(run: RunResult): { fait: DecisionFact; preuve: EvidenceRef } {
  for (const fait of run.facts) {
    const preuve = refs(fait).find((e) => e.factId === "logement.zonage-inondation");
    if (preuve) return { fait, preuve };
  }
  assert.fail("aucune preuve logement.zonage-inondation dans le dossier");
}

/** Le dossier sans aucune date de consultation : ce qui doit rester identique, au caractère près. */
function sansConsultation(run: RunResult): unknown {
  const nettoie = (e: EvidenceRef) => {
    if (!e.provenance) return e;
    const { consultedAt: _c, ...reste } = e.provenance;
    void _c;
    return { ...e, provenance: reste };
  };
  return JSON.parse(JSON.stringify({
    facts: run.facts.map((f) => (f.role === "compromise"
      ? { ...f, sides: f.sides.map((s) => ({ ...s, evidence: s.evidence.map(nettoie) })) }
      : { ...f, evidence: f.evidence.map(nettoie) })),
    outcomes: run.evaluations.map((e) => [e.ruleId, e.outcome, e.reason]),
  }));
}

// ── 1. Le scénario exact du NO GO ────────────────────────────────────────────────────────────

test("NO GO · zone lue au point le 4, parcelle lue le 6 sans plan : la preuve dit le 4 novembre", () => {
  const cov = couverture({ plans: [planInondation("R1")], consultedAt: LE_4 }, { plans: [], consultedAt: LE_6 });
  assert.equal(cov.zonageInondation.etat, "zone");
  assert.equal(cov.zonageInondation.etat === "zone" && cov.zonageInondation.grain, "point");
  const { fait, preuve } = preuveDuZonage(moteur(cov));
  assert.equal(preuve.provenance?.consultedAt, LE_4);
  const ligne = lignesDeSource([preuve])[0]!;
  assert.match(ligne, /Source consultée le 4 novembre 2026/);
  assert.doesNotMatch(ligne, /6 novembre/);
  // L'ambiguïté que le moteur signalait (point en zone, parcelle hors zone) reste entière.
  assert.equal(fait.ruleId, RULE_INOND_LECTURE);
  assert.equal(fait.role === "verification" && fait.status, "Zone à confirmer");
  assert.equal(cov.zonageInondation.etat === "zone" && cov.zonageInondation.rattachement, "ambigu");
});

// ── 2. Les cas voisins ───────────────────────────────────────────────────────────────────────

test("parcelle retenue, lue AVANT le point : la date est celle de la parcelle, même plus ancienne", () => {
  const cov = couverture({ plans: [planInondation("R1")], consultedAt: LE_6 }, { plans: [planInondation("R1")], consultedAt: LE_4 });
  assert.equal(cov.zonageInondation.etat === "zone" && cov.zonageInondation.grain, "parcelle");
  const { fait, preuve } = preuveDuZonage(moteur(cov));
  assert.equal(fait.ruleId, RULE_INOND, "point et parcelle concordent : zone établie");
  assert.equal(preuve.provenance?.consultedAt, LE_4);
});

test("point retenu alors que la parcelle répond avec un plan sans rapport avec l'inondation", () => {
  const cov = couverture({ plans: [planInondation("R1")], consultedAt: LE_4 }, { plans: [PLAN_ARGILES], consultedAt: LE_6 });
  assert.equal(cov.zonageInondation.etat === "zone" && cov.zonageInondation.grain, "point");
  assert.equal(preuveDuZonage(moteur(cov)).preuve.provenance?.consultedAt, LE_4);
});

test("une seule lecture : sa date, et aucune autre", () => {
  const auPoint = couverture({ plans: [planInondation("R1")], consultedAt: LE_4 }, null);
  assert.equal(preuveDuZonage(moteur(auPoint)).preuve.provenance?.consultedAt, LE_4);
  const aLaParcelle = couverture(null, { plans: [planInondation("R1")], consultedAt: LE_6 });
  assert.equal(preuveDuZonage(moteur(aLaParcelle)).preuve.provenance?.consultedAt, LE_6);
});

test("date inconnue pour la lecture retenue : aucune date, sans repli sur l'autre lecture", () => {
  const cov = couverture({ plans: [planInondation("R1")] }, { plans: [], consultedAt: LE_6 });
  assert.equal(cov.consultations?.zonage, undefined);
  assert.equal(cov.consultations?.pprn, LE_6, "la liste des plans, elle, vient de la parcelle datée");
  const { preuve } = preuveDuZonage(moteur(cov));
  assert.equal(preuve.provenance?.consultedAt, undefined);
  assert.doesNotMatch(lignesDeSource([preuve]).join(" "), /consultée/);
});

test("divergence point/parcelle : date de la parcelle retenue, et l'ambiguïté reste signalée", () => {
  const cov = couverture({ plans: [planInondation("R1")], consultedAt: LE_4 }, { plans: [planInondation("B2", "02")], consultedAt: LE_6 });
  const z = cov.zonageInondation;
  assert.equal(z.etat, "zone");
  assert.equal(z.etat === "zone" && z.grain, "parcelle");
  assert.equal(z.etat === "zone" && z.rattachement, "ambigu");
  assert.ok(z.etat === "zone" && z.divergence);
  const { fait, preuve } = preuveDuZonage(moteur(cov));
  assert.equal(fait.ruleId, RULE_INOND_LECTURE, "une lecture ambiguë ne devient pas une zone établie");
  assert.equal(preuve.provenance?.consultedAt, LE_6);
});

test("aléa inconnu : la date est celle de la lecture qui a fourni le plan (point ou parcelle)", () => {
  // Plan au point seulement, parcelle sans plan : le plan vient du point.
  const duPoint = couverture({ plans: [PLAN_LITTORAL], consultedAt: LE_4 }, { plans: [], consultedAt: LE_6 });
  assert.equal(duPoint.zonageInondation.etat, "alea_inconnu");
  assert.equal(preuveDuZonage(moteur(duPoint)).preuve.provenance?.consultedAt, LE_4);
  // Plan aux deux lectures : la parcelle prime, comme dans le choix du zonage.
  const deLaParcelle = couverture({ plans: [PLAN_LITTORAL], consultedAt: LE_6 }, { plans: [PLAN_LITTORAL], consultedAt: LE_4 });
  assert.equal(deLaParcelle.zonageInondation.etat, "alea_inconnu");
  assert.equal(preuveDuZonage(moteur(deLaParcelle)).preuve.provenance?.consultedAt, LE_4);
});

test("aléa inconnu : le libellé de la preuve nomme la lecture qui a fourni le plan", () => {
  const GASPAR = /, (à la parcelle cadastrale|au point géocodé)$/;
  // Le point fournit le plan ; la parcelle répond, sans plan puis avec un plan étranger à l'inondation.
  for (const parcelle of [{ plans: [], consultedAt: LE_6 }, { plans: [PLAN_ARGILES], consultedAt: LE_6 }]) {
    const cov = couverture({ plans: [PLAN_LITTORAL], consultedAt: LE_4 }, parcelle);
    assert.equal(cov.zonageInondation.etat, "alea_inconnu");
    assert.equal(cov.zonageInondation.etat === "alea_inconnu" && cov.zonageInondation.zone.plan, "PPR littoral de test");
    const { fait, preuve } = preuveDuZonage(moteur(cov));
    assert.equal(preuve.label.match(GASPAR)?.[1], "au point géocodé");
    assert.equal(preuve.provenance?.consultedAt, LE_4);
    assert.equal(fait.role === "verification" && fait.status, "Risque concerné à confirmer");
  }
  // La parcelle fournit le plan : « à la parcelle cadastrale », à sa date.
  const cov = couverture({ plans: [], consultedAt: LE_6 }, { plans: [PLAN_LITTORAL], consultedAt: LE_4 });
  assert.equal(cov.zonageInondation.etat, "alea_inconnu");
  const { preuve } = preuveDuZonage(moteur(cov));
  assert.equal(preuve.label.match(GASPAR)?.[1], "à la parcelle cadastrale");
  assert.equal(preuve.provenance?.consultedAt, LE_4);
});

test("zonage hors zone ou indisponible : aucune date de zonage n'est posée", () => {
  const hors = couverture({ plans: [], consultedAt: LE_4 }, { plans: [PLAN_ARGILES], consultedAt: LE_6 });
  assert.equal(hors.zonageInondation.etat, "hors_zone");
  assert.equal(hors.consultations?.zonage, undefined);
  const muet = couverture(null, null);
  assert.equal(muet.zonageInondation.etat, "indisponible");
  assert.equal(muet.consultations?.zonage, undefined);
  // Le hors zone garde sa preuve (« aucune zone d'un plan inondation »), sans date de consultation,
  // comme avant ce correctif ; l'indisponible n'a pas de preuve à l'adresse.
  for (const cov of [hors, muet]) {
    const preuves = moteur(cov).facts.flatMap((f) => refs(f)).filter((e) => e.factId === "logement.zonage-inondation");
    assert.equal(preuves.some((e) => e.provenance?.consultedAt), false);
  }
});

// ── 3. Ce qui ne doit pas bouger ─────────────────────────────────────────────────────────────

test("les autres preuves PPRN gardent la date de la lecture qui a fourni la liste des plans", () => {
  // Parcelle lue le 6 avec un plan (argiles), zone inondation au point lue le 4.
  const cov = couverture({ plans: [planInondation("R1")], consultedAt: LE_4 }, { plans: [PLAN_ARGILES], consultedAt: LE_6 });
  assert.equal(cov.consultations?.pprn, LE_6);
  assert.equal(cov.consultations?.zonage, LE_4);
  const run = moteur(cov);
  const planApplicable = run.facts.find((f) => f.ruleId === "logement.zone-reglementee");
  assert.ok(planApplicable, "la carte « plan applicable » doit exister");
  const preuve = refs(planApplicable!).find((e) => e.targetKey === "housing.regulated_zone")!;
  assert.equal(preuve.provenance?.consultedAt, LE_6);
});

test("zonage, régimes, verdicts et textes identiques : seule la date de consultation change", () => {
  const cas: [Lecture, Lecture][] = [
    [{ plans: [planInondation("R1")], consultedAt: LE_4 }, { plans: [], consultedAt: LE_6 }],
    [{ plans: [planInondation("R1")], consultedAt: LE_6 }, { plans: [planInondation("R1")], consultedAt: LE_4 }],
    [{ plans: [planInondation("R1")], consultedAt: LE_4 }, { plans: [planInondation("B2", "02")], consultedAt: LE_6 }],
    [{ plans: [PLAN_LITTORAL], consultedAt: LE_4 }, { plans: [], consultedAt: LE_6 }],
  ];
  for (const [point, parcelle] of cas) {
    const date = moteur(couverture(point, parcelle));
    const sansDate = moteur(couverture(point && { plans: point.plans }, parcelle && { plans: parcelle.plans }));
    assert.deepEqual(couverture(point, parcelle).zonageInondation, couverture(point && { plans: point.plans }, parcelle && { plans: parcelle.plans }).zonageInondation);
    assert.deepEqual(sansConsultation(date), sansConsultation(sansDate));
  }
});
