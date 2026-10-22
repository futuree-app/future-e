// FUT-126 · LES FINITIONS DU RELEVÉ : ce qui change à l'écran ne retire rien, et dit vrai.
//
//   G. le geste et son complément : chaque ligne « À vérifier » de la production (le détail d'un geste) est
//      rendue sous ce geste ; aucune ne se perd en quittant « Données et limites » ;
//   R. la graduation n'a plus de milieu ;
//   S. le glyphe de l'agglomération n'a plus de point plein (le point est celui de l'adresse) ;
//   D. le glossaire : la définition des argiles apparaît là où le terme est lu, en dépliant natif, et ne
//      conclut rien sur le bâtiment ;
//   C. « Constat : » ne préfixe que l'état d'un écart, sans toucher au texte du moteur ;
//   T. la liste complète des contrôles ouvre un nouveau mouvement, et sa phrase dit vrai ;
//   N. le navigateur des échelles ne change que sous le Relevé.
// Les composants sont des `.tsx` : leur source est lue (comme `decision-releve.test.ts`) ; la logique pure
// (`lireDossier`, `definitionsPour`, `statutAffiche`) est exécutée.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mapCommuneToModuleFacts } from "../../lib/decision/module-facts-map.ts";
import { runRules } from "../../lib/decision/materiality-rules.ts";
import { assembleDossier } from "../../lib/decision/decision-assembler.ts";
import { controlesParEchelle } from "../../lib/decision/dossier-view.ts";
import type { IndexCommune } from "../../lib/comparateur-vie.ts";
import type { UserProject } from "../../lib/user-project.ts";
import type { Dossier } from "../../lib/decision/decision-fact.ts";
import { PRODUCT_CONVENTIONS_VERSION, type EvaluationContext } from "../../lib/hard-constraints.ts";
import { hydrateHardConstraints } from "../../lib/hard-constraints-hydrate.ts";
import type { PlaceDirectory } from "../../lib/hard-constraints-resolve.ts";
import { definitionsPour, GLOSSAIRE } from "../../lib/decision/glossaire.ts";
import { lireDossier, lireCarteDuDossier, type EntreeLue } from "./lecture-dossier.ts";

const lire = (p: string) => readFileSync(p, "utf8");
const ENTREE = lire("src/components/releve/EntreeReleve.tsx");
const PRIMITIVES = lire("src/components/releve/primitives.tsx");
const CONTROLES = lire("src/components/releve/ControlesReleve.tsx");
const NAVIGATEUR = lire("src/components/report/EchelleNavigator.tsx");

const DIR: PlaceDirectory = { byName: () => null, plmByName: () => null };
const entree = (over: Partial<IndexCommune> = {}): IndexCommune => ({
  insee: "17300", nom: "La Rochelle", dept: "17", region: "NA", lat: 46.16, lon: -1.15,
  population: 77000, densite: 2700, mer_centre_km: 1, altitude: 5, clim: {}, pct: {}, ...(over as IndexCommune),
});
const projet = (prefs: { key: string; weight: number }[]): UserProject => ({
  posture: "recherche", intent: "achat", rawText: null,
  parsed: { reformulation: "x", hardConstraints: {}, preferences: prefs } as UserProject["parsed"], updatedAt: "1970-01-01T00:00:00.000Z",
});
function dossier(e: IndexCommune, p: UserProject): Dossier {
  const mf = mapCommuneToModuleFacts(e, {}, { hasAddress: false, tailleVille: 138_236, tailleVilleSource: "urban_unit" });
  const ctx: EvaluationContext = {
    constraints: hydrateHardConstraints({}, DIR),
    point: { lat: mf.lat, lon: mf.lon, grain: "commune_reference", source: "commune_centroid", label: mf.nom },
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION,
  };
  return assembleDossier(runRules(mf, p, ctx), p, "commune", e.nom);
}
// La Rochelle de la recette, réduite à ce que les règles lisent : un aéroport à 2,3 km, une grande
// agglomération, des priorités sur le calme, la taille et la vie locale.
const RECETTE = dossier(
  entree({ calmeSonore: { score: 8, sourceDominante: "aero", distanceKm: 2.3 } } as Partial<IndexCommune>),
  projet([{ key: "calme_sonore", weight: 2 }, { key: "eviter_grandes_villes", weight: 3 }, { key: "vie_locale", weight: 2 }]),
);

/** Toutes les entrées qu'un dossier rend dans le Relevé : la minute et la liste complète des contrôles. */
function entrees(d: Dossier): EntreeLue[] {
  const minute = lireDossier(d).sections.flatMap((s) => s.entrees);
  const controles = controlesParEchelle(d).flatMap((g) => g.cards.map((c) => lireCarteDuDossier(d, c)));
  return [...minute, ...controles];
}
/** Les compléments de geste qu'une entrée rend sous ses gestes : la carte, ses côtés, ses constats détaillés. */
function complementsRendus(e: EntreeLue): string[] {
  return [
    e.geste?.detail, ...e.cotes.map((c) => c.geste?.detail),
    ...e.detailles.flatMap(complementsRendus),
  ].filter((t): t is string => Boolean(t));
}

// ── G. Le geste et son complément ───────────────────────────────────────────────────────────

test("G1. chaque ligne « À vérifier » est le complément d'un geste rendu : aucune ne se perd", () => {
  const toutes = entrees(RECETTE);
  const lignes = toutes.flatMap((e) => e.aVerifier.map((l) => ({ e, l })));
  assert.ok(lignes.length > 0, "le cas doit porter au moins un complément de geste (sinon le test ne prouve rien)");
  for (const { e, l } of lignes) assert.ok(complementsRendus(e).includes(l), `« ${l} » n'est rendu sous aucun geste`);
  // Le complément du bruit, tel que la recette l'a lu dans « Données et limites ».
  assert.ok(lignes.some(({ l }) => /carte de bruit/.test(l)));
});

test("G2. le Relevé rend le complément sous le geste, et « Données et limites » ne porte plus « À vérifier »", () => {
  assert.match(ENTREE, /detail=\{e\.geste\.detail\}/);
  assert.match(ENTREE, /detail=\{c\.geste\.detail\}/);
  assert.match(ENTREE, /detail=\{d\.geste\.detail\}/);
  assert.match(ENTREE, /\{detail \? <p className=\{s\.nuance\}/);
  const zone = ENTREE.slice(ENTREE.indexOf("function DonneesEtLimites"), ENTREE.indexOf("function textesDe"));
  assert.doesNotMatch(zone, /À vérifier|e\.aVerifier/);
  assert.match(zone, /Méthode du signal/);
  assert.match(zone, /if \(e\.methode\.length \+ e\.detailles\.length === 0\) return null;/);
});

// ── R. La graduation ────────────────────────────────────────────────────────────────────────

test("R1. la graduation garde ses deux pôles et n'a plus de milieu", () => {
  const regle = PRIMITIVES.slice(PRIMITIVES.indexOf("export function RegleDeRang"), PRIMITIVES.indexOf("const MESURE"));
  assert.match(regle, /<span>moins favorable<\/span>/);
  assert.match(regle, /<span>plus favorable<\/span>/);
  assert.doesNotMatch(regle, /<span>communes de France<\/span>/);
  assert.match(regle, /aria-label=\{`Position de la commune parmi les communes de France/, "l'univers reste dit au lecteur d'écran");
});

// ── S. Le glyphe de l'agglomération ─────────────────────────────────────────────────────────

test("S1. l'agglomération est un cercle doublé, sans point plein (le point est l'adresse)", () => {
  const glyphe = PRIMITIVES.slice(PRIMITIVES.indexOf('grain === "unite_urbaine"'), PRIMITIVES.indexOf('grain === "secteur"'));
  const cercles = glyphe.match(/<circle [^>]*\/>/g) ?? [];
  assert.equal(cercles.length, 2);
  for (const c of cercles) assert.match(c, /fill="none"/, `anneau plein : ${c}`);
  assert.doesNotMatch(glyphe, /fill="currentColor"/);
  // Le libellé textuel du grain est conservé.
  assert.match(lire("src/components/releve/marge.ts"), /unite_urbaine: "à l'échelle de l'agglomération"/);
});

test("S2. une rubrique d'échelle prend la forme de l'emblème : losange vide pour Logement", () => {
  assert.match(CONTROLES, /logement: "adresse"/);
  assert.doesNotMatch(CONTROLES, /logement: "batiment"/);
});

// ── D. Le glossaire ─────────────────────────────────────────────────────────────────────────

test("D1. la définition des argiles apparaît là où le terme est lu, une fois, et seulement là", () => {
  assert.deepEqual(definitionsPour(["À cette adresse, le sol est exposé au retrait-gonflement des argiles."]).map((d) => d.cle), ["retrait-gonflement-argiles"]);
  assert.deepEqual(definitionsPour(["Retrait gonflement des sols argileux"]).length, 0, "le motif ne déborde pas sur un autre libellé");
  assert.equal(definitionsPour(["le retrait-gonflement des argiles", "Retrait-gonflement des argiles, encore"]).length, 1, "une fois par carte");
  assert.equal(definitionsPour(["L'exposition de la commune à l'inondation"]).length, 0);
  assert.equal(definitionsPour([undefined, null, ""]).length, 0);
});

test("D2. une définition explique sans conclure : l'aléa n'est pas un dommage, aucun chiffre", () => {
  for (const d of GLOSSAIRE) {
    assert.match(d.question, /\?$/);
    assert.doesNotMatch(d.definition, /\d/, `${d.cle} : une définition n'apporte aucun chiffre`);
  }
  const argiles = GLOSSAIRE.find((d) => d.cle === "retrait-gonflement-argiles")!;
  assert.match(argiles.definition, /ne dit pas si ce bâtiment a subi des dégâts/);
});

test("D4. un dépliant en ligne offre 44 px au doigt sur écran tactile", () => {
  assert.match(lire("src/components/releve/releve.module.css"), /@media \(pointer: coarse\) \{ \.details summary \{ display: flex; align-items: center; min-height: 44px; \} \}/);
});

test("D3. la définition est un dépliant natif (clavier, toucher), jamais une infobulle au survol", () => {
  assert.match(ENTREE, /definitionsPour\(textesDe\(e\)\)\.map\(\(d\) => \(\s*<details key=\{d\.cle\}/);
  assert.match(ENTREE, /<summary>\{d\.question\}<\/summary>/);
  assert.doesNotMatch(ENTREE, /title=\{d\.|onMouseEnter/);
});

// ── C. Critère et constat ───────────────────────────────────────────────────────────────────

test("C1. « Constat : » préfixe l'état d'un écart, et lui seul ; le texte du moteur est intact", async () => {
  const { statutAffiche } = await import("./statut-affiche.ts");
  assert.equal(statutAffiche({ nature: "mismatch", statut: "Une grande agglomération" }), "Constat : une grande agglomération");
  assert.equal(statutAffiche({ nature: "mismatch", statut: "5 % les moins favorables" }), "Constat : 5 % les moins favorables");
  assert.equal(statutAffiche({ nature: "mismatch", statut: "DPE F ou G" }), "Constat : DPE F ou G", "un sigle garde sa capitale");
  assert.equal(statutAffiche({ nature: "verification", statut: "Aléa moyen ou fort" }), "Aléa moyen ou fort");
  assert.equal(statutAffiche({ nature: "mismatch", statut: undefined }), "");
  // Sur le cas de la recette : la carte de taille porte bien un état, que le moteur n'a pas réécrit.
  const taille = entrees(RECETTE).find((e) => e.sujet === "une ville à taille humaine");
  assert.equal(taille?.statut, "Une grande agglomération");
});

// ── T. La transition vers les contrôles ─────────────────────────────────────────────────────

test("T1. la liste complète ouvre un mouvement, dit ce qu'elle contient, et se tait sans rubrique", () => {
  assert.match(CONTROLES, /\$\{s\.controles\}/);
  assert.match(CONTROLES, /<Registre as="h2"/);
  assert.match(CONTROLES, /groupes\.length > 0 \? \(\s*<p className=\{s\.dense\}>/);
  assert.match(CONTROLES, /tous les contrôles établis à son échelle, y compris ceux déjà cités/);
  // Ce que la phrase affirme est vrai : chaque rubrique reprend TOUTE la section des vérifications.
  const verifs = RECETTE.sections.find((s) => s.key === "verifications")?.cards.length ?? 0;
  assert.equal(controlesParEchelle(RECETTE).reduce((n, g) => n + g.cards.length, 0), verifs);
  assert.match(CONTROLES, /<span className=\{s\.siFerme\}>Déplier<\/span><span className=\{s\.siOuvert\}>Replier<\/span>/);
});

// ── N. Le navigateur des échelles ───────────────────────────────────────────────────────────

test("N1. le navigateur ne change que sous le Relevé : casse normale et air en bas, classique intact", () => {
  assert.match(NAVIGATEUR, /presentation = "classique"/);
  assert.match(NAVIGATEUR, /\$\{releve \? "lg:pb-8 " : ""\}\$\{className\}/);
  assert.match(NAVIGATEUR, /releve \? r\.etiquette : "font-mono text-\[10px\] tracking-\[0\.12em\] uppercase text-ghost"/);
  assert.match(lire("src/app/(account)/rapport/page.tsx"), /className="lg:w-\[280px\]"\s+presentation=\{presentation\}/);
});
