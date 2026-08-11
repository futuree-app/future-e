import test from "node:test";
import assert from "node:assert/strict";
import { runRules } from "./materiality-rules.ts";
import { SOURCES } from "./logement-rules.ts";
import { GESTES } from "./logement-gestes.ts";
import type { ModuleFacts, LogementFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import type { EvaluationContext } from "../hard-constraints.ts";

function lf(over: Partial<LogementFacts> = {}): LogementFacts {
  return { dpe: "correct", dpeLabel: null, rga: "none", expositionBati: false, pprn: "none", zoneReglementee: false, pprnLabel: null, cavites: "none", caviteProche: false, patrimoine: "none", perimetrePatrimonial: false, sinistralite: "none", sinistraliteActive: false, addressLabel: "7 Rue du Taur", ...over };
}
function facts(logement?: LogementFacts): ModuleFacts {
  return {
    insee: "31555", nom: "Toulouse", dept: "31", lat: 43.6, lon: 1.44, uu: "31701",
    tailleVille: 1_060_000, tailleVilleSource: "urban_unit", reliefProximite: 0, distanceCoteKm: 150, population: 500000, altitude: 146,
    catnatInondation: 0, inondationRisque: 10, climat: null, scores: {}, hasAddress: true, logement,
  };
}
// Aucune contrainte dure déclarée : les 11 évaluations rendent not_declared, et les règles Logement
// (qui n'en déclarent que deux paramètres) l'ignorent.
const HARD: EvaluationContext = {
  constraints: {
    departements: null, zones: null, excludeZones: null, montagne: false, reliefProche: false,
    nearSea: null, excludeSea: false, communeSize: null, nearPlace: null, excludePlace: [], sizeRelativeTo: null,
  },
  point: { lat: 43.6, lon: 1.44, grain: "commune_reference", source: "commune_centroid", label: "Toulouse" },
  conventionsVersion: "hc-conv-1",
};
function project(over: Partial<UserProject> = {}): UserProject {
  return { posture: "recherche", intent: null, rawText: null, parsed: { reformulation: "x", hardConstraints: {}, preferences: [] } as UserProject["parsed"], updatedAt: null, ...over };
}

test("bloc logement absent -> aucune règle Logement", () => {
  assert.equal(runRules(facts(undefined), project(), HARD).facts.some((f) => f.ruleId.startsWith("logement.")), false);
});

test("DPE passoire -> verification, preuve persisted_snapshot, classe exacte", () => {
  const f = runRules(facts(lf({ dpe: "passoire", dpeLabel: "G" })), project({ intent: "achat" }), HARD).facts.find((x) => x.ruleId === "logement.dpe-faible");
  assert.ok(f && f.role === "verification");
  assert.equal(f.evidence[0].sourceMode, "persisted_snapshot");
  assert.match(f.statement, /G/);
  assert.match(f.statement, /passoire/i);
});

test("cavités unavailable -> unknown scopée, pas verification", () => {
  const f = runRules(facts(lf({ cavites: "unavailable" })), project(), HARD).facts.find((x) => x.ruleId === "logement.cavite");
  assert.ok(f && f.role === "unknown");
  assert.equal(f.impact, "scoped");
});

test("cavités none -> aucun fait", () => {
  assert.equal(runRules(facts(lf({ cavites: "none" })), project(), HARD).facts.some((x) => x.ruleId === "logement.cavite"), false);
});

test("PPRN present -> verification, preuve live_fetch", () => {
  const f = runRules(facts(lf({ pprn: "present", zoneReglementee: true })), project({ intent: "achat" }), HARD).facts.find((x) => x.ruleId === "logement.zone-reglementee");
  assert.ok(f && f.role === "verification");
  assert.equal(f.evidence[0].sourceMode, "live_fetch");
});

test("patrimoine present : pas de fait en location", () => {
  assert.equal(runRules(facts(lf({ patrimoine: "present", perimetrePatrimonial: true })), project({ intent: "location" }), HARD).facts.some((x) => x.ruleId === "logement.patrimoine"), false);
});

test("aucune règle Logement n'émet incompatibility", () => {
  const r = runRules(facts(lf({ dpe: "passoire", rga: "present", expositionBati: true, pprn: "present", zoneReglementee: true, cavites: "present", caviteProche: true, patrimoine: "present", perimetrePatrimonial: true, sinistralite: "present", sinistraliteActive: true })), project({ intent: "achat" }), HARD);
  assert.equal(r.facts.some((f) => f.ruleId.startsWith("logement.") && f.role === "incompatibility"), false);
});

test("texte posture-aware : achat parle de fondations, location de bailleur (RGA)", () => {
  const achat = runRules(facts(lf({ rga: "present", expositionBati: true })), project({ intent: "achat" }), HARD).facts.find((x) => x.ruleId === "logement.exposition-bati");
  const loc = runRules(facts(lf({ rga: "present", expositionBati: true })), project({ intent: "location" }), HARD).facts.find((x) => x.ruleId === "logement.exposition-bati");
  assert.ok(achat && achat.role === "verification" && loc && loc.role === "verification");
  assert.match(achat.action.label, /fondation|sinistre|antécédent/i);
  assert.match(loc.action.label, /bailleur/i);
});

// LES 23 VARIANTES POSTURE-AWARE. Le lot A2 les a réécrites d'un bloc : ce test tient le contrat que
// la table doit respecter, plutôt que de recopier vingt-trois libellés qu'il faudrait maintenir deux
// fois. Ce qui compte n'est pas le mot exact, c'est qu'aucune variante ne redevienne une ligne de
// formulaire ni un pavé qui rivalise avec le constat.
test("les libellés d'action tiennent leur contrat, dans les quatre postures", () => {
  // Toutes les familles déclenchées d'un coup, pour balayer les six tables.
  const tout = lf({
    dpe: "passoire", dpeLabel: "G",
    rga: "present", expositionBati: true,
    pprn: "present", zoneReglementee: true, pprnLabel: "PPR Sécheresse",
    cavites: "present", caviteProche: true,
    patrimoine: "present", perimetrePatrimonial: true,
    sinistralite: "present", sinistraliteActive: true,
  });
  const POSTURES: Partial<UserProject>[] = [
    {},                                                  // neutre
    { intent: "achat" },                                 // achat
    { intent: "location" },                              // location
    { posture: "habitant" },                             // réside
  ];
  const vus: string[] = [];
  for (const over of POSTURES) {
    for (const f of runRules(facts(tout), project(over), HARD).facts) {
      if (!f.ruleId.startsWith("logement.")) continue;
      const a = (f as { action?: { label: string; detail?: string } }).action;
      if (!a) continue;
      vus.push(a.label);
      assert.ok(a.label.length > 0, `${f.ruleId} : libellé vide dans cette posture`);
      assert.ok(a.label.length <= 70, `« ${a.label} » : ${a.label.length} caractères`);
      assert.doesNotMatch(a.label, /[.!?]$/, `« ${a.label} » se termine comme une phrase`);
      // Le detail, lui, EST une phrase : il descend au dépliable, sous « À vérifier ».
      if (a.detail) assert.match(a.detail, /[.!?]$/, `le detail n'est pas ponctué : « ${a.detail} »`);
    }
  }
  assert.ok(vus.length >= 20, `attendu au moins 20 actions balayées, obtenu ${vus.length}`);
  // « Vérifiez » ne doit plus ouvrir toute la colonne : cinq libellés sur sept le faisaient, et une
  // page de cartes se lisait comme un formulaire.
  const verifiez = vus.filter((l) => /^Vérifiez/.test(l)).length;
  assert.ok(verifiez <= 2, `${verifiez} libellés commencent par « Vérifiez » : la colonne redevient un formulaire`);
});

// L'ÉTAT ÉTABLI, SCANNABLE. Chaque fait logement porte une observation courte (« Aléa moyen ou fort »)
// que l'écran affiche avant le constat, pour qu'on VOIE l'information avant de lire la phrase. Le
// contrat : court, sans point final (ce n'est pas une phrase), et présent sur les cinq familles + DPE.
test("chaque fait logement porte un état établi court", () => {
  const tout = lf({
    dpe: "passoire", dpeLabel: "G", rga: "present", expositionBati: true,
    pprn: "present", zoneReglementee: true, pprnLabel: "PPR", cavites: "present", caviteProche: true,
    patrimoine: "present", perimetrePatrimonial: true, sinistralite: "present", sinistraliteActive: true,
  });
  const emis = runRules(facts(tout), project({ intent: "achat" }), HARD).facts.filter((f) => f.ruleId.startsWith("logement."));
  assert.ok(emis.length >= 6, `attendu 6 familles, obtenu ${emis.length}`);
  for (const f of emis) {
    const st = (f as { status?: string }).status;
    assert.ok(st && st.length > 0, `${f.ruleId} : pas d'état établi`);
    assert.ok(st!.length <= 30, `${f.ruleId} : état trop long (« ${st} »)`);
    assert.doesNotMatch(st!, /[.!?]$/, `${f.ruleId} : l'état se termine comme une phrase`);
  }
});

// L'état scannable étant rendu en étiquette AU-DESSUS du constat, le constat ne doit pas le recopier.
// Les argiles finissaient par « (aléa moyen ou fort) », mot pour mot le StatusTag à un centimètre.
test("argiles : la sévérité vit dans l'état scannable, pas recopiée en parenthèse dans le constat", () => {
  const f = runRules(facts(lf({ rga: "present", expositionBati: true })), project({ intent: "achat" }), HARD)
    .facts.find((x) => x.ruleId === "logement.exposition-bati");
  assert.ok(f && f.role === "verification");
  assert.equal((f as { status?: string }).status, "Aléa moyen ou fort");
  assert.match(f.statement, /retrait-gonflement des argiles/);
  assert.doesNotMatch(f.statement, /aléa/i); // plus de « (aléa moyen ou fort) » : le StatusTag le porte
});

// ── CONFORT D'ÉTÉ (29/07/2026) ───────────────────────────────────────────────

test("CONFORT D'ÉTÉ : le geste entre enfin dans le moteur, en `secondary`", () => {
  // Il existait dans la checklist depuis toujours sans jamais peser sur le dossier : la donnée
  // (bloc confort du DPE) était là, la décision ne la lisait pas.
  const r = runRules(facts(lf({ confortEteInsuffisant: true })), project(), HARD);
  const f = r.facts.find((x) => x.ruleId === "logement.confort-ete")!;
  assert.ok(f, "aucun fait de confort d'été");
  assert.equal(f.materialityTier, "secondary");
  assert.equal(f.role, "verification");
  assert.match(f.statement, /insuffisant/);
});

test("CONFORT D'ÉTÉ : rien quand l'indicateur n'est pas insuffisant", () => {
  const r = runRules(facts(lf({ confortEteInsuffisant: false })), project(), HARD);
  assert.equal(r.facts.find((x) => x.ruleId === "logement.confort-ete"), undefined);
});

test("CONFORT D'ÉTÉ : la limitation dit que l'indicateur décrit le BÂTI, pas le vécu", () => {
  const r = runRules(facts(lf({ confortEteInsuffisant: true })), project(), HARD);
  const f = r.facts.find((x) => x.ruleId === "logement.confort-ete")!;
  assert.match(f.limitation!, /étage|orientation|usages/);
});

test("CONFORT D'ÉTÉ : le geste vient de la table PARTAGÉE, pas d'une copie locale", () => {
  const r = runRules(facts(lf({ confortEteInsuffisant: true })), project(), HARD);
  const f = r.facts.find((x) => x.ruleId === "logement.confort-ete")!;
  assert.equal(f.action!.label, GESTES.confort.neutre.label);
});

test("LE GESTE SUIT LA POSTURE, depuis la même table que la checklist", () => {
  for (const [intent, bucket] of [["achat", "achat"], ["location", "location"]] as const) {
    const r = runRules(facts(lf({ confortEteInsuffisant: true })), project({ intent }), HARD);
    const f = r.facts.find((x) => x.ruleId === "logement.confort-ete")!;
    assert.equal(f.action!.label, GESTES.confort[bucket].label);
  }
});

test("AUCUN LIBELLÉ DU MODULE N'OUVRE PAR « VÉRIFI »", () => {
  // Miroir du test de la checklist : les deux chemins lisent la même table, donc la même règle
  // éditoriale doit tenir des deux côtés.
  for (const geste of Object.values(GESTES)) {
    for (const copy of Object.values(geste)) {
      assert.doesNotMatch(copy.label, /^Vérifi/, `« ${copy.label} » ouvre par « Vérifi »`);
    }
  }
});

// ── La preuve nomme sa SOURCE, jamais l'objet analysé ──────────────────────────────────────────

test("aucune preuve du logement ne présente l'adresse comme sa source", () => {
  // Vu à l'écran sur un dossier payé le 10/08/2026, dans cinq volets « Données et limites » :
  //
  //     Source : 29 Rue de l'Evescot 17000 La Rochelle
  //
  // L'adresse est ce qu'on analyse. La présenter comme la provenance de la donnée vide de son sens
  // le seul mot qui engage futur•e, sur le produit dont la traçabilité est l'argument.
  //
  // Le module Territoire n'a jamais eu ce défaut (« Géorisques · Toulouse »).
  const adresse = "7 Rue du Taur";
  const l = lf({
    addressLabel: adresse,
    rga: "present", expositionBati: true,
    pprn: "present", zoneReglementee: true,
    cavites: "present", caviteProche: true,
    patrimoine: "present", perimetrePatrimonial: true,
    sinistralite: "present", sinistraliteActive: true,
    dpe: "passoire", dpeLabel: "G",
    confortEteInsuffisant: true,
    diagnosticNonAttribue: true,
  });
  const facts_ = runRules(facts(l), project({ intent: "achat" }), HARD).facts
    .filter((f) => f.ruleId.startsWith("logement."));
  assert.equal(facts_.length, 8, `les huit règles du module doivent émettre, reçu ${facts_.length}`);

  for (const f of facts_) {
    const refs = f.role === "compromise" ? f.sides.flatMap((s) => s.evidence) : f.evidence;
    for (const e of refs) {
      assert.notEqual(e.label, adresse, `${f.ruleId} présente l'adresse comme source`);
      assert.ok(e.label.trim().length > 0, `${f.ruleId} : source vide`);
      // Un producteur, pas une paraphrase de l'objet : le libellé doit nommer qui publie la donnée.
      assert.match(
        e.label,
        /Géorisques|ONRN|ADEME|Géoportail de l'urbanisme/,
        `${f.ruleId} : « ${e.label} » ne nomme aucun producteur connu`,
      );
    }
  }
});

test("chaque règle du module porte le libellé de source EXACT de sa famille", () => {
  // REGEX BANNIE ICI (revue du 11/08/2026). Une expression comme /Géorisques/ passait aussi bien
  // sur « Géorisques (BRGM) » que sur « BRGM, via Géorisques » : elle protégeait une forme, pas une
  // attribution. On compare au libellé exact, et les huit règles sont couvertes, y compris le
  // confort d'été et le diagnostic non attribué, qu'une version antérieure de ce test oubliait.
  const attendu: Record<string, string> = {
    "logement.exposition-bati": SOURCES.georisquesBrgm,
    "logement.zone-reglementee": SOURCES.georisquesGaspar,
    "logement.cavite": SOURCES.georisquesBrgm,
    "logement.patrimoine": SOURCES.gpu,
    "logement.sinistralite": SOURCES.onrn,
    "logement.dpe-faible": SOURCES.ademe,
    "logement.confort-ete": SOURCES.ademe,
    "logement.diagnostic-non-attribue": SOURCES.ademe,
  };
  const l = lf({
    rga: "present", expositionBati: true, pprn: "present", zoneReglementee: true,
    cavites: "present", caviteProche: true, patrimoine: "present", perimetrePatrimonial: true,
    sinistralite: "present", sinistraliteActive: true, dpe: "passoire", dpeLabel: "G",
    confortEteInsuffisant: true, diagnosticNonAttribue: true,
  });
  const produits = runRules(facts(l), project({ intent: "achat" }), HARD).facts;
  for (const [ruleId, source] of Object.entries(attendu)) {
    const f = produits.find((x) => x.ruleId === ruleId);
    assert.ok(f, `règle ${ruleId} absente du run`);
    const refs = f.role === "compromise" ? f.sides.flatMap((s) => s.evidence) : f.evidence;
    assert.equal(refs[0]!.label, source, `${ruleId} : source « ${refs[0]!.label} »`);
  }
});

test("les libellés de source disent la chaîne d'accès, pas un producteur unique", () => {
  // Ce que la revue a corrigé : la CCR produit les données assurantielles que l'ONRN publie et que
  // Géorisques diffuse ; l'IGN OPÈRE API Carto sans produire les servitudes. Un libellé qui
  // nommerait un « producteur » unique serait une promesse de rigueur là où l'on tient une
  // commodité d'affichage.
  assert.match(SOURCES.onrn, /CCR/, "la CCR produit la donnée d'indemnisation");
  assert.match(SOURCES.onrn, /1995-2021/, "le millésime connu doit être dit tant qu'aucun champ ne le porte");
  assert.match(SOURCES.gpu, /via API Carto/, "l'IGN opère le service, il ne produit pas la servitude");
  for (const source of Object.values(SOURCES)) {
    assert.equal(source.includes("producteur"), false, "le mot promet plus que ce que la forme tient");
  }
});
