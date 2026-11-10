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
| Régénération | | à la visite suivante, par commune et horizon, sous le garde de budget existant | volume connu au 09/11 (audit FUT-182, lecture seule) : 34 snapshots sur 16 communes, 45 synthèses, aucune au-delà de `@4`. Non recompté ici : aucune lecture de la base de production dans ce lot |
| Dossiers et artefacts figés | | inchangés | le snapshot Territoire est relu à chaque visite ; les artefacts de dossier ne portent pas l'identité Territoire |
| Garde FUT-147 | | `__fixtures__/fut184-lignes-admises.json` (45 lignes du contrat, 52 du registre), produit par `scripts/fut184/figer-lignes-admises.mjs` ; empreinte et clé de référence recalculées (Châtelaillon) | la garde restaure les lignes de FUT-177 (« @7 ») et FUT-179 que FUT-184 remplace |

## 6. Coordination avec FUT-182

**État réel (10/11, lu sur GitHub et Linear) :** FUT-182 est *In Progress* avec deux PR ouvertes. #146 (`324bed79`) est documentaire (audit phase A, scripts). #148 (`6d791840`, lot L0) change des libellés nature dans l'accueil, AskFuture et le comparateur, **sans toucher** ni `territoire/facts.ts` ni `synthesis-contract.ts`. La phase B (recalcul OSO, `territoire-facts@3` et `territoire-synthese@8` dans le plan de #146) n'a pas commencé : elle attend le téléchargement du raster et un GO.

**Recouvrement :** un seul fichier commun avec #148, `fut147-non-regression.test.ts`, dans des zones distinctes ; fusion à blanc sans conflit. Aucun fichier commun avec #146.

**Ordre proposé :**
1. **FUT-184 d'abord**, avec `@3` / `@8`. FUT-182 L0 (#148) peut passer avant ou après : il ne change aucune version.
2. **FUT-182 phase B ensuite, renumérotée `territoire-facts@4` / `territoire-synthese@9`**, rebasée sur `main`. Elle devra, comme FUT-184 l'a fait pour FUT-177 et FUT-179, figer son propre delta : ses retouches des lignes FUT-184 (version, `place.density_grid` voisin) rendront la référence FUT-184 « périmée » tant qu'elle ne les annule pas.
3. **La dette FUT-183** (dixième exact des parts OSO dans la synthèse générée, contrôle Rochefort) reste à FUT-182 : `@8` ne la contient pas, conformément à la séparation des chantiers.

**Pourquoi pas une seule version commune :** attendre la phase B retiendrait la correction de l'identité (Corte, Arles, Avignon, 1 374 « Ville » contredites) pour une durée inconnue. Coder la grille sans monter les versions n'est pas possible : le nouveau fait change déjà toutes les empreintes, et la consigne change le texte (règle du contrat : tout ce qui change la sortie monte la version). **Coût de la double invalidation :** deux régénérations successives par commune visitée, à la demande ; au volume connu (16 communes visitées), quelques dizaines d'appels au plus, avant ouverture. **Si la personne qui porte le produit préfère une seule invalidation**, la branche est prête : il suffit de fusionner FUT-184 et la phase B dans la même fenêtre de déploiement, sans fusionner les PR.

## 7. Risques nouveaux et décisions à prendre

1. **Classe et densité moyenne côte à côte.** La carte montre désormais les deux. 2 126 communes classées rurales ont 150 hab/km² ou plus en moyenne, dont 36 en « faible densité » (classes 6-7) à 300 hab/km² ou plus (Mont-Dauphin 282, Boussac 826) ; 541 communes classées urbaines ont moins de 150 hab/km² (Arles 67). Les deux sont vraies : la grille lit la répartition des habitants par carreaux de 1 km², la moyenne divise par toute la surface. Le libellé « Commune rurale **de faible densité** » à côté de « 826 hab/km² » peut se lire comme une contradiction. **À arbitrer :** garder les libellés du ticket, ou en choisir qui ne parlent pas de densité pour les classes 6 et 7.
2. **Le mot « ville » change sur 1 374 communes**, dont des communes de 10 000 à 25 000 habitants (Sèvremoine, Bressuire, Lamballe-Armor). C'est la règle proposée par le ticket (grille en tête, statut à part, jamais « ville » au-dessus de « Bourg rural »). Le comparateur, hors périmètre, garde `peutDireVille` seul : Sèvremoine reste « ville » dans ses textes. **À arbitrer** pour FUT-185/FUT-50 si la cohérence entre surfaces est voulue.
3. **« Densité moyenne » pour un arrondissement** garde son propre chiffre (FUT-179) sans palier ; la grille n'apparaît qu'« à l'échelle de » la ville. Les 43 « Arrondissement dense » disparaissent.
4. **Fixture Châtelaillon** : elle porte désormais la classe officielle (4). Les tests qui partent d'elle pour d'autres communes doivent poser la grille de leur code (fait pour FUT-176, FUT-177, FUT-179, PLM) ; un test futur qui l'oublierait hériterait de la classe 4.
5. **Champ mort** : `TerritoryMood.density` (paliers 150 / 1 500, `territory-mood.ts`) n'a aucun lecteur. Laissé en place, signalé.

## 8. Tests

- `npm test` : 4 708 tests, 4 706 réussis, 0 échec, 2 ignorés (préexistants).
- Nouveau : `src/lib/territoire/fut184-grille-densite.test.ts` (26 tests : table, aucune déduction, couverture nationale, PLM, absence, compatibilité d'un ancien snapshot, 16 communes du panel au texte affiché, 1 374 cohabitations, projection, contrôles).
- Adaptés, avec la raison écrite dans chaque test : `facts.test.ts`, `fut179-plm-densite.test.ts`, `synthesis-checks.test.ts`, `synthesis-deterministe.test.ts` (texte de référence de Châtelaillon : seule la phrase de densité change), `plm-communal.test.ts`, `fut176-statuts-urbains.test.ts` (Orée d'Anjou : bourg rural, « Ville » retiré), `fut177-conclusions-sols.test.ts`, `fut183-arrondis-oso.test.ts`, `fut147-non-regression.test.ts`.
- Non-régression FUT-176, FUT-179, FUT-185 (accueil, `/qna`, AskFuture) : suites existantes vertes, aucun fichier de ces surfaces modifié.
- `tsc --noEmit` et `eslint` sur les fichiers touchés : propres. Build Next.js local : voir la description de PR.
