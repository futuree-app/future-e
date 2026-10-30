// FUT-157 : rejoue les cas figés (`src/lib/__fixtures__/fut157/cas.json`) sans réseau et imprime leur lecture.
import fs from "node:fs";
const racine = process.cwd() + "/";
const S = await import(racine + "src/lib/sites-sols.ts");
const T = await import(racine + "src/lib/sites-sols-terrain.ts");
const { cas } = JSON.parse(fs.readFileSync(racine + "src/lib/__fixtures__/fut157/cas.json", "utf8"));
for (const c of cas) {
  const categories = Object.fromEntries(Object.entries(c.reponses).map(([k, p]) => [k, S.lireCategorieGeo(p, S.lotIncomplet(p, S.PAGES_MAX))]));
  const l = T.lireSitesSolsTerrain(c.entree, { categories, sansEmprise: c.sansEmprise });
  console.log(c.adresse.padEnd(55), T.etatSitesSols(l).padEnd(18), l.parcelle.statut.padEnd(10), l.fiches.map((f) => `${f.inventaire}:${f.situation}${f.part != null ? "@" + f.part : ""}`).join(" "));
}
