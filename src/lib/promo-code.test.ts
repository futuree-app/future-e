import test from "node:test";
import assert from "node:assert/strict";
import { resolvePromo, promoExists } from "./promo-code.ts";
import { quoteForDossier, DOSSIER_PRICE } from "./dossier-pricing.ts";

const PENDANT = new Date("2026-08-15T10:00:00+02:00");
const APRES = new Date("2026-10-01T00:00:01+02:00");

// ── Résolution du code ─────────────────────────────────────────────────────────────────────

test("le code se saisit sans casse et sans souci d'espaces", () => {
  for (const saisie of ["BETA", "beta", "Beta", "  bEtA  "]) {
    assert.equal(resolvePromo(saisie, "address-dossier", PENDANT)?.code, "BETA", saisie);
  }
});

test("un code inconnu ne donne rien", () => {
  assert.equal(resolvePromo("AMIS", "address-dossier", PENDANT), null);
  assert.equal(resolvePromo("", "address-dossier", PENDANT), null);
  assert.equal(resolvePromo("   ", "address-dossier", PENDANT), null);
  assert.equal(resolvePromo(null, "address-dossier", PENDANT), null);
  assert.equal(resolvePromo(42, "address-dossier", PENDANT), null);
});

test("le code EXPIRE, un tarif de lancement sans fin devient le prix", () => {
  assert.ok(resolvePromo("BETA", "address-dossier", PENDANT));
  assert.equal(resolvePromo("BETA", "address-dossier", APRES), null);
});

test("le dernier instant du 30 septembre est encore valide", () => {
  // La borne est INCLUSE, et en heure de Paris : un `Z` ferait expirer le code deux heures trop
  // tôt pour quelqu'un qui achète le 30 au soir.
  const juste = new Date("2026-09-30T23:59:59+02:00");
  assert.ok(resolvePromo("BETA", "address-dossier", juste));
});

test("le code ne vaut QUE pour le dossier d'adresse", () => {
  assert.ok(resolvePromo("BETA", "address-dossier", PENDANT));
  assert.equal(resolvePromo("BETA", "one-shot", PENDANT), null);
  assert.equal(resolvePromo("BETA", "pack-decision", PENDANT), null);
});

test("promoExists distingue un code inconnu d'un code expiré", () => {
  // Pour que l'écran puisse dire « ce code a expiré » plutôt que « code invalide », qui laisserait
  // croire à une faute de frappe.
  assert.equal(promoExists("beta"), true);
  assert.equal(promoExists("AMIS"), false);
  assert.equal(resolvePromo("beta", "address-dossier", APRES), null);
});

// ── Le devis, et le piège du cumul ─────────────────────────────────────────────────────────

test("sans code, rien ne change : les deux tarifs historiques tiennent", () => {
  assert.deepEqual(quoteForDossier(false), {
    basePriceCents: 3900, territoryDeductionCents: 0, amountDueCents: 3900, promoLabel: null,
  });
  assert.deepEqual(quoteForDossier(true), {
    basePriceCents: 3900, territoryDeductionCents: 1400, amountDueCents: 2500, promoLabel: null,
  });
});

test("LE CODE EST UN PLANCHER : jamais cumulé avec la déduction territoriale", () => {
  // Le défaut qui casserait silencieusement. Cumuler 1900 et une déduction de 1400 donnerait
  // 500 ; et si le code avait été posé à 14 € comme initialement envisagé, 0 €, que Stripe
  // refuse. Le montant dû est le même, territoire payé ou non.
  const promo = resolvePromo("BETA", "address-dossier", PENDANT)!;
  const sansTerritoire = quoteForDossier(false, promo);
  const avecTerritoire = quoteForDossier(true, promo);

  assert.equal(sansTerritoire.amountDueCents, 1900);
  assert.equal(avecTerritoire.amountDueCents, 1900);
  assert.equal(avecTerritoire.territoryDeductionCents, 0, "la déduction est annulée, pas soustraite");
});

test("le devis avec code reste très au-dessus du minimum encaissable par Stripe", () => {
  const promo = resolvePromo("BETA", "address-dossier", PENDANT)!;
  assert.ok(quoteForDossier(true, promo).amountDueCents >= 50);
});

test("le libellé du tarif voyage jusqu'à la facture", () => {
  const promo = resolvePromo("BETA", "address-dossier", PENDANT)!;
  assert.equal(quoteForDossier(false, promo).promoLabel, "Tarif de lancement");
  assert.equal(quoteForDossier(false).promoLabel, null);
});

test("le tarif de lancement reste inférieur au plein tarif et au tarif d'approfondissement", () => {
  // Un code qui coûterait plus cher que le prix normal serait un piège, pas un cadeau.
  const promo = resolvePromo("BETA", "address-dossier", PENDANT)!;
  assert.ok(promo.amountCents < DOSSIER_PRICE.fullCents);
  assert.ok(promo.amountCents < DOSSIER_PRICE.deepeningCents);
});
