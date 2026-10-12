// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-10 · INTÉGRATION CONTRE UN VRAI POSTGRES (PGlite, Postgres compilé en WebAssembly).
//
// Ce que ce script prouve, et ce qu'il ne prouve pas :
//   ✔ les VRAIES migrations 26, 36, 37 et 38 s'appliquent, dans l'ordre, sur une base qui a déjà des
//     lignes (compatibilité des anciennes lignes) ; leurs retours arrière aussi ;
//   ✔ les contraintes SQL (valeurs, état du projet ↔ snapshot) refusent ce qu'elles doivent ;
//   ✔ le verrou du contexte, la création idempotente du dossier (rejeu du webhook) et la purge, avec
//     les instructions SQL qu'émet le stockage réel, pilotées par NOTRE logique (`verrou-intention-dossier.ts`,
//     `dossier-contexte-checkout.ts`) ;
//   ✔ les droits : `authenticated` et `anon` n'accèdent ni à la table ni à la purge.
//   ✘ PAS PostgREST ni supabase-js (le stockage réel les utilise ; ici le même SQL est écrit à la main) ;
//   ✘ PAS de vraie concurrence : PGlite n'a qu'une connexion. L'atomicité du verrou repose sur la
//     sémantique d'un UPDATE conditionnel de Postgres (réévaluation de la condition après le verrou de
//     ligne), qui n'est pas rejouée ici ;
//   ✘ PAS le schéma complet de production : `auth.users` et `address_dossiers` sont des tables minimales.
//
// Lancement (PGlite n'est PAS une dépendance du projet ; l'installer à part) :
//   mkdir -p /tmp/pg && (cd /tmp/pg && npm i @electric-sql/pglite@0.5.8)
//   PGLITE_MODULE=/tmp/pg/node_modules/@electric-sql/pglite/dist/index.js node scripts/integration/fut10-postgres.mjs
// ════════════════════════════════════════════════════════════════════════════════════════════
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { enregistrerIntention, verrouillerIntention } from "../../src/lib/verrou-intention-dossier.ts";
import { colonnesIntention, colonnesDossierDepuisIntention, projetPourLivraison } from "../../src/lib/dossier-contexte-checkout.ts";
import { contexteDAchat } from "../../src/lib/contexte-livraison.ts";
import { PREAMBULE, migrationsDeTest } from "./schema-de-test.mjs";

const modPath = process.env.PGLITE_MODULE;
if (!modPath) {
  // Sortie 3 : NON exécuté. Jamais un faux feu vert.
  console.log("PGLITE_MODULE absent : intégration Postgres NON exécutée (voir l'en-tête du script).");
  process.exit(3);
}
const { PGlite } = await import(modPath);
const sql = (f) => readFileSync(new URL(`../../supabase/${f}`, import.meta.url), "utf8");
const resultats = [];
async function cas(nom, fn) {
  try { await fn(); resultats.push(`✔ ${nom}`); } catch (e) { resultats.push(`✘ ${nom}\n    ${e.message}`); process.exitCode = 1; }
}

async function base() {
  const db = new PGlite();
  // Le minimum de Supabase dont les migrations dépendent : rôles, schéma auth, et les tables antérieures.
  await db.exec(`
    create role authenticated nologin; create role anon nologin; create role service_role nologin bypassrls;
    create schema auth; create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
    create table public.address_dossiers (
      id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
      ban_id text not null, insee text not null, address_label text not null,
      posture text default 'residence', stripe_payment_intent_id text unique, amount_paid_cents int,
      purchased_at timestamptz, access_revoked_at timestamptz
    );
    insert into auth.users values ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000b');
  `);
  await db.exec(sql("26_dossier_intents.sql"));
  await db.exec(sql("28_decision_artifact.sql"));
  // DES LIGNES ANCIENNES, écrites AVANT les migrations 36 et 37 : elles doivent rester valides.
  await db.exec(`
    insert into public.dossier_intents (stripe_payment_intent_id, user_id, ban_id, insee, address_label, latitude, longitude, amount_due_cents)
      values ('pi_ancien0001', '00000000-0000-0000-0000-00000000000a', 'b0', '17300', 'Ancienne adresse', 46.1, -1.1, 3900);
    insert into public.address_dossiers (user_id, ban_id, insee, address_label, stripe_payment_intent_id)
      values ('00000000-0000-0000-0000-00000000000a', 'b0', '17300', 'Ancienne adresse', 'pi_ancien0001');
  `);
  await db.exec(sql("36_relation_au_lieu_adresse.sql"));
  await db.exec(sql("37_contexte_checkout_dossier.sql"));
  await db.exec(sql("38_purge_dossier_intents.sql"));
  await db.exec(`grant all on public.dossier_intents, public.address_dossiers, public.decision_artifact to service_role;`);
  return db;
}

// Le stockage, avec les instructions SQL qu'émet `intention-dossier-store.ts` (via PostgREST).
function store(db) {
  const cols = (o) => Object.keys(o);
  const val = (v) => (v !== null && typeof v === "object" ? JSON.stringify(v) : v);
  return {
    async insererSiAbsente(l) {
      const c = cols(l);
      const r = await db.query(
        `insert into public.dossier_intents (${c.join(",")}) values (${c.map((_, i) => `$${i + 1}`).join(",")})
         on conflict (stripe_payment_intent_id) do nothing returning stripe_payment_intent_id`, c.map((k) => val(l[k])));
      return r.rows.length > 0;
    },
    async mettreAJourSiOuverte(pi, userId, champs) {
      const c = cols(champs);
      const r = await db.query(
        `update public.dossier_intents set ${c.map((k, i) => `${k} = $${i + 3}`).join(", ")}
          where stripe_payment_intent_id = $1 and user_id = $2 and context_locked_at is null
          returning stripe_payment_intent_id`, [pi, userId, ...c.map((k) => val(champs[k]))]);
      return r.rows.length > 0;
    },
    async verrouillerSiOuverte(pi, userId, maintenant) {
      const r = await db.query(
        `update public.dossier_intents set context_locked_at = $3
          where stripe_payment_intent_id = $1 and ($2::uuid is null or user_id = $2) and context_locked_at is null
          returning stripe_payment_intent_id`, [pi, userId, maintenant]);
      return r.rows.length > 0;
    },
    async lire(pi, userId) {
      const r = await db.query(`select context_locked_at from public.dossier_intents
        where stripe_payment_intent_id = $1 and ($2::uuid is null or user_id = $2)`, [pi, userId]);
      return r.rows[0] ?? null;
    },
  };
}

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const NOW = new Date("2026-10-11T12:00:00.000Z");
const PROJET = { posture: "adresse", intent: null, rawText: "Calme.", updatedAt: "2026-10-01T00:00:00.000Z", parsed: { reformulation: "Calme", hardConstraints: {}, preferences: [] } };
const adresse = (pi, user = A) => ({
  stripe_payment_intent_id: pi, user_id: user, ban_id: "b1", insee: "44109", address_label: "3 rue des Essais",
  latitude: 47.2, longitude: -1.5, amount_due_cents: 3900,
});
const ctx = (c) => ({ relation: null, objectif: null, projetVu: null, ...c });

/** Le webhook, réduit à ce qui touche le contexte : verrou, lecture, upsert(ignoreDuplicates). */
async function webhook(db, pi) {
  await verrouillerIntention(store(db), pi, null, NOW);
  const intent = (await db.query(`select * from public.dossier_intents where stripe_payment_intent_id = $1`, [pi])).rows[0];
  if (!intent) throw new Error(`dossier_intents introuvable pour ${pi}`);
  const extra = colonnesDossierDepuisIntention(intent);
  const c = ["user_id", "ban_id", "insee", "address_label", "stripe_payment_intent_id", ...Object.keys(extra)];
  const v = [intent.user_id, intent.ban_id, intent.insee, intent.address_label, pi, ...Object.values(extra)];
  const r = await db.query(`insert into public.address_dossiers (${c.join(",")}) values (${c.map((_, i) => `$${i + 1}`).join(",")})
    on conflict (stripe_payment_intent_id) do nothing returning id`, v);
  return { created: r.rows.length > 0, livraison: projetPourLivraison(intent) };
}

await cas("migrations : les anciennes lignes restent valides, colonnes nouvelles à NULL", async () => {
  const db = await base();
  const i = (await db.query(`select place_relation, place_objective, project_state, project_snapshot, context_locked_at from public.dossier_intents where stripe_payment_intent_id = 'pi_ancien0001'`)).rows[0];
  assert.deepEqual(i, { place_relation: null, place_objective: null, project_state: null, project_snapshot: null, context_locked_at: null });
  assert.deepEqual(projetPourLivraison(i), { etat: "historique" });
  const d = (await db.query(`select place_relation, place_objective, posture from public.address_dossiers where stripe_payment_intent_id = 'pi_ancien0001'`)).rows[0];
  assert.deepEqual(d, { place_relation: null, place_objective: null, posture: "residence" });
});

await cas("contraintes : valeurs hors liste et état incohérent refusés", async () => {
  const db = await base();
  const refuse = async (extra) => {
    await assert.rejects(db.query(`insert into public.dossier_intents (stripe_payment_intent_id, user_id, ban_id, insee, address_label, latitude, longitude, amount_due_cents, ${Object.keys(extra).join(",")})
      values ('pi_x' || floor(random()*1e9)::text, '${A}', 'b', '1', 'x', 1, 1, 1, ${Object.keys(extra).map((_, i) => `$${i + 1}`).join(",")})`, Object.values(extra)));
  };
  await refuse({ place_relation: "residence" });
  await refuse({ place_objective: "investir" });
  await refuse({ project_state: "peut-etre" });
  await refuse({ project_state: "confirmed" }); // sans snapshot
  await refuse({ project_state: "absent", project_snapshot: JSON.stringify(PROJET) });
  await assert.rejects(db.query(`update public.address_dossiers set place_objective = 'investir'`));
});

await cas("projet confirmé, absence confirmée, et intention historique : livrés chacun comme confirmé au paiement", async () => {
  const db = await base();
  const s = store(db);
  await enregistrerIntention(s, { ...adresse("pi_confirme01"), ...colonnesIntention(ctx({ projetVu: { existe: true, updatedAt: PROJET.updatedAt }, objectif: "buy" }), PROJET, NOW) });
  await enregistrerIntention(s, { ...adresse("pi_absent0001"), ...colonnesIntention(ctx({ projetVu: { existe: false, updatedAt: null } }), null, NOW) });
  const c = await webhook(db, "pi_confirme01");
  assert.equal(c.livraison.etat, "confirme");
  assert.equal(c.livraison.projet.rawText, "Calme.");
  // Le compte reçoit un projet entre le paiement et le webhook : l'intention n'en sait rien.
  const a = await webhook(db, "pi_absent0001");
  assert.deepEqual(a.livraison, { etat: "absent" });
});

await cas("verrou : corrections avant, refus après, rejeu du webhook identique", async () => {
  const db = await base();
  const s = store(db);
  const ligne = (o) => ({ ...adresse("pi_verrou0001"), ...colonnesIntention(ctx({ objectif: o, relation: "lives_here" }), null, NOW) });
  assert.equal(await enregistrerIntention(s, ligne("rent")), "creee");
  assert.equal(await enregistrerIntention(s, ligne("buy"), { paiementEncoreModifiable: async () => true }), "mise_a_jour");
  assert.equal(await verrouillerIntention(s, "pi_verrou0001", A, NOW), "verrouillee");
  assert.equal(await enregistrerIntention(s, ligne("other"), { paiementEncoreModifiable: async () => true }), "verrouillee");
  const r1 = await webhook(db, "pi_verrou0001");
  // Le lecteur corrige ensuite son lien avec le bien, puis Stripe rejoue l'événement.
  await db.query(`update public.address_dossiers set place_relation = 'studying' where stripe_payment_intent_id = 'pi_verrou0001'`);
  const r2 = await webhook(db, "pi_verrou0001");
  assert.equal(r1.created, true);
  assert.equal(r2.created, false);
  const d = (await db.query(`select place_objective, place_relation, place_objective_set_at from public.address_dossiers where stripe_payment_intent_id = 'pi_verrou0001'`)).rows[0];
  assert.equal(d.place_objective, "buy");
  assert.equal(d.place_relation, "studying");
  assert.equal(new Date(d.place_objective_set_at).toISOString(), NOW.toISOString());
  assert.equal((await db.query(`select count(*)::int n from public.address_dossiers where stripe_payment_intent_id = 'pi_verrou0001'`)).rows[0].n, 1);
});

await cas("verrou : Stripe engagé → rien n'est écrit et l'intention se verrouille ; autre compte → rien", async () => {
  const db = await base();
  const s = store(db);
  await enregistrerIntention(s, { ...adresse("pi_engage0001"), place_objective: "buy" });
  assert.equal(await enregistrerIntention(s, { ...adresse("pi_engage0001"), place_objective: "rent" }, { paiementEncoreModifiable: async () => false, maintenant: NOW }), "verrouillee");
  const l = (await db.query(`select place_objective, context_locked_at from public.dossier_intents where stripe_payment_intent_id = 'pi_engage0001'`)).rows[0];
  assert.equal(l.place_objective, "buy");
  assert.ok(l.context_locked_at);
  await enregistrerIntention(s, { ...adresse("pi_autre00001"), place_objective: "buy" });
  assert.equal(await enregistrerIntention(s, { ...adresse("pi_autre00001", B), place_objective: "rent" }), "verrouillee");
  assert.equal(await verrouillerIntention(s, "pi_autre00001", B, NOW), "introuvable");
});

await cas("deux achats à la même adresse : deux intentions, deux dossiers, deux contextes", async () => {
  const db = await base();
  const s = store(db);
  await enregistrerIntention(s, { ...adresse("pi_meme000001"), place_objective: "understand" });
  await enregistrerIntention(s, { ...adresse("pi_meme000002"), place_objective: "buy" });
  await webhook(db, "pi_meme000001");
  await webhook(db, "pi_meme000002");
  const r = (await db.query(`select place_objective from public.address_dossiers where ban_id = 'b1' order by place_objective`)).rows.map((x) => x.place_objective);
  assert.deepEqual(r, ["buy", "understand"]);
});

await cas("droits : authenticated et anon n'accèdent ni à la table ni à la purge", async () => {
  const db = await base();
  for (const role of ["authenticated", "anon"]) {
    await db.exec(`set role ${role}`);
    await assert.rejects(db.query(`select * from public.dossier_intents`), /permission denied/);
    await assert.rejects(db.query(`select * from public.purger_dossier_intents()`), /permission denied/);
    await assert.rejects(db.query(`select * from public.intentions_a_reconcilier()`), /permission denied/);
    await assert.rejects(db.query(`select public.etat_livraison_intention('x')`), /permission denied/);
    await db.exec(`reset role`);
  }
  await db.exec(`set role service_role`);
  await db.query(`select * from public.purger_dossier_intents()`);
  await db.exec(`reset role`);
});

await cas("purge : abandonnée supprimée ; paiement engagé sans dossier, dossier sans artefact, artefact failed signalés et gardés ; artefact ready → projet effacé ; récentes intactes ; idempotente", async () => {
  const db = await base();
  const vieux = "2026-08-01T00:00:00Z";
  const intention = (pi, { verrou = null, etat = null, snapshot = null, quand = vieux } = {}) => db.query(
    `insert into public.dossier_intents (stripe_payment_intent_id, user_id, ban_id, insee, address_label, latitude, longitude, amount_due_cents, created_at, context_locked_at, project_state, project_snapshot)
     values ($1, '${A}', 'b', '1', 'x', 1, 1, 1, $2, $3, $4, $5)`, [pi, quand, verrou, etat, snapshot ? JSON.stringify(snapshot) : null]);
  const dossier = async (pi, revoque = false) => (await db.query(
    `insert into public.address_dossiers (user_id, ban_id, insee, address_label, stripe_payment_intent_id, access_revoked_at) values ('${A}', 'b', '44109', 'x', $1, $2) returning id`,
    [pi, revoque ? vieux : null])).rows[0].id;
  const artefact = (id, status, version = 1) => db.query(
    `insert into public.decision_artifact (user_id, insee_code, scope_key, version, status, payload) values ('${A}', '44109', $1, $2, $3, $4)`,
    [`logement:${id}`, version, status, status === "ready" ? JSON.stringify({ ok: true }) : null]);

  await intention("pi_abandon0001");                                                        // 1. abandonnée
  await intention("pi_recent00001", { quand: NOW.toISOString() });                          // 5. récente
  await intention("pi_engage00001", { verrou: vieux, etat: "confirmed", snapshot: PROJET }); // 2. payé ? sans dossier
  await intention("pi_sansart0001", { verrou: vieux, etat: "confirmed", snapshot: PROJET }); // 3. dossier sans artefact
  await dossier("pi_sansart0001");
  await intention("pi_failed00001", { verrou: vieux, etat: "confirmed", snapshot: PROJET }); // 3. artefact failed seulement
  await artefact(await dossier("pi_failed00001"), "failed");
  await intention("pi_ready000001", { verrou: vieux, etat: "confirmed", snapshot: PROJET }); // 4. failed puis ready
  const idReady = await dossier("pi_ready000001");
  await artefact(idReady, "failed", 1);
  await artefact(idReady, "ready", 2);
  await intention("pi_absent00001", { verrou: vieux, etat: "absent" });                      // 4. achat sans projet
  await dossier("pi_absent00001");
  await intention("pi_revoque0001", { verrou: vieux, etat: "confirmed", snapshot: PROJET }); // 4. dossier révoqué
  await dossier("pi_revoque0001", true);
  // Un artefact ready d'un AUTRE dossier à la même adresse ne vaut pas livraison de celui-ci.
  await intention("pi_voisin00001", { verrou: vieux, etat: "confirmed", snapshot: PROJET });
  await dossier("pi_voisin00001");

  const etat = async (pi) => (await db.query(`select public.etat_livraison_intention($1) e`, [pi])).rows[0].e;
  assert.equal(await etat("pi_engage00001"), "paiement_engage_sans_dossier");
  assert.equal(await etat("pi_sansart0001"), "livraison_inachevee");
  assert.equal(await etat("pi_failed00001"), "livraison_inachevee");
  assert.equal(await etat("pi_ready000001"), "livree");
  assert.equal(await etat("pi_voisin00001"), "livraison_inachevee");

  const r = (await db.query(`select * from public.purger_dossier_intents($1)`, [NOW.toISOString()])).rows[0];
  assert.deepEqual(r, { supprimees_abandonnees: 1, projets_effaces: 2, a_reconcilier: 1, livraisons_inachevees: 3 });
  const restantes = (await db.query(`select stripe_payment_intent_id from public.dossier_intents order by 1`)).rows.map((x) => x.stripe_payment_intent_id);
  assert.ok(!restantes.includes("pi_abandon0001"));
  for (const pi of ["pi_engage00001", "pi_sansart0001", "pi_failed00001", "pi_ready000001", "pi_recent00001", "pi_absent00001", "pi_ancien0001"]) {
    assert.ok(restantes.includes(pi), pi);
  }
  // Le snapshot indispensable au rattrapage est intact ; celui d'une livraison faite est effacé.
  const snap = async (pi) => (await db.query(`select project_snapshot from public.dossier_intents where stripe_payment_intent_id = $1`, [pi])).rows[0].project_snapshot;
  for (const pi of ["pi_engage00001", "pi_sansart0001", "pi_failed00001", "pi_voisin00001"]) assert.equal((await snap(pi)).rawText, "Calme.", pi);
  for (const pi of ["pi_ready000001", "pi_revoque0001"]) {
    assert.equal((await snap(pi)).purge, true, pi);
    assert.equal((await snap(pi)).rawText, undefined, pi);
  }
  // Purgé après livraison : jamais confondu avec un achat sans projet, ni relu dans le compte.
  const purgee = (await db.query(`select * from public.dossier_intents where stripe_payment_intent_id = 'pi_ready000001'`)).rows[0];
  assert.deepEqual(projetPourLivraison(purgee), { etat: "efface" });
  assert.deepEqual(contexteDAchat(purgee), { etat: "indisponible", raison: "projet_efface" });
  // Et la livraison inachevée reste rattrapable avec le projet PAYÉ.
  const intentInachevee = (await db.query(`select * from public.dossier_intents where stripe_payment_intent_id = 'pi_failed00001'`)).rows[0];
  assert.equal(contexteDAchat(intentInachevee).etat, "confirme");
  assert.equal(contexteDAchat(intentInachevee).projet.rawText, "Calme.");
  // La liste à réconcilier ne porte aucune donnée personnelle.
  const liste = (await db.query(`select * from public.intentions_a_reconcilier($1)`, [NOW.toISOString()])).rows;
  assert.deepEqual(liste.map((x) => x.etat).sort(), ["livraison_inachevee", "livraison_inachevee", "livraison_inachevee", "paiement_engage_sans_dossier"]);
  assert.deepEqual(Object.keys(liste[0]).sort(), ["created_at", "etat", "stripe_payment_intent_id"]);
  // Idempotente.
  assert.deepEqual((await db.query(`select * from public.purger_dossier_intents($1)`, [NOW.toISOString()])).rows[0],
    { supprimees_abandonnees: 0, projets_effaces: 0, a_reconcilier: 1, livraisons_inachevees: 3 });
  await assert.rejects(db.query(`select * from public.purger_dossier_intents($1, interval '1 day')`, [NOW.toISOString()]), /trop court/);
  await assert.rejects(db.query(`select * from public.purger_dossier_intents($1, interval '30 days', interval '1 hour')`, [NOW.toISOString()]), /trop court/);
});

await cas("dossier payé dont l'intention est introuvable : signalé, et jamais traité comme historique", async () => {
  const db = await base();
  await db.query(`insert into public.address_dossiers (user_id, ban_id, insee, address_label, stripe_payment_intent_id) values ('${A}', 'b', '1', 'x', 'pi_orphelin001')`);
  const liste = (await db.query(`select stripe_payment_intent_id from public.dossiers_sans_intention()`)).rows.map((x) => x.stripe_payment_intent_id);
  assert.deepEqual(liste, ["pi_orphelin001"]);
  assert.deepEqual(contexteDAchat(null, { aUnPaiement: true }), { etat: "indisponible", raison: "intention_introuvable" });
  // L'intention historique (présente, sans project_state) reste une compatibilité prouvée.
  const ancien = (await db.query(`select * from public.dossier_intents where stripe_payment_intent_id = 'pi_ancien0001'`)).rows[0];
  assert.deepEqual(contexteDAchat(ancien), { etat: "historique", raison: "intention_anterieure" });
  await db.exec(`set role authenticated`);
  await assert.rejects(db.query(`select * from public.dossiers_sans_intention()`), /permission denied/);
  await db.exec(`reset role`);
});

await cas("retours arrière : 38 puis 37 s'appliquent, la base revient à son schéma antérieur", async () => {
  const db = await base();
  await db.exec(sql("38_purge_dossier_intents_down.sql"));
  await db.exec(sql("37_contexte_checkout_dossier_down.sql"));
  const cols = (await db.query(`select column_name from information_schema.columns where table_name = 'dossier_intents' order by 1`)).rows.map((x) => x.column_name);
  for (const c of ["place_relation", "place_objective", "project_state", "project_snapshot", "context_locked_at", "place_context_declared_at"]) {
    assert.ok(!cols.includes(c), c);
  }
  assert.equal((await db.query(`select count(*)::int n from public.dossier_intents`)).rows[0].n, 1);
  // Et la migration se rejoue sur la base revenue en arrière (idempotence des `if not exists`).
  await db.exec(sql("37_contexte_checkout_dossier.sql"));
  await db.exec(sql("37_contexte_checkout_dossier.sql"));
});

await cas("schéma complet : les migrations 01 → 38 s'appliquent dans l'ordre sur une base vierge (adaptations de test dites)", async () => {
  const db = new PGlite();
  await db.exec(PREAMBULE);
  for (const { fichier, sql: contenu } of migrationsDeTest()) {
    try { await db.exec(contenu); } catch (e) { throw new Error(`${fichier} : ${e.message.split("\n")[0]}`); }
  }
  const colonnes = async (t) => (await db.query(`select column_name from information_schema.columns where table_schema = 'public' and table_name = $1`, [t])).rows.map((x) => x.column_name);
  const intents = await colonnes("dossier_intents");
  for (const c of ["place_relation", "place_objective", "place_context_declared_at", "project_snapshot", "project_state", "context_locked_at"]) assert.ok(intents.includes(c), c);
  const dossiers = await colonnes("address_dossiers");
  for (const c of ["place_relation", "place_relation_set_at", "place_objective", "place_objective_set_at", "access_revoked_at", "stripe_payment_intent_id"]) assert.ok(dossiers.includes(c), c);
  // Les politiques : dossier_intents n'en a aucune (service role seul) ; address_dossiers et decision_artifact en ont.
  const politiques = async (t) => (await db.query(`select policyname from pg_policies where schemaname = 'public' and tablename = $1`, [t])).rows.length;
  assert.equal(await politiques("dossier_intents"), 0);
  assert.ok(await politiques("address_dossiers") > 0);
  assert.ok(await politiques("decision_artifact") > 0);
  const rls = (await db.query(`select relname, relrowsecurity from pg_class where relname in ('dossier_intents', 'address_dossiers', 'decision_artifact') order by 1`)).rows;
  assert.ok(rls.every((r) => r.relrowsecurity), JSON.stringify(rls));
  const fonctions = (await db.query(`select proname from pg_proc where proname in ('purger_dossier_intents', 'intentions_a_reconcilier', 'etat_livraison_intention', 'dossiers_sans_intention') order by 1`)).rows.map((x) => x.proname);
  assert.deepEqual(fonctions, ["dossiers_sans_intention", "etat_livraison_intention", "intentions_a_reconcilier", "purger_dossier_intents"]);
});

console.log(resultats.join("\n"));
