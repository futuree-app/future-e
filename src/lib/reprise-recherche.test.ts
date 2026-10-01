// Le geste « Reprendre cette recherche pour définir mon projet » : visible là où il doit l'être, et
// seulement quand il change quelque chose (correctif du smoke post-merge FUT-8).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lireRechercheSession, libelleReprise, SESSION_RECHERCHE_TTL_MS, type ApercuReprise } from "./reprise-recherche.ts";
import { apercuComplet, decisionReprise, parsedPourLeProjet, rechercheDejaReprise } from "./decision/recherche-vers-projet.ts";
import { normalizeUserProject, normalizeUserProjectInput, stampUserProject, type UserProject } from "./user-project.ts";
import type { ParsedProject } from "./comparateur-vie.ts";

const MAINTENANT = Date.parse("2026-10-02T10:00:00.000Z");
const PARSED = { reformulation: "Une ville comme Brest, plutôt petite, dans le Sud-Ouest.", hardConstraints: { zones: [{ zone: "sud_ouest", strength: "hard" }] }, preferences: [{ key: "eviter_grandes_villes", weight: 2, source: "parse" }], communeAncre: [{ label: "Brest" }] } as unknown as ParsedProject;
const TEXTE = "Je cherche une ville comme Brest, plutôt petite, dans le Sud-Ouest";
const session = (over: Record<string, unknown> = {}) => JSON.stringify({ v: 3, savedAt: MAINTENANT - 60_000, submittedText: TEXTE, parsed: PARSED, ...over });
const RECHERCHE = { parsed: PARSED, rawText: TEXTE };
const APERCU_SANS_PROJET: ApercuReprise = { retenus: ["Vivre dans le Sud-Ouest"], propresALaRecherche: [], remplace: null, abandonnes: null, dejaRepris: false };
const APERCU_AVEC_PROJET: ApercuReprise = { ...APERCU_SANS_PROJET, remplace: { texte: "En Bretagne", updatedAt: "2026-10-01T00:00:00.000Z" }, abandonnes: { conditions: 1, precisions: 0, adoptions: 0 } };
const resolveur = () => null;

function projetDepuis(rawText: string, parsed: ParsedProject): UserProject {
  const input = normalizeUserProjectInput({ posture: "recherche", intent: null, rawText, parsed })!;
  return normalizeUserProject(stampUserProject(input, "2026-10-02T09:00:00.000Z"))!;
}

test("1. connecté, recherche avec résultats, aucun projet → « Reprendre cette recherche pour définir mon projet »", () => {
  assert.equal(libelleReprise({ connecte: true, recherche: RECHERCHE, apercu: APERCU_SANS_PROJET, transfertFait: false }), "Reprendre cette recherche pour définir mon projet");
});

test("2. connecté, recherche avec résultats, projet existant → « Utiliser cette recherche pour mon projet »", () => {
  assert.equal(libelleReprise({ connecte: true, recherche: RECHERCHE, apercu: APERCU_AVEC_PROJET, transfertFait: false }), "Utiliser cette recherche pour mon projet");
});

test("3. visiteur anonyme → aucun geste (pas d'aperçu sans session)", () => {
  assert.equal(libelleReprise({ connecte: false, recherche: RECHERCHE, apercu: null, transfertFait: false }), null);
});

test("4. recherche absente, illisible, d'une autre version ou expirée → aucun geste", () => {
  assert.equal(lireRechercheSession(null, MAINTENANT), null);
  assert.equal(lireRechercheSession("pas du json", MAINTENANT), null);
  assert.equal(lireRechercheSession(session({ v: 2 }), MAINTENANT), null);
  assert.equal(lireRechercheSession(session({ savedAt: MAINTENANT - SESSION_RECHERCHE_TTL_MS - 1 }), MAINTENANT), null);
  assert.equal(lireRechercheSession(session({ parsed: null }), MAINTENANT), null);
  assert.deepEqual(lireRechercheSession(session(), MAINTENANT), RECHERCHE);
  assert.equal(libelleReprise({ connecte: true, recherche: null, apercu: APERCU_SANS_PROJET, transfertFait: false }), null);
});

test("5. projet existant : l'aperçu dit ce qui sera remplacé et abandonné, sans rien écrire", () => {
  const actuel = normalizeUserProject({
    posture: "recherche", rawText: "En Bretagne", updatedAt: "2026-10-01T00:00:00.000Z",
    parsed: { reformulation: "x", hardConstraints: { zones: [{ zone: "bretagne", strength: "hard" }] }, preferences: [] },
    conditions: [{ criterion: { kind: "hard", key: "zones" }, fingerprint: "x", confirmedAt: "2026-10-01T00:00:00.000Z", source: "user" }],
  })!;
  const parsed = parsedPourLeProjet(PARSED, TEXTE, resolveur);
  const a = apercuComplet(actuel, parsed, PARSED, TEXTE);
  assert.deepEqual(a.remplace, { texte: "En Bretagne", updatedAt: "2026-10-01T00:00:00.000Z" });
  assert.deepEqual(a.abandonnes, { conditions: 1, precisions: 0, adoptions: 0 });
  assert.equal(a.dejaRepris, false);
  assert.ok(a.retenus.includes("Vivre dans le Sud-Ouest"), a.retenus.join(" | "));
  assert.equal(decisionReprise("apercu", actuel, null), "apercu", "l'aperçu n'écrit jamais");
});

test("6. confirmation : l'écriture n'a lieu qu'avec « enregistrer », sur le projet vu dans l'aperçu", () => {
  const actuel = projetDepuis("En Bretagne", { reformulation: "x", hardConstraints: {}, preferences: [] } as unknown as ParsedProject);
  assert.equal(decisionReprise("enregistrer", actuel, actuel.updatedAt), "ecrire");
  assert.equal(decisionReprise("enregistrer", actuel, "2026-01-01T00:00:00.000Z"), "conflit", "projet changé depuis l'aperçu");
  assert.equal(decisionReprise("enregistrer", null, null), "ecrire", "aucun projet : création");
  assert.equal(decisionReprise(undefined, actuel, actuel.updatedAt), "mode_inconnu");
});

test("7. annulation : aucun appel d'écriture n'est prévu hors « Enregistrer comme projet »", () => {
  const composant = readFileSync(new URL("../components/report/RepriseRecherche.tsx", import.meta.url), "utf8");
  // Un seul envoi « enregistrer », dans la fonction branchée sur le bouton « Enregistrer comme projet ».
  assert.equal(composant.match(/mode: "enregistrer"/g)?.length, 1);
  assert.match(composant, /onClick=\{enregistrer\}[\s\S]{0,400}Enregistrer comme projet/);
  // « Annuler » referme la feuille, sans requête.
  assert.match(composant, /onClick=\{\(\) => \{ setOuvert\(false\); setErreur\(null\); \}\}[\s\S]{0,200}Annuler/);
});

test("8 et placement : le geste est sous « ce que nous avons compris », avec ou sans résultats", () => {
  const ouVivre = readFileSync(new URL("../app/(public)/ou-vivre/OuVivreClient.tsx", import.meta.url), "utf8");
  const resultats = ouVivre.slice(ouVivre.indexOf('{phase === "results" && parsed && ('), ouVivre.indexOf("Cartes territoires"));
  assert.match(resultats, /<InterpretationPanel[\s\S]*<RepriseRecherche key=\{submittedText\} recherche=\{rechercheCourante\}/, "résultats : le bug du smoke");
  const vide = ouVivre.slice(ouVivre.indexOf('{phase === "empty" && parsed && ('), ouVivre.indexOf('{phase === "results" && parsed && ('));
  assert.match(vide, /<RepriseRecherche key=\{submittedText\}/, "aucun résultat : inchangé");
});

test("9. /rapport avec un projet existant : le geste reste proposé (projet décrit, ou seulement déclaré)", () => {
  const carte = readFileSync(new URL("../components/report/ProjectSummaryCard.tsx", import.meta.url), "utf8");
  const present = carte.slice(carte.indexOf("// ── Projet présent ──"), carte.indexOf("// ── Déclaré, sans priorités écrites ──"));
  const declare = carte.slice(carte.indexOf("// ── Déclaré, sans priorités écrites ──"), carte.indexOf("// ── Aucun projet ──"));
  const aucun = carte.slice(carte.indexOf("// ── Aucun projet ──"), carte.indexOf("// ── Édition ──"));
  for (const [nom, bloc] of [["présent", present], ["déclaré", declare], ["aucun", aucun]]) assert.match(bloc!, /<RepriseRecherche/, nom);
});

test("10. après transfert : la même recherche n'est plus proposée ; une nouvelle, si", () => {
  const parsed = parsedPourLeProjet(PARSED, TEXTE, resolveur);
  const cree = projetDepuis(TEXTE, parsed!);
  assert.equal(rechercheDejaReprise(cree, parsed, TEXTE), true);
  assert.equal(libelleReprise({ connecte: true, recherche: RECHERCHE, apercu: apercuComplet(cree, parsed, PARSED, TEXTE), transfertFait: false }), null);
  // Juste après l'enregistrement, avant tout rechargement.
  assert.equal(libelleReprise({ connecte: true, recherche: RECHERCHE, apercu: APERCU_SANS_PROJET, transfertFait: true }), null);
  // Une recherche différente redevient transférable.
  const autre = { ...PARSED, hardConstraints: { zones: [{ zone: "bretagne", strength: "hard" }] } } as unknown as ParsedProject;
  const parsedAutre = parsedPourLeProjet(autre, "En Bretagne", resolveur);
  assert.equal(rechercheDejaReprise(cree, parsedAutre, "En Bretagne"), false);
  assert.equal(libelleReprise({ connecte: true, recherche: { parsed: autre, rawText: "En Bretagne" }, apercu: apercuComplet(cree, parsedAutre, autre, "En Bretagne"), transfertFait: false }), "Utiliser cette recherche pour mon projet");
});
