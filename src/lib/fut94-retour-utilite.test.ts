// FUT-94 · LE RETOUR D'UTILITÉ EN FIN DE DOSSIER : CE QUI EST ENREGISTRÉ, À QUEL DOSSIER, ET CE QU'UN
// NOUVEL ENVOI REMPLACE.
//
// La logique de la route (`enregistrerRetourUtilite`) contre un stockage simulé qui reproduit la
// contrainte d'unicité de la migration 39 et la sémantique d'upsert de PostgREST (seules les colonnes
// envoyées sont mises à jour). Les droits sont ceux de deux comptes distincts.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  enregistrerRetourUtilite, normaliserCommentaire, cleDePortee, lireLigneRetour, longueurCommentaire,
  MAX_COMMENTAIRE, QUESTION_UTILITE, QUESTION_COMMENTAIRE, LIBELLE_REPONSE, REPONSES_UTILITE,
  type DepsRetourUtilite, type LigneRetourUtilite,
} from "./retour-utilite.ts";

const ALICE = "11111111-1111-4111-8111-111111111111";
const BOB = "22222222-2222-4222-8222-222222222222";
const DOSSIER_ALICE = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const DOSSIER_ALICE_2 = "abababab-abab-4bab-8bab-abababababab";
const DOSSIER_BOB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const NANTES = "44109";

/** La base simulée : une ligne par (user_id, insee_code, scope_key), upsert des seules colonnes envoyées. */
function base() {
  const lignes = new Map<string, Record<string, unknown>>();
  const ecritures: LigneRetourUtilite[] = [];
  let horloge = 0;
  const ecrire = async (l: LigneRetourUtilite) => {
    ecritures.push(l);
    const k = `${l.user_id}|${l.insee_code}|${l.scope_key}`;
    const avant = lignes.get(k);
    const apres = { comment: null, commented_at: null, created_at: `t${horloge++}`, ...avant, ...l };
    // Les contraintes de la table : la base refuse ce que la migration refuse.
    if (apres.comment !== null && (typeof apres.comment !== "string" || [...apres.comment].length > 2000 || apres.comment === "")) return null;
    if ((apres.comment === null) !== (apres.commented_at === null)) return null;
    if (apres.answer === "pas_encore_lu" && apres.comment !== null) return null; // dossier_utility_feedback_non_lu_ck
    lignes.set(k, apres);
    return lireLigneRetour(apres);
  };
  return { lignes, ecritures, ecrire };
}

/** Les droits : Alice a Nantes et deux biens à Nantes ; Bob a Lyon (3e) et un bien. */
function deps(userId: string, b: ReturnType<typeof base>, extra: Partial<DepsRetourUtilite> = {}): DepsRetourUtilite {
  const dossiers: Record<string, { id: string; insee: string; user: string }> = {
    [DOSSIER_ALICE]: { id: DOSSIER_ALICE, insee: NANTES, user: ALICE },
    [DOSSIER_ALICE_2]: { id: DOSSIER_ALICE_2, insee: NANTES, user: ALICE },
    [DOSSIER_BOB]: { id: DOSSIER_BOB, insee: "69383", user: BOB },
  };
  const communes: Record<string, string[]> = { [ALICE]: [NANTES], [BOB]: ["69123"] };
  return {
    now: new Date("2026-11-09T10:00:00.000Z"),
    userId,
    // Comme `getDossier` sous RLS : un dossier d'un autre compte est INVISIBLE, pas « interdit ».
    lireDossier: async (id) => (dossiers[id]?.user === userId ? { id, insee: dossiers[id].insee } : null),
    communeOuverte: async (insee) => (communes[userId] ?? []).includes(insee),
    versionServie: async (_insee, scope) => (scope === "commune" ? 2 : null),
    ecrire: b.ecrire,
    ...extra,
  };
}

test("le texte de l'écran est celui du ticket, mot pour mot", () => {
  assert.equal(QUESTION_UTILITE, "Cette analyse vous a-t-elle appris quelque chose d'utile pour votre recherche ?");
  assert.equal(QUESTION_COMMENTAIRE, "Quoi, ou qu'est-ce qui vous a manqué ?");
  assert.deepEqual(REPONSES_UTILITE.map((r) => LIBELLE_REPONSE[r]), ["Oui", "Pas vraiment", "Pas encore lu"]);
});

test("les trois réponses s'enregistrent, chacune sous sa valeur propre, sans commentaire", async () => {
  for (const answer of REPONSES_UTILITE) {
    const b = base();
    const r = await enregistrerRetourUtilite({ insee: NANTES, answer }, deps(ALICE, b));
    assert.equal(r.status, 200);
    assert.deepEqual(r.body, { ok: true, retour: { answer, comment: null } });
    assert.equal(b.lignes.size, 1);
    assert.equal(b.ecritures[0].answer, answer);
    if (answer === "pas_encore_lu") {
      assert.equal(b.ecritures[0].comment, null, "« pas encore lu » efface toujours le commentaire");
      assert.equal(b.ecritures[0].commented_at, null);
    } else {
      assert.equal("comment" in b.ecritures[0], false, "sans clé `comment`, la colonne n'est pas envoyée");
    }
  }
  // « Pas vraiment » et « Pas encore lu » ne se confondent jamais.
  assert.notEqual(LIBELLE_REPONSE.pas_vraiment, LIBELLE_REPONSE.pas_encore_lu);
});

test("une réponse invalide, une commune invalide, un dossier mal formé : refus, rien n'est écrit", async () => {
  const b = base();
  for (const corps of [
    { insee: NANTES, answer: "peut-etre" }, { insee: NANTES }, { insee: NANTES, answer: "Oui" },
    { insee: "Nantes", answer: "oui" }, { answer: "oui" },
    { insee: NANTES, answer: "oui", dossierId: "pas-un-uuid" }, { insee: NANTES, answer: "oui", dossierId: 42 },
    null, "oui",
  ]) {
    const r = await enregistrerRetourUtilite(corps, deps(ALICE, b));
    assert.equal(r.status, 400, JSON.stringify(corps));
  }
  assert.equal(b.ecritures.length, 0);
});

test("le commentaire facultatif : enregistré nettoyé, daté ; vide vaut absent ; jamais tronqué", async () => {
  const b = base();
  const r = await enregistrerRetourUtilite({ insee: NANTES, answer: "pas_vraiment", comment: "  Le bruit la nuit.  " }, deps(ALICE, b));
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { ok: true, retour: { answer: "pas_vraiment", comment: "Le bruit la nuit." } });
  assert.equal(b.ecritures[0].commented_at, "2026-11-09T10:00:00.000Z");

  assert.deepEqual(normaliserCommentaire("   "), { ok: true, valeur: null });
  assert.deepEqual(normaliserCommentaire(null), { ok: true, valeur: null });
  assert.deepEqual(normaliserCommentaire(12), { ok: false, raison: "invalide" });
  // La borne compte comme le lecteur et comme Postgres : un emoji vaut un caractère.
  assert.equal(longueurCommentaire("😀".repeat(MAX_COMMENTAIRE)), MAX_COMMENTAIRE);
  assert.deepEqual(normaliserCommentaire("😀".repeat(MAX_COMMENTAIRE)), { ok: true, valeur: "😀".repeat(MAX_COMMENTAIRE) });
  assert.deepEqual(normaliserCommentaire("a".repeat(MAX_COMMENTAIRE + 1)), { ok: false, raison: "trop_long" });

  const b2 = base();
  const trop = await enregistrerRetourUtilite({ insee: NANTES, answer: "oui", comment: "a".repeat(MAX_COMMENTAIRE + 1) }, deps(ALICE, b2));
  assert.equal(trop.status, 400);
  assert.equal((trop.body as { code: string }).code, "commentaire_trop_long");
  assert.equal(b2.ecritures.length, 0, "refusé, pas coupé");
});

test("une réponse par compte et par dossier : la suivante REMPLACE, le commentaire est gardé sauf à l'effacer", async () => {
  const b = base();
  const D = deps(ALICE, b);
  await enregistrerRetourUtilite({ insee: NANTES, answer: "pas_encore_lu" }, D);
  const premiere = b.lignes.get(`${ALICE}|${NANTES}|commune`)!.created_at;
  await enregistrerRetourUtilite({ insee: NANTES, answer: "pas_vraiment", comment: "Rien sur les écoles." }, D);
  // Changer la réponse sans clé `comment` garde le commentaire enregistré.
  const r = await enregistrerRetourUtilite({ insee: NANTES, answer: "oui" }, D);
  assert.deepEqual(r.body, { ok: true, retour: { answer: "oui", comment: "Rien sur les écoles." } });
  assert.equal(b.lignes.size, 1, "toujours une seule ligne");
  assert.equal(b.lignes.get(`${ALICE}|${NANTES}|commune`)!.created_at, premiere, "la date de la première réponse ne bouge pas");
  // `comment: null` (ou un champ vidé) l'efface, et sa date avec lui.
  const e = await enregistrerRetourUtilite({ insee: NANTES, answer: "oui", comment: "" }, D);
  assert.deepEqual(e.body, { ok: true, retour: { answer: "oui", comment: null } });
  assert.equal(b.lignes.get(`${ALICE}|${NANTES}|commune`)!.commented_at, null);
});

test("transitions : le commentaire reste entre « Oui » et « Pas vraiment », part avec sa date sur « Pas encore lu »", async () => {
  const b = base();
  const D = deps(ALICE, b);
  const ligne = () => b.lignes.get(`${ALICE}|${NANTES}|commune`)!;
  await enregistrerRetourUtilite({ insee: NANTES, answer: "oui", comment: "La carte des écoles." }, D);
  const date = ligne().commented_at;
  assert.equal(date, "2026-11-09T10:00:00.000Z");
  // Oui → Pas vraiment → Oui : le commentaire et SA date sont gardés.
  for (const answer of ["pas_vraiment", "oui"] as const) {
    const r = await enregistrerRetourUtilite({ insee: NANTES, answer }, { ...D, now: new Date("2026-11-10T08:00:00.000Z") });
    assert.deepEqual(r.body, { ok: true, retour: { answer, comment: "La carte des écoles." } });
    assert.equal(ligne().commented_at, date, "la date du commentaire ne bouge pas quand seule la réponse change");
  }
  // → Pas encore lu : effacé, date comprise, même si le corps porte un commentaire.
  const nonLu = await enregistrerRetourUtilite({ insee: NANTES, answer: "pas_encore_lu", comment: "texte forcé" }, D);
  assert.deepEqual(nonLu.body, { ok: true, retour: { answer: "pas_encore_lu", comment: null } });
  assert.equal(ligne().comment, null);
  assert.equal(ligne().commented_at, null);
  // Pas encore lu → Oui : rien ne ressuscite ; un nouveau commentaire se donne de nouveau.
  const relu = await enregistrerRetourUtilite({ insee: NANTES, answer: "oui" }, D);
  assert.deepEqual(relu.body, { ok: true, retour: { answer: "oui", comment: null } });
  const recommente = await enregistrerRetourUtilite({ insee: NANTES, answer: "pas_vraiment", comment: "Rien sur le bruit." }, D);
  assert.deepEqual(recommente.body, { ok: true, retour: { answer: "pas_vraiment", comment: "Rien sur le bruit." } });
  assert.equal(b.lignes.size, 1);
});

test("double clic, envoi rejoué : la même ligne, jamais deux", async () => {
  const b = base();
  const D = deps(ALICE, b);
  await Promise.all([1, 2, 3].map(() => enregistrerRetourUtilite({ insee: NANTES, answer: "oui", dossierId: DOSSIER_ALICE }, D)));
  assert.equal(b.lignes.size, 1);
  assert.equal(b.ecritures.length, 3, "trois envois, une ligne : l'idempotence est dans la clé, pas dans la chance");
});

test("le rattachement : la clé de l'artefact, la commune au grain de l'artefact, le bien par sa clé étrangère", async () => {
  const b = base();
  await enregistrerRetourUtilite({ insee: NANTES, answer: "oui" }, deps(ALICE, b));
  await enregistrerRetourUtilite({ insee: NANTES, answer: "pas_vraiment", dossierId: DOSSIER_ALICE }, deps(ALICE, b));
  await enregistrerRetourUtilite({ insee: NANTES, answer: "pas_encore_lu", dossierId: DOSSIER_ALICE_2 }, deps(ALICE, b));
  assert.deepEqual(
    b.ecritures.map((l) => [l.scope_key, l.address_dossier_id, l.answer]),
    [
      ["commune", null, "oui"],
      [`logement:${DOSSIER_ALICE}`, DOSSIER_ALICE, "pas_vraiment"],
      [`logement:${DOSSIER_ALICE_2}`, DOSSIER_ALICE_2, "pas_encore_lu"],
    ],
    "deux biens du même immeuble ou de la même commune : deux dossiers, deux retours",
  );
  assert.equal(b.lignes.size, 3);
  assert.equal(cleDePortee(null), "commune");
  assert.equal(cleDePortee(DOSSIER_ALICE), `logement:${DOSSIER_ALICE}`);

  // Lyon 3e : l'arrondissement s'enregistre sous la commune, comme son artefact.
  const bb = base();
  const r = await enregistrerRetourUtilite({ insee: "69383", answer: "oui", dossierId: DOSSIER_BOB }, deps(BOB, bb));
  assert.equal(r.status, 200);
  assert.equal(bb.ecritures[0].insee_code, "69123");
});

test("isolation entre comptes : le dossier ou la commune d'un autre est refusé, et rien ne s'écrit", async () => {
  const b = base();
  // Bob vise le bien d'Alice, en déclarant la commune qu'il possède… ou celle d'Alice.
  for (const corps of [
    { insee: "69123", answer: "oui", dossierId: DOSSIER_ALICE },
    { insee: NANTES, answer: "oui", dossierId: DOSSIER_ALICE },
    { insee: NANTES, answer: "oui" },
  ]) {
    const r = await enregistrerRetourUtilite(corps, deps(BOB, b));
    assert.equal(r.status, 403, JSON.stringify(corps));
  }
  // Alice vise son propre bien en déclarant une autre commune : la commune du bien fait foi.
  const r = await enregistrerRetourUtilite({ insee: "69123", answer: "oui", dossierId: DOSSIER_ALICE }, deps(ALICE, b));
  assert.equal(r.status, 403);
  assert.equal(b.ecritures.length, 0);
  // Et le user_id écrit est toujours celui de la session, jamais un champ du corps.
  const b2 = base();
  await enregistrerRetourUtilite({ insee: NANTES, answer: "oui", user_id: BOB, userId: BOB }, deps(ALICE, b2));
  assert.equal(b2.ecritures[0].user_id, ALICE);
});

test("ce que la ligne porte, et rien d'autre : ni adresse, ni projet ; version lue côté serveur, présentation bornée", async () => {
  const b = base();
  await enregistrerRetourUtilite({
    insee: NANTES, answer: "oui", dossierId: DOSSIER_ALICE,
    adresse: "3 rue de la Paix, Nantes", project: { rawText: "Acheter un T3" }, presentation: "releve", artifactVersion: 99,
  }, deps(ALICE, b));
  assert.deepEqual(Object.keys(b.ecritures[0]).sort(), [
    "address_dossier_id", "answer", "artifact_version", "insee_code", "presentation", "scope_key", "updated_at", "user_id",
  ]);
  assert.equal(b.ecritures[0].presentation, "releve", "la présentation que l'écran a reçue de /rapport");
  assert.equal(b.ecritures[0].artifact_version, null, "la version vient du serveur (aucune figée pour ce bien)");
  await enregistrerRetourUtilite({ insee: NANTES, answer: "oui", presentation: "<script>" }, deps(ALICE, b));
  assert.equal(b.ecritures[1].artifact_version, 2, "la version communale servie");
  assert.equal(b.ecritures[1].presentation, null, "hors des deux valeurs : null, jamais la chaîne reçue");
  // Une version illisible ou une lecture en panne n'empêche pas d'enregistrer.
  await enregistrerRetourUtilite({ insee: NANTES, answer: "oui" }, deps(ALICE, b, { versionServie: async () => { throw new Error("panne"); } }));
  assert.equal(b.ecritures[2].artifact_version, null);
});

test("panne du stockage : 503 explicite, jamais un faux succès", async () => {
  const r = await enregistrerRetourUtilite({ insee: NANTES, answer: "oui" }, deps(ALICE, base(), { ecrire: async () => null }));
  assert.equal(r.status, 503);
  const r2 = await enregistrerRetourUtilite({ insee: NANTES, answer: "oui" }, deps(ALICE, base(), { ecrire: async () => { throw new Error("réseau"); } }));
  assert.equal(r2.status, 503);
});

test("une ligne relue de la base est validée, jamais castée", () => {
  assert.deepEqual(lireLigneRetour({ answer: "oui", comment: "x" }), { answer: "oui", comment: "x" });
  assert.deepEqual(lireLigneRetour({ answer: "pas_encore_lu", comment: null }), { answer: "pas_encore_lu", comment: null });
  assert.equal(lireLigneRetour({ answer: "bof" }), null);
  assert.equal(lireLigneRetour(null), null);
});

// ── Les garanties qui vivent dans le SQL et dans le câblage, vérifiées sur leurs sources ──────────

const sql = readFileSync("supabase/39_retours_utilite_dossier.sql", "utf8").replace(/--.*$/gm, "");

test("migration 39 : RLS, lecture de ses seules lignes, aucune écriture pour les rôles exposés", () => {
  assert.match(sql, /alter table public\.dossier_utility_feedback enable row level security/);
  assert.match(sql, /revoke all on table public\.dossier_utility_feedback from anon, authenticated/);
  assert.match(sql, /grant select on table public\.dossier_utility_feedback to authenticated/);
  assert.doesNotMatch(sql, /grant (insert|update|delete|all)[^;]*dossier_utility_feedback/i);
  assert.doesNotMatch(sql, /create policy[^;]*for (insert|update|delete|all)/i, "aucune policy d'écriture");
  assert.match(sql, /for select\s+to authenticated\s+using \(auth\.uid\(\) = user_id\)/);
  assert.match(sql, /unique \(user_id, insee_code, scope_key\)/);
  assert.match(sql, /answer in \('oui', 'pas_vraiment', 'pas_encore_lu'\)/);
  assert.match(sql, /char_length\(comment\) between 1 and 2000/);
  assert.match(sql, /check \(answer <> 'pas_encore_lu' or comment is null\)/);
  // La purge de conservation : délais par défaut, réservée au service role.
  assert.match(sql, /p_delai_commentaire interval default interval '12 months'/);
  assert.match(sql, /p_delai_reponse\s+interval default interval '24 months'/);
  assert.match(sql, /revoke all on function public\.purger_retours_utilite\(interval, interval\) from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.purger_retours_utilite\(interval, interval\) to service_role/);
  assert.match(sql, /references public\.address_dossiers\(id\) on delete cascade/);
  assert.match(sql, /references auth\.users\(id\) on delete cascade/);
  // Ni adresse, ni projet, ni e-mail dans la table.
  assert.doesNotMatch(sql, /address_label|user_project|email|latitude|ban_id/);
  assert.match(readFileSync("supabase/39_retours_utilite_dossier_down.sql", "utf8"), /drop table if exists public\.dossier_utility_feedback/);
});

test("la route : session obligatoire, droits lus sous l'identité du lecteur, présentation jamais recalculée", () => {
  const route = readFileSync("src/app/api/dossier/retour-utilite/route.ts", "utf8");
  assert.match(route, /if \(!user\) return Response\.json\([^)]*\{ status: 401 \}\)/);
  assert.match(route, /getDossier\(supabase, user\.id, id\)/);
  assert.match(route, /loadTerritoryClaims\(supabase, user\.id\)/);
  assert.doesNotMatch(route, /presentationPour/, "résolue une seule fois, par /rapport (invariant A2)");
  assert.match(route, /userId: user\.id/);
  // Le service role n'est qu'au stockage, qui ne le rend jamais.
  assert.doesNotMatch(route, /SERVICE_ROLE/);
  const store = readFileSync("src/lib/server/retour-utilite-store.ts", "utf8");
  assert.match(store, /onConflict: "user_id,insee_code,scope_key"/);
  assert.doesNotMatch(store, /export (const|let) admin|export function client/);
});

test("la page : la question vient APRÈS le dossier et son geste de clôture, et s'efface si la lecture échoue", () => {
  const page = readFileSync("src/app/(account)/rapport/page.tsx", "utf8");
  const cloture = page.indexOf("<TrackedAddressCta commune={displayName}");
  const gesteVerdict = page.indexOf("heroContenu.kind === \"verdict\" && heroContenu.geste ? (");
  const retour = page.indexOf("<RetourUtilite");
  const projet = page.indexOf("<ProjectSummaryCard");
  assert.ok(cloture > 0 && gesteVerdict > cloture, "repères de la page retrouvés");
  assert.ok(retour > gesteVerdict && retour < projet, "après le dossier et ses gestes, avant « Votre projet »");
  assert.match(page, /\{retourUtilite && inseeCode \? \(/);
  assert.match(page, /\.catch\(\(error: unknown\) => \{[\s\S]{0,200}return null;/);
  assert.match(page, /presentation=\{presentation\}\s*\/>/);
  // Le bien lu est le bien de la lecture d'adresse, et seulement lui.
  assert.match(page, /const retourDossierId = dossier && communeResult && inseeCode && logementForCommune \? logementForCommune\.id : null;/);
});

// ── Le consentement à la mesure ─────────────────────────────────────────────────────────────

// Depuis FUT-181, le formulaire lit la règle UNIQUE (`mesureConsentie`, mesure-audience-regles.ts)
// au lieu d'une copie locale. Ces assertions, inchangées, fixent ce que FUT-94 attend de cette règle.
test("consentement : seule la valeur « granted » de la bannière autorise un nouvel événement", async () => {
  const { mesureConsentie: mesureAutorisee, CLE_CONSENTEMENT_MESURE: CLE_CONSENTEMENT } = await import("./mesure-audience-regles.ts");
  const stock = (v: string | null) => ({ getItem: (k: string) => (k === CLE_CONSENTEMENT ? v : null) });
  assert.equal(mesureAutorisee(stock("granted")), true);
  assert.equal(mesureAutorisee(stock("denied")), false);
  assert.equal(mesureAutorisee(stock(null)), false, "absent : non");
  assert.equal(mesureAutorisee(stock("GRANTED")), false);
  assert.equal(mesureAutorisee({ getItem: () => { throw new Error("SecurityError"); } }), false, "stockage bloqué : non");
  assert.equal(mesureAutorisee(), false, "hors navigateur : non");
  // La clé et les valeurs sont celles qu'écrit la bannière : si elle change, ce test casse.
  const banniere = readFileSync("src/components/ConsentBanner.tsx", "utf8");
  assert.match(banniere, new RegExp(`const STORAGE_KEY = "${CLE_CONSENTEMENT}";`));
  assert.match(banniere, /type ConsentValue = "granted" \| "denied";/);
  assert.match(banniere, /localStorage\.setItem\(STORAGE_KEY, value\)/);
});
