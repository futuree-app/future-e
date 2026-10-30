// FUT-157 · LES SOLS POLLUÉS AU TERRAIN D'UNE ADRESSE. Trois familles de preuves :
//   1. dix-sept adresses réelles (Metz, Lyon, Paris, Marseille), rejouées depuis les réponses brutes figées le
//      30/10/2026 (`__fixtures__/fut157/cas.json`, `scripts/fut157/capturer-cas.mjs`) : feature BAN, parcelle
//      rattachée par le vrai code du dossier, pages Géorisques des trois inventaires, fiches sans emprise ;
//   2. des géométries construites pour chaque situation limite (voisin, liseré, limite, panne, incohérence) ;
//   3. ce que le texte et l'écran disent, et ce qu'ils ne disent jamais.
import { test, before, describe } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import {
  CHEMIN, PAGES_MAX, lireCategorie, lireCategorieGeo, lotIncomplet, type CategorieGeoLue, type FicheSspGeo, type PageSsp,
} from "./sites-sols.ts";
import {
  MARGE_RECHERCHE_M, adresseDuLibelle, adressesPubliees, etatSitesSols, ficheDemontree, lireSitesSolsTerrain, planDeRecherche,
  publieeALAdresse, sitesSolsIndisponible, type EntreeSitesSols, type InventaireTerrain, type LectureSitesSols, type ReponsesSitesSols,
} from "./sites-sols-terrain.ts";
import { texteSitesSols, type TexteSitesSols } from "./sites-sols-texte.ts";
import { couvertureSitesSols, deriveLogementCoverage } from "./decision/logement-coverage.ts";
import { issueActualisation, pertesSitesSols, sourcesAbsentes, type VersionLogement } from "./logement-report-version.ts";
import type { LogementReport } from "./logement-report-types.ts";

// ── Les cas réels ─────────────────────────────────────────────────────────────────────────────

type Cas = {
  adresse: string; ban: string; insee: string; entree: EntreeSitesSols; rayonM: number;
  reponses: Record<InventaireTerrain, PageSsp[]>; sansEmprise: ReponsesSitesSols["sansEmprise"];
};
const CAS: Cas[] = JSON.parse(readFileSync(new URL("./__fixtures__/fut157/cas.json", import.meta.url), "utf8")).cas;
const CONSULTE = "2026-10-30T12:00:00.000Z";

function categories(r: Record<InventaireTerrain, (PageSsp | null)[]>): Record<InventaireTerrain, CategorieGeoLue> {
  return Object.fromEntries(Object.entries(r).map(([k, p]) => [k, lireCategorieGeo(p, p.every(Boolean) ? lotIncomplet(p, PAGES_MAX) : false)])) as Record<InventaireTerrain, CategorieGeoLue>;
}
function rejouer(c: Cas, change: Partial<{ reponses: Record<InventaireTerrain, (PageSsp | null)[]>; sansEmprise: ReponsesSitesSols["sansEmprise"]; entree: EntreeSitesSols }> = {}): LectureSitesSols {
  return lireSitesSolsTerrain(change.entree ?? c.entree, {
    categories: categories(change.reponses ?? c.reponses),
    sansEmprise: "sansEmprise" in change ? change.sansEmprise! : c.sansEmprise, consulteLe: CONSULTE,
  });
}
const cas = (debut: string) => {
  const c = CAS.find((x) => x.adresse.startsWith(debut));
  assert.ok(c, `cas absent de la capture : ${debut}`);
  return c;
};
const situations = (l: LectureSitesSols) => l.fiches.map((f) => `${f.inventaire}:${f.situation}`).sort();

/** L'attendu de chaque adresse, décidé AVANT de rejouer (cf. audit, §4) : l'état et les situations. */
const ATTENDU: [string, ReturnType<typeof etatSitesSols>, string[]][] = [
  // Sotrameuse : le point est sur la voie, hors de toute parcelle ; la parcelle rattachée par proximité (2 m) est
  // dans le SIS. Ni « dans le SIS » (rayon), ni « rien » (point) : à vérifier.
  ["96b Boulevard Solidarité", "a_verifier", ["instructions:parcelle_incertaine", "sis:parcelle_incertaine"]],
  ["94a Boulevard Solidarité", "a_verifier", ["instructions:parcelle_incertaine", "sis:parcelle_incertaine"]],
  // Le voisin : le SIS et l'instruction passent à moins de 42 m, la parcelle BT 214 ne les touche pas.
  ["98 Boulevard Solidarité", "aucun", []],
  // La voie seule : le polygone est à 2 m de son point, mais une voie n'est pas un terrain.
  ["Boulevard Solidarité", "terrain_non_situe", []],
  // Une servitude, et l'instruction du même dépôt publiée à la même adresse mais pointée à 958 m.
  ["13 Rue des Alliés", "concerne", ["instructions:adresse_publiee", "sup:point_dans"]],
  ["18 Avenue Tony Garnier", "concerne", ["instructions:point_dans", "sis:point_dans"]],
  // Dans un SIS (station-service TOTAL), et voisin d'un autre (CHIMICOLOR) qui ne touche sa parcelle que d'un liseré.
  ["14 Avenue Tony Garnier", "concerne", ["instructions:point_dans", "sis:point_dans"]],
  ["50 Rue Saint Jean de Dieu", "concerne", ["sup:point_dans"]],
  // Le point est dehors, la parcelle attribuée est dedans (99,9 %, puis 7,2 %).
  ["5 Rue du 3 Septembre 1944", "concerne", ["instructions:parcelle_recoupe", "sis:parcelle_recoupe"]],
  ["98 Rue Saint Pierre de Vaise", "concerne", ["instructions:parcelle_recoupe", "sis:parcelle_recoupe"]],
  ["38 Rue Sainte Anne de Baraban", "a_verifier", ["instructions:parcelle_incertaine", "sis:parcelle_incertaine"]],
  // RHODIACETA : un périmètre publié dont les anneaux se croisent.
  ["30 Rue du Chapeau Rouge", "a_verifier", ["instructions:geometrie_illisible", "sis:geometrie_illisible"]],
  // GIVAUDAN : une instruction pointée dans la parcelle ; une autre publiée au 56 et pointée ailleurs.
  ["62 Rue Paul Cazeneuve", "a_verifier", ["instructions:localisation_ponctuelle"]],
  ["56 Rue Paul Cazeneuve", "a_verifier", ["instructions:adresse_publiee"]],
  ["64 Rue de Grenelle", "concerne", ["instructions:point_dans", "sis:point_dans"]],
  ["10 Rue de Rivoli", "aucun", []],
  // TLM : un trou d'aire nulle rendait tout le périmètre illisible.
  ["9 Avenue general maurice chevance-bertin", "concerne", ["instructions:point_dans", "sis:point_dans"]],
];

describe("FUT-157 · dix-sept adresses réelles, rejouées sans réseau", () => {
  test("la capture est complète : chaque inventaire et la liste communale ont été lus en entier", () => {
    assert.equal(CAS.length, ATTENDU.length);
    for (const c of CAS) {
      const l = rejouer(c);
      assert.deepEqual(l.inventaires, { sis: "complet", sup: "complet", instructions: "complet" }, c.adresse);
      assert.equal(l.sansEmprise?.etat, "complet", c.adresse);
      assert.equal(l.rayonM, c.rayonM, `${c.adresse} : le rayon rejoué est celui demandé à l'API`);
    }
  });

  for (const [debut, etat, attendues] of ATTENDU) {
    test(`${debut} → ${etat}${attendues.length ? ` (${attendues.join(", ")})` : ""}`, () => {
      const l = rejouer(cas(debut));
      assert.equal(etatSitesSols(l), etat);
      assert.deepEqual(situations(l), attendues);
    });
  }

  test("Sotrameuse : la raison est dite (repli à 2 m), et rien n'est démontré", () => {
    const l = rejouer(cas("96b Boulevard Solidarité"));
    assert.deepEqual(l.parcelle, { statut: "incertaine", code: "57463-000-BV-0070", raison: "repli", distanceM: 2.1 });
    assert.ok(l.fiches.every((f) => !ficheDemontree(f, l)));
    const t = texteSitesSols(l)!;
    assert.match(t.titre, /à vérifier/);
    assert.match(t.sites[0].situation, /ne tombe dans aucune parcelle.*à 2 m.*rien ne garantit/);
    assert.doesNotMatch(t.titre, /est dans/);
  });

  test("le voisin d'un SIS n'en hérite pas : CHIMICOLOR n'est pas listé au 14 avenue Tony Garnier", () => {
    const l = rejouer(cas("14 Avenue Tony Garnier"));
    assert.ok(l.fiches.every((f) => f.nom !== "CHIMICOLOR"));
    assert.ok(l.fiches.some((f) => f.nom === "STATION SERVICE TOTAL FRANCE GERLAND"));
  });

  test("plusieurs inventaires pour un même site : une seule entrée, deux inscriptions, deux liens", () => {
    const t = texteSitesSols(rejouer(cas("64 Rue de Grenelle")))!;
    assert.equal(t.sites.length, 1);
    assert.deepEqual(t.sites[0].inscriptions.map((i) => i.inventaire), ["sis", "instructions"]);
    assert.ok(t.sites[0].inscriptions.every((i) => i.lien?.startsWith("https://fiches-risques.brgm.fr/")));
  });

  test("une parcelle traversée : la part est dite, le titre dit « en partie »", () => {
    const t = texteSitesSols(rejouer(cas("98 Rue Saint Pierre de Vaise")))!;
    assert.match(t.titre, /^La parcelle de cette adresse est en partie dans un secteur d'information sur les sols/);
    assert.match(t.sites[0].situation, /7 % de la parcelle BP 80/);
  });

  test("la recherche ne rend jamais une fiche ponctuelle : sans la liste communale, GIVAUDAN disparaît", () => {
    const c = cas("62 Rue Paul Cazeneuve");
    assert.equal(c.reponses.instructions[0].results, 0, "l'API n'a rien rendu autour du point");
    assert.deepEqual(situations(rejouer(c, { sansEmprise: null })), []);
    assert.equal(etatSitesSols(rejouer(c, { sansEmprise: null })), "incomplet", "et l'absence n'est pas dite");
  });
});

// ── Les situations construites ───────────────────────────────────────────────────────────────

const LAT0 = 48.85;
const LON0 = 2.35;
const M_LAT = 1 / 111_132;
const M_LON = 1 / (111_320 * Math.cos((LAT0 * Math.PI) / 180));
/** Un point à (x, y) mètres du repère. */
const pt = (x: number, y: number): [number, number] => [LON0 + x * M_LON, LAT0 + y * M_LAT];
/** Un rectangle [x0, x1] × [y0, y1] en mètres, en GeoJSON. */
const rect = (x0: number, y0: number, x1: number, y1: number) => ({
  type: "Polygon", coordinates: [[pt(x0, y0), pt(x1, y0), pt(x1, y1), pt(x0, y1), pt(x0, y0)]],
});
const ligne = (id: string, geom: unknown, extra: Record<string, unknown> = {}) => ({
  identifiant_ssp: id, nom: `Site ${id}`, adresse: null, nom_commune: "PARIS", fiche_risque: `https://fiches-risques.brgm.fr/georisques/infosols/classification/${id}`,
  date_maj: "2020-09-30", geom, ...extra,
});
const page = (data: unknown[], results = data.length): PageSsp => ({ results, total_pages: data.length ? 1 : 0, data });
const VIDE = { sis: [page([])], sup: [page([])], instructions: [page([])] };
const SANS_EMPRISE_VIDE: ReponsesSitesSols["sansEmprise"] = { etat: "complet", fiches: [] };

/** La parcelle de l'adresse : 20 × 20 m autour du point (0, 0) ; rattachée au point, seule. */
const PARCELLE = { geometry: rect(-10, -10, 10, 10), code: "75056-000-AB-0012", rattachement: "point" as const };
const ENTREE: EntreeSitesSols = { point: pt(0, 0), geocodage: "housenumber", parcelle: PARCELLE, adresse: { numero: "12", voie: "RUE DU TEST" } };

function lire(reponses: Partial<Record<InventaireTerrain, (PageSsp | null)[]>>, e: EntreeSitesSols = ENTREE, sansEmprise: ReponsesSitesSols["sansEmprise"] = SANS_EMPRISE_VIDE) {
  return lireSitesSolsTerrain(e, { categories: categories({ ...VIDE, ...reponses }), sansEmprise, consulteLe: CONSULTE });
}

describe("FUT-157 · le grain de la preuve", () => {
  test("le point dans un SIS, la parcelle entière dedans : démontré, au grain parcelle", () => {
    const l = lire({ sis: [page([ligne("A", rect(-50, -50, 50, 50))])] });
    assert.equal(etatSitesSols(l), "concerne");
    assert.equal(l.fiches[0].situation, "point_dans");
    assert.equal(l.fiches[0].part, 1);
    assert.match(texteSitesSols(l)!.titre, /^Cette adresse est dans un secteur d'information sur les sols/);
  });

  test("la parcelle traversée (30 %), le point dehors : démontré à la parcelle, « en partie »", () => {
    const l = lire({ sis: [page([ligne("A", rect(4, -50, 60, 50))])] });
    assert.equal(l.fiches[0].situation, "parcelle_recoupe");
    assert.equal(l.fiches[0].part, 0.3);
    assert.equal(etatSitesSols(l), "concerne");
    assert.match(texteSitesSols(l)!.titre, /est en partie dans/);
  });

  test("le terrain voisin : un SIS qui touche la limite sans recouvrement n'est pas retenu", () => {
    const l = lire({ sis: [page([ligne("A", rect(10, -10, 40, 10))])] });
    assert.deepEqual(l.fiches, []);
    assert.equal(etatSitesSols(l), "aucun");
  });

  test("un liseré de tracé (0,5 m², moins de 2 %) n'est pas retenu ; une bordure de 30 m² l'est, à vérifier", () => {
    assert.deepEqual(lire({ sis: [page([ligne("A", rect(9.975, -10, 40, 10))])] }).fiches, []);
    const bordure = lire({ sis: [page([ligne("A", rect(8.5, -10, 40, 10))])] }); // 1,5 × 20 = 30 m², 7,5 %
    assert.equal(bordure.fiches[0].situation, "parcelle_recoupe", "au-delà de 2 % : recoupe");
    // Une grande parcelle (100 × 100 m) bordée sur 30 m² : moins de 2 %, mais au moins 25 m².
    const grande = { ...ENTREE, parcelle: { ...PARCELLE, geometry: rect(-50, -50, 50, 50) } };
    const l = lire({ sis: [page([ligne("A", rect(49.7, -50, 80, 50))])] }, grande);
    assert.equal(l.fiches[0].situation, "parcelle_bordure");
    assert.equal(etatSitesSols(l), "a_verifier");
  });

  test("le point exactement sur la limite : à vérifier, jamais « dans »", () => {
    const sansParcelle = { ...ENTREE, parcelle: null };
    const l = lire({ sis: [page([ligne("A", rect(0, -50, 50, 50))])] }, sansParcelle);
    assert.equal(l.fiches[0].situation, "point_en_limite");
    assert.equal(etatSitesSols(l), "a_verifier");
  });

  test("une adresse géocodée à la voie : le point dans un SIS reste à vérifier, et la parcelle ne sert pas", () => {
    const l = lire({ sis: [page([ligne("A", rect(-50, -50, 50, 50))])] }, { ...ENTREE, geocodage: "street" });
    assert.equal(l.parcelle.statut, "ecartee");
    assert.equal(l.rayonM, MARGE_RECHERCHE_M);
    assert.equal(etatSitesSols(l), "a_verifier");
    assert.match(texteSitesSols(l)!.sites[0].situation, /connue qu'à la voie/);
    assert.equal(etatSitesSols(lire({}, { ...ENTREE, geocodage: "street" })), "terrain_non_situe");
    assert.equal(etatSitesSols(lire({}, { ...ENTREE, geocodage: null })), "terrain_non_situe", "précision inconnue");
  });

  test("le point sur la limite de deux parcelles, ou une parcelle trouvée par proximité : à vérifier", () => {
    const sis = [page([ligne("A", rect(4, -50, 60, 50))])];
    for (const parcelle of [{ ...PARCELLE, candidatsAuPoint: 2 }, { ...PARCELLE, rattachement: "repli" as const, distanceRepliM: 3.4 }]) {
      const l = lire({ sis }, { ...ENTREE, parcelle });
      assert.equal(l.parcelle.statut, "incertaine");
      assert.equal(l.fiches[0].situation, "parcelle_incertaine");
      assert.equal(etatSitesSols(l), "a_verifier");
    }
  });

  test("sans parcelle, ou avec une parcelle illisible : l'absence ne vaut que pour le point", () => {
    assert.equal(etatSitesSols(lire({}, { ...ENTREE, parcelle: null })), "terrain_non_situe");
    const tordue = { ...PARCELLE, geometry: { type: "Polygon", coordinates: [[pt(0, 0), pt(10, 10), pt(10, 0), pt(0, 10), pt(0, 0)]] } };
    const l = lire({}, { ...ENTREE, parcelle: tordue });
    assert.deepEqual(l.parcelle, { statut: "ecartee", raison: "non_mesurable" });
    assert.equal(etatSitesSols(l), "terrain_non_situe");
    assert.match(texteSitesSols(l)!.limites[0], /pas une absence vérifiée pour le terrain/);
  });

  test("le rayon demandé couvre le sommet le plus éloigné de la parcelle, plus la marge ; trop étendue, elle ne sert pas", () => {
    assert.equal(planDeRecherche(ENTREE).rayonM, Math.ceil(Math.hypot(10, 10) + MARGE_RECHERCHE_M));
    const immense = planDeRecherche({ ...ENTREE, parcelle: { ...PARCELLE, geometry: rect(-8000, -8000, 8000, 8000) } });
    assert.deepEqual(immense.usage, { statut: "ecartee", raison: "trop_etendue" });
    assert.equal(immense.rayonM, MARGE_RECHERCHE_M);
  });

  test("un périmètre illisible ne compte que s'il touche le terrain", () => {
    const croise = { type: "Polygon", coordinates: [[pt(-5, -5), pt(5, 5), pt(5, -5), pt(-5, 5), pt(-5, -5)]] };
    const loin = { type: "Polygon", coordinates: [[pt(200, 200), pt(210, 210), pt(210, 200), pt(200, 210), pt(200, 200)]] };
    assert.equal(lire({ sis: [page([ligne("A", croise)])] }).fiches[0].situation, "geometrie_illisible");
    assert.deepEqual(lire({ sis: [page([ligne("B", loin)])] }).fiches, []);
  });

  test("un anneau d'aire nulle (aller-retour sur un segment) n'empêche pas la mesure", () => {
    const g = { type: "MultiPolygon", coordinates: [[rect(-50, -50, 50, 50).coordinates[0], [pt(1, 1), pt(1, 1), pt(2, 3), pt(1, 1)]]] };
    const l = lire({ sis: [page([ligne("A", g)])] });
    assert.equal(l.fiches[0].situation, "point_dans");
    assert.equal(etatSitesSols(l), "concerne");
  });

  test("une fiche localisée par un point : dans la parcelle, à vérifier ; ailleurs, rien ; publiée à l'adresse, à vérifier", () => {
    const f = (id: string, geom: unknown, adresse: string | null): FicheSspGeo & { inventaire: InventaireTerrain } => ({
      inventaire: "instructions", id, nom: `Site ${id}`, adresse, commune: "PARIS", statut: "En cours", fiche: null, miseAJour: null,
      geometrie: geom as FicheSspGeo["geometrie"],
    });
    const dans = lire({}, ENTREE, { etat: "complet", fiches: [f("P1", { type: "Point", coordinates: pt(3, 3) }, null)] });
    assert.deepEqual(situations(dans), ["instructions:localisation_ponctuelle"]);
    const ailleurs = lire({}, ENTREE, { etat: "complet", fiches: [f("P2", { type: "Point", coordinates: pt(30, 0) }, "40 RUE DU TEST")] });
    assert.deepEqual(situations(ailleurs), []);
    assert.equal(etatSitesSols(ailleurs), "aucun");
    assert.match(texteSitesSols(ailleurs)!.limites.join(" "), /Une fiche de la commune n'a pas d'emprise publiée.*Aucune n'est publiée à cette adresse/);
    const publiee = lire({}, ENTREE, { etat: "complet", fiches: [f("P3", null, "10-14 RUE DU TEST")] });
    assert.deepEqual(situations(publiee), ["instructions:adresse_publiee"]);
    assert.equal(publiee.fiches[0].adressePubliee?.localisation, "aucune");
    assert.equal(etatSitesSols(publiee), "a_verifier");
    // Une voie sans numéro ne se rapproche d'aucune adresse.
    assert.deepEqual(situations(lire({}, { ...ENTREE, geocodage: "street" }, { etat: "complet", fiches: [f("P3", null, "12 RUE DU TEST")] })), []);
  });
});

describe("FUT-157 · une panne n'est jamais une absence", () => {
  const sis = [page([ligne("A", rect(-50, -50, 50, 50))])];

  test("une seule source en panne : le résultat attesté reste, la couverture incomplète est dite", () => {
    const l = lire({ sis, sup: [null], instructions: [null] });
    assert.equal(etatSitesSols(l), "concerne");
    assert.deepEqual(l.inventaires, { sis: "complet", sup: "indisponible", instructions: "indisponible" });
    const t = texteSitesSols(l)!;
    assert.match(t.limites[0], /^Non lus en entier : servitudes liées à une pollution des sols et sites pollués suivis par l'administration\./);
    assert.deepEqual(absentesSitesSols({ ...BASE, sitesSols: l }), ["sites_sols_sup", "sites_sols_instructions"]);
  });

  test("une source en panne et rien trouvé ailleurs : incomplet, jamais « aucun »", () => {
    const l = lire({ sup: [null] });
    assert.equal(etatSitesSols(l), "incomplet");
    assert.doesNotMatch(texteSitesSols(l)!.titre, /^Aucun/);
    assert.equal(couvertureSitesSols(l).coverage, "unavailable");
  });

  test("les trois sources en panne : indisponible ; la collecte qui lève aussi", () => {
    for (const l of [lire({ sis: [null], sup: [null], instructions: [null] }), sitesSolsIndisponible(ENTREE, CONSULTE)]) {
      assert.equal(l.statut, "indisponible");
      assert.equal(etatSitesSols(l), "indisponible");
      assert.match(texteSitesSols(l)!.titre, /n'ont pas répondu.*rien ne peut être conclu/);
      assert.deepEqual(absentesSitesSols({ ...BASE, sitesSols: l }), ["sites_sols"]);
    }
  });

  test("la liste communale des fiches sans emprise manque : incomplet", () => {
    assert.equal(etatSitesSols(lire({}, ENTREE, null)), "incomplet");
    assert.equal(etatSitesSols(lire({}, ENTREE, { etat: "partiel", fiches: [] })), "incomplet");
  });

  test("aucun résultat après consultation complète, à la parcelle attribuée : l'absence est dite, avec sa limite", () => {
    const l = lire({});
    assert.equal(etatSitesSols(l), "aucun");
    assert.equal(couvertureSitesSols(l).coverage, "none");
    const t = texteSitesSols(l)!;
    assert.match(t.titre, /^Aucun secteur d'information sur les sols, aucune servitude/);
    assert.match(t.limites[0], /ce n'est pas la preuve d'un sol sans pollution/);
  });

  test("une source qui annonce des résultats sans les rendre, ou une ligne sans identifiant : partiel", () => {
    assert.equal(lire({ sis: [page([], 3)] }).inventaires.sis, "partiel");
    assert.equal(lire({ sis: [page([{ nom: "sans identifiant" }])] }).inventaires.sis, "partiel");
    assert.equal(etatSitesSols(lire({ sis: [page([], 3)] })), "incomplet");
  });

  test("une page tronquée (moins de lignes que le total annoncé) : partiel, même si une fiche est lue", () => {
    const p = page([ligne("A", rect(-50, -50, 50, 50))], 2);
    const l = lire({ sis: [p] });
    assert.equal(l.inventaires.sis, "partiel");
    assert.equal(etatSitesSols(l), "concerne", "la fiche lue reste attestée");
  });

  test("un même identifiant sous deux géométries différentes : la fiche n'est pas gardée, la catégorie est partielle", () => {
    const c = lireCategorieGeo([page([ligne("A", rect(-50, -50, 50, 50)), ligne("A", rect(100, 100, 150, 150))])]);
    assert.equal(c.etat, "partiel");
    assert.equal(c.etat !== "indisponible" && c.fiches.length, 0);
    // La même fiche répétée sous la ville et l'arrondissement (même géométrie) n'est gardée qu'une fois.
    const r = lireCategorieGeo([page([ligne("A", rect(0, 0, 1, 1), { nom_commune: "PARIS" }), ligne("A", rect(0, 0, 1, 1), { nom_commune: "PARIS 7E" })])]);
    assert.equal(r.etat, "disponible");
    assert.equal(r.etat !== "indisponible" && r.fiches.length, 1);
  });

  test("une réponse de forme inattendue (pas de total, pas de tableau) : indisponible", () => {
    assert.equal(lire({ sis: [{ message: "Erreur technique interne" } as PageSsp] }).inventaires.sis, "indisponible");
    assert.equal(lire({ sis: [{ results: 1, data: "x" } as PageSsp] }).inventaires.sis, "indisponible");
  });

  test("la lecture communale de FUT-152 est inchangée (même cœur, sans géométrie)", () => {
    const l = lireCategorie([page([ligne("A", rect(0, 0, 1, 1)), ligne("A", rect(5, 5, 6, 6))])]);
    assert.equal(l.etat, "disponible", "la page publique ne compare pas les géométries");
    assert.equal(l.etat !== "indisponible" && "geometrie" in l.fiches[0], false);
  });
});

describe("FUT-157 · les adresses publiées", () => {
  test("le libellé BAN : numéro sans indice, voie normalisée ; une voie seule n'a pas de numéro", () => {
    assert.deepEqual(adresseDuLibelle("56 Rue Paul Cazeneuve 69008 Lyon", "69008", "Lyon"), { numero: "56", voie: "RUE PAUL CAZENEUVE" });
    assert.deepEqual(adresseDuLibelle("96b Boulevard Solidarité 57070 Metz", "57070", "Metz"), { numero: "96", voie: "BOULEVARD SOLIDARITE" });
    assert.deepEqual(adresseDuLibelle("92 bis Rue de la Paix 75002 Paris", "75002", "Paris"), { numero: "92", voie: "RUE DE LA PAIX" });
    assert.equal(adresseDuLibelle("Boulevard Solidarité 57070 Metz", "57070", "Metz"), null);
  });

  test("les formes publiées : plage du même côté, liste, parenthèse, double adresse, « face au »", () => {
    const n = (a: string) => adressesPubliees(a).map((p) => [[...p.numeros], p.voie]);
    assert.deepEqual(n("14-20 RUE PIERRE BAIZET"), [[[14, 16, 18, 20], "RUE PIERRE BAIZET"]]);
    assert.deepEqual(n("16 À 24 RUE DES TUILERIES"), [[[16, 18, 20, 22, 24], "RUE DES TUILERIES"]]);
    assert.deepEqual(n("9 ET 11 RUE CLOTILDE AUBERTIN"), [[[9, 11], "RUE CLOTILDE AUBERTIN"]]);
    assert.deepEqual(n("156/160 ROUTE DE LA VALENTINE"), [[[156, 160], "ROUTE DE LA VALENTINE"]]);
    assert.deepEqual(n("55 RUE JEAN MERMOZ (ANGLE BATAILLE NEWPORT)"), [[[55], "RUE JEAN MERMOZ"]]);
    assert.deepEqual(n("FACE AU 114 AVENUE DES AYGALADES"), []);
    assert.ok(publieeALAdresse("2 RUE DE CHALON SUR SAONE", { numero: "2", voie: "RUE DE CHALON SUR SAONE" }));
    assert.ok(publieeALAdresse("1 R D'ARLES", adresseDuLibelle("1 Rue d'Arles 69007 Lyon", "69007", "Lyon")));
    assert.ok(!publieeALAdresse("14-20 RUE PIERRE BAIZET", { numero: "17", voie: "RUE PIERRE BAIZET" }), "pas le trottoir d'en face");
    assert.ok(!publieeALAdresse("62 RUE PAUL CAZENEUVE", { numero: "60", voie: "RUE PAUL CAZENEUVE" }));
  });
});

// ── Ce que le texte dit, et ce qu'il ne dit jamais ─────────────────────────────────────────

/** Le premier niveau : ce que le lecteur lit sans rien déplier. */
const premierNiveau = (t: TexteSitesSols) => [t.titre, ...t.sites.map((s) => s.situation), ...t.change, ...t.limites, ...t.verifier].join("\n");

describe("FUT-157 · le texte", () => {
  const lectures = [
    ...CAS.map((c) => rejouer(c)),
    lire({ sis: [null], sup: [null], instructions: [null] }), lire({ sup: [null] }), lire({}), lire({}, { ...ENTREE, parcelle: null }),
  ];

  test("jamais « pollué » ou « sain » dit du logement, jamais une exposition, jamais une obligation sans condition", () => {
    for (const l of lectures) {
      const p = premierNiveau(texteSitesSols(l)!);
      assert.doesNotMatch(p, /logement (est |serait )?(pollué|contaminé|sain)/i);
      assert.doesNotMatch(p, /sol (est )?sain|aucune pollution|sans danger|sans risque/i);
      assert.doesNotMatch(p, /expos|santé|toxique|cancer/i);
      assert.doesNotMatch(p, /obligatoire/i);
      assert.doesNotMatch(p, /état des risques/i, "depuis 2023, l'information SIS peut être un document distinct");
      assert.doesNotMatch(p, /\bCASIAS\b|IREP|friche/i);
    }
  });

  test("les obligations du SIS ne sont dites que pour un SIS ; celles d'une servitude que pour une servitude", () => {
    for (const l of lectures) {
      const t = texteSitesSols(l)!;
      const inv = new Set(l.fiches.map((f) => f.inventaire));
      const p = premierNiveau(t);
      if (!inv.has("sis")) assert.doesNotMatch(p, /étude de sols par un bureau|informer par écrit/, "SIS absent");
      if (!inv.has("sup")) assert.doesNotMatch(p, /arrêté de servitude|s'impose aux autorisations/, "SUP absente");
      if (inv.has("sis")) assert.match(p, /soumis à permis/, "l'étude de sols n'est exigée que pour un projet soumis à permis");
    }
    const sup = texteSitesSols(rejouer(cas("50 Rue Saint Jean de Dieu")))!;
    assert.match(sup.change.join(" "), /servitude d'utilité publique limite certains usages/);
    assert.match(sup.verifier.join(" "), /certificat d'urbanisme/);
  });

  test("sans preuve, ce qu'un inventaire changerait est dit au conditionnel, en une phrase", () => {
    const t = texteSitesSols(rejouer(cas("96b Boulevard Solidarité")))!;
    assert.deepEqual(t.change, [
      "Si c'est le cas, le vendeur ou le bailleur doit vous en informer par écrit, et un projet de construction ou de lotissement soumis à permis devra comporter l'attestation d'une étude de sols par un bureau d'études certifié.",
    ]);
    const prouve = texteSitesSols(rejouer(cas("18 Avenue Tony Garnier")))!;
    assert.match(prouve.change[0], /^En cas de vente ou de location, le vendeur ou le bailleur doit vous en informer par écrit/);
  });

  test("les fiches sans emprise bornent une absence : au premier niveau sans fiche listée, dans le dépliable sinon", () => {
    const aucun = texteSitesSols(rejouer(cas("98 Boulevard Solidarité")))!;
    assert.match(aucun.limites.join(" "), /9 fiches de la commune n'ont pas d'emprise publiée.*Aucune n'est publiée à cette adresse\./);
    const liste = texteSitesSols(rejouer(cas("96b Boulevard Solidarité")))!;
    assert.doesNotMatch(premierNiveau(liste), /emprise publiée/);
    assert.ok(liste.savoirPlus.some((x) => /^9 fiches de la commune n'ont pas d'emprise publiée/.test(x)));
  });

  test("une instruction seule n'entraîne pas d'obligation, et une instruction clôturée n'est pas un sol propre", () => {
    const l = lire({ instructions: [page([ligne("I", rect(-50, -50, 50, 50), { nom_etablissement: "Usine", statut: "Clôturée" })])] });
    const t = texteSitesSols(l)!;
    assert.match(t.titre, /^Cette adresse est dans le périmètre d'un site pollué suivi par l'administration\.$/);
    assert.match(t.change.join(" "), /n'entraîne pas, à elle seule, d'obligation/);
    assert.match(t.change.join(" "), /clôturée veut dire que l'administration a terminé son suivi, pas que le sol est sans pollution/);
    assert.match(t.sites[0].inscriptions[0].libelle, /\(instruction clôturée\)$/);
  });

  test("une distance n'est jamais un niveau de danger : seule la distance du repli cadastral est dite", () => {
    for (const l of lectures) {
      const p = premierNiveau(texteSitesSols(l)!);
      for (const m of p.matchAll(/à (\d+) m\b/g)) assert.match(p, /La plus proche, à \d+ m,/, `distance inattendue : ${m[0]}`);
    }
  });

  test("le grain est dit dans la marge, et la date de consultation", () => {
    assert.equal(texteSitesSols(rejouer(cas("64 Rue de Grenelle")))!.marge.grain, "parcelle");
    assert.equal(texteSitesSols(rejouer(cas("96b Boulevard Solidarité")))!.marge.grain, "parcelle à confirmer");
    assert.equal(texteSitesSols(rejouer(cas("Boulevard Solidarité")))!.marge.grain, "point de l'adresse");
    assert.equal(texteSitesSols(lire({}))!.marge.date, "30 octobre 2026");
  });

  test("un rapport antérieur à FUT-157 n'affiche rien", () => {
    assert.equal(texteSitesSols(undefined), null);
  });
});

// ── La couverture, les versions, le module ──────────────────────────────────────────────────

const BASE: LogementReport = { address: { id: "x", label: "12 Rue du Test 75001 Paris", city: "Paris", citycode: "75056", postcode: "75001", latitude: LAT0, longitude: LON0 } };
/** Les sources absentes propres aux sols pollués (la base de test n'a pas les autres sources). */
const absentesSitesSols = (r: LogementReport) => sourcesAbsentes(r).filter((x) => x.startsWith("sites_sols"));
const version = (r: LogementReport): VersionLogement => ({
  numero: 1, collecteeLe: CONSULTE, sourcesAbsentes: sourcesAbsentes(r), synthese: null, syntheseHash: null, report: r, reportHash: "h1", syntheseDpe: null,
});

describe("FUT-157 · couverture et versions", () => {
  const ENTREES_COUV = { georisquesAddress: null, georisquesParcel: null, cavites: [], heritage: { items: [], sourceStatus: "ok" as const }, sinistralite: null };

  test("la couverture du moteur de décision ne change pas : sans lecture, aucun champ n'apparaît", () => {
    const sans = deriveLogementCoverage(ENTREES_COUV);
    assert.equal("sitesSols" in sans, false);
    const avec = deriveLogementCoverage({ ...ENTREES_COUV, sitesSols: rejouer(cas("64 Rue de Grenelle")) });
    assert.deepEqual(avec.sitesSols, { coverage: "present", etat: "concerne" });
    const { sitesSols: _, ...reste } = avec;
    assert.deepEqual(reste, sans);
  });

  test("à vérifier compte comme un signal ; terrain non situé comme une inconnue", () => {
    assert.deepEqual(couvertureSitesSols(rejouer(cas("96b Boulevard"))), { coverage: "present", etat: "a_verifier" });
    assert.deepEqual(couvertureSitesSols(rejouer(cas("Boulevard Solidarité"))), { coverage: "unavailable", etat: "terrain_non_situe" });
  });

  test("un rapport antérieur ne s'invente aucune panne, et reçoit la lecture même si Géorisques tombe", () => {
    assert.deepEqual(absentesSitesSols(BASE), []);
    const panne = { ...BASE, sitesSols: sitesSolsIndisponible(ENTREE, CONSULTE) };
    assert.equal(issueActualisation(panne, "h2", version(BASE)), "nouvelle_version");
    assert.deepEqual(pertesSitesSols(BASE, panne), []);
  });

  test("une actualisation ne remplace pas un inventaire lu par une panne, ni une parcelle attribuée par une lecture qui n'en a plus", () => {
    const complet = { ...BASE, sitesSols: lire({}) };
    assert.equal(issueActualisation({ ...BASE, sitesSols: lire({ sup: [null] }) }, "h2", version(complet)), "refusee");
    assert.equal(issueActualisation({ ...BASE, sitesSols: sitesSolsIndisponible(ENTREE, CONSULTE) }, "h2", version(complet)), "refusee");
    assert.equal(issueActualisation({ ...BASE, sitesSols: lire({}, { ...ENTREE, parcelle: null }) }, "h2", version(complet)), "refusee");
    assert.deepEqual(pertesSitesSols(complet, { ...BASE, sitesSols: lire({}, ENTREE, null) }), ["sites_sols_sans_emprise"]);
    // Une fiche apparue a été lue : ce n'est pas une perte.
    assert.equal(issueActualisation({ ...BASE, sitesSols: lire({ sis: [page([ligne("A", rect(-50, -50, 50, 50))])] }) }, "h2", version(complet)), "nouvelle_version");
  });

  test("la synthèse rédigée n'est pas touchée : son empreinte ignore la lecture", async () => {
    const { buildFactHash } = await import("./logement-synthesis-cache.ts");
    const donnees = { address: { label: "64 Rue de Grenelle 75007 Paris" }, altitude: 35 };
    assert.equal(buildFactHash({ ...donnees, sitesSols: rejouer(cas("64 Rue de Grenelle")) } as never), buildFactHash(donnees));
  });
});

describe("FUT-157 · le câblage", () => {
  const route = readFileSync(new URL("../app/api/georisques-logement/route.ts", import.meta.url), "utf8");
  const serveur = readFileSync(new URL("./server/sites-sols.ts", import.meta.url), "utf8");

  test("la route lit le terrain en parallèle, derrière la seule parcelle, et le passe au rapport et à la couverture", () => {
    assert.match(route, /const sitesSolsP = parcelLueP\.then\(\(lu\) =>\s*lireSitesSolsAdresse\(/);
    assert.match(route, /bruitAerienP, fibreP, sitesSolsP\]\)/);
    assert.match(route, /\n {6}sitesSols,\n/);
    assert.match(route, /parcelleParRepli: parcel\?\.rattachement === "repli",\n {8}sitesSols,/);
    assert.match(route, /adresse: adresseDuLibelle\(address\.label, address\.postcode, address\.city\)/);
  });

  test("les appels passent par le transport commun de FUT-158, et la recherche vise les trois inventaires, jamais CASIAS", () => {
    assert.match(serveur, /headers: EN_TETES_GEORISQUES/);
    assert.match(serveur, /tracerEchecGeorisques\(url\.toString\(\)/);
    assert.match(serveur, /const INVENTAIRES_TERRAIN = \["sis", "sup", "instructions"\] as const;/);
    assert.deepEqual([CHEMIN.sis, CHEMIN.sup, CHEMIN.instructions], ["conclusions_sis", "conclusions_sup", "instructions"]);
    assert.doesNotMatch(serveur.slice(serveur.indexOf("Autour d'un point")), /CHEMIN\.casias/);
  });

  test("le dossier n'appelle toujours ni IREP ni CASIAS (le code, hors commentaires)", () => {
    const code = route.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    assert.doesNotMatch(code, /irep|casias/i);
  });
});

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

let rendreHtml: (l: LectureSitesSols | undefined) => string;
before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { createElement } = await import("react");
  const { SitesSolsSection } = await import("../components/report/logement/SitesSolsSection.tsx");
  rendreHtml = (l) => renderToStaticMarkup(createElement(SitesSolsSection, { lecture: l }));
});

describe("FUT-157 · l'écran", () => {
  test("un rapport antérieur n'affiche rien ; une lecture affiche une section titrée", () => {
    assert.equal(rendreHtml(undefined), "");
    const html = rendreHtml(rejouer(cas("64 Rue de Grenelle")));
    assert.match(html, /<section aria-labelledby="sites-sols"/);
    assert.match(html, /id="sites-sols"[^>]*><span>Sols pollués sur ce terrain<\/span>/);
  });

  test("chaque lien externe s'ouvre dans un nouvel onglet, sans référent, et porte un nom distinct", () => {
    const html = rendreHtml(rejouer(cas("64 Rue de Grenelle")));
    const liens = [...html.matchAll(/<a [^>]*>/g)].map((m) => m[0]);
    assert.equal(liens.length, 3, "deux fiches officielles et la carte");
    for (const a of liens) {
      assert.match(a, /target="_blank"/);
      assert.match(a, /rel="noopener noreferrer"/);
      assert.match(a, /href="https:\/\/(fiches-risques\.brgm\.fr|www\.georisques\.gouv\.fr)\//);
    }
    const noms = liens.map((a) => /aria-label="([^"]+)"/.exec(a)?.[1]).filter(Boolean);
    assert.equal(new Set(noms).size, noms.length);
    assert.match(html, /<details[^>]*><summary>En savoir plus<\/summary>/);
  });

  test("un nom publié hostile est échappé, et un lien hors des domaines attendus n'est pas rendu", () => {
    const l = lire({ sis: [page([ligne("X", rect(-50, -50, 50, 50), { nom: "<img src=x onerror=alert(1)>", fiche_risque: "javascript:alert(1)" })])] });
    const html = rendreHtml(l);
    assert.doesNotMatch(html, /<img/);
    assert.doesNotMatch(html, /javascript:/);
    assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  });
});
