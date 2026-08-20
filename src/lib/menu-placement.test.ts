import test from "node:test";
import assert from "node:assert/strict";
import { placementDuMenu } from "./menu-placement.ts";

// ── LE CAS QUI A COÛTÉ UNE VENTE ─────────────────────────────────────────────────────────────
// Android, page `/dossier`, clavier ouvert. Le champ est à peu près au milieu d'un écran de 800,
// et le clavier en couvre 360. La mesure du viewport de MISE EN PAGE (800) faisait conclure « il y
// a 388 px sous le champ », et la liste se posait derrière le clavier.
test("clavier ouvert : la liste bascule au-dessus du champ", () => {
  const champ = { top: 360, bottom: 400 };
  // Ce que voit l'œil : 440 px de haut, le reste est le clavier.
  const p = placementDuMenu(champ, { top: 0, height: 440 });
  assert.equal(p.up, true);
  // Elle tient dans la place réellement disponible au-dessus (360 - 12).
  assert.ok(p.maxH <= 348, `maxH=${p.maxH}`);
});

test("la même géométrie mesurée sur le viewport de mise en page ouvrait vers le bas", () => {
  // La régression que le module ferme : c'est exactement le calcul d'avant, et il dit « en bas ».
  const p = placementDuMenu({ top: 360, bottom: 400 }, { top: 0, height: 800 });
  assert.equal(p.up, false);
});

test("écran libre : le bas reste le défaut, même si le haut offre davantage", () => {
  // Un menu qui saute au-dessus dès que le haut fait mieux se déplacerait sous les yeux du lecteur
  // au moindre défilement. Tant que le bas est confortable, on n'y touche pas.
  const p = placementDuMenu({ top: 600, bottom: 640 }, { top: 0, height: 1000 });
  assert.equal(p.up, false);
  assert.equal(p.maxH, 280);
});

test("champ en bas de page : bascule au-dessus", () => {
  const p = placementDuMenu({ top: 720, bottom: 760 }, { top: 0, height: 800 });
  assert.equal(p.up, true);
});

test("le viewport visuel décalé est pris dans le même repère que le champ", () => {
  // Le navigateur a fait défiler la page pour dégager le champ : la zone visible commence à 120.
  // Sans ce décalage, on croirait avoir 120 px de plus en haut qu'il n'y en a.
  const champ = { top: 200, bottom: 240 };
  const p = placementDuMenu(champ, { top: 120, height: 300 });
  assert.equal(p.up, false); // 120 + 300 - 240 - 12 = 168 en bas, contre 68 en haut
  assert.equal(p.maxH, 168);
});

test("aucun côté n'a la place : la hauteur ne dépasse jamais un plancher qui déborderait", () => {
  // Le plancher valait 120 px et s'imposait même quand la place réelle était plus petite : le menu
  // débordait alors du côté qu'on venait de choisir pour l'éviter.
  const p = placementDuMenu({ top: 40, bottom: 80 }, { top: 0, height: 140 });
  assert.ok(p.maxH <= 88, `maxH=${p.maxH}`);
});
