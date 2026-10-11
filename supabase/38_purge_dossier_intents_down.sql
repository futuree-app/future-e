-- Retour arrière de 38 : retire la fonction. Les purges déjà exécutées ne se défont pas.
begin;
drop function if exists public.purger_dossier_intents(timestamptz, interval);
commit;
