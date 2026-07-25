import { test } from "node:test";
import assert from "node:assert/strict";
import { dpeAttributionStatus } from "./dpe-attribution.ts";
import { ADEME_TYPES_BATIMENT, ADEME_CLASSES_DPE, BAN_TYPES } from "./fixtures-sources-externes.ts";

// CONTRAT DE DONNÉES — ADEME (DPE) et BAN (géocodage).
//
// L'attribution automatique d'un DPE est la décision la PLUS lourde de conséquences du module Logement :
// elle rattache un diagnostic énergétique à un logement précis. Elle repose sur deux valeurs venues
// d'API — `type_batiment` (ADEME) et le type de la feature BAN — comparées par des chaînes littérales.
// C'est exactement la configuration qui a produit le bug « feux de forêt » sur Géorisques.

const dpe = (over: Record<string, unknown> = {}) => ({
  numero_dpe: "1", type_batiment: "maison", etiquette_dpe: "F", date_etablissement_dpe: "2023-01-01",
  adresse_ban: "10 rue X", ...over,
} as never);

test("CONTRAT — « maison » (la forme ADEME réelle) autorise l'attribution automatique", () => {
  const r = dpeAttributionStatus([dpe()], "housenumber");
  assert.equal(r.status, "auto_confirmed");
});

test("CONTRAT — les DEUX autres types réels de l'ADEME l'interdisent", () => {
  // « appartement » et « immeuble » : on ne sait pas de quel logement le diagnostic parle.
  for (const t of ADEME_TYPES_BATIMENT.filter((x) => x !== "maison")) {
    assert.equal(dpeAttributionStatus([dpe({ type_batiment: t })], "housenumber").status, "selection_required",
      `« ${t} » ne doit pas déclencher une attribution automatique`);
  }
});

test("CONTRAT — seule la précision BAN « housenumber » autorise l'attribution", () => {
  for (const t of BAN_TYPES.filter((x) => x !== "housenumber")) {
    assert.equal(dpeAttributionStatus([dpe()], t).status, "selection_required",
      `la précision « ${t} » ne désigne pas un bâtiment`);
  }
});

test("CONTRAT — les sept classes réelles sont toutes acceptées, aucune n'est filtrée par erreur", () => {
  for (const c of ADEME_CLASSES_DPE) {
    const r = dpeAttributionStatus([dpe({ etiquette_dpe: c })], "housenumber");
    assert.equal(r.status, "auto_confirmed", `la classe ${c} devrait passer`);
  }
});

test("CONTRAT — une valeur INCONNUE de l'ADEME ne passe jamais en automatique", () => {
  // Le jour où la source ajoute un type (« local commercial », « bâtiment mixte »…), le produit doit
  // demander confirmation plutôt que de deviner. Le défaut sûr est la question, pas l'attribution.
  assert.equal(dpeAttributionStatus([dpe({ type_batiment: "bâtiment mixte" })], "housenumber").status, "selection_required");
  assert.equal(dpeAttributionStatus([dpe({ type_batiment: null })], "housenumber").status, "selection_required");
});
