# Lot C : « Ce qui correspond à votre projet » (le côté favorable, prouvé)

**Date** : 2026-07-22 · **Périmètre** : le dossier de décision (« En une minute », tête de `/rapport`).
Suite des lots A (désengorger les cartes) et B (verdict en héros, livré sur `feat/verdict-heros`).

## Le problème

Le dossier ne peut structurellement produire que des griefs. Les cinq rôles de `DecisionFact` sont
tous des formes de problème : `incompatibility`, `mismatch`, `compromise`, `unknown`, `verification`.
Aucun rôle ne dit ce qui correspond. Un lecteur qui déclare huit priorités dont six sont satisfaites
voit un écran qui ne parle que des deux autres.

Ce n'est pas un problème d'équilibre esthétique, c'est un problème d'**honnêteté du signal** : montrer
trois réserves sans dire que six critères examinés ressortent favorables donne une image fausse du
lieu. Une omission qui déforme vaut un chiffre faux.

**Et le moteur sait déjà.** `classifyPosition` rend `satisfied` quand la commune est dans le top 20 %
d'un critère, exactement le miroir du mismatch : même bande à deux bornes, même millésime de
distribution, même garde de poids. Les règles le calculent puis le jettent, explicitement :

```
mismatch-rules.ts:61      « satisfied et neutral sont TOUJOURS silencieux »
coast-rules.ts:6          « Jamais satisfied matériel : l'architecture n'a pas de fait favorable »
agglomeration-rules.ts:37 « village: "satisfied", petite: "satisfied", … »
```

Ce lot matérialise une connaissance existante. Il ne fabrique aucun positif.

## Principe directeur

> **Un positif s'affiche quand il est ÉTABLI, avec les mêmes exigences qu'un négatif : un sujet, une
> preuve consultable, une convention, un tier. Jamais parce qu'aucun problème n'a été trouvé.**

## La liste blanche des fondements probants

Un `satisfied` ne devient un fait que si son fondement PROUVE la correspondance. Trois familles le
font aujourd'hui, et elles seules :

| Famille | Fondement | Ce qui est prouvé |
|---|---|---|
| Position relative (13 critères) | `relative_position`, `band.low >= 0.8` | la commune est dans le top 20 % national |
| Distance à la mer | `absolute_measure`, distance mesurée | le littoral est à la distance déclarée |
| Catégorie de taille | `categorical_state` | la catégorie observée est celle que le lecteur préfère |

**Exclu, et c'est le cœur de la doctrine.** L'absence de signal de risque ne prouve rien :

```
aucun PPR retourné       ne devient JAMAIS   « pas de risque »
aucune cavité trouvée                        « territoire sûr »
aucun signal reçu                            « logement protégé »
```

**Exclu aussi : les attestations d'absence.** Vérifié : `classifyNetworkAbsence` et
`classifyHigherEdAbsence` (`absence-facts.ts:32-50`) ne rendent **jamais** `satisfied`. Une desserte
présente rend `neutral`, un établissement présent rend `neutral`. Il n'existe aucun seuil de « bonne
desserte », et en inventer un reviendrait à fabriquer le positif que cette liste blanche interdit.

Toute famille ajoutée plus tard doit entrer explicitement dans cette table, jamais par défaut.

## Le rôle

```ts
// ALIGNMENT : le lieu répond à une priorité déclarée, et c'est ÉTABLI. Miroir exact du mismatch.
// Nommé `alignment` et non `match` : `role === "match"` et `role === "mismatch"` se confondent à la
// relecture, et cette collision se paierait en bug. Nommé `alignment` et non `positive` : le rôle dit
// une correspondance avec une priorité DÉCLARÉE, jamais une qualité absolue du territoire.
export type AlignmentFact = BaseFact & {
  role: "alignment";
  projectKey: PreferenceKey;
  basis: MismatchBasis;        // le MÊME fondement, avec les mêmes gardes d'assertFactValid
  evidence: EvidenceRef[];
  headlineSubject: string;     // la priorité du lecteur, à lire après un deux-points
};
```

Aucune `action` (rien à mener), aucune `limitation` de portée, aucun `signalConvention` : un fait
établi qui n'appelle aucune vérification n'a rien à border.

**Les gardes, symétriques du mismatch** : émis seulement si `preferenceWeight >= 2` (les poids 1
restent silencieux, comme aujourd'hui) ; `materialityTier` = `structuring` si poids >= 3, `secondary`
sinon ; `assertFactValid` exige `headlineSubject` et la preuve, comme pour un mismatch.

## La carte

**Une seule carte groupée**, pas une carte par force. Un point fort n'appelle aucune action, donc il
n'a pas besoin de la structure complète d'une carte de problème (constat, limite, preuves, action,
dépliable méthode). L'écran gagne un bloc court au lieu de trois cartes pleines, ce qui ne défait pas
le désengorgement du Lot A.

```
┌ CE QUI CORRESPOND À VOTRE PROJET ──────────────────┐
│ À l'échelle de la commune                          │
│                                                    │
│ L'accès aux soins, parmi les 10 % les mieux        │
│ dotées de France.          [ TERRITOIRE · 10 % ]   │
│                                                    │
│ La vie locale, parmi les 20 % les plus animées.    │
│                            [ TERRITOIRE · 20 % ]   │
└────────────────────────────────────────────────────┘
```

- **Cap à 3 lignes**, cohérent avec les caps des autres sections. Au-delà, sélection par tier, puis
  ordre du registre (déterministe, jamais retrié).
- Chaque ligne affiche le `statement` du fait, écrit COURT par construction pour ce rôle (une phrase,
  sans contexte à border) et sa pastille de preuve.
- **Le grain n'est pas constant** : la position relative et la distance à la mer sont au grain
  commune, mais la catégorie de taille est au grain `unite_urbaine` quand la source est l'unité
  urbaine (`agglomeration-rules.ts:96`), et `GRAIN_LABEL` ne libelle pas ce grain (il rend `null`,
  comportement actuel). Règle : l'intertitre affiche le grain **seulement si toutes les lignes
  partagent le même libellé non nul** ; sinon il est omis, et aucune ligne ne le porte. Le Lot A a
  remonté le grain en intertitre de groupe précisément pour ne plus le répéter par ligne.
- Le filet de la carte prend un accent distinct des sections de problème.

## Le placement

> **La carte « Ce qui correspond » ouvre les cartes, sauf si une section incompatibilités existe,
> auquel cas elle vient juste après.**

Une règle, deux cas testables. Quand une condition non négociable est violée, c'est la seule chose qui
compte et rien ne passe devant : une carte positive repousserait le motif du blocage sous la ligne de
flottaison. Partout ailleurs, elle ouvre, parce que le détail du verdict affirme déjà « répond à
plusieurs dimensions de votre projet » et que rien ne le prouve aujourd'hui : la carte devient la
preuve de la phrase que le lecteur vient de lire.

```
incompatible   Vos contraintes non négociables → Ce qui correspond → …
arbitration    Ce qui correspond → Ce qui correspond moins bien → …
favorable      Ce qui correspond → Ce qui est établi, à contrôler
```

## Le verdict

### Le détail nomme le côté favorable

Le détail d'arbitrage dit aujourd'hui « Toulouse répond à plusieurs dimensions de votre projet », une
catégorie. Avec les faits, il nomme :

```
HÉROS   Le calme et l'accès aux espaces naturels correspondent moins bien à Toulouse.
DÉTAIL  L'accès aux soins et la vie locale répondent en revanche à votre projet. Ces écarts
        appellent un arbitrage, sans rendre Toulouse incompatible avec votre projet. Quatre
        constats restent à contrôler.
```

**Les sujets nommés viennent des faits AFFICHÉS, jamais de `favorableCount`.** C'est la doctrine de
séquencement du Lot B : on ne nomme que ce qui est à l'écran, après compositions et caps. Un compteur
qui dit « il existe deux satisfactions » ne donne pas le droit de nommer « les soins ».
`favorableCount` garde son rôle métier (accorder « plusieurs dimensions » quand aucun fait n'est
affiché, et alimenter l'orientation) ; il ne fournit jamais un sujet.

Le détail nomme **au plus 2** sujets favorables, même gate que le héros.

### Le héros peut nommer un positif, quand rien de négatif ne prime

La cascade du Lot B gagne une branche, en avant-dernière position :

| # | Cas | Héros |
|---|---|---|
| 1 | Incompatibilité établie | nomme la contrainte |
| 2 | Arbitrage (mismatchs) | nomme les écarts ; les positifs vont au détail |
| 3 | Réserve dominante, hors dossier qui penche favorablement | nomme le point à contrôler |
| 4 | **Aucun négatif éligible, faits d'alignement affichés** | **nomme ce qui correspond** |
| 5 | Reste, couverture insuffisante, gates dépassées | posture |

« Aucun négatif éligible » signifie : aucune incompatibilité, aucun mismatch affiché, aucune réserve
`decision_critical` ou `structuring` dominante. Des contrôles secondaires peuvent subsister, et le
détail les annonce honnêtement.

```
AVANT   Toulouse semble bien correspondre à votre projet.        (posture, aucune matière)
APRÈS   Toulouse répond à deux de vos priorités : l'accès aux soins et la vie locale.
DÉTAIL  Deux constats secondaires restent à contrôler avant de vous engager.
```

Le héros ne mêle jamais les deux côtés dans une même phrase : le point focal unique que le Lot B
établit se diluerait en une phrase à deux branches. Mêmes gates que le Lot B (2 sujets, 110 car.).

## Cas limites

**Une composition absorbe déjà le côté favorable.** Le patron `seasonal_climate_tradeoff` porte un
`favorableSide` (« Les hivers d'Antibes comptent parmi les plus doux du pays »). Un fait d'alignement
sur `douceur_climat` dirait la même chose deux fois. **Règle** : un fait d'alignement dont la
`projectKey` est déjà portée par le côté favorable d'une composition AFFICHÉE est absorbé, comme les
faits que les compositions absorbent déjà. Son id entre dans `absorbedFactIds`.

**Aucun fait d'alignement.** La carte n'existe pas. Le verdict garde ses formulations actuelles, qui
s'appuient sur `favorableCount`.

**Un seul fait d'alignement.** La carte existe avec une ligne. Le héros peut le nommer (cas 4),
au singulier : « Toulouse répond à votre priorité : l'accès aux soins. »

**Tous les critères satisfaits sont de poids 2.** Ils sont `secondary`. La carte les affiche (un
alignement affiché est matériel par construction, comme un mismatch affiché), mais le héros ne les
nomme pas : le cas 4 exige un tier `structuring` au moins, sans quoi le héros couronnerait un signal
faible.

## Ce qu'on ne casse pas

Verdict jamais généré ; structure DOM commune aux chemins déterministe et généré ; ordre épistémique
du bloc conclusion ; aucun compteur, badge ni score affiché ; teinte violet du non-savoir ; les comptes
métier (`reservesShown`, `mismatchTotal`, `favorableCount`, couverture, orientation) inchangés ; la
consommation narrative reste narrative.

`conclusionBasis` gagne les `factIds` des alignements affichés : ils fondent la conclusion au même
titre que les autres.

## Tests

- **`alignment-rules.test.ts`** : un `satisfied` de poids >= 2 produit un fait ; de poids 1, rien ; un
  `neutral` ne produit rien ; le fondement est celui de la famille (position, mesure, catégorie) ; le
  tier suit le poids.
- **`materiality-rules.test.ts`** : `assertFactValid` refuse un alignement sans `headlineSubject`,
  sans preuve, ou dont le fondement n'est pas dans la liste blanche.
- **`absence-rules.test.ts`** : aucune attestation d'absence ne produit d'alignement (garde de
  non-régression sur la liste blanche).
- **`fact-compositions.test.ts`** : un alignement dont la clé est portée par le côté favorable d'une
  composition affichée est absorbé, jamais rendu deux fois.
- **`conclusion-plan.test.ts`** : le cas 4 de la cascade (héros positif) ; le détail nomme les sujets
  affichés et jamais depuis `favorableCount` ; la gate de 2 sujets ; un tier `secondary` seul ne
  couronne pas ; les comptes métier inchangés.
- **`decision-assembler.test.ts`** : la carte ouvre les cartes, sauf derrière une section
  incompatibilités ; cap à 3 ; `conclusionBasis` porte les alignements affichés.
- `npx tsc --noEmit` = 0 ; `node --test src/lib/decision/*.test.ts` ; `npm run build` ; sonde
  `probe-conclusion.ts` (le héros positif est déterministe, hors chemin génératif).

## Hors périmètre

- Les forces du territoire **non reliées au projet déclaré** : une force absolue est une donnée vraie
  mais inerte, et c'est la pente du dépliant touristique. Le projet a déjà tranché ce cas ailleurs
  avec les **signaux ambiants** du comparateur (« et côté X ? », hors critères déclarés, qualitatifs,
  cinq au maximum) : registre séparé et secondaire, jamais mélangé aux critères demandés.
- Les positifs de risque et de réglementaire (voir la liste blanche).
- Le module Logement : aucune de ses règles ne produit de `satisfied` aujourd'hui.
