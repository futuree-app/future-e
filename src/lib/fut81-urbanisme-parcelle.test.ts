import { test, before } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import {
  lireUrbanisme, reglementDeZone, approbationDepuisNom, urbanismeIndisponible, couvre, categorieDe, vigueurDe,
  CATEGORIES, NOTE_NEUTRE, PART_MIN, SURFACE_MIN_M2, type EntreeUrbanisme, type GpuFeature, type UrbanismeParcelle,
} from "./urbanisme-parcelle.ts";
import { aireIntersection, aireRegion, projectionAutour, regionDe } from "./geometrie-parcelle.ts";
import {
  sourcesAbsentes, consulterOuActualiser, issueActualisation, jsonCanonique, pertesUrbanisme, type VersionLogement,
} from "./logement-report-version.ts";
import type { LogementReport } from "./logement-report-types.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-81 (26/10/2026) : LE PLAN D'URBANISME DE LA PARCELLE, LU SANS DÉPASSER LA PREUVE.
//
// Revue indépendante du 27/10/2026 (`992af92f`, NO GO) : cinq blocages reproduits, chacun rejoué ici sur
// ses entrées exactes (section 5), avec la sortie métier ET le texte affiché.
//
// Les cas réels viennent des réponses BRUTES du cadastre et du Géoportail de l'urbanisme relevées le
// 26/10/2026 (`__fixtures__/fut81/`, cf. `scripts/research/fut81-capture-fixtures.mjs`), passées par
// la fonction de production `lireUrbanisme`, puis par le composant de production. Aucun réseau.
//
// « Le bloc apparaît » et « le bloc dit vrai » sont deux assertions distinctes (AGENTS.md) : la seconde
// est faite sur le TEXTE rendu, et elle cherche aussi ce qu'il ne doit jamais dire.
// ════════════════════════════════════════════════════════════════════════════════════════════

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
let rendreBloc: (props: unknown) => string;
let rendreSection: (props: unknown) => string;
let fetchUrbanismeParcelle: (lat: number, lon: number, p: unknown) => Promise<UrbanismeParcelle>;

before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { createElement } = await import("react");
  const { UrbanismeBlock } = await import("../components/report/logement/UrbanismeBlock.tsx");
  const { RegulatoryStatusBlock } = await import("../components/report/logement/RegulatorySection.tsx");
  rendreBloc = (p) => renderToStaticMarkup(createElement(UrbanismeBlock, p as never));
  rendreSection = (p) => renderToStaticMarkup(createElement(RegulatoryStatusBlock, p as never));
  ({ fetchUrbanismeParcelle } = await import("./gpu.ts") as never);
});

/** Le texte que lit le lecteur : balises retirées, entités décodées, espaces insécables normalisées. */
function texte(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&apos;/g, "'").replace(/&quot;/g, "\"").replace(/&amp;/g, "&").replace(/&nbsp;| /g, " ")
    .replace(/’/g, "'").replace(/\s+/g, " ").trim();
}

// ── Les relevés réels, passés par la fonction de production ───────────────────────────────────
const CAS = [
  "lyon-croix-rousse", "six-fours-emplacement-reserve", "merignac-deux-zones", "moissy-zone-unique",
  "la-rochelle-psmv", "vauquois-carte-communale", "chatelard-rnu", "grandvals-sans-document",
  "besancon-psmv-non-protege", "sucy-trois-zones",
] as const;
type Cas = (typeof CAS)[number];
const fixture = (c: Cas): M => JSON.parse(readFileSync(`src/lib/__fixtures__/fut81/${c}.json`, "utf8"));
function entree(c: Cas): EntreeUrbanisme {
  const x = fixture(c);
  return {
    point: [x.ban.lon, x.ban.lat],
    parcelle: x.parcelle
      ? { geometry: x.parcelle.geometry, contenance: x.parcelle.properties.contenance ?? null, rattachement: x.parcelle.rattachement, distanceM: x.parcelle.distanceM ?? null }
      : null,
    municipality: x.municipality.features, documents: x.document.features, zones: x.zone.features, secteurs: x.secteur.features,
    prescriptions: { surface: x.prescriptionSurf.features, ligne: x.prescriptionLin.features, point: x.prescriptionPct.features },
    details: x.details, fichiers: x.files,
  };
}
const lire = (c: Cas) => lireUrbanisme(entree(c));
const rendu = (u: UrbanismeParcelle | undefined, o: { parcelCode?: string | null } = {}) =>
  texte(rendreBloc({ urbanisme: u, parcelCode: o.parcelCode ?? "PARCELLE-X", withDivider: false }));
/** Ce que le lecteur voit sans rien déplier : tout ce qui précède « Comprendre cette lecture ». */
const visible = (u: UrbanismeParcelle) => rendu(u).split("▸ Comprendre cette lecture")[0];

// ── Géométries synthétiques, en MÈTRES autour de 2° E / 46° N (repère de la revue du 27/10/2026) ─────
const xy = (x: number, y: number): [number, number] => [2 + x / (111_320 * Math.cos((46 * Math.PI) / 180)), 46 + y / 110_574];
const rect = (a: number, b: number, c: number, d: number) => ({ type: "Polygon", coordinates: [[xy(a, b), xy(c, b), xy(c, d), xy(a, d), xy(a, b)]] });
const PARCELLE = rect(0, 0, 100, 100); // 10 000 m²
const DOC = "0123456789abcdef0123456789abcdef";
const DOC2 = "fedcba9876543210fedcba9876543210";
const feat = (geometry: unknown, extra: M = {}): GpuFeature => ({ properties: { gpu_doc_id: DOC, ...extra }, geometry: geometry as never });
const zone = (libelle: string, geometry: unknown, extra: M = {}) => feat(geometry, { libelle, typezone: "U", nomfic: "X_reglement_20250101.pdf", ...extra });
const presc = (geometry: unknown, typepsc: string, stypepsc: string, libelle: string, extra: M = {}) => feat(geometry, { typepsc, stypepsc, libelle, ...extra });
const documentPlu = (id = DOC, type = "PLU", name = "12345_PLU_20250101"): GpuFeature => ({ properties: { gpu_doc_id: id, du_type: type, name } });
const DETAILS_OK = { effectiveStatus: "EN_VIGUEUR", legalStatus: "APPROVED", title: "Plan Local d'Urbanisme (PLU) TEST", publicationDate: "02/02/2025 10:00:00" };
const FICHIERS_OK = [{ name: "X_reglement_20250101.pdf", title: "Règlement écrit" }];
function synthetique(o: Partial<EntreeUrbanisme> = {}): EntreeUrbanisme {
  return {
    point: xy(50, 50),
    parcelle: { geometry: PARCELLE, contenance: 10_000, rattachement: "point" },
    municipality: [{ properties: { is_rnu: false } }],
    documents: [documentPlu()],
    zones: [zone("UA", rect(-500, -500, 500, 500))],
    secteurs: [],
    prescriptions: { surface: [], ligne: [], point: [] },
    details: { [DOC]: DETAILS_OK },
    fichiers: { [DOC]: FICHIERS_OK },
    ...o,
  };
}
const avecSurface = (...fs: GpuFeature[]) => synthetique({ prescriptions: { surface: fs, ligne: [], point: [] } });

// Ce que le texte ne doit JAMAIS affirmer : un droit, une autorisation, une constructibilité.
const ABUS = [
  /(?<!in)constructible/i, /droit à construire/i, /\bvous pouvez (construire|agrandir|étendre|bâtir)/i,
  /\b(est|sera|seront) autorisée?s?\b/i, /aucune (règle|contrainte)/i, /futur•e (vaut|est un) certificat/i,
];
function sansAbus(t: string, ou: string) {
  for (const r of ABUS) assert.doesNotMatch(t, r, `${ou} : « ${t.match(r)?.[0]} »`);
}

// ═══════════════════════════════════ 1. LES CAS RÉELS ══════════════════════════════════════════

test("Parcelle en zone unique (Moissy-Cramayel) : document en vigueur, zone, règlement du Géoportail, dates", () => {
  const u = lire("moissy-zone-unique");
  assert.deepEqual([u.statut, u.regime, u.grain, u.rattachement.mode], ["confirme", "document", "parcelle", "point"]);
  assert.deepEqual(u.zones.map((z) => [z.libelle, z.typezone, z.part]), [["UC", "U", 1]]);
  assert.equal(u.zones[0].reglement.statut, "publie");
  assert.match((u.zones[0].reglement as { url: string }).url, /^https:\/\/www\.geoportail-urbanisme\.gouv\.fr\/api\/document\/[0-9a-f]{32}\/files\/77296_reglement_20251215\.pdf$/);
  assert.deepEqual([u.documents[0].type, u.documents[0].vigueur, u.documents[0].approbation], ["PLU", "etablie", "2025-12-15"]);
  assert.match(visible(u), /Cette parcelle est en zone UC du plan local d'urbanisme \(PLU\)\./);
});

test("Parcelle partagée entre deux zones (Mérignac) : aires exactes, un seul règlement, emplacement réservé de voirie", () => {
  const u = lire("merignac-deux-zones");
  assert.deepEqual(u.zones.map((z) => [z.libelle, z.part]), [["US7", 0.617], ["US9", 0.383]]);
  const t = visible(u);
  assert.match(t, /partagée entre 2 zones du plan local d'urbanisme intercommunal \(PLUi\) : US7 \(environ 62 %\), US9 \(environ 38 %\)\./);
  assert.equal(t.match(/Lire le règlement/g)?.length, 1, "un même fichier : un seul lien");
  assert.match(t, /Lire le règlement des zones US7, US9/);
  const er = u.prescriptions.find((p) => p.categorie === "05-01")!;
  assert.deepEqual([er.code, er.sousCode, er.etendue, er.surfaceM2], ["05", "01", "couvre", 70.5]);
  assert.match(t, /Emplacement réservé à une voie publique · sur environ 1 % de la parcelle \(≈ 71 m²\)/);
  assert.match(t, /Patrimoine paysager protégé · sur environ 35 m² de la parcelle/);
  assert.match(t, /D'autres prescriptions s'appliquent aussi sur la parcelle \(conditions de desserte, stationnement\)/);
  assert.doesNotMatch(t, /autre prescription/, "le code 99 se compte, il ne se nomme pas");
});

test("Trois zones réelles dont une secondaire de 2,3 % (Sucy-en-Brie), et un liseré de 39 m² dit comme bordure", () => {
  const u = lire("sucy-trois-zones");
  assert.deepEqual(u.zones.map((z) => [z.libelle, z.part]), [["UILO1O1O1O1O", 0.531], ["UIO1O1O1O1OO", 0.446], ["UIO2O1O1O2OO", 0.023]]);
  assert.deepEqual(u.zonesEnLimite, [{ libelle: "UILC2C2C3C4C", surfaceM2: 39 }]);
  const t = visible(u);
  assert.match(t, /partagée entre 3 zones/);
  assert.match(t, /La zone UILC2C2C3C4C recoupe aussi la parcelle, sur environ 39 m², le long de sa limite\. Un liseré aussi mince vient le plus souvent d'un écart de tracé/);
});

test("Zone voisine qui touche la limite : écartée, citée dans la méthode (Lyon, Six-Fours)", () => {
  const lyon = lire("lyon-croix-rousse");
  assert.deepEqual(lyon.zones.map((z) => z.libelle), ["UCe1a"]);
  assert.deepEqual(lyon.zonesEnLimite, [{ libelle: "UCe3-p", surfaceM2: 0.1 }]);
  assert.deepEqual(lire("six-fours-emplacement-reserve").zonesEnLimite, [{ libelle: "UF", surfaceM2: 0.2 }]);
  const t = rendu(lyon);
  assert.match(t, /Cette parcelle est en zone UCe1a du plan local d'urbanisme intercommunal \(PLUi\)\./);
  assert.match(t, /La zone UCe3-p touche la limite de la parcelle sans la couvrir de façon significative/);
  assert.doesNotMatch(visible(lyon), /UCe3-p/, "un simple contact ne monte pas à l'écran");
});

test("Prescription applicable (Six-Fours) : emplacement réservé de 516 m², et l'alignement protégé qui traverse", () => {
  const u = lire("six-fours-emplacement-reserve");
  const er = u.prescriptions.find((p) => p.code === "05")!;
  assert.deepEqual([er.categorie, er.etendue, er.part, er.surfaceM2], ["05-00", "couvre", 0.138, 515.8]);
  const t = visible(u);
  assert.match(t, /Emplacement réservé · sur environ 14 % de la parcelle \(≈ 516 m²\)/);
  assert.match(t, /Demandez en mairie son objet et son bénéficiaire/);
  assert.match(t, /Patrimoine bâti, paysager|Élément de patrimoine ou de paysage protégé · traverse la parcelle sur environ 26 m/);
});

test("Une prescription qui ne fait que border la parcelle concerne le voisin : comptée, jamais attribuée (Lyon)", () => {
  const u = lire("lyon-croix-rousse");
  const brut = entree("lyon-croix-rousse").prescriptions.surface!.map((f) => String(f.properties?.libelle));
  assert.ok(brut.includes("Element Bati a preserver-13"), "le GPU la rend bien pour cette parcelle");
  assert.ok(!u.prescriptions.some((p) => p.libelle === "Element Bati a preserver-13"));
  assert.equal(u.prescriptionsContact, 2);
  assert.deepEqual(u.prescriptions.map((p) => p.categorie).sort(), ["02-00", "07-02"]);
  assert.match(rendu(u), /2 prescriptions touchent la limite de la parcelle sans la recouvrir : elles peuvent concerner le voisin/);
});

test("Carte communale (Vauquois) : le secteur, sans règlement propre, et le repli dit avant tout", () => {
  const u = lire("vauquois-carte-communale");
  assert.deepEqual(u.secteurs.map((s) => [s.libelle, s.typesect]), [["C", "01"]]);
  assert.deepEqual([u.statut, u.ambiguites], ["ambigu", ["parcelle_incertaine"]]);
  const t = visible(u);
  assert.ok(t.indexOf("ne tombe dans aucune parcelle") < t.indexOf("secteur ouvert à la construction"), "la réserve précède le secteur");
  assert.match(t, /La parcelle retenue est dans un secteur ouvert à la construction de la carte communale \(secteur « C »\)/);
  assert.match(t, /n'a pas de règlement propre/);
  sansAbus(t, "carte communale");
});

test("RNU (Châtelard) et absence de document (Grandvals) : affirmés comme tels, jamais « aucune règle »", () => {
  const rnu = lire("chatelard-rnu");
  assert.deepEqual([rnu.statut, rnu.regime, rnu.communeRnu], ["confirme", "rnu", true]);
  assert.match(rendu(rnu), /le règlement national d'urbanisme s'applique/);
  const sans = lire("grandvals-sans-document");
  assert.deepEqual([sans.statut, sans.regime, sans.communeRnu], ["non_trouve", "inconnu", false]);
  assert.match(rendu(sans), /elle n'y est pas recensée au règlement national d'urbanisme\. Des règles s'appliquent pourtant/);
  const muet = lireUrbanisme({ ...entree("grandvals-sans-document"), municipality: null });
  assert.equal(muet.communeRnu, null);
  assert.doesNotMatch(rendu(muet), /pas recensée/, "sans réponse sur le régime, on ne le prétend pas");
  sansAbus(rendu(rnu), "RNU");
  sansAbus(rendu(sans), "sans document");
});

test("Règlement : celui de la zone, jamais le règlement général (La Rochelle, secteur sauvegardé)", () => {
  const u = lire("la-rochelle-psmv");
  assert.deepEqual(u.zones.map((z) => z.libelle), ["PSMV"]);
  assert.deepEqual(u.zones[0].reglement, { statut: "non_publie" });
  assert.ok(fixture("la-rochelle-psmv").files[u.documents[0].id].some((f: M) => f.title === "Règlement écrit"), "le règlement du PLUi existe, et n'est pas pris");
  const t = visible(u);
  assert.match(t, /Le règlement de la zone PSMV n'est pas publié avec le document au Géoportail : demandez-le au service urbanisme/);
  assert.doesNotMatch(t, /Lire le règlement/);
});

test("Plan de sauvegarde (Besançon) : zones superposées, parties protégées et non protégées distinguées", () => {
  const u = lire("besancon-psmv-non-protege");
  assert.deepEqual(u.zones.map((z) => [z.libelle, z.part]), [["PSMV-CA-SSR1", 1], ["SPR CA", 1]]);
  const parCategorie = Object.fromEntries(u.prescriptions.map((p) => [p.categorie, p]));
  assert.equal(parCategorie["07-67"].libelle, "Immeuble non protégé pouvant être conservé, amélioré ou remplacé");
  assert.equal(parCategorie["07-67"].documentType, "PSMV");
  assert.ok(parCategorie["07-50"], "la partie réellement protégée reste nommée");
  const t = visible(u);
  assert.match(t, /couverte par 2 zones superposées du plan de sauvegarde et de mise en valeur \(PSMV\)/);
  assert.doesNotMatch(t, /partagée entre/);
  assert.match(t, /Immeuble bâti non protégé, soumis à des dispositions particulières · sur environ 11 % de la parcelle/);
  assert.match(t, /Le plan de sauvegarde identifie cet élément sans le protéger/);
  assert.match(t, /Immeuble protégé en totalité, intérieurs et extérieurs · sur environ 35 % de la parcelle/);
});

// ═══════════════════════════════════ 2. LES CINQ BLOCAGES DE LA REVUE DU 27/10/2026 ═════════════
// Entrées exactes de `audit-fut81-repro.mjs` (Work) : parcelle de 100 × 100 m autour de 2° E / 46° N.

test("Blocage 1 — Bandes étroites : 50 et 30 m² retenus avec leur aire exacte (la grille rendait 0)", () => {
  for (const [largeur, aire] of [[0.5, 50], [0.3, 30]] as const) {
    const u = lireUrbanisme(avecSurface(presc(rect(1, 0, 1 + largeur, 100), "05", "01", `Bande ${aire} m²`)));
    assert.equal(u.prescriptions.length, 1, `${aire} m² : la prescription est là`);
    const p = u.prescriptions[0];
    assert.equal(p.etendue, "couvre");
    assert.ok(Math.abs(p.surfaceM2! - aire) < 0.5, `${aire} m² mesurés ${p.surfaceM2}`);
    assert.match(visible(u), new RegExp(`Emplacement réservé à une voie publique · sur environ ${aire} m² de la parcelle`));
  }
  // Petite parcelle (10 × 10 m) et intersection réelle de 1 m² : marginale, mais DITE, pas supprimée.
  const petite = lireUrbanisme(synthetique({
    parcelle: { geometry: rect(0, 0, 10, 10), contenance: 100, rattachement: "point" }, point: xy(5, 5),
    prescriptions: { surface: [presc(rect(0.1, 0, 0.2, 10), "05", "01", "Bande de 1 m²")], ligne: [], point: [] },
  }));
  assert.deepEqual(petite.prescriptions.map((p) => [p.etendue, p.surfaceM2]), [["marginale", 1]]);
  assert.match(visible(petite), /recoupe la parcelle sur une très faible surface \(≈ 1 m²\)/);
  assert.match(visible(petite), /vérifiez sur le plan de zonage si elle concerne bien ce terrain/);
});

test("Blocage 1 — Contacts et recouvrements : symétriques sur les quatre bords, aires exactes", () => {
  for (const [nom, g] of [["est", rect(100, 0, 110, 100)], ["ouest", rect(-10, 0, 0, 100)], ["nord", rect(0, 100, 100, 110)], ["sud", rect(0, -10, 100, 0)]] as const) {
    const u = lireUrbanisme(avecSurface(presc(g, "05", "01", `Contact ${nom}`)));
    assert.deepEqual([u.prescriptions.length, u.prescriptionsContact], [0, 1], `contact ${nom}`);
  }
  const micro = lireUrbanisme(avecSurface(presc(rect(99.99, 0, 110, 100), "05", "01", "Microchevauchement")));
  assert.deepEqual(micro.prescriptions.map((p) => [p.etendue, p.surfaceM2]), [["marginale", 1]]);
  // Points et lignes posés sur chacun des quatre bords : même réponse partout (contact, compté).
  const bords: [string, unknown][] = [
    ["point ouest", { type: "Point", coordinates: xy(0, 50) }], ["point est", { type: "Point", coordinates: xy(100, 50) }],
    ["point nord", { type: "Point", coordinates: xy(50, 100) }], ["point sud", { type: "Point", coordinates: xy(50, 0) }],
    ["ligne ouest", { type: "LineString", coordinates: [xy(0, 0), xy(0, 100)] }], ["ligne est", { type: "LineString", coordinates: [xy(100, 0), xy(100, 100)] }],
    ["ligne nord", { type: "LineString", coordinates: [xy(0, 100), xy(100, 100)] }], ["ligne sud", { type: "LineString", coordinates: [xy(0, 0), xy(100, 0)] }],
  ];
  for (const [nom, g] of bords) {
    const f = presc(g, "07", "01", nom);
    const ligne = (g as { type: string }).type === "LineString";
    const u = lireUrbanisme(synthetique({ prescriptions: { surface: [], ligne: ligne ? [f] : [], point: ligne ? [] : [f] } }));
    assert.deepEqual([u.prescriptions.length, u.prescriptionsContact], [0, 1], nom);
  }
  const traverse = lireUrbanisme(synthetique({ prescriptions: { surface: [], ligne: [presc({ type: "LineString", coordinates: [xy(-10, 50), xy(110, 50)] }, "07", "01", "Haie")], point: [] } }));
  assert.deepEqual(traverse.prescriptions.map((p) => [p.etendue, Math.round(p.longueurM!)]), [["couvre", 100]]);
  const dedans = lireUrbanisme(synthetique({ prescriptions: { surface: [], ligne: [], point: [presc({ type: "Point", coordinates: xy(50, 50) }, "07", "01", "Arbre")] } }));
  assert.equal(dedans.prescriptions[0].etendue, "couvre");
});

test("Blocage 1 — Trous, multipolygones, parcelles concaves, deux zones réelles", () => {
  const P = projectionAutour(2, 46);
  const troue = regionDe({ type: "Polygon", coordinates: [...rect(0, 0, 100, 100).coordinates, ...rect(25, 25, 75, 75).coordinates] }, P)!;
  assert.ok(Math.abs(aireRegion(troue) - 7500) < 1);
  assert.equal(Math.round(aireIntersection(troue, regionDe(rect(30, 30, 70, 70), P)!)), 0, "dans le trou");
  assert.equal(Math.round(aireIntersection(troue, regionDe(rect(0, 0, 50, 50), P)!)), 1875, "chevauche le trou");
  const multi = regionDe({ type: "MultiPolygon", coordinates: [rect(0, 0, 10, 10).coordinates, rect(90, 90, 100, 100).coordinates] }, P)!;
  assert.equal(Math.round(aireIntersection(multi, regionDe(rect(0, 0, 10, 10), P)!)), 100);
  const concave = { type: "Polygon", coordinates: [[xy(0, 0), xy(100, 0), xy(100, 50), xy(50, 50), xy(50, 100), xy(0, 100), xy(0, 0)]] };
  const enEncoche = lireUrbanisme(synthetique({ parcelle: { geometry: concave, contenance: 7500, rattachement: "point" }, point: xy(25, 25), prescriptions: { surface: [presc(rect(60, 60, 90, 90), "05", "01", "Dans l'encoche")], ligne: [], point: [] } }));
  assert.deepEqual([enEncoche.prescriptions.length, enEncoche.prescriptionsContact], [0, 1], "l'encoche n'est pas la parcelle");
  const deux = lireUrbanisme(synthetique({ zones: [zone("UA", rect(-500, -500, 40, 500)), zone("UB", rect(40, -500, 500, 500))] }));
  assert.deepEqual(deux.zones.map((z) => [z.libelle, z.part]), [["UB", 0.6], ["UA", 0.4]]);
});

test("Blocage 1 — Géométrie absente, vide ou mal formée : lecture au point, jamais « à la parcelle » ; zone illisible dite", () => {
  for (const [nom, g] of [["absente", null], ["Polygon vide", { type: "Polygon", coordinates: [] }], ["coordonnées nulles", { type: "Polygon", coordinates: null }], ["NaN", { type: "Polygon", coordinates: [[[Number.NaN, 1], [2, 2], [3, 3], [Number.NaN, 1]]] }]] as const) {
    const u = lireUrbanisme(synthetique({ parcelle: { geometry: g as never, contenance: 10_000, rattachement: "point" } }));
    assert.deepEqual([u.grain, u.rattachement.mode], ["point", "aucun"], nom);
    assert.equal(u.zones[0].part, null, `${nom} : aucune part inventée`);
  }
  const illisible = lireUrbanisme(synthetique({ zones: [zone("UA", { type: "Polygon", coordinates: [] })], prescriptions: { surface: [presc({ type: "Polygon", coordinates: null }, "05", "01", "Réserve illisible")], ligne: [], point: [] } }));
  assert.deepEqual(illisible.zonesNonMesurables, ["UA"]);
  assert.deepEqual(illisible.prescriptions.map((p) => p.etendue), ["incertaine"], "jamais supprimée en silence");
  assert.ok(illisible.ambiguites.includes("geometrie_non_mesurable"));
  assert.match(visible(illisible), /position par rapport à la parcelle non vérifiable/);
});

test("Blocage 2 — Repli : la parcelle la plus proche MESURÉE, et la réserve avant les zones et prescriptions", async () => {
  // L'entrée de Work : rien au point, puis une grande parcelle collée au point et une petite voisine.
  const { findCadastreParcelWithGeometry } = await import("./cadastre.ts") as M;
  const cad = (idu: string, contenance: number, geometry: unknown) => ({ geometry, properties: { idu, code_insee: "99999", section: "AA", numero: idu, contenance } });
  const avant = globalThis.fetch;
  let appels = 0;
  try {
    globalThis.fetch = (async () => Response.json({ features: appels++ === 0 ? [] : [cad("proche", 5000, rect(0, 0, 100, 100)), cad("petite-voisine", 100, rect(-12, 0, -2, 10))] })) as typeof fetch;
    const lu = await findCadastreParcelWithGeometry(...xy(-1, 50));
    assert.equal(lu.parcel.idu, "proche", "la plus proche, pas la plus petite");
    assert.deepEqual([lu.parcel.rattachement, lu.parcel.distanceRepliM], ["repli", 1]);
    const u = lireUrbanisme(synthetique({
      parcelle: { geometry: lu.geometry, contenance: 5000, rattachement: "repli", distanceM: lu.parcel.distanceRepliM },
      prescriptions: { surface: [presc(rect(0, 0, 100, 20), "05", "01", "Réserve")], ligne: [], point: [] },
    }));
    assert.deepEqual([u.statut, u.ambiguites, u.rattachement], ["ambigu", ["parcelle_incertaine"], { mode: "repli", distanceM: 1 }]);
    const t = visible(u);
    const reserve = t.indexOf("La plus proche (PARCELLE-X), à environ 1 m, a été retenue : elle peut être celle d'un voisin");
    assert.ok(reserve > 0, "la réserve est visible, hors du repli");
    assert.ok(reserve < t.indexOf("zone UA") && reserve < t.indexOf("Emplacement réservé"), "elle précède zones et prescriptions");
    assert.match(t, /La parcelle retenue est en zone UA/);
    assert.match(t, /Prescriptions cartographiées sur la parcelle retenue/);
    assert.doesNotMatch(t, /Cette parcelle est en zone/);
  } finally {
    globalThis.fetch = avant;
  }
  // Point sur la limite de deux parcelles : la limite est dite, la lecture devient conditionnelle.
  try {
    globalThis.fetch = (async () => Response.json({ features: [cad("a", 500, rect(0, 0, 100, 100)), cad("b", 500, rect(-100, 0, 0, 100))] })) as typeof fetch;
    const lu = await findCadastreParcelWithGeometry(...xy(0, 50));
    assert.deepEqual([lu.parcel.rattachement, lu.parcel.candidatsAuPoint], ["point", 2]);
    const u = lireUrbanisme(synthetique({ parcelle: { geometry: lu.geometry, contenance: 500, rattachement: "point", candidatsAuPoint: 2 } }));
    assert.deepEqual(u.rattachement.mode, "limite");
    assert.match(visible(u), /Le point de l'adresse est sur la limite entre plusieurs parcelles/);
  } finally {
    globalThis.fetch = avant;
  }
  // Une distance mesurée nulle ne devient pas « environ 1 m ».
  const zero = lireUrbanisme(synthetique({ parcelle: { geometry: PARCELLE, contenance: 10_000, rattachement: "repli", distanceM: 0 } }));
  assert.match(visible(zero), /La plus proche \(PARCELLE-X\), à moins d'un mètre, a été retenue/);
});

test("Blocage 3 — Vigueur en trois états : établie, explicitement hors vigueur, non vérifiée", () => {
  assert.equal(vigueurDe("PLU", DETAILS_OK).vigueur, "etablie");
  for (const [nom, d] of [["détail en panne", null], ["métadonnées vides", {}], ["statut légal absent", { effectiveStatus: "EN_VIGUEUR" }], ["statut effectif absent", { legalStatus: "APPROVED" }], ["partiellement annulé", { effectiveStatus: "EN_VIGUEUR", legalStatus: "PARTIALLY_ANNULLED" }]] as const) {
    assert.equal(vigueurDe("PLU", d as never).vigueur, "non_verifiee", nom);
  }
  for (const [nom, d] of [["hors vigueur", { effectiveStatus: "HORS_VIGUEUR", legalStatus: "APPROVED" }], ["annulé", { effectiveStatus: "EN_VIGUEUR", legalStatus: "ANNULLED" }], ["historique", { legalStatus: "HISTORICAL" }]] as const) {
    assert.equal(vigueurDe("PLU", d).vigueur, "hors_vigueur", nom);
  }
  assert.equal(vigueurDe("POS", DETAILS_OK).vigueur, "hors_vigueur", "plan d'occupation des sols, caduc");
  // Le texte affiché : la zone n'est plus affirmée comme applicable, la réserve est visible.
  const panne = lireUrbanisme(synthetique({ details: { [DOC]: null } }));
  assert.deepEqual([panne.statut, panne.ambiguites, panne.documents[0].detailLu], ["ambigu", ["vigueur_non_verifiee"], false]);
  const t = visible(panne);
  assert.match(t, /D'après le document publié, cette parcelle est en zone UA du plan local d'urbanisme \(PLU\)\. Le statut de ce document, en vigueur ou non, n'a pas pu être vérifié lors de la collecte/);
  const hors = lireUrbanisme(synthetique({ details: { [DOC]: { effectiveStatus: "HORS_VIGUEUR", legalStatus: "APPROVED" } } }));
  assert.deepEqual(hors.ambiguites, ["document_hors_vigueur"]);
  assert.match(visible(hors), /Le Géoportail ne donne pas ce document comme en vigueur/);
  const partiel = lireUrbanisme(synthetique({ details: { [DOC]: { effectiveStatus: "EN_VIGUEUR", legalStatus: "PARTIALLY_ANNULLED" } } }));
  assert.match(visible(partiel), /signale ce document comme partiellement annulé/);
  // Les cas réels confirmés restent confirmés, sans réserve.
  for (const c of ["moissy-zone-unique", "lyon-croix-rousse", "merignac-deux-zones", "sucy-trois-zones"] as const) {
    assert.equal(lire(c).statut, "confirme", c);
    assert.doesNotMatch(visible(lire(c)), /D'après le document publié|n'a pas pu être vérifié/, c);
  }
});

test("Blocage 3 — Besançon et Sucy-en-Brie, détail et pièces en délai dépassé : couches lues, vigueur non vérifiée", () => {
  for (const c of ["besancon-psmv-non-protege", "sucy-trois-zones"] as const) {
    const ids = Object.keys(fixture(c).details);
    const e = entree(c);
    const u = lireUrbanisme({ ...e, details: Object.fromEntries(ids.map((id) => [id, null])), fichiers: Object.fromEntries(ids.map((id) => [id, null])) });
    assert.ok(u.zones.length > 0, `${c} : les zones restent lues`);
    assert.ok(u.ambiguites.includes("vigueur_non_verifiee"), c);
    assert.ok(u.documents.every((d) => d.vigueur === "non_verifiee" && !d.detailLu && !d.piecesLues), c);
    assert.match(visible(u), /n'a pas pu être vérifié lors de la collecte/, c);
  }
});

test("Blocage 4 — Sous-codes : 07-67/68 non protégés en PSMV, 05-05 et 05-07 sans l'explication des voies publiques", () => {
  assert.equal(categorieDe("07", "67", "PSMV"), "07-67");
  assert.equal(categorieDe("07", "67", "PLU"), "neutre", "un sous-code de PSMV ne vaut rien dans un PLU");
  assert.equal(categorieDe("03", "01", "PLU"), "neutre", "03-01 est réservé aux cartes communales");
  assert.equal(categorieDe("07", "99", "PLU"), "neutre", "sous-code inconnu : nommé, sans effet énoncé");
  assert.equal(categorieDe("39", "02", "PLU"), null, "la hauteur est une famille générale");
  for (const s of ["67", "68", "65", "66", "69"]) assert.doesNotMatch(CATEGORIES[`07-${s}`].titre + CATEGORIES[`07-${s}`].note, /protège |protégée?s? |à conserver/i, `07-${s}`);
  for (const s of ["50", "52", "57"]) assert.match(CATEGORIES[`07-${s}`].note, /protège cet élément/, `07-${s}`);
  for (const [sous, attendu] of [["05", /programme de logements/], ["07", /projet d'aménagement d'ensemble/]] as const) {
    const u = lireUrbanisme(avecSurface(presc(PARCELLE, "05", sous, "Libellé du producteur")));
    assert.deepEqual(u.prescriptions.map((p) => [p.categorie, p.code, p.sousCode, p.documentType]), [[`05-${sous}`, "05", sous, "PLU"]]);
    const t = visible(u);
    assert.match(t, attendu);
    assert.doesNotMatch(t, /futur aménagement public|voie, équipement, espace vert/, `05-${sous}`);
  }
  // Un sous-code inconnu ne reçoit aucune explication d'effet.
  const inconnu = lireUrbanisme(avecSurface(presc(PARCELLE, "07", "99", "Libellé local")));
  assert.match(visible(inconnu), new RegExp(NOTE_NEUTRE.slice(0, 50).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(visible(inconnu), /Le plan protège/);
  // Les catégories légitimes sont préservées.
  assert.equal(lire("six-fours-emplacement-reserve").prescriptions[0].categorie, "05-00");
  for (const s of ["01", "02", "03"]) assert.equal(categorieDe("16", s, "PLU"), `16-${s}`);
});

const rapport = (o: Partial<LogementReport> = {}): LogementReport => ({
  address: { id: "17300_x", label: "12 rue du Palais 17000 La Rochelle", city: "La Rochelle", citycode: "17300", postcode: "17000", latitude: 46.16, longitude: -1.15 },
  parcel: { parcelCode: "17300-000-EN-0010", nomCommune: "La Rochelle", contenance: 120 },
  altitude: 5, zfe: { inZfe: false, zones: [] }, cartofriches: { count: 0, tronque: false, sansCoordonnees: 0, friches: [] },
  communeData: null, sinistralite: null, heritage: { items: [], sourceStatus: "ok" },
  georisques: { address: null, parcel: null, commune: null },
  ...o,
});
function version(r: LogementReport, numero = 1): VersionLogement {
  return { numero, collecteeLe: "2026-09-01T10:00:00.000Z", sourcesAbsentes: sourcesAbsentes(r), synthese: null, syntheseHash: null, report: r, reportHash: jsonCanonique(r), syntheseDpe: null };
}

test("Blocage 5 — Actualisation : une sous-source perdue refuse N+1, une évolution légitime l'accepte", () => {
  const connue = lireUrbanisme(avecSurface(presc(PARCELLE, "05", "01", "Réserve connue")));
  const N = version(rapport({ urbanisme: connue }));
  const issue = (u: UrbanismeParcelle) => issueActualisation(rapport({ urbanisme: u }), jsonCanonique(rapport({ urbanisme: u })), N);
  // L'entrée de Work : mêmes documents et zones, `prescriptions.surface = null`.
  const perdue = lireUrbanisme(synthetique({ prescriptions: { surface: null, ligne: [], point: [] } }));
  assert.ok(sourcesAbsentes(rapport({ urbanisme: perdue })).includes("urbanisme_prescriptions"));
  assert.equal(issue(perdue), "refusee");
  assert.equal(issue(lireUrbanisme(synthetique({ details: { [DOC]: null } }))), "refusee", "vigueur devenue invérifiable");
  assert.equal(issue(lireUrbanisme(synthetique({ fichiers: { [DOC]: null } }))), "refusee", "pièces devenues illisibles");
  assert.equal(issue(urbanismeIndisponible()), "refusee", "panne totale");
  // Évolutions légitimes : prescription retirée, document devenu hors vigueur, document remplacé.
  assert.equal(issue(lireUrbanisme(synthetique())), "nouvelle_version", "prescription officiellement retirée");
  assert.equal(issue(lireUrbanisme(synthetique({ details: { [DOC]: { effectiveStatus: "ANNULE", legalStatus: "ANNULLED" } } }))), "nouvelle_version");
  assert.equal(issue(lireUrbanisme(synthetique({
    documents: [documentPlu(DOC2, "PLUi", "200000000_PLUi_20261001")], zones: [zone("UB", rect(-500, -500, 500, 500), { gpu_doc_id: DOC2 })],
    details: { [DOC2]: DETAILS_OK }, fichiers: { [DOC2]: [] },
  }))), "nouvelle_version", "document remplacé par un PLUi");
  // Un dossier antérieur n'avait aucune lecture : il ne perd rien, le reste de sa collecte s'actualise.
  const ancien = version(rapport());
  assert.deepEqual(pertesUrbanisme(ancien.report, rapport({ urbanisme: urbanismeIndisponible() })), []);
  assert.equal(issueActualisation(rapport({ urbanisme: perdue }), "h", ancien), "nouvelle_version");
  // Une version déjà dégradée ne bloque pas son amélioration.
  const NDegradee = version(rapport({ urbanisme: perdue }));
  assert.equal(issueActualisation(rapport({ urbanisme: connue }), "h2", NDegradee), "nouvelle_version");
});

test("Blocage 5 — N reste intacte et affichée quand N+1 a perdu les prescriptions", async () => {
  const N = version(rapport({ urbanisme: lireUrbanisme(avecSurface(presc(PARCELLE, "05", "01", "Réserve connue"))) }));
  const figee = JSON.stringify(N);
  let ecrites = 0;
  const r = await consulterOuActualiser(true, {
    lire: async () => N,
    construire: async () => rapport({ urbanisme: lireUrbanisme(synthetique({ prescriptions: { surface: null, ligne: [], point: [] } })) }),
    empreinte: jsonCanonique,
    enregistrer: async () => { ecrites++; return null; },
  });
  assert.equal(r.actualisation, "refusee");
  assert.deepEqual(r.sourcesNonActualisees?.filter((s) => s.startsWith("urbanisme")), ["urbanisme_prescriptions"]);
  assert.equal(r.urbanisme?.prescriptions[0].libelle, "Réserve connue", "la lecture de N reste affichée");
  assert.equal(ecrites, 0);
  assert.equal(JSON.stringify(N), figee);
});

// ═══════════════════════════════════ 3. LES PANNES ET LA COLLECTE ══════════════════════════════

test("Source GPU en panne : `indisponible`, jamais « aucune règle » ; panne partielle des prescriptions dite", () => {
  assert.equal(lireUrbanisme(synthetique({ documents: null })).statut, "indisponible");
  assert.equal(lireUrbanisme(synthetique({ zones: null, secteurs: null })).statut, "indisponible");
  const partielle = lireUrbanisme(synthetique({ prescriptions: { surface: null, ligne: [], point: [] } }));
  assert.equal(partielle.prescriptionsStatut, "indisponible");
  assert.match(visible(partielle), /Les prescriptions cartographiées n'ont pas pu être toutes lues/);
  const t = rendu(urbanismeIndisponible());
  assert.match(t, /Plan d'urbanisme non lu/);
  assert.match(t, /Cela ne veut pas dire qu'aucune règle ne s'applique/);
  assert.deepEqual(reglementDeZone(DOC, null, "X_reglement.pdf", null), { statut: "indisponible" });
  const piege = lireUrbanisme(synthetique({ fichiers: { [DOC]: [] }, zones: [zone("UA", rect(-500, -500, 500, 500), { urlfic: "javascript:alert(1)" })] }));
  assert.deepEqual(piege.zones[0].reglement, { statut: "non_publie" }, "une URL de producteur n'entre que si c'est du http(s)");
});

test("La collecte ne lève jamais : réseau coupé, réponses en erreur, JSON invalide", async () => {
  const avant = globalThis.fetch;
  try {
    for (const f of [
      async () => { throw new Error("réseau coupé"); },
      async () => new Response("erreur", { status: 503 }),
      async () => new Response("{pas du json", { status: 200 }),
    ]) {
      globalThis.fetch = f as typeof fetch;
      assert.equal((await fetchUrbanismeParcelle(46.15, -1.15, null)).statut, "indisponible");
    }
  } finally {
    globalThis.fetch = avant;
  }
});

test("La collecte rejoue une réponse réelle (Mérignac) : POST, géométrie de la parcelle validée, même lecture", async () => {
  const x = fixture("merignac-deux-zones");
  const couches: Record<string, M> = {
    municipality: x.municipality, document: x.document, "zone-urba": x.zone, "secteur-cc": x.secteur,
    "prescription-surf": x.prescriptionSurf, "prescription-lin": x.prescriptionLin, "prescription-pct": x.prescriptionPct,
  };
  const vus: string[] = [];
  const types: string[] = [];
  const avant = globalThis.fetch;
  try {
    globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
      const u = String(url);
      const couche = u.match(/api\/gpu\/([a-z-]+)$/)?.[1];
      if (couche) {
        vus.push(`${init?.method} ${couche}`);
        types.push(`${couche}:${JSON.parse(String(init?.body)).geom.type}`);
        return new Response(JSON.stringify(couches[couche]));
      }
      const doc = u.match(/document\/([0-9a-f]{32})\/(details|files)$/);
      if (doc) return new Response(JSON.stringify(doc[2] === "details" ? x.details[doc[1]] : x.files[doc[1]]));
      return new Response("inattendu", { status: 500 });
    }) as typeof fetch;
    const p = { geometry: x.parcelle.geometry, contenance: x.parcelle.properties.contenance, rattachement: "point" as const };
    const u = await fetchUrbanismeParcelle(x.ban.lat, x.ban.lon, p);
    assert.deepEqual(u, lire("merignac-deux-zones"));
    assert.equal(vus.length, 7);
    assert.ok(vus.every((v) => v.startsWith("POST ")));
    assert.ok(types.filter((t) => !t.startsWith("municipality")).every((t) => t.endsWith(x.parcelle.geometry.type)), "les couches lisent la parcelle");
    // Une parcelle illisible n'est pas envoyée : lecture au point.
    types.length = 0;
    await fetchUrbanismeParcelle(x.ban.lat, x.ban.lon, { ...p, geometry: { type: "Polygon", coordinates: [] } });
    assert.ok(types.every((t) => t.endsWith(":Point")), types.join(","));
  } finally {
    globalThis.fetch = avant;
  }
});

// ═══════════════════════════════════ 4. CE QUE LE TEXTE NE DIT JAMAIS ══════════════════════════

test("Aucune conclusion abusive sur la constructibilité, sur tous les cas réels et toutes les catégories", () => {
  for (const c of CAS) {
    const u = lire(c);
    const t = rendu(u);
    sansAbus(t, c);
    if (u.regime === "document" && u.zones.length > 0) {
      assert.match(t, /Ce zonage ne dit pas, à lui seul, ce qui est autorisé/, `${c} : la limite du zonage est dite`);
      assert.match(t, /faites confirmer le projet par le service urbanisme de la mairie/, `${c} : la vérification est dite`);
    }
    if (u.statut !== "indisponible" && u.regime !== "rnu" && u.statut !== "non_trouve") {
      assert.match(t, /D'après le Géoportail de l'urbanisme/, `${c} : la source est dite`);
    }
  }
  for (const [code, c] of Object.entries(CATEGORIES)) sansAbus(`${c.titre} ${c.note}`, `catégorie ${code}`);
  sansAbus(NOTE_NEUTRE, "note neutre");
});

test("Seuils : nommés, distincts pour les zones et les prescriptions", () => {
  assert.deepEqual([PART_MIN, SURFACE_MIN_M2], [0.02, 25]);
  assert.equal(couvre(0.001, 10), false);
  assert.equal(couvre(0.003, 30), true, "une bande de 30 m² est une emprise réelle");
  assert.equal(couvre(null, null), true, "lecture au point : la prescription contient le point");
  assert.equal(approbationDepuisNom("200046977_PLUi_20260326"), "2026-03-26");
  assert.equal(approbationDepuisNom("123456789_PLUI_20170915_A"), "2017-09-15");
  assert.equal(approbationDepuisNom("DU_241700434"), null);
});

// ═══════════════════════════════════ 5. LES DOSSIERS ET LEURS VERSIONS ═════════════════════════

test("Dossier historique sans champ urbanisme : ni panne inventée, ni empreinte changée, et l'écran le dit", () => {
  const ancien = rapport();
  assert.ok(!sourcesAbsentes(ancien).some((s) => s.startsWith("urbanisme")));
  assert.ok(!jsonCanonique(ancien).includes("urbanisme"), "l'empreinte d'un rapport antérieur ne bouge pas");
  const t = texte(rendreSection({
    georisques: ancien.georisques, heritage: ancien.heritage,
    urbanisme: { lecture: ancien.urbanisme, parcelCode: ancien.parcel!.parcelCode },
  }));
  assert.match(t, /Ce dossier a été collecté avant la lecture du plan d'urbanisme\. Une actualisation des données l'ajoutera/);
  assert.doesNotMatch(texte(rendreSection({ georisques: ancien.georisques, heritage: ancien.heritage })), /urbanisme/);
});

test("Le bloc réglementaire ne dit plus « aucune règle de construction » à côté d'un plan d'urbanisme", () => {
  const point = { risks: { labels: [] }, pprn: { labels: [] }, regulatoryPlans: [], rga: null, seismic: null };
  const t = texte(rendreSection({
    georisques: { address: point, parcel: null, commune: null }, heritage: { items: [], sourceStatus: "ok" },
    urbanisme: { lecture: lire("moissy-zone-unique"), parcelCode: null },
  }));
  assert.match(t, /Ni plan de prévention des risques ni périmètre patrimonial à cette adresse/);
  assert.match(t, /Cette parcelle est en zone UC/);
  assert.doesNotMatch(t, /Aucune règle de construction/);
});

test("Actualisation explicite : N+1 porte l'urbanisme, N reste intacte ; une panne totale ne remplace pas une lecture", async () => {
  const ancienne = version(rapport());
  const figee = JSON.stringify(ancienne);
  const ecrites: LogementReport[] = [];
  const deps = (nouveau: LogementReport, v: VersionLogement) => ({
    lire: async () => v,
    construire: async () => nouveau,
    empreinte: jsonCanonique,
    enregistrer: async (r: LogementReport, h: string) => { ecrites.push(r); return { ...version(r, v.numero + 1), reportHash: h }; },
  });
  const sansDemande = await consulterOuActualiser(false, { ...deps(rapport(), ancienne), construire: async () => { throw new Error("aucune source ne doit être appelée"); } });
  assert.equal(sansDemande.urbanisme, undefined);

  const avecUrba = rapport({ urbanisme: lire("moissy-zone-unique") });
  const r1 = await consulterOuActualiser(true, deps(avecUrba, ancienne));
  assert.deepEqual([r1.actualisation, r1.version?.numero, r1.urbanisme?.zones[0].libelle], ["nouvelle_version", 2, "UC"]);
  assert.equal(JSON.stringify(ancienne), figee, "la version 1 n'a pas bougé");

  const v2 = version(avecUrba, 2);
  const r2 = await consulterOuActualiser(true, deps(rapport({ urbanisme: urbanismeIndisponible() }), v2));
  assert.equal(r2.actualisation, "refusee");
  assert.ok(r2.sourcesNonActualisees?.includes("urbanisme"));
  assert.equal(r2.urbanisme?.zones[0].libelle, "UC", "la lecture de la version 2 reste affichée");
  assert.equal(ecrites.length, 1);
  assert.equal(jsonCanonique(rapport({ urbanisme: lire("lyon-croix-rousse") })), jsonCanonique(rapport({ urbanisme: lire("lyon-croix-rousse") })), "pas de version fantôme");
});
