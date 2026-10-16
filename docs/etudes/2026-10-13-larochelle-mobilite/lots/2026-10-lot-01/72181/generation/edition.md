## A. Question et format

**Question principale.** Au Mans, depuis quels quartiers les actifs prennent-ils le moins la voiture, et que faut-il vérifier dans une annonce pour en profiter ?

**Ce que la réponse apprend au lecteur.** À l'échelle de la ville, la part de la voiture est proche de celle des villes de taille proche. D'un secteur à l'autre, en revanche, elle va presque du simple au double : de 37 % à 80 % des actifs, soit 43 points d'écart. Le lieu de travail est l'autre moitié du trajet. Ensuite, la proximité des commerces et des écoles, puis le stationnement, donnent des points concrets à vérifier pendant les visites.

**Lien avec une recherche de logement.** Le choix du secteur et la question de la place de parking se posent dès l'annonce et pendant la visite.

**Identifiants qui soutiennent la question.**
- Hausse du carburant (ouverture) : `carburant.gazole.*`, `carburant.e10.*`, `scenario.carburant.*`.
- Écart entre secteurs : `iris.voiture.min`, `iris.voiture.max`, `ecart.iris.voiture.max_moins_min`, cellules `iris.<code>.*`.
- Repère de comparaison : `comparaison.voiture.*`.
- Lieu de travail : `mobpro.travaille_dans_commune`, `mobpro.voiture_selon_destination.*`, `ecart.voiture_destination.voisines_moins_meme_commune`, `mobpro.qui_vient_travailler.*`.
- Posséder sans utiliser : `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture`.
- Stationnement et ménages sans voiture : `iris.menages_commune.*`.
- Réseau de transport : `doc.reseau.site`, `doc.itineraire.page`.

**Format.** Article complet.

**Pistes écartées.**
- Statut d'occupation : ne sert pas la question du quartier.
- Indice 4 (quartier équipé où la voiture domine) : aucun secteur ne le franchit nettement.
- Communes de travail détaillées (section 4) : surtout des valeurs fragiles.
- Sections 5 et 6 (communes du groupe) : elles alourdiraient un article centré sur le choix d'un secteur au Mans.
- Gratuité pour les moins de 5 ans : sans intérêt pour la question.
- Faits bus : en attente de validation.

---

## B. Article

# Au Mans, de 37 % à 80 % des actifs vont travailler en voiture selon le quartier

En un an, le prix médian du gazole a augmenté de 0,72 € par litre dans les stations autour du Mans. Pour qui cherche un logement, la question dépasse le prix du plein : depuis quel quartier peut-on moins prendre la voiture ? Les trajets des habitants, très différents d'un secteur à l'autre, donnent des pistes.

## Le plein, un an plus tard

Dans les stations situées dans un rayon de 12 km autour du centre du Mans, le prix médian du gazole est passé de 1,59 €/L la semaine du 6 octobre 2025 à 2,31 €/L la semaine du 5 octobre 2026. Celui du SP95-E10 est passé de 1,68 à 2,15 €/L sur la même période. Le tableau traduit cette hausse en surcoût annuel selon la longueur du trajet domicile-travail. Les hypothèses sont les suivantes : une voiture qui consomme 6 L/100 km, 200 allers-retours par an et une hausse arrondie à 5 centimes près.

[VISUEL : Tableau du scénario de surcoût de carburant]

Quand on choisit une adresse, une question se pose donc : où, dans la ville, la voiture tient-elle moins de place dans les trajets de travail ?

## Du centre aux secteurs extérieurs, deux façons d'aller travailler

D'après le recensement de 2022, 58 % des actifs qui habitent Le Mans vont travailler principalement en voiture. C'est proche de la médiane des villes de taille proche, qui est de 59 % (voir la méthode). Cette moyenne recouvre pourtant des secteurs très différents.

À Jacobins-République, 37 % des actifs qui habitent le secteur vont travailler en voiture. Les autres modes y tiennent une place nette : 31 % prennent principalement les transports en commun et 22 % y vont à pied. Les secteurs Leclerc et Gare suivent, avec 38 % chacun. À l'autre bout, la voiture concerne 80 % des actifs à Oasis, 79 % à Haut de Gazonfier et 78 % à Meslier. Entre le secteur le plus bas et le plus haut, l'écart atteint 43 points.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

Avoir une voiture n'implique pas de la prendre chaque matin. Parmi les actifs du Mans dont le ménage a au moins une voiture, 35 % ne la déclarent pas comme mode principal pour aller travailler, travail à domicile compris.

## Travailler au Mans ou à côté

Le quartier ne fait que la moitié du trajet. L'autre moitié, c'est le lieu de travail, que l'on connaît souvent avant de chercher un logement. 71 % des actifs qui habitent Le Mans y travaillent aussi, et parmi eux, 52 % s'y rendent en voiture. Pour ceux qui travaillent à Allonnes, Coulaines, Changé, Arnage, Yvré-l'Évêque ou Savigné-l'Évêque, la part est de 79 %, soit 27 points de plus. Elle est de 74 % pour ceux qui travaillent hors du Mans et de ces six communes.

Le trajet en sens inverse dessine un autre profil. Parmi les personnes qui travaillent au Mans, celles qui habitent une autre commune de son unité urbaine (au sens de l'INSEE) viennent à 88 % en voiture. Pour celles qui habitent hors de cette unité urbaine, la part est de 90 %.

## Et pour les courses, l'école ou la pharmacie ?

Le recensement décrit seulement le trajet vers le travail. Or un ménage se déplace aussi pour faire ses courses ou accompagner les enfants. Pour ces trajets, on peut regarder ce qui se trouve près de l'adresse.

Dans les secteurs Jacobins-République, Leclerc, Gare et Courboulay, toutes les adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 mètres à vol d'oiseau. Dans les secteurs Université et Cadran, aucune adresse ne réunit les trois ; à Riffaudières, c'est le cas de 2 % des adresses. Il manque alors au moins l'un des trois dans ce rayon, ce qui ne veut pas dire qu'aucun n'est proche. Le tableau des secteurs donne le détail pour chacun.

[VISUEL : Tableau accessible des secteurs (HTML et Markdown)]

## À vérifier pendant les visites

Habiter un secteur où la voiture compte peu ne dispense pas toujours d'en avoir une, ni de devoir la garer. Dans l'ensemble du Mans, 56 % des ménages disposent d'un emplacement réservé au stationnement. Ils sont 42 % à Jacobins-République, 25 % à Petit Louvre et 23 % au Vieux Mans, contre 91 % à Meslier. Ces trois secteurs comptent aussi beaucoup de ménages sans voiture : 48 % à Jacobins-République, 55 % à Petit Louvre et 39 % au Vieux Mans, contre 27 % pour toute la ville.

Si vous gardez une voiture, même pour un usage occasionnel, vérifiez dès l'annonce si une place est comprise. Si vous voulez la laisser plus souvent au garage, testez votre trajet sur la rubrique « Itinéraire » du site du réseau urbain SETRAM (setram.fr), depuis l'adresse visitée et à l'heure où vous partiriez travailler.

## Votre projet, votre adresse

Se rapprocher de son travail, s'installer en famille, préparer sa retraite : selon le projet, une même adresse ne pèse pas du même poids. Sur futur•e, examinez celle que vous envisagez à partir de ce projet. Regardez l'ensemble : la mobilité, ce qui se trouve autour, la chaleur de l'été et les risques à l'adresse.

### Méthode et sources

- **Trajets domicile-travail.** Source : INSEE, recensement 2022 (collectes 2020 à 2024), fichier détail Mobilités professionnelles. Population : actifs occupés de 15 ans ou plus qui résident au Mans, y compris ceux qui travaillent à domicile. Mode principal déclaré.
  - Ce sont des estimations par sondage.
  - Les groupes formés selon le lieu de travail sont des groupes distincts de personnes : l'écart entre eux décrit des pratiques, pas l'effet d'un changement d'emploi.
  - Les six communes nommées sont, dans l'unité urbaine du Mans, les plus peuplées, dans la limite de six.
- **Secteurs.** Ce sont les IRIS d'habitat de l'INSEE comptant au moins 300 actifs. Source : bases infracommunales Activité des résidents et Logement, 2022.
  - Leurs libellés ne sont pas toujours les noms d'usage des quartiers.
  - Les parts portent sur tous les actifs qui habitent le secteur, quelle que soit leur commune de travail.
  - Le stationnement et l'absence de voiture portent sur les ménages (résidences principales).
  - Ce sont des estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés.
- **Proximité.** Elle est calculée sur les adresses de la Base adresse nationale et les équipements de la base permanente des équipements 2025 de l'INSEE, à vol d'oiseau. Le résultat est une part d'adresses, pas d'habitants. La proximité d'un équipement ne dit rien de son usage.
- **Villes de taille proche.** Il s'agit des 36 communes de France métropolitaine, hors Le Mans, qui sont la plus grande commune de leur unité urbaine (par le nombre d'actifs occupés résidents) et qui comptent de la moitié au double des actifs occupés du Mans, avec un nombre minimal de lignes d'échantillon.
  - La médiane porte sur les parts communales : chaque commune compte une fois.
- **Carburant.** Source : prix-carburants.gouv.fr. Le prix retenu est la médiane, entre stations, du dernier prix déclaré dans la semaine. Les stations retenues sont situées dans un rayon de 12 km à vol d'oiseau autour du centre du Mans.
  - Le scénario chiffre le seul surcoût de carburant.
  - Une hausse passée ne dit rien des prix à venir.

---

## C. Correspondance interne (non publiée)

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Titre | 37 % | `iris.voiture.min` | oui |
| Titre | 80 % | `iris.voiture.max` | oui |
| Chapeau | 0,72 € par litre | `carburant.gazole.ecart` | oui |
| Le plein | 12 km | `carburant.gazole.prix` (périmètre) | oui |
| Le plein | 1,59 €/L ; semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant` | oui |
| Le plein | 2,31 €/L ; semaine du 5 octobre 2026 | `carburant.gazole.prix` | oui |
| Le plein | 1,68 €/L | `carburant.e10.prix_un_an_avant` | oui |
| Le plein | 2,15 €/L | `carburant.e10.prix` | oui |
| Le plein | 6 L/100 km ; 200 allers-retours ; 5 centimes | `scenario.carburant.*` (hypothèses, section 7) | oui |
| Pratiques | 2022 | `mobpro.modes.voiture` (millésime) | oui |
| Pratiques | 58 % | `mobpro.modes.voiture`, `comparaison.voiture.commune` | oui |
| Pratiques | 59 % | `comparaison.voiture.mediane_groupe` | oui |
| Pratiques | 37 % (Jacobins-République) | `iris.voiture.min`, `iris.721810103.voiture` | oui |
| Pratiques | 31 % TC (Jacobins-République) | `iris.721810103.tc` | oui |
| Pratiques | 22 % à pied (Jacobins-République) | `iris.721810103.marche` | oui |
| Pratiques | 38 % (Leclerc, Gare) | `iris.721810201.voiture`, `iris.721810202.voiture` | oui |
| Pratiques | 80 % (Oasis) | `iris.voiture.max`, `iris.721812403.voiture` | oui |
| Pratiques | 79 % (Haut de Gazonfier) | `iris.721810502.voiture` | oui |
| Pratiques | 78 % (Meslier) | `iris.721810902.voiture` | oui |
| Pratiques | 43 points | `ecart.iris.voiture.max_moins_min` | oui |
| Pratiques | 35 % | `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` | oui |
| Lieu de travail | 71 % | `mobpro.travaille_dans_commune` | oui |
| Lieu de travail | 52 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Lieu de travail | 79 % | `mobpro.voiture_selon_destination.communes_voisines` | oui |
| Lieu de travail | 27 points | `ecart.voiture_destination.voisines_moins_meme_commune` | oui |
| Lieu de travail | 74 % | `mobpro.voiture_selon_destination.ailleurs` | oui |
| Lieu de travail | six communes | liste du groupe (section 1) | oui |
| Lieu de travail | 88 % | `mobpro.qui_vient_travailler.reste_unite_urbaine.voiture` | oui |
| Lieu de travail | 90 % | `mobpro.qui_vient_travailler.hors_unite_urbaine.voiture` | oui |
| Courses | 500 mètres | `iris.<code>.panier_500m` (définition) | oui |
| Courses | toutes les adresses (100 %) : Jacobins-République, Leclerc, Gare, Courboulay | `iris.721810103.panier_500m`, `iris.721810201.panier_500m`, `iris.721810202.panier_500m`, `iris.721810102.panier_500m` | oui |
| Courses | aucune adresse (0 %) : Université, Cadran | `iris.721811601.panier_500m`, `iris.721811401.panier_500m` | oui |
| Courses | 2 % (Riffaudières) | `iris.721811102.panier_500m` | oui |
| Vérifications | 56 % | `iris.menages_commune.menages_stationnement_reserve` | oui |
| Vérifications | 42 % (Jacobins-République, stationnement) | `iris.721810103.stationnement_reserve` | oui |
| Vérifications | 25 % (Petit Louvre, stationnement) | `iris.721811801.stationnement_reserve` | oui |
| Vérifications | 23 % (Vieux Mans, stationnement) | `iris.721810101.stationnement_reserve` | oui |
| Vérifications | 91 % (Meslier, stationnement) | `iris.721810902.stationnement_reserve` | oui |
| Vérifications | 48 % (Jacobins-République, sans voiture) | `iris.721810103.menages_sans_voiture` | oui |
| Vérifications | 55 % (Petit Louvre, sans voiture) | `iris.721811801.menages_sans_voiture` | oui |
| Vérifications | 39 % (Vieux Mans, sans voiture) | `iris.721810101.menages_sans_voiture` | oui |
| Vérifications | 27 % | `iris.menages_commune.menages_sans_voiture` | oui |
| Vérifications | setram.fr, rubrique « Itinéraire » | `doc.reseau.site`, `doc.itineraire.page`, `doc.reseau.identite` | oui |
| Méthode | 2022 ; collectes 2020 à 2024 | limites `mobpro.*` | oui |
| Méthode | six (communes) | liste du groupe (section 1) | oui |
| Méthode | 300 actifs | `iris.voiture.min` (périmètre) | oui |
| Méthode | 2025 (base des équipements) | `acces.72181.*` (source) | oui |
| Méthode | 36 communes | `comparaison.voiture.groupe_n` | oui |
| Méthode | 12 km | `carburant.gazole.prix` (périmètre) | oui |

---

## D. Visuels et vérifications restantes

**Visuels retenus (3)**

1. **Tableau du scénario de surcoût de carburant**
   - Emplacement : section « Le plein, un an plus tard », après les hypothèses.
   - Étape manuelle : aucune.
2. **Carte de la part de la voiture par secteur (IRIS)**
   - Emplacement : section « Du centre aux secteurs extérieurs », après le paragraphe sur les écarts.
   - Étape manuelle : aucune pour la production (`--classes auto`, repères `--reperes`). Les secteurs cités sont à repérer : Jacobins-République, Leclerc, Gare, Oasis, Haut de Gazonfier, Meslier, Courboulay, Université, Cadran, Riffaudières, Petit Louvre, Vieux Mans.
   - Libellés à poser à la main seulement pour une version soignée.
3. **Tableau accessible des secteurs (HTML et Markdown)**
   - Emplacement : section « Et pour les courses… ».
   - Il est produit avec la carte. Étape manuelle : aucune.

Les barres par commune de travail et la carte de situation ne sont pas retenues : le texte donne les trois valeurs, et la limite est de trois visuels.

**Vérifications du dossier qui concernent des faits utilisés**

- `mobpro.voiture_selon_destination` : relire l'intérêt du choix des six communes. Il conditionne les 79 % et les 27 points (non bloquant).
- `iris.ecart_voiture` : relire les libellés d'IRIS cités. Le texte dit toujours « secteur » (non bloquant).
- `carburant.evolution` : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Cela touche le chapeau, la section « Le plein » et le tableau du scénario (obligatoire avant publication).

**Doutes de lecture**

- **« Gare »** est un libellé d'IRIS : le lecteur pourrait le lire comme « près de la gare ». À vérifier.
- **« Université »** (2 616 actifs, aucune adresse avec le panier complet) : vérifier que le libellé ne laisse pas croire à un campus sans logements.
- **Tableau accessible** : vérifier qu'il contient bien la colonne « Panier 500 m (adresses) », puisque le texte y renvoie pour le détail par secteur.
- **Unité urbaine** : elle est nommée sans liste ni nombre de communes, comme le dossier le prévoit (composition non exposée).

## F. Retouches éditoriales (15/10/2026, à la main, hors génération)

| Passage | Avant | Après | Raison |
|---|---|---|---|
| Votre projet, votre adresse | « Regardez la place de la voiture dans le secteur, ce qui se trouve à proximité, mais aussi la chaleur de l'été ou les risques à l'adresse. » | « Regardez l'ensemble : la mobilité, ce qui se trouve autour, la chaleur de l'été et les risques à l'adresse. » | Conclusion ramenée à l'examen de l'adresse dans son ensemble ; formule issue d'un exemple des consignes, retiré le 15/10/2026 |
