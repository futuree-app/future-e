// FUT-152 · LES QUATRE RECHERCHES DE /agir/pollutions-invisibles (28/10/2026).
//
// A. Sites et sols : l'API officielle Géorisques `/api/v1/ssp`, la commune avec ses arrondissements et ses anciens
//    codes, dédoublonnée, catégorie par catégorie, chaque panne nommée.
// B. Eau potable : les vrais codes Sandre, le dernier prélèvement publié de CHAQUE réseau, sans fenêtre de date,
//    la conclusion de l'ARS, un « < » qui n'est pas un zéro.
// C. Qualité de l'air : une panne n'est plus présentée comme une absence d'indice, ni mémorisée.
// D. IREP : l'export officiel 2025 en index local, construit et contrôlé depuis l'export (fixtures tirées de
//    l'archive réelle), exclusions motivées, recherche sans troncature.
// E. Le composant : plus aucune insertion de HTML, et les formulations arbitrées.
//
// Aucun appel réseau : `fetch` est un double. Les fixtures citent des lignes réelles des exports (28/10/2026).
import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
async function premier(candidats, ctx, next) {
  for (const c of candidats.slice(0, -1)) { try { return await next(c, ctx); } catch {} }
  return next(candidats[candidats.length - 1], ctx);
}
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (spec === "next/server") return next("next/server.js", ctx);
  if (spec.startsWith("@/")) {
    const b = ${JSON.stringify(racine)} + "src/" + spec.slice(2);
    return premier([b + ".ts", b + ".tsx", b], ctx, next);
  }
  return next(spec, ctx);
}`;

type M = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
let SS: M, SSR: M, SIS: M, EAU: M, EAUR: M, ATMO: M, ATMOR: M, IREP: M;
before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  SS = await import("./sites-sols.ts");
  SSR = await import("./server/sites-sols.ts");
  SIS = await import("../app/api/proxy/sis/route.ts");
  EAU = await import("./eau-potable.ts");
  EAUR = await import("../app/api/proxy/eau/route.ts");
  ATMO = await import("./atmo.ts");
  ATMOR = await import("../app/api/atmo/[insee]/route.ts");
  IREP = await import("./data/irep-registre.ts");
});
const fetchReel = globalThis.fetch;
beforeEach(() => { globalThis.fetch = fetchReel; });

type Appel = { url: URL; headers: Record<string, string> };
/** Un double de `fetch` qui note chaque appel et répond par `repondre(url)`. */
function doubler(repondre: (u: URL) => Response | Promise<Response>): Appel[] {
  const appels: Appel[] = [];
  globalThis.fetch = (async (input: string | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    appels.push({ url, headers: Object.fromEntries(Object.entries((init?.headers ?? {}) as Record<string, string>).map(([k, v]) => [k.toLowerCase(), v])) });
    return repondre(url);
  }) as typeof fetch;
  return appels;
}
const json = async (res: Response) => ({ status: res.status, cache: res.headers.get("cache-control"), corps: await res.json() as M });

// ════════════════════════════════════════════════════════════════════════════════════════════════
// A · Sites et sols
// ════════════════════════════════════════════════════════════════════════════════════════════════

const ficheSis = (id: string, nom = `Site ${id}`) => ({
  identifiant_ssp: id, nom, adresse: "1 rue X", nom_commune: "METZ", statut_classification: "Secteurs d'information sur les sols (SIS)",
  fiche_risque: `https://fiches-risques.brgm.fr/georisques/infosols/classification/${id}`, date_maj: "2020-09-30",
});
const page = (data: M[], results = data.length, total_pages = 1) => ({ results, page: 1, total_pages, data });

test("A · périmètre : arrondissement élargi à sa ville, ville avec ses arrondissements, commune avec ses anciens codes", () => {
  const p4 = SS.perimetreDe("75104");
  assert.equal(p4.commune, "75056");
  assert.equal(p4.elargiALaVille, true);
  assert.equal(p4.codes.length, 21);
  assert.ok(p4.codes.includes("75104") && p4.codes.includes("75056"));
  // Cherbourg-en-Cotentin : CASIAS rattache encore des fiches à Octeville et Équeurdreville.
  const ch = SS.perimetreDe("50129");
  for (const c of ["50129", "50173", "50383"]) assert.ok(ch.codes.includes(c), c);
  assert.equal(ch.elargiALaVille, false);
  assert.deepEqual(SS.perimetreDe("01001").codes, ["01001"]);
  // Au plus 10 codes par appel (spécification v1).
  assert.deepEqual(SS.lots(p4.codes).map((l: string[]) => l.length), [10, 10, 1]);
});

test("A · une catégorie se dédoublonne par identifiant : le total annoncé n'est pas un nombre de fiches", () => {
  // Cherbourg, instructions, le 28/10/2026 : 19 lignes pour 16 fiches distinctes.
  const lu = SS.lireCategorie([page([ficheSis("A"), ficheSis("B"), ficheSis("A")], 3), page([ficheSis("B"), ficheSis("C")], 2)]);
  assert.equal(lu.etat, "disponible");
  assert.equal(lu.total, 3);
  assert.deepEqual(lu.fiches.map((f: M) => f.id), ["A", "B", "C"]);
  assert.equal(lu.fiches[0].statut, null, "la classification ne répète pas la catégorie");
});

test("A · une seule panne rend la catégorie indisponible : une liste à laquelle manque un lot n'est jamais servie", () => {
  for (const pages of [[page([ficheSis("A")]), null], [null], [], [{ error: "quota" }], [{ results: "3", data: [] }]]) {
    assert.deepEqual(SS.lireCategorie(pages), { etat: "indisponible" });
  }
  assert.deepEqual(SS.lireCategorie([page([])]), { etat: "absent_dans_source", total: 0, fiches: [] });
  assert.equal(SS.lireCategorie([page([ficheSis("A")])], true).etat, "partiel");
  assert.deepEqual(SS.lireCasias([page([], 546), page([], 27)]), { etat: "disponible", total: 573 });
  assert.deepEqual(SS.lireCasias([page([], 0)]), { etat: "absent_dans_source", total: 0 });
  assert.deepEqual(SS.lireCasias([page([], 5), null]), { etat: "indisponible" });
});

test("A · un lien venu de la source n'est rendu que vers un domaine public attendu, en https", () => {
  assert.equal(SS.lienFicheSur("https://fiches-risques.brgm.fr/georisques/casias/SSP3915474"), "https://fiches-risques.brgm.fr/georisques/casias/SSP3915474");
  for (const v of ["javascript:alert(1)", "http://fiches-risques.brgm.fr/x", "https://evil.example/x", "https://fiches-risques.brgm.fr.evil.example/x", "", null, 42]) {
    assert.equal(SS.lienFicheSur(v), null, String(v));
  }
});

test("A · la vraie route : officielle, sans `Accept: application/json` (coupé par Géorisques), un User-Agent nommé", async () => {
  const appels = doubler((u) => Response.json(u.pathname.endsWith("/casias") ? page([], 546) : page([ficheSis(`${u.pathname}-1`)])));
  const r = await json(await SIS.GET(new Request("http://localhost/api/proxy/sis?insee=57463")));
  assert.equal(r.status, 200);
  assert.match(r.cache!, /s-maxage=86400/);
  assert.equal(r.corps.casias.total, 546);
  for (const a of appels) {
    assert.equal(a.url.origin, "https://georisques.gouv.fr");
    assert.match(a.url.pathname, /^\/api\/v1\/ssp\/(conclusions_sis|instructions|conclusions_sup|casias)$/);
    assert.equal(a.headers.accept, undefined, "Géorisques coupe la connexion sur Accept: application/json");
    assert.match(a.headers["user-agent"] ?? "", /^futur-e\//);
  }
  assert.ok(!appels.some((a) => a.url.hostname === "data.georisques.gouv.fr"), "l'ancien hôte n'existe pas");
});

test("A · pannes : tout en panne → 502 ; une catégorie en panne → 200, la catégorie dite indisponible, rien en cache", async () => {
  doubler(() => { throw new TypeError("fetch failed"); });
  assert.equal((await json(await SIS.GET(new Request("http://localhost/api/proxy/sis?insee=57463")))).status, 502);

  doubler((u) => (u.pathname.endsWith("/instructions") ? new Response("panne", { status: 500 }) : Response.json(page([]))));
  const r = await json(await SIS.GET(new Request("http://localhost/api/proxy/sis?insee=57463")));
  assert.equal(r.status, 200);
  assert.equal(r.cache, "no-store");
  assert.deepEqual(r.corps.instructions, { etat: "indisponible" });
  assert.equal(r.corps.sis.etat, "absent_dans_source");

  for (const insee of ["ABC", "", "7510", "751041"]) {
    assert.equal((await SIS.GET(new Request(`http://localhost/api/proxy/sis?insee=${insee}`))).status, 400, insee);
  }
});

test("A · Paris interroge ses 21 codes en trois lots, dans chaque catégorie", async () => {
  const appels = doubler(() => Response.json(page([])));
  await SSR.getSitesSolsCommune("75056");
  const parCategorie = Object.groupBy(appels, (a) => a.url.pathname.split("/").pop()!);
  for (const [cat, liste] of Object.entries(parCategorie)) {
    assert.equal(liste!.length, 3, cat);
    assert.equal(liste!.flatMap((a) => a.url.searchParams.get("code_insee")!.split(",")).length, 21, cat);
  }
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// B · Eau potable
// ════════════════════════════════════════════════════════════════════════════════════════════════

test("B · les codes Sandre sont ceux que Hub'Eau libelle ainsi (relevé du 28/10/2026)", () => {
  // Avant FUT-152 : 1313 (DBO5) sous « Plomb », 1388 (cadmium) sous « Arsenic », 1350 (phosphore) sous
  // « Nitrites », 6860 (inexistant) sous « Pesticides totaux ».
  const attendus: Record<string, string> = { "1340": "Nitrates", "1339": "Nitrites", "1382": "Plomb", "1369": "Arsenic", "6276": "Total des pesticides analysés" };
  assert.deepEqual(Object.fromEntries(EAU.PARAMETRES_EAU.map((p: M) => [p.code, p.libelle])), attendus);
  for (const faux of ["1313", "1388", "1350", "6860"]) assert.ok(!EAU.PARAMETRES_EAU.some((p: M) => p.code === faux), faux);
});

test("B · « <0,01 » n'est pas zéro ; « <20 » face à une limite de 10 ne conclut rien", () => {
  const def = (code: string) => EAU.PARAMETRES_EAU.find((p: M) => p.code === code);
  const r = (alpha: string) => ({ date_prelevement: "2026-08-28T10:06:00Z", resultat_alphanumerique: alpha, resultat_numerique: 0, libelle_unite: "µg/L", reseaux: [{ nom: "SERM 1" }] });
  const sous = EAU.parametre(def("1382"), r("<2"));
  assert.equal(sous.valeur, "<2");
  assert.equal(sous.depasseLimite, false);
  assert.equal(EAU.parametre(def("1382"), r("<20")).depasseLimite, null);
  assert.equal(EAU.parametre(def("1382"), r("13")).depasseLimite, true); // Paris, 01/06/2026
  assert.equal(EAU.parametre(def("1340"), r("30")).depasseVigilance, true);
  assert.equal(EAU.parametre(def("1340"), r("22,80")).depasseVigilance, false);
});

const prelevement = (date: string, conclusion: string, refPc = "C") => ({
  date_prelevement: `${date}T10:00:00Z`, conclusion_conformite_prelevement: conclusion,
  conformite_limites_bact_prelevement: "C", conformite_limites_pc_prelevement: "C",
  conformite_references_bact_prelevement: "C", conformite_references_pc_prelevement: refPc,
});

/** Un Hub'Eau simulé : réseaux de la commune, dernier prélèvement par réseau, une valeur par paramètre. */
function hubeau(o: { udi: M[]; parReseau: Record<string, M | null>; panneReseau?: string; panne?: boolean }) {
  return doubler((u) => {
    if (o.panne) throw new TypeError("fetch failed");
    if (u.pathname.endsWith("/communes_udi")) return Response.json({ count: o.udi.length, data: o.udi });
    const reseau = u.searchParams.get("code_reseau");
    if (reseau && reseau === o.panneReseau) return new Response("panne", { status: 500 });
    if (reseau) { const p = o.parReseau[reseau]; return Response.json({ count: p ? 1 : 0, data: p ? [p] : [] }); }
    if (u.searchParams.get("code_parametre") === "1340") {
      return Response.json({ count: 1, data: [{ date_prelevement: "2026-02-05T11:50:00Z", resultat_alphanumerique: "18", libelle_unite: "mg/L", reseaux: [{ nom: "BDS" }] }] });
    }
    return Response.json({ count: 0, data: [] });
  });
}

test("B · un prélèvement ancien est montré avec sa date : aucune fenêtre ne le transforme en « aucun contrôle »", async () => {
  // L'Abergement-Clémenciat : dernier prélèvement le 05/02/2026, invisible pour l'ancienne fenêtre de six mois.
  const appels = hubeau({
    udi: [{ code_reseau: "001000556", nom_reseau: "BDS ST DIDIER/CHALARONNE" }],
    parReseau: { "001000556": prelevement("2026-02-05", "Eau d'alimentation conforme aux exigences de qualité en vigueur pour l'ensemble des paramètres mesurés.") },
  });
  const r = await json(await EAUR.GET(new Request("http://localhost/api/proxy/eau?insee=01001")));
  assert.equal(r.status, 200);
  assert.equal(r.corps.etat, "disponible");
  assert.equal(r.corps.reseaux[0].dernier.date, "2026-02-05");
  assert.match(r.corps.reseaux[0].dernier.conclusion, /^Eau d'alimentation conforme/);
  assert.equal(r.corps.parametres[0].valeur, "18");
  for (const a of appels) assert.equal(a.url.searchParams.get("date_min_prelevement"), null, "aucune fenêtre de date");
});

test("B · plusieurs réseaux : chacun son prélèvement, sa zone, sa conclusion (Metz, 28/08/2026)", async () => {
  hubeau({
    udi: [
      { code_reseau: "057000392", nom_reseau: "SERM 1", nom_quartier: "Centre" },
      { code_reseau: "057000393", nom_reseau: "SERM 2", nom_quartier: "-" },
      { code_reseau: "057000392", nom_reseau: "SERM 1" }, // doublon de la source
    ],
    parReseau: {
      "057000392": prelevement("2026-08-28", "Eau d'alimentation ne satisfaisant pas à la référence de qualité réglementaire pour le paramètre carbone organique total.", "N"),
      "057000393": null,
    },
  });
  const r = await json(await EAUR.GET(new Request("http://localhost/api/proxy/eau?insee=57463")));
  assert.equal(r.corps.reseaux.length, 2);
  const [serm1, serm2] = r.corps.reseaux;
  assert.equal(serm1.zone, "Centre");
  assert.equal(serm1.dernier.referencesPhysicoChimie, "non_conforme");
  assert.equal(serm1.dernier.limitesPhysicoChimie, "conforme");
  assert.equal(serm2.zone, null, "« - » n'est pas une zone");
  assert.equal(serm2.dernier, null, "aucun prélèvement publié pour ce réseau, sans rien emprunter à SERM 1");
});

test("B · pannes : tout en panne → 502 ; un réseau en panne → partiel, non mis en cache ; rien publié → absent", async () => {
  hubeau({ udi: [], parReseau: {}, panne: true });
  assert.equal((await EAUR.GET(new Request("http://localhost/api/proxy/eau?insee=57463"))).status, 502);

  hubeau({ udi: [{ code_reseau: "A", nom_reseau: "A" }, { code_reseau: "B", nom_reseau: "B" }], parReseau: { A: prelevement("2026-08-28", "ok") }, panneReseau: "B" });
  const p = await json(await EAUR.GET(new Request("http://localhost/api/proxy/eau?insee=57463")));
  assert.equal(p.corps.etat, "partiel");
  assert.equal(p.cache, "no-store");
  assert.equal(p.corps.reseaux[1].dernier, "indisponible");

  doubler(() => Response.json({ count: 0, data: [] }));
  const vide = await json(await EAUR.GET(new Request("http://localhost/api/proxy/eau?insee=57463")));
  assert.equal(vide.corps.etat, "absent_dans_source");
});

test("B · un arrondissement est lu sous le code de sa ville (Hub'Eau publie Paris sous 75056)", async () => {
  const appels = hubeau({ udi: [], parReseau: {} });
  await EAUR.GET(new Request("http://localhost/api/proxy/eau?insee=75104"));
  assert.ok(appels.every((a) => a.url.searchParams.get("code_commune") === "75056"));
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// C · Qualité de l'air
// ════════════════════════════════════════════════════════════════════════════════════════════════

test("C · une panne ATMO répond 502, une absence 404, et la panne n'est pas mémorisée", async () => {
  process.env.ATMO_USERNAME = "u";
  process.env.ATMO_PASSWORD = "p";
  let enPanne = true;
  doubler((u) => {
    if (enPanne) throw new TypeError("fetch failed");
    if (u.pathname.endsWith("/login")) return Response.json({ token: "t" });
    return Response.json({ features: [{ properties: { date_ech: "2026-10-28", code_qual: 2, source: "Atmo Grand Est" } }] });
  });
  const appel = () => ATMOR.GET(new Request("http://localhost/api/atmo/57463"), { params: Promise.resolve({ insee: "57463" }) });
  assert.equal((await appel()).status, 502);
  enPanne = false; // même instance, même journée : l'échec ne doit pas avoir été gardé
  const ok = await json(await appel());
  assert.equal(ok.status, 200);
  assert.equal(ok.corps.source, "Atmo Grand Est");

  doubler((u) => (u.pathname.endsWith("/login") ? Response.json({ token: "t" }) : Response.json({ features: [] })));
  const absent = await ATMOR.GET(new Request("http://localhost/api/atmo/01001"), { params: Promise.resolve({ insee: "01001" }) });
  assert.equal(absent.status, 404);
  assert.equal((await ATMOR.GET(new Request("http://localhost/api/atmo/x"), { params: Promise.resolve({ insee: "x" }) })).status, 400);
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// D · IREP
// ════════════════════════════════════════════════════════════════════════════════════════════════

const ENTETE_ETAB = "identifiant;nom_etablissement;numero_siret;adresse;code_postal;code_insee;commune;code_departement;departement;code_region;region;coordonnees_x;coordonnees_y;code_epsg;code_ape;libelle_ape;code_eprtr;libelle_eprtr";
const ENTETE_EMI = "identifiant;nom_etablissement;code_postal;code_insee;commune;code_departement;departement;code_region;region;annee_emission;milieu;polluant;quantite;unite";
const etab = (id: string, nom: string, insee: string, commune: string, dep: string, x: string, y: string, adresse = "rue X") =>
  `${id};${nom};0;${adresse};00000;${insee};${commune};${dep} ;D;00;R;${x};${y};4326;0000Z;Activité;;`;
const emi = (id: string, milieu: string, polluant: string, quantite: string, annee = 2025) =>
  `${id};N;00000;00000;C;00 ;D;00;R;${annee};${milieu};${polluant};${quantite};kg/an`;

// Lignes réelles de l'export 2025 (positions et départements), raccourcies aux colonnes lues.
const ETABS = [
  ENTETE_ETAB,
  etab("0006206637", "SUEZ RV LORRAINE", "57463", "METZ", "57", "6.122970", "49.311690"),
  // Siège déclaré à Paris 13e, entrepôt en Essonne à 24 km : position légitime, gardée.
  etab("0006500595", "SCI DISTRIPOLE PARISUD", "75113", "PARIS-13E-ARRONDISSEMENT", "75", "2.547050", "48.647390"),
  // Centre spatial de Kourou, à 31 km du centre de sa commune : gardé.
  etab("0006900026", "CENTRE NATIONAL D'ETUDES SPA", "97304", "KOUROU", "973", "-52.763660", "5.189500"),
  // EDF Saint-Barthélemy déclaré sous la Guadeloupe : gardé.
  etab("0022100014", "ELECTRICITE DE FRANCE", "97101", "Pointe-à-Pitre", "971", "-62.850010", "17.894560"),
  // Département « NR » : lu sur le code commune (Saint-Pierre-et-Miquelon), gardé.
  etab("0040000290", "ELECTRICITE DE FRANCE", "97502", "SAINT-PIERRE", "NR", "-56.167680", "46.790610"),
  // Positions impossibles : écartées, avec motif.
  etab("0006900017", "EIFFAGE INFRA GUYANE", "97302", "CAYENNE", "973", "2.599150", "50.471800"),
  etab("0100002548", "J M P", "25454", "PIERREFONTAINE-LES-VARANS", "25", "-5.274410", "40.773240"),
  // Adresse sur deux lignes, entre guillemets (Schneider, Le Vaudreuil).
  etab("0005801003", "SCHNEIDER ELECTRIC FRANCE", "27528", "LE VAUDREUIL", "27", "1.199900", "49.259110", '"2, rue du Pont Vert\nParc d\'activités du Village"'),
].join("\r\n");
const EMIS = [
  ENTETE_EMI,
  emi("0006206637", "Air", "Méthane (CH4)", "1250000"),
  emi("0006206637", "Eau (indirect)", "Azote total", "< seuil"),
  emi("0006500595", "Air", "COVNM", "< seuil"),
  emi("0006900026", "Air", "Dioxyde de carbone (CO2) total", "12000000"),
  emi("0006900017", "Air", "Poussières totales (TSP)", "200000"),
  emi("0005801003", "Eau (direct)", "Zinc et ses composés (Zn)", "120"),
  emi("0005801003", "Air", "COVNM", "45000"),
].join("\r\n");
const SOURCE = { archive: "https://files.georisques.fr/irep/2025.zip", sha256: "x", recupereLe: "2026-10-28" };
const construire = (etabs = ETABS, emis = EMIS) => IREP.construireIndexIrep({ annee: 2025, etablissementsCsv: etabs, emissionsCsv: emis, source: SOURCE });

test("D · construction : rejets chiffrés listés, « < seuil » comptés à part, adresse multiligne lue", () => {
  const idx = construire();
  assert.deepEqual(idx.meta.comptes, { etablissements: 8, avecRejet: 3, sansRejetChiffre: 3, exclus: 2 });
  const parId = Object.fromEntries(idx.avecRejet.map((e: M) => [e.id, e]));
  assert.deepEqual(parId["0006206637"].milieux, ["air"], "l'azote « < seuil » ne compte pas comme rejet publié");
  assert.deepEqual(parId["0005801003"].milieux, ["air", "eau_directe"]);
  assert.deepEqual(parId["0005801003"].polluants, ["COVNM", "Zinc et ses composés (Zn)"]);
  assert.equal(JSON.stringify(idx).includes("1250000"), false, "aucune quantité n'est reprise");
  assert.deepEqual(idx.autres.map((a: M) => a[0]).sort(), ["0006500595", "0022100014", "0040000290"]);
});

test("D · exclusions : positions impossibles écartées avec motif ; sites éloignés de leur siège gardés", () => {
  const idx = construire();
  assert.deepEqual(idx.meta.exclus.map((e: M) => [e.id, e.departement]), [["0006900017", "973"], ["0100002548", "25"]]);
  for (const e of idx.meta.exclus) assert.match(e.motif, /hors du territoire du département déclaré/);
  const gardes = new Set([...idx.avecRejet.map((e: M) => e.id), ...idx.autres.map((a: M) => a[0])]);
  for (const id of ["0006500595", "0006900026", "0022100014", "0040000290"]) assert.ok(gardes.has(id), id);
});

test("D · la construction REFUSE un export incohérent plutôt que d'écrire un index faux", () => {
  const ligneSuez = ETABS.split("\r\n")[1]!;
  assert.throws(() => construire(`${ETABS}\r\n${ligneSuez}`), /en double/);
  assert.throws(() => construire(ETABS, `${EMIS}\r\n${emi("0006206637", "Air", "CO2", "5", 2024)}`), /2024 dans l'export 2025/);
  assert.throws(() => construire(ETABS, `${EMIS}\r\n${emi("9999999999", "Air", "CO2", "5")}`), /établissement inconnu/);
  assert.throws(() => construire(ETABS, `${EMIS}\r\n${emi("0006206637", "Air", "CO2", "beaucoup")}`), /quantité illisible/);
  assert.throws(() => construire(ETABS, `${EMIS}\r\n${emi("0006206637", "Mer", "CO2", "5")}`), /milieu inconnu/);
  assert.throws(() => construire(ETABS.replace("6.122970;49.311690;4326", "6.122970;49.311690;2154")), /coordonnées illisibles/);
  // Département illisible : rattrapé par le code commune (cas « NR »)…
  assert.equal(construire(ETABS.replace(";57 ;D;", ";XX ;D;")).meta.comptes.exclus, 2);
  // … mais refusé quand le code commune ne dit rien non plus.
  assert.throws(() => construire(ETABS.replace("SUEZ RV LORRAINE;0;rue X;00000;57463;METZ;57 ;", "SUEZ RV LORRAINE;0;rue X;00000;XX463;METZ;XX ;")), /sans territoire connu/);
});

test("D · recherche : du plus proche au plus loin, rayon exact, aucune troncature, vide de la source nommé", () => {
  const idx = construire();
  const metz = IREP.irepAutour(idx, 49.311690, 6.122970, 10_000);
  assert.equal(metz.etat, "disponible");
  assert.deepEqual(metz.avecRejet.map((e: M) => [e.id, e.distanceM]), [["0006206637", 0]]);
  const large = IREP.irepAutour(idx, 49.0, 2.5, 1_000_000);
  assert.deepEqual(large.avecRejet.map((e: M) => e.id), ["0005801003", "0006206637"], "trié par distance");
  assert.equal(large.sansRejetChiffre, 1);
  const mer = IREP.irepAutour(idx, 46.0, -6.0, 10_000);
  assert.equal(mer.etat, "absent_dans_source");
  assert.equal(mer.exclusNational, 2);
  assert.deepEqual(IREP.irepAutour(null, 49, 6, 10_000), { etat: "indisponible" });
});

test("D · l'index livré : convention, millésime 2025, empreinte de l'archive, comptes et exclusions", () => {
  const idx = JSON.parse(readFileSync("data/irep-registre.json", "utf8")) as M;
  assert.ok(IREP.indexValide(idx));
  assert.equal(idx.meta.annee, 2025);
  assert.equal(idx.meta.source.archive, "https://files.georisques.fr/irep/2025.zip");
  assert.equal(idx.meta.source.sha256, "eb965b9c0f64bd35e866b7cae3b215b5abc9da3d5b9816ed4f428566eb3cc5ec");
  assert.deepEqual(idx.meta.comptes, { etablissements: 13811, avecRejet: 2786, sansRejetChiffre: 11021, exclus: 4 });
  assert.deepEqual(idx.meta.exclus.map((e: M) => e.id).sort(), ["0006900017", "0006900523", "0007211264", "0100002548"]);
  const ids = [...idx.avecRejet.map((e: M) => e.id), ...idx.autres.map((a: M) => a[0])];
  assert.equal(new Set(ids).size, ids.length, "aucun doublon");
});

test("D · contre-épreuve : Metz, Paris, Fos, Gramat, comptés indépendamment depuis l'export (script Python, 28/10/2026)", () => {
  // Comptes obtenus en lisant l'export 2025 sans passer par la table, autour du centre geo.api de la commune,
  // rayon 10 km (cf. docs/audits/2026-10-28-fut152-pollutions-invisibles.md).
  const idx = JSON.parse(readFileSync("data/irep-registre.json", "utf8")) as M;
  const cas: [string, number, number, number, number][] = [
    ["Metz", 49.1048, 6.1962, 5, 19],
    ["Paris", 48.8589, 2.347, 33, 86],
    ["Fos-sur-Mer", 43.4378, 4.9447, 26, 40],
    ["Gramat", 44.7808, 1.7256, 1, 3],
  ];
  for (const [nom, lat, lon, avec, sans] of cas) {
    const r = IREP.irepAutour(idx, lat, lon, IREP.IREP_RAYON_PAGE_M);
    assert.equal(r.avecRejet.length, avec, `${nom} avec rejet`);
    assert.equal(r.sansRejetChiffre, sans, `${nom} sans rejet chiffré`);
  }
});

// ════════════════════════════════════════════════════════════════════════════════════════════════
// E · Le composant
// ════════════════════════════════════════════════════════════════════════════════════════════════

test("E · plus aucune insertion de HTML, et les formulations arbitrées par le porteur", () => {
  const src = readFileSync(new URL("../components/PollutionLookup.tsx", import.meta.url), "utf8");
  const code = src.replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(code, /dangerouslySetInnerHTML|innerHTML/);
  assert.match(code, /sans rejet chiffré publié au-dessus des seuils/);
  assert.doesNotMatch(code, /sans pollution|sans rejet[^ ]| sans rejet\.|Aucune installation industrielle/i);
  assert.doesNotMatch(code, /Aucun site pollué ou ancien site industriel recensé/);
  assert.doesNotMatch(code, /couverture du réseau ATMO varie/);
  // Les quatre recherches interrogent leurs routes.
  for (const r of ["/api/proxy/irep", "/api/proxy/sis", "/api/atmo/", "/api/proxy/eau"]) assert.ok(code.includes(r), r);
  // Ce que chaque bloc doit dire à côté de son résultat.
  assert.match(code, /Elle ne mesure pas l’exposition d’un logement voisin/);
  assert.match(code, /Il ne garantit pas la qualité de l’eau aujourd’hui/);
  assert.match(code, /les nombres ne s’additionnent pas/);
});
