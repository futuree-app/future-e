# Spec — Risques du bâti au grain point (cavités + mouvements de terrain)

**Date** : 2026-07-11 · **Branche cible** : `feat/logement-risques-point-fin` (depuis `main`) · **Statut** : design validé par le porteur, à planifier.

Doctrine du module : `docs/vault/modules/logement.md`.

## Problème

Le bloc « Risques du bâti » affiche la sismicité et le retrait-gonflement des argiles **gradés**
(« très faible », « exposition moyenne ») : le lecteur sait où il en est. En dessous, une ligne
« Autres risques recensés à cette adresse : … » liste des libellés GASPAR qui sont en réalité
**communaux, sans niveau** : « Mouvement de terrain » à La Rochelle signifie « la commune est
signalée quelque part », pas « à cette adresse ». C'est la seule information du module qui dit « il y
a un risque » sans dire « à quel point », donc à la fois anxiogène et inutile.

**Vérification faite avant de concevoir (exigence du porteur) : une source plus fine existe pour deux
des trois aléas résiduels.**

- **Cavités souterraines** : `/api/v1/cavites?latlon=` renvoie les cavités **géolocalisées** (type,
  nom, coordonnées). La Rochelle : 2 dans 1 km, Nice : 5.
- **Mouvements de terrain** : `/api/v1/mvt?latlon=` renvoie les événements **datés et localisés**
  (glissement, chute de blocs, fiabilité, lieu). Preuve du grain : La Rochelle, commune signalée
  « Mouvement de terrain », a **0 événement dans 2 km** du centre ; Villerville, sur ses falaises, en
  a **44**. Le libellé communal cachait cette différence entière.
- **Rupture de barrage** : aucune source fine (ni PPI, ni onde de submersion en API). Reste un flag
  communal sur large périmètre. C'est l'aléa dont il faut se méfier le plus, et le seul qu'on ne peut
  pas raffiner.

## Scope

**DANS :**
- Deux appels Géorisques v1 au point (`/cavites`, `/mvt`), en parallèle des sources existantes.
- Cavités et mouvements de terrain deviennent des **faits au point** (nombre, distance au plus
  proche, types), affichés dans « Risques du bâti » sous la sismicité et le RGA.
- Le résidu sans source fine (rupture de barrage, tempête, etc.) devient **une phrase discrète** qui
  nomme le grain communal.
- Un point de checklist « À vérifier » quand une cavité est recensée à proximité.

**HORS, et pourquoi :**
- **L'inondation** reste hors de ce chantier : elle a son PPRN (« Statut réglementaire ») et sa
  sinistralité ONRN. La retirer ou non de la ligne est une décision éditoriale séparée, signalée, non
  prise ici.
- **Carte de susceptibilité MVT** : `/mvt` est un recensement d'**événements passés**, pas un aléa
  gradé. On ne prétend jamais l'inverse. Aucune couche cartographique de susceptibilité n'est
  branchée.
- **Alimentation de la synthèse IA** : les faits sont déterministes, ils se suffisent. Le prompt
  n'apprend rien de neuf en v1.
- **Frontière Santé** : cavités et MVT menacent le bâti, ils restent Logement. Rien ne bascule.

## Doctrine centrale

**Grain honnête, jamais un verdict.** Rayon **500 m** : assez petit pour dire « à proximité » sans
mentir, assez large pour absorber l'imprécision de position des inventaires (« orifice supposé »,
« précision décamètre »). On ne dit **jamais** « sous votre logement » : un inventaire ne le permet
pas. C'est un signal à vérifier, pas une conclusion, dans la posture du module.

**Le grain, pas la dramatisation.** On donne le nombre, la distance au plus proche et les types, sans
adjectif. Un « ouvrage militaire » est souvent un abri anodin : on le nomme, on ne le charge pas.

**Une absence n'est jamais une garantie.** Quand la commune est signalée pour un mouvement de terrain
mais qu'aucun événement n'est recensé dans les 500 m, on dit les trois choses : rien à proximité
immédiate, la commune est signalée, et c'est un recensement d'événements passés, pas une
susceptibilité du terrain. (Décision porteur.)

**La panne n'est jamais une absence.** Chaque source porte son `sourceStatus`. Une source en panne ne
produit ni fait, ni affirmation de « rien ».

## Architecture

**`src/lib/point-hazards.ts` — lib PURE, sans réseau, testée (TDD).**

```ts
import { haversineM, type LngLat } from "./geo-distance.ts";

export type CaviteRaw = { type?: string | null; nom?: string | null; longitude?: number | null; latitude?: number | null };
export type MvtRaw = { type?: string | null; longitude?: number | null; latitude?: number | null };

export type PointHazards = {
  cavites: { count: number; nearestM: number | null; types: string[] } | null; // null = aucune dans le rayon
  mvt:
    | { kind: "events"; count: number; nearestM: number | null; types: string[] }
    | { kind: "flagged_none" } // commune signalée, aucun événement au point
    | null; // ni événement, ni signalement communal
  // Aléas GASPAR communaux sans source fine, déjà filtrés (hors cavités/MVT/frontière Santé/doublons).
  communalResidual: string[];
};

export function buildPointHazards(input: {
  point: LngLat;
  radiusM: number;
  cavites: CaviteRaw[] | null; // null = source indisponible
  mvt: MvtRaw[] | null; // null = source indisponible
  communeFlaggedMvt: boolean; // la commune est-elle signalée « mouvement de terrain » (GASPAR) ?
  communalResidual: string[]; // labels GASPAR résiduels déjà filtrés
}): PointHazards;
```

Règles :
- `cavites` : filtrer sur `radiusM` via `haversineM`, compter, distance au plus proche arrondie, types
  distincts (au plus 3, ordre d'apparition). `[]` dans le rayon → `null`. Source `null` → `null`.
- `mvt` : idem ; s'il n'y a aucun événement dans le rayon **et** `communeFlaggedMvt` → `{ kind:
  "flagged_none" }` ; sinon `null`.
- `communalResidual` passe tel quel (déjà filtré côté route).

**`src/lib/georisques.ts` — deux fetchers + intégration.**

```ts
export async function fetchCavitesNearPoint(latitude: number, longitude: number): Promise<CaviteRaw[] | null>;
export async function fetchMvtNearPoint(latitude: number, longitude: number): Promise<MvtRaw[] | null>;
```

Chacun appelle `fetchJson` v1 (`/cavites`, `/mvt`) avec `latlon` + `rayon=500` + un `page_size`
suffisant (100). Retourne `data` ou `null` en cas d'échec (jamais `[]` sur erreur : `null` = source
indisponible).

**Intégration.** Dans `getGeorisquesAddressSummary`, ajouter les deux appels au `Promise.all`. La
route `georisques-logement` calcule le résidu communal (le filtre actuel de `LogementModule.tsx`,
déplacé côté serveur) et appelle `buildPointHazards`, puis attache `pointHazards: PointHazards` au
rapport, à côté de `georisques`. `PointHazards` vit dans `point-hazards.ts` (lib pure) et entre au
contrat partagé `logement-report-types.ts`.

**`src/components/report/logement/icons.tsx` — deux icônes au trait.** `IconCavity` (un vide sous une
ligne de sol : sol hachuré au-dessus d'une poche vide) et `IconLandslide` (une pente avec une masse
qui glisse). Même style que `IconStrata` / `IconSeismic` (trait, `size` par défaut 13, `currentColor`).
Rendues en `var(--blue)` comme les autres, pour l'unité de la famille « exposition ».

**`src/lib/logement-checklist.ts`.** `ChecklistFacts` gagne `caviteProche: boolean`. Règle dans les
buckets `achat` et `reside` : « faire vérifier la présence de cavités souterraines avant travaux ou
achat ».

## Ce que le lecteur voit

**Cohérence graphique avec la sismicité et le RGA (exigence porteur).** Les cavités et les mouvements
de terrain sont rendus par le **même composant `Block`** (`logement/kit.tsx` : `label`, `value`,
`icon`, `tip`), dans la **même grille** que la sismicité et le RGA. Chacun porte une **icône au trait**
(à créer, cf. Architecture) et un **tooltip qui explique l'impact sur le logement**, parce que
« cavité souterraine » ne dit rien à un lecteur non expert.

Grille « Risques du bâti » (les faits au point rejoignent sismicité + RGA) :

- **Cavités présentes** → `Block` :
  > **Cavités souterraines** · 2 à moins de 500 m
  > *(tooltip)* « Un vide dans le sous-sol, comme une ancienne carrière ou galerie, peut fragiliser les
  > fondations et provoquer un affaissement. À proximité, il justifie une étude de sol avant d'engager
  > des travaux. »
- **MVT, événements présents** → `Block` :
  > **Mouvements de terrain** · 3 à moins de 500 m
  > *(tooltip)* « Glissements, chutes de blocs ou effondrements déjà survenus tout près : ils signalent
  > un terrain qui a bougé, ce qui peut affecter la stabilité du bâti. »

Sous la grille, en **phrases** (jamais des `Block`, ce sont des nuances honnêtes, pas des faits
gradés) :

- **MVT, commune signalée sans événement au point** :
  > Aucun mouvement de terrain n'est recensé à proximité immédiate. La commune est signalée pour cet
  > aléa ; ce recensement porte sur des événements passés, pas sur la susceptibilité du terrain.
- **Résidu communal** (corps réduit, `--fg-3`), si non vide :
  > À l'échelle de la commune, d'autres aléas sont recensés sur de larges périmètres (rupture de
  > barrage), sans détail disponible à cette adresse.
- **Mention de source**, une fois, au pied du bloc : *Cavités et mouvements de terrain recensés par le
  BRGM via Géorisques.*

L'ancienne ligne « Autres risques recensés à cette adresse : … » est supprimée.

Les types de cavités/MVT ne sont **pas** mis dans la `value` (« défense passive, ouvrage civil » est
du jargon qui n'aide pas). La `value` porte le fait décisionnel (nombre + distance) ; le tooltip porte
le sens. Doctrine tooltip respectée : ≤ 2 phrases, ~35 mots, « pourquoi ça aide à comprendre », sans
méthode ni source (`/memory/feedback_tooltip_no_sources`).

## Erreurs et cas limites

| Cas | Comportement |
|---|---|
| `/cavites` en panne | `cavites: null`, aucun bloc cavités, aucune affirmation d'absence |
| `/mvt` en panne | `mvt: null`, aucun bloc MVT |
| 0 cavité, 0 MVT, résidu vide | rien ne s'affiche sous le RGA |
| cavité à 480 m, position « supposée » | affichée : c'est un signal à vérifier, la source est nommée |
| commune non signalée MVT, 0 événement | `mvt: null`, silence |
| Paris/Lyon/Marseille | l'API répond aux coordonnées, jamais à l'INSEE : pas de piège PLM |

## Tests (lib pure, TDD)

- cavités : 5 points dont 2 hors rayon → `count: 3`, `nearestM` = le plus proche, types distincts ≤ 3.
- cavités `[]` → `null` ; cavités `null` (panne) → `null`.
- MVT événements dans le rayon → `kind: "events"`.
- MVT 0 événement + `communeFlaggedMvt: true` → `kind: "flagged_none"`.
- MVT 0 événement + `communeFlaggedMvt: false` → `null`.
- `communalResidual` transmis tel quel.
- checklist : `caviteProche` en `achat` → un item ; en `location` → aucun (via le champ `buckets`).

## Critères d'acceptation

1. Une adresse rochelaise affiche les cavités en `Block` (icône + tooltip), au grain point, pas le
   libellé communal.
2. Le tooltip des cavités et celui des mouvements de terrain expliquent l'impact sur le logement, en
   langage non expert, sans jargon ni source.
3. Cavités et MVT sont visuellement cohérents avec la sismicité et le RGA (même `Block`, même grille,
   icône au trait de la même famille).
4. Une adresse sans cavité ni MVT au point, dans une commune signalée MVT, affiche la phrase
   « aucun événement, mais commune signalée ».
5. Une adresse sans aucun de ces aléas n'affiche rien sous le RGA, et le rapport n'affirme nulle part
   qu'il n'y a aucun risque.
6. `/cavites` coupé : le rapport se rend, sans bloc cavités, sans erreur visible.
7. Le résidu (rupture de barrage) apparaît en phrase discrète, jamais au même niveau que les faits au
   point.
8. La chaîne se re-fetch à chaque rendu (comme le reste de Géorisques), pas de snapshot.

## Non-objectifs

- Prédire la susceptibilité du terrain (MVT = événements passés).
- Dire « sous votre logement » ou rendre un verdict d'inconstructibilité.
- Retirer l'inondation de l'affichage (décision éditoriale séparée).
- Alimenter la synthèse IA.
