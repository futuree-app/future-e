# Correspondance des chiffres de l'article Niort avec le dossier

Document interne : ne figure pas dans l'article. Version courante : `article.md` (passe éditoriale du 14/10/2026), version éditée de l'essai 2 (`essais/2026-10-13-essai-2.md`). Identifiants et valeurs : `dossier.json` (même contenu que `dossier.md`, commit `ec131595`). Tous les faits cités ont l'usage `oui` ; aucun fait bus calculé, fragile ou absent. Depuis le 14/10/2026, le passage sur le bus s'appuie sur le complément documentaire `complement.json`, intégré au dossier en section 2 bis (informations publiées par le réseau, distinctes des résultats calculés).

## Corrections apportées à l'essai 2

| Passage | Essai 2 | Version éditée | Raison |
|---|---|---|---|
| Chapeau | « Dans un rayon de 12 km autour de Niort, le gazole se vend… » | « Début octobre 2026, dans un rayon de 12 km autour du centre de Niort, le gazole se vendait… » | Prix datés dès leur première mention ; périmètre exact du dossier (rayon autour du **centre** communal) |
| Chapeau | « peut-on s'en servir moins ? » | « quels repères regarder pour choisir, selon le secteur et le lieu de travail ? » | Les pratiques observées ne disent rien des possibilités du lecteur |
| Équipements | « Les secteurs où la voiture pèse le moins sont aussi ceux où les équipements… » | phrase retirée ; exemples des secteurs seuls | Généralisation non vraie secteur par secteur (Gare 77 %, Clou Bouchet Nord 80 %) |
| Équipements | « 100 % des adresses » du secteur Centre | « la quasi-totalité des adresses » | Valeur 0,998 : arrondie à 100 %, mais pas toutes les adresses (erreur concrète) |
| Équipements | « elle tombe à 0 % : aucune adresse… » ; « Dans les secteurs où la voiture domine » | « aucune adresse… » ; « Dans ces deux secteurs » | Valeur exacte 0,0 ; généralisation remplacée par les secteurs concernés |
| Stationnement | intertitre « Moins de voitures, moins de places » et phrase d'ouverture générale | « Au Centre et à Clou Bouchet Sud, moins de voitures et moins de places » ; phrase retirée | Généralisation fausse ailleurs (Hôpital 51 % de places réservées) |
| Stationnement | « Seuls 30 % de ces ménages disposent… » | « Dans ce même secteur, 30 % des ménages disposent d'une place réservée, contre 65 % dans l'ensemble de Niort. » | « ces ménages » renvoyait aux ménages sans voiture ; la part porte sur tous les ménages |
| Lieu de travail | « 13 % à pied, 9 % à vélo et 9 % en transports en commun » | retiré | Garder la comparaison des parts de voiture |
| Lieu de travail | « Chez les Niortais » ; « l'écart de 20 points » | « Chez les actifs niortais » ; « les 20 points qui séparent les deux premiers » | Population (actifs, pas habitants) ; écart rattaché aux bons groupes (85 − 65, pas 87 − 65) |
| Carburant | marqueur de visuel | tableau du scénario dans le texte | Le tableau est le visuel |
| Méthode | « le trajet à pied réel est plus long » | « peut être nettement plus long » | Le dossier dit « peut être 1,3 à 6 fois plus longue » |
| Équipements (13/10, articulation) | « c'est adresse par adresse qu'il faut regarder ce qui se trouve à portée. » | « …, en suivant le chemin réel plutôt que la distance à vol d'oiseau. » | Conseil tiré de la limite déjà écrite en méthode ; aucun chiffre ajouté |
| Lieu de travail (13/10) | « …dès les premières annonces. » | « … ; le trajet, lui, se teste aux heures où on le fera. » puis renvoi vers `/savoir/dependance-auto` | Conseil de vérification, pas un constat ; renvoi vers l'article général |
| Conclusion (13/10) | « …et leur nombre à moins de 500 m. » | « …et, quand il y en a plusieurs, leur nombre à moins de 500 m. » | Le module n'affiche le compte qu'à partir de deux lieux (`AutourSection.tsx`) ; à confirmer sur un dossier réel |

## Passe éditoriale du 14/10/2026 (retours de lecture)

| Passage | Avant | Après | Raison |
|---|---|---|---|
| Section 1 | 70 %, Centre avec marche et TC, quatre secteurs à 52-54 %, 86 et 87 %, 38 points | 70 % ; Centre 49 %, Saint-Liguaire-Nantes 86 %, Surimeau-Antes Cholette 87 % ; « La carte situe tous les autres » | Un repère et quelques exemples contrastés ; la carte et son tableau portent le reste |
| Équipements | sans intertitre, à la suite de la carte | intertitre « Et pour les courses, l'école ou la pharmacie ? » et liaison (le travail n'est qu'une partie des déplacements) ; Hôpital 96 % retiré | Changement de sujet expliqué, sans lien de cause avec les pratiques domicile-travail |
| Stationnement | ménages sans voiture (38 %, 19 %, 43 %) et places ; « au même titre que la surface ou l'étage » | places réservées seules (30 %, 65 %, 14 %) ; « Si vous gardez une voiture, vérifiez dès l'annonce si une place de stationnement est comprise. » | Garder les chiffres de la question posée |
| Lieu de travail | 75 %, 65 %, 85 %, 87 %, phrase sur les 20 points | liaison (commerces proches ≠ trajet de travail) ; 65 % et 85 % avec leurs populations ; 87 % laissé au graphique ; limite causale en méthode | Succession 70 / 75 / 65 difficile à lire ; pas d'attribution causale dans le corps |
| Carburant | entrée directe sur les prix | « Pour ceux qui font ce trajet en voiture, la distance se paie aussi à la pompe. » | Raison du passage au carburant |
| Conclusion | équipements et motorisation du secteur, déjà présentés | projet du lecteur (travail, retraite, famille), dimensions à regarder, invitation à explorer l'adresse envisagée | Ouvrir sur la décision personnelle ; aucune fonctionnalité énumérée ni résultat promis |

## Complément du 14/10/2026 : alternatives à la voiture

Ajout d'un passage de deux paragraphes dans « Travailler à Niort ou ailleurs », après la phrase sur les 25 %, et d'une ligne « Bus » en méthode. Aucun chiffre calculé ajouté ; titre, chapeau, autres sections et conclusion inchangés.

| Passage | Information | Identifiant | Source |
|---|---|---|---|
| Section 3 | gratuit pour tout le monde depuis 2017 ; lignes urbaines et périurbaines | `doc.tanlib.gratuite` | tanlib.com, page « Réseau de bus 100 % gratuit » |
| Section 3 | lignes urbaines 1 à 10 : ni dimanche ni jours fériés | `doc.tanlib.urbaines.jours` | fiches horaires `dl/ligne-1.pdf` à `dl/ligne-10.pdf` |
| Section 3 | horaires du samedi ou des vacances « peuvent différer » | `doc.tanlib.fiches.periodes` | fiche de la ligne 1 (seule vérifiée, d'où « peuvent ») |
| Section 3 | calcul d'itinéraire de tanlib.com | `doc.tanlib.verifier` | https://www.tanlib.com/itineraire-bus/ |
| Section 3 | en vigueur depuis le 1er septembre 2026 | `doc.tanlib.urbaines.jours` (validité) | mention « Horaires valables à partir du 1er septembre 2026 » |
| Méthode | consulté le 14 octobre 2026 | tout le complément | |
| Pied | « Étude du 13 octobre 2026, mise à jour le 14 octobre 2026 » | | date de l'étude initiale conservée |

Ce que le passage ne dit pas : qu'un trajet est faisable ou pratique, qu'une adresse est desservie, une fréquence, ou qu'on peut se passer d'une voiture.

## Essai 3 (14/10/2026) : régressions et causes

Essai archivé sans modification dans `essais/2026-10-14-essai-3.md` ; il ne remplace pas `article.md`. Les pièces reçues par l'autre session ne sont pas vérifiables : les causes ci-dessous sont établies dans les fichiers préparés (commit `dc441ccf`).

| Régression de l'essai | Cause établie dans les entrées | Correction réutilisable |
|---|---|---|
| « toutes les adresses (100 %) » au Centre (valeur 0,998) | `dossier.md` affichait 100 % (arrondi à l'unité) ; la voix demandait « aucune précision qui laisserait croire à une mesure exacte » | `pct()` garde une décimale près des bornes (99,8 %) ; règle « tous / aucun = valeur exacte » dans l'en-tête du dossier, le prompt (règle 6) et la voix |
| Écarts entre secteurs présentés comme ceux des actifs qui travaillent à Niort | Section 3 du dossier : « actifs occupés du secteur », sans dire « quelle que soit leur commune de travail » ni l'absence de croisement avec la section 4 | Populations explicites en sections 3 et 4 ; règle dans le prompt (règle 4) et les conditions obligatoires |
| « Ce sont deux groupes de personnes distincts… » dans le récit | La voix citait « deux groupes distincts » comme précision à garder, alors que le prompt renvoie les limites en méthode | Voix : formulation exacte du groupe dans le récit, limite en méthode ; prompt aligné |
| « au même titre que la surface ou l'étage » | Exemple de la voix : « la place pour la voiture se regarde comme la cave ou le balcon » (la même tournure revenait dans les essais 1 et 2) | Exemple retiré ; un conseil dit l'action à faire, sans comparaison |
| Conclusion en inventaire (équipements les plus proches, nombre à 500 m, ménages motorisés) | Tableau des capacités : « Ce que l'on peut en dire » détaillait ces deux capacités, en contradiction avec « n'énumère pas de fonctionnalités » | Les deux capacités restent autorisées, en mention générale seulement ; la conclusion s'appuie sur l'examen de l'adresse à partir du projet |
| Exemple d'entrée « pourra-t-on se passer de la voiture ? » (voix) | Contredit la priorité « utiliser moins sa voiture » | « pourra-t-on moins prendre la voiture ? » |

Non attribué à une entrée : l'intertitre « 38 points d'écart » et la succession de pourcentages relèvent de la sélection des chiffres, déjà demandée par le prompt (démarche 4). Pas de nouvelle règle.

Article édité, même jour : « 49 % des actifs qui habitent le secteur Centre, où qu'ils travaillent » (population explicite). Le passage Tanlib, déjà présent, est conservé tel quel : il cite les lignes urbaines 1 à 10, la date de validité des fiches, et sépare gratuité et faisabilité.

## Harmonisation du 14/10/2026 (série mobilité)

Trame commune avec La Rochelle. Nouvel ordre : carburant et distance (ex-section 4, tableau en ouverture) ; secteurs (section 1) ; lieu de travail (section 3, avec les 25 %) ; « Et pour les courses, l'école ou la pharmacie ? » ; « Garder une voiture, prendre le bus » (stationnement de la section 2 et passage Tanlib, déplacé depuis la section 3) ; conclusion. Les identifiants du tableau ci-dessous valent toujours ; seuls les emplacements changent.

- Carburant : hypothèses dites une fois avant le tableau ; l'exemple 15 km (270 € et 180 €) n'est plus répété dans la prose, il reste dans le tableau.
- Transitions : « Le secteur n'est qu'une partie de la réponse » (secteurs → travail) ; « Le travail n'est qu'une partie des déplacements » (travail → équipements) ; « Vivre près des commerces n'empêche pas de garder une voiture » (équipements → stationnement).
- Méthode : les parts par secteur portent sur tous les actifs qui y habitent ; secteurs et communes de travail ne sont pas croisés.
- Aucun chiffre ajouté ni retiré hors la répétition carburant.

## Repère de comparaison (14/10/2026)

| Passage | Chiffre | Identifiant | Valeur |
|---|---|---|---|
| Secteurs, phrase sur les 70 % | « à peu près la médiane (68 %) … » | `comparaison.voiture.mediane_groupe` (et `comparaison.voiture.ecart`, +2 points, non écrit) | 0,6754 ; 76 communes (`fiches/79191/comparaison_voiture.json`) |
| Méthode | 76 communes ; règle | `comparaison.voiture.groupe_n` ; règle de `outil/comparaison_voiture.py` | |

« Ce repère cache » devient « Ce chiffre d'ensemble cache » (le mot « repère » désigne désormais la comparaison).

## Chiffres de la version éditée

| Passage | Chiffre | Identifiant(s) | Valeur au dossier |
|---|---|---|---|
| Chapeau | début octobre 2026 ; un an plus tôt | `carburant.gazole.prix` (semaine du 2026-10-05), `carburant.gazole.prix_un_an_avant` (semaine du 2025-10-06) | |
| Chapeau | 12 km, autour du centre | `carburant.gazole.prix` (périmètre) | rayon de 12 km à vol d'oiseau autour du centre communal |
| Chapeau | 2,33 € | `carburant.gazole.prix` | 2,328 |
| Chapeau | 1,56 € | `carburant.gazole.prix_un_an_avant` | 1,559 |
| Chapeau | 2022 | millésime `mobpro.*`, `iris.*` | |
| Intertitre 1 | 49 % ; 87 % | `iris.voiture.min` (791910101) ; `iris.voiture.max` (791910601) | 0,489 ; 0,865 |
| Section 1 | 70 % | `mobpro.modes.voiture` | 0,701 |
| Section 1 | 49 % (actifs qui habitent le secteur, où qu'ils travaillent) ; 86 % ; 87 % | `iris.791910101.voiture` ; `iris.791910501.voiture` ; `iris.791910601.voiture` | 0,489 ; 0,861 ; 0,865 |
| Section 1 bis (équipements) | quasi-totalité (Centre) ; 500 m | `iris.791910101.panier_500m` | 0,998, affiché 99,8 % dans le dossier depuis le 14/10/2026 (adresses du secteur, non pondérées) |
| Section 1 bis (équipements) | aucune adresse | `iris.791910501.panier_500m`, `iris.791910601.panier_500m` | 0,0 ; 0,0 |
| Section 1 bis (équipements) | 87 % (Clou Bouchet Sud) | `iris.791910404.panier_500m` | 0,870 |
| Section 2 | 30 % ; 65 % | `iris.791910101.stationnement_reserve` ; `iris.menages_commune.menages_stationnement_reserve` | 0,303 ; 0,648 |
| Section 2 (stationnement) | 14 % (Clou Bouchet Sud) | `iris.791910404.stationnement_reserve` | 0,139 |
| Section 3 | 65 % (habitent et travaillent à Niort) | `mobpro.voiture_selon_destination.meme_commune` | 0,645 |
| Section 3 | 85 % (habitent Niort, travaillent à Chauray, Aiffres ou Bessines) | `mobpro.voiture_selon_destination.communes_voisines` | 0,845 |
| Section 3 | 25 % | `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | 0,249 |
| Section 4 | 0,77 € ; 0,52 € | `carburant.gazole.ecart` ; `carburant.e10.ecart` | 0,769 ; 0,516 |
| Section 4 | 6 L/100 km ; 200 allers-retours ; 0,75 € ; 0,50 € | hypothèses `scenario.carburant.*` | |
| Section 4, tableau | 90 / 270 / 630 € ; 60 / 180 / 420 € | `scenario.carburant.gazole.{5,15,35}km` ; `scenario.carburant.e10.{5,15,35}km` | identiques |
| Conclusion | aucun chiffre | capacité « Examen d'une adresse à partir du projet » (autorisée le 14/10/2026) | |
| Méthode | 2022 ; 2020 à 2024 ; 15 ans ; 300 actifs ; BPE 2025 ; semaines du 6 octobre 2025 et du 5 octobre 2026 ; 12 km ; 5 centimes | limites et périmètres du dossier | |

## Visuels

| Emplacement | Visuel | Données |
|---|---|---|
| Section 1 | Carte de la part de la voiture par secteur (`visuels/79191/carte_iris_79191_*`) | tableau `iris` de la fiche ; libellés des sept secteurs cités |
| Section 3 | Barres « Habiter Niort, travailler ici ou ailleurs » (`visuels/79191/barres_lieu_travail_79191_*`) | `mobpro.voiture_selon_destination.*` de la fiche (65 / 85 / 87 %) |
| Section 4 | Tableau du scénario | `scenario.carburant.*` |

## Vérifications restantes avant publication (ne bloquent pas la prévisualisation)

- Réextraire les prix du carburant la veille de la publication et contrôler la hausse sur les mêmes stations (chapeau, section 4, tableau).
- Relire les libellés d'IRIS cités comme noms de secteurs.
- Recontrôler les pages Tanlib citées (gratuité, jours de circulation, validité des fiches) la veille de la publication.
- Relire l'intérêt du groupe Chauray, Aiffres et Bessines (liste automatique de l'unité urbaine).
