#!/usr/bin/env node
/**
 * populate-logement.mjs — signal logement (achat + location), NARRATIF non scoré.
 *
 * POURQUOI. Première question posée dès qu'on montre le produit : « est-ce que je
 * peux raisonnablement me loger ici ? ». Doctrine actée (LOGEMENT_TERRITORIAL.md) :
 * logement = MODULE, pas critère de classement. Le comparateur n'a besoin que d'un
 * NIVEAU DE PRIX RELATIF, pas d'un chiffre, pas d'accessibilité (revenu = biais,
 * réservé au futur module). Deux signaux SÉPARÉS : achat, location.
 *
 * SOURCES (publiques, automatisables, cf. arbitrage Option B).
 *  - Achat  : DVF (DGFiP / Etalab geo-dvf), médian €/m² auto-agrégé. Le CEREMA DV3F
 *             (pré-agrégé) n'est pas automatisable pour un produit privé (Box / API
 *             réservée acteurs publics) ; il reste la source du futur module
 *             (accessibilité). Trou DVF : Alsace-Moselle (57/67/68) + Mayotte, géré
 *             proprement (achat « non disponible », jamais « moyen »).
 *  - Location : Carte des loyers (Ministère / ANIL), loyer €/m² charges comprises,
 *             communal national (Alsace-Moselle incluse), avec drapeau de fiabilité.
 *
 * MAILLE (validée panel + national). Achat : commune si >= SEUIL ventes/type sur la
 * fenêtre, sinon repli EPCI, sinon « au-delà » (rare : ~0% maison, ~2% appart).
 * Location : commune (ANIL impute déjà les petites communes ; on porte le drapeau).
 *
 * SIGNAL. Niveau de prix relatif en 5 paliers par percentiles nationaux
 * (déciles/tiers) : tres_bas | bas | moyen | haut | tres_haut. « moyen » = silence
 * au comparateur. Un libellé UNIQUE « immobilier » côté comparateur (moyenne des
 * percentiles maison + appartement) ; le détail maison/appartement, les médianes,
 * la maille et la fiabilité vivent dans l'index pour le RAPPORT.
 *
 * Idempotent : (re)calcule et patche le champ `logement` de chaque commune de
 * data/comparateur-index.json. Raw caches sous data/cache-logement/ (gitignorés).
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import readline from "node:readline";

const ROOT = process.cwd();
const CACHE = path.join(ROOT, "data", "cache-logement");
const INDEX = path.join(ROOT, "data", "comparateur-index.json");
const YEARS = [2021, 2022, 2023, 2024]; // fenêtre glissante geo-dvf "latest"
const SEUIL = 10; // ventes/type pour un médian commune-level (sinon repli)

// 5 paliers par percentile national (déciles aux extrêmes, tiers au centre).
function niveauFromPct(pct) {
  if (pct == null) return null;
  if (pct >= 0.9) return "tres_haut";
  if (pct >= 0.66) return "haut";
  if (pct >= 0.34) return "moyen"; // silence au comparateur
  if (pct >= 0.1) return "bas";
  return "tres_bas";
}

async function ensureRaw() {
  await fsp.mkdir(CACHE, { recursive: true });
  // DVF par année (full national, ~90-120 Mo gz chacun)
  for (const y of YEARS) {
    const f = path.join(CACHE, `dvf_${y}.csv.gz`);
    if (!fs.existsSync(f)) {
      console.error(`fetch DVF ${y}...`);
      const r = await fetch(`https://files.data.gouv.fr/geo-dvf/latest/csv/${y}/full.csv.gz`);
      if (!r.ok) throw new Error(`DVF ${y}: HTTP ${r.status}`);
      await fsp.writeFile(f, Buffer.from(await r.arrayBuffer()));
    }
  }
  // Carte des loyers ANIL (CSV ; ids data.gouv stables)
  const anil = { appart: "55b34088-0964-415f-9df7-d87dd98a09be", maison: "129f764d-b613-44e4-952c-5ff50a8c9b73" };
  for (const [k, id] of Object.entries(anil)) {
    const f = path.join(CACHE, `loyers_${k}.csv`);
    if (!fs.existsSync(f)) {
      console.error(`fetch loyers ${k}...`);
      const r = await fetch(`https://www.data.gouv.fr/api/1/datasets/r/${id}`);
      if (!r.ok) throw new Error(`ANIL ${k}: HTTP ${r.status}`);
      await fsp.writeFile(f, Buffer.from(await r.arrayBuffer()));
    }
  }
}

// Agrégation DVF : par commune, listes de €/m² (maison, appartement).
function parseDvf(file, achat) {
  return new Promise((res) => {
    const rl = readline.createInterface({ input: fs.createReadStream(file).pipe(zlib.createGunzip()) });
    let H = null, I = {};
    const seen = new Set(); // dedup mutation (par fichier-année)
    rl.on("line", (l) => {
      if (H === null) {
        H = l.split(",");
        const g = (n) => H.indexOf(n);
        I = { c: g("code_commune"), t: g("type_local"), v: g("valeur_fonciere"), s: g("surface_reelle_bati"), n: g("nature_mutation"), id: g("id_mutation") };
        return;
      }
      const c = l.split(",");
      if (c[I.n] !== "Vente") return;
      const t = c[I.t];
      if (t !== "Appartement" && t !== "Maison") return;
      const v = parseFloat(c[I.v]), s = parseFloat(c[I.s]);
      if (!(v > 0) || !(s > 0)) return;
      if (seen.has(c[I.id])) return;
      seen.add(c[I.id]);
      const pm = v / s;
      if (pm < 300 || pm > 20000) return; // garde-fou aberrants
      (achat[c[I.c]] ??= { maison: [], appart: [] })[t === "Maison" ? "maison" : "appart"].push(pm);
    });
    rl.on("close", res);
  });
}

const median = (a) => {
  if (!a.length) return null;
  const b = [...a].sort((x, y) => x - y);
  const m = b.length >> 1;
  return Math.round(b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2);
};

// proportion des valeurs <= v dans un tableau trié
function pctRank(sorted, v) {
  let lo = 0, hi = sorted.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (sorted[mid] <= v) lo = mid + 1; else hi = mid; }
  return sorted.length ? lo / sorted.length : null;
}

function readAnil(file, epci, loy, key) {
  const L = fs.readFileSync(file, "latin1").split(/\r?\n/);
  const h = L[0].split(";").map((s) => s.replace(/"/g, ""));
  const iI = h.indexOf("INSEE_C"), iE = h.indexOf("EPCI"), iL = h.indexOf("loypredm2"), iT = h.indexOf("TYPPRED");
  for (let k = 1; k < L.length; k++) {
    if (!L[k]) continue;
    const c = L[k].split(";").map((s) => s.replace(/^"|"$/g, ""));
    const insee = c[iI];
    if (epci) epci[insee] = c[iE];
    (loy[insee] ??= {})[key] = parseFloat((c[iL] || "").replace(",", ".")) || null;
    loy[insee].typ = c[iT]; // "commune" (observée) | "maille" (estimée)
  }
}

async function main() {
  await ensureRaw();

  // 1) Achat : agrégation DVF nationale.
  const achat = {};
  for (const y of YEARS) {
    console.error(`agrège DVF ${y}...`);
    await parseDvf(path.join(CACHE, `dvf_${y}.csv.gz`), achat);
  }

  // 2) Location + EPCI depuis ANIL.
  const epci = {}, loy = {};
  readAnil(path.join(CACHE, "loyers_appart.csv"), epci, loy, "appart");
  readAnil(path.join(CACHE, "loyers_maison.csv"), null, loy, "maison");

  // EPCI agrégé (repli achat)
  const epciArr = {};
  for (const code in achat) {
    const e = epci[code];
    if (!e) continue;
    (epciArr[e] ??= { maison: [], appart: [] });
    epciArr[e].maison.push(...achat[code].maison);
    epciArr[e].appart.push(...achat[code].appart);
  }
  const resolveAchat = (code, type) => {
    const own = achat[code]?.[type] || [];
    if (own.length >= SEUIL) return { med: median(own), maille: "commune" };
    const e = epci[code];
    const ea = e ? epciArr[e]?.[type] || [] : [];
    if (ea.length >= SEUIL) return { med: median(ea), maille: "EPCI" };
    return { med: null, maille: "au-dela" };
  };

  // 3) Médians résolus par commune (sur l'index).
  const file = JSON.parse(await fsp.readFile(INDEX, "utf8"));
  const communes = file.communes;
  const resolved = {};
  for (const c of communes) {
    const code = c.insee;
    resolved[code] = {
      m: resolveAchat(code, "maison"),
      a: resolveAchat(code, "appart"),
      la: loy[code]?.appart ?? null,
      lm: loy[code]?.maison ?? null,
      lt: loy[code]?.typ ?? null,
    };
  }

  // 4) Distributions nationales pour les percentiles.
  const vals = (sel) => Object.values(resolved).map(sel).filter((v) => v != null && !isNaN(v)).sort((x, y) => x - y);
  const dM = vals((r) => r.m.med), dA = vals((r) => r.a.med), dLA = vals((r) => r.la), dLM = vals((r) => r.lm);

  const achatNiveau = (r) => {
    const ps = [];
    if (r.m.med != null) ps.push(pctRank(dM, r.m.med));
    if (r.a.med != null) ps.push(pctRank(dA, r.a.med));
    if (!ps.length) return null; // aucune donnée d'achat (Alsace-Moselle / au-delà)
    return niveauFromPct(ps.reduce((s, x) => s + x, 0) / ps.length);
  };
  const locNiveau = (r) => {
    const ps = [];
    if (r.la != null && !isNaN(r.la)) ps.push(pctRank(dLA, r.la));
    if (r.lm != null && !isNaN(r.lm)) ps.push(pctRank(dLM, r.lm));
    if (!ps.length) return null;
    return niveauFromPct(ps.reduce((s, x) => s + x, 0) / ps.length);
  };

  // 5) Patch du champ `logement` (achat + location).
  let nAchat = 0, nLoc = 0;
  for (const c of communes) {
    const r = resolved[c.insee];
    const aN = achatNiveau(r);
    const achatDispo = aN != null;
    const lN = locNiveau(r);
    c.logement = {
      achat: achatDispo
        ? {
            dispo: true,
            niveau: aN, // tres_bas|bas|moyen|haut|tres_haut (moyen = silence comparateur)
            maison: r.m.med != null ? { eur_m2: r.m.med, maille: r.m.maille } : null,
            appart: r.a.med != null ? { eur_m2: r.a.med, maille: r.a.maille } : null,
          }
        : { dispo: false }, // Alsace-Moselle / aucune vente : « non disponible », jamais « moyen »
      location:
        lN != null
          ? {
              niveau: lN,
              appart_eur_m2: r.la == null ? null : Math.round(r.la * 10) / 10,
              maison_eur_m2: r.lm == null ? null : Math.round(r.lm * 10) / 10,
              fiabilite: r.lt === "commune" ? "observee" : "estimee",
            }
          : null,
    };
    if (achatDispo) nAchat++;
    if (lN != null) nLoc++;
  }

  file.meta.logement = {
    sources: "DVF (DGFiP/Etalab geo-dvf) pour l'achat, médian €/m² auto-agrégé ; Carte des loyers (Ministère/ANIL) pour la location",
    fenetre: `${YEARS[0]}-${YEARS[YEARS.length - 1]}`,
    maille: `commune si >= ${SEUIL} ventes/type, sinon repli EPCI, sinon au-delà ; location communale (ANIL impute)`,
    paliers: "tres_bas/bas/moyen/haut/tres_haut par percentiles nationaux (déciles aux extrêmes, tiers au centre) ; moyen = silence au comparateur",
    limite: "achat indisponible en Alsace-Moselle (57/67/68) et Mayotte (hors DVF) ; signal NARRATIF, hors classement",
  };

  await fsp.writeFile(INDEX, JSON.stringify(file), "utf8");
  console.error(`✓ logement patché : ${communes.length} communes, ${nAchat} avec achat, ${nLoc} avec location.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
