// ════════════════════════════════════════════════════════════════════════════════════════════
// CE QUE L'ÉCRAN DE CHECKOUT DIT DU CONTEXTE (FUT-10). Lib PURE, testée : les libellés, la phrase qui
// accompagne un couple de réponses, le récapitulatif avant paiement, et ce qui part au serveur.
//
// Le texte d'un dossier non personnalisé se décide ICI, une fois : l'écran ne doit jamais annoncer
// une personnalisation que le moteur ne pourra pas faire.
// ════════════════════════════════════════════════════════════════════════════════════════════
import type { AddressObjective, AddressRelation } from "./relation-au-lieu.ts";

export const OBJECTIF_LIBELLE: Record<AddressObjective, string> = {
  buy: "Pour l'acheter",
  rent: "Pour le louer",
  understand: "Pour mieux connaître le logement où je vis",
  other: "Pour une autre raison",
};

/** « Préférer ne pas répondre » est un CHOIX affiché, qui enregistre une relation inconnue (`null`). */
export type ChoixRelation = AddressRelation | "sans_reponse";

export const RELATION_LIBELLE: Record<ChoixRelation, string> = {
  lives_here: "Vous y habitez déjà",
  studying: "Vous étudiez ce logement",
  sans_reponse: "Préférer ne pas répondre",
};

/** La phrase qui accompagne le couple objectif / relation, quand il y a quelque chose à dire. */
export function noteDuCouple(objectif: AddressObjective | null, relation: ChoixRelation | null): string | null {
  if (objectif === "understand" && relation === "studying") {
    return "Ces deux réponses se contredisent : tant qu'elles le font, le dossier ne supposera ni que vous y vivez, ni que vous vous apprêtez à vous engager.";
  }
  if (objectif === "understand" && relation == null) {
    return "Vous avez indiqué vivre dans ce logement. Vous pouvez le confirmer ci-dessus, rien n'est coché à votre place.";
  }
  if (objectif === "buy" && relation === "lives_here") {
    return "Vous y habitez et vous envisagez de l'acheter : le dossier garde les deux et vous présente les vérifications utiles avant un achat.";
  }
  if (objectif === "rent" && relation === "lives_here") {
    return "Vous y habitez et vous envisagez de le louer : le dossier garde les deux et vous présente les vérifications utiles avant un bail.";
  }
  return null;
}

/** La relation à envoyer : « préférer ne pas répondre » et l'absence de réponse valent toutes deux inconnue. */
export function relationDuChoix(c: ChoixRelation | null): AddressRelation | null {
  return c === "lives_here" || c === "studying" ? c : null;
}

/**
 * LE RÉCAPITULATIF AVANT PAIEMENT. Chaque ligne dit ce qui sera utilisé, ou qu'il n'y a rien.
 * `limite` n'est rempli que si le dossier ne pourra PAS évaluer la correspondance avec des priorités :
 * aucune promesse de personnalisation sans projet qui la porte.
 */
export function recapitulatif(input: {
  objectif: AddressObjective | null;
  relation: ChoixRelation | null;
  /** Ce que le projet dit de ce qui compte, tel qu'il sera utilisé, ou `null`. */
  priorites: string | null;
  /** Un projet existe-t-il au compte (même sans texte) ? */
  projetExiste: boolean;
  /** Le texte vient d'être enregistré mais le parseur n'en a rien tiré. */
  prioritesIncomprises: boolean;
}): { lignes: { libelle: string; valeur: string }[]; limite: string | null } {
  const lignes = [
    { libelle: "Ce logement", valeur: input.objectif ? OBJECTIF_LIBELLE[input.objectif] : "Raison non précisée" },
    {
      libelle: "Votre lien",
      valeur: input.relation === "lives_here" || input.relation === "studying" ? RELATION_LIBELLE[input.relation] : "Non précisé",
    },
    { libelle: "Ce qui compte", valeur: input.priorites ?? "Rien de décrit" },
  ];
  let limite: string | null = null;
  if (!input.priorites) {
    limite = "Sans projet décrit, ce dossier présentera le logement, ses alentours et sa commune, sans pouvoir juger s'il correspond à vos priorités. Vous pourrez décrire votre projet plus tard depuis votre dossier.";
  } else if (input.prioritesIncomprises) {
    limite = "Votre texte est enregistré, mais nous n'avons pas pu en extraire vos priorités. Le dossier le signalera, et vous pourrez le reformuler depuis votre dossier.";
  }
  return { lignes, limite };
}
