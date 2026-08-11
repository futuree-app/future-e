import test from "node:test";
import assert from "node:assert/strict";
import {
  catnatInondationDepuisIndex, catnatInondationDepuisCompte,
  libelleCatnatInondation, sourceCatnatInondation, phraseConstatCatnatInondation,
  CATNAT_DEPUIS, CATNAT_EVIDENCE_VERSION,
} from "./catnat-evidence.ts";

test("les deux fabriques produisent le MÊME objet pour la même commune", () => {
  // C'est tout l'objet de ce module : la règle de décision n'a que le nombre (ModuleFacts), la page
  // du module Territoire a l'entrée d'index entière. Si les deux chemins divergeaient d'un champ, la
  // pastille et la carte pourraient à nouveau écrire deux phrases différentes.
  const depuisIndex = catnatInondationDepuisIndex({ inondation: { catnat: 7 } });
  const depuisCompte = catnatInondationDepuisCompte(7);
  assert.deepEqual(depuisIndex, depuisCompte);
});

test("une absence de donnée n'est jamais un zéro", () => {
  // Zéro arrêté est une information ; « on ne sait pas » n'en est pas une. Les confondre afficherait
  // « 0 arrêté inondation depuis 1982 » sur une commune jamais comptée.
  assert.equal(catnatInondationDepuisIndex(null), null);
  assert.equal(catnatInondationDepuisIndex(undefined), null);
  assert.equal(catnatInondationDepuisIndex({}), null);
  assert.equal(catnatInondationDepuisIndex({ inondation: null }), null);
  assert.equal(catnatInondationDepuisCompte(null), null);
  assert.equal(catnatInondationDepuisCompte(undefined), null);
  // Zéro, lui, existe.
  assert.equal(catnatInondationDepuisCompte(0)?.count, 0);
});

test("la phrase est écrite une seule fois, et elle s'accorde", () => {
  assert.equal(libelleCatnatInondation(catnatInondationDepuisCompte(7)!), "7 arrêtés inondation depuis 1982");
  assert.equal(libelleCatnatInondation(catnatInondationDepuisCompte(1)!), "1 arrêté inondation depuis 1982");
  assert.equal(libelleCatnatInondation(catnatInondationDepuisCompte(0)!), "0 arrêté inondation depuis 1982");
});

test("le jargon « CatNat » ne revient pas dans la phrase du lecteur", () => {
  // Il masquait ce que le compte recouvre : la submersion marine n'y est pas, et « CatNat » ne le
  // dit à personne. Le mot reste légitime dans le libellé de SOURCE, qui s'adresse à qui vérifie.
  assert.equal(libelleCatnatInondation(catnatInondationDepuisCompte(7)!).includes("CatNat"), false);
  assert.match(sourceCatnatInondation(catnatInondationDepuisCompte(7)!), /GASPAR/);
  assert.match(sourceCatnatInondation(catnatInondationDepuisCompte(7)!), /submersion marine exclue/);
});

test("la source porte la version de la convention", () => {
  // Un dossier figé doit pouvoir dire sous quelle règle son compte a été établi : la version voyage
  // avec la preuve, elle ne vit pas seulement dans le code du jour.
  assert.match(sourceCatnatInondation(catnatInondationDepuisCompte(7)!), new RegExp(CATNAT_EVIDENCE_VERSION));
  assert.equal(catnatInondationDepuisCompte(7)!.version, CATNAT_EVIDENCE_VERSION);
});

test("l'origine du régime est 1982, pour toutes les communes", () => {
  // Ce n'est pas la date du premier arrêté de CETTE commune : la carte du module affiche, elle, la
  // première reconnaissance réelle, et les deux dates ne disent pas la même chose.
  assert.equal(CATNAT_DEPUIS, 1982);
  assert.equal(catnatInondationDepuisCompte(3)!.depuis, 1982);
});

test("deux formes, un seul endroit : la pastille abrège, le constat nomme le régime", () => {
  // La tentation est d'écrire chacune de son côté, et de les laisser dériver. Elles vivent donc
  // ensemble, et ce test dit laquelle sert à quoi : la pastille est COMPARÉE à la carte, le constat
  // est lu à côté d'elle.
  const o = catnatInondationDepuisCompte(7)!;
  assert.equal(libelleCatnatInondation(o), "7 arrêtés inondation depuis 1982");
  assert.equal(phraseConstatCatnatInondation(o), "7 arrêtés de catastrophe naturelle inondation depuis 1982");
  assert.equal(phraseConstatCatnatInondation(catnatInondationDepuisCompte(1)!), "1 arrêté de catastrophe naturelle inondation depuis 1982");
});

// ── LE GARDE-FOU : personne ne réécrit la phrase ailleurs ─────────────────────────────────────
//
// L'objet partagé ne protège que ce qui passe par lui. Rien n'empêche, dans six mois, d'écrire
// « ${n} arrêtés inondation depuis 1982 » à la main dans une carte ou une règle : le lecteur ne
// verrait aucune différence, jusqu'au jour où l'une des deux formulations changerait. Ce test lit
// les SOURCES et refuse toute occurrence hors du module qui la produit.

test("la phrase du compte n'est écrite QUE dans catnat-evidence", async () => {
  const { readFileSync, readdirSync, statSync } = await import("node:fs");
  const { join } = await import("node:path");

  const fichiers: string[] = [];
  const parcourir = (dir: string) => {
    for (const nom of readdirSync(dir)) {
      const chemin = join(dir, nom);
      if (statSync(chemin).isDirectory()) parcourir(chemin);
      else if (/\.(ts|tsx)$/.test(nom)) fichiers.push(chemin);
    }
  };
  parcourir("src");

  // Le gabarit interpolé, sous ses deux formes de rédaction possibles.
  const motifs = [/arrêtés? inondation depuis/, /arrêtés? de catastrophe naturelle inondation depuis/];
  // LES TESTS ONT LE DROIT DE CITER LA PHRASE, et c'est même leur rôle : recopier à la main une
  // sortie éditoriale est ce qui la FIGE (un test qui importe la constante qu'il vérifie change avec
  // elle et ne prouve rien). Ils ne créent aucune seconde source de vérité en production.
  const estTest = (f: string) => /\.test\.tsx?$/.test(f);
  const autorise = join("src", "lib", "decision", "catnat-evidence.ts");

  const fautifs: string[] = [];
  for (const f of fichiers) {
    if (f === autorise || estTest(f)) continue;
    const src = readFileSync(f, "utf8");
    // Les COMMENTAIRES ont le droit de citer la phrase : ils expliquent précisément ce défaut.
    const code = src.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
    if (motifs.some((m) => m.test(code))) fautifs.push(f);
  }

  assert.deepEqual(
    fautifs, [],
    `la phrase du compte doit venir de catnat-evidence.ts, elle est réécrite dans : ${fautifs.join(", ")}`,
  );
});

// ── Ce que la revue du 11/08/2026 a corrigé ───────────────────────────────────────────────────

test("un compte d'arrêtés est un entier positif ou nul, jamais autre chose", () => {
  // Les fabriques ne vérifiaient que `Number.isFinite` : -1 et 1,5 passaient, et « 1,5 arrêté
  // inondation depuis 1982 » se serait affiché sans que rien ne l'arrête. C'est le genre de valeur
  // qu'une donnée mal parsée produit, et qu'un objet de preuve doit refuser plutôt que mettre en page.
  assert.equal(catnatInondationDepuisCompte(-1), null);
  assert.equal(catnatInondationDepuisCompte(1.5), null);
  assert.equal(catnatInondationDepuisCompte(Number.NaN), null);
  assert.equal(catnatInondationDepuisIndex({ inondation: { catnat: -3 } }), null);
  assert.equal(catnatInondationDepuisIndex({ inondation: { catnat: 2.5 } }), null);
  assert.equal(catnatInondationDepuisCompte(0)?.count, 0);
});

test("l'objet porte la commune : deux INSEE différents ne se comparent pas, même à compte égal", () => {
  const a = catnatInondationDepuisIndex({ insee: "17300", inondation: { catnat: 7 } });
  const b = catnatInondationDepuisCompte(7, "44109");
  assert.equal(a?.insee, "17300");
  assert.equal(b?.insee, "44109");
  assert.notDeepEqual(a, b);
});

test("LA LIMITE ASSUMÉE : la version dit la convention, jamais l'état des données", () => {
  // Deux index contenant des comptes différents produisent tous deux `catnat-1`. Un dossier figé
  // peut donc dire sous quelle règle il a été écrit, jamais sur quel état de la donnée. La racine
  // est ailleurs : `data/comparateur-index.json` ne porte aucune date de génération dans son `meta`
  // (vérifié le 11/08/2026). Ce test existe pour que la limite soit LUE, pas découverte.
  const avant = catnatInondationDepuisCompte(6, "17300")!;
  const apres = catnatInondationDepuisCompte(7, "17300")!;
  assert.equal(avant.version, apres.version);
  assert.notEqual(libelleCatnatInondation(avant), libelleCatnatInondation(apres));
});
