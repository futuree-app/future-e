# Mobilité (dépendance auto + accès transports) — design

Date : 2026-06-03
Statut : design validé (porteur), prêt pour plan d'implémentation.

## Problème / intention

Chantier #3 de la roadmap : des critères **mobilité** opt-in dans le comparateur, angle climat
+ projet de vie, nationaux, précalculés. L'existant `scripts/populate-dependance-auto.js` est
inadéquat : top200, Supabase (pas l'index), agrégation IRIS→commune par nom, densité mélangée
au score. On repart proprement.

Deux dimensions de choix résidentiel **distinctes**, toutes deux **vrais critères de scoring
opt-in en V1** (décision porteur, après instruction des sources) :

1. **Dépendance automobile** — `faible_dependance_auto`. « Puis-je vivre ici sans dépendre
   fortement de ma voiture ? » Mesure d'**usage contraint** : part des trajets domicile-travail
   faits en voiture.
2. **Accessibilité transports** — `acces_transports`. « Y a-t-il une gare ? Est-ce facile de
   prendre le train ? Puis-je rejoindre une métropole ? » Mesure d'**offre** : desserte
   ferroviaire accessible alentour, valable pour tous (y compris retraités, télétravailleurs).

Deux opt-in séparés → pas de surpondération mécanique (chacun ne pèse que s'il est demandé).
Le rural n'est jamais pénalisé par défaut.

## Doctrine

- Critères **opt-in** : `subScore` calculé seulement si la clé est demandée. Le rural sort bas
  uniquement quand le critère EST demandé (légitime). Jamais de pénalité par défaut.
- **Densité exclue** de tout calcul (captée ailleurs : cadre_calme, eviter_isolement).
- `faible_dependance_auto` mesure l'**usage** (part voiture domicile-travail), `acces_transports`
  mesure l'**offre** (gares). On ne les mélange pas.
- Gloses honnêtes : usage domicile-travail / desserte des gares, pas la qualité du réseau ni
  les horaires (rapport). Pas d'IA dans le scoring ; précalcul déterministe.

## Sources

### A. Dépendance auto — INSEE RP MOBPRO 2022
[Fichier détail](https://www.insee.fr/fr/statistiques/8589904) « Mobilités professionnelles ».
Niveau commune de résidence (arrondissements pour PLM, comme l'index). Format Parquet,
volumineux → gitignoré (`data/rp-mobpro-2022.parquet`), traité avec `.venv-bpe` (pyarrow).
Variables : `COMMUNE` (résidence), `TRANS` (mode domicile-travail), `IPONDI` (poids).
Codes `TRANS` (RP2017+) : 1 pas de transport, 2 marche, 3 vélo, 4 deux-roues motorisé,
**5 voiture/camion/fourgonnette**, 6 transports en commun.

### B. Accès transports — SNCF Open Data
Deux datasets (API opendatasoft `ressources.data.sncf.com`, ~3000 gares, national) :
- [gares-de-voyageurs](https://ressources.data.sncf.com/explore/dataset/gares-de-voyageurs/) :
  `codeinsee`, `position_geographique` ([lat, lon]), `segment_drg` (A/B/C), `codes_uic`, `nom`.
- [frequentation-gares](https://ressources.data.sncf.com/explore/dataset/frequentation-gares/) :
  `code_uic_complet`, `total_voyageurs_2024` (dernière année), `segmentation_drg`, `nom_gare`.

Jointure gares↔fréquentation par **UIC** (`codes_uic` ↔ `code_uic_complet`). Si l'UIC ne matche
pas pour une gare, **fallback** : pondérer par `segment_drg` via une fréquentation proxy
(A ≈ 5 000 000, B ≈ 500 000, C ≈ 50 000 voyageurs/an). La validation de la clé de jointure et le
format exact d'export (CSV/JSON) sont des tâches du plan.

## Métriques

### Dépendance auto (par commune de résidence, pondéré IPONDI)
```
total        = Σ IPONDI (actifs occupés résidents)
part_voiture = Σ IPONDI[TRANS==5] / total            # 0..1
```
Seuil de fiabilité : `total < 50` → commune laissée à `null` (échantillon trop faible).
`dependance = percentile national de part_voiture` (0-100, haut = dépend de la voiture).

### Accès transports (accès ferroviaire pondéré par la desserte)
Pour chaque commune `c` (coords `lat`/`lon` de l'index), sur les gares à moins de 100 km
(distance haversine `d` en km) :
```
acces_raw(c) = max sur gares g [ voyageurs_g / (1 + (d(c,g) / 20)^2) ]     # 0 si aucune gare < 100 km
```
- `voyageurs_g` : `total_voyageurs_2024` (jointure UIC) ou proxy de segment (fallback).
- Le **max** privilégie la meilleure gare accessible : une grande gare TGV un peu loin l'emporte
  sur une halte proche, ce qui capte « rejoindre une métropole ». L'atténuation `1/(1+(d/20)^2)`
  vaut ~1 à 0 km, 0.5 à 20 km, ~0.16 à 45 km.
```
desserte = percentile national de acces_raw   # 0-100, haut = bien reliée par le train
```
Communes sans aucune gare à <100 km : `acces_raw = 0` → entrent dans le percentile (desserte
basse), ce n'est pas `null` (l'absence de desserte est une information, pas une donnée manquante).

## Champs index (deux champs séparés, deux scripts indépendants)

```ts
c.mobilite = {            // INSEE MOBPRO
  part_voiture: number;   // brut 0..1 (rapport futur)
  dependance: number;     // percentile national (0-100)
} | null;                 // null = sous le seuil de fiabilité

c.transport = {           // SNCF
  desserte: number;       // percentile national de l'accès ferroviaire pondéré (0-100)
  gare_nom: string | null;   // meilleure gare retenue (rapport futur)
  gare_km: number | null;    // distance à cette gare (rapport futur)
} | null;                 // null seulement si lat/lon commune absents (rare)
```

## Moteur (`src/lib/comparateur-vie.ts`)

Deux clés ajoutées à `PREFERENCE_KEYS` (donc, filet typé, à `REASON_POS`, `REASON_NEG`,
`PREFERENCE_LABELS`, `PREFERENCE_INTERPRETATIONS`) :

- `subScore` :
  - `faible_dependance_auto` → `c.mobilite ? 100 - c.mobilite.dependance : null`
  - `acces_transports` → `c.transport?.desserte ?? null`
- `REASON_POS` / `REASON_NEG` :
  - `faible_dependance_auto` : « peu dépendante de la voiture au quotidien » /
    « territoire où la voiture reste quasi indispensable »
  - `acces_transports` : « bien reliée par le train » / « desserte ferroviaire limitée »
- `PREFERENCE_LABELS` :
  - `faible_dependance_auto` : « une faible dépendance à la voiture »
  - `acces_transports` : « l'accès au train et aux gares »
- `PREFERENCE_INTERPRETATIONS` (gloses) :
  - `faible_dependance_auto` : « part des trajets domicile-travail faits en voiture, pas la
    qualité du réseau routier »
  - `acces_transports` : « desserte ferroviaire accessible alentour (présence et fréquentation
    des gares), pas le détail des horaires »

**Signal ambiant.** `acces_transports` rejoint `AMBIENT_DIMENSIONS` via sa clé `subScore`
(comme `acces_soins`), pour répondre à « et côté transports ? » hors recherche :
```
{ id: "transports", key: "acces_transports",
  bands: ["bien reliée par le train", "desserte ferroviaire intermédiaire", "peu reliée par le train"] }
```
`faible_dependance_auto` n'est pas en ambiant (redondant, dimension de contrainte).

## Parse (`src/app/api/comparateur-vie/parse/route.ts`)

- → `faible_dependance_auto` : « sans voiture », « moins conduire », « ne pas dépendre de la
  voiture », « tout à pied », « se garer c'est l'enfer ».
- → `acces_transports` : « une gare », « le train », « TER », « TGV », « rejoindre une
  métropole », « transports en commun », « bien desservi », « aller en ville sans voiture ».
- Distincts et cumulables (« sans voiture, avec une gare » → les deux). Aucun déduit par défaut
  d'un projet rural ou familial.

## Scripts

### `scripts/populate-mobilite.py` (venv `.venv-bpe`, pyarrow)
Lit le parquet MOBPRO (COMMUNE, TRANS, IPONDI), agrège par commune, applique le seuil, calcule
`part_voiture` + percentile `dependance`, `--write-index` → `c.mobilite`.

### `scripts/populate-transports.py` (venv `.venv-bpe`, numpy)
1) Télécharge/charge les deux datasets SNCF (gares + fréquentation) ; 2) joint par UIC (fallback
segment) → liste de gares `{lat, lon, voyageurs}` ; 3) pour chaque commune de l'index (lat/lon),
calcule `acces_raw` (haversine vectorisé numpy, cutoff 100 km, atténuation `1/(1+(d/20)^2)`,
max) ; 4) percentile national `desserte` ; 5) `--write-index` → `c.transport` (desserte +
meilleure gare nom/km). L'URL d'export exacte des datasets est une tâche du plan.

## Vérification (pas de runner de test, cf. AGENTS.md)

1. `npx tsc --noEmit` + `npm run lint`.
2. Scripts + `--write-index` :
   - mobilité : Paris/arrondissements (part voiture basse, dependance basse) ; rural isolé
     (part voiture ~0.9+, dependance ~100) ; communes sous seuil → `null`.
   - transports : commune avec gare TGV (Lyon, Tours, Lille) → desserte haute ; commune de
     montagne sans gare proche → desserte basse ; témoin : meilleure gare nommée plausible.
3. `curl /parse` : « vivre sans voiture » → `faible_dependance_auto` ; « une gare et le TGV » →
   `acces_transports` ; « sans voiture mais avec une gare » → les deux.
4. `curl /match` : `acces_transports` → villes à gare majeure en tête (« bien reliée par le
   train ») ; `faible_dependance_auto` → grandes villes en tête ; recherche neutre (`nature`) →
   aucune reason mobilité, rural non pénalisé.
5. `curl /ask` « et côté transports ? » → réponse qualitative comparative (signal ambiant), zéro chiffre.

## Hors périmètre / V2

- TC urbains fins (bus/tram/métro, GTFS) : V2. En V1 l'accès ferroviaire est le proxy d'offre.
- Vélo, marche, distances domicile-travail (autres modes TRANS) : V2.
- Horaires, lignes, temps de trajet réels : rapport.
- Densité dans le score : exclue.
- L'ancien `populate-dependance-auto.js` (Supabase, top200) : hors périmètre, non remplacé ici.

## Notes doctrine

- Cf. [[inondation_scoring]] (patron percentile + `--write-index`), [[project_horsmesure_cleanup]]
  (patron BPE : accès par rayon + percentile, réutilisé pour l'accès ferroviaire),
  [[parcours_doctrine]] (opt-in, ne pas pénaliser le rural),
  [[project_signaux_ambiants_askfuture]] (acces_transports rejoint les signaux ambiants),
  [[feedback_no_em_dash]] (pas de tiret cadratin), [[feedback_callendar]] (sources publiques
  uniquement, SNCF/INSEE attribuables).
- `home_insee_code` = code INSEE, jamais code postal (cf. [[home_insee_code_pitfall]]).
