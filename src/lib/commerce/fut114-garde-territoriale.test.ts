// FUT-114 · AUCUN ACHAT HORS MÉTROPOLE, MÊME EN APPELANT LA ROUTE EN DIRECT.
//
// Deux étages. D'abord la règle pure (`communeVendable`, `ensembleVendable`) contre le VRAI référentiel
// (`src/data/accueil-communes.json`). Ensuite la VRAIE route `POST /api/stripe/create-payment-intent`,
// importée telle quelle : seuls Stripe, Supabase, la BAN, PostHog et le droit territorial sont simulés, et
// chaque appel qui produirait un effet de bord est journalisé. Pour chaque refus, le test démontre
// qu'aucun PaymentIntent n'a été demandé à Stripe et qu'aucune écriture (intention de dossier, instantané
// de comparatif) n'a eu lieu. Aucun réseau, aucune base, aucun appel Stripe réel.
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import {
  communeVendable, ensembleVendable, normaliserCodeCommune,
  REFUS_COMPARATIF_OUTREMER, REFUS_NON_IDENTIFIE, REFUS_OUTREMER, REFUS_SANS_COMMUNE,
} from "./eligibilite-territoriale.ts";

// ─── Le référentiel réel ───────────────────────────────────────────────────────────────────────────────
const REFERENTIEL = (JSON.parse(readFileSync(new URL("../../data/accueil-communes.json", import.meta.url), "utf8")) as {
  communes: Record<string, unknown>;
}).communes;
const connue = (c: string) => Object.hasOwn(REFERENTIEL, c);

const METROPOLE = ["33063", "67482", "75056", "75101", "75120", "69123", "69381", "69389", "13055", "13201", "13216", "2A004", "2B033"];
const OUTREMER = [
  "97101", // Les Abymes, Guadeloupe
  "97209", // Fort-de-France, Martinique
  "97302", // Cayenne, Guyane
  "97411", // Saint-Denis, La Réunion
  "97611", // Mamoudzou, Mayotte
  "97502", // Saint-Pierre-et-Miquelon
  "97701", // Saint-Barthélemy
  "97801", // Saint-Martin
  "98735", // Papeete, Polynésie française
  "98818", // Nouméa, Nouvelle-Calédonie
  "98613", // Wallis-et-Futuna
];
const FALSIFIES: unknown[] = ["99999", "00000", "20004", "2C004", "7510", "751010", "75 056", "abcde", "33063;", 75056, {}, ["75056"], true];

test("règle : la métropole, la Corse et les codes PLM (commune et arrondissements) sont vendables", () => {
  for (const c of METROPOLE) assert.deepEqual(communeVendable(c, connue), { ok: true, insee: c }, c);
  assert.deepEqual(communeVendable(" 2a004 ", connue), { ok: true, insee: "2A004" }, "forme du COG rétablie");
});

test("règle : tout code ultramarin est refusé, avec le motif « hors V1 »", () => {
  for (const c of OUTREMER) assert.deepEqual(communeVendable(c, connue), REFUS_OUTREMER, c);
  // Même si un référentiel futur les contenait : le périmètre V1 prime sur la présence dans l'index.
  for (const c of OUTREMER) assert.deepEqual(communeVendable(c, () => true), REFUS_OUTREMER, c);
});

test("règle : un code absent, mal formé ou inconnu est refusé", () => {
  for (const c of [undefined, null, "", "   "]) assert.deepEqual(communeVendable(c, connue), REFUS_SANS_COMMUNE, String(c));
  for (const c of FALSIFIES) assert.deepEqual(communeVendable(c, connue), REFUS_NON_IDENTIFIE, JSON.stringify(c));
  assert.equal(normaliserCodeCommune("2A004"), "2A004");
  assert.equal(normaliserCodeCommune("2C004"), null);
});

test("règle : un comparatif est refusé entièrement dès qu'un candidat l'est", () => {
  assert.deepEqual(ensembleVendable(["75056", "2A004", "13201"], connue), { ok: true, insees: ["75056", "2A004", "13201"] });
  assert.deepEqual(ensembleVendable(["75056", "97101", "69123"], connue), REFUS_COMPARATIF_OUTREMER);
  assert.deepEqual(ensembleVendable(["99999", "97411"], connue), REFUS_COMPARATIF_OUTREMER, "l'outre-mer est nommé en priorité");
  assert.deepEqual(ensembleVendable(["75056", "99999", "69123"], connue), REFUS_NON_IDENTIFIE);
  assert.deepEqual(ensembleVendable(["75056", undefined], connue), REFUS_NON_IDENTIFIE);
});

test("règle : les messages sont lisibles, sans tiret cadratin, et disent qu'aucun paiement n'est engagé", () => {
  for (const r of [REFUS_OUTREMER, REFUS_COMPARATIF_OUTREMER, REFUS_NON_IDENTIFIE, REFUS_SANS_COMMUNE]) {
    assert.ok(!r.error.includes("—"), r.error);
    assert.match(r.error, /Aucun paiement n’a été engagé\.$/);
  }
  assert.match(REFUS_OUTREMER.error, /France métropolitaine, Corse comprise/);
});

// ─── La route réelle, effets de bord simulés ──────────────────────────────────────────────────────────
const MOCKS: Record<string, string[]> = {
  "server-only": [],
  "@/lib/stripe": ["getStripe"],
  "@/lib/supabase/server": ["createClient"],
  "@/lib/posthog-server": ["getPostHogClient"],
  "@/lib/ban": ["fetchBanFeaturesByLabel"],
  "@/lib/active-territory": ["hasPaidTerritory"],
  "@/lib/server/intention-dossier-store": ["storeIntentionsSupabase"],
  "@supabase/supabase-js": ["createClient"],
};
const HOOKS = `
import { readFileSync } from "node:fs";
let ROOT, MOCKS;
export async function initialize(d) { ROOT = d.root; MOCKS = d.mocks; }
export async function resolve(s, c, next) {
  if (s === "next/server") return next("next/server.js", c);
  if (Object.hasOwn(MOCKS, s)) return { url: "fut114-mock:" + s, shortCircuit: true };
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
  if (url.startsWith("fut114-mock:")) {
    const nom = url.slice("fut114-mock:".length);
    const source = MOCKS[nom].map((f) =>
      "export const " + f + " = (...a) => globalThis.__fut114.appel(" + JSON.stringify(nom) + ", " + JSON.stringify(f) + ", a);"
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

type Journal = { stripeCreate: unknown[]; intentions: unknown[]; snapshots: unknown[]; captures: unknown[]; getUser: number; ban: number };
let journal: Journal;
let banFeatures: unknown[] = [];
let territoirePaye = false;
const USER = { id: "00000000-0000-4000-8000-000000000114", email: "fut114@example.invalid", user_metadata: { full_name: "Camille Test" } };

(globalThis as Record<string, unknown>).__fut114 = {
  appel(module: string, fn: string, args: unknown[]) {
    if (module === "@/lib/stripe") {
      return {
        paymentIntents: {
          create: async (params: unknown) => {
            journal.stripeCreate.push(params);
            return { id: "pi_test_fut114", client_secret: "pi_test_fut114_secret_x", status: "requires_payment_method" };
          },
          retrieve: async () => ({ status: "requires_payment_method" }),
        },
      };
    }
    if (module === "@/lib/supabase/server") {
      return Promise.resolve({
        auth: { getUser: async () => { journal.getUser += 1; return { data: { user: USER } }; } },
        from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { user_project: null }, error: null }) }) }) }),
      });
    }
    if (module === "@/lib/posthog-server") {
      return { capture: (e: unknown) => journal.captures.push(e), shutdown: async () => {} };
    }
    if (module === "@/lib/ban") { journal.ban += 1; return Promise.resolve(banFeatures); }
    if (module === "@/lib/active-territory") return Promise.resolve(territoirePaye);
    if (module === "@/lib/server/intention-dossier-store") {
      return {
        insererSiAbsente: async (ligne: unknown) => { journal.intentions.push(ligne); return true; },
        mettreAJourSiOuverte: async () => { throw new Error("inattendu"); },
        verrouillerSiOuverte: async () => { throw new Error("inattendu"); },
        lire: async () => null,
      };
    }
    if (module === "@supabase/supabase-js") {
      return { from: () => ({ upsert: async (ligne: unknown) => { journal.snapshots.push(ligne); return { error: null }; } }) };
    }
    throw new Error(`mock absent : ${module}.${fn}(${args.length})`);
  },
};

const { POST } = await import("../../app/api/stripe/create-payment-intent/route.ts");

beforeEach(() => {
  journal = { stripeCreate: [], intentions: [], snapshots: [], captures: [], getUser: 0, ban: 0 };
  banFeatures = [];
  territoirePaye = false;
});

async function appeler(corps: Record<string, unknown>) {
  const res = await POST(new Request("http://localhost/api/stripe/create-payment-intent", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps),
  }));
  return { status: res.status, body: await res.json() as Record<string, unknown> };
}
function aucunEffet(quoi: string) {
  assert.equal(journal.stripeCreate.length, 0, `${quoi} : aucun PaymentIntent`);
  assert.equal(journal.intentions.length, 0, `${quoi} : aucune intention de dossier`);
  assert.equal(journal.snapshots.length, 0, `${quoi} : aucun instantané de comparatif`);
  assert.equal(journal.captures.length, 0, `${quoi} : aucun événement de paiement`);
}
function metadata() { return (journal.stripeCreate[0] as { metadata: Record<string, string>; amount: number }); }

const territoire = (targetInsee: unknown) => ({ productType: "one-shot", targetInsee, targetCommune: "X", source: "comparateur_vie" });
const adresse = (citycode: string, banCitycode = citycode, extra: Record<string, unknown> = {}) => {
  const banId = `${banCitycode}_voie_00001`;
  banFeatures = [{ id: banId, type: "housenumber", citycode: banCitycode, label: `1 rue Test ${banCitycode}`, city: "Ville", postcode: "00000", latitude: 45, longitude: 2 }];
  return {
    productType: "address-dossier", checkoutAttemptId: "attempt-fut114-1",
    address: { banId, label: `1 rue Test ${citycode}`, postcode: "00000", city: "Ville", citycode, latitude: 45, longitude: 2, type: "housenumber" },
    ...extra,
  };
};
const comparatif = (insees: unknown[], mode: "choix" | "replay" = "choix") => ({
  productType: "pack-decision",
  pack: { mode, trio: insees.map((insee) => ({ insee, commune: "C" })), projetLabel: "", ...(mode === "replay" ? { parsedSnapshot: {} } : {}) },
});

test("route · territoire métropolitain, PLM et Corse : acceptés, la commune vérifiée part au webhook", async () => {
  for (const c of ["33063", "75056", "75104", "69123", "69383", "13055", "13208", "2A004", "2B033"]) {
    journal.stripeCreate = [];
    const r = await appeler(territoire(c));
    assert.equal(r.status, 200, `${c} : ${JSON.stringify(r.body)}`);
    assert.equal(journal.stripeCreate.length, 1, c);
    assert.equal(metadata().amount, 1400, c);
    assert.equal(metadata().metadata.targetInsee, c, c);
  }
  journal.stripeCreate = [];
  await appeler(territoire("2a004"));
  assert.equal(metadata().metadata.targetInsee, "2A004", "la casse corse est normalisée");
});

test("route · territoire ultramarin : refusé avant la session, sans Stripe ni écriture", async () => {
  for (const c of OUTREMER) {
    const r = await appeler(territoire(c));
    assert.equal(r.status, 422, c);
    assert.equal(r.body.code, "TERRITORY_NOT_ELIGIBLE", c);
    assert.equal(r.body.error, REFUS_OUTREMER.error, c);
  }
  aucunEffet("outre-mer");
  assert.equal(journal.getUser, 0, "refusé avant même la lecture de la session");
});

test("route · appel direct avec un code falsifié, inconnu ou absent : refusé avant paiement", async () => {
  for (const c of [...FALSIFIES, undefined, null, ""]) {
    const r = await appeler(territoire(c));
    assert.equal(r.status, 422, JSON.stringify(c));
    assert.equal(r.body.code, "TERRITORY_UNVERIFIED", JSON.stringify(c));
  }
  // L'ancien parcours « sans commune » (/checkout/rapport-complet) : 14 € sans aucun droit territorial.
  const sans = await appeler({ productType: "one-shot" });
  assert.equal(sans.status, 422);
  assert.equal(sans.body.error, REFUS_SANS_COMMUNE.error);
  aucunEffet("codes falsifiés");
});

test("route · adresse métropolitaine (Paris, Lyon, Marseille, Corse) : acceptée, 39 € puis 25 € après territoire", async () => {
  for (const c of ["33063", "75101", "69381", "13201", "2A004"]) {
    journal.stripeCreate = []; journal.intentions = [];
    const r = await appeler(adresse(c));
    assert.equal(r.status, 200, `${c} : ${JSON.stringify(r.body)}`);
    assert.equal(metadata().amount, 3900, c);
    assert.equal((journal.intentions[0] as { insee: string }).insee, c, c);
  }
  territoirePaye = true;
  journal.stripeCreate = [];
  const complement = await appeler(adresse("75101"));
  assert.equal(complement.status, 200);
  assert.equal(metadata().amount, 2500, "complément après territoire");
});

test("route · adresse ultramarine : refusée, même avec un territoire déjà payé ou un code promo", async () => {
  territoirePaye = true;
  for (const c of ["97411", "97209", "97611", "98735"]) {
    const r = await appeler(adresse(c, c, { promoCode: "BETA" }));
    assert.equal(r.status, 422, c);
    assert.equal(r.body.code, "TERRITORY_NOT_ELIGIBLE", c);
  }
  aucunEffet("adresse ultramarine");
});

test("route · adresse falsifiée : la commune de la BAN fait foi, jamais celle du client", async () => {
  // Le client annonce un arrondissement de Paris, la BAN rend l'adresse à La Réunion.
  const r = await appeler(adresse("75101", "97411"));
  assert.equal(r.status, 422);
  assert.equal(r.body.code, "TERRITORY_NOT_ELIGIBLE");
  // Le client annonce La Réunion, la BAN rend une commune inconnue de l'index.
  const r2 = await appeler(adresse("97411", "99999"));
  assert.equal(r2.status, 422);
  assert.equal(r2.body.code, "TERRITORY_UNVERIFIED");
  aucunEffet("adresse falsifiée");
});

test("route · comparatif tout métropolitain (Corse et PLM compris) : accepté", async () => {
  const r = await appeler(comparatif(["75056", "2A004"]));
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(metadata().amount, 3900);
  assert.deepEqual([metadata().metadata.packInsee1, metadata().metadata.packInsee2], ["75056", "2A004"]);
  journal.stripeCreate = []; journal.snapshots = [];
  const r3 = await appeler(comparatif(["69123", "13201", "2b033"], "replay"));
  assert.equal(r3.status, 200, JSON.stringify(r3.body));
  assert.equal((journal.snapshots[0] as { insee_3: string }).insee_3, "2B033");
});

test("route · comparatif mixte ou falsifié : refusé entièrement, sans Stripe ni instantané", async () => {
  for (const trio of [["75056", "97101", "69123"], ["97411", "97209"], ["75056", "99999", "69123"], ["75056", "2C004"], ["75056", null, "13055"]]) {
    const r = await appeler(comparatif(trio, trio.length === 3 ? "replay" : "choix"));
    assert.equal(r.status, 422, JSON.stringify(trio));
  }
  const mixte = await appeler(comparatif(["75056", "97101", "69123"], "replay"));
  assert.equal(mixte.body.error, REFUS_COMPARATIF_OUTREMER.error);
  aucunEffet("comparatif mixte");
  assert.equal(journal.getUser, 0, "refusé avant même la lecture de la session");
});
