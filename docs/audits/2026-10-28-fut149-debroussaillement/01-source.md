# FUT-149 · 1. La source : zonage informatif des obligations légales de débroussaillement (OLD)

> 28/10/2026. Vérifié sur l'édition IGN du 01/03/2026 (téléchargée le 28/10/2026), la documentation v7.0
> (mars 2026), les arrêtés ministériels de classement et un échantillon d'arrêtés et de pages préfectorales.
> Copies durables (hors dépôt) : `~/Documents/futuree-debroussaillement/` (archive source, édition construite,
> analyses, documentation IGN).

## En une phrase

La base DÉBROUSSAILLEMENT dit si un terrain est dans le **zonage informatif** des OLD (massifs classés à risque
d'incendie et bande de 200 m) ; elle ne dit **ni la règle** (profondeur, travaux), **ni le danger** d'incendie,
**ni** qu'un terrain est boisé. Seuls l'arrêté préfectoral et le code forestier font foi.

## 1. Identité, licence, publication

| | Constat |
|---|---|
| Producteur | IGN, pour le ministère de l'Agriculture (attribution WMS : ministère de l'Agriculture et de la Souveraineté alimentaire) |
| Licence | **Licence Ouverte 2.0** (Etalab) : fiche data.gouv (`lov2`) et métadonnées CSW (`IGNF_DEBROUSSAILLEMENT`). Réutilisation commerciale permise, avec mention de la source. Aucune restriction jointe aux fichiers (contrairement à BDIFF, FUT-147). |
| Dernière édition | **01/03/2026** (version 7.0). Éditions antérieures : 10/2023, 03/2024, 12/2024, 02/2025 (v6.0). Le WMS raster affiche « Édition : 2026-01-01 » ; la fiche data.gouv est datée du 08/09/2026 (métadonnées). |
| Téléchargement | `data.geopf.fr/telechargement/resource/DEBROUSSAILLEMENT` : GeoPackage complet (590 Mo en 7z, 1,76 Go décompressé) ou allégé (77 Mo / 156 Mo). SHA-256 de l'archive complète : `b224f900…9b42e`. |
| Projection | Lambert-93 (EPSG:2154), résolution décimétrique. |
| Services | WFS `DEBROUSSAILLEMENT:debroussaillement` (attributs complets, prédicats côté serveur), WMS/WMTS. |
| Documentation | `DC_DL_DEBROUSSAILLEMENT.pdf` v7.0, `SE_DEBROUSSAILLEMENT.pdf` (suivi des évolutions), `Info_zonage-OLD-Geoportail.pdf` (notice). La page d'aide cartes.gouv.fr et la fiche data.gouv disent encore **45 départements** : périmées, la v7.0 en couvre **52**. |

## 2. Contenu et attributs

247 248 objets, dont :

| `ZONAGE` | `DIFFUSION` | Objets | Sens (doc. v7.0 § 3.2.2) |
|---|---|---|---|
| 1 (massif) | Non | 243 011 | contour des massifs classés, non affiché |
| 2 (« buffer ») | **Oui** | **4 236** | **la zone à OLD affichée** (massif et bande de 200 m, polygones pleins, 23 961 trous) |
| 2 | **O** | 1 | Savoie, 3,2 km² : valeur hors nomenclature, absente de la carte officielle (version allégée = 4 236 objets). **Lue « incertain »**, jamais en zone ni hors zone. |

Les 4 237 zones sont toutes valides (Shapely), ne se recouvrent pas (moins de 1 m² au total), couvrent
**128 323 km²** et comptent 9,5 millions de sommets. La version allégée a exactement les mêmes géométries.

Attributs utilisés : `DEPT`, `SOURCE` (zonage de la préfecture, de l'IGN, ou mixte), `MILLESIME` (année des cartes
forestières), `DAT_AP_OLD` (date de l'arrêté préfectoral, `JJ/MM/AA`), `URL` (page de la préfecture),
`DATE_INTEG`, `ORIGINE` (BD Forêt V2 ou Masque Forêt + Landes).

**Hachures (« secteurs imprécis »).** La notice du Géoportail les décrit ; aucun attribut ne les distingue. Les
éditions 1.0 à 5.0 contenaient des « données temporaires » (emprise de communes ou de départements entiers),
qui étaient ces secteurs ; la v7.0 n'en a plus (52 départements : 39 DDT(M), 6 IGN, 1 mixte, 6 IGN corrigées).

## 3. Nature juridique

- **Effet** : obligation de débroussailler autour des constructions situées dans les bois classés ou à moins de
  200 m (code forestier, L134-6), en général sur 50 m, portée à 100 m par le préfet (fiche presse du ministère,
  06/01/2026). Socle national : arrêté du 29/03/2024 (L131-10), modifié le 01/04/2025 ; les arrêtés préfectoraux
  devaient s'y conformer avant le 30/09/2025.
- **Information de l'acquéreur et du locataire** : depuis le **01/01/2025**, le vendeur ou le bailleur d'un bien
  en zone soumise en informe l'acquéreur ou le locataire ; l'état des risques porte une fiche OLD (décret
  n° 2024-405 du 29/04/2024, code de l'environnement R125-23). Sources : fiche presse du ministère (06/01/2026),
  notaires.fr, Banque des territoires. Le texte consolidé n'a pas pu être relu sur Légifrance pendant cette mission.
- **Valeur du zonage** : **informatif** (doc. v7.0 § 2.5) : « certains massifs boisés (inférieurs à 4 hectares)
  peuvent ne pas apparaître […] alors que des OLD s'y appliquent ». Les bandes de 200 m ne sont coupées qu'aux
  limites de département : une commune sans massif classé peut être dans la zone d'un massif voisin (§ 2.2).
- **Règles départementales** : profondeur, travaux, dérogations varient (fiches techniques de l'arrêté de 2024,
  mise à jour du 10/01/2025). D'où l'absence de tout nombre de mètres imposé dans les phrases visibles.

## 4. Couverture : départements juridiquement concernés contre départements publiés

Arrêté du 6 février 2024 « classant les bois et forêts exposés au risque d'incendie » : article 3 (L133-1,
**25 départements entiers**, sauf les massifs de l'annexe 2) ; annexe 1 (L132-1, massifs ou communes listés)
remplacée par l'arrêté du 20/05/2025 (23 départements ; le Jura en sort) puis par celui du **13/04/2026** (JO du
28/04/2026, **27 départements** : Corrèze, Essonne, Haute-Loire, Seine-et-Marne en plus).

**Résultat : les 52 départements de la base sont exactement les 25 + 27 des arrêtés en vigueur** (contrôle
automatique dans `scripts/debroussaillement/construire.py`, qui refuse de construire en cas d'écart). Hors de
ces départements, la base n'a aucune zone : l'application dit « aucun zonage publié pour ce département », et
jamais « pas d'obligation ». Outre-mer : non couvert (aucun département ultramarin dans les arrêtés).

Dans les 27 départements de l'annexe 1, la couverture est **partielle par construction** (massifs nommés,
communes listées, seuils de surface, aléa « fort ou très fort » en Haute-Garonne et en Corrèze).

## 5. Dates par département (édition du 01/03/2026)

« Arrêté préfectoral » = `DAT_AP_OLD` tel que publié. **41 départements sur 52** s'appuient sur des cartes des
bois de 2016 ou avant (dit à l'écran au-delà de dix ans) ; **9** n'ont pas de date d'arrêté (surtout les
départements classés en 2025-2026) ; trois dates sont antérieures à la révision imposée pour le 30/09/2025
(Ardèche 2013, Isère 2013, Loire 2011) : l'écran dit « date indiquée par la base ; un arrêté plus récent a pu
le remplacer ».

| Dép. | Classement | Nature (attribut SOURCE) | Cartes des bois | Arrêté préfectoral | Intégration IGN |
|---|---|---|---|---|---|
| 04 Alpes-de-Haute-Provence | L133-1 (entier) | Zonage local | 2009 | 2025-10-01 | 2025-02-01 |
| 05 Hautes-Alpes | L133-1 (entier) | Zonage local | 2009 | 2025-11-03 | 2025-02-01 |
| 06 Alpes-Maritimes | L133-1 (entier) | Zonage IGN+traitements locaux | 2023 | 2025-09-25 | 2026-01-01 |
| 07 Ardèche | L133-1 (entier) | Zonage IGN | 2007 | 2013-03-14 | 2024-04-01 |
| 09 Ariège | L133-1 (entier) | Zonage local+traitements IGN | 2011 | 2025-05-05 | 2023-03-01 |
| 11 Aude | L133-1 (entier) | Zonage local | 2015 | 2025-04-07 | 2024-04-01 |
| 12 Aveyron | L133-1 (entier) | Zonage local | 2008 | 2025-03-31 | 2023-06-30 |
| 13 Bouches-du-Rhône | L133-1 (entier) | Zonage local | 2008 | 2025-10-15 | 2025-02-01 |
| 16 Charente | L132-1 (massifs listés) | Zonage local | 2014 | 2025-07-17 | 2026-01-01 |
| 17 Charente-Maritime | L132-1 (massifs listés) | Zonage local | 2014 | 2025-06-24 | 2024-06-01 |
| 18 Cher | L132-1 (massifs listés) | Zonage local | 2005 | 2025-01-20 | 2025-02-01 |
| 19 Corrèze | L132-1 (massifs listés) | Zonage local | 2012 | non renseignée | 2026-01-01 |
| 22 Côtes-d'Armor | L132-1 (massifs listés) | Zonage local | 2011 | non renseignée | 2025-02-01 |
| 24 Dordogne | L133-1 (entier) | Zonage local | 2012 | 2025-09-24 | 2025-02-01 |
| 26 Drôme | L133-1 (entier) | Zonage IGN | 2023 | 2025-09-30 | 2026-01-01 |
| 27 Eure | L132-1 (massifs listés) | Zonage local | 2009 | 2025-09-15 | 2023-09-30 |
| 28 Eure-et-Loir | L132-1 (massifs listés) | Zonage local | 2012 | non renseignée | 2025-02-01 |
| 29 Finistère | L132-1 (massifs listés) | Zonage IGN+traitements locaux | 2021 | non renseignée | 2026-01-01 |
| 2A Corse-du-Sud | L133-1 (entier) | Zonage local | 2011 | 2025-09-29 | 2024-04-01 |
| 2B Haute-Corse | L133-1 (entier) | Zonage local | 2011 | 2025-09-30 | 2023-03-01 |
| 30 Gard | L133-1 (entier) | Zonage local | 2015 | 2025-03-28 | 2024-04-01 |
| 31 Haute-Garonne | L132-1 (massifs listés) | Zonage local | 2013 | 2025-03-31 | 2025-02-01 |
| 32 Gers | L132-1 (massifs listés) | Zonage local | 2011 | 2025-04-25 | 2024-04-01 |
| 33 Gironde | L133-1 (entier) | Zonage IGN+traitements locaux | 2021 | 2025-10-17 | 2026-01-01 |
| 34 Hérault | L133-1 (entier) | Zonage local | 2015 | 2025-04-08 | 2025-02-01 |
| 35 Ille-et-Vilaine | L132-1 (massifs listés) | Zonage IGN | 2023 | 2025-01-23 | 2026-01-01 |
| 36 Indre | L132-1 (massifs listés) | Zonage local | 2017 | non renseignée | 2025-02-01 |
| 37 Indre-et-Loire | L132-1 (massifs listés) | Zonage local | 2011 | 2025-12-31 | 2025-02-01 |
| 38 Isère | L132-1 (massifs listés) | Zonage local+traitements IGN | 2009 | 2013-04-12 | 2023-09-30 |
| 40 Landes | L133-1 (entier) | Zonage IGN+traitements locaux | 2021 | 2025-08-22 | 2026-01-01 |
| 41 Loir-et-Cher | L132-1 (massifs listés) | Zonage local | 2011 | 2025-01-13 | 2025-02-01 |
| 42 Loire | L132-1 (massifs listés) | Zonage local, Zonage IGN | 2006 | 2011-07-28 | 2023-06-30 |
| 43 Haute-Loire | L132-1 (massifs listés) | Zonage local | 2010 | non renseignée | 2026-01-01 |
| 45 Loiret | L132-1 (massifs listés) | Zonage local | 2010 | 2025-01-09 | 2026-01-01 |
| 46 Lot | L133-1 (entier) | Zonage local | 2012 | 2025-09-29 | 2026-01-01 |
| 47 Lot-et-Garonne | L133-1 (entier) | Zonage IGN | 2009 | 2025-09-30 | 2025-02-01 |
| 48 Lozère | L133-1 (entier) | Zonage IGN | 2012 | 2025-10-08 | 2023-03-01 |
| 49 Maine-et-Loire | L132-1 (massifs listés) | Zonage local | 2008 | 2025-10-07 | 2025-02-01 |
| 56 Morbihan | L132-1 (massifs listés) | Zonage IGN+traitements locaux | 2022 | 2025-06-03 | 2026-01-01 |
| 64 Pyrénées-Atlantiques | L133-1 (entier) | Zonage IGN+traitements locaux | 2021 | 2025-07-17 | 2026-01-01 |
| 65 Hautes-Pyrénées | L133-1 (entier) | Zonage IGN | 2006 | 2025-03-31 | 2024-06-01 |
| 66 Pyrénées-Orientales | L133-1 (entier) | Zonage local | 2015 | 2025-06-23 | 2025-02-01 |
| 72 Sarthe | L132-1 (massifs listés) | Zonage local | 2019 | 2025-12-12 | 2025-02-01 |
| 73 Savoie | L132-1 (massifs listés) | Zonage local | 2006 | non renseignée | 2026-01-01 |
| 77 Seine-et-Marne | L132-1 (massifs listés) | Zonage local | 2012 | non renseignée | 2026-01-01 |
| 79 Deux-Sèvres | L132-1 (massifs listés) | Zonage local | 2007 | 2025-07-07 | 2024-04-01 |
| 81 Tarn | L133-1 (entier) | Zonage local | 2006 | 2025-05-28 | 2023-03-01 |
| 82 Tarn-et-Garonne | L132-1 (massifs listés) | Zonage IGN | 2013 | 2025-04-29 | 2024-06-01 |
| 83 Var | L133-1 (entier) | Zonage local | 2008 | 2025-09-26 | 2023-03-01 |
| 84 Vaucluse | L133-1 (entier) | Zonage local | 2019 | 2025-10-22 | 2026-01-01 |
| 86 Vienne | L132-1 (massifs listés) | Zonage local | 2007 | 2025-09-18 | 2026-01-01 |
| 91 Essonne | L132-1 (massifs listés) | Zonage local | 2014 | non renseignée | 2026-01-01 |

## 6. Limites retenues dans l'écran

| Limite | Effet à l'écran |
|---|---|
| Zonage informatif | « Ce zonage est indicatif : seuls l'arrêté du préfet et le code forestier font foi. » |
| Petits bois absents (< 4 ha) | Hors zone : « de petits bois peuvent y manquer, et seule la mairie peut confirmer qu'aucune obligation ne s'applique. » |
| Cartes des bois anciennes | Au-delà de dix ans : « le zonage s'appuie sur une carte des bois de 2008 : un bois a pu apparaître ou disparaître depuis. » |
| Date d'arrêté absente ou ancienne | Dans « En savoir plus », avec sa provenance (« date indiquée par la base »). |
| Département sans zonage publié | « non couvert », jamais « pas d'obligation ». |
| Objet à diffusion ambiguë (Savoie) | « incertain ». |
| Contradiction avec l'arrêté (3 communes du Vaucluse, cf. 02) | « incertain », motif dit. |
| Obligation attachée aux constructions | Parcelle à cheval (2-98 %) : « selon l'emplacement des constructions, le logement peut être concerné ou non ». |

## Références

- data.gouv.fr, jeu « DEBROUSSAILLEMENT » ; data.geopf.fr, flux de téléchargement et CSW `IGNF_DEBROUSSAILLEMENT`.
- IGN, DÉBROUSSAILLEMENT v7.0, descriptif de contenu et de livraison (mars 2026), suivi des évolutions, notice.
- Arrêté du 6 février 2024 (JORFTEXT000049111873), modifié les 20/05/2025 et 13/04/2026 ; annexes en PDF (AIDA/INERIS).
- Ministère de la Transition écologique, fiche presse OLD (06/01/2026) ; ministère de l'Agriculture, fiches techniques de l'arrêté du 29/03/2024 (10/01/2025).
- Décret n° 2024-405 du 29/04/2024 (sources secondaires : Banque des territoires, notaires.fr, Landot avocats).
