#!/usr/bin/env node
/**
 * FUT-82, addendum par échelle : les espaces protégés AU VOISINAGE, et non plus au point.
 *
 * L'audit initial a mesuré les protections au point exact du logement (0 % de Natura 2000 sur 200
 * logements). Cette mesure répond à la question du Logement (« ce terrain est-il protégé ? »), pas à
 * celle d'Autour (« y a-t-il un site naturel majeur près de ce lieu de vie ? »). On la reprend ici, au
 * même échantillon de communes (les 100 tirées au prorata de la population, graine 8282), depuis le
 * point de référence de chaque commune dans l'index du comparateur, à 1 et 3 km.
 *
 * Distances : la couche Patrinat est en EPSG:3857, où un mètre affiché vaut 1/cos(lat) mètre réel ;
 * le rayon passé au filtre est donc multiplié par 1/cos(lat) pour viser une distance réelle.
 *
 *   node scripts/research/fut82/addendum-voisinage.mjs [--out <json>]
 *
 * Lecture seule, 100 communes × 5 couches × 3 rayons, pause de 60 ms entre appels.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { timedFetch, tryJson, parseArgs, pointCql, sleep } from "./lib.mjs";

const args = parseArgs(process.argv);
const OUT = args.out ?? "docs/audits/2026-10-27-fut82/mesures/addendum-voisinage.json";
const DISC = "docs/audits/2026-10-27-fut82/mesures/discrimination-logements.json";
const WFS = "https://data.geopf.fr/wfs/ows";

const COUCHES = [
  ["natura_hab", "patrinat_sic:sic"],
  ["natura_ois", "patrinat_zps:zps"],
  ["parc_national", "patrinat_pn:parc_national"],
  ["reserve_nat", "patrinat_rnn:rnn"],
  ["pnr", "patrinat_pnr:pnr"],
];
const RAYONS = [0, 1000, 3000];

const index = JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz"))).communes;
const parInsee = new Map(index.map((c) => [c.insee, c]));
const insees = [...new Set(JSON.parse(readFileSync(DISC, "utf8")).points.map((p) => p.insee))];

async function compte(typename, lat, lon, rayonReel) {
  const pt = pointCql(lat, lon, "3857");
  const r = rayonReel / Math.cos((lat * Math.PI) / 180);
  const cql = rayonReel === 0 ? `INTERSECTS(geom,${pt})` : `DWITHIN(geom,${pt},${r.toFixed(0)},meters)`;
  const p = new URLSearchParams({ SERVICE: "WFS", VERSION: "2.0.0", REQUEST: "GetFeature", TYPENAMES: typename, OUTPUTFORMAT: "application/json", COUNT: "1", CQL_FILTER: cql, PROPERTYNAME: "nom_site" });
  const res = await timedFetch(`${WFS}?${p}`);
  return tryJson(res.body)?.numberMatched ?? null;
}

const lignes = [];
for (const insee of insees) {
  const c = parInsee.get(insee);
  if (!c) { lignes.push({ insee, erreur: "absente de l'index" }); continue; }
  const l = { insee, nom: c.nom, population: c.population, natureScore: c.nature?.score ?? null, ifmPct: c.pct?.NORIFM40_yr ?? null };
  for (const [cle, tn] of COUCHES) for (const r of RAYONS) { l[`${cle}_${r}`] = await compte(tn, c.lat, c.lon, r); await sleep(60); }
  lignes.push(l);
  process.stderr.write(`${lignes.length} ${c.nom}\n`);
}

const ok = lignes.filter((l) => !l.erreur);
const part = (f) => { const n = ok.filter(f).length; return { n, sur: ok.length, pct: Math.round((1000 * n) / ok.length) / 10 }; };
const pos = (v) => v != null && v > 0;
const fort = (l, r) => ["natura_hab", "natura_ois", "parc_national", "reserve_nat"].some((k) => pos(l[`${k}_${r}`]));
const synthese = {};
for (const r of RAYONS) synthese[`protectionForte_${r}m`] = part((l) => fort(l, r));
for (const r of RAYONS) synthese[`natura_${r}m`] = part((l) => pos(l[`natura_hab_${r}`]) || pos(l[`natura_ois_${r}`]));
synthese.pnr_auPoint = part((l) => pos(l.pnr_0));
// La protection apporte-t-elle autre chose que le score « nature » (OSO) déjà au comparateur ?
const tiers = (l) => (l.natureScore == null ? "?" : l.natureScore >= 66 ? "haut" : l.natureScore < 34 ? "bas" : "moyen");
synthese.natura1kmParTiersNature = Object.fromEntries(["bas", "moyen", "haut"].map((t) => {
  const g = ok.filter((l) => tiers(l) === t);
  return [t, { communes: g.length, avecNatura1km: g.filter((l) => pos(l.natura_hab_1000) || pos(l.natura_ois_1000)).length }];
}));

writeFileSync(OUT, JSON.stringify({ genere: new Date().toISOString(), methode: "point de référence de la commune (index comparateur), 100 communes tirées graine 8282, rayons réels 0/1/3 km", synthese, lignes }, null, 1));
console.log(JSON.stringify(synthese, null, 1));
