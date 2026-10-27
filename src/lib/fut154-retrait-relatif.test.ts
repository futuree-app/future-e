// FUT-154 · UN COMPROMIS COMPARATIF NE CITE QU'UNE COMMUNE QUI SE DÉTACHE VRAIMENT.
//
// Un compromis s'écrit de deux façons : en comparatif (« la sécheresse est plus présente qu'à X ») ou en absolu
// (« sols exposés à la sécheresse », réservé à un sous-score sous 50 depuis FUT-151). Le comparatif ne
// demandait qu'un écart de 12 points avec X, sans regarder les paliers de la matrice. Deux défauts en sortaient :
//   - un écart que le Pack déclare nul devenait le compromis de la carte : Anglet (industrie 52) lisait « les
//     sites industriels sont plus présents qu'à Pau » (65), alors que le Pack met les trois communes à égalité ;
//   - une vraie faiblesse se disait par rapport à une voisine aussi faible, qui passait pour une référence :
//     Aubagne (chaleur 4) « plus marquée qu'à Marseille » (20), Meylan (air 0) « un peu moins pur qu'à
//     Niederhausbergen » (15). La matrice donne aux deux communes le même palier défavorable.
// Ces tests lisent ce que les cartes RACONTENT, sur le vrai moteur et l'index réel. La route AskFuture reçoit un
// modèle simulé : aucun appel Anthropic.
import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

const racine = pathToFileURL(`${process.cwd()}/`).href;
const doubles: Record<string, string> = {
  "server-only": "export{}",
  "@anthropic-ai/sdk": "export default class { constructor() { this.messages = { create: (...a) => globalThis.__fut154.modele(...a) }; } }",
  "ai": "export function streamText() { throw new Error('aucun flux attendu'); }",
  "@ai-sdk/anthropic": "export function anthropic(m) { return m; }",
  "@/lib/posthog-server": "export function getPostHogClient() { return { capture() {}, async shutdown() {} }; }",
  "@supabase/supabase-js": "export function createClient() { return { rpc: async () => ({ data: false, error: null }) }; }",
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
let V: M;
let ASK: (r: unknown) => Promise<Response>;
let NextRequest: new (url: string, init: M) => unknown;
const etat: { modele: M[] } = { modele: [] };
(globalThis as M).__fut154 = {
  modele: async (req: M) => {
    etat.modele.push(req);
    return { content: [{ type: "tool_use", name: "askfuture_comparateur", input: { answer: "Réponse simulée.", routes_to_report: false, focus_rang: null } }] };
  },
};

before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  V = await import("./comparateur-vie.ts");
  ({ POST: ASK } = await import("../app/api/comparateur-vie/ask/route.ts"));
  ({ NextRequest } = await import("next/server.js" as string));
});
beforeEach(() => { etat.modele = []; });

const palier = (s: number) => (s >= 66 ? 0 : s < 34 ? 2 : 1); // les paliers de la matrice (bandIndex)
const recherche = (departements: string[] | null, preferences: M[]) =>
  V.matchProjects({ reformulation: "FUT-154", hardConstraints: departements ? { departements } : {}, preferences });
const carte = async (dep: string[] | null, prefs: M[], nom: string, groupe: "trio" | "pistes" = "trio") => {
  const o = await recherche(dep, prefs);
  const r = (groupe === "trio" ? o.results.slice(0, 3) : o.pistes).find((x: M) => x.nom === nom);
  assert.ok(r, `${nom} proposée`);
  return { o, r };
};

/** Un compromis ramené à sa dimension et à sa portée. */
function lire(texte: string, c: M): { key: string; leader: string | null } | null {
  const t = texte.replace(/^En échange, /, "").replace(/\.$/, "");
  for (const k of V.PREFERENCE_KEYS) {
    const neg = V.COMPROMIS_NEG[k];
    if (neg && t.startsWith(`${neg} qu'à `)) return { key: k, leader: t.slice(neg.length + 6) };
  }
  const k = V.PREFERENCE_KEYS.find((x: string) => V.raisonNeg(x, c) === t);
  return k ? { key: k, leader: null } : null;
}

/**
 * La règle, vérifiée sur un groupe affiché : un comparatif cite une commune du même groupe, à un palier meilleur
 * et à 12 points au moins ; une formulation absolue suppose un sous-score sous 50 ; jamais un critère ≥ 55.
 */
async function verifierGroupe(groupe: M[], ctx: string, vu: Record<string, Set<string>>) {
  const entrees = new Map<string, M>();
  for (const r of groupe) entrees.set(r.nom, await V.getCommuneEntry(r.insee));
  for (const r of groupe) {
    if (!r.compromis) continue;
    const c = entrees.get(r.nom)!;
    const l = lire(r.compromis, c);
    assert.ok(l, `${ctx} · ${r.nom} : compromis illisible « ${r.compromis} »`);
    const self = V.subScore(l.key, c);
    assert.ok(self != null && self < V.SEUIL_RAISON, `${ctx} · ${r.nom} : « ${r.compromis} » pour ${self}`);
    if (l.leader) {
      const ref = entrees.get(l.leader);
      assert.ok(ref, `${ctx} · ${r.nom} : « ${l.leader} » n'est pas affichée avec elle`);
      const s = V.subScore(l.key, ref);
      assert.ok(s - self >= 12, `${ctx} · ${r.nom} : écart ${Math.round(s - self)} avec ${l.leader} (${l.key})`);
      assert.ok(palier(s) < palier(self), `${ctx} · ${r.nom} (${Math.round(self)}) et ${l.leader} (${Math.round(s)}) au même palier : « ${r.compromis} »`);
      (vu.comparatif ??= new Set()).add(l.key);
    } else {
      assert.ok(self < V.SEUIL_FAIBLESSE, `${ctx} · ${r.nom} : formulation absolue pour ${Math.round(self)}`);
      (vu.absolu ??= new Set()).add(l.key);
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// 1 · Les reproductions
// ════════════════════════════════════════════════════════════════════════════════════════════════════

test("reproduction · Anglet (industrie 52) ne lit plus « plus présents qu'à Pau » (65) : le Pack les met à égalité", async () => {
  const { o, r } = await carte(["64"], [{ key: "faible_risque_inondation", weight: 3 }], "Anglet");
  const pau = o.results.slice(0, 3).find((x: M) => x.nom === "Pau");
  assert.ok(pau, "Pau dans le trio");
  const [ca, cp] = [await V.getCommuneEntry(r.insee), await V.getCommuneEntry(pau.insee)];
  const [sa, sp] = [V.subScore("faible_exposition_industrielle", ca), V.subScore("faible_exposition_industrielle", cp)];
  assert.ok(sa >= 50 && sa < 55 && sp - sa >= 12 && palier(sp) === palier(sa), `industrie ${sa} / ${sp}`);
  const ligne = o.comparaisonComplete.themes.flatMap((t: M) => t.lignes).find((l: M) => l.id === "industrie");
  assert.deepEqual(ligne.avantage, { type: "egalite" }, "le Pack ne voit aucune différence");
  assert.doesNotMatch(r.compromis, /qu'à Pau/);
  // Aucune autre dimension honnête ne reste : la carte n'invente pas de compromis.
  assert.equal(r.compromis, "");
});

test("reproduction · Aubagne (chaleur 4) ne se compare plus à Marseille (20) : les deux ont des étés chauds", async () => {
  const { o, r } = await carte(["13"], [{ key: "acces_transports", weight: 3 }, { key: "faible_dependance_auto", weight: 2 }, { key: "acces_services", weight: 2 }], "Aubagne");
  const c = await V.getCommuneEntry(r.insee);
  assert.ok(V.subScore("faible_chaleur", c) < 34);
  assert.doesNotMatch(r.compromis, /qu'à Marseille/);
  // La faiblesse reste dite, dans l'absolu, comme le dit la matrice (« Étés chauds »).
  assert.equal(r.compromis, "En échange, chaleur en hausse.");
  const ligne = o.comparaisonComplete.themes.flatMap((t: M) => t.lignes).find((l: M) => l.id === "etes_frais");
  const i = o.results.slice(0, 3).findIndex((x: M) => x.nom === "Aubagne");
  assert.equal(ligne.cellules[i].palier, "Étés chauds");
});

test("reproduction · Meylan (air 0) n'a plus « un peu moins pur qu'à Niederhausbergen » (15)", async () => {
  const { r } = await carte(null, [{ key: "acces_soins", weight: 3 }], "Meylan");
  assert.doesNotMatch(r.compromis, /un peu moins pur/);
  assert.equal(r.compromis, "En échange, air plus chargé en particules.");
});

// ════════════════════════════════════════════════════════════════════════════════════════════════════
// 2 · Les contre-épreuves du ticket
// ════════════════════════════════════════════════════════════════════════════════════════════════════

test("contre-épreuve 1 · calme 95 derrière 98 et 99 : le calme n'est un compromis pour personne", async () => {
  // Francheleins (95), Ambérieux-en-Dombes (98), Jujurieux (99), par la porte du comparateur.
  const s = await V.seedComparaison(["01165", "01005", "01199"]);
  assert.equal(s.trio.length, 3);
  for (const r of s.trio) assert.doesNotMatch(r.compromis, /bruyant/, r.nom);
});

test("contre-épreuve 2 · 51 face à 98 : un vrai retrait relatif reste dit, en comparatif", async () => {
  const { o, r } = await carte(["31"], [{ key: "faible_risque_feu", weight: 3 }], "Montréjeau");
  const c = await V.getCommuneEntry(r.insee);
  const s = V.subScore("acces_soins", c);
  assert.ok(s >= 50 && s < 55, `soins ${s}`);
  assert.equal(r.compromis, "En échange, l'offre de soins est plus limitée qu'à Bagnères-de-Luchon.");
  // Le Pack dit la même chose : Bagnères-de-Luchon au palier favorable, Montréjeau au palier intermédiaire.
  const ligne = o.comparaisonComplete.themes.flatMap((t: M) => t.lignes).find((l: M) => l.id === "soins");
  const noms = o.results.slice(0, 3).map((x: M) => x.nom);
  assert.equal(ligne.cellules[noms.indexOf("Montréjeau")].palier, "Accès intermédiaire");
  assert.equal(ligne.cellules[noms.indexOf("Bagnères-de-Luchon")].palier, "Bon accès aux soins");
});

test("contre-épreuve 3 · 52 face à 65, même palier : pas de compromis (Anglet, ci-dessus) ; Basse-Goulaine (vie locale 53) non plus", async () => {
  const { r } = await carte(["44"], [], "Basse-Goulaine");
  assert.doesNotMatch(r.compromis, /vie locale|qu'à Bouaye/);
});

test("contre-épreuve 4 · 49 sur une priorité déclarée : la faiblesse absolue reste dite (Plomeur, air)", async () => {
  const { r } = await carte(["29"], [{ key: "acces_soins", weight: 3 }, { key: "calme_sonore", weight: 2 }, { key: "air_sain", weight: 1 }], "Plomeur");
  const c = await V.getCommuneEntry(r.insee);
  const s = V.subScore("air_sain", c);
  assert.ok(s >= 45 && s < 50, `air ${s}`);
  assert.equal(r.tradeoff, "air plus chargé en particules");
  assert.equal(r.compromis, "En échange, air plus chargé en particules.");
});

test("contre-épreuve 5 · trois communes favorables partout : aucun compromis fabriqué", async () => {
  const s = await V.seedComparaison(["65059", "88196", "15014"]); // Bagnères-de-Bigorre, Gérardmer, Aurillac
  for (const r of s.trio) assert.equal(r.compromis, "", r.nom);
});

test("contre-épreuves 6 et 7 · trois communes aux étés chauds : aucune ne sert de référence à une autre", async () => {
  // Villeurbanne (8), Strasbourg (32), Paris : sur la base, « plus marquée qu'à Strasbourg ».
  const o = await recherche(null, [{ key: "acces_transports", weight: 3 }, { key: "faible_dependance_auto", weight: 2 }, { key: "acces_services", weight: 2 }]);
  const trio = o.results.slice(0, 3);
  const ch = new Map<string, number>();
  for (const r of trio) ch.set(r.nom, V.subScore("faible_chaleur", await V.getCommuneEntry(r.insee)));
  assert.ok([...ch.values()].every((s) => s < 34), JSON.stringify([...ch]));
  for (const r of trio) assert.doesNotMatch(r.compromis, /chaleur estivale est plus marquée/, r.nom);
  assert.equal(trio.find((x: M) => x.nom === "Villeurbanne").compromis, "En échange, chaleur en hausse.");
  await verifierGroupe(trio, "chaleur", {});
});

test("contre-épreuve 8 · donnée manquante : une commune sans mesure n'est ni comparée ni citée", async () => {
  // Poligny n'a ni mesure d'air ni mesure de soins ; Lons-le-Saunier et Arbois en ont.
  const s = await V.seedComparaison(["39434", "39300", "39013"]);
  const poligny = s.trio.find((r: M) => r.nom === "Poligny");
  const c = await V.getCommuneEntry(poligny.insee);
  assert.equal(V.subScore("air_sain", c), null);
  assert.equal(V.subScore("acces_soins", c), null);
  assert.doesNotMatch(poligny.compromis, /air|soins|médecins/);
  for (const r of s.trio) assert.doesNotMatch(r.compromis, /(air|soins).* qu'à Poligny/, r.nom);
  await verifierGroupe(s.trio, "Poligny", {});
});

// Le balayage : 20 périmètres × 11 projets, trio et pistes, comme l'inventaire (`scripts/fut154/inventaire.mts`).
const PROJETS: M[][] = [
  [{ key: "faible_risque_feu", weight: 3 }], [{ key: "faible_chaleur", weight: 3 }, { key: "acces_soins", weight: 2 }],
  [{ key: "acces_soins", weight: 3 }, { key: "calme_sonore", weight: 2 }, { key: "air_sain", weight: 1 }],
  [{ key: "nature", weight: 3 }, { key: "vie_locale", weight: 2 }, { key: "faible_secheresse", weight: 2 }],
  [{ key: "acces_transports", weight: 3 }, { key: "faible_dependance_auto", weight: 2 }, { key: "acces_services", weight: 2 }],
  [{ key: "viabilite_emploi", weight: 3 }, { key: "acces_ecoles", weight: 2 }, { key: "douceur_climat", weight: 1 }],
  [{ key: "faible_chaleur", weight: 3 }], [{ key: "acces_soins", weight: 3 }], [{ key: "proximite_mer", weight: 3 }], [{ key: "faible_risque_inondation", weight: 3 }], [],
];
const DEPTS = [null, "13", "84", "06", "29", "59", "63", "33", "67", "2A", "48", "75", "17", "65", "64", "31", "44", "35", "69", "38"];

test("contre-épreuve 9 · balayage : chaque comparatif cite une commune à un palier meilleur, sur toutes les dimensions", async () => {
  const vu: Record<string, Set<string>> = {};
  let groupes = 0;
  for (const d of DEPTS) for (const p of PROJETS) {
    const o = await recherche(d ? [d] : null, p);
    const ctx = `${d ?? "France"} ${p.map((x) => x.key).join("+") || "-"}`;
    for (const g of [o.results.slice(0, 3), o.pistes]) if (g.length) { groupes++; await verifierGroupe(g, ctx, vu); }
  }
  assert.ok(groupes > 400, `assez de groupes lus (${groupes})`);
  // Les cinq dimensions nommées par le ticket sont exercées dans les deux portées.
  for (const k of ["acces_soins", "faible_secheresse", "calme_sonore", "vie_locale", "faible_dependance_auto"]) {
    assert.ok(vu.comparatif?.has(k), `${k} : aucun comparatif dans le balayage`);
    assert.ok(vu.absolu?.has(k), `${k} : aucune formulation absolue dans le balayage`);
  }
});

test("contre-épreuve 10 · sans compromis : la carte, le Pack et AskFuture n'en affichent ni n'en inventent", async () => {
  // Le moteur rend une chaîne vide : la carte « Où vivre » et le comparateur la masquent déjà, le Pack aussi.
  const ouVivre = readFileSync(new URL("../app/(public)/ou-vivre/OuVivreClient.tsx", import.meta.url), "utf8");
  assert.match(ouVivre, /!outcome\?\.inondation\?\.exploration && r\.compromis && \(/);
  const comparateur = readFileSync(new URL("../app/(public)/comparateur/page.tsx", import.meta.url), "utf8");
  assert.match(comparateur, /\{r\.compromis && \(/);
  const pack = readFileSync(new URL("../app/(public)/comparateur/pack-decision/PackUnlockedView.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(pack, /<\/ul>\s*<p className="mt-4 pt-3 border-t/, "filet vide sous une piste sans compromis");
  assert.match(pack, /\{r\.compromis && \(\s*<p className="mt-4 pt-3 border-t/);
  // Une piste réelle sans compromis existe bien (Bagnères-de-Bigorre, étés frais + soins, France).
  const { r: piste } = await carte(null, [{ key: "faible_chaleur", weight: 3 }, { key: "acces_soins", weight: 2 }], "Bagnères-de-Bigorre", "pistes");
  assert.equal(piste.compromis, "");
  // AskFuture (comparateur, communes nommées) : le corps de ModeChoixAsk part tel quel au modèle, comparatif compris.
  const s = await V.seedComparaison(["65059", "31390", "31042"]); // Bagnères-de-Bigorre, Montréjeau, Bagnères-de-Luchon
  const body = {
    question: "Quel est le compromis de chacune ?",
    context: {
      reformulation: "Le lecteur compare des communes qu'il a lui-même nommées.", criteres: [], perimetre: [], orientation: [], synthese: "", aucun_territoire_parfait: false,
      territoires: s.trio.map((r: M, i: number) => ({ rang: i + 1, nom: r.nom, region: null, raisons: [], compromis: r.compromis, pression_eco: null, logement: r.logement, littoral: r.littoral, distinctive: r.distinctive, signaux: r.signaux, heritage_industriel: r.heritageIndustriel ?? null })),
    },
    focus: null, history: [], distinctId: "fut154",
  };
  const res = await ASK(new NextRequest("http://localhost/api/comparateur-vie/ask", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", "x-forwarded-for": "10.154.0.1" } }));
  assert.equal(res.status, 200);
  const envoye = JSON.stringify(etat.modele[0]);
  for (const r of s.trio) {
    if (r.compromis) assert.ok(envoye.includes(JSON.stringify(r.compromis).slice(1, -1)), `${r.nom} : compromis transmis tel quel`);
  }
  assert.ok(s.trio.some((r: M) => r.compromis === ""), "le trio contient une commune sans compromis");
  assert.ok(s.trio.some((r: M) => / qu'à /.test(r.compromis)), "et une commune au compromis comparatif");
});
