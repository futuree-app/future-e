import fs from "node:fs/promises";
import path from "node:path";

// ─── Îlot de chaleur urbain (ICU) au grain grand-IRIS, pour le module Logement ───
// Source : CSTB « Cartographie nationale des indicateurs liés à l'îlot de chaleur urbain »
// (data.gouv, licence ouverte lov2, déc. 2024). La colonne `iuhi` = INTENSITÉ MAXIMALE ABSOLUE de
// l'îlot de chaleur urbain en été, EN DEGRÉS CELSIUS (écart de température de l'air du quartier vs
// une zone de référence peu urbanisée ; PDF méthodo §2.1). Ce n'est PAS un score normalisé.
// Couverture : 1955 grand-IRIS (densité >1000 hab/km² ET végétation <45 %) sur 596 communes.
// Hors couverture = non couvert -> pas de bloc (jamais « non renseigné », qui se lirait « pas de
// problème »). C'est un fait d'ENVIRONNEMENT (quartier), pas la température intérieure du logement.
//
// Résolution : lat/lon -> code_iris via l'IGN Géoplateforme WFS (officiel, gratuit, sans clé),
// puis grand-IRIS = les 7 premiers caractères du code_iris. Join vérifié (IRIS 751041304 du 4e
// arrondissement -> grand-IRIS 7510413, présent dans le CSTB).

export type IcuLevel = "marque" | "present";
export type IcuSignal = { iuhi: number; level: IcuLevel };

// Seuil v1 (décision porteur) : marqué >= 8 °C (rond, ~p80 de la distribution nationale) ; présent
// en dessous. Deux niveaux seulement : tout l'échantillon est déjà urbain (+4,5 °C minimum), un
// niveau « faible » minimiserait un écart qui reste réel.
const MARQUE_MIN_C = 8;

let indexCache: Record<string, number> | null = null;
async function getIndex(): Promise<Record<string, number>> {
  if (indexCache) return indexCache;
  const raw = await fs.readFile(path.join(process.cwd(), "data", "icu.json"), "utf8");
  indexCache = JSON.parse(raw) as Record<string, number>;
  return indexCache;
}

// lat/lon -> code_iris (9 car.) via IGN Géoplateforme WFS. null si non résolu ou panne (silencieux :
// le bloc ICU disparaît, jamais d'erreur UI). PIÈGE : WFS 2.0 en EPSG:4326 attend l'ordre
// POINT(lat lon) — l'ordre inverse renvoie 0 feature.
async function resolveIrisByPoint(lat: number, lon: number): Promise<string | null> {
  const cql = `INTERSECTS(geometrie,POINT(${lat} ${lon}))`;
  const url =
    "https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature" +
    "&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&outputFormat=application/json&count=1" +
    `&CQL_FILTER=${encodeURIComponent(cql)}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { features?: Array<{ properties?: { code_iris?: string } }> };
    return data.features?.[0]?.properties?.code_iris ?? null;
  } catch {
    return null;
  }
}

// Signal ICU pour une adresse. null = non couvert / non résolu / panne (le bloc n'apparaît pas).
export async function getIcuSignal(lat: number, lon: number): Promise<IcuSignal | null> {
  const codeIris = await resolveIrisByPoint(lat, lon);
  if (!codeIris || codeIris.length < 7) return null;
  const index = await getIndex();
  const iuhi = index[codeIris.slice(0, 7)];
  if (iuhi == null) return null; // grand-IRIS hors couverture CSTB
  return { iuhi, level: iuhi >= MARQUE_MIN_C ? "marque" : "present" };
}
