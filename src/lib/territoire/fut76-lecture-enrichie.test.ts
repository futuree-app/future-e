// FUT-76 — un repli déterministe n'est jamais une « Lecture enrichie », et la vraie lecture enrichie
// redevient possible. Aucun appel au modèle : le générateur est simulé.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildTerritoireSnapshot } from "./facts.ts";
import { withHash } from "../facts/hash.ts";
import { ensureTerritoireSynthesis, prochainRenouvellementBudget, RETRY_APRES_PANNE_MS, RETRY_APRES_REFUS_MS, type EnsureDeps } from "./synthesis-ensure.ts";
import { synthesisCacheKey } from "./synthesis-cache.ts";
import { displayReducer, eventFromAnswer, initialDisplay, offersEnriched } from "./synthesis-display.ts";
import { checkAssertions, checkNumbers, describeViolations, distinctionExplicite } from "./synthesis-checks.ts";
import { lireLigneSynthese, type TerritoireStore } from "../server/territoire-facts-store.ts";
import { memoryStore } from "./__fixtures__/memory-store.ts";
import { auditSyntheses, chatelaillonInputs } from "./__fixtures__/chatelaillon.ts";

const SNAP = withHash(buildTerritoireSnapshot(chatelaillonInputs(), "2026-09-28T00:00:00.000Z"));
const KEY = synthesisCacheKey(SNAP.hash, "gwl20");
const [MAUVAISE] = auditSyntheses();
const BONNE = `Châtelaillon-Plage à l'horizon 2050

## Ce qui domine

Les sols resteraient secs 136 jours par an d'ici 2050, dans une commune à l'occupation mixte.

## Ce qui tient, ce qui se tend

La population progresse de 0,62 % par an. Des périmètres d'inondation et de submersion marine sont recensés.

## Ce qu'on sous-estime ici

Les restrictions d'eau en vigueur rappellent que la sécheresse n'attend pas 2050.`;
const DETERMINISTE = "Châtelaillon-Plage à l'horizon 2050\n\n## Le territoire aujourd'hui\n\nTexte déterministe.";

/** Une horloge qu'on avance à la main. */
function horloge(debut = Date.parse("2026-10-06T12:00:00Z")) {
  let t = debut;
  return { now: () => new Date(t), avance: (ms: number) => { t += ms; } };
}

function deps(store: TerritoireStore, gen: () => Promise<string>, opts: { budget?: boolean; now?: () => Date } = {}): EnsureDeps & { appels: () => number } {
  let n = 0;
  return {
    store,
    reserveBudget: async () => opts.budget ?? true,
    generate: async () => { n++; return gen(); },
    ...(opts.now ? { now: opts.now } : {}),
    appels: () => n,
  };
}

// ── 1 à 3 : le parcours nominal ─────────────────────────────────────────────────────────────────

test("1. sans cache, la lecture immédiate (déterministe) est affichée tout de suite", () => {
  const s = initialDisplay(null, DETERMINISTE);
  assert.equal(s.shown, "deterministic");
  assert.equal(s.status, "preparing");
});

test("2. une vraie lecture modèle validée est proposée : « Lecture enrichie disponible »", () => {
  const ev = eventFromAnswer({ status: "ready", text: BONNE, origin: "model" }, DETERMINISTE);
  assert.deepEqual(ev, { type: "enrichedArrived", text: BONNE });
  const s = displayReducer(initialDisplay(null, DETERMINISTE), ev!);
  assert.equal(offersEnriched(s), true);
  assert.equal(s.shown, "deterministic");
});

test("3. au clic, c'est le texte du modèle qui s'affiche, sous le badge enrichi", () => {
  let s = displayReducer(initialDisplay(null, DETERMINISTE), { type: "enrichedArrived", text: BONNE });
  s = displayReducer(s, { type: "showEnriched" });
  assert.equal(s.shown, "enriched");
  assert.equal(s.enrichedText, BONNE);
  assert.notEqual(s.enrichedText, DETERMINISTE);
});

test("3 bis. une seconde tentative validée (model_retry) est aussi une vraie lecture enrichie", () => {
  assert.equal(eventFromAnswer({ status: "ready", text: BONNE, origin: "model_retry" }, DETERMINISTE)?.type, "enrichedArrived");
});

// ── 4 à 6 : les échecs ne prennent jamais le badge ──────────────────────────────────────────────

test("4. deux refus : rien d'« enrichi » n'est rendu, l'échec est daté d'un jour", async () => {
  const h = horloge();
  const { store, rows } = memoryStore(SNAP);
  const d = deps(store, async () => MAUVAISE, { now: h.now });
  const r = await ensureTerritoireSynthesis(SNAP, "gwl20", d);
  assert.equal(r.status, "unavailable");
  assert.equal(r.status === "unavailable" && r.reason, "rejected");
  assert.equal(r.status === "unavailable" && r.retryAt?.getTime(), h.now().getTime() + RETRY_APRES_REFUS_MS);
  assert.equal(d.appels(), 2);
  // En base, le repli est un ÉCHEC, jamais une lecture prête.
  assert.equal((await store.readSynthesis(KEY, h.now()))?.status, "failed");
  assert.equal((await store.readSyntheses([KEY])).size, 0);
  assert.equal(rows.get(KEY)?.origin, "deterministic");
});

test("4 bis. le repli tel que l'ancien serveur le renvoyait (`ready` + `deterministic`) n'entre jamais dans l'état enrichi", () => {
  const ev = eventFromAnswer({ status: "ready", text: DETERMINISTE, origin: "deterministic" }, DETERMINISTE);
  assert.deepEqual(ev, { type: "enrichedUnavailable" });
  const s = displayReducer(initialDisplay(null, DETERMINISTE), ev!);
  assert.equal(offersEnriched(s), false);
  assert.equal(displayReducer(s, { type: "showEnriched" }).shown, "deterministic");
});

test("5. erreur du modèle : indisponible, nouvelle tentative permise dans une heure", async () => {
  const h = horloge();
  const { store } = memoryStore(SNAP);
  const r = await ensureTerritoireSynthesis(SNAP, "gwl20", deps(store, async () => { throw new Error("529 overloaded"); }, { now: h.now }));
  assert.equal(r.status === "unavailable" && r.reason, "model");
  assert.equal(r.status === "unavailable" && r.retryAt?.getTime(), h.now().getTime() + RETRY_APRES_PANNE_MS);
});

test("6. budget refusé : aucun appel, nouvelle tentative au renouvellement du budget (minuit UTC suivant)", async () => {
  const h = horloge(Date.parse("2026-10-06T12:00:00Z"));
  const { store } = memoryStore(SNAP);
  const d = deps(store, async () => BONNE, { budget: false, now: h.now });
  const r = await ensureTerritoireSynthesis(SNAP, "gwl20", d);
  assert.equal(r.status === "unavailable" && r.reason, "budget");
  assert.equal(d.appels(), 0);
  assert.equal(r.status === "unavailable" && r.retryAt?.toISOString(), "2026-10-07T00:00:00.000Z");
  // Pas toutes les heures : une heure plus tard, toujours différé, toujours zéro appel.
  h.avance(RETRY_APRES_PANNE_MS + 1);
  assert.equal((await ensureTerritoireSynthesis(SNAP, "gwl20", d)).status === "unavailable", true);
  assert.equal(d.appels(), 0);
  // Au renouvellement, la tentative repart.
  h.avance(Date.parse("2026-10-07T00:00:01Z") - h.now().getTime());
  const apres = await ensureTerritoireSynthesis(SNAP, "gwl20", deps(store, async () => BONNE, { now: h.now }));
  assert.equal(apres.status === "ready" && apres.origin, "model");
});

test("6 bis. le renouvellement du budget est toujours dans les 24 h, au jour UTC suivant", () => {
  assert.equal(prochainRenouvellementBudget(new Date("2026-10-06T00:00:00Z")).toISOString(), "2026-10-07T00:00:00.000Z");
  assert.equal(prochainRenouvellementBudget(new Date("2026-10-06T23:59:59Z")).toISOString(), "2026-10-07T00:00:00.000Z");
  assert.equal(prochainRenouvellementBudget(new Date("2026-12-31T18:00:00Z")).toISOString(), "2027-01-01T00:00:00.000Z");
});

// ── 7 et 8 : les caches existants ───────────────────────────────────────────────────────────────

test("7. ancien cache `ready` + `deterministic` (sans date) : lu comme un échec, retenté tout de suite", async () => {
  const { store, rows } = memoryStore(SNAP);
  rows.set(KEY, { status: "ready", text: DETERMINISTE, origin: "deterministic", lease_until: null });
  assert.deepEqual(await store.readSynthesis(KEY, new Date()), { status: "failed", retryAt: null });
  assert.equal((await store.readSyntheses([KEY])).size, 0);
  const d = deps(store, async () => BONNE);
  const r = await ensureTerritoireSynthesis(SNAP, "gwl20", d);
  assert.equal(r.status === "ready" && r.origin, "model");
  assert.equal(d.appels(), 1);
});

test("8. ancien cache d'origine absente ou inconnue : jamais une lecture enrichie", () => {
  const now = new Date();
  for (const origin of [null, undefined, "", "openai", "Model"]) {
    const e = lireLigneSynthese({ status: "ready", text: BONNE, origin, lease_until: null }, now);
    assert.equal(e?.status, "failed", String(origin));
  }
  assert.deepEqual(lireLigneSynthese({ status: "ready", text: BONNE, origin: "model", lease_until: null }, now), { status: "ready", text: BONNE, origin: "model" });
  assert.equal(eventFromAnswer({ status: "ready", text: BONNE }, DETERMINISTE)?.type, "enrichedUnavailable");
});

test("8 bis. un « enrichi » identique à la lecture immédiate n'est jamais affiché sous un second badge", () => {
  assert.equal(initialDisplay(DETERMINISTE, DETERMINISTE).shown, "deterministic");
  assert.equal(initialDisplay(`  ${DETERMINISTE}\n`, DETERMINISTE).shown, "deterministic");
  assert.equal(eventFromAnswer({ status: "ready", text: DETERMINISTE, origin: "model" }, DETERMINISTE)?.type, "enrichedUnavailable");
  assert.equal(initialDisplay(BONNE, DETERMINISTE).shown, "enriched");
});

// ── 9 : nouvelle tentative, bornée ──────────────────────────────────────────────────────────────

test("9. après un échec, AUCUN appel avant le délai, quel que soit le nombre de visites ; puis une tentative", async () => {
  const h = horloge();
  const { store } = memoryStore(SNAP);
  const reponses = [MAUVAISE, MAUVAISE, BONNE];
  const d = deps(store, async () => reponses.shift()!, { now: h.now });
  await ensureTerritoireSynthesis(SNAP, "gwl20", d);
  assert.equal(d.appels(), 2);
  for (let visite = 0; visite < 50; visite++) {
    const r = await ensureTerritoireSynthesis(SNAP, "gwl20", d);
    assert.equal(r.status === "unavailable" && r.reason, "deferred");
  }
  assert.equal(d.appels(), 2, "cinquante visites, zéro appel");
  h.avance(RETRY_APRES_REFUS_MS + 1);
  const r = await ensureTerritoireSynthesis(SNAP, "gwl20", d);
  assert.equal(r.status === "ready" && r.origin, "model");
  assert.equal(d.appels(), 3);
  // Prête, elle est servie depuis le cache sans nouvel appel.
  const encore = await ensureTerritoireSynthesis(SNAP, "gwl20", d);
  assert.equal(encore.status === "ready" && encore.cached, true);
  assert.equal(d.appels(), 3);
});

test("9 bis. une génération en cours n'est pas reprise par une seconde visite", async () => {
  const { store } = memoryStore(SNAP);
  let lacher!: () => void;
  const d = deps(store, () => new Promise<string>((res) => { lacher = () => res(BONNE); }));
  const premiere = ensureTerritoireSynthesis(SNAP, "gwl20", d);
  await new Promise((r) => setTimeout(r, 0));
  assert.equal((await ensureTerritoireSynthesis(SNAP, "gwl20", d)).status, "pending");
  lacher();
  await premiere;
  assert.equal(d.appels(), 1);
});

// ── La route et le composant ne contournent pas ces règles ──────────────────────────────────────

test("route : un échec n'est jamais « ready », et un échec récent ne consomme pas la limite par adresse", () => {
  const src = readFileSync("src/app/api/synthesize-quartier/route.ts", "utf8");
  assert.match(src, /stored\.status === "failed"\) return NextResponse\.json\(\{ status: "unavailable" \}\)/);
  const post = src.slice(src.indexOf("export async function POST"));
  assert.ok(post.indexOf('stored?.status === "failed"') < post.indexOf("limiteParAdresse(req)"));
});

test("composant : la réponse passe par `eventFromAnswer`, jamais un `ready` traité tel quel", () => {
  const src = readFileSync("src/components/report/QuartierSynthesis.tsx", "utf8");
  assert.match(src, /eventFromAnswer\(a, deterministic\[h\]\)/);
  assert.match(src, /initialDisplay\(initialEnriched\[h\] \?\? null, deterministic\[h\]\)/);
  assert.doesNotMatch(src, /type: "enrichedArrived", text: a\.text/);
});

// ── 10 : les contrôles responsables du repro Toulouse 2030 ──────────────────────────────────────

// Les valeurs RÉELLES de la projection de Toulouse (snapshot 133b86b1…, relu en base le 06/10/2026),
// réduites aux champs que touchent les phrases refusées.
const TOULOUSE_2030 = {
  climat: {
    jours_au_dessus_de_30C: { valeur: 33, ecart_par_rapport_a_1976_2005: 14.6, valeur_de_reference_1976_2005: 18.4 },
    jours_de_sols_secs_par_an: { valeur: 165 },
    periode_de_reference: "1976-2005",
  },
  catastrophes_naturelles_reconnues: { nombre_arretes: 24, premiere_annee: 1982 },
};
const TOULOUSE_2050 = {
  climat: {
    nuits_au_dessus_de_20C: { valeur: 43.6, ecart_par_rapport_a_1976_2005: 29.5, valeur_de_reference_1976_2005: 13.8 },
    temperature_moyenne_hiver_C: { valeur: 8, ecart_par_rapport_a_1976_2005: 2, valeur_de_reference_1976_2005: 6.1 },
  },
};
const regles = (t: string, p: Record<string, unknown>) => [...checkNumbers(t, p), ...checkAssertions(t, p)].map((v) => v.rule);

test("10. Toulouse 2030, tentative 1 : la phrase qui DISTINGUE sols secs et CatNat est acceptée", () => {
  const t = "Les 165 jours de sols secs projetés sur l'année et les 24 arrêtés liés à la sécheresse des sols reconnus depuis 1982 sont deux mesures distinctes : l'une est un indicateur climatique projeté, l'autre retrace des dommages aux bâtiments déjà constatés.";
  assert.deepEqual(regles(t, TOULOUSE_2030), []);
});

test("10. Toulouse 2030, tentative 2 : « l'écart est de presque 15 jours » (écart réel 14,6) est accepté", () => {
  assert.deepEqual(regles("À 33 jours au-dessus de 30 °C projetés, contre 18,4 sur la période 1976-2005, l'écart est de presque 15 jours.", TOULOUSE_2030), []);
  // Le qualificatif garde sa tolérance, sans plus : 25 n'est pas « presque » 14,6.
  assert.ok(regles("L'écart est de presque 25 jours au-dessus de 30 °C.", TOULOUSE_2030).length > 0);
});

test("10. « d'écart » postposé se lit comme un écart (Toulouse 2050, Paris 2050)", () => {
  assert.deepEqual(regles("La température moyenne hivernale projetée est de 8 °C, contre 6,1 °C en référence, soit 2 °C d'écart.", TOULOUSE_2050), []);
  assert.deepEqual(regles("Les nuits au-dessus de 20 °C passent de 13,8 à 43,6, soit 29,5 nuits d'écart.", TOULOUSE_2050), []);
  // La valeur présentée comme un écart reste refusée.
  assert.ok(regles("Soit 43,6 nuits d'écart au-dessus de 20 °C.", TOULOUSE_2050).length > 0);
});

test("10. des NUITS comptées en jours restent refusées, et le motif dit maintenant l'unité", () => {
  const t = "Les nuits au-dessus de 20 °C passent de 13,8 à 43,6, avec un écart de 29,5 jours par rapport à la période de référence.";
  assert.deepEqual(regles(t, TOULOUSE_2050), ["nombre:unite-incoherente"]);
  const [consigne] = describeViolations(checkNumbers(t, TOULOUSE_2050));
  assert.match(consigne, /^nombre:unite-incoherente : .+ → l'unité ne correspond pas/);
  assert.match(consigne, /se comptent en nuits, pas en jours/);
});

test("10. la règle CatNat garde son mordant : continuité affirmée = refus, même avec « distinct »", () => {
  for (const faux of [
    "La sécheresse reconnue en catastrophe naturelle depuis 1982 devrait s'intensifier avec 165 jours de sols secs projetés.",
    "Ce sont deux faits distincts, mais la sécheresse reconnue en catastrophe naturelle annonce les 165 jours de sols secs projetés.",
    "Les 165 jours de sols secs projetés prolongent la sécheresse reconnue en catastrophe naturelle, deux mesures distinctes en apparence.",
    "Cette sécheresse des sols, reconnue en catastrophe naturelle, se poursuit à l'horizon 2030.",
  ]) assert.ok(regles(faux, TOULOUSE_2030).includes("catnat:secheresse-prolongee"), faux);
});

test("10. les cinq distinctions réelles journalisées en base sont reconnues comme telles", () => {
  for (const vrai of [
    "les 165 jours de sols secs projetés sur l'année et les 24 arrêtés liés à la sécheresse des sols reconnus depuis 1982 sont deux mesures distinctes : l'une est un indicateur climatique projeté, l'autre retrace des dommages aux bâtiments déjà constatés.",
    "par ailleurs, 182 jours de sols secs par an sont projetés : des données qui méritent d'être lues séparément des épisodes de sécheresse déjà reconnus en catastrophe naturelle, sans en faire la continuité directe.",
    "par ailleurs, avec 124 jours de sols secs projetés par an, et un arrêté de catastrophe naturelle lié à la sécheresse des sols déjà recensé, ces deux faits coexistent dans les données sans que l'un annonce l'autre.",
    "par ailleurs, 124 jours de sols secs sont projetés par an, et un arrêté de catastrophe naturelle lié à la sécheresse des sols a été reconnu dans le passé : ces deux faits concernent des objets distincts.",
    "par ailleurs, 124 jours de sols secs par an sont projetés, et un arrêté de catastrophe naturelle pour sécheresse des sols a été reconnu sur la période historique : ce sont deux faits distincts.",
  ]) assert.equal(distinctionExplicite(vrai), true, vrai);
});

test("10. la seconde tentative reçoit une consigne exploitable, pas seulement un identifiant de règle", () => {
  const v = checkAssertions("Ce sont deux faits distincts, mais la sécheresse reconnue en catastrophe naturelle annonce les 165 jours de sols secs projetés.", TOULOUSE_2030);
  assert.match(describeViolations(v)[0], /→ citez les jours de sols secs projetés et la sécheresse reconnue en catastrophe naturelle dans deux phrases séparées/);
});
