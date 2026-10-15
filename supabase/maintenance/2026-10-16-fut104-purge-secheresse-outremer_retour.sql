-- Retour arrière de 2026-10-16-fut104-purge-secheresse-outremer.sql : réinsère à l'identique (id compris) les trois lignes supprimées, relevées le 16/10/2026.
-- Elles restent fausses (points de grille de la Corse) : ce retour n'a de sens que pour annuler une erreur
-- d'exécution, jamais pour les servir de nouveau.
begin;
insert into public.communes_tension
  (id, insee_code, nom_commune, code_postal, departement, slug, score, ind_exposition, ind_vulnerabilite, ind_adaptation, ind_occurrence, updated_at, altitude_m)
values
  ('cc9f6cb7-188b-45c2-af23-8567db57ae67', '97401', 'Les Avirons', null, '974', 'secheresse', 74, 100, 100, 71, 23, '2026-04-26 01:41:10.88239+00', null),
  ('80714fca-4dab-4a87-9fcb-f59d0963508c', '97402', 'Bras-Panon', null, '974', 'secheresse', 74, 100, 100, 71, 23, '2026-04-26 01:41:10.88239+00', null),
  ('f4027543-01eb-4ae7-8119-a404e6e420d0', '97403', 'Entre-Deux', null, '974', 'secheresse', 74, 100, 100, 71, 23, '2026-04-26 01:41:10.88239+00', null)
on conflict (id) do nothing;
commit;
