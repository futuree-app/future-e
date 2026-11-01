// FUT-157 : où un périmètre illisible se croise-t-il ? Liste les arêtes qui se coupent (hors arêtes voisines),
// et l'écart entre l'aire des lacets et l'aire couverte (union Clipper), partie par partie.
// Usage : node scripts/fut157/croisements.mjs <fichier.json> <identifiant_ssp>
import { createJiti } from "jiti";
import fs from "node:fs";
const racine = process.cwd() + "/";
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const G = await jiti.import(racine + "src/lib/geometrie-parcelle.ts");
const ClipperLib = (await import("clipper-lib")).default;
const [fichier, id] = process.argv.slice(2);
const r = JSON.parse(fs.readFileSync(fichier, "utf8")).find((x) => x.identifiant_ssp === id);
const proj = G.projectionPour(r.geom, [0, 0]);
const coupe = (a, b, c, d) => {
  const o = (p, q, s) => Math.sign((q[0] - p[0]) * (s[1] - p[1]) - (q[1] - p[1]) * (s[0] - p[0]));
  return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
};
r.geom.coordinates.forEach((poly, i) => {
  const reg = G.regionDe({ type: "Polygon", coordinates: poly }, proj);
  const lacets = G.aireRegion(reg);
  const c = new ClipperLib.Clipper();
  c.AddPaths(reg.map((a) => a.slice(0, -1).map(([x, y]) => ({ X: Math.round(x * 1e6), Y: Math.round(y * 1e6) }))), ClipperLib.PolyType.ptSubject, true);
  const out = []; c.Execute(ClipperLib.ClipType.ctUnion, out, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
  const union = Math.abs(out.reduce((s, p) => s + ClipperLib.Clipper.Area(p), 0)) * 1e-12;
  const aretes = reg.flatMap((a, k) => a.slice(0, -1).map((p, j) => ({ k, j, p, q: a[j + 1], n: a.length - 1 })));
  const x = [];
  for (let u = 0; u < aretes.length; u++) for (let v = u + 1; v < aretes.length; v++) {
    const A = aretes[u], B = aretes[v];
    if (A.k === B.k && (Math.abs(A.j - B.j) <= 1 || Math.abs(A.j - B.j) === A.n - 1)) continue;
    if (coupe(A.p, A.q, B.p, B.q)) x.push(`anneau ${A.k} arête ${A.j} × anneau ${B.k} arête ${B.j} à [${poly[A.k][A.j].map((t) => t.toFixed(6))}]`);
  }
  console.log(`partie ${i} : lacets ${lacets.toFixed(2)} m², union ${union.toFixed(2)} m², écart ${(union - lacets).toFixed(5)} m², ${x.length} croisement(s)`);
  x.slice(0, 6).forEach((s) => console.log("   " + s));
});
