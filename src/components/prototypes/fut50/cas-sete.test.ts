// FUT-50 · LE CAS SÈTE NE PEUT PAS DÉRIVER EN SILENCE (partie hors ligne).
//
// La chaîne complète (moteur + Géorisques) se rejoue avec `scripts/fut50/verifier-cas-sete.mjs`. Ici, ce
// qui se vérifie sans réseau : les valeurs DRIAS figées sont celles du fichier servi, et chaque chiffre
// écrit dans les phrases et sur la règle du temps s'en déduit.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CAS_SETE, NUITS_SETE_JALONS } from "./cas-sete.ts";
import { HORIZONS } from "../../../lib/horizons.ts";

const COL = { NORTR_yr: "column10", ATR_yr: "column25" } as const;

test("les valeurs DRIAS figées sont celles de data/data_climat.json", () => {
  const lignes = JSON.parse(readFileSync("data/data_climat.json", "utf8")) as Record<string, string | number>[];
  for (const [gwl, valeurs] of Object.entries(CAS_SETE.faits.nuits.drias)) {
    const ligne = lignes.find((r) => String(r.insee_code).padStart(5, "0") === CAS_SETE.insee && r.scenario === gwl);
    assert.ok(ligne, `ligne ${gwl} absente`);
    for (const [k, v] of Object.entries(valeurs)) assert.equal(Number(ligne[COL[k as keyof typeof COL]]), v, `${gwl} ${k}`);
  }
});

test("les chiffres des phrases et de la règle se déduisent des valeurs DRIAS", () => {
  const d = CAS_SETE.faits.nuits.drias;
  const reference = d.gwl20.NORTR_yr - d.gwl20.ATR_yr; // 42,7 : le moteur tronque la référence
  assert.equal(Math.floor(reference), 42);
  assert.equal(Math.round(d.gwl20.NORTR_yr), 80);
  assert.match(CAS_SETE.faits.nuits.constat, /de 42 par an sur la période de référence 1976-2005 à 80 à l'horizon 2050/);
  assert.equal(CAS_SETE.faits.nuits.preuve.valeur, "80 nuits à l'horizon 2050");
  const parAnnee = Object.fromEntries(NUITS_SETE_JALONS.map((j) => [j.annee, j.valeur]));
  assert.equal(parAnnee[1976], "42");
  assert.equal(parAnnee[2030], String(Math.round(d.gwl15.NORTR_yr)));
  assert.equal(parAnnee[2050], String(Math.round(d.gwl20.NORTR_yr)));
  assert.equal(parAnnee[2100], String(Math.round(d.gwl30.NORTR_yr)));
  // Les libellés d'horizon sont ceux du référentiel TRACC du produit, jamais le palier mondial seul.
  for (const h of HORIZONS) {
    const jalon = NUITS_SETE_JALONS.find((j) => String(j.annee) === h.annee);
    assert.equal(jalon?.libelle, h.france); // la légende de la règle dit « en France »
  }
});

test("la fixture respecte la voix : ni tiret cadratin, ni point d'exclamation", () => {
  const texte = JSON.stringify(CAS_SETE);
  assert.doesNotMatch(texte, /—/);
  assert.doesNotMatch(texte, /!/);
});
