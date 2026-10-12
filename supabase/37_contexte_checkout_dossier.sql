-- 37 · FUT-10 : le contexte déclaré avant l'achat d'un dossier d'adresse.
-- Additive, colonnes nullables, aucune ligne existante touchée. À APPLIQUER AVANT le déploiement du code
-- (create-payment-intent écrit ces colonnes ; sans elles, l'intention échoue et aucun paiement ne s'ouvre).
-- Réversible : 37_contexte_checkout_dossier_down.sql.
begin;

alter table public.dossier_intents
  add column if not exists place_relation text
    check (place_relation is null or place_relation in ('lives_here', 'studying')),
  add column if not exists place_objective text
    check (place_objective is null or place_objective in ('buy', 'rent', 'understand', 'other')),
  -- Horloge du SERVEUR au moment où les réponses sont enregistrées : la date de déclaration recopiée au dossier.
  add column if not exists place_context_declared_at timestamptz,
  -- Le projet RELU EN BASE au checkout, figé pour reproduire la lecture vendue. Jamais édité, jamais lu par un écran.
  add column if not exists project_snapshot jsonb,
  -- CE QUE LE LECTEUR A CONFIRMÉ DU PROJET au paiement, sans ambiguïté :
  --   'confirmed' : un projet lui a été montré, il est figé dans project_snapshot ;
  --   'absent'    : aucun projet n'existait, il a continué sans ; le dossier vendu reste sans projet,
  --                 même si le compte en reçoit un avant que le webhook ne passe ;
  --   NULL        : intention antérieure à FUT-10 (ou client sans contexte) : relecture historique.
  add column if not exists project_state text
    check (project_state is null or project_state in ('confirmed', 'absent')),
  -- LE VERROU DU CONTEXTE. Posé juste avant la confirmation Stripe (route /api/dossier/intention/verrouiller)
  -- et, au plus tard, par le webhook. Une fois posé, plus aucune écriture ne modifie relation, objectif ou
  -- projet de cette intention : les mises à jour sont conditionnées par « context_locked_at is null ».
  add column if not exists context_locked_at timestamptz;

-- La forme du projet suit son état : un projet confirmé est figé, une absence n'en porte aucun.
alter table public.dossier_intents
  drop constraint if exists dossier_intents_project_state_snapshot;
alter table public.dossier_intents
  add constraint dossier_intents_project_state_snapshot check (
    (project_state is distinct from 'confirmed' or project_snapshot is not null)
    and (project_state is distinct from 'absent' or project_snapshot is null)
  );

alter table public.address_dossiers
  add column if not exists place_objective text
    check (place_objective is null or place_objective in ('buy', 'rent', 'understand', 'other')),
  add column if not exists place_objective_set_at timestamptz;

comment on column public.address_dossiers.place_objective is
  'FUT-10 : objectif déclaré de l''analyse de ce bien (buy | rent | understand | other). NULL = non dit.';

-- RÉTENTION : voir 38_purge_dossier_intents.sql (fonction de purge idempotente, non planifiée ici).
commit;
