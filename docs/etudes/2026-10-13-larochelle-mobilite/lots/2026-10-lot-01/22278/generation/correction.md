## A. Question et format

**Question principale.** Vivre à Saint-Brieuc en prenant moins la voiture pour aller travailler : quels secteurs, et quels lieux de travail, sont associés à un usage moindre de la voiture ?

**Ce que la réponse apprend au lecteur.** Dans l'ensemble, Saint-Brieuc est au niveau de la médiane des villes de taille proche. Les différences se voient à l'intérieur de la ville :
- **selon le secteur où l'on habite** : de 51 % à 82 % des actifs vont travailler en voiture, soit 31 points d'écart ;
- **selon le lieu de travail** : 56 % pour ceux qui travaillent dans la ville, 81 % pour ceux qui travaillent dans les six communes citées, soit 25 points d'écart.

**Lien avec la recherche de logement.** Le lecteur peut croiser deux choses qu'il connaît ou choisit : le secteur de l'adresse et son lieu de travail. Il apprend aussi deux points à vérifier pendant une visite :
- la proximité des commerces et services ne dit pas tout du trajet du matin (Le Plateau) ;
- la place de stationnement est rare dans certains secteurs.

**Identifiants qui la soutiennent :**
- secteurs : `iris.voiture.min`, `iris.voiture.max`, `ecart.iris.voiture.max_moins_min`, cellules `iris.<code>.*` ;
- lieu de travail : `mobpro.travaille_dans_commune`, `mobpro.voiture_selon_destination.*`, `ecart.voiture_destination.voisines_moins_meme_commune`, `destination.*` ;
- comparaison : `comparaison.voiture.*` ;
- voiture possédée mais pas utilisée : `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` ;
- stationnement : `iris.menages_commune.menages_stationnement_reserve` ;
- carburant (ouverture) : `carburant.*`, `scenario.carburant.*`.

**Format.** Article complet (environ 900 mots hors méthode).

**Pistes écartées :**
- **Ceux qui viennent travailler à Saint-Brieuc** (`qui_vient_travailler`) : utile, mais hors de la question de l'adresse.
- **Statut d'occupation** : écarts entre groupes de ménages, pas entre lieux.
- **Ménages sans voiture** : une série de pourcentages en plus, sans apport à la question.
- **Indicateurs d'accès pondérés par commune et tableau des six communes** : ils alourdiraient l'article et ne se comparent pas aux parts par secteur.
- **Tarif scolaire et lignes du dimanche** (`doc.*`) : sans lien avec le choix d'un logement, ou trop conditionnels.
- **Faits bus** : en attente de validation, donc non écrits.

---

## B. Article

# Saint-Brieuc : de 51 % à 82 % d'actifs en voiture selon le secteur où l'on habite

**En un an, le gazole a pris 0,73 € par litre autour de Saint-Brieuc. Pour qui cherche un logement dans la ville, la question dépasse le prix à la pompe : depuis quel secteur, et pour quel lieu de travail, les actifs prennent-ils moins la voiture pour aller travailler ? Le recensement montre des écarts nets, à connaître avant les visites.**

## Un plein plus cher, une adresse à choisir

La semaine du 5 octobre 2026, le prix médian du gazole atteint 2,31 € le litre dans les stations situées dans un rayon de 12 km autour du centre de Saint-Brieuc. Il était de 1,57 € un an plus tôt, soit une hausse de 0,73 €. Le SP95-E10 passe de 1,64 € à 2,13 €, en hausse de 0,49 €.

Le tableau ci-dessous traduit cette hausse en surcoût annuel pour un trajet domicile-travail, selon la longueur de l'aller. Il retient une consommation de 6 litres aux 100 km, 200 allers-retours par an et la hausse médiane arrondie à 5 centimes. Il chiffre le supplément de carburant par rapport à l'an dernier, pas le coût du trajet.

[VISUEL : Tableau du scénario de surcoût de carburant]

Ce surcoût ramène à deux questions que pose toute recherche de logement : à quelle distance du travail s'installer, et la voiture sera-t-elle le moyen de transport de tous les jours ? Pour la seconde, les trajets des actifs de Saint-Brieuc donnent des repères concrets.

## D'un secteur à l'autre, 31 points d'écart

Au recensement de 2022, 69 % des actifs qui habitent Saint-Brieuc vont travailler principalement en voiture. C'est le niveau de la médiane des villes de taille proche (voir la méthode). La ville ne se distingue pas dans son ensemble, mais les pratiques diffèrent d'un secteur à l'autre.

Dans le secteur de Charner, 51 % des actifs qui y habitent vont travailler en voiture, et 23 % à pied. À Cesson, la voiture atteint 82 %, soit 31 points de plus. Entre les deux, Centre Ville et La Tour d'Auvergne sont à 58 % chacun, mais avec des répartitions différentes :
- au Centre Ville, 24 % des actifs vont travailler à pied ;
- à La Tour d'Auvergne, 20 % prennent les transports en commun, comme 23 % des actifs de L'Europe.

À l'autre bout, La Ville Jouha-Hellio est à 79 %.

Ces parts portent sur tous les actifs du secteur, où qu'ils travaillent. Elles ne disent pas ce que vous ferez vous-même. Elles indiquent dans quels secteurs la voiture est moins souvent le moyen de transport principal pour aller travailler.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

## Travailler dans la ville ou dans six communes proches

Le secteur ne suffit pas pour se projeter : le lieu de travail, que l'on connaît souvent avant de chercher, est l'autre moitié du trajet.

50 % des actifs qui habitent Saint-Brieuc y travaillent aussi. Parmi eux, 56 % vont travailler en voiture, 20 % à pied et 8 % à vélo.

Six communes forment un deuxième groupe : Plérin, Ploufragan, Trégueux, Langueux, Yffiniac et Trémuson. Parmi les actifs qui habitent Saint-Brieuc et travaillent dans l'une d'elles, 81 % vont travailler en voiture, soit 25 points de plus. La part est de 82 % pour ceux qui travaillent ailleurs.

Pour deux d'entre elles, la part des transports en commun est plus élevée que pour ceux qui travaillent à Saint-Brieuc (7 %) : 20 % des actifs de Saint-Brieuc qui travaillent à Ploufragan y vont en transports en commun, et 19 % de ceux qui travaillent à Langueux.

[VISUEL : Barres : part de la voiture selon la commune de travail]

Avoir une voiture ne dit pas non plus comment on va travailler. Parmi les actifs dont le ménage a au moins une voiture, 25 % ne la déclarent pas comme moyen de transport principal pour s'y rendre, travail à domicile compris.

## Et pour les courses, l'école ou la pharmacie ?

Le trajet du matin ne fait pas toute la semaine. Les courses, l'école et la pharmacie pèsent aussi dans le choix d'une adresse, et leur proximité change elle aussi d'un secteur à l'autre.

À Charner et au Plateau, toutes les adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d'oiseau. C'est le cas de la quasi-totalité des adresses du Centre Ville. Ces trois équipements sont réunis pour 8 % des adresses de La Ville Oger et 18 % de celles de La Ville Jouha-Hellio.

Ces commerces et services proches ne disent rien, à eux seuls, du trajet vers le travail. Au Plateau, où toutes les adresses les réunissent, 73 % des actifs vont travailler en voiture. À Charner, ils sont 51 %. Pendant une visite, ce sont donc deux questions séparées : ce qui se trouve autour de l'adresse, et la façon dont vous rejoindrez votre travail.

## Avant de signer : la place et le trajet

Si vous gardez une voiture, la place de stationnement mérite d'être vérifiée. 59 % des ménages de Saint-Brieuc disposent d'un emplacement réservé, mais la part varie selon les secteurs :
- 39 % au Centre Ville ;
- 37 % à L'Europe ;
- 21 % à La Ville Oger ;
- 20 % au Plateau.

Regardez dès l'annonce si une place est comprise, et posez la question lors de la visite.

Pour le bus, le réseau de transport urbain de Saint-Brieuc Armor Agglomération s'appelle TUB. Son site, www.tub.bzh, propose une page de recherche d'itinéraire. Elle donne accès à une carte interactive, aux horaires des lignes et à l'application mobile TUB. Cherchez-y le trajet entre l'adresse envisagée et votre lieu de travail, aux heures où vous partirez.

## Votre projet, votre adresse

Se rapprocher de son travail, installer une famille près d'une école, préparer une retraite : chaque projet ne se joue pas dans le même secteur de Saint-Brieuc. Avant de vous décider, examinez avec futur•e l'adresse envisagée à partir de ce projet. La mobilité, mais aussi la chaleur de l'été ou les risques à l'adresse, peuvent peser dans ce choix.

### Méthode et sources

**Trajets domicile-travail.** Source : INSEE, recensement de la population 2022 (collectes 2020 à 2024), fichier détail Mobilités professionnelles et bases infracommunales Activité des résidents et Logement.
- Les parts portent sur les actifs occupés de 15 ans ou plus et sur leur moyen de transport principal pour aller travailler. Achats, école et loisirs ne sont pas couverts.
- Ce sont des estimations par sondage : les petits écarts ne doivent pas être surinterprétés.
- Les groupes selon le lieu de travail sont des personnes distinctes. Leurs écarts décrivent des pratiques, pas l'effet d'un changement d'emploi.
- Les six communes de travail sont, par règle automatique, les plus peuplées de l'unité urbaine de Saint-Brieuc.

**Secteurs.** Les secteurs sont les IRIS de l'INSEE, dont les noms ne sont pas toujours ceux des quartiers. Seuls sont retenus les secteurs d'habitat comptant au moins 300 actifs. Les parts de stationnement portent sur l'ensemble des ménages (résidences principales), retraités et étudiants compris.

**Équipements.** Part des adresses de la Base adresse nationale situées à moins de 500 m à vol d'oiseau d'un équipement de la Base permanente des équipements 2025 de l'INSEE. Ce n'est ni une part d'habitants, ni une mesure de l'usage des équipements. La marche réelle peut être nettement plus longue.

**Comparaison.** « Villes de taille proche » : les 109 communes de France métropolitaine qui sont la plus grande de leur unité urbaine par le nombre d'actifs occupés résidents. Elles comptent de la moitié au double des actifs de Saint-Brieuc et au moins 150 lignes d'échantillon. La médiane est celle des parts communales, chaque commune comptant une fois.

**Carburant.** Source : prix-carburants.gouv.fr, flux officiel.
- Prix médian entre stations du dernier prix déclaré dans la semaine (semaines du 6 octobre 2025 et du 5 octobre 2026).
- Stations situées dans un rayon de 12 km à vol d'oiseau autour du centre de Saint-Brieuc.
- Une hausse passée ne dit rien de l'avenir.

**Réseau TUB.** Informations consultées sur www.tub.bzh et transport.data.gouv.fr en octobre 2026.

---

## C. Correspondance interne (non publiée)

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Titre | 51 % | `iris.voiture.min` | oui |
| Titre | 82 % | `iris.voiture.max` | oui |
| Chapeau | 0,73 € par litre | `carburant.gazole.ecart` | oui |
| Un plein plus cher | semaine du 5 octobre 2026 | `carburant.gazole.prix` (fait) | oui |
| Un plein plus cher | 2,31 € | `carburant.gazole.prix` | oui |
| Un plein plus cher | 12 km | `carburant.gazole.prix` (périmètre) | oui |
| Un plein plus cher | 1,57 € | `carburant.gazole.prix_un_an_avant` | oui |
| Un plein plus cher | 0,73 € | `carburant.gazole.ecart` | oui |
| Un plein plus cher | 1,64 € | `carburant.e10.prix_un_an_avant` | oui |
| Un plein plus cher | 2,13 € | `carburant.e10.prix` | oui |
| Un plein plus cher | 0,49 € | `carburant.e10.ecart` | oui |
| Un plein plus cher | 6 litres aux 100 km | `scenario.carburant.*` (hypothèses, section 7) | oui |
| Un plein plus cher | 200 allers-retours | `scenario.carburant.*` (hypothèses, section 7) | oui |
| Un plein plus cher | 5 centimes | `scenario.carburant.*` (hypothèses, section 7) | oui |
| Secteurs | 2022 | `mobpro.modes.voiture` (millésime) | oui |
| Secteurs | 69 % (Saint-Brieuc) | `mobpro.modes.voiture`, `comparaison.voiture.commune` | oui |
| Secteurs | médiane (69 %, « le niveau de la médiane ») | `comparaison.voiture.mediane_groupe`, `comparaison.voiture.ecart` (+0 points, écart des valeurs arrondies) | oui |
| Secteurs | 51 % (Charner) | `iris.voiture.min`, `iris.222780107.voiture` | oui |
| Secteurs | 23 % à pied (Charner) | `iris.222780107.marche` | oui |
| Secteurs | 82 % (Cesson) | `iris.voiture.max`, `iris.222780120.voiture` | oui |
| Secteurs | 31 points (intertitre et corps) | `ecart.iris.voiture.max_moins_min` | oui |
| Secteurs | 58 % (Centre Ville, La Tour d'Auvergne) | `iris.222780108.voiture`, `iris.222780105.voiture` | oui |
| Secteurs | 24 % à pied (Centre Ville) | `iris.222780108.marche` | oui |
| Secteurs | 20 % TC (La Tour d'Auvergne) | `iris.222780105.tc` | oui |
| Secteurs | 23 % TC (L'Europe) | `iris.222780119.tc` | oui |
| Secteurs | 79 % (La Ville Jouha-Hellio) | `iris.222780102.voiture` | oui |
| Lieu de travail | six communes (intertitre) | `mobpro.voiture_selon_destination.communes_voisines` (périmètre ; liste donnée dans le corps) | oui |
| Lieu de travail | 50 % | `mobpro.travaille_dans_commune`, `destination.22278.part_des_actifs` | oui |
| Lieu de travail | 56 % | `mobpro.voiture_selon_destination.meme_commune`, `destination.22278.voiture` | oui |
| Lieu de travail | 20 % à pied | `destination.22278.marche` | oui |
| Lieu de travail | 8 % à vélo | `destination.22278.velo` | oui |
| Lieu de travail | Six communes (liste) | `mobpro.voiture_selon_destination.communes_voisines` (périmètre) | oui |
| Lieu de travail | 81 % | `mobpro.voiture_selon_destination.communes_voisines` | oui |
| Lieu de travail | 25 points | `ecart.voiture_destination.voisines_moins_meme_commune` | oui |
| Lieu de travail | 82 % (ailleurs) | `mobpro.voiture_selon_destination.ailleurs` | oui |
| Lieu de travail | 7 % TC (travail à Saint-Brieuc) | `destination.22278.tc` | oui |
| Lieu de travail | 20 % TC (Ploufragan) | `destination.22215.tc` | oui |
| Lieu de travail | 19 % TC (Langueux) | `destination.22106.tc` | oui |
| Lieu de travail | 25 % | `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | oui |
| Courses, école | 500 m | `iris.<code>.panier_500m` (définition, section 3) | oui |
| Courses, école | toutes les adresses (Charner, Le Plateau) | `iris.222780107.panier_500m` (100 %), `iris.222780112.panier_500m` (100 %) | oui |
| Courses, école | quasi-totalité (Centre Ville) | `iris.222780108.panier_500m` (98 %) | oui |
| Courses, école | 8 % (La Ville Oger) | `iris.222780116.panier_500m` | oui |
| Courses, école | 18 % (La Ville Jouha-Hellio) | `iris.222780102.panier_500m` | oui |
| Courses, école | 73 % (Le Plateau) | `iris.222780112.voiture` | oui |
| Courses, école | 51 % (Charner) | `iris.222780107.voiture` | oui |
| Avant de signer | 59 % | `iris.menages_commune.menages_stationnement_reserve` | oui |
| Avant de signer | 39 % (Centre Ville) | `iris.222780108.stationnement_reserve` | oui |
| Avant de signer | 37 % (L'Europe) | `iris.222780119.stationnement_reserve` | oui |
| Avant de signer | 21 % (La Ville Oger) | `iris.222780116.stationnement_reserve` | oui |
| Avant de signer | 20 % (Le Plateau) | `iris.222780112.stationnement_reserve` | oui |
| Avant de signer | TUB, www.tub.bzh, recherche d'itinéraire | `doc.reseau.identite`, `doc.reseau.site`, `doc.verification.itineraire` | oui / oui / avec ses conditions |
| Méthode | 2022 ; 2020 à 2024 | limites `mobpro.modes.*` | oui |
| Méthode | 15 ans ou plus | `mobpro.modes.voiture` (population) | oui |
| Méthode | 300 actifs | `iris.voiture.min` (périmètre) | oui |
| Méthode | 500 m ; BPE 2025 | `acces.22278.panier_quotidien_500m` (définition, source) | oui |
| Méthode | 109 communes | `comparaison.voiture.groupe_n` | oui |
| Méthode | moitié au double ; 150 lignes | section 4 bis (règle de `comparaison.voiture.mediane_groupe`) | oui |
| Méthode | 6 octobre 2025 ; 5 octobre 2026 | `carburant.gazole.prix_un_an_avant`, `carburant.gazole.prix` | oui |
| Méthode | 12 km | `carburant.gazole.prix` (périmètre) | oui |
| Méthode | octobre 2026 (consultation TUB) | `doc.reseau.site`, `doc.verification.itineraire` (dates de consultation) | oui |

---

## D. Visuels et vérifications restantes

**Visuels retenus**

1. **Tableau du scénario de surcoût de carburant**
   - Emplacement : section « Un plein plus cher », après les hypothèses.
   - Étape manuelle : aucune. Les valeurs suivront la réextraction des prix.
2. **Carte de la part de la voiture par secteur (IRIS)**, avec son tableau accessible produit automatiquement.
   - Emplacement : fin de la section « D'un secteur à l'autre ».
   - Étape manuelle : aucune pour la production (classes automatiques).
   - Repères numérotés `--reperes` pour les secteurs cités : Charner, Cesson, Centre Ville, La Tour d'Auvergne, L'Europe, La Ville Jouha-Hellio, Le Plateau, La Ville Oger.
   - Libellés posés à la main seulement pour une version soignée. Millésime 2022 sur la carte.
3. **Barres : part de la voiture selon la commune de travail**
   - Emplacement : section « Travailler dans la ville ou dans six communes proches », après les parts par lieu de travail.
   - Étape manuelle : aucune. La liste exacte des six communes figure dans l'intitulé de la barre.
   - Millésime 2022 sur le graphique.

La carte de situation n'est pas retenue (limite de trois visuels).

**Vérifications en attente qui concernent des faits utilisés**

- `mobpro.voiture_selon_destination` (non bloquante) : relire l'intérêt du choix des six communes, qui détermine les chiffres 81 % et 25 points.
- `iris.ecart_voiture` (non bloquante) : relire les libellés d'IRIS cités comme noms de quartiers. Sont concernés : Charner, Cesson, Centre Ville, La Tour d'Auvergne, L'Europe, La Ville Jouha-Hellio, Le Plateau, La Ville Oger.
- `carburant.evolution` (obligatoire avant publication) : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Concerne les prix, les hausses et le tableau du surcoût.

**Doutes de lecture**

- **Libellés d'IRIS.** L'article écrit « au Plateau » pour l'IRIS « Le Plateau », et « Centre Ville » sans trait d'union, comme le libellé INSEE. À relire avec la vérification `iris.ecart_voiture`.
- **Recherche d'itinéraire TUB** (`doc.verification.itineraire`). Le contenu du formulaire n'a pas pu être lu. L'article ne dit donc que ce vers quoi la page renvoie (carte interactive, horaires des lignes, application mobile) et ne promet aucun résultat. Il faut vérifier que la page existe toujours au moment de la publication.

---

## E. Corrections

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Raisonnement, bloquante : TC « pas absents » des six communes | « Les transports en commun ne sont pas absents de ces six communes. 20 % des actifs… » | « Pour deux d'entre elles, la part des transports en commun est plus élevée que pour ceux qui travaillent à Saint-Brieuc (7 %) : 20 % des actifs… ». J'ai précisé la correction proposée : sans terme de comparaison, « plus élevée » restait flou, et Trémuson n'a pas de ligne en section 4. Le 7 % (`destination.22278.tc`) est ajouté en C. |
| Conclusion, bloquante : « Vous y verrez » promet un résultat et fait un inventaire | « Vous y verrez la place de la voiture dans le secteur et ce qui se trouve à proximité, mais aussi la chaleur de l'été ou les risques à l'adresse. » | « La mobilité, mais aussi la chaleur de l'été ou les risques à l'adresse, peuvent peser dans ce choix. » L'anomalie est fondée sur la promesse et sur l'inventaire. En revanche, une mention générale de « la place de la voiture dans le secteur » est autorisée par le dossier (capacité « Équipement automobile du secteur ») : ce motif-là ne tenait pas seul. |
| Borne, a_revoir : « exactement » la médiane | « C'est exactement la médiane des villes de taille proche » | « C'est le niveau de la médiane des villes de taille proche ». Corrigé (quelques mots) ; la ligne correspondante de C est mise à jour. |
| Raisonnement, a_revoir : explication exclusive par le secteur | « La ville ne se distingue donc pas dans son ensemble : c'est d'un secteur à l'autre que les pratiques diffèrent. » | « La ville ne se distingue pas dans son ensemble, mais les pratiques diffèrent d'un secteur à l'autre. » Corrigé (quelques mots). |
| Raisonnement, a_revoir : « raisons » | « mais pas pour les mêmes raisons : » | « mais avec des répartitions différentes : ». Corrigé (quelques mots). |
| Population, a_revoir : « juste à côté » | Intertitre « Travailler dans la ville ou juste à côté » | Intertitre « Travailler dans la ville ou dans six communes proches ». Corrigé (quelques mots) ; la liste exacte suit dans le corps. L'emplacement du visuel en D est mis à jour. |