import { test, before, describe } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import {
  classerAdresse, cheminLot, communeDeCle, departementDe, distanceM, ECART_DOUTEUX_M, FORMAT_INDEX_FIBRE, LETTRE_ETAT,
  lectureDepuisCode, lotDe, normaliserVoie, webMercatorVersWgs84,
  type ImmeubleLu, type LectureFibre, type LettreStatut,
} from "./fibre-adresse.ts";
import { texteFibre, type TexteFibre } from "./fibre-adresse-texte.ts";
import { sourcesAbsentes, issueActualisation, type VersionLogement } from "./logement-report-version.ts";
import type { LogementReport } from "./logement-report-types.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-156 (28/10/2026) : LA FIBRE À L'ADRESSE, AU NIVEAU DE PRÉCISION QUE LES SOURCES GARANTISSENT.
//
// Les cas réels (`__fixtures__/fut156/17.json`) sont les LIGNES BRUTES des fichiers officiels du T2 2026
// (base_imb, actuel, Immeuble, BAN) pour 55 adresses : les 49 du POC FUT-148, puis des contre-épreuves (le
// 11 place Blair, des comptes d'opérateurs différents sous une même adresse, un bâtiment à 856 m, une
// apostrophe typographique). Le classement est REJOUÉ ici depuis ces lignes, par un assemblage écrit dans ce
// test, et comparé au code publié par la construction nationale.
//
// « Le bloc apparaît » et « le bloc dit vrai » sont deux assertions distinctes (AGENTS.md) : les textes
// sont vérifiés tels que le lecteur les lit, et pour ce qu'ils ne doivent jamais dire.
// ════════════════════════════════════════════════════════════════════════════════════════════

const META = { millesime: "2026T2", donneesAu: "2026-06-30" };

// ── Les cas réels ────────────────────────────────────────────────────────────────────────────
type Ligne = Record<string, string>;
type Cas = { id: string; ban: Ligne[]; immeubles: Ligne[]; etats: Record<string, string[]>; actuel: Record<string, Ligne[]>; codePublie: string | null };
const FIXTURE = JSON.parse(readFileSync("src/lib/__fixtures__/fut156/17.json", "utf8")) as { cas: Cas[] };
const cas = (id: string) => {
  const c = FIXTURE.cas.find((x) => x.id === id);
  assert.ok(c, `cas ${id} absent de la fixture`);
  return c;
};

/** L'assemblage du test : des lignes brutes aux immeubles d'une adresse, sans le code du pipeline. */
const PREF = ["entrée", "bâtiment", "logement", "délivrance postale", "parcelle", "segment", "service technique"];
function rejouer(c: Cas): string | null {
  const b = [...c.ban].sort((x, y) => (PREF.indexOf(x.type_position) + 99) % 100 - (PREF.indexOf(y.type_position) + 99) % 100)[0];
  const parCle = c.immeubles.filter((r) => r.addr_code === c.id);
  const parLib = parCle.length ? [] : c.immeubles.filter((r) => r.imb_source === "fo" && r.addr_source !== "ban"
    && r.addr_code_insee === b.code_insee && r.addr_numero === b.numero && r.addr_rep.toUpperCase() === b.rep.toUpperCase()
    && normaliserVoie(r.addr_nom_voie) === normaliserVoie(b.nom_voie));
  const imm = parCle.length ? parCle : parLib;
  const lus: ImmeubleLu[] = imm.map((r) => {
    const e = [...new Set(c.etats[r.imb_code] ?? [])];
    const [lon, lat] = webMercatorVersWgs84(Number(r.imb_x), Number(r.imb_y));
    const lignesActuel = c.actuel[r.imb_id];
    return {
      source: r.imb_source,
      etat: e.length === 1 ? (e[0] ? LETTRE_ETAT[e[0]] : undefined) : e.length > 1 ? null : undefined,
      distanceM: distanceM(lon, lat, Number(b.lon), Number(b.lat)),
      operateursFibre: lignesActuel ? new Set(lignesActuel.filter((l) => l.code_techno === "FO").map((l) => l.code_operateur)) : undefined,
    };
  });
  return classerAdresse(lus, parLib.length > 0 && !parCle.length);
}

// ── Le rendu (dispositif de FUT-96 : TSX transpilé, modules CSS remplacés) ──────────────────────
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
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\\.[cm]?[jt]sx?$|\\.json$|\\.css$/.test(spec)) {
    return premier([spec + ".ts", spec + ".tsx", spec], ctx, next);
  }
  if (spec === "next/link") return next("next/link.js", ctx);
  return next(spec, ctx);
}
export async function load(url, ctx, next) {
  if (url.endsWith(".css")) return { format: "module", source: "export default new Proxy({}, { get: (_, k) => String(k) });", shortCircuit: true };
  if (!url.endsWith(".tsx")) return next(url, ctx);
  const fichier = fileURLToPath(url);
  const { outputText } = ts.transpileModule(readFileSync(fichier, "utf8"), {
    fileName: fichier,
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return { format: "module", source: outputText, shortCircuit: true };
}`;

let rendre: (l: LectureFibre | null | undefined) => string;
let rendreHtml: (l: LectureFibre | null | undefined) => string;
let lireFibreAdresse: (banId: string | null, env: NodeJS.ProcessEnv) => Promise<LectureFibre | undefined>;
let oublierPointeurFibre: () => void;

before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { createElement } = await import("react");
  const { FibreAdresseSection } = await import("../components/report/logement/FibreAdresseSection.tsx");
  rendreHtml = (l) => renderToStaticMarkup(createElement(FibreAdresseSection, { lecture: l }));
  rendre = (l) => texte(rendreHtml(l));
  ({ lireFibreAdresse, oublierPointeurFibre } = await import("./server/fibre-adresse-index.ts"));
});

/** Le texte que lit le lecteur : balises retirées, entités décodées, espaces insécables normalisées. */
function texte(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&apos;/g, "'").replace(/&quot;/g, "\"").replace(/&amp;/g, "&").replace(/&nbsp;| /g, " ")
    .replace(/’/g, "'").replace(/\s+/g, " ").trim();
}

/** Ce qu'aucun texte ne doit dire : une éligibilité du logement, un zéro supposé, un nom, un débit, un prix. */
const INTERDITS = [
  /(logement|appartement|maison) (est|sera) [ée]ligible/i, /vous (êtes|serez) [ée]ligible/i, /\b0 op[ée]rateur/i,
  /sans internet/i, /pas d'internet/i, /\b(Orange|Free|SFR|Bouygues|Nordnet|MilkyWan)\b/, /\b\d+\s?(Mb|Gb|Mbit|Gbit)/i,
  /\bdébit (de|jusqu)/i, /€|\bprix\b|tarif/i, /garanti/i,
];
/** La seule phrase qui nomme ces notions le fait pour dire qu'elles ne sont PAS reprises. */
const NEGATION_COMPARATIF = "Ce n'est pas un comparatif : ni noms, ni prix, ni débits.";
function sansInterdit(t: string) {
  const u = t.replace(NEGATION_COMPARATIF, "");
  for (const r of INTERDITS) assert.doesNotMatch(u, r, `texte interdit ${r} dans : ${u}`);
}

// ════════════════════════════════════════════════════════════════════════════════════════════
describe("1. Le classement d'une adresse", () => {
  const imm = (o: Partial<ImmeubleLu> = {}): ImmeubleLu => ({ source: "fo", etat: "D", distanceM: 10, operateursFibre: new Set(["A", "B", "C"]), ...o });

  test("aucun immeuble : l'adresse n'entre pas dans l'index", () => {
    assert.equal(classerAdresse([], false), null);
  });

  test("seulement des points sans donnée fibre : I, jamais un état", () => {
    assert.equal(classerAdresse([imm({ source: "ban" }), imm({ source: "cada" })], false), "I");
  });

  test("un état, ses opérateurs distincts, le barreau et le nombre de bâtiments", () => {
    assert.equal(classerAdresse([imm()], false), "D3");
    assert.equal(classerAdresse([imm()], true), "~D3");
    assert.equal(classerAdresse([imm(), imm()], false), "D3/2");
    // Un point sans donnée fibre à côté d'un immeuble fibre ne compte pas comme bâtiment fibre.
    assert.equal(classerAdresse([imm(), imm({ source: "ban", etat: undefined })], false), "D3");
  });

  test("des comptes différents selon le bâtiment : une plage, jamais un nombre unique", () => {
    assert.equal(classerAdresse([imm(), imm({ operateursFibre: new Set(["A", "B"]) })], false), "D2-3/2");
  });

  test("absent de la table d'éligibilité : nombre non établi ; présent sans offre fibre : zéro", () => {
    assert.equal(classerAdresse([imm({ operateursFibre: undefined })], false), "D");
    assert.equal(classerAdresse([imm({ etat: "R", operateursFibre: new Set() })], false), "R0");
    // Un seul immeuble non établi suffit : on ne compte pas sur la moitié des bâtiments.
    assert.equal(classerAdresse([imm(), imm({ operateursFibre: undefined })], false), "D/2");
  });

  test("un pseudo-opérateur (« en cours de collecte », inconnu, fictif) : nombre non établi, état conservé", () => {
    for (const p of ["CCC", "CCCC", "??", "FORM", "ARCEP"]) {
      assert.equal(classerAdresse([imm({ operateursFibre: new Set(["A", p]) })], false), "D");
    }
  });

  test("états divergents : A, avec les états lus ; état absent ou contradictoire : U", () => {
    assert.equal(classerAdresse([imm(), imm({ etat: "C" })], false), "A:CD/2");
    assert.equal(classerAdresse([imm({ etat: undefined })], false), "U");
    assert.equal(classerAdresse([imm({ etat: null })], false), "U");
  });

  test(`un bâtiment à plus de ${ECART_DOUTEUX_M} m : G, quel que soit l'état des autres`, () => {
    assert.equal(classerAdresse([imm({ distanceM: ECART_DOUTEUX_M })], false), "D3");
    assert.equal(classerAdresse([imm({ distanceM: ECART_DOUTEUX_M + 1 })], false), "G");
    assert.equal(classerAdresse([imm({ distanceM: 2 }), imm({ distanceM: 856 })], false), "G/2");
    // La distance retire une conclusion, elle n'en ajoute pas : deux états différents dont un loin restent sans état.
    assert.equal(classerAdresse([imm({ distanceM: 3, etat: "C" }), imm({ distanceM: 178 })], false), "G/2");
  });
});

// ════════════════════════════════════════════════════════════════════════════════════════════
describe("2. Le code et sa lecture", () => {
  test("chaque code produit se relit, et un code illisible n'est jamais une conclusion", () => {
    const codes = ["D5", "~D5", "D4-5/2", "R0", "Q0", "E0", "C0", "S0", "D", "D/2", "A:CD/2", "G", "G/4", "~G", "I", "U/2", "X0"];
    for (const c of codes) assert.notEqual(lectureDepuisCode(c, META).statut, "indisponible", c);
    for (const c of ["", "Z5", "D5x", "A:", "5", "~"]) assert.equal(lectureDepuisCode(c, META).statut, "indisponible", c);
  });

  test("les lectures portent l'état, le rattachement, les bâtiments et les opérateurs", () => {
    assert.deepEqual(lectureDepuisCode("D4-5/2", META), {
      statut: "deploye", operateurs: { etat: "plage", min: 4, max: 5 }, rattachement: "cle_ban", batiments: 2, ...META,
    });
    assert.deepEqual(lectureDepuisCode("~C0", META), {
      statut: "etudes", etatOfficiel: "cible", operateurs: { etat: "nombre", n: 0 }, rattachement: "libelle", ...META,
    });
    assert.deepEqual(lectureDepuisCode("D", META).operateurs, { etat: "non_etabli" });
    assert.deepEqual(lectureDepuisCode(undefined, META), { statut: "a_verifier", motif: "non_rattachee", ...META });
    assert.equal(lectureDepuisCode("X0", META).motif, "abandonne");
    assert.deepEqual(lectureDepuisCode("A:CD/2", META).etatsDivergents, ["études réalisées (cible)", "déployé"]);
    // Sans état certain, aucun nombre d'opérateurs n'est attribué.
    for (const c of ["A:CD/2", "G/2", "I", "U", "X0"]) assert.equal(lectureDepuisCode(c, META).operateurs, undefined, c);
  });

  test("le lot d'une commune est stable, et les identifiants récents ou à indice gardent leur commune", () => {
    assert.equal(lotDe("17300", 21), lotDe("17300", 21));
    assert.equal(lotDe("17300", 1), 0);
    const parLot = new Array(21).fill(0);
    for (let i = 17000; i < 17500; i++) parLot[lotDe(String(i), 21)]++;
    assert.ok(Math.max(...parLot) < 3 * Math.min(...parLot), `répartition déséquilibrée ${parLot}`);
    assert.equal(cheminLot("2026T2", "17", 3), "2026T2/17-03.json.gz");
    assert.equal(communeDeCle("17351_491iak_00013"), "17351");
    assert.equal(communeDeCle("17299_0810_00049_bis"), "17299");
    assert.equal(communeDeCle("2A004_0123_00001"), "2A004");
    // La BAN écrit les communes corses en minuscules : la commune reste le code INSEE.
    assert.equal(communeDeCle("2a001_cjjuix_00068"), "2A001");
    assert.equal(communeDeCle("x"), null);
    assert.deepEqual(["17300", "2A004", "97411", "75101"].map(departementDe), ["17", "2A", "974", "75"]);
  });

  test("le libellé : accents et apostrophes typographiques ne séparent pas deux voies identiques", () => {
    assert.equal(normaliserVoie("Rue de l’Hospice"), normaliserVoie("RUE DE L'HOSPICE"));
    assert.equal(normaliserVoie("Allée de l’Albatros"), "ALLEE DE L ALBATROS");
  });
});

// ════════════════════════════════════════════════════════════════════════════════════════════
describe("3. Les adresses réelles (T2 2026, Charente-Maritime)", () => {
  test("les 55 cas rejoués depuis les lignes officielles donnent le code publié par la construction", () => {
    assert.equal(FIXTURE.cas.length, 55);
    for (const c of FIXTURE.cas) assert.equal(rejouer(c), c.codePublie, c.id);
  });

  test("10 et 11 place Blair : deux voisins immédiats, deux états, aucun emprunt", () => {
    const dix = lectureDepuisCode(cas("17415_0510_00010").codePublie ?? undefined, META);
    const onze = lectureDepuisCode(cas("17415_0510_00011").codePublie ?? undefined, META);
    assert.equal(dix.statut, "raccordable_demande");
    assert.equal(onze.statut, "deploye");
    assert.deepEqual(onze.operateurs, { etat: "nombre", n: 5 });
    // Au 10, aucun opérateur ne déclare d'offre fibre : un zéro prouvé (l'immeuble est dans la table).
    assert.deepEqual(dix.operateurs, { etat: "nombre", n: 0 });
    assert.match(rendre(dix), /raccordable à la fibre sur demande/);
    assert.doesNotMatch(rendre(dix), /déployée/);
  });

  test("3 allée de l'Albatros : « cible » à 3 m, « déployé » à 178 m sous la même clé : à vérifier", () => {
    const l = lectureDepuisCode(cas("17385_9eyuk6_00003").codePublie ?? undefined, META);
    assert.equal(l.statut, "a_verifier");
    assert.equal(l.motif, "batiment_eloigne");
    assert.equal(l.operateurs, undefined);
    assert.match(rendre(l), /Raccordement à vérifier/);
    assert.match(rendre(l), /L'un des 2 bâtiments que l'Arcep associe à cette adresse se trouve à plus de 150 mètres/);
    assert.doesNotMatch(rendre(l), /déployée|études réalisées/);
  });

  test("13 route de l'Ilate : un des deux immeubles est à 856 m, rien n'est conclu", () => {
    assert.equal(cas("17421_0976_00013").codePublie, "G/2");
  });

  test("plusieurs immeubles, même état, comptes différents : une plage « selon le bâtiment »", () => {
    for (const id of ["17017_0121_00003", "17351_491iak_00013", "17480_31nosj_00008"]) {
      const l = lectureDepuisCode(cas(id).codePublie ?? undefined, META);
      assert.equal(l.statut, "deploye", id);
      assert.equal(l.operateurs?.etat, "plage", id);
      const t = rendre(l);
      assert.match(t, /Selon le bâtiment, 4 à 5 opérateurs déclarent une offre fibre/, id);
      assert.doesNotMatch(t, /\b[45] opérateurs déclarent une offre fibre pour/, id);
    }
  });

  test("plusieurs immeubles de même état et de même compte : le nombre, pour chacun", () => {
    const l = lectureDepuisCode(cas("17240_1060_00009_b").codePublie ?? undefined, META);
    assert.match(rendre(l), /5 opérateurs déclarent une offre fibre pour chacun de ces bâtiments/);
    assert.match(rendre(l), /les 2 bâtiments associés à cette adresse/);
  });

  test("bis, ter et identifiants récents sans immeuble : non rattachés, jamais un voisin", () => {
    for (const id of ["17299_0810_00049_bis", "17421_0700_00007_ter", "17303_0092_00022_c", "17003_npth3o_00030", "17362_a017_00004", "17449_p8b1gj_00005"]) {
      const c = cas(id);
      assert.equal(c.codePublie, null, id);
      assert.equal(c.immeubles.length, 0, id);
      assert.equal(lectureDepuisCode(undefined, META).motif, "non_rattachee");
    }
  });

  test("une apostrophe typographique n'empêche pas le rattachement par le libellé exact", () => {
    assert.equal(cas("17434_1235_00003").codePublie, "~D5");
  });

  test("les 34 adresses (43 immeubles) vérifiées sur la carte officielle (POC FUT-148) : même état, ou retirées par la distance", () => {
    const poc = JSON.parse(readFileSync("src/lib/__fixtures__/fut156/poc-fut148-cartefibre.json", "utf8")) as Array<{ ban_id: string; statut: string }>;
    assert.equal(poc.length, 34);
    const LETTRE = Object.fromEntries(Object.entries(LETTRE_ETAT).map(([k, v]) => [v, k]));
    const retires: string[] = [];
    for (const p of poc) {
      const code = cas(p.ban_id).codePublie ?? "";
      const m = /^~?([DRQECSX])/.exec(code);
      if (m) assert.ok(p.statut.split(" / ").includes(LETTRE[m[1] as LettreStatut]), `${p.ban_id} : ${code} contre ${p.statut}`);
      else retires.push(`${p.ban_id} ${code}`);
    }
    // Les ambigus du POC le restent (ou passent par la distance), et un seul « fiable » est retiré : le
    // 28 c rue du Petit Coudret, dont le point BAN est un milieu de voie à 299 m de l'immeuble.
    assert.deepEqual(retires.sort(), ["17091_0062_00004 G/4", "17208_0070_00017 A:CD/2", "17385_9eyuk6_00003 G/2", "17415_2722_00028_c ~G", "17415_3692_00001 A:CD/2"]);
  });
});

// ════════════════════════════════════════════════════════════════════════════════════════════
describe("4. Ce que les textes disent, et ne disent jamais", () => {
  const TOUS = ["D5", "D1", "D0", "D", "~D5", "D4-5/2", "D5/2", "R0", "R0/2", "Q0", "E0", "E0/2", "C0", "S0", "A:CD/2", "G", "G/2", "I", "U", "X0"];

  test("chaque état : le fait daté, la limite, la vérification, et aucun interdit", () => {
    for (const c of [...TOUS, undefined]) {
      const l = lectureDepuisCode(c, META);
      const t = rendre(l);
      sansInterdit(t);
      assert.match(t, /Fibre à cette adresse/, String(c));
      assert.match(t, /Ma connexion internet/, String(c));
      assert.match(t, /test d'éligibilité chez un opérateur/, String(c));
      assert.match(t, /Arcep · T2 2026/, String(c));
    }
  });

  test("déployé : la phrase demandée, puis le nombre, et le bâtiment n'est pas un logement", () => {
    const t = rendre(lectureDepuisCode("D5", META));
    assert.match(t, /Selon l'Arcep, la fibre est indiquée comme déployée pour le bâtiment associé à cette adresse, au 30 juin 2026\./);
    assert.match(t, /5 opérateurs déclarent une offre fibre pour ce bâtiment\./);
    assert.match(t, /pas celui d'un logement précis/);
    assert.match(rendre(lectureDepuisCode("D1", META)), /1 opérateur déclare une offre fibre pour ce bâtiment\./);
  });

  test("nombre non établi : l'état reste, aucun chiffre n'apparaît", () => {
    const t = rendre(lectureDepuisCode("D", META));
    assert.match(t, /déployée/);
    assert.match(t, /Le nombre d'opérateurs qui y déclarent une offre fibre n'est pas établi\./);
    assert.doesNotMatch(t, /\d+ opérateurs? déclare/);
  });

  test("un zéro n'est dit que prouvé, et sans « 0 »", () => {
    assert.match(rendre(lectureDepuisCode("R0", META)), /Aucun opérateur ne déclare encore d'offre fibre pour ce bâtiment\./);
  });

  test("à vérifier : la phrase demandée, le motif, et ni état ni nombre", () => {
    for (const c of ["A:CD/2", "G", "I", "U", "X0", undefined]) {
      const t = rendre(lectureDepuisCode(c, META));
      assert.match(t, /Raccordement à vérifier : les données disponibles ne permettent pas de déterminer avec certitude le statut de cette adresse\./);
      assert.doesNotMatch(t, /opérateurs? déclarent? une offre/);
      assert.doesNotMatch(t, /indiquée comme déployée/);
    }
    assert.match(rendre(lectureDepuisCode("A:CD/2", META)), /leurs états diffèrent \(études réalisées \(cible\), déployé\)/);
    assert.match(rendre(lectureDepuisCode("G", META)), /plus de 150 mètres/);
    assert.match(rendre(lectureDepuisCode(undefined, META)), /adresse récente, ou un numéro avec indice/);
  });

  test("une panne n'est ni une absence de fibre ni « à vérifier » faute de bâtiment", () => {
    const t = rendre({ statut: "indisponible" });
    assert.match(t, /Fibre non vérifiée/);
    assert.match(t, /Ce n'est pas une absence de fibre/);
    assert.doesNotMatch(t, /Aucun bâtiment|aucune offre/i);
  });

  test("un rapport antérieur, ou une lecture non activée : rien du tout", () => {
    assert.equal(rendreHtml(undefined), "");
    assert.equal(rendreHtml(null), "");
    assert.equal(texteFibre(undefined), null);
  });

  test("la méthode et les définitions sont dans le dépliable, pas au premier niveau", () => {
    const html = rendreHtml(lectureDepuisCode("D5", META));
    const avant = html.slice(0, html.indexOf("<details"));
    assert.doesNotMatch(avant, /Base adresse nationale|Raccordable sur demande :/);
    assert.match(html.slice(html.indexOf("<details")), /Base adresse nationale/);
    assert.match(html, /href="https:\/\/maconnexioninternet\.arcep\.fr\/"/);
  });

  test("les textes ne sortent pas de leur fonction de rendu (aucun « undefined », « null », « NaN »)", () => {
    for (const c of [...TOUS, undefined]) {
      const t: TexteFibre | null = texteFibre(lectureDepuisCode(c, META));
      assert.doesNotMatch(JSON.stringify(t), /undefined|null|NaN/, String(c));
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════════════════════
describe("5. La lecture de l'index publié (bucket privé, une lecture par analyse)", () => {
  const ENV = { FIBRE_ADRESSE_BUCKET: "fibre-adresse", NEXT_PUBLIC_SUPABASE_URL: "https://exemple.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "cle-serveur" } as unknown as NodeJS.ProcessEnv;
  const MANIFESTE = { format: FORMAT_INDEX_FIBRE, millesime: "2026T2", donneesAu: "2026-06-30", lots: { "17": 21 } };
  const LOT = { format: FORMAT_INDEX_FIBRE, millesime: "2026T2", departement: "17", lot: lotDe("17415", 21), communes: { "17415": { "0510_00010": "R0", "0510_00011": "D5" } } };

  function simuler(reponses: Record<string, () => Response>) {
    const appels: { url: string; auth: string | null }[] = [];
    const avant = globalThis.fetch;
    globalThis.fetch = (async (u: string | URL, init?: RequestInit) => {
      const url = String(u);
      appels.push({ url, auth: new Headers(init?.headers).get("authorization") });
      const chemin = url.split("/storage/v1/object/fibre-adresse/")[1].split("?")[0];
      const r = reponses[chemin];
      return r ? r() : new Response("introuvable", { status: 404 });
    }) as typeof fetch;
    return { appels, restaurer: () => { globalThis.fetch = avant; } };
  }
  const json = (o: unknown) => () => new Response(JSON.stringify(o));
  const gz = (o: unknown) => () => new Response(gzipSync(JSON.stringify(o)));
  const NORMAL = {
    "courant.json": json({ format: FORMAT_INDEX_FIBRE, millesime: "2026T2" }),
    "2026T2/manifest.json": json(MANIFESTE),
    [cheminLot("2026T2", "17", lotDe("17415", 21))]: gz(LOT),
  };

  test("non activée (aucun bucket configuré) : rien n'est lu, rien n'est écrit dans le rapport", async () => {
    const s = simuler(NORMAL);
    try {
      assert.equal(await lireFibreAdresse("17415_0510_00011", {} as NodeJS.ProcessEnv), undefined);
      assert.equal(s.appels.length, 0);
    } finally { s.restaurer(); }
  });

  test("une analyse lit son lot ; le pointeur et le manifeste restent en mémoire de l'instance", async () => {
    oublierPointeurFibre();
    const s = simuler(NORMAL);
    try {
      const onze = await lireFibreAdresse("17415_0510_00011", ENV);
      assert.equal(onze?.statut, "deploye");
      assert.equal(onze?.millesime, "2026T2");
      assert.equal(s.appels.length, 3);
      assert.ok(s.appels.every((a) => a.auth === "Bearer cle-serveur"));
      const dix = await lireFibreAdresse("17415_0510_00010", ENV);
      assert.equal(dix?.statut, "raccordable_demande");
      assert.equal(s.appels.length, 4, "une seule lecture pour la seconde analyse");
      const absente = await lireFibreAdresse("17415_0510_00099", ENV);
      assert.deepEqual(absente, { statut: "a_verifier", motif: "non_rattachee", millesime: "2026T2", donneesAu: "2026-06-30" });
    } finally { s.restaurer(); }
  });

  test("lot manquant, contenu illisible, département non couvert, réseau en panne : indisponible, jamais une absence", async () => {
    const cas: Array<[string, Record<string, () => Response>, string]> = [
      ["lot manquant", { ...NORMAL, [cheminLot("2026T2", "17", lotDe("17415", 21))]: () => new Response("", { status: 404 }) }, "17415_0510_00011"],
      ["lot illisible", { ...NORMAL, [cheminLot("2026T2", "17", lotDe("17415", 21))]: () => new Response("pas du gzip") }, "17415_0510_00011"],
      ["lot d'un autre millésime", { ...NORMAL, [cheminLot("2026T2", "17", lotDe("17415", 21))]: gz({ ...LOT, millesime: "2026T1" }) }, "17415_0510_00011"],
      ["département non couvert", NORMAL, "33063_0001_00001"],
      ["pointeur absent", {}, "17415_0510_00011"],
      ["manifeste d'un autre format", { ...NORMAL, "2026T2/manifest.json": json({ ...MANIFESTE, format: "autre" }) }, "17415_0510_00011"],
    ];
    for (const [nom, rep, id] of cas) {
      oublierPointeurFibre();
      const s = simuler(rep);
      try {
        assert.equal((await lireFibreAdresse(id, ENV))?.statut, "indisponible", nom);
      } finally { s.restaurer(); }
    }
    oublierPointeurFibre();
    const avant = globalThis.fetch;
    globalThis.fetch = (async () => { throw new Error("réseau"); }) as typeof fetch;
    try {
      assert.equal((await lireFibreAdresse("17415_0510_00011", ENV))?.statut, "indisponible");
    } finally { globalThis.fetch = avant; }
  });

  test("sans identifiant BAN, ou avec un identifiant sans commune : rien n'est conclu ni lu", async () => {
    const s = simuler(NORMAL);
    try {
      assert.equal(await lireFibreAdresse(null, ENV), undefined);
      assert.equal(await lireFibreAdresse("pas-une-cle", ENV), undefined);
      assert.equal(s.appels.length, 0);
    } finally { s.restaurer(); }
  });
});

// ════════════════════════════════════════════════════════════════════════════════════════════
describe("6. Le rapport enregistré et ses versions", () => {
  const base = { address: { id: "17415_0510_00011", label: "x", city: null, citycode: "17415", postcode: null, latitude: 45.7, longitude: -0.6 } } as LogementReport;
  const version = (r: LogementReport): VersionLogement => ({ numero: 1, collecteeLe: "2026-10-28", sourcesAbsentes: sourcesAbsentes(r), synthese: null, syntheseHash: null, report: r, reportHash: "h1", syntheseDpe: null });

  test("une panne est une source muette ; « à vérifier » et un rapport antérieur n'en sont pas", () => {
    assert.ok(sourcesAbsentes({ ...base, fibre: { statut: "indisponible" } }).includes("fibre"));
    assert.ok(!sourcesAbsentes({ ...base, fibre: lectureDepuisCode(undefined, META) }).includes("fibre"));
    assert.ok(!sourcesAbsentes(base).includes("fibre"));
  });

  test("une actualisation ne remplace pas une lecture par une panne, ni par une lecture disparue", () => {
    const avec = { ...base, fibre: lectureDepuisCode("D5", META) };
    assert.equal(issueActualisation({ ...base, fibre: { statut: "indisponible" } }, "h2", version(avec)), "refusee");
    assert.equal(issueActualisation(base, "h2", version(avec)), "refusee");
    assert.equal(issueActualisation({ ...base, fibre: lectureDepuisCode("D4", { millesime: "2026T3", donneesAu: "2026-09-30" }) }, "h2", version(avec)), "nouvelle_version");
    // Un dossier antérieur à FUT-156 reçoit la lecture à sa prochaine actualisation.
    assert.equal(issueActualisation(avec, "h2", version(base)), "nouvelle_version");
  });

  test("la lecture ne touche pas la synthèse rédigée : son empreinte ignore la fibre", async () => {
    const { buildFactHash } = await import("./logement-synthesis-cache.ts");
    const donnees = { address: { label: "10 Place Blair 17100 Saintes" }, altitude: 20 };
    assert.equal(buildFactHash({ ...donnees, fibre: lectureDepuisCode("D5", META) } as never), buildFactHash(donnees));
  });
});
