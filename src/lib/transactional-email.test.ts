import assert from "node:assert/strict";
import test from "node:test";
import {
  DIGITAL_CONTENT_WITHDRAWAL_NOTICE,
  renderPurchaseConfirmationEmail,
  renderTransactionalEmail,
} from "./transactional-email.ts";

test("le gabarit porte l'identite de marque, un preheader et une version texte", () => {
  const email = renderTransactionalEmail({
    preheader: "Votre dossier est disponible.",
    eyebrow: "Dossier d'adresse",
    title: "Votre dossier est ouvert",
    paragraphs: ["Les constats sont accessibles dans votre espace."],
    cta: { label: "Ouvrir mon dossier", href: "https://futur-e.fr/rapport" },
    supportingText: "Votre facture reste disponible dans votre compte.",
    notice: DIGITAL_CONTENT_WITHDRAWAL_NOTICE,
  });

  assert.match(email.html, /futur-e-email\.png/);
  assert.match(email.html, /Votre dossier est disponible\./);
  assert.match(email.html, /Ouvrir mon dossier/);
  assert.match(email.html, /font-size:13px[^<]+Votre facture reste disponible/);
  assert.match(email.html, /article L221-28/);
  assert.match(email.text, /https:\/\/futur-e\.fr\/rapport/);
  assert.match(email.text, /Votre facture reste disponible/);
  assert.doesNotMatch(email.text, /<[^>]+>/);
});

test("les valeurs metier ne peuvent pas injecter du HTML", () => {
  const email = renderTransactionalEmail({
    preheader: "Facture jointe",
    eyebrow: "Facture <FE-1>",
    title: "Votre facture",
    paragraphs: ['Dossier du 1 <script>alert("x")</script>'],
  });

  assert.doesNotMatch(email.html, /<script>/);
  assert.match(email.html, /&lt;script&gt;/);
  assert.match(email.html, /Facture &lt;FE-1&gt;/);
});

test("sans mention, le gabarit ne laisse aucune trace du bloc", () => {
  const email = renderTransactionalEmail({
    preheader: "p", eyebrow: "e", title: "t", paragraphs: ["corps"],
  });
  assert.doesNotMatch(email.html, /rétractation/);
  assert.doesNotMatch(email.text, /rétractation/);
});

test("la confirmation d'achat remercie, aide a decider et invite a repondre", () => {
  const email = renderPurchaseConfirmationEmail({
    kind: "address",
    addressLabel: "1 rue du Test",
    invoiceAttached: true,
  });

  assert.match(email.html, /Merci beaucoup pour votre commande/);
  assert.match(email.html, /futur•e vous aidera/);
  assert.match(email.html, /nous restons disponibles/);
  assert.match(email.html, /Répondez simplement à cet e-mail/);
  assert.match(email.html, /Ouvrir mon dossier/);
  assert.match(email.html, /font-size:13px[^<]+Pour vos archives, votre facture est jointe/);
  assert.doesNotMatch(email.html, /article L221-28/);
});

test("sans facture, la confirmation d'achat garde le support durable necessaire", () => {
  const email = renderPurchaseConfirmationEmail({
    kind: "territory",
    commune: "Nantes",
    invoiceAttached: false,
  });

  assert.match(email.html, /article L221-28/);
  assert.doesNotMatch(email.html, /Votre facture est jointe/);
});

test("les trois achats passent par le meme modele de confirmation", () => {
  const emails = [
    renderPurchaseConfirmationEmail({
      kind: "address", addressLabel: "1 rue du Test", invoiceAttached: true,
    }),
    renderPurchaseConfirmationEmail({ kind: "pack", invoiceAttached: true }),
    renderPurchaseConfirmationEmail({
      kind: "territory", commune: "Nantes", invoiceAttached: true,
    }),
  ];

  for (const email of emails) {
    assert.match(email.text, /Merci beaucoup pour votre commande/);
    assert.match(email.text, /Si quelque chose n'est pas clair/);
    assert.match(email.text, /Pour vos archives, votre facture est jointe/);
  }
});
