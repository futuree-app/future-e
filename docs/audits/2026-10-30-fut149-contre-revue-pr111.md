# FUT-149 · Contre-revue critique finale de la PR #111

> 30/10/2026. Sections 1 à 10 : la contre-revue du matin, sur `c1afce5e` (vérification seule, aucun commit).
> Sections 11 et 12 : les corrections de l'après-midi, demandées par le porteur et poussées dans la PR #111, et
> l'étude de R3, à arbitrer. Dans les deux cas : aucune fusion, aucun déploiement, aucun bucket, aucune
> publication, aucune variable Vercel. FUT-149 reste In Progress.
> Travail fait dans des worktrees temporaires (scratchpad), sans toucher la branche de travail en cours.
> Sondes rejouables : `sondes/` (scripts indépendants des tests de la PR) ; prototype de correctif : `sondes/prototype-perf.diff`.

## 1. SHA audité et contexte Git

| | Constat |
|---|---|
| Tête de la PR #111 | `c1afce5ec1095e5d1e261d2432b1b3f1df101fbc`, **identique au SHA attendu** ; OPEN, MERGEABLE, CLEAN |
| `main` | `26044b32` (fusion de #109) ; a avancé depuis le dernier rapprochement de la PR (#109, #113, #114) |
| Base commune | `76095598` |
| Fusion simulée `main` → tête (`--no-commit`, rien poussé) | **sans conflit** (fusion automatique de `route.ts` et `logement-report-types.ts`) |
| Fibre #108, Géorisques #110, #112 | aucun de leurs fichiers touché par la PR ; seules les deux lignes de déstructuration de la route changent (`…, bruitAerien, debroussaillement, fibre]`) |
| TypeScript sur la fusion simulée | `tsc --noEmit` : 0 erreur |
| Suite complète (`--test-concurrency=1`) | `main` seul **3 889** ✔ · tête seule **3 914** ✔ (chiffre de la PR confirmé) · fusion simulée **3 977** ✔ (= 3 889 + 88 tests FUT-149), 0 échec |

## 2. Données nationales rejouées

Archive IGN complète du 01/03/2026 retéléchargée : SHA-256 `b224f900…9b42e`, **identique** à celle documentée.
Reconstruction par `construire.py` (versions épinglées) : 4 237 zones, 52 départements, 2 493 tuiles dont 40 pleines,
2 453 fichiers, 32,8 Mo, médiane 8,8 Ko, max 128 Ko, écart d'aire 0 %. **Construction déterministe** : les 14 tuiles
des fixtures de la PR sont identiques à l'octet aux miennes, et leurs entrées de manifeste aussi.

Oracle indépendant (`sondes/oracle_clip.py`) : géométries IGN **d'origine** (Lambert-93, non découpées, non arrondies),
union des zones, Shapely. Ce n'est pas l'oracle de la PR, qui relit les tuiles elles-mêmes.

## 3. Blocage Work n° 1 · frontières de tuiles : **corrigé**

**Reproduction du défaut initial** (mes sondes synthétiques `sondes/frontieres.mts`, rejouées sur `4f27d07d` puis sur la tête) :

| Scénario | `4f27d07d` | Tête |
|---|---|---|
| Vraie limite verticale alignée, voisine absente, points à 1/5/10/20/49 m des deux côtés | 10 lectures fausses (« en zone » / « hors zone ») | « en limite » partout ; 55 et 100 m : en zone / hors zone |
| Vraie limite, voisine listée avec une zone ailleurs | 10 fausses | juste |
| Voisine pleine ; voisine en morceau qui continue ; deux zones de profils différents de part et d'autre | juste (coupe) | juste (aucune fausse limite) |
| Voisine couverte au sud seulement : nord (vraie limite) / sud (coupe) / au droit de la jonction | 10 fausses au nord | juste dans les trois cas |
| Limite horizontale (voisine absente / pleine) | 10 fausses | juste |
| Voisine listée mais non chargée | panne | **indisponible** (jamais une conclusion) |
| Coin de quatre cellules couvertes | juste | juste |
| Liseré de 2 m dans la voisine ; encoche de 3 m (plus court que le pas d'examen de 5 m) | juste | juste |
| Parcelle collée dehors contre une vraie limite alignée | « hors zone » (faux) | « en limite, bordure » |
| Parcelle à cheval sur une vraie limite / sur une coupe | juste | juste (50 % / part 1) |

140 vérifications, 0 écart sur la tête ; 51 écarts sur `4f27d07d`.

**Sur données réelles** : 20 000 points tirés à 1, 5, 10, 20, 30, 40, 60, 80 et 120 m des droites de la grille, de
part et d'autre, comparés à l'union des géométries d'origine. Tête : **19 977 concordent** ; les 23 écarts sont tous
du défaut R3 ci-dessous (arête partagée entre deux zones), aucun n'est dû à la grille, aucun écart dans la bande des
50 m. `4f27d07d` donne **exactement la même répartition** : dans l'édition réelle, la correction ne change aucune
lecture, comme l'annonçait la PR. Elle ne recrée pas de fausse limite au milieu des zones.

**Affirmation « 3 vraies limites alignées de 1 à 3 cm »** : le script de la PR, rejoué sur ma construction, rend
64 220 km d'arêtes alignées et 3 cellules concernées (`-4_437`, `4_467`, `5_475`), longueur arrondie 0 m :
**reproduit**. Il emploie toutefois la même méthode que la lib (non indépendant). Ma mesure indépendante (frontière
de l'union d'origine à ±1 cm d'une droite) n'est pas comparable terme à terme (elle compte aussi des traversées
rasantes non aimantées par l'arrondi) ; la preuve qui compte est comportementale : 0 lecture affectée sur 20 000.

**Défaut nouveau introduit par cette correction (R1, ci-dessous)** : le coût de calcul.

## 4. Blocage Work n° 2 · publication atomique : **corrigé**, avec une faille hors protocole

Vrai publieur et vrai lecteur serveur sur un Storage simulé (`sondes/publication.mjs`), sans accès à Supabase.

| # | Scénario | Résultat |
|---|---|---|
| 1 | Nouvelle édition complète | publiée ; invisible tant que le pointeur n'est pas écrit (tests PR, rejoués verts) |
| 2 | Republication identique | idempotente, 0 dépôt |
| 3 | Manifeste différent sous une édition existante | refusé avant toute écriture |
| 4 | Tuile différente sous une édition existante | refusée avant tout dépôt |
| 5–6 | Coupure en cours d'envoi, reprise | lecteurs inchangés ; bascule refusée (pas de manifeste) ; reprise aboutie |
| 7 | Tuile distante corrompue | bascule refusée ; le lecteur la refuserait aussi (empreinte) |
| 8 | Bascule avant publication complète | refusée |
| 9 | Retour à l'édition précédente | fonctionne ; **jusqu'à 10 min** de décalage par instance chaude (pointeur gardé en mémoire) |
| 10 | Deux envois concurrents, contenus différents, même identifiant neuf (20 essais, latence aléatoire) | un seul aboutit, l'autre échoue sur un doublon ; jamais de mélange : chaque tuile en ligne correspond au manifeste en ligne |
| + | Réponse 503 alors que l'écriture a eu lieu | échec propre (doublon), reprise aboutie |

**Garantie réelle** : aucun lecteur ne peut observer un mélange, parce que (a) le lecteur vérifie la taille et le
SHA-256 de chaque tuile contre le manifeste qu'il a lu, et (b) le dépôt sans écrasement (`x-upsert: false`) est garanti
par la contrainte d'unicité de Supabase Storage (bucket, nom). La sécurité ne repose pas sur un ordre d'écriture fragile.
Hypothèses non garanties par le stockage : personne n'écrase un objet par le tableau de bord ou l'API S3, et un
identifiant d'édition n'est jamais réutilisé après effacement (voir R4).

**Faille reproduite (R4)** : si une édition est purgée puis un contenu différent republié sous le même identifiant,
une instance chaude garde l'ancienne tuile en mémoire (clé `édition/cellule`, sans empreinte) et la combine avec le
nouveau manifeste : lecture « en zone » au lieu de « hors zone » dans ma sonde. Il faut sortir du protocole (purge puis
reconstruction sans `--revision`), mais rien ne l'empêche.

## 5. Réserve Work n° 3 · attribution parcellaire : **corrigée**

Sondes synthétiques (`sondes/parcelles.mts`), 17 cas, 0 écart : point dedans (parcelle) ; parcelle voisine déclarée
« point », dans les deux sens (jamais attribuée, lecture au point dite) ; point exactement sur le bord, à 5 mm dedans,
à 5 mm dehors (lecture au point) ; à 2 cm dedans (parcelle) ; à 2 cm dehors (au point) ; nœud papillon et géométrie
vide (non mesurable) ; plusieurs candidats ; repli ; parcelle à cheval (le grain reste la parcelle, part 50 %, « en
limite ») ; MultiPolygone ; trou contenant le point ; géocodage à la rue.

**24 adresses réelles** rejouées contre la géométrie IGN **d'origine** et le cadastre des fixtures (`sondes/adresses.mts`) :
**48 / 48 concordances** (au point et au Logement), parts identiques au millième (Fréjus 13,2 %, Gonfaron 10,1 %,
Cazaux 18,8 %, Nîmes 57,5 %…). Aucune parcelle n'est utilisée sans contenir le point (Shapely). Bordeaux, place de la
Bourse : point à **8,3 mm** du tracé, lu au point, « hors zone » à 899 m de toute zone : conforme. Le grain affiché
correspond toujours à la géométrie utilisée.

## 6. Réserve Work n° 4 · précision juridique : **corrigée pour l'essentiel**, une lacune

Textes relus : code forestier, édition consolidée du 13/10/2026 (codes.droit.org, d'après Légifrance ; Légifrance
direct inaccessible depuis l'outil). L134-6 (loi 2023-580, art. 21) et L134-8 :

| Point | Écran | Verdict |
|---|---|---|
| 1° abords des constructions, 50 m, porté à 100 m par le maire | « Autour des constructions, sur 50 m, que le maire peut porter à 100 m » | exact |
| Charge 1° et 2° : propriétaire des constructions (L134-8, 1°) | « elle incombe au propriétaire des constructions » | exact |
| 3° terrains en zone urbaine d'un PLU, terrain entier ; charge : propriétaire du terrain (L134-8, 2°) | « sur la totalité du terrain, bâti ou non… propriétaire du terrain » | exact |
| **4° zones urbaines des communes SANS PLU** : même obligation sur le terrain, à la charge du propriétaire du terrain (L134-8, 2° vise les cas 3° à 6°) | absent : l'écran réserve l'obligation sur le terrain aux zones urbaines **d'un PLU** (`REGLE`, `RESPONSABLE`, `VERIFIER_A_CHEVAL`) ; le commentaire du code décrit le 4° comme une seule faculté du préfet | **lacune (R5)** |
| 5°–8° (ZAC/lotissements, L444-1, campings, ICPE) | « D'autres cas… ont leurs propres règles » | acceptable |
| Zonage informatif | « selon le zonage informatif publié par l'État » ; « seuls l'arrêté du préfet et le code forestier font foi » ; hors zone : « seule la mairie peut confirmer qu'aucune obligation ne s'applique » | conforme |
| Décret n° 2024-405, R125-23 | non revérifié ici (validé par la revue du 28/10) | non vérifié |

**Exceptions du Vaucluse** : Richerenches, Lapalud et Jonquières figurent bien à l'annexe 2 de l'arrêté du 13/04/2026
(JO du 28/04/2026, PDF AIDA/INERIS relu) ; codes Insee 84097, 84064, 84056 (Vaucluse, pas Jonquières du Tarn) ;
traités en « incertain » (test de la PR et lecture du code). Cinq autres communes du Vaucluse de l'annexe 2 ne sont pas
listées : sans zone à plus de 200 m de leurs limites selon la contre-épreuve de la PR (non rejouée ici).

## 7. Défauts restants, par gravité

Aucun n'est visible tant que `DEBROUSSAILLEMENT_BUCKET` n'est pas défini.

| | Gravité | Défaut | Reproduction | Correctif minimal recommandé (non réalisé) |
|---|---|---|---|---|
| **R1** | Modérée, **avant activation** | La correction n° 1 examine chaque arête alignée sur **toute sa longueur** (jusqu'à 11 km, ~2 000 tests point-dans-polygone), pas seulement dans la fenêtre de lecture. Coût CPU par lecture : médiane 0,8 → 2,3 ms, **p99 9 → 211 ms, max 39 → 1 046 ms** (9 972 lectures, toutes cellules). Calcul synchrone : bloque l'instance Fluid pour les requêtes concurrentes ; facturé en CPU actif. La PR annonce « calcul 2 ms ». | `node sondes/perf.mts <worktree> <édition>` | Dans `vraiesLimites`, ne parcourir que les pas `k` dont le sous-segment croise la fenêtre. Prototype (`sondes/prototype-perf.diff`, 6 lignes) : p99 **14 ms**, max **43 ms**, **0 différence sur 14 958 lectures** et sur les 140 sondes. |
| **R2** | Modérée, **avant activation** | Le lecteur relit le **manifeste (270 Ko)** en contournant le CDN à chaque démarrage d'instance et toutes les 10 min. L'estimation « 10 à 40 Ko par ouverture, 100 000 lectures pour 5 Go » ne tient pas à froid : ≈ 280 Ko par lecture froide, soit ≈ 18 000 lectures froides pour 5 Go ; une instance chaude en continu consomme ≈ 1,2 Go/mois ; trois fonctions distinctes ont chacune leur mémoire. Quota Free partagé avec la fibre (et, selon le plan, avec la base). | mesure directe du manifeste construit | Relire seulement `courant.json` (≈ 60 octets) toutes les 10 min ; ne télécharger le manifeste que si l'édition change, sans paramètre anti-cache (il est immuable, comme les tuiles). |
| **R3** | Modérée (prudente), à arbitrer | Les zones IGN partagent **3 075 km d'arêtes** entre objets distincts (2/3 aux limites de départements, 1/3 dans un même département). La lib mesure la distance au bord de **chaque** morceau, pas à la frontière de l'union : un point à l'intérieur du zonage, à moins de 50 m d'une arête partagée, est lu « en limite » ; l'écran dit alors « selon l'endroit exact, le logement peut y être ou non », ce qui est faux. **3 000 / 3 000** points échantillonnés (zone, ≥ 65 m de toute vraie limite) sont lus « en limite ». Bande ≈ 300 km², soit 0,24 % du zonage. Au point seulement (Autour, Logement sans parcelle) ; à la parcelle, les aires s'additionnent et la lecture est juste. Défaut antérieur aux corrections, jamais une conclusion fausse dans le sens dangereux. | `sondes/oracle_clip.py` puis `sondes/evaluer.mts … partage` | Calculer les vraies limites à la construction (frontière de l'union, découpée par cellule) et les publier dans la tuile, à côté des polygones ; la lib mesure les distances sur elles seules. Cela supprime aussi l'examen de l'autre côté de la grille à l'exécution (R1). Changement de format (`debroussaillement-2`), donc nouvelle édition. |
| **R4** | Faible (hors protocole) | Mémoire des tuiles indexée par `édition/cellule` sans empreinte : mélange possible après purge puis réutilisation d'un identifiant d'édition. | `sondes/publication.mjs`, scénario B | Indexer la mémoire par l'empreinte attendue (`${cle}/${attendu.sha256}`), ou recontrôler l'empreinte de la tuile mémorisée contre le manifeste. |
| **R5** | Faible, texte | Lacune du 4° de L134-6 (zones urbaines des communes sans PLU). | lecture de `debroussaillement-texte.ts` | « dans une zone urbaine (d'un plan local d'urbanisme, ou d'une commune qui n'en a pas) », dans `REGLE`, `RESPONSABLE` et `VERIFIER_A_CHEVAL` ; corriger le commentaire du 4°. |
| R6 | Faible, texte | Pour `parcelleEcartee: "limite"` avec un seul candidat (Bordeaux), l'écran dit « le point tombe sur la limite de deux parcelles » ; le voisin peut être la voie publique. | fixture `bordeaux-bourse` | « Le point de l'adresse tombe sur la limite de la parcelle ». |
| R7 | Faible, exploitation | `purger` et `etat` trient les éditions par ordre alphabétique : `2026-03-01.10` passe avant `2026-03-01.2`. | `sondes/publication.mjs`, F | Trier par date, puis par numéro de révision. |
| R8 | Info | `construire.py` laisse l'extraction de 1,76 Go dans le dossier de sortie ; `exclusions-arretes.json` cite un fichier `02-contre-epreuve-arretes.md` qui n'existe pas (c'est `02-contre-epreuves.md`). | | Nettoyer l'extraction ; corriger le nom. |
| Hors périmètre | — | Le bruit aérien (FUT-146, déjà sur `main`) n'a pas le contrôle « le point est dans la parcelle » : la parcelle voisine marquée « point » y reste attribuable. | `bruit-aerien.ts`, l. 422-427 | Ticket séparé : même contrôle que FUT-149. |

## 8. Risques

- **Données** : aucune conclusion fausse dans le sens dangereux observée (jamais « hors zone » pour un point dans une
  zone, sur 23 000 points et 24 adresses). R3 sur-prévient dans 0,24 % du zonage.
- **Utilisateurs** : rien de visible avant activation. Après activation, l'ordre compte. Une variable posée avant la
  première bascule rend tous les rapports « Zonage non lu » (sonde E). Retirer la variable après activation fige
  l'actualisation de tous les dossiers lus entre-temps (`issueActualisation` → refusée). Le retour arrière doit donc
  passer par `basculer`, jamais par le retrait de la variable.
- **Coûts** : stockage 32,8 Mo par édition (≈ 66 Mo pour deux), envoi ≈ 66 Mo d'egress (relecture de chaque tuile),
  chaque bascule ≈ 33 Mo (relecture de toutes les empreintes). Lecture : voir R2. CPU : voir R1. Aucun coût monétaire
  sur le plan Free tant que les quotas tiennent ; à vérifier dans le tableau de bord Supabase : le périmètre des quotas
  (projet ou organisation) et la consommation actuelle de la fibre.
- **Infrastructure** : aucune donnée nationale dans les fonctions (seul le code compilé ; la page `/dev/fut149`
  répond 404 en production, `NODE_ENV`) ; sans variable, `configDebroussaillement` rend `null` avant tout appel réseau
  et aucun champ n'est écrit ; pannes et délais (4 s) → « indisponible », jamais une conclusion.

## 9. Verdict

**GO avec réserves pour la fusion** (sans activation). Les quatre points de la revue Work sont corrigés. Je l'ai
établi par reproduction indépendante, pas sur la foi des tests de la PR : défaut initial reproduit puis disparu, oracle
sur la géométrie d'origine, 24 adresses, scénarios de concurrence. La PR est inerte tant que la variable n'existe pas,
et la fusion avec `main` est propre (3 977 tests verts).

**NO GO pour l'activation** tant que R1 et R2 ne sont pas corrigés (correctifs courts, dans une PR de suite ou dans
celle-ci). R3 et R5 sont à arbitrer par le porteur avant l'activation, R4, R6 et R7 avant la prochaine édition.

## 10. Procédures proposées (aucune réalisée, chacune sur autorisation explicite)

1. **Fusion** : rebaser ou fusionner `main` dans la branche (aucun conflit attendu), relancer `tsc` et la suite,
   puis fusionner par PR. Effet en production : nul (variable absente). Recette : un rapport Logement et un Autour
   n'affichent aucun bloc débroussaillement.
2. **Bucket** (après R1 et R2) : créer à la main un bucket **privé** `debroussaillement` sur le projet **test**
   (`atvknbgahcuovcyqapfx`), puis production (`xkewgsccadjmondzmjxj`) ; vérifier qu'une lecture sans clé est refusée.
3. **Publication contrôlée** : `construire.py --archive … --edition 2026-03-01` (ou `--revision N` si le contenu
   change) ; `publier.mjs envoyer --cible test --source …` ; `etat --cible test` (2 453 tuiles, 32,8 Mo) ;
   `basculer --cible test --edition 2026-03-01`. Même suite en production avec `--confirmer-production`.
4. **Activation Vercel** : `DEBROUSSAILLEMENT_BUCKET=debroussaillement`, en Production seulement, **après** la bascule
   de production, puis redéploiement.
5. **Recette de production** : rejouer les adresses de recette (La Teste Pyla en zone, Gonfaron Foch en limite,
   Nîmes hors zone, Lyon non couvert, Richerenches incertain) dans Autour et Logement ; relever l'egress Storage sur
   48 h ; contrôler les journaux `[debroussaillement] lecture échouée`.
6. **Retour arrière** : données → `basculer --edition <précédente>` (effet sous 10 min par instance ; ne pas purger
   avant 15 min). Fonction → retirer la variable seulement en dernier recours, en sachant que l'actualisation des
   dossiers lus entre-temps sera refusée jusqu'à la remise de la variable.

## 11. Levée des réserves (30/10/2026, après-midi) : corrections poussées dans la PR #111

Décision du porteur : lever dans la PR les réserves techniques et légères (R1, R2, R5, R6, R7, documenter R4) ;
étudier R3 sans reconstruire l'édition ; ni fusion, ni activation. Commit des corrections : `d26a173a`.

### R1 · Performance : **corrigé**

`vraiesLimites` ne parcourt plus que les pas d'examen (≈ 5 m) d'une arête alignée qui croisent la fenêtre de
lecture, plus un pas de marge de chaque côté (`src/lib/debroussaillement.ts`). Ce qui est hors de la fenêtre est à
plus de 60 m du point (ou de la parcelle) : trop loin pour compter, puisque seule une limite à moins de 50 m change
une lecture. C'est le prototype du matin, réécrit sans la remise à zéro de la polyligne (inutile : `garder` ouvre
déjà une nouvelle polyligne quand un morceau ne prolonge pas le précédent).

| Calcul par lecture (`sondes/perf.mts`, 9 972 lectures sur toutes les cellules, deux passes) | `c1afce5e` | Correctif |
|---|---|---|
| Médiane | 2,2 – 2,3 ms | 1,0 – 1,1 ms |
| 99e centile | 197 – 204 ms | 13 – 14 ms |
| Maximum | 907 – 953 ms | 46 – 49 ms |
| 20 000 points réels près des droites de la grille (`sondes/evaluer.mts`), temps total / pire lecture | 439 s / 698 ms | 41 s / 41 ms |

Pour mémoire, avant la correction n° 1 (`4f27d07d`) : 0,8 / 9 / 39 ms. Il reste un surcoût (14 ms au lieu de 9 au
99e centile) : l'examen de l'autre côté de la grille, limité à la fenêtre. Il disparaîtrait avec l'option A de R3.

**Aucune classification ne change** :

| Contre-épreuve | Résultat |
|---|---|
| 14 958 lectures (toutes les cellules, six positions dont les bords et les coins), `c1afce5e` contre correctif (`sondes/egalite.mts`) | **0 différence** (lecture JSON complète identique) |
| 140 sondes synthétiques de frontières (`sondes/frontieres.mts`) | sortie **identique à l'octet** |
| 20 000 points réels à 1 – 120 m des droites de la grille, contre l'oracle Shapely | répartition identique : 17 726 en zone, 1 344 en limite, 906 dehors, 23 écarts R3 (un point sur un objet ambigu est écarté du décompte : 19 976 concordances, et non 19 977 comme écrit au § 3) |
| 3 000 points sur des arêtes partagées | identique : 3 000 « en limite » (R3, inchangé) |
| Tests FUT-149 | tous verts |

### R2 · Téléchargement du manifeste : **corrigé**, sans cache partagé

**Ce qui change.** `basculer` écrit dans le pointeur l'empreinte SHA-256 du manifeste qu'il vient de vérifier :
`courant.json` = `{ format, edition, manifeste }`. Le lecteur (`src/lib/server/debroussaillement-tuiles.ts`) :
- relit le pointeur (≈ 130 octets) à l'origine toutes les 10 min, comme avant ;
- ne télécharge le manifeste que si le pointeur en désigne un autre, et le vérifie contre l'empreinte ;
- charge le manifeste une seule fois quand deux lectures arrivent ensemble sur une instance froide (promesse partagée ; un échec n'est pas gardé) ;
- garde les tuiles indexées par leur empreinte (R4).

**Ce qui ne change pas, et pourquoi.** La mémoire est celle d'une instance. Chaque instance qui démarre, et chacune
des fonctions qui lisent le zonage (le Logement, Autour), relit le pointeur et le manifeste une fois : 286 Ko. Il
n'existe pas de cache partagé simple :
- le CDN de Supabase vérifie les droits objet par objet sur un bucket privé (« two users requesting the same object from a private bucket in the same region get a cache miss », documentation Storage CDN), et la doc ne dit pas si ces lectures comptent en egress « cached » ;
- un cache Vercel partagé (Runtime Cache) ajouterait une dépendance et ses propres règles d'invalidation pour un objet lu une fois par démarrage.

Je ne l'ai pas fait. À reconsidérer si les démarrages d'instance mesurés après activation sont nombreux.

**Mesure** (`sondes/egress.mjs` : le vrai lecteur, contre un Storage simulé qui sert l'édition nationale, horloge
simulée, une instance ; points tirés au hasard en France, graine fixe) :

| Scénario | `c1afce5e` | Correctif |
|---|---|---|
| Instance froide, une lecture | 286 Ko (manifeste 264 Ko) | **286 Ko** (inchangé) |
| Instance chaude, une lecture par minute pendant 24 h | 56,9 Mo, dont manifeste **38,0 Mo** (144 téléchargements) | 19,1 Mo, dont manifeste **0,26 Mo** (1) |
| Même chose, bascule vers une révision à 12 h | 56,8 Mo ; 720 lectures sur chaque édition | 19,3 Mo, manifeste 0,53 Mo (2) ; 720 lectures sur chaque édition |
| Deux lectures simultanées à froid | 571 Ko (manifeste deux fois) | 307 Ko (manifeste une fois) |

L'économie réelle tient à la durée de vie des instances, que je ne connais pas. Une instance chaude économise
≈ 38 Mo par jour, soit ≈ 1,1 Go par mois (c'était le poste qui pesait). Un démarrage coûte toujours 286 Ko : 5 Go
couvrent ≈ 18 000 démarrages par mois, toutes fonctions confondues, avant toute tuile. Les tuiles deviennent le
poste principal : ≈ 13 Ko par lecture quand les adresses sont tirées au hasard dans toute la France (64 tuiles en
mémoire), moins quand elles se concentrent.

**Quota partagé avec la fibre.** Le lecteur de la fibre (`src/lib/server/fibre-adresse-index.ts`, FUT-156, déjà sur
`main`) relit lui aussi son manifeste toutes les 10 min avec contournement du cache. Sa taille n'est pas mesurée
ici. La consommation actuelle du projet n'est pas lue (pas d'accès au tableau de bord Supabase). À vérifier avant
activation.

**Invalidation et bascule.**
- Après une bascule, une instance déjà chaude la voit au plus tard 10 min après (convention inchangée ; tests « bascule vue au plus tard au bout de dix minutes »).
- Pendant ce délai, elle sert l'édition précédente, entière et cohérente, qui reste en ligne (ne pas purger avant 15 min).
- Un manifeste qui n'est pas celui que le pointeur désigne est refusé : la lecture est « indisponible ».

**Format du pointeur.** Le lecteur refuse désormais un pointeur sans empreinte : la lecture est « indisponible ».
Aucun pointeur n'existe (bucket non créé), donc il n'y a rien à migrer. Le format des tuiles et du manifeste
(`debroussaillement-1`) ne change pas, et la convention de lecture (`fut149-1`) non plus.

### R4 · Mémoire des tuiles : **corrigé**, et précautions documentées

Au-delà de la documentation demandée, la faille est fermée côté lecteur, car R2 la rendait plus durable. Avec un
manifeste gardé par identifiant d'édition, une réutilisation de l'identifiant aurait été servie pendant toute la
vie de l'instance, et non plus seulement 10 min. Désormais :
- le manifeste est gardé par son empreinte, que désigne le pointeur ;
- chaque tuile est gardée par l'empreinte attendue par le manifeste.

Un contenu nouveau sous un ancien nom est donc relu, jamais mélangé (test du lecteur, et test de bout en bout avec
le vrai publieur : purge à la main, republication sous le même nom, instance chaude 11 min plus tard, lecture
identique à celle d'une instance neuve). Les deux tests échouent sur `c1afce5e`.

Précaution qui demeure, écrite dans l'en-tête de `publier.mjs` : le CDN peut garder l'ancienne tuile sous le même
chemin jusqu'à un jour (`max-age=86400`). Sa lecture échoue alors sur l'empreinte, et l'adresse est dite
« indisponible » jusqu'à l'expiration. Un contenu nouveau prend donc toujours une révision neuve
(`construire.py --revision N`), même après une purge.

### R5 · Précision juridique : **corrigé**

Textes relus : code forestier, édition consolidée du 13/10/2026 (codes.droit.org, d'après Légifrance),
L134-6 et L134-8 dans leur rédaction issue de la loi n° 2023-580, art. 21.
- **L134-6, 4°** : « Dans les zones urbaines des communes non dotées d'un plan local d'urbanisme ou d'un document d'urbanisme en tenant lieu ; le représentant de l'Etat dans le département peut […] porter l'obligation énoncée au 1° au-delà de 50 mètres, sans toutefois excéder 200 mètres ».
- **L134-8, 2°** : les travaux sont à la charge « Dans les cas mentionnés aux 3° à 6° de cet article, du propriétaire du terrain ».

| Texte | Avant | Après |
|---|---|---|
| `REGLE` (En savoir plus) | « Sur les terrains situés dans une zone urbaine d'un plan local d'urbanisme, sur la totalité du terrain… » | « Sur les terrains situés en zone urbaine, que la commune ait un plan local d'urbanisme ou non, sur la totalité du terrain, bâti ou non, quelle que soit cette distance : elle incombe au propriétaire du terrain. » |
| `RESPONSABLE` (constat « en zone ») | « …celui du terrain s'il est en zone urbaine d'un plan local d'urbanisme. » | « …celui du terrain s'il est en zone urbaine (avec ou sans plan local d'urbanisme). » |
| `VERIFIER_A_CHEVAL` | « …si le terrain est en zone urbaine d'un plan local d'urbanisme… » | « …si le terrain est en zone urbaine (avec ou sans plan local d'urbanisme)… » |
| Commentaire du code | le 4° présenté comme une seule faculté du préfet | le 4° pour les deux obligations : terrain entier en zone urbaine sans PLU, et extension possible des abords par le préfet jusqu'à 200 m |

Ce qui est conservé :
- la distinction des deux responsables : le propriétaire des constructions pour leurs abords (L134-8, 1°), celui du terrain en zone urbaine (L134-8, 2°) ;
- le caractère informatif du zonage (« selon le zonage informatif publié par l'État », « seuls l'arrêté du préfet et le code forestier font foi »).

L'extension par le préfet (4°, seconde phrase) n'est pas écrite à l'écran : « L'arrêté du préfet en précise les
modalités » la couvre, et un nombre de mètres ne s'affiche jamais pour un propriétaire. Test dédié : aucune mention
de « zone urbaine » n'est réservée aux communes dotées d'un PLU, dans tous les états, y compris « à cheval ».

### R6, R7, R8 : **corrigés**

| | Correction | Preuve |
|---|---|---|
| R6 | « Le point de l'adresse tombe sur une limite de parcelle : la lecture porte sur ce point. » (un ou deux candidats) | test : un seul candidat et deux candidats, jamais « deux parcelles » |
| R7 | `comparerEditions` : date, puis révision (sans révision = 1) ; `purger` refuse `--garder` < 1 (`slice(-0)` gardait tout) | test de bout en bout : éditions `2026-03-01`, `.2`, `.10`, retour arrière sur `.2`, `purger 1` → `.10` et `.2` gardées, `2026-03-01` effacée ; avec l'ancien tri alphabétique, `.10` (la plus récente) était effacée (le test échoue) |
| R8 | `construire.py` efface l'extraction (1,8 Go) en fin de construction, même en cas d'échec ; `exclusions-arretes.json` cite `02-contre-epreuves.md` | le motif n'entre pas dans le manifeste : aucune donnée construite ne change |

### Validation

| | Résultat |
|---|---|
| Suite complète de la branche (`--test-concurrency=1`) | **3 924** ✔, 0 échec (3 914 + 10 nouveaux tests) |
| TypeScript (`tsc --noEmit`) | 0 erreur (branche et fusion) |
| Fusion simulée avec `main` actuel `82cbc171` (#117), `--no-commit` | **sans conflit** (fusion automatique de `route.ts` et `logement-report-types.ts`) ; branchement OLD intact |
| Suite sur la fusion | **4 006** ✔ = `main` seul 3 908 + 98 FUT-149 (86 + 12), 0 échec |
| Nouveaux tests rejoués sur `c1afce5e` | échouent tous (R2 ×2, R4 ×2, pointeur sans empreinte, R5, R7) ; le test de bascule passe sur les deux (comportement déjà correct) |
| Sans `DEBROUSSAILLEMENT_BUCKET` | test : 0 appel réseau (fetch espion), `undefined`, rien d'écrit dans le rapport ; un rapport existant sans le champ reste actualisable (`nouvelle_version`) ; la route et Autour ne posent le champ que s'il existe |
| Rendu | banc `/dev/fut149`, 16 cas × 2 largeurs : aucun défilement horizontal ; seules les 3 captures dont le texte change ont changé ; `recette-textes.json` régénéré |

## 12. R3 · Les jonctions entre zones : trois options, à arbitrer

**Le défaut.** La lib mesure la distance au bord de **chaque** zone, pas au bord de leur réunion.
- Les zones IGN partagent 3 075 km d'arêtes entre objets distincts : 69 % aux limites de départements, d'après les 3 000 points échantillonnés, 31 % dans un même département.
- Un point du zonage à moins de 50 m d'une de ces arêtes est lu « en limite », et l'écran dit « selon l'endroit exact, le logement peut y être ou non ». C'est faux : il y est, des deux côtés.
- Ordre de grandeur : une bande d'environ 300 km², soit 0,24 % du zonage.
- La lecture **au point** seulement est touchée (Autour, et le Logement sans parcelle). À la parcelle, les aires s'additionnent et la lecture est juste.
- Jamais dans le sens dangereux : un point hors du zonage est toujours plus près du vrai bord que d'une arête intérieure, et ne peut donc pas être lu « en zone » à tort.

**Mesures utiles.**
- Périmètre total des anneaux des tuiles : 155 078 km, 9,47 millions de sommets.
- Arêtes posées sur la grille (coupes de tuiles, à 99,99 %) : 53 602 km.
- Vraies limites estimées : ≈ 95 000 km (155 078 − 53 602 − 2 × 3 075).
- 24 adresses réelles : aucune n'est touchée (48 / 48 concordances).
- 20 000 points près de la grille : 23 touchés (0,12 %).
- 3 000 points tirés dans la bande : tous touchés.
- Nombre d'adresses BAN dans la bande : non mesuré.

| | A. Corriger à la construction | B. Lecture distincte des jonctions, à l'exécution | C. Reporter, activation désactivée |
|---|---|---|---|
| Principe | `construire.py` calcule le bord de la **réunion** des zones sur la géométrie d'origine (Shapely, comme l'oracle) et publie dans chaque tuile quelles arêtes sont de vraies limites. La lib ne mesure plus que celles-là. Au passage, la grille disparaît du problème : plus d'examen de l'autre côté à l'exécution (le surcoût restant de R1 disparaît ; coût attendu proche de celui d'avant la correction n° 1, 9 ms au 99e centile, à mesurer), et `Couvert` et `vraiesLimites` (≈ 80 lignes) sont supprimés | La lib reste au format actuel. Près du point, elle examine l'autre côté de chaque arête à moins de 50 m (même mécanique que pour la grille, généralisée) : si une autre zone chargée la couvre, c'est une jonction, pas une limite. Le point est alors « en zone », avec mention éventuelle de la jonction ; ou bien une cause distincte (`jonction`) avec sa propre phrase | Rien ne change ; OLD n'est pas activé au lancement |
| Justesse | **Exacte** : même calcul que l'oracle (réunion de la géométrie d'origine), fait une fois, vérifiable par la contre-épreuve des 23 000 points | **Approchée** : échantillonnage tous les ~5 m, à 1 cm de l'arête. Les arêtes partagées de la base ne coïncident pas toujours au centimètre (sommets différents, liserés) : une jonction mal ajustée resterait « en limite » (prudent), un liseré de quelques mètres pourrait passer pour une jonction (« en zone » à quelques mètres près, jamais « hors zone ») | Inchangée : 0,24 % du zonage sur-prévenu |
| Format, migration | Nouveau format `debroussaillement-2` (champ de limites par morceau ou liste d'arêtes non-limites), nouvelle construction de l'édition, fixtures (14 tuiles) et tuiles synthétiques des tests à refaire. **Aucune migration de données** : rien n'est publié, aucun rapport n'existe. Taille : liste des exceptions par anneau ≈ quelques % ; polylignes de limites séparées ≈ +60 % (≈ 95 000 km de 155 000) ; à mesurer à la construction | Aucun changement de format, aucune reconstruction | Aucun |
| Coût de travail | Le plus élevé : construction (réunion nationale de 4 237 zones, puis découpe par cellule), lib simplifiée, tests de géométrie revus, contre-épreuve rejouée. Un à deux jours | Moyen : nouvelle mécanique dans la partie la plus délicate de la lib, et un coût CPU supplémentaire près des jonctions (à mesurer) | Nul maintenant ; le même travail (A ou B) plus tard, et après activation une nouvelle édition à publier |
| Effet lecteur | Les lectures dans la bande passent de « en limite » à « en zone » (texte vrai) ; rien d'autre ne change | Idem si l'état devient « en zone » ; si une cause `jonction` est ajoutée, une phrase de plus à écrire et à faire relire | OLD absent du lancement |
| Risque | Faible. Le calcul est celui de l'oracle déjà rejoué ; la difficulté est le volume (réunion nationale), pas la méthode | La lib se complique encore, et sa justesse dépend de la qualité des arêtes partagées de la base | Aucun technique ; la fonctionnalité attend |

**Recommandation : A, avant l'activation.** C'est le seul correctif exact. C'est aussi le moment où il coûte le
moins : rien n'est publié, aucun rapport ne porte de lecture OLD. Après activation, il faudrait une nouvelle édition
et la coexistence de deux conventions dans les dossiers. Il simplifie la lib au lieu de la compliquer, et il solde
le reste de R1.
- B ne vaut que si une reconstruction est exclue ; il reste approché.
- C est raisonnable si OLD n'est pas attendu au lancement ; il ne coûte rien de plus maintenant.
- Je n'ai rien appliqué de A ni de B (changement de format soumis à arbitrage).

## 13. Verdict après corrections

- **GO pour la fusion** (sans activation), sous réserve de la contre-revue ciblée de la nouvelle tête.
- **Activation** :
  - R1 et R2 ne la bloquent plus ;
  - restent l'arbitrage de R3, la vérification du quota Storage (consommation de la fibre comprise) dans le tableau de bord Supabase, puis les procédures du § 10 ;
  - et, pour R3 = A, une nouvelle construction de l'édition.

Le § 10 reste valable. Seule la commande `basculer` écrit désormais l'empreinte du manifeste dans le pointeur :
aucune étape ne s'ajoute.

## 14. R3, option A (arbitrage du porteur, 30/10/2026 au soir) : format `debroussaillement-2`

> Décision du porteur : option A, calculer les vraies limites de la réunion des zones à la construction ; aucune
> approximation à l'exécution ; aucune tolérance arbitraire pour fusionner des zones séparées. Ni fusion, ni
> déploiement, ni bucket, ni publication, ni variable Vercel. FUT-149 reste In Progress.

### Ce qui change

| | Format 1 (`87c1cca2`) | Format 2 |
|---|---|---|
| Tuile | les morceaux de zone | les morceaux **et les vraies limites** du zonage dans la cellule (`limites`, lignes codées comme les anneaux) |
| Limites | déduites par la lib à l'exécution : bord de chaque morceau, moins les coupes de la grille reconnues en regardant de l'autre côté (`vraiesLimites`, `Couvert`, `PAS_EXAMEN`) | calculées par `construire.py` (`limites_cellule`) : bord de la **réunion** des zones d'origine (Lambert-93), projeté, rangé par cellule. La lib ne devine plus rien |
| Point dans le zonage | distance au bord du morceau qui le contient (R3 : une frontière entre zones comptait) | distance aux seules vraies limites |
| Point hors zonage | distance aux vraies limites des morceaux | distance à la zone la plus proche (le point est hors de chaque morceau, donc de leur réunion) |
| Parcelle | inchangé (aires des morceaux) ; distance parcelle-zone sans recouvrement | inchangé ; distance aux morceaux eux-mêmes |
| Cellule « pleine » | entièrement couverte | entièrement couverte **et** qu'aucune limite ne touche (sinon un fichier, pour ses limites) |
| Lecteur | `debroussaillement-1` | refuse tout autre format que `debroussaillement-2` (tuile, manifeste, pointeur) : « indisponible », jamais une lecture |
| Convention de lecture | `fut149-1` | `fut149-2` (aucune lecture `fut149-1` n'a été publiée) |

Supprimé de la lib : `vraiesLimites`, `Couvert`, `PAS_EXAMEN`, `dansMorceau` (≈ 90 lignes). Le reste du protocole est
inchangé : édition immuable, empreintes du manifeste (au pointeur) et des tuiles, mémoire par empreinte, bascule et
retour arrière, contrôle « le point est dans la parcelle ».

### Trois défauts trouvés en chemin, corrigés

1. **Une vraie limite posée exactement sur le bord d'une cellule disparaissait** (première construction). Après
   l'aller-retour Lambert-93 → WGS84, elle tombait à 1e-12 degré hors du carré de la cellule. La sonde
   `frontieres2.mts`, qui fait construire les mondes synthétiques par le vrai `construire.py`, l'a montré : 10 lectures
   « en zone » à 1-49 m d'une vraie limite alignée. Correctif : les limites sont rangées dans le carré élargi de
   10 cm (`MARGE_RANGEMENT`). Ce n'est pas une tolérance géométrique : la marge choisit seulement la tuile qui range
   une limite, et une vraie limite rangée deux fois reste une vraie limite.
2. **La réunion en virgule flottante n'est pas toujours fusionnée.** GEOS rend parfois un trou que recouvre une
   autre partie du résultat. Exemple : dans la Drôme (4,7058 ; 44,5720), un « vide » fantôme de 5 700 m² apparaît à
   13 m d'un point avec une découpe de 1 km, et disparaît avec 10 km ; le point est couvert par la zone de l'Ardèche.
   Correctif : réunion à **précision de calcul fixe de 1 µm** (`GRILLE_CALCUL_M`), dans le constructeur et dans
   l'oracle. La réunion est alors toujours fusionnée. La grille n'agit qu'à l'échelle du micromètre : elle peut faire
   apparaître ou disparaître un liseré de cette largeur (195 vides de moins de 0,5 µm à précision fixe, aucun en
   virgule flottante), jamais un vide plus large. 154 des 1 277 « jonctions non dissoutes » de l'oracle en virgule
   flottante étaient ce défaut de calcul.
3. Le harnais synthétique décrivait des jonctions en T en degrés. Projetées, elles laissaient un liseré qui n'existait
   pas dans le monde voulu : les sommets en T sont insérés avant projection (`construire_monde.py`). C'était un défaut
   de la sonde, pas du constructeur.

### Le résidu de R3 : les raccords imparfaits de la base, que seule une fermeture effacerait

La base IGN est numérisée département par département. À beaucoup de frontières, deux zones voisines **ne se
touchent pas exactement** : elles laissent un vide de 1 µm à quelques millimètres. La réunion exacte le garde, donc
le format 2 strict aussi, comme une limite (lecture « en limite », prudente, jamais dangereuse).

| Largeur moyenne des vides de la réunion nationale (précision fixe ; trous de la réunion) | Nombre | Périmètre | Touchant plusieurs zones |
|---|---|---|---|
| < 1 mm | 7 091 | 1 739 km | 3 888 |
| 1 mm – 1 cm | 451 | 156 km | 143 |
| 1 – 10 cm | 667 | 77 km | 161 |
| 10 cm – 1 m | 795 | 85 km | 99 |
| 1 – 10 m | 3 740 | 658 km | 241 |
| ≥ 10 m (enclaves, clairières, villages…) | 19 331 | 47 624 km | 547 |

Les vides qui débouchent sur l'extérieur (encoches entre deux zones) ne sont pas des trous et n'y figurent pas.

Dans l'édition construite : 8 155 anneaux de limite fermés de moins de 1 cm de large, soit 1 769 km (sur 96 754 km
de limites, rangées une ou deux fois). Aucune largeur ne sépare naturellement le bruit de raccord des vrais
interstices : la distribution est continue jusqu'au mètre. La source n'a pas non plus de résolution propre (3 720 zones
sur 4 237 ont des coordonnées plus fines que le millimètre).

**Fermeture mesurée, non appliquée** (`--fermeture-m`, 0 par défaut, `sondes/fermeture.py`) : dilatation puis érosion
à angles vifs, qui ne referme que les vides plus étroits que f. Sur les 1 314 points de jonction encore « en limite » :

| f | jonctions dissoutes | effets sur des points hors zone (sur 600 interstices, 600 trous) |
|---|---|---|
| 1 mm | 1 026 (78 %) | 3 points d'interstices de moins de 1 mm passent de « hors zone » à « en zone » |
| 1 cm | 1 119 (85 %) | + 1 point d'un trou de 1 à 10 mm |
| 10 cm | 1 153 (88 %) | + 2 points de trous |
| 1 m | 1 185 (90 %) | 6 points de trous, 3 d'interstices |

Toute fermeture transforme quelques points strictement hors zone (dans un vide plus étroit qu'elle) en points « en
zone ». La consigne l'interdit ; c'est donc au porteur d'en décider (§ 15).

### Contre-épreuves indépendantes

Oracle : géométries IGN **d'origine** (GeoPackage, Lambert-93), Shapely, réunion à précision fixe de 1 µm des zones
découpées à 1 km autour du point ; aucune tuile lue (`sondes/oracle_r3.py`, `verite_points.py`). Archive IGN
retéléchargée ce matin, SHA-256 `b224f900…9b42e`, identique à celle de la PR.

| Contre-épreuve | `87c1cca2` (format 1) | Format 2 |
|---|---|---|
| 3 000 points de jonction de ce matin (bande R3) | 21 / 3 000 justes | **3 000 / 3 000** |
| 3 000 nouveaux points de jonction (5-40 m d'une arête partagée) | 1 328 justes ; 1 672 « en limite » à tort | **2 986 justes** ; 14 sur des liserés submicrométriques (ci-dessous) |
| 20 000 points près des droites de la grille | 19 972 / 19 999 (27 R3) | **19 999 / 19 999** |
| 4 000 points de part et d'autre du vrai bord (1-120 m, hors zone compris) | 3 998 / 4 000 | **4 000 / 4 000** |
| 600 points dans ou près des trous | 598 ; **1 dangereux** (un point hors zone, dans un trou, lu « en zone ») | 598 ; 2 à moins de 1 mm du bord (ci-dessous) ; **0 dangereux** |
| 600 points dans des interstices de moins de 20 m entre deux zones | 539 | 588 ; 12 à moins de 1 cm du bord |
| 600 points dans ou près des parties secondaires des multipolygones | 594 | 597 ; 3 à moins de 1 cm du bord |
| **Total des 8 800 points R3** | 1 743 désaccords, 1 dangereux | **31 désaccords, 0 dangereux** |
| 14 958 lectures (toutes cellules, bords et coins) : lectures qui changent | — | 13, toutes « en limite » → « en zone », **toutes justes** selon l'oracle (vrai bord à 68 m et plus) |
| 155 cas synthétiques de frontières, construits par le **vrai** `construire.py` (`frontieres2.mts`) | — | **155 / 155** |
| 24 adresses réelles, au point et au Logement, contre l'oracle des géométries d'origine | 48 / 48 | **48 / 48** (états et parts identiques) |
| 17 cas de parcelles (`parcelles.mts`) | 17 / 17 | **17 / 17**, sortie identique |

**Les 31 désaccords restants, un par un** (`sondes/evaluer_r3.mts`, `analyser_ecarts.py`) :
- **17 points à moins de 1 cm du bord**, la vérité les dit dehors, la lib dedans ; les deux disent « en limite ».
  C'est la résolution de publication (1e-7 degré, ≈ 1 cm), à laquelle les morceaux sont arrondis. Seule la
  formulation change : « dans la zone, à moins de 50 m de sa limite » au lieu de « à environ 5 m ».
  - Trous (34) : deux vides de 1,7 mm de large, points à 1 mm et 0 mm.
  - Interstices : 12 points à moins de 7 mm du bord, en 31, 09, 11, 06, 28, 84, 43.
  - Multipolygones : 3 points à moins de 3 cm, en 49, 2A, 83.
- **13 points du zonage lus « en zone » alors que la vérité voit, à 7-49 m, un liseré submicrométrique**
  (largeur moyenne < 0,001 mm), en 30, 07, 26, 06, 34, 48 et 65. Leur existence dépend de l'arithmétique : décaler
  le point de 8 cm, donc le carré de découpe, le fait apparaître ou disparaître (cas de 4,64835 ; 44,36103 : 20 m à
  pleine précision, 67 m à 6 décimales). L'oracle et le constructeur ne les voient pas aux mêmes endroits. Le point
  est bien dans le zonage, et sa vraie limite au sens utile est au-delà de 50 m.
- **1 point dans la bande 49-51 m.**

**Tests et mutations.**
- Tests FUT-149 : 94 (synthétiques, avec des tuiles construites à partir d'un monde de rectangles dont les limites
  sont calculées indépendamment de la lib). Ils couvrent :
  - une jonction entre départements hors de la grille, à 0, 1, 10 et 40 m ;
  - un vrai interstice de 8 m ;
  - un liseré d'un cran de grille (8 mm), qui reste une limite ;
  - un trou formé par quatre zones ;
  - une cellule bordée d'une vraie limite qui a un fichier ;
  - une vraie cellule pleine ;
  - le refus du format 1 (tuile, manifeste, pointeur) ;
  - « jamais en zone » pour un point hors zone près d'une vraie limite.
- Publieur : 12 tests.
- 12 mutations des garde-fous, toutes détectées :
  - limites ignorées, non lues, ou fenêtre vide ;
  - distance hors zone ignorée ;
  - tuile sans limites acceptée ;
  - format non vérifié ;
  - R3 réintroduit (bord du morceau contenant) ;
  - ambigu ignoré ;
  - cellule pleine ignorée ;
  - tuile manquante lue comme absence ;
  - distance parcelle-zone ignorée ;
  - point dans la parcelle non contrôlé.

### Performances et données

Mêmes machine et séance, deux passes par version. La machine était un peu plus lente qu'au § 11 : seules les
comparaisons dans un même tableau valent.

| Calcul par lecture (`sondes/perf.mts`, 9 972 lectures, toutes cellules) | `c1afce5e` | `87c1cca2` | Format 2 |
|---|---|---|---|
| Médiane | 2,5 – 2,8 ms | 1,2 – 1,3 ms | 1,1 – 1,2 ms |
| 99e centile | 221 – 231 ms | 17,0 – 17,4 ms | **14,5 – 15,2 ms** |
| Maximum | 1 202 – 1 224 ms | 51 – 52 ms | **46 – 48 ms** |
| Décodage d'une tuile (gunzip + JSON), médiane / 99e centile / max | 0,17 / 1,9 / 3,1 ms | idem | 0,27 / 3,8 / 5,7 ms |

Le retrait de l'examen de la grille fait gagner ≈ 13 % au 99e centile. C'est moins qu'escompté au § 12 (« proche de
9 ms ») : le coût dominant n'est plus la grille, mais la projection et le parcours des morceaux entiers (et, pour un
point hors zone, la distance à chacun). Le décodage, plus lourd, reste de l'ordre de la milliseconde.

| Données | Format 1 | Format 2 |
|---|---|---|
| Tuiles (total) | 32,8 Mo | **54,9 Mo (+67 %)** |
| Tuile médiane / 99e centile / max | 8,8 / 85,9 / 128 Ko | 10,2 / 164 / 251 Ko |
| Fichiers / cellules pleines | 2 453 / 40 | 2 453 / 40 |
| Manifeste | 270,3 Ko | 270,6 Ko |
| Limites | — | 50 398 lignes, 9,27 millions de sommets, 96 754 km (rangées une ou deux fois) |
| Construction | 3 min | 5 min (réunion par cellule à précision fixe) |
| Déterminisme | — | deux constructions **identiques à l'octet** |
| Stockage, deux éditions gardées | 66 Mo | 110 Mo (quota Free 1 Go, partagé avec la fibre) |

| Réseau (`sondes/egress.mjs`, vrai lecteur, une instance) | `c1afce5e` | `87c1cca2` | Format 2 |
|---|---|---|---|
| Instance froide, une lecture : appels / octets | 3 / 286 Ko | 3 / 286 Ko | 3 / **301 Ko** |
| Instance chaude, 1 lecture/min pendant 24 h : appels | 1 676 | 1 533 | 1 533 |
| idem : manifeste / tuiles / total | 38,0 / 18,8 / 56,9 Mo | 0,26 / 18,8 / 19,1 Mo | 0,26 / **31,7** / 32,0 Mo |
| Deux lectures simultanées à froid | 571 Ko | 307 Ko | 342 Ko |

Le nombre de lectures réseau ne change pas. Ce qui change, c'est le poids des tuiles : ≈ 22 Ko par lecture qui ne
trouve pas sa tuile en mémoire (adresses tirées au hasard en France), contre ≈ 13 Ko. À titre d'ordre de grandeur,
sans compter les démarrages d'instance (≈ 300 Ko chacun), 5 Go couvrent ≈ 240 000 de ces lectures par mois, contre
≈ 400 000 au format 1. Un dossier ouvert lit le zonage deux fois (Logement à la collecte, Autour au rendu), dans deux
fonctions distinctes. Économie possible, non faite : ranger les limites comme des renvois aux anneaux qu'elles
suivent (elles en reprennent presque tous les sommets), plutôt qu'en lignes recopiées.

La consommation réelle de Supabase (egress et stockage du projet, fibre comprise) **n'a pas été vérifiée** : pas
d'accès aux mesures de facturation. C'est un prérequis distinct avant l'activation.

## 15. Verdict après l'option A, et réserves

**Fusion : GO technique** (sans activation), sous réserve de la contre-revue indépendante ciblée sur R3 et sur les
effets du nouveau format.
- La classification est exacte au sens de la réunion des géométries d'origine, à la résolution de publication près
  (1 cm) : 0 lecture dangereuse sur 31 800 points contre l'oracle, 0 écart sur 20 000 points de grille, 3 000 / 3 000
  sur la bande R3 de ce matin.
- Le moteur est plus simple (≈ 90 lignes de calcul de grille retirées) et un peu plus rapide.
- Les défauts déjà corrigés ne reviennent pas : frontières alignées (155 / 155 par le vrai constructeur), parcelles
  (17 / 17), adresses (48 / 48), publication et mémoire (tests et mutations).
- La PR reste inerte sans `DEBROUSSAILLEMENT_BUCKET` (test : aucun appel réseau, aucun champ écrit).

**R3 n'est que partiellement levé : un arbitrage reste à rendre.** Avec la réunion exacte, 56 % des points de jonction
retrouvent « en zone ». Les autres longent un vrai vide de raccord entre deux zones, de 1 µm à quelques millimètres
(≈ 1 770 km de limites en anneaux fermés de moins de 1 cm, davantage en comptant les encoches ouvertes). Ils restent
« en limite » : prudent, jamais faux dans le sens dangereux, mais l'écran dit « selon l'endroit exact, le logement
peut y être ou non » là où il y est. Deux voies :
- **(a) Garder la règle stricte** : rien à faire ; la bande de jonction est réduite de moitié environ.
- **(b) Une fermeture `--fermeture-m`** : 1 mm efface 78 % du résidu, 1 cm 85 %. En contrepartie, quelques points
  situés dans un vide plus étroit que le seuil, donc strictement hors zone, sont lus « en zone » : 3 sur 600
  interstices tirés à 1 mm, plus 1 trou à 1 cm. C'est contraire à la consigne « ne jamais transformer un point hors
  zone en point du zonage » ; je ne l'ai pas activée.

L'édition est à reconstruire avec l'option retenue avant publication. La construction dit la valeur choisie
(`stats.limites.fermetureM`).

**Réserves avant publication et activation**
1. Arbitrage de la fermeture (ci-dessus) ; reconstruction de l'édition en conséquence ; la contre-revue ciblée.
2. Quota Supabase réel, fibre comprise (tableau de bord) : non vérifié. Les tuiles pèsent 67 % de plus.
3. Les 13 liserés submicrométriques et les 17 points à moins de 1 cm du bord (§ 14) sont des limites de la
   représentation, pas des défauts de lecture ; ils restent documentés.
4. Inchangé depuis le § 13 : procédures du § 10 (bucket, publication, bascule, variable en dernier, retour arrière
   par `basculer`).
