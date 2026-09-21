import { test } from "node:test";
import assert from "node:assert/strict";
import { buildAutourFacts } from "./autour-facts.ts";
import { AUTOUR_RULES } from "./autour-rules.ts";
import type { ModuleFacts } from "./decision-fact.ts";
import type { Face3Snapshot } from "../logement-autour-types.ts";
import type { UserProject } from "../user-project.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LE PREMIER FAIT DU VOISINAGE À ENTRER DANS LA DÉCISION (21/09/2026).
//
// Ce que cette tranche doit prouver n'est pas qu'un médecin remonte : c'est que le rail tient.
// Snapshot → fait canonique → preuve avec son grain → règle activée par le projet → fait de
// décision. Si ce chemin est propre ici, les écoles et les transports suivront le même.
//
// Le cas d'origine : sur une adresse de Châtelaillon, le module annonçait un médecin généraliste
// à 553 m pendant que le dossier répondait « parmi les 20 % de communes les plus favorables ».
// ════════════════════════════════════════════════════════════════════════════════════════════

const regle = AUTOUR_RULES[0]!;

function projet(prefs: { key: string; weight: number }[], intent?: string, posture?: string): UserProject {
  return {
    posture: (posture ?? "adresse") as UserProject["posture"],
    intent: (intent ?? null) as UserProject["intent"],
    rawText: null,
    updatedAt: "2026-09-21T00:00:00.000Z",
    parsed: { reformulation: "test", hardConstraints: {}, preferences: prefs },
  } as unknown as UserProject;
}

function snapshot(sante: unknown, statutBpe: "complete" | "failed" = "complete"): Face3Snapshot {
  return {
    center: { lat: 46.07, lon: -1.08 },
    bpe: { categories: sante === undefined ? [] : [{ category: "sante", nearest: sante, searchCapMeters: 5000, withinWalkCount: 1 }] },
    osm: { potentiallyNoisyInfrastructure: [], nearestMappedGreenSpace: null, bboxRadiusMeters: 1500 },
    sourceStatus: { bpe: statutBpe, osmInfrastructure: "complete", osmGreenSpaces: "complete" },
    sources: { bpeVersion: "face3-2026-07-08e", osmFetchedAt: null, osmQueryVersion: "v1", bpeMillesime: "2025" },
    computedAt: "2026-09-21T10:00:00.000Z",
  } as unknown as Face3Snapshot;
}

function faits(snap: Face3Snapshot | null): ModuleFacts {
  return { insee: "17094", nom: "Châtelaillon-Plage", autour: buildAutourFacts(snap) } as unknown as ModuleFacts;
}

const MEDECIN = { distanceMeters: 553, typeLabel: "Médecin généraliste" };
const SOINS_3 = [{ key: "acces_soins", weight: 3 }];

test("le constat remonte quand la priorité est déclarée", () => {
  const r = regle.evaluate(faits(snapshot(MEDECIN)), projet(SOINS_3));
  assert.equal(r.outcome, "verification");
  assert.equal(r.facts.length, 1);
  const f = r.facts[0]!;
  assert.match(f.statement, /médecin généraliste/i);
  // ARRONDI : « 550 m » et jamais « 553 m ». La précision au mètre sur une distance à vol d'oiseau
  // serait un faux témoignage de précision.
  assert.match(f.statement, /550 m/);
  assert.doesNotMatch(f.statement, /553/);
});

test("rien ne remonte quand la priorité n'est pas déclarée", () => {
  // Le module Autour affiche ce fait pour tout le monde, c'est sa fonction. La DÉCISION, elle, ne
  // se charge que de ce que le lecteur a demandé.
  const r = regle.evaluate(faits(snapshot(MEDECIN)), projet([{ key: "faible_chaleur", weight: 3 }]));
  assert.equal(r.outcome, "not_applicable");
  assert.equal(r.facts.length, 0);
});

test("une présence n'est JAMAIS un bon accès aux soins", () => {
  // La faute que cette règle doit rendre impossible. La BPE recense un lieu ; elle ne dit ni la
  // disponibilité, ni les délais, ni l'acceptation de nouveaux patients.
  const f = regle.evaluate(faits(snapshot(MEDECIN)), projet(SOINS_3)).facts[0]!;
  assert.doesNotMatch(f.statement, /bon accès|bien desservi|favorable|suffisant/i);
  assert.match(f.limitation!, /disponibilité/i);
  assert.match(f.limitation!, /nouveaux patients/i);
  assert.match(f.limitation!, /vol d'oiseau/i);
  // Une vérification, jamais un alignement : le fait donne quelque chose à FAIRE.
  assert.equal(f.role, "verification");
  // Et jamais structurant, quel que soit le poids : une présence ne conclut pas seule.
  assert.equal(f.materialityTier, "secondary");
});

test("la preuve porte son grain et sa relation", () => {
  const f = regle.evaluate(faits(snapshot(MEDECIN)), projet(SOINS_3)).facts[0]!;
  const e = f.evidence[0]!;
  assert.equal(e.grain, "adresse", "une distance depuis le point n'est ni communale ni sectorielle");
  assert.equal(e.relation, "proximite", "c'est une distance, pas un attribut de l'adresse");
  assert.match(e.observedValue!, /550 m/);
});

test("l'action dépend de la situation, elle n'est pas gravée dans la règle", () => {
  const achat = regle.evaluate(faits(snapshot(MEDECIN)), projet(SOINS_3, "achat")).facts[0]!;
  const habite = regle.evaluate(faits(snapshot(MEDECIN)), projet(SOINS_3, null, "habitant")).facts[0]!;
  assert.match(achat.action!.label, /avant de vous engager/i);
  assert.notEqual(habite.action!.label, achat.action!.label);
  // Quelqu'un qui habite déjà là ne « s'engage » pas : lui dire de vérifier avant de s'engager
  // serait le même défaut que la posture « habitant » inscrite d'office.
  assert.doesNotMatch(habite.action!.label, /engager|signer/i);
});

test("aucun équipement dans le périmètre est une information, et elle se dit", () => {
  const r = regle.evaluate(faits(snapshot(null)), projet(SOINS_3));
  assert.equal(r.outcome, "verification");
  const f = r.facts[0]!;
  assert.match(f.statement, /aucun équipement de santé/i);
  // MAIS BORNÉE AU PÉRIMÈTRE : un cabinet à 3 km existe toujours, et la commune peut être bien
  // dotée. Sans cette limite, l'absence deviendrait un verdict.
  assert.match(f.limitation!, /périmètre/i);
});

test("une source en échec ne produit aucune absence", () => {
  // La faute symétrique : dire « aucun médecin » quand personne n'a pu regarder.
  const r = regle.evaluate(faits(snapshot(MEDECIN, "failed")), projet(SOINS_3));
  assert.equal(r.outcome, "not_applicable");
  assert.equal(r.facts.length, 0);
});

test("un dossier sans voisinage analysé laisse la règle muette", () => {
  // Dossier ancien, ou entourage pas encore calculé. La lecture communale a bien eu lieu, elle
  // reste affichée : ce n'est pas une inconnue à signaler.
  assert.equal(regle.evaluate(faits(null), projet(SOINS_3)).outcome, "not_applicable");
});

test("le fait cite le nom du lieu quand un seul exploitant est recensé", () => {
  const avecNom = { distanceMeters: 261, typeLabel: "Pharmacie", nom: "Pharmacie du Port" };
  const f = regle.evaluate(faits(snapshot(avecNom)), projet(SOINS_3)).facts[0]!;
  assert.match(f.statement, /Pharmacie du Port/);
});

test("le choix se dit quand plusieurs lieux sont à portée de pas", () => {
  const snap = snapshot(MEDECIN);
  snap.bpe.categories[0]!.withinWalkCount = 5;
  const f = regle.evaluate(faits(snap), projet(SOINS_3)).facts[0]!;
  assert.match(f.statement, /5 lieux/);
  assert.match(f.statement, /500 m/, "le rayon du comptage est nommé, sinon le nombre ne veut rien dire");
});
