// FUT-41 V5 · tests du modèle (fixtures fictives). État ET phrase rendue (AGENTS.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import { confronter, enBref, ouVousEnEtes, bilan, alertes, type Recherche, type Piste } from "./modele5.ts";
import { PROJET, COMMUNES, LOGEMENTS } from "./scenarios5.ts";

const R = (c: string[], l: string[]): Recherche => ({
  projet: structuredClone(PROJET),
  communes: COMMUNES.filter((x) => c.includes(x.insee)).map((x) => structuredClone(x)),
  logements: LOGEMENTS.filter((x) => l.includes(x.id)).map((x) => structuredClone(x)),
});
const P = (r: Recherche, id: string): Piste => (id.startsWith("c:") ? { type: "commune", commune: r.communes.find((c) => `c:${c.insee}` === id)! } : { type: "logement", logement: r.logements.find((l) => l.id === id)! });

test("S7 : un logement dont seule la commune est lue n'a rien aux abords", () => {
  const r = R(["44109", "35238"], ["fosse", "convention", "thabor"]);
  const c = confronter(r, ["fosse", "convention", "thabor"].map((id) => P(r, id)));
  const gare = c.lignes.find((x) => x.cle === "gare")!.couches.find((x) => x.couche === "abords")!;
  assert.deepEqual(gare.cellules.map((x) => x.etat), ["lu", "a_lire", "adresse_manquante"]);
  assert.notEqual(gare.verdict, "distingue");
});

test("deux logements de Nantes partagent une seule cellule communale", () => {
  const r = R(["44109", "35238"], ["fosse", "convention", "thabor"]);
  const c = confronter(r, ["fosse", "convention", "thabor"].map((id) => P(r, id)));
  const nuits = c.lignes.find((x) => x.cle === "nuits")!.couches.find((x) => x.couche === "commune")!;
  assert.deepEqual(nuits.cellules[0]!.ids, ["fosse", "convention"]);
});

test("ancien Projet : Saint-Félix est « à revoir », ni reconduit ni bloqué", () => {
  const r = R(["44109"], ["fosse", "felix"]);
  const a = alertes(r, [P(r, "felix")]);
  assert.equal(a[0]!.genre, "a_revoir");
  assert.match(a[0]!.phrase, /quand votre limite était de 30 min ; mesuré à 23 min, il pourrait ne plus tenir/);
  assert.ok(bilan(r, P(r, "felix"), "unite").apporte.every((x) => !/la gare/.test(x)));
});

test("synthèses : trois phrases au plus, aucun classement", () => {
  const r = R(["44109", "35238"], ["fosse", "convention", "thabor"]);
  const o = ouVousEnEtes(r);
  assert.ok(o.length <= 3);
  assert.match(o[0]!, /Deux communes et trois logements en vue ; un seul est analysé/);
  const b = enBref(r, [P(r, "c:44109"), P(r, "c:35238")]);
  assert.ok(b.length <= 3);
  assert.doesNotMatch([...o, ...b].join(" "), /meilleur|recommand|gagnant/i);
});
