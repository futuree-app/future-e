// FUT-10 — le projet, la relation au bien et l'objectif de l'analyse, recueillis avant l'achat et
// conservés jusqu'au dossier livré. Aucune base, aucun réseau : les stockages sont simulés, et le
// câblage des routes est vérifié sur leur source. Contrat : docs/audits/2026-10-11-fut10-projet-relation-checkout.md
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  contexteAChangeMateriellement, contexteDuBien, enregistrerRelationAdresse, objectifDeLAnalyse, relationDeLAdresse,
  voixDuLecteur, type AddressObjective, type AddressRelation, type RelationAuLieu,
} from "./relation-au-lieu.ts";
import { bucketDuProjet } from "./decision/logement-gestes.ts";
import { pointsAVerifier } from "./decision/logement-verifications.ts";
import { assembleDossier } from "./decision/decision-assembler.ts";
import { buildDecisionArtifact, parseDecisionArtifact } from "./decision/decision-artifact.ts";
import { projetAChangeMateriellement } from "./decision/projet-materiel.ts";
import {
  colonnesDossierDepuisIntention, colonnesIntention, lireContexteCheckout, projetPourLivraison, projetVuEstACour,
  type ProjetLivraison,
  type ContexteCheckout,
} from "./dossier-contexte-checkout.ts";
import { noteDuCouple, recapitulatif, relationDuChoix } from "./dossier-contexte-ecran.ts";
import { enregistrerProjet } from "./projet-sauvegarde-client.ts";
import type { DecisionFact, Dossier, LogementFacts, RunResult } from "./decision/decision-fact.ts";
import type { UserProject } from "./user-project.ts";

const NOW = new Date("2026-10-11T12:00:00.000Z");
const lire = (p: string) => readFileSync(p, "utf8");

const bien = (relation: AddressRelation | null, objectif: AddressObjective | null = null): RelationAuLieu =>
  ({ echelle: "adresse", relation, objectif });

function projet(over: Partial<UserProject> = {}): UserProject {
  return {
    posture: "adresse", intent: null, rawText: "Un appartement calme, bien desservi, sans voiture.",
    updatedAt: "2026-10-01T00:00:00.000Z",
    parsed: { reformulation: "Calme et bien desservi", hardConstraints: {}, preferences: [] } as unknown as UserProject["parsed"],
    ...over,
  };
}

const verif = (): DecisionFact => ({
  id: "v", ruleId: "r", sourceFactIds: ["s"], module: "territoire", role: "verification", materialityTier: "structuring",
  topic: "un point", statement: "à vérifier", evidence: [{ factId: "s", module: "territoire", label: "T", grain: "commune" }],
  action: { type: "obtenir_document", label: "doc" },
});
const RUN: RunResult = { facts: [verif()], evaluations: [] };
const titreVerif = (p: UserProject, r: RelationAuLieu | null) =>
  assembleDossier(RUN, p, "commune+adresse", "Nantes", [], r).sections.find((s) => s.key === "verifications")!.title;

const LOGEMENT: LogementFacts = {
  dpe: "passoire", dpeLabel: "G", confortEteInsuffisant: true,
  rga: "present", expositionBati: true, pprn: "present", zoneReglementee: true, pprnLabel: "PPRI",
  cavites: "present", caviteProche: true, patrimoine: "present", perimetrePatrimonial: true,
  sinistralite: "present", sinistraliteActive: true, addressLabel: "3 rue des Essais, Nantes",
};

// ═══ MODÈLE MÉTIER ══════════════════════════════════════════════════════════════════════════════

test("habitant qui analyse son logement : voix d'habitant, gestes de qui y vit", () => {
  const r = bien("lives_here", "understand");
  assert.equal(voixDuLecteur(null, r), "habitant");
  assert.equal(bucketDuProjet({ intent: null }, r), "reside");
  assert.equal(titreVerif(projet(), r), "À connaître et à surveiller");
  // Même avec un projet d'achat AILLEURS : son logement actuel ne reçoit pas de liste d'achat.
  assert.equal(voixDuLecteur("achat", r), "habitant");
  assert.equal(bucketDuProjet({ intent: "achat" }, r), "reside");
  assert.equal(titreVerif(projet({ intent: "achat" }), r), "À connaître et à surveiller");
});

test("locataire qui envisage d'acheter son logement : les deux vérités coexistent", () => {
  const r = bien("lives_here", "buy");
  // La relation effective est conservée telle qu'elle a été déclarée...
  assert.deepEqual(relationDeLAdresse({ place_relation: "lives_here", place_objective: "buy" }), r);
  // ... et la voix, les gestes, le titre sont ceux d'un achat. Aucune contre-déclaration exigée.
  assert.equal(voixDuLecteur(null, r), "engagement");
  assert.equal(bucketDuProjet({ intent: null }, r), "achat");
  assert.equal(bucketDuProjet({ intent: "location" }, r), "achat");
  assert.equal(titreVerif(projet(), r), "À contrôler avant de vous engager");
  assert.deepEqual(pointsAVerifier(LOGEMENT, projet(), r), pointsAVerifier(LOGEMENT, projet({ intent: "achat" }), null));
  // La limite FUT-26 subsiste SANS objectif déclaré (comportement inchangé).
  assert.equal(bucketDuProjet({ intent: "achat" }, bien("lives_here")), "reside");
});

test("acheteur qui examine un bien dans une autre ville : contrôles d'achat", () => {
  const r = bien("studying", "buy");
  assert.equal(voixDuLecteur(null, r), "engagement");
  assert.equal(bucketDuProjet({ intent: null }, r), "achat");
});

test("deux adresses, deux objectifs, un seul projet : chaque bien garde le sien", () => {
  const p = projet({ intent: "achat" });
  const laRochelle = bien("lives_here", "understand");
  const nantes = bien("studying", "rent");
  assert.equal(bucketDuProjet(p, laRochelle), "reside");
  assert.equal(bucketDuProjet(p, nantes), "location");
  assert.notDeepEqual(pointsAVerifier(LOGEMENT, p, laRochelle), pointsAVerifier(LOGEMENT, p, nantes));
  // L'objectif d'une adresse n'existe pas ailleurs : une commune n'en porte pas.
  assert.equal(objectifDeLAnalyse({ echelle: "commune", relation: "current_residence", origine: "confirmed_by_user" }), null);
  assert.equal(bucketDuProjet(p, null), "achat");
});

test("relation inconnue, objectif inconnu : rien n'est supposé", () => {
  assert.equal(bucketDuProjet({ intent: null }, bien(null, "buy")), "achat");
  assert.equal(voixDuLecteur(null, bien(null, null)), "neutre");
  assert.equal(bucketDuProjet({ intent: null }, bien(null, null)), "neutre");
  // Objectif non dit : l'ordre FUT-26, à l'identique.
  assert.equal(voixDuLecteur("achat", bien(null, null)), "engagement");
  assert.equal(voixDuLecteur("achat", bien("lives_here", null)), "habitant");
});

test("l'intention globale n'écrase jamais un objectif déclaré pour ce bien", () => {
  assert.equal(bucketDuProjet({ intent: "achat" }, bien(null, "rent")), "location");
  assert.equal(bucketDuProjet({ intent: "location" }, bien(null, "buy")), "achat");
  // « Une autre raison » neutralise l'intention globale pour ce bien (le bailleur qui examine son bien loué).
  assert.equal(voixDuLecteur("achat", bien(null, "other")), "neutre");
  assert.equal(bucketDuProjet({ intent: "achat" }, bien("studying", "other")), "neutre");
  assert.equal(bucketDuProjet({ intent: "achat" }, bien("lives_here", "other")), "reside");
});

test("réponses contradictoires (mieux connaître où je vis, mais j'étudie ce logement) : voix neutre", () => {
  assert.equal(voixDuLecteur("achat", bien("studying", "understand")), "neutre");
  assert.equal(bucketDuProjet({ intent: "achat" }, bien("studying", "understand")), "neutre");
  assert.match(noteDuCouple("understand", "studying")!, /se contredisent/);
});

test("une suggestion contextuelle ne coche rien : « mieux connaître » sans relation reste une relation inconnue", () => {
  const ctx = lireContexteCheckout({ objectif: "understand", relation: null, projetVu: { existe: false, updatedAt: null } });
  assert.ok(ctx.ok);
  assert.equal(colonnesIntention(ctx.value, null, NOW).place_relation, null);
  assert.match(noteDuCouple("understand", null)!, /rien n'est coché à votre place/);
  // « Préférer ne pas répondre » est un choix affiché, qui enregistre une relation inconnue.
  assert.equal(relationDuChoix("sans_reponse"), null);
  assert.equal(relationDuChoix(null), null);
  assert.equal(relationDuChoix("lives_here"), "lives_here");
});

// ═══ PROJET : RÉUTILISÉ, MODIFIÉ PAR GESTE, AUCUNE CONDITION SILENCIEUSE ═════════════════════════

async function avecFetch(reponses: Record<string, unknown>, fn: (appels: { url: string; body: unknown }[]) => Promise<void>) {
  const appels: { url: string; body: unknown }[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (url: string, init?: { body?: string }) => {
    const body = init?.body ? JSON.parse(init.body) : null;
    appels.push({ url, body });
    const r = reponses[url];
    if (r instanceof Response) return r;
    return new Response(JSON.stringify(r ?? {}), { status: 200 });
  }) as typeof fetch;
  try { await fn(appels); } finally { globalThis.fetch = original; }
}

test("nouveau compte : le projet naît par la porte de l'adresse, sans intention déduite ni condition", async () => {
  const parsed = { reformulation: "Calme", hardConstraints: { nearSea: { active: true, maxKm: 5 } }, preferences: [] };
  await avecFetch({
    "/api/comparateur-vie/parse": { parsed },
    "/api/profile": { project: { ...projet(), parsed } },
  }, async (appels) => {
    const r = await enregistrerProjet({ texte: "  Absolument au bord de la mer.  ", posture: "adresse", intent: null, projet: null });
    assert.ok(r.ok);
    const ecriture = appels.find((a) => a.url === "/api/profile")!.body as { field: string; value: Record<string, unknown> };
    assert.equal(ecriture.field, "user_project");
    assert.deepEqual(Object.keys(ecriture.value).sort(), ["intent", "parsed", "posture", "rawText"]);
    assert.equal(ecriture.value.posture, "adresse");
    assert.equal(ecriture.value.intent, null);
    assert.equal(ecriture.value.rawText, "Absolument au bord de la mer.");
    // Le navigateur n'envoie AUCUNE confirmation : une formulation forte reste une suggestion.
    assert.equal("conditions" in ecriture.value, false);
  });
  // Et la route d'écriture ignore de toute façon une confirmation qu'on lui enverrait.
  assert.match(lire("src/lib/user-project.ts"), /normalizeUserProjectInput[\s\S]*return \{ posture: r\.posture as ProjectPosture, intent, rawText, parsed: coerceParsed\(r\.parsed\) \}/);
});

test("projet existant conservé : le checkout n'écrit rien, et un champ vide n'efface jamais un projet", () => {
  const panneau = lire("src/app/(public)/checkout/dossier/DossierCheckoutPanel.tsx");
  // L'écriture n'a lieu que sur un geste : texte nouveau, ou « Le modifier » avec un texte changé.
  assert.match(panneau, /const ecrire = reformulation\s*\? choixProjet === "modifier" && brut\.length > 0 && brut !== \(projetCourant\?\.rawText \?\? ""\)\.trim\(\)\s*: brut\.length > 0;/);
  // L'intention et la posture d'un projet existant sont reportées telles quelles.
  assert.match(panneau, /posture: projetCourant\?\.posture \?\? "adresse"/);
  assert.match(panneau, /intent: projetCourant\?\.intent \?\? null/);
});

test("projet explicitement modifié : reparse, puis écriture du nouveau texte", async () => {
  const ancien = projet();
  await avecFetch({
    "/api/comparateur-vie/parse": { parsed: { reformulation: "Jardin", hardConstraints: {}, preferences: [] } },
    "/api/profile": { project: { ...ancien, rawText: "Un jardin.", updatedAt: "2026-10-11T12:00:00.000Z" } },
  }, async (appels) => {
    const r = await enregistrerProjet({ texte: "Un jardin.", posture: ancien.posture, intent: "achat", projet: ancien });
    assert.ok(r.ok && r.project.updatedAt === "2026-10-11T12:00:00.000Z");
    assert.deepEqual(appels.map((a) => a.url), ["/api/comparateur-vie/parse", "/api/profile"]);
    assert.equal((appels[1].body as { value: { intent: string } }).value.intent, "achat");
  });
});

test("projet modifié ailleurs pendant la saisie : conflit annoncé, rien n'est prétendu enregistré", async () => {
  await avecFetch({
    "/api/comparateur-vie/parse": { parsed: null },
    "/api/profile": new Response(JSON.stringify({ error: "x" }), { status: 409 }),
  }, async () => {
    const r = await enregistrerProjet({ texte: "Autre chose.", posture: "adresse", intent: null, projet: projet() });
    assert.deepEqual(r, { ok: false, conflit: true });
  });
});

// ═══ VALIDATION AVANT STRIPE ════════════════════════════════════════════════════════════════════

test("valeurs invalides refusées, absence permise (client antérieur)", () => {
  for (const raw of [
    { relation: "residence" }, { objectif: "investir" }, { relation: 3 }, "lives_here", [1],
    { projetVu: { existe: "oui" } }, { projetVu: { existe: true, updatedAt: "pas une date" } }, { projetVu: [] },
  ]) {
    assert.equal(lireContexteCheckout(raw).ok, false, JSON.stringify(raw));
  }
  assert.deepEqual(lireContexteCheckout(undefined), { ok: true, value: { relation: null, objectif: null, projetVu: null } });
  assert.deepEqual(
    lireContexteCheckout({ relation: "lives_here", objectif: "buy", projetVu: { existe: true, updatedAt: "2026-10-01T00:00:00.000Z" } }),
    { ok: true, value: { relation: "lives_here", objectif: "buy", projetVu: { existe: true, updatedAt: "2026-10-01T00:00:00.000Z" } } },
  );
});

test("le projet montré doit être celui du compte : version, existence, et legacy sans date", () => {
  const p = projet();
  assert.equal(projetVuEstACour({ existe: true, updatedAt: p.updatedAt }, p), true);
  assert.equal(projetVuEstACour({ existe: true, updatedAt: "2026-09-01T00:00:00.000Z" }, p), false);
  assert.equal(projetVuEstACour({ existe: false, updatedAt: null }, null), true);
  assert.equal(projetVuEstACour({ existe: false, updatedAt: null }, p), false);
  assert.equal(projetVuEstACour({ existe: true, updatedAt: null }, null), false);
  // Un projet ancien sans date ne se confond pas avec l'absence de projet.
  const legacy = projet({ updatedAt: null });
  assert.equal(projetVuEstACour({ existe: true, updatedAt: null }, legacy), true);
  assert.equal(projetVuEstACour({ existe: false, updatedAt: null }, legacy), false);
  assert.equal(projetVuEstACour(null, p), true);
});

test("colonnes de l'intention : date serveur seulement sur déclaration, projet figé seulement s'il a été vu", () => {
  const ctx = (c: Partial<ContexteCheckout>): ContexteCheckout => ({ relation: null, objectif: null, projetVu: null, ...c });
  const p = projet();
  assert.deepEqual(colonnesIntention(ctx({}), p, NOW), {
    place_relation: null, place_objective: null, place_context_declared_at: null, project_snapshot: null, project_state: null,
  });
  const c = colonnesIntention(ctx({ relation: "lives_here", objectif: "buy", projetVu: { existe: true, updatedAt: p.updatedAt } }), p, NOW);
  assert.equal(c.place_context_declared_at, NOW.toISOString());
  assert.equal(c.project_snapshot, p);
  // Toutes les clés toujours présentes : une base sans la migration 37 refuse l'écriture, donc le paiement.
  assert.deepEqual(Object.keys(colonnesIntention(ctx({}), null, NOW)).sort(),
    ["place_context_declared_at", "place_objective", "place_relation", "project_snapshot", "project_state"]);
});

test("la route de paiement valide et range le contexte AVANT le PaymentIntent, jamais chez Stripe", () => {
  const route = lire("src/app/api/stripe/create-payment-intent/route.ts");
  const validation = route.indexOf("lireContexteCheckout(dossierContext)");
  const creation = route.indexOf("stripe.paymentIntents.create(");
  assert.ok(validation > 0 && validation < creation, "validation avant création");
  assert.ok(route.indexOf("projetVuEstACour(") < creation, "projet vérifié avant création");
  // Le projet est relu en base, jamais pris dans la requête.
  assert.match(route, /from\("user_profiles"\)\s*\.select\("user_project"\)/);
  // Les métadonnées Stripe ne portent ni relation, ni objectif, ni projet.
  const metadata = route.slice(route.indexOf("metadata: {"), route.indexOf("isDossier ? { idempotencyKey"));
  // (`packProjetLabel` est le libellé du Pack, produit distinct, inchangé.)
  assert.doesNotMatch(metadata, /place_|objectif|relation|project_snapshot|projetVu|user_project|rawText|reformulation|dossierContext|colonnesContexte/i);
  // Le contexte est dans le MÊME upsert que l'adresse, et son échec bloque le formulaire.
  const ecriture = route.slice(route.indexOf("enregistrerIntention(storeIntentionsSupabase(), {"), route.indexOf("SANS INTENTION"));
  assert.match(ecriture, /ban_id: dossierIntent\.banId[\s\S]*\.\.\.colonnesContexte/);
  assert.match(route, /catch \(intentError\) \{[\s\S]{0,600}status: 500/);
  // Aucun texte ni projet dans la mesure : des booléens.
  assert.match(route, /context_relation_declared: colonnesContexte\.place_relation != null/);
});

test("le formulaire de paiement n'est monté qu'après les questions", () => {
  const panneau = lire("src/app/(public)/checkout/dossier/DossierCheckoutPanel.tsx");
  const questions = panneau.indexOf('{etape === "questions" ? (');
  const wrapper = panneau.indexOf("<PaymentWrapper");
  assert.ok(questions > 0 && wrapper > questions, "PaymentWrapper dans la branche paiement");
  assert.match(panneau, /dossierContext=\{\{\s*objectif,\s*relation: relationDuChoix\(relation\),\s*projetVu: \{ existe: Boolean\(projetCourant\), updatedAt: projetCourant\?\.updatedAt \?\? null \}/);
  // Le texte libre n'est jamais gardé dans le navigateur.
  assert.match(panneau, /sessionStorage\.setItem\(cleBrouillon\(address\.banId\), JSON\.stringify\(next\)\)/);
  assert.doesNotMatch(panneau, /JSON\.stringify\(\{[^}]*texte/);
  // La mesure ne porte que des booléens.
  assert.match(panneau, /objective_declared: o != null/);
});

// ═══ PAIEMENT ET LIVRAISON (stockage simulé) ═══════════════════════════════════════════════════

/** Une base minimale qui imite l'upsert du webhook : `onConflict` + `ignoreDuplicates`. */
function baseSimulee() {
  const intents = new Map<string, Record<string, unknown>>();
  const dossiers = new Map<string, Record<string, unknown>>();
  let n = 0;
  return {
    intents, dossiers,
    // create-payment-intent : upsert sur l'identifiant du PaymentIntent (dernières réponses gagnantes).
    ecrireIntention(pi: string, adresse: Record<string, unknown>, ctx: ContexteCheckout, canonique: UserProject | null, now: Date) {
      intents.set(pi, { stripe_payment_intent_id: pi, ...adresse, ...colonnesIntention(ctx, canonique, now) });
    },
    // webhook : relit l'intention, puis upsert(ignoreDuplicates) ; rend `created`.
    webhook(pi: string): { created: boolean; livraison: ProjetLivraison } {
      const intent = intents.get(pi);
      if (!intent) throw new Error(`dossier_intents introuvable pour ${pi}`);
      const existe = [...dossiers.values()].some((d) => d.stripe_payment_intent_id === pi);
      if (!existe) {
        dossiers.set(`d${++n}`, {
          id: `d${n}`, ban_id: intent.ban_id, stripe_payment_intent_id: pi, ...colonnesDossierDepuisIntention(intent),
        });
      }
      return { created: !existe, livraison: projetPourLivraison(intent) };
    },
  };
}

const ADRESSE = { ban_id: "44109_0001_00003", insee: "44109", address_label: "3 rue des Essais, Nantes" };

test("de la réponse au dossier : relation et objectif recopiés à la création, avec la date de déclaration", () => {
  const b = baseSimulee();
  const p = projet();
  b.ecrireIntention("pi_1", ADRESSE, { relation: "lives_here", objectif: "buy", projetVu: { existe: true, updatedAt: p.updatedAt } }, p, NOW);
  const r = b.webhook("pi_1");
  assert.equal(r.created, true);
  const d = [...b.dossiers.values()][0];
  assert.equal(d.place_relation, "lives_here");
  assert.equal(d.place_objective, "buy");
  assert.equal(d.place_relation_set_at, NOW.toISOString());
  assert.equal(d.place_objective_set_at, NOW.toISOString());
  // L'artefact lira exactement ce contexte.
  assert.deepEqual(relationDeLAdresse(d), bien("lives_here", "buy"));
  // Relu sous sa forme normalisée (la version du schéma est estampillée à la lecture).
  assert.deepEqual(r.livraison, { etat: "confirme", projet: { ...p, schemaVersion: 3 } });
});

test("réponses corrigées avant de payer : même PaymentIntent, dernière version livrée", () => {
  const b = baseSimulee();
  b.ecrireIntention("pi_1", ADRESSE, { relation: null, objectif: "rent", projetVu: null }, null, NOW);
  b.ecrireIntention("pi_1", ADRESSE, { relation: "studying", objectif: "buy", projetVu: null }, null, new Date("2026-10-11T12:05:00.000Z"));
  assert.equal(b.intents.size, 1);
  b.webhook("pi_1");
  const d = [...b.dossiers.values()][0];
  assert.equal(d.place_objective, "buy");
  assert.equal(d.place_relation_set_at, "2026-10-11T12:05:00.000Z");
});

test("webhook rejoué : aucune réécriture, même après une modification par le lecteur", async () => {
  const b = baseSimulee();
  b.ecrireIntention("pi_1", ADRESSE, { relation: "studying", objectif: "buy", projetVu: null }, null, NOW);
  b.webhook("pi_1");
  const d = [...b.dossiers.values()][0];
  // Le lecteur corrige ensuite son lien avec le bien.
  const res = await enregistrerRelationAdresse({ dossierId: d.id, relation: "lives_here" }, {
    now: NOW, lireDossier: async (id) => (b.dossiers.get(id) as { id: string }) ?? null,
    ecrire: async (id, patch) => Object.assign(b.dossiers.get(id)!, patch),
  });
  assert.equal(res.status, 200);
  const rejeu = b.webhook("pi_1");
  assert.equal(rejeu.created, false);
  assert.equal(b.dossiers.size, 1);
  assert.equal(d.place_relation, "lives_here");
});

test("tentative abandonnée : une intention sans paiement ne crée aucun dossier", () => {
  const b = baseSimulee();
  b.ecrireIntention("pi_abandon", ADRESSE, { relation: "lives_here", objectif: null, projetVu: null }, null, NOW);
  assert.equal(b.dossiers.size, 0);
  // Et un paiement sans intention est une erreur explicite, jamais un dossier inventé.
  assert.throws(() => b.webhook("pi_inconnu"), /dossier_intents introuvable/);
});

test("deux achats indépendants à la même adresse : deux dossiers, deux contextes", () => {
  const b = baseSimulee();
  b.ecrireIntention("pi_a", ADRESSE, { relation: "lives_here", objectif: "understand", projetVu: null }, null, NOW);
  b.ecrireIntention("pi_b", ADRESSE, { relation: "studying", objectif: "buy", projetVu: null }, null, NOW);
  b.webhook("pi_a");
  b.webhook("pi_b");
  const [a, c] = [...b.dossiers.values()];
  assert.equal(b.dossiers.size, 2);
  assert.equal(a.place_objective, "understand");
  assert.equal(c.place_objective, "buy");
});

test("intention antérieure à FUT-10 : l'upsert du dossier est exactement celui d'avant", () => {
  assert.deepEqual(colonnesDossierDepuisIntention({ ban_id: "x", insee: "44109" }), {});
  assert.deepEqual(colonnesDossierDepuisIntention({ place_relation: "residence", place_objective: "investir" }), {});
  assert.deepEqual(projetPourLivraison({ ban_id: "x" }), { etat: "historique" });
  assert.deepEqual(projetPourLivraison({ project_state: null, project_snapshot: null }), { etat: "historique" });
});

test("projet modifié entre le paiement et la génération : le dossier répond au projet confirmé, et le dit", () => {
  const b = baseSimulee();
  const confirme = projet({ parsed: { reformulation: "Calme", hardConstraints: {}, preferences: [{ key: "faible_risque_inondation", weight: 3 }] } as unknown as UserProject["parsed"] });
  b.ecrireIntention("pi_1", ADRESSE, { relation: null, objectif: "buy", projetVu: { existe: true, updatedAt: confirme.updatedAt } }, confirme, NOW);
  const modifieEnsuite = projet({ updatedAt: "2026-10-11T12:01:00.000Z" });
  const { livraison } = b.webhook("pi_1");
  assert.equal(livraison.etat, "confirme");
  const utilise = livraison.etat === "confirme" ? livraison.projet : null;
  assert.deepEqual(utilise, { ...confirme, schemaVersion: 3 });
  // L'artefact fige `confirme` ; le bandeau existant détecte l'écart avec le projet courant.
  assert.equal(projetAChangeMateriellement(utilise, modifieEnsuite), true);
});

test("le webhook recopie le contexte dans l'upsert QUI CRÉE le dossier, et génère avec le projet confirmé", () => {
  const webhook = lire("src/app/api/stripe/webhook/route.ts");
  const upsert = webhook.slice(webhook.indexOf('.from("address_dossiers")\n      .upsert('), webhook.indexOf("if (insertError) throw insertError;"));
  assert.match(upsert, /\.\.\.colonnesDossierDepuisIntention\(intent\),[\s\S]*onConflict: "stripe_payment_intent_id", ignoreDuplicates: true/);
  assert.match(webhook, /savedDpe: null,\s*\}, projetPourLivraison\(intent\)\);/);
  // Projet absent : toujours aucun artefact, donc aucun faux dossier personnalisé.
  assert.match(webhook, /if \(!project\) return;/);
  // L'artefact est planifié APRÈS l'upsert.
  assert.ok(webhook.indexOf("planifierArtefact(intent.user_id") > webhook.indexOf("if (insertError) throw insertError;"));
});

test("projet absent : l'écran ne promet aucune personnalisation, et le dossier ne montre pas de verdict", () => {
  const r = recapitulatif({ objectif: "buy", relation: "lives_here", priorites: null, prioritesIncomprises: false });
  assert.match(r.limite!, /sans pouvoir juger s'il correspond à vos priorités/);
  assert.equal(r.lignes.find((l) => l.libelle === "Votre projet")!.valeur, "Aucun projet décrit");
  // Sans projet, aucune phrase ne promet de rapprochement avec des priorités.
  assert.equal(r.usage, null);
  assert.equal(r.titre, "Votre dossier");
  for (const l of r.lignes) assert.doesNotMatch(l.valeur, /personnalis/i);
  assert.doesNotMatch(r.limite!, /personnalisé/);
  const avec = recapitulatif({ objectif: null, relation: null, priorites: "Calme", prioritesIncomprises: false });
  assert.equal(avec.limite, null);
  assert.equal(avec.lignes.find((l) => l.libelle === "Votre objectif")!.valeur, "non précisé");
  assert.match(recapitulatif({ objectif: null, relation: null, priorites: "x", prioritesIncomprises: true }).limite!, /pas pu en extraire vos priorités/);
  // Sans projet, le hub invite à le décrire au lieu d'afficher un verdict (inchangé).
  assert.match(lire("src/lib/decision/premier-ecran.ts"), /if \(!input\.project\) \{[\s\S]*kind: "invite"/);
});

// ═══ APRÈS L'ACHAT : VERSION CONSERVÉE, ÉCART SIGNALÉ, MISE À JOUR DEMANDÉE ═════════════════════

const DOSSIER_MIN = {
  scope: "commune+adresse", conclusion: "x", conclusionState: "conclusive", sections: [],
  controlesTitle: "x", compositions: [], absorbedFacts: [],
} as unknown as Dossier;

test("l'artefact fige le contexte du bien qu'il a lu ; un artefact ancien n'en porte pas", () => {
  const a = buildDecisionArtifact(DOSSIER_MIN, projet(), NOW.toISOString(), "c1", undefined, contexteDuBien(bien("lives_here", "buy")));
  assert.deepEqual(parseDecisionArtifact(JSON.parse(JSON.stringify(a)))!.contexteDuBien, { relation: "lives_here", objectif: "buy" });
  const inconnu = buildDecisionArtifact(DOSSIER_MIN, projet(), NOW.toISOString(), "c1", undefined, contexteDuBien(bien(null, null)));
  assert.deepEqual(parseDecisionArtifact(inconnu)!.contexteDuBien, { relation: null, objectif: null });
  const ancien = buildDecisionArtifact(DOSSIER_MIN, projet(), NOW.toISOString(), "c1");
  assert.equal("contexteDuBien" in ancien, false);
  assert.equal(parseDecisionArtifact(ancien)!.contexteDuBien, undefined);
  // Un contexte corrompu tombe seul ; la décision vendue reste servie.
  const corrompu = { ...a, contexteDuBien: { relation: "residence", objectif: 1 } };
  const lu = parseDecisionArtifact(corrompu);
  assert.ok(lu);
  assert.equal(lu.contexteDuBien, undefined);
  // Le générateur passe bien le contexte lu en base.
  assert.match(lire("src/lib/server/generate-decision-artifact.ts"), /contexteDuBien\(relations\.adresse\),/);
});

test("un changement de contexte n'est signalé que s'il change la voix ou les gestes", () => {
  const fige = { relation: "studying" as const, objectif: "buy" as const };
  assert.equal(contexteAChangeMateriellement(fige, bien("studying", "buy"), null, bucketDuProjet), false);
  assert.equal(contexteAChangeMateriellement(fige, bien("lives_here", "buy"), null, bucketDuProjet), false);
  assert.equal(contexteAChangeMateriellement(fige, bien("studying", "understand"), null, bucketDuProjet), true);
  assert.equal(contexteAChangeMateriellement(fige, bien(null, "rent"), null, bucketDuProjet), true);
  // « j'étudie » effacé, avec un projet d'achat : la voix reste celle d'un acheteur, rien à signaler.
  assert.equal(contexteAChangeMateriellement({ relation: "studying", objectif: null }, bien(null, null), "achat", bucketDuProjet), false);
  assert.equal(contexteAChangeMateriellement({ relation: null, objectif: null }, bien("lives_here", null), "achat", bucketDuProjet), true);
  // Sans contexte figé (version antérieure) : on se tait.
  assert.equal(contexteAChangeMateriellement(null, bien("lives_here", "buy"), null, bucketDuProjet), false);
});

test("la modification ne génère rien : l'écran signale et propose la mise à jour explicite", () => {
  const avecLogement = lire("src/components/report/DossierAvecLogement.tsx");
  assert.match(avecLogement, /contexteAChange=\{servi\.source === "artefact" && contexteAChangeMateriellement\(/);
  const section = lire("src/components/report/DossierDecisionSection.tsx");
  assert.match(section, /raison=\{projetAChange \? "projet" : contexteAChange \? "lien" : "voisinage"\}/);
  assert.match(lire("src/components/report/AnalyseAncienProjet.tsx"), /\/api\/dossier\/actualiser/);
  // Ni la route de déclaration ni le bloc « Ce bien » ne déclenchent de génération.
  const declaration = lire("src/app/api/dossier/relation/route.ts") + lire("src/components/report/LienAvecCeBien.tsx");
  assert.doesNotMatch(declaration, /generateDecisionArtifact|actualiser/);
});

// ═══ SÉCURITÉ ═══════════════════════════════════════════════════════════════════════════════════

function stockage(lecteur: string) {
  const dossiers = new Map<string, Record<string, unknown>>([
    ["d-moi", { id: "d-moi", user_id: "moi", revoque: false, place_relation: "lives_here", place_objective: null }],
    ["d-autre", { id: "d-autre", user_id: "autre", revoque: false, place_relation: null, place_objective: null }],
    ["d-revoque", { id: "d-revoque", user_id: "moi", revoque: true, place_relation: null, place_objective: null }],
  ]);
  const ecritures: Record<string, unknown>[] = [];
  const visible = (id: string) => {
    const d = dossiers.get(id);
    return d && d.user_id === lecteur && !d.revoque ? d : null;
  };
  return {
    dossiers, ecritures,
    deps: {
      now: NOW,
      lireDossier: async (id: string) => visible(id) as { id: string } | null,
      ecrire: async (id: string, patch: Record<string, unknown>) => {
        const d = visible(id);
        if (!d) return null;
        ecritures.push(patch);
        return Object.assign(d, patch);
      },
    },
  };
}

test("objectif déclaré seul : la relation n'est pas touchée (patch partiel)", async () => {
  const s = stockage("moi");
  const r = await enregistrerRelationAdresse({ dossierId: "d-moi", objectif: "buy" }, s.deps);
  assert.deepEqual(r, { status: 200, body: { ok: true, relation: "lives_here", objectif: "buy" } });
  assert.deepEqual(s.ecritures, [{ place_objective: "buy", place_objective_set_at: NOW.toISOString() }]);
  // Effacer l'objectif efface aussi sa date, et seulement lui.
  await enregistrerRelationAdresse({ dossierId: "d-moi", objectif: null }, s.deps);
  assert.deepEqual(s.ecritures[1], { place_objective: null, place_objective_set_at: null });
  assert.equal(s.dossiers.get("d-moi")!.place_relation, "lives_here");
});

test("l'utilisateur A ne peut pas modifier le dossier de B, ni un dossier révoqué", async () => {
  const s = stockage("moi");
  assert.equal((await enregistrerRelationAdresse({ dossierId: "d-autre", objectif: "buy" }, s.deps)).status, 403);
  assert.equal((await enregistrerRelationAdresse({ dossierId: "d-revoque", objectif: "buy" }, s.deps)).status, 403);
  assert.deepEqual(s.ecritures, []);
});

test("objectif invalide ou corps vide : 400, sans lecture ni écriture", async () => {
  const s = stockage("moi");
  let lectures = 0;
  const deps = { ...s.deps, lireDossier: async (id: string) => { lectures++; return s.deps.lireDossier(id); } };
  for (const body of [{ dossierId: "d-moi", objectif: "investir" }, { dossierId: "d-moi" }, { dossierId: "d-moi", relation: "lives_here", objectif: 4 }]) {
    assert.equal((await enregistrerRelationAdresse(body, deps)).status, 400, JSON.stringify(body));
  }
  assert.equal(lectures, 0);
  assert.deepEqual(s.ecritures, []);
});

test("données anciennes : une ligne sans les colonnes FUT-10 se lit comme inconnue", () => {
  assert.deepEqual(relationDeLAdresse({ place_relation: "studying" }), bien("studying", null));
  assert.deepEqual(relationDeLAdresse({ posture: "residence" } as Record<string, unknown>), bien(null, null));
  // Le générateur lit la ligne par `*` : une base sans la migration 37 ne fait pas perdre la relation.
  assert.match(lire("src/lib/server/generate-decision-artifact.ts"), /from\("address_dossiers"\)\.select\("\*"\)/);
});

test("migration 37 : additive, contraintes de valeurs, aucune ligne existante touchée, réversible", () => {
  const sql = lire("supabase/37_contexte_checkout_dossier.sql").replace(/--.*$/gm, "");
  assert.match(sql, /alter table public\.dossier_intents/);
  assert.match(sql, /place_objective is null or place_objective in \('buy', 'rent', 'understand', 'other'\)/);
  assert.match(sql, /place_relation is null or place_relation in \('lives_here', 'studying'\)/);
  // Aucune donnée touchée ; le seul `drop` est celui, idempotent, de la contrainte que la migration pose.
  assert.doesNotMatch(sql, /\bupdate\b|\binsert\b|\bdelete\b|drop column|drop table|default '|add column[^,;]*not null|set not null/i);
  assert.match(sql, /drop constraint if exists dossier_intents_project_state_snapshot/);
  // `dossier_intents` reste sans policy : aucune n'est créée ici.
  assert.doesNotMatch(sql, /create policy|grant /i);
  const down = lire("supabase/37_contexte_checkout_dossier_down.sql");
  for (const col of ["place_objective_set_at", "place_objective", "project_snapshot", "place_context_declared_at", "place_relation"]) {
    assert.match(down, new RegExp(`drop column if exists ${col}`));
  }
});
