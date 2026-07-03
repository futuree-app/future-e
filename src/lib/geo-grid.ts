export const GRID_CELL_DEG = 0.18; // aligné sur populate-bpe.py CELL (BPE points)

const idx = (v: number, cell: number) => Math.floor(v / cell);

export function cellKey(lat: number, lon: number, cellDeg: number = GRID_CELL_DEG): string {
  return `g_${idx(lat, cellDeg)}_${idx(lon, cellDeg)}`;
}

export function neighborKeys(lat: number, lon: number, cellDeg: number = GRID_CELL_DEG): string[] {
  const i = idx(lat, cellDeg);
  const j = idx(lon, cellDeg);
  const out: string[] = [];
  for (let di = -1; di <= 1; di++)
    for (let dj = -1; dj <= 1; dj++) out.push(`g_${i + di}_${j + dj}`);
  return out;
}

export function cellBBox(
  key: string,
  cellDeg: number = GRID_CELL_DEG,
): { s: number; w: number; n: number; e: number } {
  const m = key.match(/^g_(-?\d+)_(-?\d+)$/);
  if (!m) throw new Error(`clé de cellule invalide: ${key}`);
  const i = parseInt(m[1], 10);
  const j = parseInt(m[2], 10);
  return { s: i * cellDeg, w: j * cellDeg, n: (i + 1) * cellDeg, e: (j + 1) * cellDeg };
}
