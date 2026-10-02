// FUT-37, étape 1 : CARACTÉRISATION. Ces tests figent ce que l'accueil dit AVANT correction, sur des
// communes réelles (fixture __fixtures__/panel.json). Ils décrivent des fautes, pas une cible : chaque
// étape suivante les remplace par l'assertion juste. Les garder visibles dans l'historique, c'est
// garder la preuve que la correction a changé ce que la carte RACONTE, pas seulement qu'elle apparaît.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getPreviewCards } from "./recits.ts";

type Commune = { nom: string; categories: string[]; flags: Record<string, boolean>; drias: Record<string, Record<string, number>> };
const PANEL = JSON.parse(readFileSync(new URL("./__fixtures__/panel.json", import.meta.url), "utf8")).communes as Record<string, Commune>;

function indicateurs(c: Commune) {
  return Object.fromEntries(
    Object.entries(c.drias).map(([g, v]) => [g, Object.fromEntries(Object.entries(v).map(([k, n]) => [k, { value_numeric: n }]))]),
  );
}
const cartes = (insee: string, h: "today" | "2030" | "2050" | "2100", geo: unknown = { flags: PANEL[insee].flags }) => {
  const c = PANEL[insee];
  return getPreviewCards(c.nom, c.categories, indicateurs(c), geo as never, null, h);
};
const carte = (insee: string, h: "today" | "2030" | "2050" | "2100", prefixe: string) =>
  cartes(insee, h).find((x) => x.label.startsWith(prefixe));

test("caractérisation : Chamonix (0 jour > 35 °C) reçoit « plusieurs semaines par an » en 2100", () => {
  assert.equal(PANEL["74056"].drias.gwl30.NORTX35D_yr, 0);
  assert.equal(carte("74056", "2100", "Canicule")?.val, "Les chaleurs extrêmes pourraient durer plusieurs semaines par an.");
});

test("caractérisation : Briançon (IFM ≥ 40 : 0 jour en 2050) reçoit une « forte progression » du risque", () => {
  assert.equal(PANEL["05023"].drias.gwl20.NORIFM40_yr, 0);
  assert.equal(carte("05023", "2050", "Feux")?.val, "Le risque d'incendie pourrait fortement progresser autour de Briançon.");
});

test("caractérisation : Rodez, des jours de sol sec deviennent « l'accès à l'eau »", () => {
  assert.equal(carte("12202", "2050", "Eau")?.val, "L'accès à l'eau pourrait devenir plus tendu pendant les étés.");
});

test("caractérisation : « Aujourd'hui » lit la projection 2030 (gwl15)", () => {
  // Le chiffre caché (`note`) est nul à « today », mais la carte est construite sur gwl15.
  const today = carte("30189", "today", "Canicule");
  assert.equal(today?.val, "Les épisodes de chaleur extrême restent ponctuels à Nîmes.");
});

test("caractérisation : pendant le chargement, Vannes (littoral) reçoit submersion et immobilier sans aucun fait", () => {
  const c = PANEL["56260"];
  assert.equal(c.flags.marineSubmersion, undefined); // GASPAR ne recense pas la submersion à Vannes
  const chargement = getPreviewCards(c.nom, c.categories, {}, null, null, "today").map((x) => x.label);
  assert.ok(chargement.includes("Submersion à Vannes"));
  assert.ok(chargement.includes("Valeur immobilière à Vannes"));
});
