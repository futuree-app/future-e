// FUT-26 — la relation au lieu, objet distinct du Projet. Aucune base, aucun réseau.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import {
  enregistrerRelationAdresse, envisageLeLieu, habiteLeLieu, patchRelationAdresse, relationDeLAdresse, relationDeLaCommune, voixDuLecteur,
  type RelationAuLieu,
} from "./relation-au-lieu.ts";
import { assembleDossier } from "./decision/decision-assembler.ts";
import { bucketDuProjet } from "./decision/logement-gestes.ts";
import { pointsAVerifier, introPointsAVerifier } from "./decision/logement-verifications.ts";
import type { DecisionFact, LogementFacts, RunResult } from "./decision/decision-fact.ts";
import type { UserProject } from "./user-project.ts";

const NOW = new Date("2026-10-11T12:00:00.000Z");
const HABITE: RelationAuLieu = { echelle: "adresse", relation: "lives_here" };
const ETUDIE: RelationAuLieu = { echelle: "adresse", relation: "studying" };
const ADRESSE_INCONNUE: RelationAuLieu = { echelle: "adresse", relation: null };
const VIT_COMMUNE: RelationAuLieu = { echelle: "commune", relation: "current_residence", origine: "inferred" };
const ENVISAGE_COMMUNE: RelationAuLieu = { echelle: "commune", relation: "considering_living", origine: "confirmed_by_user" };
const DECOUVRE_COMMUNE: RelationAuLieu = { echelle: "commune", relation: "information_only", origine: "confirmed_by_user" };

function projet(over: Partial<UserProject> = {}): UserProject {
  return {
    posture: "recherche", intent: null, rawText: "Je cherche un logement au calme.", updatedAt: "2026-10-01T00:00:00.000Z",
    parsed: { reformulation: "x", hardConstraints: {}, preferences: [] } as unknown as UserProject["parsed"],
    ...over,
  };
}
const verif = (id = "v"): DecisionFact => ({
  id, ruleId: "r", sourceFactIds: ["s"], module: "territoire", role: "verification", materialityTier: "structuring",
  topic: "un point à vérifier", statement: "à vérifier", evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }],
  action: { type: "obtenir_document", label: "doc" },
});
const RUN: RunResult = { facts: [verif()], evaluations: [] };
const titreVerif = (p: UserProject, r: RelationAuLieu | null) =>
  assembleDossier(RUN, p, "commune", "Nantes", [], r).sections.find((s) => s.key === "verifications")!.title;

const LOGEMENT: LogementFacts = {
  dpe: "passoire", dpeLabel: "G", confortEteInsuffisant: true,
  rga: "present", expositionBati: true, pprn: "present", zoneReglementee: true, pprnLabel: "PPRI",
  cavites: "present", caviteProche: true, patrimoine: "present", perimetrePatrimonial: true,
  sinistralite: "present", sinistraliteActive: true, addressLabel: "3 rue des Essais, Nantes",
};

// ── 1 à 3 : créer, lire, modifier explicitement ─────────────────────────────────────────────────

test("1. créer une relation : la déclaration pose la valeur ET sa date", () => {
  assert.deepEqual(patchRelationAdresse("lives_here", NOW), { place_relation: "lives_here", place_relation_set_at: NOW.toISOString() });
  assert.deepEqual(patchRelationAdresse("studying", NOW), { place_relation: "studying", place_relation_set_at: NOW.toISOString() });
});

test("2. lire une relation : seules les valeurs déclarées existent, tout le reste est inconnu", () => {
  assert.deepEqual(relationDeLAdresse({ place_relation: "lives_here" }), HABITE);
  assert.deepEqual(relationDeLAdresse({ place_relation: "studying" }), ETUDIE);
  for (const row of [{ place_relation: null }, {}, null, undefined, { place_relation: "residence" }, { place_relation: 3 }]) {
    assert.deepEqual(relationDeLAdresse(row as { place_relation?: unknown } | null), ADRESSE_INCONNUE, JSON.stringify(row));
  }
});

test("3. modifier explicitement : changer, effacer ; une valeur hors liste ou absente est refusée", () => {
  assert.equal(patchRelationAdresse("studying", NOW)?.place_relation, "studying");
  // Effacer est une réponse permise : la relation redevient inconnue, et sa date disparaît avec elle.
  assert.deepEqual(patchRelationAdresse(null, NOW), { place_relation: null, place_relation_set_at: null });
  // Rien n'est écrit sans un choix explicite : ni l'ancienne posture, ni un champ oublié.
  for (const v of [undefined, "", "residence", "prospection", "owner", "LIVES_HERE", 1, {}]) {
    assert.equal(patchRelationAdresse(v, NOW), null, JSON.stringify(v));
  }
});

// ── 4 : deux lieux, deux relations ──────────────────────────────────────────────────────────────

test("4. deux biens, deux relations : chacun sa voix et ses gestes", () => {
  const p = projet();
  const ici = relationDeLAdresse({ place_relation: "lives_here" });
  const labas = relationDeLAdresse({ place_relation: "studying" });
  assert.equal(voixDuLecteur(p.intent, ici), "habitant");
  assert.equal(voixDuLecteur(p.intent, labas), "engagement");
  assert.equal(bucketDuProjet(p, ici), "reside");
  assert.equal(bucketDuProjet(p, labas), "neutre");
  assert.notDeepEqual(pointsAVerifier(LOGEMENT, p, ici), pointsAVerifier(LOGEMENT, p, labas));
});

test("4 bis. habiter la commune ne fait pas habiter le bien qu'on y étudie", () => {
  // « J'habite La Rochelle » et « j'étudie un second appartement à La Rochelle » : la relation à la
  // commune ne s'hérite pas à l'adresse, même quand celle de l'adresse est inconnue.
  assert.equal(habiteLeLieu(VIT_COMMUNE), true);
  assert.equal(habiteLeLieu(ADRESSE_INCONNUE), false);
  const src = readFileSync("src/lib/server/assemble-address-dossier.ts", "utf8");
  assert.match(src, /relationAuLieu: input\.relation \?\? \{ echelle: "adresse", relation: null \}/);
});

// ── 5 et 6 : la relation ne touche ni le projet, ni la recherche ne touche la relation ──────────

test("5. le projet est inchangé : ni lu pour la relation, ni modifié par elle", () => {
  const p = Object.freeze(projet({ posture: "habitant", intent: "achat" }));
  const avant = JSON.stringify(p);
  for (const r of [HABITE, ETUDIE, ADRESSE_INCONNUE, VIT_COMMUNE, null]) {
    assembleDossier(RUN, p, "commune", "Nantes", [], r);
    pointsAVerifier(LOGEMENT, p, r);
    voixDuLecteur(p.intent, r);
  }
  assert.equal(JSON.stringify(p), avant);
  // La route qui enregistre une relation n'écrit rien d'autre que la ligne du dossier.
  const route = readFileSync("src/app/api/dossier/relation/route.ts", "utf8");
  assert.doesNotMatch(route, /user_project|user_profiles|projet-ecriture|ecrireProjet|report_context/);
  assert.match(route, /ecrire: \(id, patch\) => updateOwnedAddressDossier\(user\.id, id, patch\)/);
  assert.match(route, /lireDossier: \(id\) => getDossier\(supabase, user\.id, id\)/);
});

test("6. une recherche « Où vivre » n'écrit aucune relation au lieu", () => {
  const fichiers = [
    ...readdirSync("src/app/(public)/ou-vivre").map((f) => `src/app/(public)/ou-vivre/${f}`),
    "src/app/api/project/from-search/route.ts",
    "src/components/report/RepriseRecherche.tsx",
  ];
  for (const f of fichiers) {
    const src = readFileSync(f, "utf8");
    assert.doesNotMatch(src, /report_context|report-context|place_relation|\/api\/dossier\/relation|relationAuLieu/, f);
  }
});

// ── 7 : l'absence ne devient jamais « j'habite ici » ────────────────────────────────────────────

test("7. sans relation connue, aucune posture d'habitant, même avec l'objectif « j'y habite déjà »", () => {
  const habitantDObjectif = projet({ posture: "habitant" });
  for (const r of [null, undefined, ADRESSE_INCONNUE]) {
    assert.equal(voixDuLecteur(habitantDObjectif.intent, r), "neutre");
    assert.equal(bucketDuProjet(habitantDObjectif, r), "neutre");
  }
  assert.equal(titreVerif(habitantDObjectif, null), "À contrôler");
  assert.deepEqual(pointsAVerifier(LOGEMENT, habitantDObjectif, null), pointsAVerifier(LOGEMENT, null, null));
  assert.equal(introPointsAVerifier(habitantDObjectif, null), introPointsAVerifier(null, null));
});

// ── 8 : les anciens dossiers ────────────────────────────────────────────────────────────────────

test("8. un ancien dossier, avec sa `posture` et sans relation, se lit comme une relation INCONNUE", () => {
  for (const posture of ["residence", "prospection"]) {
    const ancien = { posture, snapshot: null, dpe_selection_status: "pending" };
    assert.deepEqual(relationDeLAdresse(ancien), ADRESSE_INCONNUE, posture);
    assert.equal(voixDuLecteur(null, relationDeLAdresse(ancien)), "neutre");
  }
});

test("8 bis. la migration ne recopie pas l'ancienne posture et ne touche aucune ligne existante", () => {
  const sql = readFileSync("supabase/36_relation_au_lieu_adresse.sql", "utf8").replace(/--.*$/gm, "");
  assert.match(sql, /add column if not exists place_relation text/);
  assert.match(sql, /place_relation is null or place_relation in \('lives_here', 'studying'\)/);
  assert.doesNotMatch(sql, /\bupdate\b|\binsert\b|\bdelete\b|set place_relation|default '/i);
  // Et la page Autour n'écrit plus de posture inventée.
  const autour = readFileSync("src/app/api/logement-autour/route.ts", "utf8");
  assert.doesNotMatch(autour, /\{ posture[ ,}]/);
  assert.doesNotMatch(autour, /"residence"/);
});

// ── 9 : la formulation suit la relation réelle ──────────────────────────────────────────────────

test("9. habite, envisage, étudie, découvre, inconnu : chacun sa formulation", () => {
  const p = projet();
  assert.equal(titreVerif(p, VIT_COMMUNE), "À connaître et à surveiller");
  assert.equal(titreVerif(p, ENVISAGE_COMMUNE), "À contrôler avant de vous engager");
  assert.equal(titreVerif(p, DECOUVRE_COMMUNE), "À contrôler");
  assert.equal(titreVerif(p, null), "À contrôler");
  assert.equal(assembleDossier(RUN, p, "commune+adresse", "Nantes", [], HABITE).sections.find((s) => s.key === "verifications")!.title, "À connaître et à surveiller");
  assert.equal(assembleDossier(RUN, p, "commune+adresse", "Nantes", [], ETUDIE).sections.find((s) => s.key === "verifications")!.title, "À contrôler avant de vous engager");
  assert.equal(envisageLeLieu(ETUDIE) && envisageLeLieu(ENVISAGE_COMMUNE), true);
});

test("9 bis. « j'y habite » déclaré À L'ADRESSE prime sur l'intention globale (décision du 11/10/2026)", () => {
  // J'habite La Rochelle, mon projet est d'acheter à Nantes. Mon logement actuel ne se lit pas comme
  // un bien à acheter.
  const acheteur = projet({ intent: "achat" });
  assert.equal(voixDuLecteur(acheteur.intent, HABITE), "habitant");
  assert.equal(bucketDuProjet(acheteur, HABITE), "reside");
  assert.equal(assembleDossier(RUN, acheteur, "commune+adresse", "La Rochelle", [], HABITE).sections.find((s) => s.key === "verifications")!.title, "À connaître et à surveiller");
  // À l'échelle de la COMMUNE, l'intention garde la main : on achète souvent dans sa propre ville.
  assert.equal(titreVerif(acheteur, VIT_COMMUNE), "À contrôler avant de vous engager");
  assert.equal(bucketDuProjet(acheteur, VIT_COMMUNE), "achat");
});

test("9 bis (deux lieux). La Rochelle habitée, Nantes à l'achat : chaque bien a sa voix", () => {
  const acheteur = projet({ intent: "achat" });
  const laRochelle = relationDeLAdresse({ place_relation: "lives_here" });
  const nantesEtudie = relationDeLAdresse({ place_relation: "studying" });
  const nantesInconnu = relationDeLAdresse({ place_relation: null });
  assert.deepEqual(
    [laRochelle, nantesEtudie, nantesInconnu].map((r) => [voixDuLecteur(acheteur.intent, r), bucketDuProjet(acheteur, r)]),
    [["habitant", "reside"], ["engagement", "achat"], ["engagement", "achat"]],
  );
  assert.notDeepEqual(pointsAVerifier(LOGEMENT, acheteur, laRochelle), pointsAVerifier(LOGEMENT, acheteur, nantesEtudie));
});

test("9 bis (limite documentée). Le locataire qui achète le logement qu'il occupe et déclare « j'y habite »", () => {
  // Il habite ET envisage d'acheter : deux informations, dont seule la première existe à FUT-26. Il
  // reçoit aujourd'hui la voix d'un habitant ; FUT-10 séparera l'objectif de l'analyse de ce bien.
  // Ce test fige la limite pour qu'elle ne passe pas pour un comportement voulu le jour où on la lève.
  const locataireAcheteur = projet({ posture: "habitant", intent: "achat" });
  assert.equal(bucketDuProjet(locataireAcheteur, HABITE), "reside");
  // Sans relation déclarée au bien, l'intention s'applique, comme avant FUT-26.
  assert.equal(bucketDuProjet(locataireAcheteur, null), "achat");
});

test("1 bis. commune DÉDUITE « j'envisage » : aucune voix d'engagement sans confirmation", () => {
  const p = projet();
  const deduite: RelationAuLieu = { echelle: "commune", relation: "considering_living", origine: "inferred" };
  assert.equal(voixDuLecteur(p.intent, deduite), "neutre");
  assert.equal(titreVerif(p, deduite), "À contrôler");
  // Confirmée par la personne, elle dit un engagement.
  assert.equal(voixDuLecteur(p.intent, ENVISAGE_COMMUNE), "engagement");
  assert.equal(titreVerif(p, ENVISAGE_COMMUNE), "À contrôler avant de vous engager");
  // La résidence DÉDUITE de la commune de résidence déclarée garde la voix d'habitant.
  assert.equal(voixDuLecteur(p.intent, VIT_COMMUNE), "habitant");
  assert.equal(titreVerif(p, VIT_COMMUNE), "À connaître et à surveiller");
  // Et la relation produite par `resolveRelation` pour une commune non habitée est bien « déduite ».
  assert.deepEqual(relationDeLaCommune({ relation: "considering_living", source: "inferred" }), deduite);
});

test("9 ter. la relation à la commune garde son origine (déduite ou confirmée)", () => {
  assert.deepEqual(relationDeLaCommune({ relation: "current_residence", source: "inferred" }), VIT_COMMUNE);
  assert.deepEqual(
    relationDeLaCommune({ relation: "considering_living", source: "confirmed_by_user" }),
    ENVISAGE_COMMUNE,
  );
});

// ── 10 : les dossiers déjà acquis ───────────────────────────────────────────────────────────────

test("10. un dossier acheté avec artefact figé est servi sans repasser par le moteur", () => {
  // Le dossier d'adresse : l'assemblage (donc la nouvelle voix) n'est demandé que sans artefact prêt.
  const avecLogement = readFileSync("src/components/report/DossierAvecLogement.tsx", "utf8");
  assert.match(avecLogement, /const assemble = stocke\?\.artifact && !perime\s*\? null\s*: await assembleAddressDossier/);
  // L'artefact ne dépend pas de la relation : il porte le dossier figé le jour de sa génération.
  assert.doesNotMatch(readFileSync("src/lib/decision/decision-artifact.ts", "utf8"), /relation-au-lieu|relationAuLieu/);
});

test("10 bis. pour un acheteur déclaré, la conclusion est identique avec ou sans relation (aucune régénération)", () => {
  // L'empreinte de la conclusion rédigée est celle du plan : s'il ne change pas, rien n'est régénéré.
  const acheteur = projet({ intent: "achat" });
  const sans = assembleDossier(RUN, acheteur, "commune", "Nantes", [], null);
  for (const r of [ENVISAGE_COMMUNE, ETUDIE, VIT_COMMUNE]) {
    const avec = assembleDossier(RUN, acheteur, "commune", "Nantes", [], r);
    assert.deepEqual(avec.narrativePlan, sans.narrativePlan);
    assert.deepEqual(avec.sections.map((s) => s.title), sans.sections.map((s) => s.title));
  }
  // Seul « j'y habite » déclaré à l'adresse change la voix d'un acheteur, et c'est voulu (9 bis).
  assert.notDeepEqual(
    assembleDossier(RUN, acheteur, "commune", "Nantes", [], HABITE).sections.map((s) => s.title),
    sans.sections.map((s) => s.title),
  );
});

// ── La route PATCH, avec un stockage SIMULÉ injecté ─────────────────────────────────────────────
// Ces tests vérifient la logique de la route. Ils ne remplacent PAS des tests contre Supabase : la
// RLS et les filtres réels (`getDossier`, `updateOwnedAddressDossier`) sont simulés ici.

function stockageSimule(lecteur: string) {
  const dossiers = new Map([
    ["d-moi", { id: "d-moi", user_id: "moi", revoque: false, place_relation: null as string | null }],
    ["d-autre", { id: "d-autre", user_id: "autre", revoque: false, place_relation: null as string | null }],
    ["d-revoque", { id: "d-revoque", user_id: "moi", revoque: true, place_relation: null as string | null }],
  ]);
  const ecritures: string[] = [];
  const visible = (id: string) => {
    const d = dossiers.get(id);
    return d && d.user_id === lecteur && !d.revoque ? d : null;
  };
  return {
    dossiers, ecritures,
    deps: {
      now: NOW,
      lireDossier: async (id: string) => visible(id),
      ecrire: async (id: string, patch: { place_relation: string | null }) => {
        const d = visible(id);
        if (!d) return null;
        ecritures.push(id);
        d.place_relation = patch.place_relation;
        return { place_relation: d.place_relation };
      },
    },
  };
}

test("route : le propriétaire déclare, change puis efface la relation de son bien", async () => {
  const s = stockageSimule("moi");
  assert.deepEqual(await enregistrerRelationAdresse({ dossierId: "d-moi", relation: "lives_here" }, s.deps), { status: 200, body: { ok: true, relation: "lives_here" } });
  assert.equal(s.dossiers.get("d-moi")!.place_relation, "lives_here");
  assert.equal((await enregistrerRelationAdresse({ dossierId: "d-moi", relation: "studying" }, s.deps)).body.relation, "studying");
  assert.deepEqual(await enregistrerRelationAdresse({ dossierId: "d-moi", relation: null }, s.deps), { status: 200, body: { ok: true, relation: null } });
  assert.equal(s.dossiers.get("d-moi")!.place_relation, null);
});

test("route : le dossier d'un autre utilisateur est refusé, et rien n'est écrit", async () => {
  const s = stockageSimule("moi");
  const r = await enregistrerRelationAdresse({ dossierId: "d-autre", relation: "lives_here" }, s.deps);
  assert.deepEqual(r, { status: 403, body: { error: "DOSSIER_NOT_ACCESSIBLE" } });
  assert.deepEqual(s.ecritures, []);
  assert.equal(s.dossiers.get("d-autre")!.place_relation, null);
});

test("route : un dossier révoqué est refusé, et rien n'est écrit", async () => {
  const s = stockageSimule("moi");
  assert.equal((await enregistrerRelationAdresse({ dossierId: "d-revoque", relation: "studying" }, s.deps)).status, 403);
  assert.deepEqual(s.ecritures, []);
});

test("route : une écriture refusée APRÈS la lecture (révocation entre-temps) est un refus, pas un succès", async () => {
  const s = stockageSimule("moi");
  const deps = { ...s.deps, ecrire: async () => null };
  assert.equal((await enregistrerRelationAdresse({ dossierId: "d-moi", relation: "studying" }, deps)).status, 403);
});

test("route : valeur invalide ou dossier manquant → 400, sans lecture ni écriture", async () => {
  const s = stockageSimule("moi");
  let lectures = 0;
  const deps = { ...s.deps, lireDossier: async (id: string) => { lectures++; return s.deps.lireDossier(id); } };
  for (const body of [{ dossierId: "d-moi", relation: "residence" }, { dossierId: "d-moi" }, { relation: "lives_here" }, { dossierId: "", relation: "lives_here" }, null, "texte"]) {
    assert.equal((await enregistrerRelationAdresse(body, deps)).status, 400, JSON.stringify(body));
  }
  assert.equal(lectures, 0);
  assert.deepEqual(s.ecritures, []);
});
