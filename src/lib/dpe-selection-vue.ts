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
import { isCollective, type AddressDpeContext } from "./dpe-address-context.ts";
import { candidateIdentifier, isUnidentifiable, matchesQuery, meaningfulFloor } from "./dpe-candidate-match.ts";

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
  /** Un diagnostic de l'immeuble entier, qui ne décrit pas un logement en particulier. */
  immeuble: boolean;
  /** Les repères secondaires, du plus utile pour reconnaître au résultat énergétique. */
  details: string[];
  /** Le résultat, posé à part et en retrait : il n'est pas un critère de reconnaissance. */
  classe: DpeLabel | null;
  /** Ce que lit un lecteur d'écran : le geste ET ce qu'il porte. */
  libelleAccessible: string;
};

/**
 * UNE LIGNE : identification du logement > caractéristiques qui distinguent > résultat.
 *
 * La date du diagnostic s'écrit « DPE 2025 » et non « 2025 » seul : à côté d'une année de
 * construction, une année nue ne dit pas de quoi elle est l'année.
 */
export function ligneCandidat(c: DpeRecord, champs: ChampsVariables): LigneCandidat {
  const ident = candidateIdentifier(c);
  const immeuble = isCollective(c.methode_dpe);
  const titre = ident ?? (immeuble ? "Immeuble entier" : "Sans identifiant de logement");

  const details: string[] = [];
  if (immeuble) details.push("diagnostic de l'immeuble");
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
    id: c.id_dpe, titre, identifie: ident !== null || immeuble, immeuble, details, classe,
    libelleAccessible: `Retenir ce diagnostic pour ce logement : ${lu}`,
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
 * LE RÉSUMÉ DE L'ADRESSE AU PREMIER NIVEAU d'une liste repliée : les bornes, jamais une moyenne
 * (cf. `dpe-address-context.ts`), et seulement celles qui existent.
 */
export function phraseBornes(ctx: AddressDpeContext): string | null {
  const parts: string[] = [];
  if (ctx.spread) parts.push(`classes observées de ${ctx.spread.min} à ${ctx.spread.max}`);
  if (ctx.years) {
    parts.push(ctx.years.min === ctx.years.max
      ? `réalisés en ${ctx.years.min}`
      : `réalisés entre ${ctx.years.min} et ${ctx.years.max}`);
  }
  if (parts.length === 0) return null;
  const s = parts.join(", ");
  return `${s.charAt(0).toUpperCase()}${s.slice(1)}.`;
}

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
 * LE DIAGNOSTIC D'IMMEUBLE, DIT POUR CE QU'IL APPORTE (FUT-68). L'ancienne phrase (« Il décrit le
 * bâtiment commun, et pas la performance d'un logement en particulier ») était exacte, mais ne disait
 * pas quoi en faire. Celle-ci dit les deux choses à retenir : c'est une information sur le BÂTIMENT,
 * et elle ne REMPLACE PAS le diagnostic du logement, y compris quand celui-ci est introuvable.
 * Son rôle dans le dossier relève de FUT-74, pas de cet écran.
 */
export const PHRASE_DPE_IMMEUBLE =
  "Un diagnostic concerne l'immeuble entier. Il donne une indication sur la performance du bâtiment, mais ne remplace pas le DPE de ce logement.";
