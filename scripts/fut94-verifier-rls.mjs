// FUT-94 · LA MIGRATION 39 EXÉCUTÉE SUR UN VRAI POSTGRES, ET SES DROITS ÉPROUVÉS.
//
// Postgres embarqué (PGlite, WebAssembly) : aucune base distante n'est touchée. Le script reproduit
// ce que Supabase a et que la migration suppose : les rôles `anon`, `authenticated`, `service_role`
// (ce dernier en BYPASSRLS), les PRIVILÈGES PAR DÉFAUT qui donnent tout aux trois rôles sur chaque
// nouvelle table (d'où le `revoke all` de la migration), `auth.users`, `auth.uid()` lu dans les
// claims JWT, et une `address_dossiers` réduite à ses colonnes de propriété.
//
// PGlite n'est PAS une dépendance du projet. Pour lancer :
//   npm i --no-save @electric-sql/pglite@0.3.14 && node scripts/fut94-verifier-rls.mjs
// ou, avec PGlite installé ailleurs :
//   PGLITE_MODULE=/chemin/node_modules/@electric-sql/pglite/dist/index.js node scripts/fut94-verifier-rls.mjs
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

const mod = process.env.PGLITE_MODULE ? pathToFileURL(process.env.PGLITE_MODULE).href : "@electric-sql/pglite";
const { PGlite } = await import(mod).catch(() => {
  console.error("PGlite introuvable. Voir l'en-tête du script.");
  process.exit(2);
});

const db = new PGlite();
const ALICE = "11111111-1111-4111-8111-111111111111";
const BOB = "22222222-2222-4222-8222-222222222222";
const DA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const DB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  grant usage on schema public to anon, authenticated, service_role;
  create schema auth; grant usage on schema auth to anon, authenticated, service_role;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create table public.address_dossiers (id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade, insee text);
  insert into auth.users values ('${ALICE}'), ('${BOB}');
  insert into public.address_dossiers values ('${DA}', '${ALICE}', '44109'), ('${DB}', '${BOB}', '69383');
`);
await db.exec(readFileSync("supabase/39_retours_utilite_dossier.sql", "utf8"));

let n = 0;
const ok = (m) => { n++; console.log(`✔ ${m}`); };
async function en(role, sub, sql, params = []) {
  await db.exec("reset role");
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [sub ?? ""]);
  await db.exec(`set role ${role}`);
  try { return await db.query(sql, params); } finally { await db.exec("reset role"); }
}
async function refuse(promesse, motif, m) {
  await assert.rejects(promesse, (e) => { assert.match(String(e.message), motif); return true; });
  ok(m);
}
const UPSERT = `insert into public.dossier_utility_feedback
  (user_id, insee_code, scope_key, address_dossier_id, answer, presentation, updated_at)
  values ($1, $2, $3, $4, $5, 'releve', now())
  on conflict (user_id, insee_code, scope_key)
  do update set answer = excluded.answer, updated_at = excluded.updated_at
  returning id, answer, created_at`;

// ── Le service role écrit (c'est le seul chemin d'écriture), et l'unicité tient ──────────────
const a1 = await en("service_role", null, UPSERT, [ALICE, "44109", "commune", null, "pas_encore_lu"]);
const a2 = await en("service_role", null, UPSERT, [ALICE, "44109", "commune", null, "oui"]);
assert.equal(a1.rows[0].id, a2.rows[0].id);
assert.equal(a2.rows[0].answer, "oui");
assert.equal(String(a1.rows[0].created_at), String(a2.rows[0].created_at));
ok("service role : un second envoi remplace la réponse sur la MÊME ligne, created_at inchangé");
await en("service_role", null, UPSERT, [ALICE, "44109", `logement:${DA}`, DA, "pas_vraiment"]);
await en("service_role", null, UPSERT, [BOB, "69123", `logement:${DB}`, DB, "oui"]);
await refuse(
  en("service_role", null, `insert into public.dossier_utility_feedback (user_id, insee_code, scope_key, answer) values ($1, '44109', 'commune', 'oui')`, [ALICE]),
  /duplicate key|unique/, "unicité (compte, commune, portée) : un INSERT nu en double est refusé",
);

// ── Les contraintes refusent ce que la route refuse déjà ────────────────────────────────────
const ins = (cols, vals) => en("service_role", null, `insert into public.dossier_utility_feedback (${cols}) values (${vals})`);
await refuse(ins("user_id, insee_code, scope_key, answer", `'${BOB}', '44109', 'commune', 'bof'`), /check/, "réponse hors des trois valeurs : refusée");
await refuse(ins("user_id, insee_code, scope_key, answer", `'${BOB}', 'Nantes', 'commune', 'oui'`), /check/, "code commune invalide : refusé");
await refuse(ins("user_id, insee_code, scope_key, address_dossier_id, answer", `'${BOB}', '44109', 'commune', '${DB}', 'oui'`), /scope_ck/, "portée « commune » avec un bien : refusée");
await refuse(ins("user_id, insee_code, scope_key, address_dossier_id, answer", `'${BOB}', '69123', 'logement:${DA}', '${DB}', 'oui'`), /scope_ck/, "clé de portée et clé étrangère discordantes : refusées");
await refuse(ins("user_id, insee_code, scope_key, answer", `'${BOB}', '69123', 'logement:${DB}', 'oui'`), /scope_ck/, "portée « logement » sans clé étrangère : refusée");
await refuse(ins("user_id, insee_code, scope_key, answer, comment, commented_at", `'${BOB}', '44109', 'commune', 'oui', '', now()`), /check/, "commentaire vide : refusé (absent = NULL)");
await refuse(ins("user_id, insee_code, scope_key, answer, comment, commented_at", `'${BOB}', '44109', 'commune', 'oui', repeat('a', 2001), now()`), /check/, "commentaire de 2 001 caractères : refusé, pas tronqué");
await refuse(ins("user_id, insee_code, scope_key, answer, comment", `'${BOB}', '44109', 'commune', 'oui', 'x'`), /comment_date_ck/, "commentaire sans date : refusé");
await ins("user_id, insee_code, scope_key, answer, comment, commented_at", `'${BOB}', '44109', 'commune', 'oui', repeat('é', 2000), now()`);
ok("commentaire de 2 000 caractères accentués : accepté (char_length, pas octets)");
await refuse(ins("user_id, insee_code, scope_key, answer, comment, commented_at", `'${BOB}', '75056', 'commune', 'pas_encore_lu', 'x', now()`), /non_lu_ck/, "« pas encore lu » avec un commentaire : refusé");
await refuse(ins("user_id, insee_code, scope_key, address_dossier_id, answer", `'${BOB}', '44109', 'logement:cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'oui'`), /foreign key/, "bien inexistant : refusé par la clé étrangère");

// ── Le lecteur : ses seules lignes, aucune écriture ─────────────────────────────────────────
const lu = await en("authenticated", ALICE, `select user_id, scope_key, answer from public.dossier_utility_feedback order by scope_key`);
assert.deepEqual(lu.rows.map((r) => r.user_id), [ALICE, ALICE]);
ok("authenticated (Alice) : lit ses 2 retours, aucun de Bob");
const luB = await en("authenticated", BOB, `select user_id from public.dossier_utility_feedback`);
assert.ok(luB.rows.length === 2 && luB.rows.every((r) => r.user_id === BOB));
ok("authenticated (Bob) : lit les siens seulement");
const cible = await en("authenticated", BOB, `select count(*)::int as n from public.dossier_utility_feedback where user_id = $1`, [ALICE]);
assert.equal(cible.rows[0].n, 0);
ok("authenticated (Bob) : filtrer sur l'identifiant d'Alice ne rend rien");
await refuse(en("authenticated", ALICE, `insert into public.dossier_utility_feedback (user_id, insee_code, scope_key, answer) values ($1, '75056', 'commune', 'oui')`, [ALICE]), /permission denied/, "authenticated : INSERT refusé, même pour soi");
await refuse(en("authenticated", ALICE, `update public.dossier_utility_feedback set answer = 'oui' where user_id = $1`, [ALICE]), /permission denied/, "authenticated : UPDATE refusé");
await refuse(en("authenticated", ALICE, `delete from public.dossier_utility_feedback`), /permission denied/, "authenticated : DELETE refusé");
await refuse(en("anon", null, `select * from public.dossier_utility_feedback`), /permission denied/, "anon : aucune lecture");
await refuse(en("anon", null, `insert into public.dossier_utility_feedback (user_id, insee_code, scope_key, answer) values ($1, '44109', 'commune', 'oui')`, [BOB]), /permission denied/, "anon : aucune écriture");
const pol = await db.query(`select polname, polcmd from pg_policy where polrelid = 'public.dossier_utility_feedback'::regclass`);
assert.deepEqual(pol.rows, [{ polname: "dossier_utility_feedback_select_own", polcmd: "r" }]);
ok("une seule policy, en lecture");

// ── Conservation : la purge efface les commentaires à 12 mois, supprime les réponses à 24 mois ──
await db.exec(`
  insert into public.dossier_utility_feedback (user_id, insee_code, scope_key, answer, comment, commented_at, updated_at) values
    ('${BOB}', '33063', 'commune', 'oui',          'récent', now() - interval '11 months', now() - interval '11 months'),
    ('${BOB}', '31555', 'commune', 'pas_vraiment', 'ancien', now() - interval '13 months', now() - interval '13 months'),
    ('${BOB}', '06088', 'commune', 'oui',          null,     null,                         now() - interval '25 months'),
    -- Réponse MODIFIÉE récemment, commentaire ancien : le commentaire suit SA date, la réponse la sienne.
    ('${BOB}', '59350', 'commune', 'oui',          'vieux',  now() - interval '13 months', now() - interval '1 month'),
    -- Juste en deçà des bornes : rien ne part.
    ('${BOB}', '67482', 'commune', 'pas_vraiment', 'presque', now() - interval '12 months' + interval '1 hour', now() - interval '24 months' + interval '1 hour');
`);
await refuse(en("authenticated", BOB, `select * from public.purger_retours_utilite()`), /permission denied/, "purge : interdite à authenticated");
await refuse(en("anon", null, `select * from public.purger_retours_utilite()`), /permission denied/, "purge : interdite à anon");
await refuse(en("service_role", null, `select * from public.purger_retours_utilite(interval '2 years', interval '1 year')`), /incohérents/, "purge : délais incohérents refusés");
const purge = await en("service_role", null, `select * from public.purger_retours_utilite()`);
assert.deepEqual(purge.rows, [{ commentaires_effaces: 2, retours_supprimes: 1 }]);
const apresPurge = await db.query(`select insee_code, answer, comment, commented_at from public.dossier_utility_feedback where insee_code in ('33063', '31555', '06088', '59350', '67482') order by insee_code`);
assert.deepEqual(apresPurge.rows.map((r) => [r.insee_code, r.answer, r.comment, r.commented_at === null]), [
  ["31555", "pas_vraiment", null, true], ["33063", "oui", "récent", false], ["59350", "oui", null, true], ["67482", "pas_vraiment", "presque", false],
]);
ok("purge : le commentaire de 13 mois effacé avec sa date (réponse gardée), celui de 11 mois gardé, la réponse de 25 mois supprimée");
ok("purge : réponse modifiée il y a 1 mois, commentaire de 13 mois : le commentaire part, la réponse reste (chacun suit sa date)");
ok("purge : 1 heure en deçà de 12 et de 24 mois, rien ne part");
const droits = await db.query(`select r.rolname, has_function_privilege(r.rolname, 'public.purger_retours_utilite(interval, interval)', 'execute') as peut
  from pg_roles r where r.rolname in ('anon', 'authenticated', 'service_role', 'public') order by 1`);
assert.deepEqual(droits.rows, [
  { rolname: "anon", peut: false }, { rolname: "authenticated", peut: false }, { rolname: "service_role", peut: true },
]);
const def = await db.query(`select prosecdef, proconfig from pg_proc where proname = 'purger_retours_utilite'`);
assert.equal(def.rows[0].prosecdef, true);
assert.deepEqual(def.rows[0].proconfig, ["search_path=public"]);
ok("purge : EXECUTE seulement pour service_role, malgré les privilèges par défaut de Supabase sur les fonctions ; security definer à search_path fixé");
const rejeu = await en("service_role", null, `select * from public.purger_retours_utilite()`);
assert.deepEqual(rejeu.rows, [{ commentaires_effaces: 0, retours_supprimes: 0 }]);
ok("purge : idempotente (un second passage ne fait rien)");

// ── Le cycle de vie suit le compte et le bien ───────────────────────────────────────────────
await db.exec(`delete from public.address_dossiers where id = '${DA}'`);
const apresBien = await db.query(`select scope_key from public.dossier_utility_feedback where user_id = '${ALICE}'`);
assert.deepEqual(apresBien.rows.map((r) => r.scope_key), ["commune"]);
ok("bien supprimé : son retour part avec lui, le retour communal reste");
await db.exec(`delete from auth.users where id = '${BOB}'`);
const apresCompte = await db.query(`select count(*)::int as n from public.dossier_utility_feedback where user_id = '${BOB}'`);
assert.equal(apresCompte.rows[0].n, 0);
ok("compte supprimé : ses retours partent avec lui");

// ── Le retour arrière ─────────────────────────────────────────────────────────────────────────
await db.exec(readFileSync("supabase/39_retours_utilite_dossier_down.sql", "utf8"));
const reste = await db.query(`select to_regclass('public.dossier_utility_feedback') as t, to_regprocedure('public.purger_retours_utilite(interval, interval)') as f`);
assert.equal(reste.rows[0].t, null);
assert.equal(reste.rows[0].f, null);
ok("39_down : la table et la fonction de purge disparaissent");
await db.exec(readFileSync("supabase/39_retours_utilite_dossier.sql", "utf8"));
await db.exec(readFileSync("supabase/39_retours_utilite_dossier.sql", "utf8"));
ok("39 se rejoue deux fois sans erreur (idempotente)");

console.log(`\n${n} vérifications, 0 échec`);
