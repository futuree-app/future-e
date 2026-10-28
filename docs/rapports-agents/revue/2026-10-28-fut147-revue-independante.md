# Revue indépendante PR #104 (FUT-147)

Relecteur indépendant, 28/10/2026. SHA relu : 39f11013.

## Constats

### P2-1. Dossier comparatif : la cellule d'une commune `recense` sans feu de 10 ha tait les campagnes déclarées inconnues, et les remplace par la prudence d'avant 2020 (BLOQUANT)

Énoncé. `celluleIncendies` (src/lib/incendies-observes.ts:174-180) ne traite `campagnesNonRenseignees` que dans l'état `incomplet`. Une commune qui a au moins un départ recensé (état `recense`), aucun de 10 ha, dans un département que la source déclare non renseigné, tombe dans la branche finale : « Pas de feu de 10 ha ou plus enregistré au départ de la commune », qualifier « base moins complète avant 2020 » (ou `null` en aire méditerranéenne). Les années inconnues disparaissent, et le seul avertissement affiché désigne une AUTRE limite (avant 2020) que celle qui s'applique (2024-2025, ou 2025). C'est exactement la confusion entre « campagnes déclarées inconnues » et « limite générale de couverture » que l'arbitrage interdit.

Preuve (script pur sur la vraie table, `npx tsx scratchpad/textes.mts`) :
- 94044 Gentilly : état `recense`, `campagnesNonRenseignees` [2024, 2025], plus grand feu 2 ha en 2012. Cellule : `{palier: "Pas de feu de 10 ha ou plus enregistré au départ de la commune", qualifier: "base moins complète avant 2020"}`.
- 97206 Bellefontaine (Martinique) : `recense`, [2025], plus grand feu 1,5 ha. Même cellule.
- Contraste : 94028 Créteil (aucune fiche, même département, mêmes années) : `{palier: "Base incomplète pour ce département"}`. Deux communes voisines aux mêmes lacunes déclarées reçoivent deux statuts opposés ; celle qui a UN petit feu recensé paraît « mieux renseignée » et plus sûre.
- Communes réelles concernées : 1 dans le 94 (94044), 28 en Martinique (972, toutes `recense` sans feu de 10 ha ; ex. 97202, 97203, 97205, 97206). Aucune commune du 75/92/93 (aucune fiche).

Juxtaposition. La ligne n'apparaît que si une commune du trio a un feu de 10 ha ou plus (`ligneIncendiesUtile`). Un trio { commune des Maures avec feu de 6 832 ha ; Gentilly } affiche côte à côte « Un feu de 6 832 ha au total en 2021 » et « Pas de feu de 10 ha ou plus enregistré… · base moins complète avant 2020 » : le contraste se lit comme un avantage de sécurité, sans que la cellule dise que 2024-2025 ne sont pas renseignées pour le Val-de-Marne. Probabilité réelle faible (trio Val-de-Marne / Martinique avec une commune à grand feu), mais c'est le produit payant et la règle est explicite.

Correction proposée : dans `celluleIncendies`, avant la branche finale, si `m.etat === "recense" && m.campagnesNonRenseignees.length > 0`, porter les années dans le qualifier (ex. « nombre d'incendies inconnu en 2024 et 2025 pour ce département »), en plus de la prudence 2020 ; idem dans la cellule `incomplet` (voir P2-2). Ajouter un test sur 94044 et 97206.

### P2-2. Dossier comparatif : la limite « un feu parti d'une voisine n'est pas compté » disparaît des cellules sans feu notable, sur le cas de référence lui-même (BLOQUANT)

Énoncé. Dans le Territoire, `LIMITE_SURFACE` et « Un feu parti d'une commune voisine n'est pas compté ici » accompagnent tout état (incendies-observes.ts:85, 88, 125-126), « visible, jamais repliée ». Dans le Dossier, la cellule sans feu notable ne porte que « Pas de feu de 10 ha ou plus enregistré au départ de la commune », avec qualifier `null` en aire méditerranéenne (incendies-observes.ts:175-179), et l'aide (`AIDE_INCENDIES_OBSERVES`, l.153-154) ne dit pas non plus que les feux venus d'une voisine sont absents.

Contre-exemple déterministe, tiré de la recette de l'auteur (`docs/audits/2026-10-28-fut147/recette-textes.json`, `pack.pack-maures`) et confirmé par `celluleIncendies(memoireIncendiesDeLaCommune(table, "83063"))` :
- Gonfaron : « Un feu de 6 832 ha au total en 2021 · parti de la commune »
- La Garde-Freinet : « Pas de feu de 10 ha ou plus enregistré au départ de la commune » (qualifier `null`)
- Vidauban : « Un feu de 301 ha au total en 2024 · parti de la commune »
Or l'en-tête du module (src/lib/data/bdiff-incendies.ts:11-12) rappelle que le feu de Gonfaron de 2021 a AUSSI parcouru La Garde-Freinet. La ligne fait de La Garde-Freinet la seule commune « sans feu » d'un trio où elle a brûlé : une absence d'enregistrement lue comme une sécurité, par juxtaposition, sans aucun gagnant formel. C'est la situation que l'arbitrage interdit, et elle se produit précisément dans la seule configuration où la ligne existe (au moins une voisine porte un grand feu).

Correction proposée : qualifier systématique des cellules sans feu notable (`recense` ou `aucun`), par exemple « un feu parti d'une commune voisine n'est pas compté », avant ou avec la prudence 2020 ; et ajouter cette limite à l'aide de la ligne. Test : trio 83067/83063/83148, la cellule 83063 contient « voisine ».

### P2-3. Territoire : la phrase visible d'une commune aux seuls petits feux couvre « 2006 à 2025 » alors que 2025 est déclarée inconnue (À CORRIGER)

Énoncé. Branche `recense` sans feu d'un hectare (incendies-observes.ts:87) : « Les départs de feu de forêt enregistrés sur la commune dans la base nationale, de 2006 à 2025, ont tous parcouru moins d'un hectare. » Les années non renseignées ne sont dites qu'en « En savoir plus » (l.96), replié. Même chose pour la branche avec feu cité (Gentilly, Bellefontaine) : aucune phrase visible ne dit que 2024-2025 (ou 2025) manquent.
Preuve : 97202 Basse-Pointe (`recense`, 2 fiches < 1 ha, `campagnesNonRenseignees` [2025]) produit la phrase ci-dessus, la mention 2025 étant seulement dans `details`. 23 communes de Martinique sont dans ce cas.
Correction : quand `nonRenseignees.length > 0`, pousser la phrase « La base signale un nombre d'incendies inconnu pour ce département en … » dans `phrases` (visible) plutôt que dans `details`.

### P2-4. Remarques sur les cellules (REMARQUE)
- `incomplet` : « Base incomplète pour ce département » ne nomme pas les années, et ne distingue pas Paris/92/93 (aucune fiche sur vingt ans, `departementSansFiche`) du Val-de-Marne (2024-2025 seulement). Proposer « Non renseigné par la base » pour `departementSansFiche`, et « Nombre d'incendies inconnu en 2024 et 2025 » sinon.
- Arrondissements de Lyon et Marseille sans feu notable : la cellule dit « au départ de la commune » alors que l'échelle est la ville (`echelle.type === "ville"`). Ex. 69383 : « Pas de feu de 10 ha ou plus enregistré au départ de la commune · base moins complète avant 2020 ». Dire « au départ de Lyon (toute la ville) ».
- `qualifier` est bien rendu (src/app/(public)/comparateur/ThemeMatrix.tsx:149-150, et dans la fusion l.167-192) : pas de perte au rendu. Attention toutefois : la fusion des cellules identiques (l.171) ne s'applique pas ici en pratique puisqu'au moins une cellule porte un feu.
- Comparateur (`ligneCarteIncendies`) : silence pour toute commune sans feu de 10 ha, conformément à l'arbitrage ; les années inconnues ne sont jamais dites sur la carte, mais la carte ne dit alors rien du tout, ce qui est cohérent.
- Typographie des détails : « 1 ha parcourus au total » (97206), pluriel fautif sous 2 ha (incendies-observes.ts:94).

## P3. Contre-épreuve indépendante

### P3a-1. Reconstruction intégrale de la table depuis les CSV bruts : identique (CONFORME)
Script Python indépendant (`csv` standard, pas le code de l'auteur ; scratchpad `verif.py`, lancé en `python3 -I`) : lecture des 20 exports `data/source/bdiff/bdiff-AAAA.csv`, COG 2025 `cog/v_commune_2025.csv` + `v_mvt_commune_2025.csv`, même règle de mouvements, comparaison commune par commune de `nombre`, `nombre1ha`, des trois plus grands feux (année, numéro, hectares) et de `ancienneCommune`.
Sortie : `fiches 52810 doublons 1 nonratt {('83999','Commune inconnue'): 12}` puis `communes 9510 table 9510 ecarts 0 en trop dans table 0`. Le doublon est la fiche 2017-11816, deux lignes strictement identiques (retrait légitime). Les 12 fiches non rattachées sont toutes « 83999 Commune inconnue », jamais attribuées.
Échantillon : fusion 2008-281 Suc-et-Sentenac (09302) → Val-de-Sos 09334, 120 ha, `ancienneCommune` présente ; Corse 2006-7067 Olcani 2B184, 145 ha ; outre-mer 2006-4693 Saint-Denis 97411, 60 ha. Aucun code « 20xxx » dans les exports. Deux fiches suivent une chaîne de deux mouvements (12173 Noailhac → 12076 → 12218 ; 49154 Grézillé → 49149 → 49261 Gennes-Val-de-Loire) et aboutissent correctement.
Limite de cette contre-épreuve : elle réimplémente la MÊME règle ; elle prouve l'exécution, pas la règle. Le comportement sur les rétablissements (21) est une convention : je compte 24 communes rétablies depuis 2006 dans le COG, 10 fiches sous le code de la commune qui les portait et 2 sous le code rétabli, chiffres qui ne recoupent pas immédiatement les « 25 fiches dans 2 communes » de l'en-tête (bdiff-incendies.ts:176) ; définitions sans doute différentes, à préciser (REMARQUE).

### P3a-2. Changement de chef-lieu (MOD 50) traité comme une fusion : « l'ancienne commune de Conques-en-Rouergue, aujourd'hui rattachée à Conques-en-Rouergue » (À CORRIGER)
Énoncé. `construireTableIncendies` pose `ancienneCommune` dès que `actuel !== code` (bdiff-incendies.ts:269), donc aussi pour un changement de code (41, 50) où la commune est la même. Sur la vraie table : 129 feux listés portent `ancienneCommune`, dont 3 via MOD 50, tous à 12218 Conques-en-Rouergue (fiches enregistrées sous l'ancien code 12076 avec le nom « Conques-en-Rouergue »).
Contre-exemple (fonctions pures, table réelle, 12218) :
- Territoire et carte du comparateur : « Un incendie dont le départ a été enregistré sur l'ancienne commune de Conques-en-Rouergue, aujourd'hui rattachée à Conques-en-Rouergue a parcouru 12 hectares au total en 2018. »
- Cellule Dossier : « Un feu de 12 ha au total en 2018 · parti de l'ancienne commune de Conques-en-Rouergue ».
Le feu fait 12 ha : la ligne de carte et celle du Dossier sont déclenchées. Faux (ce n'est pas une ancienne commune) et absurde à la lecture.
Correction : ne poser `ancienneCommune` que si le nom de la fiche diffère du libellé COG actuel (ou seulement pour les mouvements de fusion 31-34) ; ajouter un test sur 12218.

### P3a-3. Virgule manquante après l'incise de l'ancienne commune (REMARQUE)
`lieuDuDepart` (incendies-observes.ts:44) produit « …, aujourd'hui rattachée à X » suivi directement de « a parcouru » : « sur l'ancienne commune de Suc-et-Sentenac, aujourd'hui rattachée à Val-de-Sos a parcouru 120 hectares ». Il manque la virgule fermante, sur les 126 feux de fusion listés, en Territoire et sur la carte. Correction : terminer l'incise par une virgule.

### P3b. Absence d'effet sur les scores, le classement et le cache IA (CONFORME, une remarque)
- Fichiers de code touchés (`git diff 4d75603f...HEAD --name-only`, hors docs) : aucune route `src/app/api/**`, aucun prompt, ni `loadTerritoireSnapshot`, ni la synthèse Territoire. Seuls `comparateur-vie.ts`, `OuVivreClient.tsx`, `rapport/quartier/page.tsx`, `QuartierClimatData.tsx`, `MetricDrawer.tsx`, `next.config.ts` et les nouveaux modules.
- `matchProjects` : la table est chargée (comparateur-vie.ts:3265) mais n'est lue qu'au moment de poser `built.incendiesObserves` (l.3453-3456), champ qu'aucun tri, score ni palier ne lit (grep : seuls lecteurs `OuVivreClient.tsx:1270-1271`).
- Synthèse du comparateur (`OuVivreClient.tsx:558-575`) et AskFuture (`lecture-ask.ts:79-93`) : listes blanches de champs, `incendiesObserves` n'y figure pas. La route `match` retire `comparaisonComplete` de la réponse (match/route.ts:35).
- Dossier : la ligne est insérée APRÈS le calcul de `resume`, `arbitrage`, `divergence`, `spatialContext` (comparateur-vie.ts:1944-1961), avec `avantage: neutre` ; `themeLeaderInsee` et `page.tsx:142` ne retiennent que les lignes `avantage`. `truncateComparaison` (l.3749-3757) s'applique après.
- Territoire : la mémoire est lue à côté du snapshot (`Promise.all`, rapport/quartier/page.tsx:86-89) et passée seulement à `QuartierAside` → `buildFactors` (seul appelant, QuartierClimatData.tsx:1220) ; elle n'entre ni dans le snapshot ni dans `synthesisCacheKey`. `/api/synthesize-quartier` n'a pas le fichier dans sa trace, ce qui est cohérent.
- REMARQUE (frontière gratuit/payant) : « risques » est le DEUXIÈME thème de `THEME_ORDER` (comparateur-vie.ts:1492-1496) et `truncateComparaison` garde `themes.slice(0, 2)` : la ligne « Incendies observés » apparaît donc aussi dans l'aperçu gratuit (`/api/comparateur-vie/apercu`, `/comparateur`). Pas un défaut de score, mais une décision de produit (et de licence, cf. mentions légales BDIFF sur l'usage commercial) que le porteur doit voir.

### P3c. Textes régénérés (CONFORME sur les interdits, avec P2-2, P2-3, P3a-2, P3a-3)
Textes régénérés par les fonctions pures sur la table réelle pour 29016 Brasparts, 83067 Gonfaron, 83063 La Garde-Freinet, 69383 Lyon, 75111 Paris, 13208 Marseille, 94028 Créteil, plus 94044 Gentilly, 97206 Bellefontaine, 97202 Basse-Pointe, 12218 Conques-en-Rouergue. Identiques à `recette-textes.json` pour les communes communes aux deux. Aucune occurrence de `PHRASES_INTERDITES`. Aucune tournure « a brûlé dans la commune » ; la surface est toujours « au total ». Marseille dit « l'ensemble de Marseille : la base ne situe pas les feux par arrondissement » ; Paris « ne contient aucune fiche pour ce département » ; Lyon : résultat vide avec « ne permet donc pas de conclure ». Aucune phrase n'oppose le passé à la projection DRIAS (l'aide dit seulement que les faits « n'entrent pas » dans la ligne météo).
REMARQUE sur la garde `PHRASES_INTERDITES` (incendies-observes.ts:28) : elle ne couvre ni « a brûlé dans », « hectares brûlés », « brûlé sur la commune », ni « protégé », « préservé », « sûr », « sécurité », « rassur », « jamais brûlé ». Les textes actuels n'en contiennent pas ; la garde protégerait mal une réécriture future. Élargir à `/brûl[ée]s?\b|protég|préserv|\bsûre?s?\b|sécuri|rassur/`.
REMARQUE : en aire méditerranéenne, l'état `aucun` (incendies-observes.ts:124-125) ne dit pas « ce qui ne permet pas de conclure », contrairement aux autres états vides. Le texte reste exact, mais l'asymétrie laisse un résultat vide un peu plus affirmatif là où le risque météo est le plus fort.

### P3d. Indisponibilité et trace des fichiers (CONFORME, deux remarques)
- Appelants (grep `chargerTableIncendies|getMemoireIncendies`) : `comparateur-vie.ts` (`matchProjects` et `seedComparaison`, `rejouerPack` passe par `matchProjects`), `rapport/quartier/page.tsx`, `dev/fut147/page.tsx` (404 en production, l.29). Routes de production qui atteignent ces fonctions : `/api/comparateur-vie/match`, `/api/comparateur-vie/apercu`, `/comparateur`, `/comparateur/pack-decision`, `/rapport/quartier` : toutes ont `./data/bdiff-incendies.json` dans `outputFileTracingIncludes` (next.config.ts:15-31). `create-payment-intent` et `decision-packs.ts` ne le citent qu'en commentaire.
- Fichier absent ou JSON illisible : `.catch(() => null)` (bdiff-incendies-commune.ts:15-17) → `indisponible` ; comparateur et Dossier se taisent (pas de ligne), Territoire dit « n'ont pas pu être lus pour le moment ». Jamais une table vide, donc jamais un faux « aucun ». Conforme.
- REMARQUE : l'échec est mémorisé pour toute la vie du process (`table ??=` garde la promesse résolue à `null`) ; une lecture ratée une fois rend `indisponible` jusqu'au prochain démarrage à froid. Remettre `table = null` dans le `catch`.
- REMARQUE : un JSON lisible mais de forme inattendue (sans `meta.departementsSansFiche`) ferait lever `memoireIncendiesDeLaCommune` (bdiff-incendies.ts:357) ; dans `rapport/quartier` le `Promise.all` rejetterait et la page Territoire tomberait. Valider la forme minimale au chargement et rendre `null` sinon.

## Verdict

NON, pas en l'état. Deux bloquants, tous deux dans `celluleIncendies` (src/lib/incendies-observes.ts:162-181), corrigeables en quelques lignes avec deux tests :
1. P2-1 : les campagnes déclarées inconnues sont tues dans la cellule d'une commune `recense` sans feu de 10 ha (94044, 28 communes de Martinique), et remplacées par la prudence d'avant 2020.
2. P2-2 : les cellules sans feu notable perdent la limite « un feu parti d'une voisine n'est pas compté », ce qui fait de La Garde-Freinet, parcourue par le feu de Gonfaron, la commune « sans feu » du trio de référence.
À corriger avant ou avec la fusion : P2-3 (années inconnues repliées dans le Territoire), P3a-2 (Conques-en-Rouergue, « ancienne commune » sur un simple changement de chef-lieu, ligne déclenchée à 12 ha).
Le reste est conforme : reconstruction indépendante de la table sans aucun écart (9 510 communes, 52 810 fiches, 1 doublon, 12 fiches « 83999 » non rattachées), aucun effet sur scores, classement, résumé, divergence, synthèses ou cache, trace complète des cinq routes, indisponibilité qui ne dit jamais « aucun ».
