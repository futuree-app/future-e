-- LE BIEN ACTIF, à côté du territoire actif.
--
-- POURQUOI. `/rapport` servait le dossier le plus récemment CRÉÉ de la commune lue, et la route
-- d'ouverture ne persistait que `active_insee_code`. Un compte qui possède plusieurs biens dans une
-- même commune ouvrait donc le 1 rue Saint-Dominique et retrouvait, au retour sur le hub, le 29 rue
-- de l'Evescot : le produit avait un territoire actif et une collection d'adresses, pas de bien
-- actif. Rien à l'écran ne disait lequel des sept était lu.
--
-- CE QUE CETTE COLONNE N'EST PAS. Ni un droit, ni une autorisation : l'accès reste gouverné par
-- `canAccessTerritory` (grant ou dossier), et cette valeur ne fait que dire QUEL bien le lecteur
-- lisait en dernier. Un identifiant qui ne désigne plus rien retombe sur le plus récent
-- (`choisirDossierActif`), sans erreur.
--
-- `on delete set null` : supprimer un dossier ne doit pas casser le profil de son propriétaire.
alter table public.user_profiles
  add column if not exists active_dossier_id uuid
  references public.address_dossiers(id) on delete set null;

comment on column public.user_profiles.active_dossier_id is
  'Dernier dossier d''adresse ouvert par le lecteur. Préférence de lecture, jamais un droit : voir choisirDossierActif et canAccessTerritory.';
