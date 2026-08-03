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
  assert.match(r.limite, /densité réelle de son couvert arboré/);
});

test("un espace de loisirs n'est jamais présenté comme végétalisé", () => {
  // `recreation_ground` peut être largement minéral : la catégorie OSM ne garantit pas la végétation.
  const r = lireChaleurEtVegetal({ iuhi: 4, level: "marque" }, vert("recreation_ground", 150))!;
  assert.doesNotMatch(r.texte, /végétalisé/);
  assert.match(r.texte, /un espace de loisirs/);
  assert.match(r.limite, /part de végétation/);
});

test("L'ACCESSIBILITÉ N'EST JAMAIS AFFIRMÉE, et son inconnue est dite", () => {
  // Une distance ne prouve pas l'accès : le polygone peut être privé, clôturé, ou séparé par une
  // voie rapide. Et elle est mesurée jusqu'à la LIMITE, pas jusqu'à une entrée praticable.
  for (const k of ["wood", "park", "grass", "recreation_ground"] as const) {
    const r = lireChaleurEtVegetal({ iuhi: 4, level: "marque" }, vert(k, 200))!;
    assert.doesNotMatch(r.texte, /accès|accessible/i);
    assert.match(r.limite, /accessibilité/);
    assert.match(r.limite, /pas jusqu'à une entrée/);
  }
});

test("STRUCTURE DE LA PREUVE : changer l'espace proche ne change jamais le fait climatique", () => {
  // Le garde-fou lexical ne suffit pas : une compensation peut s'écrire sans mot interdit. Ce test
  // vérifie que la moitié « chaleur » de la phrase est rigoureusement invariante.
  const icu = { iuhi: 4.2, level: "marque" as const };
  const debuts = [
    lireChaleurEtVegetal(icu, vert("wood", 50)),
    lireChaleurEtVegetal(icu, vert("grass", 900)),
    lireChaleurEtVegetal(icu, vert("recreation_ground", 300)),
    lireChaleurEtVegetal(icu, { nearestMappedGreenSpace: null }),
  ].map((r) => r!.texte.split(".")[0]);
  assert.equal(new Set(debuts).size, 1, "le fait climatique doit être identique dans tous les cas");
  assert.match(debuts[0], /Votre secteur présente un îlot de chaleur urbain marqué/);
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
  assert.match(r.texte, /Aucun espace correspondant aux catégories recherchées/);
  assert.match(r.limite, /couverture d'OpenStreetMap et les catégories interrogées/);
});

test("un espace sans tag de nature reste générique", () => {
  const r = lireChaleurEtVegetal({ iuhi: 3.4, level: "present" }, vert(undefined, 90))!;
  assert.match(r.texte, /un espace, à 90 mètres/);
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
