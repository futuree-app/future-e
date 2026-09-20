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

test("prompt: « famille » n'active plus l'agriculture intensive", () => {
  // INSTRUITE LE 20/09/2026, ET RETIRÉE. La déduction était restée en place faute d'avoir été
  // examinée. Vue à l'écran : un projet de trois priorités en affichait six, dont « un
  // environnement peu marqué par l'agriculture intensive », que le lecteur n'avait jamais
  // formulée. Le dossier annonçait ensuite ne pas savoir la traiter, faute de seuil défendable au
  // grain commune (cf. `sante-facts.ts`) : on inventait un besoin pour avouer ne pas y répondre.
  //
  // Et l'effet n'était pas qu'un mot : cette préférence pèse dans le classement des communes.
  assert.ok(
    !ligneFamille!.includes("faible_pression_agricole"),
    "« famille » déduit de nouveau l'agriculture intensive",
  );
});

test("prompt: l'interdiction sur l'agriculture est écrite, pas seulement l'omission", () => {
  // Même leçon que pour acces_services : sans règle négative, le modèle refait spontanément
  // l'association « enfants -> pesticides » par raisonnement culturel.
  const interdiction = src
    .split("\n")
    .find((l) => l.includes("INTERDIT") && l.includes("faible_pression_agricole"));
  assert.ok(interdiction, "aucune règle négative « famille n'active jamais faible_pression_agricole »");
  for (const mot of ["famille", "enfant", "grandir"]) {
    assert.ok(interdiction!.includes(mot), `la règle négative ne couvre pas « ${mot} »`);
  }
});

test("prompt: l'agriculture reste activée par ce que la personne EXPRIME", () => {
  // Retirer la déduction ne retire pas le critère : il garde ses deux déclencheurs légitimes, et
  // il sert réellement au classement des communes dans le comparateur.
  const lignes = src.split("\n");
  assert.ok(
    lignes.some((l) => l.includes("pesticides") && l.includes("faible_pression_agricole")),
    "le déclencheur « pesticides » a disparu",
  );
  assert.ok(
    lignes.some((l) => l.includes("environnement sain") && l.includes("faible_pression_agricole")),
    "le déclencheur « environnement sain » a disparu",
  );
});

test("prompt: la déduction d'isolement subsiste, et reste à instruire", () => {
  // NON TRANCHÉE AU 20/09/2026. Elle mérite le même examen : le moteur pose DÉJÀ un plancher
  // d'isolement de son côté (`VIABILITY_BASELINE_SPLIT`, poids 0,5), et la déduction « famille »
  // le remplace par un poids 2, soit quatre fois plus, tout en supprimant le plancher partagé avec
  // le bassin d'emploi. Une famille peut précisément chercher une maison isolée.
  assert.ok(ligneFamille!.includes("eviter_isolement"), "eviter_isolement retiré sans décision");
});
