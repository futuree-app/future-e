// Revue indépendante : montage du vrai module, effets React inclus ; présentation fibre réelle.
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

// Les autres présentations sont doublées ; la section fibre et les primitives Relevé restent réelles.
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
    if (spec.endsWith(".css")) return { __esModule: true, default: new Proxy({}, { get: (_, k) => String(k) }) };
    if (spec.startsWith("@/components/") && !["@/components/report/logement/FibreAdresseSection", "@/components/releve/primitives"].includes(spec)) return presentation(spec);
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


const LogementModule = charger(`${RACINE}/src/components/report/LogementModule.tsx`).default;
const { casDeLogement } = charger(`${RACINE}/src/components/prototypes/fut87/fixture-logement.ts`) as { casDeLogement: (cas: string) => { rapport: object } };
const { lectureDepuisCode } = charger(`${RACINE}/src/lib/fibre-adresse.ts`) as { lectureDepuisCode: (code: string, meta: object) => object };
const meta = { millesime: "2026T2", donneesAu: "2026-06-30" };
const base = casDeLogement("sans-dpe").rapport;
const dossier = {
  id: "recette-locale", ban_id: "17415_0510_00011", address_label: "11 Place Blair Saintes",
  insee: "17415", city: "Saintes", postcode: "17100", latitude: 45.7, longitude: -0.6,
  dpe_selection_status: "pending", dpe_selection_at: "2026-10-28", selected_dpe_snapshot: null,
};
const precedent = globalThis.fetch;
const appels: string[] = [];
globalThis.fetch = async (u) => { appels.push(String(u)); throw new Error(`réseau interdit dans cette recette : ${u}`); };
const sorties = [];
function texte(x: unknown): string {
  if (typeof x === "string") return x;
  if (Array.isArray(x)) return x.map(texte).join(" ");
  return x && typeof x === "object" ? texte((x as { children?: unknown }).children) : "";
}
try {
  for (const [cas, fibre, attendu] of [
    ["deploye", lectureDepuisCode("D5", meta), "5 opérateurs"],
    ["sur_demande", lectureDepuisCode("R0", meta), "Aucun opérateur"],
    ["libelle_corse", lectureDepuisCode("~D5", meta), "5 opérateurs"],
    ["plage", lectureDepuisCode("D4-5/2", meta), "4 à 5 opérateurs"],
    ["eloigne", lectureDepuisCode("G/2", meta), "Raccordement à vérifier"],
    ["panne", { statut: "indisponible" }, "Fibre non vérifiée"],
    ["ancien", undefined, null],
  ] as Array<[string, object | undefined, string | null]>) {
    let r: { toJSON: () => unknown; unmount: () => void } | undefined;
    await act(async () => { r = create(React.createElement(LogementModule, {
      dossier, project: null, versionInitiale: { ...base, ...(fibre ? { fibre } : {}) },
    })); });
    const rendu = texte(r!.toJSON()).replace(/\u00a0/g, " ");
    assert.equal(rendu.includes("Fibre à cette adresse"), attendu !== null, cas);
    if (attendu) assert.ok(rendu.includes(attendu), `${cas} : ${attendu}`);
    sorties.push({ cas, blocPresent: rendu.includes("Fibre à cette adresse"), attendu });
    await act(async () => r!.unmount());
  }
  assert.deepEqual(appels, [], "ouvrir une version existante ne collecte aucune source");
  console.log(JSON.stringify({ module: "LogementModule", presentationsHorsFibreDoublees: true, visuelNavigateur: false, appelsReseau: appels, cas: sorties }, null, 2));
} finally { globalThis.fetch = precedent; }
