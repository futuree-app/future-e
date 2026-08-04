import test from "node:test";
import assert from "node:assert/strict";
import {
  MOT, COMPACT, POINT, MOT_MINIMUM, HAUTEUR_MOT_IMPRIME_PT, largeurMot, mmToPt,
} from "./brand-mark.ts";

test("LE LOGO IMPRIMÉ RESTE AU-DESSUS DU PLANCHER DE LA CHARTE", () => {
  // C'est la LARGEUR qui borne à l'impression, pas la hauteur. Ce test est la raison pour laquelle
  // la hauteur choisie pour la facture vit dans ce module : une valeur baissée « pour gagner de la
  // place en en-tête » passerait sous le minimum sans que rien ne le signale.
  const largeurPt = largeurMot(HAUTEUR_MOT_IMPRIME_PT);
  const plancherPt = mmToPt(MOT_MINIMUM.printWidthMm);
  assert.ok(
    largeurPt >= plancherPt,
    `${largeurPt.toFixed(1)} pt de large, plancher ${plancherPt.toFixed(1)} pt (${MOT_MINIMUM.printWidthMm} mm)`,
  );
});

test("le viewBox et sa décomposition décrivent le même cadre", () => {
  // `box` existe pour les supports sans viewBox (pdfkit). Deux écritures du même cadre : elles
  // doivent coïncider, sinon le logo se dessine décalé sur ce support-là seulement.
  for (const g of [MOT, COMPACT]) {
    const [x, y, w, h] = g.viewBox.split(" ").map(Number);
    assert.deepEqual({ x, y, width: w, height: h }, g.box, g.viewBox);
  }
});

test("le ratio se déduit du cadre, il n'est pas saisi à part", () => {
  assert.equal(MOT.ratio, MOT.box.width / MOT.box.height);
  assert.equal(COMPACT.ratio, COMPACT.box.width / COMPACT.box.height);
});

test("LE POINT EST DANS LE CADRE DU MOT-SYMBOLE", () => {
  // Il est dessiné à part des tracés, donc rien ne le rattache au cadre : posé hors du viewBox, il
  // disparaîtrait en SVG et déborderait en PDF, où rien ne rogne.
  assert.ok(POINT.cx - POINT.r >= MOT.box.x, "le point déborde à gauche");
  assert.ok(POINT.cx + POINT.r <= MOT.box.x + MOT.box.width, "le point déborde à droite");
  assert.ok(POINT.cy - POINT.r >= MOT.box.y, "le point déborde en haut");
  assert.ok(POINT.cy + POINT.r <= MOT.box.y + MOT.box.height, "le point déborde en bas");
});

test("le `e` est le seul tracé en even-odd, et il porte bien deux sous-chemins", () => {
  // Sa contre-forme est un second sous-chemin : s'il n'y en avait qu'un, la règle even-odd serait
  // inutile, et si un autre tracé en comptait deux, il lui faudrait la même règle.
  const sousChemins = (d: string) => (d.match(/M /g) ?? []).length;
  assert.equal(sousChemins(MOT.pathEvenOdd), 2);
  for (const d of MOT.paths) assert.equal(sousChemins(d), 1, d.slice(0, 40));
});

test("la géométrie est celle du master audité, aux valeurs décidées près", () => {
  // Trois valeurs que le rapport de validation du pack donne explicitement. Elles servent de
  // témoin : si ce fichier était réécrit depuis un autre master, elles bougeraient.
  assert.equal(POINT.r, 25, "diamètre du point : 50 unités");
  assert.equal(POINT.cy, 461.5, "centre du point sur le milieu de la hauteur d'x");
  assert.equal(MOT.paths.length + 1, 6, "six tracés : f, u, t, u, r, e");
});
