import assert from "node:assert/strict";
import test from "node:test";
import {
  DIGITAL_CONTENT_WITHDRAWAL_NOTICE,
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
