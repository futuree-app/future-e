// FUT-96 : CE QUE LE DOSSIER DIT D'UNE PRIORITÉ « SANS VOITURE », ET CE QU'IL N'EN DIT PAS.
//
// La mesure est `mobilite.part_voiture` : la part des actifs occupés qui vont TRAVAILLER principalement
// en voiture (INSEE MOBPRO 2022, pondéré IPONDI), classée parmi les communes de France. Elle ne dit ni
// les courses, ni l'école, ni les loisirs, ni ce que le lecteur pourra faire lui-même. Avant FUT-96, le
// dossier écrivait « la possibilité de se déplacer sans voiture · Parmi les 5 % de communes où elle est
// la plus favorable » : une faisabilité personnelle tirée d'un rang de pratiques domicile-travail
// (étude La Rochelle du 13/10/2026, `etude/larochelle-mobilite` ade5e42e, observation n° 1).
//
// Ces tests suivent la vraie chaîne (`runRules` → `composeFacts` → `assembleDossier`) et vérifient ce
// que le dossier RACONTE, pas seulement qu'une carte apparaît (AGENTS.md). Les rangs sont FICTIFS.
import test from "node:test";
import assert from "node:assert/strict";
import { mapCommuneToModuleFacts } from "./module-facts-map.ts";
import { runRules } from "./materiality-rules.ts";
import { assembleDossier } from "./decision-assembler.ts";
import { composeFacts } from "./fact-compositions.ts";
import {
  buildDecisionArtifact, parseDecisionArtifact, dossierAServir, ENGINE_VERSION, type StoredArtifact,
} from "./decision-artifact.ts";
import { buildConclusionHash } from "./conclusion-hash.ts";
import { hydrateHardConstraints } from "../hard-constraints-hydrate.ts";
import { PRODUCT_CONVENTIONS_VERSION, type EvaluationContext } from "../hard-constraints.ts";
import { normalizeUserProject, type UserProject } from "../user-project.ts";
import type { IndexCommune, PreferenceKey } from "../comparateur-vie.ts";
import type { AlignmentFact, DecisionFact, Dossier, MismatchFact } from "./decision-fact.ts";

// Ce que futur•e ne doit plus affirmer à partir de cette mesure. Le souhait du lecteur, lui, reste dit.
const PROMESSE_EXCESSIVE =
  /possibilit[ée] de se (d[ée]placer|passer)|indispensable|faisables?|trajets du quotidien|au quotidien sans voiture|peu d[ée]pendante?/i;

const COMMUNE = {
  insee: "17999", nom: "Villetest", dept: "17", region: "Nouvelle-Aquitaine", lat: 46.1, lon: -1.1,
  population: 30000, densite: 1200, mer_centre_km: 40, altitude: 10, clim: {}, pct: {},
} as unknown as IndexCommune;

const FAVORABLE: [number, number] = [9600, 9800]; // 1 - 0,96 = 4 % -> « les 5 % »
const DEFAVORABLE: [number, number] = [500, 900]; // haut à 9 % -> « les 10 % »

function projet(prefs: Partial<Record<PreferenceKey, number>>): UserProject {
  return normalizeUserProject({
    posture: "recherche", intent: null, rawText: "Vivre sans voiture.", updatedAt: "2026-10-22T00:00:00.000Z",
    parsed: { reformulation: "x", hardConstraints: {}, preferences: Object.entries(prefs).map(([key, weight]) => ({ key, weight })) },
  })!;
}

function dossier(p: UserProject, rangs: Partial<Record<PreferenceKey, [number, number]>>) {
  const entry = { ...COMMUNE, rankBands: rangs } as unknown as IndexCommune;
  const mf = mapCommuneToModuleFacts(entry, {}, {
    hasAddress: false, tailleVille: 30000, tailleVilleSource: "commune", climat: null, risquesDeclares: { wildfire: false },
  });
  const ctx: EvaluationContext = {
    constraints: hydrateHardConstraints({}, { byName: () => null, plmByName: () => null }),
    point: { lat: 46.1, lon: -1.1, grain: "commune_reference", source: "commune_centroid", label: "Villetest" },
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };
  const run = runRules(mf, p, ctx);
  const d = assembleDossier(run, p, "commune", mf.nom, composeFacts(run, mf, p), null);
  return { run, d };
}

const faits = (d: Dossier): DecisionFact[] =>
  d.sections.flatMap((s) => s.cards.flatMap((c) => (c.kind === "fact" ? [c.fact] : [])));
// Le héros du verdict (« Villetest répond à l'une de vos priorités : … ») et son détail.
const verdict = (d: Dossier): string => `${d.narrativePlan.verdict.headline.text} ${d.narrativePlan.verdict.detail}`;
const voiture = (d: Dossier) =>
  faits(d).filter((f) => "projectKey" in f && f.projectKey === "faible_dependance_auto");

test("commune peu dépendante de la voiture pour aller travailler : le rang dit la pratique, jamais une faisabilité", () => {
  const p = projet({ faible_dependance_auto: 3 });
  const { d } = dossier(p, { faible_dependance_auto: FAVORABLE });
  const [f] = voiture(d) as AlignmentFact[];
  assert.ok(f, "la carte « ce qui correspond » existe");
  assert.equal(f.role, "alignment");
  // CE QUE LA CARTE DIT, mot pour mot : la part du souhait que la mesure couvre, et la pratique observée.
  assert.equal(f.headlineSubject, "les trajets domicile-travail sans voiture");
  assert.equal(f.faceStatement, "Parmi les 5 % de communes de France où les actifs vont le moins souvent travailler en voiture");
  assert.equal(f.statement, "Pour les trajets domicile-travail sans voiture, Villetest se situe parmi les 5 % de communes de France où les actifs vont le moins souvent travailler en voiture.");
  // Ce que la mesure ne couvre pas est dit sur la carte.
  assert.match(f.limitation ?? "", /pour aller travailler \(recensement 2022\)/);
  assert.match(f.limitation ?? "", /Les courses, l'école et les loisirs ne sont pas mesurés\./);
  // Le rang n'est jamais présenté comme un pourcentage de trajets ni comme une note.
  assert.doesNotMatch(f.statement, /\d+\s?% (des|de) (trajets|actifs)/);
  // LE VERDICT nomme la même chose que la carte.
  assert.match(verdict(d), /les trajets domicile-travail sans voiture/);
  for (const t of [f.statement, f.faceStatement, f.headlineSubject, f.topic, verdict(d)]) {
    assert.doesNotMatch(t, PROMESSE_EXCESSIVE, t);
  }
});

test("commune fortement dépendante : l'écart porte sur la part des actifs qui vont travailler en voiture", () => {
  const p = projet({ faible_dependance_auto: 3 });
  const { d } = dossier(p, { faible_dependance_auto: DEFAVORABLE });
  const [f] = voiture(d) as MismatchFact[];
  assert.ok(f, "la carte d'écart existe");
  assert.equal(f.role, "mismatch");
  assert.equal(f.headlineSubject, "les trajets domicile-travail sans voiture");
  assert.equal(f.status, "10 % les moins favorables");
  // Le topic nomme la mesure ; le subject (héros) nomme le souhait du lecteur, borné à ce qu'elle couvre.
  assert.equal(f.topic, "l'usage de la voiture pour aller travailler");
  // LA PRIORITÉ DU LECTEUR reste dite telle qu'il l'a posée ; ce qui suit se borne à la mesure.
  assert.equal(
    f.statement,
    "Vous avez placé une faible dépendance à la voiture parmi vos priorités. Sur la part des actifs qui vont travailler en voiture, Villetest se situe parmi les 10 % de communes les moins favorables de France.",
  );
  assert.match(f.limitation ?? "", /Les courses, l'école et les loisirs ne sont pas mesurés\./);
  assert.match(verdict(d), /les trajets domicile-travail sans voiture/);
  for (const t of [f.statement, f.headlineSubject, f.topic, verdict(d)]) {
    assert.doesNotMatch(t, PROMESSE_EXCESSIVE, t);
  }
});

test("priorité « sans voiture » non déclarée : aucune carte, aucune phrase sur la voiture", () => {
  const { run, d } = dossier(projet({ nature: 2 }), { faible_dependance_auto: DEFAVORABLE });
  assert.equal(voiture(d).length, 0);
  assert.equal(run.evaluations.find((e) => e.ruleId === "territoire.mismatch-faible_dependance_auto")?.outcome, "not_applicable");
  assert.doesNotMatch(JSON.stringify(d), /voiture/);
});

test("mobilité indisponible pour la commune : la priorité est examinée, rien n'est inventé", () => {
  const { run, d } = dossier(projet({ faible_dependance_auto: 3 }), {});
  for (const id of ["territoire.mismatch-faible_dependance_auto", "territoire.alignment-faible_dependance_auto"]) {
    assert.equal(run.evaluations.find((e) => e.ruleId === id)?.outcome, "uncertain", id);
  }
  assert.equal(voiture(d).length, 0);
  assert.doesNotMatch(JSON.stringify(d.sections), /domicile-travail|Parmi les \d+ %/);
});

test("ce que la conclusion rédigée reçoit : le plan narratif porte les nouveaux sujets, jamais l'ancienne promesse", () => {
  // Le plan est la matière hachée et confiée au modèle (texteDeRepli, sujets, phrases obligatoires).
  // Aucun appel au modèle ici : on vérifie l'entrée.
  for (const rang of [FAVORABLE, DEFAVORABLE]) {
    const { d } = dossier(projet({ faible_dependance_auto: 3 }), { faible_dependance_auto: rang });
    const plan = JSON.stringify(d.narrativePlan);
    assert.match(plan, /les trajets domicile-travail sans voiture/);
    assert.doesNotMatch(plan, PROMESSE_EXCESSIVE);
  }
});

test("un dossier vendu avant FUT-96 se relit tel qu'il a été vendu", () => {
  // L'artefact fige le dossier le jour de la vente (decision-artifact.ts) : le correctif ne change que les
  // dossiers produits ensuite. On fabrique un dossier, on lui rend l'ANCIEN texte, on le fige, et on le relit.
  const p = projet({ faible_dependance_auto: 3 });
  const { d } = dossier(p, { faible_dependance_auto: FAVORABLE });
  const ANCIEN = "Pour la possibilité de se déplacer sans voiture, Villetest se situe parmi les 5 % de communes où elle est la plus favorable en France.";
  const vendu: Dossier = JSON.parse(JSON.stringify(d));
  for (const s of vendu.sections) for (const c of s.cards) {
    if (c.kind === "fact" && c.fact.role === "alignment" && c.fact.projectKey === "faible_dependance_auto") {
      c.fact.statement = ANCIEN;
      c.fact.headlineSubject = "la possibilité de se déplacer sans voiture";
    }
  }
  const fige = parseDecisionArtifact(JSON.parse(JSON.stringify(
    buildDecisionArtifact(vendu, p, "2026-10-01T10:00:00.000Z", PRODUCT_CONVENTIONS_VERSION),
  )))!;
  assert.ok(fige, "l'artefact se relit");
  const stocke = { servedVersion: 1, artifact: fige, generatedAt: fige.generatedAt } as unknown as StoredArtifact;
  const servi = dossierAServir(stocke, d);
  assert.equal(servi.source, "artefact");
  assert.match(JSON.stringify(servi.dossier), /Pour la possibilité de se déplacer sans voiture, Villetest/);
  // Pas de nouvelle version du moteur : le verdict et les registres ne changent pas, seule la formulation
  // des cartes « voiture » change (même doctrine que FUT-20). Le comparatif rapproche donc toujours un
  // dossier d'avant et un dossier d'après.
  assert.equal(fige.engineVersion, ENGINE_VERSION);
  // La conclusion rédigée d'un dossier figé est identifiée par SON plan, qui ne bouge pas.
  assert.equal(buildConclusionHash(fige.dossier.narrativePlan), buildConclusionHash(vendu.narrativePlan));
});
