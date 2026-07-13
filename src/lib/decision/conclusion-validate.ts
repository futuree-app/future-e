// Le VRAI contrat de la sortie du modèle. Fonction PURE, testée sans LLM.
//
// Elle prend des `unknown[]` : le schéma zod passé à generateObject est { blocks: z.array(z.unknown()) },
// volontairement permissif. Un schéma qui exigerait { key, text } sur chaque élément ferait échouer
// l'objet ENTIER dès qu'UN élément est malformé, ce qui tuerait la récupération bloc par bloc.
//
// Ce que le modèle ne peut pas faire, et que ce code VÉRIFIE plutôt que d'espérer du prompt :
//   - toucher au VERDICT (generable: false) : la phrase qui peut renverser une décision perçue ;
//   - faire disparaître une matière DANS un bloc (requiredPhrases) : deux contraintes non examinées
//     ne deviennent pas « une condition importante » ;
//   - introduire un chiffre, une année, un horizon absent du texte de repli de son bloc ;
//   - fabriquer une provenance : il ne renvoie que { key, text }, les sourceIds viennent du plan.
import { z } from "zod";
import type { ConclusionNarrativePlan, BlockKey } from "./conclusion-plan.ts";

export type GeneratedBlock = { key: string; text: string };
export type RenderedBlock = { key: BlockKey; text: string; sourceIds: string[]; generated: boolean };
export type RejectionReason =
  | "missing" | "unknown_key" | "not_generable" | "duplicate_key" | "invalid_shape"
  | "empty" | "too_long" | "unauthorized_number" | "missing_required_phrase";
export type ValidationResult = {
  blocks: RenderedBlock[];
  rejected: { key: string; reason: RejectionReason }[];
};

const generatedBlockSchema = z.object({ key: z.string(), text: z.string() });

// Tout nombre, pourcentage, année ou horizon d'un texte généré doit déjà figurer dans le fallbackText
// de SON bloc. Contrôle grossier, qui attrape une grande part des hallucinations factuelles sans
// prétendre valider le sens (ce qui serait hors de portée).
function numbersIn(text: string): string[] {
  return text.match(/\d+([.,]\d+)?/g) ?? [];
}

export function validateGeneratedBlocks(
  plan: ConclusionNarrativePlan,
  raw: unknown[],
): ValidationResult {
  const rejected: ValidationResult["rejected"] = [];
  const knownKeys = new Set<string>(plan.blocks.map((b) => b.key));
  const generableKeys = new Set<string>(plan.blocks.filter((b) => b.generable).map((b) => b.key));

  // Première occurrence gagnante : un doublon de clé est un rejet, pas un écrasement.
  const byKey = new Map<string, string>();
  for (const item of raw) {
    const parsed = generatedBlockSchema.safeParse(item);
    if (!parsed.success) {
      const k = (item as { key?: unknown })?.key;
      rejected.push({ key: typeof k === "string" ? k : "?", reason: "invalid_shape" });
      continue;
    }
    const { key, text } = parsed.data;
    if (!knownKeys.has(key)) { rejected.push({ key, reason: "unknown_key" }); continue; }
    if (!generableKeys.has(key)) { rejected.push({ key, reason: "not_generable" }); continue; }
    if (byKey.has(key)) { rejected.push({ key, reason: "duplicate_key" }); continue; }
    byKey.set(key, text);
  }

  // L'ORDRE DU RENDU EST CELUI DU PLAN. L'ordre de réponse du modèle est ignoré.
  const blocks = plan.blocks.map((b): RenderedBlock => {
    const fallback = { key: b.key, text: b.fallbackText, sourceIds: b.sourceIds, generated: false };
    if (!b.generable) return fallback; // le verdict : jamais généré, jamais « manquant »

    const text = byKey.get(b.key);
    if (text === undefined) { rejected.push({ key: b.key, reason: "missing" }); return fallback; }

    const trimmed = text.trim();
    if (trimmed.length === 0) { rejected.push({ key: b.key, reason: "empty" }); return fallback; }
    if (trimmed.length > b.maxChars) { rejected.push({ key: b.key, reason: "too_long" }); return fallback; }

    const allowed = new Set(numbersIn(b.fallbackText));
    if (numbersIn(trimmed).some((n) => !allowed.has(n))) {
      rejected.push({ key: b.key, reason: "unauthorized_number" });
      return fallback;
    }
    if (b.requiredPhrases.some((p) => !trimmed.includes(p))) {
      rejected.push({ key: b.key, reason: "missing_required_phrase" });
      return fallback;
    }
    return { key: b.key, text: trimmed, sourceIds: b.sourceIds, generated: true };
  });

  return { blocks, rejected };
}
