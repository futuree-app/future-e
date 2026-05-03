import "server-only";

const BASE = "https://data.ademe.fr/data-fair/api/v1/datasets";

// ── Types ────────────────────────────────────────────────────────────────────

export type CostStats = {
  median_ht: number;
  min_ht: number;
  max_ht: number;
  samples: number;
  unit: string;
};

export type IsolationCosts = Record<string, CostStats>; // keyed by poste_isolation
export type ChauffageCosts = Record<string, CostStats>; // keyed by generateur

export type RenovationCosts = {
  departement: string;
  // Note: données enquête 2017-2018, à titre indicatif uniquement
  isolation: IsolationCosts;
  chauffage: ChauffageCosts;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid    = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

type IsoRow = {
  Code_département?: string | null;
  poste_isolation?: string | null;
  cout_total_ht?: number | null;
  surface?: number | null;
};

type ChauffageRow = {
  Code_département?: string | null;
  generateur?: string | null;
  cout_total_ht?: number | null;
};

// Per-dataset in-memory cache (loaded once)
let isoCache:      IsoRow[]      | null = null;
let chauffCache:   ChauffageRow[] | null = null;

async function loadAll<T>(datasetId: string, select: string): Promise<T[]> {
  const url = new URL(`${BASE}/${datasetId}/lines`);
  url.searchParams.set("size", "10000");
  url.searchParams.set("select", select);
  const res = await fetch(url.toString(), { next: { revalidate: 604800 } }); // 1 week — static survey data
  if (!res.ok) return [];
  const json = (await res.json()) as { results?: T[] };
  return json.results ?? [];
}

async function getIsoData(): Promise<IsoRow[]> {
  if (!isoCache) isoCache = await loadAll<IsoRow>("isolation", "Code_département,poste_isolation,cout_total_ht,surface");
  return isoCache;
}

async function getChauffageData(): Promise<ChauffageRow[]> {
  if (!chauffCache) chauffCache = await loadAll<ChauffageRow>("chauffage", "Code_département,generateur,cout_total_ht");
  return chauffCache;
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function getRenovationCosts(departement: string): Promise<RenovationCosts> {
  const [isoRows, chauffRows] = await Promise.all([getIsoData(), getChauffageData()]);

  // Isolation — group by poste, compute cost per m² when surface available
  const isoByPoste = new Map<string, number[]>();
  for (const row of isoRows) {
    if (row.Code_département !== departement) continue;
    const poste = row.poste_isolation ?? "AUTRE";
    const total = row.cout_total_ht ?? 0;
    const surf  = row.surface ?? 0;
    const val   = surf > 0 ? total / surf : total;
    if (val > 0) {
      const list = isoByPoste.get(poste) ?? [];
      list.push(val);
      isoByPoste.set(poste, list);
    }
  }

  const isolation: IsolationCosts = {};
  for (const [poste, vals] of isoByPoste) {
    isolation[poste] = {
      median_ht: Math.round(median(vals)),
      min_ht:    Math.round(Math.min(...vals)),
      max_ht:    Math.round(Math.max(...vals)),
      samples:   vals.length,
      unit:      "€/m²",
    };
  }

  // Chauffage — group by generateur, compute total cost
  const chauffByGen = new Map<string, number[]>();
  for (const row of chauffRows) {
    if (row.Code_département !== departement) continue;
    const gen = row.generateur ?? "AUTRE";
    const val = row.cout_total_ht ?? 0;
    if (val > 0) {
      const list = chauffByGen.get(gen) ?? [];
      list.push(val);
      chauffByGen.set(gen, list);
    }
  }

  const chauffage: ChauffageCosts = {};
  for (const [gen, vals] of chauffByGen) {
    chauffage[gen] = {
      median_ht: Math.round(median(vals)),
      min_ht:    Math.round(Math.min(...vals)),
      max_ht:    Math.round(Math.max(...vals)),
      samples:   vals.length,
      unit:      "€",
    };
  }

  return { departement, isolation, chauffage };
}
