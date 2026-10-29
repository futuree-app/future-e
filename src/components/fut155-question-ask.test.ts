// FUT-155 · LA QUESTION ASKFUTURE : 1 000 CARACTÈRES AU PLUS, VISIBLES DÈS LA SAISIE, JAMAIS TRONQUÉS.
//
// L'écran rendu (mode choix, celui qui appelle /api/comparateur-vie/ask depuis les communes nommées) avec un `fetch`
// simulé : la limite se lit sous le champ, l'envoi est bloqué au-delà, et un refus de taille de la route (413 du corps
// entier, 400 de la question) rend la question intacte avec une phrase qui dit pourquoi. La page « Où vivre » branche
// les mêmes pièces (vérifié sur son code).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const React = require("react");
const { act, create } = require("react-test-renderer");
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const RACINE = process.cwd();
type Mod = { exports: Record<string, unknown> };
const cache = new Map<string, Mod>();

function charger(fichier: string): Record<string, unknown> {
  let f = path.resolve(fichier);
  if (!fs.existsSync(f)) for (const ext of [".ts", ".tsx", ".js"]) if (fs.existsSync(f + ext)) { f += ext; break; }
  const deja = cache.get(f);
  if (deja) return deja.exports;
  const m: Mod = { exports: {} };
  cache.set(f, m);
  const req = (spec: string): unknown => {
    if (spec === "react") return React;
    if (spec === "react/jsx-runtime") return require("react/jsx-runtime");
    if (spec === "posthog-js") return { default: { get_distinct_id: () => "fut155" } };
    if (spec.startsWith("@/")) return charger(path.join(RACINE, "src", spec.slice(2)));
    if (spec.startsWith(".")) return charger(path.join(path.dirname(f), spec));
    return require(spec);
  };
  const code = ts.transpileModule(fs.readFileSync(f, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: f })(req, m, m.exports);
  return m.exports;
}

const { ModeChoixAsk } = charger(`${RACINE}/src/app/(public)/comparateur/ModeChoixAsk.tsx`) as { ModeChoixAsk: (p: unknown) => unknown };
const { LigneQuestionAsk } = charger(`${RACINE}/src/components/LigneQuestionAsk.tsx`) as { LigneQuestionAsk: (p: unknown) => unknown };
const lecture = charger(`${RACINE}/src/lib/comparateur/lecture-ask.ts`) as {
  avisRefusAsk: (s: number, c?: unknown) => string | null; longueurQuestion: (q: string) => number; MAX_QUESTION_ASK: number;
};

type Noeud = { type: string; props: Record<string, unknown>; children: Array<Noeud | string> | null };
type Rendu = { root: { findAll: (p: (n: Noeud) => boolean) => Noeud[]; findByType: (t: string) => Noeud }; toJSON: () => unknown; unmount: () => void };
function texte(r: Rendu): string {
  const parties: string[] = [];
  const parcourir = (n: unknown) => {
    if (n == null) return;
    if (typeof n === "string") { parties.push(n); return; }
    if (Array.isArray(n)) { n.forEach(parcourir); return; }
    ((n as { children?: unknown[] }).children ?? []).forEach(parcourir);
  };
  parcourir(r.toJSON());
  return parties.join(" ").replace(/[  ]/g, " ").replace(/\s+/g, " ");
}

const TRIO = ["Quimper", "Vannes", "Lorient"].map((nom, i) => ({
  insee: `2900${i}`, nom, identite: "x", compromis: "y", distinctive: null, signaux: {}, logement: null, littoral: null, heritageIndustriel: null,
}));
let appels: { url: string; corps: Record<string, unknown> }[] = [];
function simulerFetch(reponse: { status: number; json?: unknown }) {
  appels = [];
  (globalThis as Record<string, unknown>).fetch = async (url: string, init: { body: string }) => {
    appels.push({ url, corps: JSON.parse(init.body) });
    return { status: reponse.status, ok: reponse.status < 300, json: async () => { if (reponse.json === undefined) throw new Error("pas de JSON"); return reponse.json; } };
  };
}
async function ecran(): Promise<Rendu> {
  let r!: Rendu;
  await act(async () => { r = create(React.createElement(ModeChoixAsk, { trio: TRIO })); });
  return r;
}
const champ = (r: Rendu) => r.root.findByType("textarea");
const demander = (r: Rendu) => r.root.findAll((n) => n.type === "button" && /Demander/.test(JSON.stringify(n.children))).at(-1)!;
async function saisir(r: Rendu, v: string) { await act(async () => { (champ(r).props.onChange as (e: unknown) => void)({ target: { value: v } }); }); }
async function envoyer(r: Rendu) { await act(async () => { (demander(r).props.onClick as () => void)(); }); }
const bulles = (r: Rendu) => r.root.findAll((n) => n.type === "div" && /self-end/.test(String(n.props.className ?? "")));

test("la limite : 1 000 caractères comptés comme le lecteur les voit, page et route", () => {
  assert.equal(lecture.MAX_QUESTION_ASK, 1000);
  assert.equal(lecture.longueurQuestion("😀".repeat(1000)), 1000, "un emoji compte pour un");
  assert.equal(lecture.longueurQuestion(`  ${"a".repeat(1000)}  `), 1000, "espaces de bord retirés");
  assert.equal(lecture.avisRefusAsk(200), null);
  assert.equal(lecture.avisRefusAsk(400, "autre"), null);
  assert.match(lecture.avisRefusAsk(413)!, /échanges précédents.*taille acceptée/);
  assert.match(lecture.avisRefusAsk(400, "question_trop_longue")!, /dépasse 1 000 caractères/);
  for (const p of [lecture.avisRefusAsk(413)!, lecture.avisRefusAsk(400, "question_trop_longue")!]) assert.doesNotMatch(p, /—|!/);
});

test("la ligne sous le champ : rien à vide, le compte dès la saisie, la consigne au-delà, l'avis s'il y en a un", async () => {
  const rendre = async (p: unknown) => { let r!: Rendu; await act(async () => { r = create(React.createElement(LigneQuestionAsk, p)); }); return r; };
  assert.equal((await rendre({ texte: "", avis: null })).toJSON(), null);
  assert.equal(texte(await rendre({ texte: "Et la chaleur ?", avis: null })), "15 / 1 000 caractères");
  assert.match(texte(await rendre({ texte: "a".repeat(1001), avis: null })), /^1 001 \/ 1 000 caractères : raccourcissez votre question/);
  assert.equal(texte(await rendre({ texte: "", avis: "Avis." })), "Avis.");
});

test("écran · au-delà de 1 000 caractères : envoi bloqué, rien ne part, rien n'est coupé", async () => {
  simulerFetch({ status: 200, json: { answer: "Réponse.", remaining: 1 } });
  const r = await ecran();
  const longue = "Une question longue ? ".repeat(46).slice(0, 1001);
  await saisir(r, longue);
  assert.equal(champ(r).props.value, longue, "le champ garde tout le texte");
  assert.equal(champ(r).props.maxLength, undefined, "aucune coupe silencieuse du navigateur");
  assert.equal(demander(r).props.disabled, true);
  assert.match(texte(r), /1 001 \/ 1 000 caractères : raccourcissez/);
  await envoyer(r);
  assert.equal(appels.length, 0);
  // À la limite exacte, l'envoi part, intact.
  await saisir(r, longue.slice(0, 1000));
  assert.equal(demander(r).props.disabled, false);
  await envoyer(r);
  assert.equal(appels.length, 1);
  assert.equal(appels[0].corps.question, longue.slice(0, 1000).trim());
  assert.match(texte(r), /Réponse\./);
});

test("écran · 413 (historique trop lourd) ou 400 question trop longue : la question revient intacte, l'avis dit pourquoi", async () => {
  for (const [rep, motif] of [
    [{ status: 413, json: { error: "Corps trop volumineux." } }, /échanges précédents/],
    [{ status: 413 }, /échanges précédents/], // un 413 de la plateforme, sans JSON
    [{ status: 400, json: { error: "x", code: "question_trop_longue" } }, /dépasse 1 000 caractères/],
  ] as const) {
    simulerFetch(rep);
    const r = await ecran();
    await saisir(r, "Laquelle est la plus exposée à la chaleur ?");
    await envoyer(r);
    assert.equal(appels.length, 1);
    assert.equal(champ(r).props.value, "Laquelle est la plus exposée à la chaleur ?");
    assert.equal(bulles(r).length, 0, "pas de question restée sans réponse dans le fil");
    assert.match(texte(r), motif);
    assert.doesNotMatch(texte(r), /n'a pas pu être générée/);
    // L'avis s'efface dès que le lecteur reprend sa question.
    await saisir(r, "Laquelle est la plus exposée ?");
    assert.doesNotMatch(texte(r), motif);
  }
});

test("écran · parcours normal et autres erreurs inchangés", async () => {
  simulerFetch({ status: 200, json: { answer: "Vannes semble moins exposée.", remaining: 1 } });
  let r = await ecran();
  await saisir(r, "Et la chaleur ?");
  await envoyer(r);
  assert.match(texte(r), /Vannes semble moins exposée\./);
  assert.equal(bulles(r).length, 1);
  simulerFetch({ status: 500, json: { error: "x" } });
  r = await ecran();
  await saisir(r, "Et la chaleur ?");
  await envoyer(r);
  assert.match(texte(r), /Cette réponse n'a pas pu être générée/);
});

test("page « Où vivre » : mêmes pièces branchées sur son champ", () => {
  const code = fs.readFileSync(`${RACINE}/src/app/(public)/ou-vivre/OuVivreClient.tsx`, "utf8");
  assert.match(code, /if \(longueurQuestion\(question\) > MAX_QUESTION_ASK\) return;/);
  assert.match(code, /const avis = avisRefusAsk\(res\.status, data\.code\);\s+if \(avis\) \{\s+setAskAvis\(avis\);\s+setAskMessages\(\(m\) => m\.slice\(0, -1\)\);\s+setAskInput\(question\);/);
  assert.match(code, /disabled=\{askLoading \|\| askInput\.trim\(\)\.length < 3 \|\| longueurQuestion\(askInput\) > MAX_QUESTION_ASK\}/);
  assert.match(code, /<LigneQuestionAsk texte=\{askInput\} avis=\{askAvis\} \/>/);
  assert.match(code, /onChange=\{\(e\) => \{ setAskInput\(e\.target\.value\); setAskAvis\(null\); \}\}/);
});
