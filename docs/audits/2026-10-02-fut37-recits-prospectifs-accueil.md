# FUT-37, phase 0 : les récits prospectifs de l'accueil

> Audit sémantique et proposition de correction. **Aucun code produit modifié.**
> Branche `bonjourfuturee/fut-37-securiser-les-recits-prospectifs-de-laccueil`, partie de `main`
> `b91fa88f`. Indépendant de FUT-33 (aucun fichier ni commit de cette branche).
>
> Doctrine du ticket : **une phrase ne peut conclure que sur ce que mesure réellement son entrée, ou
> sur une interprétation explicitement justifiée.**

Méthode : lecture de `src/components/FutureELanding.tsx` et de tout ce qui l'alimente (routes `/drias`,
`/georisques`, `/api/landing-signals`, `/qna`, tables Supabase `tensions_catalog`, `tension_answers`,
`communes_categorization`), puis **exécution des fonctions réelles** de l'accueil, extraites telles
quelles du composant, sur un panel de 22 communes et sur les 34 788 communes de l'index (annexe A).
Toutes les phrases citées comme « produites » ont été générées ainsi, pas reconstituées de mémoire.

Documents de référence lus : audits FUT-6 (`2026-09-27-fut6-cartographie-territoire.md`), FUT-7, FUT-8
(`2026-10-01-fut8-capacites-cibles.md`, section « Le grain »), spec FUT-6 (`facts-snapshot`), doctrine
`docs/vault/doctrine/data.md`, et les équivalents du dossier : `src/lib/decision/climat-facts.ts`,
`src/lib/horizons.ts`, `src/lib/territoire/synthesis-contract.ts`, `src/lib/territoire/synthesis-checks.ts`,
`src/components/report/QuartierClimatData.tsx`.

**Document introuvable** : l'« audit / stratégie prospective du 28 septembre 2026 » n'existe ni sur `main`,
ni sur aucune branche, ni dans les fichiers non suivis du dépôt principal. Les commits du 28/09 sont ceux
de FUT-6 (`1043e084`, `c7c4e2dc`), lus ici. Si ce document vit ailleurs (Notion, Linear), il n'a pas été
pris en compte.

---

## 1. Résumé exécutif

**L'accueil raconte des projections sans jamais montrer le chiffre qui les fonde, et ses phrases ne
dépendent presque pas de ce chiffre.** Les fonctions narratives calculent la valeur DRIAS (le champ
`note`, « ≈ 7 jours > 35 °C/an »), puis le rendu **ne l'affiche pas** (ni la source `src`). Le lecteur ne
voit que l'interprétation. Et cette interprétation est, pour la plupart des familles, **la même pour toutes
les communes de France** à un horizon donné : seul le nom change.

Conséquences mesurées sur les 34 788 communes :

- **La carte d'accroche « Canicule » (100 % des communes, position 1)** dit à l'horizon 2100 « Les chaleurs
  extrêmes pourraient durer plusieurs semaines par an » : **82 % des communes** (28 575) comptent moins de
  14 jours au-dessus de 35 °C à cet horizon (médiane nationale : 8,1). À Chamonix, aux Belleville et à
  Briançon, l'indicateur vaut **0 jour à tous les horizons**, et la carte dit pourtant « Les épisodes de
  chaleur extrême pourraient devenir courants » (2050). Elle déduit en outre une **durée continue** d'un
  nombre de jours dans l'année, ce que FUT-6 a explicitement interdit au dossier le 30/09.
- **L'onglet « Aujourd'hui » (« données actuelles ») affiche une projection** : faute de valeur présente
  dans DRIAS, le code retombe sur `gwl15`, l'horizon 2030. Le dossier, lui, écrit noir sur blanc
  (`climat-facts.ts`) : « IL EST DONC INTERDIT D'ÉCRIRE "la commune connaît ACTUELLEMENT…" ».
- **Feux** (14 168 communes) : « Le risque d'incendie pourrait fortement progresser » et « une grande partie
  de l'été » à partir de l'indice forêt-météo, y compris quand il vaut 0 à 1 jour par an (Briançon), et
  pour 89 % des communes concernées sous 30 jours à l'horizon 2100.
- **Eau** (14 694 communes) : « L'accès à l'eau pourrait devenir plus tendu pendant les étés », déduit du
  seul nombre de jours de sol sec. C'est **exactement** la conclusion que FUT-6 a interdite au dossier
  (règle `interdit:tension-eau`, décision du 30/09). L'accueil la produit en clair.
- **Neige** (550 communes) : la température moyenne hivernale devient « manteau neigeux », « neige rare et
  imprévisible » et « économie montagnarde fragilisée ». futur•e n'a aucune donnée d'enneigement.
- **Submersion, inondation, argiles, immobilier, pluies, vigne, air** : ces récits ne s'affichent jamais une
  fois les données chargées (l'assemblage des cartes les rend inatteignables, §2.3). Mais ils s'affichent
  **pendant le chargement** (en grisé) et **quand DRIAS échoue**, et deux d'entre eux sont graves : la
  submersion qui « pourrait s'étendre à de nouvelles zones » et « des quartiers régulièrement submergés »,
  et l'immobilier qui « pourrait perdre significativement de sa valeur » puis devenir « difficile à
  assurer ou à revendre ». Pendant le chargement, une commune littorale reçoit la carte submersion **sans
  aucun fait Géorisques** (Vannes, où l'État ne recense pas ce risque).
- **Les réponses aux questions** (bloc « Première lecture ») sont le second foyer : la table Supabase
  `tension_answers` contient des réponses **écrites pour une commune et servies à toutes les autres**
  (« La Rochelle présente un risque de submersion en hausse de +31 % en scénario médian 2050 (DRIAS,
  Géorisques) » pour toute commune littorale ; « Les sols charentais… » et « 5 à 34 jours de canicule à
  La Rochelle » pour **toutes** les communes de France ; « Bressuire est un territoire… » pour toute commune
  périurbaine). Ces textes sont affichés en repli, et surtout **injectés au modèle** comme
  `editorial_base_answer`. Le « +31 % de submersion selon DRIAS » est une donnée qui n'existe pas : DRIAS
  ne modélise pas la submersion.
- Le contexte climatique envoyé au modèle étiquette `gwl30` (2100, +4 °C) comme **« 2050 »**. C'est la faute
  que `horizons.ts` a corrigée partout ailleurs ; l'accueil l'a gardée.

**Ce qui est sain** : la structure (DRIAS au grain de la commune via la maille, Géorisques GASPAR au grain
communal), les sous-titres chiffrés des questions (« 23 jours > 30 °C par an à Lyon »), et les cartes de
profondeur dans leur principe. **Ce qui manque n'est pas de la donnée** : tous les chiffres nécessaires à
des récits concrets et justes sont déjà dans le payload (valeur projetée, anomalie, donc référence
1976-2005 reconstruite, comme le fait le dossier). Le travail de FUT-37 est éditorial et structurel, pas
d'ingestion.

**Bilan** : 54 unités de texte examinées (dont les 14 fonctions narratives de l'accueil) :
**8 ✅, 19 🟡, 27 🔴.**

---

## 2. Cartographie des récits de l'accueil

### 2.1 Les surfaces

| Surface | Quand | Fonctions / sources | Prospectif ? |
|---|---|---|---|
| **Machine à sous du hero** (avant toute commune) | toujours, 4 villes en rotation | `SLOT_CITIES` (16 cartes statiques) | oui (8 cartes climat/risque) |
| **Sous-titre du hero** | commune choisie | `getHeroCopy` (5 branches) | promesse de sujets |
| **Sélecteur d'horizon** | commune choisie | `HorizonSwitch` + `HORIZON_TO_GWL` | oui |
| **4 cartes de prévisualisation** | commune choisie, × 4 horizons | `getPreviewCards` → 12 narratifs + 4 cartes inline | oui |
| **Note sous les cartes** | commune choisie | texte statique « Ces projections… » | cadre |
| **Intro des questions** | commune choisie | `getQuestionIntro` (10 branches), `getEmptyStateCopy` | promesse de sujets |
| **4 questions** | commune choisie | `tensions_catalog` (Supabase) + `getDriaSub` (sous-titre chiffré par horizon) | oui |
| **Réponse à une question** | clic | `/qna` (Claude) ← `tension_answers` (Supabase) ← `STATIC_ANSWERS` (local) | oui, génératif |
| Modules, sources, tarifs | toujours | `MODULES`, `SOURCES`, plans | descriptif |

### 2.2 Le chemin des données (accueil)

```
BAN (citycode) ─┬─> communes_categorization (Supabase, 44 communes saisies à la main) ─┐
                └─> /api/landing-signals → deriveCategoriesFromEntry(index A)          ├─> categories
                                         (repli : préfixe département)               ─┘
citycode ─> /drias?insee=  → getClimatDataCommune → public/data_climat.json
            (médiane 17 modèles DRIAS-TRACC, maille SAFRAN rattachée à la commune,
             3 scénarios gwl15/gwl20/gwl30, AUCUNE valeur présente, champ h codé "2050" pour les trois)
citycode ─> /georisques?insee= → GASPAR /gaspar/risques (liste des risques recensés sur la commune)
            → riskFlagsFromLabels → flags {flood, marineSubmersion, clay, landslide, …}
citycode ─> /api/gissol?insee=  → cadmium (score)
                                   │
categories + indicators + georisques + gissol + horizon ─> getPreviewCards ─> 4 cartes {label, val, note, col, src}
                                                                               rendu : label + val SEULEMENT
```

### 2.3 Ce qui s'affiche vraiment : l'assemblage rend la moitié des récits inatteignables

`getPreviewCards` empile les cartes climat dans un ordre fixe (canicule → feux → eau → vigne → neige →
nuits → pluies → Géorisques), puis retient **la première, plus une seule autre**, et complète avec deux
cartes de profondeur (mobilité, nature/vie locale), qui existent toujours. Comme `NORTR_yr` (nuits) est
présent pour toutes les communes, la liste climat compte toujours au moins deux éléments.

Mesuré sur les 34 788 communes, à chacun des quatre horizons, **avec des drapeaux Géorisques tous vrais et
une donnée GisSol forcée** (pire cas) :

| Carte | Communes | Commentaire |
|---|---|---|
| Canicule | 34 788 (100 %) | toujours l'accroche |
| Mobilité | 34 788 (100 %) | |
| Nature / Vie locale | 29 273 / 5 515 | |
| Eau | 14 694 | si `rural_agricole` |
| Feux | 14 168 | si `mediterranee` ou `rural_forestier` |
| Nuits | 5 376 | |
| Neige | 550 | sur 3 539 communes `montagne` (feux et eau passent avant) |
| Pluies, Submersion, Inondation, Argiles, Terrain, Vigne, Air, Immobilier, Sols | **0** | jamais avec DRIAS chargé |

**Mais ces récits « morts » sont vivants dans deux états** :

1. **Pendant le chargement.** La commune et ses catégories sont posées avant l'arrivée de DRIAS et de
   Géorisques (`loadCommuneTensions`). Pendant ce temps, les cartes sont rendues, en opacité 0,35 :
   pour toute commune, « Valeur immobilière » ; pour une commune `littoral`, la carte **Submersion** en
   accroche, tirée de la seule catégorie (distance à la côte ≤ 5 km), sans aucun fait Géorisques.
   Le fichier DRIAS fait 63 Mo ; à froid, cet état dure.
2. **Quand DRIAS ou Géorisques échoue** (404, 500, timeout) : la carte Géorisques devient l'accroche, et
   « Valeur immobilière » la quatrième carte, en pleine opacité.

Ils restent donc dans le périmètre : ils sont lus, et une refonte de l'assemblage les réveillerait.

### 2.4 Catégories : deux d'entre elles n'existent qu'à la main

`rural_viticole` et `tension_hydrique_connue` ne sont produites par **aucune** dérivation automatique ;
elles ne viennent que de `communes_categorization` (Supabase). Une seule commune porte `rural_viticole`,
sous le code `84099`… qui est **Robion**, pas Richerenches (saisie erronée). `tension_hydrique_connue` ne
concerne que La Rochelle. Le récit « Vigne » n'est donc atteignable nulle part, et l'intitulé
« Tension hydrique connue » n'est adossé à aucune donnée.

---

## 3. Chaîne réelle données → narration

### 3.1 Les entrées DRIAS réellement utilisées

| Code | Ce qu'il mesure (DRIAS-TRACC) | Unité | Grain | Temps |
|---|---|---|---|---|
| `NORTX35D_yr` | nombre de jours dans l'année où la température maximale dépasse 35 °C | jours/an | maille SAFRAN (~8 km) rattachée à la commune | 3 niveaux de réchauffement (France +2 / +2,7 / +4 °C ≈ 2030 / 2050 / 2100), médiane de 17 modèles |
| `NORTR_yr` | nuits où la température minimale reste ≥ 20 °C | nuits/an | idem | idem |
| `NORTMm_seas_JJA` / `_DJF` | température moyenne de l'été / de l'hiver | °C | idem | idem |
| `NORIFM40_yr` | jours où l'indice forêt-météo (IFM) ≥ 40 : « sensibilité feu météo élevée » | jours/an | idem, **10 modèles sur 17** | idem |
| `NORSWI04_yr` | jours où l'indice d'humidité des sols (SWI) < 0,4 : « sol sec » | jours/an | idem | idem |
| `NORRRq99_yr` | précipitation quotidienne de rang 99 % (pluie des jours les plus pluvieux) | mm | idem | idem |
| `ATX35D_yr`, `ATR_yr`, `AIFM40_yr`, `ATMm_seas_*` | **écarts** à la période de référence 1976-2005 | jours, °C | idem | idem |

Définitions vérifiées sur DRIAS (« IFM40 : nombre de jours avec une sensibilité Feu Météo Élevée (IFM ≥ 40) » ;
« SWI04 : nombre de jours avec un sol sec (SWI < 0.4) », section TRACC-2023, ajout du 20/03/2024) et sur la
fiche SWI de Météo-France (le SWI rapporte le contenu en eau du sol à sa réserve utile, entre point de
flétrissement et capacité au champ, dans un sol modélisé). Rien dans ces indicateurs ne mesure une nappe,
un débit, un prélèvement, une restriction, l'enneigement, un départ de feu, une crue ou une emprise.

**Trois faits structurants** (déjà établis par le dossier, `climat-facts.ts`) :

1. DRIAS n'expose **aucune valeur présente**. La référence 1976-2005 se **reconstruit** (projeté − écart),
   par la brique `reconstructReference` déjà écrite et testée.
2. La grandeur est officielle, la **fréquence qui la rend « notable » est une convention futur•e**
   (seuils calibrés à l'horizon 2050 : 8 jours > 35 °C, 25 nuits tropicales, 9 jours IFM ≥ 40, ~p90).
3. La sécheresse des sols n'a **pas de seuil défendable** (distribution continue) ; le dossier refuse d'en
   tirer un constat.

### 3.2 L'entrée Géorisques

`/gaspar/risques?code_insee=` renvoie la **liste des risques recensés sur la commune** (inventaire
administratif : dossiers départementaux et communaux des risques majeurs, procédures). C'est un fait
**binaire, communal, présent**. Il ne dit ni quelle part de la commune est concernée, ni avec quelle
intensité, ni comment cela évoluera. Il n'a **aucune dimension temporelle** : appliqué sous un sélecteur
« 2050 / 2100 », tout récit qui en change le contenu est inventé.

### 3.3 Le rendu

`FutureELanding.tsx:2693-2708` : chaque carte rend `item.label` et `item.val`. **`item.note` (le chiffre) et
`item.src` (la source) ne sont jamais rendus.** Le seul endroit où un chiffre DRIAS apparaît sur l'accueil
est le sous-titre des questions (`getDriaSub`), aux horizons futurs seulement.

---

## 4. Tableau complet

Légende de l'atteignabilité : **A** = affiché avec données chargées ; **C** = chargement / données en
échec ; **M** = machine à sous ; **R** = réponse à une question ; **Q** = envoyé au modèle.

### 4.1 Cartes de prévisualisation

| # | Fonction | Entrée réelle | Grain | Temps | Texte actuel (extraits) | Statut | Problème | Wording cible |
|---|---|---|---|---|---|---|---|---|
| 1 | `caniiculeNarrative` (A, 100 %) | `NORTX35D_yr` (valeur **ignorée** par le texte) | maille → commune | today = gwl15 ; 2030/2050/2100 | « restent ponctuels » / « deviennent plus fréquentes » / « pourraient devenir courants » / « pourraient durer plusieurs semaines par an » | 🔴 | texte aveugle à la valeur ; durée continue inventée ; « aujourd'hui » = 2030 | §13.1 |
| 2 | `nightsNarrative` (A, 5 376) | `NORTR_yr` (ignorée) | idem | idem | « nuits où l'on récupère difficilement pourraient devenir courantes » ; « transformer durablement les étés » | 🟡 | aveugle à la valeur (315 communes sous 7 nuits en 2100) ; « transformer durablement » | §15.2 |
| 3 | `summerTempNarrative` (repli de 1, ~0) | `NORTMm_seas_JJA` | idem | idem | « vont changer de nature » ; « comparables aux zones les plus chaudes d'Europe » | 🔴 | certitude ; comparaison européenne sans donnée | « Été moyen : {t} °C à l'horizon X, contre {ref} °C sur 1976-2005. » |
| 4 | `feuxNarrative` (A, 14 168) | `NORIFM40_yr` (ignorée) | idem, 10 modèles | idem | « Le risque d'incendie pourrait fortement progresser autour de X » ; « une grande partie de l'été » | 🔴 | indice météo appelé risque ; aveugle à la valeur ; durée continue | §9 |
| 5 | `eauNarrative` (A, 14 694) | `NORSWI04_yr` (ignorée) | idem | idem | « L'accès à l'eau pourrait devenir plus tendu » ; « transformer durablement le territoire » | 🔴 | sol sec → accès à l'eau (interdit FUT-6) | §5 Eau |
| 6 | `pluiesNarrative` (inatteignable) | `NORRRq99_yr` (ignorée) | idem | idem | « accentuer les risques de crue » ; « beaucoup plus violents » ; « provoquent déjà des tensions » | 🔴 | intensité → crue ; hausse affirmée là où l'indicateur baisse (8 165 communes en 2050 vs 2030) | §7 |
| 7 | `vigneNarrative` (inatteignable) | `NORTMm_seas_JJA` | idem | idem | « maturité des raisins s'avancer », « cépages traditionnels plus adaptés », « migrer vers des altitudes » | 🔴 | conséquences agronomiques d'une seule température | §12 |
| 8 | `neigeNarrative` (A, 550) | `NORTMm_seas_DJF` | idem | idem | « manteau neigeux se réduire », « neige rare et imprévisible », « économie montagnarde fragilisée » | 🔴 | température → enneigement → économie | §6 |
| 9 | `submersionNarrative` (C, M) | drapeau GASPAR **ou catégorie `littoral`** | commune | aucun (fait présent) | « pourrait s'étendre à de nouvelles zones » ; « des quartiers régulièrement submergés » | 🔴 | emprise future inventée ; carte possible sans fait Géorisques | §8 |
| 10 | `inondationNarrative` (C) | drapeau GASPAR | commune | aucun | « crues plus fréquentes » ; « zones aujourd'hui épargnées » | 🔴 | fréquence et emprise futures inventées | §7 |
| 11 | `argilesNarrative` (C) | drapeau GASPAR | commune | aucun | « peuvent provoquer des fissures » ; « risque de fissuration pourrait s'accroître » | 🔴 | aléa communal → dommage au bâti ; projection inventée | §10 |
| 12 | `immobilierNarrative` (C, chaque chargement) | **aucune** (ni DVF ni ADEME lus) | commune | aucun | « vont peser sur les prix » ; « première décote » ; « perdre significativement de leur valeur » ; « difficiles à assurer ou à revendre » | 🔴 | prédiction de prix et d'assurabilité sans source | §11 |
| 13 | Carte « Terrain » inline (C) | drapeau GASPAR | commune | aucun | « présente une sensibilité aux mouvements de terrain » | 🟡 | « sensibilité » qualifie ; texte invariant sous horizon | « Un risque de mouvement de terrain est recensé sur la commune (Géorisques). » |
| 14 | Carte « Air » inline (inatteignable) | catégorie `vallee_industrielle` (Seveso) | commune | aucun | « La qualité de l'air se dégrade lors des pics de chaleur, avec une hausse de l'ozone » | 🔴 | aucune donnée d'air lue ; attribution causale | supprimer |
| 15 | Carte « Qualité des sols » (inatteignable) | GisSol cadmium (score) | maille RMQS | présent | « vigilance élevée sur les sols de X » | 🟡 | grain (maille 16 km) dit « les sols de X » | « Les mesures GisSol de ce secteur indiquent… » |
| 16 | Carte « Mobilité » (A, 100 %) | catégories de densité | commune | présent | « le quotidien dépend largement de la voiture » | 🟡 | proxy (densité < 1 500 hab/km²) : 34 160 communes, dont 1 839 avec un réseau de transports `reseau_tc` | hors cœur FUT-37 (§13) |
| 17 | Carte « Nature / Vie locale » (A) | catégories | commune | présent | « commerces, services et vie associative font le quotidien » | 🟡 | phrase par défaut servie à 2 570 communes classées `faible_vie_locale` | hors cœur FUT-37 (§13) |
| 18 | Libellés de cartes | | | | « Canicule à X », « Eau à X », « Neige à X », « Feux autour de X » | 🟡 | « Canicule » ≠ jours > 35 °C ; « Eau » et « Neige » nomment ce qui n'est pas mesuré | « Jours au-dessus de 35 °C », « Sols secs », « Hivers », « Météo propice aux feux » |
| 19 | Note sous les cartes | | | | « Ces projections ne sont qu'un aperçu de ce qui pourrait changer à X » | 🟡 | deux cartes sur quatre ne sont pas des projections (mobilité, nature) | §15 |
| 20 | `HorizonSwitch` + `HORIZON_TO_GWL` | | | **today → gwl15** | « Aujourd'hui · données actuelles » | 🔴 | projection 2030 présentée comme présent | §13.1, D1 |
| 21 | Rendu des cartes | `note`, `src` calculés | | | jamais affichés | 🔴 | le fait est caché, seule l'interprétation est vue | afficher le fait (§15) |

### 4.2 Sous-titres chiffrés des questions (`DRIAS_TENSION_CONFIG` / `getDriaSub`)

| # | Question | Sous-titre à un horizon | Statut | Problème |
|---|---|---|---|---|
| 22 | canicule / acheter / enfants | « 23 jours > 30°C par an à Lyon » | ✅ | fait exact, horizon visible au sélecteur |
| 23 | `feux`, `randonner_ici` | « 8 jours de risque incendie élevé par an » | 🟡 | « risque » → « danger météo » |
| 24 | `eau_potable` (« L'eau du robinet va-t-elle rester bonne ? ») | « 144 jours de sol sec par an à X » | 🔴 | un indicateur de sol mis en réponse à une question de **qualité** de l'eau potable |
| 25 | `metier_agricole` | « N mm de pluie en été » | ✅ | fait exact |
| 26 | `vignobles` | « 24,8 °C en été » | ✅ | fait exact |

### 4.3 Textes de cadrage

| # | Texte | Statut | Problème |
|---|---|---|---|
| 27 | `getHeroCopy` | 🟡 | promet « submersion, érosion, … assurance » (littoral), « **enneigement**, saisons touristiques, mutation économique locale » (montagne) : aucune donnée d'enneigement, de saisons, d'assurance |
| 28 | `getQuestionIntro` | 🟡 | « le futur se joue entre … **accès à l'eau** », « **tension sur l'eau** », « **stress hydrique** », « **enneigement** », « transformation des sols » : posé comme fait du lieu |
| 29 | `getEmptyStateCopy` | 🟡 | « l'enneigement, le tourisme » |
| 52 | sous-titres du catalogue | 🟡 | « valeur à 20 ans », « Ressource, qualité, restrictions », « Enneigement, stations, saisons » : promesses de réponse non couvertes |
| 53 | liste `SOURCES` | 🟡 | « ACPR / Banque de France » n'est lu nulle part dans le produit ; EFSA seulement par des pages Savoir |
| 54 | `MODULES` | ✅ | descriptif, honnête (« Chaleur, eau, feux, littoral » comme sujets) |

### 4.4 Machine à sous (`SLOT_CITIES`, cartes climat et risques)

| # | Carte | Statut | Vérification |
|---|---|---|---|
| 30 | Lyon : « parmi les communes les plus exposées aux étés futurs » | 🟡 | vrai en tendance (nuits tropicales p95, jours > 30 °C p89 en 2100), mais classement national sans base affichée ; le dossier l'interdit sans fait (`interdit:classement-national`) |
| 31 | Lyon : « les nuits … **seront** plus fréquentes » · « DRIAS · +4°C » | 🟡 | certitude ; horizon implicite |
| 32 | Marseille : « parmi les communes les plus exposées » | 🟡 | vrai sur les nuits (p96-p100), faux sur les jours > 35 °C pour les 1er-3e, 6e-8e (p53) |
| 33 | Marseille : submersion | ✅ | GASPAR recense « Par submersion marine » sur 13055 |
| 34 | Vannes : « **D'ici 2050**, les étés **seront** sensiblement plus chauds » · « DRIAS · **+4°C** » | 🔴 | +4 °C = 2100 ; certitude |
| 35 | Vannes : « figure parmi les communes **exposées au risque de submersion** » | 🔴 | **faux** : GASPAR ne recense pas la submersion marine à Vannes (56260), vérifié le 02/10/2026 |
| 36 | La Rochelle : submersion | ✅ | recensée |
| 37 | La Rochelle : « Les fortes chaleurs devraient devenir plus fréquentes » | 🟡 | vrai en tendance, horizon absent, aucun chiffre |

### 4.5 Réponses aux questions

| # | Source | Question | Statut | Problème |
|---|---|---|---|---|
| 38 | `STATIC_ANSWERS` local | `acheter_littoral` | 🔴 | « le risque de submersion et d'érosion **progresse** », « le coût de l'assurance **grimpe** » : affirmations générales sans source ni grain |
| 39 | local | `enfants_sante` | 🟡 | sujets réels mais « allongement de la saison pollinique » sans donnée commune |
| 40 | local | `mobilite_fragile` | ✅ | générique, au conditionnel de fait, non prospectif |
| 41 | local | `metier_general` | 🔴 | écrit pour un profil ESS/associatif précis, servi à tous |
| 42 | local | `valeur_immo` | 🔴 | « prix stagner ou baisser (DVF 2024) », « 6 à 15 % », « **quasi invendables** » en 2030 |
| 43 | local | `default` | ✅ | |
| 44 | Supabase `tension_answers` | `acheter_littoral` | 🔴 | **La Rochelle** servie à toute commune littorale ; « risque de submersion en hausse de **+31 %** en 2050 (**DRIAS**, Géorisques) » : DRIAS ne modélise pas la submersion ; quartiers nommés ; « assurance +8 à 12 %/an (ACPR 2024) » non vérifiable |
| 45 | Supabase | `enfants_sante` (catégorie `all`) | 🔴 | « Les sols **charentais** », « canicule à **La Rochelle** de 5 à 34 jours en 2050 » : **servi à toutes les communes** |
| 46 | Supabase | `mobilite_fragile` | 🔴 | « **Bressuire** est un territoire où… » servi à toute commune périurbaine |
| 47 | Supabase | `valeur_immo` | 🔴 | identique au #42 |
| 48 | Supabase | `metier_general` | 🔴 | identique au #41 |
| 49 | Supabase | `risque_vectoriel_emergent` | 🟡 | « Oui, le moustique tigre est déjà un signal local sérieux » sur une catégorie **départementale** |
| 50 | `/qna` | `buildDriasContext` | 🔴 | `gwl30` envoyé avec `horizon: '2050'` et « +4°C » : le modèle écrit des valeurs de 2100 sous la date 2050 |
| 51 | `/qna` | `editorial_base_answer` + absence de contrôle | 🔴 | les textes #44-48 sont donnés au modèle comme base ; aucune vérification de la sortie (le dossier a `synthesis-checks.ts`, l'accueil rien) |

**Décompte : 54 unités, 8 ✅, 19 🟡, 27 🔴.**

---

## 5. Eau

**Chaîne.** `NORSWI04_yr` → nombre de jours par an où l'indice d'humidité d'un sol **modélisé** passe sous
0,4 (le sol a perdu plus de 60 % de son eau utile pour la végétation) → maille SAFRAN rattachée à la commune
→ 3 horizons → **aucune transformation** (la valeur n'est même pas lue par le texte) → phrase.

**Sorties réelles** (identiques pour les 14 694 communes, seul le nom change) :

| Horizon | Texte | Rodez (SWI : 115 / 119 / 144 j) |
|---|---|---|
| Aujourd'hui (= gwl15) | « Les périodes sèches restent occasionnelles à Rodez. » | 115 jours de sol sec, soit près d'un tiers de l'année, présenté comme « occasionnel » et comme « actuel » |
| 2030 | « Les épisodes de sécheresse deviennent plus fréquents. » | pas de référence lue, aucune comparaison possible |
| 2050 | « L'accès à l'eau pourrait devenir plus tendu pendant les étés. » | |
| 2100 | « Les sécheresses estivales pourraient transformer durablement le territoire. » | |

1. **Ce que mesure l'entrée** : l'état hydrique d'un sol de surface modélisé, compté en jours.
2. **Affirmable** : « Environ 144 jours par an de sol sec dans les projections à l'horizon 2100. »
3. **Fait dérivé légitime** : la comparaison entre horizons projetés (deux valeurs du même jeu), ou, si
   `ASWI04_yr` est branché (colonne déjà présente dans `data_climat.json`, non mappée : décision D2), la
   comparaison à 1976-2005.
4. **Interprétation autorisée** : « des sols plus souvent secs, ce qui pèse sur la végétation et les cultures
   non irriguées » (c'est la définition même du SWI : eau disponible pour les plantes).
5. **Ce qui dépasse** : « accès à l'eau » (eau potable, réseau, ressource), « transformer durablement le
   territoire », « occasionnelles » (contredit par la valeur), et le « aujourd'hui ».
6. **Type** : causalité inventée + confusion observation/projection + certitude (« deviennent »).
7. **Cible** :

> **Sols secs à Rodez**
> Environ 144 jours par an de sol sec à l'horizon 2100, contre 115 à l'horizon 2030.
> Cet indicateur décrit l'humidité du sol, utile à la végétation et aux cultures. Il ne mesure ni les
> nappes, ni les rivières, ni l'eau du robinet.

Dossier : `QuartierClimatData.tsx` écrit « le sol de la commune serait sec environ N jours par an … (DRIAS,
indice SWI < 0,4) » et juxtapose VigiEau (présent administratif) et ONDE (observation) **sans** conclure
sur la ressource. `climat-facts.ts` refuse tout seuil SWI. `synthesis-checks.ts` porte la règle
`interdit:tension-eau` (accès à l'eau, tension/pression sur la ressource, raréfaction, l'eau devient rare).
**L'accueil doit passer cette même règle.**

Question liée (#24) : la question « L'eau du robinet va-t-elle rester bonne ? » (qualité) reçoit comme
sous-titre chiffré les jours de sol sec. Le chiffre n'a aucun rapport avec la question. Cible : sous-titre
non chiffré (« Qualité de l'eau distribuée, restrictions ») ou question reformulée. Décision D2.

---

## 6. Neige

**Chaîne.** `NORTMm_seas_DJF` → température moyenne décembre-février → maille → 3 horizons → seuils
codés 2 / 3 / 4 / 6 °C (non documentés, non calibrés) → phrases sur la neige et l'économie.

**futur•e ne possède** ni enneigement, ni jours de neige, ni hauteur de manteau, ni altitude des domaines
skiables, ni données économiques de station. Seulement la température moyenne d'hiver de la maille (et
l'altitude de la commune dans l'index, non utilisée ici).

**Sorties réelles** :

| Commune (altitude index) | DJF 2030/2050/2100 | 2050 | 2100 |
|---|---|---|---|
| Chamonix (catégorie manuelle) | −3,9 / −3,1 / −1,8 °C | « Les hivers … pourraient se transformer profondément avant la moitié du siècle. » | « … pourraient être méconnaissables » |
| Les Belleville | −2,4 / −1,6 / −0,5 | idem | idem |
| commune `montagne` à DJF ≥ 3 °C en 2100 (319 cas) | | « Le manteau neigeux … pourrait se réduire significativement » | « **L'économie montagnarde** autour de X pourrait être fragilisée par des hivers trop doux. » |

Sur les 550 communes recevant la carte, **329 sont sous 1 000 m** (altitude du point de référence) : la
carte « Neige » y parle d'enneigement là où la question ne se pose souvent pas.

**Type** : causalité inventée (température → enneigement → économie), certitude, seuils silencieux.

**Cible** (fait + lecture de la même grandeur + borne) :

> **Hivers à Chamonix-Mont-Blanc**
> Température moyenne de l'hiver : −1,8 °C à l'horizon 2100, contre −5,1 °C sur 1976-2005.
> Des hivers nettement plus doux. futur•e ne mesure pas l'enneigement : il dépend aussi de l'altitude des
> pentes et des précipitations.

Un fait de température reste concret et utile : « la moyenne hivernale passerait au-dessus de 0 °C »
(franchissement d'un seuil physique, pas d'une convention) est permis, à condition de ne pas écrire
« neige ».

---

## 7. Pluies / inondations

### 7.1 Pluies (`pluiesNarrative`, inatteignable aujourd'hui)

`NORRRq99_yr` est la **hauteur** de pluie des jours les plus pluvieux (rang 99 %), en mm. Ce n'est ni une
fréquence, ni une crue. Le texte dit « plus fréquents » (fréquence), « accentuer les risques de crue »
(crue), « beaucoup plus violents » (intensité). Or l'indicateur **baisse** entre 2030 et 2050 dans
**8 165 communes**, et entre 2030 et 2100 dans 3 968 (le dossier le note : « signal non monotone, décroît
en Méditerranée »). Hyères : 36,7 → 34,8 → 34,3 mm, et le texte dirait « plus violents ».

Le dossier utilise `NORRx1d_yr` (pluie maximale en 24 h) et son écart **relatif** `ARRx1d_yr` (déjà mappé,
`climat-facts.ts`, `pluieMax24h`), avec la phrase « Jusqu'à N mm en une journée ».

**Cible** : basculer sur `NORRx1d_yr` + référence reconstruite (division, écart relatif) ; ne dire « plus »
que si l'écart est positif ;

> **Pluies intenses à Nîmes**
> Jusqu'à {N} mm en une journée à l'horizon 2050, contre {réf} mm sur 1976-2005.
> Une pluie plus forte ne dit pas, à elle seule, où l'eau déborde : cela dépend du relief, des cours d'eau
> et des aménagements.

### 7.2 Inondation (`inondationNarrative`)

Entrée : un booléen GASPAR « Inondation recensée sur la commune ». **Aucune projection.** Le texte invente :
« crues plus fréquentes d'ici 2030 » (fréquence future), « pourrait s'intensifier avec des pluies plus
violentes » (raccord pluie → inondation que FUT-6 refuse : `raccord:non-autorise`), « toucher des zones
aujourd'hui épargnées d'ici 2100 » (emprise future).

**Cible, invariante par horizon** :

> **Inondation à X**
> L'État recense un risque d'inondation sur la commune (Géorisques). Ce recensement est actuel : il ne dit
> pas quelle partie de la commune est concernée, ni comment elle évoluera. L'exposition d'une adresse se lit
> dans le dossier Logement.

Aux horizons futurs, la carte porte la mention « fait actuel, pas de projection disponible » plutôt que de
changer de texte.

---

## 8. Submersion / niveau marin

**Chaîne.** Drapeau GASPAR `marineSubmersion` (« Par submersion marine » recensé) **ou**, si Géorisques est
absent, la seule catégorie `littoral` (`distance_cote_km ≤ 5`, proxy que FUT-33 remplace) → aucune
donnée de niveau marin, aucune projection d'élévation, aucune emprise.

Le commentaire du code dit « horizon-aware, basées sur projections SLR » : **aucune donnée SLR n'est lue.**

| Horizon | Texte actuel | Problème |
|---|---|---|
| today | « X figure parmi les communes exposées au risque de submersion marine. » | ✅ si drapeau GASPAR ; 🔴 si catégorie seule |
| 2030 | « La montée des eaux pourrait aggraver le risque … » | raccord niveau marin → risque local sans donnée |
| 2050 | « … pourrait s'étendre à de **nouvelles zones** » | emprise future inventée |
| 2100 | « des **quartiers** de X pourraient être **régulièrement submergés** par la mer » | grain (quartier), fréquence (régulièrement), emprise : rien de mesuré |

Cas réel : **Vannes** pendant le chargement (catégorie `littoral`, Géorisques pas encore là) : la carte
d'accroche dit « Vannes figure parmi les communes exposées au risque de submersion marine. » GASPAR ne le
recense pas. La machine à sous du hero dit la même chose (#35), en permanence.

**Cible (indépendante de FUT-33)** : la carte n'existe **que** sur drapeau GASPAR ; plus de repli sur la
catégorie ; texte invariant par horizon :

> **Submersion marine à La Rochelle**
> L'État recense le risque de submersion marine sur la commune (Géorisques). futur•e ne dispose pas de
> carte de son étendue future : la hausse du niveau de la mer ne se traduit pas mécaniquement en zones
> submergées. L'exposition d'une adresse se lit dans le dossier Logement.

Quand FUT-33 livrera une vérité littorale (distance réelle, érosion Cerema), FUT-37 n'aura rien à défaire :
la carte ne lit que GASPAR.

---

## 9. Feux

**Chaîne.** `NORIFM40_yr` → jours où l'indice forêt-météo dépasse 40 (« sensibilité feu météo élevée »,
DRIAS) → 10 modèles sur 17 → texte qui n'utilise pas la valeur.

L'IFM combine température, humidité de l'air, vent et pluies passées : c'est un **danger météorologique**.
Il ne dit rien de la végétation présente, des départs de feu, de l'historique d'incendie, ni d'une
occurrence future. Le dossier l'écrit : « Cet indice reflète la météo, pas la probabilité réelle »
(`QuartierClimatData.tsx`) ; « la phrase ne doit pas promettre plus que la donnée » (`climat-facts.ts`).

**Sorties réelles** :

| Commune | IFM40 2030 / 2050 / 2100 | 2050 | 2100 |
|---|---|---|---|
| Briançon | 0 / 0 / 1 | « Le risque d'incendie pourrait **fortement progresser** autour de Briançon. » | « Les périodes à risque élevé pourraient durer **une grande partie de l'été**. » |
| Mimizan | 1 / 2 / 4 | idem | idem |
| Nîmes | 44 / 50 / 66 | idem | idem |

Sur les 14 168 communes recevant la carte : 10 338 (73 %) restent sous 10 jours en 2100 ; 12 654 (89 %) sous
30 jours. « Une grande partie de l'été » (≈ 92 jours) n'est vraie nulle part, et la continuité n'est de
toute façon pas déductible.

**Type** : confusion aléa météo / risque / occurrence ; durée continue inventée ; valeur ignorée.

**Cible** :

> **Météo propice aux feux autour de Nîmes**
> 50 jours par an de danger météorologique élevé pour les feux à l'horizon 2050, contre 34 sur
> 1976-2005 (indice forêt-météo ≥ 40).
> L'indice décrit la météo ; qu'un feu se déclare dépend aussi de la végétation et des départs de feu.

Sous 1,5 jour (convention déjà utilisée par le dossier pour « Restent rares ») : « Les journées de météo
très propice aux feux restent rares dans les projections. » Ou pas de carte (décision D4).

Si GASPAR recense « Feu de forêt » (`flags.wildfire`, fiable depuis le correctif de `georisques-flags.ts`),
c'est un **second fait**, présent et administratif, qui peut se juxtaposer sans raccord.

---

## 10. Argiles

**Chaîne.** Drapeau GASPAR `clay` (« Tassements différentiels » ou libellé « argile ») → présent, communal.

| Horizon | Texte | Statut |
|---|---|---|
| today | « Les sols argileux de X peuvent provoquer des fissures dans les bâtiments lors des sécheresses. » | 🟡 : mécanisme vrai en général, mais l'aléa n'est pas uniforme sur la commune |
| 2030 | « Les sécheresses plus fréquentes à X pourraient aggraver le retrait-gonflement » | 🔴 : « plus fréquentes » non mesuré ici, raccord sécheresse → aléa |
| 2050 | « Le risque de fissuration … pourrait s'accroître avec l'allongement des sécheresses » | 🔴 : « allongement » (durée) non mesuré |
| 2100 | « … nettement plus fréquents d'ici 2100 » | 🔴 |

Le dossier : « Le retrait-gonflement des argiles est une CONSÉQUENCE géotechnique sur certains sols, pas une
mesure de la sécheresse : il est couvert par le module Logement, au grain adresse » (`climat-facts.ts`).
La règle `catnat:secheresse-prolongee` refuse déjà le raccord CatNat sécheresse ↔ jours de sols secs.

**Cible, invariante** :

> **Argiles à X**
> Un risque lié au retrait-gonflement des argiles est recensé sur la commune (Géorisques). Son effet sur un
> bâtiment dépend du sol de la parcelle et des fondations : il se lit à l'adresse, dans le dossier
> Logement.

---

## 11. Immobilier / assurance

**Le garde-fou majeur est franchi**, à trois endroits.

1. **`immobilierNarrative`** (carte « Valeur immobilière », source affichée nulle part mais déclarée
   `'DVF / ADEME'`) : **aucune donnée n'est lue**. Ni DVF, ni DPE, ni risque. Elle s'affiche pendant
   **chaque** chargement de commune (grisée) et en pleine opacité si DRIAS échoue.
   - today : « À X, les risques climatiques et les normes énergétiques **vont peser sur les prix**. »
   - 2030 : « … les biens en zone à risque pourraient connaître une **première décote**. »
   - 2050 : « … pourraient **perdre significativement de leur valeur** d'ici 2050. »
   - 2100 : « Certains biens … pourraient devenir **difficiles à assurer ou à revendre**. »
2. **`valeur_immo`** (Supabase et local, catégorie `all` : une des 4 questions de repli pour toute commune) :
   « voient déjà leurs prix stagner ou baisser (DVF 2024) », « 6 à 15 % moins cher (ADEME) », « rendront
   certains biens **quasi invendables** ». Aucune de ces sources n'est lue par l'accueil ; les chiffres ne
   sont ni datés ni localisés.
3. **`acheter_littoral`** : « le coût de l'assurance habitation grimpe » / « progressent de 8 à 12 % par an
   (ACPR 2024) », « assurabilité future ».

**Cible** : supprimer `immobilierNarrative` (et la notion de carte de repli). Pour la question « Mon
logement va-t-il perdre de la valeur ? », qui est une vraie question de lecteur, une réponse qui dit ce que
futur•e sait regarder sans prédire :

> « futur•e ne prédit pas les prix. Il regarde ce qui pèse dans une décision d'achat et se vérifie : le
> diagnostic énergétique du logement, les risques recensés à son adresse, les sinistres déjà indemnisés
> sur la commune. »

Le chiffre ADEME sur la décote des passoires (« valeur verte ») est une étude **nationale et passée** ; s'il
est conservé, il doit être daté, sourcé et présenté comme tel, jamais comme une projection locale (D5).

---

## 12. Vigne

Entrée : température moyenne estivale (une seule variable). Le texte en déduit l'avancée de la maturité,
l'inadaptation des cépages traditionnels, la transformation des vins, la migration en altitude. Aucune de
ces conséquences n'est mesurable par une température moyenne (le calendrier végétatif dépend des sommes de
températures, des extrêmes, de l'eau, du cépage, du porte-greffe, des pratiques).

De plus, le récit est **inatteignable** (une seule commune `rural_viticole`, sous un code faux, et toujours
devancée par les feux). **Cible : supprimer.** Si la question `vignobles` est conservée, son sous-titre
chiffré (« 24,8 °C en été ») est un fait juste et suffit ; la réponse doit borner (« futur•e ne mesure ni
le rendement, ni la qualité, ni l'adaptation des cépages »). La catégorie `rural_viticole` n'a aucune
dérivation : décision D9.

---

## 13. Autres récits problématiques découverts

1. **Canicule, l'accroche universelle** (§13.1 ci-dessous, la faute la plus vue).
2. **Le faux présent** : `HORIZON_TO_GWL.today = null` puis `?? 'gwl15'` (`getPreviewCards`, `getDriasCard`).
   L'onglet dit « données actuelles ».
3. **L'horizon du modèle** : `LANDING_DRIAS_SCENARIO = { id: 'gwl30', horizon: '2050', shortLabel: '+4°C' }`.
   Et `getClimatDataCommune` code `h: "2050"` pour les trois scénarios (champ non lu par l'accueil, mais
   faux).
4. **Le fait caché** : `note` et `src` jamais rendus.
5. **Les réponses d'une commune servies aux autres** (Supabase `tension_answers`, §4.5).
6. **Aucun contrôle de la réponse générée** par `/qna`, alors que le dossier en a un (`synthesis-checks.ts`).
   Le prompt système se présente comme moteur de « personalized climate projections for individual users ».
7. **Machine à sous** : Vannes submersion faux ; Vannes « 2050 » sous « +4 °C ».
8. **Catégorie manuelle erronée** : `84099` = Robion, saisi « Richerenches ».
9. **Cartes de profondeur** (non prospectives, signalées pour un autre ticket) : « dépend largement de la
   voiture » servi à 34 160 communes sur un critère de densité, dont 1 839 dotées d'un réseau de transports ;
   « commerces, services et vie associative font le quotidien » servi à 2 570 communes classées
   `faible_vie_locale`. Grammaire : « À Les Belleville » (`aCommune` existe dans `typography.ts`).
10. **La carte « Air »** : « hausse de l'ozone » déduite de la présence d'un site Seveso.

### 13.1 Canicule : le détail

`NORTX35D_yr`, valeur ignorée par le texte.

| Horizon | Texte (toutes communes) | Contre-exemples réels |
|---|---|---|
| today (= gwl15) | « Les épisodes de chaleur extrême restent ponctuels à X. » | présenté comme actuel ; Nîmes 8,7 j, Aix 9,2 j |
| 2030 | « Les journées au-dessus de 35°C deviennent plus fréquentes l'été. » | 6 293 communes avec un écart < 0,5 jour ; Chamonix 0 |
| 2050 | « Les épisodes de chaleur extrême pourraient devenir courants à X. » | 13 601 communes sous 3 jours ; Brest 0,4 |
| 2100 | « Les chaleurs extrêmes pourraient durer plusieurs semaines par an. » | 28 575 communes (82 %) sous 14 jours ; Brest 0,9 ; Lille 3,2 ; Chamonix 0 |

**Cible** (exemple Nîmes, 2050) :

> **Jours au-dessus de 35 °C à Nîmes**
> 14 jours par an à l'horizon 2050, contre 3 sur 1976-2005.
> Une commune sur dix en France atteint 8 jours ou plus à cet horizon : Nîmes en fait partie.

Exemple Brest, 2050 : « Les journées au-dessus de 35 °C restent rares dans les projections (moins d'une par
an à l'horizon 2050). » La carte d'accroche peut alors choisir un autre fait plus parlant pour la commune
(décision D4).

---

## 14. Comparaison avec les formulations du dossier

| Sujet | Accueil | Dossier (fichier) | Ce qui peut être mutualisé |
|---|---|---|---|
| Horizons | `HORIZON_TO_GWL` local, today → gwl15, gwl30 « 2050 » pour le modèle | `src/lib/horizons.ts` (`HORIZON`, `mentionHorizon`) | **importer `horizons.ts`** ; supprimer `LANDING_DRIAS_SCENARIO` |
| Présent | « données actuelles » | `climat-facts.ts` : pas de présent, référence reconstruite, `CLIMAT_REFERENCE_LABEL` | `reconstructReference`, libellé « période de référence 1976-2005 » |
| Seuils « notable » | 2 / 3 / 4 / 6 °C, 24 / 26 / 28 °C codés en ligne, non documentés | `CLIMAT_METRICS` (8 j, 25 nuits, 9 j IFM ; calibrés p90 à 2050, nommés, versionnés) | importer `CLIMAT_METRICS` pour la qualification à 2050 |
| Rareté | aucune | `QuartierClimatData.tsx` : « Restent rares » si < 1,5 | même convention |
| Feux | « risque d'incendie » | « Conditions favorables au feu · indice météo, pas risque réel » | vocabulaire commun |
| Sols secs | « accès à l'eau » | « le sol de la commune serait sec environ N jours » ; pas de seuil | phrase commune ; règle `interdit:tension-eau` |
| Pluie | `NORRRq99_yr`, « plus violents » | `NORRx1d_yr` + `ARRx1d_yr` relatif (`pluieMax24h`), « Jusqu'à N mm en une journée » | même indicateur et même référence |
| Jours ≠ durée | « durer plusieurs semaines », « une grande partie de l'été » | note : « ne permettent pas, à eux seuls, de déduire la durée ni la continuité d'une période » | règle commune (§17) |
| Risques recensés | « figure parmi les communes exposées », projections inventées | « Ces risques sont identifiés à l'échelle de la commune. L'exposition précise de votre adresse est accessible dans le module Logement. » | phrase commune |
| Libellés CatNat | | `simplifyCatnatRisk` (« Chocs liés aux vagues », jamais « érosion ») | déjà partagé |
| Contrôles | aucun | `synthesis-checks.ts` : `interdit:tension-eau`, `raccord:non-autorise`, `interdit:classement-national`, `interdit:marche-logement`, `catnat:secheresse-prolongee`, polarité, négation | **exporter un sous-ensemble « règles universelles »** et l'appliquer en test aux sorties de l'accueil, et en contrôle à `/qna` |

À noter : le dossier lui-même écrit « X est classée en zone à risque inondation » (`QuartierClimatData.tsx`,
code mort selon FUT-6), formulation que la cible ci-dessus corrige aussi. Hors périmètre.

**Ce qui peut être mutualisé sans grand chantier** : `horizons.ts`, `CLIMAT_METRICS` + `reconstructReference`
(déjà purs), et un export des règles universelles de `synthesis-checks.ts` (`interdit:tension-eau`,
`raccord:non-autorise`, `interdit:classement-national`, `interdit:marche-logement`, plus deux nouvelles,
§17). **Ce qui ne doit pas l'être maintenant** : la projection de faits `synthesis-contract.ts` (pensée pour
un LLM et un snapshot, trop lourde pour quatre cartes déterministes).

---

## 15. Doctrine éditoriale cible

### 15.1 La hiérarchie proposée tient, avec trois amendements

**Niveau 1, le fait** : « Les projections indiquent X jours… » — **tient**, à condition que le fait soit
**affiché** (aujourd'hui il est calculé puis jeté) et qu'il porte sa grandeur exacte, son horizon et sa
référence.

**Niveau 2, la lecture autorisée** — **tient**, mais doit être resserrée : une lecture n'est autorisée que
si elle **reste dans la grandeur mesurée**. « Des nuits où l'on récupère mal » est une lecture de la
nuit tropicale (c'est sa définition sanitaire). « L'accès à l'eau » n'est pas une lecture du sol sec :
c'est un autre objet. Et la lecture doit **dépendre de la valeur** : la même phrase pour 0 et 66 jours
n'est pas une lecture, c'est un slogan.

**Niveau 3, la conséquence à vérifier** — **tient**, mais le risque qu'on veut éviter (le texte défensif)
se contrôle par une règle de forme : la borne **nomme ce que futur•e ne mesure pas** (une ou deux choses
précises) et, quand il existe, **où futur•e le regarde** (« à l'adresse, dans le dossier Logement »). Pas
de « diverses conséquences qu'il convient d'interpréter ».

**Trois amendements :**

- **A. Le niveau 0, le nom.** Avant le fait, le titre : il nomme la grandeur, pas la peur. « Jours
  au-dessus de 35 °C », pas « Canicule » ; « Sols secs », pas « Eau » ; « Hivers », pas « Neige » ;
  « Météo propice aux feux », pas « Feux ». La moitié des dépassements actuels commence au titre.
- **B. Le fait administratif n'a pas d'horizon.** Un risque recensé par l'État est un fait **actuel** :
  sous un sélecteur 2050, il reste identique et le dit (« fait actuel, pas de projection disponible »).
  Changer son texte avec l'horizon, c'est fabriquer une projection.
- **C. Rare se dit, ou se tait.** Sous la convention de rareté, la carte dit « restent rares » avec le
  chiffre, ou cède sa place à un fait plus parlant. Jamais une tendance générale plaquée sur une valeur
  nulle.

### 15.2 La règle, en une phrase par famille

| Famille | Fait (N1) | Lecture permise (N2) | Borne nommée (N3) | Interdit |
|---|---|---|---|---|
| Jours > 35 °C, nuits ≥ 20 °C | N jours/nuits par an à l'horizon, contre réf. 1976-2005 | « plus fréquents » si l'écart est positif ; position nationale **avec la convention dite** ; nuits : récupération difficile | — | durée, continuité, « semaines », « tout l'été », « courant » sans seuil |
| Températures saisonnières | moyenne °C à l'horizon, contre réf. | « plus doux / plus chauds » ; passage sous/au-dessus de 0 °C | enneigement non mesuré | neige, manteau, station, économie, comparaison européenne |
| IFM ≥ 40 | N jours de danger météo feu élevé | météo plus souvent propice | végétation, départs de feu | « risque d'incendie », « le feu atteindra », durée |
| Sols secs | N jours de sol sec (SWI < 0,4) | sols plus souvent secs pour la végétation | nappes, rivières, eau du robinet | accès, tension, pénurie, ressource |
| Pluie 24 h | jusqu'à N mm en une journée, contre réf. | pluies extrêmes plus fortes si l'écart > 0 | débordement selon relief et cours d'eau | crue, inondation, fréquence de crue |
| Risque recensé (GASPAR) | « l'État recense le risque X sur la commune » | — | partie concernée et évolution inconnues ; adresse → Logement | extension, nouvelles zones, quartiers, fréquence future |
| Immobilier / assurance | (aucun fait à l'accueil) | — | « futur•e ne prédit pas les prix » | décote, perte de valeur, invendable, inassurable, « vont peser » |
| Agriculture / vigne | température, pluie saisonnière | — | rendement, qualité, cépage non mesurés | maturité, cépages inadaptés, migration |

### 15.3 Le grain dans la phrase

Le sujet grammatical doit avoir le grain de l'entrée : DRIAS → « à X » / « les projections pour X » (la
maille est rattachée à la commune ; la mention « maille de ~8 km » vit dans la couche secondaire) ;
GASPAR → « sur la commune » ; GisSol → « dans ce secteur ». Jamais « autour de ce logement », « votre
logement », « des quartiers », « ces zones ». « Autour de X » (feux, vigne, argiles) suggère un rayon que la
donnée n'a pas : « à X ».

---

## 16. Plan exact d'implémentation (proposé, à valider)

Ordre par gravité et par dépendance. Chaque étape est un commit, testée.

**Étape 0 — extraire, sans changer un mot.** Déplacer les fonctions narratives, `getPreviewCards`,
`getHeroCopy`, `getQuestionIntro`, `getEmptyStateCopy`, `getDriaSub`, `buildDriasContext` dans un module pur
`src/lib/accueil/recits.ts` (pas de JSX, pas de `@ts-nocheck`), et poser des **tests de caractérisation**
qui figent les sorties actuelles sur le panel (annexe A). Sans cette étape, rien n'est testable : le
composant est un client de 3 772 lignes.

**Étape 1 — la vérité du temps.**
- `HORIZON_TO_GWL` et `LANDING_DRIAS_SCENARIO` remplacés par `horizons.ts`.
- Onglet « Aujourd'hui » : selon D1 (recommandé : « 1976-2005 » avec la référence reconstruite, ou retrait
  des valeurs DRIAS de cet onglet).
- `buildDriasContext` : `gwl20`, « 2050 », `mentionHorizon('gwl20')`.

**Étape 2 — montrer le fait.** La carte devient `{ titre, fait, lecture?, borne?, source, grain }`. Le rendu
affiche `fait` et `source`. La note sous les cartes cesse d'appeler « projections » des cartes qui n'en sont
pas.

**Étape 3 — réécrire les familles atteignables, conditionnées par la valeur** : canicule, nuits, feux,
eau/sols secs, neige/hivers, selon §15.2 ; conventions importées de `CLIMAT_METRICS` ; « restent rares »
sous 1,5 ; référence par `reconstructReference` (TX35, TR, IFM40, DJF ; SWI selon D2).

**Étape 4 — risques recensés et repli.** `submersionNarrative`, `inondationNarrative`, `argilesNarrative`,
carte Terrain : textes invariants par horizon (§7-10). Suppression du repli `littoral` sans GASPAR.
Suppression de `immobilierNarrative`, de la carte Air, et de la notion de carte de repli ; état de
chargement : squelette sans texte (D10).

**Étape 5 — récits morts** : supprimer `vigneNarrative` ; `pluiesNarrative` réécrite sur `NORRx1d_yr` ou
supprimée (D7). Corriger `84099` dans `communes_categorization` (D9).

**Étape 6 — cadrage** : `getHeroCopy`, `getQuestionIntro`, `getEmptyStateCopy` (retirer « accès à l'eau »,
« tension sur l'eau », « stress hydrique », « enneigement », « assurance » comme sujets mesurés) ;
`SOURCES` (retirer ACPR) ; sous-titres `feux` et `eau_potable`.

**Étape 7 — machine à sous** : réécrire les 8 cartes climat/risque depuis des faits vérifiés (Vannes :
retirer la submersion ; horizon et niveau cohérents).

**Étape 8 — réponses** : réécrire `STATIC_ANSWERS` ; **réécrire ou vider** les 6 lignes de
`tension_answers` (écriture en base de production : D6) ; `/qna` cesse d'envoyer `editorial_base_answer`
chiffré, et la réponse générée passe les règles universelles (§17) avec repli déterministe en cas de
violation (D8).

Hors FUT-37 (ticket séparé proposé) : cartes Mobilité et Vie locale (§13.9).

---

## 17. Matrice de tests

Principe : **pas de liste noire de mots**, mais des assertions **fonction × entrée → sortie**, sur une
grille d'entrées qui couvre les branches (valeurs nulles, faibles, médianes, extrêmes ; 4 horizons ;
drapeaux vrais/faux ; catégories). Les familles interdites s'expriment comme les règles de
`synthesis-checks.ts` : une **assertion** avec sa polarité, pas un mot.

| # | Famille | Fonction | Entrée | Assertion |
|---|---|---|---|---|
| T1 | Le fait est vrai | toutes cartes DRIAS | grille de valeurs × horizons | le chiffre affiché = valeur DRIAS du scénario de l'horizon (pas d'un autre) |
| T2 | Valeur nulle ou faible | canicule, nuits, feux | 0 ; 0,4 ; 1,4 | la sortie dit « rares » et ne contient aucune assertion de hausse, de fréquence courante ou de durée (cas Chamonix, Briançon, Brest) |
| T3 | Hausse seulement si écart > 0 | pluie, sols secs, toutes | écart ≤ 0 | aucune assertion « plus », « davantage », « s'intensifie » |
| T4 | Jours ≠ durée | toutes cartes « jours/an » | toute valeur | aucune assertion de continuité : « semaines », « durer », « une grande partie de l'été », conversions jours → semaines/mois |
| T5 | Pas de présent projeté | toutes | horizon « référence/aujourd'hui » | aucune valeur gwl15 sous un libellé actuel ; libellé = période de référence |
| T6 | Horizon ↔ niveau | `buildDriasContext`, SLOT, `HorizonSwitch` | chaque scénario | l'année et le niveau affichés = `HORIZON[gwl]` (gwl30 ↔ 2100 ↔ +4 °C) |
| T7 | Sols secs ≠ eau | carte sols secs, sous-titre `eau_potable`, intro | toute valeur | la règle `interdit:tension-eau` (importée) ne se déclenche sur aucune sortie |
| T8 | Température ≠ neige | carte hivers | toute valeur DJF | aucune assertion sur neige, manteau, enneigement, station, économie |
| T9 | IFM ≠ risque | carte feux, sous-titres | toute valeur | la sortie qualifie « météo » ; aucune assertion d'occurrence (« le feu atteindra », « risque d'incendie » nu) |
| T10 | Risque recensé : pas d'horizon | cartes GASPAR | drapeau vrai × 4 horizons | sortie identique sur les 4 horizons ; aucune assertion d'extension, de nouvelles zones, de quartiers, de fréquence future |
| T11 | Pas de risque sans fait | cartes GASPAR | drapeau faux + catégorie `littoral` ; Géorisques `null` | aucune carte submersion/inondation |
| T12 | Immobilier | **toutes les sorties de l'accueil** (cartes, cadrage, `STATIC_ANSWERS`) | grille complète | aucune assertion de prix, décote, perte de valeur, invendabilité, assurabilité (règle `interdit:marche-logement` étendue) |
| T13 | Grain | toutes | toutes | aucun sujet à l'adresse ou au logement (« votre logement », « autour de ce logement », « à votre adresse », « des quartiers ») depuis une entrée communale |
| T14 | Pas de classement sans base | SLOT, cartes | | règle `interdit:classement-national`, sauf phrase portant la convention (« une commune sur dix… ») |
| T15 | Une commune ne parle pas d'une autre | `STATIC_ANSWERS`, `tension_answers` (fixture exportée), `editorial_base_answer` | n'importe quelle commune | aucun nom de commune autre que celle demandée ; aucun chiffre non issu du payload |
| T16 | Régression réelle | `getPreviewCards` | fixtures Chamonix, Briançon, Brest, Vannes, Nîmes, Rodez (valeurs DRIAS figées) | sorties attendues écrites en clair (le test lit comme une spécification) |
| T17 | Contrôle `/qna` | fonction de vérification extraite | sorties réelles fautives (« l'accès à l'eau… », « +31 % de submersion… ») | violation détectée → repli déterministe |

T2, T4, T5, T10 et T16 auraient chacun échoué sur `main`.

Corollaire AGENTS.md (« la carte apparaît » ≠ « la carte dit vrai ») : T1 et T16 testent ce que la carte
**raconte**, pas seulement qu'elle apparaît.

---

## 18. Risques / questions ouvertes

### Décisions à valider avant implémentation

- **D1. L'onglet « Aujourd'hui ».** (a) le renommer « 1976-2005 » et y afficher la référence reconstruite
  (recommandé : c'est le seul « avant » que DRIAS permet, et le dossier l'affiche déjà) ; (b) le garder
  « Aujourd'hui » mais n'y montrer que des faits présents (GASPAR, CatNat) ; (c) le supprimer.
- **D2. Sols secs.** (a) carte « Sols secs » avec la valeur projetée et la borne (recommandé) ; (b) mapper
  `ASWI04_yr` (colonne déjà dans `data_climat.json`, aucune ingestion) pour dire « contre N sur 1976-2005 » ;
  (c) retirer la carte (le dossier refuse tout seuil SWI). Et la question `eau_potable` : sous-titre non
  chiffré ou question retirée.
- **D3. Hivers en montagne.** Carte « Hivers » de température seule, ou retrait.
- **D4. Conventions et accroche.** Réutiliser les seuils de `CLIMAT_METRICS` (calibrés à 2050) pour qualifier
  à 2050 seulement, et ne qualifier qu'en chiffres aux autres horizons ? L'accroche reste-t-elle toujours la
  chaleur, ou devient-elle le fait le plus marqué de la commune (avec la convention dite) ?
- **D5. Immobilier.** Suppression de la carte (recommandé) ; réponse `valeur_immo` sans prédiction ; le
  chiffre ADEME est-il conservé, daté, comme fait national passé ?
- **D6. `tension_answers` en production.** Réécrire les 6 lignes, ou les vider et laisser `/qna` + un repli
  local honnête ? C'est une écriture en base partagée.
- **D7. Pluies.** Basculer sur `NORRx1d_yr` (cohérence avec le dossier) ou retirer.
- **D8. Contrôle de `/qna`.** Ajouter le contrôle déterministe et un repli dans FUT-37 (recommandé : sans lui,
  la surface la plus libre de l'accueil reste sans garde-fou), ou ticket séparé ?
- **D9. Catégories manuelles.** Corriger `84099` ; supprimer `rural_viticole` et `tension_hydrique_connue`
  (aucune dérivation, aucune donnée) ou les assumer comme éditoriales.
- **D10. État de chargement.** Squelette sans texte (recommandé) plutôt que des récits de repli.
- **D11. Cartes Mobilité / Vie locale.** Ticket séparé (recommandé) : non prospectives, mais deux
  contradictions mesurées.

### Risques

- **Perte d'effet « wow ».** Les cartes actuelles sont dramatiques parce qu'elles sont génériques. Les
  cibles sont plus calmes, mais chiffrées et propres à la commune ; le contraste entre communes (Nîmes
  14 jours, Brest moins d'un) devient l'argument, ce qu'aucune carte n'offre aujourd'hui.
- **Le seuil qui se dédouble** (leçon AGENTS.md du 25/07) : si l'accueil importe `CLIMAT_METRICS`, tout
  texte qui cite la convention doit lire la même constante. Lister par `grep` sur `threshold`,
  `ambientThreshold` et tout booléen pré-calculé avant de committer.
- **Le LLM** : même avec des entrées propres, `/qna` peut écrire « l'accès à l'eau ». Sans D8, FUT-37 ne
  sécurise que la partie déterministe.
- **Données Supabase** : le catalogue et les réponses vivent hors du dépôt ; les tests ne les voient que si on
  exporte une fixture (T15).
- **FUT-33** : aucune dépendance si la carte submersion ne lit plus que GASPAR (§8). La catégorie `littoral`
  continue de piloter les questions et le cadrage ; FUT-33 en changera le périmètre, pas le texte.

---

## Annexe A. Méthode de reproduction

Aucun script n'est versionné (consigne : rien de produit). Pour rejouer :

1. Extraire du composant, sans modification, les lignes 21-34 (`C`), 100-151, 290-380 et 395-864 de
   `src/components/FutureELanding.tsx` dans un fichier `.ts`, précédé de
   `import { deCommune } from "@/lib/typography"` et du type `Horizon`.
2. Charger ce fichier avec `jiti` (présent dans `node_modules`), alias `@` → `src`, `server-only` → module vide.
3. Pour chaque commune : catégories = `communes_categorization` (44 communes manuelles) sinon
   `deriveCategoriesFromEntry(getCommuneEntry(insee))` ; indicateurs = `getClimatDataCommune(insee)` ;
   drapeaux = `riskFlagsFromLabels` sur `https://georisques.gouv.fr/api/v1/gaspar/risques?code_insee=`
   (interrogé le 02/10/2026) ; appeler `getPreviewCards(nom, cats, ind, geo, null, h)` pour les 4 horizons.
4. National : même chose sur les 34 788 communes de l'index, Géorisques forcé à `null` puis à « tous
   drapeaux vrais » (pire cas pour l'atteignabilité).

Panel : La Rochelle, Vannes, Brest, Marseille 7e, Lyon 6e, Chamonix, Les Belleville, Briançon, Font-Romeu,
Robion (84099), Aix-en-Provence, Hyères, La Teste-de-Buch, Mimizan, Bressuire, Châteaudun, Lille, Nîmes,
Rodez, Nantes, Tours, Montreuil.

## Annexe B. Sorties réelles (extraits du panel)

| Commune | Horizon | Cartes produites (titre :: texte) |
|---|---|---|
| Chamonix (TX35 = 0/0/0) | 2100 | Canicule :: « Les chaleurs extrêmes pourraient durer plusieurs semaines par an. » · Neige :: « Les hivers à Chamonix-Mont-Blanc pourraient être méconnaissables d'ici la fin du siècle. » |
| Briançon (IFM40 = 0/0/1) | 2050 | Canicule :: « Les épisodes de chaleur extrême pourraient devenir courants à Briançon. » · Feux :: « Le risque d'incendie pourrait fortement progresser autour de Briançon. » |
| Brest (TX35 = 0,2/0,4/0,9) | 2100 | Canicule :: « Les chaleurs extrêmes pourraient durer plusieurs semaines par an. » · Nuits :: « Les nuits tropicales pourraient transformer durablement les étés à Brest. » |
| Rodez (SWI = 115/119/144) | aujourd'hui | Eau :: « Les périodes sèches restent occasionnelles à Rodez. » |
| Rodez | 2050 | Eau :: « L'accès à l'eau pourrait devenir plus tendu pendant les étés. » |
| Châteaudun | 2050 | identique à Rodez |
| La Rochelle | 2050 | identique à Rodez (catégorie manuelle `tension_hydrique_connue`) |
| Nîmes (IFM40 = 44/50/66) | 2100 | Feux :: « Les périodes à risque élevé pourraient durer une grande partie de l'été. » |
| Mimizan (IFM40 = 1/2/4) | 2100 | Feux :: identique à Nîmes |
| Vannes, pendant le chargement | toutes | Submersion :: « Vannes figure parmi les communes exposées au risque de submersion marine. » (GASPAR : non recensé) · Valeur immobilière :: « À Vannes, les risques climatiques et les normes énergétiques vont peser sur les prix. » |
| Toute commune `littoral`, question « Acheter à X ? », repli ou base du modèle | — | « La Rochelle présente un risque de submersion en hausse de +31 % en scénario médian 2050 (DRIAS, Géorisques). Les Minimes et Aytré sont en zone PPRi… » |

Sources primaires consultées : [DRIAS, ajout des indicateurs IFM40 et SWI04 (TRACC-2023)](https://www.drias-climat.fr/accompagnement/section/416) ;
[Météo-France, l'indicateur SWI uniforme](https://donneespubliques.meteofrance.fr/client/document/doc_swi_catnat_268.pdf) ;
[Eaufrance Rhône-Méditerranée, fiche indice d'humidité des sols](https://www.rhone-mediterranee.eaufrance.fr/sites/sierm/files/content/migrate_documents/indicateur_swi.pdf) ;
API Géorisques GASPAR v1 (`/gaspar/risques`), interrogée le 02/10/2026.
