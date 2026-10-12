// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-10 · LE PARCOURS RÉEL DE BOUT EN BOUT, SUR UNE APPLICATION LOCALE ET DES SERVICES DE TEST.
//
//   node scripts/integration/fut10-bout-en-bout.mjs --parcours nominal
//   node scripts/integration/fut10-bout-en-bout.mjs --parcours degrade
//
// NOMINAL : qualification → PaymentIntent (Stripe TEST) → verrou → confirmation (carte de test) → webhook
// SIGNÉ (stripe listen) → dossier → artefact `ready` → projet, relation et objectif conformes → rejeu du
// webhook sans duplication → refus de modifier le contexte après confirmation.
// DÉGRADÉ : la première génération échoue (application lancée avec FUT10_TEST_ECHEC_PREMIERE_GENERATION=1,
// cf. `echecSimuleDeTest`) ; le projet du compte change ; aucune version n'est tenue pour livrée ; le
// rattrapage (ouverture du dossier) produit une version prête avec le contexte DE L'ACHAT.
//
// CE QUI EST RÉEL : Stripe (mode test : PaymentIntent, confirmation, webhook signé par `stripe listen`),
// Supabase (projet de test : authentification, tables, politiques), l'application (routes, webhook,
// moteur, sources publiques). CE QUI NE L'EST PAS : la carte (`4242…`, mode test) ; dans le parcours
// dégradé, l'échec de la première génération (injecté, et lui seul).
//
// LE REJEU : `stripe events resend` vise les endpoints enregistrés dans le tableau de bord Stripe, pas
// forcément l'écoute éphémère de `stripe listen`. Le script rejoue donc lui-même le VRAI événement
// (relu dans l'API Stripe), signé avec le secret de webhook, vers l'application locale : exactement ce que
// Stripe enverrait.
//
// UN TEST NON EXÉCUTÉ N'EST PAS UN SUCCÈS : sortie 2 si l'environnement n'est pas isolé (garde-fou),
// sortie 1 sur la moindre assertion fausse, sortie 0 seulement si tout a été vérifié.
//
// PRÉREQUIS : l'environnement de test (`.env.fut10-test`, voir la note d'audit, section G) chargé dans ce
// shell ET dans l'application ; `stripe listen --forward-to localhost:3000/api/stripe/webhook` ;
// l'application : npx next dev --webpack -p 3000.
// ════════════════════════════════════════════════════════════════════════════════════════════
import assert from "node:assert/strict";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { exigerEnvironnementIsole } from "./garde-environnement.mjs";
import { urlRechercheBan } from "../../src/lib/geocodeur-ban.ts";

exigerEnvironnementIsole();

const parcours = process.argv.includes("--parcours") ? process.argv[process.argv.indexOf("--parcours") + 1] : "nominal";
if (!["nominal", "degrade"].includes(parcours)) { console.error("--parcours nominal|degrade"); process.exit(2); }
const APP = process.env.FUT10_APP_URL ?? "http://localhost:3000";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright-core");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const attendre = async (fn, quoi, ms = 90000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) { const v = await fn(); if (v) return v; await new Promise((ok) => setTimeout(ok, 2000)); }
  throw new Error(`délai dépassé : ${quoi}`);
};
const etapes = [];
const etape = (texte) => { etapes.push(`✔ ${texte}`); console.log(`✔ ${texte}`); };

// ── 0. Un compte de test (le déclencheur crée compte et profil), son projet A, une adresse BAN ──────
const email = `fut10+${parcours}${Date.now()}@futuree.test`;
const motDePasse = `Test-${crypto.randomUUID()}`;
const { data: cree, error: eUser } = await admin.auth.admin.createUser({
  email, password: motDePasse, email_confirm: true, user_metadata: { full_name: "Camille Essai" },
});
if (eUser) throw eUser;
const userId = cree.user.id;
const PROJET_A = { posture: "adresse", intent: null, rawText: "Projet A : calme et transports.", updatedAt: new Date().toISOString(), schemaVersion: 3, parsed: { reformulation: "Calme et transports", hardConstraints: {}, preferences: [{ key: "calme_sonore", weight: 3 }] } };
const { error: eProfil } = await admin.from("user_profiles").update({ user_project: PROJET_A }).eq("user_id", userId);
if (eProfil) throw eProfil;
const ban = await (await fetch(urlRechercheBan({ q: "1 rue de la Chaine La Rochelle", limit: 1, type: "housenumber" }))).json();
const f = ban.features[0].properties;
const url = `${APP}/checkout/dossier?banId=${encodeURIComponent(f.id)}&label=${encodeURIComponent(f.label)}&insee=${encodeURIComponent(f.citycode)}`;

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true });
const page = await browser.newPage();
const corpsPaiement = [];
page.on("request", (r) => { if (r.url().includes("/api/stripe/create-payment-intent")) corpsPaiement.push(r.postData()); });

try {
  // ── 1. Connexion, qualification ─────────────────────────────────────────────────────────────
  await page.goto(`${APP}/connexion?next=${encodeURIComponent(url.replace(APP, ""))}`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', motDePasse);
  await page.click('button[type="submit"]');
  await page.waitForURL(/checkout\/dossier/, { timeout: 30000 });
  await page.getByText("Votre projet est déjà renseigné.").waitFor();
  assert.equal(corpsPaiement.length, 0, "aucun PaymentIntent avant la fin des questions");
  await page.getByText("Pour l'acheter").click();
  await page.getByText("Vous y habitez déjà").click();
  await page.getByRole("button", { name: "Continuer vers le paiement" }).click();
  etape("qualification : aucun PaymentIntent avant la fin des questions");

  // ── 2. Carte de test, accord, paiement : le verrou part juste avant la confirmation ────────────
  const cadre = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
  await cadre.locator('input[name="number"]').fill("4242424242424242");
  await cadre.locator('input[name="expiry"]').fill("12 / 34");
  await cadre.locator('input[name="cvc"]').fill("123");
  const codePostal = cadre.locator('input[name="postalCode"]');
  if (await codePostal.count()) await codePostal.fill("17000");
  await page.locator('input[type="checkbox"]').first().check();
  const verrou = page.waitForResponse((r) => r.url().includes("/api/dossier/intention/verrouiller"));
  await page.locator('form button[type="submit"]').click();
  assert.equal((await verrou).status(), 200, "verrou posé avant la confirmation");
  await page.waitForURL(/dossier\/merci/, { timeout: 90000 });
  etape("paiement de test confirmé, verrou posé avant la confirmation");

  // ── 3. Webhook signé → dossier avec le contexte de l'achat ─────────────────────────────────
  const dossier = await attendre(async () => (await admin.from("address_dossiers").select("*").eq("user_id", userId).maybeSingle()).data, "dossier créé par le webhook");
  assert.equal(dossier.place_objective, "buy");
  assert.equal(dossier.place_relation, "lives_here");
  const { data: intent } = await admin.from("dossier_intents").select("*").eq("stripe_payment_intent_id", dossier.stripe_payment_intent_id).single();
  assert.ok(intent.context_locked_at, "intention verrouillée");
  assert.equal(intent.project_state, "confirmed");
  assert.equal(intent.project_snapshot.rawText, PROJET_A.rawText);
  const pi = await stripe.paymentIntents.retrieve(dossier.stripe_payment_intent_id);
  assert.equal(pi.status, "succeeded");
  // L'application parle bien à Stripe en mode TEST (son environnement n'est pas lisible d'ici).
  assert.equal(pi.livemode, false, "PaymentIntent en mode test");
  assert.ok(!JSON.stringify(pi.metadata).includes("Projet A"), "aucun projet dans les métadonnées Stripe");
  etape("webhook signé : dossier créé, contexte de l'achat recopié, rien du projet chez Stripe");

  // ── 4. Modification après confirmation : refusée ───────────────────────────────────────────
  const premier = JSON.parse(corpsPaiement.at(-1));
  const tentative = await page.evaluate(async (corps) => {
    const r = await fetch("/api/stripe/create-payment-intent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
    return { status: r.status, corps: await r.json() };
  }, { ...premier, dossierContext: { ...premier.dossierContext, objectif: "rent" } });
  assert.equal(tentative.status, 409);
  assert.equal(tentative.corps.code, "CONTEXT_LOCKED");
  const { data: intentApres } = await admin.from("dossier_intents").select("place_objective").eq("stripe_payment_intent_id", dossier.stripe_payment_intent_id).single();
  assert.equal(intentApres.place_objective, "buy");
  etape("modification après confirmation refusée (409), intention intacte");

  // ── 5. Le projet du compte passe à B ───────────────────────────────────────────────────────
  await admin.from("user_profiles").update({ user_project: { ...PROJET_A, rawText: "Projet B : jardin.", updatedAt: new Date().toISOString(), parsed: { reformulation: "Jardin", hardConstraints: {}, preferences: [{ key: "acces_espaces_verts", weight: 3 }] } } }).eq("user_id", userId);

  // ── 6. Première livraison ──────────────────────────────────────────────────────────────────
  const versions = async () => (await admin.from("decision_artifact").select("version, status, payload").eq("user_id", userId).eq("scope_key", `logement:${dossier.id}`).order("version")).data ?? [];
  if (parcours === "nominal") {
    const premiere = await attendre(async () => (await versions()).find((v) => v.status !== "generating"), "première génération terminée");
    // Un `failed` fait ÉCHOUER le parcours nominal : il n'est pas « signalé ».
    assert.equal(premiere.status, "ready", `première génération : ${premiere.status}`);
    assert.equal(premiere.payload.projectSnapshot.rawText, PROJET_A.rawText);
    assert.deepEqual(premiere.payload.contexteDuBien, { relation: "lives_here", objectif: "buy" });
    etape("première version prête, avec le projet A, la relation et l'objectif de l'achat");
  } else {
    const v1 = await attendre(async () => (await versions()).find((v) => v.version === 1 && v.status !== "generating"), "première génération terminée");
    assert.equal(v1.status, "failed", "le parcours dégradé exige l'échec injecté de la v1 (FUT10_TEST_ECHEC_PREMIERE_GENERATION=1 dans l'application)");
    assert.equal((await versions()).filter((v) => v.status === "ready").length, 0, "aucune version tenue pour livrée");
    const { data: intentDegrade } = await admin.from("dossier_intents").select("project_snapshot").eq("stripe_payment_intent_id", dossier.stripe_payment_intent_id).single();
    assert.equal(intentDegrade.project_snapshot.rawText, PROJET_A.rawText, "contexte acheté conservé");
    etape("première génération échouée : aucune version livrée, contexte acheté conservé");
    // Le rattrapage : l'ouverture du dossier (le compte porte maintenant le projet B).
    await page.goto(`${APP}/rapport`);
    await page.locator("h1").first().waitFor();
    const prete = await attendre(async () => (await versions()).find((v) => v.status === "ready"), "version rattrapée prête", 120000);
    assert.ok(prete.version >= 2);
    assert.equal(prete.payload.projectSnapshot.rawText, PROJET_A.rawText, "le rattrapage suit le projet de l'achat, pas B");
    assert.deepEqual(prete.payload.contexteDuBien, { relation: "lives_here", objectif: "buy" });
    etape(`rattrapage : version ${prete.version} prête avec le projet A, malgré le projet B du compte`);
  }

  // ── 7. Rejeu du VRAI événement, signé, vers l'application : aucune duplication ─────────────
  const evenements = await stripe.events.list({ type: "payment_intent.succeeded", limit: 20 });
  const evt = evenements.data.find((e) => e.data.object.id === dossier.stripe_payment_intent_id);
  assert.ok(evt, "événement Stripe retrouvé");
  const charge = JSON.stringify(evt);
  const signature = stripe.webhooks.generateTestHeaderString({ payload: charge, secret: process.env.STRIPE_WEBHOOK_SECRET });
  const rejeu = await fetch(`${APP}/api/stripe/webhook`, { method: "POST", headers: { "Content-Type": "application/json", "stripe-signature": signature }, body: charge });
  assert.equal(rejeu.status, 200, "rejeu accepté");
  const { data: tous } = await admin.from("address_dossiers").select("id, place_objective").eq("user_id", userId);
  assert.equal(tous.length, 1, "aucun second dossier");
  assert.equal(tous[0].place_objective, "buy");
  const nbVersions = (await versions()).length;
  await new Promise((ok) => setTimeout(ok, 4000));
  assert.equal((await versions()).length, nbVersions, "le rejeu ne régénère rien");
  etape("rejeu signé du vrai événement : aucun second dossier, aucune régénération");

  console.log(`\nFUT-10 bout en bout (${parcours}) : ${etapes.length} étapes vérifiées.`);
} catch (e) {
  console.error(`✘ ${e.message}`);
  process.exitCode = 1;
} finally {
  await browser.close();
  // Nettoyage : l'utilisateur de test, et ses lignes par cascade. FUT10_GARDER_DONNEES=1 les garde,
  // pour une vérification à la main dans le projet de test.
  if (process.env.FUT10_GARDER_DONNEES === "1") console.log(`données gardées : utilisateur de test ${userId}`);
  else await admin.auth.admin.deleteUser(userId);
}
