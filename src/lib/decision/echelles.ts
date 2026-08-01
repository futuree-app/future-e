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

// ANCRE ET SUPPORT, RÉSOLU LE 28/07/2026.
//
// `grain` dit L'ANCRE DU CALCUL : d'où la mesure est prise. Il ne suffit pas à ranger un fait, parce que
// l'ancre et le SUPPORT du constat divergent dès qu'on mesure une RELATION. Les deux coïncident pour une
// surface (le grand-IRIS de l'îlot de chaleur) et pour un attribut du bâtiment (le DPE) ; ils divergent
// pour une distance : « la gare est à 8 minutes » est ancrée sur l'adresse — c'est de là qu'on mesure —
// mais décrit l'ENVIRONNEMENT, pas le logement. `hard-constraint-rules` pose `grain: "adresse"` dès qu'un
// point d'adresse existe : sans correctif, ces faits partaient dans « logement ».
//
// LA SOLUTION N'EST PAS UNE EXCEPTION PAR RÈGLE — ce serait rétablir l'appartenance que cette projection
// existe pour supprimer. C'est une DEUXIÈME PROPRIÉTÉ DE LA PREUVE : `relation` dit ce que la mesure
// établit (un attribut du lieu, ou une proximité à autre chose), et l'échelle se dérive du couple.
// Une règle déclare ce qu'elle mesure ; elle ne choisit toujours pas son module.
//
// ⚠ `relation` N'EST PAS « LA PREUVE EST-ELLE UN RAYON ». Un rayon peut porter sur l'environnement (les
// équipements, une infrastructure bruyante) ou sur l'INTÉGRITÉ DU BIEN (une cavité souterraine recensée
// à 300 m, un mouvement de terrain). Les seconds restent des attributs du logement : les basculer en
// « quartier » parce que leur preuve est une distance, ce serait faire suivre au fait la FORME de sa
// preuve au lieu de sa NATURE pour le lecteur — ce que la doctrine interdit explicitement.
//
// Le test : est-ce que le constat parle de ce que le lecteur VIVRA AUTOUR (trajets, services, bruit,
// chaleur du quartier), ou de ce qui ATTEINT SON BIEN (sol, bâti, réglementation de la parcelle) ?

// `unite_urbaine` est du TERRITOIRE, pas du quartier : c'est une maille PLUS LARGE que la commune
// (l'agglomération), jamais plus fine. La confondre avec le voisinage inverserait le sens de lecture.
export const ECHELLE_PAR_GRAIN: Record<EvidenceRef["grain"], Echelle> = {
  commune: "territoire",
  unite_urbaine: "territoire",
  secteur: "quartier",
  adresse: "logement",
};

// L'ÉCHELLE D'UNE PREUVE : son ancre, corrigée par ce qu'elle mesure.
//
// Une proximité mesurée DEPUIS une adresse décrit le voisinage, donc le quartier — jamais le logement.
// Depuis une commune, elle reste du territoire : le centroïde communal ne décrit aucun voisinage réel
// (c'est ce que la règle « bruit » dit déjà au lecteur dans sa `limitation`).
export function echelleDeLaPreuve(evidence: EvidenceRef): Echelle | null {
  const base = ECHELLE_PAR_GRAIN[evidence.grain] ?? null;
  if (base === "logement" && evidence.relation === "proximite") return "quartier";
  return base;
}

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
  return e ? echelleDeLaPreuve(e) : null;
}

// LE NOM DE L'ÉCHELLE POUR LE LECTEUR, et un piège de vocabulaire à ne jamais rejouer.
//
// `Echelle` vaut `territoire | quartier | logement`, où `quartier` désigne LE SECTEUR. Dans
// `PRODUCT_MODULES`, le module d'`id: "quartier"` s'appelle « Territoire », et le secteur s'appelle
// « Autour de l'adresse » (`id: "autour"`). Le même mot désigne donc deux choses opposées selon le
// vocabulaire qu'on lit : ranger un fait de secteur sous un titre « Quartier » l'enverrait, pour le
// lecteur, à l'échelle de la commune.
//
// La correspondance vit ICI, en une seule fonction, testée. Nulle part ailleurs.
export const NOM_ECHELLE: Record<Echelle, string> = {
  territoire: "Territoire",
  quartier: "Autour de l'adresse",
  logement: "Logement",
};

/** Du plus large au plus précis : l'ordre de lecture d'un dossier. */
export const ORDRE_ECHELLES: Echelle[] = ["territoire", "quartier", "logement"];

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
  return propre ? echelleDeLaPreuve(propre) : null;
}
