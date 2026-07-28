import { test } from "node:test";
import assert from "node:assert/strict";
import { echelleDuFait, echelleDeLaComposition, echelleDeLaPreuve, ECHELLE_PAR_GRAIN, type Echelle } from "./echelles.ts";
import type { DecisionFact, EvidenceRef } from "./decision-fact.ts";
import type { FactComposition } from "./fact-composition.ts";
import { readFileSync } from "node:fs";

function fait(grain: EvidenceRef["grain"], over: Partial<DecisionFact> = {}): DecisionFact {
  return {
    id: "f", ruleId: "r", sourceFactIds: [], module: "territoire", role: "verification",
    materialityTier: "structuring", topic: "t", statement: "s",
    evidence: [{ factId: "f", module: "territoire", label: "L", grain }],
    action: { type: "verifier_sur_place", label: "Regarder" },
    ...over,
  } as DecisionFact;
}

test("chaque grain a exactement une échelle, et la table les couvre tous", () => {
  const grains: EvidenceRef["grain"][] = ["commune", "unite_urbaine", "secteur", "adresse"];
  for (const g of grains) assert.ok(ECHELLE_PAR_GRAIN[g], `grain sans échelle : ${g}`);
  assert.equal(Object.keys(ECHELLE_PAR_GRAIN).length, grains.length);
});

test("l'unité urbaine est du TERRITOIRE, jamais du quartier", () => {
  // C'est une maille PLUS LARGE que la commune (l'agglomération). La confondre avec le voisinage
  // inverserait le sens de lecture du rapport.
  assert.equal(echelleDuFait(fait("unite_urbaine")), "territoire");
  assert.equal(echelleDuFait(fait("commune")), "territoire");
});

test("le secteur est le QUARTIER, l'adresse est le LOGEMENT", () => {
  assert.equal(echelleDuFait(fait("secteur")), "quartier");
  assert.equal(echelleDuFait(fait("adresse")), "logement");
});

test("l'échelle ne dépend PAS du module qui a produit le fait", () => {
  // Le module dit d'où vient la donnée, pas ce qu'elle décrit. Une règle du module Logement peut très
  // bien établir un constat à l'échelle de la commune (la sinistralité, par exemple).
  const logementSurCommune = fait("commune", { module: "logement" } as Partial<DecisionFact>);
  assert.equal(echelleDuFait(logementSurCommune), "territoire");
  const territoireSurAdresse = fait("adresse", { module: "territoire" } as Partial<DecisionFact>);
  assert.equal(echelleDuFait(territoireSurAdresse), "logement");
});

test("un COMPROMIS prend l'échelle de ses côtés (il n'a pas d'evidence propre)", () => {
  const compromis = {
    id: "c", ruleId: "r", sourceFactIds: [], module: "territoire", role: "compromise",
    materialityTier: "structuring", topic: "t", statement: "s",
    sides: [
      { projectKey: "acces_transports", statement: "a", evidence: [{ factId: "s", module: "territoire", label: "L", grain: "commune" }] },
      { projectKey: "faible_chaleur", statement: "b", evidence: [{ factId: "s", module: "territoire", label: "L", grain: "commune" }] },
    ],
  } as unknown as DecisionFact;
  assert.equal(echelleDuFait(compromis), "territoire");
});

test("aucune preuve -> AUCUNE échelle : on ne devine pas", () => {
  // Ranger d'office dans « territoire » fabriquerait une appartenance que rien ne fonde — le défaut
  // même que cette projection existe pour éviter.
  assert.equal(echelleDuFait(fait("commune", { evidence: [] } as Partial<DecisionFact>)), null);
});

test("une composition prend l'échelle de ses faits ABSORBÉS", () => {
  const comp = {
    kind: "grouped_verification", items: [{ evidence: [{ grain: "commune" }] }],
  } as unknown as FactComposition;
  assert.equal(echelleDeLaComposition(comp, [fait("adresse")]), "logement");
});

test("sans absorbé rendu, la composition retombe sur SA preuve", () => {
  const comp = {
    kind: "mismatch_with_action",
    evidence: [{ factId: "x", module: "territoire", label: "L", grain: "commune" }],
  } as unknown as FactComposition;
  assert.equal(echelleDeLaComposition(comp, []), "territoire");
});

// ── L'ÉTAT RÉEL DU MOTEUR, mesuré sur les règles ────────────────────────────────

test("aucune règle n'émet encore le grain SECTEUR — le quartier est une échelle VIDE", () => {
  // Ce test documente le chantier plutôt qu'il ne le contraint : le modèle sait nommer l'échelle du
  // quartier, mais les données de proximité (Autour, îlot de chaleur, confort thermique) ne franchissent
  // pas le moteur. Le jour où une règle émettra `secteur`, ce test tombera — et ce sera la bonne
  // nouvelle qu'on attend. Le mettre à jour alors, ne pas le supprimer.
  const sources = [
    "src/lib/decision/materiality-rules.ts", "src/lib/decision/logement-rules.ts",
    "src/lib/decision/mismatch-rules.ts", "src/lib/decision/alignment-rules.ts",
    "src/lib/decision/absence-rules.ts", "src/lib/decision/coast-rules.ts",
    "src/lib/decision/agglomeration-rules.ts", "src/lib/decision/hard-constraint-rules.ts",
  ];
  const emetSecteur = sources.some((f) => /grain:\s*"secteur"/.test(readFileSync(f, "utf8")));
  assert.equal(emetSecteur, false, "une règle émet enfin le grain « secteur » : mettre ce test à jour");
});

test("les trois échelles sont bien distinctes et exhaustives", () => {
  const attendues: Echelle[] = ["territoire", "quartier", "logement"];
  const obtenues = [...new Set(Object.values(ECHELLE_PAR_GRAIN))];
  assert.deepEqual(obtenues.sort(), [...attendues].sort());
});

test("LIMITE LEVÉE (28/07/2026) : une distance ancrée sur l'adresse va dans « quartier »", () => {
  // Ce test figeait l'ancien comportement en annonçant qu'il tomberait le jour où l'on distinguerait
  // l'ancre du support. C'est fait : `relation` porte cette distinction, et l'échelle se dérive du
  // couple. « La gare est à 8 minutes » se mesure DEPUIS l'adresse et décrit l'environnement.
  const distanceDepuisAdresse = fait("adresse", {
    ruleId: "hard.nearPlace", topic: "la proximité de la gare",
  } as Partial<DecisionFact>);
  distanceDepuisAdresse.evidence[0]!.relation = "proximite";
  assert.equal(echelleDuFait(distanceDepuisAdresse), "quartier");

  // Et le défaut reste sûr : sans `relation` déclarée, une preuve d'adresse ne migre pas toute seule.
  const attributDuBien = fait("adresse", { ruleId: "logement.dpe" } as Partial<DecisionFact>);
  assert.equal(echelleDuFait(attributDuBien), "logement");
});

// ── ANCRE × RELATION (28/07/2026) ────────────────────────────────────────────

test("ÉCHELLE : une proximité mesurée depuis l'adresse décrit le QUARTIER, pas le logement", () => {
  const proche: EvidenceRef = {
    factId: "commune.distanceCoteKm", module: "territoire", label: "Distance au littoral",
    grain: "adresse", relation: "proximite",
  };
  assert.equal(echelleDeLaPreuve(proche), "quartier");
});

test("ÉCHELLE : un attribut mesuré à l'adresse décrit bien le LOGEMENT", () => {
  const attribut: EvidenceRef = {
    factId: "logement.dpe", module: "logement", label: "DPE", grain: "adresse", relation: "attribut",
  };
  assert.equal(echelleDeLaPreuve(attribut), "logement");
});

test("ÉCHELLE : sans `relation`, une preuve d'adresse reste au logement (défaut sûr)", () => {
  const sansRelation: EvidenceRef = {
    factId: "logement.rga", module: "logement", label: "Argiles", grain: "adresse",
  };
  assert.equal(echelleDeLaPreuve(sansRelation), "logement");
});

test("ÉCHELLE : une proximité mesurée depuis la COMMUNE reste du territoire", () => {
  // Le centroïde communal ne décrit aucun voisinage réel : c'est ce que la règle « bruit » dit déjà
  // au lecteur dans sa limitation. La promouvoir en « quartier » serait le mensonge inverse.
  const depuisCommune: EvidenceRef = {
    factId: "calmeSonore", module: "territoire", label: "Bruit", grain: "commune", relation: "proximite",
  };
  assert.equal(echelleDeLaPreuve(depuisCommune), "territoire");
});

test("ÉCHELLE : le secteur reste le quartier, quelle que soit la relation", () => {
  for (const relation of ["attribut", "proximite"] as const) {
    assert.equal(
      echelleDeLaPreuve({ factId: "icu", module: "territoire", label: "ICU", grain: "secteur", relation }),
      "quartier",
    );
  }
});
