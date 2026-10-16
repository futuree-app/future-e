import "server-only";
import {
  AUDIT_PROCHE_SELECT, AUDIT_SELECT, candidatProche, lectureAudit,
  type AuditApiRow, type AuditCandidatProche, type AuditLookup, type AuditProcheApiRow,
} from "@/lib/audit-record";

// Le chargement des audits énergétiques ADEME (`audit-opendata`). Le contrat des colonnes et leur
// lecture vivent dans `audit-record.ts`, pur et testé (FUT-59).
export type { AuditCandidatProche, AuditLookup, AuditRecord, AuditScenario, AuditStatus } from "@/lib/audit-record";

const BASE = "https://data.ademe.fr/data-fair/api/v1/datasets/audit-opendata";

// Le délai des autres sources du module Logement (Géorisques, GPU, cadastre : 8 s).
const SOURCE_TIMEOUT_MS = 8_000;

async function fetchAuditLines<T>(params: Record<string, string>, select: readonly string[]): Promise<T[]> {
  const url = new URL(`${BASE}/lines`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("select", select.join(","));
  // FUT-62 : à date égale, le numéro d'audit range les lignes d'un même audit ensemble. Sans lui, l'ordre
  // de l'API décidait seul quel audit d'une adresse qui en porte plusieurs s'affichait.
  url.searchParams.set("sort", "-date_etablissement_audit,n_audit");
  // BORNÉE (FUT-13) : sans délai, une réponse ADEME qui traîne tenait tout le module Logement.
  const res = await fetch(url.toString(), { next: { revalidate: 86400 }, signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS) });
  // UNE PANNE LÈVE (FUT-65). `[]` est réservé à la source qui a RÉPONDU sans ligne : un 500, une
  // réponse illisible ou sans liste de résultats ne disent rien de l'existence d'un audit.
  if (!res.ok) throw new Error(`audit-opendata:${res.status}`);
  const json = (await res.json()) as { results?: unknown };
  if (!Array.isArray(json?.results)) throw new Error("audit-opendata:reponse-inexploitable");
  return json.results as T[];
}

// ── Public API ───────────────────────────────────────────────────────────────
//
// DEUX ENTRÉES, DEUX TYPES (FUT-59). L'ancien repli par coordonnées rendait le dernier audit d'un carré
// d'environ 50 m SOUS LA FORME d'un audit de l'adresse : l'écran Logement l'affichait comme le sien.
// La recherche spatiale demeure, mais elle rend un `AuditCandidatProche` : une référence et une distance,
// aucune valeur. Une proximité ne prouve pas qu'un audit concerne ce bâtiment.

/** L'audit de l'adresse exacte, et ce que la recherche a établi : présent, absent, ou non vérifiable. Ne lève pas. */
// FUT-62 : 60 lignes, pas 20. Un audit compte quatre à sept lignes (une par étape) : 20 lignes coupaient
// déjà le troisième audit d'une adresse, sans que personne le sache. Au-delà de 60, la liste est dite
// incomplète (`lectureAudit`).
const AUDIT_LIGNES_MAX = 60;

/** L'audit de l'adresse exacte, et ce que la recherche a établi : présent, absent, ou non vérifiable. Ne lève pas. */
export async function getAuditByBanId(banId: string): Promise<AuditLookup> {
  const rows = await fetchAuditLines<AuditApiRow>({ qs: `identifiant_ban:"${banId}"`, size: String(AUDIT_LIGNES_MAX) }, AUDIT_SELECT)
    .catch(() => null); // délai dépassé, réseau, HTTP non-2xx, réponse inexploitable
  return lectureAudit(rows, banId, rows != null && rows.length >= AUDIT_LIGNES_MAX);
}

/** Un audit voisin (carré d'environ 50 m), hors audits de l'adresse. Jamais une valeur. Lève sur une panne. */
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
