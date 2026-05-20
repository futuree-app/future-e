-- Migration : suivi_waitlist
-- Liste d'attente pour la page "Suivi à venir" — utilisateurs intéressés
-- par l'abonnement Suivi avant son ouverture publique.

begin;

create table if not exists public.suivi_waitlist (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  commune      text,                    -- code postal ou nom de commune (facultatif)
  motivation   text,                    -- raison principale d'intérêt (facultatif)
  source       text,                    -- d'où vient l'inscription (ex: 'suivi-bientot')
  created_at   timestamptz not null default now(),
  unique(email)
);

create index if not exists suivi_waitlist_created_idx
  on public.suivi_waitlist (created_at desc);

alter table public.suivi_waitlist enable row level security;

-- Insert public : permet à l'API anonyme d'ajouter une entrée.
-- Pas de SELECT public — lecture réservée au service_role / admin.
drop policy if exists "anon insert suivi_waitlist" on public.suivi_waitlist;
create policy "anon insert suivi_waitlist"
  on public.suivi_waitlist
  for insert
  to anon, authenticated
  with check (true);

commit;
