// FUT-115 · AUCUN COMPARATIF SANS PAIEMENT QUE STRIPE A CONFIRMÉ.
//
// Les VRAIS points d'entrée serveur, Stripe et la base simulés en mémoire :
//   - `POST /api/stripe/create-payment-intent` crée le PaymentIntent et l'instantané, comme en production ;
//   - `traiterRetourPaiementPack`, ce que fait la page `/comparateur/pack-decision` au retour de Stripe ;
//   - `POST /api/stripe/webhook`, avec un contrôle de signature simulé ;
//   - `grantDecisionPackFromSnapshot`, appelé directement.
// « Payer » consiste ici à faire passer le PaymentIntent simulé à `succeeded`, comme le ferait Stripe : aucun
// paiement réel, aucune donnée bancaire, aucun réseau. Pour chaque refus, le test vérifie l'ABSENCE D'ÉCRITURE
// dans `decision_packs`, `report_grants` et `user_accounts`, pas seulement le statut rendu.
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import { PACK_DECISION_AMOUNT_CENTS, preuvePaiementPack, type PaiementStripe } from "./preuve-paiement-pack.ts";

const MOCKS: Record<string, string[]> = {
  "server-only": [],
  "next/headers": ["headers"],
  "@/lib/stripe": ["getStripe"],
  "@/lib/supabase/server": ["createClient"],
  "@/lib/posthog-server": ["getPostHogClient"],
  "@/lib/ban": ["fetchBanFeaturesByLabel"],
  "@/lib/active-territory": ["hasPaidTerritory"],
  "@/lib/server/intention-dossier-store": ["storeIntentionsSupabase"],
  "@/lib/resend": ["getResend"],
  "@/lib/server/email-log": ["ouvrirEnvoi", "fermerEnvoi"],
  "@/lib/server/invoice-store": ["issueInvoice"],
  "@/lib/server/invoice-pdf": ["renderInvoicePdf"],
  "@/lib/server/generate-decision-artifact": ["generateDecisionArtifact"],
  "@supabase/supabase-js": ["createClient"],
};
const HOOKS = `
import { readFileSync } from "node:fs";
let ROOT, MOCKS;
export async function initialize(d) { ROOT = d.root; MOCKS = d.mocks; }
export async function resolve(s, c, next) {
  if (s === "next/server") return next("next/server.js", c);
  if (Object.hasOwn(MOCKS, s)) return { url: "fut115-mock:" + s, shortCircuit: true };
  if (s.startsWith("@/")) {
    for (const ext of [".ts", ".tsx", "/index.ts", ""]) {
      try { return await next(ROOT + s.slice(2) + ext, c); } catch {}
    }
  }
  if (s.startsWith(".") && !/\\.[a-z]+$/.test(s)) {
    try { return await next(s + ".ts", c); } catch {}
  }
  return next(s, c);
}
export async function load(url, c, next) {
  if (url.startsWith("fut115-mock:")) {
    const nom = url.slice("fut115-mock:".length);
    const source = MOCKS[nom].map((f) =>
      "export const " + f + " = (...a) => globalThis.__fut115.appel(" + JSON.stringify(nom) + ", " + JSON.stringify(f) + ", a);"
    ).join("\\n");
    return { format: "module", source, shortCircuit: true };
  }
  if (url.endsWith(".json")) {
    return { format: "module", source: "export default " + readFileSync(new URL(url), "utf8"), shortCircuit: true };
  }
  return next(url, c);
}`;
register("data:text/javascript," + encodeURIComponent(HOOKS), {
  data: { root: new URL("../../", import.meta.url).href, mocks: MOCKS },
});

// ─── La base simulée ──────────────────────────────────────────────────────────────────────────────────────
type Ligne = Record<string, unknown>;
const CLES: Record<string, string[]> = {
  pack_snapshots: ["stripe_payment_intent_id"],
  decision_packs: ["user_id", "trio_key"],
  report_grants: ["user_id", "insee"],
  user_accounts: ["user_id"],
  payments: ["stripe_payment_intent_id"],
};
let tables: Record<string, Ligne[]>;
let ecrituresTentees: Record<string, number>;
let pannes: Set<string>;
function fausseBase() {
  return {
    from(table: string) {
      const filtres: [string, unknown][] = [];
      const q = {
        select: () => q,
        eq: (col: string, v: unknown) => { filtres.push([col, v]); return q; },
        is: () => q,
        not: () => q,
        maybeSingle: async () => {
          if (pannes.has(`lecture:${table}`)) return { data: null, error: { message: "indisponible" } };
          const l = (tables[table] ?? []).find((r) => filtres.every(([c, v]) => r[c] === v));
          return { data: l ? structuredClone(l) : null, error: null };
        },
        upsert: async (valeur: Ligne | Ligne[]) => {
          ecrituresTentees[table] = (ecrituresTentees[table] ?? 0) + 1;
          if (pannes.has(table)) return { error: { message: "indisponible" } };
          const cles = CLES[table] ?? ["id"];
          for (const v of Array.isArray(valeur) ? valeur : [valeur]) {
            const t = (tables[table] ??= []);
            const i = t.findIndex((r) => cles.every((k) => r[k] === v[k]));
            if (i >= 0) t[i] = { ...t[i], ...v }; else t.push({ ...v });
          }
          return { error: null };
        },
        update: () => ({ eq: async () => ({ error: null }) }),
        insert: async () => ({ error: null }),
      };
      return q;
    },
  };
}
const DROITS = ["decision_packs", "report_grants", "user_accounts"] as const;
function aucunDroit(quoi: string) {
  for (const t of DROITS) assert.equal((tables[t] ?? []).length, 0, `${quoi} : aucune ligne ${t}`);
}

// ─── Stripe simulé ────────────────────────────────────────────────────────────────────────────────────────
let paiements: Map<string, PaiementStripe>;
let compteurPi = 0;
let signature: string | null = null;
let courriels: unknown[];
const ALICE = { id: "00000000-0000-4000-8000-0000000000a1", email: "alice@example.invalid", user_metadata: { full_name: "Alice Test" } };
const BOB = { id: "00000000-0000-4000-8000-0000000000b2", email: "bob@example.invalid", user_metadata: { full_name: "Bob Test" } };
let session: typeof ALICE | null = ALICE;
const base = fausseBase();

(globalThis as Record<string, unknown>).__fut115 = {
  appel(module: string, fn: string, args: unknown[]) {
    switch (module) {
      case "@supabase/supabase-js": return base;
      case "@/lib/supabase/server":
        return Promise.resolve({
          auth: { getUser: async () => ({ data: { user: session } }) },
          from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
        });
      case "@/lib/stripe":
        return {
          paymentIntents: {
            create: async (p: { amount: number; currency: string; metadata: Record<string, string> }) => {
              compteurPi += 1;
              const pi = { id: `pi_test${String(compteurPi).padStart(10, "0")}`, status: "requires_payment_method", amount: p.amount, amount_received: 0, currency: p.currency, metadata: p.metadata };
              paiements.set(pi.id, pi);
              return { ...pi, client_secret: `${pi.id}_secret_test` };
            },
            retrieve: async (id: string) => {
              const pi = paiements.get(id);
              if (!pi) throw Object.assign(new Error(`No such payment_intent: '${id}'`), { type: "StripeInvalidRequestError" });
              return structuredClone(pi);
            },
          },
          webhooks: {
            constructEvent: (corps: string, sig: string) => {
              if (sig !== "sig-valide") throw new Error("signature invalide");
              return JSON.parse(corps);
            },
          },
        };
      case "next/headers": return Promise.resolve(new Map([["stripe-signature", signature]].filter(([, v]) => v != null) as [string, string][]));
      case "@/lib/posthog-server": return { capture: () => {}, shutdown: async () => {} };
      case "@/lib/resend": return { emails: { send: async (m: unknown) => { courriels.push(m); return { data: { id: "em_test" }, error: null }; } } };
      case "@/lib/server/email-log": return fn === "ouvrirEnvoi" ? Promise.resolve(null) : Promise.resolve();
      case "@/lib/server/invoice-store": return Promise.reject(new Error("facture hors test"));
      default: throw new Error(`mock absent : ${module}.${fn}(${args.length})`);
    }
  },
};

const { POST: creerPaiement } = await import("../../app/api/stripe/create-payment-intent/route.ts");
const { POST: webhook } = await import("../../app/api/stripe/webhook/route.ts");
const { traiterRetourPaiementPack } = await import("../server/retour-paiement-pack.ts");
const { grantDecisionPackFromSnapshot, resolvePackOwnership } = await import("../decision-packs.ts");

beforeEach(() => {
  tables = {}; ecrituresTentees = {}; pannes = new Set(); paiements = new Map(); courriels = [];
  session = ALICE; signature = null;
});

const TRIO = ["75056", "69123", "13055"];
async function commanderComparatif(insees = TRIO): Promise<string> {
  const res = await creerPaiement(new Request("http://localhost/api/stripe/create-payment-intent", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ productType: "pack-decision", pack: { mode: "choix", trio: insees.map((insee) => ({ insee, commune: insee })), projetLabel: "" } }),
  }));
  const corps = await res.json() as { clientSecret: string };
  assert.equal(res.status, 200, JSON.stringify(corps));
  // Ce que l'attaquant lit dans son navigateur : l'identifiant est le préfixe du clientSecret.
  return corps.clientSecret.split("_secret_")[0]!;
}
// La page lit le paiement par `getStripe().paymentIntents.retrieve` : même chose ici, sur le Stripe simulé.
const { getStripe } = await import("@/lib/stripe");
const retourPage = (pi: string | undefined, compte: { id: string; email?: string | null } = ALICE) =>
  traiterRetourPaiementPack({ lirePaiement: (id) => getStripe().paymentIntents.retrieve(id) as Promise<PaiementStripe>, admin: base as never }, pi, compte);
function stripeConfirme(pi: string) {
  const p = paiements.get(pi)!;
  p.status = "succeeded"; p.amount_received = p.amount;
}
async function livrerWebhook(pi: string, sig = "sig-valide") {
  signature = sig;
  const corps = JSON.stringify({ type: "payment_intent.succeeded", data: { object: paiements.get(pi) } });
  try {
    const r = await webhook(new Request("http://localhost/api/stripe/webhook", { method: "POST", body: corps }));
    return r.status;
  } catch {
    return 500; // Next répond 500 quand le gestionnaire lève : Stripe rejouera.
  }
}

// ═══ Le défaut d'origine : l'URL suffisait ════════════════════════════════════════════════════════════════
test("défaut d'origine : l'instantané existe dès la création, AVANT tout paiement, et son identifiant est public", async () => {
  const pi = await commanderComparatif();
  assert.equal(paiements.get(pi)!.status, "requires_payment_method");
  assert.equal(tables.pack_snapshots?.length, 1, "instantané écrit avant paiement");
  assert.equal(tables.pack_snapshots![0]!.user_id, ALICE.id);
  // L'ancienne page appelait l'octroi avec ce seul identifiant et le compte de session, sur `redirect_status=succeeded`.
  // La page ne lit plus `redirect_status` et ne passe plus jamais un identifiant nu à l'octroi :
  const page = readFileSync(new URL("../../app/(public)/comparateur/pack-decision/page.tsx", import.meta.url), "utf8");
  assert.ok(!/redirectStatus|redirect_status\s*===/.test(page), "la page ne lit plus redirect_status");
  assert.ok(!page.includes("grantDecisionPackFromSnapshot"), "la page n'octroie plus elle-même");
  assert.ok(page.includes("traiterRetourPaiementPack") && page.includes("paymentIntents.retrieve"), "la page relit le paiement chez Stripe");
});

// ═══ Tentatives refusées ══════════════════════════════════════════════════════════════════════════════════
test("refus · URL de retour recopiée sans paiement (requires_payment_method)", async () => {
  const pi = await commanderComparatif();
  assert.equal(await retourPage(pi), "non_confirme");
  aucunDroit("URL recopiée");
});

test("refus · paiement processing : attente, aucun droit", async () => {
  const pi = await commanderComparatif();
  paiements.get(pi)!.status = "processing";
  assert.equal(await retourPage(pi), "en_attente");
  aucunDroit("processing");
});

test("refus · paiement canceled, requires_action", async () => {
  const pi = await commanderComparatif();
  paiements.get(pi)!.status = "canceled";
  assert.equal(await retourPage(pi), "non_confirme");
  paiements.get(pi)!.status = "requires_action";
  assert.equal(await retourPage(pi), "en_attente");
  aucunDroit("canceled / requires_action");
});

test("refus · identifiant inexistant, falsifié ou mal formé", async () => {
  for (const pi of ["pi_inexistant0000", "pi_test0000000999", "pi_x", "not_a_pi", "pi_test0000000001'; drop", undefined, ""]) {
    const etat = await retourPage(pi as string | undefined);
    assert.ok(etat === "non_confirme" || etat === "aucun", `${pi} → ${etat}`);
  }
  aucunDroit("identifiants falsifiés");
});

test("refus · paiement confirmé d'un AUTRE compte : Bob ne s'ouvre pas le comparatif d'Alice", async () => {
  const pi = await commanderComparatif();
  stripeConfirme(pi);
  assert.equal(await retourPage(pi, BOB), "non_confirme");
  aucunDroit("autre compte");
});

test("refus · PaymentIntent d'un autre produit (dossier de territoire 14 €) présenté au retour du comparatif", async () => {
  const pi = await commanderComparatif();
  const p = paiements.get(pi)!;
  stripeConfirme(pi);
  p.metadata = { ...p.metadata, productType: "one-shot" };
  assert.equal(await retourPage(pi), "non_confirme");
  aucunDroit("autre produit");
});

test("refus · montant ou devise incohérents", async () => {
  const pi = await commanderComparatif();
  stripeConfirme(pi);
  const p = paiements.get(pi)!;
  for (const [amount, currency, received] of [[1400, "eur", 1400], [3900, "usd", 3900], [3900, "eur", 100]] as const) {
    p.amount = amount; p.currency = currency; p.amount_received = received;
    assert.equal(await retourPage(pi), "non_confirme", `${amount} ${currency} reçu ${received}`);
  }
  aucunDroit("montant / devise");
});

test("refus · instantané absent ou appartenant à un autre compte", async () => {
  const pi = await commanderComparatif();
  stripeConfirme(pi);
  tables.pack_snapshots = [];
  assert.equal(await retourPage(pi), "non_confirme", "instantané absent");
  const pi2 = await commanderComparatif();
  stripeConfirme(pi2);
  tables.pack_snapshots!.find((r) => r.stripe_payment_intent_id === pi2)!.user_id = BOB.id;
  assert.equal(await retourPage(pi2), "non_confirme", "instantané de Bob, paiement d'Alice");
  assert.equal(await retourPage(pi2, BOB), "non_confirme", "instantané de Bob, paiement d'Alice, session de Bob");
  aucunDroit("instantané");
});

test("refus · appel direct de la fonction d'octroi sans preuve valide", async () => {
  const pi = await commanderComparatif();
  // L'ancienne signature (un identifiant nu) : aucune preuve, aucune écriture.
  const nu = await grantDecisionPackFromSnapshot(base as never, pi as never, { attendu: ALICE.id });
  assert.equal(nu.ok, false);
  // Un objet qui se prétend confirmé mais ne correspond pas à l'instantané.
  const forge = { id: pi, status: "succeeded", amount: PACK_DECISION_AMOUNT_CENTS, currency: "eur", metadata: { productType: "pack-decision", userId: ALICE.id } };
  assert.deepEqual(await grantDecisionPackFromSnapshot(base as never, forge), { ok: false, motif: "instantane_different" });
  aucunDroit("appel direct");
  assert.equal((ecrituresTentees.decision_packs ?? 0) + (ecrituresTentees.report_grants ?? 0) + (ecrituresTentees.user_accounts ?? 0), 0, "aucune écriture TENTÉE");
});

test("refus · webhook à signature invalide : rien n'est écrit", async () => {
  const pi = await commanderComparatif();
  stripeConfirme(pi);
  assert.equal(await livrerWebhook(pi, "sig-forgee"), 400);
  aucunDroit("signature invalide");
});

// ═══ Cas légitimes ════════════════════════════════════════════════════════════════════════════════════════
function droitsAlice() {
  assert.equal(tables.decision_packs?.length, 1, "un comparatif");
  assert.equal(tables.decision_packs![0]!.user_id, ALICE.id);
  assert.deepEqual((tables.report_grants ?? []).map((g) => g.insee).sort(), [...TRIO].sort(), "un droit par commune");
  assert.ok((tables.report_grants ?? []).every((g) => g.source === "pack_decision" && g.user_id === ALICE.id));
  assert.equal(tables.user_accounts?.[0]?.plan, "one_shot");
}

test("légitime · webhook AVANT le retour : ouvert par le webhook, le retour ne réécrit rien de neuf", async () => {
  const pi = await commanderComparatif();
  stripeConfirme(pi);
  assert.equal(await livrerWebhook(pi), 200);
  droitsAlice();
  assert.equal(tables.payments?.length, 1, "paiement enregistré");
  assert.ok(await resolvePackOwnership(base as never, ALICE.id, TRIO), "le comparatif est lisible");
  assert.equal(await retourPage(pi), "octroye");
  droitsAlice();
});

test("légitime · webhook APRÈS le retour : ouvert dès le retour, le webhook tardif ne duplique rien", async () => {
  const pi = await commanderComparatif();
  stripeConfirme(pi);
  assert.equal(await retourPage(pi), "octroye");
  droitsAlice();
  assert.equal(await livrerWebhook(pi), 200);
  droitsAlice();
});

test("légitime · retour pendant processing, puis confirmation : attente, puis ouverture", async () => {
  const pi = await commanderComparatif();
  paiements.get(pi)!.status = "processing";
  assert.equal(await retourPage(pi), "en_attente");
  aucunDroit("avant confirmation");
  stripeConfirme(pi);
  assert.equal(await retourPage(pi), "octroye", "le rechargement de la page ouvre le comparatif");
  droitsAlice();
});

test("légitime · webhook rejoué et page rafraîchie plusieurs fois : aucune duplication", async () => {
  const pi = await commanderComparatif();
  stripeConfirme(pi);
  for (let i = 0; i < 3; i += 1) assert.equal(await livrerWebhook(pi), 200);
  for (let i = 0; i < 3; i += 1) assert.equal(await retourPage(pi), "octroye");
  droitsAlice();
  assert.equal(tables.payments?.length, 1);
});

test("légitime · comparatif déjà acheté puis racheté (même trio) : une seule ligne, rattachée au dernier paiement", async () => {
  const pi1 = await commanderComparatif();
  stripeConfirme(pi1);
  assert.equal(await livrerWebhook(pi1), 200);
  const pi2 = await commanderComparatif();
  stripeConfirme(pi2);
  assert.equal(await livrerWebhook(pi2), 200);
  droitsAlice();
  assert.equal(tables.decision_packs![0]!.stripe_payment_intent_id, pi2);
});

test("légitime · droits momentanément impossibles à écrire : attente, webhook en 500 (rejoué), puis livraison", async () => {
  const pi = await commanderComparatif();
  stripeConfirme(pi);
  pannes.add("report_grants");
  assert.equal(await retourPage(pi), "en_attente", "la page attend au lieu d'afficher un échec");
  assert.equal(await livrerWebhook(pi), 500, "le webhook échoue : Stripe le rejouera");
  pannes.delete("report_grants");
  assert.equal(await livrerWebhook(pi), 200, "le rejeu livre");
  droitsAlice();
});

test("légitime · instantané momentanément illisible : webhook en 500, rien n'est perdu", async () => {
  const pi = await commanderComparatif();
  stripeConfirme(pi);
  pannes.add("lecture:pack_snapshots");
  assert.equal(await livrerWebhook(pi), 500);
  aucunDroit("lecture impossible");
  pannes.delete("lecture:pack_snapshots");
  assert.equal(await livrerWebhook(pi), 200);
  droitsAlice();
});

test("légitime · comparatif à deux communes (mode choix)", async () => {
  const pi = await commanderComparatif(["75056", "2A004"]);
  stripeConfirme(pi);
  assert.equal(await retourPage(pi), "octroye");
  assert.deepEqual((tables.report_grants ?? []).map((g) => g.insee).sort(), ["2A004", "75056"]);
});

// ═══ La création : un instantané non écrit bloque le paiement ═════════════════════════════════════════════
test("création · instantané impossible à écrire : pas de clientSecret, rien à payer", async () => {
  pannes.add("pack_snapshots");
  const res = await creerPaiement(new Request("http://localhost/api/stripe/create-payment-intent", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ productType: "pack-decision", pack: { mode: "choix", trio: [{ insee: "75056" }, { insee: "69123" }], projetLabel: "" } }),
  }));
  const corps = await res.json() as Record<string, unknown>;
  assert.equal(res.status, 500);
  assert.equal(corps.clientSecret, undefined);
});

// ═══ La règle de preuve, à nu ═════════════════════════════════════════════════════════════════════════════
test("preuve · chaque champ compte", () => {
  const snap = { stripe_payment_intent_id: "pi_a", user_id: "u1", insee_1: "75056", insee_2: "69123", insee_3: null };
  const pi = { id: "pi_a", status: "succeeded", amount: 3900, amount_received: 3900, currency: "eur", metadata: { productType: "pack-decision", userId: "u1", packInsee1: "75056", packInsee2: "69123", packInsee3: "" } };
  assert.deepEqual(preuvePaiementPack(pi, snap, "u1"), { ok: true });
  assert.deepEqual(preuvePaiementPack(pi, snap), { ok: true }, "webhook : sans session");
  assert.equal(preuvePaiementPack({ ...pi, metadata: { ...pi.metadata, packInsee2: "13055" } }, snap).ok, false, "communes payées ≠ instantané");
  assert.equal(preuvePaiementPack({ ...pi, metadata: { ...pi.metadata, userId: "u2" } }, snap).ok, false, "payeur ≠ instantané");
  assert.equal(preuvePaiementPack({ ...pi, id: "pi_b" }, snap).ok, false, "autre paiement");
  assert.equal(preuvePaiementPack(pi, snap, "u2").ok, false, "session ≠ payeur");
});
