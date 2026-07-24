import { test } from "node:test";
import assert from "node:assert/strict";
import { validateGeneratedBlocks } from "./conclusion-validate.ts";
import type { ConclusionNarrativePlan } from "./conclusion-plan.ts";

function plan(): ConclusionNarrativePlan {
  return {
    scope: "commune",
    conclusionState: "no_incompatibility_established",
    posture: "recherche",
    reservesCount: 3,
    lead: { kind: "none" },
    priorityControl: null, // déterministe, hors narration : le validateur ne le voit jamais
    blocks: [
      {
        key: "verdict",
        fallbackText: "Aucune contrainte n'est contredite.",
        sourceIds: [], requiredPhrases: [], allowedNumbers: [], maxChars: 320, generable: false,
      },
      {
        key: "unexamined_hard_constraints",
        fallbackText: "Nous n'avons pas encore examiné, à ce grain : la proximité de la mer, la présence d'une gare.",
        sourceIds: ["nearSea", "nearPlace"],
        requiredPhrases: ["la proximité de la mer", "la présence d'une gare"],
        allowedNumbers: ["2", "deux"],
        maxChars: 260, generable: true,
      },
      // Le SECOND registre rédigeable du fixture. C'était `reserves_found` ; les réserves ne sont plus
      // rédigées (leur démarche est déterministe), et le validateur a besoin de deux blocs générables
      // pour éprouver l'ordre, les doublons et le repli bloc par bloc.
      {
        key: "uncovered_priorities",
        fallbackText: "3 de vos priorités ne sont pas couvertes ici.",
        sourceIds: ["f1", "f2", "f3"], requiredPhrases: ["3"], allowedNumbers: ["3", "trois"],
        maxChars: 300, generable: true,
      },
    ],
  };
}

const MER_ET_GARE = "Cette conclusion reste incomplète : la proximité de la mer et la présence d'une gare n'ont pas pu être vérifiées.";

test("sortie conforme : les textes générés sont retenus, la provenance vient du PLAN", () => {
  const r = validateGeneratedBlocks(plan(), [
    { key: "unexamined_hard_constraints", text: MER_ET_GARE },
    { key: "uncovered_priorities", text: "3 de vos priorités restent hors champ." },
  ]);
  assert.deepEqual(r.rejected, []);
  assert.deepEqual(r.blocks[2]!.sourceIds, ["f1", "f2", "f3"]); // reconstituée, jamais reçue du modèle
  assert.equal(r.blocks[2]!.generated, true);
});

test("LE VERDICT N'EST JAMAIS GÉNÉRÉ : une reformulation du verdict est rejetée", () => {
  const r = validateGeneratedBlocks(plan(), [
    { key: "verdict", text: "Ce lieu vous correspond." },
    { key: "uncovered_priorities", text: "3 de vos priorités restent hors champ." },
  ]);
  assert.equal(r.blocks[0]!.text, "Aucune contrainte n'est contredite.");
  assert.equal(r.blocks[0]!.generated, false);
  assert.ok(r.rejected.some((x) => x.key === "verdict" && x.reason === "not_generable"));
});

test("un bloc non générable n'est jamais compté comme manquant", () => {
  const r = validateGeneratedBlocks(plan(), [{ key: "uncovered_priorities", text: "3 de vos priorités restent hors champ." }]);
  assert.equal(r.rejected.some((x) => x.key === "verdict" && x.reason === "missing"), false);
});

test("la matière ne peut pas disparaître DANS un bloc (requiredPhrases)", () => {
  const r = validateGeneratedBlocks(plan(), [
    // La gare s'évapore : la clé est bonne, le texte est court, aucun nombre inventé. Rejeté quand même.
    { key: "unexamined_hard_constraints", text: "Une condition importante de votre projet reste à examiner." },
  ]);
  assert.equal(r.blocks[1]!.generated, false);
  assert.equal(r.blocks[1]!.text, plan().blocks[1]!.fallbackText);
  assert.ok(r.rejected.some((x) => x.reason === "missing_required_phrase"));
});

test("l'ordre du modèle est ignoré : le rendu suit l'ordre du plan", () => {
  const r = validateGeneratedBlocks(plan(), [
    { key: "uncovered_priorities", text: "3 de vos priorités restent hors champ." },
    { key: "unexamined_hard_constraints", text: MER_ET_GARE },
  ]);
  assert.deepEqual(r.blocks.map((b) => b.key), ["verdict", "unexamined_hard_constraints", "uncovered_priorities"]);
});

test("bloc générable manquant : son fallback, les autres survivent", () => {
  const r = validateGeneratedBlocks(plan(), [{ key: "uncovered_priorities", text: "3 de vos priorités restent hors champ." }]);
  assert.equal(r.blocks[1]!.generated, false);
  assert.equal(r.blocks[2]!.generated, true);
  assert.ok(r.rejected.some((x) => x.key === "unexamined_hard_constraints" && x.reason === "missing"));
});

test("élément malformé : rejeté SEUL, les autres survivent (invalid_shape)", () => {
  const r = validateGeneratedBlocks(plan(), [
    { key: "unexamined_hard_constraints", text: null },
    "n'importe quoi",
    { key: "uncovered_priorities", text: "3 de vos priorités restent hors champ." },
  ]);
  assert.equal(r.blocks[2]!.generated, true);  // le bloc valide passe
  assert.equal(r.blocks[1]!.generated, false); // le malformé retombe en repli
  assert.equal(r.rejected.filter((x) => x.reason === "invalid_shape").length, 2);
});

test("clé inconnue : ignorée et journalisée", () => {
  const r = validateGeneratedBlocks(plan(), [
    { key: "recommandation", text: "Faites réaliser une étude de sol." },
    { key: "uncovered_priorities", text: "3 de vos priorités restent hors champ." },
  ]);
  assert.equal(r.blocks.some((b) => b.text.includes("étude de sol")), false);
  assert.ok(r.rejected.some((x) => x.key === "recommandation" && x.reason === "unknown_key"));
});

test("clé en double : le second est rejeté", () => {
  const r = validateGeneratedBlocks(plan(), [
    { key: "uncovered_priorities", text: "3 de vos priorités restent hors champ." },
    { key: "uncovered_priorities", text: "Tout va bien." },
  ]);
  assert.equal(r.blocks[2]!.text, "3 de vos priorités restent hors champ.");
  assert.ok(r.rejected.some((x) => x.reason === "duplicate_key"));
});

test("texte vide ou blanc : fallback", () => {
  const r = validateGeneratedBlocks(plan(), [{ key: "uncovered_priorities", text: "   " }]);
  assert.equal(r.blocks[2]!.text, "3 de vos priorités ne sont pas couvertes ici.");
  assert.ok(r.rejected.some((x) => x.reason === "empty"));
});

test("dépassement de maxChars : fallback de CE bloc seulement", () => {
  const r = validateGeneratedBlocks(plan(), [
    { key: "uncovered_priorities", text: "3 " + "a".repeat(300) },
    { key: "unexamined_hard_constraints", text: MER_ET_GARE },
  ]);
  assert.equal(r.blocks[2]!.generated, false);
  assert.equal(r.blocks[1]!.generated, true);
  assert.ok(r.rejected.some((x) => x.reason === "too_long"));
});

test("nombre absent du fallback : hallucination factuelle rejetée", () => {
  const r = validateGeneratedBlocks(plan(), [{ key: "uncovered_priorities", text: "4 points demandent un regard." }]);
  assert.equal(r.blocks[2]!.generated, false);
  assert.ok(r.rejected.some((x) => x.reason === "unauthorized_number"));
});

test("l'invariant est « aucun nombre FAUX » : le compte VRAI passe, même en toutes lettres", () => {
  // Le plan déclare 3 réserves : « trois » est exact et bien écrit, on ne censure pas une tournure fidèle.
  const r = validateGeneratedBlocks(plan(), [
    { key: "uncovered_priorities", text: "3 priorités, soit trois attentes non couvertes, avant d'aller plus loin." },
  ]);
  assert.equal(r.blocks[2]!.generated, true);
});

test("un compte FAUX en toutes lettres est rejeté (sinon « Quatre points » passerait sous le radar)", () => {
  const r = validateGeneratedBlocks(plan(), [
    { key: "uncovered_priorities", text: "3 priorités restent hors champ, quatre si l'on compte large." },
  ]);
  assert.equal(r.blocks[2]!.generated, false);
  assert.ok(r.rejected.some((x) => x.reason === "unauthorized_number"));
});

test("« un » et « une » restent des articles, jamais des nombres interdits", () => {
  const r = validateGeneratedBlocks(plan(), [
    { key: "unexamined_hard_constraints", text: "Une condition n'a pas pu être vérifiée : la proximité de la mer, la présence d'une gare." },
  ]);
  assert.equal(r.blocks[1]!.generated, true);
});

test("un mot qui CONTIENT un nombre n'est pas un nombre (septembre, sixième)", () => {
  const r = validateGeneratedBlocks(plan(), [
    { key: "uncovered_priorities", text: "3 priorités restent hors champ, récemment mises à jour." },
  ]);
  assert.equal(r.blocks[2]!.generated, true);
});

test("année ou horizon inventé : rejeté", () => {
  const r = validateGeneratedBlocks(plan(), [
    { key: "uncovered_priorities", text: "D'ici 2050, 3 priorités restent hors champ." },
  ]);
  assert.equal(r.blocks[2]!.generated, false);
  assert.ok(r.rejected.some((x) => x.reason === "unauthorized_number"));
});

test("sortie totalement vide : tout retombe en déterministe", () => {
  const r = validateGeneratedBlocks(plan(), []);
  assert.equal(r.blocks.every((b) => !b.generated), true);
  assert.deepEqual(r.blocks.map((b) => b.text), plan().blocks.map((b) => b.fallbackText));
});

// ── La voix : ce que le prompt interdit, le code le corrige (slice 2.1) ─────────

test("le tiret cadratin devient une virgule, sans que le bloc soit rejeté", () => {
  // Le prompt l'interdit, le modèle le produit quand même (vu par la sonde). Rejeter un texte VRAI
  // pour un signe de ponctuation renverrait le lecteur au repli : on paierait une virgule au prix
  // d'une phrase. On corrige, sans changer un mot.
  const r = validateGeneratedBlocks(plan(), [
    { key: "uncovered_priorities", text: "3 priorités restent hors champ — aucune n'est couverte." },
  ]);
  const bloc = r.blocks.find((b) => b.key === "uncovered_priorities")!;
  assert.equal(bloc.generated, true);
  assert.equal(bloc.text, "3 priorités restent hors champ, aucune n'est couverte.");
  assert.equal(bloc.text.includes("—"), false);
});
