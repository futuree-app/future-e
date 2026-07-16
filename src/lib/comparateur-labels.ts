// Libellés humains des clés de préférence du Comparateur de vie.
//
// Client-safe (pas de "server-only", pas d'fs) : la page /ou-vivre l'importe
// pour convertir les clés techniques du projet parsé en libellés lisibles avant
// de les passer à AskFuture comparateur. Le firewall de la route ask interdit la
// donnée profonde ; cette map garantit qu'AUCUNE clé technique (faible_chaleur,
// faible_pression_agricole…) ne quitte le client, seulement sa glose humaine.
//
// Source de vérité du vocabulaire : alignée sur la route synthesize. Si une clé
// PREFERENCE_KEYS est ajoutée au moteur, l'ajouter ici.

export const PREFERENCE_LABELS: Record<string, string> = {
  faible_chaleur: "des étés plus frais",
  douceur_climat: "des hivers doux",
  ensoleillement_recherche: "un climat plus ensoleillé",
  faible_secheresse: "des sols peu exposés à la sécheresse",
  faible_risque_feu: "un faible risque de feu",
  faible_precip_extremes: "moins de pluies intenses",
  proximite_mer: "la proximité de la mer",
  cadre_calme: "un cadre calme",
  eviter_isolement: "ne pas être isolé",
  air_sain: "un air plus pur",
  acces_soins: "un bon accès aux soins",
  acces_services: "des services du quotidien accessibles",
  faible_pression_agricole: "un environnement peu marqué par l'agriculture intensive",
  viabilite_emploi: "un bassin d'emploi dynamique",
  nature: "des espaces naturels à proximité",
  acces_ecoles: "l'accès aux collèges et lycées",
  acces_culture: "l'accès à une offre culturelle",
  faible_risque_inondation: "un faible risque d'inondation",
  faible_dependance_auto: "une faible dépendance à la voiture",
  acces_transports: "l'accès au train et aux gares",
  mobilite_quotidienne: "les transports en commun du quotidien (bus, tram, métro)",
  eviter_grandes_villes: "une ville à taille humaine",
  prefere_grande_ville: "une grande ville",
  vie_etudiante: "une ville étudiante",
  vie_locale: "une vie locale animée",
  croissance_demographique: "Un territoire qui gagne des habitants",
  calme_sonore: "l'éloignement des grandes sources de bruit (axes, rail, aéroports)",
  faible_exposition_industrielle: "être loin des sites industriels à risque",
};

// N2 — glose positive affichée au survol/tap de la puce (cf. ChipTooltip). Courte,
// orientée compréhension du SENS du critère, jamais de négation. null = puce nue
// (le libellé suffit, anti-bloat). Pur affichage, aucun impact sur le score.
export const PREFERENCE_TOOLTIP: Record<string, string | null> = {
  vie_etudiante: "Présence d'établissements d'enseignement supérieur et d'une population étudiante active.",
  vie_locale: "Densité des lieux où l'on se retrouve (cafés, marchés, sport, associations) rapportée à la population. Indique si le territoire a une vie sociale au quotidien.",
  croissance_demographique: "Évolution récente de la population (gagne ou perd des habitants). Mesure la trajectoire du territoire, pas sa désirabilité.",
  acces_transports: "Présence et fréquentation des gares à proximité.",
  mobilite_quotidienne: "Indique si un réseau de bus, tram ou métro dessert les environs immédiats. Mesure la possibilité de s'y déplacer au quotidien sans voiture.",
  faible_dependance_auto: "Part des trajets domicile-travail faits autrement qu'en voiture.",
  cadre_calme: "Environnement peu dense, propice à un rythme plus calme.",
  douceur_climat: "Hivers relativement doux à l'échelle nationale.",
  ensoleillement_recherche: "Plus ensoleillé.",
  proximite_mer: "Accès rapide à la côte.",
  eviter_isolement: "Présence d'un bassin de vie offrant services et activités du quotidien.",
  nature: "Forêts, prairies et milieux naturels autour.",
  acces_culture: "Présence d'équipements culturels à proximité.",
  acces_ecoles: "Collèges et lycées accessibles alentour.",
  eviter_grandes_villes: "Taille de l'agglomération (unité urbaine).",
  prefere_grande_ville: "Taille de l'agglomération (unité urbaine).",
  faible_risque_inondation: "Historique d'inondations observé sur le territoire.",
  faible_precip_extremes: "Pluies intenses projetées par le climat.",
  calme_sonore: "Densité de grandes infrastructures bruyantes autour (axes rapides, voie ferrée, aéroport). Mesure l'environnement sonore structurel, pas le bruit ressenti.",
  faible_exposition_industrielle: "Densité d'installations industrielles classées en activité à proximité (sites Seveso, IED). Mesure leur présence, pas un niveau de pollution ni un risque sanitaire avéré. Ne couvre pas les anciens sites pollués ni les friches.",
  // self-évidents (le libellé = la mesure) : pas de bulle
  faible_chaleur: null,
  faible_secheresse: null,
  faible_risque_feu: null,
  air_sain: null,
  acces_soins: null,
  acces_services: null,
  faible_pression_agricole: null,
  viabilite_emploi: null,
};

// Convertit une liste de préférences {key} en libellés humains, sans doublon,
// en ignorant toute clé inconnue.
export function preferencesToLabels(
  preferences: { key: string }[] | null | undefined,
): string[] {
  if (!preferences) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of preferences) {
    const label = PREFERENCE_LABELS[p.key];
    if (label && !seen.has(label)) {
      seen.add(label);
      out.push(label);
    }
  }
  return out;
}

// Variante portant l'interprétation pour le bloc critères : libellé + glose positive N2
// (tooltip, affichée au survol/tap), sans doublon de libellé. Les limites méthodologiques
// ne sont pas affichées ici (elles vivent dans le rapport).
export function preferencesToInterpreted(
  preferences: { key: string }[] | null | undefined,
): { label: string; tooltip: string | null }[] {
  if (!preferences) return [];
  const seen = new Set<string>();
  const out: { label: string; tooltip: string | null }[] = [];
  for (const p of preferences) {
    const label = PREFERENCE_LABELS[p.key];
    if (label && !seen.has(label)) {
      seen.add(label);
      out.push({ label, tooltip: PREFERENCE_TOOLTIP[p.key] ?? null });
    }
  }
  return out;
}

// Phrases honnêtes affichées au gate pour les facettes SANS critère dans le moteur. écoles /
// culture sont désormais MESURÉES en ACCÈS (acces_ecoles / acces_culture) ; leur phrase
// hors-mesure est recadrée sur la facette non mesurée (qualité / vitalité). affectif = jamais
// mesurable (expérience personnelle). On n'interpole jamais le mot brut (accords bancals).
const HORS_MESURE_PHRASES: Record<string, string> = {
  ecoles:
    "La qualité, la réputation et les options des établissements ne sont pas mesurées par futur•e ; seul l'accès aux collèges et lycées l'est.",
  culture:
    "L'animation culturelle, la programmation et la vie associative locale ne sont pas mesurées par futur•e ; seul l'accès aux équipements culturels l'est.",
  affectif:
    "Le caractère d'un lieu (authentique, chaleureux, vivant) relève d'une expérience personnelle, pas d'une donnée territoriale.",
};

// Convertit les notions hors-mesure en phrases à afficher, sans doublon de phrase
// (deux termes d'un même kind se replient sur une seule phrase). Ignore les kinds inconnus.
export function horsMesureToPhrases(
  items: { term: string; kind: string }[] | null | undefined,
): string[] {
  if (!items) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    const phrase = HORS_MESURE_PHRASES[it.kind];
    if (phrase && !seen.has(phrase)) {
      seen.add(phrase);
      out.push(phrase);
    }
  }
  return out;
}
