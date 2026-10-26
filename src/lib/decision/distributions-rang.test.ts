// FUT-136 · LA PROVENANCE D'UNE POSITION : deux classements différents ne portent jamais la même identité.
//
// Le défaut (revue indépendante de la PR #92) : après le recalcul des rangs, Valserhône passait sur les services d'une
// preuve défavorable à une preuve favorable, et les deux preuves structurées portaient la même identité de distribution
// (`mismatch-dist-2026-07-15`) et le même moteur (`engine-7`). Rien, dans un artefact vendu, ne permettait de dire de
// quelles données venait la position.
//
// Ces tests relient l'identité aux bandes RÉELLEMENT publiées (empreinte recalculée sur l'index versionné), puis
// vérifient les preuves que produisent les vraies règles et que l'artefact conserve, pas une fonction isolée.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { distributionVersionDe, DISTRIBUTIONS_PUBLIEES } from "./distributions-rang.ts";
import { MISMATCH_DISTRIBUTION_VERSION } from "./mismatch-facts.ts";
import { MISMATCH_RULES, MISMATCH_KEYS, mismatchRuleId } from "./mismatch-rules.ts";
import { ALIGNMENT_RULES, alignmentRuleId } from "./alignment-rules.ts";
import { MISMATCH_RANK_KEYS } from "../comparateur-scores.ts";
import { mapCommuneToModuleFacts } from "./module-facts-map.ts";
import { runRules } from "./materiality-rules.ts";
import { assembleDossier } from "./decision-assembler.ts";
import { composeFacts } from "./fact-compositions.ts";
import { buildDecisionArtifact, parseDecisionArtifact, ENGINE_VERSION } from "./decision-artifact.ts";
import { hydrateHardConstraints } from "../hard-constraints-hydrate.ts";
import { PRODUCT_CONVENTIONS_VERSION, type EvaluationContext } from "../hard-constraints.ts";
import { normalizeUserProject, type UserProject } from "../user-project.ts";
import type { IndexCommune, PreferenceKey } from "../comparateur-vie.ts";
import type { Dossier, ModuleFacts, RunResult } from "./decision-fact.ts";

type Commune = IndexCommune & { rankBands?: Record<string, [number, number]> };
const communes: Commune[] = JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8")).communes;
const parInsee = new Map(communes.map((c) => [c.insee, c]));

const RECALCULEES: PreferenceKey[] = ["acces_services", "acces_ecoles", "acces_culture"];
const HISTORIQUES = MISMATCH_RANK_KEYS.filter((k) => !RECALCULEES.includes(k));

// L'empreinte d'une distribution publiée : les lignes `insee \t bas \t haut` des communes classées, triées.
function empreinte(key: string, cs: Commune[]): { empreinte: string; communes: number } {
  const lignes = cs.filter((c) => c.rankBands?.[key]).map((c) => `${c.insee}\t${c.rankBands![key]![0]}\t${c.rankBands![key]![1]}\n`).sort();
  return { empreinte: createHash("sha256").update(lignes.join("")).digest("hex"), communes: lignes.length };
}

// ── 1. L'IDENTITÉ EST CELLE DES BANDES PUBLIÉES ──────────────────────────────────────────────────

test("chaque critère classé publie exactement la distribution que désigne son identité en vigueur", () => {
  const ecarts: string[] = [];
  for (const k of MISMATCH_RANK_KEYS) {
    const identite = distributionVersionDe(k);
    const attendue = (DISTRIBUTIONS_PUBLIEES[k] ?? []).find((d) => d.identite === identite);
    const reelle = empreinte(k, communes);
    if (!attendue) { ecarts.push(`${k} : l'identité ${identite} n'est pas au registre`); continue; }
    if (attendue.empreinte !== reelle.empreinte || attendue.communes !== reelle.communes) {
      ecarts.push(`${k} : ${identite} désigne ${attendue.empreinte.slice(0, 12)} (${attendue.communes}), l'index publie ${reelle.empreinte.slice(0, 12)} (${reelle.communes})`);
    }
  }
  // Un rang recalculé sans identité nouvelle échoue ici : son empreinte n'est plus celle de l'identité en vigueur.
  assert.deepEqual(ecarts, [], `\n${ecarts.join("\n")}\nUn rang recalculé exige une identité nouvelle (distributions-rang.ts) et une ligne de registre.`);
});

test("registre : par critère, une identité désigne une seule distribution, et une distribution une seule identité", () => {
  assert.deepEqual(Object.keys(DISTRIBUTIONS_PUBLIEES).sort(), [...MISMATCH_RANK_KEYS].sort());
  for (const [k, lignes] of Object.entries(DISTRIBUTIONS_PUBLIEES)) {
    const ids = lignes.map((l) => l.identite), fps = lignes.map((l) => l.empreinte);
    assert.equal(new Set(ids).size, ids.length, `${k} : une identité réutilisée pour une autre distribution`);
    assert.equal(new Set(fps).size, fps.length, `${k} : une distribution enregistrée sous deux identités`);
    for (const l of lignes) {
      assert.match(l.empreinte, /^[0-9a-f]{64}$/, `${k} ${l.identite}`);
      assert.ok(l.note.trim().length > 0, `${k} ${l.identite} : note vide`);
    }
  }
});

test("les trois critères recalculés ont chacun une identité propre ; les dix autres gardent l'identité historique", () => {
  for (const k of HISTORIQUES) assert.equal(distributionVersionDe(k), MISMATCH_DISTRIBUTION_VERSION, k);
  assert.equal(MISMATCH_DISTRIBUTION_VERSION, "mismatch-dist-2026-07-15");
  const nouvelles = RECALCULEES.map(distributionVersionDe);
  assert.deepEqual(nouvelles, [
    "mismatch-dist-2026-10-26-acces_services", "mismatch-dist-2026-10-26-acces_ecoles", "mismatch-dist-2026-10-26-acces_culture",
  ]);
  // Une identité nouvelle n'est portée que par son critère (aucune clé non concernée ne la reçoit).
  for (const k of MISMATCH_RANK_KEYS) {
    for (const [i, id] of nouvelles.entries()) if (k !== RECALCULEES[i]) assert.notEqual(distributionVersionDe(k), id, `${k} porte ${id}`);
  }
  // L'identité historique désignait, pour ces trois critères, les bandes périmées : elle reste au registre pour
  // les dossiers vendus avant FUT-136, et ne désigne plus la distribution publiée.
  for (const k of RECALCULEES) {
    const ancienne = DISTRIBUTIONS_PUBLIEES[k]!.find((d) => d.identite === MISMATCH_DISTRIBUTION_VERSION);
    assert.ok(ancienne, k);
    assert.notEqual(ancienne.empreinte, empreinte(k, communes).empreinte, k);
  }
});

// ── 2. LES RÈGLES : LA MÊME IDENTITÉ, FAVORABLE OU DÉFAVORABLE ────────────────────────────────────

const projet = (prefs: Partial<Record<PreferenceKey, number>>): UserProject => normalizeUserProject({
  posture: "recherche", intent: null, rawText: "…", updatedAt: "2026-10-26T00:00:00.000Z",
  parsed: { reformulation: "x", hardConstraints: {}, preferences: Object.entries(prefs).map(([key, weight]) => ({ key, weight })) },
})!;
const faits = (entry: Commune): ModuleFacts =>
  mapCommuneToModuleFacts(entry, {}, { hasAddress: false, tailleVille: entry.population ?? null, tailleVilleSource: "commune" });

test("pour chacun des treize critères, la règle défavorable et la favorable posent l'identité du critère", () => {
  assert.deepEqual([...MISMATCH_KEYS].sort(), [...MISMATCH_RANK_KEYS].sort());
  for (const k of MISMATCH_KEYS) {
    const p = projet({ [k]: 3 });
    const base = { insee: "00000", nom: "Témoin", dept: "00", population: 1000 } as unknown as Commune;
    const bas = MISMATCH_RULES.find((r) => r.id === mismatchRuleId(k))!.evaluate(faits({ ...base, rankBands: { [k]: [0, 1000] } }), p);
    const haut = ALIGNMENT_RULES.find((r) => r.id === alignmentRuleId(k))!.evaluate(faits({ ...base, rankBands: { [k]: [9000, 10000] } }), p);
    assert.equal(bas.outcome, "mismatch", k);
    assert.equal(haut.outcome, "satisfied", k);
    const [fb, fh] = [bas.facts[0]!, haut.facts[0]!] as { basis: { kind: string; distributionVersion: string } }[];
    assert.equal(fb!.basis.distributionVersion, distributionVersionDe(k), `${k} mismatch`);
    assert.equal(fh!.basis.distributionVersion, distributionVersionDe(k), `${k} alignment`);
    assert.equal(fb!.basis.distributionVersion, fh!.basis.distributionVersion, k);
  }
});

// ── 3. LES VRAIS DOSSIERS, SUR L'INDEX PUBLIÉ ─────────────────────────────────────────────────────

// LE MÊME ENCHAÎNEMENT que dossierDepuisFaits, sans I/O (contraintes dures vides, pas d'adresse).
function evaluer(insee: string, p: UserProject): { run: RunResult; d: Dossier } {
  const mf = faits(parInsee.get(insee)!);
  const ctx: EvaluationContext = {
    constraints: hydrateHardConstraints({}, { byName: () => null, plmByName: () => null }),
    point: { lat: mf.lat!, lon: mf.lon!, grain: "commune_reference", source: "commune_centroid", label: mf.nom },
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };
  const run = runRules(mf, p, ctx);
  return { run, d: assembleDossier(run, p, "commune", mf.nom, composeFacts(run, mf, p), null) };
}
const dossier = (insee: string, p: UserProject): Dossier => evaluer(insee, p).d;
type Position = { key: string; role: string; low: number; high: number; dist: string };
const position = (fact: unknown): Position[] => {
  const f = fact as { projectKey?: string; role: string; basis?: { kind: string; rankLow: number; rankHigh: number; distributionVersion: string } };
  return f.basis?.kind === "relative_position" ? [{ key: f.projectKey!, role: f.role, low: f.basis.rankLow, high: f.basis.rankHigh, dist: f.basis.distributionVersion }] : [];
};
// Les positions AFFICHÉES (cartes du dossier) et les positions PRODUITES par les règles (avant tri d'affichage).
const positions = (d: Dossier): Position[] => d.sections.flatMap((s) => s.cards.flatMap((c) => (c.kind === "fact" ? position(c.fact) : [])));
const produites = (run: RunResult): Position[] => run.evaluations.flatMap((e) => e.facts.flatMap(position));

test("Valserhône, services : position favorable, sous l'identité de la distribution recalculée", () => {
  const [pos] = positions(dossier("01033", projet({ acces_services: 3 })));
  assert.deepEqual(pos, { key: "acces_services", role: "alignment", low: 0.9734, high: 0.9947, dist: "mismatch-dist-2026-10-26-acces_services" });
});

test("Sergy (01401), écoles : rang corrigé, neutre, donc aucune position affirmée ; Sergy (02712), culture : défavorable, nouvelle identité", () => {
  assert.deepEqual(parInsee.get("01401")!.rankBands!.acces_ecoles, [2450, 2550]);
  const p = projet({ acces_ecoles: 3 });
  const ev = MISMATCH_RULES.find((r) => r.id === mismatchRuleId("acces_ecoles"))!.evaluate(faits(parInsee.get("01401")!), p);
  assert.equal(ev.outcome, "neutral");
  assert.deepEqual(positions(dossier("01401", p)), []);
  // Le cas défavorable réel, sur un critère recalculé : la culture de l'homonyme de l'Aisne.
  const [pos] = positions(dossier("02712", projet({ acces_culture: 3 })));
  assert.deepEqual(pos, { key: "acces_culture", role: "mismatch", low: 0.055, high: 0.065, dist: "mismatch-dist-2026-10-26-acces_culture" });
});

test("Marseille 7e, culture : favorable, nouvelle identité ; un dossier mêlant critères recalculés et non recalculés", () => {
  const [culture] = positions(dossier("13207", projet({ acces_culture: 3 })));
  assert.deepEqual(culture, { key: "acces_culture", role: "alignment", low: 0.805, high: 0.815, dist: "mismatch-dist-2026-10-26-acces_culture" });
  // Plusieurs priorités : trois recalculées (favorables), deux non recalculées (soins favorable, démographie défavorable).
  const { run, d } = evaluer("13207", projet({ acces_culture: 3, acces_services: 3, acces_ecoles: 3, acces_soins: 3, croissance_demographique: 3 }));
  assert.deepEqual(produites(run).map((x) => `${x.key}:${x.role}:${x.dist}`).sort(), [
    "acces_culture:alignment:mismatch-dist-2026-10-26-acces_culture",
    "acces_ecoles:alignment:mismatch-dist-2026-10-26-acces_ecoles",
    "acces_services:alignment:mismatch-dist-2026-10-26-acces_services",
    "acces_soins:alignment:mismatch-dist-2026-07-15",
    "croissance_demographique:mismatch:mismatch-dist-2026-07-15",
  ]);
  // Le dossier n'affiche qu'une partie des positions favorables (tri d'affichage, inchangé) : chacune de celles qu'il
  // affiche porte l'identité de son critère, jamais celle d'un autre.
  const affichees = positions(d);
  assert.ok(affichees.length >= 3);
  for (const x of affichees) assert.equal(x.dist, distributionVersionDe(x.key as PreferenceKey), x.key);
});

// ── 4. LES ARTEFACTS : L'ANCIEN GARDE SON IDENTITÉ, LE NOUVEAU PORTE LA SIENNE ──────────────────────

test("un artefact vendu avant FUT-136 se relit à l'identique, avec son ancienne identité", () => {
  const brut = JSON.parse(readFileSync("src/lib/__fixtures__/fut136-artefact-valserhone-avant.json", "utf8")).artefact;
  const lu = parseDecisionArtifact(brut);
  assert.ok(lu);
  assert.equal(lu.engineVersion, "engine-7");
  assert.deepEqual(lu.dossier, brut.dossier); // rien n'est réécrit à la lecture
  assert.deepEqual(positions(lu.dossier).find((x) => x.key === "acces_services"),
    { key: "acces_services", role: "mismatch", low: 0.1745, high: 0.1844, dist: "mismatch-dist-2026-07-15" });
  // Les artefacts historiques plus anciens (FUT-17, engine-5) gardent eux aussi la leur.
  const fut17 = JSON.parse(readFileSync("src/lib/__fixtures__/fut17-artefacts-avant.json", "utf8"));
  for (const nom of ["commune-compromis", "adresse-compromis"]) {
    const a = parseDecisionArtifact(fut17[nom].artefact)!;
    assert.ok(positions(a.dossier).length > 0, nom);
    for (const x of positions(a.dossier)) assert.equal(x.dist, "mismatch-dist-2026-07-15", nom);
  }
});

test("un artefact produit sur l'index corrigé porte la nouvelle identité, et l'ancien et le nouveau se distinguent", () => {
  const p = projet({ acces_services: 3, acces_soins: 3 });
  const neuf = parseDecisionArtifact(JSON.parse(JSON.stringify(
    buildDecisionArtifact(dossier("01033", p), p, "2026-10-26T13:00:00.000Z", PRODUCT_CONVENTIONS_VERSION),
  )));
  assert.ok(neuf);
  assert.equal(neuf.engineVersion, ENGINE_VERSION);
  const nouvelle = positions(neuf.dossier).find((x) => x.key === "acces_services")!;
  const ancienne = positions(JSON.parse(readFileSync("src/lib/__fixtures__/fut136-artefact-valserhone-avant.json", "utf8")).artefact.dossier)
    .find((x: Position) => x.key === "acces_services")!;
  assert.equal(nouvelle.dist, "mismatch-dist-2026-10-26-acces_services");
  // Même moteur, verdicts opposés : c'est l'identité de distribution qui dit de quelles données vient chacun.
  assert.notEqual(nouvelle.role, ancienne.role);
  assert.notEqual(nouvelle.dist, ancienne.dist);
  // Et chacune désigne au registre la distribution qui l'a produite.
  const reg = DISTRIBUTIONS_PUBLIEES.acces_services!;
  assert.equal(reg.find((d) => d.identite === ancienne.dist)!.empreinte, "61490bd1fe267a94e60ba2e81c2c1c16a7b0c0149b8bad053bc84ff6282ac592");
  assert.equal(reg.find((d) => d.identite === nouvelle.dist)!.empreinte, empreinte("acces_services", communes).empreinte);
});
