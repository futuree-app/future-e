import "server-only";

import { readSolPollution, type SolPollutionLu } from "./cartofriches-pollution";
import { bboxAround } from "./geo-distance";

const BASE = "https://data.ademe.fr/data-fair/api/v1/datasets/59gkmzgmbjypm6yjqzunjmto";

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

async function fetchLines(params: Record<string, string>): Promise<ApiRecord[]> {
  const url = new URL(`${BASE}/lines`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("select", SELECT);
  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!res.ok) return [];
  const json = (await res.json()) as { results?: ApiRecord[] };
  return json.results ?? [];
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function getCartofrichesForCommune(inseeCode: string): Promise<CartofrichesResult> {
  const rows = await fetchLines({ qs: `comm_insee:"${inseeCode}"`, size: "50" });
  return {
    count:   rows.length,
    friches: rows.map((r) => toFriche(r)),
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
  radiusM = 3000,
  max = 20,
): Promise<CartofrichesResult> {
  const b = bboxAround({ lat: latitude, lon: longitude }, radiusM);
  const bbox = `${b.minLon},${b.minLat},${b.maxLon},${b.maxLat}`;
  const rows = await fetchLines({ bbox, size: "500" });
  const friches = rows
    .map((r) => toFriche(r, latitude, longitude))
    .filter((f) => f.distanceM == null || f.distanceM <= radiusM)
    .sort((a, b) => (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity))
    .slice(0, max);
  return { count: friches.length, friches };
}
