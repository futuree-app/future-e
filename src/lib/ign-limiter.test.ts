import test from "node:test";
import assert from "node:assert/strict";
import { ignFetch, IGN_MAX_CONCURRENCY } from "./ign-limiter.ts";

function fakeFetch(handler: (n: number) => Promise<Response>) {
  const vrai = globalThis.fetch;
  let n = 0;
  let enCours = 0;
  let maxEnCours = 0;
  globalThis.fetch = (async () => {
    n++;
    enCours++;
    maxEnCours = Math.max(maxEnCours, enCours);
    try {
      return await handler(n);
    } finally {
      enCours--;
    }
  }) as typeof fetch;
  return {
    stats: () => ({ appels: n, maxEnCours }),
    restore: () => {
      globalThis.fetch = vrai;
    },
  };
}

const ok = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });

test("LA CONCURRENCE NE DÉPASSE JAMAIS LA LIMITE, même si on lance tout d'un coup", async () => {
  // Mesuré contre l'API le 2026-07-14 : 12 appels concurrents rendent 12 erreurs 429 ; à 3, aucune. Le
  // limiteur est GLOBAL au process, pas par requête : deux recherches simultanées partagent la file.
  const f = fakeFetch(async () => {
    await new Promise((r) => setTimeout(r, 15));
    return ok({ duration: 20 });
  });
  try {
    await Promise.all(Array.from({ length: 12 }, (_, i) => ignFetch(`https://x/${i}`)));
    const { appels, maxEnCours } = f.stats();
    assert.equal(appels, 12);
    assert.ok(maxEnCours <= IGN_MAX_CONCURRENCY, `maxEnCours=${maxEnCours} > ${IGN_MAX_CONCURRENCY}`);
  } finally {
    f.restore();
  }
});

test("un 429 est RETENTÉ une fois, après le délai que le serveur demande", async () => {
  const f = fakeFetch(async (n) =>
    n === 1
      ? new Response("Too Many Requests", { status: 429, headers: { "retry-after": "0" } })
      : ok({ duration: 12.5 }),
  );
  try {
    const r = await ignFetch("https://x/1");
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.deepEqual(r.json, { duration: 12.5 });
    assert.equal(f.stats().appels, 2); // un seul retry
  } finally {
    f.restore();
  }
});

test("un 429 qui PERSISTE rend rate_limited, jamais un verdict", async () => {
  const f = fakeFetch(async () => new Response("", { status: 429, headers: { "retry-after": "0" } }));
  try {
    const r = await ignFetch("https://x/1");
    assert.equal(r.ok, false);
    if (r.ok) return;
    assert.equal(r.reason, "rate_limited");
    assert.equal(f.stats().appels, 2); // l'appel, puis UN retry borné : on n'insiste pas
  } finally {
    f.restore();
  }
});

test("une erreur serveur ou un réseau coupé rend error, sans jeter", async () => {
  const f = fakeFetch(async () => new Response("", { status: 500 }));
  try {
    const r = await ignFetch("https://x/1");
    assert.equal(r.ok, false);
    if (r.ok) return;
    assert.equal(r.reason, "error");
  } finally {
    f.restore();
  }

  const g = fakeFetch(async () => {
    throw new Error("réseau coupé");
  });
  try {
    const r = await ignFetch("https://x/2");
    assert.equal(r.ok, false);
  } finally {
    g.restore();
  }
});

test("un timeout rend error (la recherche ne reste pas suspendue à IGN)", async () => {
  // Le faux fetch honore le signal d'annulation, comme le vrai : c'est le timeout du limiteur qui doit
  // couper, pas le serveur qui doit finir par répondre.
  const vrai = globalThis.fetch;
  globalThis.fetch = ((_url: string, init?: RequestInit) =>
    new Promise((_resolve, reject) => {
      const t = setTimeout(() => reject(new Error("jamais atteint")), 500);
      init?.signal?.addEventListener("abort", () => {
        clearTimeout(t);
        reject(new DOMException("aborted", "AbortError"));
      });
    })) as typeof fetch;
  try {
    const r = await ignFetch("https://x/1", 30);
    assert.equal(r.ok, false);
    if (r.ok) return;
    assert.equal(r.reason, "error");
  } finally {
    globalThis.fetch = vrai;
  }
});
