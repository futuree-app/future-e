// FUT-33, phase 2B.2 A : trois refus de la mer, trois représentations, jamais confondues.
//   « pas une commune littorale »  → excludeSea (classement loi Littoral, sans kilomètre) ;
//   « à au moins N km de la mer »  → farFromSea { minKm: N } (le nombre du lecteur, au centre de la commune) ;
//   « loin de la mer », sans nombre → farFromSea { minKm: null } (compris, dit, jamais filtré).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { assainirParsed } from "./parse-assainir.ts";
import { communeAttributesFrom } from "./commune-attributes.ts";
import { hydrateHardConstraints } from "./hard-constraints-hydrate.ts";
import { evaluateExcludeSea, evaluateFarFromSea, assessHardConstraints, type EvaluationContext } from "./hard-constraints.ts";
import { hardFilter, unappliedLabels } from "./hard-constraints-filter.ts";
import { criterionCapability } from "./decision/capability.ts";
import { declaredHardConstraintKeys } from "./decision/project-view.ts";
import type { PlaceDirectory } from "./hard-constraints-resolve.ts";
import type { HardConstraints } from "./hard-constraint-schema.ts";
import type { ParsedProject } from "./comparateur-vie.ts";
import type { UserProject } from "./user-project.ts";

const racine = new URL("../../", import.meta.url);
const communes = JSON.parse(gunzipSync(readFileSync(new URL("data/comparateur-index.json.gz", racine))).toString("utf8")).communes as Record<string, any>[];
const par = new Map(communes.map((c) => [`${c.nom}|${c.dept}`, c]));
const attrs = (k: string) => { const c = par.get(k); assert.ok(c, k); return communeAttributesFrom(c as never, null); };
const dir: PlaceDirectory = { byName: () => null, plmByName: () => null };
const ctx = (hc: HardConstraints): EvaluationContext => ({ constraints: hydrateHardConstraints(hc, dir), point: null, conventionsVersion: "test" });
const parse = (hc: HardConstraints, texte: string) => assainirParsed({ reformulation: "", hardConstraints: hc, preferences: [] } as unknown as ParsedProject, texte).hardConstraints!;

test("assainissement : un nombre de kilomètres n'existe que s'il est dit", () => {
  assert.deepEqual(parse({ farFromSea: { active: true, minKm: 30 } }, "à au moins 30 km de la mer").farFromSea, { active: true, minKm: 30 });
  assert.deepEqual(parse({ farFromSea: { active: true, minKm: 20 } }, "pas à moins de 20 kilomètres de la côte").farFromSea, { active: true, minKm: 20 });
  // Le modèle a inventé un nombre : il tombe, l'intention reste.
  assert.deepEqual(parse({ farFromSea: { active: true, minKm: 15 } }, "on veut vivre loin de la mer").farFromSea, { active: true, minKm: null });
  assert.equal(parse({ farFromSea: { active: false, minKm: null } }, "rien").farFromSea, null);
});

test("Caen sépare les deux sens : hors commune littorale, mais à 9 km du rivage", () => {
  assert.equal(evaluateExcludeSea(ctx({ excludeSea: true }), attrs("Caen|14")).status, "satisfied");
  assert.equal(evaluateFarFromSea(ctx({ farFromSea: { active: true, minKm: 10 } }), attrs("Caen|14")).status, "incompatible");
  assert.equal(evaluateFarFromSea(ctx({ farFromSea: { active: true, minKm: 5 } }), attrs("Caen|14")).status, "satisfied");
  // Montpellier et Rochefort, non classées Mer, ne sont pas « loin de la mer » pour autant.
  for (const k of ["Montpellier|34", "Rochefort|17"]) {
    assert.equal(evaluateExcludeSea(ctx({ excludeSea: true }), attrs(k)).status, "satisfied", k);
    assert.equal(evaluateFarFromSea(ctx({ farFromSea: { active: true, minKm: 20 } }), attrs(k)).status, "incompatible", k);
  }
  assert.equal(evaluateFarFromSea(ctx({ farFromSea: { active: true, minKm: 30 } }), attrs("Annecy|74")).status, "satisfied");
  const a = evaluateFarFromSea(ctx({ farFromSea: { active: true, minKm: 20 } }), attrs("Lannion|22"));
  assert.ok("evidenceKeys" in a && a.evidenceKeys.includes("commune.merCentreKm"));
  assert.match("statement" in a ? a.statement ?? "" : "", /centre de cette commune.*rivage marin.*20 km au moins/);
});

test("« loin de la mer » sans nombre : rien n'est écarté, et le lecteur l'apprend", () => {
  const r = hardFilter(assessHardConstraints(ctx({ farFromSea: { active: true, minKm: null } }), attrs("Lannion|22")));
  assert.equal(r.eligible, true);
  assert.deepEqual(unappliedLabels(r), ["l'éloignement de la mer, faute de distance précisée en kilomètres"]);
});

test("aucune capacité ne change : farFromSea s'apprécie comme nearSea, aux deux grains", () => {
  for (const grain of ["commune", "adresse"] as const) {
    assert.equal(criterionCapability({ kind: "hard", key: "farFromSea", hc: { farFromSea: { active: true, minKm: 30 } } }, grain).capability, "apprecier");
    assert.equal(criterionCapability({ kind: "hard", key: "farFromSea", hc: { farFromSea: { active: true, minKm: null } } }, grain).reason, "sans_seuil");
    assert.equal(criterionCapability({ kind: "hard", key: "excludeSea", hc: { excludeSea: true } }, grain).capability, "apprecier");
    assert.equal(criterionCapability({ kind: "hard", key: "nearSea", hc: { nearSea: { active: true, maxKm: 5 } } }, grain).capability, "apprecier");
  }
});

test("le projet déclare farFromSea à côté d'excludeSea, sans les fusionner", () => {
  const p = { parsed: { reformulation: "", preferences: [], hardConstraints: { excludeSea: true, farFromSea: { active: true, minKm: 20 } } } } as unknown as UserProject;
  assert.deepEqual(declaredHardConstraintKeys(p).filter((k) => /Sea/.test(k)), ["excludeSea", "farFromSea"]);
});

test("phrases réelles (vrai prompt, 02/10/2026) : chaque refus va dans sa représentation", () => {
  const sonde = JSON.parse(readFileSync(new URL("scripts/mer/fixtures/sonde-parseur-2b2a.json", racine), "utf8")) as { texte: string; excludeSea: boolean | null; farFromSea: { minKm: number | null } | null }[];
  const ligne = (debut: string) => { const x = sonde.find((s) => s.texte.startsWith(debut)); assert.ok(x, debut); return x!; };
  assert.equal(ligne("Hors littoral").excludeSea, true);
  assert.equal(ligne("Hors littoral").farFromSea, null);
  assert.equal(ligne("Je veux être à au moins 30 km").farFromSea?.minKm, 30);
  assert.equal(ligne("Je veux être à au moins 30 km").excludeSea, null);
  assert.equal(ligne("On veut vivre loin").farFromSea?.minKm, null);
  assert.equal(ligne("On veut vivre loin").excludeSea, null);
  assert.equal(ligne("Je n'aime pas la mer").farFromSea, null);
  assert.equal(ligne("Pas sur le littoral, et au moins 20").excludeSea, true);
  assert.equal(ligne("Pas sur le littoral, et au moins 20").farFromSea?.minKm, 20);
  assert.equal(ligne("Pas forcément près").farFromSea, null);
});
