// FUT-145 · TROIS LECTURES QUI DISAIENT PLUS QUE LEURS PREUVES (audit FUT-82, 27/10/2026).
//
// A. /agir/pollutions-invisibles concluait « Aucune installation industrielle classée ICPE recensée dans un
//    rayon de 10 km » sur un extrait ADEME IREP de 2019 (Metz : 25 établissements déclarants au registre 2024).
//    Une panne de la source rendait la même liste vide. → le bloc renvoyait au registre officiel ; FUT-152 l'a
//    remplacé par l'export officiel du registre (cf. fut152-pollutions-invisibles.test.ts).
// B. AskFuture recevait « Incendies récents (nombre) », champ ADEME sans période ni source primaire. → retiré
//    du `system` ; capturé ici sur la VRAIE route /api/ask, devant un modèle simulé.
// C. Le comparateur appelait « Risque de feu faible / modéré / élevé » un rang national de jours d'indice
//    forêt-météo projetés vers 2050. → libellés fidèles ; scores et rangs inchangés.
//
// Aucun appel Anthropic : le SDK, Supabase et l'enrichissement sont des doubles (cf. fut142-ask-lecture).
import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

const racine = pathToFileURL(`${process.cwd()}/`).href;
const doubles: Record<string, string> = {
  "server-only": "export{}",
  "@anthropic-ai/sdk": "export default class { constructor() { this.messages = { create: (...a) => globalThis.__fut145.modele(...a) }; } }",
  "@supabase/supabase-js": "export function createClient() { return { rpc: async () => ({ data: false, error: null }) }; }",
  "@/lib/supabase/server": "export async function createClient() { return globalThis.__fut145.supabase(); }",
  "@/lib/commune-enrichment": "export async function gatherCommuneEnrichment(insee) { return globalThis.__fut145.enrichment(insee); }",
};
const hook = `
const doubles = ${JSON.stringify(doubles)};
async function premier(candidats, ctx, next) {
  for (const c of candidats.slice(0, -1)) { try { return await next(c, ctx); } catch {} }
  return next(candidats[candidats.length - 1], ctx);
}
export async function resolve(spec, ctx, next) {
  if (doubles[spec] != null) return { url: "data:text/javascript," + encodeURIComponent(doubles[spec]), shortCircuit: true };
  if (spec === "next/server") return next("next/server.js", ctx);
  if (spec.startsWith("@/")) {
    const b = ${JSON.stringify(racine)} + "src/" + spec.slice(2);
    return premier([b + ".ts", b + ".tsx", b], ctx, next);
  }
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\\.[cm]?[jt]sx?$|\\.json$/.test(spec)) {
    return premier([spec + ".ts", spec + ".tsx", spec], ctx, next);
  }
  return next(spec, ctx);
}`;

type M = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const g = globalThis as M;
const etat: { modele: M[]; enrichment: M | null } = { modele: [], enrichment: null };
g.__fut145 = {
  modele: async (req: M) => {
    etat.modele.push(req);
    return { content: [{ type: "tool_use", name: "futuree_reply", input: { answer: "Réponse simulée.", out_of_scope: false } }] };
  },
  enrichment: async () => etat.enrichment,
  // Le lecteur pose sa question sur sa commune de résidence : aucun droit territorial à prouver.
  supabase: () => {
    const lignes: Record<string, M | null> = {
      user_accounts: { plan: "subscription" },
      user_profiles: { home_insee_code: etat.enrichment?.ademe?.commune?.inseeCode ?? null },
      communes_categorization: null,
    };
    const requete = (table: string): M => {
      const q: M = {
        select: () => q, eq: () => q,
        maybeSingle: async () => ({ data: lignes[table] ?? null, error: null }),
        insert: async () => ({ error: null }),
      };
      return q;
    };
    return { auth: { getUser: async () => ({ data: { user: { id: "u-fut145" } } }) }, from: requete };
  },
};

let ASK: M, V: M, LABELS: M;
let NextRequest: new (url: string, init?: M) => unknown;
before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  ASK = await import("../app/api/ask/route.ts");
  V = await import("./comparateur-vie.ts");
  LABELS = await import("./comparateur-labels.ts");
  ({ NextRequest } = await import("next/server.js" as string));
});
const fetchReel = globalThis.fetch;
beforeEach(() => {
  globalThis.fetch = fetchReel;
  etat.modele = [];
  etat.enrichment = null;
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// A · IREP : un extrait ne prouve aucune absence
// ════════════════════════════════════════════════════════════════════════════════════════════════

// FUT-152 (28/10/2026) a remplacé l'extrait ADEME par l'export officiel du registre, en index local, et rendu
// la recherche à la page. Les tests de l'extrait (troncature, `total` plausible, pannes) n'ont plus d'objet :
// le contrat du registre est verrouillé par `fut152-pollutions-invisibles.test.ts`. Seule reste ici la garde
// du dossier payant, dont le retour d'IREP est une décision distincte.

test("A · le dossier payé n'appelle toujours pas IREP", () => {
  const code = readFileSync(new URL("../app/api/georisques-logement/route.ts", import.meta.url), "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(code, /getIrepNearPoint|getIrepAutour|irep-registre|@\/lib\/irep/);
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// B · AskFuture : le compteur d'incendies sans provenance ne part plus au modèle
// ════════════════════════════════════════════════════════════════════════════════════════════════

type CommuneFixture = { nom: string; enrichment: M };
const F = JSON.parse(readFileSync(new URL("./ask/__fixtures__/communes.json", import.meta.url), "utf8")).communes as Record<string, CommuneFixture>;

/** Pose une question à la vraie route et rend le `system` exactement reçu par le modèle simulé. */
async function systemCapture(insee: string, enrichment: M): Promise<{ status: number; system: string }> {
  etat.enrichment = { ...enrichment, ademe: enrichment.ademe ? { ...enrichment.ademe, commune: { ...enrichment.ademe.commune, inseeCode: insee } } : null };
  const res: Response = await ASK.POST(new NextRequest("http://localhost/api/ask", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `10.145.0.${insee.slice(-2)}` },
    body: JSON.stringify({ messages: [{ role: "user", content: "Quel est le risque de feu ici ?" }], communeInsee: insee, communeName: F[insee]?.nom ?? insee, sessionId: "s-fut145" }),
  }));
  assert.equal(etat.modele.length, 1, "un seul appel au modèle simulé");
  return { status: res.status, system: etat.modele[0].system as string };
}

test("B · commune AVEC valeur (Fos-sur-Mer, 41 ; Chamonix, 2) : ni la ligne ni le compteur dans le system réel", async () => {
  for (const [insee, valeur] of [["13039", 41], ["74056", 2]] as const) {
    assert.equal(F[insee].enrichment.ademe.commune.territoire.incendies, valeur, "fixture");
    const { status, system } = await systemCapture(insee, F[insee].enrichment);
    assert.equal(status, 200);
    assert.doesNotMatch(system, /Incendies récents/);
    assert.doesNotMatch(system, /nombre_dincendies|incendies \(nombre\)/i);
    const ademe = system.slice(system.indexOf("[ADEME"), system.indexOf("\n[DRIAS"));
    assert.doesNotMatch(ademe, new RegExp(`: ${valeur}$`, "m"), `${F[insee].nom} : une ligne vaut ${valeur} dans le bloc ADEME`);
    etat.modele = [];
  }
});

test("B · les faits légitimes restent transmis (DRIAS, Géorisques, GASPAR, ADEME sourcé)", async () => {
  const { system } = await systemCapture("13039", F["13039"].enrichment);
  assert.match(system, /Jours risque feu \(IFM > 40\) : 72 j/);
  assert.match(system, /Jours sécheresse sol \(SWI < 0\.4\) : 221 j/);
  assert.match(system, /\[Géorisques/);
  assert.match(system, /Risques recensés : .*feux de forêt|Risques recensés : /);
  assert.match(system, /\[GASPAR — historique des reconnaissances de catastrophe naturelle/);
  assert.match(system, /- Densité \(hab\/km²\) : /);
  assert.match(system, /- Taux boisement \(%\) : 19\.7 %/);
});

test("B · commune SANS valeur (Monteux) : rien n'a changé d'autre que l'absence de la ligne", async () => {
  assert.equal(F["84080"].enrichment.ademe.commune.territoire.incendies, null);
  const { system } = await systemCapture("84080", F["84080"].enrichment);
  assert.doesNotMatch(system, /Incendies/);
  assert.match(system, /Jours sécheresse sol \(SWI < 0\.4\) : 172 j/);
});

test("B · donnée ANCIENNE (commune au périmètre modifié, valeur présente) : toujours rien", async () => {
  const fos = F["13039"].enrichment;
  const ancienne = { ...fos, ademe: { ...fos.ademe, commune: { ...fos.ademe.commune, perimetre_anterieur: "2025-01-01", territoire: { densite: 170.03, incendies: 4817, taux_boisement: null } } } };
  const { system } = await systemCapture("13039", ancienne);
  assert.match(system, /- Périmètre : la commune a changé de territoire le 01\/01\/2025/);
  assert.doesNotMatch(system, /Incendies|\b4817\b/);
});

test("B · aucun autre chemin vers un modèle ne lit le champ (grep des routes et prompts)", () => {
  // Les seuls lecteurs de `territoire.incendies` : le type et le mapper. Une nouvelle lecture échoue ici.
  const lecteurs = [
    "app/api/ask/route.ts", "app/qna/route.ts", "app/api/synthesize-logement/route.ts",
    "app/api/comparateur-vie/synthesize/route.ts", "app/api/comparateur-vie/synthesize-choix/route.ts",
    "app/api/comparateur-vie/ask/route.ts", "lib/server/territoire-snapshot.ts", "lib/ask/system-prompt.ts",
    "components/report/ConclusionRedigee.tsx", "lib/logement-synthesis-cache.ts",
  ];
  for (const f of lecteurs) {
    const code = readFileSync(new URL(`../${f}`, import.meta.url), "utf8").replace(/\/\/.*$/gm, "");
    assert.doesNotMatch(code, /\.incendies\b|nombre_dincendies/, f);
  }
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// C · Comparateur : une météo projetée, en rang national, jamais un « risque de feu »
// ════════════════════════════════════════════════════════════════════════════════════════════════

const resultat = (insee: string) => ({ insee, nom: insee, dept: insee.slice(0, 2), region: null, compatibility: 50, reasons: [], signature: [], tradeoff: null, pressionEco: null, climatInondation: null });
async function ligneFeu(insees: string[], amputer?: string) {
  const entrees = await Promise.all(insees.map((i) => V.getCommuneEntry(i)));
  const byInsee = new Map<string, M>();
  for (const e of entrees) {
    assert.ok(e, "commune dans l'index");
    byInsee.set(e.insee, e.insee === amputer ? { ...e, pct: { ...e.pct, NORIFM40_yr: null } } : e);
  }
  const cc = V.buildComparaisonComplete(insees.map(resultat), byInsee);
  const l = cc.themes.flatMap((t: M) => t.lignes).find((x: M) => x.id === "feu");
  return { l, entrees, byInsee };
}

// Jours d'indice forêt-météo > 40 projetés vers 2050 : Brest 1 (moins qu'ailleurs), Martillac 3 (intermédiaire),
// Châteauneuf-le-Rouge 26,5 (plus qu'ailleurs).
const TROIS = ["29019", "33274", "13025"];

test("C · trois paliers : le libellé dit un nombre de jours COMPARÉ, jamais un risque", async () => {
  const { l, byInsee } = await ligneFeu(TROIS);
  const scores = TROIS.map((i) => V.subScore("faible_risque_feu", byInsee.get(i)));
  assert.ok(scores[0] >= 66 && scores[1] >= 34 && scores[1] < 66 && scores[2] < 34, `fixture : ${scores}`);
  assert.equal(l.label, "Météo propice aux feux");
  assert.deepEqual(l.cellules.map((c: M) => c.palier), [
    "Moins de jours propices aux feux qu'ailleurs",
    "Nombre intermédiaire de jours propices aux feux",
    "Plus de jours propices aux feux qu'ailleurs",
  ]);
  assert.match(l.aide, /projeté vers 2050 et comparé aux autres communes/);
  assert.match(l.aide, /ne dit pas à lui seul le risque d'incendie de la commune ni d'une adresse/);
  for (const t of [l.label, l.aide, ...l.cellules.map((c: M) => c.palier)]) {
    assert.doesNotMatch(t.replace(/le risque d'incendie de la commune ni d'une adresse/, ""), /[Rr]isque|exposition|faible\b|élevé|modéré/, t);
  }
});

test("C · donnée manquante : « Non mesurée », jamais « Non concernée » ni un palier", async () => {
  const { l } = await ligneFeu(TROIS, "33274");
  const cell = l.cellules.find((c: M) => c.insee === "33274");
  assert.equal(cell.disponible, false);
  assert.equal(cell.palier, "Non mesurée");
  assert.equal(cell.alerte, false);
});

test("C · le palier suit toujours le même rang : seuls les mots ont changé (100 - percentile, coupes 66/34)", async () => {
  const { byInsee } = await ligneFeu(TROIS);
  for (const i of TROIS) {
    const e = byInsee.get(i)!;
    assert.equal(V.subScore("faible_risque_feu", e), 100 - e.pct.NORIFM40_yr);
  }
});

test("C · recherche « faible risque de feu » : raisons, compromis et puce disent la météo projetée", async () => {
  const o = await V.matchProjects({ reformulation: "faible risque de feu", hardConstraints: { departements: ["29", "56"] }, preferences: [{ key: "faible_risque_feu", weight: 3 }] });
  const toutes = o.results.flatMap((r: M) => [...r.reasons, r.tradeoff ?? ""]).join(" | ");
  assert.match(toutes, /météo moins propice aux feux/);
  assert.doesNotMatch(toutes, /risque de feu/);
  // Le souhait du lecteur garde ses mots ; la bulle dit ce qui est lu (comme l'inondation, FUT-129).
  assert.equal(LABELS.PREFERENCE_LABELS.faible_risque_feu, "un faible risque de feu");
  assert.match(LABELS.PREFERENCE_TOOLTIP.faible_risque_feu, /^Nombre de jours où la météo favorise les feux de forêt, projeté vers 2050/);
});

test("C · plus aucun texte rendu du moteur ne parle de « risque de feu »", () => {
  const code = readFileSync(new URL("./comparateur-vie.ts", import.meta.url), "utf8").replace(/\/\/.*$/gm, "");
  const chaines = code.match(/"[^"\n]*"/g) ?? [];
  const fautives = chaines.filter((c) => /[Rr]isque de feu|Risque (modéré|élevé)|exposées au risque de feu|risque d'incendie\."/.test(c));
  assert.deepEqual(fautives, []);
});
