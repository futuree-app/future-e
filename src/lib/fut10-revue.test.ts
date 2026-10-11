// FUT-10, revue du 11/10/2026 — les deux corrections bloquantes (absence de projet figée, contexte
// verrouillé à la confirmation Stripe), la passe éditoriale, et la cohérence avec FUT-54. Aucune base,
// aucun réseau : les stockages sont simulés. Le même verrou est éprouvé contre un vrai Postgres par
// `scripts/integration/fut10-postgres.mjs` (PGlite).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  colonnesDossierDepuisIntention, colonnesIntention, lireContexteCheckout, projetPourLivraison, projetVuEstACour,
  type ContexteCheckout,
} from "./dossier-contexte-checkout.ts";
import {
  enregistrerIntention, estIdentifiantPaymentIntent, paymentIntentDuSecret, statutStripeModifiable, verrouillerIntention,
  type LigneIntention, type StoreIntentions,
} from "./verrou-intention-dossier.ts";
import {
  EXEMPLES_DE_LECTURE, OBJECTIF_LIBELLE, boutonPasser, recapitulatif, syntheseDuProjet,
} from "./dossier-contexte-ecran.ts";
import { assembleDossier } from "./decision/decision-assembler.ts";
import { pointsAVerifier } from "./decision/logement-verifications.ts";
import { bucketDuProjet } from "./decision/logement-gestes.ts";
import { voixDuLecteur, type AddressObjective, type AddressRelation, type RelationAuLieu } from "./relation-au-lieu.ts";
import type { DecisionFact, LogementFacts, MaterialityTier, RuleEvaluation, RunResult } from "./decision/decision-fact.ts";
import type { UserProject } from "./user-project.ts";

const NOW = new Date("2026-10-11T12:00:00.000Z");
const lire = (p: string) => readFileSync(p, "utf8");

function projet(over: Partial<UserProject> = {}): UserProject {
  return {
    posture: "adresse", intent: null, rawText: "Calme, sans voiture.", updatedAt: "2026-10-01T00:00:00.000Z",
    parsed: { reformulation: "Calme, sans voiture", hardConstraints: {}, preferences: [] } as unknown as UserProject["parsed"],
    ...over,
  };
}
const ctx = (c: Partial<ContexteCheckout>): ContexteCheckout => ({ relation: null, objectif: null, projetVu: null, ...c });

// ═══ A. UN PROJET ABSENT RESTE ABSENT ═══════════════════════════════════════════════════════════

test("A. trois états distincts en base : projet confirmé, absence confirmée, intention historique", () => {
  const p = projet();
  const confirme = colonnesIntention(ctx({ projetVu: { existe: true, updatedAt: p.updatedAt } }), p, NOW);
  assert.equal(confirme.project_state, "confirmed");
  assert.equal(confirme.project_snapshot, p);
  const absent = colonnesIntention(ctx({ projetVu: { existe: false, updatedAt: null } }), null, NOW);
  assert.equal(absent.project_state, "absent");
  assert.equal(absent.project_snapshot, null);
  // Le navigateur n'a rien dit (client antérieur) : ni état, ni snapshot.
  const historique = colonnesIntention(ctx({}), p, NOW);
  assert.equal(historique.project_state, null);
  assert.equal(historique.project_snapshot, null);
});

test("A. la livraison suit l'état confirmé, jamais le projet du compte", () => {
  const p = projet();
  assert.deepEqual(projetPourLivraison({ project_state: "confirmed", project_snapshot: p }),
    { etat: "confirme", projet: { ...p, schemaVersion: 3 } });
  assert.deepEqual(projetPourLivraison({ project_state: "absent", project_snapshot: null }), { etat: "absent" });
  assert.deepEqual(projetPourLivraison({ ban_id: "x" }), { etat: "historique" });
  // Un snapshot confirmé mais illisible (corrompu, ou purgé) ne déclenche JAMAIS une relecture du compte.
  assert.deepEqual(projetPourLivraison({ project_state: "confirmed", project_snapshot: { purge: true } }), { etat: "absent" });
  // Une valeur inattendue non plus.
  assert.deepEqual(projetPourLivraison({ project_state: "peut-etre" }), { etat: "absent" });
});

test("A. scénario : payé sans projet, projet créé dans un autre onglet, puis webhook → dossier factuel", () => {
  // 1. Checkout : aucun projet montré, le lecteur continue sans.
  const vu = { existe: false, updatedAt: null };
  assert.equal(projetVuEstACour(vu, null), true);
  const intent = { stripe_payment_intent_id: "pi_1", ...colonnesIntention(ctx({ projetVu: vu, objectif: "buy" }), null, NOW) };
  // 2. Le lecteur crée un projet ailleurs (le compte change, l'intention non).
  const projetDuCompte = projet({ updatedAt: "2026-10-11T12:00:30.000Z" });
  assert.ok(projetDuCompte);
  // 3. Le webhook lit l'intention : absence confirmée, quoi que contienne le compte.
  assert.deepEqual(projetPourLivraison(intent), { etat: "absent" });
  // 4. Et le webhook ne va même pas lire le compte : la décision est prise avant toute requête.
  const webhook = lire("src/app/api/stripe/webhook/route.ts");
  const planif = webhook.slice(webhook.indexOf("function planifierArtefact("), webhook.indexOf("const supabaseAdmin"));
  const garde = planif.indexOf('if (achat.etat === "absent") return;');
  assert.ok(garde > 0 && garde < planif.indexOf("after("), "l'absence se décide avant `after`");
  assert.ok(planif.indexOf('.from("user_profiles")') > planif.indexOf('if (achat.etat === "historique")'),
    "le compte n'est lu que pour une intention historique");
});

test("A. scénario : projet confirmé puis modifié avant le webhook → le snapshot confirmé est livré", () => {
  const confirme = projet();
  const intent = colonnesIntention(ctx({ projetVu: { existe: true, updatedAt: confirme.updatedAt } }), confirme, NOW);
  const livraison = projetPourLivraison(intent);
  assert.equal(livraison.etat, "confirme");
  assert.equal(livraison.etat === "confirme" && livraison.projet.rawText, confirme.rawText);
});

test("A. un projet montré puis supprimé ailleurs est refusé au paiement, jamais livré comme absent", () => {
  assert.equal(projetVuEstACour({ existe: true, updatedAt: "2026-10-01T00:00:00.000Z" }, null), false);
});

test("A. la migration rend l'ambiguïté impossible : l'état contraint la présence du snapshot", () => {
  const sql = lire("supabase/37_contexte_checkout_dossier.sql").replace(/--.*$/gm, "");
  assert.match(sql, /project_state text\s+check \(project_state is null or project_state in \('confirmed', 'absent'\)\)/);
  assert.match(sql, /project_state is distinct from 'confirmed' or project_snapshot is not null/);
  assert.match(sql, /project_state is distinct from 'absent' or project_snapshot is null/);
});

// ═══ B. LE CONTEXTE SE VERROUILLE À LA CONFIRMATION ═════════════════════════════════════════════

/**
 * Un stockage qui imite Postgres : chaque instruction est atomique, et sa condition est évaluée APRÈS la
 * prise du verrou de ligne (une file par ligne). Les tests d'entrelacement y lancent des écritures et un
 * verrou concurrents, puis vérifient qu'aucune écriture n'a été appliquée après le verrou.
 */
function storeSimule() {
  const lignes = new Map<string, Record<string, unknown>>();
  const journal: string[] = [];
  let file = Promise.resolve();
  const atomique = <T>(fn: () => T): Promise<T> => {
    const r = file.then(async () => { await new Promise((ok) => setTimeout(ok, Math.random() * 3)); return fn(); });
    file = r.then(() => undefined, () => undefined);
    return r;
  };
  const store: StoreIntentions = {
    insererSiAbsente: (ligne) => atomique(() => {
      if (lignes.has(ligne.stripe_payment_intent_id)) return false;
      lignes.set(ligne.stripe_payment_intent_id, { ...ligne, context_locked_at: null });
      journal.push(`insert:${String(ligne.place_objective)}`);
      return true;
    }),
    mettreAJourSiOuverte: (pi, userId, champs) => atomique(() => {
      const l = lignes.get(pi);
      if (!l || l.user_id !== userId || l.context_locked_at != null) return false;
      Object.assign(l, champs);
      journal.push(`update:${String(champs.place_objective)}`);
      return true;
    }),
    verrouillerSiOuverte: (pi, userId, maintenant) => atomique(() => {
      const l = lignes.get(pi);
      if (!l || (userId && l.user_id !== userId) || l.context_locked_at != null) return false;
      l.context_locked_at = maintenant;
      journal.push("lock");
      return true;
    }),
    lire: (pi, userId) => atomique(() => {
      const l = lignes.get(pi);
      return l && (!userId || l.user_id === userId) ? { context_locked_at: l.context_locked_at as string | null } : null;
    }),
  };
  return { store, lignes, journal };
}

const ligne = (objectif: AddressObjective | null, over: Partial<LigneIntention> = {}): LigneIntention => ({
  stripe_payment_intent_id: "pi_1", user_id: "u1", ban_id: "b", place_objective: objectif, ...over,
});

test("B. avant confirmation : les réponses se corrigent, sur le même PaymentIntent", async () => {
  const { store, lignes } = storeSimule();
  const modifiable = async () => true;
  assert.equal(await enregistrerIntention(store, ligne("rent"), { paiementEncoreModifiable: modifiable }), "creee");
  assert.equal(await enregistrerIntention(store, ligne("buy"), { paiementEncoreModifiable: modifiable }), "mise_a_jour");
  assert.equal(lignes.get("pi_1")!.place_objective, "buy");
  assert.equal(lignes.size, 1);
});

test("B. après le verrou : aucune écriture ne passe, et la ligne est intacte", async () => {
  const { store, lignes } = storeSimule();
  await enregistrerIntention(store, ligne("buy"));
  assert.equal(await verrouillerIntention(store, "pi_1", "u1", NOW), "verrouillee");
  assert.equal(await enregistrerIntention(store, ligne("rent", { project_snapshot: { autre: true } }), { paiementEncoreModifiable: async () => true }), "verrouillee");
  assert.equal(lignes.get("pi_1")!.place_objective, "buy");
  assert.equal(lignes.get("pi_1")!.project_snapshot, undefined);
  // Un webhook rejoué relit exactement la même ligne.
  assert.equal(await verrouillerIntention(store, "pi_1", null, new Date("2026-10-12T00:00:00Z")), "verrouillee");
  assert.equal(lignes.get("pi_1")!.context_locked_at, NOW.toISOString());
});

test("B. Stripe dit le paiement engagé : rien n'est écrit, et l'intention est verrouillée sur-le-champ", async () => {
  for (const statut of ["requires_action", "processing", "requires_capture", "succeeded", "canceled"]) {
    const { store, lignes } = storeSimule();
    await enregistrerIntention(store, ligne("buy"));
    const r = await enregistrerIntention(store, ligne("rent"), { paiementEncoreModifiable: async () => statutStripeModifiable(statut), maintenant: NOW });
    assert.equal(r, "verrouillee", statut);
    assert.equal(lignes.get("pi_1")!.place_objective, "buy", statut);
    assert.equal(lignes.get("pi_1")!.context_locked_at, NOW.toISOString(), statut);
  }
  assert.equal(statutStripeModifiable("requires_payment_method"), true);
  assert.equal(statutStripeModifiable("requires_confirmation"), true);
  assert.equal(statutStripeModifiable(undefined), false);
});

test("B. accès concurrents : aucune écriture n'est appliquée après le verrou (200 entrelacements)", async () => {
  for (let essai = 0; essai < 200; essai++) {
    const { store, lignes, journal } = storeSimule();
    await enregistrerIntention(store, ligne("buy"));
    const objectifs: AddressObjective[] = ["rent", "understand", "other", "buy", "rent"];
    const resultats = await Promise.all([
      ...objectifs.map((o) => enregistrerIntention(store, ligne(o))),
      verrouillerIntention(store, "pi_1", "u1", NOW),
      ...objectifs.map((o) => enregistrerIntention(store, ligne(o))),
    ]);
    const posLock = journal.indexOf("lock");
    assert.ok(posLock > 0);
    assert.equal(journal.slice(posLock + 1).filter((e) => e.startsWith("update")).length, 0, journal.join(" "));
    // La valeur figée est la dernière écrite AVANT le verrou, et chaque refus est dit comme tel.
    const derniere = journal.slice(0, posLock).filter((e) => e.startsWith("update") || e.startsWith("insert")).at(-1)!;
    assert.equal(`x:${String(lignes.get("pi_1")!.place_objective)}`, `x:${derniere.split(":")[1]}`);
    // Le résultat du verrou lui-même (index du milieu) n'est pas une écriture refusée.
    const ecritures = [...resultats.slice(0, objectifs.length), ...resultats.slice(objectifs.length + 1)];
    const refus = ecritures.filter((r) => r === "verrouillee").length;
    assert.equal(refus, objectifs.length * 2 - journal.filter((e) => e.startsWith("update")).length);
  }
});

test("B. verrouiller est idempotent, et réservé au compte de l'intention", async () => {
  const { store } = storeSimule();
  await enregistrerIntention(store, ligne("buy"));
  assert.equal(await verrouillerIntention(store, "pi_1", "u2", NOW), "introuvable");
  assert.equal(await verrouillerIntention(store, "pi_1", "u1", NOW), "verrouillee");
  assert.equal(await verrouillerIntention(store, "pi_1", "u1", NOW), "verrouillee");
  assert.equal(await verrouillerIntention(store, "pi_inconnu", "u1", NOW), "introuvable");
  // Et une mise à jour venant d'un autre compte n'écrit rien, même avant le verrou.
  const { store: s2, lignes } = storeSimule();
  await enregistrerIntention(s2, ligne("buy"));
  assert.equal(await enregistrerIntention(s2, ligne("rent", { user_id: "u2" })), "verrouillee");
  assert.equal(lignes.get("pi_1")!.place_objective, "buy");
});

test("B. identifiants : le PaymentIntent se déduit du secret client, rien d'autre n'est accepté", () => {
  assert.equal(paymentIntentDuSecret("pi_3Qabcdefgh12345_secret_XYZ"), "pi_3Qabcdefgh12345");
  for (const v of [null, "", "seti_123_secret_x", "pi_court_secret_x", "pi_abc$def12345_secret_x"]) {
    assert.equal(paymentIntentDuSecret(v), null, String(v));
  }
  assert.equal(estIdentifiantPaymentIntent("pi_3Qabcdefgh12345"), true);
  assert.equal(estIdentifiantPaymentIntent("pi_1; drop table"), false);
});

test("B. câblage : verrou AVANT la confirmation Stripe, au webhook AVANT la lecture, refus côté route", () => {
  const form = lire("src/components/PaymentForm.tsx");
  assert.ok(form.indexOf("await avantConfirmation()") > 0);
  assert.ok(form.indexOf("await avantConfirmation()") < form.indexOf("stripe.confirmPayment("));
  const wrapper = lire("src/components/PaymentWrapper.tsx");
  assert.match(wrapper, /avantConfirmation=\{verrouillerContexte\s*\?/);
  assert.match(wrapper, /\/api\/dossier\/intention\/verrouiller/);
  // Un verrou en échec bloque la confirmation (un message est rendu, donc PaymentForm s'arrête).
  assert.match(wrapper, /catch \{[\s\S]{0,300}return "Le paiement n'a pas pu être préparé/);
  const panneau = lire("src/app/(public)/checkout/dossier/DossierCheckoutPanel.tsx");
  assert.match(panneau, /verrouillerContexte\s+onContexteVerrouille=/);
  const webhook = lire("src/app/api/stripe/webhook/route.ts");
  const dossier = webhook.slice(webhook.indexOf('if (productType === "address-dossier") {'));
  assert.ok(dossier.indexOf("verrouillerIntention(") < dossier.indexOf('.from("dossier_intents")'));
  const route = lire("src/app/api/stripe/create-payment-intent/route.ts");
  assert.match(route, /paiementEncoreModifiable: async \(\) =>\s*statutStripeModifiable\(\(await stripe\.paymentIntents\.retrieve\(paymentIntent\.id\)\)\.status\)/);
  assert.match(route, /if \(resultat === "verrouillee"\) \{[\s\S]{0,400}status: 409/);
  const verrou = lire("src/app/api/dossier/intention/verrouiller/route.ts");
  assert.match(verrou, /if \(!user\) return Response\.json\(\{ error: "AUTH_REQUIRED" \}, \{ status: 401 \}\)/);
  assert.match(verrou, /verrouillerIntention\(storeIntentionsSupabase\(\), body\.paymentIntentId, user\.id, new Date\(\)\)/);
  // Le stockage réel porte la condition dans la requête, pas dans une lecture préalable.
  const store = lire("src/lib/intention-dossier-store-supabase.ts");
  assert.equal((store.match(/\.is\("context_locked_at", null\)/g) ?? []).length, 2);
});

test("B. le webhook recopie au dossier exactement l'intention verrouillée, rejeu compris", () => {
  const intent = { place_relation: "lives_here", place_objective: "buy", place_context_declared_at: NOW.toISOString(), context_locked_at: NOW.toISOString() };
  assert.deepEqual(colonnesDossierDepuisIntention(intent), colonnesDossierDepuisIntention({ ...intent }));
  assert.deepEqual(colonnesDossierDepuisIntention(intent), {
    place_relation: "lives_here", place_relation_set_at: NOW.toISOString(),
    place_objective: "buy", place_objective_set_at: NOW.toISOString(),
  });
});

// ═══ ÉDITORIAL : LE PROJET, CLÉ DE LECTURE ═════════════════════════════════════════════════════

test("Éditorial. le bouton qui passe dit la vérité selon qu'un projet existe", () => {
  assert.deepEqual(boutonPasser(true), { libelle: "Continuer sans préciser davantage", consequence: null });
  const sans = boutonPasser(false);
  assert.equal(sans.libelle, "Continuer sans personnaliser mon dossier");
  assert.match(sans.consequence!, /sans les rapprocher de vos priorités/);
  // Le libellé ambigu a disparu des composants.
  for (const f of ["src/app/(public)/checkout/dossier/DossierCheckoutPanel.tsx", "src/app/(public)/checkout/dossier/ContexteDuDossier.tsx"]) {
    assert.doesNotMatch(lire(f), /Continuer sans répondre/);
  }
});

test("Éditorial. un projet existant est montré tel que futur•e le connaît : intention, priorités, conditions confirmées", () => {
  const s = syntheseDuProjet(projet({ intent: "achat" }), ["moins de 20 km de Nantes"]);
  assert.deepEqual(s, { intention: "Vous cherchez à acheter.", priorites: "Calme, sans voiture", conditions: ["moins de 20 km de Nantes"] });
  assert.equal(syntheseDuProjet(null), null);
  assert.equal(syntheseDuProjet(projet({ intent: null }))!.intention, null);
  // Les conditions viennent des seules confirmations (état « condition » de `vueCriteres`).
  assert.match(lire("src/app/(public)/checkout/dossier/page.tsx"), /vueCriteres\(projet\)\.filter\(\(c\) => c\.etat === "condition"\)/);
  const comp = lire("src/app/(public)/checkout/dossier/ContexteDuDossier.tsx");
  assert.match(comp, /Votre projet est déjà renseigné\./);
  assert.match(comp, /Un lieu ne se résume pas à ses données\./);
});

test("Éditorial. les exemples sont illustratifs : aucun chiffre, aucune adresse, aucun verdict", () => {
  assert.equal(EXEMPLES_DE_LECTURE.length, 2);
  for (const e of EXEMPLES_DE_LECTURE) {
    assert.doesNotMatch(e.priorite + e.lecture, /\d|correspond|compatible|risque élevé|favorable/i);
  }
  assert.match(lire("src/app/(public)/checkout/dossier/ContexteDuDossier.tsx"), /Par exemple, pour une même adresse/);
});

test("Éditorial. le récapitulatif crée une attente juste : rapprocher, jamais tout évaluer", () => {
  const r = recapitulatif({ objectif: "buy", relation: "lives_here", priorites: "Vivre sans voiture et au calme", prioritesIncomprises: false });
  assert.equal(r.titre, "Votre dossier prendra en compte");
  assert.deepEqual(r.lignes.map((l) => l.valeur), ["Vivre sans voiture et au calme", "acheter ce logement", "vous y habitez déjà"]);
  assert.match(r.usage!, /rapprochera/);
  assert.match(r.usage!, /ne mesurent pas sera signalée/);
  assert.doesNotMatch(r.usage!, /tous|toutes|garanti|prospecti|personnalis/i);
});

test("Éditorial. tutoiement ni « je » : les choix suivent la question à la deuxième personne", () => {
  for (const libelle of Object.values(OBJECTIF_LIBELLE)) assert.doesNotMatch(libelle, /\bje\b|\bj'/i);
});

// ═══ NON-RÉGRESSIONS MÉTIER ET COHÉRENCE FUT-54 ════════════════════════════════════════════════

const bien = (relation: AddressRelation | null, objectif: AddressObjective | null = null): RelationAuLieu =>
  ({ echelle: "adresse", relation, objectif });

const LOGEMENT: LogementFacts = {
  dpe: "passoire", dpeLabel: "G", confortEteInsuffisant: true,
  rga: "present", expositionBati: true, pprn: "present", zoneReglementee: true, pprnLabel: "PPRI",
  cavites: "present", caviteProche: true, patrimoine: "present", perimetrePatrimonial: true,
  sinistralite: "present", sinistraliteActive: true, addressLabel: "3 rue des Essais, Nantes",
};

test("Non-régression. habitant qui examine UNE AUTRE adresse : pas de voix d'habitant pour celle-ci", () => {
  // Il habite ailleurs, étudie ce bien sans objectif déclaré : engagement (FUT-26), jamais « habitant ».
  assert.equal(voixDuLecteur(null, bien("studying")), "engagement");
  assert.equal(bucketDuProjet({ intent: null }, bien("studying", "rent")), "location");
  assert.notEqual(voixDuLecteur(null, bien("studying", "rent")), "habitant");
});

test("Non-régression. utilisateur sans projet : gestes neutres sans réponse, gestes déclarés sinon", () => {
  assert.deepEqual(pointsAVerifier(LOGEMENT, null, bien(null)), pointsAVerifier(LOGEMENT, null, null));
  assert.notDeepEqual(pointsAVerifier(LOGEMENT, null, bien("lives_here", "buy")), pointsAVerifier(LOGEMENT, null, null));
});

function projetPrefs(prefs: [string, number][]): UserProject {
  return projet({ parsed: { reformulation: "x", hardConstraints: {}, preferences: prefs.map(([key, weight]) => ({ key, weight })) } as unknown as UserProject["parsed"] });
}
const preuve = (id: string) => [{ factId: id, module: "territoire" as const, label: "T", grain: "commune" as const }];
function fait(role: "alignment" | "mismatch", key: string, subject: string, tier: MaterialityTier): DecisionFact {
  return {
    id: `${role}-${key}`, ruleId: `territoire.${role}-${key}`, sourceFactIds: [], module: "territoire", role,
    materialityTier: tier, topic: subject, headlineSubject: subject, statement: `${subject}.`, projectKey: key as never,
    basis: role === "alignment"
      ? { kind: "relative_position", rankLow: 0.92, rankHigh: 0.99, universe: "communes_france", distributionVersion: "t" }
      : { kind: "categorical_state", state: "metropole" },
    evidence: preuve(`${role}-${key}`),
  } as DecisionFact;
}

test("Cohérence FUT-54 : l'objectif et la relation changent la voix, jamais l'orientation ni le libellé du verdict", () => {
  const p = projetPrefs([["acces_soins", 3], ["vie_locale", 3], ["eviter_grandes_villes", 2]]);
  const faits = [fait("alignment", "acces_soins", "l'accès aux soins", "structuring"), fait("alignment", "vie_locale", "la vie locale", "structuring"), fait("mismatch", "eviter_grandes_villes", "une ville à taille humaine", "secondary")];
  const outcomes: RuleEvaluation["outcome"][] = ["satisfied", "satisfied", "mismatch"];
  const run: RunResult = { facts: faits, evaluations: faits.map((f, i) => ({ ruleId: f.ruleId, projectKeys: [(f as { projectKey?: string }).projectKey ?? ""], outcome: outcomes[i], facts: [f], reason: "t" })) };
  const variantes = [null, bien("lives_here", "buy"), bien("lives_here", "understand"), bien("studying", "rent"), bien(null, "other")];
  const dossiers = variantes.map((r) => assembleDossier(run, p, "commune+adresse", "Nantes", [], r));
  for (const d of dossiers) {
    assert.equal(d.criteria.orientation, "favorable");
    assert.equal(d.narrativePlan.verdict.label, "Correspondance avec un écart");
    assert.equal(d.narrativePlan.verdict.headline.text, dossiers[0].narrativePlan.verdict.headline.text);
  }
  // La voix, elle, suit l'objectif : le locataire acheteur est un acheteur, l'habitant un habitant.
  assert.equal(dossiers[1].controlesTitle, dossiers[3].controlesTitle);
  assert.equal(dossiers[2].controlesTitle, "Tous les points à connaître et à surveiller");
  assert.equal(dossiers[4].controlesTitle, "Tous les contrôles établis pour ce dossier");
  assert.notEqual(dossiers[1].controlesTitle, dossiers[2].controlesTitle);
});
