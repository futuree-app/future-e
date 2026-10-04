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
 * COMMENT L'AUDIT A ÉTÉ TROUVÉ (FUT-59, Phase 1.1). Une seule valeur possible : le même identifiant BAN
 * que l'adresse. Une proximité spatiale (l'ancien repli à 50 m) n'attribue pas un audit énergétique :
 * elle n'a plus de valeur dans ce type, donc aucun écran ne peut la recevoir.
 */
export type AuditCorrespondance = "identifiant_ban";

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
    correspondance: "identifiant_ban",
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
