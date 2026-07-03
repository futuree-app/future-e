import test from "node:test";
import assert from "node:assert/strict";
import { parseBanAutocomplete } from "./ban.ts";

const feature = (over: Record<string, unknown> = {}) => ({
  geometry: { coordinates: [-1.15, 46.16] },
  properties: {
    id: "ban-1", label: "1 rue X, 17000 La Rochelle", city: "La Rochelle",
    citycode: "17300", postcode: "17000", type: "housenumber", ...over,
  },
});

test("parse plusieurs features avec type et coordonnées", () => {
  const out = parseBanAutocomplete([feature(), feature({ id: "ban-2", type: "street" })]);
  assert.equal(out.length, 2);
  assert.equal(out[0].type, "housenumber");
  assert.equal(out[0].latitude, 46.16);
  assert.equal(out[0].longitude, -1.15);
  assert.equal(out[1].type, "street");
});

test("ignore une feature sans coordonnées", () => {
  const bad = { properties: { id: "x", label: "sans géo", type: "street" } };
  const out = parseBanAutocomplete([feature(), bad]);
  assert.equal(out.length, 1);
});
