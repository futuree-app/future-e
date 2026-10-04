import "server-only";
import {
  AUDIT_PROCHE_SELECT, AUDIT_SELECT, candidatProche, toAuditRecord,
  type AuditApiRow, type AuditCandidatProche, type AuditProcheApiRow, type AuditRecord,
} from "@/lib/audit-record";

// Le chargement des audits énergétiques ADEME (`audit-opendata`). Le contrat des colonnes et leur
// lecture vivent dans `audit-record.ts`, pur et testé (FUT-59).
export type { AuditCandidatProche, AuditRecord, AuditScenario } from "@/lib/audit-record";

const BASE = "https://data.ademe.fr/data-fair/api/v1/datasets/audit-opendata";

async function fetchAuditLines<T>(params: Record<string, string>, select: readonly string[]): Promise<T[]> {
  const url = new URL(`${BASE}/lines`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("select", select.join(","));
  url.searchParams.set("sort", "-date_etablissement_audit");
  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!res.ok) return [];
  const json = (await res.json()) as { results?: T[] };
  return json.results ?? [];
}

// ── Public API ───────────────────────────────────────────────────────────────
//
// DEUX ENTRÉES, DEUX TYPES (FUT-59). L'ancien repli par coordonnées rendait le dernier audit d'un carré
// d'environ 50 m SOUS LA FORME d'un audit de l'adresse : l'écran Logement l'affichait comme le sien.
// La recherche spatiale demeure, mais elle rend un `AuditCandidatProche` : une référence et une distance,
// aucune valeur. Une proximité ne prouve pas qu'un audit concerne ce bâtiment.

export async function getAuditByBanId(banId: string): Promise<AuditRecord | null> {
  const rows = await fetchAuditLines<AuditApiRow>({ qs: `identifiant_ban:"${banId}"`, size: "20" }, AUDIT_SELECT);
  return toAuditRecord(rows, banId);
}

/** Un audit voisin (carré d'environ 50 m), hors audits de l'adresse. Jamais une valeur. */
export async function getNearbyAuditCandidate(
  latitude: number,
  longitude: number,
  banId: string | null,
  radiusM = 50,
): Promise<AuditCandidatProche | null> {
  const deg  = radiusM / 111_000;
  const bbox = `${longitude - deg},${latitude - deg},${longitude + deg},${latitude + deg}`;
  const rows = await fetchAuditLines<AuditProcheApiRow>({ bbox, size: "20" }, AUDIT_PROCHE_SELECT);
  return candidatProche(rows, { latitude, longitude }, banId);
}
