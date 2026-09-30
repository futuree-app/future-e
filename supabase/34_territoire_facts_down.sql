-- Retour arrière de 34_territoire_facts.sql (FUT-6). Supprime les deux tables techniques et leur
-- contenu : snapshots et synthèses en cache. Aucune donnée utilisateur n'y vit ; la page Territoire
-- retombe alors sur la synthèse déterministe, sans casser.
begin;
drop table if exists public.territory_synthesis;
drop table if exists public.territory_facts_snapshot;
commit;
