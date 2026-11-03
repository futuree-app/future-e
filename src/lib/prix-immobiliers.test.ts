import { test } from "node:test";
import assert from "node:assert/strict";
import {
  blocPrixPourModele, lignePrixComparateur, PHRASE_PRIX, termeDePrix, textePrix,
  type LecturePrix, type LogementIndex, type MetaPrix,
} from "./prix-immobiliers.ts";
import { horsMesureToLignes } from "./comparateur-labels.ts";

// Valeurs RÉELLES de l'index régénéré par FUT-138 (livraison DVF du 20/10/2026, ventes 2022-2025).
const META: MetaPrix = {
  achat: { periode: { debut: "2022-01-01", fin: "2025-12-31" }, livraison: "livraison DGFiP d'octobre 2026, version géolocalisée Etalab du 20/10/2026", source: "DVF (Demandes de valeurs foncières), DGFiP ; version géolocalisée Etalab" },
  location: { source: "Carte des loyers 2025 (ANIL, DGALN), indicateurs de loyers d'annonce par commune", attribution: "Estimations ANIL, à partir des données du Groupe SeLoger et de leboncoin" },
};
const lecture = (code: string, nom: string, logement: LogementIndex | null): LecturePrix => ({ code, nom, logement, meta: META });

const LA_ROCHELLE = lecture("17300", "La Rochelle", {
  achat: { dispo: true, niveau: "tres_haut", maison: { eur_m2: 4507, maille: "commune", ventes: 2033 }, appart: { eur_m2: 5000, maille: "commune", ventes: 3707 } },
  location: { niveau: "tres_haut", appart_eur_m2: 14.7, maison_eur_m2: 14.6, fiabilite: "observee" },
});
const L_OIE = lecture("85165", "L'Oie", {
  achat: { dispo: true, niveau: "moyen", maison: { eur_m2: 1735, maille: "commune", ventes: 42 }, appart: { eur_m2: 1764, maille: "EPCI", ventes: 18 } },
  location: { niveau: "moyen", appart_eur_m2: 10, maison_eur_m2: 8.7, fiabilite: "estimee" },
});
const STRASBOURG = lecture("67482", "Strasbourg", {
  achat: { dispo: false, motif: "hors_dvf" },
  location: { niveau: "tres_haut", appart_eur_m2: 15.6, maison_eur_m2: 15.7, fiabilite: "observee" },
});
const PARIS_11 = lecture("75111", "Paris 11e Arrondissement", {
  achat: { dispo: true, niveau: "tres_haut", maison: { eur_m2: 12557, maille: "ville", ventes: 462 }, appart: { eur_m2: 10237, maille: "commune", ventes: 9620 } },
  location: { niveau: "tres_haut", appart_eur_m2: 31.7, maison_eur_m2: 24.8, fiabilite: "estimee" },
});
const PARIS = lecture("75056", "Paris", {
  achat: { dispo: true, maison: { eur_m2: 12557, maille: "commune", ventes: 462 }, appart: { eur_m2: 10052, maille: "commune", ventes: 114912 } },
  location: null,
});
const SANS_VENTES = lecture("99001", "Village", { achat: { dispo: false, motif: "ventes_insuffisantes" }, location: null });
const TOUS = [LA_ROCHELLE, L_OIE, STRASBOURG, PARIS_11, PARIS, SANS_VENTES, lecture("00000", "Inconnue", null)];

// Les phrases lient les petits mots par une espace insécable (`bindOrphans`) : on compare en espaces simples.
const n = (s: string) => s.replace(/[\u00a0\u202f]/g, " ");
const texte = (l: LecturePrix) => {
  const t = textePrix(l);
  return { ...t, phrase: n(t.phrase), limites: t.limites.map(n), valeur: n(t.valeur), faits: t.faits.map((f) => ({ label: f.label, value: n(f.value) })) };
};
// Les FAITS donnés au lecteur ou au modèle. La ligne de consignes du modèle nomme justement les mots
// interdits (« jamais abordable ») : elle est vérifiée à part.
const sorties = (l: LecturePrix) => {
  const t = texte(l);
  const faitsModele = blocPrixPourModele(l).split("\n").filter((x) => !x.includes("CONSIGNES"));
  return [t.valeur, t.sousTitre, t.source, t.titreVolet, t.phrase, ...t.faits.map((f) => `${f.label} ${f.value}`), ...t.limites, t.methode, n(lignePrixComparateur(l)), ...faitsModele.map(n)];
};

test("La Rochelle : les médianes de l'index, avec période, maille, effectif et source", () => {
  const t = texte(LA_ROCHELLE);
  assert.equal(t.valeur, "5 000 €/m²"); // appartements : le marché le plus fourni à la maille communale
  assert.match(t.sousTitre, /appartements, 2022 à 2025/);
  assert.equal(t.source, "DGFiP, DVF · commune");
  assert.match(t.phrase, /De 2022 à 2025, la moitié des appartements vendus à La Rochelle l'ont été à plus de 5 000 €\/m², et la moitié des maisons vendues à La Rochelle à plus de 4 507 €\/m²\./);
  assert.deepEqual(t.faits.map((f) => f.value), [
    "5 000 €/m² · commune, 3 707 ventes", "4 507 €/m² · commune, 2 033 ventes",
    "14,7 €/m² par mois · estimation communale", "14,6 €/m² par mois · estimation communale",
  ]);
  assert.equal(
    n(lignePrixComparateur(LA_ROCHELLE)),
    "Prix de vente médians 2022-2025 : appartements 5 000 €/m², maisons 4 507 €/m² (DGFiP, DVF). Loyers d'annonce : appartement 14,7 €/m², maison 14,6 €/m² par mois, charges comprises (ANIL).",
  );
});

test("L'Oie (rétablie en 2024) : maisons à la commune, appartements à l'intercommunalité, et c'est dit", () => {
  const t = texte(L_OIE);
  assert.equal(t.valeur, "1 735 €/m²");
  assert.match(t.limites[0], /Moins de 10 ventes d'appartements dans la commune de 2022 à 2025 : le chiffre est celui de l'intercommunalité/);
  // Chaque chiffre à son échelle : le prix intercommunal n'est jamais dit « à L'Oie ».
  assert.equal(t.phrase, "De 2022 à 2025, la moitié des appartements vendus dans l'intercommunalité de L'Oie l'ont été à plus de 1 764 €/m², et la moitié des maisons vendues à L'Oie à plus de 1 735 €/m².");
  assert.match(n(lignePrixComparateur(L_OIE)), /appartements 1 764 €\/m² \(intercommunalité\)/);
  assert.match(n(blocPrixPourModele(L_OIE)), /appartements : 1 764 €\/m² \(échelle : intercommunalité, faute de 10 ventes dans la commune, 18 ventes\)/);
});

test("Strasbourg : pas de prix de vente (Alsace-Moselle, livre foncier), les loyers restent", () => {
  const t = texte(STRASBOURG);
  assert.equal(t.titreVolet, "Prix de vente non disponibles");
  assert.match(t.phrase, /Alsace-Moselle.*livre foncier/);
  assert.equal(t.valeur, "15,6 €/m² par mois");
  assert.equal(n(lignePrixComparateur(STRASBOURG)), "Prix de vente : non publiés en Alsace-Moselle (hors DVF). Loyers d'annonce : appartement 15,6 €/m², maison 15,7 €/m² par mois, charges comprises (ANIL).");
  assert.doesNotMatch(blocPrixPourModele(STRASBOURG), /\d €\/m² \(échelle/);
  assert.ok(!t.limites.some((x) => /livre foncier/.test(x)), "la raison n'est pas répétée sous la phrase");
});

test("Paris 11e : les maisons de la ville entière, jamais celles du Grand Paris", () => {
  const t = texte(PARIS_11);
  assert.equal(t.valeur, "10 237 €/m²");
  assert.match(t.limites[0], /le chiffre est celui de toute la ville de Paris/);
  assert.match(n(lignePrixComparateur(PARIS_11)), /maisons 12 557 €\/m² \(ville de Paris\)/);
  assert.equal(t.phrase, "De 2022 à 2025, la moitié des appartements vendus dans Paris 11e Arrondissement l'ont été à plus de 10 237 €/m², et la moitié des maisons vendues dans toute la ville de Paris à plus de 12 557 €/m².");
});

test("Paris en ville entière : prix de vente, et l'absence de loyer de ville est dite", () => {
  const t = texte(PARIS);
  assert.equal(t.valeur, "10 052 €/m²");
  assert.ok(t.limites.some((l) => /Aucun loyer d'annonce n'est publié pour Paris/.test(l)));
});

test("trop peu de ventes : non disponible avec sa raison, jamais un niveau « moyen »", () => {
  const t = texte(SANS_VENTES);
  assert.equal(t.manquant, true);
  assert.match(t.phrase, /Trop peu de ventes de logements de 2022 à 2025/);
  assert.equal(n(lignePrixComparateur(SANS_VENTES)), "Prix de vente : trop peu de ventes pour un prix médian.");
});

test("DOCTRINE sur toutes les sorties : ni abordabilité, ni évolution, ni estimation d'un bien", () => {
  for (const l of TOUS) {
    for (const s of sorties(l)) {
      assert.doesNotMatch(s, /abordable|accessible|bon marché|bonne affaire|hausse|baisse|augment|grimp|chut|progress|recul/i, `${l.nom} : ${s}`);
      assert.doesNotMatch(s, /prix moyen|valeur estimée|vaut\b/i, `${l.nom} : ${s}`);
    }
  }
});

test("DOCTRINE : achat et location séparés, chacun avec sa source ; un chiffre n'est jamais sans période", () => {
  for (const l of [LA_ROCHELLE, L_OIE, PARIS_11]) {
    const ligne = n(lignePrixComparateur(l));
    assert.match(ligne, /Prix de vente médians 2022-2025 : .*\(DGFiP, DVF\)\. Loyers d'annonce : .*\(ANIL\)\.$/);
    const bloc = n(blocPrixPourModele(l));
    assert.match(bloc, /ventes de 2022 à 2025 \(Source : DGFiP, DVF\)/);
    assert.match(bloc, /Loyers d'ANNONCE .*pas une médiane \(Source : ANIL, Carte des loyers 2025\)/);
    assert.match(bloc, /Jamais la valeur ni une estimation d'un logement précis/);
  }
});

test("le lecteur parle de budget ou de prix : reconnu ; « acheter local », « le marché » : non", () => {
  for (const t of ["budget 250 000 €", "prix au m² raisonnable", "loyer pas trop cher", "300k", "immobilier abordable"]) assert.ok(termeDePrix(t), t);
  for (const t of ["acheter local", "un marché le samedi", "fibre", "calme"]) assert.ok(!termeDePrix(t), t);
});

test("Où vivre : un budget ne reçoit plus « futur•e ne mesure pas ce sujet » sous des cartes qui affichent les prix", () => {
  const lignes = horsMesureToLignes([{ term: "budget 250 000 €", kind: "autre" }, { term: "moustiques", kind: "autre" }]);
  assert.deepEqual(lignes.map((l) => l.phrase), [PHRASE_PRIX, "futur•e ne mesure pas ce sujet : il n'entre dans aucun critère et n'a pas pesé dans le classement."]);
  assert.match(PHRASE_PRIX, /n'a pas classé les communes sur leurs prix/);
});

test("TYPOGRAPHIE : les prix de la carte Territoire ne se coupent pas (espaces insécables réelles)", () => {
  const t = textePrix(LA_ROCHELLE);
  for (const s of [t.valeur, ...t.faits.map((f) => f.value), lignePrixComparateur(LA_ROCHELLE)]) {
    assert.doesNotMatch(s, /\d (\d{3}\b|€)/, s);
  }
  assert.equal(t.valeur, "5 000 €/m²");
});
