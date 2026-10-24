// FUT-74 · seconde revue indépendante du 24/10/2026 : AUCUNE SYNTHÈSE PENDANT QU'UNE SÉLECTION S'ENREGISTRE.
//
// Défaut constaté par la revue en exécutant les vrais composants : sur un dossier neuf à maison unique,
// `LogementModule` attendait la réponse du serveur à l'attribution automatique avec `selection_required`
// (un état aussi terminal pour une adresse sans choix), donc `synthesisReady` était vrai ; `LogementSynthesis`
// demandait une lecture sans DPE, puis une seconde après confirmation (deux empreintes différentes).
//
// CE TEST EXÉCUTE LES VRAIS `LogementModule` ET `LogementSynthesis` avec React 19 et `react-test-renderer` :
// hooks, effets et transitions d'état réels. Ne sont doublés que les composants de PRÉSENTATION (qui ne
// décident rien du déclenchement), `next/link` et PostHog. Toutes les requêtes sont interceptées en
// mémoire : aucun réseau, aucune IA, aucun dossier réel. Le texte de synthèse est une fixture.
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
const LogementSynthesis = charger(`${RACINE}/src/components/report/LogementSynthesis.tsx`).LogementSynthesis;
const { buildFactHash } = charger(`${RACINE}/src/lib/logement-synthesis-cache.ts`) as { buildFactHash: (d: unknown) => string };
const { dpe } = charger(`${RACINE}/src/lib/dpe-grain.fixtures.ts`) as { dpe: (o: Record<string, unknown>) => Record<string, unknown> };

// ── Fixtures synthétiques ────────────────────────────────────────────────────────────────────────

const MAISON = dpe({ id_dpe: "FUT74MAI00099", type_batiment: "maison", methode_dpe: "dpe maison individuelle", etiquette_dpe: "E" });
const APPART_A = dpe({ id_dpe: "FUT74LOG00061", complement: "Apt 1", etiquette_dpe: "C" });
const APPART_B = dpe({ id_dpe: "FUT74LOG00062", complement: "Apt 2", etiquette_dpe: "D", surface_m2: 41 });
const IMMEUBLE = dpe({ id_dpe: "FUT74IMM00061", type_batiment: "immeuble", methode_dpe: "dpe immeuble collectif", surface_m2: null, etiquette_dpe: "F" });

const ADRESSE = { banId: "99999_fixture", label: "1 Rue Synthétique 99999 Exemple", citycode: "99999", city: "Exemple", postcode: "99999", latitude: 46, longitude: -1 };
const rapport = (candidats: unknown[]) => ({
  address: ADRESSE, banFeatureType: "housenumber", dpeCandidates: candidats, dpeCandidatesStatus: "present",
  georisques: null, sinistralite: null, communeData: null, decision: null, audit: null, parcel: null,
});
const ligne = (over: Record<string, unknown> = {}) => ({
  id: "DOSSIER-FIXTURE", ban_id: "99999_fixture", address_label: ADRESSE.label, insee: "99999", city: "Exemple", postcode: "99999",
  latitude: 46, longitude: -1, dpe_selection_status: "pending", dpe_selection_at: null, selected_dpe_snapshot: null, ...over,
});

// ── Requêtes interceptées ────────────────────────────────────────────────────────────────────────

type Appel = { url: string; body: Record<string, unknown> };
type Attente = { resoudre: (r: Response) => void; rejeter: (e: unknown) => void };

function intercepter(candidats: unknown[], options: { selectionImmediate?: number } = {}) {
  const appels: Appel[] = [];
  const attentes: Attente[] = [];
  const precedent = globalThis.fetch;
  globalThis.fetch = (async (url: string, init: { body?: string } = {}) => {
    const body = JSON.parse(init.body ?? "{}");
    appels.push({ url, body });
    if (url === "/api/georisques-logement") return new Response(JSON.stringify(rapport(candidats)), { status: 200 });
    if (url === "/api/logement-dpe") {
      // Par défaut, la réponse du serveur ATTEND : le test décide quand elle arrive et laquelle.
      if (options.selectionImmediate) return new Response("{}", { status: options.selectionImmediate });
      return new Promise<Response>((resoudre, rejeter) => attentes.push({ resoudre, rejeter }));
    }
    if (url === "/api/synthesize-logement") return new Response("Texte de fixture, aucune IA.", { status: 200 });
    throw new Error(`Requête inattendue : ${url}`);
  }) as typeof fetch;
  return {
    appels, attentes,
    syntheses: () => appels.filter((a) => a.url === "/api/synthesize-logement"),
    selections: () => appels.filter((a) => a.url === "/api/logement-dpe"),
    restaurer: () => { globalThis.fetch = precedent; },
  };
}

type Rendu = { root: { findByType: (t: unknown) => { props: Record<string, unknown> }; findAll: (p: (n: { props: Record<string, unknown> }) => boolean) => { props: Record<string, unknown> }[] }; unmount: () => void };

async function ouvrir(dossier: unknown, versionInitiale: unknown = null): Promise<Rendu> {
  let r: Rendu | undefined;
  await act(async () => { r = create(React.createElement(LogementModule, { dossier, versionInitiale, project: null, climatProjete: null })); });
  return r!;
}
const synthese = (r: Rendu) => r.root.findByType(LogementSynthesis).props as { ready: boolean; data: { dpeSelectionStatus: string; selectedDpe: { id_dpe: string } | null } };
const energie = (r: Rendu) => r.root.findAll((n) => typeof n.props.onNotInList === "function" && typeof n.props.onPick === "function")[0].props as {
  onPick: (d: unknown) => void; onNotInList: () => void; onReselect: () => void; erreur: string | null; dpe: { id_dpe: string } | null;
};
const dpeLu = (a: Appel) => ((a.body.data as { selectedDpe?: { id_dpe: string } | null }).selectedDpe ?? null)?.id_dpe ?? null;
const statutLu = (a: Appel) => (a.body.data as { dpeSelectionStatus: string }).dpeSelectionStatus;
const hashLu = (a: Appel) => buildFactHash({ ...(a.body.data as object), climatProjete: null });

async function scenario(nom: string, corps: () => Promise<void>) {
  test(nom, async () => { await corps(); });
}

// ── Dossier neuf, une seule maison valide : l'attribution automatique ────────────────────────────

scenario("SUCCÈS · aucune synthèse pendant l'attente, puis une seule, sur la maison confirmée", async () => {
  const net = intercepter([MAISON]);
  const r = await ouvrir(ligne());
  try {
    assert.equal(net.selections().length, 1, "l'attribution automatique est en attente");
    assert.equal(synthese(r).ready, false);
    assert.equal(net.syntheses().length, 0, "aucune synthèse avant la réponse du serveur");
    await act(async () => { net.attentes[0].resoudre(new Response("{}", { status: 200 })); });
    assert.equal(synthese(r).data.dpeSelectionStatus, "auto_confirmed");
    assert.equal(net.syntheses().length, 1);
    assert.equal(dpeLu(net.syntheses()[0]), "FUT74MAI00099");
    assert.equal(statutLu(net.syntheses()[0]), "auto_confirmed");
  } finally { await act(async () => r.unmount()); net.restaurer(); }
});

scenario("REFUS 422 · aucune synthèse pendant l'attente, aucune attribution fictive, puis la lecture de l'état stable", async () => {
  const net = intercepter([MAISON]);
  const r = await ouvrir(ligne());
  try {
    assert.equal(net.syntheses().length, 0);
    await act(async () => { net.attentes[0].resoudre(new Response(JSON.stringify({ error: "DPE_NON_ATTRIBUABLE" }), { status: 422 })); });
    assert.equal(synthese(r).data.selectedDpe, null);
    assert.equal(synthese(r).data.dpeSelectionStatus, "selection_required");
    assert.match(String(energie(r).erreur), /n'a pas pu être retenu automatiquement/);
    assert.equal(net.syntheses().length, 1);
    assert.equal(dpeLu(net.syntheses()[0]), null);
  } finally { await act(async () => r.unmount()); net.restaurer(); }
});

scenario("PANNE RÉSEAU · aucune synthèse pendant l'attente, un état cohérent sans DPE ensuite", async () => {
  const net = intercepter([MAISON]);
  const r = await ouvrir(ligne());
  try {
    assert.equal(net.syntheses().length, 0);
    await act(async () => { net.attentes[0].rejeter(new TypeError("Panne réseau simulée")); });
    assert.equal(synthese(r).data.selectedDpe, null);
    assert.equal(synthese(r).ready, true);
    assert.equal(net.syntheses().length, 1);
    assert.equal(dpeLu(net.syntheses()[0]), null);
  } finally { await act(async () => r.unmount()); net.restaurer(); }
});

scenario("RÉPONSE PÉRIMÉE · le geste du lecteur gouverne seul la synthèse, l'attribution tardive n'en déclenche aucune", async () => {
  const net = intercepter([MAISON]);
  const r = await ouvrir(ligne());
  try {
    // Pendant l'attente, le lecteur répond « ce n'est pas celui de ce logement ».
    await act(async () => { energie(r).onNotInList(); });
    assert.equal(net.syntheses().length, 0, "son geste s'enregistre : toujours aucune synthèse");
    await act(async () => { net.attentes[1].resoudre(new Response("{}", { status: 200 })); });
    assert.equal(synthese(r).data.dpeSelectionStatus, "rejected");
    assert.equal(net.syntheses().length, 1);
    assert.equal(statutLu(net.syntheses()[0]), "rejected");
    // La réponse automatique arrive APRÈS : elle ne rétablit ni la maison, ni une synthèse.
    await act(async () => { net.attentes[0].resoudre(new Response("{}", { status: 200 })); });
    assert.equal(synthese(r).data.dpeSelectionStatus, "rejected");
    assert.equal(synthese(r).data.selectedDpe, null);
    assert.equal(net.syntheses().length, 1, "aucune synthèse sur la décision périmée");
    assert.ok(net.syntheses().every((a) => dpeLu(a) === null));
  } finally { await act(async () => r.unmount()); net.restaurer(); }
});

// ── Témoins : les synthèses légitimes partent comme avant ────────────────────────────────────────

scenario("TÉMOIN · plusieurs diagnostics à désigner : une synthèse de l'adresse, sans attente", async () => {
  const net = intercepter([APPART_A, APPART_B]);
  const r = await ouvrir(ligne());
  try {
    assert.equal(net.selections().length, 0);
    assert.equal(synthese(r).ready, true);
    assert.equal(net.syntheses().length, 1);
    assert.equal(dpeLu(net.syntheses()[0]), null);
  } finally { await act(async () => r.unmount()); net.restaurer(); }
});

scenario("TÉMOIN · un DPE d'immeuble seul : rien n'est proposé, la synthèse part sans DPE", async () => {
  const net = intercepter([IMMEUBLE]);
  const r = await ouvrir(ligne());
  try {
    assert.equal(net.selections().length, 0);
    assert.equal(net.syntheses().length, 1);
    assert.equal(dpeLu(net.syntheses()[0]), null);
  } finally { await act(async () => r.unmount()); net.restaurer(); }
});

scenario("TÉMOIN · retrait volontaire antérieur : aucune réattribution, la synthèse part sans DPE", async () => {
  const net = intercepter([MAISON]);
  const r = await ouvrir(ligne({ dpe_selection_at: "2026-10-24T10:00:00Z" }));
  try {
    assert.equal(net.selections().length, 0);
    assert.equal(net.syntheses().length, 1);
    assert.equal(dpeLu(net.syntheses()[0]), null);
  } finally { await act(async () => r.unmount()); net.restaurer(); }
});

scenario("TÉMOIN · dossier historique à choix enregistré : la synthèse lit ce choix, sans nouvel enregistrement", async () => {
  const net = intercepter([APPART_A, APPART_B]);
  const r = await ouvrir(ligne({ dpe_selection_status: "user_confirmed", dpe_selection_at: "2026-09-01T10:00:00Z", selected_dpe_snapshot: APPART_B }));
  try {
    assert.equal(net.selections().length, 0);
    assert.equal(net.syntheses().length, 1);
    assert.equal(dpeLu(net.syntheses()[0]), "FUT74LOG00062");
  } finally { await act(async () => r.unmount()); net.restaurer(); }
});

scenario("TÉMOIN · choix manuel accepté : aucune synthèse pendant l'enregistrement, une seule ensuite, sur ce choix", async () => {
  const net = intercepter([APPART_A, APPART_B]);
  const r = await ouvrir(ligne());
  try {
    assert.equal(net.syntheses().length, 1, "la lecture de l'adresse sans choix");
    await act(async () => { energie(r).onPick(APPART_A); });
    assert.equal(synthese(r).ready, false, "le choix optimiste n'est pas un choix enregistré");
    assert.equal(net.syntheses().length, 1);
    await act(async () => { net.attentes[0].resoudre(new Response("{}", { status: 200 })); });
    assert.equal(net.syntheses().length, 2);
    assert.equal(dpeLu(net.syntheses()[1]), "FUT74LOG00061");
  } finally { await act(async () => r.unmount()); net.restaurer(); }
});

scenario("TÉMOIN · choix manuel refusé : aucune synthèse fondée sur le choix fictif", async () => {
  const net = intercepter([APPART_A, APPART_B]);
  const r = await ouvrir(ligne());
  try {
    await act(async () => { energie(r).onPick(APPART_A); });
    await act(async () => { net.attentes[0].resoudre(new Response(JSON.stringify({ error: "DPE_NOT_AT_ADDRESS" }), { status: 422 })); });
    assert.equal(synthese(r).data.selectedDpe, null);
    assert.match(String(energie(r).erreur), /n'a pas pu être enregistré/);
    assert.equal(net.syntheses().length, 1, "l'état est revenu à celui déjà lu");
    assert.ok(net.syntheses().every((a) => dpeLu(a) === null));
  } finally { await act(async () => r.unmount()); net.restaurer(); }
});

scenario("TÉMOIN · une synthèse enregistrée qui a lu ces faits est resservie sans nouvelle génération", async () => {
  const historique = ligne({ dpe_selection_status: "user_confirmed", dpe_selection_at: "2026-09-01T10:00:00Z", selected_dpe_snapshot: APPART_B });
  // L'empreinte des faits stables de ce dossier, telle que la lit le vrai composant.
  const sonde = intercepter([APPART_A, APPART_B]);
  const r0 = await ouvrir(historique);
  const empreinte = hashLu(sonde.syntheses()[0]);
  await act(async () => r0.unmount());
  sonde.restaurer();

  const net = intercepter([APPART_A, APPART_B]);
  const version = { ...rapport([APPART_A, APPART_B]), version: { numero: 1, synthese: "Synthèse enregistrée.", syntheseHash: empreinte } };
  const r = await ouvrir(historique, version);
  try {
    assert.equal(synthese(r).ready, true);
    assert.equal(net.appels.length, 0, "aucune requête : ni collecte, ni sélection, ni synthèse");
  } finally { await act(async () => r.unmount()); net.restaurer(); }
});
