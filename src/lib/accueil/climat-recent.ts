// FUT-170 · LE CLIMAT RÉCENT D'UNE COMMUNE, LU DANS SON FICHIER DÉRIVÉ. Module PUR (aucune I/O), client et serveur.
//
// Le fichier `src/data/climat-recent-communes.json` est produit par `scripts/build-climat-recent.mjs` à partir de la
// réanalyse SAFRAN de Météo-France (`scripts/climat-recent/agreger_safran.py`), au point de grille que DRIAS
// attribue à la commune : le climat récent et la projection se lisent sur la MÊME maille de 8 km. Méthode, contrôles
// et limites : docs/audits/2026-11-08-reference-climatique-recente.md.
//
// CE QUE CE N'EST PAS : une valeur actuelle, une mesure à l'adresse ou celle d'une station. Une moyenne d'années
// nommées, sur un secteur de 8 km. Les STATIONS de ce secteur, quand il en a, voyagent à côté : des témoins de la
// représentativité de la maille (contre-revue du 08/11/2026), jamais une valeur substituée à celle de la maille.
//
// Schéma 2 (08/11/2026) : nuits tropicales au sens strict de DRIAS (Tmin > 20 °C), stations témoins.
import type { ClimatRecentChaleur, StationTemoin } from "./pastilles.ts";

export type FichierClimatRecent = {
  schema: number;
  periode: [number, number];
  source: { fichier: string; sha256: string; producteur: string; jeu: string; licence: string; page: string };
  cles: string[];
  cles_station: string[];
  communes: Record<string, number[]>;
  /** Par commune : [nom, altitude (m, ou null), années complètes, tx35, tx30, tr20, distance (km)], moyennes. */
  stations: Record<string, unknown[][]>;
};

const CLES_ATTENDUES = ["tx35", "tx30", "tr20"];
const CLES_STATION = ["nom", "altitude", "annees", "tx35", "tx30", "tr20", "distance_km"];

/** Le fichier est-il lisible par ce module ? Une forme inattendue lève : mieux vaut aucune lecture qu'une fausse. */
export function verifierFichier(f: FichierClimatRecent): void {
  if (f.schema !== 2) throw new Error(`climat récent : schéma ${f.schema}, attendu 2`);
  if (f.cles.join() !== CLES_ATTENDUES.join()) throw new Error(`climat récent : clés ${f.cles.join()}, attendu ${CLES_ATTENDUES.join()}`);
  if (f.cles_station?.join() !== CLES_STATION.join()) throw new Error(`climat récent : clés de station ${f.cles_station}`);
  const [d, fin] = f.periode;
  if (!(Number.isInteger(d) && Number.isInteger(fin) && fin >= d)) throw new Error(`climat récent : période ${f.periode}`);
}

const compte = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x) && x >= 0;

/** Les stations du secteur de la commune (Paris, Lyon, Marseille : celles de leur 1er arrondissement). */
function stationsDe(f: FichierClimatRecent, insee: string): StationTemoin[] {
  const out: StationTemoin[] = [];
  for (const l of f.stations[insee] ?? []) {
    const [nom, altitude, annees, jours, jours30, nuits, distanceKm] = l;
    if (typeof nom !== "string" || !(altitude === null || compte(altitude)) || ![annees, jours, jours30, nuits, distanceKm].every(compte)) continue;
    out.push({ nom, altitude, annees, jours, jours30, nuits, distanceKm } as StationTemoin);
  }
  return out;
}

/**
 * Le climat récent d'une commune. `maille` : le code déjà résolu (Paris, Lyon, Marseille passent par leur
 * 1er arrondissement, comme DRIAS) ; `commune` : le code demandé, sous lequel sont rangées les stations de sa maille.
 * `null` : commune absente du fichier (outre-mer, code inconnu) ou valeur non finie ; jamais un zéro.
 */
export function climatRecentDepuisFichier(f: FichierClimatRecent, maille: string, commune: string = maille): ClimatRecentChaleur | null {
  if (/^9[78]/.test(maille)) return null;
  const v = f.communes[maille];
  if (!v || v.length !== 3 || !v.every(compte)) return null;
  const [jours, jours30, nuits] = v as [number, number, number];
  return { periode: f.periode, jours, jours30, nuits, stations: stationsDe(f, commune) };
}
