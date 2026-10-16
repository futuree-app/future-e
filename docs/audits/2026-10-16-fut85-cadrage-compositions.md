# FUT-85 — Cadrer l'intelligence de composition avant de construire

**16/10/2026** · branche `explore/fut-85-cadrage-compositions`, partie de `main` à `7937f37d` (FUT-62 fusionné).
**Statut : étude.** Aucun code de production n'a été touché : pas de règle, pas de composant, pas de donnée. Les sondes citées ont tourné en local, sur des copies, et ont été supprimées après exécution. Leur source est en annexe J pour qu'on puisse les rejouer.

Ce document a deux niveaux de lecture. La **partie 1** se lit sans connaître le moteur. La **partie 2** contient l'inventaire, les preuves et la spécification.

---

# Partie 1 — Synthèse décisionnelle

## Les cinq réponses, d'abord

1. **Quelle intelligence de composition futur•e possède-t-il déjà ?**
   Plus qu'on ne le croit, mais dispersée. Le registre officiel compte bien **cinq compositions**. À côté, **une quinzaine d'autres mécanismes** relient déjà des faits sans porter ce nom : les cartes « condition sans compromis », la règle « transports contre chaleur », les constats de voisinage qui complètent un rang communal, la lecture inondation à trois sources, une phrase « climat futur » dans le module Logement, et la synthèse IA du Logement, qui croise climat et logement.

2. **Lesquelles sont de la présentation, lesquelles raisonnent ?**
   Les cinq compositions du registre sont **essentiellement de la présentation** : elles regroupent des faits déjà établis et, pour deux d'entre elles, restaurent un geste perdu. Une seule produit un arbitrage au sens strict : douceur des hivers contre chaleur des étés. **Aucune ne relie aujourd'hui deux échelles** pour en tirer une conséquence nouvelle. Les mécanismes qui le font (le rang communal complété par le voisinage, le trajet recalculé depuis l'adresse) les **juxtaposent** sans les relier.

3. **Quelles nouvelles compositions méritent leur place ?**
   **Trois**, pas plus pour l'instant :
   - la **chaleur future × le confort d'été du logement** ;
   - les **argiles × le type de bâti** ;
   - le **littoral × l'adresse**.
   Les autres pistes du ticket sont soit déjà couvertes (services), soit sans donnée qui les fonde (bruit × ventilation, mobilité × trajet, permis × logement).

4. **Quelle première composition construire avec FUT-20 ?**
   **La chaleur future × le confort d'été du logement**, construite comme un **enrichissement des trois cartes chaleur existantes**, pas comme une carte de plus. Les données nécessaires sont toutes dans le dépôt, et le cas où l'information manque devient une vérification précise.

5. **Quelles décisions d'architecture maintenant, lesquelles différer ?**
   - **Maintenant :** une seule source pour le signal chaleur ; des faits Logement qui portent leurs champs plutôt qu'un booléen précalculé ; une composition qui peut porter un côté « au grain adresse » ; la correction de deux défauts déployés (§8).
   - **À différer sans dette :** tout moteur générique de composition, toute composition découverte automatiquement, toute composition rédigée par l'IA, et l'entrée dans le moteur du bruit et de l'îlot de chaleur.

## 1. Ce que futur•e sait déjà relier

- **Deux priorités qui tirent en sens opposés sur le même lieu.** Des hivers parmi les plus doux du pays, des étés de plus en plus chauds : une seule carte présente les deux côtés, sans les solder.
- **Une même cause derrière plusieurs écarts.** La petite taille d'un village dessert à la fois « une grande ville » et « ne pas être isolé » : une carte, une cause, deux conséquences.
- **Un constat communal et le geste qui se fait au logement.** Chaleur ou danger d'incendie établis à la commune, avec le geste à faire sur place : regarder comment le logement tient l'été, regarder la végétation autour du terrain.
- **Deux contrôles qui se mènent ensemble.** Un sol argileux et le plan de prévention sécheresse qui l'encadre.
- **Une mesure à l'adresse qui complète un rang communal.** Médecin à 550 m, gare à 600 m, équipement automobile du quartier. Ces constats sont posés **à côté** du rang communal, sans que l'un corrige l'autre.
- **Trois sources ordonnées sur un même risque.** Plan de prévention à l'adresse, sinistres indemnisés dans la commune, arrêtés de catastrophe naturelle : le module Logement les ordonne dans une seule lecture.
- **Le projet personnel au grain adresse.** Le temps de trajet vers le lieu déclaré est recalculé depuis l'adresse, et pas depuis le centre de la commune.

## 2. Ce que futur•e ne sait pas encore faire

- **Relier le logement à une priorité déclarée.** Les constats Logement (confort d'été, diagnostic, argiles…) ne sont rattachés à **aucune** priorité du projet. Quelqu'un qui veut « des étés supportables » voit la chaleur de la commune dans une carte, et le confort d'été du logement dans une autre, plus bas, avec un autre geste. La sonde sur Nîmes l'a montré : **deux cartes chaleur, deux gestes différents, aucun lien**. L'une demande au lecteur de « regarder comment le logement tient l'été » alors que la carte voisine dit déjà ce que le diagnostic en sait.
- **Dire qu'on ne peut pas conclure au bon endroit.** Quand le diagnostic manque (75 à 86 % des adresses, mesure du 31/07), le dossier ne transforme pas ce manque en vérification ciblée sur la question chaleur.
- **Parler d'une seule voix sur la chaleur.** Trois signaux chaleur coexistent :
  - le moteur (seuils absolus à l'horizon 2050) ;
  - la synthèse IA du Logement (hausse par rapport à 1976-2005, autre seuil) ;
  - une phrase du module Logement, affichée **sans condition** sur toutes les communes.

  Ils se contredisent sur 1 301 communes : la synthèse IA est seule à signaler sur 523 d'entre elles, le moteur seul sur 778 (annexe D3). Et la phrase sans condition est fausse sur environ 150 communes (§8).

## 3. Ce qui est réellement différenciant

Pas le nombre de rapprochements. Un portail peut afficher la chaleur de la commune et l'étiquette du logement l'une à côté de l'autre. Ce qu'il ne fera pas :

1. **partir de ce que la personne a déclaré**, et ne relier que ce qui change sa décision ;
2. **descendre jusqu'à ce logement-là**, en disant d'où vient chaque morceau (commune, quartier, bâtiment, logement) ;
3. **transformer un manque en question précise** : pas « renseignez-vous », mais « demandez si l'appartement est traversant et s'il est sous les toits : c'est ce que le diagnostic ne dit pas » ;
4. **savoir se taire** : pas de lien quand la chaleur n'est pas un enjeu dans cette commune, pas de lien quand le diagnostic ne décrit pas ce logement.

Le pilote proposé coche ces quatre points avec des données qu'on a déjà.

## 4. Ce qu'il faut conserver

- **Les cinq compositions du registre.** Aucune n'est fausse, toutes réduisent la répétition. Une composition simple et fiable vaut mieux qu'une composition ambitieuse et fragile.
- **Leur doctrine.** Une relation se déclare, elle ne se découvre pas. Une composition n'invente pas de fait et ne rend pas visible ce qui était silencieux. Le côté favorable n'est jamais recalculé. C'est la bonne base pour la suite.
- **Le patron « le voisinage complète le rang communal ».** C'est le mécanisme multi-échelles le plus sain du produit.
- **La lecture inondation à trois sources**, et la règle de la synthèse Territoire qui **interdit** à l'IA de relier deux faits voisins. Ce garde-fou est juste.

## 5. Ce qu'il faut arrêter ou éviter

- **Arrêter la phrase « Avec la progression des nuits chaudes à {commune}… »** du module Logement. Elle s'affiche partout, sans lire la donnée, et elle est fausse en haute montagne (§8).
- **Retirer, ou rebrancher, la règle « transports contre chaleur ».** Elle juge la chaleur sur une note interne avec un autre seuil que la règle chaleur. Elle affirme « moins bien satisfaite ici » sur 2 796 communes (12 millions d'habitants) où la règle chaleur du même dossier dit « sous le seuil de signalement ». Sur 2 136 autres communes, elle redouble la carte chaleur.
- **Éviter les compositions sans donnée qui les fonde :**
  - bruit × ventilation nocturne : on n'a ni le bruit en façade ni l'usage des fenêtres ;
  - trajet personnel × gare : on ne calcule que les trajets en voiture et à pied ;
  - permis × logement : le registre ne dit ni la taille ni la nature du projet.
- **Éviter un moteur universel de composition.** Les besoins réels tiennent dans une extension de deux types existants.
- **Éviter que l'IA compose.** Elle peut formuler une relation que le déterministe a établie, jamais en établir une.

## 6. Les trois premières compositions à privilégier

| Rang | Composition | Question du lecteur | Faisable | Risque scientifique |
|---|---|---|---|---|
| **1** | **Chaleur future × confort d'été du logement**, selon la priorité « étés supportables » ou en constat non demandé | « Les étés deviennent plus durs ici : ce logement m'aidera-t-il, et que dois-je vérifier ? » | **Maintenant** : tout est dans le dépôt | Faible, si l'on ne prédit aucune température intérieure |
| **2** | **Argiles × type de bâti** (maison individuelle ou immeuble), selon l'intention (achat, location, habitant) | « Ce sol argileux concerne-t-il vraiment ce bien, et quoi demander ? » | Après un **enrichissement** : le type de bâti n'est connu que par le diagnostic | Faible à modéré, à sourcer |
| **3** | **Littoral × adresse** : commune inscrite au titre du recul du trait de côte, plan littoral, distance au rivage | « Ce bien est-il concerné par le recul de la côte, et où le vérifier ? » | **Presque maintenant** : données dans le dépôt, vérification juridique à faire | Modéré : on ne connaît pas les zones locales, donc uniquement en vérification |

## 7. Le pilote recommandé pour FUT-20

**Chaleur future × confort d'été du logement × projet déclaré**, construite en **améliorant les trois cartes chaleur existantes** :
- l'écart « des étés supportables » ;
- le compromis hivers doux / étés chauds ;
- le constat non demandé de chaleur future.

Ces cartes absorbent aussi la carte « Confort d'été insuffisant » du logement quand elle existe.

**Ce qu'elle dit**, selon ce que l'on sait :

- **La commune devient très chaude et le diagnostic décrit ce logement :** les deux constats sont réunis dans une seule carte.

  > À Nîmes, les nuits tropicales passeraient de 33 à 69 par an d'ici 2050. D'après son diagnostic (2024), ce logement classe son confort d'été comme insuffisant : il n'est pas traversant et ses murs ont une inertie légère ; ses protections solaires ne sont pas renseignées.

  Un seul geste suit : « Demandez quelles protections solaires existent, et si les chambres peuvent être aérées la nuit. »

- **Le diagnostic décrit l'immeuble, ou il n'y en a pas :** la carte nomme ce qui manque et en fait la vérification (« demandez si l'appartement est traversant et s'il est sous les toits », « demandez le numéro du diagnostic »).
- **La chaleur n'est pas un enjeu dans la commune :** aucun lien. La carte logement reste seule, sans un mot sur le climat.

**Ce qu'elle ne dit jamais :** une température intérieure, un « vous aurez trop chaud », un « ce logement compense ».

**Périmètre estimé :** petit à moyen. Environ dix fichiers, de 3 à 5 jours avec les tests et la relecture éditoriale (§F.9).

## 8. Anomalies de sûreté, à corriger sans attendre FUT-85 ni FUT-20

Elles sont déployées, prouvées par sonde ou par mesure, et **non corrigées dans cette branche**.

| # | Anomalie | Gravité | Preuve |
|---|---|---|---|
| **S1** | **Une carte « condition sans compromis » inverse le sens d'un constat favorable.** Si le lecteur a confirmé « accès aux soins », « accès aux transports » ou « faible dépendance à la voiture » comme condition, et qu'un médecin, une gare ou un quartier peu motorisé est recensé autour de l'adresse, la carte dit **« Ouverte · plutôt défavorable — Ce que l'on sait penche contre cette condition »**. Cela vaut même quand la commune est parmi les 20 % les plus favorables. Elle ajoute « Cette lecture est faite à l'échelle de la commune », alors que son constat est à l'adresse. | **Élevée.** Carte en tête de dossier, sur une condition que le lecteur a lui-même posée ; le sens est inversé. Portée : dossiers adresse avec l'une de ces trois conditions confirmées (FUT-7/8, déployés début octobre). | Annexe D1 |
| **S2** | **« Avec la progression des nuits chaudes à {commune} »** s'affiche dans le module Logement pour **toute** adresse, sans lire aucune donnée. | **Faible à modérée.** Affirmation sans source, fausse sur 151 communes où DRIAS projette moins d'une demi-nuit tropicale par an en 2050 (Barcelonnette, Briançon, Allos…), douteuse sur 239 (moins d'une nuit). | Annexe D2 |

Deux **incohérences** relèvent plutôt de FUT-17 que d'une anomalie de sûreté :
- **I1 :** la règle transports contre chaleur et la règle chaleur appliquent deux conventions sur le même critère (§5).
- **I2 :** le signal chaleur de la synthèse IA du Logement n'est pas celui du moteur (annexe D3).

## 9. Les décisions à prendre avant développement

| # | Décision | Ma recommandation |
|---|---|---|
| D1 | Le pilote enrichit-il les cartes chaleur existantes (A), ou crée-t-il une carte de plus (B) ? | **A.** Une carte de moins, pas une de plus. |
| D2 | Un constat du **logement** peut-il compter dans le verdict d'une priorité **communale** ? Exemple : La Rochelle passe sous le seuil chaleur, mais le logement a un confort d'été insuffisant. | **Non en v1.** Le logement n'entre que dans une composition déjà déclenchée par la commune. À rouvrir avec la doctrine des échelles. |
| D3 | Un seul signal chaleur pour le dossier, le module Logement et la synthèse IA ? | **Oui, celui du moteur.** C'est aussi ce qui corrige S2. |
| D4 | Si « des étés supportables » est une **condition confirmée**, la carte condition reprend-elle le côté logement et son geste ? Aujourd'hui le geste disparaît (FUT-90). | **Oui**, dans le même lot. Sinon le lecteur le plus exigeant perd le pilote. |
| D5 | Le pilote couvre-t-il aussi la chaleur **non demandée** (constat ambiant) ? | **Oui**, en `secondary`. Mêmes faits, même relation. |
| D6 | S1 et S2 partent-ils en correctif immédiat (hors FUT-85) ? | **Oui.** S1 en priorité. |
| D7 | Retirer la règle transports contre chaleur, ou la reconstruire sur les verdicts canoniques ? | **Retirer**, sauf si vous y voyez un arbitrage réel. Je n'y vois qu'une juxtaposition. |
| D8 | Pour les candidats 2 et 3 : source du type de bâti (diagnostic seul, base bâtiment, ou question au lecteur) ; relecture juridique du littoral. | À trancher après le pilote. Rien ne presse. |

---

# Partie 2 — Annexe technique

## A. Méthode et périmètre

**Lu dans le code** (`main` à `7937f37d`) :
- `src/lib/decision/` :
  - compositions : `fact-compositions.ts`, `fact-composition.ts` ;
  - assemblage et types : `decision-assembler.ts`, `decision-fact.ts` ;
  - règles : `materiality-rules.ts`, `logement-rules.ts`, `mismatch-rules.ts`, `autour-rules.ts`, `secteur-rules.ts`, `permis-rules.ts`, `condition-rules.ts` ;
  - faits : `climat-facts.ts`, `logement-facts.ts`, `autour-facts.ts`, `territory-facts.ts`, `mismatch-facts.ts` ;
  - lectures et vues : `echelles.ts`, `inondation-lecture.ts`, `conclusion-plan.ts`, `conclusion-prompt.ts`, `dossier-view.ts` ;
- assemblage adresse : `src/lib/server/assemble-address-dossier.ts` ;
- climat et logement : `src/lib/drias-json.ts` (`deriveClimatProjete`), `src/lib/thermal-evidence.ts`, `src/lib/logement-synthesis-cache.ts`, `src/app/api/synthesize-logement/route.ts` ;
- voisinage : `src/lib/logement-autour-chaleur.ts`, `src/lib/icu.ts` ;
- territoire : `src/lib/territoire/synthesis-contract.ts` ;
- rendu : `src/components/report/ThermalComfortSection.tsx`, `LogementModule.tsx`, `FactCompositionCard.tsx`, `DossierDecisionSection.tsx`.

**Lu dans la documentation :**
- audits et cadrages : `docs/cadrage-chaleur-chaine-de-lecture.md` (19/08), `docs/audits/2026-07-03-dpe-confort-ete-couverture.md`, `docs/audits/2026-10-12-fut90-composition-chaleur.md`, `docs/audits/2026-10-11-fut67-dossier-adresse.md` ;
- vault : `docs/vault/briefs/logement-caracteristiques-declarees.md`, `docs/vault/arbitrages/deterministe-selectionne-ia-formule.md`, les invariants.

**Données lues** :
- `public/data_climat.json` (DRIAS, 35 006 communes à l'horizon 2050) ;
- `data/comparateur-index.json.gz` (34 788 communes) ;
- `data/littoral-*.json`, `data/icu.json`.

**Sondes** : quatre sondes sur la vraie chaîne règles → conditions → compositions → assemblage. Communes réelles (Nîmes, La Rochelle, Briançon, Châtelaillon, avec leurs données DRIAS réelles). Logements tirés des fixtures FUT-87 : adresses fictives, valeurs énergétiques d'un diagnostic public détaché de son adresse. Les rangs communaux marqués **fictif** ont été posés pour isoler un cas.

**Suite de tests de décision** lancée seule : 64 fichiers, **1 007 tests, 1 007 verts**.

**Hors périmètre** : le ticket Linear lui-même, non lu (pas de connecteur authentifié). Le cadrage s'appuie sur le texte de la mission.

## B. Inventaire des compositions existantes

Familles :
- **A** : présentation ;
- **B** : arbitrage ;
- **C** : multi-échelles ;
- **D** : incertitude actionnable.

Une ligne peut relever de deux familles.

### B.1 Le registre officiel (`fact-compositions.ts`), cinq patrons

La liste de la première revue est **exacte et complète pour le registre**. `composeFacts` (`fact-compositions.ts:337`) appelle exactement ces cinq fonctions. Le validateur `assertCompositionsValid` (`:295`) refuse une absorption double, un fait absorbé inexistant, une mauvaise section, ou un sujet de héros mal formé. Les cinq se branchent aux deux parcours, commune (`territory-facts.ts:255`) et adresse (`assemble-address-dossier.ts:112`), donc aussi à l'artefact payé.

#### B.1.1 `seasonal_climate_tradeoff` — douceur des hivers × fortes chaleurs (`:61`)

| Rubrique | Contenu |
|---|---|
| Faits sources | Douceur hivernale : rang national de la température moyenne de décembre à février, période 1976-2005, grain commune (`relativePosition.douceur_climat`). Chaleur : `climat-chaleur`, mismatch DRIAS 2050 (jours > 35 °C, nuits tropicales), grain commune. |
| Déclenchement | `douceur_climat` et `faible_chaleur` déclarées au poids 2 ou plus ; douceur `satisfied` (bande ≥ 0,8, soit parmi les 20 % les plus doux) ; mismatch chaleur **émis** (pas absorbé par une condition, FUT-90) ; preuve de douceur constructible. |
| Rôle du projet | Central : les deux priorités doivent être déclarées. |
| Production | Une carte « Ce qui départage vraiment » : un côté favorable (douceur), un côté défavorable (chaleur) avec le geste `summerComfortAction`, et un sujet de héros « l'exposition aux fortes chaleurs ». |
| Synthèse IA | Non. Le bloc `compositions_found` de la conclusion peut être reformulé par le modèle, avec un repli déterministe, sans jamais créer de relation (`conclusion-prompt.ts:67`). |
| Données manquantes | Bande absente ou corrompue : pas de tradeoff, repli sur `climate_comfort`. Chaleur sous le seuil : rien. |
| Nouveauté | **Modeste mais réelle.** Le lecteur apprend que ses deux priorités viennent du même régime climatique : ce qui les satisfait l'une contrarie l'autre. C'est le seul arbitrage authentique du registre. |
| Tests | `fact-compositions.test.ts` (5 tests structurels), `winter-mildness-e2e.test.ts`, `fut90-conditions-climat.test.ts`. |
| Remarques | Deux temporalités côte à côte : la douceur sur 1976-2005, la chaleur en 2050. Le résumé dit « comptent parmi les plus doux » au présent ; la preuve date la référence. À relire dans FUT-17. Fréquence possible : 3 333 communes (9,6 %) cumulent les deux conditions climatiques. |
| **Statut** | **Conserver, Enrichir** : son côté défavorable reçoit le côté logement du pilote. |

#### B.1.2 `climate_comfort` — chaleur × geste logement (`:113`)

| Rubrique | Contenu |
|---|---|
| Faits sources | Le mismatch chaleur seul (grain commune). |
| Déclenchement | `faible_chaleur` au poids 2 ou plus, mismatch émis, tradeoff saisonnier non produit. |
| Rôle du projet | Le poids gouverne l'existence de la carte. |
| Production | Une carte « Ce qui correspond moins bien », avec le constat DRIAS et l'action `summerComfortAction(hasAddress)` : « Regardez comment le logement tient l'été » avec adresse, « Renseignez votre adresse… » sans. |
| Synthèse IA | Non. |
| Données manquantes | L'action est **la même** que le logement soit documenté ou non : elle **ignore** ce que le diagnostic dit. |
| Nouveauté | **Aucune.** C'est une restauration de geste : un mismatch ne porte pas d'action (`fact-composition.ts:96`). |
| Tests | `fact-compositions.test.ts` (3 tests), `fut90-*`. |
| Sonde Nîmes, adresse avec diagnostic « insuffisant » | Cette carte demande de « regarder comment le logement tient l'été » ; **trois cartes plus bas**, « Confort d'été insuffisant » dit ce que le diagnostic en sait, avec un autre geste. |
| **Statut** | **Enrichir.** C'est le point d'attache principal du pilote. |

#### B.1.3 `wildfire_exposure` — danger d'incendie × geste terrain (`:144`)

| Rubrique | Contenu |
|---|---|
| Faits sources | Mismatch feu : soit l'indice forêt-météo 2050 (grain commune), soit le risque feu de forêt recensé par l'État (Géorisques, grain commune). |
| Déclenchement | Mismatch feu émis, à tout poids (la règle a déjà tranché). |
| Production | Une carte avec un titre factuel selon le fondement (recensement ou trajectoire), et l'action `wildfireExposureAction` (« Regardez la végétation autour du terrain »). |
| Nouveauté | Aucune : restauration de geste. |
| Limite | Le geste parle de débroussaillement et de terrain même pour un appartement en centre-ville. Ce n'est pas faux, c'est hors sujet. On ne peut l'adapter qu'en connaissant le type de bâti (candidat 2). |
| Tests | `fact-compositions.test.ts` (5 tests). |
| **Statut** | **Conserver**, indépendante. Plus tard : adapter le geste au type de bâti. |

#### B.1.4 `territory-size-multiple-consequences` — petite taille × plusieurs priorités (`:194`)

| Rubrique | Contenu |
|---|---|
| Faits sources | Au moins deux mismatches issus du même fait de taille (`TERRITORY_SIZE_FACT_ID`), catégorie « village », sur `prefere_grande_ville` et `eviter_isolement`. |
| Production | Une carte « Une même petite taille joue sur plusieurs de vos priorités » : une cause, deux conséquences, chacune avec son niveau de matérialité. |
| Nouveauté | **Faible mais utile** : elle dit que les deux écarts n'en font qu'un. Évite une double lecture. |
| Tests | `fact-compositions.test.ts` (4 tests, dont le déterminisme d'ordre). |
| **Statut** | **Conserver**, indépendante. |

#### B.1.5 `clay_regulation_grouped` — argiles × plan de prévention sécheresse (`:251`)

| Rubrique | Contenu |
|---|---|
| Faits sources | `logement.exposition-bati` (aléa argiles moyen ou fort, parcelle) et `logement.zone-reglementee` (plan de prévention au point), à condition que le libellé du plan atteste « sécheresse / argile / tassement ». |
| Production | Une carte « À contrôler », deux items complets (constat, preuve, action, limite). |
| Données manquantes | Libellé de plan absent : rien (relation non vérifiable, donc non déclarée). |
| Nouveauté | **Faible** : les deux contrôles se mènent ensemble. Fréquence non mesurée, probablement rare (les plans sécheresse ne couvrent qu'une partie des départements). |
| Tests | `fact-compositions.test.ts` (3 tests). |
| **Statut** | **Conserver. Enrichir** avec le type de bâti (candidat 2). |

**Constat transversal sur les tests.** Les tests du registre sont presque tous **structurels** : ils vérifient qu'une carte apparaît, avec quels identifiants, dans quelle section. `fact-compositions.test.ts` ne porte que **deux** assertions sur un texte, toutes deux sur une preuve. C'est exactement le piège décrit dans `AGENTS.md` : « la carte apparaît » et « la carte dit vrai » sont deux assertions distinctes. FUT-17 devra combler ce manque.

### B.2 Dans le moteur, hors registre

Ces mécanismes relient des faits sans être déclarés comme compositions.

| # | Mécanisme | Où | Faits et grains | Projet | Production | Famille | Nouveauté | **Statut** |
|---|---|---|---|---|---|---|---|---|
| 6 | **Transports contre chaleur** | `materiality-rules.ts:100` | Deux **notes internes** communales : `acces_transports` ≥ 60 et `faible_chaleur` ≤ 40 | Les deux priorités au poids 2 ou plus | Un `CompromiseFact` à deux côtés, preuves sans valeur | B | Faible : juxtaposition, sans lien causal entre les deux. **Juge la chaleur avec une autre convention que la règle chaleur** (I1) | **Retirer** (ou Remplacer : reconstruire sur les verdicts canoniques) |
| 7 | **Cartes « condition sans compromis »** (FUT-7) | `condition-rules.ts` | Réunit tous les faits d'un critère confirmé, **tous grains confondus** | La confirmation du lecteur | Une carte en tête, avec un signal favorable / défavorable / neutre | A + B | Bonne idée : un critère, une carte. **Défaut S1** | **Conserver**, et corriger S1 sans délai |
| 8 | **Le voisinage complète le rang** : `autour.acces-soins`, `autour.gare` | `autour-rules.ts:208`, `:397` | Rang communal (commune) **et** présence BPE (adresse, `relation: proximite`) | Priorité déclarée | Un constat à contrôler au grain adresse, placé **à côté** du rang | C | **Réelle** : le produit ne conclut plus à la commune ce qu'il mesure à l'adresse. Les deux restent juxtaposés | **Conserver** ; c'est le patron à suivre |
| 9 | **Équipement automobile du secteur** | `secteur-rules.ts:31` | Part des ménages motorisés à l'IRIS **contre** la commune | `faible_dependance_auto` | Une nuance de quartier, `secondary` | C | Réelle, bien bornée | **Conserver** (touché par S1) |
| 10 | **Trajet personnel recalculé à l'adresse** | `territory-facts.ts:120`, `assemble-address-dossier.ts:106` | Lieu déclaré × point adresse × itinéraire IGN (voiture, marche) | Contrainte déclarée | Incompatibilité, ou condition à confirmer | C | **Réelle** : c'est le mécanisme le plus « projet × adresse » du produit | **Conserver** |
| 11 | **Radon** | `radon-rules.ts` | Classe communale × geste dans le logement | Aucun (constat non demandé) | Un constat à contrôler, l'action au logement | C + D | Réelle : le constat est communal, l'action se fait chez soi | **Conserver** |
| 12 | **Feu, deux sources** | `materiality-rules.ts:437`, `:607` | Indice forêt-météo (DRIAS) **ou** risque recensé (Géorisques) | Déclaré, ou non demandé | Un constat, deux fondements | A | Faible : deux sources, un phénomène | **Conserver** |
| 13 | **Inondation et CatNat** | `materiality-rules.ts:127` | Note d'exposition + compte d'arrêtés (commune) | Priorité | Un constat à contrôler, borné par son contexte | A | Faible | **Conserver** |
| 14 | **Le héros nomme la composition, la conclusion la reformule** | `conclusion-plan.ts`, `conclusion-prompt.ts:67` | Les compositions affichées | — | Sujet du héros et action reprise mot pour mot ; le modèle peut reformuler le bloc | A | Aucune (rendu) | **Conserver** |

### B.3 Hors du moteur de décision : modules et synthèses

| # | Mécanisme | Où | Faits et grains | Projet | Production | IA | Famille | **Statut** |
|---|---|---|---|---|---|---|---|---|
| 15 | **« Dans le climat futur »** du confort d'été | `ThermalComfortSection.tsx:67` et `:157` | **Aucun fait climatique lu** ; seulement le nom de la commune et le niveau du diagnostic | Aucun | Trois phrases « Avec la progression des nuits chaudes à {commune}… », affichées pour toute adresse | Non | C (déclaré, non fondé) | **Remplacer** par la sortie du pilote. **Anomalie S2** |
| 16 | **Synthèse IA du Logement : climat × confort d'été** | `deriveClimatProjete` (`drias-json.ts:280`), prompt v6 et suivants (`synthesize-logement/route.ts:165`) | Hausse DRIAS (anomalies nuits tropicales et jours > 30 °C ≥ 20, « marquee », environ 15 % des communes) × confort d'été du diagnostic | **Aucun** (synthèse neutre) | Une phrase dont le sujet reste le logement ; le climat « change le poids », jamais le diagnostic | **Oui** | C (via IA) | **Remplacer le signal** par celui du moteur (D3). Garder la doctrine de rédaction, qui est bonne |
| 17 | **Îlot de chaleur × espace vert** | `logement-autour-chaleur.ts:49` | Îlot de chaleur (grand-IRIS, 596 communes) × espace vert cartographié (point) | Aucun | Une phrase qui relie, en nommant les deux grains, sans compensation | Non | A + C | **Conserver** ; ingrédient possible d'une v2 du pilote |
| 18 | **Lecture inondation à trois sources** | `inondation-lecture.ts` | Plan de prévention (adresse) × sinistres indemnisés (commune) × arrêtés CatNat (commune) | Aucun | Trois constats ordonnés, une phrase de réconciliation | Non | A + D | **Conserver** ; c'est le modèle de la juxtaposition honnête |
| 19 | **Conclusion du module Autour** | `autour-conclusion.ts` | Équipements, espace vert, îlot de chaleur | Aucun | Une conclusion déterministe | Non | A | **Conserver** |
| 20 | **Synthèse IA du Territoire** | `territoire/synthesis-contract.ts:255` | Instantané Territoire | Aucun (générique) | Un texte qui **s'interdit de relier** deux faits voisins | Oui | — (anti-composition) | **Conserver** : c'est le bon garde-fou |
| 21 | **Comparer deux candidats** | `comparaison-candidats.ts` | Deux artefacts figés | Critères déclarés | Une lecture croisée, sans gagnant | Non | A | **Conserver** (hors sujet ici) |

**Ce que montre l'inventaire.** futur•e compose déjà beaucoup. Mais :
- la seule relation **logement × territoire** qui existe passe soit par l'IA (n° 16), soit par une phrase sans fondement (n° 15) ;
- la seule relation **projet × adresse** est le trajet (n° 10) ;
- **aucun constat Logement n'est rattaché à une priorité** : toutes les règles Logement ont `projectKeys: []` (`logement-rules.ts:67`).

C'est le trou que FUT-85 doit combler, et il est étroit.

## C. Réexamen des cinq compositions

- **Apportent une information décisionnelle :** seulement `seasonal_climate_tradeoff`, et modestement. Les quatre autres sont de la présentation (regrouper, dédoublonner) ou de la **restauration de geste** : le passage du constat en mismatch avait fait perdre l'action, la composition la rend.
- **Gagneraient à être intégrées dans plus riche :**
  - `climate_comfort` et le côté défavorable du tradeoff saisonnier, dans le pilote ;
  - `clay_regulation_grouped`, dans le candidat 2 ;
  - `wildfire_exposure`, plus tard, pour son geste.
  Dans tous les cas on **étend**, on ne remplace pas : le patron garde son identifiant, son invariant « une seule composition chaleur par dossier » et ses tests.
- **Doivent rester indépendantes :** `territory-size-multiple-consequences` (aucun rapport avec le logement) et `wildfire_exposure` (un autre phénomène que la chaleur, priorisable à part ; l'invariant le dit déjà, `fact-compositions.ts:348`).
- **Risques de redondance avec les synthèses :**
  1. La synthèse IA du Logement croise déjà chaleur et confort d'été. Si le pilote ajoute la même relation au dossier, **avec un autre seuil**, le lecteur lira deux jugements différents sur la même question. D3 règle le problème : un seul signal.
  2. La phrase « Dans le climat futur » (n° 15) redit la même chose, sans fondement. Elle doit disparaître au profit de la sortie du pilote.
  3. La synthèse Territoire ne croise rien : aucun risque.
  4. Avec `douceur_climat` confirmée, la douceur se lit deux fois : carte condition et côté favorable du tradeoff (FUT-90, hors périmètre 3). C'est une redite, à régler dans FUT-17.

## D. Anomalies et incohérences : preuves

### D1. S1 — la condition inverse un constat favorable

**Cause.** `condition-rules.ts:38` pose `DEFAVORABLES = new Set(["mismatch", "verification"])`, et `signalDe` (`:51`) rend `"defavorable"` dès qu'une règle du critère a rendu `verification`. Or trois règles rendent `verification` pour un constat **neutre ou favorable**, parce qu'une présence se contrôle sans être défavorable :
- `autour.acces-soins` : médecin recensé ;
- `autour.gare` : gare recensée ;
- `secteur.equipement-auto` : quartier moins motorisé que la commune.

Le texte de la carte reprend en plus `POURQUOI_PREFERENCE` (« Cette lecture est faite à l'échelle de la commune », `:162`) quel que soit le grain des faits réunis.

**Sonde** : vraie chaîne `runRules` → `assembleDossier`. Commune Châtelaillon-Plage, rang `acces_soins` **fictif** à 0,85-0,90. Médecin à 553 m, forme exacte de la fixture de `autour-rules.test.ts`. Résultat :

```
=== commune seule, CONFIRMÉE
 [incompatibilities] condition_check status=Ouverte · plutôt favorable | Pour l'accès aux soins, Châtelaillon-Plage se situe parmi les 20 % de communes où il est le plus favorable en France.
=== adresse, CONFIRMÉE
 evaluations soins: territoire.mismatch-acces_soins=satisfied, territoire.alignment-acces_soins=satisfied, autour.acces-soins=verification, condition.acces_soins=condition_check
 [incompatibilities] condition_check status=Ouverte · plutôt défavorable | Un médecin généraliste se trouve à environ 550 m de cette adresse.
    whyNotDecided: Cette lecture est faite à l'échelle de la commune, sans seuil fixé par vous. Elle éclaire votre condition sans pouvoir la trancher.
    consequence: Ce que l'on sait penche contre cette condition. Elle reste ouverte : à vérifier avant de décider.
```

Même résultat avec une gare à 600 m (`acces_transports`) et un secteur à 45 % de ménages motorisés contre 70 % dans la commune (`faible_dependance_auto`) :

```
=== acces_transports | … autour.gare=verification, condition.acces_transports=condition_check
 Ouverte · plutôt défavorable | Une gare se trouve à environ 600 m de cette adresse. | Ce que l'on sait penche contre cette condition. …
=== faible_dependance_auto | … secteur.equipement-auto=verification, condition.faible_dependance_auto=condition_check
 Ouverte · plutôt défavorable | Dans ce secteur, 45 % des ménages disposent d'au moins une voiture, contre 70 % dans l'ensemble de la commune … | Ce que l'on sait penche contre cette condition. …
```

**Pourquoi ce n'est pas qu'un libellé.** Le constat affiché perd le rang favorable : l'alignement est absorbé par la carte. Le statut dit l'inverse des deux faits réunis. Et la carte trône en tête, dans « Vos conditions sans compromis ».

**Piste de correction**, à décider dans le ticket de correctif et non ici : une `verification` ne vaut pas signal. Le signal se lit sur les seules issues de rang (`mismatch`, `satisfied`, `neutral`) ; les constats de proximité restent réunis comme **preuves et gestes**. `whyNotDecided` dit le grain réel. Tests : le cas ci-dessus, en assertion sur le **texte** et le **statut**.

### D2. S2 — « progression des nuits chaudes » sans donnée

**Où.** `ThermalComfortSection.tsx:67-73` construit la phrase à partir du seul nom de la commune. Le rendu est **inconditionnel** (`:157`), et le composant est monté par `LogementModule.tsx:590` dans `/rapport/logement`.

**Mesure DRIAS, horizon 2050** (anomalie des nuits tropicales par rapport à 1976-2005) :

| Seuil | Communes |
|---|---|
| < 0,5 nuit | **151** (0,4 %) |
| < 1 nuit | 239 |
| < 2 nuits | 1 020 |

Médiane : 9,2 nuits. Les communes sous 0,5 nuit sont surtout dans les Hautes-Alpes (59), en Savoie (46), dans les Alpes-de-Haute-Provence (17) et en Isère (13). Exemples : Barcelonnette (0,2 nuit projetée en 2050), Allos (0,1), Jausiers (0), Briançon (0,2). Pour ces communes, la phrase affirme une progression que la source même du produit ne montre pas.

**Gravité.** Faible à modérée : portée limitée, et la phrase reste prudente sur la suite. Mais elle viole l'invariant 3 (« rien n'est affirmé sans source »), et elle sera **lue à côté** du pilote si on ne la remplace pas.

**Piste.** Elle disparaît avec le pilote (D3). En correctif immédiat, la conditionner au verdict canonique `classifyClimateComfort`.

### D3. I2 — deux signaux chaleur, deux conventions

- **Moteur :** jours > 35 °C ≥ 8, ou nuits tropicales ≥ 25 (valeurs **projetées** 2050, seuil déclaré). Seuil ambiant : 10 jours ou 39 nuits.
- **Synthèse IA du Logement :** surcroît par rapport à 1976-2005 ≥ 20, sur les nuits tropicales ou les jours > **30 °C** (« marquee » seulement).

Croisement sur 35 006 communes :

| | Moteur signale (seuil déclaré) | Moteur ne signale pas |
|---|---|---|
| **Synthèse « marquee »** | 4 757 | **523** |
| **Synthèse muette** | **778** | 28 948 |

Contre le seuil ambiant, 2 609 communes sont « marquee » pour la synthèse sans constat ambiant. Rien n'est faux pris isolément : l'une parle de **hausse**, l'autre de **niveau**. Mais sur 1 301 communes, le dossier et la synthèse disent deux choses différentes de la même chaleur. Le pilote doit en choisir une (D3).

### D4. I1 — transports contre chaleur

La note `faible_chaleur` vaut 100 moins le percentile moyen de quatre indicateurs de chaleur. La règle déclenche à ≤ 40, c'est-à-dire chez les 40 % les plus chaudes environ ; la règle chaleur ne déclenche qu'autour du 90e percentile.

Sur 34 788 communes lues, le compromis peut se produire pour **4 932** d'entre elles, si les deux priorités sont déclarées :
- **2 796** (12,1 millions d'habitants) sont **sous** le seuil de la règle chaleur. Le dossier dit à la fois « exposition sous le seuil de signalement », silencieusement, et « Votre priorité de faible exposition à la chaleur est moins bien satisfaite ici », en carte.
- **2 136** sont au-dessus. Le lecteur y lit **deux** cartes chaleur, plus la carte transports.

Ce n'est pas une contre-vérité : « moins bien » est relatif. C'est une convention double sur un même critère, exactement ce que `AGENTS.md` demande d'éviter. À traiter dans FUT-17 ou dans D7.

### D5. Dépendance connue, déjà prise en charge : FUT-104

Les lignes DRIAS des codes 97x dans `public/data_climat.json` portent des valeurs de type métropole : Les Abymes, 2,5 nuits tropicales en 2050. Le correctif `hotfix/fut104-exposition-donnees-outremer` existe mais **n'est pas sur `main`** au 16/10. Le pilote doit **exclure l'outre-mer** tant qu'il n'est pas fusionné.

## E. Les candidats

### E.1 Matrice de classement

| # | Candidat | Données présentes | Données manquantes | Nouveauté décisionnelle | Respect du projet | Sait s'abstenir | Difficulté | Risque scientifique | **Verdict** |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Chaleur future × logement × priorité ou constat ambiant** | DRIAS commune 2050 ; diagnostic (niveau, indicateur, caractéristiques, date) ; poids, intention, relation au lieu | Étage, orientation, usage nocturne (pas de donnée publique fiable) | **Haute** : une carte de moins, un geste précis, et le manque devient une vérification | Oui : poids, constat ambiant, condition | Oui : 4 cas d'abstention (§F.5) | S/M | Faible | **Pilote FUT-20** |
| 2 | **Argiles / plan sécheresse × type de bâti × intention** | Aléa argiles (parcelle), libellé du plan, sinistres sécheresse (commune), intention, type et année du **diagnostic** quand il existe | Type de bâti sans diagnostic (75 à 86 % des adresses) ; « intention de travaux » absente du projet | **Haute** : le même aléa n'engage pas une maison de plain-pied et un 4e étage en immeuble | Oui via l'intention ; ne jamais inventer « travaux » | Oui : type inconnu → vérification « maison ou immeuble ? » | M (enrichissement) | Faible à modéré, à sourcer (BRGM, CCR) | **Rang 2**, après enrichissement |
| 3 | **Littoral × adresse × intention** | Liste des communes inscrites au titre du recul du trait de côte (`littoral-trait-de-cote.json`, 371) ; recul observé Cerema (commune) ; distance adresse-rivage (`mesurerMerAdresse`, FUT-33) ; libellé du plan au point | Zones locales d'exposition à 30 et 100 ans (non intégrées) | **Haute** pour les communes concernées : signalé P1 par l'audit FUT-67 | Oui via l'intention | Oui : hors commune inscrite → rien ; zone inconnue → vérification seulement | M | Modéré : **uniquement en vérification** ; relecture juridique à faire (information acquéreur et locataire) | **Rang 3** |
| 4 | **Services territoriaux × voisinage × besoin** | Déjà fait pour les soins et la gare (n° 8) | Collèges et lycées dans les fichiers BPE ; « besoin du foyer » absent du projet | Moyenne : c'est **l'extension d'un rail existant**, pas une nouvelle composition | Oui | Oui | S par critère | Faible | **Pas une composition FUT-85** ; corriger S1, puis étendre le rail (écoles) |
| 5 | **Chaleur × bruit × ventilation nocturne** | Distance aux grandes infrastructures (adresse) ; « traversant » et « ventilation » du diagnostic (niveau A seulement) ; bruit communal mesuré depuis le centre de la commune | Bruit en façade (cartes stratégiques non agrégées), orientation des chambres, usage des fenêtres | Faible à moyenne : une question de visite | — | Doit s'abstenir presque toujours | M | **Élevé** : une distance n'est pas un niveau de bruit (`autour-infrastructures.ts`) | **Hypothèse de recherche.** Au mieux, plus tard, une ligne de vérification du pilote |
| 6 | **Mobilité territoriale × gare × trajet personnel** | Trajet voiture ou marche vers le lieu déclaré ; gare la plus proche ; rang ferroviaire communal | Temps en transport en commun (aucun routage transit) ; fréquences | Faible aujourd'hui : on ne peut pas dire « ce trajet se fait en train » | — | — | L (données) | Élevé sans transit | **Enrichissement de données d'abord** (horaires transport) |
| 7 | **Permis × logement × priorité** | Permis créant des logements (adresse, rayon, date) | Taille, nature, emprise, effets ; rattacher à `cadre_calme` a été écarté (`permis-rules.ts:10`) | Faible | Ne pas inventer « je veux savoir ce qui se construit » | — | M | Élevé | **Écarter** pour FUT-85 |
| 8 | **Îlot de chaleur du quartier × confort du logement** (proposé) | Îlot de chaleur grand-IRIS (596 communes denses), diagnostic | Couverture rurale nulle | Moyenne : l'îlot de chaleur pèse surtout la nuit, donc sur la récupération dans le logement | Oui | Oui (hors couverture → rien) | S une fois le pilote fait | Faible, si l'on ne prédit rien | **v2 du pilote** (un côté quartier), pas une composition à part |

### E.2 Les candidats retenus, challengés

**Candidat 1 : voir §F.**

**Candidat 2 — Argiles × type de bâti × intention.**
- *Question :* « Le sol est argileux ; ce bien-là est-il concerné, et que dois-je demander ? »
- *Grains :* aléa argiles à la parcelle ; plan au point ; sinistres sécheresse à la commune (ONRN) ; type et année au bâtiment ou au logement (diagnostic) ; intention dans le projet.
- *Relation admissible :* la vulnérabilité au retrait-gonflement concerne d'abord les maisons individuelles sur fondations superficielles. La formulation exacte et sa source (BRGM, CCR) sont à établir avant toute rédaction. Elle autorise à dire « cette exposition concerne d'abord les maisons individuelles ; d'après le diagnostic, ce bien en est une », et à cibler le geste : historique des fissures, travaux de fondations, sinistres déclarés.
- *Ce que le lecteur apprend :* que l'aléa le concerne pleinement, ou surtout par l'immeuble, et quoi demander.
- *Change-t-il une action ?* Oui : un achat de maison en aléa fort appelle une demande précise ; un appartement en étage, beaucoup moins.
- *Autorisé par les faits ?* Oui pour le type (diagnostic), non pour l'état des fondations : jamais « ce bien risque des fissures ».
- *Projet :* l'intention (achat, location, habitant) choisit le geste. Le projet ne porte **pas** d'intention de travaux : on ne l'invente pas.
- *Abstention :* type inconnu → vérification « S'agit-il d'une maison individuelle ? » ; aléa faible ou absent → rien.
- *Prochaine action :* déjà écrite dans `GESTES.bati` (quatre variantes selon l'intention), à préciser par type de bâti.
- *Difficulté :* moyenne. Il faut le type de bâti dans les faits Logement (le diagnostic l'a déjà), puis une source hors diagnostic à arbitrer (D8).

**Candidat 3 — Littoral × adresse × intention.**
- *Question :* « La commune est concernée par le recul de la côte : ce bien l'est-il ? »
- *Grains :* inscription au titre du recul du trait de côte (commune, officiel) ; recul observé (commune, Cerema, environ 50 ans) ; distance au rivage (adresse) ; plan littoral au point (adresse).
- *Relation admissible :* **seulement une vérification**. On ne connaît pas les zones locales à 30 et 100 ans, donc on ne dit jamais « ce bien est (ou n'est pas) dans la zone ». On dit : la commune est inscrite, l'adresse est à N m du rivage, la carte locale d'exposition (quand elle existe) et l'état des risques remis à l'achat ou à la location disent si le bien est concerné. Ce dernier point est **à confirmer juridiquement**.
- *Ce que le lecteur apprend :* un risque majeur, aujourd'hui absent du Logement (audit FUT-67, P1).
- *Abstention :* commune non inscrite → rien ; distance au rivage inconnue → constat communal seul, sans aucune distance supposée.
- *Seuil de distance :* aucun en v1 (on n'en invente pas). On signale toute adresse d'une commune inscrite, avec sa distance.
- *Difficulté :* moyenne. Les données sont là ; ce qui coûte est la relecture juridique et éditoriale.

### E.3 Pourquoi pas davantage

- **Services (4) :** le patron existe et marche (n° 8), après S1. L'étendre aux écoles dépend d'une donnée (collèges et lycées dans les fichiers BPE), pas d'une composition.
- **Bruit × ventilation (5)** et **mobilité × trajet (6) :** la conclusion intéressante (« on ne pourra pas ouvrir la nuit », « ce trajet se fait en train ») porterait sur ce que nos données **ne mesurent pas**. La règle 3 de la mission l'interdit.
- **Permis (7) :** la doctrine du module a déjà écarté le rattachement à une priorité, pour de bonnes raisons.

## F. Spécification initiale du pilote FUT-20

### F.1 La question

> « Les étés deviennent plus durs ici. Ce logement-là m'aidera-t-il à les supporter, et que dois-je vérifier avant de m'engager ? »

### F.2 Les champs nécessaires (tous existants)

| Échelle | Champ | Source dans le code | Grain |
|---|---|---|---|
| Territoire | `joursTresChauds` et `nuitsTropicales` (projeté 2050, référence 1976-2005, seuil) | `climat-facts.ts`, `buildClimatFacts` | commune |
| Territoire | Verdict déclaré ou ambiant et son fondement | `classifyClimateComfort(c, exigence)` (`climat-facts.ts:294`) | commune |
| Territoire | Issues de `territoire.climat-chaleur` et `territoire.verification-chaleur-future` | `materiality-rules.ts:330`, `:387` | commune |
| Logement | Niveau de preuve (A logement / B1 bâtiment / C aucun), indicateur (bon / moyen / insuffisant), caractéristiques (traversant, protections, inertie, ventilation, brasseurs), mention « immeuble » | `deriveThermalEvidence(savedDpe)` (`thermal-evidence.ts:94`) | adresse (logement ou bâtiment) |
| Logement | Date du diagnostic | `DpeRecord.date_dpe` | — |
| Projet | Poids `faible_chaleur` (0 à 3), condition confirmée, intention et relation au lieu (pour choisir le geste) | `preferenceWeight`, `isConfirmed`, `bucketDuProjet` | — |

**Pas utilisés en v1 :**
- l'étage et la position sous la toiture (champs morts, audit du 03/07) ;
- l'orientation ;
- l'îlot de chaleur (v2) ;
- le bruit ;
- la synthèse IA.

### F.3 Le chemin de données

```
assembleAddressDossier(savedDpe)                              assemble-address-dossier.ts
  → buildLogementFacts(data, savedDpe)                         logement-facts.ts
      aujourd'hui : confortEteInsuffisant: boolean     ← un seuil figé déguisé en donnée (AGENTS.md)
      demain      : confortEte: ConfortEteFait (§F.8)
  → runRules : climat-chaleur | verification-chaleur-future | logement.confort-ete
  → conditionsDePreference (si faible_chaleur est confirmée)   condition-rules.ts
  → composeFacts : climate_comfort / seasonal_climate_tradeoff / (nouveau) ambient_heat_housing
                    lisent logement.confortEte et absorbent logement.confort-ete s'il est émis
  → assembleDossier → DossierDecisionSection / FactCompositionCard ; artefact ; conclusion-plan
Module Logement : ThermalComfortSection « Dans le climat futur » → lit le même verdict (D3)
Synthèse IA     : climat_projete → dérivé du même verdict (D3), plus de seuil parallèle
```

### F.4 Les règles de déduction admissibles

1. **Le climat ne change pas le diagnostic, il en change le poids.** C'est déjà la doctrine du prompt Logement v6, reprise ici en déterministe. On écrit « le diagnostic classe ce logement… », jamais « ce logement sera chaud en 2050 ».
2. **Aucune température intérieure, aucun vécu.** L'indicateur du diagnostic est réglementaire et conventionnel (`thermal-evidence.ts:115`, audit du 03/07, décision 4). Mots interdits : « vous aurez chaud », « invivable », « restera frais », « compense ».
3. **Le logement ne corrige pas la commune.** Un « bon » confort d'été n'efface pas l'écart territorial : l'issue de `climat-chaleur` est inchangée, la composition **ajoute** un côté. C'est la même règle que « un espace vert ne compense pas » (`logement-autour-chaleur.ts`).
4. **Le niveau de preuve gouverne ce qu'on dit du logement :**
   - **A (logement)** : l'indicateur et ses caractéristiques, avec la date ;
   - **B1 (bâtiment)** : « le diagnostic décrit l'immeuble », seulement les caractéristiques du bâtiment, jamais l'indicateur ;
   - **C (aucun)** : rien sur le logement, une vérification seulement.
5. **Une caractéristique non renseignée n'est pas absente.** « Protections solaires non renseignées » ne devient jamais « sans protections ».
6. **La matérialité est héritée, jamais aggravée.** Le niveau est celui du constat chaleur : `tierFor` en déclaré, `secondary` en ambiant. Un indicateur « insuffisant » ne fait pas monter la carte.
7. **Le seuil et la convention affichés sont ceux qui ont déclenché la carte** (déclaré ou ambiant), par `seuilApplicable`. C'est la leçon du 25/07 dans `AGENTS.md`.
8. **Le geste dépend de ce qui manque et de l'intention.** On cible d'abord la caractéristique décisive **non renseignée** : protections, puis traversant, puis position sous la toiture. La formulation reprend `GESTES.confort[bucket]`.

### F.5 Les cas d'information insuffisante, et ce que fait le moteur

| Situation | Composition | Ce qui s'affiche |
|---|---|---|
| Climat illisible (`c == null`, axe manquant → `uncertain`) | **Aucune** | La carte confort d'été du logement reste seule, sans mot sur le climat |
| Chaleur sous le seuil appliqué (`satisfied`) | **Aucune** | Idem. Pas de « progression ». Voir D2 pour le cas limite |
| `faible_chaleur` au poids 1 (mismatch silencieux) | **Aucune** (comme aujourd'hui) | La carte logement seule |
| `faible_chaleur` confirmée comme condition | Aucune composition ; **la carte condition reçoit le côté logement et le geste** (D4) | — |
| Outre-mer, tant que FUT-104 n'est pas fusionné | **Aucune** | — |
| Diagnostic B1 ou C | Composition **avec un côté « vérification »** | §F.6, cas 2 |
| Pas d'adresse (dossier commune) | Composition actuelle, inchangée (« Renseignez votre adresse… ») | — |

### F.6 Trois restitutions représentatives

> **Statut des exemples.** Les chiffres climatiques sont les **vraies** valeurs DRIAS du dépôt. Les logements sont les **fixtures FUT-87** (`src/components/prototypes/fut87/fixture-logement.ts`) : adresses fictives, valeurs énergétiques d'un diagnostic public détaché de son adresse. **Aucun exemple n'est le résultat réel d'un logement.** Les textes « proposés » sont des brouillons à soumettre à l'Editorial Writer, pas des formulations arrêtées.

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
> *À demander avant de vous engager* : quelles protections solaires existent (volets, stores), et si les chambres peuvent être aérées la nuit. Ce sont les deux leviers que le diagnostic ne renseigne pas.
> *Limite* : l'indicateur décrit le bâti dans des conditions conventionnelles, pas la température que vous ressentirez.

Ce que le lecteur gagne : il n'a plus à rapprocher lui-même deux cartes éloignées, il sait quoi demander, et le dossier perd une carte. Le dossier n'a rien affirmé de plus que les deux constats.

**Cas 2 — Une caractéristique décisive manque et devient une vérification.**
Nîmes. Logement : fixture « immeuble », appartement de 1972, diagnostic **généré à l'immeuble** (niveau B1 : inertie lourde, VMC simple flux, murs insuffisamment isolés). Même projet.

*Aujourd'hui (sonde)* : la carte chaleur dit « Regardez comment le logement tient l'été ». Rien ne dit que le diagnostic retrouvé ne décrit pas cet appartement.

*Proposé* :
> **Des étés plus chauds ; ce que l'on ne sait pas encore de cet appartement**
> *À l'échelle de la commune* : (même constat).
> *Ce que dit le diagnostic retrouvé* : il décrit l'immeuble (murs à forte inertie, ventilation mécanique), pas cet appartement. Il ne dit ni s'il est traversant, ni s'il a des protections solaires, ni s'il est sous les toits.
> *À demander* : si l'appartement est traversant et s'il est au dernier étage. Ces deux points ne figurent dans aucune base publique fiable, et ce sont eux qui pèsent le plus en été.

Variante C (fixture « sans-dpe ») : « Aucun diagnostic n'est rattaché à ce logement » et « Demandez le diagnostic de ce logement : il renseigne son comportement en été ». C'est le geste `diagnostic_adresse` existant quand l'adresse en porte. Ce cas est le **plus fréquent** (75 à 86 % des adresses) : c'est lui qui rend le pilote utile au plus grand nombre.

**Cas 3 — Aucune conclusion croisée n'est admissible.**
Briançon (05023). DRIAS 2050 : 0,2 nuit tropicale, 0 jour > 35 °C. Logement : fixture « témoin » (indicateur insuffisant). `faible_chaleur` au poids 3.

*Proposé* : **aucune composition.** `climat-chaleur` rend `satisfied` ; la carte « Confort d'été insuffisant » reste seule, sans un mot sur le climat.

*Aujourd'hui*, le module Logement affiche pourtant « Avec la progression des nuits chaudes à Briançon, les caractéristiques décrites ci-dessus prendront davantage d'importance » (S2). Le pilote supprime cette contradiction.

*Cas limite à arbitrer (D2)* : La Rochelle (17300), 23 nuits tropicales projetées pour un seuil de 25. Le moteur dit « sous le seuil » et le verdict « semble bien correspondre à votre projet ». La carte « Confort d'été insuffisant » reste détachée de la priorité. Ma recommandation est de ne **pas** composer en v1, parce que composer sous le seuil reviendrait à déplacer le seuil sans le dire.

### F.7 L'emplacement dans le vrai dossier

- **Dossier de décision** (`/rapport` → `DossierDecisionSection` → `FactCompositionCard`). La carte reste dans **sa section actuelle** :
  - « Ce qui correspond moins bien » pour la priorité déclarée ;
  - « Ce qui départage vraiment » pour le tradeoff ;
  - « À contrôler » pour le constat ambiant.

  La carte « Confort d'été insuffisant » est **absorbée** ; elle reste lisible au dépliable de la composition, comme tout fait absorbé. Le sujet du héros (« des étés supportables ») ne change pas. L'action reprise mot pour mot par la conclusion devient l'action ciblée.
- **Module Logement** (`ThermalComfortSection`) : le bloc « Dans le climat futur » lit le même verdict, ou disparaît quand la chaleur est sous le seuil.
- **Aucun nouvel écran, aucun nouveau module, aucun score.**

### F.8 Contrat de données et tests proposés

**Contrat**, une proposition à discuter, pas un code :

```ts
// Dans LogementFacts : la SOURCE, pas un booléen précalculé (AGENTS.md, « un champ pré-calculé est un seuil figé »).
// `confortEteInsuffisant` en devient une dérivation, ou disparaît.
type ConfortEteFait = {
  niveau: "logement" | "batiment" | "aucun";           // A / B1 / C de deriveThermalEvidence
  indicateur: "bon" | "moyen" | "insuffisant" | null;  // non nul SEULEMENT si niveau = "logement"
  caracteristiques: { cle: "traversant" | "protection" | "inertie" | "ventilation" | "brasseur";
                      libelle: string; sens: "favorable" | "defavorable" | "neutre" }[];
  nonRenseignees: ("traversant" | "protection")[];     // ce que le diagnostic ne dit pas (≠ absent)
  dateDiagnostic: string | null;
};

// Dans les compositions : UN côté de plus, réutilisant la brique existante.
// MismatchWithActionComposition & TradeoffComposition gagnent :
logement?: CompositionSide;      // grain adresse ; absent = rien à dire du logement (cas 3)
// GroupedVerificationComposition : patternId étendu à "ambient_heat_housing" (constat ambiant + logement).
// absorbedFactIds inclut `${insee}:logement-confort-ete` quand ce fait a été émis.
```

**Tests**, en suivant la règle « la carte apparaît » ≠ « la carte dit vrai » :

1. **Contrat** : `ConfortEteFait` depuis les fixtures A-bon, A-moyen, A-insuffisant, B1 immeuble, B1 sans bloc, C, et des champs nuls. L'indicateur n'est jamais présent hors niveau « logement ».
2. **Matrice de déclenchement** :
   - climat : défavorable déclaré, défavorable ambiant, sous le seuil, incertain, nul ;
   - logement : A, B1, C, pas d'adresse ;
   - projet : poids 0, 1, 2, 3, confirmé.
   On vérifie le type de composition, les identifiants absorbés et la section, et que la composition chaleur reste unique par dossier.
3. **Ce que la carte dit** (assertions sur le texte) :
   - aucun mot de vécu ou de température intérieure ;
   - « indicateur » seulement au niveau A ;
   - « immeuble » ou « bâtiment » au niveau B1 ;
   - jamais « progression » ou « hausse » quand le climat est sous le seuil ou nul ;
   - la convention affichée est le seuil appliqué (déclaré ou ambiant) ;
   - les grains des preuves sont la commune pour la trajectoire et l'adresse pour le diagnostic ;
   - une caractéristique non renseignée n'est jamais dite absente.
4. **Non-régression** : `assertCompositionsValid` ; FUT-90 (une condition confirmée ne se fait pas re-absorber) ; artefact sérialisé ; action reprise mot pour mot par `conclusion-plan` ; la minute compte une carte de moins.
5. **Bout en bout, vraies données climat** : Nîmes (déclenche par les deux axes), Montpellier (7,6 jours, sous le seuil de 8, mais 72 nuits : déclenche par les nuits seules), La Rochelle (sous le seuil), Briançon (aucune chaleur). Logements : les fixtures FUT-87.
6. **Cohérence entre surfaces (D3)** : pour un même INSEE, le bloc « Dans le climat futur » et le `climat_projete` de la synthèse découlent du même verdict que le dossier.

### F.9 Complexité et périmètre

| Lot | Fichiers | Effort |
|---|---|---|
| Contrat `ConfortEteFait` | `decision-fact.ts`, `logement-facts.ts` (+ test) | 0,5 j |
| Compositions | `fact-composition.ts`, `fact-compositions.ts` (+ tests matrice et texte) | 1,5 j |
| Rendu | `FactCompositionCard.tsx`, `lecture-dossier.ts` (relevé FUT-87/91), éventuellement `conclusion-plan.ts` (actions) | 0,5 à 1 j |
| Un seul signal chaleur (D3) | `ThermalComfortSection.tsx`, `drias-json.ts` / `logement-synthesis-cache.ts` (+ version du prompt) | 0,5 j |
| Condition confirmée (D4) | `condition-rules.ts` | 0,5 j |
| Relecture éditoriale et revue | — | 0,5 j |

**Total : 3 à 5 jours.** Effets de bord connus :
- l'empreinte narrative des **nouveaux** artefacts change (les anciens sont figés) ;
- si D3 est retenu, un changement de version du prompt Logement régénère les synthèses ;
- la suite de 1 007 tests doit rester verte.

## G. Dépendances et risques

| Dépendance ou risque | Effet sur le pilote | Parade |
|---|---|---|
| FUT-104 (outre-mer) non fusionné | Valeurs climatiques fausses en 97x | Exclure l'outre-mer jusqu'à la fusion |
| S1 (conditions) | Si `faible_chaleur` est confirmée, la carte condition porte le pilote (D4) : corriger S1 avant évite d'y greffer un signal faux | S1 avant ou avec le pilote |
| Couverture du diagnostic (A ≈ 18 à 20 % des adresses, aucun diagnostic attribuable pour 75 à 86 %) | Le cas riche est minoritaire | Concevoir d'abord pour B1 et C (cas 2), comme l'exige l'audit du 03/07 |
| Fraîcheur du diagnostic | Une caractéristique a pu changer | Date affichée, phrase « peut avoir changé depuis » déjà en production |
| Deux signaux chaleur (I2) | Contradiction dossier / synthèse | D3 |
| Tentation d'élargir (îlot de chaleur, bruit, étage déclaré) | Dérive d'ambition | v2 seulement ; l'étage passe par le brief « ce que le lecteur sait de son logement », jamais comme donnée sourcée |
| FUT-50 en cours ailleurs | `feat/fut-50-socleom-integration` modifie `src/lib/drias-json.ts` (jointure DRIAS) : c'est le fichier de `deriveClimatProjete`, que D3 touche. Aucun autre fichier du pilote n'est concerné (vérifié par diff au 16/10). | Faire le lot D3 **après** la fusion de FUT-50, ou le limiter à `logement-synthesis-cache.ts` et `ThermalComfortSection.tsx` |

**Fréquence, en ordre de grandeur** : 28,7 % de la population vit dans une commune au-dessus du seuil chaleur déclaré (5 461 communes). Pour un lecteur qui déclare cette priorité, le pilote change donc la carte chaleur environ une fois sur quatre. Dans la majorité de ces cas, il le fait par le cas 2.

## H. Recommandations d'architecture, minimales

**À décider maintenant** : sinon, de la dette.

1. **Un seul signal chaleur.** `classifyClimateComfort` est la seule source du « la chaleur est-elle un enjeu ici ». `deriveClimatProjete` et `ClimateFuture` en dérivent. C'est la leçon du 25/07 : quand une valeur gouverne une décision, tous ses points de citation doivent suivre.
2. **Des faits Logement qui portent leurs champs.** `confortEteInsuffisant` est le booléen précalculé que `AGENTS.md` décrit comme un seuil figé déguisé en donnée. Le remplacer par `ConfortEteFait` avant d'en dépendre.
3. **Une composition peut porter un côté d'un autre grain** (`logement?: CompositionSide`). C'est la seule extension de type nécessaire aux candidats 1, 2 et 3. La brique `CompositionSide` porte déjà preuve, action, limite et état.
4. **Une `verification` n'est pas un signal défavorable.** S1 montre que l'issue d'une règle sert à deux choses qu'il faut séparer : « il y a quelque chose à contrôler » et « cela penche contre la priorité ». La correction se fait **dans `condition-rules.ts`**, pas par un nouveau champ générique, tant qu'un second cas ne le réclame pas.

**À différer sans dette :**

5. Un moteur générique ou un langage déclaratif de composition (cinq, puis huit patrons tiennent dans un fichier).
6. La découverte automatique de relations (contraire à l'invariant 5 du registre).
7. Les compositions rédigées par l'IA : l'IA ne fait que reformuler, dans `compositions_found`.
8. L'entrée de l'îlot de chaleur, du bruit en façade et des permis dans le moteur.
9. Un rattachement général des constats Logement aux priorités (D2) : à traiter avec la doctrine des échelles, pas au détour du pilote.

**Recommandation d'ensemble :** **améliorer le mécanisme existant plutôt qu'en créer un nouveau.** Le pilote est une extension de `climate_comfort`, du tradeoff saisonnier et du constat ambiant, avec un type élargi d'un champ.

## I. Articulation avec FUT-17 et le lancement

- **FUT-85 et FUT-20 ne sont pas des prérequis au lancement.** La bibliothèque V1 (cinq patrons et mécanismes B.2) est sûre une fois S1 et S2 corrigés.
- **À sortir tout de suite, dans un ticket de correctif** (pas dans cette branche) :
  - S1 (élevée) ;
  - S2 (faible à modérée), en conditionnant la phrase au verdict canonique en attendant le pilote.
- **Pour FUT-17**, la V1 réellement présente à auditer :
  - les cinq patrons, avec leurs titres et résumés écrits à la main ;
  - la carte condition (textes `POURQUOI_*`, `consequenceDuSignal`) ;
  - la règle transports contre chaleur (I1, D7) ;
  - la redite de la douceur (C.4) ;
  - la double temporalité du tradeoff (B.1.1) ;
  - le manque d'assertions sur le texte dans `fact-compositions.test.ts`.
  Les formulations de `climate_comfort` et du côté défavorable du tradeoff ne valent pas d'être polies si D1 est retenu : le pilote les réécrit.
- **Relations Linear** : non modifiées.

## J. Reproductibilité

Les sondes ont été écrites **temporairement** dans `src/lib/decision/` (pour les imports relatifs), lancées par `node --test`, puis supprimées : `git status` est propre après chaque exécution. Pour en rejouer une, recopier son code dans `src/lib/decision/zz-sonde.test.ts` et la supprimer ensuite.

**J.1 — S1, condition × proximité.** Construit un projet `acces_soins` au poids 3, avec et sans confirmation (`buildConfirmation`). Index : `rankBands.acces_soins = [8500, 9000]` (**fictif**). Snapshot Autour avec un médecin à 553 m, dans la forme de `autour-rules.test.ts`. Puis `runRules` → `assembleDossier(..., composeFacts(...))`, et impression des cartes `condition_check` (statut, constat, `whyNotDecided`, `consequence`). Même chose pour `acces_transports` (gare à 600 m) et `faible_dependance_auto` (`secteur.equipementAuto = { share: 45, communeShare: 70, ecart: -25 }`).

**J.2 — Chaleur × logement.** Entrées de l'index et scénarios DRIAS **réels** (gwl15, 20, 30) de Nîmes, La Rochelle et Briançon, extraits de `data/comparateur-index.json.gz` et `public/data_climat.json`, puis `buildClimatFacts`. Logements construits à partir de `casDeLogement("temoin" | "immeuble" | "sans-dpe").dpe` (fixtures FUT-87) par `deriveThermalEvidence`. Projets : `faible_chaleur` au poids 3, seul ou avec `douceur_climat` au poids 2, ou non déclarée. Sortie complète reproduite en §F.6 et C.

**J.3 — Statistiques DRIAS** (Python, lecture seule de `public/data_climat.json`, scénario `gwl20`) : colonnes `column08` (NORTX35D), `column10` (NORTR), `column24` (ATX30D), `column25` (ATR).
- **D2** : compte des communes où ATR < 0,5, < 1 et < 2.
- **D3** : `marquee = max(classe(ATR), classe(ATX30D)) == 2` (classe 2 si ≥ 20), comparé à `NORTX35D >= 8 or NORTR >= 25` (déclaré) et `>= 10 / >= 39` (ambiant).

**J.4 — Transports contre chaleur** (Python, index et DRIAS) : `faible_chaleur = 100 - moyenne(pct[NORTX30D, NORTX35D, NORTR, NORTMm_seas_JJA])`, `acces_transports = transport.desserte`. Déclenchement si ≥ 60 et ≤ 40, croisé avec le seuil déclaré DRIAS.

**J.5 — Suite** : `node --test src/lib/decision/*.test.ts` → 64 fichiers, 1 007 tests, 1 007 verts. Lancée seule, comme le recommande la mémoire du projet.
