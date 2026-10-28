// LA FIBRE À L'ADRESSE (FUT-156) : le format de l'index, le classement d'une adresse, et sa lecture.
//
// Module pur, partagé par le pipeline trimestriel (`scripts/fibre-adresse/`) et par l'application : le
// code qui ÉCRIT une entrée de l'index et celui qui la LIT sont les mêmes, testés ensemble.
//
// ── CE QUE L'INDEX DIT ────────────────────────────────────────────────────────────────────────────────
//  Pour chaque adresse BAN rattachée, l'état de déploiement du ou des bâtiments que l'Arcep lui associe
//  (fichier `Immeuble` de cartefibre) et le nombre d'opérateurs DISTINCTS qui y déclarent une offre fibre
//  (table `eligibilite/actuel` de Ma connexion internet, technologie `FO`). Trois fichiers du même
//  trimestre, joints par le code immeuble de l'IPE (`imb_code`) et l'identifiant interne du trimestre
//  (`imb_id`), jamais par la proximité.
//
// ── LE RATTACHEMENT ──────────────────────────────────────────────────────────────────────────────────
//  1. la clé BAN (`addr_code` de `base_imb`) égale à l'identifiant BAN de l'adresse ;
//  2. sinon, pour les seuls immeubles fibre SANS clé BAN, le même libellé exact (commune, numéro,
//     indice, nom de voie normalisé).
//  Les coordonnées ne servent qu'à DOUTER : un bâtiment rattaché à plus de `ECART_DOUTEUX_M` du point de
//  l'adresse rend le rattachement douteux, et l'adresse passe « à vérifier ». Elles ne choisissent jamais
//  un bâtiment parmi plusieurs, et n'attribuent jamais l'état d'un voisin.
//
// ── LE CODE D'UNE ENTRÉE ─────────────────────────────────────────────────────────────────────────────
//  `[~]<lettre>[<opérateurs>][/<bâtiments>]`, ou `A:<lettres>/<bâtiments>` pour un rattachement ambigu.
//   `~`           rattaché par le libellé (absent : par la clé BAN)
//   lettre        D déployé · R raccordable sur demande · Q raccordable sur demande, en cours ·
//                 E en cours de déploiement · C cible · S signé · X abandonné ·
//                 A états divergents · G bâtiment trop éloigné · I aucun immeuble fibre sous la clé ·
//                 U immeuble fibre sans état publié (ou publié deux fois avec deux états)
//   opérateurs    `5` · `4-5` (comptes différents selon le bâtiment) · `0` (l'immeuble figure dans la
//                 table d'éligibilité, sans aucune offre fibre) · rien (nombre non établi)
//   bâtiments     nombre d'immeubles fibre sous l'adresse, s'il y en a plusieurs
//  Exemples : `D5`, `~D5`, `D4-5/2`, `R0`, `D`, `A:CD/2`, `G/2`, `I`.

/** Version du format : un index d'un autre format est refusé à la lecture. */
export const FORMAT_INDEX_FIBRE = "fibre-adresse-1";

/**
 * Au-delà de cette distance entre un bâtiment rattaché et le point BAN de l'adresse, le rattachement est
 * DOUTEUX. Repère : l'algorithme de l'Arcep pose une clé BAN sur un immeuble fibre jusqu'à 70 m avec un nom
 * de voie approchant, jusqu'à 500 m avec un nom presque identique. En Charente-Maritime (T2 2026), 99,0 %
 * des clés ont tous leurs bâtiments à moins de 150 m ; au-delà se trouvent des cas comme
 * `17421_0976_00013`, dont l'un des deux immeubles est à 856 m. Une convention, pas une mesure de vérité :
 * elle ne fait que retirer une conclusion, jamais en ajouter une.
 */
export const ECART_DOUTEUX_M = 150;

/**
 * Les codes du référentiel `operateur.csv` qui ne désignent pas un opérateur commercial : « données en
 * cours de collecte », opérateur inconnu, fictif, ou l'Arcep elle-même. Leur présence parmi les offres
 * fibre d'un immeuble rend le NOMBRE non établi (le statut, lui, reste).
 */
export const PSEUDO_OPERATEURS: ReadonlySet<string> = new Set(["CCC", "CCCC", "??", "FORM", "ARCEP"]);

/** Les états publiés par cartefibre (`imb_etat`) et leur lettre. Un état inconnu fait échouer la construction. */
export const LETTRE_ETAT: Readonly<Record<string, LettreStatut>> = {
  deploye: "D",
  "raccordable demande": "R",
  "rad en cours de deploiement": "Q",
  "en cours de deploiement": "E",
  cible: "C",
  signe: "S",
  abandonne: "X",
};

export type LettreStatut = "D" | "R" | "Q" | "E" | "C" | "S" | "X";
type LettreDoute = "A" | "G" | "I" | "U";

// ── Le classement d'une adresse (pipeline) ─────────────────────────────────────────────────────────

/** Un immeuble rattaché à l'adresse, tel que le pipeline l'a lu dans les trois fichiers. */
export type ImmeubleLu = {
  /** `imb_source` de `base_imb` : seul `fo` (IPE) porte une donnée fibre. */
  source: string;
  /** L'état cartefibre ; `undefined` : code IPE absent du fichier `Immeuble` ; `null` : publié deux fois avec deux états. */
  etat?: LettreStatut | null;
  /** Distance au point BAN de l'adresse, en mètres ; `null` si l'un des deux points manque. */
  distanceM: number | null;
  /** Codes opérateurs des lignes `FO` de `actuel` ; `undefined` : l'immeuble n'a aucune ligne dans `actuel`. */
  operateursFibre?: ReadonlySet<string>;
};

/**
 * Le code d'une adresse, ou `null` si aucun immeuble ne lui est rattaché (elle n'entre pas dans l'index).
 * `parLibelle` : les immeubles viennent du second barreau.
 */
export function classerAdresse(immeubles: readonly ImmeubleLu[], parLibelle: boolean): string | null {
  if (immeubles.length === 0) return null;
  const prefixe = parLibelle ? "~" : "";
  const fibre = immeubles.filter((i) => i.source === "fo");
  if (fibre.length === 0) return `${prefixe}I`;
  const suffixe = fibre.length > 1 ? `/${fibre.length}` : "";
  // Les coordonnées ne font que douter : un seul bâtiment trop loin, et rien n'est conclu.
  if (fibre.some((i) => i.distanceM != null && i.distanceM > ECART_DOUTEUX_M)) return `${prefixe}G${suffixe}`;
  if (fibre.some((i) => !i.etat)) return `${prefixe}U${suffixe}`;
  const etats = [...new Set(fibre.map((i) => i.etat as LettreStatut))].sort();
  if (etats.length > 1) return `${prefixe}A:${etats.join("")}${suffixe}`;
  return `${prefixe}${etats[0]}${compteOperateurs(fibre)}${suffixe}`;
}

/** `5`, `4-5`, `0`, ou `""` quand le nombre n'est pas établi pour l'un au moins des immeubles. */
function compteOperateurs(fibre: readonly ImmeubleLu[]): string {
  const comptes: number[] = [];
  for (const i of fibre) {
    if (!i.operateursFibre) return ""; // absent de la table d'éligibilité : on ne sait pas, ce n'est pas zéro
    if ([...i.operateursFibre].some((o) => PSEUDO_OPERATEURS.has(o))) return "";
    comptes.push(i.operateursFibre.size);
  }
  const min = Math.min(...comptes);
  const max = Math.max(...comptes);
  return min === max ? String(min) : `${min}-${max}`;
}

// ── Le découpage en lots (pipeline et lecture) ─────────────────────────────────────────────────────

/** Le département d'un code INSEE : `17`, `2A`, `971`. */
export function departementDe(insee: string): string {
  return insee.startsWith("97") || insee.startsWith("98") ? insee.slice(0, 3) : insee.slice(0, 2);
}

/**
 * La commune d'un identifiant BAN : son premier segment (`17333_0270_00017` -> `17333`). La BAN écrit les
 * communes corses en minuscules (`2a001_cjjuix_00068`) ; la commune rendue est toujours le code INSEE
 * (`2A001`), le même à l'écriture de l'index et à sa lecture.
 */
export function communeDeCle(cleBan: string): string | null {
  const c = cleBan.split("_")[0];
  return /^(?:\d{5}|2[ABab]\d{3})$/.test(c) ? c.toUpperCase() : null;
}

/** FNV-1a 32 bits : déterministe, identique au pipeline et à la lecture. */
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Le lot d'une commune dans son département, parmi `n` lots. */
export function lotDe(insee: string, n: number): number {
  return n <= 1 ? 0 : fnv1a(insee) % n;
}

/** Le chemin d'un lot dans le bucket : `2026T2/17-03.json.gz`. */
export function cheminLot(millesime: string, departement: string, lot: number): string {
  return `${millesime}/${departement}-${String(lot).padStart(2, "0")}.json.gz`;
}

/** Le contenu d'un lot : les adresses de quelques communes d'un département. */
export type LotFibre = {
  format: typeof FORMAT_INDEX_FIBRE;
  millesime: string;
  departement: string;
  lot: number;
  /** INSEE -> (suffixe de la clé BAN, sans `INSEE_`) -> code. Une commune absente n'a aucune adresse rattachée. */
  communes: Record<string, Record<string, string>>;
};

/** Le manifeste d'un millésime, publié avec ses lots ; le pointeur `courant.json` le désigne. */
export type ManifesteFibre = {
  format: typeof FORMAT_INDEX_FIBRE;
  millesime: string;
  /** Date des données (fin du trimestre), AAAA-MM-JJ. */
  donneesAu: string;
  /** Nombre de lots par département. Un département absent n'est pas couvert par ce millésime. */
  lots: Record<string, number>;
  /** Empreintes des octets compressés ; obligatoires pour publier/basculer, facultatives pour lire un ancien index. */
  empreintes?: Record<string, { octets: number; sha256: string }>;
};

export type PointeurFibre = { format: typeof FORMAT_INDEX_FIBRE; millesime: string };

export function manifesteValide(m: unknown): m is ManifesteFibre {
  const x = m as ManifesteFibre;
  return !!x && x.format === FORMAT_INDEX_FIBRE && /^\d{4}T[1-4]$/.test(x.millesime ?? "")
    && /^\d{4}-\d{2}-\d{2}$/.test(x.donneesAu ?? "") && !!x.lots && typeof x.lots === "object"
    && Object.values(x.lots).every((n) => Number.isInteger(n) && n >= 1);
}

export function lotValide(l: unknown, attendu: { millesime: string; departement: string; lot: number }): l is LotFibre {
  const x = l as LotFibre;
  return !!x && x.format === FORMAT_INDEX_FIBRE && x.millesime === attendu.millesime
    && x.departement === attendu.departement && x.lot === attendu.lot && !!x.communes && typeof x.communes === "object";
}

// ── La lecture enregistrée dans le rapport ─────────────────────────────────────────────────────────

export type StatutFibre =
  | "deploye"
  | "raccordable_demande"
  | "raccordable_demande_en_cours"
  | "en_cours"
  | "etudes"
  | "a_verifier"
  /** La base n'a pas pu être lue (panne, fichier manquant) : ce n'est PAS une absence de fibre. */
  | "indisponible";

export type MotifAVerifier =
  /** Plusieurs bâtiments sous l'adresse, d'états différents. */
  | "etats_divergents"
  /** Un bâtiment rattaché est à plus de `ECART_DOUTEUX_M` du point de l'adresse. */
  | "batiment_eloigne"
  /** L'adresse n'est associée qu'à des points sans donnée de déploiement fibre. */
  | "sans_donnee_fibre"
  /** Aucun bâtiment des fichiers de l'Arcep n'est associé à l'adresse. */
  | "non_rattachee"
  /** Le bâtiment associé n'a pas d'état de déploiement publié. */
  | "etat_non_publie"
  /** Le bâtiment associé est marqué « abandonné » dans cartefibre. */
  | "abandonne";

export type OperateursFibre =
  | { etat: "nombre"; n: number }
  | { etat: "plage"; min: number; max: number }
  | { etat: "non_etabli" };

export type LectureFibre = {
  statut: StatutFibre;
  motif?: MotifAVerifier;
  /** Pour `etudes` : `cible` ou `signe`, l'état officiel exact. */
  etatOfficiel?: "cible" | "signe";
  /** Les états lus quand ils divergent (`etats_divergents`), en clair. */
  etatsDivergents?: string[];
  rattachement?: "cle_ban" | "libelle";
  /** Nombre de bâtiments fibre associés, quand il y en a plusieurs. */
  batiments?: number;
  /** Absent pour `a_verifier` et `indisponible` : sans état certain, aucun nombre n'est attribué. */
  operateurs?: OperateursFibre;
  /** `2026T2` ; absent si la lecture a échoué avant de connaître le millésime. */
  millesime?: string;
  /** Date des données, AAAA-MM-JJ (fin du trimestre). */
  donneesAu?: string;
};

const LIBELLE_ETAT: Record<LettreStatut, string> = {
  D: "déployé", R: "raccordable sur demande", Q: "raccordable sur demande, en cours", E: "en cours de déploiement",
  C: "études réalisées (cible)", S: "études réalisées (signé)", X: "abandonné",
};

/** L'entrée d'une adresse dans un lot, décodée en lecture. `code` absent : adresse non rattachée. */
export function lectureDepuisCode(code: string | undefined, meta: { millesime: string; donneesAu: string }): LectureFibre {
  const base = { millesime: meta.millesime, donneesAu: meta.donneesAu };
  if (code === undefined) return { statut: "a_verifier", motif: "non_rattachee", ...base };
  const m = /^(~?)(?:([DRQECSX])(\d+(?:-\d+)?)?|A:([DRQECSX]{2,7})|([GIU]))(?:\/(\d+))?$/.exec(code);
  if (!m) return { statut: "indisponible", ...base }; // une entrée illisible n'est jamais une conclusion
  const [, tilde, lettre, ops, divergents, doute, nb] = m;
  const rattachement = tilde ? "libelle" as const : "cle_ban" as const;
  const batiments = nb ? Number(nb) : undefined;
  const commun = { rattachement, ...(batiments ? { batiments } : {}), ...base };
  if (divergents) {
    return {
      statut: "a_verifier", motif: "etats_divergents", ...commun,
      etatsDivergents: [...divergents].map((l) => LIBELLE_ETAT[l as LettreStatut]),
    };
  }
  if (doute) {
    const motif: Record<LettreDoute, MotifAVerifier> = { A: "etats_divergents", G: "batiment_eloigne", I: "sans_donnee_fibre", U: "etat_non_publie" };
    return { statut: "a_verifier", motif: motif[doute as LettreDoute], ...commun };
  }
  if (lettre === "X") return { statut: "a_verifier", motif: "abandonne", ...commun };
  const operateurs: OperateursFibre = !ops
    ? { etat: "non_etabli" }
    : ops.includes("-")
      ? { etat: "plage", min: Number(ops.split("-")[0]), max: Number(ops.split("-")[1]) }
      : { etat: "nombre", n: Number(ops) };
  const statut: Record<Exclude<LettreStatut, "X">, StatutFibre> = {
    D: "deploye", R: "raccordable_demande", Q: "raccordable_demande_en_cours", E: "en_cours", C: "etudes", S: "etudes",
  };
  return {
    statut: statut[lettre as Exclude<LettreStatut, "X">],
    ...(lettre === "C" ? { etatOfficiel: "cible" as const } : lettre === "S" ? { etatOfficiel: "signe" as const } : {}),
    operateurs,
    ...commun,
  };
}

/** La lecture d'une panne : jamais une absence de fibre. */
export function fibreIndisponible(meta?: { millesime: string; donneesAu: string }): LectureFibre {
  return { statut: "indisponible", ...(meta ? { millesime: meta.millesime, donneesAu: meta.donneesAu } : {}) };
}

/** La fin du trimestre d'un millésime : `2026T2` -> `2026-06-30`. */
export function finDeTrimestre(millesime: string): string {
  const m = /^(\d{4})T([1-4])$/.exec(millesime);
  if (!m) throw new Error(`millésime illisible : ${millesime}`);
  return `${m[1]}-${["03-31", "06-30", "09-30", "12-31"][Number(m[2]) - 1]}`;
}

/** Normalisation d'un nom de voie pour le second barreau : sans accents, capitales, ponctuation réduite. */
export function normaliserVoie(s: string | null | undefined): string {
  return (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
}

/** Distance approchée entre deux points WGS84, en mètres (équirectangulaire : exacte à mieux de 1 % sous 1 km). */
export function distanceM(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const kx = 111_320 * Math.cos(((lat1 + lat2) / 2) * Math.PI / 180);
  return Math.hypot((lon1 - lon2) * kx, (lat1 - lat2) * 110_540);
}

/** EPSG:3857 (coordonnées de `base_imb`) -> WGS84. */
export function webMercatorVersWgs84(x: number, y: number): [number, number] {
  const R = 6_378_137;
  return [(x / R) * 180 / Math.PI, (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * 180 / Math.PI];
}
