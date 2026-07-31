import test from "node:test";
import assert from "node:assert/strict";
import { buildAddressDpeContext, addressContextLead } from "./dpe-address-context.ts";
import type { DpeRecord } from "./dpe-attribution.ts";

// Fabrique un diagnostic minimal : seuls les champs que ce module lit sont renseignés.
function dpe(over: Partial<DpeRecord> = {}): DpeRecord {
  return {
    id_dpe: Math.random().toString(36).slice(2),
    date_dpe: "2024-05-01", id_ban: null, adresse: null,
    etiquette_dpe: "C", etiquette_ges: null, conso_ep_m2: null, emission_ges_m2: null,
    surface_m2: 40, annee_construction: null, type_batiment: "appartement",
    etage: null, complement: null,
    confort_ete: null, traversant: null, protection_solaire: null, ventilation: null,
    inertie: null, isolation_toiture: null, brasseur_air: null,
    isolation_murs: null, isolation_menuiseries: null, methode_dpe: "dpe appartement individuel",
    ...over,
  } as DpeRecord;
}

test("aucun diagnostic -> aucun contexte, plutôt qu'un bloc vide", () => {
  assert.equal(buildAddressDpeContext([]), null);
});

test("le compte porte sur TOUS les diagnostics, la matière comparable sur les seuls logements", () => {
  // Le tertiaire ne compare rien d'utile pour un logement, mais il existe à l'adresse : le taire
  // ferait un compte que le lecteur ne retrouverait pas s'il consultait la base lui-même.
  const c = buildAddressDpeContext([
    dpe(), dpe(), dpe({ type_batiment: "tertiaire", etiquette_dpe: "E" }),
  ])!;
  assert.equal(c.total, 3);
  assert.equal(c.labelled, 2);
});

test("répartition des classes, ordonnée de A à G", () => {
  const c = buildAddressDpeContext([
    dpe({ etiquette_dpe: "F" }), dpe({ etiquette_dpe: "C" }),
    dpe({ etiquette_dpe: "C" }), dpe({ etiquette_dpe: "A" }),
  ])!;
  assert.deepEqual(c.distribution, [
    { label: "A", count: 1 }, { label: "C", count: 2 }, { label: "F", count: 1 },
  ]);
});

test("une seule classe n'est pas une répartition", () => {
  // Trois diagnostics tous en C : afficher « C : 3 » donnerait l'illusion d'une dispersion
  // observée, alors qu'il n'y a rien à répartir.
  const c = buildAddressDpeContext([dpe(), dpe(), dpe()])!;
  assert.deepEqual(c.distribution, []);
});

test("les bornes n'apparaissent qu'à partir de trois diagnostics classés", () => {
  // Sous trois, deux bornes ne décrivent pas une dispersion : elles décrivent deux cas. Seuil
  // repris de l'ancien `deriveAddressDpeContext`.
  const deux = buildAddressDpeContext([dpe({ etiquette_dpe: "B" }), dpe({ etiquette_dpe: "F" })])!;
  assert.equal(deux.spread, null);

  const trois = buildAddressDpeContext([
    dpe({ etiquette_dpe: "B" }), dpe({ etiquette_dpe: "F" }), dpe({ etiquette_dpe: "D" }),
  ])!;
  assert.deepEqual(trois.spread, { min: "B", max: "F" });
});

test("bornes d'années et de surfaces, JAMAIS de moyenne", () => {
  // Une moyenne entre un studio et un T5 fabrique une valeur qui ne décrit aucun logement réel,
  // et elle se lit comme LA réponse. Les bornes se lisent pour ce qu'elles sont.
  const c = buildAddressDpeContext([
    dpe({ date_dpe: "2021-03-02", surface_m2: 18 }),
    dpe({ date_dpe: "2026-01-15", surface_m2: 92 }),
    dpe({ date_dpe: "2023-07-30", surface_m2: 45 }),
  ])!;
  assert.deepEqual(c.years, { min: 2021, max: 2026 });
  assert.deepEqual(c.surfaces, { min: 18, max: 92 });
  assert.equal("average" in c, false);
  assert.equal("moyenne" in c, false);
});

test("une surface nulle ou négative n'entre pas dans les bornes", () => {
  const c = buildAddressDpeContext([
    dpe({ surface_m2: 0 }), dpe({ surface_m2: null }), dpe({ surface_m2: 55 }),
  ])!;
  assert.deepEqual(c.surfaces, { min: 55, max: 55 });
});

test("une date absente n'écrase pas les bornes d'années", () => {
  const c = buildAddressDpeContext([dpe({ date_dpe: null }), dpe({ date_dpe: "2022-01-01" })])!;
  assert.deepEqual(c.years, { min: 2022, max: 2022 });
});

test("un diagnostic à l'IMMEUBLE est signalé : il concerne le bâtiment, pas un logement", () => {
  const sans = buildAddressDpeContext([dpe()])!;
  assert.equal(sans.hasCollective, false);

  const avec = buildAddressDpeContext([
    dpe(), dpe({ methode_dpe: "dpe immeuble collectif", type_batiment: "immeuble" }),
  ])!;
  assert.equal(avec.hasCollective, true);
});

test("les types de bâtiment sont dédupliqués", () => {
  const c = buildAddressDpeContext([
    dpe({ type_batiment: "appartement" }), dpe({ type_batiment: "appartement" }),
    dpe({ type_batiment: "maison" }),
  ])!;
  assert.deepEqual(c.buildingTypes, ["appartement", "maison"]);
});

// ── La phrase d'ouverture ──────────────────────────────────────────────────────────────────
// Elle dit COMBIEN avant de dire qu'aucun n'est attribuable : commencer par l'absence ferait lire
// « on n'a rien », alors que la matière existe et qu'elle dit quoi demander au vendeur.

test("l'ouverture nomme le nombre, puis l'absence d'attribution", () => {
  const c = buildAddressDpeContext(Array.from({ length: 24 }, () => dpe()))!;
  const s = addressContextLead(c);
  assert.ok(s.startsWith("24 diagnostics"), s);
  assert.ok(s.includes("Aucun ne peut être attribué"), s);
});

test("l'ouverture s'accorde au singulier", () => {
  const c = buildAddressDpeContext([dpe()])!;
  const s = addressContextLead(c);
  assert.ok(s.startsWith("Un diagnostic est rattaché"), s);
  assert.equal(s.includes("diagnostics"), false, "aucun pluriel parasite");
});

test("l'ouverture n'affirme jamais que le logement n'a pas de diagnostic", () => {
  // La nuance qui compte : « aucun ATTRIBUABLE » et « aucun diagnostic » sont deux affirmations
  // différentes, et la seconde serait fausse ici.
  for (const n of [1, 2, 24]) {
    const s = addressContextLead(buildAddressDpeContext(Array.from({ length: n }, () => dpe()))!);
    assert.equal(/aucun diagnostic n/i.test(s), false, s);
  }
});
