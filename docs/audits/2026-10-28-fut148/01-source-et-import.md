# FUT-148 · 1. La source ARCEP et l'import communal

> Vérifié le 28/10/2026. Chaque affirmation porte sa source. Ce qui n'a pas pu être établi est dit comme tel.

## En bref

| | |
|---|---|
| Producteur | Arcep (Autorité de régulation des communications électroniques, des postes et de la distribution de la presse) |
| Jeu | data.gouv.fr, « Le marché du haut et très haut débit fixe (déploiements) » |
| Source primaire | `2026T2-Commune` : ZIP de shapefile, 32,7 Mo, SHA-256 `267604f9…eb468`, modifié le 10/09/2026 |
| Contrôle | `2026T2-obs-hd-thd-deploiement` : classeur de l'observatoire, 23,6 Mo, SHA-256 `507a9437…3c806` |
| Données arrêtées au | 30/06/2026 (cartefibre : « Données au 30 juin 2026 », « Dernière maj : 10 septembre 2026 ») |
| Licence | `fr-lo`, Licence Ouverte / Open Licence (Etalab), déclarée par data.gouv.fr. La carte cartefibre elle-même est en CC-BY-SA ; nous ne reprenons pas la carte, seulement les données ouvertes. |
| Grain | Commune (COG), Paris, Lyon et Marseille par arrondissements ; outre-mer compris |
| Non téléchargé | `2026T2-Immeuble` (834,7 Mo) |

## 1. Les définitions, lues à la source

Toutes viennent de l'onglet « Sommaire » du classeur de l'observatoire T2 2026, sauf mention.

- **Raccordable (FttH)** : « Logements ou locaux à usage professionnel pour lesquels il existe une
  continuité optique entre le point de mutualisation et le point de branchement optique. »
- **Éligible** (notion distincte, non utilisée) : un local raccordable « pour lequel au moins un opérateur a
  relié le point de mutualisation […] à son réseau de collecte ». Le fichier par commune ne la publie pas.
- **Raccordable sur demande (RAD)**, PDF de l'observatoire T2 2026, § 3.2 : « un local pour lequel la pose
  du point de branchement optique (PBO) est différée dans le temps, subordonnée à une demande effective de
  raccordement […]. A compter d'une commande de l'opérateur commercial, la mise à disposition d'un PBO
  « raccordable sur demande » ne devrait pas excéder 6 mois. » **Les RAD (0,3 %) et RAD en cours de
  déploiement (0,1 %) figurent parmi les 4,7 % de locaux « restant à rendre raccordables ».** Ils ne sont
  donc pas comptés dans `ftth`. Le même PDF le redit pour les engagements : « les chiffres ne prennent en
  compte que les locaux raccordables et font abstraction des locaux raccordables sur demande ».
- **Autres statuts** (cartefibre, à l'adresse seulement) : études réalisées, programmé, en cours de
  déploiement, raccordable sur demande (en cours de déploiement), déployé. Le fichier par commune ne les
  ventile pas ; le PDF national donne la répartition des 4,7 % restants (en étude 1,4 %, en construction
  0,6 %, en cours de déploiement 0,6 %, refus tiers 1,1 %, non planifiés 0,5 %, RAD 0,3 %, RAD en cours 0,1 %).
- **Le dénominateur** (« Meilleure estimation des locaux ») : les fichiers IPE des opérateurs ; « quand une
  commune n'est pas, ou pas totalement, répertoriée », l'Insee : « la somme des logements et du nombre
  d'établissements d'entreprises de 1 salarié ou plus » (logements millésime 2023, établissements 2024).
  4 199 communes de la table ont un dénominateur Insee (non entier : 742,10 locaux à Chabreloche).
- **La règle de calcul** (cartefibre, « Méthode ») : le taux « rapporte le nombre total de locaux
  raccordables au réseau FttH déclaré par les opérateurs à une estimation du nombre total de locaux de la
  commune ».

Ce que la donnée **n'est pas** : ni l'éligibilité d'une adresse, ni un abonnement (28,1 millions
d'abonnements fibre fin juin 2026, une autre grandeur), ni une offre commerciale disponible chez tous les
opérateurs, ni un débit, ni l'accès à Internet par d'autres technologies (cuivre, câble, 4G/5G fixe,
satellite). Les chiffres « sont issus des déclarations des opérateurs ; ils peuvent donc être sujets à
modification ».

## 2. Le schéma lu

`communes_2026T2.dbf` (34 919 enregistrements, aucun supprimé) : `INSEE_COM`, `NOM_COM`, `INSEE_DEP`, …,
`Locaux` (réel), `ftth` (entier), `couv` (classe de cartefibre). Les classes publiées sont : 0 aucune ligne,
5 moins de 10 %, 10 de 10 à 25 %, 25 de 25 à 50 %, 50 de 50 à 80 %, 80 de 80 à 95 %, 95 plus de 95 %.
Le `.cpg` annonce UTF-8 ; le nom de champ `ZMD_privé` et certains noms de régions sont en latin-1. Nous ne
lisons que des codes et des nombres.

## 3. Les contrôles, et ce qu'ils ont trouvé

| Contrôle | Résultat T2 2026 |
|---|---|
| Codes en double | 0 |
| Valeurs vides ou non numériques | 0 |
| `ftth` > `Locaux` | 0 |
| Classe `couv` publiée ≠ classe de `ftth / Locaux` | **0 sur 34 919** : la règle de calcul est la bonne |
| Somme nationale | 43 063 602 raccordables sur 45 178 019 locaux, soit 95,32 % : 4,68 % restants, contre « 4,7 % » publiés |
| Référentiel futur•e (34 788 codes, `src/data/accueil-communes.json`) | **34 788 sur 34 788** présents ; 131 codes en plus, tous ultramarins |
| Somme des arrondissements = ligne communale du classeur | Paris 1 811 579 / 1 744 131, Lyon 389 332 / 381 720, Marseille 544 863 / 489 661 : égalité exacte |
| `ftth` identique au classeur | 34 919 sur 34 919 |
| `Locaux` identique au classeur | 34 917 sur 34 919 (ci-dessous) |
| Locaux nuls | 1 : Beaumont-en-Verdunois (55039), village détruit en 1916, 0 habitant |

**Les deux écarts entre publications.**

- **Thumeréville (54524)**, 97 habitants : 472 locaux dans le fichier par commune (49 raccordables, 10 %),
  52 dans le classeur (94 %). Le classeur est vraisemblable, mais aucune des deux publications n'est
  désignée comme correcte. La commune est rangée en `discordantes` ; futur•e n'affiche **aucun** taux, et le
  dit (« Chiffres de l'Arcep à confirmer »).
- **Haucourt-Moulaine (54254)** : 1 577,27 locaux (fichier) contre 1 686 (classeur), 0 raccordable des deux
  côtés. La part affichée est la même (0 %) : la ligne est gardée et l'écart signalé dans le rapport. C'est
  aussi le cas d'école « 0 % de fibre n'est pas 0 accès » : 3 483 habitants, opérateur déclaré EVIC
  (Est Vidéocommunication, réseau câblé).

**Absents du fichier par commune** : Saint-Pierre-et-Miquelon (97501, 97502), présents dans le classeur.
Hors du référentiel futur•e ; ils seraient lus « absente », jamais 0 %.

## 4. L'import

```bash
node scripts/arcep/telecharger.mjs [--trimestre 2026T2] [--cache <dossier>]   # ≈ 4 s, 56 Mo, hors dépôt
node scripts/arcep/construire.mts  [--cache <dossier>] [--rapport <fichier>]  # ≈ 8 s
```

- **Séparé du build.** Le téléchargement écrit dans un cache hors du dépôt (`$TMPDIR/futuree-arcep` par
  défaut) ; seul `data/arcep-fibre.json` est versionné. Un déploiement Vercel ne contacte jamais l'Arcep.
- **Publication atomique.** La table est écrite dans `data/arcep-fibre.json.tmp`, relue, puis renommée. Une
  construction qui échoue laisse l'ancienne table intacte.
- **Ce qui fait échouer la construction** : double, effectif invalide, raccordables au-delà des locaux,
  classe contredite, somme PLM ≠ classeur, couverture du référentiel sous 99,5 % (le signe d'un changement
  de géographie communale à traiter, pas d'une commune à taire).
- **Métadonnées portées par la table** : producteur, jeu, licence, trimestre, date d'arrêt, URL, SHA-256,
  taille et date de modification des deux fichiers, date d'extraction, convention (`arcep-fibre-1`),
  couverture, somme nationale.
- **Format** : `[locaux, raccordables, "ipe" | "insee"]` par code, une commune par ligne (un trimestre
  suivant se relit en diff). 901 280 octets, 245 790 compressés.

## 5. Les états d'une lecture

| État | Quand | Affiché |
|---|---|---|
| `null` | Table illisible | « Donnée indisponible », sans taux |
| `absente` | Code absent du fichier | « Non publiée par l'Arcep », sans taux |
| `sans_locaux` | Aucun local recensé | « Aucun local recensé », sans taux |
| `discordante` | Les deux publications donnent des parts différentes | « Chiffres de l'Arcep à confirmer », sans taux |
| `mesuree` | Sinon | La part, ses effectifs, sa date |

Paris, Lyon et Marseille, lus à leur code communal, somment leurs arrondissements ; un seul arrondissement
manquant ou discordant rend la lecture `absente` ou `discordante`, jamais une somme partielle.

La part s'affiche en entier à l'arrondi usuel (Job : 22 / 765,06 = 2,88 %, affiché 3 %), jamais 100 %
s'il reste un local non raccordable, jamais 0 % s'il y en a un (« moins de 1 % »).
