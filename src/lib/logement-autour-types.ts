import type { LngLat } from "./geo-distance.ts";
import type { PermisRetenu } from "./sitadel-selection.ts";

// Foyer canonique de TOUS les types partagés Face 3 (évite les imports en avant entre libs).

export type Face3Cat = "sante" | "alimentation" | "education" | "transports" | "services";
export type Posture = "residence" | "prospection";
export type BpePoint = { c: Face3Cat; t: string; lat: number; lon: number };
/**
 * LE RAYON « À PORTÉE DE PAS » : 500 m à vol d'oiseau, six à sept minutes de marche.
 *
 * Défini ICI, dans le contrat partagé, parce que deux endroits s'en servent : le comptage des
 * équipements (`nearestByCategory`) et la conclusion du module (`decision/autour-conclusion.ts`).
 * Deux constantes pour un même seuil finiraient par diverger, et l'écran dirait alors « 3 à moins
 * de 500 m » sous une phrase qui parle d'un autre périmètre.
 */
export const BPE_WALK_RADIUS_M = 500;

export type BpeNearest = {
  category: Face3Cat;
  nearest: { distanceMeters: number; typeLabel: string | null } | null;
  searchCapMeters: number;
  /**
   * Combien d'équipements de cette catégorie dans `BPE_WALK_RADIUS_M`.
   *
   * OPTIONNEL, ET IL DOIT LE RESTER. Les snapshots sont figés à leur création : ceux d'avant le
   * 01/08/2026 ne portent pas ce champ, et un dossier ancien ne doit pas afficher « 0 à moins de
   * 500 m » là où le comptage n'a simplement jamais eu lieu. Absent veut dire « non compté »,
   * jamais « aucun ».
   */
  withinWalkCount?: number;
};

// Libellé FR précis par code TYPEQU (BPE24). Nature de chaque code confirmée sur les
// noms d'établissement réels (NOMRS) le 2026-07-03. Le rapport affiche ce type précis
// (« Pharmacie », « Boulangerie ») plutôt que la seule famille abstraite. Modifier le
// libellé ici ne demande PAS de régénérer les shards (les shards ne portent que le code).
export const TYPEQU_LABEL: Record<string, string> = {
  // Santé
  D265: "Médecin généraliste",
  D307: "Pharmacie",
  // Alimentation
  B105: "Supermarché",
  B201: "Supérette",
  B202: "Épicerie",
  B204: "Boucherie-charcuterie",
  B207: "Boulangerie",
  B208: "Primeur",
  // Éducation
  C107: "École maternelle",
  C108: "École primaire",
  C109: "École élémentaire",
  // Transports
  E107: "Gare",
  E108: "Gare",
  E109: "Halte ferroviaire",
  // Services essentiels
  A203: "Banque",
  A206: "Bureau de poste",
};

// Nature de l'espace vert cartographié (tag OSM conservé pour préciser « parc / bois / … »
// plutôt qu'un « espace vert » générique). Optionnel : les snapshots antérieurs ne l'ont pas.
export type GreenKind = "park" | "wood" | "forest" | "grass" | "recreation_ground";

export type OsmProximity = {
  potentiallyNoisyInfrastructure: { type: "motorway" | "trunk" | "railway"; distanceMeters: number }[];
  nearestMappedGreenSpace: { distanceMeters: number; kind?: GreenKind } | null;
  bboxRadiusMeters: number;
};

// Signal îlot de chaleur urbain du quartier (CSTB, grain grand-IRIS). null si l'adresse n'est pas
// dans une commune couverte (596) ou si la résolution IRIS a échoué : dans les deux cas le bloc
// « Chaleur autour du logement » n'apparaît pas (jamais de « non renseigné »). iuhi = °C.
export type IcuSnapshot = { iuhi: number; level: "marque" | "present" } | null;

/**
 * LES AUTORISATIONS D'URBANISME AUTOUR DE L'ADRESSE, GELÉES AVEC LEUR PÉRIMÈTRE.
 *
 * Le rayon, la fenêtre d'ancienneté et l'année de référence sont écrits ICI, à côté des permis
 * qu'ils ont sélectionnés, et jamais relus depuis les constantes du jour. Le jour où le rayon
 * change, un dossier ancien doit continuer de décrire ce qui a réellement servi à le construire :
 * une phrase bâtie sur la constante courante raconterait un périmètre que ces permis n'ont pas
 * connu.
 *
 * `consulteLe` est affiché. Le registre national est mensuel et un dossier se relit des mois
 * après sa création : sans la date de consultation, le lecteur ne peut pas savoir de quand date
 * ce qu'il lit.
 */
export type PermisSnapshot = {
  /** Du plus récent au plus ancien. Vide veut dire CONSULTÉ ET RIEN TROUVÉ, jamais « non su ». */
  permis: PermisRetenu[];
  rayonMeters: number;
  ancienneteMaxAns: number;
  /** L'année qui a servi de référence à la fenêtre d'ancienneté. */
  anneeReference: number;
  /** ISO 8601. */
  consulteLe: string;
};

export type Face3Snapshot = {
  center: LngLat;
  bpe: { categories: BpeNearest[] };
  osm: OsmProximity;
  icu?: IcuSnapshot;
  /**
   * OPTIONNEL, ET IL DOIT LE RESTER. Absent veut dire « le registre n'a pas été consulté » : les
   * snapshots figés avant le 01/08/2026 ne portent pas ce champ, et une panne de l'API en cours
   * d'analyse le laisse absent. Dans les deux cas le bloc DISPARAÎT, au lieu d'annoncer une
   * absence de permis qui n'a jamais été établie.
   */
  permis?: PermisSnapshot;
  sourceStatus: {
    bpe: "complete" | "failed";
    osmInfrastructure: "complete" | "pending" | "failed";
    osmGreenSpaces: "complete" | "pending" | "failed";
  };
  sources: { bpeVersion: string; osmFetchedAt: string | null; osmQueryVersion: string };
  sourcesVersion: string;
  computedAt: string;
};

export const FACE3_CATS: Face3Cat[] = ["sante", "alimentation", "education", "transports", "services"];
export const BPE_CAP_M = 3000; // cap de recherche v1 (commun). Affinable par famille plus tard.
