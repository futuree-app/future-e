-- ════════════════════════════════════════════════════════════════════════════════════════════
-- 36 · LA RELATION AU LIEU, À L'ADRESSE (FUT-26).
--
-- Le lien du lecteur avec UN bien précis, déclaré par lui :
--   lives_here : j'y habite (locataire ou propriétaire occupant) ;
--   studying   : j'étudie ce bien, je le visite, j'envisage d'y vivre ;
--   NULL       : inconnu. Jamais remplacé par une valeur par défaut.
--
-- POURQUOI DEUX NOUVELLES COLONNES PLUTÔT QUE `posture`. `posture` (migration 17) vaut 'residence'
-- par défaut, et la page Autour l'écrivait en dur à chaque ouverture : sa valeur ne dit RIEN de la
-- personne. La reprendre ferait de chaque dossier existant un « j'y habite » qu'aucun lecteur n'a
-- déclaré. Elle n'est donc ni lue ni recopiée ; elle reste en place, inerte, jusqu'au nettoyage des
-- reliquats (spec 2026-09-25, étape 6).
--
-- AUCUNE DONNÉE EXISTANTE N'EST TOUCHÉE : les colonnes naissent NULL, c'est-à-dire « inconnu », ce
-- qui est exactement l'état réel de tous les dossiers déjà ouverts.
--
-- Écriture : service role uniquement, comme toute la table depuis la migration 25 (route
-- /api/dossier/relation → `updateOwnedAddressDossier`, qui vérifie la propriété). Lecture : la policy
-- SELECT existante couvre les nouvelles colonnes.
--
-- RÉVERSIBLE : 36_relation_au_lieu_adresse_down.sql.
-- ════════════════════════════════════════════════════════════════════════════════════════════

begin;

alter table public.address_dossiers
  add column if not exists place_relation text
    check (place_relation is null or place_relation in ('lives_here', 'studying')),
  -- La date de la DÉCLARATION. NULL tant que rien n'a été déclaré : c'est l'origine de la relation.
  add column if not exists place_relation_set_at timestamptz;

comment on column public.address_dossiers.place_relation is
  'FUT-26 : relation déclarée du lecteur à ce bien (lives_here | studying). NULL = inconnue, jamais supposée.';
comment on column public.address_dossiers.posture is
  'Obsolète depuis FUT-26 : valait residence par défaut, jamais déclarée. Ne pas lire ; voir place_relation.';

commit;
