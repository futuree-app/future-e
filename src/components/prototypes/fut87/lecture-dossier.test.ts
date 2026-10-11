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
