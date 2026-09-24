import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { phraseVerificationsNonRealisees } from "./dossier-view.ts";
import type { Dossier } from "./decision-fact.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// CE QUE NOS SOURCES N'ONT PAS PU LIRE NE DISPARAÎT JAMAIS EN SILENCE (24/09/2026).
//
// La section `unknowns` n'était rendue que par la minute, plafonnée à quatre cartes. Vu à
// Châtelaillon : Géorisques muet sur l'argile, les plans de prévention et les cavités, et rien à
// l'écran ne le disait. Une rubrique repliée l'a d'abord rendu, au rang d'une quatrième échelle ; le
// porteur l'a refusée. C'est une ligne, visible sans clic.
// ════════════════════════════════════════════════════════════════════════════════════════════

function inconnue(id: string, source: string) {
  return {
    kind: "fact" as const,
    fact: {
      id: `logement:${id}:unknown`, ruleId: `logement.${id}`, role: "unknown", impact: "scoped",
      materialityTier: "secondary", topic: `sujet ${id}`, statement: "n'a pas pu être vérifié",
      evidence: [{ factId: `logement.${id}`, module: "logement", label: source, grain: "adresse" }],
    },
  };
}
function dossier(cards: unknown[]): Dossier {
  return { sections: [{ key: "unknowns", title: "", cards }] } as unknown as Dossier;
}

test("le cas de Châtelaillon, mot pour mot", () => {
  assert.equal(
    phraseVerificationsNonRealisees(dossier([
      inconnue("exposition-bati", "BRGM, via Géorisques"),
      inconnue("zone-reglementee", "Base GASPAR, via Géorisques"),
      inconnue("cavite", "BRGM, via Géorisques"),
    ])),
    "Trois vérifications n'ont pas pu être réalisées : le retrait-gonflement des argiles, les plans de prévention et les cavités souterraines. Géorisques ne répondait pas au moment de l'analyse.",
  );
});

test("une seule vérification : le singulier", () => {
  assert.equal(
    phraseVerificationsNonRealisees(dossier([inconnue("cavite", "BRGM, via Géorisques")])),
    "Une vérification n'a pas pu être réalisée : les cavités souterraines. Géorisques ne répondait pas au moment de l'analyse.",
  );
});

test("plusieurs sources : aucune n'est désignée à tort", () => {
  const p = phraseVerificationsNonRealisees(dossier([
    inconnue("cavite", "BRGM, via Géorisques"),
    inconnue("patrimoine", "Géoportail de l'urbanisme"),
  ]))!;
  assert.match(p, /Leurs sources ne répondaient pas/);
  assert.doesNotMatch(p, /Géorisques ne répondait/);
});

test("rien ne manque : pas de phrase", () => {
  assert.equal(phraseVerificationsNonRealisees(dossier([])), null);
});

test("la liste complète affiche la ligne, sans rubrique repliée", () => {
  const src = readFileSync("src/components/report/ControlesDuDossier.tsx", "utf8");
  assert.match(src, /phraseVerificationsNonRealisees\(dossier\)/);
  // Le composant ne s'efface pas quand il n'a que des vérifications manquantes.
  assert.match(src, /groupes\.length === 0 && nonRealisees == null/);
  // Et la rubrique « Ce que nos sources n'ont pas pu lire », refusée, ne revient pas.
  assert.doesNotMatch(src, /Ce que nos sources n&apos;ont pas pu lire/);
});
