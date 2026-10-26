// FUT-80 · REVUE INDÉPENDANTE DU 26/10/2026 (`be86f4c7`) : LES REPRODUCTIONS DE WORK, SUR LES VRAIES ROUTES.
//
// Les routes `POST /api/logement-dpe` et `POST /api/logement-dpe/numero` sont importées telles quelles, avec
// les vraies fonctions de lecture et d'écriture du dossier (`getDossier`, `buildDpeSelectionFields`,
// `updateOwnedAddressDossier`, `updateOwnedAddressDossierSi`, `lireDerniereVersion`) et les vrais lecteurs
// ADEME et RNB (`dpe.ts`, `rnb.ts`). Ne sont doublés que l'authentification (`requireCurrentUser`), le client
// Supabase (une base en mémoire dont l'UPDATE applique son WHERE en une seule étape, comme Postgres) et
// `fetch`, qui sert les réponses publiques relevées le 26/10/2026 (`__fixtures__/fut80/`). Aucun réseau,
// aucune base réelle, aucun appel Anthropic.
//
// Chaque défaut a son test, et chaque test dit ce qu'il observait sur `be86f4c7` : il échouait alors.
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";

// ─── Modules doublés ────────────────────────────────────────────────────────────────────────────────────
const MOCKS: Record<string, string[]> = {
  "server-only": [],
  "@/lib/user-account": ["requireCurrentUser"],
  "@supabase/supabase-js": ["createClient"],
};
const HOOKS = `
let ROOT, MOCKS;
export async function initialize(d) { ROOT = d.root; MOCKS = d.mocks; }
export async function resolve(s, c, next) {
  if (Object.hasOwn(MOCKS, s)) return { url: "fut80-mock:" + s, shortCircuit: true };
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
  if (url.startsWith("fut80-mock:")) {
    const nom = url.slice("fut80-mock:".length);
    const source = MOCKS[nom].map((f) =>
      "export const " + f + " = (...a) => globalThis.__fut80.appel(" + JSON.stringify(nom) + ", " + JSON.stringify(f) + ", a);"
    ).join("\\n");
    return { format: "module", source, shortCircuit: true };
  }
  return next(url, c);
}`;
register("data:text/javascript," + encodeURIComponent(HOOKS), {
  data: { root: new URL("../../", import.meta.url).href, mocks: MOCKS },
});

// ─── La base en mémoire ─────────────────────────────────────────────────────────────────────────────────
type Ligne = Record<string, unknown>;
type Base = { address_dossiers: Ligne[]; logement_report_versions: Ligne[] };
let base: Base;
/** Chaque écriture appliquée, dans l'ordre où la base l'a appliquée. */
let ecritures: Array<{ statut: unknown; dpe: unknown }>;

class Requete {
  private filtres: Array<(l: Ligne) => boolean> = [];
  private patch: Ligne | null = null;
  private tri: [string, boolean] | null = null;
  private table: keyof Base;
  constructor(table: keyof Base) { this.table = table; }
  select() { return this; }
  update(p: Ligne) { this.patch = p; return this; }
  eq(c: string, v: unknown) { this.filtres.push((l) => l[c] === v); return this; }
  is(c: string, v: unknown) { this.filtres.push((l) => (l[c] ?? null) === v); return this; }
  order(c: string, o: { ascending: boolean }) { this.tri = [c, o.ascending]; return this; }
  limit() { return this; }
  // AUCUN `await` AVANT L'ÉCRITURE : le filtre et l'application se font dans le même pas, comme l'UPDATE
  // … WHERE de Postgres, qui verrouille la ligne et réévalue sa condition sur la version la plus récente.
  maybeSingle() {
    let lignes = base[this.table].filter((l) => this.filtres.every((f) => f(l)));
    if (this.patch) {
      for (const l of lignes) {
        Object.assign(l, this.patch);
        ecritures.push({ statut: this.patch.dpe_selection_status, dpe: this.patch.selected_dpe_id });
      }
    }
    if (this.tri) {
      const [c, asc] = this.tri;
      lignes = [...lignes].sort((a, b) => (Number(a[c]) - Number(b[c])) * (asc ? 1 : -1));
    }
    return Promise.resolve({ data: lignes[0] ? structuredClone(lignes[0]) : null, error: null });
  }
}
const client = { from: (t: keyof Base) => new Requete(t) };
let utilisateur = "alice";

(globalThis as Record<string, unknown>).__fut80 = {
  appel(module: string, fn: string) {
    if (module === "@supabase/supabase-js") return client;
    if (module === "@/lib/user-account") return Promise.resolve({ supabase: client, user: { id: utilisateur } });
    throw new Error(`mock absent : ${module}.${fn}`);
  },
};

// ─── Les sources publiques, servies depuis les relevés ─────────────────────────────────────────────────
type Fixture = { ban: string; label: string; insee: string; rnb: { results: Ligne[]; next?: unknown }; ademe_adresse: Ligne[]; ademe_batiment: Ligne[] };
const fx = (nom: string): Fixture => JSON.parse(readFileSync(new URL(`./__fixtures__/fut80/${nom}.json`, import.meta.url), "utf8"));

type Sources = {
  /** Les lignes ADEME par identifiant BAN (jeu existants), et le `total` annoncé (défaut : leur nombre). */
  parBan: Map<string, { lignes: Ligne[]; total?: number }>;
  parRnb: Map<string, Ligne[]>;
  toutes: Ligne[];
  /** Le corps RNB par adresse, ou un code HTTP de panne. Une liste : les pages successives. */
  rnb: Map<string, unknown>;
};
let sources: Sources;
let appelsRnb: string[];
/** Retient les réponses ADEME de la liste d'une adresse jusqu'à ce que le test les libère. */
let porteAdeme: Promise<void> | null;

const json = (corps: unknown, status = 200) => new Response(JSON.stringify(corps), { status });
globalThis.fetch = (async (entree: string | URL) => {
  const u = new URL(String(entree));
  if (u.hostname === "data.ademe.fr") {
    const qs = u.searchParams.get("qs") ?? "";
    const neuf = u.pathname.includes("dpe02neuf");
    const legacy = u.pathname.includes("dpe-france");
    const m = /^(\w+):"(.+)"$/.exec(qs);
    if (!m) throw new Error(`requête ADEME inattendue : ${qs}`);
    const [, champ, valeur] = m;
    if (champ === "identifiant_ban") {
      if (porteAdeme) await porteAdeme;
      const s = neuf ? { lignes: [] } : (sources.parBan.get(valeur) ?? { lignes: [] });
      return json({ total: s.total ?? s.lignes.length, results: s.lignes });
    }
    if (champ === "id_rnb") {
      const lignes = neuf ? [] : (sources.parRnb.get(valeur) ?? []);
      return json({ total: lignes.length, results: lignes });
    }
    if (champ === "numero_dpe") {
      const l = legacy || neuf ? undefined : sources.toutes.find((x) => x.numero_dpe === valeur);
      return json({ total: l ? 1 : 0, results: l ? [l] : [] });
    }
    throw new Error(`champ ADEME inattendu : ${champ}`);
  }
  if (u.hostname === "rnb-api.beta.gouv.fr") {
    const ban = u.searchParams.get("cle_interop_ban") ?? u.searchParams.get("page_de") ?? "";
    appelsRnb.push(ban);
    const r = sources.rnb.get(ban);
    if (typeof r === "number") return json({ detail: "panne" }, r);
    if (Array.isArray(r)) return json(r[Number(u.searchParams.get("page") ?? 0)]);
    return json(r ?? { next: null, previous: null, results: [] });
  }
  throw new Error(`réseau refusé : ${u.href}`);
}) as typeof fetch;

const { POST } = await import("../app/api/logement-dpe/route.ts");
const { POST: POST_NUMERO } = await import("../app/api/logement-dpe/numero/route.ts");
const { departDpe } = await import("./dpe-attribution-auto.ts");
const { lookupDpeMemeBatiment } = await import("./dpe.ts");

// ─── Mise en place ──────────────────────────────────────────────────────────────────────────────────────
const LE = "2026-10-26T12:00:00.000Z";
function charger(f: Fixture, options: { banFeatureType?: string | null; version?: boolean } = {}) {
  sources = { parBan: new Map(), parRnb: new Map(), toutes: [...f.ademe_adresse, ...f.ademe_batiment], rnb: new Map() };
  sources.parBan.set(f.ban, { lignes: f.ademe_adresse });
  for (const l of f.ademe_batiment) {
    const id = String(l.id_rnb);
    sources.parRnb.set(id, [...(sources.parRnb.get(id) ?? []), l]);
  }
  sources.rnb.set(f.ban, f.rnb);
  base = {
    address_dossiers: [{
      id: "dossier-test", user_id: "alice", access_revoked_at: null, ban_id: f.ban, address_label: f.label, insee: f.insee,
      dpe_selection_status: "pending", dpe_selection_at: null, selected_dpe_id: null, selected_dpe_snapshot: null, selected_dpe_at: null,
    }],
    logement_report_versions: options.version === false ? [] : [{
      dossier_id: "dossier-test", version: 1, report_hash: "h1", collected_at: LE, sources_absentes: [],
      report: { address: { id: f.ban, label: f.label, latitude: 46, longitude: 1 }, banFeatureType: options.banFeatureType === undefined ? "housenumber" : options.banFeatureType },
    }],
  };
}
const dossier = () => base.address_dossiers[0];

beforeEach(() => {
  utilisateur = "alice";
  ecritures = [];
  appelsRnb = [];
  porteAdeme = null;
});

async function appeler(corps: Record<string, unknown>, route = POST, chemin = "/api/logement-dpe") {
  const res = await route(new Request(`http://localhost${chemin}`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ dossierId: "dossier-test", ...corps }),
  }));
  return { status: res.status, corps: (await res.json()) as Record<string, unknown> };
}
const MONCHAUX = "2159N0072016M";
const LA_ROCHELLE = "2417E2613440S";
const VILLEURBANNE_122 = "2169E0007794L";

// ═══ 1. P0 · le statut automatique n'est plus accepté sur parole ════════════════════════════════════════

test("Monchaux : `auto_confirmed` contredit par le bâtiment → refus explicite, aucune écriture, référentiel relu", async () => {
  // Sur be86f4c7 : HTTP 200, `selected_dpe_id` écrit en `auto_confirmed`, zéro appel au référentiel.
  charger(fx("monchaux_auto"));
  const r = await appeler({ status: "auto_confirmed", dpeId: MONCHAUX, source: "liste" });
  assert.equal(r.status, 422);
  assert.deepEqual(r.corps, { error: "AUTO_NON_ADMISSIBLE", refus: "NE_CONVERGE_PAS", veto: "contredit" });
  assert.deepEqual(ecritures, []);
  assert.equal(dossier().dpe_selection_status, "pending");
  assert.deepEqual(appelsRnb, ["59407_0051_00055"]);
});

test("Monchaux : la même maison, choisie À LA MAIN dans la liste, reste enregistrable (sélection explicite préservée)", async () => {
  charger(fx("monchaux_auto"));
  const r = await appeler({ status: "user_confirmed", dpeId: MONCHAUX, source: "liste" });
  assert.equal(r.status, 200);
  assert.deepEqual(ecritures, [{ statut: "user_confirmed", dpe: MONCHAUX }]);
});

test("Monchaux par son numéro : le même BAN ne court-circuite plus le bâtiment ; rattachable à la main, avec la contradiction dite", async () => {
  // Sur be86f4c7 : `/numero` rendait `adresse`, sans confirmation particulière ni mention, sans lire le RNB.
  charger(fx("monchaux_auto"));
  const vue = await appeler({ numero: MONCHAUX }, POST_NUMERO, "/api/logement-dpe/numero");
  assert.equal(vue.corps.niveau, "adresse");
  assert.equal(vue.corps.attachable, true);
  assert.equal(vue.corps.confirmationRequise, true);
  assert.equal(vue.corps.contredit, true);
  assert.deepEqual(ecritures, [], "chercher n'écrit rien");
  const r = await appeler({ status: "auto_confirmed", dpeId: MONCHAUX, source: "numero" });
  assert.equal(r.status, 422);
  assert.equal(r.corps.error, "AUTO_HORS_LISTE");
  const m = await appeler({ status: "user_confirmed", dpeId: MONCHAUX, source: "numero" });
  assert.equal(m.status, 200);
  assert.deepEqual(ecritures, [{ statut: "user_confirmed", dpe: MONCHAUX }]);
});

test("autre entrée du même bâtiment (Villeurbanne, 122) : `auto_confirmed` par numéro refusé ; confirmation manuelle acceptée", async () => {
  // Sur be86f4c7 : HTTP 200 et écriture `auto_confirmed` d'un candidat d'une autre adresse.
  charger(fx("villeurbanne_angle"));
  const r = await appeler({ status: "auto_confirmed", dpeId: VILLEURBANNE_122, source: "numero" });
  assert.equal(r.status, 422);
  assert.equal(r.corps.error, "AUTO_HORS_LISTE");
  assert.deepEqual(ecritures, []);
  // Par la liste, il n'est pas à l'adresse : refusé aussi, sans écriture.
  const l = await appeler({ status: "auto_confirmed", dpeId: VILLEURBANNE_122, source: "liste" });
  assert.equal(l.status, 422);
  assert.deepEqual(ecritures, []);
  const m = await appeler({ status: "user_confirmed", dpeId: VILLEURBANNE_122, source: "numero" });
  assert.equal(m.status, 200);
  assert.deepEqual(ecritures, [{ statut: "user_confirmed", dpe: VILLEURBANNE_122 }]);
});

test("un DPE d'immeuble ne devient jamais celui d'un appartement, par aucune voie", async () => {
  charger(fx("villeurbanne_angle"));
  for (const status of ["user_confirmed", "auto_confirmed"]) {
    const r = await appeler({ status, dpeId: "2569E3207231W", source: "numero" });
    assert.equal(r.status, 422, status);
  }
  assert.deepEqual(ecritures, []);
});

// ═══ 2. P0 · plusieurs bâtiments : aucune attribution automatique ═══════════════════════════════════════

test("La Rochelle, 27 rue des Brandes : trois bâtiments, une maison sans id_rnb → `auto_confirmed` refusé", async () => {
  // Sur be86f4c7 : le vrai LogementModule émettait ce POST, et la route l'enregistrait.
  charger(fx("la_rochelle_trois_batiments"));
  const r = await appeler({ status: "auto_confirmed", dpeId: LA_ROCHELLE });
  assert.equal(r.status, 422);
  assert.equal(r.corps.veto, "ambigu");
  assert.deepEqual(ecritures, []);
});

test("Puyravault : un DPE dont l'id_rnb est l'un des sept bâtiments de l'adresse → refusé aussi", async () => {
  const f = fx("puyravault_ambigu");
  const maison = { ...fx("la_rochelle_trois_batiments").ademe_adresse[0], numero_dpe: "2417E9999999P", identifiant_ban: f.ban, id_rnb: f.rnb.results[0].rnb_id, provenance_id_rnb: "Logiciel" };
  charger({ ...f, ademe_adresse: [maison] });
  const r = await appeler({ status: "auto_confirmed", dpeId: "2417E9999999P" });
  assert.equal(r.status, 422);
  assert.equal(r.corps.veto, "ambigu");
  assert.deepEqual(ecritures, []);
});

test("le cas légitime reste automatique : maison seule, adresse précise, UN bâtiment, liste complète", async () => {
  const f = fx("la_rochelle_trois_batiments");
  charger({ ...f, rnb: { ...f.rnb, results: [f.rnb.results[0]] } });
  const r = await appeler({ status: "auto_confirmed", dpeId: LA_ROCHELLE });
  assert.equal(r.status, 200);
  assert.deepEqual(ecritures, [{ statut: "auto_confirmed", dpe: LA_ROCHELLE }]);
  // Le même diagnostic, désigné une seconde fois (double effet, onglet rechargé) : rien n'est réécrit.
  const bis = await appeler({ status: "auto_confirmed", dpeId: LA_ROCHELLE });
  assert.equal(bis.status, 200);
  assert.equal(ecritures.length, 1);
});

test("la décision vient du serveur, pas du navigateur : type d'adresse lu dans la version, diagnostic exact exigé", async () => {
  const f = fx("la_rochelle_trois_batiments");
  const un = { ...f, rnb: { ...f.rnb, results: [f.rnb.results[0]] } };
  charger(un, { banFeatureType: null });
  assert.equal((await appeler({ status: "auto_confirmed", dpeId: LA_ROCHELLE })).corps.refus, "ADRESSE_IMPRECISE");
  charger(un, { version: false });
  assert.equal((await appeler({ status: "auto_confirmed", dpeId: LA_ROCHELLE })).corps.refus, "ADRESSE_IMPRECISE");
  charger(un);
  const autre = await appeler({ status: "auto_confirmed", dpeId: "2417E0000000Z" });
  assert.equal(autre.corps.refus, "AUTRE_DIAGNOSTIC");
  assert.deepEqual(ecritures, []);
});

// ═══ 3. Le référentiel : panne, bâtiments inadmissibles, réponse incomplète ═════════════════════════════

const unBatiment = (f: Fixture) => ({ ...f, rnb: { ...f.rnb, results: [f.rnb.results[0]] } });

test("une panne du référentiel n'est pas une absence de contradiction : l'automatique est refusé, le manuel reste possible", async () => {
  const f = unBatiment(fx("la_rochelle_trois_batiments"));
  charger(f);
  sources.rnb.set(f.ban, 503);
  const r = await appeler({ status: "auto_confirmed", dpeId: LA_ROCHELLE });
  assert.equal(r.status, 422);
  assert.equal(r.corps.veto, "indisponible");
  assert.deepEqual(ecritures, []);
  const m = await appeler({ status: "user_confirmed", dpeId: LA_ROCHELLE });
  assert.equal(m.status, 200);
});

test("bâtiments inadmissibles ou réponse non vérifiable : le veto ne se perd jamais en « aucun bâtiment »", async () => {
  const f = unBatiment(fx("la_rochelle_trois_batiments"));
  const b = f.rnb.results[0];
  const cas: Array<[string, unknown, string]> = [
    // Sur be86f4c7 : filtré en `non_trouve`, identifiants vides, et la maison repartait en automatique.
    ["démoli seul", { next: null, results: [{ ...b, status: "demolished" }] }, "exclu"],
    ["identifiant désactivé seul", { next: null, results: [{ ...b, is_active: false }] }, "exclu"],
    // Sur be86f4c7 : `notUsable` passait pour un bâtiment ordinaire.
    ["en ruine", { next: null, results: [{ ...b, status: "notUsable" }] }, "en_ruine"],
    // Sur be86f4c7 : un identifiant arbitraire, un `is_active` absent ou un élément invalide donnaient `confirme`.
    ["identifiant arbitraire", { next: null, results: [{ ...b, rnb_id: "x" }] }, "indisponible"],
    ["is_active absent", { next: null, results: [{ rnb_id: b.rnb_id, status: "constructed", addresses: [] }] }, "indisponible"],
    ["élément invalide à côté d'un valide", { next: null, results: [b, { foo: 1 }] }, "indisponible"],
    ["statut inconnu", { next: null, results: [{ ...b, status: "teleported" }] }, "indisponible"],
  ];
  for (const [nom, corps, veto] of cas) {
    charger(f);
    sources.rnb.set(f.ban, corps);
    const r = await appeler({ status: "auto_confirmed", dpeId: LA_ROCHELLE });
    assert.equal(r.status, 422, nom);
    assert.equal(r.corps.veto, veto, nom);
  }
  assert.deepEqual(ecritures, []);
});

test("pagination : une première page à un bâtiment ne prouve pas l'unicité ; les pages suivantes sont lues", async () => {
  // Sur be86f4c7 : `next` était ignoré, et une page partielle à un bâtiment concluait `confirme`.
  const f = fx("la_rochelle_trois_batiments");
  const [b1, b2] = f.rnb.results;
  charger(f);
  const suivante = `https://rnb-api.beta.gouv.fr/api/alpha/buildings/?page_de=${f.ban}&page=1`;
  sources.rnb.set(f.ban, [{ next: suivante, previous: null, results: [b1] }, { next: null, previous: null, results: [b2] }]);
  const r = await appeler({ status: "auto_confirmed", dpeId: LA_ROCHELLE });
  assert.equal(r.corps.veto, "ambigu", "la seconde page est lue : deux bâtiments");
  assert.equal(appelsRnb.length, 2);
  // Un `next` vers un autre hôte n'est pas suivi : la réponse reste incomplète, donc non vérifiable.
  charger(f);
  sources.rnb.set(f.ban, { next: "https://exemple.invalid/page2", previous: null, results: [b1] });
  assert.equal((await appeler({ status: "auto_confirmed", dpeId: LA_ROCHELLE })).corps.veto, "indisponible");
  assert.deepEqual(ecritures, []);
});

test("aucun bâtiment au référentiel (réponse complète et vide) : la règle d'avant FUT-80, sans blocage arbitraire", async () => {
  const f = fx("la_rochelle_trois_batiments");
  charger({ ...f, rnb: { next: null, previous: null, results: [] } });
  const r = await appeler({ status: "auto_confirmed", dpeId: LA_ROCHELLE });
  assert.equal(r.status, 200);
  assert.deepEqual(ecritures, [{ statut: "auto_confirmed", dpe: LA_ROCHELLE }]);
});

// ═══ 4. Les listes ADEME tronquées ══════════════════════════════════════════════════════════════════════

test("liste tronquée : un candidat lu sur quatre-vingts n'est pas un candidat unique", async () => {
  // Sur be86f4c7 : `total` ignoré, la source rendue `present`, et `departDpe` proposait l'automatique.
  const f = unBatiment(fx("la_rochelle_trois_batiments"));
  charger(f);
  sources.parBan.set(f.ban, { lignes: f.ademe_adresse, total: 80 });
  const r = await appeler({ status: "auto_confirmed", dpeId: LA_ROCHELLE });
  assert.equal(r.status, 422);
  assert.equal(r.corps.refus, "LISTE_INCOMPLETE");
  // Trente diagnostics de la même unité, numéros distincts, réduits à un par la déduplication : idem.
  const maison = f.ademe_adresse[0];
  const trente = Array.from({ length: 30 }, (_, i) => ({ ...maison, numero_dpe: `2417E26134${String(i).padStart(2, "0")}S`, numero_etage_appartement: 0, complement_adresse_logement: "Maison 1", surface_habitable_logement: 105.8, date_etablissement_dpe: `2024-01-${String(i + 1).padStart(2, "0")}` }));
  charger(f);
  sources.parBan.set(f.ban, { lignes: trente, total: 80 });
  const t = await appeler({ status: "auto_confirmed", dpeId: "2417E2613429S" });
  assert.equal(t.corps.refus, "LISTE_INCOMPLETE");
  assert.deepEqual(ecritures, []);
});

// ═══ 5. Candidats distincts du même bâtiment ════════════════════════════════════════════════════════════

test("deux maisons du même bâtiment RNB à deux adresses, même étage, complément et surface : deux candidats", async () => {
  // Sur be86f4c7 : un seul candidat restait, l'autre disparaissait sans preuve d'identité.
  const base0 = fx("villeurbanne_angle").ademe_batiment[1];
  const commun = { id_rnb: "ETRZP8JQ3DNK", numero_etage_appartement: 0, complement_adresse_logement: "Maison 1", surface_habitable_logement: 105.8, type_batiment: "maison", methode_application_dpe: "dpe maison individuelle" };
  const a = { ...base0, ...commun, numero_dpe: "2569E0000122A", identifiant_ban: "69266_3620_00122", date_etablissement_dpe: "2025-03-01" };
  const b = { ...base0, ...commun, numero_dpe: "2569E0000124B", identifiant_ban: "69266_3620_00124", date_etablissement_dpe: "2025-04-01" };
  sources = { parBan: new Map(), parRnb: new Map([["ETRZP8JQ3DNK", [a, b, a]]]), toutes: [], rnb: new Map() };
  const r = await lookupDpeMemeBatiment("ETRZP8JQ3DNK", "69266_0110_00002");
  assert.deepEqual(r.candidates.map((c: { id_dpe: string }) => c.id_dpe).sort(), ["2569E0000122A", "2569E0000124B"]);
  // Le même diagnostic renvoyé deux fois (`a` en double) n'est compté qu'une fois.
  assert.equal(r.candidates.length, 2);
});

// ═══ 6. P0 · une écriture automatique tardive n'écrase jamais un geste explicite ════════════════════════

/** Lance une attribution automatique dont la lecture ADEME est retenue jusqu'à `liberer()`. */
function autoRetenue(dpeId: string) {
  let liberer!: () => void;
  porteAdeme = new Promise<void>((r) => { liberer = r; });
  const enCours = appeler({ status: "auto_confirmed", dpeId });
  return { enCours, liberer: () => { porteAdeme = null; liberer(); } };
}
const legitime = () => charger(unBatiment(fx("la_rochelle_trois_batiments")));
const attendreLecture = () => new Promise((r) => setTimeout(r, 10));

test("refus PUIS automatique retardée : la base garde le refus, et l'automatique répond 409", async () => {
  // Sur be86f4c7 : ordre des écritures `not_in_list` → `auto_confirmed`, le refus était écrasé.
  legitime();
  const auto = autoRetenue(LA_ROCHELLE);
  await attendreLecture();
  const refus = await appeler({ status: "not_in_list" });
  assert.equal(refus.status, 200);
  auto.liberer();
  const r = await auto.enCours;
  assert.equal(r.status, 409);
  assert.equal(r.corps.error, "DECISION_PLUS_RECENTE");
  assert.deepEqual(ecritures, [{ statut: "not_in_list", dpe: null }]);
  assert.equal(dossier().dpe_selection_status, "not_in_list");
});

test("sélection explicite PUIS automatique retardée : le choix du lecteur reste", async () => {
  const f = unBatiment(fx("la_rochelle_trois_batiments"));
  charger(f);
  const auto = autoRetenue(LA_ROCHELLE);
  await attendreLecture();
  // Le lecteur désigne le même diagnostic à la main : c'est sa confirmation qui doit rester, pas l'automatique.
  porteAdeme = null;
  const choix = await appeler({ status: "user_confirmed", dpeId: LA_ROCHELLE });
  assert.equal(choix.status, 200);
  auto.liberer();
  assert.equal((await auto.enCours).status, 409);
  assert.deepEqual(ecritures, [{ statut: "user_confirmed", dpe: LA_ROCHELLE }]);
});

test("retrait PUIS automatique retardée : le retrait daté reste, rien n'est réattribué", async () => {
  legitime();
  const auto = autoRetenue(LA_ROCHELLE);
  await attendreLecture();
  assert.equal((await appeler({ status: "pending" })).status, 200);
  auto.liberer();
  assert.equal((await auto.enCours).status, 409);
  assert.equal(dossier().dpe_selection_status, "pending");
  assert.notEqual(dossier().dpe_selection_at, null);
  assert.deepEqual(ecritures, [{ statut: "pending", dpe: null }]);
});

test("automatique PUIS refus : le refus, plus récent, l'emporte", async () => {
  legitime();
  assert.equal((await appeler({ status: "auto_confirmed", dpeId: LA_ROCHELLE })).status, 200);
  assert.equal((await appeler({ status: "not_in_list" })).status, 200);
  assert.deepEqual(ecritures, [{ statut: "auto_confirmed", dpe: LA_ROCHELLE }, { statut: "not_in_list", dpe: null }]);
  assert.equal(dossier().selected_dpe_id, null);
});

test("réponses inversées : deux propositions concurrentes, une seule écriture ; puis un refus tardif en réseau gagne quand même", async () => {
  legitime();
  const a = autoRetenue(LA_ROCHELLE);
  const b = appeler({ status: "auto_confirmed", dpeId: LA_ROCHELLE });
  await attendreLecture();
  a.liberer();
  const [ra, rb] = await Promise.all([a.enCours, b]);
  assert.deepEqual([ra.status, rb.status], [200, 200], "la seconde constate le même choix, sans le réécrire");
  assert.equal(ecritures.length, 1);
  // Un refus dont la requête arrive APRÈS (réseau lent) reste le geste le plus récent : il s'écrit.
  assert.equal((await appeler({ status: "not_in_list" })).status, 200);
  assert.equal(dossier().dpe_selection_status, "not_in_list");
});

test("après la course, le dossier rechargé restaure le refus et ne repropose rien", async () => {
  legitime();
  const auto = autoRetenue(LA_ROCHELLE);
  await attendreLecture();
  await appeler({ status: "not_in_list" });
  auto.liberer();
  await auto.enCours;
  const row = dossier() as { dpe_selection_status: string; dpe_selection_at: string | null };
  assert.equal(departDpe(row, [], "housenumber", true).kind, "restaurer");
});

// ═══ 7. Droits et historique ════════════════════════════════════════════════════════════════════════════

test("propriété, révocation et dossiers historiques : refus sans écriture ni source, aucun choix réécrit", async () => {
  legitime();
  utilisateur = "bob";
  assert.equal((await appeler({ status: "auto_confirmed", dpeId: LA_ROCHELLE })).status, 403);
  utilisateur = "alice";
  dossier().access_revoked_at = LE;
  assert.equal((await appeler({ status: "auto_confirmed", dpeId: LA_ROCHELLE })).status, 403);
  assert.equal((await appeler({ status: "not_in_list" })).status, 403);
  assert.deepEqual(appelsRnb, [], "aucune source interrogée sans droit");
  // Un dossier déjà attribué automatiquement avant FUT-80 n'est jamais réécrit par une nouvelle proposition.
  legitime();
  Object.assign(dossier(), { dpe_selection_status: "auto_confirmed", selected_dpe_id: "2417E1111111A", dpe_selection_at: "2026-09-01T00:00:00Z" });
  const r = await appeler({ status: "auto_confirmed", dpeId: LA_ROCHELLE });
  assert.equal(r.status, 409);
  assert.equal(r.corps.error, "DECISION_DEJA_PRISE");
  assert.deepEqual(ecritures, []);
  assert.equal(dossier().selected_dpe_id, "2417E1111111A");
});
