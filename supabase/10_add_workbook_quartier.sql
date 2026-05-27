begin;

alter table public.user_profiles
  add column if not exists workbook_quartier jsonb;

commit;
