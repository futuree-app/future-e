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

export type CasiasLu =
  | { etat: "indisponible" }
  | { etat: "absent_dans_source" | "disponible"; total: number };

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
 * Les pages d'une catégorie listée (tous lots de codes confondus) → l'état de la catégorie.
 * `null` dans `pages` : un appel a échoué. Une seule panne rend la catégorie indisponible : une liste à
 * laquelle manque un lot ressemblerait à une liste complète.
 * `incomplet` : un lot avait plus de pages que le plafond `PAGES_MAX`.
 */
export function lireCategorie(pages: (PageSsp | null)[], incomplet = false): CategorieLue {
  if (pages.length === 0 || pages.some((p) => p === null || !pageLisible(p))) return { etat: "indisponible" };
  const parId = new Map<string, FicheSsp>();
  for (const p of pages as { data: Record<string, unknown>[] }[]) {
    for (const r of p.data) {
      const f = fiche(r);
      if (f && !parId.has(f.id)) parId.set(f.id, f);
    }
  }
  const fiches = [...parId.values()].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  if (fiches.length === 0 && !incomplet) return { etat: "absent_dans_source", total: 0, fiches: [] };
  return { etat: incomplet ? "partiel" : "disponible", total: fiches.length, fiches };
}

/**
 * CASIAS se compte, il ne se liste pas : des centaines de fiches par ville, dans un ordre sans rapport avec
 * la proximité. Le compte additionne les totaux des lots. Ville et arrondissements y portent des fiches
 * distinctes (aucun recouvrement mesuré à Paris, Lyon, Marseille, le 28/10/2026, à une fiche près à Lyon).
 */
export function lireCasias(pages: (PageSsp | null)[]): CasiasLu {
  if (pages.length === 0 || pages.some((p) => p === null || !pageLisible(p))) return { etat: "indisponible" };
  const total = (pages as { results: number }[]).reduce((n, p) => n + p.results, 0);
  return { etat: total === 0 ? "absent_dans_source" : "disponible", total };
}
