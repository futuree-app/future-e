# FUT-151 · Les faux points forts de « Où vivre »

Date : 27/10/2026 · Base : `main` à `f1737f86` (PR #95 et #97 fusionnées) · Branche : `bonjourfuturee/fut-151-faux-points-forts-ou-vivre`

## Le défaut

Quand aucune priorité déclarée n'atteignait le seuil favorable (sous-score ≥ 55), `matchProjects` affichait quand même « les 1 à 2 meilleurs aspects relatifs » comme raisons, pour qu'une carte « ne paraisse jamais vide ». Le moins mauvais critère devenait ainsi un point fort.

### Reproduction sur `main`, vraie page (`/ou-vivre`, recherche « loin des feux », Bouches-du-Rhône)

| Carte | Palier | « + » affichés | Compromis |
|---|---|---|---|
| Châteauneuf-le-Rouge (feu 3/100) | Correspondance partielle | **Météo moins propice aux feux**, Population en croissance | En échange, **météo plus souvent propice aux feux**. |
| Fuveau | Correspondance partielle | **Météo moins propice aux feux**, Bien reliée par le train | En échange, peu de lieux de vie… |
| Gréasque | Correspondance partielle | **Météo moins propice aux feux**, À l'écart des infrastructures bruyantes | En échange, zone sous-dotée en médecins. |

En-tête : « Les trois pourraient convenir. » Captures : `captures/avant-feu-13-1440.png` et `captures/avant-feu-13-390.png`.

Le défaut ne touche pas que les feux. Sur 20 recherches rejouées (`avant.json`), **29 cartes sur 96** présentaient une raison fabriquée, réparties sur 6 recherches : feux, chaleur, sécheresse, transports en Lozère, etc. Exemple dans le Vaucluse : Malaucène portait « + Étés plus frais » et « Compromis : la chaleur estivale est plus marquée qu'à Bédoin ».

### Mêmes contradictions sur d'autres champs (trouvées par le balayage)

- **Compromis.** Bagnères-de-Bigorre : « bon accès aux médecins » en raison, et « En échange, zone sous-dotée en médecins » en compromis.
- **Découverte.** Breil-sur-Roya : « à l'écart des grandes infrastructures bruyantes » en découverte, face à un compromis sur le bruit.
- **Trait distinctif** (synthèse, AskFuture). Vaison-la-Romaine : « les étés les plus supportables des trois » à côté de « En échange, chaleur en hausse ».
- **Comparaison.** Les fiches comparent les communes entre elles : l'avantage d'une colonne est donc **relatif** au trio, tandis que la synthèse du thème reprenait la formule d'un point fort **absolu**. Exemple : « Plouay se distingue par son air pur » au-dessus d'une cellule « Qualité de l'air moyenne ».

## La correction (à la source, sans toucher au classement)

1. **Raisons** (`comparateur-vie.ts`). Une raison est une priorité déclarée au-dessus de `SEUIL_RAISON` (55, valeur inchangée et désormais nommée), et rien d'autre. Le repli a été supprimé. Quand des priorités sont mesurées et qu'aucune n'est favorable, le résultat porte `sansPrioriteFavorable: true`. Une priorité non mesurée ne déclenche pas ce marqueur : la couverture de FUT-109 le dit déjà.
2. **Une lecture, un sens par critère.**
   - Le compromis relatif ne porte jamais sur une priorité que la carte présente comme favorable.
   - La découverte ne reprend pas la dimension du compromis.
   - Le trait distinctif ne loue ni le compromis ni la faiblesse absolue de la commune : il cède alors la place à son trait suivant.
   - Ordre de calcul : compromis, puis découverte, puis trait distinctif. Il est appliqué dans `matchProjects` (trio et pistes) et dans `seedComparaison`.
3. **Comparaison.** « X se distingue par… » n'est plus écrit que pour un palier favorable. Une avance au palier intermédiaire s'écrit « Sur l'air, Plouay fait mieux que les deux autres, à un niveau intermédiaire. », et seulement si aucun point fort réel ne départage le thème. Les avantages de la matrice, les paliers, le résumé et la ligne de fracture ne changent pas.
4. **Textes rendus.**
   - Carte : le palier devient « Aucune priorité favorable ici » au lieu de « Correspondance partielle ».
   - En-tête : quand aucune carte n'a de priorité favorable, le moteur affiche « Aucun de ces territoires n'atteint un niveau favorable sur vos priorités : ce sont ceux qui s'en approchent le plus, avec leurs compromis. »
   - Cas mixte : « pourraient convenir » disparaît.
   - La synthèse de repli et les pistes du Pack Décision suivent la même règle.
5. **Synthèse et AskFuture.**
   - Chaque territoire transmet `aucune_priorite_favorable` (seul un `true` est lu comme tel).
   - Les deux consignes interdisent de dire qu'il « correspond » ou d'ériger un critère demandé en point fort, « même par comparaison ».
   - Pour AskFuture, la règle s'applique quel que soit le mode, y compris en couverture partielle.

Non modifiés : sous-scores, seuils (55, 50 et paliers 66/34), filtres, pondérations, ordre, `compatibility`, `perfectMatch`.

## Preuves

### Classement inchangé

`scripts/fut151/rejouer.mts` rejoue 20 recherches sur l'index réel : 12 départementales, 6 nationales, une couverture partielle, une exploration inondation et une recherche sans priorité. Il fige ce que le classement décide : ordre, scores, pistes, `perfectMatch`, `bestCompatibility`, candidates, couverture, ainsi que les avantages et paliers de chaque ligne de comparaison. Résultat : **`avant.json` et `apres.json` sont identiques sur ce bloc pour les 20 recherches.**

Les textes, eux, changent comme prévu :
- 29 cartes perdent une raison fabriquée et reçoivent le marqueur ;
- 5 messages changent ;
- 2 compromis contradictoires disparaissent ;
- 19 synthèses de thème ne présentent plus une avance relative comme un point fort.

### Tests (`src/lib/fut151-points-forts.test.ts`, 14 tests)

- Reproduction : Châteauneuf-le-Rouge.
- Un critère favorable, plusieurs critères favorables, un cas mixte, des critères manquants (Paris en couverture partielle ou nulle, recherche sans priorité), trois communes toutes défavorables (feux et chaleur dans le 13, sécheresse dans le 83, transports dans le 48).
- **Balayage** de 72 recherches, plus de 300 cartes. Chaque texte est ramené à la priorité qu'il exprime, puis confronté à son sous-score. Le balayage vérifie trois choses :
  - les raisons sont au-dessus du seuil ;
  - le marqueur est exact ;
  - aucun critère n'est à la fois loué (raison ou découverte) et retiré (compromis) ;
  - le trait distinctif n'est ni sur le compromis ni sur la faiblesse absolue.
- Comparaison : « se distingue par » n'apparaît que pour un palier favorable.
- Les vraies routes `/synthesize` et `/ask`, avec un modèle simulé : payload, consignes, et un contexte forgé qui ne devient jamais « vrai ».
- **Contre-épreuve par mutation.** J'ai réintroduit chaque défaut séparément : le repli des raisons, le compromis sur une force, la découverte sur le compromis, le trait distinctif sur le compromis, la comparaison relative. Chaque mutation fait échouer au moins un test, et les trois cas nommés échouent chacun sous la mutation qui les concerne.

### Suite, TypeScript, lint, build

| Contrôle | Résultat |
|---|---|
| Suite complète `--test-concurrency=1`, `main` | 3 559 / 3 559 |
| Suite complète `--test-concurrency=1`, branche (deux exécutions) | 3 573 / 3 573, deux fois (= 3 559 + 14) |
| `tsc --noEmit` | 0 erreur |
| `eslint` sur les fichiers modifiés | 0 erreur (1 avertissement préexistant : `tailleVilleFrom`) |
| `npm run lint` sans argument | plante à l'identique sur `main` (règle `react/no-unescaped-entities` sans plugin, déjà notée par FUT-145) |
| `npm run build` | réussi |

Avec la concurrence par défaut, la suite omet au hasard des fichiers entiers, sans échec (3 549 ou 3 559 sur la même base). Seule l'exécution à concurrence 1 donne un compte stable.

Un test existant a été adapté : `fut109-couverture-classement.test.ts` vérifiait la condition exacte de l'en-tête. La nouvelle condition l'englobe, avec en plus le cas FUT-151.

Le cliquet de design « Relevé » (`canon.test.ts`) a refusé une première version de la ligne du Pack, écrite en capitales mono. Elle est désormais en phrase discrète.

### Recette navigateur (`scripts/fut151/recette.mjs`)

Serveur de production local (`next build` + `next start`, variables fictives). Le parse et la synthèse sont simulés ; `/match` est la **vraie route** ; `/ask` est intercepté pour lire le corps réellement envoyé ; toute autre requête POST vers une route qui appelle un modèle est bloquée. **Aucun appel Anthropic.** Chaque scénario est joué à 1440 et à 390 px de large, sur la base (`avant-*`) et sur la branche (`apres-*`).

| Scénario | Ce que la page affiche après correction |
|---|---|
| Feux, 13 (synthèse en panne : repli) | 3 cartes « AUCUNE PRIORITÉ FAVORABLE ICI » ; aucun « + Météo moins propice aux feux » ; compromis conservé ; en-tête et repli disent le message du moteur ; corps `/synthesize` et `/ask` : raisons vides, marqueur `true` |
| Chaleur, 84 (mixte) | Bédoin « Correspondance partielle » + « Étés plus frais » ; Malaucène et Pertuis « Aucune priorité favorable ici » ; plus de « pourraient convenir » |
| Feux, 29-56 (favorable) | inchangé : « Forte correspondance » + « Météo moins propice aux feux » ×3 ; marqueur `false` |
| Paris, calme + culture | inchangé : « Priorités en partie mesurées », le calme n'est jamais une force |
| `/comparateur` Bohars–Plouay–Brest | « Sur l'air, Plouay fait mieux que les deux autres, à un niveau intermédiaire. » (au lieu de « Plouay se distingue par son air pur. ») |
| `/comparateur` Châteauneuf–Fuveau–Gréasque | « Fuveau se distingue par son éloignement des sites industriels… » (palier favorable, inchangé) |

Mesures : `captures/avant-mesures.json` et `captures/apres-mesures.json`.

## Hors périmètre, à suivre

- **Faux points faibles.** Quand un retrait relatif n'atteint pas l'écart `COMPROMIS_GAP` (12), le compromis reprend la formulation **absolue** de `REASON_NEG`. Exemples : Gréasque, « zone sous-dotée en médecins » ; Breil-sur-Roya (calme 95/100), « environnement assez maillé d'infrastructures bruyantes ». C'est le symétrique de ce ticket ; il ne fabrique aucun avantage, donc je n'y ai pas touché.
- **Découverte sur une carte sans priorité favorable.** Elle reste affichée avec un « + » (par exemple « Population en croissance ») : c'est un atout réel (≥ 66), non demandé. Le palier « Aucune priorité favorable ici » évite de la lire comme une correspondance.
- **Mode « classé ».** Il reste actif quand les trois cartes sont sans priorité favorable : le classement existe bel et bien. La question suggérée « Pourquoi X plutôt que Y ? » est relative ; AskFuture reçoit le marqueur et la consigne de le dire.

## Revue du 27/10/2026 (verdict NO GO ciblé sur `1f75afd`) : deux blocages levés

### 1. Les faux compromis

**Reproductions**, sur le vrai moteur et la vraie page (`captures-revue/avant-revue-*`) :
- **Bagnères-de-Bigorre** (recherche « air pur », France entière) : sécheresse à 91/100, compromis affiché « sols exposés à la sécheresse ».
- **Aytré** (recherche « train + moins de voiture + services », 17) : vie locale à 86/100, compromis affiché « peu de lieux de vie et d'animation locale ».

**Cause.** Un retrait *relatif* (la commune fait moins bien que ses voisines) devenait un compromis même quand le critère était favorable dans l'absolu. Sans écart suffisant avec la voisine, il recevait en plus la formulation absolue de `REASON_NEG`. En retirant les critères loués, FUT-151 a exposé de nouveaux cas (Aytré, Biarritz, Wisches).

**Correction** (`buildCompromisCandidates`, `assignCompromis`) :
- Un retrait relatif n'est candidat que si le sous-score de la commune est sous le seuil favorable (55, `SEUIL_RAISON`).
- Il ne reçoit la formulation absolue que si la commune est réellement faible (< 50, `SEUIL_FAIBLESSE`, le seuil existant du `tradeoff`, désormais nommé). Sinon, il s'écrit en comparatif ou n'est pas retenu.
- L'unicité des dimensions ne cache plus une vraie faiblesse : si aucune autre dimension honnête ne reste, la commune garde la sienne.
- Sans compromis honnête, la carte n'en affiche pas (contrat existant : `compromis: ""`).

**Résultats** (balayage `scripts/fut151/faux-compromis.mts`, 20 périmètres × 11 projets) :

| Version | Compromis sur un critère ≥ 55 | Formulation absolue sur un critère entre 50 et 54 |
|---|---|---|
| base | 312 | 3 |
| `1f75afd` | 290 | 7 |
| correction | **0** | **0** |

Restent 99 comparatifs relatifs (« … qu'à X ») sur des critères entre 50 et 54, ni favorables ni faibles. Ils relèvent de FUT-154.

### 2. La portée en couverture partielle

**Cause.** Le Pack disait « Aucune de vos priorités n'est favorable ici », et la consigne de synthèse affirmait « ses priorités déclarées sont mesurées », alors qu'au moins une priorité n'était pas mesurée.

**Correction.** La portée est calculée dans un seul module, `src/lib/comparateur/portee-favorable.ts`, que lisent la carte, le Pack, `/synthesize` et `/ask`. Les quatre situations :

| Situation | Ce qui est dit |
|---|---|
| Toutes les priorités mesurées, aucune favorable | `toutes_mesurees` : « Aucune priorité favorable ici » |
| Certaines mesurées, aucune d'elles favorable | `parmi_celles_mesurees` : « Aucune priorité favorable parmi celles mesurées ici » (+ « Non mesuré ici : … ») |
| Aucune priorité mesurée | pas de marqueur, même si un client l'affirme (« À explorer ») |
| Certaines favorables, d'autres non mesurées | pas de marqueur (raisons + « Non mesuré ici ») |

Les deux consignes (synthèse et AskFuture) imposent « parmi celles mesurées ici », jamais « aucune de vos priorités », et précisent qu'une priorité non mesurée n'est ni favorable ni défavorable. Un état inconnu prend toujours la portée prudente.

### Contre-épreuves

Huit tests ajoutés à `fut151-points-forts.test.ts` (22 au total) :
- Bagnères (sécheresse 91) ; Aytré (vie locale 86) ;
- Châtelaillon-Plage, favorable mais un peu derrière (soins 84) ;
- vraie faiblesse conservée (Châteauneuf-le-Rouge, et ses voisines gardent un compromis) ;
- trois communes favorables partout (Bagnères, Gérardmer, Aurillac) : aucun compromis ;
- les quatre portées ;
- Paris, couverture partielle de bout en bout : moteur, `/synthesize`, `/ask` (modèle simulé) et texte ;
- aucune priorité mesurée, avec un faux marqueur rejeté par `/ask`.

Le balayage vérifie aussi trois nouveaux invariants : aucun compromis sur un critère ≥ 55 ; formulation absolue réservée aux sous-scores < 50 ; toute faiblesse absolue reste dite.

**Exécutés sur `1f75afd`**, 11 tests échouent, dont toutes les contre-épreuves attendues. Deux tests de la revue passent sur les deux versions, comme prévu : l'un vérifie la conservation d'une vraie faiblesse, l'autre est le test unitaire du nouveau module.

Deux tests existants ont été adaptés :
- **FUT-96 C5** : son cas de référence était lui-même un faux compromis (Andernos-les-Bains, voiture 76/100). Il passe sur un cas légitime (Gréasque), avec les mêmes assertions sur la formulation.
- **Breil-sur-Roya** : le test supposait l'ancien compromis « bruyant » (calme 95/100). Il vérifie désormais que le calme n'est plus ni loué et retiré à la fois, ni présenté comme un compromis.

### Invariants et validations

- **Rejeu des 20 recherches** : classements, scores, pistes, couverture, `perfectMatch`, ainsi qu'avantages et paliers du comparateur restent identiques à la base.
- **Cas validés conservés** : Châteauneuf-le-Rouge, Plouay, Breil-sur-Roya, Vaison-la-Romaine, Bagnères-de-Bigorre (médecins).
- **Suite complète**, avec la concurrence par défaut : 3 581 / 3 581, deux fois (= 3 573 + 8), sans omission cette fois. Infrastructure de tests inchangée.
- `tsc` : 0 erreur. `eslint` sur les fichiers modifiés : 0 erreur. Build : réussi.
- **Recette navigateur** (`captures-revue/`, 1440 et 390 px, `1f75afd` puis correction, `/match` réel, aucun appel Anthropic) :
  - Aytré : « sols exposés à la sécheresse » (sécheresse 27, une vraie faiblesse) au lieu de « peu de lieux de vie » ;
  - Bagnères-de-Bigorre : plus de compromis ;
  - Paris : « AUCUNE PRIORITÉ FAVORABLE PARMI CELLES MESURÉES ICI » + « Non mesuré ici : un cadre calme. » ;
  - les sept scénarios précédents passent toujours.
