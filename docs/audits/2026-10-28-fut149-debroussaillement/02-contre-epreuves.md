# FUT-149 · 2. Contre-épreuves : la lecture contre l'oracle, la carte officielle et les arrêtés

> 28/10/2026, édition IGN du 01/03/2026. Scripts : `scripts/research/fut149/` (voir son LISEZ-MOI) ; sorties
> durables dans `~/Documents/futuree-debroussaillement/analyses/`.

## 1. La lecture de l'application contre les polygones d'origine (oracle indépendant)

20 000 points tirés au hasard (graine fixe) : 10 000 à moins de 120 m d'une limite de zone, 10 000 dans l'emprise
élargie de 3 km de zones prises au hasard. Vérité : Shapely sur les polygones **Lambert-93 d'origine** (aucune
tuile, aucun arrondi, aucune projection). Lecture : `lireDebroussaillement` sur les tuiles WGS84 de l'application.

| | Résultat |
|---|---|
| Points concordants | **20 000 / 20 000** |
| États lus | en limite 8 128 · hors zone 7 593 · en zone 4 274 · incertain 5 (objet « O » de Savoie) |
| Règle de concordance | dedans à plus de 50 m d'une limite → en zone ; dehors à plus de 50 m → hors zone ; à moins de 50 m → en limite, avec une distance dite seulement dehors. Une marge de 0,5 m autour du seuil de 50 m (arrondi au 1e-7 degré, projection locale). |
| Temps de lecture | 2,3 ms par point (tuiles en mémoire) |

Les coupes de tuile (bords de cellule de 0,1°) ne sont jamais prises pour des limites : aucun point n'est « en
limite » à cause d'elles (tests synthétiques aussi, section 1 de `fut149-debroussaillement.test.ts`).

## 2. La carte officielle (service WFS de la Géoplateforme)

300 points de l'échantillon, à plus de 60 m de toute limite (150 dedans, 150 dehors), interrogés en direct avec un
prédicat `INTERSECTS` côté serveur (Lambert-93, `zonage = 2`) : **300 / 300 concordants**, 0 erreur ; latence
médiane 105 ms, p90 169 ms. Le service sert donc la même édition que le téléchargement.

(Piège relevé : un filtre `BBOX` sur ce service compare les emprises, pas les géométries : 116 faux positifs sur
300. Il n'est utilisé nulle part.)

## 3. Les arrêtés de classement, commune par commune

Annexes de l'arrêté du 6 février 2024 dans leur version du **13 avril 2026** (et du 20 mai 2025 pour comparaison).
Communes : contours de geo.api.gouv.fr ; massifs : objets `ZONAGE = 1` ; zones : `ZONAGE = 2`.

### 3a. Annexe 1 (L132-1) : les massifs de la base sont-ils dans les communes listées ?

25 départements avec une liste de communes, plus l'Essonne et la Seine-et-Marne (massifs nommés dans le texte).

| Constat | Départements |
|---|---|
| **Aucun massif de plus d'1 ha situé entièrement hors des communes listées** | 26 sur 27 |
| Loiret : 52 massifs « hors liste » | **faux écart** : l'arrêté écrit « SAINT-FLORENT », la commune s'appelle Saint-Florent-le-Jeune (seule de ce nom dans le Loiret) |
| Sarthe : 4 noms non appariés | communes fusionnées (Laigné-en-Belin, Saint-Gervais-en-Belin, Saint-Mars-de-Locquenay, Volnay) |
| Zones à plus de 200 m de toute commune listée | Loire 737 ha (Le Bessat, massif du Pilat), Vienne 202 ha (Colombiers), Côtes-d'Armor 40 ha, Eure 27 ha, Deux-Sèvres 16 ha : **massifs à cheval** sur une commune listée et sa voisine. La documentation IGN (§ 2.2) ne coupe ni les massifs ni les bandes aux limites communales. Lecture défendable de l'arrêté (« massifs situés dans les communes de… ») ; pas une contradiction. |
| Communes listées sans massif | Haute-Garonne 34 (classement limité à l'aléa « fort ou très fort » : attendu), Maine-et-Loire et Sarthe (la base ne publie que des zones, pas de massifs : vérifié sur les zones) |

### 3b. Annexe 2 (L133-1) : la base publie-t-elle des zones dans les communes exclues ?

Neuf départements excluent des communes entières. Critère : zone publiée **à plus de 200 m** du bord de la
commune exclue (une bande venue d'une commune voisine ne peut pas aller si loin).

| Département | Communes exclues | Zones à plus de 200 m du bord |
|---|---|---|
| Pyrénées-Atlantiques | 228 (liste « ensemble des massifs ») | **0** (la seconde liste, « massifs de moins de 4 ha », n'exclut pas les grands massifs) |
| Alpes-de-Haute-Provence, Hautes-Alpes, Aveyron, Drôme, Lot-et-Garonne, Hautes-Pyrénées, Tarn | 13 à 315 | **0** massif de plus d'1 ha |
| **Vaucluse** | 8 | **3 communes** : Richerenches (100 ha), Lapalud (54 ha), Jonquières (4 ha) |

**Vaucluse : contradiction réelle.** Les huit communes sont exclues depuis l'arrêté de 2025 (même liste en 2026) ;
la base (zonage de la préfecture, cartes de 2019, arrêté préfectoral du 22/10/2025, intégré au 01/01/2026) y
publie pourtant des zones. Traitement : `scripts/debroussaillement/exclusions-arretes.json` les recense ; la
lecture y rend **« incertain »** (« le zonage publié y place une zone alors que l'arrêté de classement exclut les
bois de cette commune »), jamais « dans la zone ». À refaire à chaque édition (le script de construction prévient
si l'édition change).

### 3c. Verdict sur les arrêtés

Une contradiction significative sur 52 départements, limitée à trois communes et neutralisée ; aucune ailleurs.
Le seuil de NO GO de la mission (« contredisent les arrêtés dans des cas significatifs ») n'est pas atteint.

## 4. Les adresses de recette (BAN et cadastre du 28/10/2026)

Tableau produit par la lib de production (`lireDebroussaillement`) sur les tuiles extraites (`__fixtures__/fut149`).
Logement : parcelle quand elle est rattachée au point, unique et mesurable, géocodage au numéro ; sinon le point.
Autour : le point seul.

| Adresse (BAN) | Géocodage · grain | Logement | Autour (point) | Titre Logement |
|---|---|---|---|---|
| 55 Allée Fructidor Pyla, La Teste-de-Buch | numéro · parcelle | en zone (100 %) | en zone | Terrain dans le zonage publié |
| 4 Rue Jean Beyrie, La Teste-de-Buch | numéro · point (parcelle par proximité) | hors zone | hors zone | Hors du zonage publié |
| 28 Rue Etienne Bonis, Cazaux, La Teste-de-Buch | numéro · parcelle | en limite, à cheval (19 %) | en limite (dedans) | Terrain à cheval sur la limite du zonage |
| 41bis Rue Raymond Daugey, La Teste-de-Buch | numéro · parcelle | en limite, bordure | en limite (15 m) | Terrain en limite du zonage |
| 253 Route du Roy, Landiras | numéro · parcelle | en zone (100 %) | en zone | Terrain dans le zonage publié |
| 1634 Rue Joachim de Chalup, Landiras | numéro · point (proximité) | en zone | en zone | Adresse dans le zonage publié |
| 1362 Route de la Fauville, Gonfaron | numéro · parcelle | en zone (100 %) | en zone | Terrain dans le zonage publié |
| 80 Avenue Maréchal Foch, Gonfaron | numéro · parcelle | en limite, à cheval (10 %) | en limite | Terrain à cheval sur la limite du zonage |
| 268 Chemin de l'Esparron, Gonfaron | numéro · point (proximité) | hors zone | hors zone | Hors du zonage publié |
| Place de la Victoire, Gonfaron | lieu-dit · point | en limite (5 m) | en limite (5 m) | Adresse en limite du zonage |
| 805 Avenue de la Baie, Fréjus | numéro · parcelle | en zone (100 %) | en zone | Terrain dans le zonage publié |
| 390 Boulevard de la Libération, Fréjus | numéro · point (sans parcelle) | hors zone | hors zone | Hors du zonage publié |
| 177 Avenue Andrei Sakharov, Fréjus | numéro · parcelle | en limite, à cheval (13 %) | en limite | Terrain à cheval sur la limite du zonage |
| 1070 Chemin de Font Aubarne, Nîmes | numéro · parcelle | en zone (100 %) | en zone | Terrain dans le zonage publié |
| 864 Avenue du Maréchal Juin, Nîmes | numéro · parcelle | hors zone | hors zone | Hors du zonage publié |
| 5 Rue Blériot, Nîmes | numéro · parcelle | en limite, à cheval (57 %) | en limite | Terrain à cheval sur la limite du zonage |
| 55 Chemin des Sables, Saint-Denis-d'Oléron | numéro · parcelle | en zone (100 %) | en zone | Terrain dans le zonage publié |
| 36 Rue Marc Guyonnet, Saint-Denis-d'Oléron | numéro · parcelle | hors zone | hors zone | Hors du zonage publié |
| **13** Chemin Boudet, Saint-Denis-d'Oléron | numéro · point (proximité) | en limite | en limite (dedans) | Adresse en limite du zonage |
| **855** Chemin Boudet, Saint-Denis-d'Oléron | numéro · parcelle | hors zone | hors zone | Hors du zonage publié |
| Chemin Boudet (rue seule) | rue · point (secteur) | en limite | en limite | Adresse en limite du zonage |
| 1 Place de la Bourse, Bordeaux | numéro · point (point à 8 mm du tracé de la parcelle : « sur la limite », revue du 29/10/2026) | hors zone (Gironde couverte) | hors zone | Hors du zonage publié |
| 20 Place Bellecour, Lyon | numéro · point | non couvert (Rhône) | non couvert | Aucun zonage publié pour ce département |
| 1 Cours Napoléon, Ajaccio | numéro · parcelle | hors zone (2A couvert) | hors zone | Hors du zonage publié |

**Dans et hors zonage au sein d'une même commune** : La Teste-de-Buch (Pyla / centre), Gonfaron (Fauville /
Esparron), Fréjus (Baie / Libération), Nîmes (Font Aubarne / Maréchal Juin), Saint-Denis-d'Oléron (13 et 855 du
même chemin Boudet). **Landiras** : 57 adresses relevées sur une grille de la commune, toutes dans la zone.

**Gonfaron** : la commune a brûlé sur 6 832 ha en 2021 (BDIFF, FUT-147) ; l'audit FUT-82 situait « le bourg » hors
zone. Sur l'édition du 01/03/2026, le centre (avenue Foch, place de la Victoire) est **à la limite** de la zone,
pas en dehors : la carte des bois du Var date de 2008, et l'écran le dit.

Le contrôle a été refait par le **vrai chemin serveur** (`lireDebroussaillementAdresse` : `fetch`, empreintes
SHA-256, cache) contre une imitation locale de l'API Storage servant l'**édition complète** (2 453 tuiles) :
48 lectures sur 48 identiques à la lib pure (`scripts/research/fut149-storage-local.mjs`).

## 5. Revue du 29/10/2026

- **Vraies limites alignées sur la grille**, mesurées sur l'édition nationale construite (sans la reconstruire) :
  64 220 km d'arêtes posées sur un bord de cellule ; là où la cellule voisine n'a pas de zone juste de l'autre côté,
  il reste 3 segments de 1 à 3 cm (artefacts d'arrondi au croisement d'une limite et de la grille). La correction
  ne change donc aucune lecture réelle de cette édition ; elle rend la règle juste pour toute édition.
- **Avant/après sur les 24 adresses** : états, parts et causes identiques, sauf Bordeaux (lecture au point : le
  point est à 8 mm du tracé de la parcelle).
- **Publication** : `scripts/debroussaillement/publier.test.mjs` (8 scénarios, Storage simulé), voir le README.
