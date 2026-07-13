-- Conclusion RÉDIGÉE du dossier de décision, traitée en ARTEFACT (slice 2). Le texte est figé : il ne
-- bouge que si le plan narratif change. Sans cela, la conclusion se reformulerait à chaque
-- rechargement de la même page, et le lecteur verrait son rapport changer de phrase sous ses yeux.
--
-- L'identité de l'artefact est l'input_hash (SHA-256 du plan + prompt + modèle + contrat), et non la
-- commune : le projet évolue, la lecture passe de la commune à l'adresse, une commune peut porter
-- plusieurs adresses. scope_key sépare la commune de chaque logement, donc deux adresses de la même
-- commune ne se marchent jamais dessus.
create table if not exists public.decision_narrative (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  insee_code     text not null,
  scope_key      text not null,   -- "commune" | "logement:<logement_id>"
  input_hash     text not null,
  blocks         jsonb not null,  -- [{ key, text }] — la provenance est reconstituée depuis le plan
  prompt_version text not null,
  model          text not null,
  created_at     timestamptz not null default now(),
  unique (user_id, insee_code, scope_key, input_hash)
);

-- Lecture par identité exacte, et pruning (on ne garde que les 3 derniers par scope).
create index if not exists decision_narrative_retention_idx
  on public.decision_narrative (user_id, insee_code, scope_key, created_at desc, id desc);

alter table public.decision_narrative enable row level security;

-- RLS own (patron des migrations 17/20). Pas d'update : un artefact ne se modifie pas, il se remplace.
create policy "decision_narrative_own_select" on public.decision_narrative
  for select using (auth.uid() = user_id);
create policy "decision_narrative_own_insert" on public.decision_narrative
  for insert with check (auth.uid() = user_id);
create policy "decision_narrative_own_delete" on public.decision_narrative
  for delete using (auth.uid() = user_id);
