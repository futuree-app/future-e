# Santé environnementale locale — reconnaissance de données

Date : 2026-06-05
Statut : RECONNAISSANCE SEULE. Aucun design figé, aucun code, aucune écriture dans `src/` ou `data/`. Gate porteur requis avant toute suite.
Auteur : agent de reconnaissance (read-only).

---

## 1. Résumé exécutif (5 lignes)

- La plomberie existe DÉJÀ et est riche : `georisques.ts`, `cartofriches.ts`, `irep.ts`, `gissol.ts`, `zfe.ts` couvrent risques GASPAR, friches, rejets industriels, métaux des sols et ZFE — mais AUCUN n'est exposé comme critère comparateur (les 27 `PREFERENCE_KEYS` n'ont pas de « santé environnementale »).
- Ces libs sont presque toutes **à la demande, par POINT (lat/lon) ou par parcelle**, donc non précalculées dans `comparateur-index.json` (qui ne porte que `pm25/no2/apl/eloignement` via ADEME data_communes). Un critère comparateur exige un **précalcul national par commune**, comme les `populate-*.py`.
- Sources candidates les plus exploitables pour un précalcul national : **IREP** (rejets industriels, point, ~15 000 établissements, MAJ 2×/an), **Seveso** (point, MAJ hebdo data.gouv), **ICPE / Géorisques** (parcelle), **Cartofriches** (point, ~21 000 sites mais explicitement NON exhaustif), **SIS/BASOL/BASIAS** (parcelle, en refonte InfoSols 2024-2025).
- Pièges identifiés : Cartofriches non homogène/non exhaustif (admis par le producteur), IREP biaisé vers les gros émetteurs (seuil de déclaration), GisSol déjà servi par une **table départementale codée en dur** (proxy grossier), couverture **métropole seule** dans l'index (DROM exclus), maille hétérogène entre sources (commune / parcelle / point).
- Recommandation 1re brique : **densité/exposition cumulée d'établissements à rejets industriels (IREP) autour du lieu de vie**, car point géolocalisé + national + descriptible sans verdict + applique directement la leçon `calme_sonore` (exposition diffuse, pas distance à la source la plus proche).

---

## 2. Inventaire de l'existant dans le repo

### 2.1 Libs déjà câblées (toutes `server-only`, à la demande)

| Lib | Source / fournisseur | Maille | Clé d'appel | Auth | Exposé en critère ? |
|---|---|---|---|---|---|
| `src/lib/georisques.ts` | Géorisques v1 (GASPAR, zonage sismique, catnat) + v2 (risques/pprn/rga) | **commune** (v1 par `code_insee`) et **point/parcelle** (v2) | `code_insee` ; lat/lon ; `codesParcelle` | v2 = `GEORISQUES_API_TOKEN` ; v1 sans token | Partiel : `faible_risque_inondation` dérive de GASPAR catnat, MAIS pas de critère « santé env » |
| `src/lib/cartofriches.ts` | ADEME Data Fair (dataset `59gkmzgmbjypm6yjqzunjmto`) | **point** (`_geopoint`) + filtre `comm_insee` | `inseeCode` ou bbox lat/lon (rayon défaut 3 km) | non | Non |
| `src/lib/irep.ts` | ADEME Data Fair (dataset `085ipnlpj9awm78hikh1nakj`) | **point** (lat/lon) | bbox lat/lon (rayon défaut 5 km) | non | Non |
| `src/lib/gissol.ts` | ADEME Data Fair (RMQS, id via `GISSOL_ADEME_DATASET_ID`) **+ fallback table départementale Cd codée en dur** | **point** si dataset configuré, sinon **département** | `inseeCode` (+ lat/lon opt) | non | Non |
| `src/lib/zfe.ts` | ADEME Data Fair (dataset `qljefeuzxpqx-98b60-a6n6d`) | **point dans polygone** (ray-casting) | lat/lon | non | Non (point-in-ZFE on-demand) |
| `src/lib/atmo.ts` | ATMO-France (indice ATMO du jour) | **commune** (`code_zone`) | `inseeCode` | `ATMO_USERNAME/PASSWORD` | Indirect : air de fond `pm25/no2` est dans l'index via ADEME, pas via ATMO temps réel |
| `src/lib/pollen.ts` | ATMO-France (indice pollens) | **commune→fallback département** | `inseeCode` | `ATMO_USERNAME/PASSWORD` | Non |

Constat : `irep.ts`, `cartofriches.ts`, `gissol.ts`, `zfe.ts` sont des **briques de fiche/quartier à la demande** (utilisées dans `commune-enrichment.ts`, routes `/api/*`, pages territoire/logement), pas des contributeurs de score. Aucune n'écrit dans `comparateur-index.json`.

### 2.2 L'index comparateur

`data/comparateur-index.json` : clé = code INSEE, **34 788 communes, France métropolitaine (Corse incluse, DROM EXCLUS)**. Bloc `viv` = `pm25, no2, apl, eloignement` (ADEME data_communes : air de fond, APL médecins, éloignement services). Donc la seule « santé environnementale » déjà scorée est l'air de fond (`air_sain`) + accès soins (`acces_soins`) + pression agricole (`faible_pression_agricole`). Pas de volet « pollution industrielle / sols / friches ».

### 2.3 Modèles de plomberie (scripts `populate-*`)

18 scripts `populate-*` (`.py`, `.js`, `.mjs`). Le modèle le plus pertinent est **`scripts/populate-calme-sonore.py`** : il porte la leçon clé déjà appliquée (révision 2026-06-05) — passage de « distance à la source la plus proche » à **exposition cumulée** dans un rayon `R_EXPO`, fonction saturante 0-100, « loin de tout = 100, jamais null », descriptif (proximité) pas physique (dB). Les sous-commandes `--selftest / --summary / --probe / --matrix / --write-index` sont le gabarit attendu (et `--write-index` est précisément l'action INTERDITE ici). Specs voisines utiles : `docs/superpowers/specs/2026-06-04-calme-sonore-design.md`, `2026-06-03-risque-inondation-gaspar-design.md`.

---

## 3. Fiches sources

### Tableau de synthèse

| Source | Fournisseur | Maille | Fraîcheur | Couverture | Accès | Trou principal | Apte critère opt-in « décrire jamais juger » |
|---|---|---|---|---|---|---|---|
| IREP (registre émissions polluantes) | MTE / Ineris (GEREP) | **point** | MAJ 2×/an | métropole + DOM, ~15 000 établ./an | ADEME Data Fair (déjà câblé) + data.gouv | Seuil de déclaration → seuls les gros émetteurs ; absence ≠ air pur | Oui (densité de sources, descriptif) |
| Seveso | MTE / DGPR | **point** (centroïde S3IC) | MAJ hebdo data.gouv | métropole (jeu « France métropolitaine ») | data.gouv + Géorisques | DOM à vérifier ; binaire haut/bas | Oui (présence de sites à risque majeur, factuel) |
| ICPE (installations classées) | Géorisques / S3IC | **parcelle** | continu | nationale | Géorisques API (token v2) | très nombreux → bruyant ; statut administratif ≠ nuisance vécue | Avec prudence (volume, sens) |
| Cartofriches | Cerema / ADEME | **point** | ~trimestriel | métropole + DOM, ~21 000 sites | ADEME Data Fair (déjà câblé) | **Non exhaustif, non homogène (admis par Cerema)** | Risqué (trous = faux « rien ici ») |
| SIS (secteurs info sols) | Géorisques / BRGM | **parcelle** | refonte InfoSols 2024-25 | nationale | Géorisques API | en cours de fusion/dédoublonnage (Q3/Q4 2025) | Avec prudence (juridique, anxiogène) |
| BASOL / BASIAS / CASIAS | BRGM / InfoSols | **parcelle** | refonte 2024-25 | nationale | Géorisques API | doublons en cours de fusion ; « ancien site » ≠ pollution avérée | Risqué (très anxiogène, sens flou) |
| GisSol RMQS (métaux sols) | INRAE / ADEME | point (sinon **dépt**) | stable | nationale (échantillon RMQS) | ADEME Data Fair (déjà câblé) | actuellement **fallback départemental codé en dur** → proxy grossier | Avec prudence (résolution faible) |
| ZFE | ADEME / collectivités | **polygone** | continu | grandes agglos seulement | ADEME Data Fair (déjà câblé) | n'existe que dans ~15 métropoles → non national | Non (couverture trop partielle) |
| ATMO / Géod'Air (air) | ATMO-France / LCSQA | commune/station | quotidien | nationale | API ATMO (auth) | déjà couvert par `air_sain` (air de fond ADEME) | Déjà traité ailleurs |

### Détails et points de vigilance

- **IREP** — Registre français des émissions polluantes. Rejets air/eau/déchets déclarés par ~15 000 établissements/an (industriels principaux, STEP > 100 000 EH, certains élevages), MAJ semestrielle, ventilé national/régional/dépt. Point géolocalisé, déjà câblé (`getIrepNearPoint`, rayon 5 km, champ `nombre_polluants`, `milieu_emission`). **Biais structurel** : seuil de déclaration → capte les gros, pas la pollution diffuse ; « 0 établissement » ne veut pas dire « air pur ». Bon candidat pour une **densité d'exposition**, pas pour un verdict.
- **Seveso** — Jeu data.gouv « Établissements Seveso France métropolitaine », point (centroïdes S3IC), distinction seuil haut/bas, MAJ hebdomadaire côté service de visualisation (dernière MAJ service avril 2025). Couverture **métropole** explicite → cohérent avec l'index, mais **DOM à vérifier**. Sens clair (risque industriel majeur), factuel.
- **ICPE** — Disponible par parcelle via Géorisques (token v2). Très volumineux et au statut purement administratif : difficile à transformer en signal d'ambiance sans sur-interprétation. À réserver à la fiche, pas au score, sans travail de filtrage fort.
- **Cartofriches** — ~21 000 sites (Cerema + DDT + EPF + particuliers), MAJ ~trimestrielle, métropole + DOM. **Le producteur déclare lui-même la base non exhaustive et non homogène sur le territoire.** Risque majeur pour un critère : un département sous-renseigné apparaîtrait « propre » à tort. À éviter comme socle de score ; acceptable en signal de fiche.
- **SIS / BASOL / BASIAS / CASIAS** — Pollution historique des sols, maille parcelle, via Géorisques/InfoSols. **En refonte 2024-2025** (dédoublonnage automatique prévu Q3/Q4 2025) → instable. Sujet très anxiogène et au sens juridique précis (« secteur d'information », « ancien site industriel » ≠ « pollué »). Prudence maximale.
- **GisSol RMQS** — Déjà câblé mais **dégradé** : sans `GISSOL_ADEME_DATASET_ID`, `gissol.ts` retombe sur une **table départementale de cadmium codée en dur** (médianes RMQS). C'est un proxy de résolution départementale, pas une mesure communale. À ne pas présenter comme local.
- **ZFE** — Couverture limitée aux grandes agglomérations → ne peut pas servir de critère national (pénaliserait/avantagerait arbitrairement le rural). Reste un signal de fiche urbaine.
- **Air (ATMO/Géod'Air/ADEME)** — Déjà couvert par `air_sain` (air de fond PM2.5/NO2 dans l'index). Ne pas redoubler.

---

## 4. Trous & risques data

1. **Maille hétérogène.** commune (GASPAR, ATMO) vs parcelle (ICPE, SIS, BASOL/BASIAS) vs point (IREP, Seveso, Cartofriches) vs département (GisSol fallback). Un critère comparateur impose **une maille unique précalculée par commune** ; mélanger sans homogénéiser produirait un score incohérent.
2. **Non-exhaustivité admise** (Cartofriches) et **seuil de déclaration** (IREP) : l'absence de données peut être lue à tort comme « territoire sain ». Doctrine « décrire jamais juger » → il faut nommer ce qu'on NE mesure pas.
3. **DROM exclus de l'index** (métropole + Corse seulement). Toute source DOM-incluse (IREP, Cartofriches) sera de toute façon tronquée par l'index actuel — cohérent mais à déclarer.
4. **GisSol en mode dégradé** (table dépt en dur) : ne pas vendre comme mesure communale du sol.
5. **Sources en refonte** (InfoSols/SIS/BASOL/BASIAS, fusion Q3/Q4 2025) : risque de schéma/IDs instables → fiabilité « à vérifier » avant tout précalcul.
6. **Pièges PLM** déjà gérés ailleurs (Paris/Lyon/Marseille arrondissements dans `gissol.ts`/`pollen.ts`) : à reprendre pour tout nouveau précalcul.
7. **Vérification API non effectuée en direct** : les appels réseau (curl/WebFetch) sont bloqués dans cet environnement sandbox. Fraîcheur/couverture ci-dessus proviennent des métadonnées publiques (data.gouv, ADEME, Géorisques, Cerema) — **à confirmer par un appel léger réel** (ex. Géorisques `/gaspar/risques?code_insee=17300`, ADEME Data Fair IREP `bbox` autour de La Rochelle 17300 et Marseille 13201) avant design.

---

## 5. Questions de design ouvertes (pour le gate porteur — NON tranchées)

a. **Composite vs séparé.** Un seul critère « santé environnementale » agrégerait des choses de natures différentes (rejets industriels ≠ sols pollués ≠ friches ≠ risque Seveso). La doctrine (cf. mobilité éclatée en 3, vie étudiante composite assumé) penche plutôt vers **un ou deux critères ciblés et nommés** plutôt qu'un fourre-tout. À trancher.
b. **Éviter le verdict (sujet anxiogène).** Comment décrire une exposition industrielle sans dire « commune malsaine » ? Piste : vocabulaire factuel de **proximité/densité de sources** (« X sites à rejets déclarés dans un rayon de N km »), récit nommant la source la plus proche, jamais de jugement sanitaire. Déclarer explicitement l'incertitude.
c. **Maille et modèle d'exposition.** Appliquer la leçon `calme_sonore` : **exposition cumulée** (densité de sources pondérée par la distance dans un rayon d'ambiance) plutôt que « distance à la plus proche ». Maille de sortie = commune (précalcul depuis le lat/lon chef-lieu de l'index). Rayon à caler par sonde, comme `R_EXPO`.
d. **Ce qu'on NE mesure PAS (à déclarer honnêtement).** Eau potable, radon, qualité de l'air intérieur, pollution diffuse hors seuil de déclaration, exhaustivité des friches, pollution réelle (vs statut administratif) des sols. Le périmètre honnête est « **présence/densité de sources industrielles déclarées à proximité** », pas « qualité sanitaire du lieu ».
e. **Opt-in et non-pénalisation du rural.** Critère opt-in strict, sans plancher pénalisant : une commune rurale sans industrie déclarée ne doit pas être « récompensée » par défaut au point de fausser le rural (cf. piège K de `vie_locale`). « Pas de source connue » doit rester descriptif, jamais un bonus de score arbitraire.

---

## 6. Recommandation : 1re brique candidate

**Brique candidate : exposition cumulée aux établissements à rejets industriels déclarés (IREP), précalculée par commune.**

Pourquoi celle-ci en premier :
- **Maille adaptée** : point géolocalisé → transformable en exposition cumulée autour du lat/lon chef-lieu de l'index (modèle `calme_sonore` directement réutilisable).
- **Couverture nationale** et source publique stable (MTE/Ineris/GEREP, MAJ 2×/an), déjà câblée (`irep.ts`, dataset ADEME Data Fair) → plomberie de lecture connue.
- **Descriptible sans verdict** : « densité de sites à rejets déclarés à proximité », source la plus proche nommable, aucune affirmation sanitaire — compatible « décrire jamais juger ».
- **Applique la leçon clé** : densité/exposition cumulée, PAS distance à la source la plus proche (évite le bruit d'échantillonnage en grande ville).
- **Limite à déclarer franchement** : IREP ne capte que les émetteurs au-dessus du seuil de déclaration ; absence ≠ air pur. C'est précisément le genre de limite à écrire dans le récit, conforme à la doctrine.

Briques de second rang à arbitrer ensuite (gate) : **Seveso** (présence de site à risque majeur, factuel, complémentaire) ; SIS/sols et Cartofriches en **signal de fiche** plutôt qu'en score, vu leurs trous et leur sujet anxiogène. ZFE et GisSol-dépt : écartés du score (couverture/résolution insuffisantes).

Avant tout design : exécuter les appels légers de vérification (Géorisques `code_insee`, ADEME Data Fair IREP `bbox`) sur La Rochelle 17300 et Marseille 13201 pour confirmer fraîcheur, champs et couverture réelle — non faisable dans ce sandbox (réseau bloqué).

---

RECONNAISSANCE SEULE — aucun design figé, aucun code, gate porteur requis avant toute suite.

---

## Vérification LIVE (session porteur, 2026-06-05) — gate data ICPE/Seveso FRANCHI

La réserve « tests API bloqués par le sandbox » est levée : appels réels effectués sur
l'API Géorisques `installations_classees`.

- **Live + frais** : HTTP 200, `date_maj` jusqu'à 2026-05-19. La Rochelle (17300) = 119 ICPE.
- **National** : 137 103 ICPE au total, géolocalisées au point (lat/lon), avec gradient de
  gravité : `statutSeveso` (seuil haut/bas), `ied`, `industrie`, `regime`, `prioriteNationale`.
  Marseille (13055) 411 dont Seveso seuil haut+bas ; Lyon (69123) 187 dont 3 seuil haut ;
  Paris (75056) 1427 mais 0 Seveso (ICPE banales : parkings, froid…).
- **Fetch national faisable, 2 voies** : (a) bulk **geojson** national sur data.gouv « Base des
  installations classées (ICPE) » ; (b) pagination API, plafond `page_size=1000` -> 138 pages.
  Recherche géographique `rayon`+`latlon` OK aussi (199 dans 10 km de La Rochelle) -> tuilage
  possible. Plus besoin de 34 788 appels par commune.

### Deux enseignements de design issus de la sonde live
1. **Piège PLM** : la donnée est indexée par code COMMUNE (13055), pas arrondissement
   (13201 = 0 résultat). À CONTOURNER PAR LA GÉOMÉTRIE : exposition = nuage de points national
   × distance au chef-lieu (archi `populate-calme-sonore.py`), sans jointure code_insee -> le
   piège PLM disparaît.
2. **Pondérer par GRAVITÉ, pas compter** : Paris 1427 ICPE / 0 Seveso vs Marseille 411 / Seveso
   seuil haut. Le compte brut mentirait (comme le rail brut). Hiérarchie : Seveso seuil haut >
   Seveso seuil bas > IED > industrie > autres régimes. La gravité est dans la donnée.

Reste à décider AU GATE PORTEUR (design, pas data) : composite vs critères séparés ;
formulation « décrire jamais juger » ; rayon/demi-vie d'exposition (sonde, comme calme_sonore) ;
place de Seveso/sols/friches (score vs signal de fiche).
