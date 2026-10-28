// LES PHRASES DE LA FIBRE À L'ADRESSE (FUT-156). Pur et testé : le composant ne fait que les poser.
//
// Deux réponses distinctes, jamais fondues : l'ÉTAT du bâtiment (cartefibre) et le NOMBRE d'opérateurs qui y
// déclarent une offre fibre (Ma connexion internet). Puis une limite (le bâtiment n'est pas le logement) et
// la vérification qui engage (Ma connexion internet, puis un test chez un opérateur). La méthode et les
// définitions vont dans le dépliable.
//
// Interdits, testés : « éligible » dit du logement, « 0 opérateur » quand le nombre n'est pas établi,
// « sans Internet », un nom d'opérateur, un débit, un prix.

import { ECART_DOUTEUX_M, type LectureFibre, type OperateursFibre } from "./fibre-adresse.ts";

export const URL_MA_CONNEXION_INTERNET = "https://maconnexioninternet.arcep.fr/";

export type TexteFibre = {
  /** Ce qu'il faut retenir : l'état du bâtiment, avec sa date. */
  etat: string;
  /** Le nombre d'opérateurs, s'il y a un état certain. */
  operateurs?: string;
  /** La limite qui conditionne la lecture (le bâtiment n'est pas le logement, ou ce qui empêche de conclure). */
  limite: string;
  /** Le geste qui engage. */
  verifier: string;
  /** La marge : la valeur retenue et sa source. */
  marge: { valeur: string; operateurs?: string; source: string; date?: string };
  /** Le dépliable. */
  savoirPlus: string[];
};

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** `2026-06-30` -> `30 juin 2026`. */
export function dateLongue(iso: string | undefined): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  return m ? `${Number(m[3])}${m[3] === "01" ? "er" : ""} ${MOIS[Number(m[2]) - 1]} ${m[1]}` : null;
}

/** `2026T2` -> `T2 2026`. */
function trimestre(millesime: string | undefined): string | null {
  const m = /^(\d{4})T([1-4])$/.exec(millesime ?? "");
  return m ? `T${m[2]} ${m[1]}` : null;
}

function leBatiment(l: LectureFibre): string {
  return l.batiments && l.batiments > 1 ? `les ${l.batiments} bâtiments associés à cette adresse` : "le bâtiment associé à cette adresse";
}

function phraseOperateurs(o: OperateursFibre | undefined, plusieurs: boolean): string | undefined {
  if (!o) return undefined;
  if (o.etat === "non_etabli") return "Le nombre d'opérateurs qui y déclarent une offre fibre n'est pas établi.";
  if (o.etat === "plage") return `Selon le bâtiment, ${o.min} à ${o.max} opérateurs déclarent une offre fibre.`;
  if (o.n === 0) return plusieurs ? "Aucun opérateur ne déclare encore d'offre fibre pour ces bâtiments." : "Aucun opérateur ne déclare encore d'offre fibre pour ce bâtiment.";
  const pour = plusieurs ? "pour chacun de ces bâtiments" : "pour ce bâtiment";
  return o.n === 1 ? `1 opérateur déclare une offre fibre ${pour}.` : `${o.n} opérateurs déclarent une offre fibre ${pour}.`;
}

function margeOperateurs(o: OperateursFibre | undefined): string | undefined {
  if (!o) return undefined;
  if (o.etat === "non_etabli") return "opérateurs : non établi";
  if (o.etat === "plage") return `${o.min} à ${o.max} opérateurs`;
  return o.n === 0 ? "aucune offre fibre déclarée" : `${o.n} opérateur${o.n > 1 ? "s" : ""}`;
}

const LIMITE_BATIMENT = "C'est l'état du bâtiment, pas celui d'un logement précis : le raccordement d'un appartement ou d'une maison reste à vérifier.";

const LIMITE_MOTIF: Record<NonNullable<LectureFibre["motif"]>, (l: LectureFibre) => string> = {
  etats_divergents: (l) => `Plusieurs bâtiments sont associés à cette adresse et leurs états diffèrent${l.etatsDivergents?.length ? ` (${l.etatsDivergents.join(", ")})` : ""}.`,
  batiment_eloigne: () => `Le bâtiment que l'Arcep associe à cette adresse se trouve à plus de ${ECART_DOUTEUX_M} mètres de son emplacement : son état n'est pas repris.`,
  sans_donnee_fibre: () => "L'adresse figure dans les fichiers de l'Arcep, mais aucun bâtiment n'y est recensé pour la fibre.",
  non_rattachee: () => "Aucun bâtiment des fichiers de l'Arcep n'est associé à cette adresse. C'est fréquent pour une adresse récente, ou un numéro avec indice (bis, ter).",
  etat_non_publie: () => "Le bâtiment associé à cette adresse n'a pas d'état de déploiement publié.",
  abandonne: () => "Le bâtiment associé à cette adresse est marqué « abandonné » sur la carte des déploiements.",
};

const VERIFIER = "Avant de vous engager, vérifiez l'adresse exacte sur Ma connexion internet (Arcep), puis faites un test d'éligibilité chez un opérateur : lui seul confirme qu'un abonnement est possible pour ce logement.";

const DEFINITIONS = [
  "Déployé : la fibre arrive jusqu'au bâtiment ; un opérateur peut y proposer un abonnement.",
  "Raccordable sur demande : le bâtiment n'est raccordé qu'à la demande d'un opérateur, dans un délai de six mois au plus.",
  "En cours de déploiement : les travaux sont engagés ; le bâtiment n'est pas encore raccordable.",
  "Études réalisées : le bâtiment fait partie d'un projet de déploiement ; aucun délai n'est publié.",
];

/** Les phrases d'une lecture. `null` : rien à afficher (rapport antérieur à FUT-156, ou lecture non activée). */
export function texteFibre(l: LectureFibre | null | undefined): TexteFibre | null {
  if (!l) return null;
  const date = dateLongue(l.donneesAu);
  const t = trimestre(l.millesime);
  const au = date ? `, au ${date}` : "";
  const source = `Arcep${t ? ` · ${t}` : ""}`;
  const margeDate = date ? `données au ${date}` : undefined;
  const plusieurs = (l.batiments ?? 1) > 1;

  if (l.statut === "indisponible") {
    return {
      etat: "Fibre non vérifiée : les données de l'Arcep n'ont pas pu être lues lors de la collecte de ce dossier.",
      limite: "Ce n'est pas une absence de fibre. Actualiser les données relancera la lecture.",
      verifier: VERIFIER,
      marge: { valeur: "non vérifiée", source },
      savoirPlus: [],
    };
  }

  const methode = [
    `Sources : Arcep, carte des déploiements de la fibre (état de chaque bâtiment) et Ma connexion internet (offres déclarées par les opérateurs)${date ? `, données au ${date}` : ""}.`,
    l.rattachement === "libelle"
      ? "Rattachement : par le libellé exact de l'adresse (commune, numéro, voie), le bâtiment n'ayant pas d'identifiant d'adresse dans les fichiers de l'Arcep."
      : "Rattachement : par l'identifiant de l'adresse dans la Base adresse nationale, tel que l'Arcep l'associe au bâtiment.",
    "Aucune information n'est reprise d'un bâtiment voisin.",
  ];

  if (l.statut === "a_verifier") {
    return {
      etat: "Raccordement à vérifier : les données disponibles ne permettent pas de déterminer avec certitude le statut de cette adresse.",
      limite: LIMITE_MOTIF[l.motif ?? "non_rattachee"](l),
      verifier: VERIFIER,
      marge: { valeur: "à vérifier", source, date: margeDate },
      savoirPlus: [
        ...methode.filter((_, i) => i !== 1 || l.motif !== "non_rattachee"),
        `Un bâtiment situé à plus de ${ECART_DOUTEUX_M} mètres du point de l'adresse, ou plusieurs bâtiments d'états différents, suffisent à ne rien conclure.`,
      ],
    };
  }

  const qui = leBatiment(l);
  const etat: Record<Exclude<LectureFibre["statut"], "indisponible" | "a_verifier">, string> = {
    deploye: `Selon l'Arcep, la fibre est indiquée comme déployée pour ${qui}${au}.`,
    raccordable_demande: `Selon l'Arcep, ${qui} ${plusieurs ? "sont raccordables" : "est raccordable"} à la fibre sur demande${au} : le raccordement n'est fait qu'à la demande d'un opérateur, en six mois au plus.`,
    raccordable_demande_en_cours: `Selon l'Arcep, un raccordement à la fibre a été demandé pour ${qui}, et il est en cours${au}.`,
    en_cours: `Selon l'Arcep, le déploiement de la fibre est en cours pour ${qui}${au} : ${plusieurs ? "ils ne sont" : "il n'est"} pas encore raccordable${plusieurs ? "s" : ""}.`,
    etudes: `Selon l'Arcep, ${qui} ${plusieurs ? "font" : "fait"} partie d'un projet de déploiement de la fibre (études réalisées)${au} : ${plusieurs ? "ils ne sont" : "il n'est"} pas encore raccordable${plusieurs ? "s" : ""}.`,
  };
  const valeur: Record<keyof typeof etat, string> = {
    deploye: "fibre déployée", raccordable_demande: "raccordable sur demande", raccordable_demande_en_cours: "raccordement en cours",
    en_cours: "déploiement en cours", etudes: "études réalisées",
  };
  return {
    etat: etat[l.statut],
    operateurs: phraseOperateurs(l.operateurs, plusieurs),
    limite: LIMITE_BATIMENT,
    verifier: VERIFIER,
    marge: { valeur: valeur[l.statut], operateurs: margeOperateurs(l.operateurs), source, date: margeDate },
    savoirPlus: [
      ...methode,
      "Opérateurs comptés : ceux qui déclarent à l'Arcep une offre fibre pour ce bâtiment, chacun une seule fois, quels que soient leurs offres et leurs débits. Ce n'est pas un comparatif : ni noms, ni prix, ni débits.",
      ...(l.etatOfficiel ? [`État officiel : ${l.etatOfficiel === "cible" ? "« cible »" : "« signé »"}, que la carte de l'Arcep range sous « études réalisées ».`] : []),
      ...DEFINITIONS,
    ],
  };
}
