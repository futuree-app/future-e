// FUT-8, étapes 3 et 4 : l'évaluateur lit la sémantique précisée, la capacité la promeut.
import test from "node:test";
import assert from "node:assert/strict";
import { hydrateHardConstraints } from "../hard-constraints-hydrate.ts";
import { evaluateCommuneSize, evaluateExcludePlace, evaluateExcludeZones, type CommuneAttributes, type EvaluationContext } from "../hard-constraints.ts";
import type { PlaceDirectory, ResolvedUrbanAreaReference } from "../hard-constraints-resolve.ts";
import type { HardConstraints } from "../hard-constraint-schema.ts";
import { criterionCapability } from "./capability.ts";

const dir: PlaceDirectory = { byName: () => null, plmByName: () => null };
const META = { resolver: "test", version: "test" } as unknown as Extract<ResolvedUrbanAreaReference, { status: "resolved" }>["meta"];
const LYON: ResolvedUrbanAreaReference = {
  status: "resolved", originalLabel: "Lyon", canonicalLabel: "Lyon", referenceCommuneInsee: "69123",
  urbanUnitCode: "00760", normalizedTerritoryCode: "uu:00760", source: "plm_table", meta: META,
};
const ANNECY: ResolvedUrbanAreaReference = {
  status: "resolved", originalLabel: "Annecy", canonicalLabel: "Annecy", referenceCommuneInsee: "74010",
  urbanUnitCode: "74501", normalizedTerritoryCode: "uu:74501", source: "commune_index", meta: META,
};
function commune(over: Partial<CommuneAttributes>): CommuneAttributes {
  return { insee: "00000", nom: "Commune", dept: null, lat: null, lon: null, population: null, tailleVille: null, uu: null, altitude: null, reliefProximite: null, distanceCoteKm: null, ...over };
}
function ctx(hc: HardConstraints, excludePlace?: EvaluationContext["constraints"]["excludePlace"]): EvaluationContext {
  const constraints = hydrateHardConstraints(hc, dir);
  return { constraints: excludePlace ? { ...constraints, excludePlace } : constraints, point: null, conventionsVersion: "test" };
}
const cap = (key: Parameters<typeof criterionCapability>[0] extends infer D ? D extends { kind: "hard" } ? D["key"] : never : never, hc: HardConstraints, grain: "commune" | "adresse" = "commune") =>
  criterionCapability({ kind: "hard", key, hc }, grain).capability;

test("taille « commune de moins de 20 000 habitants » : lue sur la commune, pas sur l'agglomération", () => {
  const villeurbanne = commune({ insee: "69266", nom: "Villeurbanne", population: 160000, tailleVille: 1700000, uu: "00760" });
  const petite = commune({ insee: "69999", nom: "Petite", population: 8000, tailleVille: 1700000, uu: "00760" });
  const surLaCommune = ctx({ communeSize: { max: 20000, unit: "commune" } });
  assert.equal(evaluateCommuneSize(surLaCommune, petite).status, "satisfied");
  assert.equal(evaluateCommuneSize(surLaCommune, villeurbanne).status, "incompatible");
  // Sans unité : l'agglomération, comme avant.
  assert.equal(evaluateCommuneSize(ctx({ communeSize: { max: 20000 } }), petite).status, "incompatible");
  // Un arrondissement de Lyon n'a pas la population de la ville : on ne conclut pas.
  assert.equal(evaluateCommuneSize(surLaCommune, commune({ insee: "69383", population: 100000, tailleVille: 1700000, uu: "00760" })).status, "unexamined");
});

test("quitter Lyon : « la commune » épargne Villeurbanne, « l'agglomération » non ; les arrondissements comptent", () => {
  const villeurbanne = commune({ insee: "69266", nom: "Villeurbanne", uu: "00760" });
  const lyon3 = commune({ insee: "69383", nom: "Lyon 3e", uu: "00760" });
  const commun = ctx({}, [{ label: "Lyon", reference: LYON, scope: "commune" }]);
  const agglo = ctx({}, [{ label: "Lyon", reference: LYON, scope: "unite_urbaine" }]);
  assert.equal(evaluateExcludePlace(commun, villeurbanne).status, "satisfied");
  assert.equal(evaluateExcludePlace(commun, lyon3).status, "incompatible");
  assert.equal(evaluateExcludePlace(agglo, villeurbanne).status, "incompatible");
  // Une ville hors PLM : la commune de référence elle-même.
  const annecy = ctx({}, [{ label: "Annecy", reference: ANNECY, scope: "commune" }]);
  assert.equal(evaluateExcludePlace(annecy, commune({ insee: "74010", uu: "74501" })).status, "incompatible");
  assert.equal(evaluateExcludePlace(annecy, commune({ insee: "74011", uu: "74501" })).status, "satisfied");
});

test("région parisienne au périmètre choisi : petite couronne, agglomération", () => {
  const versailles = commune({ insee: "78646", nom: "Versailles", dept: "78", uu: "00851" });
  const montreuil = commune({ insee: "93048", nom: "Montreuil", dept: "93", uu: "00851" });
  const pc = ctx({ excludeZones: ["idf"], excludeZonesPerimetres: { idf: "petite_couronne" } });
  assert.equal(evaluateExcludeZones(pc, montreuil).status, "incompatible");
  assert.equal(evaluateExcludeZones(pc, versailles).status, "satisfied");
  const agglo = ctx({ excludeZones: ["idf"], excludeZonesPerimetres: { idf: "agglomeration" } });
  assert.equal(evaluateExcludeZones(agglo, versailles).status, "incompatible");
  assert.equal(evaluateExcludeZones(agglo, commune({ insee: "77001", dept: "77", uu: null })).status, "satisfied");
});

test("capacité : chaque promotion exige la précision ; sans elle, rien ne bouge", () => {
  // Distance : vol d'oiseau à l'adresse ; route jamais ; sans métrique jamais.
  assert.equal(cap("nearPlace", { nearPlace: { label: "Nantes", maxKm: 20, metric: "vol_oiseau" } }, "adresse"), "trancher");
  assert.equal(cap("nearPlace", { nearPlace: { label: "Nantes", maxKm: 20, metric: "vol_oiseau" } }, "commune"), "apprecier");
  assert.equal(cap("nearPlace", { nearPlace: { label: "Nantes", maxKm: 20, metric: "route" } }, "adresse"), "apprecier");
  assert.equal(cap("nearPlace", { nearPlace: { label: "Nantes", maxKm: 20 } }, "adresse"), "apprecier");
  // Taille : chiffre + unité.
  assert.equal(cap("communeSize", { communeSize: { max: 20000, unit: "commune" } }), "trancher");
  assert.equal(cap("communeSize", { communeSize: { max: 20000 } }), "apprecier");
  assert.equal(cap("sizeRelativeTo", { sizeRelativeTo: { label: "Brest", direction: "smaller", unit: "unite_urbaine" } }), "trancher");
  assert.equal(cap("sizeRelativeTo", { sizeRelativeTo: { label: "Brest", direction: "smaller" } }), "apprecier");
  // Quitter des villes : CHAQUE ville a son périmètre.
  assert.equal(cap("excludePlace", { excludePlace: [{ label: "Lyon", scope: "commune" }] }), "trancher");
  assert.equal(cap("excludePlace", { excludePlace: [{ label: "Lyon", scope: "commune" }, { label: "Bordeaux" }] }), "apprecier");
  // Région parisienne : périmètre choisi.
  assert.equal(cap("excludeZones", { excludeZones: ["idf"] }), "apprecier");
  assert.equal(cap("excludeZones", { excludeZones: ["idf"], excludeZonesPerimetres: { idf: "ile_de_france" } }), "trancher");
  // Macro-zones : périmètre accepté pour CHAQUE ancre conventionnelle ; une façade jamais.
  const sudOuest = { zones: [{ zone: "sud_ouest", strength: "hard" as const }] };
  assert.equal(cap("zones", sudOuest), "apprecier");
  assert.equal(cap("zones", { ...sudOuest, zonesConventions: [{ token: "sud_ouest", conventionId: "zone:sud-ouest", conventionVersion: 1 }] }), "trancher");
  assert.equal(cap("zones", { ...sudOuest, zonesConventions: [{ token: "sud_ouest", conventionId: "zone:sud-ouest", conventionVersion: 9 }] }), "apprecier");
  const facade = { zones: [{ zone: "atlantique", strength: "hard" as const }], zonesConventions: [{ token: "atlantique", conventionId: "zone:sud-ouest", conventionVersion: 1 }] };
  assert.equal(cap("zones", facade), "apprecier");
  const mixte = { zones: [{ zone: "bretagne", strength: "hard" as const }, { zone: "sud_ouest", strength: "hard" as const }] };
  assert.equal(cap("zones", mixte), "apprecier");
  assert.equal(cap("zones", { ...mixte, zonesConventions: [{ token: "sud_ouest", conventionId: "zone:sud-ouest", conventionVersion: 1 }] }), "trancher");
});
