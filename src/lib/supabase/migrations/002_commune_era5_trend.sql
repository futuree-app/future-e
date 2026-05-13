-- Migration : commune_era5_trend
-- Tendance climatique locale (réanalyse ERA5-Land Copernicus)
-- Alimentée par scripts/populate-era5-trend.py
-- Une ligne par commune INSEE, ~35 000 lignes max (métropole + Corse + DOM)

begin;

create table if not exists public.commune_era5_trend (
  insee_code         text primary key,
  baseline_mean_c    numeric(4,2),  -- moyenne annuelle 1961-1990 (norme OMM)
  recent_mean_c      numeric(4,2),  -- moyenne annuelle des 10 dernières années complètes
  delta_c            numeric(3,2),  -- recent_mean - baseline_mean (signal narratif principal)
  trend_per_decade_c numeric(3,2),  -- pente OLS °C/décennie sur la série complète (usage interne)
  data_through_year  integer,       -- dernière année incluse dans la moyenne récente
  updated_at         timestamptz not null default now()
);

-- Index pour classements/requêtes par delta (top communes les plus réchauffées)
create index if not exists commune_era5_trend_delta_idx
  on public.commune_era5_trend (delta_c desc);

-- RLS : lecture publique (anon + authenticated)
alter table public.commune_era5_trend enable row level security;

create policy "public read commune_era5_trend"
  on public.commune_era5_trend
  for select
  to anon, authenticated
  using (true);

commit;
