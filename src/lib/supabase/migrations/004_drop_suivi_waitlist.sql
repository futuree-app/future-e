-- Migration : drop suivi_waitlist
-- L'offre d'abonnement (« Le Fil ») est retirée du produit le 28/07/2026 :
-- descendre à l'échelle de l'adresse rendait le dossier plus précieux, pas le
-- flux de données plus dense. Voir le commit f0b6c3c.
--
-- La table était VIDE au moment du drop (0 ligne, inscriptions de test
-- uniquement), plus aucun code ne l'écrivait — la route /api/suivi-waitlist et
-- le composant FilWaitlistForm ont été supprimés — et aucune contrainte
-- externe ne la référençait.
--
-- Appliquée en production le 28/07/2026.

begin;

drop table if exists public.suivi_waitlist;

commit;
