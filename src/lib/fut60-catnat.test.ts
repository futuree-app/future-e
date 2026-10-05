// FUT-60 : le module Territoire disait d'un même dossier parisien « reconnue 20 fois… surtout au titre
// de : inondations » puis « dont 0 arrêté inondation depuis 1982 ». Cause : GASPAR ne connaît Paris,
// Lyon et Marseille qu'au code de la COMMUNE ; l'index les avait interrogées par arrondissement, où
// GASPAR répond zéro ligne. Ces tests lisent les VRAIES lignes GASPAR (relevées le 05/10/2026) et le
// VRAI index, puis vérifient que les deux chemins racontent la même histoire.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { agregerLignesCatnat, aleaDominant, resumeCatnat, simplifyCatnatRisk, type LigneCatnat } from "./georisques-flags.ts";
import {
  CATNAT_DEPUIS, catnatFigeAffichable, catnatInondationDepuisIndex, libelleCatnatInondation,
} from "./decision/catnat-evidence.ts";
import { buildTerritoireSnapshot } from "./territoire/facts.ts";
import { projectForSynthesis } from "./territoire/synthesis-contract.ts";
import { deterministicSynthesis } from "./territoire/synthesis-deterministe.ts";
import { chatelaillonInputs } from "./territoire/__fixtures__/chatelaillon.ts";

type Releve = { results: number; data: (LigneCatnat & { code_national_catnat: string })[] };
const GASPAR = JSON.parse(readFileSync("src/lib/__fixtures__/fut60-gaspar-catnat-05-10.json", "utf8")) as {
  "75056": Releve; multi: Releve; sansinond: Releve; sansinond_insee: string;
};
const INDEX = new Map(
  (JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8")).communes as
    { insee: string; inondation?: { catnat: number; risque: number } | null }[]).map((c) => [c.insee, c]),
);
const releve = (r: Releve) => agregerLignesCatnat(r.data, r.results);
const inondations = (r: Releve) => releve(r).byRisk.find((x) => x.label === "Inondations")?.count ?? 0;

/** Le texte de la synthèse déterministe pour une commune, avec son relevé direct et son compte d'index. */
function synthese(nom: string, insee: string, r: Releve | null, indexInsee: string | null): string {
  const entree = indexInsee ? INDEX.get(indexInsee) : undefined;
  const inputs = {
    ...chatelaillonInputs(), insee, communeName: nom,
    catnat: r ? releve(r) : null,
    catnatInondationIndex: catnatInondationDepuisIndex(entree ? { insee, inondation: entree.inondation ?? null } : undefined),
  };
  return deterministicSynthesis(projectForSynthesis(buildTerritoireSnapshot(inputs, "2026-10-05T00:00:00.000Z"), "gwl20"), "gwl20");
}

test("T1. Paris : le compte inondation de l'index n'est plus zéro sous une dominante « inondations »", () => {
  const direct = releve(GASPAR["75056"]);
  assert.equal(direct.total, 20);
  assert.equal(aleaDominant(direct.byRisk, direct.total), "Inondations");
  // Les 20 arrondissements portent le compte de LEUR COMMUNE, égal au compte inondation du relevé direct.
  for (let a = 75101; a <= 75120; a++) {
    const o = catnatInondationDepuisIndex({ insee: "75056", inondation: INDEX.get(String(a))!.inondation ?? null });
    assert.equal(o?.count, inondations(GASPAR["75056"]), `arrondissement ${a}`);
  }
});

test("T2. Lyon : nappe et coulées de boue entrent dans « Inondations », des deux côtés", () => {
  const labels = new Set(GASPAR.multi.data.map((l) => l.libelle_risque_jo));
  assert.ok(labels.has("Inondations Remontée Nappe") && labels.has("Inondations et/ou Coulées de Boue"));
  assert.equal(simplifyCatnatRisk("Inondations Remontée Nappe"), "Inondations");
  assert.equal(simplifyCatnatRisk("Inondations et/ou Coulées de Boue"), "Inondations");
  // Le compte de l'index (classifieur Python) et le groupe du relevé direct (classifieur TS) concordent.
  for (let a = 69381; a <= 69389; a++) assert.equal(INDEX.get(String(a))!.inondation!.catnat, inondations(GASPAR.multi), `arrondissement ${a}`);
});

test("T3. une catégorie voisine n'est pas absorbée dans « Inondations »", () => {
  assert.notEqual(simplifyCatnatRisk("Chocs Mécaniques liés à l'action des Vagues"), "Inondations");
  assert.equal(simplifyCatnatRisk("Glissement de Terrain"), "Mouvements de terrain");
  assert.equal(simplifyCatnatRisk("Sécheresse"), "Sécheresse des sols");
  assert.equal(simplifyCatnatRisk("Tempête"), "Tempête");
  // Une commune sans inondation mais avec d'autres reconnaissances : aucun groupe « Inondations ».
  assert.equal(inondations(GASPAR.sansinond), 0);
  assert.ok(releve(GASPAR.sansinond).total > 0);
});

test("T4. une seule période : le total et le compte inondation disent « depuis 1982 »", () => {
  const texte = synthese("Paris", "75056", GASPAR["75056"], "75111");
  const premiere = releve(GASPAR["75056"]).firstYear;
  assert.equal(premiere, 1983, "la première reconnaissance de Paris date de 1983");
  assert.match(texte, new RegExp(`reconnue 20 fois en état de catastrophe naturelle depuis ${CATNAT_DEPUIS}`));
  assert.doesNotMatch(texte, /depuis 1983/, "la date de la première reconnaissance ne se présente plus comme la période");
  const o = catnatInondationDepuisIndex({ insee: "75056", inondation: INDEX.get("75111")!.inondation ?? null })!;
  assert.match(libelleCatnatInondation(o), new RegExp(`depuis ${CATNAT_DEPUIS}$`));
});

test("T5. une seule unité : les deux chemins comptent des LIGNES GASPAR (reconnaissances), pas des arrêtés distincts", () => {
  const lignes = GASPAR["75056"].data;
  const arretes = new Set(lignes.map((l) => l.code_national_catnat));
  assert.equal(lignes.length, 20);
  assert.equal(arretes.size, 16, "un arrêté peut porter plusieurs lignes (deux événements, ou inondation + tempête)");
  assert.equal(releve(GASPAR["75056"]).total, lignes.length);
  const lignesInondation = lignes.filter((l) => simplifyCatnatRisk(l.libelle_risque_jo ?? "") === "Inondations");
  assert.equal(INDEX.get("75111")!.inondation!.catnat, lignesInondation.length, "l'index compte la même unité");
  assert.ok(new Set(lignesInondation.map((l) => l.code_national_catnat)).size < lignesInondation.length, "et non des arrêtés distincts");
});

test("T6. la dominante se calcule sur les mêmes groupes que les compteurs, avec un seuil", () => {
  assert.equal(aleaDominant([{ label: "Inondations", count: 16 }, { label: "Tempête", count: 4 }], 20), "Inondations");
  const cinqAleas = ["Inondations", "Sécheresse des sols", "Tempête", "Grêle", "Séisme"].map((label) => ({ label, count: 1 }));
  assert.equal(aleaDominant(cinqAleas, 5), null, "cinq aléas à égalité : aucun « surtout »");
  assert.equal(resumeCatnat(cinqAleas, 5), "Plusieurs aléas, sans dominante nette.");
  // Châtelaillon : 5 sécheresses, 4 inondations sur 14 (36 %) ne font pas une dominante.
  assert.equal(aleaDominant([{ label: "Sécheresse des sols", count: 5 }, { label: "Inondations", count: 4 }, { label: "Chocs liés aux vagues", count: 3 }], 14), null);
});

test("T7. le texte rendu du cas fautif : un total, une dominante, un compte inondation compatibles", () => {
  const texte = synthese("Paris", "75056", GASPAR["75056"], "75111");
  assert.match(texte, /Paris a été reconnue 20 fois en état de catastrophe naturelle depuis 1982, surtout au titre de : inondations\./);
  const o = catnatInondationDepuisIndex({ insee: "75056", inondation: INDEX.get("75111")!.inondation ?? null })!;
  assert.equal(`Dont ${libelleCatnatInondation(o)}`, "Dont 16 arrêtés inondation depuis 1982");
  // Un compte figé avant la correction (zéro, catnat-1) n'est plus réaffiché ; un compte ordinaire l'est.
  assert.equal(catnatFigeAffichable({ count: 0, depuis: 1982, origine: "index_local", insee: "75056", version: "catnat-1" }), false);
  assert.equal(catnatFigeAffichable({ count: 7, depuis: 1982, origine: "index_local", insee: "17300", version: "catnat-1" }), true);
  assert.equal(catnatFigeAffichable({ count: 16, depuis: 1982, origine: "index_local", insee: "75056", version: "catnat-2" }), true);
});

test("T8. aucune donnée CatNat : aucune affirmation", () => {
  const vide = agregerLignesCatnat([], 0);
  assert.equal(vide.total, 0);
  assert.equal(vide.summary, null);
  assert.equal(aleaDominant(vide.byRisk, vide.total), null);
  const texte = synthese("Ornex", "01281", { results: 0, data: [] }, null);
  assert.doesNotMatch(texte, /reconnue|catastrophe naturelle|arrêté/);
  assert.equal(catnatInondationDepuisIndex(null), null, "une absence n'est pas un zéro");
});
