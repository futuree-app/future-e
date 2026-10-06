// FUT-32 : une, deux ou trois communes, dites telles qu'elles sont. Trois n'est jamais un quota.
//
// Le moteur (comparateur-vie) et les vues ne s'importent pas en test (server-only, client) : la règle est
// testée ici en pur, et chaque point d'appel est verrouillé sur sa source. La reproduction réelle (moteur
// lancé sur l'index) est dans le rapport de la branche.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cardinalPackValide, motCardinal, packReplayProposable } from "./comparaison-cardinal.ts";

const lire = (p: string) => readFileSync(p, "utf8");
const OU_VIVRE = lire("src/app/(public)/ou-vivre/OuVivreClient.tsx");
const MOTEUR = lire("src/lib/comparateur-vie.ts");

test("C1. un résultat : le CTA Pack n'est pas rendu", () => {
  assert.equal(packReplayProposable(1), false);
  assert.match(OU_VIVRE, /const canPack = packReplayProposable\(top\.length\);/);
  assert.match(OU_VIVRE, /\{canPack && \(/);
});

test("C2. un résultat : onPackDecision ne fait rien, même invoqué directement", () => {
  const corps = OU_VIVRE.slice(OU_VIVRE.indexOf("const onPackDecision = () => {"));
  const garde = corps.indexOf("if (!packReplayProposable(trio.length)) return;");
  assert.ok(garde > 0, "la garde existe");
  for (const effet of ["localStorage.setItem", "capture(\"pack_decision_cta_clicked\"", "window.location.href"]) {
    assert.ok(corps.indexOf(effet) > garde, `${effet} n'arrive qu'après la garde`);
  }
});

test("C3. un résultat : aucun « deux » ni « trois » ; le moteur rend une comparaison vide", () => {
  assert.equal(motCardinal(1), null);
  assert.equal(motCardinal(0), null);
  assert.match(MOTEUR, /const nMot = motCardinal\(trio\.length\);\s*if \(nMot == null\) return \{ resume: \[\], arbitrage: null, spatialContext: null, divergence: null, themes: \[\] \};/);
  // Plus aucune surface active ne déduit « deux » de « pas trois ».
  for (const f of [
    "src/lib/comparateur-vie.ts", "src/app/(public)/comparateur/ThemeMatrix.tsx",
    "src/app/(public)/ou-vivre/ComparaisonCompleteView.tsx", "src/app/(public)/ou-vivre/OuVivreClient.tsx",
  ]) assert.doesNotMatch(lire(f), /(?:>=|>) ?[23] \? "(?:trois|Trois)" : "(?:deux|Deux)"/, f);
  assert.match(OU_VIVRE, /Un seul territoire répond à ce que vous avez demandé\./);
});

test("C4. contrat du moteur : moins de deux communes, aucune comparaison (pas de commune comparée à elle-même)", () => {
  // Le contexte spatial suit la même règle.
  assert.match(MOTEUR, /const mot = motCardinal\(n\);\s*if \(mot == null\) return null;/);
});

test("C5/C6/C7. deux résultats : pas de Pack (replay exige trois) ; jamais « les trois » sur le texte des territoires", () => {
  // Décision porteur (06/10) : le bouton, visible à deux, menait à une redirection vers « Où vivre ».
  assert.equal(packReplayProposable(2), false);
  assert.equal(motCardinal(2), "deux");
  assert.match(OU_VIVRE, /\{motCardinal\(top\.length\) === "trois" \? "Les trois" : "Les deux"\} pourraient convenir\./);
});

test("C8. deux résultats : la matrice et la comparaison disent « deux »", () => {
  assert.match(lire("src/app/(public)/comparateur/ThemeMatrix.tsx"), /les \{motCardinal\(n\)\} territoires se valent/);
  assert.match(lire("src/app/(public)/ou-vivre/ComparaisonCompleteView.tsx"), /Vous les avez retenus tous les \{motCardinal\(trio\.length\)\}\./);
  assert.match(MOTEUR, /Sur ce thème, les \$\{nMot\} territoires se ressemblent/);
});

test("C9. trois résultats : « trois » inchangé, et le Pack est proposé", () => {
  assert.equal(motCardinal(3), "trois");
  assert.equal(packReplayProposable(3), true);
  assert.match(OU_VIVRE, /Comparer les trois en profondeur\./);
});

test("C10. URL directe à une commune : aucune page Pack, aucune comparaison", () => {
  const pack = lire("src/app/(public)/comparateur/pack-decision/page.tsx");
  assert.match(pack, /const minCommunes = requestedMode === "choix" \? 2 : 3;\s*if \(insees\.length < minCommunes\) redirect\(/);
  assert.match(lire("src/app/(public)/comparateur/page.tsx"), /if \(insees\.length < 2\) \{/);
  // La vue « choix » ne reçoit donc que 2 ou 3 communes : son « n >= 3 ? trois : deux » est exact.
  assert.match(lire("src/app/(public)/comparateur/pack-decision/ChoixConvictionView.tsx"), /const motN = n >= 3 \? "trois" : "deux";/);
});

test("C11 à C15. paiement : choix 2 ou 3, replay exactement 3, garde inchangée et appelée par la route", () => {
  assert.equal(cardinalPackValide("choix", 1), false, "C11");
  assert.equal(cardinalPackValide("choix", 2), true, "C12");
  assert.equal(cardinalPackValide("choix", 3), true, "C13");
  assert.equal(cardinalPackValide("replay", 2), false, "C14");
  assert.equal(cardinalPackValide("replay", 3), true, "C15");
  const route = lire("src/app/api/stripe/create-payment-intent/route.ts");
  assert.match(route, /\.slice\(0, 3\);\s*\/\/[^\n]*\n\s*const okCount = cardinalPackValide\(packMode, packTrio\.length\);\s*if \(!okCount\) \{/);
  assert.match(route, /status: 400/);
});
