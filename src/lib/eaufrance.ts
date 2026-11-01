import "server-only";
import { estACec } from "./eaufrance-ecoulement.ts";

const HUBEAU_BASE = "https://hubeau.eaufrance.fr/api";
const REQUEST_TIMEOUT_MS = 8000;

// ── Types ────────────────────────────────────────────────────────────────────

type EcoulementRecord = {
  date_observation?: string | null;
  // LE CHAMP S'APPELLE `libelle_ecoulement`. Le code lisait `libelle_observation`, qui n'existe pas dans
  // la réponse Hub'Eau : la valeur était donc toujours `undefined`, et `isDry` toujours FAUX — un cours
  // d'eau à sec n'a jamais pu être signalé. Même signature que le bug « feux de forêt » de Géorisques :
  // une chaîne d'API jamais confrontée à la réalité de la source. Vérifié le 25/07/2026 sur
  // /v1/ecoulement/observations (300 observations, 6 valeurs distinctes).
  libelle_ecoulement?: string | null;
  libelle_cours_eau?: string | null;
};

type HubeauPage<T> = {
  count?: number | null;
  data?: T[] | null;
};

export type EaufranceSummary = {
  inseeCode: string;
  // L'EAU POTABLE N'EST PLUS ICI (FUT-164, 30/10/2026). Ce résumé lisait le premier des 20 derniers résultats
  // de la commune, tous réseaux mêlés, sur six mois, limites seules, et cherchait les nitrites sous le code
  // 1350 (phosphore total) : Marseille sortait « conforme » sur 1 réseau de 16 dont le prélèvement ne
  // respectait pas une référence de qualité. La lecture juste, réseau par réseau, est `server/eau-potable.ts`
  // (FUT-152). Ne pas la recréer ici.
  drought: {
    lastObservationDate: string | null;
    riverName: string | null;
    status: string | null;
    isDry: boolean;
  } | null;
};

// ── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchHubeau<T>(pathname: string, params: URLSearchParams): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${HUBEAU_BASE}${pathname}?${params}`, {
      headers: { accept: "application/json" },
      signal: controller.signal,
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`Hub'Eau ${pathname} failed: ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Loaders ──────────────────────────────────────────────────────────────────

async function loadDrought(inseeCode: string) {
  const oneYearAgo = new Date(Date.now() - 365 * 86_400_000)
    .toISOString()
    .split("T")[0];

  const params = new URLSearchParams({
    code_commune: inseeCode,
    date_observation_min: oneYearAgo,
    fields: ["date_observation", "libelle_observation", "libelle_cours_eau"].join(","),
    sort: "desc",
    size: "5",
  });

  const json = await fetchHubeau<HubeauPage<EcoulementRecord>>(
    "/v1/ecoulement/observations",
    params,
  );

  const records = json.data ?? [];
  if (!records.length) return null;

  const latest = records[0];
  return {
    lastObservationDate: latest.date_observation ?? null,
    riverName: latest.libelle_cours_eau ?? null,
    status: latest.libelle_ecoulement ?? null,
    isDry: estACec(latest.libelle_ecoulement),
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

const eaufranceCache = new Map<string, Promise<EaufranceSummary>>();

async function load(inseeCode: string): Promise<EaufranceSummary> {
  const drought = await loadDrought(inseeCode).catch(() => null);
  return { inseeCode, drought };
}

export async function getEaufranceSummary(inseeCode: string): Promise<EaufranceSummary> {
  const key = inseeCode.trim();

  if (!eaufranceCache.has(key)) {
    eaufranceCache.set(key, load(key));
  }

  try {
    return await eaufranceCache.get(key)!;
  } catch (error) {
    eaufranceCache.delete(key);
    throw error;
  }
}
