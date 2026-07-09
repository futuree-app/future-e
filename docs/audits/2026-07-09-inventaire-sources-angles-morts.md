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

## Les découvertes

### 1. DVF, le prix réel des ventes — CE N'ÉTAIT PAS UN ANGLE MORT

> **Correction.** Ce paragraphe affirmait d'abord que le prix était absent de futur•e. C'est faux, et
> je l'ai découvert en fin de balayage, en inspectant l'index plutôt qu'en relisant `PREFERENCE_KEYS`.
> `scripts/populate-logement.mjs` calcule **déjà** le prix depuis DVF (millésimes 2021-2024), avec un
> seuil de 10 ventes et un **repli sur l'EPCI**, et utilise **déjà** la Carte des loyers de l'ANIL.
> L'index porte `logement.achat.{maison,appart}.eur_m2` et `logement.location`.
>
> Mieux : l'en-tête du script grave la doctrine. *« Logement = MODULE, pas critère de classement. Le
> comparateur n'a besoin que d'un niveau de prix relatif, pas d'un chiffre, pas d'accessibilité
> (revenu = biais, réservé au futur module). »* L'absence du prix dans les 28 critères est donc une
> **décision arbitrée**, non un oubli. Et l'Alsace-Moselle est déjà traitée : Strasbourg, Metz et
> Mulhouse portent `achat.dispo = false`, la location restant affichée.
>
> Ce qui suit garde sa valeur : la couverture nationale mesurée, le trou Alsace-Moselle documenté,
> et surtout l'audit du calcul existant, ci-dessous.

`https://files.data.gouv.fr/geo-dvf/latest/csv/{annee}/communes/{dept}/{insee}.csv`
Millésimes 2022 à 2025. Grain **adresse**, avec coordonnées, date de mutation, surface, type de bien.

#### Audit du calcul en production : un défaut réel, borné

`populate-logement.mjs` déduplique les **lignes** d'une mutation (`if (seen.has(id)) return`) et
retient la première ligne bâtie, avec la `valeur_fonciere` de la mutation **entière**.

Ma première hypothèse était qu'il fallait écarter toutes les ventes multi-lots. **Les données m'ont
donné tort** : 42 % des mutations sont des ventes avec dépendance (une maison et son garage), qui
sont le cas normal. L'acheteur paie l'ensemble, et la convention du marché rapporte ce prix à la
surface habitable. Écarter ces ventes ne garderait que 26 % du fichier, sur-représentant les biens
sans dépendance. La méthode de production est donc **conforme à la convention**, et c'est ma
« méthode stricte » qui biaisait.

Le vrai défaut est plus étroit : les mutations comprenant **plusieurs logements** (un immeuble, deux
appartements vendus ensemble). La production attribue alors le prix du tout à la surface du premier.

Mesuré sur le fichier national 2024 (1 148 336 ventes) :

- **10 % des ventes portent plusieurs logements.**
- Effet sur le prix médian communal, sur 10 297 couples (commune, type) :
  **médiane +0,76 %**, p90 **+9,7 %**, p99 **+30,7 %**.
- **20 % des couples sont surestimés de plus de 5 %.**

Négligeable en médiane, notable pour un cinquième des communes, sévère pour 1 %. Le correctif tient
en trois lignes : compter les locaux bâtis de la mutation, et l'écarter s'il y en a plus d'un.

*Deux fausses alertes, levées par vérification.* Le `split(",")` sans gestion des guillemets est sûr :
geo-dvf n'en contient aucun. Et l'Alsace-Moselle est déjà gérée.

#### Le second piège : les petits effectifs

Une médiane sur trois ventes n'est pas un prix. Avec un seuil de 20 ventes sur au moins un des deux
types de bien, la couverture atteint **98 % des lecteurs** (79 communes sur 114 de l'échantillon
pondéré par la population). Les appartements sont mal couverts hors des villes, les maisons le sont
bien. La production impose un seuil de 10 et se replie sur l'EPCI, ce qui traite le problème.

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
applique un seuil, et préfère le millésime le plus récent en ne cumulant que si nécessaire.
(Il écarte les ventes à plusieurs lots, y compris les dépendances : lecture plus stricte que la
production, retenue ici pour mesurer la couverture minimale.) Résultats sur 2024, puis 2024+2023+2022 :

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

### 5. Le Géoportail de l'urbanisme, à l'adresse ★★★

`apicarto.ign.fr/api/gpu/{zone-urba, assiette-sup-s, prescription-surf}?geom={Point}`

Le projet appelle déjà `apicarto.ign.fr/api/cadastre/parcelle` (`src/lib/cadastre.ts`) et **jamais**
`/gpu/*`. Or `cadastre.ts` obtient déjà la géométrie de la parcelle d'une adresse : le GPU peut donc
être interrogé sur la parcelle entière, pas seulement sur un point.

Ce qu'il rend, pour une adresse :

- **la zone du PLU** : `U` (urbain), `AU` (à urbaniser), `A` (agricole), `N` (naturel). Un terrain en
  A ou N n'est pas constructible. C'est la première question d'un acheteur de terrain, et futur•e ne
  la pose nulle part.
- **toutes les servitudes**, non la seule famille « sols pollués » de Géorisques : monuments
  historiques (`AC1`), sites patrimoniaux remarquables (`AC4`), sites classés (`AC2`), captages d'eau
  (`AS1`), risques (`PM1`, `PM3`), lignes électriques, voies ferrées.
- **les prescriptions** : espaces boisés classés, emplacements réservés.

Mesuré sur 10 adresses contrastées puis 40 communes :

| | |
|---|---|
| PLU versé au GPU | **85 %** des communes |
| au moins une servitude sur le point | 45 % |
| Strasbourg centre | **78 servitudes** (périmètres de monuments historiques) |
| Cap-Ferret | zone **N**, non constructible |

*Réserve de méthode : les 40 communes ont été interrogées sur leur centroïde géométrique, qui tombe
souvent en pleine campagne. Le taux de 45 % est donc plutôt une borne basse pour une vraie adresse.*

**Le lien que personne n'a fait.** Une adresse dans un périmètre `AC1` ou `AC4` est soumise à l'avis
de l'Architecte des Bâtiments de France. En pratique, **l'isolation par l'extérieur y est le plus
souvent refusée**. Or futur•e possède déjà une Face 1 « lecture thermique » et un module rénovation
(`renovation.ts`, `dpe.ts`) qui recommandent des travaux. Le produit conseille aujourd'hui des
travaux sans savoir si l'adresse a le droit de les faire.

### 6. L'IPS des collèges ★ (puissant et toxique)

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
| ~~Le prix~~ | DVF | **déjà en place** (module Logement, non-critère assumé) |
| **La sécurité** | base communale SSMSI | fichier annuel, `xlsx`, mis à jour le 2026-07-09 |
| **La qualité de l'école**, pas sa distance | IPS collèges | vérifié, toxique |
| **Le temps de trajet réel** | isochrone et itinéraire IGN | vérifié, sans clé |
| **Le coût récurrent** (taxe foncière, ordures) | `fiscalite-locale-des-particuliers` | incomplet, voir ci-dessous |

### Un indicateur inédit, à partir de deux sources déjà présentes

futur•e possède le prix d'achat (DVF) et le loyer (ANIL), tous deux dans l'index. Personne ne les
croise. Leur rapport donne le **nombre d'années de loyer nécessaires pour payer le prix d'achat**,
au mètre carré.

Sur 8 314 communes : médiane **17,7 ans**, p10 12,1, p90 23,8. Hirson 6,8 ans. Paris 18e 49,2 ans.
**Megève 85,5 ans.**

**Hypothèse testée, et réfutée.** J'ai avancé que cet indicateur mesurait la captation du logement
par des acheteurs extérieurs. Confronté à `data/residences-secondaires.json` (25 677 communes), il
n'en est rien : la corrélation de rang est de **‑0,152**, donc nulle et de signe contraire. Le
quartile où l'achat est le plus vite rentable compte *plus* de résidences secondaires (11,2 %) que
celui où il est le plus cher (5,3 %) : les villages en déprise ont beaucoup de résidences secondaires
et des prix bas.

**Ce que l'indicateur fait réellement.** Il détecte un extrême, avec une précision remarquable :

| | Résidences secondaires (médiane) | Part au-dessus de 40 % |
|---|---:|---:|
| centile supérieur | **58,5 %** | **73 %** |
| décile supérieur | 10,3 % | 23 % |
| tout le reste | 6,4 % | 4 % |

Megève 85,5 ans et 82,9 % de résidences secondaires. Saint-Tropez 71,3 ans et 68,3 %. La Clusaz
66,1 ans et 83,9 %.

Ce n'est donc pas un indicateur continu à afficher partout : c'est un **seuil**. Au-delà d'environ
cinquante années de loyer, le prix d'achat a décroché du loyer local, et trois communes sur quatre
sont des communes de résidences secondaires. Pour quelqu'un qui veut s'installer et travailler là,
c'est un fait décisif que le prix seul ne dit pas.

### Sur la Carte des loyers, une lecture à ne pas se tromper

Le champ `loypredm2` est un loyer **prédit** (registre « modélisé » de `doctrine/data.md`), assorti
d'un intervalle `lwr.IPm2` / `upr.IPm2` large : **51 % de la valeur en médiane**.

Cet intervalle est **plus large dans les grandes villes (68 %) que dans les petites (51 %)**. S'il
mesurait l'incertitude d'estimation, ce serait l'inverse (plus d'annonces, moins d'incertitude). Il
décrit donc la **dispersion des logements entre eux**, non la fiabilité du modèle. À dire au lecteur
comme tel (« votre loyer dépendra beaucoup du bien »), jamais comme une réserve sur la donnée.

Elle couvre **34 900 communes, 100 % de la population, Alsace-Moselle comprise**, là où DVF est
structurellement aveugle.

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

Les découvertes qui tiennent après vérification (servitudes, logements neufs, trajet réel) se lisent
**au grain adresse**. Cela confirme ce que les deux audits précédents avaient trouvé par un autre
chemin : la valeur non exploitée de futur•e est concentrée dans le module **Logement**, là où se
trouve déjà le moat, et non dans le module Territoire.

**La leçon de méthode est plus importante que l'inventaire.** J'ai annoncé le prix comme « le trou
béant » du produit après avoir lu `PREFERENCE_KEYS`, sans regarder l'index. Le prix y était, calculé
depuis DVF, avec repli EPCI, aux côtés des loyers de l'ANIL, et son exclusion des critères de
classement était une doctrine écrite en tête du script.

Trois fois dans ce balayage, la donnée a corrigé une conclusion que je croyais solide : le rayon
équivalent d'un isochrone ne mesurait pas ce que je croyais ; les ventes avec dépendance ne sont pas
un défaut mais la norme ; et le prix n'était pas absent. **Vérifier dans le code avant d'annoncer une
découverte** coûte cinq minutes et vaut plus que le balayage entier.

## Ce que je ne recommande pas de faire tout de suite

- **La délinquance et l'IPS** : forts, disponibles, et porteurs d'un dommage social que futur•e n'a
  pas vocation à produire. Ils exigent un arbitrage éditorial explicite, non une intégration.
- **La taxe foncière** tant que la base locative manque.
- **Le remplacement des distances par des isochrones** avant de mesurer ce que cela déplace : sept
  critères changeraient de valeur, donc tous les classements. C'est un chantier de vérité, pas un
  ajout, et il doit être mesuré avant d'être décidé.
