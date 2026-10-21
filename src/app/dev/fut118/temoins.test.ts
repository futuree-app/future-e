// FUT-118 · LES ÉCRANS TÉMOINS RESTENT DES ÉCRANS DE DÉVELOPPEMENT, ET LEURS PHRASES DISENT VRAI.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { enonce, ETABLIE, type Mot } from "./comparaison/enonce.ts";

const RACINE = "src/app/dev/fut118";
const pages = (d: string): string[] =>
  readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? pages(p) : n === "page.tsx" || n === "layout.tsx" ? [p] : [];
  });

test("T1. le gabarit et chaque page renvoient une 404 en production, côté serveur, sans indexation", () => {
  const fichiers = pages(RACINE);
  assert.ok(fichiers.length >= 5, `${fichiers.length} fichiers`);
  for (const f of fichiers) {
    const src = readFileSync(f, "utf8");
    assert.ok(!/^\s*["']use client["']/m.test(src), `${f} : composant serveur`);
    assert.ok(/if \(process\.env\.NODE_ENV === "production"\) notFound\(\);/.test(src), `${f} : garde de production absente`);
  }
  assert.match(readFileSync(join(RACINE, "layout.tsx"), "utf8"), /robots: \{ index: false, follow: false \}/);
});

test("T2. aucun appel réseau, au moteur, au modèle ni à Stripe dans les témoins", () => {
  const tout = pages(RACINE).map((f) => readFileSync(f, "utf8")).join("\n");
  for (const interdit of [/fetch\(/, /@ai-sdk|generateObject|anthropic/i, /from "stripe"|@stripe\//, /buildCommuneDossier|assembleDossier/, /supabase/i]) {
    assert.doesNotMatch(tout, interdit);
  }
});

test("T3. aucune page de production n'importe un témoin", () => {
  const prod = (d: string): string[] => readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    if (p.startsWith("src/app/dev")) return [];
    return statSync(p).isDirectory() ? prod(p) : /\.tsx?$/.test(n) ? [p] : [];
  });
  for (const f of [...prod("src/app"), ...prod("src/components")]) {
    assert.doesNotMatch(readFileSync(f, "utf8"), /dev\/fut118/, f);
  }
});

// La phrase et la marge disent la même chose : chaque possibilité nommée dans la phrase y figure avec
// le MOT de son issue, et aucune issue non établie n'est présentée comme établie.
const POSS = ["A", "B", "C", "D", "E"];
const cas: { nom: string; mots: Mot[] }[] = [
  { nom: "non examiné reste non examiné", mots: ["tient", "non examiné", "tient", "non examiné", "tient"] },
  { nom: "à vérifier reste à vérifier", mots: ["tient", "à vérifier", "tient", "tient", "tient"] },
  { nom: "les deux inconnues distinguées", mots: ["tient", "à vérifier", "ne tient pas", "non examiné", "tient"] },
  { nom: "minorité qui ne tient pas", mots: ["ne tient pas", "tient", "tient", "tient", "tient"] },
  { nom: "minorité qui tient", mots: ["ne tient pas", "tient", "ne tient pas", "ne tient pas", "ne tient pas"] },
  { nom: "tout le monde échoue", mots: ["ne tient pas", "ne tient pas", "ne tient pas", "ne tient pas", "ne tient pas"] },
];

test("T4. l'énoncé reprend le mot de la marge pour chaque possibilité non établie", () => {
  for (const c of cas) {
    const issues = c.mots.map((mot, i) => ({ nom: `Commune ${POSS[i]}`, mot }));
    const { texte } = enonce("Critère", issues);
    for (const x of issues.filter((y) => y.mot === "à vérifier")) {
      assert.match(texte, new RegExp(`reste à vérifier pour [^.;]*${x.nom}`), `${c.nom} : ${texte}`);
    }
    for (const x of issues.filter((y) => y.mot === "non examiné")) {
      assert.match(texte, new RegExp(`non examiné pour [^.;]*${x.nom}`), `${c.nom} : ${texte}`);
      assert.doesNotMatch(texte, new RegExp(`reste à vérifier pour [^.;]*${x.nom}`), `${c.nom} : ${texte}`);
    }
  }
});

test("T5. une issue non établie ne compte jamais comme « tient » ni « ne tient pas »", () => {
  for (const c of cas) {
    const issues = c.mots.map((mot, i) => ({ nom: `Commune ${POSS[i]}`, mot }));
    const { texte, classe } = enonce("Critère", issues);
    if (issues.every((x) => !ETABLIE[x.mot] || x.mot === issues[0]!.mot) && issues.some((x) => !ETABLIE[x.mot])) {
      assert.equal(classe, "departage_possible", c.nom);
    }
    // « tout le monde échoue » ne doit pas dire que tout le monde tient.
    if (c.mots.every((m) => m === "ne tient pas")) assert.doesNotMatch(texte, /tiennent,|tient,/, texte);
    // Une possibilité nommée parmi celles qui tiennent / ne tiennent pas a bien cette issue.
    const tientNoms = texte.match(/seules? tient?n?e?n?t? ([^.]+)\./)?.[1];
    if (tientNoms) for (const x of issues) if (tientNoms.includes(x.nom)) assert.equal(x.mot, "tient", `${c.nom} : ${texte}`);
  }
});
