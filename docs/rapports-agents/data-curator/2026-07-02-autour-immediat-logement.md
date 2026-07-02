# Data Curator — Face 3 du module Logement : « l'autour immédiat » au grain adresse

> Question-mère : ces données méritent-elles d'entrer dans le système de décision de futur•e,
> et si oui comment les utiliser honnêtement, au bon grain ? Read-only. Je propose, je n'intègre
> ni ne décide.
> Date : 2026-07-02. Terrain lu : `_contexte-module-logement-2026-07-02.md` ; rapports du jour
> (product-strategist, design-critic, researcher — module Logement) ; `doctrine/data.md`,
> `inventaire-sources.md`, ADR-0001/0002. Code confronté : `scripts/populate-vie-locale.py`,
> `populate-calme-sonore.py`, `populate-nature.py`, `populate-bpe.py`,
> `src/app/api/georisques-logement/route.ts`, schéma `data/bpe24.parquet`.

---

## Le constat de départ (ce que le code dit vraiment)

J'ai ouvert le code avant de juger. Trois faits structurent tout le rapport :

1. **Rien n'est bufferisé autour de l'adresse aujourd'hui.** La route
   `georisques-logement/route.ts` assemble bien du point-natif (BAN, cadastre, DPE, ZFE au point,
   IREP « near point », Géorisques adresse/parcelle), mais **aucune verdure, aucun POI de marche,
   aucune nuisance de proximité**. L'« autour » n'existe pas dans le module.
2. **Les critères « autour » du comparateur sont tous au grain COMMUNE.** `vie_locale` = POI OSM
   agrégés par `densité/(pop+K)` puis percentile communal. `nature` (OSO) = raster 10 m agrégé en
   % communal. `calme_sonore` = distance **du chef-lieu** (lat/lon de l'index) à la source
   bruyante la plus proche. Ce sont des lectures **de la commune**, jamais **de l'adresse**.
3. **Mais les sources brutes sous ces critères SONT point-natives.** OSM POI, infra bruyante OSM
   (motorway/trunk + rail), et surtout **le parquet BPE24 en repo porte `LATITUDE`/`LONGITUDE`
   par équipement** (vérifié dans `populate-bpe.py`). La matière pour bufferiser à l'adresse est
   déjà là, en repo, sans API.

**Conséquence directe pour la Face 3 :** sa valeur n'est pas dans une nouvelle donnée, elle est
dans une **transformation nouvelle** (le buffer de marche autour du point géocodé) appliquée à des
sources déjà présentes. C'est exactement le moat ADR-0002 : `brut → pipeline → croisement → UX`,
pas la donnée brute. Et c'est là qu'est le seul vrai danger : **re-servir au grain fin ce que
Territoire/`/ou-vivre` disent déjà à la commune = cannibalisation pure.**

---

## LA LIGNE À GRAVER : « à votre porte » vs « dans la commune »

C'est l'arbitrage central du brief, tranché net :

- **« Dans la commune »** = `vie_locale`, `nature`, `calme_sonore`, `acces_ecoles`,
  `acces_transports`, `mobilite_quotidienne`. Agrégats communaux, déjà servis par le comparateur
  et par Territoire. **Interdits de recopie dans Logement.** Les afficher au grain commune sous
  Logement, c'est répéter Territoire en plus petit : zéro valeur, dette de doublon.
- **« À votre porte »** = ce qui se calcule dans un **rayon de marche autour du point géocodé**, et
  qui **contredit ou précise** la lecture communale. Une commune à `vie_locale` élevée peut cacher
  une adresse isolée en périphérie ; une commune « verte » peut poser un immeuble sur un carrefour
  minéral. **La Face 3 ne mérite d'exister que si elle bufferise au point.** Si elle réaffiche la
  commune, elle ne remplit qu'une fiche : REFUS de principe.

Règle de non-redondance, prête à graver : *Face 3 = le buffer de marche autour de l'adresse. Tout
ce qui reste au grain commune appartient à Territoire/`/ou-vivre` et n'entre pas dans Logement.*

Rappel anti-score (ADR-0001) : la Face 3 **liste et mesure des distances**, elle ne produit
**jamais** un « score d'aménité de quartier » composite. Pas de note d'ambiance en étoiles.

---

## Famille 1 — Verdure / espaces verts proches

### 1a. Espaces verts OSM (leisure=park, landuse=forest/grass/recreation_ground, natural=wood)
- **Source** : OpenStreetMap via Overpass. Déjà le socle technique de `vie_locale`/`calme_sonore`.
- **Grain natif** : point/polygon. Bufferisable à l'adresse.
- **Type** : communautaire (contributif).
- **Licence** : **ODbL** — attribution + **partage à l'identique**. Vigilance : c'est la source la
  plus contraignante du repo et la plus coûteuse à maintenir (structure mouvante), cf.
  `inventaire-sources.md` (OSM = opportuniste, maintenance élevée).
- **Couverture** : nationale mais **hétérogène**. Un parc non cartographié n'est pas un parc
  absent. Bonne en urbain dense, trouée en périurbain/rural.
- **Honnêteté du signal** : on peut dire « espace vert cartographié à ~X m de ce point » et
  « N espaces verts dans un rayon de marche ». On ne peut **pas** dire « pas de verdure » (absence
  OSM ≠ absence terrain), ni une surface végétale exacte. Distance à vol d'oiseau, pas à pied.
- **Doublon** : avec `nature` (OSO) — NON, grain opposé (part naturelle communale vs parc à ma
  porte). Avec `vie_locale` — NON (le parc n'y est pas compté comme lieu de sociabilité).
- **Criticité** : enrichissement.
- **Coût de maintenance** : élevé (ODbL + Overpass instable). Ce qu'on perd si OSM disparaît : le
  signal verdure-de-proximité, remplaçable par OCS GE (ci-dessous) à terme.
- **Verdict** : **INTÉGRER** en version minimale de la famille verdure — mais gaté par l'honnêteté
  de couverture (« cartographié », jamais « il n'y a pas »).

### 1b. OCS GE (occupation du sol grande échelle, IGN)
- **Source** : IGN, vecteur polygones couverture (CS) + usage (US), nomenclature riche (formations
  arborées, herbacées, sol nu, bâti, eau).
- **Grain natif** : polygon fin (seuil de collecte de l'ordre de 200 m² / 5 m). **Le vrai grain
  adresse** pour la couverture du sol : « à ce point, le sol est arboré / minéral / herbacé ».
- **Type** : mesurée (photo-interprétation).
- **Licence** : Licence Ouverte / Etalab (à reconfirmer sur la fiche à l'intégration).
- **Couverture** : **INCERTAINE — point de vigilance majeur.** Le déploiement national se fait
  département par département ; je n'ai pas pu confirmer une couverture métropolitaine 100 % au
  2026-07-02 (pages IGN en JS non lisibles via WebFetch). **À vérifier explicitement avant tout
  engagement** : une couverture partielle interdit une feature nationale honnête (34 000 communes).
- **Fraîcheur** : millésimes par lot départemental, hétérogènes.
- **Honnêteté** : donne la meilleure réponse à « verdure à ce point » (couverture réelle, pas
  contributive). Mais lourde à traiter (vecteur volumineux, jointure spatiale par polygone).
- **Doublon** : avec OSO `nature` — NON (grain adresse vs commune). Avec OSM parcs — recouvrement
  partiel, OCS GE est plus complet et non contributif ; à terme il **remplacerait** 1a.
- **Criticité** : enrichissement (candidate fondatrice de la Face 3 si couverture confirmée).
- **Coût de maintenance** : **élevé** (volume vecteur, millésimes départementaux à suivre).
- **Verdict** : **DIFFÉRER.** C'est la donnée « juste » pour la verdure au point, mais la couverture
  nationale non confirmée + le coût de traitement en font un mauvais premier geste pour un fondateur
  solo. OSM (1a) capture ~90 % de la valeur tout de suite ; OCS GE est le chantier de robustesse
  ultérieur.

### 1c. Canopée / couvert arboré national
- **Source candidate honnête** : Copernicus HRL Tree Cover Density (raster ~10 m, pan-européen donc
  France incluse, millésime ancien de l'ordre de 2018, licence Copernicus libre). Les cartes de
  canopée LiDAR fines existent **seulement pour certaines villes** (pas national). IGN LiDAR HD se
  déploie mais pas de « taux de canopée » national prêt-à-l'emploi consolidé.
- **Grain natif** : raster 10 m (Copernicus) → agrégeable en buffer, mais grossier à l'adresse.
- **Honnêteté** : on peut dire « densité arborée dans l'environnement du point » à ~10 m, pas
  « X % de canopée sur votre parcelle ». **REFUSER toute présentation d'un taux de canopée
  faux-précis à l'adresse.**
- **Doublon** : avec OCS GE (formations arborées) — oui partiellement ; OCS GE est plus fin.
- **Verdict** : **DIFFÉRER / REFUSER en l'état.** Pas de jeu national de canopée fine exploitable ;
  le Copernicus 2018 à 10 m n'ajoute pas assez sur OSM+OCS GE pour justifier un 3e raster. La
  verdure de proximité se dit honnêtement par « espace vert à X m » (OSM) et « couverture du sol »
  (OCS GE), pas par un « taux de canopée » qu'on n'a pas au grain adresse.

---

## Famille 2 — Ce qu'on a à portée de marche

### 2a. BPE24 (INSEE) au grain adresse — LE socle de la Face 3
- **Source** : BPE24 INSEE, déjà en repo (`data/bpe24.parquet`), **une ligne géolocalisée par
  équipement** (`TYPEQU`, `LATITUDE`, `LONGITUDE` — vérifié). Aujourd'hui agrégée à la commune pour
  `acces_ecoles`, `culture`, `vie_etudiante`, `services`.
- **Grain natif** : équipement = **point**. Le comparateur l'écrase en commune ; la Face 3 le
  garde au point.
- **Type** : déclarative/calculée (référentiel INSEE), mesurée dans sa localisation.
- **Licence** : Licence Ouverte. Fondatrice, maintenance faible (millésime annuel à rebuild).
- **Couverture** : nationale, propre, homogène — l'inverse d'OSM. C'est sa supériorité ici.
- **Honnêteté** : « à ~X m de ce point : une école, une boulangerie, une pharmacie, un arrêt ».
  Distance **à vol d'oiseau** — ne jamais convertir en « Y min à pied » sans réseau piéton (fausse
  précision). Dire « à proximité immédiate », pas un temps de marche calculé.
- **Doublon** : avec `vie_locale`/`acces_ecoles` du comparateur — **NON**, et c'est le point
  décisif : même donnée, **question opposée**. Le comparateur répond « la commune est-elle animée /
  équipée ? » ; la Face 3 répond « qu'ai-je, moi, à ma porte ? ». Une commune bien classée peut
  poser CETTE adresse à 25 min de tout. C'est la valeur ajoutée exacte du grain adresse.
- **Criticité** : **fondatrice de la Face 3.**
- **Coût de maintenance** : **faible** (déjà en repo, buffer haversine local, zéro API). Si BPE
  disparaissait : on perd le socle services, non substituable proprement (OSM est contributif).
- **Verdict** : **INTÉGRER.** Surface cible : Face 3 du rapport Logement. Angle : liste par
  catégorie dans un rayon de marche (~800–1000 m) autour du point géocodé, distance au plus proche
  de chaque catégorie utile (école, santé, commerces alimentaires, transport). **Jamais un score
  composite d'accessibilité** (ADR-0001) : une liste et des distances.

### 2b. OSM POI (commerces/services de proximité)
- **Source** : OSM (shop=*, amenity=*), déjà interrogé par `vie_locale`.
- **Grain** : point. **Licence ODbL** (attribution + partage à l'identique).
- **Honnêteté/couverture** : complète BPE sur des catégories fines (café, boulangerie précise) mais
  contributif et hétérogène.
- **Doublon** : recouvre BPE sur commerces ; BPE est le référentiel propre et sans ODbL.
- **Verdict** : **DIFFÉRER (opportuniste).** BPE d'abord. N'ajouter OSM que pour les catégories que
  BPE ne porte pas et si l'usage le réclame — au prix ODbL. Ne pas empiler deux sources qui
  racontent la même porte.

---

## Famille 3 — Nuisances proches

### 3a. Cartes de bruit stratégiques (directive 2002/49/CE)
- **Source** : CBS produites par préfectures/collectivités pour **agglomérations > 100 000 hab** et
  **grandes infrastructures** (routes > 3 M véh/an, voies ferrées > 30 000 trains/an, aéroports).
  Donne des niveaux en dB (Lden/Ln).
- **Grain natif** : zonage fin en dB — le seul vrai niveau sonore mesuré/modélisé.
- **Couverture** : **PARTIELLE et hétérogène** — agglos + grandes infra seulement, autorités
  compétentes multiples, formats/millésimes disparates, **pas de jeu national unifié exploitable**.
- **Doublon** : recoupe l'exposition infra OSM (3c) là où elle existe, en plus précis.
- **Verdict** : **REFUSER comme source nationale.** Couverture non nationale + coût d'intégration
  élevé (agrégation multi-autorités) = feature qui marcherait en métropole et mentirait par le vide
  ailleurs. Contraire à la couverture 34 000 communes assumée.

### 3b. Bruitparif
- **Couverture** : **Île-de-France uniquement.**
- **Verdict** : **REFUSER.** Un produit national ne peut pas porter une brique bruit qui n'existe
  qu'en IDF sans créer une inégalité de traitement malhonnête. Écarté pour la même raison que
  l'iuhi dept-normalisé et l'EAIP non national (victoires méthodologiques `inventaire-sources.md`).

### 3c. Distance à une infrastructure bruyante via OSM (autoroute/voie rapide + voie ferrée)
- **Source** : OSM `highway=motorway|trunk(+link)`, `railway=rail` filtré — **déjà la matière brute
  de `calme_sonore`**, mais aujourd'hui mesurée depuis le chef-lieu (grain commune).
- **Grain** : la Face 3 le calcule **depuis le point géocodé** : « votre adresse est à ~X m d'une
  autoroute / d'une voie ferrée ». C'est le grain adresse que `calme_sonore` ne donne pas.
- **Licence** : ODbL. Type : communautaire → proxy d'exposition, pas une mesure.
- **Honnêteté — la limite dure** : c'est une **proximité d'une source potentielle**, **jamais un
  niveau sonore en dB**. Seules les CBS donnent des dB, et pas partout. Interdiction stricte de
  chiffrer un bruit. Formulation juste : « proximité d'un axe potentiellement bruyant », gaté.
- **Doublon** : avec `calme_sonore` — NON (adresse vs chef-lieu ; l'un précise l'autre, cf. la
  fonction « discipline de preuve » du grain fin, invariant n°3).
- **Criticité** : enrichissement.
- **Coût de maintenance** : moyen (OSM/Overpass ; la requête existe déjà).
- **Verdict** : **INTÉGRER** — seul volet nuisances honnête au grain national. Version minimale =
  réutiliser la requête infra de `calme_sonore`, bufferiser au point, restituer en distance/prose
  conditionnelle sans dB.

---

## Verdict d'ensemble : la Face 3 crée-t-elle une vraie valeur ?

**OUI, à une condition stricte : qu'elle reste le buffer de marche autour de l'adresse.** Sa valeur
n'est pas d'ajouter des données (elles existent), c'est de répondre à une question que ni Territoire
ni `/ou-vivre` ne peuvent poser : **« qu'y a-t-il, à MA porte, que la moyenne communale masque ? »**
Le grain adresse est précisément ce qui distingue Logement de Territoire (product-strategist,
design-critic le disent aussi). Dès qu'elle réaffiche un agrégat communal, elle cannibalise.

Ordre de priorité :
1. **BPE24 au point** (2a) — INTÉGRER, socle, coût faible, en repo.
2. **Espaces verts OSM** (1a) — INTÉGRER, gaté « cartographié ».
3. **Distance infra bruyante OSM** (3c) — INTÉGRER, proxy sans dB.
4. **OCS GE** (1b) — DIFFÉRER (couverture à confirmer, coût élevé).
5. **Canopée** (1c), **OSM POI** (2b) — DIFFÉRER/REFUSER (redondance ou pas de gain net).
6. **CBS bruit** (3a), **Bruitparif** (3b) — REFUSER (couverture non nationale).

---

## Version minimale (~90 % de la valeur, le plus petit geste)

Une **Face 3 « à votre porte »** construite **uniquement sur des sources déjà en repo, sans nouvelle
API** :
- **BPE24** bufferisé à ~800–1000 m autour du point géocodé (buffer haversine local sur le parquet) :
  distance au plus proche par catégorie utile + présence dans le rayon ;
- **infra bruyante OSM** (requête `calme_sonore` déjà écrite) recalculée depuis l'adresse : distance
  au plus proche axe/voie ferrée, en prose conditionnelle sans dB ;
- **espaces verts OSM** : présence/distance du plus proche, « cartographié ».

Restitution en **liste + distances, jamais un score**. Attribution visible : « INSEE (BPE) »,
« OpenStreetMap (ODbL) ». La verdure fine (OCS GE) et tout dB de bruit sont explicitement hors de
cette version minimale. Le design détaillé de la surface revient au Design Critic / orchestrateur ;
je borne au périmètre-donnée.

---

## Cohérence et tensions (posées, non tranchées)

- **Granularité (`doctrine/data.md`)** : la Face 3 est le seul endroit du produit où l'on parle
  légitimement « à l'adresse ». Discipline obligatoire : distances **à vol d'oiseau** (« à ~X m »),
  jamais un temps de marche ni un niveau sonore ; « espace vert cartographié », jamais « pas de
  verdure ». À chaque affirmation, la question de contrôle : à quelle échelle est-ce vrai ? Ici :
  au point, pour ce que la source couvre.
- **ADR-0001 (pas de score)** : risque réel qu'un designer veuille un « indice de qualité de
  quartier » agrégeant verdure + services + bruit. À refuser d'avance : liste et distances, pas de
  note. Je le signale, le porteur tranche.
- **ODbL (OSM)** : deux des trois briques minimales sont ODbL (attribution + partage à l'identique).
  Contrainte à assumer explicitement ; BPE (Licence Ouverte) reste le socle non contraint.
- **Tension avec le Researcher** : ses pistes fortes (loyer du risque, DPE-dette, RGA sensible)
  portent la vulnérabilité/valeur du bien, pas l'« autour ». La Face 3 est une **famille distincte**
  et modeste ; ne pas la laisser gonfler pour concurrencer le cœur décisionnel du module.
- **Tension avec Product/Business** : la tentation de re-loger dans Logement les critères
  d'aménité déjà servis ailleurs (pour « enrichir la fiche »). C'est exactement le catalogue que je
  refuse. La Face 3 se justifie par le buffer, pas par l'addition.

---

## Mise à jour de l'inventaire (prêt à écrire par Claude principal)

**Nouvelles victoires méthodologiques** pour `inventaire-sources.md` :

| Source | Décision | Pourquoi | Gain |
|---|---|---|---|
| **Cartes de bruit stratégiques (dir. 2002/49) + Bruitparif** | refusées | couverture non nationale (agglos >100k / grandes infra ; Bruitparif = IDF), autorités/millésimes hétérogènes, pas de jeu national unifié ; un dB partout est impossible honnêtement | évite une brique bruit qui mentirait par le vide hors métropole (même famille de refus que iuhi/EAIP non nationaux) |
| **Canopée nationale au grain adresse** | différée/refusée | pas de jeu national de canopée fine ; Copernicus TCD 10 m (2018) trop grossier et redondant avec OCS GE ; « taux de canopée à la parcelle » = fausse précision | évite un 3e raster et un chiffre faux-précis ; la verdure se dit par « espace vert à X m » + couverture du sol |
| **OCS GE (IGN) pour la verdure au point** | différée | donnée « juste » (polygon fin, non contributif) mais couverture nationale non confirmée au 2026-07-02 + coût vecteur élevé pour solo | garde la porte ouverte à la robustesse ultérieure sans bloquer la Face 3 minimale (OSM capture ~90 %) |

**Nouvelle ligne d'usage (transformation, pas source neuve)** : *BPE24 + infra OSM + espaces verts
OSM, bufferisés au point géocodé* = **Face 3 Logement « à votre porte »**, criticité
enrichissement, distincte des critères communaux `vie_locale`/`nature`/`calme_sonore`/`acces_*` du
comparateur. Doctrine de non-redondance à graver : *le grain adresse (buffer de marche) appartient à
Logement ; le grain commune appartient à Territoire/`/ou-vivre`.*

À relier dans `modules/logement.md` (dont product-strategist propose la création) : axe distinctif =
seul module à l'adresse ; la Face 3 en est l'incarnation « autour ».

---

## Quand rouvrir ce sujet

- **OCS GE** : le jour où IGN confirme la couverture métropolitaine complète et un pipeline de
  jointure spatiale soutenable → rouvrir pour remplacer/compléter la verdure OSM (source non
  contributive, plus robuste).
- **Bruit** : si un jour un **jeu national CBS consolidé** (agrégation COVADIS/état) devient
  disponible, ou si le pivot se resserre sur les grandes agglos où les CBS existent → le proxy OSM
  (3c) pourrait céder la place à un vrai niveau dB, avec source. Tant que la couverture est
  partielle, on reste au proxy honnête.
- **Usage** : si la mesure d'usage montre que les entrants tapent surtout des adresses **urbaines
  denses** (où OSM/CBS sont riches), la contrainte de couverture nationale se desserre et OCS
  GE/CBS remontent en priorité. Si au contraire l'usage est diffus (périurbain/rural), rester sur
  BPE (le seul homogène) est confirmé.
- **Canopée** : si IGN publie un taux de canopée national dérivé du LiDAR HD au grain fin →
  rouvrir 1c, ce serait alors un signal verdure de première qualité.
- **Cannibalisation** : si un audit constate que la Face 3 réaffiche des agrégats communaux (au lieu
  de bufferiser au point), la rouvrir pour la ramener à sa seule justification — le grain adresse —
  ou la supprimer.

---

## Rappel de statut

Je n'ai rien intégré. J'ai confronté les sources au code réel et à la doctrine de granularité. Les
décisions structurantes (créer `modules/logement.md`, arbitrer la surface, gérer l'ODbL en
production, confirmer la licence/couverture OCS GE par écrit) reviennent au porteur/board. Mon avis
est daté du 2026-07-02 et porte ses conditions de réouverture ci-dessus.
