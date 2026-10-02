// FUT-33 (2B.2, A) : passe de VRAIES phrases dans le VRAI prompt du parseur (même modèle, mêmes réglages
// que src/app/api/comparateur-vie/parse/route.ts), puis dans l'assainissement. Hors produit, hors CI.
// Usage : node scripts/mer/sonder-parseur.mts <fichier .env contenant ANTHROPIC_API_KEY> > sortie.json
import { readFileSync } from "node:fs";
import { ANCHOR_ZONE_TOKENS, EXCLUSION_ZONE_TOKENS } from "../../src/lib/geo-zones.ts";
import { assainirParsed } from "../../src/lib/parse-assainir.ts";

const route = readFileSync("src/app/api/comparateur-vie/parse/route.ts", "utf8").split("\n");
const vie = readFileSync("src/lib/comparateur-vie.ts", "utf8");
const debutPref = vie.indexOf("export const PREFERENCE_KEYS = [");
const PREFERENCE_KEYS = new Function(`return ${vie.slice(vie.indexOf("[", debutPref), vie.indexOf("] as const;", debutPref) + 1)};`)() as string[];
const schemaTxt = route.slice(28, 247).join("\n").replace(/^const TOOL_INPUT_SCHEMA = /, "").replace(/ as const/g, "").replace(/;\s*$/, "");
const TOOL_INPUT_SCHEMA = new Function("PREFERENCE_KEYS", "ANCHOR_ZONE_TOKENS", "EXCLUSION_ZONE_TOKENS", `return (${schemaTxt});`)(PREFERENCE_KEYS, ANCHOR_ZONE_TOKENS, EXCLUSION_ZONE_TOKENS);
const brut = route.join("\n");
const debutSys = brut.indexOf("const SYSTEM = `") + "const SYSTEM = `".length;
const SYSTEM = brut.slice(debutSys, brut.indexOf("`;", debutSys));
const cle = readFileSync(process.argv[2], "utf8").match(/^ANTHROPIC_API_KEY=["']?([^"'\n]+)/m)?.[1];
if (!cle) throw new Error("ANTHROPIC_API_KEY introuvable");

const PHRASES = [
  "Je ne veux pas vivre sur le littoral, une petite ville calme.",
  "Hors littoral, avec une gare.",
  "Pas une commune littorale s'il vous plaît.",
  "Je veux être à au moins 30 km de la mer.",
  "Pas à moins de 20 km de la côte, une ville moyenne.",
  "On veut vivre loin de la mer.",
  "Plutôt dans les terres, au calme.",
  "Je n'aime pas la mer, je préfère la campagne.",
  "Je veux être proche de la mer.",
  "Il nous faut absolument la mer, à moins de 10 km.",
  "Pas forcément près de la mer, mais pas trop chaud.",
  "Surtout pas au bord de la mer.",
  "Pas sur le littoral, et au moins 20 km de la mer.",
  "Je ne veux pas être près de la mer.",
  "Une ville comme Brest mais loin de la mer.",
];

const sortie = [];
for (const texte of PHRASES) {
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
  if (!bloc) { sortie.push({ texte, erreur: JSON.stringify(j).slice(0, 300) }); continue; }
  const p = assainirParsed(bloc.input, texte);
  const hc = p.hardConstraints ?? {};
  sortie.push({
    texte,
    nearSea: hc.nearSea ?? null, excludeSea: hc.excludeSea ?? null, farFromSea: hc.farFromSea ?? null,
    proximite_mer: (p.preferences ?? []).find((x) => x.key === "proximite_mer")?.weight ?? null,
    communeAncre: p.communeAncre ?? null,
  });
}
console.log(JSON.stringify(sortie, null, 1));
