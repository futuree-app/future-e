// GARDE SUR LE TEXTE DU PROMPT DE PARSING, pas sur le comportement du modèle.
//
// CE QUE CE TEST PROUVE : que la règle « famille n'active jamais acces_services » est écrite dans le
// prompt, et que l'injection retirée le 04/08/2026 n'a pas été réintroduite par une édition.
// CE QU'IL NE PROUVE PAS : que le modèle l'applique. Un prompt lu n'est pas un comportement observé
// (cf. AGENTS.md, « la carte apparaît » et « la carte dit vrai » sont deux assertions distinctes).
// La vérification du comportement est la sonde `scripts/sonde-parse-famille.mjs`, qui appelle le vrai
// parseur et coûte un appel modèle : elle ne peut pas vivre dans cette suite.
//
// POURQUOI le fichier est lu en TEXTE plutôt qu'importé : `parse/route.ts` instancie le client
// Anthropic au chargement du module et importe `next/server`. L'importer sous `node --test` ferait
// échouer la suite pour une raison sans rapport avec ce qu'on vérifie.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const PROMPT_FILE = "src/app/api/comparateur-vie/parse/route.ts";
const src = readFileSync(PROMPT_FILE, "utf8");

/** La ligne de traduction automatique déclenchée par un projet familial. */
const ligneFamille = src
  .split("\n")
  .find((l) => l.includes('"famille"') && l.includes("→"));

test("prompt: la ligne « famille » existe toujours (sinon ce test ne garde plus rien)", () => {
  assert.ok(ligneFamille, `ligne de traduction « famille » introuvable dans ${PROMPT_FILE}`);
});

test("prompt: un projet familial n'injecte PAS acces_services", () => {
  // Le critère mesure la part de population à plus de 20 minutes d'au moins un service : 80,1 % des
  // communes marquent 100/100 et le palier intermédiaire est vide. Le pondérer à 2 sur le seul mot
  // « enfant » ne classait rien et diluait les critères qui, eux, discriminent.
  // Audit : docs/audits/2026-08-03-osm-semantique-distance.md n'en parle pas ; voir la section
  // « Observation de données » de docs/handoff/CURRENT.md.
  assert.ok(
    !ligneFamille!.includes("acces_services"),
    "acces_services a été réintroduit dans la traduction automatique « famille »",
  );
});

test("prompt: l'interdiction est écrite explicitement, pas seulement l'omission", () => {
  // Retirer la mention ne suffit pas : sans règle négative, le modèle refait spontanément
  // l'association « famille -> services » par raisonnement culturel.
  const interdiction = src
    .split("\n")
    .find((l) => l.includes("INTERDIT") && l.includes("acces_services"));
  assert.ok(interdiction, "aucune règle négative « famille n'active jamais acces_services »");
  for (const mot of ["famille", "enfant", "grandir"]) {
    assert.ok(
      interdiction!.includes(mot),
      `la règle négative ne couvre pas « ${mot} » : ${interdiction}`,
    );
  }
});

test("prompt: les deux autres critères du projet familial sont inchangés", () => {
  // Le commit isole la correction. eviter_isolement et faible_pression_agricole ne sont pas
  // validés pour autant : leur déduction automatique n'a pas été instruite.
  assert.ok(ligneFamille!.includes("eviter_isolement"), "eviter_isolement retiré par erreur");
  assert.ok(ligneFamille!.includes("faible_pression_agricole"), "faible_pression_agricole retiré par erreur");
});
