// LES INVARIANTS DE L'ARTEFACT PARTAGÉ ENTRE « AUTOUR DE L'ADRESSE » ET « LOGEMENT ».
//
// Depuis la bascule à trois modules (29/07/2026), deux modules écrivent la MÊME ligne `logement`,
// clé (user_id, logement_id) : Autour y dépose le snapshot du voisinage, Logement y dépose
// l'identité de l'adresse et le choix de diagnostic. Cette refonte a révélé deux couplages cachés
// qui ne levaient AUCUNE erreur :
//
//   1. la ligne d'artefact naissait d'un effet de bord de l'appel « autour ». Sans lui, la
//      persistance du DPE et de la synthèse (des UPDATE ciblés) devenait un no-op silencieux ;
//   2. un upsert écrivant toutes les colonnes dégradait ce qu'un autre module venait d'écrire
//      (une parcelle connue remise à null, un snapshot calculé effacé).
//
// Un commentaire ne protège pas de leur retour : ces tests figent le contrat d'écriture. Ils
// portent sur la fonction de persistance, pas sur la base — ce qu'on vérifie ici, c'est QUELLES
// COLONNES partent, ce qui est précisément le lieu des deux défauts.

import test from "node:test";
import assert from "node:assert/strict";
import { upsertLogementAddress } from "./logement-store.ts";

// Faux client Supabase : capture le payload et les options d'upsert, sans réseau ni base.
function captureUpsert() {
  const calls: { payload: Record<string, unknown>; options: unknown }[] = [];
  const sb = {
    from() {
      return {
        upsert(payload: Record<string, unknown>, options: unknown) {
          calls.push({ payload, options });
          return Promise.resolve({ error: null });
        },
      };
    },
  };
  // Le type réel (SupabaseClient) est bien plus large que ce dont la fonction se sert.
  return { sb: sb as never, calls };
}

const identity = {
  user_id: "u1",
  logement_id: "ban-42",
  insee: "17300",
  address_label: "1 rue Saint-Dominique, La Rochelle",
  city: "La Rochelle",
  postcode: "17000",
  latitude: 46.16,
  longitude: -1.15,
  parcel_code: "173000000A0123",
};

test("l'upsert d'identité n'écrit JAMAIS le snapshot ni la posture", async () => {
  // Le cœur de l'invariant : analyser un bâti ne doit pas effacer le voisinage déjà calculé,
  // ni la posture déjà déclarée. Les absents gardent leur valeur sur conflit.
  const { sb, calls } = captureUpsert();
  await upsertLogementAddress(sb, identity);
  const keys = Object.keys(calls[0].payload);
  assert.equal(keys.includes("snapshot"), false, "snapshot ne doit pas partir");
  assert.equal(keys.includes("posture"), false, "posture ne doit pas partir");
});

test("l'upsert d'identité ne touche à aucune colonne de synthèse ni de DPE", async () => {
  // Même raison : la synthèse et le choix de diagnostic ont leurs propres chemins d'écriture.
  const { sb, calls } = captureUpsert();
  await upsertLogementAddress(sb, identity);
  for (const forbidden of [
    "synthesis_text", "synthesis_fact_hash", "synthesis_generated_at",
    "dpe_selection_status", "selected_dpe_id", "selected_dpe_snapshot", "selected_dpe_at",
  ]) {
    assert.equal(forbidden in calls[0].payload, false, `${forbidden} ne doit pas partir`);
  }
});

test("une parcelle inconnue est OMISE, jamais écrite en null", async () => {
  // Le module Autour n'a pas de parcelle : écrire null dégraderait celle que le module Logement
  // avait résolue pour la même adresse.
  const { sb, calls } = captureUpsert();
  await upsertLogementAddress(sb, { ...identity, parcel_code: null });
  assert.equal("parcel_code" in calls[0].payload, false);
});

test("une parcelle connue est bien écrite", async () => {
  const { sb, calls } = captureUpsert();
  await upsertLogementAddress(sb, identity);
  assert.equal(calls[0].payload.parcel_code, "173000000A0123");
});

test("l'identité de l'adresse part en entier (sinon rien n'est rehydratable)", async () => {
  // city/postcode conditionnent la rehydratation : sans eux, l'adresse ne repasse pas le
  // validateur du re-fetch Géorisques et le dossier retombe sur la saisie.
  const { sb, calls } = captureUpsert();
  await upsertLogementAddress(sb, identity);
  const p = calls[0].payload;
  assert.equal(p.user_id, "u1");
  assert.equal(p.logement_id, "ban-42");
  assert.equal(p.insee, "17300");
  assert.equal(p.city, "La Rochelle");
  assert.equal(p.postcode, "17000");
  assert.equal(p.latitude, 46.16);
  assert.equal(p.longitude, -1.15);
  assert.ok(typeof p.updated_at === "string");
});

test("le conflit se résout sur (user_id, logement_id), la clé d'artefact", async () => {
  // La clé est l'ADRESSE, pas la commune (re-key migration 21) : deux biens d'une même ville
  // doivent coexister. Un onConflict sur la commune les ferait s'écraser l'un l'autre.
  const { sb, calls } = captureUpsert();
  await upsertLogementAddress(sb, identity);
  assert.deepEqual(calls[0].options, { onConflict: "user_id,logement_id" });
});
