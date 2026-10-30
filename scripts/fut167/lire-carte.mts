// FUT-167 · Recette : la carte « Santé environnementale » telle que la page la construit, sur des communes réelles
// (index national, sites Seveso, radon Géorisques en direct). Usage : node scripts/fut167/lire-carte.mts [insee…]
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
const { getSanteEnvironnementale } = await import(`${racine}src/lib/server/sante-environnementale.ts`);
const NOMS: Record<string, string> = { "59350": "Lille", "69276": "Feyzin", "13039": "Fos-sur-Mer", "75056": "Paris", "69123": "Lyon", "16016": "Commune 16016", "64300": "Lacq", "17300": "La Rochelle", "01001": "L'Abergement-Clémenciat" };
for (const insee of process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(NOMS)) {
  const c = await getSanteEnvironnementale(insee, NOMS[insee] ?? insee, { adresseConnue: false });
  console.log(`\n══ ${insee} ${NOMS[insee] ?? ""}`);
  if (!c) { console.log("(pas de carte)"); continue; }
  console.log(`FACE : ${c.face.valeur} | ${c.face.sous}${c.manquante ? " | MANQUANTE" : ""}`);
  for (const l of c.lignes) {
    console.log(`- ${l.libelle}${l.signal ? " [À VÉRIFIER]" : ""} : ${l.valeur}  (${l.grain})`);
    for (const p of l.paragraphes) console.log(`    · ${p}`);
  }
}
