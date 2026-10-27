// ════════════════════════════════════════════════════════════════════════════════════════════
// CE QUE L'ÉCRAN MONTRE DES DIAGNOSTICS D'UNE ADRESSE, ET DANS QUEL ORDRE (FUT-68, 06/10/2026).
//
// LE PROBLÈME. À 34 diagnostics, le bloc posait 34 lignes au premier niveau, puis seulement après
// le refus (« aucun de ces diagnostics »), le numéro du document et le diagnostic d'immeuble. Une
// étape de désambiguïsation devenait le contenu principal du module Logement, et le refus, qui est
// une réponse aussi légitime que le choix, arrivait au bout d'une liste qu'on n'a pas envie de finir.
//
// CE QUI NE CHANGE PAS, et c'est la frontière de ce fichier :
//   - l'ATTRIBUTION (`dpeAttributionStatus`) : qui est retenu automatiquement, et pourquoi ;
//   - l'ORDRE (`sortCandidates`) : identifiables d'abord, puis surface croissante. Il n'est pas un
//     classement de plausibilité, et l'écran le dit ;
//   - les CANDIDATS : aucun n'est retiré, fusionné ni caché sans un geste pour le voir.
//
// Ce fichier ne décide que de la PRÉSENTATION. Pur, testé sous `node --test`.
// ════════════════════════════════════════════════════════════════════════════════════════════

import type { DpeLabel, DpeRecord } from "./dpe-attribution.ts";
import { isCollective } from "./dpe-address-context.ts";
import { issuDesDonneesDeLImmeuble } from "./dpe-grain.ts";
import { candidateIdentifier, isUnidentifiable, matchesQuery, meaningfulFloor } from "./dpe-candidate-match.ts";
import { contreditParLeBatiment, mentionContradiction, voieDuLibelle } from "./batiment-rnb.ts";

/**
 * FUT-80 : CE QUE LA LIGNE DOIT SAVOIR DU DOSSIER pour dire ce qui la distingue. Absent, la ligne est
 * exactement celle d'avant.
 *   - `banId` : l'adresse du dossier. Une ligne enregistrée ailleurs le dit, avec son adresse.
 *   - `batiments` : les ID-RNB de l'adresse. Une ligne rattachée à un autre bâtiment (par son
 *     diagnostiqueur ou par la base) le dit aussi : ce n'est pas un refus, c'est un fait à voir.
 */
export type ContexteLigne = { banId?: string | null; batiments?: readonly string[] };

/**
 * AU-DELÀ DE CE NOMBRE, LA LISTE NE S'AFFICHE PLUS D'EMBLÉE. C'EST UN SEUIL D'ÉCRAN, PAS UNE RÈGLE
 * MÉTIER : il ne dit rien de la fiabilité des diagnostics, seulement de ce qu'un regard parcourt.
 *
 * Six lignes, parce que c'est ce que la boîte de défilement de l'ancien sélecteur (420 px, lignes
 * de ~60 px) montrait sans défiler : au-delà, le lecteur faisait déjà défiler une liste dans la page,
 * ce qui est le pire geste sur un téléphone. Il sert deux fois, et c'est délibéré :
 *   - jusqu'à six, la liste EST la question et s'affiche entière, comme avant ;
 *   - au-delà, le premier niveau résume l'adresse, et la liste ouverte en montre six d'abord.
 */
export const APERCU_CANDIDATS = 6;

/** La liste est-elle repliée derrière un résumé et un geste « Identifier mon logement » ? */
export function listeRepliee(total: number): boolean {
  return total > APERCU_CANDIDATS;
}

/**
 * LES CHAMPS QUI DISTINGUENT, ET SEULEMENT EUX.
 *
 * Le type de logement et l'année de construction sont le plus souvent les mêmes pour tout un
 * immeuble : les répéter sur trente lignes n'aide à en choisir aucune. Ils ne s'affichent que
 * lorsqu'ils VARIENT entre les diagnostics de l'adresse, et alors ils aident vraiment (une maison
 * et un appartement à la même adresse, deux bâtiments d'époques différentes).
 */
export type ChampsVariables = { type: boolean; construction: boolean };

export function champsVariables(candidates: DpeRecord[]): ChampsVariables {
  const distincts = (vals: Array<string | number | null>) =>
    new Set(vals.filter((v) => v != null && String(v).trim() !== "").map((v) => String(v).trim().toLowerCase())).size;
  return {
    type: distincts(candidates.map((c) => c.type_batiment)) >= 2,
    construction: distincts(candidates.map((c) => c.annee_construction)) >= 2,
  };
}

function m2(v: number): string {
  return (Math.round(v * 10) / 10).toString().replace(".", ",");
}

export type LigneCandidat = {
  id: string;
  /** Ce qui identifie le logement : le complément d'adresse saisi par le diagnostiqueur. */
  titre: string;
  /** `false` quand le titre dit l'absence d'identifiant : il s'affiche en retrait. */
  identifie: boolean;
  /**
   * Un diagnostic de l'immeuble entier, qui ne décrit pas un logement en particulier. Depuis FUT-74,
   * une telle ligne n'entre plus dans la liste à reconnaître (`AddressDiagnosticsBlock`) : le champ
   * reste vrai pour qu'aucun appelant ne puisse la présenter comme celle d'un logement.
   */
  immeuble: boolean;
  /** Les repères secondaires, du plus utile pour reconnaître au résultat énergétique. */
  details: string[];
  /** Le résultat, posé à part et en retrait : il n'est pas un critère de reconnaissance. */
  classe: DpeLabel | null;
  /**
   * FUT-143 : le diagnostic désigne un autre bâtiment que ceux de l'adresse. Le clic n'écrit plus : il
   * ouvre l'explication, et seul un second geste retient la ligne. Même règle que `contreditParLeBatiment`,
   * celle du serveur : un `id_rnb` absent ou un bâtiment inconnu ne contredit rien.
   */
  contredit: boolean;
  /** Ce que lit un lecteur d'écran : le geste ET ce qu'il porte. */
  libelleAccessible: string;
};

/**
 * UNE LIGNE : identification du logement > caractéristiques qui distinguent > résultat.
 *
 * La date du diagnostic s'écrit « DPE 2025 » et non « 2025 » seul : à côté d'une année de
 * construction, une année nue ne dit pas de quoi elle est l'année.
 */
export function ligneCandidat(c: DpeRecord, champs: ChampsVariables, contexte: ContexteLigne = {}): LigneCandidat {
  const ident = candidateIdentifier(c);
  const immeuble = isCollective(c);
  const titre = ident ?? (immeuble ? "Immeuble entier" : "Sans identifiant de logement");

  const details: string[] = [];
  // FUT-80 : où il est enregistré, EN PREMIER, quand ce n'est pas l'adresse du dossier : c'est ce qui
  // sépare cette ligne de toutes celles de l'adresse, et ce qui permet de la reconnaître ou de l'écarter.
  if (contexte.banId && c.id_ban !== contexte.banId) {
    details.push(`enregistré au ${voieDuLibelle(c.adresse) ?? "une autre adresse"}`);
  }
  const contredit = contreditParLeBatiment(c, contexte.batiments);
  if (contredit) details.push(mentionContradiction(c));
  if (immeuble) details.push("diagnostic de l'immeuble");
  // FUT-74 (D6) : un DPE de logement établi à partir des données de l'immeuble le dit, et la visite
  // manquante se dit seulement quand l'ADEME la renseigne. Ni l'un ni l'autre ne le disqualifie.
  if (!immeuble && issuDesDonneesDeLImmeuble(c)) {
    details.push(c.appartement_non_visite === true
      ? "appartement non visité, établi à partir des données de l'immeuble"
      : "établi à partir des données de l'immeuble");
  }
  // Le type d'une ligne d'immeuble est « immeuble » : le marqueur ci-dessus le dit déjà.
  if (champs.type && c.type_batiment && !immeuble) details.push(c.type_batiment);
  if (c.surface_m2 != null) details.push(`${m2(c.surface_m2)} m²`);
  const etage = meaningfulFloor(c.etage);
  if (etage) details.push(`étage ${etage}`);
  if (champs.construction && c.annee_construction != null) details.push(`construit en ${c.annee_construction}`);
  if (c.date_dpe) details.push(`DPE ${c.date_dpe.slice(0, 4)}`);

  const classe = c.etiquette_dpe;
  const lu = [titre, ...details, classe ? `classe ${classe}` : null].filter(Boolean).join(", ");
  return {
    id: c.id_dpe, titre, identifie: ident !== null || immeuble, immeuble, details, classe, contredit,
    libelleAccessible: contredit
      ? `Retenir ce diagnostic pour ce logement, après confirmation : ${lu}`
      : `Retenir ce diagnostic pour ce logement : ${lu}`,
  };
}

/**
 * CE QUI EST VISIBLE DE LA LISTE, ET COMBIEN RESTE À DÉPLIER.
 *
 * L'ordre reçu est conservé tel quel. Sans recherche, la liste en montre `APERCU_CANDIDATS`, puis
 * tout sur demande. Une recherche montre TOUTES ses correspondances : quelqu'un qui a tapé « B105 »
 * ou « 43 » cherche une ligne précise, et la lui cacher derrière un second geste serait absurde.
 * Rien n'est jamais retiré : `masques` dit combien de lignes attendent derrière le bouton.
 */
export function decouperListe(
  ordered: DpeRecord[],
  query: string,
  toutVoir: boolean,
): { visibles: DpeRecord[]; masques: number; correspondances: number } {
  const filtres = ordered.filter((c) => matchesQuery(c, query));
  const recherche = query.trim().length > 0;
  const visibles = recherche || toutVoir ? filtres : filtres.slice(0, APERCU_CANDIDATS);
  return { visibles, masques: filtres.length - visibles.length, correspondances: filtres.length };
}

/** Combien de diagnostics portent de quoi être reconnus (identifiant ou étage). */
export function compterIdentifiables(candidates: DpeRecord[]): number {
  return candidates.filter((c) => !isUnidentifiable(c)).length;
}

/**
 * LA PHRASE QUI DIT POURQUOI LE DOUTE EXISTE, et donc ce qui permettra de le lever.
 *
 * Elle parle de l'adresse, jamais du logement : « 31 portent un identifiant de logement » dit ce que le lecteur
 * pourra reconnaître, pas lequel est le sien.
 */
export function phraseIdentifiables(identifiables: number, total: number): string {
  if (identifiables === 0) {
    return total === 1
      ? "Il ne porte ni identifiant de logement ni étage : il ne peut pas être reconnu de l'extérieur."
      : "Aucun ne porte d'identifiant de logement ni d'étage : ils ne peuvent pas être reconnus de l'extérieur.";
  }
  if (identifiables === total) return "Chacun porte un identifiant de logement ou un étage.";
  return `${identifiables} sur ${total} portent un identifiant de logement ou un étage.`;
}

/**
 * L'OUVERTURE D'UNE LISTE REPLIÉE : combien, et pourquoi le lecteur doit aider. Rien d'autre.
 *
 * Le premier niveau portait aussi « 31 sur 34 portent un identifiant » et « classes observées de C à
 * F, réalisés entre 2023 et 2025 » : un calcul à faire, et la classe remise au centre d'un écran
 * dont le geste est de RECONNAÎTRE un logement. La liste ouverte montre elle-même ce que chaque
 * diagnostic porte ; les bornes restent dans le bloc secondaire, sous les gestes.
 */
export function phrasesOuvertureRepliee(total: number, deLogement = false): { titre: string; aide: string } {
  return {
    // FUT-74 : `total` compte les diagnostics DE LOGEMENT ; « de logement » se dit quand l'immeuble
    // a aussi le sien, pour que le compte ne se lise pas comme celui de toute l'adresse.
    titre: `${total} diagnostics${deLogement ? " de logement" : ""} sont enregistrés à cette adresse.`,
    aide: "futur•e ne peut pas savoir lequel correspond à ce logement sans votre aide.",
  };
}

/**
 * LA SAISIE PAR NUMÉRO, dite comme une question et non comme une explication. L'ancienne phrase
 * (« Il retrouve aussi les diagnostics enregistrés à une entrée voisine… ») avait un « il » ambigu
 * et expliquait un cas technique avant l'action. Ce cas vit désormais dans l'aide du champ, et il
 * est exact : `dpe-rapprochement.ts` accepte le niveau « bâtiment » (même numéro, même voie) et,
 * depuis FUT-80, « même bâtiment » (autre adresse que le référentiel rattache au même bâtiment).
 */
export const SAISIE_NUMERO = {
  question: "Vous avez le numéro du DPE ?",
  aide: "La recherche par numéro peut aussi retrouver un diagnostic enregistré sous une autre entrée du même bâtiment.",
} as const;

/**
 * CE QUE L'ÉCRAN DIT D'UNE ATTRIBUTION, À LA MESURE DE CE QUE LE MOTEUR SAIT.
 *
 * `auto_confirmed` n'existe que dans un cas (`dpeAttributionStatus`) : un seul diagnostic à
 * l'adresse, une maison, une adresse précise, une classe connue, une liste complète. C'est une
 * CONVERGENCE, pas une preuve que ce document est celui du logement. La phrase nomme donc le
 * critère, et ne dit jamais « votre diagnostic » ni « le DPE de ce logement ». Elle est AU PASSÉ :
 * une actualisation peut faire apparaître d'autres diagnostics, et « c'est le seul » deviendrait faux.
 */
export function phraseAttribution(statut: "auto_confirmed" | "confirmed"): string {
  return statut === "auto_confirmed"
    ? "Il a été retenu automatiquement : c'était le seul diagnostic enregistré à cette adresse, celui d'une maison. "
    : "Vous avez désigné ce diagnostic parmi ceux de cette adresse. ";
}

/**
 * QUELLE VUE LA SECTION ÉNERGIE REND, et aucune ne se confond avec une autre (doctrine FUT-65) :
 *   - `attribue`     : un diagnostic est retenu (automatiquement ou par le lecteur) ;
 *   - `refuse`       : le lecteur a dit qu'aucun diagnostic de l'adresse n'est le sien (`not_in_list`) ;
 *   - `a_choisir`    : des diagnostics existent et rien n'est encore retenu (`pending`) ;
 *   - `aucun`        : la base a répondu, et rien n'est rattaché à l'adresse (`not_found`) ;
 *   - `non_verifie`  : la base n'a pas répondu ; une liste vide ne prouve alors rien.
 * Une liste PARTIELLE (un des deux jeux ADEME tombé) reste `a_choisir`, avec son avertissement.
 */
export type VueSectionDpe = "attribue" | "refuse" | "a_choisir" | "aucun" | "non_verifie";

export function vueSectionDpe(args: {
  statut: "loading" | "not_found" | "selection_required" | "auto_confirmed" | "confirmed" | "rejected" | "error";
  dpeRetenu: boolean;
  candidats: number;
  baseMuette: boolean;
}): VueSectionDpe {
  const { statut, dpeRetenu, candidats, baseMuette } = args;
  if ((statut === "auto_confirmed" || statut === "confirmed") && dpeRetenu) return "attribue";
  if (statut === "rejected") return "refuse";
  if (candidats > 0) return "a_choisir";
  return baseMuette ? "non_verifie" : "aucun";
}

/**
 * CE QUE L'ÉCRAN DIT D'UN DPE D'IMMEUBLE, POUR LUI-MÊME (FUT-74, D7). Il ne se présente plus comme
 * une ligne à reconnaître : il a sa fiche, qui nomme son objet avant sa classe.
 *
 * La taille de l'immeuble ne se dit que si l'ADEME la rend vraisemblable. Mesuré le 24/10/2026 sur
 * les 413 041 DPE d'immeuble : la surface est renseignée à 99,99 %, le nombre d'appartements partout,
 * mais il vaut 0 ou 1 dans 4,9 % des cas, ce qui ne décrit pas un immeuble collectif. Sous deux, il
 * est tu plutôt qu'affiché faux.
 */
export type FicheImmeuble = {
  id: string;
  /** « Diagnostic de l'immeuble entier » : l'objet, avant toute valeur. */
  titre: string;
  classe: DpeLabel | null;
  /** « classé C », ou l'absence d'étiquette dite comme telle. */
  classement: string;
  /** Repères vérifiables : date, taille de l'immeuble quand elle est fiable, source. */
  details: string[];
};

function jourFr(iso: string): string | null {
  const [a, m, j] = iso.slice(0, 10).split("-");
  return a && m && j ? `${j}/${m}/${a}` : null;
}

export function ficheImmeuble(c: DpeRecord): FicheImmeuble {
  const details: string[] = [];
  const date = c.date_dpe ? jourFr(c.date_dpe) : null;
  if (date) details.push(`établi le ${date}`);
  const taille: string[] = [];
  if (c.nombre_appartements != null && c.nombre_appartements >= 2) taille.push(`${c.nombre_appartements} logements`);
  if (c.surface_immeuble_m2 != null && c.surface_immeuble_m2 > 0) taille.push(`${m2(c.surface_immeuble_m2)} m² habitables`);
  if (taille.length > 0) details.push(`immeuble de ${taille.join(", ")}`);
  details.push("base DPE de l'ADEME");
  const classe = c.etiquette_dpe && /^[A-G]$/.test(c.etiquette_dpe) ? c.etiquette_dpe : null;
  return {
    id: c.id_dpe,
    titre: "Diagnostic de l'immeuble entier",
    classe,
    classement: classe ? `classé ${classe}` : "sans étiquette énergétique",
    details,
  };
}

/**
 * LA PORTÉE D'UN DPE D'IMMEUBLE, dite une fois sous ses fiches. Elle remplace `PHRASE_DPE_IMMEUBLE`
 * dans le bloc des diagnostics : celle-ci annonçait un diagnostic sans le montrer.
 */
export const PORTEE_DPE_IMMEUBLE =
  "Il décrit le bâtiment dans son ensemble, et ne donne la classe d'aucun logement en particulier : futur•e ne l'attribue pas à ce logement.";

/** La même portée, accordée au nombre de fiches (deux DPE d'immeuble à Six-Fours-les-Plages, revue du 24/10). */
export function porteeDpeImmeuble(n: number): string {
  return n > 1
    ? "Ils décrivent chacun un bâtiment dans son ensemble, et ne donnent la classe d'aucun logement en particulier : futur•e ne les attribue pas à ce logement."
    : PORTEE_DPE_IMMEUBLE;
}

/** FUT-74 (D3) : des diagnostics que la base ne permet de ranger ni dans un logement, ni dans l'immeuble. */
export function phraseIndetermines(n: number): string {
  return n === 1
    ? "Un autre diagnostic enregistré à cette adresse ne précise pas s'il porte sur un logement ou sur l'immeuble : il n'est pas attribué à ce logement."
    : `${n} autres diagnostics enregistrés à cette adresse ne précisent pas s'ils portent sur un logement ou sur l'immeuble : ils ne sont pas attribués à ce logement.`;
}

/**
 * UN ANCIEN CHOIX QUI NE PEUT PLUS SERVIR (FUT-74, D4). Un dossier a pu retenir, avant ce correctif,
 * le DPE de l'immeuble comme celui du logement. Le choix reste inscrit, rien n'est effacé, et l'écran
 * dit pourquoi il n'est plus lu comme la performance du logement.
 */
export function phraseChoixEcarte(grain: "immeuble" | "indetermine"): string {
  return grain === "immeuble"
    ? "Le diagnostic retenu pour ce logement porte sur l'immeuble entier. Il décrit le bâtiment, et futur•e ne l'utilise plus comme diagnostic de ce logement : son étiquette n'entre pas dans ce dossier."
    : "Le diagnostic retenu pour ce logement ne précise pas s'il porte sur un logement ou sur l'immeuble. futur•e ne l'utilise plus comme diagnostic de ce logement : son étiquette n'entre pas dans ce dossier.";
}

/** D6 : la phrase de la section Énergie pour un DPE de logement établi à partir de l'immeuble. */
export function phraseEtabliDepuisImmeuble(c: DpeRecord): string | null {
  if (!issuDesDonneesDeLImmeuble(c)) return null;
  return c.appartement_non_visite === true
    ? "Ce diagnostic a été établi à partir des données de l'immeuble, sans visite de l'appartement : la méthode applique alors les équipements individuels les moins performants de l'immeuble."
    : "Ce diagnostic a été établi à partir des données de l'immeuble.";
}
