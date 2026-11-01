// FUT-157 · LES TROIS DÉFAUTS DE LA CONTRE-REVUE INDÉPENDANTE (SHA refusé 971e423a, 31/10/2026).
// Chaque test a été écrit AVANT la correction et échoue au SHA refusé (cf. PR #118, reproduction avant/après) :
//   1. un point géocodé dans un SIS, mais une parcelle incertaine : le point seul ne dit pas le terrain ;
//   2. une intersection positive de moins de 0,05 m² : « à vérifier », jamais « aucun » par l'effet d'un seuil ;
//   3. une panne partielle de la lecture communale : les fiches lues sont gardées, la couverture est dite incomplète.
// Les fonctions de la lib sont lues par l'espace de noms : au SHA refusé, une fonction absente fait échouer le
// test qui l'appelle, pas le fichier entier.
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { lireCategorieGeo, type CategorieGeoLue, type PageSsp } from "./sites-sols.ts";
import * as T from "./sites-sols-terrain.ts";
import type { EntreeSitesSols, InventaireTerrain, LectureSitesSols, ReponsesSitesSols } from "./sites-sols-terrain.ts";
import { texteSitesSols } from "./sites-sols-texte.ts";

const { etatSitesSols, ficheDemontree, lireSitesSolsTerrain } = T;

// ── Le repère (le même que fut157-sites-sols-terrain.test.ts) ────────────────────────────────────

const LAT0 = 48.85;
const LON0 = 2.35;
const M_LAT = 1 / 111_132;
const M_LON = 1 / (111_320 * Math.cos((LAT0 * Math.PI) / 180));
const pt = (x: number, y: number): [number, number] => [LON0 + x * M_LON, LAT0 + y * M_LAT];
const rect = (x0: number, y0: number, x1: number, y1: number) => ({
  type: "Polygon", coordinates: [[pt(x0, y0), pt(x1, y0), pt(x1, y1), pt(x0, y1), pt(x0, y0)]],
});
const ligne = (id: string, geom: unknown, extra: Record<string, unknown> = {}) => ({
  identifiant_ssp: id, nom: `Site ${id}`, adresse: null, nom_commune: "PARIS",
  fiche_risque: `https://fiches-risques.brgm.fr/georisques/infosols/classification/${id}`, date_maj: "2020-09-30", geom, ...extra,
});
const page = (data: unknown[], results = data.length): PageSsp => ({ results, total_pages: data.length ? 1 : 0, data });
const VIDE = { sis: [page([])], sup: [page([])], instructions: [page([])] };
const SANS_EMPRISE_VIDE: ReponsesSitesSols["sansEmprise"] = { etat: "complet", fiches: [] };

function categories(r: Record<InventaireTerrain, (PageSsp | null)[]>): Record<InventaireTerrain, CategorieGeoLue> {
  return Object.fromEntries(Object.entries(r).map(([k, p]) => [k, lireCategorieGeo(p)])) as Record<InventaireTerrain, CategorieGeoLue>;
}
const PARCELLE = { geometry: rect(-10, -10, 10, 10), code: "75056-000-AB-0012", rattachement: "point" as const };
const ENTREE: EntreeSitesSols = { point: pt(0, 0), geocodage: "housenumber", parcelle: PARCELLE, adresse: { numero: "12", voie: "RUE DU TEST" } };
function lire(reponses: Partial<Record<InventaireTerrain, (PageSsp | null)[]>>, e: EntreeSitesSols = ENTREE, sansEmprise = SANS_EMPRISE_VIDE): LectureSitesSols {
  return lireSitesSolsTerrain(e, { categories: categories({ ...VIDE, ...reponses }), sansEmprise });
}
const sis = (geom: unknown) => ({ sis: [page([ligne("A", geom)])] });

// ── 1. Le point dans un SIS, la parcelle incertaine ─────────────────────────────────────────────

describe("FUT-157 · contre-revue 1 · le point géocodé dans un SIS ne dit pas le terrain quand la parcelle est incertaine", () => {
  // L'adresse est posée sur la voie (0, 0), hors de toute parcelle ; le cadastre la rattache par proximité à une
  // parcelle qui commence 3 m plus loin. Le SIS contient le point à 2,5 m de sa limite (au-delà de la tolérance).
  const VOISINE = { geometry: rect(3, -10, 23, 10), code: "75056-000-AB-0013", rattachement: "repli" as const, distanceRepliM: 3 };
  const surLaVoie: EntreeSitesSols = { ...ENTREE, parcelle: VOISINE };

  test("le point dans le SIS, la parcelle voisine HORS du SIS : à vérifier, jamais « concerné » (avant : concerné)", () => {
    const l = lire(sis(rect(-20, -50, 2.5, 50)), surLaVoie);
    assert.equal(l.parcelle.statut, "incertaine");
    assert.equal(l.fiches.length, 1);
    // Le fait géographique vérifié est conservé : le point est bien dans le périmètre.
    assert.equal(l.fiches[0].situation, "point_dans");
    assert.equal(l.fiches[0].part, null, "la parcelle voisine n'est pas touchée : aucune part n'est dite");
    assert.equal(ficheDemontree(l.fiches[0], l), false);
    assert.equal(etatSitesSols(l), "a_verifier");
    const t = texteSitesSols(l)!;
    assert.doesNotMatch(t.titre, /^(Cette adresse|La parcelle de cette adresse) est/, "aucune affirmation sur le terrain");
    assert.equal(t.titre, "Le point de cette adresse est dans un secteur d'information sur les sols, mais pas forcément le terrain du logement : c'est à vérifier.");
    assert.match(t.sites[0].situation, /^Le point de l'adresse est dans ce périmètre/);
    assert.match(t.sites[0].situation, /ne tombe dans aucune parcelle/);
    assert.match(t.sites[0].situation, /La plus proche, à 3 m, est hors de ce périmètre, mais rien ne garantit que ce soit celle du logement/);
    assert.equal(t.sites[0].demontre, false);
    assert.ok(t.verifier.some((v) => /regardez si la parcelle du logement/.test(v)), "la liste des parcelles de la fiche est le geste");
    assert.ok(t.change.every((c) => /^Si le terrain est bien/.test(c)), "les obligations sont dites au conditionnel");
  });

  test("le point dans le SIS, la parcelle voisine DANS le SIS : à vérifier aussi, la part de la voisine est dite (avant : concerné)", () => {
    const l = lire(sis(rect(-20, -50, 50, 50)), surLaVoie);
    assert.equal(l.fiches[0].situation, "point_dans");
    assert.equal(l.fiches[0].part, 1);
    assert.equal(etatSitesSols(l), "a_verifier");
    const t = texteSitesSols(l)!;
    assert.match(t.sites[0].situation, /La plus proche, à 3 m, est entièrement dans ce périmètre, mais rien ne garantit que ce soit celle du logement/);
  });

  test("le cas inverse : le point HORS du SIS, la parcelle voisine DANS le SIS : à vérifier, jamais « aucun »", () => {
    const l = lire(sis(rect(3, -50, 60, 50)), surLaVoie);
    assert.equal(l.fiches[0].situation, "parcelle_incertaine");
    assert.equal(etatSitesSols(l), "a_verifier");
  });

  test("le point hors du SIS, la parcelle voisine hors du SIS : rien n'est retenu, mais l'absence ne vaut pas pour le terrain", () => {
    const l = lire(sis(rect(-60, -50, -20, 50)), surLaVoie);
    assert.deepEqual(l.fiches, []);
    assert.equal(etatSitesSols(l), "terrain_non_situe");
  });

  test("le point dans le SIS, sur la limite entre deux parcelles : à vérifier (avant : concerné)", () => {
    const l = lire(sis(rect(-20, -50, 50, 50)), { ...ENTREE, parcelle: { ...PARCELLE, candidatsAuPoint: 2 } });
    assert.equal(l.fiches[0].situation, "point_dans");
    assert.equal(etatSitesSols(l), "a_verifier");
    assert.match(texteSitesSols(l)!.sites[0].situation, /^Le point de l'adresse est dans ce périmètre.*limite entre deux parcelles/);
  });

  test("le point dans le SIS sans aucune parcelle trouvée (cadastre muet) : le point seul ne dit pas le terrain (avant : concerné)", () => {
    const l = lire(sis(rect(-20, -50, 50, 50)), { ...ENTREE, parcelle: null });
    assert.equal(l.fiches[0].situation, "point_dans");
    assert.equal(etatSitesSols(l), "a_verifier");
    assert.match(texteSitesSols(l)!.sites[0].situation, /^Le point de l'adresse est dans ce périmètre, mais aucune parcelle cadastrale n'a été trouvée/);
  });

  test("non-régression : la parcelle attribuée (le point y tombe, seul) garde la preuve par le point", () => {
    const l = lire(sis(rect(-50, -50, 50, 50)));
    assert.equal(l.fiches[0].situation, "point_dans");
    assert.equal(etatSitesSols(l), "concerne");
    assert.match(texteSitesSols(l)!.titre, /^Cette adresse est dans un secteur d'information sur les sols/);
  });
});

// ── 2. Les intersections positives de moins de 0,05 m² ─────────────────────────────────────────

describe("FUT-157 · contre-revue 2 · une très petite intersection n'est jamais supprimée par un seuil", () => {
  test("0,02 m² (une bande d'1 mm sur 20 m) : à vérifier, jamais « aucun » (avant : supprimée, « aucun »)", () => {
    const l = lire(sis(rect(9.999, -10, 40, 10)));
    assert.equal(l.fiches.length, 1);
    assert.equal(l.fiches[0].situation, "parcelle_bordure");
    assert.ok((l.fiches[0].surfaceM2 ?? 0) > 0, "l'aire rendue n'est pas zéro : ce n'est pas un contact");
    assert.equal(etatSitesSols(l), "a_verifier");
    assert.match(texteSitesSols(l)!.sites[0].situation, /bande étroite le long de sa limite \(moins d'un mètre carré\)/);
  });

  test("0,001 m² (50 µm sur 20 m) : à vérifier (avant : supprimée)", () => {
    const l = lire(sis(rect(9.99995, -10, 40, 10)));
    assert.equal(l.fiches[0]?.situation, "parcelle_bordure");
    assert.equal(etatSitesSols(l), "a_verifier");
  });

  test("la même bande infime sur une parcelle rattachée par proximité : à vérifier (avant : supprimée)", () => {
    const repli = { ...ENTREE, parcelle: { ...PARCELLE, rattachement: "repli" as const, distanceRepliM: 2 } };
    const l = lire(sis(rect(9.999, -10, 40, 10)), repli);
    assert.equal(l.fiches[0]?.situation, "parcelle_incertaine");
    assert.equal(etatSitesSols(l), "a_verifier");
  });

  test("un contact géométrique sans surface (deux limites confondues) ne compte pas : aucun", () => {
    assert.deepEqual(lire(sis(rect(10, -10, 40, 10))).fiches, []);
    assert.equal(etatSitesSols(lire(sis(rect(10, -10, 40, 10)))), "aucun");
  });

  test("une superposition plus fine que la maille du calcul (10 nm) est un contact : indiscernable de zéro", () => {
    const l = lire(sis(rect(10 - 1e-8, -10, 40, 10)));
    assert.deepEqual(l.fiches, []);
  });

  test("une intersection certaine (au-delà de 2 m de profondeur) reste démontrée", () => {
    const l = lire(sis(rect(7.5, -10, 40, 10)));
    assert.equal(l.fiches[0].situation, "parcelle_recoupe");
    assert.equal(etatSitesSols(l), "concerne");
  });
});

// ── 3. La panne partielle de la lecture communale (server/sites-sols.ts, appels simulés) ──────────

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
  return next(spec, ctx);
}`;

type Reponse = "ok" | "panne" | "tronquee";
type Serveur = typeof import("./server/sites-sols.ts");
let S: Serveur;
const fetchOrigine = globalThis.fetch;
const consoleOrigine = console.error;
let scenario: { commune: Record<InventaireTerrain, Reponse>; lignes: Partial<Record<InventaireTerrain, unknown[]>> };

before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  S = await import("./server/sites-sols.ts");
  console.error = () => {}; // la trace `georisques_echec` des pannes simulées
  globalThis.fetch = (async (entree: string | URL) => {
    const url = new URL(String(entree));
    const chemin = url.pathname.split("/").pop();
    const inv = (({ conclusions_sis: "sis", conclusions_sup: "sup", instructions: "instructions" }) as Record<string, InventaireTerrain>)[chemin ?? ""];
    // La recherche autour du point ne rend rien : seule la lecture communale est en jeu.
    if (!url.searchParams.has("code_insee")) return Response.json(page([]));
    const r = scenario.commune[inv];
    if (r === "panne") return new Response("Service Unavailable", { status: 503 });
    const data = scenario.lignes[inv] ?? [];
    return Response.json(r === "tronquee" ? page(data, data.length + 5) : page(data));
  }) as typeof fetch;
});
after(() => { globalThis.fetch = fetchOrigine; console.error = consoleOrigine; });

/** Une instruction sans géométrie, publiée à l'adresse du logement : seule la lecture communale la voit. */
const PUBLIEE = ligne("I1", null, { adresse: "12 RUE DU TEST", statut_instruction: "En cours" });
/** Un SIS localisé par un simple point. */
const PONCTUEL = ligne("S1", { type: "Point", coordinates: pt(400, 400) });
const INSEE = "57463";

describe("FUT-157 · contre-revue 3 · une panne partielle de la lecture communale ne vide pas les fiches lues", () => {
  const combinaisons: [string, Record<InventaireTerrain, Reponse>, "complet" | "partiel" | "indisponible", number][] = [
    ["les trois répondent", { sis: "ok", sup: "ok", instructions: "ok" }, "complet", 2],
    ["les SIS en panne, les instructions répondent", { sis: "panne", sup: "ok", instructions: "ok" }, "partiel", 1],
    ["les instructions en panne, les SIS répondent", { sis: "ok", sup: "ok", instructions: "panne" }, "partiel", 1],
    ["les servitudes en panne seules", { sis: "ok", sup: "panne", instructions: "ok" }, "partiel", 2],
    ["les SIS tronqués, les autres répondent", { sis: "tronquee", sup: "ok", instructions: "ok" }, "partiel", 2],
    ["les SIS en panne, les servitudes tronquées, les instructions répondent", { sis: "panne", sup: "tronquee", instructions: "ok" }, "partiel", 1],
    ["deux en panne, une répond", { sis: "panne", sup: "panne", instructions: "ok" }, "partiel", 1],
    ["les trois en panne", { sis: "panne", sup: "panne", instructions: "panne" }, "indisponible", 0],
  ];
  for (const [nom, commune, etat, n] of combinaisons) {
    test(`${nom} : ${etat}, ${n} fiche(s) gardée(s)`, async () => {
      scenario = { commune, lignes: { sis: [PONCTUEL], instructions: [PUBLIEE] } };
      const r = await S.lireSansEmprise(INSEE);
      assert.equal(r.etat, etat);
      assert.equal(r.fiches.length, n);
    });
  }

  test("de bout en bout : SIS en panne, l'instruction publiée à l'adresse reste signalée, et la couverture est dite incomplète (avant : « incomplet » sans la fiche)", async () => {
    scenario = { commune: { sis: "panne", sup: "ok", instructions: "ok" }, lignes: { instructions: [PUBLIEE] } };
    const l = await S.lireSitesSolsAdresse(ENTREE, INSEE);
    assert.equal(l.sansEmprise?.etat, "partiel");
    assert.deepEqual(l.fiches.map((f) => `${f.inventaire}:${f.situation}`), ["instructions:adresse_publiee"]);
    assert.equal(etatSitesSols(l), "a_verifier");
    const t = texteSitesSols(l)!;
    assert.ok(t.limites.some((x) => /^Non lus en entier : la liste des sites de la commune repérés par un simple point, ou pas du tout\. D'autres périmètres peuvent exister\./.test(x)));
  });

  test("de bout en bout : SIS en panne et rien trouvé ailleurs : incomplet, jamais « aucun »", async () => {
    scenario = { commune: { sis: "panne", sup: "ok", instructions: "ok" }, lignes: {} };
    const l = await S.lireSitesSolsAdresse(ENTREE, INSEE);
    assert.equal(etatSitesSols(l), "incomplet");
    assert.doesNotMatch(texteSitesSols(l)!.titre, /^Aucun/);
    assert.ok(!texteSitesSols(l)!.limites.some((x) => /Aucun n'est déclaré à cette adresse|Il n'est pas déclaré à cette adresse/.test(x)), "une liste incomplète ne dit pas qu'aucun site n'est déclaré à l'adresse");
  });

  test("de bout en bout : tout répond, rien trouvé : aucun", async () => {
    scenario = { commune: { sis: "ok", sup: "ok", instructions: "ok" }, lignes: {} };
    assert.equal(etatSitesSols(await S.lireSitesSolsAdresse(ENTREE, INSEE)), "aucun");
  });
});
