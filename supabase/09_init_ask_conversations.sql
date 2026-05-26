-- ─── Migration : AskFuture ────────────────────────────────────────────────
-- Composant conversationnel territorial.
-- 1. Table ask_conversations : historique des Q&R.
-- 2. Extension de user_profiles : colonnes manquantes pour l'enrichissement
--    progressif du profil via la conversation (housing_type, health_flags,
--    life_projects restent utilisés tels quels).
-- ─────────────────────────────────────────────────────────────────────────

begin;

create table if not exists public.ask_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  commune_insee text,
  created_at timestamptz not null default now()
);

create index if not exists ask_conversations_user_idx
  on public.ask_conversations (user_id, created_at desc);

create index if not exists ask_conversations_session_idx
  on public.ask_conversations (session_id, created_at asc);

alter table public.ask_conversations enable row level security;

drop policy if exists "users read own ask conversations" on public.ask_conversations;
create policy "users read own ask conversations"
  on public.ask_conversations
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users insert own ask conversations" on public.ask_conversations;
create policy "users insert own ask conversations"
  on public.ask_conversations
  for insert
  to authenticated
  with check (auth.uid() = user_id);


-- ─── Extension user_profiles ──────────────────────────────────────────────
-- Les colonnes housing_type, health_flags (sensibilités environnementales),
-- life_projects (projets) sont conservées et alimentées par AskFuture.
-- On ajoute uniquement les colonnes vraiment manquantes.

alter table public.user_profiles
  add column if not exists logement_chauffage text
    check (
      logement_chauffage is null
      or logement_chauffage in ('gaz', 'electrique', 'pompe_chaleur', 'fioul', 'bois', 'autre')
    );

alter table public.user_profiles
  add column if not exists logement_isolation text
    check (
      logement_isolation is null
      or logement_isolation in ('bonne', 'moyenne', 'mauvaise', 'inconnue')
    );

alter table public.user_profiles
  add column if not exists presence_enfants boolean;

alter table public.user_profiles
  add column if not exists age_enfants text;

alter table public.user_profiles
  add column if not exists travail_exterieur boolean;

alter table public.user_profiles
  add column if not exists vehicule_type text
    check (
      vehicule_type is null
      or vehicule_type in ('thermique', 'hybride', 'electrique', 'aucun')
    );

commit;
