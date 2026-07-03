begin;

-- Persistance du DPE choisi par l'utilisateur pour l'adresse analysée. Le choix STRUCTURE un
-- rapport payant (classe, surface, coûts, échéances, passeport) : il doit vivre dans l'artefact,
-- pas seulement dans l'état navigateur. selected_dpe_snapshot fige la donnée à la date de
-- génération (la base DPE peut évoluer), pour que le rapport explique quelle donnée il a utilisée.
alter table public.logement
  add column if not exists dpe_selection_status text not null default 'pending'
    check (dpe_selection_status in
      ('auto_confirmed', 'user_confirmed', 'not_in_list', 'not_found', 'pending')),
  add column if not exists selected_dpe_id text,
  add column if not exists selected_dpe_snapshot jsonb,
  add column if not exists selected_dpe_at timestamptz;

commit;
