-- futur•e
-- Etape 6 du plan: tables de base pour les tensions et les communes.
-- A lancer dans Supabase > SQL Editor.

begin;

create table if not exists public.tensions_catalog (
  id text primary key,
  label_template text not null,
  subtitle text not null,
  categories text[] not null default '{}',
  priority integer not null default 3,
  color text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.commune_categories (
  id text primary key,
  label text not null,
  description text
);

create table if not exists public.communes_categorization (
  commune_name text primary key,
  insee_code text,
  categories text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists tensions_catalog_categories_gin
  on public.tensions_catalog using gin (categories);

create index if not exists communes_categorization_categories_gin
  on public.communes_categorization using gin (categories);

insert into public.commune_categories (id, label, description)
values
  ('all', 'Générique', 'Catégorie de fallback applicable partout.'),
  ('littoral', 'Littoral', 'Commune littorale exposée aux enjeux côtiers.'),
  ('littoral_atlantique', 'Littoral atlantique', 'Commune située sur la façade atlantique.'),
  ('littoral_mediterranee', 'Littoral méditerranéen', 'Commune située sur la façade méditerranéenne.'),
  ('littoral_manche', 'Littoral Manche', 'Commune littorale au nord-ouest.'),
  ('montagne', 'Montagne', 'Commune de montagne, sports d’hiver et enneigement.'),
  ('mediterranee', 'Méditerranée', 'Climat méditerranéen, chaleur et feux plus fréquents.'),
  ('urbain_dense_sud', 'Urbain dense sud', 'Grande ville du sud avec effet d’îlot de chaleur.'),
  ('urbain_dense_nord', 'Urbain dense nord', 'Grande ville du nord ou de l’ouest.'),
  ('tourisme_urbain', 'Tourisme urbain', 'Territoire urbain avec forte activité touristique.'),
  ('rural_peri_urbain', 'Rural / périurbain', 'Territoire dépendant de la voiture et des ressources locales.'),
  ('periurbain_dependance_auto', 'Périurbain dépendance auto', 'Zone où la mobilité automobile structure la vie quotidienne.'),
  ('rural_agricole', 'Rural agricole', 'Territoire avec forte activité agricole.'),
  ('rural_forestier', 'Rural forestier', 'Territoire exposé aux feux et aux contraintes d’accès.'),
  ('rural_lacs', 'Rural avec lacs / baignade', 'Territoire où les usages de baignade intérieure comptent.'),
  ('rural_viticole', 'Rural viticole', 'Territoire dépendant de la vigne et des AOC.'),
  ('tension_hydrique_connue', 'Tension hydrique connue', 'Zone déjà concernée par des tensions sur l’eau.'),
  ('vallee_industrielle', 'Vallée industrielle', 'Territoire à enjeux air / pollution / industrie.'),
  ('bonne_couverture_irve', 'Bonne couverture IRVE', 'Territoire où la recharge publique est plutôt présente.'),
  ('sud_ouest', 'Sud-Ouest', 'Catégorie régionale utile pour certaines lectures produit.')
on conflict (id) do update
set
  label = excluded.label,
  description = excluded.description;

insert into public.tensions_catalog (
  id,
  label_template,
  subtitle,
  categories,
  priority,
  color
)
values
  ('acheter_littoral', 'Acheter à {commune} ?', 'Risque côtier, valeur à 20 ans', array['littoral'], 1, '#60a5fa'),
  ('acheter_canicule', 'Acheter à {commune} ?', 'Chaleur extrême, valeur à 20 ans', array['urbain_dense_sud', 'mediterranee'], 1, '#f87171'),
  ('acheter_rural', 'S''installer à {commune} ?', 'Qualité de vie, ressources, valeur', array['rural_peri_urbain'], 1, '#4ade80'),
  ('acheter_urbain', 'Acheter à {commune} ?', 'Climat urbain, valeur à 20 ans', array['urbain_dense_nord'], 1, '#60a5fa'),
  ('acheter_montagne', 'Acheter en altitude à {commune} ?', 'Neige, saisons, attractivité', array['montagne'], 1, '#60a5fa'),
  ('surfer_ici', 'Surfer à {commune} dans 20 ans ?', 'Saisons, qualité de l''eau, tempêtes', array['littoral_atlantique'], 2, '#60a5fa'),
  ('baignade_ici', 'Se baigner à {commune} l''été ?', 'Plages, rivières, qualité sanitaire', array['littoral_mediterranee', 'rural_lacs'], 2, '#60a5fa'),
  ('ski_ici', 'Skier à {commune} dans 20 ans ?', 'Enneigement, stations, saisons', array['montagne'], 2, '#60a5fa'),
  ('randonner_ici', 'Randonner autour de {commune} ?', 'Feux de forêt, chaleur, accès', array['mediterranee', 'rural_forestier'], 3, '#4ade80'),
  ('metier_exterieur', 'Mon métier en extérieur va-t-il tenir ?', 'BTP, agriculture, voirie', array['all'], 2, '#fb923c'),
  ('metier_tourisme', 'Mon métier du tourisme va-t-il tenir ?', 'Hôtellerie, restauration', array['littoral', 'montagne', 'tourisme_urbain'], 2, '#fb923c'),
  ('metier_general', 'Mon métier est-il menacé par le climat ?', 'Secteur, structure, évolutions', array['all'], 3, '#fb923c'),
  ('metier_agricole', 'L''agriculture locale va-t-elle survivre ?', 'Filières, eau, rendements', array['rural_agricole'], 2, '#4ade80'),
  ('enfants_chaleur', 'Élever mes enfants ici face à la chaleur ?', 'École, air, canicule', array['urbain_dense_sud', 'mediterranee'], 2, '#f87171'),
  ('enfants_sante', 'Élever mes enfants à {commune} ?', 'Air, cadmium, école, chaleur', array['all'], 2, '#f87171'),
  ('enfants_littoral', 'Élever mes enfants face au littoral ?', 'Submersion, érosion, école', array['littoral'], 2, '#f87171'),
  ('eau_potable', 'L''eau du robinet va-t-elle rester bonne ?', 'Ressource, qualité, restrictions', array['rural_agricole', 'tension_hydrique_connue'], 2, '#60a5fa'),
  ('canicule_vivable', 'Vivre les étés à {commune} dans 20 ans ?', 'Chaleur, nuits tropicales, santé', array['urbain_dense_sud', 'mediterranee'], 2, '#f87171'),
  ('air_urbain', 'Qualité de l''air à {commune} dans 20 ans ?', 'Ozone, particules, santé respiratoire', array['urbain_dense_sud', 'vallee_industrielle'], 3, '#f87171'),
  ('retraite_ici', 'Ma retraite à {commune} est-elle viable ?', 'Santé, climat, coût de la vie', array['all'], 3, '#a78bfa'),
  ('demenager_vers', 'Partir vers le Nord ou rester à {commune} ?', 'Comparer les climats futurs', array['urbain_dense_sud', 'mediterranee'], 3, '#a78bfa'),
  ('valeur_immo', 'Mon logement va-t-il perdre de la valeur ?', 'DPE, risques, assurance', array['all'], 2, '#fb923c'),
  ('vignobles', 'Mon vignoble va-t-il tenir à {commune} ?', 'Cépages, rendements, AOC', array['rural_viticole'], 2, '#4ade80'),
  ('feux', 'Les feux vont-ils atteindre {commune} ?', 'Risque, évolution, protection', array['mediterranee', 'rural_forestier'], 2, '#f87171'),
  ('mobilite_fragile', 'Mon mode de vie à {commune} repose-t-il trop sur la voiture ?', 'Dépendance auto, coût carburant, alternatives', array['rural_peri_urbain', 'periurbain_dependance_auto'], 1, '#fb923c'),
  ('voiture_electrique', 'Passer à l''électrique a-t-il du sens à {commune} ?', 'Recharge, trajets, coût, usage réel', array['periurbain_dependance_auto', 'bonne_couverture_irve'], 2, '#fb923c')
on conflict (id) do update
set
  label_template = excluded.label_template,
  subtitle = excluded.subtitle,
  categories = excluded.categories,
  priority = excluded.priority,
  color = excluded.color,
  is_active = true;

insert into public.communes_categorization (
  commune_name,
  insee_code,
  categories
)
values
  ('La Rochelle', '17300', array['littoral', 'littoral_atlantique', 'tension_hydrique_connue']),
  ('Chamonix', '74056', array['montagne']),
  ('Bordeaux', '33063', array['urbain_dense_sud', 'sud_ouest', 'periurbain_dependance_auto']),
  ('Rodez', '12202', array['rural_peri_urbain', 'rural_agricole']),
  ('Marseille', '13055', array['urbain_dense_sud', 'littoral_mediterranee', 'mediterranee', 'tourisme_urbain']),
  ('Nantes', '44109', array['urbain_dense_nord']),
  ('Lyon', '69123', array['urbain_dense_nord', 'vallee_industrielle']),
  ('Brest', '29019', array['littoral', 'littoral_manche', 'urbain_dense_nord']),
  ('Toulouse', '31555', array['urbain_dense_sud', 'periurbain_dependance_auto']),
  ('Nice', '06088', array['littoral_mediterranee', 'mediterranee', 'tourisme_urbain'])
on conflict (commune_name) do update
set
  insee_code = excluded.insee_code,
  categories = excluded.categories;

commit;

-- Vérifications rapides après exécution :
-- select count(*) from public.tensions_catalog;
-- select count(*) from public.commune_categories;
-- select count(*) from public.communes_categorization;
