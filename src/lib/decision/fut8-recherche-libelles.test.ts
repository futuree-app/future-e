// FUT-8, étape 6 (Recherche ≠ Projet) et registre des libellés humains (§9).
import test from "node:test";
import assert from "node:assert/strict";
import { parsedPourLeProjet, apercuReprise } from "./recherche-vers-projet.ts";
import { presenterCritere, identiteDeVille, enLieuFr } from "./criterion-labels.ts";
import { normalizeName } from "../hard-constraints-resolve.ts";
import { normalizeUserProject, type UserProject } from "../user-project.ts";
import { effectiveProject, parsedFingerprint } from "./effective-value.ts";
import { gabaritTailleAncre } from "../ancre-gabarit.ts";
import type { ParsedProject } from "../comparateur-vie.ts";
import type { HardConstraints } from "../hard-constraint-schema.ts";

const BREST = { nom: "Brest", tailleVille: 202_000 };
const resoudre = (l: string) => (normalizeName(l) === "brest" ? BREST : null);
const recherche = (over: Partial<ParsedProject>): ParsedProject => ({ reformulation: "x", hardConstraints: {}, preferences: [], ...over } as ParsedProject);

test("reprise : une recherche ancienne perd ses dérivés d'ancre ; la provenance « inspiré de Brest » reste", () => {
  const ancienne = recherche({
    hardConstraints: { excludePlace: [{ label: "Brest" }], communeSize: gabaritTailleAncre(202_000), zones: [{ zone: "bretagne", strength: "hard" }] },
    preferences: [{ key: "vie_locale", weight: 2, source: "ancre" }, { key: "cadre_calme", weight: 3 }],
    communeAncre: [{ label: "Brest" }],
    ancreSansTaille: true,
  });
  const p = parsedPourLeProjet(ancienne, "une ville comme Brest, en Bretagne, au calme", resoudre)!;
  assert.deepEqual(p.hardConstraints.excludePlace, []);
  assert.equal(p.hardConstraints.communeSize ?? null, null);
  assert.deepEqual(p.hardConstraints.zones, [{ zone: "bretagne", strength: "hard" }]);
  assert.deepEqual(p.preferences, [{ key: "vie_locale", weight: 2, source: "ancre" }, { key: "cadre_calme", weight: 3, source: "parse" }]);
  assert.equal(p.ancreSansTaille, undefined);
  assert.deepEqual(p.communeAncre, [{ label: "Brest" }]);
});

test("reprise : « petite ville » sans chiffre n'emporte aucune borne dans le projet", () => {
  const p = parsedPourLeProjet(recherche({ hardConstraints: { communeSize: { min: 5000, max: 25000 } }, sizeWord: "petite" }), "une petite ville", resoudre)!;
  assert.equal(p.hardConstraints.communeSize, null);
});

test("aperçu : ce qui est retenu, en langage du lecteur ; ce qui reste propre à la recherche", () => {
  const r = recherche({ hardConstraints: { zones: [{ zone: "bretagne", strength: "hard" }] }, preferences: [{ key: "vie_locale", weight: 2, source: "ancre" }], communeAncre: [{ label: "Brest" }] });
  const a = apercuReprise(parsedPourLeProjet(r, "comme Brest en Bretagne", resoudre)!, r);
  assert.ok(a.retenus.includes("Vivre en Bretagne"), a.retenus.join(" | "));
  assert.ok(a.retenus.some((t) => t.startsWith("Inspiré de Brest")), a.retenus.join(" | "));
  assert.deepEqual(a.propresALaRecherche, ["ne pas vous reproposer Brest", "des villes d'une taille proche de Brest"]);
});

function projet(hc: HardConstraints, extra: Record<string, unknown> = {}): UserProject {
  return normalizeUserProject({ posture: "recherche", rawText: "…", parsed: { reformulation: "x", hardConstraints: hc, preferences: [] }, ...extra })!;
}

test("libellés : région, macro-zone, ville à quitter, distance, taille ; la question n'existe que si une précision manque", () => {
  assert.deepEqual(presenterCritere(projet({ zones: [{ zone: "bretagne", strength: "hard" }] }), { kind: "hard", key: "zones" }), {
    titre: "Vivre en Bretagne", court: "la Bretagne",
    interpretation: "Pour cette analyse, futur•e considère ici la Bretagne dans ses limites régionales actuelles.",
  });
  assert.equal(presenterCritere(projet({ zones: [{ zone: "sud_ouest", strength: "hard" }] }), { kind: "hard", key: "zones" })?.titre, "Vivre dans le Sud-Ouest");
  const lyon = presenterCritere(projet({ excludePlace: [{ label: "Lyon" }, { label: "Bordeaux" }] }), { kind: "hard", key: "excludePlace", instance: "lyon" })!;
  assert.equal(lyon.titre, "Quitter Lyon");
  assert.equal(lyon.question, "Quitter la commune de Lyon, ou toute son agglomération ?");
  const km = presenterCritere(projet({ nearPlace: { label: "Nantes", maxKm: 20 } }), { kind: "hard", key: "nearPlace" })!;
  assert.equal(km.titre, "Être à moins de 20 km de Nantes");
  assert.equal(km.question, "Par 20 km, vous pensez à vol d'oiseau ou par la route ?");
  const brut = projet({ nearPlace: { label: "Nantes", maxKm: 20 } });
  const ref = { kind: "hard" as const, key: "nearPlace" as const, instance: null };
  const precise = normalizeUserProject({ ...brut, definitions: [{ kind: "distance_lieu", metric: "vol_oiseau", maxKm: 20, criterion: ref, parsedFingerprint: parsedFingerprint(brut, ref), definedAt: "2026-10-01T00:00:00.000Z", source: "user" }] })!;
  const eff = presenterCritere(effectiveProject(precise), ref)!;
  assert.equal(eff.interpretation, "À vol d'oiseau, depuis votre logement.");
  assert.equal(eff.question, undefined);
  assert.equal(presenterCritere(projet({ communeSize: { max: 20000, unit: "commune" } }), { kind: "hard", key: "communeSize" })?.titre, "Une commune de moins de 20 000 habitants");
  assert.equal(presenterCritere(projet({ excludeZones: ["idf"], excludeZonesDits: [{ token: "idf", said: "la région parisienne" }] }), { kind: "hard", key: "excludeZones", instance: "idf" })?.titre, "Éviter la région parisienne");
});

test("libellés : « petite ville » est un mot, jamais des bornes", () => {
  const p = normalizeUserProject({ posture: "recherche", rawText: "…", parsed: { reformulation: "x", hardConstraints: {}, preferences: [{ key: "eviter_grandes_villes", weight: 2 }], sizeWord: "petite" } })!;
  assert.deepEqual(presenterCritere(p, { kind: "preference", key: "eviter_grandes_villes" }), { titre: "Une petite ville", court: "la taille de la ville" });
});

test("l'identité d'une ville côté navigateur est celle du moteur", () => {
  for (const v of ["Lyon", "Saint-Étienne", "L'Haÿ-les-Roses", "Aix-en-Provence", "Bourg-en-Bresse"]) assert.equal(identiteDeVille(v), normalizeName(v));
  assert.equal(enLieuFr("l'Occitanie"), "en Occitanie");
  assert.equal(enLieuFr("les Pays de la Loire"), "dans les Pays de la Loire");
});
