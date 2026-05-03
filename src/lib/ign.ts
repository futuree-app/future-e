import "server-only";

const IGN_ALTI_URL =
  "https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json";
const REQUEST_TIMEOUT_MS = 6000;

type ElevationResponse = {
  elevations?: number[] | null;
};

const altitudeCache = new Map<string, Promise<number | null>>();

async function loadAltitude(latitude: number, longitude: number): Promise<number | null> {
  const params = new URLSearchParams({
    lon: String(longitude),
    lat: String(latitude),
    resource: "ign_rge_alti_wld",
    delimiter: ";",
    indent: "false",
    measures: "false",
    zonly: "true",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${IGN_ALTI_URL}?${params}`, {
      signal: controller.signal,
      next: { revalidate: 86400 },
    });

    if (!res.ok) throw new Error(`IGN altimétrie failed: ${res.status}`);

    const json = (await res.json()) as ElevationResponse;
    const alt = json.elevations?.[0];
    return typeof alt === "number" && isFinite(alt) ? Math.round(alt * 10) / 10 : null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getAltitude(latitude: number, longitude: number): Promise<number | null> {
  const key = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;

  if (!altitudeCache.has(key)) {
    altitudeCache.set(key, loadAltitude(latitude, longitude).catch(() => null));
  }

  return altitudeCache.get(key)!;
}
