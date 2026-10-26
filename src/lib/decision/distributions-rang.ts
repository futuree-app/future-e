// L'IDENTITÉ DE LA DISTRIBUTION QUI A PRODUIT UNE POSITION. Lib PURE : aucune I/O.
//
// Une position relative (« parmi les 20 % de communes les moins favorables ») n'a de sens que rapportée au classement
// national qui l'a produite. Chaque preuve structurée la porte (`basis.distributionVersion`) et l'artefact d'un dossier
// vendu la fige. Deux classements différents d'un même critère doivent donc porter deux identités différentes : sinon,
// une preuve défavorable d'hier et une preuve favorable d'aujourd'hui se présentent comme issues des mêmes données.
//
// C'est ce qui manquait avant FUT-136 (26/10/2026). Les rangs des services, des écoles et de la culture ont été
// recalculés : Valserhône passe, sur les services, d'une bande défavorable à une bande favorable, sous la même
// identité `mismatch-dist-2026-07-15` et le même moteur `engine-7`. Ces trois critères reçoivent une identité
// propre ; les dix autres gardent la leur, inchangée.
//
// LE LIEN AVEC LES DONNÉES N'EST PAS DÉCLARATIF. `DISTRIBUTIONS_PUBLIEES` associe chaque identité à l'empreinte des
// bandes qu'elle désigne (sha256 des lignes `insee \t bas \t haut`, triées, sur les communes de l'index versionné).
// `distributions-rang.test.ts` recalcule l'empreinte sur l'index publié et échoue si elle n'est pas celle de
// l'identité en vigueur : un recalcul de rang qui ne change pas l'identité ne passe pas.
//
// POUR RECALCULER UN RANG : `populate-mismatch-rank.mts --recalculer <clé>`, puis donner à la clé une identité NOUVELLE
// dans `IDENTITES_RECALCULEES`, et AJOUTER une ligne au registre (identité, empreinte, effectif). Les lignes existantes
// ne se modifient jamais : elles disent ce que désignent les identités déjà figées dans des dossiers vendus.
import type { PreferenceKey } from "../comparateur-vie.ts";
import { MISMATCH_DISTRIBUTION_VERSION } from "./mismatch-facts.ts";

// Les critères dont le classement a été recalculé depuis l'identité historique, et leur identité propre.
const IDENTITES_RECALCULEES: Partial<Record<PreferenceKey, string>> = {
  acces_services: "mismatch-dist-2026-10-26-acces_services",
  acces_ecoles: "mismatch-dist-2026-10-26-acces_ecoles",
  acces_culture: "mismatch-dist-2026-10-26-acces_culture",
};

/** L'identité de la distribution en vigueur pour un critère. La même pour la règle favorable et la défavorable. */
export function distributionVersionDe(key: PreferenceKey): string {
  return IDENTITES_RECALCULEES[key] ?? MISMATCH_DISTRIBUTION_VERSION;
}

export type DistributionPubliee = {
  identite: string;
  /** sha256 hex des lignes `${insee}\t${bas}\t${haut}\n` (points de base), triées, des communes qui ont une bande. */
  empreinte: string;
  /** Le nombre de communes classées. */
  communes: number;
  note: string;
};

// LE REGISTRE, en ajout seul. Par critère, chaque identité désigne une seule distribution, et réciproquement.
// Empreintes relevées le 26/10/2026 : l'index de `main` @ `cf4a2dab` (avant FUT-136) et l'index corrigé.
const AVANT_FUT136 = "Index de main avant FUT-136 (cf4a2dab) : bandes périmées, bâties sur un score antérieur.";
const FUT136 = "FUT-136 : bandes recalculées sur le score en vigueur.";
const HISTORIQUE = "Identité historique conservée ; empreinte relevée le 26/10/2026 (index cf4a2dab, inchangée par FUT-136).";
export const DISTRIBUTIONS_PUBLIEES: Record<string, DistributionPubliee[]> = {
  acces_services: [
    { identite: MISMATCH_DISTRIBUTION_VERSION, empreinte: "61490bd1fe267a94e60ba2e81c2c1c16a7b0c0149b8bad053bc84ff6282ac592", communes: 34726, note: AVANT_FUT136 },
    { identite: "mismatch-dist-2026-10-26-acces_services", empreinte: "c8e94c94c662c16ad19a4491e24c14a3de91da9240923c009efb24e2b975d38c", communes: 34780, note: FUT136 },
  ],
  acces_ecoles: [
    { identite: MISMATCH_DISTRIBUTION_VERSION, empreinte: "ad399efbc453493c6056c3c242e9f1cb544906a02ac98886f89067cb6fc5f290", communes: 34788, note: AVANT_FUT136 },
    { identite: "mismatch-dist-2026-10-26-acces_ecoles", empreinte: "9cf5716513e7b84a1f31b1250059b93e264f8cf94e7bc49c87a29865e1389e2a", communes: 34788, note: FUT136 },
  ],
  acces_culture: [
    { identite: MISMATCH_DISTRIBUTION_VERSION, empreinte: "e299bb2b300e012b6210ff1e31750538bd891f6c8ab930bd5c4bcf592970e111", communes: 34788, note: AVANT_FUT136 },
    { identite: "mismatch-dist-2026-10-26-acces_culture", empreinte: "4556218aed1057198fc968733a7fbf252c081acc103623c53e1252b95f6e3527", communes: 34788, note: FUT136 },
  ],
  nature: [{ identite: MISMATCH_DISTRIBUTION_VERSION, empreinte: "a237b4c595dfd109b7197dc6bd3f9e5f844b566809547eef2d1c14a58d6a3bd1", communes: 34743, note: HISTORIQUE }],
  acces_soins: [{ identite: MISMATCH_DISTRIBUTION_VERSION, empreinte: "01123d86e10efcb69284e16a7c8986771a46a6acc32bcfe941a44c3483f36c44", communes: 34731, note: HISTORIQUE }],
  acces_transports: [{ identite: MISMATCH_DISTRIBUTION_VERSION, empreinte: "ded06a93a557e29d6dc0fa7d3dc65c8ac24144c03f5be5759975571fadce1c76", communes: 34788, note: HISTORIQUE }],
  faible_dependance_auto: [{ identite: MISMATCH_DISTRIBUTION_VERSION, empreinte: "087e29cea9445e03d0ee3219a0e2f56e383edbe514edae47c405c7ca777e4519", communes: 30048, note: HISTORIQUE }],
  croissance_demographique: [{ identite: MISMATCH_DISTRIBUTION_VERSION, empreinte: "c2efe4e608de4af8bf04b6557225d30a5b19ad93683bdbe189f61ae7a81d4818", communes: 34725, note: HISTORIQUE }],
  vie_locale: [{ identite: MISMATCH_DISTRIBUTION_VERSION, empreinte: "9c3e4d313a7fbc73c2df11ab42d78886e46da66271b93175f822777254ec8223", communes: 34529, note: HISTORIQUE }],
  cadre_calme: [{ identite: MISMATCH_DISTRIBUTION_VERSION, empreinte: "112e0c0832078aaa837ea22f0cfce9e6bf77e40558b116ae34bfb447df7623aa", communes: 34728, note: HISTORIQUE }],
  viabilite_emploi: [{ identite: MISMATCH_DISTRIBUTION_VERSION, empreinte: "ca45131a3f0730f4e6266b1fd0b544f947541d3322ac21386e52cd62166cf643", communes: 34788, note: HISTORIQUE }],
  ensoleillement_recherche: [{ identite: MISMATCH_DISTRIBUTION_VERSION, empreinte: "8e4ee693b485090b318c29b378f922d866c78941fa56a25bfbdf3d30d84adc6b", communes: 34788, note: HISTORIQUE }],
  douceur_climat: [{ identite: MISMATCH_DISTRIBUTION_VERSION, empreinte: "436b25829b6d8371b7e6e422fd9608c8b5282aa7344b2c1ab978ba7af0331b7b", communes: 34788, note: HISTORIQUE }],
};
