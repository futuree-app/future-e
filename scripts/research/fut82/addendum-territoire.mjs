#!/usr/bin/env node
/**
 * FUT-82, addendum par échelle : deux candidates relues au grain de la COMMUNE, celui du comparateur.
 *
 *   1. Mémoire des feux (BDIFF) face aux paliers « feu » que le comparateur affiche déjà
 *      (`faible_risque_feu` = 100 − percentile de NORIFM40_yr, jours d'indice forêt-météo > 40,
 *      horizon 2050 à +2 °C ; paliers ≥ 66 / 34-65 / < 34, `comparateur-vie.ts`).
 *   2. Fibre par commune (ARCEP, fichier « Commune » trimestriel, 33 Mo) : l'audit initial n'avait
 *      regardé que le fichier par immeuble (835 Mo).
 *
 *   node scripts/research/fut82/addendum-territoire.mjs --bdiff <tmp>/bdiff-communes-complet.json [--tmp <dossier>]
 *
 * L'agrégat BDIFF par commune vient de `bdiff-export.mjs` et reste HORS dépôt (licence à arbitrer) :
 * on ne publie ici que des totaux et les communes citées dans l'addendum.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { gunzipSync } from "node:zlib";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parseArgs } from "./lib.mjs";

const args = parseArgs(process.argv);
if (!args.bdiff) throw new Error("--bdiff <bdiff-communes-complet.json> requis (sortie de bdiff-export.mjs)");
const TMP = args.tmp ?? join(tmpdir(), "fut82-arcep");
const OUT = args.out ?? "docs/audits/2026-10-27-fut82/mesures/addendum-territoire.json";
const CITEES = ["29016", "29162", "29103", "15138", "63072", "33529", "83063", "83065"];

const index = JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz"))).communes;
const bdiffBrut = JSON.parse(readFileSync(args.bdiff, "utf8"));
const bdiff = bdiffBrut.communes ?? bdiffBrut;

// ── 1. BDIFF × paliers feu ──────────────────────────────────────────────────────────────────
const palier = (pct) => { const s = 100 - pct; return s >= 66 ? "faible" : s < 34 ? "eleve" : "modere"; };
const feu = {};
for (const c of index) {
  const pct = c.pct?.NORIFM40_yr;
  if (pct == null) continue;
  const p = palier(pct), x = bdiff[c.insee] ?? {};
  const a = (feu[p] ??= { communes: 0, population: 0, avecFeu: 0, avecFeuPlus1ha: 0, avecFeuPlus10ha: 0, populationFeuPlus10ha: 0, avecFeuPlus100ha: 0 });
  a.communes++; a.population += c.population ?? 0;
  if ((x.n ?? 0) > 0) a.avecFeu++;
  if ((x.n1ha ?? 0) > 0) a.avecFeuPlus1ha++;
  if ((x.n10ha ?? 0) > 0) { a.avecFeuPlus10ha++; a.populationFeuPlus10ha += c.population ?? 0; }
  if ((x.maxHa ?? 0) >= 100) a.avecFeuPlus100ha++;
}
const faiblesBrules = index
  .filter((c) => c.pct?.NORIFM40_yr != null && palier(c.pct.NORIFM40_yr) === "faible" && (bdiff[c.insee]?.maxHa ?? 0) >= 100)
  .map((c) => ({ insee: c.insee, nom: c.nom, dept: c.dept, plusGrandFeuHa: bdiff[c.insee].maxHa }))
  .sort((a, b) => b.plusGrandFeuHa - a.plusGrandFeuHa);
const parDept = {};
for (const f of faiblesBrules) parDept[f.dept] = (parDept[f.dept] ?? 0) + 1;

// ── 2. ARCEP, fichier communal ──────────────────────────────────────────────────────────────
mkdirSync(TMP, { recursive: true });
const zip = join(TMP, "commune.zip");
if (!existsSync(zip)) {
  const meta = await (await fetch("https://www.data.gouv.fr/api/1/datasets/le-marche-du-haut-et-tres-haut-debit-fixe-deploiements/")).json();
  const res = meta.resources.filter((r) => /-Commune$/.test(r.title)).sort((a, b) => b.title.localeCompare(a.title))[0];
  writeFileSync(zip, Buffer.from(await (await fetch(res.url)).arrayBuffer()));
  writeFileSync(join(TMP, "millesime.txt"), res.title);
}
execFileSync("unzip", ["-o", "-q", zip, "-d", join(TMP, "extrait")]);
const dbfPath = join(TMP, "extrait", readdirSync(join(TMP, "extrait")).find((f) => f.endsWith(".dbf")));

/** Lecteur DBF minimal (dBase III) : champs texte et numériques, encodage latin1 constaté. */
function lireDbf(buf) {
  const n = buf.readUInt32LE(4), hl = buf.readUInt16LE(8), rl = buf.readUInt16LE(10);
  const champs = [];
  for (let o = 32; buf[o] !== 0x0d; o += 32) champs.push({ nom: buf.toString("latin1", o, o + 11).replace(/\0.*$/, ""), long: buf[o + 16] });
  const lignes = [];
  for (let i = 0; i < n; i++) {
    let pos = hl + i * rl + 1;
    const l = {};
    for (const ch of champs) { l[ch.nom] = buf.toString("latin1", pos, pos + ch.long).trim(); pos += ch.long; }
    lignes.push(l);
  }
  return lignes;
}
const arcep = lireDbf(readFileSync(dbfPath));
const tranche = (t) => (t < 0.5 ? "<50" : t < 0.8 ? "50-80" : t < 0.95 ? "80-95" : ">=95");
const fibre = { communes: {}, populationPct: {} };
let popTot = 0;
const popT = {}, sous80ParDept = {}, communesParDept = {};
for (const r of arcep) {
  const L = Number(r.Locaux), F = Number(r.ftth), P = Number(r.POPULATION) || 0;
  if (!(L > 0)) continue;
  const t = tranche(F / L);
  fibre.communes[t] = (fibre.communes[t] ?? 0) + 1;
  popT[t] = (popT[t] ?? 0) + P; popTot += P;
  communesParDept[r.INSEE_DEP] = (communesParDept[r.INSEE_DEP] ?? 0) + 1;
  if (F / L < 0.8) sous80ParDept[r.INSEE_DEP] = (sous80ParDept[r.INSEE_DEP] ?? 0) + 1;
}
for (const [t, v] of Object.entries(popT)) fibre.populationPct[t] = Math.round((1000 * v) / popTot) / 10;
fibre.departementsLesPlusConcernes = Object.keys(communesParDept)
  .map((d) => [d, Math.round((100 * (sous80ParDept[d] ?? 0)) / communesParDept[d])])
  .sort((a, b) => b[1] - a[1]).slice(0, 10);
fibre.departementsSansCommuneSous80 = Object.keys(communesParDept).filter((d) => !sous80ParDept[d]).length;
fibre.millesime = existsSync(join(TMP, "millesime.txt")) ? readFileSync(join(TMP, "millesime.txt"), "utf8") : null;

// ── Communes citées dans l'addendum ─────────────────────────────────────────────────────────
const parInsee = new Map(index.map((c) => [c.insee, c]));
const arcepParInsee = new Map(arcep.map((r) => [r.INSEE_COM, r]));
const citees = CITEES.map((i) => {
  const c = parInsee.get(i), x = bdiff[i] ?? {}, r = arcepParInsee.get(i);
  return {
    insee: i, nom: c?.nom, palierFeu: c ? palier(c.pct.NORIFM40_yr) : null, natureScore: c?.nature?.score ?? null,
    prixAchat: c?.logement?.achat?.niveau ?? null,
    bdiff: { feux: x.n ?? 0, plusGrandHa: x.maxHa ?? 0, dernier: x.dernier ?? null },
    fibrePct: r && Number(r.Locaux) > 0 ? Math.round((100 * Number(r.ftth)) / Number(r.Locaux)) : null,
  };
});

const res = { genere: new Date().toISOString(), feuParPalier: feu, faiblesAvecFeuPlus100ha: { total: faiblesBrules.length, parDepartement: parDept, cinqPlusGrands: faiblesBrules.slice(0, 5) }, fibre, citees };
writeFileSync(OUT, JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1));
