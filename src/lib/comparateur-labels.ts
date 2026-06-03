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
  douceur_climat: "un climat doux",
  ensoleillement_recherche: "du soleil et de la chaleur",
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
};

// Interprétations visibles (audit sémantique, cf. AUDIT_SEMANTIQUE_COMPARATEUR.md).
// Glose affichée sous la puce du critère pour rendre EXPLICITE ce que le moteur
// entend, et désamorcer les faux amis (« doux » = hiver océanique, pas Méditerranée)
// et la polysémie (« calme » = densité, pas la campagne). null = le libellé dit déjà
// tout, on ne glose pas (anti-bloat). Pur affichage : aucun impact sur le score.
export const PREFERENCE_INTERPRETATIONS: Record<string, string | null> = {
  douceur_climat: "hivers tempérés, étés sans excès",
  cadre_calme: "densité modérée, sans isolement",
  ensoleillement_recherche: "plus chaud et plus sec",
  proximite_mer: "accès rapide à la côte",
  eviter_isolement: "commune assez peuplée pour une vie locale",
  // « à proximité » assumé (on mesure le couvert autour, pas dans la commune). Jamais
  // « préservé / sauvage / biodiversité », qu'on ne mesure pas (cf. NATURE_TERRITORIAL.md).
  nature: "forêts, prairies et milieux naturels autour",
  // On mesure l'ACCÈS, pas la qualité ni la vitalité. Le caveat méthodo (« qualité / animation
  // non mesurées ») vit dans HORS_MESURE_PHRASES, affiché au gate : inutile de le redire ici.
  // écoles : le libellé « l'accès aux collèges et lycées » dit déjà tout, pas de glose (null).
  acces_ecoles: null,
  acces_culture: "présence d'équipements culturels",
  faible_risque_inondation: "historique d'arrêtés CatNat inondation et territoires à risque important, pas une garantie d'absence de crue",
  // self-évidents (le mot = la mesure) : pas de glose
  faible_chaleur: null,
  faible_secheresse: null,
  faible_risque_feu: null,
  faible_precip_extremes: "pluies intenses projetées, pas le risque d'inondation réel",
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

// Variante portant l'interprétation visible (glose) à côté du libellé, sans doublon.
export function preferencesToInterpreted(
  preferences: { key: string }[] | null | undefined,
): { label: string; gloss: string | null }[] {
  if (!preferences) return [];
  const seen = new Set<string>();
  const out: { label: string; gloss: string | null }[] = [];
  for (const p of preferences) {
    const label = PREFERENCE_LABELS[p.key];
    if (label && !seen.has(label)) {
      seen.add(label);
      out.push({ label, gloss: PREFERENCE_INTERPRETATIONS[p.key] ?? null });
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
