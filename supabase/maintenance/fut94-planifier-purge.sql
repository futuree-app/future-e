-- ════════════════════════════════════════════════════════════════════════════════════════════
-- FUT-94 · PLANIFIER LA PURGE DES RETOURS D'UTILITÉ, ET VÉRIFIER QU'ELLE TOURNE.
--
-- À coller dans Supabase > SQL Editor, APRÈS la migration 39, bloc par bloc. NE PAS EXÉCUTER EN
-- PRODUCTION SANS VALIDATION EXPLICITE (durées de conservation à arbitrer : voir
-- docs/audits/2026-11-09-fut94-retour-utilite.md, « Confidentialité »).
--
-- Tant que le bloc 2 n'a pas tourné ET que le bloc 4 ne rend rien, la conservation N'EST PAS
-- automatiquement respectée : la fonction existe, personne ne l'appelle.
-- ════════════════════════════════════════════════════════════════════════════════════════════

-- 1. PRÉREQUIS : l'extension pg_cron (Database > Extensions > pg_cron, ou la ligne ci-dessous).
--    Elle crée le schéma `cron` ; les tâches tournent sous le rôle qui les planifie (postgres).
create extension if not exists pg_cron;

-- 2. PLANIFIER. Tous les jours à 03:23 UTC. `cron.schedule` avec un NOM remplace la tâche du même
--    nom : relancer ce bloc ne crée jamais de doublon.
select cron.schedule(
  'fut94-purge-retours-utilite',
  '23 3 * * *',
  $$select * from public.purger_retours_utilite()$$
);

-- 3. VÉRIFIER LA PLANIFICATION, puis les dernières exécutions (statut, message, durée). Le message
--    d'une exécution réussie est « 1 row » (la ligne de décompte rendue par la fonction).
select jobid, jobname, schedule, active, username
  from cron.job where jobname = 'fut94-purge-retours-utilite';

select d.start_time, d.end_time, d.status, d.return_message
  from cron.job_run_details d
  join cron.job j on j.jobid = d.jobid
 where j.jobname = 'fut94-purge-retours-utilite'
 order by d.start_time desc
 limit 10;

-- 4. ALERTE : cette requête ne rend RIEN quand tout va bien. Une ligne = un problème à traiter :
--    tâche absente ou inactive, échec dans les 7 derniers jours, ou aucune exécution réussie depuis
--    48 heures. À relancer chaque semaine (ou à brancher sur une supervision) ; un échec porte son
--    message d'erreur dans `detail`.
--    Dans les 48 heures qui suivent la planification, « aucune exécution réussie » est attendu.
with tache as (
  select jobid, active from cron.job where jobname = 'fut94-purge-retours-utilite'
), derniers as (
  select d.* from cron.job_run_details d join tache t on t.jobid = d.jobid
   where d.start_time > now() - interval '7 days'
)
select 'tâche absente' as probleme, null::text as detail where not exists (select 1 from tache)
union all
select 'tâche inactive', null from tache where not active
union all
select 'échec le ' || to_char(start_time, 'YYYY-MM-DD HH24:MI'), return_message from derniers where status = 'failed'
union all
select 'aucune exécution réussie depuis 48 h', null
 where exists (select 1 from tache)
   and not exists (select 1 from derniers where status = 'succeeded' and start_time > now() - interval '48 hours');

-- 5. RETIRER LA PLANIFICATION (retour arrière, ou avant le down de la migration 39) :
-- select cron.unschedule('fut94-purge-retours-utilite');
