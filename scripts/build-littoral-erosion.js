#!/usr/bin/env node
/**
 * build-littoral-erosion.js
 *
 * Construit, par commune littorale, un résumé du recul du trait de côte à partir
 * de l'indicateur national d'érosion côtière du Cerema (couche WFS Géolittoral
 * « n_evolution_trait_cote_s », segments linéaires portant un taux en m/an).
 *
 * Hiérarchie produit (validée 2026-06-02) :
 *   - CLASSE = intensité (médiane des taux, m/an) : faible / modéré / marqué / très marqué
 *   - AMPLEUR = % du littoral communal en recul (taux < 0), affiché, ne pilote pas la classe
 *   - DÉTAIL = recul maximal observé (m/an) « sur certains secteurs »
 *   - GARDE-FOU = trop peu de segments valides (côte aménagée, -9999) → pas de classe
 *
 * Cadrage : c'est un recul OBSERVÉ sur ~50 ans, pas une projection.
 *
 * Attribution : point-dans-polygone du milieu de chaque segment dans le contour
 * communal (geo.api.gouv), en EPSG:3857 (CRS natif du WFS).
 *
 * Usage :
 *   node scripts/build-littoral-erosion.js                 # échantillon contrasté (démo)
 *   node scripts/build-littoral-erosion.js 17300 33514 ... # codes INSEE explicites
 *   node scripts/build-littoral-erosion.js --file codes.json
 */
import fs from "node:fs/promises";
import path from "node:path";

const WFS =
  "https://geolittoral.din.developpement-durable.gouv.fr/wxs?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature" +
  "&TYPENAMES=ms:n_evolution_trait_cote_s&COUNT=8000&SRSNAME=urn:ogc:def:crs:EPSG::3857";

const MIN_VALID = 5; // sous ce nombre de segments calculés : garde-fou « aménagé »

// Échantillon contrasté par défaut (démo / calibration visuelle).
const SAMPLE = [
  "29039", // Concarneau
  "17300", // La Rochelle
  "35288", // Saint-Malo
  "62318", // Le Touquet-Paris-Plage
  "64122", // Biarritz
  "33009", // Arcachon
  "85194", // Les Sables-d'Olonne
  "33214", // Lacanau
  "40065", // Capbreton
  "33514", // Soulac-sur-Mer
  "34301", // Sète
  "59183", // Dunkerque
];

const toMerc = ([lon, lat]) => [
  (lon * 20037508.342789244) / 180,
  6378137 * Math.log(Math.tan(((90 + lat) * Math.PI) / 360)),
];

function ringsOf(geom) {
  if (!geom) return [];
  if (geom.type === "Polygon") return [geom.coordinates[0]];
  if (geom.type === "MultiPolygon") return geom.coordinates.map((p) => p[0]);
  return [];
}

function pointInRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

async function fetchCommune(insee) {
  const url = `https://geo.api.gouv.fr/communes?code=${insee}&fields=nom,contour&format=json&geometry=contour`;
  const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
  const j = await r.json();
  const rec = Array.isArray(j) ? j[0] : j;
  if (!rec?.contour) return null;
  const rings = ringsOf(rec.contour).map((ring) => ring.map(toMerc));
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const ring of rings) for (const [x, y] of ring) {
    if (x < minX) minX = x; if (y < minY) minY = y;
    if (x > maxX) maxX = x; if (y > maxY) maxY = y;
  }
  return { nom: rec.nom, rings, bbox: [minX, minY, maxX, maxY] };
}

async function fetchSegments(bbox) {
  const m = 1500; // marge : le trait de côte est légèrement au large
  const [minX, minY, maxX, maxY] = bbox;
  const url = `${WFS}&BBOX=${minX - m},${minY - m},${maxX + m},${maxY + m},urn:ogc:def:crs:EPSG::3857`;
  const r = await fetch(url, { signal: AbortSignal.timeout(90000) });
  const xml = await r.text();
  const feats = xml.split("<ms:n_evolution_trait_cote_s").slice(1);
  const out = [];
  for (const f of feats) {
    const taux = parseFloat((f.match(/<ms:taux>([^<]*)<\/ms:taux>/) || [])[1]);
    const anc = parseInt((f.match(/<ms:tdc_ancien>([^<]*)</) || [])[1], 10);
    const rec = parseInt((f.match(/<ms:tdc_rec>([^<]*)</) || [])[1], 10);
    const pos = (f.match(/<gml:posList[^>]*>([^<]*)<\/gml:posList>/) || [])[1];
    if (!pos || isNaN(taux)) continue;
    const nums = pos.trim().split(/\s+/).map(Number);
    const mid = Math.floor(Math.floor(nums.length / 2) / 2) * 2;
    out.push({ taux, anc, rec, x: nums[mid], y: nums[mid + 1] });
  }
  return out;
}

// Classe pilotée par l'INTENSITÉ (médiane m/an). null si non classable.
function classifyByIntensity(median) {
  if (median == null) return null;
  if (median >= -0.1) return "faible";
  if (median >= -0.5) return "modéré";
  if (median >= -1.5) return "marqué";
  return "très marqué";
}

async function summarize(insee) {
  const c = await fetchCommune(insee);
  if (!c) return { insee, error: "contour introuvable" };
  const segs = await fetchSegments(c.bbox);
  const inside = segs.filter((s) => c.rings.some((ring) => pointInRing(s.x, s.y, ring)));
  if (inside.length === 0) return { insee, nom: c.nom, littoral: false }; // pas de trait de côte → pas littoral
  const valid = inside.filter((s) => s.taux > -9000);
  const recul = valid.filter((s) => s.taux < 0);
  const sorted = valid.map((s) => s.taux).sort((a, b) => a - b);
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : null;
  const annees = valid.flatMap((s) => [s.anc, s.rec]).filter((n) => Number.isFinite(n));
  const amenage = valid.length < MIN_VALID;
  return {
    insee,
    nom: c.nom,
    littoral: true,
    amenage, // garde-fou : sous MIN_VALID, statut « aménagé » affiché en principal
    // Classe TOUJOURS calculée (médiane) : si aménagé mais signal fort, l'affichage
    // ajoute « recul marqué/très marqué observé sur les secteurs mesurables ».
    classe: classifyByIntensity(median),
    pctRecul: valid.length ? Math.round((100 * recul.length) / valid.length) : null,
    medianeMpan: median == null ? null : Number(median.toFixed(2)),
    reculMaxMpan: sorted.length ? Number(sorted[0].toFixed(2)) : null,
    nbValid: valid.length,
    nbTotal: inside.length,
    periode: annees.length ? [Math.min(...annees), Math.max(...annees)] : null,
  };
}

async function main() {
  const args = process.argv.slice(2);
  let codes = SAMPLE;
  if (args[0] === "--file") {
    codes = JSON.parse(await fs.readFile(args[1], "utf8")).map((c) => String(c).padStart(5, "0"));
  } else if (args.length) {
    codes = args.map((c) => String(c).padStart(5, "0"));
  }

  console.log(`Traitement de ${codes.length} commune(s)…\n`);
  const results = [];
  for (const insee of codes) {
    try {
      const s = await summarize(insee);
      results.push(s);
      if (s.error) console.log(`${insee} ERREUR ${s.error}`);
      else if (!s.littoral) console.log(`${(s.nom || insee).padEnd(20)} | non littoral (aucun segment)`);
      else {
        const cls = s.amenage ? "aménagé (n.c.)" : s.classe;
        console.log(
          `${s.nom.padEnd(20)} | ${String(s.pctRecul).padStart(3)}% recul | médiane ${String(s.medianeMpan).padStart(6)} | max ${String(s.reculMaxMpan).padStart(6)} | valides ${String(s.nbValid).padStart(3)} | ${cls}`,
        );
      }
    } catch (e) {
      console.log(`${insee} ERREUR ${e.message}`);
      results.push({ insee, error: e.message });
    }
  }

  // En mode national (liste fournie), on persiste l'index. En mode démo, non.
  if (args.length) {
    const kept = results.filter((r) => r.littoral && !r.error);
    const out = Object.fromEntries(kept.map((r) => [r.insee, r]));
    const outPath = path.join(process.cwd(), "data", "littoral-erosion.json");
    await fs.writeFile(outPath, JSON.stringify(out, null, 0) + "\n", "utf8");
    console.log(`\nÉcrit ${kept.length} communes littorales dans data/littoral-erosion.json`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
