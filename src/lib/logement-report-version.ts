// LES VERSIONS DU RAPPORT LOGEMENT (FUT-13, lot B). Module PUR : aucune I/O, testable sous `node --test`.
// Le stockage vit dans `server/logement-report-versions.ts` ; le schéma dans
// `supabase/35_logement_report_versions.sql`.
//
// LE CONTRAT.
//   - Ouvrir un dossier qui a une version : on la lit, on l'affiche. Aucune source, aucun modèle.
//   - Un dossier sans version (nouveau, ou antérieur à ce lot) : construction live une fois, puis
//     version 1. C'est le rattrapage paresseux ; rien n'est régénéré en masse.
//   - Actualiser est un geste explicite du lecteur. La nouvelle collecte devient la version N+1
//     seulement si elle est valide ET ne perd aucune source que la version N avait : sinon N reste la
//     dernière version, et l'écran le dit. Une collecte identique ne crée pas de version.
//   - Le diagnostic choisi et la synthèse ne sont pas dans la version : ils restent sur la ligne du
//     dossier, relue à chaque ouverture, donc une version ne contredit jamais le DPE choisi.
import type { LogementReport } from "./logement-report-types.ts";

/** Ce que l'écran sait d'une version, en plus du rapport. */
export type VersionMeta = {
  numero: number;
  collecteeLe: string;
  sourcesAbsentes: string[];
};

export type VersionLogement = VersionMeta & { report: LogementReport; reportHash: string };

/** L'issue d'une actualisation demandée par le lecteur. */
export type IssueActualisation = "nouvelle_version" | "identique" | "refusee";

/**
 * Les sources dont la collecte n'a rien rendu (panne, délai dépassé). Une ABSENCE LÉGITIME (aucun
 * audit, aucune ZFE, aucune friche autour) n'en est pas une : seules comptent les sources qui
 * rendent `null` quand elles n'ont pas pu répondre.
 */
export function sourcesAbsentes(r: LogementReport): string[] {
  const absentes: string[] = [];
  if (r.parcel == null) absentes.push("parcelle");
  if (r.altitude == null) absentes.push("altitude");
  if (r.zfe == null) absentes.push("zfe");
  if (r.cartofriches == null) absentes.push("friches");
  if (r.communeData == null) absentes.push("donnees_communales");
  if (r.sinistralite == null) absentes.push("sinistralite");
  if (r.georisques?.commune == null) absentes.push("georisques_commune");
  if (r.georisques?.address == null) absentes.push("georisques_point");
  if (r.heritage == null || r.heritage.sourceStatus === "unavailable") absentes.push("patrimoine");
  return absentes;
}

/** Un rapport complet dans sa FORME : l'adresse est là et la route n'a pas rendu d'erreur. */
export function rapportValide(r: unknown): r is LogementReport {
  if (!r || typeof r !== "object") return false;
  const x = r as LogementReport;
  return !x.error && !!x.address && typeof x.address.label === "string"
    && Number.isFinite(x.address.latitude) && Number.isFinite(x.address.longitude);
}

/**
 * La décision d'une actualisation, AVANT toute écriture.
 * - rapport invalide, ou qui perd une source que N avait : `refusee`, N reste la dernière ;
 * - même empreinte que N : `identique`, aucune version créée ;
 * - sinon : `nouvelle_version`.
 */
export function issueActualisation(
  nouveau: LogementReport, nouveauHash: string, ancienne: VersionLogement | null,
): IssueActualisation {
  if (!rapportValide(nouveau)) return "refusee";
  if (!ancienne) return "nouvelle_version";
  if (nouveauHash === ancienne.reportHash) return "identique";
  const avant = new Set(ancienne.sourcesAbsentes);
  if (sourcesAbsentes(nouveau).some((s) => !avant.has(s))) return "refusee";
  return "nouvelle_version";
}

/** JSON canonique (clés triées) : deux collectes identiques donnent la même chaîne, donc la même empreinte. */
export function jsonCanonique(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return `[${v.map(jsonCanonique).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${jsonCanonique(o[k])}`).join(",")}}`;
}

/** Une ligne de la table, relue : on refuse ce qui ne se rendrait pas plutôt que de le réparer. */
export function lireLigneVersion(row: unknown): VersionLogement | null {
  if (!row || typeof row !== "object") return null;
  const l = row as { version?: unknown; report?: unknown; report_hash?: unknown; sources_absentes?: unknown; collected_at?: unknown };
  if (typeof l.version !== "number" || typeof l.report_hash !== "string" || typeof l.collected_at !== "string") return null;
  if (!rapportValide(l.report)) return null;
  return {
    numero: l.version,
    collecteeLe: l.collected_at,
    sourcesAbsentes: Array.isArray(l.sources_absentes) ? l.sources_absentes.filter((s): s is string => typeof s === "string") : [],
    report: l.report,
    reportHash: l.report_hash,
  };
}

export function metaDe(v: VersionLogement): VersionMeta {
  return { numero: v.numero, collecteeLe: v.collecteeLe, sourcesAbsentes: v.sourcesAbsentes };
}

// ── LA SÉQUENCE, INJECTABLE ──────────────────────────────────────────────────────────────────
// La route la délègue ici pour que l'ordre soit testable sans réseau : lire, puis (seulement sans
// version, ou sur actualisation) construire, décider, et n'écrire qu'une décision « nouvelle_version ».

export type Dependances = {
  lire: () => Promise<VersionLogement | null>;
  construire: () => Promise<LogementReport>;
  empreinte: (r: LogementReport) => string;
  enregistrer: (r: LogementReport, hash: string) => Promise<VersionLogement | null>;
};

export async function consulterOuActualiser(refresh: boolean, d: Dependances): Promise<LogementReport> {
  const ancienne = await d.lire();
  // Une version existe et le lecteur n'a rien demandé : on la rend. Aucune source n'est appelée.
  if (ancienne && !refresh) return { ...ancienne.report, version: metaDe(ancienne) };

  let report: LogementReport;
  try {
    report = await d.construire();
  } catch {
    // Une collecte qui lève n'atteint jamais l'écriture : N reste la dernière version.
    if (ancienne) return { ...ancienne.report, version: metaDe(ancienne), actualisation: "refusee" };
    throw new Error("Construction du rapport impossible.");
  }
  const hash = d.empreinte(report);
  const issue = issueActualisation(report, hash, ancienne);

  // La décision se prend AVANT toute écriture, et seule une écriture réussie remplace N.
  if (ancienne && issue !== "nouvelle_version") {
    return {
      ...ancienne.report, version: metaDe(ancienne), actualisation: issue,
      ...(issue === "refusee" ? { sourcesNonActualisees: sourcesAbsentes(report) } : {}),
    };
  }
  const nouvelle = issue === "nouvelle_version" ? await d.enregistrer(report, hash) : null;
  if (nouvelle) {
    return { ...nouvelle.report, version: metaDe(nouvelle), ...(ancienne ? { actualisation: "nouvelle_version" as const } : {}) };
  }
  if (ancienne) return { ...ancienne.report, version: metaDe(ancienne), actualisation: "refusee" };
  // Première construction sans version écrite : le lecteur voit sa collecte, la version sera retentée.
  return { ...report, version: null };
}
