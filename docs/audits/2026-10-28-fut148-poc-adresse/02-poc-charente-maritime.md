# 2. POC en Charente-Maritime

## A. Mesure sur toutes les adresses du département

435 586 adresses BAN uniques (fichier `adresses-17.csv.gz` du 28/10/2026 ; le CSV répète un identifiant
pour chaque position, d'où 436 052 lignes).

| Rattachement | Adresses | Part |
|---|---|---|
| **Fiable, clé BAN exacte**, un immeuble | 342 062 | 78,5 % |
| **Fiable, clé BAN exacte**, plusieurs immeubles de même statut | 8 080 | 1,9 % |
| **Fiable, libellé identique** (commune, numéro, indice, voie normalisée) | 2 213 | 0,5 % |
| **Ambigu** : plusieurs immeubles de statuts différents sous la même clé | 312 | 0,07 % |
| **Indisponible** : la clé n'a que des points sans donnée fibre | 1 732 | 0,4 % |
| **Impossible** : aucun immeuble sous cette clé ni ce libellé | 81 187 | 18,6 % |

Statuts des adresses rattachées : déployé 349 308 · cible 1 186 · en cours de déploiement 967 · signé 378 ·
raccordable sur demande 281 · RAD en cours de déploiement 235.

**Les adresses sans clé**, regardées de près (83 401, dont 2 214 rattrapées ensuite par le libellé) :
- 20 603 ont un indice (`bis`, `ter`, `a`, `b`, `logt 2`…) : l'opérateur a souvent recensé le numéro sans
  indice, ou sous un autre libellé ;
- 21 892 ont un identifiant BAN au nouveau format (sans code Fantoir), pour beaucoup des voies ou adresses
  créées ou renommées ; 2 093 clés BAN de MCI n'existent d'ailleurs plus dans la BAN du jour ;
- 72 % sont des positions « entrée », 17 % « segment », 7 % « parcelle » : la BAN recense aussi des
  dépendances, des entrées secondaires et des terrains ;
- **diagnostic, pas rattachement** : un immeuble fibre existe à moins de 15 m pour environ 45 000 d'entre
  elles, de 15 à 50 m pour environ 32 000, à 150 m ou plus pour environ 3 000 (premier passage, avant
  dédoublonnage des identifiants) ;
- un troisième barreau textuel plus souple (même numéro et indice, nom de voie contenu dans l'autre)
  trouverait un candidat de statut unique pour 10 031 adresses, mais ces immeubles sont déjà rattachés à une
  autre clé BAN : **non retenu sans épreuve dédiée**. Pour 73 351 (88 %), il n'y a aucun candidat du tout.

## B. Échantillon de 49 adresses réelles

Tirage stratifié reproductible (graine 148, `poc_echantillon.py`) : maisons et immeubles déployés, adresses à
plusieurs immeubles, chacun des statuts non déployés, ambiguës, indisponibles, impossibles (ordinaires, à
indice, au nouveau format), rattachées par le libellé. Communes urbaines (La Rochelle, Rochefort, Saintes,
Royan), littorales, insulaires (Oléron) et rurales (Virollet, La Clotte, Saint-Martial-de-Mirambeau).

Chaque libellé passe par **le géocodeur de futur•e** (`data.geopf.fr/geocodage/search`, comme
`geocodeur-ban.ts`) : **49 / 49 identifiants identiques** à la clé BAN de départ. Le nombre de bâtiments RNB
sous la même clé est relevé à titre d'information (`rnb-api.beta.gouv.fr`).

| Adresse | Strate | Même clé | Rattachement | Statut | Opérateurs fibre | Immeubles IPE | Bâtiments RNB |
|---|---|---|---|---|---|---|---|
| 17 Rue du Chemin Vert 17110 Saint-Georges-de-Didonne | maison déployée | oui | fiable | deploye | 5 | 1 | 1 |
| 1 Rue des Amourettes 17170 Benon | maison déployée | oui | fiable | deploye | 5 | 1 | 1 |
| 84 Avenue du Général de Gaulle 17110 Saint-Georges-de-Didonne | maison déployée | oui | fiable | deploye | 5 | 1 | 1 |
| 26 Chemin des Sablons 17000 La Rochelle | maison déployée | oui | fiable | deploye | 5 | 1 | 2 |
| 4 Rue d'Archiac 17800 Pons | maison déployée | oui | fiable | deploye | 5 | 1 | 1 |
| 27 Rue de l'Eglise 17800 Pérignac | maison déployée | oui | fiable | deploye | 5 | 1 | 1 |
| 1 Route du Stade 17360 La Clotte | maison déployée | oui | fiable | deploye | 5 | 1 | 2 |
| 16 Rue des Bergonneaux 17140 Lagord | maison déployée | oui | fiable | deploye | 5 | 1 | 1 |
| 3 Rue Aimé Bonpland 17138 Saint-Xandre | immeuble déployé | oui | fiable | deploye | 5 | 1 | 2 |
| 17 Rue Jean Gabin 17139 Dompierre-sur-Mer | immeuble déployé | oui | fiable | deploye | 5 | 1 | 1 |
| 60 Avenue Leon Gambetta 17300 Rochefort | immeuble déployé | oui | fiable | deploye | 5 | 1 | 1 |
| 26 Cours National Michel BARON 17100 Saintes | immeuble déployé | oui | fiable | deploye | 5 | 1 | 0 |
| 3 Hameau de la Gare 17260 Virollet | immeuble déployé | oui | fiable | deploye | 5 | 1 | 1 |
| 1 Rue du Moulin Conteau 17800 Pons | immeuble déployé | oui | fiable | deploye | 5 | 1 | 1 |
| 9 b Rue du Stade 17130 Montendre | plusieurs, même statut | oui | fiable | deploye | 5 | 2 | 3 |
| 99 Rue de l'Aunis 17170 La Laigne | plusieurs, même statut | oui | fiable | deploye | 5 | 2 | 3 |
| 1 Bras de Chien 17120 Meursac | plusieurs, même statut | oui | fiable | deploye | 4 | 2 | 4 |
| 20 Chemin de l'Abbaye 17400 Asnières-la-Giraud | cible | oui | fiable | cible | — | 1 | 0 |
| 19 Rue Jean Pierre Coulon 17110 Saint-Georges-de-Didonne | cible | oui | fiable | cible | — | 1 | 1 |
| 14 Rue de la Petite Hermine 17200 Royan | signé | oui | fiable | signe | — | 1 | 1 |
| 9 Rue Myrtils 17640 Vaux-sur-Mer | signé | oui | fiable | signe | — | 1 | 0 |
| 20 Rue Henri Rochefort 17000 La Rochelle | en cours | oui | fiable | en cours de deploiement | — | 1 | 1 |
| 7 Route du Marais 17430 Genouillé | en cours | oui | fiable | en cours de deploiement | — | 1 | 5 |
| 10 Rue du Moulin des Chaumes 17620 Saint-Agnant | sur demande | oui | fiable | raccordable demande | — | 1 | 1 |
| 2 b Boulevard de Chaterny 17450 Fouras | sur demande | oui | fiable | raccordable demande | — | 1 | 11 |
| 10 Place Blair 17100 Saintes | sur demande | oui | fiable | raccordable demande | — | 1 | 2 |
| 35 Rue de Courbiac 17100 Saintes | RAD en cours | oui | fiable | rad en cours de deploiement | — | 1 | 1 |
| 26 Route des Gonds 17100 Saintes | RAD en cours | oui | fiable | rad en cours de deploiement | — | 1 | 1 |
| 1 Rue des Vacherons 17100 Saintes | ambigu | oui | ambigu | cible / deploye | 5 | 2 | 1 |
| 17 Rue du Moulin 17230 Longèves | ambigu | oui | ambigu | cible / deploye | 5 | 2 | 1 |
| 3 Allée de l'Albatros 17310 Saint-Pierre-d'Oléron | ambigu | oui | ambigu | cible / deploye | 5 | 2 | 1 |
| 4 Impasse des Maurines 17230 Charron | ambigu | oui | ambigu | deploye / signe | 5 | 4 | 1 |
| 4 Route de Pons-Gagnadou 17800 Fléac-sur-Seugne | indisponible | oui | indisponible | — | — | — | 2 |
| 98 Allee des Sternes 17550 Dolus-d'Oléron | indisponible | oui | indisponible | — | — | — | 1 |
| 11 Rue des 3 Moulins 17260 Montpellier-de-Médillan | indisponible | oui | indisponible | — | — | — | 5 |
| 19 Route de la Puisade 17320 Saint-Just-Luzac | impossible | oui | impossible | — | — | — | 2 |
| 3 Rue du Calvaire 17370 Le Grand-Village-Plage | impossible | oui | impossible | — | — | — | 0 |
| 41 Avenue de Bonnemie 17310 Saint-Pierre-d'Oléron | impossible | oui | impossible | — | — | — | 6 |
| 11 Rue des Fontaines 17139 Dompierre-sur-Mer | impossible | oui | impossible | — | — | — | 0 |
| 68 Avenue du Lieutenant Colonel Tourtet 17110 Saint-Georges-de-Didonne | impossible | oui | impossible | — | — | — | 2 |
| 15 Rue de l'Océan 17200 Saint-Sulpice-de-Royan | impossible | oui | impossible | — | — | — | 1 |
| 22 c Rue de l'Oreau 17170 La Ronde | impossible, indice | oui | impossible | — | — | — | 0 |
| 7 ter Rue Eugène Mousnier 17600 Saujon | impossible, indice | oui | impossible | — | — | — | 1 |
| 49 bis Avenue Leon Gambetta 17300 Rochefort | impossible, indice | oui | impossible | — | — | — | 1 |
| 30 Fief des Dames 17290 Aigrefeuille-d'Aunis | impossible, nouveau format | oui | impossible | — | — | — | 1 |
| 4 Lieu Dit l'Entre Deux 17150 Saint-Martial-de-Mirambeau | impossible, nouveau format | oui | impossible | — | — | — | 1 |
| 5 le Seguin 17430 Tonnay-Charente | impossible, nouveau format | oui | impossible | — | — | — | 1 |
| 28 c Rue du Petit Coudret 17100 Saintes | libellé | oui | fiable (libellé) | deploye | 5 | 1 | 0 |
| 1 Rue du Bourbonnais 17000 La Rochelle | libellé | oui | fiable (libellé) | deploye | 5 | 1 | 1 |

L'échantillon est **stratifié** : il éprouve chaque cas, il ne mesure pas la couverture. La couverture vient de
la mesure exhaustive du § A.

## C. Vérification contre les sites officiels

**cartefibre.arcep.fr (T2 2026).** Pour chacun des 43 immeubles rattachés de l'échantillon, la carte a été
centrée sur l'immeuble et l'objet rendu lu par son code IPE (`queryRenderedFeatures` sur la couche `imb`,
alimentée par `carte_fibre_immeubles_2026_T2_20260902`). **43 / 43 statuts identiques.**

**Ma connexion internet, « Débits à l'adresse ».**
- 19 rue Jean-Pierre Coulon (cible) : saisie de l'adresse sur le site, il ouvre l'immeuble
  `imid=21011762`, **le même `imb_id` que celui du POC**, et n'affiche aucune offre fibre (DSL, 4G fixe,
  satellite).
- 10 place Blair (raccordable sur demande) et 20 rue Henri-Rochefort (en cours de déploiement) : aucune
  offre fibre, conformément à l'équivalence « éligible fibre ⇔ déployé ». MCI ne nomme pas le statut ;
  cartefibre le fait.
- 49 bis avenue Léon-Gambetta (impossible) : le site ne propose pas « 49 bis », seulement « 49 ».

**Les cas qui interdisent la proximité.**
- 10 place Blair est raccordable sur demande ; le **11 place Blair, voisin immédiat, est déployé**.
- 3 allée de l'Albatros (Saint-Pierre-d'Oléron) : deux immeubles IPE à environ 140 m l'un de l'autre portent
  la même clé BAN, l'un « cible », l'autre « déployé ». C'est l'effet probable de la tolérance de 500 m de
  l'appariement de l'Arcep. Le POC les classe « ambigu ».

**Autour des adresses impossibles** (carte officielle, rayon d'environ 40 m, diagnostic seulement) : aucune ne
montre un immeuble portant exactement son adresse. Exemples : « 30 Cité du Fief des Dames » (déployé) pour
« 30 Fief des Dames » ; les 47, 49, 51 et 54 avenue Gambetta pour « 49 bis » ; rien à 40 m pour 11 rue des
Fontaines (Dompierre) et pour les trois adresses « indisponibles ». Dans tous ces cas, « raccordement à
vérifier » est la seule phrase honnête.

## D. Reproduire

```bash
# Fichiers MCI du département (≈ 40 Mo) et BAN
curl -sSfLO https://data.arcep.fr/fixe/maconnexioninternet/base_imb/last/departement/base_imb_17.csv.gz
curl -sSfLO https://data.arcep.fr/fixe/maconnexioninternet/eligibilite/last/departement/actuel_17.csv.gz
curl -sSfL -o adresses-17.csv.gz https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-17.csv.gz
# Fichier national cartefibre, lu en flux, seules les lignes 17 sont gardées (≈ 1 min 40)
curl -s https://static.data.gouv.fr/resources/le-marche-du-haut-et-tres-haut-debit-fixe-deploiements/20260910-162015/2026t2-immeuble.zip \
  | python3 -I scripts/research/fut148-adresse/extraire_imm.py imm17.csv
# Index, mesure, échantillon (les scripts attendent mci/, imm/, ban/ sous un même dossier)
python3 -I scripts/research/fut148-adresse/poc_index.py <dossier>
python3 -I scripts/research/fut148-adresse/poc_mesure.py <dossier>
python3 -I scripts/research/fut148-adresse/poc_echantillon.py <dossier>
python3 -I scripts/research/fut148-adresse/poc_echantillon_run.py <dossier>
```

Empreintes du 28/10/2026 : `base_imb_17.csv.gz` `d218e05d…7c1a22`, `actuel_17.csv.gz` `1ea5e1d8…bbbd`.
