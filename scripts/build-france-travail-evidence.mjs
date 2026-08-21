#!/usr/bin/env node

/**
 * Construit le journal commercial pseudonymisé du dossier France Travail.
 *
 * Sources autoritatives :
 *   - `invoices` pour les pièces comptables et leur numérotation ;
 *   - Stripe Live pour l'encaissement, les remboursements et les litiges ;
 *   - `payments`, `dossier_intents` et `address_dossiers` pour la réconciliation ;
 *   - `decision_artifact` et `email_deliveries` pour les traces de production.
 *
 * Le script est strictement en lecture seule vis-à-vis de Supabase et Stripe. Il n'écrit que
 * les deux journaux pseudonymisés dans le dossier documentaire local.
 *
 * Usage :
 *   node scripts/build-france-travail-evidence.mjs
 *   node scripts/build-france-travail-evidence.mjs --no-write
 *   node scripts/build-france-travail-evidence.mjs --cutoff=2026-08-20T23:59:59.999+02:00
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const DEFAULT_CUTOFF = "2026-08-20T23:59:59.999+02:00";
const DEFAULT_OUTPUT_DIR = "docs/france-travail-activite-conservee";

function loadLocalEnv() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

function parseArgs(argv) {
  const cutoffArg = argv.find((arg) => arg.startsWith("--cutoff="));
  const outputArg = argv.find((arg) => arg.startsWith("--output="));
  return {
    cutoff: cutoffArg?.slice("--cutoff=".length) ?? DEFAULT_CUTOFF,
    outputDir: outputArg?.slice("--output=".length) ?? DEFAULT_OUTPUT_DIR,
    write: !argv.includes("--no-write"),
  };
}

function assertDate(value, label) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} invalide : ${value}`);
  return date;
}

function asTime(value) {
  return value ? new Date(value).getTime() : Number.NaN;
}

function atOrBefore(value, cutoffMs) {
  const time = asTime(value);
  return Number.isFinite(time) && time <= cutoffMs;
}

function formatParis(value) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (type) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")} Europe/Paris`;
}

function formatEuros(cents) {
  return `${(cents / 100).toFixed(2).replace(".", ",")} EUR`;
}

function csv(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function unique(values) {
  return [...new Set(values.filter((value) => value !== null && value !== undefined && value !== ""))];
}

async function selectAll(supabase, table, columns) {
  const pageSize = 1000;
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`Lecture ${table} impossible : ${error.message}`);
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < pageSize) return rows;
  }
}

function productLabel(productType) {
  if (productType === "address-dossier") return "Dossier d'adresse";
  if (productType === "one-shot") return "Dossier de territoire";
  if (productType === "decision-pack") return "Dossier comparatif";
  return productType || "Produit non renseigné";
}

async function stripeEvidence(stripe, invoice) {
  const paymentIntent = await stripe.paymentIntents.retrieve(
    invoice.stripe_payment_intent_id,
    { expand: ["latest_charge"] },
  );
  const charge = typeof paymentIntent.latest_charge === "object"
    ? paymentIntent.latest_charge
    : null;
  const refunds = await stripe.refunds.list({
    payment_intent: paymentIntent.id,
    limit: 100,
  });

  return {
    id: paymentIntent.id,
    livemode: paymentIntent.livemode,
    status: paymentIntent.status,
    amount: paymentIntent.amount,
    amountReceived: paymentIntent.amount_received,
    currency: paymentIntent.currency,
    chargeCreatedAt: charge?.created
      ? new Date(charge.created * 1000).toISOString()
      : new Date(paymentIntent.created * 1000).toISOString(),
    chargePaid: charge?.paid ?? null,
    chargeDisputed: charge?.disputed ?? false,
    refunds: refunds.data.map((refund) => ({
      id: refund.id,
      amount: refund.amount,
      status: refund.status,
      createdAt: new Date(refund.created * 1000).toISOString(),
    })),
    promoLabel: paymentIntent.metadata?.promoLabel || null,
    productType: paymentIntent.metadata?.productType || null,
  };
}

async function classifyUnmatchedPayment(stripe, payment) {
  try {
    const pi = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id);
    return {
      id: payment.stripe_payment_intent_id,
      classification: pi.livemode ? "live_sans_facture" : "test",
      status: pi.status,
      amountCents: pi.amount_received,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      id: payment.stripe_payment_intent_id,
      classification: /test mode/i.test(message) ? "test" : "introuvable",
      status: payment.status,
      amountCents: Math.round(Number(payment.amount) * 100),
    };
  }
}

function buildMarkdown(summary, rows, diagnostics, extractionIso, cutoff) {
  const lines = [
    "# Journal commercial pseudonymisé",
    "",
    `Extraction effectuée le ${formatParis(extractionIso)}. Coupure appliquée : ${cutoff}.`,
    "",
    "Ce journal ne retient que les paiements confirmés par Stripe Live et rattachés à une facture originale. Les identités sont remplacées par des pseudonymes stables pour cette extraction.",
    "",
    "## Synthèse",
    "",
    `- Clients payants distincts : **${summary.distinctClients}**`,
    `- Contrôle de déduplication : **${summary.distinctBillingEmails} e-mails de facturation distincts** et **${summary.distinctBillingNames} noms déclarés distincts**`,
    `- Commandes réelles : **${summary.orders}**`,
    `- Paiements Stripe Live réussis : **${summary.successfulPayments}**`,
    `- Chiffre d'affaires brut encaissé : **${formatEuros(summary.grossReceivedCents)}**`,
    `- Remboursements constatés avant la coupure : **${formatEuros(summary.refundedByCutoffCents)}**`,
    `- Montant net conservé à la coupure : **${formatEuros(summary.netAtCutoffCents)}**`,
    `- Remboursements constatés à la date d'extraction : **${formatEuros(summary.refundedAtExtractionCents)}**`,
    `- Montant net conservé à la date d'extraction : **${formatEuros(summary.netAtExtractionCents)}**`,
    `- Dossiers commandés et payés : **${summary.paidDossiers}**`,
    `- Objets de dossier produits, remplacement compris : **${summary.producedDossierObjects}**`,
    `- Livraisons actives à la coupure : **${summary.activeDeliveries}**`,
    `- Communes distinctes commandées : **${summary.distinctOrderedCommunes}**`,
    `- Communes distinctes finalement livrées : **${summary.distinctDeliveredCommunes}**`,
    `- Adresses distinctes finalement livrées : **${summary.distinctDeliveredAddresses}**`,
    `- Commandes avec au moins un artefact d'adresse figé et prêt : **${summary.ordersWithReadyAddressArtifact}**`,
    `- Livraisons avec une photographie d'analyse enregistrée : **${summary.deliveriesWithSnapshot}**`,
    `- Livraisons avec un choix de diagnostic renseigné : **${summary.deliveriesWithDpeSelection}**`,
    `- Livraisons avec une synthèse enregistrée : **${summary.deliveriesWithSynthesis}**`,
    `- Commandes avec une trace d'e-mail transactionnel : **${summary.ordersWithEmailTrace}**`,
    `- Première vente : **${formatParis(summary.firstSaleAt)}**`,
    `- Dernière vente retenue : **${formatParis(summary.lastSaleAt)}**`,
    "",
    `La différence entre ${summary.paidDossiers} dossiers payés et ${summary.producedDossierObjects} objets produits vient d'un remplacement d'adresse sans second encaissement. Le dossier initial reste archivé et révoqué, un nouveau dossier actif porte la livraison corrigée.`,
    "",
    "## Commandes",
    "",
    "| Date d'encaissement | Client | Commande | Offre | Encaissé | Commune commandée | Commune livrée | Dossiers produits | Livraison | Artefact de décision |",
    "|---|---|---|---|---:|---|---|---:|---|---|",
  ];

  for (const row of rows) {
    lines.push(
      `| ${formatParis(row.paymentAt)} | ${row.client} | ${row.orderId} | ${row.offer} | ${formatEuros(row.amountReceivedCents)} | ${row.orderedCommune} | ${row.deliveredCommune} | ${row.producedDossiers} | ${row.deliveryStatus} | ${row.artifactStatus} |`,
    );
  }

  lines.push(
    "",
    "## Éléments exclus des ventes réelles",
    "",
  );
  if (!diagnostics.excludedPayments.length) {
    lines.push("Aucun paiement technique supplémentaire n'a été trouvé avant la coupure.");
  } else {
    lines.push(
      "| Référence | Classement | Montant enregistré | Motif d'exclusion |",
      "|---|---|---:|---|",
    );
    for (const item of diagnostics.excludedPayments) {
      const reason = item.classification === "test"
        ? "Objet Stripe appartenant au mode Test, sans facture de production"
        : "Paiement non rapproché d'une facture de production, à investiguer";
      lines.push(`| ${item.id} | ${item.classification} | ${formatEuros(item.amountCents)} | ${reason} |`);
    }
  }

  lines.push(
    "",
    "## Définitions",
    "",
    "- Un client est un compte de facturation distinct ayant au moins une commande Stripe Live retenue.",
    "- Une commande correspond à une facture originale et à son PaymentIntent Stripe. Une facture rectificative ne crée pas une commande.",
    "- Un dossier payé est la ligne `address_dossiers` portant le PaymentIntent de la commande.",
    "- Un objet de dossier produit inclut aussi un éventuel dossier de remplacement, même sans nouvel encaissement.",
    "- Un artefact de décision est une version figée de l'analyse. Son absence ne signifie pas l'absence de droit ou de rapport : l'application sait aussi assembler le dossier depuis les faits courants.",
    "",
    "Les identifiants Stripe sont conservés pour permettre le rapprochement avec l'export officiel. Aucune identité, adresse postale complète ou donnée bancaire n'est incluse.",
    "",
  );
  return lines.join("\n");
}

function buildCsv(rows) {
  const headers = [
    "Date et heure d'encaissement",
    "Client pseudonymisé",
    "Commande",
    "Offre",
    "Tarif appliqué",
    "Montant facturé EUR",
    "Écart au tarif public EUR",
    "Montant encaissé EUR",
    "Statut Stripe",
    "PaymentIntent Stripe",
    "Commune commandée",
    "Commune livrée",
    "Dossiers produits",
    "Livraisons actives",
    "Date de production",
    "Statut de livraison",
    "Artefacts prêts",
    "Versions d'artefact",
    "Remboursement avant coupure EUR",
    "Litige",
    "Source technique",
  ];
  const body = rows.map((row) => [
    formatParis(row.paymentAt),
    row.client,
    row.orderId,
    row.offer,
    row.tariffLabel,
    (row.invoicedCents / 100).toFixed(2),
    (row.publicPriceGapCents / 100).toFixed(2),
    (row.amountReceivedCents / 100).toFixed(2),
    row.stripeStatus,
    row.paymentIntentId,
    row.orderedCommune,
    row.deliveredCommune,
    row.producedDossiers,
    row.activeDeliveries,
    formatParis(row.productionAt),
    row.deliveryStatus,
    row.readyArtifacts,
    row.artifactVersions,
    (row.refundedByCutoffCents / 100).toFixed(2),
    row.disputed ? "oui" : "non",
    row.source,
  ].map(csv).join(","));
  return [headers.map(csv).join(","), ...body].join("\n") + "\n";
}

loadLocalEnv();
const options = parseArgs(process.argv.slice(2));
const cutoff = assertDate(options.cutoff, "Date de coupure");
const cutoffMs = cutoff.getTime();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey || !stripeKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY et STRIPE_SECRET_KEY sont requis.");
}
if (!stripeKey.startsWith("sk_live_")) {
  throw new Error("STRIPE_SECRET_KEY doit être une clé Live pour produire ce dossier.");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const stripe = new Stripe(stripeKey);
const extractionIso = new Date().toISOString();

const [invoices, payments, intents, dossiers, artifacts, emailDeliveries] = await Promise.all([
  selectAll(supabase, "invoices", "id,number,seq,user_id,buyer_name,buyer_email,product_type,amount_cents,currency,stripe_payment_intent_id,issued_at,payment_received_at,document_kind,corrects_invoice_id,replacement_dossier_id"),
  selectAll(supabase, "payments", "user_id,stripe_payment_intent_id,amount,product_type,status,target_insee,created_at"),
  selectAll(supabase, "dossier_intents", "stripe_payment_intent_id,user_id,ban_id,insee,city,postcode,amount_due_cents,territory_deduction_cents,created_at"),
  selectAll(supabase, "address_dossiers", "id,user_id,ban_id,insee,city,postcode,stripe_payment_intent_id,amount_paid_cents,purchased_at,access_revoked_at,created_at,replacement_for_dossier_id,dpe_selection_status,snapshot,synthesis_generated_at,updated_at"),
  selectAll(supabase, "decision_artifact", "id,user_id,insee_code,scope_key,version,status,generated_at,created_at"),
  selectAll(supabase, "email_deliveries", "stripe_payment_intent_id,kind,status,provider_id,attempts,created_at,updated_at"),
]);

const originalInvoiceCandidates = invoices
  .filter((invoice) => invoice.document_kind === "original")
  .sort((a, b) => asTime(a.payment_received_at ?? a.issued_at) - asTime(b.payment_received_at ?? b.issued_at));
const corrections = invoices
  .filter((invoice) => invoice.document_kind === "correction")
  .filter((invoice) => atOrBefore(invoice.issued_at, cutoffMs));

const stripeRows = [];
for (const invoice of originalInvoiceCandidates) {
  if (!invoice.stripe_payment_intent_id) {
    throw new Error(`Facture originale ${invoice.number} sans PaymentIntent Stripe.`);
  }
  stripeRows.push(await stripeEvidence(stripe, invoice));
}
const stripeById = new Map(stripeRows.map((row) => [row.id, row]));
// La date Stripe de la charge gouverne la coupure. L'émission de la facture suit normalement de
// quelques secondes, mais elle pourrait franchir minuit sans changer la date réelle d'encaissement.
const originalInvoices = originalInvoiceCandidates.filter((invoice) => {
  const stripeRow = stripeById.get(invoice.stripe_payment_intent_id);
  return stripeRow && atOrBefore(stripeRow.chargeCreatedAt, cutoffMs);
});
const invoicePiIds = new Set(originalInvoices.map((invoice) => invoice.stripe_payment_intent_id));

const unmatchedPayments = payments
  .filter((payment) => atOrBefore(payment.created_at, cutoffMs))
  .filter((payment) => !invoicePiIds.has(payment.stripe_payment_intent_id));
const excludedPayments = [];
for (const payment of unmatchedPayments) {
  excludedPayments.push(await classifyUnmatchedPayment(stripe, payment));
}

const clientKeys = unique(originalInvoices.map((invoice) => invoice.user_id ?? `invoice:${invoice.id}`));
const clientPseudonyms = new Map(clientKeys.map((key, index) => [key, `C${String(index + 1).padStart(3, "0")}`]));
const rows = [];
const anomalies = [];
const dossiersAtCutoff = dossiers.filter((dossier) => atOrBefore(dossier.created_at, cutoffMs));
const numberedPiecesAtCutoff = invoices
  .filter((invoice) => atOrBefore(invoice.issued_at, cutoffMs))
  .sort((a, b) => a.seq - b.seq);
for (let index = 0; index < numberedPiecesAtCutoff.length; index += 1) {
  const expected = index + 1;
  if (numberedPiecesAtCutoff[index].seq !== expected) {
    anomalies.push(`Numérotation des factures : rang ${expected} absent avant la pièce ${numberedPiecesAtCutoff[index].number}.`);
  }
}

for (const invoice of originalInvoices) {
  const pi = stripeById.get(invoice.stripe_payment_intent_id);
  if (!pi) throw new Error(`Stripe absent pour ${invoice.number}.`);
  if (!pi.livemode || pi.status !== "succeeded" || pi.chargePaid === false) {
    throw new Error(`${invoice.number} n'est pas un paiement Stripe Live réussi.`);
  }
  if (pi.amountReceived !== invoice.amount_cents) {
    anomalies.push(`${invoice.number} : Stripe ${pi.amountReceived} c, facture ${invoice.amount_cents} c.`);
  }

  const payment = payments.find((item) =>
    item.stripe_payment_intent_id === pi.id && atOrBefore(item.created_at, cutoffMs)
  );
  const intent = intents.find((item) =>
    item.stripe_payment_intent_id === pi.id && atOrBefore(item.created_at, cutoffMs)
  );
  const paidDossier = dossiersAtCutoff.find((item) => item.stripe_payment_intent_id === pi.id);
  if (!payment) anomalies.push(`${invoice.number} : ligne payments absente.`);
  if (!intent) anomalies.push(`${invoice.number} : intention de dossier absente.`);
  if (!paidDossier) anomalies.push(`${invoice.number} : dossier payé absent.`);
  if (payment && Math.round(Number(payment.amount) * 100) !== pi.amountReceived) {
    anomalies.push(`${invoice.number} : payments ne porte pas le montant Stripe.`);
  }
  if (paidDossier && paidDossier.amount_paid_cents !== pi.amountReceived) {
    anomalies.push(`${invoice.number} : address_dossiers ne porte pas le montant Stripe.`);
  }

  const correction = corrections.find((item) => item.corrects_invoice_id === invoice.id);
  const replacement = correction?.replacement_dossier_id
    ? dossiersAtCutoff.find((item) => item.id === correction.replacement_dossier_id)
    : paidDossier
      ? dossiersAtCutoff.find((item) => item.replacement_for_dossier_id === paidDossier.id)
      : null;
  const deliveredDossier = replacement ?? paidDossier;
  const orderDossiers = [paidDossier, replacement].filter(Boolean);
  const dossierArtifacts = artifacts.filter((artifact) =>
    orderDossiers.some((dossier) => artifact.scope_key === `logement:${dossier.id}`)
    && atOrBefore(artifact.created_at, cutoffMs)
  );
  const readyArtifacts = dossierArtifacts.filter((artifact) => artifact.status === "ready");
  const refundsByCutoff = pi.refunds
    .filter((refund) => refund.status === "succeeded" && atOrBefore(refund.createdAt, cutoffMs))
    .reduce((sum, refund) => sum + refund.amount, 0);
  const refundsAtExtraction = pi.refunds
    .filter((refund) => refund.status === "succeeded")
    .reduce((sum, refund) => sum + refund.amount, 0);
  const invoiceBaseCents = invoice.product_type === "address-dossier" ? 3900 : invoice.amount_cents;
  const emailStatuses = emailDeliveries
    .filter((email) => email.stripe_payment_intent_id === pi.id)
    .filter((email) => atOrBefore(email.created_at, cutoffMs))
    .map((email) => email.status);

  rows.push({
    client: clientPseudonyms.get(invoice.user_id ?? `invoice:${invoice.id}`),
    orderId: invoice.number,
    offer: productLabel(invoice.product_type),
    tariffLabel: pi.promoLabel || (invoice.amount_cents < invoiceBaseCents ? "Tarif particulier" : "Tarif public"),
    paymentAt: pi.chargeCreatedAt,
    productionAt: replacement?.created_at ?? paidDossier?.created_at ?? invoice.issued_at,
    invoicedCents: invoice.amount_cents,
    publicPriceGapCents: Math.max(0, invoiceBaseCents - invoice.amount_cents),
    amountReceivedCents: pi.amountReceived,
    refundedByCutoffCents: refundsByCutoff,
    refundedAtExtractionCents: refundsAtExtraction,
    stripeStatus: pi.status,
    paymentIntentId: pi.id,
    disputed: pi.chargeDisputed,
    orderedCommune: paidDossier?.city ?? intent?.city ?? payment?.target_insee ?? "Non retrouvée",
    orderedInsee: paidDossier?.insee ?? intent?.insee ?? payment?.target_insee ?? null,
    orderedAddressKey: paidDossier?.ban_id ?? intent?.ban_id ?? null,
    deliveredCommune: deliveredDossier?.city ?? "Non retrouvée",
    deliveredInsee: deliveredDossier?.insee ?? null,
    deliveredAddressKey: deliveredDossier?.ban_id ?? null,
    producedDossiers: orderDossiers.length,
    activeDeliveries: deliveredDossier
      && (!deliveredDossier.access_revoked_at || !atOrBefore(deliveredDossier.access_revoked_at, cutoffMs))
      ? 1
      : 0,
    deliveryStatus: replacement
      ? "dossier initial remplacé, nouvelle livraison active"
      : paidDossier?.access_revoked_at && atOrBefore(paidDossier.access_revoked_at, cutoffMs)
        ? "accès révoqué"
        : "dossier actif",
    readyArtifacts: readyArtifacts.length,
    artifactVersions: dossierArtifacts.length,
    artifactStatus: readyArtifacts.length
      ? `${readyArtifacts.length} version(s) prête(s)`
      : "aucun artefact figé",
    emailStatus: unique(emailStatuses).join(", ") || "absence de trace persistée",
    hasSnapshot: Boolean(deliveredDossier?.snapshot),
    hasDpeSelection: Boolean(
      deliveredDossier?.dpe_selection_status
      && deliveredDossier.dpe_selection_status !== "pending"
    ),
    hasSynthesis: Boolean(deliveredDossier?.synthesis_generated_at),
    source: `Stripe Live ${pi.id} + facture ${invoice.number} + address_dossiers`,
  });
}

const firstSaleAt = rows.at(0)?.paymentAt ?? null;
const lastSaleAt = rows.at(-1)?.paymentAt ?? null;
const grossReceivedCents = rows.reduce((sum, row) => sum + row.amountReceivedCents, 0);
const refundedByCutoffCents = rows.reduce((sum, row) => sum + row.refundedByCutoffCents, 0);
const refundedAtExtractionCents = rows.reduce((sum, row) => sum + row.refundedAtExtractionCents, 0);
const summary = {
  cutoff: options.cutoff,
  extractedAt: extractionIso,
  distinctClients: unique(rows.map((row) => row.client)).length,
  distinctBillingEmails: unique(originalInvoices.map((invoice) => invoice.buyer_email.trim().toLowerCase())).length,
  distinctBillingNames: unique(originalInvoices.map((invoice) => invoice.buyer_name.trim().toLowerCase())).length,
  orders: rows.length,
  successfulPayments: rows.filter((row) => row.stripeStatus === "succeeded").length,
  grossReceivedCents,
  refundedByCutoffCents,
  netAtCutoffCents: grossReceivedCents - refundedByCutoffCents,
  refundedAtExtractionCents,
  netAtExtractionCents: grossReceivedCents - refundedAtExtractionCents,
  paidDossiers: rows.length,
  producedDossierObjects: rows.reduce((sum, row) => sum + row.producedDossiers, 0),
  activeDeliveries: rows.reduce((sum, row) => sum + row.activeDeliveries, 0),
  distinctOrderedCommunes: unique(rows.map((row) => row.orderedInsee)).length,
  distinctDeliveredCommunes: unique(rows.map((row) => row.deliveredInsee)).length,
  distinctDeliveredAddresses: unique(rows.map((row) => row.deliveredAddressKey)).length,
  firstSaleAt,
  lastSaleAt,
  readyAddressArtifacts: rows.reduce((sum, row) => sum + row.readyArtifacts, 0),
  addressArtifactVersions: rows.reduce((sum, row) => sum + row.artifactVersions, 0),
  ordersWithReadyAddressArtifact: rows.filter((row) => row.readyArtifacts > 0).length,
  deliveriesWithSnapshot: rows.filter((row) => row.hasSnapshot).length,
  deliveriesWithDpeSelection: rows.filter((row) => row.hasDpeSelection).length,
  deliveriesWithSynthesis: rows.filter((row) => row.hasSynthesis).length,
  ordersWithEmailTrace: rows.filter((row) => row.emailStatus !== "absence de trace persistée").length,
  replacedOrders: rows.filter((row) => row.producedDossiers > 1).length,
};

if (rows.some((row) => row.disputed)) anomalies.push("Au moins un paiement porte un litige Stripe.");
if (refundedByCutoffCents > 0) anomalies.push("Au moins un remboursement est intervenu avant la coupure.");

const diagnostics = { excludedPayments, anomalies };
const csvOutput = buildCsv(rows);
const markdownOutput = buildMarkdown(summary, rows, diagnostics, extractionIso, options.cutoff);

if (options.write) {
  const outputDir = resolve(options.outputDir);
  if (!existsSync(outputDir)) {
    throw new Error(`Le dossier de sortie n'existe pas : ${outputDir}`);
  }
  writeFileSync(resolve(outputDir, "01-journal-commercial.csv"), csvOutput, "utf8");
  writeFileSync(resolve(outputDir, "01-journal-commercial.md"), markdownOutput, "utf8");
}

console.log(JSON.stringify({ summary, diagnostics }, null, 2));

if (anomalies.length) process.exitCode = 2;
