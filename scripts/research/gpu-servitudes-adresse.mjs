#!/usr/bin/env node
/**
 * Le Geoportail de l'urbanisme (apicarto GPU) repond A UNE ADRESSE : il rend la zone du PLU,
 * les servitudes d'utilite publique qui grevent le point, et les prescriptions.
 *
 * Georisques n'expose qu'une famille de SUP (sites et sols pollues, 836 en France). Le GPU les
 * expose TOUTES : monuments historiques (AC1), sites patrimoniaux remarquables (AC4), captages
 * d'eau (AS1), lignes electriques (I4), voies ferrees (T1), risques (PM1), telecom (PT)...
 *
 * Ce script mesure, sur des adresses reelles et contrastees : la couverture (toutes les communes
 * n'ont pas verse leur PLU au GPU), le nombre de servitudes par point, et leurs types.
 *
 * Il ne conclut rien sur la valeur produit. Il etablit ce qui est disponible, et ou.
 *
 *   node scripts/research/gpu-servitudes-adresse.mjs --out tmp/fil/gpu.json
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a, i, all) => (a.startsWith("--") ? [[a.slice(2), all[i + 1]]] : [])),
);
const OUT = args.out ?? "tmp/fil/gpu.json";
const API = "https://apicarto.ign.fr/api/gpu";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Codes de servitude, tels que le Code de l'urbanisme les nomme. Sert a lire les resultats. */
const FAMILLES = {
  AC1: "monument historique", AC2: "site inscrit ou classe", AC4: "site patrimonial remarquable",
  AS1: "captage d'eau potable", I3: "canalisation de gaz", I4: "ligne electrique",
  PT1: "reception radioelectrique", PT2: "faisceau hertzien", PT3: "telecommunications",
  T1: "voie ferree", EL3: "halage", PM1: "risques naturels ou technologiques", PM3: "PPRT",
  INT1: "cimetiere", A4: "cours d'eau", A5: "canalisation d'eau", AR6: "servitude militaire",
};

async function gpu(endpoint, lon, lat, attempt = 0) {
  const geom = encodeURIComponent(JSON.stringify({ type: "Point", coordinates: [lon, lat] }));
  try {
    const res = await fetch(`${API}/${endpoint}?geom=${geom}`, { signal: AbortSignal.timeout(30_000) });
    if (res.status === 429 && attempt < 3) {
      await sleep(2500 * (attempt + 1));
      return gpu(endpoint, lon, lat, attempt + 1);
    }
    if (!res.ok) return null;
    const j = await res.json();
    return j.features ?? [];
  } catch {
    if (attempt < 2) {
      await sleep(1500 * (attempt + 1));
      return gpu(endpoint, lon, lat, attempt + 1);
    }
    return null;
  }
}

/** Adresses reelles, contrastees : centre historique, periurbain, rural, littoral, montagne. */
const POINTS = [
  { nom: "La Rochelle, vieux port", lon: -1.1520, lat: 46.1591 },
  { nom: "Paris, Marais", lon: 2.3600, lat: 48.8570 },
  { nom: "Bordeaux, Chartrons", lon: -0.5700, lat: 44.8550 },
  { nom: "Lyon, Croix-Rousse", lon: 4.8320, lat: 45.7740 },
  { nom: "Chamonix, centre", lon: 6.8694, lat: 45.9237 },
  { nom: "Fos-sur-Mer", lon: 4.9430, lat: 43.4380 },
  { nom: "Rural (Creuse, Bonnat)", lon: 1.9070, lat: 46.3350 },
  { nom: "Peripherie Toulouse (Blagnac)", lon: 1.3940, lat: 43.6350 },
  { nom: "Cap-Ferret", lon: -1.2480, lat: 44.6360 },
  { nom: "Strasbourg centre", lon: 7.7450, lat: 48.5830 },
];

const rows = [];
for (const p of POINTS) {
  const [zones, sup, prescriptions] = await Promise.all([
    gpu("zone-urba", p.lon, p.lat),
    gpu("assiette-sup-s", p.lon, p.lat),
    gpu("prescription-surf", p.lon, p.lat),
  ]);
  const failed = zones === null || sup === null;

  const types = (sup ?? []).map((f) => {
    const id = f.properties?.idass ?? "";
    const code = String(id).split("-")[0];
    return { code, libelle: FAMILLES[code] ?? "(code non repertorie)", nom: f.properties?.typeass ?? null };
  });

  rows.push({
    nom: p.nom,
    plu_verse: (zones ?? []).length > 0,
    zone: (zones ?? [])[0]?.properties?.typezone ?? null,
    zone_libelle: (zones ?? [])[0]?.properties?.libelle ?? null,
    n_servitudes: (sup ?? []).length,
    servitudes: types,
    n_prescriptions: (prescriptions ?? []).length,
    fetch_status: failed ? "partial_or_failed" : "ok",
  });
  process.stderr.write(`${p.nom}: ${(sup ?? []).length} SUP, zone ${(zones ?? [])[0]?.properties?.typezone ?? "-"}\n`);
  await sleep(400);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ rows }, null, 1));

const ok = rows.filter((r) => r.fetch_status === "ok");
console.log(`\nadresses testees : ${ok.length}/${rows.length}\n`);
console.log(`  adresse                        PLU   zone   SUP  prescriptions`);
for (const r of ok) {
  console.log(
    `  ${r.nom.padEnd(30)} ${(r.plu_verse ? "oui" : "NON").padEnd(5)} ${String(r.zone ?? "-").padEnd(6)} ` +
      `${String(r.n_servitudes).padStart(3)}   ${String(r.n_prescriptions).padStart(3)}`,
  );
}
const avecPlu = ok.filter((r) => r.plu_verse).length;
const avecSup = ok.filter((r) => r.n_servitudes > 0).length;
console.log(`\n  PLU verse au GPU : ${avecPlu}/${ok.length}`);
console.log(`  au moins une servitude sur le point : ${avecSup}/${ok.length}`);

const familles = new Map();
for (const r of ok) for (const s of r.servitudes) familles.set(s.code, (familles.get(s.code) ?? 0) + 1);
console.log(`\n  familles de servitudes rencontrees :`);
for (const [code, n] of [...familles].sort((a, b) => b[1] - a[1])) {
  console.log(`    ${String(code).padEnd(6)} ${String(n).padStart(2)}x  ${FAMILLES[code] ?? "(non repertorie)"}`);
}
console.log(`\necrit : ${OUT}`);
