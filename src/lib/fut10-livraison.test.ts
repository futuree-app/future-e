// FUT-10, dernière revue — la fidélité de livraison. Le contexte d'un achat (projet, relation, objectif)
// sert la PREMIÈRE livraison, quels que soient les échecs, les modifications et les rejeux ; une mise à
// jour explicite est une autre opération. Aucune base, aucun réseau : la chaîne est simulée avec les
// vraies fonctions de décision, et le câblage des routes est vérifié sur leur source.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  contexteDAchat, contexteDeGeneration, operationDeGeneration, type ContexteDAchat,
} from "./contexte-livraison.ts";
import { colonnesDossierDepuisIntention, colonnesIntention, type ContexteCheckout } from "./dossier-contexte-checkout.ts";
import {
  contexteAChangeMateriellement, contexteDuBien, relationDeLAdresse,
  type AddressObjective, type AddressRelation, type ContexteDuBien, type RelationAuLieu,
} from "./relation-au-lieu.ts";
import { bucketDuProjet } from "./decision/logement-gestes.ts";
import { projetAChangeMateriellement } from "./decision/projet-materiel.ts";
import type { UserProject } from "./user-project.ts";

const NOW = new Date("2026-10-12T10:00:00.000Z");
const lire = (p: string) => readFileSync(p, "utf8");

function projet(texte: string, prefs: [string, number][] = [], updatedAt = "2026-10-01T00:00:00.000Z"): UserProject {
  return {
    posture: "adresse", intent: null, rawText: texte, updatedAt,
    parsed: { reformulation: texte, hardConstraints: {}, preferences: prefs.map(([key, weight]) => ({ key, weight })) } as unknown as UserProject["parsed"],
  };
}
const A = projet("Projet A : calme", [["calme_sonore", 3]]);
const B = projet("Projet B : jardin", [["acces_espaces_verts", 3]], "2026-10-12T09:00:00.000Z");
const ctx = (c: Partial<ContexteCheckout>): ContexteCheckout => ({ relation: null, objectif: null, projetVu: null, ...c });

// ═══ UNE CHAÎNE SIMULÉE : compte, intention verrouillée, dossier modifiable, versions d'artefact ════

type Version = { version: number; status: "ready" | "failed"; projet?: UserProject; contexte?: ContexteDuBien | null };

function monde(opts: { projetAuCheckout: UserProject | null; relation?: AddressRelation | null; objectif?: AddressObjective | null; historique?: boolean }) {
  const colonnes = opts.historique
    ? { place_relation: null, place_objective: null, project_state: null, project_snapshot: null }
    : colonnesIntention(ctx({
        relation: opts.relation ?? null, objectif: opts.objectif ?? null,
        projetVu: { existe: Boolean(opts.projetAuCheckout), updatedAt: opts.projetAuCheckout?.updatedAt ?? null },
      }), opts.projetAuCheckout, NOW);
  // L'intention passe par JSON, comme en base.
  const intent = JSON.parse(JSON.stringify({ stripe_payment_intent_id: "pi_1", context_locked_at: NOW.toISOString(), ...colonnes })) as Record<string, unknown>;
  const w = {
    compte: { projet: opts.projetAuCheckout as UserProject | null },
    intent,
    dossier: null as null | Record<string, unknown>,
    versions: [] as Version[],
    get servie(): Version | null { return [...w.versions].reverse().find((v) => v.status === "ready") ?? null; },
    relationCourante(): RelationAuLieu { return relationDeLAdresse(w.dossier); },
    achat(): ContexteDAchat { return contexteDAchat(w.intent); },
    /** Une génération : réserve le numéro suivant, échoue ou fige le contexte reçu. */
    generer(c: ReturnType<typeof contexteDeGeneration>, echec: boolean) {
      if (!c.genere) return;
      const version = (w.versions.at(-1)?.version ?? 0) + 1;
      // Une relation IMPOSÉE (achat, version servie) l'emporte sur la ligne du dossier ; sinon la ligne.
      const relation = c.source === "courant" ? w.relationCourante() : c.relation;
      w.versions.push(echec ? { version, status: "failed" } : { version, status: "ready", projet: c.projet, contexte: contexteDuBien(relation) });
    },
    /** Le webhook : upsert(ignoreDuplicates) du dossier, puis première livraison si créé. */
    webhook(echec = false) {
      const created = w.dossier === null;
      if (created) w.dossier = { id: "d1", ...colonnesDossierDepuisIntention(w.intent) };
      if (!created) return;
      const achat = w.achat();
      const courant = achat.etat === "historique" ? w.compte.projet : null;
      w.generer(contexteDeGeneration({ operation: "premiere_livraison", achat, courant: { projet: courant, relation: null } }), echec);
    },
    /** Le rattrapage de la page : automatique, première livraison OU succession (DPE). */
    rattrapage(opts2: { echec?: boolean; dpe?: boolean } = {}) {
      const servie = w.servie;
      if (servie && !opts2.dpe) return;
      const c = contexteDeGeneration({
        operation: operationDeGeneration({ versionPrete: Boolean(servie), demandeExplicite: false }),
        achat: w.achat(),
        versionServie: servie ? { projet: servie.projet ?? null, contexteDuBien: servie.contexte ?? null } : null,
        courant: { projet: w.compte.projet, relation: w.relationCourante() },
      });
      w.generer(c, opts2.echec ?? false);
    },
    /** La mise à jour demandée explicitement (bandeau, ou « Lire ce bien avec mon projet »). */
    actualiser() {
      const c = contexteDeGeneration({
        operation: operationDeGeneration({ versionPrete: Boolean(w.servie), demandeExplicite: true }),
        demandeExplicite: true,
        achat: w.achat(),
        courant: { projet: w.compte.projet, relation: w.relationCourante() },
      });
      w.generer(c, false);
    },
    modifierLien(relation: AddressRelation | null, objectif: AddressObjective | null) {
      w.dossier = { ...w.dossier, place_relation: relation, place_objective: objectif };
    },
  };
  return w;
}

const premiere = (w: ReturnType<typeof monde>) => w.versions.find((v) => v.status === "ready") ?? null;

// ═══ CORRECTION 1 : LA PREMIÈRE LIVRAISON SUIT L'ACHAT ═════════════════════════════════════════

test("A confirmé, B créé AVANT le webhook : la première version est lue avec A", () => {
  const w = monde({ projetAuCheckout: A, objectif: "buy" });
  w.compte.projet = B;
  w.webhook();
  assert.equal(premiere(w)!.projet!.rawText, A.rawText);
});

test("A confirmé, génération échouée, B créé AVANT le rattrapage : la reprise est lue avec A, l'échec reste en base", () => {
  const w = monde({ projetAuCheckout: A, objectif: "buy", relation: "studying" });
  w.webhook(true);
  assert.deepEqual(w.versions.map((v) => v.status), ["failed"]);
  w.compte.projet = B;
  w.rattrapage();
  assert.deepEqual(w.versions.map((v) => `${v.version}:${v.status}`), ["1:failed", "2:ready"]);
  assert.equal(w.servie!.projet!.rawText, A.rawText);
  // Le lecteur voit ensuite qu'il a changé de projet depuis : la mise à jour lui est proposée.
  assert.equal(projetAChangeMateriellement(w.servie!.projet, w.compte.projet), true);
});

test("relation et objectif modifiés avant le rattrapage initial : la première version garde ceux de l'achat", () => {
  const w = monde({ projetAuCheckout: A, relation: "lives_here", objectif: "buy" });
  w.webhook(true);
  w.modifierLien("studying", "rent");
  w.rattrapage();
  assert.deepEqual(w.servie!.contexte, { relation: "lives_here", objectif: "buy" });
  // Et l'écart avec le lien déclaré depuis est signalé, pour une mise à jour explicite.
  assert.equal(contexteAChangeMateriellement(w.servie!.contexte, w.relationCourante(), A.intent, bucketDuProjet), true);
});

test("échecs successifs puis reprise réussie : une seule version prête, fidèle à l'achat", () => {
  const w = monde({ projetAuCheckout: A, objectif: "understand", relation: "lives_here" });
  w.webhook(true);
  w.rattrapage({ echec: true });
  w.compte.projet = B;
  w.modifierLien(null, null);
  w.rattrapage();
  assert.deepEqual(w.versions.map((v) => v.status), ["failed", "failed", "ready"]);
  assert.equal(w.servie!.projet!.rawText, A.rawText);
  assert.deepEqual(w.servie!.contexte, { relation: "lives_here", objectif: "understand" });
});

test("webhook rejoué après une modification : rien n'est réécrit, rien n'est régénéré", () => {
  const w = monde({ projetAuCheckout: A, relation: "studying", objectif: "buy" });
  w.webhook();
  w.modifierLien("lives_here", "understand");
  w.compte.projet = B;
  w.webhook();
  assert.equal(w.versions.length, 1);
  assert.equal(w.dossier!.place_relation, "lives_here");
  assert.equal(w.servie!.projet!.rawText, A.rawText);
});

test("plusieurs dossiers à une même adresse : chacun sa première livraison, avec son propre achat", () => {
  const a = monde({ projetAuCheckout: A, relation: "lives_here", objectif: "understand" });
  const b = monde({ projetAuCheckout: B, relation: "studying", objectif: "buy" });
  a.webhook(true); b.webhook(true);
  a.compte.projet = B; b.compte.projet = A;
  a.rattrapage(); b.rattrapage();
  assert.equal(a.servie!.projet!.rawText, A.rawText);
  assert.equal(b.servie!.projet!.rawText, B.rawText);
  assert.notDeepEqual(a.servie!.contexte, b.servie!.contexte);
});

test("intention antérieure sans project_state : le contexte du jour, comme avant", () => {
  const w = monde({ projetAuCheckout: null, historique: true });
  w.compte.projet = B;
  w.webhook(true);
  w.rattrapage();
  assert.deepEqual(w.achat(), { etat: "historique" });
  assert.equal(w.servie!.projet!.rawText, B.rawText);
});

test("INVARIANT : sur 500 séquences aléatoires, la première version prête est toujours celle de l'achat", () => {
  const objectifs: (AddressObjective | null)[] = ["buy", "rent", "understand", "other", null];
  const relations: (AddressRelation | null)[] = ["lives_here", "studying", null];
  const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
  for (let i = 0; i < 500; i++) {
    const relation = pick(relations), objectif = pick(objectifs);
    const w = monde({ projetAuCheckout: A, relation, objectif });
    for (let pas = 0; pas < 12; pas++) {
      const geste = pick(["webhook", "webhook_echec", "rattrapage", "rattrapage_echec", "projet", "lien", "dpe"]);
      if (geste === "webhook") w.webhook();
      else if (geste === "webhook_echec") w.webhook(true);
      else if (geste === "rattrapage") w.rattrapage();
      else if (geste === "rattrapage_echec") w.rattrapage({ echec: true });
      else if (geste === "projet") w.compte.projet = pick([A, B, null]);
      else if (geste === "lien" && w.dossier) w.modifierLien(pick(relations), pick(objectifs));
      else if (geste === "dpe" && w.dossier) w.rattrapage({ dpe: true });
    }
    const p = premiere(w);
    if (!p) continue;
    assert.equal(p.projet!.rawText, A.rawText, `séquence ${i}`);
    assert.deepEqual(p.contexte, { relation, objectif }, `séquence ${i}`);
    // Et aucune version automatique, première ou successeur, n'a jamais adopté B.
    for (const v of w.versions) if (v.status === "ready") assert.equal(v.projet!.rawText, A.rawText, `séquence ${i}`);
  }
});

// ═══ SUCCESSION ET MISE À JOUR : DEUX AUTRES OPÉRATIONS ══════════════════════════════════════════

test("diagnostic déposé (succession automatique) : la version suivante garde le contexte de la version servie", () => {
  const w = monde({ projetAuCheckout: A, relation: "studying", objectif: "buy" });
  w.webhook();
  w.compte.projet = B;
  w.modifierLien("lives_here", "understand");
  w.rattrapage({ dpe: true });
  assert.equal(w.versions.length, 2);
  assert.equal(w.servie!.projet!.rawText, A.rawText);
  assert.deepEqual(w.servie!.contexte, { relation: "studying", objectif: "buy" });
});

test("mise à jour demandée explicitement : une deuxième version, avec le nouveau contexte, la première intacte", () => {
  const w = monde({ projetAuCheckout: A, relation: "studying", objectif: "buy" });
  w.webhook();
  w.compte.projet = B;
  w.modifierLien("lives_here", "buy");
  w.actualiser();
  assert.equal(w.versions.length, 2);
  assert.equal(w.versions[0].projet!.rawText, A.rawText);
  assert.deepEqual(w.versions[0].contexte, { relation: "studying", objectif: "buy" });
  assert.equal(w.servie!.projet!.rawText, B.rawText);
  assert.deepEqual(w.servie!.contexte, { relation: "lives_here", objectif: "buy" });
});

test("un clic avant toute version prête reste une première livraison : fidèle à l'achat", () => {
  const w = monde({ projetAuCheckout: A, objectif: "buy" });
  w.webhook(true);
  w.compte.projet = B;
  w.actualiser();
  assert.equal(w.servie!.projet!.rawText, A.rawText);
});

test("opérations : la table de décision", () => {
  assert.equal(operationDeGeneration({ versionPrete: false, demandeExplicite: false }), "premiere_livraison");
  assert.equal(operationDeGeneration({ versionPrete: false, demandeExplicite: true }), "premiere_livraison");
  assert.equal(operationDeGeneration({ versionPrete: true, demandeExplicite: false }), "succession_automatique");
  assert.equal(operationDeGeneration({ versionPrete: true, demandeExplicite: true }), "mise_a_jour_explicite");
});

// ═══ CORRECTION 3 : ACHAT SANS PROJET ════════════════════════════════════════════════════════════

test("achat sans projet, projet créé ensuite : aucune personnalisation automatique, jamais", () => {
  const w = monde({ projetAuCheckout: null, objectif: "buy" });
  w.compte.projet = B;
  w.webhook();
  w.rattrapage();
  w.rattrapage({ dpe: true });
  assert.equal(w.versions.length, 0);
  assert.deepEqual(contexteDeGeneration({ operation: "premiere_livraison", achat: w.achat(), courant: { projet: B, relation: null } }),
    { genere: false, raison: "achat_sans_projet" });
});

test("achat sans projet, puis « Lire ce bien avec mon projet » : une lecture datée, avec le projet du jour", () => {
  const w = monde({ projetAuCheckout: null, relation: "lives_here", objectif: "buy" });
  w.webhook();
  w.compte.projet = B;
  w.actualiser();
  assert.equal(w.versions.length, 1);
  assert.equal(w.servie!.projet!.rawText, B.rawText);
  // Sans projet du tout, le geste ne produit rien.
  const v = monde({ projetAuCheckout: null });
  v.webhook();
  v.actualiser();
  assert.equal(v.versions.length, 0);
});

// ═══ CÂBLAGE ═══════════════════════════════════════════════════════════════════════════════════

test("câblage : le rattrapage de la page lit le contexte d'achat, n'en devine aucun, et impose la relation", () => {
  const f = lire("src/components/report/DossierAvecLogement.tsx");
  assert.match(f, /const achat = await lireContexteDAchat\(userId, dossierId\)\.catch\(\(\) => null\);/);
  assert.match(f, /operation: operationDeGeneration\(\{ versionPrete: Boolean\(stocke\?\.artifact\), demandeExplicite: false \}\)/);
  // On ne fige qu'avec un contexte établi : jamais avec le projet du jour par défaut.
  assert.match(f, /assemble\?\.status === "done" && contexte\?\.genere\) \{/);
  assert.match(f, /generateDecisionArtifact\(sb, userId, projetAFiger, \{\s*kind: "adresse", insee, dossierId, address, savedDpe, relationImposee,/);
  assert.doesNotMatch(f, /generateDecisionArtifact\(sb, userId, project,/);
  // Une lecture non figée le dit.
  assert.match(f, /Lecture provisoire/);
  const gen = lire("src/lib/server/generate-decision-artifact.ts");
  assert.match(gen, /cible\.kind === "adresse" && cible\.relationImposee !== undefined/);
});

test("câblage : l'actualisation distingue première livraison et mise à jour, et refuse sans contexte d'achat", () => {
  const r = lire("src/app/api/dossier/actualiser/route.ts");
  assert.match(r, /operation: operationDeGeneration\(\{ versionPrete: Boolean\(existant\?\.artifact\), demandeExplicite: true \}\)/);
  assert.match(r, /if \(!achat\) return Response\.json\(\{ error: "PURCHASE_CONTEXT_UNAVAILABLE" \}, \{ status: 503 \}\);/);
  assert.match(r, /generateDecisionArtifact\(supabase, user\.id, projet, cible, version\)/);
});

test("câblage : un bien acheté sans projet s'affiche factuel, sans repli personnalisé, avec le geste explicite", () => {
  const page = lire("src/app/(account)/rapport/page.tsx");
  const decision = page.indexOf("dossierAddress && logementForCommune && lectureFactuelle ? (");
  assert.ok(decision > 0 && decision < page.indexOf("<Suspense"), "la lecture factuelle est décidée avant le Suspense");
  assert.match(page, /achatDuBien\?\.contexte\.etat === "absent"/);
  const comp = lire("src/components/report/LectureFactuelleDuBien.tsx");
  assert.match(comp, /Ce dossier a été ouvert sans projet\./);
  assert.match(comp, /Lire ce bien avec mon projet/);
  assert.match(comp, /\/api\/dossier\/actualiser/);
  // L'historique distingue l'achat de la lecture demandée ensuite.
  assert.match(lire("src/components/report/DossierAvecLogement.tsx"), /Ce bien a été acheté sans projet/);
});

test("câblage : le bandeau « lien modifié » existe aussi dans Le relevé, avec la même priorité", () => {
  const s = lire("src/components/report/DossierDecisionSection.tsx");
  const releve = s.slice(s.indexOf("const lienSeul"), s.indexOf("const structured ="));
  assert.match(releve, /const lienSeul = Boolean\(contexteAChange && !projetAChange && insee\);/);
  assert.match(releve, /<AnalyseAncienProjet insee=\{insee\} scopeKey=\{scopeKey\} raison="lien" \/>/);
  assert.match(releve, /if \(lienSeul\) voisinageAChange = false;/);
  assert.ok(releve.indexOf("{bandeauLienReleve}") < releve.indexOf("<DossierDecisionReleve"));
});

// ═══ GARDE-FOU DES TESTS D'INTÉGRATION ═════════════════════════════════════════════════════════

test("garde-fou : refuse la production et les vraies clés, accepte un environnement factice local, n'affiche aucun secret", async () => {
  const { diagnostiquer } = await import("../../scripts/integration/garde-environnement.mjs");
  const isole = {
    STRIPE_SECRET_KEY: "sk_test_SECRET1", NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_x", STRIPE_WEBHOOK_SECRET: "whsec_SECRET2",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321", SUPABASE_SERVICE_ROLE_KEY: "SECRET3",
    RESEND_API_KEY: "re_factice_fut10", NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: "phc_factice_fut10", NEXT_PUBLIC_POSTHOG_HOST: "http://127.0.0.1:9",
  };
  const ok = diagnostiquer(isole, new Set());
  assert.equal(ok.ok, true);
  assert.doesNotMatch(JSON.stringify(ok), /SECRET|127\.0\.0\.1:54321/);
  const refProd = "abcdefghijklmnopqrst";
  const cas = [
    { STRIPE_SECRET_KEY: "sk_live_x" },
    { STRIPE_SECRET_KEY: "rk_live_x" },
    { NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_x" },
    { NEXT_PUBLIC_SUPABASE_URL: `https://${refProd}.supabase.co` },
    { NEXT_PUBLIC_SUPABASE_URL: `https://${refProd}.supabase.co`, FUT10_SUPABASE_REF_TEST: refProd },
    { NEXT_PUBLIC_SUPABASE_URL: "https://zzzzzzzzzzzzzzzzzzzz.supabase.co" },
    { RESEND_API_KEY: "re_vraie" },
    { RESEND_API_KEY: undefined },
    { NEXT_PUBLIC_POSTHOG_HOST: "https://eu.i.posthog.com" },
    { DOSSIER_NARRATIVE: "true" },
  ];
  for (const c of cas) assert.equal(diagnostiquer({ ...isole, ...c }, new Set([refProd])).ok, false, JSON.stringify(c));
  // Un projet distant explicitement déclaré de test, et absent des fichiers de production, est accepté.
  assert.equal(diagnostiquer({ ...isole, NEXT_PUBLIC_SUPABASE_URL: "https://yyyyyyyyyyyyyyyyyyyy.supabase.co", FUT10_SUPABASE_REF_TEST: "yyyyyyyyyyyyyyyyyyyy" }, new Set([refProd])).ok, true);
});

test("schéma de test : seules deux adaptations, dites, et aucun fichier de supabase/ modifié", async () => {
  const { migrationsDeTest, OMIS } = await import("../../scripts/integration/schema-de-test.mjs");
  const m = migrationsDeTest() as { fichier: string; sql: string }[];
  assert.deepEqual([...OMIS], ["02_init_qna.sql"]);
  assert.equal(m.at(-1)!.fichier, "38_purge_dossier_intents.sql");
  assert.ok(m.findIndex((x) => x.fichier.startsWith("37_")) < m.findIndex((x) => x.fichier.startsWith("38_")));
  assert.ok(m.every((x) => !x.fichier.includes("_down")));
  const m25 = m.find((x) => x.fichier === "25_address_dossiers.sql")!;
  assert.match(m25.sql, /if false then -- contrôle de production neutralisé/);
  assert.match(lire("supabase/25_address_dossiers.sql"), /if n <> 24 then/);
  for (const x of m) if (x.fichier !== "25_address_dossiers.sql") assert.equal(x.sql, lire(`supabase/${x.fichier}`));
});
