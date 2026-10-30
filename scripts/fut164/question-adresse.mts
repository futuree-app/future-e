// FUT-164 · Essai réel : l'assistant, avec la lecture eau par réseau de Marseille (fixture réelle du 30/10/2026),
// face à une question sur l'eau d'une adresse précise. Même modèle et même prompt système que la route ; la
// réponse est demandée en texte libre (la route impose un outil de réponse structurée, sans effet sur le fond).
// Usage : node --env-file=.env.local scripts/fut164/question-adresse.mts
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "node:fs";
import { construireSystemPrompt, construireReferentiel } from "../../src/lib/ask/system-prompt.ts";

const F = JSON.parse(readFileSync("src/lib/__fixtures__/fut164/eau-potable-communes.json", "utf8"));
const enrichment = {
  ademe: null, drias: null, eau: null, vigieau: null, georisques: null, catnat: null, littoral: null, baignade: null,
  indisponibles: { georisques: false, catnat: false }, eauPotable: F["13055"].lu,
};
const system = construireSystemPrompt({
  communeName: "Marseille", communeInsee: "13055",
  referentiel: construireReferentiel({ insee: "13055", nomCommune: "Marseille", categories: [] }),
  enrichment, profile: null,
});
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
for (const question of [
  "L'eau du robinet de mon futur appartement, 40 rue Paradis dans le 6e, est-elle bonne ?",
  "L'eau potable est-elle conforme à Marseille ?",
]) {
  const r = await client.messages.create({
    model: "claude-sonnet-4-6", max_tokens: 900, output_config: { effort: "medium" }, thinking: { type: "disabled" },
    system, messages: [{ role: "user", content: question }],
  } as never);
  const texte = (r as { content: { type: string; text?: string }[] }).content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
  console.log(`\n### ${question}\n\n${texte}`);
}
