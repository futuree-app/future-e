import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readCarOwnership, ecartAuCommune, partSansVoiture, texteVoiture, type CarOwnership, type IrisLogementRow } from "./iris-logement.ts";

// Lignes RÉELLES de l'artefact construit le 28/07/2026 depuis base-ic-logement-2022 (INSEE).
const SD_HABITAT: IrisLogementRow = ["H", "1", 46.9, 1350];   // Saint-Denis (93), IRIS d'habitat
const ACTIVITE: IrisLogementRow = ["A", "3", 88.0, 12];       // IRIS d'activité : 12 RP
const DIVERS: IrisLogementRow = ["D", "3", 100.0, 5];         // IRIS divers : 5 RP
const COMMUNE_Z: IrisLogementRow = ["Z", "5", 88.4, 420];     // commune non découpée

test("SECTEUR : un IRIS d'habitat décrit le voisinage, avec sa commune pour situer l'écart", () => {
  const o = readCarOwnership(SD_HABITAT, 58.0, "930660801", "93066");
  assert.equal(o.kind, "secteur");
  assert.equal(o.kind === "secteur" && o.share, 46.9);
  assert.equal(o.kind === "secteur" && o.communeShare, 58.0);
  assert.equal(ecartAuCommune(o), -11.1); // « 11 points de moins que dans l'ensemble de la commune »
});

test("ACTIVITÉ / DIVERS : jamais de conclusion résidentielle, et pas de repli sur l'IRIS voisin", () => {
  // 12 et 5 résidences principales : un « profil des ménages » y serait calculé sur presque rien.
  for (const [row, typ] of [[ACTIVITE, "A"], [DIVERS, "D"]] as const) {
    const o = readCarOwnership(row, 58.0, "999990101", "99999");
    assert.equal(o.kind, "secteur_non_residentiel");
    assert.equal(o.kind === "secteur_non_residentiel" && o.irisType, typ);
    // La commune reste disponible COMME contexte, jamais promue en valeur locale.
    assert.equal(o.kind === "secteur_non_residentiel" && o.communeShare, 58.0);
    assert.equal(ecartAuCommune(o), null);
  }
});

test("COMMUNE NON DÉCOUPÉE : la valeur est communale et s'annonce comme telle", () => {
  const o = readCarOwnership(COMMUNE_Z, null, "010010000", "01001");
  assert.equal(o.kind, "commune_entiere");
  assert.equal(o.kind === "commune_entiere" && o.share, 88.4);
  assert.equal(o.kind === "commune_entiere" && o.motif, "commune_non_decoupee");
  assert.equal(ecartAuCommune(o), null); // aucune variation locale ne peut être établie
});

test("SANS IRIS RÉSOLU : on retombe sur la commune, EXPLICITEMENT — jamais un secteur", () => {
  const o = readCarOwnership(null, 58.0, null, "93066");
  assert.equal(o.kind, "commune_entiere");
  // Saint-Denis EST découpée : le repli ne peut pas se dire « commune non découpée » (FUT-58).
  assert.equal(o.kind === "commune_entiere" && o.motif, "secteur_non_determine");
  assert.notEqual(o.kind, "secteur");
});

test("RIEN DU TOUT : `unknown`, jamais 0 %", () => {
  assert.equal(readCarOwnership(null, null, null, null).kind, "unknown");
  assert.equal(readCarOwnership(null, null, null, "93066").kind, "unknown");
  // Un dénominateur absent est écarté dès le build : aucune ligne ne peut porter une part inventée.
  assert.equal(readCarOwnership(["H", "1", NaN, 0], 58, "930660801", "93066").kind, "unknown");
});

test("La part sans voiture est DÉRIVÉE : la donnée canonique reste celle de l'INSEE", () => {
  assert.equal(partSansVoiture(46.9), 53.1);
  assert.equal(partSansVoiture(100), 0);
  assert.equal(partSansVoiture(0), 100);
});

test("LAB_IRIS est conservé tel quel et ne gouverne RIEN", () => {
  // Sa sémantique n'est pas publiée par l'INSEE : on le transporte, on ne l'interprète pas.
  for (const lab of ["1", "2", "3", "4", "Z"]) {
    const o = readCarOwnership(["H", lab, 46.9, 1350], 58, "930660801", "93066");
    assert.equal(o.kind, "secteur", `label ${lab} ne doit pas changer l'état`);
    assert.equal(o.kind === "secteur" && o.irisLabel, lab);
  }
});

test("Les quatre états sont mutuellement exclusifs", () => {
  const etats = [
    readCarOwnership(SD_HABITAT, 58, "930660801", "93066").kind,
    readCarOwnership(ACTIVITE, 58, "999990101", "99999").kind,
    readCarOwnership(COMMUNE_Z, null, "010010000", "01001").kind,
    readCarOwnership(null, null, null, null).kind,
  ];
  assert.deepEqual(etats, ["secteur", "secteur_non_residentiel", "commune_entiere", "unknown"]);
  assert.equal(new Set(etats).size, 4);
});

// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-58 (06/10/2026) : CE QUE LA CARTE ÉCRIT, à chaque grain. Les tests ci-dessus vérifient l'ÉTAT ;
// ceux-ci vérifient le TEXTE rendu par `texteVoiture`, que `CarOwnershipBlock` pose tel quel. L'état
// `commune_entiere` était juste, et sa phrase affirmait « commune non découpée » même quand seul le
// secteur de l'adresse n'avait pas été résolu.
// ════════════════════════════════════════════════════════════════════════════════════════════
const tout = (o: CarOwnership) => { const t = texteVoiture(o); return t ? `${t.valeur ?? ""} ${t.phrase}` : ""; };
const SD_COMMUNE = 45.4; // Saint-Denis entière, artefact RP 2022

test("M1 : un IRIS d'habitat est rendu comme le chiffre DU SECTEUR, situé face à sa commune", () => {
  const t = texteVoiture(readCarOwnership(["H", "1", 53.1, 882], SD_COMMUNE, "930660101", "93066"))!;
  assert.equal(t.valeur, "53,1\u00a0%");
  assert.match(t.phrase, /^Soit 7,7 points de plus que dans l’ensemble de la commune\. /);
  assert.match(t.phrase, /des ménages de ce secteur n’en ont aucune\.$/);
});

test("M2 : une valeur communale se dit communale, jamais « ce secteur »", () => {
  const nonDecoupee = texteVoiture(readCarOwnership(["Z", "5", 97.2, 354], 97.2, "010010000", "01001"))!;
  assert.equal(nonDecoupee.valeur, "97,2\u00a0%");
  assert.match(nonDecoupee.phrase, /^Cette commune n’est pas découpée en secteurs : la valeur porte sur la commune entière/);
  const nonResolu = texteVoiture(readCarOwnership(null, SD_COMMUNE, null, "93066"))!;
  assert.equal(nonResolu.valeur, "45,4\u00a0%");
  assert.match(nonResolu.phrase, /^Le secteur de cette adresse n’a pas pu être déterminé : la valeur porte sur la commune entière/);
  assert.doesNotMatch(nonResolu.phrase, /pas découpée/);
  // Code IRIS résolu mais absent du millésime : même repli, même phrase.
  assert.equal(tout(readCarOwnership(null, SD_COMMUNE, "939990000", "93066")), tout(readCarOwnership(null, SD_COMMUNE, null, "93066")));
  for (const p of [nonDecoupee.phrase, nonResolu.phrase]) assert.doesNotMatch(p, /ce secteur|dans ce secteur|du secteur/i);
});

test("M3 : un secteur d'activité ou divers ne produit aucun profil résidentiel local", () => {
  for (const row of [["A", "3", 46.9, 462], ["D", "3", 100, 5]] as IrisLogementRow[]) {
    const t = texteVoiture(readCarOwnership(row, SD_COMMUNE, "930661104", "93066"))!;
    assert.equal(t.valeur, null, "aucun chiffre en vedette");
    assert.doesNotMatch(t.phrase, new RegExp(String(row[2]).replace(".", ",")), "le chiffre du secteur d'activité n'apparaît pas");
    assert.match(t.phrase, /n’y est pas établissable\. Sur l’ensemble de la commune, 45,4\u00a0% des ménages/);
  }
  assert.doesNotMatch(tout(readCarOwnership(["A", "3", 46.9, 462], null, "930661104", "93066")), /\d/);
});

test("M4 : en l'absence de donnée, rien n'est rendu, et jamais 0 %", () => {
  assert.equal(texteVoiture(readCarOwnership(null, null, null, null)), null);
  assert.equal(texteVoiture(readCarOwnership(null, null, "930660101", "93066")), null);
  assert.equal(texteVoiture(readCarOwnership(["H", "1", NaN, 0], 58, "930660801", "93066")), null);
});

test("M5 : une valeur communale différente ne remplace jamais silencieusement celle du secteur", () => {
  for (const commune of [10, 45.4, 90]) {
    const o = readCarOwnership(["H", "1", 53.1, 882], commune, "930660101", "93066");
    assert.equal(o.kind === "secteur" && o.share, 53.1);
    assert.equal(texteVoiture(o)!.valeur, "53,1\u00a0%");
  }
});

test("M6 / M7 : ni « motorisation », ni dépendance ou besoin déduits de la possession", () => {
  const etats = [
    readCarOwnership(["H", "1", 53.1, 882], SD_COMMUNE, "930660101", "93066"),
    readCarOwnership(["H", "1", 45.4, 882], SD_COMMUNE, "930660101", "93066"),
    readCarOwnership(["Z", "5", 97.2, 354], 97.2, "010010000", "01001"),
    readCarOwnership(null, SD_COMMUNE, null, "93066"),
    readCarOwnership(["A", "3", 46.9, 462], SD_COMMUNE, "930661104", "93066"),
  ];
  const textes = etats.map(tout).join("\n");
  assert.doesNotMatch(textes, /motoris/i);
  assert.doesNotMatch(textes, /dépend|besoin|indispensable|sans voiture|se passer|obligé|contraint/i);
  const bloc = readFileSync("src/components/report/logement/AutourSection.tsx", "utf8");
  assert.match(bloc, /const t = texteVoiture\(car\);/); // le composant pose ce texte, il n'en écrit pas d'autre
});

test("M8 : parcours réel d'Autour, artefact INSEE RP 2022 relu par le serveur", async () => {
  const { getCarOwnership } = await import("./server/iris-logement-store.ts");
  const secteur = await getCarOwnership("930660101", "93066");
  assert.deepEqual([secteur.kind, secteur.kind === "secteur" && secteur.share, secteur.kind === "secteur" && secteur.communeShare], ["secteur", 53.1, 45.4]);
  const activite = await getCarOwnership("930661104", "93066");
  assert.equal(activite.kind, "secteur_non_residentiel");
  const z = await getCarOwnership("010010000", "01001");
  assert.equal(z.kind === "commune_entiere" && z.motif, "commune_non_decoupee");
  const nonResolu = await getCarOwnership(null, "93066");
  assert.equal(nonResolu.kind === "commune_entiere" && nonResolu.motif, "secteur_non_determine");
  assert.equal((await getCarOwnership(null, "99999")).kind, "unknown");
});
