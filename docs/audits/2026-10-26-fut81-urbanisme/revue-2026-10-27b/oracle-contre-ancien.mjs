// L'oracle GEOS appliqué à l'aire d'intersection du SHA audité (e73ec075) : combien de cas il rejette.
import { readFileSync } from "node:fs";
const [ancien, oracle] = process.argv.slice(2);
const G = await import(ancien);
const O = JSON.parse(readFileSync(oracle, "utf8"));
const M = { lon0: 0, lat0: 0, kx: 1, ky: 1 };
const per = (r) => r.reduce((s, a) => s + a.slice(1).reduce((t, p, i) => t + Math.hypot(p[0] - a[i][0], p[1] - a[i][1]), 0), 0);
let total = 0, faux = 0;
const pires = [];
const parFamille = {};
for (const c of O.synthetiques) {
    if (c.famille === "invalide")
        continue;
    const a = G.regionDe(c.a, M), b = G.regionDe(c.b, M);
    const ab = G.aireIntersection(a, b), ba = G.aireIntersection(b, a);
    const e = 2 * (Math.SQRT2 / 2) * 1e-6 * (per(a) + per(b)) + 1e-12;
    const ko = Math.abs(ab - c.ab) > e || Math.abs(ba - c.ba) > e;
    total++;
    if (ko) {
        faux++;
        pires.push([Math.max(Math.abs(ab - c.ab), Math.abs(ba - c.ba)), c.nom, ab, c.ab]);
    }
    parFamille[c.famille] ??= [0, 0];
    parFamille[c.famille][0]++;
    if (ko)
        parFamille[c.famille][1]++;
}
pires.sort((x, y) => y[0] - x[0]);
console.log(JSON.stringify({ total, rejetes: faux, parFamille, pires: pires.slice(0, 8).map(([d, n, v, g]) => ({ cas: n, ecart: +d.toFixed(4), ancien: +v.toFixed(4), geos: +g.toFixed(4) })) }, null, 1));
