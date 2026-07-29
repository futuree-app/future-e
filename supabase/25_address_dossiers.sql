begin;

-- ════════════════════════════════════════════════════════════════════════════
-- address_dossiers : le dossier devient un OBJET, identifié par un uuid.
--
-- Deux défauts corrigés d'un coup.
--
-- (1) La clé (user_id, logement_id) avec logement_id = ban_id écrasait
-- l'appartement du 2e étage par celui du 4e. Or PreciseLogementStep existe
-- précisément parce qu'une adresse BAN contient plusieurs logements (« quand
-- plusieurs diagnostics existent à l'adresse, on demande LEQUEL est le bon »).
-- Gratuit aujourd'hui, réclamation le jour où chaque dossier coûte 39 €.
--
-- (2) Le droit vivait dans un flag de plan GLOBAL (canAccessCompleteReport)
-- doublé d'un grant communal : aucune notion de droit par bien. Et comme
-- resolveReadableTerritory ne contrôlait aucun grant sur la résidence, un achat
-- quelconque ouvrait le Territoire complet de la commune de résidence, jamais
-- achetée.
--
-- Le droit devient l'EXISTENCE DE LA LIGNE. Les colonnes de paiement en
-- documentent la provenance sans jamais le définir ; access_revoked_at le retire
-- sans détruire l'artefact ni la trace de la transaction. Plus aucune écriture
-- ne part du client.
--
-- À appliquer après 24. Spec : docs/superpowers/specs/2026-07-29-address-dossiers-design.md
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Renommage ───────────────────────────────────────────────────────────
alter table public.logement rename to address_dossiers;

-- ── 2. Identité : uuid, et ban_id perd toute unicité ───────────────────────
alter table public.address_dossiers rename column logement_id to ban_id;
alter table public.address_dossiers drop constraint if exists logement_pkey;

alter table public.address_dossiers
  add column if not exists id uuid not null default gen_random_uuid();
alter table public.address_dossiers
  add constraint address_dossiers_pkey primary key (id);

-- (user_id, ban_id) reste une LECTURE fréquente (les dossiers d'un immeuble),
-- jamais une contrainte : deux appartements y partagent légitimement un ban_id.
drop index if exists public.logement_user_insee_idx;
create index if not exists address_dossiers_user_ban_idx
  on public.address_dossiers (user_id, ban_id);
create index if not exists address_dossiers_user_insee_idx
  on public.address_dossiers (user_id, insee);
alter index if exists public.logement_user_id_idx
  rename to address_dossiers_user_id_idx;

-- ── 3. Provenance, révocation, date de naissance ───────────────────────────
-- created_at n'existait pas (17/19/20/21/22 ne portent qu'updated_at). Le
-- sélecteur doit dire « créé le … » pour distinguer deux dossiers d'un même
-- immeuble : updated_at bouge à chaque écriture technique (synthèse, posture,
-- rehydratation) et purchased_at est nul pour un dossier administratif.
alter table public.address_dossiers
  add column if not exists stripe_payment_intent_id text,
  add column if not exists amount_paid_cents        int,
  add column if not exists purchased_at             timestamptz,
  add column if not exists access_revoked_at        timestamptz,
  add column if not exists created_at               timestamptz not null default now();

-- Remplace le filet que la disparition de unique (user_id, insee) retire : le
-- webhook n'a AUCUNE idempotence propre, toute sa protection contre un événement
-- rejoué vient des contraintes de table (cf. api/stripe/webhook/route.ts).
-- Un index unique Postgres accepte plusieurs NULL : les dossiers administratifs
-- coexistent sans se gêner.
create unique index if not exists address_dossiers_payment_intent_key
  on public.address_dossiers (stripe_payment_intent_id);

-- ── 4. Purge des lignes de test ────────────────────────────────────────────
-- HONNÊTETÉ SUR CE QUI PROTÈGE QUOI. La condition `stripe_payment_intent_id is
-- null` ne démontre rien ici : la colonne vient d'être créée, donc TOUTES les
-- lignes antérieures la portent à null, quelle qu'ait été leur histoire. Ces
-- lignes sont supprimées parce qu'elles ont été VÉRIFIÉES comme données de test
-- avant la migration, pas parce que le SQL le prouverait.
--
-- Le garde-fou ci-dessous protège du vrai risque : exécuter ce fichier sur la
-- mauvaise base, ou sur un état devenu différent de celui qu'on a inspecté.
-- Compte relevé en production le 29/07/2026, juste avant application : 24 lignes,
-- UN SEUL compte (celui du porteur), du 03/07 au 26/07. Aucun achat n'existe.
do $$
declare n integer;
begin
  select count(*) into n from public.address_dossiers;
  if n <> 24 then
    raise exception 'Migration annulée : % lignes trouvées, % attendues. Mauvaise base ?', n, 24;
  end if;
end $$;

delete from public.address_dossiers where stripe_payment_intent_id is null;

-- ── 5. Cohérence : deux états admis, administratif ou acheté ───────────────
alter table public.address_dossiers
  drop constraint if exists address_dossiers_provenance_ck;
alter table public.address_dossiers
  add constraint address_dossiers_provenance_ck check (
    (stripe_payment_intent_id is null
      and amount_paid_cents is null
      and purchased_at is null)
    or
    (stripe_payment_intent_id is not null
      and amount_paid_cents is not null
      and purchased_at is not null
      and amount_paid_cents >= 0)
  );

-- ── 6. Droits : lecture seule pour l'utilisateur ───────────────────────────
-- Les policies d'écriture permettaient à un acheteur de créer son propre dossier,
-- et de réécrire snapshot / synthesis_fact_hash directement via PostgREST (le
-- second gouverne la régénération de la synthèse, donc des appels LLM facturés).
drop policy if exists logement_insert_own on public.address_dossiers;
drop policy if exists logement_update_own on public.address_dossiers;
drop policy if exists logement_select_own on public.address_dossiers;

-- access_revoked_at est dans la POLICY, pas seulement dans les requêtes
-- applicatives. Sans cette clause, un dossier révoqué resterait lisible par son
-- propriétaire via PostgREST avec son JWT : ce serait une révocation d'interface,
-- jamais une révocation de droit.
create policy address_dossiers_select_own
  on public.address_dossiers for select
  using (auth.uid() = user_id and access_revoked_at is null);

-- delete est révoqué explicitement bien qu'aucune policy delete_own n'existe :
-- une interdiction implicite ne se relit pas.
revoke insert, update, delete on public.address_dossiers from authenticated;

commit;
