# FUT-98 : temps de trajet IGN, une commune n'est plus exclue sur une durée que le moteur contredit

04/11/2026. Branche `bonjourfuturee/fut-98-fiabiliser-lusage-des-estimations-ign-dans-les-temps`, depuis `main` à `853246c3`.
Le correctif applique l'arbitrage du 23/10/2026 consigné dans FUT-98. Aucune écriture Supabase, aucun appel Anthropic.

## 1. Diagnostic

**Le défaut.** Pour un même départ, une même arrivée et un même mode, le moteur IGN (`bdtopo-valhalla`) peut annoncer pour sa route `shortest` une durée **plus courte** que pour sa route `fastest`. Valhalla minimise un coût interne, qui n'est pas exactement la durée qu'il restitue. Le produit ne demandait que `fastest`. Une commune pouvait donc être exclue, ou déclarée incompatible dans un dossier, sur une durée que le moteur lui-même contredit.

**Le défaut existe toujours, mais il est plus étroit qu'en octobre.** Nous avons rejoué le 04/11/2026 la paire de requêtes du cas de référence et la sonde des 20 communes du 23/10, avec les mêmes centroïdes du produit vers le point BPE de la gare de La Rochelle (42 appels séquentiels). Les réponses brutes sont dans `~/Documents/futuree-fut98/replay-2026-11-04/` :

| Cas | 13/10 (graphe 2026-10-05/07) | 04/11 (graphe 2026-11-03/04) |
|---|---|---|
| Place de l'Europe → gare, fastest | 10,96 km / 24,1 min (rocade) | 4,40 km / **15,3 min** (en ville) |
| Place de l'Europe → gare, shortest | 4,38 km / 22,7 min | 4,38 km / 15,5 min |
| Inversions sur les 20 communes | 3 sur 20 (23/10), de 0,3 à 1,0 min | **2 sur 20** : Dompierre-sur-Mer 18,47 / 18,11 (même version de graphe) ; Montroy 27,22 / 26,59 (versions différentes) |

* **Le cas Europe → gare n'est plus anormal.** Avec le graphe actuel, `fastest` ne contourne plus le centre par la rocade. L'anomalie d'octobre venait du graphe de l'époque, pas des points ni du paramétrage. Les durées urbaines ont aussi baissé d'environ un tiers : 16,9 → 12,7 min depuis le centroïde de La Rochelle.
* **L'inversion reste reproductible** sur le même graphe (Dompierre). Elle est de faible amplitude (moins de 1 min) et ne joue qu'à proximité immédiate d'un seuil.
* **Hors de cause :** les coordonnées (départ et arrivée recalés identiquement par les deux calculs), le profil, l'unité (`timeUnit=minute`, vérifiée par `parseRouteMinutes`) et l'interprétation de la durée.
* **Limite intrinsèque, non corrigée ici :** les écarts avec d'autres calculateurs (OSRM sur OSM), et l'évolution des vitesses du graphe d'une version à l'autre. Aucune vérité terrain ne permet de trancher. Ce n'est pas résolu par une moyenne ni par une fourchette.

**Effet dans le produit (code de `main`) :**

* **Filtre « Où vivre » / comparateur** (`refineTravelTimes`, passe A) : `fastest > limite` ⇒ la commune **sort**, même si l'isochrone l'avait confirmée.
* **Dossier Territoire ou Adresse** (`estimateTravelTimeAt` puis `verdictParEstimation`) : la même valeur produit `incompatible`, avec l'énoncé « est à environ X minutes […], au-delà de la limite ».
* **Affichage :** « Environ N minutes de trajet estimées » (passes A et B). La formulation est juste ; c'est la valeur montrée qui pouvait être la moins favorable des deux que connaît le moteur.

**Hors défaut, vérifié :** une panne IGN (429, 5xx, réseau, délai dépassé) ou une réponse invalide (autre unité, durée absente ou négative) produit déjà `unavailable`. Ce statut n'exclut jamais : dans le comparateur, la commune est conservée, avec le badge « calcul indisponible » si elle est à la limite ; dans le dossier, la contrainte est `unexamined`, ou tranchée par l'isochrone si celle-ci est disponible. Aucun échec n'est converti en zéro, en infini ou en incompatibilité.

## 2. Correctif

Une seule règle, pure, dans le noyau (`hard-constraints.ts`, à côté de `travelThresholdLabel`), appliquée par les deux moteurs :

```
retenirDuree(fastest, max, shortest?)
  fastest <= max                   -> fastest, dans la limite   (aucun second appel)
  fastest >  max, shortest <= max  -> shortest, dans la limite
  fastest >  max, shortest >  max  -> min des deux, au-delà
  fastest >  max, shortest absent  -> fastest, au-delà           (repli = comportement d'avant)
```

* `route-time.ts` : paramètre `optimization` (`fastest` par défaut). Le hash n'inclut l'optimisation **que** pour `shortest` : les clés `fastest` en mémoire et en table sont inchangées, et `ROUTE_VERSION` aussi. Les mêmes étages s'appliquent (mémoire, appels en vol partagés, table), avec le même limiteur IGN. La ligne de cache porte `engine = ign-valhalla-shortest`, colonne texte libre, sans migration.
* `comparateur-vie.ts` (`refineTravelTimes`, passes A et B) : le second appel n'a lieu **que** si `fastest` dépasse la limite, sous la même échéance de 6 s et le même plafond de 24 communes. Le verdict `fastest` est posé d'abord : c'est le repli si `shortest` échoue ou arrive après l'échéance. La table rendue est une copie figée à l'échéance.
* `decision/territory-facts.ts` (`estimateTravelTimeAt`, dossiers commune et adresse) : même règle. L'estimation porte `route` et le hash de la demande qui a produit la durée retenue.
* `verdictParEstimation`, `dureeEnPhrase` et `OuVivreClient.tsx` : **inchangés**. Ils reçoivent la durée retenue ; « estimé à environ » reste la formulation, et la décimale est montrée quand l'arrondi contredirait le verdict.

**Volontairement inchangé :**

* les seuils et la comparaison `<=` sur la valeur brute ;
* le chemin nominal (`fastest` dans la limite : un seul appel, la même durée) ;
* les classements ;
* l'isochrone ;
* les libellés.

`shortest` n'est jamais préféré en général et rien n'est moyenné.

**Pourquoi le repli garde « au-delà » quand `shortest` échoue.** L'exclusion repose alors sur une durée réellement calculée et supérieure au seuil, pas sur l'échec. Rendre la commune « indéterminée » transformerait chaque panne IGN en incertitude, même pour des communes nettement au-delà. C'est le choix de l'arbitrage du 23/10, fixé par un test.

## 3. Preuves

`src/lib/fut98-route-courte.test.ts` : 15 tests, tous verts.

* La règle aux bornes : 29,9/30 ; égalité exacte ; Clavette 24,3/23,9 pour une limite de 24 ; L'Houmeau 26,1/25,1 pour 25 ; 30,4/31 ; panne.
* Le hash `fastest` est identique, octet pour octet, à la formule d'avant FUT-98.
* **Cas réel Europe → gare** (réponses IGN conservées du 13/10, fixture `route-europe-gare-larochelle.json`), limite 24 min : avant, `over` à 24,09 (la commune sortait) ; après, `within` à 22,70. Avec les réponses du 04/11, limite 20 : `within` à 15,27, en un seul appel.
* **Trajet ordinaire** Blagnac → Matabiau (réponse réelle du 14/07), limite 30 : `within` à 23,70, en un seul appel, inchangé.
* **Estimation atypique près du seuil :** Clavette est conservée (23,9) et Rivedoux reste exclue (31,8 / 43,1).
* **Panne ou réponse invalide :** `unavailable`, sans second appel ; si seule `shortest` tombe en panne, repli `over` sur `fastest`.
* **Dossier :** Clavette `satisfied`, « environ 24 minutes en voiture », preuve sur la demande `shortest`. L'Houmeau `incompatible`, avec l'énoncé « environ 25,1 minutes ». Si IGN est en panne : `unexamined`.

Non-régression : suite complète `--test-concurrency=1`, base `main` 4 232 tests, tête 4 247 (= base + 15), 0 échec des deux côtés ; `tsc --noEmit` sans erreur ; eslint sans erreur (un avertissement déjà présent sur `main`) ; `npm run build` réussi.

## 4. Limites résiduelles

* **Isochrone :** une commune hors de l'isochrone, au-delà de la bande de tolérance, est exclue sans itinéraire. L'isochrone suit le coût `fastest`, et les inversions observées (moins de 1 min) restent bien en deçà de ce qu'une frontière éloignée de la tolérance représente. À rouvrir seulement si un cas réel le montre.
* **Échéance du comparateur :** sous charge, une `shortest` qui n'arrive pas dans les 6 s laisse le verdict `fastest` (repli). La recherche suivante profite du cache.
* **Échantillon :** une seule agglomération, deux dates. Ce n'est pas un benchmark ; la fréquence des inversions ailleurs n'est pas connue.
* **Durées IGN :** elles évoluent avec le graphe (Europe → gare : 24 puis 15 min) et ne sont pas une vérité terrain. Le comportement admissible reste « estimé à environ », sans promesse supplémentaire bâtie dessus (carburant, comparaison de modes : FUT-47).
* **Point de la gare :** c'est le point BPE (adresse) et non une entrée vérifiée.
* **Recette navigateur :** le parcours « Où vivre » complet (analyse du projet, isochrone, IGN réels) n'a pas été rejoué. La restitution est vérifiée par le code (`OuVivreClient.tsx` affiche `travelMinutes`, la durée retenue) et par les tests.
