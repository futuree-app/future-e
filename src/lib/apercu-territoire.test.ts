import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  construireApercu, contratRempli, scenariosDepuisExtrait,
  type ApercuTerritoire, type ExtraitClimat, type FaitApercu,
} from "./apercu-territoire.ts";
import { buildClimatFacts, CLIMAT_METRICS, type GwlScenarios } from "./decision/climat-facts.ts";
import {
  CLES_APERCU, HORIZONS_APERCU, lireColumnMap, valeurDrias,
} from "../../scripts/build-apercu-climat.mjs";

// CONTRATS DE L'APERÇU TERRITOIRE (FUT-30).
//
// « L'aperçu apparaît » et « l'aperçu dit vrai » sont deux assertions distinctes (AGENTS.md) : la
// plupart des tests ci-dessous portent sur le TEXTE rendu et sur les NOMBRES, pas sur la présence d'un
// bloc. Aucun appel réseau, aucun LLM : tout se joue sur des scénarios DRIAS écrits ici, et sur
// l'extrait réel versionné dans le dépôt.

// ── Fabrique de scénarios : valeurs projetées et anomalies, identiques aux trois horizons ─────────────
type Axe = { projete: number | null; anomalie: number | null };
function scenarios(axes: { chaud?: Axe; nuits?: Axe; feu?: Axe }): GwlScenarios {
  const v: Record<string, number> = {};
  const poser = (abs: string, ano: string, a?: Axe) => {
    if (a?.projete != null) v[abs] = a.projete;
    if (a?.anomalie != null) v[ano] = a.anomalie;
  };
  poser("NORTX35D_yr", "ATX35D_yr", axes.chaud);
  poser("NORTR_yr", "ATR_yr", axes.nuits);
  poser("NORIFM40_yr", "AIFM40_yr", axes.feu);
  return { gwl15: { h: "2050", v: { ...v } }, gwl20: { h: "2050", v: { ...v } }, gwl30: { h: "2050", v: { ...v } } };
}

// Les textes lient nombres et unités par des insécables ; les attentes s'écrivent en espaces simples.
const plat = (s: string) => s.replace(/\u00a0/g, " ");
const faitsDe = (a: ApercuTerritoire): FaitApercu[] => (a.etat === "faits" ? a.faits : []);
const texteDe = (f: FaitApercu) => [f.theme, f.valeur, f.periode, f.horizon, f.mesure, f.limite ?? "", f.source].join(" ");

const extrait = JSON.parse(readFileSync("src/data/apercu-climat-communes.json", "utf8")) as ExtraitClimat;
const reel = (insee: string, nom: string) => construireApercu(nom, scenariosDepuisExtrait(extrait, insee));

// ── T1 : plus de timeout destructeur ────────────────────────────────────────────────────────────────
test("T1 : l'aperçu ne dépend plus d'un Promise.race ni d'un plafond de temps pour exister", () => {
  const src = readFileSync("src/lib/quartier-preview.ts", "utf8");
  const code = src.replace(/^\s*\/\/.*$/gm, ""); // le commentaire raconte l'ancien chemin, le code non
  assert.doesNotMatch(code, /Promise\.race/);
  assert.doesNotMatch(code, /setTimeout/);
  assert.doesNotMatch(code, /TIMEOUT/);
  // Synchrone : rien à attendre, donc rien qui puisse expirer.
  assert.match(code, /export function getApercuTerritoire\(/);
  assert.doesNotMatch(code, /async function/);
});

// ── T2 : spécificité, sur les valeurs ET le texte ───────────────────────────────────────────────────
test("T2 : deux communes aux données différentes rendent deux textes différents, fidèles à leurs nombres", () => {
  const a = construireApercu("Alpha", scenarios({ chaud: { projete: 14.2, anomalie: 9.1 } }));
  const b = construireApercu("Bêta", scenarios({ chaud: { projete: 4.4, anomalie: 3.2 } }));
  const [fa] = faitsDe(a);
  const [fb] = faitsDe(b);
  assert.equal(plat(fa.valeur), "14 jours par an au-dessus de 35 °C");
  assert.equal(plat(fa.periode), "vers 2050, contre 5 jours sur la période de référence 1976-2005");
  assert.equal(plat(fb.valeur), "4 jours par an au-dessus de 35 °C");
  assert.equal(plat(fb.periode), "vers 2050, contre 1 jour sur la période de référence 1976-2005");
  assert.notEqual(texteDe(fa), texteDe(fb));
});

test("T2 : sur l'extrait réel, des communes différentes ne reçoivent pas toutes le même aperçu", () => {
  const rendus = [
    ["17300", "La Rochelle"], ["29019", "Brest"], ["24322", "Périgueux"], ["13201", "Marseille 1er"],
    ["38185", "Grenoble"], ["17107", "Ciré-d'Aunis"],
  ].map(([i, n]) => faitsDe(reel(i, n)).map((f) => `${f.valeur} ${f.periode}`).join(" | "));
  assert.ok(new Set(rendus).size >= 4, `trop peu de rendus distincts : ${rendus.join(" / ")}`);
  // Et le texte suit la donnée : Brest ne dépasse pas l'entier sur les jours > 35 °C, il passe aux nuits.
  assert.equal(faitsDe(reel("29019", "Brest"))[0].axe, "nuitsTropicales");
});

// ── T3 : déterminisme ───────────────────────────────────────────────────────────────────────────────
test("T3 : même commune, même donnée, même aperçu", () => {
  const sc = scenarios({ chaud: { projete: 7.3, anomalie: 5.1 }, feu: { projete: 22, anomalie: 8 } });
  assert.deepEqual(construireApercu("Gamma", sc), construireApercu("Gamma", sc));
  assert.deepEqual(reel("13201", "Marseille 1er"), reel("13201", "Marseille 1er"));
});

// ── T4 : chaque fait porte la source réellement utilisée ────────────────────────────────────────────
test("T4 : chaque fait affiché porte sa source, DRIAS, et aucune liste de bases non utilisées ne subsiste", () => {
  for (const insee of ["17300", "13201", "29019", "38185"]) {
    for (const f of faitsDe(reel(insee, insee))) {
      assert.match(f.source, /DRIAS/);
      assert.match(f.source, /Météo-France/);
    }
  }
  // L'ancien pied de bloc venait de deriveQuartierSources : il ne doit plus alimenter l'aperçu.
  const page = readFileSync("src/app/(public)/territoire/[insee]/debloquer/TerritoryUnlockPreview.tsx", "utf8");
  assert.doesNotMatch(page, /Sources mobilisées/);
  assert.doesNotMatch(readFileSync("src/lib/quartier-preview.ts", "utf8"), /deriveQuartierSources/);
});

// ── T5 : horizon et période ─────────────────────────────────────────────────────────────────────────
test("T5 : un fait projeté porte toujours son horizon, son équivalence France et sa référence datée", () => {
  for (const insee of Object.keys(extrait.communes).filter((_, i) => i % 97 === 0)) {
    for (const f of faitsDe(reel(insee, insee))) {
      assert.match(f.periode, /^vers 2050, contre .+ sur la période de référence 1976-2005$/);
      assert.equal(f.horizon, "horizon 2050 · +2 °C dans le monde, soit +2,7 °C en France");
    }
  }
});

test("T5 : sans référence reconstructible, pas de fait (une valeur projetée seule serait une statistique orpheline)", () => {
  const a = construireApercu("Delta", scenarios({ chaud: { projete: 12, anomalie: null } }));
  assert.equal(a.etat, "sans_fait");
});

// ── T6 : grain ──────────────────────────────────────────────────────────────────────────────────────
test("T6 : aucun texte ne transforme une valeur communale en vérité d'adresse, de secteur ou de logement", () => {
  const interdits = /\b(ici|adresse|secteur|quartier|autour|logement|bien|parcelle|rue)\b/i;
  for (const insee of Object.keys(extrait.communes).filter((_, i) => i % 53 === 0)) {
    for (const f of faitsDe(reel(insee, "Commune"))) {
      assert.equal(f.grain, "commune");
      assert.doesNotMatch(texteDe(f), interdits, texteDe(f));
    }
  }
  const sansFait = readFileSync("src/app/(public)/territoire/[insee]/debloquer/TerritoryUnlockPreview.tsx", "utf8");
  assert.match(sansFait, /valeur établie pour la commune/);
});

// ── T7 : absence ────────────────────────────────────────────────────────────────────────────────────
test("T7 : une donnée absente ne produit jamais de valeur inventée", () => {
  assert.equal(construireApercu("Epsilon", null).etat, "sans_fait");
  assert.equal(construireApercu("Epsilon", {}).etat, "sans_fait");
  // Jours > 35 °C absents : on ne les écrit pas à 0, on passe au candidat suivant.
  const a = construireApercu("Zêta", scenarios({ nuits: { projete: 30.4, anomalie: 20.1 } }));
  const [f] = faitsDe(a);
  assert.equal(f.axe, "nuitsTropicales");
  assert.equal(plat(f.valeur), "30 nuits tropicales par an");
  assert.equal(faitsDe(a).length, 1);
  // Une commune absente de l'extrait (code ville de Paris) : aucun emprunt à un arrondissement.
  assert.equal(reel("75056", "Paris").etat, "sans_fait");
});

// ── T8 : aucun fait retenu ──────────────────────────────────────────────────────────────────────────
test("T8 : sans fait retenu, l'aperçu rend un état explicite, jamais null, et la page le rend toujours", () => {
  // « 0 contre 0 » et « 3 contre 3 » ne se lisent pas : rien n'est fabriqué pour remplir le bloc.
  const a = construireApercu("Êta", scenarios({ chaud: { projete: 0.3, anomalie: 0.2 }, nuits: { projete: 3.4, anomalie: 0.1 } }));
  assert.deepEqual(a, { etat: "sans_fait", commune: "Êta" });
  assert.equal(reel("05023", "Briançon").etat, "sans_fait");

  const page = readFileSync("src/app/(public)/territoire/[insee]/debloquer/page.tsx", "utf8");
  assert.doesNotMatch(page, /\{\s*(preview|apercu)\s*&&/);
  assert.match(page, /<TerritoryUnlockPreview apercu=\{apercu\} \/>/);
  // Le surtitre ne promet pas « un fait » quand il n'y en a aucun.
  assert.match(page, /apercu\.etat === "sans_fait"\s*\?\s*"Aperçu du dossier"/);
  const composant = readFileSync("src/app/(public)/territoire/[insee]/debloquer/TerritoryUnlockPreview.tsx", "utf8");
  assert.match(composant, /apercu\.etat === "sans_fait"/);
  assert.match(composant, /ne met en avant aucun fait isolé/);
});

// ── T9 : aucune sélection sensationnaliste ──────────────────────────────────────────────────────────
test("T9 : l'ordre est fixe ; une valeur extrême ne passe pas devant un candidat prioritaire lisible", () => {
  // Nuits tropicales très élevées, jours > 35 °C modestes mais lisibles : les jours > 35 °C restent premiers.
  const a = construireApercu("Thêta", scenarios({
    chaud: { projete: 2.4, anomalie: 1.9 },
    nuits: { projete: 60, anomalie: 45 },
  }));
  assert.deepEqual(faitsDe(a).map((f) => f.axe), ["joursTresChauds"]);
});

test("T9 : le feu n'apparaît qu'au-delà du seuil des constats non demandés du dossier, et avec sa limite", () => {
  const ambiant = CLIMAT_METRICS.joursFeu.ambientThreshold!;
  const declare = CLIMAT_METRICS.joursFeu.threshold;
  const sous = construireApercu("Iota", scenarios({
    chaud: { projete: 6, anomalie: 4 }, feu: { projete: ambiant - 1, anomalie: 3 },
  }));
  assert.ok(ambiant - 1 >= declare, "le cas doit franchir le seuil déclaré sans franchir l'ambiant");
  assert.deepEqual(faitsDe(sous).map((f) => f.axe), ["joursTresChauds"]);

  const au = construireApercu("Iota", scenarios({
    chaud: { projete: 6, anomalie: 4 }, feu: { projete: ambiant + 1, anomalie: 3 },
  }));
  const feu = faitsDe(au).find((f) => f.axe === "joursFeu")!;
  assert.ok(feu, "le feu doit apparaître au-delà du seuil ambiant");
  assert.match(feu.limite ?? "", /pas la probabilité qu'un incendie se déclare/);
  assert.equal(faitsDe(au).length, 2);
});

test("T9 : jamais plus de deux faits, jamais deux faits de la même famille", () => {
  for (const insee of Object.keys(extrait.communes).filter((_, i) => i % 31 === 0)) {
    const faits = faitsDe(reel(insee, insee));
    assert.ok(faits.length <= 2);
    const chaleur = faits.filter((f) => f.axe === "joursTresChauds" || f.axe === "nuitsTropicales");
    assert.ok(chaleur.length <= 1);
  }
});

// ── T10 : sources lentes ────────────────────────────────────────────────────────────────────────────
test("T10 : l'aperçu primaire n'appelle aucune source réseau, donc aucune ne peut le supprimer", () => {
  for (const fichier of ["src/lib/quartier-preview.ts", "src/lib/apercu-territoire.ts"]) {
    const imports = [...readFileSync(fichier, "utf8").matchAll(/^import[^;]*from\s+"([^"]+)"/gm)].map((m) => m[1]);
    for (const i of imports) {
      assert.match(i, /^(server-only|@\/data\/apercu-climat-communes\.json|@\/lib\/apercu-territoire|\.\/decision\/climat-facts\.ts|\.\/horizons\.ts)$/, `${fichier} importe ${i}`);
    }
    assert.doesNotMatch(readFileSync(fichier, "utf8").replace(/^\s*\/\/.*$/gm, ""), /fetch\(|gatherCommuneEnrichment/);
  }
});

// ── L'extrait : fidèle à DRIAS, et à jour ───────────────────────────────────────────────────────────
test("Extrait : son empreinte est celle du fichier DRIAS présent (sinon, relancer scripts/build-apercu-climat.mjs)", () => {
  const sha = createHash("sha256").update(readFileSync("public/data_climat.json")).digest("hex");
  assert.equal(extrait.source.sha256, sha);
  assert.deepEqual(extrait.cles, CLES_APERCU);
  assert.deepEqual(extrait.horizons, HORIZONS_APERCU);
});

test("Extrait : il rend les mêmes nombres que DRIAS lu par le mapping de drias-json.ts, et les mêmes axes", () => {
  const columnMap = lireColumnMap(readFileSync("src/lib/drias-json.ts", "utf8"));
  const lignes = JSON.parse(readFileSync("public/data_climat.json", "utf8")) as Record<string, unknown>[];
  const echantillon = new Set(["17300", "29019", "13201", "05023", "2B033", "01001", "97411"]);
  let vus = 0;
  for (const row of lignes) {
    const insee = String(row.insee_code).padStart(5, "0");
    if (!echantillon.has(insee)) continue;
    const sc = scenariosDepuisExtrait(extrait, insee)!;
    for (const cle of CLES_APERCU) {
      assert.equal(sc[String(row.scenario)].v[cle], valeurDrias(row[columnMap[cle]]) ?? undefined, `${insee} ${row.scenario} ${cle}`);
    }
    vus++;
  }
  assert.ok(vus >= 15);
  // Et la vérité climatique du dossier lit l'extrait comme elle lit DRIAS.
  const facts = buildClimatFacts(scenariosDepuisExtrait(extrait, "13201"));
  assert.ok(facts && contratRempli(facts.joursFeu));
});
