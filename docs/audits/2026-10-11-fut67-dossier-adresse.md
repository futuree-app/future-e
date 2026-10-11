# FUT-67 — Audit du Dossier Adresse et premier lot (11/10/2026)

Branche `feat/fut-67-dossier-premium`, partie de `origin/main` `56906b5d`.

## 0. Méthode et limites de l'évaluation

Audit mené sur le **produit réel**, avec un serveur de développement de la branche et une session existante, sur trois dossiers réels du compte de test :

| Cas | Dossier | Type | Pourquoi |
|---|---|---|---|
| A, appartement en immeuble | 1 rue Saint-Dominique, Paris 7e | appartement, DPE F choisi, audit d'immeuble | DPE multiples, audit énergétique, périmètre patrimonial, grain PLM |
| B, maison | 17 rue des Cormorans, Châtelaillon-Plage | maison de 1978, DPE D | bâti, argiles, sinistralité, données communales vs adresse |
| C, territoire à enjeux | Châtelaillon-Plage (littoral, submersion) et Saint-Pardoux-la-Rivière (chaleur, sécheresse, restrictions d'eau) | commune | lecture prospective 2030/2050/2100, observations vs projections |

Limites, dites franchement :

- **Aucun appel au modèle pendant l'audit.** Le serveur tournait sans clé Anthropic, pour ne générer aucune synthèse ni écrire dans les dossiers réels. La « Lecture de ce logement » d'un dossier sans synthèse en cache affichait donc « La lecture n'a pas pu être générée » : ce n'est **pas** un défaut du produit. Les synthèses déjà en cache (Paris) ont été lues telles quelles.
- **Pas de dossier « ordinaire » neuf** : je n'ai créé aucun dossier, et je n'ai utilisé que des dossiers existants. Les trois cas restent ordinaires (aucun cas spectaculaire n'a été cherché), mais l'échantillon reste petit.
- **Linear n'a pas été lu** (connecteur non authentifié dans cette session). Les tickets cités viennent du brief.
- **Mobile** : contrôlé à 388 px de large, via une iframe de la même origine (la fenêtre du navigateur refusait d'être redimensionnée). Les modules Autour et Logement ont été vérifiés ; le hub et Territoire ne l'ont pas été en mobile.
- **Clavier, contrastes, `prefers-reduced-motion`** : non audités dans ce lot. Aucune animation n'a été introduite.

## 1. Territoire

**Forces.** Le passeport territorial, la bande des années CatNat (factuelle depuis FUT-69), la lecture prospective avec horizon (2030/2050/2100) et la distinction observé / projeté (ERA5 « déjà observé » contre DRIAS « projection ») sont solides. Les sources sont nommées sur chaque carte.

**Faiblesses.**
- **Catalogue de cartes uniformes.** La section « Les grands signaux du territoire » aligne environ quatorze cartes de même gabarit, en trois groupes : la hiérarchie est plate, tout pèse pareil. → P1, design (FUT-87).
- **« Lecture enrichie » (LLM) longue.** Trois paragraphes denses, et un cache ancien encore produit sous l'ancienne unité (« huit arrêtés de catastrophe naturelle »). → P1 éditorial (FUT-76 pour les caches).
- **La trajectoire du territoire n'est pas reliée au logement**, sauf par une phrase (« Avec la progression des nuits chaudes à X, les caractéristiques décrites ci-dessus prendront davantage d'importance »). → composition, FUT-20 / FUT-85.

## 2. Autour

**Forces.** Les noms et adresses des équipements (BPE + OSM), les limites honnêtes (« à vol d'oiseau », « présence, pas qualité »), le registre des autorisations d'urbanisme (rare et utile), l'îlot de chaleur et le grain IRIS de la motorisation (FUT-58).

**Faiblesses constatées sur Paris 7e.**
- **L'essentiel tout en bas.** « Ce que ce secteur met à portée », la seule synthèse du module, était rendue après cinq blocs de détail. → **P1, corrigé dans ce lot.**
- **Adresse répétée deux fois** de suite (« L'adresse de ce dossier » puis « Adresse analysée »). → **P2, corrigé.**
- **Carte vide en tête** : un grand encadré ne contenant que le lien « Analyser un autre bien », vestige du formulaire de saisie. → **P1 visuel, corrigé.**
- **Limites répétées** : « à vol d'oiseau » revient trois fois. → P2.
- **Équipement mal nommé par la source** : « Banque · CL Immobiliare » (une agence immobilière classée en banque dans la BPE). → P2 fiabilité (filtre ou réserve sur le nom).

## 3. Logement

**Forces.** L'attribution du DPE (FUT-59/68), le passeport du logement, la lecture du confort d'été depuis les champs du DPE (sans température simulée), le statut réglementaire au point, la réconciliation inondation (FUT-69), la sinistralité ONRN bornée, et la liste « À vérifier avant de décider ».

**Faiblesses.**
- **Audit énergétique illisible (cas A).** Cinq lignes brutes de la source (« scénario multi étapes "principal" » / « étape intermédiaire 1 »), dans l'ordre de l'API : l'état initial apparaissait en dernier, l'étape intermédiaire avant la première, et « 5 scénarios » comptait des lignes. Le lecteur ne voyait pas qu'il s'agit d'un point de départ et de deux parcours de travaux. → **P1, corrigé** (sans aller plus loin que FUT-62 : ni classe visée, ni coût, ni gain).
- **Formats à l'anglaise** : « 194.7 m² », « 9.7 kg CO₂ » à côté de « 418,3 kWh », et la date du DPE en ISO (« 2025-07-04 »). → **P1 de crédibilité, corrigé.**
- **Submersion marine reléguée (cas B, littoral).** Elle n'apparaît que dans une phrase résiduelle (« La commune est aussi recensée pour d'autres aléas… submersion marine… ») : la réconciliation inondation exclut la submersion par construction (comptes CatNat). Pour une maison à Châtelaillon, c'est l'enjeu que le lecteur cherche. → P1, à traiter avec la donnée littorale déjà présente dans Territoire (composition, FUT-85).
- **Absence de plan dite deux fois** : « Statut réglementaire » (« Aucune règle de construction particulière ») puis le bloc inondation (« Aucun plan… ne réglemente ce point »). → P2.
- **Audit d'immeuble et DPE du logement** : 503,5 kWh/m² (immeuble) contre 418,3 (logement). La mention « Audit de l'immeuble entier, pas de ce seul logement » est conservée juste au-dessus des valeurs. Une phrase de lien entre les deux reste à écrire (FUT-62).

## 4. Synthèse (hub du dossier)

**Forces.** La structure « Ce qui correspond / Ce qui correspond moins bien / À contrôler avant de vous engager », les preuves chiffrées, les vérifications non réalisées dites explicitement (« Géorisques ne répondait pas »), et les contrôles regroupés par échelle.

**Faiblesses.**
- **P0 : le titre peut contredire l'écran.** Paris 7e : « Signaux favorables · Sur ce qui a pu être examiné, Paris 7e Arrondissement va dans le sens de ce que vous avez demandé », alors que la carte juste dessous dit « Ce qui correspond moins bien : une métropole » (priorité « éviter les grandes villes »), et qu'un DPE F est signalé. Cause : dans `conclusion-plan.ts`, la branche `favorable` ne tient pas compte de `mismatchShown`, alors que la branche `neutral` le fait déjà (« on ne nie plus ce qu'on montre »). **Non corrigé dans ce lot** : le fichier porte le vocabulaire de posture (`POSTURE`, `voc`), en recouvrement possible avec FUT-26. À traiter en premier dans le lot suivant, en coordination.
- **Preuves illisibles hors contexte** : « PREUVE · 57 M » (altitude maximale de référence, condition « relief »). La phrase complète est au-dessus, mais la pastille seule ne dit rien. Source : `hard-constraints.ts` (conditions du projet, zone FUT-26). → P1, à coordonner.
- **Répétition** : « Faites chiffrer les travaux d'amélioration » apparaît en « À contrôler en priorité », puis dans la carte DPE, puis dans Logement. → P2 (le pointeur prioritaire pourrait renvoyer à la carte sans répéter la phrase).
- **Sur-titres monospace en capitales sur presque chaque bloc**, et cartes de même facture : la page se lit comme une suite de fiches. → P1 design (FUT-87).
- **Bloc « Votre projet » en bas du hub** : le texte du projet est incohérent (« dans l'esprit de Brest, … située dans le Sud-Ouest »). Zone FUT-26 (projet), non touchée.

## 5. Problèmes éditoriaux transverses

1. Sur-titres et pastilles en capitales monospace omniprésents : ils écrasent la hiérarchie typographique.
2. Les limites justes se répètent (« vol d'oiseau », « ne dit rien de ce logement »), au lieu d'être dites une fois au bon niveau.
3. Les libellés de source affleurent (catégories ADEME, codes de grain).
4. Le niveau 1 (« comprendre en 30 secondes ») existe dans le hub, mais pas dans chaque module : Autour l'avait en bas, Logement l'a dans une lecture LLM longue.

## 6. Problèmes visuels

- Cartes « glass » identiques à tous les niveaux : aucune différence de rythme entre un fait décisif et un détail.
- Grands chiffres sans contexte, à certains endroits (« +7,2 °C ») : celui-ci est correctement contextualisé ; les pastilles de preuve, elles, non.
- Le passeport du logement (scène 3D inclinée) est réussi et identitaire ; à garder.
- Mobile (388 px) : Autour et Logement passent sans débordement horizontal ; les valeurs restent alignées.

## 7. Données sous-exploitées (déjà récupérées)

| Donnée | Où elle est | Ce qui manque à l'écran | Priorité |
|---|---|---|---|
| Audit : `travaux` et `emission_ges_m2` par étape | `AuditScenario` (FUT-59) | Les travaux de chaque étape et les émissions après travaux ne sont pas affichés | P1, FUT-62 |
| Submersion marine et trait de côte | Territoire (carte Littoral), Géorisques (résidu communal) | Absente du Logement, sauf une phrase résiduelle | P1, FUT-85 |
| Qualité de l'air (Atmo) | `src/lib/atmo.ts`, pages publiques, aperçu | Absente du dossier payant | P2, à arbitrer (FUT-82) |
| Proximité des sources de bruit | moteur de décision (`sante-facts`), Autour (« Une voie ferrée à 350 m ») | Pas reliée au critère « éloignement du bruit » quand il est déclaré | P2 |
| Année de construction | DPE, passeport | Non reliée à la rénovation ou aux risques (argiles, amiante, plomb) | P2 |

## 8. Données manquantes réellement prioritaires (filtre FUT-82 : une ou deux)

| # | Question du lecteur | Source candidate | Couverture et grain | Coût | Valeur | Reco |
|---|---|---|---|---|---|---|
| 1 | « Ce bâtiment, c'est quoi ? » (année, hauteur, nombre de logements, matériaux) | RNB, puis BDNB (FUT-80) | National, bâtiment | Moyen (appariement adresse → bâtiment) | Forte : sépare logement et immeuble, ancre l'audit | **Retenir** pour le prochain lot |
| 2 | « Que peut-on construire à côté ? » | Zonage PLU (GPU, FUT-81) | Partielle (communes au GPU), parcelle | Moyen | Forte, avec le registre des permis déjà présent | **Retenir** en second |
| 3 | « Quelle copropriété, quelles charges ? » | RNIC (FUT-83) | Copropriétés immatriculées | Moyen à fort | Forte pour les appartements, faible sinon | Reporter |
| 4 | Qualité de l'air | Atmo (déjà intégré) | Commune | Faible | Moyenne | Restituer l'existant avant d'ajouter |

Aucune intégration n'est lancée dans ce lot.

## 9. Opportunités de composition (multi-échelles)

- **Climat × logement** (FUT-20) : nuits chaudes projetées (Territoire) × confort d'été du DPE (Logement). La phrase existe, mais elle n'est ni chiffrée ni située.
- **Littoral × maison** (FUT-85) : submersion et recul du trait de côte (Territoire) × maison en RDC (Logement).
- **Permis voisins × chaleur du secteur** : une autorisation qui crée des logements, dans un îlot de chaleur déjà marqué.
- **Audit d'immeuble × copropriété** : les parcours de travaux de l'immeuble sont une décision collective (vote en AG), à dire comme telle.

## 10. Matrice de priorisation

| Prio | Problème | Échelle | Impact | Statut |
|---|---|---|---|---|
| **P0** | Le titre « favorable » du hub contredit une carte d'écart affichée juste dessous | Synthèse | Conclusion injustifiée en tête d'un dossier payé | Documenté, **lot suivant** (`conclusion-plan.ts`, coordination FUT-26) |
| P1 | Audit énergétique en lignes brutes, dans le désordre | Logement | Donnée décisive illisible | **Fait** |
| P1 | Formats à l'anglaise, date ISO | Logement | Crédibilité | **Fait** |
| P1 | Conclusion d'Autour rendue tout en bas | Autour | Niveau 1 absent | **Fait** |
| P1 | Carte vide « Analyser un autre bien » | Autour | Première impression | **Fait** |
| P1 | Submersion absente du Logement en commune littorale | Logement | Enjeu majeur enfoui | Lot suivant (FUT-85) |
| P1 | Pastilles de preuve illisibles (« 57 M ») | Synthèse | Preuve non lisible | Lot suivant (coordination FUT-26) |
| P1 | Cartes uniformes, monospace omniprésent | Toutes | Hiérarchie plate | FUT-87 |
| P1 | Caches de synthèse produits sous d'anciens contrats | Territoire, Logement | Terminologie périmée | FUT-76 |
| P2 | Adresse répétée dans Autour | Autour | Bruit | **Fait** |
| P2 | Limites répétées (« vol d'oiseau » ×3) | Autour | Bruit | Lot suivant |
| P2 | Absence de plan dite deux fois | Logement | Bruit | Lot suivant |
| P2 | Action « Faites chiffrer… » ×3 | Synthèse, Logement | Bruit | Lot suivant |
| P2 | Équipement mal nommé par la BPE | Autour | Fiabilité locale | Lot suivant |
| P3 | Micro-interactions, animations | — | Faible | Hors lot |

## 11. Travail effectué dans ce lot

1. **Audit énergétique lu comme des parcours** (`parcoursAudit`, pur et testé) : un point de départ avant travaux, puis « Rénovation par étapes » (étape 1, 2, … finale) et « Rénovation en une seule fois », chaque étape avec sa consommation. Chaque ligne de la source est rendue exactement une fois. Aucune classe déduite (une classe DPE dépend aussi des émissions), aucun coût, aucun gain. Une limite dit ce que le bloc ne montre pas. La mention « immeuble entier, pas ce seul logement » reste juste au-dessus.
2. **Formats français** : surfaces (`formatSurfaceM2`) et émissions (`formatGesM2`), au dixième, avec un séparateur insécable, sur le même contrat que `formatKwhEpM2` ; date du DPE en clair (« 4 juillet 2025 », via `dateFr` existant).
3. **Autour, l'essentiel d'abord** : « Ce que ce secteur met à portée » passe en tête du module. La phrase sur les autorisations (« Cette configuration peut encore changer… ») descend dans le bloc des permis, sous la date de consultation du registre qui la borne, ce qui renforce l'invariant documenté au lieu de le contourner.
4. **Autour, moins de bruit** : l'adresse n'est plus répétée, et l'encadré vide autour du seul lien n'existe plus qu'en chargement ou en erreur.

Captures avant / après prises sur le dossier de Paris (desktop) et en mobile 388 px (Autour et Logement).

## 12. Recommandation pour le lot suivant

1. **P0, titre du hub** : dans `conclusion-plan.ts`, la branche `favorable` doit dire l'écart affiché (`mismatchShown > 0`), comme le fait déjà la branche `neutral`. À faire avec FUT-26, qui touche à la posture.
2. **Logement littoral** : remonter submersion et trait de côte dans « Ce à quoi cette adresse est exposée », avec leur grain (commune contre point), à partir des données déjà présentes (FUT-85).
3. **Audit, deuxième temps (FUT-62)** : les travaux de chaque étape et les émissions après travaux, puis la phrase qui relie l'audit d'immeuble au DPE du logement.
4. **Hiérarchie visuelle (FUT-87)** : une famille de blocs différenciée (fait décisif / détail / limite), et moins de capitales monospace.
5. **Données** : RNB/BDNB d'abord (le bâtiment), puis le zonage PLU, en appui du registre des permis.
