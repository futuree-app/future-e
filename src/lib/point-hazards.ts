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
  mvt:
    | { kind: "events"; count: number; nearestM: number | null; types: string[] }
    | { kind: "flagged_none" } // commune signalée « mouvement de terrain », aucun événement au point
    | null; // ni événement au point, ni signalement communal, OU source indisponible
  // Aléas GASPAR communaux sans source fine (rupture de barrage, tempête…), déjà filtrés côté route.
  communalResidual: string[];
};

const MAX_TYPES = 3;

// Famille « mouvement de terrain » (portée au point via /mvt) : à exclure du résidu communal.
const MVT_FAMILY = /mouvement de terrain|glissement|[ée]boulement|chute[s]? de (pierre|bloc)|affaissement|effondrement|carri[èe]re souterraine|recul du trait de c[ôo]te/i;
// Frontière Santé/technologique + doublons déjà gradés ailleurs (séisme, argile), à écarter.
const SANTE_OU_DOUBLON = /s[ée]ism|argile|tassement|radon|industriel|effet thermique|mati[èe]res dangereuses|nucl[ée]aire|transport de/i;

/** La commune est-elle signalée pour la famille « mouvement de terrain » (GASPAR au point) ? */
export function isMvtFlagged(labels: string[] | null | undefined): boolean {
  return (labels ?? []).some((l) => MVT_FAMILY.test(l));
}

/**
 * Aléas GASPAR communaux SANS source fine, pour la phrase de résidu. Reprend le filtre historique
 * (frontière Santé, sous-détails « Par … », séisme/argile, relabel submersion marine) et exclut en
 * plus la famille mouvement de terrain et les cavités, désormais portées au grain point.
 * L'inondation N'EST PAS retirée ici (décision éditoriale séparée, cf. spec).
 */
export function communalResidualFromLabels(labels: string[] | null | undefined): string[] {
  const out: string[] = [];
  for (const l of labels ?? []) {
    if (/submersion marine/i.test(l)) { if (!out.includes("Submersion marine")) out.push("Submersion marine"); continue; }
    if (/^par\s/i.test(l)) continue; // sous-détail : le grand type suffit
    if (SANTE_OU_DOUBLON.test(l)) continue;
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

  let mvtOut: PointHazards["mvt"] = null;
  if (mvt) {
    const hits = within(mvt, point, radiusM);
    if (hits.length > 0) {
      mvtOut = { kind: "events", count: hits.length, nearestM: Math.round(hits[0].distM), types: distinctTypes(hits) };
    } else if (communeFlaggedMvt) {
      mvtOut = { kind: "flagged_none" };
    }
  }

  return { cavites: cavitesOut, mvt: mvtOut, communalResidual };
}
