// FUT-5. Trois territoires affichés est un MAXIMUM, jamais un quota. L'étalement ordonne le vivier des
// communes éligibles ; il n'y ajoute rien, et ne relâche aucune contrainte pour compléter un trio.
import test from "node:test";
import assert from "node:assert/strict";
import { etalerResultats, type EtalementCandidat } from "./comparateur-etalement.ts";

type R = { insee: string; dept: string; region: string };
const r = (insee: string, dept: string, region: string): R => ({ insee, dept, region });
const vivier = (rs: R[], pref = false): EtalementCandidat<R>[] => rs.map((result) => ({ result, pref }));
const OPTS = { anyPreferred: false, target: 5, display: 3 };

test("une seule commune conforme -> une seule commune affichée, rien pour compléter", () => {
  const out = etalerResultats(vivier([r("35238", "35", "Bretagne")]), OPTS);
  assert.deepEqual(out.map((x) => x.insee), ["35238"]);
});

test("deux communes conformes -> deux, jamais trois", () => {
  const out = etalerResultats(vivier([r("35238", "35", "Bretagne"), r("29019", "29", "Bretagne")]), OPTS);
  assert.deepEqual(out.map((x) => x.insee), ["35238", "29019"]);
});

test("vivier vide -> aucun résultat", () => {
  assert.deepEqual(etalerResultats([], OPTS), []);
});

test("la diversité par région ne va JAMAIS chercher hors du vivier : toute la sortie en vient", () => {
  // Un vivier entièrement breton (contrainte « en Bretagne ») : l'étalement voudrait trois régions
  // différentes, il n'en a qu'une, et il le reste.
  const bretons = [
    r("35238", "35", "Bretagne"), r("29019", "29", "Bretagne"), r("56121", "56", "Bretagne"),
    r("22278", "22", "Bretagne"), r("35288", "35", "Bretagne"), r("29232", "29", "Bretagne"),
  ];
  const out = etalerResultats(vivier(bretons), OPTS);
  assert.ok(out.length <= OPTS.target);
  assert.ok(out.every((x) => bretons.includes(x)));
  assert.ok(out.slice(0, 3).every((x) => x.region === "Bretagne"));
});

test("le plafond tient : jamais plus que target, même avec un grand vivier", () => {
  const grand = Array.from({ length: 40 }, (_, i) => r(`x${i}`, String(10 + (i % 20)), `R${i % 7}`));
  assert.equal(etalerResultats(vivier(grand), OPTS).length, 5);
});

test("ancre PRÉFÉRÉE : l'ouverture hors zone vient du vivier éligible, et reste unique", () => {
  const pool: EtalementCandidat<R>[] = [
    { result: r("35238", "35", "Bretagne"), pref: true },
    { result: r("29019", "29", "Bretagne"), pref: true },
    { result: r("44109", "44", "Pays de la Loire"), pref: false },
    { result: r("49007", "49", "Pays de la Loire"), pref: false },
  ];
  const out = etalerResultats(pool, { ...OPTS, anyPreferred: true });
  assert.deepEqual(out.slice(0, 3).map((x) => x.insee), ["35238", "29019", "44109"]);
  assert.ok(out.every((x) => pool.some((p) => p.result === x)));
});

test("ancre préférée, un seul candidat en zone et aucun hors zone -> un seul résultat", () => {
  const out = etalerResultats([{ result: r("35238", "35", "Bretagne"), pref: true }], { ...OPTS, anyPreferred: true });
  assert.equal(out.length, 1);
});
