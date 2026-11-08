// FUT-170 · LE CLIMAT RÉCENT D'UNE COMMUNE, LU DANS SON FICHIER DÉRIVÉ. Module PUR (aucune I/O), client et serveur.
//
// Le fichier `src/data/climat-recent-communes.json` est produit par `scripts/build-climat-recent.mjs` à partir de la
// réanalyse SAFRAN de Météo-France (`scripts/climat-recent/agreger_safran.py`), au point de grille que DRIAS
// attribue à la commune : le climat récent et la projection se lisent sur la MÊME maille de 8 km. Méthode, contrôles
// et limites : docs/audits/2026-11-08-reference-climatique-recente.md.
//
// CE QUE CE N'EST PAS : une valeur actuelle, une mesure à l'adresse ou celle d'une station. Une moyenne d'années
// nommées, sur un secteur de 8 km.
import type { ClimatRecentChaleur } from "./pastilles.ts";

export type FichierClimatRecent = {
  schema: number;
  periode: [number, number];
  source: { fichier: string; sha256: string; producteur: string; jeu: string; licence: string; page: string };
  cles: string[];
  communes: Record<string, number[]>;
};

const CLES_ATTENDUES = ["tx35", "tx30", "tr20"];

/** Le fichier est-il lisible par ce module ? Une forme inattendue lève : mieux vaut aucune lecture qu'une fausse. */
export function verifierFichier(f: FichierClimatRecent): void {
  if (f.schema !== 1) throw new Error(`climat récent : schéma ${f.schema}, attendu 1`);
  if (f.cles.join() !== CLES_ATTENDUES.join()) throw new Error(`climat récent : clés ${f.cles.join()}, attendu ${CLES_ATTENDUES.join()}`);
  const [d, fin] = f.periode;
  if (!(Number.isInteger(d) && Number.isInteger(fin) && fin >= d)) throw new Error(`climat récent : période ${f.periode}`);
}

/**
 * Le climat récent d'une commune (code déjà résolu : Paris, Lyon, Marseille passent par leur 1er arrondissement,
 * comme DRIAS). `null` : commune absente du fichier (outre-mer, code inconnu) ou valeur non finie ; jamais un zéro.
 */
export function climatRecentDepuisFichier(f: FichierClimatRecent, insee: string): ClimatRecentChaleur | null {
  if (/^9[78]/.test(insee)) return null;
  const v = f.communes[insee];
  if (!v || v.length !== 3 || !v.every((x) => typeof x === "number" && Number.isFinite(x) && x >= 0)) return null;
  const [jours, jours30, nuits] = v as [number, number, number];
  return { periode: f.periode, jours, jours30, nuits };
}
