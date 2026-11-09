// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-94 · LE RETOUR D'UTILITÉ À TRAVERS LE VRAI POSTGREST, SUR LE PROJET SUPABASE DE TEST.
//
// Ce que PGlite ne prouve pas, et que ce script prouve : l'upsert réel de `ecrireRetourUtilite`
// (supabase-js → PostgREST → Postgres), la logique de la route (`enregistrerRetourUtilite`) branchée
// sur les VRAIES lectures de droits (`getDossier`, `loadTerritoryClaims`, sous le JWT d'un vrai
// utilisateur), et les politiques RLS vues par deux comptes réels.
//
// PRÉREQUIS (procédure complète : docs/audits/2026-11-09-fut94-retour-utilite.md, « Intégration
// réelle ») : le projet de TEST `future-e-test`, actif, avec le schéma 01 → 39 ; l'environnement de
// test chargé, jamais `.env.local` :
//   set -a; . ./.env.fut10-test; set +a; node scripts/integration/fut94-supabase-integration.mjs
//
// GARDE-FOU : les lignes Supabase du diagnostic FUT-10 (projet de test déclaré dans
// FUT10_SUPABASE_REF_TEST, production refusée en dur et d'après les `.env` du poste, clés appartenant
// au projet de test). Stripe, e-mails et mesure ne servent pas ici et ne sont pas exigés.
//
// CE QU'IL ÉCRIT, ET CE QU'IL EFFACE : deux comptes jetables `fut94+…@futuree.test`, trois dossiers
// d'adresse et leurs retours. Tout est supprimé en fin de course (y compris en cas d'échec), et la
// suppression elle-même éprouve les cascades. Aucune autre donnée n'est lue ni modifiée.
// ════════════════════════════════════════════════════════════════════════════════════════════
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { diagnostiquer, afficher, refsDeProduction } from "./garde-environnement.mjs";

const diag = diagnostiquer(process.env, refsDeProduction());
const utiles = { ok: diag.lignes.filter((l) => l.nom.startsWith("Supabase")).every((l) => l.ok), lignes: diag.lignes.filter((l) => l.nom.startsWith("Supabase")) };
afficher(utiles);
if (!utiles.ok) process.exit(2);

const racine = pathToFileURL(`${process.cwd()}/`).href;
register(`data:text/javascript,${encodeURIComponent(`
async function premier(c, ctx, next) { for (const x of c.slice(0, -1)) { try { return await next(x, ctx); } catch {} } return next(c[c.length - 1], ctx); }
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (spec.startsWith("@/")) { const b = ${JSON.stringify(racine)} + "src/" + spec.slice(2); return premier([b + ".ts", b + ".tsx", b], ctx, next); }
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\\.[cm]?[jt]sx?$|\\.json$/.test(spec)) return premier([spec + ".ts", spec], ctx, next);
  return next(spec, ctx);
}`)}`);
const { enregistrerRetourUtilite } = await import(`${racine}src/lib/retour-utilite.ts`);
const { ecrireRetourUtilite } = await import(`${racine}src/lib/server/retour-utilite-store.ts`);
const { getDossier } = await import(`${racine}src/lib/address-dossier-store.ts`);
const { loadTerritoryClaims } = await import(`${racine}src/lib/active-territory.ts`);
const { decideTerritoryAccess } = await import(`${racine}src/lib/territory-claims.ts`);

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLIQUE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const client = (cle) => createClient(URL_, cle, { auth: { persistSession: false, autoRefreshToken: false } });
const service = client(process.env.SUPABASE_SERVICE_ROLE_KEY);
const TABLE = "dossier_utility_feedback";

const resultats = [];
async function cas(nom, fn) {
  try { await fn(); resultats.push(`✔ ${nom}`); } catch (e) { resultats.push(`✘ ${nom}\n    ${e.message}`); process.exitCode = 1; }
}
const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));
const refuseEcriture = (r, quoi) => {
  // PostgREST : 42501 (permission denied) quand le rôle n'a pas le privilège.
  assert.ok(r.error, `${quoi} : aurait dû être refusé`);
  assert.equal(r.error.code, "42501", `${quoi} : ${r.error.code} ${r.error.message}`);
};

// ── Mise en place : deux comptes jetables, trois biens ────────────────────────────────────────
const comptes = [];
async function compte(nom) {
  const email = `fut94+${nom}-${Date.now()}@futuree.test`;
  const password = `Test-${crypto.randomUUID()}`;
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  comptes.push(data.user.id);
  const sb = client(PUBLIQUE);
  const s = await sb.auth.signInWithPassword({ email, password });
  if (s.error) throw s.error;
  return { id: data.user.id, sb };
}
async function bien(userId, label) {
  const { data, error } = await service.from("address_dossiers").insert({
    user_id: userId, ban_id: `fut94_${label}`, insee: "44109", address_label: `${label} rue du Test 44000 Nantes`,
    city: "Nantes", postcode: "44000", latitude: 47.2184, longitude: -1.5536,
  }).select("id").single();
  if (error) throw error;
  return data.id;
}
const deps = (u) => ({
  now: new Date(),
  userId: u.id,
  lireDossier: (id) => getDossier(u.sb, u.id, id).catch(() => null),
  communeOuverte: async (insee) => decideTerritoryAccess(await loadTerritoryClaims(u.sb, u.id), insee),
  versionServie: async () => null,
  ecrire: ecrireRetourUtilite,
});
const ligne = async (userId, scope) => {
  const { data, error } = await service.from(TABLE).select("*").eq("user_id", userId).eq("scope_key", scope);
  if (error) throw error;
  return data;
};

let A, B, D1, D2, DB;
try {
  A = await compte("a");
  B = await compte("b");
  D1 = await bien(A.id, "1");
  D2 = await bien(A.id, "2");
  DB = await bien(B.id, "3");

  await cas("prérequis : table, RLS active, une policy de lecture, purge réservée (vus par PostgREST)", async () => {
    const t = await service.from(TABLE).select("id", { count: "exact", head: true });
    assert.equal(t.error, null, t.error?.message);
    const rpcA = await A.sb.rpc("purger_retours_utilite");
    refuseEcriture(rpcA, "purge appelée par un compte ordinaire");
    const rpcAnon = await client(PUBLIQUE).rpc("purger_retours_utilite");
    refuseEcriture(rpcAnon, "purge appelée sans session");
  });

  const S1 = `logement:${D1}`;
  let premiere;
  await cas("1. « Pas vraiment » avec commentaire, par la logique de la route et le vrai PostgREST", async () => {
    const r = await enregistrerRetourUtilite({ insee: "44109", dossierId: D1, answer: "pas_vraiment", comment: "  Rien sur le bruit.  ", presentation: "releve" }, deps(A));
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.deepEqual(r.body.retour, { answer: "pas_vraiment", comment: "Rien sur le bruit." });
    const l = await ligne(A.id, S1);
    assert.equal(l.length, 1);
    premiere = l[0];
    assert.equal(premiere.address_dossier_id, D1);
    assert.ok(premiere.commented_at && premiere.created_at);
  });

  await pause(1200);
  await cas("2. « Oui » sans commentaire : commentaire et commented_at conservés, created_at identique, même ligne", async () => {
    const r = await enregistrerRetourUtilite({ insee: "44109", dossierId: D1, answer: "oui", presentation: "releve" }, deps(A));
    assert.equal(r.status, 200, JSON.stringify(r.body));
    const l = await ligne(A.id, S1);
    assert.equal(l.length, 1, "aucun doublon");
    assert.equal(l[0].id, premiere.id, "même ligne");
    assert.equal(l[0].answer, "oui");
    assert.equal(l[0].comment, "Rien sur le bruit.");
    assert.equal(l[0].commented_at, premiere.commented_at);
    assert.equal(l[0].created_at, premiere.created_at, "created_at inchangé");
    assert.ok(new Date(l[0].updated_at) > new Date(premiere.updated_at), "updated_at avance");
  });

  await cas("3. « Pas encore lu » : comment et commented_at à NULL, même ligne, created_at identique", async () => {
    const r = await enregistrerRetourUtilite({ insee: "44109", dossierId: D1, answer: "pas_encore_lu", presentation: "releve" }, deps(A));
    assert.equal(r.status, 200, JSON.stringify(r.body));
    const l = await ligne(A.id, S1);
    assert.equal(l.length, 1);
    assert.equal(l[0].id, premiere.id);
    assert.equal(l[0].comment, null);
    assert.equal(l[0].commented_at, null);
    assert.equal(l[0].created_at, premiere.created_at);
  });

  await cas("4. double envoi simultané : une seule ligne (contrainte d'unicité sous concurrence réelle)", async () => {
    const r = await Promise.all([1, 2, 3].map(() => enregistrerRetourUtilite({ insee: "44109", dossierId: D2, answer: "oui", presentation: "classique" }, deps(A))));
    assert.ok(r.every((x) => x.status === 200), JSON.stringify(r.map((x) => x.body)));
    assert.equal((await ligne(A.id, `logement:${D2}`)).length, 1);
  });

  await cas("5. isolation entre dossiers d'un même compte : D1, D2 et la commune sont trois lignes distinctes", async () => {
    await enregistrerRetourUtilite({ insee: "44109", answer: "pas_vraiment", comment: "Commune.", presentation: "releve" }, deps(A));
    const { data } = await service.from(TABLE).select("scope_key, answer").eq("user_id", A.id).order("scope_key");
    assert.deepEqual(data.map((x) => x.scope_key).sort(), ["commune", `logement:${D1}`, `logement:${D2}`].sort());
  });

  await cas("6. RLS : le compte lit ses seules lignes", async () => {
    await enregistrerRetourUtilite({ insee: "44109", dossierId: DB, answer: "oui", comment: "Retour de B.", presentation: "releve" }, deps(B));
    const a = await A.sb.from(TABLE).select("user_id, scope_key");
    assert.equal(a.error, null, a.error?.message);
    assert.equal(a.data.length, 3);
    assert.ok(a.data.every((x) => x.user_id === A.id));
    const cible = await A.sb.from(TABLE).select("id").eq("user_id", B.id);
    assert.deepEqual(cible.data, [], "filtrer sur l'identifiant de B ne rend rien");
    const anon = await client(PUBLIQUE).from(TABLE).select("id");
    refuseEcriture(anon, "lecture sans session");
  });

  await cas("7. RLS : aucune écriture directe pour un compte ordinaire, ni sur ses lignes ni sur celles d'un autre", async () => {
    refuseEcriture(await A.sb.from(TABLE).insert({ user_id: A.id, insee_code: "44109", scope_key: "commune", answer: "oui" }), "INSERT direct");
    refuseEcriture(await A.sb.from(TABLE).update({ answer: "oui" }).eq("user_id", A.id), "UPDATE de ses lignes");
    refuseEcriture(await A.sb.from(TABLE).update({ comment: "piraté", commented_at: new Date().toISOString() }).eq("user_id", B.id), "UPDATE des lignes de B");
    refuseEcriture(await A.sb.from(TABLE).delete().eq("user_id", B.id), "DELETE des lignes de B");
    refuseEcriture(await A.sb.from(TABLE).upsert({ user_id: B.id, insee_code: "44109", scope_key: `logement:${DB}`, address_dossier_id: DB, answer: "pas_vraiment" }, { onConflict: "user_id,insee_code,scope_key" }), "UPSERT sur la ligne de B");
    const b = await ligne(B.id, `logement:${DB}`);
    assert.equal(b[0].answer, "oui");
    assert.equal(b[0].comment, "Retour de B.");
  });

  await cas("8. route : B ne peut ni écrire sur le bien de A ni sur une commune qui ne lui est pas ouverte", async () => {
    const r1 = await enregistrerRetourUtilite({ insee: "44109", dossierId: D1, answer: "oui" }, deps(B));
    assert.equal(r1.status, 403);
    const r2 = await enregistrerRetourUtilite({ insee: "33063", answer: "oui" }, deps(B));
    assert.equal(r2.status, 403);
    const l = await ligne(A.id, S1);
    assert.equal(l[0].answer, "pas_encore_lu", "le retour de A est intact");
  });

  await cas("9. purge appelée par le service role : idempotente, sans effet sur des retours récents", async () => {
    const p1 = await service.rpc("purger_retours_utilite");
    assert.equal(p1.error, null, p1.error?.message);
    const p2 = await service.rpc("purger_retours_utilite");
    assert.deepEqual(p2.data, [{ commentaires_effaces: 0, retours_supprimes: 0 }]);
    assert.equal((await ligne(B.id, `logement:${DB}`))[0].comment, "Retour de B.");
  });

  await cas("10. cascade : supprimer un bien supprime son retour, et seulement le sien", async () => {
    const del = await service.from("address_dossiers").delete().eq("id", D2);
    assert.equal(del.error, null, del.error?.message);
    assert.equal((await ligne(A.id, `logement:${D2}`)).length, 0);
    assert.equal((await ligne(A.id, S1)).length, 1);
  });
} finally {
  // ── Nettoyage : supprimer les comptes éprouve la cascade auth.users → retours ──────────────
  for (const id of comptes) {
    const { error } = await service.auth.admin.deleteUser(id);
    if (error) resultats.push(`✘ nettoyage du compte ${id.slice(0, 8)}… : ${error.message}`);
  }
  if (comptes.length) {
    const reste = await service.from(TABLE).select("id").in("user_id", comptes);
    const restants = await service.from("address_dossiers").select("id").in("user_id", comptes);
    if ((reste.data ?? []).length === 0 && (restants.data ?? []).length === 0) {
      resultats.push("✔ 11. cascade : comptes supprimés, leurs retours et leurs biens aussi (rien ne reste)");
    } else {
      resultats.push(`✘ 11. cascade : il reste ${(reste.data ?? []).length} retour(s), ${(restants.data ?? []).length} bien(s)`);
      process.exitCode = 1;
    }
  }
  console.log(resultats.join("\n"));
}
