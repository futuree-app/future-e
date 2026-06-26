begin;

-- ════════════════════════════════════════════════════════════════════════════
-- Pack Décision « mode choix » : le lecteur NOMME 2 ou 3 communes (porte
-- /comparateur), au lieu de partir d'un trio PROPOSÉ par /ou-vivre (mode replay).
--
-- Décision durable (addendum ADR-0007, arbitrages/comparateur-un-moteur-trois-portes) :
--  - colonne `mode` ('replay' | 'choix'). Un pack choix NE SE RECONSTRUIT PAS en
--    rejouant le projet (il n'y a pas de projet) : la matrice se recalcule via
--    seedComparaison(insees). D'où une colonne, pas une heuristique.
--  - `insee_3` devient nullable (packs à 2 communes).
--  - `parsed_snapshot` devient nullable (mode choix n'a aucun ParsedProject).
--
-- Borne : au-delà de 3 communes -> table enfant decision_pack_communes (pas une 4e
-- colonne). Hors périmètre ici (N in {2,3}).
-- ════════════════════════════════════════════════════════════════════════════

-- decision_packs ------------------------------------------------------------
alter table public.decision_packs
  add column if not exists mode text not null default 'replay';

alter table public.decision_packs
  drop constraint if exists decision_packs_mode_check;
alter table public.decision_packs
  add constraint decision_packs_mode_check check (mode in ('replay', 'choix'));

alter table public.decision_packs alter column insee_3 drop not null;
alter table public.decision_packs alter column parsed_snapshot drop not null;

-- Garde-fou de cohérence : un pack replay garde son snapshot ; un pack choix a au
-- moins 2 INSEE (insee_1, insee_2 déjà NOT NULL) et peut se passer du snapshot.
alter table public.decision_packs
  drop constraint if exists decision_packs_replay_has_snapshot;
alter table public.decision_packs
  add constraint decision_packs_replay_has_snapshot
  check (mode <> 'replay' or parsed_snapshot is not null);

-- pack_snapshots (staging create-payment-intent -> webhook/optimiste) -----------
alter table public.pack_snapshots
  add column if not exists mode text not null default 'replay';

alter table public.pack_snapshots
  drop constraint if exists pack_snapshots_mode_check;
alter table public.pack_snapshots
  add constraint pack_snapshots_mode_check check (mode in ('replay', 'choix'));

alter table public.pack_snapshots alter column insee_3 drop not null;
alter table public.pack_snapshots alter column parsed_snapshot drop not null;

alter table public.pack_snapshots
  drop constraint if exists pack_snapshots_replay_has_snapshot;
alter table public.pack_snapshots
  add constraint pack_snapshots_replay_has_snapshot
  check (mode <> 'replay' or parsed_snapshot is not null);

commit;
