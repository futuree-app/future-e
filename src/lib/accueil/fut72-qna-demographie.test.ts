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
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { signalDemographie, signauxPourLeModele } from "./signal-demographie.ts";
import { controlerReponse, type ContexteQna } from "./qna.ts";
import { construireFaitsCommune } from "./faits.ts";

const racine = pathToFileURL(`${process.cwd()}/`).href;
const posthogMuet = "export function getPostHogClient(){return{capture(){},async shutdown(){}}}";
const hook = `
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (spec === "@/lib/posthog-server") return { url: "data:text/javascript," + encodeURIComponent(${JSON.stringify(posthogMuet)}), shortCircuit: true };
  if (spec === "next/server") return next("next/server.js", ctx);
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

test("REGLE_ATTRACTIVITE : affirmative, la négation reste permise", () => {
  const ctx: ContexteQna = { commune: "Belley", tensionId: "croissance_transformation", questionLabel: "La commune se transforme-t-elle ?", faits: construireFaitsCommune("Belley", null, null) };
  const r = (detail: string) => controlerReponse({ verdict: "La population de Belley augmente.", detail, cta: "Ouvrez le dossier" }, ctx);
  assert.equal(r("Les recensements ne disent pas si la commune attire de nouveaux habitants.").ok, true);
  for (const d of ["La commune attire des familles.", "Un territoire attractif.", "Son attractivité progresse.", "Des actifs attirés par la ville."]) {
    const res = r(d);
    assert.equal(res.ok, false, d);
    if (!res.ok) assert.ok(res.violations.some((v) => v.rule === "interdit:attractivite"), d);
  }
});
