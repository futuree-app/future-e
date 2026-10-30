// FUT-165 · L'état d'écoulement des cours d'eau est DEMANDÉ à la source, plus seulement lu.
//
// `loadDrought` demandait `fields=date_observation,libelle_observation,libelle_cours_eau` puis lisait
// `libelle_ecoulement`. Hub'Eau ne renvoie que les champs demandés : l'état n'arrivait jamais, `isDry` valait
// toujours faux, et la carte Territoire disait « Pas de cours d'eau à sec » (commune 16016 : « Assec » le
// 28/10/2026). Le test d'alors vérifiait la lecture d'une réponse fabriquée, jamais la requête. Ici, la VRAIE
// requête tourne contre un Hub'Eau simulé qui, comme le vrai, ne rend que les champs demandés.
import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { CHAMPS_ECOULEMENT, lireEcoulement } from "./eaufrance-ecoulement.ts";
import { buildTerritoireSnapshot, type TerritoireInputs } from "./territoire/facts.ts";
import { screenFromSnapshot } from "./territoire/screen.ts";
import { valueOf } from "./facts/contract.ts";

const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  return next(spec, ctx);
}`;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let EAU: any;
before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  EAU = await import(`${racine}src/lib/eaufrance.ts`);
});
const fetchReel = globalThis.fetch;
beforeEach(() => { globalThis.fetch = fetchReel; });

/** La ligne relevée pour 16016 (Hub'Eau, 30/10/2026). */
const LIGNE_16016 = { date_observation: "2026-10-28", libelle_ecoulement: "Assec", libelle_cours_eau: "le Mas" };

/** Un Hub'Eau qui, comme le vrai, ne renvoie que les champs listés dans `fields`. */
function hubeauQuiFiltre(lignes: Record<string, unknown>[]) {
  const vus: URL[] = [];
  globalThis.fetch = (async (input: string | URL) => {
    const url = new URL(String(input));
    vus.push(url);
    const champs = url.searchParams.get("fields")?.split(",") ?? Object.keys(lignes[0] ?? {});
    const data = lignes.map((l) => Object.fromEntries(Object.entries(l).filter(([k]) => champs.includes(k))));
    return Response.json({ count: data.length, data });
  }) as typeof fetch;
  return vus;
}

test("la requête demande le champ d'état que la lecture lit, et l'assec arrive jusqu'à `isDry`", async () => {
  const vus = hubeauQuiFiltre([LIGNE_16016]);
  const d = await EAU.loadDrought("16016");
  assert.equal(vus.length, 1);
  assert.equal(vus[0]!.pathname, "/api/v1/ecoulement/observations");
  assert.deepEqual(vus[0]!.searchParams.get("fields")!.split(","), [...CHAMPS_ECOULEMENT]);
  assert.ok(CHAMPS_ECOULEMENT.includes("libelle_ecoulement"));
  assert.deepEqual(d, { lastObservationDate: "2026-10-28", riverName: "le Mas", status: "Assec", isDry: true });
});

test("l'ancienne requête (sans `libelle_ecoulement`) aurait rendu un état vide : c'est la signature reconnue", () => {
  const ancienne = Object.fromEntries(Object.entries(LIGNE_16016).filter(([k]) => ["date_observation", "libelle_observation", "libelle_cours_eau"].includes(k)));
  assert.equal("libelle_ecoulement" in ancienne, false);
  assert.equal(lireEcoulement({ lastObservationDate: "2026-10-28", riverName: "le Mas", status: null, isDry: false }).etat, "non_verifiable");
});

test("les six valeurs réelles d'ONDE ont chacune leur phrase ; aucune ne dit « pas de cours d'eau à sec »", () => {
  const cas: [string, string][] = [
    ["Assec", "assec"], ["Ecoulement non visible", "ecoulement_interrompu"], ["Ecoulement visible", "ecoulement"],
    ["Ecoulement visible faible", "ecoulement"], ["Ecoulement visible acceptable", "ecoulement"], ["Observation impossible", "observation_impossible"],
  ];
  for (const [status, etat] of cas) {
    const l = lireEcoulement({ lastObservationDate: "2026-08-01", riverName: null, status, isDry: false });
    assert.equal(l.etat, etat, status);
    assert.doesNotMatch(l.texte, /pas de cours d'eau à sec/i);
  }
});

test("une panne de la source rend le fait `source_unavailable`, distinct de « aucune observation »", async () => {
  globalThis.fetch = (async () => new Response("panne", { status: 503 })) as typeof fetch;
  const r = await EAU.getEaufranceSummary("99999");
  assert.equal(r.drought, null);
  assert.equal(r.droughtIndisponible, true);

  const base = { drought: null } as unknown as TerritoireInputs;
  const entrees = (extra: Partial<TerritoireInputs>) => ({ ...MINIMAL, ...base, ...extra }) as TerritoireInputs;
  const enPanne = buildTerritoireSnapshot(entrees({ droughtIndisponible: true }), "2026-10-30T10:00:00Z");
  const sansStation = buildTerritoireSnapshot(entrees({}), "2026-10-30T10:00:00Z");
  assert.equal(enPanne.facts.find((f) => f.key === "water.river_drought")!.status, "source_unavailable");
  assert.equal(sansStation.facts.find((f) => f.key === "water.river_drought")!.status, "missing");
  assert.equal(screenFromSnapshot(enPanne).droughtIndisponible, true);
  assert.equal(screenFromSnapshot(sansStation).droughtIndisponible, false);
});

test("un relevé lu passe au relevé Territoire avec son état", () => {
  const d = { lastObservationDate: "2026-10-28", riverName: "le Mas", status: "Assec", isDry: true };
  const s = buildTerritoireSnapshot({ ...MINIMAL, drought: d } as TerritoireInputs, "2026-10-30T10:00:00Z");
  assert.deepEqual(valueOf(s, "water.river_drought"), d);
  assert.deepEqual(screenFromSnapshot(s).drought, d);
});

// Les entrées minimales d'un relevé Territoire : toutes les sources absentes.
const MINIMAL = {
  insee: "16016", communeName: "Commune test", entry: null, urbanRole: null, typology: { type: "rural", label: "Rural" },
  ademe: null, scenarios: null, georisques: null, catnat: null, catnatInondationIndex: null, vigieau: null, drought: null,
  littoral: null, era5: null, saisonnalitePct: null, distinctiveTrait: null,
};
