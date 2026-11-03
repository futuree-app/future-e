import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

// FUT-138 · LES VENTES À PROXIMITÉ NE S'ATTEIGNENT QUE PAR LE DOSSIER D'ADRESSE PAYÉ.
//
// Le dossier n'existe qu'après paiement (webhook Stripe) ou par la route d'administration ; la page Autour ne lit que
// les dossiers du compte connecté, non révoqués (`getDossier`). Ces tests verrouillent les seules portes d'entrée :
// aucune route d'API, aucun composant client, aucune autre page ne lit les tuiles, et aucune n'accepte de coordonnées.

const SRC = path.join(process.cwd(), "src");
function fichiers(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? (f === "__fixtures__" ? [] : fichiers(p)) : /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f) ? [p] : [];
  });
}
const rel = (p: string) => path.relative(process.cwd(), p);
const TOUS = fichiers(SRC);
const importe = (module: RegExp) => TOUS.filter((f) => module.test(readFileSync(f, "utf8"))).map(rel).sort();

test("le lecteur des tuiles n'est importé que par le composant serveur du bloc et le banc de recette (404 en production)", () => {
  assert.deepEqual(importe(/from "@\/lib\/server\/prix-autour-tuiles"/), [
    "src/app/dev/fut138/page.tsx",
    "src/components/report/VentesAutourServeur.tsx",
  ]);
  assert.match(readFileSync("src/app/dev/fut138/page.tsx", "utf8"), /if \(process\.env\.NODE_ENV === "production"\) notFound\(\);/);
});

test("le composant serveur du bloc n'est monté que par la page Autour (et le banc, 404 en production), et aucune route d'API ne touche aux ventes", () => {
  assert.deepEqual(importe(/from "@\/components\/report\/VentesAutourServeur"/), ["src/app/(account)/rapport/autour/page.tsx", "src/app/dev/fut138/page.tsx"]);
  for (const f of TOUS.filter((x) => /\/route\.ts$/.test(x))) {
    assert.doesNotMatch(readFileSync(f, "utf8"), /prix-autour|VentesAutour/, rel(f));
  }
  // le module client ne lit rien : il reçoit un bloc déjà rendu par le serveur
  assert.doesNotMatch(readFileSync("src/components/report/AutourModule.tsx", "utf8"), /prix-autour-tuiles|lireVentesAutour/);
});

test("la page Autour n'ouvre que le dossier du compte connecté, et lit la position ENREGISTRÉE du dossier", () => {
  const page = readFileSync("src/app/(account)/rapport/autour/page.tsx", "utf8");
  assert.match(page, /const \{ supabase, user \} = await requireCurrentUser\(\);/);
  assert.match(page, /getDossier\(supabase, user\.id, targetId\)/);
  assert.match(page, /if \(targetId && !dossier\) redirect\("\/rapport"\);/);
  assert.match(page, /<VentesAutourServeur lat=\{dossier\.latitude\} lon=\{dossier\.longitude\} insee=\{dossier\.insee\}/);
  assert.doesNotMatch(page, /searchParams[^;]*(lat|lon)/);
  // la lecture d'un dossier exclut les dossiers révoqués
  assert.match(readFileSync("src/lib/address-dossier-store.ts", "utf8"), /\.eq\("user_id", userId\)\s*\.eq\("id", dossierId\)\s*\.is\("access_revoked_at", null\)/);
});
