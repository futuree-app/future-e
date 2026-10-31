# FUT-149 · Dernières réserves techniques de la PR #111 (31/10/2026)

> Suite de la contre-revue indépendante (ChatGPT) : **GO avec réserves pour la fusion sans activation**, **NO GO pour
> la publication et l'activation**. Cinq vérifications demandées, toutes par exécution, sans nouvelle refonte.
> SHA audité au départ : `450434f1a02a71e84ec0b1ed718c8428204103d8`. Aucune fusion, aucun déploiement, aucune
> écriture Supabase, aucune modification Vercel, aucune clôture Linear.

Sondes rejouables et sorties brutes : `docs/audits/2026-10-31-fut149-reserves-finales/sondes/`. Source : archive IGN
complète du 01/03/2026, SHA-256 `b224f900…9b42e` (identique à celle documentée), dépendances épinglées
(`scripts/debroussaillement/requirements.txt` : Shapely 2.2.0 / GEOS 3.14.1, pyproj 3.8.0, numpy 2.5.4).

## Synthèse

| # | Réserve | Résultat |
|---|---|---|
| 1 | Micro-trous et quantification | **Défaut réel, confirmé dans l'édition nationale (1 lecture dangereuse), corrigé** par un changement de 3 lignes de l'encodage des limites, sans toucher à la précision ni ajouter de fermeture |
| 2 | Publication atomique, format 2 | **10 / 10 scénarios conformes**, 0 mélange sur 817 lectures examinées ; le détecteur voit un mélange quand on retire le contrôle d'empreinte (mutation) |
| 3 | Reproductibilité | Tuiles **identiques à l'octet** à 15 jours d'écart ; manifeste différent par `construitLe` seulement. Sans effet sur les garanties : **non corrigé**, documenté |
| 4 | Supabase | Stockage **mesuré** : 74,36 Mo (1 bucket, `fibre-adresse`). Egress et quotas : **non mesurables d'ici** (aucun jeton d'administration) |
| 5 | Validation | voir § 5 |

## 1. Micro-trous : la disparition géométrique

### 1.1 Le contre-exemple, reproduit avec le vrai constructeur et le vrai lecteur

`micro_trous_monde.py` fait construire par **le vrai `construire.py`** (seule la lecture du GeoPackage est remplacée)
une zone de 6 km × 6 km, en Lambert-93, percée de 1 521 trous de 0,5 à 50 mm (carrés, triangles, fentes de 30 cm),
espacés de 150 m pour que chacun soit seul dans sa fenêtre de lecture. `micro_trous_lire.mts` lit le centre de chaque
trou avec **la vraie lib**. Vérité : le centre est strictement hors zone, à quelques millimètres d'elle, donc l'état
juste est « en limite ».

| Largeur du trou | 0,5 mm | 1 mm | 2 mm | 3 mm | 5 mm | 8 mm et plus |
|---|---|---|---|---|---|---|
| Lus **« en zone »** (avant correctif) | 94 / 169 | 72 / 169 | 55 / 169 | 36 / 169 | 4 / 169 | 0 |
| Après correctif | 0 | 0 | 0 | 0 | 0 | 0 |

**261 lectures dangereuses sur 1 521, avant ; 0 après.**

**Le mécanisme exact** (deux pertes simultanées, il faut les deux) :
1. Le morceau est arrondi au 1e-7 degré (≈ 1,1 cm en latitude, 0,8 cm en longitude) : un trou plus petit qu'un cran
   de grille disparaît du polygone publié (`set_precision`, ou `anneau_code` qui rejette un anneau de moins de trois
   sommets distincts). Le point du trou est alors « contenu » par le morceau.
2. Le format 2 devait rattraper ce cas : la vraie limite du trou est rangée dans `limites`, et un point à moins de
   50 m d'une limite est « en limite ». Mais quand **tous les sommets de cette limite tombent sur le même point de la
   grille**, `ligne_code` rendait `None` et la ligne était **jetée**. Plus aucune limite à moins de 50 m : « en zone ».

Un trou plus grand qu'un cran survit dans `limites` (une ligne de deux sommets ou plus), et le point est lu « en
limite » même si le trou a disparu du morceau : c'est le comportement documenté au § 14 du 30/10 (« résolution de
publication, ≈ 1 cm »).

### 1.2 Les trous, anneaux et discontinuités de la base nationale

Inventaire des vides de la réunion (repris du 30/10, même méthode) : 7 091 vides de moins de 1 mm, 451 de 1 mm à
1 cm, 667 de 1 à 10 cm… Ce qui compte pour la classification, c'est ce qui en reste dans les tuiles publiées.

**Trous des morceaux, avant et après publication** (`trous_morceaux.py`, toutes les zones découpées à toutes les
cellules, comme le constructeur ; largeur moyenne = 2 × aire / périmètre, en Lambert-93) :

| Largeur moyenne du trou | < 1 mm | 1 mm – 1 cm | 1 – 10 cm | 10 cm – 1 m | ≥ 1 m | Total |
|---|---|---|---|---|---|---|
| Géométrie officielle (non arrondie) | 4 | 288 | 483 | 676 | 20 308 | 21 759 |
| Tuiles publiées (après arrondi) | 3 | 213 | 493 | 671 | 20 308 | 21 688 |

**71 trous disparaissent des morceaux**, tous de moins de 1 cm environ (l'arrondi déplace aussi quelques trous d'une
classe à la voisine, d'où + 10 entre 1 et 10 cm). Ce sont des trous d'UNE zone : une autre zone peut les couvrir. Un
trou disparu du morceau n'est lu juste que si sa limite reste dans `limites` : c'est ce qu'examine la suite.

**Limites effacées par l'encodage** (`limites_effondrees.py`, qui rejoue la boucle du constructeur et garde chaque
ligne de `limites_cellule` dont `ligne_code` rendait `None`) : **15 sur 50 413**, dans 9 cellules :

| Nature | Nombre | Étendue | Aire |
|---|---|---|---|
| Trou fermé de la réunion (point intérieur hors de toute zone d'origine) | 7 | 0,003 à 7,9 mm | 0 à 0,13 mm² |
| Fragment ouvert (morceau d'une limite rangé dans une cellule voisine, ou bout d'encoche) | 8 | 0,6 à 4,8 mm | (sans objet) |
| Îlot de zone (une zone plus petite que la grille) | **0** | (sans objet) | (sans objet) |

Cellules : -3_430 (64), 21_434 (81), 39_438 et 39_445 (30/48), 56_433, 57_432, 57_433, 57_434, 57_436 (13/83).
Ce sont des raccords de numérisation entre zones voisines, du même ordre que les liserés du § 14 du 30/10.

### 1.3 Conséquences exactes sur la classification, contre l'oracle des géométries d'origine

79 points d'épreuve (`effondrees_points.py` : le point intérieur de chaque trou ; le milieu de chaque fragment et 8
points à ±0,5 mm et ±2 mm), vérité sur les géométries IGN d'origine en Lambert-93, lus avec la vraie lib sur
l'édition nationale construite (`effondrees_lire.mts`) :

- **avant correctif : 1 lecture dangereuse.** Trou n° 6, cellule 56_433 (5,68023 ; 43,32061, jonction des
  Bouches-du-Rhône et du Var près de Gémenos) : un liseré triangulaire de 4,35 mm × ≈ 30 µm (0,07 mm²) ; un point
  **strictement hors zone**, à 8 µm du bord, est lu « en zone ». Les 14 autres sites n'étaient pas dangereux par
  chance : une autre vraie limite passait à moins de 50 m.
- **après correctif : 0 lecture dangereuse** ; les 79 points sont « en limite (dans la zone) », comme les autres
  points à moins de 1 cm d'un bord (§ 14 du 30/10 : seule la formulation diffère de la vérité, « dans la zone, près
  de sa limite » au lieu de « à environ 5 m »).

La portée réelle est infime (une adresse devrait tomber dans 0,07 mm²), mais le défaut est **réel** (présent dans
l'édition qui serait publiée) et contraire à la règle « jamais un point hors zone lu en zone ». Il est corrigé.

### 1.4 Le correctif minimal

`scripts/debroussaillement/construire.py`, `ligne_code` : une vraie limite dont tous les sommets tombent sur le même
point de la grille est **gardée comme un point**, codée en segment de longueur nulle `[x0, y0, 0, 0]`, au lieu d'être
jetée. Ce n'est ni un changement de précision (toujours 1e-7 degré), ni une fermeture (aucun vide refermé, aucun
créé) : la limite reste où elle est, à la résolution près. Le manifeste compte ces limites
(`stats.limites.ponctuelles`, 15 dans l'édition nationale).

**Aucun changement du lecteur** : le format `debroussaillement-2` acceptait déjà une ligne de quatre entiers
(`tuileValide`), `limitesDansFenetre` en fait un segment de deux sommets confondus, et `distanceSegment` traite la
longueur nulle (`l2 === 0`). Pas de nouveau format, pas de nouvelle convention de lecture : l'édition n'a jamais été
publiée.

### 1.5 Absence de régression

| Contrôle | Résultat |
|---|---|
| Édition nationale reconstruite avec le correctif | 2 453 fichiers ; **9 tuiles changent**, exactement les 9 cellules ci-dessus ; total 54 914 164 → 54 914 261 octets (+97) |
| 14 tuiles des fixtures de la PR | **identiques à l'octet** à la nouvelle construction |
| 48 840 lectures nationales, avant / après (`regression_lectures.mts` : 10 points au hasard par cellule, 2 000 dans chaque cellule modifiée, 400 à moins de 60 m de chaque limite ponctuelle) | **420 changent, toutes à moins de 60 m d'une limite ponctuelle, toutes « en zone » → « en limite (dans la zone) »** ; 0 changement sur les 24 840 points nationaux et les 18 000 des cellules modifiées hors de ces rayons |
| Monde de 1 521 micro-trous | 261 → 0 lecture dangereuse |
| Nouveau test (`fut149-debroussaillement.test.ts`) sur une tuile du **vrai constructeur** (`__fixtures__/fut149/micro-trous`, 81 trous, 1,7 Ko) | passe ; il échoue si l'on retire les limites ponctuelles (ancien encodage : 15 centres de trous lus « en zone ») |

Les 420 lectures qui changent passent d'« en zone » à « en limite » autour de raccords réels de la base, larges de
quelques micromètres à quelques millimètres. C'est la règle stricte déjà appliquée aux 1 770 km d'autres raccords
(§ 14-15 du 30/10, option (a) tant que la fermeture n'est pas arbitrée) : le correctif la rend cohérente, il ne
l'étend pas.

## 2. Publication atomique, au format 2

`sondes/publication.mjs` (30/10) écrivait des tuiles au format 1, que le lecteur refuse désormais : elle ne prouvait
plus rien. `publier.test.mjs`, dans la PR, est au format 2, mais avec des tuiles écrites à la main.

La nouvelle contre-épreuve `publication2.mjs` publie **trois éditions construites par le vrai `construire.py`**
(`editions_publication.py` : 18 cellules, `2026-03-01`, `.2`, `.3` ; chaque tuile change d'une édition à l'autre, et
les 19 points lus, dont un coin de quatre cellules, donnent une lecture différente en E1 et en E2), avec **le vrai
`publier.mjs`** et **le vrai lecteur serveur**, sur un Storage simulé en mémoire et fidèle (doublon refusé en 400 avec
un corps 409, absent en 400, latence aléatoire, coupure, corruption). Aucun accès réseau.

**Détecteur de mélange** : un crochet de chargement intercale une enveloppe de `lireDebroussaillement` entre le
lecteur serveur et la lib. À chaque lecture, le manifeste et **chaque tuile reçus** sont comparés, en égalité profonde,
aux fichiers locaux d'une même édition (ou d'un même contenu concurrent entier, en 1b). En plus, chaque résultat doit
être celui que la lib pure calcule sur cette édition.

| # | Scénario | Résultat |
|---|---|---|
| 1a | Deux envois concurrents du même contenu (20 essais) | 20 / 20 : en ligne identique à l'octet à la construction |
| 1b | Deux envois concurrents de contenus différents sous le même nom neuf (20 essais) | selon la course, bascule sur l'**un ou l'autre contenu entier**, ou refus d'intégrité (tuiles des deux envois) ; **0 lecture hybride** |
| 1c | Deux bascules concurrentes | pointeur final sur l'une ; 19 / 19 lectures de cette édition |
| 2 | Publication interrompue après 0, 1, 9, 17, 18 dépôts (Storage neuf à chaque fois), puis reprise | toujours : bascule refusée (pas de manifeste), lecteurs 19 / 19 sur l'édition active ; reprise idempotente (ne dépose que le manquant), bascule, 19 / 19 sur la nouvelle |
| 3 | Tuile corrompue : remplacée par une autre tuile valide, puis tronquée, avant la bascule ; remplacée en ligne après la bascule (hors protocole) | bascule refusée (« intégrité »), pointeur inchangé ; après bascule : les 2 points qui lisent cette tuile sont « indisponibles », jamais lus |
| 4 | Bascule E1 → E2 | 19 / 19 sur E2 (instance neuve) |
| 5 | Retour arrière E2 → E1, instance chaude | 0 min : E2 (pointeur gardé) ; 10 min 01 : 19 / 19 sur E1 |
| 6 | Purge : E3 publiée et activée, retour arrière sur E2, `purger --garder 1` | gardées : E2 (courante) et E3 (la plus récente) ; retour sur E3 possible ; puis `--garder 2` avec E3 courante : E2 gardée, retour arrière sur E2 possible |
| 6b | Édition purgée encore désignée par une instance chaude (≤ 10 min) | la tuile déjà en mémoire est servie (empreinte vérifiée), les autres « indisponibles » ; jamais de lecture fausse ; après expiration du pointeur, 19 / 19 sur l'édition courante |
| 7 | Cache chaud pendant la bascule, 19 lectures concurrentes à 0, 3, 6, 9, 9,99, 10,01 et 12 min | 19 / 19 sur E1 jusqu'à 9,99 min, 19 / 19 sur E2 dès 10,01 min ; **aucune lecture mêlant les deux** |

**Bilan : 10 / 10, 817 lectures examinées, 0 mélange.** Mutation : si l'on retire au lecteur le contrôle d'empreinte
des tuiles, le détecteur compte 4 mélanges et le scénario 3 échoue ; fichier restauré ensuite (`git status` propre).

Ce que la contre-épreuve ne couvre pas, et que seul un projet de test Supabase réel couvrirait : le comportement
exact du CDN de Supabase (le lecteur contourne le cache pour le pointeur et le manifeste, et vérifie l'empreinte de
chaque tuile) ; l'unicité (bucket, nom) des dépôts sans écrasement, simulée ici comme atomique, conformément à la
contrainte documentée par Supabase.

## 3. Reproductibilité

Deux constructions nationales complètes avec le correctif : le 31/10, et « le 15/11 » (`construire_date.py` ne remplace
que `datetime.date.today()`).

| | Résultat |
|---|---|
| Tuiles (2 453 fichiers) | **identiques à l'octet** |
| Manifeste | diffère par **une seule clé**, `construitLe` (`2026-10-31` / `2026-11-15`) ; empreintes `858cf7d6…` / `91f1b18d…` |

Trois identités, à ne pas confondre :
- **le contenu géographique** : la table `tuiles` du manifeste (taille et SHA-256 de chaque tuile). Reproductible à
  l'octet, quelle que soit la date ;
- **les métadonnées de construction** : `construitLe`, seule valeur qui dépend du jour (le nom du fichier source et
  sa taille dépendent de la source, pas du moment) ;
- **l'édition publiée** : son identifiant (`2026-03-01`, `.N`) et l'empreinte de son manifeste, que le pointeur porte.
  Deux constructions à des jours différents donnent donc deux objets publiables distincts.

Effet sur les garanties de publication : aucun dans le sens dangereux.
- `envoyer` d'une construction refaite un autre jour, pour une édition dont le manifeste est déjà en ligne, est
  **refusé** (« déjà publiée avec un autre manifeste »). C'est un faux refus, prudent : l'édition en ligne est
  complète, il n'y a rien à reprendre.
- Une reprise après interruption n'est pas touchée : le manifeste est déposé en dernier, donc absent tant que l'envoi
  n'a pas abouti ; les tuiles reconstruites sont identiques et acceptées.
- Le lecteur ne lit jamais `construitLe`.

**Non corrigé**, comme demandé. Seul ajout : un commentaire au point d'écriture de `construitLe` qui dit tout cela.
Pour vérifier qu'une édition publiée correspond à une reconstruction, on compare la table `tuiles` (ou le manifeste
sans `construitLe`), pas l'empreinte du manifeste.

## 4. Supabase, en lecture seule

| | Mesure ou état |
|---|---|
| Projet | `xkewgsccadjmondzmjxj` (production, d'après `.env.local`) |
| Buckets | **un seul**, `fibre-adresse` (privé) ; **aucun bucket OLD** |
| Stockage réel (API Storage, parcours complet, lecture seule) | **1 308 objets, 74,36 Mo** (70,92 Mio) |
| Variable `DEBROUSSAILLEMENT_*` sur Vercel (`vercel env ls`) | **aucune** |
| Egress actuel, quotas, dépassements, offre souscrite | **non mesurés** : aucune authentification d'administration Supabase sur ce poste (`supabase projects list` → `AccessTokenRequiredError`) ; la clé de service ne donne pas accès aux mesures de facturation |
| Taille de la base Postgres (comptée dans les quotas) | **non mesurée** (aucun accès SQL direct) |

**Projections, pas des mesures** : une édition OLD pèse 54,9 Mo (54 914 261 octets), deux éditions gardées 109,8 Mo ;
stockage cumulé fibre + OLD, deux éditions : ≈ 184 Mo. L'egress par lecture OLD reste celui du § 14 du 30/10
(≈ 22 Ko par lecture sans tuile en mémoire, ≈ 300 Ko par démarrage d'instance). Le quota « Free 1 Go / 5 Go
d'egress » cité le 30/10 n'est pas vérifié : l'offre réelle du projet n'a pas été lue.

Pour lever cette réserve, le porteur peut lire Usage dans le tableau de bord Supabase (organisation → Usage :
stockage, egress du cycle, offre), ou ouvrir une session `supabase login` pour que je lise les mesures en lecture seule.

## 5. Validation technique avant fusion

Sur la tête corrigée `e3206cdc` (§ 6) ; `main` = `82cbc171` (#117). Ni FUT-157 ni FUT-163 (164 à 167) dans `main`
ni dans la branche : elles ne sont pas intégrées.

| Contrôle | Branche | Fusion simulée avec `main` (`--no-commit`, worktree jetable, rien poussé) |
|---|---|---|
| Compatibilité | (sans objet) | **sans conflit** (fusion automatique de `route.ts` et `logement-report-types.ts`, comme le 30/10) |
| TypeScript (`tsc --noEmit`) | 0 erreur | 0 erreur |
| Tests FUT-149 ciblés | le nouveau test passe ; `fut149-debroussaillement.test.ts` et `publier.test.mjs` verts dans la suite | idem |
| Suite complète (`--test-concurrency=1`) | **3 933 / 3 933** (3 932 du 30/10 + 1) | **4 015 / 4 015** (4 014 du 30/10 + 1), 0 échec |
| Build de production (`next build`) | réussi | réussi |

**Taille des fonctions** (traces `.nft.json` du build, `taille_fonctions.cjs`) :

| Fonction | `main` | Branche / fusion | Écart |
|---|---|---|---|
| `/api/georisques-logement` | 158 fichiers, 22,765 Mo | 159 fichiers, 22,776 Mo | + 1 fichier (code compilé), + 11 Ko ; **aucune donnée** (3 fichiers `data/` des deux côtés) |
| `/api/logement-autour` | 2 369, 55,146 Mo | 2 370, 55,156 Mo | + 1, + 10 Ko |
| `/rapport/autour` | 178, 21,670 Mo | 179, 21,694 Mo | + 1, + 24 Ko |

**Inertie sans `DEBROUSSAILLEMENT_BUCKET`** :
- test de la PR (« non configuré : rien n'est lu, rien n'est écrit, aucun appel réseau ») vert ;
- contre-épreuve d'exécution indépendante (`inerte.mjs`) : `fetch` GLOBAL espionné, environnement du processus avec
  les autres variables Supabase présentes, lecteur appelé avec ses paramètres par défaut comme le font les routes.
  Résultat : **0 appel réseau**, lecture `undefined` ; le rapport Logement n'a **aucune clé `debroussaillement`**
  (écriture conditionnelle `...(d ? { d } : {})`).
- Une nuance, exacte : la réponse HTTP d'Autour (`autour-response.ts`, calculée au rendu, **jamais persistée**)
  porte toujours la clé `debroussaillement: null`, que l'écran ne rend pas. Rien n'est écrit en base.

## 6. Livraison

- Commit `e3206cdc` sur `bonjourfuturee/fut-149-debroussaillement` : `construire.py` (`ligne_code`, compteur
  `stats.limites.ponctuelles`, commentaires du format et de `construitLe`), test et fixture `micro-trous`.
- Commit de documentation : ce rapport et ses sondes.
- Lecteur, publieur, routes, écrans : **inchangés**. Format `debroussaillement-2` et convention `fut149-2` inchangés.
- L'édition nationale doit être **reconstruite avec ce code** avant toute publication : 9 de ses tuiles changent.

## 7. Verdicts

**Prêt à fusionner sans activation : GO.**
- Le seul défaut réel trouvé (limites effacées sous la résolution) est corrigé, avec un test qui échoue sans le
  correctif, et une non-régression démontrée sur 48 840 lectures nationales.
- Publication au format 2 rejouée sur des éditions du vrai constructeur : 10 / 10, aucun mélange.
- Fusion simulée propre, 4 015 tests, build réussi, fonctions sans données nouvelles, code inerte sans la variable.

**Prêt à publier / activer : NO GO**, pour des raisons qui ne sont plus des défauts de code :
1. **Mesures Supabase manquantes** : egress du cycle, quotas et offre réelle du projet, taille de la base. Seul le
   stockage est mesuré (74,36 Mo). À lire dans le tableau de bord, ou par une session `supabase login`.
2. **Arbitrage de la fermeture des raccords** (§ 15 du 30/10) toujours ouvert. Sans arbitrage, la règle stricte
   s'applique : les raccords de la base restent des limites (prudent), et ce rapport en ajoute 420 lectures « en
   limite » cohérentes avec elle.
3. **Reconstruction** de l'édition avec le code final (et l'option de fermeture retenue), puis procédures du § 10 du
   30/10 : bucket privé créé à la main, `envoyer`, `basculer`, variable Vercel posée en dernier, retour arrière par
   `basculer`.
4. Non couvert ici, et seulement par un projet Supabase de test réel : le comportement du CDN et de l'unicité des
   dépôts sans écrasement, simulés fidèlement mais pas observés.
