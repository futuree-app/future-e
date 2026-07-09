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

### 2. Les servitudes et secteurs de sols ★★★

Déjà documenté dans `2026-07-09-le-fil-icpe-verdict-spike.md`. 836 SUP et 5 682 SIS, géométries
réelles, 51 % de la population, une adresse sur six avec une servitude à moins de 500 m.

### 3. Les logements neufs livrés (DPE ADEME) ★★

Déjà documenté dans `2026-07-09-rapport-vivant-matiere-par-critere.md`. 91 % des lecteurs, grain
adresse, `geo_distance` disponible.

### 4. L'isochrone IGN, le temps de trajet réel ★★

`https://data.geopf.fr/navigation/isochrone?resource=bdtopo-valhalla&point={lon},{lat}&costValue=900&costType=time&profile=car`

Répond sans clé, rend un polygone. Or futur•e calcule aujourd'hui ses critères d'accès en
**distance à vol d'oiseau** (haversine, rayons adaptatifs). Un isochrone est la vraie mesure : quinze
minutes de voiture depuis une adresse, ce n'est pas un cercle.

Cette source n'ajoute pas un critère. Elle **améliore la vérité** de `acces_soins`, `acces_services`,
`acces_ecoles`, `acces_culture`, `acces_transports`, `mobilite_quotidienne`, `faible_dependance_auto`.
Sept critères sur vingt-huit, tous fondés sur une approximation qu'on peut remplacer.

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
