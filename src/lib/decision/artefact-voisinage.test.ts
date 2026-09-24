import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// ════════════════════════════════════════════════════════════════════════════════════════════
// L'ARTEFACT FIGÉ DOIT CONTENIR CE QUE L'ÉCRAN ASSEMBLÉ MONTRE (22/09/2026).
//
// ── CE QUI S'EST PASSÉ ───────────────────────────────────────────────────────────────────────
// Le voisinage est entré dans le moteur la veille : le composant qui rend la page passait bien le
// snapshot à l'assemblage, et le GÉNÉRATEUR D'ARTEFACT ne le passait pas. Il ne lisait du snapshot
// que le registre des permis, une pièce à la fois, écrite avant que le voisinage n'existe.
//
// Conséquence à l'écran : sur une adresse où un médecin est recensé à 553 m, avec l'accès aux
// soins déclaré en priorité absolue, le dossier ne portait aucun constat d'adresse. L'artefact est
// ce que la page SERT une fois figé, donc le constat n'apparaissait jamais.
//
// ── POURQUOI UN TEST DE SOURCE ───────────────────────────────────────────────────────────────
// Ces deux fichiers portent `server-only` et parlent à Supabase : les exécuter demanderait un
// faux client et une base. Ce qui doit être vérifié n'est pas un comportement, c'est qu'AUCUN des
// deux chemins n'oublie une entrée que l'autre fournit. Une lecture de source suffit, et elle
// tiendra pour la pièce suivante du snapshot.
// ════════════════════════════════════════════════════════════════════════════════════════════

const APPELANTS = [
  "src/lib/server/generate-decision-artifact.ts",
  "src/components/report/DossierAvecLogement.tsx",
];

test("les deux chemins d'assemblage passent le voisinage gelé", () => {
  for (const chemin of APPELANTS) {
    const src = readFileSync(chemin, "utf8");
    assert.match(src, /assembleAddressDossier\(/, `${chemin} : n'assemble plus de dossier d'adresse`);
    assert.match(
      src, /snapshotAutour/,
      `${chemin} : assemble un dossier d'adresse sans passer le voisinage gelé. L'écran et l'artefact ne diront pas la même chose.`,
    );
  }
});

test("le générateur lit le snapshot ENTIER, jamais une seule de ses pièces", () => {
  // La cause première du défaut : une fonction qui rendait `snapshot.permis`. Chaque pièce
  // ajoutée au snapshot aurait demandé de rebrancher ici, et l'oubli était silencieux.
  const src = readFileSync("src/lib/server/generate-decision-artifact.ts", "utf8");
  assert.doesNotMatch(
    src, /async function lirePermisGele/,
    "le générateur est revenu à une lecture pièce par pièce du snapshot",
  );
  assert.match(src, /async function lireSnapshotGele/);
});

// ════════════════════════════════════════════════════════════════════════════════════════════
// LE GÉNÉRATEUR REFUSE UNE PANNE PARTIELLE, AVANT DE FIGER (24/09/2026).
//
// La règle ne voyait que la panne totale (`status !== "done"`). Une panne partielle de Géorisques
// laissait figer une version où un constat établi devenait « n'a pas pu être vérifié ». Test de
// source : le générateur porte `server-only` et parle à Supabase.
// ════════════════════════════════════════════════════════════════════════════════════════════
test("le générateur consulte les vérifications muettes, et avant d'écrire la version", () => {
  const src = readFileSync("src/lib/server/generate-decision-artifact.ts", "utf8");
  const garde = src.indexOf("vue.verificationsIndisponibles.length > 0");
  const ecriture = src.lastIndexOf("await completeArtifact(sb, userId, insee, scopeKey, artefact, version);");
  assert.ok(garde >= 0, "le générateur ne vérifie plus les pannes partielles");
  assert.ok(garde < ecriture, "la garde doit précéder l'écriture de la version");
  // Et elle refuse vraiment : elle marque l'échec au lieu de seulement le journaliser.
  const bloc = src.slice(garde, src.indexOf("}", src.indexOf("return {", garde)) + 1);
  assert.match(bloc, /failArtifact\(/);
  assert.match(bloc, /status: "failed"/);
});

test("l'assemblage recense les vérifications muettes sur le chemin qui aboutit", () => {
  const src = readFileSync("src/lib/server/assemble-address-dossier.ts", "utf8");
  assert.match(src, /verificationsIndisponibles: verificationsMateriellesIndisponibles\(logement\)/);
});
