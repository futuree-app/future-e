// FUT-8 : LES SIX CORRECTIONS DE COHÉRENCE AVANT MERGE (revue du 01/10/2026).
import test from "node:test";
import assert from "node:assert/strict";
import { normalizeUserProject, type UserProject, type CriterionRef, type DefinitionBody } from "../user-project.ts";
import { appliquerGeste, type CriterionAction } from "./criterion-gestes.ts";
import { criterionFingerprint, isConfirmed, isStale } from "./conditions.ts";
import { effectiveProject, effectivePreferences, parsedFingerprint } from "./effective-value.ts";
import { signatureDecisionnelle, projetAChangeMateriellement } from "./projet-materiel.ts";
import { conventionPar } from "./conventions.ts";
import { ZONE_TABLE } from "../geo-zones.ts";
import { hydrateHardConstraints } from "../hard-constraints-hydrate.ts";
import { assainirParsed } from "../parse-assainir.ts";
import { criterionCapability } from "./capability.ts";
import { evaluateSizeRelativeTo, type CommuneAttributes, type EvaluationContext } from "../hard-constraints.ts";
import { resolveSizeReference, type PlaceDirectory } from "../hard-constraints-resolve.ts";
import { populationCommunalePLM } from "../plm-population.ts";
import { vueCriteres } from "./projet-criteres-vue.ts";
import type { ParsedProject } from "../comparateur-vie.ts";
import type { HardConstraints } from "../hard-constraint-schema.ts";

const NOW = "2026-10-01T12:00:00.000Z";
function projet(hc: HardConstraints, prefs: { key: string; weight: number; source?: string }[] = [], extra: Record<string, unknown> = {}, ancres = [{ label: "Brest" }]): UserProject {
  return normalizeUserProject({ posture: "recherche", rawText: "…", updatedAt: "2026-10-01T00:00:00.000Z", parsed: { reformulation: "x", hardConstraints: hc, preferences: prefs, communeAncre: ancres }, ...extra })!;
}
function geste(p: UserProject, g: CriterionAction): UserProject {
  const r = appliquerGeste(p, g, NOW);
  assert.equal(r.ok, true, r.ok ? "" : r.error);
  return (r as { project: UserProject }).project;
}
function definir(p: UserProject, ref: CriterionRef, definition: DefinitionBody): UserProject {
  return geste(p, { action: "definir", criterion: ref, seen: parsedFingerprint(p, ref)!, definition });
}
const VIE: CriterionRef = { kind: "preference", key: "vie_locale", instance: null };

// ── 1. Signature décisionnelle ─────────────────────────────────────────────────────────────────

test("1. signature : une précision qui change la lecture périme le dossier figé", () => {
  const p = projet({ communeSize: { max: 20000 } });
  const precise = definir(p, { kind: "hard", key: "communeSize", instance: null }, { kind: "taille", unit: "commune", min: null, max: 20000 });
  assert.equal(projetAChangeMateriellement(p, precise), true);
});

test("1. signature : adopter une suggestion à son poids ne change rien ; l'adoption qui survit à l'ancre, si", () => {
  const p = projet({}, [{ key: "vie_locale", weight: 2, source: "ancre" }]);
  const adopte = geste(p, { action: "adopter", criterion: { kind: "preference", key: "vie_locale" }, seen: "pref:vie_locale" });
  assert.equal(signatureDecisionnelle(adopte), signatureDecisionnelle(p), "même critère, même poids : purement narratif");
  const sansBrest = normalizeUserProject({ ...adopte, parsed: { ...adopte.parsed!, preferences: [], communeAncre: [] } })!;
  const sansBrestNiAdoption = normalizeUserProject({ ...p, parsed: { ...p.parsed!, preferences: [], communeAncre: [] } })!;
  assert.notEqual(signatureDecisionnelle(sansBrest), signatureDecisionnelle(sansBrestNiAdoption));
});

test("1. signature : un rejet périme ; la phrase d'interprétation (audit) ne périme rien", () => {
  const p = projet({}, [{ key: "vie_locale", weight: 2, source: "ancre" }]);
  const rejete = geste(p, { action: "rejeter", criterion: { kind: "preference", key: "vie_locale" }, seen: "pref:vie_locale" });
  assert.equal(projetAChangeMateriellement(p, rejete), true);
  const z = projet({ zones: [{ zone: "bretagne", strength: "hard" }] });
  const zones: CriterionRef = { kind: "hard", key: "zones", instance: null };
  const a = geste(z, { action: "confirmer", criterion: zones, seen: criterionFingerprint(z, zones)!, interpretation: "phrase A" });
  const b = geste(z, { action: "confirmer", criterion: zones, seen: criterionFingerprint(z, zones)!, interpretation: "phrase B" });
  assert.equal(signatureDecisionnelle(a), signatureDecisionnelle(b));
});

// ── 2. Région parisienne ───────────────────────────────────────────────────────────────────────

test("2. région parisienne : petite couronne → Île-de-France périme la confirmation", () => {
  const idf: CriterionRef = { kind: "hard", key: "excludeZones", instance: "idf" };
  const p = projet({ excludeZones: ["idf"] });
  const conf = geste(p, { action: "confirmer", criterion: idf, seen: criterionFingerprint(p, idf)!, definition: { kind: "perimetre_parisien", perimetre: "petite_couronne" } });
  assert.equal(isConfirmed(conf, idf), true);
  const elargi = definir(conf, idf, { kind: "perimetre_parisien", perimetre: "ile_de_france" });
  assert.equal(isConfirmed(elargi, idf), false);
  assert.equal(isStale(elargi, idf), true);
});

// ── 3. Macro-zones versionnées ─────────────────────────────────────────────────────────────────

test("3. la v1 du Sud-Ouest a sa liste figée, identique aujourd'hui à la table (sinon : écrire une v2)", () => {
  for (const [token, id] of [["sud", "zone:sud"], ["sud_ouest", "zone:sud-ouest"], ["sud_est", "zone:sud-est"], ["nord", "zone:nord"], ["est", "zone:est"], ["grand_ouest", "zone:grand-ouest"], ["centre", "zone:centre"]]) {
    const conv = conventionPar(id!, 1)!;
    assert.ok(conv.definition.kind === "departements");
    assert.deepEqual([...conv.definition.departements].sort(), [...ZONE_TABLE[token!]!.departements].sort(),
      `${token} : la table a changé ; la v1 reste figée, créez une v2 dans conventions.ts`);
  }
});

test("3. l'évaluation utilise la liste de la convention acceptée, pas la table du jour", () => {
  const dir: PlaceDirectory = { byName: () => null, plmByName: () => null };
  const def = ZONE_TABLE.sud_ouest!;
  const avant = [...def.departements];
  try {
    (def.departements as string[]).push("75"); // la table « évolue »
    const acceptee = hydrateHardConstraints({ zones: [{ zone: "sud_ouest", strength: "hard" }], zonesConventions: [{ token: "sud_ouest", conventionId: "zone:sud-ouest", conventionVersion: 1 }] }, dir);
    const recherche = hydrateHardConstraints({ zones: [{ zone: "sud_ouest", strength: "hard" }] }, dir);
    assert.equal(acceptee.zones?.hardDepartements?.has("75"), false, "la v1 acceptée ne bouge pas");
    assert.equal(recherche.zones?.hardDepartements?.has("75"), true, "la Recherche suit la table");
  } finally {
    (def.departements as string[]).splice(0, def.departements.length, ...avant);
  }
});

// ── 4. Taille qualitative ──────────────────────────────────────────────────────────────────────

test("4. « petite ville, maison avec 3 chambres » ne crée jamais de borne de taille", () => {
  const propose = { reformulation: "x", hardConstraints: { communeSize: { min: 5000, max: 25000 } }, preferences: [], sizeWord: "petite" } as unknown as ParsedProject;
  assert.equal(assainirParsed(propose, "Je cherche une petite ville et une maison avec 3 chambres").hardConstraints.communeSize, null);
  assert.equal(assainirParsed(propose, "Une petite ville à 30 minutes de Nantes").hardConstraints.communeSize, null);
  assert.deepEqual(assainirParsed(propose, "Une ville de 5 000 à 25 000 habitants").hardConstraints.communeSize, { min: 5000, max: 25000, unit: null });
  assert.ok(assainirParsed(propose, "moins de 25k hab").hardConstraints.communeSize);
});

// ── 5. Rejets ──────────────────────────────────────────────────────────────────────────────────

test("5. rejets : Brest propose, le lecteur rejette, Lorient repropose, le texte l'emporte puis s'efface", () => {
  const brest = projet({}, [{ key: "vie_locale", weight: 2, source: "ancre" }]);
  const rejete = geste(brest, { action: "rejeter", criterion: { kind: "preference", key: "vie_locale" }, seen: "pref:vie_locale" });
  assert.equal(effectivePreferences(rejete).some((p) => p.key === "vie_locale"), false);
  assert.deepEqual(rejete.rejets?.[0]?.origin, { kind: "ancre", labels: ["Brest"] });
  assert.deepEqual(rejete.parsed, brest.parsed, "parsed intact");
  // Lorient repropose la même idée : toujours absente.
  const lorient = normalizeUserProject({ ...rejete, parsed: { ...rejete.parsed!, communeAncre: [{ label: "Lorient" }] } })!;
  assert.equal(effectivePreferences(lorient).some((p) => p.key === "vie_locale"), false);
  // Le texte du lecteur l'emporte, sans effacer le rejet.
  const ecrit = normalizeUserProject({ ...lorient, parsed: { ...lorient.parsed!, preferences: [{ key: "vie_locale", weight: 3, source: "parse" }] } })!;
  assert.deepEqual(effectivePreferences(ecrit).find((p) => p.key === "vie_locale"), { key: "vie_locale", weight: 3, source: "parse" });
  assert.equal(ecrit.rejets?.length, 1);
  // La phrase disparaît : le rejet vaut de nouveau.
  const efface = normalizeUserProject({ ...ecrit, parsed: { ...ecrit.parsed!, preferences: [{ key: "vie_locale", weight: 2, source: "ancre" }] } })!;
  assert.equal(effectivePreferences(efface).some((p) => p.key === "vie_locale"), false);
  // Adopter après le refus : le lecteur a changé d'avis.
  const repris = geste(efface, { action: "adopter", criterion: { kind: "preference", key: "vie_locale" }, seen: "pref:vie_locale" });
  assert.equal(repris.rejets, undefined);
  assert.equal(effectivePreferences(repris).some((p) => p.key === "vie_locale"), true);
});

test("5. rejets : rejeter retire l'adoption et la condition ; un critère écrit ne se rejette pas", () => {
  const p = projet({}, [{ key: "vie_locale", weight: 2, source: "ancre" }]);
  const conf = geste(p, { action: "confirmer", criterion: VIE, seen: criterionFingerprint(p, VIE)! });
  assert.equal(conf.adoptions?.length, 1);
  assert.equal(isConfirmed(conf, VIE), true);
  const rejete = geste(conf, { action: "rejeter", criterion: { kind: "preference", key: "vie_locale" }, seen: "pref:vie_locale" });
  assert.equal(rejete.adoptions, undefined);
  assert.equal(rejete.conditions, undefined);
  const ecrit = projet({}, [{ key: "vie_locale", weight: 2, source: "parse" }]);
  const r = appliquerGeste(ecrit, { action: "rejeter", criterion: { kind: "preference", key: "vie_locale" }, seen: "pref:vie_locale" }, NOW);
  assert.equal(r.ok, false);
  assert.equal(!r.ok && r.status, 400);
});

// ── 6. Taille relative ─────────────────────────────────────────────────────────────────────────

const BREST = { insee: "29019", nom: "Brest", lat: 48.39, lon: -4.48, uu: "29701", tailleVille: 202_000, population: 139_000 };
const DIR: PlaceDirectory = {
  byName: (k) => (k === "brest" ? BREST : null),
  plmByName: (k) => (k === "lyon" ? { uu: "00760", pop: 522_250, communePop: 520_000, uuPop: 1_700_000 } : k === "marseille" ? { uu: "00759", pop: 873_076, communePop: null, uuPop: 1_600_000 } : null),
};
function commune(over: Partial<CommuneAttributes>): CommuneAttributes {
  return { insee: "00000", nom: "X", dept: null, lat: null, lon: null, population: null, tailleVille: null, uu: null, altitude: null, reliefProximite: null, merCentreKm: null, ...over };
}
const ctx = (hc: HardConstraints): EvaluationContext => ({ constraints: hydrateHardConstraints(hc, DIR), point: null, conventionsVersion: "test" });
const cap = (hc: HardConstraints) => criterionCapability({ kind: "hard", key: "sizeRelativeTo", hc }, "commune").capability;

test("6. plus petite que Brest : en agglomération et en commune, tranchable", () => {
  assert.equal(cap({ sizeRelativeTo: { label: "Brest", direction: "smaller", unit: "unite_urbaine" } }), "trancher");
  assert.equal(cap({ sizeRelativeTo: { label: "Brest", direction: "smaller", unit: "commune" } }), "trancher");
  assert.equal(cap({ sizeRelativeTo: { label: "Brest", direction: "smaller" } }), "apprecier");
  // Commune de 150 000 habitants dans une petite agglomération : plus grande que la COMMUNE de Brest.
  const c = commune({ insee: "11111", population: 150_000, tailleVille: 160_000, uu: "11701" });
  assert.equal(evaluateSizeRelativeTo(ctx({ sizeRelativeTo: { label: "Brest", direction: "smaller", unit: "commune" } }), c).status, "incompatible");
  assert.equal(evaluateSizeRelativeTo(ctx({ sizeRelativeTo: { label: "Brest", direction: "smaller", unit: "unite_urbaine" } }), c).status, "satisfied");
});

test("6. Paris, Lyon, Marseille : population communale reconstruite ; inconnue, jamais de faux verdict", () => {
  // Les NEUF arrondissements de Lyon, tous chiffrés : la somme. L'INSEE de la commune (69123) n'y entre pas.
  const lyon = Array.from({ length: 9 }, (_, i) => ({ insee: `6938${i + 1}`, population: 50_000 + i }));
  assert.equal(populationCommunalePLM("lyon", [...lyon, { insee: "69123", population: 999 }]), 450_036);
  // Deux arrondissements seulement : inconnue (sept manquent), jamais un total partiel.
  assert.equal(populationCommunalePLM("lyon", lyon.slice(0, 2)), null);
  // Les neuf présents, un sans population : inconnue.
  assert.equal(populationCommunalePLM("lyon", lyon.map((a, i) => (i === 4 ? { ...a, population: null } : a))), null);
  // Paris : 20 arrondissements attendus ; Marseille : 16.
  const paris = Array.from({ length: 20 }, (_, i) => ({ insee: `751${String(i + 1).padStart(2, "0")}`, population: 100_000 }));
  assert.equal(populationCommunalePLM("paris", paris), 2_000_000);
  assert.equal(populationCommunalePLM("paris", paris.slice(1)), null);
  const marseille = Array.from({ length: 16 }, (_, i) => ({ insee: `132${String(i + 1).padStart(2, "0")}`, population: 50_000 }));
  assert.equal(populationCommunalePLM("marseille", marseille), 800_000);
  assert.equal(populationCommunalePLM("marseille", marseille.slice(0, 15)), null);
  assert.equal(populationCommunalePLM("paris", []), null);
  const ref = resolveSizeReference("Lyon", DIR, { context: null } as never);
  assert.ok(ref.status === "resolved" && ref.communePopulation === 520_000 && ref.comparisonPopulation === 1_700_000);
  const c = commune({ insee: "22222", population: 600_000, tailleVille: 600_000 });
  assert.equal(evaluateSizeRelativeTo(ctx({ sizeRelativeTo: { label: "Lyon", direction: "smaller", unit: "commune" } }), c).status, "incompatible");
  // Marseille : somme inconnue → non examiné.
  assert.equal(evaluateSizeRelativeTo(ctx({ sizeRelativeTo: { label: "Marseille", direction: "smaller", unit: "commune" } }), c).status, "unexamined");
  // Un arrondissement évalué n'a pas la population de sa ville : non examiné.
  assert.equal(evaluateSizeRelativeTo(ctx({ sizeRelativeTo: { label: "Brest", direction: "smaller", unit: "commune" } }), commune({ insee: "69383", population: 100_000 })).status, "unexamined");
  // Une référence introuvable : jamais un verdict.
  assert.equal(evaluateSizeRelativeTo(ctx({ sizeRelativeTo: { label: "Nulle-Part", direction: "smaller", unit: "commune" } }), c).status, "unexamined");
});

// ── Revue du 01/10 (2) : critère gardé retirable, provenance multi-ancre ────────────────────────

test("un critère gardé se retire depuis l'écran : « Ça ne compte plus pour moi » rejette, l'ancre ne le repropose plus", () => {
  const p = projet({}, [{ key: "vie_locale", weight: 2, source: "ancre" }]);
  const garde = geste(p, { action: "adopter", criterion: { kind: "preference", key: "vie_locale" }, seen: "pref:vie_locale" });
  const ligne = vueCriteres(garde).find((v) => v.ref.key === "vie_locale")!;
  assert.equal(ligne.adopte, true);
  assert.equal(ligne.etat, "compris");
  const plus = geste(garde, { action: "rejeter", criterion: { kind: "preference", key: "vie_locale" }, seen: ligne.seenEffectif! });
  assert.equal(plus.adoptions, undefined);
  assert.equal(effectivePreferences(plus).some((x) => x.key === "vie_locale"), false);
  assert.equal(vueCriteres(plus).find((v) => v.ref.key === "vie_locale")?.etat, "rejete");
  // Un critère écrit dans le texte n'offre pas ce geste.
  const ecrit = projet({}, [{ key: "vie_locale", weight: 2, source: "parse" }]);
  assert.equal(vueCriteres(ecrit).find((v) => v.ref.key === "vie_locale")?.adopte, false);
});

test("provenance multi-ancre : « Inspiré de Brest et Lorient », gardée telle quelle dans l'adoption et le rejet", () => {
  const p = projet({}, [{ key: "vie_locale", weight: 2, source: "ancre" }], {}, [{ label: "Brest" }, { label: "Lorient" }]);
  assert.equal(vueCriteres(p).find((v) => v.ref.key === "vie_locale")?.titre, "Inspiré de Brest et Lorient : une vie locale animée");
  const garde = geste(p, { action: "adopter", criterion: { kind: "preference", key: "vie_locale" }, seen: "pref:vie_locale" });
  assert.deepEqual(garde.adoptions?.[0]?.origin, { kind: "ancre", labels: ["Brest", "Lorient"] });
  const rejete = geste(garde, { action: "rejeter", criterion: { kind: "preference", key: "vie_locale" }, seen: "pref:vie_locale" });
  assert.deepEqual(rejete.rejets?.[0]?.origin, { kind: "ancre", labels: ["Brest", "Lorient"] });
  // Une adoption de première forme (`label` seul) se lit comme une liste d'un élément.
  const ancienne = normalizeUserProject({ ...p, adoptions: [{ criterion: { kind: "preference", key: "vie_locale" }, weight: 2, origin: { kind: "ancre", label: "Brest" }, adoptedAt: NOW, source: "user" }] })!;
  assert.deepEqual(ancienne.adoptions?.[0]?.origin, { kind: "ancre", labels: ["Brest"] });
});
