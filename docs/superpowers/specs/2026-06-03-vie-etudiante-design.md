# Critère vie étudiante (accès + dynamisme) — design

Date : 2026-06-03
Statut : design validé (porteur), prêt pour plan d'implémentation.

## Intention

Chantier #3 de la roadmap. Un critère opt-in `vie_etudiante` répondant à une intention
utilisateur unique : « une ville étudiante / un endroit où faire des études / un territoire animé
par les étudiants ». Un seul critère combiné (pas de séparation accès / dynamisme) : plus lisible,
évite la surpondération.

Le supérieur (BPE `C5xx`) était volontairement exclu du critère `acces_ecoles` (collège + lycée),
en attendant ce signal distinct.

## Deux facettes, un score

- **Accès** : présence d'établissements supérieurs à portée (BPE `C5xx`).
- **Dynamisme** : poids étudiant réel = **part d'étudiants dans la population**, à l'échelle de
  l'unité urbaine (un campus peut être en commune périphérique, mais l'effet étudiant se vit à
  l'échelle de l'agglomération ; cohérent avec le chantier C).

Pondération **40 % accès / 60 % dynamisme** : « ville étudiante » renvoie davantage à la vitalité
du territoire qu'à la présence administrative d'un établissement. Une ville avec quelques
formations mais très peu d'étudiants dans la population ne doit pas ressortir comme une vraie
ville étudiante (le dynamisme, à 60 %, la tire vers le bas).

## Sources

### A. Accès — BPE 2024 (déjà en place)
`data/bpe24.parquet`, codes `TYPEQU` `C5xx` (C501, C502, C503, C504, C505, C509 ; 2 279
équipements). On **étend `scripts/populate-bpe.py`** (même pipeline rayon + percentile que
écoles/culture) avec un set `SUP_TYPEQU` et un champ de sortie.

### B. Dynamisme — MESR (nouvelle source)
[Effectifs d'étudiants inscrits, données agrégeables](https://data.enseignementsup-recherche.gouv.fr/explore/dataset/fr-esr-atlas_regional-effectifs-d-etudiants-inscrits_agregeables/)
(opendatasoft MESR, API). Champs utiles : `com_id` (code commune INSEE), `effectif_atlas`
(effectif géolocalisé conçu pour l'agrégation, sans double-compte), `rentree` (dernière), plus
ventilation `sexe`/`regroupement`/`secteur`. Agrégation : somme de `effectif_atlas` par commune
sur la dernière rentrée (toutes ventilations), à valider par un témoin (total France ~2,7-2,9 M).

## Métriques

### Accès (par commune, rayon ~15 km, percentile national)
Comptage des équipements `C5xx` dans le rayon, percentile → `c.etudes_acces` (0-100).

### Dynamisme (part étudiante, niveau UU, percentile national)
1. Effectifs étudiants par **commune** (somme `effectif_atlas`, dernière rentrée).
2. Agrégés par **unité urbaine** via le mapping commune→UU de NOTRE index (cohérent avec le
   chantier C ; on n'utilise pas `uucr_id` du dataset, pour éviter un décalage de millésime d'UU).
3. `part_etudiante(c) = effectifs_UU(c.uu) / popUU(c.uu)` si `c.uu`, sinon
   `effectifs_commune / c.population` (commune hors UU).
4. Percentile national de la part → `c.etudes_dyn` (0-100). Une commune sans étudiant a une part
   de 0 (percentile bas), ce n'est pas `null`.

## Champs index (deux, deux scripts indépendants, comme mobilité)

```ts
c.etudes_acces: number | null   // percentile présence établissements sup (BPE C5xx)
c.etudes_dyn:   number | null   // percentile part étudiante (MESR, niveau UU)
```

## Moteur (`comparateur-vie.ts`)

Clé `vie_etudiante` ajoutée à `PREFERENCE_KEYS` (donc `REASON_POS`, `REASON_NEG`,
`PREFERENCE_LABELS`, `PREFERENCE_INTERPRETATIONS`, filet typé).

```ts
case "vie_etudiante": {
  const a = c.etudes_acces, d = c.etudes_dyn;
  if (a == null && d == null) return null;
  if (a == null) return d;
  if (d == null) return a;
  return Math.round(0.4 * a + 0.6 * d);
}
```

- `REASON_POS` : « ville étudiante animée » ; `REASON_NEG` : « offre étudiante limitée ».
- `PREFERENCE_LABELS` : « une ville étudiante ».
- `PREFERENCE_INTERPRETATIONS` (glose) : « présence d'établissements supérieurs et poids des
  étudiants dans la population, pas la qualité ni la réputation des formations ».

**Signal ambiant** : `vie_etudiante` rejoint `AMBIENT_DIMENSIONS` via sa clé `subScore` (comme
`acces_soins`), pour répondre à « et côté vie étudiante ? » hors recherche. Bandes :
« ville étudiante animée » / « présence étudiante intermédiaire » / « peu d'étudiants ».

## Parse (`parse/route.ts`)

« ville étudiante », « université », « fac », « faire des études », « pour mes études / celles de
mes enfants », « campus », « vie étudiante », « ville animée par les étudiants » → `vie_etudiante`.

## Scripts

- `scripts/populate-bpe.py` (étendu) : `SUP_TYPEQU = {"C501","C502","C503","C504","C505","C509"}`,
  champ `etudes_acces` (percentile rayon), via `--write-index`.
- `scripts/populate-etudiants.py` (créer, venv `.venv-bpe`) : fetch MESR (API export), agrège
  `effectif_atlas` par commune (dernière rentrée), charge l'index, agrège par UU (mapping c.uu +
  popUU), calcule la part étudiante, percentile → `c.etudes_dyn`, via `--write-index`.

## Vérification (pas de runner de test, cf. AGENTS.md)

1. `npx tsc --noEmit` + `npm run lint`.
2. Scripts + `--write-index` :
   - accès : grandes villes universitaires (Toulouse, Lyon, Lille) `etudes_acces` haut ; commune
     rurale isolée bas/null.
   - dynamisme : Poitiers, Rennes, Montpellier, La Rochelle (fortes parts étudiantes) en tête ;
     témoin total France des effectifs (~2,7-2,9 M).
3. `curl /parse` : « je veux une ville étudiante » / « pouvoir faire mes études » → `vie_etudiante`.
4. `curl /match` (`vie_etudiante`) : villes étudiantes en tête ; une ville avec établissements
   mais faible part étudiante ne domine pas (effet du 60 % dynamisme) ; rural non pénalisé hors
   critère.
5. `curl /ask` « et côté vie étudiante ? » → réponse qualitative comparative, zéro chiffre.

## Hors périmètre (porteur)

Qualité des formations, réputation des universités, classements, débouchés précis, spécialités
disponibles : rapport ou V2. Un critère « accès seul » distinct : non (combiné en V1).

## Notes doctrine

- Cf. [[project_horsmesure_cleanup]] (C5xx exclu de acces_ecoles, en attente de ce signal),
  [[project_taille_ville]] (popUU / niveau UU réutilisés pour la part), [[inondation_scoring]]
  (patron percentile + `--write-index`), [[project_signaux_ambiants_askfuture]] (ajout ambiant),
  [[feedback_no_em_dash]], [[feedback_callendar]] (sources publiques MESR/BPE attribuables).
