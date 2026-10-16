# FUT-85 — Cadrer l'intelligence de composition avant de construire

**16/10/2026** · branche `explore/fut-85-cadrage-compositions`, partie de `main` à `7937f37d` (FUT-62 fusionné).
**Version 2** (même jour), après la première revue. Elle reprend la matrice des candidats selon la disponibilité des données, sépare fait / classification / composition (D2) et faits canoniques / classifications / interprétations (D3), corrige l'exemple argiles et la démonstration chiffrée de S2, et ajoute des fiches de transmission pour S1 et S2. Le détail est en §M.

**Statut : étude.** Aucun code de production n'a été touché : pas de règle, pas de composant, pas de donnée. Les sondes citées ont tourné en local, sur des copies, et ont été supprimées après exécution. Leur source est en §K.

**Tickets Linear.** Le connecteur Linear n'est pas authentifié dans cette session : **aucune description de ticket n'a pu être lue**. Ce que le rapport dit de FUT-20, 21, 24, 47, 80, 81, 82, 83, 89, 98 et 103 vient :
- de leur **titre**, tel que donné dans la mission ;
- des **références du dépôt** : audit FUT-67, audit FUT-62, étude mobilité La Rochelle (branche `etude/mobilite-lots`), audits FUT-50 (branche `feat/fut-50-socleom-integration`).

Chaque fois qu'une affirmation dépend du contenu réel d'un ticket, elle porte la mention **« à vérifier dans Linear »**.

Ce document a deux niveaux de lecture. La **partie 1** se lit sans connaître le moteur. La **partie 2** contient l'inventaire, les preuves, la feuille de route et la spécification.

---

# Partie 1 — Synthèse décisionnelle

## Les six réponses

**1. Quelles compositions peut-on construire immédiatement ?**
- **Chaleur future × confort d'été du logement**, au-dessus du seuil du moteur. C'est le pilote FUT-20 : toutes les données sont dans le dépôt.
- **Littoral × adresse**, **en vérification seulement**. Les données sont là : liste officielle des communes concernées par le recul du trait de côte, plans de prévention au point, distance au rivage. Il manque une relecture juridique.
- **Îlot de chaleur du quartier**, comme côté supplémentaire du pilote (v2), sur les 596 communes couvertes.
- Le patron qui existe déjà, « le voisinage complète le rang communal » (soins, gare), une fois l'anomalie S1 corrigée.

**2. Quelles compositions deviennent possibles si des tickets de données aboutissent ?**
- **Argiles × caractéristiques du bâtiment et de la copropriété** (FUT-80, FUT-83) : pour adapter les questions à poser, jamais pour noter un risque.
- **Mobilité × trajet personnel** (FUT-47, FUT-98) : de la gare proche au trajet réellement compatible avec la contrainte du ménage.
- **Services × besoin déclaré du foyer** (FUT-24, FUT-89).
- **Urbanisme et permis × voisinage** (FUT-81) : ce qui est autorisé, ce que la règle permet, jamais ce qui sera construit.
- **Chaleur × bruit × aération nocturne** (FUT-82), qui restera combinée à une observation.
- Le **littoral au grain de la parcelle**, si les zones d'exposition au recul sont lisibles (FUT-81).

Un ticket ouvert n'est **pas** une donnée disponible : aucune de ces compositions n'est à construire avant que son ticket ait livré une source vérifiée.

**3. Lesquelles nécessiteront toujours une observation ou une vérification humaine ?**
Celles dont la conclusion porte sur un vécu ou un état que personne ne publie :
- peut-on dormir fenêtres ouvertes du côté des chambres ;
- état des fondations, fissures ;
- disponibilité réelle d'un médecin, d'une place en collège ;
- horaires et confort réels d'un trajet ;
- nuisances d'un chantier voisin ;
- température vécue.

La composition sert alors à **poser la bonne question au bon moment**. FUT-21 (incertitude actionnable, observation avec provenance) en est le cadre naturel, à vérifier dans Linear.

**4. Quel premier pilote recommande-t-on ?**
**FUT-20, inchangé :** chaleur future × confort d'été du logement × projet. On l'obtient en enrichissant les trois cartes chaleur existantes, au-dessus du seuil du moteur.

La lecture **sous le seuil** (La Rochelle : nuits tropicales de 5 à 23 par an) n'est ni exclue ni décidée. Une règle candidate est proposée (§G.1), mais la décision reste **ouverte** et doit être arbitrée avec FUT-103.

**5. Quels points faut-il décider avant son développement ?**
Le tableau final (§L) les détaille. **Deux arbitrages restent ouverts :**
- **D2** : composer, ou non, sous le seuil ;
- **D3** : le contrat climatique commun (définition de l'écart à la référence, rôle de la classification « évolution »). D3 attend la fusion de FUT-50.

Les autres décisions ont une recommandation nette.

**6. Quelles anomalies corriger indépendamment, et vite ?**

| | Défaut | Gravité | Fiche |
|---|---|---|---|
| **S1** | Une carte « condition sans compromis » affiche « plutôt défavorable » à partir d'un constat de proximité qui n'oriente pas le critère (médecin à 550 m, gare à 600 m, quartier peu motorisé) | **Élevée** | §D.6 |
| **S2** | Le module Logement affirme « la progression des nuits chaudes » sans lire la donnée. Contredit par l'indicateur du produit sur 59 communes, hausse inférieure à une nuit par an sur 239 | **Faible** (requalifiée) | §D.7 |

Aucun ticket existant ne couvre précisément S1 : un ticket distinct est proposé, à créer après ta validation.

## 1. Ce que futur•e sait déjà relier

- **Deux priorités qui tirent en sens opposés sur le même lieu.** Des hivers parmi les plus doux du pays, des étés de plus en plus chauds : une seule carte présente les deux côtés, sans les solder.
- **Une même cause derrière plusieurs écarts.** La petite taille d'un village dessert à la fois « une grande ville » et « ne pas être isolé » : une carte, une cause, deux conséquences.
- **Un constat communal et le geste qui se fait au logement.** Chaleur ou danger d'incendie établis à la commune, avec le geste à faire sur place.
- **Deux contrôles qui se mènent ensemble.** Un sol argileux et le plan de prévention sécheresse qui l'encadre.
- **Une mesure à l'adresse qui complète un rang communal.** Médecin à 550 m, gare à 600 m, équipement automobile du quartier. Ces constats sont posés **à côté** du rang communal, sans que l'un corrige l'autre.
- **Trois sources ordonnées sur un même risque.** Plan de prévention à l'adresse, sinistres indemnisés dans la commune, arrêtés CatNat : le module Logement les ordonne dans une seule lecture.
- **Le projet personnel au grain adresse.** Le temps de trajet vers le lieu déclaré est recalculé depuis l'adresse.

## 2. Ce que futur•e ne sait pas encore faire

- **Relier le logement à une priorité déclarée.** Les constats Logement ne sont rattachés à **aucune** priorité du projet. La sonde sur Nîmes montre **deux cartes chaleur, deux gestes différents, aucun lien** : l'une demande de « regarder comment le logement tient l'été » alors que la carte voisine dit ce que le diagnostic en sait.
- **Transformer un manque en vérification ciblée.** Quand le diagnostic manque (75 à 86 % des adresses, mesure du 31/07), le dossier ne transforme pas ce manque en question précise sur la chaleur.
- **Parler d'une seule voix sur la chaleur.** Trois lectures coexistent :
  - le moteur juge des **niveaux** projetés ;
  - la synthèse IA du Logement juge des **évolutions**, avec ses propres seuils ;
  - une phrase du module Logement n'en lit aucun.

  Lire à la fois le niveau et l'évolution est légitime : ce sont deux questions différentes (§G.2). Ce qui ne l'est pas, c'est deux conventions non déclarées, et une phrase sans donnée.

## 3. Ce qui est réellement différenciant

Pas le nombre de rapprochements. Un portail peut afficher la chaleur de la commune et l'étiquette du logement l'une à côté de l'autre. Ce qu'il ne fera pas :

1. **partir de ce que la personne a déclaré**, et ne relier que ce qui change sa décision ;
2. **descendre jusqu'à ce logement-là**, en disant d'où vient chaque morceau (commune, quartier, bâtiment, logement) ;
3. **transformer un manque en question précise** : « demandez si l'appartement est traversant et s'il est sous les toits : c'est ce que le diagnostic ne dit pas » ;
4. **savoir se taire**, et dire pourquoi.

La feuille de route (§E) étend ce même geste à mesure que les données arrivent. Une composition ne devient jamais plus affirmative que sa source la moins précise.

## 4. Ce qu'il faut conserver

- **Les cinq compositions du registre** et leur doctrine. Une relation se déclare, elle ne se découvre pas. Une composition n'invente pas de fait et ne rend pas visible ce qui était silencieux. Le côté favorable n'est jamais recalculé.
- **Le patron « le voisinage complète le rang communal »** : le mécanisme multi-échelles le plus sain du produit.
- **La lecture inondation à trois sources**, et la règle de la synthèse Territoire qui interdit à l'IA de relier deux faits voisins.

## 5. Ce qu'il faut arrêter ou éviter

- **La phrase « Avec la progression des nuits chaudes à {commune}… »** telle qu'elle est : affichée partout, sans lire la donnée (S2).
- **La règle « transports contre chaleur »** : elle juge la chaleur sur une note interne avec un autre seuil que la règle chaleur (§D.4, D7).
- **Les conclusions qu'aucune source ne porte**, même quand une source voisine arrive :
  - le bruit dans la chambre, déduit d'une carte de bruit ;
  - la faisabilité d'un trajet, déduite d'une gare proche ;
  - les nuisances d'un chantier, déduites d'un permis ;
  - la vulnérabilité d'un bâtiment, déduite de son type ;
  - un recul du trait de côte au bâtiment, déduit de la distance au rivage.

  Ce sont des **formulations** à exclure, pas des compositions à abandonner (§E.3).
- **Un moteur universel de composition**, et **les compositions établies par l'IA**.

## 6. La feuille de route en une page

| Catégorie | Composition | Ticket(s) | Priorité |
|---|---|---|---|
| **Réalisable maintenant** | 1. Chaleur future × confort d'été du logement × projet (au-dessus du seuil) | FUT-20 | **Pilote** |
| | 2. Littoral × adresse (vérification) | — (FUT-81 pour la v2) | Haute |
| | 8. Îlot de chaleur du quartier, côté v2 du pilote | — | Moyenne |
| **Candidat conditionnel** | 3. Argiles × bâtiment et copropriété | FUT-80, FUT-83 | Haute |
| | 4. Mobilité × trajet personnel | FUT-47, FUT-98 | Haute |
| | 5. Services × besoin déclaré | FUT-24, FUT-89, FUT-47 | Moyenne |
| | 6. Urbanisme et permis × voisinage | FUT-81 | Moyenne |
| **Toujours avec observation** | 7. Chaleur × bruit × aération nocturne | FUT-82, FUT-21 | Moyenne |
| | La dimension « vécu » des compositions 3 à 6 | FUT-21 | — |
| **Insuffisamment fondé** | Les formulations du §5, quelle que soit la source | — | Exclues |

Le pilote immédiat reste **unique**.

## 7. Le pilote recommandé pour FUT-20

**Chaleur future × confort d'été du logement × projet déclaré.** On l'obtient en **améliorant les trois cartes chaleur existantes** (l'écart « des étés supportables », le compromis hivers doux / étés chauds, le constat non demandé), qui absorbent la carte « Confort d'été insuffisant » du logement quand elle existe.

**Ce qu'elle dit**, selon ce que l'on sait :

- **La commune dépasse le seuil et le diagnostic décrit ce logement :** les deux constats sont réunis dans une seule carte.

  > À Nîmes, les nuits tropicales passeraient de 33 à 69 par an d'ici 2050. D'après son diagnostic (2024), ce logement classe son confort d'été comme insuffisant : il n'est pas traversant et ses murs ont une inertie légère ; ses protections solaires ne sont pas renseignées.

  Un seul geste suit : « Demandez quelles protections solaires existent, et si les chambres peuvent être aérées la nuit. »

- **Le diagnostic décrit l'immeuble, ou il n'y en a pas :** la carte nomme ce qui manque et en fait la vérification.
- **La commune est sous le seuil :** voir D2, décision ouverte.
- **Aucune chaleur à signaler** (pas de nuit tropicale, même en 2050), ou **données illisibles :** aucun lien.

**Ce qu'elle ne dit jamais :** une température intérieure, un « vous aurez trop chaud », un « ce logement compense ».

**Périmètre :** 3 à 5 jours (§F.9).

## 8. Les décisions

Voir le **tableau final, §L**. En bref :
- D1, D4, D5, D6 et D7 ont une recommandation nette ;
- **D2 et D3 restent ouverts** ;
- D8 regroupe les choix de données qui conditionnent la feuille de route.

---

# Partie 2 — Annexe technique

## A. Méthode et périmètre

**Lu dans le code** (`main` à `7937f37d`) :
- `src/lib/decision/` :
  - compositions : `fact-compositions.ts`, `fact-composition.ts` ;
  - assemblage et types : `decision-assembler.ts`, `decision-fact.ts` ;
  - règles : `materiality-rules.ts`, `logement-rules.ts`, `mismatch-rules.ts`, `autour-rules.ts`, `secteur-rules.ts`, `permis-rules.ts`, `condition-rules.ts`, `criteria-registry.ts` ;
  - faits : `climat-facts.ts`, `logement-facts.ts`, `autour-facts.ts`, `territory-facts.ts`, `mismatch-facts.ts` ;
  - lectures et vues : `echelles.ts`, `inondation-lecture.ts`, `conclusion-plan.ts`, `conclusion-prompt.ts`, `dossier-view.ts` ;
- assemblage adresse : `src/lib/server/assemble-address-dossier.ts` ;
- climat et logement : `src/lib/drias-json.ts` (lu, **non modifié**), `src/lib/thermal-evidence.ts`, `src/lib/logement-synthesis-cache.ts`, `src/app/api/synthesize-logement/route.ts` ;
- voisinage et accueil : `src/lib/logement-autour-chaleur.ts`, `src/lib/icu.ts`, `src/lib/accueil/reponses.ts` ;
- territoire : `src/lib/territoire/synthesis-contract.ts` ;
- rendu : `src/components/report/ThermalComfortSection.tsx`, `LogementModule.tsx`, `FactCompositionCard.tsx`.

**Documentation lue :**
- sur `main` :
  - `docs/cadrage-chaleur-chaine-de-lecture.md`, `docs/cadrage-sources-par-echelle.md` (bruit, §Pile B) ;
  - `docs/audits/2026-07-03-dpe-confort-ete-couverture.md`, `2026-07-30-rnb-dpe-rattachement-batiment.md`, `2026-10-11-fut67-dossier-adresse.md`, `2026-10-12-fut90-composition-chaleur.md`, `2026-10-15-fut62-audit-energetique.md` ;
  - `docs/vault/briefs/logement-caracteristiques-declarees.md`, `docs/rapports-agents/data-curator/2026-08-21-statut-apports-lecteur.md` ;
- **en lecture seule sur d'autres branches** :
  - `feat/fut-50-socleom-integration` : `docs/audits/2026-10-15-fut50-chaleur-pastille.md`, `…-chaleur-concrete-30c.md`, `…-chaleur-langage-lecteur.md` ;
  - `etude/mobilite-lots` : `docs/etudes/2026-10-13-larochelle-mobilite/RAPPORT.md` (§5, « Avis sur FUT-47 ») et `redaction/README.md` (FUT-98).

**Données lues** :
- `public/data_climat.json` (DRIAS : 35 006 entités, dont 34 873 métropolitaines au palier `gwl20`) ;
- `data/comparateur-index.json.gz` (34 788 communes) ;
- `data/littoral-*.json`, `data/icu.json`.

**Sondes** : la vraie chaîne règles → conditions → compositions → assemblage, sur des communes réelles (Nîmes, La Rochelle, Briançon, Châtelaillon, avec leurs données DRIAS réelles). Les logements viennent des fixtures FUT-87 (adresses fictives). Les rangs communaux marqués **fictif** ont été posés pour isoler un cas.

**Suite de tests de décision**, lancée seule : 64 fichiers, **1 007 tests, 1 007 verts**.

## B. Inventaire des compositions existantes

Familles :
- **A** : présentation ;
- **B** : arbitrage ;
- **C** : multi-échelles ;
- **D** : incertitude actionnable.

Une ligne peut relever de deux familles. *Inventaire inchangé depuis la v1, sauf les statuts des n° 15 et 16, révisés avec D3.*

### B.1 Le registre officiel (`fact-compositions.ts`), cinq patrons

La liste de la première revue est **exacte et complète pour le registre**. `composeFacts` (`fact-compositions.ts:337`) appelle exactement ces cinq fonctions. Le validateur `assertCompositionsValid` (`:295`) refuse une absorption double, un fait absorbé inexistant, une mauvaise section, ou un sujet de héros mal formé. Les cinq se branchent aux deux parcours, commune (`territory-facts.ts:255`) et adresse (`assemble-address-dossier.ts:112`), donc aussi à l'artefact payé.

#### B.1.1 `seasonal_climate_tradeoff` — douceur des hivers × fortes chaleurs (`:61`)

| Rubrique | Contenu |
|---|---|
| Faits sources | Douceur hivernale : rang national de la température moyenne de décembre à février, période 1976-2005, grain commune. Chaleur : mismatch DRIAS 2050 (jours > 35 °C, nuits tropicales), grain commune. |
| Déclenchement | `douceur_climat` et `faible_chaleur` déclarées au poids 2 ou plus ; douceur `satisfied` (parmi les 20 % les plus doux) ; mismatch chaleur **émis** (FUT-90) ; preuve de douceur constructible. |
| Rôle du projet | Central : les deux priorités doivent être déclarées. |
| Production | Une carte « Ce qui départage vraiment » : un côté favorable, un côté défavorable avec le geste `summerComfortAction`, un sujet de héros. |
| Synthèse IA | Non. Le bloc `compositions_found` de la conclusion peut être reformulé par le modèle, avec un repli déterministe, sans jamais créer de relation (`conclusion-prompt.ts:67`). |
| Nouveauté | **Modeste mais réelle.** Les deux priorités viennent du même régime climatique : ce qui satisfait l'une contrarie l'autre. C'est le seul arbitrage authentique du registre. |
| Tests | `fact-compositions.test.ts` (5 tests structurels), `winter-mildness-e2e.test.ts`, `fut90-conditions-climat.test.ts`. |
| Remarques | Deux temporalités côte à côte : la douceur sur 1976-2005, la chaleur en 2050. À relire dans FUT-17. Fréquence possible : 3 333 communes (9,6 %). |
| **Statut** | **Conserver, Enrichir** (côté logement du pilote). |

#### B.1.2 `climate_comfort` — chaleur × geste logement (`:113`)

| Rubrique | Contenu |
|---|---|
| Faits sources | Le mismatch chaleur seul (grain commune). |
| Déclenchement | `faible_chaleur` au poids 2 ou plus, mismatch émis, tradeoff saisonnier non produit. |
| Production | Une carte « Ce qui correspond moins bien », avec le constat DRIAS et l'action `summerComfortAction(hasAddress)`. |
| Données manquantes | L'action est **la même** que le logement soit documenté ou non : elle **ignore** ce que le diagnostic dit. |
| Nouveauté | **Aucune** : une restauration de geste (`fact-composition.ts:96`). |
| Tests | `fact-compositions.test.ts` (3 tests), `fut90-*`. |
| Sonde Nîmes, diagnostic « insuffisant » | Cette carte demande de « regarder comment le logement tient l'été » ; trois cartes plus bas, « Confort d'été insuffisant » dit ce que le diagnostic en sait, avec un autre geste. |
| **Statut** | **Enrichir.** Point d'attache principal du pilote. |

#### B.1.3 `wildfire_exposure` — danger d'incendie × geste terrain (`:144`)

| Rubrique | Contenu |
|---|---|
| Faits sources | Mismatch feu : indice forêt-météo 2050, ou risque feu de forêt recensé (Géorisques). Grain commune. |
| Déclenchement | Mismatch feu émis, à tout poids. |
| Production | Un titre factuel selon le fondement, l'action `wildfireExposureAction`. |
| Nouveauté | Aucune : restauration de geste. |
| Limite | Le geste parle de débroussaillement même pour un appartement en centre-ville. Ce n'est pas faux, c'est hors sujet. Il ne s'adapte qu'en connaissant le bâtiment (FUT-80). |
| **Statut** | **Conserver**, indépendante. |

#### B.1.4 `territory-size-multiple-consequences` — petite taille × plusieurs priorités (`:194`)

| Rubrique | Contenu |
|---|---|
| Faits sources | Au moins deux mismatches du même fait de taille, catégorie « village ». |
| Production | Une cause, deux conséquences, chacune avec son niveau de matérialité. |
| Nouveauté | Faible mais utile : évite une double lecture. |
| Tests | 4 tests, dont le déterminisme d'ordre. |
| **Statut** | **Conserver**, indépendante. |

#### B.1.5 `clay_regulation_grouped` — argiles × plan de prévention sécheresse (`:251`)

| Rubrique | Contenu |
|---|---|
| Faits sources | `logement.exposition-bati` (aléa argiles moyen ou fort, parcelle) et `logement.zone-reglementee` (plan au point), si le libellé du plan atteste « sécheresse / argile / tassement ». |
| Production | Une carte « À contrôler », deux items complets. |
| Nouveauté | Faible : les deux contrôles se mènent ensemble. Fréquence non mesurée, probablement rare. |
| Tests | 3 tests. |
| **Statut** | **Conserver. Enrichir** avec les caractéristiques du bâtiment et de la copropriété (candidat 3), sans en faire un niveau de risque. |

**Constat sur les tests.** Les tests du registre sont presque tous **structurels**. `fact-compositions.test.ts` ne porte que **deux** assertions sur un texte. C'est le piège décrit dans `AGENTS.md` : « la carte apparaît » et « la carte dit vrai » sont deux assertions distinctes.

### B.2 Dans le moteur, hors registre

| # | Mécanisme | Où | Faits et grains | Projet | Production | Famille | Nouveauté | **Statut** |
|---|---|---|---|---|---|---|---|---|
| 6 | **Transports contre chaleur** | `materiality-rules.ts:100` | Deux **notes internes** communales (`acces_transports` ≥ 60, `faible_chaleur` ≤ 40) | Les deux priorités, poids ≥ 2 | Un `CompromiseFact`, preuves sans valeur | B | Faible : juxtaposition. **Autre convention que la règle chaleur** (§D.4) | **Retirer** (D7) |
| 7 | **Cartes « condition sans compromis »** (FUT-7) | `condition-rules.ts` | Tous les faits d'un critère confirmé, **tous grains confondus** | Confirmation du lecteur | Une carte en tête, avec un signal | A + B | Bonne idée. **Défaut S1** | **Conserver**, corriger S1 |
| 8 | **Le voisinage complète le rang** : `autour.acces-soins`, `autour.gare` | `autour-rules.ts:208`, `:397` | Rang communal **et** présence BPE (adresse, proximité) | Priorité déclarée | Un constat à contrôler à côté du rang | C | **Réelle** ; juxtaposée | **Conserver** ; patron à suivre |
| 9 | **Équipement automobile du secteur** | `secteur-rules.ts:31` | Part des ménages motorisés (IRIS) contre commune | `faible_dependance_auto` | Une nuance `secondary` | C | Réelle, bornée | **Conserver** (touché par S1) |
| 10 | **Trajet personnel recalculé à l'adresse** | `territory-facts.ts:120`, `assemble-address-dossier.ts:106` | Lieu déclaré × adresse × itinéraire IGN (voiture, marche) | Contrainte déclarée | Incompatibilité, ou condition à confirmer | C | **Réelle** | **Conserver** ; base de FUT-47 |
| 11 | **Radon** | `radon-rules.ts` | Classe communale × geste au logement | Non demandé | Constat, action au logement | C + D | Réelle | **Conserver** |
| 12 | **Feu, deux sources** | `materiality-rules.ts:437`, `:607` | Indice forêt-météo ou risque recensé | Déclaré ou ambiant | Un constat, deux fondements | A | Faible | **Conserver** |
| 13 | **Inondation et CatNat** | `materiality-rules.ts:127` | Note d'exposition + arrêtés (commune) | Priorité | Constat borné | A | Faible | **Conserver** |
| 14 | **Héros et conclusion** | `conclusion-plan.ts`, `conclusion-prompt.ts:67` | Compositions affichées | — | Sujet du héros, action mot pour mot ; le modèle peut reformuler | A | Rendu | **Conserver** |

### B.3 Hors du moteur de décision : modules et synthèses

| # | Mécanisme | Où | Faits et grains | Projet | Production | IA | Famille | **Statut** |
|---|---|---|---|---|---|---|---|---|
| 15 | **« Dans le climat futur »** du confort d'été | `ThermalComfortSection.tsx:67` et `:157` | **Aucun fait climatique lu** ; nom de la commune et niveau du diagnostic | Aucun | « Avec la progression des nuits chaudes à {commune}… », pour toute adresse | Non | C (non fondé) | **Corriger** (S2), puis **Remplacer** par la sortie du pilote |
| 16 | **Synthèse IA du Logement : climat × confort d'été** | `deriveClimatProjete` (`drias-json.ts:280`), prompt v6+ (`synthesize-logement/route.ts:165`) | **Évolution** depuis 1976-2005 (anomalies nuits tropicales et jours > 30 °C ≥ 20, « marquee », environ 15 % des communes) × confort d'été | **Aucun** | Une phrase dont le sujet reste le logement | **Oui** | C (via IA) | **Conserver la lecture d'évolution, déclarer sa classification** et la brancher sur les faits canoniques (D3, §G.2). Ne pas la supprimer |
| 17 | **Îlot de chaleur × espace vert** | `logement-autour-chaleur.ts:49` | Îlot de chaleur (grand-IRIS, 596 communes) × espace vert (point) | Aucun | Une phrase qui relie, sans compensation | Non | A + C | **Conserver** ; côté v2 du pilote |
| 18 | **Lecture inondation à trois sources** | `inondation-lecture.ts` | Plan à l'adresse × sinistres (commune) × arrêtés (commune) | Aucun | Trois constats ordonnés | Non | A + D | **Conserver** |
| 19 | **Conclusion du module Autour** | `autour-conclusion.ts` | Équipements, espace vert, îlot de chaleur | Aucun | Conclusion déterministe | Non | A | **Conserver** |
| 20 | **Synthèse IA du Territoire** | `territoire/synthesis-contract.ts:255` | Instantané Territoire | Aucun | **S'interdit de relier** deux faits voisins | Oui | — | **Conserver** |
| 21 | **Comparer deux candidats** | `comparaison-candidats.ts` | Deux artefacts figés | Critères déclarés | Lecture croisée, sans gagnant | Non | A | **Conserver** |

**Ce que montre l'inventaire.** La seule relation **logement × territoire** passe soit par l'IA (n° 16), soit par une phrase sans fondement (n° 15). La seule relation **projet × adresse** est le trajet (n° 10). **Aucun constat Logement n'est rattaché à une priorité** : toutes les règles Logement ont `projectKeys: []` (`logement-rules.ts:67`).

## C. Réexamen des cinq compositions

- **Information décisionnelle :** seulement `seasonal_climate_tradeoff`, et modestement. Les quatre autres sont de la présentation ou de la **restauration de geste**.
- **À intégrer dans plus riche :**
  - `climate_comfort` et le côté défavorable du tradeoff, dans le pilote ;
  - `clay_regulation_grouped`, dans le candidat 3 ;
  - `wildfire_exposure`, plus tard, pour son geste.

  On **étend** dans tous les cas : le patron garde son identifiant, son invariant et ses tests.
- **Indépendantes :** `territory-size-multiple-consequences` et `wildfire_exposure` (`fact-compositions.ts:348`).
- **Redondances avec les synthèses :**
  1. La synthèse IA du Logement croise déjà chaleur et confort d'été, mais sur l'**évolution**, quand le pilote part du **niveau**. Ce n'est pas une contradiction en soi : la règle est que les deux lectures partent des mêmes faits et ne se contredisent jamais (§G.2).
  2. La phrase « Dans le climat futur » (n° 15) redit la même chose sans fondement.
  3. Avec `douceur_climat` confirmée, la douceur se lit deux fois (FUT-90, hors périmètre 3). À régler dans FUT-17.

## D. Anomalies et incohérences : preuves et fiches

### D.1 S1 — preuve : la condition inverse un constat de proximité

**Cause.** `condition-rules.ts:38` pose `DEFAVORABLES = new Set(["mismatch", "verification"])`. `signalDe` (`:51`) rend `"defavorable"` dès qu'une règle du critère a rendu `verification`.

Huit règles rattachées à une seule priorité rendent `verification` :
- **cinq** pour une exposition notable, qui oriente bien le critère dans le mauvais sens : inondation, pluies extrêmes, air, bruit, industrie (`materiality-rules.ts`) ;
- **trois** pour un constat de proximité qui **n'oriente pas** le critère :
  - `autour.acces-soins` : médecin ou pharmacie recensé, ou aucun dans le périmètre ;
  - `autour.gare` : gare recensée, ou aucune dans le périmètre ;
  - `secteur.equipement-auto` : quartier plus ou moins motorisé que la commune.

Le texte reprend en plus `POURQUOI_PREFERENCE` (« Cette lecture est faite à l'échelle de la commune », `:162`), quel que soit le grain des faits réunis.

**Sonde** : vraie chaîne `runRules` → `assembleDossier`. Commune Châtelaillon-Plage, rang `acces_soins` **fictif** à 0,85-0,90, médecin à 553 m.

```
=== commune seule, CONFIRMÉE
 [incompatibilities] condition_check status=Ouverte · plutôt favorable | Pour l'accès aux soins, Châtelaillon-Plage se situe parmi les 20 % de communes où il est le plus favorable en France.
=== adresse, CONFIRMÉE
 evaluations soins: territoire.mismatch-acces_soins=satisfied, territoire.alignment-acces_soins=satisfied, autour.acces-soins=verification, condition.acces_soins=condition_check
 [incompatibilities] condition_check status=Ouverte · plutôt défavorable | Un médecin généraliste se trouve à environ 550 m de cette adresse.
    whyNotDecided: Cette lecture est faite à l'échelle de la commune, sans seuil fixé par vous. Elle éclaire votre condition sans pouvoir la trancher.
    consequence: Ce que l'on sait penche contre cette condition. Elle reste ouverte : à vérifier avant de décider.
```

Même résultat avec une gare à 600 m (`acces_transports`) et un secteur à 45 % de ménages motorisés contre 70 % (`faible_dependance_auto`) :

```
=== acces_transports | … autour.gare=verification, condition.acces_transports=condition_check
 Ouverte · plutôt défavorable | Une gare se trouve à environ 600 m de cette adresse. | Ce que l'on sait penche contre cette condition. …
=== faible_dependance_auto | … secteur.equipement-auto=verification, condition.faible_dependance_auto=condition_check
 Ouverte · plutôt défavorable | Dans ce secteur, 45 % des ménages disposent d'au moins une voiture, contre 70 % dans l'ensemble de la commune … | Ce que l'on sait penche contre cette condition. …
```

### D.2 S2 — preuve requalifiée : la phrase « progression des nuits chaudes »

**Ce qui est établi par le code.** `ThermalComfortSection.tsx:67-73` construit la phrase avec le seul nom de la commune et le niveau du diagnostic. Le rendu est **inconditionnel** (`:157`), monté par `LogementModule.tsx:590` dans `/rapport/logement`. La phrase est donc affichée **sans qu'aucune donnée climatique ait été lue**. C'est le défaut, indépendamment de tout chiffre.

**Les variables** (DRIAS-TRACC, médiane multi-modèles par commune ; colonnes dans `drias-json.ts`) :

| Variable | Colonne | Ce qu'elle est | Unité |
|---|---|---|---|
| `NORTR_yr` | `column10` | Nombre annuel moyen de **nuits tropicales projetées** au palier considéré | nuits/an |
| `ATR_yr` | `column25` | **Écart** (anomalie) de ce nombre par rapport à 1976-2005 au même palier | nuits/an |
| Référence 1976-2005 | — | **Reconstruite**, jamais lue : médiane sur `gwl15`, `gwl20`, `gwl30` de (`NORTR` − `ATR`) (`reconstructReference`, `climat-facts.ts`) | nuits/an |

La v1 avait raison de signaler qu'une anomalie faible n'est pas un total faible. Ici, la mesure a été refaite sur la **valeur projetée** comme sur l'**anomalie**.

**Définition à vérifier dans la notice DRIAS :** le commentaire de `drias-json.ts` écrit « Tmin > 20 °C », celui de `climat-facts.ts` « Tmin ≥ 20 °C (définition Météo-France) ». Cela ne change aucun chiffre ci-dessous, mais le texte affiché doit suivre la notice.

**Mesures** (métropole, 34 873 communes au palier `gwl20`, horizon 2050) :

| Ensemble | Communes | Ce qu'il autorise à dire |
|---|---|---|
| `NORTR_yr = 0` et `ATR_yr = 0` | **59** | L'indicateur de nuits tropicales ne montre **aucune** progression à 2050. La phrase y est **contredite** par la donnée du produit |
| `NORTR_yr < 0,5` (ce sont exactement les mêmes communes que `ATR_yr < 0,5` : leur référence vaut 0) | 151, dont les 59 | Moins d'une nuit tropicale tous les deux ans en 2050. La hausse existe pour 92 d'entre elles, mais elle est négligeable |
| `ATR_yr < 1` | **239** | Hausse inférieure à une nuit par an. Le palier « moins d'un » existe déjà (`formatCompte`, accueil). Le prototype FUT-50 y écrit « resteraient à peu près au niveau de 1976-2005 » |
| `NORTR_yr < 1` et `NORTX35D_yr < 1` | 234 | Le prototype FUT-50 y écrit « Les fortes chaleurs resteraient exceptionnelles ici, même en 2050 » |
| `ATR_yr ≥ 1` | 34 634 | L'indicateur progresse : la phrase y est vraie sur le fond, mais toujours écrite sans lire la donnée |

**Exemples vérifiés** (projeté à 2050, référence reconstruite) :
- Barcelonnette : 0,2 (réf. 0,0) ;
- Briançon : 0,2 (0,0) ;
- Allos : 0,1 (0,0) ;
- Jausiers : 0 (0,0), et seulement 0,1 en 2100 ;
- La Rochelle : 23,4 (5,1) ;
- Nîmes : 69,1 (33,0).

**Conclusions autorisées.**
- « La phrase est fausse sur 151 communes » **ne tient pas**. Sur 92 d'entre elles, l'indicateur progresse, faiblement.
- Ce qui tient :
  - la phrase est affichée sans lecture de la donnée ;
  - elle est **contredite** par l'indicateur du produit sur **59** communes ;
  - elle décrit une hausse **inférieure à une nuit par an** sur **239** communes (dont les 59), où le produit lui-même écrirait « à peu près au niveau de 1976-2005 ».
- « Nuits chaudes » n'est pas défini dans la phrase. Une lecture large (des nuits plus douces en moyenne) n'est pas vérifiable avec ce qui est affiché.
- **Gravité : faible.** Portée limitée (environ 0,7 % des communes, surtout de haute montagne), formulation prudente. Le défaut de principe (invariant 3, « rien n'est affirmé sans source ») justifie quand même un correctif rapide.

L'outre-mer est hors de cette mesure : ses lignes DRIAS ne sont pas fiables tant que FUT-104 n'est pas fusionné (§D.5).

### D.3 I2 — deux lectures chaleur, deux conventions non déclarées

- **Moteur, question de niveau :** jours > 35 °C ≥ 8, ou nuits tropicales ≥ 25 (valeurs **projetées** 2050, seuil déclaré). Seuil ambiant : 10 jours ou 39 nuits.
- **Synthèse IA du Logement, question d'évolution :** écart à 1976-2005 ≥ 20, sur les nuits tropicales ou les jours > **30 °C** (« marquee » seulement ; « notable », de 8 à 20, est calculé puis réduit au silence).

| | Moteur signale (seuil déclaré) | Moteur ne signale pas |
|---|---|---|
| **Synthèse « marquee »** | 4 757 | 523 |
| **Synthèse muette** | 778 | 28 948 |

**Lecture révisée.** Les deux classifications ne répondent **pas** à la même question, et c'est légitime. Le problème est ailleurs :
1. aucune des deux ne déclare sa question au lecteur ;
2. la seconde vit dans `drias-json.ts`, hors du contrat climatique du moteur, avec un indicateur (> 30 °C) que le dossier ne lit pas ;
3. rien ne garantit qu'une phrase d'évolution ne se lise pas comme un écart que le moteur n'a pas établi.

La v1 recommandait de « remplacer le signal de la synthèse par celui du moteur ». **Cette recommandation est retirée** : voir §G.2.

### D.4 I1 — transports contre chaleur

La note `faible_chaleur` vaut 100 moins le percentile moyen de quatre indicateurs de chaleur. La règle déclenche à ≤ 40.

Sur 34 788 communes, le compromis peut se produire pour **4 932** :
- **2 796** (12,1 millions d'habitants) sont **sous** le seuil de la règle chaleur. Le dossier dit à la fois « sous le seuil de signalement », silencieusement, et « moins bien satisfaite ici », en carte ;
- **2 136** sont au-dessus : le lecteur y lit **deux** cartes chaleur.

Ce n'est pas une contre-vérité (« moins bien » est relatif), mais une convention double sur un même critère. À traiter dans FUT-17 ou par D7.

### D.5 Dépendance connue : FUT-104 (outre-mer)

Les lignes DRIAS des codes 97x dans `public/data_climat.json` portent des valeurs de type métropole (Les Abymes : 2,5 nuits tropicales en 2050). Le correctif existe sur `hotfix/fut104-exposition-donnees-outremer` et `feat/fut-50-socleom-integration` (SocleOM), mais **n'est pas sur `main`** au 16/10. Le pilote exclut l'outre-mer jusqu'à la fusion.

### D.6 Fiche de transmission S1

| Rubrique | Contenu |
|---|---|
| **Comportement incorrect** | Pour une préférence confirmée comme condition (FUT-7), la carte affiche « Ouverte · plutôt défavorable » et « Ce que l'on sait penche contre cette condition » dès qu'un constat de proximité est réuni, même quand le rang communal est favorable. Le constat affiché remplace le rang (l'alignement est absorbé). `whyNotDecided` annonce une lecture communale pour un constat à l'adresse. |
| **Cause établie** | `condition-rules.ts:38` (`DEFAVORABLES` contient `verification`) et `:51` (`signalDe`) ; `:162` (`POURQUOI_PREFERENCE` quel que soit le grain). Le rôle `verification` sert à deux choses que le code confond : « il y a quelque chose à contrôler » et « cela penche contre la priorité ». |
| **Portée et gravité** | **Élevée.** Dossiers **adresse** dont l'une des trois priorités `acces_soins`, `acces_transports` ou `faible_dependance_auto` est **confirmée** comme condition, et où la proximité a été évaluée. Pour les soins et la gare, cela couvre aussi « aucun dans le périmètre », un constat borné qui n'oriente pas non plus le critère. Carte en tête de dossier, sens inversé, sur une condition posée par le lecteur. Les cinq autres règles (inondation, pluies, air, bruit, industrie) orientent bien le critère et ne sont pas en cause. |
| **Reproduction minimale** | Projet `acces_soins` au poids 3, confirmé (`buildConfirmation`). Commune avec `rankBands.acces_soins = [8500, 9000]`. Snapshot Autour avec un médecin à 553 m. Puis `runRules` → carte `condition_check`. Code de la sonde en §K.1. |
| **Comportement correct attendu** | Une vérification à effectuer n'est **ni** un résultat défavorable **ni** un résultat favorable automatique. La carte garde **séparément** : (1) les faits qui **orientent** le critère (issues de rang, expositions notables) et fondent le signal ; (2) les faits qui **appellent une confirmation** (présences, absences dans un périmètre, nuances de secteur), affichés comme constats à contrôler avec leur geste, sans effet sur le signal. Sur l'exemple : « Ouverte · plutôt favorable », le rang communal reste le constat principal, le médecin à 550 m apparaît comme constat à l'adresse avec son geste, et `whyNotDecided` nomme les deux grains. |
| **Piste** (à arbitrer dans le ticket) | Chaque règle déclare si son `verification` oriente le critère : un champ du fait, ou une table explicite dans `condition-rules.ts`. Par défaut : **n'oriente pas**. Les cinq règles d'exposition déclarent « défavorable ». |
| **Tests nécessaires** | Assertions sur le **statut** et le **texte**, pas seulement la présence : (a) les trois règles de proximité, chacune en présence et en absence, sur un rang favorable, neutre puis défavorable ; (b) une règle d'exposition (bruit) reste défavorable ; (c) `whyNotDecided` dit le grain réel ; (d) l'action du constat de proximité survit dans la carte ; (e) non-régression de `fut7-conditions.test.ts` et `fut90-conditions-climat.test.ts` ; (f) artefact sérialisé. |
| **Fichiers concernés** | `src/lib/decision/condition-rules.ts` ; selon la piste, `decision-fact.ts` (champ sur `VerificationFact`), `autour-rules.ts`, `secteur-rules.ts`, `materiality-rules.ts` ; tests `fut7-conditions.test.ts` et un test dédié. |
| **Dépendances FUT-50** | **Aucune** : aucun de ces fichiers n'est modifié par `feat/fut-50-accueil-decision` ni `feat/fut-50-socleom-integration` (diff vérifié le 16/10). |
| **Ticket** | Aucun ticket existant ne couvre précisément ce défaut. FUT-90 traitait l'absorption des faits climat par les conditions, un autre mécanisme ; FUT-21 traite l'incertitude actionnable en général. **Ticket distinct proposé** (non créé) : « Conditions confirmées : un constat de proximité n'oriente pas le signal ». À vérifier dans Linear qu'aucun ticket récent ne le couvre. |

### D.7 Fiche de transmission S2

| Rubrique | Contenu |
|---|---|
| **Comportement incorrect** | Le bloc « Dans le climat futur » du module Logement affirme « Avec la progression des nuits chaudes à {commune}… » pour toute adresse, sans lire la donnée climatique. |
| **Cause établie** | `ThermalComfortSection.tsx:67-73` construit la phrase avec le seul nom de la commune ; rendu inconditionnel en `:157` ; monté par `LogementModule.tsx:590`. |
| **Portée et gravité** | **Faible.** Toutes les adresses reçoivent une affirmation sans source. Elle est contredite par l'indicateur de nuits tropicales sur **59** communes ; elle décrit une hausse de moins d'une nuit par an sur **239** communes (dont les 59) ; elle est vraie sur le fond ailleurs (§D.2). |
| **Reproduction minimale** | Ouvrir `/rapport/logement` sur une adresse de Briançon (05023) ou de Jausiers (04096) : la phrase s'affiche. Données : `NORTR_yr` 2050 = 0,2 et 0, référence reconstruite 0,0. |
| **Comportement correct attendu** | Le bloc lit les **faits canoniques** de la commune (§G.3). Faits illisibles ou absents (y compris l'outre-mer avant FUT-104) : aucune phrase climatique. Écart à 1976-2005 de moins d'une nuit par an : pas de « progression ». Le palier « moins d'un » existe déjà ; aligner la tournure sur celle de FUT-50 quand elle sera fusionnée. Sinon : une phrase qui cite le fait (« de 5 à 23 nuits par an ») plutôt qu'une « progression » non chiffrée. Le pilote FUT-20 reprendra ensuite ce bloc. |
| **Tests nécessaires** | Texte rendu pour quatre cas réels : Jausiers (écart nul), Briançon (écart inférieur à 1), La Rochelle (sous le seuil, hausse nette), Nîmes (au-dessus du seuil). Plus un cas sans donnée. On vérifie que le mot « progression » n'apparaît pas quand l'écart est inférieur à 1. |
| **Fichiers concernés** | `src/components/report/ThermalComfortSection.tsx`, `src/components/report/LogementModule.tsx` (transmettre les faits) ; la page `src/app/(account)/rapport/logement/page.tsx` charge déjà le climat (`deriveClimatProjete`) et devra lire les faits canoniques. **Sans modifier `drias-json.ts`.** |
| **Dépendances FUT-50** | Pas de fichier commun (diff vérifié). En revanche, la **tournure** sous le seuil et le palier « moins d'un » sont ceux du prototype FUT-50, non fusionné : se coordonner pour qu'accueil et Logement disent la même chose. FUT-50 modifie `drias-json.ts` : le correctif ne doit pas en dépendre. |
| **Ticket** | Aucun ticket identifié dans le dépôt. Proposition : l'inclure dans le ticket de correctif S1, ou dans FUT-17. **Ne pas** attendre FUT-20. |

## E. La feuille de route des compositions

### E.1 Les quatre catégories

1. **Réalisable maintenant** : les données et les preuves nécessaires sont dans le dépôt.
2. **Candidat conditionnel** : un ticket existant **étudie** une source susceptible de le rendre possible. L'existence du ticket **n'est pas** une donnée disponible ni une intégration décidée.
3. **Dépendant d'une observation** : aucune source publique ne conclut seule ; une vérification humaine, ou une observation du lecteur **avec provenance**, enrichit la décision sans jamais devenir une donnée sourcée (rapport Data Curator du 21/08).
4. **Insuffisamment fondé** : aucune chaîne de preuves crédible.

Une composition peut relever de plusieurs catégories, selon ses couches.

### E.2 La matrice

*« À vérifier » signifie que la description du ticket n'a pas pu être lue (connecteur Linear non authentifié).*

| # | Composition | Réalisable aujourd'hui | Données manquantes | Ticket(s) | Ce que ces données permettraient | Inconnues persistantes | Priorité |
|---|---|---|---|---|---|---|---|
| 1 | **Chaleur future × confort d'été du logement × projet** | **Oui, au-dessus du seuil** : DRIAS commune, diagnostic (niveau, indicateur, caractéristiques, date), poids, intention. Sous le seuil : D2 ouvert | Étage, orientation, protections non renseignées (pas de donnée publique fiable) ; diagnostic absent pour 75 à 86 % des adresses | FUT-20 ; FUT-103 (sous le seuil, à vérifier) ; FUT-80 (hauteur, étages du bâtiment, à vérifier) | FUT-80 : savoir si le logement peut être sous la toiture (nombre de niveaux), sans en connaître l'étage. FUT-103 : la règle sous le seuil | Température vécue, usage des volets et des fenêtres, étage exact | **Pilote** |
| 2 | **Littoral × adresse** | **Oui, en vérification** : liste des communes concernées par le recul du trait de côte (371, avec décret) ; recul observé Cerema (commune) ; plan de prévention au point (libellé, dont plans littoraux) ; distance au rivage (FUT-33) | Zones d'exposition au recul à 30 et 100 ans à la parcelle ; zonage de submersion à l'adresse hors plan de prévention | FUT-81 (zonage parcellaire, à vérifier) ; études littorales citées par FUT-20 (non retrouvées dans le dépôt, à vérifier) | Établir à l'adresse si la parcelle est dans une zone délimitée par la commune, quand ces zones sont publiées et lisibles | Évolution future du trait de côte au bâtiment ; vulnérabilité du bâti à la submersion ; dates d'application locales | **Haute** |
| 3 | **Argiles × caractéristiques du bâtiment et de la copropriété** | **Partiellement** : aléa à la parcelle, plan sécheresse, sinistres sécheresse (commune), intention ; type et année du bâtiment **quand un diagnostic est attribué** | Identité du bâtiment hors diagnostic ; statut et documents de copropriété | FUT-80 (RNB, BDNB, à vérifier) ; FUT-83 (RNIC, à vérifier) | **Adapter les questions** : maison, ou immeuble en copropriété (syndic, assemblées, travaux votés) ; année de construction pour situer les règles de construction applicables | État des fondations et de la structure, fissures, sinistres du bien, qualité du sol sous ce bâtiment | **Haute** |
| 4 | **Mobilité × trajet personnel** | **Partiellement** : gare la plus proche (BPE) ; trajet voiture et marche vers un lieu déclaré (IGN) ; pratiques des actifs (MOBPRO, hors moteur) | Itinéraire en transports collectifs, fréquences, horaires ; destination et mode déclarés par le ménage ; fiabilité des estimations IGN | FUT-47 ; FUT-98 ; FUT-89 (à vérifier) | Passer de « une gare existe » à « ce trajet déclaré, dans ce mode, à cette heure, est faisable en N minutes environ, selon les horaires théoriques » | Ponctualité, confort, correspondances vécues, variabilité, coûts | **Haute** |
| 5 | **Services × besoin déclaré du foyer** | **Partiellement** : médecin et pharmacie à l'adresse (n° 8) ; écoles maternelles et élémentaires dans la BPE | Collèges et lycées dans les fichiers BPE ; besoin réellement déclaré (enfant à scolariser, médecin traitant à trouver) | FUT-24 ; FUT-89 ; FUT-47 (accès) (à vérifier) | Ne relier un équipement qu'à un **besoin déclaré**, avec la distance ou le trajet, et la vérification qui le tranche | Sectorisation scolaire, places disponibles, acceptation de nouveaux patients, qualité | Moyenne |
| 6 | **Urbanisme et permis × voisinage × projet** | **Partiellement** : permis enregistrés créant des logements (Sitadel, rayon, date) | Règle d'urbanisme applicable aux parcelles voisines (zonage, prescriptions, hauteurs) | FUT-81 (à vérifier) | Distinguer quatre faits : **permis enregistré** ; **règle applicable** ; **possibilité théorique** de construire ; **effets** d'un chantier (inconnus) | Réalisation et calendrier d'un projet ; volume ; nuisances ; effets sur la vue ou l'ensoleillement | Moyenne |
| 7 | **Chaleur × bruit × aération nocturne** | **Non** : distance aux grandes infrastructures (OSM, adresse) et bruit communal (depuis le centre de la commune) ne mesurent pas le bruit en façade | Niveaux de bruit réglementaires modélisés (cartes stratégiques, plans d'exposition au bruit des aérodromes) | FUT-82 (à vérifier) ; FUT-21 (à vérifier) | Établir qu'un bâtiment est dans une zone où le bruit nocturne **modélisé** dépasse un niveau réglementaire, et le relier à un logement dont l'aération nocturne est le levier d'été | Bruit dans la chambre fenêtres ouvertes, côté des chambres, tolérance, autres sources de bruit | Moyenne |
| 8 | **Îlot de chaleur du quartier × logement** (v2 du pilote) | **Oui** sur 596 communes denses (CSTB, grand-IRIS) | Couverture rurale nulle | — | Un côté « quartier » dans la carte du pilote | Température de nuit à la façade, ombre portée | Moyenne |

**Insuffisamment fondé** : six formulations restent exclues **quelle que soit la source à venir** (§E.3).

### E.3 Les candidats, challengés

Chaque fiche sépare ce que la donnée **établit**, ce que seule une **observation** établit, ce que leur **combinaison** permet, et ce qui reste **impossible à conclure**.

#### 1. Chaleur future × confort d'été du logement : voir §F (pilote) et §G (doctrine sous le seuil).

#### 2. Littoral × adresse

- **Trois phénomènes, jamais confondus :**
  - l'**érosion côtière** est le processus ;
  - le **recul du trait de côte** en est la manifestation durable, observée par le Cerema sur une période historique et ciblée par la liste des communes concernées ;
  - la **submersion marine** est une inondation temporaire par la mer (tempête, surcote), portée par les plans de prévention littoraux et les cartographies d'aléa.

  Un même bien peut être concerné par l'un sans l'autre.
- **Ce que la donnée établit aujourd'hui :**
  - la commune est inscrite sur la liste (commune, officiel) ;
  - le recul observé de la commune (Cerema) ;
  - un plan de prévention s'applique **au point**, avec son libellé ;
  - la distance de l'adresse au rivage (une mesure, pas une exposition).
- **Ce que FUT-81 pourrait établir :** si la commune a délimité ses zones d'exposition au recul dans son document d'urbanisme, et si ces zones sont publiées sous une forme lisible à la parcelle, l'appartenance de la parcelle à une zone. À vérifier : contenu du ticket, forme de publication, couverture.
- **Ce que seule une vérification établit :** l'état des risques remis à l'acheteur ou au locataire, le règlement local, l'historique du bien. **À confirmer juridiquement** avant toute rédaction : ce que l'état des risques doit mentionner sur le recul du trait de côte.
- **Impossible à conclure :** un risque au bâtiment depuis la seule distance au rivage, une date de recul, une vulnérabilité à la submersion.
- **Restitution :** une **vérification** tant que les zones ne sont pas établies à l'adresse. Aucun seuil de distance en v1 : on n'en invente pas.

#### 3. Argiles × caractéristiques du bâtiment et de la copropriété

**La v1 est corrigée ici.** Elle laissait entendre qu'un appartement en étage était « beaucoup moins » concerné. C'est faux pour un acheteur : les fondations et la structure d'un immeuble sont des **parties communes**, et leurs désordres concernent l'ensemble des copropriétaires (décisions d'assemblée, travaux, quote-part). Le type de logement **ne réduit pas** le risque ; il **change les questions à poser**.

Quatre objets séparés :
1. **L'exposition du terrain** (établie) : aléa retrait-gonflement à la parcelle (BRGM via Géorisques), plan de prévention sécheresse au point, sinistres sécheresse indemnisés dans la commune (ONRN).
2. **La vulnérabilité du bâtiment** (**jamais déduite**) : elle dépend des fondations, de la structure, de la végétation proche, des écoulements d'eau, des travaux passés. Aucune source publique ne la donne bâtiment par bâtiment. Les données de bâtiment (FUT-80 : identité, année, hauteur, nombre de logements ; à vérifier) aident à **situer** le bien, jamais à le **noter**. Les statistiques de sinistralité qui concernent surtout l'habitat individuel décrivent une population de bâtiments, pas ce bâtiment : elles ne s'appliquent pas en retour à un bien.
3. **Les conséquences potentielles :**
   - pour un propriétaire occupant : désordres, travaux, démarches d'assurance après reconnaissance de catastrophe naturelle ;
   - pour un copropriétaire : travaux sur parties communes votés en assemblée et répartis selon les tantièmes ;
   - pour un locataire : la question porte sur l'état du logement et sa prise en charge par le bailleur.

   Ce sont des **possibilités**, à formuler comme telles, jamais comme un pronostic.
4. **Ce qu'il faut demander**, selon le bâtiment et l'intention :
   - **maison** : historique des fissures et des sinistres déclarés, travaux de reprise, études de sol existantes ;
   - **appartement en copropriété** : documents de copropriété remis à l'acheteur (procès-verbaux d'assemblée, carnet d'entretien, plan de travaux s'il existe ; liste exacte **à confirmer juridiquement**), sinistres déclarés par le syndic, travaux votés ou envisagés sur la structure et les façades ;
   - **location** : signes visibles et prise en charge par le bailleur (`GESTES.bati`).

   Les données de copropriété (FUT-83 : immatriculation, syndic, nombre de lots ; à vérifier) peuvent dire **à qui** s'adresser et **qu'**une copropriété existe. Elles ne disent rien des fissures.

- **Abstention :** aléa faible ou absent → rien. Bâtiment inconnu → la vérification demande « maison individuelle ou immeuble en copropriété ? » et propose les deux listes.
- **Impossible à conclure :** un niveau de risque du bien, un « ce bien risque des fissures », un « en étage, vous êtes peu concerné ».

#### 4. Mobilité × trajet personnel

Cinq niveaux, qui ne se valent pas :

| Niveau | Aujourd'hui | Après FUT-47 / FUT-98 (à vérifier) | Ce qu'il **ne** dit **pas** |
|---|---|---|---|
| Proximité d'une gare | BPE, distance à vol d'oiseau (`autour.gare`) | Inchangé | Desserte, destinations, horaires |
| Itinéraire calculé | IGN, voiture et marche, depuis l'adresse | Fiabilité qualifiée (FUT-98 : un contournement peut être retenu) | Trafic, stationnement, variabilité |
| Disponibilité d'un mode | Non | Transports collectifs, si un routage avec horaires est retenu (non décidé) | Confort, sécurité |
| Fréquence et horaires | Non (l'étude La Rochelle a lu un GTFS hors produit) | Fréquences théoriques (GTFS) | Ponctualité |
| Compatibilité avec la contrainte du ménage | Seulement « près d'un lieu » en voiture ou à pied | Destination, mode et horaire déclarés (FUT-47, FUT-89) | Le vécu |

- **Ce que la combinaison permettra**, avec la proposition de l'étude La Rochelle (§5) : pour une destination déclarée, le temps estimé (qualifié par FUT-98), ce que font les actifs du même trajet (MOBPRO : une association, pas une cause), et **l'inconnue nommée** (itinéraire, horaires, confort non vérifiés), avec quoi regarder.
- **Impossible à conclure tant qu'aucun routage horaire n'existe :** « ce trajet se fait en train ». Le produit ne le promet pas.
- **Statut :** candidat conditionnel, haute priorité : c'est la question quotidienne la plus fréquente d'un ménage qui déménage.

#### 5. Services × besoin déclaré du foyer

- **Principe :** une composition ne part que d'un **besoin déclaré** (FUT-89, à vérifier), jamais d'un profil supposé (« famille avec enfants » déduit d'une surface ou d'un nombre de pièces).
- **Données :**
  - aujourd'hui, médecin et pharmacie à l'adresse, écoles maternelles et élémentaires ;
  - FUT-24 (à vérifier) ajouterait collèges et lycées ;
  - FUT-47 donnerait le trajet.
- **Ce que la combinaison permet :** « Vous avez indiqué un enfant à scolariser au collège : le collège le plus proche est à 1,2 km ; le collège de secteur, lui, dépend de la sectorisation, à vérifier. » La sectorisation n'est pas une donnée du dépôt ; sa disponibilité nationale est à vérifier.
- **Toujours à vérifier :** places, sectorisation, acceptation de nouveaux patients (déjà dit par la règle soins).

#### 6. Urbanisme et permis × voisinage × projet

Quatre faits, jamais fondus :
1. **Un permis enregistré** (Sitadel, aujourd'hui) : il prouve une autorisation créant des logements. **Ni** le commencement du chantier, **ni** son volume ou sa nature hors de ce que le registre porte, **ni** ses nuisances.
2. **Une règle d'urbanisme applicable** (FUT-81 : zonage, prescriptions ; à vérifier) : ce que la règle permet sur une parcelle.
3. **Une possibilité théorique de construire**, déduite de 2 : elle ne dit pas que quelqu'un construira.
4. **Les effets réels d'un chantier futur** : inconnus de toute source.

- **Composition admissible** : « Un permis a été accordé à 40 m ; la parcelle voisine est en zone urbaine, où la règle permet de construire jusqu'à N niveaux », suivi de « consultez le dossier de permis en mairie » ou « lisez le règlement de la zone ».
- **Rôle du projet :** l'intention choisit le geste. Le rattachement à `cadre_calme` reste écarté pour la raison donnée dans `permis-rules.ts:10` ; ne pas inventer de priorité « vue » ou « ensoleillement de l'immeuble » que le projet ne porte pas.
- **Impossible :** prédire l'impact d'un projet voisin.

#### 7. Chaleur × bruit × aération nocturne

| Couche | Ce qu'elle établit | Source |
|---|---|---|
| **Données réglementaires** (FUT-82, à vérifier) | Le bruit **modélisé** des grandes infrastructures et des agglomérations de plus de 100 000 habitants, en indicateurs jour-soir-nuit et nuit, à hauteur conventionnelle en façade. Autour des aérodromes, les zones des plans d'exposition au bruit. Une exposition de la **zone** du bâtiment, pas de la chambre | Cartes de bruit stratégiques, plans d'exposition au bruit. Diffusion fragmentée (environ 100 jeux, aucun agrégat national ; `cadrage-sources-par-echelle.md`, Pile B) |
| **Visite ou mesure** | Le côté où donnent les chambres, le bruit perçu fenêtres ouvertes à l'heure du coucher, les autres sources (voisinage, commerces), la possibilité d'aérer sans bruit | Le lecteur, avec provenance (FUT-21, à vérifier) |
| **Combinaison** | Quand la chaleur est signalée, que le logement repose sur l'aération (diagnostic : non traversant ou ventilation par ouverture des fenêtres) **et** que la zone dépasse un niveau réglementaire nocturne : une vérification ciblée, « vérifiez de quel côté donnent les chambres et si l'on peut y dormir fenêtres ouvertes ». Une observation du lecteur peut ensuite l'éclairer, sans devenir une donnée sourcée | — |
| **Impossible** | « Vous ne pourrez pas ouvrir la nuit », « le bruit vous gênera », une température intérieure | — |

- Le niveau réglementaire retenu, et le choix de lier ou non ce constat à `calme_sonore`, seraient des **décisions** à poser et à afficher, pas des déductions.
- **Statut :** dépend d'une observation, et conditionnel à FUT-82. Priorité moyenne : le levier d'adaptation est réel, mais la donnée est un chantier lourd.

#### 8. Îlot de chaleur du quartier

L'îlot de chaleur est surtout marqué la nuit. Son intensité (CSTB) est une **modélisation de l'air du quartier**, déjà affichée avec cette limite (`IcuExposure.tsx`). Côté « quartier » de la carte du pilote, sur les seules communes couvertes. Il ne dit **rien** de l'intérieur du logement, et un espace vert ne le **compense** pas (`logement-autour-chaleur.ts`).

### E.4 Les formulations exclues, quelle que soit la source

Ces six formulations sont **insuffisamment fondées**. Aucun des tickets cités n'apporte la mesure qui les fonderait :
1. une **température intérieure**, ou un vécu, déduit d'un diagnostic et d'une projection ;
2. un **bruit dans la chambre**, déduit d'une carte de bruit ou d'une distance ;
3. la **faisabilité d'un trajet en transport collectif**, déduite d'une gare proche ;
4. les **nuisances d'un chantier**, déduites d'un permis ou d'un zonage ;
5. la **vulnérabilité d'un bâtiment**, déduite de son type ou de son étage ;
6. un **recul du trait de côte au bâtiment**, déduit de la distance au rivage.

## F. Spécification initiale du pilote FUT-20

### F.1 La question

> « Les étés deviennent plus durs ici. Ce logement-là m'aidera-t-il à les supporter, et que dois-je vérifier avant de m'engager ? »

### F.2 Les champs nécessaires (tous existants)

| Échelle | Champ | Source dans le code | Grain |
|---|---|---|---|
| Territoire | Faits canoniques chaleur (§G.3) : projeté, référence, écart, palier, unité | `buildClimatFacts`, `reconstructReference` (`climat-facts.ts`) | commune |
| Territoire | Classification « niveau » déclarée ou ambiante | `classifyClimateComfort(c, exigence)` (`climat-facts.ts:294`) | commune |
| Territoire | Issues de `territoire.climat-chaleur` et `territoire.verification-chaleur-future` | `materiality-rules.ts:330`, `:387` | commune |
| Logement | Niveau de preuve (A logement / B1 bâtiment / C aucun), indicateur, caractéristiques, mention « immeuble » | `deriveThermalEvidence(savedDpe)` (`thermal-evidence.ts:94`) | adresse |
| Logement | Date du diagnostic | `DpeRecord.date_dpe` | — |
| Projet | Poids `faible_chaleur`, condition confirmée, intention et relation au lieu | `preferenceWeight`, `isConfirmed`, `bucketDuProjet` | — |

**Pas utilisés en v1 :** l'étage et la position sous la toiture (champs morts, audit du 03/07), l'orientation, l'îlot de chaleur (v2), le bruit, la synthèse IA.

### F.3 Le chemin de données

```
assembleAddressDossier(savedDpe)                              assemble-address-dossier.ts
  → buildLogementFacts(data, savedDpe)                         logement-facts.ts
      aujourd'hui : confortEteInsuffisant: boolean     ← un seuil figé déguisé en donnée (AGENTS.md)
      demain      : confortEte: ConfortEteFait (§F.8)
  → runRules : climat-chaleur | verification-chaleur-future | logement.confort-ete
  → conditionsDePreference (si faible_chaleur est confirmée ; après S1)   condition-rules.ts
  → composeFacts : climate_comfort / seasonal_climate_tradeoff / (nouveau) ambient_heat_housing
                    lisent logement.confortEte et absorbent logement.confort-ete s'il est émis
  → assembleDossier → DossierDecisionSection / FactCompositionCard ; artefact ; conclusion-plan
Module Logement : ThermalComfortSection « Dans le climat futur » → lit les faits canoniques (S2, §G.3)
Synthèse IA     : climat_projete → classification « évolution » déclarée, sur les faits canoniques (§G.2)
```

### F.4 Les règles de déduction admissibles

1. **Le climat ne change pas le diagnostic, il en change le poids.** On écrit « le diagnostic classe ce logement… », jamais « ce logement sera chaud en 2050 ».
2. **Aucune température intérieure, aucun vécu.** L'indicateur du diagnostic est réglementaire et conventionnel.
3. **Le logement ne corrige pas la commune.** Un « bon » confort d'été n'efface pas l'écart territorial ; un « insuffisant » ne crée pas d'écart. L'issue de la règle chaleur est inchangée ; la composition **ajoute** un côté.
4. **Le niveau de preuve gouverne ce qu'on dit du logement :**
   - **A (logement)** : l'indicateur et ses caractéristiques, avec la date ;
   - **B1 (bâtiment)** : seulement les caractéristiques du bâtiment ;
   - **C (aucun)** : une vérification seulement.
5. **Une caractéristique non renseignée n'est pas absente.**
6. **La matérialité est héritée, jamais aggravée.**
7. **Le seuil et la convention affichés sont ceux qui ont déclenché la carte**, par `seuilApplicable` (leçon du 25/07).
8. **Le geste cible la caractéristique décisive non renseignée**, formulée selon l'intention (`GESTES.confort[bucket]`).

### F.5 Les cas d'information insuffisante

| Situation | Composition | Ce qui s'affiche |
|---|---|---|
| Climat illisible (`c == null`, ou un axe manquant → `uncertain`) | **Aucune** | La carte confort d'été du logement reste seule, sans mot sur le climat |
| Écart à 1976-2005 de moins d'une nuit et d'un jour par an (palier « moins d'un ») | **Aucune** | Idem. Jamais « progression » |
| Chaleur **sous le seuil**, mais trajectoire nette (La Rochelle) | **D2 ouvert** (§G.1) | En v1 : la carte logement seule, sans phrase climatique non fondée |
| `faible_chaleur` au poids 1 | **Aucune** (comme aujourd'hui) | La carte logement seule |
| `faible_chaleur` confirmée comme condition | La carte condition reçoit le côté logement et le geste (D4), après S1 | — |
| Outre-mer, tant que FUT-104 n'est pas fusionné | **Aucune** | — |
| Diagnostic B1 ou C | Composition **avec un côté « vérification »** | §F.6, cas 2 |
| Pas d'adresse | Composition actuelle inchangée | — |

### F.6 Trois restitutions représentatives

> **Statut des exemples.** Les chiffres climatiques sont les **vraies** valeurs DRIAS du dépôt. Les logements sont les **fixtures FUT-87** (`src/components/prototypes/fut87/fixture-logement.ts`) : adresses fictives, valeurs énergétiques d'un diagnostic public détaché de son adresse. **Aucun exemple n'est le résultat réel d'un logement.** Les textes « proposés » sont des brouillons à soumettre à l'Editorial Writer.

**Cas 1 — La composition apporte une information utile.**
Nîmes (30189). DRIAS 2050 : jours > 35 °C de 3 à 14 ; nuits tropicales de 33 à 69. Logement : fixture « témoin », maison de 1958, diagnostic du 18/03/2024, niveau A, indicateur **insuffisant**, non traversant, inertie légère, ventilation par ouverture des fenêtres, protections solaires non renseignées. Projet : `faible_chaleur` au poids 3, intention achat.

*Aujourd'hui (sonde)* : deux cartes, deux gestes.
```
[mismatches]    Des étés plus difficiles à concilier avec votre projet
                … nuits tropicales, elles, passeraient de 33 à 69 par an …
                action: Regardez comment le logement tient l'été
[verifications] (Confort d'été insuffisant) Le diagnostic classe l'indicateur réglementaire de confort d'été de ce logement comme insuffisant.
                action: Demandez comment le logement se comporte en forte chaleur
```

*Proposé* : une carte.
> **Des étés plus chauds, dans un logement qui garde mal la fraîcheur**
> *À l'échelle de la commune* : les nuits tropicales passeraient de 33 par an sur la période de référence 1976-2005 à 69 à l'horizon 2050, et les jours au-dessus de 35 °C de 3 à 14.
> *À cette adresse, d'après le diagnostic de 2024* : ce logement classe son confort d'été comme insuffisant. Il n'est pas traversant et ses murs ont une inertie légère. Ses protections solaires ne sont pas renseignées.
> *À demander avant de vous engager* : quelles protections solaires existent (volets, stores), et si les chambres peuvent être aérées la nuit.
> *Limite* : l'indicateur décrit le bâti dans des conditions conventionnelles, pas la température que vous ressentirez.

**Cas 2 — Une caractéristique décisive manque et devient une vérification.**
Nîmes. Logement : fixture « immeuble », appartement de 1972, diagnostic **généré à l'immeuble** (niveau B1 : inertie lourde, VMC simple flux, murs insuffisamment isolés). Même projet.

*Proposé* :
> **Des étés plus chauds ; ce que l'on ne sait pas encore de cet appartement**
> *À l'échelle de la commune* : (même constat).
> *Ce que dit le diagnostic retrouvé* : il décrit l'immeuble, pas cet appartement. Il ne dit ni s'il est traversant, ni s'il a des protections solaires, ni s'il est sous les toits.
> *À demander* : si l'appartement est traversant et s'il est au dernier étage.

Variante C (fixture « sans-dpe ») : « Aucun diagnostic n'est rattaché à ce logement » et « Demandez le diagnostic de ce logement ». C'est le cas **le plus fréquent** (75 à 86 % des adresses).

**Cas 3 — Aucune conclusion croisée n'est admissible.**
Briançon (05023). DRIAS 2050 : 0,2 nuit tropicale (référence 0,0), 0 jour > 35 °C. Logement : fixture « témoin » (insuffisant). `faible_chaleur` au poids 3.

*Proposé* : **aucune composition.** La règle chaleur rend `satisfied`, et l'écart à 1976-2005 reste sous une nuit par an. La carte « Confort d'été insuffisant » reste seule, sans un mot sur le climat. Aujourd'hui, le module Logement y affiche pourtant « Avec la progression des nuits chaudes à Briançon… » (S2).

*La Rochelle relève d'un autre cas* : 23,4 nuits pour un seuil de 25, mais une référence de 5,1. Ce n'est **pas** un cas d'abstention évident : c'est l'objet de D2 (§G.1).

### F.7 L'emplacement dans le vrai dossier

- **Dossier de décision** (`/rapport` → `DossierDecisionSection` → `FactCompositionCard`). La carte reste dans **sa section actuelle** :
  - « Ce qui correspond moins bien » pour la priorité déclarée ;
  - « Ce qui départage vraiment » pour le tradeoff ;
  - « À contrôler » pour le constat ambiant.

  La carte « Confort d'été insuffisant » est **absorbée** ; elle reste lisible au dépliable. Le sujet du héros ne change pas. L'action reprise par la conclusion devient l'action ciblée.
- **Module Logement** (`ThermalComfortSection`) : le bloc « Dans le climat futur » lit les faits canoniques (S2).
- **Aucun nouvel écran, aucun nouveau module, aucun score.**

### F.8 Contrat de données et tests proposés

**Contrat Logement**, une proposition :

```ts
// Dans LogementFacts : la SOURCE, pas un booléen précalculé.
type ConfortEteFait = {
  niveau: "logement" | "batiment" | "aucun";           // A / B1 / C de deriveThermalEvidence
  indicateur: "bon" | "moyen" | "insuffisant" | null;  // non nul SEULEMENT si niveau = "logement"
  caracteristiques: { cle: "traversant" | "protection" | "inertie" | "ventilation" | "brasseur";
                      libelle: string; sens: "favorable" | "defavorable" | "neutre" }[];
  nonRenseignees: ("traversant" | "protection")[];     // ce que le diagnostic ne dit pas (≠ absent)
  dateDiagnostic: string | null;
};

// Dans les compositions : UN côté de plus, réutilisant la brique existante.
logement?: CompositionSide;      // grain adresse ; absent = rien à dire du logement
// GroupedVerificationComposition : patternId étendu à "ambient_heat_housing".
// absorbedFactIds inclut `${insee}:logement-confort-ete` quand ce fait a été émis.
```

**Contrat climatique commun** : voir §G.3. Le pilote le consomme, il ne le redéfinit pas.

**Tests**, en suivant la règle « la carte apparaît » ≠ « la carte dit vrai » :
1. **Contrat** `ConfortEteFait` : fixtures A-bon, A-moyen, A-insuffisant, B1 immeuble, B1 sans bloc, C, champs nuls.
2. **Matrice de déclenchement** :
   - climat : défavorable déclaré, défavorable ambiant, sous le seuil avec trajectoire nette, écart inférieur à 1, incertain, nul ;
   - logement : A, B1, C, sans adresse ;
   - projet : poids 0 à 3, condition confirmée.

   Composition chaleur unique par dossier.
3. **Ce que la carte dit** :
   - aucun mot de vécu ;
   - « indicateur » seulement au niveau A ;
   - « immeuble » ou « bâtiment » au niveau B1 ;
   - jamais « progression » ou « hausse » quand l'écart est inférieur à 1 ou la donnée nulle ;
   - la convention affichée est le seuil appliqué ;
   - les grains des preuves sont justes ;
   - une caractéristique non renseignée n'est jamais dite absente.
4. **Non-régression** : `assertCompositionsValid`, FUT-90, artefact, action mot pour mot, minute.
5. **Bout en bout, vraies données climat** : Nîmes, Montpellier (7,6 jours, 72 nuits : déclenche par les nuits seules), La Rochelle, Briançon, Jausiers. Logements : fixtures FUT-87.
6. **Cohérence entre surfaces** : pour un même INSEE, dossier, bloc Logement et payload de la synthèse lisent les **mêmes faits** (§G.3), et aucune phrase d'évolution ne contredit la classification de niveau.

### F.9 Complexité et périmètre

| Lot | Fichiers | Effort |
|---|---|---|
| Contrat `ConfortEteFait` | `decision-fact.ts`, `logement-facts.ts` (+ test) | 0,5 j |
| Compositions | `fact-composition.ts`, `fact-compositions.ts` (+ tests) | 1,5 j |
| Rendu | `FactCompositionCard.tsx`, `lecture-dossier.ts`, éventuellement `conclusion-plan.ts` | 0,5 à 1 j |
| Lecture des faits canoniques par le module Logement | `ThermalComfortSection.tsx` (si S2 n'est pas déjà corrigé) | 0,5 j |
| Condition confirmée (D4) | `condition-rules.ts`, après S1 | 0,5 j |
| Relecture éditoriale et revue | — | 0,5 j |

**Total : 3 à 5 jours.** Le lot de la classification « évolution » de la synthèse (§G.2) est **hors** de ce périmètre : il attend la fusion de FUT-50 et la décision D3.

## G. Doctrine climatique : D2 et D3

### G.1 D2 — fait, classification, composition

**Trois objets distincts :**

| Objet | Ce qu'il est | Qui le produit | Exemple La Rochelle |
|---|---|---|---|
| **1. Le fait climatique** | Une trajectoire : valeur projetée, référence 1976-2005, écart, horizon, source | Les faits canoniques (§G.3) | Nuits tropicales : 5,1 (réf.) → 23,4 en 2050 (`gwl20`) ; jours > 35 °C : 0,3 → 2,8 |
| **2. La classification du moteur** | Une réponse à « cette priorité est-elle contredite ? », selon une convention déclarée | `classifyClimateComfort` | `under_threshold` : aucun axe n'atteint 8 jours ou 25 nuits. La règle rend `satisfied` |
| **3. La composition décisionnelle** | Une conséquence ou une vérification pour **ce** logement et **ce** projet | `composeFacts` | **À décider** |

**Principes, validés :**
- Un constat du logement ne modifie **jamais** la classification de la commune.
- Une composition ne crée **jamais**, implicitement, un écart que le moteur n'a pas reconnu.
- L'absence d'écart ne rend **pas automatiquement** une évolution climatique invisible.

**Ce que révèle la confrontation avec FUT-50 et FUT-103.**
- **FUT-50** (prototype d'accueil, non fusionné) traduit déjà `under_threshold` en **« À surveiller »**, dès qu'une mesure atteint 1 par an. Phrase : « Les fortes chaleurs progresseraient, d'abord la nuit, sans atteindre ce que futur•e signale ». Il refuse explicitement un verdict favorable à La Rochelle, au motif que « le moteur ne produit aucune issue favorable pour la chaleur ».
- **Or le dossier, lui, compte `satisfied` comme favorable.** `criteria-registry.ts` range `satisfied` en `favorable`. La sonde sur La Rochelle donne le verdict « La Rochelle semble bien correspondre à votre projet. Les critères de votre projet qui ont pu être examinés vont dans ce sens. »

  Deux surfaces traduiront donc la même classification différemment le jour où FUT-50 sera fusionné. Ce n'est pas une anomalie déployée (FUT-50 est un prototype), mais c'est un **arbitrage à prendre avant FUT-20**.
- **FUT-103** (« trajectoires de chaleur dans le dossier payant, y compris sans dépassement de seuil ») porte, d'après son titre, exactement cette question. Sa description n'a pas pu être lue : **à vérifier dans Linear**. FUT-20 ne doit pas la trancher à sa place.

**Règle candidate pour une composition sous le seuil (R-ST).** Elle est proposée, non décidée. Une composition chaleur × logement sous le seuil est admissible si et seulement si :
1. **Le projet pose la question** : `faible_chaleur` déclarée au poids 2 ou plus. Sans priorité, seul le seuil ambiant (p95) s'applique, comme aujourd'hui.
2. **La classification est lue, pas devinée** : `under_threshold` avec les deux axes lus. Jamais sur `uncertain`.
3. **La trajectoire franchit un palier déjà existant**, et ce palier est **dit** : au moins un axe atteint un écart d'une unité par an ou plus à 1976-2005, c'est-à-dire le palier « moins d'un » de l'accueil (`formatCompte`), repris par FUT-50. C'est un palier de **comptage**, pas un seuil de décision. Il ne sépare que « progresse » de « reste au niveau de 1976-2005 ».
4. **Le logement porte un fait établi à colorer** : diagnostic de niveau A, quel que soit l'indicateur, ou B1 avec des caractéristiques. Sans diagnostic (C), pas de composition sous le seuil : sinon presque toutes les communes produiraient une vérification de plus, et le dossier deviendrait bavard.
5. **Placement et poids :**
   - la carte vit **dans la section du fait logement** (« À contrôler »), en `secondary` ;
   - **jamais** dans « Ce qui correspond moins bien » ;
   - **jamais** nommée par le héros ;
   - **sans aucun effet** sur `criteria-registry`, l'orientation, le verdict ou les comptes d'écarts.
6. **Formulation :**
   - elle cite le **fait** (« de 5 à 23 nuits tropicales par an d'ici 2050 ») et dit que ce niveau reste « en deçà de ce que futur•e signale » ;
   - elle colore le logement selon la règle F.4-1, et ne dit jamais « écart », « correspond moins bien » ni « à surveiller » sans la décision de traduction ci-dessus.
7. **Tests :** une composition R-ST ne change **ni** le verdict, **ni** l'orientation, **ni** le héros, **ni** les comptes ; elle disparaît sous le palier ; elle disparaît sans diagnostic.

**Pourquoi R-ST ne crée pas de seuil caché.** Les conditions 1, 2 et 4 sont des faits (projet, classification lue, présence d'un diagnostic). La condition 3 est un palier existant, affiché au lecteur. Aucune valeur nouvelle n'entre.

**Pourquoi elle n'est pas encore robuste.** Le palier « 1 par an » laisse passer presque toutes les communes : seules 239 restent sous une nuit, et l'écart en jours compte aussi. R-ST revient donc, en pratique, à « toute adresse documentée de quiconque a déclaré la chaleur ». C'est peut-être le bon comportement, puisque le lecteur a posé la question, mais c'est un choix de produit : l'information est-elle utile partout, ou seulement là où la trajectoire est forte ? Le second choix demanderait une **convention d'intensité** (FUT-50 l'a noté : « il faut d'abord décider une convention, par exemple au moins 80 % du seuil »), donc un nouveau seuil, déclaré.

**Recommandation D2.**
- FUT-20 v1 compose **au-dessus du seuil**.
- Sous le seuil, il **n'écrit rien de faux** : la carte logement seule, et S2 corrigé.
- Le contrat de données (§G.3) est conçu pour que R-ST, ou une variante, s'ajoute **sans refonte**.
- La décision est **ouverte**. Elle doit être prise avec FUT-103 et la traduction de `under_threshold` (FUT-50 contre dossier), pas au détour du pilote.

### G.2 D3 — faits canoniques, classifications, interprétations

La v1 proposait d'unifier sur le signal du moteur. **Révision :** il faut unifier les **faits**, déclarer les **classifications**, et contraindre les **interprétations**. Ni plus, ni moins.

**A. Les faits canoniques** : une seule fabrique, partagée par le dossier, le module Logement, l'accueil et la synthèse IA.
- Même source DRIAS, mêmes colonnes (§G.3), mêmes horizons (`gwl15` / `gwl20` / `gwl30` = 2030 / 2050 / 2100 ; +2 / +2,7 / +4 °C en France).
- Même référence 1976-2005, reconstruite par `reconstructReference`.
- Mêmes règles d'arrondi et de donnée manquante : `null` n'est jamais 0 ; un axe manquant rend la lecture incertaine, jamais favorable.
- Même exclusion de l'outre-mer tant que FUT-104 n'est pas fusionné.

**Un point à trancher ici : la définition de l'écart.**
- `deriveClimatProjete` lit l'**anomalie DRIAS** au palier (La Rochelle, nuits : `ATR` = 18,1).
- FUT-50 et le moteur raisonnent sur **projeté − référence reconstruite** (23,4 − 5,1 = 18,3).
- Les deux diffèrent parce que la référence est une **médiane sur trois paliers**.

L'écart est faible, mais il peut faire basculer un palier, à 1 comme à 20. **Une seule définition** doit être retenue pour tout ce qui est affiché ou classé.

**B. Les classifications** : chacune déclare sa question, sa convention et sa version.

| Classification | Question | Convention actuelle | Où | Statut proposé |
|---|---|---|---|---|
| C1 « niveau, priorité déclarée » | Cette priorité est-elle contredite ? | Projeté 2050 : ≥ 8 jours > 35 °C **ou** ≥ 25 nuits tropicales | `classifyClimateComfort`, exigence déclarée | Canonique |
| C2 « niveau, constat non demandé » | Faut-il interrompre un parcours qui n'a rien demandé ? | ≥ 10 jours ou ≥ 39 nuits (environ p95) | `classifyClimateComfort`, exigence ambiante | Canonique |
| C3 « évolution » | La chaleur change-t-elle fortement depuis 1976-2005 ? | Écart ≥ 20 (nuits tropicales ou jours > 30 °C) = « marquee » ; de 8 à 20 = « notable », réduit au silence | `deriveClimatProjete` (`drias-json.ts`) | **Légitime, à déclarer et à rapatrier** dans le contrat climatique. Ne pas la supprimer |
| C4 « paliers de comptage » | Ce nombre est-il inférieur à un ? | « moins d'un » par an | `formatCompte` (accueil), FUT-50 | Convention d'affichage, partagée |

**Règle :** il ne doit pas exister deux classifications qui prétendent répondre à la **même** question avec des conventions incompatibles. Aujourd'hui, C1 et C3 répondent à deux questions différentes (niveau, évolution) : elles peuvent coexister. Il reste trois défauts :
1. C3 n'est déclarée nulle part au lecteur ;
2. elle vit hors du contrat ;
3. elle utilise un indicateur (jours > 30 °C) que les faits canoniques du moteur ne portent pas encore.

**À décider :** faire entrer les jours > 30 °C dans les faits canoniques (FUT-50 les affiche déjà), ou redéfinir C3 sur les axes du moteur.

**C. Les interprétations** : dossier, module Logement, accueil et synthèse IA **sélectionnent** des faits et des classifications. Elles **ne contredisent jamais** une classification, **n'en créent aucune** sans fondement déterministe, et toute phrase est **rattachable** à un fait ou à une classification nommée.

Appliqué au cas des 523 communes où C3 est « marquee » et C1 sous le seuil :
- la synthèse **peut** dire que la chaleur augmente nettement, puisque c'est C3 ;
- elle ne peut **pas** le dire de façon à se lire comme un écart à la priorité, puisque C1 ne l'établit pas ;
- et le dossier ne peut pas dire « vos critères vont dans ce sens » sans que la question de la traduction de `under_threshold` (§G.1) ait été tranchée.

**Recommandation D3.**
1. Adopter A (faits canoniques) et la règle B **maintenant**, comme contrat. Le pilote et le correctif S2 le consomment.
2. Garder C3 **sans en changer les seuils** dans cette mission. La déclarer et la rapatrier **après la fusion de FUT-50**, qui modifie `drias-json.ts`.
3. Trancher la définition de l'écart et l'entrée des jours > 30 °C dans le même lot.

D3 reste **partiellement ouvert** : le principe est validé, le calendrier dépend de FUT-50.

### G.3 Le contrat minimal de données climatiques que FUT-20 devra respecter

Une proposition, documentaire :

```ts
// Un fait par axe, produit par UNE fabrique (aujourd'hui buildClimatFacts / reconstructReference).
type TrajectoireAxe = {
  axe: "joursTresChauds" | "nuitsTropicales";        // + "joursChauds30" si D3 l'admet
  source: { jeu: "DRIAS-TRACC"; colonneProjete: string; colonneEcart: string; version: string };
  horizon: "2050";                                    // palier gwl20 ; "2030" / "2100" possibles
  projete: number | null;                             // null = non lu, jamais 0
  reference: number | null;                           // 1976-2005, reconstruite (médiane 3 paliers)
  ecart: number | null;                               // UNE définition (cf. G.2-A), pas deux
  unite: "jours/an" | "nuits/an";
  definition: string;                                 // « Tmin ≥ 20 °C » OU « > 20 °C » : selon la notice DRIAS
};
type FaitsChaleur = { commune: string; axes: TrajectoireAxe[]; horsPerimetre?: "outre-mer" };

// Les classifications consomment FaitsChaleur et se déclarent :
type ClassificationChaleur = {
  id: "C1-niveau-declare" | "C2-niveau-ambiant" | "C3-evolution";
  question: string; convention: string; version: string;
  verdict: "unfavorable" | "under_threshold" | "uncertain" | "marquee" | "notable" | null;
  axesQuiFondent: TrajectoireAxe["axe"][];
};
```

**Ce que FUT-20 doit garantir :**
1. Toute valeur affichée vient de `FaitsChaleur`.
2. Tout déclenchement passe par une `ClassificationChaleur` nommée.
3. Tout texte d'évolution cite un fait, sans qualifier d'écart.
4. Un axe `null` ne produit **ni** composition **ni** phrase.
5. Le seuil affiché est celui de la classification qui a déclenché la carte.

## H. Dépendances et risques

| Dépendance ou risque | Effet sur le pilote | Parade |
|---|---|---|
| FUT-104 (outre-mer) non fusionné | Valeurs climatiques fausses en 97x | Exclure l'outre-mer jusqu'à la fusion |
| S1 (conditions) | La carte condition porte le pilote si la chaleur est confirmée (D4) | S1 avant ou avec le pilote |
| FUT-50 (accueil, prototype) | Modifie `drias-json.ts` ; introduit « À surveiller » sous le seuil, le palier « moins d'un » et les jours > 30 °C | Aucun lot du pilote ne touche `drias-json.ts` ; C3 et la définition de l'écart après fusion ; D2 arbitré avec la traduction de `under_threshold` |
| FUT-103 (non lu) | Peut trancher la lecture sous le seuil | D2 ouvert jusqu'à lecture du ticket |
| Couverture du diagnostic (A ≈ 18 à 20 % des adresses, aucun diagnostic attribuable pour 75 à 86 %) | Le cas riche est minoritaire | Concevoir d'abord pour B1 et C |
| Fraîcheur du diagnostic | Une caractéristique a pu changer | Date affichée, « peut avoir changé depuis » |
| Tickets de données (FUT-24, 47, 80 à 83, 89, 98) | Ils conditionnent les candidats 3 à 7 | Aucun développement de ces compositions avant que la source soit livrée et vérifiée ; un ticket d'étude n'est pas une intégration |
| Tentation d'élargir le pilote | Dérive d'ambition | L'îlot de chaleur en v2 ; bruit et étage déclaré hors pilote |

**Fréquence, en ordre de grandeur :** 28,7 % de la population vit dans une commune au-dessus du seuil chaleur déclaré (5 461 communes). Le pilote v1 change donc la carte chaleur environ une fois sur quatre pour qui déclare cette priorité, le plus souvent par le cas 2 (vérification).

## I. Recommandations d'architecture, minimales

**À décider maintenant** : sinon, de la dette.
1. **Faits climatiques canoniques et classifications déclarées** (§G.2, §G.3) : le contrat, pas forcément le code, dès FUT-20.
2. **Des faits Logement qui portent leurs champs** (`ConfortEteFait` plutôt que `confortEteInsuffisant`).
3. **Une composition peut porter un côté d'un autre grain** (`logement?: CompositionSide`). C'est la seule extension de type nécessaire aux candidats 1 à 3 et 6. Les candidats 4, 5 et 7 l'utiliseraient aussi.
4. **Une `verification` n'oriente un critère que si sa règle le déclare** (S1). Correction dans `condition-rules.ts`, pas un mécanisme générique.

**À différer sans dette :**
5. Un moteur générique ou un langage de composition.
6. La découverte automatique de relations.
7. Les compositions établies par l'IA : l'IA ne fait que formuler, dans `compositions_found`.
8. L'entrée dans le moteur de l'îlot de chaleur, du bruit réglementaire, de l'urbanisme, de la copropriété et des horaires de transport : chacune avec son ticket de données.
9. Le rattachement général des constats Logement aux priorités : à traiter avec la doctrine des échelles.
10. Un statut pour les **observations du lecteur** (FUT-21) : il faudra une provenance distincte des sources (rapport Data Curator du 21/08) avant toute composition qui les consomme. Ce n'est pas un prérequis du pilote.

**Recommandation d'ensemble :** **améliorer le mécanisme existant plutôt qu'en créer un nouveau.**

## J. Articulation avec FUT-17 et le lancement

- **FUT-85 et FUT-20 ne sont pas des prérequis au lancement.** La bibliothèque V1 est sûre une fois S1 et S2 corrigés.
- **À sortir tout de suite** : S1 (ticket distinct proposé) et S2 (dans ce ticket ou dans FUT-17).
- **Pour FUT-17**, la V1 à auditer :
  - les cinq patrons et leurs textes écrits à la main ;
  - la carte condition (textes `POURQUOI_*`, `consequenceDuSignal`) ;
  - la règle transports contre chaleur (§D.4, D7) ;
  - la redite de la douceur ;
  - la double temporalité du tradeoff ;
  - le manque d'assertions sur le texte dans `fact-compositions.test.ts`.

  Les formulations de `climate_comfort` et du côté défavorable du tradeoff ne valent pas d'être polies si D1 est retenu.
- **Relations Linear** : non modifiées. Aucun ticket créé.

## K. Reproductibilité

Les sondes ont été écrites **temporairement** dans `src/lib/decision/`, lancées par `node --test`, puis supprimées ; `git status` est propre après chaque exécution. Les calculs Python lisent les fichiers sans les modifier.

**K.1 — S1, condition × proximité.** Projet `acces_soins` au poids 3, avec et sans `buildConfirmation`. `rankBands.acces_soins = [8500, 9000]` (**fictif**). Snapshot Autour avec un médecin à 553 m (forme de `autour-rules.test.ts`). Puis `runRules` → `assembleDossier(..., composeFacts(...))`, et impression des cartes `condition_check` (statut, constat, `whyNotDecided`, `consequence`). Même chose pour `acces_transports` (gare à 600 m) et `faible_dependance_auto` (`secteur.equipementAuto = { share: 45, communeShare: 70, ecart: -25 }`).

**K.2 — Chaleur × logement.** Entrées de l'index et scénarios DRIAS **réels** (`gwl15` / `gwl20` / `gwl30`) de Nîmes, La Rochelle et Briançon, puis `buildClimatFacts`. Logements tirés de `casDeLogement("temoin" | "immeuble" | "sans-dpe").dpe` (fixtures FUT-87) par `deriveThermalEvidence`.

**K.3 — Statistiques DRIAS** (`public/data_climat.json`, palier `gwl20`, codes hors 97x : 34 873 communes). Colonnes `column08` (NORTX35D), `column10` (NORTR), `column23` (ATX35D), `column24` (ATX30D), `column25` (ATR).
- **S2 :**
  - `NORTR == 0 and ATR == 0` → 59 ;
  - `NORTR < 0.5` → 151, ensemble identique à `ATR < 0.5` ;
  - `ATR < 1` → 239 ;
  - `NORTR < 1 and NORTX35 < 1` → 234 ;
  - `ATR >= 1` → 34 634.
- **Référence reconstruite** = médiane sur les trois paliers de (`NORTR` − `ATR`).
- **I2 :** `marquee = max(classe(ATR), classe(ATX30D)) == 2` (classe 2 si ≥ 20), comparé à `NORTX35D >= 8 or NORTR >= 25`, puis `>= 10 / >= 39`. Ce calcul porte sur les 35 006 entités, outre-mer compris : à refaire hors outre-mer après FUT-104.

**K.4 — Transports contre chaleur** (index et DRIAS) : `faible_chaleur = 100 - moyenne(pct[NORTX30D, NORTX35D, NORTR, NORTMm_seas_JJA])`, `acces_transports = transport.desserte`. Déclenchement si ≥ 60 et ≤ 40.

**K.5 — Recouvrement FUT-50** : `git diff --name-only origin/main...origin/feat/fut-50-{accueil-decision,socleom-integration}` ne touche ni `condition-rules.ts`, ni `autour-rules.ts`, ni `secteur-rules.ts`, ni `decision-fact.ts`, ni `ThermalComfortSection.tsx`, ni `LogementModule.tsx`, ni les fichiers de compositions. `socleom-integration` touche `drias-json.ts`.

**K.6 — Suite** : `node --test src/lib/decision/*.test.ts` → 64 fichiers, 1 007 tests, 1 007 verts. Lancée seule.

## L. Les décisions D1 à D8

| # | Décision à valider | Recommandation | Justification | Dépendance | État |
|---|---|---|---|---|---|
| **D1** | Le pilote enrichit-il les cartes chaleur existantes, plutôt que d'en créer une ? | **Oui** | Une carte de moins ; les preuves et les gestes existants sont réutilisés (§B.1.2) | — | Validé en revue, à confirmer |
| **D2** | Une composition chaleur × logement peut-elle exister **sous** le seuil du moteur ? | **v1 au-dessus du seuil seulement** ; R-ST (§G.1) candidate pour la suite | Ne pas créer d'écart implicite, ne pas taire une trajectoire nette ; R-ST n'ajoute aucune valeur, mais laisse passer presque toutes les communes, ce qui est un choix de produit | FUT-103 (non lu) ; traduction de `under_threshold` : « À surveiller » (FUT-50) contre « favorable » (dossier) | **Ouvert** |
| **D3** | Comment unifier la chaleur sans effacer l'information ? | **Faits canoniques uniques** ; classifications **déclarées** (C1 à C4) ; C3 conservée puis rapatriée ; une seule définition de l'écart | Niveau et évolution sont deux questions légitimes ; deux conventions non déclarées ne le sont pas (§G.2) | Fusion de FUT-50 (`drias-json.ts`) ; notice DRIAS (définition de la nuit tropicale) | **Partiellement ouvert** (principe validé ; calendrier et définition de l'écart à trancher) |
| **D4** | Si « des étés supportables » est une condition confirmée, la carte condition reprend-elle le côté logement et son geste ? | **Oui**, après S1 | Sinon le lecteur le plus exigeant perd le pilote (FUT-90, hors périmètre 1) | S1 | À valider |
| **D5** | Le pilote couvre-t-il la chaleur non demandée (C2) ? | **Oui**, en `secondary` | Mêmes faits, même relation, seuil ambiant déjà plus exigeant | — | À valider |
| **D6** | S1 et S2 partent-ils en correctifs immédiats, hors FUT-85 ? | **Oui.** S1 en ticket distinct (proposé, non créé) ; S2 avec S1 ou dans FUT-17 | S1 inverse un constat sur une condition du lecteur ; S2 affirme sans source (§D.6, §D.7) | Aucune avec FUT-50 pour le code ; tournure de S2 à aligner avec FUT-50 | À valider |
| **D7** | Retirer la règle transports contre chaleur ? | **Retirer**, sauf arbitrage réel à défendre | Convention double sur le critère chaleur ; deux cartes chaleur sur 2 136 communes (§D.4) | FUT-17 | À valider |
| **D8** | Quelles décisions de données conditionnent la feuille de route ? | (a) Bâtiment : FUT-80 avant toute question au lecteur. (b) Copropriété : FUT-83. (c) Littoral : relecture juridique de l'état des risques + forme de publication des zones de recul (FUT-81). (d) Bruit : FUT-82 tranche CBS et plans d'exposition au bruit ; niveau réglementaire nocturne à déclarer. (e) Mobilité : FUT-47 et FUT-98 avant tout temps de trajet restitué. (f) Services : FUT-24 et FUT-89 (besoin déclaré) | Un ticket d'étude n'est pas une donnée disponible ; chaque source doit livrer et être vérifiée avant sa composition (§E) | Tickets cités, **descriptions à vérifier dans Linear** | À valider ticket par ticket, après le pilote |

**Arbitrages encore ouverts : D2 et D3.** Les autres attendent une validation simple.

## M. Changements depuis la version 1 (même jour)

- **Synthèse** : six réponses en tête ; la feuille de route passe de « trois compositions » à **huit candidates en quatre catégories**, avec un pilote unique.
- **Matrice des candidats** (§E.2) : colonnes demandées et tickets associés. Chaleur × bruit, mobilité, services et urbanisme ne sont **plus écartés** : ils deviennent **conditionnels** ou **dépendants d'une observation**. Les formulations, elles, restent exclues (§E.4).
- **Argiles** (§E.3, candidat 3) : suppression de l'idée qu'un appartement en étage serait moins concerné. Quatre objets séparés (exposition, vulnérabilité jamais déduite, conséquences, questions), plus le volet copropriété.
- **D2** (§G.1) : fait / classification / composition ; règle candidate R-ST ; décision **ouverte**. Signalement de la divergence de traduction de `under_threshold` entre le prototype FUT-50 et le dossier.
- **D3** (§G.2, §G.3) : la recommandation « remplacer le signal de la synthèse » est **retirée**. À la place : faits canoniques, classifications déclarées (C1 à C4), interprétations contraintes, contrat minimal. Repérage de deux définitions de l'écart (anomalie DRIAS contre projeté − référence) et de la définition de la nuit tropicale à vérifier.
- **S2** (§D.2) : démonstration refaite sur la valeur projetée **et** l'anomalie. « Fausse sur 151 communes » est retiré ; à la place, 59 communes où l'indicateur ne progresse pas, 239 où la hausse est inférieure à une nuit par an. Gravité ramenée à **faible**.
- **Fiches de transmission** S1 et S2 (§D.6, §D.7). S1 : périmètre précisé à 3 règles sur les 8 concernées.
- **Inchangé** : inventaire (§B), preuves S1, pilote et ses restitutions (cas 3 recentré sur Briançon), estimation, recommandations d'architecture.
