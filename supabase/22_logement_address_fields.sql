begin;

-- ════════════════════════════════════════════════════════════════════════════
-- Champs d'adresse pour la REHYDRATATION (spec 2026-07-07-logement-rehydratation, décision A).
--
-- Motif : rouvrir la page sur un logement sauvegardé re-fetch l'exposition Géorisques
-- (le risque doit rester frais, pas gelé) via la route `georisques-logement`. Cette route
-- valide l'adresse (`validateSelectedBanAddress`) et EXIGE `city` + `postcode` non vides.
-- La ligne `logement` portait `address_label`, `insee`, lat/lon, parcelle — mais pas
-- `city`/`postcode` séparés. On les stocke pour pouvoir reconstruire l'adresse à re-fetcher
-- (le client les a dans `payload.address`, threadés via `logement-autour`).
--
-- Additif, non destructif. Colonnes nullables (les lignes de test antérieures restent valides ;
-- une rehydratation sans city/postcode retombe proprement sur la saisie côté client).
-- À appliquer après 21.
-- ════════════════════════════════════════════════════════════════════════════

alter table public.logement
  add column if not exists city     text,
  add column if not exists postcode text;

commit;
