// FUT-12 · LA PROVENANCE FAIT PARTIE DE LA PREUVE.
//
// Ce fichier vérifie ce que la preuve RACONTE, pas seulement qu'elle existe : la période mesurée ne se
// confond jamais avec la consultation ou le chargement, une estimation ne se lit pas comme une mesure,
// un repli se dit, une version inconnue reste inconnue, une preuve historique se lit comme avant, et
// les empreintes ne bougent pas pour une métadonnée purement technique.
import test from "node:test";
import assert from "node:assert/strict";
import {
  provenance, fraicheurEnClair, sourceEnClair, ligneDeProvenance, sansChampsVolatils, dateEnClair,
} from "../facts/provenance.ts";
import { hashableContent, type FactsSnapshot, type Fact } from "../facts/contract.ts";
import { snapshotHash as hashSnapshot } from "../facts/hash.ts";
import { runRules } from "./materiality-rules.ts";
import { assembleDossier } from "./decision-assembler.ts";
import { mapCommuneToModuleFacts } from "./module-facts-map.ts";
import { deriveLogementCoverage } from "./logement-coverage.ts";
import { buildLogementFacts } from "./logement-facts.ts";
import { provenanceArgiles, provenanceIrisLogement, RGA_CARTE } from "./provenances.ts";
import { lignesDeSource } from "./provenance-preuve.ts";
import { lireCarteDuDossier } from "../../components/releve/lecture-dossier.ts";
import { margeDe } from "../../components/releve/marge.ts";
import type { DecisionFact, DossierCard, EvidenceRef, LogementFacts, ModuleFacts } from "./decision-fact.ts";
import type { IndexCommune } from "../comparateur-vie.ts";
import type { UserProject } from "../user-project.ts";
import { PRODUCT_CONVENTIONS_VERSION, type EvaluationContext } from "../hard-constraints.ts";
import { hydrateHardConstraints } from "../hard-constraints-hydrate.ts";
import { textePrix, type LecturePrix } from "../prix-immobiliers.ts";

// ── Fixtures ─────────────────────────────────────────────────────────────────────────────────

const CONSULTE = "2026-11-04T09:12:00.000Z";

function lf(over: Partial<LogementFacts> = {}): LogementFacts {
  return {
    dpe: "correct", dpeLabel: null, rga: "none", expositionBati: false, pprn: "none", zoneReglementee: false, pprnLabel: null,
    cavites: "none", caviteProche: false, patrimoine: "none", perimetrePatrimonial: false, sinistralite: "none",
    sinistraliteActive: false, confortEteInsuffisant: false, addressLabel: "1 rue du Test", ...over,
  };
}
function entry(): IndexCommune {
  return { insee: "17300", nom: "La Rochelle", dept: "17", region: "Nouvelle-Aquitaine", lat: 46.16, lon: -1.15, population: 75000, densite: 2900, mer_centre_km: 1, altitude: 10, clim: {}, pct: {} } as IndexCommune;
}
function project(): UserProject {
  return { posture: "recherche", intent: "achat", rawText: null, parsed: { reformulation: "x", hardConstraints: {}, preferences: [] } as UserProject["parsed"], updatedAt: "1970-01-01T00:00:00.000Z" };
}
function context(f: { lat: number; lon: number; nom: string }): EvaluationContext {
  return {
    constraints: hydrateHardConstraints({}, { byName: () => null, plmByName: () => null }),
    point: { lat: f.lat, lon: f.lon, grain: "address", source: "address_geocoder", label: f.nom },
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };
}
function dossierAvec(logement: LogementFacts) {
  const e = entry();
  const base = mapCommuneToModuleFacts(e, {}, { hasAddress: true, tailleVille: e.population ?? null, tailleVilleSource: "commune" });
  const mf: ModuleFacts = { ...base, hasAddress: true, logement };
  return assembleDossier(runRules(mf, project(), context(mf)), project(), "commune+adresse", e.nom);
}
const faitsDe = (cards: DossierCard[]) => cards.flatMap((c) => (c.kind === "fact" ? [c.fact] : []));
function fait(d: ReturnType<typeof dossierAvec>, ruleId: string): DecisionFact {
  const f = [...d.sections.flatMap((s) => faitsDe(s.cards)), ...d.absorbedFacts].find((x) => x.ruleId === ruleId);
  assert.ok(f, `aucun fait ${ruleId}`);
  return f!;
}
const refs = (f: DecisionFact): EvidenceRef[] => (f.role === "compromise" ? f.sides.flatMap((s) => s.evidence) : f.evidence);

// ── 1. Preuve réglementaire avec version ─────────────────────────────────────────────────────

test("1 · RGA lu après le constat : la carte 2026 est nommée, et la ligne de source le dit", () => {
  const d = dossierAvec(lf({ rga: "present", expositionBati: true, consultations: { rga: CONSULTE } }));
  const e = refs(fait(d, "logement.exposition-bati"))[0]!;
  assert.equal(e.provenance?.producer, "BRGM");
  assert.equal(e.provenance?.distributor, "Géorisques");
  assert.equal(e.provenance?.version, RGA_CARTE.version);
  assert.equal(e.provenance?.nature, "reglementaire");
  assert.deepEqual(lignesDeSource([e]), [
    "Source : BRGM · Carte d'exposition au retrait-gonflement des argiles, via Géorisques. Carte d'exposition 2026 · Source consultée le 4 novembre 2026",
  ]);
  // Une carte d'exposition n'est ni une étude de sol ni une prévision de dommage : la limite voyage avec la source.
  assert.match(e.provenance?.limits ?? "", /ni une étude du sol de la parcelle, ni une prévision de dommage/);
});

test("1 bis · Plan de prévention : la date d'approbation du DOCUMENT arrive à l'interface, sans le dire périmé", () => {
  const d = dossierAvec(lf({ pprn: "present", zoneReglementee: true, pprnLabel: "PPR La Rochelle", pprnApprouveLe: "2019-02-26", consultations: { pprn: CONSULTE } }));
  const [ligne] = lignesDeSource(refs(fait(d, "logement.zone-reglementee")));
  assert.equal(ligne, "Source : Ministère de la Transition écologique · Base GASPAR, plans de prévention des risques, via Géorisques. Plan approuvé le 26 février 2019 · Source consultée le 4 novembre 2026");
  assert.doesNotMatch(ligne!, /ancien|obsolète|périmé|observées/i);
});

// ── 2 & 3. Période d'observation, et donnée chargée récemment mais mesurée avant ─────────────

test("2/3 · Recensement 2022 chargé en juillet 2026 : la période dit 2022, le chargement dit 2026, rien ne les mêle", () => {
  const p = provenanceIrisLogement({ annee: 2022, chargeLe: "2026-07-28" });
  assert.equal(sourceEnClair(p), "Insee · Recensement de la population 2022, base IRIS logement");
  assert.equal(fraicheurEnClair(p), "Estimation sur des données de 2022 · Chargées dans futur•e en juillet 2026");
  // La seule mention de 2026 est celle du chargement.
  assert.equal((fraicheurEnClair(p)!.match(/2026/g) ?? []).length, 1);
});

test("3 bis · Une consultation récente ne fabrique jamais une période", () => {
  const p = provenance({ producer: "Météo-France", dataset: "Un jeu sans millésime connu", consultedAt: "2026-11-04T10:00:00Z" });
  assert.equal(fraicheurEnClair(p), "Source consultée le 4 novembre 2026");
  assert.doesNotMatch(fraicheurEnClair(p)!, /observées|Données (de|du|observées)/);
  const q = provenance({ dataset: "Artefact", loadedAt: "2026-10-01" });
  assert.equal(fraicheurEnClair(q), "Chargées dans futur•e en octobre 2026");
});

test("2 bis · BPE et permis du moteur : millésime de la donnée, consultation du registre, chacun à sa place", async () => {
  const { provenanceBpe, provenancePermis } = await import("./provenances.ts");
  assert.equal(fraicheurEnClair(provenanceBpe("2024")), "Données observées en 2024");
  assert.equal(fraicheurEnClair(provenanceBpe(null)), null, "millésime absent : rien n'est dit");
  assert.equal(fraicheurEnClair(provenancePermis("2026-08-01T00:00:00.000Z")), "Source consultée le 1er août 2026");
});

// ── 4 & 5. Repli géographique, estimation ────────────────────────────────────────────────────

function lecturePrix(over: Partial<LecturePrix["logement"] & object> = {}): LecturePrix {
  return {
    code: "17999", nom: "Petit-Bourg",
    logement: {
      achat: { dispo: true, maison: { eur_m2: 2100, maille: "EPCI", ventes: 320 }, appart: null },
      location: { niveau: "moyen", appart_eur_m2: 11.2, maison_eur_m2: null, fiabilite: "estimee" },
      ...over,
    },
    meta: {
      achat: { periode: { debut: "2022-01-01", fin: "2025-12-31" }, livraison: "livraison DGFiP d'octobre 2026, version géolocalisée Etalab du 20/10/2026", source: "DVF (Demandes de valeurs foncières), DGFiP ; version géolocalisée Etalab" },
      location: { source: "Carte des loyers 2025 (ANIL, DGALN), indicateurs de loyers d'annonce par commune", attribution: "Estimations ANIL" },
    },
  };
}

test("4 · Prix de repli intercommunal : la provenance dit la maille réellement utilisée, et la période des ventes", () => {
  const t = textePrix(lecturePrix());
  const achat = t.provenances.find((x) => x.cle === "achat")!.provenance;
  assert.equal(achat.fallback?.grain, "l'intercommunalité");
  assert.equal(achat.period, "2022-2025");
  assert.equal(achat.nature, "derive");
  const f = fraicheurEnClair(achat)!;
  assert.match(f, /^Calculé sur des données de 2022 à 2025/);
  assert.match(f, /Valeur établie à l'échelle de l'intercommunalité/);
  // L'édition de l'index n'est jamais l'année des ventes : elle est recopiée telle quelle, à sa place.
  assert.match(f, /Livraison DGFiP d'octobre 2026, version géolocalisée Etalab du 20\/10\/2026/);
  assert.doesNotMatch(f, /observées en 2026|données de 2026/);
});

test("4 bis · Prix communal : aucun repli n'est annoncé", () => {
  const t = textePrix(lecturePrix({ achat: { dispo: true, maison: { eur_m2: 2400, maille: "commune", ventes: 120 }, appart: null } }));
  assert.equal(t.provenances.find((x) => x.cle === "achat")!.provenance.fallback, undefined);
});

test("5 · Un loyer est une estimation d'annonce : jamais « observé », et le repli depuis les voisines se dit", () => {
  const t = textePrix(lecturePrix());
  const loyer = t.provenances.find((x) => x.cle === "location")!.provenance;
  assert.equal(loyer.nature, "estimation");
  const f = fraicheurEnClair(loyer)!;
  assert.match(f, /^Estimation/);
  assert.doesNotMatch(f, /observ/i);
  assert.match(f, /communes voisines/);
  const communal = textePrix(lecturePrix({ location: { niveau: "moyen", appart_eur_m2: 11.2, maison_eur_m2: null, fiabilite: "observee" } }));
  assert.equal(communal.provenances.find((x) => x.cle === "location")!.provenance.fallback, undefined);
});

// ── 6 & 7. Consultation réelle, inconnu qui reste inconnu ────────────────────────────────────

test("6 · La date de consultation est celle du résumé qui a FOURNI la valeur, pas du rendu", () => {
  const cov = deriveLogementCoverage({
    georisquesAddress: { regulatoryPlans: [], rga: { label: "Exposition moyenne" }, consultedAt: "2026-11-03T22:00:00.000Z" },
    georisquesParcel: { regulatoryPlans: [], rga: { label: "Exposition forte" }, consultedAt: "2026-11-04T08:00:00.000Z" },
    cavites: [], heritage: { items: [], sourceStatus: "ok", consultedAt: "2026-11-04T08:00:01.000Z" }, sinistralite: null,
  });
  assert.equal(cov.consultations?.rga, "2026-11-04T08:00:00.000Z");
  assert.equal(cov.consultations?.patrimoine, "2026-11-04T08:00:01.000Z");
  const l = buildLogementFacts({ ...cov, fetchedAt: "2026-11-06T00:00:00.000Z" }, null);
  assert.equal(l.consultations?.rga, "2026-11-04T08:00:00.000Z", "fetchedAt (l'assemblage) ne remplace pas la lecture");
  // 23 h UTC le 3 novembre, c'est le 4 novembre pour le lecteur.
  assert.equal(dateEnClair("2026-11-03T23:30:00.000Z"), "le 4 novembre 2026");
});

test("7 · Version inconnue : une lecture non datée (ou antérieure au constat) ne reçoit pas la carte 2026", () => {
  assert.equal(provenanceArgiles(undefined).version, undefined);
  assert.equal(provenanceArgiles("2026-09-15T10:00:00.000Z").version, undefined);
  assert.equal(provenanceArgiles("2026-11-04T00:00:00.000Z").version, RGA_CARTE.version);
  // Cavités : cache de 24 h, aucune date de consultation n'est prétendue.
  const d = dossierAvec(lf({ cavites: "present", caviteProche: true }));
  const e = refs(fait(d, "logement.cavite"))[0]!;
  assert.equal(e.provenance?.consultedAt, undefined);
  assert.doesNotMatch(lignesDeSource([e])[0]!, /consultée/);
});

test("7 bis · Source muette : la provenance reste, sans consultation ; une panne n'est jamais une absence", () => {
  const d = dossierAvec(lf({ rga: "unavailable", consultations: { rga: CONSULTE } }));
  const f = fait(d, "logement.exposition-bati");
  assert.equal(f.role, "unknown");
  assert.equal(refs(f)[0]!.provenance?.consultedAt, undefined);
  assert.doesNotMatch(lignesDeSource(refs(f)).join(" "), /consultée/);
});

// ── 8. Preuves historiques ───────────────────────────────────────────────────────────────────

test("8 · Une preuve figée avant FUT-12 se lit exactement comme avant", () => {
  const historique: EvidenceRef[] = [
    { factId: "logement.exposition-bati", module: "logement", label: "BRGM, via Géorisques", grain: "adresse", href: "/rapport/logement", sourceMode: "live_fetch" },
    { factId: "logement.dpe", module: "logement", label: "Base DPE (ADEME)", observedValue: "DPE G", grain: "adresse", sourceMode: "persisted_snapshot" },
  ];
  assert.deepEqual(lignesDeSource(historique), ["Source : BRGM, via Géorisques"]);
  const marge = margeDe({ grains: ["adresse"], preuves: [{ libelle: "Base DPE (ADEME)", valeur: "DPE G", grain: "adresse" }], sources: [{ libelle: "Permis", grain: "adresse", date: "2026-08-01T00:00:00.000Z" }] });
  assert.deepEqual(marge.slice(1).map((m) => ("texte" in m ? m.texte : m.valeur)), ["DPE G", "Source : Permis"]);
  assert.equal((marge[2] as { date?: string }).date, "observée le 1er août 2026");
});

// ── 9. Propagation jusqu'à la lecture du dossier et au relevé ────────────────────────────────

test("9 · La provenance traverse la lecture du dossier et arrive dans la marge du relevé", () => {
  const d = dossierAvec(lf({ rga: "present", expositionBati: true, consultations: { rga: CONSULTE }, dpe: "passoire", dpeLabel: "G", dpeDate: "2023-03-12" }));
  const cartes = d.sections.flatMap((s) => s.cards);
  const lues = cartes.map((c) => lireCarteDuDossier(d, c));
  const argile = lues.find((e) => e.sources.concat(e.preuves).some((p) => p.provenance?.producer === "BRGM"));
  assert.ok(argile, "la carte argiles a perdu sa provenance dans la lecture");
  const elements = margeDe(argile!);
  const source = elements.find((m) => m.type === "source");
  assert.equal(source && "texte" in source ? source.texte : null, "Source : BRGM · Carte d'exposition au retrait-gonflement des argiles, via Géorisques");
  assert.equal((source as { date?: string }).date, "Carte d'exposition 2026 · Source consultée le 4 novembre 2026");
  // Le DPE : la valeur garde sa pastille, et sa source dit le jour du diagnostic (sa période), pas une consultation.
  const dpe = lues.find((e) => e.preuves.some((p) => p.valeur === "DPE G"))!;
  const m = margeDe(dpe);
  const i = m.findIndex((x) => x.type === "valeur" && x.valeur === "DPE G");
  assert.equal((m[i + 1] as { texte?: string }).texte, "Source : ADEME · Base des diagnostics de performance énergétique");
  assert.equal((m[i + 1] as { date?: string }).date, "Données du 12 mars 2023");
});

test("9 bis · Aucune preuve Logement émise ne perd sa provenance avant l'affichage", () => {
  const d = dossierAvec(lf({
    rga: "present", expositionBati: true, pprn: "present", zoneReglementee: true, cavites: "present", caviteProche: true,
    patrimoine: "present", perimetrePatrimonial: true, sinistralite: "present", sinistraliteActive: true, dpe: "passoire", dpeLabel: "F",
    consultations: { rga: CONSULTE, pprn: CONSULTE, patrimoine: CONSULTE },
  }));
  const tous = [...d.sections.flatMap((s) => s.cards).flatMap((c) => (c.kind === "fact" ? [c.fact] : [])), ...d.absorbedFacts]
    .filter((f) => f.ruleId.startsWith("logement."));
  assert.ok(tous.length >= 6, `seulement ${tous.length} faits logement`);
  for (const f of tous) for (const e of refs(f)) assert.ok(e.provenance && sourceEnClair(e.provenance), `${f.ruleId} sans provenance`);
});

// ── 10. Empreintes ───────────────────────────────────────────────────────────────────────────

function snap(facts: Fact[]): FactsSnapshot {
  return { scope: { kind: "commune", id: "17300" }, registryVersion: "test@1", builtAt: "2026-11-04T00:00:00Z", facts, derived: [] };
}
const fait0 = (over: Partial<Fact> = {}): Fact => ({
  key: "housing.secondary_share", value: 12, unit: "%", scale: "commune",
  source: { producer: "INSEE", dataset: "Base communale logement 2022", field: "x" }, vintage: "2022", observedAt: null,
  status: "ok", card: { card: "c" }, synthesis: { include: true }, ...over,
});

test("10 · Empreinte Territoire : la provenance (technique pour la synthèse) ne bouge rien ; le millésime, si", () => {
  const avant = hashSnapshot(snap([fait0()]));
  const avec = hashSnapshot(snap([fait0({ provenance: provenance({ producer: "Insee", dataset: "Recensement 2022", period: "2022", loadedAt: "2026-07-28" }) })]));
  assert.equal(avec, avant, "ajouter la provenance a changé l'empreinte : toutes les synthèses seraient régénérées");
  assert.notEqual(hashSnapshot(snap([fait0({ vintage: "2023" })])), avant, "un changement de millésime doit changer l'empreinte");
  assert.equal(JSON.stringify(hashableContent(snap([fait0({ provenance: { period: "2022" } })]))).includes("provenance"), false);
});

test("10 bis · Dossier : une nouvelle consultation ne change ni le plan narratif ni ses textes", () => {
  const a = dossierAvec(lf({ rga: "present", expositionBati: true, consultations: { rga: "2026-11-04T08:00:00.000Z" } }));
  const b = dossierAvec(lf({ rga: "present", expositionBati: true, consultations: { rga: "2026-12-24T08:00:00.000Z" } }));
  assert.deepEqual(a.narrativePlan, b.narrativePlan);
  assert.equal(a.conclusion, b.conclusion);
  // Et la consultation n'est qu'un champ volatil de la provenance.
  const e = refs(fait(a, "logement.exposition-bati"))[0]!;
  assert.deepEqual(sansChampsVolatils(e.provenance!), sansChampsVolatils(refs(fait(b, "logement.exposition-bati"))[0]!.provenance!));
});

test("Contrat · provenance() n'écrit aucune clé vide (les empreintes refusent `undefined`)", () => {
  const p = provenance({ producer: "X", dataset: undefined, period: null, version: "" });
  assert.deepEqual(p, { producer: "X" });
  assert.equal(ligneDeProvenance(null), null);
  assert.equal(ligneDeProvenance({}), null);
});

// ── Territoire : le registre réel ────────────────────────────────────────────────────────────

test("Territoire · le registre réel porte la provenance, sans changer l'empreinte ni la projection de synthèse", async () => {
  const { buildTerritoireSnapshot } = await import("../territoire/facts.ts");
  const { chatelaillonInputs } = await import("../territoire/__fixtures__/chatelaillon.ts");
  const { projectForSynthesis } = await import("../territoire/synthesis-contract.ts");
  const i = chatelaillonInputs();
  const s = buildTerritoireSnapshot(i, "2026-11-04T00:00:00.000Z");
  const nu: FactsSnapshot = { ...s, facts: s.facts.map(({ provenance: _p, ...f }) => { void _p; return f; }) };
  assert.equal(hashSnapshot(s), hashSnapshot(nu), "la provenance Territoire a changé l'empreinte");
  assert.deepEqual(projectForSynthesis(s, "gwl20"), projectForSynthesis(nu, "gwl20"));
  const p = (k: string) => s.facts.find((f) => f.key === k)?.provenance;
  assert.equal(fraicheurEnClair(p("housing.secondary_share")!), "Données observées en 2022");
  assert.equal(fraicheurEnClair(p("climate.scenarios")!), "Projection, période de référence 1976-2005");
  assert.equal(sourceEnClair(p("housing.vacancy_share")!), "Insee · Recensement de la population, logements vacants, via ADEME");
  // Le boisement ADEME n'a ni définition ni millésime documentés : aucune période n'est inventée.
  assert.equal(fraicheurEnClair(p("land.forest_ademe")!), null);
});

test("Territoire · VigiEau : consultée si la source a répondu, jamais datée si elle est muette", async () => {
  const { buildTerritoireSnapshot } = await import("../territoire/facts.ts");
  const { chatelaillonInputs } = await import("../territoire/__fixtures__/chatelaillon.ts");
  const base = chatelaillonInputs();
  const ok = buildTerritoireSnapshot({ ...base, vigieau: { inseeCode: base.insee, maxLevel: null, topZone: null, zones: [], status: "ok", consultedAt: CONSULTE } }, CONSULTE);
  const ko = buildTerritoireSnapshot({ ...base, vigieau: { inseeCode: base.insee, maxLevel: null, topZone: null, zones: [], status: "unavailable", consultedAt: CONSULTE } }, CONSULTE);
  const prov = (s: FactsSnapshot) => s.facts.find((f) => f.key === "water.restrictions")!.provenance!;
  assert.equal(fraicheurEnClair(prov(ok)), "Source consultée le 4 novembre 2026");
  assert.equal(prov(ko).consultedAt, undefined);
  assert.equal(ko.facts.find((f) => f.key === "water.restrictions")!.status, "source_unavailable");
});
