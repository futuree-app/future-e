#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-80 · LE BÂTIMENT D'UNE ADRESSE, ET CE QU'ON PEUT LUI RATTACHER : MESURE RNB / BDNB / ADEME.
//
// POURQUOI CE SCRIPT. L'audit du 30/07/2026 concluait que les DPE de l'ADEME ne portaient aucun
// identifiant RNB. Vérifié le 26/10/2026 : `dpe03existant` et `dpe02neuf` exposent `id_rnb` et
// `provenance_id_rnb` (« Reprise RNB » / « Logiciel »), 8,1 M de DPE existants sur 15,9 M. La méthode
// de la « reprise » n'est documentée nulle part officiellement : ce script mesure ce qu'elle vaut au
// lieu de la supposer.
//
// TROIS ÉCHANTILLONS, TROIS QUESTIONS.
//   A. Adresses (réutilise le tirage uniforme du 31/07, `mesure-dpe-2026-07-31-adresses.json`,
//      200 par strate) : combien d'adresses ont un bâtiment RNB, combien en ont plusieurs, et
//      combien de DPE l'identifiant RNB ajoute ou contredit par rapport à la jointure BAN actuelle.
//   B. Adresses collectives (tirées depuis l'ADEME : DPE d'immeuble ou d'appartement, département
//      et date au hasard) : le cas dense / copropriété / plusieurs entrées, rare dans A.
//   C. DPE porteurs d'un `id_rnb` (même tirage, par provenance) : l'identifiant désigne-t-il un
//      bâtiment actif, l'un de ceux de l'adresse du DPE, et le point du DPE tombe-t-il dedans ?
//   + BDNB : pour les bâtiments trouvés, les champs factuels candidats et leur indicateur de
//     fiabilité (quota de l'API ouverte : 10 000 appels/mois, d'où un usage par lots de 10).
//
// Lecture seule, sources publiques, aucun jeton. Débit borné (4 requêtes en parallèle).
//
// Usage :
//   node scripts/fut80/mesure-rnb-rattachement.mjs [--par-strate 200] [--collectif 150] [--dpe 200]
//        [--graine 80] > docs/audits/2026-10-26-fut80-rnb/mesure.json   (archivé compressé : mesure.json.gz)
// ════════════════════════════════════════════════════════════════════════════════════════════

import { readFileSync } from "node:fs";

const ARG = process.argv.slice(2);
const opt = (nom, def) => {
  const i = ARG.indexOf(nom);
  return i >= 0 ? Number.parseInt(ARG[i + 1], 10) : def;
};
const PAR_STRATE = opt("--par-strate", 200);
const N_COLLECTIF = opt("--collectif", 150);
const N_DPE = opt("--dpe", 200);
let graine = opt("--graine", 80);

// Générateur pseudo-aléatoire à graine : le tirage se rejoue à l'identique.
function alea() {
  graine = (graine * 1103515245 + 12345) & 0x7fffffff;
  return graine / 0x7fffffff;
}

const ADEME = "https://data.ademe.fr/data-fair/api/v1/datasets";
const DS = { existant: `${ADEME}/dpe03existant`, neuf: `${ADEME}/dpe02neuf` };
const RNB = "https://rnb-api.beta.gouv.fr/api/alpha/buildings";
const BDNB = "https://api.bdnb.io/v1/bdnb/donnees";

const SELECT = [
  "numero_dpe", "identifiant_ban", "adresse_ban", "id_rnb", "provenance_id_rnb", "type_batiment",
  "methode_application_dpe", "date_etablissement_dpe", "etiquette_dpe", "statut_geocodage",
  "numero_dpe_immeuble_associe", "_geopoint",
].join(",");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stats = { appels: { ademe: 0, rnb: 0, bdnb: 0 }, echecs: { ademe: 0, rnb: 0, bdnb: 0 }, latences: { ademe: [], rnb: [], bdnb: [] } };

async function get(source, url, essais = 3) {
  for (let i = 0; i < essais; i++) {
    const t0 = Date.now();
    stats.appels[source]++;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      stats.latences[source].push(Date.now() - t0);
      if (res.status === 404) return { status: 404, body: null };
      if (res.ok) return { status: 200, body: await res.json() };
      if (res.status === 429) await sleep(2000);
    } catch { /* on retente */ }
    stats.echecs[source]++;
    await sleep(500 * (i + 1));
  }
  return { status: "echec", body: null };
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) {
      const k = i++;
      out[k] = await fn(items[k], k);
      if ((k + 1) % 50 === 0) console.error(`    ${k + 1}/${items.length}`);
    }
  }));
  return out;
}

// ── Géométrie (lon/lat WGS84, échelle d'un bâtiment : l'équirectangulaire suffit) ───────────

function dansAnneau([x, y], anneau) {
  let dedans = false;
  for (let i = 0, j = anneau.length - 1; i < anneau.length; j = i++) {
    const [xi, yi] = anneau[i];
    const [xj, yj] = anneau[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dedans = !dedans;
  }
  return dedans;
}

function polygones(shape) {
  if (!shape) return [];
  if (shape.type === "Polygon") return [shape.coordinates];
  if (shape.type === "MultiPolygon") return shape.coordinates;
  return [];
}

function dansForme(pt, shape) {
  return polygones(shape).some(([ext, ...trous]) => dansAnneau(pt, ext) && !trous.some((t) => dansAnneau(pt, t)));
}

/** Distance en mètres d'un point au contour d'une forme (0 s'il est dedans). */
function distanceForme(pt, shape) {
  if (!shape || shape.type === "Point") return null;
  if (dansForme(pt, shape)) return 0;
  const kx = 111_320 * Math.cos((pt[1] * Math.PI) / 180);
  const ky = 110_540;
  let best = Infinity;
  for (const poly of polygones(shape)) {
    for (const anneau of poly) {
      for (let i = 1; i < anneau.length; i++) {
        const ax = (anneau[i - 1][0] - pt[0]) * kx, ay = (anneau[i - 1][1] - pt[1]) * ky;
        const bx = (anneau[i][0] - pt[0]) * kx, by = (anneau[i][1] - pt[1]) * ky;
        const dx = bx - ax, dy = by - ay;
        const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));
        best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy));
      }
    }
  }
  return Number.isFinite(best) ? Math.round(best * 10) / 10 : null;
}

const pointDpe = (r) => {
  if (!r._geopoint) return null;
  const [lat, lon] = r._geopoint.split(",").map(Number);
  return Number.isFinite(lat) && Number.isFinite(lon) ? [lon, lat] : null;
};

// ── Sources ──────────────────────────────────────────────────────────────────────────────

const cacheRnbAdresse = new Map();
async function rnbDeLAdresse(banId) {
  if (!cacheRnbAdresse.has(banId)) {
    cacheRnbAdresse.set(banId, (async () => {
      const r = await get("rnb", `${RNB}/?cle_interop_ban=${encodeURIComponent(banId)}`);
      if (r.status !== 200) return { status: "indisponible", batiments: [] };
      const batiments = (r.body.results ?? []).map((b) => ({
        rnb_id: b.rnb_id, status: b.status, is_active: b.is_active, shape: b.shape,
        nb_adresses: (b.addresses ?? []).length,
        bdnb: (b.ext_ids ?? []).filter((e) => e.source === "bdnb").map((e) => e.id),
      }));
      return { status: batiments.length ? "trouve" : "aucun", batiments };
    })());
  }
  return cacheRnbAdresse.get(banId);
}

const cacheRnbId = new Map();
async function rnbParId(id) {
  if (!cacheRnbId.has(id)) {
    cacheRnbId.set(id, (async () => {
      const r = await get("rnb", `${RNB}/${encodeURIComponent(id)}/`);
      if (r.status === 404) return { status: "inconnu" };
      if (r.status !== 200) return { status: "indisponible" };
      const b = r.body;
      return {
        status: "trouve", rnb_id: b.rnb_id, etat: b.status, is_active: b.is_active, shape: b.shape,
        adresses: (b.addresses ?? []).map((a) => a.id),
      };
    })());
  }
  return cacheRnbId.get(id);
}

async function ademe(qs, size = 50) {
  const out = [];
  let echec = false;
  for (const [nom, ds] of Object.entries(DS)) {
    const r = await get("ademe", `${ds}/lines?qs=${encodeURIComponent(qs)}&size=${size}&select=${SELECT}`);
    if (r.status !== 200) { echec = true; continue; }
    out.push(...(r.body.results ?? []).map((x) => ({ ...x, jeu: nom })));
  }
  return { echec, lignes: out };
}

const grain = (t) => (t === "immeuble" ? "immeuble" : t === "appartement" || t === "maison" ? "logement" : "indetermine");

// ── A et B : une adresse ────────────────────────────────────────────────────────────────────

async function mesurerAdresse(a) {
  const rnb = await rnbDeLAdresse(a.banId);
  const actifs = rnb.batiments.filter((b) => b.is_active !== false && b.status !== "demolished");
  const ids = new Set(actifs.map((b) => b.rnb_id));

  const parBan = await ademe(`identifiant_ban:"${a.banId}"`);
  const parRnb = { echec: false, lignes: [] };
  for (const id of ids) {
    const r = await ademe(`id_rnb:"${id}"`);
    parRnb.echec ||= r.echec;
    parRnb.lignes.push(...r.lignes);
  }

  const banNums = new Set(parBan.lignes.map((d) => d.numero_dpe));
  const rnbNums = new Set(parRnb.lignes.map((d) => d.numero_dpe));

  const dpe = [...new Map([...parBan.lignes, ...parRnb.lignes].map((d) => [d.numero_dpe, d])).values()].map((d) => {
    const pt = pointDpe(d);
    const dansBatiment = pt ? actifs.some((b) => dansForme(pt, b.shape)) : null;
    const distances = pt ? actifs.map((b) => distanceForme(pt, b.shape)).filter((x) => x != null) : [];
    return {
      numero: d.numero_dpe, jeu: d.jeu, date: d.date_etablissement_dpe, grain: grain(d.type_batiment),
      identifiant_ban: d.identifiant_ban ?? null, id_rnb: d.id_rnb ?? null, provenance: d.provenance_id_rnb ?? null,
      par_ban: banNums.has(d.numero_dpe), par_rnb: rnbNums.has(d.numero_dpe),
      // L'identifiant RNB du DPE désigne-t-il un bâtiment de l'adresse ?
      rnb_concorde: d.id_rnb ? ids.has(d.id_rnb) : null,
      point_dans_batiment: dansBatiment,
      distance_batiment_m: distances.length ? Math.min(...distances) : null,
    };
  });

  return {
    banId: a.banId, label: a.label, strate: a.strate, insee: a.insee,
    rnb: { status: rnb.status, n: actifs.length, ids: [...ids], bdnb: actifs.flatMap((b) => b.bdnb), nb_adresses: actifs.map((b) => b.nb_adresses) },
    ademe_echec: parBan.echec || parRnb.echec,
    dpe,
  };
}

// ── B et C : tirages depuis l'ADEME ─────────────────────────────────────────────────────────

const DEPS = ["75", "69", "13", "31", "33", "44", "59", "67", "06", "34", "35", "17", "15", "23", "29", "63", "21", "74", "57", "38"];
function dateAuHasard(debut, fin) {
  const t0 = Date.parse(debut), t1 = Date.parse(fin);
  return new Date(t0 + alea() * (t1 - t0)).toISOString().slice(0, 10);
}

async function tirerDpe(filtre, n, fin = "2026-09-30") {
  const vus = new Map();
  let essais = 0;
  while (vus.size < n && essais < n * 6) {
    essais++;
    const dep = DEPS[Math.floor(alea() * DEPS.length)];
    const jour = dateAuHasard("2021-07-01", fin);
    const qs = `code_departement_ban:"${dep}" AND date_etablissement_dpe:"${jour}" AND ${filtre}`;
    const r = await get("ademe", `${DS.existant}/lines?qs=${encodeURIComponent(qs)}&size=30&select=${SELECT}`);
    const lignes = r.body?.results ?? [];
    if (!lignes.length) continue;
    const d = lignes[Math.floor(alea() * lignes.length)];
    if (!vus.has(d.numero_dpe)) vus.set(d.numero_dpe, { ...d, jeu: "existant", dep });
  }
  return [...vus.values()];
}

async function mesurerDpe(d) {
  const pt = pointDpe(d);
  const bat = await rnbParId(d.id_rnb);
  const deLAdresse = d.identifiant_ban ? await rnbDeLAdresse(d.identifiant_ban) : { status: "sans_ban", batiments: [] };
  const idsAdresse = deLAdresse.batiments.filter((b) => b.is_active !== false).map((b) => b.rnb_id);
  return {
    numero: d.numero_dpe, provenance: d.provenance_id_rnb, grain: grain(d.type_batiment), date: d.date_etablissement_dpe,
    dep: d.dep, identifiant_ban: d.identifiant_ban ?? null,
    rnb_status: bat.status, rnb_etat: bat.etat ?? null, rnb_actif: bat.is_active ?? null,
    adresse_rnb_status: deLAdresse.status, n_batiments_adresse: idsAdresse.length,
    id_dans_adresse: d.identifiant_ban ? idsAdresse.includes(d.id_rnb) : null,
    ban_dans_adresses_du_batiment: bat.adresses ? bat.adresses.includes(d.identifiant_ban) : null,
    point_dans_batiment: pt && bat.shape ? dansForme(pt, bat.shape) : null,
    distance_m: pt && bat.shape ? distanceForme(pt, bat.shape) : null,
  };
}

// ── BDNB : champs factuels candidats, par lots de 10 (quota) ────────────────────────────────

const CHAMPS_BDNB = [
  "batiment_groupe_id", "annee_construction", "nb_niveau", "hauteur_mean", "nb_log", "nb_log_rnc",
  "mat_mur_txt", "mat_toit_txt", "usage_principal_bdnb_open", "s_geom_groupe", "fiabilite_hauteur",
  "fiabilite_emprise_sol", "fiabilite_cr_adr_niv_1", "croisement_geospx_reussi", "contient_fictive_geom_groupe",
  "numero_immat_principal", "l_parcelle_id",
].join(",");

async function bdnbPourRnb(rnbIds) {
  const parRnb = new Map();
  const lots = [];
  for (let i = 0; i < rnbIds.length; i += 10) lots.push(rnbIds.slice(i, i + 10));
  const constructions = (await pool(lots, 2, async (lot) => {
    const r = await get("bdnb", `${BDNB}/batiment_construction?rnb_id=in.(${lot.join(",")})&select=rnb_id,batiment_groupe_id,fictive_geom_cstr,hauteur`);
    return r.status === 200 ? r.body : [];
  })).flat();
  for (const c of constructions) parRnb.set(c.rnb_id, c);

  const groupes = [...new Set(constructions.map((c) => c.batiment_groupe_id))];
  const lotsG = [];
  for (let i = 0; i < groupes.length; i += 10) lotsG.push(groupes.slice(i, i + 10));
  const parGroupe = new Map();
  (await pool(lotsG, 2, async (lot) => {
    const r = await get("bdnb", `${BDNB}/batiment_groupe_complet?batiment_groupe_id=in.(${lot.join(",")})&select=${CHAMPS_BDNB}`);
    return r.status === 200 ? r.body : [];
  })).flat().forEach((g) => parGroupe.set(g.batiment_groupe_id, g));

  // Combien de bâtiments RNB partagent chaque groupe BDNB : un groupe en contient souvent plusieurs.
  const rnbParGroupe = new Map();
  for (const c of constructions) rnbParGroupe.set(c.batiment_groupe_id, (rnbParGroupe.get(c.batiment_groupe_id) ?? 0) + 1);

  return rnbIds.map((id) => {
    const c = parRnb.get(id);
    if (!c) return { rnb_id: id, bdnb: null };
    return { rnb_id: id, construction_fictive: c.fictive_geom_cstr, hauteur_cstr: c.hauteur, groupe: parGroupe.get(c.batiment_groupe_id) ?? null };
  });
}

// ── Orchestration ────────────────────────────────────────────────────────────────────────────

const echantillon = JSON.parse(readFileSync("docs/audits/mesure-dpe-2026-07-31-adresses.json", "utf8")).adresses;
const parStrate = {};
for (const a of echantillon) (parStrate[a.strate] ??= []).push(a);
const adressesA = Object.values(parStrate).flatMap((l) => l.slice(0, PAR_STRATE));

console.error(`A · ${adressesA.length} adresses uniformes`);
const A = await pool(adressesA, 4, mesurerAdresse);

console.error(`B · tirage de ${N_COLLECTIF} adresses collectives`);
const dpeCollectifs = await tirerDpe(`type_batiment:(immeuble OR appartement) AND _exists_:identifiant_ban`, N_COLLECTIF);
// Un dossier porte toujours un identifiant au NUMÉRO (`ccccc_vvvv_nnnnn`) : les DPE géocodés à la
// seule voie (`13045_0180`) ne ressemblent à aucune adresse analysée, ils sont écartés.
const auNumero = (id) => id.split("_").length >= 3;
const adressesB = [...new Map(dpeCollectifs.filter((d) => auNumero(d.identifiant_ban)).map((d) => [d.identifiant_ban, {
  banId: d.identifiant_ban, label: d.adresse_ban, strate: "collectif_ademe", insee: d.identifiant_ban.split("_")[0],
}])).values()];
const B = await pool(adressesB, 4, mesurerAdresse);

console.error(`C · tirage de ${N_DPE} DPE par provenance`);
// « Logiciel » n'existe en nombre qu'à partir de 2025 : le tirage suit la période où la provenance existe.
const dpeReprise = await tirerDpe(`provenance_id_rnb:"Reprise RNB"`, N_DPE, "2025-06-30");
const dpeLogiciel = await tirerDpe(`provenance_id_rnb:"Logiciel"`, N_DPE);
const C = await pool([...dpeReprise, ...dpeLogiciel], 4, mesurerDpe);

console.error("BDNB · champs des bâtiments trouvés");
const rnbIds = [...new Set([...A, ...B].flatMap((x) => x.rnb.ids))];
const bdnb = await bdnbPourRnb(rnbIds);

const med = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };
const p95 = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length * 0.95)] : null; };

console.log(JSON.stringify({
  date: new Date().toISOString(),
  parametres: { PAR_STRATE, N_COLLECTIF, N_DPE, graine: opt("--graine", 80) },
  reseau: {
    appels: stats.appels, echecs: stats.echecs,
    latence_mediane_ms: Object.fromEntries(Object.entries(stats.latences).map(([k, v]) => [k, med(v)])),
    latence_p95_ms: Object.fromEntries(Object.entries(stats.latences).map(([k, v]) => [k, p95(v)])),
  },
  A, B, C, bdnb,
}, null, 1));
