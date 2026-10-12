// FUT-75 · Q1 : LE SUCCÈS N'APPARAÎT QUE SUR UNE VERSION RÉELLEMENT LIVRÉE.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { appuiAccepte, compteRenduAction, gesteAppui, issueDepuisReponse, suivantAction, type EtatAction, type IssueAction } from "./etat-action.ts";

const ETATS: EtatAction[] = ["repos", "attente", "succes", "echec", "ailleurs"];

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
  assert.match(compteRenduAction("succes", { type: "livree", version: 3 }), /nouvelle version est prête/);
  assert.match(compteRenduAction("echec", { type: "echec", motif: "projet_manquant" }), /décrivez-le.*reste inchangée/);
  assert.match(compteRenduAction("echec", { type: "echec", motif: "reseau" }), /connexion.*reste inchangée/);
  assert.match(compteRenduAction("ailleurs", { type: "en_cours" }), /déjà en cours/);
  for (const e of ETATS) for (const i of [null, { type: "en_cours" } as IssueAction]) {
    assert.doesNotMatch(compteRenduAction(e, i), /%|restant|secondes/, "ni pourcentage ni temps restant");
  }
});

test("A6. raccordé au vrai bouton : réponse réelle, trois raisons, rechargement seulement après livraison", () => {
  const src = readFileSync("src/components/report/AnalyseAncienProjet.tsx", "utf8");
  assert.match(src, /<BoutonAction etat=\{etat\} onAppui=\{mettreAJour\} libelles=\{LIBELLES\} \/>/);
  assert.match(src, /issueDepuisReponse\(\{ ok: res\.ok, status: res\.status, corps:/);
  assert.match(src, /setEtat\(\(e\) => suivantAction\(e, \{ type: "issue", issue: i \}\)\)/);
  // Les trois raisons de FUT-10 : projet, lien avec le bien, voisinage.
  assert.match(src, /raison\?: "projet" \| "lien" \| "voisinage"/);
  assert.match(src, /Votre projet a changé depuis cette analyse/);
  assert.match(src, /Vous avez modifié votre lien avec ce bien/);
  assert.match(src, /Une version plus récente de futur•e est disponible/);
  // La page ne relit la nouvelle version qu'après une livraison, ou sur demande quand une autre tourne.
  const refresh = [...src.matchAll(/router\.refresh\(\)/g)].length;
  assert.equal(refresh, 2);
  assert.match(src, /if \(i\.type === "livree"\) \{\n\s+minuterie\.current = window\.setTimeout\(\(\) => startTransition\(\(\) => router\.refresh\(\)\)/);
  assert.match(src, /if \(geste === "relire"\) \{ startTransition\(\(\) => router\.refresh\(\)\); return; \}/);
  // Une réponse arrivée pour un autre dossier, ou après le démontage, ne confirme rien.
  assert.match(src, /if \(cleCourante\.current !== demande\) return;/);
  // La région annoncée existe avant que son texte change.
  assert.match(src, /aria-live="polite"/);
  // Aucune présentation n'est activée ici : le composant est le même dans les deux rendus.
  assert.doesNotMatch(src, /DECISION_RELEVE/);
});
