// FUT-34 : le trait distinctif national (getCommuneDistinctive) produit par le VRAI moteur, sur des communes témoins.
// Lecture seule. Usage (racine du dépôt) : node scripts/fut34/traits-avant-apres.mjs
import { createJiti } from "jiti";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
const racine = process.cwd() + "/";
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const vie = await jiti.import(racine + "src/lib/comparateur-vie.ts");
const index = JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8")).communes;
const par = new Map(index.map((c) => [c.insee, c]));
const TEMOINS = [
  ["17094", "Châtelaillon-Plage (cas de référence)"], ["92044", "Levallois-Perret (très dense)"], ["28085", "Chartres (ville, plaine de Beauce)"],
  ["02100", "Bony (village agricole, Aisne)"], ["28199", "Janville-en-Beauce (village agricole)"], ["51454", "Reims (ville, plaine de Champagne)"], ["2B096", "Corte (très naturelle)"],
  ["05023", "Briançon (montagne)"], ["33063", "Bordeaux"],
];
for (const [insee, nom] of TEMOINS) {
  const c = par.get(insee);
  if (!c) { console.log(`${nom} : absente de l'index`); continue; }
  console.log(`${nom.padEnd(38)} → ${vie.getCommuneDistinctive(c) ?? "(aucun trait)"}`);
}
const tous = index.map((c) => vie.getCommuneDistinctive(c));
const urb = tous.filter((t) => t && /urbanisées/.test(t)).length;
console.log(`\nTraits « urbanisées » sur l'index : ${urb} communes ; communes sans trait : ${tous.filter((t) => t == null).length}`);
