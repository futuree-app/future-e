begin;

-- ════════════════════════════════════════════════════════════════════════════════════════════
-- FUT-6 (28/09/2026) : la photo des données du module Territoire, et la synthèse qui en découle.
--
-- territory_facts_snapshot : le FactsSnapshot d'un écran Territoire, sous son EMPREINTE. La page le
--   construit une fois, en rend les cartes, l'écrit ici ; la route de synthèse le relit par son
--   empreinte, sans recontacter aucune source. Même photo pour les cartes et pour le texte.
--
-- territory_synthesis : la synthèse Territoire en CACHE. Elle est GÉNÉRIQUE : sa clé est
--   SHA-256(empreinte | horizon | version du contrat), sans aucune donnée utilisateur. Une même
--   commune, un même snapshot, un même horizon : un seul texte, servi à tous, zéro appel au modèle.
--   `status = 'pending'` + `lease_until` : une génération en cours réserve sa clé (pas de double
--   facture) ; au-delà du bail, elle est présumée morte et la clé se reprend.
--
-- Couche technique pure : écrite et lue en SERVICE ROLE uniquement (RLS activée, AUCUNE policy, donc
-- aucun accès anon ou authentifié). Aucune donnée personnelle.
--
-- RÉVERSIBLE : supabase/34_territoire_facts_down.sql. Sans ces tables, la page reste fonctionnelle et
-- affiche la synthèse déterministe.
-- ════════════════════════════════════════════════════════════════════════════════════════════

create table if not exists public.territory_facts_snapshot (
  hash              text primary key,          -- SHA-256 hex du contenu (hors dates de lecture)
  insee_code        text not null,
  registry_version  text not null,
  snapshot          jsonb not null,
  created_at        timestamptz not null default now()
);

create index if not exists territory_facts_snapshot_insee_idx
  on public.territory_facts_snapshot (insee_code, created_at desc);

create table if not exists public.territory_synthesis (
  cache_key         text primary key,          -- SHA-256(snapshot_hash | horizon | contract_version)
  snapshot_hash     text not null references public.territory_facts_snapshot(hash) on delete cascade,
  insee_code        text not null,
  horizon           text not null check (horizon in ('gwl15', 'gwl20', 'gwl30')),
  contract_version  text not null,
  status            text not null check (status in ('pending', 'ready')),
  lease_until       timestamptz,               -- génération en cours : jusqu'à quand elle tient la clé
  text              text,                      -- présent quand status = 'ready'
  origin            text check (origin in ('model', 'model_retry', 'deterministic')),
  rejections        jsonb not null default '[]'::jsonb,  -- motifs de refus des contrôles (journal D8)
  model_calls       integer not null default 0,
  generation_ms     integer,
  created_at        timestamptz not null default now(),
  check (status <> 'ready' or text is not null)
);

create index if not exists territory_synthesis_insee_idx
  on public.territory_synthesis (insee_code, created_at desc);

alter table public.territory_facts_snapshot enable row level security;
alter table public.territory_synthesis enable row level security;
-- Aucune policy : seul le service role (qui contourne la RLS) lit et écrit.

commit;
