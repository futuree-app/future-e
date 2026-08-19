import test from "node:test";
import assert from "node:assert/strict";
import {
  designationFor, formatEuro, formatDateFr, normalizeBuyerName,
  invoiceCorrectionNotice, invoiceDocumentTitle, invoiceFileName, invoiceSettlementNotice,
  sellerSnapshot, type Invoice,
} from "./invoice.ts";

// ── Désignation ────────────────────────────────────────────────────────────────────────────
// Elle doit décrire la PRESTATION, pas nommer un produit : un tiers qui lit la facture ne
// connaît pas le catalogue.

test("désignation : le sujet complète la prestation quand il existe", () => {
  assert.equal(
    designationFor("address-dossier", "2 Le Cros 15100 Anglards-de-Saint-Flour"),
    "Dossier d'analyse d'une adresse — 2 Le Cros 15100 Anglards-de-Saint-Flour",
  );
});

test("désignation : sans sujet, la prestation seule, jamais un tiret orphelin", () => {
  assert.equal(designationFor("one-shot", null), "Rapport d'analyse territoriale d'une commune");
  assert.equal(designationFor("one-shot", "   "), "Rapport d'analyse territoriale d'une commune");
});

test("désignation : le tarif appliqué s'écrit, quand il n'est pas le tarif public", () => {
  // Sans lui, une facture à 19 € pour un produit affiché 39 € oblige à retrouver pourquoi, et
  // c'est la première question qu'un comptable ou un tiers pose.
  assert.equal(
    designationFor("address-dossier", "2 Le Cros 15100 Anglards-de-Saint-Flour", "Tarif de lancement"),
    "Dossier d'analyse d'une adresse — 2 Le Cros 15100 Anglards-de-Saint-Flour (Tarif de lancement)",
  );
});

test("désignation : sans tarif particulier, aucune parenthèse vide", () => {
  const attendu = "Dossier d'analyse d'une adresse — 12 rue X";
  assert.equal(designationFor("address-dossier", "12 rue X"), attendu);
  assert.equal(designationFor("address-dossier", "12 rue X", null), attendu);
  assert.equal(designationFor("address-dossier", "12 rue X", "   "), attendu);
});

test("désignation : un tarif sans sujet reste lisible", () => {
  assert.equal(
    designationFor("address-dossier", null, "Tarif de lancement"),
    "Dossier d'analyse d'une adresse (Tarif de lancement)",
  );
});

test("désignation : les trois produits sont couverts", () => {
  for (const p of ["one-shot", "pack-decision", "address-dossier"] as const) {
    assert.ok(designationFor(p, null).length > 10, `${p} a une désignation`);
  }
});

// ── Montants ───────────────────────────────────────────────────────────────────────────────
// Le montant vient de Stripe. Ces tests fixent la TYPOGRAPHIE, qui figure sur un document légal.

// Les mêmes échappements que la lib : un littéral tapé au clavier rendrait ces tests illisibles
// et leurs échecs incompréhensibles. Ce qu'on fixe ici, c'est bien QUEL codepoint est utilisé.
const FIN = "\u202f"; // fine insécable, séparateur de milliers
const NB = "\u00a0"; // insécable, avant le symbole
const EUR = "\u20ac";

test("montant : les deux tarifs du dossier, et celui du rapport", () => {
  assert.equal(formatEuro(3900), `39,00${NB}${EUR}`);
  assert.equal(formatEuro(2500), `25,00${NB}${EUR}`);
  assert.equal(formatEuro(1400), `14,00${NB}${EUR}`);
});

test("montant : les centimes non ronds ne sont pas tronqués", () => {
  assert.equal(formatEuro(1999), `19,99${NB}${EUR}`);
  assert.equal(formatEuro(105), `1,05${NB}${EUR}`);
  assert.equal(formatEuro(5), `0,05${NB}${EUR}`);
});

test("montant : séparateur de milliers, pour le jour où un montant B2B passe ici", () => {
  assert.equal(formatEuro(123456), `1${FIN}234,56${NB}${EUR}`);
  assert.equal(formatEuro(100000000), `1${FIN}000${FIN}000,00${NB}${EUR}`);
});

test("montant : virgule décimale, jamais de point, et les espaces sont INSÉCABLES", () => {
  // Une espace ordinaire laisserait le montant se couper en fin de ligne dans le PDF.
  const s = formatEuro(123456);
  assert.ok(s.includes(","), "virgule décimale");
  assert.equal(s.includes("."), false, "jamais de point décimal");
  assert.equal(s.includes(" "), false, "aucune espace ordinaire");
  assert.ok(s.includes(FIN) && s.includes(NB));
});

// ── Dates ──────────────────────────────────────────────────────────────────────────────────

test("date : format long français en UTC", () => {
  assert.equal(formatDateFr("2026-07-31T09:12:00.000Z"), "31 juillet 2026");
  assert.equal(formatDateFr("2026-01-01T00:00:00.000Z"), "1 janvier 2026");
  assert.equal(formatDateFr("2026-12-31T23:59:59.000Z"), "31 décembre 2026");
});

// ── Nom de facturation ─────────────────────────────────────────────────────────────────────
// Le garde-fou qui empêche d'émettre une pièce non conforme. Une facture sans nom de client ne
// vaut rien là où elle sert, donc mieux vaut ne pas l'émettre et demander le nom.

test("nom : espaces normalisés, jamais rendus tels quels", () => {
  assert.equal(normalizeBuyerName("  Quentin   Brache  "), "Quentin Brache");
});

test("nom : refusé quand il ne nomme personne", () => {
  assert.equal(normalizeBuyerName(""), null);
  assert.equal(normalizeBuyerName("   "), null);
  assert.equal(normalizeBuyerName("."), null);
  assert.equal(normalizeBuyerName("--"), null);
  assert.equal(normalizeBuyerName("12"), null, "des chiffres ne nomment personne");
  assert.equal(normalizeBuyerName(null), null);
  assert.equal(normalizeBuyerName(undefined), null);
  assert.equal(normalizeBuyerName(42), null);
});

test("nom : accepté dès qu'une lettre le porte, y compris hors alphabet latin", () => {
  assert.equal(normalizeBuyerName("Éva"), "Éva");
  assert.equal(normalizeBuyerName("Ngô Đình"), "Ngô Đình");
  assert.equal(normalizeBuyerName("Λάμπρος"), "Λάμπρος");
});

test("nom : borné, pour ne pas laisser un client écrire une page dans une facture", () => {
  const long = "a".repeat(500);
  assert.equal(normalizeBuyerName(long)?.length, 120);
});

// ── Identité du vendeur figée ──────────────────────────────────────────────────────────────

test("vendeur : la mention EI accompagne le nom, obligation de 2022", () => {
  const s = sellerSnapshot();
  assert.ok(s.nameWithForm.includes("Entrepreneur individuel"));
  assert.ok(s.nameWithForm.includes(s.legalName));
});

test("vendeur : le SIRET est présent et fait quatorze chiffres", () => {
  const s = sellerSnapshot();
  assert.match(s.siret, /^\d{14}$/);
});

test("vendeur : l'instantané est un objet plat, sérialisable tel quel en jsonb", () => {
  const s = sellerSnapshot();
  assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});

// ── Nom de fichier ─────────────────────────────────────────────────────────────────────────

test("fichier : porte le numéro et aucune espace", () => {
  const f = invoiceFileName("FE-2026-0001");
  assert.equal(f, "futur-e-facture-FE-2026-0001.pdf");
  assert.equal(/\s/.test(f), false);
});

// ── Facture rectificative ─────────────────────────────────────────────────────────────────

const FACTURE_RECTIFICATIVE: Invoice = {
  number: "FE-2026-0006",
  issuedAt: "2026-08-18T08:00:00.000Z",
  paymentReceivedAt: "2026-08-17T15:23:48.000Z",
  buyerName: "Brache Dominique",
  buyerEmail: "client@example.test",
  seller: sellerSnapshot(),
  designation: "Dossier d'analyse d'une adresse — 204 Route de Catussou 47300 Villeneuve-sur-Lot (Tarif de lancement)",
  amountCents: 1900,
  vatMention: "TVA non applicable, art. 293 B du CGI",
  correction: {
    correctsNumber: "FE-2026-0005",
    correctsIssuedAt: "2026-08-17T15:24:00.000Z",
    reason: "Échange d'adresse demandé par le client",
  },
};

test("rectificative : le document dit quelle facture il annule et remplace", () => {
  assert.equal(invoiceDocumentTitle(FACTURE_RECTIFICATIVE), "FACTURE RECTIFICATIVE");
  assert.equal(
    invoiceCorrectionNotice(FACTURE_RECTIFICATIVE),
    "Cette facture annule et remplace la facture FE-2026-0005 du 17 août 2026.",
  );
});

test("rectificative : la date du paiement reste celle du débit initial, pas celle de la correction", () => {
  const notice = invoiceSettlementNotice(FACTURE_RECTIFICATIVE);
  assert.match(notice, /Paiement reçu le 17 août 2026/);
  assert.match(notice, /Prestation de remplacement exécutée le 18 août 2026/);
  assert.doesNotMatch(notice, /Paiement reçu le 18 août 2026/);
  assert.match(notice, /FE-2026-0005/);
});

test("facture d'origine : aucune mention de correction n'est inventée", () => {
  const originale = { ...FACTURE_RECTIFICATIVE, correction: null };
  assert.equal(invoiceDocumentTitle(originale), "FACTURE");
  assert.equal(invoiceCorrectionNotice(originale), null);
  assert.match(invoiceSettlementNotice(originale), /paiement reçu le 17 août 2026/i);
  assert.doesNotMatch(invoiceSettlementNotice(originale), /remplacement|FE-2026-0005/i);
});
