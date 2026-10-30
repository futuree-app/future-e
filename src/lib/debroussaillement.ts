// LE ZONAGE DU DÉBROUSSAILLEMENT OBLIGATOIRE À UNE ADRESSE (FUT-149). Lib PURE : aucune I/O, testée sous
// `node --test`. Les tuiles sont construites par `scripts/debroussaillement/construire.py` depuis la base
// DÉBROUSSAILLEMENT de l'IGN, publiées sur Supabase Storage et lues côté serveur par
// `server/debroussaillement-tuiles.ts`. Le TYPE est lu côté client.
//
// ── CE QUE LE ZONAGE EST ─────────────────────────────────────────────────────────────────────
//  Le « zonage informatif des obligations légales de débroussaillement » : les bois, forêts, landes, maquis
//  et garrigues classés à risque d'incendie par arrêté (code forestier, L132-1 et L133-1), et la bande de
//  200 m qui les entoure (L134-6). Dans cette zone, le propriétaire d'une construction doit débroussailler
//  autour d'elle, sur une profondeur que fixe l'arrêté du préfet. Depuis le 1er janvier 2025, le vendeur ou
//  le bailleur doit en informer l'acquéreur ou le locataire (décret n° 2024-405, état des risques).
//
// ── CE QU'IL N'EST PAS, ET AUCUNE PHRASE NE LE FAIT DIRE ─────────────────────────────────────
//  - Ni une mesure du danger d'incendie, ni la preuve qu'un terrain est boisé : c'est un périmètre d'obligation.
//  - Ni la règle elle-même : il est INFORMATIF (documentation IGN v7.0, § 2.5). Seuls l'arrêté et le code font
//    foi ; de petits massifs (moins de 4 ha) peuvent manquer à la carte alors que l'obligation s'y applique.
//  - Ni un département « sans obligation » quand il n'a pas de zonage publié : `non_couvert`, rien n'est conclu.
//
// ── CE QUE LA LIB ÉTABLIT ────────────────────────────────────────────────────────────────────
//  A. Fait publié : la zone, le département, la nature de la donnée (zonage de la préfecture ou de l'IGN), le
//     millésime des cartes forestières, la date de l'arrêté préfectoral quand la base la porte.
//  B. Calcul dérivé : la zone qui contient le point de l'adresse, ou la part de la parcelle dans la zone
//     (aire exacte, `geometrie-parcelle.ts`, mêmes seuils que FUT-81 et FUT-146).
//  C. Portée : « à l'adresse » seulement avec un géocodage au numéro ET une parcelle rattachée au point,
//     unique et mesurable. Sinon la lecture se fait au point, et le dit. Aucun rattachement à une parcelle voisine.
//
// ── LES TUILES ───────────────────────────────────────────────────────────────────────────────
//  Cellules de 0,1° ; coordonnées en entiers de 1e-7 degré. Une zone coupée par la grille garde, le long de la
//  coupe, des arêtes qui ne sont PAS des limites de zone : elles sont exactement sur une droite de la grille, et
//  la lib les écarte avant toute mesure de distance. Une cellule absente du manifeste ne contient aucune zone
//  publiée : c'est une absence établie, pas une panne. Une tuile listée et non lue est une panne.

import {
  aireIntersection, aireRegion, classer, distanceLignes, distanceRegion, lignesDe, pointsDe, projectionAutour, regionDe,
  regionMesurable, TOLERANCE_M, type Geometrie, type Region,
} from "./geometrie-parcelle.ts";
import { PART_MIN, SURFACE_CONTACT_M2 } from "./urbanisme-nomenclature.ts";
import { precisionDepuisBanId } from "./bruit-aerien.ts";

export {
  DEBROUSSAILLEMENT_CONVENTION, FORMAT_TUILES_DEBROUSSAILLEMENT, LIMITE_PROCHE_M, MILLESIME_ANCIEN_ANS,
} from "./debroussaillement-constantes.ts";
import { DEBROUSSAILLEMENT_CONVENTION, FORMAT_TUILES_DEBROUSSAILLEMENT, LIMITE_PROCHE_M } from "./debroussaillement-constantes.ts";

export { precisionDepuisBanId };

// ── Le jeu publié (forme du manifeste et des tuiles) ─────────────────────────────────────────

/** Ce que la base dit d'une zone. Un profil par combinaison département × source × arrêté × millésime. */
export type ProfilZonage = {
  /** Code Insee du département (« 33 », « 2A »). */
  departement: string;
  /** « Zonage local » (préfecture), « Zonage IGN », « Zonage IGN+traitements locaux »… tel que publié. */
  source: string;
  origine: string | null;
  /** Millésime des cartes forestières d'origine (« 2008 »). */
  millesime: string | null;
  /** Date de l'arrêté préfectoral (AAAA-MM-JJ), quand la base la porte sous une forme datable. */
  arrete: string | null;
  arreteBrut: string | null;
  /** Page de la préfecture sur le débroussaillement. */
  url: string | null;
  integration: string | null;
  integrationBrut: string | null;
};

export type EntreeTuile = { octets: number; sha256: string } | { plein: { p: number; o: string; a?: 1 } };

export type ManifesteDebroussaillement = {
  format: typeof FORMAT_TUILES_DEBROUSSAILLEMENT;
  /** Date d'édition de la base IGN (AAAA-MM-JJ). */
  edition: string;
  construitLe: string;
  producteur: string;
  diffuseur: string;
  licence: string;
  source: { url: string; fichier?: string; sha256?: string };
  /** Départements (codes Insee) qui ont au moins une zone publiée. */
  couverture: string[];
  profils: ProfilZonage[];
  tuiles: Record<string, EntreeTuile>;
  /**
   * Communes (code Insee → nom) où l'arrêté de classement exclut tous les massifs, mais où la base publie des
   * zones (contre-épreuve du 28/10/2026 : trois communes du Vaucluse). Rien n'y est conclu : `incertain`.
   */
  exclusionsArretes?: Record<string, string>;
  exclusionsTexte?: string;
};

/** Un morceau de zone dans une tuile : profil, identifiant d'objet, anneaux codés, drapeaux. */
export type Morceau = {
  p: number;
  o: string;
  /** Anneaux : [x0, y0, dx1, dy1, …] en 1e-7 degré, sans sommet de fermeture ; le premier est l'extérieur. */
  r: number[][];
  /** 0 : polygone non mesurable après arrondi (aucun dans l'édition du 01/03/2026). */
  v?: 0;
  /** 1 : objet dont la diffusion est ambiguë (`DIFFUSION = "O"`) : rien n'en est conclu. */
  a?: 1;
};

export type TuileDebroussaillement = {
  format: typeof FORMAT_TUILES_DEBROUSSAILLEMENT;
  edition: string;
  ix: number;
  iy: number;
  morceaux: Morceau[];
};

// ── La lecture publiée (contrat du rapport) ──────────────────────────────────────────────────

/**
 * L'ÉTAT DU ZONAGE À L'ADRESSE.
 * `en_zone` : le point est dans une zone, loin de sa limite ; ou la parcelle y est en entier (à 2 % près).
 * `en_limite` : une limite de zone passe à moins de 50 m du point ; ou la parcelle est à cheval sur la limite, la
 *   touche en bordure, ou en passe à moins de 50 m. Rien n'est attribué : c'est à vérifier.
 * `hors_zone` : le département a un zonage publié, et aucune zone n'est à moins de 50 m.
 * `non_couvert` : aucun zonage publié pour le département. Ce n'est JAMAIS une absence d'obligation.
 * `incertain` : une donnée proche ne permet pas de conclure (géométrie non mesurable, diffusion ambiguë).
 */
export type EtatDebroussaillement = "en_zone" | "en_limite" | "hors_zone" | "non_couvert" | "incertain";

/**
 * Pourquoi une lecture est en limite. `a_cheval` : la parcelle est dans le zonage pour une part réelle (2 % à 98 %)
 * mais pas en entier ; l'obligation suit les constructions, pas la parcelle, et leur emplacement n'est pas connu.
 */
export type CauseLimite = "point_proche" | "a_cheval" | "bordure" | "parcelle_proche";

export type GrainDebroussaillement = "parcelle" | "point";
export type PorteeDebroussaillement = "adresse" | "secteur" | "non_precisee";

export type LectureDebroussaillement = {
  convention: typeof DEBROUSSAILLEMENT_CONVENTION;
  /** `indisponible` : le manifeste ou une tuile n'a pas pu être lu. Jamais une absence de zone. */
  statut: "lu" | "indisponible";
  etat: EtatDebroussaillement;
  grain: GrainDebroussaillement;
  portee: PorteeDebroussaillement;
  /** Pourquoi la parcelle n'a pas servi, quand elle n'a pas servi. */
  parcelleEcartee: "absente" | "non_mesurable" | "repli" | "limite" | "hors_point" | "etendue" | null;
  /** Code Insee du département de l'adresse ; `null` s'il n'est pas connu. */
  departement: string | null;
  /** La zone en cause (en zone ou en limite) : ce que la base en dit. */
  zone: ProfilZonage | null;
  /** Le zonage du département, quand il en a un (même hors zone) : arrêté, millésime, page de la préfecture. */
  profilDepartement: ProfilZonage | null;
  /** Part de la parcelle dans le zonage (0 à 1) et surface (m²), au grain parcelle seulement. */
  part: number | null;
  surfaceM2: number | null;
  /** En limite : la cause, et la distance (m, arrondie à 5 m) quand la zone est à côté sans toucher. */
  limite: { cause: CauseLimite; distanceM: number | null } | null;
  /** Incertain : la cause. */
  motifIncertain: "geometrie" | "diffusion_ambigue" | "contredit_arrete" | null;
  /** D'où vient le zonage lu. */
  source: { producteur: string; diffuseur: string; edition: string; licence: string; url: string } | null;
};

// ── Décodage ─────────────────────────────────────────────────────────────────────────────────

/** 0,1 degré en unités de 1e-7 degré : le pas de la grille des tuiles. */
export const PAS_TUILE = 1_000_000;
const ECHELLE = 1e7;

export const cleTuile = (ix: number, iy: number) => `${ix}_${iy}`;

/**
 * L'identifiant d'une édition publiée : la date d'édition de l'IGN (`2026-03-01`), suivie d'un numéro de révision
 * quand le même millésime IGN est reconstruit avec un contenu différent (`2026-03-01.2`). Une édition publiée est
 * IMMUABLE : un contenu nouveau prend toujours un identifiant neuf (`scripts/debroussaillement/publier.mjs`).
 */
export const EDITION = /^\d{4}-\d{2}-\d{2}(?:\.[1-9]\d*)?$/;

const entier = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v);

export function manifesteValide(m: unknown): m is ManifesteDebroussaillement {
  const x = m as ManifesteDebroussaillement | null;
  return !!x && typeof x === "object" && x.format === FORMAT_TUILES_DEBROUSSAILLEMENT
    && typeof x.edition === "string" && EDITION.test(x.edition)
    && Array.isArray(x.couverture) && x.couverture.length > 0 && x.couverture.every((d) => typeof d === "string")
    && Array.isArray(x.profils) && x.profils.length > 0
    && !!x.tuiles && typeof x.tuiles === "object" && Object.keys(x.tuiles).length > 0
    && !!x.source && typeof x.source.url === "string";
}

export function tuileValide(t: unknown, attendu: { edition: string; ix: number; iy: number; profils: number }): t is TuileDebroussaillement {
  const x = t as TuileDebroussaillement | null;
  return !!x && typeof x === "object" && x.format === FORMAT_TUILES_DEBROUSSAILLEMENT && x.edition === attendu.edition
    && x.ix === attendu.ix && x.iy === attendu.iy && Array.isArray(x.morceaux)
    && x.morceaux.every((m) => entier(m.p) && m.p >= 0 && m.p < attendu.profils && typeof m.o === "string"
      && Array.isArray(m.r) && m.r.length > 0 && m.r.every((a) => Array.isArray(a) && a.length >= 6 && a.length % 2 === 0 && a.every(entier)));
}

/** Un anneau codé → ses sommets entiers (1e-7 degré), fermé. */
function sommets(code: number[]): [number, number][] {
  let x = code[0];
  let y = code[1];
  const pts: [number, number][] = [[x, y]];
  for (let i = 2; i < code.length; i += 2) {
    x += code[i];
    y += code[i + 1];
    pts.push([x, y]);
  }
  pts.push(pts[0]);
  return pts;
}

type Boite = [number, number, number, number];

/** Un morceau prêt à mesurer : sa géométrie (lon, lat) et ses vraies limites, sans les coupes de la grille. */
type Piece = { profil: number; objet: string; ambigu: boolean; nonMesurable: boolean; geometrie: Geometrie; limites: number[][][] };

/**
 * CE QU'IL Y A DE L'AUTRE CÔTÉ D'UNE DROITE DE LA GRILLE (revue indépendante du 29/10/2026). Une arête posée sur
 * le bord de sa cellule est, le plus souvent, une coupe de tuile : la zone continue dans la cellule voisine. Mais
 * une VRAIE limite de zone peut être exactement alignée sur la grille (la zone s'arrête là, ou s'y arrêtait déjà
 * dans la base) ; l'écarter faisait lire « en zone » ou « hors zone » un point à 10 m de cette limite. La première
 * version écartait toute arête alignée : elle confondait les deux. Désormais, l'arête n'est écartée que là où la
 * cellule voisine est couverte par une zone, juste de l'autre côté.
 *
 * `couvert(ix, iy, x, y)` : le point entier (x, y), dans la cellule (ix, iy), est-il dans une zone publiée ?
 * `true` (cellule pleine, ou un morceau le contient), `false` (cellule absente du manifeste, ou aucun morceau),
 * `null` (cellule listée mais non chargée : on ne sait pas). Un `null` garde l'arête comme limite : dans le doute,
 * la lecture penche vers « en limite », jamais vers une conclusion.
 */
type Couvert = (ix: number, iy: number, x: number, y: number) => boolean | null;

/** Le pas (en 1e-7 degré, environ 5 m) auquel une arête alignée est découpée pour regarder de l'autre côté. */
const PAS_EXAMEN = 500;

/**
 * Les arêtes d'un anneau qui sont de VRAIES limites de zone, en polylignes (lon, lat). Une arête posée sur une
 * droite de la grille qui borde la cellule n'est écartée que par morceaux, là où la cellule voisine est couverte
 * de l'autre côté (cf. `Couvert`). Seules sont gardées les arêtes qui passent dans la `fenetre` (entiers) ; d'une
 * arête alignée, seuls les morceaux qui la croisent.
 */
function vraiesLimites(pts: [number, number][], ix: number, iy: number, fenetre: Boite, couvert: Couvert): number[][][] {
  const [X0, Y0, X1, Y1] = [ix * PAS_TUILE, iy * PAS_TUILE, (ix + 1) * PAS_TUILE, (iy + 1) * PAS_TUILE];
  const [fx0, fy0, fx1, fy1] = fenetre;
  const out: number[][][] = [];
  let cours: number[][] | null = null;
  const garder = (ax: number, ay: number, bx: number, by: number) => {
    const der = cours?.[cours.length - 1];
    if (!cours || der![0] !== ax / ECHELLE || der![1] !== ay / ECHELLE) { cours = [[ax / ECHELLE, ay / ECHELLE]]; out.push(cours); }
    cours.push([bx / ECHELLE, by / ECHELLE]);
  };
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const loin = Math.max(ax, bx) < fx0 || Math.min(ax, bx) > fx1 || Math.max(ay, by) < fy0 || Math.min(ay, by) > fy1;
    if (loin) { cours = null; continue; }
    // La cellule voisine de l'autre côté de l'arête alignée, et le pas d'un cran (1e-7 degré) vers elle.
    const voisin: [number, number, number, number] | null =
      ax === bx && ax === X0 ? [ix - 1, iy, -1, 0] : ax === bx && ax === X1 ? [ix + 1, iy, 1, 0]
        : ay === by && ay === Y0 ? [ix, iy - 1, 0, -1] : ay === by && ay === Y1 ? [ix, iy + 1, 0, 1] : null;
    if (!voisin) { garder(ax, ay, bx, by); continue; }
    const [vx, vy, dx, dy] = voisin;
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / PAS_EXAMEN));
    // Seuls les pas qui croisent la fenêtre sont examinés, avec un pas de marge de chaque côté : une arête alignée
    // court parfois sur des kilomètres, et l'examiner en entier coûtait jusqu'à une seconde de calcul par lecture
    // (contre-revue du 30/10/2026). Ce qui est hors de la fenêtre est trop loin pour compter.
    const [a, b, f0, f1] = ax === bx ? [ay, by, fy0, fy1] : [ax, bx, fx0, fx1];
    const t0 = (Math.max(f0, Math.min(a, b)) - a) / (b - a || 1);
    const t1 = (Math.min(f1, Math.max(a, b)) - a) / (b - a || 1);
    const kmin = Math.max(0, Math.floor(Math.min(t0, t1) * n) - 1);
    const kmax = Math.min(n, Math.ceil(Math.max(t0, t1) * n) + 1);
    for (let k = kmin; k < kmax; k++) {
      const [px, py] = [Math.round(ax + ((bx - ax) * k) / n), Math.round(ay + ((by - ay) * k) / n)];
      const [qx, qy] = [Math.round(ax + ((bx - ax) * (k + 1)) / n), Math.round(ay + ((by - ay) * (k + 1)) / n)];
      const [mx, my] = [Math.round((px + qx) / 2) + dx, Math.round((py + qy) / 2) + dy];
      // Couvert de l'autre côté : la zone continue, c'est une coupe de tuile. Sinon (ou inconnu) : une vraie limite.
      if (couvert(vx, vy, mx, my) === true) cours = null;
      else garder(px, py, qx, qy);
    }
  }
  return out;
}

function piece(ix: number, iy: number, m: { p: number; o: string; a?: 1; v?: 0 }, anneaux: [number, number][][], fenetre: Boite, couvert: Couvert): Piece {
  return {
    profil: m.p, objet: m.o, ambigu: m.a === 1, nonMesurable: m.v === 0,
    geometrie: { type: "Polygon", coordinates: anneaux.map((a) => a.map(([x, y]) => [x / ECHELLE, y / ECHELLE])) },
    limites: anneaux.flatMap((a) => vraiesLimites(a, ix, iy, fenetre, couvert)),
  };
}

/** Le carré d'une cellule, en sommets entiers. */
function carre(ix: number, iy: number): [number, number][] {
  const [x0, y0, x1, y1] = [ix * PAS_TUILE, iy * PAS_TUILE, (ix + 1) * PAS_TUILE, (iy + 1) * PAS_TUILE];
  return [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];
}

/** Point dans un polygone (anneaux entiers, extérieur puis trous), règle pair-impair, sans projection. */
function dansMorceau([x, y]: [number, number], anneaux: [number, number][][]): boolean {
  const dans = (a: [number, number][]) => {
    let d = false;
    for (let i = 0, j = a.length - 1; i < a.length; j = i++) {
      if ((a[i][1] > y) !== (a[j][1] > y) && x < ((a[j][0] - a[i][0]) * (y - a[i][1])) / (a[j][1] - a[i][1]) + a[i][0]) d = !d;
    }
    return d;
  };
  return dans(anneaux[0]) && !anneaux.slice(1).some(dans);
}

// ── La préparation : portée, parcelle, fenêtre, tuiles ───────────────────────────────────────

/** L'entrée : le point de l'adresse, sa précision, la commune, et la parcelle telle que la collecte l'a rattachée. */
export type EntreeDebroussaillement = {
  point: [number, number];
  /** Type de la feature BAN (`housenumber`…) ; `null` si inconnu (module Autour : point seul). */
  geocodage: string | null;
  /** Code Insee de la commune ; `null` si inconnu. */
  insee: string | null;
  parcelle: { geometry: Geometrie; rattachement: "point" | "repli"; candidatsAuPoint?: number } | null;
};

/**
 * EN DEÇÀ DE CETTE DISTANCE DE LA LIMITE DE LA PARCELLE, LE POINT DE L'ADRESSE EST « SUR LA LIMITE » : la parcelle
 * n'est pas attribuée (elle pourrait être celle du voisin). Même valeur que la tolérance de contact de FUT-81
 * (`TOLERANCE_M`, 1 cm) : bien plus fine que tout tracé, elle ne sert qu'à ne pas trancher un point posé sur le trait.
 */
export const TOLERANCE_POINT_PARCELLE_M = TOLERANCE_M;

/** Au-delà, une parcelle couvre trop de tuiles pour une lecture d'adresse : elle est lue au point (rarissime). */
const TUILES_MAX = 4;
/** La fenêtre de lecture déborde de la limite proche, plus une marge. */
const MARGE_M = LIMITE_PROCHE_M + 10;

const porteeDe = (geocodage: string | null): PorteeDebroussaillement =>
  geocodage == null ? "non_precisee" : geocodage === "housenumber" ? "adresse" : "secteur";

/** Le département d'une commune : « 33 » pour 33529, « 2A » pour 2A004, « 974 » pour 97411. */
export function departementInsee(insee: string | null | undefined): string | null {
  const c = (insee ?? "").trim().toUpperCase();
  if (/^97\d{3}$/.test(c)) return c.slice(0, 3);
  if (/^(\d{2}|2A|2B)\d{3}$/.test(c)) return c.slice(0, 2);
  return null;
}

type Preparation = {
  portee: PorteeDebroussaillement;
  parcelleEcartee: LectureDebroussaillement["parcelleEcartee"];
  parcelle: Region | null;
  proj: ReturnType<typeof projectionAutour>;
  /** Fenêtre en degrés [lonMin, latMin, lonMax, latMax] et en entiers de 1e-7 degré. */
  fenetreDeg: Boite;
  fenetreInt: Boite;
  cellules: [number, number][];
};

function cellulesDe([x0, y0, x1, y1]: Boite): [number, number][] {
  const out: [number, number][] = [];
  for (let ix = Math.floor(x0 * 10); ix <= Math.floor(x1 * 10); ix++) {
    for (let iy = Math.floor(y0 * 10); iy <= Math.floor(y1 * 10); iy++) out.push([ix, iy]);
  }
  return out;
}

function boiteDegres(points: number[][], [lon, lat]: [number, number], margeM: number): Boite {
  // 110 000 m par degré : un peu moins que le degré réel partout, donc une marge un peu plus large que demandé.
  const dLat = margeM / 110_000;
  const dLon = margeM / (110_000 * Math.max(0.1, Math.cos((lat * Math.PI) / 180)));
  let [x0, y0, x1, y1] = [lon, lat, lon, lat];
  for (const [x, y] of points) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return [x0 - dLon, y0 - dLat, x1 + dLon, y1 + dLat];
}

function sommetsLonLat(g: Geometrie): number[][] {
  const out: number[][] = [];
  const parcourir = (v: unknown) => {
    if (Array.isArray(v) && v.length >= 2 && typeof v[0] === "number" && typeof v[1] === "number") out.push(v as number[]);
    else if (Array.isArray(v)) v.forEach(parcourir);
  };
  if (g) parcourir(g.coordinates);
  return out;
}

function preparer(e: EntreeDebroussaillement): Preparation {
  const portee = porteeDe(e.geocodage);
  const proj = projectionAutour(e.point[0], e.point[1]);
  let parcelleEcartee: Preparation["parcelleEcartee"] = null;
  let parcelle: Region | null = null;
  if (!e.parcelle) parcelleEcartee = "absente";
  else if (e.parcelle.rattachement === "repli") parcelleEcartee = "repli";
  else if ((e.parcelle.candidatsAuPoint ?? 1) > 1) parcelleEcartee = "limite";
  else {
    parcelle = regionDe(e.parcelle.geometry, proj);
    if (!parcelle || !(aireRegion(parcelle) > 0) || !regionMesurable(parcelle)) { parcelle = null; parcelleEcartee = "non_mesurable"; }
    else {
      // LE POINT DOIT ÊTRE DANS LA PARCELLE (revue indépendante du 29/10/2026). `rattachement: "point"` dit comment
      // la collecte a trouvé la parcelle, pas qu'elle contient le point : on le vérifie ici, sur la géométrie. Un
      // point dehors, ou posé sur la limite (à moins de `TOLERANCE_POINT_PARCELLE_M`), ne laisse pas attribuer le
      // zonage de cette parcelle au logement : la lecture se fait au point, et le dit.
      const lieu = classer(pointsDe({ type: "Point", coordinates: e.point }, proj)![0], parcelle, TOLERANCE_POINT_PARCELLE_M).lieu;
      if (lieu !== "dedans") { parcelle = null; parcelleEcartee = lieu === "bord" ? "limite" : "hors_point"; }
    }
  }
  // Une parcelle trouvée autour d'un point de rue n'est pas celle du bien : la lecture de secteur l'ignore.
  if (portee !== "adresse") { parcelle = null; parcelleEcartee = null; }
  let fenetreDeg = boiteDegres(parcelle ? sommetsLonLat(e.parcelle!.geometry) : [], e.point, MARGE_M);
  let cellules = cellulesDe(fenetreDeg);
  if (parcelle && cellules.length > TUILES_MAX) {
    parcelle = null;
    parcelleEcartee = "etendue";
    fenetreDeg = boiteDegres([], e.point, MARGE_M);
    cellules = cellulesDe(fenetreDeg);
  }
  const fenetreInt = fenetreDeg.map((v, i) => (i < 2 ? Math.floor(v * ECHELLE) : Math.ceil(v * ECHELLE))) as Boite;
  return { portee, parcelleEcartee, parcelle, proj, fenetreDeg, fenetreInt, cellules };
}

/** Toutes les cellules que la lecture d'une adresse consulte (avec ou sans fichier). */
export function cellulesDeLecture(e: EntreeDebroussaillement): string[] {
  return preparer(e).cellules.map(([ix, iy]) => cleTuile(ix, iy));
}

/**
 * Les tuiles à lire pour une adresse (celles qui ont un fichier) : la fenêtre du point, ou de la parcelle, plus
 * la limite proche. Une à quatre en pratique.
 */
export function tuilesALire(m: ManifesteDebroussaillement, e: EntreeDebroussaillement): string[] {
  return cellulesDeLecture(e).filter((k) => {
    const t = m.tuiles[k];
    return !!t && !("plein" in t);
  });
}

// ── La lecture ───────────────────────────────────────────────────────────────────────────────

const arrondi = (v: number, pas: number) => { const k = Math.round(1 / pas); return Math.round(v * k) / k; };
const arrondi5 = (m: number) => Math.max(5, Math.round(m / 5) * 5);

function source(m: ManifesteDebroussaillement): NonNullable<LectureDebroussaillement["source"]> {
  return { producteur: m.producteur, diffuseur: m.diffuseur, edition: m.edition, licence: m.licence, url: m.source.url };
}

/** Le profil du département : le plus récent par l'arrêté, puis par l'intégration (un département en a d'ordinaire un seul). */
function profilDuDepartement(m: ManifesteDebroussaillement, dep: string | null): ProfilZonage | null {
  if (!dep) return null;
  const l = m.profils.filter((p) => p.departement === dep);
  l.sort((a, b) => (b.arrete ?? "").localeCompare(a.arrete ?? "") || (b.integration ?? "").localeCompare(a.integration ?? ""));
  return l[0] ?? null;
}

/** Une lecture qui n'a pas pu se faire. Une panne n'est JAMAIS une absence de zone. */
export function debroussaillementIndisponible(e: Pick<EntreeDebroussaillement, "geocodage" | "insee">, m?: ManifesteDebroussaillement | null): LectureDebroussaillement {
  return {
    convention: DEBROUSSAILLEMENT_CONVENTION, statut: "indisponible", etat: "incertain", grain: "point",
    portee: porteeDe(e.geocodage), parcelleEcartee: null, departement: departementInsee(e.insee),
    zone: null, profilDepartement: null, part: null, surfaceM2: null, limite: null, motifIncertain: null,
    source: m ? source(m) : null,
  };
}

/**
 * LA LECTURE D'UNE ADRESSE. `tuiles` : les tuiles chargées (clé → contenu décodé et vérifié). Toute tuile que
 * `tuilesALire` demande doit y être : une tuile manquante rend la lecture `indisponible`, jamais « hors zone ».
 */
export function lireDebroussaillement(
  m: unknown, tuiles: ReadonlyMap<string, TuileDebroussaillement>, e: EntreeDebroussaillement,
): LectureDebroussaillement {
  if (!manifesteValide(m)) return debroussaillementIndisponible(e);
  const prep = preparer(e);
  const departement = departementInsee(e.insee);
  // Les anneaux entiers de chaque cellule chargée (pleine : son carré), pour lire les pièces et regarder de
  // l'autre côté des droites de la grille.
  const anneauxDe = new Map<string, { m: { p: number; o: string; a?: 1; v?: 0 }; anneaux: [number, number][][] }[]>();
  for (const [ix, iy] of prep.cellules) {
    const k = cleTuile(ix, iy);
    const entree = m.tuiles[k];
    if (!entree) continue; // aucune zone publiée dans cette cellule : absence établie
    if ("plein" in entree) { anneauxDe.set(k, [{ m: entree.plein, anneaux: [carre(ix, iy)] }]); continue; }
    const t = tuiles.get(k);
    if (!t) return debroussaillementIndisponible(e, m);
    anneauxDe.set(k, t.morceaux.map((x) => ({ m: x, anneaux: x.r.map(sommets) })));
  }
  const couvert: Couvert = (ix, iy, x, y) => {
    const k = cleTuile(ix, iy);
    if (!m.tuiles[k]) return false;
    const contenu = anneauxDe.get(k);
    if (!contenu) return null;
    return contenu.some((c) => dansMorceau([x, y], c.anneaux));
  };
  const toutes: Piece[] = [];
  for (const [ix, iy] of prep.cellules) {
    for (const c of anneauxDe.get(cleTuile(ix, iy)) ?? []) toutes.push(piece(ix, iy, c.m, c.anneaux, prep.fenetreInt, couvert));
  }
  const base = {
    convention: DEBROUSSAILLEMENT_CONVENTION as typeof DEBROUSSAILLEMENT_CONVENTION, statut: "lu" as const, portee: prep.portee, parcelleEcartee: prep.parcelleEcartee,
    departement, profilDepartement: profilDuDepartement(m, departement), source: source(m),
  };
  const resultat = prep.parcelle
    ? lireALaParcelle(toutes, prep.parcelle, prep.proj)
    : lireAuPoint(toutes, prep.proj, e.point);
  const zone = resultat.profil != null ? m.profils[resultat.profil] ?? null : null;
  let etat: EtatDebroussaillement = resultat.etat;
  // Hors de toute zone : la conclusion n'est permise que dans un département qui a un zonage publié.
  if (etat === "hors_zone" && (!departement || !m.couverture.includes(departement))) etat = "non_couvert";
  // Une zone publiée dans une commune dont l'arrêté exclut tous les bois : la base et l'arrêté se contredisent.
  let motif = resultat.motif;
  const insee = (e.insee ?? "").toUpperCase();
  if ((etat === "en_zone" || etat === "en_limite") && m.exclusionsArretes?.[insee]) { etat = "incertain"; motif = "contredit_arrete"; }
  return {
    ...base, grain: prep.parcelle ? "parcelle" : "point", etat,
    zone: etat === "en_zone" || etat === "en_limite" ? zone : null,
    part: resultat.part, surfaceM2: resultat.surfaceM2, limite: etat === "en_limite" ? resultat.limite : null,
    motifIncertain: etat === "incertain" ? motif : null,
    profilDepartement: base.profilDepartement ?? (zone && etat !== "non_couvert" ? zone : null),
  };
}

type Resultat = {
  etat: Exclude<EtatDebroussaillement, "non_couvert">;
  profil: number | null;
  part: number | null;
  surfaceM2: number | null;
  limite: LectureDebroussaillement["limite"];
  motif: LectureDebroussaillement["motifIncertain"];
};
const resultat = (etat: Resultat["etat"], r: Partial<Resultat> = {}): Resultat => ({ etat, profil: null, part: null, surfaceM2: null, limite: null, motif: null, ...r });

type Proj = ReturnType<typeof projectionAutour>;
type Pt = [number, number];

/** La distance d'un point aux VRAIES limites des morceaux (Infinity s'il n'y en a aucune dans la fenêtre). */
function distanceAuxLimites(ici: Pt, ps: Piece[], proj: Proj): number {
  let d = Infinity;
  for (const p of ps) {
    if (p.limites.length === 0) continue;
    const l = lignesDe({ type: "MultiLineString", coordinates: p.limites }, proj);
    if (l) d = Math.min(d, distanceLignes(ici, l));
  }
  return d;
}

/**
 * Au point. Dedans : un morceau le contient (un point posé sur une coupe de tuile est dedans : la coupe traverse
 * la zone). La limite proche se mesure aux seules vraies limites.
 */
function lireAuPoint(ps: Piece[], proj: Proj, point: Pt): Resultat {
  const ici = pointsDe({ type: "Point", coordinates: point }, proj)![0];
  let contient: Piece | null = null;
  let proche: { p: Piece; d: number } | null = null;
  for (const p of ps) {
    const region = regionDe(p.geometrie, proj);
    if (!region) return resultat("incertain", { motif: "geometrie" });
    const dedans = classer(ici, region).lieu !== "dehors";
    const dLimite = distanceAuxLimites(ici, [p], proj);
    // Une donnée qu'on ne peut pas lire, ou dont la diffusion est ambiguë, ne décide de rien près du point.
    if ((p.nonMesurable || p.ambigu) && (dedans || dLimite <= LIMITE_PROCHE_M)) {
      return resultat("incertain", { motif: p.ambigu ? "diffusion_ambigue" : "geometrie", profil: p.profil });
    }
    if (dedans && !contient) contient = p;
    if (dLimite <= LIMITE_PROCHE_M && (!proche || dLimite < proche.d)) proche = { p, d: dLimite };
  }
  if (contient && !proche) return resultat("en_zone", { profil: contient.profil });
  if (proche) {
    return resultat("en_limite", {
      profil: (contient ?? proche.p).profil,
      limite: { cause: "point_proche", distanceM: contient ? null : arrondi5(proche.d) },
    });
  }
  return resultat("hors_zone");
}

/**
 * À la parcelle. La parcelle EST le bien : la proximité du point ne compte plus, seule la part de la parcelle
 * dans le zonage. Les seuils de FUT-81 s'appliquent dans les deux sens : un reste de moins de 2 % est l'écart de
 * tracé entre le zonage et le cadastre. Au-delà de 98 %, la parcelle est dans le zonage ; entre 2 et 98 %, elle
 * est à cheval sur sa limite (l'obligation suit les constructions, dont l'emplacement n'est pas connu) ; en deçà
 * de 2 %, mais au-delà d'un simple contact de tracés, elle le borde ; sans le toucher, à moins de 50 m, elle en
 * est proche.
 */
function lireALaParcelle(ps: Piece[], parcelle: Region, proj: Proj): Resultat {
  const aireParcelle = aireRegion(parcelle);
  let aire = 0;
  let meilleur: { p: Piece; aire: number } | null = null;
  for (const p of ps) {
    const region = regionDe(p.geometrie, proj);
    // Une aire que le calcul ne peut pas garantir n'alimente jamais une attribution (cf. FUT-81).
    const a = region && !p.nonMesurable ? aireIntersection(parcelle, region) : null;
    if (a == null) {
      if (!region || p.nonMesurable) {
        // Non mesurable : incertaine seulement si elle touche la parcelle ou passe tout près.
        if (!region || distanceParcelle(parcelle, [p], proj) <= LIMITE_PROCHE_M) return resultat("incertain", { motif: "geometrie", profil: p.profil });
        continue;
      }
      return resultat("incertain", { motif: "geometrie", profil: p.profil });
    }
    if (a < SURFACE_CONTACT_M2) continue;
    if (p.ambigu) return resultat("incertain", { motif: "diffusion_ambigue", profil: p.profil });
    aire += a;
    if (!meilleur || a > meilleur.aire) meilleur = { p, aire: a };
  }
  // Les zones ne se recouvrent pas (contrôlé à la construction : moins de 1 m² sur toute la base) : les aires
  // s'additionnent. La part est bornée à 1 par sûreté.
  const part = Math.min(1, arrondi(aire / aireParcelle, 0.001));
  if (meilleur && part >= 1 - PART_MIN) return resultat("en_zone", { profil: meilleur.p.profil, part, surfaceM2: arrondi(aire, 0.1) });
  if (meilleur && part >= PART_MIN) return resultat("en_limite", { profil: meilleur.p.profil, part, surfaceM2: arrondi(aire, 0.1), limite: { cause: "a_cheval", distanceM: null } });
  if (meilleur) return resultat("en_limite", { profil: meilleur.p.profil, part, surfaceM2: arrondi(aire, 0.1), limite: { cause: "bordure", distanceM: null } });
  // Ni recouvrement ni contact : la zone la plus proche, mesurée depuis la parcelle.
  let proche: { p: Piece; d: number } | null = null;
  for (const p of ps) {
    const d = distanceParcelle(parcelle, [p], proj);
    if (d <= LIMITE_PROCHE_M && (!proche || d < proche.d)) proche = { p, d };
  }
  if (proche) {
    if (proche.p.ambigu) return resultat("incertain", { motif: "diffusion_ambigue", profil: proche.p.profil });
    // Un contact de limites (moins d'un mètre, sans surface commune mesurable) se dit « touche la limite », pas
    // « à 5 m » : c'est une bordure de surface nulle.
    if (proche.d < 1) return resultat("en_limite", { profil: proche.p.profil, part: 0, surfaceM2: 0, limite: { cause: "bordure", distanceM: null } });
    return resultat("en_limite", { profil: proche.p.profil, limite: { cause: "parcelle_proche", distanceM: arrondi5(proche.d) } });
  }
  return resultat("hors_zone");
}

/**
 * La plus courte distance entre la parcelle et les VRAIES limites des morceaux. Entre deux ensembles de segments
 * qui ne se croisent pas, elle est atteinte en un sommet de l'un des deux : sommets de la parcelle contre les
 * limites, sommets des limites contre la parcelle.
 */
function distanceParcelle(parcelle: Region, ps: Piece[], proj: Proj): number {
  let d = Infinity;
  for (const p of ps) {
    if (p.limites.length === 0) continue;
    const l = lignesDe({ type: "MultiLineString", coordinates: p.limites }, proj);
    if (!l) continue;
    for (const a of parcelle) for (const v of a) d = Math.min(d, distanceLignes(v, l));
    for (const ligne of l) for (const v of ligne) d = Math.min(d, distanceRegion(v, parcelle));
  }
  return d;
}
