# FUT-154 · Ne plus présenter un retrait relatif comme une faiblesse absolue

Date : 27/10/2026 · Base : PR #99 (FUT-151) à `a0c9e302`, non fusionnée · Branche : `bonjourfuturee/fut-154-retrait-relatif-vs-faiblesse-absolue` (worktree `.claude/worktrees/fut154`)

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

Inchangés :

- classements, scores, sous-scores et pondérations ;
- filtres et conditions ;
- seuils 55 et 50, paliers 66/34 ;
- inondation (FUT-129) ;
- toutes les règles FUT-151 ;
- `COMPROMIS_NEG` et `REASON_NEG`.

### Avant / après (moteur, 220 recherches)

| | Base `a0c9e302` | Branche |
|---|---|---|
| Comparatifs citant une voisine au même palier | 92 | **0** |
| Comparatifs entre 50 et 54 (tous face à une voisine favorable) | 99 | 97 |
| Compromis sur un critère ≥ 55 | 0 | 0 |
| Formulation absolue au-dessus de 49 | 0 | 0 |
| Compromis rendus | 919 | 918 |

92 compromis changent ; la liste complète est dans `compromis-modifies.tsv`. Exemples :

| Commune (recherche) | Avant | Après |
|---|---|---|
| Anglet (64, inondation) | les sites industriels sont plus présents qu'à Pau | *(aucun compromis)* |
| Basse-Goulaine (44, sans priorité) | la vie locale est plus discrète qu'à Bouaye | chaleur en hausse (35) |
| Aubagne (13, train + voiture + services) | la chaleur estivale est plus marquée qu'à Marseille | chaleur en hausse (4) |
| Villeurbanne (France, même projet) | … plus marquée qu'à Strasbourg | chaleur en hausse (8) |
| Meylan (France, soins) | l'air de fond est un peu moins pur qu'à Niederhausbergen | air plus chargé en particules (0) |
| Paris (France, train + voiture + services) | la sécheresse est plus présente qu'à Villeurbanne | sols exposés à la sécheresse (40) |
| Montréjeau (31, feux) | l'offre de soins est plus limitée qu'à Bagnères-de-Luchon | *inchangé* |

## Preuves

### Conservation des classements

- **220 recherches** (`inventaire.mts`, base puis branche). Les éléments suivants sont **identiques 220/220** : ordre, scores, couverture, marqueur « aucune priorité favorable », `perfectMatch`, `bestCompatibility`, candidates, pistes, ainsi que les paliers et avantages de chaque ligne de la matrice.
- **Rejeu FUT-151** (`scripts/fut151/rejouer.mts`, 20 recherches) : bloc `classement` identique 20/20. Seuls 7 compromis changent, aucun autre texte : messages, résumés, arbitrages et synthèses de thème sont identiques.

### Tests : `src/lib/fut154-retrait-relatif.test.ts` (12 tests)

| Test | Base | Branche |
|---|---|---|
| Reproduction Anglet / Pau (même palier, égalité dans le Pack) | ✖ | ✔ |
| Reproduction Aubagne / Marseille (deux étés chauds) | ✖ | ✔ |
| Reproduction Meylan (« un peu moins pur » pour 0/100) | ✖ | ✔ |
| 1 · calme 95 derrière 98 et 99 (Francheleins, Ambérieux-en-Dombes, Jujurieux) | ✔ | ✔ |
| 2 · 51 face à 98 : le comparatif reste (Montréjeau) | ✔ | ✔ |
| 3 · 52-53 face à 65, même palier (Basse-Goulaine) | ✖ | ✔ |
| 4 · 49 sur une priorité déclarée : faiblesse absolue dite (Plomeur, air) | ✔ | ✔ |
| 5 · trois communes favorables partout : aucun compromis | ✔ | ✔ |
| 6 et 7 · trois communes aux étés chauds, aucune référence de l'autre | ✖ | ✔ |
| 8 · donnée manquante (Poligny, ni air ni soins) | ✔ | ✔ |
| 9 · balayage 220 recherches : comparatif = palier meilleur et 12 points ; absolu < 50 ; soins, sécheresse, calme, vie locale et mobilité exercés dans les deux portées | ✖ | ✔ |
| 10 · sans compromis : carte, Pack, AskFuture du comparateur (vraie route `/ask`, modèle simulé) | ✖ | ✔ |

Les sept échecs sur la base portent chacun sur le défaut visé. Les cinq tests qui passent des deux côtés sont des non-régressions : ces cas étaient déjà justes après FUT-151, et ils le restent.

### Suite, TypeScript, lint, build

| Contrôle | Résultat |
|---|---|
| Tests ciblés (FUT-151, FUT-96, FUT-109, FUT-145, FUT-139, FUT-20, FUT-142, FUT-129, FUT-17, canon) | 203 / 203 |
| Suite complète `--test-concurrency=1` | 3 593 / 3 593 (= 3 581 de FUT-151 + 12) |
| `tsc --noEmit` | 0 erreur |
| `eslint` sur les fichiers modifiés | 0 erreur (avertissement préexistant `tailleVilleFrom`) |
| `npm run build` | réussi |

### Recette navigateur (`scripts/fut154/recette.mjs`, captures dans `captures/`)

Deux serveurs de production locaux (`next start`), l'un sur la base, l'autre sur la branche, plus deux serveurs de développement pour le banc du Pack `/dev/fut154` (404 en production). Conditions :

- `/match` et le rendu du comparateur sont les vrais ;
- le parse et la synthèse sont simulés, `/ask` est intercepté ;
- toute autre requête POST vers une route de modèle est bloquée. **Aucun appel Anthropic.**

Chaque scénario est joué à 1440 et à 390 px, soit 30 lectures par version.

| Écran | Ce qui change à l'affichage |
|---|---|
| `/ou-vivre` Aubagne (13) | « Compromis : En échange, chaleur en hausse. » (au lieu de « … qu'à Marseille ») |
| `/ou-vivre` France, train + voiture + services | Villeurbanne « chaleur en hausse », Paris « sols exposés à la sécheresse » |
| `/comparateur` Pau, Bayonne, Anglet | Anglet n'a plus de compromis ; Pau et Bayonne inchangés |
| `/comparateur` Villeurbanne, Strasbourg, Paris | comme `/ou-vivre` ; AskFuture reçoit exactement le texte affiché |
| Pack, pistes (Hendaye, Bagnères-de-Bigorre) | plus de filet vide de 13 px |
| Inchangés | Montréjeau, Châteauneuf-le-Rouge, Bagnères-de-Bigorre, Aytré, Breil-sur-Roya ; comparateur calme 95, Poligny, Plouay, Châteauneuf |

## Limites et anomalies distinctes, à trancher

1. **Formulation absolue entre 34 et 49.** La règle de FUT-151 dit qu'un sous-score sous 50 est une faiblesse absolue, et le ticket confirme ce cas (contre-épreuve 4). Mais la matrice met ces communes au palier **intermédiaire**. Le compromis écrit alors « zone sous-dotée en médecins », « chaleur en hausse » ou « environnement assez maillé d'infrastructures bruyantes », quand le Pack dit « Accès intermédiaire » ou « Étés tempérés ». Ces cas existaient avant FUT-154 (66 dans l'inventaire). Les 53 comparatifs « même palier » sous 50 y passent désormais, soit 120 au total. Je n'ai touché ni au seuil ni aux textes : ce sont des règles établies, exclues du périmètre. Deux options sont possibles :
   - réserver la formulation absolue au palier défavorable (< 34) ;
   - adoucir `REASON_NEG` pour le palier intermédiaire.
2. **« un peu » dans `COMPROMIS_NEG.air_sain`** (« l'air de fond est un peu moins pur qu'à X »). La formule reste employée pour 26 communes au palier « Air pollué » face à une voisine plus haute d'un palier. Elle minimise alors le retrait. Non modifié.
3. **« chaleur en hausse »** (`REASON_NEG.faible_chaleur`) décrit une tendance générale plutôt que la position de la commune. Non modifié.
4. **`MESSAGE_SANS_FAVORABLE`** dit « avec leurs compromis ». Or une carte sans priorité favorable peut n'avoir aucun compromis établi. C'est un texte de FUT-151, non modifié.
5. **Consigne de `/synthesize-choix`** (« Le compromis honnête de chacune ») : elle n'avertit ni d'un compromis vide ni de la portée comparative. La route n'est appelée par aucune page aujourd'hui ; à reprendre si elle est réactivée.
6. **Dépendance FUT-151.** Cette branche part de `a0c9e302`, tête de la PR #99, non fusionnée. Si la revue en cours modifie #99, il faudra intégrer ses corrections puis rejouer `inventaire.mts`, la suite et la recette avant de proposer FUT-154.
