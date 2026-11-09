# FUT-176 · Statuts urbains et interprétations Insee

Branche `bonjourfuturee/fut-176-statuts-urbains-insee`, base `origin/main` 51a493d0. 09/11/2026.

## 1. Source officielle et définitions

Base des unités urbaines 2020 de l'Insee, **publiée dans la géographie de l'index (COG au 01/01/2025)** :
`https://www.insee.fr/fr/statistiques/fichier/4802589/UU2020_au_01-01-2025.zip` (archive sha256 `bc43d62e67c5…be44840`,
xlsx `f2e14a9a…f8439772`, mise en ligne le 21/03/2025). L'ancien import lisait la version « géographie au 01/01/2023 ».

Statut de la commune (calculé par l'Insee sur la population 2017, onglet Documentation du fichier) :

| Statut | Définition Insee | Communes (géo 2025) |
|---|---|---|
| H hors unité urbaine | pas de zone de bâti continu (coupure ≤ 200 m) d'au moins 2 000 habitants | 27 279 |
| I ville isolée | unité urbaine d'**une seule** commune | 1 222 |
| C ville-centre | dans une agglomération de plusieurs communes : seule si > 50 % de la population, sinon toutes celles > 50 % de la plus peuplée | 1 496 (+ 45 arrondissements PLM) |
| B banlieue | les autres communes d'une agglomération de plusieurs communes | 4 746 |

« Hors unité urbaine » et « ville isolée » sont deux choses opposées : la seconde EST une agglomération.

## 2. Ce qui était faux

1. **Statut perdu à l'import** (`populate-unite-urbaine.py`) : seul le code `uu` survivait (H → null).
2. **Absence = hors UU** : une commune absente du fichier recevait `uu = null`, puis `hors_uu = true`. Croisement index / fichier 2023 : 11 communes nouvelles 2024-2025 dans ce cas, dont 4 à tort :
   - **Orée d'Anjou** (49126) : ville isolée (UU 49305), affichée « Commune isolée, hors agglomération » ;
   - **Porte des Pierres Dorées** (69114) : banlieue de Lyon ;
   - **L'Oie** (85165, B) et **Sainte-Florence** (85212, C) : nouvelle UU 85139 après le rétablissement d'Essarts en Bocage.
   Les 7 autres (Conques-en-Rouergue, Aurseulles, Celles, Chalinargues, Chavagnac, Sainte-Anastasie, Les Hauts-Talican) sont bien H.
3. **Rendu** : rôle `isolee` = « pas de code » ; rôle `pole` = « commune la plus peuplée de l'UU » (ville isolée comprise) ; « Ville » pour toute commune en UU ; phrases de rôle prêté.

Contrôle de couverture nationale après correction : **34 743 communes lues dans le fichier + 45 arrondissements = 34 788 entrées de l'index, 0 statut inconnu, 0 divergence de code** (test `couverture nationale`).

## 3. Avant / après des formulations

Carte d'identité Territoire (index réel, typologie « Intérieur » fixée pour comparer) :

| Commune | Statut | Avant | Après |
|---|---|---|---|
| Corte (2B096, 7 654 hab.) | I | Principal pôle urbain local · « Corte concentre les fonctions urbaines de son bassin de vie » | Forme à elle seule une agglomération · « Ville de l'intérieur, Corte forme à elle seule une agglomération. » |
| Bony (02100, 139 hab.) | H | Commune isolée, hors agglomération · « Bony structure la vie locale d'un territoire plus rural » | Hors agglomération : aucun ensemble bâti continu de 2 000 habitants · « Commune de l'intérieur, Bony se situe hors de toute agglomération. » |
| Mont-Dauphin (05082, 171 hab.) | B | Dans l'agglomération de Guillestre (3 258 habitants) · « **Ville** de l'intérieur, Mont-Dauphin s'inscrit… » | Commune de banlieue de l'agglomération de Guillestre (3 258 habitants) · « **Commune** de l'intérieur, Mont-Dauphin s'inscrit dans l'agglomération de Guillestre. » |
| Orée d'Anjou (49126, 17 162 hab.) | I | Commune isolée, hors agglomération · « structure la vie locale d'un territoire plus rural » | Forme à elle seule une agglomération · « Ville de l'intérieur, Orée d'Anjou forme à elle seule une agglomération. » |
| Chartres (28085, 38 447 hab.) | C | Principal pôle d'une agglomération de 88 891 habitants · « concentre les fonctions urbaines de son bassin de vie » | Ville-centre de l'agglomération de Chartres (88 891 habitants) · « Ville de l'intérieur, Chartres est au centre de son agglomération. » |
| Levallois-Perret (92044, 68 009 hab.) | B | Dans l'agglomération de Paris (10 893 507 habitants) · « **Ville**… s'inscrit dans l'agglomération de Paris » | Commune de banlieue de l'agglomération de Paris (10 893 507 habitants) · « **Commune** dense…, Levallois-Perret s'inscrit dans l'agglomération de Paris. » |
| Paris 1er (75101) | C (Paris) | Dans l'agglomération de Paris · « Ville… s'inscrit dans l'agglomération de Paris » | Arrondissement de Paris, ville-centre de son agglomération (…) · « Arrondissement de l'intérieur, Paris 1er Arrondissement appartient à Paris, ville-centre de son agglomération. » |
| Statut inconnu | — | Commune isolée, hors agglomération | aucune ligne de rôle · « Orée d'Anjou, commune de l'intérieur. » |

Règle du mot « Ville » : ville-centre ou ville isolée **et** au moins 2 000 habitants dans la commune (`peutDireVille`).

Synthèse Territoire (rôle transmis au modèle et patron déterministe) :

| Avant | Après |
|---|---|
| « commune isolée, hors agglomération » | « hors de toute agglomération (aucun ensemble bâti continu de 2 000 habitants) », sans nom d'agglomération |
| « principal pôle de son agglomération » | « au centre de son agglomération » (C) · « seule commune de son agglomération » (I) |
| « commune d'une agglomération » | « commune de banlieue de son agglomération » (B) |
| — | statut inconnu : aucun rôle transmis |

+ consigne : ne rien déduire du statut (services, commerces, animation, isolement, « pôle »), ne jamais écrire « isolée » ; + contrôle `interdit:statut-urbain-surinterprete` (« commune isolée », « principal pôle », « concentre les services », « structure la vie locale ») ; contrat **@5** (cache des anciennes synthèses invalidé : l'audit Châtelaillon en montre qui disent « n'est pas une commune isolée », « rôle d'appui », « bassin de vie dynamique »).

Comparateur et accueil :

| Où | Avant | Après |
|---|---|---|
| Identité « Pour une petite ville qui reste vraiment vivante. » | toute commune d'une UU de 2 000 à 100 000 hab. (Mont-Dauphin, 171 hab.) | exige aussi 2 000 habitants dans la commune |
| Identité « aux portes d'une grande ville, sans en habiter le centre » | 4 villes-centres Insee (Béthune, Bruay-la-Buissière, Nogent-sur-Oise, Audincourt) | réservée aux communes non centres |
| Dimension « Isolement » : paliers | Bassin de vie étendu / Bassin de proximité / Bassin de vie restreint | Grande agglomération / Agglomération moyenne / Petite agglomération ou commune |
| Aide | « La taille du bassin de vie qui dessert le territoire. » | « Le nombre d'habitants de l'agglomération, ou de la commune quand elle est hors agglomération. Il ne mesure pas à lui seul l'accès aux services ni aux transports. » |
| Raison favorable | au cœur d'un vaste bassin de vie / bassin de vie bien pourvu / bassin de vie de proximité | dans une grande agglomération / dans une agglomération de taille moyenne / dans une petite agglomération · commune hors agglomération |
| Compromis | bassin de vie réduit, plus isolé · bassin de proximité, plutôt qu'étendu | commune ou agglomération plus petite que souhaité · agglomération moyenne, plutôt que grande |
| Libellé du critère | Présence d'un bassin de vie offrant services et activités du quotidien. | Taille de l'agglomération (unité urbaine), ou de la commune quand elle est hors agglomération. Elle ne mesure pas à elle seule l'accès aux services. |
| Accueil, pastille taille | « Environ 10 893 507 habitants dans l'agglomération de Levallois-Perret. » | « … dans l'agglomération dont fait partie Levallois-Perret. » |

Aucun score, aucun classement, aucune commune des cinq projets et quatre trios de référence FUT-147 ne change (seuls les libellés ci-dessus).

## 4. Effets de données (assumés, mesurés)

- `uu` : 4 communes corrigées ; `uu_pop`/`uu_count` : 133 communes (UU de Lyon +4 185 hab., UU 85139 créée).
- `etudes_dyn` (FUT-135, rejoué à l'identique sur l'ancien index avant application) : 22 communes — UU de Mulhouse 68 → 67 (même palier), Chantonnay 31 → 30, Porte des Pierres Dorées null → 92 (valeur de Lyon).
- Millésimes de population (FUT-109) : UU 00760, 49305, 85139 réunissent désormais 2023 (`rafraichir-unites-urbaines.mjs`, contre-épreuve identique sur l'ancien index).
- Porte des Pierres Dorées est lue à la taille de l'agglomération de Lyon (classée « métropole » dans les critères de taille), comme Levallois-Perret à celle de Paris : c'est la convention existante appliquée au bon statut.

### Équipements (BPE) : recalcul reporté (décision du 09/11/2026, contre-revue)

Le rayon d'accès BPE (`scripts/populate-bpe.py`, `radius_for(taille_ville)`) dépend de la taille d'agglomération : ≥ 500 000 hab. → 5 km, 100 000-500 000 → 10 km, 30 000-100 000 → 15 km, sinon 25 km. Comparaison de l'index de `main` et de celui de la branche, commune par commune : **une seule commune change de palier de rayon**.

| Commune | Taille avant → après | Rayon calculé (index) | Rayon selon la nouvelle taille | Valeurs actuelles |
|---|---|---|---|---|
| Porte des Pierres Dorées (69114, banlieue de Lyon) | 4 185 (commune) → 1 703 131 (UU de Lyon) | 25 km | 5 km | écoles 94, culture 97, accès études 56 (`etudesSup.radiusKm` = 25) |

L'Oie (85165) et Sainte-Florence (85212) rejoignent une unité urbaine de 2 609 habitants : le palier (25 km) ne change pas. Orée d'Anjou (ville isolée) garde sa propre population. Le diagnostic initial en annonçait trois : c'est une.

Limites des valeurs actuelles : pour Porte des Pierres Dorées, les scores écoles, culture et accès aux études sont mesurés dans un rayon de 25 km, celui des communes rurales, et non dans les 5 km appliqués aux communes de l'agglomération lyonnaise. Ils sont donc plus généreux que ceux de ses voisines de banlieue. Le rayon affiché (`radiusKm`) est bien celui du calcul : aucune phrase n'annonce un rayon qui n'a pas servi.

Dépendance : le recalcul passe par `populate-bpe.py` sur `data/bpe25.parquet`, qui diffère du fichier Insee republié le 05/10/2026 (cf. mémoire BPE25). Rejouer le script pour une commune change aussi les percentiles nationaux (rang de ±1 pour les autres communes). À faire avec la prochaine actualisation des équipements, sans toucher les 35 000 communes ici.

## 5. Tests

`src/lib/fut176-statuts-urbains.test.ts` (19 tests) : statuts et incohérences, très petites communes, données manquantes, communes nouvelles et arrondissements, couverture nationale contre le fichier Insee (sautée sans le xlsx), surinterprétation sur tous les rôles × 5 tailles, contrôle de synthèse, compatibilité des snapshots et projections d'avant (`isolee` → inconnu, `pole`/`agglo` → « dans l'agglomération »), comparateur, accueil.
Tests mis à jour avec leur raison : FUT-147 (libellés, clé de cache, lignes admises), FUT-140 (1 781 périurbaines), FUT-141 (décalage Mulhouse, 5 556 mesurées), FUT-109 (Lyon [2021, 2023], L'Oie), PLM (rôle ville-centre).

## 6. Reprise après contre-revue (09/11/2026, SHA audité a62bc494)

| Point | Avant (a62bc494) | Après |
|---|---|---|
| Synthèse d'un arrondissement (Paris 20e, Lyon 9e, Marseille 16e) | `projectForSynthesis` transmettait « au centre de son agglomération » sans `arrondissementDe` : le patron disait « Paris 20e Arrondissement, …, au centre de son agglomération, est une commune dense » | rôle `ROLE_TEXT_ARRONDISSEMENT` + `commune: "Paris"` ; patron : « …, arrondissement de Paris (ville-centre de son agglomération), est un arrondissement dense » ; population et densité restent celles de l'arrondissement |
| Consigne et contrôle | — | consigne : l'arrondissement n'est jamais présenté comme ville-centre ; contrôle `interdit:arrondissement-ville-centre` (« l'arrondissement est la ville-centre », « … est au centre de son agglomération »), « Paris est au centre de son agglomération » admis |
| « Pour une petite ville qui reste vraiment vivante. » | population ≥ 2 000 seulement | `peutDireVille` (ville-centre ou ville isolée, et ≥ 2 000 hab.), arrondissements exclus. Lucé (banlieue de Chartres, 15 602 hab.) ne la reçoit plus. Ordre de grandeur : ~294 communes de banlieue et ~216 hors unité urbaine de plus de 2 000 hab. perdent ce candidat (vie locale ≥ 60) |
| « aux portes d'une grande ville, sans en habiter le centre » | tout statut sauf C, donc aussi un statut inconnu | statut Insee B exigé ; un statut inconnu ne prouve pas l'absence de centre (aucune commune de l'index n'est concernée aujourd'hui) |
| Raison « Isolement », sans code ni statut | « commune hors agglomération » | « commune de moins (plus) de 25 000 habitants » ; « hors agglomération » exige le statut H. Compromis : « commune ou agglomération plus petite que souhaité » |
| `labelForCategory("moyenne", "urban_unit")` (FUT-8) | « une ville moyenne » (« Lucé appartient à une ville moyenne ») | « une agglomération moyenne » ; source commune inchangée (« une ville moyenne »). Ni score ni seuil touchés |
| Accueil, pastille taille (même convention) | « Moins de 25 000 habitants : c'est une petite ville » pour une population d'agglomération | en source agglomération : « … habitants dans l'agglomération : une petite agglomération / une agglomération moyenne » ; source commune inchangée |
| BPE | trois communes annoncées | une seule change réellement de palier de rayon (Porte des Pierres Dorées), cf. § 4 ; recalcul reporté |

Scores, classements et ordres : aucun changement. Les modifications sont des textes (identité, raisons, libellés, projection). La garde FUT-147 (5 projets, 4 trios) passe sans changer ses références ; la liste des lignes admises du contrat (`LIGNES_CONTRAT_FUT176`) est régénérée depuis le diff, sans ligne sur les feux.


## 7. Convergence avec FUT-175 (PR #140)

État vérifié le 09/11/2026 : `main` = 51a493d0 ; PR #140 = a9490c31 ; PR #139 = cette branche. Les deux PR partent de 51a493d0 et touchent `facts.ts`, `synthesis-contract.ts`, `synthesis-deterministe.ts`, `territory-identity.ts` et `fut147-non-regression.test.ts`. Git fusionne seul `facts.ts`, le patron déterministe et l'identité. Il reste deux conflits : la version du contrat et la garde FUT-147.

Les deux branches portent `territoire-synthese@5`, pour deux contrats différents. Ni l'un ni l'autre n'est sorti. Le contrat réunissant les deux doit prendre un numéro neuf.

**Ordre proposé : #140 (FUT-175) d'abord, puis #139 (FUT-176) remise à jour sur `main`.** #140 a figé ses lignes admises dans `__fixtures__/fut175-lignes-admises.json`. Il est plus simple que FUT-176, qui connaît ses propres lignes, s'adapte à ce mécanisme que l'inverse. L'essai a été fait localement : branche `essai/fut175-puis-fut176` (c00d9197, non poussée), patch dans `~/Documents/futuree-fut176/convergence/resolution-cote-fut176.patch`.

Résolution, une fois #140 fusionnée :

1. `git merge origin/main` dans la branche FUT-176.
2. `synthesis-contract.ts` : une seule version, **`territoire-synthese@6`**, avec un commentaire qui cite les deux tickets. Si un autre ticket a monté le contrat entre-temps, prendre le numéro suivant celui de `main`, sans en forcer un.
3. `fut147-non-regression.test.ts` : garder la structure de FUT-175 (`horsFut175`, `verifierContrat`, `verifierRegistre`), puis :
   - `verifierContrat` attend `FUT163` + `LIGNES_CONTRAT_FUT176`, régénérée depuis le diff réel moins la référence FUT-175 (aucune ligne sur les feux) ;
   - `verifierRegistre` admet le type du rôle (FUT-176), seule ligne retirée ;
   - `CLE_MAIN` est recalculée (essai : `5b0eb94c…6c72`), et `HASH_MAIN` reste celle de FUT-175 (FUT-176 ne change pas l'empreinte).
4. `__fixtures__/fut175-lignes-admises.json` : retirer la ligne `+… territoire-synthese@5` (sans quoi la référence est « périmée »), et l'écrire dans le commentaire de la référence.
5. `fut176-statuts-urbains.test.ts` : la version attendue passe à `@6`.

À refaire après intégration :
- `npx tsc --noEmit` ;
- la suite complète `--test-concurrency=1` (essai : 4 499 réussis, 5 échecs fut27 connus dus au « · » du chemin, 2 sautés : FUT-137 et la couverture nationale sans le xlsx) ;
- les tests ciblés : `fut147-non-regression`, `fut175-oso-eau`, `fut176-statuts-urbains` (avec `data/source/UU2020_au_01-01-2025.xlsx` pour la couverture nationale), `territoire/*`, `plm-communal`, `fut140`, `fut141`, `index-population` ;
- `npm run index:verify`.

Le fusionné doit aussi être relu sur deux points : la projection d'un arrondissement avec les parts OSO de FUT-175 (deux grains différents dans la même projection), et la clé de cache, qui doit changer une seule fois.

## 8. Recette de la reprise

- TypeScript : `tsc --noEmit` sans erreur ; ESLint sans erreur sur les fichiers modifiés.
- Suite complète (`--test-concurrency=1`) : 4 492 tests, 4 486 réussis, 5 échecs fut27 connus (chemin « · »), 1 sauté (FUT-137, déjà présent).
- Ciblés : FUT-176 (24), FUT-147 (20, références inchangées), FUT-140, FUT-141, PLM, `territoire/*`, `agglomeration-*`, pastilles : 259/259. `npm run index:verify` : index vérifié.
- Index inchangé par la reprise : aucun score, classement ni ordre ne bouge.
- Test FUT-137 ajusté (La Hague) : la commune garde sa vie locale forte (69), décision de FUT-137 intacte, mais elle est hors unité urbaine. Elle n'est donc plus « une petite ville qui reste vraiment vivante ». C'est l'effet direct de la règle canonique demandée par la contre-revue, à valider en contre-revue.

## 9. Dernière reprise (SHA audité 2f4378c6) et intégration de main

**Intégration.** `origin/main` (6fc48f7b, FUT-175 fusionnée par #140) est fusionnée dans la branche. L'arbre de main est identique à celui de la tête de #140 (a9490c31), donc la résolution essayée au § 7 s'applique telle quelle (commit 13181a1f). L'arbre obtenu est identique à celui de l'essai, rapports à part :
- `territoire-facts@2` et la lecture OSO de FUT-175 sont intacts ;
- le contrat est unique, en `territoire-synthese@6` ;
- `HASH_MAIN` = `6f4c52b2…68d3` (celle de FUT-175) et `CLE_MAIN` = `5b0eb94c…6c72` ;
- la référence figée FUT-175 perd seulement sa ligne `@5`, et les contre-épreuves FUT-147/FUT-175 passent.

**Garde-fou PLM.** L'exception `unless`, posée sur la phrase entière, a été retirée. L'exception est maintenant un lookbehind sur la seule affirmation admise : « Paris|Lyon|Marseille [, …,] est au centre de son agglomération ».
- Refusées : « Paris est au centre de son agglomération, mais l'arrondissement est la ville-centre », et « …, et le 20e se trouve au cœur de son agglomération ».
- Admise : « Paris est au centre de son agglomération ; le 20e en est un arrondissement ».
- Ces cas sont testés sur Paris, Lyon et Marseille.

**Mot « ville » tiré d'une population (source commune).**

| Où | Avant | Après |
|---|---|---|
| Pastille taille, commune < 25 000 | « c'est une petite ville, ou un village » | « … habitants dans la commune : une commune de petite taille » |
| Pastille taille, commune 25 000-100 000 | « une ville moyenne » | « une commune de taille moyenne » |
| Pastille taille, > 100 000 (commune / agglomération) | « ce n'est pas une petite ville » | « ce n'est pas une commune de petite taille » / « … une petite agglomération » |
| `labelForCategory(·, "commune")` | une ville moyenne · une grande ville · une très grande ville | une commune de taille moyenne · une grande commune · une très grande commune |
| Face favorable en source agglomération | « Mont-Dauphin est une petite agglomération » | « Mont-Dauphin appartient à une petite agglomération » (« est un village » inchangé) |

Seuils, scores, préférences, ordres : inchangés. La consigne de conclusion (`conclusion-prompt.ts`) cite encore « une ville moyenne, … une très grande ville » parmi ses exemples. La changer impose de passer `DECISION_NARRATIVE_PROMPT_VERSION` de v16 à v17. Or ce passage modifie l'empreinte des conclusions figées, que FUT-17 garantit relues mot pour mot (deux tests échouaient). Ce point est laissé tel quel et signalé pour un ticket FUT-17/FUT-8.

**Recette.**
- Suite complète : 4 508 tests, 4 502 réussis, 5 échecs fut27 connus (« · » du chemin), 1 sauté (FUT-137, déjà présent).
- FUT-176 : 26 tests.
- `tsc` : sans erreur. `eslint .` : sans erreur. `index:verify` : vérifié.
- `npm run build` : réussi, avec des variables Supabase factices. Les erreurs de fetch au prérendu viennent de l'adresse factice.
