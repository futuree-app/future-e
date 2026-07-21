// LA FABRIQUE DES 3 RÈGLES DE TAILLE D'AGGLOMÉRATION (categorical_state). PURE.
//
// Trois contrats DISTINCTS : eviter_grandes_villes et prefere_grande_ville SYMÉTRIQUES (la catégorie mesure
// directement la préférence) ; eviter_isolement ASYMÉTRIQUE (proxy faible : village -> mismatch, jamais
// satisfied). Le POIDS gouverne la matérialité. Provenance EXIGÉE : source absente -> uncertain.
import type { DecisionRule, RuleEvaluation, MismatchFact, EvidenceRef, ModuleFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import { preferenceWeight } from "./project-view.ts";
import type { PreferenceKey } from "../comparateur-vie.ts";
import {
  AGGLOMERATION_SIZE_CONVENTION, classifyAgglomerationSize, labelForCategory, categoryStatementFragment,
  type AgglomerationCategory,
} from "./agglomeration-facts.ts";

const territoireHref = "/rapport/quartier";
// Les 3 règles interprètent LE MÊME état territorial (tailleVille + source -> catégorie). Un fait source
// canonique unique permet à la future fusion de voir que deux mismatchs viennent du même état.
export const TERRITORY_SIZE_FACT_ID = "territorySize.classification";
type Outcome = "satisfied" | "neutral" | "mismatch";

type SizeSpec = {
  key: PreferenceKey;
  topic: string;
  // La PRIORITÉ du lecteur, telle qu'elle se lit après un deux-points dans le headline du verdict.
  // « l'isolement du territoire » nommerait l'indicateur défavorable, jamais ce qui a été demandé.
  subject: string;
  outcomes: Record<AgglomerationCategory, Outcome>;
  buildStatement: (nom: string, fragment: string) => string;
  limitation?: string;
};

const SPECS: SizeSpec[] = [
  {
    key: "eviter_grandes_villes",
    topic: "la taille du territoire",
    subject: "la taille de la ville",
    outcomes: { village: "satisfied", petite: "satisfied", moyenne: "neutral", grande: "mismatch", metropole: "mismatch" },
    buildStatement: (nom, fragment) =>
      `Vous avez placé le fait d'éviter les grandes villes parmi vos priorités. ${fragment}. Cet écart appelle un arbitrage. Il ne rend pas ${nom} incompatible avec votre projet.`,
  },
  {
    key: "prefere_grande_ville",
    topic: "la taille du territoire",
    subject: "la taille de la ville",
    outcomes: { village: "mismatch", petite: "mismatch", moyenne: "neutral", grande: "satisfied", metropole: "satisfied" },
    buildStatement: (nom, fragment) =>
      `Vous avez placé le fait de vivre dans une grande ville parmi vos priorités. ${fragment}. Cet écart appelle un arbitrage. Il ne rend pas ${nom} incompatible avec votre projet.`,
  },
  {
    key: "eviter_isolement",
    topic: "l'isolement du territoire",
    subject: "la taille du bassin de vie",
    outcomes: { village: "mismatch", petite: "neutral", moyenne: "neutral", grande: "neutral", metropole: "neutral" },
    buildStatement: (_nom, fragment) =>
      `Vous avez placé le fait d'éviter un environnement isolé parmi vos priorités. ${fragment}. Cette petite taille répond moins bien à cette dimension de votre projet, sans permettre de conclure à son isolement effectif.`,
    limitation:
      "La catégorie de taille utilisée ne décrit pas à elle seule l'accès aux services, aux transports ou aux pôles voisins. Un village peut être bien connecté à une ville proche.",
  },
];

export const AGGLOMERATION_KEYS: PreferenceKey[] = SPECS.map((s) => s.key);

function makeSizeRule(spec: SizeSpec): DecisionRule {
  const id = `territoire.taille-${spec.key}`;
  return {
    id,
    module: "territoire",
    evaluate: (f: ModuleFacts, p: UserProject): RuleEvaluation => {
      const ret = (outcome: RuleEvaluation["outcome"], facts: MismatchFact[], reason: string): RuleEvaluation =>
        ({ ruleId: id, projectKeys: [spec.key], outcome, facts, reason });

      const weight = preferenceWeight(p, spec.key);
      if (weight === 0) return ret("not_applicable", [], "priorité non déclarée");

      const cat = classifyAgglomerationSize(f.tailleVille);
      // Provenance EXIGÉE : une catégorie sans source prouvée n'est pas opposable (jamais un repli commune).
      if (cat === "uncertain" || f.tailleVilleSource == null) {
        return ret("uncertain", [], "taille ou provenance du territoire indisponible");
      }
      const source = f.tailleVilleSource;

      const outcome = spec.outcomes[cat];
      if (outcome !== "mismatch" || weight < 2) {
        const reason = outcome === "mismatch" ? "écart mineur, silencieux (poids 1)"
          : outcome === "satisfied" ? "catégorie recherchée" : "catégorie intermédiaire";
        return ret(outcome, [], reason);
      }

      const tier = weight >= 3 ? "structuring" : "secondary";
      const popText = source === "urban_unit"
        ? `population de l'unité urbaine : environ ${f.tailleVille!.toLocaleString("fr-FR")} habitants`
        : `population communale : environ ${f.tailleVille!.toLocaleString("fr-FR")} habitants`;
      const ev: EvidenceRef = {
        factId: TERRITORY_SIZE_FACT_ID, module: "territoire", label: `Territoire · ${f.nom}`,
        observedValue: `${labelForCategory(cat, source)}, ${popText}`,
        grain: source === "urban_unit" ? "unite_urbaine" : "commune", href: territoireHref,
      };
      const fact: MismatchFact = {
        id: `${f.insee}:mismatch-${spec.key}`, ruleId: id, sourceFactIds: [TERRITORY_SIZE_FACT_ID],
        module: "territoire", role: "mismatch", projectKey: spec.key, materialityTier: tier,
        topic: spec.topic,
        headlineSubject: spec.subject,
        statement: spec.buildStatement(f.nom, categoryStatementFragment(f.nom, cat, source)),
        basis: { kind: "categorical_state", observedCategory: cat, conventionId: AGGLOMERATION_SIZE_CONVENTION.id },
        evidence: [ev],
        ...(spec.limitation ? { limitation: spec.limitation } : {}),
      };
      return ret("mismatch", [fact], "catégorie de taille opposée à la préférence");
    },
  };
}

export const AGGLOMERATION_RULES: DecisionRule[] = SPECS.map(makeSizeRule);
