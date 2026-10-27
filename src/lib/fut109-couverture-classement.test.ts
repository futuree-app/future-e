// FUT-109 · LE CLASSEMENT SUR LES SEULS CRITÈRES MESURÉS, AVEC UNE COUVERTURE DITE (arbitrage du 24/10/2026).
//
// Un critère non mesuré ne pèse plus 0 : il sort du numérateur ET du dénominateur. Mais une commune dont une
// priorité déclarée n'est pas mesurée ne peut pas être promue : elle passe après toutes les communes dont les
// priorités le sont, ne reçoit pas de palier de correspondance, et sa carte dit ce qui n'est pas mesuré. Les
// scénarios demandés par le porteur, sur l'index réel et le vrai moteur, sans aucun appel Anthropic.
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
let COMMUNES: M[];
before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  V = await import("./comparateur-vie.ts");
  await V.getCommuneEntry("17300"); // charge l'index du moteur et le cache des unités urbaines (taille de ville)
  COMMUNES = JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8")).communes;
});
const BASE = [{ key: "eviter_isolement", weight: 0.5, baseline: true }, { key: "viabilite_emploi", weight: 0.5, baseline: true }];
const commune = (insee: string) => COMMUNES.find((c) => c.insee === insee)!;
const match = (departements: string[] | null, preferences: M[]) =>
  V.matchProjects({ reformulation: "FUT-109", hardConstraints: departements ? { departements } : {}, preferences });

test("vrai zéro et absence : un 0 mesuré compte, un null ne compte ni au numérateur ni au dénominateur", () => {
  const lr = commune("17300");
  const prefs = [{ key: "croissance_demographique", weight: 3 }, { key: "nature", weight: 1 }, ...BASE];
  const zero = V.scorePreferences({ ...lr, demographie: { ...lr.demographie, croissance: 0 } }, prefs);
  const absent = V.scorePreferences({ ...lr, demographie: null }, prefs);
  const autres = prefs.slice(1).map((p) => ({ ...p, v: V.subScore(p.key, lr) }));
  const w = autres.reduce((s, p) => s + p.weight, 0);
  const sansCroissance = autres.reduce((s, p) => s + p.weight * p.v, 0) / w;
  assert.ok(Math.abs(zero.reference - (w * sansCroissance) / (w + 3)) < 1e-9, "le 0 mesuré pèse de tout son poids");
  assert.equal(zero.couverture.etat, "complete");
  assert.ok(Math.abs(absent.reference - sansCroissance) < 1e-9, "l'absence ne pèse rien");
  assert.deepEqual(absent.couverture, { etat: "partielle", nonMesurees: ["croissance_demographique"] });
  // L'absence n'est pas promue au-dessus du vrai score : elle passe après, quel que soit son score.
  assert.ok(V.rangCouverture(absent.couverture.etat) > V.rangCouverture(zero.couverture.etat));
});

test("critères implicites non mesurés : ils ne comptent pas, et ne rendent pas la couverture incomplète", () => {
  const sd = commune("93066"); // Saint-Denis : soins non lus (fusion du 01/01/2025)
  const r = V.scorePreferences(sd, [{ key: "acces_soins", weight: 3 }, { key: "nature", weight: 1 }, ...BASE]);
  assert.deepEqual(r.couverture, { etat: "partielle", nonMesurees: ["acces_soins"] });
  assert.equal(r.subs.some((x: M) => x.key === "acces_soins"), false);
  // Les arrondissements ont désormais l'emploi de leur ville : plus d'implicite absent pour eux.
  for (const c of COMMUNES.filter((x) => /^(751\d\d|6938\d|132\d\d)$/.test(x.insee))) assert.notEqual(V.subScore("viabilite_emploi", c), null, c.insee);
});

test("1. toutes les priorités mesurées : palier possible, raisons et compromis sur elles seules", async () => {
  const o = await match(["17"], [{ key: "acces_soins", weight: 2 }, { key: "nature", weight: 3 }]);
  assert.ok(o.results.length > 0);
  for (const r of o.results) assert.deepEqual(r.couverture, { etat: "complete", nonMesurees: [] }, r.nom);
});

test("2. une priorité forte non mesurée : la commune passe après toutes les communes mesurées", async () => {
  const o = await match(["93"], [{ key: "acces_soins", weight: 3 }, { key: "nature", weight: 1 }]);
  const etats = o.results.map((r: M) => r.couverture.etat);
  assert.deepEqual(etats, [...etats].sort((a, b) => V.rangCouverture(a) - V.rangCouverture(b)));
  assert.equal(o.results.some((r: M) => r.insee === "93066"), false, "Saint-Denis n'est pas promue");
  assert.equal(etats[0], "complete");
});

test("3. une seule priorité mesurée sur deux : ni palier, ni raison ni compromis sur la priorité absente", async () => {
  // Paris : la densité des arrondissements n'est pas portée, le calme n'est pas mesuré ; la culture l'est.
  const o = await match(["75"], [{ key: "cadre_calme", weight: 3 }, { key: "acces_culture", weight: 2 }]);
  assert.ok(o.results.length > 0);
  for (const r of o.results) {
    assert.deepEqual(r.couverture, { etat: "partielle", nonMesurees: ["un cadre calme"] });
    assert.doesNotMatch([...r.reasons, r.tradeoff ?? ""].join(" "), /calme|bruit/i);
  }
  assert.equal(o.perfectMatch, false);
});

test("4. aucune priorité mesurée : la commune reste consultable, à explorer, sans rien affirmer", async () => {
  const o = await match(["75"], [{ key: "cadre_calme", weight: 3 }]);
  assert.ok(o.results.length > 0, "consultable");
  for (const r of o.results) {
    assert.equal(r.couverture.etat, "aucune");
    assert.deepEqual(r.reasons, []);
    assert.equal(r.tradeoff, null);
  }
  assert.equal(o.perfectMatch, false);
});

test("6. critères implicites seuls : aucune correspondance promise", async () => {
  const o = await match(["17"], []);
  assert.ok(o.results.length > 0);
  for (const r of o.results) {
    assert.equal(r.couverture.etat, "sans_priorite");
    assert.deepEqual(r.reasons, []);
  }
  assert.equal(o.perfectMatch, false, "les implicites seuls ne font pas une correspondance parfaite");
});

test("7. inondation seule : l'exploration est inchangée, sans palier", async () => {
  const o = await match(["17"], [{ key: "faible_risque_inondation", weight: 3 }]);
  assert.equal(o.inondation.exploration, true);
  assert.equal(o.perfectMatch, false);
});

test("8. inondation et soins : jamais favorable, même pour une commune à couverture partielle", async () => {
  const prefs = [{ key: "faible_risque_inondation", weight: 2 }, { key: "acces_soins", weight: 3 }, { key: "vie_locale", weight: 2 }, ...BASE];
  const sans = prefs.filter((p) => p.key !== "faible_risque_inondation");
  for (const c of COMMUNES) {
    const a = V.scorePreferences(c, prefs), n = V.scorePreferences(c, sans);
    assert.ok(a.base <= n.base + 1e-9, c.insee);
    assert.deepEqual(a.couverture, n.couverture, c.insee); // l'inondation n'entre pas dans la couverture
  }
  const o = await match(["93"], prefs.filter((p) => !p.baseline));
  assert.equal(o.inondation.exploration, false);
  for (const r of o.results) assert.equal(r.couverture.etat, "complete", r.nom);
});

test("classement national : aucune commune à couverture incomplète n'est proposée tant qu'une commune mesurée existe", async () => {
  for (const key of ["acces_soins", "cadre_calme", "air_sain", "faible_pression_agricole", "nature", "croissance_demographique", "vie_locale", "faible_dependance_auto"]) {
    const o = await match(null, [{ key, weight: 3 }, { key: "faible_chaleur", weight: 2 }]);
    assert.ok(o.results.length > 0, key);
    for (const r of o.results) assert.equal(r.couverture.etat, "complete", `${key} · ${r.nom}`);
  }
});

test("synthèse : les priorités non mesurées lui parviennent et ne peuvent pas devenir une correspondance", () => {
  const route = readFileSync("src/app/api/comparateur-vie/synthesize/route.ts", "utf8");
  assert.match(route, /priorites_non_mesurees/);
  assert.match(route, /non mesurées ici/);
  const client = readFileSync("src/app/(public)/ou-vivre/OuVivreClient.tsx", "utf8");
  assert.match(client, /prioritesNonMesurees: r\.couverture\?\.nonMesurees/);
  assert.match(client, /Priorités en partie mesurées/);
});

// ── L'ORDRE : CONDITIONS D'ABORD, COUVERTURE ENSUITE, SCORE ET DIVERSITÉ ENFIN (arbitrage du 24/10/2026) ──────
const cand = (insee: string, region: string, boundary: boolean, couvertureRang: number, sortScore: number) =>
  ({ boundary, couvertureRang, sortScore, pref: false, result: { insee, dept: insee.slice(0, 2), region } });

test("une commune confirmée à couverture partielle passe devant une commune à la limite à couverture complète", () => {
  const confirmeePartielle = cand("17300", "Nouvelle-Aquitaine", false, 1, 40);
  const limiteComplete = cand("33063", "Occitanie", true, 0, 95);
  // Tri : la condition prime sur la couverture et sur le score.
  assert.deepEqual([limiteComplete, confirmeePartielle].sort(V.ordreClassement).map((x) => x.result.insee), ["17300", "33063"]);
  // Étalement : la diversité régionale ne remonte pas la commune à la limite (autre région, meilleur score).
  const r = V.etalerParGroupes([confirmeePartielle, limiteComplete].sort(V.ordreClassement), { anyPreferred: false, target: 5, display: 3 });
  assert.deepEqual(r.map((x: M) => x.insee), ["17300", "33063"]);
});

test("à statut égal : couverture complète, puis partielle, puis aucune ; le score et la diversité ensuite", () => {
  const xs = [
    cand("13001", "PACA", false, 2, 99),          // aucune priorité mesurée, meilleur score
    cand("69123", "Auvergne-Rhône-Alpes", false, 1, 90),  // partielle, autre région
    cand("17300", "Nouvelle-Aquitaine", false, 0, 50),
    cand("17306", "Nouvelle-Aquitaine", false, 0, 49),    // complète, même région que la première
    cand("33063", "Nouvelle-Aquitaine", true, 0, 100),    // complète mais à la limite
  ].sort(V.ordreClassement);
  assert.deepEqual(xs.map((x) => x.result.insee), ["17300", "17306", "69123", "13001", "33063"]);
  // La diversité n'agit qu'À L'INTÉRIEUR d'un groupe : 69123 (autre région) ne passe pas devant 17306.
  const r = V.etalerParGroupes(xs, { anyPreferred: false, target: 5, display: 3 });
  assert.deepEqual(r.map((x: M) => x.insee), ["17300", "17306", "69123", "13001", "33063"]);
});

test("à statut et couverture égaux, l'étalement régional reste celui d'avant", () => {
  const xs = [cand("17300", "Nouvelle-Aquitaine", false, 0, 90), cand("17306", "Nouvelle-Aquitaine", false, 0, 80), cand("69123", "Auvergne-Rhône-Alpes", false, 0, 70)];
  assert.deepEqual(V.etalerParGroupes(xs, { anyPreferred: false, target: 5, display: 3 }).map((x: M) => x.insee), ["17300", "69123", "17306"]);
});

// ── LES PHRASES GÉNÉRALES NE PROMETTENT PAS PLUS QUE LES CARTES ──────────────────────────────────────────────
test("aucune priorité mesurée : la phrase générale dit l'exploration, jamais une correspondance ni un compromis", async () => {
  const o = await match(["75"], [{ key: "cadre_calme", weight: 3 }]);
  assert.equal(o.couverture, "aucune");
  assert.equal(o.message, V.MESSAGE_COUVERTURE.aucune);
  assert.doesNotMatch(o.message, /convien|correspond|répond|moins de compromis/i);
});

test("couverture partielle, sans priorité, complète : chaque cas a sa phrase", async () => {
  const p = await match(["75"], [{ key: "cadre_calme", weight: 3 }, { key: "acces_culture", weight: 2 }]);
  assert.equal(p.couverture, "partielle");
  assert.equal(p.message, V.MESSAGE_COUVERTURE.partielle);
  const s = await match(["17"], []);
  assert.equal(s.couverture, "sans_priorite");
  assert.equal(s.message, V.MESSAGE_COUVERTURE.sans_priorite);
  const c = await match(["17"], [{ key: "acces_soins", weight: 2 }, { key: "nature", weight: 3 }]);
  assert.equal(c.couverture, "complete");
  assert.ok(c.message === null || /moins de compromis/.test(c.message));
  for (const m of Object.values(V.MESSAGE_COUVERTURE) as string[]) assert.doesNotMatch(m, /convien|correspond|répond|moins de compromis/i);
});

test("la page et la synthèse suivent la couverture du résultat (sans appel Anthropic)", () => {
  const client = readFileSync("src/app/(public)/ou-vivre/OuVivreClient.tsx", "utf8");
  // L'en-tête « Les trois pourraient convenir » n'est atteint que pour une couverture complète (FUT-151 : et des
  // cartes qui ont toutes au moins une priorité favorable).
  assert.match(client, /\(\(outcome\?\.couverture && outcome\.couverture !== "complete"\) \|\| top\.some\(\(r\) => r\.sansPrioriteFavorable\)\) && outcome\?\.message \?/);
  assert.match(client, /couverture: outcomeMeta\.couverture \?\? "complete"/);
  assert.match(client, /couverture\.etat !== "complete" && couverture\.message\) return/);
  const route = readFileSync("src/app/api/comparateur-vie/synthesize/route.ts", "utf8");
  assert.match(route, /couverture_des_priorites:/);
  assert.match(route, /ne dites jamais qu'elles « correspondent », « répondent »/);
});
