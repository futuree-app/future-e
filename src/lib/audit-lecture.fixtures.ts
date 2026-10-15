// FIXTURES DE L'AUDIT ÉNERGÉTIQUE (FUT-62), au format exact des LIGNES de la source (`AuditApiRow`) :
// une ligne par étape, `travaux_realises` tel que l'ADEME l'écrit (catégories séparées par « , »,
// apostrophe typographique, « autre »), état initial sans travaux. Partagées par les tests et le banc de
// revue (`/dev/audit-energetique`).
//
// Identifiants BAN, numéros d'audit, de DPE et de copropriété SYNTHÉTIQUES. Seules les valeurs du cas
// d'immeuble reprennent celles du ticket et de FUT-67 (déjà dans `fut67-restitution.test.ts`) ; les
// autres sont arrondies ou décalées, pour ne retrouver aucun audit public.

import type { AuditApiRow } from "./audit-record.ts";

export const BAN_FIXTURE = "99999_fut62_00001";

type Ligne = [categorie: string, etape: string, conso: number | null, travaux: string | null];
const lignes = (base: Partial<AuditApiRow> & { n_audit: string }, ls: Ligne[]): AuditApiRow[] =>
  ls.map(([categorie_scenario, etape_travaux, ep_conso_5_usages_m2, travaux_realises]) => ({
    identifiant_ban: BAN_FIXTURE,
    date_etablissement_audit: "2025-05-30",
    ...base,
    categorie_scenario, etape_travaux, ep_conso_5_usages_m2, travaux_realises,
  }));

const MULTI = 'scénario multi étapes "principal"';
const UNE = 'scénario en une étape "principal"';
const INIT = "état initial";

/** Cas 2, 3, 4 : un immeuble de quatre logements, deux parcours qui finissent au même point. Ordre de l'API (désordonné). */
export const IMMEUBLE: AuditApiRow[] = lignes(
  { n_audit: "A00FUT62IMM01", surface_habitable_immeuble: 434, nb_appartement: 4 },
  [
    [MULTI, "étape intermédiaire 1", 115.1, "Remplacement des menuiseries extérieures, autre, Remplacement du système de ventilation"],
    [MULTI, "étape finale", 53, "Remplacement du système de chauffage"],
    [UNE, "étape finale", 53, "Isolation des planchers bas, Remplacement du système de chauffage, Isolation des murs, Isolation de la toiture, Remplacement du système de ventilation, Remplacement des menuiseries extérieures, autre"],
    [MULTI, "étape première", 167.3, "Isolation de la toiture, Isolation des planchers bas, Remplacement du système de chauffage, Isolation des murs"],
    [INIT, INIT, 503.5, null],
  ],
);

/** Le même immeuble, immatriculé comme copropriété. */
export const IMMEUBLE_COPRO: AuditApiRow[] = IMMEUBLE.map((r) => ({ ...r, n_audit: "A00FUT62IMM02", n_immatriculation_copro: "AA0000000" }));

/** Cas 1, 5 : une maison, rattachée par la source au DPE `DPE_MAISON` ; ses deux parcours finissent différemment. */
export const DPE_MAISON = "2500E0000FUT62";
export const LOGEMENT: AuditApiRow[] = lignes(
  { n_audit: "A00FUT62LOG01", surface_habitable_logement: 112, surface_habitable_immeuble: 112, nb_appartement: 1, numero_dpe: DPE_MAISON, date_etablissement_audit: "2025-02-11" },
  [
    [INIT, INIT, 386, null],
    [MULTI, "étape première", 206, "Isolation de la toiture, Isolation des murs, Remplacement du système de ventilation"],
    [MULTI, "étape intermédiaire 1", 141, "autre"],
    [MULTI, "étape finale", 72, "Remplacement du système de production d’eau chaude sanitaire, Remplacement du système de chauffage"],
    [UNE, "étape finale", 68, "Isolation des murs, Isolation de la toiture, Remplacement du système de ventilation, Remplacement du système de chauffage, Remplacement du système de production d’eau chaude sanitaire, autre"],
  ],
);

/**
 * Cas 6, 7 : information incomplète. Objet audité non identifiable (aucune surface), pas d'état initial,
 * un parcours sans étape finale, une étape sans travaux renseignés, un libellé hors vocabulaire.
 */
export const INCOMPLET: AuditApiRow[] = lignes(
  { n_audit: "A00FUT62INC01", date_etablissement_audit: "2024-11-04" },
  [
    [MULTI, "étape première", 240, ""],
    [MULTI, "étape intermédiaire 1", 180, "Remplacement des menuiseries extérieures, Pose d'un récupérateur de chaleur"],
    ["scénario complémentaire 1", "étape finale", 150, "autre"],
  ],
);

/** Cas 7 : deux lignes d'état initial, de valeurs différentes. */
export const DEUX_ETATS_INITIAUX: AuditApiRow[] = lignes(
  { n_audit: "A00FUT62DEP01", surface_habitable_logement: 64 },
  [
    [INIT, INIT, 500, null],
    [INIT, INIT, 480, null],
    [UNE, "étape finale", 90, "Isolation des murs, Remplacement du système de chauffage"],
  ],
);

/**
 * Cas 8 : plusieurs audits publiés pour la même adresse, établis le même jour (structure du 1 rue
 * Saint-Dominique, Paris 7e) : l'immeuble entier, un « immeuble » d'un seul logement de 55 m², et un
 * appartement de 195 m², ce dernier rattaché à un DPE.
 */
export const DPE_APPARTEMENT = "2575E0000FUT62";
export const PLUSIEURS: AuditApiRow[] = [
  ...lignes(
    { n_audit: "A00FUT62PLU01", surface_habitable_immeuble: 55.06, nb_appartement: 1 },
    [[INIT, INIT, 702.9, null], [UNE, "étape finale", 68.1, "Isolation des murs, Remplacement du système de chauffage"]],
  ),
  ...IMMEUBLE.map((r) => ({ ...r, n_audit: "A00FUT62PLU02" })),
  ...lignes(
    { n_audit: "A00FUT62PLU03", surface_habitable_logement: 194.66, surface_habitable_immeuble: 195, nb_appartement: 1, numero_dpe: DPE_APPARTEMENT },
    [
      [INIT, INIT, 418.4, null],
      [MULTI, "étape première", 171.1, "Isolation des murs, Isolation de la toiture, Remplacement du système de chauffage"],
      [MULTI, "étape intermédiaire 1", 113.4, "Remplacement du système de ventilation, Remplacement des menuiseries extérieures"],
      [MULTI, "étape finale", 62.7, "Remplacement du système de chauffage"],
      [UNE, "étape finale", 62.7, "Isolation des murs, Remplacement du système de chauffage, Isolation de la toiture, Remplacement du système de ventilation, Remplacement des menuiseries extérieures"],
    ],
  ),
];
