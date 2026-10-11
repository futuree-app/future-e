-- Retour arrière de 36_relation_au_lieu_adresse.sql. Les relations déclarées sont PERDUES.
begin;
alter table public.address_dossiers drop column if exists place_relation_set_at;
alter table public.address_dossiers drop column if exists place_relation;
comment on column public.address_dossiers.posture is null;
commit;
