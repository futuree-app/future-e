import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BORNE_BASSE, CASE_M, caseDe, casesDansRayon, centreDe, classeDe, CLASSE_MAX, cleCase, cleTuileDe, FORMAT_PRIX_AUTOUR,
  lireAutour, statistiques, tuilesPour, tuileValide, valeurDeClasse,
  type CaseVentes, type TuilePrixAutour,
} from "./prix-autour.ts";
import { haversineM } from "./geo-distance.ts";
import { arrondir } from "./prix-autour.ts";

/** Le prix publié pour des ventes toutes au même prix : celui de sa classe, arrondi à 50 €/m². */
const publie = (eur: number) => arrondir(valeurDeClasse(classeDe(eur)));

const LA_ROCHELLE = { lat: 46.158, lon: -1.153 };

/** Des tuiles fabriquées : `n` ventes au prix `eur` dans le carré situé à `dxM` mètres à l'est du point. */
function tuilesAvec(p: { lat: number; lon: number }, ventes: { dxM: number; type: "a" | "m"; eur: number; n: number }[]) {
  const tuiles = new Map<string, TuilePrixAutour>();
  for (const v of ventes) {
    const c = caseDe({ lat: p.lat, lon: p.lon + v.dxM / (111_320 * Math.cos((p.lat * Math.PI) / 180)) });
    const kt = cleTuileDe(c);
    const t = tuiles.get(kt) ?? { format: FORMAT_PRIX_AUTOUR, edition: "test", tuile: kt, cases: {} };
    const cs: CaseVentes = t.cases[cleCase(c)] ?? {};
    const h = cs[v.type] ?? [];
    const b = classeDe(v.eur);
    const i = h.findIndex((x, j) => j % 2 === 0 && x === b);
    if (i >= 0) h[i + 1] += v.n; else h.push(b, v.n);
    // classes croissantes
    const paires: [number, number][] = [];
    for (let j = 0; j < h.length; j += 2) paires.push([h[j], h[j + 1]]);
    cs[v.type] = paires.sort((x, y) => x[0] - y[0]).flat();
    t.cases[cleCase(c)] = cs;
    tuiles.set(kt, t);
  }
  return tuiles;
}

test("les classes de prix : 2 % de large, bornées, valeur représentative à 1 % près", () => {
  for (const v of [300, 1234, 5000, 10_237, 19_999]) {
    assert.ok(Math.abs(valeurDeClasse(classeDe(v)) - v) / v <= 0.0101, String(v));
  }
  assert.equal(classeDe(BORNE_BASSE), 0);
  assert.equal(classeDe(25_000), CLASSE_MAX);
});

test("le carré fait environ 100 m, et les carrés retenus sont tous dans le rayon (centre à centre)", () => {
  const o = caseDe(LA_ROCHELLE);
  const voisin = centreDe({ ix: o.ix + 1, iy: o.iy });
  assert.ok(Math.abs(haversineM(centreDe(o), voisin) - CASE_M) < 15);
  for (const r of [500, 1000, 2000]) {
    const cases = casesDansRayon(o, r);
    assert.ok(cases.every((c) => haversineM(centreDe(o), centreDe(c)) <= r));
    // à peu près l'aire du disque en carrés de 100 m ; à 500 m, la règle « centre dans le disque » en retient un peu
    // moins (71 carrés au lieu de 78) : jamais une vente à plus de rayon + 71 m (demi-diagonale du carré).
    const attendu = (Math.PI * r * r) / (CASE_M * CASE_M);
    assert.ok(Math.abs(cases.length - attendu) / attendu < 0.12, `${r} m : ${cases.length} carrés`);
  }
  // un rayon de 2 km lit au plus quatre tuiles
  assert.ok(tuilesPour(LA_ROCHELLE).length <= 4);
});

test("deux adresses du même carré lisent exactement les mêmes ventes (pas de différence fine exploitable)", () => {
  const t = tuilesAvec(LA_ROCHELLE, [{ dxM: 450, type: "a", eur: 5000, n: 12 }]);
  const o = centreDe(caseDe(LA_ROCHELLE));
  const a = lireAutour(t, { lat: o.lat + 0.0002, lon: o.lon - 0.0003 }, "appart");
  const b = lireAutour(t, { lat: o.lat - 0.0002, lon: o.lon + 0.0003 }, "appart");
  assert.deepEqual(a, b);
});

test("rayon progressif : 500 m s'il y a 10 ventes, sinon 1 km, puis 2 km, sinon « trop peu »", () => {
  assert.deepEqual(
    lireAutour(tuilesAvec(LA_ROCHELLE, [{ dxM: 300, type: "a", eur: 5000, n: 10 }]), LA_ROCHELLE, "appart"),
    { statut: "ventes", type: "appart", rayonM: 500, ventes: 10, mediane: publie(5000), quartiles: null },
  );
  const a1km = lireAutour(tuilesAvec(LA_ROCHELLE, [{ dxM: 300, type: "a", eur: 5000, n: 9 }, { dxM: 800, type: "a", eur: 6000, n: 3 }]), LA_ROCHELLE, "appart");
  assert.equal(a1km.statut === "ventes" && a1km.rayonM, 1000);
  assert.equal(a1km.statut === "ventes" && a1km.ventes, 12);
  const a2km = lireAutour(tuilesAvec(LA_ROCHELLE, [{ dxM: 1800, type: "m", eur: 3000, n: 10 }]), LA_ROCHELLE, "maison");
  assert.equal(a2km.statut === "ventes" && a2km.rayonM, 2000);
  assert.deepEqual(
    lireAutour(tuilesAvec(LA_ROCHELLE, [{ dxM: 300, type: "m", eur: 3000, n: 9 }, { dxM: 2400, type: "m", eur: 3000, n: 50 }]), LA_ROCHELLE, "maison"),
    { statut: "trop_peu", type: "maison", rayonM: 2000 },
  );
});

test("seul le type du logement compte : des maisons ne remplacent jamais des appartements", () => {
  const t = tuilesAvec(LA_ROCHELLE, [{ dxM: 100, type: "m", eur: 3000, n: 40 }, { dxM: 100, type: "a", eur: 5000, n: 4 }]);
  assert.equal(lireAutour(t, LA_ROCHELLE, "appart").statut, "trop_peu");
  assert.equal(lireAutour(t, LA_ROCHELLE, "maison").statut, "ventes");
});

test("seuils : quartiles à partir de 30 ventes seulement, arrondis à 50 €/m²", () => {
  const r29 = lireAutour(tuilesAvec(LA_ROCHELLE, [{ dxM: 0, type: "a", eur: 4000, n: 15 }, { dxM: 0, type: "a", eur: 6000, n: 14 }]), LA_ROCHELLE, "appart");
  assert.ok(r29.statut === "ventes" && r29.quartiles === null);
  const r30 = lireAutour(tuilesAvec(LA_ROCHELLE, [{ dxM: 0, type: "a", eur: 4000, n: 10 }, { dxM: 0, type: "a", eur: 5000, n: 10 }, { dxM: 0, type: "a", eur: 6000, n: 10 }]), LA_ROCHELLE, "appart");
  assert.ok(r30.statut === "ventes" && r30.quartiles !== null);
  if (r30.statut === "ventes") {
    for (const v of [r30.mediane, ...r30.quartiles!]) assert.equal(v % 50, 0, String(v));
    assert.equal(r30.mediane, publie(5000));
    assert.deepEqual(r30.quartiles, [publie(4000), publie(6000)]);
  }
  assert.throws(() => statistiques([]));
});

test("interrogations de carrés voisins : chaque lecture agrège au moins 10 ventes, arrondies, sans donnée par vente", () => {
  // Une vente isolée à 5 000 €/m² en bordure, entourée de 20 ventes à 3 000 : deux lectures de carrés voisins dont l'une
  // l'inclut et l'autre non. La différence des deux médianes publiées ne restitue pas le prix de la vente isolée.
  const t = tuilesAvec(LA_ROCHELLE, [{ dxM: 0, type: "a", eur: 3000, n: 20 }, { dxM: 540, type: "a", eur: 5000, n: 1 }]);
  const a = lireAutour(t, LA_ROCHELLE, "appart");
  const o = centreDe(caseDe(LA_ROCHELLE));
  const b = lireAutour(t, { lat: o.lat, lon: o.lon + 2 * 0.0013 }, "appart");
  assert.ok(a.statut === "ventes" && b.statut === "ventes");
  if (a.statut === "ventes" && b.statut === "ventes") {
    assert.notEqual(a.ventes, b.ventes, "l'une des lectures inclut la vente isolée");
    assert.equal(a.mediane, b.mediane, "la médiane arrondie ne bouge pas : le prix isolé n'apparaît pas");
    assert.deepEqual(Object.keys(a).sort(), ["mediane", "quartiles", "rayonM", "statut", "type", "ventes"]);
  }
});

test("une tuile se refuse si elle n'est pas celle attendue ou porte un histogramme invalide", () => {
  const t = tuilesAvec(LA_ROCHELLE, [{ dxM: 0, type: "a", eur: 5000, n: 3 }]);
  const [kt, tuile] = [...t.entries()][0];
  assert.ok(tuileValide(tuile, { edition: "test", tuile: kt }));
  assert.ok(!tuileValide(tuile, { edition: "autre", tuile: kt }));
  assert.ok(!tuileValide(tuile, { edition: "test", tuile: "0_0" }));
  const k = Object.keys(tuile.cases)[0];
  assert.ok(!tuileValide({ ...tuile, cases: { [k]: { a: [5, -1] } } }, { edition: "test", tuile: kt }));
  assert.ok(!tuileValide({ ...tuile, cases: { [k]: { a: [5] } } }, { edition: "test", tuile: kt }));
});
