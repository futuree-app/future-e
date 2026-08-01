import test from "node:test";
import assert from "node:assert/strict";
import { parseSitadelCsv, COLONNES_SITADEL } from "./sitadel-csv.ts";
import { permisAMontrer } from "./sitadel-selection.ts";

// Extrait RÉEL de la réponse DiDo du 01/08/2026 (commune 17300, colonnes demandées), copié tel
// quel : guillemets, point-virgules, colonnes vides, deuxième parcelle occasionnelle.
const ENTETE = COLONNES_SITADEL.map((c) => `"${c}"`).join(";");
const CSV = [
  ENTETE,
  `"AS";"299";;;;;2023;"2023-04-11";"2023-05-15";"2024-07-10"`,
  `"IN";"620";"IN";"621";;;2024;"2024-03-25";;`,
  `"BP";"0300";;;;;2025;"2025-05-06";"2025-09-01";`,
].join("\n");

test("lit les dates, l'année et jusqu'à trois parcelles", () => {
  const a = parseSitadelCsv(CSV);
  assert.ok(a);
  assert.equal(a.length, 3);
  assert.deepEqual(a[0], {
    parcelles: ["AS|299"],
    annee: 2023,
    autorisation: "2023-04-11",
    ouvertureChantier: "2023-05-15",
    achevement: "2024-07-10",
  });
  assert.deepEqual(a[1].parcelles, ["IN|620", "IN|621"]);
  assert.equal(a[1].ouvertureChantier, null, "une colonne vide est une absence, pas une chaîne");
});

test("le zéro de tête du cadastre est déjà normalisé à la lecture", () => {
  // La jointure se fait sur cette clé : si la normalisation manquait ici, elle ne trouverait rien
  // et le bloc afficherait une absence fausse.
  const a = parseSitadelCsv(CSV);
  assert.deepEqual(a?.[2].parcelles, ["BP|300"]);
});

test("les fins de ligne Windows ne collent pas un \\r à la dernière colonne", () => {
  const a = parseSitadelCsv(CSV.split("\n").join("\r\n"));
  assert.equal(a?.[0].achevement, "2024-07-10");
});

test("une ligne sans parcelle est écartée : elle n'est rattachable à aucune adresse", () => {
  const a = parseSitadelCsv([ENTETE, `;;;;;;2025;"2025-01-02";;`].join("\n"));
  assert.deepEqual(a, []);
});

test("une demi-clé de parcelle n'entre jamais dans la liste", () => {
  // « |300 » pourrait coïncider avec une autre demi-clé et rattacher un permis à la mauvaise
  // parcelle : exactement la classe d'erreur que la jointure par adresse a fait écarter.
  const a = parseSitadelCsv([ENTETE, `;"300";;;;;2025;"2025-01-02";;`].join("\n"));
  assert.deepEqual(a, []);
});

test("un format inattendu rend null, jamais une liste vide", () => {
  // Une liste vide s'afficherait « aucune autorisation autour de cette adresse » : une affirmation
  // fausse tirée d'une panne. `null` fait disparaître le bloc.
  assert.equal(parseSitadelCsv(`"AUTRE";"CHOSE"\n"a";"b"`), null);
  assert.equal(parseSitadelCsv(""), null);
  assert.deepEqual(parseSitadelCsv(ENTETE), [], "un entête seul est une commune sans dossier");
});

test("de bout en bout : le CSV réel traverse la sélection", () => {
  const a = parseSitadelCsv(CSV);
  assert.ok(a);
  const retenus = permisAMontrer(a, new Set(["BP|300", "IN|621"]), 2026);
  assert.deepEqual(retenus, [
    { annee: 2025, etat: "chantier_ouvert" },
    { annee: 2024, etat: "autorise_non_commence" },
  ]);
});
