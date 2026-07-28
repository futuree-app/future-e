// LA RÉSOLUTION DE L'IRIS QUI CONTIENT UN POINT, via le WFS de la Géoplateforme IGN — source
// officielle des contours IRIS, gratuite et sans clé.
//
// Elle est ISOLÉE ici parce qu'elle sert à plusieurs lectures du même secteur : l'îlot de chaleur
// (`icu.ts`, au grand-IRIS) et l'équipement automobile des ménages (`iris-logement.ts`). Une adresse
// ne doit être résolue qu'une fois, et le jour où l'on change de source de contours, un seul endroit
// change.
//
// PIÈGE, coûteux et silencieux : en WFS 2.0 / EPSG:4326, le filtre attend POINT(lat lon). L'ordre
// inverse ne lève aucune erreur — il renvoie simplement zéro feature, donc « pas d'IRIS ici ».

/**
 * Le code IRIS (9 caractères) contenant le point. `null` si non résolu ou source en panne : les deux
 * se lisent pareil côté produit (le bloc disparaît), jamais une erreur d'interface.
 */
export async function resolveIrisByPoint(lat: number, lon: number): Promise<string | null> {
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
