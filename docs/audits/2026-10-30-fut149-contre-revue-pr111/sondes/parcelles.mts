const W = process.argv[2];
const { lireDebroussaillement } = await import(`${W}/src/lib/debroussaillement.ts`);
const PAS = 1_000_000, IX = 50, IY = 435, X1 = (IX + 1) * PAS;
const LAT = 43.55, mLon = 1 / (111320 * Math.cos(LAT * Math.PI / 180)), mLat = 1 / 111132;
const code = (r: number[][]) => { const o = [r[0][0], r[0][1]]; for (let i = 1; i < r.length; i++) o.push(r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1]); return o; };
// Zone : ouest de la droite x = 5,07 (vraie limite NON alignée), dans la cellule 50_435
const XL = 5.07;
const man = { format: "debroussaillement-1", edition: "2026-03-01", construitLe: "x", producteur: "IGN", diffuseur: "IGN", licence: "LO", source: { url: "u" }, couverture: ["83"],
  profils: [{ departement: "83", source: "Zonage IGN", origine: null, millesime: "2020", arrete: null, arreteBrut: null, url: null, integration: null, integrationBrut: null }],
  tuiles: { "50_435": { octets: 1, sha256: "x" } } };
const tuiles = new Map([["50_435", { format: "debroussaillement-1", edition: "2026-03-01", ix: 50, iy: 435, morceaux: [{ p: 0, o: "Z", r: [code([[IX * PAS, IY * PAS], [XL * 1e7, IY * PAS], [XL * 1e7, (IY + 1) * PAS], [IX * PAS, (IY + 1) * PAS]])] }] }]]);
// Parcelle carrée de 30 m, centrée sur (cx, cy)
const carre = (cx: number, cy: number, l = 30) => ({ type: "Polygon", coordinates: [[[cx - l / 2 * mLon, cy - l / 2 * mLat], [cx + l / 2 * mLon, cy - l / 2 * mLat], [cx + l / 2 * mLon, cy + l / 2 * mLat], [cx - l / 2 * mLon, cy + l / 2 * mLat], [cx - l / 2 * mLon, cy - l / 2 * mLat]]] });
const lire = (pt: [number, number], parcelle: unknown, geocodage = "housenumber") => {
  const r = lireDebroussaillement(man, tuiles, { point: pt, geocodage, insee: "83065", parcelle });
  return `${r.etat}${r.limite ? "(" + r.limite.cause + (r.limite.distanceM != null ? " " + r.limite.distanceM + "m" : "") + ")" : ""} grain=${r.grain} écartée=${r.parcelleEcartee} part=${r.part}`;
};
const Y = 43.55, C = XL + 100 * mLon; // parcelle hors zone à 100 m de la limite (centre)
const V = XL - 100 * mLon;            // parcelle voisine, dans la zone
const P = carre(C, Y), PV = carre(V, Y);
const cas: [string, [number, number], unknown, string][] = [
  ["point strictement dans la parcelle (hors zone)", [C, Y], { geometry: P, rattachement: "point" }, "hors_zone grain=parcelle"],
  ["parcelle VOISINE dans la zone, déclarée « point », point hors zone à 100 m", [C, Y], { geometry: PV, rattachement: "point" }, "hors_zone grain=point écartée=hors_point"],
  ["parcelle voisine HORS zone déclarée « point », point dans la zone", [V, Y], { geometry: P, rattachement: "point" }, "en_zone grain=point écartée=hors_point"],
  ["point exactement sur le bord de la parcelle", [C + 15 * mLon, Y], { geometry: P, rattachement: "point" }, "grain=point écartée=limite"],
  ["point à 5 mm dedans", [C + 15 * mLon - 0.005 * mLon, Y], { geometry: P, rattachement: "point" }, "grain=point écartée=limite"],
  ["point à 5 mm dehors", [C + 15 * mLon + 0.005 * mLon, Y], { geometry: P, rattachement: "point" }, "grain=point écartée=limite"],
  ["point à 2 cm dedans", [C + 15 * mLon - 0.02 * mLon, Y], { geometry: P, rattachement: "point" }, "grain=parcelle"],
  ["point à 2 cm dehors", [C + 15 * mLon + 0.02 * mLon, Y], { geometry: P, rattachement: "point" }, "grain=point écartée=hors_point"],
  ["parcelle mal formée (nœud papillon)", [C, Y], { geometry: { type: "Polygon", coordinates: [[[C - 1e-4, Y - 1e-4], [C + 1e-4, Y + 1e-4], [C + 1e-4, Y - 1e-4], [C - 1e-4, Y + 1e-4], [C - 1e-4, Y - 1e-4]]] }, rattachement: "point" }, "grain=point écartée=non_mesurable"],
  ["parcelle vide / coordonnées absentes", [C, Y], { geometry: { type: "Polygon", coordinates: [] }, rattachement: "point" }, "grain=point écartée=non_mesurable"],
  ["plusieurs candidats au point", [C, Y], { geometry: P, rattachement: "point", candidatsAuPoint: 2 }, "grain=point écartée=limite"],
  ["repli", [C, Y], { geometry: P, rattachement: "repli" }, "grain=point écartée=repli"],
  ["parcelle à cheval (centre sur la limite), point dans la moitié hors zone", [XL + 5 * mLon, Y], { geometry: carre(XL, Y), rattachement: "point" }, "en_limite(a_cheval) grain=parcelle"],
  ["parcelle à cheval, point dans la moitié EN zone", [XL - 5 * mLon, Y], { geometry: carre(XL, Y), rattachement: "point" }, "en_limite(a_cheval) grain=parcelle"],
  ["parcelle MultiPolygon dont le point est dans le 2e polygone", [C, Y], { geometry: { type: "MultiPolygon", coordinates: [carre(V, Y).coordinates, P.coordinates] }, rattachement: "point" }, "grain=parcelle"],
  ["parcelle avec un trou contenant le point", [C, Y], { geometry: { type: "Polygon", coordinates: [carre(C, Y, 60).coordinates[0], carre(C, Y, 10).coordinates[0]] }, rattachement: "point" }, "grain=point écartée=hors_point"],
  ["géocodage à la rue avec parcelle voisine en zone", [C, Y], { geometry: PV, rattachement: "point" }, "hors_zone grain=point écartée=null"],
];
for (const [t, pt, p, att] of cas) {
  const r = lire(pt, p, t.startsWith("géocodage à la rue") ? "street" : "housenumber");
  const ok = att.split(" ").every((x) => r.includes(x));
  console.log(`${ok ? "OK   " : "ÉCART"} ${t}\n       → ${r}${ok ? "" : "   (attendu : " + att + ")"}`);
}
