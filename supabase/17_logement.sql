begin;

-- ════════════════════════════════════════════════════════════════════════════
-- logement : l'adresse analysée devient un ARTEFACT sauvegardé (pas un champ de
-- profil : un utilisateur peut avoir sa résidence dans une commune et un bien visé
-- dans une autre). Sur le patron de report_context : clé (user_id, insee), RLS own.
--
-- posture : residence (« j'y vis ») | prospection (« j'envisage d'acheter/louer »),
-- alimentée par la sonde ProjectProbe du module, désormais persistée. Grain différent
-- de report_context.relation (utilisateur↔commune) : ici c'est utilisateur↔logement.
--
-- snapshot : SOURCE CANONIQUE de la photographie Face 3 gelée (résultats + sourceStatus
-- + versions + computedAt). Pas de colonnes SQL dupliquant ces champs.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.logement (
  user_id       uuid not null references auth.users (id) on delete cascade,
  insee         text not null,
  address_label text not null,
  latitude      double precision not null,
  longitude     double precision not null,
  parcel_code   text,
  posture       text not null default 'residence'
    check (posture in ('residence', 'prospection')),
  snapshot      jsonb,
  updated_at    timestamptz not null default now(),
  primary key (user_id, insee)
);

create index if not exists logement_user_id_idx on public.logement (user_id);

alter table public.logement enable row level security;

drop policy if exists logement_select_own on public.logement;
create policy logement_select_own on public.logement for select using (auth.uid() = user_id);
drop policy if exists logement_insert_own on public.logement;
create policy logement_insert_own on public.logement for insert with check (auth.uid() = user_id);
drop policy if exists logement_update_own on public.logement;
create policy logement_update_own on public.logement for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

commit;
