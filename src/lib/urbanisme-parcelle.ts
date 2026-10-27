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
  aireIntersection, aireRegion, classer, lignesDe, longueurDans, pointsDe, projectionPour, regionDe,
  type Geometrie, type Region,
} from "./geometrie-parcelle.ts";

export type { Geometrie } from "./geometrie-parcelle.ts";

/** Convention de lecture, portée par chaque lecture : un dossier dit sous quelles règles il a été lu. */
export const URBANISME_CONVENTION = "fut81-2";

/**
 * DEUX CONVENTIONS DE LECTURE, JAMAIS DES EXEMPTIONS RÉGLEMENTAIRES.
 *
 * Une PRESCRIPTION couvre la parcelle au-delà de 2 % OU de 25 m². Une prescription ne pave pas le
 * territoire : une bande de 30 ou 50 m² est une vraie emprise (revue du 27/10/2026), comme l'emplacement
 * réservé de voirie de 70 m² de Mérignac. En deçà, elle reste affichée, « recoupant très faiblement » la
 * parcelle, à vérifier sur le plan ; seul un contact sans recouvrement (aire nulle) est écarté, et compté.
 *
 * Une ZONE couvre la parcelle au-delà de 2 % seulement. Les zones pavent tout le territoire : chaque
 * parcelle touche les zones voisines le long de ses limites, et l'écart de tracé entre le plan et le
 * cadastre y laisse des liserés (39 m² sur 5,5 ha à Sucy-en-Brie, 0,1 %). Un liseré de 25 m² ou plus est
 * DIT à l'écran comme une bordure à vérifier, sans être présenté comme une zone de la parcelle. La plus
 * petite part réelle relevée est de 2,3 % (1 265 m² à Sucy-en-Brie).
 */
export const PART_MIN = 0.02;
export const SURFACE_MIN_M2 = 25;
/** En deçà, l'intersection n'est qu'un contact de limites (bruit numérique du tracé), pas un recouvrement. */
export const SURFACE_CONTACT_M2 = 0.05;
/** Une ligne qui court moins que cela à l'intérieur de la parcelle la recoupe à peine. */
export const LONGUEUR_MIN_M = 0.5;

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

// ── Nomenclatures nationales (standards CNIG PLU v2024 rév. 2025-06, PSMV v2022 rév. 2025-12, CC) ──

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

/** L'effet d'une prescription dont le sous-code n'est pas reconnu : on ne l'énonce pas. */
export const NOTE_NEUTRE = "Le Géoportail la classe sans que son effet précis soit établi ici : il se lit dans le règlement, et le service urbanisme le confirme.";

const EBC = "Le classement protège le boisement : il interdit son défrichement et tout aménagement qui compromettrait sa conservation. À vérifier avant d'envisager une construction ou un abattage sur cette partie du terrain.";
const PROTECTION_PLU = "Le plan protège ici un élément bâti, paysager ou écologique. Les travaux qui le modifient ou le suppriment demandent une autorisation préalable, et une démolition peut être refusée.";
const PROTECTION_PSMV = "Le plan de sauvegarde protège cet élément, à conserver, restaurer et mettre en valeur. Les travaux qui le concernent demandent une autorisation, avec l'accord de l'architecte des Bâtiments de France.";
const NON_PROTEGE_PSMV = "Le plan de sauvegarde identifie cet élément sans le protéger. Des dispositions particulières de son règlement peuvent s'y appliquer : à lire avant tout projet.";
const ER = (destination: string) => `Le plan réserve cette partie du terrain ${destination}. Demandez en mairie le projet et son bénéficiaire : elle ne peut pas accueillir une construction contraire à cette destination.`;
const LITTORAL = "La loi Littoral protège cet espace naturel : seuls des aménagements légers y sont admis.";

/**
 * LES CATÉGORIES NOMMÉES, PAR SOUS-CODE. Chaque titre reprend le libellé national ; chaque note dit
 * l'effet que lui donne le code de l'urbanisme, ou s'en tient au libellé quand cet effet dépend du
 * règlement local. Aucune ne conclut sur le projet du lecteur.
 */
export const CATEGORIES: Record<string, { titre: string; note: string }> = {
  "01-00": { titre: "Espace boisé classé", note: EBC },
  "01-01": { titre: "Espace boisé classé", note: EBC },
  "01-02": { titre: "Espace boisé classé à créer", note: EBC },
  "01-03": { titre: "Espace boisé classé significatif (loi Littoral)", note: EBC },
  "02-00": { titre: "Constructibilité limitée pour une raison de risque, d'environnement ou d'intérêt général", note: "Le plan interdit ou conditionne ici les constructions. Le motif et les conditions se lisent dans le règlement." },
  "02-01": { titre: "Constructibilité interdite pour une raison de risque, d'environnement ou d'intérêt général", note: "Le plan interdit ici les constructions, pour un motif que précise le règlement, qui peut aussi prévoir des exceptions." },
  "02-02": { titre: "Constructibilité sous conditions spéciales (risque, environnement ou intérêt général)", note: "Le plan soumet ici les constructions à des conditions spéciales, que précise le règlement." },
  "03-00": { titre: "Règles particulières de démolition ou de reconstruction", note: "Le plan encadre ici la démolition ou la reconstruction des bâtiments. À lire dans le règlement avant tout projet." },
  "03-01": { titre: "Reconstruction à l'identique non autorisée après un sinistre", note: "La carte communale n'autorise pas ici la reconstruction à l'identique d'un bâtiment détruit par un sinistre." },
  "03-02": { titre: "Restauration interdite d'un bâtiment dont il reste l'essentiel des murs porteurs", note: "Le plan interdit ici de restaurer un bâtiment dont il ne reste que l'essentiel des murs porteurs." },
  "03-03": { titre: "Reconstruction à l'identique interdite", note: "Le plan interdit ici la reconstruction à l'identique d'un bâtiment détruit ou démoli." },
  "03-50": { titre: "Immeuble dont la modification peut être imposée lors d'une opération d'aménagement", note: "Le plan de sauvegarde prévoit que la modification de cet immeuble, ou d'une partie, peut être imposée à l'occasion d'opérations d'aménagement. À vérifier auprès du service urbanisme avant d'acheter." },
  "03-51": { titre: "Immeuble dont la démolition peut être imposée lors d'une opération d'aménagement", note: "Le plan de sauvegarde prévoit que la démolition de cet immeuble, ou d'une partie, peut être imposée à l'occasion d'opérations d'aménagement. À vérifier auprès du service urbanisme avant d'acheter." },
  "05-00": { titre: "Emplacement réservé", note: "Une partie du terrain fait l'objet d'un emplacement réservé dont le Géoportail ne précise pas la destination. Demandez en mairie son objet et son bénéficiaire avant tout projet." },
  "05-01": { titre: "Emplacement réservé à une voie publique", note: ER("à une voie publique (création ou élargissement)") },
  "05-02": { titre: "Emplacement réservé à un ouvrage public", note: ER("à un ouvrage public") },
  "05-03": { titre: "Emplacement réservé à une installation d'intérêt général", note: ER("à une installation d'intérêt général") },
  "05-04": { titre: "Emplacement réservé à un espace vert ou une continuité écologique", note: ER("à un espace vert ou à une continuité écologique") },
  "05-05": { titre: "Emplacement réservé à un programme de logements (mixité sociale)", note: "Le plan réserve ce terrain à la réalisation d'un programme de logements qu'il définit, au titre de la mixité sociale. Demandez en mairie ce que la réserve impose avant tout projet." },
  "05-06": { titre: "Servitude de localisation d'une voie, d'un ouvrage ou d'un espace vert", note: "Le plan localise ici un futur aménagement public sans en fixer l'emprise exacte. Son tracé et ses effets sur le terrain se demandent en mairie." },
  "05-07": { titre: "Secteur en attente d'un projet d'aménagement global", note: "Le plan attend ici un projet d'aménagement d'ensemble ; les constructions peuvent y être limitées pour une durée déterminée. Le seuil et la durée se lisent dans le règlement, à vérifier en mairie." },
  "05-08": { titre: "Emplacement réservé à la relocalisation face au recul du trait de côte", note: "Le plan réserve cet emplacement à la relocalisation d'équipements ou de constructions exposés au recul du trait de côte. Demandez en mairie son objet." },
  "07-00": { titre: "Élément de patrimoine ou de paysage protégé", note: PROTECTION_PLU },
  "07-01": { titre: "Patrimoine bâti protégé", note: PROTECTION_PLU },
  "07-02": { titre: "Patrimoine paysager protégé", note: PROTECTION_PLU },
  "07-03": { titre: "Espace boisé protégé au titre du patrimoine paysager", note: PROTECTION_PLU },
  "07-04": { titre: "Élément de paysage préservé pour un motif écologique", note: PROTECTION_PLU },
  "07-05": { titre: "Espace boisé préservé pour un motif écologique", note: PROTECTION_PLU },
  "07-50": { titre: "Immeuble protégé en totalité, intérieurs et extérieurs", note: PROTECTION_PSMV },
  "07-51": { titre: "Élément intérieur particulier protégé", note: PROTECTION_PSMV },
  "07-52": { titre: "Immeuble dont les parties extérieures sont protégées", note: PROTECTION_PSMV },
  "07-53": { titre: "Mur, rempart ou clôture protégé", note: PROTECTION_PSMV },
  "07-54": { titre: "Élément extérieur particulier protégé", note: PROTECTION_PSMV },
  "07-55": { titre: "Ordonnance architecturale ou urbaine protégée", note: PROTECTION_PSMV },
  "07-56": { titre: "Séquence naturelle protégée", note: PROTECTION_PSMV },
  "07-57": { titre: "Parc ou jardin de pleine terre protégé", note: PROTECTION_PSMV },
  "07-58": { titre: "Espace libre à dominante végétale protégé", note: PROTECTION_PSMV },
  "07-59": { titre: "Composition végétale d'ensemble protégée", note: PROTECTION_PSMV },
  "07-60": { titre: "Arbre remarquable ou élément naturel protégé", note: PROTECTION_PSMV },
  "07-61": { titre: "Place, cour ou espace libre minéral protégé", note: PROTECTION_PSMV },
  "07-62": { titre: "Cours d'eau ou étendue aquatique protégé", note: PROTECTION_PSMV },
  "07-63": { titre: "Point d'eau ou source protégé", note: PROTECTION_PSMV },
  "07-64": { titre: "Passage d'eau souterrain protégé", note: PROTECTION_PSMV },
  "07-65": { titre: "Espace vert non protégé, à requalifier", note: NON_PROTEGE_PSMV },
  "07-66": { titre: "Espace libre minéral non protégé, à requalifier", note: NON_PROTEGE_PSMV },
  "07-67": { titre: "Immeuble bâti non protégé, soumis à des dispositions particulières", note: NON_PROTEGE_PSMV },
  "07-68": { titre: "Immeuble non bâti ou espace libre non protégé, soumis à des dispositions particulières", note: NON_PROTEGE_PSMV },
  "07-69": { titre: "Secteur soumis à des dispositions particulières du plan de sauvegarde", note: NON_PROTEGE_PSMV },
  "08-00": { titre: "Terrain non bâti protégé en zone urbaine", note: "Le plan déclare cette partie du terrain inconstructible, pour préserver un espace cultivé ou une continuité écologique." },
  "16-01": { titre: "Bâtiment pouvant changer de destination", note: "Le plan désigne ce bâtiment comme pouvant changer de destination, par exemple devenir un logement. Le changement reste soumis à autorisation, et à l'avis d'une commission départementale en zone agricole ou naturelle." },
  "16-02": { titre: "Habitation existante pouvant recevoir une extension ou des annexes", note: "En zone agricole ou naturelle, le plan admet ici l'extension ou les annexes d'une habitation existante, dans les limites de surface, de hauteur et de distance que fixe le règlement." },
  "16-03": { titre: "Secteur de taille et de capacité d'accueil limitées", note: "Le plan admet ici, à titre exceptionnel, des constructions limitées en zone agricole ou naturelle. Les conditions se lisent dans le règlement." },
  "24-01": { titre: "Voie à créer, modifier ou conserver", note: "Le plan prévoit ici une voie à créer, à modifier ou à conserver. Demandez en mairie le tracé exact : il peut emprunter une partie du terrain." },
  "24-02": { titre: "Voie à modifier", note: "Le plan prévoit ici la modification d'une voie. Demandez en mairie le tracé exact : il peut emprunter une partie du terrain." },
  "24-03": { titre: "Voie à créer", note: "Le plan prévoit ici la création d'une voie. Demandez en mairie le tracé exact : il peut emprunter une partie du terrain." },
  ...Object.fromEntries(["00", "01", "02", "03", "04", "05", "06", "07", "08"].map((s) => [`31-${s}`, { titre: "Espace remarquable du littoral", note: LITTORAL }])),
};

/** Sous-codes propres au plan de sauvegarde (PSMV), et à la carte communale : hors de ces documents, ils ne valent rien. */
const PSMV_SEULEMENT = new Set(["03-50", "03-51", ...Array.from({ length: 20 }, (_, i) => `07-${50 + i}`)]);
const CC_SEULEMENT = new Set(["03-01"]);
/** Codes dont tout sous-code compte pour l'acheteur : un sous-code inconnu y est nommé, mais sans effet énoncé. */
const CODES_NOMMES = new Set(["01", "02", "03", "05", "07", "08", "31"]);

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
  // La parcelle n'est mesurable que si sa géométrie se lit ENTIÈREMENT : sinon, lecture au point.
  const proj = projectionPour(e.parcelle?.geometry, e.point);
  const regionParcelle: Region | null = e.parcelle ? regionDe(e.parcelle.geometry, proj) : null;
  const aireParcelle = regionParcelle ? aireRegion(regionParcelle) : 0;
  const grain = regionParcelle && aireParcelle > 0 ? "parcelle" : "point";
  const rattachement = rattachementDe(e, grain === "parcelle");

  // Sans la liste des documents, ou sans aucune des deux couches de zonage, rien n'est établi.
  if (e.documents == null || (e.zones == null && e.secteurs == null)) return urbanismeIndisponible(rattachement);

  const rnu = e.municipality?.find((m) => typeof m.properties?.is_rnu === "boolean")?.properties?.is_rnu as boolean | undefined;

  const mesurer = (g: Geometrie, regle: (part: number, surfaceM2: number) => boolean = couvre): Mesure => {
    if (grain === "point") return { lieu: "couvre", part: null, surfaceM2: null };
    const r = regionDe(g, proj);
    if (!r) return { lieu: "incertaine", part: null, surfaceM2: null };
    const aire = aireIntersection(regionParcelle!, r);
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
