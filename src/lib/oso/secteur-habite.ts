// FUT-182 · L'OCCUPATION DES SOLS OSO 2023 DANS L'INDEX, ET CE QU'ON A LE DROIT D'EN DIRE. Module PUR, imports relatifs.
//
// Le champ `nature` de l'index est écrit par `scripts/oso/integrer-oso-2023.py` depuis les comptes de pixels (B1) et le
// secteur habité (B2) de l'audit FUT-182 (docs/audits/2026-11-09-fut182-oso-national-phase-a.md). Deux grains :
//
//   - `terres` : la COMMUNE (ou l'arrondissement), parts de ses terres, l'eau à part (`eau_pct`, en % de la surface
//     cartographiée). Terres = OSO 1-22 et 24 (serres, poste distinct rattaché aux cultures). Valeurs NON arrondies :
//     les seuils se comparent avant arrondi, l'affichage arrondit au dixième (FUT-183, `pctOso`).
//   - `secteur` : le SECTEUR HABITÉ. Autour de chaque zone bâtie de la commune (pixels OSO 1-2, cellules de 100 m), la
//     part des milieux naturels dans les terres situées à 15 km au plus ; moyenne pondérée par le bâti, dispersion
//     p10-p90 pondérée de la même façon. Seuls comptent les pixels sous un contour communal français : la mer, l'étranger
//     et ce que la carte ne classe pas ne sont jamais comptés comme « pas de nature ». Le bâti est un proxy de la
//     répartition des lieux bâtis, pas le lieu de vie des habitants (Filosofi 2021 : 0,24 point d'écart médian sur
//     21 communes, jusqu'à 5,4 points pour un bâti dispersé, Saintes-Maries-de-la-Mer).
//
// LA CONVENTION DE COMPARABILITÉ (validée le 10/11/2026) porte sur la part du disque couverte par des terres et eaux
// françaises : ≥ 75 % classement normal ; 50 à 75 % classement avec sa limite géographique dite ; < 50 % valeur gardée,
// classement national NON ÉTABLI (ni score, ni rang, ni verdict) ; aucun pixel bâti : « non calculable avec cette
// méthode » (ni valeur, ni score, ni rang). Ce n'est pas une défaillance du raster : c'est que la comparaison nationale
// n'aurait pas le même sens pour une île que pour une commune de l'intérieur.

import { deCommune } from "../typography.ts";
import { pctOso } from "../territoire/oso-format.ts";

export const NATURE_METHODE = "oso-2023-secteur-habite@1";
export const NATURE_RAYON_KM = 15;
export const COUVERTURE_CLASSEMENT_PCT = 75;
export const COUVERTURE_MINIMALE_PCT = 50;

export type StatutSecteur = "classe" | "classe_limite" | "non_classe" | "non_calculable";
export type CauseHorsFrance = "mer" | "etranger" | "mer_et_etranger" | "non_attribuee";

export type SecteurHabite =
  | { statut: "non_calculable" }
  | {
      statut: Exclude<StatutSecteur, "non_calculable">;
      /** Part moyenne des milieux naturels dans les terres à 15 km des zones bâties, en %. */
      valeur: number;
      p10: number;
      p90: number;
      /** Part du disque couverte par des terres et eaux sous contour communal français, en %. */
      couvert_fr_pct: number;
      /** Ce qui n'est pas sous un contour français, attribué par le masque GISCO (Eurostat, 1:1 000 000). */
      hors_fr: { mer: number; etranger: number; non_attribue: number };
      /** La cause établie de ce qui manque, ou null quand il manque moins de 1 % du disque. Jamais devinée. */
      cause: CauseHorsFrance | null;
    };

export type TerresOso = {
  naturel: number; foret: number; prairies: number; landes_pelouses: number; mineral_dunes: number;
  cultures: number; serres: number; urbanise: number;
};

export type NatureIndex = {
  methode: string;
  /** Percentile national du secteur habité, ou null hors classement (non classé, non calculable, arrondissement). */
  score: number | null;
  terres: TerresOso;
  eau_pct: number;
  couverture_pct: number;
  secteur: SecteurHabite;
};

/** La valeur mesurée du secteur habité, ou null (« non calculable avec cette méthode »). */
export function valeurSecteur(n: NatureIndex | null | undefined): number | null {
  return n && n.secteur.statut !== "non_calculable" ? n.secteur.valeur : null;
}

/** Le classement national est-il établi ? Seulement si l'index porte un score (convention ci-dessus). */
export function classementEtabli(n: NatureIndex | null | undefined): boolean {
  return n != null && typeof n.score === "number" && (n.secteur.statut === "classe" || n.secteur.statut === "classe_limite");
}

const pct1 = (x: number) => (Math.round(x * 10) / 10).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * LA LIMITE GÉOGRAPHIQUE DITE AU LECTEUR, ou null quand il n'y a rien à dire (≥ 75 % du disque couvert).
 * Une cause n'est nommée que si le masque GISCO l'établit ; sinon, la phrase reste neutre (« hors du territoire
 * français étudié »). Jamais « données manquantes », jamais « mesure incertaine ».
 */
export function limiteSecteur(s: SecteurHabite | null | undefined): string | null {
  if (!s) return null;
  if (s.statut === "non_calculable") {
    return "Non calculable avec cette méthode : la carte OSO ne détecte aucune zone bâtie dans la commune.";
  }
  const geo = limiteGeographique(s.statut, s.couvert_fr_pct, s.cause);
  return geo ? `${geo} La part mesurée porte sur les seules terres françaises du rayon.` : null;
}

/** La seule phrase géographique (sans la précision sur les terres françaises), ou null pour un secteur « classe ». */
export function limiteGeographique(statut: StatutSecteur, couvertFrPct: number, cause: CauseHorsFrance | null): string | null {
  if (statut === "classe" || statut === "non_calculable") return null;
  const hors = Math.max(0, 100 - couvertFrPct);
  const pourquoi = cause === "mer"
    ? `la mer occupe environ ${pct1(hors)} % du rayon de 15 km`
    : cause === "etranger"
      ? `environ ${pct1(hors)} % du rayon de 15 km se trouve à l'étranger, hors du périmètre de cette mesure`
      : cause === "mer_et_etranger"
        ? `la mer et l'étranger occupent environ ${pct1(hors)} % du rayon de 15 km`
        : `environ ${pct1(hors)} % du rayon de 15 km est hors du territoire français étudié`;
  return statut === "non_classe"
    ? `Classement national non établi : ${pourquoi}.`
    : `Autour des zones bâties de la commune, ${pourquoi}.`;
}

export const SOURCE_OSO = "OSO 2023, THEIA / CES OSO (CESBIO), CNES-GEODES, mise à jour du 20/09/2024, Licence Ouverte 2.0 ; traitements futur•e";

export const LIMITE_LECTURE_SECTEUR =
  "Cette part décrit l'occupation des sols autour des zones bâties de la commune. Elle ne dit ni l'accès à un espace naturel, ni la distance réelle pour s'y rendre, ni sa qualité écologique. Le bâti sert de repère des lieux bâtis, pas du lieu de vie de chaque habitant.";

/** La phrase canonique de la mesure (rapport FUT-182, décision A du 10/11/2026). */
export function phraseSecteur(valeur: number, nomCommune?: string): string {
  const qui = nomCommune ? deCommune(nomCommune) : "de la commune";
  return `Autour des zones bâties ${qui}, les milieux naturels représentent en moyenne ${pctOso(valeur)} % des terres situées dans un rayon de ${NATURE_RAYON_KM} km.`;
}
