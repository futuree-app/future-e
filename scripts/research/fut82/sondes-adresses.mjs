#!/usr/bin/env node
/**
 * FUT-82 — sondes au point sur l'échantillon (lecture seule, bornées).
 *
 * Pour chaque point de l'échantillon, interroge les services candidats et consigne CE QU'ILS
 * RENDENT, sans interprétation produit : statut HTTP, latence, nombre d'objets, attributs utiles,
 * et les contrôles qui piègent les fausses lectures (objet voisin renvoyé par une requête au point,
 * masque d'une carte confondu avec une absence, projection native de la couche).
 *
 *   node scripts/research/fut82/sondes-adresses.mjs [--in <echantillon.json>] [--out <sondes.json>] [--seul <id>]
 *
 * Services (tous publics, sans clé) :
 *   - Géorisques  : rapport au point (`resultats_rapport_risque`) ; WMS BRGM des remontées de nappe
 *   - Hub'Eau     : stations piézométriques (niveaux_nappes)
 *   - Géoplateforme WMS : PEB et PGS (DGAC), LCZ (Cerema)
 *   - Géoplateforme WFS : protections Patrinat (INPN), lignes électriques BD TOPO, zonage des
 *                         obligations légales de débroussaillement, potentiel solaire du bâti, IRVE,
 *                         cartes de bruit stratégiques (Ardennes seulement : seule CBS publiée là)
 *   - France Chaleur Urbaine : éligibilité au point
 *   - PVGIS (JRC) : production estimée d'1 kWc, sur un sous-ensemble (service partagé, on ménage)
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import {
  timedFetch, tryJson, parseArgs, sleep, haversineM, pointCql, distancePointPolylineM, latencySummary, pngPixelOpaque,
} from "./lib.mjs";

const args = parseArgs(process.argv);
const IN = args.in ?? "docs/audits/2026-10-27-fut82/mesures/echantillon.json";
const OUT = args.out ?? "docs/audits/2026-10-27-fut82/mesures/sondes-adresses.json";
const PAUSE = 150;

const BRGM_WMS = "https://mapsref.brgm.fr/wxs/georisques/risques";
const GEOPF_WMS = "https://data.geopf.fr/wms-v/ows";
const GEOPF_WFS = "https://data.geopf.fr/wfs/ows";

// ── WMS GetFeatureInfo, fenêtre étroite (≈ 11 m par pixel) ──────────────────────────────────
// Une requête « au point » renvoie aussi les objets dans la TOLÉRANCE de clic du serveur. On réduit
// la fenêtre et, quand le serveur rend une emprise, on vérifie que le point y est contenu.
function bboxDeg(lat, lon, d) { return `${lat - d},${lon - d},${lat + d},${lon + d}`; }

async function gfiGeopf(layer, lat, lon) {
  const url = `${GEOPF_WMS}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&LAYERS=${layer}&QUERY_LAYERS=${layer}` +
    `&CRS=EPSG:4326&BBOX=${bboxDeg(lat, lon, 0.0005)}&WIDTH=11&HEIGHT=11&I=5&J=5&INFO_FORMAT=application/json&STYLES=&FEATURE_COUNT=10`;
  const r = await timedFetch(url);
  const j = tryJson(r.body);
  return { status: r.status, ms: r.ms, features: j?.features?.map((f) => f.properties) ?? null, erreur: j ? null : r.body.slice(0, 160) };
}

function parseMsGml(xml) {
  // Sortie GML de MapServer : <COUCHE_layer> ... <COUCHE_feature> <gml:coordinates>xmin,ymin xmax,ymax ...
  const out = [];
  for (const lm of xml.matchAll(/<(\w+)_layer>([\s\S]*?)<\/\1_layer>/g)) {
    for (const fm of lm[2].matchAll(/<(\w+)_feature>([\s\S]*?)<\/\1_feature>/g)) {
      const props = {};
      for (const pm of fm[2].matchAll(/<([a-z_0-9]+)>([^<]*)<\/\1>/gi)) props[pm[1]] = pm[2];
      const bb = fm[2].match(/<gml:coordinates>([-\d.]+),([-\d.]+) ([-\d.]+),([-\d.]+)<\/gml:coordinates>/);
      out.push({ couche: lm[1], props, bbox: bb ? bb.slice(1, 5).map(Number) : null });
    }
  }
  return out;
}

// Point dans un polygone (anneau extérieur moins trous), coordonnées [lat, lon].
function dansAnneau(lat, lon, ring) {
  let dedans = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i], [yj, xj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) dedans = !dedans;
  }
  return dedans;
}
function anneaux(gml) {
  return [...gml.matchAll(/<gml:posList[^>]*>([^<]+)<\/gml:posList>/g)].map((m) => {
    const v = m[1].trim().split(/\s+/).map(Number), ring = [];
    for (let i = 0; i + 1 < v.length; i += 2) ring.push([v[i], v[i + 1]]);
    return ring;
  });
}

async function nappeBrgm(lat, lon) {
  // LECTURE VECTORIELLE (WFS 1.1, GML, axe latitude d'abord). Deux tentatives écartées, et pourquoi :
  //  - GetFeatureInfo au point : la couche ne répond qu'à petite échelle (rien sous ±0,01° de
  //    fenêtre), et à l'échelle où elle répond, la tolérance de clic ramène plusieurs polygones
  //    voisins de classes différentes, dont les EMPRISES contiennent toutes le point. Ni la
  //    fenêtre ni l'emprise ne disent la classe du point.
  //  - Masques dans QUERY_LAYERS : non interrogeables, ils font échouer la requête avec un HTTP 200.
  // Ici : les polygones d'une petite emprise, puis un vrai test point-dans-polygone.
  const d = 0.002;
  const url = `${BRGM_WMS}?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=ms:REMNAPPE&MAXFEATURES=200` +
    `&BBOX=${lat - d},${lon - d},${lat + d},${lon + d},urn:ogc:def:crs:EPSG::4326`;
  const r = await timedFetch(url, { timeoutMs: 45000 });
  const exception = /ExceptionReport|ServiceException/.test(r.body);
  const membres = r.ok && !exception ? [...r.body.matchAll(/<ms:REMNAPPE [\s\S]*?<\/ms:REMNAPPE>/g)].map((m) => m[0]) : [];
  const lus = membres.map((g) => {
    const prop = (k) => g.match(new RegExp(`<ms:${k}>([^<]*)</ms:${k}>`))?.[1] ?? null;
    const [ext, ...trous] = anneaux(g);
    const contient = ext ? dansAnneau(lat, lon, ext) && !trous.some((t) => dansAnneau(lat, lon, t)) : false;
    return { classe: prop("classe")?.replace(/&#39;/g, "'"), fiab_tot: prop("fiab_tot"), fiab_mnt: prop("fiab_mnt"), fiab_eso: prop("fiab_eso"), contient };
  });
  const auPoint = lus.filter((x) => x.contient).map(({ contient, ...rest }) => rest);
  return {
    status: r.status, ms: r.ms, exception, polygonesEmprise: lus.length, auPoint,
    multiples: auPoint.length > 1,
    masques: await masquesNappe(lat, lon),
  };
}

async function masquesNappe(lat, lon) {
  const out = {};
  for (const m of ["MASQ_EAIP", "MASQ_BDLISA", "MASQ_AFFLEUR"]) {
    const url = `${BRGM_WMS}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=${m}&CRS=EPSG:4326&BBOX=${bboxDeg(lat, lon, 0.03)}` +
      `&WIDTH=101&HEIGHT=101&FORMAT=image/png&STYLES=&TRANSPARENT=true`;
    const r = await fetch(url, { headers: { "user-agent": "futur-e-audit-fut82/1.0" }, signal: AbortSignal.timeout(30000) }).catch(() => null);
    out[m] = r?.ok ? pngPixelOpaque(Buffer.from(await r.arrayBuffer()), 50, 50) : null;
  }
  return out;
}

async function rapportGeorisques(lat, lon) {
  const r = await timedFetch(`https://georisques.gouv.fr/api/v1/resultats_rapport_risque?latlon=${lon},${lat}`, { retries: 1, timeoutMs: 45000, pauseMs: 4000 });
  const j = tryJson(r.body);
  const n = j?.risquesNaturels;
  return {
    status: r.status, ms: r.ms, tentatives: r.tentatives,
    remonteeNappe: n ? { adresse: n.remonteeNappe?.libelleStatutAdresse ?? null, commune: n.remonteeNappe?.libelleStatutCommune ?? null } : null,
    feuForet: n ? { adresse: n.feuForet?.libelleStatutAdresse ?? null, commune: n.feuForet?.libelleStatutCommune ?? null } : null,
    icpe: j?.risquesTechnologiques?.icpe?.libelleStatutAdresse ?? null,
  };
}

async function piezo(lat, lon) {
  const d = 0.12; // ≈ 10-13 km
  const url = `https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/stations?bbox=${lon - d},${lat - d},${lon + d},${lat + d}&format=json&size=200` +
    `&fields=code_bss,x,y,date_fin_mesure,nb_mesures_piezo,profondeur_investigation,libelle_pe,nom_commune`;
  const r = await timedFetch(url);
  const data = tryJson(r.body)?.data ?? [];
  const st = data.map((s) => ({ ...s, dist: Math.round(haversineM(lat, lon, s.y, s.x)) })).sort((a, b) => a.dist - b.dist);
  const unAn = Date.now() - 365 * 864e5;
  const actives = st.filter((s) => s.date_fin_mesure && Date.parse(s.date_fin_mesure) > unAn);
  const n = st[0];
  return {
    status: r.status, ms: r.ms, stations10km: st.filter((s) => s.dist <= 10000).length,
    actives5km: actives.filter((s) => s.dist <= 5000).length,
    plusProche: n ? { code_bss: n.code_bss, dist_m: n.dist, derniere_mesure: n.date_fin_mesure, profondeur_m: n.profondeur_investigation, nappe: n.libelle_pe?.slice(0, 80) } : null,
    plusProcheActive: actives[0] ? { dist_m: actives[0].dist, derniere_mesure: actives[0].date_fin_mesure } : null,
  };
}

async function wfs(typename, cql, propertyName, { count = 50 } = {}) {
  const p = new URLSearchParams({
    SERVICE: "WFS", VERSION: "2.0.0", REQUEST: "GetFeature", TYPENAMES: typename,
    OUTPUTFORMAT: "application/json", COUNT: String(count), CQL_FILTER: cql,
  });
  if (propertyName) p.set("PROPERTYNAME", propertyName);
  const r = await timedFetch(`${GEOPF_WFS}?${p}`);
  const j = tryJson(r.body);
  return { status: r.status, ms: r.ms, n: j?.numberMatched ?? null, features: j?.features ?? null, erreur: j ? null : r.body.slice(0, 200) };
}

const PATRINAT = [
  ["sic", "patrinat_sic:sic", "Natura 2000 (directive Habitats)"],
  ["zps", "patrinat_zps:zps", "Natura 2000 (directive Oiseaux)"],
  ["pn", "patrinat_pn:parc_national", "Parc national (cœur / aire d'adhésion)"],
  ["pnr", "patrinat_pnr:pnr", "Parc naturel régional"],
  ["rnn", "patrinat_rnn:rnn", "Réserve naturelle nationale"],
  ["rnr", "patrinat_rnr:rnr", "Réserve naturelle régionale"],
  ["apb", "patrinat_apb:apb", "Arrêté de protection de biotope"],
  ["rb", "patrinat_rb:rb", "Réserve biologique"],
  ["ramsar", "patrinat_ramsar:ramsar", "Site Ramsar"],
  ["cen", "patrinat_cen:cen", "Terrain des conservatoires d'espaces naturels"],
  ["znieff1", "patrinat_znieff1:znieff1", "ZNIEFF de type 1 (inventaire, sans protection)"],
  ["znieff2", "patrinat_znieff2:znieff2", "ZNIEFF de type 2 (inventaire, sans protection)"],
];

async function protections(lat, lon) {
  const pt = pointCql(lat, lon, "3857");
  const out = {};
  for (const [cle, tn] of PATRINAT) {
    const dedans = await wfs(tn, `INTERSECTS(geom,${pt})`, cle === "pn" ? "nom_site,id_mnhn,zone" : "nom_site,id_mnhn");
    // Rayon de 1 km en unités EPSG:3857 : la distorsion de Mercator (≈ ×1,4 à 45° N) rend ce rayon
    // réellement plus court au sol (≈ 700 m). Mesure de voisinage indicative, consignée comme telle.
    const proche = await wfs(tn, `DWITHIN(geom,${pt},1000,meters)`, "nom_site");
    out[cle] = {
      status: dedans.status, ms: dedans.ms,
      auPoint: dedans.features?.map((f) => `${f.properties.nom_site}${f.properties.zone ? ` (${f.properties.zone})` : ""}`) ?? null,
      voisinage1kmMercator: proche.n,
    };
    await sleep(60);
  }
  return out;
}

async function lignesElectriques(lat, lon) {
  const r = await wfs("BDTOPO_V3:ligne_electrique", `DWITHIN(geometrie,${pointCql(lat, lon, "4326")},500,meters)`, null);
  const lignes = (r.features ?? []).map((f) => {
    const c = f.geometry.type === "LineString" ? [f.geometry.coordinates] : f.geometry.coordinates;
    const d = Math.min(...c.map((cc) => distancePointPolylineM(lat, lon, cc.map(([a, b]) => [a, b]))));
    return { voltage: f.properties.voltage, etat: f.properties.etat_de_l_objet, gestionnaire: f.properties.gestionnaire, source: f.properties.sources, dist_m: Math.round(d) };
  }).sort((a, b) => a.dist_m - b.dist_m);
  return { status: r.status, ms: r.ms, n500m: r.n, plusProche: lignes[0] ?? null, tensions: [...new Set(lignes.map((l) => l.voltage))] };
}

async function debroussaillement(lat, lon) {
  const r = await wfs("DEBROUSSAILLEMENT:debroussaillement", `INTERSECTS(geom,${pointCql(lat, lon, "2154")})`, "dept,zonage,millesime,source,origine,dat_ap_old");
  return { status: r.status, ms: r.ms, n: r.n, auPoint: r.features?.map((f) => f.properties) ?? null };
}

async function solaireBati(lat, lon) {
  const r = await wfs("POTENTIEL.SOLAIRE.BATIMENT:bati", `DWITHIN(geom,${pointCql(lat, lon, "2154")},15,meters)`, "cleabs,puissance,presume_public,code_insee");
  return { status: r.status, ms: r.ms, n15m: r.n, batiments: r.features?.slice(0, 4).map((f) => ({ cleabs: f.properties.cleabs, puissance: Math.round(Number(f.properties.puissance)), presume_public: f.properties.presume_public })) ?? null };
}

async function irve(lat, lon) {
  const r = await wfs("irve_geojson_30-09-2026_wfs:irve", `DWITHIN(wkb_geometry,${pointCql(lat, lon, "4326")},1000,meters)`, "nom_station,puissance_nominale", { count: 1 });
  return { status: r.status, ms: r.ms, pointsDeCharge1km: r.n, erreur: r.erreur };
}

async function cbsArdennes(lat, lon) {
  const pt = pointCql(lat, lon, "2154");
  const out = {};
  for (const [cle, l] of [["route_Lden", "n_bruit_zbr_infra_r_c_ld_s_008"], ["route_Ln", "n_bruit_zbr_infra_r_c_ln_s_008"], ["fer_Lden", "n_bruit_zbr_infra_f_c_ld_s_008"]]) {
    const r = await wfs(`cbs2022_008_gpkg_06-10-2026_wfs:${l}`, `INTERSECTS(geom,${pt})`, "legende,codinfra,annee,validefin,cbstype");
    out[cle] = { status: r.status, ms: r.ms, n: r.n, zones: r.features?.map((f) => f.properties) ?? null };
  }
  return out;
}

async function fcu(lat, lon) {
  const r = await timedFetch(`https://france-chaleur-urbaine.beta.gouv.fr/api/v1/eligibility?lat=${lat}&lon=${lon}`);
  const j = tryJson(r.body);
  return { status: r.status, ms: r.ms, reponse: j ? { isEligible: j.isEligible, distance_m: j.distance, futurNetwork: j.futurNetwork, inPDP: j.inPDP, reseau: j.name, tauxENRR: j.rateENRR } : r.body.slice(0, 120) };
}

async function pvgis(lat, lon) {
  const r = await timedFetch(`https://re.jrc.ec.europa.eu/api/v5_3/PVcalc?lat=${lat}&lon=${lon}&peakpower=1&loss=14&optimalangles=1&outputformat=json`, { timeoutMs: 45000 });
  const j = tryJson(r.body);
  return { status: r.status, ms: r.ms, kWh_an_par_kWc: j?.outputs?.totals?.fixed?.E_y ? Math.round(j.outputs.totals.fixed.E_y) : null, base_rayonnement: j?.inputs?.meteo_data?.radiation_db ?? null, erreur: j ? null : r.body.slice(0, 160) };
}

// ── Exécution ───────────────────────────────────────────────────────────────────────────────
const ech = JSON.parse(readFileSync(IN, "utf8"));
let points = ech.points.filter((p) => p.ok);
if (args.seul) points = points.filter((p) => p.id === args.seul);
const PVGIS_IDS = new Set(["la-rochelle-centre", "grenoble-centre", "gueret", "metz-centre", "marseille-chateau-gombert", "saint-denis-reunion", "ploubazlanec"]);

const resultats = [];
for (const p of points) {
  const { lat, lon } = p;
  const r = { id: p.id, part: p.part, cas: p.cas, label: p.label, type: p.type, score: p.score, citycode: p.citycode, lat, lon };
  r.rapportGeorisques = await rapportGeorisques(lat, lon); await sleep(PAUSE);
  r.nappeBrgm = await nappeBrgm(lat, lon); await sleep(PAUSE);
  r.piezo = await piezo(lat, lon); await sleep(PAUSE);
  r.peb = await gfiGeopf("dgac_peb_plan_wmsv", lat, lon); await sleep(PAUSE);
  r.pgs = await gfiGeopf("dgac_pgs_plan_wmsv", lat, lon); await sleep(PAUSE);
  r.lcz = await gfiGeopf("lcz_cerema_wmsv", lat, lon); await sleep(PAUSE);
  r.protections = await protections(lat, lon);
  r.lignes = await lignesElectriques(lat, lon); await sleep(PAUSE);
  r.debroussaillement = await debroussaillement(lat, lon); await sleep(PAUSE);
  r.solaireBati = await solaireBati(lat, lon); await sleep(PAUSE);
  r.irve = await irve(lat, lon); await sleep(PAUSE);
  r.fcu = await fcu(lat, lon); await sleep(PAUSE);
  if (p.citycode?.startsWith("08")) r.cbsArdennes = await cbsArdennes(lat, lon);
  if (PVGIS_IDS.has(p.id)) { r.pvgis = await pvgis(lat, lon); await sleep(1000); }
  resultats.push(r);
  const prot = Object.entries(r.protections).filter(([, v]) => v.auPoint?.length).map(([k]) => k).join("+") || "-";
  process.stderr.write(`${p.id}: nappe=${r.nappeBrgm.auPoint.map((x) => `${x.classe?.slice(15, 45)}/${x.fiab_tot}`).join("|") || (Object.entries(r.nappeBrgm.masques).filter(([, v]) => v).map(([k]) => k).join(",") || "∅")} ` +
    `PEB=${r.peb.features?.map((f) => f.zone).join(",") || "-"} prot=${prot} lignes=${r.lignes.n500m} OLD=${r.debroussaillement.n} fcu=${r.fcu.reponse?.isEligible}\n`);
}

// Latences agrégées par service : c'est le coût qu'une intégration ferait payer au dossier.
const lat = (sel) => latencySummary(resultats.map(sel).filter((x) => x != null));
const latences = {
  rapportGeorisques: lat((r) => r.rapportGeorisques.ms),
  nappeBrgm: lat((r) => r.nappeBrgm.ms),
  piezoHubeau: lat((r) => r.piezo.ms),
  pebWms: lat((r) => r.peb.ms),
  lczWms: lat((r) => r.lcz.ms),
  natura2000Wfs: lat((r) => r.protections.sic.ms),
  lignesWfs: lat((r) => r.lignes.ms),
  debroussaillementWfs: lat((r) => r.debroussaillement.ms),
  solaireBatiWfs: lat((r) => r.solaireBati.ms),
  fcu: lat((r) => r.fcu.ms),
  pvgis: lat((r) => r.pvgis?.ms),
};
const echecs = {};
for (const r of resultats) for (const [k, v] of Object.entries(r)) if (v && typeof v === "object" && "status" in v && v.status !== 200) (echecs[k] ??= []).push(`${r.id}:${v.status}`);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ genere: new Date().toISOString(), echantillon: IN, latences, echecs, resultats }, null, 1));
console.log(JSON.stringify({ latences, echecs }, null, 1));
