// FUT-15 — le libellé d'une ligne d'espace vert dit où est l'adresse par rapport à lui.
import test from "node:test";
import assert from "node:assert/strict";
import { adresseDansLEspace, libelleLigneEspaceVert } from "./logement-autour-types.ts";

test("dehors : les libellés d'origine sont conservés", () => {
  assert.equal(libelleLigneEspaceVert({ distanceMeters: 120 }, "proche"), "Le plus proche");
  assert.equal(libelleLigneEspaceVert({ distanceMeters: 320 }, "grand"), "Un grand espace vert à proximité");
});

test("dedans : le grand espace n'est plus « à proximité », l'adresse est dedans", () => {
  const l = libelleLigneEspaceVert({ distanceMeters: 0 }, "grand");
  assert.equal(l, "L'adresse est dans un grand espace vert");
  assert.doesNotMatch(l, /proximité/);
  assert.equal(libelleLigneEspaceVert({ distanceMeters: 0 }, "proche"), "L'adresse est dans un espace vert");
});

test("1 m n'est pas dedans : seul 0 change le libellé", () => {
  assert.equal(adresseDansLEspace({ distanceMeters: 1 }), false);
  assert.equal(libelleLigneEspaceVert({ distanceMeters: 1 }, "grand"), "Un grand espace vert à proximité");
});
