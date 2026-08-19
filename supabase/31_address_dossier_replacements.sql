begin;

-- ════════════════════════════════════════════════════════════════════════════
-- ÉCHANGER UN DOSSIER D'ADRESSE PAYÉ, SANS RÉÉCRIRE L'HISTOIRE.
--
-- Cas d'origine : deux personnes ont acheté par erreur la même adresse le
-- 16/17 août 2026. L'une d'elles choisit une autre adresse. Un UPDATE de la
-- ligne payée ferait alors croire que Stripe avait encaissé le nouveau bien ;
-- un UPDATE de la facture réécrirait une pièce déjà émise ; réutiliser le même
-- dossier ferait enfin remonter ses artefacts de décision liés à l'ancienne
-- adresse.
--
-- Le remplacement est donc un nouvel objet :
--   - l'ancien dossier reste en base et perd seulement son droit de lecture ;
--   - le nouveau dossier porte un lien explicite vers celui qu'il remplace ;
--   - la facture d'origine reste intacte ;
--   - une facture rectificative reçoit le numéro chronologique suivant et
--     indique quelle facture elle annule et remplace ;
--   - aucun second encaissement n'est inventé.
--
-- La fonction finale réalise ces quatre écritures dans UNE transaction et est
-- idempotente pour un même couple dossier d'origine / nouvelle adresse.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Provenance du droit de remplacement ────────────────────────────────
--
-- Les trois colonnes Stripe restent nulles : elles décrivent un encaissement,
-- et il n'y en a pas de second. Le lien ci-dessous distingue cette provenance
-- d'un dossier administratif, qui porte lui aussi un triplet Stripe nul.
alter table public.address_dossiers
  add column if not exists replacement_for_dossier_id uuid
    references public.address_dossiers(id) on delete restrict,
  add column if not exists replacement_reason text;

create unique index if not exists address_dossiers_one_replacement_idx
  on public.address_dossiers (replacement_for_dossier_id)
  where replacement_for_dossier_id is not null;

alter table public.address_dossiers
  drop constraint if exists address_dossiers_not_self_replacement_ck;
alter table public.address_dossiers
  add constraint address_dossiers_not_self_replacement_ck check (
    replacement_for_dossier_id is null or replacement_for_dossier_id <> id
  );

comment on column public.address_dossiers.replacement_for_dossier_id is
  'Dossier payé dont celui-ci remplace la livraison, sans nouvel encaissement. L original reste archivé et révoqué.';
comment on column public.address_dossiers.replacement_reason is
  'Motif opérationnel figé de l échange. Ne contient ni verdict produit ni donnée calculée.';

-- ── 2. Les factures rectificatives vivent dans la série existante ─────────
--
-- Elles restent dans `invoices` afin que le compteur FE-AAAA-NNNN soit unique
-- pour toutes les factures et que le compte client puisse les lire avec la
-- route déjà déployée. La référence Stripe est nulle sur la rectificative : le
-- paiement est porté par la pièce qu'elle corrige, jamais dupliqué.
alter table public.invoices
  add column if not exists document_kind text not null default 'original',
  add column if not exists corrects_invoice_id uuid
    references public.invoices(id) on delete restrict,
  add column if not exists corrected_designation text,
  add column if not exists correction_reason text,
  add column if not exists replacement_dossier_id uuid
    references public.address_dossiers(id) on delete restrict,
  add column if not exists payment_received_at timestamptz;

update public.invoices
set payment_received_at = issued_at
where payment_received_at is null;

alter table public.invoices
  alter column payment_received_at set default now(),
  alter column payment_received_at set not null,
  alter column stripe_payment_intent_id drop not null;

alter table public.invoices
  drop constraint if exists invoices_document_kind_ck;
alter table public.invoices
  add constraint invoices_document_kind_ck check (
    (
      document_kind = 'original'
      and stripe_payment_intent_id is not null
      and corrects_invoice_id is null
      and corrected_designation is null
      and correction_reason is null
      and replacement_dossier_id is null
    )
    or
    (
      document_kind = 'correction'
      and stripe_payment_intent_id is null
      and corrects_invoice_id is not null
      and corrected_designation is not null
      and length(trim(corrected_designation)) > 0
      and correction_reason is not null
      and length(trim(correction_reason)) > 0
    )
  );

-- Une pièce ne peut être annulée et remplacée que par une pièce suivante. Si
-- une rectificative devait elle-même être corrigée, la nouvelle ligne pointera
-- vers elle : la chaîne reste lisible et aucune ligne n'est modifiée.
create unique index if not exists invoices_one_direct_correction_idx
  on public.invoices (corrects_invoice_id)
  where corrects_invoice_id is not null;

comment on column public.invoices.corrected_designation is
  'Désignation propre de la rectificative. `designation` garde un libellé autonome compatible avec les anciennes versions du rendu PDF.';
comment on column public.invoices.payment_received_at is
  'Date de l unique encaissement. Sur une rectificative, elle est recopiée depuis la pièce corrigée et ne vaut jamais nouvel encaissement.';

-- ── 3. Échange atomique + allocation de la rectificative ──────────────────
create or replace function public.replace_paid_address_dossier(
  p_original_dossier_id uuid,
  p_ban_id text,
  p_insee text,
  p_address_label text,
  p_city text,
  p_postcode text,
  p_latitude double precision,
  p_longitude double precision,
  p_new_designation text,
  p_reason text
)
returns table (
  replacement_dossier_id uuid,
  correction_invoice_id uuid,
  correction_number text,
  created boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_original public.address_dossiers%rowtype;
  v_replacement public.address_dossiers%rowtype;
  v_source_invoice public.invoices%rowtype;
  v_correction public.invoices%rowtype;
  v_now timestamptz := now();
  v_year int := extract(year from now())::int;
  v_seq int;
  v_number text;
  v_compat_designation text;
begin
  if nullif(trim(p_ban_id), '') is null
     or nullif(trim(p_insee), '') is null
     or nullif(trim(p_address_label), '') is null
     or nullif(trim(p_city), '') is null
     or nullif(trim(p_postcode), '') is null
     or nullif(trim(p_new_designation), '') is null
     or nullif(trim(p_reason), '') is null
     or p_latitude is null
     or p_longitude is null
     or p_latitude not between -90 and 90
     or p_longitude not between -180 and 180 then
    raise exception 'Adresse, désignation ou motif de remplacement invalide';
  end if;

  select d.* into v_original
  from public.address_dossiers d
  where d.id = p_original_dossier_id
  for update;

  if not found then
    raise exception 'Dossier d origine introuvable';
  end if;

  -- REJEU : on rend les objets déjà créés, mais seulement si la cible est
  -- strictement la même. Un second appel avec une autre adresse est une nouvelle
  -- décision et doit échouer visiblement.
  select d.* into v_replacement
  from public.address_dossiers d
  where d.replacement_for_dossier_id = v_original.id;

  if found then
    if v_replacement.ban_id <> trim(p_ban_id) then
      raise exception 'Ce dossier a déjà été remplacé par une autre adresse';
    end if;

    select i.* into v_correction
    from public.invoices i
    where i.replacement_dossier_id = v_replacement.id
      and i.document_kind = 'correction'
    order by i.issued_at desc
    limit 1;

    if not found then
      raise exception 'Remplacement existant sans facture rectificative';
    end if;

    return query select v_replacement.id, v_correction.id, v_correction.number, false;
    return;
  end if;

  if v_original.access_revoked_at is not null then
    raise exception 'Le dossier d origine est déjà révoqué sans remplacement associé';
  end if;
  if v_original.stripe_payment_intent_id is null then
    raise exception 'Seul un dossier payé peut être échangé par cette fonction';
  end if;
  if v_original.ban_id = trim(p_ban_id) then
    raise exception 'La nouvelle adresse est identique à l adresse d origine';
  end if;

  select i.* into v_source_invoice
  from public.invoices i
  where i.stripe_payment_intent_id = v_original.stripe_payment_intent_id
  for update;

  if not found then
    raise exception 'Facture d origine introuvable pour le dossier payé';
  end if;
  if v_source_invoice.user_id is distinct from v_original.user_id then
    raise exception 'La facture et le dossier n appartiennent pas au même compte';
  end if;
  if exists (
    select 1 from public.invoices i where i.corrects_invoice_id = v_source_invoice.id
  ) then
    raise exception 'La facture d origine possède déjà une rectificative';
  end if;

  insert into public.address_dossiers (
    user_id, ban_id, insee, address_label, city, postcode, latitude, longitude,
    posture, replacement_for_dossier_id, replacement_reason
  ) values (
    v_original.user_id, trim(p_ban_id), trim(p_insee), trim(p_address_label),
    trim(p_city), trim(p_postcode), p_latitude, p_longitude,
    v_original.posture, v_original.id, trim(p_reason)
  )
  returning * into v_replacement;

  update public.address_dossiers
  set access_revoked_at = v_now, updated_at = v_now
  where id = v_original.id;

  -- Le compte s'ouvre désormais sur le bien réellement livré. Cette colonne est
  -- une préférence de lecture, pas un droit ; le droit vient de la nouvelle ligne.
  update public.user_profiles
  set active_insee_code = trim(p_insee),
      active_commune = trim(p_city),
      active_dossier_id = v_replacement.id
  where user_id = v_original.user_id;

  insert into public.invoice_counters (year, last)
  values (v_year, 1)
  on conflict (year) do update set last = public.invoice_counters.last + 1
  returning public.invoice_counters.last into v_seq;

  v_number := 'FE-' || v_year::text || '-' || lpad(v_seq::text, 4, '0');
  v_compat_designation :=
    'Facture rectificative — annule et remplace la facture ' ||
    v_source_invoice.number || ' du ' ||
    to_char(v_source_invoice.issued_at at time zone 'Europe/Paris', 'DD/MM/YYYY') ||
    ' — ' || trim(p_new_designation);

  insert into public.invoices (
    number, year, seq, user_id, buyer_name, buyer_email, seller,
    product_type, designation, amount_cents, currency, vat_mention,
    stripe_payment_intent_id, issued_at, document_kind, corrects_invoice_id,
    corrected_designation, correction_reason, replacement_dossier_id,
    payment_received_at
  ) values (
    v_number, v_year, v_seq, v_source_invoice.user_id,
    v_source_invoice.buyer_name, v_source_invoice.buyer_email,
    v_source_invoice.seller, v_source_invoice.product_type,
    v_compat_designation, v_source_invoice.amount_cents,
    v_source_invoice.currency, v_source_invoice.vat_mention,
    null, v_now, 'correction', v_source_invoice.id,
    trim(p_new_designation), trim(p_reason), v_replacement.id,
    v_source_invoice.payment_received_at
  )
  returning * into v_correction;

  return query select v_replacement.id, v_correction.id, v_correction.number, true;
end;
$$;

revoke all on function public.replace_paid_address_dossier(
  uuid, text, text, text, text, text, double precision, double precision, text, text
) from public, anon, authenticated;
grant execute on function public.replace_paid_address_dossier(
  uuid, text, text, text, text, text, double precision, double precision, text, text
) to service_role;

commit;
