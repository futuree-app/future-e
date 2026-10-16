# Cholet (49099) : rendu de l'IA de rédaction

## A. Question et format

**Question principale.** À Cholet, dans quels secteurs et pour quel lieu de travail les actifs prennent-ils moins la voiture pour aller travailler ? Et que vérifier, une fois l'adresse repérée ?

**Ce que la réponse apprend au lecteur.** La voiture domine à Cholet, avec 10 points de plus que la médiane des villes de taille proche. Mais 31 points séparent le secteur où elle pèse le moins de celui où elle pèse le plus. L'écart est aussi net selon que l'on travaille à Cholet ou ailleurs.

**Lien avec la recherche de logement.** Le lecteur sait où regarder. Il voit aussi que la proximité des commerces et de l'école ne va pas toujours avec les pratiques de trajet. Enfin, les secteurs où l'on va le plus souvent travailler à pied ou en bus sont aussi ceux où peu de ménages ont une place de stationnement réservée. C'est une vérification concrète à faire dès l'annonce.

**Identifiants qui soutiennent la réponse.**
- Hausse du carburant : `carburant.gazole.*`, `carburant.e10.*`, `scenario.carburant.*`
- Usage de la voiture : `mobpro.modes.voiture`, `mobpro.modes.marche`, `comparaison.voiture.*`
- Écart entre secteurs : `iris.voiture.min`, `iris.voiture.max`, `ecart.iris.voiture.max_moins_min`, et les cellules `iris.490990402.*`, `iris.490990102.*`, `iris.490990401.*`, `iris.490990201.*`, `iris.490990902.*`, `iris.490990802.*`, `iris.490990903.*`, `iris.490990901.*`
- Lieu de travail : `mobpro.travaille_dans_commune`, `mobpro.voiture_selon_destination.*`, `destination.49099.marche`, `mobpro.qui_vient_travailler.*`
- Stationnement : `iris.menages_commune.*`
- Bus : `doc.reseau.*`, `doc.horaires.validite_cholet`, `doc.tarif.solidaire`

**Format.** Article complet, d'environ 850 mots hors méthode.

**Pistes écartées.**
- Posséder sans utiliser : 18 %, sous l'indice, et cela n'ajoute rien à la question.
- Statut d'occupation : intéressant, mais hors de la question.
- Indicateur d'accès communal pondéré : il alourdit le texte et ne se compare pas aux secteurs.
- Communes de travail fragiles : ordre de grandeur seulement.
- Gare à 2 km et médecin : sans rapport avec la question.

---

## B. Article

# Cholet : où la voiture pèse moins sur le trajet du travail

**Le prix médian du gazole a pris environ 75 centimes par litre en un an dans les stations autour de Cholet. Dans une ville où la voiture domine les trajets domicile-travail, la part de ceux qui la prennent change pourtant beaucoup d'un secteur à l'autre et selon le lieu de travail. Cela compte quand on choisit un logement.**

## Le plein, point de départ

La semaine du 5 octobre 2026, le prix médian du gazole est de 2,31 € le litre dans les stations situées dans un rayon de 12 km autour de Cholet. Un an plus tôt, il était de 1,55 €. Le SP95-E10 a aussi augmenté, de 1,63 € à 2,14 €.

Pour qui cherche un logement, cette hausse ramène à une question simple : combien de trajets en voiture ce logement suppose-t-il ? Le tableau ci-dessous chiffre le surcoût annuel de carburant pour un trajet domicile-travail de 5, 15 ou 35 km à l'aller. Hypothèses : une voiture qui consomme 6 L/100 km, 200 allers-retours par an, et la hausse d'un an arrondie à 5 centimes.

[VISUEL : Tableau du scénario de surcoût de carburant]

Le surcoût dépend du nombre de kilomètres faits en voiture. Il faut donc savoir où, à Cholet, on prend moins la voiture pour aller travailler.

## Une ville très motorisée, avec de vrais écarts entre secteurs

Au recensement de 2022, 78 % des actifs qui habitent Cholet vont travailler principalement en voiture. C'est 10 points de plus que la médiane des villes de taille proche, qui est de 68 % (voir la méthode). Le deuxième mode est la marche, avec 7 % des actifs.

Cette moyenne cache des secteurs très différents. Trente et un points séparent Saint-Pierre du Plessis. À Saint-Pierre, 60 % des actifs qui y habitent vont travailler en voiture et 24 % à pied. Au Plessis, 91 % prennent la voiture. Les secteurs Bretonnais et La Gare suivent Saint-Pierre, avec 67 % et 71 % pour la voiture et une part de marche de 14 % et 15 %. Saint-Corentin se distingue par un autre mode : 19 % de ses actifs vont travailler en transports en commun, la part la plus élevée de la ville. La carte donne le détail de chaque secteur.

[VISUEL : Carte de la part de la voiture par secteur (IRIS)]

Le lieu de travail sépare aussi les pratiques. 66 % des actifs qui habitent Cholet y travaillent. Parmi eux, 71 % vont au travail en voiture et 11 % à pied. Parmi ceux qui travaillent hors de Cholet, la part de la voiture atteint 93 %.

Ceux qui envisagent de vivre hors de Cholet et d'y venir travailler peuvent regarder l'autre sens du trajet. Environ 37 600 actifs travaillent à Cholet. 61 % d'entre eux habitent hors de l'unité urbaine de Cholet au sens de l'INSEE, et 96 % de ce groupe viennent travailler en voiture.

## Et pour les courses, l'école ou la pharmacie ?

Le trajet du travail n'est pas le seul de la semaine. Pour les courses, la pharmacie ou l'école, la question à se poser pendant une visite est différente : qu'y a-t-il à pied autour de l'adresse ?

Ici aussi, les secteurs diffèrent. À Saint-Pierre, la quasi-totalité des adresses (98 %) ont un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m à vol d'oiseau. Au Plessis, aucune adresse n'a ces trois équipements réunis à cette distance.

La proximité et les trajets du travail ne vont pas toujours ensemble. À La Grange, 89 % des adresses ont les trois équipements à moins de 500 m, et 82 % des actifs vont travailler en voiture. À Du Bellay, seulement 14 % des adresses les ont, et 71 % des actifs qui y habitent vont travailler en voiture. Ce sont donc deux vérifications distinctes : ce qui se trouve à pied autour du logement, et la façon dont on rejoindra son travail.

## Avant de signer : la place de la voiture et le bus

Reste une question pratique : où garer la voiture que l'on garde ? À Cholet, 65 % des ménages ont un emplacement réservé au stationnement. C'est le cas de seulement 33 % des ménages à Saint-Pierre, et de 25 % à Saint-Corentin comme à Bonnevay. Ce sont aussi les trois secteurs où la part des ménages sans voiture est la plus forte, de 30 % à 35 %, contre 15 % pour l'ensemble de la ville. Si vous gardez une voiture, vérifiez dès l'annonce qu'une place est comprise.

Pour le bus, le réseau urbain s'appelle Choletbus, et son site est https://www.choletbus.fr/. Les horaires des lignes de la desserte de Cholet (lignes 1 à 6, A, ZA1 et ZA2) s'appliquent depuis le 24 août 2026. C'est là qu'il faut vérifier, ligne par ligne, les arrêts proches de l'adresse visée et les horaires de votre trajet.

Les foyers dont le quotient familial CAF ou MSA est inférieur à 600 € bénéficient d'une réduction de 50 % sur tous les abonnements. Elle vaut pour tous les membres rattachés au foyer.

## Votre projet, votre adresse

Se rapprocher de son travail, s'installer en famille, préparer une retraite : le bon logement dépend de ce que l'on vient chercher. Sur futur•e, examinez l'adresse que vous envisagez à partir de ce projet. Mobilité, services, chaleur de l'été, risques : tout ce qui peut peser dans ce choix se regarde ensemble, à l'adresse.

### Méthode et sources

**Trajets domicile-travail.** Source : INSEE, recensement de la population 2022 (collectes 2020 à 2024), fichier détail des mobilités professionnelles. Les chiffres portent sur les actifs occupés de 15 ans ou plus et sur leur mode principal de transport pour aller travailler. Le total inclut ceux qui ne se déplacent pas. Les modes et les lieux de travail viennent d'un échantillon : ce sont des estimations. Les groupes comparés, par exemple ceux qui travaillent à Cholet et ceux qui travaillent ailleurs, sont des personnes différentes : leur écart décrit des pratiques, pas l'effet d'un changement d'emploi. L'unité urbaine est celle de l'INSEE (2020) ; sa composition n'est pas donnée ici.

**Secteurs.** Ce sont les IRIS de l'INSEE (bases infracommunales Activité des résidents et Logement, 2022) qui comptent au moins 300 actifs. Le secteur Bois Grolleau, zone d'activité, est exclu. Les noms sont ceux de l'INSEE et pas toujours ceux qu'on emploie pour les quartiers. Les valeurs sont des estimations par sondage : les petits écarts entre secteurs ne doivent pas être surinterprétés.

**Ménages.** Les parts portent sur toutes les résidences principales, retraités et étudiants compris.

**Équipements.** Ce sont des parts d'adresses (Base adresse nationale), pas d'habitants. Les équipements viennent de la Base permanente des équipements 2025 de l'INSEE. Les distances sont à vol d'oiseau : la marche réelle est plus longue. Être proche d'un équipement ne dit pas qu'on l'utilise.

**Villes de taille proche.** Le groupe compte 85 communes de France métropolitaine. Chacune est la plus grande de son unité urbaine (2020) par le nombre d'actifs occupés résidents, et compte de la moitié au double des actifs occupés résidents de Cholet. Un nombre minimal de réponses au recensement est exigé, et Cholet est exclue. La médiane est celle des parts communales : chaque commune compte une fois.

**Carburant.** Source : prix-carburants.gouv.fr. Le prix retenu est la médiane, entre stations, du dernier prix déclaré dans la semaine. Les stations sont celles situées dans un rayon de 12 km à vol d'oiseau autour du centre de Cholet. Les semaines comparées sont celles du 6 octobre 2025 et du 5 octobre 2026. Le scénario ne compte que le carburant et ne s'attribue à aucun secteur. Une hausse passée ne dit rien de l'avenir.

**Bus.** Les informations viennent de transport.data.gouv.fr (nom et site du réseau, consulté le 15 octobre 2026) et du site choletbus.fr (horaires, tarification solidaire, consulté le 14 octobre 2026).

---

## C. Correspondance interne (non publiée)

| Passage | Chiffre écrit | Identifiant(s) | Usage |
|---|---|---|---|
| Chapeau | environ 75 centimes par litre en un an | `carburant.gazole.ecart` | oui |
| Le plein | semaine du 5 octobre 2026 | `carburant.gazole.prix` (millésime) | oui |
| Le plein | 2,31 € | `carburant.gazole.prix` | oui |
| Le plein | 12 km | `carburant.gazole.prix` (périmètre) | oui |
| Le plein | 1,55 € | `carburant.gazole.prix_un_an_avant` | oui |
| Le plein | 1,63 € | `carburant.e10.prix_un_an_avant` | oui |
| Le plein | 2,14 € | `carburant.e10.prix` | oui |
| Le plein | 5, 15 ou 35 km à l'aller | `scenario.carburant.gazole.5km/15km/35km`, `scenario.carburant.e10.5km/15km/35km` (colonne « Trajet aller ») | oui |
| Le plein | 6 L/100 km, 200 allers-retours, 5 centimes | `scenario.carburant.*` (hypothèses, section 7) | oui |
| Pratiques | 2022 | `mobpro.modes.voiture` (millésime) | oui |
| Pratiques | 78 % | `mobpro.modes.voiture` / `comparaison.voiture.commune` | oui |
| Pratiques | 10 points | `comparaison.voiture.ecart` | oui |
| Pratiques | 68 % | `comparaison.voiture.mediane_groupe` | oui |
| Pratiques | 7 % (marche) | `mobpro.modes.marche` | oui |
| Pratiques | trente et un points | `ecart.iris.voiture.max_moins_min` | oui |
| Pratiques | 60 % (Saint-Pierre) | `iris.voiture.min` / `iris.490990402.voiture` | oui |
| Pratiques | 24 % à pied (Saint-Pierre) | `iris.490990402.marche` | oui |
| Pratiques | 91 % (Le Plessis) | `iris.voiture.max` / `iris.490990901.voiture` | oui |
| Pratiques | 67 % (Bretonnais) | `iris.490990102.voiture` | oui |
| Pratiques | 71 % (La Gare) | `iris.490990401.voiture` | oui |
| Pratiques | 14 % (marche, Bretonnais) | `iris.490990102.marche` | oui |
| Pratiques | 15 % (marche, La Gare) | `iris.490990401.marche` | oui |
| Pratiques | 19 % (TC, Saint-Corentin) | `iris.490990201.tc` | oui |
| Pratiques | 66 % | `mobpro.travaille_dans_commune` | oui |
| Pratiques | 71 % (voiture, travaillent à Cholet) | `mobpro.voiture_selon_destination.meme_commune` | oui |
| Pratiques | 11 % à pied (travaillent à Cholet) | `destination.49099.marche` | oui |
| Pratiques | 93 % | `mobpro.voiture_selon_destination.ailleurs` | oui |
| Pratiques | environ 37 600 | `mobpro.qui_vient_travailler.total` | oui |
| Pratiques | 61 % | `mobpro.qui_vient_travailler.hors_unite_urbaine.part_des_emplois` | oui |
| Pratiques | 96 % | `mobpro.qui_vient_travailler.hors_unite_urbaine.voiture` | oui |
| Courses | 98 % (quasi-totalité, Saint-Pierre) | `iris.490990402.panier_500m` | oui |
| Courses | 500 m | `acces.49099.panier_quotidien_500m` (définition, section 3) | oui |
| Courses | aucune adresse (Le Plessis) | `iris.490990901.panier_500m` (0 %, valeur exacte) | oui |
| Courses | 89 % (La Grange) | `iris.490990802.panier_500m` | oui |
| Courses | 82 % (La Grange) | `iris.490990802.voiture` | oui |
| Courses | 14 % (Du Bellay) | `iris.490990903.panier_500m` | oui |
| Courses | 71 % des actifs qui y habitent (Du Bellay) | `iris.490990903.voiture` | oui |
| Avant de signer | 65 % | `iris.menages_commune.menages_stationnement_reserve` | oui |
| Avant de signer | 33 % (Saint-Pierre) | `iris.490990402.stationnement_reserve` | oui |
| Avant de signer | 25 % (Saint-Corentin, Bonnevay) | `iris.490990201.stationnement_reserve`, `iris.490990902.stationnement_reserve` | oui |
| Avant de signer | de 30 % à 35 % | `iris.490990201.menages_sans_voiture` (30 %), `iris.490990402.menages_sans_voiture` (34 %), `iris.490990902.menages_sans_voiture` (35 %) | oui |
| Avant de signer | 15 % | `iris.menages_commune.menages_sans_voiture` | oui |
| Avant de signer | lignes 1 à 6, A, ZA1, ZA2 ; 24 août 2026 | `doc.horaires.validite_cholet` | avec ses conditions (périmètre : desserte de Cholet) |
| Avant de signer | Choletbus, https://www.choletbus.fr/ | `doc.reseau.identite`, `doc.reseau.site` | oui |
| Avant de signer | 600 € ; 50 % | `doc.tarif.solidaire` | avec ses conditions (quotient CAF ou MSA, abonnements, membres du foyer) |
| Méthode | 2022 ; 2020 à 2024 | `mobpro.*` (limites de famille) | oui |
| Méthode | 15 ans ou plus | `mobpro.modes.*` (population) | oui |
| Méthode | 2020 (unité urbaine, trajets domicile-travail) | `mobpro.qui_vient_travailler.*` (limite de famille : « Unité urbaine » = INSEE 2020) ; composition absente (section 1) | oui |
| Méthode | 300 actifs | `iris.voiture.min/max` (périmètre) | oui |
| Méthode | 2025 (BPE) | `acces.49099.*` (source) | oui |
| Méthode | 85 communes | `comparaison.voiture.groupe_n` | oui |
| Méthode | 2020 (unité urbaine, villes de taille proche) | section 4 bis (règle de `comparaison.voiture.*`) | oui |
| Méthode | 12 km | `carburant.*` (périmètre) | oui |
| Méthode | 6 octobre 2025 ; 5 octobre 2026 | `carburant.gazole.prix_un_an_avant`, `carburant.gazole.prix` | oui |
| Méthode | 15 octobre 2026 | `doc.reseau.identite`, `doc.reseau.site` (date de consultation) | oui |
| Méthode | 14 octobre 2026 | `doc.horaires.validite_cholet`, `doc.tarif.solidaire` (date de vérification) | oui |

---

## D. Visuels et vérifications restantes

**Visuels retenus**

1. **Tableau du scénario de surcoût de carburant**
   - Emplacement : section « Le plein, point de départ », après l'énoncé des hypothèses.
   - Étape manuelle : aucune, mais les prix doivent être réextraits avant publication (voir plus bas).
2. **Carte de la part de la voiture par secteur (IRIS)**
   - Emplacement : section « Une ville très motorisée », après le paragraphe sur les secteurs.
   - Étape manuelle : aucune pour la production. Les classes sont automatiques (`--classes auto`), et les secteurs cités dans l'article sont repérés par des numéros avec leur liste (`--reperes`) : Saint-Pierre, Le Plessis, Bretonnais, La Gare, Saint-Corentin. Les libellés ne se posent à la main que pour une version soignée.
   - Le **Tableau accessible des secteurs** est produit avec la carte, sans étape manuelle.

**Vérifications du dossier qui concernent des faits utilisés**

- **`carburant.evolution`** (non bloquante pour la rédaction, obligatoire avant publication) :
  - réextraire les prix la veille de la publication ;
  - contrôler la hausse sur les mêmes stations ;
  - mettre à jour le chapeau, la section « Le plein » et le tableau du scénario.
- **`iris.ecart_voiture`** (non bloquante) : relire les libellés d'IRIS cités avant de les présenter comme des noms de secteur. Libellés cités : Saint-Pierre, Le Plessis, Bretonnais, La Gare, Saint-Corentin, La Grange, Du Bellay, Bonnevay.
- **`mobpro.voiture_selon_destination`** (non bloquante) : l'article n'oppose que deux groupes, « travaillent à Cholet » et « travaillent hors de Cholet ». Aucun groupe de « communes voisines » n'est utilisé. Relire l'intérêt de ce choix.

**Doutes de lecture**

- **Hausse du gazole.** Le dossier donne 1,55 € et 2,31 €, mais une hausse de 0,75 €/L, alors que la différence des valeurs arrondies fait 0,76 €. Le chapeau dit désormais « environ 75 centimes », ce qui couvre l'écart d'arrondi. Il reste à vérifier, à la réextraction, que l'écart vient bien de l'arrondi.
- **Unité urbaine 49501.** 39 % des emplois de Cholet sont occupés par des habitants de Cholet et 61 % par des habitants de l'extérieur de l'unité urbaine, soit 100 % à eux deux. L'unité urbaine pourrait donc ne compter que Cholet. Sa composition n'est pas dans le dossier ; la méthode dit seulement qu'elle n'est pas donnée. Il faut quand même vérifier que l'expression « hors de l'unité urbaine de Cholet au sens de l'INSEE » ne trompe pas le lecteur.
- **Libellé « Du Bellay ».** À relire, comme les autres libellés : il peut ne pas correspondre au nom d'usage du quartier.

---

## E. Corrections

| Anomalie | Passage avant | Passage après |
|---|---|---|
| Raisonnement (bloquante) : lien non établi entre les secteurs où l'on prend moins la voiture et le manque de places réservées | « Reste une question pratique, qui se pose justement dans les secteurs où l'on prend moins la voiture : où garer celle que l'on garde ? » | « Reste une question pratique : où garer la voiture que l'on garde ? » |
| Raisonnement (a_revoir) : « mais » qui suggère un lien de cause entre proximité et voiture pour le travail ; corrigé, car la correction tient en quelques mots | « À Du Bellay, seulement 14 % des adresses les ont, mais la part de la voiture y est de 71 %. » | « À Du Bellay, seulement 14 % des adresses les ont, et 71 % des actifs qui y habitent vont travailler en voiture. » |
| Lisibilité (a_revoir) : risque de lire la distance comme un aller-retour ; corrigé, deux mots | « pour un trajet domicile-travail de 5, 15 ou 35 km » | « pour un trajet domicile-travail de 5, 15 ou 35 km à l'aller » |
| Lisibilité (a_revoir) : 0,75 € dans le chapeau contre 2,31 − 1,55 = 0,76 € dans le corps ; corrigé, quelques mots | « Le gazole a pris 0,75 € par litre en un an » | « Le prix médian du gazole a pris environ 75 centimes par litre en un an » |
| Population (a_revoir) : « vivre plus loin » laisse croire que les 61 % habitent loin de Cholet, et « unité urbaine » n'est pas défini ; corrigé, quelques mots dans le récit et une courte phrase en méthode | « Ceux qui envisagent de vivre plus loin et de venir travailler à Cholet… » ; méthode « Trajets domicile-travail » sans définition | « Ceux qui envisagent de vivre hors de Cholet et d'y venir travailler… » ; ajout en méthode : « L'unité urbaine est celle de l'INSEE (2020) ; sa composition n'est pas donnée ici. » |
| Conclusion (a_revoir) : « vous y verrez » énumère des fonctionnalités et promet un résultat, au-delà de la capacité autorisée ; corrigé, car il s'agit d'une seule phrase remplacée et d'une promesse non autorisée | « Vous y verrez ce qui se trouve à proximité et la place de la voiture dans le secteur, mais aussi la chaleur de l'été ou les risques à l'adresse. » | « Mobilité, services, chaleur de l'été, risques : tout ce qui peut peser dans ce choix se regarde ensemble, à l'adresse. » |
| Condition documentaire (a_revoir) : le nom et le site du réseau viennent de transport.data.gouv.fr, consulté le 15 octobre 2026 ; corrigé, une phrase de méthode | « Les informations viennent du site choletbus.fr, consulté le 14 octobre 2026. » | « Les informations viennent de transport.data.gouv.fr (nom et site du réseau, consulté le 15 octobre 2026) et du site choletbus.fr (horaires, tarification solidaire, consulté le 14 octobre 2026). » |