begin;

-- ════════════════════════════════════════════════════════════════════════════
-- report_grants : un rapport débloqué par territoire (INSEE).
--
-- Casse le modèle « 1 user = 1 commune = 1 rapport ». Chaque achat depuis le
-- comparateur (ou plus tard le Pack Décision) crée un grant pour UN INSEE.
-- L'accès de compte (user_accounts.report_access) reste, mais le déblocage fin
-- par territoire vit ici. Compatible multi-territoires sans refonte.
--
-- Écriture : service role uniquement (webhook Stripe). Lecture : l'utilisateur
-- lit ses propres grants (la page rapport vérifie le grant pour l'INSEE consulté).
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.report_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  insee text not null,
  commune text,
  source text not null default 'direct'
    check (source in ('direct', 'comparateur_vie', 'pack_decision')),
  rank int,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  unique (user_id, insee)
);

create index if not exists report_grants_user_id_idx
  on public.report_grants (user_id);

alter table public.report_grants enable row level security;

-- L'utilisateur lit ses propres grants. Les écritures passent par le service
-- role (webhook), qui bypasse RLS : pas de policy insert/update côté client.
drop policy if exists report_grants_select_own on public.report_grants;
create policy report_grants_select_own
  on public.report_grants
  for select
  using (auth.uid() = user_id);

-- ── Territoire actif de lecture (≠ résidence) ───────────────────────────────
-- La résidence reste home_insee_code / home_commune, jamais écrasée. Le
-- territoire consulté est un overlay : null = on lit la résidence.
alter table public.user_profiles
  add column if not exists active_insee_code text;
alter table public.user_profiles
  add column if not exists active_commune text;

-- ── Traçabilité du territoire payé côté paiement ────────────────────────────
alter table public.payments
  add column if not exists target_insee text;

commit;
