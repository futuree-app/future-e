// FUT-157 : le nettoyage des tracés change-t-il les surfaces ? Pour chaque périmètre publié : l'aire des lacets du
// tracé brut (les anneaux nuls y comptent pour zéro), l'aire après l'écart des anneaux d'aire nulle, l'aire de la
// réparation à la précision des coordonnées, et la superficie que publie la fiche (`superficie`, SIS et SUP).
// Usage : node scripts/fut157/surfaces.mjs <fichier.json> [...]
import { createJiti } from "jiti";
import fs from "node:fs";
const racine = process.cwd() + "/";
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const G = await jiti.import(racine + "src/lib/geometrie-parcelle.ts");
const T = await jiti.import(racine + "src/lib/sites-sols-terrain.ts");
const vus = new Set();
const lignes = [];
// L'aire des lacets d'un tracé, anneau par anneau (extérieur positif, trous négatifs), sans rien écarter.
function lacets(g, proj) {
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  let s = 0;
  for (const p of polys) p.forEach((a, i) => {
    const pts = a.map((c) => [(c[0] - proj.lon0) * proj.kx, (c[1] - proj.lat0) * proj.ky]);
    let x = 0; for (let k = 0; k + 1 < pts.length; k++) x += pts[k][0] * pts[k + 1][1] - pts[k + 1][0] * pts[k][1];
    s += (i === 0 ? 1 : -1) * Math.abs(x / 2);
  });
  return s;
}
const anneaux = (g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates).reduce((n, p) => n + p.length, 0);
for (const f of process.argv.slice(2)) {
  const inventaire = /sis/.test(f) ? "sis" : /sup/.test(f) ? "sup" : "instructions";
  for (const r of JSON.parse(fs.readFileSync(f, "utf8"))) {
    const g = r.geom;
    if (!g || !/Polygon/.test(g.type) || vus.has(r.identifiant_ssp)) continue;
    vus.add(r.identifiant_ssp);
    const proj = G.projectionPour(g, [0, 0]);
    const brut = G.regionDe(g, proj);
    const net = G.regionDe(T.sansAnneauxNuls(g, proj), proj);
    const lu = T.perimetreLisible ? T.perimetreLisible(g, proj) : null;
    lignes.push({
      id: r.identifiant_ssp, inventaire, nom: r.nom ?? r.nom_etablissement,
      anneauxNuls: anneaux(g) - anneaux(T.sansAnneauxNuls(g, proj)),
      lisibleBrut: !!brut && G.regionMesurable(brut), lisibleNet: !!net && G.regionMesurable(net),
      lacets: lacets(g, proj), net: net ? G.aireRegion(net) : null,
      lu: lu ? { aire: G.aireRegion(lu.region), reparation: lu.reparationM2 } : null,
      superficie: r.superficie != null ? Number(r.superficie) : null,
    });
  }
}
console.log(JSON.stringify(lignes));
