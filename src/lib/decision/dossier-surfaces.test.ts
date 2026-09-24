import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// ════════════════════════════════════════════════════════════════════════════════════════════
// CE QUE NOS SOURCES N'ONT PAS PU LIRE NE DISPARAÎT JAMAIS EN SILENCE (24/09/2026).
//
// La section `unknowns` n'était rendue que par la minute, plafonnée à quatre cartes. Une inconnue
// qui n'y entrait pas n'apparaissait nulle part. Vu à Châtelaillon : Géorisques muet sur l'argile,
// les plans de prévention et les cavités, et rien à l'écran ne disait que ces vérifications
// n'avaient pas eu lieu. Le lecteur pouvait croire qu'elles avaient été faites et n'avaient rien
// trouvé.
//
// Test de source : le composant est un rendu React, et ce qui compte ici est qu'il LISE la section.
// ════════════════════════════════════════════════════════════════════════════════════════════
test("la liste complète rend la section des inconnues, hors de la minute", () => {
  const src = readFileSync("src/components/report/ControlesDuDossier.tsx", "utf8");
  assert.match(src, /sections\.find\(\(s\) => s\.key === "unknowns"\)/, "la liste complète ne lit plus les inconnues");
  // Le composant ne s'efface pas quand il n'a que des inconnues : c'est le cas d'une panne totale
  // des contrôles établis, celui où le lecteur a le plus besoin de le savoir.
  assert.match(src, /groupes\.length === 0 && inconnues\.length === 0/);
  // Et jamais dans la couleur des contrôles : une donnée non lue ne reçoit aucune valence.
  assert.match(src, /COULEUR_NON_SU = "var\(--reg-non-su\)"/);
});
