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
type Exception = { fichier: string; marqueur: string; nombre: number; motif: string };
const EXCEPTIONS: Exception[] = JSON.parse(readFileSync("src/components/releve/heritage-exceptions.json", "utf8"));
const JETONS = readFileSync("src/app/design-tokens.css", "utf8");

// LE PLAFOND DE LA RÉFÉRENCE (603 marqueurs au lot R0, 20/10/2026). On le rabaisse, à la main, après un
// lot de migration qui en retire. Il BORNE le total ; il ne garantit pas qu'il baisse : une remontée
// manuelle de la référence sous le plafond ne se voit qu'en revue (DESIGN.md § 10). L'augmenter demanderait de modifier deux fichiers à
// la main, ce qu'une revue doit refuser : la dette visuelle ne grossit pas en silence.
const PLAFOND_REFERENCE = 603;

test("K1. le cliquet : aucun marqueur historique ne s'ajoute, nulle part (sauf exception motivée)", () => {
  const actuel = releverHeritage();
  const exception = (f: string, m: string) => EXCEPTIONS.filter((e) => e.fichier === f && e.marqueur === m).reduce((s, e) => s + e.nombre, 0);
  const hausses: string[] = [];
  for (const [f, c] of Object.entries(actuel)) {
    for (const [m, n] of Object.entries(c)) {
      const permis = (REFERENCE[f]?.[m] ?? 0) + exception(f, m);
      if (n > permis) hausses.push(`${f} · ${m} : ${n} (référence ${REFERENCE[f]?.[m] ?? 0}, exceptions ${exception(f, m)})`);
    }
  }
  assert.deepEqual(hausses, [], "Un écran nouveau ou modifié emploie la grammaire historique ; utilisez le Relevé (DESIGN.md v3.0). Faux positif ? Déclarez-le dans heritage-exceptions.json, avec son motif.");
  // Le canon lui-même n'en porte aucun, même par exception.
  for (const f of Object.keys(actuel)) assert.ok(!/^src\/components\/(releve|accueil)\//.test(f), `${f} : le canon contient un marqueur historique`);
});

test("K1b. la référence ne se desserre pas, et chaque exception est motivée et sert encore", () => {
  const total = Object.values(REFERENCE).reduce((s, c) => s + Object.values(c).reduce((a, b) => a + b, 0), 0);
  assert.ok(total <= PLAFOND_REFERENCE, `la référence compte ${total} marqueurs, au-delà du plafond ${PLAFOND_REFERENCE}`);
  const actuel = releverHeritage();
  for (const e of EXCEPTIONS) {
    assert.ok(e.motif && e.motif.trim().length >= 30, `${e.fichier} · ${e.marqueur} : motif absent ou trop court`);
    assert.ok(Number.isInteger(e.nombre) && e.nombre > 0, `${e.fichier} · ${e.marqueur} : nombre invalide`);
    assert.ok(!/^src\/components\/(releve|accueil)\//.test(e.fichier), `${e.fichier} : pas d'exception dans le canon`);
    const reste = (actuel[e.fichier]?.[e.marqueur] ?? 0) - (REFERENCE[e.fichier]?.[e.marqueur] ?? 0);
    assert.ok(reste >= e.nombre, `${e.fichier} · ${e.marqueur} : exception inutile (${reste} au-delà de la référence), à retirer`);
  }
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

test("K6. Archivo en largeur normale : aucun réglage de l'axe wdth, que la police servie n'a pas", () => {
  // Le fichier servi (`public/fonts/Archivo-Variable.woff2`) n'a qu'un axe de graisse : un réglage `wdth`
  // y est ignoré, et le jour où une autre police serait servie, il élargirait le texte sans décision.
  const fautifs: string[] = [];
  const parcourir = (d: string) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) parcourir(p);
      else if (/\.(tsx?|css)$/.test(p) && !/\.test\.tsx?$/.test(p)) {
        const t = readFileSync(p, "utf8");
        if (/font-variation-settings\s*:[^;]*wdth|fontVariationSettings\s*:[^,}]*wdth|font-stretch\s*:\s*(?!normal)/.test(t)) fautifs.push(p);
      }
    }
  };
  parcourir("src");
  assert.deepEqual(fautifs, []);
  assert.doesNotMatch(JETONS, /--r-(large|titre|semi|chiffre)\s*:/, "jetons de largeur retirés");
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
