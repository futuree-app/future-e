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
import { buildConclusionPlan, shouldGenerateNarrative, HEADLINE_MAX_CHARS } from "../src/lib/decision/conclusion-plan.ts";
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
  shownCompositions: [],
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


// LES SUJETS DE HÉROS, recopiés des tables de production (MISMATCH_LABELS pour les critères à position
// relative, les SPECS d'absence, de taille et de mer pour les autres). La sonde doit montrer CE QUE LE
// LECTEUR VERRA : tant qu'elle recopiait le `topic`, elle affichait « la distance à la mer » là où la
// production dit « la proximité de la mer », soit exactement l'inversion que le champ corrige.
const HEADLINE_SUBJECTS: Record<string, string> = {
  nature: "l'accès aux espaces naturels",
  cadre_calme: "le calme",
  ensoleillement_recherche: "l'ensoleillement",
  mobilite_quotidienne: "les transports du quotidien",
  vie_etudiante: "l'environnement étudiant",
  proximite_mer: "la proximité de la mer",
  eviter_grandes_villes: "la taille de la ville",
  eviter_isolement: "la taille du bassin de vie",
};

// Un fait de MISMATCH (établi, à arbitrer, jamais à vérifier).
function mismatch(id: string, tier: MaterialityTier, topic: string): DecisionFact {
  return {
    id, ruleId: `territoire.mismatch-${id}`, sourceFactIds: [`relativePosition.${id}`], module: "territoire",
    topic, statement: `Sur cet indicateur, Roubaix se situe parmi les 20 % de communes les moins favorables de France.`,
    materialityTier: tier, role: "mismatch", projectKey: id as never, headlineSubject: HEADLINE_SUBJECTS[id] ?? topic,
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
  shownCompositions: [],
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
    materialityTier: tier, role: "mismatch", projectKey: id as never, headlineSubject: HEADLINE_SUBJECTS[id] ?? topic,
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
  shownCompositions: [],
  uncovered: [], uncoveredPriorities: [],
  establishedIncompatibility: null, coverage: "high", orientation: "arbitration",
  hasFavorable: false, favorableCount: 0, majorReserveCount: 0, reservesShown: 0,
  mismatchTotal: 2, mismatchShown: 2,
});

// Un fait de MESURE PHYSIQUE (absolute_measure) : la mer est loin. Le modèle doit nommer l'éloignement au
// périmètre mesuré, en comparatif, sans le confondre avec « à vérifier », et sans transformer la distance
// en temps de trajet ni écrire « la mer est à X km ».
function coast(id: string, tier: MaterialityTier, topic: string, statement: string): DecisionFact {
  return {
    id, ruleId: `territoire.mer-${id}`, sourceFactIds: [`coastDistance.${id}`], module: "territoire",
    topic, statement,
    materialityTier: tier, role: "mismatch", projectKey: id as never, headlineSubject: HEADLINE_SUBJECTS[id] ?? topic,
    basis: { kind: "absolute_measure", value: 240, unit: "km", conventionId: "coast-proximity-v1" },
    evidence: [{ factId: `coastDistance.${id}`, module: "territoire", label: "Territoire", grain: "commune" }],
  } as DecisionFact;
}

const planCoast = buildConclusionPlan({
  scope: "commune", communeNom: "Roubaix", conclusionState: "no_incompatibility_established", posture: "recherche",
  shownFacts: [
    coast("proximite_mer", "structuring", "la distance à la mer",
      "La distance au littoral est estimée à environ 240 km depuis le point de référence retenu pour Roubaix."),
  ],
  shownCompositions: [],
  uncovered: [], uncoveredPriorities: [],
  establishedIncompatibility: null, coverage: "high", orientation: "arbitration",
  hasFavorable: false, favorableCount: 0, majorReserveCount: 0, reservesShown: 0,
  mismatchTotal: 1, mismatchShown: 1,
});

// Un fait d'ÉTAT CATÉGORIEL (categorical_state) : la commune relève d'une catégorie de taille en écart avec
// la préférence. Le modèle nomme la catégorie, jamais « trop grand » ; pour l'isolement, jamais « isolée ».
function size(id: string, tier: MaterialityTier, topic: string, statement: string, cat: "metropole" | "village"): DecisionFact {
  return {
    id, ruleId: `territoire.taille-${id}`, sourceFactIds: ["territorySize.classification"], module: "territoire",
    topic, statement,
    materialityTier: tier, role: "mismatch", projectKey: id as never, headlineSubject: HEADLINE_SUBJECTS[id] ?? topic,
    basis: { kind: "categorical_state", observedCategory: cat, conventionId: "agglomeration-size-v1" },
    evidence: [{ factId: "territorySize.classification", module: "territoire", label: "Territoire", grain: "commune" }],
  } as DecisionFact;
}

const planSize = buildConclusionPlan({
  scope: "commune", communeNom: "Roubaix", conclusionState: "no_incompatibility_established", posture: "recherche",
  shownFacts: [
    size("eviter_grandes_villes", "structuring", "la taille du territoire",
      "Roubaix appartient à une métropole selon la population de son unité urbaine et la convention de taille utilisée par futur•e.", "metropole"),
  ],
  shownCompositions: [],
  uncovered: [], uncoveredPriorities: [], establishedIncompatibility: null, coverage: "high",
  orientation: "arbitration", hasFavorable: false, favorableCount: 0, majorReserveCount: 0, reservesShown: 0,
  mismatchTotal: 1, mismatchShown: 1,
});

// LE CAS RISQUÉ : le modèle ne doit PAS conclure « la commune est isolée » (généralisation interdite).
const planSizeIsolation = buildConclusionPlan({
  scope: "commune", communeNom: "Petiville", conclusionState: "no_incompatibility_established", posture: "recherche",
  shownFacts: [
    size("eviter_isolement", "structuring", "l'isolement du territoire",
      "Petiville est classée comme un village selon sa population communale. Cette petite taille répond moins bien à la priorité d'éviter l'isolement, sans permettre de conclure à son isolement effectif.", "village"),
  ],
  shownCompositions: [],
  uncovered: [], uncoveredPriorities: [], establishedIncompatibility: null, coverage: "high",
  orientation: "arbitration", hasFavorable: false, favorableCount: 0, majorReserveCount: 0, reservesShown: 0,
  mismatchTotal: 1, mismatchShown: 1,
});

// Cas ENSOLEILLEMENT (relative_position, lot 4a) : le modèle doit rester au PRÉSENT COMPARATIF, jamais une
// promesse future (« restera moins ensoleillée », « l'ensoleillement futur sera faible »).
const planSun = buildConclusionPlan({
  scope: "commune", communeNom: "Roubaix", conclusionState: "no_incompatibility_established", posture: "recherche",
  shownFacts: [ mismatch("ensoleillement_recherche", "structuring", "l'ensoleillement") ],
  shownCompositions: [],
  uncovered: [], uncoveredPriorities: [], establishedIncompatibility: null, coverage: "high",
  orientation: "arbitration", hasFavorable: false, favorableCount: 0, majorReserveCount: 0, reservesShown: 0,
  mismatchTotal: 1, mismatchShown: 1,
});

// Cas COMPOSITION (tradeoff saisonnier). Deux variantes : (A) la composition est l'unique réserve
// structurante -> lead single composé, PAS de bloc compositions_found (le modèle la nomme en lead) ;
// (B) une réserve structurante simple en plus -> lead tied + bloc compositions_found (le modèle
// articule le registre composé sans le solder en jugement global).
import type { FactComposition } from "../src/lib/decision/fact-composition.ts";

const tradeoffAntibes: FactComposition = {
  id: "06004:composition-climat-saisons", kind: "tradeoff", patternId: "seasonal_climate_tradeoff",
  title: "Des hivers doux, avec une exposition estivale à arbitrer",
  summary: "Les hivers d'Antibes comptent parmi les plus doux du pays, et l'exposition aux fortes chaleurs estivales y appelle un arbitrage.",
  favorableSide: { label: "Ce qui correspond", statement: "Les températures moyennes d'hiver figurent parmi les plus douces à l'échelle nationale.", evidence: [], ruleIds: ["territoire.mismatch-douceur_climat"], factIds: [] },
  unfavorableSide: { label: "Ce qui appelle un arbitrage", statement: "Les jours au-dessus de 35 °C augmentent nettement.", evidence: [], ruleIds: ["territoire.climat-chaleur"], factIds: ["06004:climat-chaleur"] },
  absorbedFactIds: ["06004:climat-chaleur"], referencedRuleIds: ["territoire.mismatch-douceur_climat", "territoire.climat-chaleur"],
  materialityTier: "structuring", displaySection: "compromises",
};

const planCompositionLead = buildConclusionPlan({
  scope: "commune", communeNom: "Antibes", conclusionState: "no_incompatibility_established", posture: "recherche",
  shownFacts: [verif("f9", "secondary", "le retrait-gonflement des argiles", "À cette adresse, le sol est exposé au retrait-gonflement des argiles.")],
  shownCompositions: [tradeoffAntibes],
  uncovered: [], uncoveredPriorities: [{ key: "qualite_air", label: "la qualité de l'air" }],
  establishedIncompatibility: null, coverage: "high", orientation: "minor_reserves",
  hasFavorable: true, favorableCount: 1, majorReserveCount: 1, reservesShown: 2,
  mismatchTotal: 0, mismatchShown: 0,
});

const planCompositionBloc = buildConclusionPlan({
  scope: "commune", communeNom: "Antibes", conclusionState: "no_incompatibility_established", posture: "recherche",
  shownFacts: [verif("f8", "structuring", "l'exposition d'Antibes à l'inondation", "L'exposition de la commune à l'inondation ressort élevée.")],
  shownCompositions: [tradeoffAntibes],
  uncovered: [], uncoveredPriorities: [],
  establishedIncompatibility: null, coverage: "high", orientation: "major_reserves",
  hasFavorable: true, favorableCount: 1, majorReserveCount: 2, reservesShown: 2,
  mismatchTotal: 0, mismatchShown: 0,
});

console.log("gate :", shouldGenerateNarrative(plan), "· lead :", JSON.stringify(plan.lead));
console.log("\n──── DÉTERMINISTE (ce que le lecteur voit sans IA) ────");
console.log(`HÉROS  ${plan.verdict.headline.text}  [${plan.verdict.headline.kind}, ${plan.verdict.headline.text.length}/${HEADLINE_MAX_CHARS}]`);
console.log(plan.blocks.map((b) => b.fallbackText).join(" "));

async function probe(plan: ReturnType<typeof buildConclusionPlan>, label: string): Promise<{ retenus: number; total: number }> {
const generables = plan.blocks.filter((b) => b.generable);
let retenus = 0;
console.log(`\n════════ PLAN : ${label} (${generables.length} blocs générables) ════════`);
// Le HÉROS n'est pas un bloc : il est déterministe et hors du chemin génératif. La sonde l'imprime
// quand même, sans quoi elle ne montrerait plus la tête de ce que le lecteur lit.
console.log(`HÉROS  ${plan.verdict.headline.text}  [${plan.verdict.headline.kind}, ${plan.verdict.headline.text.length}/${HEADLINE_MAX_CHARS}]`);
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
const dCoast = await probe(planCoast, "mer / éloignement");
const eSize = await probe(planSize, "taille / catégorie");
const fIso = await probe(planSizeIsolation, "taille / isolement (risqué)");
const gSun = await probe(planSun, "ensoleillement");
const hCompLead = await probe(planCompositionLead, "composition / lead tradeoff");
const iCompBloc = await probe(planCompositionBloc, "composition / registre composé");
const R = a.retenus + b.retenus + c.retenus + dCoast.retenus + eSize.retenus + fIso.retenus + gSun.retenus + hCompLead.retenus + iCompBloc.retenus,
      T = a.total + b.total + c.total + dCoast.total + eSize.total + fIso.total + gSun.total + hCompLead.total + iCompBloc.total;
console.log(`\n════ TAUX DE SURVIE : ${R}/${T} blocs ════`);
