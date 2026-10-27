// LES SEUILS ET LES NOMENCLATURES DE LA LECTURE D'URBANISME (FUT-81), sans aucune dépendance.
//
// Séparés de `urbanisme-parcelle.ts` pour que l'écran (`UrbanismeBlock`, rendu côté client) puisse les lire
// sans embarquer le calcul géométrique (Clipper, 25 Ko compressés), qui ne s'exécute que côté serveur.
// `urbanisme-parcelle.ts` les réexporte : ses importeurs n'ont rien à changer.

import type { TypeZone } from "./urbanisme-parcelle.ts";

/**
 * DEUX CONVENTIONS DE LECTURE, JAMAIS DES EXEMPTIONS RÉGLEMENTAIRES.
 *
 * Une PRESCRIPTION couvre la parcelle au-delà de 2 % OU de 25 m². Une prescription ne pave pas le
 * territoire : une bande de 30 ou 50 m² est une vraie emprise (revue du 27/10/2026), comme l'emplacement
 * réservé de voirie de 71 m² de Mérignac. En deçà, elle reste affichée, « recoupant très faiblement » la
 * parcelle, à vérifier sur le plan ; seul un contact sans recouvrement (aire nulle) est écarté, et compté.
 *
 * Une ZONE couvre la parcelle au-delà de 2 % seulement. Les zones pavent tout le territoire : chaque
 * parcelle touche les zones voisines le long de ses limites, et l'écart de tracé entre le plan et le
 * cadastre y laisse des liserés (43 m² sur 5,5 ha à Sucy-en-Brie, 0,1 %). Un liseré de 25 m² ou plus est
 * DIT à l'écran comme une bordure à vérifier, sans être présenté comme une zone de la parcelle. La plus
 * petite part réelle relevée est de 2,3 % (1 265 m² à Sucy-en-Brie).
 */
export const PART_MIN = 0.02;
export const SURFACE_MIN_M2 = 25;
/** En deçà, l'intersection n'est qu'un contact de limites (bruit numérique du tracé), pas un recouvrement. */
export const SURFACE_CONTACT_M2 = 0.05;
/** Une ligne qui court moins que cela à l'intérieur de la parcelle la recoupe à peine. */
export const LONGUEUR_MIN_M = 0.5;


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
export const PSMV_SEULEMENT = new Set(["03-50", "03-51", ...Array.from({ length: 20 }, (_, i) => `07-${50 + i}`)]);
export const CC_SEULEMENT = new Set(["03-01"]);
/** Codes dont tout sous-code compte pour l'acheteur : un sous-code inconnu y est nommé, mais sans effet énoncé. */
export const CODES_NOMMES = new Set(["01", "02", "03", "05", "07", "08", "31"]);

/** Le code 99 du CNIG : une prescription que le producteur n'a pas classée. */
export const AUTRE_PRESCRIPTION = "autre prescription";
