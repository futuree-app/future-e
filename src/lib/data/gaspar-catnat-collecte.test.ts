// FUT-60 : la fraîcheur de l'index GASPAR. Le script historique ne réinterrogeait jamais une commune
// déjà en cache (Toulouse : 19 dans l'index, 20 dans GASPAR) ; ces tests fixent le contrat inverse.
import test from "node:test";
import assert from "node:assert/strict";
import {
  appliquerCollecte, codesAInterroger, codesRestants, collecteComplete, enregistrerEchec, enregistrerLot,
  lotsDe, nouvelleCollecte, rangsNationaux,
} from "./gaspar-catnat-collecte.ts";

const INOND = "Inondations et/ou Coulées de Boue";
const T1 = "2026-10-05T03:00:00.000Z";
const T2 = "2026-10-05T03:10:00.000Z";
const lignes = (code: string, n: number, libelle = INOND) => Array.from({ length: n }, () => ({ code_insee: code, libelle_risque_jo: libelle }));
const index = (entrees: [string, number | null][]) => ({
  meta: { count: entrees.length },
  communes: entrees.map(([insee, n]) => ({ insee, nom: insee, inondation: n == null ? null : { catnat: n, tri: false, risque: 0 } })),
});

test("F1. entrée ancienne : Toulouse à 19 dans l'index, 20 dans la source → 20 après la collecte", () => {
  const idx = index([["31555", 19], ["29019", 13]]);
  let c = nouvelleCollecte(T1);
  // L'ancien script sautait 31555 parce qu'il était déjà en cache ; une collecte l'interroge toujours.
  assert.deepEqual(codesRestants(c, codesAInterroger(["31555", "29019"])), ["29019", "31555"]);
  c = enregistrerLot(c, ["29019", "31555"], [...lignes("31555", 20), ...lignes("29019", 13)], T2);
  const { index: nouveau, ecarts } = appliquerCollecte(idx, c, "catnat-2");
  assert.equal(nouveau.communes.find((x) => x.insee === "31555")!.inondation!.catnat, 20);
  assert.equal(ecarts.communesModifiees, 1);
  assert.equal(idx.communes[0]!.inondation!.catnat, 19, "l'index d'origine n'est pas modifié en place");
});

test("F2. reprise : ce qui est acquis n'est ni refait ni perdu", () => {
  const codes = ["01001", "01002", "01003"];
  let c = enregistrerLot(nouvelleCollecte(T1), ["01001", "01002"], lignes("01001", 2), T1);
  assert.deepEqual(codesRestants(c, codes), ["01003"]);
  c = enregistrerLot(c, ["01003"], lignes("01003", 1), T2);
  assert.deepEqual(c.comptes, { "01001": 2, "01002": 0, "01003": 1 });
  assert.equal(c.debut, T1, "la collecte garde sa date de début");
});

test("F3. source en panne : un lot en échec n'écrit ni zéro ni null, et l'index reste à la dernière valeur", () => {
  const idx = index([["31555", 19]]);
  const c = enregistrerEchec(nouvelleCollecte(T1), ["31555"]);
  assert.equal("31555" in c.comptes, false);
  assert.deepEqual(c.echecs, ["31555"]);
  assert.throws(() => appliquerCollecte(idx, c, "catnat-2"), /incomplète/);
  assert.equal(idx.communes[0]!.inondation!.catnat, 19);
});

test("F4. collecte partielle : jamais publiée comme un instantané", () => {
  const idx = index([["01001", 1], ["01002", 2]]);
  const c = enregistrerLot(nouvelleCollecte(T1), ["01001"], lignes("01001", 4), T1);
  assert.equal(collecteComplete(c, codesAInterroger(["01001", "01002"])), false);
  assert.throws(() => appliquerCollecte(idx, c, "catnat-2"), /incomplète/);
});

test("F5. rang : recalculé sur l'instantané entier, une commune qui change déplace les autres", () => {
  const rang = rangsNationaux([0, 0, 1, 5]);
  assert.deepEqual([0, 1, 5].map(rang), [50, 75, 100]);
  const idx = index([["01001", 0], ["01002", 0], ["01003", 1], ["01004", 5]]);
  const c = enregistrerLot(nouvelleCollecte(T1), ["01001", "01002", "01003", "01004"], [...lignes("01002", 3), ...lignes("01003", 1), ...lignes("01004", 5)], T2);
  const r = Object.fromEntries(appliquerCollecte(idx, c, "catnat-2").index.communes.map((x) => [x.insee, x.inondation!.risque]));
  // 01001 n'a pas bougé (0) mais son rang passe de 50 à 25 : c'est l'effet attendu d'un recalcul.
  assert.deepEqual(r, { "01001": 25, "01002": 75, "01003": 50, "01004": 100 });
});

test("F6. Paris, Lyon, Marseille : interrogés à la ville, à chaque collecte", () => {
  const codes = codesAInterroger(["75101", "75111", "69381", "13201", "31555"]);
  assert.deepEqual(codes, ["13055", "31555", "69123", "75056"]);
  const c = enregistrerLot(nouvelleCollecte(T1), codes, [...lignes("75056", 16), ...lignes("69123", 19), ...lignes("13055", 29), ...lignes("31555", 20)], T2);
  const idx = index([["75101", 0], ["75111", 0], ["69381", 0], ["13201", 0], ["31555", 19]]);
  const n = Object.fromEntries(appliquerCollecte(idx, c, "catnat-2").index.communes.map((x) => [x.insee, x.inondation!.catnat]));
  assert.deepEqual(n, { "75101": 16, "75111": 16, "69381": 19, "13201": 29, "31555": 20 });
});

test("F7. la date : une collecte réussie date l'index, une collecte échouée ne prétend pas être fraîche", () => {
  const idx = index([["01001", 1]]);
  const c = enregistrerLot(nouvelleCollecte(T1), ["01001"], lignes("01001", 1), T2);
  const meta = (appliquerCollecte(idx, c, "catnat-2").index.meta as { sources: { gaspar_catnat: Record<string, unknown> } }).sources.gaspar_catnat;
  assert.equal(meta.collecte_debut, T1);
  assert.equal(meta.collecte_fin, T2);
  assert.equal(meta.statut, "complete");
  const echec = enregistrerEchec(nouvelleCollecte(T2), ["01001"]);
  assert.equal(echec.dernierLot, null, "aucun lot réussi : aucune date de fraîcheur");
  assert.throws(() => appliquerCollecte(idx, echec, "catnat-2"));
});

test("taxonomie : seules les lignes du groupe Inondations comptent (les vagues, la sécheresse non)", () => {
  const c = enregistrerLot(nouvelleCollecte(T1), ["17094"], [
    ...lignes("17094", 2), ...lignes("17094", 1, "Inondations Remontée Nappe"),
    ...lignes("17094", 3, "Chocs Mécaniques liés à l'action des Vagues"), ...lignes("17094", 5, "Sécheresse"),
  ], T2);
  assert.equal(c.comptes["17094"], 3);
  assert.equal(lotsDe(Array.from({ length: 45 }, (_, i) => String(i))).length, 3, "lots de 20 au plus");
});
