# FUT-180 · Grille communale de densité Insee 2025 : phase A (lecture seule)

Date : 09/11/2026. Index et code étudiés : `origin/main` à la révision 51a493d0, 34 788 entrées d'index.
`main` a reçu FUT-175 (6fc48f7b) pendant l'étude : l'index n'a pas changé, et les points de code cités ici sont identiques (numéros de ligne de `facts.ts` décalés).
Aucune modification de l'index, du code, des bases, de Linear.

**Reproduction :** dossier jumeau [`2026-11-09-fut180-grille-densite-insee/`](2026-11-09-fut180-grille-densite-insee/README.md). `./lancer_tout.sh <dossier> [révision]` retélécharge les sources et documents de méthode (empreintes vérifiées), extrait l'index **et le code** d'une même révision, exécute le vrai code de l'accueil et réimprime chaque chiffre. Référence : `sortie-attendue.txt`.

### Reprise après contre-revue (SHA audité 33cfb7f2)

| Point | Correction |
|---|---|
| 1. Communes urbaines mal qualifiées | Le filtre portait sur les classes 1-2 (738 communes). Classes 1-4 : **3 612 communes, 20,3 M d'habitants**. Les textes réellement produits sont comptés à part, en exécutant `recits.ts` et `deriveCategoriesFromEntry` (§6.2) |
| 2. Les 80 discordances | `idxmax` remplacé par la règle officielle. 2 faux positifs (Isle, Leffrinckoucke), 2 discordances nouvelles ; toujours **80**, dont la plupart restent **inexpliquées par la documentation publiée**. Ce n'est pas une anomalie démontrée de l'Insee (§3.2) |
| 3. Le « 19 % » | 6 422 communes = **18,5 %**, total de six groupes définis par ce rapport, pas un taux officiel. Portée des seuils de population vérifiée dans la méthode (§1, §2) |
| 4. Croisement FUT-176 | Chiffres dépendants de `hors_uu` listés, recalculés sur l'index FUT-176 (révision ee1d809a, non fusionnée), procédure documentée (§6.1) |

## 1. La source

| Point | Constat |
|---|---|
| Fichier | `fichier_diffusion_2026.xlsx` (2,4 Mo), SHA-256 `8ebf3011…ca978`, mis en ligne le 15/05/2026 |
| Millésime | Grille **2025**, calculée sur le **RP 2021 carroyé** (1 km). Géographie au 01/01/2026. Population affichée : PMUN 2023 |
| Mise à jour | Insee : la mise à jour annuelle **ne réestime pas** le niveau, elle reporte le niveau « 2021 » dans la nouvelle géographie. Vérifié : fichiers 2025 et 2026 identiques (34 875 codes, **0 classe modifiée**) |
| Colonnes | `CODGEO, LIBGEO, DENS (3 postes), PMUN23, P1/P2/P3 (part de pop. dans chaque niveau), DENS_AAV, DENS7, LIBDENS7` + feuilles EPCI, bassin de vie, département. La feuille « Documentation » est vide |
| Licence | Licence Ouverte 2.0 (régime par défaut du site Insee), mention « Source : Insee » + date |
| PLM | Une seule ligne par commune : Paris 75056, Lyon 69123, Marseille 13055, toutes trois « Grands centres urbains ». **Aucun arrondissement** |

**Comment une commune est classée** (Insee, document de travail 2022-18 §1.2-1.4 ; Eurostat, manuel 2021, étape 2 et §7.1). On classe d'abord des carreaux de 1 km², regroupés en taches ; la commune prend ensuite la classe du type de tache où vit **la plus grande part de sa population** :

| Code | Libellé | Ce qui est mesuré |
|---|---|---|
| 1 | Grands centres urbains | au moins 50 % de la population dans un **centre urbain** (tache de carreaux ≥ 1 500 hab/km² totalisant ≥ 50 000 hab.) ; correspond aux « cities » européennes |
| 2 | Centres urbains intermédiaires | majorité urbaine ; plus de population dans une **tache dense de 5 000 à 49 999 hab.** que dans une tache semi-dense, et plus dans ces taches que dans les carreaux périurbains |
| 3 | Petites villes | idem, mais tache **semi-dense** (≥ 300 hab/km², ≥ 5 000 hab.) à plus de 2 km de toute tache dense |
| 4 | Ceintures urbaines | majorité urbaine vivant surtout dans des carreaux **périurbains** (tache semi-dense contiguë ou à moins de 2 km d'une tache dense) |
| 5 | Bourgs ruraux | majorité rurale vivant surtout dans une **tache rurale** (≥ 300 hab/km², 500 à 4 999 hab.) |
| 6 | Rural à habitat dispersé | majorité rurale vivant surtout dans des carreaux de 50 hab/km² ou plus hors tache rurale |
| 7 | Rural à habitat très dispersé | majorité rurale vivant surtout dans des carreaux de moins de 50 hab/km² |

Ajustement français documenté : 19 communes reclassées de « ceinture urbaine » en « petite ville » (Digne-les-Bains, Annonay, Saumur…), toutes « petites villes » dans le fichier 2026.

**Portée des seuils de population.** Tous les seuils (50 000, 5 000, 500 à 4 999) portent sur la **tache de carreaux**, jamais sur la commune. La fiche Insee 2025 les écrit comme des populations communales (« communes de 5 000 à 49 999 habitants ») : c'est un raccourci. Population communale mesurée :

| Classe | Communes | Sous le seuil de la tache | Au-dessus de la borne haute |
|---|---:|---:|---:|
| 1 Grands centres urbains | 689 | 581 sous 50 000 hab. | sans objet |
| 2 Centres urbains intermédiaires | 617 | 73 sous 5 000 | 12 à 50 000 ou plus (Saint-Nazaire, 74 568) |
| 3 Petites villes | 932 | 611 sous 5 000 (minimum 184) | 0 |
| 4 Ceintures urbaines | 1 965 | 1 564 sous 5 000 (Eguisheim, 1 729) | 0 |
| 5 Bourgs ruraux | 5 038 | 188 sous 500 | 231 à 5 000 ou plus |

Une « petite ville » de moins de 5 000 habitants est donc une commune dont la majorité des habitants vit dans une portion d'une tache semi-dense plus grande, partagée avec des voisines. Un libellé qui suggère une taille de commune serait faux.

## 2. Confrontation à l'index

**Couverture : 100 % des communes.** 34 743 communes appariées par code, même COG des deux côtés. Les 45 entrées non appariées sont exactement les arrondissements PLM ; les 3 lignes de la grille sans entrée d'index sont Paris, Lyon et Marseille (l'index ne porte pas la commune entière). 129 lignes DROM hors périmètre.

Bonus : la grille couvre 15 communes où notre densité est **absente** (Orée d'Anjou, Porte des Pierres Dorées, Conques-en-Rouergue, villages morts de la Meuse…).

**Distribution nationale** (communes / population) :

| Classe | Communes | Population |
|---|---:|---:|
| 1 Grands centres urbains | 689 | 34,2 % |
| 2 Centres urbains intermédiaires | 617 | 14,4 % |
| 3 Petites villes | 932 | 6,4 % |
| 4 Ceintures urbaines | 1 965 | 10,4 % |
| 5 Bourgs ruraux | 5 038 | 16,1 % |
| 6 Rural à habitat dispersé | 18 267 | 15,8 % |
| 7 Rural à habitat très dispersé | 7 235 | 2,6 % |

**Tableau croisé avec nos catégories** (`densityCategory`, seuils 1 500 / 150 hab/km²) :

| Grille Insee | Commune dense | Densité intermédiaire | Commune peu dense | Absente |
|---|---:|---:|---:|---:|
| 1 Grands centres urbains | 460 | **229** | 0 | 0 |
| 2 Centres urbains intermédiaires | 108 | 496 | 13 | 0 |
| 3 Petites villes | 6 | 683 | **243** | 0 |
| 4 Ceintures urbaines | 16 | 1 663 | **285** | 1 |
| 5 Bourgs ruraux | 4 | 1 636 | **3 396** | 2 |
| 6 Rural à habitat dispersé | 0 | **484** | 17 780 | 3 |
| 7 Rural à habitat très dispersé | 0 | 2 | 7 224 | 9 |

Deux faits structurels :
- **« Commune peu dense » couvre 28 941 communes, 83 % de la France.** Notre libellé ne distingue presque rien. La grille y sépare 3 396 bourgs, 541 communes urbaines et 25 004 communes rurales.
- **« Densité intermédiaire » mélange Nîmes et un bourg** : 5 193 communes réparties sur les 7 classes.

**Où la grille apporte une information distincte.** Les groupes A à F sont une **convention de ce rapport** : six croisements où la classe Insee dit ce que notre libellé ne dit pas. Leur total, **6 422 communes (18,5 %, 27,5 % de la population)**, mesure l'étendue de ces écarts éditoriaux. Ce n'est pas un taux officiel de reclassement. Sans le groupe E, qui n'est qu'un désaccord de vocabulaire : 6 288 communes (18,1 %, 23,8 % de la population).

| Groupe | Communes | Population | Exemples |
|---|---:|---:|---|
| A. « Peu dense » chez nous, urbaine pour l'Insee (centre compact dans une grande commune) | 541 | 1,27 M | Arles (67 hab/km²), Millau, Fontainebleau, Corte, Biscarrosse |
| B. « Peu dense », bourg rural | 3 396 | 6,04 M | Sèvremoine, Bressuire, Lamballe-Armor, Janville-en-Beauce |
| C. « Intermédiaire », rural à habitat dispersé (petite surface qui gonfle la moyenne) | 486 | 0,57 M | Vallet, Sarzeau, Noirmoutier-en-l'Île, Mont-Dauphin |
| D. « Intermédiaire », grand centre urbain | 229 | 3,02 M | Nîmes, Aix-en-Provence, **Avignon (1 414)**, Colmar, Quimper, Ajaccio |
| E. « Dense », centre urbain intermédiaire (désaccord de vocabulaire seulement) | 134 | 2,27 M | Saint-Nazaire, Sète, Angoulême |
| F. « Intermédiaire », bourg rural | 1 636 | 4,03 M | Urrugne, Guichen, Labenne |

**Où elle confirme seulement** : 28 306 communes (81,5 %, 72,5 % de la population), surtout « peu dense » × rural dispersé (25 004). Pour elles, la grille ne change pas la lecture.

## 3. Communes représentatives

### 3.1 Panel

| Commune | Aujourd'hui | Grille Insee | Ce que la grille change pour le lecteur |
|---|---|---|---|
| Corte | Commune peu dense, 52 hab/km² | Petite ville | **Corrige.** C'est une ville universitaire de 7 800 hab. ; « peu dense » égare |
| Janville-en-Beauce | Peu dense, 59 | Bourg rural | **Précise.** Nomme le bourg compact au milieu des champs |
| Eguisheim | Peu dense, 123 | Ceinture urbaine | **Ambigu.** Exact au sens Insee (carreaux périurbains de Colmar) mais évoque une banlieue ; hors unité urbaine, statut officiel confirmé par FUT-176 |
| Bony | Peu dense, 17 | Rural à habitat dispersé | Confirme |
| Châtelaillon-Plage | Intermédiaire, 976 | Ceinture urbaine | Ajoute « proche de La Rochelle », que l'unité urbaine dit déjà |
| Chartres | Dense, 2 248 | Grand centre urbain | Confirme |
| Levallois-Perret | Dense, 28 505 | Grand centre urbain | Confirme |
| Bondues | Intermédiaire, 738 | Ceinture urbaine | Confirme, en plus clair |
| Sète | Dense, 1 863 | Centre urbain intermédiaire (niveau 3 postes : « urbain intermédiaire ») | **Conflit de mots** si les deux sont affichés |
| Paris / Lyon / Marseille | Aucune catégorie aux arrondissements | Grand centre urbain, grain commune | **Comble un vide**, dit « à l'échelle de Paris » (doctrine FUT-43) |

Contre-exemples, où le libellé officiel brut induirait en erreur :
- **Mont-Dauphin** (place forte compacte, 162 hab.) : « Rural à habitat dispersé ». Ses habitants ne forment pas une tache de 500 personnes ; la classe ne décrit pas la forme du village.
- **Vallet** (9 500 hab., bourg à centre marqué) : « Rural à habitat dispersé ». 6 861 communes de 500 hab. ou plus portent ce libellé, dont 490 de plus de 2 000.

### 3.2 Parts P1/P2/P3 et classe publiée : 80 discordances

La règle communale publiée (Insee, méthode de constitution et DT 2022-18 §1.3 ; Eurostat 2021, étape 2) est : **dense** si au moins 50 % de la population vit dans un centre urbain (P1) ; sinon **intermédiaire** si plus de 50 % vit dans un centre ou un cluster urbain (P1 + P2) ; sinon **rurale**. C'est la même règle que l'agrégation supracommunale de la note complémentaire, appliquée ici à une seule commune. La première version de ce rapport prenait la plus grande des trois parts (`idxmax`), ce qui n'est pas la règle.

Résultat avec la règle officielle, appliquée aux parts publiées dans le même fichier :
- **80 discordances**, identiques avec un seuil dense à « ≥ 50 % » ou à « > 50 % » ;
- **2 faux positifs d'`idxmax`** disparaissent : Isle (46,1 / 26,0 / 28,0, bien intermédiaire) et Leffrinckoucke ;
- **2 discordances nouvelles** apparaissent : Saint-Benoît (P1 = 46,2 %, classée dense) et Parigné-sur-Braye (50,0 / 50,0).

| Nature | Communes | Population | Exemples |
|---|---:|---:|---|
| a. Classée dense avec moins de 50 % dans un centre urbain | 30 | 370 766 | Quimper, Aubagne, Saint-Brieuc (P1 = 0) ; agglomérations entières : Montbéliard (9 communes), Saint-Brieuc (4), Rennes (3) |
| b. 50 % ou plus dans un centre urbain, classée intermédiaire | 1 | 7 233 | Mably (P1 = 52,5) |
| c. Bascule urbain/rural à moins de 2 points de 50 % | 13 | 27 508 | Pontchâteau (49,8 / 50,2), Parigné-sur-Braye |
| d. Bascule urbain/rural nette | 36 | 63 756 | Porto-Vecchio, Tavaux, Damparis (classées « petites villes » avec P3 = 100 %) |

Explications possibles, **aucune démontrée** :
- Eurostat autorise des **ajustements nationaux des « cities »** (manuel 2021 §8.1.3) : ajouter une commune sous 50 % (règle 1) ou retirer une commune au-dessus (règle 2). Mably est compatible avec la règle 2. La règle 1 exige que la ville élargie compte au moins 50 % d'habitants en centre urbain ; elle ne peut donc pas, à elle seule, expliquer une agglomération dont toutes les communes affichent P1 = 0 (Saint-Brieuc, Montbéliard).
- Les parts publiées pourraient être calculées sur une base différente de celle du classement (population, grille de 200 m citée par la méthode de 2019). Rien dans la documentation 2025 ne le dit.
- Les 13 cas à moins de 2 points de 50 % peuvent relever d'arrondis.
- L'ajustement français documenté (19 communes) n'en explique aucune.

**Conclusion.** Avec la seule documentation publiée, on ne retrouve pas la classe de ces 80 communes (0,2 %) à partir des parts du fichier. On ne peut pas en conclure que l'Insee s'est trompé : le mécanisme reste inconnu. La conséquence produit ne change pas. On affiche la **classe**, qui est la donnée officielle ; on n'expose jamais les parts, ni comme chiffre ni comme justification.

## 4. Scénarios

| | A. Conserver | B. Remplacer la catégorie | C. Deux faits distincts |
|---|---|---|---|
| Valeur décisionnelle | Faible : 83 % des communes dans une seule case ; Avignon « intermédiaire », Corte « peu dense » | Forte sur les 18,5 % d'écarts éditoriaux, nulle ailleurs ; nomme bourg / petite ville / ceinture | Même gain que B |
| Redondance | Aucune | Aucune (le chiffre en hab/km² reste affiché) | Forte : deux qualifications de « densité » concordent à 81,5 % |
| Compréhension | Libellés simples mais faux sur les cas qui comptent | Bonne **si** les libellés sont reformulés ; mauvaise avec les libellés Eurostat bruts (Vallet « dispersé ») | Mauvaise : Sète « Commune dense » à côté de « densité intermédiaire » ; le prompt interdit déjà de requalifier |
| PLM | Rien | Classe au grain commune | Idem |
| Risque | Statu quo des erreurs | Libellés trompeurs si recopiés | Contradictions visibles et dans la synthèse |

**C est écarté** : deux catégories de densité qui se contredisent sur 3 026 communes (vocabulaire 3 postes) créent exactement le défaut que `synthesis-contract.ts` interdit au modèle. **B est le bon modèle**, à une condition : le chiffre reste le fait, la catégorie devient dérivée de la grille, avec des libellés lecteur fidèles au sens Insee et une source citée.

## 5. Effort, maintenance, synthèses

Points de citation de la catégorie actuelle (grep `origin/main`) :
- `territoire/facts.ts` (`densityCategory`, `DENSITY_LABEL`, fait dérivé `density.category`) ;
- `territory-identity.ts` (`summaryHead` : « Ville dense… ») ;
- `synthesis-contract.ts` (champ `categorie` + règle « ne requalifiez pas ») ;
- `synthesis-deterministe.ts` (`DENSITY_VERB`, clé par libellé) ;
- `territoire/provenances.ts`, `screen.ts` ;
- `territory-mood.ts` (`pickDensity`, seuils dupliqués) ;
- `comparateur-vie.ts` l. 817-818 (seuil 1 500 dupliqué, catégories d'accueil, §6.2) ;
- tests : `facts.test.ts` (5), `synthesis-checks.test.ts` (2), `plm-communal.test.ts` (1).

| Poste | Estimation |
|---|---|
| Script d'ingestion (xlsx vers champ `grille_densite` de l'index, contrôle de couverture, PLM par commune parente) | 0,5 j |
| Fait + dérivé + provenance + libellés | 0,5 j |
| Identité, contrat de synthèse, synthèse déterministe, gardes | 1 j |
| Tests sur le panel (dit vrai, pas seulement « apparaît ») | 0,5 j |
| **Total** | **2,5 à 3 j** + revue |
| Volume | ~35 000 × 1 entier, environ +0,3 Mo non compressé, négligeable une fois gzippé |
| Maintenance | Annuelle triviale (suivi du COG) ; vraie révision seulement à la prochaine grille (la précédente datait de 2022) |
| Synthèses | Tout nouveau fait change le hash du snapshot (`hashableContent` couvre tous les faits) : **toutes les synthèses en cache se régénèrent** à la visite suivante. Coût faible avant l'ouverture, plus cher après |

## 6. Liens avec FUT-176, FUT-179, FUT-185

### 6.1 FUT-176 : chiffres dépendants du statut d'unité urbaine

Les chiffres ci-dessous lisent le statut d'unité urbaine. Dans l'index étudié, il est reconstitué à partir de `hors_uu`, qui confondait « absent du référentiel » et « hors unité urbaine ». La branche FUT-176 ajoute `uu_statut` (C, B, I, H). Recalcul provisoire sur sa révision ee1d809a, **non fusionnée** (`sortie-fut176-ee1d809a-provisoire.txt`) :

| Chiffre | Index étudié (`hors_uu`) | Index FUT-176 (`uu_statut`) |
|---|---:|---:|
| Communes en unité urbaine | 7 460 | 7 464 |
| En unité urbaine, moins de 1 000 hab., dont rurales pour l'Insee | 1 392, dont 1 138 | 1 392, dont 1 138 |
| En unité urbaine mais rurales pour l'Insee (5-7) | 3 610 | 3 613 |
| Hors unité urbaine mais urbaines pour l'Insee (1-4) | 353 | 352 |
| Villes isolées | 1 221 (approximation : en unité urbaine et `uu_count` = 1) | 1 222 (statut I officiel), dont 853 bourgs ruraux |
| Orée d'Anjou, Porte des Pierres Dorées | hors unité urbaine | en unité urbaine |
| Eguisheim, Janville-en-Beauce, Bony | hors unité urbaine | hors unité urbaine (H, confirmé) |

Chiffre nouveau, utile au couplage du lot B (FUT-184) : la règle « ville » de FUT-176 (`peutDireVille` : ville-centre ou ville isolée, et 2 000 habitants ou plus) s'applique à **2 377 communes, dont 1 374 sont rurales pour l'Insee**, presque toutes des bourgs ruraux (Sèvremoine, Bressuire, Lamballe-Armor). Les deux sources ne mesurent pas la même chose : la continuité du bâti pour l'unité urbaine, la concentration de la population pour la grille. Les écrire côte à côte (« ville » et « bourg rural ») produirait une contradiction visible. C'est une décision du lot B, pas un défaut de FUT-176.

Procédure après fusion de FUT-176 : `./lancer_tout.sh <dossier> <révision fusionnée>`. Les scripts lisent `uu_statut` dès qu'il existe et reviennent à `hors_uu` sinon, en affichant la source utilisée. Seule la section « Unités urbaines » de `04` et la colonne `uu_statut` du panel doivent changer ; si un autre chiffre bouge, l'index a changé ailleurs. Comparer ligne à ligne avec `sortie-attendue.txt`.

### 6.2 FUT-185 : communes urbaines rangées en `rural_peri_urbain`

`comparateur-vie.ts` (l. 817-818) appelle `peuDense` toute commune de densité connue sous 1 500 hab/km². Cette condition émet cinq catégories : `rural_peri_urbain`, `periurbain_dependance_auto`, `rural_agricole`, `rural_forestier`, `faible_vie_locale`.

**Périmètre : 3 612 communes urbaines pour l'Insee (classes 1 à 4), 20,3 M d'habitants**, portent toutes `rural_peri_urbain` : 229 grands centres urbains, 509 centres urbains intermédiaires, 926 petites villes, 1 948 ceintures urbaines. L'ancien décompte (738 communes, 9,9 M) ne retenait que les classes 1-2.

**Textes réellement produits.** Le script `07` exécute le code de la révision, sans réécriture : `deriveCategoriesFromEntry`, comme la route `/api/landing-signals`, puis les fonctions de `recits.ts`, comme `FutureELanding.tsx` une fois la commune saisie et reconnue. Une phrase est **imputable à la densité** si elle disparaît quand on retire les cinq catégories ci-dessus.

| Texte (fonction) | Condition d'affichage | Communes | Habitants | Imputables à la densité |
|---|---|---:|---:|---:|
| Accroche : « dépendance à la voiture » (`getHeroCopy`) | aucune des catégories `littoral`, `montagne`, `urbain_dense_sud`, `mediterranee` ne passe avant | 2 792 | 14,0 M | 2 792 |
| Intro des questions : « dépendance à la voiture » (`getQuestionIntro`) | aucune des catégories littoral, montagne, `mediterranee`, `rural_agricole` ne passe avant | 1 523 | 9,0 M | 1 523 |
| Carte Mobilité : « le quotidien dépend largement de la voiture » (`getPreviewCards`) | toujours dans l'aperçu ; phrase « voiture » si une catégorie dite dépendante de la voiture est présente | 3 612 | 20,3 M | 3 322 |
| État vide : « déplacements » (`getEmptyStateCopy`) | ne parle pas de voiture | 3 094 | 16,6 M | 3 094 |

L'accroche ne parle pas de voiture pour 820 communes, parce qu'une autre catégorie passe avant (méditerranée 302, montagne 288, littoral 230). Exemples : Nîmes, Aix-en-Provence, Avignon reçoivent la carte « voiture » mais pas l'accroche ; Colmar, Quimper, Bourges, La Roche-sur-Yon reçoivent les deux. Pour 290 communes, la carte « voiture » viendrait aussi de `montagne`, sans lien avec la densité.

Ces nombres comptent les communes pour lesquelles le texte **serait produit** si un lecteur les saisit : ce ne sont pas des affichages mesurés. L'aperçu n'apparaît qu'après le chargement des données climat (squelette avant). Les arrondissements PLM ne sont pas concernés : densité nulle, donc `dense`.

### 6.3 FUT-179

La grille donne une catégorie PLM légitime au grain commune, sans faux grain d'arrondissement. Elle ne règle ni la densité chiffrée ni l'OSO des arrondissements.

## 7. Recommandation : GO conditionnel, lot B avant ouverture (FUT-184)

Pourquoi GO : l'hypothèse FUT-53 est **démontrée** sur données réelles (Corte, Arles, Avignon, Janville), la couverture est totale, la source est légère, stable et sous licence ouverte, et le coût de régénération est le plus bas maintenant.

Conditions, sans lesquelles c'est NO GO :
1. Ne pas recopier les libellés Eurostat bruts. Proposition à arbitrer (une convention se discute avant d'être codée) :

| Classe | Libellé lecteur proposé |
|---|---|
| 1 | Grand centre urbain |
| 2 | Ville dense de taille moyenne |
| 3 | Petite ville |
| 4 | Commune de la ceinture d'une ville |
| 5 | Bourg rural |
| 6 | Commune rurale |
| 7 | Commune rurale très peu peuplée |

« Ville dense de taille moyenne » et « Petite ville » parlent de la tache urbaine, pas de la commune (§1) : 611 « petites villes » ont moins de 5 000 habitants. Le libellé ne doit pas laisser croire à une taille communale.

2. N'exposer ni P1/P2/P3 (80 classes non retrouvées par la règle publiée, §3.2), ni une taille de commune tirée des seuils de tache.
3. Coupler au chantier FUT-176 : une seule réécriture de l'identité, une seule invalidation de cache. Trancher la cohabitation de « ville » (FUT-176) et des classes rurales de la grille : 1 374 communes concernées (§6.1).

**Périmètre du lot B** : ingestion dans l'index ; fait `place.density_grid` (source Insee, grille 2025, RP 2021, grain commune, PLM « à l'échelle de Paris ») ; `density.category` dérivé de la grille ; mise à jour de l'identité, du contrat et de la synthèse déterministe ; centralisation des seuils dupliqués de `territory-mood.ts` ; tests sur le panel ci-dessus et les contre-exemples. **Hors lot B** : comparateur, critères, `rural_peri_urbain` (FUT-185), OSO, score.

Décisions porteur : (1) libellés lecteur ; (2) règle de cohabitation entre « ville » et la classe de la grille.

Sources de méthode : [La grille de densité 2025 (Insee)](https://www.insee.fr/fr/information/8571524) · [Note complémentaire](https://www.insee.fr/fr/statistiques/fichier/8571524/note_complementaire.pdf) · [Fiche Insee 2025 (pa_ind_16_12)](https://www.insee.fr/fr/statistiques/fichier/8887956/pa_ind_16_12.pdf) · [Document de travail 2022-18](https://www.insee.fr/fr/statistiques/6686472) · [Méthode de constitution (2019)](https://www.insee.fr/fr/statistiques/fichier/2114627/methode-constitution.pdf) · [Eurostat, Applying the Degree of Urbanisation, 2021](https://ec.europa.eu/eurostat/en/web/products-manuals-and-guidelines/-/ks-02-20-499).
