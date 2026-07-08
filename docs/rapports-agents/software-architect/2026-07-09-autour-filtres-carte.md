# Software Architect — Face « Autour » : filtres + carte interactive (cadrage du spike)

Date : 2026-07-09 · Lentille : dette en temps de reprise, solo/micro-entreprise, ADR-0004.
Mode : read-only, je propose. Rapport auto-suffisant.

## Périmètre

- **Affichage** : `src/components/report/logement/AutourSection.tsx` (`Face3Block`), composant
  d'affichage PUR nourri par un `Face3Snapshot`. Monté par `LogementModule.tsx` (`"use client"`).
- **Données figées** : `Face3Snapshot` (`src/lib/logement-autour-types.ts`), persistées dans la
  table `logement` (`snapshot` JSON, `src/lib/logement-store.ts`, `SOURCES_VERSION` =
  `face3-2026-07-08d`), rehydratées (Scope A).
- **Producteurs** : `src/app/api/logement-autour/route.ts` (`force-dynamic`) → assemble via
  `assembleSnapshot` (`logement-autour.ts`) à partir de :
  - **BPE** : shards locaux `data/bpe-points/{cell}.json` (lat/lon PAR équipement), lus par
    `loadBpePointsAround`, réduits à `nearestByCategory` (le plus proche par famille).
  - **OSM** : `osm_tile_cache.geometries` (full `OsmGeom[]` avec `pts: LngLat[]`), récupéré via
    Overpass `out geom` À LA GÉNÉRATION, mis en cache par cellule (service-role), réduit par
    `computeOsmProximity` au plus proche espace vert.
- **Stack carto** : `package.json` → **AUCUNE lib carto** (ni leaflet, ni maplibre, ni mapbox).
- **Next** : 16.2.4. Doc installée vérifiée (`node_modules/next/dist/docs/01-app/02-guides/
  lazy-loading.md`) : `dynamic(..., { ssr:false })` **interdit en Server Component**, doit vivre
  dans un Client Component. LogementModule est déjà `"use client"` → chemin ouvert, mais l'import
  doit rester dynamique pour sortir la carte du bundle initial et du SSR.

## Ce qui est sain (à préserver)

1. **La doctrine « l'affichage ne touche JAMAIS Overpass »** : tout est figé dans le snapshot,
   le rendu est offline. C'est exactement la fondation dont une carte a besoin. Une carte
   STATIQUE (points gelés) prolonge cette doctrine ; une carte LIVE la casserait.
2. **La matière brute existe déjà et est déjà payée** : les coordonnées des équipements (shards
   BPE) et les géométries OSM complètes (`osm_tile_cache.geometries`, `pts[]`) sont récupérées
   et cachées. Une carte ne demande **aucune nouvelle acquisition de données**, aucun nouvel
   appel réseau. C'est le point le plus favorable du dossier.
3. **`Face3Block` est un composant d'affichage pur** : ajouter une carte à côté de la liste ne
   touche ni la route, ni le store, ni les libs — sauf le point dur ci-dessous (schéma snapshot).
4. **Le versioning par `SOURCES_VERSION`** rend un changement de schéma snapshot propre : un bump
   invalide et recalcule tous les snapshots. Recalcul peu coûteux (BPE local, OSM déjà caché).

## Dette en temps de reprise (hiérarchisée)

**#1 — Le snapshot ne porte PAS les points, seulement le plus proche (SUBI, bloquant carte).**
`nearestByCategory` et `computeOsmProximity` **jettent** tous les points sauf le plus proche.
Le snapshot figé stocke une distance + un label par famille, et une distance d'espace vert.
Une carte a besoin des COORDONNÉES de N points. Donc **la donnée figée d'aujourd'hui n'est pas
map-ready**. Coût à la reprise si on l'ignore : croire que « les données sont là » et se cogner
au fait qu'il faut ré-élargir le schéma. La bonne nouvelle : la source brute existe (voir sain
#2), il ne s'agit que de **persister** dans le snapshot ce qu'on jette déjà. C'est un changement
de schéma `Face3Snapshot` + bump `SOURCES_VERSION`. Dette raisonnable et bien cadrée.

**#2 — Le basemap est la vraie dépendance, pas les marqueurs (le nœud du dossier).**
Poser des marqueurs à partir de coords gelées = trivial (SVG/canvas). Mais « carte interactive »
sous-entend un fond de carte à tuiles pannable/zoomable. Ça introduit une **dépendance runtime
récurrente** absente aujourd'hui : soit tuiles raster OSM (politique d'usage OSM.org interdit la
prod lourde), soit un fournisseur (MapTiler/Stadia/Protomaps) = clé API + quota + coût récurrent,
soit self-host = infra. **C'est frontalement la contrainte de coût d'ADR-0004.** Coût à la
reprise dans 6 mois : un futur-toi qui doit se rappeler quel fournisseur, quelle clé, quel quota,
quelle facture — une surface d'exploitation nouvelle pour un solo. C'est ici que se concentre la
dette, pas dans le code.

**#3 — Poids du snapshot rehydraté (SUBI si non borné).** Le rapport est un artefact SAUVEGARDÉ
et rehydraté. Grossir le snapshot avec tous les points fait grossir CHAQUE ligne `logement`.
En centre urbain dense (Paris), on peut avoir des centaines d'équipements BPE + de nombreux
polygones verts. Sans plafond (nombre de points, rayon), le JSON enfle. Coût : lignes lourdes,
rehydratation plus lente, DB qui gonfle silencieusement.

**#4 — Une lib carto WebGL est une dette de maintenance solo (VOLONTAIRE à éviter).** maplibre-gl
(~200 KB gzip + WebGL) est puissant mais lourd à porter seul dans le temps (versions, styles,
WebGL sur mobile bas de gamme). leaflet (~40 KB, DOM/raster) est plus simple mais reste une lib
de plus. Un plot SVG maison (zéro lib) est le moins endettant si l'interactivité slippy n'est pas
nécessaire.

## Ce qui peut disparaître / ne pas naître

- **La carte LIVE** : à écarter d'emblée. Elle contredit la doctrine snapshot, ajoute Overpass/
  tuiles au runtime, et n'apporte rien qu'une carte statique gelée ne donne (la donnée est figée
  par nature).
- **maplibre-gl / WebGL** : probablement non gagné. À ne convoquer que si l'interactivité
  pan/zoom est prouvée nécessaire par la mesure.
- **Un vrai fond de carte à tuiles** : peut disparaître si un plot statique relatif à l'adresse
  (marqueurs + anneaux de distance, sans tuiles) délivre déjà la valeur.

## Performance

- Pas de N+1 ni de travail refait côté serveur (BPE local, OSM caché). Rien à optimiser là.
- Risques réels et mesurables si carte interactive : (a) **bundle** (maplibre ~200 KB gzip sur
  une page rapport déjà chargée) ; (b) **WebGL sur mobile bas de gamme** (jank pan/zoom) ;
  (c) **payload snapshot** (#3). Les trois sont des problèmes structurels, pas spéculatifs — mais
  ils n'existent QUE si on prend le chemin interactif+tuiles. Le chemin statique-SVG les évite.

## Conformité à la stack

- **ADR-0004 (contrainte de coût)** : un fournisseur de tuiles payant/quota = écart direct.
  Chemin conforme = zéro dépendance runtime récurrente (plot statique, ou fond auto-porté type
  Protomaps `.pmtiles` servi en statique depuis le CDN, à valider en spike).
- **ADR-0002 (le moat = la transformation, pas la donnée)** + doctrine Face 3 « liste + distances,
  jamais un agrégat communal, jamais un score » : une carte OSM brute risque d'être une **donnée
  inerte** (re-affichage générique d'OSM) et une grande surface visuelle. Ce jugement de VALEUR
  appartient au Product/Design/Editorial, je le SIGNALE seulement comme risque doctrinal : la
  carte doit rester au service de « ce que j'ai à ma porte », pas devenir un fond de carte
  générique qu'on trouve partout.
- **Next 16.2.4** : conforme si l'import carto est `dynamic(ssr:false)` DANS le client component
  (vérifié dans la doc installée). Aucun autre écart.

## Ce que cette architecture rend FACILE / DIFFICILE à changer

**FACILE :**
- Ajouter des marqueurs à partir de points gelés (composant d'affichage pur, isolé).
- Ajouter des FILTRES client (montrer/masquer familles ou couches) : état client trivial, zéro
  aller-retour serveur, aucune interaction avec la génération. La complexité des filtres n'est PAS
  dans les filtres, elle est dans le fait d'avoir les points à filtrer (= dette #1).
- Élargir/rétrécir le schéma snapshot : le bump `SOURCES_VERSION` gère la migration proprement.

**DIFFICILE / COÛTEUX :**
- Introduire un fond de carte à tuiles sans dépendance de coût récurrente (dette #2).
- Une carte LIVE ou temps-réel (contredit la doctrine snapshot de bout en bout).
- Un snapshot dense non borné à faire vivre en base rehydratée (dette #3).
- Porter une lib WebGL seul sur plusieurs années (dette #4).

## Les paris de l'architecture et leurs seuils de bascule

1. **Pari : les points par adresse restent bornés.** Rayon 1,5 km OSM / cap 3 km BPE.
   *Seuil* : centre urbain dense > ~200 points/ligne ou snapshot > ~100 KB → il faut éclaircir
   côté serveur (top-N par famille) ou sortir les points dans une table dédiée, pas dans le JSON.
2. **Pari : un fond de carte à coût nul (ou nul-à-l'usage) existe et le reste.**
   *Seuil* : dès qu'un fournisseur impose un quota dépassable ou une facture récurrente → écart
   ADR-0004, il faut soit un fond auto-porté (pmtiles statiques), soit renoncer au basemap.
3. **Pari : « liste + distances » reste la vue principale, la carte est un complément.**
   *Seuil* : si la carte devient la vue primaire → risque de donnée inerte OSM (contre ADR-0002)
   + charge de maintenance carto qui devient structurelle. (Le SI est un jugement Product, pas le
   mien ; je nomme le risque technique.)
4. **Pari : le rendu reste statique (points gelés).** *Seuil* : si le besoin d'exploration
   pan/zoom/tap est prouvé → bascule vers une lib WebGL et sa dette (#4), à ne payer que mesuré.

## Le SPIKE : inconnues, ordre, walking skeleton, critère d'arrêt

**Inconnues à lever, dans l'ordre (de la moins chère à la plus engageante) :**

- **U1 — Schéma & payload (data).** Faire porter au snapshot les points (BPE lat/lon/type +
  géométries vertes) derrière un flag, sur 3 contextes (Paris centre, ville moyenne, rural boisé).
  MESURER le nombre de points et les KB/ligne. Décide tout le reste. Aucun UI. **Le plus cher à
  ignorer, le moins cher à tester.**
- **U2 — Fond de carte (go/no-go réel).** Existe-t-il une source de tuiles compatible avec la
  contrainte de coût ? Piste prioritaire pour un solo : **Protomaps `.pmtiles`** (un fichier
  auto-porté servi en statique depuis Vercel/CDN, sans clé ni coût par requête) vs MapTiler free
  (quota) vs raster OSM (interdit en prod). Attribution ODbL déjà en place. **C'est le vrai
  verrou** : sans réponse conforme ADR-0004, la carte à tuiles ne se fait pas.
- **U3 — Lib & bundle & SSR.** Choisir (SVG maison / leaflet / maplibre), MESURER le delta de
  bundle, confirmer le chemin `dynamic(ssr:false)` dans LogementModule (client).
- **U4 — Interaction & perf mobile.** Seulement si U2/U3 poussent vers du slippy : tester
  pan/zoom/tap sur mobile milieu de gamme.
- **U5 — Doctrine (signalé, pas tranché par moi).** La carte reste-t-elle « à ma porte » et non
  un fond générique ? → Product/Design/Editorial.

**Walking skeleton (dérisque sans s'engager) :** derrière un flag, (1) élargir le snapshot pour
porter les points (U1), (2) rendre un **plot SVG STATIQUE non interactif** centré sur l'adresse :
marqueurs par famille + anneaux de distance, **sans fond de carte à tuiles, sans lib, sans
pan/zoom**, à côté de la liste existante. Cela prouve la valeur visuelle, la faisabilité data et
le coût de payload — SANS prendre la dépendance tuiles ni la lib WebGL. Si ce plot délivre déjà
~90 % de la valeur (situer ce qu'on a autour du point), la carte interactive à tuiles devient
peut-être inutile.

**Critère d'arrêt du spike (décision go/no-go atteignable) :** stop dès que
(a) payload/ligne mesuré et jugé acceptable ou bornable, (b) une source de fond de carte conforme
ADR-0004 est identifiée OU le plot statique prouve assez de valeur pour abandonner le basemap,
(c) delta de bundle mesuré. **Ne PAS construire la version interactive polie pendant le spike**
(filtres animés, styles de tuiles, clustering) : c'est le rôle de l'orchestrateur après go.

## Verdict : MOYEN à faire évoluer — voie la moins endettante = statique d'abord

La plomberie est FAVORABLE (matière brute déjà récupérée et cachée, doctrine « snapshot figé »
déjà en place, composant d'affichage pur, versioning propre). Les marqueurs et les filtres sont
donc PEU coûteux. La difficulté et la dette se concentrent en DEUX points : le **fond de carte à
tuiles** (dépendance de coût récurrente, contre ADR-0004) et la **lib WebGL** (bundle +
maintenance solo). La voie la moins endettante : **figer les points dans le snapshot + plot
statique SVG relatif à l'adresse, zéro dépendance runtime, zéro lib carto** ; n'ajouter le fond de
carte et l'interactivité QUE si le spike (U2) trouve une source à coût nul ET que la mesure prouve
que le statique ne suffit pas. Est-ce parfois « plus de complexité » la bonne réponse ? Oui pour
les FILTRES (ils couvrent un vrai besoin dès qu'il y a plusieurs points), non pour la carte à
tuiles tant que le besoin d'exploration spatiale n'est pas mesuré.

## Version minimale (~90 % de la valeur)

Élargir `Face3Snapshot` pour porter les points (schéma + bump `SOURCES_VERSION`) + rendre un plot
SVG statique centré sur l'adresse (marqueurs par famille + anneaux de distance) à côté de la liste
+ des filtres client montrer/masquer par famille. Pas de tuiles, pas de maplibre, pas de pan/zoom.
C'est le walking skeleton ET, très probablement, le livrable minimal.

## Cohérence / tension posée à l'humain

Tension à trancher (pas par moi) : la contrainte de coût ADR-0004 vs un fond de carte à tuiles.
Tant qu'aucune source auto-portée à coût nul n'est validée, la carte à tuiles est un écart
assumé. Le plot statique évite cette tension entièrement.

## Décision à graver (si go)

« La carte Face 3 se construit sur le snapshot FIGÉ (jamais live), points persistés dans
`Face3Snapshot` sous plafond de nombre/rayon, rendu statique par défaut ; tout fond de carte à
tuiles doit être auto-porté à coût nul (pmtiles/CDN) ou est refusé (ADR-0004). » → candidat ADR
ou note de doctrine Face 3 si la carte est retenue.

## Limites de mon regard (ce run)

- Je n'ai PAS exécuté le code ni mesuré : le nombre réel de points/ligne et les KB de snapshot en
  centre dense sont raisonnés, pas mesurés (c'est précisément l'objet d'U1).
- Je n'ai pas testé de fournisseur de tuiles ni Protomaps en conditions réelles : ma piste
  « pmtiles auto-porté » est une hypothèse à valider en U2, pas un fait établi.
- Rendu visuel du bloc Face 3 non vérifié (derrière session payante `canAccessCompleteReport`),
  comme noté dans la mémoire du module.
- Je juge la STRUCTURE, pas la valeur produit de la carte ni sa charge cognitive à l'écran
  (Product / Design Critic / Editorial). J'ai signalé le risque doctrinal (donnée inerte OSM,
  ADR-0002) sans le trancher.
