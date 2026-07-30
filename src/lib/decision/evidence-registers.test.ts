import { test } from "node:test";
import assert from "node:assert/strict";
import { registersByTarget, registerForCard } from "./evidence-registers.ts";
import type { Dossier } from "./decision-fact.ts";
import type { EvidenceTargetKey } from "./evidence-targets.ts";

// Un dossier minimal : seules `sections` sont lues par ce module.
function dossierAvec(sections: { key: string; targets: EvidenceTargetKey[] }[]): Dossier {
  return {
    sections: sections.map((s) => ({
      key: s.key,
      title: s.key,
      cards: [
        {
          kind: "fact",
          fact: { evidence: s.targets.map((t) => ({ targetKey: t })) },
        },
      ],
    })),
  } as unknown as Dossier;
}

test("sans dossier, aucune carte ne porte de filet", () => {
  const table = registersByTarget(null);
  assert.equal(table.size, 0);
  assert.equal(registerForCard(["climate.extreme_heat"], table), null);
});

test("une carte qu'aucune preuve ne cite reste neutre", () => {
  const table = registersByTarget(dossierAvec([{ key: "alignments", targets: ["nature.green_spaces"] }]));
  assert.equal(registerForCard(["climate.extreme_heat"], table), null);
});

test("une carte citée par un seul registre porte sa teinte", () => {
  const table = registersByTarget(dossierAvec([{ key: "compromises", targets: ["climate.extreme_heat"] }]));
  assert.equal(registerForCard(["climate.extreme_heat"], table), "compromises");
});

test("plusieurs preuves du MÊME registre convergent, le filet reste", () => {
  const table = registersByTarget(
    dossierAvec([{ key: "verifications", targets: ["climate.extreme_heat", "climate.tropical_nights"] }]),
  );
  // La carte climatique démontre les deux phénomènes : ils vont au même registre.
  assert.equal(registerForCard(["climate.extreme_heat", "climate.tropical_nights"], table), "verifications");
});

test("deux registres DIFFÉRENTS sur la même carte : aucun filet, pas de priorité inventée", () => {
  const table = registersByTarget(
    dossierAvec([
      { key: "alignments", targets: ["climate.extreme_heat"] },
      { key: "unknowns", targets: ["climate.tropical_nights"] },
    ]),
  );
  assert.equal(registerForCard(["climate.extreme_heat", "climate.tropical_nights"], table), null);
  // Chacun pris isolément garde pourtant son registre : la neutralité vient du CROISEMENT.
  assert.equal(registerForCard(["climate.extreme_heat"], table), "alignments");
  assert.equal(registerForCard(["climate.tropical_nights"], table), "unknowns");
});

test("l'incompatibilité l'emporte toujours : elle bloque le dossier", () => {
  const table = registersByTarget(
    dossierAvec([
      { key: "incompatibilities", targets: ["climate.extreme_heat"] },
      { key: "alignments", targets: ["climate.tropical_nights"] },
    ]),
  );
  assert.equal(
    registerForCard(["climate.extreme_heat", "climate.tropical_nights"], table),
    "incompatibilities",
  );
});

test("une carte sans phénomène déclaré reste neutre", () => {
  const table = registersByTarget(dossierAvec([{ key: "alignments", targets: ["climate.extreme_heat"] }]));
  assert.equal(registerForCard(undefined, table), null);
  assert.equal(registerForCard([], table), null);
});

test("les preuves imbriquées d'une composition sont trouvées", () => {
  // Forme d'un tradeoff : les preuves vivent dans deux `sides`, pas dans un champ `evidence` plat.
  const dossier = {
    sections: [
      {
        key: "compromises",
        title: "",
        cards: [
          {
            kind: "composition",
            composition: {
              kind: "tradeoff",
              favorableSide: { evidence: [{ targetKey: "climate.mean_temperature" }] },
              unfavorableSide: { evidence: [{ targetKey: "climate.extreme_heat" }] },
            },
          },
        ],
      },
    ],
  } as unknown as Dossier;

  const table = registersByTarget(dossier);
  assert.equal(registerForCard(["climate.extreme_heat"], table), "compromises");
  assert.equal(registerForCard(["climate.mean_temperature"], table), "compromises");
});
