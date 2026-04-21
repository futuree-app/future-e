begin;

create table if not exists public.user_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  plan text not null default 'free'
    check (plan in ('free', 'one_shot', 'suivi', 'foyer')),
  status text not null default 'active'
    check (status in ('active', 'inactive', 'canceled')),
  report_access text not null default 'partial'
    check (report_access in ('partial', 'complete')),
  dashboard_access text not null default 'none'
    check (dashboard_access in ('none', 'read_only', 'interactive')),
  newsletter_enabled boolean not null default false,
  notifications_enabled boolean not null default false,
  household_mode_enabled boolean not null default false,
  magic_link_preferred boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.user_accounts (user_id) on delete cascade,
  home_insee_code text,
  home_commune text,
  age_band text,
  housing_status text,
  housing_type text,
  job_category text,
  mobility_profile text,
  health_flags jsonb not null default '[]'::jsonb,
  life_projects jsonb not null default '[]'::jsonb,
  household_mode_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.user_accounts (user_id) on delete cascade,
  name text,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  user_profile_id uuid not null references public.user_profiles (id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  unique (household_id, user_profile_id)
);

create or replace function public.handle_new_user_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_accounts (
    user_id,
    email
  )
  values (
    new.id,
    coalesce(new.email, '')
  )
  on conflict (user_id) do update
  set
    email = excluded.email,
    updated_at = now();

  insert into public.user_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user_account();

insert into public.user_accounts (user_id, email)
select
  id,
  coalesce(email, '')
from auth.users
on conflict (user_id) do update
set
  email = excluded.email,
  updated_at = now();

insert into public.user_profiles (user_id)
select id
from auth.users
on conflict (user_id) do nothing;

alter table public.user_accounts enable row level security;
alter table public.user_profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;

drop policy if exists "users read own account" on public.user_accounts;
create policy "users read own account"
on public.user_accounts
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users update own account" on public.user_accounts;
create policy "users update own account"
on public.user_accounts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users read own profile" on public.user_profiles;
create policy "users read own profile"
on public.user_profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users insert own profile" on public.user_profiles;
create policy "users insert own profile"
on public.user_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users update own profile" on public.user_profiles;
create policy "users update own profile"
on public.user_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "owners manage households" on public.households;
create policy "owners manage households"
on public.households
for all
to authenticated
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

drop policy if exists "owners manage household members" on public.household_members;
create policy "owners manage household members"
on public.household_members
for all
to authenticated
using (
  exists (
    select 1
    from public.households
    where households.id = household_members.household_id
      and households.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.households
    where households.id = household_members.household_id
      and households.owner_user_id = auth.uid()
  )
);

commit;
