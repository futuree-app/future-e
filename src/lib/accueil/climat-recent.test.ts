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
import { lireChaleur, phraseChaleur, stationContredit, ECART_LISIBLE, type EntreesChaleur, type Lieu } from "./pastilles.ts";
import { formatCompte } from "./recits.ts";

const FICHIER = JSON.parse(readFileSync("src/data/climat-recent-communes.json", "utf8")) as FichierClimatRecent;
const EXTRAIT = JSON.parse(readFileSync("src/data/apercu-climat-communes.json", "utf8")) as {
  horizons: string[]; cles: string[]; communes: Record<string, (number | null)[]>;
};

const VILLES: Record<string, string> = { "75056": "75101", "69123": "69381", "13055": "13201" };
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
  const sc = scenarios(VILLES[insee] ?? insee);
  const f = buildClimatFacts(sc)!;
  return {
    verdict: classifyClimateComfort(f).verdict,
    jours: { projete: f.joursTresChauds.projete, reference: f.joursTresChauds.reference, seuil: f.joursTresChauds.threshold },
    nuits: { projete: f.nuitsTropicales.projete, reference: f.nuitsTropicales.reference, seuil: f.nuitsTropicales.threshold },
    jours30: { projete: sc[CLIMAT_HORIZON]?.v.NORTX30D_yr ?? null, reference: reconstructReference(sc, "NORTX30D_yr", "ATX30D_yr") },
    recent: avecRecent ? climatRecentDepuisFichier(FICHIER, VILLES[insee] ?? insee, insee) : null,
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
  assert.equal(FICHIER.schema, 2, "schéma 2 : nuits tropicales au sens strict de DRIAS (Tmin > 20 °C)");
  const src = JSON.parse(readFileSync(FICHIER.source.fichier, "utf8"));
  assert.match(src.definitions.tr20, /TINF_H > 20 °C, strictement/);
  assert.equal(FICHIER.stations_source.sha256, createHash("sha256").update(readFileSync(FICHIER.stations_source.fichier)).digest("hex"));
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
  assert.deepEqual(FICHIER.communes["17299"], [1.5, 10.8, 12.5]); // Rochefort (nuits : 13,1 avec >= 20, 12,5 au sens strict)
  assert.deepEqual(FICHIER.communes["30189"], [8, 53.9, 52.6]); // Nîmes
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
  assert.equal(j!.legende, "à 35 °C ou plus à l'horizon 2050, contre 2 jours dans le climat récent (2016–2025)");
  assert.equal(n!.valeur, "24");
  assert.equal(n!.legende, "par an à l'horizon 2050, sans tomber à 20 °C, contre 13 nuits dans le climat récent (2016–2025)");
  assert.equal(j!.bascule!.legende, "à 30 °C ou plus à l'horizon 2050, dont 3 à 35 °C ou plus ; contre 11 jours dans le climat récent (2016–2025)");
  assert.equal(l.fait!.texte, "À l'horizon 2050 (+2,7 °C en France) : 3 jours par an à 35 °C ou plus, et 24 nuits tropicales par an. Climat récent (2016–2025) : 2 jours à 35 °C ou plus et 13 nuits tropicales par an.");
  assert.match(l.fait!.source, /DRIAS · Météo-France/);
  assert.match(l.fait!.source, /climat récent 2016–2025 : réanalyse SAFRAN · Météo-France/);
});

test("Rochefort : la référence 1976-2005 quitte le premier niveau mais reste dans « Comment lire ce résultat ? »", () => {
  const l = lireChaleur(lieu("17299", "Rochefort"), entrees("17299"));
  const premier = [l.fait!.texte, ...l.fait!.mesures!.flatMap((m) => [m.legende, m.texte ?? "", m.bascule?.legende ?? ""])].join(" ");
  assert.doesNotMatch(premier, /1976/);
  const m = l.methode!.join(" ");
  assert.match(m, /Référence historique des projections \(DRIAS\) : sur 1976-2005, moins d'une journée à 35 °C ou plus et 5 nuits tropicales par an\./);
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

// Les 45 communes où une station du secteur dément la rareté projetée par la maille : leur pastille passe de
// « Plutôt favorable » à « À surveiller » (décision du 08/11/2026). Modification VOLONTAIRE du signal d'interface,
// listée ici une à une : toute autre commune dont le signal bougerait fait échouer le test. Le classement du moteur
// (`verdict`) ne change pour aucune. Liste : docs/audits/2026-11-08-reference-climatique-recente.md.
const MAILLE_CONTREDITE = ["04006", "04019", "04057", "04086", "04115", "04222", "05007", "05009", "05023", "05052", "05061", "05064", "05098", "05101", "05109", "05136", "05139", "05142", "05144", "05152", "05182", "05183", "06102", "38112", "38173", "38207", "38237", "38375", "38469", "65192", "65413", "73023", "73026", "73113", "73181", "73253", "73255", "73256", "73259", "73261", "73306", "73322", "74056", "74085", "74143"];

test("NON-RÉGRESSION : sur les 34 788 communes, le signal ne change qu'aux 45 mailles contredites, le classement nulle part", () => {
  const changes: string[] = [];
  for (const insee of Object.keys(FICHIER.communes)) {
    const avec = entrees(insee), sans = entrees(insee, false);
    if (avec.verdict === "absent" || !Number.isFinite(avec.jours.projete) || !Number.isFinite(avec.nuits.projete)) continue;
    assert.equal(avec.verdict, sans.verdict, insee);
    const a = phraseChaleur(avec, insee).signal, b = phraseChaleur(sans, insee).signal;
    if (a !== b) {
      changes.push(insee);
      assert.deepEqual([b, a], ["favorable", "sous_seuil"], insee);
      assert.ok(stationContredit(avec), insee);
    }
  }
  assert.deepEqual(changes.sort(), MAILLE_CONTREDITE);
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
  assert.equal(phraseChaleur({ ...e, recent: { periode: [2016, 2025], jours: 2, jours30: 10, nuits: 12 } }, "X").texte,
    "Les journées à 35 °C ou plus n'augmenteraient pas nettement par rapport à 2016–2025, mais les nuits tropicales deviendraient plus fréquentes.");
  // Climat récent déjà à 19,5 nuits : moins d'une nuit de plus, aucune hausse affirmée.
  assert.equal(phraseChaleur({ ...e, recent: { periode: [2016, 2025], jours: 2.5, jours30: 10, nuits: 19.5 } }, "X").texte,
    "Les journées à 35 °C ou plus comme les nuits tropicales n'augmenteraient pas nettement par rapport à 2016–2025.");
});

test("accord : « moins d'une nuit tropicale », jamais « nuit tropicales »", () => {
  const e = { ...entrees("44109"), recent: { periode: [2016, 2025] as const, jours: 0.2, jours30: 5, nuits: 0.4 } };
  const l = lireChaleur(lieu("44109", "Nantes"), e);
  assert.match(l.fait!.texte, /moins d'une journée à 35 °C ou plus et moins d'une nuit tropicale par an\.$/);
  assert.doesNotMatch([l.fait!.texte, ...l.methode!].join(" "), /nuit tropicales/);
});

// ── Contre-revue du 08/11/2026 : exposition et évolution, deux questions distinctes ─────────────────────────

const sousSeuil = (j: [number, number], n: [number, number], recent = true): EntreesChaleur => ({
  ...entrees("17299"), verdict: "under_threshold",
  jours: { projete: j[1], reference: 0, seuil: 8 }, nuits: { projete: n[1], reference: 0, seuil: 25 },
  recent: recent ? { periode: [2016, 2025], jours: j[0], jours30: 10, nuits: n[0], stations: [] } : null,
});

test("évolution : des journées qui se multiplient ne sont plus dites « peu nombreuses » (cas Avignonet)", () => {
  // Les chiffres de la contre-revue : de 0,5 à 5,3 journées à 35 °C, nuits quasi stables.
  assert.equal(phraseChaleur(sousSeuil([0.5, 5.3], [2, 3]), "X").texte,
    "Les journées à 35 °C ou plus deviendraient beaucoup plus fréquentes qu'en 2016–2025 ; les nuits tropicales n'augmenteraient pas nettement.");
  assert.equal(phraseChaleur(sousSeuil([0.5, 5.3], [0.2, 0.6]), "X").texte,
    "Les journées à 35 °C ou plus deviendraient beaucoup plus fréquentes qu'en 2016–2025 ; les nuits tropicales resteraient rares.");
  assert.equal(phraseChaleur(sousSeuil([0.5, 5.3], [5, 12]), "X").texte,
    "Les journées à 35 °C ou plus et les nuits tropicales deviendraient beaucoup plus fréquentes qu'en 2016–2025.");
  assert.equal(phraseChaleur(sousSeuil([3, 5.5], [5, 12]), "X").texte,
    "Les journées à 35 °C ou plus deviendraient plus fréquentes qu'en 2016–2025, et les nuits tropicales beaucoup plus fréquentes.");
});

test("évolution : un écart sous ECART_LISIBLE n'est jamais une hausse, même doublé près de zéro", () => {
  assert.equal(ECART_LISIBLE, 2);
  for (const [j, n] of [[[1, 2.9], [10, 11.9]], [[4, 3], [12, 11]]] as [[number, number], [number, number]][]) {
    assert.equal(phraseChaleur(sousSeuil(j, n), "X").texte, "Les journées à 35 °C ou plus comme les nuits tropicales n'augmenteraient pas nettement par rapport à 2016–2025.", JSON.stringify([j, n]));
  }
  assert.equal(phraseChaleur(sousSeuil([0.3, 1.2], [0.2, 0.9]), "X").texte,
    "Les journées à 35 °C ou plus n'augmenteraient pas nettement par rapport à 2016–2025, et les nuits tropicales resteraient rares.");
  // 0 → 2 : hausse lisible et doublée (« beaucoup plus ») ; 3 → 5 : lisible sans doubler (« plus »).
  assert.match(phraseChaleur(sousSeuil([0, 2], [0, 0.5]), "X").texte, /^Les journées à 35 °C ou plus deviendraient beaucoup plus fréquentes/);
  assert.match(phraseChaleur(sousSeuil([3, 5], [0, 0.5]), "X").texte, /^Les journées à 35 °C ou plus deviendraient plus fréquentes/);
});

test("défavorable : « deviendraient » seulement si la période de comparaison n'atteint pas déjà le repère", () => {
  const e: EntreesChaleur = { ...sousSeuil([2, 5], [26, 30]), verdict: "unfavorable" };
  assert.match(phraseChaleur(e, "X").texte, /^Les nuits tropicales seraient particulièrement fréquentes/);
  assert.match(phraseChaleur({ ...sousSeuil([2, 5], [15, 30]), verdict: "unfavorable" }, "X").texte,
    /^Les nuits tropicales deviendraient particulièrement fréquentes/);
});

test("frontière exacte de l'écart lisible : 0,3 → 2,3 est une hausse de 2, pas 1,9999999999999998 (La Cavalerie)", () => {
  assert.equal(2.3 - 0.3 < 2, true, "le piège binaire existe bien");
  assert.match(phraseChaleur(sousSeuil([0.3, 2.3], [5, 5.5]), "X").texte, /^Les journées à 35 °C ou plus deviendraient beaucoup plus fréquentes qu'en 2016–2025/);
  assert.match(phraseChaleur(sousSeuil([2.3, 4.3], [5, 5.5]), "X").texte, /^Les journées à 35 °C ou plus deviendraient plus fréquentes/);
  assert.match(phraseChaleur(sousSeuil([2, 5], [3.1, 5.1]), "X").texte, /nuits tropicales plus fréquentes|nuits tropicales deviendraient plus fréquentes/);
  // Juste sous la frontière, au dixième : toujours « pas nettement ».
  assert.match(phraseChaleur(sousSeuil([0.3, 2.2], [5, 5.5]), "X").texte, /^Les journées à 35 °C ou plus comme les nuits tropicales n'augmenteraient pas nettement/);
  const e = entrees("12063");
  assert.equal(Math.round((e.jours.projete! - e.recent!.jours) * 10), 20, "La Cavalerie : +2,0 journées");
  assert.match(phraseChaleur(e, "La Cavalerie").texte, /^Les journées à 35 °C ou plus (et les nuits tropicales )?deviendraient/);
});

test("défavorable, un seul axe : « deviendraient » exige aussi l'écart lisible (Vence, 23,6 → 25 nuits)", () => {
  assert.match(phraseChaleur({ ...sousSeuil([0, 0.2], [23.6, 25]), verdict: "unfavorable" }, "X").texte,
    /^Les nuits tropicales seraient particulièrement fréquentes/);
  assert.match(phraseChaleur({ ...sousSeuil([0, 0.2], [23, 25]), verdict: "unfavorable" }, "X").texte,
    /^Les nuits tropicales deviendraient particulièrement fréquentes/, "+2,0 : lisible, à la frontière exacte");
  for (const insee of ["06049", "06050", "06157"]) {
    const e = entrees(insee);
    assert.equal(e.verdict, "unfavorable", `${insee} : le classement ne bouge pas`);
    const p = phraseChaleur(e, insee);
    assert.equal(p.signal, "defavorable", insee);
    assert.match(p.texte, /^Les nuits tropicales seraient particulièrement fréquentes/, insee);
  }
});

test("défavorable, sur toutes les communes : « deviendraient particulièrement » seulement après une hausse lisible", () => {
  let n = 0;
  for (const insee of Object.keys(FICHIER.communes)) {
    const e = entrees(insee);
    if (e.verdict !== "unfavorable" || !e.recent || !Number.isFinite(e.jours.projete) || !Number.isFinite(e.nuits.projete)) continue;
    const t = phraseChaleur(e, insee).texte;
    const m = /^Les (nuits tropicales|journées à 35 °C ou plus) deviendraient particulièrement/.exec(t);
    if (!m) continue;
    const nuit = m[1] === "nuits tropicales";
    const g = Math.round(((nuit ? e.nuits.projete! : e.jours.projete!) - (nuit ? e.recent.nuits : e.recent.jours)) * 10);
    assert.ok(g >= ECART_LISIBLE * 10, `${insee} : +${g / 10}`);
    assert.ok((nuit ? e.recent.nuits : e.recent.jours) < (nuit ? e.nuits.seuil : e.jours.seuil), `${insee} : repère déjà atteint`);
    n++;
  }
  assert.ok(n > 1000, `${n} phrases « deviendraient particulièrement »`);
});

test("LA PHRASE DIT VRAI, sur les 34 788 communes : chaque mot de l'évolution suit son chiffre, jamais « peu nombreuses »", () => {
  let n = 0;
  for (const insee of Object.keys(FICHIER.communes)) {
    const e = entrees(insee);
    if (e.verdict !== "under_threshold" || !Number.isFinite(e.jours.projete) || !Number.isFinite(e.nuits.projete) || !e.recent) continue;
    const t = phraseChaleur(e, insee).texte;
    // Oracle indépendant du code testé : les valeurs sont au dixième, l'écart se compte en dixièmes ENTIERS
    // (2,3 − 0,3 = 20 dixièmes, et non 1,9999999999999998 : contre-revue finale, La Cavalerie).
    const gj = Math.round((e.jours.projete! - e.recent.jours) * 10), gn = Math.round((e.nuits.projete! - e.recent.nuits) * 10);
    const LISIBLE = ECART_LISIBLE * 10;
    assert.doesNotMatch(t, /peu nombreuses/, insee);
    if (/^Les journées à 35 °C ou plus (comme les nuits tropicales )?n'augmenteraient pas nettement/.test(t)) assert.ok(gj < LISIBLE && e.jours.projete! >= 1, `${insee} : jours +${gj / 10}`);
    if (/nuits tropicales n'augmenteraient pas nettement/.test(t)) assert.ok(gn < LISIBLE && e.nuits.projete! >= 1, `${insee} : nuits +${gn / 10}`);
    if (/^Les journées à 35 °C ou plus resteraient rares/.test(t)) assert.ok(e.jours.projete! < 1, insee);
    if (/nuits tropicales resteraient rares/.test(t)) assert.ok(e.nuits.projete! < 1, insee);
    if (/journées à 35 °C ou plus (et les nuits tropicales )?deviendraient/.test(t)) assert.ok(gj >= LISIBLE, `${insee} : jours +${gj / 10}`);
    if (/nuits tropicales (deviendraient )?(beaucoup )?plus fréquentes/.test(t)) assert.ok(gn >= LISIBLE, `${insee} : nuits +${gn / 10}`);
    // Et l'inverse : une hausse lisible n'est jamais dite « pas nettement ».
    if (gj >= LISIBLE) assert.doesNotMatch(t, /^Les journées à 35 °C ou plus (comme les nuits tropicales )?n'augmenteraient pas/, `${insee} : jours +${gj / 10}`);
    if (gn >= LISIBLE) assert.doesNotMatch(t, /nuits tropicales n'augmenteraient pas/, `${insee} : nuits +${gn / 10}`);
    assert.doesNotMatch(t, /aujourd'hui|actuel/);
    n++;
  }
  assert.ok(n > 20000, `${n} communes sous les repères`);
});

// ── Contre-revue du 08/11/2026 : la maille contredite par le thermomètre de la commune ───────────────────

test("Chamonix : la station de la commune contredit la maille, la réserve est dite au premier niveau", () => {
  const e = entrees("74056");
  const c = stationContredit(e);
  assert.ok(c, "Chamonix : la station Météo-France relève plus que la maille n'en projette pour 2050");
  const p = phraseChaleur(e, "Chamonix-Mont-Blanc");
  assert.equal(e.verdict, "under_threshold", "le classement du moteur ne bouge pas");
  assert.equal(phraseChaleur({ ...e, recent: { ...e.recent!, stations: [] } }, "X").signal, "favorable", "sans station : la rareté de la maille");
  assert.equal(p.signal, "sous_seuil", "maille contredite : « À surveiller », plus « Plutôt favorable »");
  assert.doesNotMatch(p.texte, /^Les fortes chaleurs resteraient exceptionnelles ici/);
  assert.match(p.texte, /La station Météo-France Chamonix \(1\s042 m d'altitude, à 4 km\) relève pourtant déjà 16 jours à 30 °C ou plus par an en moyenne sur 2016–2025/);
  assert.match(p.texte, /ces chiffres sous-estiment la chaleur là où elle mesure\.$/);
  const l = lireChaleur(lieu("74056", "Chamonix-Mont-Blanc"), e);
  assert.match(l.methode!.join(" "), /Ici, la station Météo-France Chamonix .* années complètes sur 2016–2025/);
});

test("témoin : sans station, ou quand la station ne dépasse pas la projection de la maille, aucune réserve", () => {
  const e = entrees("74056");
  assert.equal(stationContredit({ ...e, recent: { ...e.recent!, stations: [] } }), null);
  const tiede = { nom: "X", altitude: 100, annees: 10, jours: 1.9, jours30: 1.9, nuits: 1.9, distanceKm: 1 };
  assert.equal(stationContredit({ ...e, recent: { ...e.recent!, stations: [tiede] } }), null, "moins de ECART_LISIBLE relevé : pas de contradiction");
  // Plaine : la station compte quelques journées à 30 °C de plus que la maille n'en projette (23 contre 20,6) : écart
  // ordinaire entre un thermomètre et un secteur de 8 km, pas une absence contredite.
  const plaine: EntreesChaleur = { ...e, jours: { ...e.jours, projete: 2 }, nuits: { ...e.nuits, projete: 8 }, jours30: { projete: 20.6, reference: 15 } };
  const troyes = { nom: "TROYES-BARBEREY", altitude: 112, annees: 10, jours: 3, jours30: 23.4, nuits: 3, distanceKm: 2 };
  assert.equal(stationContredit({ ...plaine, recent: { ...plaine.recent!, stations: [troyes] } }), null);
  // Défavorable : la commune n'est pas présentée comme peu exposée, la phrase ne change pas.
  const n = entrees("30189");
  const chaud = { nom: "X", altitude: 59, annees: 10, jours: 40, jours30: 90, nuits: 60, distanceKm: 1 };
  const nAbsent: EntreesChaleur = { ...n, jours30: { projete: 0.5, reference: 0 } }; // absence fictive, pour la règle
  assert.ok(stationContredit({ ...nAbsent, recent: { ...n.recent!, stations: [chaud] } }));
  assert.equal(phraseChaleur({ ...nAbsent, recent: { ...n.recent!, stations: [chaud] } }, "Nîmes").texte, phraseChaleur(nAbsent, "Nîmes").texte);
});
