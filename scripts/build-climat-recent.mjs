#!/usr/bin/env node
// LE CLIMAT RÉCENT PAR COMMUNE, POUR L'ACCUEIL (audit du 08/11/2026 : docs/audits/2026-11-08-reference-climatique-recente.md).
//
// ENTRÉE : `data/climat-recent/safran-<période>.json`, les comptes annuels SAFRAN par point de la grille DRIAS
// (`scripts/climat-recent/agreger_safran.py`).
//   et `data/climat-recent/stations-<période>.json`, les stations Météo-France de chaque commune sur la même période
// (`scripts/climat-recent/stations_temoins.py`), témoins de la représentativité de la maille où elles se trouvent
// (contre-revue du 08/11).
// SORTIE : `src/data/climat-recent-communes.json`, la moyenne de la période pour chaque commune : jours à 35 °C et
// plus, jours à 30 °C et plus, nuits tropicales (Tmin > 20 °C, strict, comme DRIAS) ; et, pour les communes qui en
// ont, les stations de leur secteur (leur maille, ou à moins d'une demi-maille). Moins de 1 Mo, empaqueté avec la fonction comme l'extrait DRIAS.
//
// LA JOINTURE N'EST PAS RÉÉCRITE : chaque commune reçoit la valeur du point que DRIAS lui attribue, par les
// fonctions mêmes de `build-drias-median.js` (`loadCommunes`, `parseDriasFile`, `buildNearestPointIndex`, donc
// `joindreAuPointLePlusProche` et ses deux refus). Un climat récent lu sur une autre maille que la projection
// comparerait deux lieux.
//
// Usage :
//   node scripts/build-climat-recent.mjs            VÉRIFIE sans rien écrire (le build l'appelle : prebuild)
//   node scripts/build-climat-recent.mjs --ecrire   RÉGÉNÈRE, après une nouvelle agrégation SAFRAN
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadCommunes, parseDriasFile, buildNearestPointIndex } from "./build-drias-median.js";
import { joindreAuPointLePlusProche } from "./lib/drias-jointure.mjs";

export const PERIODE = [2016, 2025];
export const SOURCE = `data/climat-recent/safran-${PERIODE[0]}-${PERIODE[1]}.json`;
export const STATIONS = `data/climat-recent/stations-${PERIODE[0]}-${PERIODE[1]}.json`;
export const SORTIE = "src/data/climat-recent-communes.json";
// Paris, Lyon, Marseille se lisent sur la maille de leur 1er arrondissement (DRIAS_CITY_FALLBACK) : mêmes stations.
const VILLES = { "75056": "75101", "69123": "69381", "13055": "13201" };
/** La demi-maille SAFRAN (8 km) : au-delà, une station décrit un autre secteur. */
export const RAYON_KM = 4;
function km(a, b, c, d) {
  const r = Math.PI / 180, h = Math.sin(((c - a) * r) / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(((d - b) * r) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
export const CLES = ["tx35", "tx30", "tr20"];

const sha = (b) => createHash("sha256").update(b).digest("hex");
const r2 = (x) => Math.round(x * 100) / 100;

/** Construit le contenu de la sortie, sans rien écrire. */
export async function construire() {
  const brut = readFileSync(SOURCE);
  const src = JSON.parse(brut.toString("utf8"));
  // Schéma 2 (08/11/2026) : nuits tropicales au sens strict de DRIAS (TINF_H > 20). Le schéma 1 comptait >= 20.
  if (src.schema !== 2) throw new Error(`${SOURCE} : schéma ${src.schema}, attendu 2`);
  if (src.periode.join() !== PERIODE.join()) throw new Error(`${SOURCE} : période ${src.periode.join("-")}, attendu ${PERIODE.join("-")}`);
  const nAnnees = PERIODE[1] - PERIODE[0] + 1;
  if (src.source.fichiers.length !== nAnnees) throw new Error(`${SOURCE} : ${src.source.fichiers.length} années, attendu ${nAnnees}`);

  const meta = JSON.parse(readFileSync("data/drias_median_metadata.json", "utf8"));
  if (src.grille_drias.fichier !== meta.canonical_source_file) {
    throw new Error(`${SOURCE} apparié sur ${src.grille_drias.fichier}, DRIAS lit ${meta.canonical_source_file}`);
  }
  const canonique = await parseDriasFile(path.join("data", "source", meta.canonical_source_file));
  const communes = buildNearestPointIndex(await loadCommunes(), Array.from(canonique.records.values()));

  const parCommune = {};
  for (const c of [...communes].sort((a, b) => a.insee_code.localeCompare(b.insee_code))) {
    const p = src.points[c.nearestPointId];
    if (!p) throw new Error(`${c.insee_code} : point ${c.nearestPointId} absent de ${SOURCE}`);
    parCommune[c.insee_code] = CLES.map((k) => {
      const serie = p[k];
      if (!Array.isArray(serie) || serie.length !== nAnnees || !serie.every((v) => Number.isInteger(v) && v >= 0 && v <= 366)) {
        throw new Error(`${c.insee_code} : série ${k} invalide`);
      }
      return r2(serie.reduce((s, v) => s + v, 0) / nAnnees);
    });
  }
  const brutStations = readFileSync(STATIONS);
  const st = JSON.parse(brutStations.toString("utf8"));
  if (st.schema !== 1 || st.periode.join() !== PERIODE.join()) throw new Error(`${STATIONS} : schéma ou période inattendus`);
  // UNE STATION TÉMOIGNE POUR SON SECTEUR. Une commune reçoit les stations de SA maille (rattachées au point de grille
  // le plus proche de leurs coordonnées, par la jointure même des communes) et celles situées à moins d'une
  // demi-maille (RAYON_KM) de son point de référence : une station aussi proche décrit le même lieu, même quand la
  // frontière des mailles passe entre les deux (Briançon : aucune station dans la commune ni dans sa maille, celle de
  // Villar-Saint-Pancrace à 2,4 km). La distance est toujours dite au lecteur.
  const points = Array.from(canonique.records.values()).map((r) => ({ pointId: r.Point, latitude: r.Latitude, longitude: r.Longitude }));
  const { associees } = joindreAuPointLePlusProche(
    Object.entries(st.stations).map(([num, s]) => ({ ...s, num, insee_code: s.insee, commune_name: s.nom, latitude: s.lat, longitude: s.lon })),
    points,
  );
  const parPoint = {};
  for (const s of associees) (parPoint[s.nearestPointId] ||= []).push(s);
  const stations = {};
  for (const c of communes) {
    if (!parCommune[c.insee_code]) continue;
    const proches = associees.filter((s) => Math.abs(s.lat - c.latitude) < 0.1 && km(s.lat, s.lon, c.latitude, c.longitude) <= RAYON_KM);
    const retenues = [...new Set([...(parPoint[c.nearestPointId] ?? []), ...proches])].sort((a, b) => a.num.localeCompare(b.num));
    if (retenues.length) stations[c.insee_code] = retenues.map((s) => [s.nom, s.alti, s.annees, s.tx35, s.tx30, s.tr20, Math.round(km(s.lat, s.lon, c.latitude, c.longitude) * 10) / 10]);
  }
  for (const [ville, arr] of Object.entries(VILLES)) if (stations[arr]) stations[ville] = stations[arr];
  const stationsTriees = Object.fromEntries(Object.keys(stations).sort().map((k) => [k, stations[k]]));
  return {
    schema: 2,
    periode: PERIODE,
    source: {
      fichier: SOURCE,
      sha256: sha(brut),
      producteur: src.source.producteur,
      jeu: src.source.jeu,
      licence: src.source.licence,
      page: src.source.page,
    },
    stations_source: { fichier: STATIONS, sha256: sha(brutStations), jeu: st.source.jeu, licence: st.source.licence, page: st.source.page },
    cles: CLES,
    cles_station: ["nom", "altitude", "annees", ...CLES, "distance_km"],
    communes: parCommune,
    stations: stationsTriees,
  };
}

async function main() {
  if (!existsSync(SOURCE)) throw new Error(`${SOURCE} absent : lancer scripts/climat-recent/agreger_safran.py`);
  const contenu = JSON.stringify(await construire());
  if (process.argv.includes("--ecrire")) {
    writeFileSync(SORTIE, contenu);
    console.log(`${SORTIE} : ${Object.keys(JSON.parse(contenu).communes).length} communes`);
    return;
  }
  if (!existsSync(SORTIE) || readFileSync(SORTIE, "utf8") !== contenu) {
    console.error(`✖ climat récent : ${SORTIE} ne correspond pas à ${SOURCE} : lancer node scripts/build-climat-recent.mjs --ecrire`);
    process.exit(1);
  }
  console.log(`✓ climat récent : ${SORTIE} à jour`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
