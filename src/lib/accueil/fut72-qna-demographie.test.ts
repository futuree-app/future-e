// FUT-72 (26/10/2026) : /qna NE DONNE PLUS AU MODÈLE LE CODE `gagne_attire`.
//
// Reproduit sur main e18b56d7 : pour Belley (01034), la route /qna envoyait au modèle
//   territory_signals.demographie = { tendance: "forte croissance récente", recit_nouveaux_arrivants: "gagne_attire" }.
// Le code se lit comme une cause (« une commune qui attire ») que FUT-6 et FUT-36 ont retirée ailleurs, et
// `tendance` comparait un taux en points de pourcentage à 0,05 : Antibes (+0,06 %/an, « stable » pour le
// code) était en « forte croissance récente ».
//
// Ces tests appellent la VRAIE route (`src/app/qna/route.ts`) sur l'index réel. `fetch` est simulé :
// l'appel à Anthropic est capturé (c'est le payload testé) et reçoit une réponse écrite ici. Aucun appel
// réseau, aucun appel au modèle. Le hook de résolution (même patron que
// `comparateur-demographie-causalite.test.ts`) fournit `server-only`, les alias `@/` et un PostHog muet.
//
// Revue de Work (26/10, SHA 12b4c328), deux blocages corrigés et rejoués ici :
//   A. le code passait avant les valeurs : taux −2 %/an + `gagne_attire` donnait « la population augmente »
//      et « part élevée ». Les codes sont désormais vérifiés contre le taux et la part (arrondi compris) ;
//   B. le contrôle de causalité se contournait (« attire … sans difficulté », « attirera », « la croissance
//      prouve que les familles choisissent… ») et refusait une mise en garde légitime.
// Revue de Work (26/10, SHA 86135c12), trois contre-exemples corrigés et rejoués ici :
//   1. taux −101 %/an + `perd` donnait « la population diminue ». Un taux sous −100 %/an est impossible
//      (P21 > 0) : il est désormais invalide, avec ou sans code. Aucune borne haute ;
//   2. et 3. « Le dossier attire votre attention sur les risques pour les familles » et « Les eaux stagnantes
//      attirent les moustiques près des habitants » partaient au repli : un mot de personne n'importe où dans
//      la proposition suffisait. Seuls comptent maintenant le groupe sujet et le groupe objet d'« attirer ».
// L'index réel ne contient aucune donnée contradictoire : pour éprouver la route sur ces cas, le hook
// enveloppe `@/lib/comparateur-vie` (le fichier n'est pas modifié). Les INSEE fictifs 99xxx renvoient une
// vraie commune de l'index dont seule la démographie est altérée ; tout autre INSEE passe au vrai moteur.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { gunzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { signalDemographie, signauxPourLeModele, type DemographieIndex } from "./signal-demographie.ts";
import { checkCausaliteDemographique } from "./causalite-demographique.ts";
import { controlerReponse, type ContexteQna } from "./qna.ts";
import { construireFaitsCommune } from "./faits.ts";

const racine = pathToFileURL(`${process.cwd()}/`).href;
const moteurReel = `${racine}src/lib/comparateur-vie.ts`;
const enveloppeMoteur = `
import * as vrai from ${JSON.stringify(moteurReel)};
export * from ${JSON.stringify(moteurReel)};
export async function getCommuneEntry(insee) {
  const f = globalThis.__fut72Faux?.[insee];
  if (!f) return vrai.getCommuneEntry(insee);
  const base = await vrai.getCommuneEntry(f.base);
  return base && { ...base, demographie: f.demographie };
}`;
const posthogMuet = "export function getPostHogClient(){return{capture(){},async shutdown(){}}}";
const hook = `
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (spec === "@/lib/posthog-server") return { url: "data:text/javascript," + encodeURIComponent(${JSON.stringify(posthogMuet)}), shortCircuit: true };
  if (spec === "next/server") return next("next/server.js", ctx);
  if (spec === "@/lib/comparateur-vie") return { url: "data:text/javascript," + encodeURIComponent(${JSON.stringify(enveloppeMoteur)}), shortCircuit: true };
  if (spec.startsWith("@/")) return next(${JSON.stringify(racine)} + "src/" + spec.slice(2) + ".ts", ctx);
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\\.[cm]?[jt]s$|\\.json$/.test(spec)) {
    try { return await next(spec + ".ts", ctx); } catch { return next(spec, ctx); }
  }
  return next(spec, ctx);
}`;

/** Une causalité d'attraction, sous toutes ses formes (même motif que le test FUT-36). */
const CAUSAL = /\battir(e|ent|er|ait|ant|é|ée|és|ées)?\b|\battracti(f|fs|ve|ves|vité|vités)\b/i;
const CODES_INTERNES = /gagne_attire|gagne_sans_renouv|stable_renouv|recit_nouveaux_arrivants|"perd"|"stable"/;

type Appel = { url: string; corps: { system: string; messages: { content: string }[] } };
const appels: Appel[] = [];
let reponseSimulee = "";
const fetchOrigine = globalThis.fetch;
const cleOrigine = process.env.ANTHROPIC_API_KEY;
let POST: (r: Request) => Promise<Response>;

before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  process.env.ANTHROPIC_API_KEY = "cle-de-test";
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.startsWith("https://api.anthropic.com/")) {
      appels.push({ url, corps: JSON.parse(String(init?.body)) });
      return new Response(JSON.stringify({ content: [{ type: "text", text: reponseSimulee }], usage: {} }), { status: 200 });
    }
    // Géorisques, DRIAS distant… : indisponibles. Les faits correspondants sont absents, jamais inventés.
    return new Response("indisponible (test)", { status: 503 });
  }) as typeof fetch;
  ({ POST } = await import("../../app/qna/route.ts"));
});

after(() => {
  globalThis.fetch = fetchOrigine;
  if (cleOrigine === undefined) delete process.env.ANTHROPIC_API_KEY;
  else process.env.ANTHROPIC_API_KEY = cleOrigine;
});

const REPONSE_SOBRE = JSON.stringify({
  verdict: "La commune décrit sa population, pas les raisons des arrivées.",
  detail: "Les recensements montrent comment la population évolue et quelle part des habitants vient d'arriver. Ils ne disent pas pourquoi des habitants s'installent. Le dossier détaille ces constats.",
  cta: "Ouvrez le dossier de la commune",
});

/** Pose la question « croissance » pour une commune et rend le payload réellement envoyé au modèle. */
async function payloadPour(insee: string, commune: string, reponse = REPONSE_SOBRE) {
  appels.length = 0;
  reponseSimulee = reponse;
  const res = await POST(
    new Request("http://localhost/qna", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        commune,
        inseeCode: insee,
        tension: { id: "croissance_transformation", label: "La commune se transforme-t-elle ?" },
        categories: [],
      }),
    }),
  );
  const corps = await res.json();
  assert.equal(appels.length, 1, "un seul appel simulé au modèle");
  const brut = appels[0].corps.messages[0].content;
  return { brut, prompt: JSON.parse(brut), system: appels[0].corps.system, corps };
}

// Les cinq états du code, sur de vraies communes de l'index.
const CAS = [
  { insee: "01034", nom: "Belley", code: "gagne_attire", evolution: "la population augmente", arrivants: /^part élevée/ },
  { insee: "01053", nom: "Bourg-en-Bresse", code: "gagne_sans_renouv", evolution: "la population augmente", arrivants: /pas particulièrement élevée$/ },
  { insee: "01419", nom: "Thoiry", code: "stable_renouv", evolution: "la population est globalement stable", arrivants: /^part élevée/ },
  { insee: "01283", nom: "Oyonnax", code: "stable", evolution: "la population est globalement stable", arrivants: /pas particulièrement élevée$/ },
  { insee: "01262", nom: "Montluel", code: "perd", evolution: "la population diminue", arrivants: null },
] as const;

for (const cas of CAS) {
  test(`/qna, ${cas.nom} (${cas.code}) : le modèle reçoit des constats, jamais le code`, async () => {
    const { brut, prompt } = await payloadPour(cas.insee, cas.nom);
    const demo = prompt.territory_signals?.demographie;
    assert.ok(demo, "le signal démographique est présent quand l'index le mesure");
    assert.equal(demo.evolution_population, cas.evolution);
    if (cas.arrivants) assert.match(demo.arrivants_recents, cas.arrivants);
    else assert.equal("arrivants_recents" in demo, false, "`perd` ne qualifie pas la part d'arrivants : rien n'est dit");
    assert.doesNotMatch(brut, CODES_INTERNES);
    assert.doesNotMatch(brut, CAUSAL);
    assert.equal("tendance" in demo, false);
    // Aucun chiffre dans le signal : le contrôle des nombres refuserait tout chiffre que le modèle en recopierait.
    assert.doesNotMatch(JSON.stringify(demo), /\d/);
  });
}

test("/qna, Antibes (+0,06 %/an, code « stable ») : plus de « forte croissance récente »", async () => {
  const { prompt, brut } = await payloadPour("06004", "Antibes");
  assert.equal(prompt.territory_signals.demographie.evolution_population, "la population est globalement stable");
  assert.doesNotMatch(brut, /forte croissance/);
});

test("/qna : les autres signaux territoire passent inchangés", async () => {
  const { prompt } = await payloadPour("01034", "Belley");
  for (const cle of ["transports_commun", "train"]) assert.ok(cle in prompt.territory_signals, cle);
});

test("/qna : le prompt système interdit d'en déduire une attraction", async () => {
  const { system } = await payloadPour("01034", "Belley");
  assert.match(system, /Never write or suggest that the commune attracts people or is attractive/);
});

test("/qna : une réponse simulée qui prête une attraction est remplacée par le repli", async () => {
  const fautive = JSON.stringify({
    verdict: "Belley attire de nouveaux habitants chaque année.",
    detail: "La commune gagne des habitants : elle est attractive pour les familles qui s'installent. Le dossier détaille ces constats.",
    cta: "Ouvrez le dossier de la commune",
  });
  const { corps } = await payloadPour("01034", "Belley", fautive);
  assert.equal(corps.source, "repli");
  assert.ok(corps.violations.includes("interdit:attractivite"), JSON.stringify(corps.violations));
  assert.doesNotMatch(`${corps.verdict} ${corps.detail}`, CAUSAL);
});

test("/qna : une réponse sobre passe le contrôle", async () => {
  const { corps } = await payloadPour("01034", "Belley");
  assert.equal(corps.source, "modele", JSON.stringify(corps.violations));
});

// ── Le module pur ────────────────────────────────────────────────────────────────────────────

test("signalDemographie : sans code, le sens vient du taux avec la bande stable de l'index (±0,15 %/an)", () => {
  assert.equal(signalDemographie({ taux_total: 0.4, part_nouveaux: null, recit: null })?.evolution_population, "la population augmente");
  assert.equal(signalDemographie({ taux_total: 0.1, part_nouveaux: null, recit: null })?.evolution_population, "la population est globalement stable");
  assert.equal(signalDemographie({ taux_total: -0.2, part_nouveaux: null, recit: null })?.evolution_population, "la population diminue");
  // Sans code, la part d'arrivants n'est pas qualifiée : le seuil (tiers haut national) n'est pas connu ici.
  assert.equal(signalDemographie({ taux_total: 0.4, part_nouveaux: 12, recit: null })?.arrivants_recents, undefined);
});

test("signalDemographie : aucune mesure, aucun signal", () => {
  assert.equal(signalDemographie(null), null);
  assert.equal(signalDemographie(undefined), null);
  assert.equal(signalDemographie({ taux_total: null, part_nouveaux: null, recit: null }), null);
  assert.equal(signalDemographie({ taux_total: null, part_nouveaux: 8, recit: "code_inconnu" }), null);
});

test("signauxPourLeModele : retire le signal brut quand rien ne le fonde, garde le reste", () => {
  const brut = { demographie: { tendance: "forte croissance récente", recit_nouveaux_arrivants: "gagne_attire" }, calme: { niveau: "plutôt calme" } };
  assert.deepEqual(signauxPourLeModele(brut, null), { calme: { niveau: "plutôt calme" } });
  const remplace = signauxPourLeModele(brut, { taux_total: 0.84, part_nouveaux: 7.9, recit: "gagne_attire" });
  assert.doesNotMatch(JSON.stringify(remplace), CODES_INTERNES);
  assert.deepEqual(remplace.calme, { niveau: "plutôt calme" });
});

// ── A. Valeurs absentes, invalides, contradictoires, et arrondi de stockage ─────────────────────

const EVOL = { hausse: "la population augmente", stable: "la population est globalement stable", baisse: "la population diminue" };
const ELEVEE = /^part élevée/;
const NON_ELEVEE = /pas particulièrement élevée$/;

// [cas, démographie, évolution attendue (null = omise), arrivants attendus (null = omis)]
const COHERENCE: [string, DemographieIndex, string | null, RegExp | null][] = [
  // Les deux reproductions de Work.
  ["Work 1 : taux −2, part absente, gagne_attire", { taux_total: -2, part_nouveaux: null, recit: "gagne_attire" }, null, null],
  ["Work 2 : taux NaN, part −4, gagne_attire", { taux_total: NaN, part_nouveaux: -4, recit: "gagne_attire" }, null, null],
  // Contradictions : le code ou la valeur est faux, on ne sait pas lequel. Rien n'est dit.
  ["gagne_attire, taux 0,14 (stable)", { taux_total: 0.14, part_nouveaux: 9, recit: "gagne_attire" }, null, null],
  ["perd, taux +0,4", { taux_total: 0.4, part_nouveaux: 9, recit: "perd" }, null, null],
  ["stable, taux −0,16", { taux_total: -0.16, part_nouveaux: 5, recit: "stable" }, null, null],
  // Code sans taux valide : le code n'est pas un constat.
  ["gagne_attire, taux absent", { taux_total: null, part_nouveaux: 9, recit: "gagne_attire" }, null, null],
  ["stable_renouv, taux Infinity", { taux_total: Infinity, part_nouveaux: 9, recit: "stable_renouv" }, null, null],
  // Code compatible, part invalide : l'évolution reste démontrée, la part n'est pas qualifiée.
  ["gagne_attire, part absente", { taux_total: 0.84, part_nouveaux: null, recit: "gagne_attire" }, EVOL.hausse, null],
  ["stable, part absente (le code la dit « non élevée » par défaut)", { taux_total: 0.02, part_nouveaux: null, recit: "stable" }, EVOL.stable, null],
  ["gagne_attire, part 150", { taux_total: 0.84, part_nouveaux: 150, recit: "gagne_attire" }, EVOL.hausse, null],
  ["stable_renouv, part NaN", { taux_total: 0, part_nouveaux: NaN, recit: "stable_renouv" }, EVOL.stable, null],
  // Bornes de part valides.
  ["gagne_sans_renouv, part 0", { taux_total: 0.5, part_nouveaux: 0, recit: "gagne_sans_renouv" }, EVOL.hausse, NON_ELEVEE],
  ["stable_renouv, part 100", { taux_total: 0, part_nouveaux: 100, recit: "stable_renouv" }, EVOL.stable, ELEVEE],
  // Arrondi à deux décimales : à ±0,15 exactement, les deux codes voisins sont possibles (vu sur l'index).
  ["gagne_attire à +0,15", { taux_total: 0.15, part_nouveaux: 9, recit: "gagne_attire" }, EVOL.hausse, ELEVEE],
  ["stable à +0,15", { taux_total: 0.15, part_nouveaux: 5, recit: "stable" }, EVOL.stable, NON_ELEVEE],
  ["perd à −0,15", { taux_total: -0.15, part_nouveaux: 9, recit: "perd" }, EVOL.baisse, null],
  ["stable_renouv à −0,15", { taux_total: -0.15, part_nouveaux: 9, recit: "stable_renouv" }, EVOL.stable, ELEVEE],
  // Sans code reconnu : le taux seul, sauf à la borne où il ne tranche pas ; jamais la part.
  ["sans code, +0,15 (borne)", { taux_total: 0.15, part_nouveaux: 9, recit: null }, null, null],
  ["sans code, −0,15 (borne)", { taux_total: -0.15, part_nouveaux: 9, recit: null }, null, null],
  ["sans code, +0,16", { taux_total: 0.16, part_nouveaux: 9, recit: null }, EVOL.hausse, null],
  ["sans code, −0,14", { taux_total: -0.14, part_nouveaux: 9, recit: null }, EVOL.stable, null],
  ["code inconnu, −0,2", { taux_total: -0.2, part_nouveaux: 9, recit: "code_inconnu" }, EVOL.baisse, null],
  ["« toString » n'est pas un code", { taux_total: 0.5, part_nouveaux: 9, recit: "toString" }, EVOL.hausse, null],
  ["tout absent", { taux_total: null, part_nouveaux: null, recit: null }, null, null],
  // Domaine du taux : (P21/P15)^(1/6) − 1 > −100 %/an. En dessous, la valeur est impossible.
  ["Work 3 : taux −101, part 5, perd", { taux_total: -101, part_nouveaux: 5, recit: "perd" }, null, null],
  ["perd, taux −100,01", { taux_total: -100.01, part_nouveaux: 5, recit: "perd" }, null, null],
  ["sans code, taux −101", { taux_total: -101, part_nouveaux: 5, recit: null }, null, null],
  ["sans code, taux −Infinity", { taux_total: -Infinity, part_nouveaux: 5, recit: null }, null, null],
  ["perd, taux −100 (borne atteignable après arrondi)", { taux_total: -100, part_nouveaux: 5, recit: "perd" }, EVOL.baisse, null],
  ["sans code, taux −100", { taux_total: -100, part_nouveaux: 5, recit: null }, EVOL.baisse, null],
  // Aucun plafond sur les croissances : la formule n'en a pas.
  ["gagne_attire, taux +250", { taux_total: 250, part_nouveaux: 9, recit: "gagne_attire" }, EVOL.hausse, ELEVEE],
  ["sans code, taux +1e6", { taux_total: 1e6, part_nouveaux: 9, recit: null }, EVOL.hausse, null],
];

for (const [nom, demo, evolution, arrivants] of COHERENCE) {
  test(`signalDemographie, ${nom}`, () => {
    const s = signalDemographie(demo);
    if (evolution == null && arrivants == null) return assert.equal(s, null, JSON.stringify(s));
    assert.equal(s?.evolution_population, evolution ?? undefined);
    if (arrivants) assert.match(s?.arrivants_recents ?? "", arrivants);
    else assert.equal(s && "arrivants_recents" in s, false);
  });
}

// Les mêmes cas, par la VRAIE route : des communes réelles (Belley, Montluel) dont seule la démographie
// est altérée. Le payload envoyé au modèle n'affirme que ce que les valeurs démontrent.
const FAUX: Record<string, { base: string; demographie: DemographieIndex }> = {
  "99001": { base: "01034", demographie: { taux_total: -2, part_nouveaux: null, recit: "gagne_attire" } },
  "99002": { base: "01034", demographie: { taux_total: NaN, part_nouveaux: -4, recit: "gagne_attire" } },
  "99003": { base: "01034", demographie: { taux_total: 0.84, part_nouveaux: null, recit: "gagne_attire" } },
  "99004": { base: "01262", demographie: { taux_total: 0.15, part_nouveaux: 9, recit: null } },
  "99005": { base: "01262", demographie: { taux_total: 0.15, part_nouveaux: 5, recit: "gagne_sans_renouv" } },
  // Reproduction exacte de Work (3e revue) : Belley, taux impossible.
  "99006": { base: "01034", demographie: { taux_total: -101, part_nouveaux: 5, recit: "perd" } },
  "99007": { base: "01034", demographie: { taux_total: -101, part_nouveaux: 5, recit: null } },
};

test("/qna, données contradictoires ou invalides : le payload n'affirme que ce que les valeurs démontrent", async () => {
  (globalThis as { __fut72Faux?: typeof FAUX }).__fut72Faux = FAUX;
  try {
    for (const insee of ["99001", "99002", "99004", "99006", "99007"]) {
      const { prompt, brut } = await payloadPour(insee, "Commune test");
      assert.ok(prompt.territory_signals, `${insee} : les autres signaux restent`);
      assert.equal("demographie" in prompt.territory_signals, false, `${insee} : ${JSON.stringify(prompt.territory_signals.demographie)}`);
      assert.doesNotMatch(brut, CODES_INTERNES);
    }
    const partAbsente = (await payloadPour("99003", "Commune test")).prompt.territory_signals.demographie;
    assert.deepEqual([partAbsente.evolution_population, "arrivants_recents" in partAbsente], [EVOL.hausse, false]);
    const borne = (await payloadPour("99005", "Commune test")).prompt.territory_signals.demographie;
    assert.equal(borne.evolution_population, EVOL.hausse);
    assert.match(borne.arrivants_recents, NON_ELEVEE);
  } finally {
    delete (globalThis as { __fut72Faux?: unknown }).__fut72Faux;
  }
});

// Mesure sur l'index réel : les garde-fous de cohérence n'y retirent rien. Chaque commune garde le constat
// que son code dit, et les codes y sont séparés par un seul seuil de part d'arrivants (arrondi compris).
test("index réel : aucun constat retiré, codes cohérents avec les valeurs stockées", () => {
  const index = JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString()) as {
    communes: { insee: string; demographie?: { taux_total: number; part_nouveaux: number | null; recit: string | null } | null }[];
  };
  const SENS: Record<string, string> = { gagne_attire: EVOL.hausse, gagne_sans_renouv: EVOL.hausse, stable_renouv: EVOL.stable, stable: EVOL.stable, perd: EVOL.baisse };
  let mesurees = 0, minElevee = Infinity, maxNonElevee = -Infinity;
  for (const c of index.communes) {
    const d = c.demographie;
    if (!d) continue;
    mesurees++;
    const s = signalDemographie(d);
    assert.equal(s?.evolution_population, SENS[d.recit ?? ""], `${c.insee} ${JSON.stringify(d)}`);
    const attendu = d.recit === "gagne_attire" || d.recit === "stable_renouv" ? ELEVEE : d.recit === "perd" ? null : NON_ELEVEE;
    if (attendu) assert.match(s?.arrivants_recents ?? "", attendu, c.insee);
    else assert.equal(s && "arrivants_recents" in s, false, c.insee);
    if (d.part_nouveaux != null && d.recit !== "perd") {
      if (attendu === ELEVEE) minElevee = Math.min(minElevee, d.part_nouveaux);
      else maxNonElevee = Math.max(maxNonElevee, d.part_nouveaux);
    }
  }
  assert.ok(mesurees > 34_000, String(mesurees));
  // Arrondi à 0,1 point : les deux classes peuvent se toucher (7,7 aujourd'hui), jamais se chevaucher.
  assert.ok(maxNonElevee <= minElevee, `${maxNonElevee} > ${minElevee}`);
});

// ── B. Le contrôle de causalité ────────────────────────────────────────────────────────────────

const ctxBelley: ContexteQna = { commune: "Belley", tensionId: "croissance_transformation", questionLabel: "La commune se transforme-t-elle ?", faits: construireFaitsCommune("Belley", null, null) };
/** Le contrôle complet de /qna, avec la reproduction exacte de Work : verdict et CTA neutres. */
const controle = (detail: string) => controlerReponse({ verdict: "La population évolue.", detail, cta: "Ouvrez le dossier" }, ctxBelley);

const REFUSEES: [string, string][] = [
  // Les trois contournements trouvés par Work.
  ["La commune attire des familles sans difficulté.", "interdit:attractivite"],
  ["La commune attirera des familles.", "interdit:attractivite"],
  ["La croissance prouve que les familles choisissent cette commune pour sa qualité de vie.", "interdit:cause-demographique"],
  // Temps et modes.
  ["La commune attirait déjà des familles.", "interdit:attractivite"],
  ["Elle pourrait attirer de jeunes actifs.", "interdit:attractivite"],
  ["Belley a attiré de nouveaux habitants.", "interdit:attractivite"],
  ["Des familles attirées par le calme s'y installent.", "interdit:attractivite"],
  ["Belley attire.", "interdit:attractivite"],
  // « ne … que » restreint, il ne nie pas.
  ["La commune n'attire que des familles.", "interdit:attractivite"],
  // Formulations équivalentes.
  ["Un territoire attractif pour les familles.", "interdit:attractivite"],
  ["Son attractivité résidentielle progresse.", "interdit:attractivite"],
  ["Une commune prisée des familles.", "interdit:attractivite"],
  ["Belley séduit de nouveaux habitants.", "interdit:attractivite"],
  ["Les familles viennent pour son cadre de vie.", "interdit:cause-demographique"],
  ["Des habitants s'installent ici pour la qualité de vie.", "interdit:cause-demographique"],
  ["La croissance s'explique par la proximité de Lyon.", "interdit:cause-demographique"],
  ["La population augmente grâce à son cadre de vie.", "interdit:cause-demographique"],
  ["La hausse de la population reflète la qualité de vie.", "interdit:cause-demographique"],
  // Une réserve dans une AUTRE proposition, ou après l'affirmation, ne la rattrape pas.
  ["Les chiffres ne disent pas tout, mais la commune attire des familles.", "interdit:attractivite"],
  ["La commune attire des familles, rien ne le prouve pourtant.", "interdit:attractivite"],
  ["Il est difficile de se loger car la commune attire des familles.", "interdit:attractivite"],
  // Sujet ou objet d'« attirer », quels que soient les mots intercalés.
  ["La commune attire chaque année de nombreuses familles.", "interdit:attractivite"],
  ["La commune de Belley attire des familles.", "interdit:attractivite"],
  ["Elle pourrait déjà les attirer.", "interdit:attractivite"],
  ["La commune continue d'attirer des familles.", "interdit:attractivite"],
  ["Ce territoire attire en masse des retraités.", "interdit:attractivite"],
  ["Ces emplois attirent des habitants.", "interdit:attractivite"],
  ["Les familles sont attirées par le calme.", "interdit:attractivite"],
  ["Un cadre de vie attirant pour les familles.", "interdit:attractivite"],
];

const ACCEPTEES = [
  // Les mises en garde de Work.
  "Il faut éviter de parler de commune attractive.",
  "On ne peut pas conclure à son attractivité.",
  // Négations et réserves légitimes.
  "Les recensements ne disent pas si la commune attire de nouveaux habitants.",
  "Rien ne permet de dire, à ce stade, que la commune attire des familles.",
  "La commune n'attire pas forcément des familles : les données ne le disent pas.",
  "Aucune donnée ne montre que les familles choisissent la commune pour sa qualité de vie.",
  "La croissance ne prouve pas que les familles choisissent cette commune pour sa qualité de vie.",
  "Il serait hâtif d'en déduire que la commune est attractive.",
  "Gardez-vous de conclure que la commune attire des familles.",
  "On ignore pourquoi des habitants s'installent.",
  // « attirer » dans un autre sens. Les deux premières sont les reproductions de Work (3e revue) : des
  // familles ou des habitants ailleurs dans la phrase ne font pas d'« attirer » une attraction résidentielle.
  "Le dossier attire votre attention sur les risques pour les familles.",
  "Les eaux stagnantes attirent les moustiques près des habitants.",
  "La lumière attire les insectes chez les habitants.",
  "Il faut attirer l'attention sur les risques.",
  "Les familles attirent l'attention des élus.",
  "Les eaux stagnantes attirent le moustique tigre.",
  "Ce point mérite d'attirer l'attention lors d'une visite.",
  // Les constats eux-mêmes.
  "La population de Belley augmente, avec une part élevée d'habitants arrivés d'une autre commune.",
  "Les recensements ne disent pas pourquoi des habitants s'installent.",
];

for (const [phrase, regle] of REFUSEES) {
  test(`contrôle /qna refuse : « ${phrase} »`, () => {
    const r = controle(phrase);
    assert.equal(r.ok, false, phrase);
    if (!r.ok) assert.ok(r.violations.some((v) => v.rule === regle), JSON.stringify(r.violations));
  });
}
for (const phrase of ACCEPTEES) {
  test(`contrôle /qna accepte : « ${phrase} »`, () => {
    const r = controle(phrase);
    assert.equal(r.ok, true, r.ok ? "" : JSON.stringify(r.violations));
  });
}

test("checkCausaliteDemographique : sans nom de commune, « Belley attire. » n'est pas reconnu (limite documentée)", () => {
  assert.equal(checkCausaliteDemographique("Belley attire.").length, 0);
  assert.equal(checkCausaliteDemographique("Belley attire.", "Belley").length, 1);
});

test("checkCausaliteDemographique : limites documentées du repérage par position", () => {
  // Le territoire est le groupe qui précède le verbe : refus à tort, le repli s'affiche.
  assert.equal(checkCausaliteDemographique("Les eaux stagnantes de la commune attirent les moustiques.").length, 1);
  // Le complément du nom reste dans le groupe objet : refus à tort.
  assert.equal(checkCausaliteDemographique("Le bruit attire les plaintes des habitants.").length, 1);
  // Le pronom objet n'est pas résolu : passe.
  assert.equal(checkCausaliteDemographique("Ces emplois les attirent.").length, 0);
});

// Les mêmes phrases, par la VRAIE route et le modèle simulé.
test("/qna, réponses simulées de Work : les trois contournements partent au repli, la mise en garde passe", async () => {
  for (const [phrase, regle] of REFUSEES.slice(0, 3)) {
    const { corps } = await payloadPour("01034", "Belley", JSON.stringify({ verdict: "La population évolue.", detail: phrase, cta: "Ouvrez le dossier" }));
    assert.equal(corps.source, "repli", phrase);
    assert.ok(corps.violations.includes(regle), `${phrase} ${JSON.stringify(corps.violations)}`);
    assert.doesNotMatch(`${corps.verdict} ${corps.detail}`, CAUSAL);
  }
  for (const phrase of ACCEPTEES.slice(0, 2)) {
    const { corps } = await payloadPour("01034", "Belley", JSON.stringify({ verdict: "La population évolue.", detail: phrase, cta: "Ouvrez le dossier" }));
    assert.equal(corps.source, "modele", `${phrase} ${JSON.stringify(corps.violations)}`);
  }
});

test("/qna, réponses simulées de Work (3e revue) : « attirer » hors attraction résidentielle passe", async () => {
  for (const phrase of ["Le dossier attire votre attention sur les risques pour les familles.", "Les eaux stagnantes attirent les moustiques près des habitants."]) {
    const { corps } = await payloadPour("01034", "Belley", JSON.stringify({ verdict: "La population évolue.", detail: phrase, cta: "Ouvrez le dossier" }));
    assert.equal(corps.source, "modele", `${phrase} ${JSON.stringify(corps.violations)}`);
    assert.deepEqual(corps.violations, []);
  }
});
