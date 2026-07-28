import "server-only";

import { readSolPollution, type SolPollutionLu } from "./cartofriches-pollution";
import { bboxAround } from "./geo-distance";

const BASE = "https://data.ademe.fr/data-fair/api/v1/datasets/59gkmzgmbjypm6yjqzunjmto";

/**
 * LE RAYON DE RECHERCHE, et rien d'autre. Il dit « nous cherchons les friches recensées à moins d'un
 * kilomètre » — il ne dit PAS « au-delà, une friche est sans enjeu ». La portée réelle d'un site
 * dépend de sa nature, de sa taille, du type de pollution et des voies de transfert, qu'aucune de
 * nos sources ne décrit.
 *
 * Convention de produit calibrée sur une mesure (10 adresses réelles, 29/07/2026) : à 3 km il y a
 * 38,6 friches par adresse en moyenne — 157 autour d'une adresse lilloise — soit le mur de bruit que
 * la doctrine appelle crier au loup. À 1 km : 6,2 friches, dont 0,3 en pollution avérée ou supposée.
 */
export const CARTOFRICHES_RAYON_RECHERCHE_M = 1000;

// Plafond de récupération, très au-dessus du pire cas observé (157 friches dans 3 km à Lille). Il
// n'est pas une garantie : `tronque` dit si la fenêtre en contenait davantage.
const FETCH_MAX = 500;

// ── Types ────────────────────────────────────────────────────────────────────

export type Friche = {
  id: string;
  nom: string;
  type: string | null;
  statut: string | null;
  commune: string | null;
  adresse: string | null;
  latitude: number | null;
  longitude: number | null;
  /**
   * DISTANCE AU POINT DE RÉFÉRENCE DU SITE, jamais à sa limite. Cartofriches ne diffuse qu'un point
   * (`_geopoint`), pas un contour : une friche étendue dont le point est à 1,1 km peut commencer à
   * 400 m, et l'inverse est vrai aussi. Toute formulation doit donc dire « une friche est recensée à
   * environ 420 m », jamais « le terrain pollué commence à 420 m ».
   *
   * `null` = coordonnées absentes ou illisibles. Ce n'est PAS une distance nulle : ces lignes sont
   * écartées du classement et comptées dans `sansCoordonnees`.
   */
  distanceM: number | null;
  // L'ÉTAT DE CONNAISSANCE + LE LIBELLÉ BRUT, pas un booléen. `sol_pollue: boolean` a valu `false`
  // pour les 28 373 friches de France, parce qu'il testait des valeurs que le champ ne porte jamais
  // — et parce qu'un booléen ne peut pas distinguer « inconnu » (86,6 %) de « pollution
  // inexistante » (1,9 %). Le brut permet de voir arriver une modalité nouvelle.
  // Cf. `cartofriches-pollution.ts`.
  solPollution: SolPollutionLu;
  sol_pollution_origine: string | null;
  bati_pollution: string | null;
  activite: string | null;
  activite_fin_annee: number | null;
  urba_zone: string | null;
  zonage_enviro: string | null;
};

export type CartofrichesResult = {
  count: number;
  friches: Friche[];
  /**
   * LA LISTE DES CANDIDATS A-T-ELLE PU ÊTRE COUPÉE avant le tri par distance ? Si oui, « la friche
   * la plus proche » n'est PAS une réponse : c'est la plus proche d'un sous-ensemble. C'est
   * exactement le défaut que `size: 20` produisait — le relever à 500 le rend improbable, pas
   * impossible. L'invariant : ne jamais prétendre au plus proche quand ce drapeau est levé.
   */
  tronque: boolean;
  /**
   * Lignes écartées faute de coordonnées lisibles. Elles ne sont ni proches ni lointaines : elles ne
   * sont pas situables, et une distance nulle les mettrait en tête. Comptées pour qu'une source qui
   * se dégrade se voie, plutôt que de disparaître dans un filtre.
   */
  sansCoordonnees: number;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const SELECT = [
  "site_id",
  "site_nom",
  "site_type",
  "site_statut",
  "comm_nom",
  "comm_insee",
  "site_adresse",
  "_geopoint",
  "sol_pollution_existe",
  "sol_pollution_origine",
  "bati_pollution",
  "activite_libelle",
  "activite_fin_annee",
  "urba_zone_lib",
  "zonage_enviro",
].join(",");

type ApiRecord = {
  site_id: string;
  site_nom?: string | null;
  site_type?: string | null;
  site_statut?: string | null;
  comm_nom?: string | null;
  comm_insee?: string | null;
  site_adresse?: string | null;
  _geopoint?: string | null;
  sol_pollution_existe?: boolean | string | null;
  sol_pollution_origine?: string | null;
  bati_pollution?: string | null;
  activite_libelle?: string | null;
  activite_fin_annee?: number | null;
  urba_zone_lib?: string | null;
  zonage_enviro?: string | null;
};

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R  = 6_371_000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const dφ = ((lat2 - lat1) * Math.PI) / 180;
  const dλ = ((lon2 - lon1) * Math.PI) / 180;
  const a  = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toFriche(r: ApiRecord, refLat?: number, refLon?: number): Friche {
  let lat: number | null = null;
  let lon: number | null = null;
  if (r._geopoint) {
    const parts = r._geopoint.split(",");
    lat = parseFloat(parts[0]);
    lon = parseFloat(parts[1]);
  }
  return {
    id:                    r.site_id,
    nom:                   r.site_nom ?? r.site_id,
    type:                  r.site_type ?? null,
    statut:                r.site_statut ?? null,
    commune:               r.comm_nom ?? null,
    adresse:               r.site_adresse ?? null,
    latitude:              lat,
    longitude:             lon,
    distanceM:             lat != null && lon != null && refLat != null && refLon != null
                             ? Math.round(haversineM(refLat, refLon, lat, lon))
                             : null,
    solPollution:          readSolPollution(r.sol_pollution_existe),
    sol_pollution_origine: r.sol_pollution_origine ?? null,
    bati_pollution:        r.bati_pollution ?? null,
    activite:              r.activite_libelle ?? null,
    activite_fin_annee:    r.activite_fin_annee ?? null,
    urba_zone:             r.urba_zone_lib ?? null,
    zonage_enviro:         r.zonage_enviro ?? null,
  };
}

/**
 * Rend les lignes ET le total annoncé par l'API. Le total n'est pas décoratif : c'est lui qui permet
 * de savoir si la fenêtre contenait plus d'objets qu'on n'en a reçus — donc si un tri par distance
 * porte sur l'ensemble des candidats ou sur un échantillon.
 */
async function fetchLines(params: Record<string, string>): Promise<{ rows: ApiRecord[]; total: number | null }> {
  const url = new URL(`${BASE}/lines`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("select", SELECT);
  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!res.ok) return { rows: [], total: null };
  const json = (await res.json()) as { results?: ApiRecord[]; total?: number };
  return { rows: json.results ?? [], total: typeof json.total === "number" ? json.total : null };
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Les friches D'UNE COMMUNE. Aucune distance : ces friches sont quelque part dans la commune, et rien
 * ne dit qu'elles sont près d'une adresse donnée. Pour une lecture d'adresse, utiliser
 * `getCartofrichesNearPoint` — c'est la correction du 29/07/2026.
 */
export async function getCartofrichesForCommune(inseeCode: string): Promise<CartofrichesResult> {
  const { rows, total } = await fetchLines({ qs: `comm_insee:"${inseeCode}"`, size: "50" });
  return {
    count:   rows.length,
    friches: rows.map((r) => toFriche(r)),
    tronque: total != null && total > rows.length,
    sansCoordonnees: 0, // sans point de référence, la question ne se pose pas ici
  };
}

/**
 * Les friches AUTOUR D'UN POINT, triées de la plus proche. Deux défauts corrigés le 29/07/2026, tous
 * deux mesurés — et tous deux produisaient une fausse « friche la plus proche ».
 *
 * 1. LA BBOX ÉTAIT PLUS ÉTROITE QUE LE RAYON, d'est en ouest. Le calcul vit désormais dans
 *    `bboxAround` (`geo-distance.ts`, pure et testée) : la logique qui a menti ne doit pas rester
 *    enfermée dans une fonction d'I/O.
 *
 * 2. LE PLAFOND MORDAIT AVANT LE TRI. `size: 20` prenait vingt lignes dans l'ordre de l'API, et le
 *    tri par distance venait après : la « plus proche » n'était que la plus proche de vingt friches
 *    tirées arbitrairement. Mesuré sur une adresse lilloise : 314 m annoncés, 78 m réels.
 *
 * Le plafond reste (une adresse dense peut voir des centaines de friches), mais il s'applique
 * APRÈS le tri, donc il coupe la queue, jamais la tête.
 */
export async function getCartofrichesNearPoint(
  latitude: number,
  longitude: number,
  radiusM = CARTOFRICHES_RAYON_RECHERCHE_M,
  max = 20,
): Promise<CartofrichesResult> {
  const b = bboxAround({ lat: latitude, lon: longitude }, radiusM);
  const bbox = `${b.minLon},${b.minLat},${b.maxLon},${b.maxLat}`;
  const { rows, total } = await fetchLines({ bbox, size: String(FETCH_MAX) });

  // LA FENÊTRE PRÉSÉLECTIONNE, ELLE NE CONCLUT PAS : ses coins sont hors du disque. Seule la
  // distance géodésique décide de l'appartenance au rayon.
  const situables = rows.map((r) => toFriche(r, latitude, longitude)).filter((f) => f.distanceM != null);
  const friches = situables
    .filter((f) => f.distanceM! <= radiusM)
    .sort((a, b2) => a.distanceM! - b2.distanceM!)
    .slice(0, max);

  return {
    count: friches.length,
    friches,
    // Le total porte sur la FENÊTRE, pas sur le disque : si elle a été coupée, des objets plus
    // proches ont pu ne jamais arriver, et le tri ne porte alors que sur un échantillon.
    tronque: total != null && total > rows.length,
    sansCoordonnees: rows.length - situables.length,
  };
}
