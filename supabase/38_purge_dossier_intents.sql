-- ════════════════════════════════════════════════════════════════════════════════════════════
-- 38 · LA PURGE DES INTENTIONS DE DOSSIER, ET CE QU'ELLE NE DOIT JAMAIS PURGER (FUT-10).
--
-- `dossier_intents` porte l'adresse étudiée et le projet confirmé au checkout : des informations
-- personnelles, qui ne doivent pas devenir l'archive des achats abandonnés. Mais elle porte aussi la
-- SEULE copie du contexte payé tant que la première livraison n'a pas abouti, et l'adresse canonique
-- d'un paiement encaissé dont le webhook aurait échoué. La purge distingue donc :
--
--   1. ABANDONNÉE   aucun dossier, verrou jamais posé, plus vieille que p_delai  → SUPPRIMÉE.
--                   Le formulaire verrouille AVANT de confirmer, et le webhook verrouille dès son arrivée :
--                   sans verrou, aucune confirmation n'est partie de notre formulaire, et aucun webhook
--                   n'a été reçu.
--   2. À RÉCONCILIER aucun dossier, verrou posé, plus vieille que p_delai_webhook (3 jours, la fenêtre
--                   de rejeu de Stripe) → JAMAIS supprimée ici, SIGNALÉE (`intentions_a_reconcilier`) :
--                   le paiement peut avoir réussi sans que le dossier existe. Seule une vérification du
--                   statut Stripe tranche (réussi → rejouer le webhook ; échoué ou annulé → supprimer).
--   3. LIVRAISON INACHEVÉE  dossier créé, projet confirmé, aucune version `ready` pour CE dossier →
--                   snapshot GARDÉ (c'est lui que le rattrapage relira), et SIGNALÉE passé p_delai_webhook.
--   4. LIVRÉE       dossier créé et (une version `ready` existe pour ce dossier, ou le dossier est révoqué,
--                   ou l'achat était sans projet) → ligne gardée (trace de la vente, adresse canonique),
--                   snapshot remplacé par un marqueur sans donnée passé p_delai. La première version
--                   figée porte déjà le projet livré : la lecture vendue reste reproductible sans lui.
--   5. EN COURS     plus jeune que les délais → intacte.
--
-- « Une version ready pour ce dossier » se vérifie dans `decision_artifact` (scope `logement:<id du
-- dossier>`, même compte), jamais par la seule existence de la ligne d'achat : un dossier peut exister
-- sans qu'aucun artefact n'ait jamais abouti.
--
-- IDEMPOTENTE, OBSERVABLE (elle rend ce qu'elle a fait et ce qu'elle a signalé), réservée au service
-- role. NON PLANIFIÉE ICI. Configuration proposée, à appliquer à la main après revue (pg_cron) :
--   select cron.schedule('purge-dossier-intents', '17 3 * * *',
--     $$select * from public.purger_dossier_intents()$$);
-- Réversible : 38_purge_dossier_intents_down.sql (les fonctions ; une purge exécutée est définitive).
-- ════════════════════════════════════════════════════════════════════════════════════════════

begin;

-- L'ÉTAT DE LIVRAISON d'une intention, en une seule définition : la purge et le signalement le lisent
-- tous deux, et ne peuvent donc pas diverger.
create or replace function public.etat_livraison_intention(p_pi text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when d.id is null and i.context_locked_at is null then 'abandonnee_ou_en_cours'
    when d.id is null then 'paiement_engage_sans_dossier'
    when d.access_revoked_at is not null then 'livree'
    when i.project_state = 'absent' then 'livree'
    when i.project_state is null then 'livree'          -- intention historique : pas de snapshot
    when exists (
      select 1 from public.decision_artifact a
       where a.user_id = d.user_id
         and a.scope_key = 'logement:' || d.id::text
         and a.status = 'ready'
         and a.payload is not null
    ) then 'livree'
    else 'livraison_inachevee'
  end
  from public.dossier_intents i
  left join public.address_dossiers d on d.stripe_payment_intent_id = i.stripe_payment_intent_id
  where i.stripe_payment_intent_id = p_pi;
$$;

create or replace function public.purger_dossier_intents(
  p_maintenant timestamptz default now(),
  p_delai interval default interval '30 days',
  p_delai_webhook interval default interval '3 days'
)
returns table (supprimees_abandonnees int, projets_effaces int, a_reconcilier int, livraisons_inachevees int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_supprimees int;
  v_effaces int;
  v_reconcilier int;
  v_inachevees int;
begin
  if p_delai < interval '7 days' or p_delai_webhook < interval '3 days' then
    -- Garde-fou : un délai trop court supprimerait une intention dont un webhook différé a besoin.
    raise exception 'délai de purge trop court (% / %), minimum 7 jours / 3 jours', p_delai, p_delai_webhook;
  end if;

  -- 1. Abandonnées : jamais verrouillées, aucun dossier.
  delete from public.dossier_intents i
   where i.created_at < p_maintenant - p_delai
     and public.etat_livraison_intention(i.stripe_payment_intent_id) = 'abandonnee_ou_en_cours';
  get diagnostics v_supprimees = row_count;

  -- 4. Livrées : seul le projet figé est effacé, et seulement passé le délai.
  update public.dossier_intents i
     set project_snapshot = jsonb_build_object('purge', true, 'purged_at', p_maintenant)
   where i.created_at < p_maintenant - p_delai
     and i.project_snapshot is not null
     and not (i.project_snapshot ? 'purge')
     and public.etat_livraison_intention(i.stripe_payment_intent_id) = 'livree';
  get diagnostics v_effaces = row_count;

  -- 2. et 3. : signalées, jamais modifiées.
  select count(*) into v_reconcilier from public.dossier_intents i
   where i.created_at < p_maintenant - p_delai_webhook
     and public.etat_livraison_intention(i.stripe_payment_intent_id) = 'paiement_engage_sans_dossier';
  select count(*) into v_inachevees from public.dossier_intents i
   where i.created_at < p_maintenant - p_delai_webhook
     and public.etat_livraison_intention(i.stripe_payment_intent_id) = 'livraison_inachevee';

  return query select v_supprimees, v_effaces, v_reconcilier, v_inachevees;
end;
$$;

-- LA LISTE À RÉCONCILIER, pour l'humain (ou un script en lecture seule) qui interrogera Stripe.
-- Aucune donnée personnelle : l'identifiant du paiement, son âge, son état de livraison.
create or replace function public.intentions_a_reconcilier(
  p_maintenant timestamptz default now(),
  p_delai_webhook interval default interval '3 days'
)
returns table (stripe_payment_intent_id text, created_at timestamptz, etat text)
language sql
stable
security definer
set search_path = public
as $$
  select i.stripe_payment_intent_id, i.created_at, public.etat_livraison_intention(i.stripe_payment_intent_id)
    from public.dossier_intents i
   where i.created_at < p_maintenant - p_delai_webhook
     and public.etat_livraison_intention(i.stripe_payment_intent_id) in ('paiement_engage_sans_dossier', 'livraison_inachevee')
   order by i.created_at;
$$;

-- L'ANOMALIE INVERSE : un dossier PAYÉ (PaymentIntent présent) dont l'intention est introuvable. Le seul
-- écrivain de ce PaymentIntent est le webhook, qui exige l'intention : ce cas ne devrait jamais exister.
-- Le code n'en fige aucune version (contexte d'achat `indisponible`) ; cette liste dit lesquels examiner.
create or replace function public.dossiers_sans_intention()
returns table (dossier_id uuid, stripe_payment_intent_id text, purchased_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select d.id, d.stripe_payment_intent_id, d.purchased_at
    from public.address_dossiers d
   where d.stripe_payment_intent_id is not null
     and not exists (select 1 from public.dossier_intents i
                      where i.stripe_payment_intent_id = d.stripe_payment_intent_id)
   order by d.purchased_at;
$$;

revoke all on function public.dossiers_sans_intention() from public, authenticated, anon;
grant execute on function public.dossiers_sans_intention() to service_role;

revoke all on function public.etat_livraison_intention(text) from public, authenticated, anon;
revoke all on function public.purger_dossier_intents(timestamptz, interval, interval) from public, authenticated, anon;
revoke all on function public.intentions_a_reconcilier(timestamptz, interval) from public, authenticated, anon;
grant execute on function public.etat_livraison_intention(text) to service_role;
grant execute on function public.purger_dossier_intents(timestamptz, interval, interval) to service_role;
grant execute on function public.intentions_a_reconcilier(timestamptz, interval) to service_role;

commit;
