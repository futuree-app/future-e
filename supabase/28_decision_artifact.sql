-- L'ARTEFACT DE DÉCISION : ce qui a été VENDU, figé le jour de la vente.
--
-- POURQUOI. `/rapport` réassemblait le dossier à chaque ouverture avec le moteur du jour. Un lecteur
-- qui revenait six mois après son achat lisait un hybride : les règles du moteur courant, les
-- mesures d'adresse du snapshot d'origine, et rien à l'écran pour le dire. Pour un produit qui vend
-- la vérifiabilité, « qu'est-ce que futur•e m'avait dit quand j'ai décidé ? » n'avait pas de
-- réponse. Spec : docs/superpowers/specs/2026-08-05-dossier-date-et-versionne-design.md
--
-- CE QUI EST FIGÉ ICI, ET RIEN D'AUTRE : la décision et ce qui la prouve. Les états en vigueur
-- (arrêtés sécheresse, CatNat) et les enrichissements millésimés restent relus au rendu, et se
-- présentent comme tels. Figer un arrêté afficherait en 2027 une alerte de l'été 2026.
create table if not exists public.decision_artifact (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  insee_code     text not null,
  -- Même clé que decision_narrative : la commune ne suffit pas. Le projet évolue, la lecture passe
  -- de la commune à l'adresse, et une commune peut porter plusieurs adresses.
  scope_key      text not null,          -- 'commune' | 'logement:<dossier_id>'
  -- LE NUMÉRO DE VERSION EXISTE DÈS MAINTENANT, alors que ce lot n'en produit qu'une. L'ajouter
  -- plus tard demanderait une migration sur une table qui porte déjà des dossiers vendus, et la
  -- contrainte d'unicité en dépend : sans lui, un jour, une régénération écraserait la version sur
  -- laquelle un client a décidé.
  version        int  not null default 1,
  -- 'generating' : la ligne existe avant le contenu, ce qui rend la génération observable et
  -- retentable. 'failed' n'efface rien : le droit d'accès reste ouvert, et l'écran retombe sur
  -- l'assemblage vivant plutôt que de refuser le dossier payé.
  status         text not null default 'generating'
                 check (status in ('generating', 'ready', 'failed')),
  schema_version int  not null default 1,
  engine_version text,
  generated_at   timestamptz,
  -- DecisionArtifactV1. Nul tant que la génération n'a pas abouti.
  payload        jsonb,
  created_at     timestamptz not null default now(),
  -- L'IDEMPOTENCE EST ICI, et pas dans le code applicatif : un webhook Stripe rejoué, ou deux
  -- ouvertures concurrentes, ne peuvent pas créer deux artefacts pour la même version.
  unique (user_id, insee_code, scope_key, version)
);

-- Lecture par identité exacte : on veut la dernière version prête d'un scope.
create index if not exists decision_artifact_lookup_idx
  on public.decision_artifact (user_id, insee_code, scope_key, version desc);

alter table public.decision_artifact enable row level security;

-- RLS own, patron des migrations 17/20/23.
--
-- L'UPDATE EXISTE ICI, contrairement à decision_narrative où « un artefact ne se modifie pas, il se
-- remplace ». La raison est le cycle generating -> ready : la ligne est créée vide puis remplie une
-- fois. Ce n'est pas une réécriture du contenu, c'est son arrivée. Une version PRÊTE, elle, ne se
-- modifie jamais : une actualisation future créera une version 2, distincte.
create policy "decision_artifact_own_select" on public.decision_artifact
  for select using (auth.uid() = user_id);
create policy "decision_artifact_own_insert" on public.decision_artifact
  for insert with check (auth.uid() = user_id);
create policy "decision_artifact_own_update" on public.decision_artifact
  for update using (auth.uid() = user_id);
create policy "decision_artifact_own_delete" on public.decision_artifact
  for delete using (auth.uid() = user_id);
