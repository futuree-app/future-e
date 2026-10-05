import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { WIZARD_SKIP_DEFAULTS, hasWizardContent } from "./types.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// CE QUE L'ACCUEIL N'A PLUS LE DROIT D'AFFIRMER (19/09/2026).
//
// Le questionnaire d'accueil produisait trois affirmations qu'aucune donnée n'établissait, sur la
// première page que verra un inconnu le jour de l'ouverture :
//
//   1. « DPE estimé A–B » (ou E–G) à partir du seul ÂGE DÉCLARÉ du logement, sous une source
//      « Estimation issue du parc français (ADEME) ». Le module Logement, lui, refuse de qualifier
//      la performance énergétique sans diagnostic ATTRIBUÉ — c'est même la raison d'être de
//      `deriveThermalEvidence`. L'accueil offrait gratuitement ce que le produit payé s'interdit.
//      Pire : sans âge renseigné, il affichait quand même « DPE estimé D–E », « sur la moyenne du
//      parc français ».
//
//   2. « Votre dépendance à la voiture pèsera de plus en plus dans votre budget », sous
//      « Méthode futur•e · données ADEME ». Une prédiction sur le budget d'une personne, à partir
//      d'une case cochée.
//
//   3. « Achat à risque climatique », affiché comme un résultat chiffré, à partir de la seule
//      mention d'un projet d'achat.
//
// Une personne réelle a reçu les deux premières (maison récente + voiture, relevé en base le
// 19/09/2026).
//
// CE TEST LIT LA SOURCE. Le teaser est un composant React à l'état interne et aux appels réseau ;
// éprouver son rendu demanderait une machinerie que ce dépôt n'a pas. Ce qu'on protège ici est
// exactement ce qui a été retiré : des formulations. Une garde textuelle est faible en général,
// et suffisante pour empêcher un retour en arrière par copier-coller.
// ════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Le CODE du teaser, commentaires retirés. Les commentaires citent volontairement les anciennes
 * formulations pour expliquer ce qui a été retiré et pourquoi : les interdire effacerait la
 * mémoire du défaut, qui est précisément ce qui empêche de le refaire.
 */
const TEASER = readFileSync("src/components/wizard/WizardTeaser.tsx", "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "") // blocs, y compris leurs lignes de continuation
  .split("\n")
  .filter((l) => !l.trim().startsWith("//"))
  .join("\n");

const INTERDITS: { motif: RegExp; pourquoi: string }[] = [
  { motif: /DPE estimé/i, pourquoi: "une classe énergétique déduite de l'âge n'est pas un diagnostic" },
  { motif: /dpeFromAge/, pourquoi: "la table âge → classe énergétique n'a plus de raison d'exister" },
  { motif: /probablement énergivore/i, pourquoi: "affirmation sur un logement jamais examiné" },
  { motif: /probablement bien isolé/i, pourquoi: "affirmation sur un logement jamais examiné" },
  { motif: /pèsera de plus en plus dans votre budget/i, pourquoi: "prédiction budgétaire sans donnée" },
  { motif: /Achat à risque climatique/i, pourquoi: "verdict sur un achat que rien n'a examiné" },
];

test("l'accueil n'affirme plus rien qu'aucune donnée n'établit", () => {
  const restants = INTERDITS.filter(({ motif }) => motif.test(TEASER))
    .map(({ motif, pourquoi }) => `${motif} → ${pourquoi}`);
  assert.deepEqual(restants, [], `Formulations réapparues dans le teaser :\n${restants.join("\n")}`);
});

test("aucune source publique n'est invoquée pour une déduction maison", () => {
  // « Estimation issue du parc français (ADEME) » habillait une règle écrite à la main d'une
  // caution officielle. Citer l'ADEME sous une extrapolation est plus grave que l'extrapolation.
  assert.ok(
    !/Estimation issue du parc français/i.test(TEASER),
    "une déduction interne ne se présente pas sous une source publique",
  );
});

test("passer une question ne remplit plus la réponse à la place du lecteur", () => {
  // `WIZARD_SKIP_DEFAULTS` transformait « je ne sais pas » en « appartement d'âge moyen »,
  // « Services / Numérique », « mixte ». Ces valeurs inventées alimentaient ensuite les signaux,
  // et la trace de ce qui avait été sauté (`unknownAnswers`) n'était jamais persistée avec elles :
  // une fois en base, rien ne distinguait une réponse d'une invention.
  assert.deepEqual(
    WIZARD_SKIP_DEFAULTS,
    {},
    "une absence de réponse doit rester une absence de réponse",
  );
});

test("un questionnaire entièrement passé ne compte pas comme un projet renseigné", () => {
  // Conséquence directe : sans valeurs par défaut, `hasWizardContent` rend false, donc aucune
  // « première lecture » n'est proposée sur la foi de réponses que personne n'a données.
  assert.equal(
    hasWizardContent({ quartier: null, logement: null, metier: null, sante: [], mobilite: null, projets: null }),
    false,
  );
  assert.equal(
    hasWizardContent({ quartier: "Carpentras", logement: null, metier: null, sante: [], mobilite: null, projets: null }),
    true,
  );
});

// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-61 (06/10/2026) : PLUS DE SCORE COMPOSITE NI DE REGISTRE DE GRAVITÉ DANS LE TEASER.
//
// La carte territoriale affichait « Score X/100 · exposition élevée » à partir de `communes_tension`,
// avec deux seuils maison (65 et 40) ; le titre comptait des « points d'attention », les cartes
// floutées des « points d'attention verrouillés », et le repli concluait « aucune exposition
// majeure » dès qu'aucun score ne passait le seuil. Ces tests lisent la source ET éprouvent ce que
// `computeSignals` produit : « la carte n'apparaît plus » et « rien ne dit de gravité » sont deux
// assertions distinctes.
// ════════════════════════════════════════════════════════════════════════════════════════════
import { computeSignals, type SignalContent } from "./teaser-signaux.ts";
import type { WizardAnswers } from "./types.ts";
import type { WizardPreviewData } from "../../app/api/wizard-preview/route.ts";

const SIGNAUX = readFileSync("src/components/wizard/teaser-signaux.ts", "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "").split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
const RENDU = TEASER + "\n" + SIGNAUX;

const reponses = (r: Partial<WizardAnswers> = {}): WizardAnswers =>
  ({ quartier: "Carpentras", logement: null, metier: null, sante: [], mobilite: null, projets: null, ...r }) as WizardAnswers;
const apercu = (r: Partial<WizardPreviewData> = {}): WizardPreviewData => ({
  commune_name: "Carpentras", drias: null, tensions: [], atmo: null, era5: null, fallback: false, ...r,
});
const texte = (s: SignalContent[]) => s.map((x) => [x.headline, x.stat, x.precision ?? "", x.source].join(" | ")).join("\n");
const tension = (score: number, ind_exposition: number | null) =>
  [{ slug: "canicule", score, ind_exposition, ind_vulnerabilite: 50 }, { slug: "feux", score: score - 1, ind_exposition, ind_vulnerabilite: 10 }];

test("T1 : aucun « Score X/100 » dans le teaser", () => {
  assert.doesNotMatch(RENDU, /Score\s*\$?\{?[^\n]*\/100/);
  assert.doesNotMatch(RENDU, /SCORE_FORT|SCORE_MODERE/);
  for (const s of [0, 39, 40, 64, 65, 100])
    assert.doesNotMatch(texte(computeSignals(apercu({ tensions: tension(s, s) }), reponses(), "Carpentras")), /\/100|score/i);
});

test("T2 : aucun « exposition élevée » / « exposition modérée » dérivé du score", () => {
  assert.doesNotMatch(RENDU, /exposition (élevée|modérée)/i);
  assert.doesNotMatch(RENDU, /SLUG_HEADLINES_(FORT|MODERE)/);
  const t = texte(computeSignals(apercu({ tensions: tension(90, 90) }), reponses(), "Carpentras"));
  assert.doesNotMatch(t, /exposition (élevée|modérée)|nettement exposée|risque d'incendie de forêt est élevé/i);
});

test("T3 : aucun compteur « N points d'attention » (titre, repère ERA5)", () => {
  assert.doesNotMatch(RENDU, /points? d(&apos;|')attention/i);
  assert.match(TEASER, /Voici une\{" "\}\s*<span className="italic text-accent">première lecture<\/span>/);
});

test("T4 : aucun « N points d'attention verrouillés »", () => {
  assert.doesNotMatch(RENDU, /verrouillé/i);
  assert.match(TEASER, /La suite dans votre dossier/);
});

test("T5 : le repli ne conclut plus « aucune exposition majeure »", () => {
  assert.doesNotMatch(RENDU, /aucune exposition majeure/i);
  // Scores tous sous l'ancien seuil, aucune autre donnée : le repli ne dit rien de l'exposition.
  const s = computeSignals(apercu({ tensions: tension(10, 10) }), reponses(), "Carpentras");
  assert.equal(s.length, 1);
  assert.match(s[0].headline, /ne fait pas ressortir de donnée spécifique à afficher ici/);
  assert.doesNotMatch(texte(s), /aucun(e)? (exposition|risque)|pas de risque|épargn/i);
});

test("T6 : changer score / ind_exposition ne change plus rien de visible", () => {
  const base = reponses({ logement: { type: "maison" } as WizardAnswers["logement"], mobilite: "voiture" });
  const sans = texte(computeSignals(apercu(), base, "Carpentras"));
  for (const [score, expo] of [[0, null], [39, 39], [40, 40], [65, 65], [100, 100], [100, null]] as const)
    assert.equal(texte(computeSignals(apercu({ tensions: tension(score, expo) }), base, "Carpentras")), sans, `score ${score}`);
});

test("T7 : les cartes indépendantes du score fonctionnent toujours", () => {
  const drias = { canicule_gwl20: 23, canicule_gwl30: 40, delta_canicule: 6, nuits_tropicales_gwl20: 12, delta_precip_pct: -10 };
  const s = computeSignals(apercu({ drias }), reponses({ logement: { type: "appartement" } as WizardAnswers["logement"], mobilite: "voiture" }), "Carpentras");
  assert.deepEqual(s.map((x) => x.icon), ["🌡", "🏠", "🚗"]);
  assert.equal(s[0].stat, "23 jours très chauds par an");
  assert.equal(s[0].precision, "et environ 12 nuits tropicales");
  assert.equal(s[1].stat, "À établir sur le document");
  assert.match(texte(computeSignals(apercu(), reponses({ projets: "achat" }), "Carpentras")), /Ce que votre dossier examinera/);
  assert.match(TEASER, /<Era5AnchorCard era5=\{data\.era5\} ville=\{ville\} \/>/);
});

test("T8 : le CTA est toujours là, au même prix, vers le même checkout", () => {
  assert.match(TEASER, /href="\/checkout\/rapport-complet"/);
  assert.match(TEASER, /Débloquer mon dossier · 14 €/);
  assert.match(TEASER, /Le dossier approfondit cette première lecture à l&apos;échelle de la commune, autour de l&apos;adresse et du logement\./);
});
