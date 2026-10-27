# FUT-146 · 1. Diagnostic des sources officielles : PEB et PGS

> Vérifié le 27/10/2026. Chaque affirmation porte sa source. Ce qui n'a pas pu être lu est dit comme tel.

## En bref

| | Plan d'exposition au bruit (PEB) | Plan de gêne sonore (PGS) |
|---|---|---|
| Rôle | Document d'**urbanisme** : encadre la construction autour d'un aérodrome, à partir de **prévisions** de trafic | Document d'**aide** : délimite les zones où les riverains **peuvent** bénéficier d'une aide à l'insonorisation |
| Mesure-t-il le bruit entendu ? | Non | Non |
| Producteur | DGAC (arrêté préfectoral ou interpréfectoral) | DGAC (arrêté) |
| Diffusion | Géoplateforme IGN, couche `dgac_peb_plan_wmsv` (WMS vecteur) ; arrêtés `dgac_peb_arrete_wfs` (224 aérodromes) | Géoplateforme IGN, couche `dgac_pgs_plan_wmsv` ; arrêtés `dgac_pgs_arrete_wmsv` |
| Aérodromes concernés | 224 aérodromes dotés d'un PEB publié (WFS des arrêtés, `numberMatched` = 224 le 27/10/2026), plus 2 aérodromes dont les zones sont sur la carte mais pas dans la liste des arrêtés (Fumel-Montayral LFDX, Vendays-Montalivet LFIV : voir § 5) | 11 aérodromes (liste du ministère, ci-dessous) |
| Zones | A, B, C, D (D facultative selon l'aérodrome) | I, II, III |
| Licence | Aucune licence déclarée par la DGAC ; la Licence Ouverte Etalab s'applique **par défaut** (CGU Géoplateforme) | Idem |

**Conclusion.** Les deux sources sont utilisables : producteur officiel, géométries vectorielles complètes,
réutilisation commerciale permise sous condition de citer la source et la date. Une réserve demeure sur la
licence (§ 3) ; elle ne bloque pas.

## 1. Ce que dit le droit (textes lus)

### PEB : Code de l'urbanisme, articles L112-10 à L112-15 (Légifrance, versions en vigueur)

- **L112-10** (en vigueur depuis le 01/01/2016, ordonnance n° 2015-1174) : dans les zones du PEB,
  « l'extension de l'urbanisation et la création ou l'extension d'équipements publics sont interdites »
  lorsqu'elles exposent de nouvelles populations au bruit ; les constructions de logements y sont
  interdites sauf exceptions énumérées, qui varient selon la zone (A, B, C, D). En zone D, les
  constructions sont autorisées sous réserve d'isolation. **Conséquence pour futur•e : le texte comporte
  des exceptions dépendant de la zone, de la nature du projet et du secteur. Aucune phrase ne déduit
  automatiquement une constructibilité ou une interdiction.**
- **L112-11** (en vigueur depuis le 01/06/2020, loi n° 2019-1428, art. 94), texte reproduit en entier dans
  la notice DGAC de juin 2020 : pour une **vente ou une location** (loi n° 89-462) d'un logement ou d'un
  terrain constructible situé dans une zone du PEB, un document informant de cette situation est
  communiqué au futur acquéreur ou locataire. Il indique la zone, l'adresse du service en ligne qui
  permet de consulter le PEB, et la possibilité de le consulter en mairie. Il est intégré au dossier de
  diagnostic technique. « L'acquéreur ou le locataire ne peut se prévaloir à l'encontre du vendeur ou du
  bailleur des informations contenues dans ce document qui n'a qu'une valeur indicative. » À défaut,
  l'acquéreur peut demander la résolution du contrat ou une diminution du prix.
- **L112-12** : les constructions autorisées dans les zones de bruit font l'objet de mesures d'isolation.
- **L112-13** : le certificat d'urbanisme signale l'existence de la zone de bruit.
- **L112-14, L112-15** : application anticipée des règles de la zone C pendant l'élaboration ou la révision
  d'un plan. **Conséquence : un PEB en révision peut s'appliquer par anticipation, ce que la couche ne dit
  pas.**

### La notice DGAC « état des nuisances sonores aériennes » (juin 2020)

Source : notice MTES / DGAC, juin 2020, diffusée par les préfectures (copie lue : préfecture de la
Mayenne).

- Le document s'appelle l'**« état des nuisances sonores aériennes »** ; il est établi par le vendeur ou
  le bailleur.
- « Si le bien se situe sur deux zones, il convient de retenir la zone de bruit la plus importante. »
  **C'est la règle que futur•e applique** (A > B > C > D).
- Le PEB est composé d'un plan au 1/25 000 et d'un rapport de présentation, consultables sur les sites
  des préfectures, en mairie et sur le Géoportail.

### Ce que le ministère dit du PEB (ecologie.gouv.fr, « Bruit : organiser l'urbanisation autour des aéroports »)

Le PEB « s'impose au plan local d'urbanisme » ; il est construit sur des hypothèses de trafic à court,
moyen et long termes (horizon de collecte de 25 ans), avec l'indicateur Lden. Zones A et B : bruit fort ;
C : bruit modéré ; D : facultative. **Le PEB décrit une prévision, pas une mesure.**

### PGS et aide à l'insonorisation (ecologie.gouv.fr, page mise à jour le 07/10/2026)

- Le PGS délimite les zones où les riverains **peuvent** bénéficier d'une aide à l'insonorisation (résumé
  de la couche DGAC sur la Géoplateforme : « Les plans de gêne sonore délimitent des zones dans lesquelles
  les riverains peuvent bénéficier d'une aide à l'insonorisation de leur logement »).
- **11 aérodromes** : Bâle-Mulhouse, Beauvais-Tillé, Bordeaux-Mérignac, Lyon-Saint-Exupéry,
  Marseille-Provence, Nantes-Atlantique, Nice-Côte d'Azur, Paris-Charles de Gaulle, Paris-Orly,
  Paris-Le Bourget, Toulouse-Blagnac.
- **Conditions d'éligibilité** (page du ministère) : le bâtiment est situé en tout ou partie dans le PGS ;
  il était construit ou autorisé à la date de publication du PGS ; il n'était pas compris dans le PEB en
  vigueur à la date de l'autorisation de construire ; le logement n'a pas déjà été insonorisé avec l'aide.
- L'aide est instruite et décidée par **l'exploitant de l'aérodrome**, après avis conforme de la
  commission consultative d'aide aux riverains (CCAR). Elle est financée par la taxe sur les nuisances
  sonores aériennes.
- **Conséquence pour futur•e : être en zone PGS ouvre une possibilité, jamais un droit.** La date de
  construction du logement et son historique décident, et futur•e ne les connaît pas.
- Base légale : Code de l'environnement, articles L571-15 et suivants (PGS) et R571-85 et suivants (aide),
  **non relus sur Légifrance** pendant ce ticket (pages inaccessibles) : ils ne sont pas cités à l'écran.

## 2. Les données

| Élément | Constat (27/10/2026) |
|---|---|
| Service | `https://data.geopf.fr/wms-v/ows`, WMS 1.3.0 vecteur, `GetFeatureInfo` en `application/json` |
| Géométrie | Le `GetFeatureInfo` rend des polygones à 5 décimales, **simplifiés** (242 sommets au lieu de 593 pour la zone C d'Orly). Le KML de `GetMap` (mode vecteur intégral) rend le tracé complet à 6 décimales, identique quelle que soit l'emprise : c'est lui qui est extrait |
| Attributs PEB | zone, aérodrome, code OACI, date de l'arrêté (cf. POC FUT-82) |
| Arrêtés | WFS `dgac_peb_arrete_wfs` : point de l'aérodrome, nom, OACI, lien vers l'arrêté PDF (`piece-jointe-carto.developpement-durable.gouv.fr`) |
| Anciennes couches | `DGAC-PGS_BDD_FXX_WM:fxx_pgs_wm` (encore citée par data.gouv.fr) : **retirée** du WFS (exception `InvalidParameterValue`) |
| Jeux data.gouv.fr | « Plan d'Exposition au Bruit (PEB) » et « Plan de Gêne Sonore (PGS) », moissonnés par Ecolab, mis à jour le 11/09/2026 : ils renvoient au service de la Géoplateforme, licence « non spécifiée » |
| Jeux locaux | Des DDT publient des PEB en Licence Ouverte 2.0 (Oise, Loir-et-Cher) ; le PEB de Roissy diffusé par l'Apur est en ODbL : **non retenus**, la couche nationale DGAC est la référence |
| Disponibilité | **Panne observée le 27/10/2026 vers 16 h 30** : réponses en 10 à 12 s, corps `ServiceExceptionReport` (« Connect timed out ») servi en **HTTP 200**. Le catalogue CSW répondait au même moment en HTTP 500. |
| Fréquence d'actualisation | Aucune fréquence déclarée. Un PEB est révisé par arrêté, à intervalles de plusieurs années (Roissy : 2007 ; Orly : 2012, cf. FUT-82) |

## 3. Licence

1. Les métadonnées des couches ne déclarent aucune licence (fiches data.gouv.fr : « License Not
   Specified » ; audit FUT-82 : rien dans les métadonnées CSW lues). Le catalogue CSW était en panne le
   27/10/2026 et n'a pas pu être relu.
2. Les conditions générales de la Géoplateforme (cartes.gouv.fr, version du 15/10/2024) disent :
   « À défaut, la Licence Ouverte / Open Licence – Etalab s'applique sur ce jeu de données. » Le
   fournisseur de données fixe sa licence dans les métadonnées ; à défaut, c'est la Licence Ouverte.
3. Indépendamment, le Code des relations entre le public et l'administration (art. L321-1 et L322-1) rend
   réutilisables, y compris à des fins commerciales, les informations publiques publiées par une
   administration, à condition de ne pas les altérer et de mentionner leur source et la date de leur
   dernière mise à jour.

**Verdict.** Réutilisation commerciale permise, avec mention « DGAC, diffusé par la Géoplateforme IGN »
et la date. **Réserve** : une confirmation écrite de la DGAC (décision D6 de FUT-82) reste souhaitable ;
elle n'est pas un prérequis.

## 4. Sources consultées

- Légifrance, Code de l'urbanisme, art. L112-10 (LEGIARTI000031210273) et section L112-10 à L112-15
  (LEGIARTI000039785320 pour L112-11).
- Notice MTES / DGAC « Information des acquéreurs et des locataires », juin 2020 (copie préfecture de la
  Mayenne).
- ecologie.gouv.fr : « Bruit : organiser l'urbanisation autour des aéroports » (publiée le 14/10/2016) et
  « Aide à l'insonorisation des logements autour des aéroports » (mise à jour le 07/10/2026).
- cartes.gouv.fr, conditions générales d'utilisation, version du 15/10/2024.
- Capacités WMS-V et WFS de la Géoplateforme, lues le 27/10/2026.
- data.gouv.fr, API des jeux `plan-dexposition-au-bruit-peb` et `plan-de-gene-sonore-pgs-1`.

## 5. Fumel et Vendays-Montalivet : des PEB approuvés, à la vigueur actuelle non établie

Vérification complémentaire du porteur (27/10/2026, consignée dans FUT-146 sur Linear, avec les liens) :

| Aérodrome | Document retrouvé | Ce qui est établi |
|---|---|---|
| Fumel-Montayral (LFDX) | PLUi de Fumel Communauté : PEB approuvé le 24 mars 1981 (date concordante avec la couche DGAC et le nom du document `PEB_LFDX_24_03_1981.pdf`) | Un PEB a été approuvé |
| Vendays-Montalivet (LFIV) | Document préfectoral girondin citant un arrêté d'approbation du 28 juillet 1986 (date portée par l'attribut de la couche ; aucun document joint, la date n'est donc pas affichée) | Un PEB a été approuvé |

Leur absence de la liste WFS des 224 arrêtés ne veut donc **pas** dire qu'ils n'ont jamais été approuvés.
Mais les documents sont anciens, et rien n'établit qu'aucun arrêté ultérieur ne les a abrogés ou remplacés.

**Conséquence dans le produit.** Leurs zones sont lues comme les autres (`horsListeArretes` dans la copie,
`vigueurAVerifier` dans la lecture), mais l'écran ne les présente jamais comme opposables sans réserve :
« Ce plan figure sur la carte publiée par la DGAC, mais pas dans sa liste des arrêtés : qu'il soit toujours
en vigueur se vérifie en mairie », et l'obligation de l'état des nuisances sonores aériennes devient
conditionnelle (« Si ce plan est toujours en vigueur, … »). Test : « Fumel et Vendays-Montalivet ».

## 6. Licence : position retenue

Le fondement (CGU de la Géoplateforme : Licence Ouverte par défaut ; Licence Ouverte : réutilisation
commerciale permise avec attribution) est jugé suffisant par le porteur. La confirmation écrite de la DGAC
est un **suivi de traçabilité**, pas un blocage, sous réserve qu'aucune condition particulière contraire ne
soit attachée à ces couches (aucune n'a été trouvée dans les métadonnées lues).

