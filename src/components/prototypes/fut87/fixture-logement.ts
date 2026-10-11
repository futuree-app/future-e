// FUT-87 · LES LOGEMENTS TÉMOINS DES PROTOTYPES. FIXTURES ANONYMISÉES, DEV UNIQUEMENT.
//
// Des biens FICTIFS : adresses, communes, parcelles et numéros sont inventés et ne désignent rien. Les
// valeurs énergétiques du cas de référence sont celles d'un audit réglementaire PUBLIC (base ouverte
// ADEME), détachées de leur adresse, les mêmes que la fixture de `fut67-restitution.test.ts`. Le reste
// (zonage, sinistralité, arrêtés) reprend la forme exacte des réponses des sources.
//
// CINQ CAS (revue V2) : un design se juge aussi sur les situations qui ne le mettent pas en valeur.
//   - `temoin`            : diagnostic, audit par étapes, zonage, patrimoine, sinistralité ;
//   - `sans-dpe`          : aucun diagnostic rattaché, donc ni classe, ni audit, ni confort d'été ;
//   - `immeuble`          : un appartement, diagnostic généré à l'immeuble, audit de l'immeuble entier ;
//   - `sources-absentes`  : Géorisques, servitudes, sinistralité et base des audits n'ont pas répondu ;
//   - `titre-long`        : le cas de référence avec une adresse de résidence très longue.
//
// Les lectures dérivées passent par les fonctions de PRODUCTION (`construireLectureInondation`,
// `pointsAVerifier`, `deriveThermalEvidence`, `parcoursAudit`) : le prototype et la page « avant »
// lisent exactement les mêmes faits, et aucun texte n'est réécrit pour l'occasion.
import type { LogementReport } from "../../../lib/logement-report-types.ts";
import type { DpeRecord } from "../../../lib/dpe-attribution.ts";
import type { LogementFacts } from "../../../lib/decision/decision-fact.ts";
import type { UserProject } from "../../../lib/user-project.ts";
import { catnatInondationDepuisCompte } from "../../../lib/decision/catnat-evidence.ts";
import { construireLectureInondation, zonageInondationDepuisPlans } from "../../../lib/decision/inondation-lecture.ts";
import { pointsAVerifier, introPointsAVerifier } from "../../../lib/decision/logement-verifications.ts";
import { deriveThermalEvidence } from "../../../lib/thermal-evidence.ts";
import { parcoursAudit } from "../../../lib/audit-record.ts";

export const CAS_LOGEMENT = ["temoin", "sans-dpe", "immeuble", "sources-absentes", "titre-long"] as const;
export type CasLogement = (typeof CAS_LOGEMENT)[number];

export const LIBELLE_CAS: Record<CasLogement, string> = {
  temoin: "Cas de référence",
  "sans-dpe": "Sans diagnostic",
  immeuble: "Appartement, audit de l'immeuble",
  "sources-absentes": "Sources sans réponse",
  "titre-long": "Adresse très longue",
};

const COMMUNE = "Commune témoin";

const DPE_MAISON: DpeRecord = {
  id_dpe: "0000E0000000X",
  date_dpe: "2024-03-18",
  id_ban: null,
  adresse: "Adresse témoin",
  etiquette_dpe: "G",
  etiquette_ges: "F",
  conso_ep_m2: 503.5,
  emission_ges_m2: 75,
  surface_m2: 108,
  annee_construction: 1958,
  type_batiment: "maison",
  etage: null,
  complement: null,
  confort_ete: "insuffisant",
  traversant: false,
  protection_solaire: false,
  ventilation: "Ventilation par ouverture des fenêtres",
  inertie: "Légère",
  isolation_toiture: "insuffisante",
  brasseur_air: false,
  isolation_murs: "Insuffisante",
  isolation_menuiseries: "Moyenne",
  methode_dpe: "dpe 3CL 2021 méthode logement individuel",
};

const DPE_APPARTEMENT: DpeRecord = {
  ...DPE_MAISON,
  id_dpe: "0000E0000000Y",
  date_dpe: "2023-11-07",
  etiquette_dpe: "E",
  etiquette_ges: "E",
  conso_ep_m2: 286.4,
  emission_ges_m2: 52.3,
  surface_m2: 61.5,
  annee_construction: 1972,
  type_batiment: "appartement",
  confort_ete: "moyen",
  traversant: null,
  protection_solaire: null,
  ventilation: "VMC simple flux autoréglable",
  inertie: "Lourde",
  methode_dpe: "dpe 3CL 2021 méthode immeuble",
};

const sc = (categorie: string, etape: string, conso: number, ges: number) =>
  ({ categorie, etape, travaux: null, conso_ep_m2: conso, emission_ges_m2: ges });

const PLAN_INONDATION = {
  gasparId: null,
  plan: "Plan de prévention du risque inondation de la vallée témoin",
  hazardModel: "PPRN-I",
  zoneRegExists: true,
  updatedAt: "2023-06-01",
  zones: [{ regimeCode: "03", regime: "Prescriptions", zoneCode: "B1", zoneName: "Zone bleue" }],
  topRegimeRank: 2,
};

const RAPPORT_TEMOIN: LogementReport = {
  address: { id: null, label: "Adresse témoin, 00000 Commune témoin", city: COMMUNE, citycode: null, postcode: "00000", latitude: 0, longitude: 0 },
  parcel: { parcelCode: "00000-000-AB-0000", nomCommune: COMMUNE, contenance: 412 },
  dpeCandidates: [DPE_MAISON],
  dpeCandidatesStatus: "present",
  audit: {
    correspondance: "exact_address",
    n_audit: "A0000000000000",
    date_audit: "2024-05-02",
    classe_dpe_actuel: "G",
    adresse: "Adresse témoin",
    objet: { grain: "logement", surface_m2: 108 },
    scenarios: [
      sc('scénario multi étapes "principal"', "étape intermédiaire 1", 115.1, 21.4),
      sc('scénario multi étapes "principal"', "étape finale", 53, 4.1),
      sc('scénario en une étape "principal"', "étape finale", 53, 4.1),
      sc('scénario multi étapes "principal"', "étape première", 167.3, 33.9),
      sc("état initial", "état initial", 503.5, 75),
    ],
  },
  auditStatus: "present",
  georisques: {
    address: {
      risks: { labels: ["Inondation", "Retrait-gonflement des sols argileux", "Séisme"] },
      pprn: { labels: [PLAN_INONDATION.plan] },
      regulatoryPlans: [PLAN_INONDATION],
      rga: { code: "2", label: "Exposition moyenne" },
      seismic: { code: "2", label: "Faible" },
    },
  },
  heritage: { items: [{ family: "AC1", label: "Abords d'un monument historique" }], sourceStatus: "ok" },
  sinistralite: {
    secheresse: { kind: "lecture", cout: "Entre 10 et 20k€", frequence: "Entre 2 et 5 ‰", representativite: "Entre 30 et 50%" },
    inondation: { kind: "aucun" },
  },
};

const FAITS_TEMOIN: LogementFacts = {
  dpe: "passoire",
  dpeLabel: "G",
  rga: "present", expositionBati: true,
  pprn: "present", zoneReglementee: true, pprnLabel: PLAN_INONDATION.plan,
  cavites: "none", caviteProche: false,
  patrimoine: "present", perimetrePatrimonial: true,
  sinistralite: "present", sinistraliteActive: true,
  confortEteInsuffisant: true,
  addressLabel: "Adresse témoin, 00000 Commune témoin",
};

export const PROJET_TEMOIN = {
  posture: "adresse", intent: null, rawText: null, updatedAt: "1970-01-01T00:00:00.000Z",
  parsed: { reformulation: "projet de test", hardConstraints: {}, preferences: [] },
} as unknown as UserProject;

export type CasDeLogement = {
  cle: CasLogement;
  commune: string;
  rapport: LogementReport;
  dpe: DpeRecord | null;
  faits: LogementFacts;
  catnat: ReturnType<typeof catnatInondationDepuisCompte>;
  /** La base des diagnostics n'a pas répondu (FUT-65) : distinct de « aucun diagnostic ». */
  dpeNonVerifiable: boolean;
};

export function casDeLogement(cle: CasLogement = "temoin"): CasDeLogement {
  const base: CasDeLogement = {
    cle, commune: COMMUNE, rapport: RAPPORT_TEMOIN, dpe: DPE_MAISON, faits: FAITS_TEMOIN,
    catnat: catnatInondationDepuisCompte(3), dpeNonVerifiable: false,
  };
  switch (cle) {
    case "temoin":
      return base;
    case "titre-long": {
      const label = "Résidence Les Terrasses du Grand Large, bâtiment C, escalier 4, 1250 avenue du Maréchal-de-Lattre-de-Tassigny, 00000 Commune-témoin-sur-Mer";
      return {
        ...base,
        rapport: { ...RAPPORT_TEMOIN, address: { ...RAPPORT_TEMOIN.address!, label } },
        faits: { ...FAITS_TEMOIN, addressLabel: label },
      };
    }
    case "sans-dpe":
      return {
        ...base, dpe: null,
        rapport: { ...RAPPORT_TEMOIN, dpeCandidates: [], dpeCandidatesStatus: "absent", audit: null, auditStatus: "absent" },
        faits: { ...FAITS_TEMOIN, dpe: "absent", dpeLabel: null, confortEteInsuffisant: false },
      };
    case "immeuble":
      return {
        ...base, dpe: DPE_APPARTEMENT,
        rapport: {
          ...RAPPORT_TEMOIN,
          address: { ...RAPPORT_TEMOIN.address!, label: "Adresse témoin, appartement 3B, 00000 Commune témoin" },
          dpeCandidates: [DPE_APPARTEMENT],
          heritage: { items: [], sourceStatus: "ok" },
          audit: {
            correspondance: "exact_address",
            n_audit: "A0000000000001",
            date_audit: "2024-02-12",
            classe_dpe_actuel: "E",
            adresse: "Adresse témoin",
            objet: { grain: "immeuble", surface_m2: 1840 },
            scenarios: [
              sc("état initial", "état initial", 271.2, 49.8),
              sc('scénario en une étape "principal"', "étape finale", 96.4, 12.6),
            ],
          },
        },
        faits: { ...FAITS_TEMOIN, dpe: "energivore", dpeLabel: "E", patrimoine: "none", perimetrePatrimonial: false, confortEteInsuffisant: false, addressLabel: "Adresse témoin, appartement 3B, 00000 Commune témoin" },
      };
    case "sources-absentes":
      return {
        ...base,
        rapport: {
          ...RAPPORT_TEMOIN,
          audit: null, auditStatus: "unavailable",
          georisques: {},
          heritage: { items: [], sourceStatus: "unavailable" },
          sinistralite: { secheresse: { kind: "indispo" }, inondation: { kind: "indispo" } },
        },
        catnat: null,
        faits: {
          ...FAITS_TEMOIN,
          rga: "unavailable", expositionBati: false,
          pprn: "unavailable", zoneReglementee: false, pprnLabel: null,
          cavites: "unavailable", caviteProche: false,
          patrimoine: "unavailable", perimetrePatrimonial: false,
          sinistralite: "unavailable", sinistraliteActive: false,
        },
      };
  }
}

/** Les lectures que la production dérive de ces données, par ses propres fonctions. */
export function lecturesDe(c: CasDeLogement) {
  const g = c.rapport.georisques?.parcel ?? c.rapport.georisques?.address;
  return {
    inondation: c.rapport.sinistralite
      ? construireLectureInondation({
          zonage: zonageInondationDepuisPlans(g ? (g.regulatoryPlans ?? []) : null),
          catnat: c.catnat,
          onrn: c.rapport.sinistralite.inondation,
        })
      : null,
    points: pointsAVerifier(c.faits, PROJET_TEMOIN),
    introPoints: introPointsAVerifier(PROJET_TEMOIN),
    confort: deriveThermalEvidence(c.dpe),
    audit: c.rapport.audit && c.rapport.audit.correspondance === "exact_address" && c.rapport.audit.scenarios.length > 0
      ? parcoursAudit(c.rapport.audit.scenarios)
      : null,
  };
}

/** Lit le cas demandé dans l'URL ; un nom inconnu retombe sur le cas de référence. */
export function casDepuisUrl(brut: string | undefined): CasLogement {
  return (CAS_LOGEMENT as readonly string[]).includes(brut ?? "") ? (brut as CasLogement) : "temoin";
}

// Libellés en clair des tranches ONRN : copie de `SinistraliteSection.tsx` (constantes privées du
// module). À unifier lors de la migration, pas en dupliquant davantage.
export const ONRN_COUT: Record<string, string> = {
  "Entre 0 et 2,5 k€": "moins de 2 500 €", "Entre 2,5 et 5 k€": "2 500 à 5 000 €", "Entre 5 et 10 k€": "5 000 à 10 000 €",
  "Entre 10 et 20k€": "10 000 à 20 000 €", "Plus de 20 k€": "plus de 20 000 €",
};
export const ONRN_FREQ: Record<string, string> = {
  "Entre 0 et 1 ‰": "moins de 1 pour 1 000", "Entre 1 et 2 ‰": "1 à 2 pour 1 000", "Entre 2 et 5 ‰": "2 à 5 pour 1 000",
  "Entre 5 et 10 ‰": "5 à 10 pour 1 000", "Plus de 10 ‰": "plus de 10 pour 1 000",
};
