begin;

-- L'intention de paiement d'un dossier d'adresse.
--
-- POURQUOI CETTE TABLE PLUTÔT QUE LES MÉTADONNÉES STRIPE. L'adresse analysée n'est pas l'adresse
-- de facturation : c'est LE LIEU QUE QUELQU'UN ENVISAGE. La transmettre à un tiers de paiement
-- avec ses coordonnées communique une intention de vie qui n'a aucun rôle dans la transaction.
-- Le patron existe déjà pour le Pack Décision (`pack_snapshots`, migration 13).
--
-- Elle porte l'adresse CANONIQUE, telle que le serveur l'a revalidée contre la BAN au moment du
-- paiement, jamais celle reçue du navigateur.
--
-- ELLE N'OUVRE AUCUN DROIT. Le droit reste l'existence d'une ligne `address_dossiers`. Une
-- intention sans paiement est sans effet.
create table if not exists public.dossier_intents (
  stripe_payment_intent_id text primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  ban_id        text not null,
  insee         text not null,
  address_label text not null,
  city          text,
  postcode      text,
  latitude      double precision not null,
  longitude     double precision not null,
  amount_due_cents int not null check (amount_due_cents >= 0),
  territory_deduction_cents int not null default 0 check (territory_deduction_cents >= 0),
  created_at    timestamptz not null default now()
);

-- AUCUNE COLONNE `decision_journey_id`. La conception envisageait un cookie signé de parcours ; il
-- n'est pas construit au lancement, et une colonne sans écrivain est exactement le piège que la
-- spec du 29/07/2026 a refusé pour `dwelling_discriminator`. Le regroupement des événements se
-- fait par le distinct_id PostHog, qui persiste déjà dans le navigateur.

alter table public.dossier_intents enable row level security;

-- AUCUNE POLICY, donc aucun accès pour `authenticated` : seul le service role écrit et lit cette
-- table. Un client qui pourrait écrire ici choisirait l'adresse livrée par le webhook après avoir
-- payé, ou son montant.
revoke all on public.dossier_intents from authenticated, anon;

-- RÉTENTION. Cette table existe pour éviter d'envoyer à Stripe les lieux que des gens envisagent
-- d'habiter : elle ne doit pas devenir l'archive permanente de ces mêmes intentions. L'index sert
-- la purge, qui se lance à la main tant que le volume est faible :
--
--   delete from public.dossier_intents
--    where created_at < now() - interval '30 days'
--      and stripe_payment_intent_id not in (
--        select stripe_payment_intent_id from public.address_dossiers
--         where stripe_payment_intent_id is not null);
--
-- La condition sur `address_dossiers` protège la trace des intentions RÉELLEMENT payées, dont on
-- peut avoir besoin pour reconstruire un dossier après incident.
create index if not exists dossier_intents_created_at_idx
  on public.dossier_intents (created_at);

commit;
