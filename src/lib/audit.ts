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
//
// UNE SEULE ENTRÉE : l'identifiant BAN de l'adresse. Le repli par coordonnées (`getAuditByCoordinates`,
// un carré d'environ 50 m) est supprimé (FUT-59, Phase 1.1) : il prenait le dernier audit trouvé dans le
// carré, donc possiblement celui d'un autre bâtiment, et l'écran Logement l'affichait comme celui de
// l'adresse. Une proximité n'attribue pas un audit énergétique.

export async function getAuditByBanId(banId: string): Promise<AuditRecord | null> {
  const rows = await fetchAuditLines({ qs: `identifiant_ban:"${banId}"`, size: "20" });
  return toAuditRecord(rows, banId);
}
