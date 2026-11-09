// FUT-178 : LE SIGNAL DE NATURE ENVIRONNANTE DIT SA PORTÉE RÉELLE.
//
// `nature.score` / `nature.radius_pct` (scripts/populate-nature.py, OSO 2023) agrègent le couvert naturel de communes
// ENTIÈRES retenues parce que leur centre (lat/lon de l'index) est à 15 km au plus de celui de la commune, elle
// comprise. Ce n'est ni la commune seule (`nature.brut_pct`), ni un cercle de 15 km, ni les abords d'une adresse.
// Recalcul du 09/11/2026 (docs/audits/2026-11-09-fut178-portee-nature.md) : 0 écart sur 34 743 communes ; 3 communes
// n'ont qu'elles-mêmes dans leur « rayon » ; la grille de recherche omet des voisines à ≤ 15 km pour 2 465 communes.
//
// On vérifie ce que les surfaces RACONTENT (pas seulement qu'elles apparaissent), sur l'index réel. Aucun appel au modèle.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { MISMATCH_RULES } from "./decision/mismatch-rules.ts";
import { ALIGNMENT_RULES } from "./decision/alignment-rules.ts";
import { MISMATCH_LABELS, ALIGNMENT_LABELS } from "./decision/mismatch-facts.ts";
import type { ModuleFacts } from "./decision/decision-fact.ts";
import type { UserProject } from "./user-project.ts";

const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (spec.startsWith("@/")) return next(${JSON.stringify(racine)} + "src/" + spec.slice(2) + ".ts", ctx);
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\\.[cm]?[jt]s$|\\.json$/.test(spec)) {
    try { return await next(spec + ".ts", ctx); } catch { return next(spec, ctx); }
  }
  return next(spec, ctx);
}`;
before(() => { register(`data:text/javascript,${encodeURIComponent(hook)}`); });

/* eslint-disable @typescript-eslint/no-explicit-any */
type Moteur = {
  seedComparaison: (i: string[]) => Promise<{ trio: any[]; comparaison: any } | null>;
  getCommuneEntry: (insee: string) => Promise<any>;
  buildTerritorySignals: (c: unknown) => Record<string, any>;
  DIMENSIONS: any[];
};
const moteur = async () => (await import(`${racine}src/lib/comparateur-vie.ts`)) as Moteur;
/* eslint-enable @typescript-eslint/no-explicit-any */

// Ce qu'aucune phrase de la nature environnante ne doit plus dire.
const INTERDIT = /territoire peu naturel|caractère naturel|rayon de 15 km|grands espaces|accès aux espaces naturels|forêts et espaces|lieu de vie|urbanis/i;

const CHATELAILLON = "17094", BONY = "02100", JANVILLE = "28199", CORTE = "2B096", BORDEAUX = "33063", LILLE = "59350", SAINTES_MARIES = "13096";

test("Châtelaillon-Plage : le couvert de la commune et celui des alentours sont deux mesures distinctes, et le signal ne prend que la seconde", async () => {
  const m = await moteur();
  const c = await m.getCommuneEntry(CHATELAILLON);
  // Les deux chiffres de l'index : 36,5 % dans la commune, 27,9 % avec les voisines. Le rang (8) suit le second.
  assert.equal(c.nature.brut_pct, 36.5);
  assert.equal(c.nature.radius_pct, 27.9);
  assert.equal(c.nature.score, 8);
  const s = m.buildTerritorySignals(c);
  assert.equal(s.nature, undefined, "l'ancien signal sans périmètre ne part plus au modèle");
  assert.equal(s.espaces_naturels_alentour.niveau, "peu d'espaces naturels alentour");
  assert.match(s.espaces_naturels_alentour.perimetre, /^la commune et les communes voisines dont le centre est à moins d'une quinzaine de kilomètres du sien$/);
  assert.match(s.espaces_naturels_alentour.ne_dit_pas, /commune seule/);
  assert.match(s.espaces_naturels_alentour.ne_dit_pas, /adresse/);
  // Aucun chiffre ne passe : ni 36,5 ni 27,9 ne peuvent être attribués à la mauvaise échelle, et le contrôle de /qna
  // rejetterait un « 15 km » non sourcé.
  assert.doesNotMatch(JSON.stringify(s.espaces_naturels_alentour), /\d/);
});

test("Bony et Janville-en-Beauce : peu d'espaces naturels alentour, jamais une commune urbanisée ni « peu naturelle »", async () => {
  const m = await moteur();
  for (const insee of [BONY, JANVILLE]) {
    const c = await m.getCommuneEntry(insee);
    // Ce qui n'est pas naturel ici, ce sont des cultures (≈ 90 % de la commune), dans une commune peu dense.
    assert.ok(c.nature.composition.agricole >= 89, c.nom);
    assert.ok(c.densite < 100, c.nom);
    const sig = m.buildTerritorySignals(c).espaces_naturels_alentour;
    assert.equal(sig.niveau, "peu d'espaces naturels alentour", c.nom);
    assert.doesNotMatch(sig.niveau + sig.perimetre, INTERDIT, c.nom);
    assert.match(sig.ne_dit_pas, /cultures/);
    assert.match(sig.ne_dit_pas, /jamais à lui seul une ville ou un territoire urbanisé/);
  }
});

test("des environnements contrastés reçoivent chacun le niveau de leur rang, toujours « alentour »", async () => {
  const m = await moteur();
  const attendu: Record<string, string> = {
    [CORTE]: "beaucoup d'espaces naturels alentour", // 99,6 % alentour
    [BORDEAUX]: "espaces naturels présents alentour", // 54 % alentour, 36,4 % dans la commune
    [LILLE]: "peu d'espaces naturels alentour", // 27 % alentour, 82 % urbanisé dans la commune
    [SAINTES_MARIES]: "beaucoup d'espaces naturels alentour", // surtout de l'eau : ni « forêts », ni « montagne »
  };
  for (const [insee, niveau] of Object.entries(attendu)) {
    const sig = m.buildTerritorySignals(await m.getCommuneEntry(insee)).espaces_naturels_alentour;
    assert.equal(sig.niveau, niveau, insee);
    assert.doesNotMatch(Object.values(sig).join(" "), /forêt|cercle exact|dans un rayon/i, insee);
  }
});

test("le modèle de /qna reçoit la règle de lecture du signal", () => {
  const qna = readFileSync("src/lib/accueil/qna.ts", "utf8");
  assert.match(qna, /territory_signals\.espaces_naturels_alentour/);
  assert.match(qna, /never as an exact circle around it/);
  assert.match(qna, /never turn few natural areas into a city or an urbanised commune/);
});

test("la carte « Espaces naturels » ne présente plus la sélection de communes voisines comme un cercle de 15 km", () => {
  const src = readFileSync("src/components/report/QuartierClimatData.tsx", "utf8");
  assert.doesNotMatch(src, /Dans un rayon de 15 km/);
  assert.match(src, /En comptant aussi les communes voisines dont le centre est à moins de 15 km du sien : \$\{couvertNaturel\.radiusPct\} %\./);
  // La ventilation est celle de la commune seule (pixels dans son contour).
  assert.match(src, /breakdownLabel: "Ce qui couvre la commune"/);
});

// ── Dossier : écart au projet et point fort sur la priorité « nature » ─────────────────────────────────────────────
function facts(insee: string, nom: string, low: number, high: number): ModuleFacts {
  return {
    insee, nom, dept: insee.slice(0, 2), lat: 46, lon: 2, uu: null,
    tailleVille: 500, tailleVilleSource: "commune", reliefProximite: 0, merCentreKm: 200, population: 200, altitude: 100,
    catnatInondation: 0, inondationRisque: 10, climat: null, sante: null,
    rankBands: { nature: { low, high } }, scores: {}, hasAddress: false,
  } as unknown as ModuleFacts;
}
const projet: UserProject = {
  posture: "recherche", intent: null, rawText: null,
  parsed: { reformulation: "x", hardConstraints: {}, preferences: [{ key: "nature", weight: 3 }] } as unknown as UserProject["parsed"],
  updatedAt: "1970-01-01T00:00:00.000Z",
};

test("dossier, Bony : l'écart sur la nature dit une part d'espaces naturels alentour, sa portée, et pas une urbanisation", () => {
  const r = MISMATCH_RULES.find((x) => x.id === "territoire.mismatch-nature")!.evaluate(facts(BONY, "Bony", 0, 0.01), projet, undefined as never);
  assert.equal(r.outcome, "mismatch");
  const f = r.facts[0]!;
  assert.match(f.statement, /^Vous avez placé la proximité des espaces naturels parmi vos priorités\. Sur la part d'espaces naturels alentour, Bony se situe parmi les .+ de communes les moins favorables de France\.$/);
  assert.equal(f.headlineSubject, "les espaces naturels alentour");
  assert.match(f.limitation!, /dans la commune et les communes voisines dont le centre est à moins de 15 km du sien/);
  assert.match(f.limitation!, /ni la commune seule, ni les abords d'une adresse/);
  assert.match(f.limitation!, /cultures, pas à la ville/);
  for (const t of [f.statement, f.topic, f.headlineSubject ?? "", f.limitation!]) assert.doesNotMatch(t, INTERDIT);
});

test("dossier, Corte : le point fort sur la nature dit « entourées d'espaces naturels », plus « l'accès »", () => {
  const r = ALIGNMENT_RULES.find((x) => x.id === "territoire.alignment-nature")!.evaluate(facts(CORTE, "Corte", 0.97, 0.99), projet, undefined as never);
  assert.equal(r.outcome, "satisfied");
  const f = r.facts[0]!;
  assert.match(f.statement, /^Pour les espaces naturels alentour, Corte se situe parmi les .+ de communes les plus entourées d'espaces naturels en France\.$/);
  assert.match(f.limitation!, /communes voisines dont le centre est à moins de 15 km/);
  assert.doesNotMatch(f.statement, INTERDIT);
});

test("les libellés du dossier pour la nature ne promettent ni un accès, ni une mesure communale", () => {
  const lab = MISMATCH_LABELS.nature!;
  assert.ok(lab.subject.length <= 45);
  for (const t of [lab.topic, lab.indicator, lab.subject, ALIGNMENT_LABELS.nature!.headlineSubject, ALIGNMENT_LABELS.nature!.favorableStatusTemplate]) {
    assert.doesNotMatch(t, INTERDIT, t);
  }
  assert.match(ALIGNMENT_LABELS.nature!.favorableStatusTemplate, /\{rank\} de communes/);
});

// ── Comparateur ────────────────────────────────────────────────────────────────────────────────────────────────────
test("comparateur : la ligne, la raison et le point fort de la nature disent « alentour », jamais forêts, grands espaces ni lieu de vie", async () => {
  const m = await moteur();
  const dim = m.DIMENSIONS.find((d) => d.id === "nature");
  assert.equal(dim.aide, "La part d'espaces naturels dans la commune et ses voisines (centres à moins de 15 km), pas aux abords d'une adresse.");
  assert.equal(dim.forte, "les espaces naturels qui l'entourent");
  const src = readFileSync("src/lib/comparateur-vie.ts", "utf8");
  assert.match(src, /label: "la plus entourée d'espaces naturels", key: "nature"/);
  assert.match(src, /\n {2}nature: "beaucoup d'espaces naturels alentour",/);
  assert.match(src, /\n {2}nature: "peu d'espaces naturels alentour",/);
  assert.match(src, /\n {2}nature: "nature présente alentour, sans abonder",/);
  // Corte face à Bony et Janville : ce que le comparateur écrit réellement.
  const seed = await m.seedComparaison([CORTE, BONY, JANVILLE]);
  assert.ok(seed);
  const texte = JSON.stringify(seed);
  assert.doesNotMatch(texte, /territoire peu naturel|grands espaces naturels|forêts et espaces naturels|ses espaces naturels|autour du lieu de vie|urbanis/);
});
