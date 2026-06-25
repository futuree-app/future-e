# Inventaire et doctrine des sources de données

> Terrain et doctrine du futur agent **Data Curator** (cf. `adr/ADR-0006`). Le Data Curator
> n'est pas le gardien de toutes les données du projet. Il répond à UNE question :
> **« Cette donnée mérite-t-elle d'entrer dans le système de décision de futur·e, et si oui,
> comment l'utiliser honnêtement ? »**
>
> Cette page porte le **durable** (comment décider) ; le **code** porte le vivant (le câblage
> exact : `DATA_SOURCES.md` = technique, `SOURCES_MODULES_MATRIX.md` = éditorial rapport,
> `src/lib/*.ts`, `scripts/populate-*`). Construite en confrontant le code au 2026-06-25.

## Pourquoi une donnée rejoint futur·e

> Une donnée n'entre pas parce qu'elle est disponible. Elle entre parce qu'elle raconte
> quelque chose du territoire que l'utilisateur ne pouvait pas comprendre autrement.

C'est la phrase-mère (invariant n°1 : on éclaire une décision, on ne remplit pas une fiche).
Deux corollaires :

> Une bonne donnée mal racontée vaut moins qu'une donnée imparfaite bien contextualisée.

> Le rôle principal du Data Curator est de dire **non**. Son travail n'est pas d'ajouter des
> sources, c'est d'empêcher futur·e de devenir un catalogue.

## La valeur n'est pas la donnée, c'est la transformation

DRIAS est public, tout le monde y a accès. Le moat de futur·e n'est pas la donnée brute, c'est
ce qu'on en fait. Le Curator protège la chaîne, pas la source :

`source brute → pipeline → croisements → interprétation → expérience utilisateur`

Cohérent avec `adr/ADR-0002` (le moat est la combinaison, pas l'élément). Conséquence pratique :
une source banale (que les concurrents ont aussi) peut quand même être fondatrice si notre
transformation la rend décisive.

## Les questions à toujours se poser (avant toute intégration)

Le but n'est pas d'appliquer une règle, c'est de penser juste :
- Quel problème utilisateur cette donnée résout-elle ? Quelle décision permet-elle de prendre ?
- Existe-t-il déjà une donnée qui raconte la même chose ?
- À quelle échelle cette affirmation est-elle vraie ? (`doctrine/data.md`)
- Quel est le coût de maintenance ? Est-il soutenable pour un fondateur solo ?
- Que perdrait futur·e si cette source disparaissait demain ?
- Sa licence est-elle compatible ? (attention ODbL d'OSM)

Si l'intégration ne survit pas à ces questions, on n'intègre pas. Une source se **retire** aussi :
licence devenue incompatible, API instable, meilleure source disponible, plus utilisée par
aucune surface, plus maintenue à l'amont. Un retrait se trace, il ne se fait pas en silence.

## Doctrine négative (ce qu'on ne fait pas)

- **Ne jamais intégrer une donnée parce qu'elle existe.** Elle doit améliorer une décision, pas
  enrichir une fiche.
- **Pas de note composite des sources** (ni qualité, ni maintenance en étoiles) : ce serait le
  score synthétique opaque que le produit refuse (`adr/ADR-0001`). On décrit, on ne note pas.
- **Pas de précision déguisée** : une donnée communale n'est jamais vraie à l'adresse.
- **Pas d'attribution trompeuse** : jamais « Callendar » ni source non publique dans l'UI
  (`doctrine/editoriale.md`).

## Typologie : la nature d'une donnée commande son récit

Le Curator doit savoir quel TYPE de donnée il manipule, car ça change la façon de la raconter
(distinction mesuré / projeté / modélisé / interprété, cf. `doctrine/editoriale.md`) :

| Type | Ce que c'est | Exemples | Récit |
|---|---|---|---|
| **Projetée** | sortie de modèle | DRIAS | « les projections indiquent », jamais « il fera » |
| **Mesurée** | observation | ERA5, ATMO, Hub'Eau, OSO | factuel, daté |
| **Historique** | événements passés | CatNat/GASPAR | « 12 arrêtés depuis 1982 » |
| **Réglementaire / zonage** | cadre officiel | PPRN, ZFE, ICPE | opposable, mention obligatoire en vente |
| **Déclarative / calculée** | agrégats statistiques | INSEE (recensement, MOBPRO, BPE) | « à l'échelle de la commune » |
| **Communautaire** | contributif | OSM, RNA | signaler la couverture hétérogène |
| **Transactionnelle** | marché | DVF (différée) | prudence, pas au moteur |

## Hiérarchie de criticité (« on coupe quoi ? »)

Toutes les sources ne jouent pas le même rôle. Cette hiérarchie sert les arbitrages de coût
(le Business Strategist s'en servira). Coût de maintenance noté en clair, jamais en étoiles.

- **Fondatrices** — sans elles, futur·e n'existe plus. **DRIAS** (maintenance faible, build
  annuel), **Géorisques** (moyenne, API tierce), **INSEE** recensement/MOBPRO/BPE (faible,
  millésime annuel à rebuild), **IGN/BAN** (faible, API stable).
- **Enrichissement** — le produit reste excellent sans elles : GisSol, Cartofriches, RNSA,
  Hub'Eau (moyenne, API), IREP, ATMO (moyenne, API), VigiEau, ERA5, ADEME DPE/audit/RGE/réno.
- **Opportunistes** — très utiles mais remplaçables, à surveiller : **OSM** (maintenance
  **élevée**, structure mouvante, licence ODbL avec partage à l'identique), SNCF Open Data,
  MESR, OSO, ZFE, API locales. Premières candidates si un jour il faut couper.

Une source n'est jamais critique seule : elle vit dans une famille qui se corrobore (climat =
DRIAS projeté + ERA5 mesuré ; risques = GASPAR/CatNat + PPRN + ICPE + SSP). Perdre une brique
d'une famille dégrade le récit, rarement le détruit.

## Le cycle de vie d'une donnée

`Découverte → Évaluation (questions ci-dessus) → Intégration (script/lib) → Transformation
(brut → signal) → Exposition (rapport et/ou scoring) → Maintenance (rebuild millésimes) →
Retrait (critères ci-dessus)`.

## Deux surfaces, mêmes sources

Une source alimente deux surfaces, deux usages, sans doublon :
- le **RAPPORT** (6 modules : Quartier/Territoire, Logement, Métier, Santé, Mobilité, Projets) —
  par adresse/commune, récit par module.
- le **COMPARATEUR `/ou-vivre`** (~30 critères de scoring sur 7 thèmes : climat, risques naturels,
  santé environnementale, nature/cadre de vie, mobilité, services/proximité, vie locale/trajectoires) —
  index pré-calculé 34 000 communes. Câblage : `scripts/populate-*` → `build-comparateur-index.mjs`
  → `src/lib/comparateur-vie.ts`.

Ne jamais confondre les taxonomies : 6 modules ≠ 7 thèmes ≠ « 10 dimensions » de `/professionnels`
(à recaler). Même donnée brute, récit distinct par surface.

## Inventaire (instantané au 2026-06-25, confronté au code)

Le **code est la vérité vivante** ; `DATA_SOURCES.md` fait foi pour le câblage. Cette table est
un cliché-pointeur, à réviser à chaque source intégrée ou réaffectée. Licence : sauf mention,
Licence Ouverte / Etalab ; **OSM = ODbL**.

### Climat
| Source | Organisme | Surface / usage | Lib ou script | Échelle |
|---|---|---|---|---|
| **DRIAS-TRACC** (médiane 17 modèles) | Météo-France | Rapport (Territoire) + scoring climat | `drias-json.ts`, `populate-communes-tension.js` | maille → commune |
| **ERA5-Land** (1961→) | Copernicus / CDS | Scoring climat : tendance observée | `era5-trend.ts`, `populate-era5-trend.py` | point → commune |

### Risques
| Source | Organisme | Surface / usage | Lib ou script | Échelle |
|---|---|---|---|---|
| **Géorisques GASPAR / CatNat** | BRGM / Géorisques | Scoring inondation + rapport catastrophes | `populate-inondation.py`, `georisques.ts` | commune |
| **Géorisques v1/v2** (PPRN, RGA, submersion, sismique) | BRGM / Géorisques | Rapport Logement/Quartier | `georisques.ts` | commune/point/parcelle |
| **Géorisques ICPE** (~137k) | Géorisques | Scoring `faible_exposition_industrielle` | `populate-exposition-industrielle.py`, `irep.ts` | point |
| **Géorisques SSP** (sols pollués) | Géorisques | Scoring `heritage_industriel` (narratif) | `populate-heritage-industriel.py` | point/commune |
| **Trait de côte / Géolittoral** | MTE / Cerema | Submersion côtière + rapport littoral | `build-littoral.js`, `populate-coastal-submersion.js`, `littoral.ts` | commune littorale |

### Environnement, air, eau
| Source | Organisme | Surface / usage | Lib ou script | Échelle |
|---|---|---|---|---|
| **ATMO** | ATMO France | Rapport Santé (air) | `atmo.ts` | point → station |
| **GisSol / RMQS** (cadmium) | GisSol / INRAE | Santé environnementale (sols) | `gissol.ts` | maille sols |
| **Cartofriches** | ADEME / Cerema | Rapport Logement/Santé | `cartofriches.ts` | point/commune |
| **IREP** (2019) | ADEME | Rapport Santé/Métier | `irep.ts` | point |
| **Hub'Eau** (ONDE, eau potable) | OFB / Eaufrance | Quartier (sécheresse) + Santé (eau) | `eaufrance.ts` | commune/bassin/station |
| **VigiEau / Propluvia** | MTE | Quartier (restriction) | `vigieau.ts` | commune |
| **RNSA** (pollens) | RNSA | Rapport Santé | `pollen.ts` | zone |

### Mobilité, services, démo, social, infra
| Source | Organisme | Surface / usage | Lib ou script | Échelle |
|---|---|---|---|---|
| **OSM / Overpass** | OpenStreetMap (ODbL) | Scoring `mobilite_quotidienne`, `calme_sonore`, `vie_locale` | `populate-reseau-local.py`, `populate-calme-sonore.py`, `populate-vie-locale.py` | point |
| **SNCF Open Data** | SNCF | Scoring `acces_transports` | `populate-transports.py` | point gare |
| **BPE24** | INSEE | Scoring services/écoles/culture/santé + `vie_etudiante` | `populate-bpe.py` | équipement |
| **INSEE** (recensement, MOBPRO, FLORES, ZE2020, logement) | INSEE | Scoring démo, dépendance auto, emploi, UU | `populate-demographie.py`, `populate-dependance-auto.js`, `populate-communes-emploi.js`, `populate-unite-urbaine.py` | commune/ZE/UU |
| **MESR** | Enseignement sup. | Scoring `vie_etudiante` | `populate-etudiants.py` | unité urbaine |
| **OSO 2023** (raster 10 m) | CESBIO / Théia | Scoring `nature` | `populate-nature.py` | raster 10 m |
| **RNA/WALDEC + AMALIA** | Min. Intérieur | Scoring `vie_locale` (assos) | `populate-reseau-local.py` | commune |
| **ADEME** (DPE/audit/RGE/réno, data_communes/iris, ZFE) | ADEME (Data Fair) | Rapport Logement/Mobilité + scoring dépendance auto | `dpe.ts`, `audit.ts`, `rge.ts`, `renovation.ts`, `commune-data.ts`, `zfe.ts` | adresse/commune/IRIS |
| **BAN / API Carto / IGN / API Géo** | IGN / Etalab | Infra : géocodage, parcelle, altitude, commune | `ban.ts`, `cadastre.ts`, `ign.ts`, `communes.ts` | adresse/point/commune |

## Les victoires méthodologiques (la mémoire des refus)

Un refus bien tracé est une victoire : on a appris ces choses au prix de jours de recherche, on
les oublierait dans six mois et on repartirait chercher la même source. Documenter le refus,
c'est économiser la dette future.

| Source | Décision | Pourquoi | Gain | Référence |
|---|---|---|---|---|
| **EAIP** (zones inondables) | abandonnée | donnée communale non récupérable proprement | semaines de dette évitées, livré binaire honnête + CatNat flagship | `/memory/risque_enrichment_eaip.md` |
| **ÎCU CSTB** (îlots de chaleur) | réservée Logement/Santé | granularité IRIS, score dépt-normalisé non comparable en Territoire | évite une carte Territoire trompeuse | `/memory/icu_ilot_chaleur_data.md` |
| **DVF** (transactions) | différée V2 | pas de chip immobilière tant que pas au moteur | périmètre de scoring maîtrisé | `src/lib/comparateur-vie.ts` |

## Statut de la « roadmap » de la matrice repo (à acter)

Plusieurs sources « à intégrer » dans `SOURCES_MODULES_MATRIX.md` sont **désormais livrées**
côté scoring : GASPAR/CatNat, trait de côte Cerema, GisSol, équipements INSEE → **BPE24**,
bruit → **calme_sonore** (OSM), MOBPRO, nature (OSO). À mettre à jour dans le doc repo. Restent
non intégrés : **Métier** (le plus pauvre, France Stratégie/INRS/Dares non câblés), **PFAS**
(eau), **DVF au moteur** (V2).

## Liens

`adr/ADR-0006-architecture-equipe-ia.md` (Data Curator), `adr/ADR-0001-pas-de-score-synthetique.md`
(pas de note), `adr/ADR-0002-pivot-compatibilite-territoriale.md` (moat = la combinaison),
`doctrine/data.md` (granularité), `doctrine/editoriale.md` (attribution, types de données),
`principes/invariants.md`, `modules/territoire.md`, `/memory/project_modules.md`,
`/memory/ademe_datasets.md`, et les fiches scoring (`inondation_scoring`,
`mobilite_quotidienne_reseau`, `vie_locale`, `calme_sonore`, `exposition_industrielle`,
`croissance_demographique`, `bpe_rayon_pondere`, `project_vie_etudiante`,
`risque_enrichment_eaip`, `icu_ilot_chaleur_data`). Docs techniques repo : `DATA_SOURCES.md`,
`SOURCES_MODULES_MATRIX.md`.
