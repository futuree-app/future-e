import test from "node:test";
import assert from "node:assert/strict";
import { pickFeatureById } from "./ban-verify.ts";

const f = (id: string, type: string) => ({
  id,
  type,
  label: `${id} label`,
  city: "Nantes",
  citycode: "44109",
  postcode: "44000",
  latitude: 47.2,
  longitude: -1.55,
});

test("retient la feature dont l'identifiant correspond exactement", () => {
  const out = pickFeatureById(
    [f("44109_2300_00001", "housenumber"), f("44109_2300_00002", "housenumber")],
    "44109_2300_00002",
  );
  assert.equal(out?.id, "44109_2300_00002");
});

test("rend null quand l'identifiant demandé est absent", () => {
  // Le client a désigné une adresse que la BAN ne confirme pas : on ne vend pas.
  assert.equal(pickFeatureById([f("44109_2300_00001", "housenumber")], "44109_9999_00002"), null);
});

test("ne se rabat jamais sur le premier résultat", () => {
  // C'est la porte par laquelle une adresse voisine entrerait dans un dossier payé.
  assert.equal(pickFeatureById([f("44109_2300_00001", "street")], "44109_2300_00002"), null);
});

test("rend null sur une liste vide", () => {
  assert.equal(pickFeatureById([], "44109_2300_00002"), null);
});
