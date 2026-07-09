# Inventaire des sources non exploitées, et les angles morts qu'elles révèlent

> Balayage large, 2026-07-09. Chaque source a été **testée en appelant son API**, jamais supposée.
> Sonde reproductible : `scripts/research/sonde-sources.mjs`, `scripts/research/dvf-couverture.mjs`.
> Commune témoin : La Rochelle (17300). Échantillon de mesure : les 120 communes tirées au prorata
> de la population (`tmp/fil/sup-sis-proximite.json`).

## Méthode

Quatre filtres, dans cet ordre. Une source ne survit que si elle les passe tous.

1. **Décisionnelle** : elle change ce qu'un lecteur ferait, pas seulement ce qu'il sait.
2. **Grain fin** : adresse ou commune, jamais le département.
3. **Sans critère** : futur•e ne la porte pas déjà (28 critères, `PREFERENCE_KEYS`).
4. **Accessible** : une API répond, sans clé, aujourd'hui.

## Ce que futur•e exploite déjà

`atmo`, `baignade`, `cadastre`, `cartofriches`, `dpe`, `drias`, `era5`, `gissol`, `icu`, `ign`,
`irep`, `littoral`, `onrn-sinistralite`, `pollen`, `pprn-zonage`, `renovation`, `rge`, `vigieau`,
`zfe`, plus Géorisques, BPE, INSEE, OSM, SNCF, MESR. Le balayage ne cherche que dans les angles morts.

## Les cinq découvertes

### 1. DVF, le prix réel des ventes ★★★

`https://files.data.gouv.fr/geo-dvf/latest/csv/{annee}/communes/{dept}/{insee}.csv`
Millésimes 2022 à 2025. Grain **adresse**, avec coordonnées, date de mutation, surface, type de bien.

**Aucun des 28 critères ne parle du prix.** C'est la première contrainte de « où vivre », et elle est
absente. Recommander Annecy à quelqu'un qui dispose de 200 000 € n'est pas une nuance de score, c'est
une réponse fausse. Le code a déjà le concept qu'il faut : `HardConstraints`, non `Preference`.

Deux pièges, **mesurés, non supposés** :

- **Multi-lots : 50 % des mutations.** Une vente peut porter plusieurs biens (un lot et un garage,
  un immeuble entier). `valeur_fonciere / surface` est alors faux, presque toujours surestimé. Il
  faut ne garder que les mutations à un seul local bâti, sans dépendance. Ce nettoyage écarte la
  moitié du fichier.
- **Petits effectifs.** Une médiane sur trois ventes n'est pas un prix. En imposant un seuil de 20
  ventes sur au moins un des deux types de bien, la couverture reste à **98 % des lecteurs**
  (79 communes sur 114). Les appartements sont mal couverts hors des villes (30 communes à n≥30),
  les maisons le sont bien (56 communes).

*Le script `dvf-couverture.mjs` a lui-même produit l'artefact qu'il mesurait à son premier essai :
il affichait « Millas, 380 €/m² » sur **une seule vente**, parce que le seuil portait sur le total
des ventes et non sur celles du type affiché. Le piège est réel et il attrape même celui qui le
cherche.*

**La bonne formulation, qui respecte « décrire, jamais juger ».** Ne pas dire qu'une commune est
chère. Dire ce que le budget y achète :

| Commune | Prix médian appartement | Ce que 250 000 € achètent |
|---|---:|---:|
| Paris 9e | 10 321 €/m² | **24 m²** |
| Vincennes | 8 273 €/m² | 30 m² |
| Béziers | 1 355 €/m² | 185 m² |
| Belfort | 1 250 €/m² | 200 m² |
| Castelnaudary | 672 €/m² | **372 m²** |

Deux réserves de doctrine. Le prix est le **seul signal mobile** du produit : les autres critères
sont structurels et bougent tous les cinq ans, le marché bouge tous les six mois. Et le prix
**corrèle** avec la moitié des critères (mer, services, transports) : l'intégrer au score le ferait
compter deux fois. Une contrainte dure, appliquée en amont du score, évite ce double comptage.
`HardConstraints` porte déjà `communeSize: {min, max}` et `nearSea: {maxKm}` : un budget s'y insère
sans invention.

#### Le calcul national, fait de bout en bout

`scripts/research/dvf-prix-national.mjs` lit les fichiers nationaux en flux (88 Mo gzip par année),
écarte les multi-lots, applique un seuil, et préfère le millésime le plus récent en ne cumulant que
si nécessaire. Résultats sur 2024, puis 2024+2023+2022 :

| | Un millésime (2024) | Trois millésimes |
|---|---:|---:|
| mutations lues | 1 229 371 | 4 279 254 |
| écartées (multi-lots) | 39 % | 40 % |
| retenues | 23 % | 23 % |
| **communes avec un prix** | 2 714 (7,8 %) | **8 426 (24,2 %)** |
| **population couverte** | 60,7 % | **79,8 %** |

Le cumul triple la couverture. Il coûte de l'actualité : **67 % des prix reposent alors sur trois
ans**, dans un marché qui a baissé sur la période. Le script marque donc chaque prix de sa fenêtre
(`"2024"` ou `"2022-2024"`), pour qu'un prix cumulé ne soit jamais présenté comme un prix de l'année.

Les 26 452 communes sans prix ont une population médiane de **306 habitants**. C'est attendu : un
village vend trois maisons par an. Un repli sur l'unité urbaine ou l'EPCI les couvrirait.

#### Le trou qu'il ne faut jamais livrer en silence

**DVF ne couvre pas l'Alsace-Moselle.** Moselle, Bas-Rhin et Haut-Rhin : **zéro commune sur 1 605**.
Strasbourg, Metz, Mulhouse, Colmar, Haguenau n'ont aucun prix. Ces départements relèvent du **livre
foncier de droit local**, non de la publicité foncière de la DGFiP, et aucune source ouverte
équivalente n'existe.

Trois millions d'habitants. Un critère prix livré sans le dire exclurait silencieusement l'Alsace et
la Moselle des recommandations, ce qui est précisément le mode d'échec que ce projet a déjà payé une
fois (cf. `/memory/home_insee_code_pitfall`). Il faut l'écrire dans l'interface, pas dans un
commentaire de code.

### 2. Les servitudes et secteurs de sols ★★★

Déjà documenté dans `2026-07-09-le-fil-icpe-verdict-spike.md`. 836 SUP et 5 682 SIS, géométries
réelles, 51 % de la population, une adresse sur six avec une servitude à moins de 500 m.

### 3. Les logements neufs livrés (DPE ADEME) ★★

Déjà documenté dans `2026-07-09-rapport-vivant-matiere-par-critere.md`. 91 % des lecteurs, grain
adresse, `geo_distance` disponible.

### 4. Le trajet réel : isochrone et itinéraire IGN ★★

Deux services de la Géoplateforme répondent **sans clé** :
`data.geopf.fr/navigation/isochrone` (polygone) et `data.geopf.fr/navigation/itineraire`
(distance et durée réelles).

Or futur•e calcule ses critères d'accès en **distance à vol d'oiseau** (haversine, rayons
adaptatifs). Sept critères sur vingt-huit reposent sur cette approximation : `acces_soins`,
`acces_services`, `acces_ecoles`, `acces_culture`, `acces_transports`, `mobilite_quotidienne`,
`faible_dependance_auto`.

**Ce que l'écart vaut réellement.** Mesuré sur 44 communes tirées au prorata de la population, en
comparant la route vers la ville de plus de 50 000 habitants la plus proche à la distance à vol
d'oiseau (indice de détour) :

- médiane **1,38**, p10 1,23, p90 1,74
- **23 % des communes dépassent 1,6**
- extrêmes : Le Pellerin **2,21** (20,9 km à vol d'oiseau, 46,4 km et 58 minutes par la route,
  l'estuaire de la Loire est en travers), Villette-d'Anthon 1,98, contre Épinal 1,13.

Le biais est donc **modéré en médiane et sévère pour une minorité identifiable** : celles qu'un
obstacle sépare de leur pôle (estuaire, fleuve sans pont, relief). Le remède n'est pas de tout
recalculer, c'est de corriger là où le détour est fort.

*Erreur de méthode à consigner.* J'ai d'abord mesuré le « rayon équivalent » de l'isochrone (le
rayon du disque de même aire) et conclu à un facteur 3,4 entre communes. La métrique était fausse :
un isochrone est une étoile dont les doigts suivent les routes, et son aire est petite quand sa
portée est grande. Une calibration en distance (5 km de réseau donnent 3,4 km de rayon équivalent,
10 km en donnent 7,2) a montré que le calcul d'aire était juste et que **la métrique ne l'était
pas**. L'indice de détour, lui, répond à la question posée.

### 5. L'IPS des collèges ★ (puissant et toxique)

`data.education.gouv.fr`, jeu `fr-en-ips-colleges-ap2022`. 6 973 collèges, avec `code_insee`,
`secteur`, `effectifs`, `ips` (de 59,0 à 163,3).

futur•e mesure aujourd'hui l'**accès** à une école (présence dans la BPE), jamais sa composition.
Un parent ne cherche pas « une école à deux kilomètres », il cherche laquelle.

**Réserve grave.** L'IPS mesure la position sociale des familles, pas la qualité pédagogique.
Affiché sur une carte, il serait lu comme un classement, alimenterait l'évitement scolaire et la
ségrégation qu'il documente. C'est une décision de positionnement, non une question de données.
À trancher par l'Editorial Writer et le porteur, jamais par défaut.

## Les angles morts conceptuels, au-delà des sources

En relisant les 28 critères, cinq besoins d'un lecteur ne sont couverts par aucun d'eux.

| Angle mort | Source testée | Statut |
|---|---|---|
| **Le prix** (contrainte n°1) | DVF | vérifié, exploitable |
| **La sécurité** | base communale SSMSI | fichier annuel, `xlsx`, mis à jour le 2026-07-09 |
| **La qualité de l'école**, pas sa distance | IPS collèges | vérifié, toxique |
| **Le temps de trajet réel** | isochrone IGN | vérifié, sans clé |
| **Le coût récurrent** (taxe foncière, ordures) | `fiscalite-locale-des-particuliers` | incomplet, voir ci-dessous |

**La taxe foncière : une fausse bonne découverte.** Le jeu `fiscalite-locale-des-particuliers`
(data.economie.gouv.fr, 174 668 lignes) expose `taux_global_tfb`, `taux_plein_teom`,
`taux_global_th`. Les taux vont de **4,0 % à 106,9 %**.

Ce ratio de 25 est trompeur, et il ne faut surtout pas le publier : le taux s'applique à une **base
locative cadastrale** qui varie elle aussi d'une commune à l'autre. Sans la base moyenne par local
(fichier REI, non trouvé par API), on ne peut pas dire ce qu'un propriétaire paie réellement.
Piste réelle, donnée incomplète, conclusion suspendue.

## Sources testées sans succès

| Source | Ce qui s'est passé |
|---|---|
| DVF via API Cerema / cquest | HTTP 404 et 502. Les fichiers `geo-dvf` fonctionnent, eux. |
| ANFR (antennes relais) | portail migré, ni `records/1.0` ni `explore/v2.1` ne répondent |
| APL médecins (DREES) | le dataset existe, l'API renvoie `total_count: 0` |
| Sirene (`recherche-entreprises`) | expose `date_creation` et `date_fermeture`, mais **ignore les filtres de date** et plafonne à 10 000. Le flux d'ouvertures et fermetures de commerces demanderait les fichiers `StockEtablissement`. |
| ARCEP (fibre) | identifiant de ressource inconnu |
| Sitadel (permis de construire) | aucune API. La seule source qui dirait ce qui *va* se construire. |
| GPU assiettes de servitudes | `apicarto.ign.fr/api/gpu/assiette-sup-s` renvoie HTTP 400 : attend une géométrie, pas un code INSEE |
| Obligations de débroussaillement | répond, mais booléen communal sans date ni géométrie |

## Ce que ce balayage suggère

Trois des cinq découvertes se lisent **au grain adresse** (DVF, servitudes, logements neufs), et la
quatrième (isochrone) part d'une adresse. Cela confirme ce que les deux audits précédents avaient
trouvé par un autre chemin : la valeur non exploitée de futur•e est concentrée dans le module
**Logement**, là où se trouve déjà le moat, et non dans le module Territoire.

**Le prix mérite une place à part.** Ce n'est pas un vingt-neuvième critère. C'est une contrainte
dure, absente d'un produit dont la promesse est d'aider à choisir où vivre, et sa donnée est
publique, gratuite, datée, au grain adresse, disponible sur quatre millésimes. Un lecteur à qui l'on
recommande une commune qu'il ne peut pas s'offrir n'a pas reçu un mauvais conseil : il a reçu un
conseil sans objet.

## Ce que je ne recommande pas de faire tout de suite

- **La délinquance et l'IPS** : forts, disponibles, et porteurs d'un dommage social que futur•e n'a
  pas vocation à produire. Ils exigent un arbitrage éditorial explicite, non une intégration.
- **La taxe foncière** tant que la base locative manque.
- **Le remplacement des distances par des isochrones** avant de mesurer ce que cela déplace : sept
  critères changeraient de valeur, donc tous les classements. C'est un chantier de vérité, pas un
  ajout, et il doit être mesuré avant d'être décidé.
