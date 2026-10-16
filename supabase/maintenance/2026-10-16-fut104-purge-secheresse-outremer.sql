-- ════════════════════════════════════════════════════════════════════════════════════════════
-- MAINTENANCE · TROIS SCORES « SÉCHERESSE » ULTRAMARINS CALCULÉS SUR DES DONNÉES DE LA CORSE (FUT-104).
--
-- `communes_tension` (thème `secheresse`) porte trois lignes de La Réunion : Les Avirons (97401), Bras-Panon
-- (97402), Entre-Deux (97403), score 74, toutes identiques. Elles viennent de `scripts/populate-communes-tension.js`
-- appliqué à l'ancien fichier DRIAS, où les 24 communes de La Réunion recevaient la ligne d'un point de grille du
-- sud de la Corse (jointure au plus proche sans distance maximale). DRIAS-TRACC ne couvre pas l'outre-mer : ces
-- scores n'ont aucun fondement.
--
-- Vérifié en lecture seule le 16/10/2026 :
--   - exactement 3 lignes ultramarines d'un thème calculé sur DRIAS (canicule, submersion, feux, secheresse) ;
--   - aucune clé étrangère, aucun déclencheur, aucune vue ne dépend de `communes_tension` ;
--   - les 47 lignes ultramarines `dependance-auto` (source INSEE) ne sont PAS touchées.
--
-- TRANSACTIONNEL ET VÉRIFIÉ : la suppression échoue (et rien n'est supprimé) si elle ne vise pas exactement ces
-- trois lignes, identifiées par leur id ET leur contenu. Retour arrière exact : 2026-10-16-fut104-purge-secheresse-outremer_retour.sql.
-- PAS UNE MIGRATION : une purge de données ponctuelle, hors de la suite numérotée que rejoue la base de test (elle y
-- échouerait, faute des trois lignes) ; à exécuter une fois, à la main, dans le SQL Editor.
-- NE PAS EXÉCUTER SANS ACCORD EXPLICITE.
-- ════════════════════════════════════════════════════════════════════════════════════════════

begin;

do $$
declare
  n_cibles int;
  n_supprimees int;
begin
  select count(*) into n_cibles
  from public.communes_tension
  where slug = 'secheresse'
    and insee_code ~ '^9[78]'
    and (id, insee_code, score) in (
      ('cc9f6cb7-188b-45c2-af23-8567db57ae67'::uuid, '97401', 74),
      ('80714fca-4dab-4a87-9fcb-f59d0963508c'::uuid, '97402', 74),
      ('f4027543-01eb-4ae7-8119-a404e6e420d0'::uuid, '97403', 74));
  if n_cibles <> 3 then
    raise exception 'attendu 3 lignes cibles, trouvé % : base différente de l''état vérifié le 16/10/2026', n_cibles;
  end if;
  if (select count(*) from public.communes_tension
      where insee_code ~ '^9[78]' and slug in ('canicule', 'submersion', 'feux', 'secheresse')) <> 3 then
    raise exception 'd''autres lignes ultramarines d''un thème DRIAS existent : revoir avant de supprimer';
  end if;

  delete from public.communes_tension
  where slug = 'secheresse'
    and id in ('cc9f6cb7-188b-45c2-af23-8567db57ae67', '80714fca-4dab-4a87-9fcb-f59d0963508c', 'f4027543-01eb-4ae7-8119-a404e6e420d0');
  get diagnostics n_supprimees = row_count;
  if n_supprimees <> 3 then
    raise exception 'supprimé % lignes au lieu de 3 : annulation', n_supprimees;
  end if;

  if (select count(*) from public.communes_tension where insee_code ~ '^9[78]' and slug = 'dependance-auto') <> 47 then
    raise exception 'les 47 lignes dependance-auto ultramarines ne sont plus intactes : annulation';
  end if;
  raise notice 'communes_tension : 3 lignes secheresse ultramarines supprimées, 47 dependance-auto conservées';
end $$;

commit;
