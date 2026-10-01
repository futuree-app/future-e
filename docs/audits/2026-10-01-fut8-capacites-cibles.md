# FUT-8, phase 0 : ce que futur•e peut réellement trancher

1er octobre 2026. **Audit seulement.** Aucun code, aucun changement de parseur, de schéma ou de
données, aucune modification de Linear. Base : `main` à `2f4d8388` (FUT-7 mergé).

Doctrine tenue tout au long : maximiser le nombre de questions auxquelles futur•e peut répondre
**honnêtement** oui ou non. Un signal utile qui ne répond pas exactement à la question reste
`apprecier`. Une convention acceptée ne corrige jamais une mauvaise échelle de mesure.

---

## 1. Résumé exécutif

**Aujourd'hui (FUT-7)**, sur 55 variantes de critères (27 géographiques, 28 préférences) : 4 tranchent
(département, région administrative, exclusion d'une région, temps de trajet avec mode à l'adresse),
47 s'apprécient, 4 ne se mesurent pas.

**Le gisement de FUT-8 est réel, et il est surtout sémantique.** Dix-sept variantes de critères
peuvent devenir tranchables **sans aucune nouvelle donnée**, simplement parce que le Projet
conserverait (ou ferait préciser) une métrique, une unité, un périmètre, un mode ou un seuil que
le lecteur sait dire. Cinq autres le peuvent avec une **convention acceptée** par le lecteur, sur des
données que nous avons déjà.

**Trois constats changent le périmètre :**

1. **La mer ne peut pas être tranchée avec nos données.** `distance_cote_km` n'est pas une distance
   au trait de côte : c'est le minimum, à vol d'oiseau, vers une **liste de villes côtières**, depuis le
   centroïde de la commune (`scripts/build-comparateur-index.mjs:420`, « V1, à remplacer par le trait
   de côte IGN »). Aucune convention ne rattrape cela. Il faut une nouvelle donnée (trait de côte) et
   une mesure à l'adresse : hors FUT-8.
2. **La montagne non plus.** 600 m est l'altitude du **chef-lieu** (point de référence), via une note
   interne. « Vivre à la montagne » se tranche proprement avec une donnée qui existe ailleurs (le
   classement officiel en **zone de montagne**, ou l'altitude de l'adresse). Hors FUT-8.
3. **La plupart des promotions vers `trancher` exigent une adresse.** Une distance, un temps de
   trajet, une présence d'équipement ne valent que depuis le logement. Sur un dossier **communal**
   (sans adresse), ces critères restent `apprecier` même après FUT-8. C'est juste, et il faut le dire
   au lecteur au moment où il confirme.

**Recommandation de périmètre** : FUT-8 = 9 familles rendues tranchables par la sémantique
(distances et temps vers un lieu, tailles avec unité, quitter une ville avec périmètre, région
parisienne, macro-zones avec périmètre accepté, conventions de taille unifiées), la séparation
Recherche / Projet et les ancres, la migration A. Les promotions de préférences fondées sur des
faits officiels (risque feu recensé, PPRN à l'adresse, équipements BPE à 500 m, population en
hausse) sont prêtes mais forment un second lot ; je propose de les sortir si FUT-8 grossit.

---

## 2. Architecture actuelle pertinente

### Le chemin d'un critère

```
texte ─► /api/comparateur-vie/parse (LLM, schéma d'outil + consigne)
      ─► dérivation des ancres (déterministe, même route)
      ─► ParsedProject { hardConstraints, preferences, communeAncre, … }
      ─► UserProject.parsed (persisté tel quel)          ◄── OuVivreProjectSync (Recherche → Projet)
      ─► projetDeLecture (FUT-7 : neutralise les dérivés d'ancre reconnaissables)
      ─► hydrateHardConstraints (partagé avec la Recherche)
      ─► évaluation canonique (hard-constraints.ts) / règles de préférence (decision/*)
      ─► criterionCapability (FUT-7) + isConfirmed
      ─► hard-constraint-rules / condition-rules ─► dossier
```

### Ce que le Projet perd aujourd'hui

| Information | Où elle se perd | Conséquence |
|---|---|---|
| Unité d'une taille (commune / agglomération) | `communeSize: {min,max}` sans unité | L'évaluateur lit toujours l'agglomération (`tailleVille`) |
| Provenance d'un seuil de taille | « petite ville » → `{5000, 25000}` par la consigne (`parse/route.ts:107`) | Une borne inventée est indiscernable d'un chiffre dit |
| Métrique d'une distance | `nearPlace.maxKm` | « 20 km » : vol d'oiseau ? route ? |
| Mode d'un temps | `nearPlace.mode` nullable | Le parseur pose déjà une ambiguïté, mais personne n'y répond durablement |
| Périmètre de « quitter X » | `excludePlace: [{label}]` | Toujours l'unité urbaine entière |
| Nature d'une exclusion | `excludeZones: ["idf"]` | « Région parisienne » et « Île-de-France » se confondent |
| Force réelle d'une mention | `strength: "hard"` (mention nue = hard) | Sert la Recherche, ne dit rien d'une condition |
| Origine d'un critère | dérivés d'ancre écrits dans `hardConstraints` | « comme Brest » → `excludePlace: Brest` + fourchette |

---

## 3. Matrice exhaustive des critères

Légende des grains : **C** = point de référence de la commune (centroïde de l'index) ; **A** = adresse
géocodée ; **UU** = unité urbaine INSEE 2020 ; **D** = département ; **R** = rayon autour d'un point.
Capacités : T = trancher, Ap = apprecier, N = ne_pas_mesurer. Classes : voir §4.

### 3.A Les familles de `HardConstraints` (et leurs variantes réelles)

| # | Clé / variante | Libellé lecteur | Formulations | Parseur conserve | Parseur perd | Mesure utilisée | Grain | Seuil / règle | Origine du seuil | FUT-7 | Pourquoi | Cible FUT-8 | Ce qui manque | Nouvelle donnée ? | Convention ? | Risque de faux verdict | Recommandation | Classe |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| G1 | `departements` | « le département 35 » | « dans le 35 », « en Ille-et-Vilaine » | codes INSEE | rien | `dept` de l'index | D (exact) | appartenance | utilisateur | T | appartenance administrative exacte | T | rien | non | sans objet | nul | garder | A |
| G2 | `zones` région administrative | « la Bretagne » | « en Bretagne », « absolument en Normandie » | jeton + `strength` | la nuance région administrative / historique (Nantes) | table jeton → départements | D | appartenance | table produit (région exacte) | T | frontière administrative nommée | T | afficher « la région administrative Bretagne » au moment de confirmer | non | sans objet | faible (Bretagne historique) | garder, rendre le libellé explicite | A |
| G3 | `excludeZones` région (`ile_de_france` et autres) | « éviter le Grand Est » | « pas dans le Nord-Est » (→ macro), « pas en Occitanie » | jetons | idem | idem | D | non-appartenance | table produit | T | idem | T | idem | non | sans objet | faible | garder | A |
| G4 | `zones` macro-zone (`sud`, `sud_ouest`, `sud_est`, `nord`, `est`, `grand_ouest`, `centre`) | « le Sud-Ouest » | « dans le Sud », « le Grand Ouest » | jeton | le périmètre que le lecteur avait en tête | liste de départements | D | appartenance | **convention produit** (`geo-zones.ts:34-79`) | Ap | frontière inventée | T si le lecteur accepte la liste affichée | montrer la liste exacte des départements, faire accepter, épingler l'empreinte de la définition | non | **oui** | moyen : la liste ne colle jamais exactement au mot | proposer la définition, versionnée | C |
| G5 | `zones` façade (`atlantique`, `manche`, `mediterranee`, `cote_basque`) | « la façade atlantique » | « sur la côte atlantique », « au bord de la Méditerranée » | jeton | l'idée de **côte** | départements côtiers | D | appartenance | convention produit | Ap | un département côtier n'est pas la côte | Ap (au mieux C restreint) | la vraie question est la proximité de la mer : trait de côte | **oui** pour la vraie question | seulement « un département de la façade » | **élevé** : Bordeaux est « sur la côte atlantique » | ne pas proposer de verdict ; garder apprécier | D |
| G6 | `zones` massif (`alpes`, `pyrenees`, `massif_central`, `vosges`, `jura`, `corse`) | « les Pyrénées » | « dans les Alpes », « près des Pyrénées » | jeton | dedans / près de | départements du massif | D | appartenance | convention produit | Ap | un département n'est pas un massif (Bayonne, Toulouse…) | Ap | un périmètre de massif (loi Montagne, MNT) | **oui** | non, la liste est trop grossière | élevé | garder apprécier | D |
| G7 | `excludeZones` `paris` | « Paris et sa proche banlieue » | « quitter Paris », « pas Paris » | jeton | Paris seul / petite couronne / agglomération | 75, 92, 93, 94 | D | non-appartenance | convention produit | Ap | lecture vernaculaire | T | faire choisir le périmètre (Paris, petite couronne, agglomération parisienne, Île-de-France) | non (UU Paris disponible) | oui | moyen | proposer quatre périmètres nommés | B |
| G8 | `excludeZones` `idf` | « l'Île-de-France » | « quitter la région parisienne », « loin de la région parisienne » | jeton | administratif ou vernaculaire | 8 départements | D | non-appartenance | convention produit | Ap (FUT-7 bis) | « région parisienne » est vernaculaire | T | idem G7 | non | oui | moyen | idem | B |
| G9 | `montagne` | « l'exigence de montagne » | « à la montagne », « en altitude », « un village de montagne » | `strength` | tout seuil | altitude du chef-lieu → montagnosité ≥ 50 | C | ≈ 600 m | **convention code** (`hard-constraints.ts:108`, ancres 300/600/1000/1400) | Ap | convention au chef-lieu | T avec nouvelle donnée | zone de montagne officielle, ou altitude de l'adresse | **oui** | à rechercher (zonage officiel) | élevé : Chamonix et Nice-ville jugés au chef-lieu | sortir de FUT-8 | D (nouvelle donnée) |
| G10 | `reliefProche` | « la proximité du relief » | « proche d'une montagne », « pour randonner » | `strength` | tout | max des altitudes de **chefs-lieux** à 35 km → note ≥ 50 | C + R 35 km | ≈ 1 250 m | convention code (`hard-constraints.ts:47`) | Ap | proxy (pas de sommets) | Ap | MNT et définition du « à portée » | **oui** | non | élevé | garder apprécier | D |
| G11 | `nearSea` avec km | « la proximité de la mer (moins de 10 km) » | « à moins de 10 km de la mer » | `maxKm` | métrique | `distance_cote_km` = min haversine vers **villes côtières** | C | `<= maxKm` | utilisateur (le chiffre) | Ap | mesure fausse pour la question | T avec nouvelle donnée | trait de côte + mesure depuis l'adresse | **oui** | non | **élevé** | hors FUT-8 | D (nouvelle donnée) |
| G12 | `nearSea` sans km | « la proximité de la mer » | « au bord de la mer », « il nous faut la mer » | `active` | seuil | idem | C | aucune (non examinée) ; FUT-7 apprécie à 15 / 100 km | s.o. | Ap | sans seuil | Ap, puis T avec nouvelle donnée + seuil choisi | idem + seuil | oui | oui (après nouvelle donnée) | élevé | hors FUT-8 | D |
| G13 | `excludeSea` | « l'éloignement de la mer » | « pas le littoral », « loin de la côte » | booléen | seuil | idem | C | ≥ 15 km | convention code (`hard-constraints.ts:40`) | Ap | convention + mauvaise mesure | idem G11 | idem | oui | oui (après) | élevé | hors FUT-8 | D |
| G14 | `nearPlace` km, à l'adresse | « la proximité de Nantes » | « à moins de 20 km de Nantes » | `maxKm` | **métrique** | haversine adresse → lieu résolu | A | `<= maxKm` | utilisateur | Ap | vol d'oiseau non dit | **T** si métrique = vol d'oiseau | demander / conserver « à vol d'oiseau » | non | non | faible une fois la métrique dite | promouvoir | B |
| G15 | `nearPlace` km, par la route | idem | « à moins de 20 km par la route » | idem | idem | aucune (non calculée) | A | s.o. | utilisateur | Ap | aucune mesure routière en km | T avec extension | distance d'itinéraire (le routage IGN la donne avec le temps) | moteur à étendre | non | faible | sortir ou faire en fin de FUT-8 | B (extension) |
| G16 | `nearPlace` temps + mode, adresse | « 30 minutes en voiture depuis la gare » | « à 30 min de Nantes en voiture » | `maxMinutes`, `mode` | rien | itinéraire IGN / isochrone (tolérance 300 m) | A | `<= maxMinutes` | utilisateur | **T** | exact | T | rien | non | non | faible (pas de trafic ; dit) | garder | A |
| G17 | `nearPlace` temps sans mode | idem | « à 30 minutes de Nantes » | `maxMinutes` | **mode** | s.o. | A | s.o. | utilisateur | N | paramètre manquant | **T** | demander le mode (la consigne pose déjà la question) | non | non | faible | promouvoir | B |
| G18 | `nearPlace` sans seuil | « la proximité de Nantes » | « près de Nantes » | `label` | seuil + métrique | haversine (FUT-7 l'affiche) | A / C | aucun | s.o. | Ap | sans seuil | **T** | demander seuil + métrique | non | non (pas de rayon par défaut) | faible | promouvoir | B |
| G19 | `nearPlace` tout seuil, grain commune | idem | idem | idem | s.o. | haversine / itinéraire depuis le centroïde | C | idem | utilisateur | Ap | grain | Ap | une adresse | s.o. | **non** (le grain ne se convient pas) | élevé si on tranchait | garder apprécier sans adresse | D |
| G20 | `nearPlace` vélo | idem | « à 20 min à vélo » | `mode: bike` | s.o. | aucune (IGN rend 400) | s.o. | s.o. | utilisateur | N | moteur | T avec nouveau moteur | routage vélo | **oui** (moteur) | non | s.o. | hors FUT-8 | D |
| G21 | `communeSize` unité commune | « une commune de moins de 20 000 habitants » | « commune de moins de 20 000 hab. » | `{min,max}` | **unité** | `tailleVille` (UU) | UU | bornes | utilisateur, ou consigne | Ap | unité / provenance | **T** | `unit: "commune"` + `source: "user"` ; évaluer `population` | non (population communale dans l'index) | non | faible | promouvoir | B |
| G22 | `communeSize` unité agglomération | « une agglomération de moins de 100 000 habitants » | idem | idem | unité | `tailleVille` | UU | bornes | utilisateur | Ap | idem | **T** | `unit: "unite_urbaine"` | non | non | faible (hors UU : population communale, cohérent avec l'INSEE) | promouvoir | B |
| G23 | `communeSize` « petite / moyenne / grande ville » | « une commune entre 5 000 et 25 000 habitants » | « une petite ville », « ville moyenne » | bornes **inventées** | le mot, la provenance | `tailleVille` | UU | 5 000-25 000 / 25 000-100 000 / ≥ 100 000 | **consigne du parseur** | Ap | seuil inventé, et contredit `agglomeration-size-v1` | T si définition acceptée | une **seule** convention versionnée + unité, montrée et acceptée | non | **oui** | moyen | unifier les deux conventions, proposer | C |
| G24 | `sizeRelativeTo` | « une commune plus petite que Brest » | « plus petit que Brest », « pas plus grand que Lyon » | `label`, `direction` | unité | UU vs UU de référence | UU | `<` / `>` strict | utilisateur | Ap | unité | **T** | `unit` (commune / agglomération) | non | non | faible | promouvoir | B |
| G25 | `excludePlace` commune seule | « le fait de quitter Lyon » | « quitter la commune de Lyon » | `label` | **périmètre** | UU de la ville (PLM : UU parente) | UU | appartenance | utilisateur | Ap | toujours l'agglomération | **T** | `scope: "commune"` ; comparer l'INSEE (PLM : liste des arrondissements à prévoir) | non | non | faible | promouvoir | B |
| G26 | `excludePlace` unité urbaine | idem | « quitter l'agglomération lyonnaise » | idem | idem | UU | UU | appartenance | utilisateur | Ap | idem | **T** | `scope: "unite_urbaine"` | non | non | faible | promouvoir | B |
| G27 | `excludePlace` métropole (EPCI) | idem | « quitter la métropole de Lyon » | idem | idem | UU (≠ EPCI) | UU | s.o. | utilisateur | Ap | aucune donnée EPCI | T avec nouvelle donnée | appartenance EPCI | **oui** | non | élevé si on assimilait EPCI = UU | hors FUT-8, refuser l'assimilation | D |
| G28 | dérivés d'ancre (`excludePlace` de l'ancre, fourchette ×/÷ 2,5) | (aucun) | « une ville comme Brest » | écrits dans `hardConstraints` | leur origine | s.o. | s.o. | s.o. | code | (neutralisés par FUT-7 quand reconnus) | pas un critère du lecteur | sans objet | les sortir du Projet | non | s.o. | élevé tant qu'ils restent | migrer vers la Recherche | sans objet |

### 3.B Les 28 `PreferenceKey`

« Question précise » = la question que futur•e pourrait **proposer** au lecteur, et à laquelle une
donnée existante répond exactement. Si aucune n'existe, la préférence reste appréciable, ce qui
n'est pas un échec.

| # | Clé | Libellé | Mesure réelle | Grain | Règle / seuil (origine) | FUT-7 | Question précise possible | Donnée ? | Grain suffisant pour le logement ? | Cible | Classe |
|---|---|---|---|---|---|---|---|---|---|---|---|
| P1 | `faible_chaleur` | des étés supportables | DRIAS : jours > 35 °C, nuits tropicales, 2050 | maille ~8 km → C | 8 j / 25 nuits (déclaré), 10 / 39 (ambiant) ; convention code | Ap | « commune projetée sous N jours > 35 °C en 2050 (TRACC) » | oui | non (le confort du logement n'est pas mesuré) | Ap (ou C à arbitrer, sur la projection seulement) | C* |
| P2 | `douceur_climat` | des hivers doux | rang de température d'hiver 1976-2005 | C | 20 % extrêmes (`EXTREME_SHARE`) | Ap | « hiver moyen ≥ N °C » | oui | non | Ap (C* possible) | C* |
| P3 | `ensoleillement_recherche` | plus de soleil | rang ERA5-Land | C | 20 % extrêmes | Ap | aucune intelligible (J/m²) | s.o. | s.o. | Ap | D |
| P4 | `faible_secheresse` | sols moins secs | aucune règle | s.o. | s.o. | N | « moins de N jours de sols secs projetés » | oui (Territoire) | non | Ap au mieux (règle à créer) | D |
| P5 | `faible_risque_feu` | faible risque d'incendie | IFM projeté + **risque feu recensé par l'État** (Géorisques) | C | 9 j IFM ; recensement | Ap | « aucun risque feu de forêt recensé par l'État sur la commune » | **oui** | commune (c'est l'échelle du recensement) | **T** (question administrative) | B |
| P6 | `faible_precip_extremes` | moins de pluies intenses | DRIAS pluie max 24 h | C | 65 mm | Ap | « cumul max projeté sous N mm » | oui | non | Ap (C*) | C* |
| P7 | `faible_risque_inondation` | faible risque d'inondation | score CatNat (≥ 66), TRI, **PPRN à la parcelle** (Logement) | C ; **A** pour le PPRN | ≥ 66 (code) | Ap | « l'adresse n'est pas dans une zone réglementée d'un PPR inondation » ; « la commune n'est pas en TRI » | **oui** (PPRN : tous risques confondus, le type est à extraire du libellé) | **oui** pour le PPRN à l'adresse | **T** à l'adresse | B |
| P8 | `proximite_mer` | la proximité de la mer | voir G11 | C | 15 / 100 km (`coast-proximity-v1`) | Ap | « à moins de N km du trait de côte depuis l'adresse » | **non** | s.o. | Ap | D (nouvelle donnée) |
| P9 | `cadre_calme` | un cadre calme | rang de densité | C | 20 % | Ap | aucune (la densité n'est pas le calme) | s.o. | s.o. | Ap | D |
| P10 | `eviter_isolement` | ne pas être isolé | catégorie de taille UU | UU | `agglomeration-size-v1` | Ap | « agglomération d'au moins N habitants » (c'est G22) | oui | oui | se reformule en G22 | C |
| P11 | `viabilite_emploi` | un bassin d'emploi solide | taille + diversité ZE | zone d'emploi | rang | Ap | aucune exacte | s.o. | s.o. | Ap | D |
| P12 | `air_sain` | un air plus pur | PM2,5 / NO₂ modélisés, moyennes annuelles | C | OMS 2021 NO₂ 10 ; UE 2030 PM2,5 10 (seuils **officiels**) | Ap | « moyenne communale sous la valeur limite UE 2030 » | oui | **non** (le NO₂ varie à la rue) | Ap pour le logement | D |
| P13 | `acces_soins` | un bon accès aux soins | APL (rang) + BPE à 500 m de l'adresse | C ; **A** (BPE) | 20 % ; 500 m (code) | Ap | « un médecin généraliste / une pharmacie recensés à moins de 500 m à pied de l'adresse » ; la **disponibilité** d'un médecin : N | **oui** (BPE, présence) | oui, pour la présence | **T** pour la présence ; N pour la disponibilité | B |
| P14 | `acces_services` | commerces et services | centralité ANCT + BPE alimentation / services à 500 m | C ; A | classes ANCT ; 500 m | Ap | « un commerce alimentaire à moins de 500 m de l'adresse » | **oui** | oui | **T** (présence) | B |
| P15 | `faible_pression_agricole` | peu d'agriculture intensive | aucune règle (décision ADR-0010) | s.o. | s.o. | N | s.o. | s.o. | s.o. | N | D |
| P16 | `nature` | la nature autour | rang OSO à 15 km | R 15 km | 20 % | Ap | « au moins N % de couvert naturel dans 15 km » | oui | non (pas à l'adresse) | Ap | D |
| P17 | `acces_ecoles` | des collèges et lycées accessibles | rang BPE pondéré + BPE éducation à 500 m | C ; A | rayon adaptatif ; 500 m | Ap | « une école recensée à moins de 500 m de l'adresse » ; qualité : N | **oui** | oui | **T** (présence) | B |
| P18 | `acces_culture` | une offre culturelle | rang BPE | C | 20 % | Ap | aucune exacte | s.o. | s.o. | Ap | D |
| P19 | `faible_dependance_auto` | se passer de la voiture | part voiture MOBPRO ; équipement auto IRIS | C ; IRIS | rang ; écart IRIS | Ap | aucune exacte (comportement) | s.o. | s.o. | Ap | D |
| P20 | `acces_transports` | l'accès au train | rang de desserte, gare la plus proche (km, depuis C) ; BPE transports dans le périmètre de l'adresse | C ; A | rang ; périmètre | Ap | « une gare de voyageurs recensée dans un rayon de N depuis l'adresse » | **oui** (périmètre borné, à vérifier) | oui | **T** (présence dans le rayon cherché) | B |
| P21 | `mobilite_quotidienne` | les transports du quotidien | arrêts OSM à 1 000 m du point de référence | C | plancher + rang | Ap | « un arrêt de bus / tram à moins de N m de l'adresse » | **non** à l'adresse (à vérifier dans BPE) | s.o. | Ap | D (nouvelle donnée) |
| P22 | `eviter_grandes_villes` | une ville à taille humaine | catégorie UU | UU | `agglomeration-size-v1` | Ap | se reformule en G22 / G23 | oui | oui | via G22 / G23 | C |
| P23 | `prefere_grande_ville` | une grande ville | idem | UU | idem | Ap | idem | oui | oui | via G22 / G23 | C |
| P24 | `vie_etudiante` | une ville étudiante | accès C5xx + part étudiante UU | UU | garde-fou 5 000 | Ap | « un établissement d'enseignement supérieur dans la commune » | oui (BPE) | s.o. | Ap (la présence ne fait pas une ville étudiante) | D |
| P25 | `vie_locale` | une ville vivante | lieux OSM + associations | C | rang | Ap | aucune | s.o. | s.o. | Ap | D |
| P26 | `croissance_demographique` | un territoire qui se développe | évolution INSEE 2015-2021 | C | rang signé | Ap | « la population a augmenté entre 2015 et 2021 » | **oui** | commune (bonne échelle) | **T** (fait INSEE) | B |
| P27 | `calme_sonore` | loin du bruit des infrastructures | infra bruyantes autour du point de référence | C | 1 km route, 0,5 km rail, 5 km aéroport | Ap | « aucune autoroute à moins de N m de l'adresse » | **non** à l'adresse (cartes de bruit) | s.o. | Ap | D (nouvelle donnée) |
| P28 | `faible_exposition_industrielle` | loin des sites industriels | ICPE en activité, score hybride 8 km | C | score ≥ 50 | Ap | « aucun Seveso seuil haut à moins de N km de l'adresse » | **non** à l'adresse (ICPE au point non lues) | s.o. | Ap | D (nouvelle donnée) |

### 3.C Cas particuliers

| Élément | Nature | Traitement FUT-8 |
|---|---|---|
| `communeAncre` | point de départ du lecteur | reste dans le Projet |
| préférences dérivées d'une ancre (`deriveAnchorPreferences`) | hypothèses d'inspiration, poids 3 pour le trait dominant, 2 pour les suivants, 4 au plus, percentile ≥ 70 | rester dans le Projet, **marquées dérivées** (provenance), retirables |
| `excludePlace` de l'ancre, fourchette ×/÷ 2,5 | réglages de Recherche | sortir du Projet (§8) |
| `suppressNarrativeKeys` | retraits explicites du lecteur | garder |
| `horsMesure` (qualité des écoles, vitalité culturelle, affectif) | non mesurable | N, dit comme tel ; jamais une condition |
| `ambiguities` | questions du parseur (mode d'un temps) | **devenir des demandes de précision** au moment de confirmer |
| `emploiHorsSujet`, `heritageIntent` | paramètres | hors conditions |
| `strength: preferred / inspiration` | bonus de Recherche | jamais une condition |

---

## 4. Classification

**Classe A, déjà tranchable (4)** : G1 département ; G2 région administrative ; G3 exclusion d'une
région ; G16 temps de trajet avec mode, à l'adresse.

**Classe B, tranchable avec une meilleure sémantique, sans nouvelle donnée (17)** :
- géographie et distances : G7 « Paris et petite couronne » (périmètre choisi) ; G8 « région
  parisienne » (périmètre choisi) ; G14 km à vol d'oiseau (adresse) ; G17 temps sans mode (adresse) ;
  G18 « près de » sans seuil (adresse) ;
- tailles et villes : G21 taille de commune ; G22 taille d'agglomération ; G24 taille relative avec
  unité ; G25 quitter la commune ; G26 quitter l'agglomération ;
- préférences reformulées en faits : P5 risque feu recensé ; P7 PPRN à l'adresse ; P13 santé à
  500 m (présence) ; P14 alimentation à 500 m ; P17 école à 500 m ; P20 gare dans le périmètre ;
  P26 population en hausse.

  (Soit 10 variantes géographiques et de taille, et 7 préférences ; P13, P14 et P17 partagent la même
  mécanique BPE. G15, la distance par la route, demande seulement d'étendre l'appel de routage
  existant : je la compte à part.)

**Classe C, tranchable seulement avec une convention acceptée (5, plus 3 à arbitrer)** : G4
macro-zones (périmètre départemental affiché) ; G23 « petite / moyenne / grande ville » (une
convention unique) ; P10, P22, P23 (via G23) ; et, à arbitrer, P1, P2, P6 (un seuil sur une
**projection**).

**Classe D, reste appréciable ou non mesuré (le reste ; dont 11 qui deviendraient tranchables avec une nouvelle donnée)** :
- nouvelle donnée nécessaire : G9 montagne, G11 à G13 mer, G10 relief, G20 vélo, G27 EPCI, P8, P21,
  P27, P28 ;
- proxy sans question exacte : G5 façades, G6 massifs, G19 (grain commune), P3, P9, P11, P12 (grain),
  P16, P18, P19, P24, P25 ;
- non mesuré : P4, P15.

---

## 5. Conventions actuellement cachées dans futur•e

| Valeur | Emplacement | Prétend représenter | Usage | Justification dans le dépôt | Défendable telle quelle ? | Recommandation |
|---|---|---|---|---|---|---|
| montagnosité ≥ 50 ≈ 600 m (ancres 300/600/1000/1400 m) | `hard-constraints.ts:41,108,307` | « vivre à la montagne » | Recherche, dossier | commentaire seul | non (chef-lieu, seuil arbitraire) | remplacer par le zonage officiel « zone de montagne » (justification externe à rechercher), sinon limiter à la Recherche |
| relief ≥ 50 ≈ 1 250 m à 35 km | `hard-constraints.ts:42-50`, `scripts/add-relief-proximite.mjs` | « proche d'une montagne » | Recherche, dossier | commentaire (traduction de la note) | non (altitudes de chefs-lieux, pas de sommets) | limiter à la Recherche et à l'appréciation |
| ≥ 15 km de la côte | `hard-constraints.ts:40` (`excludeSeaMinKm`) | « pas le littoral » | Recherche, dossier | aucune | non (et mesure vers des villes côtières) | limiter à la Recherche jusqu'au trait de côte |
| 15 / 100 km | `coast-facts.ts:12` (`coast-proximity-v1`) | proche / loin de la mer | dossier (préférence), FUT-7 (mer sans seuil) | aucune | non | idem |
| 15 km (ANCRE_COAST_KM) | `comparateur-vie.ts:2499` | « au bord de la mer » d'une ancre | dérivation d'ancre | « aligné sur buildSignature » | acceptable comme trait d'inspiration | conserver (Recherche / inspiration) |
| 30 km mer, 50 km lieu | `hard-constraints-hydrate.ts:22-23` | rayon par défaut | Recherche seulement (`explorationHints`) | commentaire « legacy_default » | non comme verdict | conserver, Recherche seulement (déjà le cas) |
| petite ville 5 000-25 000 ; moyenne 25 000-100 000 ; grande ≥ 100 000 | `parse/route.ts:107` (consigne) | les mots du lecteur | écrit dans `communeSize` | aucune | non, et **contredit** la convention suivante | supprimer de la consigne ; une seule convention proposée |
| village < 2 000 ; petite < 25 000 ; moyenne < 100 000 ; grande < 500 000 ; métropole | `agglomeration-facts.ts:9` | catégories de taille | dossier (préférences de taille) | aucune (le seuil de 2 000 rappelle la définition INSEE d'une commune urbaine) | à justifier | rechercher (INSEE, ANCT « petites villes de demain »), versionner, proposer |
| ÷ / × 2,5 | `ancre-gabarit.ts` | gabarit d'une ancre | Recherche (et Projet par fuite) | aucune | non comme limite | Recherche seulement |
| percentile ≥ 70, 4 traits au plus | `comparateur-vie.ts:2497-2498` | ce qui distingue une ancre | dérivation d'ancre | commentaires | acceptable comme inspiration | conserver, visible |
| 20 % extrêmes (`EXTREME_SHARE`) | `mismatch-facts.ts:15` | écart / correspondance nets | dossier | commentaires | acceptable pour apprécier, jamais pour trancher | conserver |
| 8 j > 35 °C ; 25 nuits ; IFM 9 j ; 65 mm (déclaré) ; 10 / 39 / 15 (ambiant) | `climat-facts.ts:106-120` | signalement climatique | dossier | partiellement | non comme verdict | conserver pour apprécier |
| NO₂ 10 µg/m³ (OMS 2021), PM2,5 10 µg/m³ (UE 2030) | `sante-facts.ts:53-54` | seuils sanitaires | dossier | **sourcés** | oui pour la commune ; non pour la rue | conserver |
| bruit 1 km / 0,5 km / 5 km | `sante-facts.ts:75` | infrastructure bruyante à portée | dossier | part des communes concernées | non comme verdict | conserver pour apprécier |
| industrie score ≥ 50 (8 km) | `sante-facts.ts:87` | exposition notable | dossier | part des communes | non comme verdict | conserver |
| inondation score ≥ 66 | `materiality-rules.ts:131` | exposition notable | dossier | aucune | non | conserver pour apprécier |
| boisement ≥ 70 % | `materiality-rules.ts:428` | couvert forestier notable | dossier | aucune | non | conserver |
| BPE 500 m à pied | `logement-autour-types.ts:45` | « à portée » | Autour, dossier | aucune | **à proposer** comme rayon par défaut si le lecteur n'en dit pas | proposer, laisser le lecteur choisir |
| tolérance isochrone 300 m | `hard-constraints.ts:60` | bande d'incertitude | Recherche, dossier | documentée (espacement médian des sommets) | oui | conserver |
| garde-fou vie étudiante 5 000 | règles vie étudiante | masse critique | Recherche, dossier | commentaire | à justifier | conserver pour apprécier |

---

## 6. Le grain

**Une convention acceptée ne corrige jamais une mauvaise échelle.** Sur un dossier **communal**, la
mesure part du point de référence de la commune (`commune_reference`) ; sur un dossier **avec
adresse**, seuls `nearPlace` (distance et temps) et les faits Autour (BPE à 500 m), Logement (PPRN,
argiles, cavités) et secteur (IRIS) partent de l'adresse. Tout le reste reste communal, même avec une
adresse : altitude, distance à la mer, relief, taille, climat, air, bruit, industrie.

| Grain mesuré | Critères | Peut-il trancher une condition sur le futur logement ? |
|---|---|---|
| Département / région | G1 à G8 | oui (l'adresse est dans sa commune, donc dans son département) |
| Unité urbaine | G21 à G26 | oui (la question porte sur la ville, pas sur le logement) |
| Commune (fait administratif ou statistique) | P5, P26, TRI | oui, si la question est posée à l'échelle de la commune |
| Adresse | G14 à G18, P7 (PPRN), P13, P14, P17, P20 | oui |
| Point de référence de la commune (mesure physique) | G9 à G13, P8, P12, P27 | **non** : c'est le défaut de grain |
| Rayon autour du point de référence | G10, P16, P21, P28 | non |

Conséquence produit : au moment de confirmer une condition « à l'adresse », le geste doit dire
qu'elle ne sera tranchée que dans un dossier avec adresse.

---

## 7. Recherche et Projet

**Le flux actuel** : `/ou-vivre` → `saveSession` (localStorage `futuree:ouvivre:session`, durée de vie 2 h,
`OuVivreClient.tsx:49-71`) → montage de `OuVivreProjectSync` sur `/rapport` → `PATCH /api/profile`
`user_project_if_empty`.

1. **Quand une Recherche écrit le Projet** : à l'ouverture de `/rapport`, si le compte n'a **aucun**
   projet (`hasServerProject` faux) et qu'une session « Où vivre » de moins de 2 h existe.
2. **Ce qu'elle copie** : `posture: "recherche"`, `intent: null`, `rawText` (le texte tapé) et **tout**
   `parsed` : zones `hard` (filtres), dérivés d'ancre (`excludePlace`, fourchette), préférences
   dérivées, `communeAncre`, `suppressNarrativeKeys`, `horsMesure`, `ambiguities`.
3. **Si un Projet existe** : rien, en silence (garde SQL `is("user_project", null)`).
4. **Champs de Recherche persistés comme intention** : `strength: "hard"` d'une mention nue,
   l'exclusion de l'ancre, la fourchette ×/÷ 2,5, les bornes conventionnelles de taille.
5. **Plus petit changement sûr** : ne plus monter `OuVivreProjectSync` (ou le réduire à un no-op).
   La session locale continue de restaurer « Où vivre » ; la création du premier Projet passe par
   l'éditeur de `/rapport` (qui existe) en attendant le geste « Utiliser cette recherche pour mon
   projet ». Effet : un nouvel inscrit venu d'« Où vivre » arrive sans Projet pré-rempli. C'est le prix
   de l'honnêteté, et il faut le valider (§16, Q6).

---

## 8. Communes-ancres

- **Dérivation** (`comparateur-vie.ts:2492-2585`) : traits distinctifs parmi 8 clés (`vie_locale`,
  `calme_sonore`, `nature`, `mobilite_quotidienne`, `acces_transports`, `vie_etudiante`,
  `croissance_demographique`, `faible_exposition_industrielle`), percentile ≥ 70, 4 au plus, poids 3
  pour le premier et 2 pour les autres ; `proximite_mer` si la ville est à ≤ 15 km des localités
  côtières (poids 3 si ≤ 5 km) ; fourchette de taille ×/÷ 2,5.
- **Plusieurs ancres** : intersection des traits (poids minimal), fourchette englobante.
- **Affichage** : les traits sont nommés dans la reformulation (suffixe), retirables
  (`suppressNarrativeKeys`) ; « l'explicite écrase le dérivé ».
- **Exclusion de l'ancre** : `excludePlace += ancre`, pour ne pas proposer Brest en réponse à
  « comme Brest ».
- **Ce qui fuit dans le Projet** : l'exclusion et la fourchette (neutralisées à la lecture par FUT-7
  quand elles sont reconnaissables), et la **provenance** des préférences dérivées (rien ne les
  distingue d'une préférence dite).

**Séparation cible.** Projet : `communeAncre` + préférences dérivées **marquées** (provenance
`ancre:Brest`), visibles et retirables, jamais confirmables comme conditions sans reformulation par
le lecteur. Recherche : l'exclusion de l'ancre et la fourchette, calculées au moment de la recherche
depuis `communeAncre`, jamais écrites dans le Projet.

---

## 9. Projets legacy

| Ce qui existe | Normalisable sans perte ? | Traitement (migration A) |
|---|---|---|
| `zones` `hard` | oui | rester un critère ; aucune confirmation |
| `departements` | oui | idem |
| `nearPlace` avec `maxMinutes` + `mode` | oui | idem ; tranchable à l'adresse dès confirmation |
| `nearPlace` avec `maxKm` | **non** (métrique inconnue) | `metric: null`, à faire préciser |
| `communeSize` | **non** (unité et provenance inconnues) | `unit: null`, `source: "inconnue"` ; si les bornes valent exactement 5 000 / 25 000, 25 000 / 100 000 ou 100 000 / null, marquer `source: "convention_parseur_probable"`, jamais « utilisateur » |
| `excludePlace` = une ancre | reconnaissable | retirer du Projet (exclusion de Recherche) |
| `communeSize` = fourchette exacte d'ancre | reconnaissable (calcul exact) | retirer du Projet |
| `excludePlace` autre | **non** (périmètre inconnu) | `scope: null`, à faire préciser |
| `excludeZones: idf / paris` | **non** (vernaculaire ou administratif) | garder, à faire préciser |
| préférences | oui | garder ; provenance « dérivée » seulement si elle est reconnaissable (traits de l'ancre recalculés), sinon « inconnue » |

À ne **jamais** inventer : une métrique, une unité, un périmètre, une provenance « utilisateur », une
confirmation. Pas de reparse LLM massif ; les dossiers figés ne bougent pas.

Une réécriture en base n'est pas nécessaire : la normalisation peut se faire **à la lecture**
(`normalizeUserProject`), comme FUT-7 l'a fait. Si l'on veut quand même nettoyer, il faudrait un script
en deux temps : dry-run qui compte les projets par cas du tableau ci-dessus et liste ceux qui seraient
modifiés, puis écriture idempotente, sur une copie d'abord.

---

## 10. Critères pouvant devenir `trancher` sans nouvelle donnée

G7, G8, G14, G17, G18, G21, G22, G24, G25, G26 (sémantique du Projet) ; P5, P7, P13, P14, P17, P20, P26
(préférence reformulée en fait officiel) ; G15 avec une extension du routage existant.

## 11. Critères qui demandent seulement une convention acceptée

G4 (macro-zones, périmètre départemental affiché) ; G23 (petite / moyenne / grande ville, convention
unique) et ses reformulations P10, P22, P23 ; à arbitrer : P1, P2, P6 (seuil sur une projection).

## 12. Critères qui doivent rester appréciables

G5, G6, G19 ; P3, P9, P11, P12, P16, P18, P19, P24, P25 ; non mesurés : P4, P15 ; nouvelle donnée
nécessaire : G9, G10, G11, G12, G13, G20, G27, P8, P21, P27, P28.

---

## 13. Modèle minimal proposé pour FUT-8

Trois couches, chacune avec un seul écrivain :

1. **`parsed`** (écrit par le parseur) : conserve ce que le lecteur a **dit**, et seulement cela.
   - `nearPlace.metric: "vol_oiseau" | "route" | "temps" | null` ;
   - `communeSize.unit: "commune" | "unite_urbaine" | null` et `communeSize.source: "user" | null`
     (la consigne ne pose plus de bornes) ; `communeSize.word: "petite" | "moyenne" | "grande" | null` ;
   - `sizeRelativeTo.unit`, `excludePlace[].scope: "commune" | "unite_urbaine" | null` ;
   - `excludeZones` : le mot du lecteur conservé à côté du jeton (« région parisienne ») ;
   - `forceMarkers` : la citation qui suggère une condition ;
   - préférences : `source: "texte" | "ancre"`.
2. **`definitions`** (écrit par le lecteur, hors de `parsed`, comme `conditions`) : ce qu'il a précisé
   ou accepté : `{ criterion, metric?, unit?, scope?, threshold?, conventionId?, conventionVersion? }`.
   La valeur **effective** d'un critère = `parsed` complété par `definitions`.
3. **`conditions`** (FUT-7, inchangé) : l'empreinte porte la valeur effective, donc la définition.

`criterionCapability` lit la valeur effective : par exemple `nearPlace` + `metric: vol_oiseau` +
adresse → `trancher` ; `communeSize` + `unit` + `source: user` → `trancher` ; macro-zone +
`conventionId` accepté → `trancher`. Les branches s'ajoutent sans rien déconstruire.

---

## 14. Séquence d'implémentation recommandée

1. Recherche ≠ Projet : ne plus monter `OuVivreProjectSync` ; dérivés d'ancre calculés à la Recherche.
2. Parseur fidèle : champs du §13, consigne sans bornes inventées, mots forts → `forceMarkers`.
3. `definitions` + route serveur du geste « condition sans compromis » (création, retrait, précision).
4. Capacité : branches de promotion pour G7, G8, G14, G17, G18, G21, G22, G24, G25, G26.
5. Conventions : G4 (macro-zones) et G23 (tailles), une convention versionnée chacune.
6. Libellés humains distincts des clés moteur (dont les conditions : « vivre en Bretagne »).
7. Migration A à la lecture (§9).
8. *Lot séparable* : promotions de préférences P5, P7, P13, P14, P17, P20, P26.

---

## 15. Risques

- **Faux verdict par mauvais grain** : la tentation de trancher la mer ou la montagne avec les données
  actuelles. À interdire dans `criterionCapability` tant que la donnée manque.
- **Demandes de précision excessives** : chaque précision est un geste de plus. À ne poser **qu'au
  moment de confirmer** une condition, jamais pour une simple préférence.
- **Conventions acceptées sans être comprises** : la définition doit être montrée en clair (liste de
  départements, bornes, unité) avant l'acceptation, et versionnée.
- **Dossiers communaux** : beaucoup de promotions n'agissent qu'avec une adresse ; le lecteur doit le
  savoir au moment de confirmer.
- **Régression de la Recherche** : en sortant les dérivés d'ancre du Projet, « Où vivre » doit continuer
  à exclure l'ancre et à appliquer le gabarit (tests de parité à étendre).
- **PPRN multi-risques** : le PPRN à l'adresse couvre tous les risques ; la promotion de P7 exige
  d'extraire le type « inondation » du libellé, à vérifier sur données réelles.

---

## 16. Arbitrages produit nécessaires

1. **Projections climatiques** (P1, P2, P6) : accepte-t-on un verdict dur sur une **projection** (« la
   commune est projetée à plus de 20 jours > 35 °C en 2050 ») si le lecteur en accepte la définition ?
   Je propose non dans FUT-8.
2. **Préférences reformulées en faits** (P5, P7, P13, P14, P17, P20, P26) : dans FUT-8 ou dans un ticket
   séparé ? Je propose un ticket séparé si FUT-8 doit rester tenable.
3. **Tailles** : quelle convention unique pour « petite / moyenne / grande ville » (aujourd'hui deux
   conventions contradictoires), et sur quelle unité par défaut ?
4. **Macro-zones** : accepte-t-on de proposer « le Sud-Ouest = cette liste de départements » comme définition
   tranchable ? Et refuse-t-on la même chose pour les façades et les massifs, comme je le recommande ?
5. **Rayon BPE** : 500 m à pied par défaut, ou demander toujours le rayon au lecteur ?
6. **Fin de l'auto-écriture du Projet par « Où vivre »** : un nouvel inscrit arrive sans Projet
   pré-rempli tant que le geste « Utiliser cette recherche » n'existe pas. Acceptable ?
7. **Mer et montagne** : on les sort de FUT-8 (nouvelle donnée : trait de côte, zonage montagne,
   altitude de l'adresse) ? Je le recommande.
