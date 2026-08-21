#!/usr/bin/env node

/**
 * Exporte les preuves financières Stripe Live utiles au dossier France Travail.
 *
 * Le script est strictement en lecture seule vis-à-vis de Stripe. Il écrit des fichiers
 * minimisés (sans nom, e-mail, adresse ni moyen de paiement client) dans le dossier demandé.
 *
 * Usage :
 *   node scripts/export-france-travail-stripe.mjs \
 *     --output=/private/tmp/france-travail-stripe-2026-08-20
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import Stripe from "stripe";

const DEFAULT_START = "2026-08-13T00:00:00.000+02:00";
const DEFAULT_CUTOFF = "2026-08-20T23:59:59.999+02:00";

function loadLocalEnv() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

function argValue(name) {
  return process.argv.find((arg) => arg.startsWith(`${name}=`))?.slice(name.length + 1);
}

function unixSeconds(value, label) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} invalide : ${value}`);
  return Math.floor(date.getTime() / 1000);
}

function csv(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function euros(cents) {
  return (Number(cents ?? 0) / 100).toFixed(2);
}

function formatParisFromUnix(seconds) {
  if (!seconds) return "";
  const date = new Date(seconds * 1000);
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")} Europe/Paris`;
}

async function listAll(listPage, params) {
  const rows = [];
  let startingAfter;
  do {
    const page = await listPage({
      ...params,
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    rows.push(...page.data);
    startingAfter = page.has_more ? page.data.at(-1)?.id : undefined;
  } while (startingAfter);
  return rows;
}

function sourceId(value) {
  if (!value) return "";
  return typeof value === "string" ? value : value.id;
}

function writeCsv(path, headers, rows) {
  const lines = [headers.map(csv).join(",")];
  for (const row of rows) lines.push(row.map(csv).join(","));
  writeFileSync(path, `${lines.join("\n")}\n`, "utf8");
}

loadLocalEnv();

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey?.startsWith("sk_live_")) {
  throw new Error("STRIPE_SECRET_KEY Live est requise ; refus d'exporter depuis le mode Test.");
}

const outputDir = resolve(argValue("--output") ?? "/private/tmp/france-travail-stripe-2026-08-20");
const startIso = argValue("--start") ?? DEFAULT_START;
const cutoffIso = argValue("--cutoff") ?? DEFAULT_CUTOFF;
const start = unixSeconds(startIso, "Début");
const cutoff = unixSeconds(cutoffIso, "Coupure");
const extractionIso = new Date().toISOString();
const extractionUnix = Math.floor(Date.now() / 1000);

mkdirSync(outputDir, { recursive: true });

const stripe = new Stripe(secretKey);
const [account, balance, charges, disputes, payouts, periodBalanceTransactions, openingBalanceTransactions] = await Promise.all([
  stripe.accounts.retrieve(),
  stripe.balance.retrieve(),
  listAll((params) => stripe.charges.list(params), {
    created: { gte: start, lte: cutoff },
    expand: ["data.balance_transaction"],
  }),
  listAll((params) => stripe.disputes.list(params), {
    created: { gte: start, lte: extractionUnix },
  }),
  listAll((params) => stripe.payouts.list(params), {
    created: { gte: unixSeconds("2026-08-01T00:00:00.000+02:00", "Début versements"), lte: extractionUnix },
    expand: ["data.balance_transaction", "data.failure_balance_transaction"],
  }),
  listAll((params) => stripe.balanceTransactions.list(params), {
    created: { gte: start, lte: extractionUnix },
  }),
  listAll((params) => stripe.balanceTransactions.list(params), {
    created: { lte: start - 1 },
  }),
]);

const liveCharges = charges
  .filter((charge) => charge.livemode)
  .sort((a, b) => a.created - b.created);
const successfulCharges = liveCharges.filter(
  (charge) => charge.status === "succeeded" && charge.paid,
);

const chargeTransactions = [];
for (const charge of liveCharges) {
  if (!charge.balance_transaction) continue;
  chargeTransactions.push(
    typeof charge.balance_transaction === "string"
      ? await stripe.balanceTransactions.retrieve(charge.balance_transaction)
      : charge.balance_transaction,
  );
}

const payoutTransactions = [];
for (const payout of payouts) {
  for (const value of [payout.balance_transaction, payout.failure_balance_transaction]) {
    if (!value) continue;
    payoutTransactions.push(
      typeof value === "string"
        ? await stripe.balanceTransactions.retrieve(value)
        : value,
    );
  }
}

const transactionsById = new Map();
for (const transaction of [...periodBalanceTransactions, ...chargeTransactions, ...payoutTransactions]) {
  transactionsById.set(transaction.id, transaction);
}
const relatedTransactions = [...transactionsById.values()].sort((a, b) => a.created - b.created);
const transactionBySource = new Map(
  relatedTransactions.map((transaction) => [sourceId(transaction.source), transaction]),
);

writeCsv(
  resolve(outputDir, "P03A_Paiements_Stripe_Live_2026-08-13_au_2026-08-20.csv"),
  [
    "Date de charge",
    "PaymentIntent",
    "Charge",
    "Statut",
    "Payée",
    "Retenue comme vente",
    "Montant brut EUR",
    "Remboursé EUR",
    "Litige",
    "Transaction de solde",
    "Frais Stripe EUR",
    "Net Stripe EUR",
    "Statut du solde",
    "Disponible le",
  ],
  liveCharges.map((charge) => {
    const transaction = transactionBySource.get(charge.id);
    return [
      formatParisFromUnix(charge.created),
      sourceId(charge.payment_intent),
      charge.id,
      charge.status,
      charge.paid,
      charge.status === "succeeded" && charge.paid,
      euros(charge.amount),
      euros(charge.amount_refunded),
      charge.disputed,
      transaction?.id,
      euros(transaction?.fee),
      euros(transaction?.net),
      transaction?.status,
      formatParisFromUnix(transaction?.available_on),
    ];
  }),
);

writeCsv(
  resolve(outputDir, "P03B_Transactions_solde_Stripe_Live.csv"),
  [
    "Date",
    "Transaction de solde",
    "Type",
    "Catégorie comptable",
    "Source Stripe",
    "Montant EUR",
    "Frais EUR",
    "Net EUR",
    "Statut",
    "Disponible le",
    "Description",
  ],
  relatedTransactions.map((transaction) => [
    formatParisFromUnix(transaction.created),
    transaction.id,
    transaction.type,
    transaction.reporting_category,
    sourceId(transaction.source),
    euros(transaction.amount),
    euros(transaction.fee),
    euros(transaction.net),
    transaction.status,
    formatParisFromUnix(transaction.available_on),
    transaction.description,
  ]),
);

writeCsv(
  resolve(outputDir, "P03C_Versements_Stripe_Live_a_la_banque.csv"),
  [
    "Date de création",
    "Versement Stripe",
    "Statut",
    "Montant EUR",
    "Date d’arrivée prévue",
    "Méthode",
    "Automatique",
    "Description",
    "Code d’échec",
    "Message d’échec",
  ],
  payouts.sort((a, b) => a.created - b.created).map((payout) => [
    formatParisFromUnix(payout.created),
    payout.id,
    payout.status,
    euros(payout.amount),
    formatParisFromUnix(payout.arrival_date),
    payout.method,
    payout.automatic,
    payout.description,
    payout.failure_code,
    payout.failure_message,
  ]),
);

const balanceRows = [];
for (const category of ["available", "pending", "connect_reserved", "instant_available"]) {
  for (const item of balance[category] ?? []) {
    balanceRows.push([category, item.currency, euros(item.amount)]);
  }
}
writeCsv(
  resolve(outputDir, "P03D_Solde_Stripe_Live_a_la_date_extraction.csv"),
  ["Catégorie", "Devise", "Montant"],
  balanceRows,
);

const grossCents = successfulCharges.reduce((sum, charge) => sum + charge.amount, 0);
const refundedCents = successfulCharges.reduce((sum, charge) => sum + charge.amount_refunded, 0);
const feeCents = chargeTransactions.reduce((sum, transaction) => sum + transaction.fee, 0);
const netCents = chargeTransactions.reduce((sum, transaction) => sum + transaction.net, 0);
const paidPayoutCents = payouts
  .filter((payout) => payout.status === "paid")
  .reduce((sum, payout) => sum + payout.amount, 0);
const pendingBalanceCents = (balance.pending ?? [])
  .filter((item) => item.currency === "eur")
  .reduce((sum, item) => sum + item.amount, 0);
const availableBalanceCents = (balance.available ?? [])
  .filter((item) => item.currency === "eur")
  .reduce((sum, item) => sum + item.amount, 0);
const periodBalanceMovementCents = relatedTransactions.reduce(
  (sum, transaction) => sum + transaction.net,
  0,
);
const openingBalanceCents = openingBalanceTransactions
  .filter((transaction) => transaction.currency === "eur")
  .reduce((sum, transaction) => sum + transaction.net, 0);
const reportedBalanceCents = availableBalanceCents + pendingBalanceCents;
const reconstructedBalanceCents = openingBalanceCents + periodBalanceMovementCents;

const controls = [
  "# Contrôle des exports Stripe Live",
  "",
  `Extraction API Stripe authentifiée : ${extractionIso}.`,
  `Compte Stripe : ${account.id} (${account.country ?? "pays non renseigné"}, devise ${account.default_currency ?? "non renseignée"}).`,
  `Période des charges : ${startIso} au ${cutoffIso}.`,
  "",
  "## Résultats",
  "",
  `- Tentatives de charge Live trouvées : **${liveCharges.length}**`,
  `- Charges réussies et payées retenues comme ventes : **${successfulCharges.length}**`,
  `- Tentatives échouées exclues du chiffre d'affaires : **${liveCharges.length - successfulCharges.length}**`,
  `- Montant brut : **${euros(grossCents)} EUR**`,
  `- Remboursements constatés : **${euros(refundedCents)} EUR**`,
  `- Litiges constatés depuis le 13 août : **${disputes.length}**`,
  `- Frais Stripe rattachés aux charges : **${euros(feeCents)} EUR**`,
  `- Net Stripe rattaché aux charges : **${euros(netCents)} EUR**`,
  `- Solde net antérieur à la période : **${euros(openingBalanceCents)} EUR**`,
  `- Variation nette du solde Stripe sur la période, versements inclus : **${euros(periodBalanceMovementCents)} EUR**`,
  `- Versements bancaires Stripe créés depuis le 1er août : **${payouts.length}**`,
  `- Versements au statut paid : **${euros(paidPayoutCents)} EUR**`,
  `- Solde EUR disponible à l'extraction : **${euros(availableBalanceCents)} EUR**`,
  `- Solde EUR en attente à l'extraction : **${euros(pendingBalanceCents)} EUR**`,
  `- Solde EUR total reconstitué : **${euros(reconstructedBalanceCents)} EUR**`,
  `- Solde EUR total retourné par Stripe : **${euros(reportedBalanceCents)} EUR**`,
  "",
  "## Contrôles attendus pour le dossier",
  "",
  `- Nombre attendu de ventes : 13 — ${successfulCharges.length === 13 ? "conforme" : "À INVESTIGUER"}`,
  `- Montant brut attendu : 247,00 EUR — ${grossCents === 24700 ? "conforme" : "À INVESTIGUER"}`,
  `- Aucun remboursement attendu — ${refundedCents === 0 ? "conforme" : "À INVESTIGUER"}`,
  `- Aucun litige attendu — ${disputes.length === 0 ? "conforme" : "À INVESTIGUER"}`,
  `- Rapprochement du solde — ${reconstructedBalanceCents === reportedBalanceCents ? "conforme" : "À INVESTIGUER"}`,
  "",
  "Les fichiers sont volontairement minimisés : aucune identité client, adresse postale ou donnée bancaire n'est exportée. Cet export atteste l'état retourné par l'API Stripe Live à la date d'extraction ; il complète, mais ne remplace pas, le relevé bancaire.",
  "",
].join("\n");
writeFileSync(resolve(outputDir, "P03E_Controle_exports_Stripe_Live.md"), controls, "utf8");

const exportFiles = readdirSync(outputDir).filter((name) => name.startsWith("P03"));
const manifest = exportFiles
  .sort()
  .map((name) => {
    const digest = createHash("sha256").update(readFileSync(resolve(outputDir, name))).digest("hex");
    return `${digest}  ${name}`;
  })
  .join("\n");
writeFileSync(resolve(outputDir, "SHA256SUMS.txt"), `${manifest}\n`, "utf8");

console.log(JSON.stringify({
  outputDir,
  extractionIso,
  chargeAttempts: liveCharges.length,
  successfulCharges: successfulCharges.length,
  grossEur: euros(grossCents),
  refundedEur: euros(refundedCents),
  disputes: disputes.length,
  feesEur: euros(feeCents),
  netEur: euros(netCents),
  payouts: payouts.length,
  paidPayoutEur: euros(paidPayoutCents),
  availableBalanceEur: euros(availableBalanceCents),
  pendingBalanceEur: euros(pendingBalanceCents),
  files: [...exportFiles, "SHA256SUMS.txt"],
}, null, 2));
