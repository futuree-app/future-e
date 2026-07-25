// LES TROIS ÉCHELLES DE LECTURE : territoire, quartier, logement.
//
// C'est la projection qui structurera le rapport payant. Elle se pose ICI, dans le domaine, AVANT toute
// présentation — parce qu'un fait n'appartient pas à un module : il DÉCRIT quelque chose, à une échelle
// donnée, et le rapport le range en conséquence.
//
// POURQUOI PAS LE CHAMP `module` DU FAIT. Il dit d'où vient la donnée (`territoire` / `logement`), pas ce
// qu'elle décrit, et il est binaire : il ne peut pas exprimer l'échelle intermédiaire. Un même phénomène
// traverse les trois — le couvert forestier de la commune (territoire), la distance du logement à la
// lisière (quartier), l'obligation de débroussaillement sur la parcelle (logement) : trois faits
// distincts sur une même question, à trois échelles, et deux d'entre eux n'existent pas encore.
//
// L'ÉCHELLE SE DÉRIVE DU GRAIN DE LA PREUVE, qui est déjà porté par `EvidenceRef.grain` et déjà écrit sur
// les cartes (« À l'échelle de la commune », « À cette adresse »). Rien à inventer : la donnée existe, on
// lui donne son nom et ses invariants.
//
// ÉTAT AU 25/07/2026 : le grain `secteur` n'est émis par AUCUNE règle. Le modèle sait donc déjà nommer
// l'échelle du quartier ; il n'a simplement jamais rien eu à y mettre, parce que les données de
// proximité (l'Autour, l'îlot de chaleur, le confort thermique) ne franchissent pas le moteur. C'est le
// vrai contenu du chantier « quartier » : pas une réorganisation de l'affichage, mais faire entrer une
// échelle dans le moteur de décision.
import type { DecisionFact, EvidenceRef } from "./decision-fact.ts";
import type { FactComposition } from "./fact-composition.ts";

export type Echelle = "territoire" | "quartier" | "logement";

// `unite_urbaine` est du TERRITOIRE, pas du quartier : c'est une maille PLUS LARGE que la commune
// (l'agglomération), jamais plus fine. La confondre avec le voisinage inverserait le sens de lecture.
export const ECHELLE_PAR_GRAIN: Record<EvidenceRef["grain"], Echelle> = {
  commune: "territoire",
  unite_urbaine: "territoire",
  secteur: "quartier",
  adresse: "logement",
};

// LA PREUVE QUI PORTE L'ÉCHELLE. Un compromis n'a pas d'`evidence` propre : ses deux côtés en ont, et ils
// partagent le même grain par construction (ils comparent deux priorités sur le MÊME lieu).
function premierePreuve(fact: DecisionFact): EvidenceRef | undefined {
  return fact.role === "compromise" ? fact.sides[0]?.evidence[0] : fact.evidence[0];
}

// L'ÉCHELLE D'UN FAIT. `null` quand aucune preuve ne la porte : on ne DEVINE pas — un fait sans preuve
// n'a pas d'échelle établie, et le ranger d'office dans « territoire » fabriquerait une appartenance que
// rien ne fonde (le défaut même que cette projection existe pour éviter).
export function echelleDuFait(fact: DecisionFact): Echelle | null {
  const e = premierePreuve(fact);
  return e ? ECHELLE_PAR_GRAIN[e.grain] ?? null : null;
}

// L'ÉCHELLE D'UNE COMPOSITION. Elle vient de ses faits ABSORBÉS, qui partagent le même grain par
// construction du patron ; à défaut (aucun absorbé rendu), de la preuve que la composition porte
// elle-même. Une composition est une carte : elle a une échelle, comme tout ce qu'elle regroupe.
export function echelleDeLaComposition(
  composition: FactComposition, absorbes: DecisionFact[],
): Echelle | null {
  const parAbsorbe = absorbes.map(echelleDuFait).find((x): x is Echelle => x != null);
  if (parAbsorbe) return parAbsorbe;
  const propre =
    composition.kind === "mismatch_with_action" ? composition.evidence[0]
    : composition.kind === "tradeoff" ? composition.unfavorableSide.evidence[0]
    : composition.kind === "grouped_verification" ? composition.items[0]?.evidence[0]
    : composition.sharedEvidence[0];
  return propre ? ECHELLE_PAR_GRAIN[propre.grain] ?? null : null;
}
