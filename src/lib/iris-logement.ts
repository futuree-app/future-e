// LES MÉNAGES DISPOSANT D'AU MOINS UNE VOITURE, au secteur de l'adresse (INSEE, RP 2022).
//
// LIB PURE : aucune I/O, aucun `node:`. Elle est importée PAR LE CLIENT (la carte du module Logement
// formule l'écart et la part inverse). L'accès à l'artefact vit dans `server/iris-logement-store.ts`
// — même séparation que `dpe-attribution.ts` (pur) / `dpe.ts` (I/O).
//
// CE QUE CE FAIT EST, ET LE NOM QU'IL NE PORTE PAS. C'est la part des résidences principales dont le
// ménage dispose d'au moins une voiture (`P22_RP_VOIT1P / P22_RP`). Ce n'est PAS un « taux de
// motorisation » — mot ambigu qui peut désigner le nombre de véhicules, l'équipement ou les
// déplacements. Ce n'est surtout pas « la dépendance à la voiture » ni « la possibilité de vivre sans
// voiture » : posséder une voiture ne prouve pas qu'on en a besoin.
//
// POURQUOI CETTE SOURCE PLUTÔT QUE L'AUTRE. Le dataset ADEME employé jusqu'ici porte un champ
// `taux_motor_glob` qui mesure les DÉPLACEMENTS DOMICILE-TRAVAIL en véhicule motorisé — une autre
// grandeur, issue d'une enquête (ENL 2022, ~40 000 logements pour 49 059 IRIS). Sur Saint-Denis (93),
// les deux donnent 20,4 % et 46,9 % : un facteur 2,3, parce qu'ils ne mesurent pas la même chose.
// Les confondre aurait fait lire « ce quartier vit largement sans voiture » là où un ménage sur deux
// en possède une.
//
// C'EST UNE ESTIMATION, pas un comptage. Dans les communes de 10 000 habitants et plus, le
// recensement enquête ~8 % des logements par an, cumulés sur cinq ans ; les effectifs sont pondérés.
// La phrase juste est « estimation issue du recensement », jamais « comptage des ménages du quartier ».

/** Ligne brute de l'artefact : [TYP_IRIS, LAB_IRIS, part ≥1 voiture, résidences principales]. */
export type IrisLogementRow = [string, string, number, number];

/**
 * CE QUE LA LECTURE ÉTABLIT. Quatre états distincts, et aucun n'est une valeur nullable assortie d'un
 * repli silencieux : c'est précisément ce qui ferait passer du communal pour du local.
 */
export type CarOwnership =
  /** L'IRIS d'habitat qui contient l'adresse. Seul cas où le chiffre décrit le voisinage. */
  | {
      kind: "secteur";
      share: number;            // % de ménages avec au moins une voiture
      communeShare: number | null; // la commune entière, pour situer l'écart
      irisCode: string;
      households: number;       // résidences principales du secteur (ordre de grandeur)
      irisLabel: string;        // LAB_IRIS, CONSERVÉ TEL QUEL et jamais interprété (cf. build)
    }
  /** Commune non découpée en IRIS : l'INSEE fournit une ligne communale. Aucune variation locale. */
  | { kind: "commune_entiere"; share: number; insee: string }
  /**
   * L'adresse tombe dans un IRIS d'ACTIVITÉ ou DIVERS (zone d'emploi, gare, parc). Presque personne
   * n'y habite : en tirer un profil résidentiel serait un chiffre calculé sur presque rien. On ne
   * cherche PAS l'IRIS d'habitat le plus proche — ce serait réinventer une précision qu'on n'a pas.
   */
  | { kind: "secteur_non_residentiel"; irisType: "A" | "D"; communeShare: number | null; irisCode: string }
  /** Aucune donnée exploitable. Jamais 0 %. */
  | { kind: "unknown" };

/**
 * DÉCIDE l'état à partir de la ligne du secteur et de l'agrégat communal. Pure : aucune I/O.
 * `row` vaut `null` quand aucun IRIS n'a été résolu ou qu'il est absent de la base.
 */
export function readCarOwnership(
  row: IrisLogementRow | null | undefined,
  communeShare: number | null,
  irisCode: string | null,
  insee: string | null,
): CarOwnership {
  if (!row || !irisCode) {
    // Pas de secteur : la valeur communale ne peut se présenter que COMME communale.
    return communeShare != null && insee
      ? { kind: "commune_entiere", share: communeShare, insee }
      : { kind: "unknown" };
  }
  const [typ, lab, share, households] = row;
  if (typ === "A" || typ === "D") {
    return { kind: "secteur_non_residentiel", irisType: typ, communeShare, irisCode };
  }
  if (typ === "Z") {
    return insee ? { kind: "commune_entiere", share, insee } : { kind: "unknown" };
  }
  if (typ !== "H" || !Number.isFinite(share)) return { kind: "unknown" };
  return { kind: "secteur", share, communeShare, irisCode, households, irisLabel: lab };
}

/** L'écart en points entre le secteur et sa commune. `null` si l'un des deux manque. */
export function ecartAuCommune(o: CarOwnership): number | null {
  if (o.kind !== "secteur" || o.communeShare == null) return null;
  return Math.round((o.share - o.communeShare) * 10) / 10;
}

/** La part de ménages SANS voiture, dérivée pour la restitution — la donnée canonique reste positive. */
export function partSansVoiture(share: number): number {
  return Math.round((100 - share) * 10) / 10;
}
