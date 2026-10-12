// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-10 · INTÉGRATION STRIPE, MODE TEST UNIQUEMENT.
//
// Vérifie sur la vraie API Stripe les deux hypothèses dont dépend le verrou du contexte :
//   1. même clé d'idempotence + mêmes paramètres = MÊME PaymentIntent (corriger ses réponses n'en crée
//      pas un second) ;
//   2. la réponse idempotente REJOUE l'objet de la création, statut compris : après confirmation, elle
//      dit encore `requires_payment_method`. D'où le `retrieve` de la route avant toute mise à jour.
// Puis confirme le paiement avec la carte de test `pm_card_visa` et vérifie que le statut final n'est
// plus modifiable (`statutStripeModifiable`).
//
// SÉCURITÉ : le garde-fou refuse toute clé qui n'est pas `sk_test_` (sortie 2 : NON exécuté, jamais un
// faux feu vert). Aucun paiement réel possible.
//
// Lancement :
//   node scripts/integration/fut10-stripe-test.mjs   (environnement de test chargé ; sortie 2 s'il n'est pas isolé)
// Webhook de bout en bout (application locale lancée avec des clés de TEST et une base de TEST) :
//   stripe listen --forward-to localhost:3000/api/stripe/webhook
//   stripe trigger payment_intent.succeeded   # ne porte pas de dossier_intents : rejet attendu (500, rejoué)
// ════════════════════════════════════════════════════════════════════════════════════════════
import Stripe from "stripe";
import assert from "node:assert/strict";
import { statutStripeModifiable } from "../../src/lib/verrou-intention-dossier.ts";

// La même clé que l'application de test (STRIPE_SECRET_KEY), et le même garde-fou que les autres scripts.
import { exigerEnvironnementIsole } from "./garde-environnement.mjs";
exigerEnvironnementIsole();
const cle = process.env.STRIPE_SECRET_KEY ?? "";
const stripe = new Stripe(cle);
const tentative = `fut10-integration-${Date.now()}`;
const params = {
  amount: 3900, currency: "eur", payment_method_types: ["card"],
  metadata: { productType: "address-dossier", checkoutAttemptId: tentative },
};

const a = await stripe.paymentIntents.create(params, { idempotencyKey: `dossier_test_${tentative}` });
const b = await stripe.paymentIntents.create(params, { idempotencyKey: `dossier_test_${tentative}` });
assert.equal(b.id, a.id, "même clé, mêmes paramètres : même PaymentIntent");
assert.equal(a.livemode, false, "mode test");
assert.equal(statutStripeModifiable(a.status), true);
// Aucune donnée de projet ni de relation dans les métadonnées.
assert.deepEqual(Object.keys(a.metadata).sort(), ["checkoutAttemptId", "productType"]);

const confirme = await stripe.paymentIntents.confirm(a.id, { payment_method: "pm_card_visa" });
assert.equal(confirme.status, "succeeded");
assert.equal(statutStripeModifiable((await stripe.paymentIntents.retrieve(a.id)).status), false);

const rejoue = await stripe.paymentIntents.create(params, { idempotencyKey: `dossier_test_${tentative}` });
console.log(`statut rejoué par la réponse idempotente après confirmation : ${rejoue.status}`);
assert.equal(statutStripeModifiable((await stripe.paymentIntents.retrieve(rejoue.id)).status), false,
  "seul `retrieve` dit l'état réel");
console.log(`✔ Stripe (mode test) : ${a.id} créé une fois, confirmé, verrouillable.`);
