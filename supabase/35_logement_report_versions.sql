begin;

-- ════════════════════════════════════════════════════════════════════════════════════════════
-- FUT-13 (05/10/2026) : LES VERSIONS DU RAPPORT LOGEMENT D'UN DOSSIER.
--
-- POURQUOI. Ouvrir un dossier acquis RECALCULAIT le rapport Logement depuis ~14 sources externes :
-- le premier contenu utile attendait la plus lente (6 à 9 s mesurés, ~2 min sur le Preview quand
-- une source sans délai traînait). Une ligne ici est une version du rapport, construite une fois,
-- relue telle quelle à chaque ouverture : la lecture ne touche plus aucune source.
--
-- POURQUOI PAS `decision_artifact`. Il porte un autre objet : le dossier de DÉCISION du hub (verdict,
-- cartes, conclusion), écrit par le hub, versionné par le projet. Le rapport Logement est la matière
-- des preuves du module, écrite par le module, versionnée par ses sources.
--
-- UNE VERSION EST IMMUABLE. Elle n'est insérée qu'une fois le rapport entièrement construit et
-- validé ; aucune ligne « en cours » n'existe, donc aucune ligne partielle ne peut devenir la dernière.
-- La dernière version valide est simplement le plus grand numéro du dossier.
--
-- CE QUI N'Y EST PAS. Le diagnostic choisi et la synthèse restent sur `address_dossiers`, où ils vivent
-- déjà : le choix du DPE est un geste du lecteur, pas une collecte de sources, et le relire à côté de
-- la version garantit qu'une version ne contredit jamais le diagnostic que le lecteur vient de choisir.
--
-- DROITS : lecture seule pour le propriétaire d'un dossier non révoqué ; écriture par le service role
-- seulement (même doctrine que `address_dossiers` : les données d'un produit payant ne s'écrivent pas
-- depuis le navigateur).
--
-- AUCUN BACKFILL ICI. Un dossier sans version reçoit la sienne à sa prochaine ouverture (construction
-- live, puis version 1). La migration n'invente aucun snapshot.
-- ════════════════════════════════════════════════════════════════════════════════════════════

create table if not exists public.logement_report_versions (
  id               uuid primary key default gen_random_uuid(),
  dossier_id       uuid not null references public.address_dossiers(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  version          int  not null check (version >= 1),
  schema_version   int  not null default 1,
  -- Le rapport Logement tel que `/api/georisques-logement` le rend (LogementReport), sans les
  -- réponses brutes des fournisseurs : ~7 Ko mesurés sur un immeuble parisien.
  report           jsonb not null,
  -- L'empreinte du rapport (SHA-256 de son JSON canonique) : deux collectes identiques ont la même.
  report_hash      text not null,
  -- Ce qui manquait à la collecte (sources muettes ou en erreur), pour le dire à l'écran.
  sources_absentes text[] not null default '{}',
  collected_at     timestamptz not null default now(),
  unique (dossier_id, version)
);

create index if not exists logement_report_versions_latest_idx
  on public.logement_report_versions (dossier_id, version desc);

alter table public.logement_report_versions enable row level security;

-- Le propriétaire lit les versions de SES dossiers, tant que le dossier n'est pas révoqué : la
-- révocation d'un dossier doit aussi fermer ses preuves.
create policy logement_report_versions_select_own
  on public.logement_report_versions for select
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.address_dossiers d
      where d.id = dossier_id and d.user_id = auth.uid() and d.access_revoked_at is null
    )
  );

-- Aucune écriture depuis le navigateur, nommément.
revoke insert, update, delete, truncate on public.logement_report_versions from authenticated, anon;

commit;
