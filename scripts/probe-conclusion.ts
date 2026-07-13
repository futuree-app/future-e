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

function verif(id: string, tier: MaterialityTier, statement: string): DecisionFact {
  return {
    id, ruleId: `r-${id}`, sourceFactIds: [], module: "logement", statement,
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
  conclusionState: "no_incompatibility_established",
  posture: "recherche",
  shownFacts: [
    verif("f1", "decision_critical", "Le logement porte une étiquette énergétique F"),
    verif("f2", "structuring", "Le sol de la parcelle est argileux, avec un aléa fort"),
    verif("f3", "secondary", "L'adresse est dans un périmètre de protection du patrimoine"),
    verif("f4", "secondary", "La commune a connu des arrêtés de catastrophe naturelle"),
  ],
  uncovered: [{ key: "nearSea", label: "la proximité de la mer" }],
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
});

console.log("gate :", shouldGenerateNarrative(plan), "· lead :", JSON.stringify(plan.lead));
console.log("\n──── DÉTERMINISTE (ce que le lecteur voit sans IA) ────");
console.log(plan.blocks.map((b) => b.fallbackText).join(" "));

const generables = plan.blocks.filter((b) => b.generable);
let retenus = 0;

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

console.log(`\n════ TAUX DE SURVIE : ${retenus}/${TIRAGES * generables.length} blocs ════`);
