import "server-only";

const BASE = "https://data.ademe.fr/data-fair/api/v1/datasets/audit-opendata";

// ── Types ────────────────────────────────────────────────────────────────────

export type AuditScenario = {
  categorie: string | null;
  etape: string | null;
  travaux: string | null;
  conso_ep: number | null;
  emission_ges: number | null;
};

export type AuditRecord = {
  n_audit: string;
  date_audit: string | null;
  classe_dpe_actuel: string | null;
  adresse: string | null;
  scenarios: AuditScenario[];
};

// ── Internal ─────────────────────────────────────────────────────────────────

const SELECT = [
  "n_audit",
  "id_etape",
  "identifiant_ban",
  "adresse_ban",
  "code_insee_ban",
  "date_etablissement_audit",
  "classe_bilan_dpe",
  "categorie_scenario",
  "etape_travaux",
  "travaux_realises",
  "ep_conso_5_usages",
  "emission_ges_5_usages",
].join(",");

type ApiRow = {
  n_audit: string;
  identifiant_ban?: string | null;
  adresse_ban?: string | null;
  date_etablissement_audit?: string | null;
  classe_bilan_dpe?: string | null;
  categorie_scenario?: string | null;
  etape_travaux?: string | null;
  travaux_realises?: string | null;
  ep_conso_5_usages?: number | null;
  emission_ges_5_usages?: number | null;
};

function toAuditRecord(rows: ApiRow[]): AuditRecord | null {
  if (rows.length === 0) return null;

  // Group by n_audit, keep only the most recent audit's rows
  const byAudit = new Map<string, ApiRow[]>();
  for (const row of rows) {
    const list = byAudit.get(row.n_audit) ?? [];
    list.push(row);
    byAudit.set(row.n_audit, list);
  }

  const [firstKey, auditRows] = byAudit.entries().next().value as [string, ApiRow[]];
  void firstKey;
  const head = auditRows[0];

  return {
    n_audit:          head.n_audit,
    date_audit:       head.date_etablissement_audit ?? null,
    classe_dpe_actuel: head.classe_bilan_dpe ?? null,
    adresse:          head.adresse_ban ?? null,
    scenarios: auditRows.map((r) => ({
      categorie:   r.categorie_scenario ?? null,
      etape:       r.etape_travaux ?? null,
      travaux:     r.travaux_realises ?? null,
      conso_ep:    r.ep_conso_5_usages ?? null,
      emission_ges: r.emission_ges_5_usages ?? null,
    })),
  };
}

async function fetchAuditLines(params: Record<string, string>): Promise<ApiRow[]> {
  const url = new URL(`${BASE}/lines`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("select", SELECT);
  url.searchParams.set("sort", "-date_etablissement_audit");
  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!res.ok) return [];
  const json = (await res.json()) as { results?: ApiRow[] };
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
