// FUT-118 R0 · LE RELEVÉ EST LE CANON : quatre garde-fous qui empêchent de recréer une seconde grammaire.
//
//   K1  le cliquet : aucun fichier d'interface ne gagne un marqueur de l'identité historique, et un
//       fichier nouveau n'en contient aucun ;
//   K2  une seule source pour les jetons du Relevé : `design-tokens.css`, jamais un module ;
//   K3  chaque jeton `--r-*` employé quelque part est défini (sinon il retombe en silence) ;
//   K4  les contrastes des jetons de texte tiennent 4,5:1 dans les deux thèmes, bouton de marque compris ;
//   K5  les primitives se déclarent canon, et le kit historique se déclare déprécié.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { releverHeritage } from "./heritage.ts";

const REFERENCE: Record<string, Record<string, number>> = JSON.parse(readFileSync("src/components/releve/heritage-reference.json", "utf8"));
const JETONS = readFileSync("src/app/design-tokens.css", "utf8");

test("K1. le cliquet : aucun marqueur historique ne s'ajoute, nulle part", () => {
  const actuel = releverHeritage();
  const hausses: string[] = [];
  for (const [f, c] of Object.entries(actuel)) {
    for (const [m, n] of Object.entries(c)) {
      const permis = REFERENCE[f]?.[m] ?? 0;
      if (n > permis) hausses.push(`${f} · ${m} : ${n} (référence ${permis})`);
    }
  }
  assert.deepEqual(hausses, [], "Un écran nouveau ou modifié emploie la grammaire historique ; utilisez src/components/releve/ (DESIGN.md v3.0).");
  // Le canon lui-même n'en porte aucun.
  for (const f of Object.keys(actuel)) assert.ok(!/^src\/components\/(releve|accueil)\//.test(f), `${f} : le canon contient un marqueur historique`);
});

test("K2. les jetons du Relevé ne sont déclarés que dans design-tokens.css", () => {
  const fichiers: string[] = [];
  const parcourir = (d: string) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) parcourir(p);
      else if (p.endsWith(".css") && !p.endsWith("design-tokens.css")) fichiers.push(p);
    }
  };
  parcourir("src");
  for (const f of fichiers) {
    // Une déclaration, en début de ligne ou après `{` / `;` (règle écrite sur une seule ligne).
    assert.doesNotMatch(readFileSync(f, "utf8"), /(?:^|[{;])\s*--r-(?!teinte\b)[a-z0-9-]+\s*:/m, `${f} redéclare un jeton du Relevé`);
  }
  assert.match(JETONS, /--r-encre:\s*var\(--fg-hi\)/);
});

test("K3. chaque jeton --r-* employé est défini", () => {
  const definis = new Set([...JETONS.matchAll(/(--r-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
  definis.add("--r-teinte"); // posé en ligne par le composant qui porte le registre, par construction
  const employes = new Set<string>();
  const parcourir = (d: string) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) parcourir(p);
      else if (/\.(tsx?|css)$/.test(p)) for (const m of readFileSync(p, "utf8").matchAll(/var\((--r-[a-z0-9-]+)/g)) employes.add(m[1]!);
    }
  };
  parcourir("src");
  assert.deepEqual([...employes].filter((j) => !definis.has(j)), []);
});

// ── K4 · contrastes ───────────────────────────────────────────────────────────────────────────

function bloc(entete: string): Record<string, string> {
  const i = JETONS.indexOf(entete);
  assert.ok(i >= 0, `bloc introuvable : ${entete}`);
  const corps = JETONS.slice(i, JETONS.indexOf("\n}", i));
  return Object.fromEntries([...corps.matchAll(/(--[a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1]!, m[2]!]));
}
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
const contraste = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
};

test("K4. les jetons de texte du Relevé tiennent 4,5:1 sur le fond et la plaque, dans les deux thèmes", () => {
  const sombre = { ...bloc(":root {"), ...bloc(":root,\n[data-theme=\"dark\"] {") };
  const clair = { ...sombre, ...bloc("[data-theme=\"light\"] {") };
  const surMarque = {
    sombre: JETONS.match(/:root, \[data-theme="dark"\] \{ --r-sur-marque: (#[0-9a-fA-F]{6}); \}/)?.[1],
    clair: JETONS.match(/\[data-theme="light"\] \{ --r-sur-marque: (#[0-9a-fA-F]{6}); \}/)?.[1],
  };
  const echecs: string[] = [];
  for (const [nom, t] of [["sombre", sombre], ["clair", clair]] as const) {
    const fonds = { fond: t["--bg"]!, plaque: t["--bg-deep"]! };
    // Les jetons sur lesquels reposent --r-encre, --r-texte, --r-discret, --r-meta et les six registres.
    for (const j of ["--fg-hi", "--fg-2", "--fg-3", "--ghost", "--reg-incompatibilite", "--reg-alignement", "--reg-compromis", "--reg-ecart", "--reg-non-su", "--reg-controle"]) {
      for (const [f, hex] of Object.entries(fonds)) {
        const c = contraste(t[j]!, hex);
        if (c < 4.5) echecs.push(`${nom} · ${j} sur ${f} : ${c.toFixed(2)}`);
      }
    }
    const marque = surMarque[nom];
    assert.ok(marque, `--r-sur-marque absent du thème ${nom}`);
    const c = contraste(marque!, t["--orange"]!);
    if (c < 4.5) echecs.push(`${nom} · --r-sur-marque sur --orange : ${c.toFixed(2)}`);
  }
  assert.deepEqual(echecs, []);
});

test("K5. les primitives se déclarent canon ; le kit historique se déclare déprécié", () => {
  const primitives = readFileSync("src/components/releve/primitives.tsx", "utf8");
  assert.doesNotMatch(primitives.split("\n").slice(0, 3).join("\n"), /DEV UNIQUEMENT|PROTOTYPE/i);
  assert.match(primitives, /PRIMITIVES CANONIQUES/);
  assert.doesNotMatch(readFileSync("src/components/releve/releve.module.css", "utf8").slice(0, 400), /DEV UNIQUEMENT/);
  const kit = readFileSync("src/components/report/kit.tsx", "utf8");
  assert.match(kit, /DÉPRÉCIÉ/);
  assert.doesNotMatch(kit, /SOURCE UNIQUE du langage visuel/);
});
