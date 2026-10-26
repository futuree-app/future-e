import "server-only";
import { identiteDepuisRnb, idsDesBatiments, type IdentiteBatiment } from "./batiment-rnb.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LE RÉFÉRENTIEL NATIONAL DES BÂTIMENTS, INTERROGÉ PAR L'ADRESSE (FUT-80).
//
// API publique, sans jeton, Licence Ouverte 2.0. Mesuré le 26/10/2026 sur 1 825 appels : médiane
// 85 ms, 95e centile 126 ms ; débit annoncé de 20 requêtes par seconde (`ratelimit-policy`). Un
// dossier en fait une, deux au plus avec la vérification d'un diagnostic saisi par son numéro.
//
// UNE PANNE NE BLOQUE RIEN ET NE SE PRÉSENTE JAMAIS COMME UNE ABSENCE. Délai borné à 5 s ; au-delà,
// ou sur toute erreur, l'identité est `indisponible`, et le dossier se construit sans elle.
// ════════════════════════════════════════════════════════════════════════════════════════════

const RNB = "https://rnb-api.beta.gouv.fr/api/alpha/buildings/";
const DELAI_MS = 5_000;

export async function lookupBatimentByBanId(banId: string): Promise<IdentiteBatiment> {
  const url = new URL(RNB);
  url.searchParams.set("cle_interop_ban", banId);
  try {
    // Le référentiel évolue chaque semaine : une journée de cache suffit, comme pour l'ADEME.
    const res = await fetch(url.toString(), { next: { revalidate: 86400 }, signal: AbortSignal.timeout(DELAI_MS) });
    if (!res.ok) return { statut: "indisponible" };
    return identiteDepuisRnb(await res.json(), new Date().toISOString());
  } catch {
    return { statut: "indisponible" };
  }
}

/**
 * Les bâtiments d'une adresse, pour vérifier un diagnostic désigné. Vide si le référentiel ne
 * répond pas : la vérification retombe alors sur l'adresse seule, comme avant FUT-80.
 */
export async function batimentsDeLAdresse(banId: string): Promise<string[]> {
  return idsDesBatiments(await lookupBatimentByBanId(banId));
}
