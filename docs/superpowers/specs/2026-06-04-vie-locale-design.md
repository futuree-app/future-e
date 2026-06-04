# Vie locale (intensité de vie sociale) — design

Date : 2026-06-04
Statut : design validé, prêt pour plan d'implémentation.

## Problème

Le comparateur capte la santé, l'emploi, les écoles, la culture (BPE), la mobilité, la nature,
les risques. Il **ne capte pas** la **vie sociale du territoire** : « est-ce qu'il se passe
quelque chose ici ? ». C'est une vraie dimension de projet de vie (la question implicite
« est-ce qu'on va s'ennuyer ? »), plus fréquente que « un parc naturel », et aujourd'hui
absente.

Ni `acces_culture` (équipements BPE) ni `acces_services` (commerces accessibles) ne répondent :
une ville peut avoir un gros équipement culturel et être perçue **morte** ; une petite ville
avec une place, un marché, des cafés et des assos est perçue **vivante**.

## Intention

Critère opt-in `vie_locale` : mesurer la **présence d'une vie sociale visible et accessible au
quotidien**, via les **lieux où les gens se croisent** et le **tissu associatif** qui les fait
vivre. PAS la culture au sens BPE, PAS l'événementiel.

Frontière doctrinale (exclusions explicites) : **jamais** festivals, événements ponctuels,
fréquentation, nightlife, avis Google, réseaux sociaux. Ces signaux sont fragiles, déclaratifs
ou non nationaux, contre la doctrine « gloses honnêtes ». On mesure la **présence d'une
infrastructure sociale** (lieux + communautés), pas la vitalité subjective.

## Identité du critère

- **Clé** : `vie_locale`.
- **Libellé** : « une vie locale animée » (ou « un territoire où il se passe des choses »).
- **Champ index** : `c.vieLocale = { score, lieux_pct, assos_pct } | null`.
  - `score` : 0-100 (combinaison 70/30, cf. Métrique).
  - `lieux_pct`, `assos_pct` : les deux composantes (debug / récit).
  - `null` = aucune donnée exploitable (commune sans POI ni association).
- **Opt-in strict** : rural non pénalisé hors critère.

## Métrique : intensité sociale × masse critique

Patron `vie_etudiante` (combinaison de deux percentiles). **Deux densités**, normalisées
chacune en percentile national, combinées 70/30.

1. **Composante lieux (OSM, 70 %)**
   - `lieux` = nombre de POI de sociabilité **rattachés à la commune** (cf. Échelle).
   - `densité_lieux = lieux / (pop_commune + K)`.
   - `P_lieux` = percentile national de `densité_lieux` **parmi les communes à densité > 0**
     (zéro épinglé : `densité_lieux == 0` → `P_lieux = 0`).
2. **Composante associations (RNA + AMALIA, 30 %)**
   - `assos` = nombre d'associations **actives** domiciliées dans la commune.
   - `densité_assos = assos / (pop_commune + K)`.
   - `P_assos` = percentile parmi les communes à densité > 0 (zéro épinglé).
3. **Score** : `vie_locale = round(0.7 · P_lieux + 0.3 · P_assos)`.

**`K` = masse critique** (lissage par population virtuelle / shrinkage). Pour une grosse
commune, `K` est négligeable → vraie densité par habitant ; pour un hameau, `K` domine le
dénominateur → la densité est tirée vers le bas, ce qui tue l'explosion statistique (1 café /
30 hab ne donne plus un score énorme). **`K` est un bouton calibré par sonde, jamais à
l'intuition** (cf. Validation).

**Échelle commune des deux côtés (raffinement clé).** On ne compte PAS les lieux par rayon
autour du centroïde : un rayon (échelle quartier) divisé par la population **communale**
(échelle ville) mélange deux échelles et **coulerait les grandes villes** (Paris : ~200 cafés à
1 km / 2,1 M hab = densité minuscule). Donc numérateur et dénominateur à la **même échelle
commune** :
- Chaque POI OSM est **rattaché à sa commune** = commune au **centroïde le plus proche**
  (Voronoï), via la grille spatiale du projet (binner les centroïdes, chercher le plus proche
  dans les cellules voisines ; pas de dépendance scipy). Bruit de bord mineur (accepté).
- Les associations sont déjà domiciliées par commune (INSEE).
- Aucun bouton de rayon : **seul `K` est à sonder**.

## Sources de données

1. **Lieux de sociabilité → OpenStreetMap (Overpass), réutilise l'infra de tuilage** de
   `populate-reseau-local.py` (tuiles bbox métropole + DOM, cache par tuile, miroirs + retry).
   Tags retenus (V1) :
   - `amenity` ∈ {`cafe`, `bar`, `pub`, `restaurant`, `marketplace`, `community_centre`}
   - `leisure` ∈ {`sports_centre`, `pitch`, `stadium`, `sports_hall`}
   - Le BPE est écarté pour les lieux : **il n'a ni café, ni bar, ni marché** (A504 =
     restaurants seuls). OSM est uniforme et porte tout cela.
   - `fast_food` exclu (transactionnel, peu « lieu de sociabilité »). Liste de tags = bouton.
2. **Tissu associatif** : deux sources harmonisées vers `(insee → nb_actives)` :
   - **RNA national** (Répertoire National des Associations, data.gouv, Ministère de
     l'Intérieur) pour les 98 départements de droit commun. Actif = non dissous. Schéma à
     confirmer à l'acquisition (géocodage commune / INSEE).
   - **AMALIA** (associations de droit local Alsace-Moselle, data.gouv, 3 CSV : 67/68/57) pour
     les 3 départements exclus du RNA par le droit local. Actif = `ETAT_ASSOCIATION == "INSCRITE"`.
     Colonnes `COMMUNE` (99,97 %) + `CODE_POSTAL` (100 %). Fraîcheur : 67 mis à jour quotidien
     (2026-06-02), 68 (août 2025), 57 (déc. 2024). `NUMERO_RNA` vide → **aucun recoupement avec
     le RNA, zéro dédoublonnage**.
   - Géocodage commune (nom + CP) → INSEE via une table dérivée de l'index (`nom`, `dept`).
     Normalisation des noms ; arbitrage CP partagé entre communes.

## Vigilances inscrites (doctrine)

- **Tourisme** : un village touristique concentre restaurants/cafés/bars et peut ressortir
  haut sans vraie vie locale à l'année. Ce n'est pas forcément faux, mais **doit être dans la
  matrice de validation**. Glose honnête : « l'offre, notamment de restauration, peut être
  amplifiée par le tourisme ». Si la sonde montre une survalorisation nette, **pondérer les
  restaurants plus bas** que cafés / marchés / community_centre (raffinement post-sonde, pas en
  dur d'emblée).
- **Banlieue résidentielle dense** : test le plus discriminant. Une banlieue dense mais
  principalement résidentielle (dortoir) ne doit **pas** scorer comme une petite ville-centre
  vivante. C'est ce que le `/(pop + K)` à l'échelle commune doit produire (beaucoup d'habitants,
  peu de lieux/assos par tête → densité basse).
- **Pondération par type de POI** : bouton possible (un marché hebdo pèse-t-il plus qu'un
  café ?). V1 = poids égal par POI ; à réviser si la sonde le réclame.

**Constat post-sonde : le tourisme est la vraie limite V2, pas K.** La hiérarchie ne bouge
quasiment pas avec K pour les communes incarnant le concept (Uzès, Lyon, La Rochelle), mais les
communes touristiques saturent le haut quel que soit K (Saint-Tropez 99 ; suivront Gordes,
Collioure, Rocamadour…). Le critère mesure donc « densité de vie **visible** », pas « vie locale
**vécue à l'année** » : acceptable et assumé en V1. Direction V2 dédiée (autre chantier) :
croiser résidences secondaires, ratio restaurants/habitants, population saisonnière, vacance
saisonnière, pour distinguer l'animation touristique de la vie locale permanente.

## Câblage TS

Script `scripts/populate-vie-locale.py` (venv `.venv-bpe`, numpy ; `--selftest` / `--summary`
/ `--probe` / `--matrix` / `--write-index`). Réutilise les helpers OSM/tuilage de
`populate-reseau-local.py` (factoriser si propre, sinon dupliquer le patron).

Six points de câblage habituels (`comparateur-vie.ts` + `comparateur-labels.ts`) :
- `PREFERENCE_KEYS` : `vie_locale`.
- `subScore` : `c.vieLocale?.score ?? 0` (opt-in ; pas de vie locale crédible = 0).
- `REASON_POS` / `REASON_NEG` : « vie locale animée (commerces, marchés, associations) » /
  « peu de lieux de vie et d'animation locale ».
- `PREFERENCE_LABELS` : « une vie locale animée ».
- `PREFERENCE_TOOLTIP` : ≤ 2 phrases, « pourquoi ça aide », sans méthodo. Ex. : « Densité des
  lieux où l'on se retrouve (cafés, marchés, sport, associations) rapportée à la population.
  Indique si le territoire a une vie sociale au quotidien. »
- `AMBIENT_DIMENSIONS` : id `vie_locale` (« et côté vie locale / animation ? »).
- **`synthesize/route.ts` a son PROPRE `PREF_LABELS`** : l'y ajouter (sinon filtré du récit).
- **Parse** (`parse/route.ts`) : router « vie locale », « animé », « il se passe des choses »,
  « ville vivante », « pas s'ennuyer », « cafés / marchés / associations / vie de quartier » →
  `vie_locale`. Distinct de `acces_culture` (équipements) et `acces_services` (commerces).
- **Cache index dev** : après `--write-index`, vraie modif de `comparateur-vie.ts` pour
  réinitialiser `indexCache`.

## Notes d'exécution (2026-06-04)

- **POI OSM rattachés avec un plancher de distance (8 km).** Les tuiles bbox débordent sur
  l'étranger (Italie/Espagne/Allemagne/Suisse/Belgique/Angleterre) ; sans garde-fou, le
  rattachement au centroïde français le plus proche collait les POI étrangers sur les communes
  frontalières (bug constaté : La Brigue, 719 hab → 22 195 POI italiens). Correctif : un POI
  dont le centroïde communal le plus proche est à > 8 km est écarté (hors France). La Brigue
  retombe à 3 POI ; 240 k POI étrangers écartés, 148 k POI français conservés. (Le filtre `area`
  Overpass a été testé puis abandonné : fragile selon le miroir, vides silencieux.)
- **K figé à 1000.** La sonde a montré un effet contre-intuitif : un K plus grand **récompense
  les banlieues-dortoirs** (leur densité bouge peu, les petites communes sont écrasées et chutent
  dans le percentile). Or « dortoir bas » est le cas d'usage fondateur (Sevran : 28 à K=1000,
  mais 71 à K=8000). 1000 est la seule valeur qui le respecte, sans faire exploser les villages
  (Plaudren 60). La peur initiale (hameau 1 café = score délirant) ne s'est pas matérialisée.
- **Sources actives à jour 2026-06** : RNA waldec (`position == 'A'`, géocodage `adrs_codeinsee`,
  1,84 M actives) + AMALIA 67/68/57 (`INSCRITE`, 75 k, Strasbourg = 13 611 → trou Alsace-Moselle
  comblé). 34 539/34 788 communes notées (assos quasi universelles).

## Validation

Procédure : après `--write-index`, toucher `comparateur-vie.ts` (bust `indexCache`), puis
`npx tsc --noEmit` + `npm run lint` + curl réel sur `/api/comparateur-vie/match`.

1. **Sonde de `K` (AVANT de figer).** Calculer le comportement à plusieurs `K` (ex. 1000 /
   3000 / 8000) sur communes témoins, et choisir sur preuve.
2. **Matrice de vérité** (le critère est solide si elle est respectée) :

| Cas | Attendu |
|---|---|
| Petite ville-centre vivante (marché, cafés, assos) | Haut |
| **Banlieue résidentielle dense (dortoir)** | **Bas** (test le plus important) |
| Village touristique (beaucoup de restaurants) | À surveiller : pas exceptionnel par défaut |
| Village avec un seul café | Moyen, pas exceptionnel (masse critique) |
| Grande ville active | Haut |
| Zone pavillonnaire sans centralité | Bas |
| **Agglo réelle entière** (La Rochelle 17300 + Puilboreau 17286 + Lagord 17197 + Aytré 17028) | Lecture **plausible à l'échelle agglo** ; surveiller la sous-notation des périphéries intégrées (limite connue ci-dessous) |

Garde-fou : si la banlieue-dortoir score comme une petite ville vivante, ou si le village
touristique écrase tout, revoir `K` ou les pondérations de type de POI **avant** `--write-index`.
Le test agglo n'est pas un garde-fou bloquant (la sous-notation périphérique est une limite
assumée), mais il doit « raconter quelque chose de plausible » : le centre haut, les périphéries
graduées, pas d'aberration.

## Limite connue (première V2)

**La commune n'est pas toujours la bonne unité d'espace vécu.** Une commune résidentielle de
6 000 hab collée à une ville-centre de 8 000 hab est vécue comme **un seul espace** par
l'habitant, mais le rattachement communal des POI la fait apparaître pauvre en vie locale alors
qu'elle accède à pied/voiture à celle du centre. Le V1 **favorise les communes-centres et
sous-note les périphéries intégrées**. C'est la première limite qui apparaîtra.

Direction V2 (hors périmètre V1) : un **lissage intercommunal** (compter aussi, avec décote, les
POI/assos des communes immédiatement voisines ou du bassin de vie) plutôt qu'un strict
rattachement communal. Non retenu en V1 pour ne pas réintroduire la complexité d'échelle qu'on
a justement écartée, mais documenté comme l'évolution naturelle.

## Hors périmètre

- Événementiel, fréquentation, avis, réseaux sociaux (exclusions doctrinales).
- Pondération fine par type de POI et correction tourisme : raffinements V2 si la sonde les
  réclame.
- Polygones communaux (rattachement POI au centroïde le plus proche en V1).
