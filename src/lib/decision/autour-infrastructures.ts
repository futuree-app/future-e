// ════════════════════════════════════════════════════════════════════════════════════════════
// LES INFRASTRUCTURES DE TRANSPORT AUTOUR DE L'ADRESSE.
//
// CETTE DONNÉE EXISTE DEPUIS TOUJOURS ET N'A JAMAIS ÉTÉ AFFICHÉE. Chaque snapshot Autour porte
// `potentiallyNoisyInfrastructure` : pour chaque type présent dans le rayon cherché (autoroute,
// route à grande circulation, voie ferrée), la distance à la plus proche. Elle était calculée,
// stockée, et retenue avec ce motif : « reste hors rendu tant qu'on ne sait pas la dire au grain
// de l'adresse ».
//
// ── LA DIFFICULTÉ ÉTAIT RÉELLE ────────────────────────────────────────────────────────────────
// Une distance n'est PAS un niveau de bruit. Il dépend du trafic, du relief, des écrans
// antibruit, de la hauteur du logement, de l'orientation des façades et du vent. « Autoroute à
// 180 m » invite à conclure « bruyant », ce qu'on n'a pas mesuré. Le critère communal
// `calme_sonore` répond à cette question-là autrement, par une exposition cumulée.
//
// ── CE QUI LA LÈVE ────────────────────────────────────────────────────────────────────────────
// Le produit sait déjà tenir cette position : `equipementAutoStatement` donne un chiffre de
// secteur qui NUANCE un critère communal sans le remplacer, et dit sa limite dans la foulée. Même
// geste ici. On nomme ce qui est là et à quelle distance ; on dit que la distance n'établit pas le
// bruit ; on rappelle qu'une visite à des heures différentes est la seule mesure qui vaille.
//
// Et c'est un fait qu'une visite ne révèle pas forcément : on visite un dimanche matin.
//
// ── AUCUN SEUIL, DONC AUCUN JUGEMENT CACHÉ ────────────────────────────────────────────────────
// Tout ce qui est trouvé dans le rayon cherché est montré, du plus proche au plus lointain, avec
// le rayon dit. Choisir un seuil (« on n'affiche qu'en dessous de 300 m ») reviendrait à décider à
// la place du lecteur ce qui compte, et à masquer un fait sans le dire. Une voie ferrée à 900 m se
// lit comme une voie ferrée à 900 m.
//
// Pur, testé sous `node --test`.
// ════════════════════════════════════════════════════════════════════════════════════════════

import type { Face3Snapshot, OsmProximity } from "../logement-autour-types.ts";
import { distanceFr } from "./autour-conclusion.ts";

type InfraType = OsmProximity["potentiallyNoisyInfrastructure"][number]["type"];

/**
 * Les libellés, écrits pour un lecteur.
 *
 * « trunk » est le piège : dans OSM, c'est une route à grande circulation, souvent une deux-fois-
 * deux-voies, parfois une simple nationale. L'appeler « voie rapide » promettrait un gabarit qu'on
 * ne connaît pas.
 */
const LIBELLE: Record<InfraType, { nom: string; article: string }> = {
  motorway: { nom: "autoroute", article: "une" },
  trunk: { nom: "route à grande circulation", article: "une" },
  railway: { nom: "voie ferrée", article: "une" },
};

export type InfraLecture = {
  /** Une ligne par infrastructure trouvée, de la plus proche à la plus lointaine. */
  lignes: { label: string; distance: string; distanceMeters: number }[];
  /** La phrase qui borne la lecture. Toujours présente quand il y a des lignes. */
  limite: string;
  /** Ce qu'on affiche quand la source n'a pas répondu, au lieu d'une absence. */
  indisponible: string | null;
};

/**
 * Assemble la lecture des infrastructures.
 *
 * Rend `null` quand il n'y a RIEN à dire, c'est-à-dire quand la source a répondu et n'a rien
 * trouvé. On n'écrit pas « aucune infrastructure bruyante à proximité » : ce serait une promesse
 * de calme, alors qu'on n'a cherché que trois types d'objets dans un rayon donné. Le silence est
 * ici plus honnête qu'un satisfecit.
 */
export function buildInfraLecture(s: Face3Snapshot): InfraLecture | null {
  const statut = s.sourceStatus.osmInfrastructure;

  if (statut === "pending") {
    return { lignes: [], limite: "", indisponible: "Lecture des abords en cours de récupération…" };
  }
  if (statut === "failed") {
    return {
      lignes: [],
      limite: "",
      indisponible:
        "La lecture des abords n'a pas pu être établie : la source cartographique n'a pas répondu.",
    };
  }

  const infra = s.osm.potentiallyNoisyInfrastructure ?? [];
  if (infra.length === 0) return null;

  const lignes = [...infra]
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .map((i) => ({
      label: `${LIBELLE[i.type].article.charAt(0).toUpperCase()}${LIBELLE[i.type].article.slice(1)} ${LIBELLE[i.type].nom}`,
      distance: distanceFr(i.distanceMeters),
      distanceMeters: i.distanceMeters,
    }));

  return {
    lignes,
    limite:
      `Ces distances disent ce qui se trouve autour, dans un rayon de ` +
      `${distanceFr(s.osm.bboxRadiusMeters)}. Elles n'établissent pas le niveau sonore de ce ` +
      `logement, qui dépend du trafic, du relief, des écrans, de l'étage et de l'orientation des ` +
      `façades : seule une visite à plusieurs heures de la journée le dit.`,
    indisponible: null,
  };
}
