begin;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  stripe_payment_intent_id text not null unique,
  amount numeric not null,
  product_type text not null,
  status text not null,
  email text,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

drop policy if exists "users read own payments" on public.payments;
create policy "users read own payments"
on public.payments
for select
to authenticated
using (auth.uid() = user_id);

commit;
