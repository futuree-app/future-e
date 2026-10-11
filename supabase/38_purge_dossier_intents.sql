-- ════════════════════════════════════════════════════════════════════════════════════════════
-- 38 · LA PURGE DES INTENTIONS DE DOSSIER (FUT-10).
--
-- `dossier_intents` porte l'adresse étudiée et, depuis la migration 37, le projet figé au checkout :
-- des informations personnelles. Elle ne doit pas devenir l'archive des achats abandonnés.
--
-- QUATRE ÉTATS, QUATRE TRAITEMENTS (une ligne = un PaymentIntent) :
--   1. abandonnée          : aucun dossier, verrou jamais posé, plus vieille que le délai → SUPPRIMÉE ;
--   2. paiement engagé     : aucun dossier, verrou posé, plus vieille que le délai → SUPPRIMÉE aussi :
--                            Stripe ne rejoue un webhook que pendant 3 jours, un paiement par carte se
--                            résout en minutes, et le délai (30 jours) laisse dix fois cette marge ;
--   3. paiement en cours   : plus jeune que le délai → INTACTE, quel que soit son état ;
--   4. dossier livré       : un `address_dossiers` porte ce PaymentIntent → la ligne RESTE (trace pour
--                            reconstruire un dossier après incident), seul `project_snapshot` est
--                            effacé passé le délai : l'artefact figé en porte déjà la copie livrée.
--                            `project_state` reste, et dit encore ce qui avait été confirmé.
--
-- IDEMPOTENTE : la rejouer ne trouve plus rien à faire. OBSERVABLE : elle rend ce qu'elle a fait.
-- NON PLANIFIÉE ICI. Configuration proposée (pg_cron, à appliquer à la main après revue) :
--   select cron.schedule('purge-dossier-intents', '17 3 * * *',
--     $$select * from public.purger_dossier_intents()$$);
-- Réversible : 38_purge_dossier_intents_down.sql (la fonction seule ; une purge exécutée est définitive).
-- ════════════════════════════════════════════════════════════════════════════════════════════

begin;

create or replace function public.purger_dossier_intents(
  p_maintenant timestamptz default now(),
  p_delai interval default interval '30 days'
)
returns table (supprimees_abandonnees int, supprimees_engagees int, projets_effaces int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_abandonnees int;
  v_engagees int;
  v_effaces int;
begin
  if p_delai < interval '7 days' then
    -- Garde-fou : un délai trop court supprimerait une intention dont un webhook différé a besoin.
    raise exception 'délai de purge trop court (%), minimum 7 jours', p_delai;
  end if;

  delete from public.dossier_intents i
   where i.created_at < p_maintenant - p_delai
     and i.context_locked_at is null
     and not exists (select 1 from public.address_dossiers d
                      where d.stripe_payment_intent_id = i.stripe_payment_intent_id);
  get diagnostics v_abandonnees = row_count;

  delete from public.dossier_intents i
   where i.created_at < p_maintenant - p_delai
     and i.context_locked_at is not null
     and not exists (select 1 from public.address_dossiers d
                      where d.stripe_payment_intent_id = i.stripe_payment_intent_id);
  get diagnostics v_engagees = row_count;

  -- Un projet 'confirmed' doit porter un snapshot (contrainte de la migration 37) : on le remplace par
  -- un MARQUEUR sans aucune donnée du lecteur. Relu, il ne vaut aucun projet (`normalizeUserProject`
  -- le refuse), et il n'est relu par personne : le webhook de cette intention est passé.
  update public.dossier_intents i
     set project_snapshot = jsonb_build_object('purge', true, 'purged_at', p_maintenant)
   where i.created_at < p_maintenant - p_delai
     and i.project_snapshot is not null
     and not (i.project_snapshot ? 'purge')
     and exists (select 1 from public.address_dossiers d
                  where d.stripe_payment_intent_id = i.stripe_payment_intent_id);
  get diagnostics v_effaces = row_count;

  return query select v_abandonnees, v_engagees, v_effaces;
end;
$$;

revoke all on function public.purger_dossier_intents(timestamptz, interval) from public;
revoke all on function public.purger_dossier_intents(timestamptz, interval) from authenticated, anon;
grant execute on function public.purger_dossier_intents(timestamptz, interval) to service_role;

commit;
