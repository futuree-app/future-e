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
