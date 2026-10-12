// FUT-75 · Q1 : LE SUCCÈS N'APPARAÎT QUE SUR UNE VERSION RÉELLEMENT LIVRÉE.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { appuiAccepte, issueDepuisReponse, suivantAction, type EtatAction, type IssueAction } from "./etat-action.ts";

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
  // Pas encore raccordé à la production (FUT-10 réécrit AnalyseAncienProjet).
  assert.doesNotMatch(readFileSync("src/components/report/AnalyseAncienProjet.tsx", "utf8"), /BoutonAction/);
});
