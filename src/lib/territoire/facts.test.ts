// FUT-6 : le registre des faits Territoire, sur Châtelaillon-Plage et sur les doubles vérités.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildTerritoireSnapshot, landCategory, LAND_LABEL, DEMOGRAPHY_PHRASE, type TerritoireInputs } from "./facts.ts";
import { derivedOf, factOf, registryGaps, synthesisFacts } from "../facts/contract.ts";
import { snapshotHash } from "../facts/hash.ts";
import { buildTerritoryIdentity, buildTerritoryCards } from "../territory-identity.ts";
import { projectForSynthesis } from "./synthesis-contract.ts";
import { chatelaillonInputs } from "./__fixtures__/chatelaillon.ts";

const T0 = "2026-09-28T00:00:00.000Z";
const snap = (i: TerritoireInputs = chatelaillonInputs()) => buildTerritoireSnapshot(i, T0);

// ── Châtelaillon-Plage ───────────────────────────────────────────────────────────────────────

test("Châtelaillon : land.category = mixte, density.category = intermédiaire", () => {
  const s = snap();
  assert.equal(derivedOf(s, "land.category")?.value, "mixed");
  assert.equal(derivedOf(s, "land.category")?.label, "Occupation mixte");
  assert.equal(derivedOf(s, "density.category")?.value, "intermediate");
  assert.equal(derivedOf(s, "density.category")?.label, "Densité intermédiaire");
});

test("Châtelaillon : la carte d'identité et la face de carte disent LE MÊME couvert (D4)", () => {
  const s = snap();
  const identity = buildTerritoryIdentity(s);
  const cards = buildTerritoryCards(s);
  // Avant FUT-6 : identité « Dominante urbaine » (grille à 40 %), carte « Occupation mixte » (grille à 50 %).
  assert.equal(identity.solDominant, "Occupation mixte");
  assert.equal(cards.couvertNaturel?.headlineLabel, "Occupation mixte");
  assert.equal(identity.densite?.label, "Densité intermédiaire");
});

test("Châtelaillon : la projection porte la composition OSO et sa catégorie", () => {
  const p = projectForSynthesis(snap(), "gwl20") as Record<string, any>;
  assert.equal(p.occupation_des_sols.categorie, "Occupation mixte");
  assert.equal(p.occupation_des_sols.part_espaces_naturels_pct, 36.5);
  assert.equal(p.occupation_des_sols.composition_pct.espaces_urbanises, 49.2);
  assert.equal(p.occupation_des_sols.composition_pct.prairies, 20.8);
  assert.equal(p.commune.densite.categorie, "Densité intermédiaire");
});

test("Châtelaillon : boisement ADEME, trait distinctif, vieillissement et rayon 15 km hors de la projection, CHACUN avec sa raison", () => {
  const s = snap();
  const allowed = synthesisFacts(s).facts.map((f) => f.key);
  for (const key of ["land.forest_ademe", "place.distinctive_trait", "demography.ageing_65", "land.natural_share_15km"]) {
    assert.ok(!allowed.includes(key), `${key} ne doit pas nourrir la synthèse`);
    const f = factOf(s, key)!;
    assert.equal(f.synthesis.include, false);
    assert.ok(!f.synthesis.include && f.synthesis.reason.length > 10, `${key} : raison absente`);
  }
  const p = JSON.stringify(projectForSynthesis(s, "gwl20"));
  assert.doesNotMatch(p, /1\.5\b/, "le 1,5 % de boisement ADEME ne doit pas atteindre le modèle");
  assert.doesNotMatch(p, /urbanisées de France/);
  assert.doesNotMatch(p, /3\.28/, "le champ vieillissement ne doit pas atteindre le modèle");
  assert.doesNotMatch(p, /27\.9/, "le rayon 15 km ne doit pas atteindre le modèle");
});

test("le registre est complet : tout fait sans carte ou exclu de la synthèse dit pourquoi", () => {
  assert.deepEqual(registryGaps(snap()), []);
});

// ── D1 : le boisement ADEME ne revient qu'en repli explicite ────────────────────────────────

test("D1 : sans OSO, le boisement ADEME entre dans la projection, avec sa limite", () => {
  const i = chatelaillonInputs();
  i.entry = { ...i.entry!, nature: null };
  const s = snap(i);
  assert.equal(factOf(s, "land.forest_ademe")?.synthesis.include, true);
  const p = projectForSynthesis(s, "gwl20") as Record<string, any>;
  assert.equal(p.boisement_ademe_pct.valeur, 1.5);
  assert.match(p.boisement_ademe_pct.limite, /non documentés/);
  assert.equal(p.occupation_des_sols, null);
  assert.equal(derivedOf(s, "land.category"), null);
});

// ── D4 : la même grille partout, y compris aux cas limites ─────────────────────────────────

test("D4 : sur une grille de compositions limites, identité et carte donnent toujours le même libellé", () => {
  const cases: [number, Record<string, number>][] = [
    [30, { artificialise: 45, agricole: 25 }], // l'identité disait « Dominante urbaine » (≥ 40), la carte « mixte »
    [20, { artificialise: 40, agricole: 40 }],
    [25, { artificialise: 50, agricole: 25 }],
    [46, { artificialise: 30, agricole: 24 }],
    [10, { artificialise: 20, agricole: 70 }],
    [15, { artificialise: 35, agricole: 50 }],
    [60, { artificialise: 5, agricole: 35 }],
  ];
  for (const [nat, comp] of cases) {
    const i = chatelaillonInputs();
    i.entry = { ...i.entry!, nature: { brut_pct: nat, radius_pct: 30, composition: comp } };
    const s = snap(i);
    const expected = LAND_LABEL[landCategory(nat, comp)];
    assert.equal(buildTerritoryIdentity(s).solDominant, expected, JSON.stringify(comp));
    assert.equal(buildTerritoryCards(s).couvertNaturel?.headlineLabel, expected, JSON.stringify(comp));
  }
});

test("D4 : le volet de la carte « Espaces naturels » ne porte plus de grille qualificative", () => {
  const src = readFileSync("src/components/report/QuartierClimatData.tsx", "utf8")
    .split("\n").filter((l) => !l.trimStart().startsWith("//")).join("\n");
  assert.doesNotMatch(src, /brutPct >= 75/);
  assert.doesNotMatch(src, /s'équilibrent/);
  assert.doesNotMatch(src, /la commune est très urbanisée/);
});

// ── D5 et D7 : plus de conclusion de marché, plus de causalité démographique ─────────────────

test("D5 : la carte « Logements inoccupés » garde le chiffre, sans conclusion de marché", () => {
  // Le CODE seulement : le commentaire qui explique le retrait cite, lui, les anciens libellés.
  const src = readFileSync("src/components/report/QuartierClimatData.tsx", "utf8")
    .split("\n").filter((l) => !l.trimStart().startsWith("//")).join("\n");
  const bloc = src.slice(src.indexOf('label: "Logements inoccupés"') - 400, src.indexOf('label: "Logements inoccupés"') + 400);
  assert.doesNotMatch(bloc, /Tension sur le logement|Perte d'attractivité|Marché équilibré|Peu de biens disponibles/);
  assert.match(bloc, /% du parc/);
});

test("D7 : aucun récit démographique ne dit « attire » ou « attractive »", () => {
  for (const phrase of Object.values(DEMOGRAPHY_PHRASE)) assert.doesNotMatch(phrase, /attir|attracti/);
  assert.equal(buildTerritoryCards(snap()).demographie?.recitPhrase, "gagne des habitants, avec une part d'arrivants récents parmi les plus élevées");
});

// ── Empreinte ─────────────────────────────────────────────────────────────────────────────────

test("empreinte : une nouvelle lecture VigiEau à valeur identique ne la change pas", () => {
  const a = chatelaillonInputs();
  const b = chatelaillonInputs();
  b.vigieau = { ...b.vigieau!, consultedAt: "2031-01-01T00:00:00.000Z" };
  assert.equal(snapshotHash(buildTerritoireSnapshot(a, T0)), snapshotHash(buildTerritoireSnapshot(b, "2031-01-01T00:00:00.000Z")));
});

test("empreinte : une valeur qui change la change", () => {
  const a = chatelaillonInputs();
  const b = chatelaillonInputs();
  b.saisonnalitePct = 12;
  assert.notEqual(snapshotHash(buildTerritoireSnapshot(a, T0)), snapshotHash(buildTerritoireSnapshot(b, T0)));
});

test("empreinte : aucune donnée de lecteur n'existe dans les entrées du snapshot", () => {
  // Le snapshot est construit uniquement depuis les sources du lieu : rien ne permet d'y glisser un
  // workbook, une relation ou des attentes. Deux lecteurs de la même commune ont la même photo.
  const keys = Object.keys(chatelaillonInputs());
  for (const k of keys) assert.doesNotMatch(k, /workbook|relation|discovery|user|reperes|attentes/i);
});
