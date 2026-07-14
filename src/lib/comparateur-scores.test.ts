import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mismatchRawScore, MISMATCH_RANK_KEYS } from "./comparateur-scores.ts";
import type { IndexCommune } from "./comparateur-vie.ts";

// La lib est PURE : le test lit l'index directement, sans passer par comparateur-vie (server-only). La
// parité avec signatureScore est garantie STRUCTURELLEMENT (signatureScore délègue à mismatchRawScore pour
// ces 10 clés) ; ce test vérifie que la lib tient ses invariants sur données réelles.
const communes: IndexCommune[] = JSON.parse(
  readFileSync("data/comparateur-index.json", "utf8"),
).communes.slice(0, 800);

test("une commune SANS la donnée rend null (aucun repli ?? 0 / ?? 100)", () => {
  const vide = { insee: "x", nom: "X" } as unknown as IndexCommune;
  for (const key of MISMATCH_RANK_KEYS) {
    assert.equal(mismatchRawScore(key, vide), null, `${key} doit être null sans donnée`);
  }
});

test("sur 800 communes réelles, chaque critère rend un nombre fini ou null, jamais NaN", () => {
  for (const c of communes) {
    for (const key of MISMATCH_RANK_KEYS) {
      const v = mismatchRawScore(key, c);
      assert.ok(v === null || Number.isFinite(v), `${key} sur ${c.insee}: ${v}`);
    }
  }
});

test("vie_locale N'EST PAS repliée à 0 : une commune sans score rend null", () => {
  // subScore repliait `?? 0` ; mismatchRawScore (comme signatureScore) rend null. C'est ce qui interdit
  // qu'une vie locale non mesurée soit classée « au plus bas ».
  const sansVieLocale = { insee: "y", nom: "Y", vieLocale: null } as unknown as IndexCommune;
  assert.equal(mismatchRawScore("vie_locale", sansVieLocale), null);
});

test("cadre_calme rend un score, ou null si la densité manque", () => {
  const avec = { insee: "z", nom: "Z", densite: 400 } as unknown as IndexCommune;
  assert.ok(Number.isFinite(mismatchRawScore("cadre_calme", avec)));
  const sans = { insee: "z", nom: "Z", densite: null } as unknown as IndexCommune;
  assert.equal(mismatchRawScore("cadre_calme", sans), null);
});
