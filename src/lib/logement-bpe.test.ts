import test from "node:test";
import assert from "node:assert/strict";
import { nearestByCategory } from "./logement-bpe.ts";
import type { BpePoint } from "./logement-autour-types.ts";

const C = { lat: 48.850, lon: 2.350 };

test("plus proche par catégorie + cap dépassé -> null", () => {
  const pts: BpePoint[] = [
    { c: "sante", t: "D307", lat: 48.8505, lon: 2.350 }, // pharmacie ~55 m
    { c: "sante", t: "D265", lat: 48.900, lon: 2.350 }, // médecin ~5,5 km
    { c: "education", t: "C109", lat: 49.10, lon: 2.35 }, // école ~28 km (au-delà du cap)
  ];
  const res = nearestByCategory(C, pts, 3000);
  const sante = res.find((r) => r.category === "sante")!;
  const edu = res.find((r) => r.category === "education")!;
  assert.ok(sante.nearest && sante.nearest.distanceMeters < 80);
  assert.equal(sante.nearest!.typeLabel, "Pharmacie"); // type précis du plus proche
  assert.equal(edu.nearest, null); // rien sous 3 km
});

test("toutes les catégories sont présentes dans la sortie", () => {
  const res = nearestByCategory(C, [], 3000);
  assert.equal(res.length, 5);
  assert.ok(res.every((r) => r.nearest === null && r.searchCapMeters === 3000));
});

// ════════════════════════════════════════════════════════════════════════════════════════════
// LE COMPTAGE À PORTÉE DE PAS (01/08/2026)
//
// « La plus proche » efface la différence entre un secteur où une boulangerie est à 400 m et un
// secteur où il y en a quatre. C'est pourtant la différence entre avoir un commerce et avoir le
// choix, et elle ne se voit sur aucune carte au premier coup d'œil.
// ════════════════════════════════════════════════════════════════════════════════════════════

test("le comptage à portée de pas ne retient QUE ce qui est dans le rayon", () => {
  const centre = { lat: 45, lon: 5 };
  // 0,001° de latitude vaut environ 111 m : de quoi placer des points à des distances connues.
  const pts = [
    { c: "alimentation" as const, t: "B207", lat: 45.001, lon: 5 }, // ~111 m
    { c: "alimentation" as const, t: "B207", lat: 45.002, lon: 5 }, // ~222 m
    { c: "alimentation" as const, t: "B207", lat: 45.008, lon: 5 }, // ~889 m, hors rayon
  ];
  const r = nearestByCategory(centre, pts).find((x) => x.category === "alimentation")!;
  assert.equal(r.withinWalkCount, 2, "le troisième est au-delà de 500 m");
  assert.ok(r.nearest && r.nearest.distanceMeters < 130, "le plus proche reste le plus proche");
});

test("le comptage rend 0 quand la catégorie existe au loin mais pas à portée de pas", () => {
  // Zéro EST une réponse ici : la recherche a bien eu lieu. C'est `undefined` qui veut dire
  // « non compté », et il ne peut venir que d'un snapshot figé avant ce comptage.
  const r = nearestByCategory({ lat: 45, lon: 5 }, [
    { c: "sante" as const, t: "D307", lat: 45.02, lon: 5 },
  ]).find((x) => x.category === "sante")!;
  assert.equal(r.withinWalkCount, 0);
  assert.ok(r.nearest, "elle existe, elle est juste loin");
});

test("chaque catégorie compte la sienne, sans contamination", () => {
  const r = nearestByCategory({ lat: 45, lon: 5 }, [
    { c: "sante" as const, t: "D307", lat: 45.001, lon: 5 },
    { c: "alimentation" as const, t: "B207", lat: 45.001, lon: 5 },
    { c: "alimentation" as const, t: "B105", lat: 45.0015, lon: 5 },
  ]);
  assert.equal(r.find((x) => x.category === "sante")!.withinWalkCount, 1);
  assert.equal(r.find((x) => x.category === "alimentation")!.withinWalkCount, 2);
  assert.equal(r.find((x) => x.category === "education")!.withinWalkCount, 0);
});
