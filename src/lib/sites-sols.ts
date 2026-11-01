// SITES ET SOLS POLLUÉS OU POTENTIELLEMENT POLLUÉS, à la commune (FUT-152, 28/10/2026). Lib PURE : quels codes
// interroger, comment lire les réponses de l'API Géorisques `/api/v1/ssp/*`, quel état en conclure. L'appel
// réseau vit dans `server/sites-sols.ts`. Ni la page publique ni un dossier ne refont ces règles.
//
// QUATRE INVENTAIRES QUI NE DISENT PAS LA MÊME CHOSE, et qui ne s'additionnent jamais : un même terrain peut
// figurer dans trois d'entre eux (Sotrameuse, à Metz, est à la fois une instruction et un SIS).
//   - SIS : secteurs d'information sur les sols, arrêtés par le préfet. Pollution connue ; études de sols
//     exigées en cas de changement d'usage ou de construction. Périmètre réglementaire.
//   - Instructions (ex-BASOL) : pollution suspectée ou avérée sur laquelle l'administration est intervenue.
//   - SUP : servitudes d'utilité publique, restrictions d'usage d'un terrain pollué.
//   - CASIAS : inventaire HISTORIQUE des anciennes activités industrielles et de services. Une fiche dit
//     qu'une activité a existé, pas qu'une pollution a été constatée. Inventaire non exhaustif.
//
// TROIS PIÈGES MESURÉS LE 28/10/2026, qui produisaient de fausses absences :
//   1. Paris, Lyon, Marseille : les fiches sont rattachées tantôt à la ville (75056), tantôt à
//      l'arrondissement. Paris : 7 fiches CASIAS sous 75056, 8 241 sous ses arrondissements ; 37 SIS
//      distincts, dont 9 n'apparaissent que sous un arrondissement. La ville s'interroge AVEC ses arrondissements.
//   2. Communes fusionnées : CASIAS garde des fiches sous l'ancien code (27 à Octeville et Équeurdreville,
//      absentes d'une recherche sur Cherbourg-en-Cotentin). La commune s'interroge AVEC ses anciens codes.
//   3. L'interrogation multi-codes rend des doublons (Marseille et 9 arrondissements : 67 lignes SIS pour 55
//      fiches distinctes) : le total annoncé n'est pas un nombre de fiches. On dédoublonne par identifiant.
import { ANCIENS_CODES_COMMUNES } from "./anciens-codes-communes.generated.ts";
import { arrondissementsDe, communeParent } from "./plm.ts";

export const SITES_SOLS_SOURCE = {
  producteur: "Géorisques (ministère de la Transition écologique, BRGM)",
  api: "https://georisques.gouv.fr/api/v1/ssp",
  documentation: "https://www.georisques.gouv.fr/doc-api",
  carte: "https://www.georisques.gouv.fr/cartes-interactives#/",
} as const;

/** L'API accepte au plus 10 codes INSEE par appel (spécification OpenAPI v1, paramètre `code_insee`). */
export const CODES_PAR_APPEL = 10;
/** Plafond de pagination par catégorie listée : au-delà, la liste est dite partielle, jamais complète. */
export const PAGES_MAX = 5;
/** CASIAS compte des milliers de fiches dans une grande ville (Lyon : 4 969 sous le seul code de la ville). */
export const PAGES_MAX_CASIAS = 10;
export const TAILLE_PAGE = 1000;

export type CategorieListee = "sis" | "instructions" | "sup";
export const CHEMIN: Record<CategorieListee | "casias", string> = {
  sis: "conclusions_sis",
  instructions: "instructions",
  sup: "conclusions_sup",
  casias: "casias",
};

const CODE_INSEE = /^(\d{5}|2[AB]\d{3})$/;
export const estCodeInsee = (c: string): boolean => CODE_INSEE.test(c);

export type Perimetre = {
  /** Le code demandé. */
  demande: string;
  /** La commune lue : la ville pour un arrondissement de Paris, Lyon ou Marseille. */
  commune: string;
  /** Tous les codes interrogés : la commune, ses arrondissements, ses anciens codes. */
  codes: string[];
  /** Vrai quand un arrondissement a été élargi à sa ville (les fiches n'y sont pas rattachées à coup sûr). */
  elargiALaVille: boolean;
};

/**
 * LES CODES À INTERROGER pour une commune. Un arrondissement est élargi à sa ville : une partie des fiches de
 * l'arrondissement est rattachée au code de la ville, et rien dans la réponse ne dit lequel des deux les porte.
 */
export function perimetreDe(insee: string): Perimetre {
  const commune = communeParent(insee);
  const codes = [commune, ...arrondissementsDe(commune), ...(ANCIENS_CODES_COMMUNES[commune] ?? [])];
  return { demande: insee, commune, codes: [...new Set(codes)], elargiALaVille: commune !== insee };
}

export function lots<T>(xs: readonly T[], n = CODES_PAR_APPEL): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n));
  return out;
}

// ── Lecture des réponses ─────────────────────────────────────────────────────────────────────────────

/** Une page telle que l'API la rend (champs lus seulement). */
export type PageSsp = {
  results?: unknown;
  total_pages?: unknown;
  data?: unknown;
};

export type FicheSsp = {
  id: string;
  nom: string;
  adresse: string | null;
  commune: string | null;
  statut: string | null;
  /** Fiche officielle du BRGM, seulement si l'URL est bien celle d'un domaine public attendu. */
  fiche: string | null;
  miseAJour: string | null;
};

export type CategorieLue =
  | { etat: "indisponible" }
  | { etat: "absent_dans_source"; total: 0; fiches: [] }
  | { etat: "disponible" | "partiel"; total: number; fiches: FicheSsp[] };

/** `partiel` : des lignes annoncées n'ont pas été lues ou exploitées ; `total` est alors un minimum (« au moins »). */
export type CasiasLu =
  | { etat: "indisponible" }
  | { etat: "absent_dans_source" | "disponible" | "partiel"; total: number };

export type SitesSolsCommune = {
  perimetre: Perimetre;
  consulteLe: string;
  sis: CategorieLue;
  instructions: CategorieLue;
  sup: CategorieLue;
  casias: CasiasLu;
};

const texte = (v: unknown): string | null => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);
const entier = (v: unknown): number | null => (typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : null);

const DOMAINES_FICHE = ["fiches-risques.brgm.fr", "www.georisques.gouv.fr", "georisques.gouv.fr"];
/** Un lien venu d'une source tierce n'est rendu que s'il pointe en https vers un domaine attendu. */
export function lienFicheSur(v: unknown): string | null {
  const s = texte(v);
  if (!s) return null;
  try {
    const u = new URL(s);
    return u.protocol === "https:" && DOMAINES_FICHE.includes(u.hostname) ? u.toString() : null;
  } catch {
    return null;
  }
}

function fiche(r: Record<string, unknown>): FicheSsp | null {
  const id = texte(r.identifiant_ssp);
  if (!id) return null;
  return {
    id,
    nom: texte(r.nom) ?? texte(r.nom_etablissement) ?? "Site sans nom",
    adresse: texte(r.adresse) ?? texte(r.adresse_lieudit),
    commune: texte(r.nom_commune),
    // Le statut d'instruction (« En cours ») ; la classification (« Secteurs d'information sur les sols ») ne fait
    // que répéter la catégorie.
    statut: texte(r.statut),
    fiche: lienFicheSur(r.fiche_risque),
    miseAJour: texte(r.date_maj),
  };
}

/** Une page est lisible si elle porte un total entier et un tableau ; sinon c'est une erreur déguisée. */
export function pageLisible(p: PageSsp): p is { results: number; total_pages: unknown; data: Record<string, unknown>[] } {
  return entier(p.results) !== null && Array.isArray(p.data);
}

/**
 * UN LOT EST-IL LU EN ENTIER ? Ses pages (la première porte `results`, le nombre de lignes annoncé, et
 * `total_pages`) → `true` quand des lignes annoncées n'ont pas été lues : le plafond de pages a coupé la
 * lecture, ou les pages rendues contiennent moins de lignes que le total annoncé (`total_pages` absent ou
 * faux, page tronquée). Un lot en panne n'est pas « incomplet » : `lireCategorie` le rend indisponible.
 */
export function lotIncomplet(pages: (PageSsp | null)[], plafond: number): boolean {
  const premiere = pages[0];
  if (!premiere || !pageLisible(premiere) || pages.some((p) => p === null || !pageLisible(p))) return false;
  const totalPages = entier(premiere.total_pages);
  if (totalPages !== null && totalPages > plafond) return true;
  const lues = (pages as { data: unknown[] }[]).reduce((n, p) => n + p.data.length, 0);
  return lues < premiere.results;
}

/**
 * Les pages d'une catégorie listée (tous lots de codes confondus) → l'état de la catégorie.
 * `null` dans `pages` : un appel a échoué. Une seule panne rend la catégorie indisponible : une liste à
 * laquelle manque un lot ressemblerait à une liste complète.
 * `incomplet` : des lignes annoncées n'ont pas été lues (`lotIncomplet`).
 *
 * JAMAIS D'ABSENCE QUAND LA SOURCE ANNONCE DES LIGNES (revue du 29/10/2026). Une ligne sans identifiant ne
 * devient pas une fiche, mais elle n'est pas oubliée : la catégorie est alors `partiel`. Et une page qui
 * annonce `results > 0` interdit `absent_dans_source`, même si aucune fiche n'a pu en être tirée.
 */
export function lireCategorie(pages: (PageSsp | null)[], incomplet = false): CategorieLue {
  return lireLignes(pages, incomplet, fiche);
}

/**
 * LE CŒUR COMMUN DE LA LECTURE, quelle que soit la forme rendue d'une ligne (FUT-157). `versFiche` rend
 * `null` pour une ligne inexploitable, qui rend la catégorie `partielle`. Une même fiche qui revient (ville
 * et arrondissement) n'est gardée qu'une fois ; `memeFiche` dit si ses répétitions disent bien la même chose :
 * sinon, elle n'est pas gardée et la catégorie est `partielle` (aucune des deux versions n'est choisie).
 */
function lireLignes<F extends { id: string; nom: string }>(
  pages: (PageSsp | null)[], incomplet: boolean, versFiche: (r: Record<string, unknown>) => F | null,
  memeFiche: (a: F, b: F) => boolean = () => true,
): { etat: "indisponible" } | { etat: "absent_dans_source"; total: 0; fiches: [] } | { etat: "disponible" | "partiel"; total: number; fiches: F[] } {
  if (pages.length === 0 || pages.some((p) => p === null || !pageLisible(p))) return { etat: "indisponible" };
  const lisibles = pages as { results: number; data: Record<string, unknown>[] }[];
  const parId = new Map<string, F>();
  const contradictoires = new Set<string>();
  let nonExploitees = 0;
  for (const p of lisibles) {
    for (const r of p.data) {
      const f = r && typeof r === "object" ? versFiche(r) : null;
      if (!f) { nonExploitees++; continue; }
      const deja = parId.get(f.id);
      if (!deja) parId.set(f.id, f);
      else if (!memeFiche(deja, f)) contradictoires.add(f.id);
    }
  }
  for (const id of contradictoires) parId.delete(id);
  const fiches = [...parId.values()].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  const annonce = lisibles.some((p) => p.results > 0);
  const partiel = incomplet || nonExploitees > 0 || contradictoires.size > 0 || (fiches.length === 0 && annonce);
  if (fiches.length === 0 && !partiel) return { etat: "absent_dans_source", total: 0, fiches: [] };
  return { etat: partiel ? "partiel" : "disponible", total: fiches.length, fiches };
}

// ── Lecture géographique (FUT-157) ───────────────────────────────────────────────────────────────

/**
 * UNE FICHE AVEC SA GÉOMÉTRIE PUBLIÉE (champ `geom` de la spécification v1, en WGS84). Mesuré le 30/10/2026 :
 * les SIS et les SUP portent un MultiPolygon ; une partie des instructions n'est localisée que par un POINT
 * (Lyon : 33 sur 111, Marseille : 24 sur 100), et quelques-unes n'ont aucune géométrie (Metz : 2 sur 19).
 * `geometrie` vaut `null` dans ce dernier cas : une fiche sans géométrie ne se situe pas, elle se compte.
 */
export type FicheSspGeo = FicheSsp & { geometrie: { type: string; coordinates: unknown } | null };

function geometrie(v: unknown): FicheSspGeo["geometrie"] {
  if (!v || typeof v !== "object") return null;
  const g = v as { type?: unknown; coordinates?: unknown };
  return typeof g.type === "string" && Array.isArray(g.coordinates) ? { type: g.type, coordinates: g.coordinates } : null;
}

function ficheGeo(r: Record<string, unknown>): FicheSspGeo | null {
  const f = fiche(r);
  return f ? { ...f, geometrie: geometrie(r.geom) } : null;
}

/**
 * Une même fiche répétée sous la ville et sous l'arrondissement ne diffère que par sa commune de
 * rattachement (mesuré sur Paris, Lyon et Marseille, 107 cas, 30/10/2026). Deux GÉOMÉTRIES différentes
 * sous un même identifiant ne sont pas une répétition : la source se contredit.
 */
const memeGeometrie = (a: FicheSspGeo, b: FicheSspGeo) => JSON.stringify(a.geometrie) === JSON.stringify(b.geometrie);

export type CategorieGeoLue =
  | { etat: "indisponible" }
  | { etat: "absent_dans_source"; total: 0; fiches: [] }
  | { etat: "disponible" | "partiel"; total: number; fiches: FicheSspGeo[] };

/** Comme `lireCategorie`, en gardant la géométrie de chaque fiche. Mêmes états, mêmes garanties. */
export function lireCategorieGeo(pages: (PageSsp | null)[], incomplet = false): CategorieGeoLue {
  return lireLignes(pages, incomplet, ficheGeo, memeGeometrie);
}

/**
 * CASIAS se compte, il ne se liste pas : des centaines de fiches par ville, dans un ordre sans rapport avec
 * la proximité. Le compte est celui des IDENTIFIANTS DISTINCTS, jamais le total annoncé par la source : Paris
 * (ville et arrondissements) annonce 8 250 lignes pour 8 248 fiches distinctes (28/10/2026). Il faut donc lire
 * toutes les pages ; seul le nombre sort d'ici, la liste n'est pas transmise.
 */
export function lireCasias(pages: (PageSsp | null)[], incomplet = false): CasiasLu {
  const lu = lireCategorie(pages, incomplet);
  if (lu.etat === "indisponible") return lu;
  return { etat: lu.etat, total: lu.total };
}
