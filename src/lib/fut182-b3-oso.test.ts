// FUT-182 · B3 : LA NATURE AUTOUR DES ZONES BÂTIES, INTÉGRÉE. Ce que ces tests gardent :
//   1. l'index publié porte la méthode validée, et les conventions de classement (≥ 75 %, 50-75 %, < 50 %, sans bâti) ;
//   2. une commune sans classement établi ne récupère JAMAIS un ancien score, une bande ou un verdict ;
//   3. les PHRASES rendues (Territoire, Où vivre, /qna, Projet, synthèse) disent la mesure, sa limite et sa source,
//      et ne disent ni accès, ni distance, ni « eau comprise », ni « secteur » au sens d'une adresse ;
//   4. les seuils se comparent avant arrondi ; les parts OSO se citent au dixième (dette FUT-183).
import test, { before } from "node:test";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { buildTerritoireSnapshot, landCategory, LAND_LABEL, TERRITOIRE_REGISTRY_VERSION, type TerritoireInputs } from "./territoire/facts.ts";
import { factOf, derivedOf } from "./facts/contract.ts";
import { buildTerritoryCards } from "./territory-identity.ts";
import { projectForSynthesis, SYNTHESIS_CONTRACT_VERSION } from "./territoire/synthesis-contract.ts";
import { checkArrondisOso, checkSynthesis } from "./territoire/synthesis-checks.ts";
import { pctOso } from "./territoire/oso-format.ts";
import { chatelaillonInputs } from "./territoire/__fixtures__/chatelaillon.ts";
import { natureTest } from "./territoire/__fixtures__/nature-oso.ts";
import {
  COUVERTURE_CLASSEMENT_PCT, COUVERTURE_MINIMALE_PCT, NATURE_METHODE, classementEtabli, limiteSecteur, phraseSecteur,
  type NatureIndex,
} from "./oso/secteur-habite.ts";
import { mapCommuneToModuleFacts } from "./decision/module-facts-map.ts";
import { MISMATCH_RULES } from "./decision/mismatch-rules.ts";
import { ALIGNMENT_RULES } from "./decision/alignment-rules.ts";
import { MISMATCH_LABELS, ALIGNMENT_LABELS } from "./decision/mismatch-facts.ts";
import { distributionVersionDe } from "./decision/distributions-rang.ts";
import { ENGINE_VERSION } from "./decision/decision-artifact.ts";
import { getCommuneDistinctive } from "./trait-distinctif.ts";
import { mismatchRawScore } from "./comparateur-scores.ts";
import type { IndexCommune } from "./comparateur-vie.ts";
import type { UserProject } from "./user-project.ts";

type Entree = IndexCommune & { rankBands?: Record<string, [number, number]> };
const INDEX = JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8")) as { meta: Record<string, any>; communes: Entree[] };
const PAR = new Map(INDEX.communes.map((c) => [c.insee, c]));
const PLM = /^(751(0[1-9]|1\d|20)|6938[1-9]|132(0[1-9]|1[0-6]))$/;
const n = (insee: string) => PAR.get(insee)!.nature as NatureIndex;
const T0 = "2026-11-10T00:00:00.000Z";

// ── 1. L'index ──────────────────────────────────────────────────────────────────────────────────────────

test("index : la méthode validée, sur toutes les entrées ; 34 406 communes classées", () => {
  assert.equal(INDEX.meta.nature.methode, NATURE_METHODE);
  assert.match(INDEX.meta.nature.source, /Licence Ouverte 2\.0/);
  assert.ok(INDEX.meta.nature.gisco?.sha256, "la cause est établie par le masque GISCO, empreinte à l'appui");
  assert.equal(INDEX.communes.filter((c) => c.nature).length, 34788);
  assert.ok(INDEX.communes.every((c) => c.nature?.methode === NATURE_METHODE));
  const statuts: Record<string, number> = {};
  for (const c of INDEX.communes) if (!PLM.test(c.insee)) statuts[c.nature!.secteur.statut] = (statuts[c.nature!.secteur.statut] ?? 0) + 1;
  assert.deepEqual(statuts, { classe: 33173, classe_limite: 1233, non_classe: 329, non_calculable: 8 });
  assert.equal(INDEX.meta.nature.univers_score, 34406);
});

test("index : le statut suit la couverture française du disque (75 % et 50 %), avant arrondi", () => {
  for (const c of INDEX.communes) {
    const s = c.nature!.secteur;
    if (s.statut === "non_calculable") continue;
    const attendu = s.couvert_fr_pct >= COUVERTURE_CLASSEMENT_PCT ? "classe" : s.couvert_fr_pct >= COUVERTURE_MINIMALE_PCT ? "classe_limite" : "non_classe";
    assert.equal(s.statut, attendu, c.insee);
    assert.ok(s.p10 <= s.valeur + 1e-9 || s.valeur <= s.p90 + 1e-9, c.insee);
    assert.ok(s.cause === null || ["mer", "etranger", "mer_et_etranger", "non_attribuee"].includes(s.cause), c.insee);
  }
});

test("AUCUN ANCIEN SCORE NE REVIENT : hors classement, ni score, ni bande, ni sous-score, ni trait nature", () => {
  let vus = 0;
  for (const c of INDEX.communes) {
    const sans = PLM.test(c.insee) || !["classe", "classe_limite"].includes(c.nature!.secteur.statut);
    if (!sans) {
      assert.equal(typeof c.nature!.score, "number", c.insee);
      assert.ok(c.rankBands?.nature, `${c.insee} : une commune classée a sa bande`);
      continue;
    }
    vus++;
    assert.equal(c.nature!.score, null, c.insee);
    assert.equal(c.rankBands?.nature, undefined, c.insee);
    assert.equal(mismatchRawScore("nature", c), null, c.insee);
    assert.equal(classementEtabli(c.nature), false, c.insee);
    assert.notEqual(getCommuneDistinctive(c as never), "compte parmi les communes les plus entourées d'espaces naturels", c.insee);
  }
  assert.equal(vus, 329 + 8 + 45);
});

test("index : la distribution « nature » a une identité nouvelle, et le moteur est engine-9", () => {
  assert.equal(distributionVersionDe("nature"), "mismatch-dist-2026-11-10-nature");
  assert.equal(ENGINE_VERSION, "engine-9");
  assert.equal(TERRITOIRE_REGISTRY_VERSION, "territoire-facts@3");
  assert.match(SYNTHESIS_CONTRACT_VERSION, /^territoire-synthese@8:/);
});

test("Paris, Lyon, Marseille : ville entière sur ses propres pixels, arrondissements mesurés, jamais classés", () => {
  const plm = INDEX.meta.nature.communes_plm as Record<string, NatureIndex>;
  assert.deepEqual(Object.keys(plm).sort(), ["13055", "69123", "75056"]);
  for (const v of Object.values(plm)) assert.equal(v.score, null);
  assert.equal(plm["75056"].terres.naturel.toFixed(2), "17.25"); // B1 § 35
  assert.ok(n("75119").secteur.statut === "classe" && n("75119").score === null);
});

test("seuils avant arrondi : « parmi les 10 % les plus boisées » reste vraie, calculée sur l'index publié", () => {
  const communes = INDEX.communes.filter((c) => !PLM.test(c.insee));
  const boisees = communes.filter((c) => c.nature!.terres.foret >= 70).length;
  assert.equal(boisees, 3336);
  assert.ok(boisees / communes.length <= 0.10, `${boisees}/${communes.length}`);
  // Les deux sorties du seuil (B1 § 36) n'y passent plus par un arrondi.
  for (const k of ["30332", "39425"]) assert.ok(n(k).terres.foret < 70, k);
});

// ── 2. Territoire : faits, carte, synthèse ────────────────────────────────────────────────────────────────

function snapDe(insee: string) {
  const i: TerritoireInputs = chatelaillonInputs();
  const c = PAR.get(insee)!;
  i.insee = insee;
  i.communeName = c.nom;
  i.entry = { ...i.entry!, nature: { terres: c.nature!.terres, eau_pct: c.nature!.eau_pct, couverture_pct: c.nature!.couverture_pct, secteur: c.nature!.secteur } };
  return buildTerritoireSnapshot(i, T0);
}
const subhead = (insee: string) => {
  const c = buildTerritoryCards(snapDe(insee)).couvertNaturel!;
  return { c, texte: c.secteur && "valeur" in c.secteur ? c.secteur.limite ?? "" : "" };
};

test("Ouessant : la valeur est gardée, le classement n'est pas établi, et la cause (la mer) est dite", () => {
  const s = snapDe("29155");
  const f = factOf(s, "land.natural_share_sector")!;
  assert.equal((f.value as { statut: string }).statut, "non_classe");
  assert.equal(f.scale, "built_areas_15km");
  assert.match(f.limits!, /^Classement national non établi : la mer occupe environ 97,5 % du rayon de 15 km\./);
  assert.doesNotMatch(f.limits!, /donnée|manquant|incertain/i);
  const { c, texte } = subhead("29155");
  assert.ok(c.secteur && "valeur" in c.secteur && c.secteur.valeur === 85.2); // 85,224 tronqué
  assert.match(texte, /Classement national non établi/);
});

test("Charnois : la frontière est nommée parce que le masque GISCO l'établit, pas parce qu'un pixel manque", () => {
  const f = factOf(snapDe("08106"), "land.natural_share_sector")!;
  assert.match(f.limits!, /se trouve à l'étranger, hors du périmètre de cette mesure/);
});

test("une cause non attribuée reste neutre : « hors du territoire français étudié »", () => {
  const s = limiteSecteur({ statut: "non_classe", valeur: 50, p10: 50, p90: 50, couvert_fr_pct: 40, hors_fr: { mer: 30, etranger: 20, non_attribue: 10 }, cause: "non_attribuee" })!;
  assert.match(s, /environ 60,0 % du rayon de 15 km est hors du territoire français étudié/);
  assert.doesNotMatch(s, /mer|étranger/);
});

test("Saintes-Maries-de-la-Mer, Sète, Hyères (50 à 75 %) : valeur, rang, et la limite géographique visible", () => {
  for (const k of ["13096", "34301", "83069"]) {
    assert.equal(n(k).secteur.statut, "classe_limite", k);
    assert.equal(typeof n(k).score, "number", k);
    assert.match(subhead(k).texte, /^Autour des zones bâties de la commune, la mer occupe environ/, k);
  }
});

test("les huit communes sans bâti OSO : « non calculable avec cette méthode », aucune valeur montrée", () => {
  for (const k of ["2B045", "2B067", "2B106", "2B111", "2B264", "2B338", "31081", "65208"]) {
    const s = snapDe(k);
    const f = factOf(s, "land.natural_share_sector")!;
    assert.deepEqual(f.value, { statut: "non_calculable" }, k);
    assert.match(f.limits!, /^Non calculable avec cette méthode/, k);
    assert.deepEqual(buildTerritoryCards(s).couvertNaturel!.secteur, { nonCalculable: true }, k);
    assert.equal((projectForSynthesis(s, "gwl20") as any).espaces_naturels_autour_des_zones_baties, null, k);
  }
});

test("Grues et Héberville : les serres comptent avec les cultures (catégorie), restent un poste distinct, sans phrase d'activité", () => {
  const g = snapDe("85104");
  assert.equal(derivedOf(g, "land.category")!.value, "agricultural");
  const comp = factOf(g, "land.composition")!.value as Record<string, number>;
  assert.ok(comp.serres > 5 && comp.agricole + comp.serres >= 50 && comp.agricole < 50, JSON.stringify(comp));
  const p = projectForSynthesis(snapDe("76353"), "gwl20") as any;
  assert.ok(p.occupation_des_sols.dont_serres_dans_les_terres_agricoles_pct > 15);
  assert.match(p.occupation_des_sols.limites.serres, /ne concluez rien sur l'activité agricole/);
  const carte = buildTerritoryCards(g).couvertNaturel!;
  assert.ok(!carte.composition.some((x) => x.label === "Serres"), "les serres sont dans « Terres agricoles »");
  assert.ok(carte.serresPct! > 5 && carte.composition.find((x) => x.label === "Terres agricoles")!.pct >= 50);
});

test("la carte et la synthèse disent la mesure telle qu'elle est, sans accès, distance ni « eau comprise »", () => {
  const s = snapDe("13004");
  const f = factOf(s, "land.natural_share_sector")!;
  assert.match(f.limits!, /ne dit ni l'accès à un espace naturel, ni la distance réelle pour s'y rendre, ni sa qualité écologique/);
  const p = projectForSynthesis(s, "gwl20") as any;
  assert.equal(p.espaces_naturels_autour_des_zones_baties.part_moyenne_des_terres_pct, 49.5); // 49,563 tronqué au dixième
  assert.deepEqual(p.espaces_naturels_autour_des_zones_baties.fourchette_selon_les_zones_baties_pct, [40.8, 61.7]);
  assert.doesNotMatch(JSON.stringify(p), /eau comprise|dans le secteur/);
  const src = readFileSync("src/components/report/QuartierClimatData.tsx", "utf8");
  assert.doesNotMatch(src, /Sur son secteur \(la commune et, s'il y en a, des communes voisines retenues\)/);
  assert.match(src, /Autour des zones bâties de la commune, les milieux naturels représentent en moyenne/);
  assert.equal(phraseSecteur(49.563, "Arles"), "Autour des zones bâties d'Arles, les milieux naturels représentent en moyenne 49,5 % des terres situées dans un rayon de 15 km.");
});

test("FUT-183 : une part OSO se cite au dixième ; « 45 % » pour 44,9 est refusé, aux trois frontières", () => {
  for (const [nat, ecrit, refus] of [[44.9, "45 %", true], [44.9, "44,9 %", false], [49.94, "50 %", true], [19.96, "20 %", true], [45, "45 %", false]] as const) {
    const snap = buildTerritoireSnapshot({ ...chatelaillonInputs(), entry: { ...chatelaillonInputs().entry!, nature: natureTest({ urb: 30, agri: 70 - nat, foret: nat }) } }, T0);
    const p = projectForSynthesis(snap, "gwl20") as Record<string, unknown>;
    const v = checkArrondisOso(`Les espaces naturels couvrent ${ecrit} de ses terres.`, p);
    assert.equal(v.length > 0, refus, `${nat} / ${ecrit}`);
    if (refus) assert.equal(v[0]!.rule, "nombre:arrondi-oso");
  }
  assert.equal(landCategory(44.9, { artificialise: 30, agricole: 25.1 }), "mixed");
  // La troncature au dixième ne franchit jamais un seuil multiple de 0,1 (19,96 reste sous 20 à l'écran).
  assert.equal(pctOso(19.96), "19,9");
  assert.equal(pctOso(70.04), "70");
  assert.equal(pctOso(44.999), "44,9");
  assert.equal(LAND_LABEL.mixed, "Occupation mixte");
  // Le contrôle est branché dans le contrôle complet de la synthèse.
  const snap = buildTerritoireSnapshot({ ...chatelaillonInputs(), entry: { ...chatelaillonInputs().entry!, nature: natureTest({ urb: 30, agri: 25.1, foret: 44.9 }) } }, T0);
  assert.ok(checkSynthesis("x\n## a\n45 % d'espaces naturels.\n## b\nx\n## c\nx", projectForSynthesis(snap, "gwl20")).some((v) => v.rule === "nombre:arrondi-oso"));
});

// ── 3. Projet ───────────────────────────────────────────────────────────────────────────────────────────

const projet = (w: number): UserProject => ({
  posture: "recherche", intent: null, rawText: null, updatedAt: "1970-01-01T00:00:00.000Z",
  parsed: { reformulation: "x", hardConstraints: {}, preferences: [{ key: "nature", weight: w }] } as unknown as UserProject["parsed"],
});
const faits = (insee: string) => mapCommuneToModuleFacts(PAR.get(insee)! as IndexCommune, {}, { hasAddress: false, tailleVille: null, tailleVilleSource: null });
const regle = (rules: typeof MISMATCH_RULES, id: string) => rules.find((r) => r.id === id)!;

test("Projet : sans classement établi (Ouessant, Granville, Bustanico), la règle rend « incertain », jamais un ancien verdict", () => {
  for (const k of ["29155", "50218", "2B045"]) {
    const f = faits(k);
    assert.equal(f.rankBands?.nature, undefined, k);
    assert.equal(regle(MISMATCH_RULES, "territoire.mismatch-nature").evaluate(f, projet(3), undefined as never).outcome, "uncertain", k);
    assert.equal(regle(ALIGNMENT_RULES, "territoire.alignment-nature").evaluate(f, projet(3), undefined as never).outcome, "uncertain", k);
  }
});

test("Projet : la preuve garde le grain « commune » (ancre du calcul) et nomme les zones bâties ; 50-75 % ajoute sa limite", () => {
  const f = faits("13096"); // Saintes-Maries-de-la-Mer, rang neutre ; on force une bande favorable pour lire la carte
  const forcee = { ...f, rankBands: { ...f.rankBands, nature: { low: 0.9, high: 0.92 } } };
  const r = regle(ALIGNMENT_RULES, "territoire.alignment-nature").evaluate(forcee, projet(3), undefined as never);
  const carte = r.facts[0] as any;
  assert.equal(carte.evidence[0].grain, "commune");
  assert.equal(carte.basis.distributionVersion, "mismatch-dist-2026-11-10-nature");
  assert.match(carte.statement, /les espaces naturels autour des zones bâties/);
  assert.match(carte.limitation, /mer occupe environ 31,8 % du rayon de 15 km/);
  for (const t of [JSON.stringify(MISMATCH_LABELS.nature), JSON.stringify(ALIGNMENT_LABELS.nature)]) {
    assert.doesNotMatch(t, /eau comprise|du secteur|dans le secteur/);
  }
});

test("Projet : le boisement de 70 % se lit sur les terres, au dixième", () => {
  const src = readFileSync("src/lib/decision/materiality-rules.ts", "utf8");
  assert.match(src, /la forêt couvre \$\{pctOso\(boise!\)\} % des terres de la commune/);
  assert.doesNotMatch(src, /du territoire communal/);
  assert.equal(faits("30332").boisementPct! < 70, true); // Trèves, 69,957 %
});

// ── 4. Où vivre et /qna (reprend les intentions de fut178-portee-nature.test.ts, retiré avec la méthode qu'il gardait) ──


const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
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
  return next(spec, ctx);
}`;
let V: any;
before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  V = await import("./comparateur-vie.ts");
});

test("/qna : une commune classée reçoit le niveau et sa règle de lecture ; sans classement, rien (ni ancien score)", () => {
  const arles = V.buildTerritorySignals(PAR.get("13004")!) as Record<string, any>;
  const s = arles.espaces_naturels_autour_du_bati;
  assert.ok(s, "Arles est classée");
  assert.match(s.perimetre, /zones bâties de la commune/);
  assert.match(s.composition, /ni l'eau ni les cultures/);
  assert.match(s.ne_dit_pas, /ni un accès, ni une distance à pied, ni les abords d'une adresse/);
  assert.equal("espaces_naturels_secteur" in arles, false);
  for (const k of ["29155", "17300", "2B045"]) {
    assert.equal((V.buildTerritorySignals(PAR.get(k)!) as Record<string, unknown>).espaces_naturels_autour_du_bati, undefined, k);
    assert.equal(V.subScore("nature", PAR.get(k)!), null, k);
  }
});

test("Où vivre : la ligne, les paliers, les raisons et le point fort disent la mesure, sans eau, sans « secteur »", () => {
  const dim = V.DIMENSIONS.find((d: any) => d.id === "nature");
  assert.deepEqual(dim.paliers, ["Beaucoup d'espaces naturels autour des zones bâties", "Espaces naturels présents autour des zones bâties", "Peu d'espaces naturels autour des zones bâties"]);
  assert.match(dim.aide, /15 km au plus des zones bâties/);
  assert.match(dim.aide, /ni un accès, ni une distance, ni une qualité écologique/);
  const bony = PAR.get("02100")!;
  assert.equal(V.raisonNeg("nature", bony), "peu d'espaces naturels autour des zones bâties");
  const src = readFileSync("src/lib/comparateur-vie.ts", "utf8");
  assert.match(src, /la plus riche\{n\} en espaces naturels autour de ses zones bâties/);
  for (const t of [JSON.stringify(dim), V.raisonNeg("nature", bony)]) assert.doesNotMatch(t, /ou d'eau|eau comprise|dans le secteur/);
});

test("Projet : une part faible ne se lit jamais comme une urbanisation, et les cultures restent une explication possible", () => {
  assert.match(MISMATCH_LABELS.nature.limitation!, /ne prouve pas une forte urbanisation : elle peut notamment s'expliquer par les terres agricoles/);
});

// ── 5. Recette des cas nommés par la contre-revue (statut, cause, phrase rendue) ───────────────────────────────

const RECETTE: [string, string, string, string | null, RegExp | null][] = [
  // insee, nom, statut, cause, phrase de limite attendue
  ["29155", "Ouessant", "non_classe", "mer", /^Classement national non établi : la mer occupe environ 97,5 %/],
  ["56085", "Hœdic", "non_classe", "mer", /^Classement national non établi : la mer occupe environ 99,0 %/],
  ["85113", "L'Île-d'Yeu", "non_classe", "mer", /^Classement national non établi : la mer occupe/],
  ["17019", "Ars-en-Ré", "non_classe", "mer", /^Classement national non établi : la mer occupe/],
  ["08106", "Charnois", "non_classe", "etranger", /se trouve à l'étranger, hors du périmètre de cette mesure/],
  ["08122", "Chooz", "non_classe", "etranger", /se trouve à l'étranger/],
  ["25386", "Montancy", "non_classe", "etranger", /se trouve à l'étranger/],
  ["50218", "Granville", "non_classe", "mer", /^Classement national non établi : la mer occupe environ 55,6 %/],
  ["17300", "La Rochelle", "non_classe", "mer", /^Classement national non établi/],
  ["35288", "Saint-Malo", "non_classe", "mer", /^Classement national non établi/],
  ["13096", "Saintes-Maries-de-la-Mer", "classe_limite", "mer", /^Autour des zones bâties de la commune, la mer occupe environ 31,8 %/],
  ["13004", "Arles", "classe", "mer", null],
  ["17034", "Barzan", "classe", "mer", null],
  ["85104", "Grues", "classe", "mer", null],
  ["76353", "Héberville", "classe", "mer", null],
];

test("recette : chaque cas nommé a son statut, sa cause GISCO et la phrase que le lecteur lit", () => {
  for (const [k, nom, statut, cause, phrase] of RECETTE) {
    const c = PAR.get(k)!;
    assert.equal(c.nom, nom);
    const s = c.nature!.secteur;
    assert.equal(s.statut, statut, nom);
    if (s.statut !== "non_calculable") assert.equal(s.cause, cause, nom);
    const f = factOf(snapDe(k), "land.natural_share_sector")!;
    if (phrase) assert.match(f.limits!, phrase, nom);
    else assert.doesNotMatch(f.limits!, /Classement national non établi|rayon de 15 km/, nom);
    assert.equal(c.nature!.score === null, statut === "non_classe", nom);
  }
});

test("recette : de part et d'autre des paliers de 50 et 75 %, le statut suit la couverture, sans arrondi", () => {
  const voisins = INDEX.communes.filter((c) => !PLM.test(c.insee) && c.nature!.secteur.statut !== "non_calculable")
    .map((c) => ({ c, v: (c.nature!.secteur as { couvert_fr_pct: number }).couvert_fr_pct }));
  const juste = (seuil: number, dessous: boolean) => voisins.filter(({ v }) => (dessous ? v < seuil && v > seuil - 0.5 : v >= seuil && v < seuil + 0.5));
  for (const { c } of juste(50, true)) assert.equal(c.nature!.score, null, c.nom);
  for (const { c } of juste(50, false)) assert.equal(c.nature!.secteur.statut, "classe_limite", c.nom);
  for (const { c } of juste(75, true)) assert.equal(c.nature!.secteur.statut, "classe_limite", c.nom);
  for (const { c } of juste(75, false)) assert.equal(c.nature!.secteur.statut, "classe", c.nom);
  assert.ok(juste(50, true).length > 10 && juste(75, false).length > 10);
});

test("recette : égalités de rang et trait distinctif suivent le score, sans exception", () => {
  // Le score est monotone en la valeur mesurée, et deux communes de même score ont la même bande (égalités de rang).
  const classees = INDEX.communes.filter((c) => c.nature?.score != null)
    .map((c) => ({ c, v: (c.nature!.secteur as { valeur: number }).valeur, s: c.nature!.score! }))
    .sort((a, b) => a.v - b.v);
  for (let i = 1; i < classees.length; i++) assert.ok(classees[i]!.s >= classees[i - 1]!.s, classees[i]!.c.insee);
  const bandeDe = new Map<number, string>();
  let egalites = 0;
  for (const { c, s } of classees) {
    const b = JSON.stringify(c.rankBands!.nature);
    if (bandeDe.has(s)) { egalites++; assert.equal(b, bandeDe.get(s), c.insee); } else bandeDe.set(s, b);
  }
  assert.ok(egalites > 30000);
  // Le trait nature ne naît qu'à 88 ou plus, et jamais hors classement.
  for (const c of INDEX.communes) {
    const trait = getCommuneDistinctive(c as never);
    if (trait === "compte parmi les communes les plus entourées d'espaces naturels") assert.ok((c.nature?.score ?? 0) >= 88, c.insee);
  }
});
