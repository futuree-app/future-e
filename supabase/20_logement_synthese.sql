-- Synthèse Logement persistée comme ARTEFACT (cf. spec 1a). Régénérée seulement quand un fait
-- du logement change : on stocke le texte, le hash de faits qui l'a produit, et la date.
-- Patron report_context/logement : clé (user_id, insee), RLS own déjà en place (migration 17).
alter table public.logement
  add column if not exists synthesis_text         text,
  add column if not exists synthesis_fact_hash    text,
  add column if not exists synthesis_generated_at timestamptz;
