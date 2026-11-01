// FUT-157 : diagnostic d'une géométrie publiée (lisible, mesurable, partie par partie). Usage : node scripts/fut157/diag-geom.mjs <fichier.json> <identifiant_ssp>
import { createJiti } from "jiti";
import fs from "node:fs";
const racine = process.cwd() + "/";
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const G = await jiti.import(racine + "src/lib/geometrie-parcelle.ts");
const [fichier, id] = process.argv.slice(2);
const r = JSON.parse(fs.readFileSync(fichier, "utf8")).find((x) => x.identifiant_ssp === id);
const g = r.geom;
const proj = G.projectionPour(g, [0, 0]);
console.log("type", g.type, "polygones", g.coordinates.length, "anneaux", g.coordinates.map((p) => p.length), "sommets", g.coordinates.map((p) => p.map((a) => a.length)));
const reg = G.regionDe(g, proj);
console.log("region", !!reg, reg && G.aireRegion(reg), reg && G.regionMesurable(reg));
g.coordinates.forEach((p, i) => { const rr = G.regionDe({ type: "Polygon", coordinates: p }, proj); console.log(" part", i, !!rr, rr && G.aireRegion(rr).toFixed(1), rr && G.regionMesurable(rr)); });
