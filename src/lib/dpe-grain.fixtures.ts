// FUT-74 : adresses SYNTHÉTIQUES, construites sur la forme de lignes ADEME réelles relevées le
// 24/10/2026 (dpe03existant). Aucun numéro de DPE, identifiant BAN ni complément d'adresse réel :
// les valeurs énergétiques et la structure (qui coexiste avec qui, quels champs sont vides) sont
// celles observées, les identifiants sont inventés (préfixe `FUT74`, BAN en `99999_`).
import type { DpeRecord } from "./dpe-attribution.ts";

const BAN = "99999_0000_00001";

export function dpe(over: Partial<DpeRecord> = {}): DpeRecord {
  return {
    id_dpe: "FUT74LOG00001", date_dpe: "2025-06-03", id_ban: BAN, adresse: "1 Rue Synthétique 99999 Exemple",
    etiquette_dpe: "D", etiquette_ges: "B", conso_ep_m2: 181, emission_ges_m2: 9,
    surface_m2: 57.7, annee_construction: 1965, type_batiment: "appartement",
    etage: 0, complement: null,
    confort_ete: null, traversant: null, protection_solaire: null, ventilation: null,
    inertie: null, isolation_toiture: null, brasseur_air: null,
    isolation_murs: null, isolation_menuiseries: null, methode_dpe: "dpe appartement individuel",
    ...over,
  };
}

const IMMEUBLE: Partial<DpeRecord> = {
  type_batiment: "immeuble", methode_dpe: "dpe immeuble collectif",
  // `surface_habitable_logement` est « renseignée sauf dans le cas du dpe à l'immeuble » (dictionnaire
  // ADEME) : 0,27 % des DPE d'immeuble la portent. Le record lu par futur•e n'a donc pas de surface.
  surface_m2: null,
};

const GENERE = "dpe appartement généré à partir des données DPE immeuble";

/**
 * CAS 1 · Le DPE de l'immeuble ET ses appartements générés, au même identifiant BAN, SANS complément
 * d'adresse (forme relevée à Strasbourg). Aujourd'hui, les sept lignes s'intitulent « Immeuble entier ».
 */
export const IMMEUBLE_ET_GENERES_SANS_COMPLEMENT: DpeRecord[] = [
  dpe({ id_dpe: "FUT74IMM00001", ...IMMEUBLE, etiquette_dpe: "C", conso_ep_m2: 159.1 }),
  dpe({ id_dpe: "FUT74GEN00001", methode_dpe: GENERE, etiquette_dpe: "D", conso_ep_m2: 181, surface_m2: 57.7 }),
  dpe({ id_dpe: "FUT74GEN00002", methode_dpe: GENERE, etiquette_dpe: "D", conso_ep_m2: 184.8, surface_m2: 57.5 }),
  dpe({ id_dpe: "FUT74GEN00003", methode_dpe: GENERE, etiquette_dpe: "C", conso_ep_m2: 151.5, surface_m2: 42.2 }),
  dpe({ id_dpe: "FUT74GEN00004", methode_dpe: GENERE, etiquette_dpe: "C", conso_ep_m2: 142.8, surface_m2: 62.5 }),
  dpe({ id_dpe: "FUT74GEN00005", methode_dpe: GENERE, etiquette_dpe: "C", conso_ep_m2: 139.1, surface_m2: 62.5 }),
  dpe({ id_dpe: "FUT74GEN00006", methode_dpe: GENERE, etiquette_dpe: "C", conso_ep_m2: 136, surface_m2: 60.5 }),
];

/**
 * CAS 2 · Des appartements générés AVEC identifiant de lot, sans le DPE de l'immeuble dans la liste
 * (forme relevée dans le Nord, l'immeuble absent du lot interrogé). Aujourd'hui, l'écran annonce
 * « Un diagnostic concerne l'immeuble entier » alors qu'aucun ne le concerne.
 */
export const GENERES_SEULS: DpeRecord[] = [
  dpe({ id_dpe: "FUT74GEN00011", methode_dpe: GENERE, etiquette_dpe: "C", conso_ep_m2: 97.2, surface_m2: 52.8, complement: "Lot : 900001 - Porte : 2 - Etage : RDC" }),
  dpe({ id_dpe: "FUT74GEN00012", methode_dpe: GENERE, etiquette_dpe: "C", conso_ep_m2: 89.5, surface_m2: 76.3, complement: "Lot : 900002 - Porte : 13 - Etage : 1" }),
  dpe({ id_dpe: "FUT74GEN00013", methode_dpe: GENERE, etiquette_dpe: "C", conso_ep_m2: 91.7, surface_m2: 67.8, complement: "Lot : 900003 - Porte : 1 - Etage : RDC" }),
];

/** CAS 3 · Le DPE de l'immeuble SEUL à l'adresse (4 cas sur 16 dans l'échantillon du 24/10/2026). */
export const IMMEUBLE_SEUL: DpeRecord[] = [
  dpe({ id_dpe: "FUT74IMM00021", ...IMMEUBLE, etiquette_dpe: "F", conso_ep_m2: 395, etiquette_ges: "C" }),
];

/**
 * CAS 4 · L'immeuble et des DPE d'appartements INDIVIDUELS (12 cas sur 16). Le DPE d'immeuble porte
 * ici un `complement_adresse_logement` parasite et pas de surface, forme relevée dans le Calvados.
 */
export const IMMEUBLE_ET_INDIVIDUELS: DpeRecord[] = [
  dpe({ id_dpe: "FUT74IMM00031", ...IMMEUBLE, etiquette_dpe: "D", conso_ep_m2: 204.1, complement: "2-DPE-1-LogZone" }),
  dpe({ id_dpe: "FUT74LOG00031", etiquette_dpe: "E", conso_ep_m2: 260, surface_m2: 31.2, complement: "Apt 12" }),
  dpe({ id_dpe: "FUT74LOG00032", etiquette_dpe: "C", conso_ep_m2: 150, surface_m2: 64, complement: "Apt 21" }),
  dpe({ id_dpe: "FUT74LOG00033", etiquette_dpe: "D", conso_ep_m2: 190, surface_m2: 45.5, complement: "Apt 33" }),
];

/** CAS 5 · Logements seuls : une maison, le seul cas d'attribution automatique. */
export const MAISON_SEULE: DpeRecord[] = [
  dpe({ id_dpe: "FUT74MAI00041", type_batiment: "maison", methode_dpe: "dpe maison individuelle", etiquette_dpe: "E", surface_m2: 112 }),
];

/** CAS 6 · Mal typé ou insuffisamment renseigné : jamais observé sur les jeux actuels, possible sur un snapshot. */
export const AMBIGUS: DpeRecord[] = [
  // Ni type ni méthode (snapshot ancien, colonne absente).
  dpe({ id_dpe: "FUT74AMB00051", type_batiment: null, methode_dpe: null }),
  // Type et méthode contradictoires.
  dpe({ id_dpe: "FUT74AMB00052", type_batiment: "appartement", methode_dpe: "dpe immeuble collectif" }),
  // Type inconnu de l'énumération.
  dpe({ id_dpe: "FUT74AMB00053", type_batiment: "local", methode_dpe: null }),
];

/** Le neuf (dpe02neuf) : mêmes grains, autres méthodes. */
export const NEUF: DpeRecord[] = [
  dpe({ id_dpe: "FUT74NEU00061", type_batiment: "immeuble", methode_dpe: "dpe issu d'une étude thermique réglementaire RT2012 bâtiment : immeuble", surface_m2: null }),
  dpe({ id_dpe: "FUT74NEU00062", type_batiment: "appartement", methode_dpe: "dpe issu d'une étude energie environement réglementaire RE2020 bâtiment : appartement" }),
  dpe({ id_dpe: "FUT74NEU00063", type_batiment: "maison", methode_dpe: "dpe issu d'une étude thermique réglementaire RT2012 bâtiment : maison individuelle" }),
];
