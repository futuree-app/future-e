// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-10 · LE PARCOURS RÉEL DE BOUT EN BOUT, SUR UNE APPLICATION LOCALE ET DES SERVICES DE TEST.
//
//   qualification → PaymentIntent → verrou → confirmation (carte de test) → webhook SIGNÉ → dossier
//   → première lecture ; puis rejeu du webhook, et tentative de modification après confirmation.
//
// `stripe trigger payment_intent.succeeded` ne remplace PAS ce scénario : l'événement générique n'a pas
// de `dossier_intents`, le webhook le rejette (comportement voulu), et rien n'est prouvé du contexte.
//
// PRÉREQUIS (absents du poste au 12/10/2026) :
//   1. Supabase local avec le schéma de test (voir `fut10-supabase-local.mjs`, étapes 1 et 2) ;
//   2. un fichier d'environnement de TEST (jamais `.env.local`), chargé dans ce shell ET dans l'app :
//        STRIPE_SECRET_KEY=sk_test_…   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_…
//        STRIPE_WEBHOOK_SECRET=whsec_… (affiché par `stripe listen`)
//        NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321  SUPABASE_SERVICE_ROLE_KEY=…  NEXT_PUBLIC_SUPABASE_ANON_KEY=…
//        RESEND_API_KEY=re_factice_fut10  NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=phc_factice_fut10
//        NEXT_PUBLIC_POSTHOG_HOST=http://127.0.0.1:9  DOSSIER_NARRATIVE=false
//   3. `stripe login` (mode test), puis : stripe listen --forward-to localhost:3000/api/stripe/webhook
//   4. l'application : npx next dev --webpack -p 3000 (avec ce même environnement)
//   5. node scripts/integration/fut10-bout-en-bout.mjs
//
// Aucune carte réelle : `4242 4242 4242 4242` n'existe qu'en mode test, et le garde-fou refuse toute
// clé qui n'est pas de test.
// ════════════════════════════════════════════════════════════════════════════════════════════
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { exigerEnvironnementIsole } from "./garde-environnement.mjs";
import { urlRechercheBan } from "../../src/lib/geocodeur-ban.ts";

exigerEnvironnementIsole();

const APP = process.env.FUT10_APP_URL ?? "http://localhost:3000";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright-core");
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const attendre = async (fn, quoi, ms = 60000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) { const v = await fn(); if (v) return v; await new Promise((ok) => setTimeout(ok, 1500)); }
  throw new Error(`délai dépassé : ${quoi}`);
};

// ── 0. Un compte de test, son projet A, une adresse BAN réelle (géocodeur public) ─────────────────────
const email = `fut10+e2e${Date.now()}@futuree.test`;
const motDePasse = `Test-${crypto.randomUUID()}`;
const { data: cree, error: eUser } = await admin.auth.admin.createUser({
  email, password: motDePasse, email_confirm: true, user_metadata: { full_name: "Camille Essai" },
});
if (eUser) throw eUser;
const userId = cree.user.id;
const PROJET_A = { posture: "adresse", intent: null, rawText: "Projet A : calme et transports.", updatedAt: new Date().toISOString(), schemaVersion: 3, parsed: { reformulation: "Calme et transports", hardConstraints: {}, preferences: [] } };
await admin.from("user_profiles").upsert({ user_id: userId, user_project: PROJET_A }, { onConflict: "user_id" });
// Le géocodeur du produit (module canonique), jamais une URL recopiée.
const ban = await (await fetch(urlRechercheBan({ q: "1 rue de la Chaine La Rochelle", limit: 1, type: "housenumber" }))).json();
const f = ban.features[0].properties;
const url = `${APP}/checkout/dossier?banId=${encodeURIComponent(f.id)}&label=${encodeURIComponent(f.label)}&insee=${encodeURIComponent(f.citycode)}`;

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true });
const page = await browser.newPage();
const corpsPaiement = [];
page.on("request", (r) => { if (r.url().includes("/api/stripe/create-payment-intent")) corpsPaiement.push(r.postData()); });

try {
  // ── 1. Connexion, puis qualification ─────────────────────────────────────────────────────────
  await page.goto(`${APP}/connexion?next=${encodeURIComponent(url.replace(APP, ""))}`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', motDePasse);
  await page.click('button[type="submit"]');
  await page.waitForURL(/checkout\/dossier/);
  assert.equal(corpsPaiement.length, 0, "aucun PaymentIntent avant la fin des questions");
  await page.getByText("Votre projet est déjà renseigné.").waitFor();
  await page.getByText("Pour l'acheter").click();
  await page.getByText("Vous y habitez déjà").click();
  await page.getByRole("button", { name: "Continuer vers le paiement" }).click();

  // ── 2. Carte de test dans Stripe Elements, accord, paiement (le verrou part juste avant) ──────
  const cadre = page.frameLocator('iframe[title*="paiement"], iframe[name^="__privateStripeFrame"]').first();
  await cadre.locator('input[name="number"]').fill("4242424242424242");
  await cadre.locator('input[name="expiry"]').fill("12 / 34");
  await cadre.locator('input[name="cvc"]').fill("123");
  await page.locator('input[type="checkbox"]').first().check();
  const verrou = page.waitForResponse((r) => r.url().includes("/api/dossier/intention/verrouiller"));
  await page.locator('form button[type="submit"]').click();
  assert.equal((await verrou).status(), 200, "verrou posé avant la confirmation");
  await page.waitForURL(/dossier\/merci/, { timeout: 60000 });

  // ── 3. Webhook signé (stripe listen) → dossier, avec le contexte de l'achat ──────────────────
  const dossier = await attendre(async () => (await admin.from("address_dossiers").select("*").eq("user_id", userId).maybeSingle()).data, "dossier créé par le webhook");
  assert.equal(dossier.place_objective, "buy");
  assert.equal(dossier.place_relation, "lives_here");
  const { data: intent } = await admin.from("dossier_intents").select("*").eq("stripe_payment_intent_id", dossier.stripe_payment_intent_id).single();
  assert.ok(intent.context_locked_at, "intention verrouillée");
  assert.equal(intent.project_state, "confirmed");

  // ── 4. Modification après confirmation : refusée (même tentative, même PaymentIntent) ───────
  const premier = JSON.parse(corpsPaiement.at(-1));
  const tentative = await page.evaluate(async (corps) => {
    const r = await fetch("/api/stripe/create-payment-intent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
    return { status: r.status, corps: await r.json() };
  }, { ...premier, dossierContext: { ...premier.dossierContext, objectif: "rent" } });
  assert.equal(tentative.status, 409);
  assert.equal(tentative.corps.code, "CONTEXT_LOCKED");

  // ── 5. Le projet passe à B, puis Stripe rejoue l'événement : rien ne change ──────────────────
  await admin.from("user_profiles").update({ user_project: { ...PROJET_A, rawText: "Projet B : jardin.", updatedAt: new Date().toISOString() } }).eq("user_id", userId);
  const evenements = JSON.parse(execFileSync("stripe", ["events", "list", "--limit", "20", "--type", "payment_intent.succeeded"], { encoding: "utf8" }));
  const evt = evenements.data.find((e) => e.data.object.id === dossier.stripe_payment_intent_id);
  execFileSync("stripe", ["events", "resend", evt.id], { encoding: "utf8" });
  await new Promise((ok) => setTimeout(ok, 5000));
  const { data: tous } = await admin.from("address_dossiers").select("id, place_objective").eq("user_id", userId);
  assert.equal(tous.length, 1, "aucun second dossier");
  assert.equal(tous[0].place_objective, "buy");

  // ── 6. Première lecture : la version figée (si nos sources ont répondu) suit le projet A ─────
  const artefact = await attendre(async () => (await admin.from("decision_artifact").select("status, payload").eq("user_id", userId).eq("scope_key", `logement:${dossier.id}`).order("version", { ascending: false }).limit(1).maybeSingle()).data, "artefact réservé", 90000);
  if (artefact.status === "ready") assert.equal(artefact.payload.projectSnapshot.rawText, PROJET_A.rawText);
  await page.goto(`${APP}/rapport`);
  await page.locator("h1").first().waitFor();
  console.log(`✔ bout en bout : dossier ${dossier.id}, artefact ${artefact.status}, verrou, refus après confirmation, rejeu sans effet.`);
} finally {
  await browser.close();
  await admin.auth.admin.deleteUser(userId);
}
