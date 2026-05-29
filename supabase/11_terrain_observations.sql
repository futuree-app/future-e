-- ─── Migration : Repères de terrain (observations territoriales) ───────────
-- Base propre pour les observations terrain, préparant une future
-- "intelligence territoriale collective".
--
-- Aujourd'hui :
--   - double écriture : user_profiles.workbook_quartier (compat) + cette table.
--   - 1 ligne COURANTE par (user_id, insee_code, module) grâce à l'index
--     unique ci-dessous → upsert via ON CONFLICT.
--   - les observations ne sont PAS encore injectées dans les prompts IA.
--
-- Évolutions prévues (non activées ici) :
--   - historisation multi-lignes : lever l'index unique pour conserver des
--     versions datées par created_at.
--   - API d'agrégation anonymisée par commune, avec seuil minimum
--     (ex. 30 observations) avant toute restitution.
-- ─────────────────────────────────────────────────────────────────────────

begin;

create table if not exists public.terrain_observations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  report_id   text,
  insee_code  text not null,
  commune     text not null,
  module      text not null default 'quartier',
  answers     jsonb not null,
  free_text   text,
  source      text not null default 'quartier_workbook',
  version     text not null default 'v1',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Clé logique temporaire : 1 observation courante par user / commune / module.
-- Sert de cible ON CONFLICT pour la double écriture (upsert).
create unique index if not exists terrain_observations_user_commune_module_key
  on public.terrain_observations (user_id, insee_code, module);

-- Agrégation future par territoire (combien d'observations par commune).
create index if not exists terrain_observations_insee_idx
  on public.terrain_observations (insee_code, module);

-- ─── Row Level Security ────────────────────────────────────────────────────
-- Un utilisateur connecté ne voit / écrit que ses propres observations.
-- Aucune lecture publique : l'agrégation anonymisée future passera par une
-- route serveur dédiée (service role), jamais par un accès direct client.
alter table public.terrain_observations enable row level security;

drop policy if exists "users read own terrain observations" on public.terrain_observations;
create policy "users read own terrain observations"
  on public.terrain_observations
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users insert own terrain observations" on public.terrain_observations;
create policy "users insert own terrain observations"
  on public.terrain_observations
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users update own terrain observations" on public.terrain_observations;
create policy "users update own terrain observations"
  on public.terrain_observations
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

commit;
