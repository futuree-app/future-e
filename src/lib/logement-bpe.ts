import fs from "node:fs/promises";
import path from "node:path";
import { haversineM, type LngLat } from "./geo-distance.ts";
import { neighborKeys } from "./geo-grid.ts";
import { FACE3_CATS, BPE_CAP_M, type BpePoint, type BpeNearest, type Face3Cat } from "./logement-autour-types.ts";

const DIR = path.join(process.cwd(), "data", "bpe-points");

export function nearestByCategory(center: LngLat, points: BpePoint[], capM: number = BPE_CAP_M): BpeNearest[] {
  const best = new Map<Face3Cat, number>();
  for (const p of points) {
    const d = haversineM(center, { lat: p.lat, lon: p.lon });
    if (d > capM) continue;
    const cur = best.get(p.c);
    if (cur === undefined || d < cur) best.set(p.c, d);
  }
  return FACE3_CATS.map((category) => {
    const d = best.get(category);
    return { category, nearest: d === undefined ? null : { distanceMeters: Math.round(d) }, searchCapMeters: capM };
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
