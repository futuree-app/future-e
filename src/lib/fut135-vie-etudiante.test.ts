// FUT-135 · UN VILLAGE SANS ÉTUDIANT N'EST PAS UNE VILLE ÉTUDIANTE.
//
// La part étudiante d'un bassin de moins de 5 000 habitants n'est pas mesurée (null), un vrai zéro reste un zéro
// rangé au bas de l'échelle, et `vie_etudiante` exige ses deux mesures : sans l'une d'elles, la priorité est non
// mesurée, signalée et jamais promue (FUT-109). Sur l'index réel et le vrai moteur, sans aucun appel Anthropic.
// Les règles de calcul de la part (abstention, rang moyen des ex æquo) : scripts/populate-etudiants.test.mjs.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const ts = createRequire(${JSON.stringify(racine)} + "package.json")("typescript");
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
  if (spec === "next/link") return next("next/link.js", ctx);
  return next(spec, ctx);
}
export async function load(url, ctx, next) {
  if (!url.endsWith(".tsx")) return next(url, ctx);
  const fichier = fileURLToPath(url);
  const { outputText } = ts.transpileModule(readFileSync(fichier, "utf8"), {
    fileName: fichier,
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return { format: "module", source: outputText, shortCircuit: true };
}`;

type M = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
let V: M;
let INDEX: { meta: M; communes: M[] };
before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  V = await import("./comparateur-vie.ts");
  await V.getCommuneEntry("17300"); // charge l'index du moteur et le cache des unités urbaines (taille de ville)
  INDEX = JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8"));
});
const commune = (insee: string) => INDEX.communes.find((c) => c.insee === insee)!;
// Le bassin de la part étudiante : l'unité urbaine, sinon la commune (scripts/populate-etudiants.py).
const bassin = (c: M) => (c.uu ? c.uu_pop : c.population) ?? null;
const vie = (c: M) => V.subScore("vie_etudiante", c);
const PALIER_FORTE = 66; // bandIndex
const SEUIL_RAISON = 55; // raisons favorables et identité « Pour une ville étudiante à taille humaine. »

test("bassin de moins de 5 000 habitants : non mesuré, même avec un accès connu", () => {
  for (const insee of ["54310", "26274"]) { // Leménil-Mitry (2 hab.), Rochefourchat (1 hab.)
    const c = commune(insee);
    assert.equal(c.etudes_dyn, null, c.nom);
    assert.notEqual(c.etudes_acces, null, `${c.nom} : l'accès existe, il ne suffit pas`);
    assert.equal(vie(c), null, c.nom);
  }
  const petits = INDEX.communes.filter((c) => bassin(c) != null && bassin(c) < 5000);
  assert.ok(petits.length > 29000);
  for (const c of petits) assert.equal(vie(c), null, `${c.insee} ${c.nom}`);
});

test("bassin mesuré sans étudiant : un vrai zéro, rangé au bas, jamais favorable", () => {
  const { vraiZero } = INDEX.meta.etudesDyn;
  assert.ok(vraiZero.communes > 1000);
  assert.ok(vraiZero.rang <= 15, `rang du plateau des zéros : ${vraiZero.rang}`);
  const zeros = INDEX.communes.filter((c) => c.etudes_dyn === vraiZero.rang);
  assert.ok(zeros.length >= vraiZero.communes);
  for (const c of zeros) {
    assert.ok(vie(c) < SEUIL_RAISON, `${c.insee} ${c.nom} : ${vie(c)}`);
    assert.ok(bassin(c) >= 5000, `${c.insee} : un zéro mesuré suppose un bassin mesuré`);
  }
});

test("données réellement absentes : ni part ni score", () => {
  const sansPopulation = INDEX.communes.filter((c) => c.population == null);
  assert.equal(sansPopulation.length, INDEX.meta.etudesDyn.nonMesurees.sansPopulation);
  for (const c of sansPopulation) {
    assert.equal(c.etudes_dyn, null, c.insee);
    assert.equal(vie(c), null, c.insee);
  }
  assert.equal(vie({ ...commune("86194"), etudes_acces: null, etudes_dyn: null }), null);
});

test("bassin étudiant significatif : forte présence étudiante", () => {
  for (const insee of ["2B096", "86194", "35238"]) { // Corte, Poitiers, Rennes
    const c = commune(insee);
    assert.ok(vie(c) >= PALIER_FORTE, `${c.nom} : ${vie(c)}`);
  }
});

test("ex æquo : une même part reçoit un même rang, et le plateau des zéros reste le plus bas", () => {
  // Les communes d'une même unité urbaine partagent la part de leur bassin, donc son rang.
  const parUU = new Map<string, Set<number | null>>();
  for (const c of INDEX.communes.filter((x) => x.uu)) parUU.set(c.uu, (parUU.get(c.uu) ?? new Set()).add(c.etudes_dyn));
  for (const [uu, rangs] of parUU) assert.equal(rangs.size, 1, `UU ${uu}`);
  const mesures = INDEX.communes.map((c) => c.etudes_dyn).filter((x) => x != null);
  assert.equal(Math.min(...mesures), INDEX.meta.etudesDyn.vraiZero.rang);
  assert.equal(mesures.length, INDEX.meta.etudesDyn.communesMesurees);
});

test("accès connu, dynamisme absent : non mesuré, l'accès seul ne qualifie pas", () => {
  assert.equal(vie({ ...commune("86194"), etudes_dyn: null }), null);
});

test("dynamisme connu, accès absent : non mesuré, le dynamisme ne prend pas tout le poids", () => {
  assert.equal(vie({ ...commune("86194"), etudes_acces: null }), null);
});

test("les deux mesures : 40 % accès, 60 % dynamisme", () => {
  assert.equal(vie({ ...commune("86194"), etudes_acces: 50, etudes_dyn: 20 }), 32);
});

test("index entier : aucun petit bassin ni bassin sans étudiant n'atteint une raison, un palier ou une identité", () => {
  const { vraiZero } = INDEX.meta.etudesDyn;
  const fautifs = INDEX.communes.filter((c) => (bassin(c) == null || bassin(c) < 5000 || c.etudes_dyn === vraiZero.rang)
    && (vie(c) ?? 0) >= SEUIL_RAISON);
  assert.deepEqual(fautifs.map((c) => c.insee), []);
});

test("une priorité non mesurée n'est pas promue : couverture dite, ni raison, ni identité, ni palier", async () => {
  const p = V.scorePreferences(commune("54310"), [{ key: "vie_etudiante", weight: 3 }, { key: "nature", weight: 1 }]);
  assert.deepEqual(p.couverture, { etat: "partielle", nonMesurees: ["vie_etudiante"] });
  assert.equal(p.subs.some((x: M) => x.key === "vie_etudiante"), false);

  // Lozère : trois communes mesurées (le bassin de Mende), toutes les autres non mesurées.
  const o = await V.matchProjects({ reformulation: "FUT-135", hardConstraints: { departements: ["48"] }, preferences: [{ key: "vie_etudiante", weight: 3 }] });
  assert.ok(o.results.length >= 3);
  const etats = o.results.map((r: M) => r.couverture.etat);
  assert.deepEqual(etats, [...etats].sort((a: string, b: string) => V.rangCouverture(a) - V.rangCouverture(b)));
  for (const r of o.results) {
    const c = commune(r.insee);
    if (vie(c) != null) continue;
    assert.equal(r.couverture.etat, "aucune", r.nom);
    assert.deepEqual(r.reasons, [], r.nom);
    assert.notEqual(r.identite, "Pour une ville étudiante à taille humaine.", r.nom);
    assert.doesNotMatch(r.decouverte ?? "", /étudiant/, r.nom);
  }
  const ligne = o.comparaisonComplete.themes.flatMap((t: M) => t.lignes).find((l: M) => l.id === "vie_etudiante");
  for (const cell of ligne.cellules) {
    if (vie(commune(cell.insee)) == null) assert.equal(cell.disponible, false, cell.insee);
  }
});

test("une ville de référence sans mesure ne transmet pas de trait « vie étudiante »", () => {
  const d = V.communeToPreferences(commune("54310"));
  assert.equal(d.preferences.some((p: M) => p.key === "vie_etudiante"), false);
});

test("comparaison complète : un petit bassin lit « Non mesurée » en vie étudiante, et la couverture le signale", async () => {
  // Leménil-Mitry et Rochefourchat (petits bassins) face à Nancy (mesurée).
  const r = await V.seedComparaison(["54395", "54310", "26274"]);
  const lignes = r.comparaison.themes.flatMap((t: M) => t.lignes);
  const etudiante = lignes.find((l: M) => l.id === "vie_etudiante");
  const par = Object.fromEntries(etudiante.cellules.map((x: M) => [x.insee, x]));
  for (const insee of ["54310", "26274"]) {
    assert.equal(par[insee].palier, "Non mesurée", insee);
    assert.equal(par[insee].disponible, false, insee);
  }
  assert.equal(par["54395"].disponible, true);
  assert.notEqual(par["54395"].palier, "Non mesurée");
  // Le libellé ne change que pour la vie étudiante : une autre case sans donnée garde le sien.
  for (const l of lignes.filter((x: M) => x.id !== "vie_etudiante")) {
    for (const cell of l.cellules) assert.notEqual(cell.palier, "Non mesurée", `${l.id} ${cell.insee}`);
  }

  // FUT-109 : la priorité déclarée reste signalée comme non mesurée sur la carte de ces communes.
  // Creuse : Guéret est mesurée, Aubusson et Felletin (petits bassins) suivent dans le même trio.
  const o = await V.matchProjects({ reformulation: "FUT-135", hardConstraints: { departements: ["23"] }, preferences: [{ key: "vie_etudiante", weight: 3 }, { key: "nature", weight: 2 }] });
  const trio = o.results.slice(0, 3);
  const nonMesurees = trio.filter((x: M) => vie(commune(x.insee)) == null);
  assert.ok(nonMesurees.length >= 1, "le trio de la Creuse compte une commune non mesurée");
  const cellules = o.comparaisonComplete.themes.flatMap((t: M) => t.lignes).find((l: M) => l.id === "vie_etudiante").cellules;
  for (const x of nonMesurees) {
    assert.deepEqual(x.couverture, { etat: "partielle", nonMesurees: ["une ville étudiante"] }, x.nom);
    assert.equal(cellules.find((cell: M) => cell.insee === x.insee).palier, "Non mesurée", x.nom);
  }
  const p = V.scorePreferences(commune("54310"), [{ key: "vie_etudiante", weight: 3 }, { key: "nature", weight: 2 }]);
  assert.deepEqual(p.couverture, { etat: "partielle", nonMesurees: ["vie_etudiante"] });
});
