import { test, before } from "node:test";
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
// comptent les appels et chronomètrent la lecture. Ce qu'ils ne mesurent pas : la latence réelle du
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

type Appel = { chemin: string; debut: number; fin: number };
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
      init?.signal?.addEventListener("abort", () => { clearTimeout(minuteur); ko(Object.assign(new Error("aborted"), { name: "AbortError" })); });
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

test("premier dossier : un seul appel de détail pour le plan, partagé entre le point et la parcelle", async () => {
  latence = () => 200;
  enPanne = () => false;
  const g = await moduleNeuf();
  const r = await lireAdresse(g, 46.2994, -1.1007, "17091000AB0123");
  // 4 appels au point + 4 à la parcelle (inchangés), + 1 détail : le même plan est lu aux deux grains.
  assert.equal(r.appels.length, 9, r.appels.map((a) => a.chemin).join(", "));
  assert.equal(compter(r.appels, "détail du plan"), 1);
  // Le détail part APRÈS la liste des plans : la lecture dure deux allers-retours au lieu d'un.
  const detail = r.appels.find((a) => a.chemin === "détail du plan")!;
  const liste = r.appels.find((a) => a.chemin === "/api/v2/gaspar/pprn (point)")!;
  assert.ok(detail.debut >= liste.fin - 5, "le détail attend la liste");
  assert.ok(r.duree >= 400 && r.duree < 600, `durée ${r.duree} ms pour une latence de 200 ms par appel`);
  assert.equal(r.parc.regulatoryPlans[0].approvedAt, "2021-08-10");
  console.log(`MESURE premier dossier : ${r.appels.length} appels, dont ${compter(r.appels, "détail du plan")} détail ; ${r.duree} ms (latence simulée 200 ms par appel)`);
});

test("dossier suivant dans la même commune (même process) : le détail vient du cache, aucun appel de plus", async () => {
  latence = () => 200;
  enPanne = () => false;
  const g = await moduleNeuf();
  await lireAdresse(g, 46.2994, -1.1007, "17091000AB0123");
  const r = await lireAdresse(g, 46.3001, -1.1012, "17091000AB0456");
  assert.equal(compter(r.appels, "détail du plan"), 0);
  assert.equal(r.appels.length, 8, "le même nombre d'appels qu'avant FUT-127");
  assert.ok(r.duree < 400, `durée ${r.duree} ms : un seul aller-retour`);
  assert.equal(r.point.regulatoryPlans[0].approvedAt, "2021-08-10");
  console.log(`MESURE dossier suivant (cache chaud) : ${r.appels.length} appels, 0 détail ; ${r.duree} ms`);
});

test("même adresse relue (actualisation, second rendu) : aucun appel, tout vient du cache du process", async () => {
  latence = () => 200;
  const g = await moduleNeuf();
  await lireAdresse(g, 46.2994, -1.1007, "17091000AB0123");
  const r = await lireAdresse(g, 46.2994, -1.1007, "17091000AB0123");
  assert.equal(r.appels.length, 0);
});

test("détail très lent : coupé à 3 s, la lecture tient dans le budget d'affichage de 10 s, aléas inconnus", async () => {
  latence = (c) => (c === "détail du plan" ? 9000 : 1500);
  enPanne = () => false;
  const g = await moduleNeuf();
  const r = await lireAdresse(g, 46.2994, -1.1007, "17091000AB0123");
  // 1,5 s de liste + 3 s de délai du détail, au lieu de 1,5 + 8 s avec le délai commun : au-delà de 10 s,
  // `fetchLogementDecisionDataWithTimeout` déclarait toute l'analyse du logement indisponible.
  assert.ok(r.duree >= 4400 && r.duree < 5200, `durée ${r.duree} ms`);
  // Le plan est lu sans aléas : la nature reste « inconnue » au pire, jamais « autre ».
  assert.equal(r.parc.regulatoryPlans[0].aleas, null);
  assert.equal(r.parc.regulatoryPlans[0].approvedAt, null);
  console.log(`MESURE détail lent (9 s simulées) : lecture rendue en ${r.duree} ms, aléas inconnus`);
});

test("détail en panne : aléas inconnus, et l'échec n'est pas mis en cache (le dossier suivant réessaie)", async () => {
  latence = () => 50;
  enPanne = (c) => c === "détail du plan";
  const g = await moduleNeuf();
  const r1 = await lireAdresse(g, 46.2994, -1.1007, "17091000AB0123");
  assert.equal(r1.point.regulatoryPlans[0].aleas, null);
  enPanne = () => false;
  const r2 = await lireAdresse(g, 46.3001, -1.1012, "17091000AB0456");
  assert.equal(compter(r2.appels, "détail du plan"), 1, "l'échec n'est pas retenu");
  assert.ok(r2.point.regulatoryPlans[0].aleas?.length);
});
