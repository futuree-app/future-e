// FUT-157 : combien de périmètres publiés se mesurent : bruts, après l'écart des anneaux d'aire nulle, puis après la
// réparation à la précision des coordonnées (`perimetreLisible`), avec la surface que chaque réparation déplace.
// Usage : node scripts/fut157/lisibilite.mjs <fichier.json> [...] (lignes brutes de l'API, champ `geom`)
import { createJiti } from "jiti";
import fs from "node:fs";
const racine = process.cwd() + "/";
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const G = await jiti.import(racine + "src/lib/geometrie-parcelle.ts");
const T = await jiti.import(racine + "src/lib/sites-sols-terrain.ts");
const vus = new Set();
const n = { polygones: 0, avant: 0, apres: 0, lisibles: 0, illisibles: [], repares: [] };
for (const f of process.argv.slice(2)) {
  for (const r of JSON.parse(fs.readFileSync(f, "utf8"))) {
    const g = r.geom;
    if (!g || !/Polygon/.test(g.type) || vus.has(r.identifiant_ssp)) continue;
    vus.add(r.identifiant_ssp); n.polygones++;
    const proj = G.projectionPour(g, [0, 0]);
    const ok = (x) => { const reg = G.regionDe(x, proj); return !!reg && G.aireRegion(reg) > 0 && G.regionMesurable(reg); };
    if (ok(g)) n.avant++;
    if (ok(T.sansAnneauxNuls(g, proj))) n.apres++;
    const lu = T.perimetreLisible(g, proj);
    if (lu) n.lisibles++; else n.illisibles.push(`${r.identifiant_ssp} ${r.nom ?? r.nom_etablissement}`);
    if (lu && lu.reparationM2 > 0) n.repares.push(`${r.identifiant_ssp} ${r.nom ?? r.nom_etablissement} : ${lu.reparationM2.toFixed(4)} m²`);
  }
}
console.log(JSON.stringify(n, null, 1));
