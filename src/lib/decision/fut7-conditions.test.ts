// FUT-7 : « CONDITION NON RESPECTÉE » EXIGE UNE CONDITION CONFIRMÉE ET UNE CAPACITÉ À TRANCHER.
//
// Ces tests suivent la VRAIE chaîne du dossier : le projet tel que la base le rend (`normalizeUserProject`),
// l'hydratation partagée avec la recherche, le registre des règles, l'assemblage et le plan de conclusion.
// Ils vérifient ce que le dossier DIT (verdict, cartes, textes), pas seulement ce qu'il contient : « la
// carte apparaît » et « la carte dit vrai » sont deux assertions distinctes (AGENTS.md, 25/07).
//
// Référence : docs/audits/2026-09-30-fut7-capacite-trancher.md (§11, T1 à T20).
import test from "node:test";
import assert from "node:assert/strict";
import { mapCommuneToModuleFacts } from "./module-facts-map.ts";
import { runRules, assertFactValid, REGISTRY } from "./materiality-rules.ts";
import { assembleDossier } from "./decision-assembler.ts";
import { hydrateHardConstraints } from "../hard-constraints-hydrate.ts";
import {
  PRODUCT_CONVENTIONS_VERSION, assessHardConstraints, HARD_CONSTRAINT_KEYS,
  type EvaluationContext, type HardConstraintKey,
} from "../hard-constraints.ts";
import { hardFilter } from "../hard-constraints-filter.ts";
import { communeAttributesFrom } from "../commune-attributes.ts";
import { normalizeUserProject, type UserProject, type CriterionRef } from "../user-project.ts";
import { buildConfirmation, isConfirmed, isStale, preferenceSurfaced, criterionFingerprint } from "./conditions.ts";
import { criterionCapability, ADMIN_REGION_TOKENS, PREFERENCES_SANS_REGLE } from "./capability.ts";
import { projetSansDerivesDAncre } from "./ancres-derivees.ts";
import { gabaritTailleAncre } from "../ancre-gabarit.ts";
import { signatureDecisionnelle, projetAChangeMateriellement } from "./projet-materiel.ts";
import { ZONE_TABLE } from "../geo-zones.ts";
import type { IndexCommune, PreferenceKey } from "../comparateur-vie.ts";
import { PREFERENCE_LABELS } from "../comparateur-labels.ts";

// La liste des préférences, lue dans un module client-safe (comparateur-vie.ts est server-only).
const PREFERENCE_KEYS = Object.keys(PREFERENCE_LABELS) as PreferenceKey[];
import type { PlaceDirectory } from "../hard-constraints-resolve.ts";
import type { DecisionFact, IncompatibilityFact, ModuleFacts } from "./decision-fact.ts";
import type { HardConstraints } from "../hard-constraint-schema.ts";

const LE_1ER_OCTOBRE = "2026-10-01T00:00:00.000Z";

const BREST = { insee: "29019", nom: "Brest", lat: 48.39, lon: -4.48, uu: "29701", tailleVille: 202_000 };
const DIR: PlaceDirectory = {
  byName: (k) => (k === "brest" ? BREST : null),
  plmByName: () => null,
};

function commune(over: Partial<IndexCommune> = {}): IndexCommune {
  return {
    insee: "44109", nom: "Nantes", dept: "44", region: "PDL", lat: 47.22, lon: -1.55,
    population: 323_000, densite: 4900, distance_cote_km: 50, altitude: 20, clim: {}, pct: {},
    ...(over as IndexCommune),
  };
}
const RENNES = commune({ insee: "35238", nom: "Rennes", dept: "35", lat: 48.11, lon: -1.68, distance_cote_km: 60 });
const BREST_COMMUNE = commune({ insee: "29019", nom: "Brest", dept: "29", lat: 48.39, lon: -4.48, uu: "29701", population: 139_000 } as Partial<IndexCommune>);

// Le projet passe par la LECTURE de la base : c'est ce que le dossier lit en production.
function projet(hc: HardConstraints, prefs: { key: string; weight: number }[] = [], extra: Record<string, unknown> = {}): UserProject {
  return normalizeUserProject({
    posture: "recherche", intent: null, rawText: "…", updatedAt: "2026-09-01T00:00:00.000Z",
    parsed: { reformulation: "x", hardConstraints: hc, preferences: prefs },
    ...extra,
  })!;
}

function confirme(p: UserProject, ...refs: CriterionRef[]): UserProject {
  // Comme le geste de FUT-8 : l'empreinte de la valeur que le lecteur a sous les yeux, relue par la base.
  const conditions = refs.map((r) => buildConfirmation(p, r, LE_1ER_OCTOBRE)!);
  return normalizeUserProject({ ...p, conditions })!;
}
const hard = (key: HardConstraintKey): CriterionRef => ({ kind: "hard", key });
const pref = (key: PreferenceKey): CriterionRef => ({ kind: "preference", key });

function factsDe(e: IndexCommune): ModuleFacts {
  const taille = (e as { tailleVille?: number }).tailleVille ?? e.population ?? null;
  return mapCommuneToModuleFacts(e, {}, { hasAddress: false, tailleVille: taille, tailleVilleSource: "commune" });
}

function dossier(e: IndexCommune, p: UserProject) {
  const mf = factsDe(e);
  const ctx: EvaluationContext = {
    constraints: hydrateHardConstraints(p.parsed!.hardConstraints, DIR),
    point: { lat: e.lat!, lon: e.lon!, grain: "commune_reference", source: "commune_centroid", label: e.nom },
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };
  const run = runRules(mf, p, ctx);
  return { run, d: assembleDossier(run, p, "commune", e.nom) };
}

const cartes = (d: ReturnType<typeof dossier>["d"]): DecisionFact[] =>
  d.sections.flatMap((s) => s.cards.flatMap((c) => (c.kind === "fact" ? [c.fact] : [])));
const BRETAGNE: HardConstraints = { zones: [{ zone: "bretagne", strength: "hard" }] };

// ── T1, T2 : LA BRETAGNE ────────────────────────────────────────────────────────

test("T1 « impérativement en Bretagne », jamais confirmé, à Nantes : un écart visible, jamais « Condition non respectée »", () => {
  const { d, run } = dossier(commune(), projet(BRETAGNE));
  assert.equal(run.facts.some((f) => f.role === "incompatibility"), false);
  assert.notEqual(d.narrativePlan.verdictLabel, "Condition non respectée");
  assert.equal(d.criteria.orientation, "arbitration");
  assert.equal(d.narrativePlan.verdict.headline.text, "Nantes répond moins bien à une de vos priorités : la Bretagne.");
  const ecart = cartes(d).find((f) => f.role === "mismatch")!;
  assert.equal(ecart.statement, "Cette commune est hors de la Bretagne, le périmètre qu'indique votre projet.");
  assert.doesNotMatch(d.conclusion, /condition/i);
});

test("T2 la Bretagne CONFIRMÉE, à Nantes : « Condition non respectée », et le constat le dit", () => {
  const { d } = dossier(commune(), confirme(projet(BRETAGNE), hard("zones")));
  assert.equal(d.narrativePlan.verdictLabel, "Condition non respectée");
  assert.equal(d.criteria.orientation, "incompatible");
  assert.equal(d.narrativePlan.verdict.headline.text, "Une condition de votre projet n'est pas remplie à Nantes : la Bretagne.");
  assert.equal(d.narrativePlan.verdict.detail, "Cette commune est hors de la Bretagne, le périmètre qu'indique votre projet.");
});

// ── T3 à T5 : APPRÉCIER, NE PAS MESURER, LE POIDS ────────────────────────────────

test("T3 condition confirmée seulement appréciable, signal DÉFAVORABLE : à confirmer, jamais incompatible, signal exposé", () => {
  const p = confirme(projet({}, [{ key: "proximite_mer", weight: 3 }]), pref("proximite_mer"));
  const { d, run } = dossier(commune({ distance_cote_km: 240 }), p);
  assert.equal(run.facts.some((f) => f.role === "incompatibility"), false);
  assert.equal(d.criteria.orientation, "condition_to_confirm");
  assert.equal(d.narrativePlan.verdictLabel, "Condition à confirmer");
  assert.equal(d.narrativePlan.verdict.headline.text, "Une condition sans compromis reste à confirmer à Nantes : la proximité de la mer.");
  assert.equal(d.narrativePlan.verdict.detail, "Ce que l'on sait penche contre la proximité de la mer.");
  const c = cartes(d).find((f) => f.role === "condition_check")!;
  assert.ok(c.role === "condition_check");
  assert.equal(c.signal, "defavorable");
  assert.equal(c.status, "À confirmer · plutôt défavorable");
  assert.match(c.statement, /240 km/); // le signal disponible
  assert.match(c.whyNotDecided, /sans seuil fixé par vous/); // pourquoi futur•e ne tranche pas
  assert.match(c.consequence, /penche contre cette condition\. Elle reste ouverte/); // ce que cela change
  // L'écart de la règle littorale est RÉUNI dans la carte : il ne se lit pas une seconde fois.
  assert.equal(cartes(d).some((f) => f.role === "mismatch" && f.projectKey === "proximite_mer"), false);
  assert.equal(d.sections[0]!.key, "incompatibilities");
  assert.equal(d.sections[0]!.title, "Vos conditions sans compromis");
});

test("T4 même condition, signal FAVORABLE : reste à confirmer, ne devient JAMAIS « Condition remplie »", () => {
  const p = confirme(projet({}, [{ key: "proximite_mer", weight: 3 }]), pref("proximite_mer"));
  const { d } = dossier(commune({ distance_cote_km: 4 }), p);
  assert.equal(d.criteria.orientation, "condition_to_confirm");
  const c = cartes(d).find((f) => f.role === "condition_check")!;
  assert.ok(c.role === "condition_check" && c.signal === "favorable");
  assert.equal(c.status, "À confirmer · plutôt favorable");
  assert.equal(cartes(d).some((f) => f.role === "condition_met"), false);
  assert.equal(d.narrativePlan.verdict.detail, "Ce que l'on sait va dans le sens de la proximité de la mer, sans pouvoir l'établir.");
  assert.doesNotMatch(d.conclusion, /remplie/);
});

test("T5 condition confirmée NON MESURABLE : dite non évaluable, jamais un verdict", () => {
  const p = confirme(projet({}, [{ key: "faible_pression_agricole", weight: 3 }]), pref("faible_pression_agricole"));
  const { d, run } = dossier(commune(), p);
  assert.equal(run.facts.some((f) => f.role === "incompatibility" || f.role === "condition_check"), false);
  assert.equal(d.criteria.orientation, "condition_to_confirm");
  assert.deepEqual(d.criteria.openConditions.map((c) => c.cause), ["ne_pas_mesurer"]);
  assert.match(d.narrativePlan.verdict.detail, /^futur•e ne sait pas encore évaluer un environnement peu marqué par l'agriculture intensive\./);
  assert.notEqual(d.criteria.coverage, "high");
});

test("T6 préférence de POIDS 3 défavorable, non confirmée : un écart, jamais incompatible", () => {
  const { d } = dossier(commune({ distance_cote_km: 240 }), projet({}, [{ key: "proximite_mer", weight: 3 }]));
  assert.equal(d.criteria.orientation, "arbitration");
  assert.equal(d.narrativePlan.verdict.headline.text, "Nantes répond moins bien à une de vos priorités : la proximité de la mer.");
});

// ── T7, T8 : LEGACY ET CHAMP ABSENT ──────────────────────────────────────────────

test("T7 projet LEGACY avec d'anciennes contraintes dures : aucune ne devient une condition, sur aucune commune", () => {
  const legacy = normalizeUserProject({
    posture: "recherche", rawText: "Il faut absolument la Bretagne, la mer à 10 km, une petite ville, quitter Lyon",
    schemaVersion: 1, updatedAt: "2026-06-01T00:00:00.000Z",
    parsed: {
      reformulation: "x", preferences: [],
      hardConstraints: {
        zones: [{ zone: "bretagne", strength: "hard" }], departements: ["35"], nearSea: { active: true, maxKm: 10 },
        communeSize: { min: 5000, max: 25000 }, montagne: { strength: "hard" }, excludeSea: true,
      },
    },
  })!;
  assert.equal(legacy.conditions, undefined);
  for (const c of [commune(), RENNES, BREST_COMMUNE, commune({ distance_cote_km: 200, altitude: 30 })]) {
    const { d, run } = dossier(c, legacy);
    assert.equal(run.facts.some((f) => f.role === "incompatibility" || f.role === "condition_check" || f.role === "condition_met"), false, c.nom);
    assert.notEqual(d.narrativePlan.verdictLabel, "Condition non respectée", c.nom);
    assert.equal(d.conclusionState === "established_incompatibility", false, c.nom);
  }
});

test("T8 champ de confirmation absent, illisible, ou d'une autre provenance : non confirmé", () => {
  const base = projet(BRETAGNE);
  const fp = criterionFingerprint(base, hard("zones"))!;
  const variantes: unknown[] = [
    undefined, null, "oui", [],
    [{ criterion: { kind: "hard", key: "zones" }, fingerprint: fp, confirmedAt: LE_1ER_OCTOBRE, source: "parser" }],
    [{ criterion: { kind: "hard", key: "zones" }, fingerprint: fp, confirmedAt: "jamais", source: "user" }],
  ];
  for (const v of variantes) {
    const p = normalizeUserProject({ ...base, conditions: v })!;
    assert.equal(isConfirmed(p, hard("zones")), false, JSON.stringify(v));
    assert.notEqual(dossier(commune(), p).d.narrativePlan.verdictLabel, "Condition non respectée");
  }
});

// ── T9 : CONFIRMATION PÉRIMÉE ────────────────────────────────────────────────────

test("T9 confirmation PÉRIMÉE : la Bretagne confirmée, puis le projet dit la Normandie -> plus de verdict", () => {
  const confirmee = confirme(projet(BRETAGNE), hard("zones"));
  const normandie = normalizeUserProject({
    ...confirmee,
    parsed: { ...confirmee.parsed!, hardConstraints: { zones: [{ zone: "normandie", strength: "hard" }] } },
  })!;
  assert.equal(isConfirmed(normandie, hard("zones")), false);
  assert.equal(isStale(normandie, hard("zones")), true);
  assert.equal(normandie.conditions?.length, 1, "la confirmation reste stockée, elle ne vaut plus");
  const { d } = dossier(commune(), normandie);
  assert.notEqual(d.narrativePlan.verdictLabel, "Condition non respectée");
  assert.equal(d.narrativePlan.verdict.headline.text, "Nantes répond moins bien à une de vos priorités : la Normandie.");
});

test("T9b un paramètre qui change le sens de la condition change l'empreinte ; le POIDS d'une préférence non", () => {
  const trente = projet({ nearPlace: { label: "Brest", maxMinutes: 30, mode: "car" } });
  const quaranteCinq = projet({ nearPlace: { label: "Brest", maxMinutes: 45, mode: "car" } });
  assert.notEqual(criterionFingerprint(trente, hard("nearPlace")), criterionFingerprint(quaranteCinq, hard("nearPlace")));
  const aPied = projet({ nearPlace: { label: "Brest", maxMinutes: 30, mode: "walk" } });
  assert.notEqual(criterionFingerprint(trente, hard("nearPlace")), criterionFingerprint(aPied, hard("nearPlace")));

  const soins3 = confirme(projet({}, [{ key: "acces_soins", weight: 3 }]), pref("acces_soins"));
  const soins2 = normalizeUserProject({ ...soins3, parsed: { ...soins3.parsed!, preferences: [{ key: "acces_soins", weight: 2 }] } })!;
  assert.equal(isConfirmed(soins2, pref("acces_soins")), true);
});

// ── T10 : CONDITION TRANCHABLE, DONNÉE MANQUANTE ICI ─────────────────────────────

test("T10 condition confirmée et tranchable, donnée manquante pour cette commune : à vérifier, jamais un verdict", () => {
  const p = confirme(projet({ departements: ["35"] }), hard("departements"));
  const { d, run } = dossier(commune({ dept: null } as Partial<IndexCommune>), p);
  assert.equal(run.facts.some((f) => f.role === "incompatibility"), false);
  assert.deepEqual(d.criteria.openConditions.map((c) => [c.key, c.cause]), [["departements", "donnee_absente"]]);
  assert.match(d.narrativePlan.verdict.detail, /La donnée qui permettrait d'évaluer le département 35 manque ici\./);
  assert.notEqual(d.criteria.coverage, "high");
});

// ── T11 : LA RECHERCHE « OÙ VIVRE » ──────────────────────────────────────────────

test("T11 Recherche « Où vivre » avec filtre strict : le filtre exclut toujours, sans aucune confirmation", () => {
  const constraints = hydrateHardConstraints(BRETAGNE, DIR);
  const filtre = (e: IndexCommune) => {
    const ctx: EvaluationContext = {
      constraints, point: { lat: e.lat!, lon: e.lon!, grain: "commune_reference", source: "commune_centroid", label: e.nom },
      conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
    };
    return hardFilter(assessHardConstraints(ctx, communeAttributesFrom(e, e.population ?? null)));
  };
  assert.equal(filtre(commune()).eligible, false); // Nantes : hors de la Bretagne, écartée de la recherche
  assert.equal(filtre(RENNES).eligible, true);
  assert.equal(filtre(RENNES).complete, true);
});

// ── T12 : AUCUNE CONDITION, AUCUNE PHRASE SUR LES CONDITIONS ─────────────────────

test("T12 projet sans condition confirmée : jamais « Aucune de vos conditions », ni « vos conditions »", () => {
  for (const p of [projet({}, [{ key: "proximite_mer", weight: 3 }]), projet(BRETAGNE, [{ key: "proximite_mer", weight: 2 }])]) {
    for (const c of [commune({ distance_cote_km: 240 }), RENNES]) {
      const { d } = dossier(c, p);
      assert.doesNotMatch(d.conclusion, /Aucune de vos conditions/);
      assert.doesNotMatch(d.conclusion, /vos conditions/);
      assert.equal(d.conclusionState === "no_incompatibility_established", false);
    }
  }
});

// ── T13 : CONDITION REMPLIE ──────────────────────────────────────────────────────

test("T13 condition confirmée, tranchable, satisfaite : « Condition remplie » et le constat, sans bilan global", () => {
  const { d } = dossier(RENNES, confirme(projet(BRETAGNE), hard("zones")));
  const remplie = cartes(d).find((f) => f.role === "condition_met")!;
  assert.ok(remplie.role === "condition_met");
  assert.equal(remplie.status, "Condition remplie");
  assert.equal(remplie.headlineSubject, "la Bretagne");
  assert.equal(remplie.statement, "Cette commune fait partie de la Bretagne, le périmètre qu'indique votre projet.");
  assert.doesNotMatch(d.conclusion, /Toutes vos conditions/);
});

test("T13b une condition remplie et une condition ouverte : jamais « vos conditions sont remplies »", () => {
  const p = confirme(projet(BRETAGNE, [{ key: "proximite_mer", weight: 2 }]), hard("zones"), pref("proximite_mer"));
  const { d } = dossier(commune({ ...RENNES, distance_cote_km: 60 }), p);
  assert.equal(d.criteria.orientation, "condition_to_confirm");
  assert.match(d.narrativePlan.verdict.detail, /La condition la Bretagne est remplie\./);
  assert.doesNotMatch(d.conclusion, /Toutes vos conditions|vos conditions sont remplies/);
});

// ── T14 à T19 : LA CAPACITÉ ──────────────────────────────────────────────────────

test("T14 une distance au point de référence de la commune s'apprécie, elle ne tranche jamais", () => {
  const km = { kind: "hard" as const, key: "nearPlace" as const, hc: { nearPlace: { label: "Brest", maxKm: 20 } } };
  assert.equal(criterionCapability(km, "commune").capability, "apprecier");
  const temps = { kind: "hard" as const, key: "nearPlace" as const, hc: { nearPlace: { label: "Brest", maxMinutes: 30, mode: "car" as const } } };
  assert.deepEqual(criterionCapability(temps, "commune"), { capability: "apprecier", reason: "point_de_reference" });
  const mer = { kind: "hard" as const, key: "nearSea" as const, hc: { nearSea: { active: true, maxKm: 10 } } };
  assert.equal(criterionCapability(mer, "commune").capability, "apprecier");
});

test("T15 à l'adresse : un temps de trajet avec mode tranche ; des kilomètres et la mer s'apprécient (schéma actuel)", () => {
  const temps = { kind: "hard" as const, key: "nearPlace" as const, hc: { nearPlace: { label: "Brest", maxMinutes: 30, mode: "car" as const } } };
  assert.deepEqual(criterionCapability(temps, "adresse"), { capability: "trancher", reason: "temps_de_trajet" });
  const km = { kind: "hard" as const, key: "nearPlace" as const, hc: { nearPlace: { label: "Brest", maxKm: 20 } } };
  assert.deepEqual(criterionCapability(km, "adresse"), { capability: "apprecier", reason: "metrique_non_enregistree" });
  const mer = { kind: "hard" as const, key: "nearSea" as const, hc: { nearSea: { active: true, maxKm: 10 } } };
  assert.deepEqual(criterionCapability(mer, "adresse"), { capability: "apprecier", reason: "point_de_reference" });
  // Sans mode, ou à vélo : non mesurable.
  const sansMode = { kind: "hard" as const, key: "nearPlace" as const, hc: { nearPlace: { label: "Brest", maxMinutes: 30 } } };
  assert.equal(criterionCapability(sansMode, "adresse").capability, "ne_pas_mesurer");
  const velo = { kind: "hard" as const, key: "nearPlace" as const, hc: { nearPlace: { label: "Brest", maxMinutes: 30, mode: "bike" as const } } };
  assert.deepEqual(criterionCapability(velo, "adresse"), { capability: "ne_pas_mesurer", reason: "metrique_non_supportee" });
});

test("T16 la mer confirmée, à 240 km : à confirmer, et jamais « Condition non respectée » (point de référence)", () => {
  const p = confirme(projet({ nearSea: { active: true, maxKm: 10 } }), hard("nearSea"));
  const { d } = dossier(commune({ distance_cote_km: 240 }), p);
  assert.notEqual(d.narrativePlan.verdictLabel, "Condition non respectée");
  const c = cartes(d).find((f) => f.role === "condition_check")!;
  assert.ok(c.role === "condition_check" && c.signal === "defavorable");
  assert.match(c.whyNotDecided, /point de référence de la commune/);
  assert.equal(c.action?.label, "Mesurez la distance réelle depuis l'adresse visée");
});

test("T16b « il nous faut la mer », sans distance, confirmée : la mesure se montre, avec son sens", () => {
  const p = confirme(projet({ nearSea: { active: true } }), hard("nearSea"));
  const { d } = dossier(commune({ distance_cote_km: 240 }), p);
  const c = cartes(d).find((f) => f.role === "condition_check")!;
  assert.ok(c.role === "condition_check");
  assert.equal(c.statement, "Cette commune est à environ 240 km du littoral, mesurés depuis son point de référence.");
  assert.equal(c.signal, "defavorable");
  assert.match(c.whyNotDecided, /ne fixe pas de distance à la mer/);
});

test("T17 taille et « petite ville » : appréciables seulement avec le schéma actuel, confirmées ou non", () => {
  for (const hc of [{ communeSize: { min: 5000, max: 25000 } }, { communeSize: { max: 20000 } }]) {
    assert.deepEqual(criterionCapability({ kind: "hard", key: "communeSize", hc }, "adresse"), { capability: "apprecier", reason: "unite_non_enregistree" });
  }
  assert.equal(criterionCapability({ kind: "hard", key: "sizeRelativeTo", hc: { sizeRelativeTo: { label: "Lyon", direction: "smaller" } } }, "adresse").capability, "apprecier");
  const p = confirme(projet({ communeSize: { min: 5000, max: 25000 } }), hard("communeSize"));
  const { d } = dossier(commune({ population: 26_000 }), p);
  assert.notEqual(d.narrativePlan.verdictLabel, "Condition non respectée");
  const c = cartes(d).find((f) => f.role === "condition_check")!;
  assert.match(c.statement, /au-dessus de la limite de 25 000 qu'indique votre projet/);
  assert.doesNotMatch(c.statement, /vous avez posé/);
});

test("T18 « quitter Lyon » : appréciable seulement, l'agglomération n'a pas été dite", () => {
  assert.deepEqual(
    criterionCapability({ kind: "hard", key: "excludePlace", hc: { excludePlace: [{ label: "Lyon" }] } }, "adresse"),
    { capability: "apprecier", reason: "agglomeration_implicite" },
  );
});

test("T19 les conventions de futur•e ne tranchent jamais ; les régions administratives, si", () => {
  const conv = (key: HardConstraintKey, hc: HardConstraints) => criterionCapability({ kind: "hard", key, hc }, "adresse");
  assert.deepEqual(conv("montagne", { montagne: { strength: "hard" } }), { capability: "apprecier", reason: "convention_produit" });
  assert.equal(conv("reliefProche", { reliefProche: { strength: "hard" } }).capability, "apprecier");
  assert.equal(conv("excludeSea", { excludeSea: true }).capability, "apprecier");
  for (const zone of ["sud", "sud_ouest", "grand_ouest", "atlantique", "pyrenees", "alpes"]) {
    assert.equal(conv("zones", { zones: [{ zone, strength: "hard" }] }).capability, "apprecier", zone);
  }
  assert.equal(conv("zones", { zones: [{ zone: "bretagne", strength: "hard" }] }).capability, "trancher");
  // Une ancre conventionnelle À CÔTÉ d'une région suffit à rendre le périmètre conventionnel.
  assert.equal(conv("zones", { zones: [{ zone: "bretagne", strength: "hard" }, { zone: "atlantique", strength: "hard" }] }).capability, "apprecier");
  assert.equal(conv("excludeZones", { excludeZones: ["idf"] }).capability, "trancher");
  assert.equal(conv("excludeZones", { excludeZones: ["paris"] }).capability, "apprecier");
  assert.equal(conv("departements", { departements: ["35"] }).capability, "trancher");
  // Un critère confirmé « à la montagne », sous 600 m : jamais « Condition non respectée ».
  const p = confirme(projet({ montagne: { strength: "hard" } }), hard("montagne"));
  const { d } = dossier(commune({ altitude: 540 }), p);
  assert.notEqual(d.narrativePlan.verdictLabel, "Condition non respectée");
});

test("la table des régions administratives est exactement celle des conventions « la région … »", () => {
  const regions = Object.entries(ZONE_TABLE).filter(([, z]) => z.convention.startsWith("la région ")).map(([t]) => t).sort();
  assert.deepEqual([...ADMIN_REGION_TOKENS].sort(), regions);
});

test("la capacité ne dépend NI du lieu, NI du poids, NI de la confirmation", () => {
  // Sa signature ne reçoit aucun ModuleFacts ; une préférence vaut « apprécier » à tout poids.
  for (const key of PREFERENCE_KEYS) {
    const c = criterionCapability({ kind: "preference", key }, "commune");
    assert.equal(c.capability, PREFERENCES_SANS_REGLE.includes(key) ? "ne_pas_mesurer" : "apprecier", key);
    assert.deepEqual(criterionCapability({ kind: "preference", key }, "adresse"), c, key);
  }
});

test("« ne pas mesurer » est exactement l'ensemble des préférences qu'aucune règle n'examine", () => {
  // On fait tourner le registre ENTIER sur un projet qui déclare toutes les préférences : une préférence
  // est examinable si au moins une règle la déclare dans ses projectKeys.
  const p = projet({}, PREFERENCE_KEYS.map((key) => ({ key, weight: 3 })));
  const { run } = dossier(commune(), p);
  const examinables = new Set(run.evaluations.flatMap((e) => e.projectKeys));
  const sansRegle = PREFERENCE_KEYS.filter((k) => !examinables.has(k)).sort();
  assert.deepEqual(sansRegle, [...PREFERENCES_SANS_REGLE].sort());
  assert.ok(REGISTRY.length > 0);
});

// ── T20, T21 : LES CONDITIONS OUVERTES RESTENT UTILES ET PRIORITAIRES ───────────

test("T20 une condition ouverte expose signal, limite et conséquence, pas seulement « À confirmer »", () => {
  const p = confirme(projet({ montagne: { strength: "hard" } }), hard("montagne"));
  const { d } = dossier(commune({ altitude: 540 }), p);
  const c = cartes(d).find((f) => f.role === "condition_check")!;
  assert.ok(c.role === "condition_check");
  assert.equal(c.statement, "Cette commune se situe à 540 m d'altitude. Votre exigence de montagne est ici entendue comme une altitude d'au moins 600 m.");
  assert.match(c.whyNotDecided, /convention de futur•e/);
  assert.match(c.consequence, /penche contre cette condition/);
  assert.equal(c.action?.label, "Regardez l'altitude de l'adresse visée");
  for (const f of cartes(d)) assertFactValid(f, p);
});

test("T21 plusieurs conditions ouvertes : elles passent en tête, nommées, sans faux bilan global", () => {
  const p = confirme(
    projet({ montagne: { strength: "hard" } }, [{ key: "proximite_mer", weight: 3 }, { key: "faible_pression_agricole", weight: 2 }]),
    hard("montagne"), pref("proximite_mer"), pref("faible_pression_agricole"),
  );
  const { d } = dossier(commune({ altitude: 540, distance_cote_km: 240 }), p);
  assert.equal(d.criteria.orientation, "condition_to_confirm");
  assert.equal(d.narrativePlan.verdictLabel, "Conditions à confirmer");
  assert.match(d.narrativePlan.verdict.headline.text, /^Trois conditions sans compromis restent à confirmer à Nantes\./);
  assert.match(d.narrativePlan.verdict.detail, /penche contre l'exigence de montagne/);
  assert.match(d.narrativePlan.verdict.detail, /futur•e ne sait pas encore évaluer un environnement peu marqué/);
  assert.doesNotMatch(d.conclusion, /Toutes vos conditions|vos conditions sont remplies/);
  // Les cartes de condition ouvrent la minute.
  const premieres = d.narrativePlan.minute.slice(0, 2);
  assert.ok(premieres.every((id) => id.includes(":condition:")), premieres.join(", "));
});

// ── LES INVARIANTS ───────────────────────────────────────────────────────────────

function incompatibilite(key: HardConstraintKey, grain: "commune" | "adresse"): IncompatibilityFact {
  return {
    id: `x:hard:${key}`, ruleId: `territoire.hard.${key}`, sourceFactIds: ["commune.dept"], module: "territoire",
    role: "incompatibility", evidenceStrength: "established", hardConstraintKey: key, evaluatedGrain: grain,
    materialityTier: "decision_critical", topic: "la situation géographique", statement: "Hors du périmètre.",
    evidence: [{ factId: "commune.dept", module: "territoire", label: "Département · X", observedValue: "département 44", grain: "commune" }],
  };
}

test("INVARIANT : une incompatibilité SANS confirmation est rejetée par la validation", () => {
  assert.throws(() => assertFactValid(incompatibilite("zones", "commune"), projet(BRETAGNE)), /sans condition confirmée/);
});

test("INVARIANT : une incompatibilité sur un critère que futur•e ne sait pas trancher est rejetée", () => {
  const p = confirme(projet({ nearSea: { active: true, maxKm: 10 } }), hard("nearSea"));
  assert.throws(() => assertFactValid(incompatibilite("nearSea", "adresse"), p), /ne sait pas trancher/);
  const t = confirme(projet({ nearPlace: { label: "Brest", maxMinutes: 30, mode: "car" } }), hard("nearPlace"));
  assert.throws(() => assertFactValid(incompatibilite("nearPlace", "commune"), t), /ne sait pas trancher/);
  assert.doesNotThrow(() => assertFactValid(incompatibilite("nearPlace", "adresse"), t));
});

test("INVARIANT : aucune incompatibilité ne sort du moteur sans confirmation, sur les 11 familles", () => {
  const tout: HardConstraints = {
    departements: ["35"], zones: [{ zone: "bretagne", strength: "hard" }], excludeZones: ["pays_de_la_loire"],
    montagne: { strength: "hard" }, reliefProche: { strength: "hard" }, nearSea: { active: true, maxKm: 5 },
    excludeSea: true, nearPlace: { label: "Brest", maxKm: 5 }, communeSize: { max: 1000 },
    excludePlace: [{ label: "Brest" }], sizeRelativeTo: { label: "Brest", direction: "larger" },
  };
  const { run } = dossier(commune(), projet(tout));
  assert.deepEqual(HARD_CONSTRAINT_KEYS.filter((k) => run.evaluations.find((e) => e.ruleId === `territoire.hard.${k}`)?.outcome === "incompatible"), []);
});

test("une préférence confirmée de POIDS 1 se montre ; non confirmée, elle reste tue (le poids ne change pas la capacité)", () => {
  const p1 = projet({}, [{ key: "proximite_mer", weight: 1 }]);
  assert.equal(preferenceSurfaced(p1, "proximite_mer"), false);
  assert.equal(preferenceSurfaced(confirme(p1, pref("proximite_mer")), "proximite_mer"), true);
  const { d } = dossier(commune({ distance_cote_km: 240 }), confirme(p1, pref("proximite_mer")));
  assert.ok(cartes(d).some((f) => f.role === "condition_check"));
});

test("R9 : une préférence de POIDS 1 n'est plus annoncée « qu'aucune règle ne sait examiner »", () => {
  for (const key of ["air_sain", "calme_sonore", "faible_exposition_industrielle", "faible_precip_extremes", "faible_risque_inondation"] as PreferenceKey[]) {
    const { d } = dossier(commune(), projet({}, [{ key, weight: 1 }]));
    const c = d.criteria.registry.find((x) => x.criterionKey === key)!;
    assert.notEqual(c.unexaminedReason, "no_rule", key);
  }
});

// ── LES COMMUNES-ANCRES ──────────────────────────────────────────────────────────

const resoudre = (label: string) => (label.toLowerCase() === "brest" ? { nom: "Brest", tailleVille: 202_000 } : null);

test("« une ville comme Brest » : l'exclusion de Brest et la fourchette EXACTE sont neutralisées dans le dossier", () => {
  const g = gabaritTailleAncre(202_000);
  const p = projet({ communeSize: g, excludePlace: [{ label: "Brest" }, { label: "Lyon" }] }, [], {});
  const avecAncre = normalizeUserProject({ ...p, parsed: { ...p.parsed!, communeAncre: [{ label: "brest" }] } })!;
  const { project: lu, neutralises } = projetSansDerivesDAncre(avecAncre, resoudre);
  assert.deepEqual(neutralises, { excludePlace: ["Brest"], communeSize: true });
  assert.equal(lu.parsed!.hardConstraints.communeSize, undefined);
  assert.deepEqual(lu.parsed!.hardConstraints.excludePlace, [{ label: "Lyon" }]); // « quitter Lyon » reste
  assert.deepEqual(lu.parsed!.communeAncre, [{ label: "brest" }]); // l'ancre elle-même est conservée
  assert.deepEqual(avecAncre.parsed!.hardConstraints.excludePlace, [{ label: "Brest" }, { label: "Lyon" }], "le projet enregistré n'est pas modifié");
});

test("ancre : une fourchette qui n'est pas EXACTEMENT celle de la dérivation n'est jamais neutralisée", () => {
  const p = projet({ communeSize: { min: 80_000, max: 505_000 } });
  const avecAncre = normalizeUserProject({ ...p, parsed: { ...p.parsed!, communeAncre: [{ label: "Brest" }] } })!;
  assert.equal(projetSansDerivesDAncre(avecAncre, resoudre).neutralises.communeSize, false);
  // Ancre inconnue de l'annuaire : on ne devine rien.
  const inconnue = normalizeUserProject({ ...p, parsed: { ...p.parsed!, communeAncre: [{ label: "Ailleurs" }] } })!;
  assert.equal(projetSansDerivesDAncre(inconnue, resoudre).project, inconnue);
});

test("« une ville comme Brest », dossier SUR Brest : jamais « vous souhaitez quitter Brest »", () => {
  const p = projet({ communeSize: gabaritTailleAncre(202_000), excludePlace: [{ label: "Brest" }] });
  const brut = normalizeUserProject({ ...p, parsed: { ...p.parsed!, communeAncre: [{ label: "Brest" }] } })!;
  const lu = projetSansDerivesDAncre(brut, resoudre).project;
  const { d } = dossier(BREST_COMMUNE, lu);
  assert.doesNotMatch(d.conclusion, /quitter/);
  assert.equal(cartes(d).some((f) => /quitter/.test(f.statement)), false);
  assert.notEqual(d.narrativePlan.verdictLabel, "Condition non respectée");
});

// ── LA SIGNATURE DÉCISIONNELLE ───────────────────────────────────────────────────

test("confirmer ou retirer une condition périme un dossier figé ; une confirmation périmée, non", () => {
  const avant = projet(BRETAGNE);
  const confirmee = confirme(avant, hard("zones"));
  assert.equal(projetAChangeMateriellement(avant, confirmee), true);
  assert.equal(projetAChangeMateriellement(confirmee, avant), true);
  // Un projet sans condition signe pareil qu'avant FUT-7 : aucun dossier figé ne se déclare périmé.
  assert.equal(signatureDecisionnelle(avant), signatureDecisionnelle(projet(BRETAGNE)));
  assert.match(signatureDecisionnelle(avant), /§conditions=$/);
  // Une confirmation devenue périmée ne compte plus : seul le changement de périmètre se voit.
  const normandie = normalizeUserProject({
    ...confirmee, parsed: { ...confirmee.parsed!, hardConstraints: { zones: [{ zone: "normandie", strength: "hard" }] } },
  })!;
  assert.match(signatureDecisionnelle(normandie), /§conditions=$/);
});
