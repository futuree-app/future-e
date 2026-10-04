import "server-only";
import { AUDIT_SELECT, toAuditRecord, type AuditApiRow, type AuditRecord } from "@/lib/audit-record";

// Le chargement des audits énergétiques ADEME (`audit-opendata`). Le contrat des colonnes et leur
// lecture vivent dans `audit-record.ts`, pur et testé (FUT-59).
export type { AuditRecord, AuditScenario } from "@/lib/audit-record";

const BASE = "https://data.ademe.fr/data-fair/api/v1/datasets/audit-opendata";

async function fetchAuditLines(params: Record<string, string>): Promise<AuditApiRow[]> {
  const url = new URL(`${BASE}/lines`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("select", AUDIT_SELECT.join(","));
  url.searchParams.set("sort", "-date_etablissement_audit");
  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!res.ok) return [];
  const json = (await res.json()) as { results?: AuditApiRow[] };
  return json.results ?? [];
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function getAuditByBanId(banId: string): Promise<AuditRecord | null> {
  const rows = await fetchAuditLines({ qs: `identifiant_ban:"${banId}"`, size: "20" });
  return toAuditRecord(rows);
}

export async function getAuditByCoordinates(
  latitude: number,
  longitude: number,
  radiusM = 50,
): Promise<AuditRecord | null> {
  const deg  = radiusM / 111_000;
  const bbox = `${longitude - deg},${latitude - deg},${longitude + deg},${latitude + deg}`;
  const rows = await fetchAuditLines({ bbox, size: "20" });
  return toAuditRecord(rows);
}
