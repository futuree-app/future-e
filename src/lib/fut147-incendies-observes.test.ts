// FUT-147 · La mémoire des incendies enregistrés (BDIFF) : la table, ses refus, ses quatre états, et ce
// que les phrases disent. Les cas de référence sont rejoués sur la VRAIE table versionnée
// (`data/bdiff-incendies.json`) et comparés à des valeurs relevées à la main sur les fiches officielles
// du portail le 28/10/2026 (indépendantes du code) :
//   Brasparts (29016)       fiche 2022-5306, 24/07/2022, 1 917 ha, surface « Mesurées »
//   Gonfaron (83067)        fiche 2021-8934, 16/08/2021, 6 832 ha
//   La Garde-Freinet (83063) plus grand feu recensé : 2,95 ha (2013), alors que le feu de Gonfaron l'a traversée
//   Marseille (13055)       217 fiches, plus grand feu 1 065 ha (2009) ; la base ne connaît pas les arrondissements
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  construireTableIncendies, lireExportBdiff, memoireIncendiesDeLaCommune, resolveurCog, departementsAttendus,
  type CampagneAConstruire, type MemoireIncendies, type MouvementCog, type TableIncendies,
} from "./data/bdiff-incendies.ts";
import {
  texteTerritoire, ligneCarteIncendies, celluleIncendies, ligneIncendiesUtile, PHRASES_INTERDITES, LIMITE_SURFACE, hectares, feuNotable, AIDE_INCENDIES_OBSERVES,
} from "./incendies-observes.ts";

const TABLE = JSON.parse(readFileSync(path.join(process.cwd(), "data", "bdiff-incendies.json"), "utf8")) as TableIncendies;
const lire = (insee: string) => memoireIncendiesDeLaCommune(TABLE, insee);

// ── Un export synthétique, au format exact du portail ──────────────────────────────────────────
const ENTETE = 'Année;Numéro;Département;"Code INSEE";"Nom de la commune";"Date de première alerte";"Surface parcourue (m2)";"Surface forêt (m2)";"Précision des surfaces";Nature;"Précision de la donnée"';
function exportDe(annee: number, lignes: string[], annonce = lignes.length, type = "F"): string {
  return [
    '"Certaines données sont associées à l\'ancienne version du formulaire incendie."',
    `"Nombre d'incendies suivant les critères de sélection : ${annonce}"`,
    `"Critères de sélection =>";"Date de première alerte, de : ${annee}-01-01 00:00:00";"Date de première alerte, jusqu'à : ${annee}-12-31 23:59:00";"France entière";"Type de feu : ${type}"`,
    ENTETE,
    ...lignes,
  ].join("\r\n");
}
const ligne = (annee: number, n: number, insee: string, nom: string, m2: number, precision = "Estimées", partielle = "") =>
  `${annee};${n};"${insee.slice(0, 2)}";"${insee}";"${nom}";"${annee}-07-24 12:00:00";${m2};${m2};"${precision}";;"${partielle}"`;
const camp = (annee: number, texte: string, inconnus: string[] = []): CampagneAConstruire => ({ annee, texte, departementsInconnus: inconnus, sha256: "x", luLe: "2026-10-28T00:00:00Z" });
const META = { source: "test", cog: { millesime: "COG 2025", mouvementsSha256: "x" }, licence: { ficheDataGouv: "", mentionExport: "", decision: "" } };
const COMMUNES = new Set(["29016", "34144", "83067"]);
const MVT: MouvementCog[] = [
  { MOD: "32", DATE_EFF: "2019-01-01", TYPECOM_AV: "COM", COM_AV: "34093", TYPECOM_AP: "COM", COM_AP: "34144" },
  { MOD: "32", DATE_EFF: "2019-01-01", TYPECOM_AV: "COM", COM_AV: "34093", TYPECOM_AP: "COMD", COM_AP: "34093" },
];
const construire = (campagnes: CampagneAConstruire[]) => construireTableIncendies({ campagnes, resoudre: resolveurCog(COMMUNES, MVT), meta: META });

test("lecture : l'en-tête est cherché par son contenu, avant comme après le formulaire de 2023", () => {
  const lu = lireExportBdiff(exportDe(2022, [ligne(2022, 5306, "29016", "Brasparts", 19_170_000, "Mesurées")]));
  assert.equal(lu.annonce, 1);
  assert.equal(lu.lignes[0]!["Code INSEE"], "29016");
  assert.match(lu.criteres, /Type de feu : F/);
});

test("construction : la surface est celle de tout le feu, en hectares, et le plus grand feu passe en tête", () => {
  const t = construire([camp(2022, exportDe(2022, [
    ligne(2022, 2572, "29016", "Brasparts", 40_000),
    ligne(2022, 5306, "29016", "Brasparts", 19_170_000, "Mesurées"),
    ligne(2022, 9, "29016", "Brasparts", 300),
  ]))]);
  const e = t.communes["29016"]!;
  assert.equal(e.nombre, 3);
  assert.equal(e.nombre1ha, 2, "un feu de 300 m² est compté, pas listé");
  assert.deepEqual(e.feux.map((f) => [f.numero, f.hectares, f.mesuree]), [[5306, 1917, true], [2572, 4, false]]);
});

test("construction : un feu sous l'ancien code d'une commune fusionnée est rattaché à la commune actuelle, et le dit", () => {
  const t = construire([camp(2019, exportDe(2019, [ligne(2019, 8265, "34093", "Dio-et-Valquières", 124_100)]))]);
  assert.equal(t.communes["34093"], undefined);
  assert.equal(t.communes["34144"]!.feux[0]!.ancienneCommune, "Dio-et-Valquières");
});

test("construction : un code que rien ne rattache est compté à part, jamais attribué", () => {
  const t = construire([camp(2020, exportDe(2020, [ligne(2020, 1, "83999", "Commune inconnue", 50_000)]))]);
  assert.deepEqual(t.meta.nonRattachees, [{ code: "83999", nom: "Commune inconnue", feux: 1 }]);
  assert.deepEqual(Object.keys(t.communes), []);
});

test("construction : une ligne strictement dupliquée est retirée une fois, comptée dans la table", () => {
  const l = ligne(2017, 11816, "83067", "Gonfaron", 725_200);
  const t = construire([camp(2017, exportDe(2017, [l, l]))]);
  assert.equal(t.communes["83067"]!.nombre, 1);
  assert.equal(t.meta.doublonsRetires, 1);
});

test("construction : REFUS plutôt qu'une table fausse", () => {
  assert.throws(() => construire([camp(2021, exportDe(2021, [ligne(2021, 1, "83067", "Gonfaron", 1)], 2))]), /1 lignes pour 2 annoncées/);
  assert.throws(() => construire([camp(2021, exportDe(2020, [ligne(2020, 1, "83067", "Gonfaron", 1)]))]), /ne porte pas sur cette campagne/);
  assert.throws(() => construire([camp(2021, exportDe(2021, [ligne(2021, 1, "83067", "Gonfaron", 1)], 1, "V"))]), /pas limité aux feux de forêt/);
  assert.throws(() => construire([camp(2021, exportDe(2021, [ligne(2021, 1, "83067", "Gonfaron", -5)]))]), /surface illisible/);
  assert.throws(() => construire([camp(2021, exportDe(2021, [ligne(2021, 1, "83067", "Gonfaron", 5), ligne(2021, 1, "83067", "Gonfaron", 6)]))]), /deux fois avec des contenus différents/);
  assert.throws(() => lireExportBdiff("Année;Numéro\n1;2"), /illisible/);
});

test("construction : départements sans aucune fiche et campagnes déclarées inconnues sont gardés", () => {
  const t = construire([camp(2025, exportDe(2025, [ligne(2025, 1, "83067", "Gonfaron", 1)]), ["94", "972"])]);
  assert.deepEqual(t.meta.campagnes["2025"]!.departementsInconnus, ["94", "972"]);
  assert.ok(t.meta.departementsSansFiche.includes("29"));
  assert.equal(departementsAttendus().length, 101);
});

// ── La vraie table ────────────────────────────────────────────────────────────────────────────

test("table versionnée : provenance, période, référentiel et licence sont écrits, la contradiction n'est pas déclarée résolue", () => {
  assert.equal(TABLE.meta.periode, "2006-2025");
  assert.equal(Object.keys(TABLE.meta.campagnes).length, 20);
  for (const c of Object.values(TABLE.meta.campagnes)) assert.match(c.sha256, /^[0-9a-f]{64}$/);
  assert.equal(TABLE.meta.cog.millesime, "COG 2025");
  assert.deepEqual(TABLE.meta.departementsSansFiche, ["75", "92", "93", "973"]);
  assert.deepEqual(TABLE.meta.campagnes["2025"]!.departementsInconnus, ["75", "92", "93", "94", "972"]);
  assert.deepEqual(TABLE.meta.campagnes["2024"]!.departementsInconnus, ["75", "92", "93", "94"]);
  assert.match(TABLE.meta.licence.ficheDataGouv, /Licence Ouverte 2\.0/);
  assert.match(TABLE.meta.licence.mentionExport, /fins commerciales ou publicitaires sont exclues/);
  assert.match(TABLE.meta.licence.decision, /porteur/);
  const feux = Object.values(TABLE.communes).reduce((s, e) => s + e.nombre, 0);
  assert.equal(feux + TABLE.meta.nonRattachees.reduce((s, n) => s + n.feux, 0) + TABLE.meta.doublonsRetires, 52_811, "toutes les fiches des 20 exports");
});

test("Brasparts : la phrase validée, mot pour mot, avec la limite visible et la fiche officielle", () => {
  const m = lire("29016");
  assert.equal(m.etat, "recense");
  const t = texteTerritoire(m, "Brasparts");
  assert.equal(t.phrases[0], "Un incendie dont le départ a été enregistré sur la commune a parcouru 1 917 hectares au total en 2022.");
  assert.equal(t.phrases[1], LIMITE_SURFACE);
  assert.equal(t.fiche?.href, "https://bdiff.agriculture.gouv.fr/incendie/2022/5306");
  assert.ok(t.details.some((d) => /24 juillet 2022 : 1 917 ha parcourus au total, surface mesurée/.test(d)));
  assert.ok(t.details.some((d) => /pas le nombre réel d'incendies/.test(d)), "un compte de fiches, jamais d'incendies réels");
  assert.ok(t.details.some((d) => /avant 2020/.test(d)), "Finistère : hors pourtour méditerranéen");
});

test("Gonfaron : le feu de 2021 est entièrement à sa commune de départ ; La Garde-Freinet n'en garde rien", () => {
  const g = lire("83067");
  assert.equal(g.etat === "recense" && g.entree.feux[0]!.hectares, 6832);
  assert.match(ligneCarteIncendies(g, "Gonfaron", true)!, /départ a été enregistré sur la commune a parcouru 6 832 ha au total en 2021/);
  const gf = lire("83063");
  assert.equal(gf.etat === "recense" && gf.entree.feux[0]!.hectares, 2.95);
  assert.equal(ligneCarteIncendies(gf, "La Garde-Freinet", true), null, "sous 10 ha : silence au comparateur");
  assert.match(texteTerritoire(gf, "La Garde-Freinet").phrases[0]!, /a parcouru 3 hectares au total en 2013/);
  assert.ok(texteTerritoire(gf, "La Garde-Freinet").phrases.includes(LIMITE_SURFACE), "la limite des feux voisins est dite à La Garde-Freinet");
});

test("Marseille : un arrondissement reçoit les faits de toute la ville, et le texte le dit", () => {
  const m = lire("13208");
  assert.equal(m.etat, "recense");
  assert.deepEqual(m.etat === "recense" && m.echelle, { type: "ville", code: "13055" });
  const t = texteTerritoire(m, "Marseille 8e Arrondissement");
  assert.match(t.phrases[0]!, /enregistré à Marseille a parcouru 1 065 hectares au total en 2009/);
  assert.ok(t.phrases.some((p) => /l'ensemble de Marseille : la base ne situe pas les feux par arrondissement/.test(p)));
  assert.match(ligneCarteIncendies(m, "Marseille 8e Arrondissement", true)!, /à Marseille \(l'ensemble de la ville\)/);
  assert.equal(celluleIncendies(m).qualifier, "parti de Marseille, toute la ville");
});

test("Paris : non renseigné, la base n'a aucune fiche pour le département", () => {
  for (const insee of ["75056", "75111"]) {
    const m = lire(insee);
    assert.equal(m.etat, "incomplet");
    assert.equal(m.etat === "incomplet" && m.departementSansFiche, true);
    assert.match(texteTerritoire(m, "Paris").phrases[0]!, /ne renseigne pas cette commune/);
  }
});

test("Lyon : résultat vide hors pourtour méditerranéen, la phrase dit qu'il ne permet pas de conclure", () => {
  const m = lire("69383");
  assert.equal(m.etat, "aucun");
  const t = texteTerritoire(m, "Lyon");
  assert.match(t.phrases[0]!, /ne recense pas de départ de feu de forêt à Lyon de 2006 à 2025/);
  assert.match(t.phrases[1]!, /couverture moins complète avant 2020\. Ce résultat ne permet donc pas de conclure/);
});

test("Val-de-Marne : les campagnes déclarées inconnues sont distinguées d'un résultat vide", () => {
  const vides = Object.keys(TABLE.communes).filter((c) => c.startsWith("94"));
  const sansFiche = ["94028", "94017", "94081"].find((c) => !vides.includes(c))!;
  const m = lire(sansFiche);
  assert.equal(m.etat, "incomplet");
  assert.deepEqual(m.etat === "incomplet" && m.campagnesNonRenseignees, [2024, 2025]);
  assert.match(texteTerritoire(m, "x").phrases[0]!, /nombre d'incendies inconnu pour ce département en 2024 et 2025/);
});

test("Lunas : le feu enregistré sous Dio-et-Valquières garde son ancien nom", () => {
  const m = lire("34144");
  const f = m.etat === "recense" ? m.entree.feux.find((x) => x.ancienneCommune) : undefined;
  assert.equal(f?.ancienneCommune, "Dio-et-Valquières");
});

test("La Réunion : la table couvre l'outre-mer (le comparateur, lui, n'a pas d'outre-mer)", () => {
  const m = lire("97415");
  assert.equal(m.etat === "recense" && m.entree.feux[0]!.hectares, 2700);
});

test("source indisponible : on ne dit rien de plus que l'échec de lecture", () => {
  const m = memoireIncendiesDeLaCommune(null, "29016");
  assert.deepEqual(m, { etat: "indisponible" });
  assert.match(texteTerritoire(m, "Brasparts").phrases[0]!, /n'ont pas pu être lus/);
  assert.equal(celluleIncendies(m).disponible, false);
  assert.equal(ligneCarteIncendies(m, "Brasparts", true), null);
});

test("comparateur : la ligne n'existe que si la priorité feu est déclarée ET qu'un feu de 10 ha est parti de la commune", () => {
  const b = lire("29016");
  assert.equal(ligneCarteIncendies(b, "Brasparts", false), null);
  assert.ok(ligneCarteIncendies(b, "Brasparts", true));
  assert.equal(ligneCarteIncendies(lire("69383"), "Lyon", true), null, "aucun signal pour une commune sans événement");
  assert.equal(ligneCarteIncendies(lire("75111"), "Paris", true), null);
});

test("Dossier comparatif : la ligne n'apparaît qu'avec un feu notable dans le trio, et ne rassure jamais", () => {
  assert.equal(ligneIncendiesUtile([lire("69383"), lire("83063")]), false);
  assert.equal(ligneIncendiesUtile([lire("69383"), lire("29016")]), true);
  assert.equal(celluleIncendies(lire("29016")).palier, "Un feu de 1 917 ha au total en 2022");
  assert.equal(celluleIncendies(lire("69383")).palier, "Pas de feu de 10 ha ou plus enregistré au départ de Lyon (toute la ville)");
  assert.equal(celluleIncendies(lire("69383")).qualifier, "feux partis d'une commune voisine non comptés, base moins complète avant 2020");
  assert.equal(celluleIncendies(lire("75111")).palier, "Base incomplète pour ce département");
  assert.equal(celluleIncendies(lire("75111")).qualifier, "aucune fiche de 2006 à 2025");
  assert.equal(celluleIncendies(lire("94028")).qualifier, "nombre d'incendies inconnu en 2024 et 2025");
});

// Revue indépendante du 28/10/2026 : une cellule vide juxtaposée à un grand feu se lisait comme une sécurité.
test("Dossier comparatif : une cellule sans feu notable porte TOUJOURS ses limites (contre-exemples de la revue)", () => {
  // Gentilly : un départ recensé, aucun de 10 ha, 2024 et 2025 déclarées inconnues par la source.
  const gentilly = celluleIncendies(lire("94044"));
  assert.equal(gentilly.palier, "Pas de feu de 10 ha ou plus enregistré au départ de la commune");
  assert.equal(gentilly.qualifier, "nombre d'incendies inconnu en 2024 et 2025, feux partis d'une commune voisine non comptés, base moins complète avant 2020");
  // Martinique : 2025 inconnue.
  assert.match(celluleIncendies(lire("97202")).qualifier!, /nombre d'incendies inconnu en 2025/);
  // Les Maures : le feu de Gonfaron (2021) a aussi parcouru La Garde-Freinet, dont la cellule est vide.
  assert.equal(ligneIncendiesUtile([lire("83067"), lire("83063")]), true);
  assert.equal(celluleIncendies(lire("83063")).qualifier, "feux partis d'une commune voisine non comptés");
  assert.match(AIDE_INCENDIES_OBSERVES, /un feu venu d'une voisine n'est pas compté/);
  // Toutes les cellules disponibles sans feu notable, sur toute la table : la réserve « voisine » est là.
  for (const insee of Object.keys(TABLE.communes)) {
    const m = lire(insee);
    if (feuNotable(m) || m.etat === "incomplet") continue;
    assert.match(celluleIncendies(m).qualifier ?? "", /feux partis d'une commune voisine non comptés/, insee);
    if (m.etat === "recense" && m.campagnesNonRenseignees.length > 0) assert.match(celluleIncendies(m).qualifier!, /nombre d'incendies inconnu en/, insee);
  }
});

test("Territoire : les années déclarées inconnues sont dans les phrases VISIBLES, pas seulement dans « En savoir plus »", () => {
  const t = texteTerritoire(lire("97202"), "Basse-Pointe");
  assert.ok(t.phrases.includes("La base signale un nombre d'incendies inconnu pour ce département en 2025 : ce relevé peut donc être incomplet."), t.phrases.join(" | "));
  assert.ok(!t.details.some((d) => /inconnu/.test(d)));
  const gentilly = texteTerritoire(lire("94044"), "Gentilly");
  assert.ok(gentilly.phrases.some((p) => /inconnu pour ce département en 2024 et 2025/.test(p)));
});

test("Territoire : un résultat vide en aire méditerranéenne dit aussi qu'il ne permet pas de conclure", () => {
  const t = texteTerritoire({ etat: "aucun", echelle: { type: "commune", code: "83999" }, periode: "2006-2025", mediterranee: true } as MemoireIncendies, "Commune");
  assert.match(t.phrases.join(" "), /ne permet pas de conclure/);
});

test("rattachement : un changement de chef-lieu sous le même nom n'est pas une « ancienne commune » (Conques-en-Rouergue)", () => {
  const f = lire("12218");
  assert.ok(f.etat === "recense" && f.entree.feux.every((x) => x.ancienneCommune === undefined));
  // À la construction : même nom (aux accents et à la casse près) = pas d'ancienne commune ; nom différent = ancienne commune.
  const communes = new Set(["12218", "34144"]);
  const mvt: MouvementCog[] = [
    { MOD: "50", DATE_EFF: "2016-01-01", TYPECOM_AV: "COM", COM_AV: "12076", TYPECOM_AP: "COM", COM_AP: "12218" },
    ...MVT,
  ];
  const t = construireTableIncendies({
    campagnes: [camp(2018, exportDe(2018, [ligne(2018, 8, "12076", "CONQUES EN ROUERGUE", 120_000), ligne(2018, 9, "34093", "Dio-et-Valquières", 120_000)]))],
    resoudre: resolveurCog(communes, mvt),
    nomActuel: (insee) => ({ "12218": "Conques-en-Rouergue", "34144": "Bédarieux" })[insee],
    meta: META,
  });
  assert.equal(t.communes["12218"]!.feux[0]!.ancienneCommune, undefined);
  assert.equal(t.communes["34144"]!.feux[0]!.ancienneCommune, "Dio-et-Valquières");
});

test("phrases : l'incise de l'ancienne commune est fermée par une virgule", () => {
  const insee = Object.keys(TABLE.communes).find((c) => TABLE.communes[c]!.feux[0]?.ancienneCommune);
  assert.ok(insee);
  const t = texteTerritoire(lire(insee), "Actuelle");
  assert.match(t.phrases[0]!, /aujourd'hui rattachée à Actuelle, a parcouru/);
});

test("aucune phrase, dans aucun état, ne rassure ni ne dit « brûlé dans la commune » (9 510 communes + vides + PLM)", () => {
  const codes = [...Object.keys(TABLE.communes), "69383", "75111", "94028", "13208", "01001", "21231"];
  const etats = new Set<string>();
  const vus: MemoireIncendies[] = [...codes.map(lire), { etat: "indisponible" }];
  for (const m of vus) {
    etats.add(m.etat);
    const t = texteTerritoire(m, "Commune");
    const tout = [...t.phrases, ...t.details, ligneCarteIncendies(m, "Commune", true) ?? "", celluleIncendies(m).palier, celluleIncendies(m).qualifier ?? ""];
    for (const p of tout) assert.doesNotMatch(p, PHRASES_INTERDITES, p);
  }
  assert.deepEqual([...etats].sort(), ["aucun", "incomplet", "indisponible", "recense"]);
});

test("hectares : entier à partir de 10 ha, une décimale en dessous", () => {
  assert.equal(hectares(1917), "1 917");
  assert.equal(hectares(14.071), "14");
  assert.equal(hectares(2.95), "3");
  assert.equal(hectares(2.94), "2,9");
  assert.equal(hectares(1), "1");
});
