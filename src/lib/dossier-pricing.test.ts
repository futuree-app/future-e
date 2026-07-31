import test from "node:test";
import assert from "node:assert/strict";
import { DOSSIER_PRICE, quoteForDossier } from "./dossier-pricing.ts";

test("plein tarif quand le territoire n'a pas été payé", () => {
  assert.deepEqual(quoteForDossier(false), {
    basePriceCents: 3900,
    territoryDeductionCents: 0,
    amountDueCents: 3900,
    promoLabel: null,
  });
});

test("tarif d'approfondissement quand le territoire a été payé", () => {
  assert.deepEqual(quoteForDossier(true), {
    basePriceCents: 3900,
    territoryDeductionCents: 1400,
    amountDueCents: 2500,
    promoLabel: null,
  });
});

test("la déduction est exactement le prix du Territoire", () => {
  // Sinon un lecteur qui a payé 14 € puis 25 € n'aurait pas payé le même total que
  // celui qui paie 39 € d'un coup.
  assert.equal(
    DOSSIER_PRICE.fullCents - DOSSIER_PRICE.territoryDeductionCents,
    DOSSIER_PRICE.deepeningCents,
  );
});

test("aucun montant négatif n'est atteignable", () => {
  assert.ok(quoteForDossier(true).amountDueCents > 0);
  assert.ok(quoteForDossier(false).amountDueCents > 0);
});
