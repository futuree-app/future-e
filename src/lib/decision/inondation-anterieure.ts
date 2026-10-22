// ════════════════════════════════════════════════════════════════════════════════════════════
// UNE ANALYSE FIGÉE AVANT FUT-127 PEUT RESTER TROMPEUSE SUR L'INONDATION. ON LE DIT, ON NE RÉÉCRIT RIEN.
//
// Un artefact `engine-6` ou antérieur porte, tel qu'il a été vendu, l'une de deux lectures que le moteur
// courant a retirées (FUT-127, engine-7) :
//
//   exposition_elevee  « L'exposition de la commune à l'inondation ressort élevée », tirée du seul rang
//                      du compte de reconnaissances CatNat (4 reconnaissances suffisaient) ;
//   frequence_faible   la priorité « faible risque d'inondation » comptée FAVORABLE parce que la commune
//                      avait peu de reconnaissances, alors qu'un faible compte ne démontre rien.
//
// L'arbitrage du porteur (22/10/2026) : ne réécrire aucun artefact, et contextualiser de façon visible et
// testée. La reconnaissance se fait AU CONTENU, pas à la version : ces deux lectures n'existent que dans
// des artefacts antérieurs, et la page n'a pas à faire descendre la version jusqu'ici pour les voir.
// Un artefact `engine-7` ne les porte jamais (la règle ne rend plus `satisfied`, et ne dit plus « élevée ») :
// la fonction rend alors `null`. Pur, testé sous `node --test`.
// ════════════════════════════════════════════════════════════════════════════════════════════
import type { DecisionFact, Dossier } from "./decision-fact.ts";

const RULE_INOND = "territoire.inondation-exposition";
const RULE_INOND_LECTURE = "territoire.inondation-lecture";

export type LectureInondationAnterieure = {
  motif: "exposition_elevee" | "frequence_faible";
  texte: string;
};

function tousLesFaits(d: Dossier): DecisionFact[] {
  return [
    ...d.sections.flatMap((s) => s.cards.flatMap((c) => (c.kind === "fact" ? [c.fact] : []))),
    ...d.absorbedFacts,
  ];
}

const EXPOSITION_ELEVEE = /exposition de la commune à l'inondation ressort élevée/;

const TEXTE: Record<LectureInondationAnterieure["motif"], string> = {
  exposition_elevee:
    "Cette analyse a été produite avec une version antérieure de la lecture des inondations. Elle qualifiait l'exposition de la commune à partir du nombre de reconnaissances de catastrophe naturelle. "
    + "Ce nombre retrace des décisions d'indemnisation : il n'indique ni la probabilité d'une inondation, ni la part du territoire exposée. "
    + "futur•e lit désormais les plans de prévention de la commune et le zonage de l'adresse. L'analyse ci-dessous reste celle qui vous a été remise ; une nouvelle analyse appliquerait la lecture actuelle.",
  frequence_faible:
    "Cette analyse a été produite avec une version antérieure de la lecture des inondations. Elle jugeait votre priorité « un faible risque d'inondation » favorable parce que la commune comptait peu de reconnaissances de catastrophe naturelle. "
    + "Un faible nombre de reconnaissances ne démontre pas une faible exposition. "
    + "futur•e lit désormais les plans de prévention de la commune et le zonage de l'adresse. L'analyse ci-dessous reste celle qui vous a été remise ; une nouvelle analyse appliquerait la lecture actuelle.",
};

export function lectureInondationAnterieure(d: Dossier | null | undefined): LectureInondationAnterieure | null {
  if (!d) return null;
  if (tousLesFaits(d).some((f) => "statement" in f && typeof f.statement === "string" && EXPOSITION_ELEVEE.test(f.statement))) {
    return { motif: "exposition_elevee", texte: TEXTE.exposition_elevee };
  }
  const critere = d.criteria?.registry?.find((c) => c.criterionKey === "faible_risque_inondation");
  if (critere && critere.outcome === "favorable"
    && critere.ruleIds.includes(RULE_INOND) && !critere.ruleIds.includes(RULE_INOND_LECTURE)) {
    return { motif: "frequence_faible", texte: TEXTE.frequence_faible };
  }
  return null;
}
