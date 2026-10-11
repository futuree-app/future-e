// FUT-87 · LE PROTOTYPE « MA DÉCISION » CHANGE LA MISE EN PAGE, JAMAIS CE QUE DIT LE MOTEUR.
//
// Deux invariants, vérifiés sur de vrais dossiers assemblés hors ligne (même chaîne que les tests
// E2E du moteur : `mapCommuneToModuleFacts` → `runRules` → `assembleDossier`) :
//   1. RIEN N'EST PERDU : chaque énoncé, nuance, geste et valeur observée des cartes de la minute
//      se retrouve dans la lecture du prototype ;
//   2. RIEN N'EST INVENTÉ : chaque texte de la lecture existe déjà dans le dossier du moteur, à
//      l'exception des deux intros de section que la production ajoute elle-même.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { mapCommuneToModuleFacts } from "../../../lib/decision/module-facts-map.ts";
import { runRules } from "../../../lib/decision/materiality-rules.ts";
import { assembleDossier } from "../../../lib/decision/decision-assembler.ts";
import { sectionsDeLaMinute } from "../../../lib/decision/dossier-view.ts";
import type { IndexCommune } from "../../../lib/comparateur-vie.ts";
import type { UserProject } from "../../../lib/user-project.ts";
import type { Dossier, DossierCard } from "../../../lib/decision/decision-fact.ts";
import { PRODUCT_CONVENTIONS_VERSION, type EvaluationContext } from "../../../lib/hard-constraints.ts";
import { hydrateHardConstraints } from "../../../lib/hard-constraints-hydrate.ts";
import type { PlaceDirectory } from "../../../lib/hard-constraints-resolve.ts";
import { lireDossier, type LectureDecision } from "./lecture-dossier.ts";
import { dossierAnchorId } from "../../../lib/decision/dossier-anchors.ts";

const DIR: PlaceDirectory = { byName: () => null, plmByName: () => null };
const entree = (over: Partial<IndexCommune> = {}): IndexCommune => ({
  insee: "59512", nom: "Roubaix", dept: "59", region: "HF", lat: 50.69, lon: 3.18,
  population: 98000, densite: 6800, mer_centre_km: 90, altitude: 30, clim: {}, pct: {}, ...(over as IndexCommune),
});
const projet = (prefs: { key: string; weight: number }[]): UserProject => ({
  posture: "recherche", intent: null, rawText: null,
  parsed: { reformulation: "x", hardConstraints: {}, preferences: prefs } as UserProject["parsed"], updatedAt: "1970-01-01T00:00:00.000Z",
});
const contexte = (f: { lat: number; lon: number; nom: string }): EvaluationContext => ({
  constraints: hydrateHardConstraints({}, DIR),
  point: { lat: f.lat, lon: f.lon, grain: "commune_reference", source: "commune_centroid", label: f.nom },
  conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
});
function dossier(e: IndexCommune, p: UserProject, taille: number | null, source: "urban_unit" | "commune" | null): Dossier {
  const mf = mapCommuneToModuleFacts(e, {}, { hasAddress: false, tailleVille: taille, tailleVilleSource: source });
  return assembleDossier(runRules(mf, p, contexte(mf)), p, "commune", e.nom);
}

const CAS: { nom: string; d: Dossier }[] = [
  { nom: "métropole, éviter les grandes villes", d: dossier(entree(), projet([{ key: "eviter_grandes_villes", weight: 3 }]), 1_050_000, "urban_unit") },
  { nom: "village, éviter l'isolement", d: dossier(entree({ nom: "Petiville" }), projet([{ key: "eviter_isolement", weight: 2 }]), 900, "commune") },
  { nom: "mer et vie locale loin du littoral", d: dossier(entree(), projet([{ key: "proximite_mer", weight: 3 }, { key: "vie_locale", weight: 2 }, { key: "eviter_grandes_villes", weight: 2 }]), 1_050_000, "urban_unit") },
  { nom: "sans priorité", d: dossier(entree(), projet([]), 98_000, "commune") },
];

/** Tous les textes que les cartes de la minute portent, tels que le moteur les a écrits. */
function textesDeLaMinute(d: Dossier): string[] {
  const out: string[] = [];
  const cles = new Set(["statement", "faceStatement", "summary", "limitation", "observedValue", "status", "headlineSubject", "title"]);
  const marche = (v: unknown, parent?: string) => {
    if (v == null) return;
    if (typeof v === "string") { if (parent && cles.has(parent)) out.push(v); return; }
    if (Array.isArray(v)) { v.forEach((x) => marche(x, parent)); return; }
    if (typeof v === "object") for (const [k, x] of Object.entries(v)) marche(x, k);
  };
  for (const s of sectionsDeLaMinute(d)) for (const c of s.cards as DossierCard[]) {
    if (c.kind === "fact") {
      // `statement` d'une correspondance n'est pas rendu par la production (D1) : elle lit
      // `faceStatement`. Le prototype suit la même règle.
      const { statement: _s, ...reste } = c.fact as unknown as Record<string, unknown>;
      marche(c.fact.role === "alignment" ? reste : c.fact);
      if ("action" in c.fact && c.fact.action) out.push(c.fact.action.label);
    } else {
      marche(c.composition);
    }
  }
  return out;
}

/** Tous les textes que la lecture affichera. */
function textesDeLaLecture(l: LectureDecision): string[] {
  const out: string[] = [];
  const marche = (v: unknown, parent?: string) => {
    if (v == null) return;
    if (typeof v === "string") { if (!["cle", "ancre", "nature", "grain", "href", "ton", "portee", "cause", "type"].includes(parent ?? "")) out.push(v); return; }
    if (Array.isArray(v)) { v.forEach((x) => marche(x, parent)); return; }
    if (typeof v === "object") for (const [k, x] of Object.entries(v)) marche(x, k);
  };
  marche(l);
  return out.filter((t) => t.length > 0);
}

const INTROS_DE_PRODUCTION = [
  "Au-delà de vos priorités, ces constats sont établis pour ce lieu.",
  "Au-delà de vos priorités, ces données n'ont pas encore pu être lues ici.",
  "À contrôler en priorité",
  "À contrôler ensuite",
];

test("L1. rien n'est perdu : chaque texte des cartes de la minute est dans la lecture", () => {
  let vus = 0;
  for (const { nom, d } of CAS) {
    const lecture = JSON.stringify(lireDossier(d));
    for (const t of textesDeLaMinute(d)) {
      vus++;
      assert.ok(lecture.includes(JSON.stringify(t).slice(1, -1)), `${nom} : « ${t} » absent de la lecture`);
    }
  }
  assert.ok(vus > 5, `des textes ont bien été vérifiés (${vus})`);
});

test("L2. rien n'est inventé : chaque texte de la lecture vient du dossier du moteur", () => {
  for (const { nom, d } of CAS) {
    const source = JSON.stringify(d);
    for (const t of textesDeLaLecture(lireDossier(d))) {
      if (INTROS_DE_PRODUCTION.includes(t)) continue;
      assert.ok(source.includes(JSON.stringify(t).slice(1, -1)), `${nom} : « ${t} » n'existe pas dans le dossier`);
    }
  }
});

test("L3. le verdict est celui du plan, mot pour mot, sections dans l'ordre de la minute", () => {
  for (const { nom, d } of CAS) {
    const l = lireDossier(d);
    assert.equal(l.verdict.titre, d.narrativePlan.verdict.headline.text, nom);
    assert.equal(l.verdict.etiquette, d.narrativePlan.verdictLabel, nom);
    assert.deepEqual(l.sections.map((s) => s.cle), sectionsDeLaMinute(d).map((s) => s.key), nom);
    assert.deepEqual(l.sections.map((s) => s.titre), sectionsDeLaMinute(d).map((s) => s.title), nom);
  }
  // Au moins un cas porte des cartes : sinon L1 et L2 ne prouveraient rien.
  assert.ok(CAS.some(({ d }) => lireDossier(d).sections.some((s) => s.entrees.length > 0)));
});

// ── Provenance : chaque preuve garde son lien, sa cible, son grain et sa date (revue V2) ──────────

type Ref = import("../../../lib/decision/decision-fact.ts").EvidenceRef;
const cloner = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const toutesLesPreuves = (e: import("./lecture-dossier.ts").EntreeLue) =>
  [...e.preuves, ...e.sources, ...e.cotes.flatMap((c) => [...c.preuves, ...c.sources])];
const memePreuve = (r: Ref) => (p: import("./lecture-dossier.ts").PreuveLue) =>
  p.libelle === r.label && (p.valeur ?? null) === (r.observedValue ?? null) && p.grain === r.grain
  && (p.href ?? null) === (r.href ?? null) && (p.cible ?? null) === (r.targetKey ?? null) && (p.date ?? null) === (r.observedAt ?? null);

/** Les références qu'une carte porte elle-même (pas celles de ses faits absorbés). */
function refsDeCarte(c: DossierCard): Ref[] {
  if (c.kind === "fact") return c.fact.role === "compromise" ? c.fact.sides.flatMap((x) => x.evidence) : c.fact.evidence;
  const k = c.composition;
  return k.kind === "tradeoff" ? [...k.favorableSide.evidence, ...k.unfavorableSide.evidence]
    : k.kind === "grouped_verification" ? k.items.flatMap((x) => x.evidence)
      : k.kind === "mismatch_with_action" ? k.evidence : k.sharedEvidence;
}

function verifierProvenance(nom: string, d: Dossier) {
  const l = lireDossier(d);
  let vues = 0;
  for (const s of sectionsDeLaMinute(d)) {
    const lue = l.sections.find((x) => x.cle === s.key)!;
    s.cards.forEach((c, i) => {
      const e = lue.entrees[i]!;
      for (const r of refsDeCarte(c)) {
        vues++;
        assert.ok(toutesLesPreuves(e).some(memePreuve(r)), `${nom} : la preuve « ${r.label} » (${r.grain}, ${r.href ?? "sans lien"}) a perdu une partie de sa provenance`);
        assert.ok(e.grains.includes(r.grain), `${nom} : le grain ${r.grain} de « ${r.label} » manque à la carte`);
      }
    });
  }
  return vues;
}

test("L4. chaque preuve de la minute survit entière : libellé, valeur, grain, lien, cible, date", () => {
  let vues = 0;
  for (const { nom, d } of CAS) vues += verifierProvenance(nom, d);
  assert.ok(vues >= 3, `${vues} preuves vérifiées`);
});

test("L5. preuves mixtes : une carte qui mêle commune, secteur et adresse garde ses trois grains et ses liens", () => {
  const cas = CAS.find(({ d }) => sectionsDeLaMinute(d).some((s) => s.cards.some((c) => c.kind === "fact")))!;
  const d = cloner(cas.d);
  const cible = sectionsDeLaMinute(d).flatMap((s) => s.cards).find((c) => c.kind === "fact")! as Extract<DossierCard, { kind: "fact" }>;
  // La carte est retrouvée dans le dossier cloné, puis enrichie de deux preuves d'autres grains.
  const fait = d.sections.flatMap((s) => s.cards).find((c) => c.kind === "fact" && c.fact.id === cible.fact.id) as Extract<DossierCard, { kind: "fact" }>;
  const refs = (fait.fact.role === "compromise" ? fait.fact.sides[0].evidence : fait.fact.evidence) as Ref[];
  refs.push(
    { factId: "temoin.secteur", module: "territoire", label: "Source témoin du secteur", grain: "secteur", href: "/rapport/autour#temoin", observedAt: "2026-10-01T00:00:00.000Z" },
    { factId: "temoin.adresse", module: "logement", label: "Mesure témoin à l'adresse", observedValue: "12 m", grain: "adresse", sourceMode: "live_fetch" },
  );
  verifierProvenance("preuves mixtes", d);
  const e = lireDossier(d).sections.flatMap((s) => s.entrees).find((x) => x.ancre === dossierAnchorId(cible.fact.id))!;
  assert.ok(e.grains.includes("secteur") && e.grains.includes("adresse"), `grains lus : ${e.grains.join(", ")}`);
  const source = e.sources.find((p) => p.libelle === "Source témoin du secteur")!;
  assert.equal(source.href, "/rapport/autour#temoin", "le lien d'une source sans valeur est conservé");
  assert.equal(source.date, "2026-10-01T00:00:00.000Z", "sa date aussi");
  assert.equal(e.preuves.find((p) => p.libelle === "Mesure témoin à l'adresse")?.mode, "live_fetch");
});

test("L6. une composition porte les grains de ses faits absorbés, et ce que sa face ne raconte pas reste lisible", () => {
  const cas = CAS.find(({ d }) => sectionsDeLaMinute(d).some((s) => s.cards.some((c) => c.kind === "fact")))!;
  const d = cloner(cas.d);
  const absorbe = cloner(d.sections.flatMap((s) => s.cards).find((c) => c.kind === "fact")! as Extract<DossierCard, { kind: "fact" }>).fact;
  absorbe.id = "temoin:absorbe";
  (absorbe.role === "compromise" ? absorbe.sides[0].evidence : absorbe.evidence).push({ factId: "temoin.bati", module: "logement", label: "Diagnostic témoin", grain: "adresse", href: "/rapport/logement#dpe" });
  d.absorbedFacts = [...d.absorbedFacts, absorbe];
  const composition = {
    id: "temoin:composition", kind: "shared_evidence", patternId: "territory-size-multiple-consequences",
    title: "Composition témoin", summary: "Résumé témoin.", headlineCause: "Cause témoin.",
    sharedEvidence: [{ factId: "temoin.commune", module: "territoire", label: "État témoin", observedValue: "village", grain: "commune" }],
    consequences: [], absorbedFactIds: [absorbe.id], referencedRuleIds: [], materialityTier: "secondary", displaySection: "mismatches",
  };
  const section = d.sections.find((s) => sectionsDeLaMinute(d).some((m) => m.key === s.key))!;
  section.cards.push({ kind: "composition", composition } as unknown as DossierCard);
  d.narrativePlan.minute = [...d.narrativePlan.minute, composition.id];
  const e = lireDossier(d).sections.flatMap((s) => s.entrees).find((x) => x.sujet === "Composition témoin")!;
  assert.ok(e.grains[0] === "commune" && e.grains.includes("adresse"), `le grain de la composition ET celui du fait absorbé (lus : ${e.grains.join(", ")})`);
  // Aucune conséquence ne nomme ce fait : la face ne le raconte pas, il reste dans le détail, lien compris.
  assert.equal(e.detailles.length, 1);
  assert.ok(e.detailles[0]!.sources.some((p) => p.href === "/rapport/logement#dpe"));
});

// ── Rigueur des dessins ───────────────────────────────────────────────────────────────────────

test("D1. la règle du temps pose des jalons et ne trace jamais de ligne entre deux horizons", () => {
  const src = readFileSync("src/components/prototypes/fut87/primitives.tsx", "utf8");
  const debut = src.indexOf("export function RegleDuTemps(");
  // La fonction suivante du fichier borne le découpage, quelle qu'elle soit.
  const regle = src.slice(debut, src.indexOf("\nexport function ", debut + 1));
  assert.ok(regle.length > 200, "fonction trouvée");
  const code = regle.split("\n").filter((l) => !l.trim().startsWith("//") && !l.trim().startsWith("*")).join("\n");
  for (const interdit of [/<polyline/, /<path/, /points=\{/]) assert.doesNotMatch(code, interdit, `la règle du temps ne relie pas ses jalons (${interdit})`);
});

// ── Isolation : les prototypes n'existent pas en production ───────────────────────────────────

const RACINE_PROTO = "src/app/dev/fut87";
function pages(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? pages(p) : n === "page.tsx" || n === "layout.tsx" ? [p] : [];
  });
}

test("I1. chaque page et le gabarit des prototypes renvoient une 404 en production, côté serveur", () => {
  const fichiers = pages(RACINE_PROTO);
  assert.ok(fichiers.length >= 6, `${fichiers.length} fichiers`);
  for (const f of fichiers) {
    const src = readFileSync(f, "utf8");
    assert.ok(!/^\s*["']use client["']/m.test(src), `${f} : composant serveur`);
    assert.ok(/if \(process\.env\.NODE_ENV === "production"\) notFound\(\);/.test(src), `${f} : garde de production absente`);
  }
  assert.match(readFileSync(join(RACINE_PROTO, "layout.tsx"), "utf8"), /robots: \{ index: false, follow: false \}/);
});

test("I2. aucune donnée personnelle ni adresse réelle dans les fixtures et prototypes", () => {
  const dossierProto = "src/components/prototypes/fut87";
  const tout = [...readdirSync(dossierProto).map((n) => join(dossierProto, n)), ...pages(RACINE_PROTO)]
    .filter((f) => statSync(f).isFile() && !f.endsWith(".test.ts"))
    .map((f) => readFileSync(f, "utf8"))
    .join("\n");
  for (const interdit of [/Haute Dronne/i, /Saint-Pardoux/i, /quentin/i, /@gmail/i, /dossierId=[0-9a-f]{8}-/i, /Saint-Dominique/i]) {
    assert.doesNotMatch(tout, interdit);
  }
});
