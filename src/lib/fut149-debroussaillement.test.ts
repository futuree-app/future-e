import { test, before, describe } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { gunzipSync, gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import {
  cellulesDeLecture, cleTuile, departementInsee, lireDebroussaillement, manifesteValide, tuileValide, tuilesALire,
  DEBROUSSAILLEMENT_CONVENTION, FORMAT_TUILES_DEBROUSSAILLEMENT, LIMITE_PROCHE_M,
  type EntreeDebroussaillement, type LectureDebroussaillement, type ManifesteDebroussaillement, type ProfilZonage,
  type TuileDebroussaillement,
} from "./debroussaillement.ts";
import { texteAutour, texteLogement, phraseZonage } from "./debroussaillement-texte.ts";
import { sourcesAbsentes, issueActualisation, type VersionLogement } from "./logement-report-version.ts";
import type { LogementReport } from "./logement-report-types.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-149 (28/10/2026) : LE ZONAGE DU DÉBROUSSAILLEMENT OBLIGATOIRE, LU SANS DÉPASSER LA PREUVE.
//
// Trois sources de vérité, aucune valeur attendue écrite à la main pour les adresses réelles :
//  1. Les tuiles de l'édition IGN du 01/03/2026 qui couvrent les adresses de recette
//     (`__fixtures__/fut149/tuiles/`, extraites par `scripts/research/fut149-capture-adresses.mjs`).
//  2. Des adresses réelles (`__fixtures__/fut149/adresses/`, réponses brutes BAN et cadastre du 28/10/2026), dont
//     l'état attendu est recalculé ici par un oracle INDÉPENDANT (point dans polygone, en entiers, sans projection).
//  3. Des zones et des parcelles construites à la main contre une limite (contact, 1 cm, liseré, coupe de tuile).
//
// « Le bloc apparaît » et « le bloc dit vrai » sont deux assertions distinctes (AGENTS.md) : les textes sont
// vérifiés tels que le lecteur les lit, et pour ce qu'ils ne doivent jamais dire.
// ════════════════════════════════════════════════════════════════════════════════════════════

// ── Le rendu (même dispositif que FUT-81 et FUT-146) ──────────────────────────────────────────
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

let rendreAutour: (l: LectureDebroussaillement | null | undefined) => string;
let rendreLogement: (l: LectureDebroussaillement | null | undefined) => string;
let rendreSection: (props: unknown) => string;
let lecteur: typeof import("./server/debroussaillement-tuiles.ts");

before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { createElement } = await import("react");
  const { DebroussaillementAutour, DebroussaillementLogement } = await import("../components/report/DebroussaillementBlocs.tsx");
  const { RegulatoryStatusBlock } = await import("../components/report/logement/RegulatorySection.tsx");
  lecteur = await import("./server/debroussaillement-tuiles.ts");
  rendreAutour = (l) => texte(renderToStaticMarkup(createElement(DebroussaillementAutour, { lecture: l })));
  rendreLogement = (l) => texte(renderToStaticMarkup(createElement(DebroussaillementLogement, { lecture: l, withDivider: false })));
  rendreSection = (p) => texte(renderToStaticMarkup(createElement(RegulatoryStatusBlock, p as never)));
});

/** Le texte que lit le lecteur : balises retirées, entités décodées, espaces insécables normalisées. */
function texte(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&apos;/g, "'").replace(/&quot;/g, "\"").replace(/&amp;/g, "&").replace(/&nbsp;| /g, " ")
    .replace(/’/g, "'").replace(/\s+/g, " ").trim();
}

/**
 * Ce qu'aucun texte ne doit dire : un danger d'incendie à l'adresse, un terrain boisé, une absence d'obligation, un
 * certificat, un nombre de mètres imposé à CE propriétaire, un score ou une alerte.
 */
const INTERDITS = [
  /risque d'incendie (élevé|fort|à l'adresse|pour ce)/i, /expos[ée]e? (au feu|aux incendies|à l'incendie)/i, /terrain boisé|en forêt/i,
  /lisière/i, /aucune obligation(?! ne s'applique)/i, /pas d'obligation/i, /n'est pas concern[ée]/i, /conforme|certifi/i,
  /vous devez débroussailler \d/i, /sur \d+ m(?:ètres)? autour de (votre|ce|la) maison/i, /score|alerte/i,
];
function sansInterdit(t: string) {
  for (const r of INTERDITS) assert.doesNotMatch(t, r, `texte interdit ${r} dans : ${t}`);
}

// ════════════════════════════════════════════════════════════════════════════════════════════
// Un jeu construit à la main : quelques cellules autour de Saint-Chamas (13), en entiers de 1e-7 degré.
// ════════════════════════════════════════════════════════════════════════════════════════════
const E = 1e7;
const PROFIL: ProfilZonage = {
  departement: "13", source: "Zonage local", origine: "BD Forêt V2", millesime: "2008", arrete: "2025-10-15", arreteBrut: "15/10/25",
  url: "https://www.bouches-du-rhone.gouv.fr/Actions-de-l-Etat/Agriculture-foret-et-developpement-rural/Foret/Debroussaillement/Le-debroussaillement",
  integration: "2025-02-01", integrationBrut: "01/02/25",
};
const PROFIL_RECENT: ProfilZonage = { ...PROFIL, departement: "33", source: "Zonage IGN+traitements locaux", millesime: "2021", arrete: "2025-10-17" };

/** Un rectangle [lon0, lat0, lon1, lat1] (degrés) en anneau codé, anti-horaire. */
function rect(lon0: number, lat0: number, lon1: number, lat1: number): number[] {
  const [x0, y0, x1, y1] = [lon0, lat0, lon1, lat1].map((v) => Math.round(v * E));
  return [x0, y0, x1 - x0, 0, 0, y1 - y0, x0 - x1, 0];
}
function tuile(ix: number, iy: number, morceaux: TuileDebroussaillement["morceaux"]): TuileDebroussaillement {
  return { format: FORMAT_TUILES_DEBROUSSAILLEMENT, edition: "2026-03-01", ix, iy, morceaux };
}
// Zone A : 5,02-5,06 × 43,42-43,46, dans la cellule 50_434. Zone B : 5,08-5,12, à cheval sur 50_434 et 51_434
// (la droite 5,1 est une COUPE de tuile, pas une limite). Cellule 52_434 : pleine. Zone ambiguë en 50_435.
const TUILES = new Map<string, TuileDebroussaillement>([
  ["50_434", tuile(50, 434, [
    { p: 0, o: "A", r: [rect(5.02, 43.42, 5.06, 43.46)] },
    { p: 0, o: "B", r: [rect(5.08, 43.42, 5.1, 43.46)] },
  ])],
  ["51_434", tuile(51, 434, [{ p: 0, o: "B", r: [rect(5.1, 43.42, 5.12, 43.46)] }])],
  ["50_435", tuile(50, 435, [{ p: 0, o: "X", a: 1, r: [rect(5.02, 43.52, 5.04, 43.54)] }])],
  // Revue du 29/10/2026 : la zone C occupe toute la largeur de la cellule 53_434 (5,3-5,4) sur 43,42-43,46. Son bord
  // est (5,4) est une VRAIE limite exactement alignée sur la grille : la cellule 54_434 n'a aucune zone. Son bord
  // ouest (5,3) touche la cellule pleine 52_434 : coupe de tuile entre 43,42 et 43,46, vraie limite de P ailleurs.
  ["53_434", tuile(53, 434, [{ p: 0, o: "C", r: [rect(5.3, 43.42, 5.4, 43.46)] }])],
  // La zone E (5,6-5,7, cellule 56_434) s'arrête sur la grille en 5,7 ; de l'autre côté, la cellule 57_434 porte une
  // zone d'un AUTRE objet (F, 5,7-5,72) : le zonage continue, l'arête n'est pas une limite.
  ["56_434", tuile(56, 434, [{ p: 0, o: "E", r: [rect(5.6, 43.42, 5.7, 43.46)] }])],
  ["57_434", tuile(57, 434, [{ p: 1, o: "F", r: [rect(5.7, 43.42, 5.72, 43.46)] }])],
]);
function empreinte(t: TuileDebroussaillement) {
  const o = gzipSync(Buffer.from(JSON.stringify(t)));
  return { octets: o.length, sha256: createHash("sha256").update(o).digest("hex"), brut: o };
}
const MANIFESTE: ManifesteDebroussaillement = {
  format: FORMAT_TUILES_DEBROUSSAILLEMENT, edition: "2026-03-01", construitLe: "2026-10-28",
  producteur: "IGN, pour le ministère chargé des forêts", diffuseur: "IGN (Géoplateforme)", licence: "Licence Ouverte 2.0 (Etalab)",
  source: { url: "https://data.geopf.fr/telechargement/resource/DEBROUSSAILLEMENT" },
  couverture: ["13", "33", "2A"], profils: [PROFIL, PROFIL_RECENT],
  tuiles: {
    ...Object.fromEntries([...TUILES].map(([k, t]) => { const { octets, sha256 } = empreinte(t); return [k, { octets, sha256 }]; })),
    "52_434": { plein: { p: 0, o: "P" } },
  },
};

/** Un point décalé de `dx` mètres vers l'est (négatif : ouest) depuis une longitude, à la latitude donnée. */
const est = (lon: number, lat: number, dx: number) => lon + dx / (111_320 * Math.cos((lat * Math.PI) / 180));
const nord = (lat: number, dy: number) => lat + dy / 111_132;
/** Un carré de parcelle de côté `c` mètres, coin sud-ouest au point donné (degrés). */
function parcelleCarree(lon: number, lat: number, c: number, cy = c) {
  const [x1, y1] = [est(lon, lat, c), nord(lat, cy)];
  return { type: "Polygon", coordinates: [[[lon, lat], [x1, lat], [x1, y1], [lon, y1], [lon, lat]]] };
}
function entree(point: [number, number], o: Partial<EntreeDebroussaillement> = {}): EntreeDebroussaillement {
  return { point, geocodage: "housenumber", insee: "13092", parcelle: null, ...o };
}
const lireSynth = (e: EntreeDebroussaillement) => lireDebroussaillement(MANIFESTE, TUILES, e);
const LAT = 43.44;

// ════════════════════════════════════════════════════════════════════════════════════════════
describe("1. Au point : dedans, en limite, dehors, et les coupes de tuile", () => {
  test("au cœur d'une zone : en zone, sans limite", () => {
    const l = lireSynth(entree([5.04, LAT]));
    assert.equal(l.statut, "lu");
    assert.equal(l.etat, "en_zone");
    assert.equal(l.grain, "point");
    assert.equal(l.zone?.departement, "13");
    assert.equal(l.limite, null);
  });

  test("à 20 m de la limite, dedans : en limite, sans distance (le point est dans la zone)", () => {
    const l = lireSynth(entree([est(5.06, LAT, -20), LAT]));
    assert.equal(l.etat, "en_limite");
    assert.deepEqual(l.limite, { cause: "point_proche", distanceM: null });
  });

  test("à 30 m de la limite, dehors : en limite, distance dite", () => {
    const l = lireSynth(entree([est(5.06, LAT, 30), LAT]));
    assert.equal(l.etat, "en_limite");
    assert.equal(l.limite?.cause, "point_proche");
    assert.equal(l.limite?.distanceM, 30);
  });

  test("posé exactement sur la limite : en limite, jamais une zone affirmée seule", () => {
    assert.equal(lireSynth(entree([5.06, LAT])).etat, "en_limite");
  });

  test(`au-delà de ${LIMITE_PROCHE_M} m d'une limite, dehors, dans un département couvert : hors zone`, () => {
    const l = lireSynth(entree([est(5.06, LAT, 400), LAT]));
    assert.equal(l.etat, "hors_zone");
    assert.equal(l.zone, null);
    assert.equal(l.profilDepartement?.departement, "13", "le zonage du département reste dit (arrêté, préfecture)");
  });

  test("la coupe de tuile n'est pas une limite : à 8 m de la droite 5,1, au milieu de la zone B, en zone", () => {
    for (const lon of [est(5.1, LAT, -8), est(5.1, LAT, 8), 5.1]) {
      const l = lireSynth(entree([lon, LAT]));
      assert.equal(l.etat, "en_zone", `lon ${lon}`);
    }
  });

  test("revue du 29/10/2026 : une VRAIE limite alignée sur la grille reste une limite, des deux côtés, à 10 m", () => {
    const dedans = lireSynth(entree([est(5.4, LAT, -10), LAT]));
    assert.equal(dedans.etat, "en_limite", "à 10 m à l'intérieur, la zone s'arrête sur la grille : jamais « en zone »");
    assert.deepEqual(dedans.limite, { cause: "point_proche", distanceM: null });
    const dehors = lireSynth(entree([est(5.4, LAT, 10), LAT]));
    assert.equal(dehors.etat, "en_limite", "à 10 m à l'extérieur : jamais « hors zone »");
    assert.equal(dehors.limite?.distanceM, 10);
    assert.equal(lireSynth(entree([est(5.4, LAT, 80), LAT])).etat, "hors_zone", "au-delà de 50 m, hors zone");
    assert.equal(lireSynth(entree([est(5.4, LAT, -80), LAT])).etat, "en_zone", "au-delà de 50 m, en zone");
  });

  test("revue du 29/10/2026 : une coupe de tuile n'est pas une limite, même au contact d'une cellule pleine", () => {
    for (const dx of [-10, 10]) assert.equal(lireSynth(entree([est(5.3, LAT, dx), LAT])).etat, "en_zone", `à ${dx} m de 5,3`);
  });

  test("revue du 29/10/2026 : de l'autre côté d'une même droite, couvert ici, découvert là (cellule pleine bordée en partie)", () => {
    // Le bord est de la cellule pleine P (5,3) n'est couvert par C qu'entre 43,42 et 43,46 : en 43,48, c'est une limite.
    assert.equal(lireSynth(entree([est(5.3, 43.48, -10), 43.48])).etat, "en_limite");
    assert.equal(lireSynth(entree([est(5.3, 43.48, 10), 43.48])).limite?.distanceM, 10);
  });

  test("revue du 29/10/2026 : un autre objet de l'autre côté de la grille prolonge le zonage, l'arête n'est pas une limite", () => {
    for (const dx of [-10, 10]) assert.equal(lireSynth(entree([est(5.7, LAT, dx), LAT])).etat, "en_zone", `à ${dx} m de 5,7`);
  });

  test("revue du 29/10/2026 : une parcelle contre une vraie limite alignée sur la grille la touche ; contre une coupe, non", () => {
    const g = (lon: number) => parcelleCarree(lon, LAT, 30);
    const contre = lireSynth(entree([est(5.4, LAT, 15), nord(LAT, 15)], { parcelle: { geometry: g(5.4) as never, rattachement: "point" } }));
    assert.equal(contre.etat, "en_limite");
    assert.equal(contre.limite?.cause, "bordure");
    const coupe = lireSynth(entree([est(5.3, LAT, -45), nord(LAT, 15)], { parcelle: { geometry: g(est(5.3, LAT, -60)) as never, rattachement: "point" } }));
    assert.equal(coupe.etat, "en_zone");
    assert.equal(coupe.part, 1);
  });

  test("une cellule pleine : en zone, sans fichier à lire", () => {
    const e = entree([5.25, LAT]);
    assert.deepEqual(tuilesALire(MANIFESTE, e), []);
    assert.equal(lireSynth(e).etat, "en_zone");
  });

  test("une zone à la diffusion ambiguë (« O ») ne décide de rien : incertain", () => {
    const l = lireSynth(entree([5.03, 43.53]));
    assert.equal(l.etat, "incertain");
    assert.equal(l.motifIncertain, "diffusion_ambigue");
  });
});

describe("2. Départements : couvert, non couvert, codes particuliers", () => {
  test("une commune dont l'arrêté exclut tous les bois, où la base publie pourtant une zone : incertain, jamais en zone", () => {
    const m = { ...MANIFESTE, exclusionsArretes: { "13092": "Saint-Chamas" } };
    const l = lireDebroussaillement(m, TUILES, entree([5.04, LAT]));
    assert.equal(l.etat, "incertain");
    assert.equal(l.motifIncertain, "contredit_arrete");
    assert.match(rendreLogement(l), /l'arrêté de classement exclut les bois de cette commune/);
    assert.equal(lireDebroussaillement(m, TUILES, entree([5.04, LAT], { insee: "13091" })).etat, "en_zone", "les autres communes ne sont pas touchées");
    assert.equal(lireDebroussaillement(m, TUILES, entree([est(5.06, LAT, 400), LAT])).etat, "hors_zone", "hors zone reste hors zone");
  });

  test("hors zone dans un département sans zonage publié : non couvert, jamais « hors zone »", () => {
    const l = lireSynth(entree([est(5.06, LAT, 400), LAT], { insee: "69123" }));
    assert.equal(l.etat, "non_couvert");
    assert.equal(l.departement, "69");
    assert.equal(l.profilDepartement, null);
  });

  test("commune inconnue : rien n'est conclu hors zone (non couvert, département inconnu)", () => {
    const l = lireSynth(entree([est(5.06, LAT, 400), LAT], { insee: null }));
    assert.equal(l.etat, "non_couvert");
    assert.equal(l.departement, null);
  });

  test("la géométrie prime : un point dans une zone publiée est en zone, quelle que soit la commune transmise", () => {
    assert.equal(lireSynth(entree([5.04, LAT], { insee: "69123" })).etat, "en_zone");
  });

  test("codes Insee : Corse, outre-mer, arrondissements", () => {
    assert.equal(departementInsee("2A004"), "2A");
    assert.equal(departementInsee("2b033"), "2B");
    assert.equal(departementInsee("97411"), "974");
    assert.equal(departementInsee("13201"), "13");
    assert.equal(departementInsee("33529"), "33");
    assert.equal(departementInsee("abc"), null);
    assert.equal(departementInsee(null), null);
  });
});

describe("3. À la parcelle : part, bordure, contact, microchevauchement, voisinage", () => {
  const sw = (dx: number) => [est(5.06, 43.43, dx), 43.43] as const;
  const avecParcelle = (g: unknown, point: [number, number], o: Partial<NonNullable<EntreeDebroussaillement["parcelle"]>> = {}) =>
    lireSynth(entree(point, { parcelle: { geometry: g as never, rattachement: "point", ...o } }));

  test("parcelle entièrement dans la zone : en zone, part 1", () => {
    const [lon, lat] = sw(-200);
    const l = avecParcelle(parcelleCarree(lon, lat, 40), [est(lon, lat, 20), nord(lat, 20)]);
    assert.equal(l.grain, "parcelle");
    assert.equal(l.etat, "en_zone");
    assert.equal(l.part, 1);
  });

  test("parcelle à cheval sur la limite : en limite (l'obligation suit les constructions), part ≈ 50 % dite", () => {
    const [lon, lat] = sw(-20);
    const l = avecParcelle(parcelleCarree(lon, lat, 40), [est(lon, lat, 10), nord(lat, 20)]);
    assert.equal(l.etat, "en_limite");
    assert.equal(l.limite?.cause, "a_cheval");
    assert.ok(l.part! > 0.45 && l.part! < 0.55, `part ${l.part}`);
    assert.match(rendreLogement(l), /Terrain à cheval sur la limite du zonage/);
    assert.match(rendreLogement(l), /environ 50 % de la parcelle est dans une zone où le débroussaillement est obligatoire : selon les règles qui s'appliquent à ce terrain, tout ou partie du bien peut être concerné/);
    assert.match(rendreLogement(l), /le débroussaillement autour des constructions, et, si le terrain est en zone urbaine \(avec ou sans plan local d'urbanisme\), l'obligation sur tout le terrain/);
    assert.doesNotMatch(rendreLogement(l), /selon l'emplacement des constructions/, "revue du 28/10/2026 : pas seulement les constructions (L134-6, 3°)");
  });

  test("parcelle à 99 % dans la zone : le reste de 1 % est l'écart de tracé (FUT-81), en zone", () => {
    const [lon, lat] = sw(-99.5);
    const l = avecParcelle(parcelleCarree(lon, lat, 100), [est(lon, lat, 50), nord(lat, 50)]);
    assert.equal(l.etat, "en_zone");
    assert.ok(l.part! >= 0.98 && l.part! < 1, `part ${l.part}`);
  });

  test("contact exact (la parcelle partage la limite) : en limite, « touche la limite », jamais en zone", () => {
    const [lon, lat] = sw(0);
    const l = avecParcelle(parcelleCarree(lon, lat, 40), [est(lon, lat, 20), nord(lat, 20)]);
    assert.equal(l.etat, "en_limite");
    assert.equal(l.limite?.cause, "bordure");
    assert.match(rendreLogement(l), /touche la limite d'une zone/);
    assert.doesNotMatch(rendreLogement(l), /à environ \d+ m/);
  });

  test("microchevauchement (1 cm sur 40 m) : en limite, jamais en zone", () => {
    const [lon, lat] = sw(-0.01);
    const l = avecParcelle(parcelleCarree(lon, lat, 40), [est(lon, lat, 20), nord(lat, 20)]);
    assert.equal(l.etat, "en_limite");
    assert.equal(l.limite?.cause, "bordure");
    assert.ok((l.surfaceM2 ?? 0) < 1, `surface ${l.surfaceM2}`);
  });

  test("liseré d'1 m (40 m², moins de 2 % d'une parcelle de 2 400 m²) : en limite, surface dite", () => {
    const [lon, lat] = sw(-1);
    const l = avecParcelle(parcelleCarree(lon, lat, 60, 40), [est(lon, lat, 30), nord(lat, 20)]);
    assert.equal(l.etat, "en_limite");
    assert.ok(Math.abs((l.surfaceM2 ?? 0) - 40) < 1, `surface ${l.surfaceM2}`);
    assert.match(rendreLogement(l), /ne touche qu'en bordure une zone où le débroussaillement est obligatoire \(environ 40 m²\)/);
  });

  test("à 20 m de la zone, sans la toucher : en limite, distance dite depuis la parcelle", () => {
    const [lon, lat] = sw(20);
    const l = avecParcelle(parcelleCarree(lon, lat, 30), [est(lon, lat, 15), nord(lat, 15)]);
    assert.equal(l.etat, "en_limite");
    assert.deepEqual(l.limite, { cause: "parcelle_proche", distanceM: 20 });
    assert.match(rendreLogement(l), /La parcelle est à environ 20 m d'une zone/);
  });

  test("à 100 m de la zone : hors zone", () => {
    const [lon, lat] = sw(100);
    assert.equal(avecParcelle(parcelleCarree(lon, lat, 30), [est(lon, lat, 15), nord(lat, 15)]).etat, "hors_zone");
  });

  test("la parcelle prime sur le point : point à 10 m de la limite, parcelle entièrement dedans", () => {
    const [lon, lat] = sw(-60);
    const l = avecParcelle(parcelleCarree(lon, lat, 55), [est(5.06, lat, -10), nord(lat, 20)]);
    assert.equal(l.etat, "en_zone");
    assert.equal(l.part, 1);
  });

  test("parcelle à cheval sur une coupe de tuile : les deux morceaux s'additionnent, part 1", () => {
    const lon = est(5.1, LAT, -20);
    const l = avecParcelle(parcelleCarree(lon, LAT, 40), [est(lon, LAT, 20), nord(LAT, 20)]);
    assert.equal(l.etat, "en_zone");
    assert.equal(l.part, 1);
  });

  test("parcelle invalide (anneau croisé) : lecture au point, dite", () => {
    const [lon, lat] = sw(-200);
    const g = { type: "Polygon", coordinates: [[[lon, lat], [est(lon, lat, 40), nord(lat, 40)], [est(lon, lat, 40), lat], [lon, nord(lat, 40)], [lon, lat]]] };
    const l = avecParcelle(g, [est(lon, lat, 20), nord(lat, 20)]);
    assert.equal(l.grain, "point");
    assert.equal(l.parcelleEcartee, "non_mesurable");
    assert.match(rendreLogement(l), /Le tracé de la parcelle n'a pas pu être mesuré/);
  });

  test("aucun rattachement positif à une parcelle voisine : repli et limite de deux parcelles se lisent au point", () => {
    const [lon, lat] = sw(-20);
    const point: [number, number] = [est(5.06, lat, 200), nord(lat, 20)]; // le point est loin de la zone
    const repli = avecParcelle(parcelleCarree(lon, lat, 40), point, { rattachement: "repli" });
    assert.equal(repli.grain, "point");
    assert.equal(repli.parcelleEcartee, "repli");
    assert.equal(repli.etat, "hors_zone", "la parcelle voisine, à cheval sur la zone, n'est pas attribuée au bien");
    const limite = avecParcelle(parcelleCarree(lon, lat, 40), point, { candidatsAuPoint: 2 });
    assert.equal(limite.parcelleEcartee, "limite");
    assert.equal(limite.etat, "hors_zone");
  });

  test("revue du 29/10/2026 : une parcelle voisine marquée « point » mais qui ne contient pas le point n'est jamais attribuée", () => {
    // La parcelle est entièrement dans la zone ; le point de l'adresse est à 200 m, hors zone.
    const [lon, lat] = sw(-200);
    const point: [number, number] = [est(5.06, lat, 200), nord(lat, 20)];
    const l = avecParcelle(parcelleCarree(lon, lat, 40), point, { rattachement: "point", candidatsAuPoint: 1 });
    assert.equal(l.grain, "point");
    assert.equal(l.parcelleEcartee, "hors_point");
    assert.equal(l.etat, "hors_zone", "le zonage de la parcelle voisine n'est pas attribué au logement");
    assert.equal(l.part, null);
    assert.match(rendreLogement(l), /La parcelle transmise ne contient pas le point de l'adresse et pourrait être celle d'un voisin/);
    // Et la parcelle voisine à cheval, point en zone : la lecture au point, jamais la part de la voisine.
    const [lon2, lat2] = sw(-20);
    const voisine = avecParcelle(parcelleCarree(lon2, lat2, 40), [est(5.06, lat2, -300), nord(lat2, 20)]);
    assert.equal(voisine.parcelleEcartee, "hors_point");
    assert.equal(voisine.etat, "en_zone");
    assert.equal(voisine.limite, null);
  });

  test("revue du 29/10/2026 : un point posé sur la limite de la parcelle (un seul candidat transmis) se lit au point", () => {
    const [lon, lat] = sw(-200);
    const l = avecParcelle(parcelleCarree(lon, lat, 40), [lon, nord(lat, 20)], { candidatsAuPoint: 1 });
    assert.equal(l.grain, "point");
    assert.equal(l.parcelleEcartee, "limite");
  });

  test("R6 (contre-revue du 30/10/2026) : un point sur la limite de sa SEULE parcelle ne parle pas de « deux parcelles »", () => {
    const [lon, lat] = sw(-200);
    const g = parcelleCarree(lon, lat, 40);
    // Sur le bord ouest de la parcelle, un seul candidat transmis : le voisin peut être la voie publique.
    const seul = avecParcelle(g, [lon, nord(lat, 20)], { candidatsAuPoint: 1 });
    const deux = avecParcelle(g, [est(5.06, lat, 200), nord(lat, 20)], { candidatsAuPoint: 2 });
    for (const l of [seul, deux]) {
      assert.equal(l.parcelleEcartee, "limite");
      assert.doesNotMatch(rendreLogement(l), /deux parcelles/);
      assert.match(rendreLogement(l), /Le point de l'adresse tombe sur une limite de parcelle : la lecture porte sur ce point/);
    }
  });

  test("géocodage à la rue : secteur, parcelle ignorée, et dit", () => {
    const [lon, lat] = sw(-20);
    const l = lireSynth(entree([est(lon, lat, 10), nord(lat, 20)], { geocodage: "street", parcelle: { geometry: parcelleCarree(lon, lat, 40) as never, rattachement: "point" } }));
    assert.equal(l.grain, "point");
    assert.equal(l.portee, "secteur");
    assert.match(rendreLogement(l), /géocodée sans numéro/);
  });

  test("parcelle immense (plus de quatre tuiles) : lecture au point, dite", () => {
    const g = parcelleCarree(4.98, 43.38, 25_000);
    const l = lireSynth(entree([5.04, LAT], { parcelle: { geometry: g as never, rattachement: "point" } }));
    assert.equal(l.parcelleEcartee, "etendue");
    assert.equal(l.etat, "en_zone");
    assert.match(rendreLogement(l), /trop étendue/);
  });
});

describe("4. Panne, données absentes, dossiers antérieurs", () => {
  test("un manifeste illisible est une panne, jamais une absence de zone", () => {
    for (const m of [null, undefined, {}, { ...MANIFESTE, format: "autre" }, { ...MANIFESTE, couverture: [] }, "texte"]) {
      const l = lireDebroussaillement(m, TUILES, entree([5.04, LAT]));
      assert.equal(l.statut, "indisponible");
      assert.match(rendreAutour(l), /n'a pas pu être lu pour ce secteur/);
      assert.match(rendreLogement(l), /n'a pas pu être lu pour ce logement/);
      assert.doesNotMatch(rendreAutour(l) + rendreLogement(l), /hors du zonage|n'est pas dans le zonage|Aucun zonage/);
    }
  });

  test("une tuile listée mais non chargée est une panne, pas une absence", () => {
    const l = lireDebroussaillement(MANIFESTE, new Map(), entree([5.04, LAT]));
    assert.equal(l.statut, "indisponible");
  });

  test("une cellule absente du manifeste est une absence établie (aucune tuile à lire)", () => {
    const e = entree([5.95, LAT]);
    assert.deepEqual(tuilesALire(MANIFESTE, e), []);
    assert.equal(lireDebroussaillement(MANIFESTE, new Map(), e).etat, "hors_zone");
  });

  test("validité du manifeste et des tuiles", () => {
    assert.ok(manifesteValide(MANIFESTE));
    assert.ok(tuileValide(TUILES.get("50_434"), { edition: "2026-03-01", ix: 50, iy: 434, profils: 2 }));
    assert.ok(!tuileValide(TUILES.get("50_434"), { edition: "2026-03-01", ix: 51, iy: 434, profils: 2 }), "mauvaise cellule");
    assert.ok(!tuileValide(TUILES.get("50_434"), { edition: "2025-02-01", ix: 50, iy: 434, profils: 2 }), "autre édition");
    assert.ok(!tuileValide({ ...TUILES.get("50_434")!, morceaux: [{ p: 9, o: "A", r: [rect(5, 43, 5.01, 43.01)] }] }, { edition: "2026-03-01", ix: 50, iy: 434, profils: 2 }), "profil inconnu");
  });

  const base = { address: { id: "x", label: "x", city: null, citycode: null, postcode: null, latitude: 43, longitude: 5 } } as LogementReport;
  const panne = () => lireDebroussaillement(null, TUILES, entree([5.04, LAT]));

  test("une panne est une source muette ; « hors zone » et « non couvert » n'en sont pas", () => {
    assert.ok(sourcesAbsentes({ ...base, debroussaillement: panne() }).includes("debroussaillement"));
    assert.ok(!sourcesAbsentes({ ...base, debroussaillement: lireSynth(entree([est(5.06, LAT, 400), LAT])) }).includes("debroussaillement"));
    assert.ok(!sourcesAbsentes({ ...base, debroussaillement: lireSynth(entree([est(5.06, LAT, 400), LAT], { insee: "69123" })) }).includes("debroussaillement"));
    assert.ok(!sourcesAbsentes(base).includes("debroussaillement"), "un rapport antérieur ne s'invente pas de panne");
  });

  test("actualisation : une panne ne remplace pas une version ; une lecture à la parcelle ne cède pas au point ; une lecture désactivée ne l'efface pas", () => {
    const version = (r: LogementReport): VersionLogement => ({ numero: 1, collecteeLe: "2026-10-28", sourcesAbsentes: sourcesAbsentes(r), synthese: null, syntheseHash: null, report: r, reportHash: "h1", syntheseDpe: null });
    assert.equal(issueActualisation({ ...base, debroussaillement: panne() }, "h2", version(base)), "refusee");
    assert.equal(issueActualisation({ ...base, debroussaillement: lireSynth(entree([5.04, LAT])) }, "h2", version(base)), "nouvelle_version");
    // Lecture jamais activée : un rapport existant (sans le champ) reste actualisable, et sa nouvelle version non plus n'a pas le champ.
    assert.equal(issueActualisation(base, "h2", version(base)), "nouvelle_version");
    const [lon, lat] = [est(5.06, 43.43, -200), 43.43];
    const aParcelle = { ...base, debroussaillement: lireSynth(entree([est(lon, lat, 20), nord(lat, 20)], { parcelle: { geometry: parcelleCarree(lon, lat, 40) as never, rattachement: "point" } })) };
    assert.equal(aParcelle.debroussaillement.grain, "parcelle");
    assert.equal(issueActualisation({ ...base, debroussaillement: lireSynth(entree([est(lon, lat, 20), nord(lat, 20)])) }, "h2", version(aParcelle)), "refusee");
    assert.equal(issueActualisation(base, "h2", version(aParcelle)), "refusee", "la lecture désactivée n'efface pas une version qui l'avait");
  });

  test("un rapport collecté avant FUT-149 n'affiche rien du débroussaillement, ni zone, ni « hors zone », ni panne", () => {
    assert.equal(rendreLogement(undefined), "");
    assert.equal(rendreAutour(null), "");
    const georisques = { address: { risks: { labels: [] }, pprn: { labels: [] }, regulatoryPlans: [], rga: null, seismic: null } };
    const sans = rendreSection({ georisques, heritage: { items: [], sourceStatus: "ok" } });
    assert.doesNotMatch(sans, /débroussaill/i);
    const avec = rendreSection({ georisques, heritage: { items: [], sourceStatus: "ok" }, debroussaillement: lireSynth(entree([5.04, LAT])) });
    assert.match(avec, /Débroussaillement Adresse dans le zonage publié/);
  });

  test("chaque lecture porte sa convention et sa source datée", () => {
    const l = lireSynth(entree([5.04, LAT]));
    assert.equal(l.convention, DEBROUSSAILLEMENT_CONVENTION);
    assert.equal(l.source?.edition, "2026-03-01");
    assert.match(rendreLogement(l), /édition du 1er mars 2026/);
    assert.match(rendreAutour(l), /édition du 1er mars 2026/);
  });
});

describe("5. Ce que les textes disent, et ne disent jamais", () => {
  const cas: [string, LectureDebroussaillement][] = [
    ["en zone (point)", lireSynth(entree([5.04, LAT]))],
    ["en limite (dedans)", lireSynth(entree([est(5.06, LAT, -20), LAT]))],
    ["en limite (dehors)", lireSynth(entree([est(5.06, LAT, 30), LAT]))],
    ["hors zone", lireSynth(entree([est(5.06, LAT, 400), LAT]))],
    ["non couvert", lireSynth(entree([est(5.06, LAT, 400), LAT], { insee: "69123" }))],
    ["incertain", lireSynth(entree([5.03, 43.53]))],
    ["indisponible", lireDebroussaillement(null, TUILES, entree([5.04, LAT]))],
  ];

  test("chaque état a ses propres phrases : une panne, une couverture absente, une absence réelle se distinguent", () => {
    const autour = cas.map(([, l]) => texteAutour(l)!.retenir);
    const logement = cas.map(([, l]) => texteLogement(l)!.retenir);
    assert.equal(new Set(autour).size, cas.length, autour.join("\n"));
    assert.equal(new Set(logement).size, cas.length, logement.join("\n"));
  });

  test("aucun texte ne dit un danger, un bois, une absence d'obligation, un certificat ou un nombre de mètres imposé", () => {
    for (const [nom, l] of cas) {
      const a = rendreAutour(l);
      const g = rendreLogement(l);
      assert.ok(a.length > 0 && g.length > 0, nom);
      sansInterdit(a);
      sansInterdit(g);
    }
  });

  test("Autour parle du secteur : ni parcelle, ni vendeur, ni état des risques", () => {
    for (const [nom, l] of cas) {
      const t = texteAutour(l)!;
      const visible = [t.retenir, t.limite, t.verifier].join(" ");
      assert.doesNotMatch(visible, /parcelle|vendeur|bailleur|état des risques/i, nom);
    }
  });

  test("en zone, le Logement dit la vérification concrète : zonage officiel, arrêté du préfet, état des risques du vendeur", () => {
    const t = texteLogement(cas[0][1])!;
    assert.match(t.verifier!, /zonage officiel sur Géorisques/);
    assert.match(t.verifier!, /les règles qui s'appliquent \(arrêté du préfet, décisions du maire sur la distance\)/);
    assert.match(t.verifier!, /vendeur ou au bailleur l'état des risques/);
    assert.match(t.limite!, /indicatif : seuls l'arrêté du préfet et le code forestier font foi/);
    assert.match(t.limite!, /ne mesure pas le danger d'incendie/);
  });

  test("revue du 28/10/2026 : 100 m par le maire, terrain en zone urbaine, responsable selon la situation, jamais « à la charge du propriétaire »", () => {
    for (const [, l] of cas) {
      for (const t of [texteAutour(l)!, texteLogement(l)!]) {
        const tout = [t.retenir, t.limite, t.verifier, ...t.savoirPlus].join(" ");
        assert.doesNotMatch(tout, /à la charge du propriétaire/);
        assert.doesNotMatch(tout, /si le préfet le décide|préfet[^.]*100 m/);
      }
    }
    // Revue du 29/10/2026 : deux obligations DISTINCTES, chacune avec son responsable (L134-6 1° et 3°, L134-8).
    const regle = texteLogement(cas[0][1])!.savoirPlus.join(" ");
    assert.match(regle, /deux obligations distinctes/);
    assert.match(regle, /Autour des constructions, sur 50 m, que le maire peut porter à 100 m : elle incombe au propriétaire des constructions/);
    assert.match(regle, /Sur les terrains situés en zone urbaine, que la commune ait un plan local d'urbanisme ou non, sur la totalité du terrain, bâti ou non, quelle que soit cette distance : elle incombe au propriétaire du terrain/);
    assert.match(regle, /articles L134-6 et L134-8/);
    assert.doesNotMatch(regle, /dans une zone urbaine, il peut porter/, "l'ancienne formulation confondait les deux obligations");
  });

  test("R5 (contre-revue du 30/10/2026) : l'obligation sur tout le terrain vaut aussi dans les zones urbaines des communes SANS plan local d'urbanisme (L134-6, 4°)", () => {
    // Une parcelle à cheval sur la zone A (la moitié dedans) : c'est elle qui porte la vérification « à cheval ».
    const [lon, lat] = [est(5.06, 43.43, -20), 43.43];
    const aCheval = lireSynth(entree([est(lon, lat, 10), nord(lat, 20)], { parcelle: { geometry: parcelleCarree(lon, lat, 40) as never, rattachement: "point" } }));
    assert.equal(aCheval.limite?.cause, "a_cheval");
    for (const [nom, l] of [...cas, ["à cheval", aCheval] as const]) {
      for (const t of [texteAutour(l), texteLogement(l)]) {
        if (!t) continue;
        const tout = [t.retenir, t.limite, t.verifier, ...t.savoirPlus].join(" ");
        // Chaque mention de la zone urbaine couvre les deux cas (3° et 4°) : jamais réservée aux communes dotées d'un PLU.
        assert.doesNotMatch(tout, /zone urbaine d'un plan local d'urbanisme/, `${nom} : le 4° de L134-6 manquait`);
        for (const m of tout.matchAll(/zone urbaine[^.:;]*/g)) assert.match(m[0], /plan local d'urbanisme ou non|avec ou sans plan local d'urbanisme/, `${nom} : ${m[0]}`);
      }
    }
    // Les deux responsables restent distincts (L134-8, 1° et 2°).
    assert.match(texteLogement(cas[0][1])!.retenir, /le propriétaire des constructions pour leurs abords, celui du terrain s'il est en zone urbaine \(avec ou sans plan local d'urbanisme\)/);
  });

  test("revue du 29/10/2026 : le constat dit toujours que le zonage est informatif, jamais une décision définitive", () => {
    for (const [nom, l] of cas.filter(([n]) => n.startsWith("en zone") || n.startsWith("en limite"))) {
      const tl = texteLogement(l)!;
      const ta = texteAutour(l)!;
      if (nom === "en zone (point)") {
        assert.match(tl.retenir, /^Selon le zonage informatif publié par l'État/);
        assert.match(ta.retenir, /selon le zonage informatif publié par l'État/);
      }
      assert.match([tl.limite, tl.verifier].join(" "), /indicatif|zonage officiel/, nom);
    }
  });

  test("la règle générale (50 m, 200 m) et le décret restent dans « En savoir plus », pas dans le constat", () => {
    const t = texteLogement(cas[0][1])!;
    assert.doesNotMatch([t.titre, t.retenir, t.limite, t.verifier].join(" "), /50 m|100 m|200 m|décret/);
    assert.ok(t.savoirPlus.some((l) => /sur 50 m, que le maire peut porter à 100 m/.test(l)));
    assert.ok(t.savoirPlus.some((l) => /décret n° 2024-405 du 29 avril 2024/.test(l)));
  });

  test("le zonage du département est dit : nature, carte des bois, date de l'arrêté (ou son absence)", () => {
    assert.equal(phraseZonage(PROFIL), "Bouches-du-Rhône : zonage établi par la préfecture, à partir d'une carte des bois de 2008 ; arrêté préfectoral du 15 octobre 2025 (date indiquée par la base ; un arrêté plus récent a pu le remplacer).");
    assert.equal(phraseZonage({ ...PROFIL, departement: "77", arrete: null, arreteBrut: null, source: "Zonage IGN" }),
      "Seine-et-Marne : zonage établi par l'IGN, à partir d'une carte des bois de 2008 ; date de l'arrêté préfectoral non renseignée dans la base.");
    assert.equal(phraseZonage({ ...PROFIL, arrete: null, arreteBrut: "Mi-juin 2023" }).endsWith("arrêté préfectoral indiqué « Mi-juin 2023 » dans la base."), true);
  });

  test("une carte des bois ancienne (plus de dix ans) est dite à l'écran ; une récente ne l'est pas", () => {
    assert.match(rendreLogement(cas[0][1]), /s'appuie sur une carte des bois de 2008/);
    const recent = { ...cas[0][1], zone: PROFIL_RECENT, profilDepartement: PROFIL_RECENT };
    assert.doesNotMatch(rendreLogement(recent), /carte des bois de 2021 : un bois/);
  });

  test("le lien ouvre la page de la préfecture ; à défaut, la page officielle de Géorisques", () => {
    assert.equal(texteLogement(cas[0][1])!.document?.url, PROFIL.url);
    const sansUrl = { ...cas[0][1], zone: { ...PROFIL, url: null }, profilDepartement: { ...PROFIL, url: null } };
    assert.match(texteLogement(sansUrl)!.document!.url, /^https:\/\/www\.georisques\.gouv\.fr\//);
    const douteuse = { ...cas[0][1], zone: { ...PROFIL, url: "http://exemple.com/x" }, profilDepartement: null };
    assert.match(texteLogement(douteuse)!.document!.url, /georisques/, "une adresse qui n'est pas un site .gouv.fr n'est jamais proposée");
  });
});

describe("6. Le lecteur serveur : Storage, empreintes, pannes", () => {
  const env = { DEBROUSSAILLEMENT_BUCKET: "debroussaillement", NEXT_PUBLIC_SUPABASE_URL: "https://exemple.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "cle" } as unknown as NodeJS.ProcessEnv;
  function storage(objets: Map<string, Buffer | number>) {
    const appels: string[] = [];
    const f = (async (url: string) => {
      const u = new URL(url);
      const chemin = decodeURIComponent(u.pathname.replace(/^\/storage\/v1\/object\/debroussaillement\//, ""));
      appels.push(chemin + u.search);
      const o = objets.get(chemin);
      if (o == null) return new Response("absent", { status: 400 });
      if (typeof o === "number") return new Response("panne", { status: o });
      return new Response(new Uint8Array(o));
    }) as unknown as typeof fetch;
    return { f, appels };
  }
  const brutManifeste = Buffer.from(JSON.stringify(MANIFESTE));
  const pointeurVers = (edition: string, brut: Buffer) =>
    Buffer.from(JSON.stringify({ format: FORMAT_TUILES_DEBROUSSAILLEMENT, edition, manifeste: createHash("sha256").update(brut).digest("hex") }));
  const objets = () => new Map<string, Buffer | number>([
    ["courant.json", pointeurVers("2026-03-01", brutManifeste)],
    ["2026-03-01/manifest.json", brutManifeste],
    ...[...TUILES].map(([k, t]) => [`2026-03-01/t/${k}.json.gz`, empreinte(t).brut] as [string, Buffer]),
  ]);
  /** Avance l'horloge du lecteur (le pointeur est gardé dix minutes). */
  async function plusTard<T>(minutes: number, f: () => Promise<T>): Promise<T> {
    const vrai = Date.now;
    Date.now = () => vrai() + minutes * 60_000;
    try { return await f(); } finally { Date.now = vrai; }
  }

  test("non configuré : rien n'est lu, rien n'est écrit (undefined), aucun appel réseau", async () => {
    let appels = 0;
    const espion = (async () => { appels++; return new Response("{}"); }) as unknown as typeof fetch;
    assert.equal(await lecteur.lireDebroussaillementAdresse(entree([5.04, LAT]), {} as NodeJS.ProcessEnv, espion), undefined);
    // Les autres variables du projet présentes, seule DEBROUSSAILLEMENT_BUCKET manque : toujours rien.
    const sansBucket = { ...env, DEBROUSSAILLEMENT_BUCKET: undefined } as unknown as NodeJS.ProcessEnv;
    assert.equal(await lecteur.lireDebroussaillementAdresse(entree([5.04, LAT]), sansBucket, espion), undefined);
    assert.equal(appels, 0);
  });

  test("lecture réelle : pointeur, manifeste, une tuile ; le résultat est celui de la lib pure", async () => {
    lecteur.oublierDebroussaillement();
    const s = storage(objets());
    const l = await lecteur.lireDebroussaillementAdresse(entree([5.04, LAT]), env, s.f);
    assert.deepEqual(l, lireSynth(entree([5.04, LAT])));
    assert.deepEqual(s.appels.map((a) => a.replace(/\?.*$/, "")), ["courant.json", "2026-03-01/manifest.json", "2026-03-01/t/50_434.json.gz"]);
    // Pointeur et manifeste lus à l'origine (contournement du CDN) ; la tuile, immuable, garde le cache.
    assert.match(s.appels[0], /cacheNonce=\d+/);
    assert.doesNotMatch(s.appels[2], /cacheNonce/);
    // Seconde lecture : tout est en mémoire.
    await lecteur.lireDebroussaillementAdresse(entree([5.04, LAT]), env, s.f);
    assert.equal(s.appels.length, 3);
  });

  test("une tuile dont l'empreinte diffère, une panne HTTP, un pointeur illisible : indisponible, jamais hors zone", async () => {
    for (const casse of [
      (o: Map<string, Buffer | number>) => o.set("2026-03-01/t/50_434.json.gz", gzipSync(Buffer.from("{}"))),
      (o: Map<string, Buffer | number>) => o.set("2026-03-01/t/50_434.json.gz", 500),
      (o: Map<string, Buffer | number>) => o.set("courant.json", Buffer.from("{\"format\":\"x\"}")),
      (o: Map<string, Buffer | number>) => o.delete("2026-03-01/manifest.json"),
      // Un pointeur sans l'empreinte du manifeste (format antérieur au 30/10/2026) : rien n'est lu.
      (o: Map<string, Buffer | number>) => o.set("courant.json", Buffer.from(JSON.stringify({ format: FORMAT_TUILES_DEBROUSSAILLEMENT, edition: "2026-03-01" }))),
      // Un manifeste en ligne qui n'est pas celui que désigne le pointeur.
      (o: Map<string, Buffer | number>) => o.set("2026-03-01/manifest.json", Buffer.from(JSON.stringify({ ...MANIFESTE, couverture: ["13", "84"] }))),
    ]) {
      lecteur.oublierDebroussaillement();
      const o = objets();
      casse(o);
      const l = await lecteur.lireDebroussaillementAdresse(entree([5.04, LAT]), env, storage(o).f);
      assert.equal(l?.statut, "indisponible");
    }
  });

  test("R2 (contre-revue du 30/10/2026) : passé dix minutes, seul le pointeur est relu ; le manifeste ne l'est que s'il change", async () => {
    lecteur.oublierDebroussaillement();
    const o = objets();
    const s = storage(o);
    const e = entree([5.04, LAT]);
    await lecteur.lireDebroussaillementAdresse(e, env, s.f);
    assert.equal(s.appels.length, 3);
    // Onze minutes plus tard, même édition : un seul appel, le pointeur (à l'origine).
    const l = await plusTard(11, () => lecteur.lireDebroussaillementAdresse(e, env, s.f));
    assert.deepEqual(l, lireSynth(e));
    assert.equal(s.appels.length, 4);
    assert.match(s.appels[3], /^courant\.json\?cacheNonce=\d+$/);
    // Moins de dix minutes : rien n'est relu.
    await plusTard(5, () => lecteur.lireDebroussaillementAdresse(e, env, s.f));
    assert.equal(s.appels.length, 4);
  });

  test("R2 : une bascule vers une autre édition est vue au plus tard au bout de dix minutes, avec son manifeste et ses tuiles, jamais un mélange", async () => {
    lecteur.oublierDebroussaillement();
    const o = objets();
    const s = storage(o);
    const e = entree([5.04, LAT]);
    const avant = await lecteur.lireDebroussaillementAdresse(e, env, s.f);
    assert.equal(avant?.source?.edition, "2026-03-01");
    // Une révision publiée sous un préfixe neuf : même contenu de tuiles, autre identifiant.
    const tuiles2 = new Map([...TUILES].map(([k, t]) => [k, { ...t, edition: "2026-03-01.2" }]));
    const m2 = { ...MANIFESTE, edition: "2026-03-01.2", tuiles: { ...MANIFESTE.tuiles } };
    for (const [k, t] of tuiles2) { const x = empreinte(t); m2.tuiles[k] = { octets: x.brut.length, sha256: x.sha256 }; o.set(`2026-03-01.2/t/${k}.json.gz`, x.brut); }
    const brut2 = Buffer.from(JSON.stringify(m2));
    o.set("2026-03-01.2/manifest.json", brut2);
    o.set("courant.json", pointeurVers("2026-03-01.2", brut2));
    // Avant dix minutes : l'instance lit encore l'ancienne édition, entière et cohérente.
    assert.equal((await plusTard(5, () => lecteur.lireDebroussaillementAdresse(e, env, s.f)))?.source?.edition, "2026-03-01");
    const apres = await plusTard(11, () => lecteur.lireDebroussaillementAdresse(e, env, s.f));
    assert.equal(apres?.statut, "lu");
    assert.equal(apres?.source?.edition, "2026-03-01.2");
    assert.deepEqual(s.appels.slice(3).map((a) => a.replace(/\?.*$/, "")), ["courant.json", "2026-03-01.2/manifest.json", "2026-03-01.2/t/50_434.json.gz"]);
  });

  test("R2 : deux lectures simultanées d'une instance froide ne téléchargent le manifeste qu'une fois", async () => {
    lecteur.oublierDebroussaillement();
    const s = storage(objets());
    await Promise.all([lecteur.lireDebroussaillementAdresse(entree([5.04, LAT]), env, s.f), lecteur.lireDebroussaillementAdresse(entree([5.04, LAT]), env, s.f)]);
    assert.equal(s.appels.filter((a) => a.startsWith("2026-03-01/manifest.json")).length, 1);
  });

  test("R4 : un identifiant d'édition réutilisé avec un autre contenu n'est jamais mélangé avec ce que l'instance a gardé en mémoire", async () => {
    lecteur.oublierDebroussaillement();
    const o = objets();
    const s = storage(o);
    const e = entree([5.04, LAT]);
    const avant = await lecteur.lireDebroussaillementAdresse(e, env, s.f);
    assert.equal(avant?.etat, "en_zone");
    // Purge, puis republication SOUS LE MÊME NOM d'une tuile sans aucune zone (hors protocole) et de son manifeste.
    const vide = { ...TUILES.get("50_434")!, morceaux: TUILES.get("50_434")!.morceaux.slice(0, 0) };
    const x = empreinte(vide);
    const m = { ...MANIFESTE, tuiles: { ...MANIFESTE.tuiles, "50_434": { octets: x.brut.length, sha256: x.sha256 } } };
    const brut = Buffer.from(JSON.stringify(m));
    o.set("2026-03-01/t/50_434.json.gz", x.brut);
    o.set("2026-03-01/manifest.json", brut);
    o.set("courant.json", pointeurVers("2026-03-01", brut));
    const apres = await plusTard(11, () => lecteur.lireDebroussaillementAdresse(e, env, s.f));
    // L'ancienne tuile gardée en mémoire n'est pas servie au nouveau manifeste : la nouvelle est relue.
    assert.deepEqual(apres, lireDebroussaillement(m, new Map([["50_434", vide]]), e));
    assert.notEqual(apres?.etat, "en_zone");
    assert.equal(s.appels.filter((a) => a.startsWith("2026-03-01/t/50_434")).length, 2);
  });

  test("délai de 4 s : un Storage qui ne répond pas rend indisponible", async () => {
    lecteur.oublierDebroussaillement();
    const f = ((_u: string, init: RequestInit) => new Promise((_, rej) => init.signal?.addEventListener("abort", () => rej(new Error("délai"))))) as unknown as typeof fetch;
    const l = await lecteur.lireDebroussaillementAdresse(entree([5.04, LAT]), env, f);
    assert.equal(l?.statut, "indisponible");
  });
});

// ════════════════════════════════════════════════════════════════════════════════════════════
// Les adresses réelles, contre l'oracle tiré des tuiles officielles.
// ════════════════════════════════════════════════════════════════════════════════════════════
const DOSSIER = "src/lib/__fixtures__/fut149";
const REEL = existsSync(`${DOSSIER}/tuiles/manifest.json`)
  ? JSON.parse(readFileSync(`${DOSSIER}/tuiles/manifest.json`, "utf8")) as ManifesteDebroussaillement & { cellulesExtraites: string[] }
  : null;
const TUILES_REELLES = new Map<string, TuileDebroussaillement>(
  REEL ? Object.keys(REEL.tuiles).filter((k) => !("plein" in REEL.tuiles[k]))
    .map((k) => [k, JSON.parse(gunzipSync(readFileSync(`${DOSSIER}/tuiles/t/${k}.json.gz`)).toString("utf8"))]) : [],
);
type Fixture = { q: string; ban: { label: string; type: string; citycode: string; lon: number; lat: number }; parcelle: { geometry: unknown; rattachement: "point" | "repli"; candidatsAuPoint?: number } | null };
const fixture = (c: string): Fixture => JSON.parse(readFileSync(`${DOSSIER}/adresses/${c}.json`, "utf8"));
function entreeReelle(c: string, o: { sansParcelle?: boolean } = {}): EntreeDebroussaillement {
  const x = fixture(c);
  return {
    point: [x.ban.lon, x.ban.lat], geocodage: x.ban.type, insee: x.ban.citycode,
    parcelle: x.parcelle && !o.sansParcelle ? { geometry: x.parcelle.geometry as never, rattachement: x.parcelle.rattachement, candidatsAuPoint: x.parcelle.candidatsAuPoint } : null,
  };
}
const lireReel = (c: string, o: { sansParcelle?: boolean } = {}) => lireDebroussaillement(REEL, TUILES_REELLES, entreeReelle(c, o));
const CAS = existsSync(`${DOSSIER}/adresses`) ? readdirSync(`${DOSSIER}/adresses`).map((f) => f.replace(/\.json$/, "")).sort() : [];

/** L'oracle : le point est-il dans un morceau de zone ? Point dans polygone en ENTIERS (1e-7 degré), sans projection. */
function oracleDedans([lon, lat]: [number, number]): boolean {
  const [x, y] = [Math.round(lon * E), Math.round(lat * E)];
  const k = cleTuile(Math.floor(lon * 10), Math.floor(lat * 10));
  const t = REEL!.tuiles[k];
  if (!t) return false;
  if ("plein" in t) return true;
  return TUILES_REELLES.get(k)!.morceaux.some((m) => {
    const anneaux = m.r.map((code) => {
      const pts: number[][] = [[code[0], code[1]]];
      for (let i = 2; i < code.length; i += 2) pts.push([pts[pts.length - 1][0] + code[i], pts[pts.length - 1][1] + code[i + 1]]);
      return pts;
    });
    const dans = (a: number[][]) => {
      let d = false;
      for (let i = 0, j = a.length - 1; i < a.length; j = i++) {
        if ((a[i][1] > y) !== (a[j][1] > y) && x < ((a[j][0] - a[i][0]) * (y - a[i][1])) / (a[j][1] - a[i][1]) + a[i][0]) d = !d;
      }
      return d;
    };
    return dans(anneaux[0]) && !anneaux.slice(1).some(dans);
  });
}

describe("7. Les adresses réelles (BAN et cadastre du 28/10/2026, tuiles de l'édition du 01/03/2026)", { skip: !REEL }, () => {
  test("le jeu extrait couvre toutes les cellules que lisent les adresses de recette", () => {
    for (const c of CAS) {
      for (const e of [entreeReelle(c), entreeReelle(c, { sansParcelle: true })]) {
        for (const k of cellulesDeLecture(e)) assert.ok(REEL!.cellulesExtraites.includes(k), `${c} : cellule ${k} hors du jeu extrait`);
        for (const k of tuilesALire(REEL!, e)) assert.ok(TUILES_REELLES.has(k), `${c} : tuile ${k} absente du jeu extrait`);
      }
    }
  });

  test("au point, la lib et l'oracle concordent sur toutes les adresses (dedans ↔ en zone ou en limite dedans)", () => {
    for (const c of CAS) {
      const e = entreeReelle(c, { sansParcelle: true });
      const l = lireDebroussaillement(REEL, TUILES_REELLES, e);
      const dedans = oracleDedans(e.point);
      if (l.etat === "en_zone") assert.ok(dedans, `${c} : en zone, mais l'oracle dit dehors`);
      if (l.etat === "hors_zone" || l.etat === "non_couvert") assert.ok(!dedans, `${c} : ${l.etat}, mais l'oracle dit dedans`);
      if (l.etat === "en_limite") assert.equal(l.limite?.distanceM == null, dedans, `${c} : en limite, distance ${l.limite?.distanceM}, oracle ${dedans}`);
    }
  });

  const attendu: Record<string, { point: string; logement?: string }> = {
    "la-teste-pyla-en-zone": { point: "en_zone", logement: "en_zone" },
    "la-teste-centre-hors-zone": { point: "hors_zone", logement: "hors_zone" },
    "landiras-en-zone": { point: "en_zone", logement: "en_zone" },
    "gonfaron-en-zone": { point: "en_zone", logement: "en_zone" },
    "gonfaron-hors-zone": { point: "hors_zone" },
    "frejus-en-zone": { point: "en_zone", logement: "en_zone" },
    "frejus-hors-zone": { point: "hors_zone", logement: "hors_zone" },
    "nimes-en-zone": { point: "en_zone", logement: "en_zone" },
    "nimes-hors-zone": { point: "hors_zone", logement: "hors_zone" },
    "oleron-en-zone": { point: "en_zone", logement: "en_zone" },
    "oleron-hors-zone": { point: "hors_zone", logement: "hors_zone" },
    "bordeaux-bourse": { point: "hors_zone", logement: "hors_zone" },
    "lyon-bellecour": { point: "non_couvert", logement: "non_couvert" },
  };
  for (const [c, a] of Object.entries(attendu)) {
    test(`${c} : ${a.point} au point${a.logement ? `, ${a.logement} au Logement` : ""}`, () => {
      assert.equal(lireReel(c, { sansParcelle: true }).etat, a.point);
      if (a.logement) assert.equal(lireReel(c).etat, a.logement);
    });
  }

  test("dans une même commune, deux adresses : dedans et dehors (La Teste-de-Buch, Gonfaron, Fréjus, Nîmes, Saint-Denis-d'Oléron)", () => {
    for (const [dedans, dehors] of [
      ["la-teste-pyla-en-zone", "la-teste-centre-hors-zone"], ["gonfaron-en-zone", "gonfaron-hors-zone"],
      ["frejus-en-zone", "frejus-hors-zone"], ["nimes-en-zone", "nimes-hors-zone"], ["oleron-boudet-13", "oleron-boudet-855"],
    ]) {
      assert.equal(lireReel(dedans, { sansParcelle: true }).statut, "lu");
      assert.notEqual(lireReel(dedans, { sansParcelle: true }).etat, "hors_zone", dedans);
      assert.equal(lireReel(dehors, { sansParcelle: true }).etat, "hors_zone", dehors);
      assert.notEqual(rendreAutour(lireReel(dedans, { sansParcelle: true })), rendreAutour(lireReel(dehors, { sansParcelle: true })));
    }
  });

  test("les adresses en limite ne sont jamais affirmées dans la zone au point", () => {
    for (const c of CAS.filter((x) => /limite/.test(x))) assert.equal(lireReel(c, { sansParcelle: true }).etat, "en_limite", c);
  });

  test("revue du 29/10/2026 : aucune attribution voisine — la parcelle ne sert que si l'oracle confirme qu'elle contient le point", () => {
    // Oracle indépendant : point dans polygone en degrés, sans projection.
    const contient = (p: number[], g: { type: string; coordinates: unknown }) => {
      const polys = (g.type === "Polygon" ? [g.coordinates] : g.coordinates) as number[][][][];
      const dans = (a: number[][]) => {
        let d = false;
        for (let i = 0, j = a.length - 1; i < a.length; j = i++) if ((a[i][1] > p[1]) !== (a[j][1] > p[1]) && p[0] < ((a[j][0] - a[i][0]) * (p[1] - a[i][1])) / (a[j][1] - a[i][1]) + a[i][0]) d = !d;
        return d;
      };
      return polys.some((poly) => dans(poly[0]) && !poly.slice(1).some(dans));
    };
    let parcelles = 0;
    for (const c of CAS) {
      const x = fixture(c);
      const l = lireReel(c);
      if (l.grain === "parcelle") {
        parcelles++;
        assert.ok(x.parcelle && contient([x.ban.lon, x.ban.lat], x.parcelle.geometry as never), `${c} : parcelle attribuée sans contenir le point`);
      }
    }
    assert.ok(parcelles >= 15, `${parcelles} lectures à la parcelle`);
  });

  test("Corse-du-Sud : le code 2A est reconnu comme département couvert", () => {
    const l = lireReel("ajaccio-napoleon", { sansParcelle: true });
    assert.equal(l.departement, "2A");
    assert.notEqual(l.etat, "non_couvert");
  });

  test("Gonfaron : la commune a brûlé, le zonage du Var repose sur une carte des bois de 2008, et l'écran le dit", () => {
    const l = lireReel("gonfaron-en-zone");
    assert.equal(l.zone?.departement, "83");
    assert.equal(l.zone?.millesime, "2008");
    assert.match(rendreLogement(l), /carte des bois de 2008 : un bois a pu apparaître ou disparaître depuis/);
  });

  test("La Teste-de-Buch en zone : le Logement dit le fait, la vérification et l'arrêté de Gironde du 17 octobre 2025", () => {
    const t = rendreLogement(lireReel("la-teste-pyla-en-zone"));
    assert.match(t, /Débroussaillement Terrain dans le zonage publié/);
    assert.match(t, /Selon le zonage informatif publié par l'État, la parcelle est dans une zone où le débroussaillement est obligatoire\. Qui doit débroussailler dépend de la situation : le propriétaire des constructions pour leurs abords, celui du terrain s'il est en zone urbaine \(avec ou sans plan local d'urbanisme\)/);
    assert.match(t, /Gironde : zonage de l'IGN corrigé par la préfecture, à partir d'une carte des bois de 2021 ; arrêté préfectoral du 17 octobre 2025 \(date indiquée par la base/);
    sansInterdit(t);
  });

  test("géocodage à la rue : secteur, sans parcelle", () => {
    const l = lireReel("oleron-boudet-rue");
    assert.equal(l.portee, "secteur");
    assert.equal(l.grain, "point");
  });

  test("Lyon : aucun zonage publié pour le Rhône, et l'écran ne conclut rien", () => {
    const l = lireReel("lyon-bellecour");
    assert.match(rendreLogement(l), /Aucun zonage publié pour ce département Ce qu'il faut retenir La base nationale du débroussaillement ne contient aucune zone pour ce département : rien n'en est conclu pour ce logement/);
    assert.match(rendreAutour(l), /Cela ne prouve pas qu'aucune obligation ne s'applique/);
  });

  test("tous les textes des adresses réelles passent les interdits", () => {
    for (const c of CAS) {
      sansInterdit(rendreAutour(lireReel(c, { sansParcelle: true })));
      sansInterdit(rendreLogement(lireReel(c)));
    }
  });
});
