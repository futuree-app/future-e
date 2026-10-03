import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  construireApercu, scenariosDepuisExtrait,
  type ApercuTerritoire, type ExtraitClimat, type FaitApercu,
} from "./apercu-territoire.ts";
import { buildClimatFacts, CLIMAT_METRICS, type GwlScenarios } from "./decision/climat-facts.ts";
import { carteCompte, CHALEUR, FEUX, formatCompte } from "./accueil/recits.ts";
import { indicatorsDepuisScenarios } from "./accueil/faits.ts";
import {
  CLES_APERCU, HORIZONS_APERCU, lireColumnMap, valeurDrias,
} from "../../scripts/build-apercu-climat.mjs";

// CONTRATS DE L'APERÇU TERRITOIRE (FUT-30).
//
// « L'aperçu apparaît » et « l'aperçu dit vrai » sont deux assertions distinctes (AGENTS.md) : la
// plupart des tests portent sur le TEXTE rendu et sur les NOMBRES. Aucun appel réseau, aucun LLM : tout se
// joue sur des scénarios DRIAS écrits ici, et sur l'extrait réel versionné dans le dépôt.
//
// Phase 1.1 : l'aperçu ne porte plus aucune convention propre. Les tests A à D vérifient qu'il formule
// exactement ce que le produit formule déjà, comme le produit l'écrit.

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

const faitsDe = (a: ApercuTerritoire): FaitApercu[] => (a.etat === "faits" ? a.faits : []);
const texteDe = (f: FaitApercu) =>
  [f.titre, f.valeur, f.comparaison ?? "", f.fait, f.horizon, f.lecture ?? "", f.note, f.limite ?? "", f.source].join(" ");

const extrait = JSON.parse(readFileSync("src/data/apercu-climat-communes.json", "utf8")) as ExtraitClimat;
const reel = (insee: string, nom = insee) => construireApercu(insee, nom, scenariosDepuisExtrait(extrait, insee));
const echantillon = (pas: number) => Object.keys(extrait.communes).filter((_, i) => i % pas === 0);

// ── T1 : plus de timeout destructeur ────────────────────────────────────────────────────────────────
test("T1 : l'aperçu ne dépend plus d'un Promise.race ni d'un plafond de temps pour exister", () => {
  const code = readFileSync("src/lib/quartier-preview.ts", "utf8").replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(code, /Promise\.race/);
  assert.doesNotMatch(code, /setTimeout/);
  assert.doesNotMatch(code, /TIMEOUT/);
  // Synchrone : rien à attendre, donc rien qui puisse expirer.
  assert.match(code, /export function getApercuTerritoire\(/);
  assert.doesNotMatch(code, /async function/);
});

// ── T2 : spécificité, sur les valeurs ET le texte ───────────────────────────────────────────────────
test("T2 : deux communes aux données différentes rendent deux textes différents, fidèles à leurs nombres", () => {
  const [fa] = faitsDe(construireApercu("00001", "Alpha", scenarios({ chaud: { projete: 14.2, anomalie: 9.1 } })));
  const [fb] = faitsDe(construireApercu("00002", "Bêta", scenarios({ chaud: { projete: 4.4, anomalie: 3.2 } })));
  assert.equal(fa.valeur, "14 j/an");
  assert.equal(fa.fait, "14 jours par an à l'horizon 2050, contre 5 sur 1976-2005.");
  assert.equal(fb.valeur, "4 j/an");
  assert.equal(fb.fait, "4 jours par an à l'horizon 2050, contre 1 sur 1976-2005.");
  assert.notEqual(texteDe(fa), texteDe(fb));
});

test("T2 : sur l'extrait réel, des communes différentes ne reçoivent pas toutes le même aperçu", () => {
  const rendus = ["17300", "29019", "24322", "13201", "38185", "17107", "05023"]
    .map((i) => faitsDe(reel(i)).map((f) => `${f.valeur} ${f.comparaison}`).join(" | "));
  assert.ok(new Set(rendus).size >= 5, `trop peu de rendus distincts : ${rendus.join(" / ")}`);
});

// ── T3 : déterminisme ───────────────────────────────────────────────────────────────────────────────
test("T3 : même commune, même donnée, même aperçu", () => {
  const sc = scenarios({ chaud: { projete: 7.3, anomalie: 5.1 }, feu: { projete: 22, anomalie: 8 } });
  assert.deepEqual(construireApercu("00003", "Gamma", sc), construireApercu("00003", "Gamma", sc));
  assert.deepEqual(reel("13201"), reel("13201"));
});

// ── T4 : chaque fait porte la source réellement utilisée ────────────────────────────────────────────
test("T4 : chaque fait affiché porte la source DRIAS de l'accueil, et aucune liste de bases non utilisées ne subsiste", () => {
  for (const insee of ["17300", "13201", "29019", "38185"]) {
    for (const f of faitsDe(reel(insee))) assert.equal(f.source, "DRIAS · Météo-France");
  }
  const composant = readFileSync("src/app/(public)/territoire/[insee]/debloquer/TerritoryUnlockPreview.tsx", "utf8");
  assert.doesNotMatch(composant, /Sources mobilisées/);
  assert.doesNotMatch(readFileSync("src/lib/quartier-preview.ts", "utf8"), /deriveQuartierSources/);
});

// ── T5 : horizon et période ─────────────────────────────────────────────────────────────────────────
test("T5 : un fait projeté porte toujours son horizon et son équivalence France", () => {
  for (const insee of echantillon(97)) {
    for (const f of faitsDe(reel(insee))) {
      assert.match(f.fait, /à l'horizon 2050/);
      assert.equal(f.horizon, "horizon 2050 · +2 °C dans le monde, soit +2,7 °C en France");
    }
  }
});

// ── T6 : grain ──────────────────────────────────────────────────────────────────────────────────────
test("T6 : aucun texte ne transforme une valeur communale en vérité d'adresse, de secteur ou de logement", () => {
  const interdits = /\b(ici|adresse|secteur|quartier|autour|logement|bien|parcelle|rue)\b/i;
  for (const insee of echantillon(53)) {
    for (const f of faitsDe(reel(insee))) {
      assert.doesNotMatch(texteDe(f), interdits, texteDe(f));
    }
  }
  assert.equal(faitsDe(reel("17300"))[0].grain, "commune");
  const composant = readFileSync("src/app/(public)/territoire/[insee]/debloquer/TerritoryUnlockPreview.tsx", "utf8");
  assert.match(composant, /valeur établie pour \{ECHELLE\[fait\.grain\]\}/);
});

// ── T7 : absence ────────────────────────────────────────────────────────────────────────────────────
test("T7 : une donnée absente ne produit jamais de valeur inventée", () => {
  assert.equal(construireApercu("00004", "Epsilon", null).etat, "sans_fait");
  assert.equal(construireApercu("00004", "Epsilon", {}).etat, "sans_fait");
  // Jours > 35 °C absents : on ne les écrit pas à 0, on passe au candidat suivant.
  const [f, ...reste] = faitsDe(construireApercu("00005", "Zêta", scenarios({ nuits: { projete: 30.4, anomalie: 20.1 } })));
  assert.equal(f.axe, "nuitsTropicales");
  assert.equal(f.valeur, "30 nuits/an");
  assert.equal(reste.length, 0);
});

// ── T8 : aucun fait formulable ──────────────────────────────────────────────────────────────────────
test("T8 : sans fait formulable, l'aperçu rend un état explicite, jamais null, et la page le rend toujours", () => {
  assert.deepEqual(construireApercu("00006", "Êta", null), { etat: "sans_fait", commune: "Êta" });

  const page = readFileSync("src/app/(public)/territoire/[insee]/debloquer/page.tsx", "utf8");
  assert.doesNotMatch(page, /\{\s*(preview|apercu)\s*&&/);
  assert.match(page, /<TerritoryUnlockPreview apercu=\{apercu\} \/>/);
  // Le surtitre ne promet pas « un fait » quand il n'y en a aucun.
  assert.match(page, /apercu\.etat === "sans_fait"\s*\?\s*"Aperçu du dossier"/);
  // Et l'état sans fait ne laisse pas croire que futur•e n'a rien trouvé : il dit que le dossier lit.
  const composant = readFileSync("src/app/(public)/territoire/[insee]/debloquer/TerritoryUnlockPreview.tsx", "utf8");
  assert.match(composant, /apercu\.etat === "sans_fait"/);
  assert.match(composant, /Le dossier de \{apercu\.commune\} lit ensemble/);
  assert.doesNotMatch(composant.replace(/^\s*\/\/.*$/gm, ""), /aucune donnée|rien trouvé|pas de données/i);
});

// ── T9 : aucune sélection sensationnaliste ──────────────────────────────────────────────────────────
test("T9 : l'ordre est fixe ; une valeur extrême ne passe pas devant le premier candidat formulable", () => {
  const a = construireApercu("00007", "Thêta", scenarios({
    chaud: { projete: 0.4, anomalie: 0.3 },
    nuits: { projete: 60, anomalie: 45 },
  }));
  assert.deepEqual(faitsDe(a).map((f) => f.axe), ["joursTresChauds"]);
});

test("T9 : jamais plus de deux faits, jamais deux de la même famille, et aucun emplacement rempli d'office", () => {
  for (const insee of echantillon(31)) {
    const faits = faitsDe(reel(insee));
    assert.ok(faits.length >= 1 && faits.length <= 2);
    assert.ok(faits.filter((f) => f.axe !== "joursFeu").length <= 1);
  }
  // Un seul fait quand le feu n'est pas éligible : la seconde carte n'est pas comblée.
  assert.equal(faitsDe(reel("17300")).length, 1);
});

// ── T10 : sources lentes ────────────────────────────────────────────────────────────────────────────
test("T10 : l'aperçu primaire n'appelle aucune source réseau, donc aucune ne peut le supprimer", () => {
  const autorises = new Set([
    "server-only", "@/data/apercu-climat-communes.json", "@/lib/apercu-territoire",
    "./decision/climat-facts.ts", "./horizons.ts", "./accueil/recits.ts", "./accueil/faits.ts", "./plm.ts",
  ]);
  for (const fichier of ["src/lib/quartier-preview.ts", "src/lib/apercu-territoire.ts"]) {
    const src = readFileSync(fichier, "utf8");
    for (const m of src.matchAll(/^import[^;]*from\s+"([^"]+)"/gm)) assert.ok(autorises.has(m[1]), `${fichier} importe ${m[1]}`);
    assert.doesNotMatch(src.replace(/^\s*\/\/.*$/gm, ""), /fetch\(|gatherCommuneEnrichment/);
  }
});

// ── A : fidélité au moteur ──────────────────────────────────────────────────────────────────────────
test("A : un fait que le moteur ne lit pas n'est jamais formulé par l'aperçu", () => {
  // Valeur projetée absente : `buildClimatFacts` n'a rien (projete null), l'aperçu non plus.
  const sc = scenarios({ chaud: { projete: null, anomalie: 2 }, nuits: { projete: null, anomalie: 2 } });
  assert.equal(buildClimatFacts(sc), null);
  assert.equal(construireApercu("00008", "Iota", sc).etat, "sans_fait");
});

test("A : chaque fait affiché est, mot pour mot, la carte que l'accueil formule pour la même donnée", () => {
  for (const insee of echantillon(211)) {
    const sc = scenariosDepuisExtrait(extrait, insee)!;
    const [chaleur] = faitsDe(reel(insee));
    const canon = carteCompte(CHALEUR, indicatorsDepuisScenarios(sc), "2050")!;
    assert.equal(chaleur.valeur, canon.valeur);
    assert.equal(chaleur.comparaison, canon.comparaison ?? null);
    assert.equal(chaleur.fait, canon.fait);
    assert.equal(chaleur.titre, canon.titre);
  }
});

test("A : l'aperçu ne retient aucun seuil propre (une valeur proche de zéro reste un fait formulé)", () => {
  // La Phase 1 écartait « moins d'un jour, comme en 1976-2005 ». Le produit le formule ; l'aperçu aussi.
  const [f] = faitsDe(construireApercu("00009", "Kappa", scenarios({ chaud: { projete: 0.3, anomalie: 0.1 } })));
  assert.equal(f.valeur, "< 1 j/an");
  assert.equal(f.fait, "Moins d'une journée par an à l'horizon 2050, comme sur 1976-2005.");
  const src = readFileSync("src/lib/apercu-territoire.ts", "utf8").replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(src, /Math\.round|toFixed|contratRempli/);
});

// ── B : arrondi ─────────────────────────────────────────────────────────────────────────────────────
test("B : 0,4 / 0,6 / 1,1 s'écrivent comme l'accueil les écrit, jamais « 1 jour » pour 0,6", () => {
  const ecrit = (x: number) => faitsDe(construireApercu("00010", "Lambda", scenarios({ chaud: { projete: x, anomalie: 0 } })))[0];
  assert.equal(ecrit(0.4).valeur, "< 1 j/an");
  assert.equal(ecrit(0.6).valeur, "< 1 j/an");
  assert.equal(ecrit(1.1).valeur, "1 j/an");
  assert.match(ecrit(0.6).fait, /^Moins d'une journée par an/);
  assert.equal(formatCompte(0.6), "moins d'une journée");
});

// ── C : feu ─────────────────────────────────────────────────────────────────────────────────────────
test("C : le feu n'apparaît qu'au-delà du seuil ambiant du dossier, avec la formulation et la limite de l'accueil", () => {
  const ambiant = CLIMAT_METRICS.joursFeu.ambientThreshold!;
  const declare = CLIMAT_METRICS.joursFeu.threshold;
  assert.ok(ambiant - 1 >= declare, "le cas sous le seuil doit franchir le déclaré sans franchir l'ambiant");
  const sous = construireApercu("00011", "Mu", scenarios({ chaud: { projete: 6, anomalie: 4 }, feu: { projete: ambiant - 1, anomalie: 3 } }));
  assert.deepEqual(faitsDe(sous).map((f) => f.axe), ["joursTresChauds"]);

  const sc = scenarios({ chaud: { projete: 6, anomalie: 4 }, feu: { projete: ambiant, anomalie: 3 } });
  const feu = faitsDe(construireApercu("00011", "Mu", sc)).find((f) => f.axe === "joursFeu")!;
  const canon = carteCompte(FEUX, indicatorsDepuisScenarios(sc), "2050")!;
  assert.equal(feu.titre, "Météo propice aux feux");
  assert.equal(feu.fait, canon.fait);
  assert.equal(feu.limite, FEUX.limite);
  assert.match(feu.limite ?? "", /conditions météorologiques favorables aux feux/);
  assert.doesNotMatch(texteDe(feu), /risque d'incendie|incendies? (se )?(produi|survien)/i);
});

// ── D : Paris, Lyon, Marseille ──────────────────────────────────────────────────────────────────────
test("D : les codes ville n'empruntent JAMAIS la valeur d'un arrondissement", () => {
  // Le 1er arrondissement ne représente ni Paris, ni Lyon, ni Marseille. Ne pas « corriger » ce cas en
  // passant par DRIAS_CITY_FALLBACK : le nom affiché et le code relèvent de FUT-43.
  for (const ville of ["75056", "69123", "13055"]) assert.equal(reel(ville).etat, "sans_fait");
  for (const fichier of ["src/lib/quartier-preview.ts", "src/lib/apercu-territoire.ts"]) {
    assert.doesNotMatch(readFileSync(fichier, "utf8").replace(/^\s*\/\/.*$/gm, ""), /DRIAS_CITY_FALLBACK/);
  }
});

test("D : un code d'arrondissement est dit « arrondissement », jamais « commune »", () => {
  for (const arr of ["75101", "75107", "69381", "13201"]) {
    for (const f of faitsDe(reel(arr, "Paris"))) assert.equal(f.grain, "arrondissement");
  }
});

// ── L'extrait : fidèle à DRIAS, et à jour ───────────────────────────────────────────────────────────
test("Extrait : son empreinte est celle du fichier DRIAS présent", () => {
  const sha = createHash("sha256").update(readFileSync("public/data_climat.json")).digest("hex");
  assert.equal(
    extrait.source.sha256, sha,
    "public/data_climat.json a changé depuis la génération de src/data/apercu-climat-communes.json : " +
      "l'extrait compact de l'aperçu Territoire doit être régénéré. Lancez " +
      "`node scripts/build-apercu-climat.mjs`, puis committez le fichier produit avec ce changement de DRIAS.",
  );
  assert.deepEqual(extrait.cles, CLES_APERCU);
  assert.deepEqual(extrait.horizons, HORIZONS_APERCU);
});

test("Extrait : il rend les mêmes nombres que DRIAS lu par le mapping de drias-json.ts", () => {
  const columnMap = lireColumnMap(readFileSync("src/lib/drias-json.ts", "utf8"));
  const lignes = JSON.parse(readFileSync("public/data_climat.json", "utf8")) as Record<string, unknown>[];
  const temoins = new Set(["17300", "29019", "13201", "05023", "2B033", "01001", "97411"]);
  let vus = 0;
  for (const row of lignes) {
    const insee = String(row.insee_code).padStart(5, "0");
    if (!temoins.has(insee)) continue;
    const sc = scenariosDepuisExtrait(extrait, insee)!;
    for (const cle of CLES_APERCU) {
      assert.equal(sc[String(row.scenario)].v[cle], valeurDrias(row[columnMap[cle]]) ?? undefined, `${insee} ${row.scenario} ${cle}`);
    }
    vus++;
  }
  assert.ok(vus >= 15);
});
