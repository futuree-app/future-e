#!/usr/bin/env node
/**
 * FUT-149 — Capture les réponses BRUTES de la BAN et du cadastre pour les adresses de recette du débroussaillement,
 * dans `src/lib/__fixtures__/fut149/adresses/`, puis extrait de l'édition construite les SEULES tuiles que ces
 * adresses lisent (`src/lib/__fixtures__/fut149/tuiles/`, avec un manifeste réduit à ces cellules). Les tests les
 * rejouent par `lireDebroussaillement`, sans réseau, et recalculent l'état attendu par un oracle indépendant.
 *
 * Les adresses ont été choisies le 28/10/2026 en interrogeant la BAN sur une grille de points de chaque commune,
 * puis en classant chaque adresse trouvée sur les polygones d'origine (Lambert-93, Shapely) : aucun zonage présumé.
 *
 * Lecture seule, API publiques sans clé.
 *
 *   node scripts/research/fut149-capture-adresses.mjs --edition <sortie>/<édition> [--seul a,b] [--tuiles-seules]
 */
import { writeFileSync, mkdirSync, readFileSync, readdirSync, copyFileSync, rmSync } from "node:fs";
import path from "node:path";
import { urlRechercheBan } from "../../src/lib/geocodeur-ban.ts";
import { distanceRegion, projectionAutour, regionDe } from "../../src/lib/geometrie-parcelle.ts";
import { cellulesDeLecture } from "../../src/lib/debroussaillement.ts";

const OUT = "src/lib/__fixtures__/fut149";
const CARTO = "https://apicarto.ign.fr/api";

export const CAS = {
  // La Teste-de-Buch (Gironde) : le Pyla dans la zone, le centre hors zone, deux adresses à sa limite.
  "la-teste-pyla-en-zone": "55 Allée Fructidor Pyla 33115 La Teste-de-Buch",
  "la-teste-centre-hors-zone": "4 Rue Jean Beyrie 33260 La Teste-de-Buch",
  "la-teste-cazaux-limite": "28 Rue Etienne Bonis Cazaux 33260 La Teste-de-Buch",
  "la-teste-daugey-limite": "41bis Rue Raymond Daugey 33260 La Teste-de-Buch",
  // Landiras (Gironde) : la commune entière est dans la zone (aucune adresse hors zone trouvée sur 57).
  "landiras-en-zone": "253 Route du Roy 33720 Landiras",
  "landiras-chalup": "1634 Rue Joachim de Chalup 33720 Landiras",
  // Gonfaron (Var) : brûlée sur 6 832 ha en 2021 (BDIFF) ; le zonage du Var repose sur une carte des bois de 2008.
  "gonfaron-en-zone": "1362 Route de la Fauville 83590 Gonfaron",
  "gonfaron-hors-zone": "268 Chemin de l’Esparron 83590 Gonfaron",
  "gonfaron-foch-limite": "80 Avenue Maréchal Foch 83590 Gonfaron",
  "gonfaron-mairie": "1 Place de la Victoire 83590 Gonfaron",
  // Fréjus (Var).
  "frejus-en-zone": "805 Avenue de la Baie 83600 Fréjus",
  "frejus-hors-zone": "390 Boulevard de la Libération 83600 Fréjus",
  "frejus-sakharov-limite": "177 Avenue Andrei Sakharov 83600 Fréjus",
  // Nîmes (Gard).
  "nimes-en-zone": "1070 Chemin de Font Aubarne 30900 Nîmes",
  "nimes-hors-zone": "864 Avenue du Maréchal Juin 30900 Nîmes",
  "nimes-bleriot-limite": "5 Rue Blériot 30000 Nîmes",
  // Saint-Denis-d'Oléron (Charente-Maritime, classée en partie par l'annexe 1) : un même chemin, dedans et dehors.
  "oleron-en-zone": "55 Chemin des Sables 17650 Saint-Denis-d'Oléron",
  "oleron-hors-zone": "36 Rue Marc Guyonnet 17650 Saint-Denis-d'Oléron",
  "oleron-boudet-13": "13 Chemin Boudet 17650 Saint-Denis-d'Oléron",
  "oleron-boudet-855": "855 Chemin Boudet 17650 Saint-Denis-d'Oléron",
  // Géocodage à la rue : la lecture décrit un secteur.
  "oleron-boudet-rue": "Chemin Boudet 17650 Saint-Denis-d'Oléron",
  // Départements : Gironde couverte loin des bois ; Rhône sans zonage publié ; Corse-du-Sud (code 2A).
  "bordeaux-bourse": "1 Place de la Bourse 33000 Bordeaux",
  "lyon-bellecour": "20 Place Bellecour 69002 Lyon",
  "ajaccio-napoleon": "1 Cours Napoléon 20000 Ajaccio",
};
const args = process.argv.slice(2);
const seul = args.includes("--seul") ? args[args.indexOf("--seul") + 1].split(",") : null;
const edition = args.includes("--edition") ? args[args.indexOf("--edition") + 1] : null;

async function getJson(url, init) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(30_000), headers: { accept: "application/json", "content-type": "application/json" } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}
const post = (endpoint, geom, limite) => getJson(`${CARTO}/${endpoint}${limite ? `?_limit=${limite}` : ""}`, { method: "POST", body: JSON.stringify({ geom }) });
const arrondi = (v) => (Array.isArray(v) ? v.map(arrondi) : typeof v === "number" ? Math.round(v * 1e7) / 1e7 : v);
const distance = (lon, lat, g) => { const r = regionDe(g, projectionAutour(lon, lat)); return r ? distanceRegion([0, 0], r) : Infinity; };
function square(lon, lat, m) {
  const dLat = m / 111_320;
  const dLon = m / (111_320 * Math.cos((lat * Math.PI) / 180));
  return { type: "Polygon", coordinates: [[[lon - dLon, lat - dLat], [lon + dLon, lat - dLat], [lon + dLon, lat + dLat], [lon - dLon, lat + dLat], [lon - dLon, lat - dLat]]] };
}
const parcelleBrute = (f) => ({ properties: { idu: f.properties.idu, contenance: f.properties.contenance }, geometry: { type: f.geometry.type, coordinates: arrondi(f.geometry.coordinates) } });

if (!args.includes("--tuiles-seules")) {
  mkdirSync(`${OUT}/adresses`, { recursive: true });
  for (const [cle, q] of Object.entries(CAS)) {
    if (seul && !seul.includes(cle)) continue;
    const ban = (await getJson(urlRechercheBan({ q, limit: 1 }))).features[0];
    const [lon, lat] = ban.geometry.coordinates;
    // Même rattachement que `cadastre.ts` : deux résultats au point, puis repli 3/8/15 m sur la plus proche.
    const auPoint = (await post("cadastre/parcelle", { type: "Point", coordinates: [lon, lat] }, 2)).features ?? [];
    let parcelle = auPoint[0] ?? null;
    let rattachement = "point";
    let distanceM;
    for (const m of [3, 8, 15]) {
      if (parcelle) break;
      const fs = (await post("cadastre/parcelle", square(lon, lat, m), 8)).features ?? [];
      const proche = fs.map((f) => ({ f, d: distance(lon, lat, f.geometry) }))
        .sort((a, b) => (Math.abs(a.d - b.d) > 0.01 ? a.d - b.d : (a.f.properties.contenance ?? Infinity) - (b.f.properties.contenance ?? Infinity)))[0];
      parcelle = proche?.f ?? null;
      distanceM = proche ? Math.round(proche.d * 10) / 10 : undefined;
      rattachement = "repli";
    }
    const fixture = {
      capture: new Date().toISOString(), q,
      ban: { id: ban.properties.id, label: ban.properties.label, type: ban.properties.type, citycode: ban.properties.citycode, score: ban.properties.score, lon, lat },
      parcelle: parcelle ? {
        ...parcelleBrute(parcelle), rattachement,
        candidatsAuPoint: new Set(auPoint.map((f) => f.properties.idu)).size || undefined,
        ...(distanceM != null ? { distanceM } : {}),
      } : null,
    };
    writeFileSync(`${OUT}/adresses/${cle}.json`, JSON.stringify(fixture));
    console.log(cle.padEnd(28), ban.properties.type.padEnd(12), ban.properties.label, parcelle ? `· parcelle ${parcelle.properties.idu} (${rattachement})` : "· sans parcelle");
  }
}

// ── Les tuiles : celles que lit chaque adresse (avec et sans sa parcelle), et le manifeste réduit à ces cellules ─
if (edition) {
  const m = JSON.parse(readFileSync(path.join(edition, "manifest.json"), "utf8"));
  const cellules = new Set();
  for (const f of readdirSync(`${OUT}/adresses`)) {
    const x = JSON.parse(readFileSync(`${OUT}/adresses/${f}`, "utf8"));
    const e = { point: [x.ban.lon, x.ban.lat], geocodage: x.ban.type, insee: x.ban.citycode, parcelle: null };
    for (const c of cellulesDeLecture(e)) cellules.add(c);
    if (x.parcelle) for (const c of cellulesDeLecture({ ...e, parcelle: { geometry: x.parcelle.geometry, rattachement: x.parcelle.rattachement, candidatsAuPoint: x.parcelle.candidatsAuPoint } })) cellules.add(c);
  }
  rmSync(`${OUT}/tuiles`, { recursive: true, force: true });
  mkdirSync(`${OUT}/tuiles/t`, { recursive: true });
  const tuiles = {};
  for (const c of [...cellules].sort()) {
    if (!m.tuiles[c]) continue;
    tuiles[c] = m.tuiles[c];
    if (!("plein" in m.tuiles[c])) copyFileSync(path.join(edition, "t", `${c}.json.gz`), `${OUT}/tuiles/t/${c}.json.gz`);
  }
  // `cellulesExtraites` : les cellules dont l'absence du manifeste réduit est une VRAIE absence (le test le vérifie).
  const reduit = { ...m, tuiles, cellulesExtraites: [...cellules].sort() };
  writeFileSync(`${OUT}/tuiles/manifest.json`, JSON.stringify(reduit));
  console.log(`tuiles extraites : ${Object.keys(tuiles).length} sur ${cellules.size} cellules`);
}
