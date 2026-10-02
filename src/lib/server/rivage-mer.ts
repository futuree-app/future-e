import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import { construireIndexRivage, distanceAuRivageKm, type IndexRivage } from "../mer-rivage.ts";
import { MER_PROVENANCE, type MerAuPoint } from "../hard-constraints.ts";

// LE RIVAGE MARIN, CHARGÉ UNE FOIS PAR INSTANCE (FUT-33, phase 2B.2 C).
//
// `data/mer/rivage-5m.f32.gz` (2,3 Mo) : 410 002 segments, décompressés en 6,6 Mo, indexés en grille de 5 km.
// Aucun appel réseau : la géométrie voyage avec le déploiement (outputFileTracingIncludes, next.config.ts).
//
// UN ÉCHEC NE DEVIENT JAMAIS UNE DISTANCE. Fichier absent ou illisible : la mesure est `unavailable`, la
// condition à l'adresse n'est pas examinée, et le centre de la commune ne la remplace pas. L'échec n'est pas
// mémorisé (contrairement à l'index national) : une instance qui a raté une lecture la retente à l'appel suivant.
const RIVAGE_PATH = path.join(process.cwd(), "data", "mer", "rivage-5m.f32.gz");

let chargement: Promise<IndexRivage> | null = null;

function indexRivage(): Promise<IndexRivage> {
  chargement ??= (async () => {
    const brut = zlib.gunzipSync(await readFile(RIVAGE_PATH));
    // Copie alignée : un Buffer issu de gunzip peut ne pas commencer sur une frontière de 4 octets.
    const segments = new Float32Array(brut.byteLength / 4);
    new Uint8Array(segments.buffer).set(brut);
    return construireIndexRivage(segments);
  })().catch((e) => {
    chargement = null;
    throw e;
  });
  return chargement;
}

/** La distance au rivage marin d'une ADRESSE (lat/lon WGS84). Jamais celle du centre de la commune. */
export async function mesurerMerAdresse(lat: number, lon: number): Promise<MerAuPoint> {
  try {
    const km = distanceAuRivageKm(await indexRivage(), lat, lon);
    return km == null ? { status: "unavailable" } : { status: "measured", km, grain: "address", version: MER_PROVENANCE.version };
  } catch (e) {
    console.error("[rivage-mer] distance indisponible", e);
    return { status: "unavailable" };
  }
}
