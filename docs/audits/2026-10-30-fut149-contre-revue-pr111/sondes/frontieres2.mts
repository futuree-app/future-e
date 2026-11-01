// Contre-revue FUT-149, format `debroussaillement-2` : les scénarios de `frontieres.mts` (frontières alignées sur la
// grille), mais construits par le VRAI `construire.py` (via `construire_monde.py`) au lieu de tuiles écrites à la
// main, puis lus par la lib. Mêmes points, mêmes attendus (la vérité géométrique ne dépend pas du format).
//   node frontieres2.mts <worktree> <python> <dossier de travail>
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { execFileSync } from "node:child_process";
import path from "node:path";

const [W, PY, TRAVAIL] = process.argv.slice(2);
const ICI = path.dirname(new URL(import.meta.url).pathname);
const { lireDebroussaillement, tuilesALire } = await import(`${W}/src/lib/debroussaillement.ts`);
const LAT = 43.55, mLon = 1 / (111320 * Math.cos(LAT * Math.PI / 180)), mLat = 1 / 111132;
const [X0, X1, Y0, Y1] = [5.0, 5.1, 43.5, 43.6];
const ymid = 43.55, xmid = 5.05;
type Z = { o: string; p: number; anneaux: number[][][] };
const r = (o: string, x0: number, y0: number, x1: number, y1: number, p = 0): Z => ({ o, p, anneaux: [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]] });
const ouest = r("OUEST", X0 + 0.02, Y0, X1, Y1);
const g3 = 3 * mLat;
const MONDES: Record<string, Z[]> = {
  m1: [ouest],
  m2: [ouest, r("LOIN", X1 + 0.02, Y0, X1 + 0.04, Y1)],
  m3: [ouest, r("PLEIN", X1, Y0, X1 + 0.1, Y1)],
  m4: [ouest, r("SUITE", X1, Y0, X1 + 0.02, Y1)],
  m5: [ouest, r("AUTRE", X1, Y0, X1 + 0.02, Y1, 1)],
  m6: [ouest, r("SUD", X1, Y0, X1 + 0.02, ymid)],
  m7a: [r("SUDB", X0, Y0 + 0.02, X1, Y1)],
  m7b: [r("SUDB", X0, Y0 + 0.02, X1, Y1), r("NORD", X0, Y1, X1, Y1 + 0.1)],
  m9: [r("C1", 5.0, 43.5, 5.1, 43.6), r("C2", 5.1, 43.5, 5.2, 43.6), r("C3", 5.0, 43.6, 5.1, 43.69), r("C4", 5.1, 43.6, 5.2, 43.69)],
  m10: [ouest, r("LISERE", X1, Y0, X1 + 2 * mLon, Y1)],
  m11: [ouest, { o: "ENCOCHE", p: 0, anneaux: [[[X1, Y0], [X1 + 0.02, Y0], [X1 + 0.02, Y1], [X1, Y1], [X1, ymid + g3], [X1 + 0.00003, ymid + g3], [X1 + 0.00003, ymid], [X1, ymid], [X1, Y0]]] }],
};
mkdirSync(TRAVAIL, { recursive: true });
writeFileSync(`${TRAVAIL}/mondes.json`, JSON.stringify(MONDES));
console.log(execFileSync(PY, ["-I", `${ICI}/construire_monde.py`, `${W}/scripts/debroussaillement/construire.py`, `${TRAVAIL}/mondes.json`, TRAVAIL]).toString().trim());

function monde(nom: string) {
  const ed = `${TRAVAIL}/${nom}/2026-03-01`;
  const man = JSON.parse(readFileSync(`${ed}/manifest.json`, "utf8"));
  const charge = new Map(Object.keys(man.tuiles).filter((k) => !("plein" in man.tuiles[k])).map((k) => [k, JSON.parse(gunzipSync(readFileSync(`${ed}/t/${k}.json.gz`)).toString())]));
  return { man, charge };
}
const lire = (w: ReturnType<typeof monde>, lon: number, lat: number, parcelle: unknown = null) => {
  const e = { point: [lon, lat] as [number, number], geocodage: "housenumber", insee: "83065", parcelle };
  const manquantes = tuilesALire(w.man, e).filter((k: string) => !w.charge.has(k));
  const l = lireDebroussaillement(w.man, w.charge, e);
  return `${l.statut === "indisponible" ? "INDISPONIBLE" : l.etat}${l.limite ? `(${l.limite.cause}${l.limite.distanceM != null ? " " + l.limite.distanceM + "m" : ""})` : ""}${manquantes.length ? " [manque " + manquantes + "]" : ""} grain=${l.grain}${l.parcelleEcartee ? " écartée=" + l.parcelleEcartee : ""}${l.part != null ? " part=" + l.part : ""}`;
};
const D = [1, 5, 10, 20, 49, 55, 100];
const lignes: string[] = [];
let ok = 0, ecarts = 0;
const verifier = (r: string, a: string) => { const bon = r.startsWith(a); bon ? ok++ : ecarts++; return bon ? "OK " : "ÉCART"; };
const sonde = (titre: string, w: ReturnType<typeof monde>, attendu: (cote: string, d: number) => string, axe: "x" | "y" = "x", y = ymid) => {
  lignes.push(`\n## ${titre}`);
  for (const cote of ["dedans", "dehors"]) for (const d of D) {
    const s = cote === "dedans" ? -1 : 1;
    const [lon, lat] = axe === "x" ? [X1 + s * d * mLon, y] : [xmid, Y1 + s * d * mLat];
    const res = lire(w, lon, lat); const a = attendu(cote, d);
    lignes.push(`${verifier(res, a)} ${cote} ${d} m → ${res} (attendu ${a})`);
  }
};
const vraie = (c: string, d: number) => d <= 50 ? "en_limite" : c === "dedans" ? "en_zone" : "hors_zone";
sonde("1. Vraie limite verticale x=5,1, cellule voisine absente", monde("m1"), vraie);
sonde("2. Vraie limite, voisine listée avec une zone à 2 km", monde("m2"), vraie);
sonde("3. Coupe : la zone continue (voisine entièrement couverte)", monde("m3"), () => "en_zone");
sonde("4. Coupe : voisine morceau qui continue sur 2 km", monde("m4"), () => "en_zone");
sonde("5. Deux zones de profils différents de part et d'autre", monde("m5"), () => "en_zone");
const partiel = monde("m6");
sonde("6a. Voisine couverte au sud seulement — sonde au nord à 1 km de la jonction (vraie limite)", partiel, vraie, "x", ymid + 0.009);
sonde("6b. idem — sonde au sud à 1 km de la jonction (coupe)", partiel, () => "en_zone", "x", ymid - 0.009);
sonde("6c. idem — au droit de la jonction (y = milieu)", partiel, (c, d) => c === "dehors" ? "en_limite" : (d <= 50 ? "en_limite" : "en_zone"), "x", ymid);
sonde("7a. Vraie limite horizontale y=43,6, voisine nord absente", monde("m7a"), vraie, "y");
sonde("7b. Coupe horizontale, la zone continue au nord", monde("m7b"), () => "en_zone", "y");
{ const w = monde("m4"); w.charge.delete("51_435");
  const a = lire(w, X1 - 10 * mLon, ymid), b = lire(w, X1 - 1000 * mLon, ymid);
  lignes.push(`\n## 8. Voisine listée mais non chargée`, `${verifier(a, "INDISPONIBLE")} 10 m dedans → ${a}`, `${verifier(b, "en_zone")} 1 km dedans → ${b} (la fenêtre de 60 m ne demande pas la voisine : lecture légitime)`); }
{ const w = monde("m9");
  const res = [lire(w, X1 + 3 * mLon, Y1 + 3 * mLat), lire(w, X1 - 3 * mLon, Y1 - 3 * mLat), lire(w, X1, Y1)];
  lignes.push(`\n## 9. Coin de quatre cellules couvertes`, ...res.map((x, i) => `${verifier(x, "en_zone")} ${["coin + (3 m, 3 m)", "coin − (3 m, 3 m)", "exactement au coin"][i]} → ${x}`)); }
{ const w = monde("m10");
  const c = [[lire(w, X1 - 10 * mLon, ymid), "en_limite"], [lire(w, X1 + 1 * mLon, ymid), "en_limite"], [lire(w, X1 + 45 * mLon, ymid), "en_limite(point_proche 45m)"], [lire(w, X1 + 60 * mLon, ymid), "hors_zone"]];
  lignes.push(`\n## 10. Liseré de 2 m dans la voisine : limite réelle à +2 m`, ...c.map(([x, a], i) => `${verifier(x, a)} ${["10 m dedans", "1 m dans le liseré", "45 m dehors", "60 m dehors"][i]} → ${x} (attendu ${a})`)); }
{ const w = monde("m11"); const x = lire(w, X1 - 20 * mLon, ymid + g3 / 2);
  lignes.push(`\n## 11. Encoche de 3 m × 2,4 m dans la voisine, contre la droite`, `${verifier(x, "en_limite")} 20 m dedans en face → ${x} (vérité : limite à 20 m)`); }
{ const pr = (x0: number, x1: number) => ({ type: "Polygon", coordinates: [[[x0, 43.549], [x1, 43.549], [x1, 43.5495], [x0, 43.5495], [x0, 43.549]]] });
  const vraieL = monde("m1"), coupe = monde("m3");
  const lp = (w: ReturnType<typeof monde>, p: unknown, pt: [number, number]) => lire(w, pt[0], pt[1], { geometry: p, rattachement: "point", candidatsAuPoint: 1 });
  const p1 = pr(5.1, 5.1 + 40 * mLon), c1: [number, number] = [5.1 + 20 * mLon, 43.54925];
  const p2 = pr(5.1 - 40 * mLon, 5.1), c2: [number, number] = [5.1 - 20 * mLon, 43.54925];
  const p3 = pr(5.1 - 20 * mLon, 5.1 + 20 * mLon), c3: [number, number] = [5.1, 43.54925];
  const c = [[lp(vraieL, p1, c1), "en_limite(bordure)", "dehors, collée à une vraie limite"], [lp(vraieL, p2, c2), "en_zone", "dedans, collée à une vraie limite"],
    [lp(vraieL, p3, c3), "en_limite(a_cheval)", "à cheval sur une vraie limite"], [lp(coupe, p3, c3), "en_zone", "à cheval sur une coupe"], [lp(coupe, p1, c1), "en_zone", "dehors collée à une coupe"]];
  lignes.push(`\n## 12. Parcelles contre la droite x = 5,1`, ...c.map(([x, a, t]) => `${verifier(x, a)} ${t} → ${x} (attendu ${a})`)); }
console.log(lignes.join("\n"));
console.log(`\nBILAN : ${ok} conformes, ${ecarts} écarts`);
