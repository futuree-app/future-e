# Data Curator — Face « Autour » du module Logement : filtres + carte des points

Date : 2026-07-09
Agent : Data Curator (read-only)
Sujet : faisabilité et honnêteté DATA d'un passage LISTE → filtres de catégories + carte
interactive des points autour de l'adresse (rapport `/rapport/logement`, grain adresse).
Cadrage AVANT le spike technique. Aucune décision : rapport d'évaluation.

---

## Ce que j'ai réellement inspecté (code, pas doc)

- `src/components/report/logement/AutourSection.tsx` — le rendu actuel de la Face 3 : une
  LISTE (5 familles BPE : plus proche par catégorie + distance ; 1 espace vert OSM). Zéro carte.
- `src/lib/logement-autour-types.ts` — le contrat du snapshot figé (`Face3Snapshot`). **Point
  décisif : le snapshot ne stocke QUE des distances, pas les coordonnées des points.**
  `bpe.categories` = `BpeNearest[]` = `{category, nearest:{distanceMeters, typeLabel}, cap}`.
  L'`osm` = `{nearestMappedGreenSpace:{distanceMeters, kind}, potentiallyNoisyInfrastructure[]}`.
  Le `center: LngLat` (coordonnées exactes de l'adresse) EST stocké.
- `src/lib/logement-bpe.ts` — `nearestByCategory` réduit tous les points à un seul (le plus
  proche) par famille. La matière point-par-point est jetée après calcul de la distance.
- `scripts/populate-bpe.py` (`write_face3_shards`) — les shards `data/bpe-points/*.json`
  contiennent bien `{c, t, lat, lon}` par équipement (2222 cellules / 283k équip.), lat/lon
  arrondis 6 décimales. **Mais seules 3 colonnes du parquet sont lues : `TYPEQU`, `LATITUDE`,
  `LONGITUDE`.** La colonne `QUALITE_XY` (qualité de géocodage BPE) n'est PAS retenue.
- `src/lib/logement-osm.ts` + `supabase/18_osm_tile_cache.sql` — les GÉOMÉTRIES OSM complètes
  (polylignes/polygones, `OsmGeom.pts[]`) SONT persistées dans `osm_tile_cache.geometries`
  (jsonb) par cellule. Seule la distance au plus proche est ensuite recopiée dans le snapshot.
  Requête Overpass limitée à : motorway/trunk + railway=rail + park/wood/forest/grass/
  recreation_ground. Rien d'autre (pas de commerces, pas d'arrêts de bus/tram).
- `package.json` — **AUCUNE librairie cartographique** (pas de leaflet / maplibre / mapbox /
  react-map-gl / openlayers). La carte serait une dépendance neuve + un fond de carte neuf.
- `docs/vault/doctrine/data.md` (granularité, confidentialité), `modules/logement.md`,
  `recherches/inventaire-sources.md`, la mémoire `project_module_logement.md` et
  `project_comparateur_relation_spatiale.md` (carte-localisatrice écartée).

---

## Q1 — Quelles données pour afficher des POINTS autour d'une adresse

**Ce qu'on a DÉJÀ (point-natif, en repo, sans API) :**
- **BPE 2024 géolocalisé** : lat/lon par équipement dans `data/bpe-points`. Réel et exploitable.
  MAIS deux réserves lourdes :
  1. **Périmètre étroit assumé : 15 codes TYPEQU sur 5 familles** (médecin, pharmacie,
     supermarché/supérette/épicerie/boucherie/boulangerie/primeur, 3 écoles, gares, banque,
     poste). C'est un CHOIX produit pour « le plus proche par famille ». Projeté sur une carte
     comme « les points autour », ça affiche un territoire faussement vide : ni collège/lycée,
     ni médecin spécialiste, ni pharmacie de garde, ni la moitié du commerce réel.
  2. **La qualité de géocodage n'est pas retenue.** Le parquet BPE porte `QUALITE_XY`
     (Bonne / Acceptable / Mauvaise / centroïde commune / mairie). Le shard ne garde que
     lat/lon bruts. Aujourd'hui c'est sans conséquence (on ne montre qu'une distance molle) ;
     un PIN posé à des coordonnées potentiellement approximatives est une **affirmation de
     précision qu'on ne peut pas tenir**.
- **Espaces verts OSM** : polygones réels (park/wood/forest/grass/recreation_ground),
  géométries entières déjà en cache `osm_tile_cache`. Une empreinte verte dessinée serait la
  partie la plus honnête d'une carte (une surface, pas un point-affirmation).

**Ce qu'il faudrait AJOUTER pour une carte « riche » :**
- **Le snapshot ne contient pas les points.** Pour dessiner, il faut soit changer le contrat
  `Face3Snapshot` (stocker la liste des points/géométries, pas seulement les distances), soit
  relire les shards + le cache OSM au rendu. Ce n'est pas « on a déjà les points » côté
  affichage : côté snapshot figé, la donnée a été volontairement réduite.
- **Transports** : seulement les gares (E107-109). Les arrêts bus/tram/métro vivent dans le
  critère `mobilite_quotidienne` au grain COMMUNE (OSM), pas dans Logement. Les remonter au
  point = un nouveau chantier OSM (et frontière : la mobilité part au futur module Mobilité).
- **Commerces génériques** (au-delà des 8 codes BPE alimentation) = ré-ouvrir les POI OSM, que
  le rapport Data Curator du 2026-07-02 avait DIFFÉRÉS (BPE d'abord). Les remettre réimporte
  les biais tourisme/frontière de `vie_locale`.

**Conclusion Q1 :** on a la matière pour une carte MINCE et honnête (verts en surface + les
15 équipements BPE en points, avec réserve de précision). On n'a PAS la matière pour la carte
« tout ce qu'il y a autour » que le mot « carte » fait spontanément promettre.

---

## Q2 — Le fond de carte (le vrai enjeu carto)

**OSM tiles publiques (`tile.openstreetmap.org`) : à écarter pour un produit payant.** La
politique OSMF (vérifiée 2026-07-09) : pas de heavy use, accès révocable sans préavis
(« you may no longer be able to serve your paying customers »), User-Agent identifiant, cache
local ≥ 7 jours, attribution obligatoire. Un produit commercial ne doit pas taper le serveur
communautaire. Options conformes : self-host, provider tiers (MapTiler / Stadia / Protomaps),
ou tuiles vectorielles.

**IGN Géoplateforme (`data.geopf.fr`, ex-Géoservices) : la bonne piste FR.** Les couches
« essentielles » (plan IGN v2, ortho) sont diffusées en WMTS/TMS/WMS, gratuites et sans clé
d'accès, sous **licence ouverte Etalab 2.0** (attribution « IGN » / « IGN-F/Géoplateforme »).
Des **limites d'usage par flux** existent (débit par IP) : à respecter, mais alignées avec un
usage raisonnable. **Le WMS GetMap renvoie une image PNG d'une bbox** — exactement ce qu'il
faut pour un snapshot.

**Le point le plus important, et il tranche : figer une IMAGE, pas servir des tuiles live.**
L'architecture Face 3 est DÉJÀ « snapshot figé » (OSM récupéré à la génération, mis en cache
par cellule, gelé dans un JSON ; l'affichage ne touche jamais Overpass). Une carte **live
interactive romprait ce principe** : elle rappellerait un service tiers à chaque affichage
(quota, latence, panne, révocation OSM), pour un artefact censé être stable et daté.
**La forme cohérente avec la doctrine du module = un PNG statique gelé au moment de la
génération** (IGN GetMap sur la bbox du buffer + les points/polygones dessinés par-dessus,
ou même un rendu côté serveur). Zéro dépendance carto au runtime, zéro quota à l'affichage,
attribution IGN + OSM incrustée une fois. C'est le « snapshot figé » appliqué à l'image.

Le « interactif » (zoom/pan/clic) est précisément ce qui force le live et casse le snapshot.
C'est un choix UX (hors ma lentille) MAIS il a un coût DATA/archi réel que le porteur doit
peser : interactif ⇒ live ⇒ dépendance + quota + non-reproductibilité de l'artefact.

---

## Q3 — Honnêteté du signal : ce qu'une carte de points peut faire croire de faux

C'est ici que je dis le plus fort NON. Une carte transforme des réserves gérables en liste en
affirmations visuelles difficiles à nuancer.

1. **L'absence lue comme un fait (le risque n°1).** Dans la liste, « Aucun recensé dans les
   3 km analysés » est une phrase honnête et bordée. Sur une carte, un quartier sans pin se lit
   « il n'y a rien ici » — alors que c'est « BPE ne connaît que 15 types » ou « OSM n'a pas
   cartographié cette zone ». L'espace vide d'une carte est une affirmation, et c'est une
   fausse affirmation. Cf. la doctrine `data.md` (« ne jamais surpromettre ») et le principe
   `signature_identitaire` (donnée vraie mais trompeuse).
2. **Fausse précision des pins.** Un pin dit « c'est exactement là ». Le géocodage BPE
   (`QUALITE_XY`) est inégal et n'est même pas conservé dans nos shards. Une distance molle
   (« env. 200 m ») absorbe l'imprécision ; un point posé au mètre ne l'absorbe pas. Poser des
   pins sans porter la qualité de géocodage = fausse granularité (`data.md`, règle 1).
3. **Couverture rural/urbain très inégale (OSM).** En ville OSM est dense, en rural clairsemé.
   Une carte rurale « vide » ferait croire à un désert d'aménités là où c'est un désert de
   contribution OSM. La liste + « cartographié » (retiré du texte mais porté par le footer
   ODbL) gère mieux cette nuance qu'une carte.
4. **Fraîcheur mixte, invisible sur une carte.** BPE = millésime 2024 ; OSM = date de gel du
   snapshot. Une carte unifie visuellement deux fraîcheurs et deux natures (mesuré administratif
   vs contributif) sous une même esthétique de pins — exactement l'erreur que `data.md`
   interdit (« faire croire que des granularités sont équivalentes »).
5. **Rappel du précédent comparateur.** La carte-localisatrice a été écartée comme « donnée
   vraie mais inerte » (`project_comparateur_relation_spatiale`). Ici le contexte diffère (la
   carte serait analytique, pas localisatrice), mais le garde-fou survivant s'applique :
   **illustrative jamais analytique, illustre une phrase, ne vole pas la vedette, jamais le
   cheval de Troie vers l'interactif.**

**Tension confidentialité à signaler (hors lentille pure, mais c'est dans `data.md`).**
`data.md` §Confidentialité : « futur•e ne stocke jamais l'adresse exacte ». Le module Logement
stocke déjà `center: LngLat` + `address_label` + lat/lon (table `logement`, migration 22). Une
carte CENTRÉE sur l'adresse exacte rend cette coordonnée encore plus load-bearing et publiée à
l'écran. Ce n'est pas moi qui tranche, mais la doctrine `data.md` mérite d'être mise à jour ou
explicitement dérogée pour le module Logement (elle parle de la table `accounts` ; le réel a
évolué). À poser à l'humain.

---

## Q4 — Verdict

**Deux objets distincts, deux verdicts. Ne pas les confondre.**

### (A) Filtres de catégories sur la LISTE existante — INTÉGRER (surface : Face 3, liste)
Les 5 familles BPE sont des filtres honnêtes et déjà nommés. Laisser le lecteur masquer/montrer
Santé / Alimentation / Éducation / Transports / Services est une transformation UX légère, sans
donnée neuve, sans fond de carte, sans rupture du snapshot. C'est le « ~90 % de la valeur »
que le porteur cherche (choisir ce qu'on regarde) sans le coût ni le risque de la carte.
Angle honnête : filtre = confort de lecture, PAS un score ni un classement (ADR-0001).

### (B) Carte interactive live des points — REFUSER en l'état / DIFFÉRER une version figée
- **REFUSER la carte INTERACTIVE LIVE** : elle rompt le snapshot figé (doctrine du module),
  crée une dépendance carto neuve + un quota au runtime (OSM interdit en commercial, IGN limité),
  et surtout elle transforme trois réserves gérables (absence, précision, couverture) en
  affirmations visuelles fausses. Le coût (dépendance + archi + risque d'honnêteté) dépasse la
  valeur pour un artefact qui doit rester stable et auditable.
- **DIFFÉRER une carte STATIQUE FIGÉE, illustrative**, conditionnée à trois pré-requis DATA
  non négociables avant tout spike UX :
  1. Conserver `QUALITE_XY` dans les shards BPE et n'afficher en pin QUE les points de bon
     géocodage (les autres restent en liste-distance). Sans ça, pas de pin.
  2. Traiter l'absence explicitement à l'écran (« BPE ne recense que ces familles » +
     « couverture OSM non exhaustive ») pour que le vide ne mente pas.
  3. Fond IGN Géoplateforme en PNG figé (GetMap) au moment de la génération, gelé dans le
     snapshot comme le reste, attribution IGN (Etalab 2.0) + © OpenStreetMap (ODbL) incrustée.
  La carte, si elle vient, illustre la liste, ne la remplace pas, et n'est jamais interactive
  au sens live.

Note de périmètre : le choix interactif-vs-figé et le design de l'écran ne sont PAS ma
décision (orchestrateur / Design Critic). Ma sortie borne la FAISABILITÉ et l'HONNÊTETÉ data :
la donnée autorise une carte MINCE et FIGÉE ; elle n'autorise pas la carte « riche et live »
que le mot promet.

---

## Version minimale (~90 % de la valeur)

**Des filtres de catégories sur la liste actuelle (A), zéro carte, zéro fond, zéro dépendance.**
Le besoin réel du porteur (« choisir ce qu'on regarde autour ») est satisfait par le toggle des
5 familles BPE + l'espace vert. C'est livrable sans toucher au snapshot, sans spike carto, et
sans aucun des cinq pièges d'honnêteté. La carte est un ajout séparé, à évaluer sur ses propres
mérites une fois les 3 pré-requis DATA remplis.

---

## Si la carte est refusée/différée — victoire méthodologique à graver dans inventaire-sources.md

> **Carte interactive « autour de l'adresse » — figée-illustrative seulement, jamais live.**
> Décision (2026-07-09) : on n'ajoute pas de carte interactive live des points autour de
> l'adresse. Raison : (1) l'espace vide d'une carte se lit comme « il n'y a rien » alors que
> BPE ne connaît que 15 types d'équipements et qu'OSM n'est pas exhaustif — l'absence
> deviendrait une fausse affirmation ; (2) un pin affirme une précision au mètre que le
> géocodage BPE (`QUALITE_XY`, non conservé dans nos shards) ne garantit pas ; (3) une carte
> live rappelle un fond de carte tiers à chaque affichage (OSM tiles interdites en commercial,
> IGN Géoplateforme limité en débit), ce qui rompt le principe « snapshot figé » du module.
> Dette évitée : une dépendance carto au runtime, un quota à l'affichage, un artefact non
> reproductible, et des affirmations visuelles non défendables. Ce qui reste possible : des
> filtres de catégories sur la liste (honnête, sans donnée neuve) ; et, sous conditions, une
> IMAGE de carte FIGÉE à la génération (fond IGN Etalab 2.0 + points de bon géocodage
> seulement + absence traitée explicitement + attribution IGN & OSM), illustrative jamais
> analytique.

---

## Cohérence doctrinale (tensions posées, non tranchées)

- **`data.md` règle 1 (ne jamais surpromettre la précision)** : les pins BPE sans `QUALITE_XY`
  sont en tension frontale. Pré-requis, pas option.
- **`data.md` §Confidentialité** : « ne stocke jamais l'adresse exacte » vs le réel (Logement
  stocke lat/lon depuis migration 22). Une carte centrée sur l'adresse aggrave l'écart. La
  doctrine doit être mise à jour/dérogée explicitement pour Logement, ou l'affichage recadré.
  À trancher par l'humain.
- **ADR-0001 (pas de score)** : un filtre est neutre ; veiller à ce que la carte ne devienne
  pas une heatmap/densité qui recréerait un score visuel.
- **ADR-0002 (le moat = la transformation)** : le buffer au point est déjà la transformation.
  Une carte n'ajoute pas de moat data ; elle ajoute de la surface UX. Ne pas la justifier comme
  « nouvelle donnée » (elle n'en est pas une).
- **Précédent comparateur** : garde-fous survivants (illustrative, non autonome, jamais cheval
  de Troie vers l'interactif) applicables tels quels.

---

## Mise à jour de l'inventaire (prêt à écrire par Claude principal)

- Pas de nouvelle SOURCE : BPE et OSM sont déjà inventoriés. Ajout d'une entrée FOND DE CARTE
  si la carte figée est retenue : « IGN Géoplateforme (plan IGN v2, WMS/WMTS) — fond de carte,
  Etalab 2.0, gratuit sans clé, limites de débit par flux, attribution IGN ; usage = image
  figée au snapshot, jamais tuiles live ». Criticité : opportuniste (enrichissement UX).
- Ajouter la victoire méthodologique ci-dessus à la section dédiée.
- Noter le pré-requis technique : conserver `QUALITE_XY` dans `populate-bpe.py`
  (`write_face3_shards`) si des pins BPE sont un jour affichés.

---

## Quand rouvrir ce sujet

- **Rouvrir la carte figée** si : (a) `QUALITE_XY` est ajouté aux shards ET une part
  majoritaire des équipements est en géocodage « Bonne » ; (b) le PostHog acheteur/résident
  montre que les lecteurs cherchent activement la position relative (pas juste la distance) —
  signal d'un vrai besoin spatial, pas d'un réflexe « il faut une carte » ; (c) un fond IGN
  figé est prototypé et l'attribution double (IGN + OSM) tient dans la DA.
- **Rouvrir les commerces/transports OSM au point** si le module Mobilité (à venir) a besoin
  d'arrêts géolocalisés — mais alors c'est SON grain, pas Logement.
- **Refermer définitivement l'interactif live** tant que l'architecture du module reste
  « snapshot figé » : un changement de cette doctrine serait le seul déclencheur.
- **Réviser la tension confidentialité** dès que `data.md` est mis à jour sur le stockage
  lat/lon du module Logement (à faire indépendamment de la carte).
