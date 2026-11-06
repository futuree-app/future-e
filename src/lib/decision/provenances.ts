// ════════════════════════════════════════════════════════════════════════════════════════════
// LE CATALOGUE DES PROVENANCES DU MOTEUR DE DÉCISION (FUT-12, 04/11/2026).
//
// Une entrée par FAMILLE de preuve, écrite une fois et lue par les règles. Ce qui varie d'un dossier
// à l'autre (la date de consultation, le jour du diagnostic, le millésime de la BPE, la date
// d'approbation d'un plan) entre en paramètre, depuis la donnée elle-même : jamais une constante
// qui ferait dire à un dossier figé la date d'aujourd'hui.
//
// CHAQUE VALEUR ÉCRITE ICI A ÉTÉ VÉRIFIÉE, et l'audit le dit (docs/audits/2026-11-04-fut12-provenance-
// preuves.md). Ce qu'on ne sait pas n'y figure pas : les servitudes patrimoniales n'ont pas de
// producteur nommé (chaque gestionnaire publie les siennes au Géoportail de l'urbanisme), et les
// cavités n'ont pas de date de consultation (leur appel passe par un cache de 24 h).
//
// PUR : aucun import autre que le contrat.
// ════════════════════════════════════════════════════════════════════════════════════════════
import { dateEnClair, provenance, type Provenance } from "../facts/provenance.ts";

// ── Retrait-gonflement des argiles ───────────────────────────────────────────────────────────

/**
 * LA VERSION DE LA CARTE ARGILES QUE GÉORISQUES SERT, TELLE QU'ELLE A ÉTÉ CONSTATÉE.
 *
 * L'API (`/api/v2/rga`) ne renvoie aucune version : sa réponse ne porte que `codeExposition` et
 * `exposition`, et son schéma OpenAPI aucun autre champ. La version a donc été ÉTABLIE, pas lue :
 * le 04/11/2026, en 28 points de Charente-Maritime et de Haute-Garonne où la carte de 2019
 * (`AleaRG17_L93.zip`, 11/06/2019) et celle de 2026 (`AleaRG_2025_17_L93.zip`, carte révisée par
 * l'arrêté du 9 janvier 2026) donnent des classes différentes, l'API a répondu 28 fois comme la
 * carte de 2026 et jamais comme celle de 2019. Points et script de contre-épreuve :
 * `scripts/audit/fut12-rga-version.mjs`.
 *
 * La version n'est donc portée QUE par une lecture postérieure au constat. Une lecture antérieure
 * (ou non datée) reste sans version : on ignore quand Géorisques a basculé, et un dossier vendu en
 * septembre a pu recevoir une classe de la carte 2019.
 */
export const RGA_CARTE = {
  version: "Carte d'exposition 2026",
  constateeLe: "2026-11-04",
  sourceUrl: "https://www.georisques.gouv.fr/donnees/bases-de-donnees/retrait-gonflement-des-argiles-version-2026",
} as const;

export function provenanceArgiles(consultedAt?: string): Provenance {
  const dateConnue = consultedAt && consultedAt.slice(0, 10) >= RGA_CARTE.constateeLe;
  return provenance({
    producer: "BRGM",
    dataset: "Carte d'exposition au retrait-gonflement des argiles",
    distributor: "Géorisques",
    nature: "reglementaire",
    version: dateConnue ? RGA_CARTE.version : null,
    sourceUrl: dateConnue ? RGA_CARTE.sourceUrl : null,
    consultedAt,
    limits: "Une carte d'exposition décrit une zone : ce n'est ni une étude du sol de la parcelle, ni une prévision de dommage.",
  });
}

// ── Plans de prévention, base GASPAR ─────────────────────────────────────────────────────────

/**
 * Un plan lu au point ou à la parcelle. Sa date d'approbation est celle du DOCUMENT, toujours
 * applicable : elle ne dit pas que la donnée est ancienne, elle date la règle.
 */
export function provenancePlanAdresse(o: { consultedAt?: string; approuveLe?: string | null }): Provenance {
  return provenance({
    producer: "Ministère de la Transition écologique",
    dataset: "Base GASPAR, plans de prévention des risques",
    distributor: "Géorisques",
    nature: "reglementaire",
    version: o.approuveLe ? `Plan approuvé ${dateCourte(o.approuveLe)}` : null,
    consultedAt: o.consultedAt,
  });
}

/** Les plans de la commune, lus dans l'export public de la base (fichier embarqué). */
export function provenancePlansCommune(o: { export: string; approuveLe?: string | null }): Provenance {
  return provenance({
    producer: "Ministère de la Transition écologique",
    dataset: "Base GASPAR, plans de prévention des risques",
    distributor: "Géorisques (export public)",
    nature: "reglementaire",
    version: `Export du ${dateCourte(o.export).replace(/^le /, "")}`,
    sourceUrl: "https://files.georisques.fr/GASPAR/gaspar.zip",
  });
}

// ── Cavités, servitudes, indemnisations ──────────────────────────────────────────────────────

export function provenanceCavites(): Provenance {
  return provenance({
    producer: "BRGM",
    dataset: "Inventaire national des cavités souterraines (BDCavité)",
    distributor: "Géorisques",
    nature: "observation",
  });
}

export function provenanceServitudes(consultedAt?: string): Provenance {
  return provenance({
    dataset: "Servitudes d'utilité publique, Géoportail de l'urbanisme",
    distributor: "API Carto (IGN)",
    nature: "reglementaire",
    consultedAt,
  });
}

/**
 * DEUX DATES, ET ELLES NE DISENT PAS LA MÊME CHOSE : les indemnisations couvertes (1995-2021) et la
 * mise à jour du jeu (2025). Lu dans des fichiers embarqués au dépôt, sans date de chargement tracée.
 */
export function provenanceIndemnisations(): Provenance {
  return provenance({
    producer: "CCR",
    dataset: "Indicateurs de sinistralité de l'ONRN",
    distributor: "Géorisques",
    nature: "observation",
    period: "1995-2021",
    version: "Mise à jour 2025",
  });
}

// ── Diagnostic énergétique ───────────────────────────────────────────────────────────────────

export function provenanceDpe(dateDiagnostic?: string | null): Provenance {
  return provenance({
    producer: "ADEME",
    dataset: "Base des diagnostics de performance énergétique",
    nature: "reglementaire",
    period: dateDiagnostic && /^\d{4}-\d{2}-\d{2}$/.test(dateDiagnostic) ? dateDiagnostic : null,
  });
}

// ── Rivage marin, reconnaissances CatNat ─────────────────────────────────────────────────────

/** Une distance calculée par futur•e jusqu'à la limite terre-mer du Shom et de l'IGN (édition 2021). */
export function provenanceRivage(): Provenance {
  return provenance({ producer: "Shom et IGN", dataset: "Limite terre-mer", version: "Édition 2021", nature: "derive" });
}

/**
 * Le compte des reconnaissances CatNat inondation de l'index : la base GASPAR, comptée par futur•e
 * depuis l'année de départ que l'objet porte. La date de l'export compté n'est pas tracée dans
 * l'objet : elle n'est pas dite.
 */
export function provenanceCatnat(): Provenance {
  return provenance({
    producer: "Ministère de la Transition écologique",
    dataset: "Base GASPAR, reconnaissances de catastrophe naturelle",
    distributor: "Géorisques",
    nature: "reglementaire",
  });
}

// ── Climat projeté ───────────────────────────────────────────────────────────────────────────

/** DRIAS : une projection, jamais une observation ; sa période est celle de RÉFÉRENCE. */
export function provenanceDrias(): Provenance {
  return provenance({
    producer: "Météo-France",
    dataset: "DRIAS, trajectoire de réchauffement de référence (TRACC)",
    nature: "projection",
    period: "1976-2005",
  });
}

// ── Autour de l'adresse ──────────────────────────────────────────────────────────────────────

/** Le registre des autorisations d'urbanisme, tel qu'il a été consulté et gelé à l'analyse. */
export function provenancePermis(consulteLe: string): Provenance {
  return provenance({
    producer: "SDES (ministère de la Transition écologique)",
    dataset: "Sitadel, autorisations d'urbanisme créant des logements",
    distributor: "DiDo",
    nature: "observation",
    consultedAt: consulteLe,
  });
}

/** La BPE : le millésime vient de la donnée figée, jamais d'une constante. */
export function provenanceBpe(millesime?: string | null): Provenance {
  return provenance({
    producer: "Insee",
    dataset: "Base permanente des équipements",
    nature: "observation",
    period: millesime && /^\d{4}$/.test(millesime) ? millesime : null,
  });
}

/**
 * L'ÉQUIPEMENT AUTOMOBILE DES MÉNAGES DE L'IRIS. Au grain de l'IRIS, le recensement est une
 * ESTIMATION (enquête annuelle par sondage dans les communes de 10 000 habitants et plus) : la
 * provenance le dit, pour que la part ne se lise pas comme un comptage. `chargeLe` : la construction
 * de l'artefact `data/iris-logement.json` (`builtAt`).
 */
export function provenanceIrisLogement(o: { annee?: number | null; chargeLe?: string | null }): Provenance {
  return provenance({
    producer: "Insee",
    dataset: `Recensement de la population${o.annee ? ` ${o.annee}` : ""}, base IRIS logement`,
    nature: "estimation",
    period: o.annee ? String(o.annee) : null,
    loadedAt: o.chargeLe,
    sourceUrl: "https://www.insee.fr/fr/statistiques/fichier/8647012/base-ic-logement-2022_csv.zip",
  });
}

// ── Outils ───────────────────────────────────────────────────────────────────────────────────

/** « le 26 février 2019 » depuis AAAA-MM-JJ ; la chaîne telle quelle si elle ne se lit pas. */
function dateCourte(iso: string): string {
  return dateEnClair(iso) ?? iso;
}
