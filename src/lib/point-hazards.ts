// Risques du bâti au grain POINT (Face 2 Logement) : cavités souterraines et mouvements de terrain,
// à partir des inventaires géolocalisés Géorisques (BRGM). Lib PURE (pas server-only) : structurée
// côté serveur, son TYPE est importé côté client par le rapport.
//
// POURQUOI. Les libellés GASPAR sont COMMUNAUX (« la commune est signalée pour cet aléa »), sans
// grain ni niveau. Les inventaires /cavites et /mvt sont géolocalisés : on les rapporte au point.
//
// DEUX RÉSERVES D'HONNÊTETÉ, gravées dans les types :
//  - /mvt est un recensement d'ÉVÉNEMENTS PASSÉS, jamais une susceptibilité du terrain. « Aucun
//    événement à proximité » ne veut pas dire « terrain stable » : d'où le cas `flagged_none`, qui
//    dit que la commune reste signalée.
//  - une SOURCE EN PANNE (`null`) n'est jamais une absence (`[]`) : le rendu doit les distinguer.

import { haversineM, type LngLat } from "./geo-distance.ts";

export type CaviteRaw = { type?: string | null; nom?: string | null; longitude?: number | null; latitude?: number | null };
export type MvtRaw = { type?: string | null; longitude?: number | null; latitude?: number | null };

export type PointHazards = {
  // null = aucune cavité dans le rayon, OU source indisponible (le rendu n'affiche rien dans les deux cas).
  cavites: { count: number; nearestM: number | null; types: string[] } | null;
  // Un mouvement de terrain n'est un fait au point QUE s'il y a des événements géolocalisés (Block).
  // Sans événement au point, l'aléa n'est qu'un signalement communal : il rejoint `communalResidual`.
  mvt: { kind: "events"; count: number; nearestM: number | null; types: string[] } | null;
  // Aléas GASPAR communaux sans source fine (mouvement de terrain sans événement au point, rupture de
  // barrage, tempête…), sur de larges périmètres, sans détail à l'adresse.
  communalResidual: string[];
};

const MAX_TYPES = 3;

// Famille « mouvement de terrain » (portée au point via /mvt) : à exclure du résidu communal.
const MVT_FAMILY = /mouvement de terrain|glissement|[ée]boulement|chute[s]? de (pierre|bloc)|affaissement|effondrement|carri[èe]re souterraine|recul du trait de c[ôo]te/i;
// DEUX RAISONS D'ÉCARTER, QU'UNE SEULE REGEX CONFONDAIT. Les distinguer n'change rien au filtrage —
// leur union est identique — mais rend chaque exclusion relisable, et l'une des deux est devenue caduque.
//
// 1. DÉJÀ MONTRÉ AILLEURS, dans ce même dossier : le séisme et les argiles y sont gradés, l'inondation
//    est portée par le PPRN (« Statut réglementaire ») et la sinistralité ONRN. Les répéter en résidu
//    serait un doublon pour le lecteur. Raison toujours valable.
const DEJA_MONTRE_AILLEURS = /s[ée]ism|argile|tassement|inondation/i;

// 2. HORS DU PÉRIMÈTRE D'UNE LECTURE D'ADRESSE (ces aléas renvoyaient à un module Santé, supprimé le
//    29/07/2026 avec le passage à trois modules : Commune, Autour de l'adresse, Logement).
//    Ces aléas restent écartés ICI parce qu'ils sont vrais au grain COMMUNE et que ce résidu est celui
//    d'un module d'ADRESSE : les y afficher vendrait de la commune pour de l'adresse.
//
//    ⚠ MAIS ILS NE SONT NULLE PART. Le radon en particulier : `sante-facts.ts` affirme qu'il « vit dans
//    Logement », ce filtre l'en écarte, et le prompt de synthèse dit de ne pas en parler — chaque module
//    le renvoie à un autre. Mesuré le 28/07/2026 sur 200 communes tirées de l'index : classe 3
//    (potentiel significatif) = 19,5 %, classe 2 = 5,5 %, classe 1 = 75,0 %. À 19,5 %, le signal
//    DISCRIMINE (repères de la doctrine : feu recensé 43 %, boisement ≥ 70 % 9,4 %, inondation 86 % =
//    universel donc écartée). L'API `georisques.gouv.fr/api/v1/radon` est publique, sans jeton, et rend
//    la classe par code INSEE — donc le grain est COMMUNAL, contrairement à ce qu'affirme `sante-facts`.
//
//    PAS DE GRAIN PLUS FIN, VÉRIFIÉ. `/radon` REFUSE `latlon` (400 : « Required parameter code_insee »).
//    `resultats_rapport_risque?latlon=` porte bien un bloc radon avec DEUX champs distincts,
//    `libelleStatutAdresse` et `libelleStatutCommune` — mais sur neuf points testés (Clermont, Brest,
//    La Rochelle, Paris, Nice, Toulouse, Nancy, Creuse) ils sont TOUJOURS ÉGAUX : l'API recopie le
//    statut communal à l'adresse. Le champ promet une finesse qu'il ne livre pas, et s'y fier
//    afficherait « à cette adresse » un fait communal. (L'IRSN cartographie par formation géologique,
//    donc plus fin existe en amont ; ce n'est pas ce que cette API diffuse.)
//
//    Sa place est donc dans le module Commune, sans ambiguïté. Décision produit en attente.
//
//    Bonus relevé au passage : `resultats_rapport_risque` COUVRE PARIS (« faible ») là où
//    `/radon?code_insee=75056` rend zéro résultat — le même angle mort PLM que sur les IRIS.
const HORS_PERIMETRE_ADRESSE = /radon|industriel|effet thermique|mati[èe]res dangereuses|nucl[ée]aire|transport de/i;

function ecarteDuResidu(label: string): boolean {
  return DEJA_MONTRE_AILLEURS.test(label) || HORS_PERIMETRE_ADRESSE.test(label);
}

/** La commune est-elle signalée pour la famille « mouvement de terrain » (GASPAR au point) ? */
export function isMvtFlagged(labels: string[] | null | undefined): boolean {
  return (labels ?? []).some((l) => MVT_FAMILY.test(l));
}

/**
 * Aléas GASPAR communaux SANS source fine, pour la phrase de résidu. Reprend le filtre historique
 * (aléas hors périmètre d'adresse, sous-détails « Par … », séisme/argile, relabel submersion
 * marine), exclut la
 * famille mouvement de terrain et les cavités (portées au grain point), et l'inondation (doublon :
 * déjà portée par le PPRN et la sinistralité ONRN). Le mouvement de terrain est RÉINJECTÉ par
 * `buildPointHazards` quand la commune est signalée sans événement au point.
 */
export function communalResidualFromLabels(labels: string[] | null | undefined): string[] {
  const out: string[] = [];
  for (const l of labels ?? []) {
    if (/submersion marine/i.test(l)) { if (!out.includes("Submersion marine")) out.push("Submersion marine"); continue; }
    if (/^par\s/i.test(l)) continue; // sous-détail : le grand type suffit
    if (ecarteDuResidu(l)) continue;
    if (MVT_FAMILY.test(l)) continue; // porté au point
    if (!out.includes(l)) out.push(l);
  }
  return out;
}

/** Points de l'inventaire tombant dans le rayon, avec leur distance au point, triés du plus proche. */
function within(
  items: { type?: string | null; longitude?: number | null; latitude?: number | null }[],
  point: LngLat,
  radiusM: number,
): { type: string | null; distM: number }[] {
  return items
    .map((it) => {
      if (typeof it.latitude !== "number" || typeof it.longitude !== "number") return null;
      const distM = haversineM(point, { lat: it.latitude, lon: it.longitude });
      return distM <= radiusM ? { type: it.type ?? null, distM } : null;
    })
    .filter((x): x is { type: string | null; distM: number } => x !== null)
    .sort((a, b) => a.distM - b.distM);
}

/** Types distincts, dans l'ordre d'apparition, plafonnés. */
function distinctTypes(hits: { type: string | null }[]): string[] {
  const seen: string[] = [];
  for (const h of hits) {
    if (h.type && !seen.includes(h.type)) seen.push(h.type);
    if (seen.length >= MAX_TYPES) break;
  }
  return seen;
}

export function buildPointHazards(input: {
  point: LngLat;
  radiusM: number;
  cavites: CaviteRaw[] | null;
  mvt: MvtRaw[] | null;
  communeFlaggedMvt: boolean;
  communalResidual: string[];
}): PointHazards {
  const { point, radiusM, cavites, mvt, communeFlaggedMvt, communalResidual } = input;

  let cavitesOut: PointHazards["cavites"] = null;
  if (cavites) {
    const hits = within(cavites, point, radiusM);
    if (hits.length > 0) {
      cavitesOut = { count: hits.length, nearestM: Math.round(hits[0].distM), types: distinctTypes(hits) };
    }
  }

  // MVT : événements géolocalisés → Block. Sinon, si la commune est signalée (source répondue ou en
  // panne), l'aléa n'a pas de détail au point → il rejoint le résidu communal, comme rupture de barrage.
  let mvtOut: PointHazards["mvt"] = null;
  let residual = communalResidual;
  const mvtHits = mvt ? within(mvt, point, radiusM) : [];
  if (mvtHits.length > 0) {
    mvtOut = { kind: "events", count: mvtHits.length, nearestM: Math.round(mvtHits[0].distM), types: distinctTypes(mvtHits) };
  } else if (communeFlaggedMvt) {
    residual = ["Mouvement de terrain", ...communalResidual];
  }

  return { cavites: cavitesOut, mvt: mvtOut, communalResidual: residual };
}
