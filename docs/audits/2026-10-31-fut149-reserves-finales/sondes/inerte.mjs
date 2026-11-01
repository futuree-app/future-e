// FUT-149, 31/10/2026 · § 5 : SANS `DEBROUSSAILLEMENT_BUCKET`, AUCUN APPEL RÉSEAU, AUCUN CHAMP. Contre-épreuve
// d'exécution, indépendante des tests de la PR : le `fetch` GLOBAL est remplacé par un espion, l'environnement est
// celui du processus (toutes les autres variables Supabase présentes, factices), et le lecteur est appelé avec ses
// paramètres PAR DÉFAUT, comme le font la route Logement et l'assembleur Autour.
//   node inerte.mjs <worktree>
import { register } from "node:module";
import { pathToFileURL } from "node:url";
const [W] = process.argv.slice(2);
const racine = pathToFileURL(`${W}/`).href;
register(`data:text/javascript,${encodeURIComponent(`export async function resolve(s, c, n) {
  if (s === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (s.startsWith("@/")) return n(${JSON.stringify(racine)} + "src/" + s.slice(2) + ".ts", c);
  return n(s, c);
}`)}`);
delete process.env.DEBROUSSAILLEMENT_BUCKET;
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://exemple.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "cle-factice";
const appels = [];
globalThis.fetch = async (u) => { appels.push(String(u)); return new Response("{}"); };
const { lireDebroussaillementAdresse } = await import(`${W}/src/lib/server/debroussaillement-tuiles.ts`);
const entrees = [
  { point: [5.04, 43.44], geocodage: "housenumber", insee: "13092", parcelle: null }, // Logement
  { point: [5.04, 43.44], geocodage: null, insee: "13092", parcelle: null }, // Autour
];
const lectures = [];
for (const e of entrees) lectures.push(await lireDebroussaillementAdresse(e));
// Ce que la route Logement écrit dans le rapport (même expression que `route.ts`).
const rapport = { autre: 1, ...(lectures[0] ? { debroussaillement: lectures[0] } : {}) };
// Ce que l'assembleur Autour renvoie (même expression que `autour-response.ts`, réponse non persistée).
const autour = { debroussaillement: lectures[1] ?? null };
console.log(JSON.stringify({ lectures, appelsReseau: appels.length, clesDuRapport: Object.keys(rapport), reponseAutour: autour }));
process.exit(appels.length === 0 && lectures.every((l) => l === undefined) && !("debroussaillement" in rapport) ? 0 : 1);
