// LE PLAN D'URBANISME DE LA PARCELLE (FUT-81). Lib PURE : aucune I/O, testée sous `node --test`. La
// collecte vit dans `gpu.ts` (server-only) ; le TYPE est lu côté client par le module Logement.
//
// ── CE QU'ELLE ÉTABLIT, ET À QUEL TITRE ───────────────────────────────────────────────────────
//  A. Fait publié : le document d'urbanisme applicable (PLU, PLUi, PSMV, carte communale), la ou les
//     zones qui couvrent la parcelle, les prescriptions cartographiées sur elle, le règlement à lire.
//     Tous viennent du Géoportail de l'urbanisme (GPU), dans la nomenclature nationale du CNIG.
//  B. Observation : comment la parcelle a été rattachée à l'adresse (au point, par proximité, sur une
//     limite). Un rattachement incertain rend TOUTE la lecture conditionnelle.
//  C. Calcul dérivé : l'AIRE EXACTE de la parcelle couverte par chaque zone ou prescription
//     (`geometrie-parcelle.ts`). Elle sépare une zone qui couvre la parcelle d'une zone voisine qui en
//     touche la limite (écart de tracé entre le plan et le cadastre : 12 parcelles sur 25 mesurées le
//     26/10/2026). Elle n'est jamais une surface constructible.
//
// ── CE QU'ELLE NE FAIT PAS, ET C'EST DÉLIBÉRÉ ─────────────────────────────────────────────────
//  - Aucune conclusion de constructibilité ni d'autorisation : un zonage ne dit pas ce qui est permis,
//    le règlement écrit, les prescriptions et l'instruction de la mairie le disent.
//  - Une absence de donnée n'est JAMAIS une absence de règle : une commune sans document publié reste
//    soumise à des règles (RNU, ou un document non versé au GPU).
//  - Aucun effet juridique déduit du seul code principal d'une prescription : le sous-code et le type de
//    document décident (revue du 27/10/2026, un « immeuble non protégé » de PSMV était lu « protégé »).
//  - Une prescription qu'on ne sait pas situer n'est jamais supprimée en silence : elle est dite incertaine.

import {
  aireIntersection, aireRegion, classer, lignesDe, longueurDans, pointsDe, projectionPour, regionDe, regionMesurable,
  type Geometrie, type Region,
} from "./geometrie-parcelle.ts";

import {
  AUTRE_PRESCRIPTION, CATEGORIES, CC_SEULEMENT, CODES_NOMMES, LONGUEUR_MIN_M, PART_MIN, PSMV_SEULEMENT, SURFACE_CONTACT_M2,
  SURFACE_MIN_M2,
} from "./urbanisme-nomenclature.ts";

export {
  AUTRE_PRESCRIPTION, CATEGORIES, LONGUEUR_MIN_M, NOTE_NEUTRE, PART_MIN, SURFACE_CONTACT_M2, SURFACE_MIN_M2,
  TYPE_DOCUMENT, TYPE_SECTEUR, TYPE_ZONE,
} from "./urbanisme-nomenclature.ts";
export type { Geometrie } from "./geometrie-parcelle.ts";

/**
 * Convention de lecture, portée par chaque lecture : un dossier dit sous quelles règles il a été lu.
 * `fut81-3` (deuxième revue, 27/10/2026) : aires calculées par Clipper et vérifiées contre GEOS, mesure
 * non garantie rendue « incertaine », projection à l'échelle de l'ellipsoïde (les m² montent de 0,7 %).
 * Les seuils sont ceux de `fut81-2`.
 */
export const URBANISME_CONVENTION = "fut81-3";

export const GPU_SITE = "https://www.geoportail-urbanisme.gouv.fr";

// ── Types publiés (contrat du rapport) ───────────────────────────────────────────────────────

/** Le statut de la lecture. `non_trouve` n'est jamais « aucune règle » ; `indisponible` jamais « aucune ». */
export type StatutUrbanisme = "confirme" | "ambigu" | "non_trouve" | "indisponible";

/** Le régime de la commune. `rnu` : règlement national d'urbanisme, sans document local. */
export type RegimeUrbanisme = "document" | "rnu" | "inconnu";

export type Ambiguite =
  | "plusieurs_documents"
  | "document_hors_vigueur"
  | "vigueur_non_verifiee"
  | "zone_non_lue"
  | "parcelle_incertaine"
  | "geometrie_non_mesurable";

/**
 * COMMENT LA PARCELLE A ÉTÉ RATTACHÉE À L'ADRESSE. `point` : le point de l'adresse tombe dans une seule
 * parcelle. `limite` : il est sur la limite de plusieurs. `repli` : il ne tombait dans aucune, la plus
 * proche a été retenue (`distanceM`). `aucun` : pas de parcelle lue, la lecture est au point.
 */
export type Rattachement = { mode: "point" | "limite" | "repli" | "aucun"; distanceM: number | null };

export type TypeZone = "U" | "AUc" | "AUs" | "A" | "N";

export type Reglement =
  | { statut: "publie"; url: string; source: "gpu" | "producteur" }
  | { statut: "non_publie" | "indisponible" };

/**
 * LA VIGUEUR D'UN DOCUMENT, EN TROIS ÉTATS. `etablie` : le GPU le dit approuvé ET en vigueur.
 * `hors_vigueur` : il dit explicitement le contraire (annulé, historique, plan d'occupation des sols).
 * `non_verifiee` : le détail n'a pas répondu, ou il manque l'un des deux statuts, ou le document est
 * partiellement annulé. Jamais lu comme un statut négatif, jamais comme une confirmation.
 */
export type Vigueur = "etablie" | "hors_vigueur" | "non_verifiee";

export type DocumentUrbanisme = {
  id: string;
  type: string; // PLU, PLUi, PSMV, CC, POS…, tel que le GPU le nomme
  titre: string | null;
  producteur: string | null;
  vigueur: Vigueur;
  /** `legalStatus` du GPU, tel quel (APPROVED, PARTIALLY_ANNULLED, ANNULLED, HISTORICAL), ou `null`. */
  statutJuridique: string | null;
  /** Le détail officiel a-t-il répondu ? Les pièces (dont le règlement) ont-elles été lues ? */
  detailLu: boolean;
  piecesLues: boolean;
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
  /** Part de la parcelle (0 à 1) et aire (m²), calcul dérivé. `null` : lecture au point. */
  part: number | null;
  surfaceM2: number | null;
  documentId: string;
  reglement: Reglement;
};

/**
 * Une zone qui touche la limite de la parcelle sans la couvrir. `surfaceM2` 0 : simple contact. À partir
 * de `SURFACE_MIN_M2`, c'est un liseré que l'écran DIT, comme une bordure à vérifier sur le plan.
 */
export type ZoneEnLimite = { libelle: string; surfaceM2: number };

export type SecteurCarteCommunale = {
  libelle: string;
  typesect: "01" | "02" | "03" | "99" | null;
  part: number | null;
  documentId: string;
};

/**
 * UNE PRESCRIPTION NOMMÉE. `categorie` est la clé de `CATEGORIES` (« 05-01 », « 07-67 »…) ou « neutre »
 * quand le sous-code n'est pas reconnu pour ce type de document : son effet n'est alors pas énoncé.
 * `etendue` : `couvre` (au-delà des seuils), `marginale` (recoupe très faiblement), `incertaine` (la
 * géométrie publiée n'a pas pu être lue : position non vérifiable).
 */
export type PrescriptionParcelle = {
  categorie: string;
  code: string;
  sousCode: string;
  /** Libellé du producteur, tel que publié. */
  libelle: string;
  forme: "surface" | "ligne" | "point";
  etendue: "couvre" | "marginale" | "incertaine";
  part: number | null;
  surfaceM2: number | null;
  longueurM: number | null;
  documentId: string;
  documentType: string;
};

export type UrbanismeParcelle = {
  convention: typeof URBANISME_CONVENTION;
  statut: StatutUrbanisme;
  regime: RegimeUrbanisme;
  /** Ce que le GPU déclare de la commune : au RNU, hors RNU, ou `null` s'il n'a pas répondu. */
  communeRnu: boolean | null;
  grain: "parcelle" | "point";
  rattachement: Rattachement;
  documents: DocumentUrbanisme[];
  zones: ZoneParcelle[];
  zonesEnLimite: ZoneEnLimite[];
  /** Zones rendues par le GPU dont la géométrie n'a pas pu être lue : ni retenues, ni écartées. */
  zonesNonMesurables: string[];
  secteurs: SecteurCarteCommunale[];
  prescriptions: PrescriptionParcelle[];
  /** Prescriptions qui ne font que toucher la limite (aucun recouvrement) : elles peuvent être du voisin. */
  prescriptionsContact: number;
  /** Familles des AUTRES prescriptions de la parcelle, à lire dans le règlement (stationnement, hauteur…). */
  autresPrescriptions: string[];
  prescriptionsStatut: "ok" | "indisponible";
  ambiguites: Ambiguite[];
};

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

/**
 * LA CATÉGORIE D'UNE PRESCRIPTION, PAR SOUS-CODE ET TYPE DE DOCUMENT. `null` : une famille générale,
 * citée et renvoyée au règlement. « neutre » : un code qui compte, mais un sous-code inconnu ou étranger
 * à ce type de document, dont l'effet n'est pas énoncé.
 */
export function categorieDe(code: string, sousCode: string, typeDocument: string): string | null {
  const cle = `${code}-${sousCode}`;
  if (PSMV_SEULEMENT.has(cle) && typeDocument !== "PSMV") return "neutre";
  if (CC_SEULEMENT.has(cle) && typeDocument !== "CC") return "neutre";
  if (CATEGORIES[cle]) return cle;
  return CODES_NOMMES.has(code) ? "neutre" : null;
}

/** Une prescription couvre-t-elle la parcelle ? Au point (`part` nul), elle contient le point lu. */
export function couvre(part: number | null, surfaceM2: number | null): boolean {
  if (part == null) return true;
  return part >= PART_MIN || (surfaceM2 != null && surfaceM2 >= SURFACE_MIN_M2);
}

/** Une zone couvre-t-elle la parcelle ? Au-delà de 2 % seulement (cf. les deux conventions). */
export function couvreZone(part: number | null): boolean {
  return part == null || part >= PART_MIN;
}

// ── Entrée brute (réponses GPU) ──────────────────────────────────────────────────────────────

type Props = Record<string, unknown>;
export type GpuFeature = { properties?: Props | null; geometry?: Geometrie };

/** Ce que la collecte a rapporté. `null` = l'appel n'a pas abouti (panne, délai), jamais « rien ». */
export type EntreeUrbanisme = {
  /** Le point de l'adresse [longitude, latitude]. */
  point: [number, number];
  parcelle: {
    geometry: Geometrie;
    contenance: number | null;
    rattachement: "point" | "repli";
    /** Parcelles qui contiennent le point : plus d'une, il est sur une limite. */
    candidatsAuPoint?: number;
    /** Distance du point à la parcelle retenue par repli. */
    distanceM?: number | null;
  } | null;
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
/** Arrondi au pas, sans bruit binaire (`0.1 * 37251` vaut 3725.1000000000004) : l'empreinte doit être stable. */
const arrondi = (v: number, pas: number) => { const k = Math.round(1 / pas); return Math.round(v * k) / k; };

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

/** La vigueur d'un document, en trois états (cf. `Vigueur`). */
export function vigueurDe(type: string, details: Props | null | undefined): { vigueur: Vigueur; statutJuridique: string | null; detailLu: boolean } {
  const lu = !!details && typeof details === "object";
  const juridique = lu ? str(details.legalStatus) : null;
  const effectif = lu ? str(details.effectiveStatus) : null;
  const detailLu = juridique != null || effectif != null;
  if (type === "POS" || juridique === "ANNULLED" || juridique === "HISTORICAL" || (effectif != null && effectif !== "EN_VIGUEUR")) {
    return { vigueur: "hors_vigueur", statutJuridique: juridique, detailLu };
  }
  if (juridique === "APPROVED" && effectif === "EN_VIGUEUR") return { vigueur: "etablie", statutJuridique: juridique, detailLu };
  return { vigueur: "non_verifiee", statutJuridique: juridique, detailLu };
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
export function urbanismeIndisponible(rattachement: Rattachement = { mode: "aucun", distanceM: null }): UrbanismeParcelle {
  return {
    convention: URBANISME_CONVENTION, statut: "indisponible", regime: "inconnu", communeRnu: null, grain: "point",
    rattachement, documents: [], zones: [], zonesEnLimite: [], zonesNonMesurables: [], secteurs: [], prescriptions: [],
    prescriptionsContact: 0, autresPrescriptions: [], prescriptionsStatut: "indisponible", ambiguites: [],
  };
}

/** Le rattachement de la parcelle, tel que la collecte l'a établi. */
function rattachementDe(e: EntreeUrbanisme, parcelleLisible: boolean): Rattachement {
  const p = e.parcelle;
  if (!p || !parcelleLisible) return { mode: "aucun", distanceM: null };
  if (p.rattachement === "repli") return { mode: "repli", distanceM: p.distanceM != null ? arrondi(p.distanceM, 0.1) : null };
  if ((p.candidatsAuPoint ?? 1) > 1) return { mode: "limite", distanceM: null };
  return { mode: "point", distanceM: null };
}

// ── La lecture ───────────────────────────────────────────────────────────────────────────────

/** Ce qu'une surface publiée fait à la parcelle : couvre, recoupe à peine, la touche, ou n'est pas lisible. */
type Mesure = { lieu: "couvre" | "marginale" | "contact" | "incertaine"; part: number | null; surfaceM2: number | null };

export function lireUrbanisme(e: EntreeUrbanisme): UrbanismeParcelle {
  // La parcelle n'est mesurable que si sa géométrie se lit ENTIÈREMENT et forme un polygone valide :
  // sinon, lecture au point.
  const proj = projectionPour(e.parcelle?.geometry, e.point);
  const regionParcelle: Region | null = e.parcelle ? regionDe(e.parcelle.geometry, proj) : null;
  const aireParcelle = regionParcelle ? aireRegion(regionParcelle) : 0;
  const grain = regionParcelle && aireParcelle > 0 && regionMesurable(regionParcelle) ? "parcelle" : "point";
  const rattachement = rattachementDe(e, grain === "parcelle");

  // Sans la liste des documents, ou sans aucune des deux couches de zonage, rien n'est établi.
  if (e.documents == null || (e.zones == null && e.secteurs == null)) return urbanismeIndisponible(rattachement);

  const rnu = e.municipality?.find((m) => typeof m.properties?.is_rnu === "boolean")?.properties?.is_rnu as boolean | undefined;

  const mesurer = (g: Geometrie, regle: (part: number, surfaceM2: number) => boolean = couvre): Mesure => {
    if (grain === "point") return { lieu: "couvre", part: null, surfaceM2: null };
    const r = regionDe(g, proj);
    if (!r) return { lieu: "incertaine", part: null, surfaceM2: null };
    // Une aire que le calcul ne peut pas garantir n'alimente jamais une attribution (cf. `aireIntersection`).
    const aire = aireIntersection(regionParcelle!, r);
    if (aire == null) return { lieu: "incertaine", part: null, surfaceM2: null };
    const part = Math.min(1, arrondi(aire / aireParcelle, 0.001));
    const surfaceM2 = arrondi(aire, 0.1);
    if (aire < SURFACE_CONTACT_M2) return { lieu: "contact", part: 0, surfaceM2: 0 };
    return { lieu: regle(part, surfaceM2) ? "couvre" : "marginale", part, surfaceM2 };
  };

  // 1. Les documents (un même document peut revenir plusieurs fois : dédoublonné par identifiant).
  const documents: DocumentUrbanisme[] = [];
  for (const d of e.documents) {
    const p = d.properties ?? {};
    const id = str(p.gpu_doc_id) ?? str(p.id);
    if (!id || !ID_DOC.test(id) || documents.some((x) => x.id === id)) continue;
    const det = e.details[id] ?? null;
    const type = str(p.du_type) ?? str(det?.type) ?? "document";
    documents.push({
      id, type,
      titre: str(det?.title) ?? str(p.grid_title),
      producteur: str(det?.producer),
      ...vigueurDe(type, det),
      piecesLues: Array.isArray(e.fichiers[id]),
      approbation: approbationDepuisNom(str(p.name) ?? str(det?.originalName)),
      publication: dateFr(str(det?.publicationDate)) ?? dateCompacte(str(p.gpu_timestamp)?.slice(0, 10).replace(/-/g, "") ?? null),
      url: `${GPU_SITE}/document/by-id/${id}`,
    });
  }
  const connus = new Map(documents.map((d) => [d.id, d]));
  const docDe = (p: Props | null | undefined) => str(p?.gpu_doc_id) ?? "";

  if (documents.length === 0) {
    // Aucun document publié : le RNU s'il est déclaré, sinon une règle qu'on n'a pas pu identifier.
    return {
      ...urbanismeIndisponible(rattachement),
      statut: rnu === true ? "confirme" : "non_trouve",
      regime: rnu === true ? "rnu" : "inconnu",
      communeRnu: rnu ?? null,
      grain,
      prescriptionsStatut: e.prescriptions.surface == null ? "indisponible" : "ok",
    };
  }

  // 2. Les zones et secteurs, mesurés sur la parcelle.
  const zones: ZoneParcelle[] = [];
  const enLimite = new Map<string, number>();
  const nonMesurables: string[] = [];
  for (const z of e.zones ?? []) {
    const p = z.properties ?? {};
    const documentId = docDe(p);
    if (!connus.has(documentId)) continue;
    const libelle = str(p.libelle) ?? "zone sans libellé";
    const m = mesurer(z.geometry, couvreZone);
    if (m.lieu === "incertaine") { if (!nonMesurables.includes(libelle)) nonMesurables.push(libelle); continue; }
    if (m.lieu === "contact" || m.lieu === "marginale") {
      enLimite.set(libelle, Math.max(enLimite.get(libelle) ?? 0, m.surfaceM2 ?? 0));
      continue;
    }
    // Une zone découpée en plusieurs polygones se lit une fois, ses aires additionnées.
    const deja = zones.find((x) => x.libelle === libelle && x.documentId === documentId);
    if (deja) {
      if (deja.part != null && m.part != null) {
        deja.part = Math.min(1, arrondi(deja.part + m.part, 0.001));
        deja.surfaceM2 = arrondi((deja.surfaceM2 ?? 0) + (m.surfaceM2 ?? 0), 0.1);
      }
      continue;
    }
    zones.push({
      libelle, libelong: str(p.libelong), typezone: typeZone(p.typezone), part: m.part, surfaceM2: m.surfaceM2, documentId,
      reglement: reglementDeZone(documentId, e.fichiers[documentId] ?? null, str(p.nomfic), urlSure(p.urlfic)),
    });
  }
  zones.sort((a, b) => (b.part ?? 0) - (a.part ?? 0));

  const secteurs: SecteurCarteCommunale[] = [];
  for (const s of e.secteurs ?? []) {
    const p = s.properties ?? {};
    const documentId = docDe(p);
    if (!connus.has(documentId)) continue;
    const libelle = str(p.libelle) ?? "secteur";
    const m = mesurer(s.geometry, couvreZone);
    if (m.lieu === "incertaine") { if (!nonMesurables.includes(libelle)) nonMesurables.push(libelle); continue; }
    if (m.lieu !== "couvre") { enLimite.set(libelle, Math.max(enLimite.get(libelle) ?? 0, m.surfaceM2 ?? 0)); continue; }
    if (secteurs.some((x) => x.libelle === libelle)) continue;
    secteurs.push({ libelle, typesect: typeSecteur(p.typesect), part: m.part, documentId });
  }
  secteurs.sort((a, b) => (b.part ?? 0) - (a.part ?? 0));
  const zonesEnLimite = [...enLimite]
    .filter(([l]) => !zones.some((z) => z.libelle === l) && !secteurs.some((x) => x.libelle === l))
    .map(([libelle, surfaceM2]) => ({ libelle, surfaceM2 }));

  // 3. Les prescriptions qui concernent la parcelle elle-même (jamais celles de la parcelle voisine).
  const pres = e.prescriptions;
  const prescriptionsStatut = pres.surface == null || pres.ligne == null || pres.point == null ? "indisponible" : "ok";
  const prescriptions: PrescriptionParcelle[] = [];
  const autres = new Set<string>();
  let prescriptionsContact = 0;
  const lire = (f: GpuFeature, forme: PrescriptionParcelle["forme"]) => {
    const p = f.properties ?? {};
    const documentId = docDe(p);
    const doc = connus.get(documentId);
    if (!doc) return;
    let lieu: Mesure["lieu"];
    let part: number | null = null;
    let surfaceM2: number | null = null;
    let longueurM: number | null = null;
    if (grain === "point") lieu = "couvre";
    else if (forme === "surface") ({ lieu, part, surfaceM2 } = mesurer(f.geometry));
    else if (forme === "ligne") {
      const l = lignesDe(f.geometry, proj);
      if (!l) lieu = "incertaine";
      else {
        const { dedans } = longueurDans(l, regionParcelle!);
        longueurM = arrondi(dedans, 0.1);
        lieu = dedans >= LONGUEUR_MIN_M ? "couvre" : dedans > 0.01 ? "marginale" : "contact";
      }
    } else {
      const pts = pointsDe(f.geometry, proj);
      if (!pts) lieu = "incertaine";
      else lieu = pts.some((q) => classer(q, regionParcelle!).lieu === "dedans") ? "couvre" : "contact";
    }
    if (lieu === "contact") { prescriptionsContact++; return; }
    const code = str(p.typepsc) ?? "";
    const sousCode = str(p.stypepsc) ?? "00";
    const categorie = categorieDe(code, sousCode, doc.type);
    if (!categorie) {
      // Une famille générale (stationnement, hauteur…) n'est citée que si elle s'applique vraiment.
      if (lieu === "couvre" || lieu === "incertaine") autres.add(AUTRES[code] ?? AUTRE_PRESCRIPTION);
      return;
    }
    const libelle = str(p.libelle) ?? CATEGORIES[categorie]?.titre ?? `Prescription ${code}-${sousCode}`;
    // Le même libellé publié plusieurs fois (polygones découpés) se lit une fois, à sa plus grande part.
    const deja = prescriptions.find((x) => x.categorie === categorie && x.libelle === libelle && x.forme === forme);
    const rang = (x: Mesure["lieu"]) => (x === "couvre" ? 2 : x === "marginale" ? 1 : 0);
    if (deja) {
      if (rang(lieu) > rang(deja.etendue) || (lieu === deja.etendue && (part ?? 0) > (deja.part ?? 0))) {
        Object.assign(deja, { etendue: lieu, part, surfaceM2, longueurM });
      }
      return;
    }
    prescriptions.push({
      categorie, code, sousCode, libelle, forme, etendue: lieu as PrescriptionParcelle["etendue"],
      part, surfaceM2, longueurM, documentId, documentType: doc.type,
    });
  };
  for (const f of pres.surface ?? []) lire(f, "surface");
  for (const f of pres.ligne ?? []) lire(f, "ligne");
  for (const f of pres.point ?? []) lire(f, "point");
  const ordre = { couvre: 0, marginale: 1, incertaine: 2 };
  prescriptions.sort((a, b) => ordre[a.etendue] - ordre[b.etendue]);

  // 4. Ce qui reste incertain, dit.
  const ambiguites: Ambiguite[] = [];
  if (rattachement.mode === "repli" || rattachement.mode === "limite") ambiguites.push("parcelle_incertaine");
  if (new Set([...zones.map((z) => z.documentId), ...secteurs.map((s) => s.documentId)]).size > 1) ambiguites.push("plusieurs_documents");
  if (documents.some((d) => d.vigueur === "hors_vigueur")) ambiguites.push("document_hors_vigueur");
  if (documents.some((d) => d.vigueur === "non_verifiee")) ambiguites.push("vigueur_non_verifiee");
  if (zones.length === 0 && secteurs.length === 0) ambiguites.push("zone_non_lue");
  if (nonMesurables.length > 0 || prescriptions.some((p) => p.etendue === "incertaine")) ambiguites.push("geometrie_non_mesurable");

  return {
    convention: URBANISME_CONVENTION,
    statut: ambiguites.length > 0 ? "ambigu" : "confirme",
    regime: "document",
    communeRnu: rnu ?? null,
    grain,
    rattachement,
    documents,
    zones,
    zonesEnLimite,
    zonesNonMesurables: nonMesurables,
    secteurs,
    prescriptions,
    prescriptionsContact,
    autresPrescriptions: [...autres].sort((a, b) => a.localeCompare(b, "fr")),
    prescriptionsStatut,
    ambiguites,
  };
}
