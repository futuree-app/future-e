import test from "node:test";
import assert from "node:assert/strict";
import { nearestByCategory } from "./logement-bpe.ts";
import type { BpePoint } from "./logement-autour-types.ts";

const C = { lat: 48.850, lon: 2.350 };

test("plus proche par catégorie + cap dépassé -> null", () => {
  const pts: BpePoint[] = [
    { c: "sante", lat: 48.8505, lon: 2.350 }, // ~55 m
    { c: "sante", lat: 48.900, lon: 2.350 }, // ~5,5 km
    { c: "education", lat: 49.10, lon: 2.35 }, // ~28 km (au-delà du cap)
  ];
  const res = nearestByCategory(C, pts, 3000);
  const sante = res.find((r) => r.category === "sante")!;
  const edu = res.find((r) => r.category === "education")!;
  assert.ok(sante.nearest && sante.nearest.distanceMeters < 80);
  assert.equal(edu.nearest, null); // rien sous 3 km
});

test("toutes les catégories sont présentes dans la sortie", () => {
  const res = nearestByCategory(C, [], 3000);
  assert.equal(res.length, 5);
  assert.ok(res.every((r) => r.nearest === null && r.searchCapMeters === 3000));
});
