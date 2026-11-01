// FUT-163 · contre-revue de la PR #124 (01/11/2026) : LA VRAIE ROUTE `GET /api/ask/context`, et ses gardes.
//
// Le pré-chargement d'AskFuture déclenche désormais la lecture de l'eau potable (une à plusieurs dizaines
// d'appels Hub'Eau par commune). Il n'exigeait qu'une session : un compte connecté pouvait faire lire n'importe
// quelle commune, en boucle. Il applique maintenant les gardes de la question (`/api/ask`).
//
// Importée telle quelle, avec le vrai limiteur par adresse. Ne sont doublés que Supabase (session et profil),
// le contrat d'accès territorial et la collecte, qui compte ses appels. Aucun réseau, aucune base.
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

type Etat = { user: { id: string } | null; residence: string | null; ouverts: string[]; collectes: string[] };
const g = globalThis as unknown as { __fut163ctx: Etat };
g.__fut163ctx = { user: null, residence: null, ouverts: [], collectes: [] };

const MOCKS: Record<string, string> = {
  "server-only": "",
  "next/server": "export const NextResponse = { json: (b, i) => Response.json(b, i) };",
  "@/lib/supabase/server": `export const createClient = async () => {
    const e = globalThis.__fut163ctx;
    return {
      auth: { getUser: async () => ({ data: { user: e.user } }) },
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: e.user ? { home_insee_code: e.residence } : null }) }) }) }),
    };
  };`,
  "@/lib/active-territory": "export const canAccessTerritory = async (_s, _u, insee) => globalThis.__fut163ctx.ouverts.includes(insee);",
  "@/lib/commune-enrichment": `export const gatherCommuneEnrichment = async (insee, o) => {
    globalThis.__fut163ctx.collectes.push(insee + (o && o.avecEauPotable ? "+eau" : ""));
    return { ademe: null, drias: null, eau: null, eauPotable: { etat: "absent_dans_source", consulteLe: "x" } };
  };`,
};
const HOOKS = `
let ROOT, MOCKS;
export async function initialize(d) { ROOT = d.root; MOCKS = d.mocks; }
export async function resolve(s, c, next) {
  if (Object.hasOwn(MOCKS, s)) return { url: "fut163ctx-mock:" + s, shortCircuit: true };
  if (s.startsWith("@/")) {
    for (const ext of [".ts", ".tsx", "/index.ts", ""]) {
      try { return await next(ROOT + "src/" + s.slice(2) + ext, c); } catch {}
    }
  }
  return next(s, c);
}
export async function load(url, c, next) {
  if (url.startsWith("fut163ctx-mock:")) return { format: "module", source: MOCKS[url.slice(15)], shortCircuit: true };
  return next(url, c);
}`;
register("data:text/javascript," + encodeURIComponent(HOOKS), {
  data: { root: new URL("../../", import.meta.url).href, mocks: MOCKS },
});

const { GET } = (await import("../app/api/ask/context/route.ts")) as { GET: (r: Request) => Promise<Response> };
const { limiteParAdresse } = (await import("./server/garde-appels-modele.ts")) as { limiteParAdresse: (r: Request, p?: string) => Response | null };

let ip = 0;
/** Une adresse réseau neuve par appel, sauf demande contraire : le limiteur est testé à part. */
const appeler = (insee: string, adresse = `10.0.0.${++ip}`) =>
  GET(new Request(`https://futur-e.test/api/ask/context?insee=${encodeURIComponent(insee)}`, { headers: { "x-forwarded-for": adresse } }));

beforeEach(() => {
  g.__fut163ctx = { user: { id: "u1" }, residence: "16016", ouverts: ["13055"], collectes: [] };
});

test("sans session : 401, aucune lecture", async () => {
  g.__fut163ctx.user = null;
  assert.equal((await appeler("16016")).status, 401);
  assert.deepEqual(g.__fut163ctx.collectes, []);
});

test("une commune ni résidence ni ouverte sur le compte : 403, aucune lecture (ni eau potable, ni autre)", async () => {
  const r = await appeler("75056");
  assert.equal(r.status, 403);
  assert.deepEqual(g.__fut163ctx.collectes, []);
});

test("la résidence et un territoire ouvert sont pré-chargés, eau potable comprise", async () => {
  assert.equal((await appeler("16016")).status, 200);
  assert.equal((await appeler("13055")).status, 200);
  assert.deepEqual(g.__fut163ctx.collectes, ["16016+eau", "13055+eau"]);
});

test("un code INSEE mal formé : 400 avant toute session ou lecture", async () => {
  for (const code of ["", "1601", "160160", "abcde", "75056;x", "../16016"]) {
    const r = await appeler(code);
    assert.equal(r.status, 400, code);
  }
  assert.deepEqual(g.__fut163ctx.collectes, []);
  // La Corse garde ses codes alphanumériques, en majuscules ou non.
  g.__fut163ctx.ouverts = ["2A004"];
  assert.equal((await appeler("2a004")).status, 200);
  assert.deepEqual(g.__fut163ctx.collectes, ["2A004+eau"]);
});

test("une même adresse réseau qui insiste reçoit 429 avant toute lecture", async () => {
  const statuts: number[] = [];
  for (let i = 0; i < 8; i++) statuts.push((await appeler("16016", "10.9.9.9")).status);
  assert.deepEqual(statuts.slice(0, 5), [200, 200, 200, 200, 200]);
  assert.ok(statuts.slice(5).every((s) => s === 429), statuts.join(","));
  assert.equal(g.__fut163ctx.collectes.length, 5);
});

test("les compteurs du pré-chargement n'entament pas ceux des questions", async () => {
  for (let i = 0; i < 8; i++) await appeler("16016", "10.8.8.8");
  // La même adresse peut toujours poser sa question (compteurs sans portée, ceux de `/api/ask`).
  assert.equal(limiteParAdresse(new Request("https://futur-e.test/api/ask", { headers: { "x-forwarded-for": "10.8.8.8" } })), null);
});
