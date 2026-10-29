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
  source?: string | null;
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
  /** L'association agréée qui publie l'indice (« Atmo Grand Est », « Airparif »). */
  source: string | null;
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
        // Pas de cache de données Next : il garderait une heure une réponse 200 au contenu inattendu, que
        // `enregistrementsAtmo` refuse. Seule une lecture réussie est gardée, par `lire` puis par la route.
        cache: "no-store",
      },
    );

    if (!res.ok) throw new Error(`ATMO data failed: ${res.status}`);
    return enregistrementsAtmo(await res.json());
  } finally {
    clearTimeout(timeout);
  }
}

/** Une réponse ATMO dont la forme n'est pas celle documentée : une panne, jamais une absence d'indice. */
export class ReponseAtmoInattendue extends Error {}

const estObjet = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * LES ENREGISTREMENTS D'UNE RÉPONSE ATMO, OU UNE ERREUR (revue du 29/10/2026). Deux formes sont documentées : un
 * tableau d'enregistrements, ou un GeoJSON dont chaque `feature` porte ses `properties`. Tout le reste (objet
 * d'erreur, `features` absent, élément qui n'est pas un objet) LÈVE : avant, `json.features ?? []` en faisait
 * une liste vide, donc « aucun indice publié », gardée en cache comme un résultat valide.
 */
export function enregistrementsAtmo(json: unknown): AtmoRawRecord[] {
  if (Array.isArray(json) && json.every(estObjet)) return json as AtmoRawRecord[];
  if (estObjet(json) && Array.isArray(json.features) && json.features.every((f) => estObjet(f) && estObjet(f.properties))) {
    return (json.features as { properties: AtmoRawRecord }[]).map((f) => f.properties);
  }
  throw new ReponseAtmoInattendue("ATMO : réponse de forme inattendue");
}

/**
 * Un enregistrement → l'indice. `null` pour `code_qual` 0, que la nomenclature ATMO réserve à un indice
 * absent ; toute autre valeur hors de l'échelle 1 à 6 est une réponse inattendue, et LÈVE.
 */
export function parseRecord(raw: AtmoRawRecord, inseeCode: string): AtmoAirQuality | null {
  if (raw.code_qual === 0 || raw.code_qual === "0") return null;
  const index = toLevel(raw.code_qual);
  if (!index) throw new ReponseAtmoInattendue(`ATMO : code_qual inattendu (${String(raw.code_qual)})`);

  return {
    inseeCode,
    date: raw.date_ech ?? "",
    source: typeof raw.source === "string" && raw.source.trim() ? raw.source.trim() : null,
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
// FUT-152 : une panne LÈVE, une absence d'indice rend `null`. L'API couvre toutes les communes testées le
// 28/10/2026 (village de l'Ain, Corse, Réunion, Martinique) : un indice manquant n'est pas un « trou de
// couverture régional », et une panne ne doit jamais être présentée comme tel.
async function load(inseeCode: string): Promise<AtmoAirQuality | null> {
  const today = new Date().toISOString().split("T")[0];
  const records = await fetchRecords(inseeCode, today);
  const indice = records.length ? parseRecord(records[0], inseeCode) : null;
  if (indice) return indice;

  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
  const fallback = await fetchRecords(inseeCode, yesterday);
  return fallback.length ? parseRecord(fallback[0], inseeCode) : null;
}

export type LectureAtmo =
  | { etat: "disponible"; indice: AtmoAirQuality }
  | { etat: "absent_dans_source" }
  | { etat: "indisponible" };

// ── Public API (with in-memory dedup cache keyed on insee+date) ──────────────
// Seule une lecture RÉUSSIE est gardée : une panne se retente à l'appel suivant (avant FUT-152, un échec
// était mémorisé pour la journée entière par instance).
const cache = new Map<string, Promise<AtmoAirQuality | null>>();

function lire(inseeCode: string): Promise<AtmoAirQuality | null> {
  const today = new Date().toISOString().split("T")[0];
  const key = `${inseeCode.trim()}:${today}`;

  if (!cache.has(key)) {
    cache.set(key, load(inseeCode.trim()).catch((e) => {
      cache.delete(key);
      throw e;
    }));
  }

  return cache.get(key)!;
}

/** La lecture à trois états. Ne lève jamais. */
export async function lireAtmoCommune(inseeCode: string): Promise<LectureAtmo> {
  try {
    const indice = await lire(inseeCode);
    return indice ? { etat: "disponible", indice } : { etat: "absent_dans_source" };
  } catch {
    return { etat: "indisponible" };
  }
}

/** Contrat historique (page chaleur, aperçu du wizard) : `null` pour une absence comme pour une panne. */
export async function getAtmoForCommune(inseeCode: string): Promise<AtmoAirQuality | null> {
  return lire(inseeCode).catch(() => null);
}
