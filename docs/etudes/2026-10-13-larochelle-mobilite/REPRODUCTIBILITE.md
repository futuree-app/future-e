# Reproduire l'étude pour une autre commune

But : qu'un prochain article local « se déplacer depuis [commune] » parte d'une fiche factuelle déjà contrôlée, sans réexplorer le dépôt ni le Web. Ce n'est pas une usine de publication : l'outil extrait, calcule et contrôle ; il ne rédige pas et ne publie rien.

## 1. Ce qui est réexécutable, ce qui était de l'exploration

| Élément | Nature | Où |
|---|---|---|
| Modes, lieu de travail, possession/usage, statut d'occupation, qui vient travailler, voisines | **Réexécutable** | `outil/fiche_mobilite.py`, étape `mobpro` |
| Modes et équipement automobile par IRIS, stationnement | **Réexécutable** | étape `iris` |
| Accès depuis chaque adresse (BPE, bus GTFS) | **Réexécutable** (GTFS trouvé automatiquement, à relire) | étape `acces` |
| Prix des carburants autour de la commune, écart sur un an | **Réexécutable** | étape `carburant` |
| Scénario de surcoût par distance | **Semi-manuel** : la formule est fixe (`scripts/11_scenarios_carburant.py`), les kilomètres sont à choisir et vérifier pour chaque trajet type | `scripts/11` |
| Kilomètres routiers, contrôle d'itinéraires suspects | **Exploration** : appels ponctuels, résultats divergents selon le calcul, vérification humaine obligatoire | `scripts/04`, `scripts/08` |
| Échantillon d'itinéraires vélo (Puilboreau) | **Exploration** (test d'hypothèse) | `scripts/06` |
| Coupures par voies rapides (géométries OSM du produit) | **Exploration** (résultat négatif) | `scripts/12` |
| Rang national vélo / voiture | **Exploration** (agrégat national une fois) | `scripts/01` |
| Autopartage, vélos en libre-service | **Exploration** (flux GBFS propres à chaque réseau, pas de découverte automatique) | `scripts/09` |
| Scripts `01` à `12` | Trace de l'étude La Rochelle, codée en dur pour ces communes | `scripts/` |

## 2. Reproduire à l'identique les preuves publiées (finalisation du 13/10/2026)

**Instantanés conservés.** Les sources évolutives téléchargées le 13/10/2026 (BAN, GTFS Yélo et son index, prix des carburants dont l'instantané, GBFS, contours IRIS IGN, bases IRIS INSEE) sont archivées hors Git dans le checkout principal : `data/cache-etudes/2026-10-13-larochelle-mobilite/` (187 Mo, ignoré par un `.gitignore` local). `cache-outil/` est le cache de l'outil tel qu'il a produit la fiche ; `telechargements-initiaux/` contient ce que seuls les scripts d'exploration utilisaient. Empreintes complètes : `MANIFESTE_INSTANTANES.md` (copie versionnée du manifeste de l'archive). Les fichiers volumineux identiques entre les deux jeux (BAN, archives carburant, GTFS, base IRIS) n'y figurent qu'une fois : empreintes vérifiées égales.

**Entrées locales déjà présentes** (non copiées, empreintes au manifeste) : `data/rp-mobpro-2022.parquet` (7 388 023 lignes) et `data/bpe25.parquet` ; `data/comparateur-index.json.gz` est versionné (identique sur `a25fa9fd` et sur cette branche).

**Commande de reproduction** (aucun téléchargement : un instantané manquant arrête le calcul) :

```sh
python3 -m venv venv && venv/bin/pip install -r outil/requirements.txt   # Python 3.13.5
cp -R <checkout>/data/cache-etudes/2026-10-13-larochelle-mobilite/cache-outil cache
venv/bin/python outil/fiche_mobilite.py --hors-ligne --insee 17300 \
  --voisines 17200,17291,17028,17274,17094 --jour 2026-10-13 --out fiche --cache cache \
  --mobpro <checkout>/data/rp-mobpro-2022.parquet --bpe <checkout>/data/bpe25.parquet \
  --index <checkout>/data/comparateur-index.json.gz
```

**Résultat de la reproduction (une seule, 13/10/2026).** Environnement neuf (venv créé depuis `requirements.txt`) : préparation 20 s (dépendances) + copie des instantanés négligeable ; génération de la fiche 60 s. Les 11 faits et les 7 tableaux sont **identiques** à `fiches/17300/fiche.json` ; tous les contrôles automatiques sont verts ; aucun fichier n'a été ajouté au cache.

**Recalculable aujourd'hui, mais pas à l'identique :**
- Les réponses de geo.api.gouv.fr (nom, EPCI, centre de la commune) n'étaient pas mises en cache lors du calcul initial ; elles ont été capturées lors de la finalisation et sont signalées comme telles dans le journal. Donnée stable, sans effet sur les chiffres.
- Les itinéraires (IGN, OSRM) et la requête Overpass des scripts `04`, `06`, `08` et `12` interrogent des services vivants : leurs réponses du 13/10 sont conservées dans `resultats/` (`controle_routage/*.json`, `velo_premiere_couronne.csv`, `km_routiers.json`, `coupures_osm.json`), mais une relance donnera d'autres valeurs si les graphes changent. Aucun de ces résultats n'est utilisé dans l'article.
- Les scripts `01` à `12` (exploration) lisent les fichiers sous des chemins de session ; pour les relancer, leur passer les fichiers de l'archive.
- MOBPRO : la page INSEE indique une édition d'octobre 2026. Un nouveau téléchargement pourrait ne pas être identique au fichier local (empreinte au manifeste) ; c'est le fichier local qui fait foi pour cette étude.

## 3. Lancer une fiche pour une autre commune

```sh
python outil/fiche_mobilite.py --insee 79191 --jour 2026-10-13 \
  --out fiches/79191 --cache <cache partagé> \
  --mobpro <checkout>/data/rp-mobpro-2022.parquet \
  --bpe <checkout>/data/bpe25.parquet \
  --index <checkout>/data/comparateur-index.json.gz \
  [--voisines 79048,79003] [--gtfs auto|URL|aucun] [--rayon-carburant 12] [--etapes mobpro,iris,acces,carburant]
```

- Python 3.11+ avec les versions de `outil/requirements.txt` (hors venv du projet). Ajouter `--hors-ligne` pour interdire tout téléchargement et ne lire que le cache.
- Le cache est partagé entre communes : les archives carburant (≈ 60 Mo) ne sont parsées qu'une fois (`carburants_AAAA_AAAA.parquet`), les bases IRIS et la BAN d'un département une fois.
- Durée constatée : 1 min 30 par commune avec cache chaud, 2 à 3 min à froid.
- Sorties : `fiche.json` (faits structurés, tableaux, journal des sources), `fiche.md` (lecture humaine), `adresses.csv.gz` (une ligne par adresse, pour cartes).
- Testée le 13/10/2026 sur La Rochelle (reproduit l'étude à l'identique) et Niort (réseau Tanlib trouvé automatiquement, voisines automatiques).

## 4. Source par source

| Source | Récupération par code INSEE ou coordonnées | Automatisable | Contrôles automatiques (dans la fiche) | Vérification humaine |
|---|---|---|---|---|
| INSEE MOBPRO 2022 (fichier détail) | Filtre `COMMUNE` = INSEE (résidence) et `DCLT` = INSEE (travail). Fichier national local ou [téléchargeable](https://www.insee.fr/fr/statistiques/8589904) | Oui | Nombre de lignes = 7 388 023 ; égalité avec `mobilite.part_voiture` de l'index ; effectif par flux (`masqué` < 40 lignes, `fragile` < 150) ; intervalle à 95 % | Choix des voisines (change le chiffre « communes voisines ») ; PLM : la résidence est codée à l'arrondissement (`ARM`), non traité par l'outil |
| INSEE bases IRIS 2022 (Activité, Logement) | Filtre `COM` = INSEE | Oui | Somme des IRIS = fichier détail (écart < 0,5 point) ; IRIS de moins de 300 actifs comptés | Libellés d'IRIS avant de les écrire comme noms de quartiers ; commune non découpée → pas d'écart interne |
| IGN contours IRIS (WFS) | `CQL_FILTER=code_insee='…'` | Oui | Part d'adresses non rattachées à un IRIS | Aucune en général |
| geo.api.gouv.fr | `/communes/{insee}` : nom, département, EPCI, centre | Oui | Aucun | Aucune |
| BAN | Fichier départemental `adresses-{dep}.csv.gz` | Oui (rafraîchi au bout de 30 jours) | Via le rattachement IRIS | Aucune |
| BPE 2025 | Filtre `DEP` ; distances en Lambert 93 | Oui | Millésime lu dans la donnée (`AN`) | Catégories : hypermarchés inclus ici (B104), absents du produit |
| GTFS (transport.data.gouv.fr) | Commune → EPCI (geo.api) → jeux GTFS dont `covered_area` est cet EPCI et sous-type `urban` | Oui quand l'AOM est l'EPCI | Jour de référence dans la période de validité ; liste des lignes retenues (≥ 10 courses/jour) ; lignes à nom scolaire mais fréquentes signalées | **Toujours** : bon réseau ; AOM régionale ou syndicat mixte (pas de candidat : passer `--gtfs URL`) ; jour hors vacances scolaires ; lignes signalées |
| Prix carburants | Stations à `--rayon-carburant` km du centre communal ; archives annuelles | Oui | Nombre de stations (≥ 8 sinon « FAIBLE ») ; même semaine un an plus tôt | Contexte de l'évolution (aucune cause n'est produite par l'outil) ; refaire l'extraction la veille de la publication |
| Index futur•e | `data/comparateur-index.json.gz` : voisines (même unité urbaine, 6 plus peuplées), contrôle MOBPRO | Oui | Égalité MOBPRO | Les voisines automatiques peuvent manquer la commune de comparaison la plus utile au lecteur |

## 5. Cas qui demandent toujours un humain

1. **Le choix des communes comparées**, et sa raison écrite (l'outil prend l'unité urbaine par défaut).
2. **Le réseau de transport** et le jour de référence.
3. **Tout itinéraire** (temps, kilomètres) : trois calculs donnent des résultats différents ; aucun n'entre dans la fiche automatique.
4. **Toute explication causale** d'un écart (quartier, commune voisine) : la fiche ne contient que des constats.
5. **Les libellés** (IRIS, lignes, gares) avant publication.
6. **La date** : les flux « latest » (BAN, GTFS, prix) changent ; la fiche porte sa date de génération et le journal des sources (URL, date, empreinte SHA-256).

## 6. Briques réutilisables au-delà de cet article

- `Sources.fetch()` : cache, date de récupération et empreinte de chaque source.
- `fait()` : schéma d'un fait (valeur, définition, source, millésime, maille, statut, présence dans le moteur, limites, contrôles, vérification humaine). Il peut servir à d'autres thèmes (chaleur, risques) sans changement.
- `wilson()` : intervalle approximatif pour une part pondérée issue d'un échantillon INSEE.
- `choisir_gtfs()` : découverte d'un réseau urbain par EPCI.
- `base_carburants()` : base locale des prix 2 ans, construite une fois.

Ce qui n'est **pas** construit, volontairement : rédaction automatique, choix automatique d'un angle, publication, intégration au moteur.

**Rédaction par commune (13/10/2026).** `outil/dossier_redaction.py` transforme une fiche en dossier d'entrée de rédaction autonome (faits atomiques à identifiant stable, statuts, périmètres nommés, faits absents, paramètres éditoriaux, voix) ; le prompt et la procédure sont dans `redaction/`. Le choix de l'angle reste celui du rédacteur.
