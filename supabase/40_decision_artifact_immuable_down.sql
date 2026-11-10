-- Retour arrière de 40_decision_artifact_immuable.sql (FUT-173) : rétablit EXACTEMENT les droits de
-- la migration 28 (policies own insert/update/delete, privilèges par défaut de Supabase), et retire le
-- trigger. Aucune donnée n'est touchée. Le code FUT-173 (écritures en service role) fonctionne avec ou
-- sans cette migration ; le code ANTÉRIEUR (écritures avec le jeton du lecteur) exige ce retour arrière
-- AVANT d'être redéployé. Les privilèges rétablis sont ceux que Supabase pose par défaut : comparer
-- d'abord avec la requête 3 de supabase/maintenance/fut173-audit-lecture-seule.sql.
begin;

drop trigger if exists decision_artifact_integrite on public.decision_artifact;
drop function if exists public.decision_artifact_integrite();

grant select, insert, update, delete, truncate, references, trigger on table public.decision_artifact to anon, authenticated, service_role;

drop policy if exists "decision_artifact_own_insert" on public.decision_artifact;
drop policy if exists "decision_artifact_own_update" on public.decision_artifact;
drop policy if exists "decision_artifact_own_delete" on public.decision_artifact;
create policy "decision_artifact_own_insert" on public.decision_artifact
  for insert with check (auth.uid() = user_id);
create policy "decision_artifact_own_update" on public.decision_artifact
  for update using (auth.uid() = user_id);
create policy "decision_artifact_own_delete" on public.decision_artifact
  for delete using (auth.uid() = user_id);

commit;
