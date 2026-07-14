import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateDepartements, evaluateZones, evaluateExcludeZones,
  evaluateMontagne, evaluateReliefProche, montagnosite,
  evaluateNearSea, evaluateExcludeSea, evaluateCommuneSize,
  evaluateNearPlace, evaluateExcludePlace, evaluateSizeRelativeTo,
  assessHardConstraints, HARD_CONSTRAINT_KEYS, HARD_CONSTRAINT_EVALUATORS, PRODUCT_CONVENTIONS_VERSION,
  type CommuneAttributes, type EvaluationContext, type NormalizedHardConstraints,
  type EvaluationPoint, type PlaceMode, type ReachabilityState, type TravelTimeEstimate,
} from "./hard-constraints.ts";
import type { PolygonGeometry } from "./geo-polygon.ts";
import type {
  ResolvedPlaceReference, ResolvedUrbanAreaReference, ResolvedSizeReference,
} from "./hard-constraints-resolve.ts";

export function commune(over: Partial<CommuneAttributes> = {}): CommuneAttributes {
  return {
    insee: "31555", nom: "Toulouse", dept: "31",
    lat: 43.6045, lon: 1.4442,
    population: 493_465, tailleVille: 1_060_000, uu: "31701",
    altitude: 146, reliefProximite: 0, distanceCoteKm: 150,
    ...over,
  };
}

export function normalized(over: Partial<NormalizedHardConstraints> = {}): NormalizedHardConstraints {
  return {
    departements: null, zones: null, excludeZones: null,
    montagne: false, reliefProche: false,
    nearSea: null, excludeSea: false, communeSize: null,
    nearPlace: null, excludePlace: [], sizeRelativeTo: null,
    ...over,
  };
}

export function ctx(over: Partial<NormalizedHardConstraints> = {}, c = commune()): EvaluationContext {
  // Le point est NULLABLE. Une commune sans coordonnées ne se replie pas sur (0, 0) : ce point est dans
  // le golfe de Guinée, et nearPlace en tirerait une incompatibilité ÉTABLIE sur une donnée inventée.
  const point =
    c.lat != null && c.lon != null
      ? {
          lat: c.lat, lon: c.lon,
          grain: "commune_reference" as const,
          source: "commune_centroid" as const,
          label: `le point de référence de ${c.nom}`,
        }
      : null;
  return { constraints: normalized(over), point, conventionsVersion: "hc-conv-1" };
}

const META = { inputHash: "h", resolverVersion: "resolve-1" };
const BREST_REF: ResolvedPlaceReference = {
  status: "resolved", originalLabel: "Brest", canonicalLabel: "Brest", kind: "commune",
  lat: 48.39, lon: -4.48, source: "commune_index", sourceId: "29019", confidence: "exact", meta: META,
};
const MATABIAU_REF: ResolvedPlaceReference = {
  status: "unresolved", originalLabel: "Gare Matabiau", reason: "no_result", meta: META,
};
const LYON_UU: ResolvedUrbanAreaReference = {
  status: "resolved", originalLabel: "Lyon", canonicalLabel: "Lyon", referenceCommuneInsee: "69123",
  urbanUnitCode: "00760", normalizedTerritoryCode: "uu:00760", source: "plm_table", meta: META,
};
const INCONNUE_UU: ResolvedUrbanAreaReference = {
  status: "unresolved", originalLabel: "Saint-Jean-de-Machin", reason: "no_result", meta: META,
};

// ── departements ─────────────────────────────────────────────────────────────

test("departements : non déclaré -> not_declared (jamais unexamined)", () => {
  const a = evaluateDepartements(ctx(), commune());
  assert.equal(a.status, "not_declared");
  assert.equal(a.key, "departements");
});

test("departements : dans la liste -> satisfied, avec la valeur observée structurée", () => {
  const a = evaluateDepartements(ctx({ departements: ["31", "81"] }), commune());
  assert.ok(a.status === "satisfied");
  assert.deepEqual(a.observedValue, { kind: "department", value: "31" });
  assert.deepEqual(a.expectedValue, { kind: "departments", value: ["31", "81"] });
  assert.ok(a.evidenceKeys.includes("commune.dept"));
});

test("departements : hors liste -> incompatible, statement qui NOMME la commune et le topic", () => {
  const a = evaluateDepartements(ctx({ departements: ["33"] }), commune());
  assert.ok(a.status === "incompatible");
  assert.match(a.statement, /département 31/);
  assert.match(a.statement, /33/);
  assert.equal(a.topic, "le département de Toulouse");
});

test("departements : dept absent -> unexamined(missing_data), JAMAIS incompatible", () => {
  const a = evaluateDepartements(ctx({ departements: ["31"] }), commune({ dept: null }));
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "missing_data");
});

// ── zones / excludeZones (contraintes COMPOSITES) ────────────────────────────

const zone = (depts: string[], labels: string[], unresolvedLabels: string[] = []) => ({
  hardDepartements: new Set(depts), labels, unresolvedLabels,
});
const exZone = (depts: string[], labels: string[], unresolvedLabels: string[] = []) => ({
  departements: new Set(depts), labels, unresolvedLabels,
});

test("zones : non déclarée -> not_declared", () => {
  assert.equal(evaluateZones(ctx(), commune()).status, "not_declared");
});

test("zones : le département est dans le périmètre dur -> satisfied", () => {
  assert.equal(evaluateZones(ctx({ zones: zone(["31", "81"], ["le Sud-Ouest"]) }), commune()).status, "satisfied");
});

test("zones : hors du périmètre dur -> incompatible, et le périmètre est NOMMÉ", () => {
  const a = evaluateZones(ctx({ zones: zone(["29", "22"], ["la Bretagne"]) }), commune());
  assert.ok(a.status === "incompatible");
  assert.match(a.statement, /Bretagne/);
  assert.equal(a.topic, "la situation géographique de Toulouse");
});

test("zones : dept absent -> unexamined(missing_data)", () => {
  const a = evaluateZones(ctx({ zones: zone(["31"], ["le Sud-Ouest"]) }), commune({ dept: null }));
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "missing_data");
});

test("zones : DANS le périmètre résolu, mais une ancre dure N'A PAS été reconnue -> unexamined", () => {
  // Les ancres dures s'INTERSECTENT : celle qu'on n'a pas su résoudre ne pourrait que RÉTRÉCIR le
  // périmètre. Dire « satisfied » sur un périmètre incomplet, c'est affirmer une condition qu'on n'a
  // pas testée : le périmètre calculé est plus LARGE que le vrai, il ne prouve pas l'appartenance.
  const a = evaluateZones(ctx({ zones: zone(["31", "81"], ["le Sud-Ouest"], ["massif_inconnu"]) }), commune());
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "unresolved_reference");
});

test("zones : HORS du périmètre résolu, même avec une ancre non reconnue -> incompatible (c'est SÛR)", () => {
  // Intersecter davantage ne peut que rétrécir : une commune déjà dehors ne peut pas rentrer.
  const a = evaluateZones(ctx({ zones: zone(["29"], ["la Bretagne"], ["zone_inconnue"]) }), commune());
  assert.equal(a.status, "incompatible");
});

test("zones : AUCUNE ancre dure reconnue -> unexamined, jamais not_declared", () => {
  const a = evaluateZones(ctx({ zones: zone([], [], ["zone_inconnue"]) }), commune());
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "unresolved_reference");
});

test("excludeZones : le département est exclu -> incompatible", () => {
  const a = evaluateExcludeZones(ctx({ excludeZones: exZone(["31"], ["l'Occitanie"]) }), commune());
  assert.ok(a.status === "incompatible");
  assert.match(a.statement, /Occitanie/);
});

test("excludeZones : hors des zones exclues -> satisfied", () => {
  assert.equal(evaluateExcludeZones(ctx({ excludeZones: exZone(["75"], ["Paris"]) }), commune()).status, "satisfied");
});

test("excludeZones : hors des exclusions RÉSOLUES, mais une exclusion n'a pas été reconnue -> unexamined", () => {
  const a = evaluateExcludeZones(ctx({ excludeZones: exZone(["75"], ["Paris"], ["zone_inconnue"]) }), commune());
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "unresolved_reference");
});

test("excludeZones : DANS une exclusion résolue -> incompatible, même s'il reste une exclusion inconnue", () => {
  const a = evaluateExcludeZones(ctx({ excludeZones: exZone(["31"], ["l'Occitanie"], ["zone_inconnue"]) }), commune());
  assert.equal(a.status, "incompatible");
});

// ── montagne / reliefProche ──────────────────────────────────────────────────

test("montagnosite : la courbe du comparateur, à l'identique", () => {
  assert.equal(montagnosite(300), 0);
  assert.equal(montagnosite(600), 50);
  assert.equal(montagnosite(1000), 85);
  assert.equal(montagnosite(1400), 100);
  assert.equal(montagnosite(null), null);
});

test("montagne : altitude suffisante -> satisfied", () => {
  assert.equal(evaluateMontagne(ctx({ montagne: true }), commune({ altitude: 900 })).status, "satisfied");
});

test("montagne : altitude insuffisante -> incompatible, la CONVENTION est nommée", () => {
  const a = evaluateMontagne(ctx({ montagne: true }), commune({ altitude: 146 }));
  assert.ok(a.status === "incompatible");
  assert.match(a.statement, /146 m/);
  assert.match(a.statement, /600 m/); // la convention est DITE, jamais appliquée en silence
});

test("montagne : altitude ABSENTE -> unexamined(missing_data), jamais incompatible", () => {
  const a = evaluateMontagne(ctx({ montagne: true }), commune({ altitude: null }));
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "missing_data");
});

test("reliefProche : relief à ZÉRO est une OBSERVATION -> incompatible (pas une absence)", () => {
  const a = evaluateReliefProche(ctx({ reliefProche: true }), commune({ reliefProximite: 0 }));
  assert.ok(a.status === "incompatible");
});

test("reliefProche : relief ABSENT -> unexamined(missing_data). C'est le bug du `?? 0`.", () => {
  const a = evaluateReliefProche(ctx({ reliefProche: true }), commune({ reliefProximite: null }));
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "missing_data");
});

test("reliefProche : massif à portée -> satisfied", () => {
  assert.equal(evaluateReliefProche(ctx({ reliefProche: true }), commune({ reliefProximite: 69 })).status, "satisfied");
});

// ── nearSea / excludeSea ─────────────────────────────────────────────────────

test("nearSea : non déclarée -> not_declared", () => {
  assert.equal(evaluateNearSea(ctx(), commune()).status, "not_declared");
});

test("nearSea : DÉCLARÉE SANS DISTANCE -> unexamined(missing_parameter), JAMAIS les 30 km inventés", () => {
  const a = evaluateNearSea(ctx({ nearSea: { threshold: null } }), commune({ distanceCoteKm: 200 }));
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "missing_parameter");
});

test("nearSea : sous le seuil déclaré -> satisfied", () => {
  const a = evaluateNearSea(
    ctx({ nearSea: { threshold: { metric: "distance", maxKm: 30, source: "user" } } }),
    commune({ distanceCoteKm: 12 }),
  );
  assert.equal(a.status, "satisfied");
});

test("nearSea : au-delà du seuil déclaré -> incompatible", () => {
  const a = evaluateNearSea(
    ctx({ nearSea: { threshold: { metric: "distance", maxKm: 30, source: "user" } } }),
    commune({ distanceCoteKm: 150 }),
  );
  assert.ok(a.status === "incompatible");
  assert.match(a.statement, /150 km/);
  assert.match(a.statement, /30 km/);
  assert.equal(a.topic, "la distance de Toulouse au littoral");
});

test("nearSea : un seuil en TEMPS DE TRAJET n'est jamais évalué par un haversine", () => {
  const a = evaluateNearSea(
    ctx({ nearSea: { threshold: { metric: "travel_time", maxMinutes: 30, mode: "car", direction: "to_reference", source: "user" } } }),
    commune({ distanceCoteKm: 150 }),
  );
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "unsupported_metric");
});

test("nearSea : distance à la côte absente -> unexamined(missing_data)", () => {
  const a = evaluateNearSea(
    ctx({ nearSea: { threshold: { metric: "distance", maxKm: 30, source: "user" } } }),
    commune({ distanceCoteKm: null }),
  );
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "missing_data");
});

test("excludeSea : trop près de la côte -> incompatible, la convention (15 km) est DITE", () => {
  const a = evaluateExcludeSea(ctx({ excludeSea: true }), commune({ distanceCoteKm: 4 }));
  assert.ok(a.status === "incompatible");
  assert.match(a.statement, /15 km/);
});

test("excludeSea : assez loin -> satisfied", () => {
  assert.equal(evaluateExcludeSea(ctx({ excludeSea: true }), commune({ distanceCoteKm: 80 })).status, "satisfied");
});

// ── communeSize ──────────────────────────────────────────────────────────────

test("communeSize : dans les bornes -> satisfied", () => {
  assert.equal(evaluateCommuneSize(ctx({ communeSize: { min: null, max: 2_000_000 } }), commune()).status, "satisfied");
});

test("communeSize : LA DIVERGENCE — évaluée sur l'AGGLOMÉRATION, pas sur la population communale", () => {
  // 8 000 habitants dans l'unité urbaine de Lyon : le comparateur l'excluait, le dossier la déclarait
  // satisfaite. Le comparateur avait raison.
  const petite = commune({ nom: "Saint-Truc", population: 8_000, tailleVille: 1_600_000, uu: "00760" });
  const a = evaluateCommuneSize(ctx({ communeSize: { min: null, max: 25_000 } }, petite), petite);
  assert.ok(a.status === "incompatible");
  assert.deepEqual(a.observedValue, { kind: "population", value: 1_600_000, unit: "urban_unit" });
  // Le TEXTE parle d'agglomération : la promesse doit correspondre à la donnée réellement évaluée.
  assert.match(a.statement, /agglomération/);
  assert.doesNotMatch(a.statement, /Cette commune compte 8 000 habitants/);
});

test("communeSize : sous la borne min -> incompatible", () => {
  const a = evaluateCommuneSize(ctx({ communeSize: { min: 100_000, max: null } }), commune({ tailleVille: 4_000 }));
  assert.ok(a.status === "incompatible");
  assert.match(a.statement, /100 000/);
});

test("communeSize : tailleVille absente -> unexamined(missing_data)", () => {
  const a = evaluateCommuneSize(ctx({ communeSize: { min: null, max: 25_000 } }), commune({ tailleVille: null }));
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "missing_data");
});

// ── nearPlace / excludePlace / sizeRelativeTo (références nommées) ────────────

test("nearPlace : dans le rayon déclaré -> satisfied", () => {
  // Toulouse est à 701 km de Brest (haversine) : le rayon doit l'englober.
  const a = evaluateNearPlace(
    ctx({ nearPlace: { label: "Brest", threshold: { metric: "distance", maxKm: 800, source: "user" }, reference: BREST_REF, reachability: null } }),
    commune(),
  );
  assert.equal(a.status, "satisfied");
});

test("nearPlace : hors du rayon -> incompatible, et le lieu est NOMMÉ", () => {
  const a = evaluateNearPlace(
    ctx({ nearPlace: { label: "Brest", threshold: { metric: "distance", maxKm: 50, source: "user" }, reference: BREST_REF, reachability: null } }),
    commune(),
  );
  assert.ok(a.status === "incompatible");
  assert.match(a.statement, /Brest/);
  assert.match(a.statement, /50 km/);
  // Le GRAIN est dit : c'est le point de référence de la commune, pas « toute la commune ».
  assert.match(a.statement, /point de référence/);
});

test("nearPlace : référence NON RÉSOLUE -> unexamined(unresolved_reference). Jamais sautée en silence.", () => {
  const a = evaluateNearPlace(
    ctx({ nearPlace: { label: "Gare Matabiau", threshold: { metric: "distance", maxKm: 30, source: "user" }, reference: MATABIAU_REF, reachability: null } }),
    commune(),
  );
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "unresolved_reference");
});

test("nearPlace : SANS seuil -> unexamined(missing_parameter). Jamais les 50 km inventés.", () => {
  const a = evaluateNearPlace(
    ctx({ nearPlace: { label: "Brest", threshold: null, reference: BREST_REF, reachability: null } }),
    commune(),
  );
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "missing_parameter");
});

test("nearPlace : un TEMPS DE TRAJET n'est jamais évalué par un haversine (sans isochrone, on ne se rabat pas)", () => {
  // Le mode est supporté (voiture) : ce n'est donc plus « métrique non calculable » comme au lot 1, c'est
  // « nous n'avons pas pu router ». Une panne, retentable. L'invariant, lui, ne bouge pas : PAS de repli
  // sur la distance à vol d'oiseau.
  const a = evaluateNearPlace(
    ctx({ nearPlace: { label: "Brest", threshold: { metric: "travel_time", maxMinutes: 30, mode: "car", direction: "to_reference", source: "user" }, reference: BREST_REF, reachability: null } }),
    commune(),
  );
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "routing_unavailable");
});

test("nearPlace : mode absent -> missing_parameter (le lieu est identifié, c'est le MODE qui manque)", () => {
  const a = evaluateNearPlace(
    ctx({ nearPlace: { label: "Brest", threshold: { metric: "travel_time", maxMinutes: 30, mode: null, direction: "to_reference", source: "user" }, reference: BREST_REF, reachability: null } }),
    commune(),
  );
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "missing_parameter");
});

test("nearPlace : commune SANS coordonnées -> unexamined(missing_data), jamais un point à (0, 0)", () => {
  const sansCoords = commune({ lat: null, lon: null });
  const a = evaluateNearPlace(
    ctx({ nearPlace: { label: "Brest", threshold: { metric: "distance", maxKm: 50, source: "user" }, reference: BREST_REF, reachability: null } }, sansCoords),
    sansCoords,
  );
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "missing_data");
});

test("excludePlace : la commune est dans l'agglomération à quitter -> incompatible", () => {
  const dansLyon = commune({ nom: "Villeurbanne", insee: "69266", uu: "00760" });
  const a = evaluateExcludePlace(ctx({ excludePlace: [{ label: "Lyon", reference: LYON_UU }] }, dansLyon), dansLyon);
  assert.ok(a.status === "incompatible");
  assert.match(a.statement, /Lyon/);
});

test("excludePlace : hors de l'agglomération -> satisfied", () => {
  const a = evaluateExcludePlace(ctx({ excludePlace: [{ label: "Lyon", reference: LYON_UU }] }), commune());
  assert.equal(a.status, "satisfied");
});

test("excludePlace : « quitter Lyon ET Saint-Jean », dont un seul se résout -> unexamined, JAMAIS satisfied", () => {
  // Le mensonge le plus discret du chantier : la commune n'est pas dans Lyon, donc on serait tenté de
  // dire « condition respectée ». Mais la moitié de la condition n'a jamais été testée.
  const a = evaluateExcludePlace(
    ctx({ excludePlace: [{ label: "Lyon", reference: LYON_UU }, { label: "Saint-Jean-de-Machin", reference: INCONNUE_UU }] }),
    commune(),
  );
  assert.ok(a.status === "unexamined");
  assert.equal(a.reason, "unresolved_reference");
  assert.match(a.detail!, /Saint-Jean/);
});

test("excludePlace : DANS une ville résolue -> incompatible, même s'il reste une ville non résolue", () => {
  const dansLyon = commune({ nom: "Villeurbanne", insee: "69266", uu: "00760" });
  const a = evaluateExcludePlace(
    ctx({ excludePlace: [{ label: "Lyon", reference: LYON_UU }, { label: "X", reference: INCONNUE_UU }] }, dansLyon),
    dansLyon,
  );
  assert.equal(a.status, "incompatible"); // c'est SÛR : aucune résolution ne l'en ferait sortir
});

test("sizeRelativeTo : plus petit que la référence -> satisfied, comparaison d'AGGLO à AGGLO", () => {
  const ref: ResolvedSizeReference = {
    status: "resolved", originalLabel: "Bordeaux", canonicalLabel: "Bordeaux", urbanUnitCode: "33701",
    comparisonPopulation: 1_000_000, populationYear: 2021, populationKind: "urban_unit",
    source: "commune_index", meta: META,
  };
  const petite = commune({ nom: "Auch", tailleVille: 25_000 });
  const a = evaluateSizeRelativeTo(ctx({ sizeRelativeTo: { label: "Bordeaux", direction: "smaller", reference: ref } }, petite), petite);
  assert.equal(a.status, "satisfied");
});

test("sizeRelativeTo : plus grand que la référence alors qu'on voulait plus petit -> incompatible", () => {
  const ref: ResolvedSizeReference = {
    status: "resolved", originalLabel: "Auch", canonicalLabel: "Auch", urbanUnitCode: "32701",
    comparisonPopulation: 25_000, populationYear: 2021, populationKind: "urban_unit",
    source: "commune_index", meta: META,
  };
  const a = evaluateSizeRelativeTo(ctx({ sizeRelativeTo: { label: "Auch", direction: "smaller", reference: ref } }), commune());
  assert.ok(a.status === "incompatible");
  assert.match(a.statement, /Auch/);
});

// ── le registre ──────────────────────────────────────────────────────────────

test("le registre est EXHAUSTIF : les 11 clés ont un évaluateur", () => {
  assert.equal(Object.keys(HARD_CONSTRAINT_EVALUATORS).length, 11);
  for (const k of HARD_CONSTRAINT_KEYS) assert.ok(typeof HARD_CONSTRAINT_EVALUATORS[k] === "function", k);
});

test("assessHardConstraints : une évaluation par clé, et chacune porte SA clé", () => {
  const all = assessHardConstraints(ctx({ departements: ["31"] }), commune());
  assert.equal(all.length, 11);
  for (const a of all) assert.ok(HARD_CONSTRAINT_KEYS.includes(a.key));
  assert.equal(all.filter((a) => a.status === "not_declared").length, 10);
});

test("les topics tiennent dans la limite dure d'assertFactValid (70 car.), même sur un nom très long", () => {
  const long = commune({ nom: "Saint-Rémy-en-Bouzemont-Saint-Genest-et-Isson", dept: "51", uu: null, tailleVille: 500, distanceCoteKm: 200, altitude: 100, reliefProximite: 0 });
  const bordeaux: ResolvedSizeReference = {
    status: "resolved", originalLabel: "Bordeaux", canonicalLabel: "Bordeaux", urbanUnitCode: "33701",
    comparisonPopulation: 1_000_000, populationYear: 2021, populationKind: "urban_unit",
    source: "commune_index", meta: META,
  };
  const cases: NormalizedHardConstraints[] = [
    normalized({ departements: ["33"] }),
    normalized({ zones: zone(["29"], ["la Bretagne"]) }),
    normalized({ excludeZones: exZone(["51"], ["le Grand Est"]) }),
    normalized({ montagne: true }),
    normalized({ reliefProche: true }),
    normalized({ nearSea: { threshold: { metric: "distance", maxKm: 10, source: "user" } } }),
    normalized({ excludeSea: true, }),
    normalized({ communeSize: { min: 100_000, max: null } }),
    normalized({ nearPlace: { label: "Brest", threshold: { metric: "distance", maxKm: 5, source: "user" }, reference: BREST_REF, reachability: null } }),
    normalized({ sizeRelativeTo: { label: "Bordeaux", direction: "larger", reference: bordeaux } }),
  ];
  // excludeSea ne devient incompatible que sur une commune littorale : on lui donne son cas.
  const longLittorale = commune({ ...long, distanceCoteKm: 4 });
  const cas: { c: CommuneAttributes; constraints: NormalizedHardConstraints }[] = [
    ...cases.map((constraints) => ({ c: long, constraints })),
    { c: longLittorale, constraints: normalized({ excludeSea: true }) },
    { c: commune({ ...long, uu: "00760", tailleVille: 1_600_000 }), constraints: normalized({ communeSize: { min: null, max: 25_000 } }) },
    {
      c: commune({ ...long, uu: "00760" }),
      constraints: normalized({ excludePlace: [{ label: "Saint-Rémy-en-Bouzemont-Saint-Genest-et-Isson", reference: { ...LYON_UU, canonicalLabel: "Saint-Rémy-en-Bouzemont-Saint-Genest-et-Isson" } }] }),
    },
  ];

  let vus = 0;
  for (const { c, constraints } of cas) {
    for (const a of assessHardConstraints({ ...ctx({}, c), constraints }, c)) {
      if (a.status !== "incompatible") continue;
      vus++;
      assert.ok(a.topic.length <= 70, `topic trop long (${a.topic.length}) : « ${a.topic} »`);
      assert.doesNotMatch(a.topic, /[.!?]/, `topic phrasé : « ${a.topic} »`);
    }
  }
  assert.ok(vus >= 11, `seulement ${vus} incompatibilités exercées : le test ne prouve rien`);
});

// ── LOT 2 : le temps de trajet, évalué par point-dans-isochrone ───────────────

const GARE_REF: ResolvedPlaceReference = {
  status: "resolved", originalLabel: "la gare Matabiau", canonicalLabel: "Gare Matabiau",
  kind: "station", lat: 43.611448, lon: 1.453496, source: "geoplateforme_poi",
  sourceId: "EQ_RESEA0000000073015866", confidence: "high", meta: META,
};

// Un carré autour de Toulouse : 1,3..1,6 E ; 43,5..43,7 N. Toulouse (43,6045 ; 1,4442) est dedans.
const ISO: PolygonGeometry = {
  type: "Polygon",
  coordinates: [[[1.3, 43.5], [1.6, 43.5], [1.6, 43.7], [1.3, 43.7], [1.3, 43.5]]],
};
const PRETE: ReachabilityState = { status: "ready", geometry: ISO, toleranceMeters: 300 };

function ctxTemps(
  reachability: ReachabilityState | null,
  mode: PlaceMode | null = "car",
  point: EvaluationPoint | null = {
    lat: 43.6045, lon: 1.4442, grain: "commune_reference", source: "commune_centroid", label: "Toulouse",
  },
): EvaluationContext {
  return {
    constraints: normalized({
      nearPlace: {
        label: "la gare Matabiau",
        threshold: { metric: "travel_time", maxMinutes: 30, mode, direction: "to_reference", source: "user" },
        reference: GARE_REF,
        reachability,
      },
    }),
    point,
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };
}

test("dans l'isochrone : satisfied, et la valeur observée dit CE QU'ELLE ÉTABLIT (un côté, pas un temps)", () => {
  const a = evaluateNearPlace(ctxTemps(PRETE), commune());
  assert.equal(a.status, "satisfied");
  if (a.status !== "satisfied") return;
  assert.deepEqual(a.observedValue, {
    kind: "travel_time_threshold", maxMinutes: 30, mode: "car", within: true, direction: "to_reference",
  });
  assert.equal(a.expectedLabel, "au plus 30 minutes en voiture");
});

test("hors de l'isochrone : incompatible, la phrase nomme le lieu, le mode et le temps, et JAMAIS des km", () => {
  const auch = commune({ insee: "32013", nom: "Auch", lat: 43.646, lon: 0.586 });
  const ctxAuch = ctxTemps(PRETE, "car", {
    lat: 43.646, lon: 0.586, grain: "commune_reference", source: "commune_centroid", label: "Auch",
  });
  const a = evaluateNearPlace(ctxAuch, auch);
  assert.equal(a.status, "incompatible");
  if (a.status !== "incompatible") return;
  assert.match(a.statement, /Gare Matabiau/);
  assert.match(a.statement, /30 minutes en voiture/);
  assert.doesNotMatch(a.statement, /km/); // on ne convertit JAMAIS un temps en distance
  assert.equal(a.observedValue.kind === "travel_time_threshold" ? a.observedValue.within : null, false);
});

test("UN TEMPS N'EST JAMAIS ÉVALUÉ PAR UN HAVERSINE : sans isochrone, c'est routing_unavailable", () => {
  const a = evaluateNearPlace(ctxTemps({ status: "unavailable", reason: "routing_unavailable" }), commune());
  assert.equal(a.status === "unexamined" && a.reason, "routing_unavailable");
});

test("le VÉLO n'est pas calculable par le moteur IGN : unsupported_metric", () => {
  const a = evaluateNearPlace(ctxTemps(null, "bike"), commune());
  assert.equal(a.status === "unexamined" && a.reason, "unsupported_metric");
});

test("le mode manquant est un PARAMÈTRE, pas une ambiguïté du lieu", () => {
  const a = evaluateNearPlace(ctxTemps(null, null), commune());
  assert.equal(a.status === "unexamined" && a.reason, "missing_parameter");
});

test("ABSENCES COMBINÉES : sans mode ET sans point, c'est le MODE qu'on nomme (la cause que le lecteur peut lever)", () => {
  const a = evaluateNearPlace(ctxTemps(null, null, null), commune());
  assert.equal(a.status === "unexamined" && a.reason, "missing_parameter");
});

test("ABSENCES COMBINÉES : mode connu, isochrone prête, commune sans coordonnées -> missing_data", () => {
  const a = evaluateNearPlace(ctxTemps(PRETE, "car", null), commune({ lat: null, lon: null }));
  assert.equal(a.status === "unexamined" && a.reason, "missing_data");
});

test("dans la bande de tolérance : insufficient_precision, JAMAIS incompatible", () => {
  // 1,301 E est à ~80 m du bord ouest de l'isochrone.
  const a = evaluateNearPlace(
    ctxTemps(PRETE, "car", {
      lat: 43.6, lon: 1.301, grain: "commune_reference", source: "commune_centroid", label: "Frontière",
    }),
    commune(),
  );
  assert.equal(a.status === "unexamined" && a.reason, "insufficient_precision");
});

test("une géométrie illisible ne devient pas une incompatibilité", () => {
  const a = evaluateNearPlace(
    ctxTemps({ status: "ready", geometry: { type: "Polygon", coordinates: [] }, toleranceMeters: 300 }),
    commune(),
  );
  assert.equal(a.status === "unexamined" && a.reason, "routing_unavailable");
});

test("UNE PANNE DE GÉOCODAGE N'EST PAS UN LIEU INTROUVABLE", () => {
  const panne: ResolvedPlaceReference = {
    status: "unresolved", originalLabel: "la gare Matabiau", reason: "geocoding_unavailable", meta: META,
  };
  const a = evaluateNearPlace(
    ctx({
      nearPlace: {
        label: "la gare Matabiau",
        threshold: { metric: "distance", maxKm: 20, source: "user" },
        reference: panne,
        reachability: null,
      },
    }),
    commune(),
  );
  assert.equal(a.status === "unexamined" && a.reason, "geocoding_unavailable");
});

test("le grain est dit : depuis une ADRESSE, la phrase commence par « Cette adresse »", () => {
  const a = evaluateNearPlace(
    ctxTemps(PRETE, "car", {
      lat: 43.646, lon: 0.586, grain: "address", source: "address_geocoder", label: "7 rue X",
    }),
    commune(),
  );
  assert.equal(a.status, "incompatible");
  if (a.status !== "incompatible") return;
  assert.match(a.statement, /^Cette adresse/);
});

// ── LOT 2c : l'ESTIMATION prime sur la géométrie, et se prouve ────────────────

const TLSE_PT: EvaluationPoint = {
  lat: 43.6045, lon: 1.4442, grain: "commune_reference", source: "commune_centroid", label: "Toulouse",
};

function estimation(
  minutes: number,
  over: Partial<Extract<TravelTimeEstimate, { status: "estimated" }>> = {},
): TravelTimeEstimate {
  return {
    status: "estimated", minutes, mode: "car",
    from: { lat: TLSE_PT.lat, lon: TLSE_PT.lon },
    to: { lat: GARE_REF.status === "resolved" ? GARE_REF.lat : 0, lon: GARE_REF.status === "resolved" ? GARE_REF.lon : 0 },
    direction: "to_reference", requestHash: "h",
    ...over,
  };
}

function ctxEstime(
  travelTime: TravelTimeEstimate | null,
  reachability: ReachabilityState | null = PRETE,
  point: EvaluationPoint | null = TLSE_PT,
): EvaluationContext {
  return {
    constraints: normalized({
      nearPlace: {
        label: "la gare Matabiau",
        threshold: { metric: "travel_time", maxMinutes: 30, mode: "car", direction: "to_reference", source: "user" },
        reference: GARE_REF,
        reachability,
      },
    }),
    point,
    travelTime,
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };
}

test("une estimation SOUS le seuil : satisfied, et la valeur est enfin une VRAIE DURÉE", () => {
  const a = evaluateNearPlace(ctxEstime(estimation(23.7)), commune());
  assert.equal(a.status, "satisfied");
  if (a.status !== "satisfied") return;
  assert.deepEqual(a.observedValue, { kind: "travel_time_min", value: 23.7, mode: "car" });
  assert.equal(a.observedLabel, "environ 24 minutes en voiture");
});

test("une estimation AU-DELÀ du seuil : incompatible, la phrase dit « environ », jamais des km", () => {
  const a = evaluateNearPlace(ctxEstime(estimation(41.2)), commune());
  assert.equal(a.status, "incompatible");
  if (a.status !== "incompatible") return;
  assert.match(a.statement, /environ 41 minutes en voiture/);
  assert.match(a.statement, /Gare Matabiau/);
  assert.doesNotMatch(a.statement, /km/);
});

test("L'ESTIMATION PRIME SUR LA GÉOMÉTRIE : le polygone dit dedans, l'itinéraire dit 41 minutes", () => {
  // Toulouse est DANS l'isochrone de test (PRETE), mais l'itinéraire la met au-delà du seuil. C'est la
  // mesure qui tranche : une durée calculée sur le graphe vaut mieux qu'une appartenance à un polygone
  // simplifié.
  const a = evaluateNearPlace(ctxEstime(estimation(41.2), PRETE), commune());
  assert.equal(a.status, "incompatible");
});

test("L'ARRONDI NE MASQUE JAMAIS LE FRANCHISSEMENT : 30,4 minutes ne s'affiche pas « 30 minutes »", () => {
  // Sans ce garde-fou : « à 30 minutes, au-delà de la limite de 30 minutes que vous avez posée ».
  const a = evaluateNearPlace(ctxEstime(estimation(30.4)), commune());
  assert.equal(a.status, "incompatible");
  if (a.status !== "incompatible") return;
  assert.match(a.statement, /environ 30,4 minutes/);
  assert.doesNotMatch(a.statement, /environ 30 minutes/);
});

test("une estimation calculée depuis un AUTRE POINT est IGNORÉE (le centroïde n'est pas l'adresse)", () => {
  // L'estimation vient du centroïde de Toulouse ; on évalue une adresse à 40 km de là. La resservir
  // trancherait le sort de l'adresse avec la durée d'un autre lieu.
  const adresse: EvaluationPoint = {
    lat: 43.95, lon: 1.05, grain: "address", source: "address_geocoder", label: "7 rue X",
  };
  const a = evaluateNearPlace(ctxEstime(estimation(23.7), PRETE, adresse), commune());
  // On retombe sur la géométrie : l'adresse est hors du polygone de test.
  assert.equal(a.status, "incompatible");
  if (a.status !== "incompatible") return;
  assert.doesNotMatch(a.statement, /23|24 minutes/); // surtout pas la durée d'un autre point
});

test("une estimation d'un AUTRE MODE est IGNORÉE (« à pied » ne tranche pas « en voiture »)", () => {
  const a = evaluateNearPlace(ctxEstime(estimation(23.7, { mode: "walk" })), commune());
  assert.equal(a.status, "satisfied"); // la géométrie a repris la main (Toulouse est dans le polygone)
  if (a.status !== "satisfied") return;
  assert.equal(a.observedValue.kind, "travel_time_threshold"); // pas une durée : la géométrie, donc un côté
});

test("le routage a échoué pour CETTE commune : on retombe sur la géométrie", () => {
  const a = evaluateNearPlace(ctxEstime({ status: "unavailable" }, PRETE), commune());
  assert.equal(a.status, "satisfied");
});

test("routage échoué ET pas de géométrie : routing_unavailable, jamais un verdict", () => {
  const a = evaluateNearPlace(ctxEstime({ status: "unavailable" }, null), commune());
  assert.equal(a.status === "unexamined" && a.reason, "routing_unavailable");
});

test("une estimation tranche même SANS isochrone (elle n'en a pas besoin)", () => {
  const a = evaluateNearPlace(ctxEstime(estimation(12), null), commune());
  assert.equal(a.status, "satisfied");
});
