import test from "node:test";
import assert from "node:assert/strict";
import { readCarOwnership, ecartAuCommune, partSansVoiture, type IrisLogementRow } from "./iris-logement.ts";

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
  assert.equal(ecartAuCommune(o), null); // aucune variation locale ne peut être établie
});

test("SANS IRIS RÉSOLU : on retombe sur la commune, EXPLICITEMENT — jamais un secteur", () => {
  const o = readCarOwnership(null, 58.0, null, "93066");
  assert.equal(o.kind, "commune_entiere");
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
