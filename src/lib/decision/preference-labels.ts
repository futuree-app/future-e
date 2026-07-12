// Libellés lisibles des préférences (pour NOMMER, dans le dossier, les priorités déclarées que le
// slice ne traduit pas encore en points de décision). Copie locale volontaire : les libellés du
// scoring vivent dans comparateur-vie.ts (server-only), qu'on ne peut pas value-importer dans les
// libs pures testées. Ce sont des libellés de DÉCISION (« la qualité de l'air »), pas de critère.
import type { PreferenceKey } from "../comparateur-vie.ts";

export const PREFERENCE_LABELS: Record<PreferenceKey, string> = {
  faible_chaleur: "des étés supportables",
  douceur_climat: "un climat doux",
  ensoleillement_recherche: "l'ensoleillement",
  faible_secheresse: "peu de sécheresse",
  faible_risque_feu: "un faible risque d'incendie",
  faible_precip_extremes: "peu de pluies extrêmes",
  proximite_mer: "la proximité de la mer",
  cadre_calme: "un cadre calme",
  eviter_isolement: "éviter l'isolement",
  viabilite_emploi: "un bassin d'emploi viable",
  air_sain: "la qualité de l'air",
  acces_soins: "l'accès aux soins",
  acces_services: "les services du quotidien",
  faible_pression_agricole: "l'éloignement de l'agriculture intensive",
  nature: "la présence de nature",
  acces_ecoles: "l'accès aux écoles",
  acces_culture: "l'accès à la culture",
  faible_risque_inondation: "un faible risque d'inondation",
  faible_dependance_auto: "une faible dépendance à la voiture",
  acces_transports: "l'accès aux transports",
  mobilite_quotidienne: "les transports du quotidien",
  eviter_grandes_villes: "éviter les grandes villes",
  prefere_grande_ville: "une grande ville",
  vie_etudiante: "la vie étudiante",
  vie_locale: "la vie locale",
  croissance_demographique: "une commune qui gagne des habitants",
  calme_sonore: "le calme sonore",
  faible_exposition_industrielle: "l'éloignement des sites industriels",
};

// Préférences qu'AU MOINS une règle du slice examine (transports/chaleur via le compromis et le
// confort, inondation via la vérification). Les déclarées hors de cet ensemble sont nommées « pas
// encore traduites en points de décision ». S'élargit à mesure que le registre grandit.
export const COVERED_PREFERENCE_KEYS: PreferenceKey[] = [
  "faible_chaleur",
  "acces_transports",
  "faible_risque_inondation",
];
