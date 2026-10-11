-- Retour arrière de 37. Les objectifs déclarés et les contextes de checkout sont PERDUS.
begin;
alter table public.address_dossiers drop column if exists place_objective_set_at;
alter table public.address_dossiers drop column if exists place_objective;
alter table public.dossier_intents drop constraint if exists dossier_intents_project_state_snapshot;
alter table public.dossier_intents drop column if exists context_locked_at;
alter table public.dossier_intents drop column if exists project_state;
alter table public.dossier_intents drop column if exists project_snapshot;
alter table public.dossier_intents drop column if exists place_context_declared_at;
alter table public.dossier_intents drop column if exists place_objective;
alter table public.dossier_intents drop column if exists place_relation;
commit;
