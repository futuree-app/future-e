// FUT-50 · LES PROTOTYPES D'ACCUEIL RESTENT DES PROTOTYPES.
//
// Même garde que FUT-87 (lecture-dossier.test.ts, I1) : le gabarit ET chaque page renvoient une 404 en
// production, côté serveur, et ne sont pas indexés. Les portes mènent à des destinations publiques réelles.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const RACINE = "src/app/dev/fut50";
const COMPOSANTS = "src/components/prototypes/fut50";
const COMPOSANTS_C = "src/components/prototypes/fut50/c";

function pages(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? pages(p) : /\.(tsx|ts)$/.test(n) ? [p] : [];
  });
}

test("chaque page et le gabarit renvoient une 404 en production, côté serveur, sans indexation", () => {
  const fichiers = pages(RACINE);
  assert.ok(fichiers.length >= 4, `${fichiers.length} fichiers`);
  for (const f of fichiers) {
    const src = readFileSync(f, "utf8");
    assert.ok(!/^\s*["']use client["']/m.test(src), `${f} : composant serveur attendu`);
    // Une page renvoie `notFound()` ; une route d'API (le gabarit ne la couvre pas) renvoie elle-même 404.
    const garde = f.endsWith("route.ts")
      ? /if \(process\.env\.NODE_ENV === "production"\) return new NextResponse\(null, \{ status: 404 \}\);/
      : /if \(process\.env\.NODE_ENV === "production"\) notFound\(\);/;
    assert.ok(garde.test(src), `${f} : garde de production absente`);
  }
  assert.match(readFileSync(join(RACINE, "layout.tsx"), "utf8"), /robots: \{ index: false, follow: false \}/);
});

test("les portes mènent à des routes publiques qui existent", () => {
  const commun = readFileSync(join(COMPOSANTS, "commun.tsx"), "utf8");
  for (const [href, route] of [["/ou-vivre", "src/app/(public)/ou-vivre/page.tsx"], ["/dossier", "src/app/(public)/dossier/page.tsx"], ["/comparateur", "src/app/(public)/comparateur"]] as const) {
    assert.ok(commun.includes(`"${href}"`), `${href} absent des portes`);
    assert.ok(existsSync(route), `${route} introuvable`);
  }
});

test("aucune donnée personnelle, aucun score, aucune voix interdite dans les prototypes", () => {
  const tout = [COMPOSANTS, COMPOSANTS_C].flatMap((d) => readdirSync(d).map((n) => join(d, n)))
    .filter((p) => statSync(p).isFile() && !p.endsWith(".test.ts"))
    .map((p) => readFileSync(p, "utf8"))
    .join("\n");
  for (const interdit of [/quentin/i, /@gmail/i, /dossierId=[0-9a-f]{8}-/i, /\/100\b/, /note globale de/i, /—/]) {
    assert.doesNotMatch(tout, interdit);
  }
});
