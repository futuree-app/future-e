import test from "node:test";
import assert from "node:assert/strict";
import { cellKey, neighborKeys, cellBBox, GRID_CELL_DEG } from "./geo-grid.ts";

test("cellKey stable et déterministe", () => {
  const k = cellKey(48.85, 2.35);
  assert.equal(k, cellKey(48.851, 2.351)); // même cellule (0.18°)
  assert.match(k, /^g_-?\d+_-?\d+$/);
});

test("neighborKeys = 9 clés dont la cellule centrale", () => {
  const ns = neighborKeys(48.85, 2.35);
  assert.equal(ns.length, 9);
  assert.ok(ns.includes(cellKey(48.85, 2.35)));
});

test("cellBBox contient le point de la cellule", () => {
  const b = cellBBox(cellKey(48.85, 2.35));
  assert.ok(b.s <= 48.85 && 48.85 < b.n && b.w <= 2.35 && 2.35 < b.e);
  assert.ok(Math.abs(b.n - b.s - GRID_CELL_DEG) < 1e-9);
});
