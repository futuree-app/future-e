# FUT-50 × FUT-104 · Les données climatiques ultramarines dans le nouvel accueil

16 octobre 2026 · branche `feat/fut-50-socleom-integration`. Aucune PR, fusion ni déploiement, aucune écriture en base. `main`, `feat/fut-50-accueil-decision` et `feat/fut-104-consolidation` n'ont pas été modifiées.

## 1. Comment les deux chantiers ont été réunis

| Branche | Commit | Base |
|---|---|---|
| `origin/main` | 6c496676 | — |
| FUT-104 consolidation | cf8ea2f1 | `main` à jour, hotfix inclus |
| FUT-50 | 843bd5d0 | 18 commits, 2 commits de retard sur `main` (FUT-93, FUT-97) |

Le worktree `fut50-socleom` part de la consolidation, puis fusionne FUT-50 (`70a066c0`, `--no-ff`). FUT-50 récupère ainsi les deux commits de `main` qui lui manquaient. Le hotfix n'est pas réintégré une seconde fois.

## 2. Conflits

**Aucun conflit textuel.** Aucun fichier n'était modifié des deux côtés. Les conflits sont sémantiques et sont corrigés dans `11b54673` :

- 4 fichiers de FUT-50 lisaient `public/data_climat.json`, que FUT-104 a déplacé : `cas-sete.ts`, `cas-sete.test.ts`, `c/c.test.ts` et `scripts/fut50/panel-chaleur.mjs`. Ils lisent désormais `data/data_climat.json`.
- `SectionsC.tsx` promettait « Sa position parmi les communes françaises » (avec un commentaire citant « 35 006 »). La phrase dit maintenant « parmi les communes de l'Hexagone et de Corse », et le commentaire 34 788, selon la règle de FUT-104. Le texte change, la mise en forme non.
- `scripts/fut50/verifier-identite.mjs` attendait un 404 pour 97411. Il attend désormais « Saint-Denis (La Réunion) », quel que soit le nom envoyé, vérifie 10 identités ultramarines et garde un 404 pour 97999, absent du COG.

## 3. Fichiers modifiés

| Commit | Fichiers |
|---|---|
| `8bafdfed` | `src/components/prototypes/fut50/c/outremer.ts` (nouveau, pur) et `outremer.test.ts` ; `src/app/dev/fut50/api/lecture/route.ts` ; `src/lib/outremer/climat-outremer.ts` (`seuilDe`) |
| `e103275f` | `climat-outremer.ts` (`designation`), tests, banc d'identité |
| `79…` (ce commit) | `pastilles.ts` (grain `secteur`), `HeroLieu.tsx` (libellé du grain, une ligne), captures, ce rapport |

La direction artistique, les textes validés, les animations, les trois états, les quatre priorités et la lecture métropolitaine ne sont pas touchés.

## 4. Contrat de lecture

`@/lib/outremer` (FUT-104) :

| Fonction | Usage dans la route |
|---|---|
| `estCodeOutremer` | Reconnaît les codes 97/98 |
| `getEntiteOutremer` | Identité COG, sans charger l'index du comparateur |
| `lireClimatOutremer` | Statut, indicateurs, provenance, limites |
| `TERRITOIRES_OUTREMER[…].reperes` | Indicateurs de chaleur du jour et de la nuit, propres au territoire |

Deux ajouts minimaux au contrat, tous deux testés :

- `seuilDe(indicateur)` lit le seuil et le comparateur (≥ ou >) dans le libellé officiel ;
- `designation` donne le nom avec son article (« la Martinique »).

**Route.** Le code est validé strictement (inchangé). Si `estCodeOutremer`, l'identité vient de `getEntiteOutremer(code).nomComplet`. Sinon, la résolution suit le chemin historique (Paris, Lyon, Marseille, puis index du comparateur). Le nom envoyé par le navigateur n'est jamais lu.

## 5. Les quatre priorités en outre-mer

| Priorité | Source | Rendu |
|---|---|---|
| **Chaleur** | SocleOM | Indicateur de jour et de nuit du territoire, valeur 2050 contre 1991-2020, niveau régional (« +2,0 °C pour La Réunion, par rapport à 1850-1900 »), source, grain « au point de grille le plus proche de la mairie ». Signal **« À savoir »**, sans verdict. **Pas de bascule** 30 °C / 35 °C. Le détail explique les seuils propres au territoire et pourquoi ils ne se comparent pas à ceux de l'Hexagone ; la plage q17–q83 (« plage centrale des simulations, pas trois scénarios ») ; et, dans une **phrase distincte**, la variation géographique dans la commune. Aucun appel à `buildClimatFacts`, `classifyClimateComfort`, DRIAS, au rang national, à 1976-2005 ou à « +2,7 °C » (testé) |
| **Hivers doux** | — | Indisponible et motivé : le critère est défini pour l'Hexagone (décembre à février, 1976-2005), et aucune lecture validée de la saison fraîche n'existe pour ce territoire |
| **Petite ville** | COG | La population **communale** est donnée comme fait, signal « À savoir ». Le critère de l'accueil porte sur l'**agglomération** (unité urbaine), non mesurée outre-mer : aucun seuil n'est appliqué, aucune classification |
| **Risques** | GASPAR | Interrogé pour les DROM, Saint-Pierre-et-Miquelon, Saint-Martin et Saint-Barthélemy, qui y figurent (vérifié). Pour les codes 98 (Polynésie, Nouvelle-Calédonie, Wallis), GASPAR répond « 0 résultat » : la lecture dit que la base ne couvre pas le territoire et qu'on n'en tire **aucune conclusion**, au lieu de « rien n'est recensé » |
| Voiture | — | Inchangée (se lit à l'adresse) |

## 6. Données affichées (lues dans les données, jamais écrites en dur)

| Commune | Jours chauds 2050 (1991-2020) | Nuits chaudes 2050 (1991-2020) | Niveau régional 2050 |
|---|---|---|---|
| Saint-Denis (La Réunion) | 47 journées à au moins 31 °C (5,4) | 69 nuits sans descendre sous 25 °C (16) | +2,0 °C |
| Fort-de-France (Martinique) | 101 journées à au moins 33 °C (27) | 210 nuits sans descendre sous 25 °C (85) | +1,9 °C |
| Papeete (Polynésie française) | 29 journées à au moins 32 °C (8,3) | 2,4 nuits sans descendre sous 26 °C (0,2) | +1,6 °C |

**Saint-Denis, détail :**
- « Selon les modèles climatiques, entre 43 et 52 journées en 2050 : c'est la plage centrale de l'ensemble des simulations, pour un même réchauffement, pas trois scénarios. »
- « … point de grille le plus proche de la mairie, situé à 1,1 km. Ailleurs dans la commune, de 0 à 47 journées en 2050 : l'altitude et l'exposition changent beaucoup la chaleur. »

**Témoin métropolitain inchangé :** Nîmes, 14 jours au-dessus de 35 °C (contre 3 sur 1976-2005), 69 nuits tropicales, « Plutôt défavorable », bascule 30 °C présente.

## 7. Communes sans couverture

| Code | Commune | Statut |
|---|---|---|
| 98736 | Pirae | `point_de_reference_non_verifie` |
| 98754 | Tumaraa | `point_de_reference_non_verifie` |
| 98713 | Arutua | `hors_grille` |
| 98731 | Nuku-Hiva | `hors_grille` |
| 98719 | Gambier | `hors_grille` |
| 98748 | Taiarapu-Ouest | `point_de_reference_manquant` |
| 98613 | Uvea | `source_non_integree` |
| 97502 | Saint-Pierre | `source_indisponible` |

Pour chacune :
- l'identité est reconnue et la recherche la propose ;
- la chaleur dit sa propre raison, suivie de « Aucun chiffre n'est affiché à sa place » ;
- la population et les risques restent lus quand ils existent ;
- les règles géographiques de FUT-104 n'ont pas été relâchées.

## 8. Captures (`docs/audits/2026-10-16-fut50-socleom-captures/`)

| Fichier | Contenu |
|---|---|
| `01` | Saint-Denis, ordinateur, chaleur avec le détail ouvert |
| `02` | Saint-Denis, mobile 390 × 844 (cadre de 390 px dans la page, la fenêtre de l'outil ne descendant pas sous 1 680 px de viewport) |
| `03` | Fort-de-France |
| `04` | Papeete |
| `05` | Pirae (sans couverture) |
| `06` | Saint-Denis, hivers (indisponibilité contextualisée) |
| `07` | Nîmes (témoin métropolitain) |

**Comparaison avec la version C.** Même panneau, mêmes deux grands chiffres, même structure « Pour votre priorité », « Comment lire ce résultat ? », « À vérifier », même CTA. Seules différences : le signal « À savoir » à la place d'un verdict, l'absence de bascule, le libellé du grain et la source SocleOM. Les captures de référence de FUT-50 ne sont pas écrasées.

## 9. Tests

| Vérification | Résultat |
|---|---|
| Suite complète, lancée seule | **2 666 / 2 666** (consolidation 2 614 + FUT-50 45 + 7 nouveaux) |
| Tests Python SocleOM | 13 / 13 |
| Banc d'identité FUT-50 (serveur de dev, port 3150) | **45 / 45** |
| TypeScript, ESLint (fichiers modifiés) | OK |
| Build de production (`next build --webpack`) | OK |

**Non-régression vérifiée :**
- aucun `data_climat.json` sous `public/`, aucune référence à l'ancien chemin ;
- 104 364 lignes DRIAS, 0 ultramarine ;
- 25 fonctions tracent `data/data_climat.json` ;
- aucune classification métropolitaine dans la branche ultramarine de la route (testé) ;
- prototype et API en 404 en production (gardes inchangées).

**Parcours dans Chrome :** recherche, priorité, lecture, changement de priorité, changement de commune (Saint-Denis → Fort-de-France → Papeete → Pirae → Nîmes), outre-mer → métropole et inversement. Aucune valeur de la commune précédente n'est restée affichée. Nom contradictoire envoyé au serveur (`commune=Nîmes`) : ignoré.

## 10. Accessibilité

- Les pastilles, la bascule et le détail sont des `<button>` et `<details>` natifs, inchangés ; les grands chiffres gardent leur `texte` complet pour les lecteurs d'écran (« À l'horizon 2050 : 47 journées par an à au moins 31 °C, contre 5,4 sur 1991-2020. »).
- Les 8 règles `prefers-reduced-motion` de la version C sont intactes.
- **Non vérifié dans cette passe :** navigation au clavier de bout en bout, et rendu en mouvement réduit émulé. L'outil ne l'émule pas ; aucun composant interactif nouveau n'a été ajouté.
- Côté gauche, la confirmation de commune affiche le nom choisi dans la recherche (« Saint-Denis »), et le panneau le nom canonique (« Saint-Denis (La Réunion) »). C'était déjà le comportement de FUT-50 : à harmoniser.

## 11. Performance

- `@/lib/outremer` embarque environ 1,5 Mo de JSON côté serveur, chargé une fois par processus, sans réseau. La route de dev seulement l'importe.
- **GASPAR était injoignable pendant les essais** (délai de connexion dépassé, y compris pour La Rochelle). La lecture « la base n'a pas répondu » s'affiche, comme prévu par FUT-50. La couverture GASPAR ultramarine a été vérifiée plus tôt dans la journée.

## 12. Étapes restantes avant publication de l'accueil

1. **Bouton « Examiner une adresse »** : il est proposé pour toute commune ultramarine, Pirae compris. Le parcours d'achat ultramarin reste à bloquer ou adapter (hors périmètre ici).
2. **Taille ultramarine** : lire l'agglomération (unités urbaines des DROM) si l'on veut appliquer le critère.
3. **Hivers outre-mer** : décider s'il faut une lecture de la saison fraîche (doctrine).
4. Harmoniser le nom de la confirmation de commune avec le nom canonique.
5. Navigation au clavier et mouvement réduit à vérifier en conditions réelles.
6. Pages SEO, dossiers, FUT-105 (présentation des quantiles) : hors périmètre.
