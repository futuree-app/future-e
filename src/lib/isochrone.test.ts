import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseIsochrone, reachabilityRequestHash, getReachability } from "./isochrone.ts";
import { pointInPolygon } from "./geo-polygon.ts";

// La réponse RÉELLE de l'API IGN (30 minutes en voiture depuis la gare Matabiau, direction=arrival),
// capturée le 2026-07-14.
const iso = JSON.parse(
  readFileSync(new URL("./__fixtures__/isochrone-matabiau-30min-car.json", import.meta.url), "utf8"),
);

test("la réponse IGN rend un polygone exploitable", () => {
  const g = parseIsochrone(iso);
  assert.ok(g);
  assert.equal(g.type, "Polygon");
});

test("LE POLYGONE EST DANS LE BON SENS : Toulouse est dedans, Bordeaux est dehors", () => {
  // Le contrôle d'inversion lon/lat, de bout en bout (parsing + prédicat). À l'envers, Toulouse sortirait
  // DEHORS, et le lecteur verrait sa propre ville déclarée incompatible avec sa gare.
  const g = parseIsochrone(iso)!;
  assert.equal(pointInPolygon(43.6045, 1.4442, g, 300), "inside"); // Toulouse, centre
  assert.equal(pointInPolygon(44.8378, -0.5792, g, 300), "outside"); // Bordeaux, à 2 h de route
});

test("une commune vraiment lointaine reste dehors, une commune vraiment proche reste dedans", () => {
  const g = parseIsochrone(iso)!;
  assert.equal(pointInPolygon(43.6294, 1.3897, g, 300), "inside"); // Blagnac, 20 min
  assert.equal(pointInPolygon(43.6465, 0.5861, g, 300), "outside"); // Auch, 1 h 15
});

test("une réponse vide ou sans géométrie rend null, jamais un polygone vide", () => {
  assert.equal(parseIsochrone(null), null);
  assert.equal(parseIsochrone({}), null);
  assert.equal(parseIsochrone({ geometry: { type: "Point", coordinates: [1, 43] } }), null);
  assert.equal(parseIsochrone({ geometry: { type: "Polygon", coordinates: [] } }), null);
});

test("le hash porte les COORDONNÉES, la durée, le mode et le sens : pas un identifiant de lieu", () => {
  const base = {
    lat: 43.611448, lon: 1.453496, maxMinutes: 30, mode: "car", direction: "to_reference",
  } as const;
  assert.equal(reachabilityRequestHash(base), reachabilityRequestHash({ ...base }));
  assert.notEqual(reachabilityRequestHash(base), reachabilityRequestHash({ ...base, lat: 43.7 }));
  assert.notEqual(reachabilityRequestHash(base), reachabilityRequestHash({ ...base, maxMinutes: 20 }));
  assert.notEqual(reachabilityRequestHash(base), reachabilityRequestHash({ ...base, mode: "walk" }));
});

// LE CACHE EST UNE CONDITION DE FONCTIONNEMENT, pas une optimisation : l'API rate-limite. Deux lecteurs
// simultanés sur la même gare ne doivent produire qu'UN appel réseau.
test("deux appels CONCURRENTS sur la même demande ne partent qu'UNE fois vers IGN", async () => {
  const vrai = globalThis.fetch;
  let appels = 0;
  globalThis.fetch = (async () => {
    appels++;
    await new Promise((r) => setTimeout(r, 20)); // le second appel arrive pendant que le premier vole
    return new Response(JSON.stringify(iso), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  try {
    const r = { lat: 43.7, lon: 1.5, maxMinutes: 25, mode: "car", direction: "to_reference" } as const;
    const [a, b] = await Promise.all([getReachability(r), getReachability(r)]);
    assert.equal(appels, 1);
    assert.equal(a.status, "ready");
    assert.equal(b.status, "ready");
  } finally {
    globalThis.fetch = vrai;
  }
});

test("un 429 rend routing_unavailable, N'EST PAS MIS EN CACHE, et se retente", async () => {
  const vrai = globalThis.fetch;
  let appels = 0;
  globalThis.fetch = (async () => {
    appels++;
    return new Response("Too Many Requests", { status: 429 });
  }) as typeof fetch;
  try {
    const r = { lat: 44.1, lon: 1.9, maxMinutes: 15, mode: "walk", direction: "to_reference" } as const;
    const a = await getReachability(r);
    assert.equal(a.status, "unavailable");
    if (a.status !== "unavailable") return;
    assert.equal(a.reason, "routing_unavailable");
    await getReachability(r); // une panne se RETENTE : elle n'a pas été gravée
    assert.equal(appels, 2);
  } finally {
    globalThis.fetch = vrai;
  }
});
