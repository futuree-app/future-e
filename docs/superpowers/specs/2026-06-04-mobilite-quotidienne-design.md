# Mobilité du quotidien (chantier #6, GTFS / TC urbains) — design

Date : 2026-06-04
Statut : design validé, prêt pour plan d'implémentation.

## Problème

Le comparateur porte deux critères de mobilité : `acces_transports` (accès ferroviaire
pondéré desserte, logique d'**ouverture du territoire**) et `faible_dependance_auto` (part
voiture domicile-travail MOBPRO, un **comportement observé**). Aucun ne répond à la question
de la **mobilité du quotidien** : un habitant peut-il raisonnablement se déplacer sans
voiture depuis chez lui, grâce à un réseau de transports en commun de proximité (bus, tram,
métro) ?

## Intention

Nouveau critère opt-in **distinct**, mesurant **l'offre locale de mobilité du quotidien** :
la présence d'un réseau de TC **à portée de marche** du lieu de vie. Pas l'existence d'une
desserte quelque part dans la commune, mais la possibilité réelle d'un usage quotidien sans
voiture.

Philosophie identique aux autres critères d'accès (BPE, rail, écoles, culture) : **simple,
explicable, robuste, calculable nationalement**. On construit un indicateur d'**accès à un
réseau**, PAS un indicateur d'exploitation : zéro fréquence, zéro horaire, zéro parsing des
`stop_times`. Le parsing fin des fréquences GTFS a été explicitement écarté (complexité
difficile à maintenir et à expliquer).

## Identité du critère

- **Clé** : `mobilite_quotidienne`.
- **Libellé** : « Se déplacer au quotidien sans voiture ».
- **Champ index** : `c.reseauLocal = { acces, tram, metro, arret_km } | null`.
  - `acces` : score 1-100 (percentile parmi les communes desservies, cf. Normalisation).
  - `tram`, `metro` : booléens (mode structurant desservant la proximité immédiate).
  - `arret_km` : distance au plus proche arrêt (km), pour le récit/glose.
  - `null` = commune **non desservie** (aucun arrêt à portée).
  - **Surtout pas** réutiliser `c.mobilite` (dépendance auto) ni `c.transport` (rail).
- **Mode d'affichage** (dérivé, hiérarchie explicite métro > tram > bus) :
  `meilleur_mode = metro ? "métro" : tram ? "tram" : (acces != null ? "bus" : null)`.
  Résout l'ambiguïté du « mode dominant » : Paris `{tram, metro}` → « métro » ;
  Strasbourg / Bordeaux `{tram}` → « tram » ; desservie bus seul → « bus ».
- **Opt-in strict** : rural non pénalisé hors critère (le subScore n'existe que si la clé est
  demandée). Propriété assumée : à l'échelle marche, une large part des communes françaises
  aura un accès **nul** (masse de zéros). C'est honnête : c'est exactement ce que « sans
  voiture au quotidien » veut dire.

## Sources de données

Téléchargées hors runtime (comme le rail), pas de fichier local versionné.

1. **Couverture (arrêts)** : `gtfs_stops_france_export` — CSV national consolidé de tous les
   GTFS de la plateforme. Source : transport.data.gouv.fr, dataset
   « Arrêts de transport en France »
   (`https://transport.data.gouv.fr/resources/81333/download`, à jour janvier 2026).
   Colonnes utiles : `stop_id, stop_name, stop_lat, stop_lon, location_type`.
   - **Pas de `route_type` / mode** dans ce fichier.
   - **Arrêts non dédoublonnés** : un même point physique apparaît plusieurs fois s'il est
     couvert par plusieurs GTFS (urbain + régional). → dédoublonnage spatial obligatoire.
   - Filtrer aux vrais arrêts d'embarquement : `location_type` ∈ {0, vide}.
2. **Mode structurant (tram / métro)** : **OpenStreetMap via Overpass**, et non le GeoJSON
   national de lignes (le seul existant date de 2021, 300 Mo, stale ; écarté après recherche).
   OSM cartographie tram et métro de façon **à jour et exhaustive** en France, et le repo a un
   précédent (la base cyclable vient d'un export OSM national). On récupère des **nœuds
   ponctuels** d'arrêts (pas de géométrie de ligne à traiter) :
   - `node["railway"="tram_stop"]` → mode **tram** (mesuré : ~3 326 nœuds en France).
   - stations `subway` (`node["railway"="station"]["station"="subway"]`, `["subway"="yes"]`,
     `node["station"="subway"]`) → mode **métro** (mesuré : ~488 nœuds, cohérent Paris + 5 métros
     régionaux).
   - Requête Overpass filtrée sur la France (`area["ISO3166-1"="FR"][admin_level=2]`), ~3 800
     nœuds, ~1 Mo, un seul appel. Le mode se lit **directement dans le tag** du nœud.
   - Garde-fou Overpass (rate-limit / indispo au script-time) : le script **cache la réponse
     brute OSM** dans `data/.cache/` (gitignoré) et la réutilise ; option `--refresh-osm` pour
     forcer un re-fetch.

## Métrique

1. **Dédoublonnage des arrêts.** Réduire les arrêts à une grille fine (~50 m) : un arrêt
   unique par cellule occupée. Évite que les zones multi-réseaux soient mécaniquement
   gonflées.
2. **Couverture pondérée.** Pour chaque commune (centroïde lat/lon de l'index) :
   `couverture = Σ` sur arrêts dédoublonnés à distance `d <= R` de `(1 − d/R)`. Décroissance
   linéaire forte ; `R` petit (échelle marche). **`R` à figer par sonde** (cf. Validation).
3. **Facteur mode.** `facteur = metro ? 2.0 : tram ? 1.5 : 1.0`, où `tram`/`metro` sont vrais
   si un **nœud OSM** du mode correspondant (tram_stop / station subway) est à `d <= R` du
   centroïde. Détection ponctuelle directe (mêmes grille + haversine que la couverture, aucune
   géométrie de ligne). Valeurs 1.5 / 2.0 = boutons à régler.
4. **Score brut.** `acces_raw = couverture × facteur`.

## Normalisation (exception assumée au patron percentile national)

Le patron habituel (percentile national de `acces_raw`) **casserait le ranking** ici : avec
60-70 % de communes à `acces_raw = 0`, `bisect_right(srt, 0) ≈ 0,7·n`, donc toutes les
communes à zéro recevraient un score ≈ 70/100. Une commune **sans aucun réseau** noterait 70
sur « se déplacer sans voiture » : absurde, et c'est le même « déforme le signal » que sur
BPE.

Correctif :
- `acces_raw == 0` → `c.reseauLocal = null`, et `subScore = 0`.
- `acces_raw > 0` → `acces` = percentile **parmi les seules communes desservies**
  (`acces_raw > 0`), rééchelonné 1-100.

Logique produit en deux temps : (1) y a-t-il un réseau de mobilité quotidienne accessible à
pied ? (2) si oui, quelle est la qualité relative de cet accès parmi les communes
desservies ? Préférer cette exception explicite à un score national homogène mais
produitement faux.

`subScore(mobilite_quotidienne, c) = c.reseauLocal?.acces ?? 0` (pas de réseau = 0, puisque
l'utilisateur a explicitement demandé les TC).

## Câblage TS

Script `scripts/populate-reseau-local.py` (venv `.venv-bpe`, numpy ; `--write-index`). Grille
fine adaptée au petit rayon (CELL ~0.02°, voisinage élargi pour couvrir `R` en longitude au
nord, cf. piège grille BPE/rail).

Six points de câblage (cf. patron rail/BPE), dans `comparateur-vie.ts` + `comparateur-labels.ts` :
- `PREFERENCE_KEYS` : ajouter `mobilite_quotidienne` (cluster mobilité).
- `subScore` : `c.reseauLocal?.acces ?? 0`.
- `REASON_POS` / `REASON_NEG` : « desservie par un {meilleur_mode} » /
  « peu ou pas de transports en commun de proximité ».
- `PREFERENCE_LABELS` : « Se déplacer au quotidien sans voiture ».
- `PREFERENCE_TOOLTIP` : ≤ 2 phrases, « pourquoi ça aide », sans méthodo ni source. Ex. :
  « Indique si un réseau de bus, tram ou métro dessert les environs immédiats. Mesure la
  possibilité de s'y déplacer au quotidien sans dépendre d'une voiture. »
- `AMBIENT_DIMENSIONS` : id `mobilite_quotidienne` (« et côté transports du quotidien ? »),
  en surveillant le recouvrement avec l'ambiant rail (`transports`).

Pièges de câblage connus (mémoire mobilité) :
- **`synthesize/route.ts` a son PROPRE `PREF_LABELS`** : l'y ajouter, sinon le critère demandé
  est filtré du récit de synthèse.
- **Parse** (`parse/route.ts`) : router les termes **TC explicites** (« transports en commun »,
  « bus », « tram », « métro », « réseau local », « se déplacer sans voiture ») vers
  `mobilite_quotidienne`. « sans voiture » seul reste sur `faible_dependance_auto` (comportement
  observé) ; les deux sont cumulables, jamais déduits du rural/familial.
- **Cache index dev** : après `--write-index`, une vraie modif de `comparateur-vie.ts` (pas un
  simple `touch`) pour réinitialiser `indexCache`.

## Gloses honnêtes

Le critère mesure la **présence d'un réseau de TC à portée de marche**, rehaussée si un mode
structurant (tram / métro) dessert la proximité immédiate. Il NE mesure PAS la fréquence, les
horaires, ni l'exploitation du réseau. Le mode lourd est un **proxy de qualité**, pas une
mesure de fréquence réelle. Le centroïde communal est une **approximation V1** (grossière
pour une commune étendue ou éclatée). Sources à jour 2026 (arrêts GTFS national + tram/métro
OSM) : pas de dette de fraîcheur. Idéal V2+ : temps d'accès réels, fréquences.

## Validation

Procédure : après `--write-index`, **toucher `comparateur-vie.ts`** pour invalider
`indexCache`. Puis `npx tsc --noEmit` + `npm run lint` + curl réel sur `/api/comparateur-vie/match`.

Validation décisive, qualitative :

1. **Sonde du rayon (AVANT de figer R).** Comparer le comportement du score à `R = 500 m`,
   `1 km`, `1,5 km` sur des communes réelles (cœur de métropole, banlieue dense, ville
   moyenne, village). C'est le paramètre le plus sensible du chantier : on le règle sur
   preuve, pas a priori.
2. **Témoin masse de zéros.** Nombre de communes à `acces_raw = 0` (attendu : large
   majorité), et forme de la distribution des desservies (le percentile parmi desservies
   doit rester informatif).
3. **Matrice témoins** :

| Cas | Attendu |
|---|---|
| Paris (métro + tram + bus, cœur dense) | Très haut |
| Strasbourg / Bordeaux (tram) | Haut, boosté par le tram |
| Ville moyenne avec tram vs ville moyenne bus seul (taille comparable) | La ville-tram devant |
| Banlieue dense desservie (métro/tram à pied) | Haut |
| Village rural sans arrêt | `acces = null`, score 0 |

Garde-fou anti-inversion : le boost mode ne doit pas faire passer une banlieue-tram **devant**
un cœur de métropole (la couverture du cœur, ×2, doit dominer). Si une de ces lignes échoue,
revoir `R` ou les valeurs de `facteur` avant `--write-index`.

## Hors périmètre

- Fréquences / horaires GTFS (`stop_times`), temps d'accès réels (isochrones) : V2+.
- Vélo / marche comme modes propres.
- Polygones communaux (mesure au centroïde en V1).
- Fusion avec `acces_transports` (rail) : explicitement refusée, ce sont deux besoins
  distincts.
