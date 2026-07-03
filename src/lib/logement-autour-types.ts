import type { LngLat } from "./geo-distance.ts";

// Foyer canonique de TOUS les types partagés Face 3 (évite les imports en avant entre libs).

export type Face3Cat = "sante" | "alimentation" | "education" | "transports" | "services";
export type Posture = "residence" | "prospection";
export type BpePoint = { c: Face3Cat; t: string; lat: number; lon: number };
export type BpeNearest = {
  category: Face3Cat;
  nearest: { distanceMeters: number; typeLabel: string | null } | null;
  searchCapMeters: number;
};

// Libellé FR précis par code TYPEQU (BPE24). Nature de chaque code confirmée sur les
// noms d'établissement réels (NOMRS) le 2026-07-03. Le rapport affiche ce type précis
// (« Pharmacie », « Boulangerie ») plutôt que la seule famille abstraite. Modifier le
// libellé ici ne demande PAS de régénérer les shards (les shards ne portent que le code).
export const TYPEQU_LABEL: Record<string, string> = {
  // Santé
  D265: "Médecin généraliste",
  D307: "Pharmacie",
  // Alimentation
  B105: "Supermarché",
  B201: "Supérette",
  B202: "Épicerie",
  B204: "Boucherie-charcuterie",
  B207: "Boulangerie",
  B208: "Primeur",
  // Éducation
  C107: "École maternelle",
  C108: "École primaire",
  C109: "École élémentaire",
  // Transports
  E107: "Gare",
  E108: "Gare",
  E109: "Halte ferroviaire",
  // Services essentiels
  A203: "Banque",
  A206: "Bureau de poste",
};

// Nature de l'espace vert cartographié (tag OSM conservé pour préciser « parc / bois / … »
// plutôt qu'un « espace vert » générique). Optionnel : les snapshots antérieurs ne l'ont pas.
export type GreenKind = "park" | "wood" | "forest" | "grass" | "recreation_ground";

export type OsmProximity = {
  potentiallyNoisyInfrastructure: { type: "motorway" | "trunk" | "railway"; distanceMeters: number }[];
  nearestMappedGreenSpace: { distanceMeters: number; kind?: GreenKind } | null;
  bboxRadiusMeters: number;
};

export type Face3Snapshot = {
  center: LngLat;
  bpe: { categories: BpeNearest[] };
  osm: OsmProximity;
  sourceStatus: {
    bpe: "complete" | "failed";
    osmInfrastructure: "complete" | "pending" | "failed";
    osmGreenSpaces: "complete" | "pending" | "failed";
  };
  sources: { bpeVersion: string; osmFetchedAt: string | null; osmQueryVersion: string };
  sourcesVersion: string;
  computedAt: string;
};

export const FACE3_CATS: Face3Cat[] = ["sante", "alimentation", "education", "transports", "services"];
export const BPE_CAP_M = 3000; // cap de recherche v1 (commun). Affinable par famille plus tard.
