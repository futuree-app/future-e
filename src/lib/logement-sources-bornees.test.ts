import { test, before, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// FUT-13, LOT A : AUCUNE SOURCE DU MODULE LOGEMENT NE PEUT LE TENIR INDÉFINIMENT.
//
// Mesuré le 05/10/2026 : `/api/georisques-logement` enchaînait quatre étapes en série, et quatre de ses
// sources (audit, ZFE, données communales, Cartofriches) n'avaient aucun délai. Une seule réponse ADEME qui
// traîne tenait tout le module, jusqu'à environ deux minutes sur le Preview.
//
// Ces tests appellent les VRAIES fonctions des sources, avec un `fetch` bouchonné. Elles portent
// `server-only` et des alias `@/`, que `node --test` ne résout pas : un hook de résolution les fournit.

const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (spec.startsWith("@/")) return next(${JSON.stringify(racine)} + "src/" + spec.slice(2) + ".ts", ctx);
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\\.[cm]?[jt]s$|\\.json$/.test(spec)) {
    try { return await next(spec + ".ts", ctx); } catch { return next(spec, ctx); }
  }
  return next(spec, ctx);
}`;

const fetchOriginal = globalThis.fetch;
const timeoutOriginal = AbortSignal.timeout;
let urlsDemandees: string[] = [];

before(() => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
});
afterEach(() => {
  globalThis.fetch = fetchOriginal;
  AbortSignal.timeout = timeoutOriginal;
  urlsDemandees = [];
});

/** Une source qui ne répond jamais, mais qui respecte le signal d'abandon, comme le vrai `fetch`. */
function sourceMuette() {
  globalThis.fetch = ((url: string, init?: { signal?: AbortSignal }) => {
    urlsDemandees.push(String(url));
    return new Promise((_, rejeter) => {
      init?.signal?.addEventListener("abort", () => rejeter(init.signal!.reason));
    });
  }) as typeof fetch;
  // Le délai réel (8 s) raccourci à 30 ms : on vérifie qu'il EXISTE et qu'il est branché, pas sa durée.
  AbortSignal.timeout = ((_ms: number) => timeoutOriginal.call(AbortSignal, 30)) as typeof AbortSignal.timeout;
}

/** Une source qui répond, avec le statut et le corps voulus. */
function sourceRepond(status: number, corps: unknown) {
  globalThis.fetch = ((url: string) => {
    urlsDemandees.push(String(url));
    return Promise.resolve(new Response(JSON.stringify(corps), { status }));
  }) as typeof fetch;
}

async function rejetteVite(p: Promise<unknown>, nom: string) {
  const t0 = Date.now();
  await assert.rejects(p, undefined, `${nom} aurait dû abandonner`);
  assert.ok(Date.now() - t0 < 2_000, `${nom} a attendu ${Date.now() - t0} ms`);
}

// ── T4 : source lente ───────────────────────────────────────────────────────────────────────────────
// Délai PROPRE au test : une source qui aurait perdu le sien doit FAIRE ÉCHOUER le test, pas le figer.
test("T4 : chaque source autrefois sans délai abandonne au lieu d'attendre indéfiniment", { timeout: 5_000 }, async () => {
  const { getZfeForPoint } = await import("./zfe.ts");
  const { getAuditByBanId } = await import("./audit.ts");
  const { getCartofrichesNearPoint } = await import("./cartofriches.ts");
  const { getCommuneFullData } = await import("./commune-data.ts");

  sourceMuette();
  await rejetteVite(getZfeForPoint(48.86, 2.31), "ZFE");
  sourceMuette();
  await rejetteVite(getAuditByBanId("99999_test_00001"), "audit");
  sourceMuette();
  await rejetteVite(getCartofrichesNearPoint(48.86, 2.31, 1000), "Cartofriches");
  // Les données communales rattrapent déjà leurs erreurs : elles ne lèvent pas, elles rendent vite ce
  // qu'elles n'ont pas pu lire comme absent. L'essentiel est qu'elles ne restent plus pendues.
  sourceMuette();
  const t0 = Date.now();
  await getCommuneFullData("17300", { lat: 46.16, lon: -1.15 }).catch(() => null);
  assert.ok(Date.now() - t0 < 2_000, `données communales : ${Date.now() - t0} ms`);
});

test("T4 : la route rattrape chaque source, donc un abandon devient une absence, jamais une panne du module", () => {
  const route = readFileSync("src/app/api/georisques-logement/route.ts", "utf8");
  for (const appel of [
    "getZfeForPoint(address.latitude, address.longitude).catch(() => null)",
    "getAuditByBanId(address.id).catch(() => null)",
    "CARTOFRICHES_RAYON_RECHERCHE_M).catch(() => null)",
    "{ lat: address.latitude, lon: address.longitude }).catch(() => null)",
  ]) assert.ok(route.includes(appel), appel);
});

// ── T5 : source en erreur ───────────────────────────────────────────────────────────────────────────
test("T5 : une source qui répond 500 rend une absence, sans lever", async () => {
  const { getAuditByBanId } = await import("./audit.ts");
  const { getCartofrichesNearPoint } = await import("./cartofriches.ts");
  sourceRepond(500, { error: "boom" });
  assert.equal(await getAuditByBanId("99999_test_00001"), null);
  sourceRepond(500, { error: "boom" });
  const friches = await getCartofrichesNearPoint(48.86, 2.31, 1000);
  assert.equal(friches === null || typeof friches === "object", true);
});

// ── La route ne fait plus la somme de ses sources ───────────────────────────────────────────────────
test("Route : toutes les sources partent ensemble ; seules deux dépendances réelles restent chaînées", () => {
  const route = readFileSync("src/app/api/georisques-logement/route.ts", "utf8");
  const corps = route.slice(route.indexOf("async function buildReport"), route.indexOf("// Typé par le contrat partagé"));
  const code = corps.replace(/^\s*\/\/.*$/gm, "");
  // Un seul point d'attente : le Promise.all qui rassemble tout.
  assert.equal((code.match(/\bawait\b/g) ?? []).length, 1, "une seule attente dans buildReport");
  assert.match(code, /await Promise\.all\(\[Promise\.all\(\[/);
  // La parcelle précède Géorisques-parcelle ; l'audit exact précède le voisin. Rien d'autre n'attend.
  assert.match(code, /const georisquesParcelP = parcelP\.then\(/);
  assert.match(code, /const auditProcheP = auditExactP\.then\(/);
});

// ── ZFE : la source filtre au point ─────────────────────────────────────────────────────────────────
test("ZFE : la source ne renvoie que les zones qui contiennent le point, et le contrôle local demeure", async () => {
  const { getZfeForPoint } = await import("./zfe.ts");
  // Une zone renvoyée par la source mais qui NE contient PAS le point : le contrôle local l'écarte.
  const carreLoin = { type: "Polygon", coordinates: [[[10, 10], [10, 11], [11, 11], [11, 10], [10, 10]]] };
  const carreAutour = { type: "Polygon", coordinates: [[[2, 48], [2, 49], [3, 49], [3, 48], [2, 48]]] };
  sourceRepond(200, { results: [
    { id: "loin", nom: "Loin", _geoshape: carreLoin },
    { id: "ici", nom: "Ici", _geoshape: carreAutour },
  ] });
  const r = await getZfeForPoint(48.5, 2.5);
  assert.deepEqual(r.zones.map((z) => z.id), ["ici"]);
  assert.equal(r.inZfe, true);
  const u = new URL(urlsDemandees[0]);
  assert.equal(u.searchParams.get("geo_distance"), "2.5,48.5,0");
  // Plus de téléchargement de toutes les zones (2,29 Mo, trop gros pour le cache de données de Next).
  assert.doesNotMatch(readFileSync("src/lib/zfe.ts", "utf8"), /getAllZones|cachedZones/);
});
