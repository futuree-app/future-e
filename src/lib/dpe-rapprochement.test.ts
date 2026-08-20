import test from "node:test";
import assert from "node:assert/strict";
import {
  etiquetteExploitable, inseeDeBanId, normaliserNumeroDpe, rapprocher, voieComparable,
} from "./dpe-rapprochement.ts";

const dossier = {
  ban_id: "17299_0123_00012",
  address_label: "12 Rue des Tilleuls 17290 Ciré-d'Aunis",
  insee: "17299",
};

test("même identifiant BAN : le diagnostic est à l'adresse du dossier", () => {
  const r = rapprocher({ id_ban: "17299_0123_00012", adresse: "12 rue des tilleuls" }, dossier);
  assert.equal(r.niveau, "adresse");
  assert.equal(r.attachable, true);
  assert.equal(r.confirmationRequise, false);
});

// LE CAS ORDINAIRE, ET NON L'EXCEPTION. Le diagnostiqueur géocode son adresse au moment de la
// saisie ; la BAN lui rend souvent une entrée voisine du même bâtiment. Refuser ce cas rendrait la
// saisie du numéro inutile pour la majorité des gens qui l'utilisent.
test("identifiant BAN différent mais même numéro et même voie : rattachable après confirmation", () => {
  const r = rapprocher(
    { id_ban: "17299_0123_00012_bis", adresse: "12 Rue des Tilleuls 17290 Ciré-d'Aunis" },
    dossier,
  );
  assert.equal(r.niveau, "batiment");
  assert.equal(r.attachable, true);
  assert.equal(r.confirmationRequise, true);
});

test("l'orthographe de la base ne décide de rien : accents, casse et ponctuation sont ignorés", () => {
  assert.equal(voieComparable("12 Rue des Tilleuls 17290 Ciré-d'Aunis"), "12 rue des tilleuls");
  assert.equal(voieComparable("12  RUE  DES TILLEULS"), "12 rue des tilleuls");
  assert.equal(voieComparable("3 Allée de l'Église"), "3 allee de l eglise");
});

// LE POINT QUI A ÉTÉ TRANCHÉ CONTRE UNE PREMIÈRE PROPOSITION. Deux logements d'une même commune
// peuvent être à plusieurs kilomètres : une confirmation humaine ne transforme pas cette
// correspondance faible en preuve d'identité, elle fait porter au lecteur ce qu'on n'a pas vérifié.
test("même commune, autre adresse : jamais rattaché", () => {
  const r = rapprocher(
    { id_ban: "17299_0456_00004", adresse: "4 Rue du Port 17290 Ciré-d'Aunis" },
    dossier,
  );
  assert.equal(r.niveau, "commune");
  assert.equal(r.attachable, false);
});

test("autre commune : refusé", () => {
  const r = rapprocher({ id_ban: "33063_0001_00001", adresse: "1 Cours Pasteur 33000 Bordeaux" }, dossier);
  assert.equal(r.niveau, "ailleurs");
  assert.equal(r.attachable, false);
});

// Un dossier parisien porte le code de l'arrondissement (75107), un diagnostic peut porter celui
// d'un autre. Sans la commune parente, tout Paris serait « ailleurs » pour un dossier parisien.
test("les arrondissements passent par leur commune parente", () => {
  const paris = { ban_id: "75107_1234_00005", address_label: "5 Rue Cler 75007 Paris", insee: "75107" };
  const r = rapprocher({ id_ban: "75116_9999_00001", adresse: "1 Avenue Foch 75116 Paris" }, paris);
  assert.equal(r.niveau, "commune");
  // Rien n'est rattaché pour autant : la commune seule ne suffit jamais.
  assert.equal(r.attachable, false);
});

test("diagnostic sans identifiant BAN et sans voie comparable : rien à rapprocher", () => {
  const r = rapprocher({ id_ban: null, adresse: null }, dossier);
  assert.equal(r.niveau, "inconnu");
  assert.equal(r.attachable, false);
});

test("inseeDeBanId lit la commune, y compris en Corse, et rejette ce qui n'en est pas", () => {
  assert.equal(inseeDeBanId("17299_0123_00012"), "17299");
  assert.equal(inseeDeBanId("2A004_0001_00001"), "2A004");
  assert.equal(inseeDeBanId(null), null);
  assert.equal(inseeDeBanId("bidon"), null);
});

// ── LE NUMÉRO TEL QU'IL EST RECOPIÉ ──────────────────────────────────────────────────────────
test("le numéro se laisse recopier : espaces, minuscules et tirets ne le disqualifient pas", () => {
  assert.equal(normaliserNumeroDpe("2517E1568444P"), "2517E1568444P");
  assert.equal(normaliserNumeroDpe(" 2517 E156 8444P \n"), "2517E1568444P");
  assert.equal(normaliserNumeroDpe("2517e1568444p"), "2517E1568444P");
});

// LA FORME NE DIT PAS LA VALIDITÉ. `1374V1000001B` vient du jeu d'avant juillet 2021, expiré depuis
// le 31/12/2024, et il porte treize caractères comme un diagnostic actuel. Une version antérieure
// rendait ici un booléen « forme moderne » qui aurait fait passer celui-là pour valide.
test("un numéro expiré a la même forme qu'un numéro en cours de validité", () => {
  assert.equal(normaliserNumeroDpe("1374V1000001B"), "1374V1000001B");
  assert.equal(normaliserNumeroDpe("1374V1000001B")?.length, 13);
});

test("ce qui n'a pas la taille d'un numéro est refusé avant tout appel réseau", () => {
  assert.equal(normaliserNumeroDpe("12"), null);
  assert.equal(normaliserNumeroDpe(""), null);
  assert.equal(normaliserNumeroDpe("un numero beaucoup trop long pour en etre un"), null);
});

// ── UN DIAGNOSTIC PEUT NE PORTER AUCUNE ÉTIQUETTE ────────────────────────────────────────────
// Cas réel, relevé le 20/08/2026 sur un dossier de diagnostic technique de 2020 : la base rend
// `classe_consommation_energie: "N"` et `consommation_energie: 0`. Le diagnostiqueur n'a pas pu
// reconstituer les consommations. Sans cette distinction, le zéro se lirait comme une performance
// exemplaire et « N » s'afficherait à la place d'une classe.
test("« N » n'est pas une étiquette, et l'absence non plus", () => {
  assert.equal(etiquetteExploitable("N"), false);
  assert.equal(etiquetteExploitable(null), false);
  assert.equal(etiquetteExploitable(""), false);
  assert.equal(etiquetteExploitable("D"), true);
  assert.equal(etiquetteExploitable("g"), true);
});

