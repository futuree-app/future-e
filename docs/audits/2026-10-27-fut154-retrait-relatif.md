# FUT-154 · Ne plus présenter un retrait relatif comme une faiblesse absolue

Date : 27/10/2026 · Base : `main` à `4556ca11` (PR #99 FUT-151 fusionnée, puis FUT-153) · Branche : `bonjourfuturee/fut-154-retrait-relatif-vs-faiblesse-absolue` (worktree `.claude/worktrees/fut154`)

## Diagnostic

### La règle qui produit les compromis (après FUT-151)

`buildCompromisCandidates` propose, pour chaque commune affichée :

1. sa **faiblesse absolue** : une priorité déclarée sous 50 (`tradeoff`) ;
2. ses **retraits relatifs** : une des 9 dimensions de `COMPROMIS_KEYS`, sous la moyenne du groupe, et sous 55.

Chaque candidat s'écrit ensuite :

- en **comparatif** (`COMPROMIS_NEG` + « qu'à X »), si la meilleure voisine X a au moins 12 points d'avance (`COMPROMIS_GAP`) ;
- sinon en **absolu** (`REASON_NEG`), mais seulement sous 50 (`SEUIL_FAIBLESSE`, règle FUT-151) ;
- sinon il n'est pas retenu.

`assignCompromis` donne ensuite à chaque commune son candidat le plus saillant sur une dimension encore libre.

### Les 99 comparatifs entre 50 et 54

Inventaire : `scripts/fut154/inventaire.mts`, 20 périmètres × 11 projets, trio et pistes. Il compte 1 056 cartes et 919 compromis, dont 99 comparatifs entre 50 et 54 (le chiffre de FUT-151).

| Cas | Nombre | Verdict |
|---|---|---|
| La commune est au palier intermédiaire, la voisine citée au palier favorable (≥ 66), avec 15 à 60 points d'écart | 97 | **Légitimes.** Le texte dit un vrai retrait, en comparatif, et le Pack montre la même différence de palier. Exemple : Montréjeau, soins 51, « l'offre de soins est plus limitée qu'à Bagnères-de-Luchon » (98). |
| La commune et la voisine citée sont au même palier intermédiaire, avec 12 ou 13 points d'écart | 2 | **Trompeurs.** La carte présente comme compromis un écart que le Pack, sur le même trio, déclare nul (« égalité »). |

Les deux cas trompeurs :

- **Anglet**, sites industriels 52, « les sites industriels sont plus présents qu'à Pau » (65). Dans le Pack, les trois communes sont en « Présence industrielle modérée ».
- **Basse-Goulaine**, vie locale 53, « la vie locale est plus discrète qu'à Bouaye » (65). Dans le Pack, les trois communes sont en « Vie locale intermédiaire ».

Le cas « comparatif ≥ 55 » de l'inventaire (Espelette, chaleur « 55 ») est un arrondi : le sous-score vaut 54,5.

### Le même défaut hors de la plage 50-54

La cause n'est pas propre à la plage 50-54. `COMPROMIS_GAP` devait garantir que la voisine citée « se détache vraiment ». Son commentaire précise qu'en deçà, « le leader est lui aussi faible ». Or 12 points ne le garantissent pas. Sur les 669 comparatifs de l'inventaire, **92 citent une voisine au même palier** que la commune :

- **37 entre deux communes au palier défavorable.** La vraie faiblesse se dit face à une voisine aussi faible, qui passe pour une référence :
  - Aubagne, chaleur 4, « plus marquée qu'à Marseille » (20) ;
  - Villeurbanne, chaleur 8, « plus marquée qu'à Strasbourg » (32) ;
  - Meylan, air 0, « l'air de fond est **un peu** moins pur qu'à Niederhausbergen » (15).

  Dans la matrice, les deux communes ont « Étés chauds » ou « Air pollué ».
- **53 entre deux communes au palier intermédiaire, sous 50.** Exemple : Paris, sécheresse 40, « plus présente qu'à Villeurbanne » (57). Le Pack met les deux communes à égalité.
- **2 entre 50 et 54** : les deux cas trompeurs ci-dessus.

### Ce qui reste juste (vérifié, non modifié)

- **Retrait d'un critère favorable** : aucun compromis sur un critère ≥ 55 (`scripts/fut151/faux-compromis.mts` : 0 ligne). Les reproductions de FUT-151 tiennent : Bagnères-de-Bigorre, Aytré, Châtelaillon-Plage, Breil-sur-Roya.
- **Formulation absolue d'un simple retrait** : jamais au-dessus de 49.
- **Points forts, découvertes, traits distinctifs** : aucune contradiction avec le compromis (balayage FUT-151, toujours vert).
- **Synthèse et AskFuture de « Où vivre »** : `/synthesize` et `/ask` reçoivent `tradeoff` (la faiblesse absolue d'une priorité déclarée), jamais le comparatif. Aucune portée relative ne peut y être lue comme absolue.
- **AskFuture du comparateur** (`ModeChoixAsk`) : il transmet le compromis tel qu'affiché, « qu'à X » compris. Vérifié dans le navigateur, sur six trios.
- **`/synthesize-choix`** n'est plus appelée par aucune page (`ModeChoixSynthese` affiche l'arbitrage déterministe).

### Un défaut d'affichage sans compromis

Pack Décision, « Trois nouvelles pistes » : le paragraphe du compromis était rendu sans condition. Une piste sans compromis (49 pistes sur 330 dans l'inventaire) affichait un filet de séparation vide de 13 px. Capture : `captures/avant-pack-pays-basque-390.png` (Hendaye). La carte « Où vivre » et le comparateur testaient déjà `r.compromis`.

## Correction

1. **`buildCompromisCandidates`** (`src/lib/comparateur-vie.ts`). Le comparatif « qu'à X » exige désormais, en plus des 12 points, que X soit à un **palier meilleur** de la matrice (`bandIndex`, paliers 66/34 inchangés). Sinon, la règle de FUT-151 s'applique telle quelle :
   - formulation absolue sous 50 ;
   - aucun compromis entre 50 et 54 ;
   - la commune prend alors sa dimension libre suivante, ou n'affiche rien.

   Aucun nouveau seuil, aucun nouveau score.
2. **`PackUnlockedView`** : le compromis d'une piste n'est rendu que s'il existe.
3. **Arbitrage du porteur (option 2) : de 34 à 49, une limite, pas un défaut.** `raisonNeg` est le seul point de rendu du compromis absolu. Il alimente la carte « Où vivre », le comparateur, le Pack et le `tradeoff` transmis à `/synthesize` et à AskFuture. Il lit désormais le palier du sous-score (`bandIndex`, seuils 66/34 inchangés) :
   - **sous 34** : `REASON_NEG`, le palier défavorable ;
   - **de 34 à 49** : `REASON_NEG_INTERMEDIAIRE`, qui reprend mot pour mot le palier intermédiaire de la ligne du Pack (« Exposition modérée » devient « exposition modérée à la sécheresse »). Quand le libellé sonne comme un avantage, il est complété de ce qui manque (« étés tempérés, plutôt que frais ») ;
   - **de 50 à 54** : aucune formulation absolue, un comparatif seulement s'il est justifié (étape 1) ;
   - **à partir de 55** : aucun compromis (FUT-151).

   Sans ligne bandée dans la matrice (taille de ville, éloignement de la mer, inondation), la formulation ne change pas. La vie étudiante suivait déjà le palier (FUT-135).
4. **Sous 34, seulement ce que la donnée établit.** Deux formulations défavorables disaient plus que la mesure :
   - « chaleur en hausse » annonçait une tendance que le sous-score, un rang de chaleur estivale, ne mesure pas ;
   - « zone sous-dotée en médecins » empruntait le zonage officiel des ARS, alors que la donnée est un rang d'accessibilité (APL).

   Elles reprennent le palier défavorable du Pack : « étés chauds », « accès aux soins limité ». Les autres formulations défavorables correspondent à leur mesure, et elles sont conservées.

Inchangés :

- classements, scores, sous-scores et pondérations ;
- filtres et conditions ;
- seuils 55 et 50, paliers 66/34 ;
- inondation (FUT-129) ;
- toutes les règles FUT-151 ;
- `COMPROMIS_NEG`, et `REASON_NEG` hors chaleur et soins.

### Avant / après (moteur, 220 recherches)

| | `main` | Branche |
|---|---|---|
| Comparatifs citant une voisine au même palier | 92 | **0** |
| Comparatifs entre 50 et 54 (tous face à une voisine favorable) | 99 | 97 |
| Formulation défavorable (« sols exposés… ») pour un sous-score de 34 à 49 | 66 | **0** |
| Formulation au palier intermédiaire du Pack, de 34 à 49 | 0 | 120 |
| Compromis sur un critère ≥ 55 | 0 | 0 |
| Formulation absolue au-dessus de 49 | 0 | 0 |
| Compromis rendus | 919 | 918 |

200 compromis changent sur 1 056 cartes, 220 recherches. La liste complète est dans `compromis-modifies.tsv`, avec le sous-score, le palier et l'étape en cause :

- 92 comparatifs au même palier (étape 1) ;
- 66 formulations défavorables de 34 à 49 (étape 3) ;
- 42 formulations « chaleur en hausse » sous 34 (étape 4).

Exemples :

| Commune (recherche) | Sous-score | `main` | Branche |
|---|---|---|---|
| Paris (France, train + voiture + services) | sécheresse 40 | la sécheresse est plus présente qu'à Villeurbanne | exposition modérée à la sécheresse |
| Plomeur (29, soins + calme + air) | air 49, déclaré | air plus chargé en particules | qualité de l'air moyenne |
| Gargas (84, même projet) | air 34 | air plus chargé en particules | qualité de l'air moyenne |
| Lagord (17, train + voiture + services) | calme 46 | environnement assez maillé d'infrastructures bruyantes | exposition sonore modérée |
| Cuges-les-Pins (13, étés frais) | chaleur 33 | chaleur en hausse | étés chauds |
| Aubagne (13, train + voiture + services) | chaleur 4 | la chaleur estivale est plus marquée qu'à Marseille | étés chauds |
| Meylan (France, soins) | air 0 | l'air de fond est un peu moins pur qu'à Niederhausbergen | air plus chargé en particules |
| Anglet (64, inondation) | industrie 52 | les sites industriels sont plus présents qu'à Pau | *(aucun compromis)* |
| Montréjeau (31, feux) | soins 51 | l'offre de soins est plus limitée qu'à Bagnères-de-Luchon | *inchangé* |

### Frontières

| Sous-score | Cas réel | Formulation | Palier du Pack |
|---|---|---|---|
| 33 | Cuges-les-Pins, chaleur | étés chauds | Étés chauds |
| 34 | Gargas, air | qualité de l'air moyenne | Qualité de l'air moyenne |
| 49 | Plomeur, air | qualité de l'air moyenne | Qualité de l'air moyenne |
| 51 | Montréjeau, soins | comparatif « qu'à Bagnères-de-Luchon » (98), seul possible | Accès intermédiaire, face à Bon accès aux soins |
| ≥ 55 | Bagnères-de-Bigorre, sécheresse 91 | aucun compromis | Sols peu exposés à la sécheresse |

### Cohérence cartes, Pack et synthèses

- **Carte et Pack** : sur les 220 recherches, chaque compromis absolu d'une commune du trio est confronté à sa cellule dans la matrice (test 9). De 34 à 49, le texte contient tous les mots du palier affiché ; sous 34, la cellule est le palier défavorable. Seule la mer est exclue : sa cellule affiche une distance.
- **Synthèses** : `/synthesize` et AskFuture de « Où vivre » reçoivent `tradeoff`, produit par le même `raisonNeg`. Le test « synthèses » lit le corps envoyé au modèle simulé : Plomeur y porte « qualité de l'air moyenne », et l'ancien texte n'y figure plus. Le balayage vérifie la même règle sur chaque `tradeoff`.
- **AskFuture du comparateur** : il transmet le compromis affiché, à l'identique. Vérifié dans le navigateur.

## Preuves

### Conservation des classements

- **220 recherches** (`inventaire.mts`, `main` puis branche). Les éléments suivants sont **identiques 220/220** : ordre, scores, couverture, marqueur « aucune priorité favorable », `perfectMatch`, `bestCompatibility`, candidates, pistes, ainsi que les paliers et avantages de chaque ligne de la matrice.
- **Rejeu FUT-151** (`scripts/fut151/rejouer.mts`, 20 recherches, `main` puis branche) : bloc `classement` identique 20/20. Seuls changent 13 `compromis` et 8 `tradeoff`. Les messages, résumés, arbitrages et synthèses de thème sont identiques.

### Tests : `src/lib/fut154-retrait-relatif.test.ts` (17 tests)

Chaque test est rejoué sur `main` (`4556ca11`) et sur l'étape 1 seule (`6d89dcb6`), pour vérifier qu'il détecte le défaut visé.

| Test | `main` | Étape 1 | Branche |
|---|---|---|---|
| Reproduction Anglet / Pau (même palier, égalité dans le Pack) | ✖ | ✔ | ✔ |
| Reproduction Aubagne / Marseille (deux étés chauds), puis « étés chauds » | ✖ | ✖ | ✔ |
| Reproduction Meylan (« un peu moins pur » pour 0/100) | ✖ | ✔ | ✔ |
| Reproduction Paris (sécheresse 40) : palier intermédiaire du Pack | ✖ | ✖ | ✔ |
| Règle : chaque formulation intermédiaire reprend le palier de sa ligne du Pack | ✖ | ✖ | ✔ |
| Frontières 33 / 34 / 49 / 51, sur des sous-scores réels | ✖ | ✖ | ✔ |
| Synthèses : corps de `/synthesize` (modèle simulé) | ✖ | ✖ | ✔ |
| Règle : chaleur et soins sous 34, sans tendance ni zonage | ✖ | ✖ | ✔ |
| 1 · calme 95 derrière 98 et 99 (Francheleins, Ambérieux-en-Dombes, Jujurieux) | ✔ | ✔ | ✔ |
| 2 · 51 face à 98 : le comparatif reste (Montréjeau) | ✔ | ✔ | ✔ |
| 3 · 52-53 face à 65, même palier (Basse-Goulaine) | ✖ | ✔ | ✔ |
| 4 · 49 sur une priorité déclarée : la limite reste dite, au palier du Pack (Plomeur) | ✖ | ✖ | ✔ |
| 5 · trois communes favorables partout : aucun compromis | ✔ | ✔ | ✔ |
| 6 et 7 · trois communes aux étés chauds, aucune référence de l'autre | ✖ | ✖ | ✔ |
| 8 · donnée manquante (Poligny, ni air ni soins) | ✔ | ✔ | ✔ |
| 9 · balayage de 220 recherches : comparatif à un palier meilleur ; absolu sous 50, au palier du sous-score, cohérent avec la cellule du Pack ; `tradeoff` sous la même règle | ✖ | ✖ | ✔ |
| 10 · sans compromis : carte, Pack, AskFuture du comparateur (vraie route `/ask`, modèle simulé) | ✖ | ✔ | ✔ |

Chaque échec porte sur le défaut visé : l'ancien texte est cité dans le message d'assertion. Une seule exception : « Règle » échoue par `TypeError`, car `REASON_NEG_INTERMEDIAIRE` n'existe pas avant l'arbitrage. Les quatre tests verts partout sont des non-régressions.

### Suite, TypeScript, lint, build

| Contrôle | Résultat |
|---|---|
| Suite complète `npm test -- --test-concurrency=1` | 3 610 / 3 610 (= 3 581 de FUT-151 + 12 de FUT-153 + 17) |
| `tsc --noEmit` | 0 erreur |
| `eslint` sur les fichiers modifiés | 0 erreur (avertissement préexistant `tailleVilleFrom`) |
| `npm run build` | réussi, sur la branche et sur `main` |

### Recette navigateur (`scripts/fut154/recette.mjs`, captures dans `captures/`)

Deux serveurs de production locaux (`next start`), l'un sur `main`, l'autre sur la branche, plus deux serveurs de développement pour le banc du Pack `/dev/fut154` (404 en production). Conditions :

- `/match` et le rendu du comparateur sont les vrais ;
- le parse et la synthèse sont simulés, `/ask` est intercepté ;
- toute autre requête POST vers une route de modèle est bloquée. **Aucun appel Anthropic.**

Chaque scénario est joué à 1440 et à 390 px, soit 34 lectures par version. Toutes les assertions passent sur la branche.

| Écran | Ce qui change à l'affichage |
|---|---|
| `/ou-vivre` Aubagne (13) | « Compromis : En échange, étés chauds. » (au lieu de « … qu'à Marseille ») |
| `/ou-vivre` France, train + voiture + services | Villeurbanne « étés chauds », Paris « exposition modérée à la sécheresse » |
| `/ou-vivre` Finistère, soins + calme + air | Plomeur « qualité de l'air moyenne » (au lieu de « air plus chargé en particules ») ; AskFuture reçoit le même texte |
| `/ou-vivre` Charente-Maritime, train + voiture + services | Lagord « exposition sonore modérée » |
| Pack (banc, même recherche que Paris) | ligne Sécheresse « Exposition modérée », à égalité : la carte de Paris dit désormais la même chose |
| `/comparateur` Pau, Bayonne, Anglet | Anglet n'a plus de compromis ; Pau et Bayonne inchangés |
| `/comparateur` Villeurbanne, Strasbourg, Paris | comme `/ou-vivre` ; AskFuture reçoit exactement le texte affiché |
| Pack, pistes (Hendaye, Bagnères-de-Bigorre) | plus de filet vide de 13 px |
| Inchangés | Montréjeau, Châteauneuf-le-Rouge, Bagnères-de-Bigorre, Aytré, Breil-sur-Roya ; comparateur calme 95, Poligny, Plouay, Châteauneuf |

## Limites et anomalies distinctes

1. **L'arbitrage est appliqué tel que formulé.** Un critère non déclaré (un retrait relatif sous 50) reçoit la même formulation intermédiaire qu'une priorité déclarée. Le texte reprend le palier sans dire « pour votre projet », parce que ce critère ne fait pas toujours partie du projet.
2. **Les paliers du Pack restent un « premier jet éditorial »** (commentaire de `DIMENSIONS`). Les formulations intermédiaires les citent, donc les recalibrer les déplacera aussi : c'est voulu, et le test « Règle » le vérifie.
3. **« un peu » dans `COMPROMIS_NEG.air_sain`** (« l'air de fond est un peu moins pur qu'à X »). La formule reste employée pour 26 communes au palier « Air pollué » face à une voisine meilleure d'un palier, et minimise alors le retrait. Non modifié.
4. **`MESSAGE_SANS_FAVORABLE`** dit « avec leurs compromis ». Or une carte sans priorité favorable peut n'avoir aucun compromis établi. C'est un texte de FUT-151, non modifié.
5. **Consigne de `/synthesize-choix`** : elle n'avertit ni d'un compromis vide ni de la portée comparative. La route n'est appelée par aucune page ; à reprendre si elle est réactivée.
6. **`scripts/demo-comparateur.mjs`** garde une copie ancienne des formulations (« chaleur en hausse », « zone sous-dotée »). C'est un script de démonstration hors produit, non modifié.
7. **Mer** : la cellule du Pack affiche une distance, pas un palier. La cohérence est donc vérifiée par le palier du sous-score (« rivage marin à distance »), pas par le texte de la cellule.
