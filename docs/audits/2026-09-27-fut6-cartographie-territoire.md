# FUT-6 : cartographie factuelle du module Territoire

27 septembre 2026. **Lecture seule, aucun code applicatif modifié.** Base : `main` au commit `30286c5e`.
Source de vérité produit : le ticket FUT-6 dans Linear.

Chaîne étudiée : **donnée brute → transformation → interprétation → carte → synthèse**, pour la page
`/rapport/quartier` (module 01 · Territoire).

---

## 1. Reproduction Châtelaillon-Plage (INSEE 17094)

### Verdict

**Le cas se reproduit sur `main`, 5 générations sur 5.** J'ai relancé la synthèse avec le prompt exact de
la route (lignes 39 à 153 de `src/app/api/synthesize-quartier/route.ts`, copiées sans modification), le
même modèle (`claude-sonnet-4-6`, effort `medium`, thinking coupé) et un payload reconstruit par les mêmes
fonctions que la route. Horizon 2050, relation « j'y vis », sans repères de terrain.

La formule exacte « presque entièrement bâtie » ne revient pas mot pour mot : la synthèse n'est jamais
stockée, chaque visite en génère une nouvelle. Mais les 5 textes affirment la même chose sous d'autres mots :

| Génération | Phrase |
|---|---|
| 3 | « Châtelaillon-Plage est déjà **l'une des communes les plus densément bâties de France**, avec **très peu d'espaces verts** et presque pas de forêt. » |
| 3 | « … dans une commune où **le béton et le bitume couvrent l'essentiel du territoire**. » |
| 5 | « **Le béton et le bitume dominent**, l'eau de pluie ruisselle sans s'infiltrer, et le territoire dispose de peu de végétation. » |
| 5 | « … une commune qui compte parmi **les plus denses** et les moins boisées de France. » |
| 1 | « une petite commune **très dense** » ; « avec moins de 2 % de boisement, les sols absorbent mal l'eau et offrent **peu d'ombre naturelle** » |
| 2 | « Châtelaillon-Plage est une commune dense, **très urbanisée** […] : peu de forêts, **beaucoup de bâti** » |
| 4 | « Une commune aussi dense, avec **si peu de couvert végétal** […] les espaces qui permettent à l'eau de pénétrer dans le sol **sont rares** » |

### Ce que l'écran affiche au même moment

| Surface | Ce qu'elle dit | Donnée |
|---|---|---|
| Carte « Espaces naturels », face | **Occupation mixte** | `couvertHeadline` : bâti 49,2 % < 50, naturel 36,5 % entre 20 et 45 |
| Même carte, volet | « **37 % d'espaces naturels** » ; « espaces bâtis et espaces ouverts **s'équilibrent** » | `brut_pct` = 36,5 |
| Même carte, répartition | Espaces urbanisés 49 %, Prairies 21 %, Terres agricoles 14 %, Forêts 10 %, Landes 3 %, Roche et dunes 2 % | `nature.composition` (OSO 2023) |
| Carte d'identité, « Densité » | **Densité intermédiaire** (976 hab/km²) | `densiteLabel` : 150 ≤ d < 1 500 |
| Carte d'identité, « Occupation des sols » | **Dominante urbaine** | `solDominant` : classe en tête ≥ 40 % |

La synthèse contredit donc trois affirmations déterministes du même écran : « Occupation mixte »,
« 37 % d'espaces naturels / s'équilibrent », et « Densité intermédiaire ».

### Pourquoi : trois causes qui se cumulent

**Cause 1. La synthèse ne reçoit pas les faits des cartes.** Le payload n'a aucun champ de composition
des sols. La carte lit `entry.nature` (OSO), la synthèse lit `territoire_ademe`. Chaque surface a sa source.

**Cause 2. La synthèse reçoit un chiffre qui semble dire l'inverse de la carte :**
`taux_boisement_pct: 1.5` (ADEME `tauxboisement`). OSO compte 10,3 % de forêt et 36,5 % d'espaces
naturels. Définitions, millésimes et producteurs différents (voir section 4). Le modèle, qui ne voit que
1,5 %, conclut « presque pas de végétation ».

**Cause 3. La synthèse reçoit un trait qui affirme « urbanisé », calculé sur une autre échelle :**
`trait_distinctif: "compte parmi les communes les plus urbanisées de France"`.
- Il vient de `getCommuneDistinctive` (`src/lib/comparateur-vie.ts:2459`) : `nature.score ≤ 12`.
- Or `nature.score` est le **percentile national du couvert naturel dans un rayon de 15 km**
  (`radius_pct`, `scripts/populate-nature.py:157-162`), pas de la commune.
- Et « non naturel » y englobe **les terres agricoles**. Autour de Châtelaillon, c'est la plaine
  céréalière d'Aunis : 27,9 % de naturel dans 15 km, score 8.
- Le libellé transforme donc « peu d'espaces naturels dans un rayon de 15 km, surtout des cultures » en
  « commune parmi les plus urbanisées de France ». Changement d'échelle ET changement de définition.

Le modèle combine ensuite 976 hab/km² (sans libellé), 1,5 % de boisement et ce trait en « l'une des
communes les plus densément bâties de France ». Chaque phrase s'appuie sur un champ du payload : la
discipline de preuve du prompt est respectée à la lettre, et la conclusion est fausse.

Le prompt interdit pourtant en toutes lettres « peu d'ombre (depuis le boisement) » : la génération 1
l'écrit quand même. Une règle écrite dans le prompt ne suffit pas à garantir le sens du texte.

### Chemins de code exacts

**Carte « Espaces naturels »**
1. `data/comparateur-index.json.gz`, champ `nature` (produit hors ligne par `scripts/populate-nature.py`, OSO 2023 raster 10 m).
2. `getTerritoryContext(insee)` → `entry` (`src/lib/comparateur-vie.ts`).
3. `buildTerritoryCards(entry)` → `couvertNaturel` (`src/lib/territory-identity.ts:142-180`, `couvertHeadline` l. 132-140).
4. `page.tsx:137` → `QuartierAside` → `buildFactors` → carte « Espaces naturels » (`src/components/report/QuartierClimatData.tsx:571-608`, sous-titre l. 583-595).

**Carte d'identité**
`page.tsx:130-136` → `buildTerritoryIdentity` (`territory-identity.ts:219-234`), qui lit `entry.densite`,
`entry.nature.composition`, `entry.distance_cote_km`, et `mood.typeLabel`.

**Synthèse**
1. Le client `QuartierSynthesis.tsx:181` appelle `POST /api/synthesize-quartier` avec `inseeCode` et `horizon`.
2. La route refait **ses propres appels** : `gatherCommuneEnrichment` (ADEME, DRIAS, Géorisques…), `getTerritoryContext`, `getResidencesSecondairesPct` (`route.ts:263-278`).
3. Le payload est construit aux lignes 280-362, puis streamé sans être stocké.

**Texte de secours** (`buildFallbackSummary`, `src/lib/quartier-signals.ts:52`) : une phrase générique qui
ne cite aucun fait. Elle ne peut rien contredire, mais n'apporte rien non plus.

---

## 2. Carte complète des faits

Légende des surfaces : **C** = carte (face ou volet), **I** = carte d'identité, **S** = synthèse.
Valeurs entre parenthèses : Châtelaillon-Plage.

### 2.1 Carte d'identité

| Fait | Source brute (champ) | Échelle réelle | Date | Transformation | Interprétation déterministe | Laissé au modèle | Surfaces | Visible | Si pas de carte : raison | Risque de contradiction |
|---|---|---|---|---|---|---|---|---|---|---|
| Typologie (« Littoral atlantique ») | `deriveCategories` : table par **département** (`commune-categories.ts:72`) | **Département** | aucune | dept → type | 4 types | S reçoit le libellé brut | I, S, C (récits des volets climat) | oui | · | Moyen : toute commune d'un département côtier est « Littoral atlantique », y compris à 80 km de la mer |
| Rôle dans l'agglomération (`agglo`, La Rochelle, 138 236 hab.) | Index `uu`, `uu_pop`, rôle | Unité urbaine | UU 2020 | rôle + libellé | « Principal pôle » si pop. UU > 1,1 × pop. commune | S reçoit `role` + nom | I, S | oui | · | Faible |
| Population (6 227) | Index `population` ; **S : ADEME `population_totale_2021`** | Commune | 2021 (ADEME publie aussi 2022 : 6 440) | arrondi | · | · | I, S | oui (I) | · | Faible ici (mêmes valeurs), mais deux sources |
| Densité (976 hab/km²) | Index `densite` = ADEME `densite_de_population_2022` | Commune | 2022 | · | **I : ≥ 1 500 dense / ≥ 150 intermédiaire / sinon peu dense** | **S : reçoit le nombre brut, sans libellé** | I, S | oui (I) | · | **ÉLEVÉ, reproduit** : I « intermédiaire », S « très dense » |
| Position (aucune pour Châtelaillon) | Index `distance_cote_km`, `relief_proximite`, `altitude` | Commune (centroïde) | aucune | · | ≤ 2 km bord de mer, ≤ 8 km proche du littoral, relief ≥ 55, altitude ≥ 600 m | non envoyé | I | oui | · | **Donnée fausse** : `distance_cote_km` = distance à la ville la plus proche d'une liste codée à la main (`build-comparateur-index.mjs:88-120`, « V1, à remplacer ») : 11 km pour une commune en bord de mer |
| Occupation des sols (« Dominante urbaine ») | Index `nature.composition` (OSO) | Commune | OSO 2023 | classe en tête | **≥ 40 %** → « Dominante X » | non envoyé | I | oui | · | **Moyen** : même fait que la carte, seuil différent (40 contre 50) |
| Phrase d'identité | composite | · | · | · | « Ville dense » si densité ≥ 1 500 ; trait selon le type ; phrase selon le rôle | non envoyé | I | oui | · | Faible |

### 2.2 Cartes « Le territoire »

| Fait | Source brute | Échelle | Date | Transformation | Interprétation déterministe | Laissé au modèle | Surfaces | Visible | Raison si pas de carte | Risque |
|---|---|---|---|---|---|---|---|---|---|---|
| Trajectoire démographique (« Croissance récente », +0,62 %/an, 9,8 % d'arrivants) | INSEE évolution 2015-2021 → index `demographie` | Commune | 2015-2021 | taux annualisé → total sur 6 ans | `recit` : stable si ±0,15 %/an ; « attire » si arrivants ≥ tercile haut national ; statut dérivé du récit | S reçoit la phrase `RECIT_DEMOGRAPHIE` + part d'arrivants | C, S | oui | · | Moyen : la phrase envoyée dit « attire de nouveaux arrivants », or le prompt interdit « attire de nouveaux résidents » déduit du seul % |
| Espaces naturels (36,5 % ; 27,9 % dans 15 km ; composition) | OSO 2023 → index `nature` | Commune (+ rayon 15 km) | 2023 | arrondis, tri | Face : bâti ≥ 50 → « Majoritairement urbanisé » ; naturel ≥ 45 → « Forte présence naturelle » ; agricole ≥ 50 → « À dominante agricole » ; naturel < 20 → « Faible présence » ; sinon « Occupation mixte ». Volet : ≥ 75 / ≥ 50 / ≥ 25 / < 25 | **Rien : non envoyé** | C | oui | · | **ÉLEVÉ, reproduit** |
| Taux de boisement (1,5 %) | ADEME `tauxboisement` | Commune | **non documenté dans le code** | arrondi | Carte **seulement si OSO manque** (repli) | S le reçoit **toujours** | S (C en repli) | **non** quand OSO existe | aucune raison écrite : il est affiché en repli et envoyé en permanence | **ÉLEVÉ, reproduit** |
| Résidences secondaires (37,9 %) | INSEE logement 2022 → `data/residences-secondaires.json` | Commune | 2022 | arrondi | Carte : ≥ 40 Forte / ≥ 20 Marquée / ≥ 8 Modérée / sinon Faible, plus quatre phrases | S : envoyé seulement si ≥ 20, avec « forte » / « marquée » | C, S | oui | · | Faible (mêmes seuils pour 20 et 40) |
| Logements inoccupés (2 %) | ADEME `part_des_logements_vacants_2022` | Commune | 2022 (ADEME publie aussi la vacance du parc privé 2024 : 6,9 %) | arrondi | Carte : ≥ 13 « **Perte d'attractivité** » / < 8 « **Tension sur le logement** · Peu de biens disponibles » / sinon « Marché équilibré » | S : nombre brut, et le prompt impose une lecture **neutre** | C, S | oui | · | **Moyen** : la carte tire une conclusion de marché que le prompt interdit à la synthèse |
| Évolution des 65 ans et plus (+3,28 %/an) | ADEME `taux_devolution_annuel_des_65_ans_et_plus_20162022` | Commune | 2016-2022 | · | · | S : **champ nommé `vieillissement_pct_65_plus`**, qui se lit comme une part de population | S | non | aucune raison écrite | **Moyen** : le nom du champ induit une mauvaise lecture (3 % de seniors au lieu d'une croissance de 3 %/an) |
| Trait distinctif (« parmi les communes les plus urbanisées de France ») | percentiles nationaux de l'index (`MONO_DISTINCTIVE`, `comparateur-vie.ts:2452-2465`) | **Variable** : climat commune, nature **rayon 15 km**, démographie commune, relief | millésime de chaque source | percentile | seuils de saillance **≥ 88 / ≤ 12** ; le plus extrême l'emporte | S reçoit une phrase-verdict | S | **non** | aucune raison écrite | **ÉLEVÉ, reproduit** : changement d'échelle et de définition (voir 1) |

### 2.3 Cartes « Le climat » (DRIAS-TRACC, par horizon)

Toutes viennent de `enrichment.drias.commune.s[horizon].v`, identique pour la carte et la synthèse, mais
lu deux fois (page et route, avec le même cache).

| Fait | Indicateur | Carte : ce qu'elle montre | Synthèse : ce qu'elle reçoit | Risque |
|---|---|---|---|---|
| Températures moyennes | `NORTMm_seas_JJA/DJF`, anomalies `ATMm_*` | anomalie (« Été +x °C · hiver +y °C d'ici 2050 ») ; volet : trajectoire + tendance ERA5 observée | **rien** | Faible |
| Chaleurs estivales | `NORTX30D_yr` (+ `ATX30D_yr`), `NORTX35D_yr` | « +X jours chauds d'ici 2050 » ou niveau ; « Restent rares » si < 1,5 jour | valeurs **absolues** seulement (30 °C, 35 °C) | Moyen : sans l'anomalie, le modèle peut inventer une référence (« triple ») |
| Nuits tropicales | `NORTR_yr` (+ `ATR_yr`) | idem ; « Quasi inexistantes » si < 1,5 ; volet si maximum ≥ 3 | absolu | Moyen, même raison |
| Conditions de feu | `NORIFM40_yr` | « N jours/an » | absolu | Faible |
| Sécheresse des sols | `NORSWI04_yr` + VigiEau + ONDE | jours secs ; état VigiEau à 3 états (`libelleRestrictions`) ; cours d'eau à sec | SWI absolu ; code VigiEau **brut** (« crise ») ; ONDE si à sec | Faible |
| Pluie intense | carte : `NORRRq99refD_yr` (**jours**) ; volet : `NORRRq99_yr` (mm) | « N jours de pluie intense par an » | `NORRR_yr` (cumul) + `NORRRq99_yr` (**mm**), pas le nombre de jours | **Moyen** : ce n'est pas le même indicateur |
| Tendance observée | ERA5-Land (`getEra5Trend`) | volet Températures seulement | **rien** | Faible |

### 2.4 Cartes « Les risques »

| Fait | Source | Carte | Synthèse | Risque |
|---|---|---|---|---|
| Inondation fluviale | Géorisques, drapeau communal | « Une partie du territoire est concernée » / « Aucun périmètre recensé » | booléen | Faible (même source, deux appels) |
| Submersion marine | Géorisques, drapeau communal | carte si concernée | booléen | Faible |
| Mémoire des catastrophes | GASPAR **en direct** (total tous risques : 14 depuis 1982) + compte inondation **figé dans le dossier ou lu dans l'index** (4) | les deux, distingués (« Tous risques · … Dont … ») | GASPAR en direct seulement (total, années, 3 aléas principaux) | Faible, mais deux chemins pour une même notion ; « Chocs liés aux vagues » est un libellé que le prompt ne relie pas à l'érosion |
| Érosion du littoral | Cerema + liste loi Climat et Résilience | carte avec classe (faible → très marquée) et récit | **rien** | Moyen : la synthèse parle du bord de mer sans ce fait |

### 2.5 Entrées de la synthèse qui ne sont pas des faits du lieu

`relation_a_la_commune`, `attentes_decouverte`, `reperes_terrain_utilisateur` (workbook). Elles règlent la
posture, pas les faits. Hors du périmètre du futur objet de faits, mais elles entrent dans le même payload.

### 2.6 Code mort repéré

- `QuartierDataBody`, `QuartierSectionTitle` et `buildParagraphs` (`QuartierClimatData.tsx:1068-1360`) ne
  sont montés nulle part, et portent leurs propres phrases chiffrées.
- `saisonnaliteLevel` et `saisonnaliteLabel` (`src/lib/saisonnalite.ts`) ne sont appelés nulle part : les
  mêmes seuils sont recopiés en ligne dans la carte et dans la route.
- `mood.density` et `mood.vegetation` (`territory-mood.ts`) recopient les seuils de densité et ajoutent des
  seuils de boisement (35 / 12). Aucun texte ne les lit.

---

## 3. Inventaire des interprétations actuelles

### 3.1 Seuils et catégories codés

| # | Règle | Emplacement | Entrée | Sortie |
|---|---|---|---|---|
| 1 | Densité 1 500 / 150 | `territory-identity.ts:31` | `entry.densite` | Commune dense / Densité intermédiaire / Commune peu dense |
| 2 | Même densité (copie) | `territory-mood.ts` `pickDensity` | ADEME `densite` | dense / intermediaire / rural (aucun texte) |
| 3 | « Ville dense » ≥ 1 500 | `territory-identity.ts:196` | `entry.densite` | adjectif de la phrase d'identité |
| 4 | Pôle si UU > 1,1 × commune | `territory-identity.ts:46` | `uuPop`, population | libellé de rôle |
| 5 | Position : ≤ 2 km, ≤ 8 km, relief ≥ 55, altitude ≥ 600 m | `territory-identity.ts:62-65` | index | En bord de mer / Proche du littoral / Proche du relief / En altitude |
| 6 | Sol dominant ≥ 40 % | `territory-identity.ts:91` | composition OSO | Dominante urbaine / agricole / forestière / Milieux ouverts |
| 7 | Face de la carte couvert : bâti ≥ 50, naturel ≥ 45, agricole ≥ 50, naturel < 20 | `territory-identity.ts:132-140` | OSO | 5 libellés |
| 8 | Volet de la carte couvert : 75 / 50 / 25 | `QuartierClimatData.tsx:583-590` | `brutPct` | 4 phrases, dont « la commune est très urbanisée » sous 25 |
| 9 | Démographie : ±0,15 %/an ; arrivants ≥ tercile haut | `scripts/populate-demographie.py:25,137` | INSEE | 5 codes de récit |
| 10 | Statut démographique | `territory-identity.ts:147-151` | code de récit | Croissance récente / Population en recul / Population stable |
| 11 | Saisonnalité 40 / 20 / 8 | `QuartierClimatData.tsx:648-677` | INSEE | Forte / Marquée / Modérée / Faible + phrases |
| 12 | Saisonnalité 40 / 20 (copie) | `route.ts:341-345` | idem | envoyée si ≥ 20, « forte » / « marquée » |
| 13 | Saisonnalité 40 / 20 (copie, morte) | `saisonnalite.ts` | idem | · |
| 14 | Vacance 13 / 8 | `QuartierClimatData.tsx:804-808` | ADEME | Perte d'attractivité / Tension sur le logement / Marché équilibré |
| 15 | Trait distinctif ≥ 88 / ≤ 12 | `comparateur-vie.ts:2452-2465` | percentiles | 10 phrases « compte parmi les communes… » |
| 16 | Phénomène rare < 1,5 ; mouvement si delta ≥ 2 | `QuartierClimatData.tsx:303-314` | DRIAS | « Restent rares », « +X … d'ici », ou niveau |
| 17 | Volet nuits tropicales si maximum ≥ 3 | `QuartierClimatData.tsx:404` | DRIAS | affichage du volet |
| 18 | Été / hiver : écart > 0,3 °C | `QuartierClimatData.tsx:293-294` | anomalies | « l'hiver se réchauffe plus vite… » |
| 19 | Récits climat par type (4 × 3 phrases) | `buildClimatWhy`, l. 256-297 | typologie | « Ce que cela raconte » |
| 20 | CatNat : second aléa si ≥ 50 % du premier | `QuartierClimatData.tsx:876` | GASPAR | « Surtout X (et Y) » |
| 21 | Érosion : classe Cerema → 4 récits | `QuartierClimatData.tsx:952-1031` | Cerema | libellés et récits |
| 22 | VigiEau : 3 états (en vigueur / aucune / panne) | `src/lib/restrictions-eau.ts` | VigiEau | texte |
| 23 | Typologie par département | `commune-categories.ts:72-88` | code département | 4 types |
| 24 | Boisement 35 / 12 (visuel seulement) | `territory-mood.ts` `pickVegetation` | ADEME | boise / mixte / minimal |

### 3.2 Interprétations demandées au modèle par le prompt (`route.ts:108-153`)

- **Trancher** une trajectoire dominante, un atout, un compromis et un paradoxe : c'est une interprétation
  libre par construction.
- **Qualifier sans libellé** la densité (nombre brut), le boisement (nombre brut), la vacance (neutre
  imposé), les valeurs climat absolues et le niveau VigiEau (code brut).
- **Consigne de vocabulaire qui oriente vers une affirmation non étayée** : « Si un sol est
  imperméabilisé, dites "les sols absorbent mal l'eau" » (`route.ts:57`). Aucune donnée
  d'imperméabilisation n'est fournie, et les 5 générations décrivent pourtant des sols qui absorbent mal
  l'eau (« les sols absorbent mal », « sols peu absorbants », « presque plus de terre pour absorber »).
- **Interdits** : psychologie collective, inférence de second niveau (« attire », « peu d'ombre »),
  changement d'échelle silencieux, réputation sans donnée. Deux sont enfreints dans les 5 générations :
  « peu d'ombre naturelle » (génération 1), et « un lieu de vie recherché » (génération 3, déduit de la
  seule démographie).

### 3.3 Notions laissées entièrement au modèle

- La **place du bâti et de la nature** : aucun fait structuré n'est envoyé, seulement le boisement ADEME
  et le trait distinctif.
- La **densité qualifiée** (« dense », « très dense »).
- L'**attractivité** (seule la phrase démographique est envoyée).
- Le **bord de mer** : aucun fait de distance n'est envoyé ; la typologie est départementale ; l'érosion
  n'est pas envoyée.
- L'**ampleur d'un changement climatique** : anomalies absentes du payload.

---

## 4. Doubles vérités et divergences

| Notion | Forme A | Forme B | Même notion ? | Même échelle ? | Même millésime ? | Même définition ? | Affichables ensemble ? | Carte | Synthèse |
|---|---|---|---|---|---|---|---|---|---|
| Place de la nature | OSO `brut_pct` (36,5 %) | ADEME `tauxboisement` (1,5 %) | **Non** : « naturel élargi » (forêt, prairies, landes, dunes, eau) contre « boisement » | Commune / commune | 2023 / **inconnu** | Non | Oui, à condition de dire les deux définitions | A | **B** |
| Forêt | OSO `composition.foret` (10,3 %) | ADEME `tauxboisement` (1,5 %) | Proche, mais **mesures différentes** (raster satellite 10 m contre définition ADEME non documentée ici) | Commune | 2023 / inconnu | Non | Seulement avec leur définition, sinon le lecteur voit 10 % et 1,5 % pour « la forêt » | A (volet) | B |
| Urbanisation | OSO `composition.artificialise` (49,2 %, commune) | `nature.score` via trait distinctif (percentile du **rayon 15 km**) | **Non** : B mesure le « non naturel » alentour, cultures comprises | Commune / **15 km** | 2023 | Non | **Non, en l'état** : le libellé de B affirme une chose que A contredit | A | **B** |
| Occupation dominante | Carte : seuil 50 (« Occupation mixte ») | Identité : seuil 40 (« Dominante urbaine ») | Oui | Oui | Oui | **Seuils différents** | Contradictoires à l'écran | les deux | aucune |
| Couvert, face et volet | Face : 50 / 45 / 50 / 20 | Volet : 75 / 50 / 25 | Oui | Oui | Oui | Grilles différentes | Peuvent se contredire (naturel = 22 %, cultures 48 % : face « Occupation mixte », volet « très urbanisée ») | les deux | aucune |
| Densité | Identité : « Densité intermédiaire » | Synthèse : nombre brut, qualifié par le modèle | Oui | Oui | Oui | Libellé seulement d'un côté | **Contradiction reproduite** | I | S (brut) |
| Population | Index (6 227, 2021) | ADEME `population_totale_2021` (6 227) ; ADEME 2022 : 6 440 | Oui | Oui | 2021 des deux côtés | Oui | Oui aujourd'hui ; deux chemins | I | S |
| Démographie | Récit du moteur (« attire ») | Règle du prompt (« n'écrivez pas "attire" depuis le seul %) | Oui | Oui | Oui | Le libellé déterministe fait ce que le prompt interdit | Tension de doctrine | C | S |
| CatNat | GASPAR en direct (tous risques) | Index / dossier figé (inondation) | Deux périmètres | Commune | Dates de lecture différentes | Non | Oui, déjà distingués sur la carte | les deux | A seulement |
| Pluie intense | Nombre de jours (`NORRRq99refD_yr`) | Hauteur p99 (`NORRRq99_yr`) | Deux indicateurs voisins | Commune | Même horizon | Non | Oui, avec leur unité | A | B |
| Bord de mer | Typologie par **département** | `distance_cote_km` (**proxy**, 11 km) | Oui | Département / point | · | Non | Se contredisent pour Châtelaillon (« Littoral atlantique » sans position « bord de mer ») | I | typologie seulement |
| Vacance | 2022 : 2 % | ADEME parc privé 2024 : 6,9 % (non utilisé) | Deux périmètres | Commune | 2022 / 2024 | Non | · | A | A |

**Un écart structurel, présent pour toutes les notions : pas de snapshot commun.** La page (`page.tsx:82`)
et la route (`route.ts:263`) appellent chacune `gatherCommuneEnrichment` et `getTerritoryContext`. Les
caches rendent les valeurs généralement identiques. Mais une source en panne pour un seul des deux appels,
ou une actualisation entre les deux, suffit à les faire diverger. Et rien ne date ce que la synthèse a lu.

---

## 5. Risques classés

| # | Risque | Gravité | Reproduit | Où |
|---|---|---|---|---|
| R1 | La synthèse affirme un territoire « très bâti » quand les cartes disent « mixte / 37 % naturel » | **Critique** (texte vendu, faux) | Oui, 5/5 | payload sans OSO + boisement ADEME + trait distinctif |
| R2 | Le trait distinctif « parmi les plus urbanisées » mesure le rayon 15 km et compte les cultures comme non naturelles | **Critique** (faux pour toute commune rurale entourée de grandes cultures) | Oui | `comparateur-vie.ts:2459` |
| R3 | Densité qualifiée par le modèle contre libellé déterministe | Élevée | Oui (5/5 disent « dense ») | payload brut |
| R4 | Deux grilles de seuils pour le même couvert (identité 40, face 50, volet 75/50/25) | Élevée (contradictions à l'écran sans IA) | Oui pour identité/face ; possible pour face/volet | `territory-identity.ts`, `QuartierClimatData.tsx` |
| R5 | Pas de snapshot commun entre la page et la route ; rien ne date la lecture | Moyenne | Structurel | `page.tsx:82`, `route.ts:263` |
| R6 | Champ `vieillissement_pct_65_plus` mal nommé | Moyenne | Non testé | `route.ts:324` |
| R7 | Carte vacance : conclusion de marché (« Tension sur le logement ») que la doctrine refuse à la synthèse | Moyenne | Oui (Châtelaillon : « Tension ») | `QuartierClimatData.tsx:804` |
| R8 | Consigne « les sols absorbent mal l'eau » sans donnée d'imperméabilisation | Moyenne | Oui (5/5) | `route.ts:57` |
| R9 | Climat : absolus envoyés, mouvements affichés ; pluie : indicateurs différents | Moyenne | Non testé | `route.ts:290-300` |
| R10 | Faits absents de la synthèse alors qu'ils sont sur une carte (érosion, ERA5, composition) | Moyenne | · | payload |
| R11 | Typologie par département présentée comme propre à la commune | Moyenne | Non testé ici | `commune-categories.ts` |
| R12 | `distance_cote_km` approximatif (liste de villes) | Élevée, **hors FUT-6** : touche aussi le comparateur et la contrainte « près de la mer » | Oui (11 km pour Châtelaillon-Plage) | `build-comparateur-index.mjs:88-120` |
| R13 | Aucun test ne vérifie le sens de la synthèse Territoire | Structurel | · | · |

---

## 6. Proposition minimale de contrat `facts → derived facts → synthesis`

Niveau architecture et données seulement. **Rien n'est implémenté.**

### 6.1 Trois objets

**`Fact`** : une observation sourcée, jamais interprétée.

```
Fact {
  key            // identifiant stable : "land.natural_share", "land.composition", "population.density"…
  value          // nombre, catégorie, ou petit objet structuré (composition)
  unit           // "%", "hab/km²", "jours/an"…
  scale          // "commune" | "radius_15km" | "urban_unit" | "department" | "point"
  source         // { producer, dataset, field }, ex. { "CESBIO", "OSO", "nature.brut_pct" }
  vintage        // période ou millésime des données ; null si inconnu, et dit comme tel
  observedAt     // date de lecture pour les sources vivantes (VigiEau, GASPAR)
  status         // "ok" | "missing" | "source_unavailable"
  limits?        // phrase courte : « le rayon compte les cultures comme non naturelles »
  presentation   // { card: "nature.green_spaces" } OU { noCard: { reason, note? } }
}
```

`reason` prend l'une des valeurs du ticket : `redundant | context_only | too_granular |
low_standalone_value | other`, avec une note courte quand c'est `other`. C'est le registre des faits sans
carte demandé par la doctrine, placé à côté du fait lui-même.

**`DerivedFact`** : une interprétation déterministe, nommée et testable.

```
DerivedFact {
  key            // "land.headline", "density.label", "demography.status"
  value          // la catégorie : "mixed" | "mostly_built" | …
  label          // le texte montré : « Occupation mixte »
  from           // clés des Facts utilisés
  rule           // identifiant et version de la règle : "couvert-headline@1"
}
```

Les cartes affichent des `Fact` et des `DerivedFact`. La synthèse reçoit les **mêmes** objets. Une
catégorie qui existe comme `DerivedFact` n'est plus laissée au modèle.

**`FactsSnapshot`** : l'objet commun, un par écran.

```
FactsSnapshot {
  scope          // { kind: "commune", insee }
  version        // version du registre de faits et des règles
  builtAt
  facts: Fact[]
  derived: DerivedFact[]
}
```

### 6.2 Ce que le contrat permet

- **Un seul snapshot par écran** : la page le construit, les cartes le lisent, et la synthèse reçoit ce
  snapshot, ou le même, reconstruit à l'identique par sa clé et sa version. Il n'y a plus deux lectures
  indépendantes.
- **Des cartes stables** : une carte déclare les clés qu'elle affiche. Un nouveau `Fact` n'entraîne jamais
  de nouvelle carte, il porte `noCard` et sa raison.
- **Un fait sans carte n'entre dans la synthèse que s'il porte une raison** : cela se vérifie
  mécaniquement, c'est un critère d'acceptation du ticket.
- **Des contrôles déterministes de contradiction**, construits sur les `DerivedFact` : par exemple une
  table « si `land.headline` = mixte, la synthèse ne doit pas contenir les marqueurs d'un territoire
  "très bâti" ». La forme de ces contrôles (lexique, catégories interdites) reste à décider, section 7.
- **Un fallback déterministe** assemblé à partir des `DerivedFact` (phrase d'identité et libellés des
  cartes), à la place du texte générique actuel.

### 6.3 Généricité

Le contrat ne dépend pas de Territoire : `scope` pourrait valoir une adresse, `key` est libre, `scale`
est une liste fermée extensible. FUT-6 ne migre que Territoire, conformément au ticket.

---

## 7. Décisions produit à prendre avant le code

Chaque question donne le comportement actuel, les options, leurs conséquences et une recommandation
technique. **Aucune n'est tranchée ici.**

### D1. Quelle mesure fait foi pour « la place de la nature et du bâti » ?
- **Actuel** : les cartes lisent OSO, la synthèse lit le boisement ADEME. Ils ne mesurent pas la même chose.
- **Options**
  - (a) OSO seul dans l'objet commun ; le boisement ADEME sort de la synthèse. Une seule vérité, et on perd un chiffre dont la définition n'est pas documentée ici.
  - (b) Les deux dans l'objet, chacun avec sa définition et sa limite. Plus riche, mais le modèle doit ne jamais les confondre, et la carte devrait montrer les deux pour éviter qu'un chiffre de la synthèse n'apparaisse nulle part.
  - (c) OSO seul, et le boisement ADEME n'est plus utilisé nulle part.
- **Recommandation technique** : (a). Une synthèse ne devrait pas citer un chiffre que l'écran ne montre pas et qui semble contredire celui qu'il montre.

### D2. Que devient le trait distinctif « parmi les communes les plus urbanisées de France » ?
- **Actuel** : envoyé à la synthèse seulement ; il mesure le rayon de 15 km et compte les cultures comme non naturelles.
- **Options**
  - (a) Le renommer pour dire ce qu'il mesure (« entourée de peu d'espaces naturels dans un rayon de 15 km »).
  - (b) Le retirer de la synthèse Territoire.
  - (c) Le calculer sur le couvert de la commune plutôt que sur le rayon : c'est un changement de définition, donc un choix produit.
- **Conséquence** : ce trait sert aussi au comparateur (même table), donc (a) et (c) débordent de Territoire.
- **Recommandation technique** : (b) dans FUT-6, et (a) ou (c) comme sujet séparé, puisque la table est partagée.

### D3. La densité doit-elle arriver dans la synthèse avec son libellé ?
- **Actuel** : l'identité dit « Densité intermédiaire », la synthèse reçoit 976 et écrit « très dense ».
- **Options** : (a) envoyer le `DerivedFact` (« intermédiaire ») et interdire toute autre qualification ; (b) envoyer seulement le libellé, sans le chiffre ; (c) ne plus envoyer la densité.
- **Recommandation technique** : (a). C'est le cas d'école de la doctrine : l'IA relie une conclusion déjà sûre.

### D4. Quelle grille fait foi pour le couvert ? (choisir parmi l'existant, sans créer de seuil)
- **Actuel** : identité 40 %, face de la carte 50 / 45 / 50 / 20, volet 75 / 50 / 25. Ces grilles se contredisent à l'écran.
- **Options** : (a) la face de la carte devient la règle unique, le volet et l'identité en dérivent ; (b) l'identité garde une notion distincte (« classe la plus étendue »), dite comme telle ; (c) le volet cesse de qualifier et ne montre que les chiffres.
- **Recommandation technique** : (a), plus (c) pour le volet. Une seule catégorie par fait et par écran.

### D5. Les conclusions de marché de la carte « Logements inoccupés » sont-elles acceptables ?
- **Actuel** : 2 % → « Tension sur le logement · Peu de biens disponibles » ; ≥ 13 % → « Perte d'attractivité ». Le prompt interdit à la synthèse ce même type de déduction.
- **Options** : (a) garder, et l'autoriser alors à la synthèse ; (b) réduire la carte à un positionnement (« Faible / Dans la moyenne / Élevée ») ; (c) statu quo avec deux doctrines.
- **Recommandation technique** : (b), qui aligne la carte sur la doctrine « décrire sans juger ».

### D6. Le champ « vieillissement » a-t-il sa place ?
- **Actuel** : envoyé sous un nom trompeur (`vieillissement_pct_65_plus`, en réalité une croissance annuelle), et affiché nulle part.
- **Options** : (a) le renommer et le garder sans carte, avec une raison ; (b) le retirer ; (c) lui donner une carte.
- **Recommandation technique** : (a) ou (b). Il n'a jamais été étudié comme fait de lecture.

### D7. La phrase démographique « attire de nouveaux arrivants » est-elle une conclusion permise ?
- **Actuel** : libellé déterministe du moteur, que le prompt interdit par ailleurs.
- **Options** : (a) la phrase est un `DerivedFact` accepté (le seuil est le tercile national des arrivants), et on retire l'interdit du prompt ; (b) la reformuler en fait (« une part d'arrivants parmi les plus élevées ») ; (c) statu quo.
- **Recommandation technique** : (a) ou (b), pour qu'une seule doctrine s'applique.

### D8. Quels contrôles de contradiction en V1 ?
- **Actuel** : aucun contrôle sur la synthèse Territoire.
- **Options**
  - (a) Contrôles par catégorie, sur les seuls `DerivedFact` exposés : couvert, densité, démographie, présence ou absence de submersion et d'inondation, saisonnalité. Chacun a une liste de formulations incompatibles.
  - (b) (a) plus des contrôles sur les chiffres cités (tout nombre de la synthèse doit exister dans le snapshot).
  - (c) Une liste plus large.
- **Conséquence** : (a) est court et testable, mais un lexique ne couvre jamais toutes les paraphrases. (b) attrape les chiffres inventés. Aucune des deux options n'ajoute d'appel IA.
- **Recommandation technique** : (a) + (b). Les listes de formulations doivent se présenter avant d'être codées : ce sont des conventions.

### D9. Que doit dire le fallback déterministe ?
- **Actuel** : une phrase générique, sans aucun fait.
- **Options** : (a) la phrase d'identité et les libellés des cartes Territoire, assemblés ; (b) (a) plus un signal climat dominant choisi par une règle fixe ; (c) statu quo.
- **Recommandation technique** : (a). Un texte sobre, entièrement vérifiable. (b) demande une règle de hiérarchie à décider.

### D10. Comment garantir un seul snapshot par écran ?
- **Actuel** : la page et la route lisent chacune leurs sources.
- **Options** : (a) la page construit le snapshot et le persiste brièvement ; la route le relit par un identifiant ; (b) la route reconstruit le snapshot et vérifie une empreinte (hash) transmise par la page ; (c) la page transmet le snapshot à la route (le client pourrait le falsifier, donc non).
- **Recommandation technique** : (b). Pas de stockage nouveau, et l'écart devient détectable : la synthèse est refusée ou régénérée si l'empreinte diffère.

### D11. Faut-il ajouter à la synthèse les faits déjà sur une carte mais absents du payload ?
- **Actuel** : l'érosion du littoral, les anomalies climat, la tendance ERA5 et la composition OSO sont affichées mais pas envoyées.
- **Options** : (a) tout fait de carte entre dans le snapshot envoyé ; (b) liste choisie.
- **Recommandation technique** : (a). La synthèse raisonne alors sur tout ce que l'écran prouve, et sur rien d'autre.

### Signalé hors FUT-6 (à décider s'il faut un ticket)
- **`distance_cote_km`** : la distance à la côte est approximée par une liste de villes côtières, ce qui place Châtelaillon-Plage à 11 km de la mer. Cela touche aussi le comparateur (contrainte « près de la mer », ancres littorales).
- **Typologie par département** : toute commune de Charente-Maritime est « Littoral atlantique ».

---

## Annexe : méthode de reproduction

- Script jetable, hors dépôt : il reconstruit le payload avec les fonctions de production
  (`gatherCommuneEnrichment`, `getTerritoryContext`, `getCommuneDistinctive`, `deriveTerritoryMood`,
  `getResidencesSecondairesPct`), puis appelle `generateText` avec le prompt copié tel quel.
- 5 générations, horizon 2050, relation `current_residence`, sans workbook. Seule différence avec la
  production : `generateText` à la place de `streamText`, sans effet sur le contenu.
- Données brutes vérifiées à la source : entrée d'index 17094 (`data/comparateur-index.json.gz`) et ligne
  ADEME publique (`data.ademe.fr`, jeu `8ggfo546-mtjxy4lbqxcl462`).
