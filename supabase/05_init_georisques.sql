begin;

insert into public.source_datasets (
  id,
  source_name,
  producer,
  dataset_name,
  dataset_version,
  source_url,
  license,
  update_frequency,
  geographic_granularity,
  notes
)
values
  (
    'georisques_commune_risks',
    'Géorisques',
    'Ministère / BRGM / Géorisques',
    'Risques officiels par commune',
    'v1',
    'https://georisques.gouv.fr/',
    'Licence publique / Etalab selon endpoint',
    'variable selon publication source',
    'commune',
    'Socle P1 pour Quartier, Logement et Projets. Permet de relier la projection climatique aux risques réglementaires et territoriaux déjà recensés.'
  ),
  (
    'georisques_seismic_zoning',
    'Géorisques',
    'Ministère / BRGM / Géorisques',
    'Zonage sismique par commune',
    'v1',
    'https://georisques.gouv.fr/',
    'Licence publique / Etalab selon endpoint',
    'variable selon publication source',
    'commune',
    'Complément officiel de lecture territoriale pour le module Quartier.'
  )
on conflict (id) do update
set
  source_name = excluded.source_name,
  producer = excluded.producer,
  dataset_name = excluded.dataset_name,
  dataset_version = excluded.dataset_version,
  source_url = excluded.source_url,
  license = excluded.license,
  update_frequency = excluded.update_frequency,
  geographic_granularity = excluded.geographic_granularity,
  notes = excluded.notes,
  is_active = true,
  updated_at = now();

insert into public.indicator_definitions (
  code,
  label,
  description,
  unit,
  theme,
  source_dataset_id,
  value_kind,
  metadata
)
values
  (
    'GEO_FLOOD',
    'Risque inondation',
    'Signal communal officiel de risque inondation selon Géorisques / GASPAR.',
    'bool',
    'risques',
    'georisques_commune_risks',
    'boolean',
    jsonb_build_object('family', 'georisques', 'risk', 'flood')
  ),
  (
    'GEO_MARINE_SUBMERSION',
    'Risque submersion marine',
    'Signal communal officiel de submersion marine selon Géorisques / GASPAR.',
    'bool',
    'risques',
    'georisques_commune_risks',
    'boolean',
    jsonb_build_object('family', 'georisques', 'risk', 'marine_submersion')
  ),
  (
    'GEO_LANDSLIDE',
    'Risque mouvement de terrain',
    'Signal communal officiel de mouvement de terrain selon Géorisques / GASPAR.',
    'bool',
    'risques',
    'georisques_commune_risks',
    'boolean',
    jsonb_build_object('family', 'georisques', 'risk', 'landslide')
  ),
  (
    'GEO_CLAY',
    'Risque argiles / tassements différentiels',
    'Signal communal officiel de retrait-gonflement argiles ou tassements différentiels selon Géorisques.',
    'bool',
    'risques',
    'georisques_commune_risks',
    'boolean',
    jsonb_build_object('family', 'georisques', 'risk', 'clay')
  ),
  (
    'GEO_STORM',
    'Risque tempête',
    'Signal communal officiel de tempête et grains selon Géorisques / GASPAR.',
    'bool',
    'risques',
    'georisques_commune_risks',
    'boolean',
    jsonb_build_object('family', 'georisques', 'risk', 'storm')
  ),
  (
    'GEO_SEISMIC_ZONE',
    'Zone sismique',
    'Code de zonage sismique communal selon Géorisques.',
    'code',
    'risques',
    'georisques_seismic_zoning',
    'text',
    jsonb_build_object('family', 'georisques', 'risk', 'seismic')
  )
on conflict (code) do update
set
  label = excluded.label,
  description = excluded.description,
  unit = excluded.unit,
  theme = excluded.theme,
  source_dataset_id = excluded.source_dataset_id,
  value_kind = excluded.value_kind,
  metadata = excluded.metadata,
  is_active = true,
  updated_at = now();

commit;

-- Base prête pour un futur import massif dans public.commune_indicators.
-- Exemple :
-- ('17300', 'La Rochelle', 'GEO_MARINE_SUBMERSION', 'georisques_commune_risks', null, null, 1, null, 'bool', 'gaspar/risques', 'commune', 'official_commune_risk', 'high', '{"risk_label":"Par submersion marine"}')
