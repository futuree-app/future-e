# Audit de la sémantique de la distance dans `logement-osm.ts`

**Horodatage** : 2026-08-03 · **Branche** `main` = `5fec7c2` · **Lecture seule** : aucun fichier du
produit n'a été modifié. Les scripts de mesure sont hors dépôt (scratchpad de session), reproductibles
depuis les annexes.

**Commande** : la « prochaine étape immédiate » de `docs/handoff/CURRENT.md`, quatre questions à
répondre avant d'ajouter la surface (`area`) des polygones. Elles ont toutes une réponse mesurée.
L'audit en a rapporté une cinquième, non demandée, qui pèse plus lourd que les quatre.

**Méthode** : lecture du code, puis trois mesures sur données Overpass réelles, six emprises
(Paris 11e, Lyon 3e, Lille, Angers, Vern-sur-Seiche, Fontainebleau), 300 points d'échantillonnage par
emprise, tirage déterministe (graine `20260803`, pas de `Math.random`, la mesure est rejouable).

---

## Ce qu'il faut retenir en une minute

| # | Constat | Portée mesurée | Gravité |
|---|---|---|---|
| 1 | La distance est bien au **bord**, `0` à l'intérieur | conforme à ce qu'écrit le produit | conforme |
| 2 | L'emprise récupérée est **tronquée de 34 % en longitude** | jusqu'à **15 % des adresses** perdent une infrastructure bruyante entière | **grave** |
| 3 | Les **relations** OSM ne sont jamais interrogées | change la réponse verte sur **3 à 11 %** des points, jusqu'à 218 m | notable |
| 4 | `access` et `barrier` **existent** mais ne sont ni demandés ni lus | 61 verts `private` sur 1 887 objets, très inégal selon la ville | exploitable, partiellement |
| 5 | Aucune géométrie invalide, aucun way ouvert, aucun node vert | 0 sur 1 887 objets | non-problème |

Le constat 2 n'était pas dans la commande. C'est pourtant le seul qui fasse **disparaître un fait vrai
du rapport payant**, sans erreur, sans test rouge, sans trace.

---

## 1. La distance est au bord, et vaut zéro à l'intérieur

`computeOsmProximity` route par `kind` : `polygon` → `distancePointToPolygonM`, `line` →
`distancePointToPolylineM`, `node` → `haversineM`. `distancePointToPolygonM` teste d'abord
l'appartenance (`pointInRing`, ray casting sur coordonnées projetées) et rend `0` si le point est
dedans, sinon la distance au segment le plus proche du contour.

Vérifié sur un carré de ~110 m :

| Cas | Résultat |
|---|---|
| point à l'intérieur | `0,0 m` |
| point à 10 m sous le bord sud | `11,1 m` |
| point à 500 m | `500,4 m` |

C'est donc bien le bord, comme l'annonce la limite rédigée dans `logement-autour-chaleur.ts:89`
(« la distance est mesurée à vol d'oiseau jusqu'à la limite de l'espace, pas jusqu'à une entrée »).
**Le texte rendu dit vrai sur ce point.**

Deux réserves, sans effet sur le résultat aujourd'hui :

- **`geo-distance.ts:62` compare deux objets par référence.** `ring[0] === ring[ring.length - 1]` est
  toujours `false` : `parseOverpass` reconstruit chaque sommet (`el.geometry.map(p => ({...}))`), donc
  le premier et le dernier point sont deux objets distincts même quand leurs coordonnées sont
  identiques. Le contour est donc systématiquement refermé une seconde fois. Le segment ajouté est
  dégénéré (`len2 === 0`, la distance se réduit à celle du sommet, déjà couverte) : aucune erreur de
  résultat, un test de fermeture inopérant. À corriger par comparaison de coordonnées, pas d'identité.
- **Un way vert non fermé est classé `line`**, donc un point situé « dedans » ne rend jamais `0`. Le
  choix est prudent et juste. Il ne se déclenche jamais : 0 way ouvert sur 1 795 mesurés.

## 2. L'emprise récupérée est tronquée d'un tiers en longitude : le constat non demandé

`getTileGeoms` construit la fenêtre de la requête ainsi (`logement-osm.ts:138`) :

```ts
const marginDeg = OSM_BBOX_RADIUS_M / 111_000;
const bbox = { s: cell.s - marginDeg, w: cell.w - marginDeg, n: cell.n + marginDeg, e: cell.e + marginDeg };
```

La même marge en degrés est appliquée à la latitude **et** à la longitude. Un degré de latitude vaut
~111 km partout ; un degré de longitude vaut `111 km × cos(lat)`, donc moins dès qu'on quitte
l'équateur. La marge est/ouest réelle n'est donc pas 1 500 m :

| Latitude | Marge est/ouest réelle | Couverture |
|---|---|---|
| Perpignan (42,7°) | 1 102 m | 73 % |
| Lyon (45,75°) | 1 047 m | 70 % |
| Paris (48,85°) | 987 m | 66 % |
| Lille (50,63°) | 951 m | 63 % |

`computeOsmProximity` filtre ensuite à `d > bboxRadiusM`, soit 1 500 m. **Entre ~1 000 m et 1 500 m à
l'est et à l'ouest, le produit croit chercher et ne trouve rien, parce qu'il n'a rien demandé.** Vers
le nord et le sud, il cherche bien. Le résultat est anisotrope, et rien ne le signale.

C'est exactement le défaut que `geo-distance.ts` documente en quinze lignes au-dessus de `bboxAround`
(« elle existe parce qu'un appelant s'est trompé », `cartofriches`). La fonction correctrice existe,
elle est exportée du même module que `getTileGeoms` importe déjà. Elle n'est pas appelée ici.

**Ce que ça coûte, mesuré.** Sur les espaces verts : rien (0/300 points partout). Les verts sont
denses et proches, la troncature ne mord jamais. Sur les infrastructures bruyantes, qui sont rares et
lointaines, elle mord franchement :

| Emprise | Adresses dont le récit bruit change | Infrastructure entièrement disparue | Distance surestimée |
|---|---|---|---|
| Paris 11e | 0 % | — | — |
| Vern-sur-Seiche | 2 % | 4 × voie ferrée | 1 cas, 23 m |
| Angers | 5 % | 4 × autoroute, 3 × trunk, 1 × rail | 9 cas, 53 m moyen, 114 m max |
| Fontainebleau | 8 % | 24 × voie ferrée | — |
| Lyon 3e | 9 % | 28 × trunk | — |
| **Lille** | **15 %** | **19 × trunk, 18 × voie ferrée** | 9 cas, 93 m moyen, **292 m max** |

À Lille, une adresse sur sept voit une voie ferrée ou un axe rapide réellement situé à moins de
1 500 m **absent du rapport**. Le module n'affiche pas « donnée incomplète » : il affiche la liste
courte comme si elle était complète. Le gradient suit la latitude, comme attendu.

Le tour est jouable en une ligne (`marginDeg` en longitude divisé par `cos(lat)`, ou appel à
`bboxAround`), mais il invalide le cache : les cellules déjà stockées l'ont été sur l'emprise courte.
Un `OSM_QUERY_VERSION` bumpé suffit à les faire re-fetcher à la demande, le mécanisme est prévu pour.

## 3. Les relations ne sont jamais interrogées

`overpassQuery` ne demande que `way`. Ni `node`, ni `relation`. Le type `OsmGeom` prévoit pourtant
`kind: "node"` et `computeOsmProximity` porte une branche `haversineM(center, g.pts[0])` : **du code
inatteignable**, qui donne l'impression que le cas est traité.

Décompte sur les six emprises, rayon 1 500 m (1 887 objets verts) :

| Emprise | ways | nodes | relations | invisibles |
|---|---|---|---|---|
| Paris 11e | 483 | 0 | 28 | 5 % |
| Lyon 3e | 535 | 1 | 10 | 2 % |
| Angers | 460 | 0 | 36 | 7 % |
| Vern-sur-Seiche | 208 | 0 | 8 | 4 % |
| Fontainebleau | 109 | 0 | 9 | 8 % |
| **Total** | **1 795** | **1** | **91** | **5 %** |

5 % en volume ne dit rien de l'effet sur la réponse. Mesuré directement, en comparant « vert le plus
proche avec les ways seuls » à « vert le plus proche avec relations et nodes » :

| Emprise | Réponse changée | Écart moyen | Écart max |
|---|---|---|---|
| Paris 11e | 3 % | 20 m | 26 m |
| Lyon 3e | 5 % | 20 m | 82 m |
| Lille | 6 % | 38 m | 75 m |
| Vern-sur-Seiche | 5 % | 43 m | 158 m |
| Angers | 9 % | 58 m | 159 m |
| **Fontainebleau** | **11 %** | **83 m** | **218 m** |

Ces chiffres sont un **plancher**. La mesure traite chaque membre de relation comme une polyligne : la
distance au bord est exacte pour un point extérieur, mais un point situé **à l'intérieur** d'un
multipolygone reçoit la distance à sa limite au lieu de `0`. Or c'est précisément le cas de
Fontainebleau, où la forêt domaniale est une relation et où les membres de relation (172 anneaux)
dépassent presque les ways (205). Une adresse en lisière de forêt peut donc s'entendre dire « une
forêt à 300 mètres » alors qu'elle est dedans.

Aucun point de l'échantillon, sur aucune emprise, n'était sans espace vert dans les 1 500 m. La
branche « aucun espace correspondant aux catégories recherchées n'est cartographié » de
`lireChaleurEtVegetal` n'a jamais été atteinte en 1 800 points. Elle reste juste, elle est rare.

## 4. `access` et `barrier` existent, ne sont ni demandés ni lus

La requête ne filtre pas sur ces tags et `parseOverpass` ne les lit pas. Overpass les renvoie
pourtant : ils sont disponibles gratuitement, mais **perdus au parsing**, donc absents du cache. Les
exploiter impose un bump de `OSM_QUERY_VERSION` (re-fetch), pas une simple lecture.

Renseignement mesuré sur les 1 887 objets verts :

| Emprise | `access` | `barrier` |
|---|---|---|
| Lyon 3e | 55 `private`, 4 `yes`, 3 `no`, 1 `permissive` | 16 |
| Paris 11e | 2 `private` | 13 |
| Angers | 4 `private`, 2 `yes`, 1 `permissive` | 1 |
| Vern-sur-Seiche | aucun | 0 |
| Fontainebleau | aucun | 0 |
| **Total** | **61 `private`, 6 `yes`, 3 `no`, 2 `permissive`** | **30** |

**La couverture est trop inégale pour porter une affirmation.** Lyon renseigne `private` sur ~10 % de
ses verts, Paris sur 0,4 %, le rural sur rien. Un espace sans tag `access` n'est pas public : il est
non renseigné. Conclure « accessible » d'une absence de tag serait exactement l'erreur que la doctrine
interdit, et que le commit `47dfadc` (« j'avais écrit *accès* là où je n'avais qu'une distance ») a
déjà corrigée une fois.

Ce que le tag permet honnêtement, en revanche : **écarter**. `access=private` et `access=no` sont des
affirmations positives du contributeur. Un bois explicitement privé peut cesser d'être proposé comme
« le premier espace végétalisé », ou être nommé comme privé. C'est un filtre négatif fiable, jamais
une garantie positive. Même raisonnement pour `barrier`, qui documente une clôture existante sans
jamais documenter son absence.

## 5. Géométries invalides et espaces verts en simple point : le non-problème

Sur 1 795 ways verts : **0** sans géométrie, **0** avec moins de 3 points, **0** ouvert. Les ways
verts sont fermés dans 100 % des cas mesurés. La question « combien d'espaces verts sont un simple
point » a une réponse double : 1 node sur 1 887 objets existe, et il n'est de toute façon jamais
récupéré (constat 3). Ce n'était pas le risque.

---

## Ce que ça change pour la suite

Le handoff plaçait l'ordre : sémantique de la distance et accessibilité **avant** la surface. L'audit
le confirme et insère une marche avant les deux.

1. **Réparer l'emprise en longitude.** Une ligne, plus un bump de `OSM_QUERY_VERSION`. C'est le seul
   constat qui supprime un fait vrai du rapport payant, et il touche le bruit, pas le vert : il ne
   sera pas rattrapé par le travail sur les espaces verts. Ajouter au passage un test qui
   échoue sur l'ancien calcul (une adresse à latitude haute, une infrastructure à 1 200 m à l'ouest).
2. **Ajouter `relation` à la requête**, et assembler les anneaux. Sans quoi la surface (`area`) sera
   calculée sur un corpus qui ignore les plus grands objets : le calcul le plus faux serait un calcul
   juste sur un corpus amputé. En rural boisé, c'est 11 % des réponses et le cas « dedans » raconté
   comme « à 300 mètres ».
3. **Récupérer `access` et `barrier` dans le même bump**, les stocker, et ne s'en servir que pour
   écarter ou pour nommer un espace privé. Jamais pour affirmer un accès.
4. **Alors seulement la surface.** L'intuition du handoff est confirmée par la mesure : un espace
   accessible de 2 000 m² vaut mieux qu'une forêt privée de 40 ha dont la limite est proche.

Deux dettes mineures à solder au passage : la comparaison par référence de `geo-distance.ts:62`, et
la branche `kind: "node"` de `computeOsmProximity`, morte tant que la requête ne demande pas de nodes.

## Ce que l'audit n'a pas regardé

- **Les axes bruyants au-delà de la question de l'emprise** : le corpus (`motorway`, `trunk`, `rail`)
  n'a pas été confronté à une source tierce. Un `primary` très circulant reste invisible par
  construction, décision antérieure non réexaminée ici.
- **Le dimensionnement de `OSM_CELL_DEG`** (0,005°, ~555 m nord-sud, ~365 m est-ouest à Paris), dont
  le commentaire du code dit lui-même qu'il est « à valider ». La cellule est déjà anisotrope.
- **Le taux de succès réel d'Overpass en production.** Une emprise sur six a échoué pendant la
  première mesure (Lille, retentée avec succès ensuite). `getTileGeoms` renvoie alors `status:
  "failed"` avec zéro géométrie : le comportement de l'écran dans ce cas n'a pas été instruit ici.

## Annexes

Scripts de mesure, hors dépôt, dans le scratchpad de session
`…/d8aad89e-a6f1-4484-b071-58d13ff5539e/scratchpad/` :

| Fichier | Ce qu'il mesure |
|---|---|
| `audit-osm-distance.mjs` | décompte way/node/relation, fermeture, `access`, `barrier` |
| `audit-osm-ecart.mjs` | écart de réponse verte, ways seuls contre relations et nodes |
| `audit-osm-bruit.mjs` | effet de l'emprise tronquée sur les infrastructures bruyantes |
