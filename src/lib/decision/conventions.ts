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
import { ZONE_TABLE } from "../geo-zones.ts";

export type ConventionStatus = "historique" | "experimentale" | "perimetre" | "validee";

export type Convention = {
  id: string;
  version: number;
  criterion: { kind: "hard"; key: HardConstraintKey } | { kind: "preference"; key: PreferenceKey };
  definition:
    | { kind: "departements"; token: string; departements: string[] }
    | { kind: "seuil_population"; unit: SizeUnit; min: number | null; max: number | null }
    | { kind: "seuil_altitude"; metres: number; mesure: "chef_lieu" | "adresse" }
    | { kind: "seuil_distance"; km: number; mesure: "villes_cotieres_depuis_centre" };
  grainsValides: ("commune" | "adresse")[];
  libelleCourt: string;
  explication: string;
  // null = « justification externe à rechercher ».
  justification: string | null;
  status: ConventionStatus;
};

// LES MACRO-ZONES : un périmètre, tranchable une fois accepté. Le jeton et la liste de départements de la
// version 1 sont FIGÉS ici (copiés de la table au chargement, puis gelés par la version) : si la table
// évolue, une version 2 naîtra, et une acceptation de la version 1 continuera de désigner l'ancienne liste.
const MACRO_ZONES: { token: string; id: string; nom: string }[] = [
  { token: "sud", id: "zone:sud", nom: "le Sud" },
  { token: "sud_ouest", id: "zone:sud-ouest", nom: "le Sud-Ouest" },
  { token: "sud_est", id: "zone:sud-est", nom: "le Sud-Est" },
  { token: "nord", id: "zone:nord", nom: "le Nord" },
  { token: "est", id: "zone:est", nom: "l'Est" },
  { token: "grand_ouest", id: "zone:grand-ouest", nom: "le Grand Ouest" },
  { token: "centre", id: "zone:centre", nom: "le Centre" },
];

function macroZone(z: { token: string; id: string; nom: string }): Convention {
  const def = ZONE_TABLE[z.token]!;
  return {
    id: z.id, version: 1,
    criterion: { kind: "hard", key: "zones" },
    definition: { kind: "departements", token: z.token, departements: Object.freeze([...def.departements]) as string[] },
    grainsValides: ["commune", "adresse"],
    libelleCourt: `${z.nom} tel que futur•e le délimite`,
    explication: `Pour cette analyse, futur•e délimite ${z.nom} ainsi : ${def.convention}.`,
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
  {
    id: "littoral:15km", version: 1, criterion: { kind: "hard", key: "excludeSea" },
    definition: { kind: "seuil_distance", km: 15, mesure: "villes_cotieres_depuis_centre" }, grainsValides: [],
    libelleCourt: "au moins 15 km de la côte",
    explication: "futur•e estime la distance depuis le centre de la commune vers des villes côtières.",
    justification: null, status: "historique",
  },
];

export const CONVENTIONS: readonly Convention[] = [...MACRO_ZONES.map(macroZone), ...HISTORIQUES];

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
