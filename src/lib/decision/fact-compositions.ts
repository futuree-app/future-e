// LE REGISTRE DES PATRONS DE COMPOSITION (v1 : deux, codés en dur). PUR.
//
// Une relation se DÉCLARE, elle ne se découvre pas : aucun regroupement automatique par sourceFactId
// (invariant 5). Une composition réorganise ce qui aurait été visible séparément ; elle ne rend jamais
// visible ce qui était silencieux (invariant 7). Le côté favorable n'est jamais re-dérivé : outcome
// depuis l'évaluation existante, preuve par helper canonique, aucun seuil recalculé (invariant 9).
import type { RunResult, RuleEvaluation, ModuleFacts, EvidenceRef, VerificationFact, MismatchFact, MaterialityTier } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import type { FactComposition, TradeoffComposition, SharedEvidenceComposition, GroupedVerificationComposition } from "./fact-composition.ts";
import { RULE_EXPOSITION_BATI, RULE_ZONE_REGLEMENTEE } from "./logement-rules.ts";
import { preferenceWeight } from "./project-view.ts";
import { rankPhrase, bandValide } from "./mismatch-facts.ts";
import { mismatchRuleId } from "./mismatch-rules.ts";
import { RULE_CHALEUR } from "./materiality-rules.ts";
import { TERRITORY_SIZE_FACT_ID } from "./agglomeration-rules.ts";
import { WINTER_MILDNESS_CONVENTION } from "../climate/winter-mildness.ts";
import { deCommune } from "../typography.ts";

const RULE_DOUCEUR = mismatchRuleId("douceur_climat");

const TIER_ORDER: Record<MaterialityTier, number> = { decision_critical: 0, structuring: 1, secondary: 2 };

function evaluation(run: RunResult, ruleId: string): RuleEvaluation | null {
  return run.evaluations.find((e) => e.ruleId === ruleId) ?? null;
}

// LA PREUVE DU CÔTÉ SATISFAIT. Un satisfied n'émet aucun fait : sa preuve est construite ici, depuis la
// bande canonique (jamais recalculée, gardes complètes via bandValide). Bande absente ou corrompue ->
// null, jamais une preuve inventée pour satisfaire une carte.
export function buildWinterMildnessEvidence(facts: ModuleFacts): EvidenceRef | null {
  const band = facts.rankBands?.["douceur_climat"] ?? null;
  if (!bandValide(band)) return null;
  const topShare = 1 - band.low; // part supérieure : borne basse 0,90 -> parmi les 10 %
  return {
    factId: "relativePosition.douceur_climat",
    module: "territoire",
    label: `Territoire · ${facts.nom}`,
    observedValue: `parmi ${rankPhrase(topShare)} aux hivers les plus doux (référence ${WINTER_MILDNESS_CONVENTION.referencePeriod})`,
    grain: "commune",
    href: "/rapport/quartier",
  };
}

function composeSeasonalClimateTradeoff(
  run: RunResult, facts: ModuleFacts, project: UserProject,
): TradeoffComposition | null {
  // GATE (spec §4) : tous les éléments narrés à poids >= 2 ; outcome depuis l'évaluation existante ;
  // un fait défavorable RÉELLEMENT produit (on ne compose que l'affichable seul).
  if (preferenceWeight(project, "douceur_climat") < 2) return null;
  if (preferenceWeight(project, "faible_chaleur") < 2) return null;
  const douceur = evaluation(run, RULE_DOUCEUR);
  if (!douceur || douceur.outcome !== "satisfied") return null;
  const chaleur = evaluation(run, RULE_CHALEUR);
  const chaleurFact = (chaleur?.facts ?? []).find((f) => f.role === "verification") as VerificationFact | undefined;
  if (!chaleurFact) return null;
  const favorableEvidence = buildWinterMildnessEvidence(facts);
  if (!favorableEvidence) return null; // invariant 9 : preuve non fabricable = patron non déclenché

  return {
    id: `${facts.insee}:composition-climat-saisons`,
    kind: "tradeoff",
    patternId: "seasonal_climate_tradeoff",
    title: "Des hivers doux, avec une exposition estivale à arbitrer",
    summary: `Les hivers ${deCommune(facts.nom)} comptent parmi les plus doux du pays, et l'exposition aux fortes chaleurs estivales y appelle un arbitrage.`,
    favorableSide: {
      label: "Ce qui correspond",
      statement: "Les températures moyennes d'hiver figurent parmi les plus douces à l'échelle nationale.",
      evidence: [favorableEvidence],
      ruleIds: [RULE_DOUCEUR],
      factIds: [],
    },
    unfavorableSide: {
      label: "Ce qui appelle un arbitrage",
      statement: chaleurFact.statement,
      evidence: chaleurFact.evidence,
      ruleIds: [RULE_CHALEUR],
      factIds: [chaleurFact.id],
      action: chaleurFact.action,
      ...(chaleurFact.limitation ? { limitation: chaleurFact.limitation } : {}),
    },
    absorbedFactIds: [chaleurFact.id],
    referencedRuleIds: [RULE_DOUCEUR, RULE_CHALEUR],
    materialityTier: chaleurFact.materialityTier, // la douceur n'aggrave jamais la réserve
    displaySection: "compromises",
  };
}

// LE PATRON EST STRICT (invariant 5) : source canonique + clés autorisées + basis catégoriel de la MÊME
// catégorie observée. Le titre affirme « une même petite taille » : le patron n'a le droit de se
// déclencher que si c'est vrai. eviter_grandes_villes est ABSENT : sur un village il est satisfied, il
// ne produit jamais un mismatch à regrouper ici.
const TERRITORY_SIZE_PATTERN = {
  sourceFactId: TERRITORY_SIZE_FACT_ID,
  allowedProjectKeys: new Set(["prefere_grande_ville", "eviter_isolement"]),
  requiredBasisKind: "categorical_state" as const,
  composableCategories: new Set(["village"]), // v1 : le seul cas réellement produit par les règles
};

function composeTerritorySizeSharedEvidence(run: RunResult, facts: ModuleFacts): SharedEvidenceComposition | null {
  // Seuls les faits MATÉRIELS ÉMIS comptent (poids >= 2 par construction des règles de taille) :
  // une évaluation silencieuse de poids 1 n'est jamais repêchée (invariant 7).
  const eligible = run.facts.filter((f): f is MismatchFact =>
    f.role === "mismatch" &&
    f.sourceFactIds.includes(TERRITORY_SIZE_PATTERN.sourceFactId) &&
    TERRITORY_SIZE_PATTERN.allowedProjectKeys.has(f.projectKey) &&
    f.basis.kind === TERRITORY_SIZE_PATTERN.requiredBasisKind &&
    TERRITORY_SIZE_PATTERN.composableCategories.has(f.basis.observedCategory),
  );
  if (eligible.length < 2) return null;
  // L'ÉTAT COMMUN doit être commun : même catégorie observée sur tous les faits regroupés.
  const categories = new Set(eligible.map((f) => (f.basis as { observedCategory: string }).observedCategory));
  if (categories.size !== 1) return null;

  // TRI TOTALEMENT DÉTERMINISTE : cette couche entre dans le hash narratif ; l'ordre d'enregistrement
  // des règles ne doit jamais changer une composition.
  const ordered = [...eligible].sort((a, b) =>
    TIER_ORDER[a.materialityTier] - TIER_ORDER[b.materialityTier] ||
    a.projectKey.localeCompare(b.projectKey) ||
    a.id.localeCompare(b.id),
  );
  const top = ordered[0]!;
  return {
    id: `${facts.insee}:composition-taille-consequences`,
    kind: "shared_evidence",
    patternId: "territory-size-multiple-consequences",
    title: "Une même petite taille touche plusieurs dimensions de votre projet",
    summary: `La catégorie de taille ${deCommune(facts.nom)} répond moins bien à ${ordered.length === 2 ? "deux" : String(ordered.length)} de vos priorités, pour la même raison.`,
    sharedEvidence: top.evidence,
    consequences: ordered.map((f) => ({
      projectKey: f.projectKey,
      statement: f.statement,
      materialityTier: f.materialityTier,
      factId: f.id,
      ...(f.limitation ? { limitation: f.limitation } : {}),
    })),
    absorbedFactIds: ordered.map((f) => f.id),
    referencedRuleIds: [...new Set(ordered.map((f) => f.ruleId))],
    materialityTier: top.materialityTier,
    displaySection: "mismatches",
  };
}

// LA NATURE DU PPR EST VÉRIFIÉE, jamais supposée : composer les argiles avec un PPR inondation
// grouperait deux sujets décisionnels différents sous un titre qui affirme la sécheresse. Le patron ne
// se déclenche que si le libellé du plan le dit (invariant 5 : la relation se déclare).
const PPR_SECHERESSE = /sécheresse|argile|tassement/i;

function composeClayRegulationGrouped(run: RunResult, facts: ModuleFacts): GroupedVerificationComposition | null {
  // GATE : les deux faits RÉELLEMENT émis (les règles logement portent déjà posture et couverture),
  // et un PPR dont le libellé atteste la nature sécheresse/argiles. Libellé absent = invérifiable = rien.
  const argiles = (evaluation(run, RULE_EXPOSITION_BATI)?.facts ?? []).find((f) => f.role === "verification") as VerificationFact | undefined;
  const ppr = (evaluation(run, RULE_ZONE_REGLEMENTEE)?.facts ?? []).find((f) => f.role === "verification") as VerificationFact | undefined;
  if (!argiles || !ppr) return null;
  const label = facts.logement?.pprnLabel;
  if (!label || !PPR_SECHERESSE.test(label)) return null;

  const item = (f: VerificationFact, itemLabel: string) => ({
    label: itemLabel,
    statement: f.statement,
    evidence: f.evidence,
    ruleIds: [f.ruleId],
    factIds: [f.id],
    ...(f.action ? { action: f.action } : {}),
    ...(f.limitation ? { limitation: f.limitation } : {}),
  });
  const tier: MaterialityTier =
    TIER_ORDER[argiles.materialityTier] <= TIER_ORDER[ppr.materialityTier] ? argiles.materialityTier : ppr.materialityTier;
  return {
    id: `${facts.insee}:composition-argiles-ppr`,
    kind: "grouped_verification",
    patternId: "clay_regulation_grouped",
    title: "Un sol argileux, et la règle qui l'encadre",
    summary: "Le sol argileux expose le bâti à cette adresse, et un plan de prévention sécheresse y encadre les travaux.",
    items: [item(argiles, "L'exposition du sol"), item(ppr, "La règle applicable")],
    absorbedFactIds: [argiles.id, ppr.id],
    referencedRuleIds: [RULE_EXPOSITION_BATI, RULE_ZONE_REGLEMENTEE],
    materialityTier: tier,
    displaySection: "verifications",
  };
}

// LE VALIDATEUR : l'assembleur ne fait pas confiance au constructeur (même doctrine qu'assertFactValid).
// Jette : un patron futur qui absorberait deux fois une carte ou masquerait un fait inexistant doit
// exploser en développement, jamais rendre une UI silencieusement incohérente.
export function assertCompositionsValid(run: RunResult, compositions: FactComposition[]): void {
  const factIds = new Set(run.facts.map((f) => f.id));
  const ruleIds = new Set(run.evaluations.map((e) => e.ruleId));
  const seenCompIds = new Set<string>();
  const seenAbsorbed = new Set<string>();
  for (const c of compositions) {
    if (seenCompIds.has(c.id)) throw new Error(`composition dupliquée : ${c.id}`);
    seenCompIds.add(c.id);
    // Ces deux gardes sont statiquement impossibles (types littéraux) : elles protègent contre des
    // données runtime forgées ou un futur patron mal câblé, d'où la vue élargie.
    const section = (c as { displaySection: string }).displaySection;
    if (c.kind === "tradeoff" && section !== "compromises") throw new Error(`tradeoff hors compromises : ${c.id}`);
    if (c.kind === "shared_evidence" && section !== "mismatches") throw new Error(`shared_evidence hors mismatches : ${c.id}`);
    if (c.kind === "grouped_verification" && section !== "verifications") throw new Error(`grouped_verification hors verifications : ${c.id}`);
    if (c.absorbedFactIds.length === 0) throw new Error(`composition sans absorbé : ${c.id}`);
    for (const id of c.absorbedFactIds) {
      if (!factIds.has(id)) throw new Error(`fait absorbé inexistant : ${id} (${c.id})`);
      if (seenAbsorbed.has(id)) throw new Error(`fait absorbé deux fois : ${id}`);
      seenAbsorbed.add(id);
    }
    for (const rid of c.referencedRuleIds) {
      if (!ruleIds.has(rid)) throw new Error(`ruleId référencé inexistant : ${rid} (${c.id})`);
    }
  }
}

export function composeFacts(run: RunResult, facts: ModuleFacts, project: UserProject): FactComposition[] {
  const out: FactComposition[] = [];
  const seasonal = composeSeasonalClimateTradeoff(run, facts, project);
  if (seasonal) out.push(seasonal);
  const size = composeTerritorySizeSharedEvidence(run, facts);
  if (size) out.push(size);
  const clay = composeClayRegulationGrouped(run, facts);
  if (clay) out.push(clay);
  assertCompositionsValid(run, out); // toujours : le jeu est minuscule, l'incohérence silencieuse coûte plus
  return out;
}
