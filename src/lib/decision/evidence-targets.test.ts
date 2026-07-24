import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { EVIDENCE_TARGET_MODULE, evidenceAnchorId, evidenceHref, type EvidenceTargetKey } from "./evidence-targets.ts";

test("l'ancre est un fragment natif : pas de point, pas de « = », utilisable sans JavaScript", () => {
  assert.equal(evidenceAnchorId("climate.extreme_heat"), "evidence-climate-extreme-heat");
  for (const key of Object.keys(EVIDENCE_TARGET_MODULE) as EvidenceTargetKey[]) {
    assert.match(evidenceAnchorId(key), /^evidence-[a-z0-9-]+$/);
  }
});

test("le lien vise le module qui DÉMONTRE le phénomène", () => {
  assert.equal(evidenceHref("climate.extreme_heat", "/x"), "/rapport/quartier#evidence-climate-extreme-heat");
  assert.equal(evidenceHref("housing.energy_label", "/x"), "/rapport/logement#evidence-housing-energy-label");
});

test("sans clé, le lien retombe sur le module : un repli, jamais rien", () => {
  assert.equal(evidenceHref(undefined, "/rapport/quartier"), "/rapport/quartier");
});

// ── LE GARDE-FOU. ───────────────────────────────────────────────────────────────
//
// La clé sémantique ne SUPPRIME pas le risque de dérive, elle le rend DÉTECTABLE : une carte qui
// disparaît, ou qu'on renomme, laisse un lien parfaitement valide vers un module qui ne présente plus
// le phénomène. Rien ne le signalerait — le lecteur atterrirait simplement au mauvais endroit.
//
// Ces deux tests ferment ça dans les deux sens : toute clé du catalogue doit être déclarée par une
// carte, et toute carte doit déclarer une clé connue. Ils lisent les SOURCES plutôt que d'appeler les
// composants : la déclaration est statique, et un test qui rendrait le module entier dépendrait de
// données de production pour prouver une propriété qui n'en dépend pas.
const SOURCES: Record<"territoire" | "logement", string[]> = {
  territoire: ["src/components/report/QuartierClimatData.tsx"],
  logement: ["src/components/report/LogementModule.tsx"],
};

// DEUX FORMES DE DÉCLARATION, parce que les deux modules ne sont pas bâtis pareil. Le module Territoire
// construit ses cartes comme des DONNÉES (un tableau de facteurs) : la clé y est un champ, `targets`.
// Le module Logement les compose en JSX : la clé y est l'appel qui pose l'ancre, `evidenceAnchorId("…")`.
// Imposer une seule forme obligerait l'un des deux à se tordre ; ce qui compte est qu'une clé soit
// déclarée LÀ OÙ la carte est écrite, jamais dans une table tenue à part.
function clesDeclarees(fichiers: string[]): Set<string> {
  const out = new Set<string>();
  for (const f of fichiers) {
    let src: string;
    try {
      src = readFileSync(f, "utf8");
    } catch {
      continue; // un fichier peut avoir été renommé : la couverture le dira, pas une erreur d'E/S
    }
    for (const m of src.matchAll(/targets:\s*\[([^\]]*)\]/g)) {
      for (const k of m[1]!.matchAll(/"([^"]+)"/g)) out.add(k[1]!);
    }
    for (const m of src.matchAll(/evidenceAnchorId\(\s*"([^"]+)"\s*\)/g)) out.add(m[1]!);
  }
  return out;
}

test("toute clé du catalogue est DÉCLARÉE par une carte (sinon le lien vise le vide)", () => {
  const declarees = {
    territoire: clesDeclarees(SOURCES.territoire),
    logement: clesDeclarees(SOURCES.logement),
  };
  const orphelines = (Object.keys(EVIDENCE_TARGET_MODULE) as EvidenceTargetKey[])
    .filter((k) => !declarees[EVIDENCE_TARGET_MODULE[k]].has(k));
  assert.deepEqual(
    orphelines, [],
    `Clés sans carte qui les présente : ${orphelines.join(", ")}. Soit une carte doit les déclarer `
    + "(targets: [...]), soit elles doivent sortir du catalogue — une preuve ne peut pas renvoyer vers "
    + "une démonstration qui n'existe pas.",
  );
});

test("toute clé déclarée par une carte existe dans le catalogue (pas de faute de frappe muette)", () => {
  const connues = new Set(Object.keys(EVIDENCE_TARGET_MODULE));
  const inconnues = [...clesDeclarees([...SOURCES.territoire, ...SOURCES.logement])]
    .filter((k) => !connues.has(k));
  assert.deepEqual(inconnues, [], `Clés déclarées hors catalogue : ${inconnues.join(", ")}`);
});

test("toute clé du catalogue est ÉMISE par au moins une règle (pas de vocabulaire mort)", () => {
  // Le sens inverse du test précédent. Une clé que plus aucune preuve ne porte ne casse rien — elle
  // laisse juste croire, à la lecture du catalogue, que le lien existe. Les deux bouts doivent tomber
  // ensemble : une carte qui la déclare ET une règle qui la vise.
  const regles = [
    "src/lib/decision/logement-rules.ts",
    "src/lib/decision/materiality-rules.ts",
    "src/lib/decision/mismatch-rules.ts",
  ].map((f) => readFileSync(f, "utf8")).join("\n");
  const emises = new Set([...regles.matchAll(/"((?:climate|risk|nature|housing)\.[a-z_]+)"/g)].map((m) => m[1]!));
  const jamaisEmises = (Object.keys(EVIDENCE_TARGET_MODULE) as EvidenceTargetKey[]).filter((k) => !emises.has(k));
  assert.deepEqual(
    jamaisEmises, [],
    `Clés qu'aucune règle ne porte : ${jamaisEmises.join(", ")}. Soit une preuve doit les viser, soit `
    + "elles doivent sortir du catalogue.",
  );
});
