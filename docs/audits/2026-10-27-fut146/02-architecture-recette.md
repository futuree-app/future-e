# FUT-146 · 2. Architecture retenue et recette

> Branche `bonjourfuturee/fut-146-plans-bruit-aerien`, partie de `main` 4556ca11 (FUT-81 / PR #95 incluse).
> Mis à jour après la revue indépendante du 27/10/2026 (`docs/rapports-agents/revue/2026-10-27-fut146-bruit-aerien.md`,
> NO GO sur 4a9e90a7) : les corrections sont au § 3.

## 1. L'architecture

```
publication DGAC (Géoplateforme, KML vecteur)        WFS des 224 arrêtés PEB
            │                                                 │
            └──────── scripts/build-bruit-aerien.mjs ─────────┘   contrôles : exhaustivité, zones, dates, validité
                                   │
                         data/bruit-aerien.json  (11,8 Mo, versionné, rejouable à l'octet)
                                   │
                  src/lib/server/bruit-aerien-jeu.ts  (lu une fois par instance ; illisible = « indisponible »)
                                   │
                  src/lib/bruit-aerien.ts  (pur : point, parcelle, limites, zone retenue)
                     │                                   │
   /api/georisques-logement (parcelle + géocodage)   autour-response.ts (point seul, relu au rendu)
                     │                                   │
   LogementReport.bruitAerien (figé par version)     AutourResponse.bruitAerien
                     │                                   │
   src/lib/bruit-aerien-texte.ts  (pur : ce que l'écran dit)
                     │                                   │
   RegulatorySection → BruitAerienLogement          AutourModule → BruitAerienAutour
```

### Pourquoi une copie versionnée plutôt qu'un appel par dossier

| | Appel du service à chaque dossier | Copie versionnée (retenue) |
|---|---|---|
| Disponibilité | Panne observée le 27/10/2026 (10 s, exception en HTTP 200) : le dossier perd la lecture | Aucune dépendance réseau ; seule une copie illisible rend « indisponible » |
| Géométrie | `GetFeatureInfo` simplifié (242 sommets au lieu de 593, zone C d'Orly), tolérance de clic non fiable | Tracé intégral du KML, identique quelle que soit l'emprise demandée |
| Tests | Valeurs attendues à figer à la main | Oracle calculé sur le fichier officiel lui-même |
| Latence | 45-120 ms par plan | 0 à 50 ms (calcul local, mesuré 2-47 ms sur la recette) |
| Fraîcheur | Toujours la dernière publication | Datée (`extraitLe`), rejouable : `node scripts/build-bruit-aerien.mjs` ; un PEB change par arrêté, à quelques années d'intervalle |

### Les deux échelles

- **Autour** lit le **point** du dossier, sans parcelle ni précision de géocodage : la phrase parle du
  « secteur ». La lecture est un enrichissement relu au rendu (famille des artefacts versionnés de
  `autour-response.ts`, avec la date d'extraction affichée) : un dossier ancien la reçoit par un vrai
  calcul à son ouverture.
- **Logement** lit la **parcelle** quand elle est rattachée au point et mesurable, et que l'adresse est
  géocodée au numéro ; sinon le point, en le disant. La lecture est figée dans la version du rapport :
  un rapport antérieur n'a pas le champ et **n'affiche rien**.
- Pas de doublon : Autour dit le plan du secteur et la visite à faire ; Logement dit la zone du bien,
  l'état des nuisances sonores aériennes, le certificat d'urbanisme avant un projet, l'aide possible du
  PGS et la sûreté du rattachement. Un test vérifie qu'Autour ne parle ni de parcelle ni de document de
  transaction, et que Logement ne répète pas la visite.

### Les cinq situations demandées

| Situation | État | Ce que l'écran dit |
|---|---|---|
| 1. Adresse ou parcelle rattachée de façon fiable | `en_zone` ou `hors_zone`, grain `parcelle` | La zone (ou « hors des zones », avec la plus proche à moins de 5 km) |
| 2. Proximité immédiate d'une limite | `en_limite` : point à moins de 50 m d'une limite ; parcelle qui ne touche une zone qu'en liseré (moins de 2 % et au moins 25 m²) | « à moins de 50 m de la zone D », « touche la zone B en bordure (40 m²) : à vérifier sur le plan » |
| 3. Géocodage ou parcelle incertains | grain `point`, `portee` `secteur`, `parcelleEcartee` | « géocodée sans numéro », « rattachée par proximité, pourrait être celle d'un voisin », « tracé non mesurable » |
| 4. Données absentes ou indisponibles | `statut: indisponible` ; géométrie officielle non mesurable près du point : `incertain` | « n'ont pas pu être lus », « n'a pas pu être établie » ; jamais « hors zone » |
| 5. Réellement hors du périmètre connu | `hors_zone` (zone à moins de 5 km) ou `absent` (rien) | « hors des zones… ne veut pas dire ne pas entendre d'avions » ; silence au-delà de 5 km |

### Conventions

| Convention | Valeur | Statut |
|---|---|---|
| Zone retenue quand le bien touche deux zones | la plus exposée | Règle de la notice DGAC (juin 2020) |
| Une zone couvre la parcelle | au-delà de 2 % | Reprise de FUT-81 (`PART_MIN`) |
| Liseré dit comme bordure | à partir de 25 m², sous 2 % | Reprise de FUT-81 (`SURFACE_MIN_M2`) |
| Contact sans recouvrement | moins de 0,05 m² | Reprise de FUT-81 (`SURFACE_CONTACT_M2`) |
| Limite proche, au point | 50 m | **Arbitrée par le porteur le 27/10/2026** |
| « Hors zone » affiché | zone à moins de 5 km | **Arbitrée par le porteur le 27/10/2026** |

Elles sont portées par chaque lecture (`convention: "fut146-1"`).

### Non-régressions

- Comparateur, classements, critère `calme_sonore`, autres risques : aucun fichier touché.
- Contrats FUT-81 : `geometrie-parcelle.ts` et `urbanisme-nomenclature.ts` réutilisés sans modification.
- Versionnage : `bruit_aerien` n'entre dans `sourcesAbsentes()` que sur `indisponible` ; une actualisation
  pendant une panne est refusée ; un rapport antérieur ne s'invente ni zone ni panne.
- Synthèse et AskFuture : rien n'est transmis (empreinte de synthèse inchangée, aucun appel au modèle).
- Gardiens mis à jour : la route Logement compte une dépendance chaînée de plus (le bruit aérien attend la
  parcelle, sans réseau) ; le cliquet du Relevé reçoit une exception motivée (le bloc Autour reprend la
  section et la carte de l'écran historique, en attendant FUT-118).

## 2. Recette sur des adresses réelles

Adresses BAN du 27/10/2026 (`src/lib/__fixtures__/fut146/`), choisies en interrogeant la BAN autour de
chaque aérodrome puis en lisant chacune dans le fichier officiel : **aucun zonage présumé**. Tableau
produit par la lib de production.

| Adresse (BAN) | Géocodage · parcelle | Logement : PEB | Logement : PGS | Autour (au point) | Titre Logement |
|---|---|---|---|---|---|
| 13 Quai Choiseul 81000 Albi | numéro · au point → parcelle | hors zone ; D à 1 680 m | aucun plan à 5 km | hors zone ; D à 1 680 m | Hors des zones du plan d'exposition au bruit |
| 13 Rue Bir Hakeim 81000 Albi | numéro · au point → parcelle | zone D | aucun plan à 5 km | zone D | Zone D du plan d'exposition au bruit de l'aérodrome d'Albi |
| 1 Avenue de la Gare 95190 Goussainville | numéro · repli → point | zone B | zone III | zone B | Zone B … de Paris-Charles de Gaulle |
| 12 Rue du Palais 17000 La Rochelle | numéro · repli → point | hors zone ; D à 1 630 m | aucun plan à 5 km | hors zone ; D à 1 630 m | Hors des zones du plan d'exposition au bruit |
| 20 Rue de la Bergerie 17000 La Rochelle | numéro · au point → parcelle | zone C | aucun plan à 5 km | en limite C ; D à moins de 50 m | Zone C … de La Rochelle |
| 45 Rue de la Bergerie 17000 La Rochelle | numéro · au point → parcelle | zone C | aucun plan à 5 km | zone C | Zone C … de La Rochelle |
| 4 Rue Raphael Duca 13700 Marignane | numéro · au point → parcelle | hors zone ; D à 680 m | hors zone ; III à 1 780 m | hors zone ; D à 680 m | Hors des zones du plan d'exposition au bruit |
| 26 Lotissement Clos Saint-Marc 13700 Marignane | numéro · au point → parcelle | zone C | hors zone ; III à 440 m | en limite C ; D à moins de 50 m | Zone C … de Marseille-Provence |
| Rue Henri Guillaumet 13700 Marignane | **rue** · repli → point | zone C (secteur) | hors zone ; III à 70 m | zone C | Zone C … de Marseille-Provence |
| 55 Impasse de la Piste 13700 Marignane | numéro · au point → parcelle | **zone A (+ B)** | zone III | en limite A ; B à moins de 50 m | Zone A … de Marseille-Provence |
| 19 Boulevard Francois Berenguer 13700 Marignane | numéro · au point → parcelle | zone C | **zone III** | zone C | Zone C … de Marseille-Provence |
| 20 Rue Henri Guillaumet 13700 Marignane | numéro · repli → point | zone C | hors zone ; III à 110 m | zone C | Zone C … de Marseille-Provence |
| 1 Place Urbain V 48000 Mende | numéro · repli → point | hors zone ; C à 1 910 m | aucun plan à 5 km | hors zone ; C à 1 910 m | Hors des zones du plan d'exposition au bruit |
| 12 Avenue de la République 94290 Villeneuve-le-Roi | numéro · repli → point | zone B | **zone II** | zone B | Zone B … de Paris-Orly |

**Critère de réussite.** À Marignane, « 20 Rue Henri Guillaumet » est en zone C et « 4 Rue Raphael Duca »
hors des zones (la plus proche, D, à 680 m), pour le même calme sonore communal. À Albi, « 13 Rue Bir
Hakeim » est en zone D et « 13 Quai Choiseul » hors zone. Les deux écrans disent la différence, ce que le
plan permet de conclure, ce qu'il ne prouve pas, et la vérification à faire.

**La Rochelle**, sans présumer : le PEB de l'aéroport (arrêté du 22/11/2010) place la rue de la Bergerie
en zone C ; le centre (rue du Palais) est hors zone, à 1,6 km de la zone D ; aucun PGS.

**Villeneuve-le-Roi** : l'adresse de l'audit FUT-82 est en zone B du PEB d'Orly et en zone II du PGS.

### Cas de frontière et de géométrie (tests, parcelles posées contre un tracé officiel)

| Cas | Résultat |
|---|---|
| Contact exact (la parcelle partage la limite officielle de la zone C de Marseille-Provence) | Zone C jamais dite |
| Microchevauchement (1 cm) | Écart de tracé, zone C jamais dite |
| Liseré de 1 m (plus de 25 m², moins de 2 %) | « en limite », bordure dite avec sa surface |
| Recouvrement de 10 m | Zone C retenue ou dite |
| Point posé exactement sur la limite | « en limite », jamais une zone affirmée seule |
| Point à 30 m d'une limite | « en limite » |
| Parcelle invalide (anneau croisé) | Lecture au point, dite |
| Parcelle par proximité, ou point sur deux parcelles | Lecture au point, voisin possible dit |
| Géocodage à la rue | Secteur, parcelle ignorée, « géocodée sans numéro » |
| Géométrie officielle non mesurable (Villacoublay) | « incertain », jamais « hors zone » |
| Copie illisible ou vide | « indisponible », source muette, actualisation refusée |
| Rapport antérieur | Rien d'affiché |
| Loin de tout aérodrome | Rien d'affiché |

### Rendu vérifié

Banc `/dev/fut146?vue=section|logement|autour&cas=…` (404 en production), capturé par Chrome sans
interface à 1 280 px et 390 px : aucun défilement horizontal ; bloc Autour à 300 px sur mobile ; section
Logement à 814 px sur bureau dans le conteneur de page.

## 3. Corrections après la revue indépendante

| Constat | Correction | Test |
|---|---|---|
| B1. En production, le client envoie `type: null` : la parcelle n'était jamais lue | La précision se lit dans l'identifiant BAN du dossier (`commune_voie_numéro` = numéro), que le paiement n'accepte qu'au numéro | « revue B1 » : chemin de la route, grain parcelle |
| B2. Deux zones superposées : « la parcelle touche aussi » au point, aérodrome non nommé | La règle « la plus exposée » vaut dans un seul plan. Les autres aérodromes sont dits (`autresAerodromes`) : « les plans de chaque aérodrome s'appliquent » ; au point, deux zones d'un même plan sont une limite | « revue B2 » : trois points CDG/Le Bourget, Bastia |
| B3. Halo « incertain » de 5 km autour des géométries non mesurables | Doublons écartés à l'extraction (Villacoublay lisible) ; une géométrie non mesurable ne rend incertain qu'à moins de 50 m de son tracé ou dans son emprise | « revue B3 » : Dijon gare et place de la Libération, Versailles |
| I1. Parts doublées (zones publiées en double) | 11 doublons écartés (même aérodrome, zone, emprise, sommets) ; l'extraction refuse deux zones d'une même lettre qui se recouvrent | « revue I1 » |
| I2. PGS hors du PEB dit « aussi » ; PGS seul passé sous silence | « en revanche » hors PEB ; bloc propre au PGS quand aucun PEB n'est à 5 km | « revue I2 » : Orly |
| I3. « la zones A et C » | Accord « la zone / les zones », « passe / passent » | « revue I3 » : Albertville et toute la recette |
| I4. Copie tronquée possible | Liste des 11 aérodromes du PGS vérifiée, placemarks comptés, aucun aérodrome retiré sans `--accepter-retraits`, écriture atomique | (script) |
| M1 | Préfiltre à 110 000 m par degré | |
| M2 | Au grain parcelle, la zone la plus proche se mesure depuis la parcelle ; « touche la limite de la parcelle » | |
| M3 | Une actualisation qui ferait passer la lecture de la parcelle au point est refusée (même règle que FUT-81) | « revue M3 » |
| M4 | Une copie mal formée n'est pas mémorisée : la lecture suivante retente | |
| M5 | Assertion du cas « à 80 m » rendue complète | |
| M6, M7 | Documentation corrigée ; « le certificat d'urbanisme signale la zone de bruit » (L112-13), sans « et ses règles » | |

## 4. Réserves

1. **Licence** : aucune déclarée par la DGAC ; la Licence Ouverte s'applique par défaut selon les CGU de
   la Géoplateforme. Fondement jugé suffisant ; la confirmation écrite de la DGAC est un suivi de
   traçabilité, pas un blocage (01-sources § 6).
2. **Actualité** : la copie est datée ; une révision publiée après l'extraction n'est vue qu'à la
   réextraction. Certains plans sont anciens (Nantes 2004, en révision), et un plan en révision peut
   s'appliquer par anticipation : l'écran renvoie à la mairie.
3. **14 dates d'arrêté** sont discordantes dans la donnée publiée (attribut contre nom du document, ex.
   Gap) : elles ne sont pas affichées, l'écran renvoie à l'arrêté.
4. **Une géométrie officielle non mesurable** (Dijon zone A ; celles de Villacoublay étaient des doublons
   écartés) : lecture « incertaine » à moins de 50 m de son tracé ou dans son emprise.
5. **Noms d’aérodromes** : 30 noms abrégés par la DGAC sont développés à la main (table `NOMS`) ; les
   autres sont repris tels que publiés, sans accents restitués (« Nimes Garons »).
6. **Base légale du PGS** (Code de l'environnement) non relue sur Légifrance : l'écran ne cite aucun
   article pour le PGS, seulement la page du ministère dans la documentation.
7. **Banc** : le module Logement complet déborde en largeur dans les bancs (`/dev/fut81` sur `main`
   compris), à cause du passeport du territoire ; défaut antérieur, hors périmètre. Le rendu du nouveau
   bloc a été vérifié dans la section seule.
8. **Design** : le bloc Autour reprend la grammaire historique de l'écran qui l'accueille (exception
   déclarée au cliquet du Relevé) ; il migrera avec AutourModule (FUT-118).
9. **Fumel et Vendays-Montalivet** : absents de la liste des arrêtés de la DGAC, mais leurs PEB ont bien été
   approuvés (1981 et 1986, documents retrouvés par le porteur, cf. 01-sources § 5). Leur vigueur actuelle
   n'est pas établie : l'écran le dit (« qu'il soit toujours en vigueur se vérifie en mairie ») et rend
   conditionnelle l'obligation de l'état des nuisances sonores aériennes.
