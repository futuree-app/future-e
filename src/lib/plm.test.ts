import test from "node:test";
import assert from "node:assert/strict";
import { communeParent, arrondissementsDe, codePourSourceParArrondissement } from "./plm.ts";

test("Paris : arrondissements 751xx -> 75056", () => {
  assert.equal(communeParent("75101"), "75056");
  assert.equal(communeParent("75120"), "75056");
  assert.equal(communeParent("75056"), "75056"); // déjà la commune
});

test("Lyon : 693xx -> 69123", () => {
  assert.equal(communeParent("69381"), "69123");
  assert.equal(communeParent("69389"), "69123");
});

test("Marseille : 132xx -> 13055", () => {
  assert.equal(communeParent("13201"), "13055");
  assert.equal(communeParent("13216"), "13055");
});

test("commune ordinaire inchangée", () => {
  assert.equal(communeParent("31555"), "31555"); // Toulouse
  assert.equal(communeParent("17300"), "17300"); // La Rochelle
});

test("hors plage PLM inchangé", () => {
  assert.equal(communeParent("75012"), "75012"); // pas un arrondissement (751xx only)
  assert.equal(communeParent("13100"), "13100");
  assert.equal(communeParent(null), null);
  assert.equal(communeParent(""), "");
});

// ── LE SENS INVERSE : les sources qui ne connaissent que les arrondissements (29/07/2026) ──────

test("arrondissementsDe énumère les trois communes PLM, et elles seules", () => {
  assert.equal(arrondissementsDe("75056").length, 20);
  assert.equal(arrondissementsDe("69123").length, 9);
  assert.equal(arrondissementsDe("13055").length, 16);
  for (const ordinaire of ["17300", "31555", "97411", "01001"]) {
    assert.deepEqual(arrondissementsDe(ordinaire), [], ordinaire);
  }
  assert.deepEqual(arrondissementsDe(null), []);
});

test("Chaque arrondissement énuméré remonte bien à sa commune", () => {
  // L'aller et le retour doivent être cohérents, sinon une source rendrait des codes orphelins.
  for (const commune of ["75056", "69123", "13055"]) {
    for (const arr of arrondissementsDe(commune)) {
      assert.equal(communeParent(arr), commune, `${arr} -> ${commune}`);
    }
  }
});

test("UNE COMMUNE ORDINAIRE s'interroge avec son propre code", () => {
  assert.equal(codePourSourceParArrondissement("17300"), "17300");
  assert.equal(codePourSourceParArrondissement("17300", "17300"), "17300");
});

test("UNE COMMUNE PLM SANS ADRESSE n'a AUCUN code valable", () => {
  // Il n'existe pas de valeur « pour Lyon » sur ces sources : le radon vaut 1 dans huit
  // arrondissements et 3 dans le neuvième. Rendre un arrondissement au hasard inventerait la réponse.
  for (const plm of ["75056", "69123", "13055"]) {
    assert.equal(codePourSourceParArrondissement(plm), null, plm);
    assert.equal(codePourSourceParArrondissement(plm, plm), null, `${plm} avec lui-même`);
  }
});

test("UNE ADRESSE PLM s'interroge avec SON arrondissement", () => {
  // Le géocodeur donne déjà l'arrondissement : c'est lui qu'il faut passer, AVANT `communeParent`.
  assert.equal(codePourSourceParArrondissement("69123", "69389"), "69389"); // Lyon 9e, classe 3
  assert.equal(codePourSourceParArrondissement("75056", "75104"), "75104");
  assert.equal(codePourSourceParArrondissement("13055", "13211"), "13211");
});

test("UN ARRONDISSEMENT D'UNE AUTRE VILLE ne passe pas", () => {
  // Garde-fou : un citycode incohérent avec la commune ne doit pas être interrogé tel quel.
  assert.equal(codePourSourceParArrondissement("69123", "75104"), null);
  assert.equal(codePourSourceParArrondissement("75056", "13202"), null);
});
