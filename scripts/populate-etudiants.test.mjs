import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

// FUT-135 · Les règles de la part étudiante, dans le script qui la calcule : un bassin de moins de 5 000 habitants
// n'est pas mesuré (null, pas 0), un vrai zéro reste mesuré, les ex æquo prennent le milieu de leur plateau, et
// une rentrée absente de la source est refusée au lieu d'être remplacée par la plus récente.
test("populate-etudiants : abstention, vrai zéro, rang moyen des ex æquo, rentrée déclarée", () => {
  const bin = existsSync(".venv-bpe/bin/python") ? ".venv-bpe/bin/python" : "python3";
  const out = execFileSync(bin, ["scripts/populate-etudiants.py", "--selftest"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  assert.equal(out, "");
});
