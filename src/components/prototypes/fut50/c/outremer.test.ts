import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { creerLecteurOutremer, seuilDe, TERRITOIRES_OUTREMER } from "../../../../lib/outremer/climat-outremer.ts";
import { gasparCouvre, lireChaleurOutremer, lireHiversOutremer, lireRisquesHorsGaspar, lireTailleOutremer, nombre } from "./outremer.ts";
import type { LecturePastille, Lieu } from "./pastilles.ts";

// FUT-50 × FUT-104 · La pastille « chaleur » d'une commune ultramarine dit les faits SocleOM de son territoire, sans
// verdict ni convention métropolitaine. Les chiffres témoins sont lus dans les données réelles (src/data/outremer).
const L = creerLecteurOutremer(
  JSON.parse(readFileSync("src/data/outremer/climat-outremer.json", "utf8")),
  JSON.parse(readFileSync("src/data/outremer/communes-outremer.json", "utf8")),
);
const lieu = (code: string): Lieu => {
  const e = L.getEntiteOutremer(code)!;
  return { type: "commune", libelle: e.nomComplet, commune: e.nomComplet, insee: code };
};
const chaleur = (code: string) => lireChaleurOutremer(lieu(code), L.lireClimatOutremer(code)!);
const tout = (l: LecturePastille) => JSON.stringify(l);

test("seuilDe : le comparateur et le seuil de chaque indicateur de chaleur, lus dans son libellé", () => {
  const ind = JSON.parse(readFileSync("src/data/outremer/climat-outremer.json", "utf8")).indicateurs as Record<string, { libelle: string }>;
  const s = (code: string, famille: "chaleur_jour" | "chaleur_nuit") => seuilDe({ libelle: ind[code].libelle, famille });
  assert.deepEqual(s("TX31D", "chaleur_jour"), { grandeur: "maximale", comparateur: "≥", valeurC: 31 });
  assert.deepEqual(s("SU", "chaleur_jour"), { grandeur: "maximale", comparateur: ">", valeurC: 25 });
  assert.deepEqual(s("TN25D", "chaleur_nuit"), { grandeur: "minimale", comparateur: "≥", valeurC: 25 });
  assert.deepEqual(s("TR25D", "chaleur_nuit"), { grandeur: "minimale", comparateur: ">", valeurC: 25 });
  assert.deepEqual(s("TR", "chaleur_nuit"), { grandeur: "minimale", comparateur: ">", valeurC: 20 });
  for (const t of Object.values(TERRITOIRES_OUTREMER)) {
    if (!t.reperes) continue;
    assert.ok(s(t.reperes.chaleurJour, "chaleur_jour"), `${t.id} jour`);
    assert.ok(s(t.reperes.chaleurNuit, "chaleur_nuit"), `${t.id} nuit`);
  }
});

test("Saint-Denis : 31 °C, référence 1991-2020, +2,0 °C régional, chiffres lus dans les données", () => {
  const l = chaleur("97411");
  assert.equal(l.commune, "Saint-Denis (La Réunion)");
  const [j, n] = l.fait!.mesures!;
  assert.equal(j!.valeur, "47");
  assert.equal(j!.unite, "journées par an");
  assert.equal(j!.legende, "à au moins 31 °C à l'horizon 2050, contre 5,4 sur 1991-2020");
  assert.equal(n!.valeur, "69");
  assert.equal(n!.legende, "sans descendre sous 25 °C à l'horizon 2050, contre 16 sur 1991-2020");
  assert.equal(j!.bascule, undefined, "pas de bascule 30/35 °C outre-mer");
  assert.equal(l.fait!.grain, "secteur", "un point de grille, pas la commune entière");
  assert.match(l.fait!.texte, /\+2,0 °C pour La Réunion, par rapport à 1850-1900/);
  assert.match(l.fait!.source, /SocleOM-Climat-2025, référence 1991-2020/);
  // Dispersion des simulations et variation géographique : deux phrases distinctes, jamais une « incertitude ».
  assert.ok(l.methode!.some((m) => /entre 43 et 52 journées en 2050 : c'est la plage centrale de l'ensemble des simulations/.test(m)));
  assert.ok(l.methode!.some((m) => /Ailleurs dans la commune, de 0 à 47 journées en 2050/.test(m)));
  assert.doesNotMatch(tout(l), /incertitude|optimiste|pessimiste/i);
});

test("Chaque territoire couvert lit ses propres indicateurs, sans verdict ni convention métropolitaine", () => {
  const attendu: [string, RegExp, RegExp | null][] = [
    ["97209", /à au moins 33 °C/, /sans descendre sous 25 °C/], // Fort-de-France
    ["97120", /à au moins 33 °C/, /sans descendre sous 25 °C/], // Pointe-à-Pitre
    ["97611", /à au moins 32 °C/, /sans descendre sous 25 °C/], // Mamoudzou
    ["97302", /à au moins 35 °C/, /sans descendre sous 24 °C/], // Cayenne : repère de Météo-France pour la Guyane
    ["98818", /à au moins 32 °C/, /sans descendre sous 24 °C/], // Nouméa
    ["98735", /à au moins 32 °C/, /sans descendre sous 26 °C/], // Papeete
    ["97801", /à au moins 33 °C/, /sans descendre sous 25 °C/], // Saint-Martin
    ["97701", /à au moins 33 °C/, /sans descendre sous 25 °C/], // Saint-Barthélemy
  ];
  for (const [code, jour, nuit] of attendu) {
    const l = chaleur(code);
    const [j, n] = l.fait!.mesures!;
    assert.match(j!.legende, jour, code);
    if (nuit) assert.match(n!.legende, nuit, code);
    assert.equal(l.pourVous.signal, "information", code);
    assert.doesNotMatch(tout(l), /1976-2005|2,7 °C en France|Plutôt (favorable|défavorable)|parmi les \d+ %|communes comparées|DRIAS · /, code);
    const lecture = L.lireClimatOutremer(code)!;
    assert.equal(lecture.statut, "integree");
    if (lecture.statut === "integree") {
      // Chaque valeur affichée est celle de la donnée, à l'arrondi près.
      const vj = lecture.indicateurs.find((i) => i.code === lecture.territoire.reperes!.chaleurJour)!.horizons["2050"].valeur!.mediane!;
      assert.equal(j!.valeur, nombre(vj), code);
      assert.match(l.fait!.texte, new RegExp(`\\+${String(lecture.niveaux["2050"].toFixed(1)).replace(".", ",")} °C pour `), code);
    }
  }
  assert.equal(L.getEntiteOutremer("97209")!.nomComplet, "Fort-de-France (Martinique)");
  assert.equal(L.getEntiteOutremer("97801")!.nomComplet, "Saint-Martin");
});

test("Sans couverture : la raison, sans chiffre de substitution, et les cinq statuts restent distincts", () => {
  const cas: [string, string][] = [
    ["98736", "point_de_reference_non_verifie"], ["98754", "point_de_reference_non_verifie"], // Pirae, Tumaraa
    ["98713", "hors_grille"], ["98731", "hors_grille"], ["98719", "hors_grille"], // Arutua, Nuku-Hiva, Gambier
    ["98748", "point_de_reference_manquant"], // Taiarapu-Ouest
    ["98613", "source_non_integree"], ["97502", "source_indisponible"], // Uvea, Saint-Pierre
  ];
  const raisons = new Set<string>();
  for (const [code, statut] of cas) {
    const lecture = L.lireClimatOutremer(code)!;
    assert.equal(lecture.statut, statut, code);
    const l = lireChaleurOutremer(lieu(code), lecture);
    assert.equal(l.fait, null, code);
    assert.equal(l.pourVous.signal, "indisponible", code);
    assert.match(l.pourVous.texte, /Aucun chiffre n'est affiché à sa place/, code);
    assert.doesNotMatch(l.pourVous.texte, /\d/, code);
    raisons.add(lecture.statut !== "integree" ? lecture.raison : "");
  }
  assert.ok(raisons.size >= 5, "chaque statut a sa propre raison");
});

test("Les autres priorités outre-mer : jamais une lecture positive par défaut", () => {
  const re = TERRITOIRES_OUTREMER.reunion, pf = TERRITOIRES_OUTREMER["polynesie-francaise"];
  const h = lireHiversOutremer(lieu("97411"), re);
  assert.equal(h.pourVous.signal, "indisponible");
  assert.equal(h.fait, null);
  const t = lireTailleOutremer(lieu("97411"), L.getEntiteOutremer("97411")!, re);
  assert.equal(t.pourVous.signal, "information");
  assert.match(t.fait!.texte, /La commune compte 155 ?\s?634 habitants/);
  assert.doesNotMatch(tout(t), /favorable|correspond à votre|ne correspond pas à votre/i, "aucune classification de taille");
  const r = lireRisquesHorsGaspar(lieu("98735"), pf);
  assert.equal(r.pourVous.signal, "indisponible");
  assert.match(r.pourVous.texte, /ne couvre pas la Polynésie française : son édition officielle n'y recense aucune commune/);
  assert.doesNotMatch(r.pourVous.texte, /propres dispositifs/, "aucune raison non vérifiée");
  assert.doesNotMatch(tout(r), /aucun risque|sans risque/i, "jamais une absence de risque");
  assert.ok(gasparCouvre("97411") && gasparCouvre("97502") && gasparCouvre("97801"));
  assert.ok(!gasparCouvre("98735") && !gasparCouvre("98818") && !gasparCouvre("98613"));
});

test("La route : déléguée au service de l'accueil (garde-fous ultramarins vérifiés dans src/lib/accueil/accueil-public.test.ts)", () => {
  const r = readFileSync("src/app/dev/fut50/api/lecture/route.ts", "utf8").replace(/^\s*\/\/.*$/gm, "");
  assert.match(r, /lireAccueil\(/);
  assert.doesNotMatch(r, /searchParams\.get\("(commune|libelle)"\)/, "le nom du navigateur n'est jamais lu");
});

test("Désignation : chaque territoire se dit avec son article dans une phrase", () => {
  for (const t of Object.values(TERRITOIRES_OUTREMER)) assert.ok(t.designation && t.designation.length >= t.nom.length - 1, t.id);
  assert.equal(TERRITOIRES_OUTREMER.martinique.designation, "la Martinique");
  assert.equal(TERRITOIRES_OUTREMER.reunion.designation, "La Réunion");
  assert.equal(TERRITOIRES_OUTREMER.mayotte.designation, "Mayotte");
  assert.match(lireHiversOutremer(lieu("97209"), TERRITOIRES_OUTREMER.martinique).pourVous.texte, /Pour la Martinique, futur•e/);
});
