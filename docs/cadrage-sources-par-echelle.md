# Cadrage — toutes les sources, rangées par échelle (28/07/2026)

Passage de 6 modules (Territoire, Logement, Métier, Santé, Mobilité, Projets) à **3 modules**
(Commune, Autour de l'adresse, Logement). Ce document recense **toutes** les sources du dépôt et
les range par le **grain réel de leur mesure**, pas par leur thème.

## La règle de rangement

> **Une source peut alimenter plusieurs modules. Un couple *(question, grain)* n'appartient
> qu'à un seul.**

Ce qui se duplique, c'est la source ; jamais le fait. Le DPE ADEME répond à trois questions
distinctes : l'étiquette de *ce* logement (adresse), la distribution des étiquettes *autour*
(secteur), le taux de passoires de *la commune* (commune). Trois faits, trois preuves, trois
modules — pas un fait affiché trois fois.

Corollaire de contrôle : **si deux modules affichent le même fait au même grain, c'est un bug de
composition** (famille du 25/07).

Le modèle existe déjà : `echelles.ts` dérive l'échelle du grain porté par `EvidenceRef.grain`
(`commune` / `unite_urbaine` → territoire, `secteur` → quartier, `adresse` → logement). Rien à
inventer ; ce tableau dit seulement ce qu'on a à y mettre.

Statuts employés : **décide** = alimente une règle du moteur · **affichée** = fetchée et rendue,
ne pèse sur aucun verdict · **dormante** = intégrée, plus branchée à rien de visible.

---

## 1. Grain COMMUNE → module **Commune**

| Source | Ce que le grain permet de dire | Ce qu'il ne permet PAS de dire | Couverture | Statut |
|---|---|---|---|---|
| **DRIAS-TRACC** (climat projeté) | La trajectoire climatique du territoire à 2050 | Rien sur ce logement ni sur ce quartier | 35 006 communes | décide |
| **ERA5** (tendance observée) | Le réchauffement déjà constaté | — | par INSEE (Supabase) | décide |
| **GASPAR risques** | Les aléas dont la commune est officiellement signalée | Ni intensité, ni localisation dans la commune | nationale | décide (feu) |
| **GASPAR CatNat** | L'historique des reconnaissances de catastrophe naturelle | Si ce bien a été touché | nationale | décide |
| **ONRN / CCR sinistralité** | Les indemnisations sécheresse et inondation 1995-2021 | Rien sur ce logement — gaté par la représentativité | nationale | décide |
| **ADEME données communales** (population, vacance, logement social, revenu médian, APL médecins, éloignement services, densité, incendies, boisement) | Le profil socio-territorial de la commune | Aucune variation interne à la commune | nationale | décide (partiel) |
| **Qualité de l'air ADEME** (PM2.5, PM10, NO₂, O₃) | La moyenne annuelle communale | L'exposition de cette rue | nationale | affichée |
| **Atmo** (indice du jour, `code_zone` = INSEE) | La qualité de l'air du jour | — | zones Atmo | affichée |
| **Pollen** (zone Atmo, **repli département**) | Le risque allergénique | Rien de fin — la zone est souvent départementale | départementale de fait | affichée |
| **Eaufrance ONDE** (écoulement) | L'état d'écoulement des cours d'eau suivis | Rien sur l'eau du robinet ni sur la parcelle | stations | affichée |
| **VigiEau / Propluvia** | Le niveau d'arrêté sécheresse en vigueur | — | nationale | affichée |
| **Littoral** | L'appartenance au littoral | — | nationale | décide |
| **Baignade** (directive 2006/7/CE) | La qualité des eaux de baignade | — | communes concernées | dormante |
| **Saisonnalité** (résidences secondaires INSEE 2022) | La pression touristique | — | nationale | affichée |
| **Radon** (potentiel, classe 1-3) | Le potentiel radon du sous-sol communal | **Jamais** la concentration dans ce logement. Et **pas de grain plus fin** : `/radon` refuse `latlon`, et le `libelleStatutAdresse` du rapport au point recopie le communal (9 points testés) | nationale (Paris absent de `/radon`, présent via le rapport au point) | **ABSENT DU PRODUIT** — mesuré 19,5 % en classe 3 |
| **SEVESO / ICPE** | La présence de sites classés | — | nationale | décide (`sante-facts`) |
| **SIS** (Géorisques, appelé par `code_insee`) | Les secteurs d'information sur les sols de la commune | Si **cette** parcelle est concernée — l'appel n'est pas géométrique | nationale | dormante (page Savoir) |
| **Gissol / RMQS** (métaux lourds) | Les teneurs mesurées sur un réseau de points | Rien sur cette parcelle | maille large | dormante (landing) |
| **IRIS agrégés** (passoires, précarité énergétique, propriété, HLM, suroccupation, motorisation, transports) | Aujourd'hui : la moyenne des IRIS de la commune | ⚠️ Rien de sectoriel tant que l'IRIS du point n'est pas résolu — voir §4.1bis | nationale (Paris/Lyon/Marseille inclus depuis le 28/07) | affichée |
| **Coûts de rénovation ADEME** | Des ordres de grandeur par poste | Le coût de **ce** chantier — enquête **2017-2018** | **département** | dormante |
| **RGE** (artisans qualifiés) | Les professionnels référencés | — | nationale | dormante |

---

## 2. Grain SECTEUR → module **Autour de l'adresse**

| Source | Ce que le grain permet de dire | Ce qu'il ne permet PAS de dire | Couverture | Statut |
|---|---|---|---|---|
| **ICU CSTB** (`iuhi`, grand-IRIS) | L'intensité de l'îlot de chaleur du quartier, en °C réels | Rien sur l'inconfort **dans** ce logement | **596 communes** | affichée |
| **IRIS du point** ✅ 28/07 (passoires, précarité énergétique, propriété, location, HLM, suroccupation, déplacements motorisés, transports) | Le profil résidentiel du **secteur qui contient l'adresse** | Rien sur ce logement. ⚠️ Toutes **estimées** (ENL 2022 par sondage, GEODIP 2017) — voir §4.1 | nationale, hors adresses non résolues | affichée |
| **Ménages avec ≥ 1 voiture** ✅ 28/07 — INSEE RP 2022, base infracommunale | L'équipement automobile des ménages du secteur, comparé à sa commune | Ni le besoin d'une voiture, ni la possibilité de vivre sans. Pas de conclusion en IRIS d'activité/divers | 15 006 IRIS d'habitat + 33 030 communes non découpées | **mesuré, prêt** (non branché au moteur) |

Le second est arrivé le 28/07/2026 : `geo_distance=lon,lat,0` fait le point-in-polygon côté
data-fair, donc aucune géométrie à rapatrier (Paris compte 940 IRIS). Vérifié sur huit points —
centres de Paris/Lyon/Marseille, littoral, rural, et un point en mer qui rend bien zéro résultat.

**L'écart avec la moyenne communale est considérable** :

| | HLM | Passoires | Motorisation | Locataires |
|---|---|---|---|---|
| La Rochelle — **centre** | **7,3 %** | 32,2 % | **23,9 %** | 73,1 % |
| La Rochelle — **commune entière** | 31,1 % | 25,2 % | 50,1 % | 60,3 % |
| Paris 4e | 0 % | 30,9 % | **2,9 %** | 49,3 % |
| Paris — commune entière | 18,4 % | — | 13,0 % | — |

Le grain `secteur` reste néanmoins **émis par aucune règle du moteur** : la donnée est là, la
décision ne la lit pas encore. C'est le chantier suivant.

---

## 3. Grain ADRESSE / PARCELLE → module **Logement**

| Source | Ce que le grain permet de dire | Ce qu'il ne permet PAS de dire | Couverture | Statut |
|---|---|---|---|---|
| **DPE ADEME** — étiquette | La performance déclarée de ce logement | — | logements diagnostiqués | décide |
| **DPE ADEME** — confort d'été, inertie, protections solaires, ventilation, isolation | Comment ce logement se comporte l'été | — | idem, champs souvent vides | **affichée** |
| **DPE ADEME** — `annee_construction`, `type_batiment` | Les obligations documentaires applicables | — | idem | **affichée** |
| **Audit énergétique** + scénarios de travaux chiffrés | Les étapes de rénovation du logement réel | Un devis | audits déposés | **affichée** |
| **Géorisques adresse/parcelle** — RGA | L'aléa retrait-gonflement sous cette parcelle | — | nationale | décide |
| **Géorisques** — PPRN et plans réglementaires | Le plan applicable et son régime | Ce que les travaux autorisent — le règlement seul le dit | nationale | décide |
| **Géorisques** — sismique | La zone de sismicité | — | nationale | affichée |
| **Cavités BRGM** (rayon) | Les cavités recensées à proximité | La stabilité du sol sous le bâti | nationale | décide |
| **Mouvements de terrain BRGM** (rayon) | Les **événements passés** géolocalisés | ⚠️ Jamais une susceptibilité du terrain | nationale | affichée |
| **GPU servitudes AC1/AC2/AC4** | Le périmètre patrimonial, donc l'avis ABF possible | Ce qui sera autorisé | nationale | décide |
| **Cadastre** (parcelle, contenance) | L'assiette foncière | — | nationale | affichée |
| **Altitude IGN** | L'altitude NGF du point | — | nationale | affichée |
| **ZFE** (point-in-polygon) | Si l'adresse est dans une ZFE et le Crit'Air requis | — | ZFE existantes | affichée |
| **IREP** (rayon) | Les installations déclarant des rejets à proximité | Une exposition | nationale | affichée |
| **Cartofriches** (rayon, dont `sol_pollue`) | Les friches recensées, et si une pollution est signalée | ⚠️ Ne pas figurer ≠ sol sain | nationale | affichée |

---

## 4. Les quatre cas à trancher

### 4.1 — Les données IRIS étaient fausses ✅ CORRIGÉ le 28/07/2026

`commune-data.ts` résout la commune par INSEE, puis va chercher ses IRIS **par nom** et en fait la
**moyenne** :

```ts
const irisRows = await fetchIrisRecords(commune.nom);                    // par NOM
url.searchParams.set("qs", `_contours_iris.nom_com:"${communeName}"`);
passoires_taux: mean(rows.map((r) => r.passoires_taux));                 // moyenne
```

Deux défauts distincts, **tous deux confirmés contre l'API ADEME le 28/07/2026**.

**a) Le filtre par nom mélange les communes homonymes.** Mesuré :

| Nom interrogé | IRIS ramenés | Communes INSEE distinctes |
|---|---|---|
| `Saint-Denis` | 103 | **4** — 97411 La Réunion (62), 93066 (39), 11339 Aude (1), 30247 Gard (1) |
| `Saint-Paul` | 50 | **9** |
| `Sainte-Marie` | 27 | **9** |
| `La Rochelle` | 32 | **2** — 17300 (31) et 70450, Haute-Saône (1) |

Conséquence chiffrée sur Saint-Denis (93) :

| Indicateur | Affiché aujourd'hui | Valeur juste (93066 seul) | Écart |
|---|---|---|---|
| **Taux de motorisation** | **39,86 %** | **21,03 %** | **+18,8 pts** |
| Taux de suroccupation | 25,20 % | 26,25 % | −1,05 pt |
| Taux de passoires | 20,81 % | 20,47 % | +0,33 pt |

La motorisation de Saint-Denis (93) est affichée **presque doublée**, parce que 62 IRIS de
La Réunion (50,9 %) sont moyennés dedans. C'est un indicateur qui sert directement la priorité
« vivre sans voiture ». Même signature que « feux de foret » au pluriel et `libelle_observation` :
exact localement, **faux par composition**, silencieux, invisible aux tests.

La Rochelle — la commune de démonstration — est touchée aussi, avec un écart faible (un IRIS
parasite sur 32) : le défaut ne se voit pas là où on regarde le plus.

**b) Paris, Lyon et Marseille renvoient `total = 0`.** Leurs IRIS sont rattachés aux arrondissements
(« Marseille 7e Arrondissement »). Les trois plus grandes villes de France n'ont donc **aucune**
donnée IRIS — absence silencieuse, pas erreur.

**c) Troncature** : `size=200` en dur. Aucune des communes testées ne l'atteint, mais rien ne
signale le cas si une requête la dépasse.

**Correction appliquée.** Le dataset ne porte aucun code commune : il n'existe que dans les
5 premiers chiffres du code IRIS. La requête passe donc par un **préfixe de code** (`iris:17300*`),
suivie d'un **filtre d'appartenance** côté application (`iris-scope.ts`, lib pure, 9 tests) — car
l'invariant ne se délègue pas à l'API. Pagination réelle, et toute troncature rend `null` : une
source qui n'a pas pu répondre entièrement n'a pas répondu.

Résultats mesurés après correction :

| Commune | Avant | Après |
|---|---|---|
| Saint-Denis (93) — motorisation | 39,9 % | **21,0 %** |
| Saint-Denis (974) — motorisation | 39,9 % (même valeur !) | **50,9 %** |
| La Rochelle | 32 IRIS dont 1 de Haute-Saône | **31**, justes |
| **Paris** | **aucune donnée** | **940 IRIS**, motorisation 13,0 % |
| **Marseille** | **aucune donnée** | **381 IRIS**, motorisation 51,3 % |
| **Lyon** | **aucune donnée** | **181 IRIS**, motorisation 30,3 % |

Effet de bord notable : les trois plus grandes villes de France passent de zéro donnée IRIS à une
couverture complète.

**Reste à décider** : ces indicateurs sont-ils **résolus au point** (IRIS contenant l'adresse) ou
gardés en agrégat communal ? Voir §4.1bis — la mesure penche fortement pour le point.

Les ranger dans « Autour » en agrégat communal reproduirait le défaut nommé le 13/07 : vendre de
l'adresse et livrer de la commune.

### 4.1bis — Ces indicateurs sont-ils réellement infra-communaux ? Oui, massivement

Mesuré sur les 31 IRIS de La Rochelle (17300), le 28/07/2026 :

| Indicateur | min | max | moyenne (ce qui s'affiche) | écart-type |
|---|---|---|---|---|
| Taux de HLM | **0,3 %** | **85,1 %** | 31,1 % | 27,5 |
| Locataires | 18,0 % | 92,0 % | 60,3 % | 19,5 |
| Propriétaires | 8,0 % | 78,7 % | 38,3 % | 19,4 |
| Passoires thermiques | 8,2 % | 41,3 % | 25,2 % | 8,0 |
| Motorisation | 23,9 % | 67,4 % | 50,1 % | 10,3 |
| Précarité énergétique | 7,9 % | 26,8 % | 16,2 % | 4,8 |
| Transports en commun | 5,3 % | 18,4 % | 10,0 % | 3,2 |
| Suroccupation | 1,2 % | 6,8 % | 3,8 % | 1,8 |

La moyenne communale **écrase** cette variation : un acheteur dans l'IRIS à 8,2 % de passoires et un
autre à 41,3 % lisent aujourd'hui le même chiffre.

⚠️ **NUANCE MAJEURE, relevée le 28/07 après coup — la variance est réelle DANS LES ESTIMATIONS, et je
ne sais pas si elle reflète le terrain ou le modèle.** La fiche du dataset ADEME donne trois sources,
toutes estimées :

| Source | Millésime | Nature | Ce qu'elle alimente |
|---|---|---|---|
| **Enquête Nationale Logement** (INSEE) | 2022 | **enquête par sondage** — ~40 000 logements pour la France, contre 49 059 IRIS | logement social, propriétaires/locataires, déplacements domicile-travail motorisés |
| **GEODIP** (ONPE) | **2017** | cartographie | précarité énergétique |
| Performance énergétique du parc | 2022 | « une **estimation** », dit la fiche | taux de passoires |

Moins d'un ménage enquêté par IRIS en moyenne : les valeurs à l'IRIS sont donc des **estimations
modélisées**, pas des mesures.

Et `taux_motor_glob` **n'est pas** le taux d'équipement automobile : c'est la part des déplacements
domicile-travail en véhicule motorisé — la même grandeur que la préférence `faible_dependance_auto`,
mais estimée, à une autre maille et un autre millésime. Les confondre ferait passer une estimation
pour un raffinement de l'indicateur communal.

**Conséquence pour le module Autour** : ces huit indicateurs peuvent être **affichés avec leur
provenance**. Ils ne doivent **pas fonder un verdict** tant que la méthode d'estimation à l'IRIS n'est
pas qualifiée. Ce n'est plus « le meilleur ratio du document » : c'est un candidat à qualifier.

### 4.2 — Ancre ≠ support : les distances

Ancrées sur l'adresse, elles décrivent l'environnement. `echelles.ts` les enverrait dans
« Logement », ce qui est faux.

| Source | Ancre | Support | Statut |
|---|---|---|---|
| **BPE** (santé, alimentation, éducation, transports, services — cap 3 km) | adresse | environnement | affichée |
| **OSM infrastructures bruyantes** (autoroute, voie rapide, voie ferrée) | adresse | environnement | affichée |
| **OSM espaces verts** | adresse | environnement | affichée |
| **Isochrone / temps de trajet IGN** | adresse | environnement | décide (contraintes dures) |
| **`calmeSonore`** (`sante-facts`, rayon 8 km) | ⚠️ **point de référence de la commune** | environnement | décide |

La dernière ligne est le cas le plus urgent : le bruit est déjà un fait qui *décide*, mesuré depuis
le centroïde communal, et sa phrase le dit (« du point de référence de la commune »). Dès qu'une
adresse existe, cette ancre est la mauvaise.

**✅ RÉSOLU le 28/07/2026.** `EvidenceRef.relation` (`attribut` | `proximite`) porte la distinction,
et `echelles.ts` dérive l'échelle du couple *ancre × relation* : une proximité ancrée sur l'adresse
va dans « quartier », un attribut du bien reste dans « logement ». Aucune exception par règle — une
règle déclare ce qu'elle **mesure**, jamais où elle s'affiche. Défaut sûr : sans `relation`, une
preuve d'adresse ne migre pas toute seule.

⚠️ **Garde-fou gravé** : `relation` ne veut pas dire « la preuve est un rayon ». Une cavité recensée
à 300 m est mesurée en rayon mais atteint le **bien** — elle reste au logement. Les basculer en
« quartier » ferait suivre au fait la FORME de sa preuve au lieu de sa NATURE pour le lecteur, ce
que la doctrine interdit. Le test : le constat parle-t-il de ce qu'on **vivra autour** (trajets,
services, bruit, chaleur) ou de ce qui **atteint le bien** (sol, bâti, parcelle) ?

**Correction de mon diagnostic initial sur `calmeSonore`** : il n'était pas « à l'envers ». La règle
porte déjà `grain: "commune"` et dit sa limitation au lecteur (« mesurée depuis le point de référence
de la commune, pas depuis une adresse »). Elle était honnête ; ce qui manquait, c'est que cette
honnêteté soit **structurelle** plutôt que portée par une phrase écrite à la main. Elle l'est
désormais : une proximité ancrée sur la commune reste du territoire, par construction.

### 4.3 — Radon, SEVESO, ICPE : ils ne « manquaient » pas, ils étaient routés ailleurs

`point-hazards.ts` porte une regex `SANTE_OU_DOUBLON` qui **écarte volontairement** radon,
industriel, matières dangereuses, nucléaire et transport du module Logement, parce qu'ils
relevaient du module Santé. Avec 3 modules, ce filtre n'a plus de destination.

**Le radon n'est nulle part : angle mort complet.** Quatre mentions dans le dépôt, toutes des
exclusions — `sante-facts.ts` affirme qu'il « vit dans Logement », `point-hazards.ts` l'écarte de
Logement, le prompt de `synthesize-logement` dit de ne pas en parler. Chaque module le renvoie à un
autre. Aucune règle, aucun fetch, aucun affichage.

**Mesuré le 28/07/2026** sur 200 communes de l'index : classe 3 (potentiel significatif) **19,5 %**,
classe 2 5,5 %, classe 1 75,0 %. À 19,5 % le signal **discrimine** (repères : feu recensé 43 %,
boisement ≥ 70 % 9,4 %, inondation 86 % = universel, écartée).

**Grain communal, et pas plus fin.** `/radon` exige `code_insee` et refuse `latlon`. Le rapport au
point porte `libelleStatutAdresse` ET `libelleStatutCommune`, mais sur neuf points testés ils sont
toujours égaux : l'API recopie le communal. S'y fier afficherait « à cette adresse » un fait de
commune. Sa place est Commune, sans ambiguïté.

SEVESO et ICPE sont **déjà** servis au grain commune par `sante-facts.ts` : rien à router.

**Décision produit en attente** : une lecture radon coûte une carte au budget « en une minute »
(plafond de 4) et demande un seuil nommé.

### 4.4 — Ce qui décide vs ce qui s'affiche

Sur **35 sources recensées**, le moteur n'en lit qu'une douzaine. Côté Logement, sur 15 familles
fetchées, **5 entrent** dans `LogementDecisionData` (RGA, PPRN, cavités, patrimoine, sinistralité)
plus l'étiquette DPE.

Confort d'été, audit et ses scénarios, `sol_pollue`, ZFE, IREP, altitude : **fetchés, affichés,
jamais décisifs**. Aucune donnée nouvelle n'est nécessaire pour les faire compter.

---

## 5. Ce que le tableau dit du module « Autour »

**Il est presque vide, et pas pour la raison qu'on croyait.** Une seule source native au grain
secteur (l'ICU, 596 communes). Le reste est soit communal déguisé (§4.1), soit ancré-adresse
(§4.2).

« Autour de l'adresse » n'existera donc réellement qu'à **deux conditions** : résoudre l'IRIS du
point, et trancher ancre/support. Ce sont deux corrections, pas deux intégrations — aucune source
nouvelle n'est requise.

Conséquence de couverture : hors des 596 communes ICU, et si l'IRIS reste non résolu, « Autour » se
réduit aux distances. La dégradation en rural doit se lire comme une information, jamais comme un
bloc vide.

---

## 6. L'ordre qui en découle

1. ~~**Corriger la requête IRIS**~~ ✅ **fait le 28/07/2026** (`iris-scope.ts`, préfixe de code +
   filtre d'appartenance + pagination, 9 tests). Débloque au passage Paris, Lyon et Marseille.
2. **Résoudre l'IRIS du point** (point-in-polygon sur les contours du même dataset) — §4.1bis montre
   que l'enjeu est important. Cas à traiter : adresse en limite de deux IRIS, géométrie invalide,
   commune sans IRIS, arrondissements, géocodage approximatif. Règle de repli : adresse + IRIS
   résolu → valeur sectorielle ; pas d'adresse → agrégat communal **présenté comme communal** ;
   adresse sans IRIS exploitable → absence sectorielle explicite, jamais un repli silencieux.
3. ~~**Ancre / support**~~ ✅ **fait le 28/07/2026** (`EvidenceRef.relation`, dérivation dans
   `echelles.ts`, 5 tests + le test de limite retourné). Marqué sur les contraintes dures
   (relief à portée, distance au littoral, position) et la distance au littoral.
4. ~~**Retirer `SANTE_OU_DOUBLON`**~~ ✅ **scindé le 28/07/2026** en `DEJA_MONTRE_AILLEURS` (raison
   valable : doublons gradés dans le même dossier) et `HORS_PERIMETRE_ADRESSE` (renvoyait au module
   Santé, qui n'existe plus). Union identique, comportement inchangé, chaque exclusion relisable.
   SEVESO/ICPE n'avaient rien à router : ils sont **déjà** servis au grain commune par `sante-facts.ts`.
   **Reste ouvert : le radon** (§4.3).
5. **Brancher au moteur ce qui est déjà fetché**, dans l'ordre : confort d'été, `sol_pollue`,
   audit et scénarios, ZFE.
6. **Unifier les deux chemins « à vérifier »** (`logement-checklist.ts` et `logement-rules.ts`)
   — préalable à tout ajout, sinon chaque geste s'écrit en double.

## Réserves de méthode

Ce recensement vient de la **lecture du code**. Une exception : le §4.1 a été **vérifié contre
l'API ADEME** le 28/07/2026 (requêtes réelles, chiffres reproductibles).

Restent à confirmer sur pièces avec `/dev/dossier` : la couverture réelle des champs DPE de confort
d'été, et la part des adresses où l'ICU répond.

---

## 7. Existe-t-il un grain plus fin ? (tri du 28/07/2026)

Méthode née du radon : avant d'intégrer une donnée communale, vérifier si une maille plus fine
existe **et** est diffusée. Trois issues, et la troisième est le vrai gain — elle **clôt** la question
au lieu de la reporter.

⚠️ **Seules les lignes marquées ✅ ont été testées contre les API.** Le reste est un tri
d'orientation, à confirmer avant toute décision.

### Pile A — plus fin existe et semble exposé (candidats à l'intégration)

| Donnée | Aujourd'hui | Maille plus fine pressentie |
|---|---|---|
| **DPE du voisinage** ✅ | rien | **résolu le 28/07** : IRIS du point |
| **Revenu médian** | commune (ADEME) | Filosofi à l'IRIS et au carreau 200 m — à vérifier |
| **Densité de population** | commune | carreaux INSEE 200 m — à vérifier |
| **Taux de boisement** | commune | OCS GE / Corine au point — à vérifier |
| **Qualité de l'air** | moyenne annuelle communale | modélisations AASQA, finesse variable selon région — à vérifier |

### Pile B — plus fin existe en amont, mais n'est pas exploitable

| Donnée | Constat | Vérifié |
|---|---|---|
| **Radon** | `/radon` refuse `latlon`. `libelleStatutAdresse` existe mais **recopie le communal** sur 9 points testés. L'IRSN cartographie par formation géologique ; l'API ne diffuse que la commune. | ✅ 28/07 |
| **Bruit (cartes de bruit stratégiques)** | Donnée **excellente** — polygones Lden/Lnight, publique, exactement la bonne. Diffusion **fragmentée** : une couche WFS **par infrastructure** (86 pour les seules Ardennes), ~100 endpoints `geo-ide` à identifiants opaques, × type × jour/nuit × échéance, et **deux familles d'autorités** (DDT pour les infrastructures de l'État, agglomérations > 100 000 hab. pour leur voirie). **Aucun agrégat national.** → **intégration nationale disproportionnée à ce stade**, pas « impossible » : réévaluer à la 5e échéance, ou sur quelques métropoles bien couvertes. | ✅ 28/07 |
| **Pollen** | zone Atmo, avec repli **départemental** documenté dans le code | lecture |

**Conséquence immédiate, appliquée le 28/07** : `calmeSonore` ne conclut plus à l'adresse. Sa branche
sans constat rendait `satisfied` **sans aucun fait** — donc sans carte, donc sans la limitation que la
branche `verification` affiche, elle. Or `criteria-registry` en tirait `favorable` et faisait monter la
couverture : une bonne nouvelle sur l'adresse du lecteur, tirée d'un centroïde communal, invisible.
Désormais `uncertain` dès qu'une adresse existe (`uncertain` n'est pas EXPLOITABLE : le critère cesse
d'être favorable). Sans adresse, comportement inchangé. 3 tests.

**Conséquence pour le chantier bruit.** Le commentaire de la règle — « la donnée qui le dirait vraiment existe,
elle est publique, et nous ne pouvons pas la lire à sa place » — est confirmé, et on sait maintenant
**pourquoi**. Ce n'est pas un branchement d'API : c'est un chantier de données (collecte de ~100 jeux
départementaux + agglomérations, fusion géométrique, maintenance à chaque échéance quinquennale
décalée). À arbitrer comme tel, jamais à sous-estimer comme « une source de plus ».

### Pile C — communal par nature : question close

Leur objet **est** administratif ; chercher plus fin n'a pas de sens.

GASPAR risques et CatNat (des arrêtés) · ONRN sinistralité (agrégat assurantiel gaté par
représentativité) · VigiEau (arrêtés préfectoraux par zone d'alerte) · littoral (appartenance
administrative) · APL médecins (indicateur construit à la commune).

**Déjà fins, rien à chercher** : PPRN et plans réglementaires, RGA, sismique, périmètres ABF (zonages
géométriques lus au point), cavités et mouvements de terrain (inventaires géolocalisés), BPE et OSM
(au point), ICU (grand-IRIS), DRIAS (maille ~8 km, plus fine que la commune).

---

## 8. Dettes ouvertes par ce chantier (28/07/2026)

À traiter, ou au moins à ne pas découvrir par surprise.

### 8.1 — `data/iris-logement.json` n'est régénéré par aucun automatisme

Le script `scripts/build-iris-logement.mjs` existe et fonctionne, mais **rien ne le lance** : ni le
build, ni un cron, ni le hook pre-commit. L'INSEE publie une nouvelle base infracommunale chaque
année (2022 est sortie en octobre 2025). Sans rappel, l'artefact vieillira en silence — et un
millésime périmé ne se voit pas à l'écran.

Trois options, par coût croissant : une ligne dans le README de reprise · une vérification de
fraîcheur au build qui avertit au-delà de N mois · un cron annuel. **Aucune n'est faite.**

Piège à connaître : l'URL contient l'identifiant de publication (`8647012`), qui change à chaque
millésime. Le script devra donc être édité, pas seulement relancé.

### 8.2 — Le contrat client porte des champs que rien n'affiche

`LogementReport.communeData.irisScope` et `part_deplacements_motorises` voyagent jusqu'au client
depuis le 28/07 sans qu'aucun composant ne les lise. Ce n'est pas un bug, mais un champ transporté
que personne ne consomme finit par être supprimé « parce qu'il ne sert à rien », ou pire, branché
plus tard par quelqu'un qui n'a pas lu ce que `irisScope` protège.

### 8.3 — `LAB_IRIS` est transporté sans sémantique

Volontaire (cf. §7), mais c'est une dette : tant que l'INSEE ne publie pas ses modalités, ce champ
occupe de la place sans rien gouverner. À rouvrir seulement si la documentation apparaît — **pas**
à déduire par corrélation.

### 8.4 — Les indicateurs IRIS de l'ADEME restent affichés tels quels

Sept indicateurs (passoires, précarité, propriété, location, HLM, suroccupation, transports) sont
servis au grain secteur depuis le 28/07 alors qu'ils sont **estimés** (ENL 2022 par sondage,
GEODIP 2017). Seul l'équipement automobile a été basculé vers une source mesurée. Les autres
mériteraient le même examen — en particulier les passoires, qui portent une décision produit.

---

## 9. Registre des sources dormantes (29/07/2026)

**Rien n'est supprimé ici.** Une intégration est du capital : la lib garde le parsing, les pièges
relevés et les contrats de source. Ce qui est retiré, ce sont les APPELS qui ne nourrissent rien —
un appel réseau par dossier, une dépendance qui peut tomber, et surtout l'impression qu'une
dimension est couverte alors qu'elle ne s'affiche nulle part.

La règle : **une source fetchée mais jamais interprétée n'est pas une capacité du produit.**

| Source | État | Ce qui vit encore | Pour la réveiller |
|---|---|---|---|
| **IREP** (rejets industriels déclarés) | appel retiré de la route Logement le 29/07 | `src/lib/irep.ts`, `/api/proxy/irep`, affichage sur `/agir/pollutions-invisibles` | rétablir `getIrepNearPoint(lat, lon)` dans le `Promise.all` de `georisques-logement` + le champ au contrat |
| **Pollen** | aucun appelant | `src/lib/pollen.ts`, avec son repli départemental documenté | demande une priorité explicite (allergies) : saisonnier, très dépendant des sensibilités, souvent départemental |
| **Gissol / RMQS** (métaux lourds) | aperçu de la landing seulement | `src/lib/gissol.ts`, `/api/gissol` | maille large, pas de valeur décisionnelle à l'adresse en l'état |
| **Baignade** | contexte du prompt AskFuture | `src/lib/baignade.ts`, branchée à `commune-enrichment` | communes littorales/lacustres, saisonnier |
| **SIS / BASIAS** | page `/agir/pollutions-invisibles` | `/api/proxy/sis`, `PollutionLookup` | ⚠️ **ne pas ouvrir sans intégration parcellaire** : cf. la doctrine « ne pas crier au loup » — en urbain, tout est à proximité de quelque chose |
| **Coûts de rénovation ADEME** | dormante | `src/lib/renovation.ts`, `/api/renovation/[departement]` | par département, enquête 2017-2018 : ordres de grandeur, jamais un devis |
| **RGE** (artisans qualifiés) | dormante | `src/lib/rge.ts`, `/api/rge` | utile au geste « faire chiffrer », pas au constat |

### Le seul vrai trou côté santé

Le **radon** n'est pas dormant : il n'a jamais été intégré. Mesuré discriminant (19,5 % des communes
en classe 3), source publique sans jeton, grain communal confirmé. Sa table de vérité est écrite —
voir `docs/cadrage-radon.md` — et l'intégration attend une décision produit, pas du code.

Air, bruit et industrie forment déjà un socle cohérent au grain commune. Le radon est la pièce qui
est tombée entre les anciens modules, chacun la croyant chez le voisin.
