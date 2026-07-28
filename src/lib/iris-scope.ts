// LE PÉRIMÈTRE IRIS D'UNE COMMUNE. Lib PURE, extraite de `commune-data.ts` (`server-only`, donc
// intestable) — même geste que `georisques-flags.ts` et `eaufrance-ecoulement.ts`.
//
// POURQUOI ELLE EXISTE. `fetchIrisRecords` cherchait les IRIS d'une commune par son NOM :
//
//     qs=_contours_iris.nom_com:"Saint-Denis"
//
// La France compte quatre communes nommées Saint-Denis. La requête en ramenait 103 IRIS — 62 à
// La Réunion, 39 en Seine-Saint-Denis, 1 dans l'Aude, 1 dans le Gard — et la moyenne les mélangeait.
// Le taux de motorisation de Saint-Denis (93) s'affichait à 39,9 % au lieu de 21,0 % : presque le
// double, sur un indicateur qui sert la priorité « vivre sans voiture ». Mesuré contre l'API le
// 28/07/2026. Même signature que « feux de foret » au pluriel et `libelle_observation` : exact
// localement, faux par COMPOSITION, silencieux, invisible aux tests.
//
// LE DATASET N'A PAS DE CODE COMMUNE. Ses seuls champs géographiques sont `_contours_iris.nom_com`,
// `nom_iris` et `geometry`. Le code commune n'existe QUE dans les 5 premiers chiffres du code IRIS.
// On interroge donc par PRÉFIXE, puis on filtre — l'appartenance ne se délègue jamais à l'API.

import { communeParent } from "./plm.ts";

/**
 * Le préfixe de code IRIS à interroger pour une commune.
 *
 * Paris, Lyon et Marseille n'ont AUCUN IRIS sous leur code de commune : ils sont portés par les
 * arrondissements. Vérifié le 28/07/2026 — `iris:75056*` ramène 0, `iris:751*` ramène 940 sur les
 * 20 arrondissements. Les trois préfixes ne débordent sur aucune autre commune (contrôlé : 751 →
 * 75101-75120, 6938 → 69381-69389, 132 → 13201-13216).
 */
export function irisQueryPrefix(inseeCode: string): string {
  if (inseeCode === "75056") return "751";  // Paris
  if (inseeCode === "69123") return "6938"; // Lyon
  if (inseeCode === "13055") return "132";  // Marseille
  return inseeCode;
}

/** Le code commune porté par un code IRIS (9 chiffres) : ses 5 premiers caractères. */
export function communeOfIris(irisCode: string | number | null | undefined): string | null {
  if (irisCode == null) return null;
  const s = String(irisCode).trim();
  return s.length >= 5 ? s.slice(0, 5) : null;
}

/**
 * NE GARDE QUE LES IRIS DE LA COMMUNE DEMANDÉE. C'est ici que l'invariant tient, pas dans la requête :
 * un préfixe qui déborderait, un dataset qui changerait de schéma, une réponse inattendue — rien ne
 * peut faire entrer l'IRIS d'une autre commune dans la moyenne.
 *
 * Les arrondissements PLM sont ramenés à leur commune parente : les IRIS de Paris 1er appartiennent
 * bien à Paris.
 */
export function keepIrisOfCommune<T extends { iris?: string | number | null }>(
  rows: T[],
  inseeCode: string,
): T[] {
  return rows.filter((r) => {
    const code = communeOfIris(r.iris);
    return code != null && communeParent(code) === inseeCode;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// L'IRIS DU POINT
//
// Les indicateurs IRIS sont RÉELLEMENT infra-communaux : mesuré sur les 31 IRIS de La Rochelle, le
// taux de HLM va de 0,3 % à 85,1 %, les passoires de 8,2 % à 41,3 %. La moyenne communale écrase
// donc l'information au lieu de la porter — le centre-ville affiche 7,3 % de HLM là où la commune
// entière en affiche 31,1 %.
//
// D'OÙ LA RÈGLE. Une valeur ne se lit pas sans son grain :
//   - adresse connue ET IRIS résolu  -> valeur SECTORIELLE, c'est « autour de l'adresse » ;
//   - pas d'adresse                  -> agrégat communal, présenté COMME communal ;
//   - adresse connue, aucun IRIS     -> absence sectorielle EXPLICITE, jamais un repli silencieux.
//
// Le repli silencieux est précisément le défaut qu'on vient de fermer : servir du communal en le
// faisant passer pour du local.

/** Ce que le périmètre IRIS retenu représente. Aucune de ces branches n'est interchangeable. */
export type IrisScope =
  /** L'IRIS qui CONTIENT le point. Seul cas où la valeur décrit le secteur. */
  | { kind: "point"; irisCode: string; communeCode: string }
  /** La moyenne des IRIS de la commune. Se lit et s'annonce comme communale. */
  | { kind: "commune"; irisCount: number }
  /** Adresse connue, mais aucun IRIS ne la contient (hors couverture, mer, géométrie absente). */
  | { kind: "none" }
  /** L'IRIS trouvé n'appartient PAS à la commune attendue : géocodage en limite, ou contour décalé. */
  | { kind: "mismatch"; foundCommune: string; expectedCommune: string }
  /** La source n'a pas répondu. Ce n'est pas une absence. */
  | { kind: "unavailable" };

/**
 * DÉCIDE le périmètre à partir de ce que la source a rendu au point. Pure : la fonction ne fait
 * aucun appel, elle qualifie une réponse.
 *
 * `row` vaut `null` quand la source a répondu SANS résultat (le point n'est dans aucun IRIS) ;
 * `sourceOk = false` quand elle n'a pas répondu du tout. Les confondre reconstruirait le mensonge
 * que tout ce chantier démonte.
 */
export function scopeFromPoint(
  row: { iris?: string | number | null } | null,
  expectedCommune: string,
  sourceOk: boolean,
): IrisScope {
  if (!sourceOk) return { kind: "unavailable" };
  if (!row) return { kind: "none" };
  const code = communeOfIris(row.iris);
  if (code == null) return { kind: "none" };
  const parent = communeParent(code);
  if (parent !== expectedCommune) {
    return { kind: "mismatch", foundCommune: parent, expectedCommune };
  }
  return { kind: "point", irisCode: String(row.iris).trim(), communeCode: parent };
}

/** Le périmètre décrit-il le SECTEUR (et non la commune) ? Seul cas où le fait est « autour ». */
export function isSectorScope(scope: IrisScope): scope is Extract<IrisScope, { kind: "point" }> {
  return scope.kind === "point";
}
