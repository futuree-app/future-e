// FUT-33 (2B.2) : le VRAI prompt du parseur (src/app/api/comparateur-vie/parse/route.ts), même modèle et mêmes
// réglages, appelable hors du site. Études seulement, hors produit, hors CI.
import { readFileSync } from "node:fs";
import { ANCHOR_ZONE_TOKENS, EXCLUSION_ZONE_TOKENS } from "../../src/lib/geo-zones.ts";
import { assainirParsed } from "../../src/lib/parse-assainir.ts";
import type { ParsedProject } from "../../src/lib/comparateur-vie.ts";

const route = readFileSync("src/app/api/comparateur-vie/parse/route.ts", "utf8").split("\n");
const vie = readFileSync("src/lib/comparateur-vie.ts", "utf8");
const debutPref = vie.indexOf("export const PREFERENCE_KEYS = [");
const PREFERENCE_KEYS = new Function(`return ${vie.slice(vie.indexOf("[", debutPref), vie.indexOf("] as const;", debutPref) + 1)};`)() as string[];
const schemaTxt = route.slice(28, 247).join("\n").replace(/^const TOOL_INPUT_SCHEMA = /, "").replace(/ as const/g, "").replace(/;\s*$/, "");
const TOOL_INPUT_SCHEMA = new Function("PREFERENCE_KEYS", "ANCHOR_ZONE_TOKENS", "EXCLUSION_ZONE_TOKENS", `return (${schemaTxt});`)(PREFERENCE_KEYS, ANCHOR_ZONE_TOKENS, EXCLUSION_ZONE_TOKENS);
const brut = route.join("\n");
const debutSys = brut.indexOf("const SYSTEM = `") + "const SYSTEM = `".length;
const SYSTEM = brut.slice(debutSys, brut.indexOf("`;", debutSys));
const cleDe = (envFile: string) => readFileSync(envFile, "utf8").match(/^ANTHROPIC_API_KEY=["']?([^"'\n]+)/m)?.[1];


/** Le projet structuré et assaini, exactement comme la route le produit avant la dérivation d'ancre. */
export async function parserReel(texte: string, envFile: string): Promise<ParsedProject> {
  const cle = cleDe(envFile);
  if (!cle) throw new Error("ANTHROPIC_API_KEY introuvable");
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": cle, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6", max_tokens: 800, output_config: { effort: "low" }, thinking: { type: "disabled" },
      system: SYSTEM, tools: [{ name: "projet_structure", description: "Renvoie la structure du projet de vie (contraintes dures + préférences pondérées).", input_schema: TOOL_INPUT_SCHEMA }],
      tool_choice: { type: "tool", name: "projet_structure" }, messages: [{ role: "user", content: texte }],
    }),
  });
  const j = await r.json();
  const bloc = j.content?.find((b: { type: string }) => b.type === "tool_use");
  if (!bloc) throw new Error(JSON.stringify(j).slice(0, 300));
  return assainirParsed(bloc.input, texte);
}
