// LES FAITS DU GRAIN SECTEUR. Lib PURE : aucune I/O, aucun `node:`.
//
// Premier contenu de l'échelle intermédiaire, que `echelles.ts` savait nommer depuis le 25/07 sans
// avoir rien à y mettre (« le quartier est une échelle VIDE », verrouillé par un test qui devait
// tomber ce jour-là).
//
// CE QU'ON N'ÉCRIT PAS ICI. Le mot « dépendance » est banni de ce fait, et la lecture « on peut y
// vivre sans voiture » aussi. Posséder une voiture ne prouve pas qu'on en a besoin : la possession
// reflète aussi la composition des ménages, les revenus, le stationnement, la typologie des
// logements et les habitudes. La clé `faible_dependance_auto` porte déjà cette lecture-là, au grain
// COMMUNE et en position relative nationale (`mismatch-rules`). Ce fait ne la remplace pas : il la
// NUANCE localement — sinon le dossier dirait deux fois la même chose à deux échelles sans les relier.

import type { SecteurFacts } from "./decision-fact.ts";

/** Ce que la lecture de l'équipement automobile rend, sous la forme minimale attendue ici. */
export type CarOwnershipLike =
  | { kind: "secteur"; share: number; communeShare: number | null; irisCode: string }
  | { kind: "commune_entiere" | "secteur_non_residentiel" | "unknown" };

/**
 * L'ÉCART À PARTIR DUQUEL LA NUANCE VAUT D'ÊTRE DITE : 15 points.
 *
 * Ce n'est pas la fréquence qui fonde ce seuil — comparer 11,4 % au boisement (9,4 %) ou au radon
 * (19,5 %) serait une analogie entre phénomènes sans rapport. La mesure sert à écarter le BRUIT :
 * l'écart absolu médian entre un secteur et sa commune est de 5,4 points, et à ±5 points la nuance
 * concernerait 52,8 % des IRIS — elle apparaîtrait partout, donc ne signifierait plus rien.
 * À ±15 points (11,4 % des IRIS d'habitat), l'écart est de ceux qu'un lecteur perçoit.
 *
 * Convention de produit, donc NOMMÉE et DITE dans le texte, comme le seuil de bruit.
 */
export const ECART_SECTEUR_NOTABLE = 15;

/** Adaptateur pur : la lecture de l'artefact -> les faits du socle. */
export function buildSecteurFacts(car: CarOwnershipLike | null | undefined): SecteurFacts {
  if (!car || car.kind !== "secteur" || car.communeShare == null) return {};
  return {
    equipementAuto: {
      share: car.share,
      communeShare: car.communeShare,
      ecart: Math.round((car.share - car.communeShare) * 10) / 10,
      irisCode: car.irisCode,
    },
  };
}

/** L'écart est-il assez marqué pour que le dire apporte quelque chose ? */
export function ecartNotable(ecart: number): boolean {
  return Math.abs(ecart) >= ECART_SECTEUR_NOTABLE;
}

/** Formate un pourcentage à la française : virgule décimale, espace insécable. */
export function pctFr(v: number): string {
  const n = Math.round(v * 10) / 10;
  return `${(Number.isInteger(n) ? String(n) : n.toFixed(1)).replace(".", ",")} %`;
}

/** Formate un nombre de points, sans signe (le sens est porté par la phrase). */
export function pointsFr(v: number): string {
  const n = Math.round(Math.abs(v) * 10) / 10;
  const txt = (Number.isInteger(n) ? String(n) : n.toFixed(1)).replace(".", ",");
  return `${txt} point${n >= 2 ? "s" : ""}`;
}

/**
 * LE CONSTAT. Il dit TOUJOURS les deux nombres — le niveau du secteur et celui de la commune — et
 * jamais le seul écart.
 *
 * Sans le niveau absolu, « moins de voitures que dans la commune » se lit « quartier peu motorisé »,
 * ce qui est faux dans 16 % des cas mesurés (secteurs sous leur commune mais au-dessus de 60 %
 * d'équipement). Le signe oriente la phrase ; il ne la conclut pas.
 */
export function equipementAutoStatement(f: NonNullable<SecteurFacts["equipementAuto"]>): string {
  const sens = f.ecart < 0 ? "moins répandue" : "plus répandue";
  return (
    `Dans ce secteur, ${pctFr(f.share)} des ménages disposent d'au moins une voiture, ` +
    `contre ${pctFr(f.communeShare)} dans l'ensemble de la commune : la possession y est ` +
    `${sens} de ${pointsFr(f.ecart)}. futur•e signale cet écart à partir de ${ECART_SECTEUR_NOTABLE} points.`
  );
}

/**
 * CE QUE ÇA CHANGE POUR LE LECTEUR, sans jamais conclure sur son projet. La possession automobile
 * n'établit ni la facilité ni la difficulté de se déplacer autrement : elle invite à croiser.
 */
export function equipementAutoLimitation(): string {
  return (
    "La possession d'une voiture reflète aussi la composition des ménages, les revenus, le " +
    "stationnement disponible et la typologie des logements : elle ne dit pas, à elle seule, s'il " +
    "est possible de se déplacer autrement depuis cette adresse."
  );
}
