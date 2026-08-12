import test from "node:test";
import assert from "node:assert/strict";
import { quotaQuestions, type TerritoryClaim } from "./territory-claims.ts";

const grant = (insee: string): TerritoryClaim => ({ kind: "grant", insee });
const dossier = (insee: string, paid = true): TerritoryClaim => ({ kind: "dossier", insee, paid });

test("un compte sans revendication garde ses trois questions", () => {
  // La résidence ouvre le gratuit sans qu'on ait rien acheté : le plancher n'est pas une faveur,
  // c'est le cas normal d'un lecteur qui n'a pas encore payé.
  assert.equal(quotaQuestions([]), 3);
});

test("un grant vaut trois questions, un dossier aussi", () => {
  // Le calcul ne regardait QUE les grants, et l'achat d'un dossier n'en crée aucun : deux dossiers
  // à 39 € donnaient trois questions au total.
  assert.equal(quotaQuestions([grant("17300")]), 3);
  assert.equal(quotaQuestions([dossier("44109")]), 3);
});

test("une commune possédée des DEUX façons ne compte qu'une fois", () => {
  // Le parcours normal : Territoire à 14 €, puis extension d'adresse à 25 €. Additionner les
  // revendications doublait le quota de ce parcours-là, précisément le plus courant.
  assert.equal(quotaQuestions([grant("17300"), dossier("17300")]), 3);
  assert.equal(quotaQuestions([grant("17300"), dossier("17300"), dossier("17300")]), 3);
});

test("deux territoires distincts valent six questions", () => {
  assert.equal(quotaQuestions([dossier("17300"), dossier("44109")]), 6);
  assert.equal(quotaQuestions([grant("17300"), dossier("44109")]), 6);
});

test("un Pack Décision de trois communes vaut neuf questions", () => {
  assert.equal(quotaQuestions([grant("31555"), grant("33063"), grant("44109")]), 9);
});

test("PLM : les arrondissements ne sont pas des territoires de plus", () => {
  // Deux appartements dans deux arrondissements de Paris sont deux dossiers légitimes et UNE
  // commune. Compter les lignes aurait offert des questions à qui déménage d'un étage.
  assert.equal(quotaQuestions([dossier("75107"), dossier("75112")]), 3);
  assert.equal(quotaQuestions([grant("75056"), dossier("75107")]), 3);
  assert.equal(quotaQuestions([dossier("69123"), dossier("69381")]), 3);
});
