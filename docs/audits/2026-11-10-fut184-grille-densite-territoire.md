# FUT-184 · La grille communale de densité Insee dans l'identité et la synthèse Territoire

Date : 10/11/2026. Base : `main` 6972d5a4 (FUT-185 fusionné). Branche : `bonjourfuturee/fut-184-integrer-la-grille-insee-2025-a-7`.
Aucune migration, aucune écriture en base, aucun déploiement. Les anciens snapshots, synthèses et dossiers ne sont pas réécrits.

**Reproduction :** `scripts/fut184/lancer_tout.sh <dossier_hors_dépôt>` retélécharge les deux fichiers Insee (empreintes vérifiées), régénère la table et la compare à celle du dépôt, puis exécute le vrai code Territoire de `main` et de la branche sur les 34 791 entrées et compare les textes rendus. Sortie de référence : [`2026-11-10-fut184-grille-densite-territoire/sortie-attendue.txt`](2026-11-10-fut184-grille-densite-territoire/sortie-attendue.txt).

## 1. Contre-vérification de FUT-180 (étape 1)

| Contrôle | Résultat |
|---|---|
| Chaîne FUT-180 rejouée dans un dossier vide à sa révision (51a493d0) | sortie **identique octet pour octet** à `sortie-attendue.txt` |
| Même chaîne sur `main` 6972d5a4 (FUT-176 et FUT-185 fusionnés) | identique à la sortie provisoire FUT-176 (ee1d809a), sauf la section 08 de FUT-185, comme attendu (0 `rural_peri_urbain` après correctif) |
| Jointure par code officiel | 34 743 communes appariées ; non appariés : les 45 arrondissements (index) et les 3 communes PLM (grille) |
| Règle « ville » de FUT-176 × grille, au statut `uu_statut` officiel fusionné | **2 377** communes « ville », dont **1 374** rurales pour la grille (1 252 bourgs ruraux, 121 classe 6, 1 classe 7) |
| 80 discordances P1/P2/P3 | **80**, avec la règle officielle (seuil ≥ 50 % ou > 50 %) ; mécanisme toujours non expliqué par la documentation publiée |
| Éditions géographiques | 2025 (géo 01/01/2025) et 2026 (géo 01/01/2026) : mêmes 34 875 codes, **0 classe différente** |

**Choix de source :** l'édition « géographie au 01/01/2025 », celle du COG de l'index ; l'édition 2026 sert de contre-épreuve à chaque génération (le script refuse si un code ou une classe diffère). Classe calculée sur le recensement 2021 carroyé, grille 2025. Licence Ouverte 2.0, « Source : Insee ».

**Aucune classe n'est déduite.** La table ne contient que le code `DENS7` du fichier. Ni les parts P1/P2/P3 (non exportées), ni la densité moyenne ne servent à classer. Les 80 communes dont la classe ne se retrouve pas par les parts gardent leur classe publiée (Quimper, Aubagne, Saint-Brieuc : grands centres urbains ; Porto-Vecchio : petite ville).

## 2. Ce qui est livré

| Couche | Changement |
|---|---|
| Source | `scripts/fut184/telecharger_sources.sh`, `construire_grille_densite.py` → `src/lib/territoire/grille-densite.generated.ts` (210 Ko, une ligne de codes par classe, provenance et empreintes en tête) |
| Lecture | `grille-densite.ts` : classe officielle d'un code ; un arrondissement lit celle de sa ville, marquée `commune_parente` ; code absent = `null` |
| Registre `territoire-facts@3` | nouveau fait `place.density_grid` (échelle commune, millésime 2025, source Insee DENS7, limite de lecture) ; `density.category` dérive de lui seul (règle `density-grid-insee-2025@1`) ; `place.density` (hab/km²) inchangé ; les paliers 150 / 1 500 (`densityCategory`, `DENSITY_LABEL*`) sont retirés |
| Carte d'identité | ligne **« Grille de densité Insee »** en tête des champs, avant « Rôle » ; ligne **« Densité moyenne »** en chiffre (« 38 143 hab/km² (arrondissement) » pour un arrondissement) ; le chiffre n'était pas affiché jusqu'ici, seule la catégorie l'était |
| Résumé | plus de « dense » (il venait du palier 1 500) ; « Ville » seulement si la grille ne classe pas la commune rurale (`peutDireVilleTerritoire`) |
| Ligne « Rôle » | même règle : « Commune-centre de l'agglomération de… » pour une commune-centre que la grille classe rurale |
| Synthèse `territoire-synthese@8` | `densite` ne porte plus que le chiffre ; nouveau champ `grille_densite_insee` (catégorie, échelle, sens sans aucun chiffre, limite) ; consigne réécrite ; « rural » permis pour citer la grille d'une commune rurale |
| Contrôles | `densite:requalifiee-dense` (classes 2-7), `densite:requalifiee-peu-dense` (1-4), `densite:arrondissement-qualifie`, `densite:ville-pour-commune-rurale`, `densite:habitat-disperse` ; `interdit:rural` levé pour les seules classes rurales à la commune |
| Synthèse déterministe | « X relève de la catégorie « Bourg rural » de la grille communale de densité de l'Insee (121 habitants au km² en moyenne). » ; arrondissement : son chiffre, puis « La grille… range Paris entière dans la catégorie… ; elle ne classe pas les arrondissements. » |

**Contrat de présentation (ticket) appliqué tel quel :** Grand centre urbain · Centre urbain intermédiaire · Petite ville — classification Insee · Ceinture urbaine · Bourg rural · Commune rurale de faible densité · Commune rurale de très faible densité. Dans une phrase qui nomme déjà l'Insee, « Petite ville » perd sa mention « classification Insee ». Les libellés tiennent dans une seule table (`LIBELLE_GRILLE`).

**Hors périmètre, non touché :** comparateur et ses scores, rangs, ordres, critères ; index du comparateur ; accueil, `/qna`, AskFuture (aucun ne lit la catégorie de densité Territoire : vérifié par recherche dans `src`) ; OSO ; `rural_peri_urbain` (non rétabli).

## 3. Effets réels, mesurés sur les 34 791 entrées (code de `main` contre code de la branche)

| Mesure | Avant | Après |
|---|---:|---:|
| Entrées avec une classe de grille | 0 | 34 791 (34 743 communes, 45 arrondissements à l'échelle de leur ville, 3 villes PLM) |
| Communes sans classe | sans objet | **0** |
| Résumés « Ville… » | 2 380 | 1 006 (−1 374, aucune commune gagnée) |
| Résumés « … dense … » (palier 1 500) | 640 | 0 |
| Lignes « Ville-centre de… » | 1 165 | 715 (450 deviennent « Commune-centre ») |
| Résumés changés pour une autre raison | | **0** |
| Phrase déterministe de densité changée | | 34 785 / 34 791 |
| Synthèses déterministes refusées par leurs contrôles | 0 | **0** |
| Empreintes de snapshot changées | | 34 791 / 34 791 (nouveau fait + registre `@3`) |

**Les 1 374 cohabitations, par motif** (classe × statut d'unité urbaine × population) : 1 252 bourgs ruraux (849 forment seuls leur agglomération, 403 en sont le centre), 121 « faible densité », 1 « très faible densité ». Après : 0 résumé « Ville », 0 ligne « Ville-centre », et le statut d'agglomération reste dit pour les 1 374 (« Forme à elle seule une agglomération », « Commune-centre de… »). Tableau détaillé : sortie, section 4.

**Contradictions à l'écran après le lot** (attendu 0, obtenu 0) : « Ville » sous une classe rurale ; « Ville-centre » sous une classe rurale ; « ville » dans la phrase déterministe d'une commune rurale (noms propres exclus : Puget-Ville, Dambach-la-Ville) ; ancien palier écrit ; « habitat dispersé » écrit ; arrondissement portant la classe de sa ville sans le nom de la ville.

## 4. Recette sur les communes du ticket (textes réellement rendus)

| Commune | Avant (catégorie, résumé) | Après : grille · densité moyenne · résumé |
|---|---|---|
| Corte | Commune peu dense · « Ville… » | Petite ville — classification Insee · 52 hab/km² · « Ville de montagne, Corte forme à elle seule une agglomération. » |
| Arles | Commune peu dense | Centre urbain intermédiaire · 67 hab/km² |
| Avignon, Nîmes, Quimper | Densité intermédiaire | Grand centre urbain · 1 414 / 930 / 765 hab/km² |
| Sète | Commune dense · « Ville dense… » | Centre urbain intermédiaire · 1 863 hab/km² · « Ville méditerranéenne… » |
| Aubagne | Densité intermédiaire | Grand centre urbain (banlieue de Marseille) |
| Eguisheim | Commune peu dense | Ceinture urbaine · 123 hab/km² · « … se situe hors de toute agglomération » : deux zonages, aucun ne corrige l'autre |
| Janville-en-Beauce | Commune peu dense | Bourg rural · 59 hab/km² |
| Mont-Dauphin | Densité intermédiaire | Commune rurale de faible densité · 282 hab/km² (voir risque 1) |
| Vallet | Densité intermédiaire · « Ville… » | Commune rurale de faible densité · 161 hab/km² · « Commune de l'intérieur, Vallet forme à elle seule une agglomération. » |
| Bony | Commune peu dense | Commune rurale de faible densité · 17 hab/km² |
| Sèvremoine, Bressuire | Commune peu dense · « Ville… » | Bourg rural · « Commune… forme à elle seule une agglomération. » |
| Lamballe-Armor | Commune peu dense · « Ville-centre » | Bourg rural · « Commune-centre de l'agglomération de Lamballe-Armor » |
| Porte des Pierres Dorées | aucune (densité absente de l'index) | Ceinture urbaine · pas de ligne de densité (ADEME la porte en production) |
| Paris, Lyon, Marseille | Commune dense · « Ville dense… » | Grand centre urbain · leur densité Insee (FUT-179) |
| Paris 11e, Lyon 9e, Marseille 9e | Arrondissement dense / Densité intermédiaire | « Grand centre urbain, à l'échelle de Paris » · « 38 143 hab/km² (arrondissement) » ; aucun palier ne qualifie plus l'arrondissement |

Ces cas sont des tests (`src/lib/territoire/fut184-grille-densite.test.ts`) : champs du passeport dans l'ordre affiché, résumé, ligne « Rôle », phrase déterministe, et synthèse passant tous ses contrôles.

## 5. Versions, caches, artefacts figés

| Objet | Avant | Après | Effet |
|---|---|---|---|
| Registre | `territoire-facts@2` | `territoire-facts@3` | toutes les empreintes changent ; un snapshot `@2` stocké reste en base, non relu |
| Contrat de synthèse | `territoire-synthese@7` | `territoire-synthese@8` | clé de cache nouvelle ; les synthèses `@7` restent en base, non servies pour un snapshot `@3` |
| Régénération | | à la visite suivante, par commune et horizon, sous le garde de budget existant | volume non mesuré dans ce lot (aucune lecture de la base de production). Seul repère : l'audit FUT-182 du 09/11 relevait 34 snapshots sur 16 communes et 45 synthèses ; chiffre daté, non revérifié, qui ne vaut pas état actuel |
| Dossiers et artefacts figés | | inchangés | le snapshot Territoire est relu à chaque visite ; les artefacts de dossier ne portent pas l'identité Territoire |
| Garde FUT-147 | | `__fixtures__/fut184-lignes-admises.json` (45 lignes du contrat, 52 du registre), produit par `scripts/fut184/figer-lignes-admises.mjs` ; empreinte et clé de référence recalculées (Châtelaillon) | la garde restaure les lignes de FUT-177 (« @7 ») et FUT-179 que FUT-184 remplace |

## 6. Coordination avec FUT-182

**État vérifié le 10/11/2026 sur GitHub** (`main` toujours à 6972d5a4) :

| Lot FUT-182 | État | Effet sur les contrats Territoire |
|---|---|---|
| B1 | **terminé** : comptes nationaux exacts | aucun (documentaire) |
| B2 | **terminé** : calcul national du secteur habité, comparé à Filosofi 2021 | aucun (documentaire) |
| PR #146 | ouverte, documentaire, tête `df87faa979c32c900d7c3de3dcaf06407d326d9e`. Sa contre-revue (GO méthodologique pour la mesure, pas pour fusion) demande encore de réconcilier des décomptes (paliers 50-75 %) et la classification géographique des portions hors emprise (`hors_carte` ≠ mer ni étranger) | aucun : aucun fichier applicatif |
| PR #148 (lot L0) | ouverte, tête `955b0c8ce4b4147447e7b265875b52b43d551992`, GO technique de contre-revue, non fusionnée | aucun : ne touche ni `territoire/facts.ts` ni `synthesis-contract.ts` |
| B3 | **à réaliser**, dans une PR indépendante : intégration applicative du secteur habité | seul lot FUT-182 qui changera le registre et le contrat |

**Recouvrement :** un seul fichier commun avec #148, `fut147-non-regression.test.ts`, dans des zones distinctes ; fusion à blanc (`git merge-tree`) sans conflit avec la tête actuelle `955b0c8c`. Aucun fichier commun avec #146 (`df87faa9`), fusion à blanc sans conflit.

**Ordre retenu :**
1. **FUT-184** : `territoire-facts@3` et `territoire-synthese@8`. #148 peut passer avant ou après : il ne change aucune version.
2. **FUT-182 B3 ensuite** : `territoire-facts@4` et `territoire-synthese@9`, **à confirmer sur le `main` effectif au moment de l'intégration** (la contre-revue de #146 parle encore de `@3`/`@8` : ces numéros sont pris par FUT-184 s'il est fusionné d'abord). B3 devra, comme FUT-184 l'a fait pour FUT-177 et FUT-179, figer son propre delta dans la garde FUT-147 : ses retouches des lignes FUT-184 rendront la référence FUT-184 « périmée » tant qu'elle ne les annule pas.
3. **La dette FUT-183** (dixième exact des parts OSO dans la synthèse générée, contrôle Rochefort) reste à FUT-182 : `@8` ne la contient pas.

**Deux invalidations successives sont acceptées.** Chacune renouvelle l'empreinte de chaque commune ; la synthèse se régénère à la visite suivante, à la demande, sous le garde de budget. Leur coût réel n'est pas mesuré ici (voir § 5). Les snapshots, synthèses historiques et dossiers achetés restent inchangés.

## 7. Risques nouveaux et arbitrages

1. **Classe et densité moyenne côte à côte.** La carte montre désormais les deux. 2 126 communes classées rurales ont 150 hab/km² ou plus en moyenne, dont 36 en « faible densité » (classes 6-7) à 300 hab/km² ou plus (Mont-Dauphin 282, Boussac 826) ; 541 communes classées urbaines ont moins de 150 hab/km² (Arles 67). Les deux sont vraies : la grille lit la répartition des habitants par carreaux de 1 km², la moyenne divise par toute la surface. Le libellé « Commune rurale **de faible densité** » à côté de « 826 hab/km² » peut se lire comme une contradiction. **Arbitré (10/11) : libellés conservés**, choisis pour leur compréhension par le grand public ; les libellés officiels Insee restent dans les métadonnées (`LIBELLE_INSEE_GRILLE`).
2. **Le mot « ville » change sur 1 374 communes**, dont des communes de 10 000 à 25 000 habitants (Sèvremoine, Bressuire, Lamballe-Armor). C'est la règle proposée par le ticket (grille en tête, statut à part, jamais « ville » au-dessus de « Bourg rural »). Le comparateur, hors périmètre, garde `peutDireVille` seul : Sèvremoine reste « ville » dans ses textes. **Arbitré (10/11) : comparateur inchangé** ; une commune peut être « ville » dans le comparateur et « Bourg rural » dans Territoire (deux zonages). Harmonisation éventuelle étudiée dans FUT-50/FUT-190.
3. **« Densité moyenne » pour un arrondissement** garde son propre chiffre (FUT-179) sans palier ; la grille n'apparaît qu'« à l'échelle de » la ville. Les 43 « Arrondissement dense » disparaissent.
4. **Fixture Châtelaillon** : elle porte désormais la classe officielle (4). Les tests qui partent d'elle pour d'autres communes doivent poser la grille de leur code (fait pour FUT-176, FUT-177, FUT-179, PLM) ; un test futur qui l'oublierait hériterait de la classe 4.
5. **Champ mort** : `TerritoryMood.density` (paliers 150 / 1 500, `territory-mood.ts`) n'a aucun lecteur. Laissé en place, signalé.

## 8. Tests

- `npm test` : 4 708 tests, 4 706 réussis, 0 échec, 2 ignorés (préexistants).
- Nouveau : `src/lib/territoire/fut184-grille-densite.test.ts` (26 tests : table, aucune déduction, couverture nationale, PLM, absence, compatibilité d'un ancien snapshot, 16 communes du panel au texte affiché, 1 374 cohabitations, projection, contrôles).
- Adaptés, avec la raison écrite dans chaque test : `facts.test.ts`, `fut179-plm-densite.test.ts`, `synthesis-checks.test.ts`, `synthesis-deterministe.test.ts` (texte de référence de Châtelaillon : seule la phrase de densité change), `plm-communal.test.ts`, `fut176-statuts-urbains.test.ts` (Orée d'Anjou : bourg rural, « Ville » retiré), `fut177-conclusions-sols.test.ts`, `fut183-arrondis-oso.test.ts`, `fut147-non-regression.test.ts`.
- Non-régression FUT-176, FUT-179, FUT-185 (accueil, `/qna`, AskFuture) : suites existantes vertes, aucun fichier de ces surfaces modifié.
- `tsc --noEmit` et `eslint` sur les fichiers touchés : propres. Build Next.js local : voir la description de PR.
