-- futur•e
-- Etape 9 du plan: brancher le module Q&R sur Supabase.
-- A lancer dans Supabase > SQL Editor après 01_init_catalog.sql.

begin;

create table if not exists public.tension_answers (
  tension_id text primary key references public.tensions_catalog (id) on delete cascade,
  verdict text not null,
  detail text not null,
  cta_label text not null,
  cta_href text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.tension_answers (
  tension_id,
  verdict,
  detail,
  cta_label,
  cta_href
)
values
  ('acheter_littoral', 'À acheter avec les yeux ouverts.', 'La Rochelle présente un risque de submersion en hausse de +31 % en scénario médian 2050 (DRIAS, Géorisques). Les Minimes et Aytré sont en zone PPRi modérée à élevée. Les coûts d''assurance habitation progressent de 8 à 12 % par an sur le littoral charentais (ACPR 2024). L''achat reste viable à condition de choisir le bon quartier, d''étudier la DPE et l''assurabilité future.', 'Voir le rapport complet sur La Rochelle', '#'),
  ('enfants_sante', 'Trois signaux méritent votre attention.', 'Les sols charentais sont naturellement chargés en cadmium (GisSol/RMQS). L''ANSES a alerté en mars 2026 qu''un Français sur deux est surexposé par son alimentation, dont 36 % des enfants de moins de 3 ans. La saison pollinique s''est allongée de 28 jours en Nouvelle-Aquitaine (RNSA/Copernicus). Les jours de canicule projetés à La Rochelle passent de 5 à 34 par an en 2050 en scénario médian (DRIAS). Rien d''irrémédiable, mais autant le savoir tôt.', 'Voir le module Santé de votre rapport', '#'),
  ('mobilite_fragile', 'Bressuire est un territoire où la voiture n''est pas un choix.', '84 % des actifs résidant dans des communes rurales similaires utilisent la voiture pour aller travailler (INSEE/Ecolab). Les flux domicile-travail sortants dépassent souvent 50 %. L''offre de transport collectif reste limitée et les bornes de recharge publique insuffisantes pour une transition fluide. Cette structure expose directement les budgets des foyers à la volatilité du prix des carburants.', 'Voir le module Mobilité de votre rapport', '#'),
  ('metier_general', 'Ça dépend du secteur. Certains gagnent, d''autres perdent.', 'Le secteur associatif et de l''ESS sera relativement peu exposé aux risques physiques directs, mais fortement affecté par l''évolution des financements et des priorités. Les métiers liés à l''adaptation climatique (bilan carbone, transition énergétique) sont en forte croissance. Les secteurs à exposition extérieure (BTP, agriculture) sont les plus vulnérables à la chaleur croissante (INRS).', 'Voir le module Métier de votre rapport', '#'),
  ('valeur_immo', 'Moins risqué que ce qu''on raconte, mais pas sans condition.', 'Les zones exposées aux risques documentés (PPRi, RGA, submersion) voient déjà leurs prix stagner ou baisser par rapport à des zones similaires sans risque (DVF 2024). Le DPE devient un facteur de valeur majeur : un logement F ou G se négocie en moyenne 6 à 15 % moins cher que son équivalent C (ADEME). À l''horizon 2030, les obligations de rénovation énergétique rendront certains biens quasi invendables sans travaux.', 'Voir le module Logement de votre rapport', '#'),
  ('default', 'Les données pour cette commune pointent plusieurs signaux.', 'Un rapport complet croise les données climatiques, sanitaires, immobilières et professionnelles pour votre commune et votre profil spécifique. Ce que futur•e fait, c''est transformer ces données publiques en lecture lisible et personnalisée, pour que vous puissiez décider, pas seulement vous inquiéter.', 'Générer votre rapport complet', '#')
on conflict (tension_id) do update
set
  verdict = excluded.verdict,
  detail = excluded.detail,
  cta_label = excluded.cta_label,
  cta_href = excluded.cta_href,
  is_active = true,
  updated_at = now();

alter table public.tension_answers enable row level security;

drop policy if exists "public read tension_answers" on public.tension_answers;
create policy "public read tension_answers"
on public.tension_answers
for select
to anon, authenticated
using (is_active = true);

commit;

-- Vérifications rapides après exécution :
-- select count(*) from public.tension_answers;
-- select * from public.tension_answers order by tension_id;
