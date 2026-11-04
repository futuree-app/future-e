// FUT-137 · CE QUE RACONTENT LES CARTES APRÈS LE RATTACHEMENT DES ASSOCIATIONS DU RNA.
//
// Le correctif ne change que des données (les associations rangées sous des codes de communes disparus sont
// comptées dans la commune actuelle). Ces tests lisent, sur l'index publié et avec le vrai moteur, ce que le
// lecteur voit : le palier de la comparaison, l'identité, la raison favorable, la catégorie « vie locale
// faible » et la position du dossier. « La carte apparaît » et « la carte dit vrai » sont vérifiés séparément :
// chaque sortie est rapprochée de la note publiée, pour toutes les communes, pas seulement des cas choisis.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

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

type M = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
let V: M;
let MAP: M;
let ALIGN: M;
let PROJET: M;
let COMMUNES: M[];
let PAR: Map<string, M>;
before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  V = await import("./comparateur-vie.ts");
  MAP = await import("./decision/module-facts-map.ts");
  ALIGN = await import("./decision/alignment-rules.ts");
  PROJET = await import("./user-project.ts");
  await V.getCommuneEntry("17300"); // charge l'index du moteur et le cache des unités urbaines
  COMMUNES = JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8")).communes;
  PAR = new Map(COMMUNES.map((c) => [c.insee, c]));
});
const c = (insee: string) => PAR.get(insee)!;

const VIVANTE = "Pour une petite ville qui reste vraiment vivante.";
const MONTAGNE = "Pour vivre en montagne dans une commune qui reste animée.";

test("palier de la comparaison : il suit la note publiée (Gennes-Val-de-Loire et La Hague passent à « animée »)", () => {
  // 49261 : 307 associations rangées sous Gennes et Saint-Martin-de-la-Place (note 64 -> 81) ;
  // 50041 : 260 sous dix-huit anciennes communes de La Hague (57 -> 69) ; 01036 Valromey-sur-Séran (79 -> 86).
  const trio = ["49261", "50041", "01036"];
  const picks = trio.map((k) => ({ insee: k, nom: c(k).nom, dept: c(k).dept }));
  const cc = V.buildComparaisonComplete(picks, new Map(trio.map((k) => [k, c(k)])));
  const ligne = cc.themes.flatMap((t: M) => t.lignes).find((l: M) => l.id === "vie_locale");
  assert.deepEqual(ligne.cellules.map((x: M) => [x.insee, x.palier]), [
    ["49261", "Vie locale animée"], ["50041", "Vie locale animée"], ["01036", "Vie locale animée"],
  ]);
  assert.deepEqual(trio.map((k) => c(k).vieLocale.score), [81, 69, 86]);
});

test("identité : La Hague devient « une petite ville qui reste vraiment vivante » (69), et la règle tient partout", () => {
  assert.ok(V.buildIdentiteCandidates(c("50041")).includes(VIVANTE));
  // Pour chaque commune : une identité « vie locale » n'est jamais portée sous 60 (ni sans note).
  const ecarts = COMMUNES.filter((x) => {
    const ids = V.buildIdentiteCandidates(x);
    return (ids.includes(VIVANTE) || ids.includes(MONTAGNE)) && !((V.subScore("vie_locale", x) ?? 0) >= 60);
  }).map((x) => `${x.insee} ${x.nom}`);
  assert.deepEqual(ecarts, []);
});

test("catégorie « vie locale faible » : Gouffern en Auge en sort (24 -> 34), et aucune commune notée au-dessus de 30 ne la porte", () => {
  assert.equal(c("61474").vieLocale.score, 34);
  assert.equal(V.deriveCategoriesFromEntry(c("61474")).includes("faible_vie_locale"), false);
  const ecarts = COMMUNES.filter((x) => V.deriveCategoriesFromEntry(x).includes("faible_vie_locale") && !(x.vieLocale && x.vieLocale.score <= 30));
  assert.deepEqual(ecarts.map((x) => x.insee), []);
});

test("raison favorable : une priorité « vie locale » déclarée devient une raison dès la note 55, jamais en dessous", () => {
  // Binic-Étables-sur-Mer : 141 associations rangées sous l'ancien code de Binic (49 -> 60).
  const binic = c("22055");
  assert.equal(binic.vieLocale.score, 60);
  const prefs = [{ key: "vie_locale", weight: 3 }];
  const subs = V.scorePreferences(binic, prefs).subs;
  assert.equal(subs.find((x: M) => x.key === "vie_locale").s, 60);
  assert.ok(60 >= V.SEUIL_RAISON);
  // Le texte de la raison est celui du critère, pas un texte figé ailleurs.
  assert.equal(V.reasonText("vie_locale", binic), "vie locale animée (commerces, marchés, associations)");
});

test("dossier : La Hague, priorité « vie locale », passe dans les communes les plus animées, sous la nouvelle identité de distribution", () => {
  const p = PROJET.normalizeUserProject({
    posture: "recherche", intent: null, rawText: "…", updatedAt: "2026-11-04T00:00:00.000Z",
    parsed: { reformulation: "x", hardConstraints: {}, preferences: [{ key: "vie_locale", weight: 3 }] },
  });
  const entree = c("50041");
  const faits = MAP.mapCommuneToModuleFacts(entree, {}, { hasAddress: false, tailleVille: entree.population ?? null, tailleVilleSource: "commune" });
  const regle = ALIGN.ALIGNMENT_RULES.find((r: M) => r.id === ALIGN.alignmentRuleId("vie_locale"));
  const ev = regle.evaluate(faits, p);
  assert.equal(ev.outcome, "satisfied");
  assert.equal(ev.facts[0].basis.distributionVersion, "mismatch-dist-2026-11-04-vie_locale");
  assert.deepEqual([ev.facts[0].basis.rankLow, ev.facts[0].basis.rankHigh], [entree.rankBands.vie_locale[0] / 10000, entree.rankBands.vie_locale[1] / 10000]);
});
