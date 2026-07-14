import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseRouteMinutes, routeRequestHash, estimateTravelMinutes } from "./route-time.ts";
import type { ArtifactStore } from "./reachability-store.ts";

// La réponse RÉELLE de l'API (Blagnac -> gare Matabiau, voiture), capturée le 2026-07-14.
const reponse = JSON.parse(
  readFileSync(new URL("./__fixtures__/route-blagnac-matabiau.json", import.meta.url), "utf8"),
);

const BLAGNAC_GARE = {
  fromLat: 43.6294, fromLon: 1.3897, toLat: 43.611448, toLon: 1.453496,
  mode: "car", direction: "to_reference",
} as const;

test("la réponse réelle rend une durée exploitable (Blagnac -> Matabiau : environ 24 minutes)", () => {
  const m = parseRouteMinutes(reponse);
  assert.ok(m != null);
  assert.ok(m > 20 && m < 28, `attendu ~24 minutes, reçu ${m}`);
});

test("une réponse vide, illisible, ou dans une AUTRE UNITÉ ne rend pas un temps au jugé", () => {
  assert.equal(parseRouteMinutes(null), null);
  assert.equal(parseRouteMinutes({}), null);
  assert.equal(parseRouteMinutes({ duration: "vingt" }), null);
  assert.equal(parseRouteMinutes({ duration: -3 }), null);
  // On DEMANDE des minutes : si l'API rend des secondes, la valeur ne dit pas ce qu'on croit.
  assert.equal(parseRouteMinutes({ duration: 1420, timeUnit: "second" }), null);
});

test("LE HASH PORTE LES DEUX POINTS : une durée calculée depuis le centroïde n'est pas celle de l'adresse", () => {
  const h = routeRequestHash(BLAGNAC_GARE);
  assert.equal(h, routeRequestHash({ ...BLAGNAC_GARE }));
  assert.notEqual(h, routeRequestHash({ ...BLAGNAC_GARE, fromLat: 43.65 })); // autre départ
  assert.notEqual(h, routeRequestHash({ ...BLAGNAC_GARE, toLon: 1.5 })); // autre arrivée
  assert.notEqual(h, routeRequestHash({ ...BLAGNAC_GARE, mode: "walk" })); // autre mode
});

function fakeFetch(handler: () => Promise<Response>) {
  const vrai = globalThis.fetch;
  let appels = 0;
  globalThis.fetch = (async () => {
    appels++;
    return handler();
  }) as typeof fetch;
  return { appels: () => appels, restore: () => { globalThis.fetch = vrai; } };
}

test("deux demandes CONCURRENTES identiques ne partent qu'UNE fois vers IGN", async () => {
  const f = fakeFetch(async () => {
    await new Promise((r) => setTimeout(r, 20));
    return new Response(JSON.stringify({ duration: 23.7, timeUnit: "minute" }), { status: 200 });
  });
  try {
    const r = { ...BLAGNAC_GARE, fromLat: 43.7001 } as const; // une demande neuve (le cache est un module)
    const [a, b] = await Promise.all([estimateTravelMinutes(r), estimateTravelMinutes(r)]);
    assert.equal(f.appels(), 1);
    assert.equal(a, 23.7);
    assert.equal(b, 23.7);
  } finally {
    f.restore();
  }
});

test("un 429 rend null (une panne), N'EST PAS MIS EN CACHE, et se retente", async () => {
  const f = fakeFetch(async () => new Response("", { status: 429, headers: { "retry-after": "0" } }));
  try {
    const r = { ...BLAGNAC_GARE, fromLat: 43.7002 } as const;
    assert.equal(await estimateTravelMinutes(r), null);
    const apres = f.appels();
    assert.equal(await estimateTravelMinutes(r), null); // la panne n'a pas été gravée : on retente
    assert.ok(f.appels() > apres);
  } finally {
    f.restore();
  }
});

test("LE CACHE PARTAGÉ ÉVITE L'APPEL : ce que la table connaît ne repart pas vers IGN", async () => {
  const r = { ...BLAGNAC_GARE, fromLat: 43.7003 } as const;
  const store: ArtifactStore = {
    getIsochrone: async () => null,
    putIsochrone: async () => {},
    getMinutes: async () => 19.5, // la table connaît déjà cette demande
    putMinutes: async () => {},
  };
  const f = fakeFetch(async () => new Response(JSON.stringify({ duration: 99 }), { status: 200 }));
  try {
    assert.equal(await estimateTravelMinutes(r, store), 19.5);
    assert.equal(f.appels(), 0); // aucun appel réseau
  } finally {
    f.restore();
  }
});

test("une écriture de cache qui échoue ne fait PAS tomber la recherche", async () => {
  const r = { ...BLAGNAC_GARE, fromLat: 43.7004 } as const;
  const store: ArtifactStore = {
    getIsochrone: async () => null,
    putIsochrone: async () => {},
    getMinutes: async () => null,
    putMinutes: async () => {
      throw new Error("base indisponible");
    },
  };
  const f = fakeFetch(async () =>
    new Response(JSON.stringify({ duration: 21.2, timeUnit: "minute" }), { status: 200 }),
  );
  try {
    await assert.rejects(store.putMinutes("x", 1, { engine: "e", resource: "r", integrationVersion: "v" }));
    // …et pourtant l'estimation aboutit : le cache est un confort, pas une dépendance.
    assert.equal(await estimateTravelMinutes(r, store), 21.2);
  } finally {
    f.restore();
  }
});
