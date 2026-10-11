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
  add column if not exists project_snapshot jsonb;

alter table public.address_dossiers
  add column if not exists place_objective text
    check (place_objective is null or place_objective in ('buy', 'rent', 'understand', 'other')),
  add column if not exists place_objective_set_at timestamptz;

comment on column public.address_dossiers.place_objective is
  'FUT-10 : objectif déclaré de l''analyse de ce bien (buy | rent | understand | other). NULL = non dit.';

-- RÉTENTION (complète la purge de la migration 26) :
--   update public.dossier_intents set project_snapshot = null
--    where created_at < now() - interval '30 days' and project_snapshot is not null;
commit;
