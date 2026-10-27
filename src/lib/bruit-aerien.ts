// LE BRUIT AÉRIEN RÉGLEMENTAIRE À UNE ADRESSE (FUT-146). Lib PURE : aucune I/O, testée sous `node --test`.
// Le jeu (`data/bruit-aerien.json`) est extrait de la publication DGAC par `scripts/build-bruit-aerien.mjs` ;
// il est chargé côté serveur par `server/bruit-aerien-jeu.ts`. Le TYPE est lu côté client.
//
// ── DEUX DOCUMENTS, DEUX RÔLES, JAMAIS CONFONDUS ─────────────────────────────────────────────
//  - Le PLAN D'EXPOSITION AU BRUIT (PEB, zones A à D) est un document d'URBANISME (Code de l'urbanisme,
//    L112-10 et suivants). Il encadre la construction autour d'un aérodrome à partir de PRÉVISIONS de
//    trafic. Il ne mesure pas le bruit entendu dans un logement. En vente ou en location, le vendeur ou
//    le bailleur remet un « état des nuisances sonores aériennes » (L112-11).
//  - Le PLAN DE GÊNE SONORE (PGS, zones I à III, onze aérodromes) délimite les zones où les riverains
//    PEUVENT bénéficier d'une aide à l'insonorisation. Être dans la zone n'ouvre aucun droit : la date
//    du logement, le PEB en vigueur à son autorisation et une aide déjà reçue en décident.
//
// ── CE QUE LA LIB ÉTABLIT, ET À QUEL TITRE ────────────────────────────────────────────────────
//  A. Fait publié : les zones de chaque plan, l'aérodrome, la date de l'arrêté (retenue seulement si
//     l'attribut et le nom du document concordent), le document officiel.
//  B. Calcul dérivé : la zone qui contient le point de l'adresse, ou la part de la parcelle couverte par
//     chaque zone (aire exacte, `geometrie-parcelle.ts`, mêmes seuils que les ZONES de FUT-81 : une zone
//     couvre la parcelle au-delà de 2 % ; en deçà, un liseré de 25 m² ou plus est dit comme une bordure ;
//     en deçà de 25 m², c'est l'écart de tracé entre le plan et le cadastre, il n'est pas dit). Quand le bien touche
//     deux zones, la plus exposée est retenue : c'est la règle de la notice DGAC de juin 2020 (« si le
//     bien se situe sur deux zones, il convient de retenir la zone de bruit la plus importante »).
//  C. Portée : « à l'adresse » seulement avec un géocodage au numéro ET une parcelle rattachée au point.
//     Sinon la lecture décrit le secteur.
//
// ── CE QU'ELLE NE FAIT PAS, ET C'EST DÉLIBÉRÉ ─────────────────────────────────────────────────
//  - Aucun niveau sonore, aucun décibel : les vieux plans (Coulommiers 1984, Rouen 1991) sont même
//    exprimés dans un indice qui n'est plus utilisé. Une zone dit ce que le plan prévoit, pas ce qu'on entend.
//  - Aucune constructibilité ni interdiction déduite : L112-10 énumère des exceptions selon la zone, le
//    projet et le secteur, et un plan en révision peut s'appliquer par anticipation (L112-14, L112-15).
//  - Aucun droit à l'aide déduit du PGS.
//  - « Hors zone » ne veut jamais dire « pas de bruit d'avion » : un survol hors zone reste possible.
//  - Une géométrie qu'on ne sait pas mesurer ne produit jamais un « hors zone » : elle rend la lecture incertaine.

import {
  aireIntersection, aireRegion, classer, distanceLignes, pointsDe, projectionAutour, regionDe, regionMesurable,
  type Geometrie, type Region,
} from "./geometrie-parcelle.ts";
import { PART_MIN, SURFACE_CONTACT_M2, SURFACE_MIN_M2 } from "./urbanisme-nomenclature.ts";

export { BRUIT_AERIEN_CONVENTION, LIMITE_PROCHE_M, RAYON_VOISINAGE_M } from "./bruit-aerien-constantes.ts";
import { BRUIT_AERIEN_CONVENTION, LIMITE_PROCHE_M, RAYON_VOISINAGE_M } from "./bruit-aerien-constantes.ts";

// ── Le jeu de données (forme de `data/bruit-aerien.json`) ─────────────────────────────────────

export type PlanBruit = "peb" | "pgs";
export type ZonePeb = "A" | "B" | "C" | "D";
export type ZonePgs = "I" | "II" | "III";

export type ZonePubliee = {
  id: string;
  oaci: string;
  /** Le nom tel que la DGAC le publie (souvent abrégé : « M. PROVENCE »). */
  aerodrome: string;
  zone: string;
  /** AAAA-MM-JJ, seulement quand l'attribut et le nom du document concordent. */
  dateArrete: string | null;
  document: string | null;
  /** Polygone mesurable au sens de FUT-81, vérifié à l'extraction. */
  valide: boolean;
  /** [lonMin, latMin, lonMax, latMax]. */
  bbox: [number, number, number, number];
  geometry: Geometrie;
};

export type MetaJeu = {
  schema: string;
  extraitLe: string;
  producteur: string;
  diffuseur: string;
  licence: string;
};

export type JeuBruitAerien = { meta: MetaJeu; peb: ZonePubliee[]; pgs: ZonePubliee[] };

// ── La lecture publiée (contrat du rapport) ──────────────────────────────────────────────────

/**
 * L'ÉTAT D'UN PLAN À L'ADRESSE.
 * `en_zone` : la zone retenue est établie (point loin de toute limite, ou parcelle couverte au-delà des seuils).
 * `en_limite` : une limite de zone passe tout près (point), ou la parcelle ne touche une zone qu'en bordure.
 * `hors_zone` : aucune zone de ce plan ici, et une zone à moins de `RAYON_VOISINAGE_M` (sinon : `absent`).
 * `absent` : aucune zone de ce plan dans le voisinage. Rien n'est affiché.
 * `incertain` : une géométrie proche n'a pas pu être mesurée ; rien n'est conclu.
 */
export type EtatPlan = "en_zone" | "en_limite" | "hors_zone" | "absent" | "incertain";

export type Aerodrome = { oaci: string; nom: string };

export type ZoneLue = {
  zone: string;
  aerodrome: Aerodrome;
  dateArrete: string | null;
  document: string | null;
  /** Part de la parcelle (0 à 1), à la parcelle seulement. */
  part: number | null;
  /** Aire (m²) de la parcelle dans la zone, à la parcelle seulement. */
  surfaceM2: number | null;
};

export type LecturePlan = {
  etat: EtatPlan;
  /** La zone retenue (la plus exposée qui couvre le bien, ou qui contient le point). */
  retenue: ZoneLue | null;
  /** Les autres zones qui couvrent le bien (parcelle) ou contiennent le point. */
  autres: ZoneLue[];
  /** Les zones qui ne font que border le bien, ou dont la limite passe tout près du point. */
  enLimite: ZoneLue[];
  /** La zone la plus proche quand le point n'est dans aucune (`hors_zone`), et sa distance (m, arrondie). */
  plusProche: (ZoneLue & { distanceM: number }) | null;
};

/**
 * COMMENT LE BIEN A ÉTÉ SITUÉ. `parcelle` : la parcelle, rattachée au point et mesurable, a été croisée avec
 * les zones. `point` : le point de l'adresse seul (parcelle absente, non mesurable, ou rattachée par
 * proximité ou sur une limite : elle pourrait être celle d'un voisin).
 */
export type GrainBruit = "parcelle" | "point";

/**
 * « adresse » : géocodé au numéro. « secteur » : géocodé à la rue, au lieu-dit ou à la commune.
 * « non_precisee » : la précision n'a pas été transmise (module Autour, qui ne garde que le point). La
 * parcelle n'est alors jamais utilisée, et aucune phrase n'affirme une précision qu'on ignore.
 */
export type PorteeBruit = "adresse" | "secteur" | "non_precisee";

const porteeDe = (geocodage: string | null): PorteeBruit =>
  geocodage == null ? "non_precisee" : geocodage === "housenumber" ? "adresse" : "secteur";

export type LectureBruitAerien = {
  convention: typeof BRUIT_AERIEN_CONVENTION;
  /** `indisponible` : le jeu n'a pas pu être lu. Jamais une absence de zone. */
  statut: "lu" | "indisponible";
  grain: GrainBruit;
  portee: PorteeBruit;
  /** Pourquoi la parcelle n'a pas servi, quand elle n'a pas servi. */
  parcelleEcartee: "absente" | "non_mesurable" | "repli" | "limite" | null;
  peb: LecturePlan;
  pgs: LecturePlan;
  /** D'où vient le jeu lu, et quand il a été extrait. */
  source: { producteur: string; diffuseur: string; extraitLe: string; licence: string } | null;
};

// ── Les noms d'aérodromes ─────────────────────────────────────────────────────────────────────

/**
 * Les noms que la DGAC publie en abrégé, développés pour un lecteur. Seuls les noms abrégés sont ici ;
 * les autres sont repris tels que publiés, en casse normale. Le code OACI reste dit dans « En savoir plus ».
 */
const NOMS: Record<string, string> = {
  LFBD: "Bordeaux-Mérignac", LFBF: "Toulouse-Francazal", LFBO: "Toulouse-Blagnac", LFBT: "Tarbes-Lourdes-Pyrénées",
  LFCL: "Toulouse-Lasbordes", LFCS: "Bordeaux-Léognan-Saucats", LFHJ: "Lyon-Corbas", LFHV: "Villefranche-Tarare",
  LFJL: "Metz-Nancy-Lorraine", LFLB: "Chambéry-Aix-les-Bains", LFLL: "Lyon-Saint-Exupéry", LFLX: "Châteauroux-Déols",
  LFLY: "Lyon-Bron", LFMN: "Nice-Côte d'Azur", LFML: "Marseille-Provence", LFNG: "Montpellier-Candillargues",
  LFOB: "Beauvais-Tillé", LFOZ: "Orléans-Saint-Denis-de-l'Hôtel", LFPB: "Paris-Le Bourget", LFPG: "Paris-Charles de Gaulle",
  LFPO: "Paris-Orly", LFQQ: "Lille-Lesquin", LFRB: "Brest-Bretagne", LFRS: "Nantes-Atlantique", LFSB: "Bâle-Mulhouse",
  LFSC: "Colmar-Meyenheim", LFST: "Strasbourg-Entzheim", LFDN: "Rochefort-Saint-Agnant", LFCG: "Saint-Girons",
};

function casse(s: string): string {
  return s.toLowerCase().replace(/(^|[\s'’-])([a-zà-ÿ])/g, (_, a: string, b: string) => a + b.toUpperCase());
}

export function nomAerodrome(oaci: string, publie: string): string {
  return NOMS[oaci] ?? casse(publie.trim());
}

// ── La lecture ───────────────────────────────────────────────────────────────────────────────

const ORDRE: Record<PlanBruit, string[]> = { peb: ["A", "B", "C", "D"], pgs: ["I", "II", "III"] };
const rang = (plan: PlanBruit, z: string) => {
  const i = ORDRE[plan].indexOf(z);
  return i < 0 ? 99 : i;
};
const arrondi = (v: number, pas: number) => { const k = Math.round(1 / pas); return Math.round(v * k) / k; };

/** L'entrée : le point de l'adresse, sa précision, et la parcelle telle que la collecte l'a rattachée. */
export type EntreeBruitAerien = {
  point: [number, number];
  /** Type de la feature BAN (`housenumber`, `street`, `locality`, `municipality`) ; `null` si inconnu. */
  geocodage: string | null;
  parcelle: { geometry: Geometrie; rattachement: "point" | "repli"; candidatsAuPoint?: number } | null;
};

function zoneLue(z: ZonePubliee, part: number | null = null, surfaceM2: number | null = null): ZoneLue {
  return {
    zone: z.zone, aerodrome: { oaci: z.oaci, nom: nomAerodrome(z.oaci, z.aerodrome) },
    dateArrete: z.dateArrete, document: z.document, part, surfaceM2,
  };
}

/** Une même zone d'un même aérodrome (plusieurs polygones) ne se lit qu'une fois. */
const cle = (z: { zone: string; aerodrome: Aerodrome }) => `${z.aerodrome.oaci}|${z.zone}`;
function dedoublonner(l: ZoneLue[]): ZoneLue[] {
  const vus = new Map<string, ZoneLue>();
  for (const z of l) {
    const d = vus.get(cle(z));
    if (!d) vus.set(cle(z), { ...z });
    else if (d.part != null && z.part != null) {
      d.part = Math.min(1, arrondi(d.part + z.part, 0.001));
      d.surfaceM2 = arrondi((d.surfaceM2 ?? 0) + (z.surfaceM2 ?? 0), 0.1);
    }
  }
  return [...vus.values()];
}

/** Les zones dont l'emprise passe à moins de `marge` mètres du point (préfiltre, sans géométrie). */
function candidates(zones: ZonePubliee[], [lon, lat]: [number, number], marge: number): ZonePubliee[] {
  const dLat = marge / 111_000;
  const dLon = marge / (111_000 * Math.max(0.1, Math.cos((lat * Math.PI) / 180)));
  return zones.filter(({ bbox: [x0, y0, x1, y1] }) => lon >= x0 - dLon && lon <= x1 + dLon && lat >= y0 - dLat && lat <= y1 + dLat);
}

const vide = (etat: EtatPlan): LecturePlan => ({ etat, retenue: null, autres: [], enLimite: [], plusProche: null });

/**
 * Un plan, lu au point. Les distances sont calculées sur le tracé publié : la tolérance de clic d'un
 * service n'intervient jamais.
 */
function lireAuPoint(plan: PlanBruit, zones: ZonePubliee[], point: [number, number]): LecturePlan {
  const proj = projectionAutour(point[0], point[1]);
  const ici = pointsDe({ type: "Point", coordinates: point }, proj)![0];
  const contient: ZoneLue[] = [];
  const limites: ZoneLue[] = [];
  for (const z of candidates(zones, point, LIMITE_PROCHE_M + 10)) {
    const r = regionDe(z.geometry, proj);
    if (!r) return vide("incertain");
    // Distance au TRACÉ de la zone (ses anneaux), que le point soit dedans ou dehors.
    const dLimite = distanceLignes(ici, r);
    const dedans = classer(ici, r).lieu !== "dehors";
    // Une géométrie invalide ne décide de rien près du point : ni dedans, ni dehors.
    if (!z.valide && (dedans || dLimite <= LIMITE_PROCHE_M)) return vide("incertain");
    if (dedans) {
      contient.push(zoneLue(z));
      if (dLimite <= LIMITE_PROCHE_M) limites.push(zoneLue(z));
    } else if (dLimite <= LIMITE_PROCHE_M) limites.push(zoneLue(z));
  }
  const tous = dedoublonner(contient).sort((a, b) => rang(plan, a.zone) - rang(plan, b.zone));
  const enLimite = dedoublonner(limites).sort((a, b) => rang(plan, a.zone) - rang(plan, b.zone));
  if (tous.length > 0) {
    return { etat: enLimite.length > 0 ? "en_limite" : "en_zone", retenue: tous[0], autres: tous.slice(1), enLimite, plusProche: null };
  }
  if (enLimite.length > 0) return { etat: "en_limite", retenue: null, autres: [], enLimite, plusProche: null };
  return horsZone(zones, point);
}

/**
 * Un plan, lu à la parcelle. La parcelle EST le bien : la proximité du point à une limite ne compte plus,
 * seule la part de la parcelle dans chaque zone. Au-delà de `PART_MIN`, la zone couvre le bien ; en deçà,
 * mais au-delà d'un simple contact de tracés, elle le borde.
 */
function lireALaParcelle(plan: PlanBruit, zones: ZonePubliee[], point: [number, number], parcelle: Region, aireParcelle: number, proj: ReturnType<typeof projectionAutour>): LecturePlan {
  const couvre: ZoneLue[] = [];
  const borde: ZoneLue[] = [];
  // Le préfiltre couvre toute la parcelle : son sommet le plus éloigné du point, plus une marge.
  const etendue = Math.max(...parcelle.flatMap((a) => a.map(([x, y]) => Math.hypot(x, y))));
  for (const z of candidates(zones, point, etendue + 10)) {
    const r = regionDe(z.geometry, proj);
    // Une aire que le calcul ne peut pas garantir n'alimente jamais une attribution (cf. FUT-81).
    const aire = r ? aireIntersection(parcelle, r) : null;
    if (aire == null) return vide("incertain");
    if (aire < SURFACE_CONTACT_M2) continue;
    if (!z.valide) return vide("incertain");
    const part = Math.min(1, arrondi(aire / aireParcelle, 0.001));
    if (part >= PART_MIN) couvre.push(zoneLue(z, part, arrondi(aire, 0.1)));
    // Un liseré de moins de 25 m² est l'écart de tracé entre le plan et le cadastre (cf. FUT-81).
    else if (aire >= SURFACE_MIN_M2) borde.push(zoneLue(z, part, arrondi(aire, 0.1)));
  }
  const tous = dedoublonner(couvre).sort((a, b) => rang(plan, a.zone) - rang(plan, b.zone));
  const enLimite = dedoublonner(borde)
    .filter((b) => !tous.some((t) => cle(t) === cle(b)))
    .sort((a, b) => rang(plan, a.zone) - rang(plan, b.zone));
  if (tous.length > 0) {
    return { etat: enLimite.length > 0 ? "en_limite" : "en_zone", retenue: tous[0], autres: tous.slice(1), enLimite, plusProche: null };
  }
  if (enLimite.length > 0) return { etat: "en_limite", retenue: null, autres: [], enLimite, plusProche: null };
  // La parcelle ne touche aucune zone : la zone la plus proche se mesure depuis le point de l'adresse.
  return horsZone(zones, point);
}

/** Hors de toute zone : la plus proche à moins de `RAYON_VOISINAGE_M`, ou rien. */
function horsZone(zones: ZonePubliee[], point: [number, number]): LecturePlan {
  const proj = projectionAutour(point[0], point[1]);
  const ici = pointsDe({ type: "Point", coordinates: point }, proj)![0];
  let plusProche: (ZoneLue & { distanceM: number }) | null = null;
  for (const z of candidates(zones, point, RAYON_VOISINAGE_M)) {
    const r = regionDe(z.geometry, proj);
    if (!r) return vide("incertain");
    const d = distanceLignes(ici, r);
    if (d <= RAYON_VOISINAGE_M && (!plusProche || d < plusProche.distanceM)) plusProche = { ...zoneLue(z), distanceM: d };
  }
  return plusProche ? { ...vide("hors_zone"), plusProche: { ...plusProche, distanceM: Math.round(plusProche.distanceM / 10) * 10 } } : vide("absent");
}

/** Une lecture qui n'a pas pu se faire. Une panne n'est JAMAIS une absence de zone. */
export function bruitAerienIndisponible(geocodage: string | null = null): LectureBruitAerien {
  return {
    convention: BRUIT_AERIEN_CONVENTION, statut: "indisponible", grain: "point",
    portee: porteeDe(geocodage), parcelleEcartee: null,
    peb: vide("incertain"), pgs: vide("incertain"), source: null,
  };
}

/** Le jeu est-il lisible ? Une forme inattendue vaut une panne, jamais une absence. */
export function jeuValide(j: unknown): j is JeuBruitAerien {
  const x = j as JeuBruitAerien | null;
  return !!x && typeof x === "object" && !!x.meta && typeof x.meta.extraitLe === "string"
    && Array.isArray(x.peb) && Array.isArray(x.pgs) && x.peb.length > 0 && x.pgs.length > 0;
}

/**
 * LA LECTURE D'UNE ADRESSE. Sans parcelle utilisable (absente, non mesurable, rattachée par proximité ou sur
 * une limite), ou sans géocodage au numéro, elle se fait au point et le dit.
 */
export function lireBruitAerien(jeu: unknown, e: EntreeBruitAerien): LectureBruitAerien {
  if (!jeuValide(jeu)) return bruitAerienIndisponible(e.geocodage);
  const portee = porteeDe(e.geocodage);
  const proj = projectionAutour(e.point[0], e.point[1]);
  let parcelleEcartee: LectureBruitAerien["parcelleEcartee"] = null;
  let region: Region | null = null;
  if (!e.parcelle) parcelleEcartee = "absente";
  else if (e.parcelle.rattachement === "repli") parcelleEcartee = "repli";
  else if ((e.parcelle.candidatsAuPoint ?? 1) > 1) parcelleEcartee = "limite";
  else {
    region = regionDe(e.parcelle.geometry, proj);
    if (!region || !(aireRegion(region) > 0) || !regionMesurable(region)) { region = null; parcelleEcartee = "non_mesurable"; }
  }
  // Une parcelle trouvée autour d'un point de rue n'est pas celle du bien : elle ne sert qu'au numéro, et
  // la lecture de secteur ne la mentionne pas.
  if (portee !== "adresse") { region = null; parcelleEcartee = null; }
  const lire = (plan: PlanBruit) => region
    ? lireALaParcelle(plan, jeu[plan], e.point, region, aireRegion(region), proj)
    : lireAuPoint(plan, jeu[plan], e.point);
  const { producteur, diffuseur, extraitLe, licence } = jeu.meta;
  return {
    convention: BRUIT_AERIEN_CONVENTION, statut: "lu", grain: region ? "parcelle" : "point", portee, parcelleEcartee,
    peb: lire("peb"), pgs: lire("pgs"), source: { producteur, diffuseur, extraitLe, licence },
  };
}
