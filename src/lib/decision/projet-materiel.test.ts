import test from "node:test";
import assert from "node:assert/strict";
import { projetAChangeMateriellement, signatureDecisionnelle } from "./projet-materiel.ts";
import type { UserProject } from "../user-project.ts";

const projet = (over: Record<string, unknown> = {}): UserProject => ({
  posture: "recherche",
  intent: "achat",
  rawText: "je cherche au calme, près de la mer",
  parsed: {
    reformulation: "Un lieu calme, proche de la mer.",
    hardConstraints: { nearSea: { maxKm: 20 } },
    preferences: [{ key: "cadre_calme", weight: 3 }, { key: "proximite_mer", weight: 2 }],
  },
  updatedAt: "2026-08-05T09:00:00.000Z",
  ...over,
} as unknown as UserProject);

test("un projet inchangé ne périme rien", () => {
  assert.equal(projetAChangeMateriellement(projet(), projet()), false);
});

test("ce que le moteur LIT périme l'analyse", () => {
  // Les quatre entrées du moteur : la posture gouverne les gestes et la voix, l'intention change
  // ce qu'on propose, les contraintes dures peuvent rendre un lieu incompatible, et les préférences
  // décident quelles règles s'expriment.
  assert.equal(projetAChangeMateriellement(projet(), projet({ posture: "habitant" })), true);
  assert.equal(projetAChangeMateriellement(projet(), projet({ intent: "location" })), true);
  assert.equal(
    projetAChangeMateriellement(projet(), projet({
      parsed: { ...projet().parsed, hardConstraints: { nearSea: { maxKm: 5 } } },
    })),
    true,
  );
  assert.equal(
    projetAChangeMateriellement(projet(), projet({
      parsed: { ...projet().parsed, preferences: [{ key: "cadre_calme", weight: 3 }] },
    })),
    true,
  );
});

test("le POIDS d'une préférence compte autant que sa présence", () => {
  // Il gouverne la matérialité : un poids 1 est silencieux, un poids 3 structure le verdict.
  const alourdi = projet({
    parsed: { ...projet().parsed, preferences: [{ key: "cadre_calme", weight: 1 }, { key: "proximite_mer", weight: 2 }] },
  });
  assert.equal(projetAChangeMateriellement(projet(), alourdi), true);
});

test("le TEXTE du lecteur ne périme rien : aucune règle ne le lit", () => {
  // Corriger une faute de frappe, ou voir sa reformulation régénérée, ne change pas une décision.
  // Le contraire périmerait des dossiers vendus pour une virgule.
  assert.equal(
    projetAChangeMateriellement(projet(), projet({ rawText: "je cherche au calme, pres de la mer" })),
    false,
  );
  assert.equal(
    projetAChangeMateriellement(projet(), projet({
      parsed: { ...projet().parsed, reformulation: "Autre formulation, même sens." },
    })),
    false,
  );
  assert.equal(
    projetAChangeMateriellement(projet(), projet({ updatedAt: "2026-08-12T18:00:00.000Z" })),
    false,
  );
});

test("l'ORDRE des préférences et des contraintes n'est pas une différence", () => {
  // Un aller-retour JSON ne garantit pas l'ordre des clés : sans normalisation, le lecteur verrait
  // « votre projet a changé » sans avoir rien touché.
  const inverse = projet({
    parsed: {
      ...projet().parsed,
      preferences: [{ key: "proximite_mer", weight: 2 }, { key: "cadre_calme", weight: 3 }],
    },
  });
  assert.equal(projetAChangeMateriellement(projet(), inverse), false);
  assert.equal(signatureDecisionnelle(projet()), signatureDecisionnelle(inverse));
});

test("sans point de comparaison, on n'affirme RIEN", () => {
  // Les artefacts d'avant le 05/08/2026 ne portent pas de snapshot de projet. Annoncer une
  // obsolescence non établie serait le défaut symétrique de celui qu'on corrige.
  assert.equal(projetAChangeMateriellement(null, projet()), false);
  assert.equal(projetAChangeMateriellement(projet(), null), false);
  assert.equal(projetAChangeMateriellement(undefined, undefined), false);
});
