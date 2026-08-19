#!/usr/bin/env node
// Échange exceptionnel d'un dossier payé contre une autre adresse.
//
// Le script est en lecture seule par défaut. `--apply` appelle l'unique fonction SQL qui révoque
// l'ancien droit, crée le dossier de remplacement et émet la facture rectificative dans une seule
// transaction. Aucun identifiant client n'est codé en dur dans le dépôt.
//
// Usage :
//   node scripts/admin/replace-address-dossier.mjs \
//     --invoice FE-2026-0005 \
//     --address "204 Route de Catussou 47300 Villeneuve-sur-Lot" \
//     --reason "Échange d'adresse demandé par le client" [--apply]

import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const key = process.argv[i];
  if (key === "--apply") args.set(key, true);
  else if (key.startsWith("--") && process.argv[i + 1]) args.set(key, process.argv[++i]);
}

const invoiceNumber = String(args.get("--invoice") ?? "").trim();
const addressQuery = String(args.get("--address") ?? "").trim();
const reason = String(args.get("--reason") ?? "").trim();
const apply = args.get("--apply") === true;

if (!/^FE-\d{4}-\d{4,}$/.test(invoiceNumber) || !addressQuery || !reason) {
  console.error("--invoice, --address et --reason sont requis.");
  process.exit(2);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
  process.exit(2);
}

const banUrl = new URL("https://api-adresse.data.gouv.fr/search/");
banUrl.searchParams.set("q", addressQuery);
banUrl.searchParams.set("limit", "5");
const banResponse = await fetch(banUrl, { headers: { accept: "application/json" } });
if (!banResponse.ok) throw new Error(`BAN indisponible (${banResponse.status})`);
const banPayload = await banResponse.json();
const feature = (banPayload.features ?? []).find((f) => f?.properties?.type === "housenumber");
const p = feature?.properties;
const coordinates = feature?.geometry?.coordinates;
if (!p?.id || !p?.label || !p?.citycode || !p?.city || !p?.postcode || !coordinates) {
  throw new Error("La BAN ne confirme pas une adresse au numéro : échange refusé.");
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const { data: invoice, error: invoiceError } = await supabase
  .from("invoices")
  .select(
    "id, number, user_id, buyer_name, buyer_email, designation, amount_cents, " +
    "stripe_payment_intent_id, document_kind",
  )
  .eq("number", invoiceNumber)
  .maybeSingle();
if (invoiceError) throw new Error(`Lecture facture : ${invoiceError.message}`);
if (!invoice?.stripe_payment_intent_id || invoice.document_kind !== "original") {
  throw new Error("La facture d'origine payée est introuvable.");
}

const { data: original, error: dossierError } = await supabase
  .from("address_dossiers")
  .select("id, address_label, access_revoked_at")
  .eq("stripe_payment_intent_id", invoice.stripe_payment_intent_id)
  .maybeSingle();
if (dossierError) throw new Error(`Lecture dossier : ${dossierError.message}`);
if (!original) throw new Error("Le dossier rattaché à la facture est introuvable.");

const { count: targetCount, error: targetError } = await supabase
  .from("address_dossiers")
  .select("id", { count: "exact", head: true })
  .eq("ban_id", p.id)
  .is("access_revoked_at", null);
if (targetError) throw new Error(`Contrôle doublon : ${targetError.message}`);

const tariffSuffix = invoice.designation.match(/\s+\([^()]+\)\s*$/)?.[0] ?? "";
const newDesignation = `Dossier d'analyse d'une adresse — ${p.label}${tariffSuffix}`;

console.log(JSON.stringify({
  mode: apply ? "apply" : "dry-run",
  invoice: invoice.number,
  buyerName: invoice.buyer_name,
  buyerEmail: invoice.buyer_email,
  amountCents: invoice.amount_cents,
  oldAddress: original.address_label,
  newAddress: p.label,
  banId: p.id,
  precision: p.type,
  score: p.score,
  activeDossiersAlreadyAtTarget: targetCount ?? 0,
  newDesignation,
}, null, 2));

if (!apply) process.exit(0);
if ((targetCount ?? 0) > 0) {
  throw new Error("Un dossier actif existe déjà à l'adresse cible : application refusée.");
}

const { data: result, error: replaceError } = await supabase.rpc("replace_paid_address_dossier", {
  p_original_dossier_id: original.id,
  p_ban_id: p.id,
  p_insee: p.citycode,
  p_address_label: p.label,
  p_city: p.city,
  p_postcode: p.postcode,
  p_latitude: coordinates[1],
  p_longitude: coordinates[0],
  p_new_designation: newDesignation,
  p_reason: reason,
});
if (replaceError) throw new Error(`Échange refusé : ${replaceError.message}`);

const row = Array.isArray(result) ? result[0] : result;
if (!row?.replacement_dossier_id || !row?.correction_number) {
  throw new Error("La transaction n'a pas rendu le dossier et la facture attendus.");
}

const [{ data: replacement }, { data: revoked }, { data: correction }] = await Promise.all([
  supabase.from("address_dossiers")
    .select("ban_id, address_label, access_revoked_at, replacement_for_dossier_id")
    .eq("id", row.replacement_dossier_id).maybeSingle(),
  supabase.from("address_dossiers")
    .select("access_revoked_at")
    .eq("id", original.id).maybeSingle(),
  supabase.from("invoices")
    .select("number, buyer_name, buyer_email, corrected_designation, amount_cents, document_kind")
    .eq("number", row.correction_number).maybeSingle(),
]);

const verified = Boolean(
  replacement?.ban_id === p.id &&
  replacement?.access_revoked_at === null &&
  replacement?.replacement_for_dossier_id === original.id &&
  revoked?.access_revoked_at &&
  correction?.document_kind === "correction" &&
  correction?.buyer_name === invoice.buyer_name &&
  correction?.buyer_email === invoice.buyer_email &&
  correction?.corrected_designation === newDesignation &&
  correction?.amount_cents === invoice.amount_cents
);

console.log(JSON.stringify({
  applied: true,
  created: row.created,
  correctionInvoice: row.correction_number,
  address: replacement?.address_label ?? null,
  originalAccessRevoked: Boolean(revoked?.access_revoked_at),
  buyerNameUnchanged: correction?.buyer_name === invoice.buyer_name,
  amountUnchanged: correction?.amount_cents === invoice.amount_cents,
  verified,
}, null, 2));

if (!verified) process.exit(1);
