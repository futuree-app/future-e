// FUT-20 · LA CHALEUR DE LA COMMUNE, LUE À CE LOGEMENT. Lib PURE.
//
// Le dossier savait dire, séparément, que la commune serait exposée à de fortes chaleurs (une carte
// territoire, au grain commune) et que le diagnostic d'un logement classait son confort d'été comme
// insuffisant (une carte logement, au grain adresse). Deux cartes, deux gestes, aucun lien : l'une
// demandait de « regarder comment le logement tient l'été » trois cartes au-dessus de celle qui disait
// ce que le diagnostic en savait. Ce module fabrique UN côté « à cette adresse » que les cartes chaleur
// existantes portent désormais, avec UN geste ciblé (cadrage FUT-85, §F).
//
// CE QUE CE CÔTÉ A LE DROIT DE DIRE, selon le niveau de preuve (`ConfortEteFait.niveau`) :
//   - `logement` (A) : l'indicateur réglementaire, les caractéristiques documentées et la date ;
//   - `batiment` (B1) : les caractéristiques que le diagnostic décrit, sans les attribuer au logement ;
//   - `aucun` (C) : rien n'est qualifié ; le manque devient une vérification.
// Une caractéristique NON RENSEIGNÉE n'est jamais dite absente : elle devient une question.
//
// CE QU'IL NE FAIT JAMAIS :
//   - décider qu'une carte existe. Il ne se branche QUE sur une carte chaleur déjà émise par le moteur,
//     au-dessus de ses seuils (déclaré ou ambiant) : sous le seuil, aucune composition (D2, FUT-103) ;
//   - changer le verdict, l'orientation ou la matérialité. Le logement ne corrige pas la commune ;
//   - prédire une température intérieure ou un vécu. L'indicateur est conventionnel ;
//   - lire une évolution climatique. Il ne cite aucun chiffre : la carte qui le porte cite déjà le
//     constat climatique, avec ses preuves et sa convention.
import type { ConfortEteFait, DecisionAction, EvidenceRef, LogementFacts, ModuleFacts, VerificationFact } from "./decision-fact.ts";
import type { CompositionSide } from "./fact-composition.ts";
import type { UserProject } from "../user-project.ts";
import { bucketDuProjet, type Bucket } from "./logement-gestes.ts";
import { dateFr } from "./autour-permis.ts";

/** La règle du constat « Confort d'été insuffisant » (logement-rules.ts). Littéral : pas de cycle d'import. */
export const RULE_CONFORT_ETE = "logement.confort-ete";

export type LectureChaleurLogement = {
  /** Le côté « à cette adresse ». SANS action : le geste de la carte est `action`, et il est unique. */
  cote: CompositionSide;
  /** Le geste ciblé, qui remplace le renvoi générique au logement (`summerComfortAction`). */
  action: DecisionAction;
  /** Le titre de carte qui dit la relation (même titre pour les trois cartes chaleur). */
  titre: string;
  /** La phrase qui RELIE les deux échelles, pour le registre `compositions_found` de la conclusion. */
  resume: (nom: string) => string;
  niveau: ConfortEteFait["niveau"];
};

function joinFr(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

// « Inertie lourde » → « inertie lourde » ; « VMC simple flux » reste tel quel (sigle).
function minuscule(s: string): string {
  return /^[A-Z]{2}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1);
}

function etabliLe(c: ConfortEteFait): string {
  const d = c.dateDiagnostic ? dateFr(c.dateDiagnostic) : null;
  return d ? `, daté du ${d},` : "";
}

// LES CARACTÉRISTIQUES DE CE LOGEMENT, au niveau A seulement : ce sont alors les siennes. Le sujet
// est toujours explicite : « il » se lirait comme le diagnostic de la phrase précédente.
function caracteristiquesDuLogement(c: ConfortEteFait): string | null {
  const parties: string[] = [];
  const t = c.caracteristiques.find((x) => x.cle === "traversant");
  if (t) parties.push(t.sens === "favorable" ? "le logement est traversant" : "le logement n'est pas traversant");
  const i = c.caracteristiques.find((x) => x.cle === "inertie");
  if (i) parties.push(`${t ? "son inertie" : "l'inertie du logement"} est ${minuscule(i.libelle.replace(/^Inertie\s+/i, ""))}`);
  const p = c.caracteristiques.find((x) => x.cle === "protection");
  if (p) parties.push("des protections solaires sont renseignées");
  if (parties.length === 0) return null;
  const phrase = joinFr(parties);
  return `${phrase.charAt(0).toUpperCase()}${phrase.slice(1)}.`;
}

// CE QUE LE DIAGNOSTIC NE DIT PAS, dit comme tel : jamais « il n'a pas de protections solaires ».
function nonRenseigne(c: ConfortEteFait, sujet: "Le diagnostic" | "Il"): string | null {
  const q = c.nonRenseignees.map((k, idx) => {
    const qui = idx === 0 ? "le logement" : "il";
    return k === "traversant" ? `si ${qui} est traversant` : `si ${qui} dispose de protections solaires`;
  }).map((x) => x.replace(/^si il/, "s'il"));
  if (q.length === 0) return null;
  if (q.length === 1) return `${sujet} ne dit pas ${q[0]}.`;
  return `${sujet} ne dit ni ${q.join(", ni ")}.`;
}

function statementDe(c: ConfortEteFait): string {
  if (c.niveau === "logement") {
    const tete = `Le diagnostic de ce logement${etabliLe(c)} classe son confort d'été comme ${c.indicateur}.`;
    const relation = c.indicateur === "bon"
      ? "Ce classement ne change rien à l'exposition de la commune aux fortes chaleurs."
      : c.indicateur === "moyen"
        ? "Face aux fortes chaleurs projetées ici, ce classement reste à confirmer sur place."
        : "Face aux fortes chaleurs projetées ici, ce classement et ces caractéristiques méritent une attention particulière.";
    return [tete, caracteristiquesDuLogement(c), nonRenseigne(c, "Le diagnostic"), relation].filter(Boolean).join(" ");
  }
  if (c.niveau === "batiment") {
    const decrit = c.caracteristiques.map((x) => minuscule(x.libelle));
    const tete = c.methode === "immeuble"
      ? `Le diagnostic retrouvé${etabliLe(c)} a été généré à partir des données de l'immeuble : il décrit le bâtiment${decrit.length ? ` (${decrit.join(", ")})` : ""}, pas ce logement, et ne qualifie pas son confort d'été.`
      : `Le diagnostic retrouvé${etabliLe(c)} ne qualifie pas le confort d'été de ce logement.${decrit.length ? ` Il renseigne : ${decrit.join(", ")}.` : ""}`;
    return [tete, nonRenseigne(c, "Il"), "Face aux fortes chaleurs projetées ici, ce sont les points à faire vérifier."].filter(Boolean).join(" ");
  }
  return "Aucun diagnostic rattaché à ce logement ne qualifie son confort d'été : on ne sait ni si le logement est traversant, ni s'il dispose de protections solaires. Face aux fortes chaleurs projetées ici, ce sont les points à faire vérifier.";
}

function limitationDe(c: ConfortEteFait): string {
  if (c.niveau === "logement") {
    return "L'indicateur est réglementaire : il décrit le bâti dans des conditions conventionnelles et ne prédit pas la température que vous connaîtrez à l'intérieur. Des travaux ont pu changer ces caractéristiques depuis le diagnostic.";
  }
  if (c.niveau === "batiment" && c.methode === "immeuble") {
    return "Les caractéristiques d'un immeuble ne disent pas comment un logement précis tient la chaleur : son étage, son orientation et ses ouvertures comptent aussi.";
  }
  if (c.niveau === "aucun") {
    return "Aucun diagnostic n'étant rattaché à ce logement, futur•e ne qualifie pas son confort d'été. Ce qui n'est pas renseigné n'est pas absent : c'est ce qui reste à vérifier.";
  }
  return "Ce qui n'est pas renseigné n'est pas absent : c'est ce qui reste à vérifier.";
}

// LE GESTE CIBLÉ (cadrage §F.4-8, relecture éditoriale du 19/10/2026). Des QUESTIONS coordonnées, chacune
// avec son sujet, jamais des attributs sous un seul sujet : l'aération est un usage, « sous les toits » une
// position, pas des qualités du logement. UNE question dans le libellé (≤ 70 caractères pour tous les verbes),
// les autres dans le détail. L'ordre : ce que le diagnostic ne dit pas (traversant d'abord hors niveau A, où
// c'est l'inconnue principale), puis l'aération de nuit, que personne ne publie, puis la toiture hors A.
// L'aération n'est jamais présentée comme rafraîchissante en soi : elle ne l'est que si l'air dehors est plus frais.
const VERBE: Record<Bucket, string> = { achat: "Demandez", location: "Demandez au bailleur", reside: "Vérifiez", neutre: "Demandez" };
const VERBE_AUSSI: Record<Bucket, string> = { achat: "Demandez aussi", location: "Demandez-lui aussi", reside: "Vérifiez aussi", neutre: "Demandez aussi" };

type Question = "volets" | "traversant" | "aeration" | "toiture";
const QUESTION: Record<Question, string> = {
  volets: "si les fenêtres ont des volets ou des stores",
  traversant: "si le logement est traversant",
  aeration: "si l'on peut aérer les chambres la nuit",
  toiture: "si le logement est sous les toits",
};
const POURQUOI: Partial<Record<Question, string>> = {
  volets: "Volets, stores ou brise-soleil limitent la chaleur qui entre dans la journée.",
  traversant: "Un logement traversant permet de créer un courant d'air d'une façade à l'autre.",
};
const CONDITION_AERATION = "L'aération de nuit ne rafraîchit que lorsque l'air extérieur est plus frais qu'à l'intérieur.";

function actionDe(c: ConfortEteFait, b: Bucket): DecisionAction {
  const traversant = c.nonRenseignees.includes("traversant");
  const volets = c.nonRenseignees.includes("protection");
  const questions: Question[] = c.niveau === "logement"
    ? [...(volets ? ["volets" as const] : []), ...(traversant ? ["traversant" as const] : []), "aeration"]
    : [...(traversant ? ["traversant" as const] : []), ...(volets ? ["volets" as const] : []), "aeration", "toiture"];
  const [premiere, ...reste] = questions;
  const detail = [
    POURQUOI[premiere!] ?? null,
    reste.length ? `${VERBE_AUSSI[b]} ${joinFr(reste.map((q) => QUESTION[q]))}.` : null,
    CONDITION_AERATION,
  ].filter(Boolean).join(" ");
  return { type: "demander_confirmation", label: `${VERBE[b]} ${QUESTION[premiere!]}`, detail };
}

// LES TITRES nomment le NIVEAU projeté (« fortes chaleurs projetées », le terme de la carte et de la
// conclusion), jamais une évolution (« plus chauds ») ni une saison entière (« très chauds ») : la
// classification lit un niveau à l'horizon 2050, éventuellement par les seules nuits. « Classé » rappelle
// que l'indicateur du diagnostic est une classe réglementaire, pas une mesure. « Bon » ne se titre pas
// « classé bon » : sous « Ce qui correspond moins bien », il se lirait « problème réglé ».
function titreDe(c: ConfortEteFait): string {
  if (c.niveau === "logement" && (c.indicateur === "insuffisant" || c.indicateur === "moyen")) {
    return `De fortes chaleurs projetées, et un confort d'été classé ${c.indicateur}`;
  }
  if (c.niveau === "logement") return "De fortes chaleurs projetées, et ce qu'en dit le diagnostic";
  return "De fortes chaleurs projetées, et un confort d'été encore à vérifier";
}

function resumeDe(c: ConfortEteFait): (nom: string) => string {
  if (c.niveau === "logement" && c.indicateur === "insuffisant") {
    return (nom) => `Aux fortes chaleurs projetées à ${nom} s'ajoute un logement dont le diagnostic classe le confort d'été comme insuffisant.`;
  }
  if (c.niveau === "logement") {
    return (nom) => `Les fortes chaleurs projetées à ${nom} se lisent avec le confort d'été que le diagnostic attribue à ce logement.`;
  }
  return (nom) => `Les fortes chaleurs projetées à ${nom} rendent utile de vérifier ce que le diagnostic ne dit pas de ce logement.`;
}

// LA PROVENANCE SUIT CE QUI A ÉTÉ ATTRIBUÉ (revue PR #64). Aux niveaux A et B1, un diagnostic précis est
// rattaché au dossier : sa référence, sa valeur et sa date sont une preuve. Au niveau C, AUCUN diagnostic
// n'est rattaché : citer « Base DPE (ADEME) » en `persisted_snapshot` ferait lire, dans « Données et
// limites », une source consultée et conservée qui n'existe pas. Le côté C ne porte donc aucune preuve ;
// sa limite dit ce qui manque.
function preuvesDe(c: ConfortEteFait): EvidenceRef[] {
  if (c.niveau === "aucun") return [];
  const observedValue = c.niveau === "logement" ? `confort d'été ${c.indicateur}`
    : c.methode === "immeuble" ? "diagnostic établi à l'immeuble" : "confort d'été non renseigné";
  return [{
    factId: RULE_CONFORT_ETE, module: "logement", label: "Base DPE (ADEME)", grain: "adresse",
    href: "/rapport/logement", sourceMode: "persisted_snapshot", observedValue,
    ...(c.dateDiagnostic ? { observedAt: c.dateDiagnostic } : {}),
  }];
}

/**
 * Le côté logement d'une carte chaleur, ou `null` quand il n'y a rien à dire du logement : pas
 * d'adresse (la carte garde son renvoi « renseignez votre adresse »), ou un producteur qui n'a pas
 * fourni le confort d'été documenté. `faitAbsorbe` : le constat « Confort d'été insuffisant », quand
 * il a été émis ; il est alors porté par ce côté (son état, sa règle, son identifiant).
 */
export function lectureChaleurLogement(
  facts: Pick<ModuleFacts, "hasAddress" | "logement" | "relationAuLieu">,
  project: Pick<UserProject, "intent">,
  faitAbsorbe?: VerificationFact,
): LectureChaleurLogement | null {
  const l: LogementFacts | undefined = facts.logement;
  if (!facts.hasAddress || !l?.confortEte) return null;
  const c = l.confortEte;
  const b = bucketDuProjet(project, facts.relationAuLieu);
  return {
    cote: {
      label: "À cette adresse",
      statement: statementDe(c),
      evidence: preuvesDe(c),
      ruleIds: faitAbsorbe ? [faitAbsorbe.ruleId] : [],
      factIds: faitAbsorbe ? [faitAbsorbe.id] : [],
      limitation: limitationDe(c),
      ...(faitAbsorbe?.status ? { status: faitAbsorbe.status } : {}),
    },
    action: actionDe(c, b),
    titre: titreDe(c),
    resume: resumeDe(c),
    niveau: c.niveau,
  };
}
