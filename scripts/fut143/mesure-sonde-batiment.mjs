#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-143 · UNE SONDE « MÊME BÂTIMENT » AVANT ACHAT : CE QU'ELLE COÛTE, CE QU'ELLE CHANGE.
//
// La qualification (`/api/dossier/qualification`) ne cherche aujourd'hui qu'à l'identifiant BAN exact
// (`probeDpeByBanId`, deux appels ADEME). Le dossier payé cherche AUSSI les diagnostics du même bâtiment
// RNB (`lookupBatimentByBanId` puis `lookupDpeMemeBatiment`), quand le référentiel désigne un seul
// bâtiment. Ce script rejoue les deux chemins, sans cache, pour mesurer :
//   - la latence ajoutée (RNB puis ADEME par `id_rnb`, deux jeux, enchaînés comme dans le dossier) ;
//   - les échecs (une sonde fragile ne doit pas devenir une promesse) ;
//   - la part des adresses « aucun diagnostic à l'adresse » qui ont des candidats DE LOGEMENT au même
//     bâtiment, c'est-à-dire la part où le message avant achat changerait.
//
// Lecture seule, sources publiques sans jeton (ADEME data-fair, RNB). Débit borné : 2 adresses en
// parallèle, 150 ms entre deux adresses. Les règles de tri (grain, même bâtiment, identité RNB) sont
// celles de PRODUCTION, importées depuis `src/lib`.
//
// Usage : node scripts/fut143/mesure-sonde-batiment.mjs [--par-strate 15] [--graine 143]
//           > docs/audits/2026-10-26-fut143/mesure-sonde-batiment.json
// ════════════════════════════════════════════════════════════════════════════════════════════

import { readFileSync } from "node:fs";
import { grainDpe } from "../../src/lib/dpe-grain.ts";
import { identiteDepuisRnb } from "../../src/lib/batiment-rnb.ts";
import { memeBatimentSeulement } from "../../src/lib/dpe-meme-batiment.ts";

const ARG = process.argv.slice(2);
const opt = (nom, def) => { const i = ARG.indexOf(nom); return i >= 0 ? Number.parseInt(ARG[i + 1], 10) : def; };
const PAR_STRATE = opt("--par-strate", 15);
let graine = opt("--graine", 143);
const alea = () => { graine = (graine * 1103515245 + 12345) & 0x7fffffff; return graine / 0x7fffffff; };

const ADEME = "https://data.ademe.fr/data-fair/api/v1/datasets";
const DS = [`${ADEME}/dpe03existant`, `${ADEME}/dpe02neuf`];
const RNB = "https://rnb-api.beta.gouv.fr/api/alpha/buildings/";
const SELECT = "numero_dpe,identifiant_ban,type_batiment,methode_application_dpe,date_etablissement_dpe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function chrono(fn) {
  const t = performance.now();
  try { return { ok: true, v: await fn(), ms: Math.round(performance.now() - t) }; }
  catch (e) { return { ok: false, err: String(e?.name ?? e), ms: Math.round(performance.now() - t) }; }
}

async function json(url, delai) {
  const res = await fetch(url, { signal: AbortSignal.timeout(delai), cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Le chemin d'aujourd'hui : `probeDpeByBanId`.
async function sondeExacte(banId) {
  let echec = false, n = 0;
  for (const ds of DS) {
    const u = new URL(`${ds}/lines`);
    u.searchParams.set("qs", `identifiant_ban:"${banId}"`); u.searchParams.set("size", "5"); u.searchParams.set("select", "numero_dpe");
    try { n += ((await json(u, 6000)).results ?? []).length; } catch { echec = true; }
  }
  return n > 0 ? "found" : echec ? "unavailable" : "none";
}

async function sondeRnb(banId) {
  const u = new URL(RNB); u.searchParams.set("cle_interop_ban", banId); u.searchParams.set("limit", "100");
  return identiteDepuisRnb(await json(u, 5000), new Date().toISOString());
}

// Le chemin du dossier : `lookupDpeMemeBatiment`, les deux jeux enchaînés.
async function sondeMemeBatiment(rnbId, banId) {
  const lignes = []; let echec = false, tronque = false;
  for (const ds of DS) {
    const u = new URL(`${ds}/lines`);
    u.searchParams.set("qs", `id_rnb:"${rnbId}"`); u.searchParams.set("size", "50");
    u.searchParams.set("sort", "-date_etablissement_dpe"); u.searchParams.set("select", SELECT);
    try {
      const j = await json(u, 8000);
      if (typeof j.total !== "number" || j.total > (j.results ?? []).length) tronque = true;
      for (const r of j.results ?? []) lignes.push({
        id_dpe: r.numero_dpe, id_ban: r.identifiant_ban ?? null, type_batiment: r.type_batiment ?? null,
        methode_dpe: r.methode_application_dpe ?? null, date_dpe: r.date_etablissement_dpe ?? null,
        etiquette_dpe: null, surface_m2: null, etage: null, complement: null,
      });
    } catch { echec = true; }
  }
  const autres = memeBatimentSeulement(lignes, banId);
  const logements = autres.filter((d) => grainDpe(d) === "logement").length;
  const immeubles = autres.filter((d) => grainDpe(d) === "immeuble").length;
  return { echec, tronque, logements, immeubles };
}

// ── L'échantillon : le tirage uniforme du 31/07 (par strate) + les cas témoins FUT-80 ──
const tirage = JSON.parse(readFileSync("docs/audits/mesure-dpe-2026-07-31-adresses.json", "utf8")).adresses;
const parStrate = new Map();
for (const a of tirage) { if (!parStrate.has(a.strate)) parStrate.set(a.strate, []); parStrate.get(a.strate).push(a); }
const echantillon = [];
for (const [strate, liste] of parStrate) {
  const copie = [...liste];
  for (let i = 0; i < PAR_STRATE && copie.length; i++) echantillon.push({ ...copie.splice(Math.floor(alea() * copie.length), 1)[0], strate });
}
for (const f of ["villeurbanne_angle", "monchaux_auto", "thenac_contradiction", "puyravault_ambigu", "la_couarde_maison", "bordeaux_aucun", "la_rochelle_trois_batiments"]) {
  const fx = JSON.parse(readFileSync(`src/lib/__fixtures__/fut80/${f}.json`, "utf8"));
  echantillon.push({ banId: fx.ban, label: fx.label, strate: `temoin:${f}` });
}

const lignes = [];
async function traiter(a) {
  const exacte = await chrono(() => sondeExacte(a.banId));
  const rnb = await chrono(() => sondeRnb(a.banId));
  const statut = rnb.ok ? rnb.v.statut : "indisponible";
  let bat = null;
  if (statut === "confirme") bat = await chrono(() => sondeMemeBatiment(rnb.v.batiment.rnb_id, a.banId));
  lignes.push({
    banId: a.banId, label: a.label, strate: a.strate,
    exacte: exacte.ok ? exacte.v : "erreur", ms_exacte: exacte.ms,
    rnb: statut, ms_rnb: rnb.ms,
    ...(rnb.ok && statut === "ambigu" ? { batiments: rnb.v.batiments.length } : {}),
    ...(bat ? { ms_batiment: bat.ms, batiment: bat.ok ? bat.v : { echec: true } } : {}),
    // Ce que la sonde ajouterait, ENCHAÎNÉE après la RNB (la sonde exacte et le cadastre tournent en parallèle).
    ms_ajout_chaine: rnb.ms + (bat?.ms ?? 0),
  });
  process.stderr.write(`· ${a.label} : exacte=${exacte.ok ? exacte.v : "erreur"} rnb=${statut}${bat?.ok ? ` logements=${bat.v.logements} immeubles=${bat.v.immeubles}` : ""} (${rnb.ms + (bat?.ms ?? 0)} ms)\n`);
}

const file = [...echantillon];
await Promise.all([0, 1].map(async () => {
  while (file.length) { await traiter(file.shift()); await sleep(150); }
}));

const q = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };
const tirees = lignes.filter((l) => !l.strate.startsWith("temoin:"));
const sansExact = tirees.filter((l) => l.exacte === "none");
const avecCandidats = sansExact.filter((l) => (l.batiment?.logements ?? 0) > 0);
const immeubleSeul = sansExact.filter((l) => l.batiment && !l.batiment.echec && l.batiment.logements === 0 && l.batiment.immeubles > 0);
const chaine = lignes.map((l) => l.ms_ajout_chaine);
console.log(JSON.stringify({
  date: new Date().toISOString(),
  echantillon: { tirees: tirees.length, temoins: lignes.length - tirees.length, par_strate: PAR_STRATE, graine: opt("--graine", 143) },
  latence_ms: {
    exacte: { mediane: q(lignes.map((l) => l.ms_exacte), 0.5), p95: q(lignes.map((l) => l.ms_exacte), 0.95) },
    rnb: { mediane: q(lignes.map((l) => l.ms_rnb), 0.5), p95: q(lignes.map((l) => l.ms_rnb), 0.95) },
    batiment: { mediane: q(lignes.filter((l) => l.ms_batiment).map((l) => l.ms_batiment), 0.5), p95: q(lignes.filter((l) => l.ms_batiment).map((l) => l.ms_batiment), 0.95) },
    chaine_ajoutee: { mediane: q(chaine, 0.5), p95: q(chaine, 0.95), max: Math.max(...chaine) },
  },
  echecs: {
    exacte: lignes.filter((l) => l.exacte === "unavailable" || l.exacte === "erreur").length,
    rnb: lignes.filter((l) => l.rnb === "indisponible").length,
    batiment: lignes.filter((l) => l.batiment?.echec).length,
  },
  rnb_statuts: Object.fromEntries([...new Set(tirees.map((l) => l.rnb))].map((s) => [s, tirees.filter((l) => l.rnb === s).length])),
  sans_dpe_exact: {
    adresses: sansExact.length,
    avec_candidats_logement_meme_batiment: avecCandidats.length,
    immeuble_seul: immeubleSeul.length,
  },
  lignes,
}, null, 2));
