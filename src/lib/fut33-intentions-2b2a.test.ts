// FUT-33, phase 2B.2 A : trois refus de la mer, trois représentations, jamais confondues.
//   « pas une commune littorale »  → excludeSea (classement loi Littoral, sans kilomètre) ;
//   « à au moins N km de la mer »  → farFromSea { minKm: N } (le nombre du lecteur, au centre de la commune) ;
//   « loin de la mer », sans nombre → préférence eloignement_mer (oriente le classement, jamais une condition).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { assainirParsed } from "./parse-assainir.ts";
import { scoreProximiteMer, scoreEloignementMer, bonusMer } from "./mer-recherche.ts";
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
const assaini = (hc: HardConstraints, texte: string, preferences: { key: string; weight: number }[] = []) =>
  assainirParsed({ reformulation: "", hardConstraints: hc, preferences } as unknown as ParsedProject, texte);
const parse = (hc: HardConstraints, texte: string) => assaini(hc, texte).hardConstraints!;

test("assainissement : un nombre de kilomètres n'existe que s'il est dit", () => {
  assert.deepEqual(parse({ farFromSea: { active: true, minKm: 30 } }, "à au moins 30 km de la mer").farFromSea, { active: true, minKm: 30 });
  assert.deepEqual(parse({ farFromSea: { active: true, minKm: 20 } }, "pas à moins de 20 kilomètres de la côte").farFromSea, { active: true, minKm: 20 });
  // Le modèle a inventé un nombre : la contrainte tombe, l'intention reste, en préférence graduée.
  const p = assaini({ farFromSea: { active: true, minKm: 15 } }, "on veut vivre loin de la mer");
  assert.equal(p.hardConstraints!.farFromSea, null);
  assert.deepEqual(p.preferences.map((x) => [x.key, x.weight]), [["eloignement_mer", 2]]);
  assert.equal(parse({ farFromSea: { active: false, minKm: null } }, "rien").farFromSea, null);
  // « Loin » et « près » ne se cumulent pas : le refus l'emporte.
  const q = assaini({}, "loin de la mer", [{ key: "proximite_mer", weight: 2 }, { key: "eloignement_mer", weight: 3 }]);
  assert.deepEqual(q.preferences.map((x) => x.key), ["eloignement_mer"]);
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

test("« loin de la mer » sans nombre n'est jamais une condition : ni filtre, ni « condition non appliquée »", () => {
  const r = hardFilter(assessHardConstraints(ctx({ farFromSea: { active: true, minKm: null } }), attrs("Lannion|22")));
  assert.equal(r.eligible, true);
  assert.deepEqual(unappliedLabels(r), []);
  const p = { parsed: { reformulation: "", preferences: [], hardConstraints: { farFromSea: { active: true, minKm: null } } } } as unknown as UserProject;
  assert.deepEqual(declaredHardConstraintKeys(p), []);
});

test("courbe C (point milieu 20 km) : elle classe ; l'éloignement en est l'exact inverse ; le bonus suit la même courbe", () => {
  const c = (k: string) => par.get(k)!;
  assert.ok(scoreProximiteMer(c("Lannion|22"))! > 99);
  assert.equal(Math.round(scoreProximiteMer({ mer_centre_km: 20 })!), 50);
  assert.equal(Math.round(scoreProximiteMer(c("Bordeaux|33"))!), 21);
  assert.equal(Math.round(scoreProximiteMer(c("Caen|14"))!), 82);
  for (const k of ["Lannion|22", "Caen|14", "Bordeaux|33", "Annecy|74"]) {
    assert.equal(Math.round(scoreProximiteMer(c(k))! + scoreEloignementMer(c(k))!), 100, k);
  }
  assert.ok(scoreEloignementMer(c("Annecy|74"))! > 99 && scoreEloignementMer(c("Lannion|22"))! < 1);
  // Aucune commune n'est écartée : même à 80 km, la proximité garde un score ; même au rivage, l'éloignement vaut 0, pas un rejet.
  assert.ok(scoreProximiteMer({ mer_centre_km: 80 })! > 0);
  assert.equal(bonusMer({ mer_centre_km: 20 }, 10), 5);
  const src = readFileSync(new URL("src/lib/mer-recherche.ts", racine), "utf8");
  assert.doesNotMatch(src, /rayonKm|\/ 1\.5/, "plus de rayon ni de pente linéaire");
  assert.doesNotMatch(readFileSync(new URL("src/lib/hard-constraints-hydrate.ts", racine), "utf8"), /LEGACY_NEAR_SEA_KM/);
});

test("aucune capacité ne change : farFromSea s'apprécie comme nearSea, aux deux grains", () => {
  for (const grain of ["commune", "adresse"] as const) {
    assert.equal(criterionCapability({ kind: "hard", key: "farFromSea", hc: { farFromSea: { active: true, minKm: 30 } } }, grain).capability, "apprecier");
    // La préférence d'éloignement n'a pas encore de règle au dossier (étape C) : il dit ne pas la mesurer.
    assert.equal(criterionCapability({ kind: "preference", key: "eloignement_mer" }, grain).capability, "ne_pas_mesurer");
    assert.equal(criterionCapability({ kind: "hard", key: "excludeSea", hc: { excludeSea: true } }, grain).capability, "apprecier");
    assert.equal(criterionCapability({ kind: "hard", key: "nearSea", hc: { nearSea: { active: true, maxKm: 5 } } }, grain).capability, "apprecier");
  }
});

test("le projet déclare farFromSea à côté d'excludeSea, sans les fusionner", () => {
  const p = { parsed: { reformulation: "", preferences: [], hardConstraints: { excludeSea: true, farFromSea: { active: true, minKm: 20 } } } } as unknown as UserProject;
  assert.deepEqual(declaredHardConstraintKeys(p).filter((k) => /Sea/.test(k)), ["excludeSea", "farFromSea"]);
});

test("phrases réelles (vrai prompt, 02/10/2026) : chaque refus va dans sa représentation", () => {
  type Ligne = { texte: string; excludeSea: boolean | null; farFromSea: { minKm: number | null } | null; eloignement_mer: number | null; motsForts?: string[] };
  const sonde = JSON.parse(readFileSync(new URL("scripts/mer/fixtures/sonde-parseur-2b2a.json", racine), "utf8")) as Ligne[];
  const ligne = (debut: string) => { const x = sonde.find((s) => s.texte.startsWith(debut)); assert.ok(x, debut); return x!; };
  assert.equal(ligne("Hors littoral").excludeSea, true);
  assert.equal(ligne("Hors littoral").farFromSea, null);
  assert.equal(ligne("Je veux être à au moins 30 km").farFromSea?.minKm, 30);
  assert.equal(ligne("Je veux être à au moins 30 km").excludeSea, null);
  for (const d of ["On veut vivre loin", "Plutôt dans les terres", "Je ne veux pas être près"]) {
    assert.equal(ligne(d).farFromSea, null, d);
    assert.equal(ligne(d).excludeSea, null, d);
    assert.equal(ligne(d).eloignement_mer, 2, d);
  }
  // « Surtout pas au bord de la mer » : une distance physique, avec son mot fort ; jamais la loi Littoral.
  assert.equal(ligne("Surtout pas au bord").excludeSea, null);
  assert.equal(ligne("Surtout pas au bord").eloignement_mer, 3);
  assert.match((ligne("Surtout pas au bord").motsForts ?? []).join(), /eloignement_mer/);
  assert.equal(ligne("Pas sur le littoral, et au moins 20").excludeSea, true);
  assert.equal(ligne("Pas sur le littoral, et au moins 20").farFromSea?.minKm, 20);
  assert.equal(ligne("Pas forcément près").farFromSea, null);
  assert.equal(ligne("Pas forcément près").eloignement_mer, null);
});
