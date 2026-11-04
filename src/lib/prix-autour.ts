// ════════════════════════════════════════════════════════════════════════════════════════════
// LES VENTES AUTOUR D'UNE ADRESSE (FUT-138, échelle Logement). PUR, DÉTERMINISTE, SANS RÉSEAU.
//
// La carte Territoire dit le marché de la COMMUNE (index, `prix-immobiliers.ts`). Le dossier d'adresse dit
// celui des ventes du MÊME TYPE de logement autour de l'adresse, dans un rayon progressif, et le situe par
// rapport à la commune. Ce fichier porte la géométrie, les statistiques et les conventions ; le texte est
// dans `prix-autour-texte.ts`. Le même code sert la construction des tuiles (scripts/dvf-autour), le serveur
// et l'écran.
//
// CONVENTIONS ARBITRÉES PAR LE PORTEUR (03/11/2026) :
//   - rayon progressif 500 m, 1 km, 2 km : le premier qui réunit 10 ventes ;
//   - 10 ventes pour publier une médiane, avertissement sous 20 ;
//   - un écart à la commune n'est QUALIFIÉ qu'à partir de 20 ventes ;
//   - les quartiles ne sont donnés qu'à partir de 30 ventes ;
//   - en dessous de 10 ventes à 2 km : on le dit, et on renvoie à la référence communale.
//
// CE QUI PROTÈGE LES PERSONNES (restrictions de réidentification DVF) :
//   - les tuiles ne gardent AUCUNE vente : par carré d'environ 100 m et par type, un histogramme de prix au m²
//     par classes de 2 %. Ni date, ni surface, ni adresse, ni parcelle, ni prix exact ;
//   - le centre de lecture est le centre du carré de l'adresse : deux adresses situées dans le MÊME carré (environ
//     100 m de côté) lisent exactement les mêmes ventes. Deux adresses proches mais de part et d'autre d'une limite
//     de carré peuvent lire des ensembles différents (une couronne de carrés) ;
//   - les chiffres publiés sont arrondis à 50 €/m², et jamais en dessous de 10 ventes ;
//   - le calcul n'est appelé que par la page du dossier d'adresse payant, sur la position enregistrée du
//     dossier : aucune route n'accepte des coordonnées choisies par le navigateur.
//
// CE QUI TIENT COMPTE DE L'IMPRÉCISION : la position d'une vente est celle de sa PARCELLE cadastrale (Etalab),
// pas du logement ; elle est ensuite ramenée au centre de son carré. Une distance est donc juste à une centaine
// de mètres près, davantage pour une grande parcelle rurale : le texte dit « environ ».
// ════════════════════════════════════════════════════════════════════════════════════════════
import { haversineM, type LngLat } from "./geo-distance.ts";
import type { LecturePrix, LogementIndex } from "./prix-immobiliers.ts";

export const FORMAT_PRIX_AUTOUR = "prix-autour-2";

/** Le carré : environ 100 m de côté (la largeur varie de 91 à 108 m entre le nord et le sud de la France). */
export const CASE_M = 100;
const M_PAR_DEGRE = 111_320;
const LAT_REFERENCE = 46.5;
export const DLAT = CASE_M / M_PAR_DEGRE;
export const DLON = CASE_M / (M_PAR_DEGRE * Math.cos((LAT_REFERENCE * Math.PI) / 180));
/** Une tuile : 50 × 50 carrés, environ 5 km. Un rayon de 2 km lit au plus quatre tuiles. */
export const TUILE_CASES = 50;
/**
 * Un bloc : 10 × 10 tuiles, environ 50 km. Le manifeste ne liste que les blocs ; chaque bloc liste ses tuiles et leurs
 * empreintes. Une lecture à froid télécharge le manifeste (quelques dizaines de Ko), un à quatre index de bloc et le
 * fichier communal de son département, au lieu d'un manifeste national de 2,4 Mo (mesuré le 03/11/2026).
 */
export const BLOC_TUILES = 10;

export const RAYONS_M = [500, 1000, 2000] as const;
export type RayonM = (typeof RAYONS_M)[number];
export const SEUIL_MEDIANE = 10;
export const SEUIL_COMPARAISON = 20;
export const SEUIL_QUARTILES = 30;
export const ARRONDI_EUR_M2 = 50;

/** Les classes de prix : de 300 à 20 000 €/m² (bornes de l'index), par pas de 2 %. */
export const BORNE_BASSE = 300;
export const BORNE_HAUTE = 20_000;
export const PAS_CLASSE = 1.02;
export const CLASSE_MAX = Math.floor(Math.log(BORNE_HAUTE / BORNE_BASSE) / Math.log(PAS_CLASSE));

export type TypeVente = "appart" | "maison";
export type Case = { ix: number; iy: number };

export function caseDe(p: LngLat): Case {
  return { ix: Math.floor(p.lon / DLON), iy: Math.floor(p.lat / DLAT) };
}
export function centreDe(c: Case): LngLat {
  return { lon: (c.ix + 0.5) * DLON, lat: (c.iy + 0.5) * DLAT };
}
export const cleCase = (c: Case) => `${c.ix}_${c.iy}`;
export const cleTuileDe = (c: Case) => `${Math.floor(c.ix / TUILE_CASES)}_${Math.floor(c.iy / TUILE_CASES)}`;
export const cleBlocDe = (cleTuile: string) => {
  const [tx, ty] = cleTuile.split("_").map(Number);
  return `${Math.floor(tx / BLOC_TUILES)}_${Math.floor(ty / BLOC_TUILES)}`;
};
/** Le département d'un code INSEE (« 17 », « 2A », « 974 ») : le découpage du fichier communal. */
export const departementDe = (insee: string) => (insee.startsWith("97") ? insee.slice(0, 3) : insee.slice(0, 2));

export function classeDe(eurM2: number): number {
  const b = Math.floor(Math.log(eurM2 / BORNE_BASSE) / Math.log(PAS_CLASSE));
  return Math.min(CLASSE_MAX, Math.max(0, b));
}
/** Le prix représentatif d'une classe : son milieu géométrique (erreur au plus 1 %). */
export const valeurDeClasse = (b: number) => BORNE_BASSE * PAS_CLASSE ** (b + 0.5);

/** Les carrés dont le centre est à `rayonM` ou moins du centre du carré de lecture. */
export function casesDansRayon(origine: Case, rayonM: number): Case[] {
  const o = centreDe(origine);
  const dy = Math.ceil(rayonM / CASE_M) + 1;
  const largeur = DLON * M_PAR_DEGRE * Math.cos((o.lat * Math.PI) / 180);
  const dx = Math.ceil(rayonM / largeur) + 1;
  const out: Case[] = [];
  for (let iy = origine.iy - dy; iy <= origine.iy + dy; iy++) {
    for (let ix = origine.ix - dx; ix <= origine.ix + dx; ix++) {
      if (haversineM(o, centreDe({ ix, iy })) <= rayonM) out.push({ ix, iy });
    }
  }
  return out;
}

/** Les tuiles à lire pour le plus grand rayon. */
export function tuilesPour(p: LngLat): string[] {
  const rayonMax = RAYONS_M[RAYONS_M.length - 1];
  return [...new Set(casesDansRayon(caseDe(p), rayonMax).map(cleTuileDe))].sort();
}

// ── Les tuiles ───────────────────────────────────────────────────────────────────────────────

/** Un histogramme à plat : [classe, effectif, classe, effectif, ...], classes croissantes. */
export type Histogramme = number[];
export type CaseVentes = { a?: Histogramme; m?: Histogramme };
export type TuilePrixAutour = { format: string; edition: string; tuile: string; cases: Record<string, CaseVentes> };

export type Empreinte = { octets: number; sha256: string };

/**
 * `<édition>/manifest.json` : les blocs (`b/<bloc>.json`) et les fichiers communaux par département
 * (`c/<dép>.json.gz`), avec leurs empreintes. Un bloc ou un département absent n'a aucune vente, ou aucune commune.
 */
export type ManifestePrixAutour = {
  format: string;
  edition: string;
  livraison: string;
  periode: { debut: string; fin: string };
  case_m: number;
  tuile_cases: number;
  bloc_tuiles: number;
  pas_classe: number;
  blocs: Record<string, Empreinte & { tuiles: number }>;
  communes: Record<string, Empreinte & { nombre: number }>;
};

/** `<édition>/b/<bloc>.json` : les tuiles d'un bloc et leurs empreintes. Une tuile absente n'a aucune vente. */
export type BlocPrixAutour = { format: string; edition: string; bloc: string; tuiles: Record<string, Empreinte & { ventes: number }> };

/** `<édition>/c/<dép>.json.gz` : le champ `achat` de l'index pour chaque commune du département, et sa provenance. */
export type CommunesPrixAutour = {
  format: string;
  edition: string;
  departement: string;
  meta: { achat: { periode: { debut: string; fin: string }; livraison?: string; source?: string } };
  communes: Record<string, { nom: string; achat: LogementIndex["achat"] }>;
};

const empreinteValide = (e: unknown) => {
  const x = e as Empreinte;
  return Boolean(x) && Number.isSafeInteger(x.octets) && x.octets > 0 && /^[a-f0-9]{64}$/.test(x.sha256 ?? "");
};
const toutesValides = (r: unknown, cle: RegExp) =>
  typeof r === "object" && r !== null && Object.entries(r).every(([k, e]) => cle.test(k) && empreinteValide(e));
const CLE_GRILLE = /^-?\d+_-?\d+$/;

export function manifesteValide(m: unknown): m is ManifestePrixAutour {
  const x = m as ManifestePrixAutour;
  return Boolean(x) && x.format === FORMAT_PRIX_AUTOUR && typeof x.edition === "string" && typeof x.livraison === "string"
    && x.case_m === CASE_M && x.tuile_cases === TUILE_CASES && x.bloc_tuiles === BLOC_TUILES && x.pas_classe === PAS_CLASSE
    && typeof x.periode?.debut === "string" && typeof x.periode?.fin === "string"
    && toutesValides(x.blocs, CLE_GRILLE) && toutesValides(x.communes, /^(\d[\dAB]|97\d)$/);
}

export function blocValide(b: unknown, attendu: { edition: string; bloc: string }): b is BlocPrixAutour {
  const x = b as BlocPrixAutour;
  return Boolean(x) && x.format === FORMAT_PRIX_AUTOUR && x.edition === attendu.edition && x.bloc === attendu.bloc
    && toutesValides(x.tuiles, CLE_GRILLE) && Object.keys(x.tuiles).every((k) => cleBlocDe(k) === attendu.bloc);
}

const histogrammeValide = (h: unknown) =>
  Array.isArray(h) && h.length % 2 === 0
  && h.every((v, i) => Number.isInteger(v) && (i % 2 === 0 ? v >= 0 && v <= CLASSE_MAX : v > 0));

export function tuileValide(t: unknown, attendu: { edition: string; tuile: string }): t is TuilePrixAutour {
  const x = t as TuilePrixAutour;
  if (!x || x.format !== FORMAT_PRIX_AUTOUR || x.edition !== attendu.edition || x.tuile !== attendu.tuile) return false;
  if (typeof x.cases !== "object" || x.cases === null) return false;
  for (const [k, c] of Object.entries(x.cases)) {
    if (!/^-?\d+_-?\d+$/.test(k)) return false;
    const [ix, iy] = k.split("_").map(Number);
    if (cleTuileDe({ ix, iy }) !== attendu.tuile) return false;
    if (c.a !== undefined && !histogrammeValide(c.a)) return false;
    if (c.m !== undefined && !histogrammeValide(c.m)) return false;
  }
  return true;
}

// ── La lecture ───────────────────────────────────────────────────────────────────────────────

export type ResultatAutour =
  | {
    statut: "ventes";
    type: TypeVente;
    rayonM: RayonM;
    ventes: number;
    /** Arrondie à 50 €/m². */
    mediane: number;
    /** Premier et troisième quartiles, à partir de 30 ventes seulement ; arrondis à 50 €/m². */
    quartiles: [number, number] | null;
  }
  | { statut: "trop_peu"; type: TypeVente; rayonM: RayonM };

/** La lecture des deux types autour d'une adresse, telle que le serveur la passe à l'écran. */
export type VentesAutour = {
  edition: string;
  livraison: string;
  periode: { debut: string; fin: string };
  appart: ResultatAutour;
  maison: ResultatAutour;
  /** La commune de l'adresse (l'arrondissement à Paris, Lyon, Marseille), référence de l'écart ; null si inconnue. */
  commune: LecturePrix | null;
};

export function communesValides(c: unknown, attendu: { edition: string; departement: string }): c is CommunesPrixAutour {
  const x = c as CommunesPrixAutour;
  return Boolean(x) && x.format === FORMAT_PRIX_AUTOUR && x.edition === attendu.edition && x.departement === attendu.departement
    && typeof x.meta?.achat?.periode?.debut === "string" && typeof x.communes === "object" && x.communes !== null
    && Object.keys(x.communes).every((k) => departementDe(k) === attendu.departement);
}

/** La lecture des prix d'une commune, à partir de la référence publiée avec les tuiles. */
export function lecturePrixDe(c: CommunesPrixAutour, insee: string): LecturePrix | null {
  const e = c.communes[insee];
  return e ? { code: insee, nom: e.nom, logement: { achat: e.achat, location: null }, meta: { achat: c.meta.achat } } : null;
}

export const arrondir = (v: number) => Math.round(v / ARRONDI_EUR_M2) * ARRONDI_EUR_M2;

/** La valeur au rang `k` (1 à n) d'un histogramme fusionné, classes croissantes. */
function auRang(classes: [number, number][], k: number): number {
  let cumul = 0;
  for (const [b, n] of classes) {
    cumul += n;
    if (cumul >= k) return valeurDeClasse(b);
  }
  return valeurDeClasse(classes[classes.length - 1][0]);
}

/** Médiane et quartiles d'un histogramme fusionné NON VIDE. */
export function statistiques(classes: [number, number][]) {
  const n = classes.reduce((s, [, c]) => s + c, 0);
  if (n === 0) throw new Error("statistiques : histogramme vide");
  const mediane = n % 2 ? auRang(classes, (n + 1) / 2) : (auRang(classes, n / 2) + auRang(classes, n / 2 + 1)) / 2;
  const q1 = auRang(classes, Math.ceil(0.25 * n));
  const q3 = auRang(classes, Math.ceil(0.75 * n));
  return { n, mediane, q1, q3 };
}

function fusionner(cases: CaseVentes[], type: TypeVente): [number, number][] {
  const total = new Map<number, number>();
  const cle = type === "appart" ? "a" : "m";
  for (const c of cases) {
    const h = c[cle];
    if (!h) continue;
    for (let i = 0; i < h.length; i += 2) total.set(h[i], (total.get(h[i]) ?? 0) + h[i + 1]);
  }
  return [...total.entries()].sort((x, y) => x[0] - y[0]);
}

/**
 * Les ventes d'un type autour d'un point : le premier rayon qui réunit 10 ventes. Les tuiles manquantes sont des
 * zones sans aucune vente (le manifeste ne liste que les tuiles qui en ont).
 */
export function lireAutour(tuiles: Map<string, TuilePrixAutour>, p: LngLat, type: TypeVente): ResultatAutour {
  const origine = caseDe(p);
  for (const rayonM of RAYONS_M) {
    const cases = casesDansRayon(origine, rayonM)
      .map((c) => tuiles.get(cleTuileDe(c))?.cases[cleCase(c)])
      .filter((c): c is CaseVentes => Boolean(c));
    const classes = fusionner(cases, type);
    if (classes.reduce((n, [, c]) => n + c, 0) < SEUIL_MEDIANE) continue;
    const s = statistiques(classes);
    return {
      statut: "ventes",
      type,
      rayonM,
      ventes: s.n,
      mediane: arrondir(s.mediane),
      quartiles: s.n >= SEUIL_QUARTILES ? [arrondir(s.q1), arrondir(s.q3)] : null,
    };
  }
  return { statut: "trop_peu", type, rayonM: RAYONS_M[RAYONS_M.length - 1] };
}
