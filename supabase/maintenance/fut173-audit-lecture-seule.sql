-- ════════════════════════════════════════════════════════════════════════════════════════════
-- FUT-173 · ÉTAT RÉEL DES DROITS SUR `decision_artifact`. LECTURE SEULE, MÉTADONNÉES SEULEMENT.
--
-- À coller dans Supabase > SQL Editor AVANT la migration 40, puis APRÈS. Aucune requête ne lit un
-- `payload` ni un identifiant de compte : seulement le catalogue, et des décomptes par statut.
-- La transaction est en lecture seule : une écriture glissée ici échouerait.
-- ════════════════════════════════════════════════════════════════════════════════════════════
begin transaction read only;

-- 1. La table, son propriétaire, RLS active et forcée ?
select c.relname, pg_get_userbyid(c.relowner) as owner, c.relrowsecurity as rls, c.relforcerowsecurity as rls_forcee
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relname = 'decision_artifact';

-- 2. Les policies EN PLACE (à comparer à la migration 28 : own_select/insert/update/delete).
select policyname, cmd, roles, permissive, qual, with_check
  from pg_policies where schemaname = 'public' and tablename = 'decision_artifact'
 order by policyname;

-- 3. Les privilèges de table par rôle (attendu avant : tout pour anon/authenticated/service_role).
select grantee, string_agg(privilege_type, ', ' order by privilege_type) as privileges
  from information_schema.role_table_grants
 where table_schema = 'public' and table_name = 'decision_artifact'
 group by grantee order by grantee;

-- 4. Les rôles qui contournent RLS (service_role doit y être, authenticated et anon jamais).
select rolname, rolbypassrls, rolsuper from pg_roles
 where rolname in ('anon', 'authenticated', 'service_role', 'postgres', 'authenticator') order by rolname;

-- 5. Les triggers sur la table (attendu avant : aucun ; après : decision_artifact_integrite, activé 'O').
select tgname, tgenabled, pg_get_triggerdef(t.oid) as definition
  from pg_trigger t where t.tgrelid = 'public.decision_artifact'::regclass and not t.tgisinternal;

-- 6. Contraintes et clés étrangères (unicité de version, cascade sur auth.users).
select conname, contype, pg_get_constraintdef(oid) as definition
  from pg_constraint where conrelid = 'public.decision_artifact'::regclass order by conname;

-- 7. Colonnes réelles (une migration hors dépôt aurait pu en ajouter).
select column_name, data_type, is_nullable, column_default
  from information_schema.columns
 where table_schema = 'public' and table_name = 'decision_artifact' order by ordinal_position;

-- 8. Décompte par statut, et lignes qui contrediraient le contrat du trigger (attendu : 0 partout).
--    Le trigger ne juge pas les lignes existantes ; ce décompte dit seulement s'il y en a d'atypiques.
select status, count(*) as lignes,
       count(*) filter (where status = 'ready' and (payload is null or generated_at is null)) as ready_sans_contenu,
       count(*) filter (where status <> 'ready' and payload is not null) as non_ready_avec_contenu,
       count(*) filter (where status = 'generating' and created_at < now() - interval '15 minutes') as generating_abandonnees
  from public.decision_artifact group by status order by status;

-- 9. Fonctions qui citent la table (purge 38, etc.) : leur droit d'exécution.
select p.proname, p.prosecdef as security_definer, pg_get_userbyid(p.proowner) as owner
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.prosrc ilike '%decision_artifact%'
 order by 1;

rollback;
