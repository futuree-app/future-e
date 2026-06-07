begin;

-- ════════════════════════════════════════════════════════════════════════════
-- decision_packs : un Pack Décision acheté = un arbitrage entre TROIS communes.
--
-- L'unité d'achat est le trio (trio_key = 3 INSEE triés, joints par '-'). Le
-- projet acheté est figé dans parsed_snapshot : la comparaison et les pistes du
-- pack se recalculent depuis ce snapshot, jamais depuis le projet courant, pour
-- que l'acheteur retrouve exactement ce qu'il a payé. Le pack ne réimplémente
-- pas les rapports : il crée en plus 3 report_grants (un par commune).
--
-- Écriture : service role (webhook Stripe + endpoint optimiste). Lecture :
-- l'utilisateur lit ses propres packs.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.decision_packs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  trio_key text not null,                 -- 3 INSEE triés joints par '-'
  insee_1 text not null,
  insee_2 text not null,
  insee_3 text not null,
  commune_1 text,
  commune_2 text,
  commune_3 text,
  projet_label text,
  parsed_snapshot jsonb not null,         -- ParsedProject figé à l'achat
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  unique (user_id, trio_key)
);

create index if not exists decision_packs_user_id_idx
  on public.decision_packs (user_id);

alter table public.decision_packs enable row level security;

drop policy if exists decision_packs_select_own on public.decision_packs;
create policy decision_packs_select_own
  on public.decision_packs
  for select
  using (auth.uid() = user_id);

-- ── Staging du snapshot entre create-payment-intent et webhook ──────────────
-- Le ParsedProject dépasse la limite de 500 caractères par clé des metadata
-- Stripe. On le persiste ici à la création du PaymentIntent (clé = PI id) et le
-- webhook (ou l'endpoint optimiste) le relit. Service role uniquement.
create table if not exists public.pack_snapshots (
  stripe_payment_intent_id text primary key,
  user_id uuid references auth.users (id) on delete cascade,
  trio_key text not null,
  insee_1 text not null,
  insee_2 text not null,
  insee_3 text not null,
  commune_1 text,
  commune_2 text,
  commune_3 text,
  projet_label text,
  parsed_snapshot jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.pack_snapshots enable row level security;
-- Aucune policy : lecture/écriture par service role uniquement (bypass RLS).

commit;
