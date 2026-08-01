# Les contrôles du dossier : rendre la liste que le verdict promet

**Date** : 2026-08-01 · **État** : spec validée, plan à écrire · **Portée** : `/rapport`

---

## 1. Le défaut

La synthèse « En une minute » sélectionne les faits qui **fondent le verdict**, sous un plafond
global de quatre cartes tous registres confondus (`MINUTE_MAX_CARTES`, mesuré au chronomètre).
Elle peut donc n'afficher **aucun** contrôle alors que le moteur en a établi plusieurs. Le
commentaire de `conclusion-plan.ts:598` le dit déjà :

> « une synthèse peut ne montrer aucun contrôle et le dossier en contenir cinq, c'est même le cas
> le plus fréquent depuis que la sélection privilégie ce qui fonde le verdict. »

Le verdict, lui, annonce le reste : « Trois autres constats figurent dans le **dossier complet**. »
Ce dossier complet vit dans `dossier.sections`, et **aucun composant ne le rend**. Recherche
exhaustive sur `src/` au 01/08/2026 : zéro consommateur.

`enPlus > 0` est donc le cas courant, et il l'est le plus sur les dossiers pauvres, ceux où chaque
élément utile pèse le plus lourd.

**Le défaut a déjà été observé à l'écran.** `decision-assembler.ts:38` documente le cas
d'Aix-en-Provence : « Un constat reste par ailleurs à contrôler » sous un dossier n'affichant
aucune section « À contrôler ». La correction d'alors a réduit `RESERVE_ROLES` au seul rôle
`verification`, ce qui a rendu le compte cohérent avec la NATURE de la section. Elle n'a pas donné
de surface à ce que le compte désigne.

Trois défauts distincts, par ordre de gravité :

| | Défaut | Fréquence |
|---|---|---|
| **D1** | Le verdict promet une surface qui n'existe pas | majoritaire |
| **D2** | Le plafond de section supprime les contrôles au-delà du quatrième, avant même qu'on les compte | dossiers riches |
| **D3** | `DecisionChecklist` calcule une seconde liste par un autre chemin | dossiers avec adresse |

---

## 2. État vérifié du code au 01/08/2026

Vérifié après les vingt commits du 30 et 31/07, chaque point par lecture directe.

| Fait | Emplacement |
|---|---|
| Plafond de 4 sur la section `verifications` | `decision-assembler.ts:123` |
| `reservesShown` compte sur l'AFFICHÉ, pas sur l'émis | `decision-assembler.ts:144`, invariant écrit ligne 131 |
| `RESERVE_ROLES = { "verification" }` | `decision-assembler.ts:43` |
| Les faits absorbés par une composition quittent les sections AVANT les plafonds | `decision-assembler.ts:93` |
| `enPlus = reservesShown − visibles` | `conclusion-plan.ts:998` |
| « figurent dans le dossier complet » | `conclusion-plan.ts:608` |
| `dossier.sections` rendu par personne | recherche exhaustive `src/` |
| `echelleDuFait` sans appelant hors de son test | recherche exhaustive `src/` |
| Le titre de la section dépend de la posture | `decision-assembler.ts:26`, `labels()` |
| `LogementModule` est `"use client"`, sans `Dossier` | `LogementModule.tsx:1` |

### Ce que le moteur peut émettre comme contrôles

Onze au maximum sur un dossier avec adresse : sept règles Logement, le radon, la chaleur future, le
feu futur, l'équipement automobile du secteur. Le nombre réellement atteint est bien plus bas, et
la mesure du 31/07 en donne la raison principale.

### La mesure qui borne l'attente

`docs/audits/2026-07-31-couverture-dpe-stratifiee.md`, 800 adresses : **75 à 86 % des adresses
n'ont aucun DPE** sur le chemin de recherche que le produit emprunte. Croisé avec la distribution
ADEME mesurée le 30/07 sur `dpe03existant` (15 292 277 diagnostics) :

| Geste | Part dans le jeu ADEME | Part des dossiers |
|---|---|---|
| `energie` (étiquette E, F, G) | 25,7 % | **3,6 à 6,4 %** |
| `confort` (confort d'été insuffisant) | 26,6 % | **3,7 à 6,7 %** |

Deux des sept gestes Logement se déclenchent environ une fois sur vingt. Cette spec ne cherche pas
à corriger cela. Elle en tient compte à deux endroits : le choix des cas de test (§7) et la
justification du verrou d'équivalence (§6).

---

## 3. Décisions prises

| Question | Décision |
|---|---|
| Le verdict compte-t-il le total réel ? | **Oui**, une fois la surface livrée. Les deux vont ensemble. |
| Où vit la liste complète ? | **Sur `/rapport`**, sous la minute. `/rapport/logement` redirige sans dossier d'adresse, or les contrôles de territoire existent sans adresse. |
| Quel périmètre ? | **Les contrôles seuls.** Les cinq autres registres gardent leur écrêtage, traité séparément. |
| Le plafond de la minute bouge-t-il ? | **Non.** `MINUTE_MAX_CARTES = 4` reste, il est mesuré sur l'écran. |

---

## 4. Le domaine : lever un plafond, ne pas créer une collection

Ajouter une collection canonique de contrôles au `Dossier` serait un quatrième calcul. Le moteur en
produit déjà une : la section `verifications`, dont seul le plafond fait obstacle.

**Le changement** : dans `assembleDossier`, la section `verifications` cesse d'être plafonnée. Les
cinq autres gardent leurs plafonds (2/3/3/3/3), qui bornent le dossier interne.

Trois conséquences en cascade, toutes voulues, aucune ligne supplémentaire :

1. `dossier.sections.verifications` porte **tous** les contrôles émis et non absorbés ;
2. `reservesShown` devient le total réel, puisqu'il compte déjà sur `shown`, dérivé de `allCards` ;
3. `enPlus` devient exact, et l'invariant « le lecteur doit pouvoir compter les cartes et retomber
   dessus » redevient tenable.

**La déduplication est acquise par construction.** Les faits absorbés par une composition
`grouped_verification` sont retirés de `facts` avant les plafonds. Une composition et ses faits
absorbés ne peuvent donc pas coexister dans la liste. La spec exige un test qui épingle cet
invariant, elle ne demande aucun code de déduplication.

**Effet de bord assumé** : la sélection de la minute reçoit plus de candidats, donc le choix des
quatre cartes peut changer sur les dossiers riches. C'est plus correct que l'état actuel, où elle
choisissait parmi un sous-ensemble tronqué par un tri de tier. La priorité des contraintes dures
est préservée par construction (`rangRole` place `incompatibility` au rang 0).

---

## 5. La surface

Nouveau composant sur `/rapport`, rendu immédiatement sous `DossierDecisionSection`, alimenté par
la section `verifications` de `sectionsAffichees(dossier)`.

### Nommage

**La vue n'est pas exhaustive du produit** et ne doit pas le prétendre. Les permis, les
infrastructures et la conclusion Autour produisent de la prose hors du moteur (§8). Le titre dit
donc ce qui est vrai : ce sont les contrôles **que le moteur a établis**.

Il suit la posture, depuis la même source que le titre de section, pour que les deux ne puissent
pas diverger. `labels()` reçoit un troisième champ :

| Posture | Section de la minute (existant) | Nouvelle surface |
|---|---|---|
| par défaut | « À contrôler avant de vous engager » | « Tous les contrôles établis pour ce dossier » |
| `habitant` | « À connaître et à surveiller » | « Tous les points à connaître et à surveiller » |

### Groupement par échelle

Par `echelleDuFait` et `echelleDeLaComposition`. Première consommation de `echelles.ts` hors de son
test.

**Piège de vocabulaire à graver.** `Echelle` vaut `territoire | quartier | logement`, où `quartier`
désigne **le secteur**. Dans `PRODUCT_MODULES`, le module d'`id: "quartier"` s'appelle
**« Territoire »**, et le secteur s'appelle **« Autour de l'adresse »** (`id: "autour"`). Le même
mot désigne deux choses opposées selon le vocabulaire. La correspondance vit dans **une seule
fonction**, testée :

```
territoire → « Territoire »
quartier   → « Autour de l'adresse »
logement   → « Logement »
```

Ordre du large au précis. Un groupe vide tombe.

**Un fait sans échelle établie** (`echelleDuFait` rend `null` quand aucune preuve ne la porte) ne se
range pas d'office dans « Territoire ». Il va dans un groupe final sans titre d'échelle. Deviner
fabriquerait une appartenance que rien ne fonde, ce que la projection existe précisément pour
éviter.

### Contenu et redondance

La liste montre **tous** les contrôles, y compris ceux déjà vus dans la minute. C'est une feuille de
contrôle qu'on emporte. Le « N autres » du verdict reste vrai : N autres existent, et la liste les
contient tous.

### Cas limites

| Cas | Comportement |
|---|---|
| Zéro contrôle | La section `verifications` est filtrée par `candidates.filter(cards.length > 0)`, la surface ne rend rien, et le verdict ne parle pas de contrôles. Cohérent. |
| Dossier commune seule | Seul le groupe « Territoire » apparaît (chaleur future, feu futur, radon). |
| Tous les contrôles déjà dans la minute | `enPlus = 0`, la surface répète la minute. Acceptable, elle reste la feuille complète. |

---

## 6. Le verdict, et la checklist du module

### Le verdict : un référent, pas une réécriture

`suiteControles` construit deux clauses indépendantes. Seule la seconde change :

| Clause | Aujourd'hui | Après |
|---|---|---|
| `ici` (`visibles > 0`) | « Deux constats restent par ailleurs à contrôler. » | inchangée |
| `ailleurs` (`enPlus > 0`) | « Trois autres constats figurent **dans le dossier complet**. » | « … figurent **plus bas**. » |

Rien d'autre ne bouge dans la prose. Les nombres deviennent exacts par la seule levée du plafond.

**Aucun lien n'est injecté dans la prose du verdict.** Elle n'est jamais générée et elle est
fortement contrainte ; y insérer une ancre ouvrirait une brèche pour peu de gain, la surface étant
immédiatement en dessous. La surface porte une `id` (`#controles`) pour les liens entrants futurs.

### La checklist du module : ce que ce lot ne fait pas

`LogementModule` est un composant **client**, nourri par `AddressDossierRow` et la réponse de
`/api/georisques-logement`. Il n'a pas de `Dossier` : le moteur ne tourne côté serveur que dans
`DossierAvecLogement`, sur `/rapport`. En faire une projection de la collection canonique
demanderait de faire tourner l'assemblage complet sur `/rapport/logement`, avec sa propre I/O et son
propre streaming. C'est un chantier distinct, et il n'est pas dans ce lot.

`PRODUCT_MODULES` dit du module Logement qu'il « se vend par sa sortie », le beat 5 étant
« l'élément le plus actionnable du produit ». Il reste donc en place, inchangé.

### Le verrou d'équivalence

Les textes sont partagés depuis le 29/07 (`logement-gestes.ts`), donc les deux écrans ne peuvent pas
se contredire sur les mots. Le dernier écart possible est celui de la **présence**. Un test
l'épingle :

> Pour les mêmes `LogementFacts` et la même posture, les identifiants rendus par
> `buildDecisionChecklist` sont exactement ceux des règles Logement qui émettent une `verification`.

**Ce verrou compte plus que sa taille ne le suggère.** Deux des sept gestes se déclenchant une fois
sur vingt, une divergence entre les deux tables pourrait vivre des mois sans qu'aucun parcours
manuel ne la rencontre.

---

## 7. Tests

**Domaine**

- Un dossier à onze contrôles rend onze cartes dans `dossier.sections.verifications` et au plus
  quatre dans `sectionsDeLaMinute`.
- `visibles + enPlus === reservesShown`, sur des dossiers à zéro, un, quatre et plus de quatre
  contrôles.
- Une composition `grouped_verification` et ses faits absorbés ne coexistent jamais dans la liste.
- Les cinq autres sections gardent leurs plafonds.

**Échelles**

- Un fait de chaque grain atterrit dans le bon groupe.
- Une proximité ancrée sur l'adresse va dans « Autour de l'adresse ».
- Une cavité recensée à 300 m reste dans « Logement », garde-fou du 28/07 : le fait suit sa nature
  pour le lecteur, jamais la forme de sa preuve.
- Un fait sans preuve ne se range pas d'office.
- La correspondance `quartier` → « Autour de l'adresse » est épinglée, pour que la collision avec
  l'`id: "quartier"` de `PRODUCT_MODULES` ne se rejoue jamais.

**Verdict**

- Les cas existants de `conclusion-plan` repris avec les nouveaux nombres.
- La formule « dans le dossier complet » n'apparaît plus nulle part.

**Équivalence** (§6).

**Cas de couverture réelle**

- **Un dossier sans DPE**, cas de 75 à 86 % des adresses. Les gestes `energie` et `confort` sont
  absents, la liste tient debout sur les autres, et le verdict reste cohérent. Ce test évite que la
  suite dépende des deux gestes les plus rares.
- Un dossier commune seule, sans adresse.

---

## 8. Hors lot, écrit pour ne pas être découvert plus tard

**Les cinq autres registres** gardent leur écrêtage. `mismatchTotal` contre `mismatchShown` porte un
écart de même famille. Non traité ici.

**Le moteur sur `/rapport/logement`**, qui permettrait à la checklist de devenir une projection.
Chantier distinct, dimensionné en §6.

**Trois candidats à l'entrée dans le moteur**, issus du travail des 31/07 et 01/08 sur le module
Autour :

| Candidat | Lib | Pourquoi il n'entre pas ici |
|---|---|---|
| Permis de construire proches | `autour-permis.ts` | Produit une prose depuis `Face3Snapshot`, sans `DecisionFact`, sans règle, sans grain déclaré |
| Infrastructures et transformations locales | `autour-infrastructures.ts` | Idem |
| Constats de la conclusion Autour | `autour-conclusion.ts` | Idem |

**Limite de chantier ferme** : aucune motorisation de ces constats dans ce lot. Le but est de rendre
visible la vérité déjà produite par le moteur, pendant qu'on répare son débouché. Leur entrée devra
passer par une règle, une preuve avec son grain et une activation, jamais par un branchement direct
de leur prose dans la liste.

**Conséquence assumée et à écrire à l'écran si elle gêne** : le groupe « Autour de l'adresse » ne
portera qu'un seul item, l'équipement automobile du secteur, alors que le module Autour dit
désormais beaucoup plus. La liste reste vraie, elle dit ce que le moteur a établi. Elle
sous-représente l'échelle qui vient de recevoir le plus de travail.

---

## 9. Risques

**Travail parallèle sur SITADEL.** Le branchement des permis se fait dans un autre terminal, sur
`autour-*` et `Face3Snapshot`. Ce lot touche `decision-assembler.ts` (un plafond et un champ de
`labels()`), `conclusion-plan.ts` (une clause), un composant neuf, `rapport/page.tsx` et des tests.

`dossier-view.ts` n'est **pas** modifié : `sectionsAffichees` ne masque que `incompatibilities`,
`mismatches` et `alignments`, la section `verifications` la traverse telle quelle.

Le recouvrement avec SITADEL est faible. Travailler sur une branche dédiée, et rebaser plutôt que
fusionner à l'aveugle.

**Changement de nombres en production.** Le verdict prononcera des nombres différents sur tous les
dossiers existants dès la livraison. C'est la correction voulue, et elle n'est honnête qu'avec la
surface. Les deux sont livrés ensemble ou pas du tout.

**Ce lot ne répare pas le dossier pauvre.** L'audit du 30/07 nomme un défaut plus large : le dossier
vaut cher là où il y a un problème et ne vaut rien là où il n'y en a pas. Ce lot rend visible une
valeur déjà calculée. Il ne crée pas de matière là où il n'y en a pas.
