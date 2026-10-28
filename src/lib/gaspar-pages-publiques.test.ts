// FUT-159 et FUT-161 · LES BLOCS GASPAR DES PAGES /inondation ET /chaleur, PHRASES RÉELLEMENT AFFICHÉES.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { phraseReconnaissancesCatnat } from "./gaspar-pages-publiques.ts";

const PAGES = [
  "src/app/(public)/inondation/[insee_code]/page.tsx",
  "src/app/(public)/chaleur/[insee_code]/page.tsx",
];

test("FUT-161 · le nombre et « fois » restent liés par une espace insécable, avec 1 et plusieurs reconnaissances", () => {
  assert.equal(phraseReconnaissancesCatnat(1, "Niort", null), "Niort a déjà été reconnue 1\u00a0fois en état de catastrophe naturelle");
  assert.equal(phraseReconnaissancesCatnat(17, "Metz", null), "Metz a déjà été reconnue 17\u00a0fois en état de catastrophe naturelle");
  assert.equal(
    phraseReconnaissancesCatnat(16, "Paris 11e Arrondissement", "Paris"),
    "À l'échelle de Paris (GASPAR ne publie pas les arrondissements), la ville a déjà été reconnue 16\u00a0fois en état de catastrophe naturelle",
  );
  assert.doesNotMatch(phraseReconnaissancesCatnat(17, "Metz", null), /\dfois/);
});

test("FUT-161 · aucune des deux pages ne compose plus la phrase en JSX, là où l'espace se perdait", () => {
  for (const page of PAGES) {
    const source = readFileSync(page, "utf8");
    assert.doesNotMatch(source, /\} fois en état/, page);
    assert.match(source, /phraseReconnaissancesCatnat\(/, page);
  }
});
