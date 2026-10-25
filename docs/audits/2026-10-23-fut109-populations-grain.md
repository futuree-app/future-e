# FUT-109 · Trois populations à 0 : un défaut de grain, pas trois communes vides

Audit et correctif préparés les 23 et 24/10/2026. Branche `bonjourfuturee/fut-109-populations-communes-deleguees` (worktree `.claude/worktrees/fut109`), rebasée sur `main` @ `de001b2b` (après #84 et #82). Rien n'est poussé : voir §9.

**Révision du 24/10.** La première version (commit `11f60680`) corrigeait 71 communes en supposant la source dans la géographie du 01/01/2023. Vérification faite sur les fichiers Insee, la source est dans la **géographie du 01/01/2024**. Les 11 communes nouvelles du 01/01/2024 y sont déjà au bon grain (somme exacte de leurs communes fondatrices). Le correctif porte donc sur **60 communes**. La révision traite aussi les scores dont le dénominateur restait calculé sur l'ancien territoire (§5), et les libellés de millésime (§6).

**Seconde révision du 24/10, après #84.** Le « blocage ADEME » de la première révision était trop large : ADEME mêle **deux géographies** sous un même code, et la densité (donc le calme), l'éloignement, la centralité, les logements vacants, le nombre de logements sociaux et le revenu médian sont **déjà au périmètre fusionné**. Seuls l'APL, l'air, la pression agricole, le taux de logements sociaux et le boisement décrivent l'ancien territoire : ils ne sont plus lus pour les 51 communes concernées, et sont rattachés exactement pour les 4 changements de code (§5.5). La mobilité est recalculée exactement (§5.6). Le point bloquant de cette révision (un critère non noté comptait 0 dans le classement) est **levé** par l'arbitrage du porteur : classement sur les seuls critères mesurés, couverture des priorités dite, aucune promotion. Ses conséquences sont documentées à part : `docs/audits/2026-10-24-fut109-classement-couverture.md` (§5.8).

## 1. En une phrase

Les trois codes ne sont **pas des communes déléguées** : ce sont des **communes de plein exercice rétablies le 01/01/2024**. La source de l'index n'a pas de population 2021 à leur grain, et elle écrit `0`. Le même défaut fausse en silence **57 autres communes** : la commune d'origine de ces rétablissements, les rétablissements et fusions du 01/01/2025, et les changements de code depuis le 01/01/2024. Exemple : Saint-Denis compte 113 942 habitants au lieu de 149 077. Le défaut touche aussi les **scores** qui divisent par cette population ou qui lisent la même géographie.

## 2. Les faits, dans les sources primaires

**Référentiel de l'index** : la liste des 34 788 communes vient de DRIAS (`data/data_climat.json`). Elle correspond exactement au **COG au 01/01/2025**, hors les trois villes PLM, remplacées par leurs 45 arrondissements. Le COG au 01/01/2026 est identique pour la métropole.

**Source de la population** : ADEME `data_communes` (data-fair `8ggfo546-mtjxy4lbqxcl462`), champ `population_totale_2021`. C'est la **population municipale (PMUN) Insee 2021**, portée dans la **géographie au 01/01/2024**. Les contrôles suivants sont reproduits à chaque construction du référentiel (§7) :
- **34 722 valeurs gardées sur 34 722** égalent la population légale 2021 de leur territoire.
- Une commune au territoire inchangé porte le PMUN 2021 de la commune.
- Une **commune nouvelle du 01/01/2024** porte la **somme exacte** des PMUN 2021 de ses fondatrices : Bazeilles 2 502 = 2 365 + 137, Oullins-Pierre-Bénite 37 628 = 27 113 + 10 515. Elle est au bon grain.
- Une **commune rétablie le 01/01/2024** vaut `0` : le recensement 2021 ne la sépare pas de sa commune d'origine, qui garde son ancien périmètre (Essarts-en-Bocage 9 399 au lieu de 6 851).
- Après le 01/01/2024, la source garde la valeur d'avant le mouvement, ou n'a pas le code (transfert de chef-lieu).

La base Insee « Évolution et structure de la population 2021 » (`populate-demographie.py`) suit la même géographie, avec les mêmes trous. Les rétablies y figurent sans valeur, et les communes absorbées en 2024 n'y figurent plus.

| Code | Statut au COG 2025 | Histoire (`v_mvt_commune_2025.csv`) | ADEME 2021 | Insee 2022 (géo 2024) | **Insee 2023 (géo 2025)** |
|---|---|---|---|---|---|
| 60694 Les Hauts-Talican | commune | Villotran ; 01/01/2019 fusion dans Les Hauts-Talican (60054) ; **01/01/2024 rétablissement** : Beaumont-les-Nonains reprend 60054, le reste garde le nom sous 60694 | **0** | 547 | **542** |
| 85165 L'Oie | commune | déléguée d'Essarts-en-Bocage de 2016 à 2023 ; **rétablie le 01/01/2024** | **0** | 1 264 | **1 250** |
| 85212 Sainte-Florence | commune | idem | **0** | 1 338 | **1 359** |
| 85084 Essarts-en-Bocage | commune nouvelle | perd L'Oie et Sainte-Florence le 01/01/2024 | 9 399 (avant séparation) | 6 835 | **6 851** |
| 60054 Beaumont-les-Nonains | commune | rétablie le 01/01/2024 | 878 (ex-Hauts-Talican) | 337 | **339** |

**Absence, inconnue, zéro** : ce sont trois choses distinctes. Le `0` d'ADEME n'est **pas** une population nulle, c'est une absence au grain. À l'inverse, six villages détruits de la Meuse (Fleury-devant-Douaumont…) ont réellement **0 habitant** selon l'Insee. ADEME ne les porte pas, et l'index les laisse `null` (§8).

## 3. La règle

**Règle** (`scripts/lib/population-grain.mjs`) : la valeur 2021 est gardée si le territoire **et** le code sont inchangés depuis le 01/01/2024, rétablissements de cette date compris. Sinon, l'index reçoit la **population de référence Insee 2023** (PMUN, limites au 01/01/2025), publiée dans la géographie même du référentiel.
- Mouvements du COG pris en compte : 21, 31, 32 et 33 pour le territoire, 41 et 50 pour le code.
- Aucune somme reconstituée, aucun report d'une commune nouvelle sur une déléguée.
- Sans valeur officielle, la population est `null`, jamais `0`.
- **Preuve intégrée** : `construire-referentiel.mjs` refuse si une valeur gardée n'égale pas la population légale 2021 de son territoire. Contrôle : avec la géographie de 2023, il refuse bien (8 écarts).

| Groupe (60 communes) | Nombre | Exemple |
|---|---|---|
| Rétablissements du 01/01/2024 (rétablies et communes d'origine) | 5 | L'Oie 0 → 1 250 ; Essarts-en-Bocage 9 399 → 6 851 |
| Rétablissements du 01/01/2025 (Cantal) | 5 | Neussargues-Moissac 1 653 → 824 ; Celles, absente → 217 |
| Communes nouvelles du 01/01/2025 | 46 | Saint-Denis 113 942 → 149 077 |
| Changements de code (transferts de chef-lieu) depuis le 01/01/2024 | 4 | Orée d'Anjou, absente → 17 162 |
| *Retirées par rapport au 23/10 : fusions du 01/01/2024, déjà au grain* | *11* | *Bazeilles garde 2 502* |

## 4. Consommateurs de la population elle-même

Les mesures comparent l'index de `main` à l'index régénéré dans un espace isolé (§7).
- **Accueil, pastille « taille »** : `Environ 0 habitants à L'Oie.` devient `Environ 1 250 habitants à L'Oie.` Même effet sur Sainte-Florence et Les Hauts-Talican. Les dossiers Territoire et Adresse affichent le même texte.
- **Comparateur, éligibilité** (plancher de 1 500 habitants) : 10 changements.
  - 9 communes entrent : Orée d'Anjou (17 162), Porte des Pierres Dorées, Aurseulles, Conques-en-Rouergue, Pays-de-Montbenoît, Plumieux, Verdun-Ciel, Val-de-la-Hune, Sauzé-entre-Bois.
  - 1 sort : Neussargues-Moissac (824).
- **Taille** : 12 catégories changent (6 « incertain » → village, 2 → petite, 4 village → petite) et 8 paliers passent de « Plutôt rural » à « Petite ville ».
- **Homonymes** : « Sainte-Florence » désignait celle de Gironde (147 habitants), elle désigne désormais celle de Vendée (1 359).
- **`uu_pop`** : 512 communes changent. L'unité urbaine de Paris passe de 10 858 372 à 10 893 507 habitants.
- **Lectures ADEME à l'exécution** (`src/lib/commune-data.ts`) : AskFuture, synthèse logement et repli du dossier Territoire lisaient la valeur brute, soit **0 pour L'Oie**. Elles reçoivent désormais la même population que l'index (§6).

## 5. Scores et indicateurs à dénominateur démographique

Chaque score a été **rejoué localement, sans réseau**, sur les caches du checkout principal. **Reproduction exacte** de l'index de `main` (0 écart) pour la vie locale, la démographie et la part étudiante (rentrée 2024), et pour les rayons BPE. Les effets sont mesurés sur ce que lit le lecteur : verdicts de rang des règles d'accord et de désaccord (seuil des 20 % extrêmes), paliers ambiants et seuils de catégorie.

**Différence de millésime ou de territoire** :
- **Différence de millésime** : la valeur décrit le bon territoire à une autre date (2021, 2022 ou 2023). Elle est **acceptée et datée** (§6).
- **Incompatibilité de territoire** : le numérateur, le dénominateur ou la valeur décrivent un autre territoire que la commune actuelle. Elle est **corrigée** quand les sources le permettent exactement, sinon **abstention**.

### 5.1 Vie locale (`vieLocale`) : incompatibilité de territoire, corrigée

Le score est une densité : compte / (population + 1 000).
- **Dénominateur** : la population de l'index. Elle est désormais au grain.
- **Lieux** (OSM) : rattachés au centroïde le plus proche parmi les communes du COG 2025. Ils sont déjà au bon territoire.
- **Associations** (RNA) : rangées sous le **code de la commune de l'adresse**, souvent un code disparu. Orée d'Anjou compte 15 associations sous 49126 et 511 sous son ancien code 49069. Saint-Denis compte 3 283 associations, et 538 de plus sous Pierrefitte. Corriger le seul dénominateur aurait aggravé l'écart : Orée d'Anjou passait de 88 à 2.

**Correctif** :
1. **Codes repris** : une association rangée sous une commune absorbée, ou sous l'ancien code d'un transfert de chef-lieu, est comptée dans la commune qui a repris ce code. Le rattachement est exact, puisque c'est le territoire actuel de cette commune : 1 812 associations sont concernées.
2. **Abstention pour les 10 communes touchées par un rétablissement** : le RNA ne répartit pas leurs associations, qui restent rangées sous la commune d'origine (27 associations de L'Oie sont rangées sous Essarts-en-Bocage). Les répartir par le nom de commune saisi dans l'adresse serait une reconstitution sur texte libre : refusée.

**Effets** (verdict au seuil de 20 %) :
- **Dans les 60 communes**, 50 scores changent.
  - Abstentions : 10, rendues « incertain ». L'Oie (54) et Sainte-Florence (83) n'affichent plus de rang favorable fondé sur une population nulle.
  - Le verdict change pour 9 communes. Passent de « favorable » à « neutre » : Saint-Denis (63 → 49), Orée d'Anjou (88 → 31), Pays-de-Montbenoît (64 → 40), Laigné-Saint-Gervais, Sauzé-entre-Bois, Cugand-la-Bernardière. Passent de « en retrait » à « neutre » : La Neuville-au-Temple et Morville-le-Héron. Tannay-le-Mont-Dieu passe de « neutre » à « en retrait ».
- **Hors des 60**, le percentile bouge d'un point pour 497 communes. Cela fait changer 11 verdicts, 19 paliers ambiants et 17 seuils de catégorie (12 au seuil « faible » de 30, 5 au seuil « forte » de 60), tous en limite de seuil.

### 5.2 Démographie (`demographie`) : incompatibilité de territoire, abstention

Le taux annuel 2015-2021, la part d'arrivants et le récit sont calculés par l'Insee sur le territoire de 2024 : pour les 56 communes au territoire modifié depuis, c'est l'**ancien périmètre**. La population de l'index n'y sert que de poids de lissage. Recalculer ce score avec la population corrigée ne change donc pas le récit, mais garde un récit faux.

**Preuve que le récit change**. Diagnostic non publié : pour 45 fusions, les comptages P15 et P21 des communes fondatrices permettent de reconstituer **exactement** le taux du nouveau territoire. Dans **17 cas sur 45, le récit change de catégorie**. Exemples : Pern-Lhospitalet passe de « gagne des habitants et attire » à stable, Les Trois-Saints et Plumieux de « gagne » à « perd », Hesdin-la-Forêt de stable à « perd ».

**Pourquoi ne pas publier cette reconstitution** :
- La part d'arrivants n'est pas additive : un déménagement entre deux communes fondatrices compte comme une arrivée.
- Le récit en dépend.
- Les rétablissements ne sont pas reconstituables avec cette base.

**Correctif** : **abstention**, la démographie est `null` pour les 56 communes au territoire modifié (49 en avaient une).
- Le comparateur ne la cite plus (ni raison, ni arbitrage). **Correction du 24/10** : la version précédente affirmait « sans pénalité » ; c'est faux, le score de compatibilité la compte pour 0 (§5.8).
- Le dossier n'affiche ni carte ni phrase.
- Le rang passe à « incertain ».

Effet : 49 communes perdent un récit qui décrivait un autre territoire. Hors des 60, 156 percentiles bougent d'un point, et 2 récits changent par l'effet du tercile d'arrivées recalculé (78143, 91045).

**Changements de code seuls** (arbitrage du 24/10) : Conques-en-Rouergue, Aurseulles, Porte des Pierres Dorées et Orée d'Anjou gardent leur territoire (MOD 50, transfert de chef-lieu). La base les publie sous l'ancien code ; cette ligne est la leur, **rattachée exactement** (`codes_rattaches()`, selftest). Elles passent de « non notée » à une démographie : Orée d'Anjou 91, Porte des Pierres Dorées 97, Aurseulles 19, Conques-en-Rouergue 4.

**Attention** : « non notée » n'est pas neutre dans le score de compatibilité du comparateur (§5.8).

### 5.3 Part étudiante (`etudes_dyn`) : pas d'incompatibilité, non relancée

Le score est l'effectif du MESR divisé par la population de l'unité urbaine, ou de la commune hors unité urbaine.
- **Avec la population corrigée** : les 11 communes aujourd'hui `null` recevraient 88, la valeur conventionnelle de tous les bassins de moins de 5 000 habitants (voir §8). Aucun autre écart notable : l'unité urbaine de Tréguier gagne un point par simple effet de percentile.
- **Pourquoi elle n'est pas relancée** : la source MESR est passée à la rentrée 2025. Relancer ce score changerait 425 communes, hors du périmètre de FUT-109.
- **Conséquence** : les 11 communes restent non notées, une abstention de fait. C'est honnête, et c'est documenté dans `meta.population.conventions`.

### 5.4 Équipements (BPE : écoles, culture, accès au supérieur, attestations d'absence) : aucun effet

Le rayon de recherche dépend de la taille de ville (seuils de 30 000, 100 000 et 500 000 habitants). Recalculé avant et après sur les 34 788 communes, **aucun rayon ne change**, et les rayons publiés sont retrouvés exactement. Les comptages se font autour du centroïde et ne dépendent pas du territoire.

### 5.5 Indicateurs ADEME : deux géographies sous un même code, champ par champ

**Le constat** (`scripts/lib/perimetre-ademe.mjs`, `data/perimetre-ademe-cog2025.json`). Les **lignes** d'ADEME `data_communes` sont celles du 01/01/2024 : les 64 communes absorbées le 01/01/2025 y ont encore leur ligne. Mais une partie des **champs** vient de sources déjà passées au COG 2025. Le test, refait à chaque construction : un champ renseigné pour les communes absorbées est dans la géographie 2024 ; un champ dense, vide pour toutes, et renseigné pour les communes nouvelles, est au COG 2025.

**Preuve que les champs « 2025 » décrivent bien la commune fusionnée**, et pas seulement l'absence des absorbées (le script refuse sinon) :
- population 2022 : **46/46** communes nouvelles égalent la somme exacte des populations légales 2022 de leurs communes (Saint-Denis 148 907) ;
- densité 2022 : pour **46/46**, la surface implicite (population ÷ densité) est la surface fusionnée. Rapport à la surface fusionnée : 0,966 à 1,010 (bande nationale p01–p99 : 0,926–1,033) ; rapport à l'ancienne surface : 1,015 à 22,6.

| Indicateur | Champ ADEME | Géographie | Communes fusionnées ou rétablies en 2025 (51) | Changements de code (4) |
|---|---|---|---|---|
| Densité → **calme**, typologie | `densite_de_population_2022` | **2025** | **gardée** (au bon périmètre) | non publiée (null) |
| Éloignement des services | `part_de_la_population_eloignee…` | 2025 | gardé | null |
| Centralité → accès aux services | `niveau_de_centres_d_equipements…` | 2025 | gardée | non publiée : **non noté** (clé retirée) |
| **Soins** (APL) | `apl_aux_medecins_generalistes` | **2024** | **abstention** | **rattachée** de l'ancien code |
| Air (PM2,5, NO₂ ; PM10, O₃ à l'exécution) | `moyenne_annuelle_de_concentration_…` | 2024 | abstention | rattaché |
| Pression agricole (IFT, part SAU, bio) | `ift_t`, `ift_h`, `p_sau`, `p_bio` | 2024 | abstention | rattachée |
| **Logement** : taux de logements sociaux | `taux_de_logements_sociaux_percent` | 2024 | abstention | rattaché |
| **Logement** : nombre de logements sociaux, logements vacants | `nombre_de_logements_sociaux_rpls_2023`, `…vacants_2022` | 2025 | gardés | null |
| **Revenus** : revenu médian | `mediane_du_revenu_disponible_par_uc_2021` | 2025 | gardé | null |
| **Revenus** : écart à la médiane nationale | `taux_dinferiorite_…` | 2024 | abstention | rattaché (à l'exécution) |
| Vieillissement, boisement | `taux_devolution_…65_ans…`, `tauxboisement` | 2025, 2024 | gardé, abstention | null, rattaché |
| Incendies | `nombre_dincendies` | **indécidable** (champ clairsemé) | abstention, par prudence | rattaché |

**Pourquoi l'abstention, et pas un recalcul**, pour les champs 2024 des communes fusionnées : un APL, une concentration de polluants ou un indice de traitement ne s'additionnent pas, et la méthode des producteurs n'est pas publiée au niveau qui permettrait de la refaire exactement. Pour un changement de code seul, le territoire est identique : la valeur de l'ancien code est la sienne. Son percentile se lit dans la distribution des autres communes, inchangée.

**Où c'est appliqué** : `populate-population-grain.mjs` (et, pour une reconstruction complète, `build-comparateur-index.mjs` et `populate-hlm.mjs`) ; à l'exécution, `commune-data.ts` interroge l'ancien code d'un changement de code et écarte les champs 2024 d'un territoire modifié. AskFuture dit que ces indicateurs ne sont publiés que pour l'ancien territoire, sans les estimer. Les rétablissements du 01/01/2024 sont au bon grain dans les deux géographies : rien ne change pour eux.

**Densité inconnue** : 15 communes de l'index n'ont pas de densité hors arrondissements PLM (8 du référentiel, sans ligne ADEME). La typologie de l'accueil les rangeait en « cœur urbain dense » (`densite == null` valait arrondissement). Elle ne choisit plus d'angle pour elles.

**Effets mesurés** (index de `main` → index régénéré) :
- 51 communes perdent APL, air, pression agricole et taux de logements sociaux ; 4 les retrouvent (Orée d'Anjou : APL 2,784, 47ᵉ percentile).
- Hors des 60 : **aucune valeur** de ces champs ne change (percentiles de rattachement lus sans modifier la distribution).
- Rangs `acces_soins` : 54 communes du référentiel ; ailleurs, décalage de 2 points de base au plus (43 valeurs retirées de la distribution).

### 5.6 Mobilité (`mobilite`, MOBPRO 2022) : recalcul exact

Le RP 2022 est dans la géographie du 01/01/2024. Rejeu exact de `main` : **0 écart sur 34 788**. Les navetteurs d'une commune fusionnée sont ceux de ses communes d'origine : leurs pondérations individuelles s'**additionnent exactement**. Changements de code : rattachés. Rétablissements du 01/01/2025 (Neussargues et les 4 rétablies du Cantal) : la base ne répartit pas l'ancien territoire, **abstention**.
- Saint-Denis : part de la voiture 21,9 % → **24,9 %** (Pierrefitte comprise) ; Orée d'Anjou, Aurseulles, Conques-en-Rouergue, Porte des Pierres Dorées : notées ; Neussargues-Moissac : non notée.
- Hors des 60 : 266 percentiles bougent d'un point ; rangs `faible_dependance_auto` décalés de 127 points de base au plus.

### 5.7 Logement, prix d'achat (DVF) : constat, ticket séparé

DVF range une vente sous le code de la commune **l'année de la vente** : La Moncelle (08294) garde ses ventes 2021-2023 sous son code, Bazeilles ne les compte pas ; L'Oie n'a aucune vente à son code, même en 2024. Le défaut touche **toutes les communes nouvelles depuis 2021**, pas seulement les 60, dans un module **non scoré** (niveau de prix narratif). De plus, `populate-logement.mjs` ne reproduit pas `main` (33 099 communes diffèrent) : l'index a été produit avant le correctif « une seule vente de logement » (`ef77afdd`). Un recalcul exact des 60 imposerait de régénérer les prix de toute la France : **hors FUT-109, ticket recommandé**. Loyers (ANIL) : au COG 2025, corrects.

### 5.8 Classement : les seuls critères mesurés, une couverture dite (résolu)

Le score de compatibilité comptait un critère non noté comme 0 : les abstentions de FUT-109 reléguaient les communes concernées (Haut Valromey, 25 908ᵉ pour les soins). Arbitrage du porteur du 24/10 : un `null` ne contribue ni au numérateur ni au dénominateur, un vrai 0 reste un 0, et la couverture des priorités déclarées se dit à part. Une commune dont une priorité n'est pas mesurée passe après toutes les communes mesurées, sans palier de correspondance, et sa carte dit ce qui n'est pas mesuré ici. L'invariant historique de FUT-129 est remplacé par la méthode ; ses garanties sur l'inondation sont intactes.

Pour que l'absence d'un critère **implicite** ne promeuve personne, les 45 arrondissements de Paris, Lyon et Marseille reçoivent l'emploi de la zone d'emploi de leur ville (Insee, ZE2020) : rattachement exact, l'indicateur étant défini à cette maille.

Conséquences (document séparé, `2026-10-24-fut109-classement-couverture.md`) : sur 984 recherches, **aucune** composition ni aucun ordre des trois cartes ne change par la formule ; 12 libellés deviennent explicites. Sans la garde, 1 594 communes à couverture incomplète entreraient dans les 100 premières.

### 5.9 Conséquences des corrections de données sur le classement

Mesure sur les mêmes 984 recherches (vrai moteur, ancienne formule pour isoler les données) :
- **Populations, démographie, indicateurs ADEME, mobilité** (`main` → branche sans l'emploi des arrondissements) : les trois cartes changent dans **21 recherches**, toutes en Seine-Saint-Denis et en Vendée. Saint-Denis et Cugand-la-Bernardière (85076) n'y sont plus mises en avant pour l'accès aux soins ou une faible pression agricole, qui décrivaient leur ancien territoire ; leurs voisines mesurées prennent leur place. Aucun palier, aucune raison ne change ailleurs.
- **Emploi des arrondissements** : **118 recherches** changent. Paris, Lyon et Marseille, jusqu'ici pénalisées par une note d'emploi absente, reviennent dans les trois cartes sur des critères urbains (culture, train, transports du quotidien, écoles) ; 8 recherches passent à une correspondance « parfaite », 12 paliers montent.

### 5.10 Hors index

`populate-dependance-auto.js` écrit une table Supabase (200 premières communes, densité ADEME). C'est la production : non touchée.

## 6. Provenance : millésimes et conventions

**Ce qui était faux** : plusieurs formulations datent toute la France de 2021.
- La population du dossier Territoire (`vintage: "2021"`).
- La phrase des contraintes de taille (« N habitants en 2021 »).
- Le prompt d'AskFuture (« Population (2021) », sur la valeur ADEME brute).

**Ce qui est livré** :
- `src/lib/population-millesimes.generated.ts`, généré par `construire-referentiel.mjs` et contrôlé par un test contre le JSON : les 60 communes, leur millésime, leur dernier mouvement et leur unité urbaine, plus les **12 unités urbaines qui comptent une commune reprise**. 7 mêlent 2021 et 2023, et 5 sont entièrement en 2023.
- `src/lib/population-millesime.ts` : `millesimePopulation`, `millesimesAgglomeration`, `perimetreAnterieur` (date d'une fusion ou d'un rétablissement postérieur, plus jamais un simple changement de code), `enMillesimes`.
- `src/lib/perimetre-ademe.generated.ts`, généré par `construire-perimetre-ademe.mjs` et contrôlé par un test : les champs ADEME de 2024 et la conduite par commune (§5.5).
- Dossier Territoire : le millésime de la population suit la commune (« 2023 » pour L'Oie).
- Contraintes de taille : « (149 077 habitants en 2023) » pour la commune de Saint-Denis, « (10 893 507 habitants selon les chiffres Insee 2021 et 2023) » pour l'agglomération de Paris. La phrase est inchangée ailleurs, et une référence enregistrée avant le correctif garde sa phrase.
- `commune-data.ts` : la population ADEME brute est remplacée par celle du référentiel, avec son millésime. Les champs ADEME de 2024 ne sont pas lus pour un territoire modifié ; l'ancien code est lu pour un changement de code. AskFuture affiche le bon millésime et dit quels indicateurs ne sont publiés que pour l'ancien territoire (§5.5).
- Métadonnées de l'index : `meta.population` (source, grain, règle, **conventions**), `meta.uuPop.millesimes` et l'approximation « population/densité ».
- L'accueil n'écrit pas d'année (« INSEE · population communale ») : rien à changer.

**Conventions** (inscrites dans `meta.population.conventions`) :
- **Population communale** : 2021 pour toutes les communes, sauf les 60 du référentiel (2023). Le millésime affiché suit la commune, jamais « 2021 » pour toute la France.
- **Unités urbaines** : `uu_pop` est la somme des populations communales de l'index. Une unité urbaine qui compte une commune du référentiel mêle 2021 et 2023, et se dit « selon les chiffres Insee 2021 et 2023 ». Cinq unités urbaines, entièrement composées de communes reprises, sont en 2023.
- **Scores dépendants** : voir §5 (codes RNA repris, abstentions, codes rattachés, mobilité sommée, rangs recalculés pour quatre critères).
- **Indicateurs ADEME** : `meta.population.conventions.indicateursAdeme` et `data/perimetre-ademe-cog2025.json` (géographie de chaque champ, preuves, traitement de chaque commune).
- **Absences** : les six villages de la Meuse sont `null` (« non lue »), pas `0`.
- La migration générale vers 2023 reste hors périmètre (FUT-78).

## 7. Validation

Artefacts régénérés dans une **copie isolée** (scratchpad), depuis l'index de `main` @ `de001b2b`, puis rapatriés.

| Contrôle | Résultat |
|---|---|
| `npm test` (suite seule) | **3 086/3 086** |
| `tsc --noEmit` | 0 erreur |
| `eslint` (fichiers modifiés) | 0 erreur (1 avertissement préexistant sur `main`) |
| selftests Python (vie locale, démographie, mobilité) | OK |
| `verifier-equivalence.mjs` (34 791 codes) | 104 373/104 373 lectures identiques |
| Reproductibilité | deux rejeux complets depuis `main` : empreintes identiques (`da8866d5…` index, `f92d0d8f…` accueil) |
| `construire-perimetre-ademe.mjs` | preuves 46/46 ; refuse un champ de l'index à géographie indécidable |
| Rangs | 0 bande modifiée hors des clés déclarées (`vie_locale`, `croissance_demographique`, `acces_soins`, `faible_dependance_auto`, `viabilite_emploi`) |
| Couverture (`fut109-couverture-classement.test.ts`) | 11 scénarios, dont le classement national sur 8 critères sujets aux absences |

**Diff de l'index, champ par champ** (`main` → branche). Arrondissements PLM : `emploi` (45). Dans les 60 : `population` 60, `uu_pop` 60, `vieLocale` 50, `demographie` 53, `mobilite` 50, APL/air/agri/taux HLM 51, `agri.equip` 8 (retiré). **Hors des 60, seuls changent** : `uu_pop` (452 communes de 12 unités urbaines), et des percentiles d'un point au plus par effet de distribution (vie locale ~500, démographie 156, mobilité 266), 2 récits démographiques, et les rangs des quatre critères recalculés (décalages de quelques points de base ; 332 au plus pour `vie_locale`, groupes d'ex æquo). **Aucun autre champ** ne change ; `meta` : `population`, `uuPop`, `countWithPopulation`.

## 8. Constats hors périmètre (antérieurs à FUT-109, non corrigés)

Diagnostics bornés du 24/10, sans modification de l'index. Aucun ticket Linear existant ne les couvrait (FUT-78 traite la migration Insee 2023) ; quatre tickets créés dans Lancement V1 : **FUT-135** (part étudiante, prioritaire), **FUT-136** (rangs, prioritaire), **FUT-137** (RNA), **FUT-138** (DVF).

1. **Part étudiante : un village sans étudiant noté comme une ville étudiante.** `populate-etudiants.py` met la part à 0 sous 5 000 habitants de bassin, puis le percentile (`bisect_right`) donne à tous les ex æquo le rang du haut : **30 771 communes valent 88**, et **aucune commune n'est sous 88**. Toutes ont `vie_etudiante` ≥ 66 : palier « forte présence étudiante » dans la comparaison complète, raison favorable (≥ 55) et identité « Pour une ville étudiante à taille humaine. » (Leménil-Mitry, 2 habitants ; 95 petites communes sur 300 échantillonnées). Sans la part conventionnelle, 9 848 garderaient le palier « forte » par l'accès seul.
2. **Rangs périmés des écoles, de la culture et des services.** Cause datée dans l'historique de l'index : les **services** ont des rangs bâtis le 16/07 (`ea1b1608`) sur l'ancien indicateur (éloignement) ; le score est passé au niveau de centralité ANCT le 04/08 (`d3094eb8`) sans recalcul. Les **écoles et la culture** ont été rescorées le 21/08 (`0e4ec0fa`) sans recalcul des rangs. Verdicts du dossier faux : services **6 479** « parmi les moins favorables » à tort (Valserhône, centre structurant noté 87, rangée dans les 20 % du bas) et 3 758 autres changements ; écoles 388 ; culture 1 263 (Marseille 7ᵉ, culture 81, rangée parmi les moins favorables).
3. **Associations sous des codes disparus avant 2024.** La reprise étendue à tout l'historique du COG (fusions et changements de code, 4 143 codes ; 86 écartés car la commune d'arrivée a été découpée par un rétablissement) rattache **9 973** associations, **sans double comptage** (total 1 838 871 → 1 848 844, +9 973 exactement). Effets : 2 072 notes de vie locale changent, 332 de plus d'un point (17 au plus), 69 paliers, 30 raisons favorables, 32 identités « vie locale », 39 catégories « vie locale faible ».
4. **Prix d'achat DVF** : géographie de l'année de la vente (§5.7).
5. ~~Convention « non noté = 0 »~~ : corrigée dans FUT-109 (§5.8).
6. **Villages détruits de la Meuse** (population officielle 0) : affichage à décider.

## 9. Séquence GitHub

Commits sur `main` @ `de001b2b` (le premier, `11f60680` avant rebase, est sauvegardé sur la branche locale `fut109-sauvegarde-11f60680-ecefc286`) : population au grain, révision du 24/10, indicateurs ADEME et mobilité, artefacts, rapport, emploi des arrondissements, artefacts, classement sur les critères mesurés, documentation.

**Régénérer les artefacts** (rejoué deux fois, empreintes identiques) :

```bash
npm run index:unpack
node scripts/populate-population-grain.mjs          # population au grain + indicateurs ADEME au périmètre
node scripts/populate-emploi-arrondissements.mjs    # emploi des 45 arrondissements PLM
node scripts/populate-uu-pop.mjs
.venv-bpe/bin/python scripts/populate-vie-locale.py --write-index     # caches data/.cache (OSM, RNA, AMALIA)
.venv-bpe/bin/python scripts/populate-demographie.py --write-index    # cache insee-evol-pop.zip
.venv-bpe/bin/python scripts/populate-mobilite.py --write-index       # data/rp-mobpro-2022.parquet
npx tsx scripts/populate-mismatch-rank.mts --recalculer vie_locale,croissance_demographique,acces_soins,faible_dependance_auto,viabilite_emploi --retirer-orphelines acces_services
npm run index:pack
node scripts/accueil/donnees-accueil.mjs --ecrire
```

**Reconstruire les référentiels** (inutile tant que les sources ne changent pas) :
1. Population : `v_mvt_commune_2025.csv` (Insee 8377162), `donnees_communes.csv` de 8680726 (2023) et 7739582 (2021), puis `node scripts/population/construire-referentiel.mjs --mvt … --pl2023 … --pl2021 …`.
2. Périmètre ADEME : `node scripts/population/construire-perimetre-ademe.mjs --telecharger <json>`, puis `--lignes <json> --pl2022 <donnees_communes.csv de 8290591>`.

## Sources

- Insee, COG au 01/01/2025 (mouvements, communes) : https://www.insee.fr/fr/information/8377162
- Insee, populations légales 2021 (limites au 01/01/2023) : https://www.insee.fr/fr/statistiques/7739582
- Insee, populations légales 2022 (limites au 01/01/2024) : https://www.insee.fr/fr/statistiques/8290591
- Insee, populations de référence 2023 (limites au 01/01/2025) : https://www.insee.fr/fr/statistiques/8680726
- Insee, évolution et structure de la population 2021 : https://www.insee.fr/fr/statistiques/8201904
- ADEME, `data_communes` : https://data.ademe.fr/datasets/8ggfo546-mtjxy4lbqxcl462
- Ministère de l'Intérieur, RNA (waldec, juin 2026) : https://www.data.gouv.fr/datasets/repertoire-national-des-associations
- MESR, effectifs d'étudiants inscrits (atlas régional) : https://data.enseignementsup-recherche.gouv.fr/explore/dataset/fr-esr-atlas_regional-effectifs-d-etudiants-inscrits_agregeables
