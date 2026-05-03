-- Migration : dpe_logements
-- Source : ADEME DPE v2 (post-juillet 2021), logements existants + neufs
-- Import depuis : https://data.ademe.fr/datasets/dpe-v2-logements-existants
--                 https://data.ademe.fr/datasets/dpe-v2-logements-neufs
-- Fréquence de mise à jour : mensuelle (ADEME publie de nouveaux DPE en continu)
--
-- Colonnes ADEME → colonnes Supabase :
--   N°DPE                            → id_dpe
--   Date_établissement_DPE           → date_dpe
--   Identifiant__BAN                 → id_ban
--   Code_INSEE_(BAN)                 → code_insee
--   Adresse_(BAN)                    → adresse
--   Coordonnée_cartographique_X_(BAN)→ longitude
--   Coordonnée_cartographique_Y_(BAN)→ latitude
--   Etiquette_DPE                    → etiquette_dpe
--   Etiquette_GES                    → etiquette_ges
--   Conso_5_usages_é_finale_(énergie_primaire) → conso_ep (kWh/m²/an)
--   Emission_GES_5_usages_par_m²     → emission_ges (kg CO₂/m²/an)
--   Surface_habitable_logement       → surface_m2
--   Année_construction               → annee_construction
--   Type_bâtiment                    → type_batiment

begin;

create table if not exists public.dpe_logements (
  id                  uuid primary key default gen_random_uuid(),
  id_dpe              text not null unique,
  date_dpe            date,
  id_ban              text,                  -- identifiant BAN pour jointure adresse précise
  code_insee          text,
  adresse             text,
  latitude            float8,
  longitude           float8,
  etiquette_dpe       char(1) check (etiquette_dpe in ('A','B','C','D','E','F','G')),
  etiquette_ges       char(1) check (etiquette_ges in ('A','B','C','D','E','F','G')),
  conso_ep            float8,               -- kWh/m²/an énergie primaire
  emission_ges        float8,               -- kg CO₂/m²/an
  surface_m2          float8,
  annee_construction  integer,
  type_batiment       text,                 -- 'Maison', 'Appartement', 'Immeuble'
  created_at          timestamptz not null default now()
);

-- Recherche par commune (usage principal : résumé territorial)
create index if not exists dpe_logements_code_insee_idx
  on public.dpe_logements (code_insee, date_dpe desc);

-- Recherche par ID BAN (usage : module logement adresse précise)
create index if not exists dpe_logements_id_ban_idx
  on public.dpe_logements (id_ban)
  where id_ban is not null;

-- Recherche par étiquette (usage : stats passoires thermiques)
create index if not exists dpe_logements_etiquette_idx
  on public.dpe_logements (code_insee, etiquette_dpe);

-- Recherche géographique approximative par bounding box (pas de PostGIS requis)
create index if not exists dpe_logements_geo_idx
  on public.dpe_logements (latitude, longitude)
  where latitude is not null and longitude is not null;

-- RLS : lecture publique
alter table public.dpe_logements enable row level security;

create policy "dpe_logements_read_public"
  on public.dpe_logements for select
  using (true);

commit;
