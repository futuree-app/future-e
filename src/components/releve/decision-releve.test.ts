// FUT-91 · « LE RELEVÉ » DANS LE VRAI HUB MA DÉCISION : CE QUI NE DOIT PAS SE PERDRE EN CHEMIN.
//
// Les tests de fidélité de la lecture (rien perdu, rien inventé, provenance, périmètre) vivent dans
// `lecture-dossier.test.ts`. Ceux-ci couvrent l'intégration :
//   A. l'activation (livrée éteinte, une prop explicite gagne) ;
//   B. les liens de preuve portent la provenance de l'artefact servi, comme en production ;
//   C. les ancres de la minute existent pour chaque carte rendue, et la liste complète n'en duplique aucune ;
//   D. la liste complète des contrôles reste complète (la minute n'est pas le dossier) ;
//   E. la structure de production est préservée : lecture enrichie, états, aucune seconde sélection.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mapCommuneToModuleFacts } from "../../lib/decision/module-facts-map.ts";
import { runRules } from "../../lib/decision/materiality-rules.ts";
import { assembleDossier } from "../../lib/decision/decision-assembler.ts";
import { sectionsDeLaMinute, controlesParEchelle, ancresRendues } from "../../lib/decision/dossier-view.ts";
import { dossierAnchorId } from "../../lib/decision/dossier-anchors.ts";
import { evidenceHref } from "../../lib/decision/evidence-targets.ts";
import type { IndexCommune } from "../../lib/comparateur-vie.ts";
import type { UserProject } from "../../lib/user-project.ts";
import type { Dossier } from "../../lib/decision/decision-fact.ts";
import { PRODUCT_CONVENTIONS_VERSION, type EvaluationContext } from "../../lib/hard-constraints.ts";
import { hydrateHardConstraints } from "../../lib/hard-constraints-hydrate.ts";
import type { PlaceDirectory } from "../../lib/hard-constraints-resolve.ts";
import { presentationDuDossier } from "./activation.ts";
import { margeDe } from "./marge.ts";
import { lireDossier, lireCarteDuDossier, lectureDesEchelles, type PreuveLue } from "./lecture-dossier.ts";

const DIR: PlaceDirectory = { byName: () => null, plmByName: () => null };
const entree = (over: Partial<IndexCommune> = {}): IndexCommune => ({
  insee: "59512", nom: "Roubaix", dept: "59", region: "HF", lat: 50.69, lon: 3.18,
  population: 98000, densite: 6800, mer_centre_km: 90, altitude: 30, clim: {}, pct: {}, ...(over as IndexCommune),
});
const projet = (prefs: { key: string; weight: number }[]): UserProject => ({
  posture: "recherche", intent: null, rawText: null,
  parsed: { reformulation: "x", hardConstraints: {}, preferences: prefs } as UserProject["parsed"], updatedAt: "1970-01-01T00:00:00.000Z",
});
function dossier(e: IndexCommune, p: UserProject, taille: number, source: "urban_unit" | "commune", scope: "commune" | "commune+adresse" = "commune"): Dossier {
  const mf = mapCommuneToModuleFacts(e, {}, { hasAddress: scope !== "commune", tailleVille: taille, tailleVilleSource: source });
  const ctx: EvaluationContext = {
    constraints: hydrateHardConstraints({}, DIR),
    point: { lat: mf.lat, lon: mf.lon, grain: "commune_reference", source: "commune_centroid", label: mf.nom },
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };
  return assembleDossier(runRules(mf, p, ctx), p, scope, e.nom);
}
const CAS: Dossier[] = [
  dossier(entree(), projet([{ key: "eviter_grandes_villes", weight: 3 }]), 1_050_000, "urban_unit"),
  dossier(entree({ nom: "Petiville" }), projet([{ key: "eviter_isolement", weight: 2 }]), 900, "commune"),
  dossier(entree(), projet([{ key: "proximite_mer", weight: 3 }, { key: "vie_locale", weight: 2 }, { key: "eviter_grandes_villes", weight: 2 }]), 1_050_000, "urban_unit"),
  dossier(entree(), projet([{ key: "eviter_grandes_villes", weight: 3 }]), 1_050_000, "urban_unit", "commune+adresse"),
];
const code = (p: string) => readFileSync(p, "utf8").split("\n").filter((l) => !l.trim().startsWith("//") && !l.trim().startsWith("*")).join("\n");

// ── A. Activation ─────────────────────────────────────────────────────────────────────────────

test("A1. livrée éteinte : sans DECISION_RELEVE=true, la production garde l'écran actuel", () => {
  assert.equal(presentationDuDossier(undefined, {}), "classique");
  assert.equal(presentationDuDossier(undefined, { DECISION_RELEVE: "1" }), "classique", "seule la valeur « true » active");
  assert.equal(presentationDuDossier(undefined, { DECISION_RELEVE: "true" }), "releve");
  assert.equal(presentationDuDossier("classique", { DECISION_RELEVE: "true" }), "classique", "une prop explicite gagne");
  assert.equal(presentationDuDossier("releve", {}), "releve");
});

// ── B. Liens de preuve ────────────────────────────────────────────────────────────────────────

test("B1. un lien de preuve porte la provenance de l'artefact servi, comme evidenceHref en production", () => {
  const avecCible: PreuveLue = { libelle: "Étiquette énergie", valeur: "G", grain: "adresse", href: "/rapport/logement", cible: "housing.energy_label" };
  const source: PreuveLue = { libelle: "Base des DPE", grain: "adresse", href: "/rapport/logement", cible: "housing.energy_label", date: "2026-09-01T00:00:00.000Z" };
  const marge = margeDe({ grains: ["adresse"], preuves: [avecCible], sources: [source] }, "logement:artefact-7");
  const liens = marge.flatMap((m) => ("href" in m && m.href ? [m.href] : []));
  assert.deepEqual(liens, [
    evidenceHref("housing.energy_label", "/rapport/logement", "logement:artefact-7"),
    evidenceHref("housing.energy_label", "/rapport/logement", "logement:artefact-7"),
  ]);
  assert.ok(liens.every((l) => l.includes("preuve=logement%3Aartefact-7")), "la version figée est désignée");
  // Sans artefact, aucune version n'est désignée : le lien vise la donnée courante.
  const courant = margeDe({ grains: ["adresse"], preuves: [avecCible], sources: [] }).flatMap((m) => ("href" in m && m.href ? [m.href] : []));
  assert.ok(courant.every((l) => !l.includes("preuve=")));
  // Une source sans valeur garde son lien et sa date.
  const s = marge.find((m) => m.type === "source");
  assert.ok(s && s.type === "source" && s.href && s.date?.includes("1er septembre 2026"));
});

test("B2. une marge sans preuve reste vide : aucune mesure fabriquée pour la remplir", () => {
  assert.deepEqual(margeDe({ grains: [], preuves: [], sources: [] }), []);
});

// ── C. Ancres ─────────────────────────────────────────────────────────────────────────────────

test("C1. chaque carte de la minute porte l'ancre de production, et les gestes prioritaires visent des cartes rendues", () => {
  for (const d of CAS) {
    const l = lireDossier(d);
    const ancres = new Set(l.sections.flatMap((s) => s.entrees.map((e) => e.ancre)));
    for (const s of sectionsDeLaMinute(d)) for (const c of s.cards) {
      const id = c.kind === "composition" ? c.composition.id : c.fact.id;
      assert.ok(ancres.has(dossierAnchorId(id)), `ancre absente pour ${id}`);
    }
    // Les ancres que `PriorityControlActions` peut activer viennent du moteur (`ancresRendues`), et
    // celles de la minute y figurent toutes.
    const rendues = new Set(ancresRendues(d).map(dossierAnchorId));
    for (const a of ancres) if (!l.sections.find((s) => s.cle === "alignments")?.entrees.some((e) => e.ancre === a)) assert.ok(rendues.has(a), `${a} activable`);
  }
});

test("C2. la liste complète des contrôles ne pose aucune ancre (pas d'identifiant en double avec la minute)", () => {
  const src = code("src/components/releve/ControlesReleve.tsx");
  assert.match(src, /<EntreeReleve [^>]*ancre=\{false\}/);
  assert.match(code("src/components/releve/EntreeReleve.tsx"), /id=\{ancre \? e\.ancre : undefined\}/);
});

// ── D. La minute n'est pas le dossier ─────────────────────────────────────────────────────────

test("D1. la liste complète rend TOUS les contrôles du moteur, avec leurs textes", () => {
  for (const d of CAS) {
    const groupes = controlesParEchelle(d);
    const attendues = d.sections.find((s) => s.key === "verifications")?.cards ?? [];
    assert.equal(groupes.reduce((n, g) => n + g.cards.length, 0), attendues.length, "aucun contrôle perdu par le regroupement");
    for (const g of groupes) for (const c of g.cards) {
      const e = lireCarteDuDossier(d, c);
      const texte = c.kind === "fact" ? (c.fact.role === "alignment" ? c.fact.faceStatement : c.fact.statement) : c.composition.summary;
      assert.equal(e.enonce, texte);
    }
  }
});

test("D2. l'emblème compte aussi les contrôles hors minute : une échelle n'est « sans constat » que si la page n'en montre aucun", () => {
  const d = JSON.parse(JSON.stringify(CAS[3]!)) as Dossier; // dossier d'adresse
  // Un contrôle établi À L'ADRESSE, dans le dossier complet mais hors de la minute (cas vu à l'écran
  // sur un vrai dossier d'adresse : trois contrôles au logement, aucun dans la minute).
  const verif = { kind: "fact", fact: {
    id: "temoin:controle-adresse", ruleId: "temoin", sourceFactIds: [], module: "logement", role: "verification",
    statement: "Constat témoin à l'adresse.", topic: "témoin", materialityTier: "secondary",
    evidence: [{ factId: "temoin", module: "logement", label: "Source témoin", grain: "adresse" }],
    action: { type: "verifier_sur_place", label: "Vérifier sur place" },
  } } as unknown as Dossier["sections"][number]["cards"][number];
  const section = d.sections.find((s) => s.key === "verifications");
  if (section) section.cards.push(verif); else d.sections.push({ key: "verifications", title: "À contrôler", cards: [verif] });
  const l = lireDossier(d);
  const minuteSeule = lectureDesEchelles(l).find((e) => e.echelle === "logement")!;
  assert.ok(minuteSeule.etat === "examinee" && minuteSeule.constats === 0, "la minute seule ne le voit pas");
  const page = lectureDesEchelles(l, controlesParEchelle(d).flatMap((g) => g.cards.map((c) => lireCarteDuDossier(d, c)))).find((e) => e.echelle === "logement")!;
  assert.ok(page.etat === "examinee" && page.constats === 1, "la page le montre : l'emblème le compte");
  // Et une carte présente aux deux endroits ne compte qu'une fois.
  const deuxFois = lectureDesEchelles(l, l.sections.flatMap((s) => s.entrees));
  assert.deepEqual(deuxFois, lectureDesEchelles(l));
  assert.match(code("src/components/releve/DossierDecisionReleve.tsx"), /lectureDesEchelles\(lecture, controlesParEchelle\(dossier\)/);
});

// ── E. Structure de production préservée ──────────────────────────────────────────────────────

test("E1. la bascule se fait AVANT le rendu classique et transmet toutes les props", () => {
  const src = code("src/components/report/DossierDecisionSection.tsx");
  const bascule = src.indexOf('presentationDuDossier(presentation) === "releve"');
  assert.ok(bascule > 0 && bascule < src.indexOf("const structured"), "bascule avant le corps classique");
  const appel = src.slice(bascule, src.indexOf("/>", bascule));
  for (const p of ["dossier", "logement", "logementStatus", "insee", "scopeKey", "provenance", "projetAChange", "voisinageAChange", "generatedAt", "espacement", "titre", "supportingPane"]) {
    assert.match(appel, new RegExp(`\\b${p}=\\{${p}\\}`), `prop ${p} transmise`);
  }
  assert.match(code("src/components/report/ControlesDuDossier.tsx"), /presentationDuDossier\(presentation\) === "releve"\) return <ControlesReleve dossier=\{dossier\} provenance=\{provenance\} \/>/);
});

test("E2. la lecture enrichie est intacte : gating, prefetch, hash, cache, génération, validation ; la présentation traverse les quatre chemins", () => {
  const src = code("src/components/report/ConclusionRedigee.tsx");
  for (const t of ['process.env.DOSSIER_NARRATIVE === "true"', "next-router-prefetch", "shouldGenerateNarrative(plan)", "buildConclusionHash(plan)", "readNarrative(", "validateGeneratedBlocks(plan", "saveNarrative(", "pruneNarratives("]) {
    assert.ok(src.includes(t), `présent : ${t}`);
  }
  const blocs = src.match(/<ConclusionBlock [^>]*\/>/g) ?? [];
  assert.equal(blocs.length, 4, "les quatre chemins de rendu");
  for (const b of blocs) assert.match(b, /variante=\{variante\} apresTitre=\{apresTitre\}/);
});

test("E3. le relevé ne génère rien, ne resélectionne rien, et garde les états de production", () => {
  const src = code("src/components/releve/DossierDecisionReleve.tsx");
  assert.doesNotMatch(src, /generateObject|@ai-sdk|anthropic/, "aucun appel au modèle");
  assert.doesNotMatch(src, /sectionsDeLaMinute|sectionsAffichees|\.cards\.slice|\.cards\.filter/, "aucune seconde sélection de faits");
  assert.match(src, /const lecture = lireDossier\(dossier\);/);
  // `pending` : déterministe, sans ConclusionRedigee (pas de second appel pendant l'analyse d'adresse).
  assert.match(src, /logementStatus === "pending" \? deterministe : \(\s*<Suspense fallback=\{deterministe\}>\s*<ConclusionRedigee /);
  // La date n'existe que pour un artefact, jamais « aujourd'hui ».
  assert.match(src, /generatedAt && dateFr\(generatedAt\)/);
  assert.doesNotMatch(src, /new Date\(\)/);
  assert.match(src, /\(projetAChange \|\| voisinageAChange\) && insee/);
  assert.match(src, /raison=\{projetAChange \? "projet" : "voisinage"\}/);
  assert.match(src, /logementStatus === "unavailable"/);
  assert.match(src, /renderedIds = ancresRendues\(dossier\)/);
  assert.match(src, /conditionPorteeParLeBloc\(dossier\)/);
});

test("E4. la plaque applique les règles du bloc classique (FUT-54) sans rien recalculer", () => {
  const src = code("src/components/report/ConclusionBlock.tsx");
  const plaque = src.slice(src.indexOf("function ConclusionPlaque("));
  for (const t of [
    "plan.verdict.headline.text", 'byKey.get("verdict")?.text ?? plan.verdict.detail', 'byKey.get("unexamined_hard_constraints")',
    'byKey.get("uncovered_priorities")?.text', 'plan.verdictTone !== "critical"', "<PriorityControlActions", "plan.verdictLabel",
  ]) assert.ok(plaque.includes(t), `plaque : ${t}`);
  assert.doesNotMatch(plaque, /verdictTone\s*=|verdictLabel\s*=|headline\.text\s*=/, "aucune réécriture du verdict");
});

test("E5. aucune couleur codée en dur dans le relevé de production", () => {
  for (const f of ["DossierDecisionReleve.tsx", "EntreeReleve.tsx", "ControlesReleve.tsx", "marge.ts"]) {
    assert.doesNotMatch(code(`src/components/releve/${f}`), /#[0-9a-fA-F]{3,8}\b/, f);
  }
});
