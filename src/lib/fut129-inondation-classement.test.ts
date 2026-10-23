import { test, before } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-129 : L'INONDATION DANS LE CLASSEMENT DU COMPARATEUR, SUR L'INDEX ENTIER.
//
// Ce qui est vérifié ici, et que le porteur a demandé (23/10/2026) :
//   1. À préférences identiques, l'historique ONRN ne fait JAMAIS monter une commune par rapport à une
//      recherche où l'inondation est neutralisée (propriété vérifiée sur les 34 788 communes).
//   2. Une recherche SANS cette priorité a exactement le score d'avant (aucun autre critère ne bouge).
//   3. Seules les classes 5 ‰ et plus, avec un échantillon suffisant, font reculer ; le recul suit le
//      poids déclaré et reste modéré (jamais une exclusion).
//   4. Faible fréquence, aucun sinistre répertorié, échantillon trop partiel : trois états distincts, et
//      aucune phrase ne présente l'un d'eux comme un faible risque.
// Aucun réseau, aucun appel Anthropic.
// ════════════════════════════════════════════════════════════════════════════════════════════

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
let H: M;
let COMMUNES: M[];

before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  V = await import("./comparateur-vie.ts");
  H = await import("./comparateur/inondation-historique.ts");
  COMMUNES = JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8")).communes;
});

const BASE = [{ key: "eviter_isolement", weight: 0.5, baseline: true }, { key: "viabilite_emploi", weight: 0.5, baseline: true }];
const PROFILS: Record<string, M[]> = {
  "inondation 3 + soins 2": [{ key: "faible_risque_inondation", weight: 3 }, { key: "acces_soins", weight: 2 }],
  "inondation 2 + nature 2 + étés frais 2": [{ key: "faible_risque_inondation", weight: 2 }, { key: "nature", weight: 2 }, { key: "faible_chaleur", weight: 2 }],
  "inondation 1 + vie locale 3 + train 2": [{ key: "faible_risque_inondation", weight: 1 }, { key: "vie_locale", weight: 3 }, { key: "acces_transports", weight: 2 }],
  "inondation 3 seule": [{ key: "faible_risque_inondation", weight: 3 }],
};
const sansInondation = (prefs: M[]) => prefs.filter((p) => p.key !== "faible_risque_inondation");
const commune = (insee: string) => COMMUNES.find((c) => c.insee === insee)!;

test("l'index porte l'historique ONRN pour presque toutes les communes, labels verbatim", () => {
  const avec = COMMUNES.filter((c) => c.historiqueInondation);
  assert.ok(avec.length >= 34700, `${avec.length}`);
  for (const c of avec) {
    assert.ok(H.CLASSES_FREQUENCE.includes(c.historiqueInondation.frequence), c.insee);
    assert.ok(H.CLASSES_REPRESENTATIVITE.includes(c.historiqueInondation.representativite), c.insee);
  }
});

test("trois situations distinctes, aucune présentée comme un faible risque", () => {
  const etats = new Map<string, number>();
  for (const c of COMMUNES) {
    const e = H.historiqueInondation(c.historiqueInondation).etat;
    etats.set(e, (etats.get(e) ?? 0) + 1);
  }
  // Les effectifs mesurés le 23/10/2026 (index courant, ONRN millésime 2025).
  assert.equal(etats.get("sinistres_frequents"), 1536);
  assert.ok((etats.get("aucun_sinistre") ?? 0) > 17000);
  assert.ok((etats.get("representativite_insuffisante") ?? 0) > 2500);
  assert.ok((etats.get("frequence_mesuree") ?? 0) > 10000);
  const exemples = [
    { frequence: "Entre 0 et 1 ‰", representativite: "> 50%" },
    { frequence: "Pas de sinistre ou de risque répertoriés à CCR", representativite: "Pas de sinistre répertorié à CCR" },
    { frequence: "Entre 0 et 1 ‰", representativite: "Pas de sinistre répertorié à CCR" },
    { frequence: "Entre 2 et 5 ‰", representativite: "< 15%" },
    { frequence: "Plus de 10 ‰", representativite: "Entre 15 et 30%" },
    { frequence: "Plus de 10 ‰", representativite: "Pas de sinistre répertorié à CCR" },
    null,
  ];
  const attendus = ["frequence_mesuree", "aucun_sinistre", "aucun_sinistre", "representativite_insuffisante", "representativite_insuffisante", "representativite_insuffisante", "indisponible"];
  exemples.forEach((x, i) => assert.equal(H.historiqueInondation(x).etat, attendus[i], JSON.stringify(x)));
  const phrases = new Set(exemples.map((x) => H.phraseHistorique(H.historiqueInondation(x))));
  assert.ok(phrases.size >= 4, "chaque situation a sa phrase");
  for (const x of exemples) {
    const h = H.historiqueInondation(x);
    const t = `${H.phraseHistorique(h)} ${H.limiteHistorique(h)}`;
    assert.doesNotMatch(t, /faible risque d'inondation|risque (?:d'inondation )?faible|peu exposée|à l'abri|sans risque/i, t);
    if (h.etat !== "indisponible") assert.match(H.phraseHistorique(h), /1995 à 2021/);
  }
  assert.match(H.PHRASE_TRANSPARENCE, /sinistres passés, pas la probabilité d'une inondation à venir/);
});

test("seules les classes 5 ‰ et plus, échantillon suffisant, font reculer ; le recul suit le poids", () => {
  const h = (frequence: string, representativite = "> 50%") => H.historiqueInondation({ frequence, representativite });
  for (const f of ["Entre 0 et 1 ‰", "Entre 1 et 2 ‰", "Entre 2 et 5 ‰"]) {
    assert.equal(H.reculInondation({ historique: h(f), poidsInondation: 3, poidsAutres: 3 }), 0, f);
  }
  assert.equal(H.reculInondation({ historique: h("Plus de 10 ‰", "Entre 15 et 30%"), poidsInondation: 3, poidsAutres: 3 }), 0);
  const r1 = H.reculInondation({ historique: h("Entre 5 et 10 ‰"), poidsInondation: 1, poidsAutres: 6 });
  const r3 = H.reculInondation({ historique: h("Entre 5 et 10 ‰"), poidsInondation: 3, poidsAutres: 3 });
  assert.ok(r1 > 0 && r3 > r1, `${r1} < ${r3}`);
  // Le même recul pour les deux classes : une convention de prudence, pas une échelle de danger.
  assert.equal(H.reculInondation({ historique: h("Plus de 10 ‰"), poidsInondation: 3, poidsAutres: 3 }), r3);
  assert.equal(H.reculInondation({ historique: h("Plus de 10 ‰"), poidsInondation: 0, poidsAutres: 3 }), 0);
  assert.equal(H.scoreAvecRecul(4, 10), 0, "jamais sous zéro");
});

test("PROPRIÉTÉ, index entier : avec l'historique ONRN, aucune commune ne monte par rapport à l'inondation neutralisée", () => {
  let reculees = 0;
  for (const [nom, prefs] of Object.entries(PROFILS)) {
    const avec = [...prefs, ...BASE];
    const sans = [...sansInondation(prefs), ...BASE];
    for (const c of COMMUNES) {
      const a = V.scorePreferences(c, avec);
      const n = V.scorePreferences(c, sans);
      assert.ok(a.base <= n.base + 1e-9, `${nom} · ${c.insee} : ${a.base} > ${n.base}`);
      assert.ok(Math.abs(a.reference - n.base) < 1e-9, `${nom} · ${c.insee} : la référence est le score neutralisé`);
      if (a.base < n.base) reculees++;
    }
  }
  assert.ok(reculees > 0, "le recul s'applique bien quelque part");
});

test("NON-RÉGRESSION, index entier : une recherche sans priorité inondation garde exactement son score d'avant", () => {
  const ancien = (c: M, prefs: M[]) => {
    const totalW = prefs.reduce((s, p) => s + p.weight, 0) || 1;
    return prefs.reduce((s, p) => { const v = V.subScore(p.key, c); return v == null ? s : s + p.weight * v; }, 0) / totalW;
  };
  for (const prefs of [
    [{ key: "acces_soins", weight: 2 }, { key: "nature", weight: 3 }],
    [{ key: "vie_locale", weight: 3 }, { key: "acces_transports", weight: 2 }, { key: "faible_chaleur", weight: 1 }],
  ]) {
    const p = [...prefs, ...BASE];
    for (const c of COMMUNES) assert.ok(Math.abs(V.scorePreferences(c, p).base - ancien(c, p)) < 1e-9, c.insee);
  }
});

test("le recul reste modéré : jamais une exclusion de fait", () => {
  // Poids 3 sur un projet de poids total 6 : 10 points sur 100 à l'intensité proposée (0,2).
  const charron = commune("17091");
  assert.equal(H.historiqueInondation(charron.historiqueInondation).etat, "sinistres_frequents");
  const prefs = [...PROFILS["inondation 3 + soins 2"]!, ...BASE];
  const r = V.scorePreferences(charron, prefs);
  assert.ok(Math.abs(r.recul - 10) < 1e-9, `${r.recul}`);
  // Le recul maximal, priorité seule au poids 3 sur les critères de base : 15 points.
  const seul = V.scorePreferences(charron, [...PROFILS["inondation 3 seule"]!, ...BASE]);
  assert.ok(seul.recul <= 15 + 1e-9, `${seul.recul}`);
});

test("Charron recule, La Rochelle et Grenoble non (aucune ne devient favorable)", () => {
  const prefs = [...PROFILS["inondation 3 + soins 2"]!, ...BASE];
  const neutre = [...sansInondation(PROFILS["inondation 3 + soins 2"]!), ...BASE];
  for (const [insee, recule] of [["17091", true], ["17300", false], ["38185", false], ["17094", false]] as [string, boolean][]) {
    const c = commune(insee);
    const a = V.scorePreferences(c, prefs).base;
    const n = V.scorePreferences(c, neutre).base;
    assert.equal(a < n, recule, `${insee} (${c.historiqueInondation?.frequence})`);
    assert.ok(a <= n, `${insee} ne monte jamais`);
  }
});
