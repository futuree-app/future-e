// LE PLAN D'URBANISME DE LA PARCELLE (FUT-81). Lib PURE : aucune I/O, testée sous `node --test`. La
// collecte vit dans `gpu.ts` (server-only) ; le TYPE est lu côté client par le module Logement.
//
// ── CE QU'ELLE ÉTABLIT, ET À QUEL TITRE ───────────────────────────────────────────────────────
//  A. Fait publié : le document d'urbanisme applicable (PLU, PLUi, PSMV, carte communale), la ou les
//     zones qui couvrent la parcelle, les prescriptions cartographiées sur elle, le règlement à lire.
//     Tous viennent du Géoportail de l'urbanisme (GPU), dans la nomenclature nationale du CNIG.
//  C. Calcul dérivé : la PART de la parcelle couverte par chaque zone ou prescription, estimée par une
//     grille de points. Elle ne sert qu'à séparer une zone qui couvre la parcelle d'une zone voisine
//     qui en touche la limite (écart de tracé entre le plan et le cadastre : 12 parcelles sur 25
//     mesurées le 26/10/2026, dont 9 des 16 tirées au hasard). Elle n'est jamais une surface constructible.
//
// ── CE QU'ELLE NE FAIT PAS, ET C'EST DÉLIBÉRÉ ─────────────────────────────────────────────────
//  - Aucune conclusion de constructibilité ni d'autorisation : un zonage ne dit pas ce qui est permis,
//    le règlement écrit, les prescriptions et l'instruction de la mairie le disent.
//  - Une absence de donnée n'est JAMAIS une absence de règle : une commune sans document publié reste
//    soumise à des règles (RNU, ou un document non versé au GPU).
//  - Les prescriptions locales foisonnent (17 sur une parcelle lyonnaise) : seules les familles qui
//    changent une vérification d'acheteur sont nommées ; les autres sont comptées par famille et
//    renvoyées au règlement.

/** Convention de lecture, portée par chaque lecture : un dossier dit sous quelles règles il a été lu. */
export const URBANISME_CONVENTION = "fut81-1";

/**
 * EN DEÇÀ DE CES DEUX SEUILS, UNE ZONE (OU PRESCRIPTION) NE COUVRE PAS LA PARCELLE, ELLE EN TOUCHE LA
 * LIMITE. Mesuré le 26/10/2026 : les zones voisines rendues par l'intersection couvrent de 0 à 0,1 %
 * de la parcelle ; la plus petite part réelle relevée est de 2,4 % (1 300 m² sur 5,5 ha à Sucy-en-Brie).
 * Le second seuil garde une bande réelle sur une grande parcelle (un emplacement réservé de voirie de
 * 45 m², 0,9 % d'une parcelle de 5 000 m² à Mérignac).
 */
export const PART_MIN = 0.02;
export const SURFACE_MIN_M2 = 25;

export const GPU_SITE = "https://www.geoportail-urbanisme.gouv.fr";

// ── Types publiés (contrat du rapport) ───────────────────────────────────────────────────────

/** Le statut de la lecture. `non_trouve` n'est jamais « aucune règle » ; `indisponible` jamais « aucune ». */
export type StatutUrbanisme = "confirme" | "ambigu" | "non_trouve" | "indisponible";

/** Le régime de la commune. `rnu` : règlement national d'urbanisme, sans document local. */
export type RegimeUrbanisme = "document" | "rnu" | "inconnu";

export type Ambiguite = "plusieurs_documents" | "document_hors_vigueur" | "zone_non_lue";

export type TypeZone = "U" | "AUc" | "AUs" | "A" | "N";

export type Reglement =
  | { statut: "publie"; url: string; source: "gpu" | "producteur" }
  | { statut: "non_publie" | "indisponible" };

export type DocumentUrbanisme = {
  id: string;
  type: string; // PLU, PLUi, PSMV, CC, POS…, tel que le GPU le nomme
  titre: string | null;
  producteur: string | null;
  /** `null` : le détail officiel n'a pas répondu, le statut n'est pas vérifié. */
  enVigueur: boolean | null;
  /** Date d'approbation de la dernière procédure (AAAA-MM-JJ), lue dans l'identifiant CNIG. */
  approbation: string | null;
  /** Date de publication au Géoportail (AAAA-MM-JJ). */
  publication: string | null;
  url: string;
};

export type ZoneParcelle = {
  libelle: string;
  libelong: string | null;
  typezone: TypeZone | null;
  /** Part de la parcelle (0 à 1), calcul dérivé. `null` : lecture au point, sans géométrie de parcelle. */
  part: number | null;
  documentId: string;
  reglement: Reglement;
};

export type SecteurCarteCommunale = {
  libelle: string;
  typesect: "01" | "02" | "03" | "99" | null;
  part: number | null;
  documentId: string;
};

export type FamillePrescription = "01" | "02" | "03" | "05" | "07" | "08" | "16-01" | "16-02" | "16-03" | "24" | "31";

export type PrescriptionParcelle = {
  famille: FamillePrescription;
  /** Libellé du producteur, tel que publié (« Emplacement réservé n°12 : élargissement… »). */
  libelle: string;
  forme: "surface" | "ligne" | "point";
  part: number | null;
};

export type UrbanismeParcelle = {
  convention: typeof URBANISME_CONVENTION;
  statut: StatutUrbanisme;
  regime: RegimeUrbanisme;
  /** Ce que le GPU déclare de la commune : au RNU, hors RNU, ou `null` s'il n'a pas répondu. */
  communeRnu: boolean | null;
  grain: "parcelle" | "point";
  documents: DocumentUrbanisme[];
  zones: ZoneParcelle[];
  /** Zones qui touchent la limite de la parcelle sans la couvrir (sous les seuils). */
  zonesEnLimite: string[];
  secteurs: SecteurCarteCommunale[];
  prescriptions: PrescriptionParcelle[];
  /** Familles des AUTRES prescriptions de la parcelle, à lire dans le règlement (stationnement, hauteur…). */
  autresPrescriptions: string[];
  prescriptionsStatut: "ok" | "indisponible";
  ambiguites: Ambiguite[];
};

// ── Nomenclatures nationales (standard CNIG PLU v2024-01 et carte communale) ─────────────────

export const TYPE_ZONE: Record<TypeZone, string> = {
  U: "zone urbaine",
  AUc: "zone à urbaniser",
  AUs: "zone à urbaniser dont l'ouverture suppose une évolution du plan",
  A: "zone agricole",
  N: "zone naturelle et forestière",
};

export const TYPE_SECTEUR: Record<"01" | "02" | "03" | "99", string> = {
  "01": "secteur ouvert à la construction",
  "02": "secteur réservé aux activités",
  "03": "secteur non ouvert à la construction, sauf exceptions prévues par la loi",
  "99": "secteur non couvert par la carte",
};

export const TYPE_DOCUMENT: Record<string, string> = {
  PLU: "plan local d'urbanisme",
  PLUi: "plan local d'urbanisme intercommunal",
  PSMV: "plan de sauvegarde et de mise en valeur",
  CC: "carte communale",
  POS: "plan d'occupation des sols",
};

/**
 * LES FAMILLES QUI CHANGENT UNE VÉRIFICATION D'ACHETEUR. Le libellé est la famille nationale ; la
 * note dit l'effet que lui donne le code de l'urbanisme, puis ce qu'il faut vérifier, sans jamais
 * conclure sur le projet du lecteur.
 */
export const FAMILLES: Record<FamillePrescription, { titre: string; note: string }> = {
  "01": {
    titre: "Espace boisé classé",
    note: "Le classement protège le boisement : il interdit son défrichement et tout aménagement qui compromettrait sa conservation. À vérifier avant d'envisager une construction ou un abattage sur cette partie du terrain.",
  },
  "02": {
    titre: "Constructibilité limitée pour une raison de risque, d'environnement ou d'intérêt général",
    note: "Le plan interdit ou conditionne ici les constructions. Le motif et les conditions se lisent dans le règlement.",
  },
  "03": {
    titre: "Règles particulières de démolition ou de reconstruction",
    note: "Le plan encadre ici la démolition ou la reconstruction des bâtiments. À lire dans le règlement avant tout projet.",
  },
  "05": {
    titre: "Emplacement réservé",
    note: "Une partie du terrain est réservée à un futur aménagement public (voie, équipement, espace vert). Demandez en mairie son objet et son bénéficiaire : cette partie ne peut pas accueillir une construction contraire à cette destination.",
  },
  "07": {
    titre: "Élément de patrimoine ou de paysage protégé",
    note: "Le plan protège ici un élément bâti, paysager ou écologique. Les travaux qui le modifient ou le suppriment demandent une autorisation préalable, et une démolition peut être refusée.",
  },
  "08": {
    titre: "Terrain non bâti protégé en zone urbaine",
    note: "Le plan déclare cette partie du terrain inconstructible, pour préserver un espace cultivé ou une continuité écologique.",
  },
  "16-01": {
    titre: "Bâtiment pouvant changer de destination",
    note: "Le plan désigne ce bâtiment comme pouvant changer de destination, par exemple devenir un logement. Le changement reste soumis à autorisation, et à l'avis d'une commission départementale en zone agricole ou naturelle.",
  },
  "16-02": {
    titre: "Habitation existante pouvant recevoir une extension ou des annexes",
    note: "En zone agricole ou naturelle, le plan admet ici l'extension ou les annexes d'une habitation existante, dans les limites de surface, de hauteur et de distance que fixe le règlement.",
  },
  "16-03": {
    titre: "Secteur de taille et de capacité d'accueil limitées",
    note: "Le plan admet ici, à titre exceptionnel, des constructions limitées en zone agricole ou naturelle. Les conditions se lisent dans le règlement.",
  },
  "24": {
    titre: "Voie à créer ou à modifier",
    note: "Le plan prévoit ici la création ou la modification d'une voie. Demandez en mairie le tracé exact : il peut emprunter une partie du terrain.",
  },
  "31": {
    titre: "Espace remarquable du littoral",
    note: "La loi Littoral protège cet espace naturel : seuls des aménagements légers y sont admis.",
  },
};

/** Le code 99 du CNIG : une prescription que le producteur n'a pas classée. */
export const AUTRE_PRESCRIPTION = "autre prescription";

/** Les autres familles, nommées pour être cherchées dans le règlement (jamais commentées). */
const AUTRES: Record<string, string> = {
  "04": "stationnement", "13": "domaine skiable", "14": "plan de masse", "15": "implantation des constructions",
  "16": "constructions en zone agricole ou naturelle", "17": "mixité sociale", "18": "orientations d'aménagement",
  "19": "richesse du sol", "20": "transfert de constructibilité", "22": "diversité commerciale",
  "23": "taille minimale des logements", "24": "voies et cheminements", "25": "continuités écologiques",
  "26": "performance énergétique", "27": "aménagement numérique", "28": "conditions de desserte",
  "29": "densité minimale", "30": "majoration des volumes constructibles", "36": "mixité des destinations",
  "37": "règles différenciées selon les étages", "38": "emprise au sol", "39": "hauteur", "40": "volumétrie",
  "41": "aspect extérieur", "42": "coefficient de biotope", "43": "espaces libres et plantations",
  "44": "stationnement", "45": "surfaces de plancher en ZAC", "47": "desserte par les réseaux",
  "48": "gestion des eaux pluviales", "49": "opération d'ensemble", "50": "destinations interdites",
  "51": "destinations sous conditions", "52": "équipements logistiques", "97": "secteur à pièce écrite particulière",
};

function familleDe(code: string, sousCode: string): FamillePrescription | null {
  if (["01", "02", "03", "05", "07", "08", "31"].includes(code)) return code as FamillePrescription;
  if (code === "16" && ["01", "02", "03"].includes(sousCode)) return `16-${sousCode}` as FamillePrescription;
  if (code === "24" && ["01", "02", "03"].includes(sousCode)) return "24";
  return null;
}

// ── Géométrie (calcul dérivé) ────────────────────────────────────────────────────────────────

type Position = number[];
export type Geometrie = { type: string; coordinates: unknown } | null | undefined;

function polygones(g: Geometrie): Position[][][] {
  if (!g) return [];
  if (g.type === "Polygon") return [g.coordinates as Position[][]];
  if (g.type === "MultiPolygon") return g.coordinates as Position[][][];
  return [];
}
function lignes(g: Geometrie): Position[][] {
  if (!g) return [];
  if (g.type === "LineString") return [g.coordinates as Position[]];
  if (g.type === "MultiLineString") return g.coordinates as Position[][];
  return [];
}
function points(g: Geometrie): Position[] {
  if (!g) return [];
  if (g.type === "Point") return [g.coordinates as Position];
  if (g.type === "MultiPoint") return g.coordinates as Position[];
  return [];
}

/** Arêtes d'un anneau qui coupent la bande horizontale [y0, y1] : les seules utiles au lancer de rayon. */
function aretes(anneau: Position[], y0: number, y1: number): number[][] {
  const out: number[][] = [];
  for (let i = 0, j = anneau.length - 1; i < anneau.length; j = i++) {
    const [xi, yi] = anneau[i];
    const [xj, yj] = anneau[j];
    if (Math.max(yi, yj) < y0 || Math.min(yi, yj) > y1) continue;
    out.push([xi, yi, xj, yj]);
  }
  return out;
}
function dans(x: number, y: number, ar: number[][]): boolean {
  let inside = false;
  for (const [xi, yi, xj, yj] of ar) {
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
type Prepare = { exterieur: number[][]; trous: number[][][] }[];
function preparer(g: Geometrie, y0: number, y1: number): Prepare {
  return polygones(g).map((p) => ({ exterieur: aretes(p[0] ?? [], y0, y1), trous: p.slice(1).map((t) => aretes(t, y0, y1)) }));
}
function dansPrepare(x: number, y: number, p: Prepare): boolean {
  return p.some((poly) => dans(x, y, poly.exterieur) && !poly.trous.some((t) => dans(x, y, t)));
}

/** Les points d'une grille régulière qui tombent dans la parcelle. Assez fins pour un seuil de 2 %. */
function grille(parcelle: Geometrie, n = 60): { pts: Position[]; y0: number; y1: number } {
  const sommets = polygones(parcelle).flatMap((p) => p[0] ?? []);
  if (sommets.length < 3) return { pts: [], y0: 0, y1: 0 };
  const xs = sommets.map((s) => s[0]);
  const ys = sommets.map((s) => s[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const prep = preparer(parcelle, y0, y1);
  const pts: Position[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const x = x0 + ((i + 0.5) / n) * (x1 - x0);
      const y = y0 + ((j + 0.5) / n) * (y1 - y0);
      if (dansPrepare(x, y, prep)) pts.push([x, y]);
    }
  }
  return { pts, y0, y1 };
}

/** Part de la parcelle couverte par chaque géométrie surfacique (0 à 1), ou `null` si elle n'est pas mesurable. */
export function partsDansParcelle(parcelle: Geometrie, geoms: Geometrie[]): (number | null)[] {
  const { pts, y0, y1 } = grille(parcelle);
  if (pts.length === 0) return geoms.map(() => null);
  // Arrondie au millième : la grille n'est pas plus précise, et deux collectes identiques doivent
  // donner la même empreinte de rapport.
  return geoms.map((g) => {
    const prep = preparer(g, y0, y1);
    return Math.round((pts.filter(([x, y]) => dansPrepare(x, y, prep)).length / pts.length) * 1000) / 1000;
  });
}

/** Une ligne ou un point tombe-t-il À L'INTÉRIEUR de la parcelle (pas seulement sur sa limite) ? */
export function traverseParcelle(parcelle: Geometrie, g: Geometrie): boolean {
  const sommets = polygones(parcelle).flatMap((p) => p[0] ?? []);
  if (sommets.length < 3) return false;
  const ys = sommets.map((s) => s[1]);
  const prep = preparer(parcelle, Math.min(...ys), Math.max(...ys));
  // Une ligne est échantillonnée tous les ~1 m : un linéaire posé sur la limite (façade, clôture) ne
  // compte pas, il peut aussi bien concerner le voisin.
  const echantillon: Position[] = [...points(g)];
  for (const l of lignes(g)) {
    for (let i = 0; i + 1 < l.length; i++) {
      const [ax, ay] = l[i];
      const [bx, by] = l[i + 1];
      const m = Math.hypot((bx - ax) * 78_000, (by - ay) * 111_000);
      const n = Math.max(1, Math.ceil(m));
      for (let k = 1; k < n; k++) echantillon.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]);
    }
  }
  return echantillon.some(([x, y]) => dansPrepare(x, y, prep));
}

/** La part est-elle assez grande pour dire que la zone COUVRE la parcelle (et pas qu'elle la touche) ? */
export function couvre(part: number | null, contenance: number | null): boolean {
  if (part == null) return true; // lecture au point : la zone contient le point lu
  if (part >= PART_MIN) return true;
  return contenance != null && part * contenance >= SURFACE_MIN_M2;
}

// ── Entrée brute (réponses GPU) ──────────────────────────────────────────────────────────────

type Props = Record<string, unknown>;
export type GpuFeature = { properties?: Props | null; geometry?: Geometrie };

/** Ce que la collecte a rapporté. `null` = l'appel n'a pas abouti (panne, délai), jamais « rien ». */
export type EntreeUrbanisme = {
  parcelle: { geometry: Geometrie; contenance: number | null } | null;
  municipality: GpuFeature[] | null;
  documents: GpuFeature[] | null;
  zones: GpuFeature[] | null;
  secteurs: GpuFeature[] | null;
  prescriptions: { surface: GpuFeature[] | null; ligne: GpuFeature[] | null; point: GpuFeature[] | null };
  details: Record<string, Props | null>;
  fichiers: Record<string, { name?: unknown; title?: unknown }[] | null>;
};

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const ID_DOC = /^[0-9a-f]{32}$/;

/** Une URL n'entre dans un lien que si c'est du http(s) : la donnée vient de producteurs tiers. */
function urlSure(v: unknown): string | null {
  const s = str(v);
  return s && /^https?:\/\/[^\s"'<>]+$/i.test(s) ? s : null;
}
/** « 20260305 » -> « 2026-03-05 », seulement si la date existe. */
function dateCompacte(s: string | null): string | null {
  const m = s?.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (!m) return null;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.getUTCDate() !== Number(m[3]) ? null : `${m[1]}-${m[2]}-${m[3]}`;
}
/** L'identifiant CNIG d'un document finit par la date d'approbation : `<SIREN>_PLUi_20260305{_A}`. */
export function approbationDepuisNom(nom: string | null): string | null {
  const m = nom?.match(/_(\d{8})(?:_[A-Z0-9]+)?$/i);
  return m ? dateCompacte(m[1]) : null;
}
/** « 12/05/2026 14:28:15 » -> « 2026-05-12 ». */
function dateFr(s: string | null): string | null {
  const m = s?.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? dateCompacte(`${m[3]}${m[2]}${m[1]}`) : null;
}

/**
 * LE RÈGLEMENT D'UNE ZONE. Le standard CNIG nomme dans `nomfic` le fichier qui porte le règlement de la
 * zone. On ne le remplace JAMAIS par le règlement général du document quand il manque : une zone de
 * secteur sauvegardé (La Rochelle) relève du PSMV, pas du règlement du PLUi qui la contient.
 */
export function reglementDeZone(
  documentId: string, fichiers: { name?: unknown; title?: unknown }[] | null, nomfic: string | null, urlfic: string | null,
): Reglement {
  if (fichiers == null) return urlfic ? { statut: "publie", url: urlfic, source: "producteur" } : { statut: "indisponible" };
  const nom = (f: { name?: unknown }) => (typeof f.name === "string" ? f.name : "");
  const lien = (n: string): Reglement => ({ statut: "publie", url: `${GPU_SITE}/api/document/${documentId}/files/${encodeURIComponent(n)}`, source: "gpu" });
  if (nomfic) {
    const f = fichiers.find((x) => nom(x).toLowerCase() === nomfic.toLowerCase());
    if (f) return lien(nom(f));
  } else {
    const f = fichiers.find((x) => typeof x.title === "string" && /^r[èe]glement( [ée]crit)?$/i.test(x.title.trim()));
    if (f) return lien(nom(f));
  }
  return urlfic ? { statut: "publie", url: urlfic, source: "producteur" } : { statut: "non_publie" };
}

function typeZone(v: unknown): TypeZone | null {
  return v === "U" || v === "AUc" || v === "AUs" || v === "A" || v === "N" ? v : null;
}
function typeSecteur(v: unknown): SecteurCarteCommunale["typesect"] {
  return v === "01" || v === "02" || v === "03" || v === "99" ? v : null;
}

/** Une lecture qui n'a pas pu se faire. Une panne n'est JAMAIS une absence de règle. */
export function urbanismeIndisponible(): UrbanismeParcelle {
  return {
    convention: URBANISME_CONVENTION, statut: "indisponible", regime: "inconnu", communeRnu: null, grain: "point",
    documents: [], zones: [], zonesEnLimite: [], secteurs: [], prescriptions: [], autresPrescriptions: [],
    prescriptionsStatut: "indisponible", ambiguites: [],
  };
}

// ── La lecture ───────────────────────────────────────────────────────────────────────────────

export function lireUrbanisme(e: EntreeUrbanisme): UrbanismeParcelle {
  // Sans la liste des documents, ou sans aucune des deux couches de zonage, rien n'est établi.
  if (e.documents == null || (e.zones == null && e.secteurs == null)) return urbanismeIndisponible();

  const grain = e.parcelle?.geometry ? "parcelle" : "point";
  const geomParcelle = e.parcelle?.geometry ?? null;
  const contenance = e.parcelle?.contenance ?? null;
  const rnu = e.municipality?.find((m) => typeof m.properties?.is_rnu === "boolean")?.properties?.is_rnu as boolean | undefined;

  // 1. Les documents (un même document peut revenir plusieurs fois : dédoublonné par identifiant).
  const documents: DocumentUrbanisme[] = [];
  for (const d of e.documents) {
    const p = d.properties ?? {};
    const id = str(p.gpu_doc_id) ?? str(p.id);
    if (!id || !ID_DOC.test(id) || documents.some((x) => x.id === id)) continue;
    const det = e.details[id] ?? null;
    const enVigueur = det
      ? det.effectiveStatus === "EN_VIGUEUR" && (det.legalStatus == null || det.legalStatus === "APPROVED")
      : null;
    documents.push({
      id,
      type: str(p.du_type) ?? str(det?.type) ?? "document",
      titre: str(det?.title) ?? str(p.grid_title),
      producteur: str(det?.producer),
      enVigueur,
      approbation: approbationDepuisNom(str(p.name) ?? str(det?.originalName)),
      publication: dateFr(str(det?.publicationDate)) ?? dateCompacte(str(p.gpu_timestamp)?.slice(0, 10).replace(/-/g, "") ?? null),
      url: `${GPU_SITE}/document/by-id/${id}`,
    });
  }
  const connus = new Set(documents.map((d) => d.id));
  const docDe = (p: Props) => str(p.gpu_doc_id);

  if (documents.length === 0) {
    // Aucun document publié : le RNU s'il est déclaré, sinon une règle qu'on n'a pas pu identifier.
    const base = urbanismeIndisponible();
    return {
      ...base,
      statut: rnu === true ? "confirme" : "non_trouve",
      regime: rnu === true ? "rnu" : "inconnu",
      communeRnu: rnu ?? null,
      grain,
      prescriptionsStatut: e.prescriptions.surface == null ? "indisponible" : "ok",
    };
  }

  // 2. Les zones et secteurs, mesurés sur la parcelle.
  const zonesBrutes = (e.zones ?? []).filter((z) => connus.has(docDe(z.properties ?? {}) ?? ""));
  const secteursBruts = (e.secteurs ?? []).filter((s) => connus.has(docDe(s.properties ?? {}) ?? ""));
  const partsZones = geomParcelle ? partsDansParcelle(geomParcelle, zonesBrutes.map((z) => z.geometry)) : zonesBrutes.map(() => null);
  const partsSecteurs = geomParcelle ? partsDansParcelle(geomParcelle, secteursBruts.map((s) => s.geometry)) : secteursBruts.map(() => null);

  const zones: ZoneParcelle[] = [];
  const enLimite: string[] = [];
  zonesBrutes.forEach((z, i) => {
    const p = z.properties ?? {};
    const libelle = str(p.libelle) ?? "zone sans libellé";
    const part = partsZones[i];
    if (!couvre(part, contenance)) {
      if (!enLimite.includes(libelle)) enLimite.push(libelle);
      return;
    }
    const documentId = docDe(p)!;
    // Une zone découpée en plusieurs polygones se lit une fois, ses parts additionnées.
    const deja = zones.find((x) => x.libelle === libelle && x.documentId === documentId);
    if (deja) {
      if (deja.part != null && part != null) deja.part = Math.min(1, Math.round((deja.part + part) * 1000) / 1000);
      return;
    }
    zones.push({
      libelle, libelong: str(p.libelong), typezone: typeZone(p.typezone), part, documentId,
      reglement: reglementDeZone(documentId, e.fichiers[documentId] ?? null, str(p.nomfic), urlSure(p.urlfic)),
    });
  });
  zones.sort((a, b) => (b.part ?? 0) - (a.part ?? 0));
  const zonesEnLimite = enLimite.filter((l) => !zones.some((z) => z.libelle === l));

  const secteurs: SecteurCarteCommunale[] = [];
  secteursBruts.forEach((s, i) => {
    const p = s.properties ?? {};
    const part = partsSecteurs[i];
    if (!couvre(part, contenance)) return;
    const libelle = str(p.libelle) ?? "secteur";
    if (secteurs.some((x) => x.libelle === libelle)) return;
    secteurs.push({ libelle, typesect: typeSecteur(p.typesect), part, documentId: docDe(p)! });
  });
  secteurs.sort((a, b) => (b.part ?? 0) - (a.part ?? 0));

  // 3. Les prescriptions qui concernent la parcelle elle-même (jamais celles de la parcelle voisine).
  const pres = e.prescriptions;
  const prescriptionsStatut = pres.surface == null || pres.ligne == null || pres.point == null ? "indisponible" : "ok";
  const surfaces = (pres.surface ?? []).filter((x) => connus.has(docDe(x.properties ?? {}) ?? ""));
  const partsSurf = geomParcelle ? partsDansParcelle(geomParcelle, surfaces.map((x) => x.geometry)) : surfaces.map(() => null);
  const candidats: { p: Props; forme: PrescriptionParcelle["forme"]; part: number | null }[] = [
    ...surfaces.map((x, i) => ({ p: x.properties ?? {}, forme: "surface" as const, part: partsSurf[i] }))
      .filter((c) => couvre(c.part, contenance)),
    ...[["ligne", pres.ligne], ["point", pres.point]].flatMap(([forme, fs]) =>
      ((fs as GpuFeature[] | null) ?? [])
        .filter((x) => connus.has(docDe(x.properties ?? {}) ?? ""))
        .filter((x) => !geomParcelle || traverseParcelle(geomParcelle, x.geometry))
        .map((x) => ({ p: x.properties ?? {}, forme: forme as PrescriptionParcelle["forme"], part: null }))),
  ];
  const prescriptions: PrescriptionParcelle[] = [];
  const autres = new Set<string>();
  for (const c of candidats) {
    const code = str(c.p.typepsc) ?? "";
    const sousCode = str(c.p.stypepsc) ?? "00";
    const famille = familleDe(code, sousCode);
    if (!famille) {
      autres.add(AUTRES[code] ?? AUTRE_PRESCRIPTION);
      continue;
    }
    const libelle = str(c.p.libelle) ?? FAMILLES[famille].titre;
    // Le même libellé publié plusieurs fois (polygones découpés) se lit une fois, à sa plus grande part.
    const deja = prescriptions.find((x) => x.famille === famille && x.libelle === libelle);
    if (deja) {
      if (c.part != null && (deja.part == null || c.part > deja.part)) deja.part = c.part;
      continue;
    }
    prescriptions.push({ famille, libelle, forme: c.forme, part: c.part });
  }

  // 4. Ce qui reste incertain, dit.
  const ambiguites: Ambiguite[] = [];
  if (new Set([...zones.map((z) => z.documentId), ...secteurs.map((s) => s.documentId)]).size > 1) ambiguites.push("plusieurs_documents");
  if (documents.some((d) => d.enVigueur === false || d.type === "POS")) ambiguites.push("document_hors_vigueur");
  if (zones.length === 0 && secteurs.length === 0) ambiguites.push("zone_non_lue");

  return {
    convention: URBANISME_CONVENTION,
    statut: ambiguites.length > 0 ? "ambigu" : "confirme",
    regime: "document",
    communeRnu: rnu ?? null,
    grain,
    documents,
    zones,
    zonesEnLimite,
    secteurs,
    prescriptions,
    autresPrescriptions: [...autres].sort((a, b) => a.localeCompare(b, "fr")),
    prescriptionsStatut,
    ambiguites,
  };
}
