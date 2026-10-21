// FUT-119 · LA COMMUNE NOMMÉE EST CELLE DU CODE PAYÉ, À CHAQUE ÉTAPE.
//
// Reproduit sur main 3da725e3 : `/territoire/30189/debloquer?nom=La%20Rochelle` vendait les faits de Nîmes (30189)
// sous le nom de La Rochelle. Le titre de l'onglet, le hero, l'aperçu, le bouton de paiement, les métadonnées
// Stripe, le grant, la facture, le courriel et `user_profiles.active_commune` reprenaient le nom de l'URL, puis
// celui de `body.commune` à l'activation. Le code, lui, restait 30189.
//
// On rend ici la VRAIE page (react-dom/server, composants transpilés), et on appelle les VRAIES routes :
// `create-payment-intent`, `webhook`, `territoire/activer`, `rapport/territoire`. Stripe, Supabase, Resend, la
// facture et PostHog sont simulés en mémoire : aucun réseau, aucune base, aucun paiement réel.
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire, register } from "node:module";
import { pathToFileURL } from "node:url";
import { communeIdentifiee, REFUS_NON_IDENTIFIE } from "./eligibilite-territoriale.ts";

const RACINE = new URL("../../../", import.meta.url).href;
const exiger = createRequire(new URL("package.json", RACINE));
const NEXT_SERVER = pathToFileURL(exiger.resolve("next/server")).href;
const REACT = pathToFileURL(exiger.resolve("react")).href;

// ─── Modules simulés : chaque fonction délègue à `globalThis.__fut119` ─────────────────────────────────────
const proxy = (mod: string, fns: string[]) =>
  fns.map((f) => `export const ${f} = (...a) => globalThis.__fut119.appel(${JSON.stringify(mod)}, ${JSON.stringify(f)}, a);`).join("\n");
const MOCKS: Record<string, string> = {
  "server-only": "export {}",
  "next/server": `import m from ${JSON.stringify(NEXT_SERVER)};
export const NextResponse = m.NextResponse;
export const after = (f) => { globalThis.__fut119.apres.push(f); };`,
  "next/headers": proxy("next/headers", ["headers"]),
  "next/link": `import React from ${JSON.stringify(REACT)};
const { createElement } = React;
export default function Link({ href, children, prefetch, ...p }) { return createElement("a", { href, ...p }, children); }`,
  "next/navigation": `export function notFound() { throw Object.assign(new Error("NEXT_NOT_FOUND"), { notFound: true }); }
export function redirect(u) { throw Object.assign(new Error("NEXT_REDIRECT " + u), { redirect: u }); }
export function useRouter() { return { push: (u) => globalThis.__fut119.navigations.push(u) }; }`,
  "@/components/Navbar": "export default function Navbar() { return null; }",
  "@/components/PaymentWrapper": "export function PaymentWrapper(p) { globalThis.__fut119.paiementUi.push(p); return null; }",
  "@/lib/supabase/server": proxy("@/lib/supabase/server", ["createClient"]),
  "@/lib/user-account": proxy("@/lib/user-account", ["requireCurrentUser"]),
  "@/lib/stripe": proxy("@/lib/stripe", ["getStripe"]),
  "@/lib/posthog-server": proxy("@/lib/posthog-server", ["getPostHogClient"]),
  "@/lib/ban": proxy("@/lib/ban", ["fetchBanFeaturesByLabel"]),
  "@/lib/active-territory": proxy("@/lib/active-territory", ["hasPaidTerritory", "loadTerritoryClaims"]),
  "@/lib/server/intention-dossier-store": proxy("@/lib/server/intention-dossier-store", ["storeIntentionsSupabase"]),
  "@/lib/resend": proxy("@/lib/resend", ["getResend"]),
  "@/lib/server/invoice-store": proxy("@/lib/server/invoice-store", ["issueInvoice"]),
  "@/lib/server/invoice-pdf": proxy("@/lib/server/invoice-pdf", ["renderInvoicePdf"]),
  "@/lib/server/generate-decision-artifact": proxy("@/lib/server/generate-decision-artifact", ["generateDecisionArtifact"]),
  "@supabase/supabase-js": proxy("@supabase/supabase-js", ["createClient"]),
};
const HOOKS = `
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
let ROOT, MOCKS, ts;
export async function initialize(d) {
  ROOT = d.root; MOCKS = d.mocks;
  ts = createRequire(ROOT + "package.json")("typescript");
}
async function premier(candidats, c, next) {
  for (const x of candidats.slice(0, -1)) { try { return await next(x, c); } catch {} }
  return next(candidats[candidats.length - 1], c);
}
export async function resolve(s, c, next) {
  if (Object.hasOwn(MOCKS, s)) return { url: "fut119-mock:" + s, shortCircuit: true };
  if (s.startsWith("@/")) { const b = ROOT + "src/" + s.slice(2); return premier([b + ".ts", b + ".tsx", b + "/index.ts", b], c, next); }
  if (s.startsWith(".") && !/\\.[cm]?[jt]sx?$|\\.json$/.test(s)) return premier([s + ".ts", s + ".tsx", s], c, next);
  return next(s, c);
}
export async function load(url, c, next) {
  if (url.startsWith("fut119-mock:")) return { format: "module", source: MOCKS[url.slice(12)], shortCircuit: true };
  if (url.endsWith(".json")) return { format: "module", source: "export default " + readFileSync(new URL(url), "utf8"), shortCircuit: true };
  if (url.endsWith(".tsx")) {
    const f = fileURLToPath(url);
    const { outputText } = ts.transpileModule(readFileSync(f, "utf8"), {
      fileName: f, compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    });
    return { format: "module", source: outputText, shortCircuit: true };
  }
  return next(url, c);
}`;
register("data:text/javascript," + encodeURIComponent(HOOKS), { data: { root: RACINE, mocks: MOCKS } });

// ─── La base simulée (une seule, lue par le client de session ET par le client admin) ──────────────────────
type Ligne = Record<string, unknown>;
const CLES: Record<string, string[]> = {
  pack_snapshots: ["stripe_payment_intent_id"], report_grants: ["user_id", "insee"], user_accounts: ["user_id"],
  payments: ["stripe_payment_intent_id"], decision_packs: ["user_id", "trio_key"],
};
let tables: Record<string, Ligne[]>;
function fausseBase() {
  return {
    from(table: string) {
      const filtres: [string, unknown][] = [];
      const q = {
        select: () => q, is: () => q, not: () => q, order: () => q, limit: () => q,
        eq: (col: string, v: unknown) => { filtres.push([col, v]); return q; },
        maybeSingle: async () => ({ data: structuredClone((tables[table] ?? []).find((r) => filtres.every(([c, v]) => r[c] === v)) ?? null), error: null }),
        single: async () => ({ data: structuredClone((tables[table] ?? []).find((r) => filtres.every(([c, v]) => r[c] === v)) ?? null), error: null }),
        then: (f: (r: unknown) => void) => f({ data: structuredClone((tables[table] ?? []).filter((r) => filtres.every(([c, v]) => r[c] === v))), error: null }),
        upsert: async (valeur: Ligne | Ligne[]) => {
          const cles = CLES[table] ?? ["id"];
          for (const v of Array.isArray(valeur) ? valeur : [valeur]) {
            const t = (tables[table] ??= []);
            const i = t.findIndex((r) => cles.every((k) => r[k] === v[k]));
            if (i >= 0) t[i] = { ...t[i], ...v }; else t.push({ ...v });
          }
          return { error: null };
        },
        update: (valeurs: Ligne) => ({
          eq: async (col: string, v: unknown) => {
            for (const r of tables[table] ?? []) if (r[col] === v) Object.assign(r, valeurs);
            return { error: null };
          },
        }),
        insert: (ligne: Ligne) => {
          const id = `id_${table}_${(tables[table] ?? []).length + 1}`;
          (tables[table] ??= []).push({ id, ...ligne });
          const r = { data: { id }, error: null };
          return { select: () => ({ single: async () => r }), then: (f: (x: unknown) => void) => f({ error: null }) };
        },
      };
      return q;
    },
  };
}
const base = fausseBase();

// ─── Stripe, session, courriel, facture : en mémoire ──────────────────────────────────────────────────────
type Pi = { id: string; status: string; amount: number; amount_received: number; currency: string; metadata: Record<string, string> };
const USER = { id: "00000000-0000-4000-8000-000000000119", email: "fut119@example.invalid", user_metadata: { full_name: "Camille Test" } };
let session: typeof USER | null;
let paiements: Map<string, Pi>;
let claims: { kind: "grant"; insee: string }[];
const S = {
  apres: [] as unknown[], navigations: [] as string[], paiementUi: [] as Record<string, unknown>[],
  courriels: [] as { html?: string; text?: string; subject?: string }[], factures: [] as unknown[][],
};
(globalThis as Record<string, unknown>).__fut119 = Object.assign(S, {
  appel(module: string, fn: string, args: unknown[]) {
    switch (module) {
      case "@supabase/supabase-js": return base;
      case "@/lib/supabase/server": return Promise.resolve({ ...base, auth: { getUser: async () => ({ data: { user: session } }) } });
      case "@/lib/user-account": return Promise.resolve({ supabase: base, user: session });
      case "@/lib/active-territory": return Promise.resolve(fn === "loadTerritoryClaims" ? claims : false);
      case "next/headers": return Promise.resolve(new Map([["stripe-signature", "sig-valide"]]));
      case "@/lib/posthog-server": return { capture: () => {}, shutdown: async () => {} };
      case "@/lib/resend": return { emails: { send: async (m: never) => { S.courriels.push(m); return { data: { id: "em" }, error: null }; } } };
      case "@/lib/server/invoice-store": S.factures.push(args); return Promise.reject(new Error("facture hors test"));
      case "@/lib/stripe":
        return {
          paymentIntents: {
            create: async (p: { amount: number; currency: string; metadata: Record<string, string> }) => {
              const pi = { id: `pi_test_fut119_${paiements.size + 1}`, status: "requires_payment_method", amount: p.amount, amount_received: 0, currency: p.currency, metadata: p.metadata };
              paiements.set(pi.id, pi);
              return { ...pi, client_secret: `${pi.id}_secret_test` };
            },
            retrieve: async (id: string) => structuredClone(paiements.get(id)),
          },
          webhooks: { constructEvent: (corps: string, sig: string) => { if (sig !== "sig-valide") throw new Error("signature"); return JSON.parse(corps); } },
        };
      default: throw new Error(`mock absent : ${module}.${fn}(${args.length})`);
    }
  },
});

const { renderToStaticMarkup } = await import("react-dom/server");
const page = await import("../../app/(public)/territoire/[insee]/debloquer/page.tsx");
const { POST: activer } = await import("../../app/api/territoire/activer/route.ts");
const { POST: creerPaiement } = await import("../../app/api/stripe/create-payment-intent/route.ts");
const { POST: webhook } = await import("../../app/api/stripe/webhook/route.ts");
const { GET: ouvrirTerritoire } = await import("../../app/(account)/rapport/territoire/route.ts");
const { nomDuReferentiel } = await import("./referentiel-communes.ts");
const { destinationApresConnexion } = await import("../auth-destination.ts");

beforeEach(() => {
  tables = { user_profiles: [{ user_id: USER.id, active_insee_code: null, active_commune: null }] };
  session = USER; paiements = new Map(); claims = [];
  S.apres = []; S.navigations = []; S.paiementUi = []; S.courriels = []; S.factures = [];
});

const texte = (html: string) =>
  html.replace(/<[^>]+>/g, " ").replace(/&#x27;|&apos;/g, "'").replace(/&quot;/g, "\"").replace(/&amp;/g, "&")
    .replace(/&nbsp;| /g, " ").replace(/\s+/g, " ").trim();

/** Ce que reçoit le lecteur pour une URL : le titre d'onglet, le texte rendu, les liens et le panneau de paiement. */
async function ouvrir(chemin: string) {
  const url = new URL(chemin, "http://localhost");
  const insee = decodeURIComponent(url.pathname.split("/")[2]!);
  const searchParams = Object.fromEntries(url.searchParams);
  // Next passe les deux à `generateMetadata` : la page ne doit lire que le code.
  const meta = await page.generateMetadata({ params: Promise.resolve({ insee }), searchParams: Promise.resolve(searchParams) } as never);
  S.paiementUi = [];
  let html: string;
  try {
    html = renderToStaticMarkup(await page.default({ params: Promise.resolve({ insee }), searchParams: Promise.resolve(searchParams) } as never));
  } catch (e) {
    if ((e as { notFound?: boolean }).notFound) return { introuvable: true as const, titre: meta.title as string };
    throw e;
  }
  const liens = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]!.replace(/&amp;/g, "&"));
  return { introuvable: false as const, titre: meta.title as string, texte: texte(html), liens, paiement: S.paiementUi[0] };
}

async function appelerActiver(corps: unknown) {
  const r = await activer(new Request("http://localhost/api/territoire/activer", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps),
  }) as never);
  return { status: r.status, body: await r.json() as Record<string, unknown> };
}
async function appelerPaiement(corps: unknown) {
  const r = await creerPaiement(new Request("http://localhost/api/stripe/create-payment-intent", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps),
  }));
  return { status: r.status, body: await r.json() as Record<string, unknown> };
}
const profil = () => tables.user_profiles!.find((r) => r.user_id === USER.id)!;

// Les couples testés : [code, nom officiel, un nom contradictoire qu'une URL ou un client pourrait envoyer].
const CAS = [
  ["30189", "Nîmes", "La Rochelle"],
  ["17300", "La Rochelle", "Nîmes"],
  ["2A004", "Ajaccio", "Bastia"],
  ["2B033", "Bastia", "Ajaccio"],
  ["75056", "Paris", "Lyon"],
  ["69123", "Lyon", "Marseille"],
  ["13055", "Marseille", "Paris"],
  ["75116", "Paris 16e Arrondissement", "Paris 1er Arrondissement"],
  ["13216", "Marseille 16e Arrondissement", "Lyon"],
] as const;

// ═══ 1. La source canonique ═══════════════════════════════════════════════════════════════════════════════
test("référentiel : chaque code vendable a son nom officiel, Corse et Paris/Lyon/Marseille compris", () => {
  for (const [code, nom] of CAS) assert.equal(nomDuReferentiel(code), nom, code);
  assert.equal(nomDuReferentiel("69381"), "Lyon 1er Arrondissement");
  for (const inconnu of ["99999", "97411", "98818", "2C004", ""]) assert.equal(nomDuReferentiel(inconnu), null, inconnu);
  // Toutes les communes de l'index sont nommées : aucun code vendable ne tombe dans le refus « non identifié ».
  const index = JSON.parse(readFileSync(new URL("../../data/accueil-communes.json", import.meta.url), "utf8")) as { communes: Record<string, unknown> };
  const sansNom = Object.keys(index.communes).filter((c) => !nomDuReferentiel(c));
  assert.deepEqual(sansNom, []);
});

test("règle : un code vendable que le référentiel ne sait pas nommer est refusé, jamais vendu sous un autre nom", () => {
  assert.deepEqual(communeIdentifiee("30189", () => true, () => null), REFUS_NON_IDENTIFIE);
  assert.deepEqual(communeIdentifiee("30189", () => true, () => "Nîmes"), { ok: true, insee: "30189", nom: "Nîmes" });
  assert.equal(communeIdentifiee("97411", () => true, () => "Saint-Denis").ok, false, "l'outre-mer reste hors V1");
});

// ═══ 2. La page de vente : titre, texte rendu, aperçu, bouton, retour d'authentification ═══════════════════
for (const [code, nom, faux] of CAS) {
  test(`page · ${code} sous « ${faux} » : la page, son titre et son paiement nomment ${nom}`, async () => {
    for (const q of [`?nom=${encodeURIComponent(faux)}`, "", `?nom=${encodeURIComponent(nom)}`, `?nom=${encodeURIComponent(faux)}&rank=2&source=comparateur_vie`]) {
      const o = await ouvrir(`/territoire/${code}/debloquer${q}`);
      assert.equal(o.introuvable, false, q);
      if (o.introuvable) return;
      assert.match(o.titre, new RegExp(`^Ouvrir le dossier (de |d'|du |des )?.*${nom.replace(/^(Le|La|Les) /, "")} · futur•e$`), `${q} : ${o.titre}`);
      assert.ok(o.texte.includes(`Dossier de territoire · ${nom} · 14 € une fois`), q);
      assert.match(o.texte, new RegExp(`Avant de choisir ${nom} ?, regardez`), q); // le nom est dans un <span>
      assert.ok(o.texte.includes(`Ouvrir le dossier de ${nom}`), q);
      if (!nom.includes(faux)) assert.ok(!o.texte.includes(faux), `${q} : « ${faux} » ne doit apparaître nulle part`);
      // Le repli « ce territoire » ne remplit plus aucune place du nom (« ce que ce territoire implique » est éditorial).
      assert.doesNotMatch(o.texte, /(choisir|sur|à|simplement|Pourquoi|Est-ce que|dossier de|faveur de|· ) ce territoire/, q);
      // Le panneau de paiement : la commune officielle, le code de l'URL.
      assert.deepEqual(
        { insee: (o.paiement!.grant as Record<string, unknown>).targetInsee, commune: (o.paiement!.grant as Record<string, unknown>).targetCommune },
        { insee: code, commune: nom },
      );
      assert.ok(String(o.paiement!.submitLabel).startsWith("Ouvrir le dossier ") && String(o.paiement!.submitLabel).includes(nom.replace(/^(Le|La|Les) /, "")));
    }
  });
}

test("page · le titre d'onglet suit l'élision et l'article de la commune réelle", async () => {
  assert.equal((await ouvrir("/territoire/30189/debloquer?nom=La%20Rochelle")).titre, "Ouvrir le dossier de Nîmes · futur•e");
  assert.equal((await ouvrir("/territoire/17300/debloquer?nom=N%C3%AEmes")).titre, "Ouvrir le dossier de La Rochelle · futur•e");
  assert.equal((await ouvrir("/territoire/2A004/debloquer?nom=Bastia")).titre, "Ouvrir le dossier d'Ajaccio · futur•e");
  assert.equal((await ouvrir("/territoire/75056/debloquer?nom=Lyon")).titre, "Ouvrir le dossier de Paris · futur•e");
});

test("page · l'aperçu climatique décrit le code, sous le nom du code", async () => {
  // Nîmes et La Rochelle n'ont pas les mêmes projections : l'aperçu sous « La Rochelle » sur 30189 est celui de Nîmes.
  const nimes = await ouvrir("/territoire/30189/debloquer?nom=La%20Rochelle");
  const nimesSansNom = await ouvrir("/territoire/30189/debloquer");
  const rochelle = await ouvrir("/territoire/17300/debloquer");
  assert.ok(!nimes.introuvable && !nimesSansNom.introuvable && !rochelle.introuvable);
  if (nimes.introuvable || nimesSansNom.introuvable || rochelle.introuvable) return;
  assert.equal(nimes.texte, nimesSansNom.texte, "le paramètre nom ne change plus rien à la page");
  assert.ok(nimes.texte.includes("Ce que les projections disent déjà de Nîmes") || nimes.texte.includes("Ce que le dossier examine sur Nîmes"));
  assert.notEqual(nimes.texte, rochelle.texte.replaceAll("La Rochelle", "Nîmes"), "ce sont bien les faits de Nîmes, pas ceux de La Rochelle renommés");
});

test("page · un code inconnu ou ultramarin n'ouvre rien, et son titre ne nomme aucune commune", async () => {
  for (const chemin of ["/territoire/99999/debloquer?nom=Nîmes", "/territoire/97411/debloquer?nom=Saint-Denis", "/territoire/2C004/debloquer?nom=Ajaccio"]) {
    const o = await ouvrir(chemin);
    assert.equal(o.introuvable, true, chemin);
    assert.equal(o.titre, "Dossier de territoire · futur•e", chemin);
  }
});

test("page · retour après authentification : même commune, sans repasser le nom de l'URL", async () => {
  session = null;
  const avant = await ouvrir("/territoire/30189/debloquer?nom=La%20Rochelle&rank=1&source=comparateur_vie");
  assert.ok(!avant.introuvable);
  if (avant.introuvable) return;
  assert.equal(avant.paiement, undefined, "aucun paiement sans compte");
  const connexion = avant.liens.find((l) => l.startsWith("/connexion?next="))!;
  const inscription = avant.liens.find((l) => l.startsWith("/inscription?next="))!;
  for (const lien of [connexion, inscription]) {
    const next = destinationApresConnexion(new URL(lien, "http://localhost").searchParams.get("next"));
    assert.equal(next, "/territoire/30189/debloquer?rank=1&source=comparateur_vie");
    session = USER;
    const apres = await ouvrir(next);
    assert.ok(!apres.introuvable);
    if (apres.introuvable) return;
    assert.ok(apres.texte.includes("Ouvrir le dossier de Nîmes") && !apres.texte.includes("La Rochelle"));
    assert.equal((apres.paiement!.grant as Record<string, unknown>).targetCommune, "Nîmes");
    assert.equal((apres.paiement!.grant as Record<string, unknown>).rank, 1);
    session = null;
  }
});

test("page · plus de faute d'accord sur la commune (« ce territoire est-elle », « ce territoire sera exposée »)", async () => {
  for (const code of ["30189", "76351", "2A004", "75056"]) { // 76351 : Le Havre, nom masculin
    const o = await ouvrir(`/territoire/${code}/debloquer?nom=ce%20territoire`);
    assert.ok(!o.introuvable);
    if (o.introuvable) return;
    assert.doesNotMatch(o.texte, /est-elle|sera exposée|ce territoiresera|où elle se situe/, code);
    assert.match(o.texte, /Est-ce que .+ convient à mon projet \?/, code);
  }
});

// ═══ 3. L'activation : ce que le bouton envoie, ce que la route écrit ═════════════════════════════════════
test("activation · après paiement, le panneau n'envoie que le code, et la base reçoit le nom officiel", async () => {
  const o = await ouvrir("/territoire/30189/debloquer?nom=La%20Rochelle");
  assert.ok(!o.introuvable);
  if (o.introuvable) return;
  const envoyes: { url: string; corps: unknown }[] = [];
  const fetchOrigine = globalThis.fetch;
  globalThis.fetch = (async (url: string, init: { body: string }) => {
    envoyes.push({ url, corps: JSON.parse(init.body) });
    return appelerActiver(JSON.parse(init.body)).then((r) => new Response(JSON.stringify(r.body), { status: r.status }));
  }) as never;
  try {
    // Le `onSuccess` que la page a confié à `PaymentWrapper`, appelé comme après une confirmation Stripe.
    await (o.paiement!.onSuccess as () => Promise<void>)();
  } finally {
    globalThis.fetch = fetchOrigine;
  }
  assert.deepEqual(envoyes, [{ url: "/api/territoire/activer", corps: { insee: "30189" } }]);
  assert.deepEqual(S.navigations, ["/rapport"]);
  assert.equal(profil().active_insee_code, "30189");
  assert.equal(profil().active_commune, "Nîmes");
});

test("activation · un appel direct avec un nom contradictoire écrit le nom officiel ; un code non identifié n'écrit rien", async () => {
  for (const [code, nom, faux] of CAS) {
    const r = await appelerActiver({ insee: code, commune: faux });
    assert.equal(r.status, 200, `${code} ${JSON.stringify(r.body)}`);
    assert.equal(profil().active_insee_code, code);
    assert.equal(profil().active_commune, nom, code);
  }
  assert.equal((await appelerActiver({ insee: "2a004" })).status, 200, "la casse corse est normalisée");
  assert.equal(profil().active_insee_code, "2A004");
  const avant = structuredClone(profil());
  for (const corps of [{ insee: "99999", commune: "Nîmes" }, { insee: "97411" }, { insee: "" }, { commune: "Nîmes" }, { insee: 30189 }]) {
    const r = await appelerActiver(corps);
    assert.equal(r.status, 400, JSON.stringify(corps));
    assert.deepEqual(profil(), avant, `${JSON.stringify(corps)} : aucune écriture`);
  }
  session = null;
  assert.equal((await appelerActiver({ insee: "30189" })).status, 401);
});

// ═══ 4. Le paiement et le webhook : métadonnées, grant, territoire actif, facture, courriel ═══════════════
test("paiement · 14 € : les métadonnées Stripe portent le nom officiel, quel que soit `targetCommune`", async () => {
  for (const [code, nom, faux] of CAS) {
    paiements = new Map();
    const r = await appelerPaiement({ productType: "one-shot", targetInsee: code, targetCommune: faux, source: "comparateur_vie" });
    assert.equal(r.status, 200, `${code} ${JSON.stringify(r.body)}`);
    const pi = [...paiements.values()][0]!;
    assert.equal(pi.amount, 1400);
    assert.equal(pi.metadata.targetInsee, code);
    assert.equal(pi.metadata.targetCommune, nom, code);
  }
});

test("paiement · comparatif : chaque commune de l'instantané et des métadonnées porte son nom officiel", async () => {
  const r = await appelerPaiement({
    productType: "pack-decision",
    pack: { mode: "choix", trio: [{ insee: "30189", commune: "La Rochelle" }, { insee: "2B033", commune: "Ajaccio" }, { insee: "75056", commune: "Lyon" }], projetLabel: "" },
  });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const pi = [...paiements.values()][0]!;
  assert.deepEqual([pi.metadata.packCommune1, pi.metadata.packCommune2, pi.metadata.packCommune3], ["Nîmes", "Bastia", "Paris"]);
  const snap = tables.pack_snapshots![0]!;
  assert.deepEqual([snap.commune_1, snap.commune_2, snap.commune_3], ["Nîmes", "Bastia", "Paris"]);
});

test("webhook · un PaymentIntent créé avant le correctif (nom contradictoire en métadonnées) n'écrit que le nom officiel", async () => {
  const pi: Pi = {
    id: "pi_test_fut119_ancien", status: "succeeded", amount: 1400, amount_received: 1400, currency: "eur",
    metadata: { userId: USER.id, userEmail: USER.email, productType: "one-shot", targetInsee: "30189", targetCommune: "La Rochelle", grantSource: "comparateur_vie", grantRank: "1", buyerName: "Camille Test" },
  };
  paiements.set(pi.id, pi);
  const r = await webhook(new Request("http://localhost/api/stripe/webhook", { method: "POST", body: JSON.stringify({ type: "payment_intent.succeeded", data: { object: pi } }) }));
  assert.equal(r.status, 200);
  assert.deepEqual(tables.report_grants?.map((g) => [g.insee, g.commune]), [["30189", "Nîmes"]]);
  assert.equal(profil().active_insee_code, "30189");
  assert.equal(profil().active_commune, "Nîmes");
  assert.ok(S.factures.length === 1 && JSON.stringify(S.factures[0]).includes("Nîmes") && !JSON.stringify(S.factures[0]).includes("La Rochelle"), "facture");
  assert.equal(S.courriels.length, 1);
  assert.ok(!JSON.stringify(S.courriels[0]).includes("La Rochelle"), "courriel");
  assert.ok(JSON.stringify(S.courriels[0]).includes("Nîmes"), "courriel");
});

test("bout en bout · page → paiement → webhook → activation : aucune ligne ne nomme une autre commune que le code", async () => {
  const o = await ouvrir("/territoire/30189/debloquer?nom=La%20Rochelle&rank=1&source=comparateur_vie");
  assert.ok(!o.introuvable);
  if (o.introuvable) return;
  // Le corps que `PaymentWrapper` enverrait, tel que la page le lui confie (même forme que PaymentWrapper.tsx).
  const g = o.paiement!.grant as { targetInsee: string; targetCommune: string; source: string; rank: number };
  assert.equal((await appelerPaiement({ productType: o.paiement!.productType, ...g, targetCommune: "La Rochelle" })).status, 200);
  const pi = [...paiements.values()][0]!;
  pi.status = "succeeded"; pi.amount_received = pi.amount;
  assert.equal((await webhook(new Request("http://localhost/api/stripe/webhook", { method: "POST", body: JSON.stringify({ type: "payment_intent.succeeded", data: { object: pi } }) }))).status, 200);
  assert.equal((await appelerActiver({ insee: "30189", commune: "La Rochelle" })).status, 200);
  const toutesLesLignes = JSON.stringify(tables);
  assert.ok(!toutesLesLignes.includes("La Rochelle"), toutesLesLignes);
  assert.equal(profil().active_commune, "Nîmes");
  assert.equal(tables.report_grants![0]!.commune, "Nîmes");
});

// ═══ 5. Rouvrir un territoire possédé (`/rapport/territoire?insee=&nom=`) ══════════════════════════════════
test("rouvrir · le nom de l'URL est ignoré ; Corse et arrondissements sont posés au bon grain", async () => {
  const aller = (q: string) => ouvrirTerritoire(new Request(`http://localhost/rapport/territoire?${q}`) as never);
  claims = [{ kind: "grant", insee: "30189" }, { kind: "grant", insee: "2A004" }, { kind: "grant", insee: "75116" }];
  await aller("insee=30189&nom=La%20Rochelle");
  assert.deepEqual([profil().active_insee_code, profil().active_commune], ["30189", "Nîmes"]);
  await aller("insee=2A004&nom=Bastia");
  assert.deepEqual([profil().active_insee_code, profil().active_commune], ["2A004", "Ajaccio"]);
  await aller("insee=75116&nom=Lyon");
  assert.deepEqual([profil().active_insee_code, profil().active_commune], ["75056", "Paris"]);
  // Sans droit sur la commune : rien n'est écrit.
  await aller("insee=17300&nom=La%20Rochelle");
  assert.deepEqual([profil().active_insee_code, profil().active_commune], ["75056", "Paris"]);
});
