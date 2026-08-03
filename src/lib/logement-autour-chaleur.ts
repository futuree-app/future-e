// LA CHALEUR DU SECTEUR ET L'ACCÈS AU VÉGÉTAL, LUS ENSEMBLE.
//
// Le module Autour portait déjà les deux faits, dans deux blocs qui ne se parlaient pas : l'îlot de
// chaleur d'un côté, l'espace vert le plus proche de l'autre. Le lecteur devait faire le
// rapprochement lui-même, alors que relier est précisément le travail du produit.
//
// CE QUE CETTE LECTURE NE DIT PAS, et c'est le cœur de sa rédaction :
//
//   1. Un espace vert ne COMPENSE PAS l'exposition. L'îlot de chaleur du logement est le même avec
//      ou sans bois à 300 mètres. Ce qui change est l'accès à un extérieur moins minéral, jamais la
//      chaleur subie chez soi. Toute formule qui suggérerait une compensation ferait de deux faits
//      mesurés une conclusion qu'aucune donnée ne porte.
//   2. Aucun score, aucun indice, aucun agrégat. Deux faits reliés par une phrase, et l'ADR-0001
//      interdit la note qui semblerait s'en déduire.
//   3. Aucune promesse thermique. La nature du polygone dit ce qu'OpenStreetMap a cartographié, pas
//      l'ombre portée à seize heures ni le confort d'un après-midi de canicule.
//
// LES DEUX FAITS N'ONT PAS LE MÊME GRAIN, et la phrase doit le porter. L'îlot de chaleur est mesuré
// au grand-IRIS, donc au secteur ; l'espace vert est une distance depuis l'adresse, donc un point.
// Les enchaîner sans nommer les deux échelles les fondrait en une seule, alors que la doctrine
// impose que l'échelle réelle s'affiche toujours. D'où « votre secteur » d'un côté et « à N mètres »
// de l'autre, dans toutes les branches.

import type { GreenKind, IcuSnapshot, OsmProximity } from "./logement-autour-types.ts";

export type ChaleurVegetal = {
  /** La phrase composée, ou null quand il n'y a rien à relier. */
  texte: string;
  /** Ce que la lecture ne sait pas, dit au lecteur plutôt que tu. */
  limite: string;
};

/**
 * Ce qu'OSM a cartographié, nommé sans adjectif.
 * `wood` et `forest` portent des arbres par définition du tag ; `grass` et `recreation_ground` non.
 * La distinction sert à formuler la limite, jamais à qualifier un confort.
 */
const NATURE: Record<GreenKind, { nom: string; arbore: boolean }> = {
  wood: { nom: "un bois", arbore: true },
  forest: { nom: "une forêt", arbore: true },
  park: { nom: "un parc", arbore: false },
  grass: { nom: "une surface enherbée", arbore: false },
  recreation_ground: { nom: "un terrain de plein air", arbore: false },
};

export function lireChaleurEtVegetal(
  icu: IcuSnapshot,
  osm: Pick<OsmProximity, "nearestMappedGreenSpace"> | null,
): ChaleurVegetal | null {
  // Sans îlot de chaleur mesuré, il n'y a rien à relier : l'espace vert se lit très bien seul, dans
  // son bloc. Cette lecture n'existe que parce que la chaleur du secteur lui donne un enjeu.
  if (!icu) return null;

  const vert = osm?.nearestMappedGreenSpace ?? null;
  const intensite = icu.level === "marque" ? "marqué" : "présent";
  const secteur = `Votre secteur connaît un îlot de chaleur urbain ${intensite}`;

  if (!vert) {
    return {
      texte: `${secteur}, et aucun espace végétalisé n'est cartographié dans le périmètre observé autour de l'adresse.`,
      limite:
        "L'absence porte sur ce qu'OpenStreetMap a cartographié dans ce périmètre, pas sur l'ensemble des espaces existants.",
    };
  }

  const nature = vert.kind ? NATURE[vert.kind] : null;
  const nom = nature?.nom ?? "un espace végétalisé";
  const metres = Math.round(vert.distanceMeters);

  return {
    texte: `${secteur}. Le premier espace végétalisé cartographié est ${nom}, à ${metres} mètres de l'adresse.`,
    limite: nature?.arbore
      // Le tag dit qu'il y a des arbres. Il ne dit pas leur densité, ni l'ombre qu'ils portent selon
      // l'heure : la nuance sépare ce que la donnée établit de ce que le lecteur en attend.
      ? "Sa densité d'arbres et l'ombre qu'il porte aux heures les plus chaudes ne sont pas documentées."
      : "Son ombrage et son confort lors des fortes chaleurs ne sont pas documentés.",
  };
}
