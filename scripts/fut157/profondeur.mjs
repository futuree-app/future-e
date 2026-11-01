// FUT-157 : DE COMBIEN UN PÉRIMÈTRE ENTRE-T-IL DANS UNE PARCELLE ? Relit le cache de `parcelles-officielles.mjs`
// (aucun appel réseau) et mesure, pour chaque parcelle recoupée, la PROFONDEUR du recoupement : la plus grande
// tolérance e (en mètres) pour laquelle le périmètre, rétréci de e, recoupe encore la parcelle. Un liseré de tracé
// a une profondeur de quelques décimètres quelle que soit son aire ; une vraie emprise, de plusieurs mètres.
//
// Usage : node scripts/fut157/profondeur.mjs <dossier-cache> <fichier.json> [...] > profondeur.jsonl
import { createJiti } from "jiti";
import fs from "node:fs";
import path from "node:path";

const racine = process.cwd() + "/";
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const G = await jiti.import(racine + "src/lib/geometrie-parcelle.ts");
const T = await jiti.import(racine + "src/lib/sites-sols-terrain.ts");
const ClipperLib = (await import("clipper-lib")).default;

const [cache, ...fichiers] = process.argv.slice(2);
const M = 1e-6;
const chemins = (r) => r.map((a) => a.slice(0, -1).map(([x, y]) => ({ X: Math.round(x / M), Y: Math.round(y / M) })));
const versRegion = (ps) => ps.map((p) => { const a = p.map((q) => [q.X * M, q.Y * M]); a.push(a[0]); return a; });

function eroder(region, e) {
  const co = new ClipperLib.ClipperOffset(2, 0.005 / M);
  co.AddPaths(chemins(region), ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);
  const sortie = new ClipperLib.Paths();
  co.Execute(sortie, -e / M);
  return versRegion(sortie);
}

const PALIERS = [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 5, 10, 20];
const fiches = new Map();
for (const f of fichiers) {
  const inventaire = /sis/.test(f) ? "sis" : /sup/.test(f) ? "sup" : "instructions";
  for (const r of JSON.parse(fs.readFileSync(f, "utf8"))) {
    if (!r.geom || !/Polygon/.test(r.geom.type) || fiches.has(r.identifiant_ssp)) continue;
    fiches.set(r.identifiant_ssp, { inventaire, r });
  }
}
const mesure = new Map();
for (const l of fs.readFileSync(path.join(cache, "mesure.jsonl"), "utf8").split("\n").filter(Boolean)) {
  const x = JSON.parse(l);
  if (x.parcelle) mesure.set(`${x.id}|${x.parcelle}`, x);
}

for (const [id, { inventaire, r }] of fiches) {
  const pages = fs.readdirSync(path.join(cache, "cadastre")).filter((f) => f.startsWith(id + "-"));
  if (pages.length === 0) continue;
  const parcelles = pages.flatMap((p) => JSON.parse(fs.readFileSync(path.join(cache, "cadastre", p), "utf8")).features ?? []);
  const xs = [], ys = [];
  const v = (c) => { if (Array.isArray(c) && typeof c[0] === "number") { xs.push(c[0]); ys.push(c[1]); } else if (Array.isArray(c)) c.forEach(v); };
  v(r.geom.coordinates);
  const proj = G.projectionAutour((Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2);
  const lu = T.perimetreLisible(r.geom, proj);
  if (!lu) continue;
  const perimetre = lu.region;
  const erodes = new Map(PALIERS.map((e) => [e, eroder(perimetre, e)]));
  for (const p of parcelles) {
    const m0 = mesure.get(`${id}|${p.properties.idu}`) ?? { nom: r.nom ?? r.nom_etablissement, listee: false, declarees: null };
    const reg = G.regionDe(p.geometry, proj);
    if (!reg) continue;
    const aireP = G.aireRegion(reg);
    const aire = m0.aire ?? G.aireIntersection(reg, perimetre);
    const m = { ...m0, aire, aireParcelle: m0.aireParcelle ?? aireP, part: m0.part ?? (aire != null ? aire / aireP : null) };
    if (m.aire == null || m.aire < 0.05) continue;
    let profondeur = 0;
    for (const e of PALIERS) {
      const er = erodes.get(e);
      const a = er.length ? G.aireIntersection(reg, er) : 0;
      if (a != null && a > 0.01) profondeur = e; else break;
    }
    process.stdout.write(JSON.stringify({ id, inventaire, nom: m.nom, parcelle: p.properties.idu, listee: m.listee, declarees: m.declarees, aire: m.aire, part: m.part, aireParcelle: m.aireParcelle, profondeur }) + "\n");
  }
}
