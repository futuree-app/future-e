# Correspondance des chiffres de l'article Niort avec le dossier

Document interne : ne figure pas dans l'article. Version courante : `article.md` (passe éditoriale du 14/10/2026), version éditée de l'essai 2 (`essais/2026-10-13-essai-2.md`). Identifiants et valeurs : `dossier.json` (même contenu que `dossier.md`, commit `ec131595`). Tous les faits cités ont l'usage `oui` ; aucun fait bus, fragile ou absent.

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
| Section 1 | 49 % ; 86 % ; 87 % | `iris.791910101.voiture` ; `iris.791910501.voiture` ; `iris.791910601.voiture` | 0,489 ; 0,861 ; 0,865 |
| Section 1 bis (équipements) | quasi-totalité (Centre) ; 500 m | `iris.791910101.panier_500m` | 0,998 (adresses du secteur, non pondérées) |
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
- Relire l'intérêt du groupe Chauray, Aiffres et Bessines (liste automatique de l'unité urbaine).
