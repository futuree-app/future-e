// FUT-170 · LE CLIMAT RÉCENT DANS LA LECTURE « ÉVITER LES FORTES CHALEURS » : données réelles, et ce que le texte RACONTE.
//
// Deux familles d'assertions, distinctes (AGENTS.md : « la carte apparaît » et « la carte dit vrai » sont deux
// assertions) :
//   - le fichier : produit depuis la source versionnée, sur les communes et la maille de DRIAS, sans valeur absurde ;
//   - la lecture : le classement ne bouge jamais, la comparaison affichée et les qualificatifs de la phrase parlent de
//     la même période, la référence 1976-2005 reste consultable, aucune moyenne n'est appelée « aujourd'hui ».
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { buildClimatFacts, classifyClimateComfort, reconstructReference, CLIMAT_HORIZON } from "../decision/climat-facts.ts";
import { climatRecentDepuisFichier, verifierFichier, type FichierClimatRecent } from "./climat-recent.ts";
import { lireChaleur, phraseChaleur, type EntreesChaleur, type Lieu } from "./pastilles.ts";
import { formatCompte } from "./recits.ts";

const FICHIER = JSON.parse(readFileSync("src/data/climat-recent-communes.json", "utf8")) as FichierClimatRecent;
const EXTRAIT = JSON.parse(readFileSync("src/data/apercu-climat-communes.json", "utf8")) as {
  horizons: string[]; cles: string[]; communes: Record<string, (number | null)[]>;
};

/** Les scénarios DRIAS d'une commune, depuis l'extrait que lit l'accueil. */
function scenarios(insee: string) {
  const v = EXTRAIT.communes[insee]!;
  const n = EXTRAIT.cles.length;
  return Object.fromEntries(EXTRAIT.horizons.map((h, i) => [h, {
    h, v: Object.fromEntries(EXTRAIT.cles.map((k, j) => [k, v[i * n + j]]).filter(([, x]) => typeof x === "number")) as Record<string, number>,
  }]));
}

/** Les entrées de la lecture, comme `entreesChaleur` (lecture-accueil.ts) : même moteur, même formulation. */
function entrees(insee: string, avecRecent = true): EntreesChaleur {
  const sc = scenarios(insee);
  const f = buildClimatFacts(sc)!;
  return {
    verdict: classifyClimateComfort(f).verdict,
    jours: { projete: f.joursTresChauds.projete, reference: f.joursTresChauds.reference, seuil: f.joursTresChauds.threshold },
    nuits: { projete: f.nuitsTropicales.projete, reference: f.nuitsTropicales.reference, seuil: f.nuitsTropicales.threshold },
    jours30: { projete: sc[CLIMAT_HORIZON]?.v.NORTX30D_yr ?? null, reference: reconstructReference(sc, "NORTX30D_yr", "ATX30D_yr") },
    recent: avecRecent ? climatRecentDepuisFichier(FICHIER, insee) : null,
    referenceTexte: (v, nuits) => formatCompte(v, nuits ? { singulier: "nuit", pluriel: "nuits", feminin: true } : undefined),
    limite: "Cette trajectoire est lue à l'échelle de la commune, pas de l'adresse ni du logement.",
    gesteSansAdresse: "Vérifier l'orientation et la ventilation du logement",
  };
}
const lieu = (insee: string, commune: string): Lieu => ({ type: "commune", insee, commune } as Lieu);

// ── Le fichier ──────────────────────────────────────────────────────────────────────────────────────────

test("fichier : forme attendue, période 2016-2025, produit depuis la source SAFRAN versionnée (empreinte)", () => {
  verifierFichier(FICHIER);
  assert.deepEqual(FICHIER.periode, [2016, 2025]);
  assert.deepEqual(FICHIER.cles, ["tx35", "tx30", "tr20"]);
  assert.equal(FICHIER.source.sha256, createHash("sha256").update(readFileSync(FICHIER.source.fichier)).digest("hex"));
  assert.equal(FICHIER.source.licence, "Licence Ouverte 2.0");
});

test("fichier : exactement les communes de l'extrait DRIAS (même jointure), aucune commune ultramarine", () => {
  const a = Object.keys(FICHIER.communes).sort(), b = Object.keys(EXTRAIT.communes).sort();
  assert.equal(a.length, 34788);
  assert.deepEqual(a, b);
  assert.ok(!a.some((c) => /^9[78]/.test(c)));
});

test("fichier : valeurs finies, positives, et les jours à 35 °C sont inclus dans ceux à 30 °C", () => {
  for (const [insee, [tx35, tx30, tr20]] of Object.entries(FICHIER.communes)) {
    for (const v of [tx35!, tx30!, tr20!]) assert.ok(Number.isFinite(v) && v >= 0 && v <= 366, insee);
    assert.ok(tx35! <= tx30!, `${insee} : ${tx35} jours à 35 °C pour ${tx30} à 30 °C`);
  }
});

test("fichier : valeurs des communes pilotes de l'audit (SAFRAN 2016-2025, maille DRIAS de la commune)", () => {
  // docs/audits/2026-11-08-reference-climatique-recente.md, tableau des pilotes.
  assert.deepEqual(FICHIER.communes["17299"], [1.5, 10.8, 13.1]); // Rochefort
  assert.deepEqual(FICHIER.communes["30189"], [8, 53.9, 54.2]); // Nîmes
  assert.deepEqual(FICHIER.communes["05023"], [0, 0, 0]); // Briançon : la maille, pas la vallée (limite écrite)
});

test("cohérence avec la trajectoire DRIAS : le climat récent dépasse 2050 sur moins de 2 % des communes", () => {
  // Constat de l'audit (0,3 % à 1 % des points selon l'indicateur). S'il change à une mise à jour, la juxtaposition
  // « 2050 contre climat récent » doit être réexaminée avant d'être servie : ce test est ce point d'arrêt.
  let n = 0, au_dessus = { tx35: 0, tr20: 0 };
  for (const [insee, [tx35, , tr20]] of Object.entries(FICHIER.communes)) {
    const g = scenarios(insee)[CLIMAT_HORIZON]?.v;
    if (!g || g.NORTX35D_yr == null || g.NORTR_yr == null) continue;
    n++;
    if (g.NORTX35D_yr >= 1 && tx35! > g.NORTX35D_yr) au_dessus.tx35++;
    if (g.NORTR_yr >= 1 && tr20! > g.NORTR_yr) au_dessus.tr20++;
  }
  assert.ok(n > 34000);
  assert.ok(au_dessus.tx35 / n < 0.02, `jours à 35 °C : ${au_dessus.tx35} communes`);
  assert.ok(au_dessus.tr20 / n < 0.02, `nuits tropicales : ${au_dessus.tr20} communes`);
});

test("lecture du fichier : outre-mer et code inconnu donnent null, jamais un zéro", () => {
  assert.equal(climatRecentDepuisFichier(FICHIER, "97411"), null);
  assert.equal(climatRecentDepuisFichier(FICHIER, "00000"), null);
  assert.equal(climatRecentDepuisFichier(FICHIER, "75056"), null, "Paris se lit par son 1er arrondissement, comme DRIAS");
  assert.ok(climatRecentDepuisFichier(FICHIER, "75101"));
  assert.equal(climatRecentDepuisFichier({ ...FICHIER, communes: { "17299": [1, Number.NaN, 2] } }, "17299"), null);
});

// ── La lecture ──────────────────────────────────────────────────────────────────────────────────────────

test("Rochefort : 2050 en grand, le climat récent en comparaison, ses années dites, deux sources nommées", () => {
  const l = lireChaleur(lieu("17299", "Rochefort"), entrees("17299"));
  const [j, n] = l.fait!.mesures!;
  assert.equal(j!.valeur, "3");
  assert.equal(j!.legende, "au-dessus de 35 °C à l'horizon 2050, contre 2 jours dans le climat récent (2016–2025)");
  assert.equal(n!.valeur, "24");
  assert.equal(n!.legende, "par an à l'horizon 2050, sans descendre sous 20 °C, contre 13 nuits dans le climat récent (2016–2025)");
  assert.equal(j!.bascule!.legende, "au-dessus de 30 °C à l'horizon 2050, dont 3 au-dessus de 35 °C ; contre 11 jours dans le climat récent (2016–2025)");
  assert.equal(l.fait!.texte, "À l'horizon 2050 (+2,7 °C en France) : 3 jours par an au-dessus de 35 °C, et 24 nuits tropicales par an. Climat récent (2016–2025) : 2 jours au-dessus de 35 °C et 13 nuits tropicales par an.");
  assert.match(l.fait!.source, /DRIAS · Météo-France/);
  assert.match(l.fait!.source, /climat récent 2016–2025 : réanalyse SAFRAN · Météo-France/);
});

test("Rochefort : la référence 1976-2005 quitte le premier niveau mais reste dans « Comment lire ce résultat ? »", () => {
  const l = lireChaleur(lieu("17299", "Rochefort"), entrees("17299"));
  const premier = [l.fait!.texte, ...l.fait!.mesures!.flatMap((m) => [m.legende, m.texte ?? "", m.bascule?.legende ?? ""])].join(" ");
  assert.doesNotMatch(premier, /1976/);
  const m = l.methode!.join(" ");
  assert.match(m, /Référence historique des projections \(DRIAS\) : sur 1976-2005, moins d'une journée au-dessus de 35 °C et 5 nuits tropicales par an\./);
  assert.match(m, /la moyenne des années 2016 à 2025/);
  assert.match(m, /pas les relevés d'un thermomètre/);
});

test("aucune moyenne n'est appelée « aujourd'hui » ni « actuelle », sur tout le panel", () => {
  for (const insee of ["17299", "17300", "44109", "33063", "30189", "32233", "05023", "74056", "75101"]) {
    const l = lireChaleur(lieu(insee, insee), entrees(insee));
    const tout = [l.fait?.texte, ...(l.fait?.mesures ?? []).flatMap((m) => [m.legende, m.texte, m.bascule?.legende, m.bascule?.texte]), l.pourVous.texte, ...(l.methode ?? [])].join(" ");
    assert.doesNotMatch(tout, /aujourd'hui|actuel(?!lement)|en ce moment/i, insee);
  }
});

test("NON-RÉGRESSION : sur les 34 788 communes, le signal est identique avec et sans climat récent", () => {
  let changes = 0;
  for (const insee of Object.keys(FICHIER.communes)) {
    const avec = entrees(insee), sans = entrees(insee, false);
    if (avec.verdict === "absent" || !Number.isFinite(avec.jours.projete) || !Number.isFinite(avec.nuits.projete)) continue;
    assert.equal(avec.verdict, sans.verdict, insee);
    if (phraseChaleur(avec, insee).signal !== phraseChaleur(sans, insee).signal) changes++;
  }
  assert.equal(changes, 0);
});

test("sans climat récent (null ou incomplet), la lecture d'avant FUT-170, à l'identique", () => {
  for (const insee of ["17299", "30189", "33063"]) {
    const sans = lireChaleur(lieu(insee, insee), entrees(insee, false));
    const nan = lireChaleur(lieu(insee, insee), { ...entrees(insee), recent: { periode: [2016, 2025], jours: 1, jours30: Number.NaN, nuits: 2 } });
    assert.deepEqual(nan, sans, insee);
    assert.match(sans.fait!.mesures![1]!.legende, /contre \d+ nuits sur 1976-2005$/);
  }
});

test("la phrase mesure sa hausse contre la période AFFICHÉE, pas contre une autre", () => {
  // Nuits : 2050 = 20, 1976-2005 = 8 (plus que doublé), climat récent = 12 (pas doublé).
  const e = { ...entrees("17299"), verdict: "under_threshold" as const,
    jours: { projete: 3, reference: 0.3, seuil: 8 }, nuits: { projete: 20, reference: 8, seuil: 25 } };
  assert.match(phraseChaleur({ ...e, recent: null }, "X").texte, /beaucoup plus fréquentes/);
  assert.match(phraseChaleur({ ...e, recent: { periode: [2016, 2025], jours: 2, jours30: 10, nuits: 12 } }, "X").texte, /les nuits tropicales seraient plus fréquentes\.$/);
  // Climat récent déjà à 19,5 nuits : moins d'une nuit de plus, aucune hausse affirmée.
  assert.equal(phraseChaleur({ ...e, recent: { periode: [2016, 2025], jours: 2.5, jours30: 10, nuits: 19.5 } }, "X").texte,
    "Les journées au-dessus de 35 °C comme les nuits tropicales resteraient peu nombreuses.");
});

test("accord : « moins d'une nuit tropicale », jamais « nuit tropicales »", () => {
  const e = { ...entrees("44109"), recent: { periode: [2016, 2025] as const, jours: 0.2, jours30: 5, nuits: 0.4 } };
  const l = lireChaleur(lieu("44109", "Nantes"), e);
  assert.match(l.fait!.texte, /moins d'une journée au-dessus de 35 °C et moins d'une nuit tropicale par an\.$/);
  assert.doesNotMatch([l.fait!.texte, ...l.methode!].join(" "), /nuit tropicales/);
});
