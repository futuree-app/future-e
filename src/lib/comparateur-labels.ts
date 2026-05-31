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
