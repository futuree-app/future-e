import fs from "node:fs/promises";
import path from "node:path";
import { haversineM, type LngLat } from "./geo-distance.ts";
import { neighborKeys } from "./geo-grid.ts";
import { FACE3_CATS, BPE_CAP_M, BPE_WALK_RADIUS_M, TYPEQU_LABEL, type BpePoint, type BpeNearest, type Face3Cat } from "./logement-autour-types.ts";

const DIR = path.join(process.cwd(), "data", "bpe-points");

export function nearestByCategory(center: LngLat, points: BpePoint[], capM: number = BPE_CAP_M): BpeNearest[] {
  // On retient le point le plus proche ET son code TYPEQU, pour restituer le type précis
  // (« Pharmacie » plutôt que « Santé ») dans le snapshot lu par le rapport.
  const best = new Map<Face3Cat, { d: number; t: string }>();
  // LE COMPTAGE À PORTÉE DE PAS, gratuit : la boucle parcourt déjà chaque point et calcule sa
  // distance. Il distingue un secteur où une boulangerie est à 400 m d'un secteur où il y en a
  // quatre, ce que « la plus proche » efface complètement, alors que c'est la différence entre
  // avoir un commerce et avoir le choix.
  const proches = new Map<Face3Cat, number>();
  for (const p of points) {
    const d = haversineM(center, { lat: p.lat, lon: p.lon });
    if (d > capM) continue;
    const cur = best.get(p.c);
    if (cur === undefined || d < cur.d) best.set(p.c, { d, t: p.t });
    if (d <= BPE_WALK_RADIUS_M) proches.set(p.c, (proches.get(p.c) ?? 0) + 1);
  }
  return FACE3_CATS.map((category) => {
    const b = best.get(category);
    return {
      category,
      nearest: b === undefined ? null : { distanceMeters: Math.round(b.d), typeLabel: TYPEQU_LABEL[b.t] ?? null },
      searchCapMeters: capM,
      withinWalkCount: proches.get(category) ?? 0,
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
