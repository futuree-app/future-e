#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════════════════
// Vérifie les privilèges de `address_dossiers` CONTRE LA BASE RÉELLE, avec un vrai JWT.
//
// Pourquoi un script et pas un test : une policy ne s'éprouve pas contre un client simulé. Un test
// qui imite Supabase vérifierait notre propre logique contre nos propres chaînes, ce que la
// journée du 29/07 a précisément reproché aux anciens tests. Ici, si un privilège a été oublié,
// l'écriture RÉUSSIT et le script échoue.
//
// Usage (jamais de mot de passe en argument : il resterait dans l'historique du shell et dans la
// liste des processus) :
//
//   TEST_USER_EMAIL=… TEST_USER_PASSWORD=… TEST_OTHER_USER_ID=… \
//     node scripts/verify-address-dossiers-rls.mjs
//
// TEST_OTHER_USER_ID est l'identifiant d'un SECOND compte. Sans une ligne étrangère réellement
// présente, le test d'isolation réussirait sur une table qui n'en contient aucune, donc pour la
// mauvaise raison.
//
// Le script nettoie ce qu'il a créé, y compris en cas d'échec.
// ════════════════════════════════════════════════════════════════════════════

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// .env.local n'est pas chargé automatiquement hors Next.
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const { TEST_USER_EMAIL, TEST_USER_PASSWORD, TEST_OTHER_USER_ID } = process.env;

if (!URL_ || !ANON || !SERVICE || !TEST_USER_EMAIL || !TEST_USER_PASSWORD || !TEST_OTHER_USER_ID) {
  console.error(
    "Manque : NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, " +
      "TEST_USER_EMAIL, TEST_USER_PASSWORD, TEST_OTHER_USER_ID.",
  );
  process.exit(1);
}

const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });
const failures = [];
const created = [];

function expectRefused(label, { data, error }) {
  // Deux formes de refus possibles : une erreur (privilège révoqué), ou zéro ligne touchée
  // (la RLS a filtré). Les deux sont acceptables ; une ligne touchée ne l'est pas.
  if (error) return;
  if (Array.isArray(data) && data.length === 0) return;
  failures.push(`${label} : l'écriture a ABOUTI (${JSON.stringify(data)})`);
}

async function seed(userId, label) {
  const { data, error } = await admin
    .from("address_dossiers")
    .insert({
      user_id: userId,
      ban_id: `rls-check-${label}`,
      insee: "44109",
      address_label: `Vérification RLS ${label}`,
      city: "Nantes",
      postcode: "44000",
      latitude: 47.218,
      longitude: -1.553,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Préparation impossible (${label}) : ${error.message}`);
  created.push(data.id);
  return data.id;
}

try {
  const { user, client } = await signIn();
  const mine = await seed(user.id, "mine");
  const foreign = await seed(TEST_OTHER_USER_ID, "foreign");

  expectRefused(
    "1. INSERT d'un dossier pour soi",
    await client.from("address_dossiers").insert({
      user_id: user.id, ban_id: "rls-check-insert", insee: "44109",
      address_label: "Interdit", latitude: 47.2, longitude: -1.5,
    }).select("id"),
  );

  expectRefused(
    "2. UPDATE de snapshot",
    await client.from("address_dossiers").update({ snapshot: { hack: true } }).eq("id", mine).select("id"),
  );

  expectRefused(
    "3. UPDATE de stripe_payment_intent_id",
    await client.from("address_dossiers").update({ stripe_payment_intent_id: "pi_forge" }).eq("id", mine).select("id"),
  );

  expectRefused(
    "4. DELETE de son propre dossier",
    await client.from("address_dossiers").delete().eq("id", mine).select("id"),
  );

  const own = await client.from("address_dossiers").select("id").eq("id", mine);
  if (own.error || own.data?.length !== 1) {
    failures.push(`5. SELECT de son dossier : attendu 1 ligne, obtenu ${own.data?.length ?? own.error?.message}`);
  }

  const other = await client.from("address_dossiers").select("id").eq("id", foreign);
  if (other.data?.length) {
    failures.push("6. ISOLATION : le dossier d'un autre compte est LISIBLE");
  }

  // 7. La révocation doit être une révocation de DROIT, pas d'interface : sans la clause
  // `access_revoked_at is null` dans la policy SELECT, la ligne resterait lisible ici.
  await admin.from("address_dossiers").update({ access_revoked_at: new Date().toISOString() }).eq("id", mine);
  const revoked = await client.from("address_dossiers").select("id").eq("id", mine);
  if (revoked.data?.length) {
    failures.push("7. RÉVOCATION : un dossier révoqué reste LISIBLE (clause absente de la policy)");
  }
} catch (err) {
  failures.push(`Interrompu : ${err.message}`);
} finally {
  if (created.length) {
    await admin.from("address_dossiers").delete().in("id", created);
  }
}

if (failures.length) {
  console.error("RLS EN DÉFAUT :");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("RLS vérifiée : 4 écritures refusées, lecture propre OK, isolation OK, révocation OK.");

async function signIn() {
  const client = createClient(URL_, ANON, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });
  if (error) throw new Error(`Connexion impossible : ${error.message}`);
  return { user: data.user, client };
}
