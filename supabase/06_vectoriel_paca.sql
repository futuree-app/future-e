-- futur•e
-- Migration 06 : communes PACA à risque vectoriel documenté
--
-- Source : Santé publique France / ARS Paca
-- "Chikungunya, dengue, Zika – West-Nile : bilan 2025"
-- Bulletin régional Paca, publié 4 mai 2026
--
-- Seuil de déclenchement de la tension 'risque_vectoriel_emergent' :
--   Commune dont le département est classé ≥ niveau 1 sur la carte de présence
--   d'Aedes albopictus publiée chaque année par la DGS (source : SI-LAV).
--   Au 1er janvier 2025 : 98 % de la population PACA habitait dans une commune
--   colonisée (vs ~50 % pour l'hexagone).
--   Tous les départements PACA sont colonisés : 04, 05, 06, 13, 83, 84.
--
-- Communes présentes dans ce fichier :
--   - Communes avec transmission autochtone documentée en 2025 (chikungunya,
--     dengue ou virus West-Nile) — données Voozarbo / ARS Paca / SPF.
--   - Toutes reçoivent la catégorie 'colonise_albopictus'.
--
-- Cas autochtones 2025 en PACA :
--   Chikungunya : 35 épisodes · 456 cas (60 % des cas hexagonaux)
--   Dengue : 3 épisodes · 16 cas
--   West-Nile : 30 cas humains (50 % des cas hexagonaux) · 37 % formes neuroinvasives · 1 décès
--
-- Màj annuelle : relancer ce script chaque printemps après publication de la carte
-- DGS SI-LAV et du bulletin annuel SPF Paca.

begin;

-- ─── Communes avec transmission autochtone confirmée en 2025 ──────────────────
-- Format des catégories : colonise_albopictus en premier, puis catégories
-- géographiques/thématiques standard. Les catégories sont mergées (pas
-- remplacées) grâce au ON CONFLICT ci-dessous.

insert into public.communes_categorization (commune_name, insee_code, categories)
values

  -- ── Alpes-Maritimes (06) — 9 épisodes chikungunya · 170 cas ──────────────
  -- Antibes : épisode hors norme · 144 cas · 11 zones de circulation · >4 mois
  ('Antibes',             '06004', array['colonise_albopictus', 'littoral_mediterranee', 'mediterranee', 'tourisme_urbain']),
  -- Nice : 22 cas chikungunya
  ('Nice',                '06088', array['colonise_albopictus', 'littoral_mediterranee', 'mediterranee', 'tourisme_urbain', 'urbain_dense_sud']),
  -- Cagnes-sur-Mer : 14 cas chikungunya
  ('Cagnes-sur-Mer',      '06027', array['colonise_albopictus', 'littoral_mediterranee', 'mediterranee']),
  -- La Gaude : 14 cas chikungunya
  ('La Gaude',            '06078', array['colonise_albopictus', 'mediterranee', 'rural_peri_urbain']),
  -- Saint-Jeannet : 4 cas chikungunya
  ('Saint-Jeannet',       '06113', array['colonise_albopictus', 'mediterranee', 'rural_peri_urbain']),
  -- Vallauris : 4 cas chikungunya
  ('Vallauris',           '06155', array['colonise_albopictus', 'littoral_mediterranee', 'mediterranee']),
  -- Villeneuve-Loubet : 3 cas chikungunya
  ('Villeneuve-Loubet',   '06161', array['colonise_albopictus', 'littoral_mediterranee', 'mediterranee']),
  -- Saint-Laurent-du-Var : 2 cas chikungunya
  ('Saint-Laurent-du-Var','06123', array['colonise_albopictus', 'littoral_mediterranee', 'mediterranee']),
  -- Auribeau-sur-Siagne : 1 cas chikungunya
  ('Auribeau-sur-Siagne', '06008', array['colonise_albopictus', 'mediterranee', 'rural_peri_urbain']),

  -- ── Var (83) — 12 épisodes chikungunya · 129 cas + West-Nile ─────────────
  -- Fréjus : 84 cas chikungunya · 9 traitements LAV · 8 km adulticide
  ('Fréjus',              '83061', array['colonise_albopictus', 'littoral_mediterranee', 'mediterranee', 'tourisme_urbain']),
  -- La Croix-Valmer : 20 cas chikungunya
  ('La Croix-Valmer',     '83042', array['colonise_albopictus', 'littoral_mediterranee', 'mediterranee']),
  -- Ollioules : 8 cas chikungunya (épisode secondaire depuis Grosseto-Prugna, Corse)
  ('Ollioules',           '83090', array['colonise_albopictus', 'mediterranee']),
  -- Trans-en-Provence : 5 cas chikungunya
  ('Trans-en-Provence',   '83143', array['colonise_albopictus', 'mediterranee', 'rural_peri_urbain']),
  -- Hyères : foyer principal West-Nile dans le Var (9 cas dept, principalement ici)
  ('Hyères',              '83069', array['colonise_albopictus', 'littoral_mediterranee', 'mediterranee']),
  -- Toulon : 1 cas chikungunya · grande ville de référence dept 83
  ('Toulon',              '83137', array['colonise_albopictus', 'littoral_mediterranee', 'mediterranee', 'urbain_dense_sud']),
  -- Saint-Raphaël : 1 cas chikungunya
  ('Saint-Raphaël',       '83118', array['colonise_albopictus', 'littoral_mediterranee', 'mediterranee', 'tourisme_urbain']),
  -- Sanary-sur-Mer : 1 cas dengue
  ('Sanary-sur-Mer',      '83117', array['colonise_albopictus', 'littoral_mediterranee', 'mediterranee']),
  -- Roquebrune-sur-Argens : 1 cas chikungunya
  ('Roquebrune-sur-Argens','83107',array['colonise_albopictus', 'mediterranee', 'rural_peri_urbain']),
  -- Six-Fours-les-Plages : 2 cas chikungunya
  ('Six-Fours-les-Plages','83126', array['colonise_albopictus', 'littoral_mediterranee', 'mediterranee']),
  -- La Crau : 2 cas chikungunya
  ('La Crau',             '83048', array['colonise_albopictus', 'mediterranee', 'rural_peri_urbain']),
  -- Bauduen : 3 cas chikungunya (commune rurale du Verdon)
  ('Bauduen',             '83014', array['colonise_albopictus', 'mediterranee', 'rural_peri_urbain', 'rural_lacs']),

  -- ── Bouches-du-Rhône (13) — 11 épisodes chikungunya · 108 cas + dengue ───
  -- Vitrolles : 47 cas chikungunya
  ('Vitrolles',           '13117', array['colonise_albopictus', 'mediterranee', 'periurbain_dependance_auto']),
  -- Roquevaire : 18 cas chikungunya
  ('Roquevaire',          '13083', array['colonise_albopictus', 'mediterranee', 'rural_peri_urbain']),
  -- Les Pennes-Mirabeau : 14 cas chikungunya
  ('Les Pennes-Mirabeau', '13071', array['colonise_albopictus', 'mediterranee', 'periurbain_dependance_auto']),
  -- Salon-de-Provence : 12 cas chikungunya (communication de crise activée)
  ('Salon-de-Provence',   '13103', array['colonise_albopictus', 'mediterranee', 'periurbain_dependance_auto']),
  -- Marseille : 4 cas chikungunya (8e + 4e arr.) — déjà dans communes_categorization
  ('Marseille',           '13055', array['colonise_albopictus', 'urbain_dense_sud', 'littoral_mediterranee', 'mediterranee', 'tourisme_urbain']),
  -- Rognac : 10 cas dengue (sérotype DENV-1)
  ('Rognac',              '13082', array['colonise_albopictus', 'mediterranee', 'periurbain_dependance_auto']),
  -- Sausset-les-Pins : 6 cas chikungunya (épisode secondaire depuis Castries, Occitanie)
  ('Sausset-les-Pins',    '13104', array['colonise_albopictus', 'littoral_mediterranee', 'mediterranee']),
  -- Aubagne : 5 cas dengue
  ('Aubagne',             '13005', array['colonise_albopictus', 'mediterranee', 'periurbain_dependance_auto']),
  -- Aix-en-Provence : 1 cas chikungunya · grande ville de référence
  ('Aix-en-Provence',     '13001', array['colonise_albopictus', 'mediterranee', 'urbain_dense_sud']),
  -- Martigues : 1 cas chikungunya
  ('Martigues',           '13056', array['colonise_albopictus', 'littoral_mediterranee', 'mediterranee']),
  -- Gémenos : 1 cas chikungunya
  ('Gémenos',             '13043', array['colonise_albopictus', 'mediterranee', 'rural_peri_urbain']),
  -- Lambesc : 1 cas chikungunya
  ('Lambesc',             '13050', array['colonise_albopictus', 'mediterranee', 'rural_agricole']),
  -- Ceyreste : 1 cas chikungunya
  ('Ceyreste',            '13025', array['colonise_albopictus', 'littoral_mediterranee', 'mediterranee']),

  -- ── Vaucluse (84) — 2 épisodes chikungunya + 3 cas West-Nile ────────────
  -- Richerenches : 11 cas chikungunya (épisode secondaire depuis Dijon)
  -- Note : la transmission a atteint le Vaucluse depuis Bourgogne-Franche-Comté
  -- illustrant la diffusion inter-régionale via cas autochtones
  ('Richerenches',        '84099', array['colonise_albopictus', 'mediterranee', 'rural_agricole', 'rural_viticole']),
  -- Valréas : 2 cas chikungunya
  ('Valréas',             '84137', array['colonise_albopictus', 'mediterranee', 'rural_agricole'])

on conflict (commune_name) do update
set
  insee_code = excluded.insee_code,
  -- merge des catégories sans doublon : union des deux tableaux
  categories = (
    select array_agg(distinct cat order by cat)
    from unnest(
      array_cat(communes_categorization.categories, excluded.categories)
    ) as cat
  );

commit;

-- Vérifications rapides :
-- select commune_name, insee_code, categories from communes_categorization
--   where 'colonise_albopictus' = any(categories) order by commune_name;
-- select count(*) from communes_categorization where 'colonise_albopictus' = any(categories);
