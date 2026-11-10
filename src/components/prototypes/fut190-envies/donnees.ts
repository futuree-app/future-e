// FUT-190 · PROTOTYPE « ENVIES » · LES DONNÉES.
//
// DEUX NATURES DE DONNÉES, À NE JAMAIS CONFONDRE :
//
//   RÉEL       les faits publics des communes d'Angers et de Chalonnes-sur-Loire. Chacun a été relu le
//              10/11/2026 dans un fichier présent en local (BPE 2025, RNA du 01/06/2026, index du
//              comparateur) ou calculé ce jour-là par le service d'itinéraire de l'IGN. Chaque fait
//              porte sa source ; rien n'est arrondi vers un récit.
//
//   ILLUSTRATIF la personne, son Projet, ses habitudes d'aujourd'hui, les deux annonces, et les
//              réponses aux vérifications. Tout cela est inventé pour la démonstration, et marqué
//              `illustratif` : l'interface l'affiche comme « déclaré » ou « annonce fictive ».
//
// Aucune absence n'est déduite d'un silence de la source : un lieu peut exister sans être recensé.

export type CleSource = "bpe" | "rna" | "ign" | "oso" | "drias" | "mobpro" | "dvf" | "gaspar" | "index";

export const SOURCES: Record<CleSource, { nom: string; detail: string; limite: string }> = {
  bpe: {
    nom: "Insee, Base permanente des équipements 2025",
    detail: "Fichier téléchargé le 16/08/2026. L'Insee a republié la base le 05/10/2026 ; les équipements cités ici n'ont pas été recontrôlés sur la nouvelle édition.",
    limite: "Recense des équipements, pas leur programmation, leurs horaires, leurs tarifs ni les places disponibles. Pour les arts du spectacle, la liste suit les lieux labellisés ou connus du ministère de la Culture : une salle peut exister sans y figurer.",
  },
  rna: {
    nom: "Répertoire national des associations, édition du 01/06/2026",
    detail: "Associations déclarées « actives », comptées par un filtre de mots sur le titre et l'objet déclarés. Ce filtre est une méthode de prototype, non validée.",
    limite: "Une déclaration ne dit ni si l'association fonctionne encore, ni si elle accueille de nouveaux membres. Le siège déclaré n'est pas toujours le lieu d'activité.",
  },
  ign: {
    nom: "IGN, service d'itinéraire (Géoplateforme), calculé le 10/11/2026",
    detail: "Temps estimé par le moteur de calcul, sans trafic, sans stationnement, sans attente.",
    limite: "Une estimation entre deux points précis. Le départ est un point du quartier ou le centre de la commune, pas une adresse.",
  },
  oso: {
    nom: "Occupation du sol OSO 2023 (CESBIO), dans l'index futur•e",
    detail: "Part de la surface de la commune par type de couvert.",
    limite: "Décrit la commune entière, jamais une parcelle.",
  },
  drias: {
    nom: "DRIAS, projections climatiques, dans l'index futur•e",
    detail: "Nombre de jours de sol sec par an à l'horizon 2050, pour un réchauffement de +2,7 °C en France. Position de la commune parmi les communes de France métropolitaine.",
    limite: "Une projection à l'échelle d'une maille de plusieurs kilomètres. Elle ne dit rien d'un jardin, de son sol ni de son accès à l'eau.",
  },
  mobpro: {
    nom: "Insee, recensement 2022, déplacements domicile-travail",
    detail: "Part des actifs occupés de la commune qui vont travailler en voiture.",
    limite: "Décrit les trajets de travail des habitants actuels. Ne dit pas si vos propres déplacements peuvent se faire sans voiture.",
  },
  dvf: {
    nom: "Demandes de valeurs foncières (DGFiP), ventes 2021 à 2024",
    detail: "Prix médian au mètre carré des maisons vendues dans la commune.",
    limite: "Une médiane communale sur quatre ans. Ne dit pas le prix d'un bien précis.",
  },
  gaspar: {
    nom: "Base GASPAR, arrêtés de catastrophe naturelle",
    detail: "Nombre d'arrêtés pour inondation pris pour la commune.",
    limite: "Un historique à l'échelle de la commune. Ne dit pas si une parcelle est inondable.",
  },
  index: {
    nom: "Moteur actuel du comparateur futur•e (index local)",
    detail: "Valeurs des critères « accès à une offre culturelle », « vie locale » et « nature », relues dans l'index local le 10/11/2026.",
    limite: "L'accès à la culture agrège tous les équipements culturels dans un rayon de 5 à 25 km. Il ne distingue ni le type de lieu, ni le temps pour s'y rendre.",
  },
};

export type Echelle = "commune" | "quartier" | "logement" | "vous";
export type Statut = "constate" | "calcule" | "projete" | "declare" | "inconnu";

export const NOM_ECHELLE: Record<Echelle, string> = { commune: "commune", quartier: "quartier", logement: "logement", vous: "vous" };
export const NOM_STATUT: Record<Statut, string> = { constate: "recensé", calcule: "estimé", projete: "projeté", declare: "déclaré", inconnu: "inconnu" };

/** Une phrase de lecture, avec l'échelle à laquelle elle vaut et la nature de ce qu'elle affirme. */
export type Fait = { texte: string; echelle: Echelle; statut: Statut; source?: CleSource; illustratif?: boolean };

/** Un repère sur la règle de portée : un lieu réel, et le temps estimé pour s'y rendre. */
export type Repere = { nom: string; precision?: string; minutes: number; mode: "a_pied" | "en_voiture"; source: CleSource; illustratif?: boolean };

export type IdLieu = "angers" | "chalonnes";
export type CleEnvie = "theatre" | "potager" | "nager" | "libre";

export type LieuCandidat = {
  id: IdLieu; nom: string; insee: string; population: string;
  /** D'où partent les temps de trajet : dit en toutes lettres sur la règle. */
  depart: string;
  annonce: { libelle: string; prix: string; surface: string; exterieur: string; note: string };
};

export const LIEUX: LieuCandidat[] = [
  {
    id: "angers", nom: "Angers", insee: "49007", population: "157 000 habitants",
    depart: "depuis le quartier de la Doutre (point du quartier, pas une adresse)",
    annonce: { libelle: "T3, quartier de la Doutre", prix: "285 000 €", surface: "68 m²", exterieur: "sans extérieur", note: "Annonce fictive. L'adresse exacte n'est pas renseignée." },
  },
  {
    id: "chalonnes", nom: "Chalonnes-sur-Loire", insee: "49063", population: "6 500 habitants",
    depart: "depuis le centre de la commune (l'annonce ne donne pas d'adresse)",
    annonce: { libelle: "Maison avec jardin", prix: "262 000 €", surface: "105 m², jardin de 400 m²", exterieur: "jardin de 400 m²", note: "Annonce fictive. L'adresse exacte n'est pas renseignée." },
  },
];

export const lieu = (id: IdLieu) => LIEUX.find((l) => l.id === id)!;

/** La situation d'aujourd'hui : déclarée par la personne, jamais mesurée par futur•e. */
export const AUJOURDHUI_LIEU = { nom: "Nantes", detail: "un T2 en location, sans extérieur" };

/** Le Projet (illustratif) et ce que les communes en disent déjà (faits réels). */
export const PROJET = {
  intention: "Acheter",
  budget: "300 000 € au plus",
  priorites: ["moins dépendre de la voiture", "rester sous 300 000 €", "avoir un extérieur ou de la verdure proche"],
};

export type LigneProjet = { cle: string; libelle: string; poids: string; lectures: Record<IdLieu, Fait>; distingue: boolean };

export const LIGNES_PROJET: LigneProjet[] = [
  {
    cle: "voiture", libelle: "Moins dépendre de la voiture", poids: "compte beaucoup pour vous", distingue: true,
    lectures: {
      angers: { texte: "54 % des actifs vont travailler en voiture.", echelle: "commune", statut: "constate", source: "mobpro" },
      chalonnes: { texte: "81 % des actifs vont travailler en voiture.", echelle: "commune", statut: "constate", source: "mobpro" },
    },
  },
  {
    cle: "prix", libelle: "Rester sous 300 000 €", poids: "compte beaucoup pour vous", distingue: true,
    lectures: {
      angers: { texte: "Maisons vendues autour de 3 290 € le mètre carré (médiane 2021 à 2024).", echelle: "commune", statut: "constate", source: "dvf" },
      chalonnes: { texte: "Maisons vendues autour de 2 310 € le mètre carré (médiane 2021 à 2024).", echelle: "commune", statut: "constate", source: "dvf" },
    },
  },
  {
    cle: "verdure", libelle: "Un extérieur ou de la verdure proche", poids: "compte pour vous", distingue: true,
    lectures: {
      angers: { texte: "52 % de la commune est bâtie ou aménagée. Forêts et prairies couvrent 41 % de sa surface.", echelle: "commune", statut: "constate", source: "oso" },
      chalonnes: { texte: "12 % de la commune est bâtie ou aménagée. Forêts et prairies couvrent 55 % de sa surface, les cultures 26 %.", echelle: "commune", statut: "constate", source: "oso" },
    },
  },
];

// ── Ce que futur•e sait lire pour chaque envie ───────────────────────────────────────────────

export type LectureLieu = {
  /** Les repères de la règle : vides quand rien n'est recensé à l'échelle utile. */
  reperes: Repere[];
  /** Ce que la règle ne peut pas montrer, dit sur la règle elle-même (zone d'inconnu dessinée). */
  inconnuRegle?: string;
  possible: Fait[];
  demande: Fait[];
  inconnu: Fait[];
};

export type Reponse = { valeur: string; libelle: string; effet: string; reste: string; /** Ce que la réponse change dans la comparaison. */ bascule: "ouvre" | "ferme" | "rien" };

export type Question = {
  id: string; lieu: IdLieu;
  question: string; pourquoi: string;
  aQui: string; moment: "avant la visite" | "pendant la visite" | "avant de vous engager";
  reponses: Reponse[];
  /** Vraie quand la réponse peut changer ce qui distingue les deux lieux. */
  departage: boolean;
};

export type CatalogueEnvie = {
  cle: Exclude<CleEnvie, "libre">;
  /** Ce que la personne a écrit, tel que futur•e le reformule. */
  compris: string; verbe: string;
  /** Les mots qui font reconnaître l'envie dans un texte libre (prototype : aucun modèle n'est appelé). */
  mots: string[];
  /** Ce que futur•e peut lire, et ce qu'il ne lira jamais, dit avant toute comparaison. */
  capacite: { lit: string; neLitPas: string };
  /** Ce que la personne déclare vivre aujourd'hui (illustratif). */
  aujourdhui: { texte: string; minutes: number | null; mode?: "a_pied" | "en_voiture" | "en_transport" };
  /** La portée a-t-elle un sens pour cette envie ? Un potager se vit chez soi ou tout près. */
  porteeUtile: boolean;
  lieux: Record<IdLieu, LectureLieu>;
  questions: Question[];
  /** Ce que l'analyse d'une adresse (offre existante) ajouterait pour cette envie. */
  adresse: { ajouterait: string[]; neDiraPas: string };
  /** Ce que le moteur actuel répond, sans cette lecture (faits réels de l'index). */
  moteurActuel: { critere: string | null; lecture: string; verdict: "ne_distingue_pas" | "non_mesure" | "distingue" };
};

export const CATALOGUE: Record<Exclude<CleEnvie, "libre">, CatalogueEnvie> = {
  theatre: {
    cle: "theatre", compris: "Aller plus souvent au théâtre", verbe: "aller au théâtre",
    mots: ["théâtre", "theatre", "spectacle", "opéra", "opera", "scène", "concert"],
    capacite: {
      lit: "Les lieux de spectacle recensés et le temps estimé pour s'y rendre.",
      neLitPas: "La programmation, le prix des places, les horaires de fin et les transports du soir.",
    },
    aujourdhui: { texte: "Deux ou trois fois par an, à 15 minutes en tramway.", minutes: 15, mode: "en_transport" },
    porteeUtile: true,
    lieux: {
      angers: {
        reperes: [
          { nom: "Le Quai", precision: "centre dramatique national", minutes: 5, mode: "a_pied", source: "ign" },
          { nom: "Grand Théâtre d'Angers", precision: "théâtre de ville", minutes: 12, mode: "a_pied", source: "ign" },
        ],
        possible: [
          { texte: "Cinq lieux de spectacle recensés dans la commune, dont un centre dramatique national et un théâtre de ville.", echelle: "commune", statut: "constate", source: "bpe" },
          { texte: "Depuis la Doutre, deux d'entre eux sont à 5 et 12 minutes à pied.", echelle: "quartier", statut: "calcule", source: "ign" },
        ],
        demande: [
          { texte: "Depuis un autre quartier, le trajet change : comptez plus de 20 minutes à pied depuis le centre de la commune.", echelle: "commune", statut: "calcule", source: "ign" },
        ],
        inconnu: [
          { texte: "La programmation et le prix des places.", echelle: "commune", statut: "inconnu" },
        ],
      },
      chalonnes: {
        reperes: [
          { nom: "Centre culturel La Loge", precision: "Beaupréau-en-Mauges, scène conventionnée", minutes: 35, mode: "en_voiture", source: "ign" },
          { nom: "Le Quai", precision: "Angers", minutes: 36, mode: "en_voiture", source: "ign" },
          { nom: "Grand Théâtre d'Angers", precision: "Angers", minutes: 37, mode: "en_voiture", source: "ign" },
          { nom: "Théâtre des Dames", precision: "Les Ponts-de-Cé", minutes: 39, mode: "en_voiture", source: "ign" },
        ],
        possible: [
          { texte: "Un cinéma est recensé dans la commune.", echelle: "commune", statut: "constate", source: "bpe" },
          { texte: "Les lieux de spectacle recensés les plus proches sont à 35 à 39 minutes en voiture.", echelle: "commune", statut: "calcule", source: "ign" },
        ],
        demande: [
          { texte: "Aucun lieu de spectacle n'est recensé dans la commune. Une salle municipale peut exister sans figurer dans ce recensement.", echelle: "commune", statut: "constate", source: "bpe" },
          { texte: "Chaque sortie demande la voiture, et un retour de nuit d'environ 35 minutes. Cela pèse sur votre priorité « moins dépendre de la voiture ».", echelle: "commune", statut: "calcule", source: "ign" },
        ],
        inconnu: [
          { texte: "L'existence d'un train ou d'un car pour rentrer d'Angers après un spectacle.", echelle: "commune", statut: "inconnu" },
          { texte: "Une programmation locale (salle municipale, saison itinérante).", echelle: "commune", statut: "inconnu" },
        ],
      },
    },
    questions: [
      {
        id: "q-theatre-retour", lieu: "chalonnes", departage: true,
        question: "Peut-on rentrer d'Angers à Chalonnes après 22 h 30 sans voiture ?",
        pourquoi: "Depuis Chalonnes, tous les lieux recensés sont à plus de 30 minutes en voiture. Un retour possible en train ou en car changerait ce que cette envie vous demande.",
        aQui: "Les horaires du réseau régional, ou la gare d'Angers", moment: "avant la visite",
        reponses: [
          { valeur: "oui", libelle: "Oui, il existe un retour tardif", bascule: "ouvre", effet: "D'après ce que vous avez vérifié, une sortie à Angers reste possible sans voiture certains soirs. L'envie tient à Chalonnes sans peser autant sur votre priorité « moins dépendre de la voiture ».", reste: "La fréquence de ce retour, et s'il existe toute l'année." },
          { valeur: "non", libelle: "Non, aucun retour le soir", bascule: "ferme", effet: "D'après ce que vous avez vérifié, chaque sortie demandera la voiture à l'aller et au retour. À Chalonnes, cette envie et votre priorité « moins dépendre de la voiture » se contredisent.", reste: "Une programmation locale à Chalonnes, que futur•e ne connaît pas." },
        ],
      },
      {
        id: "q-theatre-local", lieu: "chalonnes", departage: false,
        question: "Chalonnes a-t-elle une saison de spectacles (salle municipale, programmation itinérante) ?",
        pourquoi: "Le recensement national suit les lieux labellisés. Une programmation locale n'y figure pas forcément.",
        aQui: "La mairie ou la médiathèque", moment: "pendant la visite",
        reponses: [
          { valeur: "oui", libelle: "Oui, plusieurs dates par an", bascule: "ouvre", effet: "D'après la mairie, des spectacles ont lieu sur place plusieurs fois par an. Cela complète les sorties à Angers, sans les remplacer.", reste: "Le genre de spectacles proposés, et s'ils vous correspondent." },
          { valeur: "non", libelle: "Non, rien de régulier", bascule: "rien", effet: "D'après la mairie, il n'y a pas de programmation régulière sur place. La lecture ne change pas.", reste: "" },
        ],
      },
    ],
    adresse: {
      ajouterait: ["Le temps estimé depuis l'adresse exacte vers chaque lieu recensé, à pied et en voiture.", "Les arrêts de transport à proximité de l'adresse."],
      neDiraPas: "Les horaires du soir et la programmation restent à vérifier par vous.",
    },
    moteurActuel: {
      critere: "Accès à une offre culturelle",
      lecture: "Angers et Chalonnes-sur-Loire reçoivent la même valeur interne (88 sur 100, jamais affichée dans le produit). Le critère additionne cinémas, bibliothèques, conservatoires, musées et lieux de spectacle dans un rayon de 5 à 25 km, pondérés par la distance.",
      verdict: "ne_distingue_pas",
    },
  },

  potager: {
    cle: "potager", compris: "Cultiver une partie de votre alimentation", verbe: "cultiver",
    mots: ["cultiver", "potager", "jardin", "alimentation", "légumes", "legumes", "autonomie", "autosuffisance", "poules", "verger"],
    capacite: {
      lit: "Ce que l'annonce déclare (un jardin, sa surface), et ce que la commune dit du climat et des sols à venir.",
      neLitPas: "La qualité du sol d'une parcelle, son accès à l'eau, son exposition, et les jardins familiaux ou partagés : il n'en existe aucun recensement national.",
    },
    aujourdhui: { texte: "Pas d'extérieur aujourd'hui. Quelques aromatiques sur un rebord de fenêtre.", minutes: null },
    porteeUtile: false,
    lieux: {
      angers: {
        reperes: [],
        inconnuRegle: "Aucun recensement national des jardins familiaux ou partagés : futur•e ne peut pas placer de repère.",
        possible: [
          { texte: "63 associations déclarées à Angers mentionnent un jardin, un potager ou une AMAP. 36 ont mis à jour leur déclaration depuis 2021.", echelle: "commune", statut: "constate", source: "rna" },
        ],
        demande: [
          { texte: "L'annonce déclare un logement sans extérieur. Cultiver passerait par une parcelle hors du logement.", echelle: "logement", statut: "declare", illustratif: true },
        ],
        inconnu: [
          { texte: "L'existence d'un jardin familial ou partagé près de la Doutre, et le délai pour y obtenir une parcelle.", echelle: "quartier", statut: "inconnu" },
        ],
      },
      chalonnes: {
        reperes: [{ nom: "Jardin de l'annonce", precision: "400 m² déclarés", minutes: 0, mode: "a_pied", source: "ign", illustratif: true }],
        possible: [
          { texte: "L'annonce déclare un jardin de 400 m².", echelle: "logement", statut: "declare", illustratif: true },
        ],
        demande: [
          { texte: "Les projections placent Chalonnes parmi les 2 % de communes de France où les sols seraient le plus souvent secs à l'horizon 2050 (+2,7 °C en France). Angers est dans les 4 %. Un potager y demandera de l'eau l'été.", echelle: "commune", statut: "projete", source: "drias" },
          { texte: "La commune borde la Loire et compte 11 arrêtés de catastrophe naturelle pour inondation. Cela ne dit pas si ce jardin est inondable.", echelle: "commune", statut: "constate", source: "gaspar" },
        ],
        inconnu: [
          { texte: "Si le jardin est en zone inondable, et l'état de son sol.", echelle: "logement", statut: "inconnu" },
          { texte: "Un point d'eau (puits, récupération d'eau de pluie), l'exposition, et ce qui est cultivé derrière la clôture.", echelle: "logement", statut: "inconnu" },
        ],
      },
    },
    questions: [
      {
        id: "q-potager-parcelle", lieu: "angers", departage: true,
        question: "Existe-t-il un jardin familial ou partagé à moins de 15 minutes de la Doutre, et quel est le délai pour une parcelle ?",
        pourquoi: "À Angers, l'annonce n'a pas d'extérieur. Cette envie n'y tient que par une parcelle proche, que futur•e ne sait pas recenser.",
        aQui: "La mairie d'Angers, ou une association de jardins du quartier", moment: "avant la visite",
        reponses: [
          { valeur: "court", libelle: "Oui, une parcelle en moins d'un an", bascule: "ouvre", effet: "D'après la mairie, une parcelle serait accessible en moins d'un an près de la Doutre. L'envie devient possible à Angers aussi : elle ne distingue plus autant les deux lieux.", reste: "La taille de la parcelle, et le temps réel pour s'y rendre." },
          { valeur: "long", libelle: "Oui, mais plusieurs années d'attente", bascule: "ferme", effet: "D'après la mairie, il faudrait attendre plusieurs années. Pour cette envie, seul Chalonnes offre une possibilité dès l'emménagement.", reste: "D'autres formes de jardin (toit partagé, jardin d'une association)." },
          { valeur: "aucun", libelle: "Non, rien à proximité", bascule: "ferme", effet: "D'après la mairie, il n'y a pas de jardin accessible près de la Doutre. Pour cette envie, seul Chalonnes offre une possibilité.", reste: "Un autre quartier d'Angers pourrait en avoir." },
        ],
      },
      {
        id: "q-potager-eau", lieu: "chalonnes", departage: false,
        question: "Le jardin a-t-il un point d'eau, et a-t-il déjà été inondé ?",
        pourquoi: "Les étés secs sont projetés plus fréquents, et la commune borde la Loire. Les deux réponses se trouvent sur place.",
        aQui: "Le vendeur ou l'agence, puis vos yeux pendant la visite", moment: "pendant la visite",
        reponses: [
          { valeur: "eau", libelle: "Un puits ou une cuve, jamais inondé", bascule: "ouvre", effet: "D'après le vendeur, le jardin dispose d'un point d'eau et n'a pas été inondé. C'est une déclaration : elle vaut pour ce qu'il sait.", reste: "La zone réglementaire d'inondation, que l'analyse de l'adresse lirait." },
          { valeur: "sec", libelle: "Pas de point d'eau", bascule: "rien", effet: "D'après le vendeur, il n'y a ni puits ni cuve. L'arrosage dépendra du réseau, et des restrictions d'été quand il y en a.", reste: "Le coût d'une récupération d'eau de pluie." },
          { valeur: "inonde", libelle: "Déjà inondé", bascule: "ferme", effet: "D'après le vendeur, le jardin a déjà été sous l'eau. Cela concerne aussi la maison : à regarder avant tout.", reste: "La fréquence, et la hauteur atteinte." },
        ],
      },
    ],
    adresse: {
      ajouterait: ["La zone d'inondation au point de l'adresse.", "Les anciens sites industriels et les sols pollués recensés autour de la parcelle."],
      neDiraPas: "La qualité agronomique du sol, l'eau disponible et l'exposition restent à voir sur place.",
    },
    moteurActuel: {
      critere: null,
      lecture: "Aucun critère ne lit la possibilité de cultiver. Le critère « nature » mesure le couvert naturel dans un rayon de 15 km, ce qui est autre chose.",
      verdict: "non_mesure",
    },
  },

  nager: {
    cle: "nager", compris: "Continuer à nager deux fois par semaine", verbe: "nager",
    mots: ["nager", "natation", "piscine", "nage"],
    capacite: {
      lit: "Les bassins recensés, s'ils sont couverts, s'ils ferment hors saison, et le temps estimé pour s'y rendre.",
      neLitPas: "Les horaires d'ouverture au public, les créneaux de nage, les tarifs et l'affluence.",
    },
    aujourdhui: { texte: "Deux fois par semaine, à 10 minutes à pied de chez vous.", minutes: 10, mode: "a_pied" },
    porteeUtile: true,
    lieux: {
      angers: {
        reperes: [
          { nom: "Centre AquaVita", precision: "couvert, ouvert toute l'année", minutes: 9, mode: "en_voiture", source: "ign" },
          { nom: "Piscine Monplaisir", precision: "couverte, ouverte toute l'année", minutes: 11, mode: "en_voiture", source: "ign" },
        ],
        possible: [
          { texte: "Quatre bassins couverts, ouverts toute l'année, sont recensés dans la commune.", echelle: "commune", statut: "constate", source: "bpe" },
          { texte: "Depuis la Doutre, ils sont à 9 à 11 minutes en voiture.", echelle: "quartier", statut: "calcule", source: "ign" },
        ],
        demande: [
          { texte: "À pied depuis la Doutre, le bassin le plus proche est à 41 minutes. Votre trajet à pied d'aujourd'hui ne se retrouve pas dans ce quartier.", echelle: "quartier", statut: "calcule", source: "ign" },
        ],
        inconnu: [
          { texte: "Le temps en tramway ou en bus jusqu'à un bassin.", echelle: "quartier", statut: "inconnu" },
          { texte: "Les créneaux ouverts à la nage libre.", echelle: "commune", statut: "inconnu" },
        ],
      },
      chalonnes: {
        reperes: [
          { nom: "Centre aquatique Aqualoire", precision: "Mauges-sur-Loire, couvert, ouvert toute l'année", minutes: 14, mode: "en_voiture", source: "ign" },
          { nom: "Piscine du Louet", precision: "Rochefort-sur-Loire, couverte, saisonnière", minutes: 18, mode: "en_voiture", source: "ign" },
        ],
        possible: [
          { texte: "Un bassin couvert, ouvert toute l'année, est recensé à 14 minutes en voiture, dans la commune voisine.", echelle: "commune", statut: "calcule", source: "ign" },
        ],
        demande: [
          { texte: "La piscine de Chalonnes est recensée comme découverte et saisonnière : elle ne porte pas une habitude d'hiver.", echelle: "commune", statut: "constate", source: "bpe" },
          { texte: "Deux fois par semaine, cela représente environ une heure de voiture en plus chaque semaine.", echelle: "commune", statut: "calcule", source: "ign" },
        ],
        inconnu: [
          { texte: "Les créneaux ouverts à la nage libre, en particulier tôt le matin ou le soir.", echelle: "commune", statut: "inconnu" },
        ],
      },
    },
    questions: [
      {
        id: "q-nager-creneaux", lieu: "chalonnes", departage: false,
        question: "Le centre Aqualoire ouvre-t-il à la nage libre aux heures où vous nagez aujourd'hui ?",
        pourquoi: "Un bassin à 14 minutes ne porte votre habitude que s'il est ouvert quand vous êtes disponible.",
        aQui: "Le site ou l'accueil du centre aquatique", moment: "avant la visite",
        reponses: [
          { valeur: "oui", libelle: "Oui, matin et soir", bascule: "ouvre", effet: "D'après le centre, des créneaux existent matin et soir. Votre habitude tient à Chalonnes, en voiture.", reste: "L'affluence à ces heures-là." },
          { valeur: "non", libelle: "Non, horaires réduits", bascule: "ferme", effet: "D'après le centre, la nage libre n'est ouverte qu'en journée. Votre habitude ne tient pas à Chalonnes sans changer de rythme.", reste: "D'autres bassins plus lointains." },
        ],
      },
      {
        id: "q-nager-quartier", lieu: "angers", departage: false,
        question: "Un logement à moins de 15 minutes à pied d'une piscine couverte existe-t-il dans votre budget à Angers ?",
        pourquoi: "À Angers, tout dépend du quartier. Quatre bassins couverts sont recensés : chercher près de l'un d'eux garderait votre trajet à pied.",
        aQui: "Votre recherche d'annonces", moment: "avant la visite",
        reponses: [
          { valeur: "oui", libelle: "Oui, j'en ai trouvé", bascule: "ouvre", effet: "Vous avez repéré un logement proche d'un bassin. Ajoutez-le : la comparaison le lira comme les autres.", reste: "Son analyse d'adresse." },
          { valeur: "non", libelle: "Non, hors budget", bascule: "rien", effet: "D'après votre recherche, ces quartiers dépassent votre budget. La lecture ne change pas.", reste: "" },
        ],
      },
    ],
    adresse: {
      ajouterait: ["Le temps estimé depuis l'adresse exacte vers chaque bassin, à pied et en voiture.", "Les arrêts de transport à proximité de l'adresse."],
      neDiraPas: "Les horaires et les créneaux restent à vérifier auprès de chaque piscine.",
    },
    moteurActuel: {
      critere: null,
      lecture: "Aucun critère ne lit l'accès à une piscine. Les équipements sportifs entrent dans le niveau général de services, sans détail.",
      verdict: "non_mesure",
    },
  },
};

/** Les suggestions de l'entrée : des exemples concrets, jamais une taxonomie à remplir. */
export const EXEMPLES: { texte: string }[] = [
  { texte: "aller plus souvent au théâtre" },
  { texte: "cultiver une partie de mon alimentation" },
  { texte: "nager deux fois par semaine" },
  { texte: "m'engager dans la vie de ma commune" },
];

/** Ce que futur•e peut dire quand il ne sait pas lire une envie : le seul fait disponible, et sa limite. */
export const HORS_LECTURE = {
  fait: "8 115 associations sont déclarées actives à Angers, 208 à Chalonnes-sur-Loire.",
  limite: "Ce nombre ne dit ni ce qu'elles font, ni si elles accueillent de nouveaux membres. futur•e ne déduit rien des opinions ou des engagements des habitants.",
  source: "rna" as CleSource,
};

export const DATE_DU_JOUR = "2026-11-10";
