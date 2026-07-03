begin;

-- ════════════════════════════════════════════════════════════════════════════
-- osm_tile_cache : géométries OSM (axes motorway/trunk, rail, espaces verts)
-- mutualisées par CELLULE spatiale, réutilisables entre logements voisins. Couche
-- technique pure : constituée live à la génération d'un rapport, JAMAIS lue par
-- l'affichage (le rapport lit le snapshot figé de la table logement).
--
-- Écrit en service-role (la route /api/logement-autour utilise SUPABASE_SERVICE_ROLE_KEY,
-- qui bypasse RLS) ; lecture par tout authentifié. TTL long (routes/rail/parcs bougent peu).
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.osm_tile_cache (
  tile_key      text primary key,
  geometries    jsonb not null,
  query_version text not null,
  status        text not null check (status in ('complete', 'failed')),
  fetched_at    timestamptz not null default now()
);

alter table public.osm_tile_cache enable row level security;

drop policy if exists osm_tile_cache_select_auth on public.osm_tile_cache;
create policy osm_tile_cache_select_auth on public.osm_tile_cache for select using (auth.role() = 'authenticated');

commit;
