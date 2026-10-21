// « Vos lieux » (FUT-41, premier lot) : ce que chaque lieu a le droit de montrer, et comment il se lit.
// Fixtures anonymisées : communes publiques, adresses inventées, identifiants fictifs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { assemblerVosLieux, adresseCourte, cleArtefact, type BienPossede, type EntreeVosLieux } from "./vos-lieux.ts";
import { lireVosLieux } from "./vos-lieux-lecture.ts";
import { etatArtefact, type StoredArtifact } from "./decision-artifact.ts";
import { projetDeTest } from "./projet-de-test.ts";

const P1 = projetDeTest("faible_chaleur:3,vie_locale:2,acces_soins:2").projet;
const P2 = projetDeTest("faible_chaleur:3,vie_locale:3,acces_soins:2").projet; // un poids a changé

/** Un artefact minimal que le lecteur de production accepte (`parseDecisionArtifact`). */
function artefact(o: { texte: string; label?: string; tone?: string; scope?: "commune" | "commune+adresse"; projet?: unknown; date?: string; moteur?: string }) {
  return {
    schemaVersion: 1,
    generatedAt: o.date ?? "2026-09-21T10:00:00.000Z",
    engineVersion: o.moteur ?? "engine-6",
    conventionsVersion: "conv-test",
    projectSnapshot: o.projet ?? P1,
    dossier: {
      scope: o.scope ?? "commune", conclusion: "x", conclusionState: "ok",
      criteria: { registry: [], openConditions: [] }, sections: [], controlesTitle: "Contrôles", compositions: [], absorbedFacts: [],
      narrativePlan: { scope: o.scope ?? "commune", communeNom: "Commune", blocks: [], verdictLabel: o.label ?? "Arbitrage", verdictTone: o.tone ?? "caution", verdict: { headline: { text: o.texte } } },
    },
  };
}
/** L'état servi d'un scope, par la règle de production (`etatArtefact`). */
function servi(payload: unknown, version = 1): StoredArtifact {
  return etatArtefact([{ version, status: "ready", generatedAt: null, createdAt: null, payload }])!;
}
const bien = (id: string, insee: string, label: string, city: string, paye = true, cree = "2026-10-01T09:00:00.000Z"): BienPossede =>
  ({ id, insee, address_label: label, city, created_at: cree, stripe_payment_intent_id: paye ? "pi_test" : null });
const entree = (o: Partial<EntreeVosLieux>): EntreeVosLieux =>
  ({ biens: [], territoires: [], residence: { insee: null, commune: null }, artefacts: new Map(), projetActuel: P1, ...o });

const ID_A = "00000000-0000-4000-8000-00000000000a";
const ID_B = "00000000-0000-4000-8000-00000000000b";
const ID_C = "00000000-0000-4000-8000-00000000000c";

test("un territoire acheté seul : une commune, sa conclusion figée, la seule échelle Territoire", () => {
  const artefacts = new Map([[cleArtefact("30189", "commune"), servi(artefact({ texte: "Nîmes répond moins bien à une de vos priorités : des étés supportables." }))]]);
  const [l] = assemblerVosLieux(entree({ territoires: [{ insee: "30189", commune: "Nîmes", createdAt: "2026-09-21T10:00:00.000Z" }], artefacts }));
  assert.equal(l!.type, "commune");
  assert.equal(l!.commune, "Nîmes");
  assert.equal(l!.adresse, null);
  // Un dossier communal : la commune examinée (sans carte dans cette fixture), le reste hors périmètre.
  assert.deepEqual(l!.echelles, { territoire: "examinee", autour: "non_examinee", logement: "non_examinee" });
  assert.equal(l!.conclusion.etat, "disponible");
  assert.equal(l!.conclusion.etat === "disponible" && l!.conclusion.texte, "Nîmes répond moins bien à une de vos priorités : des étés supportables.");
  assert.equal(l!.principal.href, "/rapport/territoire?insee=30189");
  assert.equal(l!.acces, "achete");
});

test("un dossier d'adresse : trois échelles examinées, l'accès passe par la route d'ouverture", () => {
  const b = bien(ID_A, "30189", "1 rue d'Exemple 30000 Nîmes", "Nîmes");
  const artefacts = new Map([[cleArtefact("30189", `logement:${ID_A}`), servi(artefact({ texte: "Verdict A", scope: "commune+adresse" }))]]);
  const [l] = assemblerVosLieux(entree({ biens: [b], artefacts }));
  assert.deepEqual(l!.echelles, { territoire: "examinee", autour: "examinee", logement: "examinee" });
  assert.equal(l!.principal.href, `/rapport/dossiers/ouvrir?id=${ID_A}&vers=dossier`);
  assert.deepEqual(l!.parEchelle.map((e) => e.href.split("vers=")[1]), ["commune", "autour", "logement"]);
  assert.deepEqual(l!.parEchelle.map((e) => e.examinee), [true, true, true]);
});

test("un dossier d'adresse servi au périmètre commune ne prétend pas avoir lu l'adresse", () => {
  const b = bien(ID_A, "30189", "1 rue d'Exemple", "Nîmes");
  const artefacts = new Map([[cleArtefact("30189", `logement:${ID_A}`), servi(artefact({ texte: "V", scope: "commune" }))]]);
  const [l] = assemblerVosLieux(entree({ biens: [b], artefacts }));
  assert.deepEqual(l!.echelles, { territoire: "examinee", autour: "non_examinee", logement: "non_examinee" });
  // Les pages d'échelle restent ouvrables, mais chacune dit qu'elle n'a pas été examinée.
  assert.deepEqual(l!.parEchelle.map((e) => e.examinee), [true, false, false]);
});

test("deux adresses dans la même commune : deux lignes, deux conclusions, jamais fusionnées", () => {
  const biens = [bien(ID_A, "30189", "1 rue A", "Nîmes"), bien(ID_B, "30189", "2 rue B", "Nîmes")];
  const artefacts = new Map([
    [cleArtefact("30189", `logement:${ID_A}`), servi(artefact({ texte: "Conclusion de A", scope: "commune+adresse" }))],
    [cleArtefact("30189", `logement:${ID_B}`), servi(artefact({ texte: "Conclusion de B, différente", scope: "commune+adresse" }))],
  ]);
  const lieux = assemblerVosLieux(entree({ biens, artefacts }));
  assert.equal(lieux.length, 2);
  assert.deepEqual(lieux.map((l) => l.conclusion.etat === "disponible" ? l.conclusion.texte : null), ["Conclusion de A", "Conclusion de B, différente"]);
});

test("un rapport de territoire puis un dossier d'adresse dans la même commune : les deux conclusions restent trouvables", () => {
  const artefacts = new Map([
    [cleArtefact("30189", "commune"), servi(artefact({ texte: "Conclusion du rapport de territoire (14 €)" }))],
    [cleArtefact("30189", `logement:${ID_A}`), servi(artefact({ texte: "Conclusion du dossier d'adresse (25 €)", scope: "commune+adresse" }))],
  ]);
  const lieux = assemblerVosLieux(entree({
    biens: [bien(ID_A, "30189", "1 rue A 30000 Nîmes", "Nîmes", true, "2026-10-05T00:00:00.000Z")],
    territoires: [{ insee: "30189", commune: "Nîmes", createdAt: "2026-09-01T00:00:00.000Z" }],
    artefacts,
  }));
  // Regroupés par commune : le rapport de territoire d'abord, puis l'adresse.
  assert.deepEqual(lieux.map((l) => [l.type, l.conclusion.etat === "disponible" && l.conclusion.texte, l.principal.href]), [
    ["commune", "Conclusion du rapport de territoire (14 €)", "/rapport/territoire?insee=30189"],
    ["adresse", "Conclusion du dossier d'adresse (25 €)", `/rapport/dossiers/ouvrir?id=${ID_A}&vers=dossier`],
  ]);
  assert.equal(lieux[1]!.adresse, "1 rue A");
});

test("l'adresse ne répète pas le code postal ni la commune déjà affichés", () => {
  assert.equal(adresseCourte("12 rue des Sternes 30000 Nîmes", "Nîmes"), "12 rue des Sternes");
  assert.equal(adresseCourte("8 rue d'Exemple, 75018 Paris", "Paris"), "8 rue d'Exemple");
  assert.equal(adresseCourte("Lieu-dit Kerlavan", "Port-Anvel"), "Lieu-dit Kerlavan");
  assert.equal(adresseCourte("30000 Nîmes", "Nîmes"), "30000 Nîmes");
});

test("une V2 prête après une V1 échouée ne prouve pas une actualisation antérieure", () => {
  const historique = [
    { version: 1, status: "failed" as const, generatedAt: null, createdAt: null, payload: null },
    { version: 2, status: "ready" as const, generatedAt: null, createdAt: null, payload: artefact({ texte: "Première analyse réussie" }) },
  ];
  const avant = structuredClone(historique);
  const stocke = etatArtefact(historique)!;
  const [l] = assemblerVosLieux(entree({ biens: [bien(ID_A, "30189", "1 rue A", "Nîmes")], artefacts: new Map([[cleArtefact("30189", `logement:${ID_A}`), stocke]]) }));
  assert.equal(l!.conclusion.etat, "disponible");
  if (l!.conclusion.etat !== "disponible") throw new Error("analyse absente");
  assert.equal(l!.conclusion.version, 2);
  assert.equal(l!.conclusion.texte, "Première analyse réussie");
  assert.equal(l!.conclusion.generatedAt, "2026-09-21T10:00:00.000Z");
  assert.equal("miseAJour" in l!.conclusion, false);
  assert.deepEqual(historique, avant, "l'historique reste intact");
});

test("une conclusion dépassée par le projet oriente vers la mise à jour proposée dans le dossier", () => {
  const artefacts = new Map([[cleArtefact("30189", `logement:${ID_A}`), servi(artefact({ texte: "T", projet: P1 }))]]);
  const [l] = assemblerVosLieux(entree({ biens: [bien(ID_A, "30189", "1 rue A", "Nîmes")], artefacts, projetActuel: P2 }));
  assert.equal(l!.principal.label, "Ouvrir le dossier pour le mettre à jour");
  assert.equal(l!.principal.href, `/rapport/dossiers/ouvrir?id=${ID_A}&vers=dossier`);
});

test("plusieurs dossiers sur des communes différentes : chacun lit son propre artefact", () => {
  const biens = [bien(ID_A, "30189", "1 rue A", "Nîmes"), bien(ID_B, "34172", "3 rue C", "Montpellier")];
  const artefacts = new Map([
    [cleArtefact("30189", `logement:${ID_A}`), servi(artefact({ texte: "Nîmes A" }))],
    [cleArtefact("34172", `logement:${ID_B}`), servi(artefact({ texte: "Montpellier B" }))],
  ]);
  const lieux = assemblerVosLieux(entree({ biens, artefacts }));
  assert.deepEqual(lieux.map((l) => [l.inseeCommune, l.conclusion.etat === "disponible" && l.conclusion.texte]).sort(), [["30189", "Nîmes A"], ["34172", "Montpellier B"]]);
});

test("la résidence sans droit reste une lecture gratuite, même si un artefact existait pour la commune", () => {
  const artefacts = new Map([[cleArtefact("17300", "commune"), servi(artefact({ texte: "Ne doit pas apparaître" }))]]);
  const lieux = assemblerVosLieux(entree({ residence: { insee: "17300", commune: "La Rochelle" }, artefacts }));
  assert.equal(lieux.length, 1);
  assert.equal(lieux[0]!.type, "residence");
  assert.equal(lieux[0]!.conclusion.etat, "lecture_gratuite");
  assert.equal(lieux[0]!.principal.href, "/rapport/residence");
  assert.ok(!JSON.stringify(lieux).includes("Ne doit pas apparaître"));
});

test("la résidence couverte par un droit n'est pas listée deux fois, et le lieu acheté le dit", () => {
  const artefacts = new Map([[cleArtefact("17300", "commune"), servi(artefact({ texte: "La Rochelle, achetée" }))]]);
  const lieux = assemblerVosLieux(entree({ residence: { insee: "17300", commune: "La Rochelle" }, territoires: [{ insee: "17300", commune: "La Rochelle", createdAt: "2026-09-01T00:00:00.000Z" }], artefacts }));
  assert.equal(lieux.length, 1);
  assert.equal(lieux[0]!.type, "commune");
  assert.equal(lieux[0]!.estResidence, true);
});

test("l'emblème suit la lecture du Relevé : une échelle avec constats n'est pas une échelle examinée sans constat", () => {
  // Une carte de la forme réelle d'un dossier (Nîmes, accès aux soins), au grain commune.
  const carte = { kind: "fact", fact: { id: "30189:alignment-acces_soins", ruleId: "territoire.alignment-acces_soins", sourceFactIds: ["relativePosition.acces_soins"], module: "territoire", role: "alignment", projectKey: "acces_soins", materialityTier: "secondary", topic: "l'accès aux soins", headlineSubject: "l'accès aux soins", statement: "Pour l'accès aux soins, la commune se situe parmi les 20 % de communes où il est le plus favorable.", faceStatement: "Parmi les 20 % de communes où il est le plus favorable", basis: { kind: "relative_position", rankLow: 0.8451, rankHigh: 0.855, universe: "communes_france", distributionVersion: "mismatch-dist-2026-07-15" }, evidence: [{ factId: "relativePosition.acces_soins", module: "territoire", label: "Territoire · Nîmes", grain: "commune", href: "/rapport/quartier" }] } };
  const a = artefact({ texte: "Avec un constat", scope: "commune+adresse" }) as { dossier: { sections: unknown[] } };
  a.dossier.sections = [{ key: "alignments", title: "Ce qui correspond", cards: [carte] }];
  // La minute que le verdict annonce : c'est elle que le Relevé affiche, et donc compte.
  (a.dossier as unknown as { narrativePlan: { minute: string[] } }).narrativePlan.minute = ["30189:alignment-acces_soins"];
  const [l] = assemblerVosLieux(entree({ biens: [bien(ID_A, "30189", "1 rue A", "Nîmes")], artefacts: new Map([[cleArtefact("30189", `logement:${ID_A}`), servi(a)]]) }));
  assert.deepEqual(l!.echelles, { territoire: "constats", autour: "examinee", logement: "examinee" });
});

test("un dossier sans artefact : un état explicite, rien n'est recomposé", () => {
  const [l] = assemblerVosLieux(entree({ biens: [bien(ID_A, "30189", "1 rue A", "Nîmes")] }));
  assert.equal(l!.conclusion.etat, "absente");
  assert.deepEqual(l!.echelles, { territoire: "inconnue", autour: "inconnue", logement: "inconnue" });
  // L'inconnu n'est pas présenté comme « non examiné » : aucune échelle n'est déclarée lue ou non lue.
  assert.deepEqual(l!.parEchelle.map((e) => e.examinee), [null, null, null]);
});

test("une conclusion ancienne garde son texte d'origine et se dit dépassée par le Projet", () => {
  const texte = "Exemple répond à votre projet, avec un compromis : une gare à moins de 20 min.";
  const artefacts = new Map([[cleArtefact("30189", `logement:${ID_A}`), servi(artefact({ texte, projet: P1 }))]]);
  const [l] = assemblerVosLieux(entree({ biens: [bien(ID_A, "30189", "1 rue A", "Nîmes")], artefacts, projetActuel: P2 }));
  assert.equal(l!.conclusion.etat === "disponible" && l!.conclusion.texte, texte);
  assert.equal(l!.conclusion.etat === "disponible" && l!.conclusion.actualite, "projet_change");
  // Même Projet : à jour. Pas de Projet actuel : on ne sait pas.
  assert.equal((assemblerVosLieux(entree({ biens: [bien(ID_A, "30189", "1 rue A", "Nîmes")], artefacts, projetActuel: P1 }))[0]!.conclusion as { actualite: string }).actualite, "a_jour");
  assert.equal((assemblerVosLieux(entree({ biens: [bien(ID_A, "30189", "1 rue A", "Nîmes")], artefacts, projetActuel: null }))[0]!.conclusion as { actualite: string }).actualite, "inconnue");
});

test("une version plus récente en préparation : la version servie reste affichée, et le dit", () => {
  const stocke = etatArtefact([
    { version: 2, status: "generating", generatedAt: null, createdAt: "2026-10-20T10:00:00.000Z", payload: null },
    { version: 1, status: "ready", generatedAt: null, createdAt: null, payload: artefact({ texte: "Version 1" }) },
  ])!;
  const [l] = assemblerVosLieux(entree({ biens: [bien(ID_A, "30189", "1 rue A", "Nîmes")], artefacts: new Map([[cleArtefact("30189", `logement:${ID_A}`), stocke]]) }));
  assert.equal(l!.conclusion.etat === "disponible" && l!.conclusion.version, 1);
  assert.equal(l!.conclusion.etat === "disponible" && l!.conclusion.tentativePlusRecente, "en_preparation");
});

test("Paris : deux droits d'arrondissement donnent une seule commune, un bien parisien lit sa clé communale", () => {
  const lieux = assemblerVosLieux(entree({ territoires: [
    { insee: "75118", commune: "Paris", createdAt: "2026-09-02T00:00:00.000Z" },
    { insee: "75111", commune: "Paris", createdAt: "2026-09-01T00:00:00.000Z" },
  ] }));
  assert.equal(lieux.length, 1);
  assert.equal(lieux[0]!.inseeCommune, "75056");
  const artefacts = new Map([[cleArtefact("75118", `logement:${ID_C}`), servi(artefact({ texte: "Paris 18e" }))]]);
  assert.equal(cleArtefact("75118", "x"), "75056|x");
  const [l] = assemblerVosLieux(entree({ biens: [bien(ID_C, "75118", "1 rue D 75018 Paris", "Paris")], artefacts }));
  assert.equal(l!.conclusion.etat === "disponible" && l!.conclusion.texte, "Paris 18e");
});

test("Corse : un code 2A se lit tel quel", () => {
  const [l] = assemblerVosLieux(entree({ territoires: [{ insee: "2A004", commune: "Ajaccio", createdAt: "2026-09-01T00:00:00.000Z" }] }));
  assert.equal(l!.principal.href, "/rapport/territoire?insee=2A004");
  assert.equal(l!.inseeCommune, "2A004");
});

test("un dossier ouvert par futur•e sans paiement se dit ouvert, pas acheté", () => {
  assert.equal(assemblerVosLieux(entree({ biens: [bien(ID_A, "30189", "1 rue A", "Nîmes", false)] }))[0]!.acces, "ouvert");
});

// ── LA LECTURE, SUR UNE BASE SIMULÉE ─────────────────────────────────────────────────────────
// Une base en mémoire qui applique les filtres demandés, et un journal de chaque requête : on vérifie
// que tout est filtré par compte, que rien n'est écrit, et le nombre de lectures.

type Ligne = Record<string, unknown>;
function baseSimulee(tables: Record<string, Ligne[]>) {
  const journal: { table: string; filtres: string[]; ecriture: boolean }[] = [];
  const from = (table: string) => {
    const filtres: ((l: Ligne) => boolean)[] = [];
    const noms: string[] = [];
    let unique = false;
    const entree = { table, filtres: noms, ecriture: false };
    journal.push(entree);
    const executer = () => {
      const data = (tables[table] ?? []).filter((l) => filtres.every((f) => f(l)));
      return Promise.resolve({ data: unique ? data[0] ?? null : data, error: null });
    };
    const q: Record<string, unknown> = {
      select: () => q,
      eq: (c: string, v: unknown) => { noms.push(`eq:${c}`); filtres.push((l) => l[c] === v); return q; },
      is: (c: string, v: unknown) => { noms.push(`is:${c}`); filtres.push((l) => (l[c] ?? null) === v); return q; },
      in: (c: string, vs: unknown[]) => { noms.push(`in:${c}`); filtres.push((l) => vs.includes(l[c])); return q; },
      or: (expr: string) => {
        noms.push("or");
        const groupes = [...expr.matchAll(/and\(insee_code\.eq\."([^"]+)",scope_key\.eq\."([^"]+)",version\.eq\.(\d+)\)/g)].map((m) => [m[1], m[2], Number(m[3])]);
        filtres.push((l) => groupes.some(([i, s, v]) => l.insee_code === i && l.scope_key === s && l.version === v));
        return q;
      },
      order: () => q,
      range: () => q,
      limit: () => q,
      maybeSingle: () => { unique = true; return executer(); },
      update: () => { entree.ecriture = true; return q; },
      insert: () => { entree.ecriture = true; return q; },
      delete: () => { entree.ecriture = true; return q; },
      then: (ok: (r: unknown) => unknown, ko: (e: unknown) => unknown) => executer().then(ok, ko),
    };
    return q;
  };
  return { sb: { from } as never, journal };
}

const USER_A = "user-a", USER_B = "user-b";
function tablesDeDeuxComptes() {
  return {
    user_profiles: [
      { user_id: USER_A, home_insee_code: "17300", home_commune: "La Rochelle", user_project: P2 },
      { user_id: USER_B, home_insee_code: "30189", home_commune: "Nîmes", user_project: P1 },
    ],
    address_dossiers: [
      { id: ID_A, user_id: USER_A, insee: "30189", address_label: "1 rue A", city: "Nîmes", created_at: "2026-10-02T00:00:00.000Z", stripe_payment_intent_id: "pi_a", access_revoked_at: null },
      { id: ID_C, user_id: USER_A, insee: "30189", address_label: "9 rue Révoquée", city: "Nîmes", created_at: "2026-10-03T00:00:00.000Z", stripe_payment_intent_id: "pi_c", access_revoked_at: "2026-10-10T00:00:00.000Z" },
      { id: ID_B, user_id: USER_B, insee: "30189", address_label: "2 rue de B", city: "Nîmes", created_at: "2026-10-04T00:00:00.000Z", stripe_payment_intent_id: "pi_b", access_revoked_at: null },
    ],
    report_grants: [
      { user_id: USER_A, insee: "34172", commune: "Montpellier", created_at: "2026-09-10T00:00:00.000Z" },
      { user_id: USER_B, insee: "13055", commune: "Marseille", created_at: "2026-09-11T00:00:00.000Z" },
    ],
    decision_artifact: [
      { user_id: USER_A, insee_code: "30189", scope_key: `logement:${ID_A}`, version: 1, status: "ready", generated_at: "2026-09-19T10:00:00.000Z", created_at: null, payload: artefact({ texte: "Conclusion du compte A, gare à 20 min", projet: P1, scope: "commune+adresse" }) },
      { user_id: USER_A, insee_code: "30189", scope_key: `logement:${ID_C}`, version: 1, status: "ready", generated_at: null, created_at: null, payload: artefact({ texte: "Dossier révoqué" }) },
      { user_id: USER_A, insee_code: "34172", scope_key: "commune", version: 1, status: "ready", generated_at: null, created_at: null, payload: artefact({ texte: "Montpellier, v1" }) },
      { user_id: USER_A, insee_code: "34172", scope_key: "commune", version: 2, status: "ready", generated_at: null, created_at: null, payload: artefact({ texte: "Montpellier, v2" }) },
      { user_id: USER_B, insee_code: "30189", scope_key: `logement:${ID_B}`, version: 1, status: "ready", generated_at: null, created_at: null, payload: artefact({ texte: "Conclusion du compte B" }) },
      { user_id: USER_B, insee_code: "13055", scope_key: "commune", version: 1, status: "ready", generated_at: null, created_at: null, payload: artefact({ texte: "Marseille de B" }) },
    ],
  };
}
const pasDeRepli = async () => { throw new Error("aucun repli attendu"); };

test("lecture : deux comptes, aucune fuite ; le dossier révoqué disparaît ; la dernière version prête est servie", async () => {
  const { sb, journal } = baseSimulee(tablesDeDeuxComptes());
  const lieux = await lireVosLieux(sb, USER_A, pasDeRepli);
  const texte = JSON.stringify(lieux);
  for (const fuite of ["Conclusion du compte B", "Marseille", "2 rue de B", "Dossier révoqué", "9 rue Révoquée"]) assert.ok(!texte.includes(fuite), fuite);
  assert.deepEqual(lieux.map((l) => l.adresse ?? l.commune), ["1 rue A", "Montpellier", "La Rochelle"]);
  assert.equal(lieux[0]!.conclusion.etat === "disponible" && lieux[0]!.conclusion.texte, "Conclusion du compte A, gare à 20 min");
  assert.equal(lieux[0]!.conclusion.etat === "disponible" && lieux[0]!.conclusion.actualite, "projet_change");
  assert.equal(lieux[1]!.conclusion.etat === "disponible" && lieux[1]!.conclusion.texte, "Montpellier, v2");
  assert.equal(lieux[2]!.type, "residence");
  // Chaque requête porte le compte ; aucune n'écrit ; cinq lectures pour trois lieux (pas une par lieu).
  for (const r of journal) assert.ok(r.filtres.includes("eq:user_id"), `${r.table} sans filtre de compte`);
  assert.ok(journal.every((r) => !r.ecriture));
  assert.equal(journal.length, 5);
  const contenus = journal.filter((r) => r.table === "decision_artifact" && r.filtres.includes("or"));
  assert.equal(contenus.length, 1, "un seul aller pour tous les contenus");
});

test("lecture : un compte sans rien reçoit une liste vide, sans lire les artefacts", async () => {
  const { sb, journal } = baseSimulee({ user_profiles: [{ user_id: "vide", home_insee_code: null, home_commune: null, user_project: null }], address_dossiers: [], report_grants: [], decision_artifact: [] });
  assert.deepEqual(await lireVosLieux(sb, "vide", pasDeRepli), []);
  assert.ok(!journal.some((r) => r.table === "decision_artifact"));
});

test("lecture : une version candidate illisible passe la main à la relecture paginée du hub", async () => {
  const tables = tablesDeDeuxComptes();
  tables.decision_artifact = tables.decision_artifact.filter((l) => l.user_id === USER_A && l.scope_key === "commune");
  tables.decision_artifact[1]!.payload = { corrompu: true };
  const { sb } = baseSimulee(tables);
  let appels = 0;
  const lieux = await lireVosLieux(sb, USER_A, async (_sb, userId, insee, scope) => {
    appels++;
    assert.deepEqual([userId, insee, scope], [USER_A, "34172", "commune"]);
    return servi(artefact({ texte: "Montpellier, v1 relue" }), 1);
  });
  assert.equal(appels, 1);
  const mtp = lieux.find((l) => l.commune === "Montpellier")!;
  assert.equal(mtp.conclusion.etat === "disponible" && mtp.conclusion.texte, "Montpellier, v1 relue");
});
