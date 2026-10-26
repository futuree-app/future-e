import "server-only";
import { identiteDepuisRnb, type IdentiteBatiment } from "./batiment-rnb.ts";

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
/** Taille de page maximale de l'API (100, la valeur par défaut est 20). Une adresse en porte au plus 7
 *  dans l'échantillon du 26/10/2026 : une page suffit, la suite n'est lue que si `next` l'annonce. */
const TAILLE = 100;
const PAGES_MAX = 3;

/**
 * LES PAGES, TOUTES OU RIEN (revue indépendante du 26/10/2026). La réponse est paginée (`next`) ; une
 * première page à un bâtiment ne prouve pas qu'il est seul. Les pages suivantes sont lues tant que `next`
 * en annonce, sur le même hôte seulement (une URL venue d'une réponse ne choisit pas où l'on va). Au-delà
 * de `PAGES_MAX`, ou sur un `next` étranger, la réponse reste incomplète et `identiteDepuisRnb` la rend
 * non vérifiable.
 */
async function lirePages(premiere: string): Promise<unknown> {
  const results: unknown[] = [];
  let url: string | null = premiere;
  for (let page = 0; url && page < PAGES_MAX; page++) {
    const res = await fetch(url, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(DELAI_MS) });
    if (!res.ok) return null;
    const corps = (await res.json()) as { results?: unknown; next?: unknown } | null;
    if (!Array.isArray(corps?.results)) return null;
    results.push(...corps.results);
    const suivante = typeof corps.next === "string" ? corps.next : null;
    if (corps.next != null && !suivante) return { results, next: corps.next };
    url = suivante && new URL(suivante).origin === new URL(RNB).origin ? suivante : null;
    if (suivante && !url) return { results, next: suivante };
  }
  return { results, next: url };
}

export async function lookupBatimentByBanId(banId: string): Promise<IdentiteBatiment> {
  const url = new URL(RNB);
  url.searchParams.set("cle_interop_ban", banId);
  url.searchParams.set("limit", String(TAILLE));
  try {
    // Le référentiel évolue chaque semaine : une journée de cache suffit, comme pour l'ADEME.
    const corps = await lirePages(url.toString());
    if (corps == null) return { statut: "indisponible" };
    return identiteDepuisRnb(corps, new Date().toISOString());
  } catch {
    return { statut: "indisponible" };
  }
}
