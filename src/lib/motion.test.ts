// FUT-75 · LA GRAMMAIRE DU MOUVEMENT, ALIGNÉE ENTRE TYPESCRIPT ET CSS, ET SES INTÉGRATIONS (Q4, Q5).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DUREES, COURBES, ressortLineaire, depassement } from "./motion.ts";

const jetons = readFileSync("src/app/design-tokens.css", "utf8");
const releve = readFileSync("src/components/releve/releve.module.css", "utf8");

test("G1. les jetons --m-* portent les valeurs de motion.ts", () => {
  for (const [cle, var_] of [["pression", "--m-pression"], ["geste", "--m-geste"], ["bascule", "--m-bascule"], ["etat", "--m-etat"], ["ressort", "--m-ressort-duree"]] as const) {
    assert.match(jetons, new RegExp(`${var_}: ${DUREES[cle]}ms;`), var_);
  }
  assert.ok(jetons.includes(`--m-releve: ${COURBES.releve};`));
  assert.ok(jetons.includes(`--m-ressort: ${ressortLineaire()};`), "le ressort de la feuille est celui de motion.ts");
  assert.ok(depassement(ressortLineaire()) <= 0.025, "dépassement ≤ 2,5 %");
  assert.ok(DUREES.ressort <= 220 && DUREES.etat <= 300 && DUREES.pression <= 120, "des durées vives (revue Q2 : pas de traînée)");
});

test("G2. mouvement réduit : déplacements et ressorts à zéro, pour tout le site", () => {
  const reduit = jetons.slice(jetons.indexOf("@media (prefers-reduced-motion: reduce) {\n  :root { --m-"));
  for (const v of ["--m-pression: 0ms", "--m-bascule: 0ms", "--m-etat: 0ms", "--m-ressort-duree: 0ms"]) assert.ok(reduit.includes(v), v);
});

test("Q4. « Données et limites » : toujours un <details> natif, ouvert en continuité, sans toucher au rendu classique", () => {
  const entree = readFileSync("src/components/releve/EntreeReleve.tsx", "utf8");
  assert.match(entree, /<details className=\{`\$\{s\.details\} \$\{s\.detailsFluide\}`\}>/);
  assert.match(releve, /\.detailsFluide::details-content \{[^}]*transition: block-size var\(--m-etat\)/);
  assert.match(releve, /\.detailsFluide\[open\]::details-content \{ block-size: auto; \}/);
  assert.match(releve, /\.detailsFluide \{ interpolate-size: allow-keywords; \}/);
  // Le contenu apparaît, il n'est jamais retiré du DOM : sources et limites restent dans l'arbre d'accessibilité.
  assert.doesNotMatch(releve, /\.detailsFluide[^{]*\{[^}]*(display: none|visibility: hidden)/);
  // La présentation classique (`MethodDetails`) n'est pas concernée.
  assert.doesNotMatch(readFileSync("src/components/report/DecisionFactRenderParts.tsx", "utf8"), /detailsFluide|--m-/);
});
