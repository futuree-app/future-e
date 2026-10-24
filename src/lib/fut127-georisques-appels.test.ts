import { test, before, beforeEach, type TestContext } from "node:test";
import { setImmediate as prochainTour } from "node:timers/promises";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";

// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-127 (passe du 23/10/2026) : CE QUE COÛTE LE DÉTAIL DES PLANS, MESURÉ SUR LE VRAI CODE.
//
// Le détail d'un plan (`/api/v2/gaspar/pprn/{id}`) donne ses aléas et sa date d'approbation. Il ne part
// qu'une fois la liste des plans reçue : c'est un appel EN SÉRIE, qui s'ajoute à la lecture de l'adresse.
// Ces tests font tourner `georisques.ts` tel quel, avec un `fetch` simulé qui sert les réponses
// Géorisques RÉELLES relevées le 22/10/2026 (`__fixtures__/fut127/`) après une latence choisie. Ils
// comptent les appels et pilotent une horloge simulée : aucune borne de temps murale ne dépend de la
// charge de la machine. Les délais de 3 s et 8 s viennent toujours du vrai code Géorisques. Ce qu'ils ne mesurent pas : la latence réelle du
// service (Géorisques ne répond qu'aux adresses IP françaises et refusait la connexion depuis le poste
// de mesure). Aucun réseau, aucun appel Anthropic.
// ════════════════════════════════════════════════════════════════════════════════════════════

const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  return next(spec, ctx);
}`;

type M = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const fixture = (nom: string): M => JSON.parse(readFileSync(`src/lib/__fixtures__/fut127/${nom}.json`, "utf8"));
const CHARRON = fixture("charron-num");
const DETAIL_CHARRON = fixture("pprn-detail-17DDTM20100006");

type Appel = { chemin: string; debut: number; fin: number; annulation?: number };
let appels: Appel[] = [];
let latence: (chemin: string) => number = () => 0;
let enPanne: (chemin: string) => boolean = () => false;

function corps(url: URL): unknown {
  const p = url.pathname;
  if (p === "/api/v2/gaspar/pprn") return url.searchParams.has("codesParcelle") ? CHARRON.v2_pprn_parcelle_formatApp.body : CHARRON.v2_pprn_point.body;
  if (p.startsWith("/api/v2/gaspar/pprn/")) return DETAIL_CHARRON;
  if (p === "/api/v2/rga") return url.searchParams.has("codesParcelle") ? CHARRON.v2_rga_parcelle_formatApp.body : CHARRON.v2_rga_point.body;
  if (p.startsWith("/api/v1/")) return { data: [] };
  return { content: [] };
}

/** Le chemin lisible d'un appel : le détail d'un plan se distingue de la liste. */
const nommer = (u: URL) => (u.pathname.startsWith("/api/v2/gaspar/pprn/") ? "détail du plan" : `${u.pathname}${u.searchParams.has("codesParcelle") ? " (parcelle)" : u.pathname.startsWith("/api/v2") ? " (point)" : ""}`);

let t0 = 0;
before(() => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  process.env.GEORISQUES_API_TOKEN = "jeton-de-test";
  globalThis.fetch = (async (input: string | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const chemin = nommer(url);
    const appel: Appel = { chemin, debut: Date.now() - t0, fin: -1 };
    appels.push(appel);
    await new Promise<void>((ok, ko) => {
      const minuteur = setTimeout(ok, latence(chemin));
      init?.signal?.addEventListener("abort", () => { appel.annulation = Date.now() - t0; clearTimeout(minuteur); ko(Object.assign(new Error("aborted"), { name: "AbortError" })); });
    });
    appel.fin = Date.now() - t0;
    if (enPanne(chemin)) return new Response("", { status: 503 });
    return new Response(JSON.stringify(corps(url)), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
});

/** Une instance neuve du module (caches vides), comme un process qui démarre. */
let instance = 0;
async function moduleNeuf(): Promise<M> {
  instance += 1;
  return import(`./georisques.ts?instance=${instance}`);
}

/** La lecture d'une adresse telle que `fetchLogementDecisionData` la fait : point et parcelle en parallèle. */
async function lireAdresse(g: M, lat: number, lon: number, parcelle: string) {
  appels = [];
  t0 = Date.now();
  const [point, parc] = await Promise.all([
    g.getGeorisquesAddressSummary(lat, lon, "17091").catch(() => null),
    g.getGeorisquesParcelSummary(parcelle).catch(() => null),
  ]);
  return { point, parc, duree: Date.now() - t0, appels: [...appels] };
}

const compter = (as: Appel[], chemin: string) => as.filter((a) => a.chemin === chemin).length;

// Les callbacks et Date avancent ensemble. Un tour réel vide les continuations de fetch/Response,
// sans dormir et sans imposer de budget CPU. Les mocks sont restaurés automatiquement par node:test.
beforeEach((t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: 0 });
  latence = () => 200;
  enPanne = () => false;
});
async function avancer(t: TestContext, ms: number) {
  t.mock.timers.tick(ms);
  await prochainTour();
}
async function deuxTours(t: TestContext, g: M, lat = 46.2994, lon = -1.1007, parcelle = "17091000AB0123", ms = 200) {
  const lecture = lireAdresse(g, lat, lon, parcelle);
  await avancer(t, ms);
  await avancer(t, ms);
  return lecture;
}
function paralleles(as: Appel[]) {
  assert.equal(as.length, 8, "quatre appels au point et quatre à la parcelle");
  assert.ok(as.every(a => a.debut === 0 && a.fin === -1), "tous démarrent avant la première réponse");
}

test("premier dossier : un seul appel de détail pour le plan, partagé entre le point et la parcelle", async (t) => {
  const g = await moduleNeuf();
  let terminee = false;
  const lecture = lireAdresse(g, 46.2994, -1.1007, "17091000AB0123").then(r => { terminee = true; return r; });
  paralleles(appels);
  await avancer(t, 199);
  assert.ok(appels.every(a => a.fin === -1));
  await avancer(t, 1);
  assert.equal(appels.length, 9);
  assert.equal(compter(appels, "détail du plan"), 1);
  const detail = appels.find(a => a.chemin === "détail du plan")!;
  const listes = appels.filter(a => a.chemin.startsWith("/api/v2/gaspar/pprn"));
  assert.equal(listes.length, 2);
  assert.ok(listes.every(a => a.fin === 200 && a.fin <= detail.debut), "le détail attend les listes point/parcelle");
  assert.equal(detail.debut, 200);
  assert.equal(detail.fin, -1);
  assert.equal(terminee, false, "les deux grains attendent le détail partagé");
  await avancer(t, 199);
  assert.equal(terminee, false);
  await avancer(t, 1);
  const r = await lecture;
  assert.equal(r.duree, 400, "deux tours de réseau virtuels, pas une mesure de performance réelle");
  assert.equal(r.point.regulatoryPlans[0].approvedAt, "2021-08-10");
  assert.equal(r.parc.regulatoryPlans[0].approvedAt, "2021-08-10");
  assert.deepEqual(r.point.regulatoryPlans[0].aleas, r.parc.regulatoryPlans[0].aleas);
  assert.ok(r.point.regulatoryPlans[0].aleas.length);
});

test("dossier suivant dans la même commune (même process) : le détail vient du cache, aucun appel de plus", async (t) => {
  const g = await moduleNeuf();
  await deuxTours(t, g);
  const lecture = lireAdresse(g, 46.3001, -1.1012, "17091000AB0456");
  paralleles(appels);
  await avancer(t, 200);
  const r = await lecture;
  assert.equal(compter(r.appels, "détail du plan"), 0);
  assert.equal(r.appels.length, 8);
  assert.equal(r.duree, 200, "un seul tour virtuel avec le détail en cache");
  assert.equal(r.point.regulatoryPlans[0].approvedAt, "2021-08-10");
});

test("même adresse relue (actualisation, second rendu) : aucun appel, tout vient du cache du process", async (t) => {
  const g = await moduleNeuf();
  await deuxTours(t, g);
  const r = await lireAdresse(g, 46.2994, -1.1007, "17091000AB0123");
  assert.equal(r.appels.length, 0);
});

test("détail très lent : coupé exactement à 3 s, aléas inconnus, sans épuiser le budget de 10 s", async (t) => {
  latence = c => c === "détail du plan" ? 9000 : 1500;
  const g = await moduleNeuf();
  let terminee = false;
  const lecture = lireAdresse(g, 46.2994, -1.1007, "17091000AB0123").then(r => { terminee = true; return r; });
  await avancer(t, 1500);
  const detail = appels.find(a => a.chemin === "détail du plan")!;
  assert.equal(detail.debut, 1500);
  await avancer(t, 2999);
  assert.equal(terminee, false, "pas de coupure anticipée");
  assert.equal(detail.annulation, undefined);
  await avancer(t, 1);
  const r = await lecture;
  assert.equal(detail.annulation, 4500, "le vrai délai du détail est 3 000 ms");
  assert.equal(r.duree, 4500);
  assert.equal(r.parc.regulatoryPlans[0].aleas, null);
  assert.equal(r.parc.regulatoryPlans[0].approvedAt, null);
});

test("les autres requêtes Géorisques gardent leur délai technique de 8 s", async (t) => {
  latence = () => 9000;
  const g = await moduleNeuf();
  let terminee = false;
  const lecture = lireAdresse(g, 46.2994, -1.1007, "17091000AB0123").then(r => { terminee = true; return r; });
  paralleles(appels);
  await avancer(t, 7999);
  assert.equal(terminee, false);
  assert.ok(appels.every(a => a.annulation === undefined));
  await avancer(t, 1);
  await lecture;
  assert.equal(appels.length, 8, "pas de détail sans liste exploitable");
  assert.ok(appels.every(a => a.annulation === 8000), "tous les vrais contrôleurs annulent à 8 000 ms");
});

test("détail en panne : aléas inconnus, et l'échec n'est pas mis en cache (le dossier suivant réessaie)", async (t) => {
  latence = () => 50;
  enPanne = c => c === "détail du plan";
  const g = await moduleNeuf();
  const r1 = await deuxTours(t, g, 46.2994, -1.1007, "17091000AB0123", 50);
  assert.equal(r1.point.regulatoryPlans[0].aleas, null);
  enPanne = () => false;
  const r2 = await deuxTours(t, g, 46.3001, -1.1012, "17091000AB0456", 50);
  assert.equal(compter(r2.appels, "détail du plan"), 1, "l'échec n'est pas retenu");
  assert.ok(r2.point.regulatoryPlans[0].aleas?.length);
});
