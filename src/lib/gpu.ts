import "server-only";
import { buildHeritageProtections, type HeritageStatus, type RawSupFeature } from "./gpu-servitudes.ts";

import {
  GPU_SITE, lireUrbanisme, urbanismeIndisponible, type EntreeUrbanisme, type GpuFeature, type UrbanismeParcelle,
} from "./urbanisme-parcelle.ts";
import { projectionPour, regionDe, regionMesurable } from "./geometrie-parcelle.ts";

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

// ── FUT-81 : LE PLAN D'URBANISME DE LA PARCELLE ──────────────────────────────────────────────
// Même hôte, même absence de clé. Mesuré le 26/10/2026 sur 27 adresses : 0,2 à 3,2 s (médiane
// ~0,5 s) pour les sept couches en parallèle, puis ~0,1 s pour le détail des documents. Les réponses
// portent la géométrie entière des zones et prescriptions (5 Mo une fois, à Cesson-Sévigné) : POST,
// pour qu'une parcelle aux nombreux sommets ne dépasse jamais la longueur d'une URL.
const GPU_URL = "https://apicarto.ign.fr/api/gpu";
// Le détail et les pièces d'un document disent sa VIGUEUR et son règlement. À 4 s, ils ont dépassé leur
// délai à Besançon et à Sucy-en-Brie pendant la revue du 27/10/2026, alors que les couches avaient
// répondu : le document passait « en vigueur » sans l'être vérifié. Même délai que les couches, désormais,
// et un échec reste dit (`vigueur: non_verifiee`), jamais confirmé.
const GPU_DOC_TIMEOUT_MS = 8000;

async function gpuCouche(couche: string, geom: unknown): Promise<GpuFeature[] | null> {
  try {
    const res = await fetch(`${GPU_URL}/${couche}`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ geom }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { features?: GpuFeature[] };
    return Array.isArray(json.features) ? json.features : null;
  } catch {
    return null;
  }
}

async function gpuDocument<T>(id: string, chemin: string): Promise<T | null> {
  try {
    const res = await fetch(`${GPU_SITE}/api/document/${id}/${chemin}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(GPU_DOC_TIMEOUT_MS),
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

/**
 * Le plan d'urbanisme qui s'applique à la parcelle (ou, sans parcelle, au point). Ne lève JAMAIS :
 * une panne rend `indisponible`, que le module affiche comme tel, sans retenir le dossier.
 */
export async function fetchUrbanismeParcelle(
  latitude: number,
  longitude: number,
  parcelle: EntreeUrbanisme["parcelle"],
): Promise<UrbanismeParcelle> {
  try {
    const point = { type: "Point", coordinates: [longitude, latitude] };
    // LE PÉRIMÈTRE DES REQUÊTES SE DÉCIDE APRÈS VALIDATION (troisième revue, 27/10/2026). Une parcelle
    // qui ne se MESURE pas (tracé illisible, ou invalide : anneaux qui se croisent ou se recouvrent) n'est
    // pas envoyée : le GPU est interrogé au point de l'adresse, et seule cette réponse est lue au point.
    // Le critère est celui du lecteur (`regionMesurable`, même projection) : les deux ne peuvent diverger.
    // La parcelle reste transmise : son rattachement (proximité, distance, limite) reste dit.
    const region = parcelle?.geometry ? regionDe(parcelle.geometry, projectionPour(parcelle.geometry, [longitude, latitude])) : null;
    const interrogation = region && regionMesurable(region) ? "parcelle" : "point";
    const geom = interrogation === "parcelle" ? parcelle!.geometry : point;
    const [municipality, documents, zones, secteurs, surface, ligne, pct] = await Promise.all([
      gpuCouche("municipality", point),
      gpuCouche("document", geom),
      gpuCouche("zone-urba", geom),
      gpuCouche("secteur-cc", geom),
      gpuCouche("prescription-surf", geom),
      gpuCouche("prescription-lin", geom),
      gpuCouche("prescription-pct", geom),
    ]);
    const ids = [...new Set((documents ?? []).map((d) => d.properties?.gpu_doc_id).filter((v): v is string => typeof v === "string" && /^[0-9a-f]{32}$/.test(v)))];
    const lus = await Promise.all(ids.map(async (id) => {
      const [details, fichiers] = await Promise.all([
        gpuDocument<Record<string, unknown>>(id, "details"),
        gpuDocument<{ name?: unknown; title?: unknown }[]>(id, "files"),
      ]);
      return [id, details, fichiers] as const;
    }));
    return lireUrbanisme({
      point: [longitude, latitude],
      parcelle,
      interrogation,
      municipality, documents, zones, secteurs,
      prescriptions: { surface, ligne, point: pct },
      details: Object.fromEntries(lus.map(([id, d]) => [id, d])),
      fichiers: Object.fromEntries(lus.map(([id, , f]) => [id, Array.isArray(f) ? f : null])),
    });
  } catch {
    return urbanismeIndisponible();
  }
}
