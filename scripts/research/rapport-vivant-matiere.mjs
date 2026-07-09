#!/usr/bin/env node
/**
 * De quoi un « rapport vivant » vivrait-il reellement ?
 *
 * Pour un echantillon de communes tire au prorata de la POPULATION (donc representatif d'un
 * lecteur, pas d'une commune), compte sur une fenetre de N mois les changements REELS :
 * faits dates, sourcés d'un acte ou d'une mesure officielle, rattaches a la commune.
 *
 * MOUVEMENTS (durables, deplacent la lecture du lieu)
 *   - creation ICPE      AP d'autorisation / AP enregistrement        (corpus du crawl)
 *   - servitude / sol    SIS ou SUP dont la date_maj tombe dedans     (dump national)
 *   - PPR                prescription / approbation / abrogation      (Gaspar, detail par procedure)
 *   - mouvement terrain  effondrement, glissement, date_debut         (Georisques /mvt)
 *
 * ETATS (temporaires, ont une date de fin)
 *   - CatNat             arrete de catastrophe naturelle              (Gaspar)
 *   - secheresse         restriction d'eau en cours                   (Vigieau)
 *   - eau potable        prelevement NON conforme                     (Hub'Eau / ARS)
 *
 * EXCLUS volontairement : les millesimes de referentiel (BPE, INSEE, DRIAS) qui bougent toutes
 * les communes le meme jour, et les diffs d'annuaire (ecoles, OSM) qui produisent des evenements
 * fantomes. `dateModification` de Gaspar est une date de MISE A JOUR DE BASE, jamais un evenement.
 *
 *   node scripts/research/rapport-vivant-matiere.mjs --mois 12 --out tmp/fil/rapport-vivant.json
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a, i, all) => (a.startsWith("--") ? [[a.slice(2), all[i + 1]]] : [])),
);
const MOIS = Number(args.mois ?? 12);
const OUT = args.out ?? "tmp/fil/rapport-vivant.json";
// Pas de Date.now() : la fenetre est ancree sur la date du crawl, passee en clair.
const AUJOURDHUI = args.aujourdhui ?? "2026-07-09";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const [Y, M, D] = AUJOURDHUI.split("-").map(Number);
const SEUIL = new Date(Date.UTC(Y, M - 1 - MOIS, D));
const SEUIL_ISO = SEUIL.toISOString().slice(0, 10);

const parseFr = (s) => {
  const [d, m, y] = (s ?? "").split("/").map(Number);
  return d && m && y ? new Date(Date.UTC(y, m - 1, d)) : null;
};
const parseIso = (s) => (s ? new Date(`${String(s).slice(0, 10)}T00:00:00Z`) : null);
const dansFenetre = (d) => d instanceof Date && !Number.isNaN(+d) && d >= SEUIL;

async function json(url, attempt = 0) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (res.status === 429 && attempt < 4) {
      await sleep(2500 * (attempt + 1));
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

const GEO = "https://www.georisques.gouv.fr/api/v1";

// ---- sources locales, deja sur disque ----
const prox = JSON.parse(readFileSync("tmp/fil/sup-sis-proximite.json", "utf8"));
const sample = prox.rows;

const creations = new Map();
const crawled = new Set();
{
  const lines = readFileSync("tmp/icpe-a-half-10000.events.csv", "utf8").split("\n");
  const head = lines[0].split(",");
  const iInsee = head.indexOf("insee");
  for (const line of lines.slice(1)) {
    if (!line) continue;
    const insee = line.split(",")[iInsee];
    crawled.add(insee);
    if (/AP (d'autorisation|enregistrement)/.test(line)) creations.set(insee, (creations.get(insee) ?? 0) + 1);
  }
}

const servitudes = new Map();
{
  const dump = JSON.parse(readFileSync("tmp/fil/sup-sis-communes.json", "utf8"));
  for (const r of dump.records) {
    if (dansFenetre(parseIso(r.date_maj))) servitudes.set(r.insee, (servitudes.get(r.insee) ?? 0) + 1);
  }
}

// ---- sources distantes ----
const catnat = async (insee) => {
  const j = await json(`${GEO}/gaspar/catnat?code_insee=${insee}&page_size=100`);
  if (!j) return null;
  return (j.data ?? []).filter((x) => dansFenetre(parseFr(x.date_publication_arrete))).length;
};

const mvt = async (insee) => {
  const j = await json(`${GEO}/mvt?code_insee=${insee}&page_size=100`);
  if (!j) return null;
  return (j.data ?? []).filter((x) => dansFenetre(parseIso(x.date_debut))).length;
};

/** Les dates vivent dans le detail : un appel de liste, puis un appel par procedure. */
async function ppr(insee) {
  let total = 0;
  for (const modele of ["pprn", "pprt", "pprm"]) {
    const liste = await json(`${GEO}/gaspar/${modele}?codeInsee=${insee}&page_size=30`);
    if (!liste) return null;
    for (const p of liste.content ?? []) {
      const detail = await json(`${GEO}/gaspar/${modele}/${p.idGaspar}`);
      if (!detail) continue;
      const dates = [];
      const walk = (o) => {
        if (Array.isArray(o)) o.forEach(walk);
        else if (o && typeof o === "object") {
          for (const [k, v] of Object.entries(o)) {
            if (/^date(Approbation|Prescription|Abrog|Annulation)$/.test(k) && typeof v === "string") dates.push(v);
            else walk(v);
          }
        }
      };
      walk(detail);
      if (dates.some((d) => dansFenetre(parseFr(d)))) total++;
      await sleep(90);
    }
  }
  return total;
}

/** Vigieau : etat en cours (vigilance / alerte / crise), pas un evenement date. */
const secheresse = async (insee) => {
  const j = await json(`https://api.vigieau.beta.gouv.fr/api/zones?commune=${insee}`);
  if (!Array.isArray(j)) return null;
  return j.filter((z) => z.niveauGravite && z.niveauGravite !== "pas_restriction").length;
};

/** Hub'Eau : un prelevement dont la conclusion ARS mentionne une non-conformite. */
const eauPotable = async (insee) => {
  const j = await json(
    `https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?code_commune=${insee}` +
      `&date_min_prelevement=${SEUIL_ISO}&size=2000&fields=date_prelevement,conclusion_conformite_prelevement`,
  );
  if (!j) return null;
  const nonConformes = new Set();
  for (const x of j.data ?? []) {
    const c = (x.conclusion_conformite_prelevement ?? "").toLowerCase();
    if (c.includes("non conforme")) nonConformes.add(x.date_prelevement);
  }
  return nonConformes.size;
};

const rows = [];
for (const c of sample) {
  const [cat, terrain, plans, sech, eau] = await Promise.all([
    catnat(c.insee), mvt(c.insee), ppr(c.insee), secheresse(c.insee), eauPotable(c.insee),
  ]);
  const crea = crawled.has(c.insee) ? (creations.get(c.insee) ?? 0) : null;
  const serv = servitudes.get(c.insee) ?? 0;

  const mouvements = (crea ?? 0) + serv + (plans ?? 0) + (terrain ?? 0);
  const etats = (cat ?? 0) + (sech ?? 0) + (eau ?? 0);
  const failed = [cat, terrain, plans, sech, eau].some((v) => v === null);

  rows.push({ insee: c.insee, nom: c.nom, population: c.population,
    creation_icpe: crea, servitude_maj: serv, ppr: plans, mvt: terrain,
    catnat: cat, secheresse: sech, eau_non_conforme: eau,
    mouvements, etats, lignes: mouvements + etats,
    fetch_status: failed ? "partial_or_failed" : "ok" });
  process.stderr.write(`${c.nom}: mouv=${mouvements} etats=${etats}\n`);
  await sleep(120);
}

const ok = rows.filter((r) => r.fetch_status === "ok");
const popTot = ok.reduce((t, r) => t + r.population, 0);
const part = (pred) => {
  const s = ok.filter(pred);
  return { n: s.length, pop: s.reduce((t, r) => t + r.population, 0) / popTot };
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ fenetre_mois: MOIS, ancre: AUJOURDHUI, rows }, null, 1));

const any = part((r) => r.lignes > 0);
const mouv = part((r) => r.mouvements > 0);
const eta = part((r) => r.etats > 0);
console.log(`\nfenetre ${MOIS} mois, ancree au ${AUJOURDHUI} | communes exploitables : ${ok.length}/${rows.length}\n`);
console.log(`  AU MOINS UNE ligne       : ${any.n}/${ok.length} communes  (${(any.pop * 100).toFixed(0)} % des lecteurs)`);
console.log(`    dont un MOUVEMENT      : ${mouv.n}/${ok.length}          (${(mouv.pop * 100).toFixed(0)} % des lecteurs)`);
console.log(`    dont un ETAT           : ${eta.n}/${ok.length}          (${(eta.pop * 100).toFixed(0)} % des lecteurs)\n`);
for (const k of ["servitude_maj", "creation_icpe", "ppr", "mvt", "catnat", "secheresse", "eau_non_conforme"]) {
  const n = ok.filter((r) => (r[k] ?? 0) > 0).length;
  const tot = ok.reduce((t, r) => t + (r[k] ?? 0), 0);
  console.log(`  ${k.padEnd(18)} ${String(n).padStart(3)} communes, ${String(tot).padStart(4)} lignes`);
}
const tri = [...ok].sort((a, b) => a.lignes - b.lignes);
console.log(`\nlignes pour la commune mediane : ${tri[Math.floor(ok.length / 2)].lignes}`);
console.log(`ecrit : ${OUT}`);
