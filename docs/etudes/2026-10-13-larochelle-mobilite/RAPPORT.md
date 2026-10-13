# Vivre à La Rochelle sans dépendre de la voiture : matière de l'article pilote

Étude du 13 octobre 2026. Révision examinée : `origin/main` = `a25fa9fd786f167859f68c4f81f528e50b5e5d8d` (FUT-90, 12/10/2026), dans un worktree détaché (`.claude/worktrees/etude-larochelle`). Le checkout principal (branche FUT-8, modifications en cours) n'a pas été touché. Aucun code moteur ou parcours modifié, aucune IA payante, aucune publication.

**Finalisé le 13/10/2026 : faits utilisables en section 7, bilan en section 8.**

Documents liés : `MANIFESTE_INSTANTANES.md` (empreintes des sources archivées) ; `MATRICE_ARTICLE_PRODUIT.md` (ce que le produit restitue réellement, promesses admissibles) ; `REPRODUCTIBILITE.md` et `outil/fiche_mobilite.py` (fiche factuelle réexécutable par code INSEE, testée sur La Rochelle et Niort) ; `fiches/` (fiches générées).

Statuts utilisés dans tout le document :
- **[calculé]** : résultat effectivement calculé, script et source cités ;
- **[interprétation]** : lecture d'un résultat, défendable mais discutable ;
- **[hypothèse]** : explication possible, non démontrée ;
- **[écarté]** : testé, non publiable.

---

## 0. Ce que j'ai appris d'utile pour l'article

1. **L'usage de la voiture varie fortement selon la commune où l'on travaille.** [calculé] Parmi les actifs qui habitent La Rochelle, ceux qui travaillent à La Rochelle déclarent la voiture comme mode principal dans 44 % des cas ; ceux qui travaillent dans une commune limitrophe (Périgny, Aytré, Lagord, Puilboreau), dans 72 % des cas, soit environ 28 points d'écart. Ce sont deux groupes distincts de résidents rochelais, distingués par leur commune de travail, et non les mêmes personnes observées dans deux situations. Le constat est une association : ces données ne mesurent pas ce qui, du lieu de travail, du quartier de résidence, de la profession ou des horaires, explique l'écart. [interprétation] Le titre de travail pose la question à l'échelle de la ville ; les données invitent à la poser aussi à l'échelle du trajet domicile-travail.

2. **Posséder une voiture et s'en servir pour travailler sont deux choses distinctes.** [calculé] À La Rochelle, parmi les actifs dont le ménage a au moins une voiture, 40 % ne déclarent pas la voiture comme mode principal pour aller travailler : 17 % le vélo, 9 % la marche, 8 % les transports en commun, 2 % un deux-roues motorisé, et 5 % aucun déplacement (travail à domicile). Parmi les actifs dont le ménage est propriétaire de son logement, 96 % vivent dans un ménage qui a au moins une voiture, et 22 % vont travailler à vélo. Pour un acheteur, la question honnête est « faudra-t-il s'en servir tous les jours ? » plutôt que « peut-on vivre sans voiture ? ».

3. **La Rochelle n'est pas un bloc : d'un quartier à l'autre, la part de la voiture va de 27 % à 71 %.** [calculé, IRIS INSEE 2022] Centre (Préfecture, Mairie, Marché) : 27 à 29 %. Laleu, La Pallice, Villeneuve-les-Salines Ouest : 69 à 71 %. C'est un écart plus grand qu'entre La Rochelle (53 %) et Puilboreau (83 %).

4. **Les commerces et le bus à proximité distinguent peu les quartiers rochelais.** [calculé] Dans Mireuil Est, 99 % des adresses ont un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d'oiseau, et au moins 8 passages de bus par heure à moins de 400 m entre 7 h et 9 h (toutes lignes et deux sens confondus) ; 67 % des actifs du quartier déclarent pourtant la voiture pour aller travailler. [interprétation] La proximité des services éclaire une partie du quotidien (courses, école, santé), mais elle ne suffit pas à expliquer les pratiques domicile-travail. Parmi les variables testées, celle qui varie le plus avec l'usage de la voiture est la position dans la ville (part des adresses à moins de 2 km de la gare, prise comme repère de centralité : corrélation de rang −0,64 sur 30 IRIS d'habitat). C'est une association entre quartiers, pas une explication.

5. **La hausse du carburant est réelle et datée ; son poids dépend surtout de la distance parcourue.** [calculé, flux officiel prix-carburants] Dans les stations à moins de 12 km de La Rochelle, le gazole médian est passé d'environ 1,55 €/L (semaine du 6 octobre 2025) à 2,29 €/L (semaine du 5 octobre 2026), soit environ +0,75 €/L ; le SP95-E10 de 1,63 à 2,13 €/L, soit environ +0,50 €/L (contrôle sur les mêmes stations en 2.7). La hausse démarre en mars 2026. [scénario] Pour un véhicule qui fait 200 allers-retours par an en consommant 6 L/100 km, le surcoût de carburant est d'environ 90 € par an pour 5 km aller, 270 € pour 15 km et 630 € pour 35 km (gazole). [hypothèses en 2.7]

6. **Une grande part de l'usage de la voiture vers La Rochelle vient de l'extérieur de l'unité urbaine.** [calculé] Sur ~50 600 actifs qui travaillent à La Rochelle, 40 % habitent hors de l'unité urbaine de La Rochelle (unité urbaine INSEE 2020 : 11 communes, à ne pas confondre avec l'agglomération intercommunale, qui en compte davantage), et 90 % d'entre eux déclarent la voiture comme mode principal. [interprétation] Leurs trajets sont plus longs que ceux des Rochelais : c'est sur ce type de trajet que la hausse du prix au litre pèse le plus (scénarios en 2.7). Pour un acheteur qui arbitre entre La Rochelle et une commune moins chère plus éloignée, c'est là que se trouve l'information utile, et c'est aussi la porte naturelle vers le comparateur.

7. **La Rochelle est une ville de vélo plus qu'une ville sans voiture.** [calculé] 18 % des actifs y vont travailler à vélo, deuxième rang sur 82 communes de taille comparable (25 000 à 80 000 actifs occupés résidents), derrière Grenoble (23 %). Pour la part de la voiture, elle est au 41e rang sur 82 : au milieu. Les transports en commun pèsent 12 %.

**Mon jugement sur l'angle.** L'accroche « hausse de l'essence » tient (le fait est avéré et sourcé), mais la question « est-ce possible de vivre à La Rochelle sans voiture ? » produit une réponse molle (« oui, en centre-ville, si on travaille en ville »). Les données racontent quelque chose de plus utile : **à La Rochelle, l'usage de la voiture pour aller travailler varie nettement selon le quartier et selon la commune de travail ; et, à prix égal, le surcoût de carburant est proportionnel à la distance : environ sept fois plus élevé pour 35 km aller que pour 5 km.** Je recommande de garder l'accroche carburant et de déplacer la question (section 4). Les faits utilisables tels quels sont listés en section 7.

---

## 1. Cartographie des données utiles

| Donnée | Source et millésime | Maille | Définition exacte | Disponibilité réelle | Limites |
|---|---|---|---|---|---|
| `mobilite.part_voiture` (index) | INSEE RP 2022, MOBPRO, via `scripts/populate-mobilite.py` | Commune de résidence | Actifs occupés de 15 ans ou plus allant travailler principalement en voiture (`TRANS = 5`) / tous les actifs occupés, **y compris** « pas de transport » (`TRANS = 1`), pondéré `IPONDI` | Dans l'index, **reproduit à l'identique** (La Rochelle 0,5328 ; Lagord 0,6811 ; Puilboreau 0,8253) | Domicile-travail seulement. Ni achats, ni école, ni loisirs. Ni la possession. Seuil 50 actifs pondérés |
| `mobilite.dependance` (index) | Même source | Commune | Percentile national de `part_voiture` (2 pour La Rochelle = parmi les 2 % les moins dépendantes) | Dans l'index | Rang, pas une part. Ne pas le citer comme pourcentage |
| Fichier détail MOBPRO 2022 | INSEE, `RP2022_mobpro.parquet`, 7 388 023 lignes, dictionnaire `varmod_mobpro_2022.csv` ([page](https://www.insee.fr/fr/statistiques/8589904)) | Individu, commune de résidence × commune de travail | Mode principal (`TRANS` 1 à 6), commune de travail (`DCLT`), lieu de travail (`ILT`), **voitures du ménage (`VOIT`)**, **statut d'occupation (`STOCD`)**, type de logement, type de ménage | Présent en local (`data/rp-mobpro-2022.parquet`, non versionné, checkout principal) ; le moteur n'en lit que `TRANS` | Échantillon (mode et lieu de travail viennent de l'exploitation complémentaire) : sous ~150 lignes, intervalles larges (cf. 2.9). `VOIT` est porté par l'actif : « actifs vivant dans un ménage sans voiture », pas « ménages sans voiture » |
| Part des ménages avec ≥ 1 voiture (artefact) | INSEE RP 2022, base IRIS Logement, `data/iris-logement.json` | IRIS (ou commune non découpée) | `P22_RP_VOIT1P / P22_RP` | Dans le dépôt, utilisée par le module Logement | Ne garde que la part ≥ 1 voiture |
| Base IRIS Logement 2022 complète | INSEE ([page](https://www.insee.fr/fr/statistiques/8647012)), téléchargée le 13/10/2026 | IRIS | Ménages sans voiture, 2 voitures ou plus, **ménages disposant d'un emplacement de stationnement réservé** (`P22_RP_GARL`) | Ajoutée pour l'étude | Estimation par sondage ; effectifs IRIS de quelques centaines |
| Base IRIS Activité des résidents 2022 | INSEE ([page](https://www.insee.fr/fr/statistiques/8647006)), téléchargée le 13/10/2026 | IRIS | **Mode de transport domicile-travail par IRIS** (`C22_ACTOCC15P_VOIT`, `_VELO`, `_MAR`, `_TCOM`, `_PAS`), travail dans la commune (`P22_ACTOCC15P_ILT1`) | Ajoutée pour l'étude ; **le moteur ne l'utilise pas** | Exploitation complémentaire, précision limitée à l'IRIS : arrondir à 5 points |
| Équipements BPE 2025 | INSEE BPE 2025, `data/bpe-points` (5 catégories) et `data/bpe25.parquet` (complet, non versionné) | Point (adresse de l'établissement) | `nearestByCategory` : distance à vol d'oiseau | Dans le dépôt | Point = adresse postale, pas l'entrée. Les catégories produit **excluent les hypermarchés (B104)** |
| Desserte bus | GTFS Yélo (NA Mobilités, [jeu](https://transport.data.gouv.fr/datasets/reseau-urbain-yelo)), fichiers du 09/10/2026, validité 07/10/2026 au 30/04/2027, téléchargé le 13/10/2026 | Arrêt, course | Courses distinctes passant à moins de 400 m, mardi 13/10/2026 | Ajouté pour l'étude ; **le moteur ne lit pas d'horaires** (`reseauLocal` = arrêts OSM à 1 km du centroïde) | Offre théorique, ni ponctualité, ni temps de trajet |
| Réseau local (index) | OSM, `scripts/populate-reseau-local.py` | Centroïde communal | Arrêts à moins de 1 km, pondérés, percentile | Dans l'index | Pas une fréquence, pas une mesure à l'adresse |
| `transport.gare_nom`, `gare_km` (index) | SNCF open data, `scripts/populate-transports.py` | Centroïde communal | Gare qui maximise fréquentation / (1 + (d/20)²) | Dans l'index | **N'est pas la gare la plus proche** : Rochefort et Surgères ont « La Rochelle, 26,5 / 30,9 km » alors qu'elles ont leur gare. Inutilisable comme distance à la gare |
| Itinéraires | IGN Géoplateforme, `bdtopo-valhalla` fastest (`src/lib/route-time.ts`) | Point à point | Durée calculée, voiture ou piéton | Utilisé par le produit | Pas de vélo ni de transports en commun ; écarts importants entre calculs (cf. 2.8) |
| Prix des carburants | Flux officiel [prix-carburants.gouv.fr](https://www.prix-carburants.gouv.fr/rubrique/opendata/) (archives 2025, 2026, instantané), téléchargé le 13/10/2026 10:25 UTC | Station | Prix déclaré et date de mise à jour | Ajouté pour l'étude (FUT-95) | Fraîcheur variable par station ; pas de prix « du quartier » |
| Autopartage, vélos en libre-service | GBFS Citiz La Rochelle (lu le 13/10/2026) ; GBFS VLS Yélo (data.gouv, mise à jour du 17/06/2026) | Station | 24 stations Citiz ; 137 stations vélo | Ajouté pour l'étude | Liste VLS possiblement datée |
| Prix immobiliers (index) | DVF 2021 à 2024, médiane €/m² | Commune (repli EPCI) | `logement.achat` | Dans l'index | Maille communale ; ne pas en faire un coût total (FUT-46) |
| Adresses | BAN `adresses-17.csv.gz`, téléchargée le 13/10/2026 | Adresse | Points d'adresse | Ajouté pour l'étude | Une adresse n'est ni un logement ni un ménage (pondération par IRIS, cf. 2.5) |

---

## 2. Résultats

Tous les tableaux sont reproductibles avec les scripts de `scripts/` (annexe A). Les fichiers produits sont dans `resultats/`.

### 2.1 Comment les actifs vont travailler, commune par commune [calculé]

MOBPRO 2022, actifs occupés de 15 ans ou plus, pondéré. Script `01_mobpro.py`.

| Commune (raison du choix) | Voiture | Vélo | Marche | TC | Pas de transport | Travaille dans sa commune | Actifs d'un ménage sans voiture | Ménage à 2 voitures ou plus |
|---|---|---|---|---|---|---|---|---|
| La Rochelle | 53 % | 18 % | 11 % | 12 % | 5 % | 70 % | 13 % | 31 % |
| Lagord (1re couronne nord) | 68 % | 13 % | 4 % | 7 % | 6 % | 26 % | 4 % | 56 % |
| Puilboreau (1re couronne nord-est, zone commerciale) | 83 % | 3 % | 2 % | 6 % | 4 % | 21 % | 3 % | 58 % |
| Aytré (1re couronne sud, gare) | 69 % | 13 % | 5 % | 8 % | 3 % | 27 % | 7 % | 44 % |
| Périgny (1re couronne est, zone d'activités) | 72 % | 13 % | 2 % | 7 % | 5 % | 27 % | 3 % | 54 % |
| Châtelaillon-Plage (même unité urbaine, gare, 13 km) | 72 % | 6 % | 6 % | 7 % | 8 % | 34 % | 4 % | 56 % |
| Rochefort (hors unité urbaine, ville moyenne avec gare) | 68 % | 8 % | 11 % | 8 % | 4 % | 63 % | 10 % | 40 % |
| Surgères (hors unité urbaine, gare) | 80 % | 3 % | 8 % | 5 % | 3 % | 40 % | 4 % | 52 % |
| France entière | 69 % | 3 % | 6 % | 15 % | 4 % | | | |

Points de vigilance :
- Le dénominateur de `part_voiture` inclut les actifs sans déplacement (travail à domicile). Hors ce groupe, La Rochelle passe de 53 % à 56 %.
- La part des **ménages** rochelais sans voiture est de 26,5 % (base IRIS Logement, tous ménages, retraités et étudiants compris) ; la part des **actifs** vivant dans un ménage sans voiture n'est que de 13 %. Ne pas confondre les deux dans l'article.
- Rang national [calculé] : parmi 82 communes de 25 000 à 80 000 actifs occupés résidents, La Rochelle est 2e pour le vélo (17,7 %, Grenoble 22,7 %, Angers 11,4 %) et 41e pour la part de voiture la plus basse.

### 2.2 Le lieu de travail [calculé]

Script `05_destinations.py`. Mode des actifs selon la commune où ils travaillent (flux de 40 lignes ou plus).

| Résidence → travail | Part des actifs de la commune | Voiture | Vélo | TC | Marche |
|---|---|---|---|---|---|
| La Rochelle → La Rochelle | 70 % | 44 % | 22 % | 11 % | 14 % |
| La Rochelle → Périgny | 5 % | 75 % | 14 % | 7 % | 2 % |
| La Rochelle → Aytré | 3 % | 72 % | 12 % | 10 % | 2 % |
| La Rochelle → Lagord | 2 % | 69 % | 15 % | 12 % | 3 % |
| La Rochelle → Puilboreau | 2 % | 73 % | 13 % | 12 % | 1 % |
| La Rochelle → Rochefort | 1,5 % | 82 % | 2 % | 15 % | 0 % |
| La Rochelle → Niort | 1,6 % | 68 % | 1 % | 30 % | 1 % |
| Lagord → La Rochelle | 40 % | 64 % | 20 % | 10 % | 2 % |
| Puilboreau → La Rochelle | 43 % | 81 % | 8 % | 7 % | 1 % |
| Périgny → La Rochelle | 36 % | 71 % | 20 % | 8 % | 0 % |
| Aytré → La Rochelle | 38 % | 67 % | 19 % | 10 % | 1 % |
| Châtelaillon-Plage → La Rochelle | 23 % | 84 % | 0 % | 11 % | 1 % |

Vue inverse, actifs qui **travaillent** à La Rochelle (≈ 50 600) :

| Origine | Part des emplois | Voiture | TC | Vélo |
|---|---|---|---|---|
| Habitent La Rochelle | 42 % | 44 % | 11 % | 22 % |
| Habitent le reste de l'unité urbaine | 18 % | 77 % | 8 % | 12 % |
| Habitent hors de l'unité urbaine | 40 % | 90 % | 6 % | 2 % |

Depuis Rochefort et Surgères vers La Rochelle, 20 à 21 % des actifs prennent les transports en commun (le train, vraisemblablement : [hypothèse], le fichier ne distingue pas train et car). Depuis Châtelaillon-Plage, qui a pourtant une gare à une dizaine de minutes de train, seulement 11 % ([hypothèse] la gare de Châtelaillon dessert le centre de La Rochelle, pas forcément les lieux de travail ; non vérifié).

### 2.3 Posséder, utiliser, dépendre [calculé]

La Rochelle, MOBPRO 2022. Population : actifs occupés résidant à La Rochelle, classés selon le statut d'occupation du logement de leur ménage (propriétaire, locataire) ; « ménage sans voiture » = part de ces actifs dont le ménage n'a pas de voiture.

| Groupe d'actifs | Voiture au travail | Vélo | Ménage sans voiture | Ménage à 2 voitures ou plus |
|---|---|---|---|---|
| Propriétaires | 54 % (52 à 57) | 22 % (21 à 24) | 4 % (3 à 5) | 47 % |
| Locataires du privé, logement vide | 50 % (48 à 53) | 18 % (16 à 20) | 17 % (15 à 19) | 23 % |
| Locataires HLM | 61 % (58 à 64) | 11 % | 19 % | 21 % |
| Maison | 56 % | | 4 % | |
| Appartement | 53 % | | 20 % | |

- Parmi les actifs rochelais dont le ménage a au moins une voiture, **40 % (39 à 42) ne déclarent pas la voiture comme mode principal pour aller travailler** : vélo 17 %, marche 9 %, transports en commun 8 %, deux-roues motorisé 2 %, aucun déplacement 5 %.
- Les actifs sans voiture au ménage vont travailler en TC (30 %), à vélo (24 %), à pied (23 %), et 15 % déclarent tout de même la voiture (covoiturage, véhicule de service : [hypothèse]).
- [interprétation] Pour un acheteur, les actifs dont le ménage est propriétaire vivent presque tous dans un ménage qui a une voiture (96 %), et près de la moitié dans un ménage qui en a deux. La dépendance quotidienne, elle, n'est pas plus forte que chez les locataires du privé. La question utile est « laquelle des deux voitures pourrait disparaître ? », ce qui renvoie au lieu de travail de chacun.
- [interprétation] Les locataires HLM, plus souvent sans voiture, vont plus souvent travailler en voiture que les propriétaires. Lecture possible : ceux qui travaillent loin ou en horaires décalés n'ont pas le choix ; ce n'est pas démontré ici.

### 2.4 Les quartiers de La Rochelle [calculé]

Bases IRIS INSEE 2022. Script `02_iris.py`. IRIS d'habitat seulement, arrondis à l'unité (précision réelle de quelques points).

| IRIS | Actifs | Voiture | Vélo | TC | Ménages sans voiture | Ménages avec stationnement réservé |
|---|---|---|---|---|---|---|
| Centre Préfecture | 1 290 | 27 % | 18 % | 17 % | 46 % | 17 % |
| Centre Mairie | 850 | 29 % | 18 % | 18 % | 43 % | 14 % |
| Centre Marché (place de Verdun) | 990 | 29 % | 22 % | 11 % | 40 % | 16 % |
| Centre Hôpital | 1 450 | 41 % | 22 % | 10 % | 28 % | 58 % |
| Les Minimes Université | 1 580 | 46 % | 13 % | 16 % | 41 % | 64 % |
| Fétilly-La Trompette | 1 310 | 50 % | **32 %** | 4 % | 11 % | 61 % |
| Mireuil Europe (place de l'Europe) | 710 | 54 % | 11 % | 17 % | 41 % | 29 % |
| Villeneuve-les-Salines Est (place du 14-Juillet) | 780 | 59 % | 14 % | 13 % | 29 % | 26 % |
| Mireuil Est | 1 080 | 68 % | 6 % | 14 % | 31 % | 41 % |
| La Pallice | 1 140 | 69 % | 8 % | 11 % | 24 % | 42 % |
| Laleu | 1 470 | 69 % | 10 % | 9 % | 21 % | 61 % |
| Villeneuve-les-Salines Ouest | 750 | 71 % | 9 % | 13 % | 28 % | 26 % |

Tableau complet (30 IRIS) : `resultats/iris_mobilite_2022.csv`.

- [calculé] Corrélations de rang avec la part de voiture (30 IRIS d'habitat) : adresses à moins de 2 km de la gare −0,64 ; vélo −0,53 ; ménages à 2 voitures ou plus +0,35 ; bus fréquent −0,26 ; panier quotidien à 500 m −0,25 ; ménages avec stationnement +0,10.
- [interprétation] Les trois places du mini-échantillon tombent dans trois IRIS très différents (29 %, 54 %, 59 % de voiture), alors que leurs commerces à proximité sont comparables. C'est la meilleure démonstration que la proximité commerciale ne dit pas la dépendance.
- [hypothèse] Mireuil et Villeneuve combinent beaucoup de ménages sans voiture et une forte part de voiture chez ceux qui travaillent. Explications possibles : destinations de travail en zones d'activités ou au port, horaires décalés, professions. Non testable avec ces fichiers (pas de croisement IRIS × destination). À ne pas écrire comme un constat.
- Stationnement [calculé] : 51 % des ménages rochelais disposent d'un emplacement réservé, 14 à 17 % dans l'hypercentre, 82 à 88 % en première couronne. [interprétation] Pour un acheteur qui garde une voiture, « où la garer ? » est une vraie question de centre-ville.

### 2.5 Services et bus depuis chaque adresse [calculé]

Script `03_acces_adresses.py`. Toutes les adresses BAN des 6 communes. Distances à vol d'oiseau. « Panier quotidien » = commerce alimentaire (supermarché, hypermarché, supérette, épicerie ou boulangerie) **et** pharmacie **et** école élémentaire à moins de 500 m.

**Ce que représentent ces pourcentages.** Chaque adresse reçoit le poids « ménages de son IRIS / nombre d'adresses de son IRIS ». À l'intérieur d'un IRIS, toutes les adresses pèsent donc autant : un immeuble de quarante logements compte comme une maison. Le résultat est une **part d'adresses**, dont seul le poids relatif des IRIS entre eux suit le nombre de ménages. Il ne faut pas l'écrire « part des ménages » ; la formulation fidèle est « part des adresses (pondérée par le nombre de ménages de chaque quartier) ». Dans les quartiers d'immeubles, où les ménages se concentrent sur peu d'adresses, l'écart avec une vraie part de ménages peut être important.

**Ce que représentent les indicateurs de bus.** Pour chaque adresse : nombre de passages de bus distincts (courses) sur les lignes régulières (1 à 22, navette Cœur de ville, Passeur ; scolaires, nuit, dimanche et stade exclues) à tous les arrêts situés à moins de 400 m à vol d'oiseau, **toutes lignes et deux sens confondus**, divisé par le nombre d'heures. Une même course qui dessert plusieurs arrêts proches n'est comptée qu'une fois (union des identifiants de course, `03_acces_adresses.py`, fonction `courses_par_heure`). Horaires **théoriques** du GTFS Yélo, mardi 13 octobre 2026, 7 h à 9 h et 20 h à 22 h. Ce n'est ni la fréquence d'une ligne, ni une liaison utile vers un lieu de travail, ni un temps de trajet.

| Part des adresses (pondérée par quartier) qui ont… | La Rochelle | Lagord | Puilboreau | Aytré | Périgny | Châtelaillon |
|---|---|---|---|---|---|---|
| un commerce alimentaire à 500 m | 92 % | 60 % | 78 % | 66 % | 70 % | 65 % |
| une grande surface (super ou hyper) à 500 m | 50 % | 43 % | 21 % | 29 % | 2 % | 0 % |
| une pharmacie à 500 m | 77 % | 47 % | 39 % | 28 % | 34 % | 44 % |
| un médecin généraliste à 500 m | 86 % | 50 % | 50 % | 39 % | 43 % | 63 % |
| une école élémentaire à 500 m | 68 % | 45 % | 33 % | 43 % | 48 % | 52 % |
| le panier quotidien complet à 500 m | 56 % | 31 % | 23 % | 26 % | 22 % | 34 % |
| ≥ 8 passages de bus/h à 400 m, 7 h à 9 h (toutes lignes, deux sens) | 86 % | 45 % | 13 % | 61 % | 43 % | 17 % |
| aucun passage de bus régulier à 400 m, 7 h à 9 h | 2 % | 4 % | 12 % | 11 % | 2 % | 11 % |
| ≥ 4 passages de bus/h à 400 m, 20 h à 22 h | 76 % | 24 % | 16 % | 65 % | 18 % | 0 % |
| une gare à 2 km | 72 % | 52 % | 7 % | 91 % | 0 % | 91 % |
| une station d'autopartage Citiz à 500 m | 62 % | 32 % | 32 % | 18 % | 22 % | 0 % |
| une station de vélos Yélo à 500 m | 95 % | 72 % | 56 % | 70 % | 73 % | 42 % |

- [interprétation] Puilboreau accueille la zone commerciale de Beaulieu, mais seulement environ 20 % de ses adresses ont une grande surface à 500 m : avoir des commerces sur sa commune ne veut pas dire les avoir à pied.
- [interprétation] Le soir, l'écart se creuse : environ trois adresses rochelaises sur quatre ont au moins 4 passages de bus par heure à proximité entre 20 h et 22 h, contre une sur six à une sur quatre à Puilboreau, Périgny, Lagord.
- **Usage éditorial recommandé** : ces indicateurs demandent une explication de méthode longue pour un apport secondaire. Dans le récit, ne garder qu'un ou deux ordres de grandeur (Mireuil Est, Puilboreau) ; le tableau complet va en méthode.

### 2.6 Première couronne : l'écart Puilboreau [calculé, cause non établie]

Vers La Rochelle, 20 % des actifs de Lagord et de Périgny et 19 % de ceux d'Aytré y vont à vélo, contre 7,5 % de ceux de Puilboreau. Les intervalles approximatifs de 2.9 ne se recouvrent pas (4 à 13 % contre 15 à 27 %), ce qui rend l'écart crédible sans en faire une preuve statistique formelle.

Test d'une explication par la distance ou un détour (script `06_velo_premiere_couronne.py`, 25 adresses tirées par commune, itinéraire vélo OSRM sur OSM vers la place de Verdun) :

| Commune | Vol d'oiseau médian | Vélo médian | Durée médiane | Détour |
|---|---|---|---|---|
| Lagord | 2,5 km | 3,8 km | 10 min | 1,47 |
| Puilboreau | 3,8 km | 5,1 km | 17 min | 1,35 |
| Aytré | 3,9 km | 5,2 km | 21 min | 1,30 |
| Périgny | 4,5 km | 5,7 km | 23 min | 1,22 |

[calculé] Puilboreau est plus proche du centre à vélo qu'Aytré ou Périgny, sans détour plus marqué. **La distance et le détour n'expliquent pas l'écart.**

Second test, avec les géométries OSM que le dossier d'adresse utilise déjà (`src/lib/logement-osm.ts`, FUT-15 : autoroutes, voies rapides, voies ferrées ; script `12_coupures_osm.py`) : part des adresses (pondérée par quartier) dont la ligne droite vers la place de Verdun franchit une voie rapide. Lagord 74 %, Puilboreau 89 %, Périgny 100 %, Aytré 4 %. [calculé] La coupure ainsi mesurée ne distingue pas Puilboreau : Périgny, aussi coupé, compte autant de cyclistes que Lagord. L'indicateur ignore ponts, passerelles et passages inférieurs, qui sont justement ce qui rend une coupure franchissable : il ne clôt pas la question, il écarte l'explication la plus simple. [hypothèse] Qualité et sécurité perçue des itinéraires (traversée de la N11 / RN 137 et de la zone de Beaulieu), destinations différentes dans La Rochelle, profils des ménages. Le profil vélo OSRM ne mesure ni le trafic ni le confort. **À ne pas publier comme une cause ; peut être publié comme une question ouverte.**

### 2.7 Carburant : la hausse, et ce qu'elle coûte selon la distance [calculé + hypothèses]

Script `07_carburants.py` (médianes hebdomadaires du dernier prix déclaré par station) et `11_scenarios_carburant.py`.

| Semaine | Gazole, France | Gazole, ≤ 12 km de La Rochelle | E10, France | E10, ≤ 12 km |
|---|---|---|---|---|
| 6 oct. 2025 | 1,590 | 1,554 | 1,664 | 1,632 |
| 23 févr. 2026 | 1,699 | 1,668 | 1,699 | 1,655 |
| 23 mars 2026 | 2,229 | 2,169 | 1,981 | 1,918 |
| 15 juin 2026 | 1,899 | 1,824 | 1,893 | 1,829 |
| 14 sept. 2026 | 2,419 | 2,391 | 2,179 | 2,165 |
| 5 oct. 2026 | 2,329 | 2,288 | 2,159 | 2,129 |

Instantané du 13/10/2026 (19 stations à moins de 12 km, prix mis à jour entre le 6 et le 13 octobre) : gazole 2,23 à 2,44 €/L (médiane 2,32) ; E10 1,99 à 2,28 €/L (médiane 2,15).

**Contrôle de la hausse (finalisation).** La série ci-dessus prend, chaque semaine, le dernier prix déclaré par chaque station dans la semaine, puis la médiane entre stations : une station qui ne déclare rien dans la semaine n'y figure pas, et un prix ancien n'est jamais reporté. Les deux semaines comparées réunissent 21 stations au gazole et 18 au SP95-E10. Contrôle sur les **mêmes stations** (`13_controle_prix_apparie.py`) : prix en vigueur aux dimanches 12/10/2025 et 11/10/2026, prix déclarés depuis plus de 7 jours écartés (une station affichait en octobre 2026 un prix vieux de 284 jours), écart médian station par station : **+0,75 €/L au gazole (20 stations, de +0,51 à +0,81) et +0,52 €/L au SP95-E10 (16 stations, de +0,27 à +0,55)**. Les deux méthodes concordent : on retient **environ +0,75 €/L (gazole) et +0,50 €/L (SP95-E10)**.

**Scénario publiable** (`11_scenarios_carburant.py`). Hypothèses : un véhicule qui fait le trajet domicile-travail aller-retour 200 jours par an, en consommant 6 L/100 km ; hausse de +0,75 €/L (gazole) ou +0,50 €/L (SP95-E10). Formule : km aller × 2 × 200 × 6 / 100 × hausse. Les distances ne sont attribuées à aucune commune : les kilométrages routiers par commune (`08_km_routiers.py`) ne sont pas vérifiés et sont **retirés de l'article**.

| Trajet aller | Km par an | Litres par an | Surcoût annuel, gazole | Surcoût annuel, SP95-E10 | Surcoût gazole si 5 à 7,5 L/100 km | Budget carburant annuel au prix d'octobre 2026 (gazole) |
|---|---|---|---|---|---|---|
| 5 km | 2 000 | 120 | ≈ 90 € | ≈ 60 € | 80 à 110 € | ≈ 270 € |
| 15 km | 6 000 | 360 | ≈ 270 € | ≈ 180 € | 220 à 340 € | ≈ 820 € |
| 35 km | 14 000 | 840 | ≈ 630 € | ≈ 420 € | 520 à 790 € | ≈ 1 920 € |

À dire avec le tableau : c'est un scénario pour **un véhicule** qui fait **ce trajet** ; c'est le **carburant seulement** (ni achat, assurance, entretien ou stationnement), pas un coût de mobilité ni un budget de ménage ; un ménage à deux trajets additionne deux lignes ; la hausse passée ne dit rien des prix futurs. **Aucune réaction des habitants à la hausse n'est mesurée** : les pratiques viennent du recensement 2022, les prix de 2025-2026.

- [interprétation] La hausse change peu le budget carburant d'un trajet de 5 km ; elle devient un poste visible quand le trajet dépasse une quinzaine de kilomètres. Elle ne renverse pas à elle seule un écart de prix immobilier de l'ordre de 2 000 €/m² entre La Rochelle (4 470 €/m² maison, DVF 2021 à 2024) et Rochefort (2 350 €/m²), mais elle rend ce choix plus sensible à un prix qui varie : environ +0,75 €/L en un an. [prudence FUT-46] Ne pas mettre ces deux chiffres dans une même somme.
- Contexte non vérifié : une annonce gouvernementale du 12/10/2026 (cession de stocks stratégiques) circule sur des sites de suivi ; aucune source officielle consultée. Ne pas l'utiliser.
- Les comportements mesurés par MOBPRO datent du recensement 2022 (collectes 2020 à 2024) : **avant la hausse**. On ne sait pas si elle a déjà changé les pratiques.

### 2.8 Contrôle du mini-échantillon précédent

| Résultat repris | Contrôle | Verdict |
|---|---|---|
| `part_voiture` La Rochelle 0,5328, Lagord 0,6811, Puilboreau 0,8253 | Réagrégation indépendante du parquet : identique à 4 décimales | **Confirmé**. Définition précisée en 2.1 |
| Europe → gare en voiture : 10,96 km / 24,1 min | Même requête IGN (`bdtopo-valhalla` fastest) : identique. L'itinéraire emprunte la rocade (N537, 6 km) pour contourner le centre. `bdtopo-valhalla` shortest : 4,4 km / 22,7 min ; `bdtopo-osrm` (IGN) : 4,6 km / 20,2 min ; OSRM sur OSM : 4,9 km / 11,5 min | **[écarté]** Pas une erreur de recalage (départ recalé à ~85 m), mais un choix de route d'un moteur dont la durée est elle-même plus longue que celle de la route courte. Trois calculs donnent 4,4 à 11 km et 11 à 24 min pour le même trajet : aucun ne peut alimenter un calcul carburant publié |
| Europe → supermarché : 96 m à vol d'oiseau, 554 m à pied | IGN piéton : 554 m ; OSRM piéton sur OSM : 305 m. Le point BPE est l'adresse postale (avenue Kennedy), pas l'entrée du magasin | **[écarté]** On ne peut pas trancher entre détour réel, passage absent du graphe et position du point. Conclusion publiable : le vol d'oiseau peut sous-estimer la marche d'un facteur 3 à 6 à courte distance |
| Marche vers la gare 25 / 31 / 56 min | IGN piéton Europe → gare 3,7 km ; OSRM piéton 4,1 km. Cohérents | Plausible, mais la gare BPE n'est pas une entrée vérifiée. Inutile pour l'article |
| Les trois places | Situées dans Centre Marché (29 % de voiture), Villeneuve-les-Salines Est (59 %), Mireuil Europe (54 %) | Échantillon remplacé par l'analyse de toutes les adresses (2.5) et des IRIS (2.4) |

### 2.9 Précision des chiffres MOBPRO

Intervalles à 95 % approximatifs (`10_incertitude.py` : effet des poids de Kish, majoré de 50 % pour l'effet ménage ; tableau complet : `resultats/incertitudes_mobpro.csv`). **Ce ne sont pas des marges d'erreur officielles de l'INSEE** : la majoration de 50 % est une hypothèse de prudence, le plan de sondage réel du recensement n'est pas reproduit. Ils servent à repérer les chiffres fragiles, pas à démontrer qu'un écart est statistiquement significatif. Dans l'article, on ne les cite pas ; on privilégie les grands écarts et des arrondis lisibles (« environ 44 % », « près de trois sur quatre »).

- Chiffres communaux de La Rochelle : ± 1 à 1,5 point.
- Flux Rochelais vers les communes limitrophes regroupées : ± 3,5 points.
- Flux d'une commune de première couronne vers La Rochelle : ± 5 à 8 points. Suffisant pour comparer 8 % et 20 %, pas pour classer 19 % et 20 %.
- IRIS : effectifs de 300 à 2 100 actifs estimés. Règle de prudence éditoriale (pas une garantie statistique) : ne commenter que des écarts de plus de 10 points, et privilégier les extrêmes (27 % contre 71 %).

---

## 3. Pistes éditoriales, classées

Classement : intérêt pour le lecteur (acheteur ou locataire qui connaît mal le secteur) × solidité.

### Piste 1 · « L'usage de la voiture varie avec la commune où l'on travaille » : solide, forte

- **Question du lecteur** : si j'habite ici, pourrai-je me passer de la voiture au quotidien ?
- **Résultat** : parmi les actifs résidant à La Rochelle, 44 % de ceux qui travaillent à La Rochelle déclarent la voiture, 72 % de ceux qui travaillent dans une commune limitrophe (environ 28 points d'écart, deux groupes distincts). 40 % des actifs dont le ménage a une voiture ne déclarent pas la voiture comme mode principal.
- **Intérêt** : déplace la question de la ville vers le trajet, et prépare naturellement « et pour mon adresse et mon lieu de travail ? ».
- **Conclusion abusive à éviter** : « travailler à Périgny oblige à prendre la voiture » (ce sont des pratiques, pas des contraintes démontrées) ; « le lieu de travail compte plus que l'adresse » (aucune part respective n'est mesurée) ; extrapoler aux trajets non professionnels.
- **Reste à vérifier** : rien de bloquant. Relire la définition dans le texte.

### Piste 2 · « D'un quartier à l'autre, la voiture passe de 27 % à 71 % » : solide, très visuelle

- **Question** : dans quel quartier chercher si je veux éviter la voiture ?
- **Résultat** : tableau 2.4 ; et la proximité des services ne sépare pas les quartiers (2.5).
- **Intérêt** : contredit l'intuition « commerces à côté = pas besoin de voiture » ; donne une carte utile, propre à futur•e (le moteur ne sert pas encore cette donnée à l'IRIS).
- **Abus à éviter** : attribuer les écarts à la « qualité » d'un quartier ; nommer des quartiers comme « dépendants » ; classer finement des IRIS séparés de quelques points ; expliquer Mireuil sans preuve.
- **Reste** : carte IRIS à produire ; relecture des noms d'IRIS (libellés INSEE).

### Piste 3 · « La hausse du carburant ne pèse pas pareil à 5 km et à 35 km » : solide sur les prix, scénario hypothétique

- **Question** : la hausse change-t-elle mon arbitrage entre La Rochelle et une commune moins chère ?
- **Résultat** : environ +0,75 €/L de gazole et +0,50 €/L de SP95-E10 en un an localement ; scénario gazole d'environ 90 € par an pour 5 km aller, 270 € pour 15 km, 630 € pour 35 km ; 40 % des emplois rochelais occupés par des actifs résidant hors de l'unité urbaine, à 90 % en voiture.
- **Intérêt** : justifie l'accroche d'actualité avec un fait sourcé ; porte vers le **comparateur de communes**.
- **Abus** : « la hausse va continuer » ; « habiter à Rochefort coûte X € de plus » (coût total inconnu) ; additionner prix immobilier et carburant ; présenter un kilométrage de moteur comme mesuré.
- **Reste** : vérifier les kilomètres de 2 ou 3 trajets types sur une carte ; dater la publication et les prix.

### Piste 4 · « Posséder, utiliser, dépendre » chez les propriétaires : solide, utile, moins visuelle

- **Résultat** : 96 % des actifs dont le ménage est propriétaire vivent dans un ménage qui a une voiture, 47 % dans un ménage qui en a deux ; 22 % vont travailler à vélo ; 40 % des actifs dont le ménage a une voiture ne la déclarent pas comme mode principal ; emplacement de stationnement réservé pour 14 à 17 % des ménages de l'hypercentre (base IRIS Logement, population : ménages).
- **Intérêt** : parle directement à l'acheteur (deuxième voiture, place de parking).
- **Abus** : « on peut vendre sa deuxième voiture » ; confondre ménages et actifs.

### Piste 5 · « Puilboreau, si proche et si peu cycliste » : résultat solide, explication ouverte

- Écart net (intervalles indicatifs qui ne se recouvrent pas), non expliqué par la distance, le détour ni les voies rapides à franchir. Intéressant comme question posée au lecteur (« vérifiez l'itinéraire, pas la distance »), dangereux comme explication. Je ne la mettrais pas au centre de l'article.

Pistes examinées et écartées pour cet article :
- **Chaleur, ombre** : les données climat de l'index sont communales (18 jours à plus de 30 °C par an à La Rochelle aujourd'hui) ; aucune donnée d'ombre sur les itinéraires dans le dépôt. Décoratif.
- **Relief** : altitude maximale 45 m ; décor, déjà évident.
- **Gare la plus proche via l'index** : champ inadapté (cf. tableau 1).
- **Trajets scolaires** : MOBPRO ne couvre que les actifs. Le fichier INSEE Mobilités scolaires existe ; non exploré (le mode de transport n'y est pas certain).

---

## 4. Angle recommandé pour l'article pilote

**Question précise.** « Avec un gazole à 2,30 €, peut-on habiter La Rochelle sans dépendre de la voiture ? Ce que changent le quartier et le lieu de travail. »

Variante plus sobre : « Vivre à La Rochelle sans dépendre de la voiture : ce que changent le quartier et le lieu de travail ».

**Découverte à mettre en avant.** Parmi les actifs qui habitent La Rochelle, 44 % de ceux qui travaillent à La Rochelle déclarent la voiture, contre 72 % de ceux qui travaillent dans une commune voisine ; et la part de la voiture va de 27 % à 71 % selon le quartier, alors que commerces et bus sont présents presque partout. Ce sont des associations, pas des causes mesurées. La hausse du carburant, réelle, pèse d'autant plus que le trajet est long : à prix égal, le surcoût est proportionnel aux kilomètres.

**Déroulé (structure du modèle local).**
1. Réponse courte : c'est déjà la pratique d'une partie des Rochelais ; elle varie nettement avec le quartier et la commune de travail, et se vérifie trajet par trajet.
2. Fait d'actualité daté : courbe des prix (2.7).
3. Constat 1 : le lieu de travail (graphique en barres, 2.2).
4. Constat 2 : le quartier (carte IRIS, 2.4) et pourquoi « commerces à côté » ne suffit pas (2.5).
5. Constat 3 : posséder ≠ utiliser, et la place de parking (2.3, 2.4).
6. Compromis : scénario carburant à 5, 15 et 35 km (2.7), sans coût total.
7. Ce que l'échelle communale et l'IRIS ne disent pas : votre itinéraire, vos horaires, la sécurité à vélo, l'entrée réelle des commerces.
8. Sources, dates, méthode.
9. Invitations : « Et pour cette adresse, avec votre lieu de travail ? » (dossier d'adresse) ; « Comparer La Rochelle, Lagord et Rochefort pour le même projet » (comparateur).

**Visuels.**
- Barres : mode de transport des actifs résidant à La Rochelle selon leur commune de travail (La Rochelle / quatre communes limitrophes / autres communes). Et, en vue inverse, les actifs travaillant à La Rochelle selon leur résidence (La Rochelle / reste de l'unité urbaine / hors unité urbaine).
- Carte choroplèthe IRIS de la part de la voiture, avec les trois places en repère.
- Courbe hebdomadaire gazole et SP95-E10, stations à moins de 12 km de La Rochelle et France, octobre 2025 à octobre 2026.
- Tableau du scénario carburant à 5, 15 et 35 km avec ses hypothèses visibles.
- Petit tableau propriétaires / locataires.

**Ce qu'on peut affirmer aujourd'hui.** Les chiffres MOBPRO 2022 (pratiques, domicile-travail, actifs), les bases IRIS 2022, la hausse des prix déclarés (flux officiel), les distances à vol d'oiseau aux équipements BPE 2025 et l'offre de bus théorique du GTFS d'octobre 2026, tous datés et sourcés.

**Ce qu'on ne peut pas affirmer.** Une cause aux écarts entre quartiers ou entre Lagord et Puilboreau ; un temps de trajet ; un coût total de mobilité ; que la hausse va durer ; que les pratiques de 2022 n'ont pas changé depuis.

**Points de contrôle avant publication.** Vérifier 2 ou 3 kilomètres routiers sur carte ; relire les libellés IRIS ; refaire l'extraction des prix la veille de la publication ; faire relire le texte par l'Editorial Writer (voix) et le Data Curator (usage honnête des bases IRIS).

---

## 5. Avis sur FUT-47

**Ce qu'on peut publier avec l'existant (moteur actuel).** La part de voiture domicile-travail par commune, correctement définie ; la proximité aux équipements BPE autour d'un point, en vol d'oiseau, avec le comptage à 500 m ; la présence d'arrêts OSM. Pas de distance à la gare depuis l'index.

**Ce que le produit sait déjà faire et que FUT-47 doit prendre comme base** (vérifié dans le code, parcours non joué) : une contrainte « près d'un lieu » déclarée par le lecteur (commune, gare, adresse ou lieu nommé), avec un seuil en kilomètres ou en minutes, en voiture ou à pied (`hard-constraints.ts`, `ROUTABLE_MODES = car, walk`), estimée par IGN au point de l'adresse dans le dossier (`decision/territory-facts.ts:170-195`) et utilisée comme filtre dans le comparateur. Le lieu de travail peut donc déjà être déclaré comme ce lieu ; ce qui manque, c'est ce que l'on en tire.

**Ce qui relève seulement de l'analyse éditoriale (fait dans cette étude, sans toucher au produit).** Destinations de travail et modes par flux (MOBPRO), voitures du ménage et statut d'occupation, modes par IRIS, fréquence des bus (GTFS), prix des carburants, scénarios de surcoût.

**Ce qui demande une évolution produit.**
- Nommer explicitement **le lieu de travail** parmi les lieux déclarables (la mécanique « près d'un lieu » existe) et en tirer davantage qu'un temps : c'est la variable la plus discriminante trouvée ici.
- Servir **la part modale de l'IRIS** de l'adresse : la base IRIS Activité est du même type que `iris-logement.json`, même chaîne de construction. Faible coût, forte valeur.
- Servir **le flux commune de résidence → commune de travail** depuis MOBPRO (« parmi les actifs qui font ce trajet, X % y vont en voiture »), avec un seuil d'effectif.
- Une **fréquence de bus** depuis les GTFS (national sur transport.data.gouv.fr) plutôt que la seule présence d'arrêts.
- Un **traitement de l'incertitude des itinéraires** : le calcul IGN utilisé par le produit (`bdtopo-valhalla` fastest) peut prendre la rocade et doubler la distance ; une durée affichée devrait être une fourchette ou s'accompagner d'une vérification utilisateur.
- Plus tard : vélo (aucun calcul disponible) et transports collectifs avec horaires (calculateur d'itinéraire), prix carburant à la station (FUT-95).

**Plus petit périmètre utile que l'étude justifie.**
> Une seule destination déclarée, le lieu de travail, en réutilisant la contrainte « près d'un lieu » existante, et le mode envisagé. En retour, en plus du temps estimé déjà calculé, trois éléments distincts : (1) ce que font les actifs du quartier (IRIS) ; (2) ce que font les actifs qui font le même trajet commune → commune (MOBPRO, effectif affiché) ; (3) l'inconnue nommée : itinéraire, horaires et confort non vérifiés, avec la liste de ce qu'il faut regarder.

C'est cohérent avec le critère de sortie de FUT-47 (question du ménage, donnée disponible, réponse admissible, inconnue restante) et cela ne demande aucune nouvelle API de mobilité. Le cas « personne sans voiture » et le cas « famille avec destination imposée » peuvent être joués sur ces trois éléments.

---

## 6. Observations sur le produit, relevées en passant (à trier, rien n'a été modifié)

1. `src/lib/comparateur-vie.ts` (critère `sans_voiture`, champ `aide`) : « Part des trajets du quotidien faisables autrement qu'en voiture ». La donnée mesure les trajets **domicile-travail** des **actifs**, réellement faits. `comparateur-labels.ts` dit juste (« Part des trajets domicile-travail faits autrement qu'en voiture ») ; les deux textes divergent.
2. `transport.gare_nom` / `gare_km` désignent la gare la plus « lourde », pas la plus proche (Rochefort et Surgères renvoient La Rochelle). `comparateur-vie.ts:878` en tire `s.train = { gare, desserte }`, transmis aux réponses de `/qna` (`app/qna/route.ts:108`) : une question sur Rochefort peut recevoir « gare La Rochelle, bien reliée ». Restitution exacte non vérifiée.
3. Catégorie `alimentation` des points BPE : les hypermarchés (B104) n'y sont pas.
4. `route-time.ts` : le calcul `fastest` d'IGN peut choisir un contournement plus long en distance **et** en durée annoncée que la route courte (cas Europe → gare). À instruire dans FUT-47.
5. Articles existants : la formule carburant de `agir/dependance-auto` (litres × hausse) est correcte ; l'exemple « 2 000 €/an → +1 000 € pour +0,50 €/L » relevé dans le document de pilotage reste à corriger (FUT-52).

---

## 7. Faits utilisables pour la rédaction (version finalisée)

Formulations à reprendre telles quelles ou presque. Toutes portent sur des **actifs occupés** et leurs **trajets domicile-travail** (INSEE, recensement 2022), sauf mention contraire. « La voiture » = mode principal déclaré ; le total inclut les actifs qui ne se déplacent pas pour travailler.

| # | Fait | Population et source | Formulation conseillée |
|---|---|---|---|
| F1 | 53 % des actifs résidant à La Rochelle déclarent la voiture pour aller travailler, 18 % le vélo, 12 % les transports en commun, 11 % la marche | Actifs résidant à La Rochelle, MOBPRO 2022 | « Un peu plus de la moitié des actifs rochelais vont travailler en voiture ; près d'un sur cinq à vélo. » |
| F2 | 2e part de vélo sur 82 communes de taille comparable, au milieu du classement pour la voiture | Communes de 25 000 à 80 000 actifs résidents, MOBPRO 2022 | « Une ville de vélo plus qu'une ville sans voiture. » |
| F3 | 44 % de voiture parmi les Rochelais qui travaillent à La Rochelle, 72 % parmi ceux qui travaillent dans une des quatre communes limitrophes, soit environ 28 points d'écart | Deux groupes distincts d'actifs résidant à La Rochelle, MOBPRO 2022 | « Chez les Rochelais, l'usage de la voiture varie nettement avec la commune où l'on travaille. » Association, sans hiérarchie causale |
| F4 | 40 % des actifs dont le ménage a au moins une voiture ne la déclarent pas comme mode principal (vélo 17 %, marche 9 %, TC 8 %, deux-roues motorisé 2 %, aucun déplacement 5 %) | Actifs résidant à La Rochelle, ménage motorisé, MOBPRO 2022 | « Avoir une voiture ne veut pas dire la prendre pour aller travailler. » |
| F5 | 96 % des actifs dont le ménage est propriétaire vivent dans un ménage motorisé, 47 % dans un ménage à deux voitures ou plus ; 22 % vont travailler à vélo | Actifs résidant à La Rochelle, ménage propriétaire, MOBPRO 2022 | À citer sans « les propriétaires » au sens de ménages : ce sont des actifs |
| F6 | Selon le quartier (IRIS), la part de la voiture va de 27 % (Centre Préfecture) à 71 % (Villeneuve-les-Salines Ouest) | Actifs, IRIS d'habitat, base IRIS 2022 | Citer les extrêmes et les grands écarts ; ne pas classer finement, ne pas expliquer |
| F7 | Un quart des ménages rochelais n'a pas de voiture (26,5 %) ; dans l'hypercentre, 14 à 17 % des ménages disposent d'une place de stationnement réservée | **Ménages** (tous, retraités et étudiants compris), base IRIS Logement 2022 | Ne pas comparer directement aux parts d'actifs |
| F8 | Sur ~50 600 actifs qui travaillent à La Rochelle, 40 % habitent hors de l'unité urbaine de La Rochelle ; 90 % d'entre eux déclarent la voiture | Actifs travaillant à La Rochelle, MOBPRO 2022 ; unité urbaine INSEE 2020 (11 communes) | Dire « hors de l'unité urbaine » (ou « au-delà de la ville et de sa proche couronne »), jamais « hors agglomération » |
| F9 | Dans les stations à moins de 12 km de La Rochelle, gazole d'environ 1,55 à 2,29 €/L et SP95-E10 d'environ 1,63 à 2,13 €/L entre début octobre 2025 et début octobre 2026, soit environ +0,75 et +0,50 €/L ; la hausse démarre en mars 2026 | Prix déclarés au flux officiel prix-carburants.gouv.fr ; contrôle sur les mêmes stations | Daté et sourcé ; refaire l'extraction avant publication |
| F10 | Scénario : environ 90 €, 270 € et 630 € de carburant en plus par an pour 5, 15 et 35 km aller (gazole ; 60, 180 et 420 € au SP95-E10) | Un véhicule, 200 allers-retours par an, 6 L/100 km | Toujours avec ses hypothèses, « carburant seulement », sans commune associée |
| F11 | Exemple de quartier : à Mireuil Est, presque toutes les adresses ont commerce, pharmacie et école à moins de 500 m et des bus fréquents à proximité, et 67 % des actifs déclarent la voiture | Adresses BAN × BPE 2025 × GTFS (méthode en 2.5) ; actifs, base IRIS 2022 | « Les services à proximité éclairent une partie du quotidien, mais ne suffisent pas à expliquer les trajets vers le travail. » |

**À garder en méthode, hors du récit principal** : le tableau d'accès par commune (2.5), les indicateurs de passages de bus, l'autopartage et les vélos en libre-service, les intervalles approximatifs (2.9).

**Retiré de l'article** : kilomètres routiers et surcoûts attribués à des communes (Lagord, Rochefort, Surgères…) ; tout temps de trajet ; toute explication de l'écart Puilboreau et des écarts entre quartiers (question ouverte possible, sans cause) ; la comparaison carburant / prix immobilier sous forme de somme ; l'annonce gouvernementale non vérifiée sur le gazole.

---

## 8. Bilan de finalisation (13/10/2026)

**Conservé** (preuve suffisante) : F1 à F8 ; la hausse des prix (F9), confirmée par deux méthodes concordantes ; l'exemple Mireuil Est (F11) ; les contrôles du mini-échantillon (2.8).

**Corrigé** :
- « deux fois moins souvent » → 44 % contre 72 %, environ 28 points ;
- « même population » → deux groupes de résidents distingués par leur commune de travail ;
- « le lieu de travail pèse plus que l'adresse », « la destination change tout », « ce qui compte vraiment » → constats d'association, sans hiérarchie causale ;
- « les services ne répondent pas à la question » → ils éclairent une partie du quotidien, sans suffire à expliquer les trajets vers le travail ;
- « hors agglomération » → « hors de l'unité urbaine » (périmètre réellement calculé) ;
- « 40 % ne prennent pas la voiture » → « ne la déclarent pas comme mode principal », avec la part sans déplacement (5 %) et celle du deux-roues motorisé (2 %) ;
- « actifs propriétaires » → actifs dont le ménage est propriétaire ;
- « part des ménages » pour l'accès depuis les adresses → part des adresses pondérée par quartier (hypothèse : toutes les adresses d'un IRIS pèsent autant, un immeuble compte comme une maison) ;
- « bus/h » → passages de bus toutes lignes et deux sens confondus, une course comptée une fois même si elle dessert plusieurs arrêts proches, horaires théoriques du mardi 13/10/2026 ;
- hausse +0,73 / +0,50 €/L → environ +0,75 / +0,50 €/L, après contrôle sur les mêmes stations ;
- intervalles et seuil de 10 points → présentés comme repères de prudence, pas comme précision officielle ni preuve de significativité.

**Transformé en scénario** : surcoût carburant à 5, 15 et 35 km aller, hypothèses affichées.

**Retiré** : surcoûts et kilométrages attribués à des communes ; temps de trajet ; explications causales des écarts.

**Reproduction** : instantanés archivés hors Git avec manifeste d'empreintes ; outil doté d'un mode hors ligne ; une reproduction de la fiche La Rochelle dans un environnement neuf (20 s de préparation, 60 s de génération) donne des faits et tableaux **identiques** à la référence. Limites restantes : réponses des services d'itinéraire et d'Overpass non rejouables à l'identique (non utilisées dans l'article) ; geo.api capturé après coup ; parquet MOBPRO local (empreinte au manifeste) qui fait foi face à une éventuelle réédition INSEE.

**Conclusion : prêt pour rédaction**, avec les faits F1 à F11 et les retraits listés en section 7. Avant publication : refaire l'extraction des prix carburant et relire les libellés d'IRIS cités.

---

## Annexe A · Reproduction

Scripts (dans `scripts/`, Python 3.13 avec pandas, pyarrow, numpy, shapely, pyproj ; exécutés hors du venv du projet) :

| Script | Entrées | Sorties |
|---|---|---|
| `01_mobpro.py` | `data/rp-mobpro-2022.parquet` | `mobpro_resultats.json`, `communes_25k_80k_actifs.csv` |
| `02_iris.py` | bases IRIS Activité et Logement 2022 | `iris_mobilite_2022.csv`, `communes_depuis_iris_2022.csv` |
| `03_acces_adresses.py` | BAN 17, contours IRIS IGN, `data/bpe25.parquet`, GTFS Yélo | `adresses_acces.csv.gz`, `acces_resultats.json` |
| `04_controle_routage.sh` | API IGN, OSRM FOSSGIS | `controle_routage/*.json` |
| `05_destinations.py` | parquet MOBPRO | `modes_par_destination.csv` |
| `06_velo_premiere_couronne.py` | `adresses_acces.csv.gz`, OSRM vélo | `velo_premiere_couronne.csv` |
| `07_carburants.py` | archives prix-carburants 2025, 2026, instantané | `carburants_hebdo_*.csv`, `carburants_instantane_LR_12km.csv` |
| `08_km_routiers.py` | API IGN | `km_routiers.json` |
| `09_partage.py` | GBFS Citiz, GBFS VLS Yélo | `partage_resultats.json` |
| `10_incertitude.py` | parquet MOBPRO, index | `incertitudes_mobpro.csv` |
| `11_scenarios_carburant.py` | hypothèses écrites dans le script | `scenarios_carburant.csv`, `prix_reference.json` |
| `12_coupures_osm.py` | `adresses_acces.csv.gz`, Overpass | `coupures_osm.json` |
| `13_controle_prix_apparie.py` | `carburants_2025_2026.parquet` (cache de l'outil) | `controle_prix_apparie.json` |

Sources et dates de récupération (13/10/2026, UTC) :
- INSEE MOBPRO 2022 : parquet local (7 388 023 lignes, nombre identique à la page INSEE) ; dictionnaire `https://www.insee.fr/fr/statistiques/fichier/8589904/varmod_mobpro_2022.csv` (10:13).
- INSEE bases IRIS 2022 : `.../fichier/8647006/base-ic-activite-residents-2022_csv.zip`, `.../fichier/8647012/base-ic-logement-2022_csv.zip` (10:17).
- IGN contours IRIS : WFS `STATISTICALUNITS.IRISGE:iris_ge` par `code_insee` (10:18).
- BAN : `https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-17.csv.gz` (10:20).
- GTFS Yélo : `https://www.data.gouv.fr/api/1/datasets/r/030b9c31-4237-4355-a4d5-842861d225be` (10:20).
- Prix carburants : `https://donnees.roulez-eco.fr/opendata/annee/2025`, `/annee/2026` (fichier du 12/10/2026 22:37), `/instantane` (10:25).
- GBFS : Citiz `https://backend.citiz.fr/public/provider/18/gbfs/v3.0/station_information.json` (10:29) ; VLS Yélo `https://www.data.gouv.fr/api/1/datasets/r/50482a12-2b65-4e04-8021-4b5081cb6605`.
- Itinéraires : IGN Géoplateforme `/navigation/itineraire` et `/geocodage/search` ; OSRM `routing.openstreetmap.de` (10:22 à 10:35).

Les téléchargements bruts sont archivés hors Git dans `data/cache-etudes/2026-10-13-larochelle-mobilite/` du checkout principal (cf. `REPRODUCTIBILITE.md`, section 2) ; les URL ci-dessus servent à recalculer avec des données plus récentes, pas à reproduire à l'identique. Les flux « latest » (BAN, GTFS, prix) évoluent : les résultats sont datés du 13/10/2026.
