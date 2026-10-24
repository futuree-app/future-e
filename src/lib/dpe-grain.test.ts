// FUT-74 : le grain d'un diagnostic (logement / immeuble / indéterminé), et ce que le reste du
// produit en fait.
//
// TROIS FAMILLES DE TESTS DANS CE FICHIER :
//   1. `grainDpe` et ses voisins (module pur) ;
//   2. ce qui tenait déjà avant FUT-74, et que le correctif ne devait pas casser ;
//   3. les trois défauts constatés le 24/10/2026, écrits d'abord en `todo` (ils échouaient sur le code
//      d'alors, vérifié), puis activés au câblage ; et la chaîne, de la liste au moteur.
//
// Chaque test de la seconde famille vérifie ce que l'écran RACONTE, pas seulement qu'un bloc
// APPARAÎT (règle du 25/07/2026, AGENTS.md).
import test from "node:test";
import assert from "node:assert/strict";
import { attribuableAuLogement, dpeDuLogement, grainDpe, issuDesDonneesDeLImmeuble, refusDAttribution, repartirParGrain } from "./dpe-grain.ts";
import {
  AMBIGUS, GENERES_SEULS, IMMEUBLE_ET_GENERES_SANS_COMPLEMENT, IMMEUBLE_ET_INDIVIDUELS, IMMEUBLE_SEUL, MAISON_SEULE, NEUF, dpe,
} from "./dpe-grain.fixtures.ts";
import { buildAddressDpeContext, addressContextLead } from "./dpe-address-context.ts";
import {
  champsVariables, ficheImmeuble, ligneCandidat, phraseChoixEcarte, phraseEtabliDepuisImmeuble, phrasesOuvertureRepliee,
  PORTEE_DPE_IMMEUBLE, vueSectionDpe,
} from "./dpe-selection-vue.ts";
import { dpeAttributionStatus } from "./dpe-attribution.ts";
import { deriveThermalEvidence } from "./thermal-evidence.ts";
import { confortEteDepuisDpe } from "./decision/logement-facts.ts";


// ── 1. Le grain ──────────────────────────────────────────────────────────────────────────────────

test("les six méthodes du jeu existant et les sept du neuf ont chacune leur grain", () => {
  const attendu: [string, string, string][] = [
    ["appartement", "dpe appartement individuel", "logement"],
    ["maison", "dpe maison individuelle", "logement"],
    ["appartement", "dpe appartement généré à partir des données DPE immeuble", "logement"],
    ["immeuble", "dpe immeuble collectif", "immeuble"],
    ["appartement", "dpe issu d'une étude thermique réglementaire RT2012 bâtiment : appartement", "logement"],
    ["immeuble", "dpe issu d'une étude thermique réglementaire RT2012 bâtiment : immeuble", "immeuble"],
    ["maison", "dpe issu d'une étude thermique réglementaire RT2012 bâtiment : maison individuelle", "logement"],
    ["appartement", "dpe issu d'une étude energie environement réglementaire RE2020 bâtiment : appartement", "logement"],
    ["maison", "dpe issu d'une étude energie environement réglementaire RE2020 bâtiment : maison individuelle", "logement"],
    ["immeuble", "dpe issu d'une étude energie environement réglementaire RE2020 bâtiment : immeuble", "immeuble"],
  ];
  for (const [type_batiment, methode_dpe, grain] of attendu) {
    assert.equal(grainDpe({ type_batiment, methode_dpe }), grain, methode_dpe);
  }
});

test("l'appartement généré à partir de l'immeuble est un DPE de LOGEMENT, et il est reconnu comme tel", () => {
  const g = GENERES_SEULS[0];
  assert.equal(grainDpe(g), "logement");
  assert.equal(attribuableAuLogement(g), true);
  assert.equal(issuDesDonneesDeLImmeuble(g), true);
  // Le DPE de l'immeuble porte sur le bâtiment lui-même : il n'est « issu » de rien.
  assert.equal(issuDesDonneesDeLImmeuble(IMMEUBLE_SEUL[0]), false);
});

test("le type prime sur la méthode, qui ne fait que le suppléer", () => {
  assert.equal(grainDpe({ type_batiment: "immeuble", methode_dpe: null }), "immeuble");
  assert.equal(grainDpe({ type_batiment: null, methode_dpe: "dpe immeuble collectif" }), "immeuble");
  assert.equal(grainDpe({ type_batiment: null, methode_dpe: "dpe appartement généré à partir des données DPE immeuble" }), "logement");
  assert.equal(grainDpe({ type_batiment: " Appartement ", methode_dpe: undefined as never }), "logement");
});

test("mal typé ou insuffisamment renseigné : indéterminé, donc jamais attribuable", () => {
  for (const d of AMBIGUS) {
    assert.equal(grainDpe(d), "indetermine", d.id_dpe);
    assert.equal(attribuableAuLogement(d), false, d.id_dpe);
  }
});

test("le jeu d'avant juillet 2021 : ses libellés de type se lisent aussi", () => {
  assert.equal(grainDpe({ type_batiment: "Bâtiment collectif à usage principal d'habitation", methode_dpe: null }), "immeuble");
  assert.equal(grainDpe({ type_batiment: "Logement", methode_dpe: null }), "logement");
  assert.equal(grainDpe({ type_batiment: "Maison Individuelle", methode_dpe: null }), "logement");
});

test("le neuf suit la même règle", () => {
  assert.deepEqual(NEUF.map(grainDpe), ["immeuble", "logement", "logement"]);
});

test("répartir par grain ne retire ni ne réordonne rien", () => {
  const tout = [...IMMEUBLE_ET_INDIVIDUELS, ...AMBIGUS];
  const r = repartirParGrain(tout);
  assert.deepEqual(r.immeubles.map((d) => d.id_dpe), ["FUT74IMM00031"]);
  assert.deepEqual(r.logements.map((d) => d.id_dpe), ["FUT74LOG00031", "FUT74LOG00032", "FUT74LOG00033"]);
  assert.equal(r.indetermines.length, 3);
  assert.equal(r.logements.length + r.immeubles.length + r.indetermines.length, tout.length);
});

test("le complément d'adresse parasite d'un DPE d'immeuble ne le fait pas passer pour un logement", () => {
  const imm = IMMEUBLE_ET_INDIVIDUELS[0];
  assert.equal(imm.complement, "2-DPE-1-LogZone");
  assert.equal(grainDpe(imm), "immeuble");
});

// ── 2. Ce qui doit déjà tenir, et que le correctif ne doit pas casser ────────────────────────────

test("NON-RÉGRESSION · l'attribution automatique reste réservée à une maison seule", () => {
  assert.equal(dpeAttributionStatus(MAISON_SEULE, "housenumber").status, "auto_confirmed");
  assert.equal(dpeAttributionStatus(IMMEUBLE_SEUL, "housenumber").status, "selection_required");
  assert.equal(dpeAttributionStatus(GENERES_SEULS.slice(0, 1), "housenumber").status, "selection_required");
});

test("NON-RÉGRESSION · le confort d'été d'un appartement généré reste au niveau du bâtiment (FUT-20)", () => {
  // 7,7 % des générés renseignent le confort d'été : la dérivation reste prudente, et c'est juste.
  const ev = deriveThermalEvidence(dpe({ methode_dpe: "dpe appartement généré à partir des données DPE immeuble", confort_ete: "insuffisant" }));
  assert.equal(ev.level, "B1_EXACT_BUILDING");
  assert.equal(ev.indicator, null);
});

test("NON-RÉGRESSION · un DPE d'immeuble retenu ne qualifie jamais le confort d'été du logement", () => {
  assert.equal(confortEteDepuisDpe(IMMEUBLE_SEUL[0]).niveau, "aucun");
});

test("NON-RÉGRESSION · les statistiques d'adresse n'agrègent que les diagnostics de logement", () => {
  const ctx = buildAddressDpeContext(IMMEUBLE_ET_INDIVIDUELS)!;
  assert.equal(ctx.labelled, 3); // la classe D de l'immeuble n'entre pas dans la répartition
  assert.deepEqual(ctx.surfaces, { min: 31.2, max: 64 });
});

// ── 3. Les défauts constatés, et la chaîne ────────────────────────────────────────────

test("BUG 1 · un appartement généré ne s'intitule jamais « Immeuble entier »", () => {
  const [, ...generes] = IMMEUBLE_ET_GENERES_SANS_COMPLEMENT;
  const champs = champsVariables(IMMEUBLE_ET_GENERES_SANS_COMPLEMENT);
  for (const g of generes) {
    const l = ligneCandidat(g, champs);
    assert.equal(l.immeuble, false, g.id_dpe);
    assert.notEqual(l.titre, "Immeuble entier", g.id_dpe);
    assert.ok(!l.details.includes("diagnostic de l'immeuble"), g.id_dpe);
  }
});

test("BUG 1 · des appartements générés seuls n'annoncent pas un diagnostic d'immeuble", () => {
  assert.equal(buildAddressDpeContext(GENERES_SEULS)!.hasCollective, false);
});

test("BUG 2 · le compte de l'adresse distingue les diagnostics de logement de celui de l'immeuble", () => {
  // « 4 diagnostics sont enregistrés… Reconnaissez-vous celui de ce logement ? » invite à choisir
  // parmi quatre lignes dont une ne peut pas être la bonne.
  const lead = addressContextLead(buildAddressDpeContext(IMMEUBLE_ET_INDIVIDUELS)!);
  assert.match(lead, /3 diagnostics de logement/);
});

test("BUG 2 · un DPE d'immeuble seul ne se présente pas comme une ligne à reconnaître", () => {
  const lead = addressContextLead(buildAddressDpeContext(IMMEUBLE_SEUL)!);
  assert.doesNotMatch(lead, /Est-ce celui de ce logement/);
});

test("BUG 3 · un DPE d'immeuble retenu ne donne jamais son étiquette au logement dans le moteur", async () => {
  // Avant FUT-74 : la route `/api/logement-dpe` acceptait ce choix, et `ruleDpe` écrivait « À cette
  // adresse, le diagnostic choisi classe ce logement F, une passoire énergétique » (structuring).
  const { buildLogementFacts } = await import("./decision/logement-facts.ts");
  const data = {
    rga: { coverage: "none", label: null }, pprn: { coverage: "none", count: 0, label: null },
    cavites: { coverage: "none", count: 0 }, patrimoine: { coverage: "none", count: 0 },
    sinistralite: { coverage: "none", active: false }, fetchedAt: "2026-10-24T00:00:00.000Z",
  } as never;
  const f = buildLogementFacts(data, IMMEUBLE_SEUL[0]);
  assert.equal(f.dpeLabel, null);
  assert.equal(f.dpe, "absent");
});

// ── 4. La chaîne : serveur, numéro, persistance relue, moteur, synthèse, écran ──────────────────

test("SERVEUR · la route refuse d'attribuer un DPE d'immeuble ou de grain indéterminé, en liste comme par numéro", () => {
  // La route applique ce refus à la fiche RELUE À LA SOURCE, quelle que soit sa provenance.
  assert.deepEqual(refusDAttribution(IMMEUBLE_SEUL[0]), { error: "DPE_NON_ATTRIBUABLE", grain: "immeuble" });
  assert.deepEqual(refusDAttribution(NEUF[0]), { error: "DPE_NON_ATTRIBUABLE", grain: "immeuble" });
  for (const d of AMBIGUS) assert.deepEqual(refusDAttribution(d), { error: "DPE_NON_ATTRIBUABLE", grain: "indetermine" });
  // Un DPE de logement, y compris généré et non visité, passe ; `null` (statut sans diagnostic) aussi.
  assert.equal(refusDAttribution(GENERES_SEULS[0]), null);
  assert.equal(refusDAttribution(dpe({ methode_dpe: "dpe appartement généré à partir des données DPE immeuble", appartement_non_visite: true })), null);
  assert.equal(refusDAttribution(MAISON_SEULE[0]), null);
  assert.equal(refusDAttribution(null), null);
});

test("LISTE · seuls les diagnostics de logement sont offerts au choix, et l'immeuble n'y figure jamais", () => {
  for (const cas of [IMMEUBLE_ET_GENERES_SANS_COMPLEMENT, IMMEUBLE_ET_INDIVIDUELS, IMMEUBLE_SEUL, GENERES_SEULS]) {
    const { logements, immeubles } = repartirParGrain(cas);
    const champs = champsVariables(logements);
    for (const l of logements.map((c) => ligneCandidat(c, champs))) {
      assert.equal(l.immeuble, false, l.id);
      assert.doesNotMatch(l.libelleAccessible, /immeuble entier/i, l.id);
    }
    assert.ok(immeubles.every((c) => !logements.includes(c)));
  }
  assert.equal(repartirParGrain(IMMEUBLE_SEUL).logements.length, 0);
});

test("LISTE · le compte replié dit « de logement » quand l'immeuble a aussi son diagnostic", () => {
  assert.equal(phrasesOuvertureRepliee(33, true).titre, "33 diagnostics de logement sont enregistrés à cette adresse.");
  assert.equal(phrasesOuvertureRepliee(34).titre, "34 diagnostics sont enregistrés à cette adresse.");
});

test("LISTE · sans DPE d'immeuble, la phrase d'ouverture est celle d'avant FUT-74", () => {
  assert.equal(addressContextLead(buildAddressDpeContext(GENERES_SEULS)!),
    "3 diagnostics sont enregistrés à cette adresse. Reconnaissez-vous celui de ce logement ?");
  assert.equal(addressContextLead(buildAddressDpeContext(MAISON_SEULE)!),
    "Un diagnostic est enregistré à cette adresse. Est-ce celui de ce logement ?");
  assert.equal(addressContextLead(buildAddressDpeContext(IMMEUBLE_SEUL)!),
    "Aucun diagnostic de logement n'est enregistré à cette adresse dans la base ouverte.");
});

test("LISTE · un appartement généré dit d'où vient son diagnostic, et sa visite manquante quand l'ADEME la renseigne (D6)", () => {
  const champs = champsVariables(GENERES_SEULS);
  assert.ok(ligneCandidat(GENERES_SEULS[0], champs).details.includes("établi à partir des données de l'immeuble"));
  const nonVisite = dpe({ methode_dpe: "dpe appartement généré à partir des données DPE immeuble", appartement_non_visite: true });
  assert.ok(ligneCandidat(nonVisite, champs).details.includes("appartement non visité, établi à partir des données de l'immeuble"));
  // Un appartement individuel ne porte aucune de ces mentions.
  assert.ok(!ligneCandidat(IMMEUBLE_ET_INDIVIDUELS[1], champs).details.some((d) => /immeuble/.test(d)));
  // La section Énergie le dit aussi, sans le déclarer erroné.
  assert.match(phraseEtabliDepuisImmeuble(nonVisite)!, /sans visite de l'appartement : la méthode applique alors les équipements individuels les moins performants/);
  assert.doesNotMatch(phraseEtabliDepuisImmeuble(nonVisite)!, /erron|faux|douteux|fiable/i);
  assert.equal(phraseEtabliDepuisImmeuble(IMMEUBLE_ET_INDIVIDUELS[1]), null);
});

test("IMMEUBLE · sa fiche nomme l'objet avant la classe, et ne dit sa taille que si elle est vraisemblable (D7)", () => {
  const f = ficheImmeuble(dpe({ ...IMMEUBLE_SEUL[0], date_dpe: "2026-10-19", nombre_appartements: 10, surface_immeuble_m2: 374.3 }));
  assert.equal(`${f.titre}, ${f.classement}`, "Diagnostic de l'immeuble entier, classé F");
  assert.deepEqual(f.details, ["établi le 19/10/2026", "immeuble de 10 logements, 374,3 m² habitables", "base DPE de l'ADEME"]);
  // Un « immeuble » d'un seul appartement (4,9 % des DPE d'immeuble) : le nombre est tu, la surface reste.
  const petit = ficheImmeuble(dpe({ ...IMMEUBLE_SEUL[0], nombre_appartements: 1, surface_immeuble_m2: 263.1 }));
  assert.ok(petit.details.includes("immeuble de 263,1 m² habitables"));
  assert.ok(!petit.details.some((d) => /logements/.test(d)));
  // Sans champ de taille (snapshot antérieur à FUT-74) : rien d'inventé.
  assert.deepEqual(ficheImmeuble(IMMEUBLE_SEUL[0]).details, ["établi le 03/06/2025", "base DPE de l'ADEME"]);
  assert.match(PORTEE_DPE_IMMEUBLE, /ne donne la classe d'aucun logement en particulier/);
});

test("PERSISTANCE · un DPE d'immeuble retenu avant FUT-74 reste inscrit, et n'est plus lu comme celui du logement (D4)", () => {
  const ancien = IMMEUBLE_SEUL[0];
  assert.equal(dpeDuLogement(ancien), null);
  assert.equal(dpeDuLogement(GENERES_SEULS[0]), GENERES_SEULS[0]);
  assert.equal(dpeDuLogement(null), null);
  // La section rouvre la sélection (le statut confirmé reste en base) et dit pourquoi.
  assert.equal(vueSectionDpe({ statut: "confirmed", dpeRetenu: false, candidats: 1, baseMuette: false }), "a_choisir");
  assert.match(phraseChoixEcarte("immeuble"), /^Le diagnostic retenu pour ce logement porte sur l'immeuble entier\./);
  assert.match(phraseChoixEcarte("immeuble"), /son étiquette n'entre pas dans ce dossier/);
});

test("MOTEUR · un DPE d'immeuble retenu ne produit plus la réserve « classe ce logement », un DPE généré si", async () => {
  const { buildLogementFacts } = await import("./decision/logement-facts.ts");
  const { runRules } = await import("./decision/materiality-rules.ts");
  const data = {
    rga: { coverage: "none", label: null }, pprn: { coverage: "none", count: 0, label: null },
    cavites: { coverage: "none", count: 0 }, patrimoine: { coverage: "none", count: 0 },
    sinistralite: { coverage: "none", active: false }, fetchedAt: "2026-10-24T00:00:00.000Z",
  } as never;
  const HARD = {
    constraints: { departements: null, zones: null, excludeZones: null, montagne: false, reliefProche: false, nearSea: null, excludeSea: false, communeSize: null, nearPlace: null, excludePlace: [], sizeRelativeTo: null },
    point: { lat: 43.6, lon: 1.44, grain: "commune_reference", source: "commune_centroid", label: "Exemple" },
    conventionsVersion: "hc-conv-1",
  } as never;
  const projet = { posture: "recherche", intent: "achat", rawText: null, parsed: { reformulation: "x", hardConstraints: {}, preferences: [] }, updatedAt: null } as never;
  const moduleFacts = (logement: unknown) => ({
    insee: "99999", nom: "Exemple", dept: "99", lat: 43.6, lon: 1.44, uu: "99999", tailleVille: 10_000, tailleVilleSource: "urban_unit",
    reliefProximite: 0, merCentreKm: 150, population: 10_000, altitude: 50, catnatInondation: 0, inondationRisque: 10, climat: null, scores: {},
    hasAddress: true, logement,
  }) as never;
  const reserve = (savedDpe: unknown) => runRules(moduleFacts(buildLogementFacts(data, savedDpe as never)), projet, HARD)
    .facts.find((f) => f.ruleId === "logement.dpe-faible");

  assert.equal(reserve(IMMEUBLE_SEUL[0]), undefined); // classe F de l'immeuble : plus de réserve
  const genereF = dpe({ methode_dpe: "dpe appartement généré à partir des données DPE immeuble", etiquette_dpe: "F" });
  assert.match(reserve(genereF)!.statement, /classe ce logement F, une passoire énergétique/);
});

test("SYNTHÈSE · le DPE d'un immeuble n'est jamais le sujet « énergie », et le payload d'une adresse inchangée reste le même", async () => {
  const { buildSynthesisPayload, buildCoverage } = await import("./logement-synthesis-cache.ts");
  const base = { dpeCandidatesStatus: "present" } as const;
  const retenuImmeuble = buildSynthesisPayload({ ...base, dpeSelectionStatus: "user_confirmed", selectedDpe: IMMEUBLE_SEUL[0], dpeCandidates: IMMEUBLE_SEUL } as never) as Record<string, unknown>;
  assert.equal(retenuImmeuble.dpe, null);
  assert.equal(retenuImmeuble.confortEte, null);
  assert.equal(buildCoverage({ ...base, dpeSelectionStatus: "user_confirmed", selectedDpe: IMMEUBLE_SEUL[0] } as never).energie, "unexamined");
  // Les champs que lit le modèle gardent leur sens pour une adresse à DPE d'immeuble : total de
  // l'adresse, écart des classes de logement, présence de l'immeuble. Aucune empreinte existante ne bouge.
  const p = buildSynthesisPayload({ ...base, dpeSelectionStatus: "selection_required", selectedDpe: null, dpeCandidates: IMMEUBLE_ET_INDIVIDUELS } as never) as { diagnostics_adresse: unknown };
  assert.deepEqual(p.diagnostics_adresse, { total: 4, ecart_classes: "C à E", immeuble_entier: true });
  // Des générés seuls ne prétendent plus à un immeuble entier.
  const g = buildSynthesisPayload({ ...base, dpeSelectionStatus: "selection_required", selectedDpe: null, dpeCandidates: GENERES_SEULS } as never) as { diagnostics_adresse: { immeuble_entier: boolean } };
  assert.equal(g.diagnostics_adresse.immeuble_entier, false);
});

test("un type renseigné hors de l'énumération reste indéterminé, même avec une méthode de logement", () => {
  assert.equal(grainDpe({ type_batiment: "tertiaire", methode_dpe: "dpe appartement individuel" }), "indetermine");
  assert.equal(grainDpe({ type_batiment: "", methode_dpe: "dpe appartement individuel" }), "logement");
});

test("IMMEUBLE · la portée s'accorde au nombre de DPE d'immeuble montrés", async () => {
  const { porteeDpeImmeuble } = await import("./dpe-selection-vue.ts");
  assert.equal(porteeDpeImmeuble(1), PORTEE_DPE_IMMEUBLE);
  assert.match(porteeDpeImmeuble(2), /^Ils décrivent chacun un bâtiment dans son ensemble, et ne donnent la classe d'aucun logement/);
  assert.match(porteeDpeImmeuble(2), /ne les attribue pas à ce logement\.$/);
});
