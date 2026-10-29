// FUT-158 · L'INCIDENT GÉORISQUES DU 28/10/2026 : LES EN-TÊTES DE CHAQUE APPEL.
//
// Le fournisseur coupe la connexion (ECONNRESET) sur une partie des requêtes `fetch` de Node, et la laisse
// passer quand la requête porte `Accept-Encoding: identity` (matrice : docs/audits/2026-10-28-fut158-incident-
// georisques.md). Le double de `fetch` ci-dessous REPRODUIT cette règle : il coupe toute requête Géorisques sans
// cet en-tête. Si un appel du produit l'oublie, ce test le voit tomber, comme en production.
//
// Et quand Géorisques tombe vraiment : chaque lecture dit « indisponible », jamais « rien trouvé » ; la sonde
// passe en 503 dès que GASPAR tombe (elle restait verte le 28/10) ; les traces ne portent ni jeton ni
// coordonnées. Aucun réseau.
import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
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
let G: M, RADON: M, ACCUEIL: M, SONDE: M;
const JETON = "jeton-secret-de-test";
before(async () => {
  process.env.GEORISQUES_API_TOKEN = JETON;
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  G = await import("./georisques.ts");
  RADON = await import("./radon.ts");
  ACCUEIL = await import("./accueil/gaspar-accueil.ts");
  SONDE = await import("../app/api/sante/georisques/route.ts");
});

type Appel = { url: URL; entetes: Record<string, string> };
let appels: Appel[] = [];
let traces: string[] = [];
const errReel = console.error;
const fetchReel = globalThis.fetch;
beforeEach(() => {
  appels = [];
  traces = [];
  console.error = (...a: unknown[]) => { traces.push(a.map(String).join(" ")); };
  globalThis.fetch = fetchReel;
});

const entetesDe = (h: HeadersInit | undefined): Record<string, string> =>
  Object.fromEntries([...new Headers(h ?? {}).entries()].map(([k, v]) => [k.toLowerCase(), v]));

/** Les réponses minimales, lisibles par chaque lecture. */
function corps(u: URL): unknown {
  const p = u.pathname;
  if (p === "/api/v1/gaspar/risques") return { data: [{ libelle_commune: "METZ", risques_detail: [{ libelle_risque_long: "Inondation" }, { num_risque: "11", libelle_risque_long: "Inondation" }] }] };
  if (p === "/api/v1/zonage_sismique") return { data: [{ code_zone: "1", zone_sismicite: "1 - TRES FAIBLE" }] };
  if (p === "/api/v1/gaspar/catnat") return { results: 1, data: [{ date_debut_evt: "01/06/2016", libelle_risque_jo: "Inondations et/ou Coulées de Boue" }] };
  if (p === "/api/v1/cavites") return { data: [{ identifiant: "LORAW0009235", type: "ouvrage civil", longitude: 6.1757, latitude: 49.1193 }] };
  if (p === "/api/v1/mvt") return { data: [] };
  if (p === "/api/v1/radon") return { data: [{ classe_potentiel: "1" }] };
  if (p.startsWith("/api/v2/")) return { content: [], totalElements: 0 };
  return {};
}

/** Le fournisseur tel que mesuré le 28/10/2026 : sans `Accept-Encoding: identity`, la connexion est coupée. */
function geoRisquesDuJour(panne: (u: URL) => boolean = () => false) {
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const entetes = entetesDe(init?.headers);
    appels.push({ url, entetes });
    if (!/(^|\.)georisques\.gouv\.fr$/.test(url.hostname)) throw new Error(`hôte inattendu ${url.hostname}`);
    if (entetes["accept-encoding"] !== "identity" || panne(url)) {
      throw Object.assign(new TypeError("fetch failed"), { cause: { code: "ECONNRESET" } });
    }
    return Response.json(corps(url));
  }) as typeof fetch;
}

const METZ = { lat: 49.1193, lon: 6.1757, insee: "57463" };
const requeteSonde = (ip: string) => new Request("http://localhost/api/sante/georisques", { headers: { "x-forwarded-for": ip } });

// ════════════════════════════════════════════════════════════════════════════════════════════════
// 1 · Chaque appel du produit porte l'en-tête qui traverse le filtre
// ════════════════════════════════════════════════════════════════════════════════════════════════

test("1 · sous la règle du 28/10, toutes les lectures du dossier aboutissent (et l'auraient toutes perdue sans l'en-tête)", async () => {
  geoRisquesDuJour();
  const commune = await G.getGeorisquesSummary("57463");
  assert.deepEqual(commune.riskLabels, ["Inondation"]);
  const point = await G.getGeorisquesAddressSummary(METZ.lat, METZ.lon, METZ.insee);
  assert.equal(point.granularity, "point");
  const parcelle = await G.getGeorisquesParcelSummary("17091-000-AM-0006");
  assert.equal(parcelle.granularity, "parcel");
  assert.equal((await G.getGasparCatnatSummary("57463")).total, 1);
  assert.equal((await G.fetchCavitesNearPoint(METZ.lat, METZ.lon)).length, 1);
  assert.deepEqual(await G.fetchMvtNearPoint(METZ.lat, METZ.lon), []);
  assert.equal((await RADON.getRadonPotentiel("57463")).classe, "1");
  const accueil = await ACCUEIL.risquesGaspar("57463");
  assert.equal(accueil.panne, false);

  assert.ok(appels.length >= 12);
  for (const a of appels) {
    assert.equal(a.entetes["accept-encoding"], "identity", a.url.pathname);
    if (a.url.pathname.startsWith("/api/v2/")) assert.equal(a.entetes.authorization, `Bearer ${JETON}`);
    else assert.equal(a.entetes.authorization, undefined, "aucun jeton envoyé à la v1");
  }
  assert.deepEqual(traces, [], "aucune trace d'échec quand tout répond");
});

test("1 · aucun appel Géorisques du code de production ne contourne les en-têtes partagés", () => {
  // Chaque fichier qui appelle l'API Géorisques importe EN_TETES_GEORISQUES. Exclus : la page de démonstration
  // des liens (aucun appel), et le proxy SIS, remplacé par FUT-152 (#109).
  const fichiers: string[] = [];
  const parcourir = (d: string) => {
    for (const n of readdirSync(d)) {
      const p = path.join(d, n);
      if (statSync(p).isDirectory()) parcourir(p);
      else if (/\.(ts|tsx)$/.test(n) && !/\.test\.ts$/.test(n)) fichiers.push(p);
    }
  };
  parcourir("src");
  // Un appelant mentionne l'API hors commentaire ET appelle `fetch`.
  const code = (f: string) => readFileSync(f, "utf8").replace(/^\s*(\/\/|\*|\/\*).*$/gm, "");
  const appelants = fichiers.filter((f) => /georisques\.gouv\.fr\/api|GEORISQUES_(V2_)?BASE_URL\s*=/.test(code(f)) && /\bfetch\b/.test(code(f)));
  const exclus = new Set([path.join("src", "app", "api", "proxy", "sis", "route.ts")]);
  const sansEntetes = appelants.filter((f) => !exclus.has(f) && !readFileSync(f, "utf8").includes("EN_TETES_GEORISQUES"));
  assert.deepEqual(sansEntetes, []);
  assert.ok(appelants.length >= 4, `appelants trouvés : ${appelants.join(", ")}`);
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// 2 · Quand Géorisques tombe vraiment : indisponible, jamais « rien trouvé »
// ════════════════════════════════════════════════════════════════════════════════════════════════

test("2 · panne : les inventaires au point rendent `null` (indisponible), jamais une liste vide", async () => {
  geoRisquesDuJour(() => true);
  assert.equal(await G.fetchCavitesNearPoint(METZ.lat, METZ.lon), null);
  assert.equal(await G.fetchMvtNearPoint(METZ.lat, METZ.lon), null);
  assert.equal(await RADON.getRadonPotentiel("57463"), null);
  assert.equal((await ACCUEIL.risquesGaspar("57463")).panne, true);
  await assert.rejects(G.getGeorisquesAddressSummary(48.1, 2.1, "91000"), /fetch failed/);
  await assert.rejects(G.getGasparCatnatSummary("13055"), /fetch failed/);
});

test("2 · un échec n'est pas mémorisé : la lecture suivante retente et aboutit", async () => {
  geoRisquesDuJour(() => true);
  await assert.rejects(G.getGeorisquesSummary("69123"));
  geoRisquesDuJour();
  assert.deepEqual((await G.getGeorisquesSummary("69123")).riskLabels, ["Inondation"]);
});

test("2 · chaque échec laisse une trace lisible, sans jeton ni coordonnée ni paramètre", async () => {
  geoRisquesDuJour((u) => u.pathname === "/api/v2/rga");
  await assert.rejects(G.getGeorisquesParcelSummary("33063-000-AB-0001"));
  geoRisquesDuJour((u) => u.pathname === "/api/v1/gaspar/risques");
  await assert.rejects(G.getGeorisquesAddressSummary(43.2965, 5.3698, "13055"));
  const lignes = traces.map((t) => JSON.parse(t) as M);
  assert.ok(lignes.some((l) => l.evenement === "georisques_echec" && l.chemin === "/api/v2/rga" && l.erreur === "ECONNRESET"));
  assert.ok(lignes.some((l) => l.chemin === "/api/v1/gaspar/risques"));
  const brut = traces.join("\n");
  for (const interdit of [JETON, "Bearer", "43.2965", "5.3698", "33063-000-AB-0001", "latlon"]) assert.ok(!brut.includes(interdit), interdit);
});

test("2 · une réponse HTTP en erreur est tracée avec son statut", async () => {
  globalThis.fetch = (async (input: string | URL) => {
    appels.push({ url: new URL(String(input)), entetes: {} });
    return new Response("indisponible", { status: 503 });
  }) as typeof fetch;
  await assert.rejects(G.getGeorisquesSummary("31555"), /503/);
  assert.ok(traces.map((t) => JSON.parse(t) as M).some((l) => l.statut === 503 && l.erreur === null));
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// 3 · La sonde voit ce que voit le produit
// ════════════════════════════════════════════════════════════════════════════════════════════════

test("3 · la sonde passe en 503 quand GASPAR tombe seul (le 28/10, elle restait verte)", async () => {
  geoRisquesDuJour((u) => u.pathname === "/api/v1/gaspar/risques");
  const r = await SONDE.GET(requeteSonde("10.158.0.1"));
  assert.equal(r.status, 503);
  const j = (await r.json()) as M;
  assert.equal(j.interfaces.publique, "ok");
  assert.equal(j.interfaces.authentifiee, "ok");
  assert.notEqual(j.interfaces.risques, "ok");
  // Ses requêtes portent les en-têtes du produit, et le jeton seulement vers la v2.
  for (const a of appels) assert.equal(a.entetes["accept-encoding"], "identity");
});

test("3 · la sonde est verte quand les trois interfaces répondent", async () => {
  geoRisquesDuJour();
  const r = await SONDE.GET(requeteSonde("10.158.0.2"));
  assert.equal(r.status, 200);
  assert.deepEqual(((await r.json()) as M).interfaces, { publique: "ok", risques: "ok", authentifiee: "ok" });
  console.error = errReel;
});
