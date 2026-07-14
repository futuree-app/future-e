// L'ADAPTATEUR COMPARATEUR. Il traduit l'évaluation canonique en politique de RECHERCHE : dans le doute
// (donnée communale absente), ne pas proposer. Il rend deux choses, là où passesHard n'en rendait qu'une :
//
//   eligible : cette commune peut être proposée
//   complete : TOUTES les contraintes déclarées ont pu être APPLIQUÉES
//
// Le second existe parce que le premier ne suffisait pas à dire la vérité. Une référence non résolue
// (« la gare Matabiau ») laissait la commune éligible, et le comparateur affichait ses résultats comme
// s'ils respectaient toutes les conditions du lecteur. `complete: false` lui interdit cette phrase.
import { lieuEnPhrase } from "./hard-constraints.ts";
import type { HardConstraintAssessment, HardConstraintKey, UnexaminedReason } from "./hard-constraints.ts";

export type HardFilterResult = {
  eligible: boolean;
  complete: boolean;
  satisfied: HardConstraintAssessment[];
  incompatible: HardConstraintAssessment[];
  unapplied: HardConstraintAssessment[];
};

// Une donnée manquante sur CETTE commune est communale : l'exclure n'exclut qu'elle. Une référence non
// résolue est GLOBALE : l'exclure exclurait tout le monde, et rendrait zéro résultat au lecteur, sans
// qu'il comprenne pourquoi.
const COMMUNE_LEVEL: UnexaminedReason[] = ["missing_data"];

export function hardFilter(assessments: HardConstraintAssessment[]): HardFilterResult {
  const satisfied = assessments.filter((a) => a.status === "satisfied");
  const incompatible = assessments.filter((a) => a.status === "incompatible");
  const unexamined = assessments.filter((a) => a.status === "unexamined");
  const excludedByData = unexamined.filter((a) => a.status === "unexamined" && COMMUNE_LEVEL.includes(a.reason));
  const unapplied = unexamined.filter((a) => a.status === "unexamined" && !COMMUNE_LEVEL.includes(a.reason));

  return {
    eligible: incompatible.length === 0 && excludedByData.length === 0,
    complete: unexamined.length === 0,
    satisfied,
    incompatible,
    unapplied,
  };
}

// Le libellé de ce qui n'a PAS pu être appliqué, pour le DIRE au lecteur. Le `detail` porte son mot
// (« Gare Matabiau ») ; sans lui, on retombe sur la catégorie.
const UNAPPLIED_LABELS: Record<HardConstraintKey, (detail?: string) => string> = {
  departements: () => "les départements visés",
  zones: (d) => (d ? `une zone que nous n'avons pas reconnue (${d})` : "les zones géographiques visées"),
  excludeZones: (d) => (d ? `une zone à éviter que nous n'avons pas reconnue (${d})` : "les zones à éviter"),
  montagne: () => "l'exigence de montagne",
  reliefProche: () => "la proximité du relief",
  nearSea: () => "la proximité de la mer",
  excludeSea: () => "l'éloignement de la mer",
  // Le lieu est NOMMÉ comme le lecteur l'a posé : « la proximité de la gare Matabiau », jamais
  // « la proximité de Gare Matabiau, Toulouse » (la forme d'index), ni « la proximité d'un lieu ».
  nearPlace: (d) => (d ? `la proximité de ${lieuEnPhrase(d)}` : "la proximité d'un lieu"),
  communeSize: () => "la taille de la commune",
  excludePlace: (d) => (d ? `le fait de quitter ${lieuEnPhrase(d)}` : "les villes à quitter"),
  sizeRelativeTo: (d) => (d ? `la taille relative à ${lieuEnPhrase(d)}` : "la taille relative à une ville"),
};

export function unappliedLabels(r: HardFilterResult): string[] {
  return r.unapplied.map((a) =>
    UNAPPLIED_LABELS[a.key](a.status === "unexamined" ? a.detail : undefined),
  );
}
