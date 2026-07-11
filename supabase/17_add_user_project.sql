begin;

-- Projet de l'utilisateur (UserProject), persisté par compte. Amorcé par le texte libre de
-- /ou-vivre (posture "recherche", payload ParsedProject), éditable sur /rapport, comblé pour qui
-- n'a jamais fait /ou-vivre. Écriture via /api/profile (field "user_project" et
-- "user_project_if_empty"), lecture par /rapport. Forme : src/lib/user-project.ts.
alter table public.user_profiles
  add column if not exists user_project jsonb;

commit;
