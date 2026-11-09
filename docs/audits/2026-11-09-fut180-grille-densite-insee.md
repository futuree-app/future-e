# FUT-180 · Grille communale de densité Insee 2025 : phase A (lecture seule)

Date : 09/11/2026. Index étudié : `data/comparateur-index.json.gz` de `origin/main` (51a493d0), 34 788 entrées.
Aucune modification de l'index, du code, des bases, de Linear. Scripts de reproduction dans le dossier jumeau.

## 1. La source

| Point | Constat |
|---|---|
| Fichier | `fichier_diffusion_2026.xlsx` (2,4 Mo), SHA-256 `8ebf3011…ca978`, mis en ligne le 15/05/2026 |
| Millésime | Grille **2025**, calculée sur le **RP 2021 carroyé** (1 km). Géographie au 01/01/2026. Population affichée : PMUN 2023 |
| Mise à jour | Insee : la mise à jour annuelle **ne réestime pas** le niveau, elle reporte le niveau « 2021 » dans la nouvelle géographie. Vérifié : fichiers 2025 et 2026 identiques (34 875 codes, **0 classe modifiée**) |
| Colonnes | `CODGEO, LIBGEO, DENS (3 postes), PMUN23, P1/P2/P3 (part de pop. dans chaque niveau), DENS_AAV, DENS7, LIBDENS7` + feuilles EPCI, bassin de vie, département |
| Licence | Licence Ouverte 2.0 (régime par défaut du site Insee), mention « Source : Insee » + date |
| PLM | Une seule ligne par commune : Paris 75056, Lyon 69123, Marseille 13055, toutes trois « Grands centres urbains ». **Aucun arrondissement** |

Les 7 classes (définitions Insee 2025) :

| Code | Libellé | Définition Insee |
|---|---|---|
| 1 | Grands centres urbains | communes densément peuplées, 50 000 hab. ou plus |
| 2 | Centres urbains intermédiaires | densément peuplées, moins de 50 000 hab. |
| 3 | Petites villes | 5 000 à 49 999 hab., densité moyenne, éloignées d'un centre urbain |
| 4 | Ceintures urbaines | 5 000 à 49 999 hab., densité moyenne, proches d'un centre urbain |
| 5 | Bourgs ruraux | 500 à 4 999 hab., densité moyenne |
| 6 | Rural à habitat dispersé | faible densité |
| 7 | Rural à habitat très dispersé | très faible densité |

**Piège de lecture majeur :** ces seuils de population portent sur la **tache de carreaux** (cluster), pas sur la commune. Mesuré : 1 564 « ceintures urbaines » sur 1 965 ont moins de 5 000 habitants (Eguisheim : 1 729), 611 « petites villes » sur 932 aussi. Un libellé repris tel quel suggère une taille de commune fausse.

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

**Où la grille apporte une information distincte** (19 % des communes, 27 % de la population) :

| Cas | Communes | Population | Exemples |
|---|---:|---:|---|
| A. « Peu dense » chez nous, urbaine pour l'Insee (centre compact dans une grande commune) | 541 | 1,27 M | Arles (67 hab/km²), Millau, Fontainebleau, Corte, Biscarrosse |
| B. « Peu dense », bourg rural | 3 396 | 6,04 M | Sèvremoine, Bressuire, Lamballe-Armor, Janville-en-Beauce |
| C. « Intermédiaire », rural à habitat dispersé (petite surface qui gonfle la moyenne) | 486 | 0,57 M | Vallet, Sarzeau, Noirmoutier-en-l'Île, Mont-Dauphin |
| D. « Intermédiaire », grand centre urbain | 229 | 3,02 M | Nîmes, Aix-en-Provence, **Avignon (1 414)**, Colmar, Quimper, Ajaccio |
| E. « Dense », centre urbain de moins de 50 000 hab. | 134 | 2,27 M | Saint-Nazaire, Sète, Angoulême (désaccord de vocabulaire seulement) |
| F. « Intermédiaire », bourg rural | 1 636 | 4,03 M | Urrugne, Guichen, Labenne |

**Où elle confirme seulement** : 28 306 communes (81,5 %, 72,5 % de la population), surtout « peu dense » × rural dispersé (25 004). Pour elles, la grille ne change pas la lecture.

## 3. Communes représentatives

| Commune | Aujourd'hui | Grille Insee | Ce que la grille change pour le lecteur |
|---|---|---|---|
| Corte | Commune peu dense, 52 hab/km² | Petite ville (92 % des habitants en zone urbaine) | **Corrige.** C'est une ville universitaire de 7 800 hab. ; « peu dense » égare |
| Janville-en-Beauce | Peu dense, 59 | Bourg rural | **Précise.** Nomme le bourg compact au milieu des champs |
| Eguisheim | Peu dense, 123 | Ceinture urbaine (97,7 % en zone urbaine) | **Ambigu.** Exact au sens Insee (tache de Colmar) mais évoque une banlieue ; et l'index la dit hors unité urbaine |
| Bony | Peu dense, 17 | Rural à habitat dispersé | Confirme |
| Châtelaillon-Plage | Intermédiaire, 976 | Ceinture urbaine | Ajoute « proche de La Rochelle », que l'unité urbaine dit déjà |
| Chartres | Dense, 2 248 | Grand centre urbain | Confirme |
| Levallois-Perret | Dense, 28 505 | Grand centre urbain | Confirme |
| Bondues | Intermédiaire, 738 | Ceinture urbaine | Confirme, en plus clair |
| Sète | Dense, 1 863 | Centre urbain intermédiaire (niveau 3 postes : « urbain intermédiaire ») | **Conflit de mots** si les deux sont affichés |
| Paris / Lyon / Marseille | Aucune catégorie aux arrondissements | Grand centre urbain, grain commune | **Comble un vide**, dit « à l'échelle de Paris » (doctrine FUT-43) |

Contre-exemples, où le libellé officiel brut induirait en erreur :
- **Mont-Dauphin** (place forte compacte, 162 hab.) : « Rural à habitat dispersé ». La classe signifie « pas de tache de 500 habitants », pas « maisons éparses ».
- **Vallet** (9 500 hab., bourg à centre marqué) : « Rural à habitat dispersé ». 6 861 communes de 500 hab. ou plus portent ce libellé, dont 490 de plus de 2 000.
- **Quimper, Aubagne, Saint-Brieuc** : « Grand centre urbain » avec P1 = 0 %. Sur **80 communes**, les parts P1/P2/P3 contredisent la classe (définition des « cities » Eurostat ajustée). Les parts ne doivent donc pas servir à justifier la classe.

## 4. Scénarios

| | A. Conserver | B. Remplacer la catégorie | C. Deux faits distincts |
|---|---|---|---|
| Valeur décisionnelle | Faible : 83 % des communes dans une seule case ; Avignon « intermédiaire », Corte « peu dense » | Forte sur 19 % des communes, nulle ailleurs ; nomme bourg / petite ville / ceinture | Même gain que B |
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
- `comparateur-vie.ts` l. 817 (seuil 1 500 dupliqué, catégories d'accueil) ;
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

## 6. Liens avec FUT-176 et FUT-179

- **FUT-176** touche le même `summaryHead`. La grille lui fournit un arbitre officiel pour « Ville » : sur 1 392 communes en unité urbaine de moins de 1 000 habitants, **1 138 sont rurales pour l'Insee**. Réciproquement 353 communes hors unité urbaine sont urbaines pour l'Insee (Eguisheim). Faire les deux séparément, c'est réécrire deux fois l'identité et invalider deux fois le cache.
- **FUT-179** : la grille donne une catégorie PLM légitime au grain commune, sans faux grain d'arrondissement. Elle ne règle ni la densité chiffrée ni l'OSO des arrondissements.
- **Constat voisin, hors périmètre** : `comparateur-vie.ts` classe `rural_peri_urbain` toute commune sous 1 500 hab/km². **738 communes urbaines pour l'Insee (9,9 M d'habitants)** sont concernées, dont Nîmes, Aix, Avignon, Colmar. Les récits d'accueil peuvent alors leur parler de « dépendance à la voiture » (quand aucune catégorie prioritaire ne passe avant). À traiter dans un ticket séparé.

## 7. Recommandation : GO conditionnel, lot B avant ouverture

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

2. Ne jamais exposer P1/P2/P3 (80 contradictions) ni dériver une taille de commune des seuils de cluster.
3. Coupler au chantier FUT-176 (une seule réécriture de l'identité, une seule invalidation de cache).

**Périmètre du lot B** : ingestion dans l'index ; fait `place.density_grid` (source Insee, grille 2025, RP 2021, grain commune, PLM « à l'échelle de Paris ») ; `density.category` dérivé de la grille ; mise à jour de l'identité, du contrat et de la synthèse déterministe ; centralisation des seuils dupliqués de `territory-mood.ts` ; tests sur le panel ci-dessus et les contre-exemples. **Hors lot B** : comparateur, critères, `rural_peri_urbain`, OSO, score.

Décisions porteur : (1) GO / NO GO ; (2) libellés lecteur ; (3) couplage avec FUT-176 ; (4) ouvrir un ticket pour `rural_peri_urbain`.
