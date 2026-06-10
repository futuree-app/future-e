begin;

-- Réponses du questionnaire (WizardAnswers) persistées par utilisateur connecté,
-- pour ré-afficher la « première lecture » du compte gratuit sans repasser par
-- le wizard. Écriture via /api/profile (field "wizard_answers"), lecture par
-- /rapport et /compte. Voir src/components/wizard/types.ts pour la forme.
alter table public.user_profiles
  add column if not exists wizard_answers jsonb;

commit;
