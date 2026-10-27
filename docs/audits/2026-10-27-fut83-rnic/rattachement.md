# FUT-83 · Rattachement adresse → bâtiment → copropriété

**Date** : 27/10/2026 · **Mesures** : `mesures/rattachement.json`, `mesures/verite_terrain.json`, `mesures/cas.json`,
`mesures/bdnb_rnc.json` · **Scripts** : `scripts/fut83/rnic_index.py`, `rattachement.py`, `verite_terrain.py`,
`collecte_bdnb_rnc.py`, `collecte_dpe_copro.py`, `cas.py`.

---

## 1. Il n'y a pas de jointure directe

Le registre ne connaît **ni l'identifiant BAN, ni l'identifiant RNB**. Pour passer d'une adresse de dossier à une
copropriété, il reste quatre voies, et aucune n'est une preuve juridique d'appartenance :

| Voie | Comment | Indépendance | Limite structurelle |
|---|---|---|---|
| **Adresse déclarée** | L'adresse BAN (commune, numéro, indice, voie normalisée) figure parmi les adresses que la copropriété déclare (référence et jusqu'à 3 complémentaires, plages développées) | Indépendante de la BAN | 8,2 % des adresses de référence sans numéro ; 3 adresses complémentaires au plus publiées ; graphie libre |
| **Parcelle** | Une parcelle des bâtiments RNB de l'adresse (via la BDNB) figure parmi les 3 références cadastrales déclarées | Indépendante de l'adresse | 33 % des copropriétés sans parcelle ; une parcelle porte souvent plusieurs copropriétés (3,4 % des parcelles déclarées) ; dépend de la BDNB pour la parcelle du bâtiment |
| **BDNB** `rel_batiment_groupe_rnc` | Le CSTB relie un numéro à un groupe de bâtiments, avec une fiabilité de géocodage | **Dérivée** (le CSTB rapproche lui-même adresse et parcelle) ; millésime 2026-02a sur un registre plus ancien | Grain : le groupe de bâtiments, pas le bâtiment ; quota de 10 000 appels par mois |
| **Numéro saisi sur un DPE ou un audit** | Le diagnostiqueur ou l'auditeur saisit le numéro | Indépendante | Rare : **1,0 %** des DPE d'appartement (1,6 % en 2026), 9,7 % des DPE d'immeuble, 16 % des audits d'immeuble ; faute de frappe ou copropriété voisine possibles |

La **proximité** (point du registre à moins de N mètres) est écartée d'emblée. Le point du registre est celui de
l'adresse de référence, et FUT-80 a montré qu'un point ne prouve rien.

**Normalisation retenue** (`rnic_index.py`) : abréviations de voie développées (« r » donne « rue », « bd » donne
« boulevard »), accents et petits mots retirés, plages « 2-10 » développées en numéros de même parité, Paris et Lyon
ramenés à l'arrondissement pour les parcelles. **L'indice « bis » n'est jamais confondu avec le numéro nu** : à La
Rochelle, le 32 et le 32 bis de l'avenue du Général-Leclerc sont deux copropriétés différentes.

---

## 2. Échantillons et résultats

### 2.1 Les 990 adresses de FUT-80 (tirage du 31/07, réutilisé)

Échantillon **A** : 800 adresses tirées uniformément dans la BAN, quatre strates. Échantillon **B** : 190 adresses
tirées depuis des DPE d'appartement ou d'immeuble, donc des immeubles collectifs. B **n'est pas** un échantillon
de copropriétés : il contient des bailleurs sociaux et des monopropriétés.

Niveaux de rattachement :

- **confirmé** : une seule copropriété à l'adresse, et la parcelle ou la BDNB désignent la même ;
- **adresse seule** : une seule copropriété à l'adresse, aucune autre voie pour corroborer ;
- **plausible sans adresse** : une seule candidate, par la parcelle ou la BDNB seulement ;
- **ambigu** : plusieurs candidates ;
- **contradictoire** : l'adresse désigne une copropriété, la parcelle ou la BDNB en désignent (aussi) une autre ;
- **aucun candidat**.

| Niveau | A (800, uniforme) | B (190, collectif) |
|---|---|---|
| Confirmé | 9 (1,1 %) | **44 (23,2 %)** [17,7 ; 29,7] |
| Adresse seule | 5 | 35 (18,4 %) |
| Plausible sans adresse | 15 | 20 (10,5 %) |
| Ambigu | 4 | 6 (3,2 %) |
| Contradictoire | 1 | 3 (1,6 %) |
| **Aucun candidat** | 766 (95,8 %) | **82 (43,2 %)** [36,3 ; 50,3] |

Lecture :

- Sur une adresse quelconque, le registre ne dit **rien** dans 96 % des cas. C'est normal : la plupart des adresses
  sont des maisons.
- Sur une adresse d'immeuble collectif, l'adresse désigne **une seule copropriété dans 42 % des cas**
  (79 / 190) [34,8 ; 48,7]. Il ne se passe rien pour 43 %. Parmi ces 82, 44 ont une copropriété immatriculée **sur
  la même voie, à un autre numéro** : adresse non déclarée, autre entrée, ou immeuble voisin, on ne sait pas lequel.
  Les autres peuvent être des logements sociaux ou des copropriétés non immatriculées. Rien ne permet de les
  distinguer.
- Quand l'adresse et la BDNB répondent toutes les deux (52 adresses de B), elles donnent **exactement le même
  ensemble dans 46 cas** et se recoupent dans les 6 autres. Ce n'est pas une confirmation indépendante : la BDNB a
  elle-même rapproché les adresses.
- **Le RNB ne change pas grand-chose.** Le rattachement se fait à l'adresse ou à la parcelle, pas au bâtiment. Les
  adresses à plusieurs bâtiments RNB (B : 64) sont confirmées aussi souvent que les autres (17), parce que le
  registre parle d'une copropriété, et une copropriété couvre souvent plusieurs bâtiments.

### 2.2 Vérité de terrain : le numéro saisi par le diagnostiqueur

382 DPE (255 appartements, 127 immeubles) qui portent un numéro de copropriété, tirés dans 43 départements entre 2022
et 2026, et 160 audits énergétiques. Pour chacun, on cherche l'adresse BAN du document dans le registre, **sans
regarder le numéro**, puis on compare.

| Résultat de la recherche par l'adresse | DPE (382) | Audits (160) |
|---|---|---|
| **Une seule copropriété, la même que le numéro saisi** | 250 (65,4 %) | 87 (54,4 %) |
| Plusieurs copropriétés, dont la bonne | 9 (2,4 %) | 3 |
| **Une seule copropriété, une autre** | **11 (2,9 %)** | 2 |
| Rien trouvé | 109 (28,5 %) | 68 (42,5 %) |
| Numéro saisi inconnu du registre | 3 | 0 |

**Quand l'adresse donne une réponse unique, elle concorde avec le numéro saisi 250 fois sur 261 : 95,8 %**
[92,6 ; 97,6]. Dédoublonné par couple copropriété-adresse, le taux est de 233 sur 244, soit 95,5 % [92,1 ; 97,5].
Pour les audits : 87 sur 89.

Les 11 désaccords ne sont pas tous des erreurs du registre. Plusieurs viennent du DPE : à Abbeville, un DPE porte le
numéro d'une copropriété d'Arras. D'autres sont de vraies ambiguïtés : à Issy-les-Moulineaux, le DPE du 11 rue du
Passeur-de-Boulogne désigne le « bâtiment G » (déclaré au 13), alors que le registre place le 11 dans le « bâtiment
F ». **Dans environ un cas sur 25, une réponse unique par l'adresse désigne une autre copropriété que celle du
diagnostiqueur, et rien ne dit qui a raison.**

Cet échantillon est **biaisé favorablement** : un diagnostiqueur qui saisit un numéro travaille sur une copropriété
connue et immatriculée. Le taux de 95,8 % est donc une estimation haute de la concordance, pas une exactitude.

---

## 3. Les cas contrastés (réels, registre du 27/10/2026)

| # | Situation | Cas réel | Ce que dit le registre | Rattachement | Faux positif possible |
|---|---|---|---|---|---|
| 1 | Petit immeuble, une adresse, une copropriété | 42 rue Champlain, Le Havre (`AA2109551`) | 8 lots, 8 logements, avant 1949, syndic professionnel | **Confirmé** (adresse et parcelle) | Faible |
| 2 | Grand immeuble, plusieurs entrées | 20 rue de Gramont, Paris 2e (`AA2099810`) | Entrées 6 rue Grétry et 1 rue de Marivaux déclarées ; 39 lots dont 18 logements | Unique par l'adresse depuis chacune des trois adresses | Faible, tant que les entrées sont déclarées |
| 3 | Copropriété de plusieurs bâtiments | « Promenade Pagnol », Bruz (`AC3107489`) | Adresse de référence sans numéro, 6 adresses complémentaires annoncées, 3 publiées, place et rue Marcel-Pagnol sans numéro | **Impossible** par l'adresse ; parcelle seulement | **Oui** : au 18 place Marcel-Pagnol, l'adresse donne « SDC Le Pagnol » (`AC9809385`), la parcelle et la BDNB donnent les deux |
| 4 | Plusieurs copropriétés sur une parcelle | 83 avenue de la Jarre, Marseille 9e | **Deux copropriétés à la même adresse** (Cadran Sud, 100 logements ; Cala Blue, 42) et une troisième sur la parcelle (Trio Sud, 7 rue Yann-de-l'Écotais) | **Ambigu** | **Oui** : attribuer « 100 logements » au mauvais lot |
| 5 | Résidence à plusieurs adresses, syndicats emboîtés | 64-70 rue de la Fédération, Paris 15e | Syndicat principal `AC8133944` (64-74, 61 logements) et secondaire `AD9092834` (64-70, 43 logements), même adresse de référence ; périodes de construction différentes (1949-1960 contre 1975-1977) | **Ambigu** à toutes les adresses communes | **Oui** : deux tailles et deux époques pour le même logement |
| 6 | Logements et commerces | 6 rue de Bayard, Toulouse | Deux copropriétés à l'adresse : « Les Jardins tolosans » (348 lots, 94 logements) et « 6 rue de Bayard » (15 lots, 4 logements) ; 4 bâtiments RNB | **Ambigu** | **Oui** : rapport de 1 à 23 sur la taille |
| 7 | Copropriété récente | « Cala Blue », Marseille (`AH8837106`), immatriculée le 02/12/2022 | Période « De 2013 à 2021 » (ancienne nomenclature : « à compter de 2011 ») | Ambiguë (cas 4) | Le récent n'est pas le problème ; la colocation d'adresse, si |
| 8 | Immeuble sans correspondance | 7 rue Péan, Paris 13e ; 4 cité du Champ-de-Foire, Arpajon-sur-Cère | Aucune copropriété à l'adresse, aucune sur la voie | **Aucun** | Afficher « pas de copropriété » serait faux : monopropriété, bailleur social ou non-immatriculation, on ne sait pas |
| 9 | Adresse au rattachement RNB ambigu | 103 boulevard de l'Embouchure, Toulouse (4 bâtiments RNB) | Deux copropriétés à l'adresse (« Résidence du Canal du Midi », 16 logements ; « Les Sénioriales », 64) ; une 3e sur la parcelle (« Les Sénatoriales volume 1 », déclarée au 114, même taille que les Sénioriales) | **Ambigu** | **Oui** ; et une copropriété « volume » montre que le syndicat peut ne couvrir qu'une partie d'un bâtiment |
| 10 | Plusieurs candidates plausibles et sans adresse | Impasse Blandine, Saint-Herblain | Deux copropriétés de 12 logements sur la même parcelle (`AH9414277` sans numéro ; `AI7813280` au 2) ; l'adresse du dossier (6) n'est pas déclarée | **Ambigu** (parcelle et BDNB) | **Oui** |
| 11 | « Bis » | 32 et 32 bis avenue du Général-Leclerc, La Rochelle | Deux copropriétés : « Les Genettes » au 32 ; « SDC 32 bis » au 32 bis, qui déclare aussi le 32 en complémentaire | Le 32 bis est unique par l'adresse. **Le 32 est ambigu** (deux copropriétés le déclarent) | **Oui**, si l'on confond l'indice |
| 12 | DPE et registre en désaccord | 11 rue du Passeur-de-Boulogne, Issy-les-Moulineaux | Le registre met le 11 dans le « bâtiment F » ; le DPE dit « bâtiment G » | Unique par l'adresse, **contredit** par le DPE | **Oui** : un cas sur 25 environ (section 2.2) |
| 13 | Adresse de référence sans numéro | « Parc des Cordeliers 4, 5, 6 », La Rochelle | Trois copropriétés aux 73, 75 et 63, complémentaires « Parc des Cordeliers N » ; le 79 du dossier n'est déclaré nulle part, la BDNB rattache les trois | Ambigu (BDNB seule) | **Oui** |
| 14 | Gestion instable | « Les Horizons » et « Les Tamaris », 136 avenue de Grasse, Cannes | Les deux à « Mandat expiré sans successeur déclaré » le 03/10/2026, « Mandat en cours » en T3 2025 | Ambigu (BDNB) | **Oui, et alarmiste** : un mandat expiré au registre n'est pas une copropriété sans syndic |

---

## 4. Contre-épreuves : aucun texte rassurant ou alarmiste sans preuve

| Contre-épreuve | Ce qui se passerait avec une règle naïve | Règle qui l'empêche |
|---|---|---|
| Identifiant absent du registre (43 % des adresses collectives de B) | « Pas de copropriété », ou « copropriété non immatriculée » | L'absence ne produit **aucun texte**, ou seulement « Le registre n'a pas permis d'identifier la copropriété de cette adresse » dans la méthode |
| Plusieurs copropriétés à la même adresse (2,7 % des clés d'adresse ; cas 4, 5, 6, 9) | Afficher la première | **Aucune n'est choisie** ; au plus « N copropriétés déclarent cette adresse » |
| Copropriété de plusieurs bâtiments (cas 3, 13) | Ses lots attribués au bâtiment RNB | Le nombre est toujours dit « de la copropriété », jamais « de l'immeuble » ou « du bâtiment » |
| Bâtiment RNB sans copropriété confirmable | Conclure à une maison ou à une monopropriété | Le RNB ne participe pas à la conclusion ; il ne sert qu'à trouver la parcelle |
| Immeuble hors copropriété (bailleur social, monopropriété) | Indiscernable d'une copropriété non immatriculée | Même règle que l'absence |
| Donnée financière ancienne ou incomplète | — | Le registre ouvert n'en publie **aucune** |
| Nombre de lots ambigu (« 46 lots » au Pagnol, 18 logements) | « 46 lots » lu comme 46 logements | N'afficher que les logements, dits « déclarés au registre », avec le total dans la méthode |
| Actualisation manquante | « Données à jour au 24/08/2025 » | La date de dernière mise à jour n'est **jamais** affichée comme une fraîcheur ; on date la **consultation** |
| Service vide ou partiel (API tabulaire : 504) | « Aucune copropriété » | Hors ligne, l'état est « indisponible », jamais « absent » ; de toute façon, une lecture en direct est exclue (voir `arbitrage.md`) |
| Contradiction entre millésimes (`copro_aidee`, mandat, lots) | Afficher la valeur du jour comme un fait stable | `copro_aidee` et `mandat_en_cours` ne sont **pas** affichés ; les lots, seulement avec la date de consultation |

---

## 5. Fiabilité, en une phrase par niveau

- **Démontré** : une adresse d'immeuble collectif mène à une seule copropriété dans environ 4 cas sur 10. Quand c'est
  le cas, elle concorde avec un numéro saisi indépendamment dans environ 96 % des cas (estimation haute).
- **Démontré** : environ 3 % des adresses d'immeuble collectif mènent à plusieurs copropriétés, sans aucun moyen de
  choisir, et 43 % ne mènent à rien.
- **Probable** : le taux d'erreur réel d'une réponse unique est de l'ordre de 4 à 8 %, l'échantillon de vérité étant
  favorable.
- **Non vérifié** : le comportement sur les très grandes copropriétés à volumes (Paris, La Défense) et dans les DROM
  (peu présents dans les échantillons).
