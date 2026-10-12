-- Retour arrière de 38 : retire les fonctions. Les purges déjà exécutées ne se défont pas.
begin;
drop function if exists public.dossiers_sans_intention();
drop function if exists public.intentions_a_reconcilier(timestamptz, interval);
drop function if exists public.purger_dossier_intents(timestamptz, interval, interval);
drop function if exists public.etat_livraison_intention(text);
commit;
