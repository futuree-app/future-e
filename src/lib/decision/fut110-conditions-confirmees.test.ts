// FUT-110 : « IL Y A QUELQUE CHOSE À VÉRIFIER » N'EST PAS « CELA PENCHE CONTRE VOTRE CONDITION ».
//
// Le cas d'origine (FUT-85, §D.1) : sur une adresse de Châtelaillon-Plage, le lecteur confirme l'accès aux
// soins comme condition sans compromis. La commune est parmi les 20 % les plus favorables, un médecin est
// recensé à 550 m, et la carte disait « Ouverte · plutôt défavorable », puis « Ce que l'on sait penche
// contre cette condition ». Le rang favorable avait disparu derrière la seule phrase du médecin.
//
// Ces tests suivent la vraie chaîne (`runRules` → conditions → `composeFacts` → `assembleDossier`) et
// vérifient ce que le dossier RACONTE : le signal, l'état, le constat, l'échelle de chaque phrase, la
// conséquence, le geste, les preuves, la section où vit chaque fait, et le verdict. « La carte apparaît »
// et « la carte dit vrai » sont deux assertions distinctes (AGENTS.md).
//
// Les rangs sont FICTIFS (posés à la main), les distances sont celles du cas d'origine.
import test from "node:test";
import assert from "node:assert/strict";
import { mapCommuneToModuleFacts } from "./module-facts-map.ts";
import { runRules, REGISTRY } from "./materiality-rules.ts";
import { assembleDossier } from "./decision-assembler.ts";
import { composeFacts, assertCompositionsValid } from "./fact-compositions.ts";
import { buildDecisionArtifact, parseDecisionArtifact, ENGINE_VERSION } from "./decision-artifact.ts";
import { buildClimatFacts, type ClimatFacts, type GwlScenarios } from "./climat-facts.ts";
import { buildConfirmation } from "./conditions.ts";
import { VERIFICATIONS_ORIENTEES } from "./condition-rules.ts";
import { buildAutourFacts } from "./autour-facts.ts";
import { buildSecteurFacts } from "./secteur-facts.ts";
import { hydrateHardConstraints } from "../hard-constraints-hydrate.ts";
import { PRODUCT_CONVENTIONS_VERSION, type EvaluationContext } from "../hard-constraints.ts";
import { normalizeUserProject, type UserProject } from "../user-project.ts";
import type { IndexCommune, PreferenceKey } from "../comparateur-vie.ts";
import type { ConditionCheckFact, DecisionFact, Dossier, ModuleFacts } from "./decision-fact.ts";
import type { Face3Snapshot } from "../logement-autour-types.ts";

// ── FIXTURES ─────────────────────────────────────────────────────────────────────────────────────

const FAVORABLE: [number, number] = [8500, 9000];
const NEUTRE: [number, number] = [4500, 5500];
const DEFAVORABLE: [number, number] = [1000, 1500];

// Les phrases d'avant FUT-110, qui doivent rester celles des cartes sans constat à confirmer.
const POURQUOI_COMMUNE =
  "Cette lecture est faite à l'échelle de la commune, sans seuil fixé par vous. Elle éclaire votre condition sans pouvoir la trancher.";
const CONSEQUENCE_CONTRE = "Ce que l'on sait penche contre cette condition. Elle reste ouverte : à vérifier avant de décider.";
const CONSEQUENCE_POUR = "Ce que l'on sait va dans le sens de cette condition. Elle reste ouverte : à confirmer avant de décider.";
const CONSEQUENCE_NEUTRE = "Elle reste ouverte : à vérifier avant de décider.";

const CHATELAILLON = {
  insee: "17094", nom: "Châtelaillon-Plage", dept: "17", region: "Nouvelle-Aquitaine", lat: 46.07, lon: -1.08,
  population: 6000, densite: 900, mer_centre_km: 0.5, altitude: 5, clim: {}, pct: {},
} as unknown as IndexCommune;

function snapshot(categories: unknown[]): Face3Snapshot {
  return {
    center: { lat: 46.07, lon: -1.08 },
    bpe: { categories },
    osm: { potentiallyNoisyInfrastructure: [], nearestMappedGreenSpace: null, bboxRadiusMeters: 1500 },
    sourceStatus: { bpe: "complete", osmInfrastructure: "complete", osmGreenSpaces: "complete" },
    sources: { bpeVersion: "face3-2026-07-08e", osmFetchedAt: null, osmQueryVersion: "v1", bpeMillesime: "2025" },
    computedAt: "2026-09-21T10:00:00.000Z",
  } as unknown as Face3Snapshot;
}
const cat = (category: string, nearest: unknown) => ({ category, nearest, searchCapMeters: 5000, withinWalkCount: nearest ? 1 : 0 });
const MEDECIN = buildAutourFacts(snapshot([cat("sante", { distanceMeters: 553, typeLabel: "Médecin généraliste" })]));
const SANS_SOINS = buildAutourFacts(snapshot([cat("sante", null)]));
const GARE = buildAutourFacts(snapshot([cat("transports", { distanceMeters: 600, typeLabel: "Gare" })]));
const SANS_GARE = buildAutourFacts(snapshot([cat("transports", null)]));
const SOINS_ET_GARE = buildAutourFacts(snapshot([
  cat("sante", { distanceMeters: 553, typeLabel: "Médecin généraliste" }),
  cat("transports", { distanceMeters: 600, typeLabel: "Gare" }),
]));
const MOINS_MOTORISE = buildSecteurFacts({ kind: "secteur", share: 45, communeShare: 70, irisCode: "170940101" });
const PLUS_MOTORISE = buildSecteurFacts({ kind: "secteur", share: 88, communeShare: 70, irisCode: "170940102" });

const SC_EXPOSEE: GwlScenarios = {
  gwl15: { h: "2030", v: { NORTX35D_yr: 8, ATX35D_yr: 5, NORTR_yr: 48, ATR_yr: 15, NORIFM40_yr: 40, AIFM40_yr: 6, NORRx1d_yr: 70, ARRx1d_yr: 0.08 } },
  gwl20: { h: "2050", v: { NORTX35D_yr: 14, ATX35D_yr: 11, NORTR_yr: 69, ATR_yr: 36, NORIFM40_yr: 50, AIFM40_yr: 16, NORRx1d_yr: 74, ARRx1d_yr: 0.14 } },
  gwl30: { h: "2100", v: { NORTX35D_yr: 26, ATX35D_yr: 23, NORTR_yr: 95, ATR_yr: 62, NORIFM40_yr: 70, AIFM40_yr: 36, NORRx1d_yr: 84, ARRx1d_yr: 0.29 } },
};
const SC_EPARGNEE: GwlScenarios = {
  gwl20: { h: "2050", v: { NORTX35D_yr: 0, ATX35D_yr: 0, NORTR_yr: 3, ATR_yr: 3, NORIFM40_yr: 1, AIFM40_yr: 0, NORRx1d_yr: 43, ARRx1d_yr: 0.13 } },
};
const CLIMAT_EXPOSE = buildClimatFacts(SC_EXPOSEE)!;
const CLIMAT_EPARGNE = buildClimatFacts(SC_EPARGNEE)!;

// Une exposition sonore ÉTABLIE (des valeurs du type de Toulouse, materiality-rules.test.ts).
const SANTE_BRUYANTE = {
  viv: { pm25: 6.2, no2: 3.4 },
  calmeSonore: { score: 18, sourceDominante: "auto", distanceKm: 0.8 },
  expoIndustrielle: { score: 96, sourceDominante: "industrie" },
};

function projet(prefs: Partial<Record<PreferenceKey, number>>): UserProject {
  return normalizeUserProject({
    posture: "recherche", intent: null, rawText: "…", updatedAt: "2026-09-01T00:00:00.000Z",
    parsed: { reformulation: "x", hardConstraints: {}, preferences: Object.entries(prefs).map(([key, weight]) => ({ key, weight })) },
  })!;
}
function confirme(p: UserProject, ...keys: PreferenceKey[]): UserProject {
  const conditions = keys.map((key) => buildConfirmation(p, { kind: "preference", key }, "2026-10-01T00:00:00.000Z")!);
  return normalizeUserProject({ ...p, conditions })!;
}

type Opts = {
  rangs?: Partial<Record<PreferenceKey, [number, number]>>;
  extra?: Record<string, unknown>; // champs de l'index (santé, inondation, nature)
  faits?: Partial<ModuleFacts>; // voisinage et secteur, comme assembleAddressDossier les ajoute
  climat?: ClimatFacts | null;
  adresse?: boolean;
};

// LE MÊME ENCHAÎNEMENT que assembleAddressDossier, sans I/O.
function dossier(p: UserProject, o: Opts = {}) {
  const adresse = o.adresse ?? true;
  const entry = { ...CHATELAILLON, rankBands: o.rangs ?? {}, ...(o.extra ?? {}) } as unknown as IndexCommune;
  const base = mapCommuneToModuleFacts(entry, {}, {
    hasAddress: adresse, tailleVille: 6000, tailleVilleSource: "commune",
    climat: o.climat ?? null, risquesDeclares: { wildfire: false },
  });
  const mf: ModuleFacts = { ...base, hasAddress: adresse, ...(o.faits ?? {}) };
  const ctx: EvaluationContext = {
    constraints: hydrateHardConstraints({}, { byName: () => null, plmByName: () => null }),
    point: adresse
      ? { lat: 46.07, lon: -1.08, grain: "address", source: "address_geocoder", label: "1 rue de test, Châtelaillon-Plage" }
      : { lat: 46.07, lon: -1.08, grain: "commune_reference", source: "commune_centroid", label: "Châtelaillon-Plage" },
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };
  const run = runRules(mf, p, ctx);
  const comps = composeFacts(run, mf, p);
  const d = assembleDossier(run, p, adresse ? "commune+adresse" : "commune", mf.nom, comps, null);
  return { run, comps, d };
}

const affiches = (d: Dossier): Array<{ section: string; fact: DecisionFact }> =>
  d.sections.flatMap((s) => s.cards.flatMap((c) => (c.kind === "fact" ? [{ section: s.key, fact: c.fact }] : [])));
const carte = (d: Dossier, key: PreferenceKey): ConditionCheckFact | undefined =>
  affiches(d).map((x) => x.fact).find((f): f is ConditionCheckFact =>
    f.role === "condition_check" && f.criterion.kind === "preference" && f.criterion.key === key);
const verdict = (d: Dossier): string => d.narrativePlan.blocks.find((b) => b.key === "verdict")!.fallbackText;
// Tout le texte que le dossier porte sur cette carte, pour les assertions « ne dit jamais ».
const toutLeTexte = (c: ConditionCheckFact, d: Dossier): string =>
  [c.status, c.statement, c.whyNotDecided, c.consequence, verdict(d)].join(" ");

// ── 1. LES TROIS CAS S1 : commune favorable, constat de proximité à confirmer ───────────────────

type CasS1 = {
  nom: string; key: PreferenceKey; faits: Partial<ModuleFacts>; ruleId: string; factId: string;
  rang: RegExp; constat: RegExp; echelle: RegExp; limite: RegExp; geste: RegExp; grain: "adresse" | "secteur"; valeur: string;
};
const S1: CasS1[] = [
  {
    nom: "soins, médecin à 550 m", key: "acces_soins", faits: { autour: MEDECIN }, ruleId: "autour.acces-soins",
    factId: "17094:autour-acces-soins", rang: /^Pour l'accès aux soins, Châtelaillon-Plage se situe parmi les 20 %/,
    constat: /Un médecin généraliste se trouve à environ 550 m de cette adresse\.$/,
    echelle: /Le constat autour de l'adresse ne l'oriente pas/, limite: /ni s'il accepte de nouveaux patients/,
    geste: /médecins/, grain: "adresse", valeur: "550 m",
  },
  {
    nom: "transports, gare à 600 m", key: "acces_transports", faits: { autour: GARE }, ruleId: "autour.gare",
    factId: "17094:autour-gare", rang: /^Pour l'accès au train, Châtelaillon-Plage se situe parmi les 20 %/,
    constat: /Une gare se trouve à environ 600 m de cette adresse\.$/,
    echelle: /Le constat autour de l'adresse ne l'oriente pas/, limite: /ni la fréquence des trains/,
    geste: /horaires et destinations/, grain: "adresse", valeur: "600 m",
  },
  {
    nom: "voiture, secteur moins motorisé", key: "faible_dependance_auto", faits: { secteur: MOINS_MOTORISE },
    ruleId: "secteur.equipement-auto", factId: "17094:secteur-equipement-auto",
    rang: /^Pour les trajets domicile-travail sans voiture, Châtelaillon-Plage se situe parmi les 20 % de communes de France où les actifs vont le moins souvent travailler en voiture/,
    constat: /Dans ce secteur, 45\s% des ménages disposent d'au moins une voiture, contre 70\s% dans l'ensemble de la commune/,
    echelle: /Le constat sur le secteur de l'adresse ne l'oriente pas/, limite: /ne dit pas, à elle seule, s'il est possible de se déplacer autrement/,
    geste: /trajets réels/, grain: "secteur", valeur: "45\u00a0% contre 70\u00a0% dans la commune",
  },
];

for (const c of S1) {
  test(`S1 ${c.nom}, condition confirmée : ouverte, plutôt favorable, le rang et le constat sont tous deux dits`, () => {
    const p = confirme(projet({ [c.key]: 3 }), c.key);
    const { d, run, comps } = dossier(p, { rangs: { [c.key]: FAVORABLE }, faits: c.faits });
    // La règle de proximité a bien rendu `verification` : c'est ce constat que la carte lisait à l'envers.
    assert.equal(run.evaluations.find((e) => e.ruleId === c.ruleId)?.outcome, "verification");

    const k = carte(d, c.key);
    assert.ok(k, "la carte de condition existe");
    // LE SENS
    assert.equal(k.signal, "favorable");
    assert.equal(k.status, "Ouverte · plutôt favorable");
    assert.equal(k.consequence, "Ce que l'on sait de la commune va dans le sens de cette condition. Elle reste ouverte : à confirmer avant de décider.");
    assert.doesNotMatch(toutLeTexte(k, d), /penche contre|défavorable/);
    // LE CONSTAT : le rang communal mène, le constat à confirmer suit, chacun à son échelle.
    assert.match(k.statement, c.rang);
    assert.match(k.statement, c.constat);
    assert.doesNotMatch(k.statement, /dans ce que vous recherchez/); // la correspondance ne conclut pas
    // POURQUOI ÇA NE TRANCHE PAS : les deux grains, et la limite du constat.
    assert.match(k.whyNotDecided, /^Le sens de cette lecture vient de la commune, sans seuil fixé par vous\./);
    assert.match(k.whyNotDecided, c.echelle);
    assert.match(k.whyNotDecided, c.limite);
    assert.doesNotMatch(k.whyNotDecided, /Cette lecture est faite à l'échelle de la commune/); // l'ancienne phrase, fausse ici
    // LE GESTE du constat survit dans la carte.
    assert.match(k.action?.label ?? "", c.geste);
    // LES PREUVES : la position communale (sans valeur) puis la mesure locale, chacune à son grain.
    assert.equal(k.evidence[0]?.factId, `relativePosition.${c.key}`);
    assert.equal(k.evidence[0]?.grain, "commune");
    const locale = k.evidence.find((e) => e.observedValue === c.valeur);
    assert.ok(locale, "la mesure locale reste une preuve de la carte");
    assert.equal(locale.grain, c.grain);
    // Le sujet est celui du rang, pas « les soins autour de cette adresse » : la synthèse le nomme.
    assert.doesNotMatch(k.topic, /adresse|secteur/);
    // AUCUNE DUPLICATION, AUCUNE PERTE : le constat est absorbé une fois, nulle part ailleurs.
    const ids = affiches(d).map((x) => x.fact.id);
    assert.equal(ids.includes(c.factId), false);
    assert.equal(ids.includes(`17094:alignment-${c.key}`), false);
    assert.equal(new Set(ids).size, ids.length);
    assert.deepEqual(d.sections.map((s) => s.key), ["incompatibilities"]);
    assert.doesNotThrow(() => assertCompositionsValid(run, comps));
    // LE VERDICT suit la carte.
    assert.equal(d.criteria.registry.find((x) => x.criterionKey === c.key)?.outcome, "to_confirm");
    assert.equal(d.narrativePlan.verdictLabel, "Condition ouverte");
    assert.match(verdict(d), /Les données disponibles sont plutôt favorables pour/);
  });
}

// Une ABSENCE dans un périmètre borné n'oriente pas non plus : « la commune peut rester bien dotée ».
for (const [nom, key, faits, constat] of [
  ["soins, aucun équipement dans le périmètre", "acces_soins", { autour: SANS_SOINS }, /aucun équipement de santé n'est recensé dans le périmètre cherché/],
  ["transports, aucune gare dans le périmètre", "acces_transports", { autour: SANS_GARE }, /Aucune gare de voyageurs n'apparaît dans le périmètre cherché/],
] as const) {
  test(`S1 ${nom}, commune favorable : l'absence bornée ne retourne pas la carte`, () => {
    const { d } = dossier(confirme(projet({ [key]: 3 }), key), { rangs: { [key]: FAVORABLE }, faits });
    const k = carte(d, key)!;
    assert.equal(k.signal, "favorable");
    assert.match(k.statement, /parmi les 20 %/);
    assert.match(k.statement, constat);
    assert.match(k.whyNotDecided, /Le périmètre de recherche est borné/);
    assert.doesNotMatch(toutLeTexte(k, d), /penche contre/);
  });
}

// ── 2. COMMUNE DÉFAVORABLE + présence : la présence n'efface pas le jugement communal ────────────

test("commune défavorable + médecin à 550 m : plutôt défavorable, attribué à la commune, le médecin reste dit", () => {
  const { d } = dossier(confirme(projet({ acces_soins: 3 }), "acces_soins"), { rangs: { acces_soins: DEFAVORABLE }, faits: { autour: MEDECIN } });
  const k = carte(d, "acces_soins")!;
  assert.equal(k.signal, "defavorable");
  assert.equal(k.status, "Ouverte · plutôt défavorable");
  // Le constat communal mène (sans son préambule « Vous avez placé… »), le médecin suit.
  assert.doesNotMatch(k.statement, /^Vous avez placé/);
  assert.match(k.statement, /Châtelaillon-Plage/);
  assert.match(k.statement, /Un médecin généraliste se trouve à environ 550 m de cette adresse\.$/);
  assert.ok(k.statement.indexOf("Châtelaillon-Plage") < k.statement.indexOf("médecin"));
  // Ce qui penche, c'est la commune ; le médecin n'est pas compté contre ni pour.
  assert.equal(k.consequence, "Ce que l'on sait de la commune penche contre cette condition. Elle reste ouverte : à vérifier avant de décider.");
  assert.match(k.whyNotDecided, /Le constat autour de l'adresse ne l'oriente pas/);
  assert.match(verdict(d), /plutôt défavorables pour un bon accès aux soins/);
});

// ── 3. COMMUNE NEUTRE + présence : ouverte, sans sens ────────────────────────────────────────────

test("commune neutre + médecin à 550 m : condition ouverte, ni favorable ni défavorable, les deux échelles dites", () => {
  const { d } = dossier(confirme(projet({ acces_soins: 3 }), "acces_soins"), { rangs: { acces_soins: NEUTRE }, faits: { autour: MEDECIN } });
  const k = carte(d, "acces_soins")!;
  assert.equal(k.signal, "neutre");
  assert.equal(k.status, "Condition ouverte");
  assert.equal(k.consequence, CONSEQUENCE_NEUTRE);
  assert.match(k.statement, /^À l'échelle de la commune, un bon accès aux soins ne se distingue ni parmi les communes les plus favorables/);
  assert.match(k.statement, /550 m de cette adresse\.$/);
  assert.match(verdict(d), /ne permettent pas encore de conclure sur un bon accès aux soins/);
});

// ── 4. DES CONSTATS D'ORIENTATIONS DIFFÉRENTES : aucun arbitrage inventé ─────────────────────────

test("commune favorable + secteur PLUS motorisé : le rang garde le sens, la nuance contraire reste visible", () => {
  const { d } = dossier(confirme(projet({ faible_dependance_auto: 3 }), "faible_dependance_auto"), {
    rangs: { faible_dependance_auto: FAVORABLE }, faits: { secteur: PLUS_MOTORISE },
  });
  const k = carte(d, "faible_dependance_auto")!;
  assert.equal(k.signal, "favorable");
  assert.match(k.statement, /parmi les 20 %/);
  assert.match(k.statement, /la possession y est plus répandue de 18 points/);
  assert.match(k.consequence, /^Ce que l'on sait de la commune va dans le sens/);
});

test("commune défavorable + secteur MOINS motorisé : la nuance favorable ne retourne pas la carte", () => {
  const { d } = dossier(confirme(projet({ faible_dependance_auto: 3 }), "faible_dependance_auto"), {
    rangs: { faible_dependance_auto: DEFAVORABLE }, faits: { secteur: MOINS_MOTORISE },
  });
  const k = carte(d, "faible_dependance_auto")!;
  assert.equal(k.signal, "defavorable");
  assert.match(k.statement, /moins répandue de 25 points/);
  assert.match(k.consequence, /^Ce que l'on sait de la commune penche contre/);
});

// ── 5. UNE EXPOSITION ÉTABLIE reste défavorable, et sa carte n'a pas bougé ───────────────────────

test("bruit confirmé, infrastructure à portée : plutôt défavorable, textes d'avant FUT-110 inchangés", () => {
  const { d, run } = dossier(confirme(projet({ calme_sonore: 3 }), "calme_sonore"), { extra: SANTE_BRUYANTE });
  assert.equal(run.evaluations.find((e) => e.ruleId === "territoire.sante-bruit")?.outcome, "verification");
  const k = carte(d, "calme_sonore")!;
  assert.equal(k.signal, "defavorable");
  assert.equal(k.status, "Ouverte · plutôt défavorable");
  assert.match(k.statement, /autoroute ou une voie rapide/);
  assert.equal(k.whyNotDecided, POURQUOI_COMMUNE);
  assert.equal(k.consequence, CONSEQUENCE_CONTRE);
  assert.equal(k.action?.label, "Écoutez sur place, à plusieurs heures");
});

// FUT-127 (engine-7) : LE COMPTE CATNAT N'ORIENTE PLUS. Une commune couverte par un plan est un fait
// communal, qui ne dit pas si l'adresse est en zone : la condition reste ouverte, sans sens. Seule une zone
// inondation ÉTABLIE à l'adresse (liée explicitement, rattachement fiable) penche contre la condition.
const PPR_CHATEL = { export: "2026-10-05", plans: [{ id: "17DDTM20100008", nom: "PPR Chatelaillon", modele: "PPRN-L", statut: "approuve" as const, date: "2019-04-01", aleas: ["Par submersion marine"] }] };

test("inondation confirmée, commune couverte par un plan, sans adresse : condition ouverte, sans sens", () => {
  const { d } = dossier(confirme(projet({ faible_risque_inondation: 3 }), "faible_risque_inondation"), {
    adresse: false, extra: { inondation: { risque: 90, catnat: 4 } }, faits: { plansInondation: PPR_CHATEL },
  });
  const k = carte(d, "faible_risque_inondation")!;
  assert.equal(k.signal, "neutre");
  assert.match(k.statement, /À Châtelaillon-Plage, un plan de prévention réglemente certaines zones pour la submersion marine\./);
  assert.doesNotMatch(toutLeTexte(k, d), /ressort élevée|exposition de la commune/);
  assert.equal(k.consequence, CONSEQUENCE_NEUTRE);
});

test("inondation confirmée, adresse en zone d'interdiction submersible : plutôt défavorable", () => {
  const zone = {
    plan: "PPR Charron", gasparId: "17DDTM20100006", modele: "PPRN-L", phenomenes: ["la submersion marine"], autresPhenomenes: ["le recul du trait de côte"],
    approbation: "2021-08-10", zoneCode: "Rs2", zoneNom: "Zone rouge Rs2: Ensemble des zones submersibles en alea tres fort a court terme",
    regimeCode: "03", regime: "Interdiction",
  };
  const logement = {
    dpe: "absent", dpeLabel: null, confortEteInsuffisant: false, rga: "none", expositionBati: false,
    pprn: "present", zoneReglementee: true, pprnLabel: "PPR Charron", cavites: "none", caviteProche: false,
    patrimoine: "none", perimetrePatrimonial: false, sinistralite: "none", sinistraliteActive: false,
    addressLabel: "Rue du 19 Mars 1962, 17230 Charron",
    zonageInondation: { etat: "zone", grain: "parcelle", zone, rattachement: "fiable", liaison: "explicite", divergence: null, parcelleParRepli: false },
  } as ModuleFacts["logement"];
  const { d } = dossier(confirme(projet({ faible_risque_inondation: 3 }), "faible_risque_inondation"), {
    extra: { inondation: { risque: 52, catnat: 3 } }, faits: { plansInondation: PPR_CHATEL, logement },
  });
  const k = carte(d, "faible_risque_inondation")!;
  assert.equal(k.signal, "defavorable");
  assert.match(k.statement, /^Cette adresse est dans une zone réglementée pour la submersion marine\. Certaines constructions et certains travaux y sont interdits\./);
  assert.equal(k.consequence, CONSEQUENCE_CONTRE);
  assert.doesNotMatch(toutLeTexte(k, d), /plutôt favorable|rien de défavorable/);
});

test("les identifiants déclarés orientants existent, et chacun rend bien `verification` sur une exposition", () => {
  const ids = new Set(REGISTRY.map((r) => r.id));
  for (const id of VERIFICATIONS_ORIENTEES) assert.ok(ids.has(id), `règle inconnue : ${id}`);
  // Les constats à confirmer, eux, n'y sont pas.
  for (const id of ["autour.acces-soins", "autour.gare", "secteur.equipement-auto", "territoire.climat-feu"]) {
    assert.equal(VERIFICATIONS_ORIENTEES.has(id), false, id);
  }
});

// Le contexte boisé (règle feu) : la règle écrit elle-même qu'un couvert forestier n'établit aucun risque.
test("feu confirmé, commune très boisée sans risque recensé : condition ouverte, sans sens inventé", () => {
  const { d, run } = dossier(confirme(projet({ faible_risque_feu: 3 }), "faible_risque_feu"), {
    climat: CLIMAT_EPARGNE, extra: { nature: { composition: { foret: 85 } } },
  });
  assert.equal(run.evaluations.find((e) => e.ruleId === "territoire.climat-feu")?.outcome, "verification");
  const k = carte(d, "faible_risque_feu")!;
  assert.equal(k.signal, "neutre");
  assert.equal(k.status, "Condition ouverte");
  assert.match(k.statement, /la forêt couvre 85 %/);
  assert.match(k.whyNotDecided, /^Le constat sur la commune reste à vérifier : à lui seul, il ne dit pas si votre condition est respectée\./);
  assert.match(k.whyNotDecided, /ne suffit pas à établir un risque d'incendie/);
  assert.doesNotMatch(toutLeTexte(k, d), /penche contre|favorable/);
});

// ── 6. INFORMATION ABSENTE OU SOURCE INDISPONIBLE ────────────────────────────────────────────────

test("voisinage non analysé : la carte est la lecture communale de toujours", () => {
  const { d } = dossier(confirme(projet({ acces_soins: 3 }), "acces_soins"), { rangs: { acces_soins: FAVORABLE } });
  const k = carte(d, "acces_soins")!;
  assert.equal(k.signal, "favorable");
  assert.equal(k.statement, "Pour l'accès aux soins, Châtelaillon-Plage se situe parmi les 20 % de communes où il est le plus favorable en France.");
  assert.equal(k.whyNotDecided, POURQUOI_COMMUNE);
  assert.equal(k.consequence, CONSEQUENCE_POUR);
  assert.equal(k.action, undefined);
});

test("rang communal indisponible + médecin : une carte neutre qui ne prétend rien de la commune", () => {
  const { d } = dossier(confirme(projet({ acces_soins: 3 }), "acces_soins"), { faits: { autour: MEDECIN } });
  const k = carte(d, "acces_soins")!;
  assert.equal(k.signal, "neutre");
  assert.equal(k.statement, "Un médecin généraliste se trouve à environ 550 m de cette adresse.");
  assert.doesNotMatch(k.statement + k.whyNotDecided, /commune/);
  assert.match(k.whyNotDecided, /^Le constat autour de l'adresse reste à vérifier : à lui seul, il ne dit pas si votre condition est respectée\./);
  assert.match(k.action?.label ?? "", /médecins/);
});

test("rang indisponible et voisinage non analysé : aucune carte inventée", () => {
  const { d } = dossier(confirme(projet({ acces_soins: 3 }), "acces_soins"));
  assert.equal(carte(d, "acces_soins"), undefined);
});

// ── 7. CONFIRMÉE À FAIBLE POIDS : même lecture, l'importance ne change pas ───────────────────────

test("soins confirmée au poids 1, commune favorable + médecin : plutôt favorable, tier secondaire", () => {
  const { d } = dossier(confirme(projet({ acces_soins: 1 }), "acces_soins"), { rangs: { acces_soins: FAVORABLE }, faits: { autour: MEDECIN } });
  const k = carte(d, "acces_soins")!;
  assert.equal(k.signal, "favorable");
  assert.equal(k.materialityTier, "secondary");
  assert.match(k.statement, /550 m/);
});

// ── 8. NON CONFIRMÉE : rien ne change, chaque fait reste dans sa section ─────────────────────────

test("soins NON confirmée : pas de carte de condition ; correspondance et contrôle restent séparés", () => {
  const { d } = dossier(projet({ acces_soins: 3 }), { rangs: { acces_soins: FAVORABLE }, faits: { autour: MEDECIN } });
  assert.equal(carte(d, "acces_soins"), undefined);
  const parId = new Map(affiches(d).map((x) => [x.fact.id, x.section]));
  assert.equal(parId.get("17094:alignment-acces_soins"), "alignments");
  assert.equal(parId.get("17094:autour-acces-soins"), "verifications");
});

// ── 9. CHALEUR CONFIRMÉE (FUT-90) : inchangée ────────────────────────────────────────────────────

test("chaleur confirmée, exposition défavorable : la carte de FUT-90 ne bouge pas", () => {
  const { d, run, comps } = dossier(confirme(projet({ faible_chaleur: 3 }), "faible_chaleur"), { climat: CLIMAT_EXPOSE, adresse: false });
  const k = carte(d, "faible_chaleur")!;
  assert.equal(k.signal, "defavorable");
  assert.match(k.statement, /passeraient de 3 par an/);
  assert.equal(k.whyNotDecided, POURQUOI_COMMUNE);
  assert.equal(k.consequence, CONSEQUENCE_CONTRE);
  // Le mismatch absorbé n'est réintroduit nulle part.
  assert.equal(comps.some((c) => c.absorbedFactIds.includes("17094:climat-chaleur")), false);
  assert.equal(affiches(d).some((x) => x.fact.id === "17094:climat-chaleur"), false);
  assert.doesNotThrow(() => assertCompositionsValid(run, comps));
});

// ── 10. PLUSIEURS CONDITIONS À LA FOIS ───────────────────────────────────────────────────────────

test("trois conditions confirmées : chaque carte a son sens, le verdict les range sans les mêler", () => {
  const keys: PreferenceKey[] = ["acces_soins", "acces_transports", "calme_sonore"];
  const p = confirme(projet({ acces_soins: 3, acces_transports: 3, calme_sonore: 2 }), ...keys);
  const { d, run, comps } = dossier(p, {
    rangs: { acces_soins: FAVORABLE, acces_transports: DEFAVORABLE }, faits: { autour: SOINS_ET_GARE }, extra: SANTE_BRUYANTE,
  });
  assert.equal(carte(d, "acces_soins")?.signal, "favorable");
  assert.equal(carte(d, "acces_transports")?.signal, "defavorable");
  assert.equal(carte(d, "calme_sonore")?.signal, "defavorable");
  // Chaque constat dans SA carte : le médecin chez les soins, la gare chez les transports.
  assert.match(carte(d, "acces_soins")!.statement, /médecin/);
  assert.doesNotMatch(carte(d, "acces_soins")!.statement, /gare/);
  assert.match(carte(d, "acces_transports")!.statement, /gare/);
  assert.doesNotMatch(carte(d, "acces_transports")!.statement, /médecin/);
  assert.equal(carte(d, "calme_sonore")!.whyNotDecided, POURQUOI_COMMUNE);
  // Aucun fait deux fois, aucun constat de proximité hors de sa carte.
  const ids = affiches(d).map((x) => x.fact.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.some((id) => id.includes("autour-")), false);
  assert.doesNotThrow(() => assertCompositionsValid(run, comps));
  const v = verdict(d);
  assert.match(v, /plutôt défavorables pour l'accès au train et aux gares et l'éloignement des grandes sources de bruit/);
  assert.match(v, /plutôt favorables pour un bon accès aux soins/);
});

// ── L'ARTEFACT SÉRIALISÉ ─────────────────────────────────────────────────────────────────────────

test("artefact : la carte corrigée traverse la sérialisation, sous le moteur courant (engine-5 depuis FUT-110, engine-6 depuis FUT-17, engine-7 depuis FUT-127, engine-8 depuis FUT-167)", () => {
  const p = confirme(projet({ acces_soins: 3 }), "acces_soins");
  const { d } = dossier(p, { rangs: { acces_soins: FAVORABLE }, faits: { autour: MEDECIN } });
  assert.equal(ENGINE_VERSION, "engine-8");
  const a = buildDecisionArtifact(d, p, "2026-10-16T10:00:00.000Z", PRODUCT_CONVENTIONS_VERSION);
  const relu = parseDecisionArtifact(JSON.parse(JSON.stringify(a)));
  assert.ok(relu);
  assert.equal(relu.engineVersion, "engine-8");
  const k = carte(relu.dossier, "acces_soins")!;
  assert.equal(k.status, "Ouverte · plutôt favorable");
  assert.match(k.statement, /550 m/);
});
