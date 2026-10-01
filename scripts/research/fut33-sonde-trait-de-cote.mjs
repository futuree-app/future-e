#!/usr/bin/env node
// SONDE FUT-33 (recherche, hors produit) : distance au trait de côte officiel pour quelques communes.
//
// Source : Limite terre-mer Shom-IGN (2021, Licence Ouverte 2.0), service WFS public, couche ligne.
// Contour communal : geo.api.gouv.fr (IGN ADMIN EXPRESS). Aucun fichier n'est écrit dans le dépôt.
//
// Deux mesures par commune :
//   - point : depuis le centre géométrique de la commune (le point de référence de l'index futur•e) ;
//   - territoire : depuis le contour communal (0 si le territoire touche la ligne).
//
// LIMITE ASSUMÉE : la ligne n'est PAS coupée aux limites transversales de la mer (LTM). Elle remonte donc
// les estuaires soumis à la marée (Garonne à Bordeaux, Loire à Nantes, Orne à Caen). C'est précisément ce
// que la sonde sert à montrer ; la coupure est une étape de la construction réelle (audit FUT-33, §6).
//
// Usage : node scripts/research/fut33-sonde-trait-de-cote.mjs 17094 22113 33063
const WFS = "https://services.data.shom.fr/INSPIRE/wfs";
const R = 6371000;
const proj = (lon, lat, lat0) => [((lon * Math.PI) / 180) * R * Math.cos((lat0 * Math.PI) / 180), ((lat * Math.PI) / 180) * R];

function distPointSeg(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}
function secantes(p1, p2, p3, p4) {
  const d = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  return (d(p3, p4, p1) > 0) !== (d(p3, p4, p2) > 0) && (d(p1, p2, p3) > 0) !== (d(p1, p2, p4) > 0);
}
function dansAnneau(p, anneau) {
  let dedans = false;
  for (let i = 0, j = anneau.length - 1; i < anneau.length; j = i++) {
    const [xi, yi] = anneau[i];
    const [xj, yj] = anneau[j];
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) dedans = !dedans;
  }
  return dedans;
}

async function segmentsDeCote(lon, lat, demiLargeur) {
  const bbox = `${lon - demiLargeur},${lat - demiLargeur * 0.7},${lon + demiLargeur},${lat + demiLargeur * 0.7},urn:ogc:def:crs:OGC:1.3:CRS84`;
  const url = `${WFS}?service=WFS&version=2.0.0&request=GetFeature&typeNames=LIMTM_2154_WFS:limite_terre_mer_france_metropolitaine_ligne&count=60000&outputFormat=application/json&srsName=EPSG:4326&bbox=${bbox}`;
  const d = await (await fetch(url)).json();
  const segs = [];
  for (const f of d.features) {
    const lignes = f.geometry.type === "MultiLineString" ? f.geometry.coordinates : [f.geometry.coordinates];
    for (const l of lignes) for (let i = 1; i < l.length; i++) segs.push([l[i - 1], l[i]]);
  }
  return segs;
}

for (const insee of process.argv.slice(2)) {
  const geo = await (await fetch(`https://geo.api.gouv.fr/communes/${insee}?fields=nom,centre,contour&geometry=contour`)).json();
  const [lon0, lat0] = geo.centre.coordinates;
  let segs = [];
  let demiLargeur = 0.15;
  while (demiLargeur <= 1.6) {
    segs = await segmentsDeCote(lon0, lat0, demiLargeur);
    if (segs.length) break;
    demiLargeur *= 2;
  }
  const P = (c) => proj(c[0], c[1], lat0);
  const S = segs.map(([a, b]) => [P(a), P(b)]);
  let point = S.length ? Infinity : null;
  for (const [a, b] of S) point = Math.min(point, distPointSeg(P([lon0, lat0]), a, b));
  const anneaux = (geo.contour.type === "MultiPolygon" ? geo.contour.coordinates.map((p) => p[0]) : [geo.contour.coordinates[0]]).map((r) => r.map(P));
  let touche = false;
  let territoire = Infinity;
  for (const r of anneaux) {
    for (let i = 1; i < r.length; i++) {
      for (const [a, b] of S) {
        if (!touche && secantes(r[i - 1], r[i], a, b)) touche = true;
        territoire = Math.min(territoire, distPointSeg(r[i], a, b));
      }
    }
  }
  if (!touche) touche = S.some(([a]) => anneaux.some((r) => dansAnneau(a, r)));
  console.log(JSON.stringify({
    insee, nom: geo.nom,
    point_km: point == null ? null : +(point / 1000).toFixed(1),
    territoire_km: S.length ? (touche ? 0 : +(territoire / 1000).toFixed(1)) : null,
    touche, rayon_recherche_deg: demiLargeur,
  }));
}
