import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseIsochrone } from "../isochrone.ts";
import { HARD_CONSTRAINT_RULES } from "./hard-constraint-rules.ts";
import { assertFactValid } from "./materiality-rules.ts";
import { toCommuneAttributes } from "./module-facts-map.ts";
import type { ModuleFacts, HardEvaluation } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import {
  assessHardConstraints, PRODUCT_CONVENTIONS_VERSION,
  type EvaluationContext, type NormalizedHardConstraints,
} from "../hard-constraints.ts";
import type { ResolvedPlaceReference, ResolvedSizeReference, ResolvedUrbanAreaReference } from "../hard-constraints-resolve.ts";

function facts(over: Partial<ModuleFacts> = {}): ModuleFacts {
  return {
    insee: "31555", nom: "Toulouse", dept: "31", lat: 43.6045, lon: 1.4442, uu: "31701",
    tailleVille: 1_060_000, reliefProximite: 0, distanceCoteKm: 150, population: 493_465, altitude: 146,
    catnatInondation: 0, inondationRisque: 10, scores: {}, hasAddress: false, ...over,
  };
}
function project(hardConstraints: unknown): UserProject {
  return {
    posture: "recherche", intent: null, rawText: null,
    parsed: { reformulation: "x", hardConstraints, preferences: [] } as UserProject["parsed"],
    updatedAt: "1970-01-01T00:00:00.000Z",
  };
}

function normalized(over: Partial<NormalizedHardConstraints> = {}): NormalizedHardConstraints {
  return {
    departements: null, zones: null, excludeZones: null, montagne: false, reliefProche: false,
    nearSea: null, excludeSea: false, communeSize: null, nearPlace: null, excludePlace: [],
    sizeRelativeTo: null, ...over,
  };
}

// Le 3e argument est une HardEvaluation : les 11 assessments DÉJÀ calculés (runRules le fait une fois).
function hard(over: Partial<NormalizedHardConstraints> = {}, f = facts(), grain: "commune_reference" | "address" = "commune_reference"): HardEvaluation {
  const context: EvaluationContext = {
    constraints: normalized(over),
    point: f.lat != null && f.lon != null
      ? {
          lat: f.lat, lon: f.lon, grain,
          source: grain === "address" ? "address_geocoder" : "commune_centroid",
          label: grain === "address" ? "7 rue du Taur, Toulouse" : f.nom,
        }
      : null,
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };
  const list = assessHardConstraints(context, toCommuneAttributes(f));
  return { context, byKey: Object.fromEntries(list.map((a) => [a.key, a])) as HardEvaluation["byKey"] };
}

const rule = (key: string) => HARD_CONSTRAINT_RULES.find((r) => r.hardConstraint === key)!;

const META = { inputHash: "h", resolverVersion: "resolve-1" };
const BREST_REF: ResolvedPlaceReference = {
  status: "resolved", originalLabel: "Brest", canonicalLabel: "Brest", kind: "commune",
  lat: 48.39, lon: -4.48, source: "commune_index", sourceId: "29019", confidence: "exact", meta: META,
};

test("une règle par contrainte dure : 11", () => {
  assert.equal(HARD_CONSTRAINT_RULES.length, 11);
});

test("not_declared -> not_applicable (le critère n'est pas déclaré, ce n'est pas un trou)", () => {
  const e = rule("departements").evaluate(facts(), project({}), hard());
  assert.equal(e.outcome, "not_applicable");
  assert.deepEqual(e.projectKeys, ["departements"]);
  assert.equal(e.facts.length, 0);
});

test("satisfied -> satisfied, SILENCIEUX (aucun fait), et la couverture monte", () => {
  const e = rule("departements").evaluate(facts(), project({ departements: ["31"] }), hard({ departements: ["31"] }));
  assert.equal(e.outcome, "satisfied");
  assert.equal(e.facts.length, 0);
});

test("incompatible -> incompatible + un IncompatibilityFact complet", () => {
  const e = rule("departements").evaluate(facts(), project({ departements: ["33"] }), hard({ departements: ["33"] }));
  assert.equal(e.outcome, "incompatible");
  const f = e.facts[0]!;
  assert.ok(f.role === "incompatibility");
  assert.equal(f.hardConstraintKey, "departements");
  assert.equal(f.evidenceStrength, "established");
  assert.equal(f.materialityTier, "decision_critical");
  assert.equal(f.topic, "le département de Toulouse");
  assert.equal(f.evidence[0]!.observedValue, "département 31");
});

test("unexamined -> uncertain : le critère reste NON EXAMINÉ, et le couperet mord", () => {
  const e = rule("nearSea").evaluate(facts(), project({ nearSea: { active: true } }), hard({ nearSea: { threshold: null } }));
  assert.equal(e.outcome, "uncertain");
  assert.equal(e.facts.length, 0);
});

test("la provenance n'est PAS amputée : chaque clé d'observation devient une preuve", () => {
  const e = rule("communeSize").evaluate(
    facts(), project({ communeSize: { max: 25_000 } }), hard({ communeSize: { min: null, max: 25_000 } }),
  );
  const f = e.facts[0]!;
  assert.ok(f.role === "incompatibility");
  // sourceFactIds porte TOUTE la provenance (observation + déclaration) ; evidence habille les
  // observations. Aucun sourceFactId d'observation ne reste sans preuve.
  assert.ok(f.sourceFactIds.includes("commune.tailleVille"));
  assert.ok(f.sourceFactIds.includes("project.hardConstraints.communeSize"));
  assert.ok(f.evidence.some((ev) => ev.factId === "commune.tailleVille"));
});

test("le GRAIN suit le point réellement testé : une mesure depuis l'adresse n'est pas communale", () => {
  const f = facts();
  const h = hard(
    { nearPlace: { label: "Brest", threshold: { metric: "distance", maxKm: 50, source: "user" }, reference: BREST_REF, reachability: null } },
    f,
    "address",
  );
  const e = rule("nearPlace").evaluate(f, project({ nearPlace: { label: "Brest", maxKm: 50 } }), h);
  const fact = e.facts[0]!;
  assert.ok(fact.role === "incompatibility");
  assert.equal(fact.evidence[0]!.grain, "adresse");
  assert.match(fact.statement, /Cette adresse/);
});

test("LES 11 INCOMPATIBILITÉS PASSENT assertFactValid, même avec un nom de commune très long", () => {
  // Les topics ont une limite dure (70 caractères, aucune ponctuation de phrase). Un topic construit sur
  // le nom de la commune ET sur celui d'un lieu de référence peut la dépasser sans qu'aucun test de
  // l'évaluateur ne s'en aperçoive : c'est ici que ça doit tomber, pas en production.
  const nom = "Saint-Rémy-en-Bouzemont-Saint-Genest-et-Isson";
  const bordeaux: ResolvedSizeReference = {
    status: "resolved", originalLabel: "Bordeaux", canonicalLabel: "Bordeaux", urbanUnitCode: "33701",
    comparisonPopulation: 1_000_000, populationYear: 2021, populationKind: "urban_unit",
    source: "commune_index", meta: META,
  };
  const selfUU: ResolvedUrbanAreaReference = {
    status: "resolved", originalLabel: nom, canonicalLabel: nom, referenceCommuneInsee: "51000",
    urbanUnitCode: "51701", normalizedTerritoryCode: "uu:51701", source: "commune_index", meta: META,
  };

  const cas: { key: string; hc: unknown; over: Partial<NormalizedHardConstraints>; f: ModuleFacts }[] = [
    { key: "departements", hc: { departements: ["33"] }, over: { departements: ["33"] }, f: facts({ nom, dept: "51" }) },
    { key: "zones", hc: { zones: [{ zone: "bretagne", strength: "hard" }] },
      over: { zones: { hardDepartements: new Set(["29"]), labels: ["la Bretagne"], unresolvedLabels: [] } }, f: facts({ nom, dept: "51" }) },
    { key: "excludeZones", hc: { excludeZones: ["grand_est"] },
      over: { excludeZones: { departements: new Set(["51"]), labels: ["le Grand Est"], unresolvedLabels: [] } }, f: facts({ nom, dept: "51" }) },
    { key: "montagne", hc: { montagne: { strength: "hard" } }, over: { montagne: true }, f: facts({ nom, altitude: 100 }) },
    { key: "reliefProche", hc: { reliefProche: { strength: "hard" } }, over: { reliefProche: true }, f: facts({ nom, reliefProximite: 0 }) },
    { key: "nearSea", hc: { nearSea: { active: true, maxKm: 10 } },
      over: { nearSea: { threshold: { metric: "distance", maxKm: 10, source: "user" } } }, f: facts({ nom, distanceCoteKm: 200 }) },
    { key: "excludeSea", hc: { excludeSea: true }, over: { excludeSea: true }, f: facts({ nom, distanceCoteKm: 4 }) },
    { key: "communeSize", hc: { communeSize: { min: 100_000 } }, over: { communeSize: { min: 100_000, max: null } }, f: facts({ nom, tailleVille: 500 }) },
    { key: "nearPlace", hc: { nearPlace: { label: "Brest", maxKm: 5 } },
      over: { nearPlace: { label: "Brest", threshold: { metric: "distance", maxKm: 5, source: "user" }, reference: BREST_REF, reachability: null } }, f: facts({ nom }) },
    { key: "excludePlace", hc: { excludePlace: [{ label: nom }] },
      over: { excludePlace: [{ label: nom, reference: selfUU }] }, f: facts({ nom, uu: "51701" }) },
    { key: "sizeRelativeTo", hc: { sizeRelativeTo: { label: "Bordeaux", direction: "larger" } },
      over: { sizeRelativeTo: { label: "Bordeaux", direction: "larger", reference: bordeaux } }, f: facts({ nom, tailleVille: 500 }) },
  ];

  for (const c of cas) {
    const e = rule(c.key).evaluate(c.f, project(c.hc), hard(c.over, c.f));
    assert.equal(e.outcome, "incompatible", `${c.key} devrait être incompatible dans ce montage`);
    for (const f of e.facts) assertFactValid(f, project(c.hc)); // JETTE si le topic déborde
  }
});

// ── LOT 2a : LE DOSSIER, sur la VRAIE isochrone IGN (30 min en voiture depuis la gare Matabiau) ────
// Le lot branche les DEUX moteurs. Vérifier le seul comparateur laisserait la moitié du chantier sans
// preuve, et c'est précisément ici que se voit l'apport du moteur partagé : le CHANGEMENT DE GRAIN.

const ISO_REELLE = parseIsochrone(
  JSON.parse(readFileSync(new URL("../__fixtures__/isochrone-matabiau-30min-car.json", import.meta.url), "utf8")),
)!;
const GARE_REF: ResolvedPlaceReference = {
  status: "resolved", originalLabel: "la gare Matabiau", canonicalLabel: "Gare Matabiau",
  kind: "station", lat: 43.611448, lon: 1.453496, source: "geoplateforme_poi",
  sourceId: "EQ_RESEA0000000073015866", confidence: "high",
  meta: { inputHash: "h", resolverVersion: "resolve-2" },
};
const TRENTE_MIN: Partial<NormalizedHardConstraints> = {
  nearPlace: {
    label: "la gare Matabiau",
    threshold: { metric: "travel_time", maxMinutes: 30, mode: "car", direction: "to_reference", source: "user" },
    reference: GARE_REF,
    reachability: { status: "ready", geometry: ISO_REELLE, toleranceMeters: 300 },
  },
};
const PROJET_30MIN = { nearPlace: { label: "la gare Matabiau", maxMinutes: 30, mode: "car" } };

test("DOSSIER, commune DANS l'isochrone : satisfied, la couverture monte, aucune carte", () => {
  const blagnac = facts({ insee: "31069", nom: "Blagnac", lat: 43.6294, lon: 1.3897 });
  const e = rule("nearPlace").evaluate(blagnac, project(PROJET_30MIN), hard(TRENTE_MIN, blagnac));
  assert.equal(e.outcome, "satisfied");
  assert.equal(e.facts.length, 0); // une contrainte respectée est silencieuse : elle ne fabrique pas de carte
});

test("DOSSIER, commune HORS de l'isochrone : incompatible, et la phrase ne parle JAMAIS de kilomètres", () => {
  // Auch est à 1 h 15 de route : dehors, et sans discussion possible.
  const auch = facts({ insee: "32013", nom: "Auch", lat: 43.6465, lon: 0.5861, uu: null, tailleVille: 21_000 });
  const e = rule("nearPlace").evaluate(auch, project(PROJET_30MIN), hard(TRENTE_MIN, auch));
  assert.equal(e.outcome, "incompatible");
  const f = e.facts[0]!;
  assert.equal(f.role, "incompatibility");
  assert.match(f.statement, /30 minutes en voiture/);
  assert.match(f.statement, /Gare Matabiau/);
  assert.doesNotMatch(f.statement, /km/); // un temps ne se convertit jamais en distance
  assertFactValid(f, project(PROJET_30MIN));
});

test("DOSSIER, LE CHANGEMENT DE GRAIN : le centre communal est dedans, l'ADRESSE est dehors", () => {
  // Ce n'est pas une divergence de moteur : c'est le POINT D'ÉVALUATION qui change. Une commune peut
  // passer avec son centroïde et échouer pour une adresse posée hors de l'isochrone, et le texte doit le
  // porter (« Cette adresse », jamais « le point de référence de »).
  const blagnac = facts({ insee: "31069", nom: "Blagnac", lat: 43.6294, lon: 1.3897, uu: null, tailleVille: 25_000 });
  const parLeCentre = rule("nearPlace").evaluate(blagnac, project(PROJET_30MIN), hard(TRENTE_MIN, blagnac));
  assert.equal(parLeCentre.outcome, "satisfied");

  // Le lecteur a renseigné une adresse, et elle tombe hors de l'isochrone.
  const adresse = facts({ ...blagnac, lat: 43.95, lon: 1.05, hasAddress: true });
  const parLAdresse = rule("nearPlace").evaluate(adresse, project(PROJET_30MIN), hard(TRENTE_MIN, adresse, "address"));
  assert.equal(parLAdresse.outcome, "incompatible");
  assert.match(parLAdresse.facts[0]!.statement, /^Cette adresse/);
  assert.equal(parLAdresse.facts[0]!.evidence[0]!.grain, "adresse");
});

test("DOSSIER, point dans la BANDE DE TOLÉRANCE : uncertain, le critère reste NON EXAMINÉ", () => {
  // Une incompatibilité ne se décide pas sur quelques mètres de simplification de la géométrie. Le dossier
  // ne conclut donc pas : il dit qu'il n'a pas pu trancher, et le couperet de la couverture mord.
  const iso = ISO_REELLE.type === "Polygon" ? ISO_REELLE.coordinates[0]! : [];
  const surLaFrontiere = iso[0]!; // un sommet du polygone : le point est EXACTEMENT sur la frontière
  const commune = facts({
    insee: "31000", nom: "Commune frontière", lat: surLaFrontiere[1]!, lon: surLaFrontiere[0]!,
    uu: null, tailleVille: 6_000,
  });
  const e = rule("nearPlace").evaluate(commune, project(PROJET_30MIN), hard(TRENTE_MIN, commune));
  assert.equal(e.outcome, "uncertain");
});
