import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { register, createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { attendreTerritoire } from "./attendre-territoire.ts";

// Vraie route, vrai référentiel et vrai chargement/décision des droits.
// Seul le transport Supabase est simulé. Aucune clé ni requête réseau.
const root = new URL("../../../", import.meta.url).href;
const require = createRequire(new URL("package.json", root));
const nextServer = pathToFileURL(require.resolve("next/server")).href;
register("data:text/javascript," + encodeURIComponent(`
import { readFileSync } from "node:fs";
let root, nextServer;
export function initialize(d) { root = d.root; nextServer = d.nextServer; }
export async function resolve(s, c, next) {
  if (s === "server-only" || s === "@/lib/supabase/server" || s === "next/server") return { url: "fut120:" + s, shortCircuit: true };
  if (s.startsWith("@/")) s = root + "src/" + s.slice(2);
  if (!/\\.[cm]?[jt]sx?$|\\.json$/.test(s) && (s.startsWith(".") || s.startsWith("file:"))) {
    try { return await next(s + ".ts", c); } catch {}
  }
  return next(s, c);
}
export async function load(url, c, next) {
  if (url === "fut120:server-only") return { format: "module", source: "export {}", shortCircuit: true };
  if (url === "fut120:@/lib/supabase/server") return { format: "module", source: "export const createClient = async () => globalThis.__fut120.base;", shortCircuit: true };
  if (url === "fut120:next/server") return { format: "module", source: 'import m from ' + JSON.stringify(nextServer) + '; export const NextResponse = m.NextResponse;', shortCircuit: true };
  if (url.endsWith(".json")) return { format: "module", source: "export default " + readFileSync(new URL(url), "utf8"), shortCircuit: true };
  return next(url, c);
}`), { data: { root, nextServer } });

type Row = Record<string, unknown>;
const USER = "fut120-user";
let tables: Record<string, Row[]>;
let connected: boolean;
let failure: string | null;
let writeFailure: boolean;
let writes: number;
const base = {
  auth: { getUser: async () => ({ data: { user: connected ? { id: USER } : null } }) },
  from(table: string) {
    const filters: ((r: Row) => boolean)[] = [];
    let update: Row | undefined;
    const result = () => {
      if (table === failure || (update && writeFailure)) return { data: null, error: { message: "panne simulée" } };
      const rows = (tables[table] ?? []).filter((r) => filters.every((f) => f(r)));
      if (update) { writes++; rows.forEach((r) => Object.assign(r, update)); }
      return { data: structuredClone(rows), error: null };
    };
    const q = {
      select: () => q,
      eq: (k: string, v: unknown) => { filters.push((r) => r[k] === v); return q; },
      is: (k: string, v: unknown) => { filters.push((r) => (r[k] ?? null) === v); return q; },
      update: (r: Row) => { update = r; return q; },
      maybeSingle: async () => { const r = result(); return { ...r, data: r.data?.[0] ?? null }; },
      then: (f: (r: unknown) => unknown) => Promise.resolve(result()).then(f),
    };
    return q;
  },
};
(globalThis as Record<string, unknown>).__fut120 = { base };
const { POST } = await import("../../app/api/territoire/activer/route.ts");

beforeEach(() => {
  connected = true; failure = null; writeFailure = false; writes = 0;
  tables = {
    user_profiles: [{ user_id: USER, home_insee_code: "17300", home_commune: "La Rochelle", active_insee_code: "17300", active_commune: "La Rochelle", active_dossier_id: "bien-existant" }],
    report_grants: [], address_dossiers: [],
  };
});
const profile = () => tables.user_profiles![0]!;
const grant = (insee: string, user_id = USER) => tables.report_grants!.push({ insee, user_id });
async function activate(insee: unknown, extra = {}) {
  return POST(new Request("http://localhost/api/territoire/activer", {
    method: "POST", body: JSON.stringify({ insee, ...extra }),
  }) as never);
}
async function refused(insee: unknown, status: number, extra = {}) {
  const before = structuredClone(tables);
  assert.equal((await activate(insee, extra)).status, status);
  assert.equal(writes, 0);
  assert.deepEqual(tables, before, "aucune donnée modifiée en cas de refus");
}

test("sans session : 401 sans écriture, même avec un droit", async () => {
  grant("30189"); connected = false;
  await refused("30189", 401);
});
test("commune achetée : active le nom officiel sans déplacer la résidence", async () => {
  grant("30189");
  assert.equal((await activate("30189", { commune: "La Rochelle" })).status, 200);
  assert.deepEqual(profile(), { user_id: USER, home_insee_code: "17300", home_commune: "La Rochelle", active_insee_code: "30189", active_commune: "Nîmes", active_dossier_id: "bien-existant" });
  assert.equal(writes, 1);
});
test("résidence déclarée : accès partiel conservé ; après achat, exige le droit complet", async () => {
  await refused("17300", 403, { rapportComplet: true });
  assert.equal((await activate("17300")).status, 200);
});
test("commune valide non possédée : 403 malgré un autre achat et de faux paramètres Stripe", async () => {
  grant("17300"); grant("30189", "autre-utilisateur");
  await refused("30189", 403, { redirect_status: "succeeded", payment_intent: "pi_faux", success: true });
});
test("code inconnu, invalide ou outre-mer : 400 sans écriture", async () => {
  for (const insee of ["99999", "2C004", "97411", "", null, 30189]) await refused(insee, 400);
});
test("JSON mal formé : 400 sans écriture", async () => {
  assert.equal((await POST(new Request("http://localhost", { method: "POST", body: "{" }) as never)).status, 400);
  assert.equal(writes, 0);
});
test("Corse : casse normalisée et droits distincts entre Ajaccio et Bastia", async () => {
  grant("2A004"); await refused("2B033", 403);
  assert.equal((await activate("2a004")).status, 200);
  assert.equal(profile().active_insee_code, "2A004");
  assert.equal(profile().active_commune, "Ajaccio");
});
test("PLM : droits au grain commune dans les deux sens, codes locaux préservés", async () => {
  for (const [commune, local, autre] of [["75056", "75116", "75101"], ["69123", "69389", "69381"], ["13055", "13216", "13201"]]) {
    tables.report_grants = []; grant(local!);
    assert.equal((await activate(commune)).status, 200, commune);
    assert.equal(profile().active_insee_code, commune);
    tables.report_grants = []; grant(commune!);
    assert.equal((await activate(autre)).status, 200, autre);
    assert.equal(profile().active_insee_code, autre);
  }
});
test("résidence PLM : même grain que les rapports, sans accès complet implicite", async () => {
  profile().home_insee_code = "75116";
  await refused("75056", 403, { rapportComplet: true });
  assert.equal((await activate("75056")).status, 200);
  assert.equal(profile().active_insee_code, null, "retour au code local de résidence, sans overlay refusé par le rapport");
  assert.equal(profile().home_insee_code, "75116");
});
test("dossier accessible : droit territorial, dossier révoqué exclu, autre propriétaire exclu", async () => {
  tables.address_dossiers = [{ user_id: USER, insee: "30189", access_revoked_at: "2026-10-01", stripe_payment_intent_id: "pi_test" }, { user_id: "autre", insee: "30189", access_revoked_at: null }];
  await refused("30189", 403);
  tables.address_dossiers!.push({ user_id: USER, insee: "30189", access_revoked_at: null, stripe_payment_intent_id: null });
  assert.equal((await activate("30189")).status, 200, "un dossier administratif accessible donne aussi le territoire");
});
test("panne d'une des sources de droits ou du profil : 503 sans écriture", async () => {
  grant("30189");
  for (const table of ["report_grants", "address_dossiers", "user_profiles"]) { failure = table; await refused("30189", 503); }
});
test("profil absent ou échec d'enregistrement : aucune fausse réussite", async () => {
  tables.user_profiles = []; await refused("30189", 404);
  tables.user_profiles = [{ user_id: USER }]; grant("30189"); writeFailure = true;
  await refused("30189", 500);
});

const transport = (async (_url: unknown, init: RequestInit) => {
  const { insee, ...extra } = JSON.parse(init.body as string);
  return activate(insee, extra);
}) as typeof fetch;
test("paiement confirmé mais webhook retardé : attente sans écriture puis activation du droit attribué", async () => {
  let passages = 0;
  const result = await attendreTerritoire("30189", new AbortController().signal, transport, async () => {
    assert.equal(writes, 0); assert.equal(profile().active_insee_code, "17300");
    if (++passages === 2) grant("30189"); // livraison simulée du webhook
  });
  assert.equal(result, "ouvert"); assert.equal(passages, 2);
  assert.equal(writes, 1); assert.equal(profile().active_insee_code, "30189");
});
test("achat de la résidence : attendre le grant au lieu d'ouvrir le gratuit", async () => {
  const result = await attendreTerritoire("17300", new AbortController().signal, transport, async () => {
    assert.equal(writes, 0); grant("17300");
  });
  assert.equal(result, "ouvert"); assert.equal(writes, 1);
});
test("webhook absent : attente bornée, profil intact, nouvelle vérification possible", async () => {
  let pauses = 0;
  assert.equal(await attendreTerritoire("30189", new AbortController().signal, transport, async () => { pauses++; }), "attente");
  assert.equal(pauses, 14); assert.equal(writes, 0);
  grant("30189");
  assert.equal(await attendreTerritoire("30189", new AbortController().signal, transport), "ouvert");
});
test("attente : session expirée, erreur définitive et annulation n'ouvrent aucun rapport", async () => {
  connected = false;
  assert.equal(await attendreTerritoire("30189", new AbortController().signal, transport), "connexion");
  connected = true;
  assert.equal(await attendreTerritoire("99999", new AbortController().signal, transport), "erreur");
  const c = new AbortController(); c.abort();
  assert.equal(await attendreTerritoire("30189", c.signal, transport), "annule");
  assert.equal(writes, 0);
});
test("attente : une panne Supabase temporaire ne devient pas un refus définitif", async () => {
  grant("30189"); failure = "report_grants";
  assert.equal(await attendreTerritoire("30189", new AbortController().signal, transport, async () => {
    assert.equal(writes, 0); failure = null;
  }), "ouvert");
});
