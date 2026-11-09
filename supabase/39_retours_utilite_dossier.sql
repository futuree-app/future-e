-- ════════════════════════════════════════════════════════════════════════════════════════════
-- 39 · LE RETOUR D'UTILITÉ EN FIN DE DOSSIER (FUT-94).
--
-- Une question, posée sous le dossier de `/rapport` : « Cette analyse vous a-t-elle appris quelque
-- chose d'utile pour votre recherche ? ». Trois réponses (oui, pas vraiment, pas encore lu) et un
-- commentaire facultatif. Ce qu'on mesure est la VALEUR du dossier lu, pas la satisfaction générale.
--
-- L'IDENTITÉ DU DOSSIER est celle de `decision_artifact` : (compte, commune, scope_key), avec
-- scope_key = 'commune' ou 'logement:<id du dossier d'adresse>'. Un dossier d'adresse est en plus
-- rattaché par clé étrangère à sa ligne `address_dossiers`, ce qui garantit qu'un retour ne désigne
-- jamais un bien qui n'existe pas.
--
-- UNE RÉPONSE PAR LECTEUR ET PAR DOSSIER, ET ELLE SE REMPLACE. La contrainte d'unicité ci-dessous en
-- est la seule garde : un double clic ou un envoi rejoué retombent sur la même ligne (upsert). Une
-- nouvelle réponse REMPLACE la précédente (« pas encore lu » devient « oui » une fois le dossier lu) :
--   · `created_at`     la date de la PREMIÈRE réponse, jamais réécrite ;
--   · `updated_at`     la date du dernier envoi (réponse ou commentaire) ;
--   · `commented_at`   la date du commentaire en vigueur (nul sans commentaire) ;
--   · `artifact_version` la version figée du dossier servie au moment de la réponse (nulle quand le
--     dossier était assemblé à l'instant) : une réponse donnée sur la v1 ne se lit pas comme un avis
--     sur la v2.
--
-- CE QUI N'EST PAS ICI, VOLONTAIREMENT : l'adresse (elle vit dans `address_dossiers`, la clé suffit),
-- le contenu du projet, le texte du dossier, l'e-mail. Le commentaire libre est PRIVÉ : il n'est lu
-- que par l'équipe, n'est jamais envoyé à PostHog, et n'est jamais publié comme témoignage sans un
-- consentement distinct, recueilli ailleurs et autrement.
--
-- DROITS. Le lecteur LIT ses seuls retours (pour ne pas reposer la question). Il n'ÉCRIT rien
-- directement : `authenticated` n'a aucun privilège d'écriture, la route `/api/dossier/retour-utilite`
-- vérifie la propriété du dossier puis écrit avec le service role (`lib/server/retour-utilite-store.ts`),
-- patron de la migration 25. `anon` n'a rien. L'administrateur consulte par le SQL Editor
-- (`supabase/maintenance/fut94-retours-utilite.sql`), aucune route HTTP ne liste les retours.
--
-- CONSERVATION : `purger_retours_utilite()` (bas de fichier) efface les commentaires à 12 mois et
-- supprime les réponses à 24 mois. Non planifiée ici.
--
-- NON APPLIQUÉE EN PRODUCTION PAR LA PR QUI L'APPORTE. Tant qu'elle ne l'est pas, la page `/rapport`
-- ne montre pas la question (la lecture échoue, le bloc s'efface) : rien ne casse.
-- Retour arrière : 39_retours_utilite_dossier_down.sql.
-- ════════════════════════════════════════════════════════════════════════════════════════════

begin;

create table if not exists public.dossier_utility_feedback (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  insee_code         text not null check (insee_code ~ '^[0-9][0-9AB][0-9]{3}$'),
  scope_key          text not null,
  address_dossier_id uuid references public.address_dossiers(id) on delete cascade,
  answer             text not null check (answer in ('oui', 'pas_vraiment', 'pas_encore_lu')),
  -- Jamais une chaîne vide : « pas de commentaire » est NULL. La borne est celle de l'écran et de la
  -- route ; la base refuse au-delà plutôt que de tronquer.
  comment            text check (comment is null or char_length(comment) between 1 and 2000),
  artifact_version   int  check (artifact_version is null or artifact_version >= 1),
  presentation       text check (presentation is null or presentation in ('classique', 'releve')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  commented_at       timestamptz,
  -- La clé de portée et la clé étrangère disent la même chose, ou rien ne s'écrit.
  constraint dossier_utility_feedback_scope_ck check (
    (scope_key = 'commune' and address_dossier_id is null)
    or (address_dossier_id is not null and scope_key = 'logement:' || address_dossier_id::text)
  ),
  constraint dossier_utility_feedback_comment_date_ck check ((comment is null) = (commented_at is null)),
  -- Un dossier pas encore lu n'a pas de commentaire : « ce qui m'a manqué » décrirait une lecture que
  -- la réponse en vigueur dit ne pas avoir eu lieu. La route l'efface en passant à « pas encore lu ».
  constraint dossier_utility_feedback_non_lu_ck check (answer <> 'pas_encore_lu' or comment is null),
  constraint dossier_utility_feedback_one_per_dossier unique (user_id, insee_code, scope_key)
);

comment on table public.dossier_utility_feedback is
  'FUT-94 · Retour d''utilité en fin de dossier. Une ligne par compte et par dossier, remplacée à chaque réponse. Commentaires privés : jamais publiés sans consentement distinct, jamais envoyés à PostHog.';
comment on column public.dossier_utility_feedback.comment is
  'Commentaire libre, PRIVÉ. Lu par l''équipe seulement. Jamais publié comme témoignage sans consentement distinct.';

-- Consultation de l'administrateur : les plus récents d'abord, par réponse.
create index if not exists dossier_utility_feedback_updated_idx
  on public.dossier_utility_feedback (updated_at desc);
create index if not exists dossier_utility_feedback_dossier_idx
  on public.dossier_utility_feedback (address_dossier_id)
  where address_dossier_id is not null;

alter table public.dossier_utility_feedback enable row level security;

-- Aucun privilège par défaut pour les rôles exposés par PostgREST ; la lecture de ses propres lignes
-- est rendue explicitement, rien d'autre.
revoke all on table public.dossier_utility_feedback from anon, authenticated;
grant select on table public.dossier_utility_feedback to authenticated;

drop policy if exists dossier_utility_feedback_select_own on public.dossier_utility_feedback;
create policy dossier_utility_feedback_select_own
  on public.dossier_utility_feedback for select
  to authenticated
  using (auth.uid() = user_id);

-- ── CONSERVATION ─────────────────────────────────────────────────────────────────────────────
-- Durées proposées (à valider par le responsable du traitement, voir
-- docs/audits/2026-11-09-fut94-retour-utilite.md, « Confidentialité ») :
--   · le COMMENTAIRE libre, la donnée la plus personnelle, est effacé (avec sa date) 12 mois après
--     son envoi ; la réponse reste ;
--   · la RÉPONSE est supprimée 24 mois après son dernier envoi.
-- Avant ces délais : suppression du compte ou du bien (cascades), ou demande de la personne
-- (requête 5 de supabase/maintenance/fut94-retours-utilite.sql).
--
-- POURQUOI SUPPRIMER PLUTÔT QU'ANONYMISER. Une ligne sans `user_id` resterait rattachée à un
-- dossier d'adresse (`scope_key`, `address_dossier_id`), donc à son propriétaire : ce serait une
-- pseudonymisation, pas une anonymisation. Ce qui se garde sans limite, ce sont les DÉCOMPTES
-- agrégés (requêtes 2 à 4), qui ne désignent personne.
--
-- IDEMPOTENTE, OBSERVABLE (elle rend ce qu'elle a fait), réservée au service role. NON PLANIFIÉE ICI
-- (patron de la migration 38). Configuration proposée, à appliquer à la main après revue :
--   select cron.schedule('purge-retours-utilite', '23 3 * * *',
--     $$select * from public.purger_retours_utilite()$$);
create or replace function public.purger_retours_utilite(
  p_delai_commentaire interval default interval '12 months',
  p_delai_reponse     interval default interval '24 months'
)
returns table (commentaires_effaces integer, retours_supprimes integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  c integer;
  r integer;
begin
  if p_delai_commentaire < interval '1 day' or p_delai_reponse < p_delai_commentaire then
    raise exception 'Délais incohérents : commentaire %, réponse %', p_delai_commentaire, p_delai_reponse;
  end if;
  update public.dossier_utility_feedback
     set comment = null, commented_at = null
   where comment is not null and commented_at < now() - p_delai_commentaire;
  get diagnostics c = row_count;
  delete from public.dossier_utility_feedback
   where updated_at < now() - p_delai_reponse;
  get diagnostics r = row_count;
  return query select c, r;
end;
$$;

revoke all on function public.purger_retours_utilite(interval, interval) from public, anon, authenticated;
grant execute on function public.purger_retours_utilite(interval, interval) to service_role;

commit;
