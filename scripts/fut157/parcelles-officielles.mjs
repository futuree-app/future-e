// FUT-157 : la vérité réglementaire des seuils. Pour chaque périmètre publié (SIS, SUP, instructions), la liste
// des parcelles que la fiche officielle déclare « concernées », et les parcelles cadastrales de son emprise.
// Ces deux listes, confrontées à l'aire mesurée de chaque recoupement, disent si un seuil (2 %, 25 m²) écarte une
// parcelle que l'administration déclare concernée.
//
// Usage : node scripts/fut157/parcelles-officielles.mjs <dossier-cache> <fichier.json> [...]
//   Sortie : <dossier-cache>/mesure.jsonl, une ligne par (périmètre, parcelle recoupée ou déclarée).
//   Les pages et les réponses du cadastre sont gardées en cache : un second passage ne refait aucun appel.
import { createJiti } from "jiti";
import fs from "node:fs";
import path from "node:path";

const racine = process.cwd() + "/";
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const G = await jiti.import(racine + "src/lib/geometrie-parcelle.ts");
const T = await jiti.import(racine + "src/lib/sites-sols-terrain.ts");

const [cache, ...fichiers] = process.argv.slice(2);
fs.mkdirSync(path.join(cache, "fiches"), { recursive: true });
fs.mkdirSync(path.join(cache, "cadastre"), { recursive: true });
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function enCache(fichier, url, lire) {
  if (fs.existsSync(fichier)) return lire(fs.readFileSync(fichier, "utf8"));
  for (let essai = 0; essai < 3; essai++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (res.ok) { const t = await res.text(); fs.writeFileSync(fichier, t); await pause(250); return lire(t); }
    } catch {}
    await pause(2000);
  }
  return null;
}

const nettoyer = (s) => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

/** Les lignes du tableau « Parcelle(s) concernée(s) » : commune, section, numéro. */
function parcellesDeclarees(html) {
  const out = [];
  let i = 0;
  while ((i = html.indexOf("Parcelle(s) concern", i)) >= 0) {
    const fin = html.indexOf("</table>", i);
    const bloc = html.slice(i, fin < 0 ? i + 20000 : fin);
    for (const [, tr] of bloc.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
      const td = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => nettoyer(m[1]));
      if (td.length >= 4) out.push({ commune: td[0], feuille: td[1], section: td[2], numero: td[3] });
    }
    i = fin < 0 ? i + 1 : fin;
  }
  const vus = new Set();
  return out.filter((p) => { const k = cle(p.section, p.numero); if (vus.has(k)) return false; vus.add(k); return true; });
}

const cle = (section, numero) => `${String(section).replace(/^0+/, "").toUpperCase()}-${String(Number(numero))}`;

function boite(g) {
  const pts = [];
  const v = (c) => { if (Array.isArray(c) && typeof c[0] === "number") pts.push(c); else if (Array.isArray(c)) c.forEach(v); };
  v(g.coordinates);
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

async function parcellesEmprise(id, g) {
  const [x0, y0, x1, y1] = boite(g);
  const m = 0.0002; // une vingtaine de mètres autour de l'emprise
  const geom = { type: "Polygon", coordinates: [[[x0 - m, y0 - m], [x1 + m, y0 - m], [x1 + m, y1 + m], [x0 - m, y1 + m], [x0 - m, y0 - m]]] };
  const features = [];
  for (let start = 0; start < 10_000; start += 1000) {
    const url = `https://apicarto.ign.fr/api/cadastre/parcelle?geom=${encodeURIComponent(JSON.stringify(geom))}&_limit=1000&_start=${start}`;
    const page = await enCache(path.join(cache, "cadastre", `${id}-${start}.json`), url, JSON.parse);
    if (!page) return null;
    features.push(...(page.features ?? []));
    if ((page.features ?? []).length < 1000) break;
  }
  return features;
}

const fiches = new Map();
for (const f of fichiers) {
  const inventaire = /sis/.test(f) ? "sis" : /sup/.test(f) ? "sup" : "instructions";
  for (const r of JSON.parse(fs.readFileSync(f, "utf8"))) {
    if (!r.geom || !/Polygon/.test(r.geom.type) || fiches.has(r.identifiant_ssp)) continue;
    fiches.set(r.identifiant_ssp, { inventaire, r });
  }
}

const sortie = fs.createWriteStream(path.join(cache, "mesure.jsonl"));
let n = 0;
for (const [id, { inventaire, r }] of fiches) {
  n++;
  const html = r.fiche_risque ? await enCache(path.join(cache, "fiches", `${id}.html`), r.fiche_risque, (t) => t) : null;
  const declarees = html ? parcellesDeclarees(html) : null;
  const parcelles = await parcellesEmprise(id, r.geom);
  const base = { id, inventaire, nom: r.nom ?? r.nom_etablissement, commune: r.nom_commune, superficie: r.superficie ?? null };
  if (!parcelles) { sortie.write(JSON.stringify({ ...base, erreur: "cadastre" }) + "\n"); continue; }
  const [x0, y0, x1, y1] = boite(r.geom);
  const proj = G.projectionAutour((x0 + x1) / 2, (y0 + y1) / 2);
  const perimetre = G.regionDe(T.sansAnneauxNuls(r.geom, proj), proj);
  const lisible = !!perimetre && G.aireRegion(perimetre) > 0 && G.regionMesurable(perimetre);
  const listees = new Set((declarees ?? []).map((p) => cle(p.section, p.numero)));
  const trouvees = new Set();
  for (const p of parcelles) {
    const k = cle(p.properties.section, p.properties.numero);
    const reg = G.regionDe(p.geometry, proj);
    const aireP = reg ? G.aireRegion(reg) : null;
    const aire = lisible && reg ? G.aireIntersection(reg, perimetre) : null;
    if (!listees.has(k) && (aire == null || aire < 0.01)) continue;
    trouvees.add(k);
    sortie.write(JSON.stringify({
      ...base, lisible, declarees: declarees?.length ?? null, parcelle: p.properties.idu, cle: k,
      listee: listees.has(k), aireParcelle: aireP, aire, part: aire != null && aireP ? aire / aireP : null,
    }) + "\n");
  }
  for (const k of listees) if (!trouvees.has(k)) sortie.write(JSON.stringify({ ...base, lisible, declarees: declarees.length, cle: k, listee: true, absenteDuCadastre: true }) + "\n");
  if (n % 20 === 0) console.error(`${n}/${fiches.size}`);
}
sortie.end();
console.error(`fini : ${n} périmètres`);
