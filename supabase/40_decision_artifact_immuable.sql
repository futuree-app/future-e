-- ════════════════════════════════════════════════════════════════════════════════════════════
-- 40 · UNE VERSION PRÊTE NE SE MODIFIE PLUS, ET LE NAVIGATEUR N'ÉCRIT PLUS L'ARTEFACT (FUT-173).
--
-- POURQUOI. La migration 28 promettait « une version prête ne se modifie jamais », mais rien en base
-- ne le garantissait :
--   · les policies `decision_artifact_own_update` et `_own_delete` laissaient le propriétaire, avec
--     son propre jeton et sans passer par le serveur, réécrire le `payload` d'une version `ready`, la
--     repasser en `failed`, changer son numéro ou la supprimer ;
--   · `decision_artifact_own_insert` le laissait insérer une version `ready` au contenu de son choix,
--     ou réserver une place `generating` avant le webhook Stripe (qui s'arrêtait alors, la place prise) ;
--   · le service role (webhook) contourne les RLS : une écriture serveur fautive, comme le
--     `failArtifact` de rattrapage après un `completeArtifact` déjà validé, pouvait repasser une
--     version prête en `failed` sans que rien ne l'arrête.
-- Diagnostic complet et matrice avant/après : docs/audits/2026-11-10-fut173-immutabilite-decision-artifact.md
--
-- CE QUE CETTE MIGRATION GARANTIT, POUR TOUS LES RÔLES (y compris service_role, qui ne contourne pas
-- un trigger) :
--   1. une ligne NAÎT `generating`, vide (ni payload, ni date de génération) ;
--   2. son identité (id, user_id, insee_code, scope_key, version, created_at) ne change jamais ;
--   3. seules transitions : `generating → ready` (avec payload et date) et `generating → failed`
--      (sans contenu). `ready` et `failed` sont TERMINAUX : une reprise réserve la version suivante,
--      c'est déjà le contrat du code (`prochaineVersionAReserver`) ;
--   4. une version `ready` ne se supprime pas tant que son compte existe. La suppression du compte
--      (Auth, `auth.admin.deleteUser`) la supprime par la cascade de `user_id`, et c'est le seul
--      effacement ordinaire : il est tracé par le journal d'Auth.
-- Et, par les droits : `anon` et `authenticated` LISENT (leurs lignes, RLS inchangée) et n'écrivent
-- plus rien. Les écritures passent par le serveur, en service role, dans `decision-artifact-store.ts`.
--
-- CE QU'ELLE NE FAIT PAS. Aucune ligne existante n'est lue, modifiée ni supprimée : le trigger ne
-- juge que les écritures FUTURES. Une version `ready` déjà en base reste telle quelle ; une ligne
-- `generating` abandonnée peut encore aboutir ou échouer ; une ligne `failed` reste un témoin.
--
-- EFFACEMENT HORS SUPPRESSION DE COMPTE (demande RGPD ciblée, réparation) : opération d'administration,
-- par le rôle propriétaire (`postgres`, SQL Editor), dans une transaction qui désactive le trigger le
-- temps de l'opération. Procédure : supabase/maintenance/fut173-effacement-controle.sql.
--
-- PRÉREQUIS DE DÉPLOIEMENT : le code qui écrit en service role (même PR) doit être en production
-- AVANT cette migration ; sinon `/rapport` ne peut plus figer les dossiers antérieurs (l'échec est
-- silencieux pour le lecteur, qui voit l'assemblage vivant, mais aucune version ne naît).
-- Retour arrière : 40_decision_artifact_immuable_down.sql.
-- ════════════════════════════════════════════════════════════════════════════════════════════

begin;

create or replace function public.decision_artifact_integrite() returns trigger
language plpgsql
-- SECURITY DEFINER pour lire `auth.users` (suppression), que les rôles appelants ne voient pas.
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    if new.status is distinct from 'generating' or new.payload is not null or new.generated_at is not null then
      raise exception 'decision_artifact : une version naît « generating », sans contenu (reçu : %)', new.status
        using errcode = 'check_violation';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id or new.user_id is distinct from old.user_id
       or new.insee_code is distinct from old.insee_code or new.scope_key is distinct from old.scope_key
       or new.version is distinct from old.version or new.created_at is distinct from old.created_at then
      raise exception 'decision_artifact : l''identité d''une version ne change pas (v%)', old.version
        using errcode = 'check_violation';
    end if;
    if old.status <> 'generating' then
      raise exception 'decision_artifact : la version % est « % », elle ne se modifie plus', old.version, old.status
        using errcode = 'check_violation';
    end if;
    if new.status = 'ready' then
      if new.payload is null or new.generated_at is null then
        raise exception 'decision_artifact : une version prête porte son contenu et sa date (v%)', old.version
          using errcode = 'check_violation';
      end if;
    elsif new.status = 'failed' then
      if new.payload is not null or new.generated_at is not null then
        raise exception 'decision_artifact : une tentative échouée ne porte aucun contenu (v%)', old.version
          using errcode = 'check_violation';
      end if;
    else
      raise exception 'decision_artifact : transition interdite % → % (v%)', old.status, new.status, old.version
        using errcode = 'check_violation';
    end if;
    return new;
  end if;

  -- DELETE. Une version prête ne disparaît qu'avec son compte : dans la cascade de `auth.users`, la
  -- ligne du compte est déjà supprimée quand cette ligne-ci l'est.
  if old.status = 'ready' and exists (select 1 from auth.users u where u.id = old.user_id) then
    raise exception 'decision_artifact : la version prête % ne se supprime pas (effacement : supprimer le compte, ou procédure FUT-173)', old.version
      using errcode = 'restrict_violation';
  end if;
  return old;
end;
$$;

revoke all on function public.decision_artifact_integrite() from public, anon, authenticated;

drop trigger if exists decision_artifact_integrite on public.decision_artifact;
create trigger decision_artifact_integrite
  before insert or update or delete on public.decision_artifact
  for each row execute function public.decision_artifact_integrite();

-- LE NAVIGATEUR LIT, LE SERVEUR ÉCRIT (patron des migrations 35 et 39).
drop policy if exists "decision_artifact_own_insert" on public.decision_artifact;
drop policy if exists "decision_artifact_own_update" on public.decision_artifact;
drop policy if exists "decision_artifact_own_delete" on public.decision_artifact;
revoke all on table public.decision_artifact from anon;
revoke insert, update, delete, truncate on table public.decision_artifact from authenticated;
grant select on table public.decision_artifact to authenticated;
-- TRUNCATE ne déclenche aucun trigger de ligne : personne d'autre que le propriétaire ne le garde.
revoke truncate on table public.decision_artifact from service_role;

commit;
