# L'itinéraire tranche la bande — Plan d'implémentation (chantier A, lot 2c)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox syntax.

**Goal:** Les communes que l'isochrone n'a pas su trancher cessent d'être incertaines : un **temps de trajet
calculé** (itinéraire IGN) leur donne un verdict. Et les communes présentées au lecteur portent toutes une
durée (« estimé à environ 24 minutes en voiture ») au lieu d'un côté de frontière.

**Architecture:** L'isochrone reste le **pré-filtre massif** (un polygone, 35 000 communes testées
localement, zéro appel par commune). L'itinéraire, coûteux, est réservé à **deux poignées de communes** : la
bande d'incertitude, et la liste finalement affichée. L'estimation **prime** sur la géométrie. Un **cache en
table** partage les artefacts entre instances, et un **limiteur global** protège du rate-limit.

**Tech Stack:** TypeScript, Next.js, `node --test`, Géoplateforme IGN (`/navigation/itineraire`,
`bdtopo-valhalla`, sans clé), Supabase (table `reachability_artifact`).

---

## Les faits vérifiés qui commandent ce lot (2026-07-14)

**1. Les deux services IGN sont COHÉRENTS.** Sonde sur les 12 communes les plus proches de la gare Matabiau,
isochrone 12 minutes contre itinéraire réel : **aucun désaccord**. Toulouse est à **14,8 minutes** (son
centroïde est à 2 km de la gare, mais en ville dense), donc légitimement `outside`.

> Conséquence : `outside → exclusion` est un filtre **fiable**. Il n'y a pas de faux négatifs loin de la
> frontière, et aucun « filet de sauvetage » n'est nécessaire. **Le plan précédent affirmait « un itinéraire
> tranche Toulouse en 6 minutes » : c'était une invention, jamais vérifiée, et elle était fausse.**

**2. Le cas « 12 minutes → 0 résultat » n'est donc PAS un bug de ce lot.** Aucun centroïde communal n'est à
moins de 12 minutes en voiture de Matabiau : c'est la vérité. La limite réelle est le **centroïde** (la gare
est *dans* Toulouse, dont des quartiers entiers sont à 5 minutes), et elle ne se lève qu'avec la **géométrie
communale**, hors de ce lot. Ne pas prétendre le contraire.

**3. Le rate-limit, mesuré** (12 appels, points distincts) :

| concurrence | durée | 429 |
|---|---|---|
| **3** | 1,6 s | **0** |
| 6 | 1,3 s | 1 |
| 12 | 0,1 s | **12 (tout)** |

L'API renvoie un en-tête `Retry-After` (1 à 5 s). Le limiteur est donc **global au process** (concurrence 3),
jamais un `Promise.all` par requête : deux recherches simultanées se partagent la même file.

**4. Ce que l'itinéraire IGN est, et n'est pas.** C'est un temps **calculé par un moteur de routage sur son
graphe** : ni trafic, ni stationnement, ni attente, ni variabilité horaire. Le produit dit donc « **estimé à
environ** 24 minutes », jamais « 24 minutes » comme un fait observé. On corrige un filtre qui mentait ; on ne
le remplace pas par une fausse précision.

## Global Constraints

- **L'ESTIMATION PRIME sur la GÉOMÉTRIE**, et elle est **liée à sa demande** : une estimation ne vaut que si
  son départ, son arrivée, son mode et son sens correspondent à ce qu'on évalue. Une mesure calculée au grain
  **commune** ne doit **jamais** être resservie au grain **adresse**.
- **Un temps calculé ne se convertit JAMAIS en kilomètres**, et une distance ne devient jamais un temps.
- **Aucun plafond silencieux.** Une commune non affinée **faute de budget** n'est pas une commune dont le
  routage a **échoué** : les deux états sont distincts, et tous deux sont dits.
- **Une panne reste une panne** : `routing_unavailable`, jamais un verdict, jamais un temps inventé.
- **L'arrondi ne masque JAMAIS le franchissement du seuil.** Comparer sur la valeur brute ; si l'arrondi
  contredit le verdict (30,4 min affiché « 30 minutes, au-delà de 30 minutes »), afficher la décimale.
- **Le noyau reste PUR** : il REÇOIT l'estimation, il ne l'appelle pas.
- **Le cache ne garde que les succès** ; les pannes se retentent.
- **Ce que le cache en table promet, et ce qu'il ne promet pas** : il partage les **résultats** entre
  instances et survit aux redémarrages. Il ne déduplique **pas** deux premiers calculs strictement
  concurrents sur deux instances (pas de verrou distribué dans ce lot). Ne pas l'annoncer autrement.
- Après chaque tâche : `node --test src/lib/*.test.ts src/lib/decision/*.test.ts` vert, `npx tsc --noEmit`
  rend 0.

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `src/lib/ign-limiter.ts` **(créé)** | PUR (hors `setTimeout`). Le limiteur **global au process** : concurrence 3, respect de `Retry-After`, un seul retry borné. Toute la navigation IGN passe par lui. |
| `src/lib/route-time.ts` **(créé)** | SERVEUR. L'itinéraire IGN. Parsing pur, hash de demande, cache mémoire + dédup en vol, store injecté. |
| `src/lib/reachability-store.ts` **(créé)** | SERVEUR. Le cache partagé (table), **injecté** dans `isochrone.ts` et `route-time.ts`. `null` sans clés (dev) : le cache mémoire suffit alors. |
| `supabase/24_reachability_artifact.sql` **(créé)** | La table, avec ses contraintes et sa fraîcheur. |
| `src/lib/hard-constraints.ts` **(modifié)** | `TravelTimeEstimate` (lié à sa demande), `evaluateNearPlace` : l'estimation prime, `travel_time_min` redevient une vraie valeur, la phrase dit « estimé à environ ». |
| `src/lib/comparateur-vie.ts` **(modifié)** | Deux passes d'affinage : la **bande** (verdict), puis la **liste affichée** (durée). Budget borné, rien de tu. |
| `src/lib/decision/territory-facts.ts` **(modifié)** | Le dossier estime le temps de SA commune, ou de SON adresse (hash distinct, phrase distincte). |
| `src/lib/parity.test.ts` **(enrichi)** | Le corpus figé qui **remplace** le témoin gelé avant sa suppression. |
| `src/lib/legacy-passes-hard.ts`, `comparateur-hard-nonregression.test.ts` **(supprimés, en dernier)** | Seulement **après** que le corpus les remplace. |

---

## Task 1 : Le limiteur global (et le respect du Retry-After)

**Files:** Create `src/lib/ign-limiter.ts`, `src/lib/ign-limiter.test.ts`

```ts
export type IgnResponse = { ok: true; json: unknown } | { ok: false; reason: "rate_limited" | "error" };
// File d'attente GLOBALE au process : concurrence 3 (mesurée : 0 erreur à 3, 12/12 en 429 à 12), un seul
// retry après Retry-After. Deux recherches simultanées PARTAGENT cette file : un cap par requête ne
// protégerait de rien.
export async function ignFetch(url: string, timeoutMs?: number): Promise<IgnResponse>;
```

- [ ] Step 1 : tests (la concurrence ne dépasse jamais 3 ; un 429 avec `Retry-After: 1` est retenté **une**
  fois puis rendu `rate_limited` ; un timeout rend `error` ; les appels se sérialisent au-delà de 3).
- [ ] Step 2 : implémenter. Step 3 : vert. Step 4 : commit.

## Task 2 : L'itinéraire, et son estimation liée à sa demande

**Files:** Create `src/lib/route-time.ts`, `src/lib/route-time.test.ts`,
`src/lib/__fixtures__/route-blagnac-matabiau.json` (déjà capturée : `duration: 23.697`)

```ts
export type RouteRequest = {
  fromLat: number; fromLon: number; toLat: number; toLon: number;
  mode: "car" | "walk"; direction: "to_reference";
};
export const ROUTE_VERSION: string;
export function routeRequestHash(r: RouteRequest): string;           // PUR (6 décimales)
export function parseRouteMinutes(payload: unknown): number | null;  // PUR
export async function estimateTravelMinutes(
  r: RouteRequest, store?: ArtifactStore,
): Promise<number | null>;                                            // null = panne, jamais un temps inventé
```

Le sens : `start` = le point évalué (la commune, ou l'adresse), `end` = la référence (la gare). Cohérent
avec l'isochrone (`direction=arrival`).

- [ ] Step 1 : tests (la fixture réelle rend ≈ 23,7 ; payload vide → `null` ; le hash change si le départ,
  l'arrivée ou le mode changent ; deux appels concurrents → **un seul** fetch ; un 429 → `null`, **non mis en
  cache**, retenté au coup suivant).
- [ ] Step 2 : implémenter (cache mémoire + dédup en vol, **nettoyage synchrone au retour** : le défaut déjà
  trouvé dans `isochrone.ts`, où une panne restait collée à la demande suivante).
- [ ] Step 3 : vert. Step 4 : commit.

## Task 3 : Le noyau, où l'estimation prime et se prouve

**Files:** Modify `src/lib/hard-constraints.ts`, `src/lib/hard-constraints.test.ts`

```ts
// L'ESTIMATION EST LIÉE À SA DEMANDE. Sans ces champs, une estimation calculée depuis le CENTROÏDE pourrait
// être resservie pour une ADRESSE, ou une estimation « à pied » pour un seuil « en voiture ».
export type TravelTimeEstimate =
  | {
      status: "estimated"; minutes: number; mode: PlaceMode;
      from: { lat: number; lon: number }; to: { lat: number; lon: number };
      direction: "to_reference"; requestHash: string;
    }
  | { status: "unavailable" };

export type EvaluationContext = {
  constraints: NormalizedHardConstraints;
  point: EvaluationPoint | null;
  conventionsVersion: string;
  travelTime?: TravelTimeEstimate | null; // COMMUNAL (l'isochrone, elle, est globale)
};
```

**L'ordre des gardes de la branche `travel_time`** :
```
mode absent                      → missing_parameter
mode non routable (vélo)         → unsupported_metric
point absent                     → missing_data
estimation présente ET CONCORDANTE (même mode, même départ, même arrivée que la référence résolue)
                                 → satisfied / incompatible, la phrase dit la DURÉE
estimation présente mais DISCORDANTE → on l'ignore (elle ne décrit pas ce qu'on évalue), et on retombe
                                       sur la géométrie
isochrone présente               → inside / outside / border
sinon                            → routing_unavailable
```

**Les phrases** (« estimé à environ », jamais un temps posé comme un fait) :
> Le trajet depuis le point de référence de Blagnac jusqu'à la gare Matabiau est estimé à environ
> 24 minutes en voiture, dans la limite de 30 minutes que vous avez posée.
> Cette adresse est à environ 34 minutes en voiture de la gare Matabiau, au-delà de la limite de 30 minutes
> que vous avez posée.

**L'arrondi ne masque pas le franchissement** : comparer sur le brut ; si `Math.round` contredit le verdict,
afficher une décimale (« environ 30,4 minutes »).

- [ ] Step 1 : tests (sous le seuil → `satisfied` + `travel_time_min` ; au-dessus → `incompatible`, la phrase
  porte la durée et jamais des km ; **l'estimation prime sur une isochrone qui dirait le contraire** ; une
  estimation d'un AUTRE point ou d'un AUTRE mode est **ignorée** ; 30,4 min ne s'affiche pas « 30 minutes,
  au-delà de 30 minutes » ; `unavailable` + isochrone → la géométrie ; `unavailable` sans isochrone →
  `routing_unavailable`).
- [ ] Step 2 : implémenter. Step 3 : vert. Step 4 : commit.

## Task 4 : Le cache partagé (table), injecté

**Files:** Create `supabase/24_reachability_artifact.sql`, `src/lib/reachability-store.ts` ;
Modify `src/lib/isochrone.ts`, `src/lib/route-time.ts`

```sql
begin;

-- Les artefacts de MOBILITÉ, mutualisés par demande : une isochrone (polygone) ou un itinéraire (durée),
-- sous le hash de sa demande. Deux lecteurs qui visent la même gare au même seuil lisent le MÊME objet, et
-- l'API IGN (qui rate-limite) n'est pas rappelée. Couche technique : jamais lue par l'affichage.
-- Écrite en service-role : le comparateur est ANONYME, il n'a pas d'utilisateur pour porter une RLS.
create table if not exists public.reachability_artifact (
  kind                text not null check (kind in ('isochrone', 'route')),
  request_hash        text not null,
  geometry            jsonb,
  minutes             double precision,
  engine              text not null,              -- 'ign-valhalla'
  engine_version      text,                       -- resourceVersion rendu par l'API (traçabilité)
  resource            text not null,              -- 'bdtopo-valhalla'
  integration_version text not null,              -- NOTRE version (paramètres, parsing)
  created_at          timestamptz not null default now(),
  expires_at          timestamptz not null,       -- le graphe routier évolue : un artefact n'est pas éternel
  primary key (kind, request_hash),
  -- La charge utile est EXCLUSIVE : une ligne d'isochrone n'a pas de durée, et réciproquement.
  constraint reachability_artifact_payload check (
    (kind = 'isochrone' and geometry is not null and minutes is null)
    or (kind = 'route' and minutes is not null and geometry is null)
  ),
  constraint reachability_artifact_minutes check (minutes is null or minutes > 0)
);

create index if not exists reachability_artifact_expires_idx on public.reachability_artifact (expires_at);

alter table public.reachability_artifact enable row level security;
-- Aucune policy : seul le service-role (serveur) y touche, et il contourne la RLS.

commit;
```

Fraîcheur : **30 jours** (isochrone comme itinéraire). Un artefact expiré est **ignoré** à la lecture et
recalculé ; la purge se fait au fil de l'eau (`delete where expires_at < now()` best effort, jamais bloquant).

```ts
// src/lib/reachability-store.ts (SERVEUR)
export type ArtifactStore = {
  getIsochrone(hash: string): Promise<PolygonGeometry | null>;
  putIsochrone(hash: string, g: PolygonGeometry, meta: ArtifactMeta): Promise<void>;
  getMinutes(hash: string): Promise<number | null>;   // valide la valeur lue (> 0, finie)
  putMinutes(hash: string, minutes: number, meta: ArtifactMeta): Promise<void>;
};
export function reachabilityStore(): ArtifactStore | null; // null sans clés : cache mémoire seul
```

Le store est **injecté** (`getReachability(r, store?)`, `estimateTravelMinutes(r, store?)`), comme
`getTileGeoms(sb, …)` : les modules restent testables sous `node --test`. Ordre : **mémoire → table →
réseau**. Une erreur de cache ne fait **jamais** tomber une recherche.

- [ ] Step 1 : la migration + le store + tests (un store factice prouve l'ordre mémoire → table → réseau ;
  une valeur illisible en base est ignorée ; un échec d'écriture ne jette pas).
- [ ] Step 2 : brancher. Step 3 : vert. Step 4 : commit.
- [ ] **Step 5 : APPLIQUER LA MIGRATION** (Supabase > SQL Editor), et le vérifier avant la Task 5.

## Task 5 : Le comparateur affine, en deux passes et sous budget

**Files:** Modify `src/lib/comparateur-vie.ts`, `src/app/(public)/ou-vivre/OuVivreClient.tsx`

```
1. l'isochrone filtre les 35 000            (inchangé : inside / border / outside)
2. score et tri                             (inchangé : les confirmées avant les non tranchées)
3. PASSE A, la BANDE : les communes-frontière, par score décroissant, jusqu'à BAND_CAP = 12
     estimation ≤ seuil  → confirmée (le badge tombe, la durée s'affiche)
     estimation > seuil  → INCOMPATIBLE : elle SORT des résultats
     panne               → elle garde son badge, et on dit que le routage a échoué
     hors budget         → elle garde son badge, et on dit qu'elle n'a PAS été affinée
4. PASSE B, la LISTE AFFICHÉE : les communes réellement présentées (top 6) qui n'ont pas encore de durée
   reçoivent la leur, même confirmées par l'isochrone. C'est ce qui tient la promesse produit :
   « estimé à environ 24 minutes en voiture de la gare Matabiau », sur chaque carte.
5. BUDGET : au plus 18 appels, et une DEADLINE (6 s). Ce qui n'a pas été fait est COMPTÉ et DIT.
```

Trois états distincts, jamais confondus :
```ts
type BoundaryState =
  | { status: "estimated"; minutes: number }
  | { status: "routing_unavailable" }        // le routage a ÉCHOUÉ
  | { status: "not_refined"; reason: "budget" }; // on ne l'a pas TENTÉ
```

**Le bandeau, après affinage** (aucun plafond tu) :
> 19 communes se situent dans votre seuil de 30 minutes en voiture depuis la gare Matabiau. 5 autres n'ont
> pas pu être tranchées : leur point de référence est trop proche de la frontière calculée, et nous n'avons
> pas affiné leur itinéraire dans cette recherche.

- [ ] Step 1 : implémenter les deux passes, le budget, les trois états. Step 2 : vérifier en vrai (Toulouse,
  30 min : combien de communes de la bande passent, combien sortent, combien restent). Step 3 : commit.

## Task 6 : Le dossier estime, au bon grain

**Files:** Modify `src/lib/decision/territory-facts.ts`, tests des règles

Un seul appel, aucun plafond. **Le grain est vérifié** : rapport communal → départ = point de référence de
la commune ; rapport avec adresse → départ = **l'adresse**. Les deux demandes ont des `requestHash`
**différents**, et le noyau **rejette** une estimation qui ne correspond pas au point évalué (Task 3). La
phrase nomme le grain (« Cette adresse est à environ 34 minutes… »).

- [ ] Step 1 : implémenter. Step 2 : tests (commune et adresse, hash distincts, aucune contamination).
  Step 3 : commit.

## Task 7 : Le corpus figé, PUIS la suppression du témoin

**Files:** Modify `src/lib/parity.test.ts` ; Delete `src/lib/legacy-passes-hard.ts`,
`src/lib/comparateur-hard-nonregression.test.ts`

Le vieux code n'a plus de valeur normative (son haversine à 50 km et son `?? 0` n'ont plus rien à voir avec
le moteur d'aujourd'hui), **mais les cas qui ont permis de découvrir ses mensonges restent précieux**. On
les fige d'abord, on supprime ensuite : les 11 contraintes, la divergence commune / unité urbaine, les
données manquantes, l'isochrone, la frontière, **l'estimation qui contredit la géométrie**, et le grain
commune / adresse.

- [ ] Step 1 : enrichir le corpus. Step 2 : supprimer le témoin, vérifier que rien ne l'importe. Step 3 :
  suite verte. Step 4 : commit.

## Task 8 : Vérification à l'écran, et handoff

- [ ] « à moins de 30 minutes en voiture de la gare Matabiau » : chaque carte affichée porte une **durée
  estimée** ; les communes de la bande sont tranchées ; ce qui n'a pas été tranché est **dit**.
- [ ] Le dossier d'une commune tranchée : `satisfied`, la couverture monte, la phrase porte la durée.
- [ ] `node --env-file=.env.local scripts/probe-conclusion.ts` → 15/15.
- [ ] Handoff mis à jour (dont : **le cas « 12 minutes » n'est pas un bug**, et la limite du centroïde).

## Critères d'acceptation

1. Une commune de la bande reçoit une **durée estimée** et un verdict. Le badge subsiste dans **deux** cas
   distincts, et distingués : le routage a **échoué**, ou l'affinage n'a **pas été tenté** (budget).
2. L'estimation **prime** sur la géométrie, **et seulement si elle concorde** (même mode, même départ, même
   arrivée). Une estimation communale n'est **jamais** resservie à l'adresse.
3. La phrase dit « **estimé à environ** », jamais un temps posé comme un fait, et **jamais** des kilomètres.
4. L'arrondi ne masque **jamais** le franchissement du seuil.
5. Aucun plafond silencieux : ce qui n'a pas été tranché est **compté et dit**.
6. La concurrence vers IGN ne dépasse **jamais 3**, `Retry-After` est respecté, un 429 rend
   `routing_unavailable` (jamais un verdict).
7. Le cache partage les artefacts entre instances et survit aux redémarrages. Il ne prétend **pas**
   dédupliquer deux premiers calculs strictement concurrents.
8. `node --test` vert, `npx tsc --noEmit` rend 0, sonde 15/15.
