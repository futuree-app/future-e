// FUT-167 (D2) · LES RISQUES INDUSTRIELS À L'ADRESSE : la réponse à « le logement est-il dans un périmètre de
// PPRT ? », les sites Seveso autour, et ce qui n'est jamais déduit (une absence d'une panne, un plan d'un site proche).
//
// Les réponses Géorisques sont réelles (__fixtures__/fut167, relevées le 30/10/2026) : 1 avenue Albert Ramboz à
// Feyzin (zone « 1 » du PPRT « Vallée de la chimie »), rue de la République à Lyon (aucun zonage au point), les
// plans de Lyon et de La Rochelle.
import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import {
  lirePagePprt, reponsePprt, texteIndustrieAdresse, precisionDuPoint, PHRASES_INTERDITES,
  type LectureIndustrieAdresse, type SiteSevesoAdresse,
} from "./industrie-adresse.ts";
import { sourcesAbsentes } from "./logement-report-version.ts";

const fx = (n: string) => JSON.parse(readFileSync(new URL(`./__fixtures__/fut167/${n}.json`, import.meta.url), "utf8"));
const FEYZIN_POINT = lirePagePprt(fx("pprt-point-feyzin-ramboz"))!;
const LYON_POINT = lirePagePprt(fx("pprt-point-lyon-republique"))!;
const LYON_COMMUNE = lirePagePprt(fx("pprt-commune-lyon"))!;
const LR_COMMUNE = lirePagePprt(fx("pprt-commune-la-rochelle"))!;
const COLLECTE = "2026-10-30T16:00:00.000Z";

const site = (nom: string, seuil: "seveso_haut" | "seveso_bas", d: number, o: Partial<SiteSevesoAdresse> = {}): SiteSevesoAdresse =>
  ({ code: nom.replace(/\W/g, "").slice(0, 10), nom, seuil, etat: "En exploitation avec titre", commune: "Feyzin", distanceKm: d, approchee: false, decimales: 6, ...o });
const SITES = [site("TERENVIE", "seveso_bas", 0.04), site("TotalEnergies Raffinage France", "seveso_haut", 0.73)];

const lecture = (o: Partial<LectureIndustrieAdresse> = {}): LectureIndustrieAdresse => ({
  precision: "numero",
  seveso: { etat: "lu", extraitLe: "2026-10-30T16:04:42.739Z", rayonKm: 8, sites: SITES },
  pprtPoint: { etat: "lu", plans: FEYZIN_POINT.plans },
  pprtCommune: { etat: "lu", plans: LYON_COMMUNE.plans.map((p) => ({ id: p.id, nom: p.nom })) },
  ...o,
});
const tout = (t: ReturnType<typeof texteIndustrieAdresse>) =>
  [t.question, t.constat, ...t.pourCeBien, t.sites.titre, t.sites.vide ?? "", t.sites.reste ?? "", ...t.sites.lignes.map((l) => l.texte), ...t.limites, ...t.verifier, t.marge.valeur].join("\n");

// ── Les réponses Géorisques réelles ────────────────────────────────────────────────────────────

test("lecture des pages GASPAR : le plan, sa servitude, sa zone et son régime tels que publiés", () => {
  assert.equal(FEYZIN_POINT.complete, true);
  assert.equal(FEYZIN_POINT.plans.length, 1);
  const p = FEYZIN_POINT.plans[0]!;
  assert.equal(p.id, "69DDT20200002");
  assert.equal(p.nom, "Vallée de la chimie");
  assert.equal(p.servitude, true);
  assert.equal(p.ficheMajLe, "2025-04-10"); // la fiche, jamais l'approbation
  assert.deepEqual(p.zones[0], { regimeCode: "02", regime: "Prescriptions", code: "1", nom: "Réglementation s'appliquant aux logements existants en octobre 2016 : Prescriptions de renforcement du bâti" });
  assert.deepEqual(LYON_POINT.plans, []);
  assert.equal(LR_COMMUNE.plans.length, 4);
  assert.equal(lirePagePprt({ message: "erreur" }), null);
  assert.equal(lirePagePprt(null), null);
  assert.equal(lirePagePprt({ totalElements: 3, content: [{ idGaspar: "A" }] })!.complete, false);
});

// ── Les cinq réponses, jamais fondues ──────────────────────────────────────────────────────────

test("Feyzin : « Oui », la zone et son régime publiés, et ce qui reste au règlement", () => {
  const t = texteIndustrieAdresse(lecture(), COLLECTE);
  assert.equal(t.reponse, "dans_un_plan");
  assert.equal(t.question, "Le logement est-il dans le périmètre d'un plan de prévention des risques technologiques ?");
  assert.equal(t.constat, "Oui. Le point de cette adresse est dans le périmètre réglementé du plan « Vallée de la chimie » (base GASPAR, consultée le 30/10/2026).");
  assert.equal(t.pourCeBien[0], "Au point de l'adresse, la base publie cette zone : zone « 1 » (prescriptions) : « Réglementation s'appliquant aux logements existants en octobre 2016 : Prescriptions de renforcement du bâti ».");
  assert.match(t.pourCeBien[1]!, /règlement du plan\. La base nationale ne le publie pas : il est annexé à l'état des risques/);
  assert.equal(t.marge.valeur, "Dans un plan de prévention");
  assert.ok(t.verifier.some((v) => /travaux prescrits par le plan ont été réalisés/.test(v)));
});

test("un point géocodé à la rue : la zone exacte du logement est dite à vérifier", () => {
  const t = texteIndustrieAdresse(lecture({ precision: "rue" }), COLLECTE);
  assert.ok(t.pourCeBien.some((p) => /Le point géocodé n'est pas celui du bâtiment : la zone exacte du logement se vérifie sur le plan de zonage\./.test(p)));
});

test("Lyon, rue de la République : un plan sur la commune, aucun zonage au point", () => {
  const t = texteIndustrieAdresse(lecture({ pprtPoint: { etat: "lu", plans: LYON_POINT.plans } }), COLLECTE);
  assert.equal(t.reponse, "plan_sur_la_commune");
  assert.equal(t.constat, "Non, d'après la base consultée le 30/10/2026 : la commune est concernée par un plan (« Vallée de la chimie »), mais le point de cette adresse n'est dans aucune zone réglementée publiée.");
  assert.equal(t.marge.valeur, "Hors périmètre réglementé");
});

test("aucun plan, requêtes complètes : « Non », sans rassurer sur le risque", () => {
  const t = texteIndustrieAdresse(lecture({ pprtPoint: { etat: "lu", plans: [] }, pprtCommune: { etat: "lu", plans: [] } }), COLLECTE);
  assert.equal(t.reponse, "aucun_plan");
  assert.match(t.constat, /^Non\. Aucun plan de prévention des risques technologiques n'est recensé sur la commune ni au point de cette adresse/);
  // Des sites Seveso existent : l'absence de plan n'est pas une absence de risque, et la limite le dit.
  assert.ok(t.limites.some((l) => /L'absence de plan au point ne dit pas l'absence de risque/.test(l)));
});

test("la liste communale en panne : le point est dit, la commune reste ouverte", () => {
  const t = texteIndustrieAdresse(lecture({ pprtPoint: { etat: "lu", plans: [] }, pprtCommune: { etat: "indisponible" } }), COLLECTE);
  assert.equal(t.reponse, "incomplet");
  assert.match(t.constat, /n'est dans aucune zone réglementée publiée .* La liste des plans de la commune n'a pas pu être lue/);
});

test("la lecture au point en panne : non déterminable, jamais « non »", () => {
  const t = texteIndustrieAdresse(lecture({ pprtPoint: { etat: "indisponible" }, pprtCommune: { etat: "lu", plans: LR_COMMUNE.plans } }), COLLECTE);
  assert.equal(t.reponse, "non_determinable");
  assert.match(t.constat, /^Non déterminable : la base des plans n'a pas répondu le 30\/10\/2026\. Rien n'en est déduit/);
  assert.doesNotMatch(t.constat, /^Non\./);
  assert.match(t.pourCeBien[0]!, /le plan « PPRT GRATECAP »/);
  assert.equal(t.marge.valeur, "Non déterminable");
});

test("un site proche n'implique pas un plan : la limite le dit dans tous les cas", () => {
  for (const pprtPoint of [{ etat: "lu" as const, plans: [] }, { etat: "lu" as const, plans: FEYZIN_POINT.plans }]) {
    const t = texteIndustrieAdresse(lecture({ pprtPoint }), COLLECTE);
    assert.match(t.limites[0]!, /Elles ne mesurent aucune exposition, et un site proche n'implique pas qu'un plan s'applique au logement\./);
  }
});

// ── Les sites Seveso ───────────────────────────────────────────────────────────────────────────

test("sites Seveso : nom, seuil, état, distance à vol d'oiseau, lien vers la fiche ; un particulier n'est pas nommé", () => {
  const sites = [
    site("TERENVIE", "seveso_bas", 0.04), site("Monsieur Jean DUPONT", "seveso_bas", 1.5), site("Ancien dépôt", "seveso_haut", 2.2, { etat: "En fin d'exploitation" }),
    site("Arrondi", "seveso_bas", 3, { decimales: 3 }), site("Sans position", "seveso_bas", 4, { approchee: true, decimales: 0 }),
    ...Array.from({ length: 4 }, (_, k) => site(`Lointain ${k}`, "seveso_bas", 6 + k)),
  ];
  const t = texteIndustrieAdresse(lecture({ seveso: { etat: "lu", extraitLe: "2026-10-30T16:04:42.739Z", rayonKm: 8, sites } }), COLLECTE);
  const l = t.sites.lignes.map((x) => x.texte);
  assert.equal(l[0], "TERENVIE : Seveso seuil bas, à 40 mètres à vol d'oiseau");
  assert.equal(l[1], "Exploitation au nom d'un particulier : Seveso seuil bas, à 1,5 km à vol d'oiseau");
  assert.equal(l[2], "Ancien dépôt : Seveso seuil haut, en fin d'exploitation, à 2,2 km à vol d'oiseau");
  assert.equal(l[3], "Arrondi : Seveso seuil bas, à 3 km à vol d'oiseau (position publiée arrondie à une centaine de mètres)");
  assert.equal(l[4], "Sans position : Seveso seuil bas, à environ 4 km à vol d'oiseau (position approchée : la fiche ne publie pas de position exploitable)");
  assert.equal(t.sites.lignes.length, 6);
  assert.equal(t.sites.reste, "Et 3 autres, plus éloignés.");
  assert.match(t.sites.lignes[0]!.href, /^https:\/\/www\.georisques\.gouv\.fr\/risques\/installations\/donnees\/details\//);
  assert.doesNotMatch(tout(t), /DUPONT/);
});

test("sites Seveso : aucun dans le rayon, avec la date d'extraction ; index illisible, jamais une absence", () => {
  const vide = texteIndustrieAdresse(lecture({ seveso: { etat: "lu", extraitLe: "2026-10-30T16:04:42.739Z", rayonKm: 8, sites: [] } }), COLLECTE);
  assert.equal(vide.sites.vide, "Aucun site classé Seveso n'est recensé à moins de 8 km de l'adresse (installations classées, extraction Géorisques du 30/10/2026).");
  const panne = texteIndustrieAdresse(lecture({ seveso: { etat: "indisponible" } }), COLLECTE);
  assert.equal(panne.sites.vide, "La liste des sites Seveso n'a pas pu être lue. Aucune absence n'en est déduite.");
});

test("aucune phrase interdite, dans aucun état (sans danger, à l'abri, logement exposé, tiret cadratin…)", () => {
  const etats: Partial<LectureIndustrieAdresse>[] = [
    {}, { precision: "rue" }, { pprtPoint: { etat: "lu", plans: [] } }, { pprtPoint: { etat: "lu", plans: [] }, pprtCommune: { etat: "lu", plans: [] } },
    { pprtPoint: { etat: "indisponible" } }, { pprtCommune: { etat: "indisponible" }, pprtPoint: { etat: "lu", plans: [] } }, { seveso: { etat: "indisponible" } },
  ];
  for (const e of etats) for (const date of [COLLECTE, null]) {
    const texte = tout(texteIndustrieAdresse(lecture(e), date));
    assert.doesNotMatch(texte, PHRASES_INTERDITES, texte.match(PHRASES_INTERDITES)?.[0]);
  }
  assert.match(texteIndustrieAdresse(lecture(), null).constat, /consultée lors de la collecte de ce rapport/);
});

test("précision du point : seul un numéro situe le bâtiment", () => {
  assert.equal(precisionDuPoint("housenumber"), "numero");
  assert.equal(precisionDuPoint("street"), "rue");
  assert.equal(precisionDuPoint("municipality"), "commune");
  assert.equal(precisionDuPoint(null), "inconnue");
});

// ── La version du rapport ──────────────────────────────────────────────────────────────────────

test("une lecture en panne est nommée parmi les sources absentes ; un rapport antérieur n'en nomme aucune", () => {
  const base = { address: {}, parcel: {}, altitude: 1, zfe: {}, cartofriches: {}, communeData: {}, sinistralite: {}, georisques: { commune: {}, address: {} }, heritage: { sourceStatus: "ok" } } as never;
  assert.deepEqual(sourcesAbsentes(base).filter((s) => /seveso|pprt/.test(s)), []);
  const panne = { ...(base as object), industrieAdresse: lecture({ seveso: { etat: "indisponible" }, pprtPoint: { etat: "indisponible" }, pprtCommune: { etat: "indisponible" } }) } as never;
  assert.deepEqual(sourcesAbsentes(panne).filter((s) => /seveso|pprt/.test(s)), ["industrie_seveso", "pprt_point", "pprt_commune"]);
  // Aucune horodate dans la lecture : l'empreinte d'un rapport ne change pas d'une actualisation identique à l'autre.
  assert.equal(JSON.stringify(lecture()).includes("consulte"), false);
});

// ── La collecte (fetch doublé) ─────────────────────────────────────────────────────────────────

const racine = pathToFileURL(`${process.cwd()}/`).href;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SRV: any;
before(async () => {
  register(`data:text/javascript,${encodeURIComponent(`
async function premier(c, ctx, next) { for (const x of c.slice(0, -1)) { try { return await next(x, ctx); } catch {} } return next(c[c.length - 1], ctx); }
export async function resolve(s, ctx, next) {
  if (s === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (s.startsWith("@/")) { const b = ${JSON.stringify(racine)} + "src/" + s.slice(2); return premier([b + ".ts", b + ".tsx", b], ctx, next); }
  return next(s, ctx);
}`)}`);
  SRV = await import(`${racine}src/lib/server/industrie-adresse.ts`);
});
const fetchReel = globalThis.fetch;
const jetonReel = process.env.GEORISQUES_API_TOKEN;
beforeEach(() => { globalThis.fetch = fetchReel; process.env.GEORISQUES_API_TOKEN = "jeton-test"; });

function doubler(repondre: (u: URL, n: number) => Response) {
  const vus: URL[] = [];
  globalThis.fetch = (async (input: string | URL) => { const u = new URL(String(input)); vus.push(u); return repondre(u, vus.filter((v) => v.pathname === u.pathname).length); }) as typeof fetch;
  return vus;
}

test("collecte : PPRT au point (v2, avec jeton) et de la COMMUNE PARENTE pour un arrondissement (v1)", async () => {
  const vus = doubler((u) => Response.json(u.pathname.startsWith("/api/v2") ? fx("pprt-point-feyzin-ramboz") : fx("pprt-commune-lyon")));
  const l = await SRV.getIndustrieAdresse({ lat: 45.68035, lon: 4.84605, citycode: "69387", precision: "numero" });
  const v1 = vus.find((u) => u.pathname === "/api/v1/gaspar/pprt")!;
  assert.equal(v1.searchParams.get("codeInsee"), "69123"); // Lyon : le code de la ville, vérifié le 30/10/2026
  const v2 = vus.find((u) => u.pathname === "/api/v2/gaspar/pprt")!;
  assert.equal(v2.searchParams.get("latitude"), "45.68035");
  assert.equal(reponsePprt(l), "dans_un_plan");
  assert.equal(l.seveso.etat, "lu"); // l'index local, sans réseau
});

test("collecte : une coupure est reprise une fois ; deux coupures font « non déterminable », jamais « aucun plan »", async () => {
  doubler((u, n) => (u.pathname.startsWith("/api/v2") && n === 1 ? new Response("reset", { status: 503 }) : Response.json(u.pathname.startsWith("/api/v2") ? fx("pprt-point-lyon-republique") : fx("pprt-commune-lyon"))));
  assert.equal(reponsePprt(await SRV.getIndustrieAdresse({ lat: 45.76, lon: 4.83, citycode: "69382", precision: "rue" })), "plan_sur_la_commune");
  doubler((u) => (u.pathname.startsWith("/api/v2") ? new Response("panne", { status: 503 }) : Response.json(fx("pprt-commune-lyon"))));
  assert.equal(reponsePprt(await SRV.getIndustrieAdresse({ lat: 45.76, lon: 4.83, citycode: "69382", precision: "rue" })), "non_determinable");
});

test("collecte : sans jeton Géorisques, la lecture au point est indisponible, jamais vide", async () => {
  delete process.env.GEORISQUES_API_TOKEN;
  doubler(() => Response.json(fx("pprt-commune-lyon")));
  const l = await SRV.getIndustrieAdresse({ lat: 45.76, lon: 4.83, citycode: "69123", precision: "numero" });
  assert.equal(l.pprtPoint.etat, "indisponible");
  process.env.GEORISQUES_API_TOKEN = jetonReel;
});

test("la route Logement collecte cette lecture et l'écran la pose à côté des risques au point", () => {
  const route = readFileSync("src/app/api/georisques-logement/route.ts", "utf8");
  assert.match(route, /const industrieAdresseP = getIndustrieAdresse\(\{/);
  assert.match(route, /industrieAdresse,\n/);
  const ecran = readFileSync("src/components/report/LogementModule.tsx", "utf8");
  assert.match(ecran, /<IndustrieAdresseSection lecture=\{result\.industrieAdresse\} collecteeLe=\{result\.version\?\.collecteeLe \?\? null\} \/>\n\n\s+\{result\.georisques && \(/);
});
