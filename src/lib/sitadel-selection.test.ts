import test from "node:test";
import assert from "node:assert/strict";
import {
  cleParcelle, permisAMontrer, LIMITE_PERMIS, RAYON_PERMIS_M, ANCIENNETE_MAX_ANS,
} from "./sitadel-selection.ts";

const P = new Set(["BP|300"]);

function autorisation(over: Partial<Parameters<typeof permisAMontrer>[0][number]> = {}) {
  return { parcelles: ["BP|300"], annee: 2025, autorisation: "2025-05-06", ...over };
}

// ── La clé, celle qui a failli fermer le chantier ───────────────────────────────────────────

test("le zéro de tête du cadastre est normalisé", () => {
  // « 0300 » côté cadastre, « 300 » côté Sitadel : sans ça, la jointure ne trouve JAMAIS rien, et
  // le premier essai de la mesure a bien rendu zéro permis sur huit adresses.
  assert.equal(cleParcelle("BP", "0300"), "BP|300");
  assert.equal(cleParcelle("BP", "300"), "BP|300");
  assert.equal(cleParcelle("bp", " 0017 "), "BP|17");
});

test("un numéro entièrement nul ne devient pas une clé vide trompeuse", () => {
  assert.equal(cleParcelle("BP", "0000"), "BP|");
});

// ── Le périmètre et l'ancienneté ───────────────────────────────────────────────────────────

test("une parcelle hors du périmètre est ignorée", () => {
  assert.deepEqual(permisAMontrer([autorisation({ parcelles: ["BR|12"] })], P, 2026), []);
});

test("un dépôt trop ancien est ignoré", () => {
  // 2022 est à quatre ans de 2026 : au-delà de la fenêtre, un permis raconte le passé lointain.
  assert.deepEqual(permisAMontrer([autorisation({ annee: 2022 })], P, 2026), []);
  assert.equal(permisAMontrer([autorisation({ annee: 2023 })], P, 2026).length, 1, "la borne est incluse");
});

test("un dossier sans aucune date n'est jamais montré", () => {
  const a = { parcelles: ["BP|300"], annee: 2025 };
  assert.deepEqual(permisAMontrer([a], P, 2026), []);
});

// ── L'ordre et les libellés ────────────────────────────────────────────────────────────────

test("du plus récent au plus ancien", () => {
  const r = permisAMontrer([
    autorisation({ annee: 2024 }), autorisation({ annee: 2026 }), autorisation({ annee: 2025 }),
  ], P, 2026);
  assert.deepEqual(r.map((x) => x.annee), [2026, 2025, 2024]);
});

test("le libellé suit l'état déduit des DATES", () => {
  const r = permisAMontrer([
    autorisation({ achevement: "2025-11-22", ouvertureChantier: "2025-05-07" }),
  ], P, 2026);
  assert.equal(r[0].libelle, "travaux déclarés achevés");
});

test("un dossier à trois parcelles est retenu si UNE seule touche le périmètre", () => {
  const r = permisAMontrer([autorisation({ parcelles: ["AA|1", "BP|300", "ZZ|9"] })], P, 2026);
  assert.equal(r.length, 1);
});

// ── La limite ──────────────────────────────────────────────────────────────────────────────

test("la limite nomme le rayon, la fenêtre, et les deux réserves qui comptent", () => {
  assert.ok(LIMITE_PERMIS.includes(`${RAYON_PERMIS_M} m`), "le périmètre est nommé");
  assert.ok(LIMITE_PERMIS.includes(`${ANCIENNETE_MAX_ANS} ans`));
  assert.ok(LIMITE_PERMIS.includes("n'est pas un bâtiment"));
  assert.ok(LIMITE_PERMIS.includes("chaque mois"), "la fraîcheur du registre est dite");
});

test("la limite ne promet AUCUNE construction future", () => {
  assert.equal(/sera |va être|livraison|d'ici \d{4}/i.test(LIMITE_PERMIS), false);
});
