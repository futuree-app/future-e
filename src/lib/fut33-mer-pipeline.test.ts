// FUT-33, phase 1 : invariants de la vérité littorale construite par scripts/mer/build_mer.py.
//
// Le pipeline tourne hors dépôt (sources lourdes) ; il écrit un petit jeu de cas de référence, versionné dans
// scripts/mer/fixtures/cas-reference.json. Ces tests vérifient ce jeu : si une reconstruction faisait réapparaître
// la ligne brute des estuaires, ou perdait une commune littorale, ils échoueraient. Les valeurs dépendent du
// millésime : on teste des plages et des invariants, jamais un nombre au mètre près.
// Rien ici n'est branché au produit.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

type Cas = {
  insee: string; nom: string; ancienne_km: number | null;
  centre_km: number; territoire_km: number | null; centre_brut_km: number; territoire_brut_km: number | null;
  loi: string[] | null;
};
const fixture = JSON.parse(readFileSync(new URL("../../scripts/mer/fixtures/cas-reference.json", import.meta.url), "utf8")) as {
  methode: string; cas: Record<string, Cas>;
};
const c = (insee: string): Cas => {
  const x = fixture.cas[insee];
  assert.ok(x, `cas ${insee} absent de la fixture`);
  return x;
};

test("Châtelaillon-Plage : le territoire touche le rivage, le centre en est tout proche (l'ancien proxy disait 11 km)", () => {
  const x = c("17094");
  assert.equal(x.territoire_km, 0);
  assert.ok(x.centre_km < 3, `centre ${x.centre_km}`);
  assert.equal(x.ancienne_km, 11);
});

test("Lannion et Perros-Guirec ne sont plus à 58 et 63 km de la mer", () => {
  assert.ok(c("22113").centre_km < 3);
  assert.ok(c("22168").centre_km < 3);
  for (const i of ["22113", "22168", "29133", "22343"]) assert.equal(c(i).territoire_km, 0, i);
});

test("estuaires : la ligne brute ferait de Bordeaux, Nantes, Caen, Rouen des villes côtières ; la coupure LTM, non", () => {
  for (const [insee, nom, minKm] of [["33063", "Bordeaux", 20], ["44109", "Nantes", 20], ["14118", "Caen", 5], ["76540", "Rouen", 30]] as const) {
    const x = c(insee);
    assert.ok(x.centre_brut_km < 3, `${nom} : la ligne brute doit montrer le piège (${x.centre_brut_km})`);
    assert.ok(x.centre_km > minKm, `${nom} : ${x.centre_km} km après coupure, attendu > ${minKm}`);
    assert.ok((x.territoire_km ?? 0) > 0, `${nom} : le territoire ne doit pas toucher le rivage marin`);
  }
});

test("Rochefort : commune d'estuaire, jamais classée Mer, et à plusieurs kilomètres du rivage marin", () => {
  const x = c("17299");
  assert.deepEqual(x.loi, ["Estuaire"]);
  assert.ok(x.centre_km > 4, `${x.centre_km}`);
});

test("Annecy (Lac) n'a aucune vérité « mer »", () => {
  const x = c("74010");
  assert.deepEqual(x.loi, ["Lac"]);
  assert.ok(x.centre_km > 150 && (x.territoire_km ?? 0) > 150);
});

test("intérieures de départements côtiers : loin du rivage, sans classement", () => {
  for (const i of ["17415", "17347", "35238", "56178", "29024"]) {
    const x = c(i);
    assert.equal(x.loi, null, i);
    assert.ok(x.centre_km > 10 && (x.territoire_km ?? 0) > 10, `${x.nom} ${x.centre_km}`);
  }
});

test("littorales évidentes : classées Mer, territoire au contact du rivage", () => {
  for (const i of ["17094", "29019", "06088", "76217", "35288", "44184", "22168"]) {
    const x = c(i);
    assert.ok(x.loi?.includes("Mer"), i);
    assert.equal(x.territoire_km, 0, x.nom);
  }
});

test("aucune table départementale n'intervient dans le calcul", () => {
  const src = readFileSync(new URL("../../scripts/mer/build_mer.py", import.meta.url), "utf8");
  assert.doesNotMatch(src, /DEPT_|numdep|FACADE_BY_DEPT|COAST_ANCHORS/);
  assert.match(fixture.methode, /coupée aux LTM/);
});

test("Morlaix : le centre recule derrière la LTM de sa rivière, le territoire touche toujours la baie", () => {
  const x = c("29151");
  assert.ok(x.centre_brut_km < x.centre_km, "la coupure éloigne le centre");
  assert.ok(x.centre_km > 2 && x.centre_km < 6, `${x.centre_km}`);
  assert.equal(x.territoire_km, 0);
});

test("Marseille : les arrondissements touchent la mer ; le classement juridique est porté par la commune (13055), pas l'arrondissement", () => {
  for (const i of ["13207", "13216"]) {
    assert.equal(c(i).territoire_km, 0);
    assert.equal(c(i).loi, null, "la liste DGALN ne connaît pas les arrondissements");
  }
});
