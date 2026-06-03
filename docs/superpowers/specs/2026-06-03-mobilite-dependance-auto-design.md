# Mobilité (dépendance auto + accès transports) — design

Date : 2026-06-03
Statut : design validé (porteur), prêt pour plan d'implémentation.

## Problème / intention

Chantier #3 de la roadmap : un critère **mobilité** opt-in dans le comparateur, angle climat
(« pouvoir vivre en conduisant moins »), national, précalculé. L'existant
`scripts/populate-dependance-auto.js` est inadéquat : top200 seulement, écrit dans Supabase
(pas l'index comparateur), agrège l'IRIS→commune **par nom** (fragile), et **mélange la
densité** dans le score (ce qui pénalise mécaniquement le rural). On repart proprement.

Deux intentions distinctes, confirmées porteur :
1. **Dépendance à la voiture** : « je veux pouvoir me passer de la voiture / moins conduire ».
2. **Accès aux transports** : « je veux une gare, des bus, pouvoir bouger sans voiture ».

Les deux deviennent des **critères de scoring opt-in en V1** (clés séparées). Le risque de
surpondération est maîtrisé par l'opt-in : chaque critère ne pèse que s'il est explicitement
demandé.

## Doctrine

- Critères **opt-in** : `subScore` calculé seulement si la clé est demandée. Le rural n'est
  **jamais pénalisé par défaut**. S'il sort bas quand le critère EST demandé, c'est légitime
  (l'utilisateur a demandé à dépendre moins de la voiture).
- **Densité exclue** du calcul : la densité est déjà captée ailleurs (cadre_calme,
  eviter_isolement) ; la mélanger ici fabriquerait un proxy urbain qui pénalise le rural.
- Gloses honnêtes : on mesure l'**usage domicile-travail**, pas la qualité du réseau routier
  ni le détail des lignes (ça reste au rapport).
- Pas d'IA dans le scoring. Précalcul déterministe dans `comparateur-index.json`.

## Source unique

[INSEE RP MOBPRO 2022 — fichier détail](https://www.insee.fr/fr/statistiques/8589904)
(« Mobilités professionnelles des individus », recensement). Niveau **commune de résidence**
(arrondissements municipaux pour Paris/Lyon/Marseille, ce qui colle à l'index qui stocke aussi
les PLM par arrondissement). Format Parquet. Variables utilisées :
- `COMMUNE` : commune de résidence (code INSEE).
- `TRANS` : mode de transport principal domicile-travail (format détaillé depuis RP2017).
- `IPONDI` : poids individuel (le fichier est un sondage : toujours pondérer).

Codes `TRANS` (RP2017+) : 1 pas de transport, 2 marche, 3 vélo, 4 deux-roues motorisé,
**5 voiture/camion/fourgonnette**, **6 transports en commun**.

Le fichier parquet est volumineux : gitignoré (comme `data/bpe24.parquet`), placé dans
`data/rp-mobpro-2022.parquet`. Traité avec le venv `.venv-bpe` (pyarrow).

## Métriques (par commune de résidence, pondérées IPONDI)

```
total      = Σ IPONDI (tous actifs occupés résidents de la commune)
part_voiture = Σ IPONDI[TRANS==5] / total      # 0..1
part_tc      = Σ IPONDI[TRANS==6] / total      # 0..1
```

**Seuil de fiabilité** : si `total < 50` (actifs pondérés), la commune est laissée à `null`
(échantillon trop faible, part bruitée). null = pas de pénalité, comme `inondation`.

Percentiles nationaux (bisect sur la distribution des communes renseignées) :
```
dependance = percentile(part_voiture)   # 0-100, haut = dépend beaucoup de la voiture
acces_tc   = percentile(part_tc)        # 0-100, haut = beaucoup de trajets en TC
```

## Champ index

```ts
c.mobilite = {
  part_voiture: number;  // brut 0..1, conservé pour un futur rapport
  part_tc: number;       // brut 0..1
  dependance: number;    // percentile national de part_voiture (0-100)
  acces_tc: number;      // percentile national de part_tc (0-100)
} | null
```

## Moteur (`src/lib/comparateur-vie.ts`)

Deux clés ajoutées à `PREFERENCE_KEYS` (et donc, filet typé oblige, à `REASON_POS`,
`REASON_NEG`, `PREFERENCE_LABELS`, `PREFERENCE_INTERPRETATIONS`) :

- `subScore` :
  - `faible_dependance_auto` → `c.mobilite ? 100 - c.mobilite.dependance : null`
  - `acces_transports` → `c.mobilite?.acces_tc ?? null`
- `REASON_POS` / `REASON_NEG` :
  - `faible_dependance_auto` : « peu dépendante de la voiture au quotidien » /
    « territoire où la voiture reste quasi indispensable »
  - `acces_transports` : « bien desservie en transports en commun » /
    « peu desservie en transports en commun »
- `PREFERENCE_LABELS` :
  - `faible_dependance_auto` : « une faible dépendance à la voiture »
  - `acces_transports` : « l'accès aux transports en commun »
- `PREFERENCE_INTERPRETATIONS` (gloses) :
  - `faible_dependance_auto` : « part des trajets domicile-travail faits en voiture, pas la
    qualité du réseau routier »
  - `acces_transports` : « part des trajets domicile-travail en transports en commun, pas le
    détail des lignes ni des horaires »

**Signal ambiant.** `acces_transports` rejoint `AMBIENT_DIMENSIONS` via sa clé `subScore`
(comme `acces_soins`), donc il répond aussi à « et côté transports ? » hors recherche, **sans
élargir** le mécanisme :
```
{ id: "transports", key: "acces_transports",
  bands: ["mieux desservie en transports", "desserte en transports intermédiaire", "moins desservie en transports"] }
```
`faible_dependance_auto` **n'est pas** ajouté aux signaux ambiants (redondant avec
`transports`, et c'est une dimension de contrainte plutôt qu'une question naturelle « et côté
dépendance auto ? »).

## Parse (`src/app/api/comparateur-vie/parse/route.ts`)

Le parse (LLM) doit pouvoir produire les deux clés :
- → `faible_dependance_auto` : « sans voiture », « moins conduire », « ne pas dépendre de la
  voiture », « tout à pied », « se garer c'est l'enfer » (intention de moindre usage auto).
- → `acces_transports` : « une gare », « le train », « des bus », « transports en commun »,
  « bien desservi », « pouvoir aller en ville sans voiture ».
Les deux peuvent coexister (« sans voiture, avec une gare ») → les deux clés, chacune son poids.

## Script (`scripts/populate-mobilite.py`)

Venv `.venv-bpe` (pyarrow). 1) lit `data/rp-mobpro-2022.parquet` (colonnes COMMUNE, TRANS,
IPONDI) ; 2) agrège par COMMUNE (Σ IPONDI total, TRANS==5, TRANS==6) ; 3) applique le seuil
de fiabilité (total < 50 → null) ; 4) calcule les percentiles nationaux ; 5) `--write-index`
patche `comparateur-index.json` (champ `mobilite`). Même forme que `populate-inondation.py`
(`--write-index`). L'URL/placement du parquet est une tâche du plan (téléchargement manuel
dans `data/` ou par le script ; fichier gitignoré).

## Vérification (pas de runner de test, cf. AGENTS.md)

1. `npx tsc --noEmit` + `npm run lint`.
2. Script + `--write-index` : témoins data — Paris/Lyon (faible part voiture, acces_tc haut) ;
   commune rurale isolée (part voiture ~proche de 1, acces_tc bas) ; distribution saine ;
   communes sous le seuil → `null`.
3. `curl /parse` : « je veux pouvoir vivre sans voiture » → `faible_dependance_auto` ; « je
   veux une gare et des trains » → `acces_transports` ; « sans voiture mais avec une gare » →
   les deux.
4. `curl /match` (`acces_transports`) : métropoles desservies en tête ; (`faible_dependance_auto`)
   grandes villes en tête ; rural **non pénalisé** quand aucun critère mobilité n'est demandé
   (témoin : recherche neutre, pas de reason mobilité, pas de chute du rural).
5. `curl /ask` « et côté transports ? » → réponse qualitative comparative (signal ambiant), zéro chiffre.

## Hors périmètre / V2

- Vélo, marche, distances domicile-travail (autres modes TRANS) : pas en V1.
- Gares/lignes/horaires précis : rapport.
- Densité dans le score : exclue (défaut de l'ancien script, corrigé).
- L'ancien `populate-dependance-auto.js` (Supabase, top200) : laissé tel quel, hors périmètre
  (module Supabase distinct) ; ce chantier ne le remplace pas, il crée le critère comparateur.

## Notes doctrine

- Cf. [[inondation_scoring]] (même patron de précalcul percentile + `--write-index`),
  [[parcours_doctrine]] (opt-in, ne pas pénaliser le rural),
  [[feedback_no_em_dash]] (pas de tiret cadratin),
  [[project_signaux_ambiants_askfuture]] (acces_transports rejoint les signaux ambiants).
- `home_insee_code` = code INSEE, jamais code postal (cf. [[home_insee_code_pitfall]]).
