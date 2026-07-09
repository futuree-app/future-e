#!/usr/bin/env node
/**
 * Quelle part des LOGEMENTS francais se trouve dans un perimetre d'Architecte des Batiments de
 * France (servitude AC1 : abords d'un monument historique ; AC4 : site patrimonial remarquable) ?
 *
 * La question n'est pas academique. Dans ces perimetres, l'isolation par l'exterieur est le plus
 * souvent refusee. Or `renovation.ts` et la Face 1 « lecture thermique » recommandent des travaux
 * sans savoir si l'adresse a le droit de les faire.
 *
 * Methode : on ne tire pas des centroides communaux (ils tombent en pleine campagne). On tire des
 * ADRESSES REELLES DE LOGEMENTS, depuis les DPE de l'ADEME, dans des communes echantillonnees au
 * prorata de la population. Puis on interroge le Geoportail de l'urbanisme sur chaque point.
 *
 * Le resultat est une part de LOGEMENTS DIAGNOSTIQUES, non de logements tout court : les DPE
 * sur-representent les biens vendus ou loues recemment. C'est une approximation, elle est nommee.
 *
 *   node scripts/research/abf-part-logements.mjs --communes 30 --par-commune 2
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a, i, all) => (a.startsWith("--") ? [[a.slice(2), all[i + 1]]] : [])),
);
const N_COMMUNES = Number(args.communes ?? 30);
const PAR_COMMUNE = Number(args["par-commune"] ?? 2);
const OUT = args.out ?? "tmp/fil/abf.json";

const DPE_EXISTANT = "meg-83tjwtg8dyz4vv7h1dqe";
const ADEME = "https://data.ademe.fr/data-fair/api/v1/datasets";
const GPU = "https://apicarto.ign.fr/api/gpu";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** AC1 : abords de monument historique. AC4 : site patrimonial remarquable. AC2 : site classe. */
const ABF = new Set(["AC1", "AC4"]);

async function json(url, attempt = 0) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (res.status === 429 && attempt < 3) {
      await sleep(3000 * (attempt + 1));
      return json(url, attempt + 1);
    }
    if (!res.ok) return null;
    return await res.json();
  } catch {
    if (attempt < 2) {
      await sleep(1500 * (attempt + 1));
      return json(url, attempt + 1);
    }
    return null;
  }
}

/** Adresses de logements reels : on prend des DPE espaces dans le fichier, pas les premiers. */
async function adresses(insee, n) {
  const qs = encodeURIComponent(`code_insee_ban:"${insee}"`);
  const j = await json(`${ADEME}/${DPE_EXISTANT}/lines?qs=${qs}&size=${n * 8}&select=adresse_ban,_geopoint`);
  if (!j?.results?.length) return [];
  const pas = Math.max(1, Math.floor(j.results.length / n));
  const out = [];
  for (let i = 0; i < j.results.length && out.length < n; i += pas) {
    const g = j.results[i]._geopoint;
    if (!g) continue;
    const [lat, lon] = String(g).split(",").map(Number);
    if (Number.isFinite(lat) && Number.isFinite(lon)) out.push({ lat, lon, label: j.results[i].adresse_ban });
  }
  return out;
}

async function servitudes(lon, lat) {
  const geom = encodeURIComponent(JSON.stringify({ type: "Point", coordinates: [lon, lat] }));
  const j = await json(`${GPU}/assiette-sup-s?geom=${geom}`);
  if (!j) return null;
  return (j.features ?? []).map((f) => String(f.properties?.idass ?? "").split("-")[0]);
}

const idx = JSON.parse(readFileSync("data/comparateur-index.json", "utf8"));
const communes = (Array.isArray(idx) ? idx : Object.values(idx).find(Array.isArray)).filter((c) => (c.population ?? 0) > 0);

// Tirage au prorata de la population, deterministe (pas de Math.random).
const total = communes.reduce((t, c) => t + c.population, 0);
const pas = total / N_COMMUNES;
const echantillon = [];
let curseur = pas / 2;
let cumul = 0;
for (const c of communes) {
  cumul += c.population;
  while (cumul >= curseur && echantillon.length < N_COMMUNES) {
    echantillon.push(c);
    curseur += pas;
  }
}

const points = [];
for (const c of echantillon) {
  const adrs = await adresses(c.insee, PAR_COMMUNE);
  for (const a of adrs) {
    const codes = await servitudes(a.lon, a.lat);
    if (codes === null) {
      points.push({ insee: c.insee, commune: c.nom, fetch_status: "partial_or_failed" });
    } else {
      const abf = codes.filter((k) => ABF.has(k));
      points.push({ insee: c.insee, commune: c.nom, population: c.population, adresse: a.label,
        n_servitudes: codes.length, codes, abf: abf.length > 0, fetch_status: "ok" });
      process.stderr.write(`${c.nom}: ${abf.length ? "ABF" : "--"}  (${codes.length} sup)\n`);
    }
    await sleep(350);
  }
}

const ok = points.filter((p) => p.fetch_status === "ok");
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ points }, null, 1));

const abf = ok.filter((p) => p.abf).length;
const avecSup = ok.filter((p) => p.n_servitudes > 0).length;
console.log(`\nadresses de logements testees : ${ok.length} (echecs ${points.length - ok.length})\n`);
console.log(`  en perimetre ABF (AC1 ou AC4) : ${abf}/${ok.length}  (${((abf / ok.length) * 100).toFixed(0)} %)`);
console.log(`  avec au moins une servitude   : ${avecSup}/${ok.length}  (${((avecSup / ok.length) * 100).toFixed(0)} %)`);

const grandes = ok.filter((p) => p.population >= 50_000);
const petites = ok.filter((p) => p.population < 50_000);
const part = (xs) => (xs.length ? `${((xs.filter((p) => p.abf).length / xs.length) * 100).toFixed(0)} %` : "-");
console.log(`\n  communes >= 50 000 hab : ${part(grandes)} en perimetre ABF  (n=${grandes.length})`);
console.log(`  communes <  50 000 hab : ${part(petites)} en perimetre ABF  (n=${petites.length})`);
console.log(`\nrappel : part de LOGEMENTS DIAGNOSTIQUES (DPE), qui sur-representent les biens vendus ou loues.`);
console.log(`\necrit : ${OUT}`);
