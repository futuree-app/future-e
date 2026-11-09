// FUT-121 · LES CORRECTIONS REACT NE CHANGENT PAS CE QUE LE LECTEUR VOIT.
//
// Sept composants appelaient `setState` dans un effet (ou réaffectaient une variable du rendu, ou
// construisaient du JSX dans un `try`). Leur réécriture doit garder exactement le comportement :
// valeur rendue par le serveur, valeur restaurée côté client, changement, retour à l'état
// précédent, persistance, gestion des erreurs.
//
// Ce test EXÉCUTE les vrais modules : `react-dom/server` pour le rendu serveur (il appelle
// `getServerSnapshot`), `react-test-renderer` pour le client (hooks, effets et transitions réels).
// Le navigateur est une doublure en mémoire (stockage, `<html data-theme>`, observateurs, adresse) :
// aucun réseau, aucune base, aucun modèle. L'hydratation elle-même est recettée dans un vrai
// navigateur (cf. PR) : ce test fixe les deux bouts de la séquence, le HTML servi et l'état client.
import test, { mock } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const React = require("react");
const { renderToString } = require("react-dom/server");
const { act, create } = require("react-test-renderer");
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const RACINE = process.cwd();
type Mod = { exports: Record<string, unknown> };
type Doublures = Record<string, unknown>;

// Chaque scénario charge des modules NEUFS : `useHorizon` garde un store au niveau du module, qu'un
// scénario précédent ne doit pas avoir déjà hydraté.
function charger(fichier: string, doublures: Doublures = {}, cache = new Map<string, Mod>()): Record<string, unknown> {
  let f = path.resolve(fichier);
  if (!fs.existsSync(f)) for (const ext of [".ts", ".tsx", ".js"]) if (fs.existsSync(f + ext)) { f += ext; break; }
  const deja = cache.get(f);
  if (deja) return deja.exports;
  const m: Mod = { exports: {} };
  cache.set(f, m);
  const req = (spec: string): unknown => {
    if (spec in doublures) return doublures[spec];
    if (spec === "react") return React;
    if (spec === "react/jsx-runtime") return require("react/jsx-runtime");
    if (spec.startsWith("@/")) return charger(path.join(RACINE, "src", spec.slice(2)), doublures, cache);
    if (spec.startsWith(".")) return charger(path.join(path.dirname(f), spec), doublures, cache);
    return require(spec);
  };
  const code = ts.transpileModule(fs.readFileSync(f, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: f })(req, m, m.exports);
  return m.exports;
}

// ── Navigateur en mémoire ────────────────────────────────────────────────────────────────────────

class Stockage {
  m = new Map<string, string>();
  illisible = false;
  inscriptible = true;
  getItem(k: string) { if (this.illisible) throw new Error("stockage bloqué"); return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { if (!this.inscriptible) throw new Error("quota"); this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
}

type Navigateur = {
  local: Stockage;
  fenetre: EventTarget & Record<string, unknown>;
  html: { dataset: Record<string, string>; style: { valeurs: Map<string, string>; setProperty: (k: string, v: string) => void } };
  images: Array<() => void>;
  gtag: unknown[][];
  restaurer: () => void;
};

function installerNavigateur({ theme, recherche = "" }: { theme?: string; recherche?: string } = {}): Navigateur {
  const local = new Stockage();
  const observateurs = new Set<() => void>();
  const dataset = new Proxy<Record<string, string>>(theme ? { theme } : {}, {
    set(cible, cle, valeur) {
      cible[cle as string] = valeur;
      // Un MutationObserver réel notifie en microtâche, pas pendant l'affectation.
      if (cle === "theme") queueMicrotask(() => { for (const o of [...observateurs]) o(); });
      return true;
    },
  });
  const valeurs = new Map<string, string>();
  const html = { dataset, style: { valeurs, setProperty: (k: string, v: string) => { valeurs.set(k, v); } } };
  const images: Array<() => void> = [];
  const gtag: unknown[][] = [];
  const fenetre = Object.assign(new EventTarget(), {
    localStorage: local,
    sessionStorage: new Stockage(),
    location: { search: recherche },
    requestAnimationFrame: (cb: () => void) => { images.push(cb); return images.length; },
    cancelAnimationFrame: () => {},
    gtag: (...a: unknown[]) => { gtag.push(a); },
  }) as EventTarget & Record<string, unknown>;
  class FauxMutationObserver {
    cb: () => void;
    constructor(cb: () => void) { this.cb = cb; }
    observe() { observateurs.add(this.cb); }
    disconnect() { observateurs.delete(this.cb); }
  }
  class FauxResizeObserver { observe() {} disconnect() {} }
  const globaux: Record<string, unknown> = {
    window: fenetre,
    document: { documentElement: html },
    localStorage: local,
    MutationObserver: FauxMutationObserver,
    ResizeObserver: FauxResizeObserver,
  };
  const avant = new Map<string, PropertyDescriptor | undefined>();
  for (const [k, v] of Object.entries(globaux)) {
    avant.set(k, Object.getOwnPropertyDescriptor(globalThis, k));
    Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true });
  }
  return {
    local, fenetre, html, images, gtag,
    restaurer: () => {
      for (const [k, d] of avant) {
        if (d) Object.defineProperty(globalThis, k, d);
        else delete (globalThis as Record<string, unknown>)[k];
      }
    },
  };
}

const texteDe = (r: { toJSON: () => unknown }) => JSON.stringify(r.toJSON());
type Rendu = { root: { findAll: (p: (n: { type: unknown; props: Record<string, unknown> }) => boolean) => Array<{ props: Record<string, unknown> }> }; unmount: () => void; toJSON: () => unknown };

// ── useTheme ─────────────────────────────────────────────────────────────────────────────────────

function sondeTheme(useTheme: () => { theme: string; toggle: () => void }, sortie: Array<{ theme: string; toggle: () => void }>, i: number) {
  return function Sonde() { const t = useTheme(); sortie[i] = t; return React.createElement("span", null, t.theme); };
}

test("useTheme : le serveur rend le thème sombre servi, quelle que soit la préférence du navigateur", () => {
  const { useTheme } = charger(`${RACINE}/src/lib/useTheme.ts`) as { useTheme: () => { theme: string; toggle: () => void } };
  const vus: Array<{ theme: string; toggle: () => void }> = [];
  assert.equal(renderToString(React.createElement(sondeTheme(useTheme, vus, 0))), "<span>dark</span>");
});

test("useTheme : restauration depuis <html data-theme>, bascule, retour, persistance, et deux lecteurs alignés", async () => {
  const nav = installerNavigateur({ theme: "light" });
  let r: Rendu | undefined;
  try {
    const { useTheme } = charger(`${RACINE}/src/lib/useTheme.ts`) as { useTheme: () => { theme: string; toggle: () => void } };
    const vus: Array<{ theme: string; toggle: () => void }> = [];
    const A = sondeTheme(useTheme, vus, 0), B = sondeTheme(useTheme, vus, 1);
    await act(async () => { r = create(React.createElement(React.Fragment, null, React.createElement(A), React.createElement(B))); });
    assert.deepEqual([vus[0].theme, vus[1].theme], ["light", "light"], "valeur restaurée par le script de layout");

    await act(async () => { vus[0].toggle(); });
    assert.equal(nav.html.dataset.theme, "dark");
    assert.equal(nav.local.getItem("futuree-theme"), "dark");
    assert.deepEqual([vus[0].theme, vus[1].theme], ["dark", "dark"], "le second lecteur suit le premier");

    await act(async () => { vus[1].toggle(); });
    assert.deepEqual([vus[0].theme, vus[1].theme, nav.local.getItem("futuree-theme")], ["light", "light", "light"], "retour à l'état précédent");

    nav.local.inscriptible = false;
    await act(async () => { vus[0].toggle(); });
    assert.equal(vus[0].theme, "dark", "stockage plein : le thème change quand même, seule la mémoire échoue");
  } finally {
    if (r) await act(async () => r!.unmount());
    nav.restaurer();
  }
});

// ── useHorizon ───────────────────────────────────────────────────────────────────────────────────

type Horizon = [string, (h: string) => void];
function sondeHorizon(useHorizon: () => Horizon, sortie: Horizon[], i: number) {
  return function Sonde() { const h = useHorizon(); sortie[i] = h; return React.createElement("span", null, h[0]); };
}

test("useHorizon : le serveur rend l'horizon par défaut (2050), jamais celui du stockage", () => {
  const { useHorizon } = charger(`${RACINE}/src/hooks/useHorizon.ts`) as { useHorizon: () => Horizon };
  assert.equal(renderToString(React.createElement(sondeHorizon(useHorizon, [], 0))), "<span>gwl20</span>");
});

test("useHorizon : restauration, partage entre lecteurs (y compris montés plus tard), changement, retour, valeurs refusées", async () => {
  const nav = installerNavigateur();
  nav.local.setItem("futuree:horizon", "gwl30");
  let r: Rendu | undefined, r2: Rendu | undefined;
  try {
    const { useHorizon } = charger(`${RACINE}/src/hooks/useHorizon.ts`) as { useHorizon: () => Horizon };
    const vus: Horizon[] = [];
    await act(async () => { r = create(React.createElement(sondeHorizon(useHorizon, vus, 0))); });
    assert.equal(vus[0][0], "gwl30", "restauré depuis le stockage");

    await act(async () => { vus[0][1]("gwl15"); });
    assert.equal(nav.local.getItem("futuree:horizon"), "gwl15");
    await act(async () => { r2 = create(React.createElement(sondeHorizon(useHorizon, vus, 1))); });
    assert.deepEqual([vus[0][0], vus[1][0]], ["gwl15", "gwl15"], "un lecteur monté plus tard lit la valeur courante");

    await act(async () => { vus[1][1]("gwl30"); });
    assert.deepEqual([vus[0][0], vus[1][0], nav.local.getItem("futuree:horizon")], ["gwl30", "gwl30", "gwl30"], "retour, propagé aux deux");

    await act(async () => { vus[0][1]("gwl99"); });
    assert.deepEqual([vus[0][0], nav.local.getItem("futuree:horizon")], ["gwl30", "gwl30"], "valeur hors liste ignorée");
  } finally {
    if (r) await act(async () => r!.unmount());
    if (r2) await act(async () => r2!.unmount());
    nav.restaurer();
  }
});

test("useHorizon : une valeur stockée invalide retombe sur 2050", async () => {
  const nav = installerNavigateur();
  nav.local.setItem("futuree:horizon", "gwl99");
  let r: Rendu | undefined;
  try {
    const { useHorizon } = charger(`${RACINE}/src/hooks/useHorizon.ts`) as { useHorizon: () => Horizon };
    const vus: Horizon[] = [];
    await act(async () => { r = create(React.createElement(sondeHorizon(useHorizon, vus, 0))); });
    assert.equal(vus[0][0], "gwl20");
  } finally {
    if (r) await act(async () => r!.unmount());
    nav.restaurer();
  }
});

// ── ConsentBanner ────────────────────────────────────────────────────────────────────────────────

const chargerBandeau = () => (charger(`${RACINE}/src/components/ConsentBanner.tsx`) as { ConsentBanner: () => unknown }).ConsentBanner;
const bouton = (r: Rendu, libelle: string) => r.root.findAll((n) => n.type === "button" && JSON.stringify(n.props.children) === JSON.stringify(libelle))[0];
const mockNoeud = () => ({ getBoundingClientRect: () => ({ height: 48 }) });

test("ConsentBanner : le serveur rend le bandeau masqué (pas de choix connu côté serveur)", () => {
  assert.equal(renderToString(React.createElement(chargerBandeau())), "");
});

test("ConsentBanner : sans choix, le bandeau s'affiche ; accepter le ferme, le retient et met à jour Google ; « Paramètres des cookies » le rouvre", async () => {
  const nav = installerNavigateur();
  let r: Rendu | undefined;
  try {
    const ConsentBanner = chargerBandeau();
    await act(async () => { r = create(React.createElement(ConsentBanner), { createNodeMock: mockNoeud }); });
    assert.ok(bouton(r!, "Accepter"), "bandeau affiché à la première visite");
    assert.equal(nav.html.style.valeurs.get("--consent-h"), "48px", "sa hauteur est publiée");
    assert.equal(nav.gtag.length, 0, "aucun consentement envoyé avant le choix");

    await act(async () => { (bouton(r!, "Accepter").props.onClick as () => void)(); });
    assert.equal(r!.toJSON(), null, "fermé après le choix");
    assert.equal(nav.local.getItem("futuree-consent"), "granted");
    assert.deepEqual(nav.gtag.at(-1), ["consent", "update", { analytics_storage: "granted", ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" }]);
    assert.equal(nav.html.style.valeurs.get("--consent-h"), "0px");

    await act(async () => { nav.fenetre.dispatchEvent(new Event("futuree:show-consent")); });
    assert.ok(bouton(r!, "Refuser"), "rouvert depuis le lien de la politique");
    assert.equal(nav.local.getItem("futuree-consent"), null, "le choix précédent est effacé");

    await act(async () => { (bouton(r!, "Refuser").props.onClick as () => void)(); });
    assert.equal(r!.toJSON(), null);
    assert.equal(nav.local.getItem("futuree-consent"), "denied", "retour à un choix retenu");
  } finally {
    if (r) await act(async () => r!.unmount());
    nav.restaurer();
  }
});

test("ConsentBanner : un choix déjà retenu garde le bandeau fermé et le réapplique à Google", async () => {
  const nav = installerNavigateur();
  nav.local.setItem("futuree-consent", "denied");
  let r: Rendu | undefined;
  try {
    const ConsentBanner = chargerBandeau();
    await act(async () => { r = create(React.createElement(ConsentBanner), { createNodeMock: mockNoeud }); });
    assert.equal(r!.toJSON(), null);
    assert.deepEqual(nav.gtag, [["consent", "update", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" }]]);
  } finally {
    if (r) await act(async () => r!.unmount());
    nav.restaurer();
  }
});

test("ConsentBanner : stockage illisible → bandeau affiché ; écriture refusée → le clic ferme quand même", async () => {
  const nav = installerNavigateur();
  nav.local.illisible = true;
  nav.local.inscriptible = false;
  let r: Rendu | undefined;
  try {
    const ConsentBanner = chargerBandeau();
    await act(async () => { r = create(React.createElement(ConsentBanner), { createNodeMock: mockNoeud }); });
    assert.ok(bouton(r!, "Accepter"));
    await act(async () => { (bouton(r!, "Accepter").props.onClick as () => void)(); });
    assert.equal(r!.toJSON(), null);
    assert.equal(nav.gtag.length, 1, "le choix part quand même vers Google");
  } finally {
    if (r) await act(async () => r!.unmount());
    nav.restaurer();
  }
});

// ── QuartierWorkbook : « Sauvegardé » ────────────────────────────────────────────────────────────

test("QuartierWorkbook : « Sauvegardé » apparaît à la restauration et à chaque saisie, puis s'éteint après 1,8 s ; les réponses restent sauvegardées", async () => {
  const nav = installerNavigateur();
  const cle = "futuree:quartier-workbook:u1";
  nav.local.setItem(cle, JSON.stringify({ heat: "", water: "", shelter: "", change: "", note: "déjà écrit" }));
  const envois: unknown[] = [];
  const fetchAvant = globalThis.fetch;
  globalThis.fetch = (async (url: string, init: { body: string }) => { envois.push([url, JSON.parse(init.body)]); return new Response("{}"); }) as typeof fetch;
  mock.timers.enable({ apis: ["setTimeout"] });
  let r: Rendu | undefined;
  try {
    const { QuartierWorkbook } = charger(`${RACINE}/src/app/(account)/compte/QuartierWorkbook.tsx`, { "posthog-js/react": { usePostHog: () => null } }) as { QuartierWorkbook: (p: unknown) => unknown };
    await act(async () => { r = create(React.createElement(QuartierWorkbook, { userKey: "u1", commune: "La Rochelle", inseeCode: "17300", reportId: null })); });
    await act(async () => { (r!.root.findAll((n) => n.type === "button")[0].props.onClick as () => void)(); }); // déplier
    assert.match(texteDe(r!), /Sauvegarde automatique/, "rien d'annoncé avant la restauration");

    await act(async () => { for (const f of nav.images.splice(0)) f(); }); // la frame d'hydratation
    assert.match(texteDe(r!), /Sauvegardé dans ce navigateur/, "annoncé quand le carnet devient prêt (comportement d'avant)");
    const zone = () => r!.root.findAll((n) => n.type === "textarea")[0];
    assert.equal(zone().props.value, "déjà écrit", "réponses restaurées");

    await act(async () => { mock.timers.tick(1800); });
    assert.match(texteDe(r!), /Sauvegarde automatique/, "s'éteint après 1,8 s");

    const choix = r!.root.findAll((n) => n.type === "button" && typeof n.props.onClick === "function").slice(1)[0];
    await act(async () => { (choix.props.onClick as () => void)(); });
    assert.match(texteDe(r!), /Sauvegardé dans ce navigateur/, "relancé par un choix");
    const stocke = JSON.parse(nav.local.getItem(cle)!);
    assert.notEqual(stocke.heat, "", "le choix est écrit dans le navigateur");

    await act(async () => { mock.timers.tick(1000); });
    await act(async () => { (zone().props.onChange as (e: unknown) => void)({ target: { value: "nouvelle note" } }); });
    await act(async () => { mock.timers.tick(1000); });
    assert.match(texteDe(r!), /Sauvegardé dans ce navigateur/, "la saisie relance le minuteur : toujours affiché 1 s après");
    assert.equal(JSON.parse(nav.local.getItem(cle)!).note, "nouvelle note");
    await act(async () => { mock.timers.tick(800); });
    assert.match(texteDe(r!), /Sauvegarde automatique/);

    assert.ok(envois.some(([u, b]) => u === "/api/terrain-observations" && (b as { answers: { note: string } }).answers.note === "nouvelle note"), "synchronisation serveur inchangée");
  } finally {
    if (r) await act(async () => r!.unmount());
    mock.timers.reset();
    globalThis.fetch = fetchAvant;
    nav.restaurer();
  }
});

// ── DossierQualificationClient : le code de lancement ────────────────────────────────────────────

test("DossierQualificationClient : le code `?code=` de l'adresse traverse jusqu'au lien de paiement ; sans code, aucun paramètre", async () => {
  for (const [recherche, attendu] of [["?code=%20BETA%20", "&code=BETA"], ["", null]] as const) {
    const nav = installerNavigateur({ recherche });
    const fetchAvant = globalThis.fetch;
    globalThis.fetch = (async () => new Response(JSON.stringify({
      status: "qualified",
      matter: { dpe: "found", parcel: "found" },
      quote: { status: "final", basePriceCents: 4900, amountDueCents: 4900 },
    }))) as typeof fetch;
    let r: Rendu | undefined;
    let surAdresse: ((a: unknown) => Promise<void>) | undefined;
    try {
      const { DossierQualificationClient } = charger(`${RACINE}/src/app/(public)/dossier/DossierQualificationClient.tsx`, {
        "posthog-js": { __esModule: true, default: { capture: () => {} } },
        "@/components/report/AddressAutocomplete": { AddressAutocomplete: (p: { onSelect: (a: unknown) => Promise<void> }) => { surAdresse = p.onSelect; return null; } },
      }) as { DossierQualificationClient: () => unknown };
      if (!attendu) assert.doesNotMatch(renderToString(React.createElement(DossierQualificationClient)), /code=/, "prérendu sans code");
      await act(async () => { r = create(React.createElement(DossierQualificationClient)); });
      await act(async () => { await surAdresse!({ id: "17300_1", label: "1 rue X 17000 La Rochelle", citycode: "17300", latitude: 46.16, longitude: -1.15, postcode: "17000", city: "La Rochelle", type: "housenumber" }); });
      const lien = r!.root.findAll((n) => n.type === "a" && String(n.props.href).startsWith("/checkout/dossier"))[0];
      assert.ok(lien, "lien de paiement rendu");
      if (attendu) assert.ok(String(lien.props.href).endsWith(attendu), String(lien.props.href));
      else assert.doesNotMatch(String(lien.props.href), /code=/);
    } finally {
      if (r) await act(async () => r!.unmount());
      globalThis.fetch = fetchAvant;
      nav.restaurer();
    }
  }
});

// ── VentesAutourServeur : la course contre le délai ─────────────────────────────────────────────

test("VentesAutourServeur : lecture à temps, délai dépassé, erreur propagée ; la minuterie est toujours libérée", async () => {
  let lecture: Promise<unknown> = Promise.resolve(null);
  const Bloc = () => null;
  const { VentesAutourServeur } = charger(`${RACINE}/src/components/report/VentesAutourServeur.tsx`, {
    "@/lib/server/prix-autour-tuiles": { lireVentesAutour: () => lecture },
    "@/components/report/VentesAutourBloc": { VentesAutourBloc: Bloc },
  }) as { VentesAutourServeur: (p: unknown) => Promise<{ props: { autour: unknown; type: string } }> };
  const props = { lat: 46.16, lon: -1.15, insee: "17300", type: "appartement" };

  mock.timers.enable({ apis: ["setTimeout"] });
  const libere = mock.method(globalThis, "clearTimeout");
  try {
    lecture = Promise.resolve({ ventes: 3 });
    const vite = await VentesAutourServeur(props);
    assert.deepEqual([vite.props.autour, vite.props.type], [{ ventes: 3 }, "appartement"]);

    lecture = new Promise(() => {});
    const enCours = VentesAutourServeur(props);
    await Promise.resolve();
    mock.timers.tick(5_999);
    let fini = false;
    void enCours.then(() => { fini = true; });
    await new Promise((r) => setImmediate(r));
    assert.equal(fini, false, "encore en attente à 5,999 s");
    mock.timers.tick(1);
    assert.equal((await enCours).props.autour, null, "au-delà de 6 s : indisponible");

    lecture = Promise.reject(new Error("panne de stockage"));
    await assert.rejects(VentesAutourServeur(props), /panne de stockage/);
    assert.equal(libere.mock.callCount(), 3, "une libération par lecture : à temps, hors délai, en erreur");
  } finally {
    libere.mock.restore();
    mock.timers.reset();
  }
});

// ── ConclusionRedigee : la persistance échouée ne coûte pas la conclusion ────────────────────────

test("ConclusionRedigee : persistance réussie → blocs canoniques ; persistance échouée → blocs générés, erreur journalisée", async () => {
  const envAvant = process.env.DOSSIER_NARRATIVE;
  process.env.DOSSIER_NARRATIVE = "true";
  const erreurs: unknown[] = [];
  const erreurAvant = console.error;
  console.error = (...a: unknown[]) => { erreurs.push(a[0]); };
  try {
    let sauvegarde: () => Promise<unknown> = async () => [{ key: "lecture", text: "CANONIQUE" }];
    const Bloc = () => null;
    const { ConclusionRedigee } = charger(`${RACINE}/src/components/report/ConclusionRedigee.tsx`, {
      "next/headers": { headers: async () => new Map() },
      ai: { generateObject: async () => ({ object: { blocks: [{ key: "lecture", text: "GÉNÉRÉ" }] } }) },
      "@ai-sdk/anthropic": { anthropic: () => "modèle" },
      "@/lib/decision/conclusion-plan": { shouldGenerateNarrative: () => true },
      "@/lib/decision/conclusion-validate": {
        validateGeneratedBlocks: (_p: unknown, raw: Array<{ key: string; text: string }>) => ({ blocks: raw.map((b) => ({ ...b, generated: true })), rejected: [] }),
      },
      "@/lib/decision/conclusion-prompt": { CONCLUSION_SYSTEM_PROMPT: "" },
      "@/lib/decision/conclusion-hash": { buildConclusionHash: () => "h", DECISION_NARRATIVE_MODEL: "m", DECISION_NARRATIVE_PROMPT_VERSION: "v" },
      "@/lib/server/decision-narrative-store": { readNarrative: async () => null, saveNarrative: () => sauvegarde(), pruneNarratives: async () => {} },
      "@/lib/user-account": { requireCurrentUser: async () => ({ supabase: {}, user: { id: "u" } }) },
      "@/components/report/ConclusionBlock": { ConclusionBlock: Bloc, planToBlocks: () => [] },
    }) as { ConclusionRedigee: (p: unknown) => Promise<{ type: unknown; props: { blocks: Array<{ text: string }> } }> };
    const plan = { blocks: [{ key: "lecture", generable: true, fallbackText: "repli", requiredPhrases: [], allowedNumbers: [], maxChars: 400 }], scope: {}, conclusionState: "x", posture: "x", reservesCount: 0, lead: { kind: "none" } };

    const ok = await ConclusionRedigee({ plan, insee: "17300", scopeKey: "s" });
    assert.equal(ok.type, Bloc);
    assert.deepEqual(ok.props.blocks.map((b) => b.text), ["CANONIQUE"], "la ligne du store gagne");

    sauvegarde = async () => { throw new Error("base indisponible"); };
    const ko = await ConclusionRedigee({ plan, insee: "17300", scopeKey: "s" });
    assert.equal(ko.type, Bloc);
    assert.deepEqual(ko.props.blocks.map((b) => b.text), ["GÉNÉRÉ"], "repli sur le texte généré");
    assert.ok(erreurs.includes("[dossier-narrative] persistance échouée"));
  } finally {
    console.error = erreurAvant;
    if (envAvant === undefined) delete process.env.DOSSIER_NARRATIVE;
    else process.env.DOSSIER_NARRATIVE = envAvant;
  }
});
