// FUT-143 · LA VRAIE ROUTE `POST /api/dossier/qualification`, AVEC LA SONDE DU BÂTIMENT.
//
// Importée telle quelle, avec les vrais lecteurs ADEME et RNB (`dpe.ts`, `rnb.ts`). Ne sont doublés que le
// client Supabase (visiteur anonyme), le cadastre (hors sujet) et `fetch`, qui sert les réponses publiques
// relevées le 26/10/2026 (`__fixtures__/fut80/`). Aucun réseau, aucune base, aucun paiement.
//
// Ce qui est vérifié : ce que la route rend (la matière, le devis), et les appels qu'elle fait. La sonde ne
// doit ni bloquer la qualification, ni être lancée quand un diagnostic existe à l'adresse.
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";

const MOCKS: Record<string, string> = {
  "server-only": "",
  "next/server": "export const NextResponse = { json: (b, i) => Response.json(b, i) };",
  "@/lib/supabase/server": "export const createClient = async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } });",
  "@/lib/cadastre": "export const probeCadastreAtPoint = async () => ({ status: 'found' });",
};
const HOOKS = `
let ROOT, MOCKS;
export async function initialize(d) { ROOT = d.root; MOCKS = d.mocks; }
export async function resolve(s, c, next) {
  if (Object.hasOwn(MOCKS, s)) return { url: "fut143-mock:" + s, shortCircuit: true };
  if (s.startsWith("@/")) {
    for (const ext of [".ts", ".tsx", "/index.ts", ""]) {
      try { return await next(ROOT + "src/" + s.slice(2) + ext, c); } catch {}
    }
  }
  if (s.startsWith(".") && !/\\.[a-z]+$/.test(s)) {
    try { return await next(s + ".ts", c); } catch {}
  }
  return next(s, c);
}
export async function load(url, c, next) {
  if (url.startsWith("fut143-mock:")) return { format: "module", source: MOCKS[url.slice(12)], shortCircuit: true };
  return next(url, c);
}`;
register("data:text/javascript," + encodeURIComponent(HOOKS), {
  data: { root: new URL("../../", import.meta.url).href, mocks: MOCKS },
});

type Fixture = { ban: string; label: string; insee: string; rnb: unknown; ademe_adresse: unknown[]; ademe_batiment: unknown[] };
const fx = (nom: string): Fixture => JSON.parse(readFileSync(new URL(`./__fixtures__/fut80/${nom}.json`, import.meta.url), "utf8"));

// ─── Le réseau, servi depuis les fixtures ───────────────────────────────────────────────────────────────
type Scenario = {
  adresse: unknown[];
  rnb: unknown | "panne" | "lent";
  batiment: unknown[] | "panne";
  /** Un des deux jeux ADEME tombe sur la recherche par bâtiment. */
  batimentPartiel?: boolean;
  /** La base annonce plus de lignes que la page lue (`total` > `results`). */
  batimentTronque?: boolean;
};
let scenario: Scenario;
let appels: string[];

function servir(url: string): Promise<Response> {
  const u = new URL(url);
  if (u.hostname === "rnb-api.beta.gouv.fr") {
    appels.push("rnb");
    if (scenario.rnb === "panne") return Promise.resolve(new Response("", { status: 503 }));
    if (scenario.rnb === "lent") return new Promise(() => {});
    return Promise.resolve(Response.json(scenario.rnb));
  }
  if (u.hostname === "data.ademe.fr") {
    const qs = u.searchParams.get("qs") ?? "";
    const neuf = u.pathname.includes("dpe02neuf");
    if (qs.startsWith("identifiant_ban:")) {
      appels.push(`ademe:adresse:${neuf ? "neuf" : "existant"}`);
      const lignes = neuf ? [] : scenario.adresse;
      return Promise.resolve(Response.json({ total: lignes.length, results: lignes }));
    }
    if (qs.startsWith("id_rnb:")) {
      appels.push(`ademe:batiment:${neuf ? "neuf" : "existant"}`);
      if (scenario.batiment === "panne" || (scenario.batimentPartiel && neuf)) return Promise.resolve(new Response("", { status: 500 }));
      const lignes = neuf ? [] : scenario.batiment;
      return Promise.resolve(Response.json({ total: lignes.length + (scenario.batimentTronque && !neuf ? 50 : 0), results: lignes }));
    }
  }
  throw new Error(`appel inattendu : ${url}`);
}
globalThis.fetch = ((input: string | URL | Request) => servir(typeof input === "string" ? input : input instanceof URL ? input.href : input.url)) as typeof fetch;

const { POST } = await import("../app/api/dossier/qualification/route.ts");

function requete(f: Fixture) {
  return new Request("http://localhost/api/dossier/qualification", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250)}` },
    body: JSON.stringify({ address: {
      banId: f.ban, label: f.label, postcode: "00000", city: "X", citycode: f.insee, latitude: 45.7, longitude: 4.9, type: "housenumber",
    } }),
  });
}

beforeEach(() => { appels = []; });

const villeurbanne = fx("villeurbanne_angle");

test("Villeurbanne : aucun DPE à l'adresse, des candidats de logement au bâtiment → `memeBatiment: candidats`", async () => {
  scenario = { adresse: [], rnb: villeurbanne.rnb, batiment: villeurbanne.ademe_batiment };
  const res = await POST(requete(villeurbanne));
  assert.equal(res.status, 200);
  const corps = await res.json();
  assert.equal(corps.status, "qualified");
  assert.deepEqual(corps.matter, { dpe: "none", parcel: "found", memeBatiment: "candidats" });
  // Aucune valeur ne voyage : ni classe, ni numéro, ni nombre de candidats.
  assert.doesNotMatch(JSON.stringify(corps), /etiquette|numero_dpe|"[A-G]"|ETRZ/);
  assert.equal(corps.quote.amountDueCents, corps.quote.basePriceCents, "le devis ne bouge pas");
});

test("DPE exact à l'adresse : aucune recherche au bâtiment, et le contrat reste celui d'avant", async () => {
  const monchaux = fx("monchaux_auto");
  scenario = { adresse: monchaux.ademe_adresse, rnb: monchaux.rnb, batiment: monchaux.ademe_batiment };
  const corps = await (await POST(requete(monchaux))).json();
  assert.deepEqual(corps.matter, { dpe: "found", parcel: "found" });
  assert.equal(appels.filter((a) => a.startsWith("ademe:batiment")).length, 0);
});

test("aucun DPE, aucun candidat de logement (immeuble seul) → `aucun`", async () => {
  const immeuble = (villeurbanne.ademe_batiment as Array<{ type_batiment: string }>).filter((l) => l.type_batiment === "immeuble");
  assert.equal(immeuble.length, 1);
  scenario = { adresse: [], rnb: villeurbanne.rnb, batiment: immeuble };
  const corps = await (await POST(requete(villeurbanne))).json();
  assert.equal(corps.matter.memeBatiment, "aucun");
});

test("liste du bâtiment tronquée : immeuble seul lu → `non_verifie` ; un logement lu → `candidats`", async () => {
  const immeuble = (villeurbanne.ademe_batiment as Array<{ type_batiment: string }>).filter((l) => l.type_batiment === "immeuble");
  scenario = { adresse: [], rnb: villeurbanne.rnb, batiment: immeuble, batimentTronque: true };
  assert.equal((await (await POST(requete(villeurbanne))).json()).matter.memeBatiment, "non_verifie");
  scenario = { adresse: [], rnb: villeurbanne.rnb, batiment: villeurbanne.ademe_batiment, batimentTronque: true };
  assert.equal((await (await POST(requete(villeurbanne))).json()).matter.memeBatiment, "candidats");
});

test("plusieurs bâtiments RNB (Puyravault) → `sans_objet`, et aucune recherche au bâtiment", async () => {
  const puyravault = fx("puyravault_ambigu");
  scenario = { adresse: [], rnb: puyravault.rnb, batiment: [] };
  const corps = await (await POST(requete(puyravault))).json();
  assert.equal(corps.matter.memeBatiment, "sans_objet");
  assert.equal(appels.filter((a) => a.startsWith("ademe:batiment")).length, 0);
});

test("RNB sans bâtiment (Bordeaux) → `sans_objet`", async () => {
  const bordeaux = fx("bordeaux_aucun");
  scenario = { adresse: [], rnb: bordeaux.rnb, batiment: [] };
  assert.equal((await (await POST(requete(bordeaux))).json()).matter.memeBatiment, "sans_objet");
});

test("RNB en panne → `non_verifie`, et la qualification répond quand même", async () => {
  scenario = { adresse: [], rnb: "panne", batiment: villeurbanne.ademe_batiment };
  const res = await POST(requete(villeurbanne));
  assert.equal(res.status, 200);
  const corps = await res.json();
  assert.equal(corps.status, "qualified");
  assert.equal(corps.matter.memeBatiment, "non_verifie");
});

test("ADEME en panne au bâtiment → `non_verifie` ; partiellement, des candidats lus restent établis", async () => {
  scenario = { adresse: [], rnb: villeurbanne.rnb, batiment: "panne" };
  assert.equal((await (await POST(requete(villeurbanne))).json()).matter.memeBatiment, "non_verifie");
  scenario = { adresse: [], rnb: villeurbanne.rnb, batiment: villeurbanne.ademe_batiment, batimentPartiel: true };
  assert.equal((await (await POST(requete(villeurbanne))).json()).matter.memeBatiment, "candidats");
});

test("RNB qui ne répond pas : la route n'attend pas au-delà du délai de la sonde", async () => {
  scenario = { adresse: [], rnb: "lent", batiment: villeurbanne.ademe_batiment };
  const t = Date.now();
  const corps = await (await POST(requete(villeurbanne))).json();
  const duree = Date.now() - t;
  assert.equal(corps.status, "qualified");
  assert.equal(corps.matter.memeBatiment, "non_verifie");
  assert.ok(duree < 3_000, `${duree} ms`);
});

test("ADEME muette À L'ADRESSE : `unavailable`, pas de sonde au bâtiment (on ne sait pas qu'il n'y a « aucun »)", async () => {
  scenario = { adresse: [], rnb: villeurbanne.rnb, batiment: villeurbanne.ademe_batiment };
  const avant = globalThis.fetch;
  globalThis.fetch = ((input: string) => (String(input).includes("identifiant_ban") ? Promise.resolve(new Response("", { status: 502 })) : avant(input))) as typeof fetch;
  try {
    const corps = await (await POST(requete(villeurbanne))).json();
    assert.deepEqual(corps.matter, { dpe: "unavailable", parcel: "found" });
    assert.equal(appels.filter((a) => a.startsWith("ademe:batiment")).length, 0);
  } finally {
    globalThis.fetch = avant;
  }
});
