#!/usr/bin/env node
/**
 * FUT-82 — IREP : le registre officiel (Géorisques, millésime 2024) face à l'extrait que lit
 * futur•e aujourd'hui (`src/lib/irep.ts` → jeu ADEME `085ipnlpj9awm78hikh1nakj`, « Year: 2019 »).
 *
 * Questions posées, dans cet ordre :
 *   1. Combien d'établissements chaque source contient-elle, et de quel millésime ?
 *   2. Le détail polluant par polluant existe-t-il, et sous quelle forme (quantités, « < seuil ») ?
 *   3. Autour des points de l'échantillon, que dirait chaque source ?
 *   4. Les coordonnées sont-elles des positions d'établissement ou des repères approximatifs ?
 *
 *   node scripts/research/fut82/irep-2024.mjs [--annee 2024] [--tmp <dossier>] [--out <json>]
 *
 * Le zip officiel (≈ 7,5 Mo) est téléchargé dans un dossier temporaire HORS dépôt, extrait par
 * `unzip`, puis seules des agrégations sont écrites dans le rapport.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { timedFetch, tryJson, parseArgs, haversineM, sleep } from "./lib.mjs";

const args = parseArgs(process.argv);
const ANNEE = String(args.annee ?? 2024);
const TMP = args.tmp ?? join(tmpdir(), `fut82-irep-${ANNEE}`);
const OUT = args.out ?? "docs/audits/2026-10-27-fut82/mesures/irep-2024.json";
const ECH = "docs/audits/2026-10-27-fut82/mesures/echantillon.json";
const ADEME = "https://data.ademe.fr/data-fair/api/v1/datasets/085ipnlpj9awm78hikh1nakj";

mkdirSync(TMP, { recursive: true });
const zip = join(TMP, `${ANNEE}.zip`);
if (!existsSync(zip)) {
  const r = await fetch(`https://files.georisques.fr/irep/${ANNEE}.zip`);
  if (!r.ok) throw new Error(`IREP ${ANNEE} : HTTP ${r.status}`);
  writeFileSync(zip, Buffer.from(await r.arrayBuffer()));
}
execFileSync("unzip", ["-o", "-q", zip, "-d", TMP]);

function lireCsv(fichier) {
  const [tete, ...lignes] = readFileSync(join(TMP, ANNEE, fichier), "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  const cols = tete.split(";");
  return lignes.map((l) => { const v = l.split(";"); return Object.fromEntries(cols.map((c, i) => [c, v[i]?.trim() ?? ""])); });
}

const etabs = lireCsv("etablissements.csv");
const emissions = lireCsv("emissions.csv");

// ── 1-2. Volumes et nature du détail ────────────────────────────────────────────────────────
const parEtab = new Map();
let sousSeuil = 0, chiffrees = 0;
const milieux = {};
for (const e of emissions) {
  const q = e.quantite;
  if (/seuil/i.test(q)) { sousSeuil++; continue; }
  const v = Number(q.replace(",", "."));
  if (!Number.isFinite(v)) continue;
  chiffrees++;
  milieux[e.milieu] = (milieux[e.milieu] ?? 0) + 1;
  const m = parEtab.get(e.identifiant) ?? [];
  m.push({ milieu: e.milieu, polluant: e.polluant, kg: v });
  parEtab.set(e.identifiant, m);
}
const avecAirChiffre = [...parEtab.values()].filter((l) => l.some((x) => x.milieu === "Air")).length;
const polluantsAir = {};
for (const l of parEtab.values()) for (const x of l) if (x.milieu === "Air") polluantsAir[x.polluant] = (polluantsAir[x.polluant] ?? 0) + 1;

// Coordonnées : combien d'établissements partagent exactement le même point ? (repère commun =
// signe d'un géocodage approximatif : mairie, centroïde, siège)
const parCoord = new Map();
for (const e of etabs) {
  const k = `${e.coordonnees_x}|${e.coordonnees_y}`;
  parCoord.set(k, (parCoord.get(k) ?? 0) + 1);
}
const coordPartagees = [...parCoord.entries()].filter(([, n]) => n > 1).reduce((s, [, n]) => s + n, 0);
const sansCoord = etabs.filter((e) => !e.coordonnees_x || !e.coordonnees_y).length;
const epsg = {};
for (const e of etabs) epsg[e.code_epsg] = (epsg[e.code_epsg] ?? 0) + 1;
const elevages = etabs.filter((e) => /élevage|elevage|volailles|porcs/i.test(`${e.libelle_ape} ${e.libelle_eprtr}`)).length;

// ── ADEME (ce que lit futur•e) ──────────────────────────────────────────────────────────────
const meta = tryJson((await timedFetch(ADEME)).body);

// ── 3. Autour des points de l'échantillon ──────────────────────────────────────────────────
const ech = JSON.parse(readFileSync(ECH, "utf8")).points.filter((p) => p.ok && p.type !== "municipality");
const geo = etabs.filter((e) => e.code_epsg === "4326" && e.coordonnees_x && e.coordonnees_y)
  .map((e) => ({ id: e.identifiant, nom: e.nom_etablissement, lon: Number(e.coordonnees_x), lat: Number(e.coordonnees_y), ape: e.libelle_ape, eprtr: e.libelle_eprtr }));

const autour = [];
for (const p of ech) {
  const proches = geo.map((e) => ({ ...e, d: haversineM(p.lat, p.lon, e.lat, e.lon) })).filter((e) => e.d <= 5000).sort((a, b) => a.d - b.d);
  const avecAir = proches.filter((e) => parEtab.get(e.id)?.some((x) => x.milieu === "Air"));
  const plus = avecAir[0];
  // ADEME 2019 dans le même rayon, comme le fait getIrepNearPoint (bbox puis distance).
  const deg = 5000 / 111000;
  const u = `${ADEME}/lines?bbox=${p.lon - deg},${p.lat - deg},${p.lon + deg},${p.lat + deg}&size=100&select=identifiant,nom_etablissement,latitude,longitude,nombre_polluants`;
  const a = tryJson((await timedFetch(u)).body)?.results ?? [];
  const ademe5 = a.filter((x) => haversineM(p.lat, p.lon, x.latitude, x.longitude) <= 5000).length;
  autour.push({
    id: p.id,
    officiel2024_5km: proches.length,
    officiel2024_5km_avecAirChiffre: avecAir.length,
    officiel2024_1km: proches.filter((e) => e.d <= 1000).length,
    ademe2019_5km: ademe5,
    plusProcheAvecAir: plus ? {
      nom: plus.nom, dist_m: Math.round(plus.d), activite: plus.ape,
      principauxRejetsAir: parEtab.get(plus.id).filter((x) => x.milieu === "Air").sort((x, y) => y.kg - x.kg).slice(0, 4).map((x) => `${x.polluant} : ${Math.round(x.kg).toLocaleString("fr-FR")} kg/an`),
    } : null,
  });
  await sleep(80);
}

// ── 5. La page publique rejouée : `PollutionLookup` interroge l'extrait ADEME à 10 km du CENTRE de la
// commune (`/api/proxy/irep` → getIrepNearPoint(lat, lon, 10000)) et, sur zéro résultat, affiche
// « Aucune installation industrielle classée ICPE recensée dans un rayon de 10 km… ». On rejoue cet
// appel pour les communes de l'échantillon et on compte le registre officiel dans le même rayon.
const page = [];
for (const insee of [...new Set(ech.map((p) => p.citycode).filter((c) => c && !c.startsWith("97")))]) {
  const g = tryJson((await timedFetch(`https://geo.api.gouv.fr/communes/${insee}?fields=nom,centre`)).body);
  if (!g?.centre) continue;
  const [lon, lat] = g.centre.coordinates, deg = 10000 / 111000;
  const a = tryJson((await timedFetch(`${ADEME}/lines?bbox=${lon - deg},${lat - deg},${lon + deg},${lat + deg}&size=50&select=latitude,longitude`)).body)?.results ?? [];
  const ademe10 = a.filter((x) => haversineM(lat, lon, x.latitude, x.longitude) <= 10000).length;
  const off = geo.filter((e) => haversineM(lat, lon, e.lat, e.lon) <= 10000);
  page.push({ insee, nom: g.nom, extraitAdeme10kmCentre: ademe10, registre2024_10kmCentre: off.length, dontRejetAirChiffre: off.filter((e) => parEtab.get(e.id)?.some((x) => x.milieu === "Air")).length, phraseDeVideAffichee: ademe10 === 0 });
  await sleep(80);
}

const res = {
  genere: new Date().toISOString(),
  officiel: {
    source: `https://files.georisques.fr/irep/${ANNEE}.zip`, annee: ANNEE,
    etablissements: etabs.length, sansCoordonnees: sansCoord, systemesCoordonnees: epsg,
    etablissementsAuMemePointQuUnAutre: coordPartagees,
    lignesEmissions: emissions.length, emissionsChiffrees: chiffrees, emissionsSousSeuil: sousSeuil,
    lignesChiffreesParMilieu: milieux,
    etablissementsAvecUnRejetAirChiffre: avecAirChiffre,
    polluantsAirLesPlusDeclares: Object.entries(polluantsAir).sort((a, b) => b[1] - a[1]).slice(0, 15),
    etablissementsElevage: elevages,
  },
  ademe: {
    titre: meta?.title, lignes: meta?.count, millesimeDeclare: meta?.description?.match(/\*\*Year:\*\*\s*(\d{4})/)?.[1] ?? null,
    champs: meta?.schema?.map((f) => f.key).filter((k) => !k.startsWith("_")),
  },
  autourDesPoints: autour,
  pagePubliqueRejouee: page,
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(res, null, 1));
console.log(JSON.stringify({ officiel: res.officiel, ademe: { ...res.ademe, champs: undefined } }, null, 1));
for (const x of page.filter((x) => x.phraseDeVideAffichee)) console.log(`PAGE PUBLIQUE ${x.nom} : extrait 0 → phrase « aucune installation » ; registre 2024 à 10 km : ${x.registre2024_10kmCentre} (${x.dontRejetAirChiffre} avec rejet air chiffré)`);
for (const a of autour) console.log(`${a.id}: officiel ${a.officiel2024_5km} (air ${a.officiel2024_5km_avecAirChiffre}) / ADEME ${a.ademe2019_5km} — ${a.plusProcheAvecAir ? `${a.plusProcheAvecAir.nom} à ${a.plusProcheAvecAir.dist_m} m` : "-"}`);
