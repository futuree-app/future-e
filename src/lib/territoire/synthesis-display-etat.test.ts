// FUT-75 · Q5 : LA LIGNE D'ÉTAT DE LA LECTURE ENRICHIE, BRANCHÉE SUR LES VRAIS ÉTATS.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cleDemande, displayReducer, initialDisplay, ligneEtatLecture, type DisplayState } from "./synthesis-display.ts";

const prepa = initialDisplay(null, "lecture immédiate");
const prete = displayReducer(prepa, { type: "enrichedArrived", text: "lecture enrichie" });

test("L1. préparation : jamais de pourcentage ni de temps restant ; le temps écoulé seulement après 10 s", () => {
  for (const ms of [0, 4000, 9999, 12000, 47000, 300000]) {
    const l = ligneEtatLecture(prepa, ms)!;
    assert.equal(l.type, "preparation");
    assert.doesNotMatch(l.texte, /%|reste|restant|encore \d/i);
    assert.match(l.texte, /La lecture ci-dessus est complète/);
  }
  assert.doesNotMatch(ligneEtatLecture(prepa, 9999)!.texte, /depuis/);
  assert.match(ligneEtatLecture(prepa, 12000)!.texte, /depuis 10 s/);
  assert.match(ligneEtatLecture(prepa, 47000)!.texte, /depuis 45 s/, "par pas de 5 s : un repère, pas un chronomètre");
});

test("L2. prête : proposée, jamais substituée ; affichée : on peut revenir à la lecture immédiate", () => {
  assert.equal(prete.shown, "deterministic", "aucun écrasement automatique");
  assert.equal(ligneEtatLecture(prete, 0)!.type, "proposition");
  const affichee = displayReducer(prete, { type: "showEnriched" });
  assert.equal(ligneEtatLecture(affichee, 0)!.type, "retour");
  const retour = displayReducer(affichee, { type: "showDeterministic" });
  assert.equal(retour.shown, "deterministic");
  assert.equal(retour.enrichedText, "lecture enrichie", "la lecture enrichie reste proposée");
  assert.equal(ligneEtatLecture(retour, 0)!.type, "proposition");
});

test("L3. indisponible : dit sans alarme, la lecture affichée reste complète", () => {
  const ind: DisplayState = displayReducer(prepa, { type: "enrichedUnavailable" });
  const l = ligneEtatLecture(ind, 0)!;
  assert.equal(l.type, "indisponible");
  assert.doesNotMatch(l.texte, /erreur|échec|impossible|désolé/i);
  assert.match(l.texte, /complète/);
});

test("L4. le rendu : une seule ligne qui change de fonction, rien ne pulse, aucune transition de vue", () => {
  const src = readFileSync("src/components/report/QuartierSynthesis.tsx", "utf8");
  assert.match(src, /ligneEtatLecture\(state, ecoule\)/);
  assert.doesNotMatch(src, /animate-pulse|startViewTransition|offersEnriched\(state\) &&/);
  assert.match(src, /dispatch\(\{ horizon, event: \{ type: "showDeterministic" \} \}\)/);
  assert.match(src, /key="action"/, "un seul bouton pour afficher et revenir : le focus clavier reste en place");
  assert.match(src, /@media \(prefers-reduced-motion: reduce\)[^}]*\.quartier-synthesis-text, \.lecture-etat-texte, \.lecture-etat-bouton \{ animation: none; \}/);
});

test("L5. changement rapide d'horizon : l'attente affichée est celle de la demande en cours, jamais héritée", () => {
  // Chaque horizon (et chaque instantané, chaque commune) est une demande distincte.
  const a = cleDemande("gwl20", "snap", "30189");
  assert.notEqual(a, cleDemande("gwl30", "snap", "30189"));
  assert.notEqual(a, cleDemande("gwl20", "autre", "30189"));
  assert.equal(a, cleDemande("gwl20", "snap", "30189"));

  // Une demande qui vient de partir ne dit aucune durée, quel que soit le temps passé sur l'horizon quitté.
  const prepare: DisplayState = { shown: "deterministic", enrichedText: null, status: "preparing" };
  assert.doesNotMatch(ligneEtatLecture(prepare, 0)!.texte, /depuis/);
  assert.match(ligneEtatLecture(prepare, 30_000)!.texte, /depuis 30 s/);

  // Le temps écoulé vit dans la ligne d'état, montée sous la clé de la demande : 2050 (30 s d'attente)
  // → 2100 → 2050 remonte la ligne deux fois, et chaque nouvelle demande repart de zéro.
  const src = readFileSync("src/components/report/QuartierSynthesis.tsx", "utf8");
  assert.match(src, /<LigneEtatDemande\s+key=\{cleDemande\(horizon, snapshotHash, inseeCode\)\}/);
  const parent = src.slice(src.indexOf("export default function QuartierSynthesis"), src.indexOf("function LigneEtatDemande"));
  assert.doesNotMatch(parent, /ecoule|debutRef/, "le parent ne garde aucun temps d'une demande à l'autre");
  const ligne = src.slice(src.indexOf("function LigneEtatDemande"));
  assert.match(ligne, /useState\(0\)/, "chaque ligne naît avec une attente nulle");
  assert.match(ligne, /const debut = Date\.now\(\);/, "l'attente est comptée depuis le départ de cette demande");
});
