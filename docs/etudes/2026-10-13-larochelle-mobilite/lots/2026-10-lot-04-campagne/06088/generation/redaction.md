## A. Question et format

**Question principale :** quels secteurs examiner à Nice pour utiliser moins la voiture, et comment confronter ce choix au lieu de travail et aux besoins quotidiens ?

L’écart entre secteurs donne une première orientation pour chercher un logement. Le lieu de travail et la proximité des équipements permettent ensuite d’affiner cette recherche, sans déduire les possibilités d’une personne des pratiques observées.

**Appuis :** `iris.voiture.min`, `iris.voiture.max`, `mobpro.voiture_selon_destination.meme_commune`, `mobpro.voiture_selon_destination.communes_voisines`, `iris.060880103.panier_500m`, `iris.060883501.panier_500m`, `iris.060880905.panier_500m`, `iris.060880905.voiture`.

**Format :** article complet, resserré autour de ces observations, avec l’ouverture carburant imposée par la série.

**Pistes écartées :** stationnement, statut d’occupation et actifs venant travailler à Nice, qui disperseraient la question ; fréquences de bus inutilisables ; comparaison nationale indisponible.

## B. Article

# À Nice, choisir son secteur pour utiliser moins la voiture

Entre la semaine du 6 octobre 2025 et celle du 5 octobre 2026, le prix médian du gazole augmente de 0,60 €/L autour de Nice ; celui du SP95-E10, de 0,25 €/L. Pour qui cherche un logement, ces hausses donnent une raison concrète d’examiner la place de la voiture dans ses déplacements habituels.

Ces prix concernent les stations situées dans un rayon de 12 km à vol d’oiseau autour du centre de Nice. Le scénario ci-dessous illustre le surcoût annuel de carburant selon la distance domicile-travail, sans l’attribuer à un secteur ou à une destination.

Il retient une consommation de 6 L/100 km, 200 allers-retours domicile-travail par an et les hausses médianes arrondies à 5 centimes. Il porte sur le carburant seul.

[VISUEL : Tableau du scénario de surcoût de carburant]

| Distance du trajet aller | Surcoût annuel — gazole | Surcoût annuel — SP95-E10 |
|---|---:|---:|
| 5 km | environ 70 € | environ 30 € |
| 15 km | environ 220 € | environ 90 € |
| 35 km | environ 500 € | environ 210 € |

*Prix de référence : semaines du 6 octobre 2025 et du 5 octobre 2026. Source : prix-carburants.gouv.fr.*

## Des pratiques très différentes selon le secteur

Au recensement de 2022, la voiture est le mode principal pour aller travailler de 16 % des actifs qui habitent le secteur Vieux Nice-Visitation, contre 83 % à Crémat-Bellet. Ces parts concernent les actifs résidant dans chaque secteur, quelle que soit leur commune de travail.

Pour lire une annonce, le nom de Nice donne donc un repère trop large. La carte permet de situer les secteurs où les pratiques automobiles sont les moins ou les plus fréquentes, puis de confronter les logements repérés à ses propres déplacements.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

*Source : INSEE, recensement 2022.*

## Garder le lieu de travail dans la recherche

Le secteur de résidence ne suffit pas à décrire le trajet professionnel. Parmi les actifs qui habitent et travaillent à Nice, 39 % utilisent principalement la voiture pour aller travailler.

Cette part atteint 65 % parmi les actifs résidant à Nice qui travaillent à Antibes, Cannes, Cagnes-sur-Mer, Grasse, Le Cannet ou Saint-Laurent-du-Var.

Pour une recherche de logement, cela invite à garder la destination professionnelle à côté des annonces : un secteur où la voiture est peu utilisée pour travailler mérite d’être examiné avec votre propre lieu d’emploi et vos horaires.

## Et pour les courses, l’école et la pharmacie ?

Le travail ne résume pas les déplacements d’un ménage. Pour examiner le quotidien autour d’un logement, un autre repère devient utile : la présence simultanée d’un commerce alimentaire, d’une pharmacie et d’une école élémentaire à moins de 500 m à vol d’oiseau. C’est ce que désigne ici le « panier quotidien ».

À Vieux Nice-Visitation, toutes les adresses disposent de ce panier à proximité. À Crémat-Bellet, aucune adresse ne réunit ce panier à cette distance.

Mais proximité des équipements et pratiques domicile-travail ne se superposent pas systématiquement. À Ariane-Saramito, toutes les adresses ont ce panier à proximité, tandis que 71 % des actifs du secteur vont principalement travailler en voiture. Ce secteur mérite donc un examen différent selon que vous cherchez à revoir vos déplacements professionnels ou ceux liés aux besoins quotidiens.

## Passer des repères à la visite

Ces observations donnent des questions précises à emporter lors d’une visite. Depuis le logement, repérez le commerce et l’école qui vous seraient utiles, puis parcourez leurs accès : la proximité mesurée à vol d’oiseau ne décrit pas le chemin réel.

Pour le travail, reprenezz votre destination et vos horaires. Si vous envisagez les transports en commun, consultez le [site du réseau Lignes d’Azur](https://www.lignesdazur.com/) pour vérifier votre trajet et ses horaires aux jours concernés.

## Votre projet, votre adresse

Si vous déménagez pour rapprocher votre quotidien de ce qui compte pour vous, précisez les déplacements que vous aimeriez faire autrement. Avec futur•e, explorez l’adresse envisagée à partir de ce projet, pour la replacer dans l’ensemble de votre choix de logement.

## Méthode et sources

Les pratiques domicile-travail proviennent de l’INSEE : fichier MOBPRO et bases infracommunales Activité des résidents et Logement. Ce sont des estimations par sondage ; les petits écarts entre secteurs ne doivent pas être surinterprétés. Les secteurs sont les IRIS statistiques, dont les libellés ne correspondent pas toujours aux noms de quartiers d’usage.

Les groupes définis par la commune de travail sont distincts. Les résultats par secteur ne sont pas croisés avec la commune de travail et ne mesurent pas l’effet d’un déménagement.

La proximité des équipements est établie à partir des adresses BAN et de la BPE 2025 de l’INSEE. Chaque adresse du secteur compte pareil ; la présence d’un équipement ne renseigne pas sur son usage.

Les prix proviennent de prix-carburants.gouv.fr, à partir du dernier prix déclaré par chaque station pendant la semaine. Les stations déclarantes peuvent différer entre les périodes. Une hausse passée ne préjuge pas des prix futurs.

## C. Correspondance interne — non publiée

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau — période initiale | semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Chapeau — période finale | semaine du 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Chapeau — hausse du gazole | 0,60 €/L | `carburant.gazole.ecart` | oui |
| Chapeau — hausse du SP95-E10 | 0,25 €/L | `carburant.e10.ecart` | oui |
| Ouverture — périmètre des stations | rayon de 12 km à vol d’oiseau | `carburant.gazole.ecart`, `carburant.e10.ecart` | oui |
| Hypothèses du scénario — consommation | 6 L/100 km | `scenario.carburant.gazole.5km` — hypothèse commune, section 7 | oui |
| Hypothèses du scénario — déplacements | 200 allers-retours par an | `scenario.carburant.gazole.5km` — hypothèse commune, section 7 | oui |
| Hypothèses du scénario — arrondi | 5 centimes | `scenario.carburant.gazole.5km` — hypothèse commune, section 7 | oui |
| Tableau — trajet aller court | 5 km | `scenario.carburant.gazole.5km`, `scenario.carburant.e10.5km` | oui |
| Tableau — gazole, trajet court | environ 70 € | `scenario.carburant.gazole.5km` | oui |
| Tableau — SP95-E10, trajet court | environ 30 € | `scenario.carburant.e10.5km` | oui |
| Tableau — trajet aller intermédiaire | 15 km | `scenario.carburant.gazole.15km`, `scenario.carburant.e10.15km` | oui |
| Tableau — gazole, trajet intermédiaire | environ 220 € | `scenario.carburant.gazole.15km` | oui |
| Tableau — SP95-E10, trajet intermédiaire | environ 90 € | `scenario.carburant.e10.15km` | oui |
| Tableau — trajet aller long | 35 km | `scenario.carburant.gazole.35km`, `scenario.carburant.e10.35km` | oui |
| Tableau — gazole, trajet long | environ 500 € | `scenario.carburant.gazole.35km` | oui |
| Tableau — SP95-E10, trajet long | environ 210 € | `scenario.carburant.e10.35km` | oui |
| Légende du tableau — période initiale | semaine du 6 octobre 2025 | `carburant.gazole.prix_un_an_avant`, `carburant.e10.prix_un_an_avant` | oui |
| Légende du tableau — période finale | semaine du 5 octobre 2026 | `carburant.gazole.prix`, `carburant.e10.prix` | oui |
| Pratiques par secteur — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Pratiques par secteur — Vieux Nice-Visitation | 16 % | `iris.voiture.min` | oui |
| Pratiques par secteur — Crémat-Bellet | 83 % | `iris.voiture.max` | oui |
| Légende de la carte — millésime | 2022 | `iris.voiture.min`, `iris.voiture.max` | oui |
| Lieu de travail — résidents travaillant à Nice | 39 % | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Lieu de travail — résidents travaillant dans le groupe nommé | 65 % | `mobpro.voiture_selon_destination.communes_voisines` | oui |
| Définition du panier quotidien — distance | moins de 500 m à vol d’oiseau | `iris.060880103.panier_500m`, `iris.060883501.panier_500m`, `iris.060880905.panier_500m` | oui |
| Panier quotidien — Vieux Nice-Visitation | toutes les adresses — valeur exacte : 100 % | `iris.060880103.panier_500m` | oui |
| Panier quotidien — Crémat-Bellet | aucune adresse — valeur exacte : 0 % | `iris.060883501.panier_500m` | oui |
| Panier quotidien — Ariane-Saramito | toutes les adresses — valeur exacte : 100 % | `iris.060880905.panier_500m` | oui |
| Pratiques domicile-travail — Ariane-Saramito | 71 % | `iris.060880905.voiture` | oui |
| Méthode — millésime des équipements | BPE 2025 | `iris.060880103.panier_500m`, `iris.060883501.panier_500m`, `iris.060880905.panier_500m` | oui |

Le nom du réseau et le renvoi vers son site reposent sur `doc.reseau.identite` et `doc.reseau.site` — usage `oui`.

## D. Visuels et vérifications restantes

| Nom exact du visuel | Emplacement | Étape manuelle indiquée par le dossier |
|---|---|---|
| Tableau du scénario de surcoût de carburant | Ouverture, après les hypothèses | Aucune. Tableau disponible ; périodes de référence indiquées dans la légende. |
| Carte de la part de la voiture par secteur (IRIS) | Après le passage sur les pratiques par secteur | Aucune pour la production : classes automatiques (`--classes auto`), secteurs cités repérés par des numéros avec leur liste (`--reperes`). Libellés posés à la main seulement pour une version soignée. Repérer Vieux Nice-Visitation, Crémat-Bellet et Ariane-Saramito ; afficher le millésime. |

**Vérifications avant publication concernant les faits utilisés :**

- `carburant.evolution` : réextraire les prix la veille de la publication et contrôler la hausse sur les mêmes stations. Obligatoire avant publication ; concerne également le scénario.
- `iris.ecart_voiture` : relire les libellés Vieux Nice-Visitation, Crémat-Bellet et Ariane-Saramito. Ils sont employés ici comme noms de secteurs statistiques.
- `mobpro.voiture_selon_destination` : relire l’intérêt du groupe Antibes, Cannes, Cagnes-sur-Mer, Grasse, Le Cannet et Saint-Laurent-du-Var. Vérification non bloquante pour la rédaction : sa composition exacte est donnée dans l’article.