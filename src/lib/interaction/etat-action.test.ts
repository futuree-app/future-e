// FUT-75 · Q1 : LE SUCCÈS N'APPARAÎT QUE SUR UNE VERSION RÉELLEMENT LIVRÉE.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  appuiAccepte, cleMemoireAffichage, compteRenduAction, DELAI_RELECTURE_MS, DUREE_MEMOIRE_AFFICHAGE_MS, etapeAffichage,
  gesteAppui, issueDepuisReponse, lireMemoireAffichage, suivantAction, versionAtteinte,
  type EtatAction, type IssueAction, type SuiviAffichage,
} from "./etat-action.ts";

const ETATS: EtatAction[] = ["repos", "attente", "succes", "affichage", "affichee", "non_affichee", "echec", "ailleurs"];

test("A1. seul `abouti` avec un numéro de version est une livraison", () => {
  assert.deepEqual(issueDepuisReponse({ ok: true, status: 200, corps: { ok: true, statut: "abouti", version: 4 } }), { type: "livree", version: 4 });
  assert.deepEqual(issueDepuisReponse({ ok: true, status: 200, corps: { ok: true, statut: "abouti" } }), { type: "echec", motif: "autre" }, "sans version, rien n'est livré");
  assert.deepEqual(issueDepuisReponse({ ok: true, status: 200, corps: { ok: true, statut: "en_cours" } }), { type: "en_cours" }, "engagée n'est pas livrée");
  assert.deepEqual(issueDepuisReponse({ ok: true, status: 200, corps: { ok: true } }).type, "echec");
  assert.deepEqual(issueDepuisReponse({ ok: false, status: 409, corps: { error: "PROJECT_MISSING" } }), { type: "echec", motif: "projet_manquant" });
  assert.deepEqual(issueDepuisReponse({ ok: false, status: 503, corps: { error: "PURCHASE_CONTEXT_UNAVAILABLE" } }), { type: "echec", motif: "contexte_indisponible" });
  assert.deepEqual(issueDepuisReponse({ ok: false, status: 502, corps: { error: "GENERATION_FAILED" } }), { type: "echec", motif: "generation" });
  assert.equal(issueDepuisReponse({ ok: false, status: 500, corps: null }).type, "echec");
  // Une réponse en erreur qui prétendrait « abouti » n'est pas un succès.
  assert.equal(issueDepuisReponse({ ok: false, status: 500, corps: { statut: "abouti", version: 9 } }).type, "echec");
});

test("A2. aucun chemin vers le succès sans attente puis livraison", () => {
  const issues: IssueAction[] = [{ type: "en_cours" }, { type: "echec", motif: "reseau" }, { type: "echec", motif: "projet_manquant" }];
  for (const e of ETATS) {
    for (const ev of [{ type: "appui" } as const, { type: "fin_confirmation" } as const, ...issues.map((issue) => ({ type: "issue" as const, issue }))]) {
      if (suivantAction(e, ev) === "succes") assert.equal(e, "succes", `${e} + ${ev.type}`);
    }
    if (e !== "attente") assert.equal(suivantAction(e, { type: "issue", issue: { type: "livree", version: 2 } }), e, `${e} : une réponse orpheline ne confirme rien`);
  }
  assert.equal(suivantAction("attente", { type: "issue", issue: { type: "livree", version: 2 } }), "succes");
  assert.equal(suivantAction("attente", { type: "issue", issue: { type: "en_cours" } }), "ailleurs");
  assert.equal(suivantAction("succes", { type: "fin_confirmation" }), "repos");
});

test("A3. double clic : un seul appui accepté pendant l'attente ; l'échec permet de réessayer", () => {
  assert.equal(appuiAccepte("attente"), false);
  for (const e of ["repos", "echec", "ailleurs", "succes"] as const) assert.equal(appuiAccepte(e), true);
  assert.equal(suivantAction("echec", { type: "appui" }), "attente");
  const src = readFileSync("src/components/interaction/BoutonAction.tsx", "utf8");
  assert.match(src, /onClick=\{\(\) => \{ if \(!enAttente\) onAppui\(\); \}\}/);
  assert.doesNotMatch(src, /fetch\(|setTimeout\([^)]*succes/, "le composant n'appelle rien et ne fabrique aucun succès");
  assert.match(src, /aria-busy=\{enAttente\}/);
});

test("A4. l'appui selon l'état : une seule demande, et « déjà en cours » relit la page sans relancer", () => {
  assert.equal(gesteAppui("repos"), "envoyer");
  assert.equal(gesteAppui("echec"), "envoyer");
  assert.equal(gesteAppui("attente"), "ignorer", "double clic");
  assert.equal(gesteAppui("succes"), "ignorer", "appui pendant la confirmation");
  assert.equal(gesteAppui("ailleurs"), "relire", "une seconde demande lancerait une génération de plus");
});

test("A5. le compte rendu : rien d'annoncé sans issue réelle, l'analyse affichée reste dite", () => {
  assert.equal(compteRenduAction("repos", null), "");
  assert.match(compteRenduAction("attente", null), /reste lisible/);
  assert.equal(compteRenduAction("succes", null), "", "pas de confirmation sans version livrée");
  assert.equal(compteRenduAction("succes", { type: "en_cours" }), "");
  assert.match(compteRenduAction("succes", { type: "livree", version: 3 }), /nouvelle analyse est prête/);
  // FUT-93 : « prête » n'est pas « affichée », et rien ne promet un affichage « dans un instant ».
  assert.doesNotMatch(compteRenduAction("succes", { type: "livree", version: 3 }), /affich/);
  assert.match(compteRenduAction("affichage", { type: "livree", version: 3 }), /s'affiche.*reste lisible/);
  assert.equal(compteRenduAction("affichage", null), "", "pas d'affichage annoncé sans version livrée");
  assert.match(compteRenduAction("affichee", null), /est affichée/);
  assert.match(compteRenduAction("non_affichee", null), /prête, mais la page n'a pas pu l'afficher.*sans relancer de calcul/);
  assert.match(compteRenduAction("echec", { type: "echec", motif: "projet_manquant" }), /décrivez-le.*reste inchangée/);
  assert.match(compteRenduAction("echec", { type: "echec", motif: "reseau" }), /connexion.*reste inchangée/);
  assert.match(compteRenduAction("ailleurs", { type: "en_cours" }), /déjà en cours/);
  for (const e of ETATS) for (const i of [null, { type: "en_cours" } as IssueAction]) {
    assert.doesNotMatch(compteRenduAction(e, i), /%|restant|secondes/, "ni pourcentage ni temps restant");
  }
  // L'ancienne promesse « La page l'affiche dans un instant » ne revient dans aucun état d'affichage.
  for (const e of ["succes", "affichage", "affichee", "non_affichee"] as const) {
    assert.doesNotMatch(compteRenduAction(e, { type: "livree", version: 3 }), /dans un instant/, e);
  }
});

test("A6. raccordé au vrai bouton : réponse réelle, trois raisons, une seule requête, affichage constaté", () => {
  const src = readFileSync("src/components/report/AnalyseAncienProjet.tsx", "utf8");
  assert.match(src, /<BoutonAction etat=\{etatVisible\} onAppui=\{mettreAJour\} libelles=\{LIBELLES\} \/>/);
  assert.match(src, /issueDepuisReponse\(\{ ok: res\.ok, status: res\.status, corps:/);
  assert.match(src, /setEtat\(\(e\) => suivantAction\(e, \{ type: "issue", issue: i \}\)\)/);
  // Les trois raisons de FUT-10 : projet, lien avec le bien, voisinage.
  assert.match(src, /raison\?: "projet" \| "lien" \| "voisinage"/);
  assert.match(src, /Votre projet a changé depuis cette analyse/);
  assert.match(src, /Vous avez modifié votre lien avec ce bien/);
  assert.match(src, /Une version plus récente de futur•e est disponible/);
  // UNE SEULE requête possible vers la route : ni la relecture, ni le rechargement n'en envoient.
  assert.equal([...src.matchAll(/fetch\("\/api\/dossier\/actualiser"/g)].length, 1);
  // « Affichée » se DÉDUIT de la version servie, jamais d'un rafraîchissement : aucun setEtat ne la pose.
  assert.match(src, /versionAtteinte\(attendue, versionServie\)\s*\?\s*"affichee"/);
  assert.doesNotMatch(src, /setEtat\([^)]*"affichee"/);
  assert.doesNotMatch(src, /type: "version_affichee"/);
  // Une réponse arrivée pour un autre dossier, ou après le démontage, ne confirme rien.
  assert.match(src, /if \(cleCourante\.current !== demande\) return;/);
  assert.match(src, /aria-live="polite"/);
  assert.doesNotMatch(src, /DECISION_RELEVE/);
  assert.match(src, /succes: "Nouvelle analyse prête"/);
  assert.match(src, /affichage: "Affichage de votre analyse…"/);
});

test("A7. la version servie descend jusqu'au bouton, et la conclusion suit la version (les deux présentations)", () => {
  const section = readFileSync("src/components/report/DossierDecisionSection.tsx", "utf8");
  const releve = readFileSync("src/components/releve/DossierDecisionReleve.tsx", "utf8");
  const logement = readFileSync("src/components/report/DossierAvecLogement.tsx", "utf8");
  const rapport = readFileSync("src/app/(account)/rapport/page.tsx", "utf8");
  assert.match(section, /<AnalyseAncienProjet\s+insee=\{insee\}\s+scopeKey=\{scopeKey\}\s+versionServie=\{versionServie\}/);
  assert.match(section, /<DossierDecisionReleve[^>]*versionServie=\{versionServie\}/);
  assert.match(releve, /<AnalyseAncienProjet insee=\{insee\} scopeKey=\{scopeKey\} versionServie=\{versionServie\}/);
  // La frontière de la conclusion rédigée change de clé avec la version servie (cause établie, voir le compte rendu).
  for (const f of [section, releve]) assert.match(f, /<Suspense[\s\S]{0,40}key=\{`\$\{scopeKey\}:\$\{versionServie \?\? generatedAt \?\? "vivant"\}`\}/);
  // La version servie vient de l'artefact réellement servi, et seulement de lui.
  assert.match(logement, /versionServie=\{servi\.source === "artefact" \? \(stocke\?\.servedVersion \?\? null\) : null\}/);
  assert.match(rapport, /versionServieCommune = servi\.source === "artefact" \? \(artefactCommune\?\.servedVersion \?\? null\) : null/);
  assert.equal([...rapport.matchAll(/versionServie=\{versionServieCommune\}/g)].length, 2, "repli communal et dossier de commune seule");
});

test("A8. livrée n'est pas affichée : l'affichage ne se constate qu'à une version servie >= l'attendue", () => {
  assert.equal(versionAtteinte(3, 3), true);
  assert.equal(versionAtteinte(3, 4), true, "une version plus récente encore vaut affichage");
  assert.equal(versionAtteinte(3, 2), false, "version servie encore ancienne");
  assert.equal(versionAtteinte(3, null), false, "dossier assemblé à l'instant : rien n'est constaté");
  assert.equal(versionAtteinte(3, undefined), false);
  assert.equal(versionAtteinte(3, Number.NaN), false);
  // Les transitions : l'affichage ne commence qu'après une livraison confirmée.
  assert.equal(suivantAction("succes", { type: "lecture" }), "affichage");
  for (const e of ETATS.filter((x) => x !== "succes")) assert.equal(suivantAction(e, { type: "lecture" }), e, e);
  assert.equal(suivantAction("affichage", { type: "affichage_echoue" }), "non_affichee");
  for (const e of ETATS.filter((x) => x !== "affichage")) assert.equal(suivantAction(e, { type: "affichage_echoue" }), e, e);
  // Aucun événement d'affichage ne mène au succès de la génération ni ne relance une demande.
  for (const e of ETATS) for (const ev of [{ type: "lecture" } as const, { type: "affichage_echoue" } as const, { type: "version_affichee" } as const]) {
    if (e !== "attente") assert.notEqual(suivantAction(e, ev), "attente", `${e} + ${ev.type} ne relance aucune demande`);
    if (e !== "succes") assert.notEqual(suivantAction(e, ev), "succes", `${e} + ${ev.type}`);
  }
});

test("A9. la récupération est bornée : deux relectures au plus, un seul rechargement, jamais de requête", () => {
  const s = (tentatives: number, rechargee = false): SuiviAffichage => ({ attendue: 3, tentatives, rechargee });
  const o = (servie: number | null, relectureEnCours: boolean, delaiDepasse: boolean) => ({ servie, relectureEnCours, delaiDepasse });
  // Version réellement servie : affichée, quelle que soit l'étape.
  for (const t of [0, 1, 2]) assert.equal(etapeAffichage(s(t), o(3, true, true)), "affichee");
  // Première relecture.
  assert.equal(etapeAffichage(s(0), o(2, false, false)), "relire");
  // Relecture lente (7 à 12 s) : on attend, sans récupération.
  assert.equal(etapeAffichage(s(1), o(2, true, false)), "attendre");
  assert.ok(DELAI_RELECTURE_MS >= 12_000 + 5_000, "une page servie en 12 s ne déclenche pas la récupération");
  assert.ok(DELAI_RELECTURE_MS <= 30_000, "une page bloquée ne laisse pas attendre indéfiniment");
  // Premier refresh terminé sans effet (contenu encore ancien) : une seconde relecture, une seule.
  assert.equal(etapeAffichage(s(1), o(2, false, false)), "relire");
  assert.equal(etapeAffichage(s(2), o(2, false, false)), "recharger");
  // Relecture bloquée (la transition ne se valide pas) : rechargement complet, sans seconde relecture.
  assert.equal(etapeAffichage(s(1), o(2, true, true)), "recharger");
  // Après le rechargement : on renonce et on le dit, sans boucle.
  assert.equal(etapeAffichage(s(0, true), o(2, false, false)), "renoncer");
  assert.equal(etapeAffichage(s(2, true), o(2, false, false)), "renoncer");
  assert.equal(etapeAffichage(s(1, true), o(2, true, true)), "renoncer");

  // Simulation exhaustive des cas défavorables : aucune boucle, au plus 2 relectures et 1 rechargement.
  for (const blocage of [false, true]) {
    let suivi = s(0); let relectures = 0; let rechargements = 0; let fin = "";
    for (let pas = 0; pas < 20 && !fin; pas++) {
      const e = etapeAffichage(suivi, o(2, blocage && suivi.tentatives > 0, blocage && suivi.tentatives > 0));
      if (e === "relire") { relectures++; suivi = { ...suivi, tentatives: suivi.tentatives + 1 }; }
      else if (e === "recharger") { rechargements++; suivi = { attendue: 3, tentatives: 0, rechargee: true }; }
      else fin = e;
    }
    assert.equal(fin, "renoncer", `blocage=${blocage}`);
    assert.ok(relectures <= 2 && rechargements === 1, `blocage=${blocage} : ${relectures} relectures, ${rechargements} rechargements`);
  }
  // Le geste qui suit : jamais une nouvelle requête pendant ou après l'affichage.
  for (const e of ["succes", "affichage", "affichee"] as const) assert.equal(gesteAppui(e), "ignorer", e);
  assert.equal(gesteAppui("non_affichee"), "recharger");
});

test("A10. la mémoire du rechargement : ce dossier, cette portée, peu de temps, rien d'illisible", () => {
  const cle = "44109|logement:abc";
  const m = { cle, attendue: 3, rechargee: true, le: 1_000_000 };
  assert.deepEqual(lireMemoireAffichage(JSON.stringify(m), cle, 1_000_000 + 5_000), m);
  assert.equal(lireMemoireAffichage(JSON.stringify(m), "44109|logement:autre", 1_000_500), null, "un autre logement n'en hérite pas");
  assert.equal(lireMemoireAffichage(JSON.stringify(m), cle, 1_000_000 + DUREE_MEMOIRE_AFFICHAGE_MS + 1), null, "périmée");
  assert.equal(lireMemoireAffichage(JSON.stringify({ ...m, le: 9_000_000 }), cle, 1_000_000), null, "datée du futur");
  assert.equal(lireMemoireAffichage("{pas du json", cle, 1_000_000), null);
  assert.equal(lireMemoireAffichage(JSON.stringify({ ...m, attendue: "3" }), cle, 1_000_000), null);
  assert.equal(lireMemoireAffichage(null, cle, 1_000_000), null);
  assert.deepEqual(lireMemoireAffichage(JSON.stringify(m), cle), m, "sans horloge, la péremption a déjà été vérifiée");
  assert.notEqual(cleMemoireAffichage(cle), cleMemoireAffichage("44109|commune"));
});
