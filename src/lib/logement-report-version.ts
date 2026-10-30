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
//   - La synthèse APPARTIENT à la version : écrite une fois, avec l'empreinte des faits lus et le DPE
//     pris en compte. Des faits différents (autre DPE, actualisation) font une NOUVELLE version ; une
//     ancienne version ne change jamais (trigger `logement_report_versions_immuable`).
import type { LogementReport } from "./logement-report-types.ts";

/** Ce que l'écran sait d'une version, en plus du rapport. */
export type VersionMeta = {
  numero: number;
  collecteeLe: string;
  sourcesAbsentes: string[];
  /** La synthèse de CETTE version, ou null tant qu'elle n'est pas rédigée. */
  synthese: string | null;
  /**
   * L'empreinte des faits que cette synthèse a lus (`buildFactHash`, côté serveur). FUT-60 : sans elle,
   * le module réaffichait une synthèse écrite sous un autre contrat de faits (le payload disait
   * « arretes_* », il dit « reconnaissances_* ») comme si elle valait pour les faits courants.
   */
  syntheseHash: string | null;
};

export type VersionLogement = VersionMeta & {
  report: LogementReport; reportHash: string;
  syntheseDpe: string | null;
};

/**
 * UNE SYNTHÈSE ENREGISTRÉE NE S'AFFICHE QUE POUR LES FAITS QU'ELLE A LUS (FUT-60). Le DPE ne suffit
 * pas : un changement de contrat du payload (une clé renommée, un fait ajouté) change l'empreinte sans
 * changer le DPE. Une empreinte absente n'est pas une empreinte compatible : on ne sait pas ce que le
 * texte a lu, il ne vaut donc pour rien.
 */
export function syntheseEnregistreeUtilisable(
  texte: string | null | undefined, hashEnregistre: string | null | undefined, hashCourant: string,
): boolean {
  return !!texte && typeof hashEnregistre === "string" && hashEnregistre === hashCourant;
}

/**
 * La version SUIVANTE qui porte une synthèse nouvelle sur les MÊMES faits collectés : même rapport,
 * même empreinte de rapport, même date de collecte. Seule la synthèse change.
 */
export function ligneVersionSuivanteSynthese(
  derniere: VersionLogement, userId: string, dossierId: string,
  synthese: { synthesis_text: string; synthesis_fact_hash: string; synthesis_generated_at: string; synthesis_dpe_numero: string | null },
) {
  return {
    dossier_id: dossierId, user_id: userId, version: derniere.numero + 1,
    report: derniere.report, report_hash: derniere.reportHash, sources_absentes: derniere.sourcesAbsentes,
    collected_at: derniere.collecteeLe, ...synthese,
  };
}

/**
 * Où ranger une synthèse rédigée (ou relue) pour des faits d'empreinte `hash` :
 * - la dernière version n'a pas de synthèse : on la lui ATTACHE (une fois) ;
 * - elle a déjà celle de ces faits : rien ;
 * - elle en a une autre (autre DPE, autres faits) : une NOUVELLE version, même rapport, cette synthèse.
 */
export function rangementSynthese(
  derniere: VersionLogement | null, hash: string, versionLue: number | null,
): "aucune_version" | "version_depassee" | "attacher" | "deja_la" | "nouvelle_version" {
  if (!derniere) return "aucune_version";
  // La synthèse a lu les faits d'une version précise. Si une collecte plus récente est devenue la dernière
  // entre-temps, ses faits ne sont plus ceux de la synthèse : rien n'est rangé.
  if (derniere.numero !== versionLue) return "version_depassee";
  if (derniere.synthese == null) return "attacher";
  if (derniere.syntheseHash === hash) return "deja_la";
  return "nouvelle_version";
}

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
  // FUT-65 : seulement sur une panne ÉTABLIE. Une absence confirmée n'est pas une source muette, et un
  // rapport antérieur (statut `undefined`) ne s'invente pas une panne.
  if (r.auditStatus === "unavailable") absentes.push("audit_energetique");
  if (r.dpeCandidatesStatus === "unavailable") absentes.push("diagnostics_dpe");
  // FUT-80 : mêmes règles. Un rapport antérieur (champ absent) ne s'invente pas de panne, et un
  // référentiel qui a répondu « aucun bâtiment » n'est pas une source muette.
  if (r.batiment?.statut === "indisponible") absentes.push("batiment");
  if (r.dpeMemeBatiment?.status === "unavailable") absentes.push("diagnostics_meme_batiment");
  // FUT-81 : mêmes règles. Un rapport antérieur (champ absent) ne s'invente pas de panne ; une commune
  // sans document publié n'est pas une source muette, elle est `non_trouve`.
  absentes.push(...urbanismeAbsent(r));
  // FUT-146 : mêmes règles. Un rapport antérieur (champ absent) ne s'invente pas de panne ; « hors zone »
  // et « aucun plan à proximité » sont des réponses, pas des sources muettes.
  if (r.bruitAerien?.statut === "indisponible") absentes.push("bruit_aerien");
  // FUT-156 : mêmes règles. « À vérifier » est une réponse (l'adresse n'est pas rattachable), pas une panne.
  if (r.fibre?.statut === "indisponible") absentes.push("fibre");
  // FUT-167 : chaque lecture des risques industriels à l'adresse est nommée quand elle n'a pas répondu.
  if (r.industrieAdresse?.seveso.etat === "indisponible") absentes.push("industrie_seveso");
  if (r.industrieAdresse?.pprtPoint.etat === "indisponible") absentes.push("pprt_point");
  if (r.industrieAdresse?.pprtCommune.etat === "indisponible") absentes.push("pprt_commune");
  return absentes;
}

/**
 * LES SOUS-SOURCES DU PLAN D'URBANISME QUI N'ONT PAS RÉPONDU (revue indépendante du 27/10/2026). Une
 * lecture peut rester « confirmée » avec ses prescriptions, la vigueur de son document ou ses pièces
 * muettes : la panne était dite à l'écran, mais l'actualisation qui la portait remplaçait une version
 * complète. Chaque sous-source est donc nommée, et une panne totale reste la seule `urbanisme`.
 */
export const SOUS_SOURCES_URBANISME = ["urbanisme", "urbanisme_prescriptions", "urbanisme_vigueur", "urbanisme_pieces", "urbanisme_parcelle"] as const;

function urbanismeAbsent(r: LogementReport): string[] {
  const u = r.urbanisme;
  if (!u) return [];
  if (u.statut === "indisponible") return ["urbanisme"];
  const out: string[] = [];
  if (u.prescriptionsStatut === "indisponible") out.push("urbanisme_prescriptions");
  if ((u.documents ?? []).some((d) => d.detailLu !== true)) out.push("urbanisme_vigueur");
  if ((u.documents ?? []).some((d) => d.piecesLues !== true)) out.push("urbanisme_pieces");
  return out;
}

/**
 * CE QUE LE PLAN D'URBANISME DE N SAVAIT LIRE ET QUE N+1 NE SAIT PLUS. Comparé sur les DEUX rapports, pas
 * sur la liste enregistrée : une version écrite avant FUT-81 n'avait aucune lecture, elle ne perd donc
 * rien quand le Géoportail tombe pendant son actualisation. Une évolution légitime n'est jamais une
 * perte : un document remplacé, une prescription retirée, un statut devenu « hors vigueur » ont été LUS.
 */
export function pertesUrbanisme(ancien: LogementReport, nouveau: LogementReport): string[] {
  const a = ancien.urbanisme;
  const n = nouveau.urbanisme;
  if (!a || a.statut === "indisponible") return [];
  if (!n || n.statut === "indisponible") return ["urbanisme"];
  const pertes: string[] = [];
  if (a.prescriptionsStatut === "ok" && n.prescriptionsStatut === "indisponible") pertes.push("urbanisme_prescriptions");
  const tous = (u: typeof a, champ: "detailLu" | "piecesLues") => (u.documents ?? []).length > 0 && u.documents.every((d) => d[champ] === true);
  if (tous(a, "detailLu") && (n.documents ?? []).some((d) => d.detailLu !== true)) pertes.push("urbanisme_vigueur");
  if (tous(a, "piecesLues") && (n.documents ?? []).some((d) => d.piecesLues !== true)) pertes.push("urbanisme_pieces");
  // Troisième revue : une lecture mesurée à la parcelle ne cède pas la place à une lecture au point (parcelle
  // devenue non mesurable, ou disparue). Ce n'est pas une panne, mais une lecture moins sûre : N reste.
  if (a.grain === "parcelle" && n.grain !== "parcelle") pertes.push("urbanisme_parcelle");
  return pertes;
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
  const urba = new Set<string>(SOUS_SOURCES_URBANISME);
  if (sourcesAbsentes(nouveau).some((s) => !urba.has(s) && !avant.has(s))) return "refusee";
  // Le plan d'urbanisme se compare sur les rapports eux-mêmes (cf. `pertesUrbanisme`).
  if (pertesUrbanisme(ancienne.report, nouveau).length > 0) return "refusee";
  // FUT-146 : même règle que le plan d'urbanisme. Une lecture des plans de bruit faite à la parcelle ne cède
  // pas la place à une lecture au point : ce n'est pas une panne, mais une lecture moins sûre.
  if (ancienne.report.bruitAerien?.grain === "parcelle" && nouveau.bruitAerien?.grain !== "parcelle") return "refusee";
  // FUT-156 : une lecture de la fibre ne disparaît pas d'une version à l'autre (lecture désactivée entre-temps).
  if (ancienne.report.fibre && ancienne.report.fibre.statut !== "indisponible" && !nouveau.fibre) return "refusee";
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
  const l = row as {
    version?: unknown; report?: unknown; report_hash?: unknown; sources_absentes?: unknown; collected_at?: unknown;
    synthesis_text?: unknown; synthesis_fact_hash?: unknown; synthesis_dpe_numero?: unknown;
  };
  if (typeof l.version !== "number" || typeof l.report_hash !== "string" || typeof l.collected_at !== "string") return null;
  if (!rapportValide(l.report)) return null;
  return {
    numero: l.version,
    collecteeLe: l.collected_at,
    sourcesAbsentes: Array.isArray(l.sources_absentes) ? l.sources_absentes.filter((s): s is string => typeof s === "string") : [],
    synthese: typeof l.synthesis_text === "string" ? l.synthesis_text : null,
    report: l.report,
    reportHash: l.report_hash,
    syntheseHash: typeof l.synthesis_fact_hash === "string" ? l.synthesis_fact_hash : null,
    syntheseDpe: typeof l.synthesis_dpe_numero === "string" ? l.synthesis_dpe_numero : null,
  };
}

export function metaDe(v: VersionLogement): VersionMeta {
  return { numero: v.numero, collecteeLe: v.collecteeLe, sourcesAbsentes: v.sourcesAbsentes, synthese: v.synthese, syntheseHash: v.syntheseHash };
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

/** Une synthèse ne vaut que pour le DPE qu'elle a lu : même diagnostic, ou aucun des deux côtés. */
export function syntheseCompatible(dpeDeLaSynthese: string | null, dpeChoisi: string | null | undefined): boolean {
  return (dpeDeLaSynthese ?? null) === (dpeChoisi ?? null);
}
