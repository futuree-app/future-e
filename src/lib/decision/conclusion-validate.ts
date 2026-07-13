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

// AUCUN NOMBRE FAUX. C'est l'invariant, et il est plus juste que « aucun nombre absent du repli » :
// « Deux de vos priorités » est exact et bien écrit quand il y en a deux, et le rejeter censurerait
// une tournure française naturelle. Les nombres autorisés d'un bloc sont donc ceux de son repli PLUS
// ceux que le déterministe déclare vrais (`allowedNumbers`, en chiffres et en lettres). Tout autre
// nombre, chiffre, pourcentage, année ou horizon est une invention, et le bloc retombe sur son repli.
//
// Les nombres écrits EN TOUTES LETTRES comptent : sans cela, un « Trois points » inventé passerait
// sous le radar d'un contrôle qui ne regarde que les chiffres. « un »/« une » sont exclus de la
// détection : ce sont d'abord des articles, et les traiter en nombres censurerait des phrases fidèles.
const WORD_NUMBERS = [
  "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
  "onze", "douze", "vingt", "trente", "cent", "mille",
];

function numbersIn(text: string): string[] {
  const lower = text.toLowerCase();
  const digits = text.match(/\d+([.,]\d+)?/g) ?? [];
  const words = WORD_NUMBERS.filter((w) => new RegExp(`\\b${w}\\b`).test(lower));
  return [...digits, ...words];
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

    const allowed = new Set([...numbersIn(b.fallbackText), ...b.allowedNumbers]);
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
