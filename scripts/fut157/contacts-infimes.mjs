// FUT-157, contre-revue du 31/10/2026 : LES INTERSECTIONS INFIMES FACE AUX LISTES OFFICIELLES. Pour chaque périmètre
// publié (SIS, SUP, instructions) et chaque parcelle cadastrale de son emprise, l'aire de l'intersection et son
// incertitude de calcul (`mesureIntersection`), classées en :
//   - contact : aire ≤ incertitude (indiscernable de zéro) → ignoré ;
//   - infime : incertitude < aire < 0,05 m² → supprimé jusqu'au SHA 971e423a, « à vérifier » désormais ;
//   - au-delà : déjà mesuré avant la correction.
// Chaque classe est confrontée au tableau « Parcelle(s) concernée(s) » de la fiche officielle (R. 125-24, 3°).
// Sans réseau : relit le cache de `parcelles-officielles.mjs`.
//
// Usage : node scripts/fut157/contacts-infimes.mjs <dossier-cache> <fichier.json> [...]
import { createJiti } from "jiti";
import fs from "node:fs";
import path from "node:path";

const racine = process.cwd() + "/";
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const G = await jiti.import(racine + "src/lib/geometrie-parcelle.ts");
const T = await jiti.import(racine + "src/lib/sites-sols-terrain.ts");

const [cache, ...fichiers] = process.argv.slice(2);
const nettoyer = (s) => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const cle = (section, numero) => `${String(section).replace(/^0+/, "").toUpperCase()}-${String(Number(numero))}`;
function declarees(html) {
  const out = new Set();
  let i = 0;
  while ((i = html.indexOf("Parcelle(s) concern", i)) >= 0) {
    const fin = html.indexOf("</table>", i);
    const bloc = html.slice(i, fin < 0 ? i + 20000 : fin);
    for (const [, tr] of bloc.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
      const td = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => nettoyer(m[1]));
      if (td.length >= 4) out.add(cle(td[2], td[3]));
    }
    i = fin < 0 ? i + 1 : fin;
  }
  return out;
}
function boite(g) {
  const pts = [];
  const v = (c) => { if (Array.isArray(c) && typeof c[0] === "number") pts.push(c); else if (Array.isArray(c)) c.forEach(v); };
  v(g.coordinates);
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

const fiches = new Map();
for (const f of fichiers) {
  const inventaire = /sis/.test(f) ? "sis" : /sup/.test(f) ? "sup" : "instructions";
  for (const r of JSON.parse(fs.readFileSync(f, "utf8"))) {
    if (!r.geom || !/Polygon/.test(r.geom.type) || fiches.has(r.identifiant_ssp)) continue;
    fiches.set(r.identifiant_ssp, { inventaire, r });
  }
}

const compte = { contact: { listee: 0, non: 0 }, infime: { listee: 0, non: 0 }, auDela: { listee: 0, non: 0 } };
const infimes = [];
let incertitudeMax = 0;
let sansListe = 0;
for (const [id, { inventaire, r }] of fiches) {
  const fh = path.join(cache, "fiches", `${id}.html`);
  const liste = fs.existsSync(fh) ? declarees(fs.readFileSync(fh, "utf8")) : null;
  if (!liste) sansListe++;
  const features = [];
  for (let start = 0; ; start += 1000) {
    const fc = path.join(cache, "cadastre", `${id}-${start}.json`);
    if (!fs.existsSync(fc)) break;
    const p = JSON.parse(fs.readFileSync(fc, "utf8")).features ?? [];
    features.push(...p);
    if (p.length < 1000) break;
  }
  const [x0, y0, x1, y1] = boite(r.geom);
  const proj = G.projectionAutour((x0 + x1) / 2, (y0 + y1) / 2);
  const lu = T.perimetreLisible(r.geom, proj);
  if (!lu) continue;
  for (const p of features) {
    const reg = G.regionDe(p.geometry, proj);
    if (!reg || !G.regionMesurable(reg)) continue;
    const m = G.mesureIntersection(reg, lu.region);
    if (!m || m.aire === 0) continue;
    const k = cle(p.properties.section, p.properties.numero);
    const listee = !!liste?.has(k);
    const classe = m.aire <= m.incertitude ? "contact" : m.aire < 0.05 ? "infime" : "auDela";
    compte[classe][listee ? "listee" : "non"]++;
    if (classe === "contact") incertitudeMax = Math.max(incertitudeMax, m.incertitude);
    if (classe === "infime") infimes.push({ id, inventaire, nom: r.nom ?? r.nom_etablissement, commune: r.nom_commune, parcelle: p.properties.idu, aire: m.aire, incertitude: m.incertitude, listee });
  }
}
console.log(JSON.stringify({ perimetres: fiches.size, sansListe, compte, incertitudeMaxDesContacts: incertitudeMax }, null, 2));
console.log("Intersections infimes déclarées par la fiche officielle :");
for (const x of infimes.filter((x) => x.listee)) console.log(" ", JSON.stringify(x));
console.log(`Intersections infimes non déclarées : ${infimes.filter((x) => !x.listee).length} (aire médiane ${infimes.filter((x) => !x.listee).map((x) => x.aire).sort((a, b) => a - b)[Math.floor(infimes.filter((x) => !x.listee).length / 2)]?.toExponential(2)} m²)`);
console.log(`Incertitude de calcul des infimes : de ${Math.min(...infimes.map((x) => x.incertitude)).toExponential(2)} à ${Math.max(...infimes.map((x) => x.incertitude)).toExponential(2)} m²`);
