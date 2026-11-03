import { test } from "node:test";
import assert from "node:assert/strict";
import { texteVentesAutour, typeDuLogement, type TexteVentesAutour, type TypeDuLogement } from "./prix-autour-texte.ts";
import type { ResultatAutour, VentesAutour } from "./prix-autour.ts";
import type { LecturePrix, LogementIndex, MetaPrix } from "./prix-immobiliers.ts";

// Valeurs RÉELLES de l'index (livraison DVF du 20/10/2026, ventes 2022-2025) et lectures réelles des tuiles
// (scripts/dvf-autour/recette.mjs, docs/audits/2026-11-03-fut138-ventes-autour-recette.json).
const META: MetaPrix = { achat: { periode: { debut: "2022-01-01", fin: "2025-12-31" } } };
const lecture = (code: string, nom: string, logement: LogementIndex | null): LecturePrix => ({ code, nom, logement, meta: META });
const LOC = { niveau: "tres_haut" as const, appart_eur_m2: 14.7, maison_eur_m2: 14.6, fiabilite: "observee" as const };
const LA_ROCHELLE = lecture("17300", "La Rochelle", {
  achat: { dispo: true, maison: { eur_m2: 4507, maille: "commune", ventes: 2033 }, appart: { eur_m2: 5000, maille: "commune", ventes: 3707 } }, location: LOC,
});
const L_OIE = lecture("85165", "L'Oie", {
  achat: { dispo: true, maison: { eur_m2: 1735, maille: "commune", ventes: 42 }, appart: { eur_m2: 1764, maille: "EPCI", ventes: 18 } }, location: LOC,
});
const PARIS_11 = lecture("75111", "Paris 11e Arrondissement", {
  achat: { dispo: true, maison: { eur_m2: 12557, maille: "ville", ventes: 462 }, appart: { eur_m2: 10237, maille: "commune", ventes: 9620 } }, location: LOC,
});
const STRASBOURG = lecture("67482", "Strasbourg", { achat: { dispo: false, motif: "hors_dvf" }, location: LOC });
const VILLAGE = lecture("99001", "Village", { achat: { dispo: false, motif: "ventes_insuffisantes" }, location: null });

const APPART: TypeDuLogement = { type: "appart" };
const MAISON: TypeDuLogement = { type: "maison" };
const ventes = (r: Partial<Extract<ResultatAutour, { statut: "ventes" }>> & { type: "appart" | "maison" }): ResultatAutour =>
  ({ statut: "ventes", rayonM: 500, ventes: 543, mediane: 5350, quartiles: [4550, 6150], incertitude: [5250, 5450], ...r });
const TROP_PEU = (type: "appart" | "maison"): ResultatAutour => ({ statut: "trop_peu", type, rayonM: 2000 });
const autour = (commune: LecturePrix, appart: ResultatAutour, maison: ResultatAutour = TROP_PEU("maison")): VentesAutour =>
  ({ edition: "2026-10-20", livraison: "2026-10-20", periode: { debut: "2022-01-01", fin: "2025-12-31" }, appart, maison, commune });

const n = (s: string) => s.replace(/[  ]/g, " ");
const lu = (t: TexteVentesAutour | null) => {
  assert.ok(t);
  return t!;
};
const tout = (t: TexteVentesAutour) => [t.lead, t.absence, t.limite, ...t.methode, t.source, ...t.blocs.flatMap((b) => [b.titre, ...b.phrases, b.avertissement, ...b.chiffres.flatMap((c) => [c.label, c.value])])]
  .filter((x): x is string => Boolean(x)).map(n);
const texte = (t: TexteVentesAutour) => [t.absence, ...t.blocs.flatMap((b) => [...b.phrases, b.avertissement])].filter(Boolean).map((x) => n(x!)).join("\n");

test("le type vient d'un diagnostic CONFIRMÉ, au grain du logement, au type explicite ; sinon, abstention", () => {
  const dpe = (type_batiment: string | null, methode_dpe: string | null) => ({ type_batiment, methode_dpe });
  assert.deepEqual(typeDuLogement("user_confirmed", dpe("appartement", "dpe appartement individuel")), { type: "appart" });
  assert.deepEqual(typeDuLogement("auto_confirmed", dpe("maison", "dpe maison individuelle")), { type: "maison" });
  assert.deepEqual(typeDuLogement("user_confirmed", dpe("Maison Individuelle", null)), { type: "maison" });
  // une proposition non confirmée, un retrait, une absence : on ne s'en sert pas
  for (const s of ["pending", "not_in_list", "not_found", null]) assert.deepEqual(typeDuLogement(s, dpe("maison", null)), { abstention: "sans_diagnostic" }, String(s));
  assert.deepEqual(typeDuLogement("user_confirmed", null), { abstention: "sans_diagnostic" });
  assert.deepEqual(typeDuLogement("user_confirmed", dpe("immeuble", "dpe immeuble collectif")), { abstention: "diagnostic_immeuble" });
  // l'ancien jeu dit « logement » : maison ou appartement ? on ne devine pas
  assert.deepEqual(typeDuLogement("user_confirmed", dpe("logement", null)), { abstention: "type_ambigu" });
  // type absent : la méthode ne suffit pas à choisir les ventes affichées
  assert.deepEqual(typeDuLogement("user_confirmed", dpe(null, "dpe appartement individuel")), { abstention: "type_ambigu" });
  // contradiction entre le type et la méthode : grain indéterminé
  assert.deepEqual(typeDuLogement("user_confirmed", dpe("maison", "dpe immeuble collectif")), { abstention: "type_ambigu" });
});

test("La Rochelle, Vieux-Port : un seul marché (le type du logement), l'écart net, la fourchette", () => {
  const t = lu(texteVentesAutour(autour(LA_ROCHELLE, ventes({ type: "appart" })), APPART));
  assert.equal(n(t.lead), "Ventes d'appartements, le type de ce logement d'après son diagnostic énergétique.");
  assert.equal(t.blocs.length, 1);
  assert.equal(texte(t), [
    "De 2022 à 2025, 543 appartements se sont vendus à moins de 500 m environ de l'adresse. La moitié l'ont été à plus de 5 350 €/m².",
    "C'est plus que la médiane de La Rochelle (5 000 €/m²) : dans ce secteur, les appartements se sont vendus 7 % plus cher.",
    "Un quart de ces ventes s'est fait à moins de 4 550 €/m², un quart à plus de 6 150 €/m².",
  ].join("\n"));
  assert.match(n(t.limite), /ils ne donnent pas la valeur d'un logement précis/);
});

test("un écart que la marge d'incertitude ne permet pas d'affirmer est dit « proche », sans pourcentage", () => {
  const t = lu(texteVentesAutour(autour(PARIS_11, ventes({ type: "appart", ventes: 2573, mediane: 10300, incertitude: [10100, 10300] })), APPART));
  assert.match(texte(t), /C'est proche de la médiane de Paris 11e Arrondissement \(10 237 €\/m²\) : au vu du nombre de ventes, l'écart n'est pas assez net/);
  assert.doesNotMatch(texte(t), /\d %/);
});

test("Laleu : moins cher que la commune, avec l'écart chiffré", () => {
  const t = lu(texteVentesAutour(autour(LA_ROCHELLE, TROP_PEU("appart"), ventes({ type: "maison", ventes: 62, mediane: 3000, quartiles: [2600, 3750], incertitude: [2800, 3250] })), MAISON));
  assert.match(texte(t), /C'est moins que la médiane de La Rochelle \(4 507 €\/m²\) : dans ce secteur, les maisons se sont vendues 33 % moins cher\./);
});

test("sous 20 ventes : avertissement, aucune comparaison à la commune, aucun chiffre communal", () => {
  const t = lu(texteVentesAutour(autour(LA_ROCHELLE, TROP_PEU("appart"), ventes({ type: "maison", ventes: 17, mediane: 950, quartiles: null, incertitude: null })), MAISON));
  assert.equal(n(t.blocs[0].avertissement!), "Avec moins de 20 ventes, une ou deux ventes de plus ou de moins peuvent déplacer ce chiffre : il n'est pas comparé à la commune.");
  assert.doesNotMatch(tout(t).join("\n"), /plus cher|moins cher|proche de la médiane|Un quart|4 507/);
});

test("de 20 à 29 ventes : écart qualifié, pas de quartiles ; à partir de 30 : quartiles", () => {
  const t25 = lu(texteVentesAutour(autour(LA_ROCHELLE, ventes({ type: "appart", ventes: 25, quartiles: null, incertitude: [4900, 5600] })), APPART));
  assert.match(texte(t25), /proche de la médiane/);
  assert.doesNotMatch(texte(t25), /Un quart/);
  assert.equal(t25.blocs[0].avertissement, null);
  const t30 = lu(texteVentesAutour(autour(LA_ROCHELLE, ventes({ type: "appart", ventes: 30 })), APPART));
  assert.match(texte(t30), /Un quart de ces ventes/);
});

test("périmètre élargi : dit EN PREMIER, et que ces ventes ne décrivent pas le voisinage immédiat", () => {
  const t = lu(texteVentesAutour(autour(PARIS_11, TROP_PEU("appart"), ventes({ type: "maison", rayonM: 2000, ventes: 85, mediane: 12050, quartiles: [10100, 15600], incertitude: [10700, 13550] })), MAISON));
  assert.equal(n(t.blocs[0].phrases[0]), "Moins de 10 ventes de maisons à 1 km : le périmètre est élargi à 2 km. Ces ventes décrivent un secteur plus large que le voisinage immédiat.");
  assert.match(texte(t), /85 maisons se sont vendues à moins de 2 km environ/);
  // la référence d'un arrondissement pour les maisons : la ville entière, nommée comme telle
  assert.match(texte(t), /médiane de toute la ville de Paris \(12 557 €\/m²\)/);
  assert.equal(t.blocs[0].chiffres[0].label, "Médiane à 2 km");
});

test("moins de 10 ventes à 2 km : pas de médiane locale, sans revenir au chiffre communal", () => {
  const t = lu(texteVentesAutour(autour(L_OIE, TROP_PEU("appart")), APPART));
  assert.equal(texte(t), "Moins de 10 ventes d'appartements de 2022 à 2025 à moins de 2 km : pas de médiane locale.");
  assert.deepEqual(t.blocs[0].chiffres, []);
  for (const s of tout(t)) {
    assert.doesNotMatch(s, /1 764|1 735|intercommunalité de L'Oie|loyer/i, s);
  }
});

test("Alsace-Moselle : la raison, jamais des ventes voisines hors de la zone", () => {
  const t = lu(texteVentesAutour(autour(STRASBOURG, ventes({ type: "appart" })), APPART));
  assert.equal(t.blocs.length, 0);
  assert.match(n(t.absence!), /livre foncier.*aucun prix de vente n'est publié dans ce secteur/);
});

test("type inconnu ou ambigu : les deux marchés, séparés et titrés, sans rien deviner", () => {
  for (const abstention of ["sans_diagnostic", "diagnostic_immeuble", "type_ambigu"] as const) {
    const t = lu(texteVentesAutour(autour(LA_ROCHELLE, ventes({ type: "appart" }), ventes({ type: "maison", ventes: 62, mediane: 3000, quartiles: [2600, 3750], incertitude: [2800, 3250] })), { abstention }));
    assert.match(n(t.lead), /les deux marchés sont présentés séparément/);
    assert.deepEqual(t.blocs.map((b) => b.titre), ["Appartements", "Maisons"]);
    assert.match(texte(t), /543 appartements/);
    assert.match(texte(t), /62 maisons/);
  }
});

test("lecture désactivée : rien ; en panne : dit comme tel, jamais « pas de médiane locale »", () => {
  assert.equal(texteVentesAutour(undefined, APPART), null);
  const panne = lu(texteVentesAutour(null, APPART));
  assert.match(n(panne.absence!), /n'ont pas pu être lues/);
  assert.equal(panne.blocs.length, 0);
});

test("ventes à proximité mais aucune médiane communale : rien à quoi comparer, sans inventer de référence", () => {
  const t = lu(texteVentesAutour(autour(VILLAGE, ventes({ type: "appart", ventes: 22, quartiles: null, incertitude: [3000, 3500], mediane: 3200 })), APPART));
  assert.match(texte(t), /Aucune médiane des appartements n'est publiée pour Village ni pour son intercommunalité/);
  assert.doesNotMatch(texte(t), /plus cher|moins cher|proche/);
});

test("DOCTRINE : jamais d'estimation du logement, ni montant total, ni surface, ni abordabilité, ni tendance", () => {
  const cas: TexteVentesAutour[] = [
    texteVentesAutour(autour(LA_ROCHELLE, ventes({ type: "appart" })), APPART),
    texteVentesAutour(autour(LA_ROCHELLE, TROP_PEU("appart"), ventes({ type: "maison", ventes: 17, mediane: 950, quartiles: null, incertitude: null })), MAISON),
    texteVentesAutour(autour(PARIS_11, TROP_PEU("appart"), ventes({ type: "maison", rayonM: 2000, ventes: 85, mediane: 12050 })), MAISON),
    texteVentesAutour(autour(L_OIE, TROP_PEU("appart")), APPART),
    texteVentesAutour(autour(STRASBOURG, TROP_PEU("appart")), APPART),
    texteVentesAutour(null, APPART),
    texteVentesAutour(autour(LA_ROCHELLE, ventes({ type: "appart" })), { abstention: "type_ambigu" }),
  ].map(lu);
  for (const t of cas) {
    for (const s of tout(t)) {
      // un montant en euros n'est jamais autre chose qu'un prix au m²
      assert.doesNotMatch(s.replace(/€\/m²/g, ""), /€/, s);
      // aucune surface du logement (« 100 m² »), aucune valeur, estimation ou prix « du bien »
      assert.doesNotMatch(s.replace(/€\/m²/g, ""), /\d\s?m²/, s);
      assert.doesNotMatch(s, /\bvaut\b|valeur estimée|estimation|estimé|votre (bien|logement)|prix de ce logement/i, s);
      assert.doesNotMatch(s, /abordable|accessible|bon marché|bonne affaire|hausse|baisse|augment|grimp|chut|progress|recul|prix moyen/i, s);
    }
  }
});
