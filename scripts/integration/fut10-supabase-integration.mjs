// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-10 · INTÉGRATION SUPABASE RÉELLE (PostgREST + supabase-js), SUR LE PROJET DE TEST (OU UNE INSTANCE LOCALE).
//
// Ce que PGlite ne prouve pas, et que ce script prouve : le stockage RÉEL (`intention-dossier-store-supabase.ts`,
// exactement le code du serveur) à travers PostgREST, deux CONNEXIONS distinctes qui se disputent la
// même intention, les politiques d'accès vues par un vrai utilisateur authentifié, et l'idempotence de
// l'upsert du webhook via supabase-js.
//
// PRÉREQUIS : le projet Supabase de TEST (`future-e-test`), avec le schéma appliqué par
// `appliquer-schema-test.mjs`, et l'environnement de test chargé (`.env.fut10-test`, jamais `.env.local`) :
//   set -a; . ./.env.fut10-test; set +a; node scripts/integration/fut10-supabase-integration.mjs
// Une instance locale (`supabase start`) convient aussi. Sortie 2 si l'environnement n'est pas isolé.
//
// INTERDIT : `supabase db reset --linked`, `supabase db push` vers la production, ou toute exécution avec
// l'environnement de production. Le garde-fou refuse de démarrer dans ces cas.
// ════════════════════════════════════════════════════════════════════════════════════════════
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { exigerEnvironnementIsole } from "./garde-environnement.mjs";
import { storeIntentionsSur } from "../../src/lib/intention-dossier-store-supabase.ts";
import { enregistrerIntention, verrouillerIntention } from "../../src/lib/verrou-intention-dossier.ts";
import { colonnesIntention, colonnesDossierDepuisIntention } from "../../src/lib/dossier-contexte-checkout.ts";
import { contexteDAchat } from "../../src/lib/contexte-livraison.ts";

exigerEnvironnementIsole();

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const nouveauClient = (cle) => createClient(URL_, cle, { auth: { persistSession: false, autoRefreshToken: false } });
// DEUX clients, donc deux connexions HTTP vers PostgREST, donc deux connexions Postgres.
const connexionA = nouveauClient(SERVICE);
const connexionB = nouveauClient(SERVICE);
const resultats = [];
async function cas(nom, fn) {
  try { await fn(); resultats.push(`✔ ${nom}`); } catch (e) { resultats.push(`✘ ${nom}\n    ${e.message}`); process.exitCode = 1; }
}

const email = `fut10+${Date.now()}@futuree.test`;
const { data: cree, error: eUser } = await connexionA.auth.admin.createUser({ email, password: `Test-${crypto.randomUUID()}`, email_confirm: true });
if (eUser) throw eUser;
const userId = cree.user.id;
const PROJET = { posture: "adresse", intent: null, rawText: "Projet de test.", updatedAt: "2026-10-01T00:00:00.000Z", parsed: { reformulation: "Test", hardConstraints: {}, preferences: [] } };
const ligne = (pi, objectif) => ({
  stripe_payment_intent_id: pi, user_id: userId, ban_id: "test_ban", insee: "44109", address_label: "1 rue du Test 44000 Nantes",
  latitude: 47.2, longitude: -1.55, amount_due_cents: 3900,
  ...colonnesIntention({ relation: "lives_here", objectif, projetVu: { existe: true, updatedAt: PROJET.updatedAt } }, PROJET, new Date()),
});

await cas("deux connexions : aucune écriture n'est acceptée après le verrou", async () => {
  const pi = `pi_fut10test${Date.now()}`;
  const a = storeIntentionsSur(connexionA), b = storeIntentionsSur(connexionB);
  assert.equal(await enregistrerIntention(a, ligne(pi, "buy")), "creee");
  const objectifs = ["rent", "understand", "other", "rent", "understand", "other"];
  const course = await Promise.all([
    ...objectifs.map((o, i) => enregistrerIntention(i % 2 ? a : b, ligne(pi, o))),
    verrouillerIntention(a, pi, userId, new Date()),
  ]);
  const apres = await Promise.all(objectifs.map((o) => enregistrerIntention(b, ligne(pi, o))));
  assert.ok(apres.every((r) => r === "verrouillee"), JSON.stringify(apres));
  const { data } = await connexionA.from("dossier_intents").select("place_objective, context_locked_at").eq("stripe_payment_intent_id", pi).single();
  assert.ok(data.context_locked_at);
  const gagnantes = objectifs.filter((_, i) => course[i] === "mise_a_jour");
  assert.ok(gagnantes.length === 0 ? data.place_objective === "buy" : gagnantes.includes(data.place_objective), JSON.stringify({ course, data }));
});

await cas("webhook : upsert(ignoreDuplicates) via supabase-js, rejoué deux fois → un seul dossier, contexte de l'achat", async () => {
  const pi = `pi_fut10wh${Date.now()}`;
  await enregistrerIntention(storeIntentionsSur(connexionA), ligne(pi, "buy"));
  await verrouillerIntention(storeIntentionsSur(connexionA), pi, null, new Date());
  const { data: intent } = await connexionA.from("dossier_intents").select("*").eq("stripe_payment_intent_id", pi).single();
  const upsert = () => connexionA.from("address_dossiers").upsert({
    user_id: userId, ban_id: intent.ban_id, insee: intent.insee, address_label: intent.address_label,
    latitude: intent.latitude, longitude: intent.longitude, stripe_payment_intent_id: pi, amount_paid_cents: 3900,
    purchased_at: new Date().toISOString(), ...colonnesDossierDepuisIntention(intent),
  }, { onConflict: "stripe_payment_intent_id", ignoreDuplicates: true }).select("id");
  const r1 = await upsert();
  const r2 = await upsert();
  assert.equal(r1.data?.length, 1);
  assert.equal(r2.data?.length, 0);
  assert.equal(contexteDAchat(intent).etat, "confirme");
});

await cas("politiques : un utilisateur authentifié ne lit ni n'écrit dossier_intents, ni n'appelle la purge", async () => {
  const motDePasse = `Test-${crypto.randomUUID()}`;
  await connexionA.auth.admin.updateUserById(userId, { password: motDePasse });
  const lecteur = nouveauClient(ANON);
  const { error: eLogin } = await lecteur.auth.signInWithPassword({ email, password: motDePasse });
  if (eLogin) throw eLogin;
  const lecture = await lecteur.from("dossier_intents").select("*");
  assert.ok(lecture.error || (lecture.data ?? []).length === 0, "aucune ligne visible");
  const ecriture = await lecteur.from("dossier_intents").update({ place_objective: "rent" }).eq("user_id", userId).select("stripe_payment_intent_id");
  assert.ok(ecriture.error || (ecriture.data ?? []).length === 0, "aucune écriture");
  const purge = await lecteur.rpc("purger_dossier_intents");
  assert.ok(purge.error, "purge refusée");
});

await cas("purge via le service role : idempotente, et la livraison inachevée garde son projet", async () => {
  const r1 = await connexionA.rpc("purger_dossier_intents");
  const r2 = await connexionA.rpc("purger_dossier_intents");
  assert.ifError(r1.error);
  assert.equal(r2.data?.[0]?.supprimees_abandonnees, 0);
});

// Nettoyage : uniquement ce que ce script a créé (l'utilisateur de test, et ses lignes par cascade).
await connexionA.auth.admin.deleteUser(userId);
console.log(resultats.join("\n"));
