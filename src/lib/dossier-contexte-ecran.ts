// ════════════════════════════════════════════════════════════════════════════════════════════
// CE QUE L'ÉCRAN DE CHECKOUT DIT DU CONTEXTE (FUT-10). Lib PURE, testée : les libellés, la synthèse
// d'un projet existant, la phrase qui accompagne un couple de réponses, les boutons, le récapitulatif.
//
// LA LIGNE ÉDITORIALE (revue du 11/10/2026) : le projet n'est pas une formalité avant de payer, c'est la
// clé de lecture du dossier. Les faits sont les mêmes pour tout le monde ; ce qui compte pour le lecteur
// décide de ce qui est mis en avant, rapproché, vérifié. Et ce que les sources ne mesurent pas reste dit.
//
// Le texte d'un dossier non personnalisé se décide ICI, une fois : l'écran ne doit jamais annoncer une
// personnalisation que le moteur ne pourra pas faire, ni promettre qu'une priorité sera évaluée.
// ════════════════════════════════════════════════════════════════════════════════════════════
import type { AddressObjective, AddressRelation } from "./relation-au-lieu.ts";

/** Les choix, dits à la deuxième personne, dans la suite de la question « Vous examinez ce logement… ». */
export const OBJECTIF_LIBELLE: Record<AddressObjective, string> = {
  buy: "Pour l'acheter",
  rent: "Pour le louer",
  understand: "Pour mieux connaître le logement où vous vivez",
  other: "Pour une autre raison",
};

/** Le même objectif, dit comme ce que le dossier prendra en compte. */
export const OBJECTIF_RECAP: Record<AddressObjective, string> = {
  buy: "acheter ce logement",
  rent: "louer ce logement",
  understand: "mieux connaître le logement où vous vivez",
  other: "une autre raison que l'achat ou la location",
};

/** « Préférer ne pas répondre » est un CHOIX affiché, qui enregistre une relation inconnue (`null`). */
export type ChoixRelation = AddressRelation | "sans_reponse";

export const RELATION_LIBELLE: Record<ChoixRelation, string> = {
  lives_here: "Vous y habitez déjà",
  studying: "Vous étudiez ce logement",
  sans_reponse: "Préférer ne pas répondre",
};

const RELATION_RECAP: Record<AddressRelation, string> = {
  lives_here: "vous y habitez déjà",
  studying: "vous étudiez ce logement",
};

/**
 * DEUX EXEMPLES, CLAIREMENT ILLUSTRATIFS : ce qu'une priorité change à la lecture d'une même adresse.
 * Ils ne décrivent aucune adresse réelle, n'affichent aucune valeur et ne simulent aucun verdict. Chacun
 * renvoie à ce que le moteur sait effectivement mettre en avant (mobilité, transports et services ;
 * chaleur projetée, confort d'été du logement et vérifications associées).
 */
export const EXEMPLES_DE_LECTURE: readonly { priorite: string; lecture: string }[] = [
  { priorite: "Vivre sans voiture", lecture: "les transports, les trajets du quotidien et les services à portée passent au premier plan." },
  { priorite: "Rester au frais l'été", lecture: "la chaleur projetée, le comportement du logement et ce qu'il faut vérifier sur place passent au premier plan." },
];

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
 * CE QUE FUTUR•E CONNAÎT DÉJÀ DU PROJET, dit au lecteur pour qu'il ne reparte pas de zéro : l'intention
 * générale, les priorités (dans ses mots, ou leur reformulation), les conditions qu'il a CONFIRMÉES. Rien
 * d'autre : ni la posture (vocabulaire interne), ni une condition suggérée mais non confirmée.
 */
export function syntheseDuProjet(projet: {
  intent?: string | null; rawText?: string | null; parsed?: { reformulation?: string } | null;
} | null, conditionsConfirmees: readonly string[] = []): { intention: string | null; priorites: string | null; conditions: string[] } | null {
  if (!projet) return null;
  const intention = projet.intent === "achat" ? "Vous cherchez à acheter."
    : projet.intent === "location" ? "Vous cherchez à louer." : null;
  return { intention, priorites: projet.parsed?.reformulation ?? projet.rawText ?? null, conditions: [...conditionsConfirmees] };
}

/**
 * LE BOUTON QUI PASSE. Il ne dit pas la même chose selon qu'un projet existe :
 *   - projet renseigné : on garde le projet, on ne précise rien de plus pour ce logement ;
 *   - aucun projet : le dossier ne sera pas personnalisé, et la conséquence est dite à côté.
 * « Continuer sans répondre » laissait croire, au premier cas, qu'un projet conservé serait ignoré.
 */
export function boutonPasser(projetRenseigne: boolean): { libelle: string; consequence: string | null } {
  return projetRenseigne
    ? { libelle: "Continuer sans préciser davantage", consequence: null }
    : {
        libelle: "Continuer sans personnaliser mon dossier",
        consequence: "Le dossier présentera alors les faits sur ce logement et sa commune, sans les rapprocher de vos priorités.",
      };
}

/**
 * LE RÉCAPITULATIF AVANT PAIEMENT : ce que le dossier prendra en compte, puis ce qu'il en fera, dit
 * sans promesse. Chaque ligne dit ce qui sera utilisé, ou qu'il n'y a rien. `limite` n'est rempli que
 * si le dossier ne pourra PAS évaluer la correspondance avec des priorités.
 */
export function recapitulatif(input: {
  objectif: AddressObjective | null;
  relation: ChoixRelation | null;
  /** Ce que le projet dit de ce qui compte, tel qu'il sera utilisé, ou `null`. */
  priorites: string | null;
  /** Le texte vient d'être enregistré mais le parseur n'en a rien tiré. */
  prioritesIncomprises: boolean;
}): { titre: string; lignes: { libelle: string; valeur: string }[]; usage: string | null; limite: string | null } {
  const relation = relationDuChoix(input.relation);
  const lignes = [
    { libelle: "Votre projet", valeur: input.priorites ?? "Aucun projet décrit" },
    { libelle: "Votre objectif", valeur: input.objectif ? OBJECTIF_RECAP[input.objectif] : "non précisé" },
    { libelle: "Votre situation", valeur: relation ? RELATION_RECAP[relation] : "non précisée" },
  ];
  if (!input.priorites) {
    return {
      titre: "Votre dossier",
      lignes,
      usage: null,
      limite: "Sans projet décrit, ce dossier présentera le logement, ses alentours et sa commune, sans pouvoir juger s'il correspond à vos priorités. Vous pourrez décrire votre projet plus tard depuis votre dossier.",
    };
  }
  return {
    titre: "Votre dossier prendra en compte",
    lignes,
    usage: "futur•e rapprochera ces éléments des informations documentées sur le logement, ses alentours et sa commune. Une priorité que nos sources ne mesurent pas sera signalée comme telle.",
    limite: input.prioritesIncomprises
      ? "Votre texte est enregistré, mais nous n'avons pas pu en extraire vos priorités. Le dossier le signalera, et vous pourrez le reformuler depuis votre dossier."
      : null,
  };
}
