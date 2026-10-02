// LE REGISTRE DES CONVENTIONS DE futur•e (FUT-8). Lib PURE.
//
// Une convention donne un sens opérationnel à un mot du lecteur (« le Sud-Ouest », « la montagne »). Elle
// est versionnée, visible, et elle porte son statut :
//
//   historique     existe dans le code, non justifiée : JAMAIS pour trancher ;
//   experimentale  en cours de justification : JAMAIS pour trancher ;
//   perimetre      définit un PÉRIMÈTRE dont l'appartenance se mesure exactement : tranchable une fois
//                  acceptée (seule la frontière est conventionnelle, et c'est elle que le lecteur accepte) ;
//   validee        mesure sourcée et défendable : tranchable une fois acceptée.
//
// Une convention contribue à `trancher` seulement si son statut le permet, que le lecteur l'a acceptée
// (`UserProject.definitions`), et que le grain évalué est dans `grainsValides`. Une acceptation ne corrige
// jamais un proxy ni une mauvaise échelle : la montagne à 600 m au chef-lieu reste `historique`.
import type { HardConstraintKey } from "../hard-constraints.ts";
import type { PreferenceKey } from "../comparateur-vie.ts";
import type { SizeUnit } from "../hard-constraint-schema.ts";

export type ConventionStatus = "historique" | "experimentale" | "perimetre" | "validee";

export type Convention = {
  id: string;
  version: number;
  criterion: { kind: "hard"; key: HardConstraintKey } | { kind: "preference"; key: PreferenceKey };
  definition:
    | { kind: "departements"; token: string; departements: string[] }
    | { kind: "seuil_population"; unit: SizeUnit; min: number | null; max: number | null }
    | { kind: "seuil_altitude"; metres: number; mesure: "chef_lieu" | "adresse" }
    | { kind: "classement_loi_littoral"; classement: "Mer" };
  grainsValides: ("commune" | "adresse")[];
  libelleCourt: string;
  explication: string;
  // null = « justification externe à rechercher ».
  justification: string | null;
  status: ConventionStatus;
};

// LES MACRO-ZONES : un périmètre, tranchable une fois accepté. La liste de départements de chaque
// version est ÉCRITE ICI, EN DUR : une acceptation de la version 1 désigne cette liste-là pour toujours,
// et c'est elle que le dossier évalue (hydrateHardConstraints). La table des jetons (geo-zones.ts) sert la
// Recherche ; si elle change, le test fut8-correctifs échoue tant qu'une version 2 n'a pas été écrite ici.
const MACRO_ZONES_V1: { token: string; id: string; nom: string; departements: readonly string[]; convention: string }[] = [
  { token: "sud", id: "zone:sud", nom: "le Sud", convention: "PACA, l'Occitanie et le sud de la Nouvelle-Aquitaine (Landes, Pays basque, Béarn, Dordogne, Gironde)",
    departements: ["04", "05", "06", "13", "83", "84", "09", "11", "12", "30", "31", "32", "34", "46", "48", "65", "66", "81", "82", "24", "33", "40", "47", "64"] },
  { token: "sud_ouest", id: "zone:sud-ouest", nom: "le Sud-Ouest", convention: "de la Gironde aux Pyrénées (ancienne Aquitaine et Midi-Pyrénées)",
    departements: ["24", "33", "40", "47", "64", "09", "12", "31", "32", "46", "65", "81", "82"] },
  { token: "sud_est", id: "zone:sud-est", nom: "le Sud-Est", convention: "PACA, la vallée du Rhône (Drôme, Ardèche) et le Gard",
    departements: ["04", "05", "06", "13", "83", "84", "26", "07", "30"] },
  { token: "nord", id: "zone:nord", nom: "le Nord", convention: "les Hauts-de-France (Nord, Pas-de-Calais, Picardie)",
    departements: ["02", "59", "60", "62", "80"] },
  { token: "est", id: "zone:est", nom: "l'Est", convention: "le Grand Est (Alsace, Lorraine, Champagne-Ardenne)",
    departements: ["08", "10", "51", "52", "54", "55", "57", "67", "68", "88"] },
  { token: "grand_ouest", id: "zone:grand-ouest", nom: "le Grand Ouest", convention: "la Bretagne, les Pays de la Loire, la Normandie et le Poitou",
    departements: ["22", "29", "35", "56", "44", "49", "53", "72", "85", "14", "27", "50", "61", "76", "17", "79", "86"] },
  { token: "centre", id: "zone:centre", nom: "le Centre", convention: "le Centre-Val de Loire",
    departements: ["18", "28", "36", "37", "41", "45"] },
];

function macroZone(z: (typeof MACRO_ZONES_V1)[number]): Convention {
  return {
    id: z.id, version: 1,
    criterion: { kind: "hard", key: "zones" },
    definition: { kind: "departements", token: z.token, departements: Object.freeze([...z.departements]) as string[] },
    grainsValides: ["commune", "adresse"],
    libelleCourt: `${z.nom} tel que futur•e le délimite`,
    explication: `Pour cette analyse, futur•e délimite ${z.nom} ainsi : ${z.convention}.`,
    justification: "Périmètre départemental proposé au lecteur, qui l'accepte comme sens de son critère.",
    status: "perimetre",
  };
}

// LES CONVENTIONS HISTORIQUES : présentes dans le code, jamais pour trancher. Elles sont listées pour
// être visibles, et pour qu'aucune ne devienne tranchable par oubli.
const HISTORIQUES: Convention[] = [
  {
    id: "montagne:600m-chef-lieu", version: 1, criterion: { kind: "hard", key: "montagne" },
    definition: { kind: "seuil_altitude", metres: 600, mesure: "chef_lieu" }, grainsValides: [],
    libelleCourt: "une altitude d'au moins 600 m au centre de la commune",
    explication: "futur•e lit aujourd'hui l'altitude du centre de la commune, pas celle du logement.",
    justification: null, status: "historique",
  },
  // FUT-33 (02/10/2026) : « pas le littoral » n'est plus une distance (l'ancienne « littoral:15km » mesurait
  // une distance du centre à des villes côtières). C'est le classement de la commune au titre de la loi Littoral.
  // Toujours historique : une condition qui s'appuie dessus s'apprécie, elle ne tranche pas (aucune promotion).
  {
    id: "littoral:loi-littoral-mer", version: 1, criterion: { kind: "hard", key: "excludeSea" },
    definition: { kind: "classement_loi_littoral", classement: "Mer" }, grainsValides: [],
    libelleCourt: "hors des communes classées « Mer » au titre de la loi Littoral",
    explication: "futur•e lit le classement de la commune au titre de la loi Littoral ; il ne dit rien de la distance du logement au rivage.",
    justification: null, status: "historique",
  },
];

export const CONVENTIONS: readonly Convention[] = [...MACRO_ZONES_V1.map(macroZone), ...HISTORIQUES];

export function conventionPar(id: string, version: number): Convention | null {
  return CONVENTIONS.find((c) => c.id === id && c.version === version) ?? null;
}

/** La convention de version la plus récente d'une macro-zone, pour la PROPOSER au lecteur. */
export function conventionDeZone(token: string): Convention | null {
  const toutes = CONVENTIONS.filter((c) => c.definition.kind === "departements" && c.definition.token === token);
  return toutes.sort((a, b) => b.version - a.version)[0] ?? null;
}

/** Une convention peut-elle fonder un verdict, une fois acceptée, à ce grain ? */
export function conventionTranchable(c: Convention, grain: "commune" | "adresse"): boolean {
  return (c.status === "perimetre" || c.status === "validee") && c.grainsValides.includes(grain);
}
