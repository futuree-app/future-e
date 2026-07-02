# Inventaire et doctrine des sources de données

> Terrain et doctrine du futur agent **Data Curator** (cf. `adr/ADR-0006`). Le Data Curator
> n'est pas le gardien de toutes les données du projet. Il répond à UNE question :
> **« Cette donnée mérite-t-elle d'entrer dans le système de décision de futur•e, et si oui,
> comment l'utiliser honnêtement ? »**
>
> Cette page porte le **durable** (comment décider) ; le **code** porte le vivant (le câblage
> exact : `DATA_SOURCES.md` = technique, `SOURCES_MODULES_MATRIX.md` = éditorial rapport,
> `src/lib/*.ts`, `scripts/populate-*`). Construite en confrontant le code au 2026-06-25.

## Pourquoi une donnée rejoint futur•e

> Une donnée n'entre pas parce qu'elle est disponible. Elle entre parce qu'elle raconte
> quelque chose du territoire que l'utilisateur ne pouvait pas comprendre autrement.

C'est la phrase-mère (invariant n°1 : on éclaire une décision, on ne remplit pas une fiche).
Deux corollaires :

> Une bonne donnée mal racontée vaut moins qu'une donnée imparfaite bien contextualisée.

> Le rôle principal du Data Curator est de dire **non**. Son travail n'est pas d'ajouter des
> sources, c'est d'empêcher futur•e de devenir un catalogue.

## La valeur n'est pas la donnée, c'est la transformation

DRIAS est public, tout le monde y a accès. Le moat de futur•e n'est pas la donnée brute, c'est
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
- Que perdrait futur•e si cette source disparaissait demain ?
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

- **Fondatrices** — sans elles, futur•e n'existe plus. **DRIAS** (maintenance faible, build
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
| **Balances comptables des communes, compte 6161** (DGFiP, data.economie.gouv.fr, 2010-2024) | refusée | la prime d'assurance de la COMMUNE ne dit rien de l'assurabilité d'un LOGEMENT (crise SMACL/duopole, émeutes 2023, cycles de marchés publics, auto-assurance, périmètre 6161 partiel vs 6168, rupture M14→M57 en pleine fenêtre) ; le vrai historique de risque est déjà porté par CatNat/GASPAR ; pièges techniques : clé `ndept`+`insee` à recombiner, budgets annexes à exclure, millésimes vivants sur data.economie.gouv.fr (la fiche data.gouv s'arrête à 2017) | évite un signal « dégradation assurantielle » à attribution fausse copié d'un indice tiers ; économise la chaîne de corrections invérifiable (déflateur, nomenclature, patrimoine) | `docs/rapports-agents/data-curator/2026-07-02-balances-comptables-assurance-communes.md` |
| **Sinistralité ONRN/CCR** (Géorisques, millésime 2025, 1995-2021) | différée, périmètre tranché | seule paire admise = **coût moyen + fréquence** (sécheresse, inondation) en récit gaté par la représentativité communale, module Logement/vulnérabilité ; **Reco = doublon GASPAR refusé ; S/P non surfacé** (prime non ventilée par péril) ; « échelle nationale » de CCR lue comme discipline (pas de scoring, pas de tendance inter-millésimes, classes verbatim), pas comme veto ; les « 39 776 lignes » = 34 839 communes + padding vide (vérifié) | évite un signal « assurabilité » prédictif indéfendable et un 5e doublon CatNat ; doctrine d'usage prête ; **MISE À JOUR 2026-07-02 : le porteur avance l'intégration au module Logement ; licence acceptée sans confirmation écrite (présomption favorable assumée) ; le coût moyen sécheresse a été corrigé à 100 % (fichier Géorisques ONRN désaligné réparé, cf. `2026-07-02-fix-csv-secheresse-onrn.md`), livré dans `data/source/onrn/`. **INTÉGRÉE 2026-07-03** : sécheresse ET inondation (coût moyen + fréquence) branchées au module Logement (Face 2), inondation re-téléchargée et consolidée (couplage 100 %, aucune corruption), lib `src/lib/onrn-sinistralite.ts`, récit gaté par la représentativité ; mapping INSEE 107 communes fusionnées = limite documentée** | `docs/rapports-agents/data-curator/2026-07-02-sinistralite-onrn-ccr.md` |
| **Cartes de bruit stratégiques (dir. 2002/49) + Bruitparif** | refusées | couverture non nationale (agglos >100k / grandes infra ; Bruitparif = IDF), autorités/millésimes hétérogènes, pas de jeu national unifié ; un dB partout est impossible honnêtement | évite une brique bruit qui mentirait par le vide hors métropole (même famille de refus que iuhi/EAIP non nationaux) ; le module Logement dit « proximité d'un axe potentiellement bruyant » via OSM, jamais un dB | `docs/rapports-agents/data-curator/2026-07-02-autour-immediat-logement.md` |
| **Canopée nationale au grain adresse** | différée/refusée | pas de jeu national de canopée fine ; Copernicus TCD 10 m (2018) trop grossier et redondant avec OCS GE ; « taux de canopée à la parcelle » = fausse précision | évite un 3e raster et un chiffre faux-précis ; la verdure se dit par « espace vert à X m » (OSM) + couverture du sol | `docs/rapports-agents/data-curator/2026-07-02-autour-immediat-logement.md` |
| **OCS GE (IGN) pour la verdure au point** | différée | donnée « juste » (polygone fin, non contributif) mais couverture nationale non confirmée au 2026-07-02 + coût vecteur élevé pour solo | garde la porte ouverte à la robustesse ultérieure sans bloquer la Face 3 minimale (OSM capture ~90 % de la valeur) | `docs/rapports-agents/data-curator/2026-07-02-autour-immediat-logement.md` |

## Statut de la « roadmap » de la matrice repo (à acter)

Plusieurs sources « à intégrer » dans `SOURCES_MODULES_MATRIX.md` sont **désormais livrées**
côté scoring : GASPAR/CatNat, trait de côte Cerema, GisSol, équipements INSEE → **BPE24**,
bruit → **calme_sonore** (OSM), MOBPRO, nature (OSO). À mettre à jour dans le doc repo. Restent
non intégrés : **Métier** (le plus pauvre, France Stratégie/INRS/Dares non câblés), **DVF au
moteur** (V2).

**PFAS (eau)** : piste précisée par la veille du 2026-07-01
(`docs/rapports-agents/deep-research/2026-07-01-demande-ou-vivre-climat-brut.md`) — surveillance
de 20 PFAS dans l'eau distribuée obligatoire en France depuis le 1er janvier 2026 (directive UE,
seuil somme 0,1 µg/L), source data.gouv.fr/Ministère de la Santé (Licence Ouverte 2.0, mise à
jour mensuelle), quelques dizaines de réseaux sur ~8 000-8 800 dépassent le seuil (ordre de
grandeur 0,3-0,4 % des réseaux, chiffre volatile à revérifier à l'usage, ne pas graver comme
fixe). **Même piège d'agrégation que l'eau bactériologique** (`doctrine/data.md` règle 5) :
donnée par UDI/réseau, pas par commune, et une moyenne nationale rassurante masquerait une
exposition concentrée sur les réseaux qui dépassent. Pas encore auditée par le Data Curator ;
intérêt pour un futur module Santé/eau au-delà de la conformité microbiologique classique. Rien
qui touche le goulot d'acquisition, ne justifie aucune priorité produit immédiate.

**Sinistralité assurantielle ONRN/CCR** : instruite par le Data Curator le 2026-07-02
(`docs/rapports-agents/data-curator/2026-07-02-sinistralite-onrn-ccr.md`), verdict
**DIFFÉRÉE, périmètre tranché**. Seule paire admise le jour venu : **coût moyen + fréquence
des sinistres** (sécheresse/RGA et inondation), en récit qualitatif gaté par la
représentativité communale (feuille 3 des xlsx : raconter seulement si ≥ « Entre 30 et
50 % »), classes verbatim, module **Logement/vulnérabilité**, attribution « ONRN (État / CCR /
MRN), via Géorisques ». Refusés : Reco_* (doublon GASPAR/CatNat en place), coût cumulé/par
habitant/TRI (taille-dépendants), tempête (départemental). **S/P non surfacé côté lecteur**
(la prime CatNat n'est pas ventilée par péril : dénominateur faux pour une lecture par péril).
La phrase CCR « l'échelle pertinente est l'échelle nationale » (présente dans toutes les
fiches) est lue comme discipline d'usage, pas comme veto (le producteur publie lui-même des
cartes communales avec représentativité par commune ; classes nationales homogènes,
contrairement à l'iuhi refusé) → triple interdit : jamais au scoring `/ou-vivre`, jamais de
tendance inter-millésimes, jamais de valeur inventée dans une classe. Réalité des fichiers
vérifiée ligne à ligne (inondation) : 34 839 communes métropole (+ 4 937 lignes de padding
vide), référentiel INSEE 2021, Paris sans arrondissements, DOM absents. **Verrous avant
intégration** : signal du pari #9 OU cadrage Logement-vulnérabilité, ET confirmation écrite
de la licence auprès du contact ONRN (présomption Licence Ouverte via Géorisques, réserve de
propriété intellectuelle des contributeurs non levée).

**PIÈGE MAJEUR découvert au prototype (2026-07-02).** Le fichier `ONRN_CoutMoyen_SECH_9521.xlsx`
(coût moyen sécheresse, le plus utile pour le RGA/Logement) a sa **feuille de données
désalignée** : la colonne code INSEE a été triée indépendamment des colonnes nom + valeur
(vérifié : code 31555 « Toulouse » y porte le nom « Saint-Omer-en-Chaussée » et la valeur
« Pas de sinistre répertorié », alors que Toulouse en argiles a une représentativité 30-50 %).
Une jointure par code INSEE sur ce fichier donne des valeurs FAUSSES et silencieuses. Les trois
autres fichiers (fréquence sécheresse, coût moyen + fréquence inondation) sont sains (nom aligné
au code, vérifié 6/6). Contournement du coût sécheresse : jointer par NOM (nom + valeur restent
alignés entre eux) récupère proprement **93,1 %** des communes (89,4 % à nom unique + homonymes
à classe constante) ; restent **2 406 communes (6,9 %)** homonymes à classes divergentes,
indépartageables par le seul nom. La feuille est en fait triée alphabétiquement (collation
Excel française, article/accents/tirets) tandis que le code reste en ordre INSEE, mais
reproduire cette collation pour ré-aligner par position est trop fragile (échec de
concordance). Solution propre : signaler le bug à l'ONRN et obtenir un fichier ré-aligné (bug
d'export évident de leur côté) ; en attendant, le gate de représentativité écarte déjà une
partie des 2 406 ambigus (petites communes à faible échantillon CCR). Le gate de représentativité (feuille 3, seuil ≥ « Entre 30 et 50 % »)
fonctionne : au prototype, la sécheresse de La Rochelle (représ. 15-30 %) serait tue, à raison.
Récit prototypé cohérent et discriminant sur 6 communes (La Rochelle inondation > 20 k€ = trace
de Xynthia, Toulouse sécheresse argiles, Guéret et Brest quasi vierges). Script :
scratchpad session 2ab961b4.

## Gaps validés par une décision réelle (dogfood Brest/Lorient, 2026-06-27)

Quatre manques constatés *en situation de décision* (pas en théorie), lors du premier dogfood réel du
produit. À instruire par le Data Curator (entrent-ils dans le système de décision, et comment
honnêtement ?). N=1, fondateur juge et partie → signal directionnel, pas preuve de marché.

| Donnée manquante | Pourquoi décisionnelle | Source candidate | Note |
|---|---|---|---|
| Ensoleillement (h/an) + jours de pluie ≥ 1 mm | Le cliché « il pleut » porte sur la FRÉQUENCE et la lumière, pas le cumul mm qu'on a déjà | Normales Météo-France | distinct de DRIAS cumul (mm) / intensité (q99, Rx1d). ⚠️ le critère `ensoleillement_recherche` actuel AFFICHE « ensoleillé » mais MESURE chaleur d'été + faible pluie (attribution fausse, à corriger) |
| Qualité des eaux de baignade | Critère réel pour un choix de vie littoral ; a manqué 2 fois (algues vertes incluses) | baignades.sante.gouv.fr / Min. Santé (directive 2006/7/CE) | Hub'Eau ne l'expose pas ; maille site (point) ; ⚠️ les algues vertes ne sont PAS dans ce classement |
| Population de l'unité/aire urbaine | « Est-ce une grande ville ? » se joue sur la taille vécue (agglo), pas la commune | INSEE (déjà câblé pour le scoring UU) | l'index a le code `uu`, pas le nombre d'habitants exposé au récit. On a l'UU, **pas** l'aire d'attraction (AAV) — ne pas dire « aire urbaine » |
| Logement social / taux HLM | Demandé pour « comparer la politique logement » | INSEE / RPLS 2023 (déjà dans `commune-data.ts`) | présent à l'IRIS / par commune ; **descriptif neutre, jamais scoré** (ADR-0001) |

**Statut après le dogfood (2026-06-27).** Deux des quatre n'étaient pas des sources externes mais des
câblages internes, désormais portés dans l'index (`data/comparateur-index.json`) par des scripts
d'enrichissement non destructifs :
- **`uu_pop`** (population de l'unité urbaine) — `scripts/populate-uu-pop.mjs`. Dérivée de l'index. À
  exposer au récit comme « agglomération / unité urbaine », **jamais « aire urbaine »** (on a l'UU, pas l'AAV).
- **`hlm_pct`** (taux de logements sociaux) — `scripts/populate-hlm.mjs`, ADEME RPLS 2023. **Donnée présente
  mais NON surfacée**, volontairement parquée : sa valence est ambiguë (selon le projet de vie, un fort taux
  se lit comme accès abordable *ou* comme signal d'un quartier stigmatisé), ce qui interdit tout scoring et
  en fait un critère « lieu de vie » discutable. À ne surfacer **que sur demande utilisateur avérée**
  (intéressant mais non prioritaire). N'en faire ni une promesse ni un avantage.

Les deux sources externes ont été intégrées (2026-06-27) :
- **Ensoleillement** — **rayonnement solaire ERA5** (`scripts/populate-rayonnement-*`), normale 1991-2020,
  injecté dans l'index (`rayonnement_pct`). **Répare l'attribution fausse** : le critère
  `ensoleillement_recherche` lit désormais le rayonnement réel, récit **qualitatif** (très/moyennement/peu
  ensoleillé), jamais d'heures inventées. QA vs heures Météo-France : Pearson 0,93 / Spearman 0,87. Caveat
  côtier assumé (ERA5-Land masque l'océan → presqu'îles type Brest légèrement surestimées). Pour afficher des
  **heures** un jour : second chantier (normales stations Météo-France).
- **Eaux de baignade** — **Ministère de la Santé** (rapportage saison balnéaire, directive 2006/7/CE),
  `scripts/populate-baignade.mjs` → `data/communes-baignade.json` (1702 communes avec site). Donnée
  **module-agnostique**, branchée dans le socle `gatherCommuneEnrichment` (donc AskFuture + synthèse quartier
  + rapport d'un coup), surfacée côté lifestyle via `baignade_ici`. **Graine du futur module Santé
  environnementale** (foyer conceptuel : classement sanitaire ARS). Limites divulguées : classement
  pluriannuel ≠ jour J, **n'inclut PAS les algues vertes**, couverture littoral/lacs (non nationale).
  Voir aussi `docs/cadrage-ensoleillement-attribution.md`.

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
