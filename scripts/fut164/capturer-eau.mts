// FUT-164 · Relève la lecture eau potable RÉELLE (Hub'Eau, par réseau) de quelques communes, pour les tests de
// l'assistant. Même code que la production (`server/eau-potable.ts`), seul le chargeur de modules diffère.
// Usage : node scripts/fut164/capturer-eau.mts
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";

const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (spec.startsWith("@/")) return next(${JSON.stringify(racine)} + "src/" + spec.slice(2) + ".ts", ctx);
  return next(spec, ctx);
}`;
register(`data:text/javascript,${encodeURIComponent(hook)}`);
const { getEauPotableCommune } = await import(`${racine}src/lib/server/eau-potable.ts`);

const COMMUNES: Record<string, string> = { "75056": "Paris", "13055": "Marseille", "57463": "Metz", "01001": "L'Abergement-Clémenciat" };
const sortie: Record<string, unknown> = { _source: `getEauPotableCommune, Hub'Eau en direct, relevé le ${new Date().toISOString()}` };
for (const [insee, nom] of Object.entries(COMMUNES)) {
  const lu = await getEauPotableCommune(insee);
  sortie[insee] = { nom, lu };
  console.log(insee, nom, lu.etat, "reseaux" in lu ? lu.reseaux.length : "");
}
writeFileSync("src/lib/__fixtures__/fut164/eau-potable-communes.json", JSON.stringify(sortie, null, 1) + "\n");
