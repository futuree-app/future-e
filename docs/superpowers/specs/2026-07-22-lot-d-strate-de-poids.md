# Lot D : la strate de poids (`reserves_found`) — LIVRÉ

**Date** : 2026-07-22 · **État** : validé par le porteur, implémenté, en production
**Origine** : §4 du rapport `docs/rapports-agents/editorial-writer/2026-07-22-verdict-heros-copie.md`

Ce lot ne touche pas qu'au style : il change le CONTRAT de validation du modèle
(`requiredPhrases`, `allowedNumbers`, `maxChars`). D'où ce spec avant le code.

---

## 1. Les quatre moules actuels, rendus depuis le code

Rendus réels, pas déduits (`scripts` de contrôle, fixtures aux vrais topics de production).

| # | condition | rendu | `requiredPhrases` | `allowedNumbers` |
|---|---|---|---|---|
| **A** | suite + single | `À regarder ensuite : le retrait-gonflement des argiles.` | `[]` | `[]` |
| **B** | suite + tied | `À regarder ensuite : le retrait-gonflement des argiles et l'exposition au bruit.` | les sujets | `[]` |
| **C** | hors suite + single | `Un point pèse plus que les autres. Le constat f1 porte sur quelque chose de long à recopier.` | `[]` | `[]` |
| **D** | hors suite + tied, total > n | `Parmi ces trois points, deux pèsent le plus : l'exposition de Toulouse à l'inondation et le retrait-gonflement des argiles.` | les sujets | `["2","deux","3","trois"]` |
| **D'** | hors suite + tied, total = n | `Deux points demandent votre attention : l'exposition de Toulouse à l'inondation et le retrait-gonflement des argiles.` | les sujets | `["2","deux"]` |

`suiteDuHeros` = `v.headline.consumedFrom === "reserves"`, c'est-à-dire : le héros a déjà
couronné un point de CE pool.

Deux défauts de rendu, confirmés à l'exécution :

- **C recopie le `statement` entier**, soit la phrase que la carte affiche trois centimètres plus bas.
- **Une composition en strate** rend `À regarder ensuite : Un sol argileux, et la règle qui l'encadre.`
  (majuscule au milieu de la phrase, `title` servi comme sujet) en mode suite, et
  `Un point pèse plus que les autres. résumé.` (le `summary` recopié) hors suite.

---

## 2. La cible : un moule, deux variantes d'ordre

```
suiteDuHeros === true    `À regarder ensuite : ${sujets}.`
suiteDuHeros === false   `À regarder d'abord : ${sujets}.`
```

`${sujets}` = `joinFr(...)` des **sujets**, `single` inclus (jamais le `statement`, jamais un `title`).

- « ensuite » : le héros a nommé le principal constat du même registre, la strate porte le résiduel.
- « d'abord » : le héros n'a consommé aucun constat de ce registre (héros de posture, ou héros qui a
  puisé dans les mismatchs / la contrainte dure). La strate ouvre la marche.
- aucune strate s'il ne reste rien (`lead.kind === "none"`) : inchangé.

### Ce que ça supprime

| ce qui disparaît | pourquoi |
|---|---|
| `Parmi ces quatre points, deux pèsent le plus` | de l'arithmétique sur sa propre liste, pour dire quoi regarder d'abord. Le compte est déjà dit par le détail du verdict et par l'intertitre des cartes : trois occurrences du même nombre dans un écran d'une minute. |
| `N points demandent votre attention` | dérive de vocabulaire : le détail dit « constats », la strate « points », les cartes « points ». |
| `Un point pèse plus que les autres. ${statement}` | recopie la carte. |
| tous les nombres de ce bloc | plus aucun compte à autoriser, donc plus aucun compte inventable. |

---

## 3. Le contrat, avant / après

| champ | aujourd'hui | proposé | conséquence |
|---|---|---|---|
| `requiredPhrases` | `[]` en single, `coreLabel(topic)` en tied | `coreLabel(subject)` **dans les deux cas** | un sujet ne peut plus être avalé par « plusieurs risques naturels ». Exigible en single seulement parce que le sujet devient court : l'exiger sur un `statement` entier réclamait une COPIE, que la sonde a rejetée 3 fois sur 3. |
| `allowedNumbers` | jusqu'à 4 formes | `[]` toujours | le modèle ne peut plus écrire un nombre ici. |
| `maxChars` | 340 | **220** | une phrase de navigation, pas un registre. Trois sujets longs + le préfixe = ~150. |
| `sourceIds` | les factIds | inchangé | |
| `generable` | `true` | inchangé | le modèle articule encore la liste. |

### La règle appliquée aux compositions

`LeadSelection` porte aujourd'hui `topic` (= le `title` d'une composition). Elle porterait aussi
`subject` :

| candidat | `topic` (inchangé, sert au tri et au debug) | `subject` (ce que la strate écrit) |
|---|---|---|
| fait de réserve | son `topic` | son `topic` |
| `tradeoff` | son `title` | son `headlineSubject` (« l'exposition aux fortes chaleurs ») |
| `grouped_verification` | son `title` | son `headlineSubject` (« le sol argileux et ce qu'il impose ») |

C'est la même règle que le héros applique déjà depuis `rankLeadCandidates`. Elle règle la majuscule
au milieu de phrase et la recopie du `summary` d'un coup.

---

## 4. Trois questions à trancher avant d'écrire

### Q1. Huit `topic` portaient le nom de la commune — TRANCHÉ, corrigé (option A)

Le héros de réserve dominante et la strate nomment tous deux par le `topic`. Or :

```
materiality-rules.ts   l'exposition ${deCommune(nom)} à l'inondation
                       les fortes chaleurs à ${nom}
                       le danger d'incendie à ${nom}
                       les pluies intenses à ${nom}
                       la qualité de l'air à ${nom}
                       le bruit des infrastructures à ${nom}
                       l'exposition industrielle à ${nom}
logement-rules.ts      les indemnisations recensées à ${nom}
```

Rendu réel aujourd'hui :

> Le principal point à contrôler **à Toulouse** : les fortes chaleurs **à Toulouse**.

C'est **exactement le défaut n°1** du 22/07 (corrigé pour les contraintes dures), non corrigé pour les
réserves. Il touche le héros ET la strate, donc il vaut mieux le régler avant de graver le lot D.

`topic` n'est consommé nulle part ailleurs que dans `conclusion-plan.ts` (vérifié : aucun composant ne
le rend). Retirer le nom de commune des huit libellés est donc sans effet de bord.

**Option A retenue et livrée** : `${nom}` retiré des huit `topic`, la règle documentée sur le champ
lui-même (`decision-fact.ts`), et une garde comportementale ajoutée (`materiality-rules.test.ts`) qui
fait tourner les règles sur une commune au nom improbable et relit ce qu'elles écrivent. Vérifiée par
réintroduction du défaut : elle échoue.

Option B écartée : ajouter un `headlineSubject` aux faits de réserve créait un second libellé à
entretenir pour un champ qui n'a qu'un consommateur.

### Q2. Le cas incompatible

Aujourd'hui, un dossier `incompatible` avec des réserves affichées produit :

> Une condition de votre projet n'est pas remplie à Toulouse : la proximité de la mer.
> La mer est à 240 km.
> Un point pèse plus que les autres. Le constat f1 porte sur…

Aucune règle du code ne supprime la strate dans ce cas (vérifié : rien dans `conclusion-plan.ts`, rien
dans le vault). Faut-il la supprimer ? Le blocage est la réponse, et donner un ordre de marche sur un
dossier bloqué peut se lire comme une invitation à continuer. À l'inverse, les cartes restent
affichées plus bas : les taire dans la synthèse crée un écart entre la tête et le corps.

**TRANCHÉ : la strate reste affichée.** La « doctrine existante » invoquée en amont n'existait pas
(vérifié : rien dans le code, rien dans le vault). Aucun changement de comportement sur cette branche.

### Q3. La gate — TRANCHÉ : 110 -> 130

Les nouveaux sujets sont plus longs. Part des héros d'arbitrage qui restent NOMMÉS (le reste bascule
en posture), mesurée sur toutes les paires de priorités :

| commune | duo avant | duo après | solo avant | solo après |
|---|---|---|---|---|
| Rodez | 93 % | **65 %** | 100 % | 100 % |
| Toulouse | 85 % | **55 %** | 100 % | 100 % |
| Le Kremlin-Bicêtre | 44 % | **24 %** | 100 % | 100 % |
| Saint-Rémy-de-Provence | 29 % | **18 %** | 100 % | 100 % |

Le §9 du rapport fixait le seuil d'alerte à « plus d'un dossier sur cinq bascule ». On y est, pour les
duos. Trois choses atténuent, sans annuler :

- un sujet **seul** passe toujours (100 %), quelle que soit la commune ;
- la posture **nomme désormais dans le détail** (livré ce jour), donc l'information n'est plus perdue,
  elle descend de 32 px à 17 px ;
- la posture dit le compte, ce qu'elle ne faisait pas avant.

**Retenu : 130.** Les duos nommés remontent à 98 % (Toulouse), 99 % (Rodez), 84 % (Le Kremlin-Bicêtre),
75 % (Saint-Rémy-de-Provence) — au-dessus des taux d'avant la passe sur les sujets. Un test de
frontière verrouille les deux côtés : une phrase qui tient reste nommée, une phrase trop longue
bascule. Sans les deux, une gate abaissée par erreur passerait inaperçue, « posture » étant un état
valide que rien ne signale.

Écartées : ne rien faire (30 points de héros nommés perdus pour rien) ; raccourcir les sujets (on
venait de les aligner sur les libellés du wizard).

---

## 5. Écarts entre la proposition et ce qui a été livré

Trois choses qui ne figuraient pas dans la proposition et qui ont été traitées à l'implémentation :

- **L'étiquette du bloc** (`ConclusionBlock.tsx`) distinguait « Ce qui pèse le plus » (single) de
  « Ce qui demande votre attention » (tied). Cette distinction existait parce que la phrase, elle, ne
  disait pas par où commencer ; elle le dit maintenant. Étiquette unique, l'ordre reste au texte.
- **Le prompt système** décrivait l'ancien contrat (« vous le nommez en reprenant les termes de son
  constat »). Réécrit, et `DECISION_NARRATIVE_PROMPT_VERSION` bumpée v12 -> v13.
- **Ce que le modèle reçoit** : `lead` lui était transmis entier, `statement` compris. Lui tendre la
  phrase de la carte en lui demandant de ne pas la recopier était une garantie de papier : il reçoit
  désormais une projection sur les seuls sujets.

Et une garde ajoutée : `assertCompositionsValid` exige un `headlineSubject` non vide et borné. Une
fixture de test à qui il manquait ce champ faisait planter le code sur un `TypeError` trois couches
plus loin, `tsconfig` excluant les tests du typecheck.

## 6. Impact sur les tests

Tests à réécrire (assertions de copie) : `lead tied : la TÊTE reste comptée à part`, `lead tied : quand
le verdict annonce plus de points…`, `lead single : le repli NOMME le fait qui domine`, plus les
assertions `allowedNumbers` associées. Aucun invariant n'est touché : la sélection (`selectLead`,
`selectResidualLead`, `rankLeadCandidates`) ne change pas, seul le rendu change.

Tests à AJOUTER : une composition en strate ne rend jamais son `title` ni son `summary` ; aucun moule
ne porte de nombre ; `requiredPhrases` est non vide dès qu'un sujet est listé.
