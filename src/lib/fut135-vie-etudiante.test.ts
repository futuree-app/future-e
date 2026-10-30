// FUT-135 · UN VILLAGE SANS ÉTUDIANT N'EST PAS UNE VILLE ÉTUDIANTE.
//
// La part étudiante d'un bassin de moins de 5 000 habitants n'est pas mesurée (null), un vrai zéro reste un zéro
// rangé au bas de l'échelle, et `vie_etudiante` exige ses deux mesures : sans l'une d'elles, la priorité est non
// mesurée, signalée et jamais promue (FUT-109). Sur l'index réel et le vrai moteur, sans aucun appel Anthropic.
// Les règles de calcul de la part (abstention, rang moyen des ex æquo) : scripts/populate-etudiants.test.mjs.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const ts = createRequire(${JSON.stringify(racine)} + "package.json")("typescript");
async function premier(candidats, ctx, next) {
  for (const c of candidats.slice(0, -1)) { try { return await next(c, ctx); } catch {} }
  return next(candidats[candidats.length - 1], ctx);
}
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (spec.startsWith("@/")) {
    const b = ${JSON.stringify(racine)} + "src/" + spec.slice(2);
    return premier([b + ".ts", b + ".tsx", b], ctx, next);
  }
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\\.[cm]?[jt]sx?$|\\.json$/.test(spec)) {
    return premier([spec + ".ts", spec + ".tsx", spec], ctx, next);
  }
  if (spec === "next/link") return next("next/link.js", ctx);
  return next(spec, ctx);
}
export async function load(url, ctx, next) {
  if (!url.endsWith(".tsx")) return next(url, ctx);
  const fichier = fileURLToPath(url);
  const { outputText } = ts.transpileModule(readFileSync(fichier, "utf8"), {
    fileName: fichier,
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return { format: "module", source: outputText, shortCircuit: true };
}`;

type M = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
let V: M;
let INDEX: { meta: M; communes: M[] };
before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  V = await import("./comparateur-vie.ts");
  await V.getCommuneEntry("17300"); // charge l'index du moteur et le cache des unités urbaines (taille de ville)
  INDEX = JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8"));
});
const commune = (insee: string) => INDEX.communes.find((c) => c.insee === insee)!;
// Le bassin de la part étudiante : l'unité urbaine, sinon la commune (scripts/populate-etudiants.py).
const bassin = (c: M) => (c.uu ? c.uu_pop : c.population) ?? null;
const vie = (c: M) => V.subScore("vie_etudiante", c);
const PALIER_FORTE = 66; // bandIndex
const SEUIL_RAISON = 55; // raisons favorables et identité « Pour une ville étudiante à taille humaine. »

test("bassin de moins de 5 000 habitants : non mesuré, même avec un accès connu", () => {
  for (const insee of ["54310", "26274"]) { // Leménil-Mitry (2 hab.), Rochefourchat (1 hab.)
    const c = commune(insee);
    assert.equal(c.etudes_dyn, null, c.nom);
    assert.notEqual(c.etudes_acces, null, `${c.nom} : l'accès existe, il ne suffit pas`);
    assert.equal(vie(c), null, c.nom);
  }
  const petits = INDEX.communes.filter((c) => bassin(c) != null && bassin(c) < 5000);
  assert.ok(petits.length > 29000);
  for (const c of petits) assert.equal(vie(c), null, `${c.insee} ${c.nom}`);
});

test("bassin mesuré sans étudiant : un vrai zéro, rangé au bas, jamais favorable", () => {
  const { vraiZero } = INDEX.meta.etudesDyn;
  assert.ok(vraiZero.communes > 1000);
  assert.ok(vraiZero.rang <= 15, `rang du plateau des zéros : ${vraiZero.rang}`);
  const zeros = INDEX.communes.filter((c) => c.etudes_dyn === vraiZero.rang);
  assert.ok(zeros.length >= vraiZero.communes);
  for (const c of zeros) {
    assert.ok(vie(c) < SEUIL_RAISON, `${c.insee} ${c.nom} : ${vie(c)}`);
    assert.ok(bassin(c) >= 5000, `${c.insee} : un zéro mesuré suppose un bassin mesuré`);
  }
});

test("données réellement absentes : ni part ni score", () => {
  const sansPopulation = INDEX.communes.filter((c) => c.population == null);
  assert.equal(sansPopulation.length, INDEX.meta.etudesDyn.nonMesurees.sansPopulation);
  for (const c of sansPopulation) {
    assert.equal(c.etudes_dyn, null, c.insee);
    assert.equal(vie(c), null, c.insee);
  }
  assert.equal(vie({ ...commune("86194"), etudes_acces: null, etudes_dyn: null }), null);
});

test("bassin étudiant significatif : forte présence étudiante", () => {
  for (const insee of ["2B096", "86194", "35238"]) { // Corte, Poitiers, Rennes
    const c = commune(insee);
    assert.ok(vie(c) >= PALIER_FORTE, `${c.nom} : ${vie(c)}`);
  }
});

test("ex æquo : une même part reçoit un même rang, et le plateau des zéros reste le plus bas", () => {
  // Les communes d'une même unité urbaine partagent la part de leur bassin, donc son rang.
  const parUU = new Map<string, Set<number | null>>();
  for (const c of INDEX.communes.filter((x) => x.uu)) parUU.set(c.uu, (parUU.get(c.uu) ?? new Set()).add(c.etudes_dyn));
  for (const [uu, rangs] of parUU) assert.equal(rangs.size, 1, `UU ${uu}`);
  const mesures = INDEX.communes.map((c) => c.etudes_dyn).filter((x) => x != null);
  assert.equal(Math.min(...mesures), INDEX.meta.etudesDyn.vraiZero.rang);
  assert.equal(mesures.length, INDEX.meta.etudesDyn.communesMesurees);
});

test("accès connu, dynamisme absent : non mesuré, l'accès seul ne qualifie pas", () => {
  assert.equal(vie({ ...commune("86194"), etudes_dyn: null }), null);
});

test("dynamisme connu, accès absent : non mesuré, le dynamisme ne prend pas tout le poids", () => {
  assert.equal(vie({ ...commune("86194"), etudes_acces: null }), null);
});

test("les deux mesures : 40 % accès, 60 % dynamisme", () => {
  assert.equal(vie({ ...commune("86194"), etudes_acces: 50, etudes_dyn: 20 }), 32);
});

test("index entier : aucun petit bassin ni bassin sans étudiant n'atteint une raison, un palier ou une identité", () => {
  const { vraiZero } = INDEX.meta.etudesDyn;
  const fautifs = INDEX.communes.filter((c) => (bassin(c) == null || bassin(c) < 5000 || c.etudes_dyn === vraiZero.rang)
    && (vie(c) ?? 0) >= SEUIL_RAISON);
  assert.deepEqual(fautifs.map((c) => c.insee), []);
});

test("une priorité non mesurée n'est pas promue : couverture dite, ni raison, ni identité, ni palier", async () => {
  const p = V.scorePreferences(commune("54310"), [{ key: "vie_etudiante", weight: 3 }, { key: "nature", weight: 1 }]);
  assert.deepEqual(p.couverture, { etat: "partielle", nonMesurees: ["vie_etudiante"] });
  assert.equal(p.subs.some((x: M) => x.key === "vie_etudiante"), false);

  // Lozère : trois communes mesurées (le bassin de Mende), toutes les autres non mesurées.
  const o = await V.matchProjects({ reformulation: "FUT-135", hardConstraints: { departements: ["48"] }, preferences: [{ key: "vie_etudiante", weight: 3 }] });
  assert.ok(o.results.length >= 3);
  const etats = o.results.map((r: M) => r.couverture.etat);
  assert.deepEqual(etats, [...etats].sort((a: string, b: string) => V.rangCouverture(a) - V.rangCouverture(b)));
  for (const r of o.results) {
    const c = commune(r.insee);
    if (vie(c) != null) continue;
    assert.equal(r.couverture.etat, "aucune", r.nom);
    assert.deepEqual(r.reasons, [], r.nom);
    assert.notEqual(r.identite, "Pour une ville étudiante à taille humaine.", r.nom);
    assert.doesNotMatch(r.decouverte ?? "", /étudiant/, r.nom);
  }
  const ligne = o.comparaisonComplete.themes.flatMap((t: M) => t.lignes).find((l: M) => l.id === "vie_etudiante");
  for (const cell of ligne.cellules) {
    if (vie(commune(cell.insee)) == null) assert.equal(cell.disponible, false, cell.insee);
  }
});

test("une ville de référence sans mesure ne transmet pas de trait « vie étudiante »", () => {
  const d = V.communeToPreferences(commune("54310"));
  assert.equal(d.preferences.some((p: M) => p.key === "vie_etudiante"), false);
});

test("comparaison complète : un petit bassin lit « Non mesurée » en vie étudiante, et la couverture le signale", async () => {
  // Leménil-Mitry et Rochefourchat (petits bassins) face à Nancy (mesurée).
  const r = await V.seedComparaison(["54395", "54310", "26274"]);
  const lignes = r.comparaison.themes.flatMap((t: M) => t.lignes);
  const etudiante = lignes.find((l: M) => l.id === "vie_etudiante");
  const par = Object.fromEntries(etudiante.cellules.map((x: M) => [x.insee, x]));
  for (const insee of ["54310", "26274"]) {
    assert.equal(par[insee].palier, "Non mesurée", insee);
    assert.equal(par[insee].disponible, false, insee);
  }
  assert.equal(par["54395"].disponible, true);
  assert.notEqual(par["54395"].palier, "Non mesurée");
  // Le libellé ne change que pour la vie étudiante : une autre case sans donnée garde le sien.
  for (const l of lignes.filter((x: M) => x.id !== "vie_etudiante")) {
    for (const cell of l.cellules) assert.notEqual(cell.palier, "Non mesurée", `${l.id} ${cell.insee}`);
  }

  // FUT-109 : la priorité déclarée reste signalée comme non mesurée sur la carte de ces communes.
  // Creuse : Guéret est mesurée, Aubusson et Felletin (petits bassins) suivent dans le même trio.
  const o = await V.matchProjects({ reformulation: "FUT-135", hardConstraints: { departements: ["23"] }, preferences: [{ key: "vie_etudiante", weight: 3 }, { key: "nature", weight: 2 }] });
  const trio = o.results.slice(0, 3);
  const nonMesurees = trio.filter((x: M) => vie(commune(x.insee)) == null);
  assert.ok(nonMesurees.length >= 1, "le trio de la Creuse compte une commune non mesurée");
  const cellules = o.comparaisonComplete.themes.flatMap((t: M) => t.lignes).find((l: M) => l.id === "vie_etudiante").cellules;
  for (const x of nonMesurees) {
    assert.deepEqual(x.couverture, { etat: "partielle", nonMesurees: ["une ville étudiante"] }, x.nom);
    assert.equal(cellules.find((cell: M) => cell.insee === x.insee).palier, "Non mesurée", x.nom);
  }
  const p = V.scorePreferences(commune("54310"), [{ key: "vie_etudiante", weight: 3 }, { key: "nature", weight: 2 }]);
  assert.deepEqual(p.couverture, { etat: "partielle", nonMesurees: ["vie_etudiante"] });
});

// ── Revue indépendante du 25/10 : les mots suivent le grain des données ─────────────────────────────────
// La part étudiante (`etudes_dyn`) est celle de l'agglomération, l'accès (`etudes_acces`) se mesure depuis la
// commune dans un rayon, et leur combinaison n'établit pas une présence étudiante DANS la commune. Effet narratif
// seulement : les scores, paliers numériques, avantages et classements sont ceux de la photographie d'audit.
const ligneEtudiante = (cc: M) => cc.themes.flatMap((t: M) => t.lignes).find((l: M) => l.id === "vie_etudiante");
const PONT_SALOMON = "43153", THURINS = "69249", SAINT_JEAN_DES_VIGNES = "69212", MONDOUZIL = "31352";
const IDENTITE_ETUDIANTE = "Pour une ville étudiante à taille humaine.";

test("revue 1. Pont-Salomon : raison au palier intermédiaire, à l'échelle de l'agglomération, rayon dit", async () => {
  const o = await V.matchProjects({ reformulation: "Recherche de recette auvergne", hardConstraints: { departements: ["03", "15", "43", "63"] }, preferences: [{ key: "vie_etudiante", weight: 2 }, { key: "nature", weight: 2 }] });
  // FUT-141 : l'accès de Pont-Salomon (aucun établissement à moins de 10 km) passe de 40 à 20, son score de 63 à
  // 55 ; Le Puy-en-Velay, qui a des établissements, prend sa place dans le trio.
  assert.deepEqual(o.results.slice(0, 3).map((r: M) => r.insee), ["63308", "15014", "43157"]);
  assert.equal(vie(commune(PONT_SALOMON)), 55);
  assert.equal(V.raisonNeg("vie_etudiante", commune(PONT_SALOMON)),
    "présence étudiante intermédiaire dans l'agglomération de Saint-Étienne, aucun établissement supérieur recensé à moins de 10 km");
  for (const r of [...o.results, ...o.pistes]) {
    for (const t of r.reasons) if (/^forte présence étudiante/.test(t)) assert.ok(vie(commune(r.insee)) >= PALIER_FORTE, `${r.nom} : ${t}`);
  }
});

test("revue 2. Thurins : palier, qualificatif, aide, avantage et synthèse à l'échelle mesurée", async () => {
  const r = await V.seedComparaison([THURINS, PONT_SALOMON, "86194"]);
  const l = ligneEtudiante(r.comparaison);
  assert.equal(l.aide, "La part d'étudiants dans l'agglomération, et les établissements supérieurs accessibles depuis la commune.");
  const par = Object.fromEntries(l.cellules.map((x: M) => [x.insee, x]));
  // FUT-141 : sans établissement dans ses 5 km, Thurins tombe à 63, palier intermédiaire.
  assert.equal(par[THURINS].palier, "Présence étudiante intermédiaire dans l'agglomération de Lyon");
  assert.equal(par[THURINS].qualifier, "aucun établissement supérieur recensé à moins de 5 km");
  assert.equal(par[PONT_SALOMON].palier, "Présence étudiante intermédiaire dans l'agglomération de Saint-Étienne");
  assert.equal(par[PONT_SALOMON].qualifier, "aucun établissement supérieur recensé à moins de 10 km");
  assert.equal(par["86194"].palier, "Forte présence étudiante");
  assert.equal(par["86194"].qualifier, null);
  // L'avantage reste celui des paliers numériques ; depuis FUT-141, Poitiers mène seule.
  assert.deepEqual(l.avantage, { type: "avantage", insees: ["86194"] });
  for (const t of [...r.comparaison.resume, r.comparaison.arbitrage ?? ""]) assert.doesNotMatch(t, /tudiant/);
  // Seule à mener : la synthèse du thème nomme l'agglomération, pas « sa vie étudiante ». Depuis FUT-141, Thurins
  // ne mène plus face à Pont-Salomon (deux paliers intermédiaires) : Melesse (68, agglomération de Rennes, aucun
  // établissement à moins de 10 km), l'une des 11 restées au palier fort, porte le cas.
  const duo = await V.seedComparaison(["35173", PONT_SALOMON]);
  const vitalite = duo.comparaison.themes.find((t: M) => t.id === "vitalite").synthese;
  assert.match(vitalite, /^Melesse se distingue par la présence étudiante de son agglomération/);
  assert.doesNotMatch(vitalite, /sa vie étudiante/);
});

test("revue 3. Saint-Jean-des-Vignes : identité finale non étudiante", async () => {
  const r = await V.seedComparaison([THURINS, SAINT_JEAN_DES_VIGNES, MONDOUZIL]);
  for (const x of r.trio) assert.notEqual(x.identite, IDENTITE_ETUDIANTE, x.nom);
  for (const insee of [THURINS, SAINT_JEAN_DES_VIGNES, MONDOUZIL]) {
    assert.equal(V.buildIdentiteCandidates(commune(insee)).includes(IDENTITE_ETUDIANTE), false, insee);
  }
});

test("revue 4. vraies villes étudiantes : formulations favorables intactes", async () => {
  for (const insee of ["49007", "35238", "86194", "2B096"]) { // Angers, Rennes, Poitiers, Corte
    const c = commune(insee);
    assert.ok(V.buildIdentiteCandidates(c).includes(IDENTITE_ETUDIANTE), c.nom);
    assert.equal(V.presenceEtudiante(c, 0), "forte présence étudiante", c.nom);
  }
  const r = await V.seedComparaison(["49007", "35238", "2B096"]);
  for (const x of ligneEtudiante(r.comparaison).cellules) {
    assert.equal(x.palier, "Forte présence étudiante", x.insee);
    assert.equal(x.qualifier, null, x.insee);
  }
  const duo = await V.seedComparaison(["49007", PONT_SALOMON]);
  assert.match(duo.comparaison.themes.find((t: M) => t.id === "vitalite").synthese, /^Angers se distingue par sa vie étudiante/);
  const o = await V.matchProjects({ reformulation: "FUT-135", hardConstraints: {}, preferences: [{ key: "vie_etudiante", weight: 3 }, { key: "eviter_grandes_villes", weight: 2 }] });
  const corte = o.results.find((x: M) => x.insee === "2B096");
  assert.ok(corte, "Corte reste dans le trio");
  assert.equal(corte.reasons[0], "forte présence étudiante");
});

test("revue 5. priorité non mesurée : « Non mesurée » et couverture FUT-109 inchangés", async () => {
  const r = await V.seedComparaison([THURINS, "54310"]);
  const cell = ligneEtudiante(r.comparaison).cellules.find((x: M) => x.insee === "54310");
  assert.deepEqual([cell.palier, cell.qualifier, cell.disponible], ["Non mesurée", null, false]);
  assert.equal(ligneEtudiante(r.comparaison).avantage.type, "egalite", "pas d'avantage face à une commune non mesurée");
  const p = V.scorePreferences(commune("54310"), [{ key: "vie_etudiante", weight: 3 }]);
  assert.deepEqual(p.couverture, { etat: "aucune", nonMesurees: ["vie_etudiante"] });
});

test("revue 6. sans établissement recensé, présence mesurée dans le bassin : deux faits distincts", async () => {
  // Thurins : la présence est celle de l'agglomération de Lyon, l'absence est celle du rayon de 5 km.
  assert.equal(V.presenceEtudiante(commune(THURINS), 0), "forte présence étudiante dans l'agglomération de Lyon, aucun établissement supérieur recensé à moins de 5 km");
  // La Flèche, seule dans son unité urbaine : des étudiants recensés par le MESR, aucun établissement par la BPE
  // dans 25 km. La phrase garde les deux faits, sans en conclure l'un par l'autre.
  const laFleche = commune("72154");
  assert.equal(V.presenceEtudiante(laFleche, 1), "présence étudiante intermédiaire, aucun établissement supérieur recensé à moins de 25 km");
  const r = await V.seedComparaison(["72154", "86194"]);
  const cell = ligneEtudiante(r.comparaison).cellules.find((x: M) => x.insee === "72154");
  assert.deepEqual([cell.palier, cell.qualifier], ["Présence étudiante intermédiaire", "aucun établissement supérieur recensé à moins de 25 km"]);
  // Une commune avec établissement recensé ne reçoit pas la mention du rayon.
  assert.doesNotMatch(V.presenceEtudiante(commune("86194"), 0), /aucun établissement/);
});

test("revue : les 487 communes sans établissement recensé et notées ≥ 55 ne sont jamais dites étudiantes localement", async () => {
  const parUU = new Map<string, number>();
  for (const c of INDEX.communes) if (c.uu) parUU.set(c.uu, (parUU.get(c.uu) ?? 0) + 1);
  const set = INDEX.communes.filter((c) => (vie(c) ?? 0) >= SEUIL_RAISON && c.etudesSup?.weightedAccess === 0);
  // FUT-141 : 487 et 255 avant la correction du plateau de l'accès (40 → 20) ; le contrôle des 487 d'origine est
  // dans fut141-vie-etudiante.test.ts.
  assert.equal(set.length, 360);
  assert.equal(set.filter((c) => vie(c) >= PALIER_FORTE).length, 11);
  for (const c of set) {
    assert.equal(V.buildIdentiteCandidates(c).includes(IDENTITE_ETUDIANTE), false, c.insee);
    const phrase = V.presenceEtudiante(c, vie(c) >= PALIER_FORTE ? 0 : 1);
    assert.match(phrase, / aucun établissement supérieur recensé à moins de \d+ km$/, c.insee);
    if (c.uu && parUU.get(c.uu)! > 1) assert.match(phrase, /dans l'agglomération (de |d'|du |des )/, c.insee);
    for (const t of V.communeToPreferences(c).traits) if (/tudiant/.test(t.text)) assert.equal(t.text, phrase, c.insee);
  }
  // Cartes, pistes, comparaisons et recherches forcées : scripts/fut135/controle-487.mjs (0 faute, 25/10/2026).
});

// ── Revue 2 (26/10/2026) : l'identité « ville étudiante » exige une PREUVE POSITIVE d'établissement ──
// Fixtures sur des copies de communes réelles : seule l'attestation `etudesSup` varie, le score reste le même.
const VILLES_ETUDIANTES = ["49007", "35238", "86194", "2B096"]; // Angers, Rennes, Poitiers, Corte
const AVEC = (c: M, sup: M) => ({ ...commune(c.insee ?? c), etudesSup: { ...commune(c.insee ?? c).etudesSup, ...sup } });
const ATTESTATIONS: [string, (insee: string) => M, "presence" | "absence" | "incertain"][] = [
  ["données réelles (accès pondéré > 0, sans compte)", (i) => commune(i), "presence"],
  ["etudesSup absent", (i) => { const { etudesSup, ...c } = commune(i); void etudesSup; return c; }, "incertain"],
  ["etudesSup null", (i) => ({ ...commune(i), etudesSup: null }), "incertain"],
  ["measured: false", (i) => ({ ...commune(i), etudesSup: { measured: false } }), "incertain"],
  ["measured: false avec des champs", (i) => AVEC(i, { measured: false }), "incertain"],
  ["rayon absent", (i) => AVEC(i, { radiusKm: undefined }), "incertain"],
  ["rayon nul", (i) => AVEC(i, { radiusKm: 0 }), "incertain"],
  ["rayon négatif", (i) => AVEC(i, { radiusKm: -5 }), "incertain"],
  ["rayon NaN", (i) => AVEC(i, { radiusKm: NaN }), "incertain"],
  ["rayon en texte", (i) => AVEC(i, { radiusKm: "5" }), "incertain"],
  ["accès absent", (i) => AVEC(i, { weightedAccess: undefined }), "incertain"],
  ["accès absent, compte positif", (i) => AVEC(i, { weightedAccess: undefined, establishmentCount: 3 }), "incertain"],
  ["accès négatif", (i) => AVEC(i, { weightedAccess: -1 }), "incertain"],
  ["accès NaN", (i) => AVEC(i, { weightedAccess: NaN }), "incertain"],
  ["accès infini", (i) => AVEC(i, { weightedAccess: Infinity }), "incertain"],
  ["accès en texte", (i) => AVEC(i, { weightedAccess: "2" }), "incertain"],
  ["compte négatif", (i) => AVEC(i, { establishmentCount: -1 }), "incertain"],
  ["compte non entier", (i) => AVEC(i, { establishmentCount: 1.5 }), "incertain"],
  ["compte NaN", (i) => AVEC(i, { establishmentCount: NaN }), "incertain"],
  ["présence attestée : compte et accès positifs", (i) => AVEC(i, { establishmentCount: 4, weightedAccess: 2.7 }), "presence"],
  ["absence attestée : compte nul, accès nul", (i) => AVEC(i, { establishmentCount: 0, weightedAccess: 0 }), "absence"],
  ["absence attestée : accès nul, sans compte", (i) => AVEC(i, { weightedAccess: 0 }), "absence"],
  ["contradiction : compte positif, accès nul", (i) => AVEC(i, { establishmentCount: 3, weightedAccess: 0 }), "incertain"],
  ["contradiction : compte nul, accès positif", (i) => AVEC(i, { establishmentCount: 0, weightedAccess: 0.8 }), "incertain"],
];

test("revue 2. preuve positive : trois états, présence et absence n'en contredisent jamais le verdict du dossier", async () => {
  const { classifyHigherEdAbsence } = await import("./decision/absence-facts.ts");
  const verdict = (sup: M) => classifyHigherEdAbsence(sup?.measured === true
    ? { measured: true, weightedAccess: sup.weightedAccess, radiusKm: sup.radiusKm, establishmentCount: sup.establishmentCount ?? null }
    : { measured: false });
  for (const insee of VILLES_ETUDIANTES) {
    for (const [cas, fixture, attendu] of ATTESTATIONS) {
      const c = fixture(insee);
      const etat = V.etatEtablissementSup(c.etudesSup);
      assert.equal(etat, attendu, `${insee} ${cas}`);
      if (etat === "presence") assert.equal(verdict(c.etudesSup), "neutral", `${insee} ${cas}`);
      if (etat === "absence") assert.equal(verdict(c.etudesSup), "mismatch", `${insee} ${cas}`);
    }
  }
});

test("revue 2. identité « ville étudiante » : seulement avec un établissement positivement attesté, score inchangé", () => {
  for (const insee of VILLES_ETUDIANTES) {
    const score = vie(commune(insee));
    for (const [cas, fixture, attendu] of ATTESTATIONS) {
      const c = fixture(insee);
      assert.equal(vie(c), score, `${insee} ${cas} : le score ne dépend pas de l'attestation`);
      assert.equal(V.villeEtudianteLocale(c), attendu === "presence", `${insee} ${cas}`);
      assert.equal(V.buildIdentiteCandidates(c).includes(IDENTITE_ETUDIANTE), attendu === "presence", `${insee} ${cas}`);
      // L'absence n'est dite que démontrée ; l'incertain ne dit rien des établissements.
      const phrase = V.presenceEtudiante(c, 0);
      if (attendu === "absence") assert.match(phrase, /^forte présence étudiante, aucun établissement supérieur recensé à moins de \d+ km$/, `${insee} ${cas}`);
      else assert.equal(phrase, "forte présence étudiante", `${insee} ${cas}`);
    }
  }
});

test("revue 2. synthèse déterministe : sans preuve locale, Angers n'est pas dite pour « sa vie étudiante »", async () => {
  const duo = await V.seedComparaison(["49007", PONT_SALOMON]);
  const vitalite = (byInsee: Map<string, M>) =>
    V.buildComparaisonComplete(duo.trio, byInsee).themes.find((t: M) => t.id === "vitalite").synthese;
  const reel = new Map([["49007", commune("49007")], [PONT_SALOMON, commune(PONT_SALOMON)]]);
  assert.equal(vitalite(reel), "Angers se distingue par sa vie étudiante et sa croissance démographique.");
  for (const [cas, fixture, attendu] of ATTESTATIONS) {
    const map = new Map([["49007", fixture("49007")], [PONT_SALOMON, commune(PONT_SALOMON)]]);
    const cc = V.buildComparaisonComplete(duo.trio, map);
    // Scores, paliers numériques et avantages : identiques à la lecture réelle.
    assert.deepEqual(ligneEtudiante(cc).avantage, ligneEtudiante(V.buildComparaisonComplete(duo.trio, reel)).avantage, cas);
    const s = vitalite(map);
    if (attendu === "presence") assert.equal(s, "Angers se distingue par sa vie étudiante et sa croissance démographique.", cas);
    else assert.equal(s, "Angers se distingue par la présence étudiante de son agglomération et sa croissance démographique.", cas);
  }
});

// FUT-141 (contre-revue) : l'identité exige en plus la part étudiante du bassin au palier fort ; 259 → 134.
test("revue 2. index réel : les 134 identités candidates reposent toutes sur une présence attestée", () => {
  const candidats = INDEX.communes.filter((c) => V.buildIdentiteCandidates(c).includes(IDENTITE_ETUDIANTE));
  assert.equal(candidats.length, 134);
  for (const c of candidats) assert.equal(V.etatEtablissementSup(c.etudesSup), "presence", c.insee);
  // Couverture de l'attestation réelle : mesurée partout, sans compte d'établissements ; l'accès pondéré la porte.
  assert.equal(INDEX.communes.filter((c) => V.etatEtablissementSup(c.etudesSup) === "incertain").length, 0);
  assert.equal(INDEX.communes.filter((c) => c.etudesSup?.establishmentCount != null).length, 0);
});

// ── Revue 3 (26/10/2026) : bornes du couple compte / accès pondéré (scripts/populate-bpe.py) ──
// Chaque établissement dans le rayon r apporte 1 − d/25, entre 1 − r/25 et 1 : l'accès tient dans [n·(1 − r/25), n].
test("revue 3. bornes compte / accès : une contradiction mathématique est incertaine, jamais présence ni absence", () => {
  const e = (radiusKm: unknown, establishmentCount: unknown, weightedAccess: unknown) =>
    V.etatEtablissementSup({ measured: true, radiusKm, establishmentCount, weightedAccess });
  const cas: [unknown, unknown, unknown, string][] = [
    [5, 1, 2, "incertain"], // reproduction de Work
    [5, 1, 1, "presence"],
    [5, 1, 0.8, "presence"], // plancher exact à 5 km : d = 5
    [5, 1, 0.79, "incertain"], // sous le plancher de 5 km
    [10, 1, 0.6, "presence"],
    [10, 1, 0.59, "incertain"],
    [15, 1, 0.4, "presence"],
    [15, 1, 0.39, "incertain"],
    [25, 1, 0.01, "presence"],
    [5, 3, 2.4, "presence"], // 3 × 0,8 : plancher exact, flottant compris
    [5, 3, 2.39, "incertain"],
    [5, 3, 3, "presence"],
    [5, 3, 3.01, "incertain"], // au-dessus du compte
    [25, 2, 5, "incertain"],
    [5, 0, 0, "absence"],
    [25, 0, 0, "absence"],
    [5, 0, 0.3, "incertain"],
    [25, 0, 0.01, "incertain"],
    [10, 2, 0, "incertain"], // sous le plancher de 10 km
    [25, 2, 0, "incertain"], // frontière à 25 km : possible, gardée incertaine par prudence
    [5, undefined, 2, "presence"], // sans compte : le repli sur l'accès pondéré > 0 reste nécessaire (index réel)
    [25, null, 0.01, "presence"],
    [10, undefined, 0, "absence"],
    // Rayon hors convention BPE (5, 10, 15, 25 km).
    [7, 1, 0.9, "incertain"],
    [30, undefined, 1, "incertain"],
    [25.5, undefined, 1, "incertain"],
    [0, undefined, 1, "incertain"],
    ["5", 1, 0.9, "incertain"],
  ];
  for (const [r, n, a, attendu] of cas) assert.equal(e(r, n, a), attendu, `rayon ${String(r)}, compte ${String(n)}, accès ${String(a)}`);
});

test("revue 3. reproduction de Work : 1 établissement pour un accès de 2 ne donne pas l'identité, score inchangé", () => {
  for (const insee of VILLES_ETUDIANTES) {
    const reel = commune(insee);
    const c = { ...reel, etudesSup: { measured: true, radiusKm: 5, establishmentCount: 1, weightedAccess: 2 } };
    assert.equal(V.etatEtablissementSup(c.etudesSup), "incertain", insee);
    assert.equal(V.buildIdentiteCandidates(c).includes(IDENTITE_ETUDIANTE), false, insee);
    assert.equal(V.presenceEtudiante(c, 0), "forte présence étudiante", insee);
    assert.equal(vie(c), vie(reel), insee);
    // Les données réelles gardent l'identité.
    assert.ok(V.buildIdentiteCandidates(reel).includes(IDENTITE_ETUDIANTE), insee);
  }
});
