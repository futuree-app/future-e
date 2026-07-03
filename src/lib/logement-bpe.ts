import fs from "node:fs/promises";
import path from "node:path";
import { haversineM, type LngLat } from "./geo-distance.ts";
import { neighborKeys } from "./geo-grid.ts";
import { FACE3_CATS, BPE_CAP_M, TYPEQU_LABEL, type BpePoint, type BpeNearest, type Face3Cat } from "./logement-autour-types.ts";

const DIR = path.join(process.cwd(), "data", "bpe-points");

export function nearestByCategory(center: LngLat, points: BpePoint[], capM: number = BPE_CAP_M): BpeNearest[] {
  // On retient le point le plus proche ET son code TYPEQU, pour restituer le type précis
  // (« Pharmacie » plutôt que « Santé ») dans le snapshot lu par le rapport.
  const best = new Map<Face3Cat, { d: number; t: string }>();
  for (const p of points) {
    const d = haversineM(center, { lat: p.lat, lon: p.lon });
    if (d > capM) continue;
    const cur = best.get(p.c);
    if (cur === undefined || d < cur.d) best.set(p.c, { d, t: p.t });
  }
  return FACE3_CATS.map((category) => {
    const b = best.get(category);
    return {
      category,
      nearest: b === undefined ? null : { distanceMeters: Math.round(b.d), typeLabel: TYPEQU_LABEL[b.t] ?? null },
      searchCapMeters: capM,
    };
  });
}

export async function loadBpePointsAround(center: LngLat): Promise<BpePoint[]> {
  const keys = neighborKeys(center.lat, center.lon);
  const chunks = await Promise.all(
    keys.map(async (k) => {
      try {
        const raw = await fs.readFile(path.join(DIR, `${k}.json`), "utf8");
        return (JSON.parse(raw) as { points: BpePoint[] }).points;
      } catch {
        return []; // cellule vide/absente = pas d'équipement (honnête)
      }
    }),
  );
  return chunks.flat();
}
