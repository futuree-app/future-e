# Matrice sources × modules — futur·e

Ce document complète `DATA_SOURCES.md` (qui décrit le **branchement technique** de chaque source). Ici on décrit le **branchement éditorial** : pour chaque source, dans quels modules elle vit et **avec quel angle narratif** dans chacun.

**Règle de lecture** : une même source peut nourrir plusieurs modules, mais avec une voix distincte dans chacun. Ce n'est pas un doublon : c'est la même donnée brute traduite différemment selon la question posée par le module.

---

## 1. Sources déjà actives dans le repo

| Source | Quartier | Logement | Métier | Santé | Mobilité | Projets |
|---|---|---|---|---|---|---|
| **BAN** (adresse) | — | infra : ancrage adresse | — | — | — | infra : comparateur villes |
| **API Géo** (commune) | infra : commune, population, région | — | — | — | — | infra : comparateur |
| **IGN Altimétrie** | topographie territoire (montagne, plaine) | vulnérabilité submersion par altitude NGF | — | — | — | critère arbitrage côte |
| **Cadastre** | — | parcelle exacte, contenance | — | — | — | — |
| **DRIAS** (projections climat) | transformation du territoire : canicule (TX30, TX35, nuits tropicales), conditions feu (IFM > 40), sécheresse des sols (SWI < 0,4) | contrainte sur le bâti : confort été, vieillissement structure | exposition sectorielle chaleur (BTP, agri, tourisme) | vulnérabilité corporelle : canicule, allongement saisons à risque | — | cohérence territoriale 2030/2050/2100 |
| **Géorisques** (PPRN, RGA, sismique) | exposition territoriale réglementaire | exposition par adresse / parcelle, pression assurance | — | — | — | critère go/no-go |
| **VigiEau / Propluvia** (arrêtés sécheresse) | indicateur principal sécheresse : niveau de restriction en cours (vigilance, alerte, alerte renforcée, crise), 100% France | — | — | — | — | critère installation |
| **Hub'Eau — ONDE** (écoulements petits cours d'eau) | précision rurale en complément de VigiEau : assec observé sur le cours d'eau local (lacunaire en zone urbaine) | — | — | — | — | — |
| **Hub'Eau — Eau potable** (qualité) | — | — | — | conformité bactério / physico-chimique, nitrates, nitrites | — | — |
| **ATMO** (PM, NO2, O3) | — | — | exposition pro extérieure | exposition respiratoire personnalisée par âge/profil | — | — |
| **ADEME DPE** | distribution commune (% passoires) | étiquette du bien, calendrier réglementaire | — | — | — | critère achat / coût caché |
| **ADEME communeData + IRIS** | cadre territorial (densité, vieillissement, services) | contexte marché local (passoires, précarité) | — | revenu médian, accès soins | motorisation, transports en commun | comparateur multi-communes |
| **ADEME audit** | — | scénarios rénovation chiffrés pour CE bien | — | — | — | budget achat + travaux |
| **ADEME renovation** (coûts isolation/chauffage) | — | médiane/min/max par poste, département | — | — | — | budget projet |
| **ADEME RGE** | — | entreprises certifiées à proximité | — | — | — | — |
| **ADEME cartofriches** | friches du territoire | proximité pollution adresse | — | exposition sol pollué (potager, enfants) | — | — |
| **ADEME IREP** (industries) | contexte industriel commune | proximité installations classées | exposition pro contexte | exposition pollution industrielle | — | — |
| **ADEME ZFE** | — | contrainte adresse, vignette | — | — | calendrier interdictions Crit'Air | arbitrage achat véhicule |

---

## 2. Sources roadmap — haute priorité (P1-P5)

| Source | Quartier | Logement | Métier | Santé | Mobilité | Projets |
|---|---|---|---|---|---|---|
| **P1 GASPAR** (CatNat historique) | récit territoire : « 12 arrêtés depuis 1982 » | pression assurance par cumul sinistres | — | — | — | critère arbitrage |
| **P2 Loi Littoral / Montagne** | catégorisation territoire (carte de l'usage) | contraintes constructives, valeur réglementaire | — | — | accessibilité montagne | arbitrage localisation |
| **P3 GisSol** (sols pollués) | contexte agricole/pollué | — | — | exposition cadmium/HAP via sols | — | critère potager / enfants |
| **P4 BDIFF** (incendies historiques) | récit territoire : feux subis | vulnérabilité incendie maison isolée | — | — | — | arbitrage zone à risque |
| **P5 INSEE domicile-travail** | — | — | trajets sectoriels, télétravail possible | — | dépendance voiture, vulnérabilité prix carburant | tenabilité quotidien |

---

## 3. Sources roadmap — moyenne / basse priorité (P6-P15)

| Source | Quartier | Logement | Métier | Santé | Mobilité | Projets |
|---|---|---|---|---|---|---|
| **P6 Trait de côte** (CEREMA) | érosion territoriale | recul à 30/100 ans par adresse, mention acte | — | — | — | assurabilité long terme |
| **P7 Îlots de chaleur** (Copernicus) | écart température centre/périphérie | confort été selon IRIS, étage, exposition | — | surmortalité canicule personnes vulnérables | — | — |
| **P8 Équipements INSEE** | services accessibles à pied/vélo | — | — | désertification médicale | distance aux services | critère installation/retraite |
| **P9 Plans bruit** (DGAC / cartes routières) | nuisances territoire | exposition acoustique adresse | — | morbidité documentée (13 000 morts/an) | corridor de transport | arbitrage achat |
| **P10 IRVE** (bornes recharge) | — | — | — | — | couverture territoire, pertinence passage VE | arbitrage véhicule |
| **P11 Zonage H1/H2/H3** | contexte climatique réglementaire | interprétation DPE selon zone (un D en H1 ≠ un D en H3) | — | — | — | — |
| **P12 Baignade** (PDF ARS) | pratique baignade locale (loisirs) | — | — | qualité sanitaire eau de baignade | — | — |
| **P13 RNSA** (pollens) | contexte végétal allergène | — | — | calendrier pollinique, asthme | — | — |
| **P14 PFAS** (eau) | — | critère réseau eau adresse | — | exposition « polluants éternels » | — | — |
| **P15 DVF** (transactions) | — | — | — | — | — | prix marché, comparateur (v2 seulement) |

---

## Quatre exemples pour fixer le principe « même source, récit distinct »

**DRIAS — « 28 jours >35°C en 2050 »**
- *Quartier* : « les étés à {commune} ne ressembleront plus à ce que vous connaissez »
- *Logement* : « votre F va devenir invivable en l'absence de rénovation thermique »
- *Métier* : « les chantiers BTP perdront 12 jours/an de travail extérieur »
- *Santé* : « risque de surmortalité au-delà de 75 ans »

**Géorisques — mention "PPRi inondation"**
- *Quartier* : récit territorial (le risque collectif documenté)
- *Logement* : pression assurance, mention obligatoire en cas de vente
- *Projets* : critère d'arbitrage achat/déménagement

**ADEME communeData (sous-exploitée aujourd'hui — 5 angles potentiels)**
- *Quartier* : densité, vieillissement, boisement
- *Logement* : % passoires, précarité énergétique du voisinage
- *Santé* : accès médecins, revenu médian
- *Mobilité* : motorisation, transports en commun
- *Projets* : critères de comparaison entre communes

**P1 GASPAR — liste d'arrêtés CatNat (à intégrer)**
- *Quartier* : histoire vécue du territoire
- *Logement* : signal de pression assurantielle cumulée
- *Projets* : indicateur d'arbitrage à 20 ans

---

## Doublons / mauvais branchements à corriger

Trois cas identifiés dans le code actuel :

1. **DRIAS** : branché côté Quartier (`QuartierClimatData.tsx`) mais pas côté Logement. Le croisement DPE × jours de chaleur n'existe nulle part. À traiter comme « une donnée, deux récits », pas comme un doublon à éviter.

2. **ADEME communeData** : fetché uniquement dans `GET /api/georisques-logement`. Le module Quartier le re-fetcherait pour rien si on copie. Approche correcte : un seul fetch côté serveur via `gatherCommuneEnrichment` (cache `next: { revalidate }`), exposé à chaque module qui en a besoin avec son propre angle.

3. **Hub'Eau** : la lib `eaufrance.ts` retourne déjà deux blocs distincts dans `EaufranceSummary` :
   - `drought` (rivière, status d'écoulement, isDry) → angle Quartier (sécheresse, pression hydrique territoriale)
   - `drinkingWater` (conformité, nitrates, nitrites) → angle Santé (ingestion)

   Aujourd'hui le résultat complet est fetché par `gatherCommuneEnrichment` puis **jeté** dans l'UI Quartier. À exposer côté Quartier pour `drought` uniquement.

4. **ATMO PM2.5** : fetché et passé en prop à `QuartierClimatData`, puis explicitement ignoré (`void pm25` ligne 84). L'angle « qualité de l'air territoriale » est en réalité presque identique à l'angle Santé (mêmes µg/m³, même seuil OMS). À retirer du module Quartier et garder pour Santé uniquement. Un vrai angle Quartier existerait sous la forme « X jours en alerte qualité air en 2024 », mais ce n'est pas l'indicateur PM2.5 brut.

---

## Statut Métier

Le module Métier reste le plus pauvre en sources branchées. Aujourd'hui, seules **DRIAS** (exposition sectorielle chaleur) et **P5 INSEE domicile-travail** (trajets pro) le concernent. Les sources de référence listées dans la vision (France Stratégie, INRS, Dares, France Travail) ne sont pas encore intégrées et ne figurent pas dans la roadmap data actuelle. C'est un point de vigilance produit, pas un oubli de matrice.

---

*Document futur·e · Matrice sources × modules · À mettre à jour à chaque nouvelle source intégrée ou réaffectée.*
