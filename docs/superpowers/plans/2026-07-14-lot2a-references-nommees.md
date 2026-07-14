# Les références nommées, pour de vrai — Plan d'implémentation (chantier A, lot 2a)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended)
> or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax
> for tracking.

**Goal:** « À 30 minutes de la gare Matabiau » cesse d'être une condition que le produit ne sait pas
exprimer, ne sait pas résoudre, et ne sait pas évaluer. À la fin de ce lot, le lecteur peut la poser, le
moteur identifie la gare (et refuse la rue qui porte le même nom, et l'école de formation qui porte le nom
de l'hôpital), calcule une isochrone une fois, et tranche par un point-dans-polygone, avec une zone grise
assumée sur la frontière.

**Architecture:** Le noyau (`hard-constraints.ts`) reste **pur** : il reçoit l'isochrone déjà calculée dans
son état hydraté, et ne fait aucun réseau. Une couche **serveur** (`hard-constraints-external.ts`) résout ce
que l'index des communes ne sait pas résoudre (géocodage POI, puis adresse) et calcule l'atteignabilité,
**au-dessus des deux moteurs**, qui traversent la même chaîne. L'hydratation pure est appelée deux fois :
une fois pour savoir **ce qu'il faut résoudre**, une fois avec le sac de résolutions.

**Tech Stack:** TypeScript, Next.js (App Router), `node --test` (type-stripping natif), Géoplateforme IGN
(géocodage `index=poi` et isochrone `bdtopo-valhalla`, sans clé), BAN (`api-adresse.data.gouv.fr`).

---

## Ce que l'enquête a établi, et qui corrige la spec

Six faits vérifiés le 2026-07-14, à la main, contre les API réelles. Ils priment sur la spec §5.

1. **La BAN ne sait pas géocoder une gare.** `api-adresse.data.gouv.fr/search/?q=gare+matabiau+toulouse`
   rend `Rue Matabiau` (`type: "street"`, score 0,71) : le faux positif plausible que la spec §5.3 veut
   attraper. La Géoplateforme, elle, la connaît :
   `data.geopf.fr/geocodage/search?q=gare matabiau&index=poi` rend `toponym: "Gare Matabiau"`,
   `category: ["gare voyageurs uniquement", "transport"]`, `citycode: ["31555"]`, score 0,85, et un
   identifiant stable (`extrafields.cleabs`). **La chaîne est : index des communes → POI Géoplateforme →
   BAN.**
2. **LE SCORE NE DÉCIDE PAS, LA CATÉGORIE DÉCIDE.** Sur « hôpital de Purpan », le mieux classé (0,65) est le
   *Centre de Formation Métiers de la Santé CHU Hôpital de Purpan* (catégorie `enseignement supérieur`).
   Le vrai *Hôpital Purpan* est à **0,42**, avec la catégorie `hôpital`. Un tri par score choisirait l'école ;
   un plancher de score à 0,6 tuerait l'hôpital. Les deux portent pourtant les mots « hôpital » et
   « purpan » : **la concordance du libellé ne suffit pas non plus.** Seule la **catégorie** les sépare. Le
   contrôle de type est donc **positif** (le mot d'équipement du lecteur doit trouver sa catégorie chez le
   candidat), et le score n'est qu'un **plancher anti-bruit**.
3. **Deux lieux à 2,5 km sont deux lieux.** « Gare de Lyon » rend **cinq** gares, toutes à 0,85 : celle de
   Paris, et quatre lyonnaises (Perrache et Guillotière sont à 2,5 km l'une de l'autre). Un seuil de
   déduplication à 5 km ferait choisir silencieusement entre deux gares réelles. Le seuil est **300 m**, et
   le cas normal ici est `ambiguous` : le produit ne tranche pas à la place du lecteur.
4. **Le vélo n'existe pas.** `profile=bike` rend **HTTP 400** sur toutes les ressources de navigation IGN.
   Seuls `car` et `pedestrian` répondent. Un `mode: "bike"` ne peut rendre qu'`unexamined(unsupported_metric)`.
   La spec §5.5 (« voiture, marche, vélo ») se trompait. **Et le produit ne doit donc pas proposer le vélo**
   dans la question qu'il pose au lecteur.
5. **Le lecteur n'a aucun moyen d'exprimer la contrainte.** `HardConstraints.nearPlace` est
   `{ label, maxKm }`, et le prompt du parse dit « label = nom de commune/ville ». Ni le temps, ni le mode,
   ni un lieu non communal n'ont où atterrir. **Ce lot commence donc par le parse.** Rien n'empêche
   aujourd'hui le LLM d'écrire `maxKm: 30` pour « 30 minutes ».
6. **L'isochrone répond en 0,6 s, sans clé, mais rate-limite** (HTTP 429 après quelques appels rapprochés).
   Le cache n'est pas une optimisation, c'est une condition de fonctionnement, **et il doit dédupliquer les
   appels EN VOL** : deux lecteurs simultanés sur la même gare partiraient sinon tous les deux vers IGN.

**Périmètre tranché avec le porteur** : ce lot (2a) livre la chaîne complète jusqu'à l'évaluation, avec un
**cache mémoire**. Le lot 2b livrera la persistance (`ResolvedPlaceReference` dans `UserProject`, table
`reachability_artifact`, read repair) et supprimera le témoin gelé `legacy-passes-hard.ts`.

**Ce que le lot 2a NE promet PAS.** Les deux moteurs traversent la **même chaîne de résolution**, avec le
même contrat et le même cache de process. Ils ne reçoivent pas encore le **même objet gelé** : un géocodage
réussi ici et un 429 là restent possibles, et deux instances ont deux caches. Cette garantie-là est
exactement ce que la persistance du lot 2b apporte, et il ne faut pas l'annoncer avant.

## Global Constraints

- **Un temps de trajet n'est JAMAIS évalué par un haversine.** Aucune conversion minutes → km, nulle part,
  ni dans le code, ni dans le prompt du parse.
- **Une panne n'est jamais un constat.** Un géocodeur qui ne répond pas rend `geocoding_unavailable` (pas
  `no_result`) ; un routeur qui rate-limite rend `routing_unavailable` (pas `incompatible`). Les deux sont
  **retentables**, et le lot 2b ne devra **jamais** les persister.
- **Aucun `?? 0`, aucun test de vérité implicite** sur une donnée nullable.
- **Un résultat seulement plausible ne devient jamais `resolved`.** En cas de doute entre deux lieux :
  `ambiguous`, jamais « le mieux classé ».
- **Une donnée structurée ne dit que ce qu'elle établit.** Un point-dans-polygone n'établit pas un temps de
  trajet de 30 minutes : il établit un côté de la frontière. La valeur observée le dit (`within`), et ne
  fabrique pas une mesure qui n'a pas été faite.
- **Une incompatibilité ne se décide pas sur quelques mètres de simplification** : la bande de tolérance
  rend `insufficient_precision`.
- **Le noyau reste PUR** : ni `server-only`, ni `fetch`, ni index chargé. `server-only` n'est pas résolvable
  par `node --test`.
- **Pas de tiret cadratin** dans la prose et les textes produits.
- **Ne jamais utiliser `git add -A`** : le porteur édite en parallèle. Stager les fichiers nommément.
- Après chaque tâche : `node --test src/lib/*.test.ts src/lib/decision/*.test.ts` vert (350 aujourd'hui) et
  `npx tsc --noEmit` rend 0.

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `src/lib/geo-polygon.ts` **(créé)** | PUR. `pointInPolygon(lat, lon, geometry, toleranceM)` → `"inside" \| "outside" \| "border" \| "unusable"`. `Polygon`, `MultiPolygon`, trous, géométrie invalide. **Un seul anneau invalide rend TOUTE la géométrie inutilisable.** |
| `src/lib/place-screening.ts` **(créé)** | PUR. Les **contrôles** : `screenCandidates()`. C'est ici que « Rue Matabiau » cesse d'être la gare, et que le centre de formation cesse d'être l'hôpital. |
| `src/lib/geocode-place.ts` **(créé)** | SERVEUR. Le réseau (Géoplateforme `index=poi` + BAN). Rend un `GeocodeOutcome` qui **distingue la panne du silence**. Parsing pur exporté et testé sur fixtures. |
| `src/lib/isochrone.ts` **(créé)** | SERVEUR. `reachabilityRequestHash()` (pur), `parseIsochrone()` (pur), `getReachability()` (réseau + cache, **dédup des appels en vol**). |
| `src/lib/hard-constraints-external.ts` **(créé)** | SERVEUR. `resolveExternalReferences(hc, dir, deps?)` : **au-dessus des deux moteurs**. Dépendances **injectables** (les tests comptent les appels réseau). |
| `src/lib/hard-constraints.ts` **(modifié)** | `ReachabilityState`, `PlaceMode`, `ROUTABLE_MODES`, `travel_time_threshold`, `geocoding_unavailable`, `reachabilityBorderToleranceM`, `evaluateNearPlace` (branche temps). |
| `src/lib/hard-constraint-schema.ts` **(modifié)** | `nearPlace` gagne `maxMinutes` et `mode`. |
| `src/lib/hard-constraints-hydrate.ts` **(modifié)** | Seuil `travel_time` ; accepte le sac de résolutions. |
| `src/lib/hard-constraints-resolve.ts` **(modifié)** | `RESOLVER_VERSION` → `resolve-2` ; `source` gagne `geoplateforme_poi` ; `unresolved.reason` gagne `geocoding_unavailable`. |
| `src/lib/comparateur-vie.ts` / `src/lib/decision/territory-facts.ts` **(modifiés)** | Hydratent avec les résolutions externes. |
| `src/app/api/comparateur-vie/parse/route.ts` **(modifié)** | Temps, mode, lieu non communal, interdiction de convertir, ambiguïté **sans le vélo**. |
| `src/lib/__fixtures__/geocode-*.json`, `isochrone-*.json` **(créés)** | Réponses réelles capturées. |

---

## Task 1 : Le prédicat géométrique (pur)

**Files:**
- Create: `src/lib/geo-polygon.ts`
- Test: `src/lib/geo-polygon.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type PolygonGeometry =
    | { type: "Polygon"; coordinates: number[][][] }
    | { type: "MultiPolygon"; coordinates: number[][][][] };
  export type PointPosition = "inside" | "outside" | "border" | "unusable";
  export function pointInPolygon(
    lat: number, lon: number, geometry: PolygonGeometry | null | undefined, toleranceMeters: number,
  ): PointPosition;
  ```

**Notes de conception :**
- GeoJSON écrit `[lon, lat]`. L'inversion est l'erreur classique, et elle est **silencieuse** : un point de
  Toulouse lu à l'envers atterrit en Somalie et rend un `outside` parfaitement crédible. Le test la couvre
  dans les deux sens.
- `border` prime sur `inside` et sur `outside`, des deux côtés de la frontière.
- Un point dans un **trou** est dehors.
- **Un anneau invalide (moins de 3 points, coordonnées non finies ou hors bornes) rend TOUTE la géométrie
  `unusable`**, trou compris. Ignorer un trou illisible reviendrait à déclarer « dedans » un point que la
  géométrie excluait peut-être : c'est exactement le repli silencieux que ce chantier démonte.

- [ ] **Step 1 : Écrire le test qui échoue**

```ts
// src/lib/geo-polygon.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { pointInPolygon, type PolygonGeometry } from "./geo-polygon.ts";

const CARRE: PolygonGeometry = {
  type: "Polygon",
  coordinates: [[[1, 43], [2, 43], [2, 44], [1, 44], [1, 43]]],
};
const CARRE_TROUE: PolygonGeometry = {
  type: "Polygon",
  coordinates: [
    [[1, 43], [2, 43], [2, 44], [1, 44], [1, 43]],
    [[1.4, 43.4], [1.6, 43.4], [1.6, 43.6], [1.4, 43.6], [1.4, 43.4]],
  ],
};

test("un point clairement à l'intérieur est inside", () => {
  assert.equal(pointInPolygon(43.6, 1.45, CARRE, 300), "inside");
});

test("un point clairement à l'extérieur est outside", () => {
  assert.equal(pointInPolygon(45.75, 4.85, CARRE, 300), "outside");
});

test("LES COORDONNÉES NE S'INVERSENT PAS : (lat, lon) n'est pas lu (lon, lat)", () => {
  assert.equal(pointInPolygon(1.45, 43.6, CARRE, 300), "outside");
});

test("un point sur la frontière est border, jamais incompatible", () => {
  assert.equal(pointInPolygon(43.5, 1.0, CARRE, 300), "border");
});

test("dans la bande de tolérance, DEDANS comme DEHORS, c'est border", () => {
  assert.equal(pointInPolygon(43.5, 1.001, CARRE, 300), "border");
  assert.equal(pointInPolygon(43.5, 0.999, CARRE, 300), "border");
});

test("une tolérance nulle laisse le point intérieur proche du bord en inside", () => {
  assert.equal(pointInPolygon(43.5, 1.001, CARRE, 0), "inside");
});

test("un point dans un trou est outside ; sur le bord du trou, border", () => {
  assert.equal(pointInPolygon(43.5, 1.5, CARRE_TROUE, 300), "outside");
  assert.equal(pointInPolygon(43.4, 1.5, CARRE_TROUE, 300), "border");
});

test("un MultiPolygon : dedans dans la seconde pièce", () => {
  const multi: PolygonGeometry = {
    type: "MultiPolygon",
    coordinates: [
      [[[1, 43], [1.1, 43], [1.1, 43.1], [1, 43.1], [1, 43]]],
      [[[5, 45], [6, 45], [6, 46], [5, 46], [5, 45]]],
    ],
  };
  assert.equal(pointInPolygon(45.5, 5.5, multi, 300), "inside");
  assert.equal(pointInPolygon(44.0, 3.0, multi, 300), "outside");
});

test("une géométrie absente est unusable, JAMAIS outside", () => {
  assert.equal(pointInPolygon(43.6, 1.45, null, 300), "unusable");
  assert.equal(pointInPolygon(43.6, 1.45, undefined, 300), "unusable");
});

test("une géométrie vide, d'un type inconnu, ou à l'anneau trop court est unusable", () => {
  assert.equal(pointInPolygon(43.6, 1.45, { type: "Polygon", coordinates: [] }, 300), "unusable");
  assert.equal(
    pointInPolygon(43.6, 1.45, { type: "Polygon", coordinates: [[[1, 43], [2, 43]]] }, 300),
    "unusable",
  );
  assert.equal(pointInPolygon(43.6, 1.45, { type: "Point", coordinates: [1, 43] } as never, 300), "unusable");
});

test("UN TROU INVALIDE REND TOUTE LA GÉOMÉTRIE INUTILISABLE (on n'ignore pas ce qu'on n'a pas su lire)", () => {
  const troueCasse: PolygonGeometry = {
    type: "Polygon",
    coordinates: [
      [[1, 43], [2, 43], [2, 44], [1, 44], [1, 43]],
      [[1.4, 43.4], [1.6, 43.4]], // 2 points : ce n'est pas un anneau
    ],
  };
  assert.equal(pointInPolygon(43.6, 1.45, troueCasse, 300), "unusable");
});

test("des coordonnées hors bornes terrestres sont illisibles, pas « dehors »", () => {
  const fou: PolygonGeometry = {
    type: "Polygon",
    coordinates: [[[1, 43], [2, 43], [999, 44], [1, 44], [1, 43]]],
  };
  assert.equal(pointInPolygon(43.6, 1.45, fou, 300), "unusable");
  const nan: PolygonGeometry = {
    type: "Polygon",
    coordinates: [[[1, 43], [2, 43], [Number.NaN, 44], [1, 44], [1, 43]]],
  };
  assert.equal(pointInPolygon(43.6, 1.45, nan, 300), "unusable");
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec**

Run: `node --test src/lib/geo-polygon.test.ts`
Expected: FAIL, `Cannot find module './geo-polygon.ts'`.

- [ ] **Step 3 : Implémenter**

```ts
// src/lib/geo-polygon.ts
// LE PRÉDICAT GÉOMÉTRIQUE. PUR : aucune dépendance, aucun réseau.
//
// Il rend QUATRE états, pas deux. Une isochrone est une géométrie simplifiée : un point posé sur la
// frontière change de côté pour quelques mètres d'arrondi. Pour une condition NON NÉGOCIABLE, une zone
// grise assumée vaut mieux qu'une incompatibilité décidée par la simplification. Et une géométrie qu'on
// n'a pas su lire (« unusable ») n'est PAS une commune trop loin (« outside ») : les confondre, c'est
// reconstruire le mensonge que tout ce chantier démonte.
export type PolygonGeometry =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };

export type PointPosition = "inside" | "outside" | "border" | "unusable";

const M_PER_DEG_LAT = 111_320;

// Un anneau doit être lisible ENTIÈREMENT. Une coordonnée non finie ou hors bornes terrestres n'est pas
// un sommet qu'on peut « sauter » : c'est le signe que la géométrie n'est pas celle qu'on croit.
function ringIsValid(ring: unknown): ring is number[][] {
  if (!Array.isArray(ring) || ring.length < 3) return false;
  return ring.every((p) => {
    if (!Array.isArray(p) || p.length < 2) return false;
    const [lon, lat] = p as [unknown, unknown];
    return (
      typeof lon === "number" && typeof lat === "number" &&
      Number.isFinite(lon) && Number.isFinite(lat) &&
      lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90
    );
  });
}

// Ray casting sur un anneau, en [lon, lat].
function inRing(lat: number, lon: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]! as [number, number];
    const [xj, yj] = ring[j]! as [number, number];
    const intersecte = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersecte) inside = !inside;
  }
  return inside;
}

// Distance (mètres) du point au segment [a, b], en projection locale : la longitude est mise à l'échelle
// par cos(lat). À l'échelle d'une isochrone et à nos latitudes, c'est exact au mètre près, sans
// dépendance géodésique.
function distToSegmentM(lat: number, lon: number, a: number[], b: number[]): number {
  const k = Math.cos((lat * Math.PI) / 180);
  const px = lon * k * M_PER_DEG_LAT, py = lat * M_PER_DEG_LAT;
  const ax = a[0]! * k * M_PER_DEG_LAT, ay = a[1]! * M_PER_DEG_LAT;
  const bx = b[0]! * k * M_PER_DEG_LAT, by = b[1]! * M_PER_DEG_LAT;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function distToRingM(lat: number, lon: number, ring: number[][]): number {
  let min = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const d = distToSegmentM(lat, lon, ring[j]!, ring[i]!);
    if (d < min) min = d;
  }
  return min;
}

export function pointInPolygon(
  lat: number,
  lon: number,
  geometry: PolygonGeometry | null | undefined,
  toleranceMeters: number,
): PointPosition {
  if (!geometry || (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon")) return "unusable";
  const polys: unknown[][] =
    geometry.type === "Polygon" ? [geometry.coordinates] : (geometry.coordinates as unknown[][]);
  if (!Array.isArray(polys) || polys.length === 0) return "unusable";

  let dedans = false;
  let distMin = Infinity;

  for (const poly of polys) {
    // TOUT le polygone doit être lisible, trous compris. Un trou illisible qu'on « saute » ferait
    // déclarer DEDANS un point que la géométrie excluait peut-être.
    if (!Array.isArray(poly) || poly.length === 0 || !poly.every(ringIsValid)) return "unusable";
    const rings = poly as number[][][];
    const enveloppe = rings[0]!;
    distMin = Math.min(distMin, distToRingM(lat, lon, enveloppe));
    if (!inRing(lat, lon, enveloppe)) continue;

    let dansUnTrou = false;
    for (const trou of rings.slice(1)) {
      distMin = Math.min(distMin, distToRingM(lat, lon, trou));
      if (inRing(lat, lon, trou)) dansUnTrou = true;
    }
    if (!dansUnTrou) dedans = true;
  }

  if (toleranceMeters > 0 && distMin <= toleranceMeters) return "border";
  return dedans ? "inside" : "outside";
}
```

- [ ] **Step 4 : Lancer, vérifier le passage**

Run: `node --test src/lib/geo-polygon.test.ts`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add src/lib/geo-polygon.ts src/lib/geo-polygon.test.ts
git commit -m "feat(geo): le prédicat point-dans-polygone (bande de tolérance, trous, et 'unusable' plutôt qu'un faux dehors)"
```

---

## Task 2 : Le seuil de temps entre dans le contrat (schéma + hydratation, purs)

**Files:**
- Modify: `src/lib/hard-constraint-schema.ts`, `src/lib/hard-constraints-hydrate.ts`
- Test: `src/lib/hard-constraints-hydrate.test.ts` (ajouts)

**Interfaces:**
- Produces :
  ```ts
  nearPlace?: { label: string; maxKm?: number | null; maxMinutes?: number | null;
                mode?: "car" | "walk" | "bike" | null } | null;
  ```

**Notes de conception :**
- **Le temps prime sur la distance** quand les deux sont déclarés : « à 30 minutes, disons 20 km » est un
  lecteur qui se paraphrase, et le temps est ce qu'il a en tête. Le choix est écrit, pas laissé à l'ordre
  des `if`.
- **Un mode inconnu est un mode absent** (`missing_parameter`). Le parse est un LLM : il peut écrire
  `"voiture"`. Le noyau ne fait confiance à personne.
- `maxMinutes` non fini, négatif ou nul : absent. « 0 minute » n'est pas une contrainte.

- [ ] **Step 1 : Écrire les tests qui échouent**

```ts
// src/lib/hard-constraints-hydrate.test.ts — à AJOUTER (réutiliser le `directory()` déjà présent)
test("un temps de trajet déclaré produit un seuil travel_time, jamais une distance", () => {
  const n = hydrateHardConstraints({ nearPlace: { label: "Gare Matabiau", maxMinutes: 30, mode: "car" } }, directory());
  assert.deepEqual(n.nearPlace?.threshold, {
    metric: "travel_time", maxMinutes: 30, mode: "car", direction: "to_reference", source: "user",
  });
});

test("le TEMPS PRIME sur la distance quand les deux sont déclarés", () => {
  const n = hydrateHardConstraints({ nearPlace: { label: "Brest", maxKm: 20, maxMinutes: 30, mode: "car" } }, directory());
  assert.equal(n.nearPlace?.threshold?.metric, "travel_time");
});

test("un temps sans mode reste travel_time, mode null (le PARAMÈTRE manque, pas le lieu)", () => {
  const n = hydrateHardConstraints({ nearPlace: { label: "Brest", maxMinutes: 30 } }, directory());
  const t = n.nearPlace?.threshold;
  assert.equal(t?.metric === "travel_time" ? t.mode : "absent", null);
});

test("un mode que le parse a inventé est traité comme ABSENT, jamais gardé", () => {
  const n = hydrateHardConstraints({ nearPlace: { label: "Brest", maxMinutes: 30, mode: "voiture" as never } }, directory());
  const t = n.nearPlace?.threshold;
  assert.equal(t?.metric === "travel_time" ? t.mode : "absent", null);
});

test("un temps nul ou absurde n'est pas une contrainte", () => {
  const n = hydrateHardConstraints({ nearPlace: { label: "Brest", maxMinutes: 0, mode: "car" } }, directory());
  assert.equal(n.nearPlace?.threshold, null);
});

test("une distance seule reste une distance (le lot 1 ne bouge pas)", () => {
  const n = hydrateHardConstraints({ nearPlace: { label: "Brest", maxKm: 20 } }, directory());
  assert.deepEqual(n.nearPlace?.threshold, { metric: "distance", maxKm: 20, source: "user" });
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec**

Run: `node --test src/lib/hard-constraints-hydrate.test.ts`
Expected: FAIL.

- [ ] **Step 3 : Étendre le schéma**

```ts
// src/lib/hard-constraint-schema.ts — remplacer la ligne nearPlace
  // « Près de {lieu} » : le lieu n'est PAS forcément une commune (une gare, un hôpital, un campus). Deux
  // métriques, qui ne se convertissent pas l'une dans l'autre : une distance à vol d'oiseau n'établit pas
  // un temps de trajet. Le mode est un PARAMÈTRE de l'évaluation : sans lui, « à 30 minutes » ne veut rien
  // dire (à pied ou en voiture, ce n'est pas le même territoire).
  nearPlace?: {
    label: string;
    maxKm?: number | null;
    maxMinutes?: number | null;
    mode?: "car" | "walk" | "bike" | null;
  } | null;
```

- [ ] **Step 4 : Implémenter l'hydratation**

```ts
// src/lib/hard-constraints-hydrate.ts
import type { PlaceMode } from "./hard-constraints.ts";

const MODES: PlaceMode[] = ["car", "walk", "bike"];

// LE TEMPS PRIME SUR LA DISTANCE. Et le mode n'est JAMAIS deviné : un mode que le parse a inventé
// (« voiture », « transports ») est un mode ABSENT, qui rendra missing_parameter, et que le lecteur se
// verra demander.
function nearPlaceThreshold(np: NonNullable<HardConstraints["nearPlace"]>): PlaceThreshold | null {
  const minutes = np.maxMinutes;
  if (typeof minutes === "number" && Number.isFinite(minutes) && minutes > 0) {
    const mode = MODES.includes(np.mode as PlaceMode) ? (np.mode as PlaceMode) : null;
    return { metric: "travel_time", maxMinutes: minutes, mode, direction: "to_reference", source: "user" };
  }
  return thresholdFrom(np.maxKm);
}

function thresholdFrom(maxKm: number | null | undefined): PlaceThreshold | null {
  return typeof maxKm === "number" && Number.isFinite(maxKm) && maxKm > 0
    ? { metric: "distance", maxKm, source: "user" }
    : null;
}
```

Dans `hydrateHardConstraints`, `nearPlace` appelle `nearPlaceThreshold(c.nearPlace)`. **`nearSea` continue
d'appeler `thresholdFrom`** : la mer n'a pas de temps de trajet.

Dans `hard-constraints.ts`, ajouter `export type PlaceMode = "car" | "walk" | "bike";` et remplacer les
occurrences littérales de `"car" | "walk" | "bike"` (dans `ConstraintValue` et `PlaceThreshold`) par
`PlaceMode`.

- [ ] **Step 5 : Lancer, vérifier**

Run: `node --test src/lib/hard-constraints-hydrate.test.ts && npx tsc --noEmit`

- [ ] **Step 6 : Commit**

```bash
git add src/lib/hard-constraint-schema.ts src/lib/hard-constraints-hydrate.ts src/lib/hard-constraints-hydrate.test.ts src/lib/hard-constraints.ts
git commit -m "feat(contraintes-dures): le temps de trajet et son mode entrent dans le contrat (le temps prime, le mode ne se devine pas)"
```

---

## Task 3 : L'évaluateur `nearPlace` sait évaluer un temps de trajet

**Files:**
- Modify: `src/lib/hard-constraints.ts`
- Modify: `src/lib/hard-constraints-resolve.ts` (`geocoding_unavailable`, `source`)
- Test: `src/lib/hard-constraints.test.ts` (ajouts)

**Interfaces:**
- Consumes: `pointInPolygon` (Task 1).
- Produces:
  ```ts
  export type PlaceMode = "car" | "walk" | "bike";
  export const ROUTABLE_MODES: PlaceMode[];        // ["car", "walk"] : le vélo rend HTTP 400 chez IGN
  export type ReachabilityState =
    | { status: "ready"; geometry: PolygonGeometry; toleranceMeters: number }
    | { status: "unavailable"; reason: "routing_unavailable" | "unsupported_metric" };

  // ConstraintValue gagne :
  | { kind: "travel_time_threshold"; maxMinutes: number; mode: PlaceMode; within: boolean;
      direction: "to_reference" }

  // UnexaminedReason gagne :
  | "geocoding_unavailable"

  // NormalizedHardConstraints.nearPlace gagne :
  reachability: ReachabilityState | null;
  ```

**Notes de conception :**
- **La valeur observée ne ment pas.** Un point-dans-polygone n'établit **pas** un temps de 30 minutes : il
  établit un côté de la frontière. `travel_time_threshold` porte `within`, et rien de plus. Fabriquer
  `{ travel_time_min, value: 30 }` mettrait dans le noyau une mesure qui n'a jamais été faite, et le lot 2b
  la persisterait.
- **L'ordre des gardes** : dans la branche temps, le **mode** se teste avant le **point**. Un lecteur qui n'a
  pas dit « en voiture » doit lire « il nous manque le mode », pas « nous ne connaissons pas les coordonnées
  de cette commune ». Les tests couvrent les absences **combinées**.
- Le vélo rend `unsupported_metric` **dans le noyau** : ce n'est pas une panne (retentable), c'est une limite
  stable du moteur de routage.
- La tolérance est une **convention de produit**, nommée et versionnée : `reachabilityBorderToleranceM: 300`
  (les sommets de l'isochrone sont espacés d'environ 150 m). `PRODUCT_CONVENTIONS_VERSION` → `"hc-conv-2"`.

- [ ] **Step 1 : Écrire les tests qui échouent**

```ts
// src/lib/hard-constraints.test.ts — à AJOUTER
import type { PolygonGeometry } from "./geo-polygon.ts";

const GARE: ResolvedPlaceReference = {
  status: "resolved", originalLabel: "la gare Matabiau", canonicalLabel: "Gare Matabiau",
  kind: "station", lat: 43.611448, lon: 1.453496, source: "geoplateforme_poi",
  sourceId: "EQ_RESEA0000000073015866", confidence: "high",
  meta: { inputHash: "h", resolverVersion: "resolve-2" },
};
const ISO: PolygonGeometry = {
  type: "Polygon",
  coordinates: [[[1.3, 43.5], [1.6, 43.5], [1.6, 43.7], [1.3, 43.7], [1.3, 43.5]]],
};
const PT = (lat: number, lon: number): EvaluationPoint => ({
  lat, lon, grain: "commune_reference", source: "commune_centroid", label: "point",
});

function ctxTemps(
  reachability: ReachabilityState | null,
  mode: PlaceMode | null = "car",
  point: EvaluationPoint | null = PT(43.6, 1.45),
): EvaluationContext {
  return {
    constraints: {
      ...VIDE, // l'objet de contraintes vides déjà présent dans ce fichier
      nearPlace: {
        label: "la gare Matabiau",
        threshold: { metric: "travel_time", maxMinutes: 30, mode, direction: "to_reference", source: "user" },
        reference: GARE,
        reachability,
      },
    },
    point,
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };
}

test("dans l'isochrone : satisfied, et la valeur observée dit CE QU'ELLE ÉTABLIT (un côté, pas un temps)", () => {
  const a = evaluateNearPlace(ctxTemps({ status: "ready", geometry: ISO, toleranceMeters: 300 }), TOULOUSE);
  assert.equal(a.status, "satisfied");
  if (a.status !== "satisfied") return;
  assert.deepEqual(a.observedValue, {
    kind: "travel_time_threshold", maxMinutes: 30, mode: "car", within: true, direction: "to_reference",
  });
  assert.equal(a.expectedLabel, "au plus 30 minutes en voiture");
});

test("hors de l'isochrone : incompatible, la phrase nomme le lieu, le mode et le temps, et JAMAIS des km", () => {
  const ctx = ctxTemps({ status: "ready", geometry: ISO, toleranceMeters: 300 }, "car", PT(43.646, 0.586));
  const a = evaluateNearPlace(ctx, { ...TOULOUSE, nom: "Auch" });
  assert.equal(a.status, "incompatible");
  if (a.status !== "incompatible") return;
  assert.match(a.statement, /Gare Matabiau/);
  assert.match(a.statement, /30 minutes en voiture/);
  assert.doesNotMatch(a.statement, /km/);
  assert.equal(a.observedValue.kind === "travel_time_threshold" ? a.observedValue.within : null, false);
});

test("UN TEMPS N'EST JAMAIS ÉVALUÉ PAR UN HAVERSINE : sans isochrone, routing_unavailable", () => {
  const a = evaluateNearPlace(ctxTemps({ status: "unavailable", reason: "routing_unavailable" }), TOULOUSE);
  assert.equal(a.status === "unexamined" && a.reason, "routing_unavailable");
});

test("le VÉLO n'est pas calculable par le moteur IGN : unsupported_metric", () => {
  const a = evaluateNearPlace(ctxTemps(null, "bike"), TOULOUSE);
  assert.equal(a.status === "unexamined" && a.reason, "unsupported_metric");
});

test("le mode manquant est un PARAMÈTRE, pas une ambiguïté du lieu", () => {
  const a = evaluateNearPlace(ctxTemps(null, null), TOULOUSE);
  assert.equal(a.status === "unexamined" && a.reason, "missing_parameter");
});

test("ABSENCES COMBINÉES : sans mode ET sans point, c'est le MODE qu'on nomme (la cause utile au lecteur)", () => {
  const a = evaluateNearPlace(ctxTemps(null, null, null), TOULOUSE);
  assert.equal(a.status === "unexamined" && a.reason, "missing_parameter");
});

test("ABSENCES COMBINÉES : mode connu, isochrone prête, mais commune sans coordonnées -> missing_data", () => {
  const a = evaluateNearPlace(
    ctxTemps({ status: "ready", geometry: ISO, toleranceMeters: 300 }, "car", null), TOULOUSE,
  );
  assert.equal(a.status === "unexamined" && a.reason, "missing_data");
});

test("dans la bande de tolérance : insufficient_precision, JAMAIS incompatible", () => {
  const ctx = ctxTemps({ status: "ready", geometry: ISO, toleranceMeters: 300 }, "car", PT(43.6, 1.301));
  const a = evaluateNearPlace(ctx, TOULOUSE);
  assert.equal(a.status === "unexamined" && a.reason, "insufficient_precision");
});

test("une géométrie illisible ne devient pas une incompatibilité", () => {
  const ctx = ctxTemps({ status: "ready", geometry: { type: "Polygon", coordinates: [] }, toleranceMeters: 300 });
  const a = evaluateNearPlace(ctx, TOULOUSE);
  assert.equal(a.status === "unexamined" && a.reason, "routing_unavailable");
});

test("UNE PANNE DE GÉOCODAGE N'EST PAS UN LIEU INTROUVABLE", () => {
  const ctx: EvaluationContext = {
    constraints: {
      ...VIDE,
      nearPlace: {
        label: "la gare Matabiau",
        threshold: { metric: "distance", maxKm: 20, source: "user" },
        reference: {
          status: "unresolved", originalLabel: "la gare Matabiau", reason: "geocoding_unavailable",
          meta: { inputHash: "h", resolverVersion: "resolve-2" },
        },
        reachability: null,
      },
    },
    point: PT(43.6, 1.45),
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };
  const a = evaluateNearPlace(ctx, TOULOUSE);
  assert.equal(a.status === "unexamined" && a.reason, "geocoding_unavailable");
});
```

> Les constructions existantes de `nearPlace` dans les tests du lot 1 gagnent `reachability: null` : le
> typecheck les désignera.

- [ ] **Step 2 : Lancer, vérifier l'échec**

Run: `node --test src/lib/hard-constraints.test.ts`
Expected: FAIL.

- [ ] **Step 3 : Étendre les types de résolution**

```ts
// src/lib/hard-constraints-resolve.ts
export const RESOLVER_VERSION = "resolve-2"; // le résolveur géocode et contrôle : un inputHash d'hier ne
                                             // dit plus la même chose.

// La PROVENANCE n'est pas cosmétique : elle sert au read repair (lot 2b), à l'audit, et à l'explication.
// Un POI de la Géoplateforme (avec son cleabs stable) n'est pas une adresse de la BAN.
export type ResolvedPlaceReference =
  | { status: "resolved"; /* … */ source: "commune_index" | "geoplateforme_poi" | "ban"; /* … */ }
  | { status: "ambiguous"; /* … */ }
  | {
      status: "unresolved"; originalLabel: string;
      // geocoding_unavailable est une PANNE, pas un constat : les services n'ont pas répondu. Elle est
      // retentable, et le lot 2b ne devra JAMAIS la persister.
      reason: "no_result" | "low_confidence" | "unsupported_type" | "geocoding_unavailable";
      meta: ResolutionMetadata;
    };
```

- [ ] **Step 4 : Implémenter le noyau**

```ts
// src/lib/hard-constraints.ts
import { pointInPolygon, type PolygonGeometry } from "./geo-polygon.ts";

export const PRODUCT_CONVENTIONS_VERSION = "hc-conv-2"; // conv-2 : la bande de tolérance de l'isochrone
export const PRODUCT_CONVENTIONS = {
  excludeSeaMinKm: 15,
  montagneMinScore: 50,
  reliefProcheMinScore: 50,
  // La géométrie d'une isochrone est SIMPLIFIÉE : ses sommets sont espacés d'environ 150 m sur un polygone
  // de 30 minutes en voiture. Sous cette bande, le verdict serait décidé par la simplification, pas par le
  // territoire. On ne tranche pas, et on le dit.
  reachabilityBorderToleranceM: 300,
} as const;

export type PlaceMode = "car" | "walk" | "bike";

// CE QUE LE MOTEUR DE ROUTAGE SAIT VRAIMENT FAIRE. Vérifié contre l'API IGN le 2026-07-14 : `bike` rend
// HTTP 400 sur TOUTES les ressources de navigation. Ce n'est pas une panne (routing_unavailable, qu'on
// retente), c'est une limite stable : elle appartient au noyau, et elle est dite au lecteur.
export const ROUTABLE_MODES: PlaceMode[] = ["car", "walk"];

export type ReachabilityState =
  | { status: "ready"; geometry: PolygonGeometry; toleranceMeters: number }
  | { status: "unavailable"; reason: "routing_unavailable" | "unsupported_metric" };

const MODE_LABEL: Record<PlaceMode, string> = { car: "en voiture", walk: "à pied", bike: "à vélo" };

// UnexaminedReason gagne "geocoding_unavailable" (les géocodeurs n'ont pas répondu : une panne, pas un
// lieu introuvable).

// ConstraintValue gagne : un point-dans-polygone n'établit PAS un temps de 30 minutes, il établit un CÔTÉ.
// Écrire { kind: "travel_time_min", value: 30 } mettrait dans le noyau une mesure jamais faite.
//   | { kind: "travel_time_threshold"; maxMinutes: number; mode: PlaceMode; within: boolean;
//       direction: "to_reference" }

// NormalizedHardConstraints.nearPlace gagne : reachability: ReachabilityState | null;

export function evaluateNearPlace(
  ctx: EvaluationContext,
  c: CommuneAttributes,
): HardConstraintAssessment<"nearPlace"> {
  const np = ctx.constraints.nearPlace;
  if (np == null) return { key: "nearPlace", status: "not_declared" };

  // LA RÉFÉRENCE. Une PANNE des géocodeurs n'est pas un lieu introuvable : le lecteur doit pouvoir
  // distinguer « nous ne connaissons pas ce lieu » de « nos sources n'ont pas répondu ».
  if (np.reference.status !== "resolved") {
    const reason: UnexaminedReason =
      np.reference.status === "ambiguous"
        ? "ambiguous_reference"
        : np.reference.reason === "geocoding_unavailable"
          ? "geocoding_unavailable"
          : "unresolved_reference";
    return { key: "nearPlace", status: "unexamined", reason, detail: np.label };
  }
  if (np.threshold == null) {
    return { key: "nearPlace", status: "unexamined", reason: "missing_parameter", detail: np.label };
  }

  const ref = np.reference;
  const evidenceKeys = ["commune.lat", "commune.lon", "project.hardConstraints.nearPlace"];

  // ── LE TEMPS DE TRAJET ──
  // L'ORDRE DES GARDES EST DÉLIBÉRÉ : le mode se teste avant le point. Un lecteur qui n'a pas dit
  // « en voiture » doit lire « il nous manque le mode », pas « nous ne connaissons pas les coordonnées de
  // cette commune ». Ce qu'on nomme doit être la cause qu'il peut lever.
  if (np.threshold.metric === "travel_time") {
    const { maxMinutes, mode } = np.threshold;
    if (mode == null) {
      return { key: "nearPlace", status: "unexamined", reason: "missing_parameter", detail: np.label };
    }
    if (!ROUTABLE_MODES.includes(mode)) {
      return { key: "nearPlace", status: "unexamined", reason: "unsupported_metric", detail: np.label };
    }
    if (np.reachability == null || np.reachability.status === "unavailable") {
      return {
        key: "nearPlace", status: "unexamined",
        reason: np.reachability?.reason ?? "routing_unavailable", detail: np.label,
      };
    }
    // SANS POINT, PAS DE MESURE. (0, 0) est dans le golfe de Guinée : une incompatibilité ÉTABLIE sur un
    // point inventé.
    if (ctx.point == null) return { key: "nearPlace", status: "unexamined", reason: "missing_data" };

    const pos = pointInPolygon(
      ctx.point.lat, ctx.point.lon, np.reachability.geometry, np.reachability.toleranceMeters,
    );
    if (pos === "unusable") {
      return { key: "nearPlace", status: "unexamined", reason: "routing_unavailable", detail: np.label };
    }
    if (pos === "border") {
      return { key: "nearPlace", status: "unexamined", reason: "insufficient_precision", detail: np.label };
    }

    const within = pos === "inside";
    const observedValue: ConstraintValue = {
      kind: "travel_time_threshold", maxMinutes, mode, within, direction: "to_reference",
    };
    const expectedValue: ConstraintValue = {
      kind: "travel_time_threshold", maxMinutes, mode, within: true, direction: "to_reference",
    };
    const observedLabel = within
      ? `dans les ${maxMinutes} minutes ${MODE_LABEL[mode]}`
      : `au-delà de ${maxMinutes} minutes ${MODE_LABEL[mode]}`;
    const expectedLabel = `au plus ${maxMinutes} minutes ${MODE_LABEL[mode]}`;

    if (within) {
      return { key: "nearPlace", status: "satisfied", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys };
    }
    // LE GRAIN EST DIT : une isochrone testée sur le point de référence de la commune ne dit pas que TOUTE
    // la commune y est. Et on ne convertit JAMAIS ce temps en kilomètres pour « donner un ordre d'idée ».
    const sujet = ctx.point.grain === "address" ? "Cette adresse" : `Le point de référence de ${c.nom}`;
    return {
      key: "nearPlace", status: "incompatible", observedValue, expectedValue, observedLabel, expectedLabel, evidenceKeys,
      topic: topicFit(`le temps de trajet de ${c.nom} à ${ref.canonicalLabel}`, `le temps de trajet à ${ref.canonicalLabel}`),
      statement: `${sujet} se situe hors des ${maxMinutes} minutes ${MODE_LABEL[mode]} de ${ref.canonicalLabel} que vous avez posées comme limite.`,
    };
  }

  // ── LA DISTANCE : inchangée depuis le lot 1 ──
  if (ctx.point == null) return { key: "nearPlace", status: "unexamined", reason: "missing_data" };
  const km = haversineKm(ctx.point.lat, ctx.point.lon, ref.lat, ref.lon);
  // … (le reste du corps actuel, sans modification)
}
```

- [ ] **Step 5 : Lancer, vérifier**

Run: `node --test src/lib/hard-constraints.test.ts && npx tsc --noEmit`

- [ ] **Step 6 : Commit**

```bash
git add src/lib/hard-constraints.ts src/lib/hard-constraints.test.ts src/lib/hard-constraints-resolve.ts src/lib/hard-constraints-hydrate.ts
git commit -m "feat(contraintes-dures): nearPlace évalue un temps de trajet par point-dans-isochrone (la valeur observée dit un côté, pas un temps)"
```

---

## Task 4 : Les contrôles du géocodage (purs)

**Files:**
- Create: `src/lib/place-screening.ts`, `src/lib/place-screening.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type GeocodeCandidate = {
    label: string; kind: "commune" | "station" | "address" | "poi" | "street";
    lat: number; lon: number; citycode: string | null; dept: string | null;
    score: number; sourceId: string | null;
    source: "geoplateforme_poi" | "ban"; categories: string[];
  };
  export type ExpectedPlaceKind = "equipment" | "address" | "unspecified";
  export function expectedKindOf(label: string): ExpectedPlaceKind;
  export function screenCandidates(
    label: string, candidates: GeocodeCandidate[],
    context: { departements: string[]; degraded: boolean },
    meta: ResolutionMetadata,
  ): ResolvedPlaceReference;
  ```

**La doctrine des contrôles, telle que les FAITS l'imposent :**

1. **Le type attendu, déduit du libellé du lecteur** (`expectedKindOf`), et il est **bidirectionnel** :
   - un **nom commun d'équipement** (« gare », « hôpital », « université »…) → `equipment` : les candidats
     `street` et `address` sont **rejetés**, et le candidat doit porter la **bonne catégorie** ;
   - un **numéro de voie** en tête (« 7 rue du Taur ») → `address` : un POI ne peut pas gagner ;
   - sinon → `unspecified` : tous les types sont recevables.
2. **La catégorie, et c'est elle qui décide.** Fait vérifié : sur « hôpital de Purpan », le mieux classé
   (0,65) est un *centre de formation* qui porte pourtant les deux mots du lecteur ; le vrai hôpital est à
   **0,42**. Ni le score ni le libellé ne les séparent : seule la catégorie le fait. Un mot d'équipement
   est donc satisfait par une catégorie compatible **ou** par le libellé du candidat, et un candidat
   d'`equipment` sans catégorie compatible est **écarté** quand un autre en a une.
3. **La concordance du libellé** : tous les mots significatifs du lecteur (hors mots vides) doivent
   apparaître dans le libellé **ou** dans les catégories du candidat.
4. **Le territoire** : les départements déclarés **écartent** les candidats d'ailleurs. Ils
   désambiguïsent, ils ne forcent jamais.
5. **Le score n'est qu'un plancher anti-bruit** (`MIN_SCORE = 0,3`), et surtout pas un juge : il aurait tué
   l'hôpital de Purpan.

**La déduplication, et l'ambiguïté :**
- même `sourceId` non nul → **le même objet**, quelles que soient ses coordonnées ;
- sinon, **≤ 300 m** et **même famille de type** (équipement avec équipement, adresse avec adresse) → le même
  lieu vu par deux référentiels (la Géoplateforme et la BAN décrivent la même adresse avec deux libellés :
  exiger l'égalité des libellés fabriquerait de faux `ambiguous`) ;
- sinon → **`ambiguous`**. Fait vérifié : « gare de Lyon » rend cinq gares, toutes au même score, dont
  Perrache et Guillotière à 2,5 km l'une de l'autre. À 5 km, le produit aurait tranché tout seul entre deux
  gares réelles.

**La panne :** si les géocodeurs n'ont pas répondu (`degraded`) et qu'aucun candidat recevable ne subsiste,
la référence est `unresolved(geocoding_unavailable)`, **jamais** `no_result`.

- [ ] **Step 1 : Écrire les tests qui échouent**

```ts
// src/lib/place-screening.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { screenCandidates, expectedKindOf, type GeocodeCandidate } from "./place-screening.ts";

const META = { inputHash: "h", resolverVersion: "resolve-2" };
const CTX = { departements: [] as string[], degraded: false };

const GARE: GeocodeCandidate = {
  label: "Gare Matabiau", kind: "station", lat: 43.611448, lon: 1.453496,
  citycode: "31555", dept: "31", score: 0.85, sourceId: "EQ_RESEA0000000073015866",
  source: "geoplateforme_poi", categories: ["gare voyageurs uniquement", "transport"],
};
const RUE: GeocodeCandidate = {
  label: "Rue Matabiau 31000 Toulouse", kind: "street", lat: 43.611679, lon: 1.448097,
  citycode: "31555", dept: "31", score: 0.71, sourceId: "31555_5776", source: "ban", categories: [],
};
// Les DEUX candidats réels de « hôpital de Purpan », avec leurs scores réels.
const ECOLE: GeocodeCandidate = {
  label: "Centre de Formation Métiers de la Santé Chu Hôpital de Purpan", kind: "poi",
  lat: 43.608, lon: 1.398, citycode: "31555", dept: "31", score: 0.65, sourceId: "EQ_ECOLE_1",
  source: "geoplateforme_poi", categories: ["enseignement supérieur", "zone d'activité ou d'intérêt"],
};
const HOPITAL: GeocodeCandidate = {
  label: "Hôpital Purpan", kind: "poi", lat: 43.6, lon: 1.398, citycode: "31555", dept: "31",
  score: 0.42, sourceId: "EQ_HOPITAL_1", source: "geoplateforme_poi",
  categories: ["hôpital", "zone d'activité ou d'intérêt"],
};

test("le type attendu se lit dans le libellé du lecteur", () => {
  assert.equal(expectedKindOf("la gare Matabiau"), "equipment");
  assert.equal(expectedKindOf("7 rue du Taur Toulouse"), "address");
  assert.equal(expectedKindOf("Brest"), "unspecified");
});

test("LE FAUX POSITIF DE LA BAN : « la gare Matabiau » ne devient JAMAIS « Rue Matabiau »", () => {
  const r = screenCandidates("la gare Matabiau", [RUE], CTX, META);
  assert.equal(r.status, "unresolved");
  if (r.status !== "unresolved") return;
  assert.equal(r.reason, "unsupported_type");
});

test("la gare est résolue, avec sa provenance IGN et son identifiant stable", () => {
  const r = screenCandidates("la gare Matabiau", [GARE, RUE], CTX, META);
  assert.equal(r.status, "resolved");
  if (r.status !== "resolved") return;
  assert.equal(r.canonicalLabel, "Gare Matabiau");
  assert.equal(r.kind, "station");
  assert.equal(r.source, "geoplateforme_poi"); // la provenance n'est PAS maquillée en « ban »
  assert.equal(r.sourceId, "EQ_RESEA0000000073015866");
});

test("LE SCORE NE DÉCIDE PAS, LA CATÉGORIE DÉCIDE : « hôpital de Purpan » n'est pas l'école qui le nomme", () => {
  // L'école est mieux classée (0,65 contre 0,42) et porte les deux mots du lecteur. Seule sa CATÉGORIE la
  // trahit. Un tri par score, ou un plancher à 0,6, se tromperait.
  const r = screenCandidates("l'hôpital de Purpan", [ECOLE, HOPITAL], CTX, META);
  assert.equal(r.status, "resolved");
  if (r.status !== "resolved") return;
  assert.equal(r.canonicalLabel, "Hôpital Purpan");
});

test("un candidat dont le libellé ne porte pas tous les mots du lecteur est rejeté", () => {
  const autre: GeocodeCandidate = { ...GARE, label: "Gare de Blagnac", sourceId: "X", lat: 43.63, lon: 1.39 };
  const r = screenCandidates("la gare Matabiau", [autre], CTX, META);
  assert.equal(r.status === "unresolved" && r.reason, "no_result");
});

test("le territoire déclaré ÉCARTE un candidat lointain, il ne le corrige pas", () => {
  const ailleurs: GeocodeCandidate = { ...GARE, citycode: "35238", dept: "35" };
  const r = screenCandidates("la gare Matabiau", [ailleurs], { departements: ["31"], degraded: false }, META);
  assert.equal(r.status, "unresolved");
});

test("CINQ GARES DE LYON, TOUTES AU MÊME SCORE : ambiguous, le produit ne tranche pas", () => {
  const g = (nom: string, lat: number, lon: number, id: string): GeocodeCandidate => ({
    ...GARE, label: nom, lat, lon, sourceId: id, score: 0.85, citycode: null, dept: null,
  });
  const r = screenCandidates("la gare de Lyon", [
    g("Gare de Lyon", 48.846, 2.373, "A"),
    g("Gare de Lyon-Perrache", 45.748, 4.826, "B"),
    g("Gare de Lyon-Guillotière", 45.74, 4.843, "C"), // à 2,5 km de Perrache : DEUX gares, pas une
  ], CTX, META);
  assert.equal(r.status, "ambiguous");
  if (r.status !== "ambiguous") return;
  assert.equal(r.candidates.length, 3);
});

test("le même objet vu par deux référentiels (même sourceId) n'est pas une ambiguïté", () => {
  const a = { ...GARE, score: 0.85 };
  const b = { ...GARE, lat: 43.6118, lon: 1.4538, score: 0.7 }; // même sourceId, coordonnées voisines
  const r = screenCandidates("la gare Matabiau", [a, b], CTX, META);
  assert.equal(r.status, "resolved");
  if (r.status !== "resolved") return;
  assert.equal(r.lat, 43.611448); // le mieux classé
});

test("deux référentiels décrivent la MÊME adresse avec deux libellés : pas d'ambiguïté fabriquée", () => {
  const ban: GeocodeCandidate = {
    label: "7 Rue du Taur 31000 Toulouse", kind: "address", lat: 43.6062, lon: 1.4432,
    citycode: "31555", dept: "31", score: 0.95, sourceId: "31555_0001", source: "ban", categories: [],
  };
  const igin: GeocodeCandidate = {
    label: "7 rue du Taur, Toulouse", kind: "address", lat: 43.6063, lon: 1.4433, // à ~15 m
    citycode: "31555", dept: "31", score: 0.9, sourceId: "IGN_1", source: "geoplateforme_poi", categories: [],
  };
  const r = screenCandidates("7 rue du Taur Toulouse", [ban, igin], CTX, META);
  assert.equal(r.status, "resolved");
  if (r.status !== "resolved") return;
  assert.equal(r.kind, "address");
});

test("UNE PANNE DES GÉOCODEURS N'EST PAS UN LIEU INTROUVABLE", () => {
  const r = screenCandidates("la gare Matabiau", [], { departements: [], degraded: true }, META);
  assert.equal(r.status === "unresolved" && r.reason, "geocoding_unavailable");
});

test("services debout, aucun candidat : no_result (et c'est une information, pas un échec)", () => {
  const r = screenCandidates("la gare de nulle part", [], CTX, META);
  assert.equal(r.status === "unresolved" && r.reason, "no_result");
});

test("un score sous le plancher anti-bruit est écarté", () => {
  const r = screenCandidates("la gare Matabiau", [{ ...GARE, score: 0.1 }], CTX, META);
  assert.equal(r.status === "unresolved" && r.reason, "low_confidence");
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec**

Run: `node --test src/lib/place-screening.test.ts`

- [ ] **Step 3 : Implémenter**

```ts
// src/lib/place-screening.ts
// LES CONTRÔLES. PURS : aucun réseau, aucun index.
//
// Un géocodeur répond TOUJOURS quelque chose, et son score classe la ressemblance des MOTS, pas la
// justesse du LIEU. Deux faits, vérifiés le 2026-07-14, commandent tout ce fichier :
//
//   « gare Matabiau »      -> la BAN rend « Rue Matabiau » (street, 0,71). Plausible. Faux.
//   « hôpital de Purpan »  -> le MIEUX CLASSÉ (0,65) est le « Centre de Formation Métiers de la Santé Chu
//                             Hôpital de Purpan ». Le vrai hôpital est à 0,42. Les deux portent les deux
//                             mots du lecteur : ni le score ni le libellé ne les séparent. SEULE LA
//                             CATÉGORIE le fait.
//
// D'où : le type attendu est déduit du libellé du lecteur, la catégorie décide, et le score n'est qu'un
// plancher anti-bruit. Un résultat seulement PLAUSIBLE ne devient jamais `resolved`.
import { haversineKm } from "./hard-constraints.ts";
import { normalizeName, type ResolutionMetadata, type ResolvedPlaceReference } from "./hard-constraints-resolve.ts";

export type GeocodeCandidate = {
  label: string;
  kind: "commune" | "station" | "address" | "poi" | "street";
  lat: number;
  lon: number;
  citycode: string | null;
  dept: string | null;
  score: number;
  sourceId: string | null;
  source: "geoplateforme_poi" | "ban";
  categories: string[];
};

export type ExpectedPlaceKind = "equipment" | "address" | "unspecified";
export type ScreeningContext = { departements: string[]; degraded: boolean };

// Le score classe la ressemblance des mots : il ne peut donc être qu'un plancher ANTI-BRUIT. À 0,6, il
// aurait éliminé l'hôpital de Purpan (0,42) au profit d'une école (0,65).
const MIN_SCORE = 0.3;
// Deux candidats à 300 m sont le même lieu vu par deux référentiels. Au-delà, ce sont deux lieux : les
// gares de Perrache et de la Guillotière sont à 2,5 km, et ce sont bien deux gares.
const SAME_PLACE_KM = 0.3;

// Les noms communs qui désignent un ÉQUIPEMENT, avec les catégories (BDTOPO) qui les confirment. C'est
// cette table, et elle seule, qui distingue l'hôpital de l'école qui porte son nom.
const EQUIPEMENTS: { mot: string; categories: string[] }[] = [
  { mot: "gare", categories: ["gare"] },
  { mot: "aeroport", categories: ["aérodrome", "aéroport", "transport"] },
  { mot: "hopital", categories: ["hôpital", "santé"] },
  { mot: "chu", categories: ["hôpital", "santé"] },
  { mot: "clinique", categories: ["hôpital", "santé", "clinique"] },
  { mot: "universite", categories: ["enseignement supérieur", "université"] },
  { mot: "campus", categories: ["enseignement supérieur", "université"] },
  { mot: "lycee", categories: ["enseignement", "lycée"] },
  { mot: "college", categories: ["enseignement", "collège"] },
  { mot: "ecole", categories: ["enseignement", "école"] },
  { mot: "port", categories: ["port"] },
  { mot: "plage", categories: ["plage", "littoral"] },
  { mot: "stade", categories: ["sport", "stade"] },
  { mot: "musee", categories: ["musée", "culture"] },
  { mot: "mairie", categories: ["administratif", "mairie"] },
  { mot: "prefecture", categories: ["administratif", "préfecture"] },
];
const MOTS_VIDES = new Set(["le", "la", "les", "l", "de", "du", "des", "d", "a", "au", "aux", "en", "et"]);

function mots(s: string): string[] {
  return normalizeName(s).split(" ").filter((w) => w.length > 0 && !MOTS_VIDES.has(w));
}

function equipementsVises(label: string): { mot: string; categories: string[] }[] {
  const m = new Set(mots(label));
  return EQUIPEMENTS.filter((e) => m.has(e.mot));
}

// Un numéro de voie en tête : le lecteur donne une ADRESSE, et un POI voisin n'a pas à la remplacer.
export function expectedKindOf(label: string): ExpectedPlaceKind {
  if (/^\s*\d+\s*(bis|ter|quater)?\s+\S/i.test(label)) return "address";
  return equipementsVises(label).length > 0 ? "equipment" : "unspecified";
}

const FAMILLE: Record<GeocodeCandidate["kind"], "equipment" | "address" | "commune"> = {
  station: "equipment", poi: "equipment", address: "address", street: "address", commune: "commune",
};

function categorieCompatible(c: GeocodeCandidate, attendus: { categories: string[] }[]): boolean {
  const cats = c.categories.map((x) => normalizeName(x));
  return attendus.some((e) => e.categories.some((want) => cats.some((cat) => cat.includes(normalizeName(want)))));
}

// Tous les mots significatifs du lecteur doivent se retrouver dans le libellé du candidat OU dans ses
// catégories : le POI « Hôpital Purpan » porte « hopital » dans son libellé, mais un POI nommé « Purpan »
// de catégorie « hôpital » répond aussi honnêtement au lecteur.
function libelleConcorde(label: string, c: GeocodeCandidate): boolean {
  const cible = new Set([...mots(c.label), ...c.categories.flatMap((cat) => mots(cat))]);
  return mots(label).every((w) => cible.has(w));
}

export function screenCandidates(
  label: string,
  candidates: GeocodeCandidate[],
  context: ScreeningContext,
  meta: ResolutionMetadata,
): ResolvedPlaceReference {
  // LA PANNE N'EST PAS UN CONSTAT. Si un géocodeur n'a pas répondu et qu'il ne reste rien, on ne sait pas
  // si le lieu existe : on le dit, et on retentera. Le lot 2b ne devra jamais persister cet état.
  const rienDeDispo = (reason: "no_result" | "low_confidence" | "unsupported_type"): ResolvedPlaceReference =>
    context.degraded
      ? { status: "unresolved", originalLabel: label, reason: "geocoding_unavailable", meta }
      : { status: "unresolved", originalLabel: label, reason, meta };

  if (candidates.length === 0) return rienDeDispo("no_result");

  const attendu = expectedKindOf(label);
  const equipements = equipementsVises(label);

  // CONTRÔLE 1, le type attendu, dans les DEUX sens : « la gare » n'est pas une rue, et « 7 rue du Taur »
  // n'est pas un point d'intérêt voisin.
  let recevables = candidates.filter((c) => {
    if (attendu === "equipment") return FAMILLE[c.kind] === "equipment";
    if (attendu === "address") return FAMILLE[c.kind] === "address" || FAMILLE[c.kind] === "commune";
    return true;
  });
  if (recevables.length === 0) return rienDeDispo("unsupported_type");

  // CONTRÔLE 2, LA CATÉGORIE, et c'est elle qui décide. Quand un candidat porte la catégorie du mot du
  // lecteur, ceux qui ne la portent pas sont écartés, si bien classés soient-ils : c'est ce qui empêche le
  // centre de formation de devenir l'hôpital.
  if (attendu === "equipment") {
    const bonneCategorie = recevables.filter((c) => categorieCompatible(c, equipements));
    if (bonneCategorie.length > 0) recevables = bonneCategorie;
  }

  // CONTRÔLE 3, la concordance du libellé.
  recevables = recevables.filter((c) => libelleConcorde(label, c));
  if (recevables.length === 0) return rienDeDispo("no_result");

  // CONTRÔLE 4, le territoire. Il DÉSAMBIGUÏSE, il ne force pas.
  const depts = new Set(context.departements);
  if (depts.size > 0) {
    const dedans = recevables.filter((c) => c.dept != null && depts.has(c.dept));
    if (dedans.length === 0) return rienDeDispo("no_result");
    recevables = dedans;
  }

  // CONTRÔLE 5, le plancher anti-bruit.
  recevables = recevables.filter((c) => c.score >= MIN_SCORE);
  if (recevables.length === 0) return rienDeDispo("low_confidence");

  const tries = [...recevables].sort((a, b) => b.score - a.score);
  const meilleur = tries[0]!;

  // LA DÉDUPLICATION, puis L'AMBIGUÏTÉ. Même identifiant : le même objet. Sinon, à moins de 300 m et dans
  // la même famille : le même lieu vu par deux référentiels (la Géoplateforme et la BAN décrivent une même
  // adresse avec deux libellés ; exiger l'égalité des libellés fabriquerait de faux « ambiguous »).
  const memeLieu = (a: GeocodeCandidate, b: GeocodeCandidate): boolean =>
    (a.sourceId != null && a.sourceId === b.sourceId) ||
    (FAMILLE[a.kind] === FAMILLE[b.kind] && haversineKm(a.lat, a.lon, b.lat, b.lon) <= SAME_PLACE_KM);

  const distincts = tries.filter((c) => !memeLieu(meilleur, c));
  if (distincts.length > 0) {
    // Deux lieux réels portent le même nom : on ne choisit pas à la place du lecteur.
    return {
      status: "ambiguous",
      originalLabel: label,
      candidates: [meilleur, ...distincts].map((c) => ({
        canonicalLabel: c.label, lat: c.lat, lon: c.lon, kind: c.kind,
      })),
      meta,
    };
  }

  return {
    status: "resolved",
    originalLabel: label,
    canonicalLabel: meilleur.label,
    kind: meilleur.kind === "street" ? "address" : meilleur.kind,
    lat: meilleur.lat,
    lon: meilleur.lon,
    source: meilleur.source, // la PROVENANCE est celle du référentiel qui a répondu, jamais maquillée
    sourceId: meilleur.sourceId,
    confidence: meilleur.score >= 0.8 ? "exact" : "high",
    meta,
  };
}
```

- [ ] **Step 4 : Lancer, vérifier**

Run: `node --test src/lib/place-screening.test.ts && npx tsc --noEmit`

- [ ] **Step 5 : Commit**

```bash
git add src/lib/place-screening.ts src/lib/place-screening.test.ts
git commit -m "feat(resolve): les contrôles du géocodage (la catégorie décide, le score n'est qu'un plancher, la panne n'est pas un lieu introuvable)"
```

---

## Task 5 : Le géocodeur (réseau), et la panne distinguée du silence

**Files:**
- Create: `src/lib/geocode-place.ts`, `src/lib/geocode-place.test.ts`
- Create: `src/lib/__fixtures__/geocode-poi-matabiau.json`, `src/lib/__fixtures__/geocode-ban-matabiau.json`

**Interfaces:**
- Produces:
  ```ts
  export type GeocodeOutcome = { candidates: GeocodeCandidate[]; degraded: boolean };
  export function parsePoiFeatures(payload: unknown): GeocodeCandidate[];   // PUR
  export function parseBanFeatures(payload: unknown): GeocodeCandidate[];   // PUR
  export async function geocodePlace(label: string): Promise<GeocodeOutcome>;
  ```

**Notes de conception :**
- `degraded: true` dès qu'**un** des deux services n'a pas répondu (réseau, timeout, 5xx, 429). Les contrôles
  en tirent `geocoding_unavailable` **s'il ne reste aucun candidat recevable**. Un service debout qui trouve
  la gare pendant que l'autre tombe reste une **résolution valide** : on ne jette pas ce qu'on a.
- Les deux services sont interrogés **en parallèle**, et leurs candidats **fusionnés** : ce sont les
  contrôles qui trient, pas l'ordre des appels.
- La Géoplateforme rend des **tableaux** là où la BAN rend des scalaires (`city: ["Toulouse"]`) : le parsing
  le sait.
- Le département vient de **`departementFromInsee`** (`src/lib/insee-departement.ts`), jamais d'un
  `slice(0, 2)` : celui-ci rend « 97 » pour les DOM, qui n'est pas un département. Le piège est déjà payé
  une fois dans ce dépôt.

- [ ] **Step 1 : Capturer les fixtures**

```bash
curl -s "https://data.geopf.fr/geocodage/search?q=gare%20matabiau&index=poi&limit=5" \
  > src/lib/__fixtures__/geocode-poi-matabiau.json
curl -s "https://api-adresse.data.gouv.fr/search/?q=gare+matabiau+toulouse&limit=5" \
  > src/lib/__fixtures__/geocode-ban-matabiau.json
```

- [ ] **Step 2 : Écrire le test qui échoue**

```ts
// src/lib/geocode-place.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parsePoiFeatures, parseBanFeatures } from "./geocode-place.ts";

const poi = JSON.parse(readFileSync(new URL("./__fixtures__/geocode-poi-matabiau.json", import.meta.url), "utf8"));
const ban = JSON.parse(readFileSync(new URL("./__fixtures__/geocode-ban-matabiau.json", import.meta.url), "utf8"));

test("la Géoplateforme rend la GARE, avec son type, sa commune, ses catégories et son identifiant", () => {
  const [c] = parsePoiFeatures(poi);
  assert.ok(c);
  assert.equal(c.label, "Gare Matabiau");
  assert.equal(c.kind, "station");
  assert.equal(c.citycode, "31555");
  assert.equal(c.dept, "31");
  assert.equal(c.source, "geoplateforme_poi");
  assert.ok(c.categories.length > 0);
  assert.ok(Math.abs(c.lat - 43.611) < 0.01 && Math.abs(c.lon - 1.453) < 0.01);
});

test("la BAN, elle, rend une RUE : le parsing le dit, il ne le maquille pas", () => {
  const [c] = parseBanFeatures(ban);
  assert.ok(c);
  assert.equal(c.kind, "street");
  assert.match(c.label, /Rue Matabiau/);
  assert.equal(c.source, "ban");
  assert.equal(c.dept, "31");
});

test("le département passe par departementFromInsee (les DOM ne sont pas « 97 »)", () => {
  const dom = { features: [{ geometry: { coordinates: [55.45, -20.87] },
    properties: { label: "Rue de Paris 97400 Saint-Denis", score: 0.9, type: "street", citycode: "97411" } }] };
  assert.equal(parseBanFeatures(dom)[0]?.dept, "974");
});

test("un payload vide ou malformé ne jette pas, il rend une liste vide", () => {
  assert.deepEqual(parsePoiFeatures(null), []);
  assert.deepEqual(parsePoiFeatures({ features: [{ properties: {} }] }), []);
  assert.deepEqual(parseBanFeatures({}), []);
});
```

- [ ] **Step 3 : Lancer, vérifier l'échec**

Run: `node --test src/lib/geocode-place.test.ts`

- [ ] **Step 4 : Implémenter**

```ts
// src/lib/geocode-place.ts
// LE GÉOCODAGE D'UN LIEU NOMMÉ. Le réseau vit ici, et NULLE PART ailleurs dans la chaîne : le parsing (pur)
// et les contrôles (place-screening.ts, pur) sont testables sans lui.
//
// DEUX SOURCES, et il en faut deux. La BAN ne connaît que des adresses : interrogée sur « gare Matabiau »,
// elle rend « Rue Matabiau ». La Géoplateforme (index=poi, BDTOPO) connaît les équipements. On interroge
// les deux et on FUSIONNE : ce sont les contrôles qui trient, pas l'ordre des appels.
//
// ET ON DIT QUAND ON N'A PAS PU DEMANDER. `degraded` distingue « les services ont répondu, ce lieu n'existe
// pas » de « les services n'ont pas répondu ». Sans ce drapeau, une panne réseau deviendrait un lieu
// introuvable, et le lot 2b le persisterait comme une impossibilité stable.
import { departementFromInsee } from "./insee-departement.ts";
import type { GeocodeCandidate } from "./place-screening.ts";

const POI_URL = "https://data.geopf.fr/geocodage/search";
const BAN_URL = "https://api-adresse.data.gouv.fr/search/";
const TIMEOUT_MS = 6000;

export type GeocodeOutcome = { candidates: GeocodeCandidate[]; degraded: boolean };

type Feature = { geometry?: { coordinates?: unknown }; properties?: Record<string, unknown> };

function coords(f: Feature): [number, number] | null {
  const c = f.geometry?.coordinates;
  if (!Array.isArray(c) || c.length < 2) return null;
  const [lon, lat] = c as [unknown, unknown];
  if (typeof lon !== "number" || typeof lat !== "number") return null;
  return [lat, lon]; // GeoJSON écrit [lon, lat] ; notre code parle (lat, lon)
}

// La Géoplateforme rend des TABLEAUX là où la BAN rend des scalaires (city: ["Toulouse"]).
function first(v: unknown): string | null {
  if (typeof v === "string") return v.trim() || null;
  if (Array.isArray(v) && typeof v[0] === "string") return (v[0] as string).trim() || null;
  return null;
}
function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
// JAMAIS citycode.slice(0, 2) : « 97411 » rendrait « 97 », qui n'est pas un département.
function dept(p: Record<string, unknown>): string | null {
  const code = first(p.citycode);
  return (code ? departementFromInsee(code) : null) ?? first(p.depcode);
}

export function parsePoiFeatures(payload: unknown): GeocodeCandidate[] {
  const features = (payload as { features?: unknown })?.features;
  if (!Array.isArray(features)) return [];
  const out: GeocodeCandidate[] = [];
  for (const f of features as Feature[]) {
    const p = f?.properties ?? {};
    const xy = coords(f);
    const label = first(p.toponym) ?? first(p.name);
    const score = num(p.score);
    if (!xy || !label || score == null) continue;
    const cats = Array.isArray(p.category)
      ? (p.category as unknown[]).filter((c): c is string => typeof c === "string")
      : [];
    out.push({
      label,
      kind: cats.some((c) => c.toLowerCase().includes("gare")) ? "station" : "poi",
      lat: xy[0], lon: xy[1],
      citycode: first(p.citycode),
      dept: dept(p),
      score,
      sourceId: first((p.extrafields as Record<string, unknown> | undefined)?.cleabs),
      source: "geoplateforme_poi",
      categories: cats,
    });
  }
  return out;
}

const BAN_KIND: Record<string, GeocodeCandidate["kind"]> = {
  housenumber: "address", street: "street", municipality: "commune", locality: "poi",
};

export function parseBanFeatures(payload: unknown): GeocodeCandidate[] {
  const features = (payload as { features?: unknown })?.features;
  if (!Array.isArray(features)) return [];
  const out: GeocodeCandidate[] = [];
  for (const f of features as Feature[]) {
    const p = f?.properties ?? {};
    const xy = coords(f);
    const label = first(p.label);
    const score = num(p.score);
    const type = first(p.type);
    const kind = type ? BAN_KIND[type] : undefined;
    if (!xy || !label || score == null || !kind) continue;
    out.push({
      label, kind, lat: xy[0], lon: xy[1],
      citycode: first(p.citycode),
      dept: dept(p),
      score,
      sourceId: first(p.id),
      source: "ban",
      categories: [],
    });
  }
  return out;
}

// `null` = le service n'a pas répondu (réseau, timeout, 5xx, 429). Ce n'est PAS « zéro résultat ».
async function get(url: string): Promise<unknown | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      signal: controller.signal,
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function geocodePlace(label: string): Promise<GeocodeOutcome> {
  const q = label.trim();
  if (q.length < 3) return { candidates: [], degraded: false };
  const [poi, ban] = await Promise.all([
    get(`${POI_URL}?${new URLSearchParams({ q, index: "poi", limit: "5" })}`),
    get(`${BAN_URL}?${new URLSearchParams({ q, limit: "5" })}`),
  ]);
  return {
    candidates: [...parsePoiFeatures(poi), ...parseBanFeatures(ban)],
    // Un service debout qui trouve la gare pendant que l'autre tombe reste une résolution VALIDE : les
    // contrôles ne lèveront `geocoding_unavailable` que s'il ne reste aucun candidat recevable.
    degraded: poi === null || ban === null,
  };
}
```

- [ ] **Step 5 : Lancer, vérifier**

Run: `node --test src/lib/geocode-place.test.ts && npx tsc --noEmit`

- [ ] **Step 6 : Commit**

```bash
git add src/lib/geocode-place.ts src/lib/geocode-place.test.ts src/lib/__fixtures__/geocode-poi-matabiau.json src/lib/__fixtures__/geocode-ban-matabiau.json
git commit -m "feat(geocode): la Géoplateforme (POI) et la BAN interrogées ensemble, et la panne distinguée du silence"
```

---

## Task 6 : L'isochrone (réseau, cache, et dédup des appels en vol)

**Files:**
- Create: `src/lib/isochrone.ts`, `src/lib/isochrone.test.ts`
- Create: `src/lib/__fixtures__/isochrone-matabiau-30min-car.json`

**Interfaces:**
- Produces:
  ```ts
  export type ReachabilityRequest = {
    lat: number; lon: number; maxMinutes: number; mode: "car" | "walk"; direction: "to_reference";
  };
  export const ISOCHRONE_VERSION: string;
  export function reachabilityRequestHash(r: ReachabilityRequest): string;   // PUR
  export function parseIsochrone(payload: unknown): PolygonGeometry | null;  // PUR
  export async function getReachability(r: ReachabilityRequest): Promise<ReachabilityState>;
  ```

**Notes de conception :**
- **Le sens du trajet est fixé** : « habiter à moins de 30 minutes de la gare » veut dire *domicile → gare*,
  soit `direction=arrival` côté IGN. Le sens inverse ne le remplace jamais en silence.
- Le `requestHash` porte les **coordonnées** (6 décimales), la durée, le mode, le sens, la ressource et
  `ISOCHRONE_VERSION`. **Jamais un identifiant de lieu** : un même identifiant peut recevoir des coordonnées
  corrigées.
- **Le cache dédoublonne aussi les appels EN VOL.** Sans cela, deux lecteurs simultanés sur la même gare
  partent tous les deux vers IGN, qui rate-limite (429 vérifié). Le cache des succès est **borné** (200
  entrées, 24 h) : un polygone pèse une trentaine de kilo-octets, et un process ne doit pas enfler
  indéfiniment.
- Les **échecs ne sont pas mis en cache** : un 429 se retente.

- [ ] **Step 1 : Capturer la fixture**

```bash
curl -s "https://data.geopf.fr/navigation/isochrone?resource=bdtopo-valhalla&point=1.453496,43.611448&costValue=1800&costType=time&profile=car&direction=arrival" \
  > src/lib/__fixtures__/isochrone-matabiau-30min-car.json
```

- [ ] **Step 2 : Écrire le test qui échoue**

```ts
// src/lib/isochrone.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseIsochrone, reachabilityRequestHash } from "./isochrone.ts";
import { pointInPolygon } from "./geo-polygon.ts";

const iso = JSON.parse(readFileSync(new URL("./__fixtures__/isochrone-matabiau-30min-car.json", import.meta.url), "utf8"));

test("la réponse IGN rend un polygone exploitable", () => {
  const g = parseIsochrone(iso);
  assert.ok(g);
  assert.equal(g.type, "Polygon");
});

test("LE POLYGONE EST DANS LE BON SENS : Toulouse est dedans, Bordeaux est dehors", () => {
  const g = parseIsochrone(iso)!;
  // Le contrôle d'inversion lon/lat, de bout en bout : à l'envers, Toulouse sortirait DEHORS.
  assert.equal(pointInPolygon(43.6045, 1.4442, g, 300), "inside");
  assert.equal(pointInPolygon(44.8378, -0.5792, g, 300), "outside");
});

test("une réponse vide ou sans géométrie rend null, jamais un polygone vide", () => {
  assert.equal(parseIsochrone(null), null);
  assert.equal(parseIsochrone({}), null);
  assert.equal(parseIsochrone({ geometry: { type: "Point", coordinates: [1, 43] } }), null);
});

test("le hash porte les COORDONNÉES, pas un identifiant de lieu", () => {
  const base = { lat: 43.611448, lon: 1.453496, maxMinutes: 30, mode: "car", direction: "to_reference" } as const;
  assert.equal(reachabilityRequestHash(base), reachabilityRequestHash({ ...base }));
  assert.notEqual(reachabilityRequestHash(base), reachabilityRequestHash({ ...base, lat: 43.7 }));
  assert.notEqual(reachabilityRequestHash(base), reachabilityRequestHash({ ...base, maxMinutes: 20 }));
  assert.notEqual(reachabilityRequestHash(base), reachabilityRequestHash({ ...base, mode: "walk" }));
});
```

- [ ] **Step 3 : Lancer, vérifier l'échec**

Run: `node --test src/lib/isochrone.test.ts`

- [ ] **Step 4 : Implémenter**

```ts
// src/lib/isochrone.ts
// L'ATTEIGNABILITÉ. Un polygone calculé UNE fois depuis le lieu, puis 35 000 communes testées localement.
// Jamais un appel par commune, jamais un haversine déguisé en temps de trajet.
//
// LE CACHE N'EST PAS UNE OPTIMISATION : l'API IGN rate-limite (429 vérifié le 2026-07-14). Et il ne suffit
// pas de garder les succès : il faut DÉDOUBLONNER LES APPELS EN VOL, sinon deux lecteurs simultanés sur la
// même gare partent tous les deux vers IGN avant que le premier n'ait rempli le cache. (Le lot 2b le
// remplacera par la table reachability_artifact, partagée entre instances.)
//
// Un échec ne rend JAMAIS de géométrie de repli, et ne se convertit JAMAIS en kilomètres : il rend
// routing_unavailable, un état technique, retentable.
import { createHash } from "node:crypto";
import type { PolygonGeometry } from "./geo-polygon.ts";
import { PRODUCT_CONVENTIONS, type ReachabilityState } from "./hard-constraints.ts";

const ISOCHRONE_URL = "https://data.geopf.fr/navigation/isochrone";
const RESOURCE = "bdtopo-valhalla";
const TIMEOUT_MS = 10_000;
export const ISOCHRONE_VERSION = "iso-1"; // la version de NOTRE intégration (paramètres, parsing)

const MAX_ENTRIES = 200; // un polygone pèse ~30 ko : un process ne doit pas enfler indéfiniment
const TTL_MS = 24 * 60 * 60 * 1000;

// Le moteur IGN ne connaît que ces deux profils : `bike` rend HTTP 400. Le noyau l'a déjà écarté
// (ROUTABLE_MODES) avant d'arriver ici.
const PROFILE: Record<"car" | "walk", string> = { car: "car", walk: "pedestrian" };

export type ReachabilityRequest = {
  lat: number; lon: number; maxMinutes: number; mode: "car" | "walk"; direction: "to_reference";
};

// LES COORDONNÉES, PAS UN IDENTIFIANT : un même identifiant de lieu peut recevoir des coordonnées
// corrigées, et le hash porterait alors une géométrie qui ne correspond plus au point.
export function reachabilityRequestHash(r: ReachabilityRequest): string {
  return createHash("sha256")
    .update([r.lat.toFixed(6), r.lon.toFixed(6), String(r.maxMinutes), r.mode, r.direction, RESOURCE, ISOCHRONE_VERSION].join("|"))
    .digest("hex")
    .slice(0, 32);
}

export function parseIsochrone(payload: unknown): PolygonGeometry | null {
  const g = (payload as { geometry?: unknown })?.geometry as PolygonGeometry | undefined;
  if (!g || (g.type !== "Polygon" && g.type !== "MultiPolygon")) return null;
  if (!Array.isArray(g.coordinates) || g.coordinates.length === 0) return null;
  return g;
}

const cache = new Map<string, { geometry: PolygonGeometry; at: number }>();
// Les appels EN VOL : deux requêtes concurrentes sur la même gare partagent la même promesse.
const inFlight = new Map<string, Promise<PolygonGeometry | null>>();

function ready(geometry: PolygonGeometry): ReachabilityState {
  return { status: "ready", geometry, toleranceMeters: PRODUCT_CONVENTIONS.reachabilityBorderToleranceM };
}

async function fetchGeometry(r: ReachabilityRequest): Promise<PolygonGeometry | null> {
  // « Habiter à moins de 30 minutes de la gare » veut dire domicile -> gare : direction=arrival. Le sens
  // inverse donnerait un autre polygone, et il ne le remplace jamais en silence.
  const url = `${ISOCHRONE_URL}?${new URLSearchParams({
    resource: RESOURCE,
    point: `${r.lon},${r.lat}`, // l'API attend lon,lat
    costValue: String(r.maxMinutes * 60),
    costType: "time",
    timeUnit: "second",
    profile: PROFILE[r.mode],
    direction: "arrival",
  })}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { accept: "application/json" }, signal: controller.signal });
    if (!res.ok) return null; // 429 compris
    return parseIsochrone(await res.json());
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getReachability(r: ReachabilityRequest): Promise<ReachabilityState> {
  const key = reachabilityRequestHash(r);

  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return ready(hit.geometry);
  if (hit) cache.delete(key);

  let pending = inFlight.get(key);
  if (!pending) {
    pending = fetchGeometry(r);
    inFlight.set(key, pending);
    // Les ÉCHECS ne sont pas mis en cache : un 429 se retente.
    pending
      .then((g) => {
        if (g) {
          if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
          cache.set(key, { geometry: g, at: Date.now() });
        }
      })
      .finally(() => inFlight.delete(key));
  }

  const geometry = await pending;
  return geometry ? ready(geometry) : { status: "unavailable", reason: "routing_unavailable" };
}
```

- [ ] **Step 5 : Lancer, vérifier**

Run: `node --test src/lib/isochrone.test.ts && npx tsc --noEmit`

- [ ] **Step 6 : Commit**

```bash
git add src/lib/isochrone.ts src/lib/isochrone.test.ts src/lib/__fixtures__/isochrone-matabiau-30min-car.json
git commit -m "feat(isochrone): l'atteignabilité IGN, calculée une fois, dédoublonnée en vol, et honnête sur ses pannes"
```

---

## Task 7 : La résolution externe, au-dessus des deux moteurs

**Files:**
- Create: `src/lib/hard-constraints-external.ts`, `src/lib/hard-constraints-external.test.ts`
- Modify: `src/lib/hard-constraints-hydrate.ts`, `src/lib/comparateur-vie.ts`,
  `src/lib/decision/territory-facts.ts`

**Interfaces:**
- Produces:
  ```ts
  export type ExternalResolutions = {
    place: ResolvedPlaceReference | null;
    reachability: ReachabilityState | null;
  };
  export type ExternalDeps = {
    geocodePlace: (label: string) => Promise<GeocodeOutcome>;
    getReachability: (r: ReachabilityRequest) => Promise<ReachabilityState>;
  };
  export async function resolveExternalReferences(
    hc: HardConstraints | null | undefined, dir: PlaceDirectory, deps?: ExternalDeps,
  ): Promise<ExternalResolutions>;

  // hard-constraints-hydrate.ts
  export function hydrateHardConstraints(
    hc: HardConstraints | undefined | null, dir: PlaceDirectory | null, ext?: ExternalResolutions,
  ): NormalizedHardConstraints;
  ```

**Notes de conception :**
- **L'hydratation reste PURE**, et elle est appelée **deux fois** : une première pour savoir *ce qu'il faut
  résoudre* (l'index suffit-il ? y a-t-il un seuil de temps ?), une seconde par les moteurs, avec le sac.
  Aucun `fetch` n'entre dans le noyau, qui reste testable sous `node --test`.
- **L'index des communes garde la priorité** : « près de Brest » ne part **jamais** géocoder.
- **Les dépendances sont injectables** : les tests **comptent les appels réseau**. Un test qui ne vérifierait
  que l'injection manuelle du sac ne prouverait rien de l'orchestrateur.
- **Un seul appel de chaque, au plus, par recherche** : la référence est **globale**, pas communale.

- [ ] **Step 1 : Écrire les tests qui échouent**

```ts
// src/lib/hard-constraints-external.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveExternalReferences, type ExternalDeps } from "./hard-constraints-external.ts";
import { hydrateHardConstraints } from "./hard-constraints-hydrate.ts";
import type { PlaceDirectory } from "./hard-constraints-resolve.ts";
import type { GeocodeCandidate } from "./place-screening.ts";

const dir: PlaceDirectory = {
  byName: (l) =>
    l === "brest"
      ? { insee: "29019", nom: "Brest", lat: 48.39, lon: -4.48, uu: "29701", tailleVille: 210000 }
      : null,
  plmByName: () => null,
};

const GARE: GeocodeCandidate = {
  label: "Gare Matabiau", kind: "station", lat: 43.611448, lon: 1.453496, citycode: "31555", dept: "31",
  score: 0.85, sourceId: "EQ_1", source: "geoplateforme_poi", categories: ["gare voyageurs uniquement"],
};

function spies(over: Partial<ExternalDeps> = {}) {
  const calls = { geocode: 0, reach: 0 };
  const deps: ExternalDeps = {
    geocodePlace: async () => { calls.geocode++; return { candidates: [GARE], degraded: false }; },
    getReachability: async () => {
      calls.reach++;
      return { status: "ready", geometry: { type: "Polygon", coordinates: [[[1.3, 43.5], [1.6, 43.5], [1.6, 43.7], [1.3, 43.7], [1.3, 43.5]]] }, toleranceMeters: 300 };
    },
    ...over,
  };
  return { deps, calls };
}

test("« près de Brest » : l'index suffit, AUCUN appel au géocodeur", async () => {
  const { deps, calls } = spies();
  const ext = await resolveExternalReferences({ nearPlace: { label: "Brest", maxKm: 30 } }, dir, deps);
  assert.equal(calls.geocode, 0);
  assert.equal(calls.reach, 0);
  assert.equal(ext.place, null); // l'index a résolu : rien à injecter
  const n = hydrateHardConstraints({ nearPlace: { label: "Brest", maxKm: 30 } }, dir, ext);
  assert.equal(n.nearPlace?.reference.status, "resolved");
});

test("« la gare Matabiau » : un appel au géocodeur, et la référence entre dans l'état hydraté", async () => {
  const hc = { nearPlace: { label: "la gare Matabiau", maxKm: 20 } };
  const { deps, calls } = spies();
  const ext = await resolveExternalReferences(hc, dir, deps);
  assert.equal(calls.geocode, 1);
  assert.equal(calls.reach, 0); // une DISTANCE ne demande aucune isochrone
  const n = hydrateHardConstraints(hc, dir, ext);
  assert.equal(n.nearPlace?.reference.status, "resolved");
});

test("un temps de trajet en voiture : UNE isochrone, depuis le lieu", async () => {
  const hc = { nearPlace: { label: "la gare Matabiau", maxMinutes: 30, mode: "car" as const } };
  const { deps, calls } = spies();
  const ext = await resolveExternalReferences(hc, dir, deps);
  assert.equal(calls.reach, 1);
  assert.equal(ext.reachability?.status, "ready");
  const n = hydrateHardConstraints(hc, dir, ext);
  assert.equal(n.nearPlace?.reachability?.status, "ready");
});

test("le VÉLO ne part pas vers un moteur qui ne sait pas le calculer", async () => {
  const { deps, calls } = spies();
  await resolveExternalReferences(
    { nearPlace: { label: "la gare Matabiau", maxMinutes: 30, mode: "bike" } }, dir, deps,
  );
  assert.equal(calls.reach, 0);
});

test("un temps SANS MODE ne part pas non plus (on ne devine pas la voiture)", async () => {
  const { deps, calls } = spies();
  await resolveExternalReferences({ nearPlace: { label: "la gare Matabiau", maxMinutes: 30 } }, dir, deps);
  assert.equal(calls.reach, 0);
});

test("UNE PANNE DU GÉOCODEUR N'EST PAS UN LIEU INTROUVABLE", async () => {
  const { deps } = spies({ geocodePlace: async () => ({ candidates: [], degraded: true }) });
  const ext = await resolveExternalReferences({ nearPlace: { label: "la gare Matabiau", maxKm: 20 } }, dir, deps);
  assert.equal(ext.place?.status, "unresolved");
  if (ext.place?.status !== "unresolved") return;
  assert.equal(ext.place.reason, "geocoding_unavailable");
});

test("une référence non résolue ne déclenche AUCUNE isochrone (on ne route pas depuis un point inconnu)", async () => {
  const { deps, calls } = spies({ geocodePlace: async () => ({ candidates: [], degraded: false }) });
  await resolveExternalReferences(
    { nearPlace: { label: "la gare de nulle part", maxMinutes: 30, mode: "car" } }, dir, deps,
  );
  assert.equal(calls.reach, 0);
});

test("sans nearPlace, la chaîne externe ne fait rien du tout", async () => {
  const { deps, calls } = spies();
  const ext = await resolveExternalReferences({ departements: ["31"] }, dir, deps);
  assert.deepEqual(ext, { place: null, reachability: null });
  assert.equal(calls.geocode + calls.reach, 0);
});

test("le contexte territorial déclaré est passé aux contrôles (il désambiguïse)", async () => {
  let vu: string | null = null;
  const { deps } = spies({
    geocodePlace: async (label) => { vu = label; return { candidates: [GARE], degraded: false }; },
  });
  await resolveExternalReferences(
    { departements: ["31"], nearPlace: { label: "la gare Matabiau", maxKm: 20 } }, dir, deps,
  );
  assert.equal(vu, "la gare Matabiau");
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec**

Run: `node --test src/lib/hard-constraints-external.test.ts`

- [ ] **Step 3 : Implémenter l'hydratation avec le sac**

```ts
// src/lib/hard-constraints-hydrate.ts
import type { ExternalResolutions } from "./hard-constraints-external.ts"; // TYPE seulement : le module
                                                                            // fait du réseau, et l'importer
                                                                            // en valeur rendrait
                                                                            // l'hydratation non testable.

export function hydrateHardConstraints(
  hc: HardConstraints | undefined | null,
  dir: PlaceDirectory | null,
  ext?: ExternalResolutions,
): NormalizedHardConstraints {
  // …
    nearPlace: (() => {
      const np = c.nearPlace;
      if (!np?.label || !dir) return null;
      // LE SAC PRIME sur l'index, et il ne contient QUE ce que l'index ne savait pas résoudre : « près de
      // Brest » n'est donc jamais parti géocoder.
      const reference = ext?.place ?? resolveNearPlace(np.label, dir, input);
      return {
        label: np.label,
        threshold: nearPlaceThreshold(np),
        reference,
        reachability: ext?.reachability ?? null,
      };
    })(),
  // …
}
```

- [ ] **Step 4 : Implémenter la résolution externe**

```ts
// src/lib/hard-constraints-external.ts
// LA RÉSOLUTION EXTERNE, AU-DESSUS DES DEUX MOTEURS. C'est ici, et seulement ici, que la chaîne des
// contraintes dures touche le réseau.
//
// Ni le comparateur ni le dossier ne résolvent un label eux-mêmes : ils traversent la MÊME chaîne, avec le
// même contrat et le même cache de process. (Ils ne reçoivent pas encore le même objet GELÉ : un géocodage
// réussi ici et un 429 là restent possibles, et deux instances ont deux caches. C'est la persistance du lot
// 2b qui apportera cette garantie-là, et il ne faut pas l'annoncer avant.)
//
// LES DÉPENDANCES SONT INJECTABLES : les tests comptent les appels réseau. « Près de Brest » ne doit pas
// géocoder, un seuil en kilomètres ne doit pas router, et le vélo ne doit pas partir vers un moteur qui ne
// sait pas le calculer.
import { hydrateHardConstraints } from "./hard-constraints-hydrate.ts";
import { geocodePlace as geocodePlaceImpl, type GeocodeOutcome } from "./geocode-place.ts";
import { screenCandidates } from "./place-screening.ts";
import { getReachability as getReachabilityImpl, type ReachabilityRequest } from "./isochrone.ts";
import {
  resolutionInputHash, RESOLVER_VERSION,
  type PlaceDirectory, type ResolvedPlaceReference,
} from "./hard-constraints-resolve.ts";
import { ROUTABLE_MODES, type ReachabilityState } from "./hard-constraints.ts";
import type { HardConstraints } from "./hard-constraint-schema.ts";

export type ExternalResolutions = {
  place: ResolvedPlaceReference | null; // null = l'index a suffi, il n'y a rien à injecter
  reachability: ReachabilityState | null;
};

export type ExternalDeps = {
  geocodePlace: (label: string) => Promise<GeocodeOutcome>;
  getReachability: (r: ReachabilityRequest) => Promise<ReachabilityState>;
};

const DEFAULT_DEPS: ExternalDeps = {
  geocodePlace: geocodePlaceImpl,
  getReachability: getReachabilityImpl,
};

export async function resolveExternalReferences(
  hc: HardConstraints | null | undefined,
  dir: PlaceDirectory,
  deps: ExternalDeps = DEFAULT_DEPS,
): Promise<ExternalResolutions> {
  const label = hc?.nearPlace?.label?.trim();
  if (!label) return { place: null, reachability: null };

  // 1. CE QUE L'INDEX SAIT DÉJÀ FAIRE. Le géocodeur n'est appelé que sur ce qu'il ne connaît pas.
  const base = hydrateHardConstraints(hc, dir);
  const np = base.nearPlace;
  if (!np) return { place: null, reachability: null };

  let place: ResolvedPlaceReference | null = null;
  let reference = np.reference;
  if (reference.status !== "resolved") {
    const departements = hc?.departements ?? [];
    const outcome = await deps.geocodePlace(label);
    place = screenCandidates(label, outcome.candidates, { departements, degraded: outcome.degraded }, {
      inputHash: resolutionInputHash(label, departements.join(","), "place"),
      resolverVersion: RESOLVER_VERSION,
    });
    reference = place;
  }

  // 2. L'ATTEIGNABILITÉ. Un seul appel, depuis le LIEU, jamais par commune. On ne route pas depuis un point
  //    inconnu, on ne devine pas un mode, et on n'envoie pas le vélo à un moteur qui rend HTTP 400.
  const t = np.threshold;
  if (
    reference.status !== "resolved" ||
    t == null || t.metric !== "travel_time" || t.mode == null || !ROUTABLE_MODES.includes(t.mode)
  ) {
    return { place, reachability: null };
  }

  const reachability = await deps.getReachability({
    lat: reference.lat, lon: reference.lon,
    maxMinutes: t.maxMinutes,
    mode: t.mode as "car" | "walk",
    direction: "to_reference",
  });
  return { place, reachability };
}
```

- [ ] **Step 5 : Brancher les deux moteurs**

```ts
// src/lib/comparateur-vie.ts — dans matchProjects
  const dir = await placeDirectory();
  const constraints = hydrateHardConstraints(hc, dir, await resolveExternalReferences(hc, dir));
```

```ts
// src/lib/decision/territory-facts.ts — dans buildHardContext
  const dir = await placeDirectory();
  const hcRaw = project.parsed?.hardConstraints;
  const ext = await resolveExternalReferences(hcRaw, dir);
  return {
    constraints: hydrateHardConstraints(hcRaw, dir, ext),
    point: /* inchangé */,
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };
```

- [ ] **Step 6 : Lancer la suite complète**

Run: `node --test src/lib/*.test.ts src/lib/decision/*.test.ts && npx tsc --noEmit`
Expected: tout vert, `tsc` rend 0.

- [ ] **Step 7 : Commit**

```bash
git add src/lib/hard-constraints-external.ts src/lib/hard-constraints-external.test.ts src/lib/hard-constraints-hydrate.ts src/lib/comparateur-vie.ts src/lib/decision/territory-facts.ts
git commit -m "feat(contraintes-dures): la résolution externe (géocodage + isochrone) au-dessus des deux moteurs, dépendances injectables"
```

---

## Task 8 : Le lecteur peut enfin poser la contrainte (le parse)

**Files:**
- Modify: `src/app/api/comparateur-vie/parse/route.ts`

**Notes de conception :**
- La description **interdit explicitement la conversion** : c'est le garde-fou contre un LLM qui écrirait
  `maxKm: 30` pour « 30 minutes ».
- Le lieu **n'est pas forcément une commune**. C'est le prompt qui bloquait le cas d'usage, autant que le
  moteur.
- **L'ambiguïté ne propose PAS le vélo** : le produit n'invite pas le lecteur à choisir une option dont il
  sait déjà qu'il ne saura pas l'évaluer. Si le lecteur le mentionne spontanément, le parse le garde
  (`mode: "bike"`) et le moteur explique honnêtement qu'il ne sait pas calculer ce trajet.

- [ ] **Step 1 : Étendre le schéma d'outil**

```ts
// src/app/api/comparateur-vie/parse/route.ts — remplacer la propriété nearPlace
        nearPlace: {
          type: ["object", "null"],
          properties: {
            label: { type: "string" },
            maxKm: { type: ["number", "null"] },
            maxMinutes: { type: ["number", "null"] },
            mode: { type: ["string", "null"], enum: ["car", "walk", "bike", null] },
          },
          required: ["label"],
          description:
            "Proximité d'un lieu nommé. Le lieu N'EST PAS forcément une commune : ce peut être une gare (« la gare Matabiau »), un hôpital, une université, une adresse. Recopiez le lieu tel que l'utilisateur le nomme, sans le remplacer par sa ville. NE CONVERTISSEZ JAMAIS un temps en distance : « à 30 minutes » va dans maxMinutes (jamais dans maxKm), « à 20 km » dans maxKm. mode = le moyen de transport SEULEMENT s'il est dit (« en voiture » car, « à pied » walk, « à vélo » bike) ; sinon null.",
        },
```

- [ ] **Step 2 : Étendre le prompt**

Ajouter au `SYSTEM`, dans la section des champs voisins :

```
PROXIMITÉ D'UN LIEU (nearPlace) : le lieu n'est pas forcément une ville
- « près de Brest », « à 20 km de la gare Matabiau », « à 30 minutes de l'hôpital de Purpan » : nearPlace. Le label est le lieu TEL QUE NOMMÉ (« la gare Matabiau »), jamais la ville qui le contient.
- Un temps de trajet va dans maxMinutes, une distance dans maxKm. NE CONVERTISSEZ JAMAIS l'un en l'autre : « 30 minutes » n'est pas « 30 km », et le système sait calculer un vrai temps de trajet.
- Le mode de transport n'est renseigné que s'il est DIT. S'il manque alors qu'un temps est donné, ajoutez une ambiguïté : topic « le trajet vers {lieu} », question « Vos {N} minutes de {lieu} : à pied ou en voiture ? ».
- Une distance sans chiffre (« près de Brest ») laisse maxKm à null : n'inventez aucun rayon.
```

- [ ] **Step 3 : Vérifier le parse sur les trois phrases, en vrai**

```bash
npm run dev
```

```bash
curl -s localhost:3000/api/comparateur-vie/parse -H 'content-type: application/json' \
  -d '{"text":"On cherche une petite ville à moins de 30 minutes en voiture de la gare Matabiau, au calme."}' \
  | python3 -m json.tool
```
Attendu : `label: "la gare Matabiau"`, `maxMinutes: 30`, `mode: "car"`, `maxKm: null`.

```bash
curl -s localhost:3000/api/comparateur-vie/parse -H 'content-type: application/json' \
  -d '{"text":"Il nous faut être à 30 minutes de la gare Matabiau."}' | python3 -m json.tool
```
Attendu : `mode: null`, **et une ambiguïté** sur le mode, **sans le vélo dans la question**.

```bash
curl -s localhost:3000/api/comparateur-vie/parse -H 'content-type: application/json' \
  -d '{"text":"Une ville à 20 km de Brest, pas trop grande."}' | python3 -m json.tool
```
Attendu : `maxKm: 20`, `maxMinutes: null`.

- [ ] **Step 4 : Commit**

```bash
git add src/app/api/comparateur-vie/parse/route.ts
git commit -m "feat(parse): le lecteur peut poser un temps de trajet, un mode, et un lieu qui n'est pas une commune"
```

---

## Task 9 : La vérification à l'écran, comparateur ET dossier

Le lot branche les **deux** moteurs : le vérifier sur le seul comparateur laisserait la moitié du chantier
sans preuve. Le **changement de grain** (centroïde de la commune contre adresse) est précisément l'apport du
moteur partagé, et c'est là qu'il se voit.

- [ ] **Step 1 : Le comparateur (`/ou-vivre`)**

Saisir : « une petite ville à moins de 30 minutes en voiture de la gare Matabiau ».

Attendu :
- des communes **réellement filtrées** par l'isochrone (le nord-ouest toulousain, pas Bordeaux) ;
- le message « une condition non négociable n'a pas pu être appliquée » **ne s'affiche plus** (il
  s'affichait au lot 1, honnêtement, faute de savoir résoudre la gare) ;
- **sans le mode** (« à 30 minutes de la gare Matabiau »), le message revient, et l'ambiguïté est posée.

- [ ] **Step 2 : Le dossier, commune dans l'isochrone**

Sur un projet portant cette contrainte, ouvrir le dossier d'une commune **dans** l'isochrone (par exemple
Blagnac ou L'Union).

Attendu : la contrainte est `satisfied`, elle **disparaît du bloc « non examiné »**, et la **couverture
monte** (les branches positives du verdict deviennent atteignables : les vérifier à l'écran fait partie de
ce lot, cf. spec §7.5).

- [ ] **Step 3 : Le dossier, adresse hors de l'isochrone**

Sur une commune dont le **centroïde est dedans** mais avec une **adresse à son extrémité, dehors** (une
commune étendue de la périphérie).

Attendu : le dossier commune + adresse rend une **incompatibilité**, et la phrase commence par **« Cette
adresse »**, pas par « Le point de référence de ». Ce n'est pas une divergence de moteur : c'est un
**changement de grain**, et le texte doit le porter.

- [ ] **Step 4 : Le hash de la conclusion**

Vérifier qu'un dossier déjà persisté **avant** ce lot est bien **recalculé** : le plan narratif change (les
faits changent), donc son hash change. Le **prompt** ne change pas : **pas de bump** de
`DECISION_NARRATIVE_PROMPT_VERSION`.

```bash
node --env-file=.env.local scripts/probe-conclusion.ts   # attendu : 15/15
```

- [ ] **Step 5 : Commit du handoff**

Mettre `docs/handoff/CURRENT.md` à jour (le lot 2a est livré ; la suite est le lot 2b : persistance, table
`reachability_artifact`, read repair, suppression du témoin gelé).

---

## Critères d'acceptation

1. « À 30 minutes en voiture de la gare Matabiau » est **posée** par le lecteur, **résolue** (la gare, pas la
   rue), **évaluée** (point dans l'isochrone), et le comparateur **filtre** dessus.
2. « L'hôpital de Purpan » résout l'**hôpital** (score 0,42), pas le **centre de formation** (score 0,65) qui
   le mieux classé : la catégorie décide, le score ne décide pas.
3. Un temps de trajet n'est **jamais** évalué par un haversine, et aucune minute n'est **jamais** convertie
   en kilomètres, ni dans le code, ni dans le prompt.
4. Une **panne** de géocodage rend `geocoding_unavailable`, **jamais** `no_result` ; un 429 du routeur rend
   `routing_unavailable`, **jamais** `incompatible`. Les deux sont retentables et ne filtrent pas.
5. La **valeur observée** d'un temps de trajet dit un **côté** (`within`), jamais une mesure de 30 minutes
   qui n'a pas été faite.
6. Un `mode: "bike"` rend `unexamined(unsupported_metric)`, et le produit **ne propose pas** le vélo dans sa
   question.
7. Un point dans la bande de tolérance rend `insufficient_precision`, **jamais** `incompatible`. Une
   géométrie illisible rend `routing_unavailable`, **jamais** `outside`.
8. Deux lieux homonymes distants de plus de 300 m rendent `ambiguous` : le produit ne choisit pas à la place
   du lecteur.
9. Les tests de l'orchestrateur **comptent les appels réseau** : zéro géocodage pour « près de Brest », zéro
   isochrone pour une distance, pour le vélo, ou pour une référence non résolue.
10. `node --test src/lib/*.test.ts src/lib/decision/*.test.ts` vert, `npx tsc --noEmit` rend 0.
11. La chaîne a été vue **à l'écran**, sur le comparateur **et** sur le dossier, y compris le changement de
    grain (« Cette adresse » hors isochrone quand le centroïde communal est dedans).

## Ce que ce lot ne fait PAS (lot 2b)

- La **persistance** de `ResolvedPlaceReference` dans `UserProject`, et le **read repair** (`inputHash`
  changé → résolution refaite). **`geocoding_unavailable` et `routing_unavailable` ne devront JAMAIS être
  persistés** : ce sont des pannes, pas des constats.
- La table `reachability_artifact` : l'artefact partagé **entre instances**, survivant aux redémarrages.
  C'est elle, et elle seule, qui permettra de promettre que les deux moteurs lisent le **même objet gelé**.
- La **suppression du témoin gelé** `legacy-passes-hard.ts` et de son test.
- Les **transports collectifs** (`unsupported_metric` tant que leur doctrine n'est pas écrite : sans jour,
  heure et politique d'attente, le polygone aurait une précision trompeuse).
