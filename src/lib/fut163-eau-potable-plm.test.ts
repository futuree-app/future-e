// FUT-163 · contre-revue de la PR #124 (01/11/2026) : l'eau potable d'un ARRONDISSEMENT de Paris, Lyon, Marseille.
//
// Hub'Eau « Qualité de l'eau potable » ne publie qu'au code de la COMMUNE. Relevé du 01/11/2026 :
//   communes_udi 75056 → 4 réseaux, 75101 / 75115 → 0 ; 13055 → 16, 13201 / 13208 → 0 ; 69123 → 1, 69381 / 69387 → 0.
// La lecture recevait le code tel quel : un arrondissement donnait « la source ne publie aucun prélèvement pour
// cette commune » sur Paris 15e. Le Hub'Eau simulé ci-dessous reproduit ce comportement : il ne répond qu'aux
// codes de commune, et note chaque code interrogé.
import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { formatEauPotableBlock } from "./ask/system-prompt.ts";
import type { EauPotableCommune } from "./eau-potable.ts";

const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (spec.startsWith("@/")) return next(${JSON.stringify(racine)} + "src/" + spec.slice(2) + ".ts", ctx);
  return next(spec, ctx);
}`;
let getEauPotableCommune: (insee: string, maintenant?: Date) => Promise<EauPotableCommune>;
before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  ({ getEauPotableCommune } = await import(`${racine}src/lib/server/eau-potable.ts`));
});

const COMMUNES_PUBLIEES = new Set(["75056", "69123", "13055", "16016"]);
const fetchReel = globalThis.fetch;
let interroges: string[] = [];
beforeEach(() => {
  interroges = [];
  globalThis.fetch = (async (input: string | URL) => {
    const url = new URL(String(input));
    const code = url.searchParams.get("code_commune") ?? "";
    interroges.push(code);
    if (!COMMUNES_PUBLIEES.has(code)) return Response.json({ count: 0, data: [] });
    if (url.pathname.endsWith("/communes_udi")) {
      return Response.json({ count: 1, data: [{ code_reseau: `R${code}`, nom_reseau: `RÉSEAU ${code}`, nom_quartier: "du 1° au 13° arrondissement" }] });
    }
    return Response.json({ count: 1, data: [{ date_prelevement: "2026-10-20T08:00:00Z", conclusion_conformite_prelevement: "Eau conforme.", reseaux: [{ code: `R${code}` }] }] });
  }) as typeof fetch;
});
process.on("exit", () => { globalThis.fetch = fetchReel; });

const MAINTENANT = new Date("2026-11-01T10:00:00Z");

for (const [arr, ville, nom] of [["75115", "75056", "Paris"], ["13208", "13055", "Marseille"], ["69387", "69123", "Lyon"], ["75101", "75056", "Paris"]] as const) {
  test(`${arr} : la ville ${nom} est lue, jamais l'arrondissement, et la lecture le dit`, async () => {
    const lu = await getEauPotableCommune(arr, MAINTENANT);
    assert.ok(interroges.length > 0);
    assert.deepEqual([...new Set(interroges)], [ville], "seul le code de la commune est interrogé");
    // Le Hub'Eau simulé ne publie pas les champs des paramètres : la lecture est « partielle », jamais « absente ».
    assert.ok(lu.etat === "disponible" || lu.etat === "partiel", lu.etat);
    assert.equal(lu.etat !== "indisponible" && lu.villePLM, nom);
    const bloc = formatEauPotableBlock(lu);
    assert.match(bloc, new RegExp(`RÉSEAU ${ville}`));
    assert.match(bloc, new RegExp(`Lecture à l'échelle de la ville de ${nom} : la source ne publie pas l'eau potable par arrondissement`));
    assert.doesNotMatch(bloc, /ne publie aucun prélèvement/);
  });
}

test("une commune PLM demandée par son code de commune, ou une commune ordinaire : lue telle quelle, sans mention de ville", async () => {
  for (const code of ["75056", "16016"]) {
    interroges = [];
    const lu = await getEauPotableCommune(code, MAINTENANT);
    assert.deepEqual([...new Set(interroges)], [code]);
    assert.equal(lu.etat !== "indisponible" && lu.villePLM, undefined);
    assert.doesNotMatch(formatEauPotableBlock(lu), /échelle de la ville/);
  }
});

test("une commune sans publication reste « aucun prélèvement », sans être remontée à une autre", async () => {
  const lu = await getEauPotableCommune("01001", MAINTENANT);
  assert.deepEqual([...new Set(interroges)], ["01001"]);
  assert.equal(lu.etat, "absent_dans_source");
  assert.match(formatEauPotableBlock(lu), /ne publie aucun prélèvement/);
});

test("une panne pendant la lecture d'un arrondissement reste une panne, sans mention de ville", async () => {
  globalThis.fetch = (async () => new Response("panne", { status: 503 })) as typeof fetch;
  const lu = await getEauPotableCommune("75115", MAINTENANT);
  assert.deepEqual(lu, { etat: "indisponible" });
});
