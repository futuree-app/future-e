// FUT-74 · revue indépendante du 24/10/2026 : L'ATTRIBUTION AUTOMATIQUE ET SON ENREGISTREMENT.
//
// Deux défauts relevés par la revue (docs/audits/2026-10-24-fut74-livraison/README.md, sur la
// branche de revue) :
//   1. `dpeAttributionStatus` retenait seul une fiche typée « maison » sans consulter son grain : une
//      maison à méthode « dpe immeuble collectif », ou un type hors énumération contenant « maison »,
//      recevait `auto_confirmed` ;
//   2. le module posait `auto_confirmed` AVANT la réponse du serveur et ignorait un refus : un choix
//      jamais enregistré s'affichait comme fait.
// Tests déterministes : aucune requête réelle, la persistance est simulée.
import test from "node:test";
import assert from "node:assert/strict";
import { dpeAttributionStatus } from "./dpe-attribution.ts";
import { confirmerAutomatiquement, departDpe, MESSAGE_AUTO_NON_ENREGISTRE } from "./dpe-attribution-auto.ts";
import { grainDpe } from "./dpe-grain.ts";
import { dpe } from "./dpe-grain.fixtures.ts";

const MAISON = dpe({ id_dpe: "FUT74MAI00099", type_batiment: "maison", methode_dpe: "dpe maison individuelle", etiquette_dpe: "E" });
const NEUF = { dpe_selection_status: "pending", dpe_selection_at: null };

// ── Les contre-exemples de la revue, et le témoin ────────────────────────────────────────────────

test("REVUE 1 · type « maison », méthode « dpe immeuble collectif » : indéterminé, jamais retenu seul", () => {
  const d = dpe({ type_batiment: "maison", methode_dpe: "dpe immeuble collectif" });
  assert.equal(grainDpe(d), "indetermine");
  assert.equal(dpeAttributionStatus([d], "housenumber").status, "selection_required");
});

test("REVUE 2 · type contenant « maison » hors énumération, méthode absente : jamais retenu seul", () => {
  const d = dpe({ type_batiment: "maison de ville", methode_dpe: null });
  assert.equal(grainDpe(d), "indetermine");
  assert.equal(dpeAttributionStatus([d], "housenumber").status, "selection_required");
});

test("TÉMOIN · maison individuelle, seule, adresse précise, classe présente : retenue automatiquement", () => {
  assert.equal(grainDpe(MAISON), "logement");
  const a = dpeAttributionStatus([MAISON], "housenumber");
  assert.equal(a.status, "auto_confirmed");
  assert.equal(a.status === "auto_confirmed" && a.dpe, MAISON);
});

test("les conditions historiques tiennent toujours : liste partielle, adresse imprécise, sans classe, plusieurs", () => {
  assert.equal(dpeAttributionStatus([MAISON], "housenumber", false).status, "selection_required");
  assert.equal(dpeAttributionStatus([MAISON], "street").status, "selection_required");
  assert.equal(dpeAttributionStatus([MAISON], null).status, "selection_required");
  assert.equal(dpeAttributionStatus([{ ...MAISON, etiquette_dpe: null }], "housenumber").status, "selection_required");
  assert.equal(dpeAttributionStatus([MAISON, { ...MAISON, id_dpe: "FUT74MAI00098" }], "housenumber").status, "selection_required");
  assert.equal(dpeAttributionStatus([], "housenumber").status, "not_found");
});

test("un DPE d'immeuble ou de grain indéterminé n'est jamais retenu seul", () => {
  const immeuble = dpe({ type_batiment: "immeuble", methode_dpe: "dpe immeuble collectif", surface_m2: null });
  assert.equal(dpeAttributionStatus([immeuble], "housenumber").status, "selection_required");
  assert.equal(dpeAttributionStatus([dpe({ type_batiment: null, methode_dpe: null })], "housenumber").status, "selection_required");
});

test("un appartement généré à partir de l'immeuble garde son grain logement, sans devenir une maison", () => {
  const genere = dpe({ type_batiment: "appartement", methode_dpe: "dpe appartement généré à partir des données DPE immeuble" });
  assert.equal(grainDpe(genere), "logement");
  assert.equal(dpeAttributionStatus([genere], "housenumber").status, "selection_required");
});

// ── Le point de départ d'un dossier ouvert ───────────────────────────────────────────────────────

test("DÉPART · un dossier neuf à maison convergente PROPOSE une attribution, qui n'est pas encore faite", () => {
  const d = departDpe(NEUF, [MAISON], "housenumber", true);
  assert.deepEqual(d, { kind: "proposer_auto", dpe: MAISON });
});

test("DÉPART · un retrait volontaire antérieur n'est jamais suivi d'une réattribution au rechargement", () => {
  // `pending` daté : le lecteur a retiré son choix. La maison convergente n'est pas reproposée.
  assert.deepEqual(departDpe({ dpe_selection_status: "pending", dpe_selection_at: "2026-10-24T10:00:00Z" }, [MAISON], "housenumber", true), { kind: "restaurer" });
  // Tout statut persisté se restaure tel quel.
  for (const s of ["auto_confirmed", "user_confirmed", "not_in_list", "not_found"]) {
    assert.deepEqual(departDpe({ dpe_selection_status: s, dpe_selection_at: null }, [MAISON], "housenumber", true), { kind: "restaurer" }, s);
  }
});

test("DÉPART · rien à proposer : liste vide, plusieurs candidats, liste partielle", () => {
  assert.deepEqual(departDpe(NEUF, [], "housenumber", true), { kind: "aucun" });
  assert.deepEqual(departDpe(NEUF, [MAISON, { ...MAISON, id_dpe: "x" }], "housenumber", true), { kind: "a_choisir" });
  assert.deepEqual(departDpe(NEUF, [MAISON], "housenumber", false), { kind: "a_choisir" });
});

// ── L'enregistrement de l'attribution automatique ────────────────────────────────────────────────

test("ENREGISTREMENT · succès du serveur : l'attribution est confirmée", async () => {
  const appels: string[] = [];
  const issue = await confirmerAutomatiquement(MAISON, async (d) => { appels.push(d.id_dpe); return true; }, () => true);
  assert.equal(issue, "confirme");
  assert.deepEqual(appels, ["FUT74MAI00099"]);
});

test("ENREGISTREMENT · refus du serveur (422 DPE_NON_ATTRIBUABLE) : aucun choix confirmé", async () => {
  assert.equal(await confirmerAutomatiquement(MAISON, async () => false, () => true), "refuse");
});

test("ENREGISTREMENT · échec réseau : aucun choix confirmé", async () => {
  assert.equal(await confirmerAutomatiquement(MAISON, async () => { throw new TypeError("Failed to fetch"); }, () => true), "refuse");
});

test("ENREGISTREMENT · une réponse arrivée après un geste du lecteur ne l'écrase pas, succès comme refus", async () => {
  for (const reponse of [true, false]) {
    let courant = true;
    const issue = await confirmerAutomatiquement(MAISON, async () => { courant = false; return reponse; }, () => courant);
    assert.equal(issue, "perime", String(reponse));
  }
});

test("ENREGISTREMENT · le message d'échec dit quoi faire, sans parler de panne seulement", () => {
  assert.match(MESSAGE_AUTO_NON_ENREGISTRE, /n'a pas pu être retenu automatiquement/);
  assert.match(MESSAGE_AUTO_NON_ENREGISTRE, /désigner ci-dessous/);
});
