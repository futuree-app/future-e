import test from "node:test";
import assert from "node:assert/strict";
import { centraliteRang, centraliteNiveau } from "./centralite-services.ts";

test("les cinq niveaux sont ordonnés, et le non-pôle est le plus bas", () => {
  const rangs = [null, 1, 2, 3, 4].map((n) => centraliteRang(n, "17300")!);
  for (let i = 1; i < rangs.length; i++) {
    assert.ok(rangs[i]! > rangs[i - 1]!, `niveau ${i} pas au-dessus du précédent : ${rangs}`);
  }
  assert.equal(rangs[0], 20);
  assert.equal(rangs[4], 100);
});

test("les écarts DÉCROISSENT, parce que les classes ne sont pas à distance égale", () => {
  // Le premier saut (faire ses courses sur place) change plus la vie quotidienne que le dernier
  // (des services rares utilisés quelques fois par an). Un espacement régulier affirmerait le
  // contraire, ce qu'une échelle ordinale ne dit jamais.
  const r = [null, 1, 2, 3, 4].map((n) => centraliteRang(n, "17300")!);
  const ecarts = r.slice(1).map((v, i) => v - r[i]!);
  for (let i = 1; i < ecarts.length; i++) {
    assert.ok(ecarts[i]! < ecarts[i - 1]!, `écarts non décroissants : ${ecarts}`);
  }
});

test("UN NON-PÔLE N'EST PAS UNE DONNÉE MANQUANTE : `null` est une catégorie", () => {
  // Le `null` de la base est une CATÉGORIE de la classification (« offre insuffisante »), et c'est
  // ce qui donne au champ une couverture de 100 % sur les 34 788 communes.
  assert.equal(centraliteRang(null, "17300"), 20);
  assert.equal(centraliteNiveau(null, "17300"), 0);
});

test("UNE DONNÉE NON CHARGÉE rend null, et surtout pas le rang d'un non-pôle", () => {
  // Les deux absences ne disent pas la même chose. `equip: null` veut dire « classée non-pôle » ;
  // la clé ABSENTE veut dire « pas lue ». Répondre 20 dans le second cas classerait une commune
  // inconnue au rang d'un non-pôle établi, ce qui est exactement le repli inventé que
  // `comparateur-scores.test.ts` interdit sur tous les critères.
  assert.equal(centraliteRang(undefined, "17300"), null);
  assert.equal(centraliteNiveau(undefined, "17300"), null);
});

test("LES 45 ARRONDISSEMENTS PLM ne sont pas des non-pôles", () => {
  // Le piège du 04/08/2026 : les arrondissements portent tous `equip: null`, et leurs
  // communes-mères sont absentes de l'index. Sans ce traitement, Paris 15e serait rendu au rang
  // d'un village de 200 habitants.
  const arrondissements = [
    "75101", "75115", "75120", // Paris 1er, 15e, 20e
    "69381", "69389",           // Lyon 1er, 9e
    "13201", "13215", "13216",  // Marseille 1er, 15e, 16e
  ];
  for (const insee of arrondissements) {
    assert.equal(centraliteRang(null, insee), 100, `${insee} classé hors du pôle majeur`);
    assert.equal(centraliteNiveau(null, insee), 4, insee);
  }
});

test("une commune ORDINAIRE dont le code ressemble à un arrondissement n'est pas rattrapée", () => {
  // La règle vise les trois préfixes réels (751xx, 6938x, 132xx) sur cinq caractères exactement.
  // Elle ne doit pas capturer une commune quelconque du 75, du 69 ou du 13.
  assert.equal(centraliteRang(null, "13001"), 20);
  assert.equal(centraliteRang(null, "69001"), 20);
  assert.equal(centraliteRang(null, "75001"), 20);
});

test("le niveau effectif reflète le rang, sur toute la plage", () => {
  for (const n of [1, 2, 3, 4] as const) {
    assert.equal(centraliteNiveau(n, "17300"), n);
  }
  // Une valeur hors échelle est traitée comme un non-pôle, jamais comme un niveau inventé.
  assert.equal(centraliteNiveau(7, "17300"), 0);
  assert.equal(centraliteRang(7, "17300"), 20);
});
