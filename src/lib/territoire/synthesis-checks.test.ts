// FUT-6, D8 : les contrôles portent sur des ASSERTIONS et leur polarité, et sur les nombres. On teste
// la détection ET les faux rejets : une règle trop large punirait des phrases justes.
import test from "node:test";
import assert from "node:assert/strict";
import { buildTerritoireSnapshot } from "./facts.ts";
import { projectForSynthesis } from "./synthesis-contract.ts";
import { checkAssertions, checkNumbers, checkSynthesis } from "./synthesis-checks.ts";
import { auditSyntheses, chatelaillonInputs } from "./__fixtures__/chatelaillon.ts";

const P = projectForSynthesis(buildTerritoireSnapshot(chatelaillonInputs(), "2026-09-28T00:00:00.000Z"), "gwl20");
const rules = (text: string, p = P) => [...new Set(checkAssertions(text, p).map((v) => v.rule))];
const numberErrors = (text: string, p = P) => checkNumbers(text, p).length;

/** Une projection modifiée, pour tester les autres valeurs de catégorie et de risque. */
function withProjection(patch: (p: Record<string, any>) => void): Record<string, unknown> {
  const p = structuredClone(P) as Record<string, any>;
  patch(p);
  return p;
}

// ── Les cinq synthèses de l'audit sont TOUTES rejetées, pour les bons motifs ────────────────

test("les 5 synthèses réelles de l'audit sont rejetées", () => {
  const audit = auditSyntheses();
  assert.equal(audit.length, 5);
  for (const [i, t] of audit.entries()) assert.ok(checkSynthesis(t, P).length > 0, `génération ${i + 1} acceptée à tort`);
});

test("chaque synthèse de l'audit est rejetée pour ses contradictions avec l'écran", () => {
  const [g1, g2, g3, g4, g5] = auditSyntheses().map((t) => rules(t));
  // « petite commune très dense » ; « sols absorbent mal » ; « l'une des communes les plus urbanisées »
  assert.ok(g1.includes("densite:requalifiee-dense") && g1.includes("interdit:impermeabilisation") && g1.includes("interdit:classement-national"));
  // « très urbanisée », « beaucoup de bâti »
  assert.ok(g2.includes("couvert:territoire-tres-bati") && g2.includes("densite:requalifiee-dense"));
  // « l'une des communes les plus densément bâties de France, avec très peu d'espaces verts »
  assert.ok(g3.includes("couvert:territoire-tres-bati") && g3.includes("interdit:classement-national") && g3.includes("interdit:impermeabilisation"));
  // « si peu de couvert végétal », « attire »
  assert.ok(g4.includes("couvert:territoire-tres-bati") && g4.includes("interdit:attractivite"));
  // « très urbanisée », « le béton et le bitume dominent »
  assert.ok(g5.includes("couvert:territoire-tres-bati") && g5.includes("interdit:impermeabilisation"));
});

test("le « moins de 2 % de boisement » de l'audit est un nombre refusé (le boisement ADEME est hors projection)", () => {
  assert.ok(numberErrors("Avec moins de 2 % de boisement, la commune a peu d'ombre.") > 0);
});

// ── Un texte conforme passe ──────────────────────────────────────────────────────────────────

const CONFORME = `Châtelaillon-Plage à l'horizon 2050

## Ce qui domine

Châtelaillon-Plage, 6 227 habitants dans l'agglomération de La Rochelle, présente une densité intermédiaire et une occupation mixte de ses sols : près de la moitié d'espaces urbanisés, mais aussi 21 % de prairies et 10 % de forêts. D'ici 2050, les sols resteraient secs 136 jours par an, et les nuits au-dessus de 20 °C gagneraient 19 unités par rapport à 1976-2005.

## Ce qui tient, ce qui se tend

La population progresse de 0,62 % par an, et près de 10 % des habitants vivaient ailleurs un an plus tôt. Des périmètres d'inondation et de submersion marine sont recensés à l'échelle de la commune, qui a connu 14 reconnaissances de catastrophe naturelle depuis 1982.

## Ce qu'on sous-estime ici

Les restrictions d'eau de niveau crise en vigueur rappellent que la sécheresse des sols n'attend pas 2050. L'effet concret dépendra du quartier et du logement.`;

test("un texte conforme, chiffres arrondis compris, passe tous les contrôles", () => {
  assert.deepEqual(checkSynthesis(CONFORME, P), []);
});

// ── Polarité : le risque NON recensé autorise la négation, interdit l'exposition ────────────

const SANS_SUBMERSION = withProjection((p) => { p.risques_recenses_echelle_communale.submersion_marine = "non recensé"; });
const SANS_INONDATION = withProjection((p) => { p.risques_recenses_echelle_communale.inondation = "non recensé"; });

test("submersion non recensée : « aucun périmètre de submersion n'est recensé » est permis", () => {
  assert.deepEqual(rules("Aucun périmètre de submersion n'est recensé sur la commune.", SANS_SUBMERSION), []);
  assert.deepEqual(rules("La commune n'est pas exposée à la submersion marine selon les données communales.", SANS_SUBMERSION), []);
});

test("submersion non recensée : « le territoire est exposé à la submersion » est refusé", () => {
  assert.deepEqual(rules("Le territoire est exposé à la submersion marine.", SANS_SUBMERSION), ["submersion:exposition-non-recensee"]);
});

test("submersion recensée : la nier est refusé, l'affirmer est permis", () => {
  assert.deepEqual(rules("Il n'y a aucun risque de submersion ici."), ["submersion:exposition-niee"]);
  assert.deepEqual(rules("Le littoral fait partie des zones concernées par la submersion marine."), []);
});

test("inondation non recensée : négation permise, exposition refusée", () => {
  assert.deepEqual(rules("Aucun périmètre d'inondation n'est recensé.", SANS_INONDATION), []);
  assert.deepEqual(rules("Plusieurs quartiers inondables bordent la rivière.", SANS_INONDATION), ["inondation:exposition-non-recensee"]);
});

test("inondation recensée : « sans risque d'inondation » est refusé", () => {
  assert.deepEqual(rules("La commune est sans risque d'inondation."), ["inondation:exposition-niee"]);
});

// ── Faux positifs : des phrases justes ne doivent pas tomber ────────────────────────────────

test("faux positifs : phrases justes sur Châtelaillon, toutes acceptées", () => {
  for (const ok of [
    "Sa densité est intermédiaire, sans être celle d'une commune dense.",
    "La commune n'est pas très dense.",
    "Les espaces urbanisés couvrent près de la moitié de la commune, les prairies un cinquième.",
    "Le territoire n'est pas entièrement bâti : prairies et forêts y tiennent une place réelle.",
    "La recherche d'un logement ici dépend du quartier.",
    "Les résidences secondaires représentent une part marquée des logements.",
    "La population progresse et la part d'arrivants récents est parmi les plus élevées.",
    "Les pluies intenses restent un sujet à suivre.",
    // Phrase réelle du 28/09, refusée à tort par la première version (un appel au modèle perdu) :
    "L'occupation des sols est classée occupation mixte, ce qui distingue ce profil d'un front entièrement bâti.",
    "Loin d'être très urbanisée, la commune garde une part réelle de prairies.",
  ]) {
    assert.deepEqual(rules(ok), [], ok);
  }
});

test("« rural » et « station balnéaire » ne se déduisent pas : refusés faute de fait dédié", () => {
  assert.deepEqual(rules("Une commune au caractère rural."), ["interdit:rural"]);
  assert.deepEqual(rules("Une station balnéaire de la côte."), ["interdit:station-balneaire"]);
  assert.deepEqual(rules("Une station balnéaire recherchée.").sort(), ["interdit:attractivite", "interdit:station-balneaire"]);
});

test("densité : « peu dense » est refusé pour une densité intermédiaire, « dense » accepté pour une commune dense", () => {
  assert.deepEqual(rules("Une commune peu dense."), ["densite:requalifiee-peu-dense"]);
  const DENSE = withProjection((p) => { p.commune.densite.categorie = "Commune dense"; });
  assert.deepEqual(rules("Une commune dense de l'agglomération.", DENSE), []);
});

test("marché du logement : aucune conclusion n'est permise (D5)", () => {
  assert.deepEqual(rules("Le marché est tendu et il y a peu de biens disponibles."), ["interdit:marche-logement"]);
});

// ── Nombres ───────────────────────────────────────────────────────────────────────────────────

test("nombres : valeur exacte, arrondi, et « environ » cohérent sont admis", () => {
  assert.equal(numberErrors("Les résidences secondaires représentent 37,9 % des logements."), 0);
  assert.equal(numberErrors("Les résidences secondaires représentent 38 % des logements."), 0);
  assert.equal(numberErrors("La densité atteint près de 1 000 habitants au km²."), 0);
  assert.equal(numberErrors("Environ 6 200 habitants."), 0);
});

test("nombres : la conversion jours → mois est refusée (136 jours ne font pas 4,5 mois)", () => {
  assert.ok(numberErrors("Les sols resteront secs 4,5 mois par an.") > 0);
  assert.ok(numberErrors("Les sols resteront secs environ 5 mois par an.") > 0);
});

test("nombres : ratio et « x fois plus » refusés quand le résultat n'est pas un fait", () => {
  assert.ok(numberErrors("Les nuits au-dessus de 20 °C seront 4 fois plus nombreuses.") > 0);
});

test("nombres : un « environ » incohérent est refusé", () => {
  assert.ok(numberErrors("Environ 9 000 habitants vivent ici.") > 0);
});

test("limite V1 assumée : un nombre écrit en lettres n'est pas contrôlé", () => {
  assert.equal(numberErrors("La commune compte quatre-vingt-dix mille habitants."), 0);
});

test("forme : trois blocs exigés", () => {
  assert.ok(checkSynthesis("Titre\n\n## Un\n\nTexte.", P).some((v) => v.rule === "format:trois-blocs"));
});

test("nombres : une référence reconstruite par le modèle est refusée, celle de la projection admise", () => {
  // Valeurs de référence 1976-2005 données au modèle (celles que le volet de la carte affiche) :
  // nuits > 20 °C ≈ 5,6 ; jours > 30 °C = 7. « Plus de 7 » est faux (c'est 7), « moins de 6 » est vrai.
  assert.ok(numberErrors("Contre un peu plus de 7 auparavant.") > 0);
  assert.equal(numberErrors("Contre moins de 6 en référence."), 0);
  assert.equal(numberErrors("Contre environ 7 jours au-dessus de 30 °C sur la période 1976-2005."), 0);
});

test("nombres : l'unité compte (des nuits ne se valident pas sur des jours de pluie)", () => {
  assert.ok(numberErrors("On compterait 5 nuits de plus.") > 0); // 5 n'existe qu'en jours (pluie, feu)
});

