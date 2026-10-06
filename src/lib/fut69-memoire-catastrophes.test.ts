// FUT-69 (06/10/2026) : LA MÉMOIRE DES CATASTROPHES SANS FOCUS ARBITRAIRE, LA RÉCONCILIATION
// INONDATION LISIBLE EN QUELQUES SECONDES.
//
// Ces tests éprouvent ce que les blocs DISENT (fonctions pures `catnat-memoire.ts` et
// `inondation-lecture.ts`), et vérifient sur la source que les composants posent ces textes sans en
// écrire d'autres. Aucun appel réseau, aucun appel au modèle.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { faceMemoireCatastrophes, legendeAnneesCatnat, REPERE_NATIONAL } from "./catnat-memoire.ts";
import { construireLectureInondation, type LectureInondation, type ZonageInondationPoint } from "./decision/inondation-lecture.ts";
import { catnatInondationDepuisCompte, libelleCatnatInondation } from "./decision/catnat-evidence.ts";
import type { PerilState } from "./onrn-sinistralite.ts";

const lire = (p: string) => readFileSync(p, "utf8");
const code = (p: string) => lire(p).split("\n").filter((l) => !l.trimStart().startsWith("//") && !l.trimStart().startsWith("*")).join("\n");
// Sur un fichier entier, un message explicite : sans lui, l'échec imprime tout le fichier en
// différentiel, et le rapport de Node peut s'y figer (constaté en mutation le 06/10/2026).
const contient = (src: string, re: RegExp, quoi: string) => assert.ok(re.test(src), `absent : ${quoi} (${re})`);
const neContientPas = (src: string, re: RegExp, quoi: string) => assert.ok(!re.test(src), `présent : ${quoi} (${re})`);

// Une commune où la sécheresse domine (30 sur 50) et l'inondation en pèse 20 : le cas où la face
// mettait l'inondation en avant à tort.
const SECHERESSE_DOMINE = {
  total: 50,
  byRisk: [{ label: "Sécheresse des sols", count: 30 }, { label: "Inondations", count: 20 }],
};
const INONDATION_INDEX = catnatInondationDepuisCompte(20, "17300")!;

// ── Carte générale ───────────────────────────────────────────────────────────────────────────────
test("M1. plusieurs aléas, l'inondation n'est pas principale : la face ne la met pas en avant", () => {
  const f = faceMemoireCatastrophes({ catnat: SECHERESSE_DOMINE, catnatInondation: INONDATION_INDEX, catnatMisAJour: null, ville: null });
  assert.equal(f.val, "50 reconnaissances depuis 1982");
  assert.equal(f.sub, "Surtout sécheresse des sols");
  assert.doesNotMatch(`${f.val} ${f.sub}`, /inondation|Tous risques|Dont/i);
});

test("M2. aucune dominante robuste : la face reste neutre, aucun aléa n'est choisi", () => {
  const egalite = { total: 30, byRisk: [{ label: "Inondations", count: 10 }, { label: "Sécheresse des sols", count: 10 }, { label: "Tempête", count: 10 }] };
  const f = faceMemoireCatastrophes({ catnat: egalite, catnatInondation: catnatInondationDepuisCompte(10, "17300"), catnatMisAJour: null, ville: null });
  assert.equal(f.val, "30 reconnaissances depuis 1982");
  assert.equal(f.sub, "Plusieurs aléas, sans dominante nette");
});

test("M3. une dominante n'apparaît que selon la règle existante (55 %, FUT-60), quel que soit l'aléa", () => {
  const inondationDomine = { total: 20, byRisk: [{ label: "Inondations", count: 16 }, { label: "Tempête", count: 4 }] };
  assert.equal(faceMemoireCatastrophes({ catnat: inondationDomine, catnatInondation: null, catnatMisAJour: null, ville: null }).sub, "Surtout inondations");
  // Même règle pour la sécheresse : c'est la part qui décide, jamais l'aléa.
  const presque = { total: 20, byRisk: [{ label: "Inondations", count: 10 }, { label: "Sécheresse des sols", count: 6 }, { label: "Tempête", count: 4 }] };
  assert.doesNotMatch(faceMemoireCatastrophes({ catnat: presque, catnatInondation: null, catnatMisAJour: null, ville: null }).sub ?? "", /^Surtout/);
});

test("M4. la ventilation réelle reste dans le volet, et le compte de la pastille y est mot pour mot", () => {
  const f = faceMemoireCatastrophes({ catnat: SECHERESSE_DOMINE, catnatInondation: INONDATION_INDEX, catnatMisAJour: null, ville: null });
  const pastille = libelleCatnatInondation(INONDATION_INDEX);
  assert.ok(f.noteInondation!.includes(pastille), "le lecteur arrivé par la pastille retrouve son texte");
  const carte = code("src/components/report/QuartierClimatData.tsx");
  contient(carte, /breakdown: catnat!\.byRisk\.map\(\(rk\) => \(\{/, "carte");
  contient(carte, /note: face\.noteInondation, noteLabel: "Le compte inondation du dossier"/, "carte");
  // Arrivée par la pastille : le volet s'ouvre, sinon le chiffre annoncé serait caché.
  contient(carte, /targets: \["risk\.catnat"\],\s*ouvrirALArrivee: true,/, "carte");
  contient(carte, /f\.ouvrirALArrivee && f\.detail && f\.targets\?\.some\(\(t\) => evidenceAnchorId\(t\) === ancre\)/, "carte");
  // Plus aucune ligne « Tous risques » ni « Dont … » sur la face.
  neContientPas(carte, /Tous risques ·/, "carte");
});

test("M5. relevé direct en panne : le compte inondation est la seule donnée, et le dit", () => {
  const f = faceMemoireCatastrophes({ catnat: null, catnatInondation: INONDATION_INDEX, catnatMisAJour: null, ville: null });
  assert.equal(f.val, "20 reconnaissances liées aux inondations depuis 1982");
  assert.equal(f.sub, "Le relevé de tous les risques n'a pas répondu");
  assert.equal(faceMemoireCatastrophes({ catnat: { total: 0, byRisk: [] }, catnatInondation: null, catnatMisAJour: null, ville: null }).val, "Aucune reconnaissance depuis 1982");
  assert.equal(faceMemoireCatastrophes({ catnat: null, catnatInondation: null, catnatMisAJour: null, ville: null }).missing, true);
});

test("M6. Paris, Lyon, Marseille : le compte de la ville se dit à l'échelle de la ville", () => {
  const paris = { total: 20, byRisk: [{ label: "Inondations", count: 16 }, { label: "Sécheresse des sols", count: 4 }] };
  const f = faceMemoireCatastrophes({ catnat: paris, catnatInondation: catnatInondationDepuisCompte(16, "75111"), catnatMisAJour: null, ville: "Paris" });
  assert.equal(f.sub, "Surtout inondations · À l'échelle de Paris");
  assert.match(f.noteInondation!, /16 reconnaissances liées aux inondations depuis 1982, à l'échelle de Paris\./);
  assert.match(legendeAnneesCatnat([1999, 2016], 2026, "Paris").principale, /depuis 1982, à l'échelle de Paris,/);
  const page = lire("src/app/(account)/rapport/quartier/page.tsx");
  contient(page, /const catnatVille = inseeCode && inseeCode !== codeGaspar\(inseeCode\) \? villeGaspar\(inseeCode\) : null;/, "page");
  contient(page, /<TerritoryYearsBand communeName=\{displayName\} years=\{catnat\.years\} ville=\{catnatVille\} \/>/, "page");
  contient(page, /catnatVille=\{catnatVille\}/, "page");
});

// ── Mémoire du lieu ──────────────────────────────────────────────────────────────────────────────
const annees28 = Array.from({ length: 28 }, (_, i) => 1983 + i); // 1983 à 2010
test("L1. « N années ont connu au moins une reconnaissance », jamais « se détachent »", () => {
  assert.equal(
    legendeAnneesCatnat(annees28, 2026, null).principale,
    "28 années ont connu au moins une reconnaissance de catastrophe naturelle depuis 1982, dont aucune depuis 2012.",
  );
  assert.equal(
    legendeAnneesCatnat([1999, 2003, 2016, 2019, 2022], 2026, null).principale,
    "Cinq années ont connu au moins une reconnaissance de catastrophe naturelle depuis 1982, dont trois depuis 2012.",
  );
  assert.equal(legendeAnneesCatnat([1999], 2026, null).principale, "Une année a connu au moins une reconnaissance de catastrophe naturelle depuis 1982 : 1999.");
  assert.equal(legendeAnneesCatnat([], 2026, null).principale, "Aucune année n'a connu de reconnaissance de catastrophe naturelle depuis 1982.");
  for (const ans of [[], [1999], annees28, [2020, 2021, 2022, 2023, 2024]]) {
    assert.doesNotMatch(legendeAnneesCatnat(ans, 2026, null).principale, /se détache|rapproch|C'est rare|épargn/);
  }
});

test("L2. le repère national quitte le premier niveau, et c'est le même pour toutes les communes", () => {
  const reperes = new Set([[], [1999], annees28].map((a) => legendeAnneesCatnat(a, 2026, null).repere));
  assert.equal(reperes.size, 1);
  assert.equal([...reperes][0], `Repère national : la commune médiane en compte quatre, et une commune sur dix en compte plus de dix.`);
  assert.deepEqual(REPERE_NATIONAL, { mediane: 4, p90: 10 }, "aucun nouveau repère");
  for (const a of [[], [1999], annees28]) assert.doesNotMatch(legendeAnneesCatnat(a, 2026, null).principale, /commune française|médiane|sur dix/);
  const bande = code("src/components/report/TerritoryYearsBand.tsx");
  contient(bande, /\{legende\.principale\}/, "bande");
  contient(bande, /<p className="text-\[12px\] text-ghost mb-1\.5 ml-0\.5">\s*\{legende\.repere\}/, "bande");
  neContientPas(bande, /se détachent|de plus en plus rapprochées|sur dix dépasse/, "bande");
});

// ── Réconciliation inondation ────────────────────────────────────────────────────────────────────
const ZONAGES: ZonageInondationPoint[] = [
  { kind: "zone_inondation", plans: ["PPRI de la Charente"] }, { kind: "zonage_autre" }, { kind: "aucun_zonage" }, { kind: "indisponible" },
];
const ONRN: PerilState[] = [
  { kind: "lecture", cout: "c", frequence: "f", representativite: "r" }, { kind: "aucun" }, { kind: "faible_repr", representativite: "r" }, { kind: "indispo" },
];
const CATNAT = [null, catnatInondationDepuisCompte(0, "17107"), catnatInondationDepuisCompte(16, "17107"), catnatInondationDepuisCompte(16, "75111")];
const toutes = (): LectureInondation[] =>
  ZONAGES.flatMap((zonage) => CATNAT.flatMap((catnat) => ONRN.map((onrn) => construireLectureInondation({ zonage, catnat, onrn }))))
    .filter((l): l is LectureInondation => l !== null);
const premierNiveau = (l: LectureInondation) => [...l.groupes.flatMap((g) => [g.titre, ...g.lignes]), l.pourquoi].join(" ");

test("R1. le cas cible : trois blocs courts, l'adresse, la commune, pourquoi", () => {
  const l = construireLectureInondation({ zonage: { kind: "aucun_zonage" }, catnat: catnatInondationDepuisCompte(16, "17107"), onrn: { kind: "indispo" } })!;
  assert.deepEqual(l.groupes, [
    { titre: "À cette adresse", lignes: ["Aucun plan de prévention des inondations ne réglemente ce point."] },
    { titre: "À l'échelle de la commune", lignes: ["16 reconnaissances de catastrophe naturelle liées aux inondations depuis 1982."] },
  ]);
  assert.equal(
    l.pourquoi,
    "Le zonage est une règle d'urbanisme au point de l'adresse ; les reconnaissances retracent des épisodes passés, à l'échelle de la commune. L'absence de plan ne signifie pas une absence de risque. Aucune de ces lectures ne dit si ce logement a déjà été sinistré.",
  );
  // Rien ne se perd : définitions, sources et limites restent, au niveau secondaire.
  assert.match(l.constats.find((c) => c.cle === "catnat_commune")!.enonce, /acte administratif.*pas une probabilité/);
  assert.match(l.constats.find((c) => c.cle === "zonage_point")!.enonce, /Un zonage encadre la construction/);
  const bloc = code("src/components/report/logement/InondationSection.tsx");
  contient(bloc, /Pourquoi elles ne disent pas la même chose/, "bloc");
  contient(bloc, /<Disclosure summary="Voir les sources et les limites">/, "bloc");
  contient(bloc, /\{lecture\.reconciliation\}[\s\S]*\{lecture\.limite\}/, "bloc");
});

test("R2. aucune combinaison ne conclut à une absence de risque, ni à un sinistre du logement", () => {
  const lectures = toutes();
  assert.ok(lectures.length > 30, `${lectures.length} combinaisons rendues`);
  for (const l of lectures) {
    const t = premierNiveau(l);
    // « absence de risque » n'apparaît que niée.
    for (const m of t.matchAll(/absence (d'événement ou )?de risque/g)) {
      const avant = t.slice(Math.max(0, m.index! - 60), m.index!);
      assert.match(avant, /ne signifie pas une $|ne permet pas de conclure à l'$/, t);
    }
    assert.doesNotMatch(t, /aucun risque|sans risque|pas de risque|à l'abri|épargn|rassur/i, t);
    assert.doesNotMatch(t, /ne se contredisent pas|pas contradictoire/i, "arbitrage porteur du 17/08/2026");
    // Le logement n'est jamais dit sinistré : la seule phrase qui le nomme dit que rien ne le dit.
    assert.match(t, /Aucune de ces lectures ne dit si ce logement a déjà été sinistré\./);
    assert.doesNotMatch(t.replace("Aucune de ces lectures ne dit si ce logement a déjà été sinistré.", ""), /logement/);
    // Absence de zonage inondation au point : toujours bornée au premier niveau.
    if (l.constats.some((c) => c.cle === "zonage_point" && !c.signal)) assert.match(t, /L'absence de plan ne signifie pas une absence de risque\./);
    // Absence ONRN : toujours bornée au premier niveau (garantie 3 de `inondation-lecture`).
    if (l.constats.some((c) => c.cle === "onrn_assurance" && !c.signal)) assert.match(t, /ne permet pas de conclure à l'absence d'événement ou de risque/);
  }
});

test("R3. CatNat est un historique, le PPR une règle : chaque phrase reste à sa place", () => {
  for (const l of toutes()) {
    const commune = l.groupes.find((g) => g.titre === "À l'échelle de la commune")?.lignes.join(" ") ?? "";
    const adresse = l.groupes.find((g) => g.titre === "À cette adresse")?.lignes.join(" ") ?? "";
    assert.doesNotMatch(adresse, /reconnaissance|indemnis/);
    assert.doesNotMatch(commune, /plan de prévention|réglemente/);
    assert.doesNotMatch(premierNiveau(l), /probabilit|chance|risque élevé|risque fort/i);
  }
});

test("R4. le nombre de lectures n'est jamais annoncé en dur : il suit ce qui est rendu", () => {
  const bloc = code("src/components/report/logement/InondationSection.tsx");
  neContientPas(bloc, /[Tt]rois sources|[Dd]eux sources|ces trois lectures|ces deux lectures/, "bloc");
  // La phrase longue, au niveau secondaire, compte les constats réellement rendus.
  const deux = construireLectureInondation({ zonage: { kind: "aucun_zonage" }, catnat: catnatInondationDepuisCompte(16, "17107"), onrn: { kind: "indispo" } })!;
  const trois = construireLectureInondation({ zonage: { kind: "aucun_zonage" }, catnat: catnatInondationDepuisCompte(16, "17107"), onrn: { kind: "aucun" } })!;
  assert.equal(deux.constats.length, 2);
  assert.match(deux.reconciliation, /^Ces deux lectures /);
  assert.equal(trois.constats.length, 3);
  assert.match(trois.reconciliation, /^Ces trois lectures /);
});

test("R5. Paris : le compte de la ville garde son grain dans la réconciliation", () => {
  const l = construireLectureInondation({ zonage: { kind: "aucun_zonage" }, catnat: catnatInondationDepuisCompte(16, "75111"), onrn: { kind: "indispo" } })!;
  assert.deepEqual(l.groupes[1]!.lignes, ["16 reconnaissances de catastrophe naturelle liées aux inondations depuis 1982, à l'échelle de Paris."]);
});

// ── Non-régression FUT-60 ────────────────────────────────────────────────────────────────────────
test("N1. FUT-60 : l'unité reste la reconnaissance, la borne reste 1982", () => {
  const textes = [
    faceMemoireCatastrophes({ catnat: SECHERESSE_DOMINE, catnatInondation: INONDATION_INDEX, catnatMisAJour: catnatInondationDepuisCompte(21, "17300"), ville: null }),
  ].flatMap((f) => [f.val, f.sub ?? "", f.noteInondation ?? ""]).join(" ");
  assert.doesNotMatch(textes, /arrêté/i);
  assert.match(textes, /depuis 1982/);
  assert.match(textes, /L'index actuellement chargé indique 21 reconnaissances liées aux inondations depuis 1982\./);
  assert.doesNotMatch(premierNiveau(construireLectureInondation({ zonage: { kind: "aucun_zonage" }, catnat: INONDATION_INDEX, onrn: { kind: "aucun" } })!), /arrêté/i);
});
