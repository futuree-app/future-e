import test from "node:test";
import assert from "node:assert/strict";
import { validateSelectedBanAddress } from "./selected-ban-address.ts";

const ok = {
  banId: "ban-1", label: "1 rue X, 17000 La Rochelle", postcode: "17000",
  city: "La Rochelle", citycode: "17300", latitude: 46.16, longitude: -1.15, type: "housenumber",
};

test("objet complet -> validé", () => {
  assert.deepEqual(validateSelectedBanAddress(ok), {
    ...ok, housenumber: undefined, street: undefined,
  });
});

test("champ requis manquant -> null", () => {
  assert.equal(validateSelectedBanAddress({ ...ok, citycode: undefined }), null);
});

test("coordonnées hors bornes -> null", () => {
  assert.equal(validateSelectedBanAddress({ ...ok, latitude: 200 }), null);
});

test("entrée non-objet -> null", () => {
  assert.equal(validateSelectedBanAddress(null), null);
  assert.equal(validateSelectedBanAddress("x"), null);
});
