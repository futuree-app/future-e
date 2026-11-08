// LES MOTS DU LECTEUR POUR LE PLAN D'URBANISME (FUT-144). Présentation seulement : aucune règle, aucun seuil.
//
// Le bloc « Plan d'urbanisme de la parcelle » se lit en trois niveaux : ce qu'il faut retenir, ce qu'il
// faut vérifier, puis les détails et les sources (dépliable). Les deux premiers niveaux parlent la langue
// du lecteur ; les intitulés nationaux du CNIG, les codes et les notes complètes de
// `urbanisme-nomenclature.ts` restent intacts et passent dans le dépliable.
//
// Chaque phrase ci-dessous résume la note de sa catégorie (`CATEGORIES[...].note`) sans rien y ajouter :
// aucun effet juridique n'est déduit au-delà de ce que la note énonce déjà. Toute catégorie de
// `CATEGORIES` a son entrée ici (contrôlé par le test FUT-144).

/** `court` : l'étiquette lue en premier ; `effet` : une phrase, ce que cela change et à qui le demander. */
export type LibelleSimple = { court: string; effet: string };

const EBC = "Le boisement est protégé : pas de défrichement possible.";
const PLU_PROTEGE = "Les travaux qui le modifient demandent une autorisation ; une démolition peut être refusée.";
const PSMV_PROTEGE = "Travaux soumis à autorisation, avec l’accord de l’architecte des Bâtiments de France.";
const PSMV_NON_PROTEGE = "Non protégé, mais des règles particulières du plan de sauvegarde peuvent s’y appliquer : à lire avant tout projet.";
const ER = "Cette partie ne peut pas accueillir une construction contraire à cette destination. Demandez en mairie le projet et qui le porte.";
const VOIE = "Demandez le tracé exact en mairie : il peut passer sur une partie du terrain.";

export const LIBELLES_SIMPLES: Record<string, LibelleSimple> = {
  "01-00": { court: "Espace boisé classé", effet: EBC },
  "01-01": { court: "Espace boisé classé", effet: EBC },
  "01-02": { court: "Espace boisé classé à créer", effet: EBC },
  "01-03": { court: "Espace boisé classé (loi Littoral)", effet: EBC },
  "02-00": { court: "Constructions limitées", effet: "Le plan les interdit ou les soumet à conditions ici ; le motif et les conditions sont dans le règlement." },
  "02-01": { court: "Constructions interdites", effet: "Le plan les interdit ici, pour un motif précisé dans le règlement, qui peut prévoir des exceptions." },
  "02-02": { court: "Constructions sous conditions", effet: "Le plan les soumet ici à des conditions spéciales, précisées dans le règlement." },
  "03-00": { court: "Démolition ou reconstruction encadrée", effet: "Des règles particulières s’appliquent : à lire dans le règlement avant tout projet." },
  "03-01": { court: "Pas de reconstruction à l’identique après un sinistre", effet: "La carte communale ne la permet pas ici." },
  "03-02": { court: "Restauration interdite", effet: "Pour un bâtiment dont il ne reste que l’essentiel des murs porteurs." },
  "03-03": { court: "Reconstruction à l’identique interdite", effet: "Pour un bâtiment détruit ou démoli." },
  "03-50": { court: "Modification qui peut être imposée", effet: "Lors d’une opération d’aménagement, la modification de l’immeuble peut être imposée : à vérifier en mairie avant d’acheter." },
  "03-51": { court: "Démolition qui peut être imposée", effet: "Lors d’une opération d’aménagement, la démolition de l’immeuble peut être imposée : à vérifier en mairie avant d’acheter." },
  "05-00": { court: "Emplacement réservé", effet: "Une partie du terrain est réservée à un projet public que le Géoportail ne précise pas : demandez lequel en mairie." },
  "05-01": { court: "Réservé pour une voie publique", effet: ER },
  "05-02": { court: "Réservé pour un ouvrage public", effet: ER },
  "05-03": { court: "Réservé pour une installation d’intérêt général", effet: ER },
  "05-04": { court: "Réservé pour un espace vert ou une continuité écologique", effet: ER },
  "05-05": { court: "Réservé à un programme de logements (mixité sociale)", effet: "Demandez en mairie ce que la réserve impose avant tout projet." },
  "05-06": { court: "Futur aménagement public localisé", effet: "Son emprise exacte n’est pas fixée : demandez son tracé en mairie." },
  "05-07": { court: "En attente d’un projet d’ensemble", effet: "Les constructions peuvent y être limitées pour un temps ; seuil et durée sont dans le règlement." },
  "05-08": { court: "Réservé face au recul du trait de côte", effet: "Pour y relocaliser des équipements ou des constructions menacés : demandez son objet en mairie." },
  "07-00": { court: "Patrimoine ou paysage protégé", effet: PLU_PROTEGE },
  "07-01": { court: "Bâti protégé", effet: PLU_PROTEGE },
  "07-02": { court: "Paysage protégé", effet: PLU_PROTEGE },
  "07-03": { court: "Boisement protégé pour le paysage", effet: PLU_PROTEGE },
  "07-04": { court: "Élément naturel préservé pour l’écologie", effet: PLU_PROTEGE },
  "07-05": { court: "Boisement préservé pour l’écologie", effet: PLU_PROTEGE },
  "07-50": { court: "Immeuble entièrement protégé", effet: PSMV_PROTEGE },
  "07-51": { court: "Élément intérieur protégé", effet: PSMV_PROTEGE },
  "07-52": { court: "Extérieurs de l’immeuble protégés", effet: PSMV_PROTEGE },
  "07-53": { court: "Mur, rempart ou clôture protégé", effet: PSMV_PROTEGE },
  "07-54": { court: "Élément extérieur protégé", effet: PSMV_PROTEGE },
  "07-55": { court: "Ordonnance architecturale protégée", effet: PSMV_PROTEGE },
  "07-56": { court: "Séquence naturelle protégée", effet: PSMV_PROTEGE },
  "07-57": { court: "Parc ou jardin protégé", effet: PSMV_PROTEGE },
  "07-58": { court: "Espace vert protégé", effet: PSMV_PROTEGE },
  "07-59": { court: "Ensemble végétal protégé", effet: PSMV_PROTEGE },
  "07-60": { court: "Arbre ou élément naturel protégé", effet: PSMV_PROTEGE },
  "07-61": { court: "Place, cour ou espace minéral protégé", effet: PSMV_PROTEGE },
  "07-62": { court: "Cours d’eau ou plan d’eau protégé", effet: PSMV_PROTEGE },
  "07-63": { court: "Point d’eau ou source protégé", effet: PSMV_PROTEGE },
  "07-64": { court: "Passage d’eau souterrain protégé", effet: PSMV_PROTEGE },
  "07-65": { court: "Espace vert à requalifier", effet: PSMV_NON_PROTEGE },
  "07-66": { court: "Espace minéral à requalifier", effet: PSMV_NON_PROTEGE },
  "07-67": { court: "Immeuble non protégé, à règles particulières", effet: PSMV_NON_PROTEGE },
  "07-68": { court: "Espace libre non protégé, à règles particulières", effet: PSMV_NON_PROTEGE },
  "07-69": { court: "Secteur à règles particulières", effet: PSMV_NON_PROTEGE },
  "08-00": { court: "Terrain à garder non bâti", effet: "Le plan déclare cette partie inconstructible, pour préserver un espace cultivé ou une continuité écologique." },
  "16-01": { court: "Bâtiment pouvant changer de destination", effet: "Par exemple devenir un logement ; le changement reste soumis à autorisation." },
  "16-02": { court: "Extension ou annexes admises par le plan", effet: "Dans les limites de surface, de hauteur et de distance que fixe le règlement." },
  "16-03": { court: "Secteur de constructions limitées", effet: "Le plan y admet, à titre exceptionnel, des constructions limitées ; les conditions sont dans le règlement." },
  "24-01": { court: "Voie prévue (à créer, modifier ou conserver)", effet: VOIE },
  "24-02": { court: "Voie à modifier", effet: VOIE },
  "24-03": { court: "Voie à créer", effet: VOIE },
  ...Object.fromEntries(["00", "01", "02", "03", "04", "05", "06", "07", "08"].map((s) => [`31-${s}`, { court: "Espace remarquable du littoral", effet: "Protégé par la loi Littoral : seuls des aménagements légers y sont admis." }])),
};

/** Une prescription dont le sous-code n'est pas reconnu : nommée par son intitulé, sans effet énoncé. */
export const EFFET_NEUTRE = "Son effet n’est pas établi ici : il se lit dans le règlement, et la mairie le confirme.";

/**
 * Les familles dont l'intitulé du producteur porte le MOTIF que la note renvoie au règlement (« Risque
 * d'inondation par ruissellement », « Zone de sismicité 3 ») : il reste lisible au premier niveau.
 */
export const MOTIF_AU_PREMIER_NIVEAU = new Set(["02-00", "02-01", "02-02"]);

/** Le type d'une zone, au singulier et au pluriel (le singulier reprend `TYPE_ZONE`). */
export const ZONE_SIMPLE: Record<string, { un: string; des: string }> = {
  U: { un: "zone urbaine", des: "zones urbaines" },
  AUc: { un: "zone à urbaniser", des: "zones à urbaniser" },
  AUs: { un: "zone à urbaniser plus tard, après une évolution du plan", des: "zones à urbaniser plus tard, après une évolution du plan" },
  A: { un: "zone agricole", des: "zones agricoles" },
  N: { un: "zone naturelle et forestière", des: "zones naturelles et forestières" },
};

/** Les secteurs d'une carte communale, dits sans le vocabulaire de la nomenclature (après « est dans »). */
export const SECTEUR_SIMPLE: Record<string, string> = {
  "01": "un secteur de la carte communale où des constructions peuvent être admises",
  "02": "un secteur de la carte communale réservé aux activités",
  "03": "un secteur de la carte communale où les constructions nouvelles ne sont en principe pas admises, sauf exceptions prévues par la loi",
  "99": "un secteur que la carte communale ne couvre pas",
};
