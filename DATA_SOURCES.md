# Sources de données — futur·e

Toutes les sources de données externes intégrées dans l'application, par module.

---

## Architecture générale

Les données externes sont consommées côté serveur uniquement (`"use server"` / `import "server-only"`). Chaque source a sa propre lib dans `src/lib/` et une ou plusieurs API routes dans `src/app/api/`. Le cache HTTP est géré par `next: { revalidate }` sur chaque `fetch`.

---

## Module Quartier

### DRIAS — Projections climatiques
- **Source :** Données pré-agrégées depuis les modèles DRIAS (médiane 17 modèles)
- **Format :** Fichier JSON statique `public/data_climat.json`, généré offline
- **Lib :** `src/lib/drias-json.ts`
- **Route :** `GET /api/climat/[insee]`
- **Données :** 28 indicateurs (chaleur, précipitations, sécheresse, gel) sur 3 scénarios (GWL+1.5°C / +2°C / +3°C)
- **Cache :** Statique (build)

### Géorisques — Risques naturels et technologiques
- **Source :** API Géorisques v1 (GASPAR) + v2 (point/parcelle)
- **URL :** `https://georisques.gouv.fr/api/v1/`
- **Lib :** `src/lib/georisques.ts`
- **Route :** `GET /api/georisques-logement`
- **Données :** Inondation, submersion marine, mouvement de terrain, argile, sismicité, PPRN, RGA (retrait-gonflement argiles)
- **Auth :** `GEORISQUES_API_TOKEN` (optionnel — active la lecture v2 au point géocodé et par parcelle)
- **Cache :** `s-maxage=3600`

---

## Module Logement

### ADEME DPE — Diagnostic de Performance Énergétique
- **Source :** API Data Fair ADEME
- **Datasets :**
  - `dpe03existant` — Logements existants depuis juillet 2021
  - `dpe02neuf` — Logements neufs depuis juillet 2021 (fallback)
  - `dpe01tertiaire` — Bâtiments tertiaires (disponible via `DS.tertiaire`)
- **URL :** `https://data.ademe.fr/data-fair/api/v1/datasets/{id}`
- **Lib :** `src/lib/dpe.ts`
- **Routes :**
  - `GET /api/dpe/[insee]` — Distribution A→G + % passoires pour une commune
  - `GET /api/georisques-logement` — DPE précis par adresse (BAN id ou coordonnées)
- **Fonctions exposées :**
  - `getDpeByBanId(banId)` — Lookup par identifiant BAN (priorité)
  - `getDpeByCoordinates(lat, lon, radiusM=50)` — Bbox ±50m + tri distance
  - `getDpeSummaryForCommune(insee)` — Agrégation via `values_agg` (1 appel léger)
- **Champs clés :** `numero_dpe`, `identifiant_ban`, `etiquette_dpe`, `etiquette_ges`, `conso_5_usages_par_m2_ep`, `emission_ges_5_usages_par_m2`, `surface_habitable_logement`, `annee_construction`, `type_batiment`
- **Note technique :** Le filtrage utilise `qs=field:"value"` (Elasticsearch query string). Le filtre direct `field=value` en query param ne fonctionne pas.
- **Cache :** `s-maxage=86400` (DPE change peu souvent)

### API Carto — Cadastre
- **Source :** API Carto (IGN / Etalab)
- **URL :** `https://apicarto.ign.fr/api/cadastre/`
- **Lib :** `src/lib/cadastre.ts`
- **Route :** via `GET /api/georisques-logement`
- **Données :** Parcelle cadastrale (code, surface, géométrie) depuis coordonnées GPS

### BAN — Base Adresse Nationale
- **Source :** API BAN (data.gouv.fr)
- **URL :** `https://api-adresse.data.gouv.fr/`
- **Lib :** `src/lib/ban.ts`
- **Données :** Géocodage adresse → coordonnées + `identifiant_ban` (id BAN de l'adresse)

### ADEME — Données communales et IRIS
- **Source :** API Data Fair ADEME
- **Datasets :**
  - `8ggfo546-mtjxy4lbqxcl462` — `data_communes`
  - `jixoufr9qp0gko9xcqyzbr4a` — `data_iris`
- **Lib :** `src/lib/commune-data.ts`
- **Routes :**
  - `GET /api/commune-data?insee=XXXXX`
  - intégré dans `GET /api/georisques-logement`
- **Données :**
  - niveau commune : vacance, logements sociaux, revenu médian, pollution de fond, densité, accès aux services
  - niveau IRIS agrégé : passoires thermiques, précarité énergétique, propriété/location, HLM, suroccupation, motorisation
- **Méthode :**
  - lookup `data_communes` par code INSEE
  - récupération du nom de commune
  - filtrage `data_iris` par `_contours_iris.nom_com:"Nom de commune"`
- **Limite connue :** l’agrégation IRIS repose sur le nom de commune ADEME, pas sur un identifiant IRIS communal strict
- **Cache :** `s-maxage=86400`, `stale-while-revalidate=604800`

---

## Module Santé

### ATMO France — Qualité de l'air
- **Source :** API ATMO France (admindata.atmo-france.org)
- **URL :** `https://admindata.atmo-france.org/api/`
- **Lib :** `src/lib/atmo.ts`
- **Route :** `GET /api/atmo/[insee]`
- **Données :** Indices ATMO journaliers et prévisions, polluants principaux (PM10, PM2.5, NO2, O3)
- **Auth :** `ATMO_USERNAME` + `ATMO_PASSWORD` (variables d'environnement)
- **Cache :** `s-maxage=3600`

### IREP — Registre des rejets et transferts de polluants industriels
- **Source :** API Data Fair ADEME
- **Dataset :** `data_risk_IREP` (ID : `085ipnlpj9awm78hikh1nakj`) — données Géorisques 2019
- **URL :** `https://data.ademe.fr/data-fair/api/v1/datasets/085ipnlpj9awm78hikh1nakj`
- **Lib :** `src/lib/irep.ts`
- **Route :** `GET /api/irep?lat=X&lon=Y&radius=5000`
- **Données :** Installations industrielles déclarantes avec coordonnées, nombre de polluants, milieu d'émission (air/eau/sol)
- **Méthode :** Bbox géographique ±radius → haversine côté serveur pour trier par distance réelle
- **Champs clés :** `nom_etablissement`, `latitude`, `longitude`, `nombre_polluants`, `milieu_emission`
- **Cache :** `s-maxage=86400`

---

## Module Mobilité

### ZFE — Zones à Faibles Émissions
- **Source :** API Data Fair ADEME (données transport.data.gouv.fr)
- **Dataset :** `data_pol_ZFE` (ID : `qljefeuzxpqx-98b60-a6n6d`) — 37 zones en France métropolitaine
- **URL :** `https://data.ademe.fr/data-fair/api/v1/datasets/qljefeuzxpqx-98b60-a6n6d`
- **Lib :** `src/lib/zfe.ts`
- **Routes :**
  - `GET /api/zfe?lat=X&lon=Y`
  - Intégrée dans `GET /api/georisques-logement`
- **Méthode :** Chargement unique des 37 zones (cache mémoire 24h) + point-in-polygon ray-casting sans dépendance externe. Gère `Polygon` et `MultiPolygon` GeoJSON.
- **Champs clés :** `vp_critair` (Crit'Air VP), `deux_rm_critair` (deux-roues), `vul_critair` (utilitaires), `vp_horaires`, `date_debut`, `date_fin`
- **Note :** Coordonnées GeoJSON en ordre [lon, lat]

---

## Données transverses (plusieurs modules)

### IGN Altimétrie
- **Source :** API IGN (Géoplateforme)
- **URL :** `https://data.geopf.fr/altimetrie/`
- **Lib :** `src/lib/ign.ts`
- **Route :** via `GET /api/georisques-logement`
- **Données :** Altitude NGF au point géocodé

### Hub'Eau / Eaufrance — Hydrologie
- **Source :** API Hub'Eau (Eaufrance)
- **URL :** `https://hubeau.eaufrance.fr/api/`
- **Lib :** `src/lib/eaufrance.ts`
- **Route :** via `GET /api/georisques-logement`
- **Données :** Stations hydrologiques, débits, qualité eau

---

### Audits énergétiques logement
- **Source :** API Data Fair ADEME
- **Dataset :** `audit-opendata` — 2,8M audits depuis sept. 2023
- **Lib :** `src/lib/audit.ts`
- **Route :** `GET /api/audit/[insee]?ban_id=X` + intégré dans `georisques-logement`
- **Fonctions :** `getAuditByBanId(banId)`, `getAuditByCoordinates(lat, lon)`
- **Données :** Scénarios de rénovation par étape (`categorie_scenario`, `etape_travaux`, `travaux_realises`), DPE actuel (`classe_bilan_dpe`), consommations EP + GES après travaux
- **Champs clés :** `n_audit`, `identifiant_ban`, `code_insee_ban`, `classe_bilan_dpe`, `categorie_scenario`, `ep_conso_5_usages`, `emission_ges_5_usages`

### DPE avant juillet 2021
- **Source :** API Data Fair ADEME
- **Dataset :** `dpe-france` — 10,7M DPE historiques
- **Lib :** `src/lib/dpe.ts` (fallback `DS.legacy` dans `getDpeByCoordinates`)
- **Champs différents du format post-2021 :** `classe_consommation_energie` (au lieu de `etiquette_dpe`), `latitude`/`longitude` (au lieu de `_geopoint`), pas de données per-m² disponibles
- **Note :** Pas d'`identifiant_ban` fiable dans ce format — lookup par bbox seulement

### Cartofriches — Sites potentiellement pollués / abandonnés
- **Source :** API Data Fair ADEME
- **Dataset :** `59gkmzgmbjypm6yjqzunjmto` — 28 373 sites
- **Lib :** `src/lib/cartofriches.ts`
- **Routes :** `GET /api/cartofriches?insee=X` ou `?lat=X&lon=Y&radius=3000` + intégré dans `georisques-logement`
- **Fonctions :** `getCartofrichesForCommune(insee)`, `getCartofrichesNearPoint(lat, lon, radiusM=3000)`
- **Données :** Type de friche, statut (avec projet/sans projet/reconvertie), pollution sol, pollution bâti, activité passée, zonage environnemental (Natura 2000, ZNIEFF)
- **Champs clés :** `site_nom`, `site_type`, `site_statut`, `comm_insee`, `sol_pollution_existe`, `sol_pollution_origine`, `bati_pollution`, `activite_libelle`, `zonage_enviro`

### RGE — Entreprises certifiées rénovation
- **Source :** API Data Fair ADEME
- **Dataset :** `liste-des-entreprises-rge-2` — 164 837 qualifications
- **Lib :** `src/lib/rge.ts`
- **Route :** `GET /api/rge?lat=X&lon=Y&radius=20000`
- **Fonction :** `getRgeNearPoint(lat, lon, radiusM=20000)`
- **Données :** Nom, adresse, contact, domaine (isolation/chauffage/global), qualification (Qualibat, Qualifelec…), validité
- **Note :** Pas d'INSEE commune — filtrage par bbox géographique uniquement

### Coûts travaux rénovation
- **Source :** API Data Fair ADEME
- **Datasets :** `isolation` (4 515 obs.), `chauffage` (3 014 obs.) — enquête 2017-2018
- **Lib :** `src/lib/renovation.ts`
- **Route :** `GET /api/renovation/[departement]`
- **Fonction :** `getRenovationCosts(departement)` — médiane, min, max par type de travaux
- **Données :** Coûts HT par poste isolation (combles, ITE, plancher bas…) et par générateur (PAC, chaudière, poêle…), filtrés par `Code_département`
- **Note importante :** Données 2017-2018, à titre indicatif uniquement — les coûts ont évolué depuis

---

## Datasets ADEME identifiés, non encore intégrés

| Dataset | ID | Module cible | Notes |
|---|---|---|---|
| Logements par commune | `logement` | Quartier / Projets | Parc par commune : type, taille, occupation, équipements, ancienneté — **404 sur l'API ADEME, accès restreint ou ID incorrect** |
| Aides financières ADEME | `les-aides-financieres-de-l'ademe` | Logement | Subventions ADEME à des organisations (pas des particuliers) — agrégat régional envisageable |
| DV3F Transactions immobilières | `dv3f` | Projets | Valeurs de marché géolocalisées — évolution sous pression climatique |
| Coûts rénovation (autres postes) | `menuiseries`, `ventilation`, `ecs`, `photovoltaique` | Logement | À ajouter dans `renovation.ts` (structure identique à `isolation`/`chauffage`) |

---

## Route agrégée principale

`GET /api/georisques-logement?q=<adresse>` combine en une seule réponse :
- Géocodage BAN (adresse → coordonnées + identifiant BAN)
- Parcelle cadastrale (API Carto)
- DPE du logement (ADEME)
- Données communales et IRIS agrégées (ADEME)
- ZFE (ADEME)
- Qualité de l'air (ATMO)
- Altitude (IGN)
- Hydrologie (Hub'Eau)
- Risques naturels commune + point + parcelle (Géorisques)
