begin;

-- Retour arrière de 35_logement_report_versions.sql. Sans cette table, le module Logement retombe sur
-- la construction live à chaque ouverture (comportement d'avant FUT-13 lot B), sans erreur.
drop table if exists public.logement_report_versions;

commit;
