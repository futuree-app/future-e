// FUT-87 · LE LOGEMENT TÉMOIN DES PROTOTYPES. FIXTURE ANONYMISÉE, DEV UNIQUEMENT.
//
// Un bien FICTIF : adresse, commune, parcelle et numéros sont inventés et ne désignent rien. Les
// valeurs énergétiques sont celles d'un audit réglementaire PUBLIC (base ouverte ADEME), détachées de
// leur adresse : quatre étapes d'un parcours par étapes et une rénovation en une fois, les mêmes que
// la fixture de `fut67-restitution.test.ts`. Le reste (zonage, sinistralité, arrêtés) reprend la forme
// exacte des réponses des sources, sans désigner un lieu réel.
//
// Les lectures dérivées passent par les fonctions de PRODUCTION (`construireLectureInondation`,
// `pointsAVerifier`, `deriveThermalEvidence`, `parcoursAudit`) : le prototype et la page « avant »
// lisent exactement les mêmes faits, et aucun texte n'est réécrit pour l'occasion.
import type { LogementReport } from "../../../lib/logement-report-types.ts";
import type { DpeRecord } from "../../../lib/dpe-attribution.ts";
import type { LogementFacts } from "../../../lib/decision/decision-fact.ts";
import { catnatInondationDepuisCompte } from "../../../lib/decision/catnat-evidence.ts";
import type { UserProject } from "../../../lib/user-project.ts";
import { construireLectureInondation, zonageInondationDepuisPlans } from "../../../lib/decision/inondation-lecture.ts";
import { pointsAVerifier, introPointsAVerifier } from "../../../lib/decision/logement-verifications.ts";
import { deriveThermalEvidence } from "../../../lib/thermal-evidence.ts";
import { parcoursAudit } from "../../../lib/audit-record.ts";

export const COMMUNE_TEMOIN = "Commune témoin";

export const DPE_TEMOIN: DpeRecord = {
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

const sc = (categorie: string, etape: string, conso: number, ges: number) =>
  ({ categorie, etape, travaux: null, conso_ep_m2: conso, emission_ges_m2: ges });

export const RAPPORT_TEMOIN: LogementReport = {
  address: { id: null, label: "Adresse témoin, 00000 Commune témoin", city: COMMUNE_TEMOIN, citycode: null, postcode: "00000", latitude: 0, longitude: 0 },
  parcel: { parcelCode: "00000-000-AB-0000", nomCommune: COMMUNE_TEMOIN, contenance: 412 },
  dpeCandidates: [DPE_TEMOIN],
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
      pprn: { labels: ["Plan de prévention du risque inondation de la vallée témoin"] },
      regulatoryPlans: [{
        gasparId: null,
        plan: "Plan de prévention du risque inondation de la vallée témoin",
        hazardModel: "PPRN-I",
        zoneRegExists: true,
        updatedAt: "2023-06-01",
        zones: [{ regimeCode: "03", regime: "Prescriptions", zoneCode: "B1", zoneName: "Zone bleue" }],
        topRegimeRank: 2,
      }],
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

export const CATNAT_TEMOIN = catnatInondationDepuisCompte(3);

export const FAITS_TEMOIN: LogementFacts = {
  dpe: "passoire",
  dpeLabel: "G",
  rga: "present", expositionBati: true,
  pprn: "present", zoneReglementee: true, pprnLabel: "Plan de prévention du risque inondation de la vallée témoin",
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

/** Les lectures que la production dérive de ces données, par ses propres fonctions. */
export function lecturesTemoin() {
  const plans = RAPPORT_TEMOIN.georisques?.address?.regulatoryPlans ?? [];
  return {
    inondation: construireLectureInondation({
      zonage: zonageInondationDepuisPlans(plans),
      catnat: CATNAT_TEMOIN,
      onrn: RAPPORT_TEMOIN.sinistralite!.inondation,
    }),
    points: pointsAVerifier(FAITS_TEMOIN, PROJET_TEMOIN),
    introPoints: introPointsAVerifier(PROJET_TEMOIN),
    confort: deriveThermalEvidence(DPE_TEMOIN),
    audit: parcoursAudit(RAPPORT_TEMOIN.audit!.scenarios),
  };
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
