// FUT-94 · L'UPSERT DU RETOUR D'UTILITÉ, DE SUPABASE-JS JUSQU'À POSTGRES.
//
// Deux moitiés, prouvées séparément, sans aucune base distante :
//
//   1. CE QUE LE VRAI STOCKAGE ENVOIE. `ecrireRetourUtilite` (lib/server/retour-utilite-store.ts) est
//      appelé tel quel, avec le supabase-js du projet, contre un serveur HTTP local qui joue PostgREST
//      et ENREGISTRE la requête : méthode, table, `on_conflict`, en-tête `Prefer`, colonnes du corps.
//
//   2. CE QUE POSTGRES EN FAIT. Le corps capturé est rejoué dans PGlite (migration 39 appliquée) sous
//      la forme SQL que PostgREST produit pour `Prefer: resolution=merge-duplicates` :
//        INSERT INTO t (<colonnes du corps>) SELECT <colonnes> FROM json_populate_recordset(null::t, $1)
//        ON CONFLICT (<on_conflict>) DO UPDATE SET <col> = EXCLUDED.<col>, … (colonnes du corps seules)
//      d'où la conservation de `created_at` (jamais envoyé) et du commentaire (non envoyé sans clé).
//
// CE QUE CE SCRIPT NE PROUVE PAS : la traduction elle-même par le binaire PostgREST. Elle se vérifie
// sur le projet Supabase de test, ou avec un PostgREST local (voir la note de livraison).
//
// Lancement : PGLITE_MODULE=/chemin/node_modules/@electric-sql/pglite/dist/index.js node scripts/fut94-verifier-upsert.mjs
import { createServer } from "node:http";
import { register } from "node:module";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

if (!process.env.PGLITE_MODULE) { console.error("PGLITE_MODULE requis (voir l'en-tête)."); process.exit(2); }

// ── 1. Le serveur qui joue PostgREST ──────────────────────────────────────────────────────────
const requetes = [];
const serveur = createServer((req, res) => {
  let corps = "";
  req.on("data", (c) => { corps += c; });
  req.on("end", () => {
    const json = JSON.parse(corps);
    requetes.push({ methode: req.method, url: new URL(req.url, "http://x"), prefer: req.headers.prefer ?? "", accept: req.headers.accept ?? "", corps: json });
    // Réponse au format PostgREST (Accept: application/vnd.pgrst.object+json ⇒ un objet).
    res.writeHead(201, { "content-type": "application/vnd.pgrst.object+json; charset=utf-8" });
    res.end(JSON.stringify({ answer: json.answer, comment: json.comment ?? null }));
  });
});
await new Promise((ok) => serveur.listen(0, "127.0.0.1", ok));
process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${serveur.address().port}`;
process.env.SUPABASE_SERVICE_ROLE_KEY = "cle-fictive-de-service";

// Le module réel : `server-only` neutralisé, alias `@/` résolu, TypeScript chargé par Node.
const racine = pathToFileURL(`${process.cwd()}/`).href;
register(`data:text/javascript,${encodeURIComponent(`
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (spec.startsWith("@/")) {
    const b = ${JSON.stringify(racine)} + "src/" + spec.slice(2);
    try { return await next(b + ".ts", ctx); } catch { return next(b, ctx); }
  }
  return next(spec, ctx);
}`)}`);
const { ecrireRetourUtilite } = await import(`${racine}src/lib/server/retour-utilite-store.ts`);

let n = 0;
const ok = (m) => { n++; console.log(`✔ ${m}`); };
const U = "11111111-1111-4111-8111-111111111111";
const base = { user_id: U, insee_code: "44109", scope_key: "commune", address_dossier_id: null, artifact_version: 2, presentation: "releve" };

const r1 = await ecrireRetourUtilite({ ...base, answer: "pas_vraiment", updated_at: "2026-11-09T10:00:00.000Z", comment: "Rien sur le bruit.", commented_at: "2026-11-09T10:00:00.000Z" });
const r2 = await ecrireRetourUtilite({ ...base, answer: "oui", updated_at: "2026-11-10T08:00:00.000Z" });
const r3 = await ecrireRetourUtilite({ ...base, answer: "pas_encore_lu", updated_at: "2026-11-11T08:00:00.000Z", comment: null, commented_at: null });
serveur.close();
assert.deepEqual(r1, { answer: "pas_vraiment", comment: "Rien sur le bruit." });
assert.ok(r2 && r3);

for (const q of requetes) {
  assert.equal(q.methode, "POST");
  assert.equal(q.url.pathname, "/rest/v1/dossier_utility_feedback");
  assert.equal(q.url.searchParams.get("on_conflict"), "user_id,insee_code,scope_key");
  assert.match(q.prefer, /resolution=merge-duplicates/);
  assert.match(q.prefer, /return=representation/);
  assert.equal(q.url.searchParams.get("select"), "answer,comment");
  assert.ok(!("created_at" in q.corps) && !("id" in q.corps), "ni created_at ni id ne sont envoyés");
}
ok("supabase-js : POST /rest/v1/dossier_utility_feedback?on_conflict=user_id,insee_code,scope_key, Prefer resolution=merge-duplicates");
assert.deepEqual(Object.keys(requetes[1].corps).sort(), ["address_dossier_id", "answer", "artifact_version", "insee_code", "presentation", "scope_key", "updated_at", "user_id"]);
ok("changer la réponse sans commentaire n'envoie ni `comment` ni `commented_at`");
assert.equal(requetes[2].corps.comment, null);
assert.equal(requetes[2].corps.commented_at, null);
ok("« pas encore lu » envoie explicitement comment = null et commented_at = null");

// ── 2. Postgres, sous la forme SQL de PostgREST ───────────────────────────────────────────────
const { PGlite } = await import(pathToFileURL(process.env.PGLITE_MODULE).href);
const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  create schema auth; create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
  create table public.address_dossiers (id uuid primary key, user_id uuid references auth.users(id) on delete cascade);
  insert into auth.users values ('${U}');
`);
await db.exec(readFileSync("supabase/39_retours_utilite_dossier.sql", "utf8"));

/** La requête que PostgREST construit pour un upsert merge-duplicates d'un objet. */
async function commePostgrest(q) {
  const cols = Object.keys(q.corps);
  const conflit = q.url.searchParams.get("on_conflict").split(",");
  const liste = cols.map((c) => `"${c}"`).join(", ");
  const maj = cols.filter((c) => !conflit.includes(c)).map((c) => `"${c}" = excluded."${c}"`).join(", ");
  const sql = `insert into public.dossier_utility_feedback (${liste})
    select ${liste} from json_populate_recordset(null::public.dossier_utility_feedback, $1::json)
    on conflict (${conflit.map((c) => `"${c}"`).join(", ")}) do update set ${maj}
    returning answer, comment, commented_at, created_at, updated_at`;
  await db.exec("set role service_role");
  try { return (await db.query(sql, [JSON.stringify([q.corps])])).rows[0]; } finally { await db.exec("reset role"); }
}
const l1 = await commePostgrest(requetes[0]);
await db.exec("select pg_sleep(0.05)");
const l2 = await commePostgrest(requetes[1]);
assert.equal(String(l2.created_at), String(l1.created_at));
ok("created_at : fixé à la première réponse, inchangé par l'upsert suivant");
assert.equal(l2.answer, "oui");
assert.equal(l2.comment, "Rien sur le bruit.");
assert.equal(String(l2.commented_at), String(l1.commented_at));
ok("Pas vraiment → Oui sans clé `comment` : commentaire ET sa date conservés");
const l3 = await commePostgrest(requetes[2]);
assert.equal(l3.answer, "pas_encore_lu");
assert.equal(l3.comment, null);
assert.equal(l3.commented_at, null);
assert.equal(String(l3.created_at), String(l1.created_at));
ok("→ Pas encore lu : commentaire et date effacés, created_at toujours inchangé");
const total = await db.query("select count(*)::int as n from public.dossier_utility_feedback");
assert.equal(total.rows[0].n, 1);
ok("trois envois, une seule ligne");
// Sans l'effacement explicite, la base refuserait l'état incohérent.
await assert.rejects(commePostgrest({ ...requetes[1], corps: { ...requetes[0].corps, answer: "pas_encore_lu" } }), /non_lu_ck/);
ok("« pas encore lu » qui porterait encore un commentaire : refusé par la contrainte");

console.log(`\n${n} vérifications, 0 échec`);
process.exit(0);
