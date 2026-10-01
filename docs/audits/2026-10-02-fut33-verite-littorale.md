# FUT-33 : la vérité littorale (audit et proposition de conception)

Date : 02/10/2026. Base : `main` à `b91fa88f`. Phase 0 : aucun code produit, aucune donnée remplacée.

Sources consultées dans le dépôt : `scripts/build-comparateur-index.mjs`, `src/lib/comparateur-vie.ts`,
`src/lib/commune-categories.ts`, `src/lib/geo-zones.ts`, `src/lib/littoral.ts`, `src/lib/territory-mood.ts`,
`src/lib/territory-identity.ts`, `src/lib/territoire/facts.ts`, `src/lib/hard-constraints*.ts`,
`src/lib/decision/{capability,coast-facts,coast-rules,condition-rules,hard-constraint-rules}.ts`,
`src/components/report/QuartierClimatData.tsx`, `src/app/api/ask/route.ts`, `src/app/api/landing-signals/route.ts`,
les audits FUT-6, FUT-7, FUT-8 et la spec FUT-8.

Mesures exploratoires : liste officielle « loi Littoral » (DGALN, COG 2022) croisée avec l'index réel ;
service WFS de la Limite terre-mer Shom-IGN interrogé sur 23 communes. Script reproductible :
`scripts/research/fut33-sonde-trait-de-cote.mjs` (aucune donnée committée).

---

## 1. Résumé exécutif

**Ce qui est faux.** `distance_cote_km` n'est pas une distance à la mer. C'est la distance à vol d'oiseau
entre le centre géométrique de la commune et la plus proche de 46 « villes côtières » écrites en dur. Sur les
839 communes de l'index que l'État classe riveraines de la mer, **754 ressortent à plus de 5 km de la mer,
478 à plus de 15 km et 156 à plus de 30 km**. Perros-Guirec est « à 63 km », Lannion à 58, Morlaix à 54,
Châtelaillon-Plage à 11. À l'inverse, Caen est « à 1 km » parce qu'une des 46 villes de la liste est Caen
elle-même.

**Ce qui est faux aussi, et plus diffus.** Quatre tables de façades par département ou par région se
contredisent, et pilotent des textes affirmatifs. Toute commune d'un département de la liste « Atlantique »
(qui contient pourtant le Calvados, la Manche et les Côtes-d'Armor, sur la Manche) lit « les nuits restaient
fraîches au bord de l'Atlantique ». Le Havre, Dunkerque, Saint-Nazaire, Arcachon ou Biarritz lisent « loin de
la mer ». Le repli par département sert à presque toutes les communes : seules 44 ont une catégorisation manuelle en
base, pour 34 788 communes dans l'index.

**Où cela change une décision.** Le filtre « à moins de N km de la mer » et l'exclusion « pas le littoral »
de « Où vivre », le classement par la préférence « proximité de la mer », la dérivation d'une ancre (« une
ville comme Lannion » ne retient pas la mer), et les cartes du dossier (préférence et condition « la mer »).

**Source recommandée.** La **Limite terre-mer Shom-IGN** (2021, Licence Ouverte 2.0), coupée aux **limites
transversales de la mer** qu'elle fournit elle-même. Sans cette coupure, la ligne remonte les estuaires :
mesurée brute, Bordeaux est à 1,8 km de la « côte » (la Garonne), Nantes à 2,7 km, Caen à 1,2 km. Pour la
qualité juridique « commune littorale », la **liste DGALN loi Littoral** (classements Mer, Estuaire, Lac).

**Modèle cible.** Trois faits séparés au grain commune, plus un fait à l'adresse :
1. distance du **centre** de la commune à la mer ;
2. distance du **territoire** communal à la mer (0 si la commune touche la mer) ;
3. classement **juridique** loi Littoral (Mer, Estuaire, Lac, ou rien) ;
4. à l'adresse, calculée à la demande : distance de **l'adresse** à la mer.
La façade devient une propriété du point de côte le plus proche, jamais d'un département. Plus de
`distance_cote_km` unique.

**Doctrine préservée.** Rien ne devient « tranchable » par effet de bord. Une meilleure mesure rend
**possible** de trancher « à moins de N km de la mer » à l'adresse ; « au bord de la mer », « pas le
littoral » et les façades restent des conventions à faire accepter (FUT-8).

---

## 2. Vérité actuelle et erreurs

### 2.1 Le producteur de `distance_cote_km`

`scripts/build-comparateur-index.mjs:82-125` : `distanceCoteKm(lat, lon)` rend
`round(min haversine(point, ancre))` sur `COAST_ANCHORS`, 46 points `[lat, lon]` (11 Manche et mer du Nord,
5 Bretagne, 11 Atlantique, 14 Méditerranée, 5 Corse). Le point de la commune vient de `public/data_climat.json`
(`column01/02`), et c'est le **centre géométrique** de la commune : il coïncide avec le `centre` de
geo.api.gouv.fr sur les 6 communes vérifiées, à 0,7 à 2,8 km de la mairie (Morlaix 2,2 km, Bordeaux 2,8 km).
Le script le dit lui-même : « APPROXIMATION assumée pour la V1 ... À remplacer par le trait de côte IGN ».

Défauts structurels :
- toute la côte entre deux ancres est invisible (la côte de granit rose, le Trégor, le Léon nord, les Landes
  entre deux plages listées) ;
- une ancre posée sur une ville intérieure fabrique une côte (Caen, ancre `[49.18, -0.37]`) ;
- arrondi au kilomètre, sans aucune information de grain.

### 2.2 Mesure nationale de l'erreur (index réel croisé avec la liste loi Littoral, COG 2022)

| Constat | Nombre |
|---|---|
| Communes de l'index classées « Mer » par l'État | 839 |
| dont proxy > 5 km (perdent la catégorie « littoral ») | 754 |
| dont proxy > 15 km (hors « au bord de la mer » de l'ancre, de l'identité, de la préférence) | 478 |
| dont proxy > 30 km | 156 |
| Communes non littorales à ≤ 5 km selon le proxy | 69 |
| Communes non littorales à ≤ 15 km selon le proxy | 705 (certaines sont réellement proches de la mer) |

Pires faux négatifs : Locquirec 68 km, Guimaëc 67, Trébeurden 65, Plestin-les-Grèves 64, Pleumeur-Bodou 64,
Trégastel 64, Perros-Guirec 63, Trédrez-Locquémeau 62, Saint-Jean-du-Doigt 62, Saint-Michel-en-Grève 61.

### 2.3 Les tables de façades et de types, par département ou région

| Table | Fichier | Contenu | Défaut |
|---|---|---|---|
| `DEPT_LITTORAL_ATLANTIQUE` | `commune-categories.ts:18` | 14, 17, 22, 29, 50, 56, 85 | « Atlantique » contient le Calvados, la Manche, les Côtes-d'Armor (Manche) ; omet 33, 40, 44, 64 |
| `DEPT_MEDITERRANEE` | `commune-categories.ts:12` | 04, 06, 11, 13, 30, 34, 66, 83, 84, 2A, 2B | sert à la fois au climat (légitime au département) et au « littoral méditerranéen » (04 et 84 n'ont pas de côte) |
| `deriveCategories` (repli) | `commune-categories.ts:71` | littoral = département de l'une des deux listes | toute commune de Charente-Maritime ou du Finistère est « littorale » |
| zones `atlantique`, `manche`, `mediterranee`, `cote_basque` | `geo-zones.ts` | listes de départements | le Finistère est dans « Atlantique » ET dans « Manche » ; Bordeaux est « sur la côte atlantique » |
| `FACADE_BY_DEPT` | `littoral.ts:9` | manche, bretagne, atlantique, mediterranee | défaut silencieux `?? "atlantique"` pour tout département inconnu |
| `COAST_BY_REGION`, `MED_REGIONS` | `comparateur-vie.ts:894` | par région | « Côte atlantique » pour toute commune côtière de Nouvelle-Aquitaine, jamais « Côte basque » |
| `deriveTerritoryType` | `territory-mood.ts:110` | littoral_atlantique, mediterraneen, montagne, plaine | dérivé de `deriveCategories` (département) ; pilote les textes climat et le passeport |

---

## 3. Cartographie producteurs → consommateurs

Grain : P = centre de la commune ; D = département ; R = région ; C = commune (liste officielle).
Classe : **A** décisionnel, **B** éditorial, **C** scripts, tests, fixtures.

### 3.1 Décisionnel (A)

| Usage | Fichier | Donnée | Grain | Seuil | Conséquence produit | Risque si la donnée reste fausse |
|---|---|---|---|---|---|---|
| `nearSea` (« à moins de N km de la mer ») | `hard-constraints.ts:578` | `distanceCoteKm` | P | N du lecteur ; sans N : non examiné | filtre « Où vivre » ; carte du dossier | **Élevé** : Lannion, Perros-Guirec exclues d'une recherche « à moins de 10 km de la mer » |
| `excludeSea` (« pas le littoral ») | `hard-constraints.ts:609` | idem | P | convention 15 km (`excludeSeaMinKm`) | filtre « Où vivre » ; carte du dossier | **Élevé** : Perros-Guirec gardée comme « loin du littoral », Caen écartée |
| Capacité `nearSea` / `excludeSea` | `capability.ts:128-133` | (aucune) | P | | toujours `apprecier` (point de référence ; convention) | nul tant que la capacité reste `apprecier` |
| Préférence `proximite_mer` (score) | `comparateur-vie.ts:1258` | `distance_cote_km` | P | `100 - d / 1.5` | classement « Où vivre » | **Élevé** : le Trégor recule de ~40 points |
| Rayon d'exploration mer | `comparateur-vie.ts:2365`, `hard-constraints-hydrate.ts:24` | idem | P | 30 km (`LEGACY_NEAR_SEA_KM`) | bonus de classement (« la mer » sans seuil) | Moyen |
| Dérivation d'ancre | `comparateur-vie.ts:2523-2569` | idem | P | `ANCRE_COAST_KM` 15 ; poids 3 si ≤ 5 | « une ville comme X » retient la mer | **Élevé** : « comme Lannion » ne cherche pas la mer |
| `perimeterAllowsCoast` | `comparateur-vie.ts:2626` | idem ∩ départements | P + D | 15 km | retire la mer dérivée si le périmètre n'a pas de côte | Moyen |
| Zones façade (`atlantique`…) | `geo-zones.ts` | listes de départements | D | | filtre « Où vivre » ; `apprecier` au dossier | **Élevé** (Recherche) : Bordeaux, Pau, Rennes « sur la côte » |
| Règle `coast` (préférence au dossier) | `coast-rules.ts`, `coast-facts.ts` | `distanceCoteKm` | P | 15 / 100 km (`coast-proximity-v1`) | écart, accord, carte « la mer » | Élevé (Lannion « neutre » au lieu de « proche ») |
| Condition « la mer » sans seuil (FUT-7) | `condition-rules.ts:102` | idem | P | 15 / 100 km | condition ouverte « plutôt favorable / défavorable » | Élevé (mauvais sens du signal) |
| Constats et limites au dossier | `hard-constraint-rules.ts:147-232` | idem | P | | phrases « se situe à N km du littoral » | Élevé (chiffre faux affiché) |

### 3.2 Éditorial (B)

| Usage | Fichier | Donnée | Grain | Seuil | Conséquence | Risque |
|---|---|---|---|---|---|---|
| Catégories `littoral*` (questions en tension, accueil) | `comparateur-vie.ts:720` | `distance_cote_km` + département | P + D | ≤ 5 km | questions « Acheter à X ? risque côtier », « Surfer à X dans 20 ans ? » | Moyen : 754 communes riveraines sans question littorale |
| Repli `deriveCategories` | `commune-categories.ts:71` ; `api/ask/route.ts:175` ; `FutureELanding.tsx:1283` ; `api/landing-signals` | département | D | | assistant et accueil (toutes les communes sans catégorisation manuelle) | **Élevé** : « Surfer à Saintes » ; Brest sur « littoral_atlantique » |
| Type de territoire (passeport, climat) | `territory-mood.ts:110` → `QuartierClimatData.tsx:255` | département | D | | « au bord de l'Atlantique », « loin de la mer », « sans façade maritime » | **Élevé** : affirmations fausses dans les deux sens |
| `place.typology` (carte d'identité Territoire) | `territoire/facts.ts:233` | type départemental | D | | « Ville de la façade atlantique », **entre dans la synthèse** (`INCLUDE`) | **Élevé** |
| `place.position` (Territoire) | `territoire/facts.ts:244` | `distance_cote_km` | P | ≤ 2 « En bord de mer », ≤ 8 « Proche du littoral » | libellé de la carte d'identité ; **exclu** de la synthèse | Moyen (déjà isolé par FUT-6) |
| Signature et identité des cartes « Où vivre » | `comparateur-vie.ts:944, 1017` | `distance_cote_km` + région | P + R | ≤ 15 km | « Côte bretonne », « Côte atlantique » | Moyen |
| `reasonText`, compromis | `comparateur-vie.ts:2069, 2127` | idem | P | ≤ 2 / ≤ 8 | « à deux pas du littoral », « éloignée du littoral » | Moyen |
| Signal érosion (narratif) | `comparateur-vie.ts:2692` ; `littoral.ts` | liste L321-15 (371 communes) ; Cerema | C | | « exposée à l'érosion du littoral » | Faible : déjà au grain commune, sources officielles |
| Catégories manuelles en base | Supabase `communes_categorization` | saisie | C | | 44 communes ; Brest y est « littoral_manche » | Faible (volume), mais incohérent avec les tables du code |

### 3.3 Scripts, tests, fixtures (C)

- `scripts/demo-comparateur.mjs`, `scripts/research/*` (lecture de `distance_cote_km`).
- `src/lib/__fixtures__/hard-corpus.ts` et 28 fichiers de tests qui fixent des distances (dont
  `coast-rules.test.ts`, `coast-e2e.test.ts`, `fut7-conditions.test.ts`, `hard-constraints.test.ts`,
  `module-facts-map.test.ts`).
- `src/lib/territoire/__fixtures__/chatelaillon-17094.inputs.json` : fige « Littoral atlantique » et la
  distance de 11 km.

---

## 4. Les questions géographiques que futur•e mélange aujourd'hui

| # | Question | Ce qu'elle mesure | Grain naturel | Source honnête |
|---|---|---|---|---|
| Q1 | Le **centre** de la commune est-il près de la mer ? | distance point → rivage de la mer | point (centre) | Limite terre-mer coupée aux LTM |
| Q2 | Le **territoire** de la commune atteint-il la mer, ou s'en approche-t-il à moins de N km ? | distance polygone → rivage ; 0 si contact | commune (contour) | idem + contours IGN |
| Q3 | La commune est-elle **littorale au sens de la loi** ? | qualification juridique : Mer, Estuaire, Lac | commune | liste DGALN (art. L321-2) |
| Q4 | Sur quelle **façade** ? | rattachement du rivage le plus proche à une façade | point de côte | façades maritimes (DSF), ou découpage produit explicite |
| Q5 | Le **climat** est-il sous influence maritime ? | climatologie | région / maille climatique | DRIAS, pas le trait de côte |
| Q6 | La côte **recule**-t-elle ici ? | érosion observée | segment de côte, commune | Cerema (déjà intégré) |
| Q7 | La commune est-elle **inscrite au titre du recul** (loi Climat et Résilience) ? | décret, liste | commune | liste L321-15 (déjà intégrée) |
| Q8 | **Submersion** marine | aléa | zone, adresse | Géorisques (déjà intégré) |
| Q9 | Le **logement** est-il près de la mer ? | distance adresse → rivage | adresse | Limite terre-mer coupée aux LTM |

Le code actuel répond à Q1 avec une mauvaise mesure, puis s'en sert pour Q2, Q3, Q4 et Q5. Les textes climat
répondent à Q5 avec une table départementale de Q4.

Deux nuances de vocabulaire, à garder en tête dans toute l'interface :
- un **estuaire** n'est pas la mer. Juridiquement, le rivage de la mer s'arrête à la limite transversale de
  la mer. Rochefort est classée « Estuaire » ; Bordeaux, Nantes et Rouen ne sont pas littorales ;
- un **lac** classé loi Littoral (Annecy, Léman) n'a rien de marin. Le classement « Lac » ne doit jamais
  nourrir une notion de mer.

---

## 5. Sources candidates

### 5.1 Géométrie du rivage

| Critère | **Limite terre-mer (LimTM) Shom-IGN** | Trait de côte Histolitt v2 | BD TOPO, classe LIMITE_TERRE_MER | OSM coastline | EEA / Natural Earth |
|---|---|---|---|---|---|
| Autorité | Shom + IGN, référentiel national | Shom + IGN | IGN | communauté | agences européennes / communauté |
| Définition | laisse des plus hautes mers astronomiques (coef. 120), levés Litto3D | idem, ancien levé | reprend la LimTM (plus hautes et plus basses eaux, limites administratives) | conventions OSM, variables selon les estuaires | généralisée |
| Millésime | 2021 (jeu mis à jour sur data.gouv le 01/10/2026) | 2009, déclaré « obsolète et incomplet » par le Shom | édition courante | continu | ancien |
| Précision | 0,2 à 7 m (incertitude par segment) | métrique à décamétrique | ~5 m | variable | km |
| Couverture | métropole + Corse | métropole + outre-mer | France | monde | Europe / monde |
| Estuaires | **couche de fermetures LTM / LSE / LAM fournie** | non | limites administratives présentes | non homogène | non |
| Licence | Licence Ouverte 2.0, mention « © Shom-IGN » | Licence Ouverte 2.0 | Licence Ouverte 2.0 | ODbL (partage à l'identique) | variable |
| Format, poids | 7z national **255 Mo** ; WFS ; par département | SHP 43 Mo | BD TOPO complète (très lourde) | quelques centaines de Mo | légère |
| Ingestion | script de construction ; extraction 7z | simple | lourde | moyenne | simple |
| Reproductibilité | fichier versionné, téléchargeable | oui | oui | instable | oui |
| Calcul à l'adresse | oui (ligne simplifiée embarquée) | oui | oui | oui | trop grossier |

**Recommandation : LimTM.** C'est la source que le Shom recommande en remplacement d'Histolitt, elle est
institutionnelle, ouverte, précise bien au-delà du besoin (quelques mètres pour des seuils en kilomètres), et
c'est la seule à fournir les **fermetures d'estuaires** dont le modèle a besoin. BD TOPO ne ferait que
l'embarquer en plus lourd. OSM est écarté (non institutionnel, ODbL, conventions d'estuaires variables).
EEA et Natural Earth sont trop grossiers.

À noter : la LimTM est un **trait de côte cartographique** (où s'arrête la terre aujourd'hui). L'érosion
(Cerema) et le recul (L321-15) restent des faits séparés, déjà intégrés.

### 5.2 Ce que la sonde a montré sur la LimTM brute

Mesurée sans coupure, la ligne suit les rives des fleuves jusqu'à la limite de la marée. La couche
`fermetureslimar` fournit les limites transversales de la mer (LTM) qui ferment juridiquement les estuaires.
Positions relevées :

| Estuaire | LTM relevée | Effet attendu de la coupure |
|---|---|---|
| Gironde | vers 45,57° N (entre l'embouchure et Meschers) | Bordeaux redevient à plusieurs dizaines de km de la mer |
| Loire | vers 47,27° N (Saint-Nazaire / Mindin) | Nantes redevient intérieure (~50 km) |
| Orne | vers 49,27° N (Ouistreham) | Caen à ~10 km de la mer |
| Charente | vers 45,95° N (embouchure) | Rochefort à ~10 km, conforme à son classement « Estuaire » |
| Léguer (Lannion) | dans la ville même | Lannion reste au bord de la mer |
| Rivière de Morlaix | 4 à 5 km en aval du centre | centre de Morlaix à ~5 km ; le territoire atteint la baie (classement « Mer ») |

**La coupure aux LTM est donc obligatoire**, et c'est le point technique principal de la phase 1.

### 5.3 Qualification juridique et contours

| Besoin | Source | Remarques |
|---|---|---|
| Commune littorale (Mer, Estuaire, Lac) | DGALN, « Communes de la loi littoral au COG » (data.gouv, xlsx 64 Ko, GPKG) | dernier fichier ouvert repéré au COG 2022 ; l'Observatoire des territoires annonce un millésime 2025. 841 « Mer », 84 « Estuaire », 153 « Lac » en métropole (COG 2022). Communes fusionnées : classement partiel signalé |
| Contours communaux | IGN ADMIN EXPRESS (COG ou COG-CARTO), Licence Ouverte | nécessaire pour Q2 ; à charger au build, pas d'appel réseau en production |
| Façades | Façades maritimes des documents stratégiques de façade (Manche Est-mer du Nord, Nord Atlantique-Manche Ouest, Sud-Atlantique, Méditerranée) | **à vérifier** (format, licence) en phase 1 ; alternative : découpage produit explicite et versionné |

---

## 6. Modèle cible proposé

### 6.1 Ce que futur•e stocke

**Par commune (index, au build) :**

| Champ | Sens exact | Unité | Notes |
|---|---|---|---|
| `mer_centre_km` | distance du centre géométrique de la commune au rivage de la mer | km, 1 décimale | rivage = LimTM coupée aux LTM, lagunes et bassins compris (voir décision D2) |
| `mer_territoire_km` | distance la plus courte entre le territoire communal et le rivage de la mer | km, 1 décimale | 0 si le territoire touche le rivage |
| `loi_littoral` | `"mer"` / `"estuaire"` / `"lac"` / null (plusieurs possibles pour une commune fusionnée) | | source et COG datés ; jamais une preuve de proximité pour `"lac"` |
| `facade` | façade du point de rivage le plus proche | | rempli seulement si `mer_territoire_km` ≤ une distance à fixer (D6) |

**Métadonnées globales de l'index** : source (LimTM 2021, Shom-IGN), méthode (`mer-v2`, coupure LTM),
COG de la liste loi Littoral, date du build. Elles alimentent la provenance affichée et l'empreinte des
conventions.

**À l'adresse (à la demande, côté serveur)** : `mer_adresse_km`, distance de l'adresse au même rivage, à partir
d'une ligne de côte **simplifiée et embarquée** au build (tolérance de l'ordre de 10 à 20 m, index spatial en
grille). Pas d'appel au WFS du Shom en production : latence, disponibilité, et le précédent de Géorisques
(filtrage géographique) le déconseillent.

**Ce qui disparaît** : `distance_cote_km` (renommer force chaque consommateur à choisir explicitement entre
centre et territoire, ce qui est le sens de la règle « un seuil conditionnel rend conditionnel tout ce qui le
cite »), `COAST_ANCHORS`, `DEPT_LITTORAL_ATLANTIQUE`, la part « littoral » de `deriveCategories`,
`FACADE_BY_DEPT` et `COAST_BY_REGION` en tant que sources de vérité, le défaut `?? "atlantique"`.

### 6.2 Une seule valeur suffit-elle encore ?

Non. Une commune peut toucher la mer et avoir son centre à 8 km (grandes communes rétro-littorales), et
un centre peut être à 3 km de la mer sans que toute la commune le soit. Le centre répond à « où est la ville »,
le territoire répond à « peut-on habiter près de la mer dans cette commune ». Les deux sont nécessaires, et
l'adresse les remplace dès qu'elle est connue.

### 6.3 Libellés honnêtes

| Fait | Libellé lecteur proposé | Interdit |
|---|---|---|
| `loi_littoral = mer` | « commune littorale » | le déduire d'un département ou d'une distance |
| `loi_littoral = estuaire` | « commune d'estuaire » | « en bord de mer » |
| `loi_littoral = lac` | rien côté mer (éventuellement « commune riveraine d'un grand lac ») | toute notion de mer |
| `mer_territoire_km = 0` | « la commune touche la mer » | |
| `mer_centre_km = N` | « le centre de la commune est à environ N km de la mer » | « la commune est à N km » sans préciser |
| `mer_adresse_km = N` | « ce logement est à environ N km de la mer, à vol d'oiseau » | |
| façade | « sur la façade atlantique » seulement pour une commune littorale de cette façade | une façade tirée d'un département |
| climat | « sous influence océanique » relève du climat (DRIAS), jamais du trait de côte | « au bord de l'Atlantique » par département |

### 6.4 Les façades

Une seule table de façades, versionnée, rattachée au **point de rivage** (Q4), jamais au département ni à la
région. Les quatre tables actuelles convergent vers elle. Les jetons de recherche `atlantique`, `manche`,
`mediterranee`, `cote_basque` (aujourd'hui des listes de départements) deviennent, s'ils sont gardés, une
**convention de périmètre** au sens de FUT-8 : par exemple « commune littorale (Mer) dont le rivage le plus
proche est sur la façade atlantique ». Acceptée par le lecteur, une telle convention pourra trancher au grain
commune ; tant qu'elle ne l'est pas, elle s'apprécie.

---

## 7. Grain Commune vs Adresse

### 7.1 Recherche de communes (« commune à moins de 10 km de la mer »)

Les candidats et leurs défauts :

| Mesure | Défaut |
|---|---|
| centroïde (actuel) | une commune littorale étendue peut avoir son centre loin de la mer |
| chef-lieu (mairie) | meilleur proxy du bourg, mais la mairie n'est pas où vit toute la commune ; source en plus |
| limite communale (territoire) | une commune qui touche la mer par une pointe passe, même si presque tout est loin |
| barycentre de population | le plus juste, mais aucune donnée carroyée intégrée aujourd'hui (Filosofi 200 m serait une piste) |

Proposition : **utiliser les deux mesures, chacune pour ce qu'elle garantit.**
- `mer_territoire_km > N` : **aucune adresse** de la commune n'est à moins de N km. C'est une certitude.
- `mer_centre_km ≤ N` : le centre est à moins de N km. C'est favorable, sans garantir chaque adresse.
- Entre les deux : la réponse dépend de l'adresse.

Conséquences :
- **Filtre de la Recherche** « à moins de N km de la mer » : une commune passe si `mer_territoire_km ≤ N`
  (aucun faux négatif : on ne cache jamais une commune où un logement peut répondre). Le classement utilise
  `mer_centre_km`.
- **Dossier, grain commune** : « non respectée » seulement si `mer_territoire_km > N`, donc certaine.
  Sinon la condition reste ouverte (« dépend de l'adresse », plutôt favorable si le centre est dans le
  rayon). Cela demande une capacité **asymétrique** (trancher le négatif, apprécier le positif), que le
  modèle FUT-7 ne connaît pas encore : décision D3.
- **« Pas le littoral »** (convention 15 km) : la même asymétrie joue en sens inverse (D4).

### 7.2 Adresse connue (« je veux habiter à moins de 10 km de la mer »)

Utiliser la distance communale serait faux. Avec une adresse, la seule mesure honnête est
`mer_adresse_km`. Le grain `adresse` existe déjà dans `capability.ts` : c'est exactement le schéma de
`nearPlace` à vol d'oiseau en FUT-8. Une condition « à moins de N km de la mer », N donné par le lecteur,
devient **tranchable à l'adresse**.

### 7.3 Autour et Logement

« Autour » et « Logement » partagent le grain adresse : un seul calcul, `mer_adresse_km`, servi aux deux.
Le Territoire garde le grain commune (centre, territoire, classement juridique).

---

## 8. Impacts

### 8.1 Moteur

- `CommuneAttributes.distanceCoteKm` éclate en `merCentreKm`, `merTerritoireKm`, `loiLittoral` ; le point
  évalué (`EvaluationPoint`) porte déjà le grain, ce qui permet `merAdresseKm` quand le grain est l'adresse.
- `evaluateNearSea`, `evaluateExcludeSea` : choisir la mesure selon le grain (§7) ; les phrases nomment la
  mesure (« le centre de la commune », « ce logement »).
- `capability.ts` : `nearSea` avec N du lecteur devient `trancher` à l'adresse ; au grain commune, D3.
- `coast-facts.ts` : `coast-proximity-v1` (15 / 100 km, calibré « sur l'imprécision de la mesure V1 ») doit
  être **re-présenté** avant d'être recodé (règle « les seuils se discutent ») ; `measure` change de nom.
- Signature décisionnelle : les nouveaux champs entrent dans la valeur décisionnelle des critères mer, donc
  les dossiers concernés se déclarent dépassés. C'est voulu, et les dossiers figés restent tels qu'ils ont été
  vendus.

### 8.2 Recherche (« Où vivre »)

- Filtres `nearSea` et `excludeSea` sur les nouvelles mesures (§7.1).
- Score `proximite_mer` sur `mer_centre_km` (formule inchangée, à revoir avec la nouvelle distribution).
- Ancres : « au bord de la mer » d'une ancre sur `mer_centre_km` ou `loi_littoral = mer` (D5).
- Jetons de façade : D6.

### 8.3 Interface et textes

- Catégories `littoral*` : `littoral` si `loi_littoral = mer` ; façade depuis le rivage ; plus aucun repli
  départemental pour le littoral.
- Type de territoire et textes climat : découpler le climat du littoral (Q5) ; le passeport peut garder une
  teinte « littoral » pour les communes littorales réelles.
- Carte d'identité Territoire : `place.typology` cesse d'être départementale ; `place.position` affiche la
  mesure nommée et peut revenir dans la synthèse une fois juste.
- Constats du dossier : « Le centre de Lannion est à moins d'un kilomètre de la mer » au lieu de « à 58 km ».

### 8.4 Comportements qui vont changer (attendus)

| Avant | Après |
|---|---|
| Lannion, Morlaix, Perros-Guirec, le Trégor, le Léon nord, une partie de la Côte d'Émeraude : « loin de la mer » | près de la mer ; remontent dans les recherches « mer » |
| Caen « à 1 km de la mer » | centre à ~10 km ; non littorale |
| « Surfer à Saintes », « au bord de l'Atlantique » à Saint-Lô | plus de question ni de texte littoral sans commune littorale |
| Le Havre, Dunkerque, Saint-Nazaire, Arcachon, Biarritz « loin de la mer » (texte climat) | texte climat découplé du littoral |
| Bordeaux « sur la côte atlantique » (filtre façade de la Recherche) | dépend de D6 ; jamais par département |
| `distance_cote_km` arrondi au km | décimale, mesure nommée |

---

## 9. Plan de migration

1. **Construire sans brancher.** Un script `scripts/build-mer.mjs` télécharge la LimTM (7z, 255 Mo, hors
   dépôt), la coupe aux LTM, calcule les trois faits par commune avec les contours ADMIN EXPRESS, charge la
   liste loi Littoral, et écrit un fichier compact par commune ; il produit aussi la ligne simplifiée pour
   l'adresse et un **rapport de différences** ancien → nouveau sur toutes les communes.
2. **Revue humaine du rapport** (porteur), en particulier les seuils (§8.1) et les cas limites (§10).
3. **Brancher le décisionnel** (§8.1, §8.2) derrière les nouveaux champs ; capacité inchangée sauf
   l'adresse.
4. **Brancher l'éditorial** (§8.3) ; supprimer les tables départementales du littoral.
5. **Régénérer** : `data/comparateur-index.json.gz` ; les instantanés Territoire (calculés à la demande depuis
   l'index) ; les fixtures et tests. Revoir les 44 lignes de `communes_categorization` (Brest y est
   « littoral_manche » ; La Rochelle « littoral_atlantique »).
6. **Nettoyer** : retirer `distance_cote_km`, `COAST_ANCHORS`, les tables de façades départementales.

Données à régénérer : l'index du comparateur, le nouveau fichier mer, la ligne simplifiée ; rien dans les
artefacts de dossier figés.

Coût estimé : build **une fois par millésime** de la LimTM (téléchargement 255 Mo, outil 7z, calcul de
quelques minutes avec un index spatial) ; index du comparateur : +3 champs × 34 788 communes, de l'ordre de
+0,5 Mo non compressé (l'index fait 89 Mo décompressés, 11 Mo compressés) ; ligne simplifiée pour l'adresse
**à mesurer en phase 1** (estimation de quelques Mo).

---

## 10. Matrice de tests

« Ancienne » = `distance_cote_km` actuel. « Sonde » = LimTM **non coupée** aux LTM (point du centre /
territoire), via `scripts/research/fut33-sonde-trait-de-cote.mjs`. « Loi » = classement DGALN COG 2022.

| Commune (INSEE) | Ancienne | Sonde centre / territoire | Loi | Vérité attendue après coupure LTM | Rôle du cas |
|---|---|---|---|---|---|
| Châtelaillon-Plage (17094) | 11 km | 1,0 / 0 | Mer | littorale, centre ~1 km | critère d'acceptation FUT-33 |
| Brest (29019) | 2 | 1,4 / 0 | Mer | littorale, ~1 km | positif Atlantique / Iroise |
| Nice (06088) | 1 | 1,1 / 0 | Mer | littorale, ~1 km | positif Méditerranée |
| Dieppe (76217) | 0 | 0,3 / 0 | Mer | littorale | positif Manche |
| Sète (34301) | 5 | 0 / 0 | Mer | littorale | positif Méditerranée, lagune voisine |
| Saint-Malo (35288) | 0 | 0,3 / 0 | Mer | littorale | positif Manche |
| Lannion (22113) | **58** | 0,7 / 0 | Mer | littorale, LTM dans la ville | expose le proxy |
| Morlaix (29151) | **54** | 1,4 / 0 (brut) | Mer | centre ~5 km (LTM en aval), territoire 0 | expose le proxy ; centre ≠ territoire |
| Perros-Guirec (22168) | **63** | 0 / 0 | Mer | littorale | pire cas national |
| Rochefort (17299) | 27 | 1,1 / 0 (brut) | Estuaire | centre ~10 km, « commune d'estuaire » | estuaire ≠ mer |
| Saintes (17415) | 33 | 22,9 / 18,0 | aucun | intérieure, ~20 km | négatif Charente-Maritime |
| Saint-Jean-d'Angély (17347) | 54 | 24,2 / 21,8 | aucun | intérieure | négatif Charente-Maritime |
| Bordeaux (33063) | 51 | **1,8 / 0 (brut)** | aucun | intérieure, plusieurs dizaines de km | piège de l'estuaire ; jamais « côte atlantique » |
| Nantes (44109) | 49 | **2,7 / 0 (brut)** | aucun | intérieure, ~50 km | piège de l'estuaire |
| Caen (14118) | **1** | 1,2 / 0 (brut) | aucun | centre ~10 km, non littorale | faux positif du proxy et de la ligne brute |
| Montpellier (34172) | 17 | 5,6 / 1,9 | aucun | proche (étangs), non littorale | lagunes : D2 |
| Rennes (35238) | 64 | 45,9 / 41,7 | aucun | intérieure | négatif Bretagne |
| Pontivy (56178) | 46 | 35,5 / 32,7 | aucun | intérieure | négatif Bretagne (département « Atlantique » actuel) |
| Carhaix-Plouguer (29024) | 52 | 38,1 / 34,3 | aucun | intérieure | négatif Finistère |
| Saint-Nazaire (44184) | 2 | 1,7 / 0 | Mer | littorale | texte climat actuel « loin de la mer » |
| Arcachon (33009) | 1 | 1,3 / 0 | Mer | littorale (bassin) | bassin = mer (D2) |
| Vannes (56260) | 1 | 0,8 / 0 | Mer | littorale (golfe) | mer intérieure |
| Annecy (74010) | 260 | (aucune côte) | Lac | jamais « littorale » côté mer | classement Lac exclu |
| Marseille (13055) | absente | | Mer | à traiter par arrondissement (13201 à 13216) | communes PLM |

**Tests nationaux de non-régression (phase 1) :**
1. Toute commune classée « Mer » a `mer_territoire_km` ≤ une tolérance (quelques centaines de mètres, à
   calibrer sur les écarts entre contours IGN et LimTM) ; liste nominative des exceptions, revue à la main.
2. Aucune commune non classée (ni Mer ni Estuaire) n'a `mer_territoire_km = 0`, sauf exceptions listées.
3. Bordeaux, Nantes, Rouen, Caen, Montpellier : jamais `loi_littoral`, jamais « en bord de mer ».
4. Aucun libellé « littoral », « bord de mer », « façade » sans `loi_littoral = mer` ou une distance mesurée.
5. Aucun usage de `DEPT_*` ni d'une table départementale pour une notion côtière (test sur le source).
6. Distribution : nombre de communes à ≤ 5, 15, 30 km avant et après, publié dans le rapport de build.
7. Le texte rendu, pas seulement le verdict : « Lannion » ne doit jamais lire « loin de la mer ».

---

## 11. Risques et inconnues

| Risque | Gravité | Traitement |
|---|---|---|
| **Coupure aux LTM** mal faite : estuaires gardés (Bordeaux « côtière ») ou côtes coupées à tort | élevée | algorithme testé sur les estuaires de la §5.2 ; rapport nominatif ; revue humaine |
| Fermetures LTM parfois commentées « référence juridique non identifiée », « limite pas prise en compte » (Arcachon) | moyenne | lister les fermetures retenues ; règle explicite par cas |
| Lagunes, étangs salés, bassins (Thau, étangs palavasiens, Arcachon, golfe du Morbihan) | moyenne | décision D2 ; la loi les traite comme la mer |
| Écarts entre contours IGN et LimTM (le territoire communal peut s'arrêter avant ou après le rivage) | moyenne | tolérance calibrée ; recoupement avec le classement juridique |
| Liste loi Littoral au COG 2022, communes fusionnées depuis | faible | table de passage COG ; classement « partiel » signalé par la DGALN |
| Façades officielles (DSF) : format et licence non vérifiés | faible | vérifier en phase 1 ; sinon découpage produit versionné |
| Poids de la ligne embarquée pour l'adresse | faible | simplification, à mesurer |
| Outil 7z au build | faible | dépendance de build documentée ; build hors ligne de production |
| Communes PLM (Marseille par arrondissement) | faible | calcul par arrondissement, comme le reste de l'index |

---

## 12. Recommandation d'implémentation par étapes

1. **Étape 1, donnée seule** : script de build (LimTM coupée aux LTM, contours, liste juridique), fichier par
   commune, ligne simplifiée, rapport de différences et tests nationaux. Aucun changement visible.
2. **Étape 2, décisionnel** : filtres et classement de la Recherche, règles et constats du dossier, ancres ;
   mesures nommées par grain ; capacité inchangée sauf `nearSea` à l'adresse. Les seuils sont présentés avant
   d'être recodés.
3. **Étape 3, éditorial** : catégories, type de territoire, textes climat, carte d'identité, signatures, une
   seule table de façades.
4. **Étape 4, adresse** : `mer_adresse_km` pour Autour et Logement ; `nearSea` avec N du lecteur tranchable à
   l'adresse.
5. **Étape 5, nettoyage** : suppression de `distance_cote_km` et des tables départementales du littoral ;
   revue des 44 catégorisations manuelles.

### Ce qui pourra devenir plus tranchable après FUT-33, et ce qui restera apprécié

| Critère | Après FUT-33 |
|---|---|
| « À moins de N km de la mer », N dit par le lecteur, **adresse connue** | **trancher** (mesure exacte, bon grain) |
| Idem, **grain commune** | apprécier ; ou « non respectée » certaine si le territoire est au-delà de N (D3) |
| « Au bord de la mer », « il nous faut la mer » (sans N) | apprécier ; tranchable seulement avec une définition acceptée (FUT-8), par exemple « commune littorale » ou un N |
| « Pas le littoral » (convention 15 km) | apprécier tant que la convention n'est pas acceptée ; à l'adresse avec un N du lecteur : trancher |
| « Sur la côte atlantique » | apprécier ; tranchable au grain commune une fois acceptée une convention « commune littorale de la façade » (D6) |
| Préférence « proximité de la mer » | apprécier (préférence) ; meilleure mesure, même capacité |
| Climat « océanique » | hors FUT-33 (climat) |

---

## 13. Décisions à prendre avant de coder

| # | Décision | Options | Recommandation |
|---|---|---|---|
| D1 | Rivage de référence | LimTM brute ; **LimTM coupée aux LTM** | coupée aux LTM (sinon Bordeaux et Nantes deviennent côtières) |
| D2 | Lagunes, étangs salés, bassins | comptent comme la mer ; ne comptent pas | comptent (cohérent avec la loi et l'usage : Arcachon, golfe du Morbihan) ; à confirmer pour les étangs fermés |
| D3 | Dossier au grain commune pour « à moins de N km » | rester apprécier ; **capacité asymétrique** (trancher seulement le « non ») | asymétrie, mais en étape 2 bis, car elle touche le contrat FUT-7 |
| D4 | « Pas le littoral » dans la Recherche | exclure si le territoire touche la mer ; si le centre est à < 15 km | à décider avec le rapport de différences sous les yeux |
| D5 | Ancre « au bord de la mer » | `mer_centre_km ≤ 15` ; `loi_littoral = mer` | commune littorale (Mer), qui est une qualité de la commune et non une distance |
| D6 | Façades | façades officielles (DSF) ; découpage produit ; supprimer les jetons de façade | façades rattachées au rivage, jetons gardés comme conventions de périmètre FUT-8 |
| D7 | Textes climat | découpler du littoral ; garder par département | découpler (Q5) ; nouveau travail éditorial |
| D8 | Nom du champ | garder `distance_cote_km` ; **nouveaux champs** | nouveaux champs (oblige chaque usage à choisir sa mesure) |
| D9 | Distance à l'adresse | WFS Shom en direct ; **ligne simplifiée embarquée** | ligne embarquée |
| D10 | Seuils (15 / 100, ≤ 5, ≤ 2 / ≤ 8, 15 de l'ancre, 30 d'exploration) | garder ; recalibrer | présenter des valeurs sur la nouvelle distribution avant tout code |

---

## 14. Réponses aux quatorze questions du cadrage

1. **La mauvaise donnée** : `distance_cote_km`, distance du centre de la commune à 46 villes côtières, et
   quatre tables de façades par département ou région (§2).
2. **Où elle change une décision** : filtres `nearSea` / `excludeSea` et score `proximite_mer` de la Recherche,
   dérivation d'ancre, zones façade, règles mer du dossier (§3.1).
3. **Ce qui la remplace** : distance au rivage de la mer (LimTM coupée aux LTM) au centre et au territoire,
   classement loi Littoral, façade rattachée au rivage, distance à l'adresse (§6).
4. **À quel grain** : commune (centre, territoire, juridique) ; adresse pour Autour et Logement (§7).
5. **Une seule valeur ?** Non (§6.2).
6. **Au niveau commune** : territoire pour l'inclusion et la certitude négative, centre pour le classement et le
   signal (§7.1).
7. **Avec une adresse** : distance adresse → rivage, calculée à la demande sur une ligne embarquée (§7.2).
8. **« Commune littorale »** : le classement juridique Mer, distinct d'Estuaire et de Lac, jamais déduit d'un
   département (§6.3).
9. **Façades** : une table unique rattachée au rivage ; jetons de recherche en conventions FUT-8 (§6.4).
10. **Comportements qui changent** : §8.4.
11. **Données à régénérer** : index du comparateur, fichier mer, ligne simplifiée, fixtures (§9).
12. **Coût** : build par millésime (255 Mo téléchargés), index +0,5 Mo, ligne à mesurer (§9).
13. **Tests anti-régression** : §10.
14. **Capacité après le chantier** : §12.

---

Sources (consultées le 02/10/2026) :
[Limite terre-mer, data.gouv.fr](https://www.data.gouv.fr/datasets/limite-terre-mer-1) ·
[Annonce de la Limite terre-mer, Shom](https://www.shom.fr/fr/liste-actualites/une-nouvelle-limite-entre-la-terre-et-la-mer-qui-reunit-terriens-et-marins-la) ·
[Trait de côte Histolitt, data.gouv.fr](https://www.data.gouv.fr/datasets/trait-de-cote-histolitt) ·
[Limite terre-mer dans la BD TOPO](https://bdtopoexplorer.ign.fr/limite_terre_mer) ·
[Loi littoral : classement des communes, Observatoire des territoires](https://www.observatoire-des-territoires.gouv.fr/loi-littoral-classement-des-communes) ·
[Communes de la loi littoral au COG 2022, Sextant](https://sextant.ifremer.fr/geonetwork/srv/api/records/faf24a56-dfec-46a5-94d1-2373cc3e7e29)
