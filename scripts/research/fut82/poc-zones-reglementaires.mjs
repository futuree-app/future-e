#!/usr/bin/env node
/**
 * FUT-82 — POC de LECTURE ISOLÉ (aucune intégration applicative) : que pourrait dire futur•e, à une
 * adresse, à partir de trois zonages publics lus au point ?
 *
 *   A. Plan d'exposition au bruit (PEB) et plan de gêne sonore (PGS) des aérodromes — DGAC, Géoplateforme
 *   B. Zonage informatif des obligations légales de débroussaillement (OLD) — IGN pour le ministère de
 *      l'Agriculture, Géoplateforme
 *   C. Sensibilité aux remontées de nappe — BRGM, Géorisques (lecture prudente, vague B)
 *
 * Pour chaque lecture, le POC imprime la chaîne exigée par la doctrine :
 *     fait source → traitement → conclusion admissible → limites → vérification nécessaire
 * et applique les garde-fous mesurés pendant l'audit :
 *   - géocodage : seule une adresse au numéro (type BAN « housenumber ») autorise une lecture « à l'adresse » ;
 *     une rue, un lieu-dit ou un centre de commune donne une lecture « à proximité », jamais « à l'adresse » ;
 *   - limite de zone : si la PARCELLE cadastrale croise une zone que le POINT ne touche pas (ou l'inverse),
 *     la lecture devient « en limite de zone » et appelle une vérification ;
 *   - source indisponible : une erreur n'est JAMAIS une absence ;
 *   - nappe : la règle de Géorisques est reprise (« sujet » en fiabilité FAIBLE → « la carte ne permet pas
 *     de conclure ») ; outre-mer non couvert.
 *
 *   node scripts/research/fut82/poc-zones-reglementaires.mjs --adresse "Avenue de la République 94290 Villeneuve-le-Roi"
 *   node scripts/research/fut82/poc-zones-reglementaires.mjs --lat 44.63 --lon -1.19 [--json]
 */
import { timedFetch, tryJson, parseArgs, pointCql } from "./lib.mjs";

const args = parseArgs(process.argv);
const GEOCODEUR = "https://data.geopf.fr/geocodage";

// ── Localisation ────────────────────────────────────────────────────────────────────────────
async function localiser() {
  if (args.lat && args.lon) return { lat: Number(args.lat), lon: Number(args.lon), type: "coordonnees", label: `${args.lat}, ${args.lon}` };
  const r = await timedFetch(`${GEOCODEUR}/search?q=${encodeURIComponent(args.adresse)}&limit=1`);
  const f = tryJson(r.body)?.features?.[0];
  if (!f) throw new Error("Adresse introuvable");
  return { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0], type: f.properties.type, label: f.properties.label, citycode: f.properties.citycode, score: f.properties.score };
}

async function parcelle(lat, lon) {
  const geom = encodeURIComponent(JSON.stringify({ type: "Point", coordinates: [lon, lat] }));
  const r = await timedFetch(`https://apicarto.ign.fr/api/cadastre/parcelle?geom=${geom}`);
  const f = tryJson(r.body)?.features?.[0];
  return f ? { idu: f.properties.idu, contenance: f.properties.contenance, geometry: f.geometry } : null;
}

// Polygone GeoJSON (lon,lat) → WKT avec axes (lat lon) pour un filtre CQL en EPSG:4326, ou projeté.
function wktPolygone(geometry, crs) {
  const poly = geometry.type === "MultiPolygon" ? geometry.coordinates[0] : geometry.coordinates;
  const ring = poly[0].map(([lo, la]) => {
    if (crs === "4326") return `${la} ${lo}`;
    const pt = pointCql(la, lo, crs).match(/POINT\(([^)]+)\)/)[1];
    return pt;
  });
  return `POLYGON((${ring.join(", ")}))`;
}

// ── A. PEB / PGS ────────────────────────────────────────────────────────────────────────────
async function gfi(layer, lat, lon) {
  const d = 0.0005;
  const r = await timedFetch(`https://data.geopf.fr/wms-v/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&LAYERS=${layer}&QUERY_LAYERS=${layer}&CRS=EPSG:4326&BBOX=${lat - d},${lon - d},${lat + d},${lon + d}&WIDTH=11&HEIGHT=11&I=5&J=5&INFO_FORMAT=application/json&STYLES=&FEATURE_COUNT=5`);
  const j = tryJson(r.body);
  return j ? { ok: true, features: j.features.map((f) => f.properties) } : { ok: false, statut: r.status };
}

const PEB_ZONES = {
  A: "zone A (bruit très fort, indice Lden supérieur à 70)",
  B: "zone B (bruit fort)",
  C: "zone C (bruit modéré)",
  D: "zone D (bruit le plus faible du plan)",
};

async function lirePeb(loc) {
  const [peb, pgs] = [await gfi("dgac_peb_plan_wmsv", loc.lat, loc.lon), await gfi("dgac_pgs_plan_wmsv", loc.lat, loc.lon)];
  if (!peb.ok) return { lecture: "PEB", etat: "indisponible", dire: "La lecture du plan d'exposition au bruit n'a pas abouti : rien ne peut être conclu, ni dans un sens ni dans l'autre." };
  // Si plusieurs zones (point en limite), la loi retient la plus exposée (modèle d'état des nuisances sonores aériennes).
  const ordre = ["A", "B", "C", "D"];
  const zones = peb.features.map((f) => f.zone).filter(Boolean).sort((a, b) => ordre.indexOf(a) - ordre.indexOf(b));
  const z = zones[0];
  const f = peb.features.find((x) => x.zone === z);
  const pgsZones = pgs.ok ? pgs.features.map((x) => x.zone) : null;
  if (!z) {
    return {
      lecture: "PEB", etat: "hors zone",
      fait: "Aucune zone d'un plan d'exposition au bruit publié par la DGAC à ce point.",
      conclusionAdmissible: "L'adresse ne figure dans aucun plan d'exposition au bruit publié.",
      limites: "Le PEB ne couvre que les aérodromes qui en sont dotés ; il ne dit rien du bruit routier, ferroviaire, ni des survols hors zone.",
      verification: null,
    };
  }
  return {
    lecture: "PEB", etat: "en zone",
    fait: `${PEB_ZONES[z] ?? `zone ${z}`} du plan d'exposition au bruit de ${f.nom} (${f.code_oaci}), arrêté du ${f.date_arret?.slice(0, 10)}${zones.length > 1 ? ` ; le point touche aussi ${zones.slice(1).join(", ")}` : ""}.`,
    traitement: "Point de l'adresse lu dans le plan publié par la DGAC (Géoplateforme) ; zone la plus exposée retenue si plusieurs.",
    conclusionAdmissible: `L'adresse est située en ${PEB_ZONES[z] ?? `zone ${z}`} d'un plan d'exposition au bruit. Un PEB est un zonage d'urbanisme fondé sur des hypothèses de trafic à long terme.`,
    limites: "Le PEB n'est pas une mesure du bruit dans le logement : l'exposition réelle dépend de l'isolation, de l'orientation, des trajectoires et de l'heure. Le plan peut être ancien.",
    verification: [
      "Le vendeur ou le bailleur doit vous remettre un document d'information sur la zone de bruit (code de l'urbanisme, art. L112-11) : demandez-le avant la promesse.",
      "Visitez à des heures de trafic aérien, fenêtres fermées puis ouvertes.",
      ...(pgsZones?.length ? [`L'adresse est aussi dans le plan de gêne sonore (zone ${pgsZones.join(", ")}) de ${pgs.features[0].nom} : renseignez-vous auprès de l'exploitant de l'aéroport sur l'aide à l'insonorisation des logements riverains.`] : []),
    ],
    pgs: pgsZones,
  };
}

// ── B. Débroussaillement (OLD) ──────────────────────────────────────────────────────────────
async function oldPoint(lat, lon) {
  const p = new URLSearchParams({ SERVICE: "WFS", VERSION: "2.0.0", REQUEST: "GetFeature", TYPENAMES: "DEBROUSSAILLEMENT:debroussaillement", OUTPUTFORMAT: "application/json", PROPERTYNAME: "dept,source,millesime,origine,dat_ap_old,url", COUNT: "3", CQL_FILTER: `zonage=2 AND INTERSECTS(geom,${pointCql(lat, lon, "2154")})` });
  const r = await timedFetch(`https://data.geopf.fr/wfs/ows?${p}`);
  const j = tryJson(r.body);
  return j ? { ok: true, features: j.features.map((f) => f.properties) } : { ok: false, statut: r.status };
}
async function oldParcelle(geometry) {
  const p = new URLSearchParams({ SERVICE: "WFS", VERSION: "2.0.0", REQUEST: "GetFeature", TYPENAMES: "DEBROUSSAILLEMENT:debroussaillement", RESULTTYPE: "hits", CQL_FILTER: `zonage=2 AND INTERSECTS(geom,${wktPolygone(geometry, "2154")})` });
  const r = await timedFetch(`https://data.geopf.fr/wfs/ows?${p}`);
  const n = r.body.match(/numberMatched="(\d+)"/)?.[1];
  return n == null ? null : Number(n) > 0;
}

async function lireOld(loc, parc) {
  const pt = await oldPoint(loc.lat, loc.lon);
  if (!pt.ok) return { lecture: "OLD", etat: "indisponible", dire: "Le zonage des obligations de débroussaillement n'a pas pu être lu : rien ne peut être conclu." };
  const auPoint = pt.features.length > 0;
  const parcelleTouche = parc ? await oldParcelle(parc.geometry) : null;
  const enLimite = parc && parcelleTouche !== null && parcelleTouche !== auPoint;
  const f = pt.features[0];
  if (!auPoint && !parcelleTouche) {
    return {
      lecture: "OLD", etat: "hors zone",
      fait: "Le point (et la parcelle, si connue) est hors du zonage informatif publié des obligations légales de débroussaillement.",
      conclusionAdmissible: "Selon le zonage informatif publié, l'adresse n'est pas dans une zone soumise aux obligations légales de débroussaillement.",
      limites: "Le zonage est informatif ; seuls l'arrêté préfectoral et le code forestier font foi. Il couvre 45 départements et peut retarder sur un arrêté récent.",
      verification: null,
    };
  }
  return {
    lecture: "OLD", etat: enLimite ? "en limite de zone" : "en zone",
    fait: enLimite
      ? "La parcelle croise le zonage informatif des obligations légales de débroussaillement, mais le point de l'adresse n'y est pas (ou l'inverse)."
      : `Le point de l'adresse est dans le zonage informatif des obligations légales de débroussaillement (département ${f?.dept}, source ${f?.source}, données de ${f?.millesime}, arrêté du ${f?.dat_ap_old}).`,
    traitement: "Point de l'adresse et parcelle cadastrale lus dans le zonage diffusé (attribut zonage = 2) de la base DÉBROUSSAILLEMENT (IGN, Géoplateforme).",
    conclusionAdmissible: enLimite
      ? "L'adresse est en limite d'une zone soumise aux obligations légales de débroussaillement : une partie du terrain peut être concernée."
      : "L'adresse est dans une zone où les propriétaires doivent débroussailler autour des constructions (obligations légales de débroussaillement).",
    limites: "Le zonage est informatif. La profondeur à débroussailler (souvent 50 m autour des constructions, parfois davantage) et les modalités sont fixées par arrêté préfectoral ; l'état réel du terrain n'est pas connu.",
    verification: [
      "Le vendeur doit vous informer de cette obligation (annonce et état des risques) : demandez quelle surface est à entretenir, à quel coût, et si la bande déborde chez un voisin.",
      "Consultez l'arrêté préfectoral de débroussaillement du département et le service urbanisme de la mairie.",
    ],
  };
}

// ── C. Nappe (lecture prudente) ─────────────────────────────────────────────────────────────
function dansAnneau(lat, lon, ring) {
  let d = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i], [yj, xj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) d = !d;
  }
  return d;
}
async function lireNappe(loc) {
  if (/^97/.test(loc.citycode ?? "")) return { lecture: "Nappe", etat: "non couvert", dire: "La carte nationale de sensibilité aux remontées de nappe ne couvre pas l'outre-mer : aucune lecture possible." };
  const d = 0.002;
  const r = await timedFetch(`https://mapsref.brgm.fr/wxs/georisques/risques?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=ms:REMNAPPE&MAXFEATURES=200&BBOX=${loc.lat - d},${loc.lon - d},${loc.lat + d},${loc.lon + d},urn:ogc:def:crs:EPSG::4326`, { timeoutMs: 20000 });
  if (!r.ok || /Exception/.test(r.body)) return { lecture: "Nappe", etat: "indisponible", dire: "La carte des remontées de nappe n'a pas pu être lue : rien ne peut être conclu." };
  let hit = null;
  for (const m of r.body.matchAll(/<ms:REMNAPPE [\s\S]*?<\/ms:REMNAPPE>/g)) {
    const g = m[0];
    const rings = [...g.matchAll(/<gml:posList[^>]*>([^<]+)<\/gml:posList>/g)].map((x) => { const v = x[1].trim().split(/\s+/).map(Number), ring = []; for (let i = 0; i + 1 < v.length; i += 2) ring.push([v[i], v[i + 1]]); return ring; });
    const [ext, ...trous] = rings;
    if (ext && dansAnneau(loc.lat, loc.lon, ext) && !trous.some((t) => dansAnneau(loc.lat, loc.lon, t))) { hit = { code: g.match(/<ms:gridcode>([^<]*)</)?.[1], fiab: g.match(/<ms:fiab_tot>([^<]*)</)?.[1] }; break; }
  }
  if (!hit) return { lecture: "Nappe", etat: "hors carte", dire: "Aucune maille de la carte au point : la carte ne dit rien ici." };
  if (hit.code === "0") return { lecture: "Nappe", etat: "non sensible selon la carte", fiabilite: hit.fiab, conclusionAdmissible: "La carte nationale ne classe pas ce secteur parmi les zones sensibles aux remontées de nappe.", limites: "Carte de sensibilité à maille d'environ 250 m, établie par modélisation ; une cave peut être humide pour d'autres raisons." };
  if (hit.fiab === "FAIBLE") return { lecture: "Nappe", etat: "non concluant", fiabilite: hit.fiab, conclusionAdmissible: "La carte signale une sensibilité possible, mais avec une fiabilité faible : elle ne permet pas de conclure (Géorisques l'affiche alors comme « risque inconnu »)." };
  return {
    lecture: "Nappe", etat: hit.code === "1" ? "débordement possible" : "inondation de cave possible", fiabilite: hit.fiab,
    fait: `Secteur classé « ${hit.code === "1" ? "potentiellement sujet aux débordements de nappe" : "potentiellement sujet aux inondations de cave"} », fiabilité ${hit.fiab?.toLowerCase()}.`,
    conclusionAdmissible: "La carte nationale du BRGM classe ce secteur parmi les zones où la nappe peut remonter lors des hivers très humides.",
    limites: "Carte de sensibilité modélisée (maille d'environ 250 m), sans probabilité ni historique au logement ; elle ne dit pas si ce bâtiment a un sous-sol.",
    verification: ["Si le bien a une cave ou un sous-sol : demandez s'il a déjà été inondé, cherchez des traces d'humidité ou de pompe de relevage, et interrogez le voisinage."],
  };
}

// ── Exécution ───────────────────────────────────────────────────────────────────────────────
const loc = await localiser();
const precisionAdresse = loc.type === "housenumber" || loc.type === "coordonnees";
const parc = precisionAdresse ? await parcelle(loc.lat, loc.lon) : null;
const res = {
  adresse: loc.label, typeBan: loc.type, lat: loc.lat, lon: loc.lon,
  portee: precisionAdresse ? "à l'adresse" : "à proximité (adresse non localisée au numéro : aucune conclusion « à l'adresse »)",
  parcelle: parc ? `${parc.idu} (${parc.contenance} m²)` : null,
  lectures: [await lirePeb(loc), await lireOld(loc, parc), await lireNappe(loc)],
};
if (args.json) console.log(JSON.stringify(res, null, 1));
else {
  console.log(`\n${res.adresse}  [${res.typeBan}] — lecture ${res.portee}${res.parcelle ? ` — parcelle ${res.parcelle}` : ""}`);
  for (const l of res.lectures) {
    console.log(`\n■ ${l.lecture} : ${l.etat}`);
    for (const k of ["dire", "fait", "traitement", "conclusionAdmissible", "limites"]) if (l[k]) console.log(`  ${k.padEnd(21)} ${l[k]}`);
    if (l.verification) for (const v of l.verification) console.log(`  vérification          ${v}`);
  }
}
