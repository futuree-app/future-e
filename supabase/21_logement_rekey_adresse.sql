begin;

-- ════════════════════════════════════════════════════════════════════════════
-- Re-key de public.logement : l'artefact est identifié par l'ADRESSE, pas la commune.
--
-- Motif (board 2026-07-07) : un même utilisateur compare plusieurs biens DANS la même
-- commune (le moment payant du module). L'ancienne clé (user_id, insee) écrasait le bien
-- A par le bien B, et fabriquait des lignes chimères (DPE figé de A + snapshot Face 3 de B,
-- selon la course des écritures « autour » / « dpe » / « synthèse »). Le grain déclaré du
-- module (l'adresse) et le grain du schéma (la commune) ne disaient pas la même chose.
--
-- Nouvelle clé (user_id, logement_id) où logement_id = identifiant BAN de l'adresse
-- sélectionnée (échoué au client dans address.id). insee redevient une simple colonne
-- indexée : lecture par commune (analytics « adresses distinctes / commune », futur
-- comparateur de biens). Table jeune (données de test) : re-key NON destructif, l'ancien
-- insee sert d'identifiant de repli pour les lignes existantes.
--
-- À appliquer après 17/19/20 ; indépendant des colonnes synthèse (20).
-- ════════════════════════════════════════════════════════════════════════════

alter table public.logement
  add column if not exists logement_id text;

-- Lignes existantes (test) : identifiant de repli = ancien insee, pour ne rien perdre.
update public.logement set logement_id = insee where logement_id is null;

alter table public.logement
  alter column logement_id set not null;

-- Bascule de la clé primaire : (user_id, insee) -> (user_id, logement_id).
alter table public.logement drop constraint if exists logement_pkey;
alter table public.logement add constraint logement_pkey primary key (user_id, logement_id);

-- insee garde son intérêt de lecture (adresses d'une même commune, futur comparateur de biens).
create index if not exists logement_user_insee_idx on public.logement (user_id, insee);

commit;
