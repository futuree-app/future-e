// FUT-141 · UNE AGGLOMÉRATION ÉTUDIANTE NE FAIT PAS, À ELLE SEULE, UNE VIE ÉTUDIANTE LOCALE.
//
// Deux corrections, sur l'index réel et le vrai moteur, sans aucun appel Anthropic :
//   1. le plateau des communes sans établissement du supérieur dans leur rayon passe, dans `etudes_acces`, du
//      rang du haut du groupe (40) au rang par le milieu (20) : seul ce plateau change (arbitrage du 29/10/2026) ;
//   2. une phrase « … dans l'agglomération de X » ne dit jamais un niveau au-dessus de la part étudiante de X :
//      le niveau venu de l'accès local n'est plus prêté à l'agglomération.
// Les 487 communes de la revue FUT-135 sont figées dans docs/audits/2026-10-29-fut141-vie-etudiante/.
// Le plateau contre la source BPE : scripts/fut141/plateau-etudes-acces.py (rapport, lecture seule).
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
const vie = (c: M) => V.subScore("vie_etudiante", c);
const PALIER_FORTE = 66; // bandIndex
const SEUIL_RAISON = 55; // raisons favorables
const NIVEAU = (s: number) => (s >= 66 ? 0 : s < 34 ? 2 : 1);
const IDENTITE_ETUDIANTE = "Pour une ville étudiante à taille humaine.";
const LES_487: { insee: string; nom: string; acces: number; dyn: number; vie: number }[] =
  JSON.parse(readFileSync("docs/audits/2026-10-29-fut141-vie-etudiante/les-487-avant.json", "utf8")).communes;
const ligneEtudiante = (cc: M) => cc.themes.flatMap((t: M) => t.lignes).find((l: M) => l.id === "vie_etudiante");
const THURINS = "69249", POITIERS = "86194";

test("plateau : 14 029 communes sans établissement au rang 20, aucune autre valeur d'accès ne bouge", () => {
  const plateau = INDEX.meta.etudesAcces.plateau;
  assert.deepEqual([plateau.communes, plateau.rangAvant, plateau.rang], [14029, 40, 20]);
  const a20 = INDEX.communes.filter((c) => c.etudes_acces === 20);
  assert.equal(a20.length, 14029);
  // Tout le plateau est à accès nul ; l'inverse ne tient pas : 94 communes arrondies à 0,00 ont un établissement
  // à la limite des 25 km (lues dans la source), et gardent leur rang (40 ou 41).
  for (const c of a20) assert.equal(c.etudesSup.weightedAccess, 0, c.insee);
  const arrondis = INDEX.communes.filter((c) => c.etudesSup?.weightedAccess === 0 && c.etudes_acces !== 20);
  assert.equal(arrondis.length, 94);
  for (const c of arrondis) assert.ok([40, 41].includes(c.etudes_acces) && c.etudesSup.radiusKm === 25, c.insee);
  // Plus aucune commune à 21-39 : le plateau ne chevauche aucune valeur positive.
  assert.equal(INDEX.communes.filter((c) => c.etudes_acces > 20 && c.etudes_acces < 40).length, 0);
});

test("Thurins : accès 20, agglomération de Lyon 92, score 63, palier intermédiaire ; Poitiers mène seule", async () => {
  const c = commune(THURINS);
  assert.deepEqual([c.etudes_acces, c.etudes_dyn, vie(c)], [20, 92, 63]);
  assert.equal(V.raisonNeg("vie_etudiante", c),
    "présence étudiante intermédiaire dans l'agglomération de Lyon, aucun établissement supérieur recensé à moins de 5 km");
  const r = await V.seedComparaison([THURINS, POITIERS]);
  const l = ligneEtudiante(r.comparaison);
  const cell = l.cellules.find((x: M) => x.insee === THURINS);
  assert.deepEqual([cell.palier, cell.qualifier], ["Présence étudiante intermédiaire dans l'agglomération de Lyon", "aucun établissement supérieur recensé à moins de 5 km"]);
  assert.deepEqual(l.avantage, { type: "avantage", insees: [POITIERS] }); // avant : égalité au palier fort
  assert.equal(r.comparaison.themes.find((t: M) => t.id === "vitalite").synthese, "Poitiers se distingue par sa vie étudiante.");
  assert.equal(V.communeToPreferences(c).preferences.some((p: M) => p.key === "vie_etudiante"), false);
});

test("les 487 de FUT-135 : 11 restent au palier fort, aucune n'est dite ville étudiante ni desservie", async () => {
  assert.equal(LES_487.length, 487);
  const apres = LES_487.map((x) => ({ ...x, c: commune(x.insee), s: vie(commune(x.insee)) }));
  // Seul l'accès change, de 40 à 20 ; la part de l'agglomération est intacte.
  for (const x of apres) assert.deepEqual([x.acces, x.c.etudes_acces, x.c.etudes_dyn], [40, 20, x.dyn], x.insee);
  assert.equal(apres.filter((x) => x.vie >= PALIER_FORTE).length, 255);
  assert.equal(apres.filter((x) => x.s >= PALIER_FORTE).length, 11);
  assert.equal(apres.filter((x) => x.s >= SEUIL_RAISON).length, 360);
  for (const x of apres) {
    assert.equal(x.s, Math.round(0.4 * 20 + 0.6 * x.dyn), x.insee); // pondérations 40/60 inchangées
    assert.equal(V.buildIdentiteCandidates(x.c).includes(IDENTITE_ETUDIANTE), false, x.insee);
    assert.equal(V.communeToPreferences(x.c).preferences.some((p: M) => p.key === "vie_etudiante"), false, x.insee);
    const phrase = V.raisonNeg("vie_etudiante", x.c);
    assert.match(phrase, /, aucun établissement supérieur recensé à moins de \d+ km$/, x.insee);
    assert.doesNotMatch(phrase, /ville étudiante|au moins un établissement/, x.insee);
    if (/^forte/.test(phrase)) assert.ok(x.s >= PALIER_FORTE && x.c.etudes_dyn >= PALIER_FORTE, x.insee);
  }
});

test("villes universitaires : scores, phrases et identités inchangés", () => {
  const attendu: Record<string, [number, string]> = {
    "86194": [99, "forte présence étudiante"], "35238": [100, "forte présence étudiante"],
    "49007": [99, "forte présence étudiante"], "2B096": [97, "forte présence étudiante"],
    "33522": [93, "forte présence étudiante dans l'agglomération de Bordeaux"],
    "38421": [98, "forte présence étudiante dans l'agglomération de Grenoble"],
    "59009": [96, "forte présence étudiante dans l'agglomération de Lille"],
  };
  for (const [insee, [score, phrase]] of Object.entries(attendu)) {
    const c = commune(insee);
    assert.equal(vie(c), score, insee);
    assert.equal(V.raisonNeg("vie_etudiante", c), phrase, insee);
  }
  for (const insee of ["86194", "35238", "49007", "2B096"]) assert.ok(V.buildIdentiteCandidates(commune(insee)).includes(IDENTITE_ETUDIANTE), insee);
});

test("grain : le niveau de présence ne dépasse jamais la part étudiante du bassin, pôle compris", () => {
  const niveaux = ["forte présence étudiante", "présence étudiante intermédiaire", "présence étudiante limitée"];
  const rangAucun = INDEX.meta.etudesDyn.vraiZero.rang;
  const n = { mesurees: 0, plafonnees: 0, poles: 0, aucun: 0, accesDit: 0 };
  for (const c of INDEX.communes) {
    const s = vie(c);
    if (s == null) continue;
    n.mesurees++;
    const phrase: string = V.raisonNeg("vie_etudiante", c);
    const etat = V.etatEtablissementSup(c.etudesSup);
    let accesSansPresence: boolean;
    if (c.etudes_dyn === rangAucun) {
      // Personne d'inscrit dans le bassin : aucune « présence », même limitée.
      n.aucun++;
      assert.match(phrase, /^aucun étudiant inscrit dans (la commune|son agglomération|l'agglomération (de |d'|du |des ))/, c.insee);
      assert.doesNotMatch(phrase, /présence/, c.insee);
      accesSansPresence = true;
    } else {
      const dit = niveaux.findIndex((x) => phrase.startsWith(x));
      // Le plus bas des deux : le palier du score (FUT-135) et celui de la part étudiante du bassin (FUT-141).
      assert.equal(dit, Math.max(NIVEAU(s), NIVEAU(c.etudes_dyn)), `${c.insee} ${phrase}`);
      accesSansPresence = dit > NIVEAU(s);
      if (accesSansPresence) {
        n.plafonnees++;
        if (!/agglomération/.test(phrase)) n.poles++;
      }
    }
    // L'accès se dit à part, avec son rayon, seulement s'il est positivement attesté et que la présence ne porte
    // pas le niveau du score ; l'absence démontrée se dit toujours (FUT-135).
    const rayon = c.etudesSup?.radiusKm;
    if (accesSansPresence && etat === "presence") {
      n.accesDit++;
      assert.ok(phrase.endsWith(`, au moins un établissement supérieur recensé à moins de ${rayon} km`), `${c.insee} ${phrase}`);
    } else assert.doesNotMatch(phrase, /au moins un/, c.insee);
    if (etat === "absence") assert.ok(phrase.endsWith(`, aucun établissement supérieur recensé à moins de ${rayon} km`), c.insee);
  }
  // 948 phrases hors pôle et 488 de pôles disaient, sur main, un niveau au-dessus de la part de leur bassin.
  assert.deepEqual(n, { mesurees: 5555, plafonnees: 649, poles: 135, aucun: 1280, accesDit: 1635 });
});

test("pôles : Montluçon, Gap, Vichy disent la présence de leur part étudiante et l'accès à part ; Vidauban, personne d'inscrit", async () => {
  const attendu: Record<string, [number, number, string]> = {
    "03185": [63, 70, "présence étudiante intermédiaire, au moins un établissement supérieur recensé à moins de 15 km"], // Montluçon
    "05061": [60, 68, "présence étudiante intermédiaire, au moins un établissement supérieur recensé à moins de 15 km"], // Gap
    "03310": [62, 72, "présence étudiante intermédiaire, au moins un établissement supérieur recensé à moins de 15 km"], // Vichy
    "83148": [12, 35, "aucun étudiant inscrit dans la commune, au moins un établissement supérieur recensé à moins de 25 km"], // Vidauban
  };
  for (const [insee, [dyn, score, phrase]] of Object.entries(attendu)) {
    const c = commune(insee);
    assert.deepEqual([c.etudes_dyn, vie(c)], [dyn, score], insee); // scores inchangés
    assert.equal(V.raisonNeg("vie_etudiante", c), phrase, insee);
  }
  // Montluçon mène toujours face à Pont-Salomon (le score n'a pas bougé), par l'établissement de son rayon.
  const r = await V.seedComparaison(["03185", "43153"]);
  const l = ligneEtudiante(r.comparaison);
  assert.deepEqual(l.avantage, { type: "avantage", insees: ["03185"] });
  assert.deepEqual(l.cellules.map((x: M) => [x.palier, x.qualifier])[0], ["Présence étudiante intermédiaire", "au moins un établissement supérieur recensé à moins de 15 km"]);
  assert.match(r.comparaison.themes.find((t: M) => t.id === "vitalite").synthese, /Montluçon par l'enseignement supérieur à sa portée\.$/);
  // Vidauban dans le Dossier comparatif des Maures : la cellule ne dit plus de présence.
  const m = await V.seedComparaison(["83067", "83063", "83148"]);
  const cell = ligneEtudiante(m.comparaison).cellules.find((x: M) => x.insee === "83148");
  assert.deepEqual([cell.palier, cell.qualifier], ["Aucun étudiant inscrit dans la commune", "au moins un établissement supérieur recensé à moins de 25 km"]);
  assert.equal(m.trio.find((x: M) => x.insee === "83148").signaux.vie_etudiante, "aucun étudiant inscrit dans la commune, au moins un établissement supérieur recensé à moins de 25 km");
});

test("hors pôle : Balan, agglomération sans étudiant inscrit, et Belleu qui mène par l'établissement de son rayon", async () => {
  const balan = commune("01027");
  assert.deepEqual([balan.etudes_dyn, vie(balan)], [12, 45]);
  assert.equal(V.raisonNeg("vie_etudiante", balan),
    "aucun étudiant inscrit dans l'agglomération de Béligneux, au moins un établissement supérieur recensé à moins de 25 km");
  // Belleu : 68 (palier fort) par l'accès, agglomération de Soissons à 65 (intermédiaire).
  const belleu = commune("02064");
  assert.deepEqual([belleu.etudes_dyn, vie(belleu)], [65, 68]);
  const r = await V.seedComparaison(["02064", "43153"]);
  const l = ligneEtudiante(r.comparaison);
  assert.deepEqual(l.avantage, { type: "avantage", insees: ["02064"] }); // l'avantage suit toujours le score
  const cell = l.cellules.find((x: M) => x.insee === "02064");
  assert.deepEqual([cell.palier, cell.qualifier], ["Présence étudiante intermédiaire dans l'agglomération de Soissons", "au moins un établissement supérieur recensé à moins de 15 km"]);
  const vitalite = r.comparaison.themes.find((t: M) => t.id === "vitalite").synthese;
  assert.match(vitalite, /Belleu par l'enseignement supérieur à sa portée\.$/);
});

// Contre-revue (29/10/2026), réserve 1 : l'identité « ville étudiante » exige la part étudiante du bassin au palier
// fort (etudes_dyn ≥ 66, borne existante), en plus du score ≥ 55 et d'un établissement positivement attesté dans le
// rayon du pôle. 259 → 134 candidates ; les scores ne bougent pas.
test("identité « ville étudiante » : part étudiante du bassin au palier fort, établissement attesté, score inchangé", async () => {
  const regle = (c: M) => (vie(c) ?? 0) >= SEUIL_RAISON && c.etudes_dyn != null && c.etudes_dyn >= PALIER_FORTE && V.villeEtudianteLocale(c);
  const candidates = INDEX.communes.filter((c) => V.buildIdentiteCandidates(c).includes(IDENTITE_ETUDIANTE));
  assert.equal(candidates.length, 134);
  for (const c of candidates) assert.ok(regle(c) && V.etatEtablissementSup(c.etudesSup) === "presence", c.insee);
  assert.equal(INDEX.communes.filter(regle).length, 134); // la règle et l'identité coïncident exactement
  // Pôles à part étudiante intermédiaire : plus d'identité, même score.
  const sortis: Record<string, [number, number]> = { "03185": [63, 70], "05061": [60, 68], "03310": [62, 72], "83137": [62, 75] };
  for (const [insee, [dyn, score]] of Object.entries(sortis)) {
    const c = commune(insee);
    assert.deepEqual([c.etudes_dyn, vie(c)], [dyn, score], insee);
    assert.equal(V.buildIdentiteCandidates(c).includes(IDENTITE_ETUDIANTE), false, insee);
  }
  assert.equal(V.buildIdentiteCandidates(commune("03185"))[0], "Pour un quotidien au calme, loin de l'agitation.");
  const r = await V.seedComparaison(["03185", "43153"]);
  assert.notEqual(r.trio.find((x: M) => x.insee === "03185").identite, IDENTITE_ETUDIANTE);
  // À la borne : Le Puy-en-Velay et Aurillac (part 66) la gardent, comme les grandes villes universitaires.
  for (const insee of ["43157", "15014", "86194", "35238", "49007", "2B096", "34172", "67482", "31555", "63113", "14118"]) {
    assert.equal(V.buildIdentiteCandidates(commune(insee)).includes(IDENTITE_ETUDIANTE), true, insee);
  }
});
