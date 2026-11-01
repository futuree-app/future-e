// FUT-167 (D2) · Recette : les risques industriels à des adresses réelles, géocodées par la Base adresse nationale,
// avec la même lecture que la route Logement (index Seveso local, PPRT au point et sur la commune, Géorisques).
// Usage : node --env-file=.env.local scripts/fut167/lire-adresse.mts ["adresse"…]
import { register } from "node:module";
import { pathToFileURL } from "node:url";
const racine = pathToFileURL(`${process.cwd()}/`).href;
register(`data:text/javascript,${encodeURIComponent(`
async function premier(c, ctx, next) { for (const x of c.slice(0, -1)) { try { return await next(x, ctx); } catch {} } return next(c[c.length - 1], ctx); }
export async function resolve(s, ctx, next) {
  if (s === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (s.startsWith("@/")) { const b = ${JSON.stringify(racine)} + "src/" + s.slice(2); return premier([b + ".ts", b + ".tsx", b], ctx, next); }
  if ((s.startsWith("./") || s.startsWith("../")) && !/\\.[cm]?[jt]sx?$|\\.json$/.test(s)) return premier([s + ".ts", s + ".tsx", s], ctx, next);
  return next(s, ctx);
}`)}`);
const { getIndustrieAdresse } = await import(`${racine}src/lib/server/industrie-adresse.ts`);
const { texteIndustrieAdresse, precisionDuPoint } = await import(`${racine}src/lib/industrie-adresse.ts`);
const ADRESSES = process.argv.slice(2).length ? process.argv.slice(2) : [
  "12 rue Paul Bert 69320 Feyzin", "1 avenue Albert Ramboz 69320 Feyzin", "10 rue de la République 69002 Lyon",
  "5 rue du Port 17000 La Rochelle", "Place de la Mairie 13270 Fos-sur-Mer", "1 rue de Rivoli 75001 Paris", "Le Bourg 16200 Bourg-Charente",
];
for (const q of ADRESSES) {
  const g = await (await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=1`)).json();
  const f = g.features?.[0];
  if (!f) { console.log(`\n══ ${q} : non géocodée`); continue; }
  const [lon, lat] = f.geometry.coordinates;
  const l = await getIndustrieAdresse({ lat, lon, citycode: f.properties.citycode, precision: precisionDuPoint(f.properties.type) });
  const t = texteIndustrieAdresse(l, new Date().toISOString());
  console.log(`\n══ ${q} → ${f.properties.label} (${f.properties.type}, ${lat.toFixed(5)}, ${lon.toFixed(5)})`);
  console.log(`RÉPONSE : ${t.reponse}\n  ${t.constat}`);
  for (const p of t.pourCeBien) console.log(`  · ${p}`);
  console.log(`  ${t.sites.titre}${t.sites.vide ? ` : ${t.sites.vide}` : ""}`);
  for (const x of t.sites.lignes) console.log(`    - ${x.texte}`);
  if (t.sites.reste) console.log(`    ${t.sites.reste}`);
  console.log(`  Vérifier : ${t.verifier.length} geste(s)`);
}
