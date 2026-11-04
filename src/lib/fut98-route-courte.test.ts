// FUT-98 : une commune n'est pas exclue sur une durée que le moteur IGN contredit lui-même.
//
// Valhalla minimise un coût interne, pas exactement la durée qu'il rend : pour les mêmes points, sa route
// « shortest » est parfois annoncée PLUS RAPIDE que sa route « fastest ». Constaté le 13/10/2026 (place de
// l'Europe -> gare de La Rochelle : 24,1 contre 22,7 min) et encore le 04/11/2026 sur le graphe du jour
// (Dompierre-sur-Mer -> gare : 18,47 contre 18,11 min). Cf. docs/audits/2026-11-04-fut98-temps-de-trajet-ign.md.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import {
  retenirDuree, routeCourteUtile, evaluateNearPlace, PRODUCT_CONVENTIONS_VERSION,
  type NormalizedHardConstraints, type EvaluationPoint, type TravelTimeEstimate,
} from "./hard-constraints.ts";
import type { ResolvedPlaceReference } from "./hard-constraints-resolve.ts";
import { routeRequestHash, type RouteRequest } from "./route-time.ts";

// Le comparateur importe « server-only » et des alias « @/ » : même chargeur que fut129-inondation-classement.
const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
async function premier(candidats, ctx, next) {
  for (const c of candidats.slice(0, -1)) { try { return await next(c, ctx); } catch {} }
  return next(candidats[candidats.length - 1], ctx);
}
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (spec.startsWith("@/")) {
    const b = ${JSON.stringify(racine)} + "src/" + spec.slice(2);
    return premier([b + ".ts", b + ".tsx", b], ctx, next);
  }
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\\.[cm]?[jt]sx?$|\\.json$/.test(spec)) {
    return premier([spec + ".ts", spec + ".tsx", spec], ctx, next);
  }
  return next(spec, ctx);
}`;
type Refine = (cs: never[], c: NormalizedHardConstraints) => Promise<Map<string, unknown>>;
type Estimate = (c: NormalizedHardConstraints, p: EvaluationPoint) => Promise<TravelTimeEstimate | null>;
let refineTravelTimes: Refine;
let estimateTravelTimeAt: Estimate;
before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  ({ refineTravelTimes } = (await import("./comparateur-vie.ts")) as unknown as { refineTravelTimes: Refine });
  ({ estimateTravelTimeAt } = (await import("./decision/territory-facts.ts")) as unknown as { estimateTravelTimeAt: Estimate });
});

const EUROPE = JSON.parse(
  readFileSync(new URL("./__fixtures__/route-europe-gare-larochelle.json", import.meta.url), "utf8"),
);
const BLAGNAC = JSON.parse(
  readFileSync(new URL("./__fixtures__/route-blagnac-matabiau.json", import.meta.url), "utf8"),
);

// ── 1. La règle, pure ────────────────────────────────────────────────────────────────────────────

test("retenirDuree : fastest dans la limite -> fastest, et aucune route courte demandée", () => {
  assert.deepEqual(retenirDuree(29.9, 30), { minutes: 29.9, route: "fastest", within: true });
  assert.equal(routeCourteUtile(29.9, 30), false);
});

test("retenirDuree : égalité exacte au seuil -> dans la limite (<= comme avant)", () => {
  assert.deepEqual(retenirDuree(30, 30), { minutes: 30, route: "fastest", within: true });
  assert.equal(routeCourteUtile(30, 30), false);
});

test("retenirDuree : juste au-dessus, mais le moteur connaît une route dans la limite -> conservée", () => {
  // Clavette (sonde du 23/10) : 24,3 en fastest, 23,9 en shortest, limite 24.
  assert.equal(routeCourteUtile(24.3, 24), true);
  assert.deepEqual(retenirDuree(24.3, 24, 23.9), { minutes: 23.9, route: "shortest", within: true });
});

test("retenirDuree : les deux au-delà -> au-delà, avec la meilleure durée trouvée", () => {
  // L'Houmeau (sonde du 23/10) : 26,1 / 25,1, limite 25.
  assert.deepEqual(retenirDuree(26.1, 25, 25.1), { minutes: 25.1, route: "shortest", within: false });
  // Route courte plus lente : fastest reste la durée dite.
  assert.deepEqual(retenirDuree(30.4, 30, 31), { minutes: 30.4, route: "fastest", within: false });
});

test("retenirDuree : route courte absente (panne) -> repli sur fastest, le verdict d'avant FUT-98", () => {
  assert.deepEqual(retenirDuree(30.4, 30, null), { minutes: 30.4, route: "fastest", within: false });
  assert.deepEqual(retenirDuree(30.4, 30), { minutes: 30.4, route: "fastest", within: false });
});

// ── 2. route-time : le hash, et donc le cache ────────────────────────────────────────────────────

const REQ: RouteRequest = {
  fromLat: 46.166611, fromLon: -1.179682, toLat: 46.1527, toLon: -1.14529,
  mode: "car", direction: "to_reference",
};

test("le hash « fastest » est STRICTEMENT celui d'avant FUT-98 : le cache existant reste valide", () => {
  const avant = createHash("sha256")
    .update(["46.166611", "-1.179682", "46.152700", "-1.145290", "car", "to_reference", "bdtopo-valhalla", "route-1"].join("|"))
    .digest("hex").slice(0, 32);
  assert.equal(routeRequestHash(REQ), avant);
  assert.equal(routeRequestHash({ ...REQ, optimization: "fastest" }), avant);
  assert.notEqual(routeRequestHash({ ...REQ, optimization: "shortest" }), avant);
});

// ── 3. Le comparateur (« Où vivre »), sur réponses IGN simulées ─────────────────────────────────────

type Rep = { status: number; body?: unknown };
// Répond selon l'optimisation demandée et le point de départ ; compte les appels par optimisation.
function fakeIgn(table: Record<string, { fastest: Rep; shortest?: Rep }>) {
  const vrai = globalThis.fetch;
  const appels = { fastest: 0, shortest: 0 };
  globalThis.fetch = (async (input: string | URL | Request) => {
    const u = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const opt = u.searchParams.get("optimization") as "fastest" | "shortest";
    appels[opt]++;
    const rep = table[u.searchParams.get("start")!]?.[opt];
    if (!rep) return new Response("", { status: 500 });
    return new Response(rep.body === undefined ? "" : JSON.stringify(rep.body), { status: rep.status });
  }) as typeof fetch;
  return { appels, restore: () => { globalThis.fetch = vrai; } };
}
const ok = (duration: number): Rep => ({ status: 200, body: { duration, timeUnit: "minute" } });

const GARE_LR = {
  status: "resolved", originalLabel: "la gare de La Rochelle", canonicalLabel: "Gare de La Rochelle",
  kind: "station", lat: 46.1527, lon: -1.14529, source: "geoplateforme_poi",
  sourceId: "BPE-gare-LR", confidence: "high",
  meta: { resolvedAt: "2026-11-04T00:00:00Z", resolver: "test", resolverVersion: "1" },
} as unknown as ResolvedPlaceReference;

function contraintes(maxMinutes: number): NormalizedHardConstraints {
  return {
    departements: null, zones: null, excludeZones: null, montagne: false, reliefProche: false,
    nearSea: null, excludeSea: false, communeSize: null, excludePlace: [], sizeRelativeTo: null,
    nearPlace: {
      label: "la gare de La Rochelle",
      threshold: { metric: "travel_time", maxMinutes, mode: "car", direction: "to_reference", source: "user" },
      reference: GARE_LR,
      reachability: null,
    },
  } as unknown as NormalizedHardConstraints;
}

// Chaque cas prend un point de départ PROPRE : le cache mémoire de route-time est partagé par le module.
let n = 0;
function lieu(nom: string) {
  n++;
  const lat = Number((46.0 + n * 0.0013).toFixed(6)), lon = Number((-1.3 + n * 0.0017).toFixed(6));
  return { insee: `T${n}`, c: { insee: `T${n}`, nom, lat, lon } as never, lat, lon, start: `${lon},${lat}` };
}

test("COMPARATEUR · cas réel Europe -> gare (réponses du 13/10), limite 24 min : conservée à 22,7 au lieu d'exclue", async () => {
  const eu = lieu("Europe");
  const f = fakeIgn({ [eu.start]: {
    fastest: { status: 200, body: EUROPE.fastest_2026_10_13 },
    shortest: { status: 200, body: EUROPE.shortest_2026_10_13 },
  } });
  try {
    const r = (await refineTravelTimes([eu.c], contraintes(24))).get(eu.insee) as { status: string; minutes?: number } | undefined;
    assert.equal(r?.status, "within");
    assert.ok(r?.minutes != null && Math.abs(r.minutes - 22.6975) < 0.001);
    // AVANT FUT-98, la même réponse fastest (24,09 > 24) suffisait à exclure la commune.
    assert.equal(retenirDuree(EUROPE.fastest_2026_10_13.duration, 24).within, false);
    assert.deepEqual(f.appels, { fastest: 1, shortest: 1 });
  } finally { f.restore(); }
});

test("COMPARATEUR · cas réel Europe -> gare, graphe du 04/11 : plus d'inversion, fastest suffit (un seul appel)", async () => {
  const eu = lieu("Europe 2");
  const f = fakeIgn({ [eu.start]: {
    fastest: { status: 200, body: EUROPE.fastest_2026_11_04 },
    shortest: { status: 200, body: EUROPE.shortest_2026_11_04 },
  } });
  try {
    const r = (await refineTravelTimes([eu.c], contraintes(20))).get(eu.insee) as { status: string; minutes?: number } | undefined;
    assert.equal(r?.status, "within");
    assert.ok(r?.minutes != null && Math.abs(r.minutes - 15.271) < 0.001);
    assert.deepEqual(f.appels, { fastest: 1, shortest: 0 });
  } finally { f.restore(); }
});

test("COMPARATEUR · trajet ordinaire (Blagnac -> Matabiau, réponse réelle) : inchangé, un seul appel", async () => {
  const b = lieu("Blagnac");
  const f = fakeIgn({ [b.start]: { fastest: { status: 200, body: BLAGNAC } } });
  try {
    const r = (await refineTravelTimes([b.c], contraintes(30))).get(b.insee) as { status: string; minutes?: number } | undefined;
    assert.equal(r?.status, "within");
    assert.ok(r?.minutes != null && Math.abs(r.minutes - 23.697) < 0.001);
    assert.deepEqual(f.appels, { fastest: 1, shortest: 0 });
  } finally { f.restore(); }
});

test("COMPARATEUR · estimation atypique juste au-dessus du seuil : la route courte tranche, dans les deux sens", async () => {
  const clavette = lieu("Clavette"); // 24,3 / 23,9, limite 24 -> conservée
  const rivedoux = lieu("Rivedoux"); // 31,8 / 43,1, limite 30 -> exclue, comme avant
  const f = fakeIgn({
    [clavette.start]: { fastest: ok(24.3), shortest: ok(23.9) },
    [rivedoux.start]: { fastest: ok(31.8), shortest: ok(43.1) },
  });
  try {
    const a = await refineTravelTimes([clavette.c], contraintes(24));
    assert.deepEqual(a.get(clavette.insee), { status: "within", minutes: 23.9 });
    const b = await refineTravelTimes([rivedoux.c], contraintes(30));
    assert.deepEqual(b.get(rivedoux.insee), { status: "over", minutes: 31.8 });
  } finally { f.restore(); }
});

test("COMPARATEUR · route courte en panne : repli sur le verdict fastest (comportement d'avant), aucune confirmation inventée", async () => {
  const x = lieu("Panne courte");
  const f = fakeIgn({ [x.start]: { fastest: ok(24.3), shortest: { status: 500 } } });
  try {
    const out = await refineTravelTimes([x.c], contraintes(24));
    assert.deepEqual(out.get(x.insee), { status: "over", minutes: 24.3 });
  } finally { f.restore(); }
});

test("COMPARATEUR · IGN indisponible ou réponse invalide : « unavailable », jamais une exclusion", async () => {
  const panne = lieu("Panne");
  const invalide = lieu("Invalide");
  const f = fakeIgn({
    [panne.start]: { fastest: { status: 503 } },
    [invalide.start]: { fastest: { status: 200, body: { duration: 1420, timeUnit: "second" } } },
  });
  try {
    const out = await refineTravelTimes([panne.c, invalide.c], contraintes(24));
    assert.deepEqual(out.get(panne.insee), { status: "unavailable" });
    assert.deepEqual(out.get(invalide.insee), { status: "unavailable" });
    assert.equal(f.appels.shortest, 0); // pas de route courte sans durée fastest
  } finally { f.restore(); }
});

// ── 4. Le dossier (Territoire / Adresse) : même règle, même phrase ────────────────────────────────

function point(lat: number, lon: number): EvaluationPoint {
  return { lat, lon, grain: "address", source: "ban", label: "l'adresse" } as unknown as EvaluationPoint;
}
const COMMUNE = {
  insee: "17109", nom: "Clavette", dept: "17", lat: 46.1444, lon: -1.0354,
  population: 1200, tailleVille: 1200, uu: null, altitude: 20, reliefProximite: 0,
  merCentreKm: 12, communeLittoraleMer: false,
} as never;

test("DOSSIER · Clavette 24,3 / 23,9, limite 24 : « satisfied », environ 24 minutes, preuve sur la route courte", async () => {
  const x = lieu("Dossier Clavette");
  const f = fakeIgn({ [x.start]: { fastest: ok(24.3), shortest: ok(23.9) } });
  try {
    const cs = contraintes(24);
    const pt = point(x.lat, x.lon);
    const est = await estimateTravelTimeAt(cs, pt);
    assert.equal(est?.status, "estimated");
    if (est?.status !== "estimated") return;
    assert.equal(est.minutes, 23.9);
    assert.equal(est.route, "shortest");
    assert.equal(est.requestHash, routeRequestHash({
      fromLat: x.lat, fromLon: x.lon, toLat: 46.1527, toLon: -1.14529, mode: "car",
      direction: "to_reference", optimization: "shortest",
    }));
    const a = evaluateNearPlace(
      { constraints: cs, point: pt, travelTime: est, conventionsVersion: PRODUCT_CONVENTIONS_VERSION },
      COMMUNE,
    );
    assert.equal(a.status, "satisfied");
    if (a.status === "satisfied") assert.equal(a.observedLabel, "environ 24 minutes en voiture");
  } finally { f.restore(); }
});

test("DOSSIER · L'Houmeau 26,1 / 25,1, limite 25 : « incompatible », et l'énoncé cite la meilleure durée", async () => {
  const x = lieu("Dossier Houmeau");
  const f = fakeIgn({ [x.start]: { fastest: ok(26.1), shortest: ok(25.1) } });
  try {
    const cs = contraintes(25);
    const pt = point(x.lat, x.lon);
    const est = await estimateTravelTimeAt(cs, pt);
    const a = evaluateNearPlace(
      { constraints: cs, point: pt, travelTime: est, conventionsVersion: PRODUCT_CONVENTIONS_VERSION },
      COMMUNE,
    );
    assert.equal(a.status, "incompatible");
    // 25,1 s'arrondirait à 25 = la limite : la décimale est montrée pour ne pas contredire le verdict.
    if (a.status === "incompatible") assert.match(a.statement ?? "", /environ 25,1 minutes en voiture/);
  } finally { f.restore(); }
});

test("DOSSIER · IGN en panne : « unavailable », et le noyau ne conclut pas sur un itinéraire absent", async () => {
  const x = lieu("Dossier panne");
  const f = fakeIgn({ [x.start]: { fastest: { status: 500 } } });
  try {
    const cs = contraintes(25);
    const pt = point(x.lat, x.lon);
    const est = await estimateTravelTimeAt(cs, pt);
    assert.deepEqual(est, { status: "unavailable" });
    const a = evaluateNearPlace(
      { constraints: cs, point: pt, travelTime: est, conventionsVersion: PRODUCT_CONVENTIONS_VERSION },
      COMMUNE,
    );
    assert.equal(a.status, "unexamined"); // ni compatible, ni incompatible
  } finally { f.restore(); }
});
