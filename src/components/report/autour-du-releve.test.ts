// FUT-125 · CE QUI ENTOURE LE RELEVÉ DANS « MA DÉCISION » : l'en-tête, « Votre projet », « Ce bien ».
//
//   E. l'en-tête : un lieu, un retour vers « Vos lieux », la résidence seulement quand elle diffère ;
//   P. le projet : chaque critère dans un groupe et un seul, l'origine dite une fois, aucun geste perdu ;
//   B. « Ce bien » : mêmes réponses, même route, et la distinction avec le projet et la commune dite ;
//   C. le classique ne bouge pas : la page ne bascule qu'avec `presentation === "releve"`, et les branches
//      Relevé ne portent aucun marqueur de l'identité historique.
// Les composants sont des `.tsx` : ces tests lisent leur source, comme `decision-releve.test.ts`, et
// éprouvent la seule logique pure (`groupesDeCriteres`, `vueCriteres`) en l'exécutant.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeUserProject, type UserProject } from "../../lib/user-project.ts";
import { vueCriteres } from "../../lib/decision/projet-criteres-vue.ts";
import { buildConfirmation } from "../../lib/decision/conditions.ts";
import { groupesDeCriteres } from "./criteres-groupes.ts";

const lire = (p: string) => readFileSync(p, "utf8");
const code = (p: string) => lire(p).split("\n").filter((l) => !l.trim().startsWith("//") && !l.trim().startsWith("*")).join("\n");
const PAGE = code("src/app/(account)/rapport/page.tsx");
const ENTETE = code("src/components/report/EnTeteDossierReleve.tsx");
const CARTE = code("src/components/report/ProjectSummaryCard.tsx");
const CRITERES = code("src/components/report/CriteresDuProjet.tsx");
const BIEN = code("src/components/report/LienAvecCeBien.tsx");

/** La part d'une source comprise entre deux repères (le second exclu). */
function entre(src: string, debut: string, fin: string): string {
  const i = src.indexOf(debut);
  const j = src.indexOf(fin, i + debut.length);
  assert.ok(i >= 0 && j > i, `repères introuvables : « ${debut} » … « ${fin} »`);
  return src.slice(i, j);
}

// Les marqueurs de l'identité historique qu'une branche Relevé ne doit jamais porter (DESIGN.md § 9.2, 9.3).
const HISTORIQUE = [/\bglass\b/, /\buppercase\b/, /tracking-\[/, /text-accent/, /bg-accent/, /rounded-(lg|xl|2xl)/, /font-mono/];
function sansHistorique(nom: string, src: string) {
  for (const m of HISTORIQUE) assert.doesNotMatch(src, m, `${nom} : marqueur historique ${m}`);
}

// ── Projets de test ────────────────────────────────────────────────────────────────────────────

const PREFS = [
  { key: "eviter_grandes_villes", weight: 3, source: "parse" },
  { key: "mobilite_quotidienne", weight: 2, source: "ancre" },
  { key: "vie_etudiante", weight: 2, source: "ancre" },
  { key: "vie_locale", weight: 2, source: "ancre" },
  { key: "calme_sonore", weight: 2, source: "ancre" },
  { key: "proximite_mer", weight: 2, source: "ancre" },
];
const LE = "2026-10-01T00:00:00.000Z";
const recette = normalizeUserProject({
  posture: "recherche", intent: "achat", updatedAt: LE, rawText: "Une ville comme Brest.",
  parsed: { reformulation: "x", hardConstraints: {}, communeAncre: [{ label: "Brest" }], preferences: PREFS },
})!;
const origin = { kind: "ancre" as const, labels: ["Brest"] };
const avecGestes: UserProject = {
  ...recette,
  adoptions: [{ criterion: { kind: "preference", key: "vie_locale" }, weight: 2, origin, adoptedAt: LE, source: "user" }],
  rejets: [{ criterion: { kind: "preference", key: "vie_etudiante" }, origin, rejectedAt: LE, source: "user" }],
};
const condition = buildConfirmation(avecGestes, { kind: "preference", key: "proximite_mer" }, LE);
const etats: UserProject = condition ? { ...avecGestes, conditions: [condition] } : avecGestes;

// ── E. L'en-tête ───────────────────────────────────────────────────────────────────────────────

test("E1. l'en-tête du Relevé a UNE navigation, vers « Vos lieux », et aucun compteur de communes", () => {
  assert.equal(ENTETE.match(/\/rapport\/dossiers/g)?.length, 1, "un seul lien vers Vos lieux");
  assert.match(ENTETE, /Vos lieux/);
  assert.doesNotMatch(ENTETE, /autres? communes?|Changer de bien|Vous consultez/);
  assert.doesNotMatch(ENTETE, />\s*Dossier\s*</, "le surtitre « ● DOSSIER » a quitté l'en-tête");
  sansHistorique("EnTeteDossierReleve", ENTETE);
});

test("E2. la résidence se dit seulement quand elle diffère, et son retour reste un <a> vers la Route Handler", () => {
  assert.match(PAGE, /residence=\{!territory\.isResidence && territory\.residenceCommune \? territory\.residenceCommune : null\}/);
  assert.match(ENTETE, /<a href="\/rapport\/residence"/);
  assert.doesNotMatch(ENTETE, /<Link[^>]*\/rapport\/residence/, "un <Link> ne naviguerait pas vers une Route Handler");
});

test("E3. le lieu est nommé une fois (l'adresse porte la commune), et l'en-tête ne cite rien de l'artefact", () => {
  assert.equal(ENTETE.match(/adresseAvecLieu\(/g)?.length, 1);
  assert.doesNotMatch(ENTETE, /generatedAt|dateFr|Analyse générée/, "la date qualifie la version servie, pas l'en-tête");
});

test("E4. sous le Relevé, un dossier ouvert perd la ligne « Vous consultez » ; un rapport partiel la garde", () => {
  assert.match(PAGE, /\(presentation !== "releve" \|\| !fullReport\) && \(!territory\.isResidence \|\| communesAilleurs\.length > 0\)/);
  assert.match(PAGE, /presentation === "releve" \? \(\s*<EnTeteDossierReleve/);
  assert.match(PAGE, /<EnTeteDossier\s/, "le classique garde son en-tête");
});

// ── P. Le projet ───────────────────────────────────────────────────────────────────────────────

test("P1. chaque critère tombe dans un groupe et un seul : rien ne se perd, l'ordre du serveur est gardé", () => {
  for (const p of [recette, etats]) {
    const vues = vueCriteres(p);
    const groupes = groupesDeCriteres(vues);
    const ranges = groupes.flatMap((g) => g.criteres.map((c) => c.id));
    assert.deepEqual([...ranges].sort(), vues.map((c) => c.id).sort(), "ni perte ni doublon");
    for (const g of groupes) assert.deepEqual(g.criteres.map((c) => c.id), vues.filter((c) => g.criteres.includes(c)).map((c) => c.id), `ordre de ${g.cle}`);
  }
});

test("P2. l'origine se dit une fois : « Inspirés de Brest », et chaque ligne montre le critère seul", () => {
  const groupes = groupesDeCriteres(vueCriteres(recette));
  const inspires = groupes.find((g) => g.cle === "inspires")!;
  assert.equal(inspires.titre, "Inspirés de Brest");
  assert.equal(inspires.sansOrigine, true);
  assert.equal(inspires.criteres.length, 5);
  for (const c of inspires.criteres) {
    assert.match(c.titre, /^Inspiré de Brest : /, "le titre du serveur garde son origine");
    assert.ok(c.titre.endsWith(c.court), `« ${c.court} » est le critère sans son origine`);
  }
});

test("P3. les états se rangent : gardé et condition dans « Ce que vous demandez », écarté à part", () => {
  const groupes = groupesDeCriteres(vueCriteres(etats));
  const de = (cle: string) => groupes.find((g) => g.cle === cle)?.criteres.map((c) => c.etat) ?? [];
  assert.ok(de("demandes").includes("compris"));
  if (condition) assert.ok(de("demandes").includes("condition"));
  assert.deepEqual(de("ecartes"), ["rejete"]);
  assert.ok(!de("inspires").includes("rejete"));
});

test("P4. deux ancres différentes : aucune origine n'est attribuée à tort", () => {
  const vues = vueCriteres(recette).map((c, i) => (c.etat === "inspire" && i % 2 ? { ...c, ancre: "Lorient" } : c));
  const inspires = groupesDeCriteres(vues).find((g) => g.cle === "inspires")!;
  assert.equal(inspires.sansOrigine, false, "chaque ligne garde son « Inspiré de … »");
  assert.doesNotMatch(inspires.titre, /Brest|Lorient/);
});

test("P5. aucun geste perdu : le Relevé appelle les mêmes actions que le classique, et nomme chaque critère", () => {
  const releve = entre(CRITERES, "if (releve) {", "return (\n    <li>");
  const classique = CRITERES.slice(CRITERES.indexOf("return (\n    <li>"));
  for (const action of ["adopter", "rejeter", "retirer_condition"]) {
    assert.match(classique, new RegExp(`action: "${action}"`));
    assert.match(releve, new RegExp(`action: "${action}"`), `${action} sous le Relevé`);
  }
  assert.match(releve, /onClick=\{confirmer\}/, "la confirmation d'une condition");
  assert.match(releve, /setConfirmation\(true\)/);
  assert.match(releve, /choisirSeuil\(/, "la saisie d'un seuil");
  // Chaque geste a un nom accessible qui dit son critère.
  const gestes = releve.match(/<button key="[^"]+"[^>]*>/g) ?? [];
  assert.ok(gestes.length >= 8);
  for (const g of gestes) assert.match(g, /aria-label=\{pour\(/, g);
  sansHistorique("CriteresDuProjet (Relevé)", releve);
});

test("P6. la carte projet sous le Relevé : mêmes enregistrements, sélecteurs accessibles, aucun marqueur historique", () => {
  const brut = lire("src/components/report/ProjectSummaryCard.tsx");
  const releve = entre(brut, "function releve()", "// ── Projet présent ──");
  const relation = entre(brut, "function relationReleve()", "function releve()");
  assert.match(releve, /onClick=\{save\}/);
  assert.match(relation, /enregistrerRelation\(v\)/);
  assert.match(releve, /<Selecteur[\s\S]*id="projet-posture"/);
  assert.match(releve, /htmlFor="projet-texte"/, "le texte a une étiquette");
  assert.match(CARTE, /if \(presentation === "releve"\) return releve\(\);/);
  sansHistorique("ProjectSummaryCard (Relevé)", releve + relation);
  // La commune n'est pas le logement : la phrase qui les distingue est là.
  assert.match(relation, /Pour la commune entière, quel que soit le logement étudié\./);
});

// ── B. Ce bien ─────────────────────────────────────────────────────────────────────────────────

test("B1. « Ce bien » sous le Relevé : deux questions, la même route, re-cliquer efface", () => {
  const releve = entre(BIEN, 'if (presentation === "releve") {', "return (\n    <section");
  assert.match(releve, /enregistrer\("objectif", objectif === o \? null : o\)/);
  assert.match(releve, /enregistrer\("relation", relation === r \? null : r\)/);
  assert.equal(releve.match(/<Selecteur/g)?.length, 2);
  assert.match(BIEN, /fetch\("\/api\/dossier\/relation"/, "une seule route, inchangée");
  assert.match(releve, /ne valent que pour ce logement : votre projet/, "la distinction avec le projet et la commune");
  sansHistorique("LienAvecCeBien (Relevé)", releve);
});

// ── C. Le classique ────────────────────────────────────────────────────────────────────────────

test("C2. la porte « Préciser cette lecture à une adresse » : même destination, même mesure, sans carte sous le Relevé", () => {
  const src = code("src/app/(account)/rapport/RapportTrackedLinks.tsx");
  const releve = entre(src, 'if (presentation === "releve") {', "return (\n    <div className=\"mt-14");
  assert.match(releve, /href="\/dossier" onClick=\{mesurer\}/);
  assert.match(src, /surface: "fin_de_dossier"/, "la mesure distingue toujours cet emplacement");
  sansHistorique("TrackedAddressCta (Relevé)", releve);
  assert.match(PAGE, /<TrackedAddressCta commune=\{displayName\} inseeCode=\{inseeCode\} presentation=\{presentation\} \/>/);
});

test("C1. la page transmet la présentation résolue, et le pied classique reste au classique", () => {
  assert.match(PAGE, /<ProjectSummaryCard\s+presentation=\{presentation\}/);
  assert.match(PAGE, /presentation=\{presentation\}\s+commune=\{displayName\}/);
  assert.match(PAGE, /presentation === "releve" && fullReport \? \(/);
  for (const [nom, src] of [["ProjectSummaryCard", CARTE], ["CriteresDuProjet", CRITERES], ["LienAvecCeBien", BIEN]] as const) {
    assert.match(src, /presentation(\?: PresentationDossier| = "classique")/, `${nom} : classique par défaut`);
  }
});
