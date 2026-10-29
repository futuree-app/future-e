// FUT-160 · LA COLLECTE COMMUNALE DIT QUELLES LECTURES GÉORISQUES ONT ÉCHOUÉ. Sans réseau : le double de
// `fetch` coupe Géorisques (comme le 28/10/2026) et répond 503 à toutes les autres sources.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
async function premier(candidats, ctx, next) {
  for (const c of candidats.slice(0, -1)) { try { return await next(c, ctx); } catch {} }
  return next(candidats[candidats.length - 1], ctx);
}
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (spec === "@supabase/supabase-js") return { url: "data:text/javascript," + encodeURIComponent("export function createClient(){ return {}; }"), shortCircuit: true };
  if (spec === "next/cache") return { url: "data:text/javascript," + encodeURIComponent("export const unstable_cache = (f) => f;"), shortCircuit: true };
  if (spec.startsWith("@/")) {
    const b = ${JSON.stringify(racine)} + "src/" + spec.slice(2);
    return premier([b + ".ts", b + ".tsx", b], ctx, next);
  }
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\\.[cm]?[jt]sx?$|\\.json$/.test(spec)) {
    return premier([spec + ".ts", spec + ".tsx", spec], ctx, next);
  }
  return next(spec, ctx);
}`;

type M = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
let E: M;
before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  E = await import("./commune-enrichment.ts");
});

function reseau(georisquesRepond: boolean) {
  console.error = () => {};
  console.warn = () => {};
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (/(^|\.)georisques\.gouv\.fr$/.test(url.hostname)) {
      if (!georisquesRepond) throw Object.assign(new TypeError("fetch failed"), { cause: { code: "ECONNRESET" } });
      if (url.pathname === "/api/v1/gaspar/catnat") return Response.json({ results: 0, data: [] });
      return Response.json({ data: [] });
    }
    return new Response("indisponible", { status: 503 });
  }) as typeof fetch;
}

test("Géorisques coupé : les deux lectures sont déclarées en panne, leurs valeurs restent `null`", async () => {
  reseau(false);
  const r = await E.gatherCommuneEnrichment("79191");
  assert.deepEqual(r.indisponibles, { georisques: true, catnat: true });
  assert.equal(r.georisques, null);
  assert.equal(r.catnat, null);
});

test("Géorisques rétabli, réponses vides : aucune panne, des résumés vides (absence valide)", async () => {
  reseau(true);
  const r = await E.gatherCommuneEnrichment("79191");
  assert.deepEqual(r.indisponibles, { georisques: false, catnat: false });
  assert.deepEqual(r.georisques?.riskLabels, []);
  assert.equal(r.catnat?.total, 0);
});
