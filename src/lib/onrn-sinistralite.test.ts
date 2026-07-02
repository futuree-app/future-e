import { test } from "node:test";
import assert from "node:assert/strict";
import { classify } from "./onrn-sinistralite.ts";

test("représentativité > 50% → lecture avec classes verbatim", () => {
  assert.deepEqual(
    classify({ c: "Plus de 20 k€", f: "Plus de 10 ‰", r: "> 50%" }),
    { kind: "lecture", cout: "Plus de 20 k€", frequence: "Plus de 10 ‰", representativite: "> 50%" },
  );
});

test("représentativité Entre 30 et 50% → lecture", () => {
  assert.equal(classify({ c: "Entre 10 et 20k€", f: "Entre 2 et 5 ‰", r: "Entre 30 et 50%" }).kind, "lecture");
});

test("pas de sinistre répertorié → aucun", () => {
  assert.deepEqual(
    classify({ c: "Pas de sinistre répertorié à CCR", f: "Pas de sinistre ou de risque répertoriés à CCR", r: "Pas de sinistre répertorié à CCR" }),
    { kind: "aucun" },
  );
});

test("représentativité < 15% → faible_repr", () => {
  assert.deepEqual(
    classify({ c: "Entre 5 et 10 k€", f: "Entre 1 et 2 ‰", r: "< 15%" }),
    { kind: "faible_repr", representativite: "< 15%" },
  );
});

test("représentativité Entre 15 et 30% → faible_repr", () => {
  assert.equal(classify({ c: "Entre 5 et 10 k€", f: "Entre 1 et 2 ‰", r: "Entre 15 et 30%" }).kind, "faible_repr");
});

test("donnée absente → indispo", () => {
  assert.deepEqual(classify(undefined), { kind: "indispo" });
});
