# Passation — 2026-08-03, branche `main`

**Horodatage** : 2026-08-03, fin de journée · **Branche** : `main` = `ce71f36`, tout est poussé et
déployé en production. Le handoff précédent (clôture de la séquence design) est archivé sous
`docs/handoff/2026-08-03-cloture-sequence-design.md` ; ses pièges design restent valides et ne sont
pas répétés ici.

> ⚠ **Deux terminaux travaillent sur `main`.** Relire `git status` avant tout `git add`.
> Un push sur `main` déploie en production, sans étape Preview.

---

## Objectif en cours

Fiabiliser la chaîne OpenStreetMap du module Logement (Face 3, « Autour de cette adresse ») avant
d'y ajouter quoi que ce soit. L'audit de la sémantique de la distance demandé par le handoff
précédent est **terminé** et a livré ses quatre réponses, plus un défaut non demandé qui a été
**corrigé et déployé**. Le chantier suivant est celui des relations multipolygones, qui n'a pas
encore de spec.

## Fait dans cette session

- **Audit complet** : `docs/audits/2026-08-03-osm-semantique-distance.md`. Six emprises réelles
  (Paris 11e, Lyon 3e, Lille, Angers, Vern-sur-Seiche, Fontainebleau), 300 points d'échantillonnage
  par emprise, tirage déterministe (graine `20260803`, aucun `Math.random`, la mesure est rejouable).
  Les scripts sont hors dépôt, dans le scratchpad de session, et l'audit décrit ce qu'ils mesurent
  en annexe : les réécrire coûte une vingtaine de minutes si besoin.
- **Correctif d'emprise livré en production**, commit `ce71f36` :
  - `src/lib/geo-distance.ts` : `metersToDegrees(latRef, radiusM)` devient la seule conversion
    mètres → degrés du module ; `bboxAround` s'y branche ; `expandBBoxM(bbox, radiusM)` élargit une
    emprise de cellule à la latitude de son bord le plus éloigné de l'équateur.
  - `src/lib/logement-osm.ts` : `tileFetchBBox(key)` exportée (donc testable sans réseau ni
    Supabase), appelée par `getTileGeoms` ; le calcul local d'emprise a disparu.
  - `OSM_QUERY_VERSION` : `osm-v2-2026-07-03` → **`osm-v3-2026-08-03`** (recollecte paresseuse des
    cellules déjà en cache, qui l'avaient été sur l'emprise courte).
  - `src/lib/logement-osm.test.ts` : 5 tests de comportement observable (voie ferrée à 1 200 m à
    l'est puis à l'ouest d'une adresse collée au bord de sa cellule à la latitude de Lille ; nord et
    sud en contrôle ; marge vérifiée en mètres).
- **Vérifications passées** : `npx tsc --noEmit` exit 0 · `node --test "src/lib/**/*.test.ts"`
  1 230 tests, 0 échec · `npx eslint` sans erreur · `npm run build` exit 0 · déploiement Vercel
  `Ready`, aliasé sur `futur-e.fr`.
- **Preuve que les tests prouvent quelque chose** : le défaut a été réintroduit temporairement,
  3 tests sont passés au rouge (dont le message `marge est/ouest de 952 m pour 1500 m demandés`,
  cohérent avec les 951 m mesurés indépendamment sur Overpass), les contrôles nord/sud sont restés
  verts, puis le fichier a été restauré.
- **Fiche mémoire `project_module_logement` mise à jour** avec l'audit, le hotfix, et l'ordre du
  reste. Elle porte les chiffres, ce brief ne les répète qu'en partie.

## Ce que l'audit a établi

| Question du handoff précédent | Réponse mesurée |
|---|---|
| Distance au bord ou au centroïde ? | **Au bord**, et `0` à l'intérieur. Conforme à ce que le texte affiche. |
| Un tag `access` / `barrier` exploitable ? | Ils existent, Overpass les renvoie, `parseOverpass` les jette. Couverture **très inégale** : 61 `private` sur 1 887 objets, ~10 % à Lyon, 0,4 % à Paris, rien en rural. |
| Combien d'espaces verts en simple point ? | **1 node sur 1 887**, et de toute façon jamais récupéré : la requête ne demande que `way`. Non-problème. |
| Part de géométries invalides ou multipolygones ? | **0** invalide, **0** way ouvert, **0** way de moins de 3 points. En revanche les **relations ne sont jamais interrogées** : 91 objets, 5 % du corpus. |

**Le défaut non demandé, corrigé** : `getTileGeoms` élargissait la cellule de `rayon / 111_000` sur
les deux axes. La marge est/ouest ne valait donc que 987 m à Paris et 951 m à Lille, quand celle du
nord et du sud valait bien 1 500 m, et `computeOsmProximity` filtrait ensuite à 1 500 m. Mesuré :
jusqu'à **15 % des adresses de Lille** perdaient une voie ferrée ou un axe rapide réellement situé à
moins de 1 500 m, sans qu'aucune incomplétude ne soit signalée. Le vert n'était pas touché (trop
dense et trop proche), le **bruit** l'était. Deuxième récidive de cette conversion après
`cartofriches`, d'où la factorisation.

## Décisions prises, pas encore dans le vault

1. **Porteur** : le correctif d'emprise part **seul**, en hotfix isolé, quitte à assumer **deux bumps
   successifs** de `OSM_QUERY_VERSION` plutôt que de retenir la correction jusqu'au chantier des
   relations. Le coût est un remplissage paresseux du cache ; l'alternative était de garder des faux
   négatifs silencieux en production.
2. **Porteur** : les relations multipolygones **ne rejoignent pas** ce hotfix. Rendre la géométrie
   juste n'est pas une ligne : anneaux `outer` multiples, anneaux `inner` et trous, membres à
   recoller, point dans un `outer` mais dans un `inner`, ways membres également remontés comme ways
   autonomes, relations partiellement résolues ou invalides. Sans cela on remplacerait « forêt
   absente » par « forêt présente, intérieur mal interprété ». **Spec dédiée et test Fontainebleau
   exigés.**
3. **Porteur** : `access` ne sera utilisé **qu'en `private|no`**, comme filtre négatif. Jamais pour
   affirmer un accès : un espace sans tag n'est pas public, il est non renseigné.
4. **Porteur** : `barrier` sera **stocké mais pas exploité** sans règle établie. Une clôture est
   souvent cartographiée comme un objet séparé du polygone vert, donc l'absence du tag sur l'espace
   ne dit presque rien, même là où la couverture est bonne.
5. **Proposé, accepté** : `expandBBoxM` convertit à la latitude du bord **le plus éloigné de
   l'équateur**, pas à la latitude médiane. La médiane sous-couvrirait le bord polaire, d'un cheveu
   sur une cellule de 0,005° mais d'une marge réelle sur `GRID_CELL_DEG` (0,18°).
6. **Porteur** : hiérarchie de la suite arrêtée, cf. « Prochaine étape ».

## État git

- Branche `main`, `ce71f36`, **rien à pousser**, aucun commit local en avance sur `origin/main`.
- Modifiés non commités : aucun.
- Non suivis, sans intérêt : `.impeccable/`, `Futur.e Design System.zip`.
- Aucune PR ouverte (le dépôt travaille directement sur `main`).
- Déploiement de `ce71f36` en production, `Ready`, aliasé sur `futur-e.fr`.

## Prochaine étape immédiate

**Écrire la spec des relations multipolygones OSM**, avant toute ligne de code, puis la mettre en
œuvre en TDD. Elle doit trancher explicitement, cas par cas :

1. l'assemblage de plusieurs anneaux `outer` en un seul objet vert ;
2. les anneaux `inner` et les trous, avec le cas « point dans un `outer` mais dans un `inner` » (la
   réponse attendue n'est pas `0`) ;
3. le recollement des membres dont l'ordre n'est pas garanti par Overpass ;
4. la **déduplication** : un way membre d'une relation est aussi remonté comme way autonome par
   `out geom`, donc le même espace compterait deux fois ;
5. le comportement sur relation partiellement résolue ou géométriquement invalide (ce que le produit
   affiche alors, et ce qu'il n'affiche pas) ;
6. le **test Fontainebleau** exigé par le porteur : une adresse **à l'intérieur** de la forêt
   domaniale, qui est une relation, doit rendre `0` et non « à 300 mètres ».

Le même lot embarque ensuite, sous un **bump unique** de `OSM_QUERY_VERSION` (le second assumé) :
le stockage de `access` et `barrier`, l'usage de `access=private|no` en filtre négatif seul, et la
correction de la comparaison de fermeture de `geo-distance.ts` (`ring[0] === ring[ring.length - 1]`
compare deux objets par référence, donc toujours faux ; sans effet sur le résultat aujourd'hui).

**Vérification restée ouverte, à faire dès qu'une session payante est disponible** : ouvrir un
dossier sur une adresse **lilloise** et recharger. Le cache étant en v3, la première ouverture
recollecte la cellule, c'est l'occasion de voir apparaître une infrastructure qui manquait.
`POST /api/logement-autour` exige une session et un dossier accessible (307 vers l'authentification
sinon) : cette vérification n'a **pas** pu être faite dans cette session, et le correctif repose
pour l'instant sur les tests et la mesure, pas sur une observation en production.

## À lire d'abord à la reprise

1. `MEMORY.md`, puis la fiche **`project_module_logement`** (paragraphe daté du 03/08, en fin de
   fiche) et `icu_ilot_chaleur_data`.
2. `docs/audits/2026-08-03-osm-semantique-distance.md` en entier : il porte les chiffres, la méthode
   et la section « ce que l'audit n'a pas regardé ».
3. `docs/vault/modules/logement.md`, doctrine « modules-calques ».
4. `docs/vault/doctrine/data.md`, section « un équipement n'est pas un refuge » et ses trois niveaux
   de preuve.
5. Le code, dans cet ordre : `src/lib/geo-distance.ts` (les commentaires de `metersToDegrees` et
   `expandBBoxM` expliquent le piège), `src/lib/logement-osm.ts`, `src/lib/logement-osm.test.ts`.
6. `docs/handoff/AUTO-SNAPSHOT.md` pour vérifier la fraîcheur.

## Pièges et fils ouverts

- **`status: "failed"` d'Overpass n'a pas été instruit.** `getTileGeoms` renvoie alors zéro
  géométrie, et le texte rendu dit « aucun espace correspondant aux catégories recherchées n'est
  cartographié ». C'est un constat de couverture, pas un aveu de panne : une liste vide ne doit
  jamais se présenter comme complète. **Le défaut n'est PAS établi**, il n'a pas été vérifié dans le
  rendu. Ne pas le corriger sans preuve qu'il existe.
- **Une emprise sur six a échoué** pendant la première mesure (Lille, retentée avec succès ensuite).
  Le taux de succès réel d'Overpass en production n'est pas connu.
- **`OSM_CELL_DEG` (0,005°) reste « à valider »**, comme le dit le commentaire du code depuis le
  03/07. La cellule est anisotrope : ~555 m nord-sud, ~365 m est-ouest à Paris. L'audit d'aujourd'hui
  a corrigé la MARGE, pas la cellule. Audit séparé.
- **La branche `kind: "node"` de `computeOsmProximity` est du code mort** tant que la requête ne
  demande pas de nodes. Elle donne l'impression que le cas est traité.
- **Le corpus bruit n'a pas été confronté à une source tierce.** `motorway`, `trunk`, `rail`
  seulement : un axe `primary` très circulant reste invisible par construction, décision antérieure
  non réexaminée.
- **Les mesures d'aujourd'hui portent sur 6 emprises, pas sur la France.** Elles suffisent à établir
  un défaut et son ordre de grandeur, pas à en donner un taux national.
- **La chaîne de bumps se paie en latence** : chaque bump de `OSM_QUERY_VERSION` refait un aller
  Overpass à la première ouverture de chaque cellule (~2,7 s contre ~190 ms à chaud, mesuré le
  03/07). Deux bumps sont assumés par le porteur, un troisième mériterait d'être regroupé.
- Les pièges design du handoff archivé restent d'actualité, en particulier `--orange` sur du texte en
  thème clair (2,13:1) et la palette de `DESIGN.md` non appliquée (le sable `#c8b89a` subsiste dans
  `professionnels/page.tsx`, `ProForm.tsx`, `globals.css`).
- **Aucune CGV n'existe** (rétractation 14 jours, médiateur de la consommation) ; arbitrage du
  porteur, à traiter en fin de séquence.
- **Le site est fermé au crawl** (`robots.txt` en `Disallow: /`) ; la canonicité des URL doit être
  tranchée avant de lever cette ligne.
