// FUT-33, phase 2B.2 C : le DOSSIER lit la bonne vérité littorale, selon la question et le grain.
//   nearSea / farFromSea : à l'adresse, l'adresse → rivage marin (5 m) ; sinon, le point de référence de la commune.
//   excludeSea           : le classement « Mer » de la commune au titre de la loi Littoral. Aucun kilomètre.
// Et aucune capacité FUT-7 ne change.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { construireIndexRivage, distanceAuRivageKm } from "./mer-rivage.ts";
import {
  assessHardConstraints, evaluateNearSea, evaluateFarFromSea, evaluateExcludeSea, PRODUCT_CONVENTIONS, PRODUCT_CONVENTIONS_VERSION,
  type EvaluationContext, type NormalizedHardConstraints, type MerAuPoint,
} from "./hard-constraints.ts";
import { mapCommuneToModuleFacts, toCommuneAttributes } from "./decision/module-facts-map.ts";
import { HARD_CONSTRAINT_RULES } from "./decision/hard-constraint-rules.ts";
import { criterionCapability } from "./decision/capability.ts";
import { buildConfirmation } from "./decision/conditions.ts";
import { assertFactValid } from "./decision/materiality-rules.ts";
import type { HardEvaluation, ModuleFacts } from "./decision/decision-fact.ts";
import type { UserProject } from "./user-project.ts";

const racine = new URL("../../", import.meta.url);
const communes = JSON.parse(gunzipSync(readFileSync(new URL("data/comparateur-index.json.gz", racine))).toString("utf8")).communes as Record<string, any>[];
const parInsee = new Map(communes.map((c) => [c.insee as string, c]));
const brut = gunzipSync(readFileSync(new URL("data/mer/rivage-5m.f32.gz", racine)));
const segments = new Float32Array(brut.byteLength / 4);
new Uint8Array(segments.buffer).set(brut);
const t0 = performance.now();
const RIVAGE = construireIndexRivage(segments);
const initMs = performance.now() - t0;
const REFERENCE = JSON.parse(readFileSync(new URL("scripts/mer/fixtures/adresses-test-2b2c.json", racine), "utf8")).points as
  { nom: string; insee: string; lat: number; lon: number; km_reference: number }[];
const ref = (debut: string) => { const p = REFERENCE.find((x) => x.nom.startsWith(debut)); assert.ok(p, debut); return p!; };

const faits = (insee: string): ModuleFacts => {
  const e = parInsee.get(insee);
  assert.ok(e, insee);
  return mapCommuneToModuleFacts(e as never, {}, { hasAddress: false, tailleVille: null, tailleVilleSource: "commune" });
};
const normalized = (over: Partial<NormalizedHardConstraints>): NormalizedHardConstraints => ({
  departements: null, zones: null, excludeZones: null, montagne: false, reliefProche: false,
  nearSea: null, excludeSea: false, communeSize: null, nearPlace: null, excludePlace: [], sizeRelativeTo: null, ...over,
});
const proche = (maxKm: number) => ({ nearSea: { threshold: { metric: "distance" as const, maxKm, source: "user" as const } } });
const loin = (minKm: number) => ({ farFromSea: { minKm } });
function ctx(over: Partial<NormalizedHardConstraints>, f: ModuleFacts, adresse?: { lat: number; lon: number; mer: MerAuPoint | null }): EvaluationContext {
  return {
    constraints: normalized(over),
    point: adresse
      ? { lat: adresse.lat, lon: adresse.lon, grain: "address", source: "address_geocoder", label: "une adresse" }
      : { lat: f.lat!, lon: f.lon!, grain: "commune_reference", source: "commune_centroid", label: f.nom },
    ...(adresse ? { merAuPoint: adresse.mer } : {}),
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };
}
const mesure = (lat: number, lon: number): MerAuPoint => {
  const km = distanceAuRivageKm(RIVAGE, lat, lon);
  return km == null ? { status: "unavailable" } : { status: "measured", km, grain: "address", version: "mer-v2" };
};

// ── Le calcul à l'adresse ─────────────────────────────────────────────────────────────────────────────

test("adresse : la distance de production retrouve la géométrie de référence (rivage complet) à 6 m près", () => {
  for (const p of REFERENCE) {
    const km = distanceAuRivageKm(RIVAGE, p.lat, p.lon)!;
    assert.ok(Math.abs(km - p.km_reference) < 0.006, `${p.nom} : ${km} contre ${p.km_reference}`);
  }
  // Rochefort : l'estuaire de la Charente est coupé à sa limite transversale ; le centre n'est pas « au bord ».
  assert.ok(distanceAuRivageKm(RIVAGE, ref("Rochefort").lat, ref("Rochefort").lon)! > 8);
  // Narbonne : l'étang de Bages compte (D2) ; Vannes : le golfe du Morbihan compte.
  assert.ok(distanceAuRivageKm(RIVAGE, ref("Narbonne").lat, ref("Narbonne").lon)! < 5);
  assert.ok(distanceAuRivageKm(RIVAGE, ref("Vannes").lat, ref("Vannes").lon)! < 1);
  assert.equal(distanceAuRivageKm(RIVAGE, Number.NaN, 2), null);
});

test("adresse : même commune, deux adresses, deux distances ; aucune n'est celle du point de référence", () => {
  for (const [a, b, insee] of [["Châtelaillon-Plage, front", "Châtelaillon-Plage, est", "17094"], ["Arles, centre", "Arles, Salin", "13004"], ["Lannion, centre", "Lannion, est", "22113"]]) {
    const da = distanceAuRivageKm(RIVAGE, ref(a).lat, ref(a).lon)!;
    const db = distanceAuRivageKm(RIVAGE, ref(b).lat, ref(b).lon)!;
    assert.ok(Math.abs(da - db) > 1, `${a} / ${b}`);
    const centre = parInsee.get(insee)!.mer_centre_km as number;
    assert.ok(Math.abs(da - centre) > 0.01 || Math.abs(db - centre) > 0.01, insee);
  }
  // Arles : 24 km au centre-ville, 5,7 km à Salin-de-Giraud, 13,4 km au point de référence de l'index.
  assert.ok(distanceAuRivageKm(RIVAGE, ref("Arles, centre").lat, ref("Arles, centre").lon)! > 20);
  assert.ok(distanceAuRivageKm(RIVAGE, ref("Arles, Salin").lat, ref("Arles, Salin").lon)! < 7);
});

test("adresse : nearSea et farFromSea se décident sur la distance de l'ADRESSE, et le disent", () => {
  const f = faits("13004"); // Arles, point de référence à 13,4 km
  const salin = ref("Arles, Salin");
  const c = ctx(proche(10), f, { lat: salin.lat, lon: salin.lon, mer: mesure(salin.lat, salin.lon) });
  const a = evaluateNearSea(c, toCommuneAttributes(f));
  assert.equal(a.status, "satisfied", "5,7 km pour une limite de 10 km, alors que le point de référence est à 13,4 km");
  assert.ok("evidenceKeys" in a && a.evidenceKeys.includes("adresse.merKm") && !a.evidenceKeys.includes("commune.merCentreKm"));
  const centre = ref("Arles, centre");
  const b = evaluateFarFromSea(ctx(loin(30), f, { lat: centre.lat, lon: centre.lon, mer: mesure(centre.lat, centre.lon) }), toCommuneAttributes(f));
  assert.ok(b.status === "incompatible");
  assert.match(b.statement, /^Cette adresse est à environ 24 km du rivage marin, plus près que les 30 km au moins que vous avez indiqués\.$/);
  assert.doesNotMatch(b.statement, /plage|océan|baignade|balnéaire/);
});

test("INVARIANT : à l'adresse, le centre de la commune n'est JAMAIS un repli", () => {
  const f = { ...faits("17094"), merCentreKm: 1 }; // Châtelaillon, centre à 1 km
  for (const mer of [null, { status: "unavailable" } as MerAuPoint]) {
    const c = ctx({ ...proche(5), ...loin(20) }, f, { lat: 46.07, lon: -1.09, mer });
    for (const a of [evaluateNearSea(c, toCommuneAttributes(f)), evaluateFarFromSea(c, toCommuneAttributes(f))]) {
      assert.equal(a.status, "unexamined", `${a.key} sans distance d'adresse`);
      assert.ok(a.status === "unexamined" && a.reason === "missing_data");
    }
  }
  // Et le code le garantit : la branche adresse de la mesure ne lit pas la distance du centre.
  const src = readFileSync(new URL("src/lib/hard-constraints.ts", racine), "utf8");
  const brancheAdresse = src.slice(src.indexOf('if (ctx.point?.grain === "address") {'), src.indexOf("return c.merCentreKm != null"));
  assert.ok(brancheAdresse.length > 20);
  assert.doesNotMatch(brancheAdresse, /merCentreKm|mer_centre_km/);
});

// ── Le grain commune ──────────────────────────────────────────────────────────────────────────────────

test("commune : le point de référence → rivage marin, la limite du lecteur appliquée telle quelle", () => {
  const cas: [string, string, Partial<NormalizedHardConstraints>, string][] = [
    ["22113", "Lannion", proche(5), "satisfied"],
    ["17094", "Châtelaillon-Plage", proche(2), "satisfied"],
    ["33063", "Bordeaux", proche(10), "incompatible"],
    ["14118", "Caen", proche(5), "incompatible"],
    ["14118", "Caen", proche(10), "satisfied"],
    ["13004", "Arles", proche(10), "incompatible"],
    ["11262", "Narbonne", proche(5), "satisfied"],
    ["56260", "Vannes", proche(5), "satisfied"],
    ["33063", "Bordeaux", loin(20), "satisfied"],
    ["14118", "Caen", loin(20), "incompatible"],
  ];
  for (const [insee, nom, over, attendu] of cas) {
    const f = faits(insee);
    const a = "nearSea" in over ? evaluateNearSea(ctx(over, f), toCommuneAttributes(f)) : evaluateFarFromSea(ctx(over, f), toCommuneAttributes(f));
    assert.equal(a.status, attendu, `${nom} ${JSON.stringify(over)}`);
    assert.ok("evidenceKeys" in a && a.evidenceKeys[0] === "commune.merCentreKm", nom);
  }
  const bdx = faits("33063");
  const b = evaluateNearSea(ctx(proche(10), bdx), toCommuneAttributes(bdx));
  assert.ok(b.status === "incompatible");
  assert.match(b.statement, /^Le point de référence de Bordeaux est à environ 39 km du rivage marin, plus loin que les 10 km au plus que vous avez indiqués\.$/);
});

test("excludeSea : le classement loi Littoral de la commune, sans aucun kilomètre", () => {
  const cas: [string, string][] = [
    ["74010", "satisfied"],   // Annecy : Lac
    ["17299", "satisfied"],   // Rochefort : Estuaire
    ["33063", "satisfied"],   // Bordeaux : non classée
    ["13004", "incompatible"], // Arles : Mer, centre pourtant à 13 km
    ["13207", "incompatible"], // Marseille 7e : Mer hérité de 13055
  ];
  for (const [insee, attendu] of cas) {
    const f = faits(insee);
    const a = evaluateExcludeSea(ctx({ excludeSea: true }, f), toCommuneAttributes(f));
    assert.equal(a.status, attendu, insee);
    if (a.status === "incompatible") {
      assert.equal(a.statement, `${f.nom} est classée « Mer » au titre de la loi Littoral.`);
      assert.doesNotMatch(a.statement, /km/);
    }
  }
  // À l'adresse, le statut reste celui de la commune.
  const arles = faits("13004");
  assert.equal(evaluateExcludeSea(ctx({ excludeSea: true }, arles, { lat: 43.67, lon: 4.63, mer: null }), toCommuneAttributes(arles)).status, "incompatible");
});

// ── Les faits du dossier ──────────────────────────────────────────────────────────────────────────────

function projet(hc: unknown, ...confirmees: ("nearSea" | "farFromSea" | "excludeSea")[]): UserProject {
  const p: UserProject = {
    posture: "recherche", intent: null, rawText: null, updatedAt: "1970-01-01T00:00:00.000Z",
    parsed: { reformulation: "x", hardConstraints: hc, preferences: [] } as UserProject["parsed"],
  };
  return { ...p, conditions: confirmees.map((key) => buildConfirmation(p, { kind: "hard", key }, "2026-10-02T00:00:00.000Z")!) };
}
const hardEval = (c: EvaluationContext, f: ModuleFacts): HardEvaluation =>
  ({ context: c, byKey: Object.fromEntries(assessHardConstraints(c, toCommuneAttributes(f)).map((a) => [a.key, a])) as HardEvaluation["byKey"] });
const regle = (key: string) => HARD_CONSTRAINT_RULES.find((r) => r.hardConstraint === key)!;

test("faits : la preuve d'une distance d'adresse est au grain adresse ; le classement loi Littoral reste communal", () => {
  const f = { ...faits("13004"), hasAddress: true };
  const salin = ref("Arles, Salin");
  const c = ctx({ ...proche(3), excludeSea: true }, f, { lat: salin.lat, lon: salin.lon, mer: mesure(salin.lat, salin.lon) });
  const h = hardEval(c, f);
  const p = projet({ nearSea: { active: true, maxKm: 3 }, excludeSea: true }, "nearSea", "excludeSea");
  const mer = regle("nearSea").evaluate(f, p, h).facts[0]!;
  assert.equal(mer.role, "condition_check");
  assert.match(mer.statement, /^Cette adresse est à environ 5,7 km du rivage marin\.$/);
  assert.ok(mer.evidence.every((e) => e.grain === "adresse"));
  assertFactValid(mer, p);
  const loi = regle("excludeSea").evaluate(f, p, h).facts[0]!;
  assert.equal(loi.statement, "Arles est classée « Mer » au titre de la loi Littoral.");
  assert.ok(loi.evidence.every((e) => e.grain === "commune"), "un statut de commune n'est jamais une preuve d'adresse");
  assert.match(loi.role === "condition_check" ? loi.whyNotDecided : "", /classées « Mer » au titre de la loi Littoral/);
  assert.doesNotMatch(loi.role === "condition_check" ? loi.whyNotDecided : "", /15 km|au moins/);
  assertFactValid(loi, p);
});

// ── Les invariants ────────────────────────────────────────────────────────────────────────────────────

const fichiersProduit = () => {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(n) && !/\.test\.ts$/.test(n)) out.push(p);
    }
  };
  walk(fileURLToPath(new URL("src", racine)));
  return out;
};

test("INVARIANT : plus aucune convention « au moins 15 km » pour excludeSea, ni distance à une liste de villes au dossier", () => {
  assert.equal("excludeSeaMinKm" in PRODUCT_CONVENTIONS, false);
  for (const f of fichiersProduit()) {
    const s = readFileSync(f, "utf8");
    assert.doesNotMatch(s, /excludeSeaMinKm/, f);
    if (f.includes("/lib/decision/") || f.endsWith("/hard-constraints.ts")) {
      assert.doesNotMatch(s, /distanceCoteKm|distance_cote_km|au moins 15 km de la côte|localités côtières/, f);
    }
  }
});

test("INVARIANT : aucune capacité FUT-7 ne change (table complète des critères mer, aux deux grains)", () => {
  const attendu: [Parameters<typeof criterionCapability>[0], string, string][] = [
    [{ kind: "hard", key: "nearSea", hc: { nearSea: { active: true, maxKm: 5 } } }, "apprecier", "point_de_reference"],
    [{ kind: "hard", key: "nearSea", hc: { nearSea: { active: true } } }, "apprecier", "sans_seuil"],
    [{ kind: "hard", key: "farFromSea", hc: { farFromSea: { active: true, minKm: 20 } } }, "apprecier", "point_de_reference"],
    [{ kind: "hard", key: "excludeSea", hc: { excludeSea: true } }, "apprecier", "convention_produit"],
    [{ kind: "preference", key: "proximite_mer" }, "apprecier", "position_relative"],
    [{ kind: "preference", key: "eloignement_mer" }, "ne_pas_mesurer", "aucune_regle"],
  ];
  for (const [crit, capacite, raison] of attendu) {
    for (const grain of ["commune", "adresse"] as const) {
      const c = criterionCapability(crit, grain);
      assert.deepEqual([c.capability, c.reason], [capacite, raison], `${crit.key} ${grain}`);
    }
  }
});

// (L'invariant « libellés de l'étape D intacts » de la phase C a été remplacé, une fois l'étape D faite, par
// src/lib/fut33-editorial-2b2d.test.ts.)

test("INVARIANT : le calcul à l'adresse n'écrit rien nulle part (aucune base, aucun réseau)", () => {
  for (const f of ["src/lib/mer-rivage.ts", "src/lib/server/rivage-mer.ts"]) {
    const s = readFileSync(new URL(f, racine), "utf8");
    assert.doesNotMatch(s, /supabase|fetch\(|writeFile|https?:\/\//i, f);
  }
});

test("performance : l'index du rivage se construit en moins d'une seconde", () => {
  assert.ok(initMs < 1000, `${Math.round(initMs)} ms`);
  assert.equal(segments.length / 4, 410002);
});
