// SONDE de la conclusion rédigée (slice 2). Répond à la seule question que les tests unitaires ne
// peuvent pas poser : face au VRAI modèle, combien de blocs SURVIVENT à la validation ?
//
// Les contraintes du slice 2 sont dures (matière obligatoire reprise au mot près, aucun nombre faux,
// verdict intouchable). Si le modèle les échoue, tout retombe en repli, le lecteur voit le
// déterministe, et le slice ne sert à rien : un vert de tests unitaires ne le dirait jamais.
//
// Cette sonde a trouvé trois défauts qu'aucune relecture n'avait vus : les libellés exigés avec leur
// article (« LA proximité de la mer » rejetait « exigence DE proximité de la mer »), l'exigence de
// recopier le constat du fait saillant (personne n'écrit ça), et le comptage en toutes lettres.
//
// Lancer :  node --env-file=.env.local scripts/probe-conclusion.ts
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { buildConclusionPlan, shouldGenerateNarrative } from "../src/lib/decision/conclusion-plan.ts";
import { validateGeneratedBlocks } from "../src/lib/decision/conclusion-validate.ts";
import { CONCLUSION_SYSTEM_PROMPT } from "../src/lib/decision/conclusion-prompt.ts";
import type { DecisionFact, MaterialityTier } from "../src/lib/decision/decision-fact.ts";

const TIRAGES = 5; // une contrainte qui ne passe qu'une fois sur trois est une contrainte qui ne tient pas
const transportSchema = z.object({ blocks: z.array(z.unknown()) });

function verif(id: string, tier: MaterialityTier, topic: string, statement: string): DecisionFact {
  return {
    id, ruleId: `r-${id}`, sourceFactIds: [], module: "logement", topic, statement,
    materialityTier: tier, role: "verification",
    evidence: [{ factId: id, module: "logement", label: "DPE", grain: "adresse" }],
    action: { type: "verifier_sur_place", label: "Vérifier" },
  };
}

// Cas riche réaliste : Toulouse, adresse analysée, contrainte « bord de mer » déclarée mais non
// examinable à ce grain, priorités air + agriculture non couvertes, 4 réserves dont une domine.
// Couverture PARTIELLE et réserves majeures : la case la plus fréquente aujourd'hui (slice 2.1).
const plan = buildConclusionPlan({
  scope: "commune+adresse",
  communeNom: "Toulouse",
  conclusionState: "no_incompatibility_established",
  posture: "recherche",
  // TROIS faits à ÉGALITÉ en tête : le cas `tied`, celui où la carte s'était tue. Le modèle doit les
  // nommer TOUS les trois, sans en couronner aucun. Le premier constat porte des nombres (19, 1982) :
  // ils viennent du repli, donc ils sont autorisés, mais aucun autre ne l'est.
  shownFacts: [
    verif("f1", "structuring", "l'exposition de Toulouse à l'inondation", "L'exposition de la commune à l'inondation ressort élevée. La commune a connu 19 arrêtés de catastrophe naturelle inondation depuis 1982."),
    verif("f2", "structuring", "le retrait-gonflement des argiles", "À cette adresse, le sol est exposé au retrait-gonflement des argiles (aléa moyen ou fort)."),
    verif("f3", "structuring", "un plan de prévention des risques", "À cette adresse, un plan de prévention des risques s'applique : PPR Sécheresse - Territoire 1 - Toulouse."),
    verif("f4", "secondary", "le périmètre patrimonial protégé", "À cette adresse, le bien est dans un périmètre patrimonial protégé."),
  ],
  uncovered: [{ key: "nearPlace", label: "la proximité de la gare Matabiau" }],
  uncoveredPriorities: [
    { key: "qualite_air", label: "la qualité de l'air" },
    { key: "agriculture", label: "l'agriculture" },
  ],
  establishedIncompatibility: null,
  coverage: "partial",
  orientation: "major_reserves",
  hasFavorable: false,
  favorableCount: 0,
  majorReserveCount: 2,
  reservesShown: 4,
  mismatchTotal: 0,
  mismatchShown: 0,
});

// Un fait de MISMATCH (établi, à arbitrer, jamais à vérifier).
function mismatch(id: string, tier: MaterialityTier, topic: string): DecisionFact {
  return {
    id, ruleId: `territoire.mismatch-${id}`, sourceFactIds: [`relativePosition.${id}`], module: "territoire",
    topic, statement: `Sur cet indicateur, Roubaix se situe parmi les 20 % de communes les moins favorables de France.`,
    materialityTier: tier, role: "mismatch", projectKey: id as never,
    basis: { kind: "relative_position", rankLow: 0.05, rankHigh: 0.12, universe: "communes_france", distributionVersion: "mismatch-dist-2026-07-15" },
    evidence: [{ factId: `relativePosition.${id}`, module: "territoire", label: "Territoire", grain: "commune" }],
  } as DecisionFact;
}

// Cas MISMATCH : deux priorités nettement moins bien servies (nature, calme), plus une réserve. Le modèle
// doit NOMMER les deux mismatchs, les dire en COMPARATIF, et ne pas les confondre avec « à vérifier ».
const planMismatch = buildConclusionPlan({
  scope: "commune", communeNom: "Roubaix", conclusionState: "no_incompatibility_established", posture: "recherche",
  shownFacts: [
    mismatch("nature", "structuring", "les espaces naturels"),
    mismatch("cadre_calme", "structuring", "le cadre calme"),
    verif("f1", "secondary", "le retrait-gonflement des argiles", "À cette adresse, le sol est exposé au retrait-gonflement des argiles."),
  ],
  uncovered: [], uncoveredPriorities: [],
  establishedIncompatibility: null, coverage: "high", orientation: "arbitration",
  hasFavorable: false, favorableCount: 0, majorReserveCount: 0, reservesShown: 1,
  mismatchTotal: 2, mismatchShown: 2,
});

// Un fait d'ABSENCE ATTESTÉE (named_absence) : un élément recherché n'existe pas à portée, la recherche a
// été faite. Le modèle doit le NOMMER dans son périmètre, jamais généraliser en jugement absolu.
function absence(id: string, tier: MaterialityTier, topic: string, statement: string): DecisionFact {
  return {
    id, ruleId: `territoire.absence-${id}`, sourceFactIds: [`absenceAttestation.${id}`], module: "territoire",
    topic, statement,
    materialityTier: tier, role: "mismatch", projectKey: id as never,
    basis: {
      kind: "named_absence",
      observedStateId: id === "vie_etudiante" ? "no_higher_education_establishment_in_radius" : "network_below_daily_credibility_floor",
      conventionId: id === "vie_etudiante" ? "higher-education-radius-adaptive-v1" : "daily-transit-access-v1",
      nationalContext: { prevalence: id === "vie_etudiante" ? 0.404 : 0.828, validCount: 34788, totalCount: 34788, universe: "communes_france", distributionVersion: "absence-dist-2026-07-15" },
    },
    evidence: [{ factId: `absenceAttestation.${id}`, module: "territoire", label: "Territoire", grain: "commune" }],
  } as DecisionFact;
}

// Cas ABSENCE ATTESTÉE : deux priorités dont l'élément recherché n'existe pas à portée (réseau du quotidien,
// établissements du supérieur). Orientation arbitrage. Le modèle doit NOMMER l'absence dans son périmètre,
// jamais dire « aucune vie étudiante » ni « à vérifier ».
const planAbsence = buildConclusionPlan({
  scope: "commune", communeNom: "Roubaix", conclusionState: "no_incompatibility_established", posture: "recherche",
  shownFacts: [
    absence("mobilite_quotidienne", "structuring", "les transports en commun du quotidien",
      "Aucune desserte de transports en commun considérée comme praticable au quotidien n'est identifiée à distance de marche du point de référence retenu pour Roubaix."),
    absence("vie_etudiante", "secondary", "les établissements du supérieur",
      "Aucun établissement d'enseignement supérieur n'est identifié dans un rayon de 25 km autour du point de référence retenu pour Roubaix."),
  ],
  uncovered: [], uncoveredPriorities: [],
  establishedIncompatibility: null, coverage: "high", orientation: "arbitration",
  hasFavorable: false, favorableCount: 0, majorReserveCount: 0, reservesShown: 0,
  mismatchTotal: 2, mismatchShown: 2,
});

console.log("gate :", shouldGenerateNarrative(plan), "· lead :", JSON.stringify(plan.lead));
console.log("\n──── DÉTERMINISTE (ce que le lecteur voit sans IA) ────");
console.log(plan.blocks.map((b) => b.fallbackText).join(" "));

async function probe(plan: ReturnType<typeof buildConclusionPlan>, label: string): Promise<{ retenus: number; total: number }> {
const generables = plan.blocks.filter((b) => b.generable);
let retenus = 0;
console.log(`\n════════ PLAN : ${label} (${generables.length} blocs générables) ════════`);
for (let i = 1; i <= TIRAGES; i++) {
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-6"),
    providerOptions: { anthropic: { effort: "medium", thinking: { type: "disabled" } } },
    temperature: 0.3,
    schema: transportSchema,
    system: CONCLUSION_SYSTEM_PROMPT,
    prompt: JSON.stringify({
      verdictEnLectureSeule: plan.blocks.find((b) => b.key === "verdict")!.fallbackText,
      scope: plan.scope,
      conclusionState: plan.conclusionState,
      posture: plan.posture,
      reservesCount: plan.reservesCount,
      lead: plan.lead,
      registresAConfier: generables.map((b) => ({
        key: b.key,
        texteDeRepli: b.fallbackText,
        matiereObligatoire: b.requiredPhrases,
        nombresAutorises: b.allowedNumbers,
        maxChars: b.maxChars,
      })),
    }),
  });

  const { blocks, rejected } = validateGeneratedBlocks(plan, object.blocks);
  const gen = blocks.filter((b) => b.generated).length;
  retenus += gen;
  console.log(`\n──── TIRAGE ${i} : ${gen}/${generables.length} blocs retenus ────`);
  console.log(blocks.map((b) => (b.generated ? "🟢 " : "⚪️ ") + b.text).join("\n"));
  for (const r of rejected) {
    const brut = (object.blocks as { key?: string; text?: string }[]).find((b) => b?.key === r.key);
    console.log(`   REJET [${r.key}] ${r.reason} : ${brut?.text ?? "(absent)"}`);
  }
}

  return { retenus, total: TIRAGES * generables.length };
}

const a = await probe(plan, "réserves majeures");
const b = await probe(planMismatch, "mismatch / arbitrage");
const c = await probe(planAbsence, "absence attestée / arbitrage");
const R = a.retenus + b.retenus + c.retenus, T = a.total + b.total + c.total;
console.log(`\n════ TAUX DE SURVIE : ${R}/${T} blocs ════`);
