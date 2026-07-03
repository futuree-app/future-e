import test from "node:test";
import assert from "node:assert/strict";
import {
  dedupeAndCollapseDpe,
  dpeAttributionStatus,
  deriveAddressDpeContext,
  type DpeRecord,
} from "./dpe-attribution.ts";

function rec(p: Partial<DpeRecord>): DpeRecord {
  return {
    id_dpe: "x", date_dpe: "2023-01-01", id_ban: "ban1", adresse: "1 rue X",
    etiquette_dpe: "D", etiquette_ges: "D", conso_ep_m2: null, emission_ges_m2: null,
    surface_m2: 60, annee_construction: 1970, type_batiment: "appartement",
    etage: null, complement: null, ...p,
  };
}

// ── Task 1 : dédup + collapse ────────────────────────────────────────────────

test("dédup par numéro de DPE (id_dpe identique -> une seule entrée)", () => {
  const out = dedupeAndCollapseDpe([rec({ id_dpe: "a" }), rec({ id_dpe: "a" })]);
  assert.equal(out.length, 1);
});

test("collapse même unité (mêmes étage+complément+surface) -> garde le plus récent", () => {
  const out = dedupeAndCollapseDpe([
    rec({ id_dpe: "old", date_dpe: "2019-01-01", etage: "3", complement: "B", surface_m2: 62 }),
    rec({ id_dpe: "new", date_dpe: "2024-01-01", etage: "3", complement: "B", surface_m2: 62 }),
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].id_dpe, "new");
});

test("NE collapse PAS deux unités de même surface mais d'étages différents", () => {
  const out = dedupeAndCollapseDpe([
    rec({ id_dpe: "a", etage: "2", complement: "A", surface_m2: 60 }),
    rec({ id_dpe: "b", etage: "5", complement: "B", surface_m2: 60 }),
  ]);
  assert.equal(out.length, 2);
});

test("en cas de doute (étage/complément absents) -> garde les deux", () => {
  const out = dedupeAndCollapseDpe([
    rec({ id_dpe: "a", etage: null, complement: null, surface_m2: 60 }),
    rec({ id_dpe: "b", etage: null, complement: null, surface_m2: 60 }),
  ]);
  assert.equal(out.length, 2);
});

// ── Task 2 : règle d'attribution ─────────────────────────────────────────────

test("0 candidat -> not_found", () => {
  assert.deepEqual(dpeAttributionStatus([], "housenumber"), { status: "not_found" });
});

test("1 candidat maison + BAN housenumber -> auto_confirmed", () => {
  const r = rec({ id_dpe: "a", type_batiment: "maison" });
  const out = dpeAttributionStatus([r], "housenumber");
  assert.equal(out.status, "auto_confirmed");
});

test("1 candidat appartement -> selection_required (collectif)", () => {
  const r = rec({ id_dpe: "a", type_batiment: "appartement" });
  const out = dpeAttributionStatus([r], "housenumber");
  assert.equal(out.status, "selection_required");
});

test("1 candidat maison mais BAN non housenumber -> selection_required", () => {
  const r = rec({ id_dpe: "a", type_batiment: "maison" });
  const out = dpeAttributionStatus([r], "street");
  assert.equal(out.status, "selection_required");
});

test("2 candidats -> selection_required", () => {
  const out = dpeAttributionStatus([rec({ id_dpe: "a" }), rec({ id_dpe: "b" })], "housenumber");
  assert.equal(out.status, "selection_required");
});

// ── Task 3 : contexte DPE de l'adresse ───────────────────────────────────────

test("≥3 diagnostics résidentiels -> fourchette de classes", () => {
  const out = deriveAddressDpeContext([
    rec({ id_dpe: "a", etiquette_dpe: "D", type_batiment: "appartement" }),
    rec({ id_dpe: "b", etiquette_dpe: "F", type_batiment: "appartement" }),
    rec({ id_dpe: "c", etiquette_dpe: "E", type_batiment: "appartement" }),
  ]);
  assert.deepEqual(out, { count: 3, minLabel: "D", maxLabel: "F" });
});

test("<3 diagnostics -> null (repère non affiché)", () => {
  const out = deriveAddressDpeContext([
    rec({ id_dpe: "a", etiquette_dpe: "D" }),
    rec({ id_dpe: "b", etiquette_dpe: "F" }),
  ]);
  assert.equal(out, null);
});

test("classes manquantes exclues ; si <3 valides -> null", () => {
  const out = deriveAddressDpeContext([
    rec({ id_dpe: "a", etiquette_dpe: "D" }),
    rec({ id_dpe: "b", etiquette_dpe: null }),
    rec({ id_dpe: "c", etiquette_dpe: null }),
  ]);
  assert.equal(out, null);
});
