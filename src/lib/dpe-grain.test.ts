// FUT-74 : le grain d'un diagnostic (logement / immeuble / indéterminé), et ce que le reste du
// produit en fait.
//
// DEUX FAMILLES DE TESTS DANS CE FICHIER :
//   1. `grainDpe` et ses voisins (module neuf, pur) : ils PASSENT.
//   2. La doctrine attendue sur le code ACTUEL, marquée `todo` : ces tests décrivent ce que l'écran
//      et le moteur doivent dire, et ils ÉCHOUENT aujourd'hui sans casser `npm test`. Le câblage du
//      correctif (après fusion de la PR #83 et décision du porteur) retire le `todo` ; ils deviennent
//      alors la non-régression. Un `todo` qui passe avant le câblage signale un test mal écrit.
//
// Chaque test de la seconde famille vérifie ce que l'écran RACONTE, pas seulement qu'un bloc
// APPARAÎT (règle du 25/07/2026, AGENTS.md).
import test from "node:test";
import assert from "node:assert/strict";
import { attribuableAuLogement, grainDpe, issuDesDonneesDeLImmeuble, repartirParGrain } from "./dpe-grain.ts";
import {
  AMBIGUS, GENERES_SEULS, IMMEUBLE_ET_GENERES_SANS_COMPLEMENT, IMMEUBLE_ET_INDIVIDUELS, IMMEUBLE_SEUL, MAISON_SEULE, NEUF, dpe,
} from "./dpe-grain.fixtures.ts";
import { buildAddressDpeContext, addressContextLead } from "./dpe-address-context.ts";
import { champsVariables, ligneCandidat } from "./dpe-selection-vue.ts";
import { dpeAttributionStatus } from "./dpe-attribution.ts";
import { deriveThermalEvidence } from "./thermal-evidence.ts";
import { confortEteDepuisDpe } from "./decision/logement-facts.ts";

const TODO = { todo: "FUT-74 : correctif préparé, non câblé (attend la PR #83 et la décision du porteur)" };

// ── 1. Le grain ──────────────────────────────────────────────────────────────────────────────────

test("les six méthodes du jeu existant et les sept du neuf ont chacune leur grain", () => {
  const attendu: [string, string, string][] = [
    ["appartement", "dpe appartement individuel", "logement"],
    ["maison", "dpe maison individuelle", "logement"],
    ["appartement", "dpe appartement généré à partir des données DPE immeuble", "logement"],
    ["immeuble", "dpe immeuble collectif", "immeuble"],
    ["appartement", "dpe issu d'une étude thermique réglementaire RT2012 bâtiment : appartement", "logement"],
    ["immeuble", "dpe issu d'une étude thermique réglementaire RT2012 bâtiment : immeuble", "immeuble"],
    ["maison", "dpe issu d'une étude thermique réglementaire RT2012 bâtiment : maison individuelle", "logement"],
    ["appartement", "dpe issu d'une étude energie environement réglementaire RE2020 bâtiment : appartement", "logement"],
    ["maison", "dpe issu d'une étude energie environement réglementaire RE2020 bâtiment : maison individuelle", "logement"],
    ["immeuble", "dpe issu d'une étude energie environement réglementaire RE2020 bâtiment : immeuble", "immeuble"],
  ];
  for (const [type_batiment, methode_dpe, grain] of attendu) {
    assert.equal(grainDpe({ type_batiment, methode_dpe }), grain, methode_dpe);
  }
});

test("l'appartement généré à partir de l'immeuble est un DPE de LOGEMENT, et il est reconnu comme tel", () => {
  const g = GENERES_SEULS[0];
  assert.equal(grainDpe(g), "logement");
  assert.equal(attribuableAuLogement(g), true);
  assert.equal(issuDesDonneesDeLImmeuble(g), true);
  // Le DPE de l'immeuble porte sur le bâtiment lui-même : il n'est « issu » de rien.
  assert.equal(issuDesDonneesDeLImmeuble(IMMEUBLE_SEUL[0]), false);
});

test("le type prime sur la méthode, qui ne fait que le suppléer", () => {
  assert.equal(grainDpe({ type_batiment: "immeuble", methode_dpe: null }), "immeuble");
  assert.equal(grainDpe({ type_batiment: null, methode_dpe: "dpe immeuble collectif" }), "immeuble");
  assert.equal(grainDpe({ type_batiment: null, methode_dpe: "dpe appartement généré à partir des données DPE immeuble" }), "logement");
  assert.equal(grainDpe({ type_batiment: " Appartement ", methode_dpe: undefined as never }), "logement");
});

test("mal typé ou insuffisamment renseigné : indéterminé, donc jamais attribuable", () => {
  for (const d of AMBIGUS) {
    assert.equal(grainDpe(d), "indetermine", d.id_dpe);
    assert.equal(attribuableAuLogement(d), false, d.id_dpe);
  }
});

test("le jeu d'avant juillet 2021 : ses libellés de type se lisent aussi", () => {
  assert.equal(grainDpe({ type_batiment: "Bâtiment collectif à usage principal d'habitation", methode_dpe: null }), "immeuble");
  assert.equal(grainDpe({ type_batiment: "Logement", methode_dpe: null }), "logement");
  assert.equal(grainDpe({ type_batiment: "Maison Individuelle", methode_dpe: null }), "logement");
});

test("le neuf suit la même règle", () => {
  assert.deepEqual(NEUF.map(grainDpe), ["immeuble", "logement", "logement"]);
});

test("répartir par grain ne retire ni ne réordonne rien", () => {
  const tout = [...IMMEUBLE_ET_INDIVIDUELS, ...AMBIGUS];
  const r = repartirParGrain(tout);
  assert.deepEqual(r.immeubles.map((d) => d.id_dpe), ["FUT74IMM00031"]);
  assert.deepEqual(r.logements.map((d) => d.id_dpe), ["FUT74LOG00031", "FUT74LOG00032", "FUT74LOG00033"]);
  assert.equal(r.indetermines.length, 3);
  assert.equal(r.logements.length + r.immeubles.length + r.indetermines.length, tout.length);
});

test("le complément d'adresse parasite d'un DPE d'immeuble ne le fait pas passer pour un logement", () => {
  const imm = IMMEUBLE_ET_INDIVIDUELS[0];
  assert.equal(imm.complement, "2-DPE-1-LogZone");
  assert.equal(grainDpe(imm), "immeuble");
});

// ── 2. Ce qui doit déjà tenir, et que le correctif ne doit pas casser ────────────────────────────

test("NON-RÉGRESSION · l'attribution automatique reste réservée à une maison seule", () => {
  assert.equal(dpeAttributionStatus(MAISON_SEULE, "housenumber").status, "auto_confirmed");
  assert.equal(dpeAttributionStatus(IMMEUBLE_SEUL, "housenumber").status, "selection_required");
  assert.equal(dpeAttributionStatus(GENERES_SEULS.slice(0, 1), "housenumber").status, "selection_required");
});

test("NON-RÉGRESSION · le confort d'été d'un appartement généré reste au niveau du bâtiment (FUT-20)", () => {
  // 7,7 % des générés renseignent le confort d'été : la dérivation reste prudente, et c'est juste.
  const ev = deriveThermalEvidence(dpe({ methode_dpe: "dpe appartement généré à partir des données DPE immeuble", confort_ete: "insuffisant" }));
  assert.equal(ev.level, "B1_EXACT_BUILDING");
  assert.equal(ev.indicator, null);
});

test("NON-RÉGRESSION · un DPE d'immeuble retenu ne qualifie jamais le confort d'été du logement", () => {
  assert.equal(confortEteDepuisDpe(IMMEUBLE_SEUL[0]).niveau, "aucun");
});

test("NON-RÉGRESSION · les statistiques d'adresse n'agrègent que les diagnostics de logement", () => {
  const ctx = buildAddressDpeContext(IMMEUBLE_ET_INDIVIDUELS)!;
  assert.equal(ctx.labelled, 3); // la classe D de l'immeuble n'entre pas dans la répartition
  assert.deepEqual(ctx.surfaces, { min: 31.2, max: 64 });
});

// ── 3. La doctrine attendue sur le code actuel (todo) ────────────────────────────────────────────

test("BUG 1 · un appartement généré ne s'intitule jamais « Immeuble entier »", TODO, () => {
  const [, ...generes] = IMMEUBLE_ET_GENERES_SANS_COMPLEMENT;
  const champs = champsVariables(IMMEUBLE_ET_GENERES_SANS_COMPLEMENT);
  for (const g of generes) {
    const l = ligneCandidat(g, champs);
    assert.equal(l.immeuble, false, g.id_dpe);
    assert.notEqual(l.titre, "Immeuble entier", g.id_dpe);
    assert.ok(!l.details.includes("diagnostic de l'immeuble"), g.id_dpe);
  }
});

test("BUG 1 · des appartements générés seuls n'annoncent pas un diagnostic d'immeuble", TODO, () => {
  assert.equal(buildAddressDpeContext(GENERES_SEULS)!.hasCollective, false);
});

test("BUG 2 · le compte de l'adresse distingue les diagnostics de logement de celui de l'immeuble", TODO, () => {
  // « 4 diagnostics sont enregistrés… Reconnaissez-vous celui de ce logement ? » invite à choisir
  // parmi quatre lignes dont une ne peut pas être la bonne.
  const lead = addressContextLead(buildAddressDpeContext(IMMEUBLE_ET_INDIVIDUELS)!);
  assert.match(lead, /3 diagnostics de logement/);
});

test("BUG 2 · un DPE d'immeuble seul ne se présente pas comme une ligne à reconnaître", TODO, () => {
  const lead = addressContextLead(buildAddressDpeContext(IMMEUBLE_SEUL)!);
  assert.doesNotMatch(lead, /Est-ce celui de ce logement/);
});

test("BUG 3 · un DPE d'immeuble retenu ne donne jamais son étiquette au logement dans le moteur", TODO, async () => {
  // Aujourd'hui : la route `/api/logement-dpe` accepte ce choix, et `ruleDpe` écrit « À cette
  // adresse, le diagnostic choisi classe ce logement F, une passoire énergétique » (structuring).
  const { buildLogementFacts } = await import("./decision/logement-facts.ts");
  const data = {
    rga: { coverage: "none", label: null }, pprn: { coverage: "none", count: 0, label: null },
    cavites: { coverage: "none", count: 0 }, patrimoine: { coverage: "none", count: 0 },
    sinistralite: { coverage: "none", active: false }, fetchedAt: "2026-10-24T00:00:00.000Z",
  } as never;
  const f = buildLogementFacts(data, IMMEUBLE_SEUL[0]);
  assert.equal(f.dpeLabel, null);
  assert.equal(f.dpe, "absent");
});
