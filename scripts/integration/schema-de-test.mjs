// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-10 · UN SCHÉMA DE TEST COMPATIBLE AVEC L'APPLICATION, depuis les fichiers SQL numérotés.
//
// Le dépôt range ses migrations directement dans `supabase/` (pas dans `supabase/migrations/`) : un
// `supabase db reset` ne les applique PAS. Ce script les assemble, dans l'ordre (01 → 38, sans les
// `_down`), en un seul fichier SQL à rejouer sur une base VIERGE de test :
//   node scripts/integration/schema-de-test.mjs > /tmp/schema-de-test.sql
//   psql "$URL_POSTGRES_LOCALE" -v ON_ERROR_STOP=1 -f /tmp/schema-de-test.sql
//
// DEUX ADAPTATIONS, RÉSERVÉES AUX TESTS ET DITES ICI :
//   1. `25_address_dossiers.sql` refuse de tourner s'il ne trouve pas les 24 lignes que la production
//      comptait le 29/07/2026 : ce contrôle protégeait la production, il n'a pas de sens sur une base
//      vierge. Il est neutralisé dans la sortie de ce script, et seulement là ;
//   2. `02_init_qna.sql` insère des réponses de démonstration dont une référence une tension absente du
//      catalogue : sa transaction est rejetée sur une base vierge. Elle n'est utile à aucun test de
//      FUT-10 ; elle est omise.
// Aucun fichier de `supabase/` n'est modifié. Ne JAMAIS appliquer cette sortie à la production.
//
// Sur une instance Supabase locale (`supabase start`), le schéma `auth`, `auth.uid()` et les rôles
// existent déjà : le préambule ci-dessous ne les crée que s'ils manquent (cas de PGlite ou d'un
// Postgres nu).
// ════════════════════════════════════════════════════════════════════════════════════════════
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const RACINE = new URL("../../supabase/", import.meta.url);

export const PREAMBULE = `
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
do $$ begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'auth' and p.proname = 'uid') then
    execute 'create function auth.uid() returns uuid language sql stable as $f$ select null::uuid $f$';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'auth' and p.proname = 'role') then
    execute 'create function auth.role() returns text language sql stable as $f$ select null::text $f$';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'auth' and p.proname = 'jwt') then
    execute 'create function auth.jwt() returns jsonb language sql stable as $f$ select ''{}''::jsonb $f$';
  end if;
end $$;
`;

export const OMIS = new Set(["02_init_qna.sql"]);

/** Les migrations, dans l'ordre, avec les adaptations de test appliquées. */
export function migrationsDeTest() {
  const fichiers = readdirSync(RACINE).filter((f) => /^\d\d_.*\.sql$/.test(f) && !f.includes("_down")).sort();
  return fichiers.filter((f) => !OMIS.has(f)).map((f) => {
    let sql = readFileSync(new URL(f, RACINE), "utf8");
    if (f === "25_address_dossiers.sql") {
      const avant = sql;
      sql = sql.replace(/if n <> 24 then/, "if false then -- contrôle de production neutralisé (schéma de test)");
      if (sql === avant) throw new Error("25_address_dossiers.sql : le contrôle des 24 lignes a changé, adapter ce script");
    }
    return { fichier: f, sql };
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.stdout.write(`-- Schéma de TEST généré par scripts/integration/schema-de-test.mjs. Jamais en production.\n${PREAMBULE}\n`);
  for (const { fichier, sql } of migrationsDeTest()) process.stdout.write(`\n-- ═══ ${fichier}\n${sql}\n`);
}
