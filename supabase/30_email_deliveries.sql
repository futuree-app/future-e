-- LES MESSAGES TRANSACTIONNELS, ET LA PREUVE QU'ILS SONT PARTIS.
--
-- POURQUOI. À la première vente réelle (12/08/2026, dossier de Magné), tout ce qui touche l'argent
-- a fonctionné : paiement encaissé, dossier créé, facture FE-2026-0001 émise. L'acheteuse n'a rien
-- reçu, et le produit était incapable de dire pourquoi. Le SDK Resend ne lève jamais : il rend
-- `{ data, error }`, et le webhook ne lisait pas ce retour. Un refus disparaissait donc en silence
-- pendant que Stripe recevait un 200. Le correctif du 13/08 journalise l'échec ; un journal ne se
-- requête pas, ne survit pas à la rétention, et ne permet aucune relance.
--
-- CE QUE CETTE TABLE REND POSSIBLE, et qui n'existait pas :
--   — savoir, pour un achat donné, si le message est parti, quand, et sous quel identifiant ;
--   — retrouver ceux qui ont échoué, sans les chercher dans des journaux expirés ;
--   — renvoyer une facture sans rejouer un paiement.
--
-- CE QU'ELLE NE FAIT PAS. Elle n'affirme pas la RÉCEPTION : `sent` veut dire « Resend a accepté »,
-- jamais « le destinataire l'a lu ». Les états de livraison réelle (`delivered`, `bounced`,
-- `complained`) viendront des webhooks Resend, quand ils seront branchés ; la colonne les accueille
-- déjà, et tant qu'aucun webhook n'écrit, ils ne sont simplement jamais posés. Ne pas les inventer.
--
-- AUCUNE POLICY DE LECTURE POUR LES CLIENTS. Cette table est un outil d'exploitation : elle porte
-- des adresses e-mail et des messages d'erreur de fournisseur. Seul le service role l'écrit et la
-- lit, comme `report_grants`.

create table if not exists public.email_deliveries (
  id                       uuid primary key default gen_random_uuid(),
  -- L'ACHAT CONCERNÉ, quand il y en a un. Nul pour un renvoi manuel détaché d'un paiement.
  stripe_payment_intent_id text,
  -- Ce que le message annonce : 'dossier', 'pack', 'territoire', 'facture_renvoi'. Texte libre
  -- borné par le code plutôt que par une contrainte : un nouveau message ne doit pas exiger une
  -- migration, et une valeur inconnue reste lisible.
  kind                     text not null,
  to_email                 text not null,
  -- 'pending' n'est écrit qu'entre la décision d'envoyer et la réponse du fournisseur. Une ligne
  -- qui y reste signale une fonction interrompue en plein vol, ce qu'aucun journal ne montrait.
  status                   text not null default 'pending'
                           check (status in ('pending', 'sent', 'failed', 'delivered', 'bounced', 'complained')),
  -- L'identifiant rendu par Resend. C'est LUI qui permet de retrouver un message dans leur
  -- tableau de bord, et de rattacher un webhook de livraison à cette ligne.
  provider_id              text,
  -- Le message d'erreur du fournisseur, tel quel. On ne le reformule pas : c'est la seule chose
  -- qui distingue un domaine non vérifié d'un destinataire refusé.
  error                    text,
  attempts                 int not null default 1,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- Retrouver tous les messages d'un achat, et la liste des échecs à rattraper.
create index if not exists email_deliveries_pi_idx
  on public.email_deliveries (stripe_payment_intent_id);
create index if not exists email_deliveries_status_idx
  on public.email_deliveries (status, created_at desc);

alter table public.email_deliveries enable row level security;
-- Aucune policy : la table n'est accessible qu'au service role, qui court-circuite RLS.
