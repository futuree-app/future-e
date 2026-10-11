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

const modPath = process.env.PGLITE_MODULE;
if (!modPath) {
  console.log("PGLITE_MODULE absent : intégration Postgres NON exécutée (voir l'en-tête du script).");
  process.exit(0);
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
    create table public.address_dossiers (
      id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
      ban_id text not null, insee text not null, address_label text not null,
      posture text default 'residence', stripe_payment_intent_id text unique, amount_paid_cents int,
      purchased_at timestamptz
    );
    insert into auth.users values ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000b');
  `);
  await db.exec(sql("26_dossier_intents.sql"));
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
  await db.exec(`grant all on public.dossier_intents, public.address_dossiers to service_role;`);
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
    await db.exec(`reset role`);
  }
  await db.exec(`set role service_role`);
  await db.query(`select * from public.purger_dossier_intents()`);
  await db.exec(`reset role`);
});

await cas("purge : abandonnées et engagées anciennes supprimées, livrées gardées sans projet, récentes intactes, idempotente", async () => {
  const db = await base();
  const vieux = "2026-08-01T00:00:00Z";
  const ins = (pi, extra = "") => db.query(`insert into public.dossier_intents (stripe_payment_intent_id, user_id, ban_id, insee, address_label, latitude, longitude, amount_due_cents, created_at${extra ? "," + extra.split("=")[0] : ""})
    values ($1, '${A}', 'b', '1', 'x', 1, 1, 1, $2${extra ? ", " + extra.split("=")[1] : ""})`, [pi, pi.includes("recent") ? NOW.toISOString() : vieux]);
  await ins("pi_abandon0001");
  await ins("pi_engagee0001", `context_locked_at='${vieux}'`);
  await ins("pi_recent00001");
  await db.query(`insert into public.dossier_intents (stripe_payment_intent_id, user_id, ban_id, insee, address_label, latitude, longitude, amount_due_cents, created_at, project_state, project_snapshot)
    values ('pi_livre000001', '${A}', 'b', '1', 'x', 1, 1, 1, '${vieux}', 'confirmed', $1)`, [JSON.stringify(PROJET)]);
  await db.query(`insert into public.address_dossiers (user_id, ban_id, insee, address_label, stripe_payment_intent_id) values ('${A}', 'b', '1', 'x', 'pi_livre000001')`);
  const r = (await db.query(`select * from public.purger_dossier_intents($1)`, [NOW.toISOString()])).rows[0];
  // L'intention ancienne de la base (pi_ancien0001) a un dossier : gardée, sans snapshot à effacer.
  assert.deepEqual(r, { supprimees_abandonnees: 1, supprimees_engagees: 1, projets_effaces: 1 });
  const restantes = (await db.query(`select stripe_payment_intent_id from public.dossier_intents order by 1`)).rows.map((x) => x.stripe_payment_intent_id);
  assert.deepEqual(restantes, ["pi_ancien0001", "pi_livre000001", "pi_recent00001"]);
  const livre = (await db.query(`select project_state, project_snapshot from public.dossier_intents where stripe_payment_intent_id = 'pi_livre000001'`)).rows[0];
  assert.equal(livre.project_state, "confirmed");
  assert.equal(livre.project_snapshot.purge, true);
  assert.equal(livre.project_snapshot.rawText, undefined);
  assert.deepEqual(projetPourLivraison(livre), { etat: "absent" });
  assert.deepEqual((await db.query(`select * from public.purger_dossier_intents($1)`, [NOW.toISOString()])).rows[0],
    { supprimees_abandonnees: 0, supprimees_engagees: 0, projets_effaces: 0 });
  await assert.rejects(db.query(`select * from public.purger_dossier_intents($1, interval '1 day')`, [NOW.toISOString()]), /trop court/);
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

console.log(resultats.join("\n"));
