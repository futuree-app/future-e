// Contre-épreuve indépendante FUT-149 : frontières alignées sur la grille. Usage : node probes/frontieres.mts <worktree>
const W = process.argv[2];
const lib = await import(`${W}/src/lib/debroussaillement.ts`);
const { lireDebroussaillement, tuilesALire } = lib;
const PAS = 1_000_000;
const LAT = 43.55, mLon = 1 / (111320 * Math.cos(LAT * Math.PI / 180)), mLat = 1 / 111132;
const code = (ring: number[][]) => { const o = [ring[0][0], ring[0][1]]; for (let i = 1; i < ring.length; i++) o.push(ring[i][0] - ring[i - 1][0], ring[i][1] - ring[i - 1][1]); return o; };
const rect = (x0: number, y0: number, x1: number, y1: number) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const profil = (d: string) => ({ departement: d, source: "Zonage IGN", origine: null, millesime: "2020", arrete: null, arreteBrut: null, url: null, integration: null, integrationBrut: null });
type Monde = Record<string, { plein: number } | { p: number; ring: number[][]; trous?: number[][][] }[]>;
function construire(monde: Monde) {
  const tuiles: Record<string, unknown> = {}; const charge = new Map();
  for (const [k, v] of Object.entries(monde)) {
    if (!Array.isArray(v)) { tuiles[k] = { plein: { p: v.plein, o: "Z" + k } }; continue; }
    const [ix, iy] = k.split("_").map(Number);
    tuiles[k] = { octets: 1, sha256: "x".repeat(64) };
    charge.set(k, { format: "debroussaillement-1", edition: "2026-03-01", ix, iy, morceaux: v.map((m, i) => ({ p: m.p, o: `O${k}-${i}`, r: [code(m.ring), ...(m.trous ?? []).map(code)] })) });
  }
  const man = { format: "debroussaillement-1", edition: "2026-03-01", construitLe: "x", producteur: "IGN", diffuseur: "IGN", licence: "LO", source: { url: "u" }, couverture: ["83", "13"], profils: [profil("83"), profil("13")], tuiles };
  return { man, charge };
}
const IX = 50, IY = 435, X1 = (IX + 1) * PAS, Y1 = (IY + 1) * PAS, X0 = IX * PAS, Y0 = IY * PAS;
const ymid = (Y0 + Y1) / 2, xmid = (X0 + X1) / 2;
const lire = (w: ReturnType<typeof construire>, lon: number, lat: number, parcelle: unknown = null) => {
  const e = { point: [lon, lat] as [number, number], geocodage: "housenumber", insee: "83065", parcelle };
  const manquantes = tuilesALire(w.man, e).filter((k: string) => !w.charge.has(k));
  const r = lireDebroussaillement(w.man, w.charge, e);
  return `${r.statut === "indisponible" ? "INDISPONIBLE" : r.etat}${r.limite ? `(${r.limite.cause}${r.limite.distanceM != null ? " " + r.limite.distanceM + "m" : ""})` : ""}${manquantes.length ? " [manque " + manquantes + "]" : ""} grain=${r.grain}${r.parcelleEcartee ? " écartée=" + r.parcelleEcartee : ""}${r.part != null ? " part=" + r.part : ""}`;
};
const D = [1, 5, 10, 20, 49, 55, 100];
const lignes: string[] = [];
const sonde = (titre: string, w: ReturnType<typeof construire>, attendu: (cote: string, d: number) => string, axe: "x" | "y" = "x", y = ymid) => {
  lignes.push(`\n## ${titre}`);
  for (const cote of ["dedans", "dehors"]) for (const d of D) {
    const s = cote === "dedans" ? -1 : 1;
    const [lon, lat] = axe === "x" ? [X1 / 1e7 + s * d * mLon, y / 1e7] : [xmid / 1e7, Y1 / 1e7 + s * d * mLat];
    const r = lire(w, lon, lat); const a = attendu(cote, d);
    lignes.push(`${r.startsWith(a) ? "OK " : "ÉCART"} ${cote} ${d} m → ${r} (attendu ${a})`);
  }
};
const vraie = (c: string, d: number) => d <= 50 ? "en_limite" : c === "dedans" ? "en_zone" : "hors_zone";
const zoneOuest = { p: 0, ring: rect(X0 + 200_000, Y0, X1, Y1) };
// 1. Vraie frontière verticale, voisine absente du manifeste
sonde("1. Vraie limite verticale x=5,1, cellule voisine absente", construire({ "50_435": [zoneOuest] }), vraie);
// 2. Voisine présente mais zone loin de la droite
sonde("2. Vraie limite, voisine listée avec une zone à 2 km", construire({ "50_435": [zoneOuest], "51_435": [{ p: 0, ring: rect(X1 + 200_000, Y0, X1 + 400_000, Y1) }] }), vraie);
// 3. Voisine pleine → coupe
sonde("3. Coupe : voisine pleine (même zone)", construire({ "50_435": [zoneOuest], "51_435": { plein: 0 } }), () => "en_zone");
// 4. Voisine couverte par une zone qui continue (morceau)
sonde("4. Coupe : voisine morceau qui continue sur 2 km", construire({ "50_435": [zoneOuest], "51_435": [{ p: 0, ring: rect(X1, Y0, X1 + 200_000, Y1) }] }), (c, d) => c === "dehors" && d >= 100 ? "en_zone" : "en_zone");
// 5. Deux zones différentes (profils 83 / 13) de part et d'autre
sonde("5. Deux zones de profils différents de part et d'autre", construire({ "50_435": [zoneOuest], "51_435": [{ p: 1, ring: rect(X1, Y0, X1 + 200_000, Y1) }] }), () => "en_zone");
// 6. Voisine partiellement couverte : zone voisine sur la moitié sud seulement ; sonde au nord (vraie limite) et au sud (coupe)
const partiel = construire({ "50_435": [zoneOuest], "51_435": [{ p: 0, ring: rect(X1, Y0, X1 + 200_000, ymid) }] });
sonde("6a. Voisine couverte au sud seulement — sonde au nord à 1 km de la jonction (vraie limite)", partiel, vraie, "x", ymid + 90_000);
sonde("6b. idem — sonde au sud à 1 km de la jonction (coupe)", partiel, (c, d) => "en_zone", "x", ymid - 90_000);
lignes.push("  (6b dehors : la zone voisine s'arrête à 1 km au nord, donc en_zone attendu partout)");
// 6c. au droit de la jonction (point sur y=ymid) : limite nord de la zone voisine perpendiculaire
sonde("6c. idem — au droit de la jonction (y = milieu)", partiel, (c, d) => c === "dehors" ? (d <= 50 ? "en_limite" : "en_limite") : (d <= 50 ? "en_limite" : "en_zone"), "x", ymid);
// 7. Limite horizontale y=43,6, voisine nord absente puis pleine
const zoneSud = { p: 0, ring: rect(X0, Y0 + 200_000, X1, Y1) };
sonde("7a. Vraie limite horizontale y=43,6, voisine nord absente", construire({ "50_435": [zoneSud] }), vraie, "y");
sonde("7b. Coupe horizontale, voisine nord pleine", construire({ "50_435": [zoneSud], "50_436": { plein: 0 } }), () => "en_zone", "y");
// 8. Voisine listée mais non chargée
{ const w = construire({ "50_435": [zoneOuest], "51_435": [{ p: 0, ring: rect(X1, Y0, X1 + 200_000, Y1) }] }); w.charge.delete("51_435");
  lignes.push(`\n## 8. Voisine listée mais non chargée\n  10 m dedans → ${lire(w, X1 / 1e7 - 10 * mLon, ymid / 1e7)}\n  1 km dedans → ${lire(w, X1 / 1e7 - 1000 * mLon, ymid / 1e7)}`); }
// 9. Coin de quatre cellules, toutes en morceaux couvrants (pas pleines) : pas de fausse limite au coin
{ const mk = (ix: number, iy: number) => [{ p: 0, ring: rect(ix * PAS, iy * PAS, (ix + 1) * PAS, (iy + 1) * PAS - (iy === 436 ? 100_000 : 0)) }];
  const w = construire({ "50_435": mk(50, 435), "51_435": mk(51, 435), "50_436": mk(50, 436), "51_436": mk(51, 436) });
  lignes.push(`\n## 9. Coin de quatre cellules couvertes (morceaux)\n  au coin + (3 m, 3 m) → ${lire(w, X1 / 1e7 + 3 * mLon, Y1 / 1e7 + 3 * mLat)}\n  au coin − (3 m, 3 m) → ${lire(w, X1 / 1e7 - 3 * mLon, Y1 / 1e7 - 3 * mLat)}\n  exactement au coin → ${lire(w, X1 / 1e7, Y1 / 1e7)}`); }
// 10. Fragment étroit : bande de 2 m dans la voisine le long de la droite
{ const w = construire({ "50_435": [zoneOuest], "51_435": [{ p: 0, ring: rect(X1, Y0, X1 + Math.round(2 / mLon * 1e7 * mLon * 0 + 2 * mLon * 1e7), Y1) }] });
  lignes.push(`\n## 10. Liseré de 2 m dans la voisine : limite réelle à +2 m\n  10 m dedans → ${lire(w, X1 / 1e7 - 10 * mLon, ymid / 1e7)} (attendu en_limite)\n  1 m dans le liseré → ${lire(w, X1 / 1e7 + 1 * mLon, ymid / 1e7)}\n  45 m dehors → ${lire(w, X1 / 1e7 + 45 * mLon, ymid / 1e7)} (attendu en_limite ~45 m)\n  60 m dehors → ${lire(w, X1 / 1e7 + 60 * mLon, ymid / 1e7)} (attendu hors_zone)`); }
// 11. Encoche de 3 m dans la voisine contre la droite (trou de couverture plus court que le pas d'examen)
{ const g = Math.round(3 * mLat * 1e7);
  const w = construire({ "50_435": [zoneOuest], "51_435": [{ p: 0, ring: [[X1, Y0], [X1 + 200_000, Y0], [X1 + 200_000, Y1], [X1, Y1], [X1, ymid + g], [X1 + 300, ymid + g], [X1 + 300, ymid], [X1, ymid]] }] });
  lignes.push(`\n## 11. Encoche de 3 m × 2,4 m dans la voisine, contre la droite\n  20 m dedans en face → ${lire(w, X1 / 1e7 - 20 * mLon, (ymid + g / 2) / 1e7)} (vérité : limite à 20 m → en_limite)`); }
// 12. Parcelle au contact d'une vraie limite alignée, et d'une coupe
{ const pr = (x0: number, x1: number) => ({ type: "Polygon", coordinates: [[[x0, 43.549], [x1, 43.549], [x1, 43.5495], [x0, 43.5495], [x0, 43.549]]] });
  const vraieL = construire({ "50_435": [zoneOuest] });
  const coupe = construire({ "50_435": [zoneOuest], "51_435": { plein: 0 } });
  const p1 = pr(5.1, 5.1 + 40 * mLon), c1 = [5.1 + 20 * mLon, 43.54925] as [number, number];
  const lp = (w: ReturnType<typeof construire>, p: unknown, pt: [number, number]) => lire(w, pt[0], pt[1], { geometry: p, rattachement: "point", candidatsAuPoint: 1 });
  const p2 = pr(5.1 - 40 * mLon, 5.1), c2 = [5.1 - 20 * mLon, 43.54925] as [number, number];
  const p3 = pr(5.1 - 20 * mLon, 5.1 + 20 * mLon), c3 = [5.1, 43.54925] as [number, number];
  lignes.push(`\n## 12. Parcelles contre la droite x = 5,1`,
    `  dehors, collée à une vraie limite → ${lp(vraieL, p1, c1)} (attendu en_limite bordure)`,
    `  dedans, collée à une vraie limite → ${lp(vraieL, p2, c2)} (attendu en_zone, part 1)`,
    `  à cheval sur une vraie limite → ${lp(vraieL, p3, c3)} (attendu en_limite a_cheval ~50 %)`,
    `  à cheval sur une coupe (voisine pleine) → ${lp(coupe, p3, c3)} (attendu en_zone part 1)`,
    `  dehors collée à une coupe (voisine pleine) → ${lp(coupe, p1, c1)} (attendu en_zone part 1)`);
}
console.log(lignes.join("\n"));
