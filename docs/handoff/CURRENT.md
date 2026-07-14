# Passation — le lot 2a est livré ; la suite est le lot 2b (persistance), puis `mismatch`

**Horodatage** : 2026-07-14 · **Branche** : `main` (9 commits d'avance sur `origin`, **non poussés**)
**Dernier commit** : `0ef7090` (retenue, pas confirmée) · **Aucune PR ouverte.**

---

## Fait dans cette session : le lot 2a des contraintes dures

« À 30 minutes en voiture de la gare Matabiau » est désormais **posable** par le lecteur, **résolue** (la
gare, pas la rue), **évaluée** (point dans l'isochrone), et le comparateur **filtre** dessus. Plan exécuté :
`docs/superpowers/plans/2026-07-14-lot2a-references-nommees.md` (il contient la doctrine complète).

**Six faits d'enquête ont corrigé la spec avant d'écrire une ligne.** Ils sont vérifiés à la main, contre
les API réelles, et ils commandent le code :

1. **La BAN ne sait pas géocoder une gare.** Sur « gare Matabiau », elle rend « **Rue** Matabiau » (type
   `street`, score 0,71) : plausible, à 500 m, et faux. C'est la **Géoplateforme** (`index=poi`, BDTOPO)
   qui connaît la gare, avec sa catégorie et un identifiant stable (`cleabs`).
2. **LE SCORE NE DÉCIDE PAS, LA CATÉGORIE DÉCIDE.** Sur « hôpital de Purpan », le **mieux classé** (0,65)
   est le *Centre de Formation Métiers de la Santé CHU Hôpital de Purpan*. Le vrai hôpital est à **0,42**.
   Les deux portent les deux mots du lecteur : ni le score ni le libellé ne les séparent. Un plancher de
   score à 0,6 aurait **tué l'hôpital**.
3. **Deux lieux à 2,5 km sont deux lieux.** « Gare de Lyon » rend **cinq** gares, toutes à 0,85 (Paris,
   Perrache, Guillotière…). Le seuil de déduplication est **300 m**, jamais 5 km, et le cas normal est
   `ambiguous`.
4. **Le vélo n'existe pas** chez IGN (HTTP 400 sur toutes les ressources) : `unsupported_metric`, et le
   produit **ne le propose pas** dans la question qu'il pose au lecteur.
5. **Le parse ne savait pas exprimer la contrainte** (`nearPlace` était `{ label, maxKm }`, et le prompt
   disait « label = nom de commune »). Rien n'empêchait le LLM d'écrire `maxKm: 30` pour « 30 minutes ».
6. **L'isochrone rate-limite** (429). Le cache n'est pas une optimisation : il doit **dédoublonner les
   appels en vol**, sinon deux lecteurs simultanés sur la même gare partent tous les deux vers IGN.

**Architecture livrée** (le noyau reste PUR : ni `server-only`, ni `fetch`) :

```
parse (temps + mode + lieu non communal)
  → resolveExternalReferences (SERVEUR, le seul module qui touche le réseau)
      geocode-place.ts   : Géoplateforme POI + BAN, en parallèle, candidats FUSIONNÉS
      place-screening.ts : LES CONTRÔLES (type attendu, CATÉGORIE, libellé, territoire, plancher)
      isochrone.ts       : un polygone depuis le LIEU, cache + dédup en vol
  → hydrateHardConstraints (PURE, appelée 2 fois : une pour savoir quoi résoudre, une avec le sac)
      → noyau : evaluateNearPlace (point-dans-polygone, bande de tolérance)
          → comparateur : filtre + « retenue, pas confirmée »
          → dossier     : satisfied / incompatible / uncertain
```

## L'arbitrage produit de la session : « retenue, pas confirmée »

La bande de tolérance happait **24 des 31 communes** de l'aire toulousaine (la frontière des 30 minutes
traverse la couronne où le lecteur cherche). Les deux conduites simples étaient fausses : les exclure
supprimait 77 % des candidats pour une limite de **mesure** ; les laisser passer les faisait passer pour
conformes. Doctrine tranchée avec le porteur :

- le **noyau** ne bouge pas : `unexamined(insufficient_precision)` ne devient **jamais** `satisfied` ;
- l'**adaptateur comparateur** la **retient** et la **marque** (« À la limite du seuil ») ;
- les **confirmées passent avant** au tri : sur une condition non négociable, le score de préférences n'a
  pas le droit de faire disparaître l'incertitude ;
- elle garde `complete: false`, reste `uncertain` au dossier, **ne fait pas monter la couverture** ;
- le bandeau ne fond pas les deux populations : « 7 communes se situent clairement dans votre seuil…, nous
  vous en proposons aussi 20 à la limite du calcul ».

> **La souplesse de l'affichage ne contamine pas la vérité du moteur.**

---

## PROCHAINE ÉTAPE : le lot 2b (la persistance)

1. **`ResolvedPlaceReference` persistée** dans `UserProject`, avec son `inputHash` et son
   `resolverVersion` (`RESOLVER_VERSION` est passé à `resolve-2`).
2. **Table `reachability_artifact`** : l'artefact partagé **entre instances**, survivant aux redémarrages.
   C'est elle, et elle seule, qui permettra de promettre que les deux moteurs lisent le **même objet gelé**.
   Aujourd'hui ils traversent la même **chaîne**, avec le même cache **de process** : un géocodage réussi
   ici et un 429 là restent possibles. **Ne pas annoncer la garantie avant qu'elle existe.**
3. **Read repair** des projets historiques, **au-dessus** des deux moteurs.
4. **Suppression du témoin gelé** `src/lib/legacy-passes-hard.ts` et de son test.

**INTERDIT ABSOLU du lot 2b** : `geocoding_unavailable` et `routing_unavailable` sont des **pannes**, pas
des constats. Elles ne doivent **jamais** être persistées : un incident réseau deviendrait une impossibilité
sémantique stable (« ce lieu n'existe pas »).

## Les deux limites connues, à traiter (elles ne sont pas des bugs)

- **Sous ~15 minutes, le grain communal ne suffit plus.** À 12 minutes de la gare Matabiau, **aucune commune
  de France** n'a son centroïde dans l'isochrone, pas même Toulouse (dont le point de l'index, 43,6007 /
  1,4328, tombe dehors) : le comparateur rend 0 résultat avec un message qui ne dit pas la vraie raison.
  L'isochrone est alors **plus petite que la commune**. Cible : évaluer la **géométrie communale** (la spec
  §3.3 la nomme déjà « la bonne cible, hors de ce spec »).
- **Les 300 m de tolérance sont une convention prudente PROVISOIRE, pas une précision mesurée.** L'espacement
  des sommets (267 m médian, 539 m au p90) montre que la géométrie est grossière ; il ne démontre pas que
  l'erreur vaut 300 m. La valider demandera une géométrie moins simplifiée, ou de vrais itinéraires calculés
  sur un échantillon de points frontaliers. Piste : n'affiner (appel de routage ponctuel) que les **communes
  de la bande**, en gardant l'avantage « un polygone, pas 35 000 appels ».

## ENSUITE : le chantier B, `mismatch` (inchangé)

Un lieu répond **mal** à une priorité déclarée, sans que ce soit éliminatoire : ce n'est ni une
incompatibilité, ni un compromis, ni une inconnue, ni une vérification. Il entraîne un nouvel outcome, une
orientation refondue, une table de vérité réécrite, un **bump de `DECISION_NARRATIVE_PROMPT_VERSION`** et un
re-passage de la sonde. C'est seulement après B que les préférences à score (`cadre_calme`, `vie_locale`,
`nature`, `acces_ecoles`) pourront être couvertes honnêtement.

---

## Ce qu'il ne faut PAS casser (invariants, lots 1 et 2a)

- **Aucun `?? 0`** sur une donnée nullable. Une commune sans coordonnées n'est pas un point à (0, 0).
- **Un temps de trajet n'est JAMAIS évalué par un haversine**, et aucune minute n'est **jamais** convertie
  en kilomètres, ni dans le code, ni dans le prompt.
- **Une panne n'est jamais un constat** : `geocoding_unavailable` ≠ `no_result` ; `routing_unavailable` ≠
  `incompatible`. Les deux sont retentables, ne filtrent pas, et ne se persistent pas.
- **Une valeur structurée ne dit que ce qu'elle établit** : `travel_time_threshold` porte `within` (un
  côté de la frontière), jamais « 30 minutes mesurées ».
- **La catégorie décide, le score est un plancher** (0,3). Ne jamais remonter `MIN_SCORE` sans refaire le
  test de l'hôpital de Purpan.
- **Une géométrie illisible rend `unusable`, jamais `outside`** (un anneau invalide, un trou illisible, une
  coordonnée hors bornes : toute la géométrie est déclarée inutilisable).
- **Une contrainte composite n'est satisfaite que si TOUTES ses composantes ont été appliquées.**
- **Le témoin gelé** (`legacy-passes-hard.ts`) porte l'ANCIEN filtre avec ses défauts intacts. **Ne jamais
  l'« améliorer »** : le jour où on le corrige, il cesse d'être un témoin.
- **`server-only` n'est pas résolvable par `node --test`** : les libs pures ne l'importent qu'en **type**
  (c'est pourquoi `hard-constraints-hydrate.ts` importe `ExternalResolutions` en `import type`).
- **Ne jamais utiliser `git add -A`** : le porteur édite en parallèle. Stager les fichiers nommément.

**Après toute modification** :
```bash
node --test src/lib/*.test.ts src/lib/decision/*.test.ts   # 421 verts aujourd'hui
npx tsc --noEmit                                            # doit rendre 0
node --env-file=.env.local scripts/probe-conclusion.ts      # 15/15 (le prompt n'a pas bougé)
```

## À lire d'abord à la reprise

1. `/memory/MEMORY.md`, puis la fiche `project_dossier_decision`.
2. Le plan du lot 2a : `docs/superpowers/plans/2026-07-14-lot2a-references-nommees.md` (les six faits
   d'enquête, et pourquoi chaque contrôle existe).
3. Code, dans cet ordre : `place-screening.ts` (les contrôles, le cœur de l'honnêteté) →
   `geocode-place.ts` (le réseau, et `degraded`) → `isochrone.ts` (le cache et la dédup en vol) →
   `hard-constraints-external.ts` (l'orchestration au-dessus des deux moteurs) → `hard-constraints.ts`
   (`evaluateNearPlace`) → `hard-constraints-filter.ts` (« retenue, pas confirmée »).
