// FUT-6, D9 : la synthèse déterministe, premier niveau fiable et immédiat.
import test from "node:test";
import assert from "node:assert/strict";
import { buildTerritoireSnapshot, type TerritoireInputs } from "./facts.ts";
import { HORIZONS, projectForSynthesis } from "./synthesis-contract.ts";
import { deterministicSynthesis } from "./synthesis-deterministe.ts";
import { checkSynthesis } from "./synthesis-checks.ts";
import { chatelaillonInputs } from "./__fixtures__/chatelaillon.ts";

const T0 = "2026-09-28T00:00:00.000Z";
const projection = (i: TerritoireInputs = chatelaillonInputs(), h = "gwl20" as const) =>
  projectForSynthesis(buildTerritoireSnapshot(i, T0), h);

/** Le texte de référence, relu : c'est lui que la PR soumet à la relecture éditoriale. */
const CHATELAILLON_2050 = `Châtelaillon-Plage à l'horizon 2050

## Le territoire aujourd'hui

Châtelaillon-Plage, 6\u202f227 habitants dans l'agglomération de La Rochelle, a une densité intermédiaire (976 habitants au km²). Ses sols mêlent espaces urbanisés, espaces naturels et cultures : 49 % d'espaces urbanisés et 37 % d'espaces naturels. Sa population a progressé de 0,62 % par an entre 2015 et 2021.

## Ce qui évolue d'ici 2050

Parmi les évolutions projetées pour 2050 (scénario France +2,7 °C) : 19 jours au-dessus de 30 °C par an (+12 par rapport à 1976-2005), 25 nuits au-dessus de 20 °C (+19) et 136 jours de sols secs par an. Ces indicateurs comptent des jours sur l'année, sans dire s'ils forment une période continue.

## Ce que la commune a déjà connu

Châtelaillon-Plage a été reconnue 14 fois en état de catastrophe naturelle depuis 1982. Des périmètres d'inondation et de submersion marine y sont recensés. L'effet concret de ces évolutions dépend du quartier et du logement, qu'examinent les modules Autour de l'adresse et Logement.`;

test("Châtelaillon 2050 : le texte déterministe de référence", () => {
  assert.equal(deterministicSynthesis(projection(), "gwl20"), CHATELAILLON_2050);
});

test("stable : même snapshot, même texte", () => {
  assert.equal(deterministicSynthesis(projection(), "gwl20"), deterministicSynthesis(projection(), "gwl20"));
});

test("il passe ses propres contrôles, à chaque horizon", () => {
  for (const h of HORIZONS) {
    const p = projectForSynthesis(buildTerritoireSnapshot(chatelaillonInputs(), T0), h);
    assert.deepEqual(checkSynthesis(deterministicSynthesis(p, h), p), [], h);
  }
});

test("il ne déclare aucun phénomène dominant (pas de classement par percentile)", () => {
  const t = deterministicSynthesis(projection(), "gwl20");
  assert.doesNotMatch(t, /domine|pèse le plus|principal enjeu|avant tout|surtout la|le plus marquant/i);
  assert.match(t, /Parmi les évolutions projetées/);
});

test("il ne convertit jamais des jours en mois", () => {
  assert.doesNotMatch(deterministicSynthesis(projection(), "gwl20"), /\bmois\b/);
});

test("données minimales : un texte digne, qui passe les contrôles", () => {
  const i: TerritoireInputs = {
    ...chatelaillonInputs(),
    entry: null, urbanRole: null, ademe: null, scenarios: null, georisques: null, catnat: null,
    catnatInondationIndex: null, vigieau: null, drought: null, littoral: null, era5: null,
    saisonnalitePct: null, distinctiveTrait: null,
  };
  const p = projection(i);
  const t = deterministicSynthesis(p, "gwl20");
  assert.match(t, /^Châtelaillon-Plage à l'horizon 2050/);
  assert.equal(t.split(/\n## /).length - 1, 3);
  assert.deepEqual(checkSynthesis(t, p), []);
});

// ── Corrections du 28/09 ────────────────────────────────────────────────────────────────────

test("pas d'affirmation sur la répartition des jours dans l'année", () => {
  const t = deterministicSynthesis(projection(), "gwl20");
  assert.doesNotMatch(t, /répartis dans l'année|ne forment pas une saison/);
  assert.match(t, /sans dire s'ils forment une période continue/);
});

test("aucun raccord entre la sécheresse reconnue en CatNat et les jours de sols secs projetés", () => {
  const t = deterministicSynthesis(projection(), "gwl20");
  for (const sentence of t.split(/(?<=\.)\s+/)) {
    assert.ok(!(/sécheresse/i.test(sentence) && /sols secs|projet|évolution/i.test(sentence) && /reconnue|catastrophe/i.test(sentence)), sentence);
  }
  assert.doesNotMatch(t, /fait aussi partie des évolutions projetées/);
});

test("la part d'arrivants récents n'est jamais associée à la période 2015-2021", () => {
  assert.doesNotMatch(deterministicSynthesis(projection(), "gwl20"), /arrivants?[^.]*2015|2015[^.]*vivaient ailleurs/);
});

test("plus courte : 3 informations, 3 évolutions au plus, 2 faits puis le passage", () => {
  const t = deterministicSynthesis(projection(), "gwl20");
  const [, b1, b2, b3] = t.split(/\n## [^\n]+\n\n/);
  const sentences = (b: string) => b.trim().split(/(?<=\.)\s+/).length;
  assert.ok(sentences(b1) <= 3, "bloc 1");
  assert.ok((b2.match(/ par an| au-dessus de 20 °C/g) ?? []).length <= 4, "bloc 2");
  assert.ok(sentences(b3) <= 3, "bloc 3");
  assert.ok(t.split(/\s+/).length < 230, `${t.split(/\s+/).length} mots`);
});

