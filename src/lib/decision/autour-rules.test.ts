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
const PHARMACIE = { distanceMeters: 261, typeLabel: "Pharmacie" };
const SOINS_3 = [{ key: "acces_soins", weight: 3 }];

/**
 * UN SNAPSHOT VENTILÉ PAR TYPE, tel que les dossiers ouverts depuis le 22/09/2026 le portent.
 * `nearest` reste le plus proche de la catégorie, tous types confondus, comme la source le produit.
 */
function snapshotVentile(types: Record<string, unknown>): Face3Snapshot {
  const entries = Object.entries(types);
  const plusProche = entries
    .map(([, v]) => v as { distanceMeters: number })
    .sort((a, b) => a.distanceMeters - b.distanceMeters)[0]!;
  const snap = snapshot(plusProche);
  snap.bpe.categories[0]!.nearestByType = types as never;
  return snap;
}

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
  assert.equal(e.observedValue, "550 m", "la pastille porte la mesure, jamais un résumé du constat");
  // Elle ne redit pas la phrase : « Preuve · Médecin généraliste à 550 m » sous « Un médecin
  // généraliste se trouve à environ 550 m » donnait deux fois la même chose, à dix centimètres.
  assert.doesNotMatch(e.observedValue!, /médecin/i);
});

test("la source et son millésime descendent dans « Données et limites »", () => {
  // Une référence SANS valeur mesurée n'établit rien : le rendu la range sous les sources plutôt
  // que d'en faire une pastille (doctrine du lot A). Le millésime vient du snapshot, donc un
  // dossier figé il y a six mois porte le sien.
  const f = regle.evaluate(faits(snapshot(MEDECIN)), projet(SOINS_3)).facts[0]!;
  const source = f.evidence.find((e) => !e.observedValue);
  assert.ok(source, "aucune source nommée");
  assert.match(source!.label, /Base permanente des équipements/);
  assert.match(source!.label, /2025/);
});

test("l'action dépend de la situation, elle n'est pas gravée dans la règle", () => {
  const achat = regle.evaluate(faits(snapshot(MEDECIN)), projet(SOINS_3, "achat")).facts[0]!;
  const habite = regle.evaluate(faits(snapshot(MEDECIN)), projet(SOINS_3, null, "habitant")).facts[0]!;
  assert.match(achat.action!.label, /avant de vous engager/i);
  assert.match(achat.action!.label, /médecin/i, "le geste nomme son objet");
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

test("le libellé de la source reçoit son article", () => {
  // « Autour de cette adresse, médecin généraliste est recensé » : le libellé était repris tel
  // quel. Le genre ne se devine pas d'une terminaison, il vient d'une table tenue à la main.
  const f = regle.evaluate(faits(snapshot(MEDECIN)), projet(SOINS_3)).facts[0]!;
  assert.match(f.statement, /^Un médecin généraliste /);
  const pharma = { distanceMeters: 261, typeLabel: "Pharmacie" };
  const g = regle.evaluate(faits(snapshot(pharma)), projet(SOINS_3)).facts[0]!;
  assert.match(g.statement, /^Une pharmacie /);
});

test("« recensé » ne se répète pas dans le même bloc", () => {
  // Vu à l'écran : le statut disait « Recensé à proximité », la phrase « est recensé », et la
  // suivante « sont recensés ». Le mot reste là où il porte une précaution utile, sur le
  // dénombrement, et disparaît du reste.
  const cas = [snapshot(MEDECIN), snapshot({ ...MEDECIN, exploitants: 5 }), snapshot(null)];
  cas[2]!.bpe.categories = [];
  for (const snap of cas) {
    for (const f of regle.evaluate(faits(snap), projet(SOINS_3)).facts) {
      const n = (`${f.status} ${f.statement}`.match(/recens/gi) ?? []).length;
      assert.ok(n <= 1, `« recensé » apparaît ${n} fois : ${f.status} / ${f.statement}`);
    }
  }
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
  assert.match(f.statement, /Cinq lieux/, "les nombres se disent en lettres, comme ailleurs dans le dossier");
  assert.match(f.statement, /500 m/, "le rayon du comptage est nommé, sinon le nombre ne veut rien dire");
});

test("un geste se comprend seul, hors de la carte qui le porte", () => {
  // Il s'écrivait « Vérifiez la disponibilité avant de vous engager ». Sous la carte, le sujet
  // précède. Mais le geste est AUSSI repris en tête de dossier, dans « À contrôler en priorité »,
  // où il se lit sans elle : le lecteur y trouvait la disponibilité de rien.
  //
  // Vaut pour tout geste cloné sur ce patron, donc le test parcourt TOUTES les situations et les
  // deux branches de la règle, y compris l'absence.
  const cas = [
    regle.evaluate(faits(snapshot(MEDECIN)), projet(SOINS_3, "achat")),
    regle.evaluate(faits(snapshot(MEDECIN)), projet(SOINS_3, "location")),
    regle.evaluate(faits(snapshot(MEDECIN)), projet(SOINS_3, null, "habitant")),
    regle.evaluate(faits(snapshot(MEDECIN)), projet(SOINS_3)),
    regle.evaluate(faits(snapshot(null)), projet(SOINS_3)),
  ];
  for (const r of cas) {
    for (const f of r.facts) {
      const label = f.action!.label;
      assert.match(
        label, /santé|soins|médecin/i,
        `ce geste ne dit pas sur quoi il porte : « ${label} »`,
      );
    }
  }
});

test("aucun texte affiché ne parle « du cabinet »", () => {
  // La BPE recense un LIEU et le nombre d'établissements qui s'y trouvent. Cinq médecins à la même
  // adresse peuvent être une maison de santé comme cinq praticiens indépendants : nommer un
  // cabinet trancherait une question que la source ne tranche pas. Vu sur l'adresse réelle de
  // Châtelaillon, où cinq professionnels partagent le point.
  const cas = [
    regle.evaluate(faits(snapshot(MEDECIN)), projet(SOINS_3, "achat")),
    regle.evaluate(faits(snapshot(MEDECIN)), projet(SOINS_3, "location")),
    regle.evaluate(faits(snapshot(MEDECIN)), projet(SOINS_3, null, "habitant")),
    regle.evaluate(faits(snapshot(null)), projet(SOINS_3)),
  ];
  for (const r of cas) {
    for (const f of r.facts) {
      const textes = [f.statement, f.limitation ?? "", f.action?.label ?? "", f.action?.detail ?? ""];
      for (const texte of textes) {
        assert.doesNotMatch(texte, /cabinet/i, `« cabinet » réapparu : ${texte}`);
      }
    }
  }
});

test("plusieurs praticiens au même point se disent, sans les confondre avec un choix de lieux", () => {
  // Cinq professionnels à la même adresse, c'est ne pas dépendre d'une seule personne. Cinq LIEUX
  // à portée de pas, c'est avoir le choix. Deux informations différentes, jamais mélangées.
  const snap = snapshot({ ...MEDECIN, exploitants: 5 });
  const f = regle.evaluate(faits(snap), projet(SOINS_3)).facts[0]!;
  assert.match(f.statement, /Cinq professionnels y sont recensés/);
  assert.doesNotMatch(f.statement, /lieux de santé/);
});

// ════════════════════════════════════════════════════════════════════════════════════════════
// UNE PHARMACIE N'EST PAS UN MÉDECIN (22/09/2026).
//
// ── LE DÉFAUT DU PATRON, TROUVÉ AVANT DE LE CLONER ───────────────────────────────────────────
// La catégorie « santé » mélange les généralistes et les pharmacies, et le snapshot ne gardait
// que le plus proche des deux. Deux conséquences, toutes deux visibles à l'écran.
//
// L'EFFACEMENT : une pharmacie à 150 m masquait un médecin à 900 m. Le dossier de quelqu'un qui
// avait déclaré l'accès aux soins racontait l'officine et taisait le médecin.
//
// L'ABSURDITÉ : les textes étaient écrits pour un praticien. « Vérifiez que les professionnels de
// santé proches prennent de nouveaux patients » ne veut rien dire d'une officine, et la limitation
// parlait de délais de rendez-vous.
//
// Le même défaut attend les écoles (une maternelle cache un élémentaire) et les transports (une
// halte cache une gare) : c'est la raison d'être de la tranche verticale.
// ════════════════════════════════════════════════════════════════════════════════════════════

test("un médecin plus loin qu'une pharmacie mène quand même le constat", () => {
  const snap = snapshotVentile({ D307: PHARMACIE, D265: MEDECIN });
  const f = regle.evaluate(faits(snap), projet(SOINS_3, "achat")).facts[0]!;
  assert.match(f.statement, /^Un médecin généraliste /, `constat obtenu : ${f.statement}`);
  // La pharmacie n'est pas perdue pour autant : elle complète, elle ne remplace pas.
  assert.match(f.statement, /pharmacie la plus proche est à environ 250 m/);
  assert.match(f.limitation!, /nouveaux patients/);
  assert.match(f.action!.label, /médecin/i);
});

test("une pharmacie seule ne se vérifie pas comme un médecin", () => {
  const f = regle.evaluate(faits(snapshotVentile({ D307: PHARMACIE })), projet(SOINS_3, "achat")).facts[0]!;
  assert.match(f.statement, /^Une pharmacie /);
  // L'absence de médecin est le vrai sujet, et elle a été cherchée : elle se dit.
  assert.match(f.statement, /Aucun médecin généraliste n'apparaît dans le périmètre/);
  // La limitation ne parle plus ni de praticien ni de rendez-vous.
  assert.doesNotMatch(f.limitation!, /délais de rendez-vous|nouveaux patients/);
  assert.match(f.limitation!, /ne remplace pas un médecin traitant/);
  // Ce qui manque au lecteur n'est pas une disponibilité, c'est un endroit où consulter.
  assert.match(f.action!.label, /Repérez où consulter un médecin/);
});

test("un dossier NON ventilé ne prétend pas qu'il manque un médecin", () => {
  // La faute symétrique : sur un dossier figé avant la ventilation, on ne sait pas si un
  // généraliste existe dans le périmètre. Le taire est la seule honnêteté.
  const f = regle.evaluate(faits(snapshot(PHARMACIE)), projet(SOINS_3, "achat")).facts[0]!;
  assert.match(f.statement, /^Une pharmacie /);
  assert.doesNotMatch(f.statement, /Aucun médecin/);
  // La formulation suit quand même le type lu : moins fin que la ventilation, jamais faux.
  assert.match(f.limitation!, /ne remplace pas un médecin traitant/);
});

test("un dossier NON ventilé sur un médecin garde le texte du praticien", () => {
  const f = regle.evaluate(faits(snapshot(MEDECIN)), projet(SOINS_3, "achat")).facts[0]!;
  assert.match(f.limitation!, /nouveaux patients/);
  assert.match(f.action!.label, /médecin/i);
  assert.doesNotMatch(f.statement, /pharmacie/i);
});
