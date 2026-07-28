import test from "node:test";
import assert from "node:assert/strict";
import { irisQueryPrefix, communeOfIris, keepIrisOfCommune, scopeFromPoint, isSectorScope } from "./iris-scope.ts";

// Corpus RÉEL, relevé contre l'API ADEME (dataset jixoufr9qp0gko9xcqyzbr4a) le 28/07/2026.
// Le nom « Saint-Denis » ramenait 103 IRIS répartis sur QUATRE communes.
const SAINT_DENIS_REEL = [
  { iris: "974110101", taux_motor_glob: 50.9 }, // Saint-Denis, La Réunion (62 IRIS au total)
  { iris: "974110102", taux_motor_glob: 51.2 },
  { iris: "930660101", taux_motor_glob: 21.0 }, // Saint-Denis, Seine-Saint-Denis (39 IRIS)
  { iris: "930660102", taux_motor_glob: 20.8 },
  { iris: "113390000", taux_motor_glob: 67.5 }, // Saint-Denis, Aude (1 IRIS)
  { iris: "302470000", taux_motor_glob: 84.3 }, // Saint-Denis, Gard (1 IRIS)
];

test("L'INVARIANT : tout IRIS agrégé appartient à la commune demandée", () => {
  for (const insee of ["93066", "97411", "11339", "30247"]) {
    const kept = keepIrisOfCommune(SAINT_DENIS_REEL, insee);
    assert.ok(kept.length > 0, `${insee} doit garder au moins un IRIS`);
    for (const r of kept) {
      assert.equal(String(r.iris).slice(0, 5), insee);
    }
  }
});

test("LE BUG : les communes homonymes ne se mélangent plus", () => {
  const sd93 = keepIrisOfCommune(SAINT_DENIS_REEL, "93066");
  assert.equal(sd93.length, 2);
  // Aucun IRIS réunionnais ne survit au filtre : c'est lui qui doublait la motorisation.
  assert.ok(sd93.every((r) => !String(r.iris).startsWith("97411")));
});

test("PLM : Paris, Lyon et Marseille n'ont aucun IRIS sous leur code de commune", () => {
  // Vérifié contre l'API : `iris:75056*` -> 0 résultat, `iris:751*` -> 940.
  assert.equal(irisQueryPrefix("75056"), "751");
  assert.equal(irisQueryPrefix("69123"), "6938");
  assert.equal(irisQueryPrefix("13055"), "132");
});

test("PLM : les IRIS d'arrondissement remontent à leur commune parente", () => {
  const rows = [
    { iris: "751010101" }, // Paris 1er
    { iris: "751200104" }, // Paris 20e
    { iris: "693810101" }, // Lyon 1er
    { iris: "132010101" }, // Marseille 1er
  ];
  assert.equal(keepIrisOfCommune(rows, "75056").length, 2);
  assert.equal(keepIrisOfCommune(rows, "69123").length, 1);
  assert.equal(keepIrisOfCommune(rows, "13055").length, 1);
});

test("Une commune ordinaire est son propre préfixe", () => {
  assert.equal(irisQueryPrefix("17300"), "17300"); // La Rochelle
  assert.equal(irisQueryPrefix("93066"), "93066");
});

test("Le préfixe d'une commune ordinaire ne déborde pas sur ses voisines", () => {
  // `iris:17300*` ne doit ramener que 17300 — un code plus long commençant pareil serait un autre
  // IRIS de la MÊME commune (les codes IRIS font 9 chiffres), jamais une autre commune.
  const rows = [{ iris: "173000101" }, { iris: "173000102" }, { iris: "704500000" }];
  const kept = keepIrisOfCommune(rows, "17300");
  assert.equal(kept.length, 2); // l'IRIS de La Rochelle (Haute-Saône, 70450) est écarté
});

test("communeOfIris : les 5 premiers chiffres, et rien de deviné", () => {
  assert.equal(communeOfIris("173000101"), "17300");
  assert.equal(communeOfIris(173000101), "17300");
  assert.equal(communeOfIris(null), null);
  assert.equal(communeOfIris(undefined), null);
  assert.equal(communeOfIris(""), null);
  assert.equal(communeOfIris("1730"), null); // trop court : on ne complète pas
});

test("Une ligne sans code IRIS n'entre jamais dans la moyenne", () => {
  const rows = [{ iris: "173000101" }, { iris: null }, { iris: undefined }, {}];
  assert.equal(keepIrisOfCommune(rows, "17300").length, 1);
});

test("Aucune commune ne garde d'IRIS qui ne soit pas le sien", () => {
  // Le cas silencieux d'origine : demander une commune, recevoir celle d'à côté.
  assert.equal(keepIrisOfCommune([{ iris: "930660101" }], "17300").length, 0);
  assert.equal(keepIrisOfCommune([{ iris: "751010101" }], "13055").length, 0);
});

// ── L'IRIS DU POINT ──────────────────────────────────────────────────────────

test("POINT RÉSOLU : l'IRIS contenant l'adresse, dans la bonne commune", () => {
  // La Rochelle centre (-1.1511, 46.1603) -> 173000102, relevé contre l'API le 28/07/2026.
  const s = scopeFromPoint({ iris: "173000102" }, "17300", true);
  assert.equal(s.kind, "point");
  assert.equal(s.kind === "point" && s.irisCode, "173000102");
  assert.equal(s.kind === "point" && s.communeCode, "17300");
  assert.ok(isSectorScope(s));
});

test("PLM : l'IRIS d'un arrondissement vaut pour la commune parente", () => {
  // Paris Hôtel de Ville -> 751041304 (Paris 4e), commune attendue 75056.
  const s = scopeFromPoint({ iris: "751041304" }, "75056", true);
  assert.equal(s.kind, "point");
  assert.equal(s.kind === "point" && s.communeCode, "75056");
});

test("AUCUN IRIS au point n'est PAS une source en panne", () => {
  const absent = scopeFromPoint(null, "17300", true);   // la source a répondu : rien ici
  const panne = scopeFromPoint(null, "17300", false);   // la source n'a pas répondu
  assert.equal(absent.kind, "none");
  assert.equal(panne.kind, "unavailable");
  assert.notEqual(absent.kind, panne.kind); // les confondre reconstruirait le mensonge
});

test("DÉSACCORD : un point qui tombe dans une autre commune ne devient jamais une preuve locale", () => {
  // Géocodage en limite communale : l'IRIS trouvé est celui du voisin.
  const s = scopeFromPoint({ iris: "930660101" }, "17300", true);
  assert.equal(s.kind, "mismatch");
  assert.equal(s.kind === "mismatch" && s.foundCommune, "93066");
  assert.equal(s.kind === "mismatch" && s.expectedCommune, "17300");
  assert.ok(!isSectorScope(s));
});

test("Seul l'IRIS du point est sectoriel : la moyenne communale ne l'est jamais", () => {
  assert.ok(!isSectorScope({ kind: "commune", irisCount: 31 }));
  assert.ok(!isSectorScope({ kind: "none" }));
  assert.ok(!isSectorScope({ kind: "unavailable" }));
  assert.ok(!isSectorScope({ kind: "mismatch", foundCommune: "93066", expectedCommune: "17300" }));
});

test("Une ligne sans code IRIS exploitable rend une absence, pas un faux positif", () => {
  assert.equal(scopeFromPoint({ iris: null }, "17300", true).kind, "none");
  assert.equal(scopeFromPoint({ iris: "1730" }, "17300", true).kind, "none"); // trop court
  assert.equal(scopeFromPoint({}, "17300", true).kind, "none");
});
