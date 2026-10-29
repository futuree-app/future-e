import "server-only";
import {
  CHEMIN, PAGES_MAX, PAGES_MAX_CASIAS, SITES_SOLS_SOURCE, TAILLE_PAGE, lireCasias, lireCategorie, lotIncomplet, lots, pageLisible, perimetreDe,
  type CategorieListee, type PageSsp, type SitesSolsCommune,
} from "@/lib/sites-sols";
import { EN_TETES_GEORISQUES, tracerEchecGeorisques } from "@/lib/georisques-http";

// L'APPEL À L'API GÉORISQUES « sites et sols » (FUT-152). Service officiel documenté (spécification OpenAPI
// v1, `/api/v1/ssp/*`), sans jeton. L'ancien proxy visait `data.georisques.gouv.fr/api/v1/sis` : hôte
// inexistant (NXDOMAIN), donc une recherche en panne sur toutes les communes depuis sa mise en ligne.
//
// Géorisques ne répond qu'aux adresses IP françaises (depuis le 26/09/2026) : les fonctions tournent à
// Paris (`vercel.json`, `regions: ["cdg1"]`). Ailleurs, chaque appel échoue et l'écran dit « indisponible ».
//
// Ne lève jamais : chaque catégorie porte son propre état. Une panne n'est jamais une liste vide.

const TIMEOUT_MS = 8000;
// LE TRANSPORT COMMUN DE FUT-158 (`lib/georisques-http.ts`) : les mêmes en-têtes que tous les appels Géorisques
// (`Accept-Encoding: identity`, sans lequel Géorisques coupe une partie des connexions), et la même trace
// `georisques_echec` dans les journaux quand un appel n'aboutit pas.
const UNE_JOURNEE = 86_400;

async function page(chemin: string, codes: string[], numero: number, taille: number): Promise<PageSsp | null> {
  const url = new URL(`${SITES_SOLS_SOURCE.api}/${chemin}`);
  url.searchParams.set("code_insee", codes.join(","));
  url.searchParams.set("page", String(numero));
  url.searchParams.set("page_size", String(taille));
  try {
    const res = await fetch(url, {
      headers: EN_TETES_GEORISQUES,
      next: { revalidate: UNE_JOURNEE },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      tracerEchecGeorisques(url.toString(), { statut: res.status });
      return null;
    }
    return (await res.json()) as PageSsp;
  } catch (e) {
    tracerEchecGeorisques(url.toString(), { erreur: e });
    return null;
  }
}

/** Toutes les pages d'un lot, jusqu'au plafond. `incomplet` quand des lignes annoncées n'ont pas été lues. */
async function toutesLesPages(chemin: string, codes: string[], plafond = PAGES_MAX): Promise<{ pages: (PageSsp | null)[]; incomplet: boolean }> {
  const premiere = await page(chemin, codes, 1, TAILLE_PAGE);
  if (!premiere || !pageLisible(premiere)) return { pages: [premiere], incomplet: false };
  const totalPages = typeof premiere.total_pages === "number" && Number.isInteger(premiere.total_pages) ? premiere.total_pages : 1;
  const suivantes = await Promise.all(
    Array.from({ length: Math.min(totalPages, plafond) - 1 }, (_, i) => page(chemin, codes, i + 2, TAILLE_PAGE)),
  );
  const pages = [premiere, ...suivantes];
  return { pages, incomplet: lotIncomplet(pages, plafond) };
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
    // CASIAS se compte par identifiant distinct : toutes ses pages sont lues (Paris : 9 pages de 1 000, environ
    // 4 Mo, une fois par jour grâce au cache), et seul le nombre est rendu.
    Promise.all(groupes.map((g) => toutesLesPages(CHEMIN.casias, g, PAGES_MAX_CASIAS)))
      .then((lus) => lireCasias(lus.flatMap((l) => l.pages), lus.some((l) => l.incomplet))),
  ]);
  return { perimetre, consulteLe: new Date().toISOString(), sis, instructions, sup, casias };
}
