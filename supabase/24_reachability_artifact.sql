begin;

-- ════════════════════════════════════════════════════════════════════════════
-- reachability_artifact : les artefacts de MOBILITÉ, mutualisés par demande.
--
-- Une isochrone (un polygone : « les 30 minutes en voiture depuis la gare Matabiau ») ou un itinéraire
-- (une durée : « le point de référence de Blagnac est à 23,7 minutes »), sous le hash de sa demande.
-- Deux lecteurs qui visent la même gare au même seuil lisent le MÊME objet, et l'API IGN, qui rate-limite
-- (12 appels concurrents rendent 12 erreurs 429), n'est pas rappelée.
--
-- CE QUE CETTE TABLE NE FAIT PAS : elle ne déduplique pas deux premiers calculs strictement CONCURRENTS sur
-- deux instances (il n'y a pas de verrou distribué ici). Elle partage les RÉSULTATS, pas le premier calcul.
--
-- Couche technique pure : JAMAIS lue par l'affichage. Écrite en service-role, parce que le comparateur est
-- ANONYME : il n'a aucun utilisateur pour porter une RLS.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.reachability_artifact (
  kind                text not null check (kind in ('isochrone', 'route')),
  request_hash        text not null,
  geometry            jsonb,             -- kind = 'isochrone'
  minutes             double precision,  -- kind = 'route'
  engine              text not null,     -- 'ign-valhalla'
  engine_version      text,              -- le resourceVersion rendu par l'API (traçabilité)
  resource            text not null,     -- 'bdtopo-valhalla'
  integration_version text not null,     -- NOTRE version (paramètres, parsing)
  created_at          timestamptz not null default now(),
  -- Le graphe routier évolue : un artefact n'est pas éternel. Un artefact périmé est ignoré à la lecture,
  -- et recalculé.
  expires_at          timestamptz not null,

  primary key (kind, request_hash),

  -- La charge utile est EXCLUSIVE : une ligne d'isochrone n'a pas de durée, et réciproquement. Sans cette
  -- contrainte, une ligne pourrait porter les deux, et personne ne saurait laquelle fait foi.
  constraint reachability_artifact_payload check (
    (kind = 'isochrone' and geometry is not null and minutes is null)
    or (kind = 'route' and minutes is not null and geometry is null)
  ),
  -- Une durée nulle ou négative n'est pas une durée.
  constraint reachability_artifact_minutes check (minutes is null or minutes > 0)
);

create index if not exists reachability_artifact_expires_idx
  on public.reachability_artifact (expires_at);

alter table public.reachability_artifact enable row level security;
-- Aucune policy : seul le service-role (serveur) y touche, et il contourne la RLS.

commit;
