import { test } from "node:test";
import assert from "node:assert/strict";
import { lireChaleurEtVegetal } from "./logement-autour-chaleur.ts";
import type { GreenKind } from "./logement-autour-types.ts";

const vert = (kind: GreenKind | undefined, d: number) => ({
  nearestMappedGreenSpace: { distanceMeters: d, kind },
});

test("sans îlot de chaleur mesuré, il n'y a rien à relier", () => {
  assert.equal(lireChaleurEtVegetal(null, vert("wood", 340)), null);
});

test("un bois : la nature est nommée, la densité d'arbres reste ouverte", () => {
  const r = lireChaleurEtVegetal({ iuhi: 4.2, level: "marque" }, vert("wood", 340))!;
  assert.match(r.texte, /îlot de chaleur urbain marqué/);
  assert.match(r.texte, /un bois, à 340 mètres de l'adresse/);
  assert.match(r.limite, /densité d'arbres/);
});

test("une pelouse : aucun ombrage n'est supposé", () => {
  const r = lireChaleurEtVegetal({ iuhi: 3.1, level: "present" }, vert("grass", 120))!;
  assert.match(r.texte, /une surface enherbée, à 120 mètres/);
  assert.match(r.limite, /ombrage/);
});

test("un parc n'est pas présumé arboré", () => {
  const r = lireChaleurEtVegetal({ iuhi: 4, level: "marque" }, vert("park", 210))!;
  assert.match(r.texte, /un parc/);
  assert.match(r.limite, /ombrage et son confort/);
});

test("aucun espace vert : l'absence porte sur le périmètre cartographié, pas sur le réel", () => {
  const r = lireChaleurEtVegetal({ iuhi: 4.5, level: "marque" }, { nearestMappedGreenSpace: null })!;
  assert.match(r.texte, /aucun espace végétalisé n'est cartographié/);
  assert.match(r.limite, /pas sur l'ensemble des espaces existants/);
});

test("un espace sans tag de nature reste générique", () => {
  const r = lireChaleurEtVegetal({ iuhi: 3.4, level: "present" }, vert(undefined, 90))!;
  assert.match(r.texte, /un espace végétalisé, à 90 mètres/);
});

test("LES DEUX ÉCHELLES SONT NOMMÉES dans toutes les branches", () => {
  // L'îlot de chaleur est mesuré au grand-IRIS, l'espace vert depuis l'adresse. Fondre les deux
  // dans une même échelle est exactement ce que la doctrine interdit.
  const cas = [
    lireChaleurEtVegetal({ iuhi: 4, level: "marque" }, vert("wood", 300)),
    lireChaleurEtVegetal({ iuhi: 4, level: "marque" }, vert("grass", 80)),
    lireChaleurEtVegetal({ iuhi: 3, level: "present" }, { nearestMappedGreenSpace: null }),
  ];
  for (const r of cas) {
    assert.match(r!.texte, /secteur/, "l'échelle de la chaleur doit être dite");
    assert.ok(
      /adresse|autour de l'adresse/.test(r!.texte),
      "l'échelle du végétal doit être dite",
    );
  }
});

test("AUCUNE FORMULE DE COMPENSATION, dans aucune branche", () => {
  // Un espace vert ne compense pas l'exposition : la chaleur subie chez soi est la même avec ou
  // sans bois à 300 mètres. Cette assertion garde la rédaction future autant que l'actuelle.
  const interdits = /compens|atténu|rafraîchi|soulag|répit|refuge|tempèr|protège|frais/i;
  const cas = [
    lireChaleurEtVegetal({ iuhi: 4.2, level: "marque" }, vert("wood", 340)),
    lireChaleurEtVegetal({ iuhi: 3.1, level: "present" }, vert("grass", 120)),
    lireChaleurEtVegetal({ iuhi: 4, level: "marque" }, vert("park", 210)),
    lireChaleurEtVegetal({ iuhi: 4.5, level: "marque" }, { nearestMappedGreenSpace: null }),
  ];
  for (const r of cas) {
    assert.doesNotMatch(r!.texte, interdits);
    assert.doesNotMatch(r!.limite, interdits);
  }
});
