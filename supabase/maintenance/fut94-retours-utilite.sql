-- ════════════════════════════════════════════════════════════════════════════════════════════
-- FUT-94 · CONSULTER LES RETOURS D'UTILITÉ. LECTURE SEULE, à coller dans Supabase > SQL Editor.
--
-- Le SQL Editor tourne avec les droits du propriétaire de la base : c'est le seul endroit d'où les
-- retours de TOUS les comptes se lisent. Aucune route HTTP ne les expose, et le rôle `authenticated`
-- ne lit que ses propres lignes (migration 39).
--
-- LES COMMENTAIRES SONT PRIVÉS. Ils servent à comprendre ce qui manque au dossier. Ils ne se citent
-- pas, ne se publient pas et ne se transforment pas en témoignage sans un consentement distinct,
-- demandé à la personne pour cet usage précis. Ne pas les copier dans un outil tiers.
--
-- « Pas vraiment » et « Pas encore lu » ne se fusionnent jamais : le premier dit que le dossier lu
-- n'a rien appris, le second qu'il n'a pas encore été lu. Un taux d'utilité se calcule sur les
-- dossiers LUS (oui + pas vraiment), et le nombre de « pas encore lu » se donne à côté.
-- ════════════════════════════════════════════════════════════════════════════════════════════

-- 1. Les retours, les plus récents d'abord. Le compte apparaît par son identifiant, pas par son
--    e-mail : le rejoindre à auth.users seulement si une réponse doit être faite à la personne.
select
  f.updated_at,
  f.answer,
  f.comment,
  f.commented_at,
  f.insee_code,
  f.scope_key,
  f.artifact_version,
  f.presentation,
  f.created_at        as premiere_reponse_le,
  f.user_id
from public.dossier_utility_feedback f
order by f.updated_at desc
limit 200;

-- 2. Le décompte par réponse, sur 30 jours glissants (modifier l'intervalle au besoin).
select
  f.answer,
  count(*)                                   as retours,
  count(f.comment)                           as avec_commentaire
from public.dossier_utility_feedback f
where f.updated_at >= now() - interval '30 days'
group by f.answer
order by f.answer;

-- 3. Le taux d'utilité sur les dossiers lus, et les « pas encore lu » à côté, par semaine.
select
  date_trunc('week', f.updated_at)::date                                   as semaine,
  count(*) filter (where f.answer = 'oui')                                  as oui,
  count(*) filter (where f.answer = 'pas_vraiment')                         as pas_vraiment,
  count(*) filter (where f.answer = 'pas_encore_lu')                        as pas_encore_lu,
  round(100.0 * count(*) filter (where f.answer = 'oui')
        / nullif(count(*) filter (where f.answer in ('oui', 'pas_vraiment')), 0), 1)
                                                                            as pct_utile_parmi_lus
from public.dossier_utility_feedback f
group by 1
order by 1 desc;

-- 4. Commune seule ou adresse : la lecture d'une adresse apprend-elle davantage ?
select
  case when f.scope_key = 'commune' then 'commune' else 'adresse' end as portee,
  f.answer,
  count(*) as retours
from public.dossier_utility_feedback f
group by 1, 2
order by 1, 2;
