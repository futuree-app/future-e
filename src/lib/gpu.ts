import "server-only";
import { buildHeritageProtections, type HeritageStatus, type RawSupFeature } from "./gpu-servitudes.ts";

export type { HeritageStatus } from "./gpu-servitudes.ts";

// Géoportail de l'urbanisme (API Carto IGN). Même hôte que `cadastre.ts`, aucune clé requise.
// Latence mesurée le 2026-07-09 : 641 ms médiane, 1 495 ms au pire, aucun rejet sur dix appels
// consécutifs. À appeler EN PARALLÈLE des autres sources, jamais en série.
const GPU_SUP_URL = "https://apicarto.ign.fr/api/gpu/assiette-sup-s";
const TIMEOUT_MS = 8000;

export async function fetchHeritageProtections(
  latitude: number,
  longitude: number,
): Promise<HeritageStatus> {
  const geom = encodeURIComponent(
    JSON.stringify({ type: "Point", coordinates: [longitude, latitude] }),
  );
  try {
    const res = await fetch(`${GPU_SUP_URL}?geom=${geom}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return { items: [], sourceStatus: "unavailable" };
    const json = (await res.json()) as { features?: RawSupFeature[] };
    return { items: buildHeritageProtections(json.features), sourceStatus: "ok" };
  } catch {
    return { items: [], sourceStatus: "unavailable" };
  }
}
