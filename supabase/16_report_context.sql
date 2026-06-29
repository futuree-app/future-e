begin;

-- ════════════════════════════════════════════════════════════════════════════
-- report_context : contexte de lecture d'un rapport pour (utilisateur, commune).
--
-- Distinct de report_grants (qui gère l'ACCÈS). Ici on range la RELATION du
-- lecteur à la commune (il y vit / il l'explore), inférée puis éventuellement
-- corrigée, le contexte de parcours, et les réponses de workbook SPÉCIFIQUES à
-- cette commune (variante découverte). Chaque ligne est rattachée à un INSEE
-- précis : c'est ce qui empêche une observation/saisie de contaminer une autre
-- commune.
--
-- Contrairement à report_grants (écrit par le webhook en service role), ce
-- contexte est de la donnée déclarative de l'utilisateur : il le lit ET l'écrit
-- lui-même depuis l'app. D'où les policies insert/update own.
--
-- NB : la variante RÉSIDENCE du workbook reste pour l'instant dans
-- user_profiles.workbook_quartier (pas de migration de l'existant) ; seule la
-- variante découverte vit ici. Unification possible plus tard.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.report_context (
  user_id uuid not null references auth.users (id) on delete cascade,
  insee text not null,
  relation text not null default 'unknown'
    check (relation in ('current_residence', 'considering_living', 'information_only', 'unknown')),
  relation_source text not null default 'inferred'
    check (relation_source in ('inferred', 'confirmed_by_user')),
  journey text
    check (journey in ('standalone_report', 'comparison', 'pack_decision')),
  discovery_workbook jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, insee)
);

create index if not exists report_context_user_id_idx
  on public.report_context (user_id);

alter table public.report_context enable row level security;

drop policy if exists report_context_select_own on public.report_context;
create policy report_context_select_own
  on public.report_context
  for select
  using (auth.uid() = user_id);

drop policy if exists report_context_insert_own on public.report_context;
create policy report_context_insert_own
  on public.report_context
  for insert
  with check (auth.uid() = user_id);

drop policy if exists report_context_update_own on public.report_context;
create policy report_context_update_own
  on public.report_context
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

commit;
