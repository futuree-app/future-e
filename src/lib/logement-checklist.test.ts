import test from "node:test";
import assert from "node:assert/strict";
import { GESTES } from "./decision/logement-gestes.ts";
import {
  energyState, projetBucket, buildDecisionChecklist, checklistIntro, type ChecklistFacts,
} from "./logement-checklist.ts";

const NONE: ChecklistFacts = {
  dpe: "correct", confortEteInsuffisant: false, expositionBati: false,
  zoneReglementee: false, sinistraliteActive: false, caviteProche: false, perimetrePatrimonial: false,
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
    zoneReglementee: true, sinistraliteActive: true, caviteProche: true, perimetrePatrimonial: true,
  };
  const ids = buildDecisionChecklist(all, "achat").map((i) => i.id);
  assert.deepEqual(ids, ["energie", "confort", "bati", "reglementaire", "sinistralite", "cavite", "patrimoine"]);
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

test("patrimoine : un point pour un projet d'achat", () => {
  const items = buildDecisionChecklist({ ...NONE, perimetrePatrimonial: true }, "achat");
  assert.deepEqual(items.map((i) => i.id), ["patrimoine"]);
  assert.match(items[0].text, /mairie/);
});

test("patrimoine : aucun point pour une location", () => {
  const items = buildDecisionChecklist({ ...NONE, perimetrePatrimonial: true }, "location");
  assert.deepEqual(items, []);
});

test("patrimoine : un point en neutre et en résidence", () => {
  for (const projet of [null, "reside"]) {
    const items = buildDecisionChecklist({ ...NONE, perimetrePatrimonial: true }, projet);
    assert.deepEqual(items.map((i) => i.id), ["patrimoine"], `projet=${projet}`);
  }
});

test("patrimoine absent : aucun point", () => {
  assert.deepEqual(buildDecisionChecklist(NONE, "achat"), []);
});

test("cavité : un point, quel que soit le projet, avec un texte adapté", () => {
  for (const projet of [null, "achat", "reside", "location"]) {
    const items = buildDecisionChecklist({ ...NONE, caviteProche: true }, projet);
    assert.deepEqual(items.map((i) => i.id), ["cavite"], `projet=${projet}`);
    assert.ok(items[0].text.length > 0);
  }
});

test("cavité absente : aucun point", () => {
  assert.deepEqual(buildDecisionChecklist(NONE, "achat"), []);
});

test("texte cavité : achat parle de fondations, location de bailleur", () => {
  const achat = buildDecisionChecklist({ ...NONE, caviteProche: true }, "achat")[0].text;
  const loc = buildDecisionChecklist({ ...NONE, caviteProche: true }, "location")[0].text;
  assert.match(achat, /fondation|sol/i);
  assert.match(loc, /bailleur/i);
});

// ── SOURCE UNIQUE DES GESTES (29/07/2026) ────────────────────────────────────

test("UN SEUL TEXTE PAR GESTE : la checklist dit exactement ce que dit le dossier", () => {
  // Le défaut fermé ce jour-là : les deux chemins portaient leur propre copie des mêmes gestes, et
  // elles avaient divergé. La checklist disait encore « Vérifier le diagnostic énergétique complet
  // et sa date » là où le dossier disait « Regardez le détail du diagnostic et sa date ».
  const f: ChecklistFacts = {
    dpe: "passoire", confortEteInsuffisant: false, expositionBati: false,
    zoneReglementee: false, sinistraliteActive: false, caviteProche: false, perimetrePatrimonial: false,
  };
  for (const [projet, bucket] of [["achat", "achat"], ["location", "location"], [null, "neutre"]] as const) {
    const texte = buildDecisionChecklist(f, projet)[0]!.text;
    assert.ok(texte.startsWith(GESTES.energie[bucket].label), `posture ${bucket} : le label doit ouvrir la phrase`);
    assert.ok(texte.includes(GESTES.energie[bucket].detail), `posture ${bucket} : le détail doit suivre`);
  }
});

test("LE VERBE « VÉRIFIER » N'OUVRE PLUS AUCUN GESTE", () => {
  // Cinq libellés sur sept commençaient par là : empilés, ils se lisaient comme un formulaire.
  const tous: ChecklistFacts = {
    dpe: "passoire", confortEteInsuffisant: true, expositionBati: true,
    zoneReglementee: true, sinistraliteActive: true, caviteProche: true, perimetrePatrimonial: true,
  };
  for (const projet of ["achat", "location", "reside", null]) {
    for (const it of buildDecisionChecklist(tous, projet)) {
      assert.doesNotMatch(it.text, /^Vérifi/, `« ${it.text.slice(0, 40)}… » ouvre par « Vérifi »`);
    }
  }
});

test("LE CONFORT D'ÉTÉ est un geste à part entière, dans les quatre postures", () => {
  const f: ChecklistFacts = {
    dpe: "correct", confortEteInsuffisant: true, expositionBati: false,
    zoneReglementee: false, sinistraliteActive: false, caviteProche: false, perimetrePatrimonial: false,
  };
  for (const projet of ["achat", "location", "reside", null]) {
    const items = buildDecisionChecklist(f, projet);
    assert.equal(items.length, 1);
    assert.equal(items[0]!.id, "confort");
    assert.ok(items[0]!.text.length > 40);
  }
});

test("PATRIMOINE : la posture location ne produit pas de ligne vide", () => {
  const f: ChecklistFacts = {
    dpe: "correct", confortEteInsuffisant: false, expositionBati: false,
    zoneReglementee: false, sinistraliteActive: false, caviteProche: false, perimetrePatrimonial: true,
  };
  assert.equal(buildDecisionChecklist(f, "location").length, 0);
  assert.equal(buildDecisionChecklist(f, "achat").length, 1);
});
