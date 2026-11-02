import { test } from "node:test";
import assert from "node:assert/strict";
import {
  grouperMutations, indexColonnes, lireLigneCsv, rattacheur, resoudreAchat, retenirMutation, median, SEUIL,
} from "./dvf-prix.mjs";
import { resolveurCog } from "../../src/lib/data/bdiff-incendies.ts";
import { verifierGeographieCompatible } from "./logement-index.mjs";

const ENTETE = "id_mutation,date_mutation,numero_disposition,nature_mutation,valeur_fonciere,code_commune,ancien_code_commune,type_local,surface_reelle_bati,longitude,id_parcelle,nombre_pieces_principales,nature_culture,lot1_numero,lot2_numero,lot3_numero,lot4_numero,lot5_numero";
const I = indexColonnes(ENTETE.split(","));
const ligne = ({ id = "m1", date = "2022-05-01", nature = "Vente", valeur = "200000", code = "17300", ancien = "", type = "Maison", surface = "100", lon = "-1.15", parcelle = "17300000AB0001", pieces = "4", culture = "sols", lot1 = "" } = {}) =>
  [id, date, "1", nature, valeur, code, ancien, type, surface, lon, parcelle, pieces, culture, lot1, "", "", "", ""];

test("une vente d'un seul logement avec ses dépendances compte, rapportée à la surface habitable", () => {
  const m = retenirMutation([ligne(), ligne({ type: "Dépendance", surface: "" })], I);
  assert.equal(m.type, "maison");
  assert.equal(m.eurM2, 2000);
});

test("une vente de plusieurs logements est écartée (ef77afdd)", () => {
  const m = retenirMutation([ligne({ type: "Appartement", surface: "40" }), ligne({ type: "Appartement", surface: "60" })], I);
  assert.deepEqual(m, { rejet: "plusieurs_logements" });
});

test("une maison répétée pour chaque culture de sa parcelle reste UNE maison (FUT-138)", () => {
  const lignes = [ligne({ culture: "sols" }), ligne({ culture: "terrains d'agrément" })];
  assert.equal(retenirMutation(lignes, I).eurM2, 2000);
  // la règle d'avant FUT-138, gardée pour la mesure, y voyait deux logements
  assert.deepEqual(retenirMutation(lignes, I, { repetitions: "ef77afdd" }), { rejet: "plusieurs_logements" });
});

test("un appartement répété sous le même numéro de lot reste UN appartement", () => {
  const lignes = [ligne({ type: "Appartement", surface: "45", lot1: "12" }), ligne({ type: "Appartement", surface: "45", lot1: "12" })];
  assert.equal(retenirMutation(lignes, I).type, "appart");
});

test("deux lignes identiques sans lot ni culture distincte : indiscernables, la vente est écartée", () => {
  const lignes = [ligne({ type: "Appartement", surface: "30" }), ligne({ type: "Appartement", surface: "30" })];
  assert.deepEqual(retenirMutation(lignes, I), { rejet: "logements_indiscernables" });
});

test("ventes hors « Vente », sans surface ou aberrantes : écartées avec leur motif", () => {
  assert.equal(retenirMutation([ligne({ nature: "Vente en l'état futur d'achèvement" })], I).rejet, "pas_une_vente");
  assert.equal(retenirMutation([ligne({ surface: "" })], I).rejet, "valeur_ou_surface");
  assert.equal(retenirMutation([ligne({ valeur: "1000" })], I).rejet, "aberrant");
});

test("une colonne manquante est une erreur, pas un décalage silencieux", () => {
  assert.throws(() => indexColonnes(["id_mutation", "date_mutation"]), /colonne DVF absente/);
});

test("une ligne entre guillemets garde ses colonnes", () => {
  assert.deepEqual(lireLigneCsv('a,"rue de la Paix, bis",c'), ["a", "rue de la Paix, bis", "c"]);
  assert.deepEqual(lireLigneCsv('a,"dit ""le haut""",c'), ["a", 'dit "le haut"', "c"]);
});

test("une mutation reprise plus loin dans le fichier n'est pas recomposée", () => {
  const g = grouperMutations(I);
  const vus = [];
  for (const id of ["a", "a", "b", "a"]) g.pousser(ligne({ id }), (gr) => vus.push(`${gr[0][0]}×${gr.length}`));
  const { reprises } = g.finir((gr) => vus.push(`${gr[0][0]}×${gr.length}`));
  assert.deepEqual(vus, ["a×2", "b×1"]);
  assert.equal(reprises, 1);
});

// Extrait réel du COG 2026 : Bazeilles absorbe La Moncelle (2024), Orée d'Anjou change de code (2016 → 49126
// via transfert de chef-lieu, schématisé), Essarts-en-Bocage est découpée (rétablissement de L'Oie, 2024).
const MOUVEMENTS = [
  { MOD: "32", DATE_EFF: "2024-01-01", TYPECOM_AV: "COM", COM_AV: "08294", TYPECOM_AP: "COM", COM_AP: "08053" },
  { MOD: "50", DATE_EFF: "2016-12-15", TYPECOM_AV: "COM", COM_AV: "49069", TYPECOM_AP: "COM", COM_AP: "49126" },
  { MOD: "21", DATE_EFF: "2024-01-01", TYPECOM_AV: "COM", COM_AV: "85084", TYPECOM_AP: "COM", COM_AP: "85084" },
  { MOD: "21", DATE_EFF: "2024-01-01", TYPECOM_AV: "COM", COM_AV: "85084", TYPECOM_AP: "COM", COM_AP: "85165" },
  { MOD: "21", DATE_EFF: "2024-01-01", TYPECOM_AV: "COMD", COM_AV: "85165", TYPECOM_AP: "COM", COM_AP: "85165" },
];
const REF = new Set(["08053", "49126", "85084", "85165", "17300", "75111"]);
const rattacher = rattacheur({ referentiel: REF, mouvements: MOUVEMENTS, resoudre: resolveurCog(REF, MOUVEMENTS) });

test("commune nouvelle : une vente non géocodée sous le code absorbé va à la commune actuelle", () => {
  assert.deepEqual(rattacher({ code: "08294", date: "2022-03-01", geocodee: false }), { code: "08053" });
  assert.deepEqual(rattacher({ code: "49069", date: "2022-03-01", geocodee: false }), { code: "49126" });
});

test("commune rétablie : la vente replacée par sa parcelle va à L'Oie", () => {
  assert.deepEqual(rattacher({ code: "85165", date: "2022-03-01", geocodee: true }), { code: "85165" });
});

test("commune rétablie : une vente non géocodée sous l'ancien code, avant le découpage, n'est attribuée à personne", () => {
  assert.deepEqual(rattacher({ code: "85084", date: "2023-12-31", geocodee: false }), { abstention: "retablissement_non_reparti" });
  // après le découpage, le code désigne le territoire actuel d'Essarts-en-Bocage
  assert.deepEqual(rattacher({ code: "85084", date: "2024-01-02", geocodee: false }), { code: "85084" });
  // géocodée et restée sous 85084 : sa parcelle est dans l'Essarts-en-Bocage d'aujourd'hui
  assert.deepEqual(rattacher({ code: "85084", date: "2022-03-01", geocodee: true }), { code: "85084" });
});

test("arrondissement et code inconnu", () => {
  assert.deepEqual(rattacher({ code: "75111", date: "2022-03-01", geocodee: true }), { code: "75111" });
  assert.deepEqual(rattacher({ code: "99999", date: "2022-03-01", geocodee: false }), { abstention: "hors_index" });
});

test("maille : commune dès le seuil, sinon EPCI, sinon rien ; l'effectif de la maille retenue est porté", () => {
  const dix = Array.from({ length: SEUIL }, (_, i) => 1000 + i * 100);
  const achat = { A: { maison: dix, appart: [2000] }, B: { maison: [], appart: dix.slice(0, 9) } };
  const epciDe = { A: "E", B: "E", C: "F" };
  const achatEpci = { E: { maison: dix, appart: [2000, ...dix.slice(0, 9)] } };
  assert.deepEqual(resoudreAchat(achat, epciDe, achatEpci, "A", "maison"), { med: median(dix), maille: "commune", ventes: SEUIL });
  assert.deepEqual(resoudreAchat(achat, epciDe, achatEpci, "B", "appart"), { med: median(achatEpci.E.appart), maille: "EPCI", ventes: 10 });
  assert.deepEqual(resoudreAchat(achat, epciDe, achatEpci, "C", "maison"), { med: null, maille: "au-dela", ventes: 0 });
});

test("arrondissement : sa ville entière avant l'intercommunalité", () => {
  const dix = Array.from({ length: SEUIL }, (_, i) => 10000 + i * 100);
  const achat = { 75111: { maison: [5000], appart: dix } };
  const ville = { maison: dix, appart: dix };
  const achatEpci = { MGP: { maison: Array(20).fill(4900), appart: dix } };
  assert.equal(resoudreAchat(achat, { 75111: "MGP" }, achatEpci, "75111", "maison", ville).maille, "ville");
  assert.equal(resoudreAchat(achat, { 75111: "MGP" }, achatEpci, "75111", "appart", ville).maille, "commune");
  assert.equal(resoudreAchat(achat, { 75111: "MGP" }, achatEpci, "75111", "maison", null).maille, "EPCI");
});

test("la géographie de la livraison doit être celle de l'index : un mouvement territorial postérieur est refusé", () => {
  assert.doesNotThrow(() => verifierGeographieCompatible([{ MOD: "10", DATE_EFF: "2026-01-01", COM_AV: "x", COM_AP: "x" }]));
  assert.throws(() => verifierGeographieCompatible([{ MOD: "32", DATE_EFF: "2026-01-01", COM_AV: "a", COM_AP: "b" }]), /même géographie/);
});
