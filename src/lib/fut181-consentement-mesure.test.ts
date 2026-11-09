// FUT-181 · LA MESURE D'AUDIENCE OBÉIT AU CONSENTEMENT.
//
// 1. Les règles pures : lecture du choix, réduction des URLs et des événements, purge des traces.
// 2. Le pilotage de PostHog (`mesure-audience.ts`) EXÉCUTÉ contre une doublure du SDK qui enregistre
//    chaque appel : pas d'`init` sans consentement, retrait complet, identité sans e-mail.
// 3. Les sources : plus aucun `init` ni `identify` hors du module, plus d'e-mail vers PostHog, et les
//    routes serveur n'émettent que sur un identifiant de mesure consenti.
// La preuve réseau (requêtes /ingest réellement émises par posthog-js) est la recette Playwright :
// docs/audits/2026-11-09-fut181-consentement-posthog/recette.cjs.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import {
  CLE_CONSENTEMENT_MESURE, domainesDeCookie, estCleStockagePostHog, lireConsentementMesure, mesureConsentie,
  nettoyerEvenement, nettoyerUrl, nettoyerUrlsDansTexte, purgerTracesPostHog,
} from "./mesure-audience-regles.ts";
import { identifiantMesureConsenti } from "./posthog-identity.ts";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const RACINE = process.cwd();
const lire = (f: string) => fs.readFileSync(path.join(RACINE, f), "utf8");
const stock = (v: string | null) => ({ getItem: (k: string) => (k === CLE_CONSENTEMENT_MESURE ? v : null) });

// ── 1. Règles ────────────────────────────────────────────────────────────────────────────────

test("consentement : seule la valeur exacte « granted » ouvre la mesure", () => {
  assert.equal(lireConsentementMesure(stock("granted")), "granted");
  assert.equal(lireConsentementMesure(stock("denied")), "denied");
  assert.equal(lireConsentementMesure(stock(null)), null);
  assert.equal(lireConsentementMesure(stock("GRANTED")), null);
  assert.equal(mesureConsentie(stock("granted")), true);
  assert.equal(mesureConsentie(stock("denied")), false);
  assert.equal(mesureConsentie(stock(null)), false, "première visite : non");
  assert.equal(mesureConsentie({ getItem: () => { throw new Error("SecurityError"); } }), false, "stockage bloqué : non");
  assert.equal(mesureConsentie(), false, "hors navigateur : non");
});

test("consentement : la clé et les valeurs sont celles qu'écrit la bannière", () => {
  const banniere = lire("src/components/ConsentBanner.tsx");
  assert.match(banniere, new RegExp(`const STORAGE_KEY = "${CLE_CONSENTEMENT_MESURE}";`));
  assert.match(banniere, /type ConsentValue = "granted" \| "denied";/);
  assert.match(banniere, /localStorage\.setItem\(STORAGE_KEY, value\)/);
  // Chaque changement de choix est annoncé à PostHog, y compris la réouverture qui l'efface.
  assert.equal((banniere.match(/annoncerChangement\(\);/g) ?? []).length, 2);
});

test("URL : l'adresse, le dossier, le secret Stripe et le fragment ne partent pas", () => {
  assert.equal(
    nettoyerUrl("https://futur-e.fr/checkout/dossier?banId=17300_1234_00012&label=12%20rue%20des%20Fleurs%2017000&insee=17300&code=LANCEMENT"),
    "https://futur-e.fr/checkout/dossier?insee=17300",
  );
  assert.equal(nettoyerUrl("/rapport/logement?dossierId=0b0b0b0b-0000-4000-8000-000000000000"), "/rapport/logement");
  assert.equal(
    nettoyerUrl("https://futur-e.fr/dossier/merci?payment_intent=pi_123&payment_intent_client_secret=pi_123_secret_abc&redirect_status=succeeded"),
    "https://futur-e.fr/dossier/merci",
  );
  assert.equal(nettoyerUrl("https://futur-e.fr/#access_token=abc&refresh_token=def"), "https://futur-e.fr/");
  assert.equal(nettoyerUrl("/comparateur?communes=17300,44109&utm_source=lettre&gclid=xyz"), "/comparateur?communes=17300%2C44109&utm_source=lettre");
  assert.equal(nettoyerUrl("mailto:hello@futur-e.fr?subject=Mon%20adresse"), "mailto:hello@futur-e.fr");
  assert.equal(nettoyerUrl("/territoire/17300"), "/territoire/17300", "sans paramètre : inchangée");
});

test("texte : les URLs incluses sont réduites, le reste du texte est gardé", () => {
  assert.equal(
    nettoyerUrlsDansTexte('a.lien:attr__href="/checkout/dossier?label=12%20rue&insee=17300"href="/checkout/dossier?label=12%20rue&insee=17300"nth-child="1"'),
    'a.lien:attr__href="/checkout/dossier?insee=17300"href="/checkout/dossier?insee=17300"nth-child="1"',
  );
  assert.equal(nettoyerUrlsDansTexte("Échec de https://futur-e.fr/api/autour?lat=46.1&lon=-1.1 (500)"), "Échec de https://futur-e.fr/api/autour (500)");
});

test("événement : toutes les places où posthog-js met une URL sont réduites", () => {
  const e = nettoyerEvenement({
    event: "$autocapture",
    properties: {
      $current_url: "https://futur-e.fr/checkout/dossier?label=12%20rue&insee=17300",
      $referrer: "https://futur-e.fr/dossier?banId=x",
      $pathname: "/checkout/dossier",
      $elements_chain: 'a:href="/checkout/dossier?label=12%20rue"',
      $elements: [{ tag_name: "a", attr__href: "/checkout/dossier?label=12%20rue" }],
      $heatmap_data: { "https://futur-e.fr/a?label=1": [{ x: 1 }], "https://futur-e.fr/a?label=2": [{ x: 2 }] },
      $exception_list: [{ type: "Error", value: "fetch /api/x?q=12%20rue failed" }],
      nombre: 3,
      libre: "texte sans URL ? oui",
    },
    $set_once: { $initial_current_url: "https://futur-e.fr/rapport?dossierId=abc" },
  });
  assert.equal(e.properties.$current_url, "https://futur-e.fr/checkout/dossier?insee=17300");
  assert.equal(e.properties.$referrer, "https://futur-e.fr/dossier");
  assert.equal(e.properties.$elements_chain, 'a:href="/checkout/dossier"');
  assert.deepEqual(e.properties.$elements, [{ tag_name: "a", attr__href: "/checkout/dossier" }]);
  assert.deepEqual(e.properties.$heatmap_data, { "https://futur-e.fr/a": [{ x: 1 }, { x: 2 }] }, "deux clés fusionnées, sans le paramètre");
  assert.deepEqual(e.properties.$exception_list, [{ type: "Error", value: "fetch /api/x failed" }]);
  assert.equal(e.properties.nombre, 3);
  assert.equal(e.properties.libre, "texte sans URL ? oui");
  assert.equal(e.$set_once?.$initial_current_url, "https://futur-e.fr/rapport");
});

test("purge : traces PostHog effacées (stockages et cookies, domaines parents), rien d'autre", () => {
  const fabriquer = (cles: string[]) => {
    const m = new Map(cles.map((k) => [k, "x"]));
    return { m, get length() { return m.size; }, key: (i: number) => [...m.keys()][i] ?? null, removeItem: (k: string) => void m.delete(k) };
  };
  const local = fabriquer(["ph_phc_abc_posthog", "__ph_opt_in_out_phc_abc", "futuree-consent", "futuree-theme", "futuree:quartier-workbook:u1"]);
  const session = fabriquer(["ph_phc_abc_window_id", "futuree-recherche"]);
  const ecrits: string[] = [];
  const doc = { get cookie() { return "ph_phc_abc_posthog=%7B%7D; sb-access=1; __ph_opt_in_out_phc_abc=1"; }, set cookie(v: string) { ecrits.push(v); } };
  purgerTracesPostHog({ local, session, document: doc, hote: "www.futur-e.fr" });
  assert.deepEqual([...local.m.keys()], ["futuree-consent", "futuree-theme", "futuree:quartier-workbook:u1"]);
  assert.deepEqual([...session.m.keys()], ["futuree-recherche"]);
  assert.ok(ecrits.includes("ph_phc_abc_posthog=; Max-Age=0; path=/; domain=futur-e.fr"));
  assert.ok(ecrits.includes("__ph_opt_in_out_phc_abc=; Max-Age=0; path=/"));
  assert.ok(!ecrits.some((c) => c.startsWith("sb-access")), "le cookie de session Supabase n'est pas touché");
  assert.deepEqual(domainesDeCookie("www.futur-e.fr"), ["www.futur-e.fr", "futur-e.fr"]);
  assert.deepEqual(domainesDeCookie("localhost"), []);
  // Aucune clé de futur•e ne doit tomber sous les préfixes purgés : on relève toutes les chaînes
  // littérales du code qui commencent par ces préfixes. Seul le nom du champ de formulaire
  // `ph_distinct_id` (jamais stocké) et les préfixes eux-mêmes sont attendus.
  const sources = fs.readdirSync(path.join(RACINE, "src"), { recursive: true }) as string[];
  const trouvees = new Set<string>();
  for (const f of sources) {
    if (!/\.(ts|tsx)$/.test(f) || /\.test\./.test(f)) continue;
    for (const m of fs.readFileSync(path.join(RACINE, "src", f), "utf8").matchAll(/["'`]((?:ph_|__ph_opt_in_out_)[\w-]*)["'`]/g)) trouvees.add(m[1]);
  }
  assert.deepEqual([...trouvees].sort(), ["__ph_opt_in_out_", "ph_", "ph_distinct_id"]);
});

test("serveur : un identifiant de mesure absent, vide ou bricolé ne produit aucun événement", () => {
  assert.equal(identifiantMesureConsenti(undefined), null);
  assert.equal(identifiantMesureConsenti(""), null);
  assert.equal(identifiantMesureConsenti("a b"), null);
  assert.equal(identifiantMesureConsenti(42), null);
  assert.equal(identifiantMesureConsenti(" 0197f3a2-1b2c-7000-8000-abcdef012345 "), "0197f3a2-1b2c-7000-8000-abcdef012345");
});

// ── 2. Le pilotage, exécuté contre une doublure du SDK ────────────────────────────────────────

type Appel = [string, ...unknown[]];
function installer(consentement: string | null) {
  const local = new Map<string, string>();
  if (consentement) local.set(CLE_CONSENTEMENT_MESURE, consentement);
  local.set("ph_phc_test_posthog", "{\"distinct_id\":\"ancien\"}"); // trace d'avant FUT-181
  const stockage = {
    getItem: (k: string) => local.get(k) ?? null, setItem: (k: string, v: string) => void local.set(k, v),
    removeItem: (k: string) => void local.delete(k), key: (i: number) => [...local.keys()][i] ?? null,
    get length() { return local.size; },
  };
  const g = globalThis as Record<string, unknown>;
  const avant = { window: g.window, document: g.document };
  g.window = { localStorage: stockage, sessionStorage: null, location: { hostname: "localhost" } };
  g.document = { cookie: "" };
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = "phc_test";

  const appels: Appel[] = [];
  const etat = { loaded: false, optIn: false, distinct: "anon-1", userState: "anonymous", config: {} as Record<string, unknown> };
  const ph = {
    get __loaded() { return etat.loaded; },
    init(_t: string, cfg: Record<string, unknown>) { appels.push(["init"]); etat.loaded = true; etat.config = cfg; (cfg.loaded as () => void)(); },
    opt_in_capturing(o: unknown) { appels.push(["opt_in", o]); etat.optIn = true; },
    opt_out_capturing() { appels.push(["opt_out"]); etat.optIn = false; },
    has_opted_in_capturing: () => etat.optIn,
    set_config(c: unknown) { appels.push(["set_config", c]); },
    stopSessionRecording() { appels.push(["stop_recording"]); },
    reset(d?: boolean) { appels.push(["reset", d ?? false]); etat.distinct = `anon-${appels.length}`; etat.userState = "anonymous"; etat.optIn = false; },
    identify(id: string, ...rest: unknown[]) { appels.push(["identify", id, ...rest]); etat.distinct = id; etat.userState = "identified"; },
    get_distinct_id: () => etat.distinct,
    get_property: (k: string) => (k === "$user_state" ? etat.userState : undefined),
    capture(...a: unknown[]) { appels.push(["capture", ...a]); },
  };

  const cache = new Map<string, { exports: Record<string, unknown> }>();
  const charger = (fichier: string): Record<string, unknown> => {
    let f = path.resolve(fichier);
    if (!fs.existsSync(f)) for (const ext of [".ts", ".tsx"]) if (fs.existsSync(f + ext)) { f += ext; break; }
    const deja = cache.get(f);
    if (deja) return deja.exports;
    const m = { exports: {} as Record<string, unknown> };
    cache.set(f, m);
    const req = (spec: string): unknown => {
      if (spec === "posthog-js") return { __esModule: true, default: ph };
      if (spec.startsWith("@/")) return charger(path.join(RACINE, "src", spec.slice(2)));
      return require(spec);
    };
    const code = ts.transpileModule(fs.readFileSync(f, "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
    vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: f })(req, m, m.exports);
    return m.exports;
  };
  const mod = charger(path.join(RACINE, "src/lib/mesure-audience.ts")) as {
    synchroniserMesure: () => void; definirCompte: (id: string | null) => void; identifiantMesure: () => string | undefined; mesureActive: () => boolean;
    CONFIG_POSTHOG: Record<string, unknown>;
  };
  const restaurer = () => { g.window = avant.window; g.document = avant.document; };
  return { mod, appels, etat, local, restaurer, noms: () => appels.map((a) => a[0]) };
}

test("pilotage : première visite et refus → aucun init, aucune identité, traces effacées", () => {
  for (const choix of [null, "denied"]) {
    const n = installer(choix);
    try {
      n.mod.synchroniserMesure();
      n.mod.definirCompte("user-1");
      assert.deepEqual(n.noms(), [], `consentement ${choix} : le SDK n'est jamais touché`);
      assert.equal(n.mod.mesureActive(), false);
      assert.equal(n.mod.identifiantMesure(), undefined, "aucun identifiant transmis au serveur");
      assert.equal(n.local.has("ph_phc_test_posthog"), false, "identifiant déposé avant FUT-181 : effacé");
    } finally { n.restaurer(); }
  }
});

test("pilotage : acceptation → init puis ouverture, identité par UUID sans e-mail", () => {
  const n = installer("granted");
  try {
    n.mod.synchroniserMesure();
    assert.deepEqual(n.noms(), ["init", "opt_in"]);
    assert.deepEqual(n.appels[1][1], { captureEventName: false });
    assert.equal(n.etat.config.opt_out_capturing_by_default, true);
    assert.equal(n.etat.config.disable_session_recording, true);
    assert.equal(n.etat.config.request_batching, false, "rien de capté avant un retrait ne reste en file");
    assert.equal(n.etat.config.mask_all_text, true);
    assert.equal(typeof n.etat.config.before_send, "function");
    n.mod.definirCompte("user-1");
    assert.deepEqual(n.appels.at(-1), ["identify", "user-1"], "un seul argument : aucune propriété, donc aucun e-mail");
    assert.equal(n.mod.identifiantMesure(), "user-1");
    // before_send relit le consentement à chaque événement : retrait ailleurs → événement abandonné.
    const garde = n.etat.config.before_send as (e: unknown) => unknown;
    const ev = { event: "x", properties: { $current_url: "/a?label=adresse" } };
    assert.deepEqual(garde(ev), { event: "x", properties: { $current_url: "/a" } });
    n.local.set(CLE_CONSENTEMENT_MESURE, "denied");
    assert.equal(garde(ev), null);
  } finally { n.restaurer(); }
});

test("pilotage : retrait → drapeaux coupés, enregistrement arrêté, identité neuve, opt-out, purge ; ré-acceptation sans recharger", () => {
  const n = installer("granted");
  try {
    n.mod.synchroniserMesure();
    n.mod.definirCompte("user-1");
    n.local.set("ph_phc_test_posthog", "{}");
    n.local.set(CLE_CONSENTEMENT_MESURE, "denied");
    n.appels.length = 0;
    n.mod.synchroniserMesure();
    assert.deepEqual(n.noms(), ["set_config", "stop_recording", "reset", "opt_out"]);
    assert.deepEqual(n.appels[0][1], { advanced_disable_feature_flags: true });
    assert.deepEqual(n.appels[2], ["reset", true], "identifiant d'appareil renouvelé aussi");
    assert.equal(n.local.has("ph_phc_test_posthog"), false);
    assert.equal(n.mod.identifiantMesure(), undefined);
    n.mod.definirCompte("user-1");
    assert.equal(n.noms().filter((x) => x === "identify").length, 0, "aucune identification après retrait");

    n.local.set(CLE_CONSENTEMENT_MESURE, "granted");
    n.appels.length = 0;
    n.mod.synchroniserMesure();
    assert.deepEqual(n.noms(), ["set_config", "opt_in", "identify"], "pas de second init : la même page reprend");
  } finally { n.restaurer(); }
});

test("pilotage : déconnexion et changement de compte → identité réinitialisée, jamais fusionnée", () => {
  const n = installer("granted");
  try {
    n.mod.synchroniserMesure();
    n.mod.definirCompte("user-1");
    n.appels.length = 0;
    n.mod.definirCompte(null);
    assert.deepEqual(n.noms(), ["reset", "opt_in"], "déconnecté : identité anonyme neuve, mesure toujours consentie");
    n.mod.definirCompte("user-1");
    n.appels.length = 0;
    n.mod.definirCompte("user-2");
    assert.deepEqual(n.noms(), ["reset", "opt_in", "identify"]);
    assert.deepEqual(n.appels.at(-1), ["identify", "user-2"]);
  } finally { n.restaurer(); }
});

// ── 3. Les sources ────────────────────────────────────────────────────────────────────────────

const fichiersSrc = () => (fs.readdirSync(path.join(RACINE, "src"), { recursive: true }) as string[])
  .filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\./.test(f)).map((f) => `src/${f}`);

test("sources : seul `mesure-audience.ts` initialise ou identifie PostHog dans le navigateur", () => {
  for (const f of fichiersSrc()) {
    const s = lire(f);
    if (f === "src/lib/mesure-audience.ts") continue;
    assert.doesNotMatch(s, /posthog\.init\(/, f);
    if (/from ["']posthog-js["']/.test(s)) assert.doesNotMatch(s, /\.identify\(/, f);
  }
});

test("sources : aucun e-mail ne part vers PostHog (identifiant ou propriété)", () => {
  for (const f of fichiersSrc()) {
    const s = lire(f);
    if (!/posthog|getPostHogClient/.test(s)) continue;
    for (const m of s.matchAll(/\.(?:capture|identify)\(\{?[\s\S]{0,400}?\}\);/g)) {
      assert.doesNotMatch(m[0], /\bemail\b|user\.email|userEmail/, `${f} : ${m[0].slice(0, 80)}`);
    }
  }
});

test("sources : les six captures serveur n'émettent que sur un identifiant de mesure consenti", () => {
  const routes = [
    "src/app/auth/actions.ts", "src/app/api/comparateur-vie/ask/route.ts", "src/app/api/inscription-pro/route.ts",
    "src/app/api/stripe/webhook/route.ts", "src/app/api/stripe/create-payment-intent/route.ts",
  ];
  for (const f of routes) {
    const s = lire(f);
    assert.match(s, /identifiantMesureConsenti\(/, f);
    assert.doesNotMatch(s, /sanitizeDistinctId\(/, `${f} : plus de repli sur un autre identifiant`);
  }
  const webhook = lire("src/app/api/stripe/webhook/route.ts");
  assert.match(webhook, /metadata\[METADATA_MESURE_CONSENTIE\] === "1"/);
  assert.doesNotMatch(webhook, /[\s{]dossier_id: dossier\.id/);
  const pro = lire("src/app/api/inscription-pro/route.ts");
  const proprietesPro = pro.slice(pro.indexOf("'pro_inscription_submitted'")).split("\n")[1];
  assert.equal(proprietesPro.trim(), "properties: { profession, cabinet_renseigne: Boolean(cabinet), besoin_renseigne: Boolean(besoin) },", "ni e-mail, ni cabinet, ni texte libre");
  // La télémétrie du modèle (qna) reste sans personne : identifiant constant, aucun profil.
  const qna = lire("src/app/qna/route.ts");
  assert.match(qna, /distinctId: "anonymous"/);
  assert.match(qna, /\$process_person_profile: false/);
});

test("sources : le $pageview attend la mesure active ET la session relue", () => {
  const p = lire("src/components/PostHogProvider.tsx");
  assert.match(p, /const pretAMesurer = \(\) => mesureActive\(\) && identiteConnue\(\);/);
  assert.match(p, /useSyncExternalStore\(souscrireMesure, pretAMesurer, sansMesureCoteServeur\)/);
  // Une session illisible ne bloque pas la mesure pour toujours : elle vaut « aucun compte ».
  assert.match(p, /\(\) => definirCompte\(null\),/);
});

