// FUT-40 : /connexion et /inscription ne redemandent pas ses identifiants à un utilisateur connecté.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cheminSur, destinationApresConnexion, redirectionSiDejaConnecte, DESTINATION_APRES_CONNEXION } from "./auth-destination.ts";

const USER = { id: "u" };

test("T1 : anonyme → aucun redirect, le formulaire s'affiche", () => {
  assert.equal(redirectionSiDejaConnecte(null), null);
  assert.equal(redirectionSiDejaConnecte(null, "/rapport"), null);
});

test("T2 : connecté sans next → /compte", () => {
  assert.equal(DESTINATION_APRES_CONNEXION, "/compte");
  assert.equal(redirectionSiDejaConnecte(USER), "/compte");
});

test("T3 : connecté + next sûr → next (query conservée) ; next non sûr → /compte", () => {
  assert.equal(redirectionSiDejaConnecte(USER, "/rapport"), "/rapport");
  assert.equal(redirectionSiDejaConnecte(USER, "/rapport/logement?dossierId=abc"), "/rapport/logement?dossierId=abc");
  for (const mauvais of ["//evil.example", "https://evil.example", "rapport", "", undefined, null]) {
    assert.equal(redirectionSiDejaConnecte(USER, mauvais), "/compte", String(mauvais));
  }
});

test("la règle est unique : pages et actions d'auth la partagent", () => {
  assert.equal(cheminSur("/x"), "/x");
  assert.equal(cheminSur("//x"), undefined);
  assert.equal(destinationApresConnexion("//x"), "/compte");
  const actions = readFileSync("src/app/auth/actions.ts", "utf8");
  assert.match(actions, /return destinationApresConnexion\(value\);/);
});

test("T2/T4 : /connexion et /inscription appliquent la garde AVANT de rendre leur formulaire", () => {
  for (const page of ["src/app/(auth)/connexion/page.tsx", "src/app/(auth)/inscription/page.tsx"]) {
    const src = readFileSync(page, "utf8");
    const garde = src.indexOf("if (dejaConnecte) redirect(dejaConnecte);");
    assert.ok(garde > 0, `${page} : garde absente`);
    assert.ok(src.indexOf("redirectionSiDejaConnecte(user, query.next)") < garde, page);
    assert.ok(garde < src.indexOf("return ("), `${page} : la garde doit précéder le rendu`);
    assert.match(src, /const \{ user \} = await getCurrentSessionUser\(\);/);
  }
});
