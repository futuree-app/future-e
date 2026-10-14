## A. Question et format

**Question principale.** À Angers, dans quels secteurs et pour quels lieux de travail les actifs vont-ils moins souvent travailler en voiture ?

**Ce que la réponse apprend au lecteur.** Deux choses varient fortement et sont propres à Angers.
- **Selon le secteur**, la part de la voiture va de 27 % à 76 %, soit 49 points d'écart (`iris.voiture.min`, `iris.voiture.max`, `ecart.iris.voiture.max_moins_min`).
- **Selon la commune de travail**, elle est de 44 % pour ceux qui travaillent à Angers et de 76 % pour ceux qui travaillent dans les six communes nommées (`mobpro.voiture_selon_destination.*`, `ecart.voiture_destination.voisines_moins_meme_commune`).

**Lien avec une recherche de logement.** L'adresse et le lieu de travail se choisissent ensemble. La hausse du carburant (`carburant.gazole.*`, `carburant.e10.*`, `scenario.carburant.*`) rend la question concrète. Trois éléments complètent la réponse : avoir une voiture sans la prendre pour aller travailler (`mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture`), la proximité des équipements par secteur (colonne `panier_500m`) et le stationnement réservé (`iris.menages_commune.menages_stationnement_reserve`, colonne `stationnement_reserve`).

**Format.** Article complet.

**Pistes écartées :**
- « Qui vient travailler à Angers » : l'unité urbaine n'a pas de liste de communes, donc je ne peux pas présenter ce groupe correctement.
- Statut d'occupation (propriétaires, locataires) : n'apporte rien au choix d'une adresse.
- Indicateur d'accès pondéré de la commune entière : il alourdirait le texte et ne se compare pas aux secteurs.
- Section 5 (habitants des six communes) : sort de la question.
- Faits bus : en attente de validation, donc non écrits.

---

## B. Article

# Angers : selon le secteur, de 27 % à 76 % des actifs vont travailler en voiture

**Le plein coûte nettement plus cher qu'il y a un an. Pour qui cherche un logement à Angers, une question se pose vite : depuis quelle adresse, et pour quel lieu de travail, peut-on moins dépendre de la voiture ? Les trajets domicile-travail des actifs de la ville donnent des repères, secteur par secteur.**

## Un plein plus lourd, une distance qui compte

La semaine du 5 octobre 2026, le prix médian du gazole atteint 2,33 € le litre dans les stations situées dans un rayon de 12 km autour d'Angers. C'est 0,75 € de plus qu'un an plus tôt. Le SP95-E10 est à 2,16 €, en hausse de 0,51 €.

Le tableau ci-dessous traduit cette hausse en surcoût annuel pour trois longueurs de trajet. Les hypothèses sont simples :
- une voiture qui consomme 6 litres aux 100 km ;
- 200 allers-retours domicile-travail par an ;
- la hausse médiane arrondie à 5 centimes.

Seul le carburant est compté.

[VISUEL : Tableau du scénario de surcoût de carburant]

Au moment de choisir un logement, on fixe en même temps la distance au travail et la façon de la parcourir. C'est donc par les trajets réels des actifs qu'il faut commencer.

## D'un secteur à l'autre, une autre place pour la voiture

D'après le recensement de 2022, 54 % des actifs qui habitent Angers vont travailler principalement en voiture. Ce niveau est voisin de la médiane des villes de taille proche, qui est de 57 % (voir la méthode). Ce chiffre d'ensemble cache pourtant de grands écarts entre secteurs. Ces parts portent sur tous les actifs qui habitent le secteur, où qu'ils travaillent.

- **Où la voiture est la moins utilisée.** Dans le secteur Voltaire, 27 % des actifs vont travailler en voiture. Viennent ensuite Ralliement, Mail et Boisnet, entre 32 % et 35 %. Dans ces secteurs, la marche est plus répandue qu'ailleurs : 28 % des actifs de Voltaire et 33 % de ceux de Boisnet vont travailler à pied.
- **D'autres modes ailleurs.** À Brisepotière, 23 % des actifs vont travailler à vélo. À Henri Dunant, 33 % prennent principalement les transports en commun.
- **Où elle l'est le plus.** Dans le secteur Croix Blanche, 76 % des actifs vont travailler en voiture, soit 49 points de plus qu'à Voltaire.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

Devant une annonce, un premier geste utile : repérer sur la carte le secteur de l'adresse et voir comment les actifs qui y vivent vont travailler.

## Travailler à Angers ou en dehors

L'adresse ne dit pas tout du trajet : il faut aussi savoir où l'on travaille. 67 % des actifs qui habitent Angers travaillent aussi à Angers, et parmi eux 44 % y vont en voiture.

Prenons maintenant les actifs d'Angers qui travaillent à Trélazé, Avrillé, Les Ponts-de-Cé, Saint-Barthélemy-d'Anjou, Verrières-en-Anjou ou Bouchemaine. Pour eux, la part de la voiture atteint 76 %, soit 32 points de plus. Pour ceux qui travaillent hors d'Angers et hors de ces six communes, elle est de 73 %.

Une destination fait exception : parmi les actifs d'Angers qui travaillent à Nantes, 61 % y vont principalement en transports en commun.

[VISUEL : Barres : part de la voiture selon la commune de travail]

Prendre moins la voiture ne veut pas dire s'en séparer. Parmi les actifs d'Angers dont le ménage a au moins une voiture, 39 % ne la déclarent pas comme mode principal pour aller travailler. Ceux qui travaillent chez eux sont comptés dans ce chiffre.

## Et pour les courses, l'école ou la pharmacie ?

Le trajet du travail n'est qu'une partie de la semaine. Les courses, l'école et la pharmacie font aussi partie de la vie à une adresse. Ce que l'on mesure ici, c'est la présence de trois équipements à moins de 500 m à vol d'oiseau de chaque adresse : un commerce alimentaire, une pharmacie et une école élémentaire.

- **Dans les secteurs où la voiture est peu utilisée** pour aller travailler, ces trois équipements sont presque toujours à portée. C'est le cas pour toutes les adresses de Ralliement et de Mail, et pour 98 % de celles de Voltaire.
- **À Europe**, toutes les adresses ont aussi les trois à moins de 500 m, et pourtant 69 % des actifs y vont travailler en voiture.
- **À Vauban**, seules 6 % des adresses ont les trois équipements réunis, ce qui ne veut pas dire qu'il n'y en a aucun. 48 % des actifs y vont travailler en voiture.

Pour une adresse donnée, ce sont donc deux questions à poser séparément : ce qui se trouve près de chez soi, et comment se fera le trajet du travail.

## À vérifier pendant les visites

**Le stationnement.** 54 % des ménages d'Angers ont un emplacement réservé au stationnement. Dans le secteur Voltaire, c'est 17 % des ménages, et 19 % à Ralliement. Si vous gardez une voiture, vérifiez dès l'annonce si une place est comprise.

**Les transports en commun.** Le réseau de transport urbain de la communauté urbaine Angers Loire Métropole s'appelle Irigo. Il indique que :
- ses trams A, B et C circulent toute la semaine de 5 h à 1 h ;
- ses lignes 30 à 42 circulent du lundi au samedi de 7 h à 19 h 30.

Quelles lignes passent près de l'adresse, et à quelles heures ? Vérifiez-le sur irigo.fr, pour l'heure à laquelle vous partez travailler et celle à laquelle vous rentrez.

## Votre projet, votre adresse

Se rapprocher de son travail, s'installer en famille, préparer une retraite : chaque projet pose ses propres questions à une adresse. Sur futur•e, examinez celle que vous envisagez à partir de votre projet, en regardant ensemble la mobilité, les services proches, la chaleur de l'été et les risques.

### Méthode et sources

**Pratiques domicile-travail.**
- Source : INSEE, recensement 2022 (collectes 2020 à 2024). Fichier détail Mobilités professionnelles et bases infracommunales Activité des résidents et Logement.
- Population : actifs occupés de 15 ans ou plus. On retient le mode principal déclaré pour aller travailler, et les personnes qui travaillent chez elles sont comptées dans le total.
- Ce sont des estimations par sondage : les petits écarts entre secteurs ne sont pas significatifs.
- Les parts par commune de travail portent sur des groupes distincts de personnes. Elles décrivent des pratiques, pas l'effet d'un changement d'emploi.
- Les parts par secteur et par commune de travail ne se croisent pas.

**Secteurs.** Ce sont les secteurs statistiques (IRIS) d'habitat comptant au moins 300 actifs. Leurs noms sont ceux de l'INSEE et ne correspondent pas toujours aux noms d'usage des quartiers.

**Les six communes.** Trélazé, Avrillé, Les Ponts-de-Cé, Saint-Barthélemy-d'Anjou, Verrières-en-Anjou et Bouchemaine ont été choisies automatiquement : ce sont les plus peuplées de l'unité urbaine d'Angers, dans la limite de six.

**Stationnement.** Les parts portent sur tous les ménages (résidences principales).

**Repère de comparaison.** Le groupe comprend 32 communes de France métropolitaine, hors Angers. Chacune est la plus grande de son unité urbaine par le nombre d'actifs occupés résidents. Chacune compte entre la moitié et le double des actifs d'Angers, avec un nombre minimal de lignes d'échantillon. Le chiffre retenu est la médiane des parts communales : chaque commune compte une fois.

**Équipements.**
- Sources : INSEE, Base permanente des équipements 2025 ; Base adresse nationale.
- On mesure des parts d'adresses du secteur et des distances à vol d'oiseau. À pied, le chemin réel peut être nettement plus long.
- La proximité d'un équipement ne dit pas s'il est utilisé.

**Carburant.**
- Source : prix-carburants.gouv.fr.
- On prend la médiane, entre les stations, du dernier prix déclaré dans la semaine. Les stations retenues sont dans un rayon de 12 km à vol d'oiseau autour du centre d'Angers.
- Semaines du 6 octobre 2025 et du 5 octobre 2026.

**Réseau Irigo.** Informations publiées sur irigo.fr et transport.data.gouv.fr, consultées le 14 octobre 2026.

---

## C. Correspondance interne (non publiée)

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Titre | 27 % | `iris.voiture.min` (iris.490070105.voiture) | oui |
| Titre | 76 % | `iris.voiture.max` (iris.490070901.voiture) | oui |
| Carburant | 5 octobre 2026 (semaine) | `carburant.gazole.prix` | oui |
| Carburant | 2,33 € | `carburant.gazole.prix` | oui |
| Carburant | 12 km | `carburant.gazole.prix` (périmètre) | oui |
| Carburant | 0,75 € | `carburant.gazole.ecart` | oui |
| Carburant | 2,16 € | `carburant.e10.prix` | oui |
| Carburant | 0,51 € | `carburant.e10.ecart` | oui |
| Carburant | 6 litres aux 100 km | `scenario.carburant.*` (hypothèses, section 7) | oui |
| Carburant | 200 allers-retours | `scenario.carburant.*` (hypothèses, section 7) | oui |
| Carburant | 5 centimes | `scenario.carburant.*` (hypothèses, section 7) | oui |
| Secteurs | 2022 | `mobpro.modes.voiture` (millésime) | oui |
| Secteurs | 54 % | `mobpro.modes.voiture` / `comparaison.voiture.commune` | oui |
| Secteurs | 57 % | `comparaison.voiture.mediane_groupe` | oui |
| Secteurs | 27 % (Voltaire) | `iris.voiture.min` / iris.490070105.voiture | oui |
| Secteurs | 32 % (Ralliement) | iris.490070107.voiture | oui |
| Secteurs | 35 % (Boisnet) | iris.490070106.voiture | oui |
| Secteurs | 28 % (marche Voltaire) | iris.490070105.marche | oui |
| Secteurs | 33 % (marche Boisnet) | iris.490070106.marche | oui |
| Secteurs | 23 % (vélo Brisepotière) | iris.490070204.velo | oui |
| Secteurs | 33 % (TC Henri Dunant) | iris.490070803.tc | oui |
| Secteurs | 76 % (Croix Blanche) | `iris.voiture.max` / iris.490070901.voiture | oui |
| Secteurs | 49 points | `ecart.iris.voiture.max_moins_min` | oui |
| Lieu de travail | 67 % | `mobpro.travaille_dans_commune` | oui |
| Lieu de travail | 44 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Lieu de travail | 76 % | `mobpro.voiture_selon_destination.communes_voisines` | oui |
| Lieu de travail | 32 points | `ecart.voiture_destination.voisines_moins_meme_commune` | oui |
| Lieu de travail | six (communes) | `mobpro.voiture_selon_destination.communes_voisines` (liste) | oui |
| Lieu de travail | 73 % | `mobpro.voiture_selon_destination.ailleurs` | oui |
| Lieu de travail | 61 % (Nantes, TC) | destination.44109.tc | oui |
| Lieu de travail | 39 % | `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | oui |
| Courses | 500 m | iris.*.panier_500m (définition) | oui |
| Courses | toutes les adresses (Ralliement, Mail) | iris.490070107.panier_500m (100 %), iris.490070109.panier_500m (100 %) | oui |
| Courses | 98 % (Voltaire) | iris.490070105.panier_500m | oui |
| Courses | toutes les adresses (Europe) | iris.490070805.panier_500m (100 %) | oui |
| Courses | 69 % (Europe) | iris.490070805.voiture | oui |
| Courses | 6 % (Vauban) | iris.490070407.panier_500m | oui |
| Courses | 48 % (Vauban) | iris.490070407.voiture | oui |
| Vérifications | 54 % | `iris.menages_commune.menages_stationnement_reserve` | oui |
| Vérifications | 17 % (Voltaire) | iris.490070105.stationnement_reserve | oui |
| Vérifications | 19 % (Ralliement) | iris.490070107.stationnement_reserve | oui |
| Vérifications | trams A, B et C ; 5 h à 1 h, toute la semaine | `doc.jours.tram` | avec ses conditions (horaires et jours écrits) |
| Vérifications | lignes 30 à 42 ; lundi au samedi, 7 h à 19 h 30 | `doc.jours.suburbaines` | avec ses conditions (horaires et jours écrits) |
| Vérifications | Irigo, Angers Loire Métropole | `doc.reseau.identite` | oui |
| Vérifications | irigo.fr | `doc.reseau.site` | oui |
| Méthode | 2022 ; 2020 à 2024 | `mobpro.modes.*` (source, limites) | oui |
| Méthode | 15 ans | `mobpro.modes.*` (population) | oui |
| Méthode | 300 actifs | `iris.voiture.min` (périmètre) | oui |
| Méthode | six | `mobpro.voiture_selon_destination.communes_voisines` (origine de la liste) | oui |
| Méthode | 32 communes | `comparaison.voiture.groupe_n` | oui |
| Méthode | 2025 (BPE) | `acces.49007.panier_quotidien_500m` (source) | oui |
| Méthode | 12 km | `carburant.gazole.prix` (périmètre) | oui |
| Méthode | 6 octobre 2025 ; 5 octobre 2026 | `carburant.gazole.prix_un_an_avant`, `carburant.gazole.prix` | oui |
| Méthode | 14 octobre 2026 | `doc.*` (date de consultation) | oui |

---

## D. Visuels et vérifications restantes

**Visuels retenus (trois) :**
1. **Tableau du scénario de surcoût de carburant.** Placé dans l'ouverture, après les hypothèses. Étape manuelle : aucune. Ses valeurs suivent la réextraction des prix avant publication.
2. **Carte de la part de la voiture par secteur (IRIS).** Placée dans la section sur les secteurs.
   - Étape manuelle : aucune pour la production (classes automatiques).
   - Repères numérotés à poser (`--reperes`) pour les secteurs cités : Voltaire, Ralliement, Mail, Boisnet, Brisepotière, Henri Dunant, Croix Blanche, Europe, Vauban.
   - Le tableau accessible des secteurs est produit avec la carte et l'accompagne ; ce n'est pas un visuel de plus.
   - Le millésime 2022 doit figurer sur la carte.
3. **Barres : part de la voiture selon la commune de travail.** Placées dans la section sur le lieu de travail. Étape manuelle : aucune ; la liste exacte des six communes figure dans l'intitulé de la barre. La carte de situation n'est pas retenue.

**Vérifications du dossier qui concernent des faits utilisés :**
- `mobpro.voiture_selon_destination` : relire si le choix des six communes est pertinent. Il fixe le 76 % et l'écart de 32 points.
- `iris.ecart_voiture` : relire les libellés d'IRIS avant de les publier. Cela concerne Voltaire, Ralliement, Mail, Boisnet, Brisepotière, Henri Dunant, Croix Blanche, Europe et Vauban.
- `carburant.evolution` : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cela concerne 2,33 €, 0,75 €, 2,16 €, 0,51 € et le tableau du scénario.

**Doutes de lecture :**
- **Libellés de secteurs.** Plusieurs sont des noms de personnes ou des termes génériques (« Europe », « Henri Dunant », « Mail »). Un lecteur pourrait les prendre pour un établissement ou une rue. Il faut vérifier que l'expression « secteur X » suffit.
- **Lignes Irigo.** Les informations sur les trams et sur les lignes 30 à 42 sont attribuées au réseau, sans dire qu'elles desservent une adresse d'Angers en particulier : le dossier n'établit pas où elles passent. Il faut relire si leur mention reste utile sans cette précision.