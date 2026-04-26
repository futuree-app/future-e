-- Migration : communes_tension
-- Table pré-calculée pour les pages SEO programmatiques /savoir/[slug]/[insee_code]
-- Alimentée par le script scripts/populate-communes-tension.js
-- Taille : ~300 lignes max (6 slugs × 50 communes)

begin;

create table if not exists public.communes_tension (
  id          uuid primary key default gen_random_uuid(),
  insee_code  text not null,
  nom_commune text not null,
  code_postal text,                   -- optionnel, dérivé d'un référentiel INSEE
  departement text,                   -- ex: "Bouches-du-Rhône"
  slug        text not null,          -- id du risque, ex: 'canicule', 'submersion'
  score       integer not null default 0 check (score between 0 and 100),
  ind_exposition    numeric,          -- intensité physique du risque (0–100)
  ind_vulnerabilite numeric,          -- vulnérabilité socio-économique (0–100)
  ind_adaptation    numeric,          -- capacité d'adaptation locale (0–100)
  ind_occurrence    numeric,          -- fréquence historique (0–100)
  updated_at  timestamptz not null default now(),
  unique(slug, insee_code)
);

-- Index pour les requêtes de classement par slug
create index if not exists communes_tension_slug_score_idx
  on public.communes_tension (slug, score desc);

-- RLS : lecture publique (anon + authenticated)
alter table public.communes_tension enable row level security;

create policy "public read communes_tension"
  on public.communes_tension
  for select
  to anon, authenticated
  using (true);

commit;
