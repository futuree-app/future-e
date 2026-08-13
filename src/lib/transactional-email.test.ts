import assert from "node:assert/strict";
import test from "node:test";
import {
  DIGITAL_CONTENT_WITHDRAWAL_NOTICE,
  mentionSiFactureAbsente,
  renderTransactionalEmail,
} from "./transactional-email.ts";

test("le gabarit porte l'identite de marque, un preheader et une version texte", () => {
  const email = renderTransactionalEmail({
    preheader: "Votre dossier est disponible.",
    eyebrow: "Dossier d'adresse",
    title: "Votre dossier est ouvert",
    paragraphs: ["Les constats sont accessibles dans votre espace."],
    cta: { label: "Ouvrir mon dossier", href: "https://futur-e.fr/rapport" },
    notice: DIGITAL_CONTENT_WITHDRAWAL_NOTICE,
  });

  assert.match(email.html, /futur-e-email\.png/);
  assert.match(email.html, /Votre dossier est disponible\./);
  assert.match(email.html, /Ouvrir mon dossier/);
  assert.match(email.html, /article L221-28/);
  assert.match(email.text, /https:\/\/futur-e\.fr\/rapport/);
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

test("la mention de renoncement n'entre dans l'e-mail QUE si la facture manque", () => {
  // La facture est le support durable normal, et le message ne répète pas ce qu'elle porte. Mais
  // `buildInvoiceAttachment` rend un tableau vide quand la facture n'a pas pu être émise : l'e-mail
  // devient alors le seul support durable, et sans la mention, la troisième condition de l'article
  // L221-28 13° manquerait, alors même que l'acheteur a coché la case.
  assert.equal(mentionSiFactureAbsente([{ filename: "futur-e-facture-FE-2026-0001.pdf" }]), undefined);
  assert.equal(mentionSiFactureAbsente([]), DIGITAL_CONTENT_WITHDRAWAL_NOTICE);
});

test("sans mention, le gabarit ne laisse aucune trace du bloc", () => {
  const email = renderTransactionalEmail({
    preheader: "p", eyebrow: "e", title: "t", paragraphs: ["corps"],
    notice: mentionSiFactureAbsente([{ filename: "f.pdf" }]),
  });
  assert.doesNotMatch(email.html, /rétractation/);
  assert.doesNotMatch(email.text, /rétractation/);
});
