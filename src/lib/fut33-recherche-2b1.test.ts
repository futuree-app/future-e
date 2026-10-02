// FUT-33, phase 2B.1 : ce que la RECHERCHE choisit avec la vérité littorale (rien de ce qu'elle raconte).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { scoreProximiteMer, communeLittoraleMer, ancreLittorale } from "./mer-recherche.ts";
import { communeAttributesFrom } from "./commune-attributes.ts";
import { hydrateHardConstraints } from "./hard-constraints-hydrate.ts";
import { evaluateNearSea, evaluateExcludeSea, type EvaluationContext } from "./hard-constraints.ts";
import { criterionCapability } from "./decision/capability.ts";
import { toCommuneAttributes, mapCommuneToModuleFacts } from "./decision/module-facts-map.ts";
import type { PlaceDirectory } from "./hard-constraints-resolve.ts";
import type { HardConstraints } from "./hard-constraint-schema.ts";

const racine = new URL("../../", import.meta.url);
const communes = JSON.parse(gunzipSync(readFileSync(new URL("data/comparateur-index.json.gz", racine))).toString("utf8")).communes as Record<string, any>[];
const par = new Map(communes.map((c) => [`${c.nom}|${c.dept}`, c]));
const c = (k: string) => { const x = par.get(k); assert.ok(x, k); return x!; };
const dir: PlaceDirectory = { byName: () => null, plmByName: () => null };
const ctx = (hc: HardConstraints): EvaluationContext => ({ constraints: hydrateHardConstraints(hc, dir), point: null, conventionsVersion: "test" });
const attrs = (k: string) => communeAttributesFrom(c(k) as never, null);

test("préférence « proximité de la mer » : Lannion en tête, Châtelaillon n'est plus à 11 km, Bordeaux et Caen reculent", () => {
  assert.ok(scoreProximiteMer(c("Lannion|22"))! >= 99);
  assert.ok(scoreProximiteMer(c("Châtelaillon-Plage|17"))! >= 99);
  assert.ok(scoreProximiteMer(c("Bordeaux|33"))! < scoreProximiteMer(c("Lannion|22"))! - 20);
  assert.ok(scoreProximiteMer(c("Caen|14"))! < scoreProximiteMer(c("Lannion|22"))!, "Caen n'est plus quasi côtière");
  // Graduée, sans seuil de rejet : une commune lointaine garde un score, rien n'est écarté.
  assert.ok(scoreProximiteMer({ mer_centre_km: 80 })! > 0);
});

test("« près de la mer » sans nombre ne filtre rien (aucun seuil universel)", () => {
  assert.equal(evaluateNearSea(ctx({ nearSea: { active: true } }), attrs("Bordeaux|33")).status, "unexamined");
  const src = readFileSync(new URL("src/lib/mer-recherche.ts", racine), "utf8");
  assert.doesNotMatch(src, /<=\s*15\b|>=\s*15\b|ANCRE_COAST_KM|excludeSeaMinKm/);
});

test("« à moins de N km de la mer » applique N au centre de la commune (mer_centre_km)", () => {
  const cinq = ctx({ nearSea: { active: true, maxKm: 5 } }), dix = ctx({ nearSea: { active: true, maxKm: 10 } });
  assert.equal(evaluateNearSea(cinq, attrs("Lannion|22")).status, "satisfied");
  assert.equal(evaluateNearSea(cinq, attrs("Caen|14")).status, "incompatible", "Caen : 9,2 km");
  assert.equal(evaluateNearSea(dix, attrs("Caen|14")).status, "satisfied");
  assert.equal(evaluateNearSea(dix, attrs("Bordeaux|33")).status, "incompatible");
  const a = evaluateNearSea(cinq, attrs("Caen|14"));
  assert.ok("evidenceKeys" in a && a.evidenceKeys.includes("commune.merCentreKm"));
  assert.match("statement" in a ? a.statement ?? "" : "", /centre de cette commune.*rivage marin/);
});

test("« pas le littoral » = commune classée Mer : Annecy, Rochefort, Bordeaux acceptées ; Arles et Marseille écartées", () => {
  const hors = ctx({ excludeSea: true });
  for (const k of ["Annecy|74", "Rochefort|17", "Bordeaux|33", "Nantes|44", "Montpellier|34"]) assert.equal(evaluateExcludeSea(hors, attrs(k)).status, "satisfied", k);
  for (const k of ["Arles|13", "Lannion|22", "Marseille 7e Arrondissement|13"]) assert.equal(evaluateExcludeSea(hors, attrs(k)).status, "incompatible", k);
  assert.equal(communeLittoraleMer(c("Arles|13")), true, "Mer même si son centre est à 13 km");
  assert.equal(communeLittoraleMer(c("Rochefort|17")), false, "Estuaire seul n'est pas Mer");
});

test("ancre (D5) : Brest, Lannion, Vannes, Narbonne suggèrent ; Arles, Lacanau, Bordeaux, Caen, Annecy non", () => {
  for (const k of ["Brest|29", "Lannion|22", "La Rochelle|17", "Vannes|56", "Narbonne|11"]) assert.equal(ancreLittorale(c(k)), true, k);
  for (const k of ["Arles|13", "Lacanau|33", "Carcans|33", "Bordeaux|33", "Caen|14", "Annecy|74"]) assert.equal(ancreLittorale(c(k)), false, k);
  const src = readFileSync(new URL("src/lib/comparateur-vie.ts", racine), "utf8");
  const bloc = src.slice(src.indexOf("if (ancreLittorale(entry))"), src.indexOf("if (ancreLittorale(entry))") + 300);
  assert.match(bloc, /proximite_mer", weight: 2/);
  assert.match(bloc, /"proximité du littoral"/);
  assert.doesNotMatch(bloc, /plage|océan|condition|confirm/i);
});

test("grain et capacité : le dossier n'est pas migré, aucune capacité ne change, mer_centre_km n'est pas une adresse", () => {
  // Le dossier construit ses attributs sans les champs mer : il garde l'ancien chemin, inchangé en 2B.1.
  const facts = mapCommuneToModuleFacts(c("Lannion|22") as never, {}, { hasAddress: true, tailleVille: null, tailleVilleSource: "commune" });
  const d = toCommuneAttributes(facts);
  assert.equal("merCentreKm" in d, false);
  assert.equal("communeLittoraleMer" in d, false);
  // nearSea avec nombre : toujours « apprécier » au point de référence, même à l'adresse (le calcul adresse n'est pas branché).
  for (const grain of ["commune", "adresse"] as const) {
    assert.equal(criterionCapability({ kind: "hard", key: "nearSea", hc: { nearSea: { active: true, maxKm: 5 } } }, grain).capability, "apprecier");
    assert.equal(criterionCapability({ kind: "hard", key: "excludeSea", hc: { excludeSea: true } }, grain).capability, "apprecier");
  }
});

test("legacy : les consommateurs migrés ne lisent plus distance_cote_km ; le champ reste dans l'index", () => {
  const src = readFileSync(new URL("src/lib/comparateur-vie.ts", racine), "utf8");
  const fenetre = (debut: string, n: number) => src.slice(src.indexOf(debut), src.indexOf(debut) + n);
  for (const bloc of [fenetre('case "proximite_mer":', 400), fenetre('const sea = hints.find', 300), fenetre("if (ancreLittorale(entry))", 300), fenetre("export async function perimeterAllowsCoast", 900)]) {
    assert.ok(bloc.length > 50);
    assert.doesNotMatch(bloc, /distance_cote_km/);
  }
  assert.doesNotMatch(readFileSync(new URL("src/lib/mer-recherche.ts", racine), "utf8"), /distance_cote_km/);
  assert.ok(communes.every((x) => typeof x.distance_cote_km === "number"));
});
