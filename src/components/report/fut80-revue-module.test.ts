// FUT-80 · REVUE INDÉPENDANTE DU 26/10/2026 : LE VRAI `LogementModule` NE PROPOSE PLUS CE QUE LE BÂTIMENT
// OU UNE LISTE TRONQUÉE INTERDISENT.
//
// Sur `be86f4c7`, la décision ne recevait qu'une liste d'identifiants : à La Rochelle (27 rue des Brandes,
// trois bâtiments, une maison sans `id_rnb`), le module émettait un POST `auto_confirmed` pendant que le
// passeport disait « 3 bâtiments rattachés à cette adresse ». Même chose pour une liste ADEME tronquée.
//
// Même banc que `logement-module-synthese.test.ts` : le vrai composant sous React 19 et `react-test-renderer`,
// les composants de présentation doublés, toutes les requêtes interceptées. Les rapports sont construits à
// partir des réponses publiques relevées (`src/lib/__fixtures__/fut80/`), lues par les fonctions de production.
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
const presentations = new Map<string, unknown>();

// Un composant de présentation doublé rend ses enfants et GARDE SES PROPS : c'est par elles que le test
// retrouve les gestes du lecteur (`onPick`, `onNotInList`) offerts par la section Énergie.
function presentation(spec: string) {
  if (!presentations.has(spec)) {
    const Double = (props: { children?: unknown }) => React.createElement("double-presentation", null, props.children);
    presentations.set(spec, new Proxy({ __esModule: true, default: Double }, { get: (o: Record<string, unknown>, k: string) => (k in o ? o[k] : Double) }));
  }
  return presentations.get(spec);
}

function charger(fichier: string): Record<string, unknown> {
  let f = path.resolve(fichier);
  if (!fs.existsSync(f)) for (const ext of [".ts", ".tsx", ".js"]) if (fs.existsSync(f + ext)) { f += ext; break; }
  const deja = cache.get(f);
  if (deja) return deja.exports;
  const m: Mod = { exports: {} };
  cache.set(f, m);
  const req = (spec: string): unknown => {
    if (spec === "react") return React;
    if (spec === "server-only") return {}; // `toRecord` vit dans `dpe.ts`, lu ici sans réseau
    if (spec === "react/jsx-runtime") return require("react/jsx-runtime");
    if (spec === "posthog-js/react") return { usePostHog: () => null };
    if (spec === "next/link") return presentation(spec);
    if (spec.startsWith("@/components/") && spec !== "@/components/report/LogementSynthesis") return presentation(spec);
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

const LogementModule = charger(`${RACINE}/src/components/report/LogementModule.tsx`).default as (p: unknown) => unknown;
const { toRecord } = charger(`${RACINE}/src/lib/dpe.ts`) as { toRecord: (l: unknown) => Record<string, unknown> };
const { identiteDepuisRnb } = charger(`${RACINE}/src/lib/batiment-rnb.ts`) as { identiteDepuisRnb: (c: unknown, le: string) => unknown };

type Fixture = { ban: string; label: string; insee: string; rnb: { results: unknown[] }; ademe_adresse: unknown[] };
const fx = (nom: string): Fixture => JSON.parse(fs.readFileSync(path.join(RACINE, "src/lib/__fixtures__/fut80", `${nom}.json`), "utf8"));
const LE = "2026-10-26T12:00:00.000Z";

function rapport(f: Fixture, over: Record<string, unknown> = {}) {
  const candidats = f.ademe_adresse.map((l) => toRecord(l));
  return {
    address: { id: f.ban, label: f.label, city: "X", citycode: f.insee, postcode: "00000", latitude: 46, longitude: 1 },
    banFeatureType: "housenumber", dpeCandidates: candidats, dpeCandidatesStatus: "present",
    batiment: identiteDepuisRnb(f.rnb, LE),
    georisques: null, sinistralite: null, communeData: null, decision: null, audit: null, parcel: null,
    version: { numero: 1, collecteeLe: LE, sourcesAbsentes: [], synthese: null, syntheseHash: null },
    ...over,
  };
}
const ligne = (f: Fixture, over: Record<string, unknown> = {}) => ({
  id: "DOSSIER-FIXTURE", ban_id: f.ban, address_label: f.label, insee: f.insee, city: "X", postcode: "00000",
  latitude: 46, longitude: 1, dpe_selection_status: "pending", dpe_selection_at: null, selected_dpe_snapshot: null, ...over,
});

function intercepter() {
  const selections: Array<Record<string, unknown>> = [];
  const precedent = globalThis.fetch;
  globalThis.fetch = (async (url: string, init: { body?: string } = {}) => {
    if (url === "/api/logement-dpe") { selections.push(JSON.parse(init.body ?? "{}")); return new Response("{}", { status: 200 }); }
    if (url === "/api/synthesize-logement") return new Response("Texte de fixture, aucune IA.", { status: 200 });
    throw new Error(`Requête inattendue : ${url}`);
  }) as typeof fetch;
  return { selections, restaurer: () => { globalThis.fetch = precedent; } };
}

async function ouvrir(dossier: unknown, versionInitiale: unknown) {
  let r: { unmount: () => void } | undefined;
  await act(async () => { r = create(React.createElement(LogementModule, { dossier, versionInitiale, project: null, climatProjete: null })); });
  await act(async () => { await new Promise((ok) => setTimeout(ok, 0)); });
  return r!;
}
async function propositions(dossier: unknown, version: unknown) {
  const net = intercepter();
  const r = await ouvrir(dossier, version);
  try { return net.selections.filter((s) => s.status === "auto_confirmed"); }
  finally { await act(async () => r.unmount()); net.restaurer(); }
}

const rochelle = fx("la_rochelle_trois_batiments");
const unBatiment = { ...rochelle, rnb: { ...rochelle.rnb, results: [rochelle.rnb.results[0]] } };

test("La Rochelle, trois bâtiments : le vrai module n'émet AUCUNE attribution automatique", async () => {
  assert.deepEqual(await propositions(ligne(rochelle), rapport(rochelle)), []);
});

test("Puyravault, sept bâtiments, DPE rattaché à l'un d'eux : aucune attribution automatique", async () => {
  const f = fx("puyravault_ambigu");
  const maison = { ...rochelle.ademe_adresse[0] as object, numero_dpe: "2417E9999999P", identifiant_ban: f.ban, id_rnb: (f.rnb.results[0] as { rnb_id: string }).rnb_id };
  assert.deepEqual(await propositions(ligne(f), rapport({ ...f, ademe_adresse: [maison] })), []);
});

test("référentiel muet, bâtiment en ruine ou démoli : aucune attribution automatique", async () => {
  const b = unBatiment.rnb.results[0] as object;
  for (const batiment of [
    { statut: "indisponible" },
    identiteDepuisRnb({ next: null, results: [{ ...b, status: "notUsable" }] }, LE),
    identiteDepuisRnb({ next: null, results: [{ ...b, status: "demolished" }] }, LE),
  ]) {
    assert.deepEqual(await propositions(ligne(rochelle), rapport(unBatiment, { batiment })), [], JSON.stringify(batiment).slice(0, 60));
  }
});

test("liste ADEME tronquée : aucune attribution automatique sur un candidat unique supposé", async () => {
  assert.deepEqual(await propositions(ligne(rochelle), rapport(unBatiment, { dpeCandidatesTronque: true })), []);
});

test("TÉMOIN · maison seule, un bâtiment : la proposition part, par la liste, pour ce diagnostic", async () => {
  const p = await propositions(ligne(rochelle), rapport(unBatiment));
  assert.deepEqual(p, [{ dossierId: "DOSSIER-FIXTURE", status: "auto_confirmed", dpeId: "2417E2613440S", source: "liste" }]);
});

test("TÉMOIN · rapport antérieur à FUT-80 (sans bâtiment) : proposée comme avant ; le serveur relit le référentiel", async () => {
  const { batiment: _retire, ...ancien } = rapport(unBatiment);
  void _retire;
  assert.equal((await propositions(ligne(rochelle), ancien)).length, 1);
});

test("restauration : un choix, un refus ou un retrait datés ne déclenchent rien, quel que soit le bâtiment", async () => {
  for (const over of [
    { dpe_selection_status: "user_confirmed", dpe_selection_at: LE, selected_dpe_snapshot: toRecord(rochelle.ademe_adresse[0]) },
    { dpe_selection_status: "not_in_list", dpe_selection_at: LE },
    { dpe_selection_status: "pending", dpe_selection_at: LE },
  ]) {
    assert.deepEqual(await propositions(ligne(rochelle, over), rapport(unBatiment)), [], String(over.dpe_selection_status));
  }
});
