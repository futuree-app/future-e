import "server-only";
import {
  CHEMIN, PAGES_MAX, PAGES_MAX_CASIAS, SITES_SOLS_SOURCE, TAILLE_PAGE, lireCasias, lireCategorie, lireCategorieGeo, lotIncomplet, lots, pageLisible, perimetreDe,
  type CategorieGeoLue, type CategorieListee, type PageSsp, type SitesSolsCommune,
} from "@/lib/sites-sols";
import { EN_TETES_GEORISQUES, tracerEchecGeorisques } from "@/lib/georisques-http";
import {
  assemblerSansEmprise, lireSitesSolsTerrain, planDeRecherche, sitesSolsIndisponible, type EntreeSitesSols, type LectureSitesSols, type ReponsesSitesSols,
} from "@/lib/sites-sols-terrain";

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

/** La recherche : par codes INSEE (lecture communale), ou autour d'un point (`latlon` = « lon,lat », `rayon` en m). */
type Recherche = { code_insee: string } | { latlon: string; rayon: string };

async function page(chemin: string, recherche: Recherche, numero: number, taille: number): Promise<PageSsp | null> {
  const url = new URL(`${SITES_SOLS_SOURCE.api}/${chemin}`);
  for (const [k, v] of Object.entries(recherche)) url.searchParams.set(k, v);
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
async function toutesLesPages(chemin: string, recherche: Recherche, plafond = PAGES_MAX): Promise<{ pages: (PageSsp | null)[]; incomplet: boolean }> {
  const premiere = await page(chemin, recherche, 1, TAILLE_PAGE);
  if (!premiere || !pageLisible(premiere)) return { pages: [premiere], incomplet: false };
  const totalPages = typeof premiere.total_pages === "number" && Number.isInteger(premiere.total_pages) ? premiere.total_pages : 1;
  const suivantes = await Promise.all(
    Array.from({ length: Math.min(totalPages, plafond) - 1 }, (_, i) => page(chemin, recherche, i + 2, TAILLE_PAGE)),
  );
  const pages = [premiere, ...suivantes];
  return { pages, incomplet: lotIncomplet(pages, plafond) };
}

const parCodes = (codes: string[]): Recherche => ({ code_insee: codes.join(",") });

async function categorie(cat: CategorieListee, groupes: string[][]) {
  const lus = await Promise.all(groupes.map((g) => toutesLesPages(CHEMIN[cat], parCodes(g))));
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
    Promise.all(groupes.map((g) => toutesLesPages(CHEMIN.casias, parCodes(g), PAGES_MAX_CASIAS)))
      .then((lus) => lireCasias(lus.flatMap((l) => l.pages), lus.some((l) => l.incomplet))),
  ]);
  return { perimetre, consulteLe: new Date().toISOString(), sis, instructions, sup, casias };
}

// ── Autour d'un point (FUT-157) ──────────────────────────────────────────────────────────────────

const INVENTAIRES_TERRAIN = ["sis", "sup", "instructions"] as const;

/**
 * LES TROIS INVENTAIRES QUI ONT UNE PORTÉE SUR UN TERRAIN, AUTOUR D'UN POINT, AVEC LEURS GÉOMÉTRIES. La
 * recherche est un préfiltre : l'API rend ce dont la géométrie passe à moins de `rayonM` mètres, et c'est
 * `sites-sols-terrain.ts` qui décide de ce qui concerne le terrain. Trois appels en parallèle (une page
 * suffit à l'échelle d'un terrain ; la pagination reste lue et vérifiée comme pour la commune).
 */
export async function getSitesSolsAutour(lon: number, lat: number, rayonM: number): Promise<Record<(typeof INVENTAIRES_TERRAIN)[number], CategorieGeoLue>> {
  const recherche: Recherche = { latlon: `${lon},${lat}`, rayon: String(Math.round(rayonM)) };
  const lus = await Promise.all(INVENTAIRES_TERRAIN.map((cat) => toutesLesPages(CHEMIN[cat], recherche)));
  return Object.fromEntries(INVENTAIRES_TERRAIN.map((cat, i) => [cat, lireCategorieGeo(lus[i].pages, lus[i].incomplet)])) as Record<(typeof INVENTAIRES_TERRAIN)[number], CategorieGeoLue>;
}

/**
 * LES FICHES DE LA COMMUNE SANS EMPRISE PUBLIÉE : localisées par un simple point, ou sans géométrie, qu'aucune
 * recherche géographique ne situe (mesuré le 30/10/2026 : 2 instructions sans géométrie sur 19 à Metz, 33
 * ponctuelles sur 111 à Lyon). Lecture communale (avec arrondissements et anciens codes), mise en cache une
 * journée comme celle de la page publique. `partiel` dès qu'un inventaire est en panne ou n'a pas été lu en
 * entier : la liste n'est pas établie, mais ce qui a été lu est gardé. `indisponible` quand aucun n'a répondu.
 */
export async function lireSansEmprise(insee: string): Promise<NonNullable<ReponsesSitesSols["sansEmprise"]>> {
  const groupes = lots(perimetreDe(insee).codes);
  const lus = await Promise.all(INVENTAIRES_TERRAIN.map(async (cat) => {
    const l = await Promise.all(groupes.map((g) => toutesLesPages(CHEMIN[cat], parCodes(g))));
    return lireCategorieGeo(l.flatMap((x) => x.pages), l.some((x) => x.incomplet));
  }));
  // Une catégorie en panne ne vide pas les autres (contre-revue du 31/10/2026) : `assemblerSansEmprise`.
  return assemblerSansEmprise(Object.fromEntries(INVENTAIRES_TERRAIN.map((cat, i) => [cat, lus[i]])) as Record<(typeof INVENTAIRES_TERRAIN)[number], CategorieGeoLue>);
}

/**
 * LE TERRAIN D'UNE ADRESSE FACE AUX SOLS POLLUÉS (FUT-157), pour le dossier Logement. Le plan de recherche
 * (parcelle servie, rayon) est décidé par la lib pure ; les deux lectures partent en parallèle. Ne lève
 * jamais : une collecte qui échoue rend une lecture `indisponible`, jamais une absence.
 */
export async function lireSitesSolsAdresse(e: EntreeSitesSols, insee: string | null): Promise<LectureSitesSols> {
  try {
    const { rayonM } = planDeRecherche(e);
    const [categories, sansEmprise] = await Promise.all([
      getSitesSolsAutour(e.point[0], e.point[1], rayonM),
      insee ? lireSansEmprise(insee) : Promise.resolve(null),
    ]);
    return lireSitesSolsTerrain(e, { categories, sansEmprise });
  } catch {
    return sitesSolsIndisponible(e);
  }
}
