// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-173 · L'IMMUTABILITÉ DE `decision_artifact`, ÉPROUVÉE SUR UN VRAI POSTGRES, AVANT ET APRÈS.
//
// Postgres embarqué (PGlite, WebAssembly) : aucune base distante n'est touchée, aucune donnée réelle.
// Le script reproduit ce que Supabase a et que les migrations supposent : les rôles `anon`,
// `authenticated`, `service_role` (BYPASSRLS), les PRIVILÈGES PAR DÉFAUT qui donnent tout aux trois
// rôles sur chaque nouvelle table, `auth.users`, et `auth.uid()` lu dans les claims JWT comme le fait
// PostgREST. Chaque cas tourne SOUS LE RÔLE que futur•e utilise réellement (`set role`), dans une
// transaction annulée : les cas ne se contaminent pas.
//
//   AVANT = migration 28 seule (l'état versionné en production à la date du ticket).
//   APRÈS = migration 28 + migration 40.
//
// Ce que le script prouve :
//   ✔ la matrice rôle × opération, avant et après, avec le résultat EXACT (lignes touchées, refus) ;
//   ✔ les VRAIES fonctions d'écriture du serveur (`decision-artifact-ecriture.ts`), exécutées sous
//     `service_role` par un client minimal qui émet le SQL que PostgREST émettrait ;
//   ✔ la cascade de suppression de compte et la procédure d'effacement contrôlé ;
//   ✔ le retour arrière (migration 40 down) rétablit l'état d'avant.
// Ce qu'il ne prouve PAS :
//   ✘ PostgREST lui-même ni supabase-js (le client minimal ci-dessous en reproduit les requêtes) ;
//   ✘ la concurrence réelle (PGlite n'a qu'une connexion) : l'idempotence des réservations repose sur
//     la contrainte unique, inchangée, et le refus des doubles transitions sur le trigger, qui voit la
//     ligne VERROUILLÉE (UPDATE en READ COMMITTED : la seconde transaction relit `old` après la première) ;
//   ✘ les droits RÉELS de production : ils supposent les privilèges par défaut de Supabase (à vérifier
//     par supabase/maintenance/fut173-audit-lecture-seule.sql).
//
// Lancement (PGlite n'est PAS une dépendance du projet) :
//   mkdir -p /tmp/pg && (cd /tmp/pg && npm i @electric-sql/pglite@0.5.8)
//   PGLITE_MODULE=/tmp/pg/node_modules/@electric-sql/pglite/dist/index.js node scripts/integration/fut173-decision-artifact-postgres.mjs
// Sortie 0 = tout est conforme ; 1 = un écart ; 3 = NON exécuté (jamais un faux feu vert).
// ════════════════════════════════════════════════════════════════════════════════════════════
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { reserverPlace, figerVersion, marquerEchec, AucunePlaceEnCours } from "../../src/lib/decision/decision-artifact-ecriture.ts";

const modPath = process.env.PGLITE_MODULE;
if (!modPath) {
  console.log("PGLITE_MODULE absent : test Postgres FUT-173 NON exécuté (voir l'en-tête du script).");
  process.exit(3);
}
const { PGlite } = await import(pathToFileURL(modPath).href);
{
  const t = new PGlite();
  console.log((await t.query("select version() v")).rows[0].v.split(" on ")[0]);
  await t.close();
}
const sql = (f) => readFileSync(new URL(`../../supabase/${f}`, import.meta.url), "utf8");

const A = "aaaaaaaa-0000-4000-8000-00000000000a";
const B = "bbbbbbbb-0000-4000-8000-00000000000b";
const INSEE = "17300";
const ARTEFACT = (marque) => ({ schemaVersion: 1, engineVersion: "test-173", generatedAt: "2026-11-10T10:00:00.000Z", marque });

async function base({ avecFut173 }) {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
    grant usage on schema public to anon, authenticated, service_role;
    create schema auth; grant usage on schema auth to anon, authenticated, service_role;
    create table auth.users (id uuid primary key);
    -- Comme sur Supabase : la suppression d'un compte est faite par le service Auth, sous son propre rôle
    -- (non superutilisateur), qui ne possède QUE le schéma auth.
    create role supabase_auth_admin nologin; grant usage on schema auth to supabase_auth_admin;
    grant select, delete on auth.users to supabase_auth_admin;
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid $$;
    insert into auth.users values ('${A}'), ('${B}');
  `);
  await db.exec(sql("28_decision_artifact.sql"));
  if (avecFut173) await db.exec(sql("40_decision_artifact_immuable.sql"));
  // LE JEU DE DONNÉES, construit par le chemin légitime (réserver, puis terminer) sous le propriétaire :
  // il est donc identique avant et après, et valide pour le trigger.
  //   A · commune : v1 ready, v2 failed, v3 generating      B · commune : v1 ready
  const fixe = async (user, version, statut, marque) => {
    await db.query(`insert into public.decision_artifact (user_id, insee_code, scope_key, version) values ($1, '${INSEE}', 'commune', $2)`, [user, version]);
    if (statut === "ready") {
      await db.query(`update public.decision_artifact set status = 'ready', payload = $3, schema_version = 1, engine_version = 'v-ancien', generated_at = '2026-08-05T09:00:00Z'
                       where user_id = $1 and version = $2`, [user, version, JSON.stringify({ marque })]);
    } else if (statut === "failed") {
      await db.query(`update public.decision_artifact set status = 'failed' where user_id = $1 and version = $2`, [user, version]);
    }
  };
  await fixe(A, 1, "ready", "A-v1");
  await fixe(A, 2, "failed");
  await fixe(A, 3, "generating");
  await fixe(B, 1, "ready", "B-v1");
  return db;
}

/** Exécute `fn` sous un rôle et une identité JWT, comme PostgREST : `set role` + claims. */
async function sous(db, role, sub, fn) {
  await db.exec("reset role");
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [JSON.stringify(sub ? { sub, role } : { role })]);
  await db.exec(`set role ${role}`);
  try { return await fn(); } finally { await db.exec("reset role"); }
}

/** Le résultat d'une instruction, en clair : « AUTORISÉ (n) », « 0 LIGNE (silencieux) » ou « REFUSÉ (code) ». */
async function resultat(db, role, sub, requete, params = []) {
  // `set role` et les claims sont posés DANS la transaction : le `rollback` les annule avec elle, et
  // l'erreur réelle n'est pas masquée par un `reset role` lancé dans une transaction avortée (25P02).
  await db.exec("reset role");
  await db.exec("begin");
  try {
    await db.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(sub ? { sub, role } : { role })]);
    await db.exec(`set local role ${role}`);
    const r = await db.query(requete, params);
    const n = r.affectedRows ?? r.rows.length;
    const lignes = /^\s*select/i.test(requete) ? r.rows.length : n;
    return lignes === 0 ? "0 LIGNE" : `AUTORISÉ (${lignes})`;
  } catch (e) {
    return `REFUSÉ (${e.code ?? "?"})`;
  } finally {
    await db.exec("rollback");
  }
}

const OU = (user, version) => `where user_id = '${user}' and insee_code = '${INSEE}' and scope_key = 'commune' and version = ${version}`;

// LA MATRICE. `apres` est le résultat EXIGÉ après la migration 40 ; `avant` est le défaut constaté (exigé
// aussi : si l'« avant » ne reproduit plus le défaut, le banc ne prouve plus rien).
const CAS = [
  // ── Le propriétaire, avec son jeton (rôle `authenticated`), directement par l'API ───────────────
  { id: "P1", qui: "A authenticated", role: "authenticated", sub: A, quoi: "lire ses versions", q: `select * from public.decision_artifact where user_id = '${A}'`, avant: "AUTORISÉ (3)", apres: "AUTORISÉ (3)" },
  { id: "P2", qui: "A authenticated", role: "authenticated", sub: A, quoi: "réécrire le payload de sa v1 ready", q: `update public.decision_artifact set payload = '{"marque":"falsifie"}' ${OU(A, 1)}`, avant: "AUTORISÉ (1)", apres: "REFUSÉ (42501)" },
  { id: "P3", qui: "A authenticated", role: "authenticated", sub: A, quoi: "repasser sa v1 ready en failed", q: `update public.decision_artifact set status = 'failed' ${OU(A, 1)}`, avant: "AUTORISÉ (1)", apres: "REFUSÉ (42501)" },
  { id: "P4", qui: "A authenticated", role: "authenticated", sub: A, quoi: "changer engine/schema_version, generated_at de v1", q: `update public.decision_artifact set engine_version = 'x', schema_version = 9, generated_at = now() ${OU(A, 1)}`, avant: "AUTORISÉ (1)", apres: "REFUSÉ (42501)" },
  { id: "P5", qui: "A authenticated", role: "authenticated", sub: A, quoi: "supprimer sa v1 ready", q: `delete from public.decision_artifact ${OU(A, 1)}`, avant: "AUTORISÉ (1)", apres: "REFUSÉ (42501)" },
  { id: "P6", qui: "A authenticated", role: "authenticated", sub: A, quoi: "changer insee/scope/version de v1", q: `update public.decision_artifact set insee_code = '75056', scope_key = 'logement:x', version = 9 ${OU(A, 1)}`, avant: "AUTORISÉ (1)", apres: "REFUSÉ (42501)" },
  { id: "P7", qui: "A authenticated", role: "authenticated", sub: A, quoi: "donner sa v1 à B (user_id)", q: `update public.decision_artifact set user_id = '${B}' ${OU(A, 1)}`, avant: "REFUSÉ (42501)", apres: "REFUSÉ (42501)" },
  { id: "P8", qui: "A authenticated", role: "authenticated", sub: A, quoi: "insérer une v9 ready au contenu fabriqué", q: `insert into public.decision_artifact (user_id, insee_code, scope_key, version, status, payload, generated_at) values ('${A}', '${INSEE}', 'commune', 9, 'ready', '{"marque":"fabrique"}', now())`, avant: "AUTORISÉ (1)", apres: "REFUSÉ (42501)" },
  { id: "P9", qui: "A authenticated", role: "authenticated", sub: A, quoi: "réserver une place (claim) avant le webhook", q: `insert into public.decision_artifact (user_id, insee_code, scope_key, version, status) values ('${A}', '${INSEE}', 'logement:00000000-0000-4000-8000-000000000001', 1, 'generating')`, avant: "AUTORISÉ (1)", apres: "REFUSÉ (42501)" },
  { id: "P10", qui: "A authenticated", role: "authenticated", sub: A, quoi: "remplir sa v3 generating (contenu libre)", q: `update public.decision_artifact set status = 'ready', payload = '{"marque":"libre"}', generated_at = now() ${OU(A, 3)}`, avant: "AUTORISÉ (1)", apres: "REFUSÉ (42501)" },
  { id: "P11", qui: "A authenticated", role: "authenticated", sub: A, quoi: "supprimer sa v2 failed (témoin)", q: `delete from public.decision_artifact ${OU(A, 2)}`, avant: "AUTORISÉ (1)", apres: "REFUSÉ (42501)" },
  // ── Un autre compte ───────────────────────────────────────────────────────────────────────────
  { id: "X1", qui: "B authenticated", role: "authenticated", sub: B, quoi: "lire les versions de A", q: `select * from public.decision_artifact where user_id = '${A}'`, avant: "0 LIGNE", apres: "0 LIGNE" },
  { id: "X2", qui: "B authenticated", role: "authenticated", sub: B, quoi: "réécrire la v1 de A", q: `update public.decision_artifact set payload = '{}' ${OU(A, 1)}`, avant: "0 LIGNE", apres: "REFUSÉ (42501)" },
  { id: "X3", qui: "B authenticated", role: "authenticated", sub: B, quoi: "supprimer la v1 de A", q: `delete from public.decision_artifact ${OU(A, 1)}`, avant: "0 LIGNE", apres: "REFUSÉ (42501)" },
  { id: "X4", qui: "B authenticated", role: "authenticated", sub: B, quoi: "insérer une version au nom de A", q: `insert into public.decision_artifact (user_id, insee_code, scope_key, version) values ('${A}', '${INSEE}', 'commune', 9)`, avant: "REFUSÉ (42501)", apres: "REFUSÉ (42501)" },
  { id: "N1", qui: "anon", role: "anon", sub: null, quoi: "lire la table", q: `select * from public.decision_artifact`, avant: "0 LIGNE", apres: "REFUSÉ (42501)" },
  { id: "N2", qui: "anon", role: "anon", sub: null, quoi: "insérer", q: `insert into public.decision_artifact (user_id, insee_code, scope_key, version) values ('${A}', '${INSEE}', 'commune', 9)`, avant: "REFUSÉ (42501)", apres: "REFUSÉ (42501)" },
  // ── Le serveur (service_role, BYPASSRLS) : webhook, et désormais toutes les écritures ───────────
  { id: "S1", qui: "service_role", role: "service_role", sub: null, quoi: "réécrire le payload d'une v1 ready", q: `update public.decision_artifact set payload = '{"marque":"serveur"}' ${OU(A, 1)}`, avant: "AUTORISÉ (1)", apres: "REFUSÉ (23514)" },
  { id: "S2", qui: "service_role", role: "service_role", sub: null, quoi: "ready → failed (SQL de l'ancien failArtifact)", q: `update public.decision_artifact set status = 'failed' ${OU(A, 1)}`, avant: "AUTORISÉ (1)", apres: "REFUSÉ (23514)" },
  { id: "S3", qui: "service_role", role: "service_role", sub: null, quoi: "ready → ready (ancien completeArtifact rejoué)", q: `update public.decision_artifact set status = 'ready', payload = '{"marque":"rejoue"}', generated_at = now() ${OU(A, 1)}`, avant: "AUTORISÉ (1)", apres: "REFUSÉ (23514)" },
  { id: "S4", qui: "service_role", role: "service_role", sub: null, quoi: "changer l'identité (version) d'une v1 ready", q: `update public.decision_artifact set version = 7 ${OU(A, 1)}`, avant: "AUTORISÉ (1)", apres: "REFUSÉ (23514)" },
  { id: "S5", qui: "service_role", role: "service_role", sub: null, quoi: "changer user_id d'une v1 ready", q: `update public.decision_artifact set user_id = '${B}' ${OU(A, 1)}`, avant: "REFUSÉ (23505)", apres: "REFUSÉ (23514)" },
  { id: "S6", qui: "service_role", role: "service_role", sub: null, quoi: "supprimer une v1 ready", q: `delete from public.decision_artifact ${OU(A, 1)}`, avant: "AUTORISÉ (1)", apres: "REFUSÉ (23001)" },
  { id: "S7", qui: "service_role", role: "service_role", sub: null, quoi: "insérer directement une version ready", q: `insert into public.decision_artifact (user_id, insee_code, scope_key, version, status, payload, generated_at) values ('${A}', '${INSEE}', 'commune', 9, 'ready', '{}', now())`, avant: "AUTORISÉ (1)", apres: "REFUSÉ (23514)" },
  { id: "S8", qui: "service_role", role: "service_role", sub: null, quoi: "failed → ready (ressusciter v2)", q: `update public.decision_artifact set status = 'ready', payload = '{}', generated_at = now() ${OU(A, 2)}`, avant: "AUTORISÉ (1)", apres: "REFUSÉ (23514)" },
  { id: "S9", qui: "service_role", role: "service_role", sub: null, quoi: "generating → ready SANS contenu", q: `update public.decision_artifact set status = 'ready' ${OU(A, 3)}`, avant: "AUTORISÉ (1)", apres: "REFUSÉ (23514)" },
  { id: "S10", qui: "service_role", role: "service_role", sub: null, quoi: "réserver v4 (claim)", q: `insert into public.decision_artifact (user_id, insee_code, scope_key, version, status) values ('${A}', '${INSEE}', 'commune', 4, 'generating')`, avant: "AUTORISÉ (1)", apres: "AUTORISÉ (1)" },
  { id: "S11", qui: "service_role", role: "service_role", sub: null, quoi: "réserver v1 déjà prise (rejeu webhook)", q: `insert into public.decision_artifact (user_id, insee_code, scope_key, version, status) values ('${A}', '${INSEE}', 'commune', 1, 'generating')`, avant: "REFUSÉ (23505)", apres: "REFUSÉ (23505)" },
  { id: "S12", qui: "service_role", role: "service_role", sub: null, quoi: "generating → ready avec contenu (v3)", q: `update public.decision_artifact set status = 'ready', payload = '{"marque":"A-v3"}', engine_version = 'e', generated_at = now() ${OU(A, 3)} and status = 'generating'`, avant: "AUTORISÉ (1)", apres: "AUTORISÉ (1)" },
  { id: "S13", qui: "service_role", role: "service_role", sub: null, quoi: "generating → failed (v3)", q: `update public.decision_artifact set status = 'failed' ${OU(A, 3)} and status = 'generating'`, avant: "AUTORISÉ (1)", apres: "AUTORISÉ (1)" },
  { id: "S14", qui: "service_role", role: "service_role", sub: null, quoi: "supprimer une v2 failed", q: `delete from public.decision_artifact ${OU(A, 2)}`, avant: "AUTORISÉ (1)", apres: "AUTORISÉ (1)" },
  { id: "S15", qui: "service_role", role: "service_role", sub: null, quoi: "TRUNCATE la table", q: `truncate public.decision_artifact`, avant: "AUTORISÉ (0)", apres: "REFUSÉ (42501)" },
  { id: "S16", qui: "service_role", role: "service_role", sub: null, quoi: "lire toutes les versions", q: `select * from public.decision_artifact`, avant: "AUTORISÉ (4)", apres: "AUTORISÉ (4)" },
];

let ecarts = 0;
const lignesMatrice = [];
for (const phase of ["avant", "apres"]) {
  const db = await base({ avecFut173: phase === "apres" });
  for (const c of CAS) {
    let r = await resultat(db, c.role, c.sub, c.q);
    if (/^\s*truncate/i.test(c.q) && r === "0 LIGNE") r = "AUTORISÉ (0)";
    c[`obtenu_${phase}`] = r;
    if (r !== c[phase]) { ecarts++; console.log(`✘ ${c.id} [${phase}] ${c.quoi} : attendu ${c[phase]}, obtenu ${r}`); }
  }
  await db.close();
}
for (const c of CAS) lignesMatrice.push(`| ${c.id} | ${c.qui} | ${c.quoi} | ${c.obtenu_avant} | ${c.obtenu_apres} |`);
console.log("\n| Cas | Rôle | Opération | AVANT (28) | APRÈS (28+40) |\n|---|---|---|---|---|\n" + lignesMatrice.join("\n"));

// ── LES PARCOURS, AVEC LE VRAI CODE D'ÉCRITURE DU SERVEUR ─────────────────────────────────────
// Un client minimal à la forme de supabase-js : il émet le SQL que PostgREST émettrait pour
// `.insert(...)` et `.update(...).eq(...).select(...)`, sous le rôle donné, et rend { data, error }.
function client(db, role, sub = null) {
  return {
    from(table) {
      return {
        insert(ligne) {
          const cols = Object.keys(ligne);
          const exec = () => sous(db, role, sub, () => db.query(
            `insert into public.${table} (${cols.join(", ")}) values (${cols.map((_, i) => `$${i + 1}`).join(", ")})`,
            cols.map((k) => ligne[k])))
            .then(() => ({ error: null }), (e) => ({ error: { code: e.code, message: e.message } }));
          return { then: (ok, ko) => exec().then(ok, ko) };
        },
        update(champs) {
          const filtres = [];
          const b = {
            eq(col, val) { filtres.push([col, val]); return b; },
            select() {
              const cols = Object.keys(champs);
              const val = (v) => (v !== null && typeof v === "object" ? JSON.stringify(v) : v);
              const params = [...cols.map((k) => val(champs[k])), ...filtres.map(([, v]) => v)];
              const exec = () => sous(db, role, sub, () => db.query(
                `update public.${table} set ${cols.map((k, i) => `${k} = $${i + 1}`).join(", ")}
                  where ${filtres.map(([c], i) => `${c} = $${cols.length + i + 1}`).join(" and ")} returning version`, params))
                .then((r) => ({ data: r.rows, error: null }), (e) => ({ data: null, error: { code: e.code, message: e.message } }));
              return { then: (ok, ko) => exec().then(ok, ko) };
            },
          };
          return b;
        },
      };
    },
  };
}

const resultats = [];
async function cas(nom, fn) {
  try { await fn(); resultats.push(`✔ ${nom}`); } catch (e) { resultats.push(`✘ ${nom}\n    ${e.message}`); ecarts++; }
}
const ligne = async (db, user, version) => (await db.query(
  `select status, payload, engine_version, schema_version, generated_at from public.decision_artifact ${OU(user, version)}`)).rows[0] ?? null;
// « Ce que le lecteur voit » : la dernière version PRÊTE (la règle de `readLatestArtifact`/`etatArtefact`).
const servie = async (db, user) => (await db.query(
  `select version, payload->>'marque' as marque from public.decision_artifact where user_id = $1 and status = 'ready' order by version desc limit 1`, [user])).rows[0] ?? null;

{
  const db = await base({ avecFut173: true });
  const srv = client(db, "service_role");
  const v1Avant = JSON.stringify(await ligne(db, A, 1));

  await cas("1 · le propriétaire ne peut pas modifier une version ready (payload, statut, versions, date, identité)", async () => {
    for (const id of ["P2", "P3", "P4", "P6", "P7"]) assert.equal(CAS.find((c) => c.id === id).obtenu_apres, "REFUSÉ (42501)", id);
    assert.equal(JSON.stringify(await ligne(db, A, 1)), v1Avant);
  });
  await cas("2 · il ne peut pas la supprimer par une requête ordinaire", async () => {
    assert.equal(CAS.find((c) => c.id === "P5").obtenu_apres, "REFUSÉ (42501)");
    assert.equal(CAS.find((c) => c.id === "S6").obtenu_apres, "REFUSÉ (23001)");
  });
  await cas("3 · un autre compte ne lit ni ne modifie rien ; anon n'a rien", async () => {
    assert.equal(CAS.find((c) => c.id === "X1").obtenu_apres, "0 LIGNE");
    for (const id of ["X2", "X3", "X4", "N1", "N2"]) assert.match(CAS.find((c) => c.id === id).obtenu_apres, /^REFUSÉ/, id);
  });
  await cas("4 · la génération normale generating → ready fonctionne (vrai code serveur, service_role)", async () => {
    assert.equal(await reserverPlace(srv, A, INSEE, "commune", 4), true);
    await figerVersion(srv, A, INSEE, "commune", ARTEFACT("A-v4"), 4);
    const l = await ligne(db, A, 4);
    assert.equal(l.status, "ready");
    assert.equal(l.payload.marque, "A-v4");
    assert.equal(l.engine_version, "test-173");
  });
  await cas("4b · un webhook rejoué ne réserve pas deux fois (23505 → false)", async () => {
    assert.equal(await reserverPlace(srv, A, INSEE, "commune", 4), false);
    assert.equal(await reserverPlace(srv, A, INSEE, "commune", 1), false);
  });
  await cas("5 · une génération échouée ne fait pas disparaître la dernière version prête", async () => {
    assert.equal(await reserverPlace(srv, A, INSEE, "commune", 5), true);
    await marquerEchec(srv, A, INSEE, "commune", 5);
    assert.equal((await ligne(db, A, 5)).status, "failed");
    assert.deepEqual(await servie(db, A), { version: 4, marque: "A-v4" });
  });
  await cas("5b · reprise selon le contrat : la version SUIVANTE, jamais la failed réécrite", async () => {
    await assert.rejects(figerVersion(srv, A, INSEE, "commune", ARTEFACT("A-v5"), 5), AucunePlaceEnCours);
    assert.equal((await ligne(db, A, 5)).status, "failed");
    assert.equal(await reserverPlace(srv, A, INSEE, "commune", 6), true);
    await figerVersion(srv, A, INSEE, "commune", ARTEFACT("A-v6"), 6);
    assert.deepEqual(await servie(db, A), { version: 6, marque: "A-v6" });
  });
  await cas("6 · une v2 se crée sans mutation de la v1", async () => {
    assert.equal(JSON.stringify(await ligne(db, A, 1)), v1Avant);
    const rB = (await db.query(`select payload->>'marque' m from public.decision_artifact where user_id = $1 and version = 1`, [B])).rows[0].m;
    assert.equal(rB, "B-v1");
  });
  await cas("7 · transitions et mutations d'identité interdites échouent, même en service_role", async () => {
    for (const id of ["S1", "S2", "S3", "S4", "S5", "S7", "S8", "S9"]) assert.match(CAS.find((c) => c.id === id).obtenu_apres, /^REFUSÉ \(23514\)$/, id);
  });
  await cas("8 · les écritures du serveur ne contournent pas l'invariant : le rattrapage `marquerEchec` sur une version déjà prête lève, la version reste prête", async () => {
    await assert.rejects(marquerEchec(srv, A, INSEE, "commune", 6), AucunePlaceEnCours);
    await assert.rejects(figerVersion(srv, A, INSEE, "commune", ARTEFACT("A-v6-bis"), 6), AucunePlaceEnCours);
    assert.equal((await ligne(db, A, 6)).payload.marque, "A-v6");
    // Le trigger tient même si le filtre `status = generating` disparaissait du code : c'est S2/S3.
    assert.equal(CAS.find((c) => c.id === "S2").obtenu_apres, "REFUSÉ (23514)");
  });
  await cas("8b · le code serveur ne peut plus écrire avec le jeton du lecteur (ancien chemin /rapport)", async () => {
    const lecteur = client(db, "authenticated", A);
    await assert.rejects(reserverPlace(lecteur, A, INSEE, "commune", 7), (e) => e.code === "42501");
  });
  await cas("8c · une écriture qui ne touche aucune ligne n'est pas un succès", async () => {
    await assert.rejects(marquerEchec(srv, A, INSEE, "commune", 99), AucunePlaceEnCours);
    await assert.rejects(figerVersion(srv, B, INSEE, "commune", ARTEFACT("x"), 99), AucunePlaceEnCours);
  });
  await cas("9a · suppression du compte (Auth) : la cascade emporte toutes les versions de B, ready comprise, et rien de A", async () => {
    const avantA = (await db.query(`select count(*)::int n from public.decision_artifact where user_id = $1`, [A])).rows[0].n;
    // Sous le rôle du service Auth, pas en superutilisateur : la cascade et le trigger (SECURITY DEFINER,
    // search_path vide) doivent passer sans qu'il ait le moindre droit sur decision_artifact.
    await db.exec("set role supabase_auth_admin");
    try { await db.query(`delete from auth.users where id = $1`, [B]); } finally { await db.exec("reset role"); }
    assert.equal((await db.query(`select count(*)::int n from public.decision_artifact where user_id = $1`, [B])).rows[0].n, 0);
    assert.equal((await db.query(`select count(*)::int n from public.decision_artifact where user_id = $1`, [A])).rows[0].n, avantA);
  });
  await cas("9b · effacement ciblé contrôlé (procédure de maintenance, rôle propriétaire) puis trigger réactivé", async () => {
    const proc = readFileSync(new URL("../../supabase/maintenance/fut173-effacement-controle.sql", import.meta.url), "utf8")
      .replace("'00000000-0000-0000-0000-000000000000'::uuid", `'${A}'::uuid`)
      .replace("version in (1)", "version in (4)");
    await db.exec(proc);
    const ctrl = (await db.query(`select (select count(*)::int from public.decision_artifact where user_id = $1 and version = 4) restantes,
      (select tgenabled from pg_trigger where tgname = 'decision_artifact_integrite') etat`, [A])).rows[0];
    assert.equal(ctrl.restantes, 0);
    assert.equal(ctrl.etat, "O");
    await db.exec("commit");
    assert.equal(JSON.stringify(await ligne(db, A, 1)), v1Avant);
    // Hors de cette procédure, la protection est intacte.
    await assert.rejects(db.query(`delete from public.decision_artifact ${OU(A, 1)}`), (e) => e.code === "23001");
  });
  await cas("9c · la purge des intentions (38) lit toujours l'état de livraison (lecture seule de la table)", async () => {
    const r = await sous(db, "service_role", null, () => db.query(`select count(*)::int n from public.decision_artifact where status = 'ready' and payload is not null`));
    assert.ok(r.rows[0].n >= 2);
  });
  await db.close();
}

await cas("10 · retour arrière : 40_down rétablit les droits de la 28 (le propriétaire réécrit de nouveau, comme avant)", async () => {
  const db = await base({ avecFut173: true });
  await db.exec(sql("40_decision_artifact_immuable_down.sql"));
  assert.equal(await resultat(db, "authenticated", A, CAS.find((c) => c.id === "P2").q), "AUTORISÉ (1)");
  assert.equal(await resultat(db, "service_role", null, CAS.find((c) => c.id === "S2").q), "AUTORISÉ (1)");
  const pol = (await db.query(`select count(*)::int n from pg_policies where tablename = 'decision_artifact'`)).rows[0].n;
  assert.equal(pol, 4);
  await db.close();
});

// LES PRIVILÈGES EXACTS, par rôle. AVANT = ce qu'a relevé l'audit de production du 10/11/2026 (privilèges
// par défaut de Supabase : les 7 pour les 3 rôles) ; APRÈS = le strict nécessaire ; DOWN = retour à AVANT.
const privileges = async (db) => Object.fromEntries((await db.query(
  `select r.rolname as role, coalesce((select string_agg(p, ',' order by p) from unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) p
      where has_table_privilege(r.rolname, 'public.decision_artifact', p)), '') as privs
     from pg_roles r where r.rolname in ('anon', 'authenticated', 'service_role') order by 1`)).rows.map((l) => [l.role, l.privs]));
const TOUS = "DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE";

await cas("12 · privilèges exacts : authenticated = SELECT seul, anon = rien, service_role = SELECT/INSERT/UPDATE/DELETE ; le retour arrière rend l'état relevé en production", async () => {
  const db = await base({ avecFut173: false });
  const avant = await privileges(db);
  assert.deepEqual(avant, { anon: TOUS, authenticated: TOUS, service_role: TOUS });
  await db.exec(sql("40_decision_artifact_immuable.sql"));
  assert.deepEqual(await privileges(db), { anon: "", authenticated: "SELECT", service_role: "DELETE,INSERT,SELECT,UPDATE" });
  // La lecture du propriétaire, seule permise, marche encore sous RLS.
  assert.equal(await resultat(db, "authenticated", A, `select * from public.decision_artifact`), "AUTORISÉ (3)");
  const pol = (await db.query(`select policyname from pg_policies where tablename = 'decision_artifact' order by 1`)).rows.map((l) => l.policyname);
  assert.deepEqual(pol, ["decision_artifact_own_select"]);
  await db.exec(sql("40_decision_artifact_immuable_down.sql"));
  assert.deepEqual(await privileges(db), avant);
  await db.close();
});

await cas("13 · la fonction SECURITY DEFINER : search_path vide, exécution refusée à tous les rôles exposés, et elle marche quand même sous chacun", async () => {
  const db = await base({ avecFut173: true });
  const f = (await db.query(`select prosecdef, proconfig from pg_proc where proname = 'decision_artifact_integrite'`)).rows[0];
  assert.equal(f.prosecdef, true);
  assert.deepEqual(f.proconfig, ['search_path=""']);
  for (const r of ["anon", "authenticated", "service_role"]) {
    const ok = (await db.query(`select has_function_privilege($1, 'public.decision_artifact_integrite()', 'EXECUTE') e`, [r])).rows[0].e;
    assert.equal(ok, false, r);
  }
  // Le trigger se déclenche malgré tout (l'EXECUTE n'est pas vérifié au déclenchement), et un search_path
  // hostile chez l'appelant n'y change rien.
  await db.exec("begin");
  await db.exec("create schema piege; set local search_path = piege");
  await db.exec("set local role service_role");
  await assert.rejects(db.query(`update public.decision_artifact set payload = '{}' ${OU(A, 1)}`), (e) => e.code === "23514");
  await db.exec("rollback");
  await db.close();
});

await cas("11 · la migration 40 s'applique sur une base qui porte déjà des lignes de tous statuts, sans les modifier", async () => {
  const db = await base({ avecFut173: false });
  const photo = async () => JSON.stringify((await db.query(`select * from public.decision_artifact order by user_id, version`)).rows);
  const avant = await photo();
  await db.exec(sql("40_decision_artifact_immuable.sql"));
  assert.equal(await photo(), avant);
  // Et elle est rejouable (if exists / or replace).
  await db.exec(sql("40_decision_artifact_immuable.sql"));
  await db.close();
});

console.log("\n" + resultats.join("\n"));
console.log(ecarts === 0 ? `\nFUT-173 : ${CAS.length} cas de matrice × 2 phases et ${resultats.length} parcours conformes.` : `\nFUT-173 : ${ecarts} écart(s).`);
process.exitCode = ecarts === 0 ? 0 : 1;
