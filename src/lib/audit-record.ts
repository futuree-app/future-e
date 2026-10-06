// L'AUDIT ÉNERGÉTIQUE ADEME, TEL QUE LE PRODUIT LE LIT (FUT-59). Module PUR : aucune I/O, testable sous
// `node --test`. Le chargement réseau vit dans `audit.ts`.
//
// ── LE CONTRAT, ÉTABLI LE 04/10/2026 ──────────────────────────────────────────────────────────
// Jeu `audit-opendata` (ADEME, « Audits énergétiques logement existants », data.ademe.fr). Une ligne
// par ÉTAPE de scénario. Pour la consommation en énergie primaire, tous usages (« 5 usages »), le jeu
// publie DEUX grandeurs :
//   - `ep_conso_5_usages_m2` (titre source « conso_ep_5_usages_par_m2 ») : par m² et par an,
//     c'est-à-dire kWh EP/m²/an ;
//   - `ep_conso_5_usages` (« conso_ep_5_usages ») : la consommation TOTALE de l'objet audité,
//     kWh EP/an, égale à la précédente multipliée par la surface habitable de référence.
// Vérifié sur l'audit de l'incident (5 étapes : total = par m² × 434 m², surface de l'IMMEUBLE) et sur
// 80 lignes publiques : la surface de référence est `surface_habitable_logement` quand elle est
// renseignée (40/40), sinon `surface_habitable_immeuble` (40/40). Même structure pour les émissions
// (`emission_ges_5_usages_m2`, kg CO₂/m²/an).
//
// LE DÉFAUT CORRIGÉ. `audit.ts` lisait `ep_conso_5_usages` (le TOTAL) et l'écran l'affichait suivi de
// « kWh/m²/an » : 218 538 kWh EP/an pour un immeuble de 434 m² devenaient « 218538.427059351 kWh/m²/an »,
// au lieu de 503,5 kWh EP/m²/an. Aucune division n'est faite ici : la grandeur par m² existe à la source,
// et c'est elle qu'on lit. Les champs internes portent désormais leur unité dans leur nom.
//
// ── LE GRAIN ─────────────────────────────────────────────────────────────────────────────────
// Un audit porte sur un LOGEMENT ou sur un IMMEUBLE entier, et il est trouvé par l'identifiant BAN de
// l'adresse, pas rattaché au diagnostic choisi. L'objet audité se lit dans ses surfaces : l'écran le
// dit, pour qu'un audit d'immeuble ne passe pas pour celui du logement.

/** Une étape de scénario, par m² de la surface de référence de l'audit. */
export type AuditScenario = {
  categorie: string | null;
  etape: string | null;
  travaux: string | null;
  /** Consommation d'énergie primaire, 5 usages, kWh EP/m²/an (source `ep_conso_5_usages_m2`). */
  conso_ep_m2: number | null;
  /** Émissions de gaz à effet de serre, 5 usages, kg CO₂/m²/an (source `emission_ges_5_usages_m2`). */
  emission_ges_m2: number | null;
};

/**
 * L'objet audité, et la surface à laquelle se rapportent les valeurs par m². Dictionnaire ADEME (JDD) :
 * `surface_habitable_logement` est « renseignée sauf dans le cas du dpe à l'immeuble » ;
 * `surface_habitable_immeuble` est la « surface habitable totale de l'immeuble ».
 */
export type AuditObjet =
  | { grain: "logement"; surface_m2: number }
  | { grain: "immeuble"; surface_m2: number }
  | null;

/**
 * COMMENT L'AUDIT A ÉTÉ TROUVÉ (FUT-59). Deux concepts, deux TYPES, jamais mélangés :
 *   - `exact_address` : le même identifiant BAN que l'adresse. Seul cas qui porte des valeurs, et seul
 *     cas que l'écran Logement peut afficher (`AuditRecord`) ;
 *   - `nearby_candidate` : un audit trouvé à moins d'environ 50 m, SANS correspondance d'adresse
 *     (`AuditCandidatProche`). Une distance ne prouve pas qu'il concerne ce bâtiment : ce type ne porte
 *     donc AUCUNE valeur énergétique. Il est conservé pour qu'une preuve future (parcelle, identifiant de
 *     bâtiment, BDNB…) puisse un jour confirmer l'attribution ; la distance seule ne la confirme jamais.
 */
export type AuditCorrespondance = "exact_address";

/** Un audit voisin, non attribué. Référence et distance seulement : aucune consommation, aucune classe. */
export type AuditCandidatProche = {
  correspondance: "nearby_candidate";
  n_audit: string;
  date_audit: string | null;
  /** Distance à vol d'oiseau entre le point de l'adresse et le point géocodé de l'audit, en mètres. */
  distance_m: number | null;
};

export type AuditRecord = {
  /** La provenance de l'attribution. Seule une correspondance d'adresse exacte existe. */
  correspondance: AuditCorrespondance;
  n_audit: string;
  date_audit: string | null;
  classe_dpe_actuel: string | null;
  adresse: string | null;
  objet: AuditObjet;
  scenarios: AuditScenario[];
};

/** Les colonnes lues. Les totaux (`ep_conso_5_usages`, `emission_ges_5_usages`) n'en font PAS partie. */
export const AUDIT_SELECT = [
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
  "ep_conso_5_usages_m2",
  "emission_ges_5_usages_m2",
  "surface_habitable_logement",
  "surface_habitable_immeuble",
] as const;

export type AuditApiRow = {
  n_audit: string;
  identifiant_ban?: string | null;
  adresse_ban?: string | null;
  date_etablissement_audit?: string | null;
  classe_bilan_dpe?: string | null;
  categorie_scenario?: string | null;
  etape_travaux?: string | null;
  travaux_realises?: string | null;
  ep_conso_5_usages_m2?: number | null;
  emission_ges_5_usages_m2?: number | null;
  surface_habitable_logement?: number | null;
  surface_habitable_immeuble?: number | null;
};

const fini = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** La surface de référence, selon la règle observée à la source : le logement s'il est renseigné. */
export function objetAudite(row: AuditApiRow): AuditObjet {
  if (fini(row.surface_habitable_logement) && row.surface_habitable_logement > 0) {
    return { grain: "logement", surface_m2: row.surface_habitable_logement };
  }
  if (fini(row.surface_habitable_immeuble) && row.surface_habitable_immeuble > 0) {
    return { grain: "immeuble", surface_m2: row.surface_habitable_immeuble };
  }
  return null;
}

/**
 * L'audit d'UNE adresse, à partir des lignes renvoyées par la source (triées du plus récent).
 *
 * Seules les lignes dont l'identifiant BAN est EXACTEMENT celui de l'adresse sont gardées : la recherche
 * plein texte de la source ne doit jamais faire entrer l'audit d'une autre adresse. Puis le premier audit
 * rencontré (le plus récent) est retenu, avec toutes ses étapes.
 */
export function toAuditRecord(rows: AuditApiRow[], banId: string): AuditRecord | null {
  rows = rows.filter((r) => r.identifiant_ban === banId);
  if (rows.length === 0) return null;

  const byAudit = new Map<string, AuditApiRow[]>();
  for (const row of rows) {
    const list = byAudit.get(row.n_audit) ?? [];
    list.push(row);
    byAudit.set(row.n_audit, list);
  }

  const auditRows = byAudit.values().next().value as AuditApiRow[];
  const head = auditRows[0];

  return {
    correspondance: "exact_address",
    n_audit: head.n_audit,
    date_audit: head.date_etablissement_audit ?? null,
    classe_dpe_actuel: head.classe_bilan_dpe ?? null,
    adresse: head.adresse_ban ?? null,
    objet: objetAudite(head),
    scenarios: auditRows.map((r) => ({
      categorie: r.categorie_scenario ?? null,
      etape: r.etape_travaux ?? null,
      travaux: r.travaux_realises ?? null,
      conso_ep_m2: fini(r.ep_conso_5_usages_m2) ? r.ep_conso_5_usages_m2 : null,
      emission_ges_m2: fini(r.emission_ges_5_usages_m2) ? r.emission_ges_5_usages_m2 : null,
    })),
  };
}

/**
 * Une consommation par m², au dixième, à la française : la précision des diagnostics publiés
 * (`conso_5_usages_par_m2_ep` du DPE est au dixième). L'audit publie le quotient brut
 * (503,544762809564) : ses douze décimales ne disent rien de plus que la mesure.
 */
export function formatKwhEpM2(v: number): string {
  return `${v.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/ /g, " ")} kWh EP/m²/an`;
}

/** La phrase qui dit sur quoi porte l'audit. */
export function libelleObjet(objet: AuditObjet): string {
  if (!objet) return "Objet audité non précisé par la source";
  const s = Math.round(objet.surface_m2).toLocaleString("fr-FR").replace(/ /g, " ");
  return objet.grain === "logement"
    ? `Audit d'un logement de ${s} m², rattaché à cette adresse`
    : `Audit de l'immeuble entier (${s} m² habitables), pas de ce seul logement`;
}

// ── LA RECHERCHE À PROXIMITÉ ─────────────────────────────────────────────────────────────────────
// Elle ne demande à la source AUCUNE colonne de valeur : seulement de quoi identifier l'audit et le situer.

/** Les seules colonnes de la recherche spatiale. */
export const AUDIT_PROCHE_SELECT = ["n_audit", "identifiant_ban", "date_etablissement_audit", "_geopoint"] as const;

export type AuditProcheApiRow = {
  n_audit: string;
  identifiant_ban?: string | null;
  date_etablissement_audit?: string | null;
  /** « lat,lon », tel que la source le publie. */
  _geopoint?: string | null;
};

function distanceM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2
    + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Le candidat le plus proche, hors audits de l'adresse elle-même (ceux-là sont des correspondances
 * exactes, et passent par `toAuditRecord`). Jamais une valeur : une référence, une date, une distance.
 */
export function candidatProche(
  rows: AuditProcheApiRow[], point: { latitude: number; longitude: number }, banId: string | null,
): AuditCandidatProche | null {
  let meilleur: AuditCandidatProche | null = null;
  for (const r of rows) {
    if (banId && r.identifiant_ban === banId) continue;
    const [lat, lon] = String(r._geopoint ?? "").split(",").map(Number);
    const d = Number.isFinite(lat) && Number.isFinite(lon) ? Math.round(distanceM(point.latitude, point.longitude, lat, lon)) : null;
    if (!meilleur || (d != null && (meilleur.distance_m == null || d < meilleur.distance_m))) {
      meilleur = { correspondance: "nearby_candidate", n_audit: r.n_audit, date_audit: r.date_etablissement_audit ?? null, distance_m: d };
    }
  }
  return meilleur;
}

/**
 * CE QU'A ÉTABLI LA RECHERCHE DE L'AUDIT EXACT (FUT-65). Trois états, parce qu'une panne n'est pas une
 * absence : la base ADEME qui répond 500, dépasse son délai ou rend une réponse illisible ne dit RIEN de
 * l'existence d'un audit à cette adresse. Avant FUT-65, ces trois cas rendaient `[]`, donc `null`, donc
 * « aucun audit exact », et la route partait chercher un voisin sur la foi d'une absence jamais établie.
 *
 * Même doctrine que `probeDpeByBanId` (`found / none / unavailable`) ; les mots sont ceux du rapport.
 */
export type AuditStatus = "present" | "absent" | "unavailable";
export type AuditLookup =
  | { status: "present"; audit: AuditRecord }
  | { status: "absent" }
  | { status: "unavailable" };

/** Les lignes rendues par la source → l'état établi. `null` : la source n'a pas répondu exploitablement. */
export function lectureAudit(rows: AuditApiRow[] | null, banId: string): AuditLookup {
  if (rows == null) return { status: "unavailable" };
  const audit = toAuditRecord(rows, banId);
  return audit ? { status: "present", audit } : { status: "absent" };
}

/**
 * LE VOISIN N'EST CHERCHÉ QUE SUR UNE ABSENCE ÉTABLIE. Présent : l'exact gagne, rien à chercher.
 * Indisponible : on ne sait pas si un audit exact existe, et signaler un voisin laisserait entendre
 * qu'il n'y en a pas.
 */
export function voisinAutorise(exact: AuditLookup): boolean {
  return exact.status === "absent";
}

/** Ce que rend le module Logement : l'audit exact s'il existe, sinon (et seulement sur absence établie) un candidat voisin. */
export function resultatAudit(
  exact: AuditLookup, proche: AuditCandidatProche | null,
): { audit: AuditRecord | null; auditProche: AuditCandidatProche | null; auditStatus: AuditStatus } {
  if (exact.status === "present") return { audit: exact.audit, auditProche: null, auditStatus: "present" };
  return { audit: null, auditProche: voisinAutorise(exact) ? proche : null, auditStatus: exact.status };
}
