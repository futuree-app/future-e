// FUT-114 · CE QUI PEUT SE VENDRE, DIT AVANT STRIPE. Lib PURE (le référentiel est injecté).
//
// La V1 commercialise ses dossiers en France métropolitaine, Corse comprise (décision FUT-18 du
// 16/10/2026). Les lectures ultramarines restent gratuites et ne rendent pas leur territoire achetable :
// les dossiers payants d'outre-mer relèvent de la V2 (FUT-106/107).
//
// UNE COMMUNE EST VENDABLE QUAND LE SERVEUR LA RECONNAÎT, jamais parce que le navigateur l'affirme. Le
// référentiel est l'index du comparateur (34 788 communes de l'Hexagone et de Corse, arrondissements de
// Paris, Lyon et Marseille compris), le même que lit le dossier vendu. Un code bien formé mais absent de
// l'index est refusé : on ne vend pas un dossier qu'on ne saurait pas produire.
//
// Trois cas, dans cet ordre :
//   - code absent, mal formé ou inconnu de l'index          → refus « non identifié » ;
//   - code ultramarin (97xxx, 98xxx), même bien formé       → refus « hors V1 », message explicite ;
//   - commune de l'index, ou code communal de Paris (75056), Lyon (69123), Marseille (13055) que l'index ne
//     connaît que par arrondissements                        → vendable.
//
// Un comparatif est vendable seulement si TOUTES ses communes le sont : un seul candidat refusé refuse
// l'ensemble, jamais un comparatif amputé en silence.
import { estCodeOutremer } from "../outremer/code-outremer.ts";
import { arrondissementsDe } from "../plm.ts";

export type RefusTerritorial = {
  ok: false;
  /** Code métier stable, lu par l'écran de paiement et par les tests. */
  code: "TERRITORY_NOT_ELIGIBLE" | "TERRITORY_UNVERIFIED";
  /** Le message montré au lecteur. */
  error: string;
};
export type VerdictTerritorial = { ok: true; insee: string } | RefusTerritorial;
export type VerdictEnsemble = { ok: true; insees: string[] } | RefusTerritorial;

/** Le référentiel : `true` si l'index du dossier connaît ce code (arrondissements PLM compris). */
export type CommuneConnue = (insee: string) => boolean;

// Le format du COG : cinq chiffres, ou 2A/2B suivis de trois chiffres pour la Corse. L'ancienne garde de la
// route (`^[0-9AB][0-9]{4}$`) refusait tout code corse, donc toute commune corse.
const FORMAT_COG = /^(?:\d{5}|2[AB]\d{3})$/;

const PERIMETRE = "Les dossiers payants couvrent pour l’instant la France métropolitaine, Corse comprise.";
const RIEN_ENGAGE = "Aucun paiement n’a été engagé.";

export const REFUS_OUTREMER: RefusTerritorial = {
  ok: false,
  code: "TERRITORY_NOT_ELIGIBLE",
  error: `${PERIMETRE} Ceux des territoires d’outre-mer ne sont pas encore disponibles. ${RIEN_ENGAGE}`,
};
export const REFUS_COMPARATIF_OUTREMER: RefusTerritorial = {
  ok: false,
  code: "TERRITORY_NOT_ELIGIBLE",
  error: `Ce comparatif contient une commune d’outre-mer. ${PERIMETRE} ${RIEN_ENGAGE}`,
};
export const REFUS_NON_IDENTIFIE: RefusTerritorial = {
  ok: false,
  code: "TERRITORY_UNVERIFIED",
  error: `Nous ne parvenons pas à identifier la commune de ce dossier. Choisissez-la de nouveau avant de payer. ${RIEN_ENGAGE}`,
};
export const REFUS_SANS_COMMUNE: RefusTerritorial = {
  ok: false,
  code: "TERRITORY_UNVERIFIED",
  error: `Ce dossier porte sur une commune précise, et aucune n’a été choisie. Cherchez d’abord la commune, puis ouvrez son dossier. ${RIEN_ENGAGE}`,
};

/** Le code tel que le COG l'écrit (espaces retirés, 2a → 2A), ou `null` s'il n'en a pas la forme. */
export function normaliserCodeCommune(brut: unknown): string | null {
  if (typeof brut !== "string") return null;
  const v = brut.trim().toUpperCase();
  return FORMAT_COG.test(v) ? v : null;
}

/** Une commune : vendable, ou refusée avec son motif. `brut` vient du client et n'est jamais cru. */
export function communeVendable(brut: unknown, connue: CommuneConnue): VerdictTerritorial {
  if (brut == null || (typeof brut === "string" && brut.trim() === "")) return REFUS_SANS_COMMUNE;
  const insee = normaliserCodeCommune(brut);
  if (!insee) return REFUS_NON_IDENTIFIE;
  if (estCodeOutremer(insee)) return REFUS_OUTREMER;
  if (arrondissementsDe(insee).length > 0 || connue(insee)) return { ok: true, insee };
  return REFUS_NON_IDENTIFIE;
}

/**
 * Un comparatif : vendable seulement si chaque commune l'est. L'outre-mer est nommé dès qu'il figure dans
 * l'ensemble, même à côté d'un code illisible : c'est le motif que le lecteur peut comprendre.
 */
export function ensembleVendable(bruts: readonly unknown[], connue: CommuneConnue): VerdictEnsemble {
  const verdicts = bruts.map((b) => communeVendable(b, connue));
  if (verdicts.some((v) => !v.ok && v.code === "TERRITORY_NOT_ELIGIBLE")) return REFUS_COMPARATIF_OUTREMER;
  if (verdicts.some((v) => !v.ok)) return REFUS_NON_IDENTIFIE;
  return { ok: true, insees: verdicts.map((v) => (v as { insee: string }).insee) };
}
