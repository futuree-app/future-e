import "server-only";

// UN EXTRAIT, PAS LE REGISTRE (FUT-145, 27/10/2026). Ce jeu ADEME (`data_risk_IREP`, millésime 2019)
// compte environ 1 500 établissements ; le registre national IREP publié sur Géorisques en compte
// plusieurs milliers de plus. Une réponse vide ne dit donc rien de l'absence d'installations, et une
// réponse non vide n'en est qu'une partie. Mesure de l'audit FUT-82 : sur 38 communes, la page disait
// « aucune installation » pour 20, dont 17 où le registre 2024 en recense dans le même rayon (Metz : 25).
// L'écran public ne l'interroge plus (cf. `PollutionLookup`) ; quiconque le rebranche hérite de ces
// limites, et du contrat ci-dessous : une panne lève une erreur, une liste coupée le dit.
const DATASET_URL =
  "https://data.ademe.fr/data-fair/api/v1/datasets/085ipnlpj9awm78hikh1nakj";
const PAGE = 20;
const TIMEOUT_MS = 8000;

export const IREP_SOURCE = {
  producteur: "ADEME",
  jeu: "data_risk_IREP",
  millesime: 2019,
  // Extrait partiel du registre national : jamais une base d'absence.
  exhaustif: false,
} as const;

// ── Types ────────────────────────────────────────────────────────────────────

export type IrepInstallation = {
  id: number;
  nom: string;
  latitude: number;
  longitude: number;
  distanceM: number;
  nombre_polluants: number;
  milieu_emission: string | null;
};

export type IrepResult = {
  count: number;
  installations: IrepInstallation[];
  // La source compte plus de lignes dans le carré de recherche que la page servie : la liste est
  // incomplète, et les plus proches peuvent manquer (l'API ne trie pas par distance).
  tronque: boolean;
  source: typeof IREP_SOURCE;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const dφ = ((lat2 - lat1) * Math.PI) / 180;
  const dλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function getIrepNearPoint(
  latitude: number,
  longitude: number,
  radiusM = 5000,
): Promise<IrepResult> {
  const deg = radiusM / 111_000;
  const bbox = `${longitude - deg},${latitude - deg},${longitude + deg},${latitude + deg}`;

  const url = new URL(`${DATASET_URL}/lines`);
  url.searchParams.set("bbox", bbox);
  url.searchParams.set("size", String(PAGE));
  url.searchParams.set(
    "select",
    "identifiant,nom_etablissement,latitude,longitude,nombre_polluants,milieu_emission",
  );

  // Une panne n'est pas une absence : elle lève, et la route répond 502 (jamais une liste vide).
  const res = await fetch(url.toString(), { next: { revalidate: 86400 }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`irep:${res.status}`);

  const json = (await res.json()) as {
    total?: number;
    results?: Array<{
      identifiant: number;
      nom_etablissement: string;
      latitude: number;
      longitude: number;
      nombre_polluants?: number | null;
      milieu_emission?: string | null;
    }>;
  };

  // Un HTTP 200 sans tableau de résultats est une réponse d'erreur déguisée, pas un vide.
  if (!Array.isArray(json.results)) throw new Error("irep:reponse-sans-resultats");
  const tronque = typeof json.total === "number" ? json.total > json.results.length : json.results.length >= PAGE;

  const installations = json.results
    .map((r) => ({
      id:               r.identifiant,
      nom:              r.nom_etablissement,
      latitude:         r.latitude,
      longitude:        r.longitude,
      distanceM:        Math.round(haversineM(latitude, longitude, r.latitude, r.longitude)),
      nombre_polluants: r.nombre_polluants ?? 0,
      milieu_emission:  r.milieu_emission ?? null,
    }))
    .filter((r) => r.distanceM <= radiusM)
    .sort((a, b) => a.distanceM - b.distanceM);

  return { count: installations.length, installations, tronque, source: IREP_SOURCE };
}
