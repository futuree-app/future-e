// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-173 · RECETTE RÉELLE SUR LE PROJET SUPABASE DE TEST : supabase-js → PostgREST → Postgres 17.
//
// Ce que PGlite ne prouve pas, et que ce script prouve : les refus vus À TRAVERS PostgREST avec le
// jeton d'un vrai utilisateur connecté, les écritures du VRAI code serveur (`decision-artifact-ecriture.ts`)
// avec un vrai client service role, la concurrence réelle (plusieurs connexions), et la cascade de
// `auth.admin.deleteUser` sous le rôle du service Auth.
//
// NON EXÉCUTÉ À LA DATE DE LA PR (10/11/2026) : l'environnement de test (`.env.fut10-test`) n'est pas
// présent sur le poste. Protocole complet : docs/audits/2026-11-10-fut173-immutabilite-decision-artifact.md, § 8.
//
//   set -a; . ./.env.fut10-test; set +a
//   node scripts/integration/fut173-recette-supabase.mjs --phase=avant   # schéma 01 → 39 (état de prod)
//   (appliquer 40 sur le projet de TEST)        node … --phase=apres
//   (appliquer 40_down sur le projet de TEST)   node … --phase=avant     # le retour arrière rend l'état 28
//
// GARDE-FOU : les lignes Supabase du diagnostic FUT-10 (projet de test déclaré dans
// FUT10_SUPABASE_REF_TEST, production refusée en dur et d'après les `.env` du poste, clés du projet de
// test). Sortie 2 = environnement refusé, rien n'est fait.
//
// CE QU'IL ÉCRIT, ET CE QU'IL EFFACE : deux comptes jetables `fut173+…@futuree.test` et leurs artefacts
// fictifs (commune 17300). Tout est supprimé en fin de course, y compris en cas d'échec, par
// `auth.admin.deleteUser`, ce qui éprouve la cascade. Aucune autre ligne n'est lue ni modifiée.
// ════════════════════════════════════════════════════════════════════════════════════════════
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { diagnostiquer, afficher, refsDeProduction } from "./garde-environnement.mjs";
import { reserverPlace, figerVersion, marquerEchec, AucunePlaceEnCours } from "../../src/lib/decision/decision-artifact-ecriture.ts";

const diag = diagnostiquer(process.env, refsDeProduction());
const utiles = { ok: diag.lignes.filter((l) => l.nom.startsWith("Supabase")).every((l) => l.ok), lignes: diag.lignes.filter((l) => l.nom.startsWith("Supabase")) };
afficher(utiles);
if (!utiles.ok) process.exit(2);

const phase = process.argv.find((a) => a.startsWith("--phase="))?.slice(8);
if (phase !== "avant" && phase !== "apres") {
  console.error("--phase=avant (migration 28 en place) ou --phase=apres (migration 40 appliquée) est requis.");
  process.exit(2);
}
const APRES = phase === "apres";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLIQUE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const client = (cle) => createClient(URL_, cle, { auth: { persistSession: false, autoRefreshToken: false } });
const service = client(process.env.SUPABASE_SERVICE_ROLE_KEY);
const T = "decision_artifact";
const INSEE = "17300";
const ART = (marque) => ({ schemaVersion: 1, engineVersion: "recette-173", generatedAt: new Date().toISOString(), marque });

const resultats = [];
async function cas(nom, fn) {
  try { await fn(); resultats.push(`✔ ${nom}`); } catch (e) { resultats.push(`✘ ${nom}\n    ${e.message}`); process.exitCode = 1; }
}
const comptes = [];
async function compte(nom) {
  const email = `fut173+${nom}-${Date.now()}@futuree.test`;
  const password = `Test-${crypto.randomUUID()}`;
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  comptes.push(data.user.id);
  const sb = client(PUBLIQUE);
  const s = await sb.auth.signInWithPassword({ email, password });
  if (s.error) throw s.error;
  return { id: data.user.id, sb };
}
const lignes = async (userId) => {
  const { data, error } = await service.from(T).select("version, status, payload, engine_version, generated_at").eq("user_id", userId).order("version");
  if (error) throw error;
  return data;
};
const v = async (userId, version) => (await lignes(userId)).find((l) => l.version === version) ?? null;
const servie = async (userId) => (await lignes(userId)).filter((l) => l.status === "ready").at(-1)?.version ?? null;
/** Refusé par PostgREST avec ce code, ou (avant) accepté. */
const refuse = (r, code, quoi) => {
  assert.ok(r.error, `${quoi} : aurait dû être refusé`);
  assert.equal(r.error.code, code, `${quoi} : ${r.error.code} ${r.error.message}`);
};

let A, B;
try {
  A = await compte("a");
  B = await compte("b");

  // ── Mise en place par le vrai code serveur : A v1 ready, B v1 ready ─────────────────────────
  await cas("génération normale (réserver → figer) par le vrai code serveur, via PostgREST", async () => {
    assert.equal(await reserverPlace(service, A.id, INSEE, "commune", 1), true);
    await figerVersion(service, A.id, INSEE, "commune", ART("A-v1"), 1);
    assert.equal(await reserverPlace(service, B.id, INSEE, "commune", 1), true);
    await figerVersion(service, B.id, INSEE, "commune", ART("B-v1"), 1);
    assert.equal((await v(A.id, 1)).status, "ready");
  });
  const v1 = JSON.stringify(await v(A.id, 1));

  await cas("rejeu d'une même version (webhook rejoué) : false, rien d'écrasé", async () => {
    assert.equal(await reserverPlace(service, A.id, INSEE, "commune", 1), false);
    assert.equal(JSON.stringify(await v(A.id, 1)), v1);
  });
  await cas("authentification : A lit ses versions, B ne voit pas celles de A, anon ne lit rien", async () => {
    const a = await A.sb.from(T).select("version").eq("user_id", A.id);
    assert.equal(a.error, null); assert.equal(a.data.length, 1);
    const b = await B.sb.from(T).select("version").eq("user_id", A.id);
    assert.equal(b.error, null); assert.equal(b.data.length, 0);
    const n = await client(PUBLIQUE).from(T).select("version");
    if (APRES) refuse(n, "42501", "anon select"); else assert.equal(n.data?.length ?? 0, 0);
  });
  await cas("mise à jour : une v2 naît, la v1 ne bouge pas", async () => {
    assert.equal(await reserverPlace(service, A.id, INSEE, "commune", 2), true);
    await figerVersion(service, A.id, INSEE, "commune", ART("A-v2"), 2);
    assert.equal(JSON.stringify(await v(A.id, 1)), v1);
    assert.equal(await servie(A.id), 2);
  });
  await cas("échec d'une v3 : la dernière version prête reste servie ; la failed est terminale", async () => {
    assert.equal(await reserverPlace(service, A.id, INSEE, "commune", 3), true);
    await marquerEchec(service, A.id, INSEE, "commune", 3);
    assert.equal((await v(A.id, 3)).status, "failed");
    assert.equal(await servie(A.id), 2);
    await assert.rejects(figerVersion(service, A.id, INSEE, "commune", ART("A-v3"), 3), AucunePlaceEnCours);
  });
  await cas("zéro ligne modifiée = erreur applicative ; le rattrapage sur une version prête lève et la laisse prête", async () => {
    await assert.rejects(marquerEchec(service, A.id, INSEE, "commune", 99), AucunePlaceEnCours);
    await assert.rejects(marquerEchec(service, A.id, INSEE, "commune", 2), AucunePlaceEnCours);
    assert.equal((await v(A.id, 2)).status, "ready");
  });
  await cas("concurrence réelle : deux réservations du même numéro → une seule gagne ; deux terminaisons → une seule gagne", async () => {
    const r = await Promise.all([reserverPlace(service, A.id, INSEE, "commune", 4), reserverPlace(client(process.env.SUPABASE_SERVICE_ROLE_KEY), A.id, INSEE, "commune", 4)]);
    assert.deepEqual(r.sort(), [false, true]);
    const fin = await Promise.allSettled([
      figerVersion(service, A.id, INSEE, "commune", ART("A-v4-x"), 4),
      figerVersion(client(process.env.SUPABASE_SERVICE_ROLE_KEY), A.id, INSEE, "commune", ART("A-v4-y"), 4),
    ]);
    assert.equal(fin.filter((f) => f.status === "fulfilled").length, 1);
    assert.ok(fin.find((f) => f.status === "rejected").reason instanceof AucunePlaceEnCours);
    const gagnant = fin[0].status === "fulfilled" ? "A-v4-x" : "A-v4-y";
    assert.equal((await v(A.id, 4)).payload.marque, gagnant);
  });

  // ── Les refus : ce que la migration 40 change, vu par PostgREST ─────────────────────────────
  await cas(`propriétaire, jeton réel : réécrire / repasser en failed / supprimer sa v1 prête → ${APRES ? "refusé (42501)" : "ACCEPTÉ (défaut)"}`, async () => {
    const u = await A.sb.from(T).update({ payload: { marque: "falsifie" } }).eq("user_id", A.id).eq("version", 1).select("version");
    const s = await A.sb.from(T).update({ status: "failed" }).eq("user_id", A.id).eq("version", 1).select("version");
    if (APRES) {
      refuse(u, "42501", "update payload"); refuse(s, "42501", "update status");
      refuse(await A.sb.from(T).delete().eq("user_id", A.id).eq("version", 1).select("version"), "42501", "delete");
      assert.equal(JSON.stringify(await v(A.id, 1)), v1);
    } else {
      assert.equal(u.data?.length, 1, "avant : la réécriture passe (c'est le défaut)");
    }
  });
  await cas(`propriétaire, jeton réel : insérer une version ready fabriquée → ${APRES ? "refusé (42501)" : "ACCEPTÉ (défaut)"}`, async () => {
    const r = await A.sb.from(T).insert({ user_id: A.id, insee_code: INSEE, scope_key: "commune", version: 9, status: "ready", payload: { marque: "fabrique" }, generated_at: new Date().toISOString() });
    if (APRES) refuse(r, "42501", "insert ready"); else assert.equal(r.error, null);
  });
  await cas(`autre compte : modifier ou supprimer la v2 de A → ${APRES ? "refusé (42501)" : "0 ligne, sans erreur"}`, async () => {
    const r = await B.sb.from(T).update({ payload: {} }).eq("user_id", A.id).eq("version", 2).select("version");
    if (APRES) refuse(r, "42501", "B update"); else { assert.equal(r.error, null); assert.equal(r.data.length, 0); }
    assert.equal((await v(A.id, 2)).payload.marque, "A-v2");
  });
  await cas(`service role : réécrire / supprimer / insérer ready directement → ${APRES ? "refusé par le trigger (23514 / 23001)" : "ACCEPTÉ (défaut)"}`, async () => {
    const u = await service.from(T).update({ payload: { marque: "serveur" } }).eq("user_id", A.id).eq("version", 2).select("version");
    if (APRES) {
      refuse(u, "23514", "service update ready");
      refuse(await service.from(T).delete().eq("user_id", A.id).eq("version", 2).select("version"), "23001", "service delete ready");
      refuse(await service.from(T).insert({ user_id: A.id, insee_code: INSEE, scope_key: "commune", version: 10, status: "ready", payload: {}, generated_at: new Date().toISOString() }), "23514", "service insert ready");
      refuse(await service.from(T).update({ version: 20 }).eq("user_id", A.id).eq("version", 2).select("version"), "23514", "service change version");
      assert.equal((await v(A.id, 2)).payload.marque, "A-v2");
    } else {
      assert.equal(u.data?.length, 1);
    }
  });

  await cas("suppression d'un compte fictif (auth.admin.deleteUser) : la cascade emporte ses versions prêtes, rien de A", async () => {
    const avantA = (await lignes(A.id)).length;
    const { error } = await service.auth.admin.deleteUser(B.id);
    assert.equal(error, null, error?.message);
    comptes.splice(comptes.indexOf(B.id), 1);
    assert.equal((await lignes(B.id)).length, 0);
    assert.equal((await lignes(A.id)).length, avantA);
  });
} finally {
  for (const id of comptes) {
    const { error } = await service.auth.admin.deleteUser(id);
    if (error) { console.error(`✘ nettoyage : compte fictif ${id} non supprimé (${error.message})`); process.exitCode = 1; }
  }
  const reste = await service.from(T).select("id", { count: "exact", head: true }).in("user_id", [A?.id, B?.id].filter(Boolean));
  console.log(`Nettoyage : ${reste.count ?? "?"} artefact(s) fictif(s) restant(s) (attendu 0).`);
}

console.log(`\nPhase ${phase}\n` + resultats.join("\n"));
