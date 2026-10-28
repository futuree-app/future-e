import "server-only";
import {
  CHEMIN, PAGES_MAX, SITES_SOLS_SOURCE, TAILLE_PAGE, lireCasias, lireCategorie, lots, pageLisible, perimetreDe,
  type CategorieListee, type PageSsp, type SitesSolsCommune,
} from "@/lib/sites-sols";

// L'APPEL À L'API GÉORISQUES « sites et sols » (FUT-152). Service officiel documenté (spécification OpenAPI
// v1, `/api/v1/ssp/*`), sans jeton. L'ancien proxy visait `data.georisques.gouv.fr/api/v1/sis` : hôte
// inexistant (NXDOMAIN), donc une recherche en panne sur toutes les communes depuis sa mise en ligne.
//
// Géorisques ne répond qu'aux adresses IP françaises (depuis le 26/09/2026) : les fonctions tournent à
// Paris (`vercel.json`, `regions: ["cdg1"]`). Ailleurs, chaque appel échoue et l'écran dit « indisponible ».
//
// Ne lève jamais : chaque catégorie porte son propre état. Une panne n'est jamais une liste vide.

const TIMEOUT_MS = 8000;
// LES EN-TÊTES COMPTENT (mesuré le 28/10/2026). Géorisques coupe la connexion (ECONNRESET, « fetch failed »)
// quand la requête porte `Accept: application/json`, ou quand `fetch` côté Node n'envoie pas de User-Agent
// explicite. La même requête passe avec un User-Agent nommé et l'`Accept` par défaut. Reproduit avec curl
// (`-H "Accept: application/json"` : connexion coupée). Ne pas « corriger » en ajoutant un Accept JSON.
const USER_AGENT = "futur-e/pollutions-invisibles (contact: futur-e.app)";
const UNE_JOURNEE = 86_400;

async function page(chemin: string, codes: string[], numero: number, taille: number): Promise<PageSsp | null> {
  const url = new URL(`${SITES_SOLS_SOURCE.api}/${chemin}`);
  url.searchParams.set("code_insee", codes.join(","));
  url.searchParams.set("page", String(numero));
  url.searchParams.set("page_size", String(taille));
  try {
    const res = await fetch(url, {
      headers: { "user-agent": USER_AGENT },
      next: { revalidate: UNE_JOURNEE },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return (await res.json()) as PageSsp;
  } catch {
    return null;
  }
}

/** Toutes les pages d'un lot, jusqu'au plafond. `incomplet` quand le plafond coupe la liste. */
async function toutesLesPages(chemin: string, codes: string[]): Promise<{ pages: (PageSsp | null)[]; incomplet: boolean }> {
  const premiere = await page(chemin, codes, 1, TAILLE_PAGE);
  if (!premiere || !pageLisible(premiere)) return { pages: [premiere], incomplet: false };
  const totalPages = typeof premiere.total_pages === "number" && Number.isInteger(premiere.total_pages) ? premiere.total_pages : 1;
  const suivantes = await Promise.all(
    Array.from({ length: Math.min(totalPages, PAGES_MAX) - 1 }, (_, i) => page(chemin, codes, i + 2, TAILLE_PAGE)),
  );
  return { pages: [premiere, ...suivantes], incomplet: totalPages > PAGES_MAX };
}

async function categorie(cat: CategorieListee, groupes: string[][]) {
  const lus = await Promise.all(groupes.map((g) => toutesLesPages(CHEMIN[cat], g)));
  return lireCategorie(lus.flatMap((l) => l.pages), lus.some((l) => l.incomplet));
}

/** Les quatre inventaires d'une commune (avec ses arrondissements et ses anciens codes). */
export async function getSitesSolsCommune(insee: string): Promise<SitesSolsCommune> {
  const perimetre = perimetreDe(insee);
  const groupes = lots(perimetre.codes);
  const [sis, instructions, sup, casias] = await Promise.all([
    categorie("sis", groupes),
    categorie("instructions", groupes),
    categorie("sup", groupes),
    // CASIAS se compte : une page d'une ligne suffit à lire le total.
    Promise.all(groupes.map((g) => page(CHEMIN.casias, g, 1, 1))).then(lireCasias),
  ]);
  return { perimetre, consulteLe: new Date().toISOString(), sis, instructions, sup, casias };
}
