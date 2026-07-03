import type { LngLat } from "./geo-distance.ts";

// Foyer canonique de TOUS les types partagés Face 3 (évite les imports en avant entre libs).

export type Face3Cat = "sante" | "alimentation" | "education" | "transports" | "services";
export type Posture = "residence" | "prospection";
export type BpePoint = { c: Face3Cat; lat: number; lon: number };
export type BpeNearest = { category: Face3Cat; nearest: { distanceMeters: number } | null; searchCapMeters: number };

export type OsmProximity = {
  potentiallyNoisyInfrastructure: { type: "motorway" | "trunk" | "railway"; distanceMeters: number }[];
  nearestMappedGreenSpace: { distanceMeters: number } | null;
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
