// Pour chaque surface réelle des relevés : l'aire rendue au SHA audité (e73ec075), l'aire rendue
// après correction, et l'aire GEOS dans une projection équivalente de Lambert (indépendante des deux).
// Usage : node reels-avant-apres.mts <src du SHA audité> <racine du dépôt corrigé>
import { readFileSync } from "node:fs";
const [ancien, racine] = process.argv.slice(2);
const A = await import(`${ancien}/src/lib/geometrie-parcelle.ts`);
const N = await import(`${racine}/src/lib/geometrie-parcelle.ts`);
const O = JSON.parse(readFileSync(`${racine}/src/lib/__fixtures__/fut81/oracle-geos.json`, "utf8"));
const lignes = [];
for (const r of O.reels) {
    if (!(r.aireEquivalente > 0.05))
        continue;
    const x = JSON.parse(readFileSync(`${racine}/src/lib/__fixtures__/fut81/${r.cas}.json`, "utf8"));
    const g = x[r.couche].features[r.indice].geometry;
    const mesure = (M) => { const p = M.projectionPour(x.parcelle.geometry, [x.ban.lon, x.ban.lat]); return M.aireIntersection(M.regionDe(x.parcelle.geometry, p), M.regionDe(g, p)); };
    const av = mesure(A), ap = mesure(N);
    lignes.push({ cas: r.cas, couche: r.couche, libelle: r.libelle, avant: +av.toFixed(2), apres: +ap.toFixed(2), geosLambert: +r.aireEquivalente.toFixed(2),
        ecartAvantPct: +((av / r.aireEquivalente - 1) * 100).toFixed(2), ecartApresPct: +((ap / r.aireEquivalente - 1) * 100).toFixed(3) });
}
console.log(JSON.stringify(lignes, null, 1));
