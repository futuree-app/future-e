// FUT-167 (D1) · LA CARTE « SANTÉ ENVIRONNEMENTALE » : ce qu'elle dit, à quelle échelle, et qu'elle ne signale
// que ce que le dossier signalerait.
//
// Les valeurs d'air de Lille (NO₂ 15,9, PM2,5 9,9) sont celles de l'index citées par `materiality-rules.test.ts`.
// Les sites Seveso de Feyzin sont ceux que l'API Géorisques renvoyait le 30/10/2026 autour de la raffinerie.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  lireSanteEnvironnementale, PHRASES_INTERDITES, SANTE_CIBLES, SANTE_LIBELLES, AIR_PERIODE,
  type EntreeSante, type LectureLocale,
} from "./sante-environnementale.ts";
import { buildSanteFacts } from "./decision/sante-facts.ts";
import { EVIDENCE_TARGET_MODULE } from "./decision/evidence-targets.ts";
import { construireIndexSeveso, lireIndexSeveso, sevesoAutour, plusProcheParSeuil, distanceKm, type SiteProche } from "./data/installations-seveso.ts";
import { REGISTRY } from "./decision/materiality-rules.ts";

const LU_LE = "2026-10-30T15:00:00.000Z";
const EXTRAIT = "2026-10-30T14:00:00.000Z";

const site = (nom: string, seuil: "seveso_haut" | "seveso_bas", d: number, etat = "En exploitation avec titre"): SiteProche => ({
  code: nom.replace(/\W/g, "").slice(0, 10), nom, seuil, lat: 45.67, lon: 4.85, insee: "69276", commune: "Feyzin", etat, majLe: "2026-10-23", decimales: 6, approchee: false, distanceKm: d,
});
const FEYZIN: SiteProche[] = [
  site("TotalEnergies Raffinage France", "seveso_haut", 2.1),
  site("RHONE GAZ", "seveso_haut", 3.0),
  site("AIR LIQUIDE FRANCE INDUSTRIE", "seveso_bas", 3.4),
  site("BLUESTAR SILICONES France SAS", "seveso_haut", 4.2),
  site("TERENVIE", "seveso_bas", 4.6),
  site("Site en fin d'activité", "seveso_bas", 7.4, "En fin d'exploitation"),
];

const lecture = (o: Partial<LectureLocale> = {}): LectureLocale => ({
  code: "59350", libelle: "Lille",
  air: { pm25: 7.2, no2: 8.1 },
  industrie: { classeRetenue: "industrie", notable: false },
  seveso: [],
  bruit: { source: null, distanceKm: null, notable: false },
  radon: "1",
  ...o,
});
const carte = (ls: LectureLocale[], o: Partial<EntreeSante> = {}) =>
  lireSanteEnvironnementale({ communeName: ls[0]?.libelle ?? "X", lectures: ls, adresseConnue: false, luLe: LU_LE, sevesoExtraitLe: EXTRAIT, ...o });
const ligne = (c: ReturnType<typeof carte>, cle: keyof typeof SANTE_LIBELLES) => c.lignes.find((l) => l.cle === cle)!;
const tout = (c: ReturnType<typeof carte>) => [c.face.valeur, c.face.sous, c.note, c.sources, ...c.lignes.flatMap((l) => [l.valeur, l.grain, l.limite, l.geste ?? "", ...l.paragraphes])].join("\n");

// ── Les quatre lignes, chacune à son grain ────────────────────────────────────────────────────

test("sans aucun signal : la face donne l'air en chiffres, sans conclusion d'ensemble ni « à vérifier »", () => {
  const c = carte([lecture()]);
  assert.equal(c.face.valeur, "PM2,5 7,2 · NO₂ 8,1 µg/m³");
  assert.equal(c.face.sous, "Air de fond, industrie, bruit, radon");
  assert.ok(c.lignes.every((l) => !l.signal));
  assert.deepEqual(c.lignes.map((l) => l.libelle), ["Air de fond", "Sites industriels", "Bruit des infrastructures", "Radon"]);
  assert.match(c.note, /^Lecture faite le 30\/10\/2026, à côté de votre dossier : elle ne modifie aucun constat déjà produit\./);
});

test("air (Lille) : le NO₂ au-delà de la recommandation OMS est signalé, avec ses repères et la période non démontrée", () => {
  const c = carte([lecture({ air: { pm25: 9.9, no2: 15.9 } })]);
  const l = ligne(c, "air");
  assert.equal(l.signal, true);
  assert.equal(l.valeur, "PM2,5 9,9 · NO₂ 15,9 µg/m³");
  assert.match(l.paragraphes.join(" "), /Dioxyde d'azote \(NO₂\) : 15,9 µg\/m³ en moyenne annuelle, au-delà de la recommandation de l'Organisation mondiale de la santé \(10 µg\/m³\)\. La valeur limite européenne applicable en 2030 est de 20 µg\/m³\./);
  assert.match(l.paragraphes.join(" "), /9,9 µg\/m³ en moyenne annuelle, sous la valeur limite européenne applicable en 2030 \(10 µg\/m³\)\. La recommandation de l'Organisation mondiale de la santé est de 5 µg\/m³ : cette moyenne la dépasse\./);
  assert.ok(l.paragraphes.includes(AIR_PERIODE));
  assert.doesNotMatch(AIR_PERIODE, /\b20(1\d|2[0-6]) ?(est|sont) l'année/); // aucune année affirmée comme mesurée
  assert.match(l.limite, /d'une rue à l'autre/);
  assert.equal(c.face.valeur, "PM2,5 9,9 · NO₂ 15,9 µg/m³");
  assert.equal(c.face.sous, "Air de fond · à vérifier");
});

test("air : un polluant non publié est dit tel, jamais remplacé par zéro", () => {
  const l = ligne(carte([lecture({ air: { pm25: 6.4, no2: null } })]), "air");
  assert.equal(l.valeur, "PM2,5 6,4 µg/m³");
  assert.match(l.paragraphes.join(" "), /Le dioxyde d'azote \(NO₂\) n'est pas publié pour cette commune\./);
  const vide = ligne(carte([lecture({ air: null })]), "air");
  assert.equal(vide.valeur, "Non publié");
  assert.equal(vide.geste, null);
});

test("industrie (Feyzin) : la catégorie retenue par le calcul, puis les sites Seveso nommés avec leur distance", () => {
  const c = carte([lecture({ libelle: "Feyzin", industrie: { classeRetenue: "seveso_haut", notable: true }, seveso: FEYZIN })]);
  const l = ligne(c, "industrie");
  assert.equal(l.signal, true);
  assert.equal(l.valeur, "Seveso seuil haut à 2,1 km");
  const p = l.paragraphes.join(" ");
  assert.match(p, /Il retient ici un site classé Seveso seuil haut, et l'exposition calculée atteint le niveau à partir duquel le dossier la signale\. C'est le niveau le plus élevé/);
  assert.match(p, /6 sites classés Seveso sont recensés à moins de 8 km du centre de la commune \(extraction Géorisques du 30\/10\/2026\) : TotalEnergies Raffinage France \(Seveso seuil haut\), à 2,1 km, RHONE GAZ \(Seveso seuil haut\), à 3 km/);
  assert.match(p, /et 1 autre\./); // au-delà de cinq, les sites sont comptés
  assert.match(p, /Les autres installations classées .* ne sont pas détaillées ici\./);
  assert.match(l.limite, /jusqu'au point publié de chaque site, pas jusqu'à son enceinte\. Elles ne mesurent aucune exposition/);
  assert.equal(c.face.valeur, "Seveso seuil haut à 2,1 km"); // l'industrie passe en tête de la face
});

test("industrie : le site retenu n'est pas le plus proche, et aucune absence de Seveso ne se déduit du score", () => {
  // Calcul : un site IED pèse le plus. Index : un Seveso seuil bas existe pourtant à 6,8 km.
  const avec = ligne(carte([lecture({ industrie: { classeRetenue: "ied", notable: true }, seveso: [site("Dépôt", "seveso_bas", 6.8)] })]), "industrie");
  assert.match(avec.paragraphes.join(" "), /retient ici un site industriel soumis à la directive européenne sur les émissions industrielles/);
  assert.match(avec.paragraphes.join(" "), /Un site classé Seveso est recensé à moins de 8 km .*Dépôt \(Seveso seuil bas\), à 6,8 km/);
  assert.equal(avec.valeur, "Seveso seuil bas à 6,8 km");
  // Sans Seveso dans l'index, la valeur dit la catégorie retenue, et l'absence est datée par l'extraction.
  const sans = ligne(carte([lecture({ industrie: { classeRetenue: "ied", notable: true }, seveso: [] })]), "industrie");
  assert.equal(sans.valeur, "Site soumis à la directive IED à proximité");
  assert.match(sans.paragraphes.join(" "), /Aucun site classé Seveso \(seuil haut ou seuil bas\) n'est recensé à moins de 8 km du centre de la commune \(extraction Géorisques du 30\/10\/2026\)\./);
});

test("industrie : un Seveso lointain se montre sans être signalé ; un index illisible n'est jamais une absence", () => {
  const loin = ligne(carte([lecture({ seveso: [site("Silo", "seveso_bas", 7.4)] })]), "industrie");
  assert.equal(loin.signal, false);
  assert.equal(loin.valeur, "Seveso seuil bas à 7,4 km");
  const panne = ligne(carte([lecture({ seveso: "indisponible" })], { sevesoExtraitLe: null }), "industrie");
  assert.equal(panne.valeur, "Sites Seveso non lus");
  assert.doesNotMatch(panne.paragraphes.join(" "), /Aucun site/);
  assert.match(panne.paragraphes.join(" "), /n'a pas pu être lue lors de cette consultation\. Aucune absence n'en est déduite\./);
});

test("industrie : un site en fin d'exploitation garde son statut dans la phrase", () => {
  const l = ligne(carte([lecture({ seveso: [site("Ancien dépôt", "seveso_bas", 3.2, "En fin d'exploitation")] })]), "industrie");
  assert.match(l.paragraphes.join(" "), /Ancien dépôt \(Seveso seuil bas, en fin d'exploitation\), à 3,2 km/);
});

test("bruit : distance depuis le centre, convention dite, jamais une mesure de façade", () => {
  const proche = ligne(carte([lecture({ bruit: { source: "auto", distanceKm: 0.8, notable: true } })]), "bruit");
  assert.equal(proche.signal, true);
  assert.equal(proche.valeur, "Autoroute à 800 mètres");
  assert.match(proche.paragraphes[0]!, /^Une autoroute ou une voie rapide passe à 800 mètres du centre de la commune\. futur•e signale ce type de source à partir de 1 km\.$/);
  assert.match(proche.limite, /ce n'est pas une mesure de bruit/);
  const loin = ligne(carte([lecture({ bruit: { source: "rail", distanceKm: 1.2, notable: false } })]), "bruit");
  assert.equal(loin.signal, false);
  assert.match(loin.paragraphes[0]!, /C'est au-delà de la distance à partir de laquelle futur•e signale ce type de source \(500 mètres\)\./);
  const aucun = ligne(carte([lecture()]), "bruit");
  assert.equal(aucun.valeur, "Aucune grande infrastructure retenue");
});

test("bruit et industrie : avec une adresse, la carte dit que la distance part du centre, et renvoie le bruit aérien à Logement", () => {
  const c = carte([lecture({ bruit: { source: "aero", distanceKm: 3.5, notable: true }, seveso: [site("Dépôt", "seveso_bas", 5)] })], { adresseConnue: true });
  assert.match(ligne(c, "industrie").paragraphes.join(" "), /Ces distances partent du centre de la commune, pas de votre adresse\./);
  assert.match(ligne(c, "bruit").paragraphes.join(" "), /module Logement/);
});

test("radon : « de Lille », « d'Arles », « du Havre », « du 9e arrondissement »", () => {
  const sous = (o: Partial<LectureLocale>) => ligne(carte([lecture(o)]), "radon").paragraphes[1]!;
  assert.match(sous({ libelle: "Lille" }), /^Le sous-sol de Lille est classé/);
  assert.match(sous({ libelle: "Arles" }), /^Le sous-sol d'Arles est classé/);
  assert.match(sous({ libelle: "Le Havre" }), /^Le sous-sol du Havre est classé/);
  assert.match(sous({ libelle: "9e arrondissement", estArrondissement: true }), /^Le sous-sol du 9e arrondissement est classé/);
});

test("radon : la catégorie 3 est signalée avec la mesure à faire ; la catégorie 1 ne rassure pas ; une panne n'est pas une catégorie", () => {
  const trois = ligne(carte([lecture({ radon: "3" })]), "radon");
  assert.equal(trois.signal, true);
  assert.equal(trois.valeur, "Catégorie 3 sur 3");
  assert.match(trois.geste!, /dosimètre posé deux mois en hiver/);
  const un = ligne(carte([lecture({ radon: "1" })]), "radon");
  assert.equal(un.signal, false);
  assert.match(un.paragraphes.join(" "), /catégorie 1 sur 3, le potentiel le plus faible/);
  assert.match(un.geste!, /seul moyen de connaître sa concentration/);
  assert.match(un.limite, /seule une mesure à l'intérieur établit la concentration réelle/);
  const panne = ligne(carte([lecture({ radon: null })]), "radon");
  assert.equal(panne.valeur, "Non lu");
  assert.doesNotMatch(panne.paragraphes.join(" "), /catégorie \d/);
});

// ── Paris, Lyon, Marseille : par arrondissement, jamais une moyenne de la ville ─────────────────

test("Lyon au grain de la ville : fourchettes d'air, radon par arrondissement (le 9e en catégorie 3)", () => {
  const ls = Array.from({ length: 9 }, (_, k) => lecture({
    code: String(69381 + k), libelle: `${k + 1}${k === 0 ? "er" : "e"} arrondissement`, estArrondissement: true,
    air: { pm25: 8 + k * 0.2, no2: 12 + k }, radon: k === 8 ? "3" : "1",
  }));
  const c = carte(ls);
  assert.equal(ligne(c, "air").valeur, "PM2,5 de 8,0 à 9,6 · NO₂ de 12,0 à 20,0 µg/m³");
  assert.match(ligne(c, "air").paragraphes[0]!, /selon l'arrondissement/);
  assert.equal(ligne(c, "air").signal, true);
  const r = ligne(c, "radon");
  assert.equal(r.valeur, "Catégories 1 et 3 sur 3");
  assert.match(r.paragraphes.join(" "), /9e arrondissement : catégorie 3 sur 3/);
  assert.doesNotMatch(tout(c), /moyenne de (la ville|Lyon)/);
});

// ── La carte ne signale QUE ce que le dossier signalerait ──────────────────────────────────────

test("concordance avec les règles : pour toute valeur, le signal de la carte est le `notable` de sante-facts", () => {
  for (const pm25 of [5.6, 9.9, 10, 14]) for (const no2 of [3, 9.99, 10, 25]) {
    const s = buildSanteFacts({ viv: { pm25, no2 } });
    assert.equal(ligne(carte([lecture({ air: { pm25, no2 } })]), "air").signal, s.air.notable, `pm25 ${pm25}, no2 ${no2}`);
  }
  for (const [source, d] of [["auto", 0.9], ["auto", 1.1], ["rail", 0.5], ["rail", 0.6], ["aero", 4.9], ["aero", 5.2]] as const) {
    const s = buildSanteFacts({ calmeSonore: { score: 50, sourceDominante: source, distanceKm: d } });
    assert.equal(ligne(carte([lecture({ bruit: { source, distanceKm: d, notable: s.bruit.notable } })]), "bruit").signal, s.bruit.notable);
  }
  for (const score of [30, 50, 51, 90]) {
    const s = buildSanteFacts({ expoIndustrielle: { score, sourceDominante: "seveso_bas" } });
    const l = ligne(carte([lecture({ industrie: { classeRetenue: s.industrie.classe, notable: s.industrie.notable } })]), "industrie");
    assert.equal(l.signal, s.industrie.notable, `score ${score}`);
  }
});

// ── Ce qu'aucune phrase ne dit ─────────────────────────────────────────────────────────────────

test("aucune phrase interdite, dans aucun état (air pur, sans danger, logement exposé, tiret cadratin…)", () => {
  const etats: LectureLocale[][] = [
    [lecture()], [lecture({ air: { pm25: 9.9, no2: 15.9 } })], [lecture({ air: null, industrie: null, bruit: null, radon: null, seveso: "indisponible" })],
    [lecture({ industrie: { classeRetenue: "seveso_haut", notable: true }, seveso: FEYZIN, radon: "3", bruit: { source: "auto", distanceKm: 0.4, notable: true } })],
    [lecture({ industrie: { classeRetenue: "ied", notable: true } })], [lecture({ radon: "2" })],
    Array.from({ length: 3 }, (_, k) => lecture({ code: String(75101 + k), libelle: `${k + 1}e arrondissement`, radon: k ? "1" : "3" })),
  ];
  for (const ls of etats) for (const adresseConnue of [false, true]) {
    const texte = tout(carte(ls, { adresseConnue }));
    assert.doesNotMatch(texte, PHRASES_INTERDITES, texte.match(PHRASES_INTERDITES)?.[0]);
  }
});

test("une carte sans aucune lecture se dit manquante ; une seule lecture suffit à l'afficher", () => {
  assert.equal(carte([lecture({ air: null, industrie: null, bruit: null, radon: null, seveso: "indisponible" })], { sevesoExtraitLe: null }).manquante, true);
  assert.equal(carte([lecture({ air: null, industrie: null, bruit: null, seveso: "indisponible" })], { sevesoExtraitLe: null }).manquante, false);
});

// ── Les preuves du dossier ouvrent LEUR ligne ──────────────────────────────────────────────────

test("chaque ligne a sa clé de preuve, déclarée par la carte Territoire, et l'arrivée vise son libellé", () => {
  for (const k of Object.values(SANTE_CIBLES)) assert.equal(EVIDENCE_TARGET_MODULE[k], "territoire");
  const src = readFileSync("src/components/report/QuartierClimatData.tsx", "utf8");
  assert.match(src, /targets: \["health\.air_background", "health\.industrial_site", "health\.noise_infrastructure", "health\.radon"\]/);
  for (const [cle, cible] of Object.entries(SANTE_CIBLES)) {
    assert.match(src, new RegExp(`"${cible.replace(".", "\\.")}": \\{ surligner: ligne\\("${cle}"\\)\\.libelle \\}`));
  }
  assert.match(src, /"Santé environnementale": "risque"/);
});

test("la preuve radon du dossier vise la ligne Radon", () => {
  const radon = REGISTRY.find((r) => r.id === "territoire.radon")!;
  const ev = radon.evaluate({ insee: "69389", nom: "Lyon 9e", radon: { classe: "3", codeInterroge: "69389", parArrondissement: true } } as never, { preferences: [], hardConstraints: {} } as never);
  assert.equal(ev.outcome, "verification");
  assert.equal(ev.facts[0]!.evidence[0]!.targetKey, "health.radon");
});

// ── L'index des sites Seveso ───────────────────────────────────────────────────────────────────

test("index Seveso : seuls les sites Seveso entrent, une fois, et une position impossible est écartée avec son motif", () => {
  const d = construireIndexSeveso({
    extraitLe: EXTRAIT, source: "test",
    lignes: [
      { codeAIOT: "0006103973", raisonSociale: "TotalEnergies Raffinage France", statutSeveso: "Seveso seuil haut", latitude: 45.673859, longitude: 4.847375, codeInsee: "69276", commune: "Feyzin", etatActivite: "En exploitation avec titre", date_maj: "2026-10-23/07-55-27" },
      { codeAIOT: "0006103973", raisonSociale: "doublon", statutSeveso: "Seveso seuil haut", latitude: 45.67, longitude: 4.84 },
      { codeAIOT: "0006103721", raisonSociale: "Polytechnyl", statutSeveso: "Non Seveso", ied: true, latitude: 45.68, longitude: 4.84 },
      { codeAIOT: "0003200958", raisonSociale: "TERENVIE", statutSeveso: "Seveso seuil bas", latitude: 45.680006, longitude: 4.846025 },
      { codeAIOT: "0099", raisonSociale: "Hors France", statutSeveso: "Seveso seuil bas", latitude: 0, longitude: 0 },
      { codeAIOT: "0098", raisonSociale: "Sans position", statutSeveso: "Seveso seuil bas", latitude: null, longitude: null },
    ],
  });
  assert.deepEqual(d.sites.map((s) => [s[0], s[2]]), [["0003200958", "b"], ["0006103973", "h"]]);
  assert.deepEqual(d.exclus.map((e) => e.motif), ["position non publiée, commune non rattachable", "position hors du territoire (0, 0), commune non rattachable"]);
  const i = lireIndexSeveso(d);
  const autour = sevesoAutour(i, 45.6745, 4.852, 8);
  assert.deepEqual(autour.map((s) => s.nom), ["TotalEnergies Raffinage France", "TERENVIE"]);
  assert.ok(Math.abs(autour[0]!.distanceKm - distanceKm(45.6745, 4.852, 45.673859, 4.847375)) < 1e-9);
  assert.equal(plusProcheParSeuil(autour).seveso_bas!.nom, "TERENVIE");
  assert.deepEqual(sevesoAutour(i, 48.85, 2.35, 8), []); // Paris centre : rien dans 8 km de ces deux sites
});

test("index Seveso : un site sans position exploitable est placé au centre de sa commune, et la phrase le dit", () => {
  // Cas réel du 30/10/2026 : « CHAIS DU PRUNELAS », Salignac-sur-Charente, publié en 42,23 N 11,91 E (en Italie).
  const d = construireIndexSeveso({
    extraitLe: EXTRAIT, source: "test",
    communes: [{ insee: "17418", nom: "Salignac-sur-Charente", lat: 45.6692, lon: -0.4155 }, { insee: "01001", nom: "Homonyme", lat: 1, lon: 1 }, { insee: "02001", nom: "Homonyme", lat: 2, lon: 2 }],
    lignes: [
      { codeAIOT: "0007211264", raisonSociale: "CHAIS DU PRUNELAS (les)", commune: "Salignac-sur-Charente", statutSeveso: "Seveso seuil bas", latitude: 42.232461, longitude: 11.908368 },
      { codeAIOT: "0000000001", raisonSociale: "Ambigu", commune: "Homonyme", statutSeveso: "Seveso seuil bas", latitude: null, longitude: null },
    ],
  });
  assert.deepEqual(d.sites.map((x) => [x[0], x[3], x[4], x[10]]), [["0007211264", 45.6692, -0.4155, 1]]);
  const motif = (code: string) => d.exclus.find((e) => e.code === code)!.motif;
  assert.match(motif("0007211264"), /placé au centre de Salignac-sur-Charente \(17418\)/);
  assert.match(motif("0000000001"), /commune non rattachable/); // deux communes portent ce nom : on n'en choisit aucune
  const proche = sevesoAutour(lireIndexSeveso(d), 45.70, -0.40, 8);
  assert.equal(proche[0]!.approchee, true);
  const l = ligne(carte([lecture({ seveso: proche })]), "industrie");
  assert.match(l.paragraphes.join(" "), /CHAIS DU PRUNELAS \(les\) \(Seveso seuil bas\), à environ 3,6 km \(position approchée : la fiche ne publie pas de position exploitable\)/);
});

test("un exploitant personne physique n'est pas nommé ; une société l'est", () => {
  const l = ligne(carte([lecture({ seveso: [site("Monsieur Jean DUPONT", "seveso_bas", 1.5), site("HENNESSY", "seveso_bas", 4.3)] })]), "industrie");
  const p = l.paragraphes.join(" ");
  assert.doesNotMatch(p, /DUPONT/);
  assert.match(p, /Exploitation au nom d'un particulier \(Seveso seuil bas\), à 1,5 km/);
  assert.match(p, /HENNESSY \(Seveso seuil bas\), à 4,3 km/);
});

test("distance : Feyzin-raffinerie, valeur de référence haversine", () => {
  // 45,6745 N 4,8520 E → 45,673859 N 4,847375 E : 71 m vers le sud, 360 m vers l'ouest, soit environ 367 m.
  const d = distanceKm(45.6745, 4.852, 45.673859, 4.847375);
  assert.ok(d > 0.36 && d < 0.37, String(d));
});

// ── FUT-163 (31/10/2026) : aucune généralisation nationale sans preuve de couverture ───────────
// « Aucune commune française ne la respecte » se déduisait du minimum d'un index dont la couverture nationale
// exhaustive n'est pas démontrée. Le texte compare la valeur LUE à la recommandation OMS, et rien d'autre.
const UNIVERSEL = /aucune commune|toutes les communes|commune française|en France|minimum national|national/i;

test("PM2,5 : la valeur locale et la recommandation OMS sont comparées, sans aucune affirmation nationale", () => {
  for (const [pm25, verbe] of [[9.9, "la dépasse"], [5, "la respecte"], [4.2, "la respecte"], [5.1, "la dépasse"]] as const) {
    const t = ligne(carte([lecture({ air: { pm25, no2: 8 } })]), "air").paragraphes.join(" ");
    assert.match(t, new RegExp(`La recommandation de l'Organisation mondiale de la santé est de 5 µg/m³ : cette moyenne ${verbe}\\.`), String(pm25));
    assert.doesNotMatch(t, UNIVERSEL, String(pm25));
  }
});

test("PM2,5 par arrondissement : la conclusion collective est bornée aux arrondissements lus", () => {
  const arr = (pms: number[]) => carte(pms.map((pm25, k) => lecture({
    code: String(75101 + k), libelle: `${k + 1}e arrondissement`, estArrondissement: true, air: { pm25, no2: 8 },
  })));
  const cas: [number[], RegExp][] = [
    [[6, 7, 8], /chacune de ces moyennes la dépasse\./],
    [[4, 4.5, 5], /chacune de ces moyennes la respecte\./],
    [[4, 6], /certaines de ces moyennes la dépassent\./],
  ];
  for (const [pms, attendu] of cas) {
    const c = arr(pms);
    const t = ligne(c, "air").paragraphes.join(" ");
    assert.match(t, attendu, pms.join(","));
    assert.doesNotMatch(tout(c), UNIVERSEL, pms.join(","));
  }
});
