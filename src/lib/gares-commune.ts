// FUT-97 · TROIS GARES QU'IL NE FAUT PAS CONFONDRE.
//
// 1. La GARE DE RÉFÉRENCE (`transport.gare_nom` / `gare_km` de l'index, scripts/populate-transports.py) :
//    la gare qui maximise fréquentation / (1 + (d/20)²). Elle porte l'indicateur d'accès au train, et
//    seulement lui. Rochefort et Surgères, qui ont chacune leur gare, ont La Rochelle pour référence
//    (26,5 et 30,9 km) : une grande gare à une demi-heure pèse plus que la leur.
// 2. La GARE DE LA COMMUNE : une gare de voyageurs de la BPE (E107, E108, E109) dont l'adresse est dans
//    la commune.
// 3. La GARE LA PLUS PROCHE : la gare BPE la plus proche du point de référence de la commune, à vol
//    d'oiseau. Ni depuis un logement, ni par la route.
//
// Avant FUT-97, `/qna` recevait la gare de référence sous le nom `train.gare` : une question sur
// Rochefort pouvait recevoir « gare : La Rochelle ». La référence ne quitte plus le calcul.
import type { BpePoint } from "./logement-autour-types.ts";
import { haversineM } from "./geo-distance.ts";

/**
 * Le rayon autour du point de référence de la commune. Au-delà, on ne parle plus de la gare de la
 * commune ni d'une gare proche : une commune très étendue peut avoir une gare plus loin de ce point,
 * d'où « non recensée près de son point de référence », jamais « absente ».
 */
export const RAYON_GARES_KM = 10;

const TYPES_GARE = new Set(["E107", "E108", "E109"]);

export type GaresCommune = {
  /** La gare de l'indicateur. Ne se restitue jamais comme gare de la commune ni comme la plus proche. */
  reference: { nom: string; km: number | null } | null;
  /** Une gare de la BPE est-elle dans la commune (dans le rayon) ? `null` : gares BPE inconnues. */
  dansLaCommune: boolean | null;
  /** La gare BPE la plus proche du point de référence, dans le rayon. `null` : aucune, ou gares inconnues. */
  plusProche: { nom: string; km: number; dansLaCommune: boolean } | null;
  /** Les gares BPE ont-elles été lues ? Sans elles, on ne dit rien des gares, pas même leur absence. */
  bpeLue: boolean;
};

/** Majuscules, sans accents, tirets et apostrophes en espaces : « SAINT-LAURENT-DE-LA-PRÉE » = « Saint-Laurent-de-la-Prée ». */
export function normaliserNomCommune(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[-'’]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * La commune d'une adresse BPE. Trois formes rencontrées : « 1 RUE …, 17700 SURGÈRES »,
 * « 64 BOULEVARD …, TOULOUSE » (sans code postal), « 17430 TONNAY-CHARENTE » ou « BORDEAUX » seuls.
 */
export function communeDeLAdresse(adresse: string | undefined): { cp: string | null; nom: string } | null {
  if (!adresse) return null;
  const fin = adresse.split(",").pop()!.trim();
  const m = /^(\d{5})\s+(.+)$/.exec(fin);
  const nom = (m ? m[2] : fin).trim();
  if (!nom || /\d{5}/.test(nom)) return null;
  return { cp: m ? m[1] : null, nom };
}

/** Le département d'un code postal, comparé à celui de l'index (« 20 » couvre la Corse, 2A et 2B). */
function memeDepartement(cp: string, dept: string): boolean {
  const d = cp.slice(0, 2);
  if (d === "20") return dept === "2A" || dept === "2B" || dept === "20";
  if (d === "97") return dept.startsWith("97");
  return d === dept.padStart(2, "0").slice(0, 2);
}

/**
 * Une gare est-elle dans la commune ? Par le NOM de la commune dans l'adresse, et non par le code
 * postal : la BPE place la gare de Rochefort au 17300, qui est le code INSEE de La Rochelle. Le
 * département, quand le code postal le donne, écarte les homonymes (Rochefort, Savoie).
 */
export function gareDansLaCommune(p: Pick<BpePoint, "a">, commune: { nom: string; dept: string }): boolean {
  const c = communeDeLAdresse(p.a);
  if (!c) return false;
  if (normaliserNomCommune(c.nom) !== normaliserNomCommune(commune.nom)) return false;
  return c.cp === null || memeDepartement(c.cp, commune.dept);
}

const PETITS_MOTS = new Set(["de", "du", "des", "la", "le", "les", "sur", "sous", "en", "et", "l", "d", "aux", "au"]);

/** « LA ROCHELLE PORTE DAUPHINE » → « La Rochelle Porte Dauphine ». */
export function nomDeGareLisible(s: string): string {
  return s
    .toLowerCase()
    .split(/(\s+|-|')/)
    .map((mot, i) => (/^\s+$|^-$|^'$/.test(mot) || (i > 0 && PETITS_MOTS.has(mot)) ? mot : mot.charAt(0).toUpperCase() + mot.slice(1)))
    .join("");
}

/**
 * `garesBpe` : les gares de voyageurs de la BPE (`chargerGaresBpe`), ou `null` si elles n'ont pas pu être
 * lues. `null` ne se confond JAMAIS avec une liste vide : « on ne sait pas » n'est pas « il n'y en a pas ».
 */
export function garesDeLaCommune(
  commune: { nom: string; dept: string; lat: number; lon: number; transport?: { gare_nom: string | null; gare_km: number | null } | null },
  garesBpe: BpePoint[] | null,
): GaresCommune {
  const reference = commune.transport?.gare_nom
    ? { nom: commune.transport.gare_nom, km: commune.transport.gare_km ?? null }
    : null;
  if (garesBpe === null || garesBpe.length === 0) return { reference, dansLaCommune: null, plusProche: null, bpeLue: false };
  const centre = { lat: commune.lat, lon: commune.lon };
  const gares = garesBpe
    .filter((p) => TYPES_GARE.has(p.t))
    .map((p) => ({ p, km: haversineM(centre, { lat: p.lat, lon: p.lon }) / 1000 }))
    .filter((g) => g.km <= RAYON_GARES_KM)
    .sort((a, b) => a.km - b.km);
  const dansLaCommune = gares.some((g) => gareDansLaCommune(g.p, commune));
  const g = gares[0];
  if (!g) return { reference, dansLaCommune, plusProche: null, bpeLue: true };
  const nomBrut = g.p.n ?? communeDeLAdresse(g.p.a)?.nom ?? null;
  return {
    reference,
    dansLaCommune,
    plusProche: nomBrut
      ? { nom: nomDeGareLisible(nomBrut), km: Math.round(g.km * 10) / 10, dansLaCommune: gareDansLaCommune(g.p, commune) }
      : null,
    bpeLue: true,
  };
}

/**
 * La distance, dite sans chiffre. Le contrôle des réponses de `/qna` (FUT-37) écarte tout nombre qui
 * ne vient pas des faits climat et risques : un kilométrage transmis ici ferait rejeter la réponse.
 */
export function eloignementEnMots(km: number): string {
  if (km < 2) return "à moins de deux kilomètres";
  if (km < 5) return "à quelques kilomètres";
  return "entre cinq et dix kilomètres";
}

/**
 * Le signal « train » transmis à `/qna`. La gare de référence n'y figure JAMAIS : elle ne sert qu'à
 * l'indicateur, et la nommer invitait à la présenter comme la gare de la commune.
 */
export function signalTrain(gares: GaresCommune, desserte: number): Record<string, unknown> {
  const s: Record<string, unknown> = {
    // Trois niveaux sans comparatif : le prompt interdit de situer la commune par rapport aux autres.
    acces_au_train: desserte >= 60 ? "bien relié par le train" : desserte >= 30 ? "accès au train modéré" : "accès au train limité",
    ce_que_mesure_cet_acces:
      "L'accès au réseau ferré, estimé d'après la fréquentation des gares à portée et leur éloignement. Il ne dit rien des horaires, de la fréquence des trains ni des destinations.",
  };
  if (!gares.bpeLue) return s;
  s.gare_dans_la_commune = gares.dansLaCommune
    ? "oui"
    : "aucune gare de voyageurs recensée dans la commune près de son point de référence";
  s.gare_la_plus_proche = gares.plusProche
    ? {
        nom: gares.plusProche.nom,
        dans_la_commune: gares.plusProche.dansLaCommune,
        eloignement: `${eloignementEnMots(gares.plusProche.km)}, à vol d'oiseau depuis le point de référence de la commune (pas depuis un logement, pas par la route)`,
      }
    : "aucune gare de voyageurs recensée à moins de dix kilomètres du point de référence de la commune";
  return s;
}
