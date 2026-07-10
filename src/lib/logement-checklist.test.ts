import test from "node:test";
import assert from "node:assert/strict";
import {
  energyState, projetBucket, buildDecisionChecklist, checklistIntro, type ChecklistFacts,
} from "./logement-checklist.ts";

const NONE: ChecklistFacts = {
  dpe: "correct", confortEteInsuffisant: false, expositionBati: false,
  zoneReglementee: false, sinistraliteActive: false, caviteProche: false,
};

test("energyState mappe les étiquettes", () => {
  assert.equal(energyState("G"), "passoire");
  assert.equal(energyState("f"), "passoire");
  assert.equal(energyState("E"), "energivore");
  assert.equal(energyState("C"), "correct");
  assert.equal(energyState(null), "absent");
});

test("projetBucket : achat/reside/location connus, autre et null -> neutre", () => {
  assert.equal(projetBucket("achat"), "achat");
  assert.equal(projetBucket("reside"), "reside");
  assert.equal(projetBucket("location"), "location");
  assert.equal(projetBucket("autre"), "neutre");
  assert.equal(projetBucket(null), "neutre");
});

test("aucun fait saillant -> checklist vide", () => {
  assert.deepEqual(buildDecisionChecklist(NONE, "achat"), []);
});

test("un item par face déclenchée, dans l'ordre des preuves", () => {
  const all: ChecklistFacts = {
    dpe: "passoire", confortEteInsuffisant: true, expositionBati: true,
    zoneReglementee: true, sinistraliteActive: true, caviteProche: true,
  };
  const ids = buildDecisionChecklist(all, "achat").map((i) => i.id);
  assert.deepEqual(ids, ["energie", "confort", "bati", "reglementaire", "sinistralite", "cavite"]);
});

test("le texte change avec le projet ; autre == neutre", () => {
  const f: ChecklistFacts = { ...NONE, zoneReglementee: true };
  const achat = buildDecisionChecklist(f, "achat")[0].text;
  const reside = buildDecisionChecklist(f, "reside")[0].text;
  const neutre = buildDecisionChecklist(f, null)[0].text;
  const autre = buildDecisionChecklist(f, "autre")[0].text;
  assert.notEqual(achat, reside);
  assert.notEqual(achat, neutre);
  assert.equal(autre, neutre);
});

test("dpe correct ou absent -> pas d'item énergie", () => {
  assert.equal(buildDecisionChecklist({ ...NONE, dpe: "correct" }, "achat").length, 0);
  assert.equal(buildDecisionChecklist({ ...NONE, dpe: "absent" }, "achat").length, 0);
});

test("checklistIntro distingue neutre et projet choisi", () => {
  assert.notEqual(checklistIntro(null), checklistIntro("achat"));
  assert.equal(checklistIntro("autre"), checklistIntro(null));
});

const NONE2: ChecklistFacts = {
  dpe: "correct", confortEteInsuffisant: false, expositionBati: false,
  zoneReglementee: false, sinistraliteActive: false, caviteProche: false,
};

test("cavité : un point, quel que soit le projet, avec un texte adapté", () => {
  for (const projet of [null, "achat", "reside", "location"]) {
    const items = buildDecisionChecklist({ ...NONE2, caviteProche: true }, projet);
    assert.deepEqual(items.map((i) => i.id), ["cavite"], `projet=${projet}`);
    assert.ok(items[0].text.length > 0);
  }
});

test("cavité absente : aucun point", () => {
  assert.deepEqual(buildDecisionChecklist(NONE2, "achat"), []);
});

test("texte cavité : achat parle de fondations, location de bailleur", () => {
  const achat = buildDecisionChecklist({ ...NONE2, caviteProche: true }, "achat")[0].text;
  const loc = buildDecisionChecklist({ ...NONE2, caviteProche: true }, "location")[0].text;
  assert.match(achat, /fondation|sol/i);
  assert.match(loc, /bailleur/i);
});
