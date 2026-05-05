import "server-only";

const ATMO_BASE = "https://admindata.atmo-france.org/api";
const REQUEST_TIMEOUT_MS = 8000;

type PollenRawRecord = {
  code_zone?: string | null;
  date_ech?: string | null;
  code_qual?: string | number | null;
  lib_qual?: string | null;
  pollen_resp?: string | null;
  alerte?: boolean | null;
  source?: string | null;
  code_ambr?: string | number | null;
  code_arm?: string | number | null;
  code_aul?: string | number | null;
  code_boul?: string | number | null;
  code_gram?: string | number | null;
  code_oliv?: string | number | null;
  conc_ambr?: string | number | null;
  conc_arm?: string | number | null;
  conc_aul?: string | number | null;
  conc_boul?: string | number | null;
  conc_gram?: string | number | null;
  conc_oliv?: string | number | null;
};

export type PollenLevel = {
  value: number;
  label: string;
  color: string;
};

export type PollenSummary = {
  inseeCode: string;
  date: string;
  index: PollenLevel;
  alert: boolean | null;
  source: string | null;
  responsibleTaxa: string[];
};

const INDEX: Record<number, { label: string; color: string }> = {
  1: { label: "Très faible", color: "#4ade80" },
  2: { label: "Faible", color: "#86efac" },
  3: { label: "Modéré", color: "#facc15" },
  4: { label: "Élevé", color: "#fb923c" },
  5: { label: "Très élevé", color: "#f87171" },
  6: { label: "Extrêmement élevé", color: "#991b1b" },
};

function toLevel(code: string | number | null | undefined): PollenLevel | null {
  const n = Number(code);
  if (!n || !INDEX[n]) return null;
  return { value: n, ...INDEX[n] };
}

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
    const json = (await res.json()) as { token?: string; value?: string };
    const token = json.token ?? json.value;
    if (!token) throw new Error("ATMO login: no token in response");
    cachedToken = token;
    tokenExpiresAt = Date.now() + 60 * 60 * 1000;
    return token;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchRecords(inseeCode: string, date: string): Promise<PollenRawRecord[]> {
  const token = await getToken();
  const params = new URLSearchParams({
    format: "geojson",
    code_zone: inseeCode,
    date,
    with_geom: "false",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${ATMO_BASE}/v2/data/indices/pollens?${params.toString()}`, {
      headers: {
        accept: "application/json",
        authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`ATMO pollens failed: ${res.status}`);
    const json = (await res.json()) as { features?: { properties: PollenRawRecord }[] };
    return (json.features ?? []).map((feature) => feature.properties);
  } finally {
    clearTimeout(timeout);
  }
}

function parseRecord(raw: PollenRawRecord, inseeCode: string): PollenSummary | null {
  const index = toLevel(raw.code_qual);
  if (!index) return null;

  return {
    inseeCode,
    date: raw.date_ech ?? "",
    index,
    alert: typeof raw.alerte === "boolean" ? raw.alerte : null,
    source: raw.source ?? null,
    responsibleTaxa: (raw.pollen_resp ?? "")
      .split(" ")
      .map((taxon) => taxon.trim())
      .filter(Boolean),
  };
}

async function load(inseeCode: string): Promise<PollenSummary | null> {
  const today = new Date().toISOString().split("T")[0];
  const records = await fetchRecords(inseeCode, today);

  if (records.length) return parseRecord(records[0], inseeCode);

  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
  const fallback = await fetchRecords(inseeCode, yesterday);
  return fallback.length ? parseRecord(fallback[0], inseeCode) : null;
}

const cache = new Map<string, Promise<PollenSummary | null>>();

export async function getPollensForCommune(inseeCode: string): Promise<PollenSummary | null> {
  const today = new Date().toISOString().split("T")[0];
  const key = `${inseeCode.trim()}:${today}`;

  if (!cache.has(key)) {
    cache.set(key, load(inseeCode.trim()).catch(() => null));
  }

  return cache.get(key)!;
}
