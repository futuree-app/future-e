begin;

-- ════════════════════════════════════════════════════════════════════════════
-- invoices : la facture émise, figée, et numérotée sans trou.
--
-- POURQUOI. Jusqu'au 31/07/2026, un achat ne laissait AUCUN document. Le webhook
-- envoyait un e-mail de confirmation de trois lignes, et rien d'autre n'existait
-- hors du site. Or une note est obligatoire pour une prestation de service à un
-- particulier dès 25 € TTC (arrêté n° 83-50/A du 3 octobre 1983), et les deux
-- tarifs du dossier d'adresse sont au-dessus.
--
-- ── 1. Une facture est FIGÉE, jamais recalculée ────────────────────────────
-- Toutes les valeurs qui apparaissent sur le document sont copiées ici à
-- l'émission, y compris l'identité du VENDEUR. `src/lib/legal-entity.ts` est la
-- source de vérité du présent ; une facture, elle, doit rester lisible telle
-- qu'elle a été remise, même après un déménagement ou un changement de forme
-- juridique. Rejouer le rendu depuis le code produirait un document différent
-- de celui que le client a reçu.
--
-- ── 2. La numérotation ne doit pas avoir de trou ───────────────────────────
-- Une séquence Postgres (`nextval`) avance même quand la transaction est
-- annulée : elle produit des trous, et un trou dans une numérotation de facture
-- est une non-conformité qu'on ne peut plus rattraper après coup. Le compteur
-- vit donc dans une ligne verrouillée, incrémentée DANS la même transaction que
-- l'insertion, par la fonction `allocate_invoice` ci-dessous. Deux webhooks
-- simultanés se sérialisent sur le verrou de ligne.
--
-- ── 3. Une facture SURVIT à la suppression du compte ───────────────────────
-- Obligation de conservation de dix ans (article L123-22 du code de commerce).
-- `on delete set null` plutôt que `cascade` : le compte peut disparaître, la
-- pièce comptable reste, et elle porte de toute façon l'e-mail et le nom figés.
--
-- ── 4. Aucun accès direct depuis le client ─────────────────────────────────
-- RLS activée, aucune policy, aucun droit accordé à `anon` ni `authenticated` :
-- même patron que `dossier_intents` (migration 26). Les factures se lisent par
-- le serveur, qui filtre sur l'utilisateur courant.
--
-- À appliquer après 26.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.invoices (
  id            uuid primary key default gen_random_uuid(),

  -- Numéro affiché, unique et non réutilisable. Format « FE-2026-0001 ».
  number        text not null unique,
  -- Année et rang gardés séparément : ils fondent le numéro et servent à
  -- vérifier la continuité par une simple requête, sans analyser une chaîne.
  year          int  not null,
  seq           int  not null,

  -- Le compte à l'origine de l'achat. NULL si le compte a été supprimé depuis.
  user_id       uuid references auth.users(id) on delete set null,

  -- ── Le client, figé ──────────────────────────────────────────────────────
  -- Le nom est DÉCLARÉ par le client (métadonnées de son compte). C'est la règle
  -- normale d'une facture : le vendeur ne certifie pas l'identité de l'acheteur.
  buyer_name    text not null,
  buyer_email   text not null,

  -- ── Le vendeur, figé (cf. point 1) ───────────────────────────────────────
  seller        jsonb not null,

  -- ── La prestation, figée ─────────────────────────────────────────────────
  product_type  text not null,
  designation   text not null,
  -- Ce que le client a réellement payé, en centimes, tel que Stripe le déclare.
  -- Jamais un tarif catalogue : le dossier d'adresse a deux montants.
  amount_cents  int  not null check (amount_cents > 0),
  currency      text not null default 'eur',
  vat_mention   text not null,

  -- ── Rattachement et idempotence ──────────────────────────────────────────
  -- Un rejeu du webhook Stripe ne doit jamais émettre une seconde facture pour
  -- le même encaissement : l'unicité est portée par la base, pas par le code.
  stripe_payment_intent_id text not null unique,

  issued_at     timestamptz not null default now()
);

create index if not exists invoices_user_idx on public.invoices (user_id, issued_at desc);

alter table public.invoices enable row level security;
revoke all on public.invoices from anon, authenticated;

-- ── Compteur par année ─────────────────────────────────────────────────────
-- Une ligne par année, verrouillée à l'incrément. Remettre le rang à 1 chaque
-- année est admis tant que le numéro reste chronologique et que le préfixe
-- distingue les séries.
create table if not exists public.invoice_counters (
  year int primary key,
  last int not null default 0 check (last >= 0)
);

alter table public.invoice_counters enable row level security;
revoke all on public.invoice_counters from anon, authenticated;

-- ── Allocation atomique ────────────────────────────────────────────────────
-- Alloue le rang ET insère la facture dans la même transaction. Si l'insertion
-- échoue, l'incrément est annulé avec elle : pas de trou.
--
-- Rejeu : `on conflict (stripe_payment_intent_id) do nothing`, puis on relit la
-- facture existante. La fonction rend donc TOUJOURS la facture de cet
-- encaissement, qu'elle vienne d'être créée ou qu'elle existât déjà, et le
-- booléen `created` dit lequel des deux cas s'est produit. C'est ce booléen qui
-- gouverne l'envoi de l'e-mail : un rejeu ne doit pas renvoyer la facture.
create or replace function public.allocate_invoice(
  p_user_id      uuid,
  p_buyer_name   text,
  p_buyer_email  text,
  p_seller       jsonb,
  p_product_type text,
  p_designation  text,
  p_amount_cents int,
  p_vat_mention  text,
  p_pi           text
)
returns table (id uuid, number text, issued_at timestamptz, created boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year int := extract(year from now())::int;
  v_seq  int;
  v_num  text;
  v_id   uuid;
  v_at   timestamptz;
begin
  -- Rejeu : la facture existe déjà, on la rend sans rien allouer.
  select i.id, i.number, i.issued_at into v_id, v_num, v_at
  from public.invoices i where i.stripe_payment_intent_id = p_pi;
  if found then
    return query select v_id, v_num, v_at, false;
    return;
  end if;

  insert into public.invoice_counters (year, last)
  values (v_year, 1)
  on conflict (year) do update set last = public.invoice_counters.last + 1
  returning public.invoice_counters.last into v_seq;

  v_num := 'FE-' || v_year::text || '-' || lpad(v_seq::text, 4, '0');

  insert into public.invoices (
    number, year, seq, user_id, buyer_name, buyer_email, seller,
    product_type, designation, amount_cents, vat_mention, stripe_payment_intent_id
  ) values (
    v_num, v_year, v_seq, p_user_id, p_buyer_name, p_buyer_email, p_seller,
    p_product_type, p_designation, p_amount_cents, p_vat_mention, p_pi
  )
  returning public.invoices.id, public.invoices.issued_at into v_id, v_at;

  return query select v_id, v_num, v_at, true;
end;
$$;

revoke all on function public.allocate_invoice(uuid, text, text, jsonb, text, text, int, text, text) from public, anon, authenticated;

commit;
