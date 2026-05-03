import "server-only";

const ATMO_BASE = "https://admindata.atmo-france.org/api";
const REQUEST_TIMEOUT_MS = 8000;

// ── Raw API types ────────────────────────────────────────────────────────────
type AtmoRawRecord = {
  code_zone?: string | null;
  date_ech?: string | null;
  code_qual?: string | number | null;
  code_pm25?: string | number | null;
  code_pm10?: string | number | null;
  code_no2?: string | number | null;
  code_o3?: string | number | null;
};

// ── Public types ─────────────────────────────────────────────────────────────
export type AtmoLevel = {
  value: number;
  label: string;
  color: string;
};

export type AtmoAirQuality = {
  inseeCode: string;
  date: string;
  index: AtmoLevel;
  pollutants: {
    pm25: AtmoLevel | null;
    pm10: AtmoLevel | null;
    no2: AtmoLevel | null;
    o3: AtmoLevel | null;
  };
};

// ── Index scale ──────────────────────────────────────────────────────────────
const INDEX: Record<number, { label: string; color: string }> = {
  1: { label: "Bon", color: "#4ade80" },
  2: { label: "Moyen", color: "#a3e635" },
  3: { label: "Dégradé", color: "#facc15" },
  4: { label: "Mauvais", color: "#f97316" },
  5: { label: "Très mauvais", color: "#ef4444" },
  6: { label: "Extrêmement mauvais", color: "#991b1b" },
};

function toLevel(code: string | number | null | undefined): AtmoLevel | null {
  const n = Number(code);
  if (!n || !INDEX[n]) return null;
  return { value: n, ...INDEX[n] };
}

// ── Token cache (module-level, per serverless instance) ──────────────────────
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getToken(): Promise<string> {
  const username = process.env.ATMO_USERNAME;
  const password = process.env.ATMO_PASSWORD;

  if (!username || !password) {
    throw new Error("ATMO_USERNAME and ATMO_PASSWORD are required.");
  }

  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${ATMO_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`ATMO login failed: ${res.status}`);
    const { value } = (await res.json()) as { value: string };
    cachedToken = value;
    tokenExpiresAt = Date.now() + 60 * 60 * 1000;
    return value;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Fetch ────────────────────────────────────────────────────────────────────
async function fetchRecords(inseeCode: string, date: string): Promise<AtmoRawRecord[]> {
  const token = await getToken();

  const filter = JSON.stringify({
    code_zone: { operator: "=", value: inseeCode },
    date_ech: { operator: "=", value: date },
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(
      `${ATMO_BASE}/data/112/${encodeURIComponent(filter)}?withGeom=false`,
      {
        headers: {
          accept: "application/json",
          authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
        next: { revalidate: 3600 },
      },
    );

    if (!res.ok) throw new Error(`ATMO data failed: ${res.status}`);
    return (await res.json()) as AtmoRawRecord[];
  } finally {
    clearTimeout(timeout);
  }
}

function parseRecord(raw: AtmoRawRecord, inseeCode: string): AtmoAirQuality | null {
  const index = toLevel(raw.code_qual);
  if (!index) return null;

  return {
    inseeCode,
    date: raw.date_ech ?? "",
    index,
    pollutants: {
      pm25: toLevel(raw.code_pm25),
      pm10: toLevel(raw.code_pm10),
      no2: toLevel(raw.code_no2),
      o3: toLevel(raw.code_o3),
    },
  };
}

// ── Load (with yesterday fallback — ATMO updates at 13h Paris) ───────────────
async function load(inseeCode: string): Promise<AtmoAirQuality | null> {
  const today = new Date().toISOString().split("T")[0];
  const records = await fetchRecords(inseeCode, today);

  if (records.length) return parseRecord(records[0], inseeCode);

  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
  const fallback = await fetchRecords(inseeCode, yesterday);
  return fallback.length ? parseRecord(fallback[0], inseeCode) : null;
}

// ── Public API (with in-memory dedup cache keyed on insee+date) ──────────────
const cache = new Map<string, Promise<AtmoAirQuality | null>>();

export async function getAtmoForCommune(inseeCode: string): Promise<AtmoAirQuality | null> {
  const today = new Date().toISOString().split("T")[0];
  const key = `${inseeCode.trim()}:${today}`;

  if (!cache.has(key)) {
    cache.set(key, load(inseeCode.trim()).catch(() => null));
  }

  return cache.get(key)!;
}
