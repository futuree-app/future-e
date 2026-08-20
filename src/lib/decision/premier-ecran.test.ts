import test from "node:test";
import assert from "node:assert/strict";
import { contenuDuHero, ANCRE_PROJET } from "./premier-ecran.ts";
import type { UserProject } from "../user-project.ts";

const projetStructure = {
  posture: "recherche", intent: "achat", rawText: "au calme",
  parsed: { reformulation: "Un lieu calme.", hardConstraints: {}, preferences: [] },
  updatedAt: "2026-08-05T09:00:00.000Z",
} as unknown as UserProject;

const projetSansStructure = {
  posture: "recherche", intent: null, rawText: "au calme", parsed: null,
  updatedAt: "2026-08-05T09:00:00.000Z",
} as unknown as UserProject;

test("payant, projet structuré : le bloc verdict porte le titre, aucun geste ajouté", () => {
  const c = contenuDuHero({ fullReport: true, project: projetStructure, commune: "La Rochelle" });
  assert.equal(c.kind, "verdict");
  assert.equal(c.kind === "verdict" ? c.geste : "absent", null);
});

test("payant, projet présent mais non structuré : le geste demande les priorités, jamais le projet", () => {
  // `conclusion-plan.ts` produit déjà le label « À préciser » et un headline qui invite. Il ne
  // manquait que le geste : sans lui, l'écran dit quoi faire sans donner par où.
  //
  // Et il demande ce qui MANQUE. Redemander « décrivez votre projet » à quelqu'un qui a déclaré son
  // objectif et son intention le renverrait vers un formulaire qu'il a déjà rempli.
  const c = contenuDuHero({ fullReport: true, project: projetSansStructure, commune: "La Rochelle" });
  assert.equal(c.kind, "verdict");
  assert.deepEqual(c.kind === "verdict" ? c.geste : null, {
    label: "Ajouter mes priorités", href: `/rapport#${ANCRE_PROJET}`,
  });
});

test("payant SANS AUCUN PROJET : la page porte le titre, sans jamais lire un plan", () => {
  // Sans `userProject`, `rapport/page.tsx` n'appelle même pas `buildCommuneDossier` : il n'existe
  // aucun dossier, donc aucun plan, donc aucun headline à lire. Confondre cet état avec
  // `project_not_structured` ferait déréférencer un objet nul.
  const c = contenuDuHero({ fullReport: true, project: null, commune: "La Rochelle" });
  assert.equal(c.kind, "invite");
  assert.equal(
    c.kind === "invite" ? c.titre : "",
    "La Rochelle ne se lit pas pareil selon ce que vous cherchez.",
  );
  assert.deepEqual(c.kind === "invite" ? c.geste : null, {
    label: "Décrire mon projet", href: `/rapport#${ANCRE_PROJET}`,
  });
});

test("payant sans projet et sans commune connue : la phrase reste juste, capitale comprise", () => {
  // Le lieu ouvre la phrase : le repli doit porter la majuscule qu'un nom de commune apporte seul.
  const c = contenuDuHero({ fullReport: true, project: null, commune: null });
  assert.equal(
    c.kind === "invite" ? c.titre : "",
    "Ce territoire ne se lit pas pareil selon ce que vous cherchez.",
  );
});

test("non payant : le hero commercial, quel que soit le projet", () => {
  for (const project of [null, projetStructure, projetSansStructure]) {
    assert.equal(contenuDuHero({ fullReport: false, project, commune: "La Rochelle" }).kind, "commercial");
  }
});
