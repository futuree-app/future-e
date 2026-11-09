-- Retour arrière de 39_retours_utilite_dossier.sql (FUT-94).
-- DÉTRUIT les retours enregistrés. Les exporter d'abord si on veut les garder
-- (supabase/maintenance/fut94-retours-utilite.sql, requête 1).
begin;
drop function if exists public.purger_retours_utilite(interval, interval);
drop table if exists public.dossier_utility_feedback;
commit;
