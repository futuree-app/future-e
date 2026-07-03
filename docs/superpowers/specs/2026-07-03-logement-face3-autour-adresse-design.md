# Face 3 du module Logement — « Autour de cette adresse » — Design

**Date** : 2026-07-03
**Statut** : design validé (brainstorming porteur), prêt pour le plan.
**Terrain** : `docs/vault/modules/logement.md`, `docs/rapports-agents/data-curator/2026-07-02-autour-immediat-logement.md`, `/memory/project_module_logement.md`, `supabase/16_report_context.sql`, `scripts/populate-bpe.py`, `src/app/api/georisques-logement/route.ts`, `src/components/report/LogementModule.tsx`.

---

## 1. Objet et cadrage

La Face 3 est l'incarnation « autour » du seul module au grain adresse. Elle **ne répond pas**
« ce logement est-il bien situé ? » (jugement de quartier, ce serait un score déguisé et de la
cannibalisation de Territoire). Elle répond, honnêtement :

> **Quels équipements, espaces cartographiés et infrastructures se trouvent autour de cette
> adresse, et à quelle distance approximative (à vol d'oiseau) ?**

C'est une **preuve spatiale locale**, pas une note de qualité de vie. Sa valeur n'est pas une
donnée neuve (les sources existent) mais une **transformation nouvelle** (ADR-0002) : le buffer de
marche autour du point géocodé, qui **précise ou contredit** la lecture communale. Une commune bien
équipée peut poser CETTE adresse à 1,5 km de tout ; une commune peu dense peut avoir une adresse
très bien placée.

### Ligne à tenir (anti-cannibalisation)

- **« Dans la commune »** (`vie_locale`, `nature`, `calme_sonore`, `acces_*`) = agrégats communaux,
  servis par Territoire / `/ou-vivre`. **Interdits de recopie dans Logement.**
- **« À votre porte »** = ce qui se calcule au point géocodé. La Face 3 ne mérite d'exister que si
  elle bufferise au point. Si elle réaffiche un agrégat commune, on la supprime.

### Invariants de langage (quasi ADR)

- Distance **à vol d'oiseau**, jamais un temps de marche (« à ~X m », jamais « Y min à pied »).
- **Aucun score** composite ni note d'ambiance (ADR-0001) : une liste et des distances.
- Bruit : « axe **potentiellement** bruyant / cartographié », **jamais un dB**, jamais « aucun risque
  de bruit ».
- Verts : « espace vert **cartographié** le plus proche », jamais « pas de verdure » (absence OSM ≠
  absence terrain).
- Une panne de source n'est **jamais** présentée comme une absence de donnée (voir `source_status`).
- **Aucun adjectif de proximité générique en v1** (pas de « proche = 500 m ») : la distance brute
  parle. Les catégories éditoriales « immédiat / proche / plus éloigné » viendront plus tard, avec
  des seuils **par famille** d'équipement, après observation des usages.

### Hiérarchie des trois briques (poids éditorial inégal)

1. **Vie quotidienne autour du logement** — BPE, socle principal.
2. **Infrastructures potentiellement bruyantes** — point de vigilance.
3. **Espaces verts cartographiés** — repère complémentaire.

Les deux briques OSM sont des **indices spatiaux**, pas une évaluation du calme ou du cadre de vie.

---

## 2. Le logement comme artefact sauvegardé

Aujourd'hui l'analyse Logement est **éphémère** (composant client, state React, rien de persisté).
On la rend **persistante** : l'adresse et son environnement calculé deviennent un objet sauvegardé,
rattaché à l'utilisateur et à la commune, réutilisé par le rapport Résidence.

### Modèle

Un **logement** n'est pas un champ universel du profil (un utilisateur peut avoir sa résidence à
Bordeaux, un bien visé à Lorient, etc.). C'est un objet rattaché à `(utilisateur, commune)`, sur le
patron exact de `report_context` (`supabase/16_report_context.sql`).

Hiérarchie (déjà portée par les clés existantes, pas de nouvel objet « projet ») :

```
utilisateur
  └── (commune = insee)                 ← report_context, report_grants, logement
        └── logement
              ├── adresse normalisée + point géocodé + parcelle
              ├── posture (residence | prospection)
              └── snapshot de proximité (Face 3, gelé)
```

### Table `logement` (nouvelle migration `17_logement.sql`)

```sql
create table if not exists public.logement (
  user_id       uuid not null references auth.users (id) on delete cascade,
  insee         text not null,
  address_label text not null,
  latitude      double precision not null,
  longitude     double precision not null,
  parcel_code   text,
  posture       text not null default 'residence'
    check (posture in ('residence', 'prospection')),
  snapshot        jsonb,          -- résultat Face 3 gelé (cf. §4)
  source_status   jsonb,          -- { bpe, osmInfrastructure, osmGreenSpaces }
  sources_version text,           -- version des calculs/sources ayant produit le snapshot
  computed_at     timestamptz,
  updated_at      timestamptz not null default now(),
  primary key (user_id, insee)
);
-- index user_id + RLS select/insert/update own (copier report_context).
```

- **posture** est alimentée par la sonde existante `ProjectProbe` (« j'y vis » → `residence`,
  « j'envisage d'acheter » → `prospection`), désormais **persistée**. Elle mappe sur
  `report_context.relation` (`current_residence` / `considering_living`).
- **Un logement par (user, commune)** en v1. Plusieurs adresses dans une même commune (comparer deux
  annonces) = extension future (ajouter une colonne `id` à la clé).
- **Invalidation du snapshot** (le recalcul est déclenché) quand : l'adresse change, le géocodage
  change, l'utilisateur demande une actualisation explicite, ou `sources_version` est bumpée.

---

## 3. Architecture des données : cache de tuile + snapshot d'adresse

Principe directeur (tranché avec le porteur) : **du live pour constituer la donnée, jamais du live
pour afficher le rapport.**

### Couche 1 — `osm_tile_cache` (partagée, technique)

Géométries OSM brutes mutualisées par **tuile spatiale fixe**, réutilisables par toutes les adresses
voisines. Le tuilage se justifie par la **réutilisation de cache** (l'adresse exacte part déjà à la
BAN / cadastre / DPE / IREP dans le même flux ; ce n'est pas un gain de confidentialité).

```sql
create table if not exists public.osm_tile_cache (
  tile_key       text primary key,     -- ex. quadkey / "z13/x/y" couvrant le point + marge
  geometries     jsonb not null,       -- axes motorway/trunk, rail, espaces verts (points/lignes/polys simplifiés)
  query_version  text not null,        -- version de la requête Overpass (invalide le cache si la requête change)
  status         text not null,        -- 'complete' | 'failed'
  fetched_at     timestamptz not null default now()
);
```

- **Écrit en service-role** (partagé entre utilisateurs), lu par tous les authentifiés.
- **TTL long** (routes / rail / parcs bougent très peu). Rafraîchissement paresseux après expiration.
- La bbox interrogée = emprise de la tuile **+ marge** (≥ 1,5 km autour de n'importe quel point de la
  tuile), pour que le plus proche soit toujours dans l'emprise récupérée.

### Couche 2 — snapshot d'adresse (sur la ligne `logement`)

Le calcul exact depuis le point géocodé (distances haversine), **gelé**, tracé (sources + dates).
**C'est ce que le rapport lit.** Il ne contacte jamais Overpass à l'affichage.

Bénéfices : rapport stable et déterministe, tests déterministes, traçabilité, régénération possible,
mesure réelle du taux d'échec.

### Quand passer aux shards OSM nationaux (approche « B », différée)

Décision **mesurable** plus tard, si on observe : taux d'échec persistant après retries, latence de
génération trop haute, volume de rapports saturant Overpass, majorité du territoire déjà en cache, ou
besoin de repro complète hors-ligne. À ce moment-là, le modèle de données / les règles de calcul /
les catégories / le rendu / les mesures existent déjà : **seule l'alimentation du snapshot change.**

---

## 4. Contenu du snapshot Face 3

```ts
type Face3Snapshot = {
  center: { latitude: number; longitude: number };

  bpe: {
    categories: Array<{
      category: "sante" | "alimentation" | "education" | "transports" | "services";
      nearest: { typeLabel: string; distanceMeters: number } | null; // null = rien sous le cap
      searchCapMeters: number; // cap de recherche appliqué à cette catégorie
    }>;
  };

  osm: {
    potentiallyNoisyInfrastructure: Array<{
      type: "motorway" | "trunk" | "railway";
      distanceMeters: number;
    }>; // vide = aucun axe dans l'emprise
    nearestMappedGreenSpace: { distanceMeters: number; osmKind?: string } | null;
    bboxRadiusMeters: number; // emprise OSM analysée (~1500)
  };

  sourceStatus: {
    bpe: "complete" | "failed";
    osmInfrastructure: "complete" | "pending" | "failed";
    osmGreenSpaces: "complete" | "pending" | "failed";
  };

  sources: { bpeVersion: string; osmFetchedAt: string | null; osmQueryVersion: string };
};
```

---

## 5. BPE — socle, 100 % local

- **Génération des shards** : étendre `scripts/populate-bpe.py` pour émettre, en plus de l'agrégat
  commune existant, des **shards par département** : `data/bpe-points/<dep>.json` = liste
  `{ typequ, lat, lon }` des équipements des catégories Face 3 (géoloc valides). Millésime annuel,
  maintenance faible.
- **Runtime** : une lib `src/lib/logement-autour.ts` (server-only, pure au sens testable) charge le
  shard du département de l'adresse, calcule le **plus proche par catégorie** en haversine.
- **Cap de recherche** : v1 = un cap commun (~3 km) ; au-delà → `nearest = null` et formulation
  explicite : « Aucun équipement de cette catégorie recensé dans les 3 km analysés. » Jamais afficher
  « maternité la plus proche : 47 km » dans une face « entourage ». Cap affinable **par famille** plus
  tard (quotidien 2-3 km, santé structurante plus large, transport majeur différent).
- **Catégories regroupées et décisionnelles, pas un annuaire.** Cinq familles maximum :
  santé, alimentation quotidienne, éducation, transports, (services essentiels). Le mapping TYPEQU
  précis est confirmé empiriquement (comme l'a fait `populate-bpe.py` pour les critères existants) et
  figé dans le plan. Détail exhaustif éventuel = drawer, pas la vue principale.

Distance restituée telle quelle : « **Pharmacie recensée à environ 420 m à vol d'oiseau.** »

---

## 6. OSM — bruit + verts, récupérés à la génération

- **Une requête** au moment de la génération (jamais à l'affichage), qui récupère ensemble sur la
  bbox de la tuile (~1,5 km + marge) : `highway=motorway|trunk(+_link)`, `railway=rail` (filtré), et
  les espaces verts cartographiés (`leisure=park`, `landuse=forest|grass|recreation_ground`,
  `natural=wood`). Réutilise les endpoints Overpass et les filtres déjà écrits dans
  `populate-calme-sonore.py` / `populate-vie-locale.py`.
- **Distances recalculées localement** depuis le point exact (haversine), pas depuis le centre de
  tuile.
- **Bruit (vigilance)** : « À environ X m d'un axe autoroutier / d'une voie ferrée cartographié. »
  Si rien : « **Aucun axe autoroutier ou ferroviaire cartographié dans l'emprise analysée de 1,5 km.** »
  Jamais un dB, jamais « aucun risque de bruit » (un axe > 1,5 km peut rester perceptible ; un axe à
  400 m n'implique pas une nuisance forte au logement — on ne conclut pas).
- **Verts (repère)** : « Espace vert cartographié le plus proche à environ X m. » Si rien :
  « **Aucun espace vert correspondant aux catégories recherchées dans l'emprise cartographiée.** »
  Jamais « il n'y a pas d'espace vert à proximité ».
- Attribution visible : « INSEE (BPE) », « OpenStreetMap (ODbL) ».

---

## 7. Génération asynchrone (version minimale)

- **BPE (local) disponible immédiatement** : la face s'affiche avec la brique quotidienne dès la
  soumission.
- **OSM** : tentative **inline avec timeout court (~3-4 s)** à la génération.
  - Tuile chaude → géométries en cache → OSM part avec le reste du snapshot.
  - Tuile froide + Overpass lent → `sourceStatus.osm* = "pending"` ; le client affiche BPE + une ligne
    discrète « **environnement en cours de récupération** » et **re-demande une fois** (la 2ᵉ ouverture
    est instantanée : tuile désormais chaude).
- L'échelle de retries différés (2ᵉ tentative après délai, tentative reportée en arrière-plan) =
  **incrément suivant**, une fois le taux d'échec réel mesuré.
- Une fois obtenue, la donnée **reste figée** dans le snapshot jusqu'à une actualisation volontaire :
  pas de cartes qui apparaissent/disparaissent à chaque rafraîchissement.

---

## 8. Découverte sans logement (cohérence produit)

Le Pack Décision vend des rapports par commune. Logement ne doit ni sembler oublié ni promettre à
tort une analyse à l'adresse quand il n'y en a pas.

- **Pas d'adresse fabriquée.** En l'absence de logement fourni, la Face 3 (et le gros de Logement)
  affiche un **état explicite** :
  > **Vous explorez la commune sans logement précis.**
  > Les analyses à l'adresse seront disponibles lorsque vous aurez identifié un bien ou un secteur.
  > — CTA secondaire : « Ajouter un logement ».
- Le module est alors **non applicable dans ce contexte**, pas cassé.
- **Dès que l'utilisateur ajoute un logement** — posture `residence` OU `prospection` (bien visé) — la
  Face 3 se calcule normalement. **La posture « bien visé » ship dès la v1** (c'est la sonde
  `ProjectProbe` rendue persistante) : un acheteur qui vise une adresse précise, y compris dans une
  commune qu'il explore, obtient sa lecture « à votre porte ».
- Transformer un rapport Découverte en analyse de bien = ajouter un logement, sans reconstruire le
  rapport.

---

## 9. Câblage & surface

- **Persistance** : nouvelles migrations `17_logement.sql` (+ `osm_tile_cache`). Accès via le client
  Supabase existant (own-row) et un client service-role pour le cache de tuile.
- **API** : le point de génération (le handler qui produit le snapshot, dans le flux
  `georisques-logement` ou une route dédiée) : géocode → upsert `logement` → BPE local → OSM (cache
  de tuile puis Overpass si froid) → écrit `snapshot` + `source_status` + `computed_at`. Toutes les
  sous-étapes gardent le patron de résilience `.catch` existant, **mais renseignent `source_status`**
  (échec observable, pas muet).
- **Lib pure testable** : `src/lib/logement-autour.ts` (calcul BPE + distances + formulation des
  états) — testée `node --test`, sans réseau ni disque dans les cas de test (injection des points).
- **UI** : nouveau bloc Face 3 dans `LogementModule.tsx` via le kit (`ReportSection` +
  `GlassCard`), hiérarchie des 3 briques respectée, distances brutes, états « aucun … dans l'emprise »
  explicites, ligne « environnement en cours » pour `pending`. Respecte les invariants
  d'harmonisation (registre 15-16px, verre arrondi, cf. `inventaire-design.md`).

---

## 10. Observabilité

- `source_status` (3 sources) dans le snapshot et remonté à l'UI.
- **Event PostHog de complétude** à la génération : `{ bpe, osmInfrastructure, osmGreenSpaces }`,
  `tile_key`, `insee`, `posture`, cache hit/miss OSM. Permet de mesurer le taux de rapports
  incomplets, quelle source échoue, si c'est ponctuel ou structurel — et de décider **quand** basculer
  vers les shards OSM nationaux.

---

## 11. Ce qui n'est PAS dans la v1 (parqué, explicite)

- Shards OSM nationaux précalculés (approche « B ») — bascule mesurable ultérieure.
- Retries différés en arrière-plan au-delà de la re-demande unique.
- Adjectifs de proximité « immédiat / proche / plus éloigné » avec seuils par famille.
- OCS GE (verdure au point, couverture nationale non confirmée), canopée, OSM POI commerces
  (redondant avec BPE), cartes de bruit dB (couverture non nationale) — cf. rapport Data Curator.
- Multi-logements dans une même commune (comparer deux annonces).
- Détail exhaustif des équipements en drawer.

---

## 12. Tests

- **Lib pure** (`logement-autour.ts`) : plus proche par catégorie, cap dépassé → `null` + formulation,
  emprise OSM vide → phrase « aucun axe … », verts absents → phrase « aucun espace vert … ».
  Déterministe, points injectés.
- **Snapshot / persistance** : upsert `logement`, invalidation (adresse changée → recalcul),
  `source_status` correctement renseigné en cas d'échec simulé.
- **Navigateur** (route de génération, comptes payants) : Résidence avec logement (les 3 briques),
  Découverte sans logement (état « non applicable » + CTA), `pending` OSM (BPE affiché + ligne en
  cours). 0 erreur console, harmonisation visuelle respectée.
