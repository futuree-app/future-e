#!/usr/bin/env node
/**
 * build-bruit-aerien.mjs (FUT-146)
 *
 * Construit data/bruit-aerien.json : les zones des PLANS D'EXPOSITION AU BRUIT (PEB) et des PLANS DE GÊNE
 * SONORE (PGS) des aérodromes, telles que la DGAC les publie sur la Géoplateforme IGN.
 *
 * ── POURQUOI UNE COPIE VERSIONNÉE, ET PAS UN APPEL PAR DOSSIER ─────────────────────────────────────────
 *  - Le service est tombé le 27/10/2026 pendant la vérification (réponses en 10 s, exception servie en
 *    HTTP 200) : un dossier généré à ce moment-là aurait perdu la lecture.
 *  - Le GetFeatureInfo rend une géométrie SIMPLIFIÉE (242 sommets contre 593 pour la zone C d'Orly) et sa
 *    tolérance de clic n'est pas fiable (une emprise autour d'Orly renvoie des zones de Lille et de Tours).
 *  - Un PEB change par arrêté, à quelques années d'intervalle : une copie datée et rejouable suffit, et
 *    les tests peuvent tirer leurs cas attendus des fichiers officiels eux-mêmes.
 *
 * ── LA SOURCE ─────────────────────────────────────────────────────────────────────────────────────────
 *  GetMap KML de la Géoplateforme (WMS vecteur), en mode vecteur intégral (`kmscore:100`), sur l'emprise
 *  de la France entière. Contrôlé le 27/10/2026 : géométrie identique à l'octet quelle que soit l'emprise
 *  demandée (pas de généralisation par échelle), coordonnées à 6 décimales.
 *
 * ── LES CONTRÔLES (le script s'arrête au lieu d'écrire une copie incomplète) ─────────────────────────
 *  - Chaque aérodrome de la liste officielle des arrêtés (WFS `dgac_peb_arrete_wfs`) a au moins une zone.
 *  - Le PGS couvre exactement les aérodromes qu'il publie, trois zones chacun.
 *  - Chaque zone a une lettre (A-D) ou un numéro (1-3) reconnus.
 *  - La date de l'arrêté est lue deux fois (attribut et nom du document) : retenue si elles concordent.
 *
 * Licence : aucune déclarée par la DGAC ; les CGU de la Géoplateforme (15/10/2024) appliquent alors la
 * Licence Ouverte Etalab. Cf. docs/audits/2026-10-27-fut146/01-sources.md.
 *
 * Usage : node scripts/build-bruit-aerien.mjs [--brut <dossier>]   (--brut : garde les réponses brutes)
 */
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { aireRegion, projectionPour, regionDe, regionMesurable } from "../src/lib/geometrie-parcelle.ts";

const WMS = "https://data.geopf.fr/wms-v/ows";
const WFS = "https://data.geopf.fr/wfs/ows";
const EMPRISE = "-22,-62,51,56"; // lat min, lon min, lat max, lon max : métropole et outre-mer
const kml = (couche) =>
  `${WMS}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=${couche}&STYLES=&CRS=EPSG:4326&BBOX=${EMPRISE}` +
  `&WIDTH=1024&HEIGHT=1024&FORMAT=application/vnd.google-earth.kml%2Bxml&FORMAT_OPTIONS=kmscore:100;mode:download;kmattr:true`;
const SOURCES = {
  peb: kml("dgac_peb_plan_wmsv"),
  pgs: kml("dgac_pgs_plan_wmsv"),
  arretesPeb: `${WFS}?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=dgac_peb_arrete_wfs:dgac_peb_arrete_wfs&COUNT=1000&OUTPUTFORMAT=application/json`,
};
const SORTIE = path.resolve("data/bruit-aerien.json");

const args = process.argv.slice(2);
const brut = args.includes("--brut") ? args[args.indexOf("--brut") + 1] : null;

async function lire(url, essais = 3) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
      const corps = await res.text();
      // Une exception de la Géoplateforme est servie en HTTP 200 : le corps décide, pas le statut.
      if (!res.ok || /ServiceException|ExceptionReport/.test(corps.slice(0, 600))) throw new Error(`réponse invalide (${res.status}) : ${corps.slice(0, 200)}`);
      return corps;
    } catch (e) {
      if (i >= essais) throw e;
      console.warn(`essai ${i} échoué, nouvelle tentative dans 10 s : ${String(e).slice(0, 160)}`);
      await new Promise((r) => setTimeout(r, 10_000));
    }
  }
}

const decoder = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

/** Les placemarks d'un KML GeoServer : attributs (`kmattr`) et polygones (le point d'étiquette est ignoré). */
function placemarks(texte) {
  const out = [];
  for (const m of texte.matchAll(/<Placemark id="([^"]+)">([\s\S]*?)<\/Placemark>/g)) {
    const [, id, corps] = m;
    const desc = decoder(corps.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? "");
    const props = Object.fromEntries(
      [...desc.matchAll(/atr-name">([^<]+)<\/span>:<\/strong>\s*<span class="atr-value">([^<]*)<\/span>/g)].map((x) => [x[1], x[2].trim()]),
    );
    const polygones = [];
    for (const p of corps.matchAll(/<Polygon>([\s\S]*?)<\/Polygon>/g)) {
      const anneaux = [];
      const ext = p[1].match(/<outerBoundaryIs>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>/);
      if (!ext) throw new Error(`${id} : polygone sans contour`);
      for (const c of [ext[1], ...[...p[1].matchAll(/<innerBoundaryIs>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>/g)].map((x) => x[1])]) {
        anneaux.push(c.trim().split(/\s+/).map((t) => t.split(",").slice(0, 2).map(Number)));
      }
      polygones.push(anneaux);
    }
    out.push({ id, props, geometry: { type: "MultiPolygon", coordinates: polygones } });
  }
  return out;
}

/** « PEB_LFPO_21_12_2012.pdf » ou « PGS_LFMN_2024_05_14.pdf » -> AAAA-MM-JJ. Une espace parasite est tolérée. */
function dateDuDocument(url) {
  const jma = url?.match(/_\s*(\d{2})_(\d{2})_(\d{4})\.pdf$/i);
  if (jma) return `${jma[3]}-${jma[2]}-${jma[1]}`;
  const amj = url?.match(/_\s*(\d{4})_(\d{2})_(\d{2})\.pdf$/i);
  return amj ? `${amj[1]}-${amj[2]}-${amj[3]}` : null;
}
/** « 12/21/12, 12:00 AM » (format du KML, année sur deux chiffres) -> mois, jour, année courte. */
function dateKml(s) {
  const m = s?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}),/);
  return m ? { mois: Number(m[1]), jour: Number(m[2]), an2: m[3] } : null;
}
/** La date retenue : celle du document, si l'attribut la confirme (mois, jour, deux derniers chiffres). */
function dateArrete(attribut, document) {
  const d = dateDuDocument(document);
  const k = dateKml(attribut);
  if (!d || !k) return null;
  const [a, m, j] = d.split("-");
  return Number(m) === k.mois && Number(j) === k.jour && a.slice(2) === k.an2 ? d : null;
}

const arrondi = (v) => Math.round(v * 1e6) / 1e6;
function boite(g) {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const p of g.coordinates) for (const r of p) for (const [x, y] of r) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return [x0, y0, x1, y1].map(arrondi);
}
/** Mesurable au sens de FUT-81 (anneaux cohérents, aire non nulle), projetée sur la zone elle-même. */
function valide(g) {
  const r = regionDe(g, projectionPour(g, [0, 0]));
  return !!r && aireRegion(r) > 0 && regionMesurable(r);
}

function zone(f, plan) {
  const p = f.props;
  const z = String(p.zone ?? "").trim().toUpperCase();
  const attendues = plan === "peb" ? ["A", "B", "C", "D"] : ["1", "2", "3"];
  if (!attendues.includes(z)) throw new Error(`${f.id} : zone « ${p.zone} » non reconnue`);
  const document = /^https?:\/\//.test(p.ref_doc ?? "") ? p.ref_doc : null;
  const date = dateArrete(plan === "peb" ? p.date_arret : p.date_arrete, document);
  const geometry = { type: "MultiPolygon", coordinates: f.geometry.coordinates.map((poly) => poly.map((r) => r.map(([x, y]) => [arrondi(x), arrondi(y)]))) };
  return {
    id: f.id.split(".").pop(),
    oaci: p.code_oaci,
    aerodrome: p.nom,
    zone: plan === "peb" ? z : ["I", "II", "III"][Number(z) - 1],
    dateArrete: date,
    document,
    valide: valide(geometry),
    bbox: boite(geometry),
    geometry,
  };
}

const sha = (t) => createHash("sha256").update(t).digest("hex");

const [pebKml, pgsKml, arretesTxt] = [await lire(SOURCES.peb), await lire(SOURCES.pgs), await lire(SOURCES.arretesPeb)];
if (brut) {
  await fs.mkdir(brut, { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(brut, "peb.kml"), pebKml), fs.writeFile(path.join(brut, "pgs.kml"), pgsKml),
    fs.writeFile(path.join(brut, "peb-arretes.json"), arretesTxt),
  ]);
}

const arretes = JSON.parse(arretesTxt);
const peb = placemarks(pebKml).map((f) => zone(f, "peb"));
const pgs = placemarks(pgsKml).map((f) => zone(f, "pgs"));

// ── Contrôles d'exhaustivité ────────────────────────────────────────────────────────────────────────
const oaciArretes = new Set(arretes.features.map((f) => f.properties.oaci));
if (arretes.numberMatched !== arretes.features.length) throw new Error(`liste des arrêtés tronquée (${arretes.features.length}/${arretes.numberMatched})`);
const oaciPeb = new Set(peb.map((z) => z.oaci));
const manquants = [...oaciArretes].filter((o) => !oaciPeb.has(o));
if (manquants.length) throw new Error(`aérodromes à arrêté sans aucune zone : ${manquants.join(", ")}`);
const oaciPgs = [...new Set(pgs.map((z) => z.oaci))];
for (const o of oaciPgs) {
  const zs = pgs.filter((z) => z.oaci === o).map((z) => z.zone).sort().join(",");
  if (zs !== "I,II,III") throw new Error(`PGS ${o} : zones ${zs}`);
}
if (new Set(peb.map((z) => z.id)).size !== peb.length) throw new Error("identifiants PEB en double");

const compte = (l, f) => l.reduce((a, x) => ((a[f(x)] = (a[f(x)] ?? 0) + 1), a), {});
const meta = {
  schema: "bruit-aerien-1",
  extraitLe: new Date().toISOString().slice(0, 10),
  producteur: "DGAC",
  diffuseur: "Géoplateforme IGN",
  // Aucune licence déclarée par la DGAC : les CGU de la Géoplateforme (15/10/2024) appliquent la Licence Ouverte.
  licence: "Licence Ouverte Etalab",
  sources: SOURCES,
  // La réponse WFS porte l'heure de la requête (`timeStamp`) : l'empreinte des arrêtés se calcule sur
  // leurs seules propriétés, triées, pour qu'une réextraction identique donne la même copie.
  empreintesSha256: {
    peb: sha(pebKml), pgs: sha(pgsKml),
    arretesPeb: sha(JSON.stringify(arretes.features.map((f) => [f.properties.oaci, f.properties.nom, f.properties.arrete_peb]).sort())),
  },
  comptes: {
    aerodromesArretesPeb: oaciArretes.size,
    aerodromesPeb: oaciPeb.size,
    aerodromesPebSansArreteListe: [...oaciPeb].filter((o) => !oaciArretes.has(o)).sort(),
    zonesPeb: compte(peb, (z) => z.zone),
    aerodromesPgs: oaciPgs.sort(),
    zonesPgs: pgs.length,
    datesNonConfirmees: [...peb, ...pgs].filter((z) => !z.dateArrete).length,
    geometriesNonMesurables: [...peb, ...pgs].filter((z) => !z.valide).map((z) => `${z.oaci} ${z.zone} (${z.id})`),
  },
};

// Une ligne par zone : le diff d'une réextraction se lit zone par zone.
const lignes = (l) => l.map((z) => `    ${JSON.stringify(z)}`).join(",\n");
await fs.writeFile(
  SORTIE,
  `{\n  "meta": ${JSON.stringify(meta, null, 2).replace(/\n/g, "\n  ")},\n  "peb": [\n${lignes(peb)}\n  ],\n  "pgs": [\n${lignes(pgs)}\n  ]\n}\n`,
);
const taille = (await fs.stat(SORTIE)).size;
console.log(`${path.relative(process.cwd(), SORTIE)} : ${peb.length} zones PEB (${oaciPeb.size} aérodromes), ${pgs.length} zones PGS (${oaciPgs.length} aérodromes), ${(taille / 1e6).toFixed(1)} Mo`);
console.log(JSON.stringify(meta.comptes, null, 2));
