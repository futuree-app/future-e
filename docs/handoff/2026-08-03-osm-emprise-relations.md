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

## Observation produit, hors chantier — session d'usage réel du moteur (03/08)

Le moteur a été utilisé **hors produit** sur un cas de mobilité résidentielle réel : index comparateur
+ `public/data_climat.json` + Flores A38 + Géorisques en direct, sur une dizaine de communes, en cinq
messages. **Le résultat territorial n'a aucun intérêt et n'est consigné nulle part.** Ce qui suit est
ce que la session a révélé du produit. Fiche complète : **`project_futuree_point_de_reference`**.

1. **Le point de référence.** La session a basculé quand la personne a dit « notre ville actuelle ».
   Avant : « ce marché, c'est 13 082 » — ne décide rien. Après : « **+4 % par rapport à chez vous** » —
   décide immédiatement. **futur·e ne demande jamais d'où vient la personne**, alors que l'écart depuis
   sa commune actuelle est le seul opérateur qui rend les autres chiffres lisibles. C'est le
   positionnement « la même adresse n'a pas le même sens », non implémenté. **C'est un champ**, et ça
   marche **dans le Rapport, en mono-commune, sans toucher au firewall**. Meilleur rapport
   valeur/effort identifié à ce jour.
2. **Les critères n'existaient pas au départ** : un critère décisif est apparu au 5ᵉ message et a
   réordonné tout le classement. Le comparateur les prend une fois, en entrée. Segment « recherche
   mouvante » du Pass Projet, observé en direct sur son ICP.
3. **Deux personnes, deux verdicts sur la même ville**, selon le métier pondéré. Le format presse le
   sait déjà (« même ville, trois profils, trois verdicts ») ; le produit ne le sait pas.

**Ce que ça ne justifie pas, et c'est le point important.** L'intuition spontanée était « c'est le rôle
d'Ask futur·e ». **Non.** L'architecture est scellée en quatre cases (en-tête de
`src/app/api/comparateur-vie/ask/route.ts`) et la session a occupé la case interdite : multi-commune
**et** chiffrée **et** transversale. Ask comparateur n'importe aucune donnée profonde (firewall
d'import), Ask rapport refuse de sortir de son `communeInsee`. Rouvrir ça viderait le Rapport à 14 € de
sa raison d'être. **Le Fil ne rouvre pas davantage** : en cinq messages la donnée n'a pas bougé d'un
chiffre, c'est l'utilisateur qui a bougé — soit exactement le test gravé le 28/07. La session
**confirme** la décision, elle ne la rouvre pas.

**Seule construction que la règle autorise** : l'**entité `projet`** dans le schéma (exception déjà
actée au « ne rien construire » du Pass Projet). La session aurait produit une ligne de signal —
communes ajoutées/retirées, critères modifiés trois fois, projet relancé cinq fois — et rien ne
l'enregistre. Ordre proposé, **non tranché par le porteur** : adresse de référence dans le Rapport,
puis entité projet.

**Deux réserves à ne pas perdre** : le « non concluant » a été lu comme de la valeur, mais **par
l'auteur du produit** — non généralisable, et la tension « plus le prix monte, plus la pression à
sur-conclure menace le moat » reste entière. Et **une erreur a été corrigée en cours de session** (un
écart annoncé à 40 % valait 25 %) : personne ne corrige un produit automatisé, ce qui est un argument
de plus pour garder le firewall où il est.

## Observation de données, non demandée — le critère « accès aux services » (03/08)

Point de départ : le piège `inondation.tri` ci-dessous nomme le pire des quatre états d'une
information, présentée comme mesurée alors qu'elle ne l'est pas. Recherche systématique de la même
famille sur les 140 champs de `data/comparateur-index.json` (34 788 communes), par cardinalité et
part de la valeur dominante. **Un seul cas sérieux en est sorti, et il n'est pas un champ en dur.**

**Ce qui a été écarté d'abord, pour ne pas le re-soupçonner** : `reseauLocalMeasured` vaut `true` sur
100 % des communes et `etudesSup.measured` aussi, ce qui ressemblait à un drapeau de provenance
menteur. Vérification faite, c'est **honnête** : les 34 788 communes sont géolocalisées, la mesure a
donc bien été tentée partout, et `reseauLocal: null` (82,8 %) est une **absence attestée**, pas une
donnée manquante. Seule réserve, latente : deux producteurs écrivent ce champ avec deux sémantiques
(`scripts/populate-reseau-local.py:345` pose `ins in geoloc`, donc potentiellement `false` ;
`scripts/lib/absence-attestations.mjs:32` pose `true` inconditionnellement, et c'est lui qui a
tourné). Aujourd'hui l'écart ne mord pas, faute de commune non géolocalisée. À savoir si une source
future en introduit.

**Le cas sérieux : `acces_services` est un critère binaire présenté comme une mesure de proximité.**

1. **La donnée est dégénérée.** Le score vaut `100 - vivpct.eloignement`
   (`comparateur-vie.ts:1242`). Il ne prend que **19 valeurs distinctes** sur 34 788 communes, et
   **80,1 % des communes obtiennent exactement 100/100**. Un critère sain, en comparaison : `nature`
   a 101 valeurs, la plus fréquente couvrant 1,1 % des communes.
2. **Le palier intermédiaire est vide.** Avec `bandIndex` (≥66 / <34), la répartition réelle est
   **80,1 % « Services proches », 0,0 % « Accès intermédiaire », 19,7 % « Services éloignés »**.
   Zéro commune sur 34 788 au palier du milieu. Les trois paliers annoncés en décrivent deux.
3. **La sémantique est retournée, et c'est le vrai défaut.** La source est
   `part_de_la_population_eloignee_de_plus_de_20_minutes_d_au_moins_un_des_services`
   (`scripts/fetch-communes-vivabilite.mjs:62`). C'est un indicateur de **queue de distribution** :
   `0` signifie « aucun habitant n'est à plus de 20 minutes d'au moins un service », pas « les
   services sont proches ». La chaîne `100 - x` puis palier « Services proches » transforme une
   **absence d'éloignement extrême en affirmation de proximité**. Une commune où chaque habitant est
   à 18 minutes du premier service marque 100/100 et s'affiche « Services proches ». Le tooltip
   promet d'ailleurs ce que l'indicateur ne mesure pas : « La proximité des commerces et services du
   quotidien » (`comparateur-vie.ts:1381`). C'est le motif déjà corrigé une fois en `47dfadc`,
   « j'avais écrit *accès* là où je n'avais qu'une distance », sur un autre champ.
4. **Le code connaît le défaut à deux endroits, et pas aux autres.** `comparateur-scores.ts:22` le
   dit (« plafond dégénéré neutralisé par la bande à deux bornes ») et le mismatch est donc protégé ;
   `comparateur-vie.ts:1063` l'écarte de la Découverte (« trop génériques, presque partout hauts »).
   Mais il reste plein exercice **dans la matrice payante des 27 dimensions** et **dans le
   comparateur gratuit**. C'est exactement le patron gravé dans `AGENTS.md` : le point de décision a
   été corrigé, les points de citation ne l'ont pas été.
5. **Deux amplificateurs.** Dans la matrice payante, deux communes tirées au hasard partagent le
   palier haut dans **64 % des cas** (51 % pour trois) : la ligne affiche alors « À égalité /
   Services proches / Services proches », avec la même surface et la même autorité qu'une ligne qui
   discrimine. La matrice n'invente pas de gagnant, le code est correct sur ce point
   (`comparateur-vie.ts:1527`), mais le lecteur paie pour un arbitrage et lit une ligne qui n'en rend
   aucun. Et le parsing d'intention **injecte `acces_services` au poids 2** dès que le lecteur dit
   « famille », « enfant », « élever un enfant », « grandir » (`api/comparateur-vie/parse/route.ts:267`) :
   sur une somme pondérée, une dimension quasi constante à poids 2 ne classe rien et **dilue** le
   poids relatif des critères qui, eux, discriminent.

**Ce que je propose, sans l'avoir tranché** : ne pas supprimer le critère, mais cesser de lui faire
dire une proximité. Trois options, par ordre de coût croissant : (a) renommer paliers et tooltip
pour ce que la donnée dit réellement (« Aucun habitant très éloigné » / « Une partie de la population
à plus de 20 minutes »), ce qui rend le binaire assumé et honnête ; (b) le retirer de l'injection
automatique « famille », où son poids 2 dilue sans classer ; (c) le remplacer à terme par une vraie
mesure de proximité, la matière existe déjà en BPE au point (module Logement, Face 3), ce qui pose la
question de frontière commune/adresse.

**Ce que je n'ai PAS vérifié** : le rendu à l'écran (session payante requise pour la matrice), et la
composition exacte du panier de services ADEME derrière les « 20 minutes ». Les chiffres ci-dessus
viennent tous de l'index et du code, pas d'une observation d'écran.

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
- **`inondation.tri` est codé en dur à `False`** (`scripts/populate-inondation.py:93`) et alimente
  l'index comparateur. Le champ est donc **présenté comme une donnée alors qu'il n'en est pas une** —
  c'est le pire des quatre états de l'information (absent, mais affiché comme mesuré). Vérifié le
  03/08 sur une commune réellement couverte par un TRI : le champ dit `false`. Soit le renseigner,
  soit le retirer du rendu.
- **`distance_cote_km` est faux sur des communes littorales.** L'approximation (haversine vers une
  liste de villes côtières, « V1 » assumée dans `data/comparateur-index.json`) classe **Lannion à
  58 km** et **Morlaix à 54 km** de la mer. Sur un produit qui vend de la lecture littorale, c'est
  visible. À remplacer par le trait de côte IGN, comme le prévoit déjà la note de méthode.
- **Aucune CGV n'existe** (rétractation 14 jours, médiateur de la consommation) ; arbitrage du
  porteur, à traiter en fin de séquence.
- **Le site est fermé au crawl** (`robots.txt` en `Disallow: /`) ; la canonicité des URL doit être
  tranchée avant de lever cette ligne.
