// FUT-109 · CE QUE LE COMPARATEUR LIT POUR LES COMMUNES AU TERRITOIRE OU AU CODE MODIFIÉ, sur l'index réel.
//
// Les indicateurs qu'ADEME publie encore dans la géographie du 01/01/2024 (soins, air, pression agricole)
// ne sont pas lus pour une commune fusionnée depuis : son critère n'est pas noté (`null`), jamais 0 ni 100.
// Ceux qu'ADEME publie au COG 2025 (densité, donc le calme) restent. Une commune qui n'a changé que de code
// retrouve ses valeurs, rattachées depuis l'ancien code. Et une donnée absente ne choisit pas d'angle.
// Hook de résolution : même patron que `comparateur-demographie-causalite.test.ts`.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

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
before(() => { register(`data:text/javascript,${encodeURIComponent(hook)}`); });

type Commune = { insee: string; densite: number | null; vieLocale: unknown } & Record<string, unknown>;
type Moteur = { subScore: (k: string, c: Commune) => number | null; deriveCategoriesFromEntry: (c: Commune) => string[] };
const moteur = async () => (await import(`${racine}src/lib/comparateur-vie.ts`)) as Moteur;
const COMMUNES: Commune[] = JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8")).communes;
const commune = (insee: string) => COMMUNES.find((c) => c.insee === insee)!;
const referentiel = JSON.parse(readFileSync("data/population-referentiel-cog2025.json", "utf8")).communes as Record<string, unknown>;

test("Saint-Denis, fusionnée le 01/01/2025 : soins, air, pression agricole non notés ; calme gardé", async () => {
  const { subScore } = await moteur();
  const sd = commune("93066");
  assert.deepEqual(["acces_soins", "air_sain", "faible_pression_agricole"].map((k) => subScore(k, sd)), [null, null, null]);
  // Densité 2022 au périmètre fusionné (data/perimetre-ademe-cog2025.json) : le calme se lit.
  assert.equal(typeof subScore("cadre_calme", sd), "number");
  assert.equal(typeof subScore("acces_services", sd), "number");
});

test("Orée d'Anjou, simple changement de code : soins, démographie, voiture, pression agricole rattachés", async () => {
  const { subScore } = await moteur();
  const oa = commune("49126");
  for (const k of ["acces_soins", "air_sain", "faible_pression_agricole", "croissance_demographique", "faible_dependance_auto"]) {
    assert.equal(typeof subScore(k, oa), "number", k);
  }
  // Ni densité ni centralité publiées pour ce code : non notés, pas « aucun centre ».
  assert.equal(subScore("cadre_calme", oa), null);
  assert.equal(subScore("acces_services", oa), null);
});

test("vie locale : une commune rétablie n'est pas notée ; ailleurs, aucune vie locale mesurée reste 0", async () => {
  const { subScore } = await moteur();
  assert.equal(subScore("vie_locale", commune("85084")), null); // Essarts-en-Bocage
  assert.equal(subScore("vie_locale", commune("85165")), null); // L'Oie
  const sans = COMMUNES.find((c) => c.vieLocale == null && !(c.insee in referentiel))!;
  assert.equal(subScore("vie_locale", sans), 0);
});

test("typologie : une densité inconnue hors arrondissement ne fait ni un cœur urbain ni une commune rurale", async () => {
  const { deriveCategoriesFromEntry } = await moteur();
  const celles = commune("15031"); // rétablie le 01/01/2025, sans ligne ADEME
  assert.equal(celles.densite, null);
  const cats = deriveCategoriesFromEntry(celles);
  assert.equal(cats.some((x) => x.startsWith("urbain_dense") || x.startsWith("rural") || x === "faible_vie_locale"), false, cats.join(","));
  // Un arrondissement (densité non portée) reste un cœur urbain.
  assert.ok(deriveCategoriesFromEntry(commune("75111")).includes("urbain_dense_nord"));
});
