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
import { test, before, beforeEach, mock } from "node:test";
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
  // CASIAS : le compte est celui des identifiants distincts, jamais le total annoncé (Paris : 8 250 annoncées,
  // 8 248 distinctes), et la liste ne sort pas.
  const casias = SS.lireCasias([page([ficheSis("C1"), ficheSis("C2")], 3), page([ficheSis("C2"), ficheSis("C3")], 2)]);
  assert.deepEqual(casias, { etat: "disponible", total: 3 });
  assert.deepEqual(SS.lireCasias([page([], 0)]), { etat: "absent_dans_source", total: 0 });
  assert.deepEqual(SS.lireCasias([page([ficheSis("C1")]), null]), { etat: "indisponible" });
  assert.deepEqual(SS.lireCasias([page([ficheSis("C1")], 12000, 12)], true), { etat: "partiel", total: 1 });
});

test("A · un lien venu de la source n'est rendu que vers un domaine public attendu, en https", () => {
  assert.equal(SS.lienFicheSur("https://fiches-risques.brgm.fr/georisques/casias/SSP3915474"), "https://fiches-risques.brgm.fr/georisques/casias/SSP3915474");
  for (const v of ["javascript:alert(1)", "http://fiches-risques.brgm.fr/x", "https://evil.example/x", "https://fiches-risques.brgm.fr.evil.example/x", "", null, 42]) {
    assert.equal(SS.lienFicheSur(v), null, String(v));
  }
});

test("A · la vraie route : officielle, avec le transport commun de FUT-158 (`Accept-Encoding: identity`)", async () => {
  // CASIAS sur deux pages, avec une fiche répétée d'une page à l'autre : 3 lignes, 2 fiches.
  const appels = doubler((u) => {
    if (!u.pathname.endsWith("/casias")) return Response.json(page([ficheSis(`${u.pathname}-1`)]));
    return Response.json(u.searchParams.get("page") === "1"
      ? page([ficheSis("C1"), ficheSis("C2")], 3, 2)
      : page([ficheSis("C2")], 3, 2));
  });
  const r = await json(await SIS.GET(new Request("http://localhost/api/proxy/sis?insee=57463")));
  assert.equal(r.status, 200);
  assert.match(r.cache!, /s-maxage=86400/);
  assert.deepEqual(r.corps.casias, { etat: "disponible", total: 2 }, "compté par identifiant, liste non transmise");
  assert.deepEqual(appels.filter((a) => a.url.pathname.endsWith("/casias")).map((a) => a.url.searchParams.get("page")).sort(), ["1", "2"]);
  for (const a of appels) {
    assert.equal(a.url.origin, "https://georisques.gouv.fr");
    assert.match(a.url.pathname, /^\/api\/v1\/ssp\/(conclusions_sis|instructions|conclusions_sup|casias)$/);
    assert.deepEqual(a.headers, { accept: "application/json", "accept-encoding": "identity" }, "les en-têtes de `EN_TETES_GEORISQUES`, rien d'autre");
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

// CONTRE-ÉPREUVES DE LA REVUE DU 29/10/2026 (défauts 1 et 4) : un total annoncé positif n'est jamais une absence.

test("A · revue 1 · la source annonce des lignes sans fiche exploitable : `partiel`, jamais `absent_dans_source`", () => {
  // 3 lignes annoncées, aucune rendue.
  assert.deepEqual(SS.lireCategorie([page([], 3)]), { etat: "partiel", total: 0, fiches: [] });
  // 2 lignes annoncées et rendues, mais sans identifiant : rien n'en est tiré, rien n'en est conclu.
  const sansId = { nom: "Site sans identifiant", adresse: "2 rue Y" };
  assert.deepEqual(SS.lireCategorie([page([sansId, sansId])]), { etat: "partiel", total: 0, fiches: [] });
  // Une fiche lisible et une ligne inexploitable : la fiche est montrée, la liste dite incomplète.
  const mixte = SS.lireCategorie([page([ficheSis("A"), sansId, "pas un objet" as unknown as M])]);
  assert.equal(mixte.etat, "partiel");
  assert.deepEqual(mixte.fiches.map((f: M) => f.id), ["A"]);
  assert.deepEqual(SS.lireCasias([page([sansId], 1)]), { etat: "partiel", total: 0 });
  // Le seul vrai vide : la source répond, n'annonce rien et ne rend rien.
  assert.deepEqual(SS.lireCategorie([page([], 0)]), { etat: "absent_dans_source", total: 0, fiches: [] });
});

test("A · revue 1 · un lot dont les pages rendent moins de lignes qu'annoncé est incomplet", () => {
  assert.equal(SS.lotIncomplet([page([ficheSis("A")], 1500, undefined as unknown as number)], 5), true, "`total_pages` absent, 1 ligne sur 1 500");
  assert.equal(SS.lotIncomplet([page([ficheSis("A")], 2, 1)], 5), true, "`total_pages` faux");
  assert.equal(SS.lotIncomplet([page([ficheSis("A")], 12000, 12)], 10), true, "plafond");
  assert.equal(SS.lotIncomplet([page([ficheSis("A"), ficheSis("A")], 2, 1)], 5), false, "lignes répétées, toutes lues");
  assert.equal(SS.lotIncomplet([page([], 0)], 5), false);
});

test("A · revue 1 · la vraie route : un total annoncé non entièrement lu ne s'affiche jamais en absence", async () => {
  // SIS annonce 2 lignes sur 1 page, n'en rend aucune ; CASIAS annonce 1 500 lignes sans `total_pages`.
  doubler((u) => {
    const cat = u.pathname.split("/").pop();
    if (cat === "conclusions_sis") return Response.json(page([], 2));
    if (cat === "casias") return Response.json({ results: 1500, page: 1, data: [ficheSis("C1")] });
    return Response.json(page([]));
  });
  const r = await json(await SIS.GET(new Request("http://localhost/api/proxy/sis?insee=57463")));
  assert.deepEqual(r.corps.sis, { etat: "partiel", total: 0, fiches: [] });
  assert.deepEqual(r.corps.casias, { etat: "partiel", total: 1 });
  assert.equal(r.corps.instructions.etat, "absent_dans_source");
});

test("A · revue 1 · l'écran : un partiel sans fiche n'affiche ni la phrase d'absence ni un compte", () => {
  const src = readFileSync(new URL("../components/PollutionLookup.tsx", import.meta.url), "utf8");
  assert.match(src, /lu\.etat === 'absent_dans_source' && <div className="lookup-empty">\{vide\}<\/div>/, "la phrase d'absence n'a qu'un état");
  assert.match(src, /lu\.etat === 'partiel' && lu\.total > 0 && ` : au moins/);
  assert.match(src, /casias\.etat === 'partiel' && casias\.total > 0 && ` : au moins/);
  assert.match(src, /La source annonce des fiches qui n’ont pas pu être lues : rien ne peut en être conclu/);
});

test("A · revue 4 · une panne de transport est tracée `georisques_echec`, comme les autres appels Géorisques", async () => {
  const traces: string[] = [];
  const erreur = console.error;
  console.error = (m: string) => { traces.push(m); };
  try {
    doubler(() => { throw Object.assign(new TypeError("fetch failed"), { cause: { code: "ECONNRESET" } }); });
    await SSR.getSitesSolsCommune("57463");
  } finally {
    console.error = erreur;
  }
  const lignes = traces.map((t) => JSON.parse(t));
  assert.ok(lignes.length >= 4);
  for (const l of lignes) {
    assert.equal(l.evenement, "georisques_echec");
    assert.equal(l.erreur, "ECONNRESET");
    assert.match(l.chemin, /^\/api\/v1\/ssp\//);
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
function hubeau(o: { udi: M[]; parReseau: Record<string, M | null>; panneReseau?: string; panne?: boolean; panneUdiPage?: number; udiAnnonce?: number; parReseauBrut?: Record<string, M> }) {
  return doubler((u) => {
    if (o.panne) throw new TypeError("fetch failed");
    if (u.pathname.endsWith("/communes_udi")) {
      const n = Number(u.searchParams.get("size") ?? 50), k = Number(u.searchParams.get("page") ?? 1);
      if (o.panneUdiPage === k) return new Response("panne", { status: 500 });
      const data = o.udi.slice((k - 1) * n, k * n);
      return Response.json({ count: o.udiAnnonce ?? o.udi.length, data }, { status: k * n < o.udi.length ? 206 : 200 });
    }
    const reseau = u.searchParams.get("code_reseau");
    if (reseau && reseau === o.panneReseau) return new Response("panne", { status: 500 });
    if (reseau && o.parReseauBrut?.[reseau]) return Response.json(o.parReseauBrut[reseau]);
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

// CONTRE-ÉPREUVES DE LA REVUE DU 29/10/2026 (défauts 1 et 2).

const udi = (n: number) => Array.from({ length: n }, (_, i) => ({ code_reseau: `R${String(i + 1).padStart(3, "0")}`, nom_reseau: `Réseau ${i + 1}` }));

test("B · revue 2 · au-delà de 50 réseaux, toutes les pages sont lues", async () => {
  const appels = hubeau({ udi: udi(120), parReseau: {} });
  const r = await json(await EAUR.GET(new Request("http://localhost/api/proxy/eau?insee=57463")));
  assert.equal(r.corps.reseaux.length, 120);
  assert.equal(r.corps.etat, "disponible");
  assert.deepEqual(appels.filter((a) => a.url.pathname.endsWith("/communes_udi")).map((a) => a.url.searchParams.get("page")), ["1", "2", "3"]);
});

test("B · revue 2 · une page de réseaux en échec : la liste lue est montrée, la lecture dite partielle et non mise en cache", async () => {
  hubeau({ udi: udi(120), parReseau: {}, panneUdiPage: 2 });
  const r = await json(await EAUR.GET(new Request("http://localhost/api/proxy/eau?insee=57463")));
  assert.equal(r.corps.etat, "partiel");
  assert.equal(r.corps.reseaux.length, 50);
  assert.equal(r.cache, "no-store");
});

test("B · revue 2 · la source annonce plus de réseaux qu'elle n'en rend : partiel", async () => {
  hubeau({ udi: udi(3), udiAnnonce: 70, parReseau: {} });
  const r = await json(await EAUR.GET(new Request("http://localhost/api/proxy/eau?insee=57463")));
  assert.equal(r.corps.etat, "partiel");
  assert.equal(r.corps.reseaux.length, 3);
});

test("B · revue 1 · un prélèvement annoncé mais illisible n'est jamais « aucun prélèvement publié »", () => {
  const def = EAU.PARAMETRES_EAU.map(() => ({ count: 0, data: [] }));
  // Le réseau annonce 4 prélèvements, la ligne rendue n'a pas de date.
  const reseau = EAU.lireEauPotable({
    consulteLe: "2026-10-29", repliCommune: null, parametres: def,
    reseaux: [{ code: "A", nom: "A", zone: null, reponse: { count: 1, data: [{ date_prelevement: "2026-08-28T10:00:00Z" }] } },
      { code: "B", nom: "B", zone: null, reponse: { count: 4, data: [{ conclusion_conformite_prelevement: "x" }] } }],
  });
  assert.equal(reseau.etat, "partiel");
  assert.equal(reseau.reseaux[1].dernier, "indisponible");
  // Repli sur la commune : 2 prélèvements annoncés, aucune ligne rendue.
  const repli = EAU.lireEauPotable({ consulteLe: "2026-10-29", reseaux: [], repliCommune: { count: 2, data: [] }, parametres: def });
  assert.equal(repli.etat, "partiel");
  // Un paramètre annoncé sans valeur lisible.
  const param = EAU.lireEauPotable({
    consulteLe: "2026-10-29", reseaux: [], repliCommune: { count: 0, data: [] },
    parametres: def.map((d: M, i: number) => (i === 0 ? { count: 5, data: [{ date_prelevement: "2026-08-28" }] } : d)),
  });
  assert.equal(param.etat, "partiel");
  // Le seul vrai vide : rien d'annoncé, rien de rendu.
  assert.equal(EAU.lireEauPotable({ consulteLe: "2026-10-29", reseaux: [], repliCommune: { count: 0, data: [] }, parametres: def }).etat, "absent_dans_source");
});

test("B · revue 1 · la vraie route : un réseau qui annonce des prélèvements illisibles est dit indisponible", async () => {
  hubeau({ udi: udi(1), parReseau: {}, parReseauBrut: { R001: { count: 3, data: [{ reseaux: [] }] } } });
  const r = await json(await EAUR.GET(new Request("http://localhost/api/proxy/eau?insee=57463")));
  assert.equal(r.status, 502, "le seul réseau est illisible : rien ne peut être conclu");
  hubeau({ udi: udi(2), parReseau: { R002: prelevement("2026-08-28", "ok") }, parReseauBrut: { R001: { count: 3, data: [{ reseaux: [] }] } } });
  const p = await json(await EAUR.GET(new Request("http://localhost/api/proxy/eau?insee=57463")));
  assert.equal(p.corps.etat, "partiel");
  assert.equal(p.corps.reseaux[0].dernier, "indisponible");
  assert.equal(p.cache, "no-store");
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
    return Response.json({ features: [{ properties: { date_ech: ATMO.jourParis(), code_qual: 2, source: "Atmo Grand Est" } }] });
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

test("C · revue 3 · un JSON inattendu est une panne (502), jamais une absence, et n'est pas mémorisé", async () => {
  process.env.ATMO_USERNAME = "u";
  process.env.ATMO_PASSWORD = "p";
  const bon = { features: [{ properties: { date_ech: ATMO.jourParis(), code_qual: 3, source: "Airparif" } }] };
  const inattendus: unknown[] = [
    { error: "quota dépassé" }, {}, { features: "x" }, { features: [null] }, { features: [{ geometry: {} }] },
    [1, 2], "texte", null, { features: [{ properties: { code_qual: 9 } }] }, { features: [{ properties: { code_qual: null } }] },
  ];
  // Chaque forme sur une commune différente : le cache par commune et par jour ne peut rien masquer.
  for (const [i, corps] of inattendus.entries()) {
    const insee = `570${String(10 + i).padStart(2, "0")}`;
    let reponse: unknown = corps;
    doubler((u) => (u.pathname.endsWith("/login") ? Response.json({ token: "t" }) : Response.json(reponse)));
    const appel = () => ATMOR.GET(new Request(`http://localhost/api/atmo/${insee}`), { params: Promise.resolve({ insee }) });
    assert.equal((await appel()).status, 502, JSON.stringify(corps));
    reponse = bon; // même instance, même journée : l'erreur n'a pas été gardée comme un résultat
    const ok = await json(await appel());
    assert.equal(ok.status, 200, JSON.stringify(corps));
    assert.equal(ok.corps.index.label, "Dégradé");
  }
  assert.throws(() => ATMO.enregistrementsAtmo({ ok: true }), ATMO.ReponseAtmoInattendue);
  assert.deepEqual(ATMO.enregistrementsAtmo([]), []);
  assert.deepEqual(ATMO.enregistrementsAtmo({ features: [] }), []);
});

test("C · revue 3 · `code_qual` 0 (indice absent dans la nomenclature ATMO) reste une absence : 404", async () => {
  doubler((u) => (u.pathname.endsWith("/login") ? Response.json({ token: "t" }) : Response.json({ features: [{ properties: { code_qual: 0 } }] })));
  const r = await ATMOR.GET(new Request("http://localhost/api/atmo/57099"), { params: Promise.resolve({ insee: "57099" }) });
  assert.equal(r.status, 404);
});

test("C · revue 3 · aucune réponse ATMO n'entre dans le cache de données Next", () => {
  const src = readFileSync(new URL("./atmo.ts", import.meta.url), "utf8").replace(/^\s*(\/\/|\*).*$/gm, "");
  assert.doesNotMatch(src, /revalidate/);
  assert.match(src, /cache: "no-store"/);
});

// CONTRE-ÉPREUVES DE LA CONTRE-REVUE DU 29/10/2026 : AUCUN RÉSULTAT ATMO N'EST GARDÉ PAR L'INSTANCE.
// Sur le SHA refusé (`11009c34`), la promesse résolue restait en mémoire toute la journée : les deux premières
// échouent. Horloge simulée (`mock.timers`, Date seulement), même instance, `fetch` doublé.

/** Un ATMO simulé : `publie[jour]` est l'enregistrement publié pour ce jour (absent : rien). Note chaque lecture. */
function atmoSimule(publie: Record<string, M | M[] | undefined>) {
  const lectures: string[] = [];
  doubler((u) => {
    if (u.pathname.endsWith("/login")) return Response.json({ token: "t" });
    const filtre = JSON.parse(decodeURIComponent(u.pathname.split("/").pop()!)) as M;
    const jour = filtre.date_ech.value as string;
    lectures.push(jour);
    const r = publie[jour];
    return Response.json(Array.isArray(r) ? r : { features: r ? [{ properties: r }] : [] });
  });
  return lectures;
}
const atmoRoute = (insee: string) => ATMOR.GET(new Request(`http://localhost/api/atmo/${insee}`), { params: Promise.resolve({ insee }) });
const DEUX_HEURES = 2 * 3600 * 1000;

function horloge(iso: string) {
  mock.timers.enable({ apis: ["Date"], now: new Date(iso).getTime() });
  return { avancer: (ms: number) => mock.timers.tick(ms), fin: () => mock.timers.reset() };
}

test("C · contre-revue 1 · absence (404), puis publication deux heures plus tard : 200 et nouvel appel à la source", async () => {
  process.env.ATMO_USERNAME = "u"; process.env.ATMO_PASSWORD = "p";
  const h = horloge("2026-10-29T09:00:00+01:00");
  try {
    const publie: Record<string, M | undefined> = {};
    const lectures = atmoSimule(publie);
    const r1 = await atmoRoute("57201");
    assert.equal(r1.status, 404);
    assert.equal(r1.headers.get("cache-control"), "no-store");
    const avant = lectures.length;
    h.avancer(DEUX_HEURES);
    publie["2026-10-29"] = { date_ech: "2026-10-29", code_qual: 2, source: "Atmo Grand Est" };
    const r2 = await json(await atmoRoute("57201"));
    assert.equal(r2.status, 200);
    assert.equal(r2.corps.date, "2026-10-29");
    assert.ok(lectures.length > avant, "la source a été relue");
  } finally { h.fin(); }
});

test("C · contre-revue 2 · indice de la veille, puis celui du jour deux heures plus tard : nouvel appel, bonne date", async () => {
  process.env.ATMO_USERNAME = "u"; process.env.ATMO_PASSWORD = "p";
  const h = horloge("2026-10-29T10:00:00+01:00");
  try {
    const publie: Record<string, M | undefined> = { "2026-10-28": { date_ech: "2026-10-28", code_qual: 3, source: "Atmo Grand Est" } };
    const lectures = atmoSimule(publie);
    const r1 = await json(await atmoRoute("57202"));
    assert.equal(r1.corps.date, "2026-10-28", "repli sur la veille, daté de la veille");
    assert.deepEqual(lectures, ["2026-10-29", "2026-10-28"]);
    h.avancer(DEUX_HEURES);
    publie["2026-10-29"] = { date_ech: "2026-10-29", code_qual: 1, source: "Atmo Grand Est" };
    const r2 = await json(await atmoRoute("57202"));
    assert.equal(r2.corps.date, "2026-10-29");
    assert.equal(r2.corps.index.label, "Bon");
    assert.deepEqual(lectures, ["2026-10-29", "2026-10-28", "2026-10-29"], "un seul nouvel appel, au jour courant");
  } finally { h.fin(); }
});

test("C · contre-revue 3 · réponse inattendue (502, rien gardé), puis source rétablie : 200 sur la même commune", async () => {
  process.env.ATMO_USERNAME = "u"; process.env.ATMO_PASSWORD = "p";
  const h = horloge("2026-10-29T14:00:00+01:00");
  try {
    let casse = true;
    doubler((u) => {
      if (u.pathname.endsWith("/login")) return Response.json({ token: "t" });
      return Response.json(casse ? { error: "quota" } : { features: [{ properties: { date_ech: "2026-10-29", code_qual: 2 } }] });
    });
    const r1 = await atmoRoute("57203");
    assert.equal(r1.status, 502);
    assert.equal(r1.headers.get("cache-control"), "no-store");
    casse = false;
    assert.equal((await atmoRoute("57203")).status, 200);
  } finally { h.fin(); }
});

test("C · contre-revue 4 · deux lectures simultanées partagent un seul appel ; la suivante relit la source", async () => {
  process.env.ATMO_USERNAME = "u"; process.env.ATMO_PASSWORD = "p";
  const h = horloge("2026-10-29T15:00:00+01:00");
  try {
    const lectures = atmoSimule({ "2026-10-29": { date_ech: "2026-10-29", code_qual: 2 } });
    const [a, b] = await Promise.all([ATMO.lireAtmoCommune("57204"), ATMO.lireAtmoCommune("57204")]);
    assert.equal(a.etat, "disponible");
    assert.deepEqual(a, b);
    assert.equal(lectures.length, 1, "un seul appel pour deux lectures simultanées");
    await ATMO.lireAtmoCommune("57204");
    assert.equal(lectures.length, 2, "rien n'est gardé après la fin de l'appel");
  } finally { h.fin(); }
});

test("C · contre-revue 5 · `getAtmoForCommune` (page chaleur, aperçu de l'accueil) : indice ou `null`, jamais d'exception", async () => {
  process.env.ATMO_USERNAME = "u"; process.env.ATMO_PASSWORD = "p";
  const h = horloge("2026-10-29T15:00:00+01:00");
  try {
    atmoSimule({ "2026-10-29": { date_ech: "2026-10-29", code_qual: 4, source: "AtmoSud" } });
    const ok = await ATMO.getAtmoForCommune("13039");
    assert.equal(ok.index.label, "Mauvais");
    assert.equal(ok.date, "2026-10-29");
    assert.equal(ok.inseeCode, "13039");
    atmoSimule({});
    assert.equal(await ATMO.getAtmoForCommune("13039"), null, "absence");
    doubler(() => { throw new TypeError("fetch failed"); });
    assert.equal(await ATMO.getAtmoForCommune("13039"), null, "panne");
  } finally { h.fin(); }
});

test("C · contre-revue 6 · expiration HTTP bornée ; jour de Paris ; un indice d'un autre jour n'est jamais servi", async () => {
  process.env.ATMO_USERNAME = "u"; process.env.ATMO_PASSWORD = "p";
  // 0 h 30 à Paris le 29/10 (23 h 30 UTC le 28) : le jour demandé est le 29, plus le 28 de l'UTC.
  const h = horloge("2026-10-28T23:30:00Z");
  try {
    assert.equal(ATMO.jourParis(), "2026-10-29");
    const lectures = atmoSimule({ "2026-10-29": { date_ech: "2026-10-29", code_qual: 2 } });
    const r = await atmoRoute("57205");
    assert.equal(r.status, 200);
    assert.equal(lectures[0], "2026-10-29");
    const cc = r.headers.get("cache-control")!;
    const s = Number(/s-maxage=(\d+)/.exec(cc)?.[1]), swr = Number(/stale-while-revalidate=(\d+)/.exec(cc)?.[1]);
    assert.ok(s > 0 && s <= 900 && swr <= 300, cc);
    assert.ok(s + swr <= 1200, "un indice n'est jamais servi plus de 20 minutes après sa lecture");
    // L'API rend un indice daté d'un autre jour que celui demandé : réponse inattendue, 502.
    atmoSimule({ "2026-10-29": { date_ech: "2026-10-28", code_qual: 2 } });
    assert.equal((await atmoRoute("57206")).status, 502);
  } finally { h.fin(); }
  // Heure d'été : 1 h 30 à Paris le 15/07 = 23 h 30 UTC le 14.
  assert.equal(ATMO.jourParis(Date.parse("2026-07-14T23:30:00Z")), "2026-07-15");
});

// CONTRE-ÉPREUVES DE LA CONTRE-REVUE DU 29/10/2026 (bis) : LA VEILLE EST LE JOUR CIVIL PRÉCÉDENT À PARIS.
// Sur le SHA refusé (`23f110d0`), la veille valait « maintenant moins 24 h » : fausse les soirs de changement
// d'heure, où deux jours français sont séparés de 23 ou 25 heures. Les tests 7 à 10 y échouent.

/** Le jour civil précédent, trouvé en reculant d'heure en heure jusqu'à changer de jour à Paris. */
function veilleObservee(t: number): string {
  const jour = ATMO.jourParis(t);
  let u = t;
  while (ATMO.jourParis(u) === jour) u -= 3600 * 1000;
  return ATMO.jourParis(u);
}

test("C · contre-revue 7 · passage à l'heure d'été (29/03/2026) : à 0 h 30 le 30, la veille est le 29", async () => {
  process.env.ATMO_USERNAME = "u"; process.env.ATMO_PASSWORD = "p";
  // Le 29/03 ne dure que 23 h : 0 h 30 le 30 (heure d'été) moins 24 h tombe le 28 à 23 h 30.
  const h = horloge("2026-03-30T00:30:00+02:00");
  try {
    const lectures = atmoSimule({ "2026-03-29": { date_ech: "2026-03-29", code_qual: 2, source: "Airparif" } });
    const r = await json(await atmoRoute("75107"));
    assert.equal(r.status, 200, "absence aujourd'hui, indice publié hier : récupéré");
    assert.equal(r.corps.date, "2026-03-29");
    assert.deepEqual(lectures, ["2026-03-30", "2026-03-29"]);
  } finally { h.fin(); }
});

test("C · contre-revue 8 · passage à l'heure d'hiver (25/10/2026) : à 23 h 30 le 25, la veille est le 24, puis le jour suivant remplace", async () => {
  process.env.ATMO_USERNAME = "u"; process.env.ATMO_PASSWORD = "p";
  // Le 25/10 dure 25 h : 23 h 30 le 25 (heure d'hiver) moins 24 h tombe encore le 25, à 0 h 30.
  const h = horloge("2026-10-25T23:30:00+01:00");
  try {
    const publie: Record<string, M | undefined> = { "2026-10-24": { date_ech: "2026-10-24", code_qual: 3, source: "Atmo Grand Est" } };
    const lectures = atmoSimule(publie);
    const r1 = await json(await atmoRoute("57210"));
    assert.equal(r1.status, 200, "absence aujourd'hui, indice publié hier : récupéré");
    assert.equal(r1.corps.date, "2026-10-24");
    assert.deepEqual(lectures, ["2026-10-25", "2026-10-24"]);
    // Deux heures plus tard, le 26 à 1 h 30 : l'indice du 26 est publié et remplace celui du 24.
    h.avancer(DEUX_HEURES);
    publie["2026-10-26"] = { date_ech: "2026-10-26", code_qual: 1, source: "Atmo Grand Est" };
    const r2 = await json(await atmoRoute("57210"));
    assert.equal(r2.corps.date, "2026-10-26");
    assert.equal(r2.corps.index.label, "Bon");
    assert.deepEqual(lectures, ["2026-10-25", "2026-10-24", "2026-10-26"]);
  } finally { h.fin(); }
});

test("C · contre-revue 9 · nuit du changement d'heure : absence, puis publication du jour, sans résultat périmé ; panne puis retour ; appels simultanés", async () => {
  process.env.ATMO_USERNAME = "u"; process.env.ATMO_PASSWORD = "p";
  const h = horloge("2026-03-30T00:15:00+02:00");
  try {
    const publie: Record<string, M | undefined> = {};
    const lectures = atmoSimule(publie);
    const r1 = await atmoRoute("75108");
    assert.equal(r1.status, 404);
    assert.equal(r1.headers.get("cache-control"), "no-store");
    assert.deepEqual(lectures, ["2026-03-30", "2026-03-29"], "la veille lue est le 29, jamais le 28");
    h.avancer(DEUX_HEURES);
    publie["2026-03-30"] = { date_ech: "2026-03-30", code_qual: 2, source: "Airparif" };
    const r2 = await json(await atmoRoute("75108"));
    assert.equal(r2.status, 200);
    assert.equal(r2.corps.date, "2026-03-30");
    // Panne, puis retour du service, sur la même instance.
    doubler(() => { throw new TypeError("fetch failed"); });
    const r3 = await atmoRoute("75108");
    assert.equal(r3.status, 502);
    assert.equal(r3.headers.get("cache-control"), "no-store");
    const apres = atmoSimule(publie);
    const [a, b] = await Promise.all([ATMO.lireAtmoCommune("75108"), ATMO.lireAtmoCommune("75108")]);
    assert.equal(a.etat, "disponible");
    assert.deepEqual(a, b);
    assert.deepEqual(apres, ["2026-03-30"], "un seul appel pour deux lectures simultanées");
  } finally { h.fin(); }
});

test("C · contre-revue 10 · « hier » est toujours le jour civil précédent : minuits, changements d'heure, fins de mois et d'année", async () => {
  process.env.ATMO_USERNAME = "u"; process.env.ATMO_PASSWORD = "p";
  const instants: number[] = [];
  // Quart d'heure par quart d'heure autour des deux changements d'heure de 2026.
  for (const [debut, fin] of [["2026-03-28T00:00:00Z", "2026-03-31T00:00:00Z"], ["2026-10-24T00:00:00Z", "2026-10-27T00:00:00Z"]]) {
    for (let t = Date.parse(debut); t < Date.parse(fin); t += 15 * 60 * 1000) instants.push(t);
  }
  // Juste avant et juste après minuit à Paris, en hiver et en été, et aux bornes de mois et d'année.
  for (const iso of [
    "2026-01-01T00:00:01+01:00", "2025-12-31T23:59:59+01:00", "2026-03-01T00:00:01+01:00",
    "2026-07-15T00:00:01+02:00", "2026-07-14T23:59:59+02:00", "2026-11-01T00:00:01+01:00", "2028-03-01T00:30:00+01:00",
  ]) instants.push(Date.parse(iso));
  const fautes: string[] = [];
  for (const t of instants) {
    const h = horloge(new Date(t).toISOString());
    try {
      const lectures = atmoSimule({});
      await ATMO.lireAtmoCommune("75109");
      const attendu = [ATMO.jourParis(t), veilleObservee(t)];
      if (lectures.join() !== attendu.join()) fautes.push(`${new Date(t).toISOString()} : ${lectures.join(" → ")} au lieu de ${attendu.join(" → ")}`);
    } finally { h.fin(); }
  }
  assert.deepEqual(fautes, []);
  assert.equal(veilleObservee(Date.parse("2026-01-01T00:00:01+01:00")), "2025-12-31");
  assert.equal(veilleObservee(Date.parse("2028-03-01T00:30:00+01:00")), "2028-02-29");
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
  // rayon 10 km (cf. docs/audits/2026-10-28-fut152-pollutions-invisibles.md). Les points sont EXACTEMENT ceux
  // que l'écran envoie (`centre` de geo.api.gouv.fr, relevé le 29/10/2026). Revue du 29/10 : Fos et Gramat
  // portaient un autre point ; à Fos, 26 / 40 au lieu des 17 / 32 que le lecteur voit.
  const idx = JSON.parse(readFileSync("data/irep-registre.json", "utf8")) as M;
  const cas: [string, number, number, number, number][] = [
    ["Metz", 49.1048, 6.1962, 5, 19],
    ["Paris", 48.8589, 2.347, 33, 86],
    ["Fos-sur-Mer", 43.4545, 4.8979, 17, 32],
    ["Gramat", 44.7643, 1.7125, 1, 3],
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

// ════════════════════════════════════════════════════════════════════════════════════════════════
// C · robustesse ATMO (29/10/2026) : une nouvelle tentative après un 5xx, le jeton refusé oublié, un journal
// d'incident sans secret. Mesuré en production le même jour : ATMO répond par moments 500, puis 200.
// ════════════════════════════════════════════════════════════════════════════════════════════════

const SECRETS = { user: "identifiant-tres-secret", pass: "mdp-tres-secret", jeton: "jeton-tres-secret" };
type Rep = Response | Promise<Response> | "muet";
/**
 * Un ATMO scripté, pour un jour donné : `login` et `lecture` sont les réponses successives (la dernière se
 * répète). Note chaque appel et chaque ligne de journal. Horloge simulée sur ce jour, en 2030 : le jeton d'un
 * test précédent (le plus tardif simule 2028) est expiré, chaque test part d'une instance sans jeton valide.
 */
function atmoScripte(jour: string, login: (() => Rep)[], lecture: ((jeton: string) => Rep)[]) {
  process.env.ATMO_USERNAME = SECRETS.user;
  process.env.ATMO_PASSWORD = SECRETS.pass;
  mock.timers.reset(); // un script peut en suivre un autre dans le même test
  mock.timers.enable({ apis: ["Date"], now: new Date(`${jour}T15:00:00+01:00`).getTime() });
  const n = { login: 0, lecture: 0 };
  const jetons: string[] = [];
  globalThis.fetch = (async (input: string | URL, init?: RequestInit) => {
    const estLogin = String(input).endsWith("/login");
    const r = estLogin
      ? login[Math.min(n.login++, login.length - 1)]()
      : lecture[Math.min(n.lecture++, lecture.length - 1)](((init?.headers ?? {}) as Record<string, string>).authorization?.replace("Bearer ", "") ?? "");
    if (!estLogin) jetons.push(((init?.headers ?? {}) as Record<string, string>).authorization ?? "");
    if (r !== "muet") return r;
    return new Promise<Response>((_, rej) => init?.signal?.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError"))));
  }) as typeof fetch;
  const lignes: string[] = [];
  const e = mock.method(console, "error", (l: string) => { lignes.push(l); });
  const w = mock.method(console, "warn", (l: string) => { lignes.push(l); });
  const journal = () => lignes.map((l) => JSON.parse(l) as M);
  const fin = () => { mock.timers.reset(); e.mock.restore(); w.mock.restore(); };
  return { n, jetons, lignes, journal, fin };
}
const jetonOk = (j = SECRETS.jeton) => () => Response.json({ token: j });
const indiceDu = (jour: string) => () => Response.json({ features: [{ properties: { date_ech: jour, code_qual: 2, source: "Atmo Grand Est" } }] });
const erreur = (statut: number) => () => statut >= 500
  ? Response.json({ type: "https://tools.ietf.org/html/rfc2616#section-10", title: "An error occurred", status: statut, detail: "Internal Server Error" }, { status: statut })
  : new Response("", { status: statut });
const html500 = () => new Response("<!DOCTYPE html><title>An Error Occurred: Internal Server Error</title>", { status: 500, headers: { "content-type": "text/html" } });
const routeAtmo = (insee: string) => ATMOR.GET(new Request(`http://localhost/api/atmo/${insee}`), { params: Promise.resolve({ insee }) });
const CHAMPS_JOURNAL = ["categorie", "duree_ms", "etape", "evenement", "issue", "statut", "tentatives"];
/** Aucune ligne ne porte un secret, et chaque ligne n'a que les champs fixes. */
function journalSain(lignes: string[]) {
  for (const l of lignes) {
    for (const s of Object.values(SECRETS)) assert.ok(!l.includes(s), `secret dans le journal : ${l}`);
    assert.ok(!/bearer|authorization|password|username|Internal Server Error/i.test(l), l);
    assert.deepEqual(Object.keys(JSON.parse(l)).sort(), CHAMPS_JOURNAL);
  }
}

test("C · robustesse 1 · login 500 (page HTML) puis 200 : l'indice est servi, une trace « retabli »", async () => {
  const a = atmoScripte("2030-01-01", [html500, jetonOk()], [indiceDu("2030-01-01")]);
  try {
    const r = await json(await routeAtmo("57463"));
    assert.equal(r.status, 200);
    assert.deepEqual(a.n, { login: 2, lecture: 1 });
    assert.deepEqual(a.journal().map((l) => [l.etape, l.statut, l.categorie, l.tentatives, l.issue]), [["login", 500, "http_5xx", 2, "retabli"]]);
    assert.ok(a.journal()[0].duree_ms >= 500, "la pause de 500 ms a eu lieu");
    journalSain(a.lignes);
  } finally { a.fin(); }
});

test("C · robustesse 2 · lecture 500 puis 200 : l'indice est servi, avec le même jeton", async () => {
  const a = atmoScripte("2030-01-02", [jetonOk()], [erreur(500), indiceDu("2030-01-02")]);
  try {
    const r = await json(await routeAtmo("57463"));
    assert.equal(r.status, 200);
    assert.equal(r.corps.date, "2030-01-02");
    assert.deepEqual(a.n, { login: 1, lecture: 2 });
    assert.equal(new Set(a.jetons).size, 1);
    assert.deepEqual(a.journal().map((l) => [l.etape, l.categorie, l.issue]), [["lecture", "http_5xx", "retabli"]]);
    journalSain(a.lignes);
  } finally { a.fin(); }
});

test("C · robustesse 3 · deux 500 : 502 `indisponible` non mis en cache, deux tentatives et pas une de plus", async () => {
  const a = atmoScripte("2030-01-03", [jetonOk()], [erreur(503)]);
  try {
    const r = await json(await routeAtmo("57463"));
    assert.deepEqual([r.status, r.cache, r.corps], [502, "no-store", { etat: "indisponible" }]);
    assert.deepEqual(a.n, { login: 1, lecture: 2 }, "pas de repli sur la veille après une panne");
    assert.deepEqual(a.journal().map((l) => [l.etape, l.statut, l.categorie, l.tentatives, l.issue]), [["lecture", 503, "http_5xx", 2, "echec"]]);
    // Le login aussi : deux tentatives au plus.
    const b = atmoScripte("2030-01-04", [erreur(500)], [indiceDu("2030-01-04")]);
    try {
      assert.equal((await routeAtmo("57463")).status, 502);
      assert.deepEqual(b.n, { login: 2, lecture: 0 });
    } finally { b.fin(); }
    journalSain(a.lignes);
  } finally { a.fin(); }
});

test("C · robustesse 4 · 401 : le jeton est oublié, sans nouvelle tentative ; l'appel suivant se reconnecte", async () => {
  let n = 0;
  const a = atmoScripte("2030-01-05", [() => Response.json({ token: `${SECRETS.jeton}-${++n}` })], [erreur(401), indiceDu("2030-01-05")]);
  try {
    assert.equal((await routeAtmo("57463")).status, 502);
    assert.deepEqual(a.n, { login: 1, lecture: 1 }, "aucune nouvelle tentative sur 401");
    assert.equal((await routeAtmo("57463")).status, 200);
    assert.equal(a.n.login, 2, "reconnexion à l'appel suivant, pas une heure plus tard");
    assert.notEqual(a.jetons[0], a.jetons[1]);
    assert.deepEqual(a.journal().map((l) => [l.etape, l.statut, l.categorie, l.tentatives, l.issue]), [["lecture", 401, "http_401", 1, "echec"]]);
    journalSain(a.lignes);
  } finally { a.fin(); }
});

test("C · robustesse 4 bis · un 401 tardif n'efface pas un jeton plus récent obtenu entre-temps", async () => {
  let n = 0;
  let refuser!: () => void;
  const a = atmoScripte("2030-01-06", [() => Response.json({ token: `${SECRETS.jeton}-${++n}` })], [
    () => new Promise<Response>((res) => { refuser = () => res(new Response("", { status: 401 })); }),
    indiceDu("2030-01-06"),
  ]);
  try {
    const lente = routeAtmo("57463"); // jeton 1, réponse 401 retenue
    while (!refuser) await new Promise((r) => setImmediate(r));
    mock.timers.tick(2 * 3600_000); // le jeton 1 expire : la commune suivante se reconnecte (jeton 2)
    assert.equal((await routeAtmo("57227")).status, 200);
    assert.equal(a.n.login, 2);
    refuser();
    assert.equal((await lente).status, 502);
    assert.equal((await routeAtmo("57230")).status, 200);
    assert.equal(a.n.login, 2, "le jeton 2 a survécu au 401 du jeton 1");
    assert.equal(a.jetons.at(-1), `Bearer ${SECRETS.jeton}-2`);
  } finally { a.fin(); }
});

test("C · robustesse 5 · 429 : aucune nouvelle tentative, au login comme à la lecture", async () => {
  const a = atmoScripte("2030-01-07", [jetonOk()], [erreur(429)]);
  try {
    assert.equal((await routeAtmo("57463")).status, 502);
    assert.deepEqual(a.n, { login: 1, lecture: 1 });
    assert.deepEqual(a.journal().map((l) => [l.etape, l.statut, l.categorie, l.tentatives]), [["lecture", 429, "http_429", 1]]);
    journalSain(a.lignes);
  } finally { a.fin(); }
  const b = atmoScripte("2030-01-08", [erreur(429)], [indiceDu("2030-01-08")]);
  try {
    assert.equal((await routeAtmo("57463")).status, 502);
    assert.deepEqual(b.n, { login: 1, lecture: 0 });
  } finally { b.fin(); }
});

test("C · robustesse 6 · timeout de 8 s : 502, aucune nouvelle tentative", async () => {
  const a = atmoScripte("2030-01-09", [jetonOk()], [() => "muet"]);
  try {
    const t0 = performance.now();
    assert.equal((await routeAtmo("57463")).status, 502);
    const ms = performance.now() - t0;
    assert.ok(ms >= 7900 && ms < 9000, `abandon à ${Math.round(ms)} ms`);
    assert.deepEqual(a.n, { login: 1, lecture: 1 });
    assert.deepEqual(a.journal().map((l) => [l.etape, l.statut, l.categorie, l.tentatives]), [["lecture", null, "timeout", 1]]);
    journalSain(a.lignes);
  } finally { a.fin(); }
});

test("C · robustesse 7 · JSON inattendu (200) : indisponible, aucune nouvelle tentative, étape « validation »", async () => {
  const a = atmoScripte("2030-01-10", [jetonOk()], [() => Response.json({ error: "x" })]);
  try {
    assert.equal((await routeAtmo("57463")).status, 502);
    assert.deepEqual(a.n, { login: 1, lecture: 1 });
    assert.deepEqual(a.journal().map((l) => [l.etape, l.categorie, l.issue]), [["validation", "forme_inattendue", "echec"]]);
    journalSain(a.lignes);
  } finally { a.fin(); }
  // Un login 200 sans jeton, ou illisible : réponse inattendue du login, sans nouvelle tentative.
  const b = atmoScripte("2030-01-11", [() => Response.json({ ok: true })], [indiceDu("2030-01-11")]);
  try {
    assert.equal((await routeAtmo("57463")).status, 502);
    assert.deepEqual(b.n, { login: 1, lecture: 0 });
    assert.deepEqual(b.journal().map((l) => [l.etape, l.categorie]), [["login", "forme_inattendue"]]);
  } finally { b.fin(); }
});

test("C · robustesse 8 · demandes simultanées : un seul appel partagé, nouvelle tentative comprise, une seule trace", async () => {
  const a = atmoScripte("2030-01-12", [jetonOk()], [erreur(500), indiceDu("2030-01-12")]);
  try {
    const [x, y] = await Promise.all([ATMO.lireAtmoCommune("57463"), ATMO.lireAtmoCommune("57463")]);
    assert.equal(x.etat, "disponible");
    assert.deepEqual(x, y);
    assert.deepEqual(a.n, { login: 1, lecture: 2 });
    assert.equal(a.lignes.length, 1);
    // Échec définitif partagé : une seule ligne pour deux demandes.
    const b = atmoScripte("2030-01-13", [jetonOk()], [erreur(500)]);
    try {
      const [p, q] = await Promise.all([ATMO.lireAtmoCommune("57463"), ATMO.lireAtmoCommune("57463")]);
      assert.deepEqual([p.etat, q.etat], ["indisponible", "indisponible"]);
      assert.equal(b.lignes.length, 1);
    } finally { b.fin(); }
  } finally { a.fin(); }
});

test("C · robustesse 9 · après un échec, une nouvelle recherche réussit et ne sert rien de périmé", async () => {
  const a = atmoScripte("2030-01-14", [jetonOk()], [erreur(500), erreur(500), indiceDu("2030-01-14")]);
  try {
    assert.equal((await routeAtmo("57463")).status, 502);
    const r = await json(await routeAtmo("57463"));
    assert.equal(r.status, 200);
    assert.equal(r.corps.date, "2030-01-14");
    assert.deepEqual(a.n, { login: 1, lecture: 3 });
    // `getAtmoForCommune` (page chaleur, aperçu de l'accueil) : même transport, toujours `null` sur panne.
    const b = atmoScripte("2030-01-15", [jetonOk()], [erreur(500)]);
    try { assert.equal(await ATMO.getAtmoForCommune("57463"), null); } finally { b.fin(); }
    journalSain(a.lignes);
  } finally { a.fin(); }
});

test("C · robustesse · une étape réussie du premier coup n'écrit rien au journal", async () => {
  const a = atmoScripte("2030-01-16", [jetonOk()], [indiceDu("2030-01-16")]);
  try {
    assert.equal((await routeAtmo("57463")).status, 200);
    assert.equal(a.lignes.length, 0);
  } finally { a.fin(); }
});
