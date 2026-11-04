# FUT-140 · Identités périurbaines des arrondissements PLM

Date : 04/11/2026. Base : `main` à `9866489e`. Branche : `bonjourfuturee/fut-140-identites-plm`.

## En une phrase

Paris 1er, Paris 2e, Marseille 2e et Marseille 16e recevaient l'identité « Pour vivre aux portes d'une grande ville, sans en habiter le centre ». Dans « Où vivre », la carte « Paris » l'affichait. Ces quatre arrondissements en sont maintenant exclus. Les 1 784 vraies communes périurbaines la gardent. Aucun score, rang, filtre ni donnée ne change.

## Diagnostic

**Le défaut était présent sur `main`.** Dans `buildIdentiteCandidates` (`src/lib/comparateur-vie.ts`), la condition était inchangée :

```ts
const periurbain =
  c.population != null && uuPop != null && uuPop >= 100000 && c.population < 25000;
```

**Cause.** L'index range Paris, Lyon et Marseille par arrondissement. `c.population` est donc la population d'un arrondissement, et `uuPop` celle de l'unité urbaine de la ville-centre. Un arrondissement de moins de 25 000 habitants remplit la règle, alors qu'il est le centre de la ville.

**Mesure sur les 45 arrondissements** (index réel, `data/comparateur-index.json.gz`) :

| Arrondissement | Population | Unité urbaine | Touché |
|---|---:|---|---|
| Paris 1er (75101) | 15 919 | 00851 (10,9 M) | oui |
| Paris 2e (75102) | 21 119 | 00851 | oui |
| Marseille 2e (13202) | 23 627 | 00759 (1,6 M) | oui |
| Marseille 16e (13216) | 15 487 | 00759 | oui |
| Lyon 1er à 9e | toutes ≥ 25 000 | 00760 | non |
| Les 37 autres | ≥ 25 000 | | non |

**Effet visible.** Dans « Où vivre », le regroupement PLM (`cityKey`) montre une seule carte « Paris », portée par l'arrondissement le mieux classé. Sur les trois projets parisiens rejoués, c'était Paris 1er, et la carte « Paris » disait « aux portes d'une grande ville, sans en habiter le centre ». La même phrase partait aussi dans la synthèse rédigée du mode choix (`synthesize-choix`, champ `identite`).

## Correctif

Une condition, au point de décision (`src/lib/comparateur-vie.ts`, `buildIdentiteCandidates`) :

```ts
const arrondissementPLM = communeParent(c.insee) !== c.insee;
const periurbain =
  !arrondissementPLM && c.population != null && uuPop != null && uuPop >= 100000 && c.population < 25000;
```

- **Reconnaissance des arrondissements.** On utilise `communeParent` de `src/lib/plm.ts`, la table canonique (75101–75120, 69381–69389, 13201–13216). Elle est exacte, contrairement à l'expression régulière `estArrondissementPLM`, qui accepterait 75100 ou 75199. Aucune nouvelle liste de codes.
- **Pourquoi les communes périurbaines ne bougent pas.** La règle des communes est inchangée. Seule une entité qui n'est pas une commune (un arrondissement) en est exclue. Sceaux, Écully, Allauch, Marnes-la-Coquette, Châteauneuf-les-Martigues… gardent l'identité.
- **Ce qui n'est pas touché.** Population de l'index, `tailleVille` / `tailleLabel`, scores, pondérations, contraintes de taille, seuils de filtre, règles FUT-109. La condition est purement narrative.

## Avant / après

### Candidats (niveau 1)

Sur les 34 788 territoires de l'index, **exactement 4 listes de candidats changent**. Dans chacune, seul le candidat périurbain disparaît. Le nombre de territoires portant ce candidat passe de 1 788 à 1 784. Aucune identité n'est ajoutée.

### Identité affichée (niveau 2, après `assignIdentite`)

| Territoire | Identité avant | Identité après | Justification |
|---|---|---|---|
| Paris 1er (75101), carte « Paris » d'« Où vivre » | Pour vivre aux portes d'une grande ville, sans en habiter le centre. | Pour une ville étudiante à taille humaine. | Arrondissement central, pas une périphérie (voir réserve ci-dessous sur « à taille humaine ») |
| Paris 2e (75102), trio 75101 · 75102 · 75103 | Pour une ville étudiante à taille humaine. | Pour s'installer dans une commune qui gagne des habitants. | La déduplication décale : 75101 prend l'identité étudiante |
| Lyon 1er (69381), trio avec Écully et Vaulx-en-Velin | Pour une ville étudiante à taille humaine. | inchangée | Aucun arrondissement lyonnais n'était concerné |
| Marseille 16e (13216), trio avec Allauch et Les Pennes-Mirabeau | Pour un quotidien méditerranéen, les pieds près de l'eau. | inchangée | Le candidat périurbain existait, mais n'était pas choisi |
| Sceaux (92071), commune réellement périurbaine, trio avec Paris 1er et Écully | Pour s'installer dans une commune qui gagne des habitants. | Pour vivre aux portes d'une grande ville, sans en habiter le centre. | Dans le trio, Paris 1er ne prend plus la phrase : elle revient à Sceaux, qui la mérite |
| Écully (69081), même trio | Pour un quotidien au calme, loin de l'agitation. | Pour s'installer dans une commune qui gagne des habitants. | Déduplication en cascade, identités toujours distinctes |
| Allauch (13002), trio avec Marseille 2e et 16e | Pour vivre aux portes d'une grande ville… | inchangée | Vraie commune périphérique de Marseille |

Projets « Où vivre » rejoués (avant/après, mêmes données) : Paris × 3, petite couronne × 2, Bouches-du-Rhône × 2, Rhône × 2. Seule la carte « Paris » change d'identité, dans 4 projets sur 9. Les communes, rangs, scores, couvertures et pistes sont **identiques** dans les 9 projets. Les vraies périurbaines affichées (Marnes-la-Coquette, Marolles-en-Brie, Châteauneuf-les-Martigues, Gignac-la-Nerthe, La Mulatière, Thurins, Messimy) gardent leur identité.

## Non-régression du classement

- Rangs, communes, scores de compatibilité, état de couverture et pistes : identiques sur les 9 projets rejoués. Deux d'entre eux sont figés dans le test, sur les valeurs de `main`.
- L'oracle FUT-147 (`fut147-non-regression.test.ts`, projets et trios capturés sur `main`) passe sans modification : aucune de ses communes n'est un arrondissement concerné.
- Suite complète, seule, `--test-concurrency=1` : **base `main` 4 309 / 4 309**, **tête 4 316 / 4 316** (+7 tests FUT-140), 0 échec.
- Les nouveaux tests ont été rejoués sur le code de `main` : les 4 tests du défaut échouent, les 3 tests de préservation passent. Ils mesurent donc bien le défaut.

## Tests ajoutés (`src/lib/fut140-identites-plm.test.ts`)

1. Aucun des 45 arrondissements ne propose le candidat. Listes exactes pour Paris 1er, Paris 2e, Marseille 2e et 16e, Lyon 1er. Données d'index inchangées (population, UU).
2. Sur tout l'index, l'exclusion ne retire le candidat qu'à ces 4 codes. Les 1 784 porteurs satisfont tous la règle.
3. Vraies périurbaines de Paris, Lyon et Marseille : Sceaux, Écully, Allauch, Les Pennes-Mirabeau, avec le candidat en tête.
4. Petite commune hors unité urbaine (Allanche, 794 habitants), et population absente (Beaumont-en-Verdunois).
5. Trois trios nommés passés par `seedComparaison` → `assignIdentite` : identités finales exactes et distinctes.
6. « Où vivre », Paris : la carte « Paris » ne dit plus « aux portes ». Rang, score et couverture figés sur `main`.
7. « Où vivre », petite couronne et littoral marseillais : classement figé sur `main`, et les vraies périurbaines gardent la phrase.

## Validation technique

- `tsc --noEmit` : 0 erreur.
- ESLint sur les fichiers modifiés : 0 erreur. Un avertissement préexistant (`tailleVilleFrom` importé sans usage, déjà sur `main`).
- ESLint global : échoue sur `main` comme sur la branche, pour une raison de configuration préexistante (plugin `react` non défini). Rien d'introduit par FUT-140.
- Build Next local (`npm run build`, variables fictives) : réussi, code 0.
- Aucune Preview, aucun déploiement, aucun accès Supabase, index non régénéré.

**Recette navigateur.** Elle n'est pas nécessaire : les quatre surfaces affichent ou transmettent `r.identite` tel quel. Il s'agit d'« Où vivre » (`OuVivreClient.tsx`), du comparateur (`comparateur/page.tsx`), du pack de décision (`PackUnlockedView.tsx`) et de la synthèse du mode choix (`synthesize-choix/route.ts`). Ce champ vient de `matchProjects`, `seedComparaison` ou `rejouerPack`, et les tests l'assertent à cette sortie.

## Autres constats, non corrigés (hors périmètre)

1. **« Pour une ville étudiante à taille humaine » pour Paris, Lyon, Marseille et les grandes villes.** C'est désormais l'identité de la carte « Paris » dans « Où vivre ». Sur `main`, elle était déjà affichée pour Paris 2e, Lyon 1er et d'autres arrondissements. Elle est candidate pour les 45 arrondissements, en tête pour 29. Elle l'est aussi pour 30 communes non PLM de plus de 100 000 habitants : Toulouse, Nice, Nantes, Montpellier, Strasbourg, Bordeaux, Lille, Rennes… « À taille humaine » contredit la taille de ces villes. Mais la règle (FUT-141) ne lit aucune population : ce n'est **pas** le problème de grain PLM, c'est une formulation générale. Cela mérite un ticket dédié (texte de l'identité, ou condition de taille), à arbitrer avec FUT-141.
2. **« Grande ville » lit la population de l'arrondissement.** `grandeVille = c.population >= 50000` : Paris 1er–4e et 6e–8e, Lyon 1er, 2e, 4e et 5e, Marseille 1er, 2e, 5e–7e et 16e n'ont donc pas les candidats « Pour la vie d'une grande ville et tous ses services » ni « …au bord de l'eau avec les services d'une vraie ville ». C'est le même problème de grain, mais une **absence** et non une contradiction : aucune phrase fausse n'est affichée. Non corrigé pour ne pas élargir le chantier. À noter : même corrigé, ce candidat viendrait après l'identité étudiante, et ne changerait pas la carte « Paris » seule.
3. Les autres libellés contrôlés (« petite ville », « commune à taille humaine », « cadre rural préservé ») lisent la taille de l'unité urbaine. Pour un arrondissement, cette taille est celle de la métropole : **aucun arrondissement ne les reçoit**. Rien à corriger.
