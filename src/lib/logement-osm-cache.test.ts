import test from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getTileGeoms, OSM_QUERY_VERSION, OSM_ECHEC_DELAI_MS } from "./logement-osm.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LE CACHE DE TUILE FACE À UNE PANNE OVERPASS (04/11/2026).
//
// Constaté en production : les trois miroirs refusaient (403 liste blanche, 502 saturé, délai de
// 25 s dépassé). La recherche durait plus longtemps que l'attente de la page (3,5 s), si bien que
// l'échec n'était JAMAIS constaté : le dossier restait `pending`, chaque ouverture relançait deux
// chaînes Overpass complètes, et rien ne gardait trace de la panne.
// ════════════════════════════════════════════════════════════════════════════════════════════

type Appel = { op: string; payload?: unknown; options?: unknown; filtres: unknown[] };

function fauxSupabase(
  ligne: Record<string, unknown> | null,
  opts: { erreurLecture?: boolean; erreurEcriture?: boolean } = {},
) {
  const appels: Appel[] = [];
  const sb = {
    from() {
      const q: Appel = { op: "select", filtres: [] };
      const resultat = () => ({ data: [], error: opts.erreurEcriture ? { message: "écriture refusée" } : null });
      const b = {
        select() { return b; },
        eq(c: string, v: unknown) { q.filtres.push(["eq", c, v]); return b; },
        or(f: string) { q.filtres.push(["or", f]); return b; },
        maybeSingle: async () =>
          opts.erreurLecture ? { data: null, error: { message: "lecture refusée" } } : { data: ligne, error: null },
        upsert(p: unknown, o?: unknown) { q.op = "upsert"; q.payload = p; q.options = o; appels.push(q); return b; },
        update(p: unknown) { q.op = "update"; q.payload = p; appels.push(q); return b; },
        then(res: (v: unknown) => void, rej?: (e: unknown) => void) { return Promise.resolve(resultat()).then(res, rej); },
      };
      return b;
    },
  };
  return { sb: sb as unknown as SupabaseClient, appels };
}

/** Remplace `fetch` le temps d'un test, et compte les appels. */
async function avecFetch<T>(impl: () => Promise<Response>, corps: (compte: () => number) => Promise<T>): Promise<T> {
  const original = globalThis.fetch;
  let n = 0;
  globalThis.fetch = (async () => { n++; return impl(); }) as typeof fetch;
  try {
    return await corps(() => n);
  } finally {
    globalThis.fetch = original;
  }
}

/** Fait taire (et capture) `console.error` le temps d'un test. */
async function avecErreursCapturees<T>(corps: (lignes: string[]) => Promise<T>): Promise<T> {
  const original = console.error;
  const lignes: string[] = [];
  console.error = (...a: unknown[]) => { lignes.push(a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" ")); };
  try {
    return await corps(lignes);
  } finally {
    console.error = original;
  }
}

const ok = () => Promise.resolve(new Response(JSON.stringify({ elements: [] }), { status: 200 }));
const sature = () => Promise.resolve(new Response("at capacity", { status: 502 }));

// Chaque test vise sa propre cellule : la mise en commun des recherches en cours est par cellule.
let lat = 46.1;
const centre = () => ({ lat: (lat += 0.01), lon: -1.15 });

test("tuile en cache, à jour : aucune requête Overpass", async () => {
  const { sb } = fauxSupabase({ geometries: [], status: "complete", query_version: OSM_QUERY_VERSION, fetched_at: "2026-10-31T00:00:00Z" });
  await avecFetch(ok, async (compte) => {
    const r = await getTileGeoms(sb, centre());
    assert.equal(r.status, "complete");
    assert.equal(compte(), 0);
  });
});

test("tuile froide, Overpass répond : écrite `complete` dans le cache", async () => {
  const { sb, appels } = fauxSupabase(null);
  await avecFetch(ok, async () => {
    const r = await getTileGeoms(sb, centre());
    assert.equal(r.status, "complete");
    const ecrit = appels.find((a) => a.op === "upsert");
    assert.equal((ecrit?.payload as { status: string }).status, "complete");
  });
});

test("une écriture du cache refusée est journalisée, pas avalée, et la donnée obtenue sert quand même", async () => {
  const { sb } = fauxSupabase(null, { erreurEcriture: true });
  await avecErreursCapturees(async (lignes) => {
    await avecFetch(ok, async () => {
      const r = await getTileGeoms(sb, centre());
      assert.equal(r.status, "complete");
    });
    assert.ok(lignes.some((l) => l.includes("écriture refusée")), "l'erreur Supabase doit être visible dans les journaux");
  });
});

test("tous les miroirs en panne : l'échec est rendu ET mémorisé dans le cache", async () => {
  const { sb, appels } = fauxSupabase(null);
  await avecErreursCapturees(async (lignes) => {
    await avecFetch(sature, async (compte) => {
      const r = await getTileGeoms(sb, centre());
      assert.equal(r.status, "failed");
      assert.equal(compte(), 3, "chaque miroir est essayé une fois, pas davantage");
    });
    assert.ok(lignes.some((l) => l.includes("502")), "le motif du refus doit être journalisé");
  });
  const ecrits = appels.filter((a) => a.op === "update" || a.op === "upsert");
  assert.ok(ecrits.length > 0, "l'échec doit être écrit");
  for (const e of ecrits) {
    const p = e.payload as { status: string; query_version: string; geometries: unknown[] };
    assert.equal(p.status, "failed");
    assert.equal(p.query_version, OSM_QUERY_VERSION);
    assert.deepEqual(p.geometries, []);
  }
  // L'ÉCHEC N'ÉCRASE JAMAIS UNE TUILE COMPLÈTE À JOUR, écrite entre-temps par une autre instance :
  // la mise à jour l'exclut par filtre, et l'insertion ne remplace rien d'existant.
  const maj = ecrits.find((e) => e.op === "update");
  assert.ok(maj?.filtres.some((f) => Array.isArray(f) && f[0] === "or" && String(f[1]).includes("status.neq.complete")));
  const ins = ecrits.find((e) => e.op === "upsert");
  assert.deepEqual((ins?.options as { ignoreDuplicates?: boolean })?.ignoreDuplicates, true);
});

test("un échec récent dans le cache : AUCUNE requête Overpass, l'échec est rendu tout de suite", async () => {
  const recent = new Date(Date.now() - 60_000).toISOString();
  const { sb } = fauxSupabase({ geometries: [], status: "failed", query_version: OSM_QUERY_VERSION, fetched_at: recent });
  await avecFetch(ok, async (compte) => {
    const r = await getTileGeoms(sb, centre());
    assert.equal(r.status, "failed");
    assert.equal(compte(), 0, "une source en panne ne se martèle pas à chaque ouverture");
  });
});

test("un échec ancien (au-delà du délai) : Overpass est de nouveau interrogé", async () => {
  const ancien = new Date(Date.now() - OSM_ECHEC_DELAI_MS - 1000).toISOString();
  const { sb } = fauxSupabase({ geometries: [], status: "failed", query_version: OSM_QUERY_VERSION, fetched_at: ancien });
  await avecFetch(ok, async (compte) => {
    const r = await getTileGeoms(sb, centre());
    assert.equal(r.status, "complete");
    assert.equal(compte(), 1);
  });
});

test("cache illisible : rendu `failed`, journalisé, et Overpass n'est pas sollicité à l'aveugle", async () => {
  const { sb } = fauxSupabase(null, { erreurLecture: true });
  await avecErreursCapturees(async (lignes) => {
    await avecFetch(ok, async (compte) => {
      const r = await getTileGeoms(sb, centre());
      assert.equal(r.status, "failed");
      assert.equal(compte(), 0);
    });
    assert.ok(lignes.some((l) => l.includes("lecture refusée")));
  });
});

test("deux demandes simultanées sur la même cellule : une seule recherche Overpass", async () => {
  const { sb } = fauxSupabase(null);
  const c = centre();
  await avecFetch(ok, async (compte) => {
    const [a, b] = await Promise.all([getTileGeoms(sb, c), getTileGeoms(sb, c)]);
    assert.equal(a.status, "complete");
    assert.equal(b.status, "complete");
    assert.equal(compte(), 1);
  });
});

test("tuile complète d'une version de requête antérieure (dossier ancien en attente) : redemandée, puis réécrite complète", async () => {
  const { sb, appels } = fauxSupabase({ geometries: [], status: "complete", query_version: "osm-v3-ancienne", fetched_at: "2026-08-18T00:00:00Z" });
  await avecFetch(ok, async (compte) => {
    const r = await getTileGeoms(sb, centre());
    assert.equal(r.status, "complete");
    assert.equal(compte(), 1);
  });
  const ecrit = appels.find((a) => a.op === "upsert");
  assert.equal((ecrit?.payload as { query_version: string }).query_version, OSM_QUERY_VERSION);
});

test("une demande qui suit une recherche terminée en échec ne repart pas d'une promesse figée", async () => {
  const { sb } = fauxSupabase(null);
  const c = centre();
  await avecErreursCapturees(async () => {
    await avecFetch(sature, async () => assert.equal((await getTileGeoms(sb, c)).status, "failed"));
  });
  // La recherche terminée a quitté la table des recherches en cours : la suivante interroge à nouveau
  // (le faux cache ne garde pas l'échec ; en production, c'est lui qui retient pendant 10 minutes).
  await avecFetch(ok, async (compte) => {
    assert.equal((await getTileGeoms(sb, c)).status, "complete");
    assert.equal(compte(), 1);
  });
});
