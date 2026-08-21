import test from "node:test";
import assert from "node:assert/strict";
import { libelleBpeLisible, preuveEquipement, sourceBpe, LIMITE_BPE } from "./logement-bpe-lisible.ts";
import { nearestByCategory } from "./logement-bpe.ts";
import type { BpePoint } from "./logement-autour-types.ts";

// ── LE CAS RÉEL : les deux boulangeries du 6 Grande Rue à Ciré-d'Aunis ────────────────────────
// La BPE 2024 ET la BPE 2025 recensent DEUX établissements au même point, à la même adresse :
// « BOULANGERIE DE CIRE D'AUNIS » (SIRET 509 898 623) et « LE LION GOURMAND » (SIRET 978 491 454).
// Le millésime ne tranche pas. Données publiques, vérifiables dans le fichier officiel.
const LIEU_BOULANGERIE: BpePoint = {
  c: "alimentation", t: "B207", lat: 46.05462, lon: -0.93143,
  a: "6 GRANDE RUE, 17290 CIRÉ-D'AUNIS",
  x: 2,
  s: [
    { n: "BOULANGERIE DE CIRE D'AUNIS", i: "50989862300020" },
    { n: "LE LION GOURMAND", i: "97849145400010" },
  ],
};
const LIEU_ECOLE: BpePoint = {
  c: "education", t: "C108", lat: 46.05546, lon: -0.93351,
  a: "1 RUE DE LA MAIRIE, 17290 CIRÉ-D'AUNIS",
  n: "ECOLE PRIMAIRE PUBLIQUE DU MARAIS", i: "20000797900020",
};
const ADRESSE = { lat: 46.0475, lon: -0.9245 }; // point de lecture, dans la commune

test("un équipement 2025 remonte son nom, son adresse et son identifiant", () => {
  const [education] = nearestByCategory(ADRESSE, [LIEU_ECOLE]).filter((c) => c.category === "education");
  assert.equal(education.nearest?.typeLabel, "École primaire");
  assert.equal(education.nearest?.nom, "ECOLE PRIMAIRE PUBLIQUE DU MARAIS");
  assert.equal(education.nearest?.adresse, "1 RUE DE LA MAIRIE, 17290 CIRÉ-D'AUNIS");
  assert.equal(education.nearest?.identifiant, "20000797900020");
  const p = preuveEquipement(education.nearest, "2025");
  assert.equal(p.nom, "Ecole Primaire Publique du Marais");
  assert.equal(p.adresse, "1 Rue de la Mairie, 17290 Ciré-d'Aunis");
  assert.equal(p.reserve, null);
});

test("deux exploitants au même point : aucun nom n'est choisi, la réserve est dite", () => {
  const [alim] = nearestByCategory(ADRESSE, [LIEU_BOULANGERIE]).filter((c) => c.category === "alimentation");
  assert.equal(alim.nearest?.nom, undefined, "aucun nom ne doit descendre dans le snapshot");
  assert.equal(alim.nearest?.identifiant, undefined);
  assert.equal(alim.nearest?.exploitants, 2);
  const p = preuveEquipement(alim.nearest, "2025");
  assert.equal(p.nom, null);
  assert.equal(p.adresse, "6 Grande Rue, 17290 Ciré-d'Aunis");
  assert.equal(p.reserve, "2 établissements recensés ici : la BPE ne dit pas lesquels sont ouverts.");
  // Le millésime n'est pas répété : il vit sur la ligne de source du bloc.
  assert.equal(p.reserve!.includes("2025"), false);
  // « lesquels » : la donnée ne dit pas si les établissements se sont succédé ou s'ils partagent
  // les locaux, la phrase ne doit donc pas trancher.
  assert.equal(
    preuveEquipement({ exploitants: 4, adresse: "4 RUE DU FOUR" }, "2025").reserve,
    "4 établissements recensés ici : la BPE ne dit pas lesquels sont ouverts.",
  );
  // Ni l'ancienne enseigne, ni la nouvelle : le produit ne tranche pas.
  assert.equal(p.reserve!.includes("LION"), false);
  assert.equal(p.reserve!.includes("BOULANGERIE DE"), false);
});

test("les enregistrements sources ne voyagent pas dans le dossier", () => {
  // Ils restent dans `data/bpe-points`, où un audit les trouve. Le nom d'un professionnel de santé
  // n'a pas à traverser le produit pour n'être jamais affiché.
  const [alim] = nearestByCategory(ADRESSE, [LIEU_BOULANGERIE]).filter((c) => c.category === "alimentation");
  assert.equal("s" in (alim.nearest as object), false);
  assert.equal(JSON.stringify(alim).includes("LION GOURMAND"), false);
});

test("le changement d'enseigne ne change ni la catégorie, ni le point, ni la distance", () => {
  // Ce qui bouge d'un millésime à l'autre, c'est l'exploitant. Le lieu, lui, reste le même lieu :
  // la distance affichée ne doit pas bouger parce qu'une enseigne a changé de nom.
  const avant = nearestByCategory(ADRESSE, [{ ...LIEU_BOULANGERIE, x: undefined, s: undefined, n: "BOULANGERIE DE CIRE D'AUNIS", i: "50989862300020" }]);
  const apres = nearestByCategory(ADRESSE, [{ ...LIEU_BOULANGERIE, x: undefined, s: undefined, n: "LE LION GOURMAND", i: "97849145400010" }]);
  const a = avant.find((c) => c.category === "alimentation")!.nearest!;
  const b = apres.find((c) => c.category === "alimentation")!.nearest!;
  assert.equal(a.distanceMeters, b.distanceMeters);
  assert.equal(a.typeLabel, b.typeLabel);
  assert.notEqual(a.identifiant, b.identifiant); // l'identifiant source, lui, dit le changement
});

test("un lieu à plusieurs exploitants compte pour UN à portée de pas", () => {
  // Deux enseignes successives ne font pas deux boulangeries, et quatre médecins d'un même cabinet
  // ne font pas quatre endroits où aller.
  const aCote = { lat: LIEU_BOULANGERIE.lat, lon: LIEU_BOULANGERIE.lon };
  const [alim] = nearestByCategory(aCote, [LIEU_BOULANGERIE]).filter((c) => c.category === "alimentation");
  assert.equal(alim.withinWalkCount, 1);
  // Deux LIEUX distincts, eux, comptent bien pour deux.
  const autre: BpePoint = { c: "alimentation", t: "B202", lat: 46.0548, lon: -0.9310, a: "2 RUE X, 17290 CIRÉ-D'AUNIS", n: "EPICERIE" };
  const [deux] = nearestByCategory({ lat: 46.0547, lon: -0.9312 }, [LIEU_BOULANGERIE, autre]).filter((c) => c.category === "alimentation");
  assert.equal(deux.withinWalkCount, 2);
});

test("un ancien snapshot, sans identité, reste lisible et ne promet rien", () => {
  const ancien: BpePoint = { c: "alimentation", t: "B207", lat: 46.05462, lon: -0.93143 };
  const [alim] = nearestByCategory(ADRESSE, [ancien]).filter((c) => c.category === "alimentation");
  assert.equal(alim.nearest?.typeLabel, "Boulangerie");
  assert.equal(alim.nearest?.nom, undefined);
  assert.equal(alim.nearest?.adresse, undefined);
  const p = preuveEquipement(alim.nearest, null);
  assert.deepEqual(p, { nom: null, adresse: null, reserve: null });
});

test("le millésime vient de la donnée, et son absence se dit", () => {
  assert.equal(sourceBpe("2025"), "Équipements recensés par la BPE 2025 (Insee)");
  assert.equal(sourceBpe("2024"), "Équipements recensés par la BPE 2024 (Insee)");
  assert.match(sourceBpe(null), /millésime non enregistré dans ce dossier/);
  // Aucune année écrite en dur : c'était la dette de fraîcheur du 16/08/2026.
  assert.equal(sourceBpe(null).includes("2024"), false);
});

test("rien ne promet l'ouverture, les horaires, la qualité ni l'accessibilité", () => {
  assert.match(LIMITE_BPE, /vol d'oiseau/);
  assert.match(LIMITE_BPE, /ni l'ouverture aujourd'hui, ni les horaires, ni l'accès/);
  const textes = [
    LIMITE_BPE,
    sourceBpe("2025"),
    preuveEquipement({ nom: "LE LION GOURMAND", adresse: "6 GRANDE RUE" }, "2025").nom!,
    preuveEquipement({ exploitants: 2, adresse: "6 GRANDE RUE" }, "2025").reserve!,
  ].join(" ").toLowerCase();
  // « ouverture » figure dans LIMITE_BPE, pour dire qu'on ne la connaît pas : ce sont les
  // AFFIRMATIONS d'ouverture, d'accès et de qualité qui sont interdites.
  for (const promesse of ["est ouvert", "ouvert aujourd", "accessible", "bien desservi", "de qualité", "à distance de marche"]) {
    assert.equal(textes.includes(promesse), false, `promesse interdite : ${promesse}`);
  }
});

// ── LA CASSE DES LIBELLÉS ─────────────────────────────────────────────────────────────────────

test("les capitales de la BPE deviennent lisibles sans rien inventer", () => {
  assert.equal(libelleBpeLisible("LE LION GOURMAND"), "Le Lion Gourmand");
  assert.equal(libelleBpeLisible("BOULANGERIE DE CIRE D'AUNIS"), "Boulangerie de Cire d'Aunis");
  assert.equal(libelleBpeLisible("6 GRANDE RUE, 17290 CIRÉ-D'AUNIS"), "6 Grande Rue, 17290 Ciré-d'Aunis");
  // Un sigle reste un sigle.
  assert.equal(libelleBpeLisible("CIRE D AUNIS BP"), "Cire d Aunis BP");
  assert.equal(libelleBpeLisible("CHU DE NANTES"), "CHU de Nantes");
  // Aucun accent n'est restauré : la source ne les porte pas, les deviner serait inventer.
  assert.equal(libelleBpeLisible("ECOLE ELEMENTAIRE"), "Ecole Elementaire");
});
