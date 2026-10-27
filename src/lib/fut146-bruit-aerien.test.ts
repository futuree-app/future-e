import { test, before, describe } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync, readdirSync } from "node:fs";
import {
  lireBruitAerien, jeuValide, precisionDepuisBanId, BRUIT_AERIEN_CONVENTION, LIMITE_PROCHE_M, RAYON_VOISINAGE_M,
  type EntreeBruitAerien, type JeuBruitAerien, type LectureBruitAerien, type ZonePubliee,
} from "./bruit-aerien.ts";
import { texteAutour, texteLogement } from "./bruit-aerien-texte.ts";
import { projectionAutour } from "./geometrie-parcelle.ts";
import { sourcesAbsentes, issueActualisation, type VersionLogement } from "./logement-report-version.ts";
import type { LogementReport } from "./logement-report-types.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-146 (27/10/2026) : LES PLANS DE BRUIT AÉRIEN, LUS SANS DÉPASSER LA PREUVE.
//
// Trois sources de vérité, aucune valeur attendue écrite à la main :
//  1. La copie officielle `data/bruit-aerien.json` (publication DGAC, `scripts/build-bruit-aerien.mjs`).
//  2. Des adresses réelles (`__fixtures__/fut146/`, réponses brutes BAN et cadastre du 27/10/2026), dont la
//     zone attendue est recalculée ici par un oracle INDÉPENDANT (point dans polygone en degrés) sur la copie.
//  3. Des parcelles construites CONTRE un tracé officiel (contact exact, chevauchement de 1 cm, liseré).
//
// « Le bloc apparaît » et « le bloc dit vrai » sont deux assertions distinctes (AGENTS.md) : les textes
// sont vérifiés tels que le lecteur les lit, et pour ce qu'ils ne doivent jamais dire.
// ════════════════════════════════════════════════════════════════════════════════════════════

const jeu = JSON.parse(readFileSync("data/bruit-aerien.json", "utf8")) as JeuBruitAerien;

// ── L'oracle : point dans polygone en degrés, sans projection ni tolérance ────────────────────
type Anneau = number[][];
function dansAnneau([x, y]: number[], a: Anneau): boolean {
  let d = false;
  for (let i = 0, j = a.length - 1; i < a.length; j = i++) {
    if ((a[i][1] > y) !== (a[j][1] > y) && x < ((a[j][0] - a[i][0]) * (y - a[i][1])) / (a[j][1] - a[i][1]) + a[i][0]) d = !d;
  }
  return d;
}
function dansZone(p: number[], z: ZonePubliee): boolean {
  const polys = (z.geometry as { coordinates: number[][][][] }).coordinates;
  return polys.some((poly) => dansAnneau(p, poly[0]) && !poly.slice(1).some((t) => dansAnneau(p, t)));
}
const ORDRE = { peb: ["A", "B", "C", "D"], pgs: ["I", "II", "III"] } as const;
/** Les zones officielles qui contiennent le point, de la plus exposée à la moins exposée. */
function oracle(plan: "peb" | "pgs", p: number[]): string[] {
  const zs = jeu[plan].filter((z) => dansZone(p, z)).map((z) => z.zone);
  return [...new Set(zs)].sort((a, b) => (ORDRE[plan] as readonly string[]).indexOf(a) - (ORDRE[plan] as readonly string[]).indexOf(b));
}

// ── Le rendu (même dispositif que FUT-81) ─────────────────────────────────────────────────────
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

let rendreAutour: (l: LectureBruitAerien | null | undefined) => string;
let rendreLogement: (l: LectureBruitAerien | null | undefined) => string;
let rendreSection: (props: unknown) => string;

before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { createElement } = await import("react");
  const { BruitAerienAutour, BruitAerienLogement } = await import("../components/report/BruitAerienBlocs.tsx");
  const { RegulatoryStatusBlock } = await import("../components/report/logement/RegulatorySection.tsx");
  rendreAutour = (l) => texte(renderToStaticMarkup(createElement(BruitAerienAutour, { lecture: l })));
  rendreLogement = (l) => texte(renderToStaticMarkup(createElement(BruitAerienLogement, { lecture: l, withDivider: false })));
  rendreSection = (p) => texte(renderToStaticMarkup(createElement(RegulatoryStatusBlock, p as never)));
});

/** Le texte que lit le lecteur : balises retirées, entités décodées, espaces insécables normalisées. */
function texte(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&apos;/g, "'").replace(/&quot;/g, "\"").replace(/&amp;/g, "&").replace(/&nbsp;| /g, " ")
    .replace(/’/g, "'").replace(/\s+/g, " ").trim();
}

/** Ce qu'aucun texte ne doit dire : un niveau sonore, une constructibilité, un droit, une absence de bruit. */
const INTERDITS = [
  /bruyant/i, /d[ée]cibel/i, /\bdB\b/, /\bLden\b/, /expos[ée]e? au bruit/i, /inconstructible/i, /\bconstructible/i,
  /interdit/i, /droit à (l'|une )?aide/i, /vous avez droit/i, /aucun bruit/i, /pas de bruit/i, /calme/i, /psophique/i,
];
function sansInterdit(t: string) {
  for (const r of INTERDITS) assert.doesNotMatch(t, r, `texte interdit ${r} dans : ${t}`);
}

// ── Les adresses réelles ─────────────────────────────────────────────────────────────────────
type Fixture = { q: string; ban: { label: string; type: string; lon: number; lat: number }; parcelle: { geometry: EntreeBruitAerien["parcelle"] extends infer P ? P extends { geometry: infer G } ? G : never : never; rattachement: "point" | "repli"; candidatsAuPoint?: number } | null };
const fixture = (c: string): Fixture => JSON.parse(readFileSync(`src/lib/__fixtures__/fut146/${c}.json`, "utf8"));
function entree(c: string, o: { sansParcelle?: boolean } = {}): EntreeBruitAerien {
  const x = fixture(c);
  return {
    point: [x.ban.lon, x.ban.lat], geocodage: x.ban.type,
    parcelle: x.parcelle && !o.sansParcelle ? { geometry: x.parcelle.geometry, rattachement: x.parcelle.rattachement, candidatsAuPoint: x.parcelle.candidatsAuPoint } : null,
  };
}
const lire = (c: string, o: { sansParcelle?: boolean } = {}) => lireBruitAerien(jeu, entree(c, o));
const CAS = readdirSync("src/lib/__fixtures__/fut146").map((f) => f.replace(/\.json$/, ""));

// ════════════════════════════════════════════════════════════════════════════════════════════
describe("1. La copie officielle", () => {
  test("elle se lit, et couvre chaque aérodrome de la liste officielle des arrêtés", () => {
    assert.ok(jeuValide(jeu));
    const m = jeu.meta as unknown as { comptes: { aerodromesArretesPeb: number; aerodromesPeb: number; aerodromesPgs: string[] } };
    assert.equal(m.comptes.aerodromesArretesPeb, 224);
    assert.ok(m.comptes.aerodromesPeb >= 224);
    // Les onze aérodromes que le ministère cite pour l'aide à l'insonorisation, trois zones chacun.
    assert.deepEqual(m.comptes.aerodromesPgs, ["LFBD", "LFBO", "LFLL", "LFML", "LFMN", "LFOB", "LFPB", "LFPG", "LFPO", "LFRS", "LFSB"]);
    for (const o of m.comptes.aerodromesPgs) {
      assert.deepEqual(jeu.pgs.filter((z) => z.oaci === o).map((z) => z.zone).sort(), ["I", "II", "III"]);
    }
  });

  test("chaque zone porte une lettre ou un numéro reconnus, une emprise qui la contient, une date établie ou nulle", () => {
    for (const [plan, zs] of [["peb", jeu.peb], ["pgs", jeu.pgs]] as const) {
      for (const z of zs) {
        assert.ok((ORDRE[plan] as readonly string[]).includes(z.zone), `${z.oaci} ${z.zone}`);
        assert.ok(z.dateArrete === null || /^\d{4}-\d{2}-\d{2}$/.test(z.dateArrete));
        const [x0, y0, x1, y1] = z.bbox;
        for (const poly of (z.geometry as { coordinates: number[][][][] }).coordinates) {
          for (const [x, y] of poly[0]) assert.ok(x >= x0 - 1e-6 && x <= x1 + 1e-6 && y >= y0 - 1e-6 && y <= y1 + 1e-6);
        }
      }
    }
  });

  test("revue I1 : les zones publiées en double ne sont gardées qu'une fois (Les Mureaux, Saint-Cyr, Semur, Villacoublay)", () => {
    const vus = new Set<string>();
    for (const z of jeu.peb) {
      const k = `${z.oaci}|${z.zone}|${z.bbox.join(",")}`;
      assert.ok(!vus.has(k), `doublon ${k}`);
      vus.add(k);
    }
    const ecartes = (jeu.meta as unknown as { comptes: { doublonsEcartes: string[] } }).comptes.doublonsEcartes;
    for (const o of ["LFXU", "LFPZ", "LFGQ", "LFPV"]) assert.ok(ecartes.some((e) => e.startsWith(o)), o);
  });

  test("une date discordante dans la donnée publiée n'est jamais affichée (Gap : attribut de 1985, document de 2017)", () => {
    const gap = jeu.peb.filter((z) => z.oaci === "LFNA" && z.zone !== "D");
    assert.ok(gap.length > 0);
    for (const z of gap) assert.equal(z.dateArrete, null);
  });
});

// ════════════════════════════════════════════════════════════════════════════════════════════
describe("2. Les adresses réelles, contre l'oracle tiré du fichier officiel", () => {
  test("au point, la zone retenue est la plus exposée de celles qui contiennent le point", () => {
    for (const c of CAS) {
      const l = lire(c, { sansParcelle: true });
      const p = [fixture(c).ban.lon, fixture(c).ban.lat];
      for (const plan of ["peb", "pgs"] as const) {
        const attendu = oracle(plan, p);
        const lu = l[plan];
        if (lu.etat === "incertain") assert.fail(`${c} ${plan} incertain`);
        if (attendu.length === 0) assert.equal(lu.retenue, null, `${c} ${plan} : aucune zone ne contient le point`);
        else assert.equal(lu.retenue?.zone, attendu[0], `${c} ${plan}`);
      }
    }
  });

  test("à la parcelle, la zone du point est retenue, ou dite comme autre zone ou comme bordure", () => {
    for (const c of CAS) {
      const l = lire(c);
      if (l.grain !== "parcelle") continue;
      const p = [fixture(c).ban.lon, fixture(c).ban.lat];
      for (const plan of ["peb", "pgs"] as const) {
        const attendu = oracle(plan, p)[0];
        if (!attendu) continue;
        const dites = [l[plan].retenue, ...l[plan].autres, ...l[plan].enLimite].map((z) => z?.zone);
        assert.ok(dites.includes(attendu), `${c} ${plan} : ${attendu} absent de ${dites}`);
        // La zone retenue est la plus exposée de celles qui couvrent la parcelle (notice DGAC, juin 2020).
        const couvrantes = [l[plan].retenue, ...l[plan].autres].map((z) => z!.zone);
        assert.equal(couvrantes[0], [...couvrantes].sort((a, b) => (ORDRE[plan] as readonly string[]).indexOf(a) - (ORDRE[plan] as readonly string[]).indexOf(b))[0]);
      }
    }
  });

  test("revue B1 : la précision se lit dans l'identifiant BAN, et la production lit donc bien la parcelle", () => {
    assert.equal(precisionDepuisBanId("13054_0483_00020"), "housenumber");
    assert.equal(precisionDepuisBanId("13054_0483_00020_bis"), "housenumber");
    assert.equal(precisionDepuisBanId("2A004_0170_00012"), "housenumber");
    assert.equal(precisionDepuisBanId("13054_0483"), "street");
    assert.equal(precisionDepuisBanId("13054"), null);
    assert.equal(precisionDepuisBanId(null), null);
    // Le chemin de la route : `type: null` envoyé par le client, précision tirée de l'identifiant du dossier.
    for (const c of CAS) {
      const x = fixture(c) as Fixture & { ban: { id: string } };
      assert.equal(precisionDepuisBanId(x.ban.id), x.ban.type, c);
    }
    const route = readFileSync("src/app/api/georisques-logement/route.ts", "utf8");
    assert.match(route, /geocodage: banFeatureType \?\? precisionDepuisBanId\(address\.id\)/);
    const l = lireBruitAerien(jeu, { ...entree("albi-zone-d"), geocodage: precisionDepuisBanId((fixture("albi-zone-d") as Fixture & { ban: { id: string } }).ban.id) });
    assert.equal(l.grain, "parcelle");
    assert.doesNotMatch(rendreLogement(l), /précision de la localisation n'est pas connue/);
  });

  test("Fumel et Vendays-Montalivet : sur la carte, absents de la liste des arrêtés ; jamais présentés comme opposables sans réserve", () => {
    for (const oaci of ["LFDX", "LFIV"]) {
      const zs = jeu.peb.filter((z) => z.oaci === oaci);
      assert.ok(zs.length > 0 && zs.every((z) => z.horsListeArretes === true), oaci);
      // Un point à l'intérieur de la zone, cherché sur une grille dans son emprise, vérifié par l'oracle.
      const [x0, y0, x1, y1] = zs[0].bbox;
      let p: [number, number] | null = null;
      for (let i = 1; i < 20 && !p; i++) for (let j = 1; j < 20 && !p; j++) {
        const q: [number, number] = [x0 + ((x1 - x0) * i) / 20, y0 + ((y1 - y0) * j) / 20];
        if (dansZone(q, zs[0])) p = q;
      }
      assert.ok(p, `${oaci} : point intérieur`);
      const l = lireBruitAerien(jeu, { point: p!, geocodage: "housenumber", parcelle: null });
      assert.equal(l.peb.retenue?.aerodrome.oaci, oaci);
      assert.equal(l.peb.retenue?.vigueurAVerifier, true);
      const g = rendreLogement(l);
      const a = rendreAutour(lireBruitAerien(jeu, { point: p!, geocodage: null, parcelle: null }));
      for (const t of [g, a]) assert.match(t, /pas dans sa liste des arrêtés : qu'il soit toujours en vigueur se vérifie en mairie/);
      assert.match(g, /Si ce plan est toujours en vigueur, en vente comme en location/);
      assert.doesNotMatch(g, /(^|\. )En vente comme en location/);
    }
    // Les autres plans gardent la phrase affirmative, sans réserve de vigueur.
    const t = rendreLogement(lire("marignane-zone-c-pgs"));
    assert.match(t, /En vente comme en location/);
    assert.doesNotMatch(t, /toujours en vigueur/);
  });

  test("Marignane : deux logements de la même commune, l'un en zone, l'autre hors zone, et le texte le dit", () => {
    const dedans = lire("marignane-zone-c");
    const dehors = lire("marignane-hors-zone");
    assert.ok(oracle("peb", [fixture("marignane-zone-c").ban.lon, fixture("marignane-zone-c").ban.lat]).length > 0);
    assert.equal(oracle("peb", [fixture("marignane-hors-zone").ban.lon, fixture("marignane-hors-zone").ban.lat]).length, 0);
    assert.equal(dedans.peb.retenue?.aerodrome.oaci, "LFML");
    assert.equal(dehors.peb.etat, "hors_zone");
    const a = rendreAutour(lireBruitAerien(jeu, { ...entree("marignane-zone-c"), geocodage: null, parcelle: null }));
    const b = rendreAutour(lireBruitAerien(jeu, { ...entree("marignane-hors-zone"), geocodage: null, parcelle: null }));
    assert.match(a, new RegExp(`est en zone ${dedans.peb.retenue!.zone} du plan d'exposition au bruit de l'aérodrome de Marseille-Provence`));
    assert.match(b, /est hors des zones du plan d'exposition au bruit de l'aérodrome de Marseille-Provence : la plus proche, la zone D, est à \d+ m/);
    assert.match(b, /ne veut pas dire ne pas entendre d'avions/);
    sansInterdit(a); sansInterdit(b);
  });

  test("Albi : zone D pour l'un, hors zone pour l'autre ; aucun plan de gêne sonore n'est inventé", () => {
    const d = lire("albi-zone-d");
    const h = lire("albi-hors-zone");
    assert.deepEqual(oracle("peb", [fixture("albi-zone-d").ban.lon, fixture("albi-zone-d").ban.lat]), ["D"]);
    assert.equal(d.peb.retenue?.zone, "D");
    assert.equal(h.peb.etat, "hors_zone");
    assert.equal(d.pgs.etat, "absent");
    const t = rendreLogement(d);
    assert.match(t, /Zone D du plan d'exposition au bruit de l'aérodrome d'Albi/);
    assert.match(t, /la zone la moins exposée du plan/);
    assert.doesNotMatch(t, /gêne sonore|insonorisation peut/);
    sansInterdit(t);
  });

  test("La Rochelle : le fichier officiel place la rue de la Bergerie en zone C, le centre hors zone", () => {
    const c = lire("la-rochelle-zone-c");
    assert.deepEqual(oracle("peb", [fixture("la-rochelle-zone-c").ban.lon, fixture("la-rochelle-zone-c").ban.lat]), ["C"]);
    assert.equal(c.peb.retenue?.zone, "C");
    assert.equal(c.peb.retenue?.aerodrome.oaci, "LFBH");
    assert.equal(lire("la-rochelle-centre").peb.etat, "hors_zone");
  });

  test("Villeneuve-le-Roi et Goussainville : PEB et PGS ensemble, et l'aide n'est qu'une possibilité", () => {
    for (const c of ["villeneuve-le-roi", "goussainville"]) {
      const l = lire(c);
      const p = [fixture(c).ban.lon, fixture(c).ban.lat];
      assert.equal(l.peb.retenue?.zone, oracle("peb", p)[0]);
      assert.equal(l.pgs.retenue?.zone, oracle("pgs", p)[0]);
      const t = rendreLogement(l);
      assert.match(t, /aide à l'insonorisation peut exister/);
      assert.match(t, /date du logement et des aides déjà reçues/);
      sansInterdit(t);
    }
  });

  test("les quatre zones A, B, C et D se rencontrent dans la recette", () => {
    const vues = new Set(CAS.flatMap((c) => [lire(c).peb.retenue?.zone, lire(c, { sansParcelle: true }).peb.retenue?.zone]));
    for (const z of ["A", "B", "C", "D"]) assert.ok(vues.has(z), `zone ${z}`);
  });

  test("une parcelle sur deux zones retient la plus exposée et dit l'autre (Marignane, zones A et B)", () => {
    const l = lire("marignane-zone-a");
    assert.equal(l.grain, "parcelle");
    assert.equal(l.peb.retenue?.zone, "A");
    assert.ok(l.peb.autres.some((z) => z.zone === "B"));
    assert.match(rendreLogement(l), /La parcelle touche aussi la zone B de ce plan ; la zone A, plus exposée, est retenue/);
  });
});

// ════════════════════════════════════════════════════════════════════════════════════════════
describe("3. Les limites, les tracés et les rattachements", () => {
  const proj = projectionAutour(5.2, 43.43);
  const versLonLat = ([x, y]: number[]) => [proj.lon0 + x / proj.kx, proj.lat0 + y / proj.ky];
  const versM = ([lon, lat]: number[]) => [(lon - proj.lon0) * proj.kx, (lat - proj.lat0) * proj.ky];

  /**
   * Une arête rectiligne du tracé officiel de la zone C de Marseille-Provence, d'au moins 80 m, dont le
   * côté extérieur (à 30 m de son milieu) n'est dans aucune zone C : une limite où l'on peut poser une parcelle.
   */
  function areteOfficielle() {
    const c = jeu.peb.filter((z) => z.oaci === "LFML" && z.zone === "C");
    for (const z of c) {
      for (const poly of (z.geometry as { coordinates: number[][][][] }).coordinates) {
        const a = poly[0];
        for (let i = 0; i + 1 < a.length; i++) {
          const [p, q] = [versM(a[i]), versM(a[i + 1])];
          const L = Math.hypot(q[0] - p[0], q[1] - p[1]);
          if (L < 80) continue;
          const [ux, uy] = [(q[0] - p[0]) / L, (q[1] - p[1]) / L];
          const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
          for (const s of [1, -1]) {
            const n = [-uy * s, ux * s];
            const dehors = versLonLat([m[0] + n[0] * 30, m[1] + n[1] * 30]);
            const dedans = versLonLat([m[0] - n[0] * 30, m[1] - n[1] * 30]);
            if (!c.some((zz) => dansZone(dehors, zz)) && c.some((zz) => dansZone(dedans, zz))) return { p, q, u: [ux, uy], n, L };
          }
        }
      }
    }
    throw new Error("aucune arête rectiligne de 80 m");
  }
  /** Un rectangle de 60 m de profondeur posé contre l'arête, côté extérieur, enfoncé de `chevauchement` mètres. */
  function parcelleContre(chevauchement: number) {
    const { p, u, n, L } = areteOfficielle();
    const debut = [p[0] + u[0] * 10, p[1] + u[1] * 10];
    const long = L - 20;
    const coin = (t: number, h: number) => versLonLat([debut[0] + u[0] * t + n[0] * h, debut[1] + u[1] * t + n[1] * h]);
    const anneau = [coin(0, -chevauchement), coin(long, -chevauchement), coin(long, 60), coin(0, 60), coin(0, -chevauchement)];
    // Le point de l'adresse au milieu de la parcelle, à 30 m de la limite.
    return { anneau, point: coin(long / 2, 30) as [number, number], long };
  }
  const entreeParcelle = (anneau: number[][], point: [number, number]): EntreeBruitAerien => ({
    point, geocodage: "housenumber", parcelle: { geometry: { type: "Polygon", coordinates: [anneau] }, rattachement: "point" },
  });
  /** La zone C de Marseille-Provence est-elle dite, à quelque titre que ce soit ? */
  const cDit = (l: LectureBruitAerien) =>
    [l.peb.retenue, ...l.peb.autres, ...l.peb.enLimite].some((z) => z?.aerodrome.oaci === "LFML" && z.zone === "C");

  test("contact exact : une parcelle qui partage seulement la limite officielle n'est pas en zone C", () => {
    const { anneau, point } = parcelleContre(0);
    const l = lireBruitAerien(jeu, entreeParcelle(anneau, point));
    assert.equal(l.grain, "parcelle");
    assert.equal(cDit(l), false);
  });

  test("microchevauchement : 1 cm de recouvrement est l'écart de tracé, jamais une zone", () => {
    const { anneau, point } = parcelleContre(0.01);
    const l = lireBruitAerien(jeu, entreeParcelle(anneau, point));
    assert.equal(cDit(l), false);
  });

  test("liseré : 1 m de recouvrement (plus de 25 m², moins de 2 %) est dit comme une bordure, pas comme la zone", () => {
    const { anneau, point, long } = parcelleContre(1);
    assert.ok(long * 1 >= 25 && long / (long * 61) < 0.02);
    const l = lireBruitAerien(jeu, entreeParcelle(anneau, point));
    assert.ok(l.peb.enLimite.some((z) => z.zone === "C"));
    assert.notEqual(l.peb.retenue?.zone, "C");
    assert.equal(l.peb.etat, "en_limite");
    assert.match(rendreLogement(l), /zone C en bordure \(\d+ m²\)|ne touche la zone C qu'en bordure \(\d+ m²\)/);
  });

  test("recouvrement franc : 10 m de profondeur (plus de 2 %) mettent la parcelle en zone C", () => {
    const { anneau, point } = parcelleContre(10);
    const l = lireBruitAerien(jeu, entreeParcelle(anneau, point));
    assert.ok([l.peb.retenue, ...l.peb.autres].some((z) => z?.zone === "C"));
  });

  test("au point, sur la limite officielle exacte : « en limite », jamais une zone affirmée seule", () => {
    const { p, q } = areteOfficielle();
    const milieu = versLonLat([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]) as [number, number];
    const l = lireBruitAerien(jeu, { point: milieu, geocodage: "housenumber", parcelle: null });
    assert.equal(l.peb.etat, "en_limite");
    assert.match(rendreAutour(lireBruitAerien(jeu, { point: milieu, geocodage: null, parcelle: null })), new RegExp(`moins de ${LIMITE_PROCHE_M} m`));
  });

  test("au point, à 30 m d'une limite : « en limite » ; à 80 m : la zone est affirmée", () => {
    const { p, q, n } = areteOfficielle();
    const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const a30 = lireBruitAerien(jeu, { point: versLonLat([m[0] - n[0] * 30, m[1] - n[1] * 30]) as [number, number], geocodage: "housenumber", parcelle: null });
    const a80 = lireBruitAerien(jeu, { point: versLonLat([m[0] - n[0] * 80, m[1] - n[1] * 80]) as [number, number], geocodage: "housenumber", parcelle: null });
    assert.equal(a30.peb.etat, "en_limite");
    assert.equal(a30.peb.retenue?.zone, "C");
    // À 80 m de cette arête, une AUTRE limite peut passer près : l'état suit exactement la présence d'une limite.
    assert.equal(a80.peb.retenue?.zone, "C");
    assert.equal(a80.peb.etat, a80.peb.enLimite.length === 0 ? "en_zone" : "en_limite");
  });

  test("parcelle invalide (anneau croisé) : lecture au point, et le texte le dit", () => {
    const x = fixture("marignane-zone-c-pgs");
    const [lon, lat] = [x.ban.lon, x.ban.lat];
    const d = 0.0003;
    const noeud = [[lon - d, lat - d], [lon + d, lat + d], [lon + d, lat - d], [lon - d, lat + d], [lon - d, lat - d]];
    const l = lireBruitAerien(jeu, entreeParcelle(noeud, [lon, lat]));
    assert.equal(l.grain, "point");
    assert.equal(l.parcelleEcartee, "non_mesurable");
    assert.match(rendreLogement(l), /Le tracé de la parcelle n'a pas pu être mesuré/);
  });

  test("parcelle par proximité ou sur une limite : lecture au point, voisin possible dit", () => {
    const repli = lire("marignane-zone-c");
    assert.equal(fixture("marignane-zone-c").parcelle?.rattachement, "repli");
    assert.equal(repli.grain, "point");
    assert.match(rendreLogement(repli), /pourrait être celle d'un voisin/);
    const limite = lireBruitAerien(jeu, { ...entree("marignane-zone-c-pgs"), parcelle: { ...entree("marignane-zone-c-pgs").parcelle!, candidatsAuPoint: 2 } });
    assert.equal(limite.grain, "point");
    assert.equal(limite.parcelleEcartee, "limite");
  });

  test("géocodage à la rue : la lecture décrit le secteur, n'utilise pas la parcelle et ne parle pas « du logement »", () => {
    const l = lire("marignane-rue-seule");
    assert.equal(fixture("marignane-rue-seule").ban.type, "street");
    assert.equal(l.portee, "secteur");
    assert.equal(l.grain, "point");
    assert.equal(l.parcelleEcartee, null);
    const t = rendreLogement(l);
    assert.match(t, /géocodée sans numéro/);
    assert.match(t, /Le point de l'adresse est en zone/);
    assert.doesNotMatch(t, /parcelle rattachée/);
  });

  test("une géométrie officielle non mesurable rend la lecture incertaine à moins de 50 m de son tracé (Dijon, zone A)", () => {
    const z = jeu.peb.find((x) => !x.valide)!;
    assert.equal(z.oaci, "LFSD", "seule la zone A de Dijon reste non mesurable après dédoublonnage");
    const sommet = (z.geometry as { coordinates: number[][][][] }).coordinates[0][0][3] as [number, number];
    const l = lireBruitAerien(jeu, { point: sommet, geocodage: "housenumber", parcelle: null });
    assert.equal(l.peb.etat, "incertain");
    const t = rendreAutour(lireBruitAerien(jeu, { point: sommet, geocodage: null, parcelle: null }));
    assert.match(t, /n'a pas pu être établie/);
    assert.doesNotMatch(t, /hors des zones/);
  });

  test("revue B3 : loin du tracé non mesurable, Dijon et Versailles se lisent normalement (plus de halo de 5 km)", () => {
    // Points de reproduction de la revue indépendante du 27/10/2026.
    const gare = lireBruitAerien(jeu, { point: [5.027, 47.3233], geocodage: "housenumber", parcelle: null });
    const liberation = lireBruitAerien(jeu, { point: [5.0415, 47.322], geocodage: "housenumber", parcelle: null });
    const versailles = lireBruitAerien(jeu, { point: [2.1204, 48.8049], geocodage: "housenumber", parcelle: null });
    for (const l of [gare, liberation, versailles]) assert.notEqual(l.peb.etat, "incertain");
    assert.equal(liberation.peb.etat, "hors_zone");
    assert.equal(liberation.peb.plusProche?.zone, "D");
  });

  test("revue B2 : deux aérodromes superposés (Paris-Charles de Gaulle et Paris-Le Bourget) sont nommés tous les deux, sans parcelle inventée", () => {
    for (const p of [[2.433304, 48.974554], [2.454010, 48.976925], [2.440031, 48.968951]] as [number, number][]) {
      const l = lireBruitAerien(jeu, { point: p, geocodage: "housenumber", parcelle: null });
      const oaci = [l.peb.retenue?.aerodrome.oaci, ...(l.peb.autresAerodromes ?? []).map((z) => z.aerodrome.oaci)];
      assert.ok(oaci.includes("LFPG") && oaci.includes("LFPB"), `${p} : ${oaci}`);
      const g = rendreLogement(l);
      const a = rendreAutour(lireBruitAerien(jeu, { point: p, geocodage: null, parcelle: null }));
      assert.doesNotMatch(g, /La parcelle/);
      for (const t of [g, a]) {
        assert.match(t, /Paris-Charles de Gaulle/);
        assert.match(t, /Paris-Le Bourget/);
        assert.match(t, /les plans de chaque aérodrome s'appliquent/);
        sansInterdit(t);
      }
      assert.match(g, /indiquant ces zones/);
    }
  });

  test("revue B2 : au point, deux zones d'un même plan qui se recouvrent sont une limite, jamais « la parcelle touche aussi » (Bastia)", () => {
    const l = lireBruitAerien(jeu, { point: [9.48818, 42.563732], geocodage: "housenumber", parcelle: null });
    assert.equal(l.peb.autres.length, 0);
    assert.doesNotMatch(rendreLogement(l), /La parcelle touche/);
    assert.match(rendreLogement(l), /La zone D passe à moins de 50 m du point/);
  });

  test("revue I2 : le plan de gêne sonore qui déborde du PEB (Orly) n'est jamais dit « aussi », et parle seul s'il le faut", () => {
    const hors = lireBruitAerien(jeu, { point: [2.36207, 48.72437], geocodage: null, parcelle: null });
    assert.equal(hors.peb.etat === "en_zone" || hors.peb.etat === "en_limite" ? "dans le PEB" : "hors PEB", "hors PEB");
    assert.ok(hors.pgs.retenue);
    const a = rendreAutour(hors);
    assert.match(a, /Le secteur est en revanche en zone/);
    assert.doesNotMatch(a, /aussi en zone/);
    const g = rendreLogement(lireBruitAerien(jeu, { point: [2.36207, 48.72437], geocodage: "housenumber", parcelle: null }));
    assert.doesNotMatch(g, /aussi en zone/);
    const seul = lireBruitAerien(jeu, { point: [2.58864, 48.75975], geocodage: null, parcelle: null });
    assert.equal(seul.peb.etat, "absent");
    assert.ok(seul.pgs.retenue);
    assert.match(rendreAutour(seul), /est en zone [I]+ du plan de gêne sonore de l'aérodrome de Paris-Orly/);
    assert.match(rendreLogement({ ...seul, portee: "adresse" }), /Zone [I]+ du plan de gêne sonore de l'aérodrome de Paris-Orly/);
  });

  test("revue I3 : plusieurs zones citées s'accordent (« des zones A et C », « passent »)", () => {
    const l = lireBruitAerien(jeu, { point: [6.328593, 45.62837], geocodage: "housenumber", parcelle: null });
    const t = rendreLogement(l) + " " + rendreAutour(lireBruitAerien(jeu, { point: [6.328593, 45.62837], geocodage: null, parcelle: null }));
    assert.doesNotMatch(t, /la zones|de les zones|La zones/);
    for (const c of CAS) assert.doesNotMatch(rendreLogement(lire(c)) + rendreAutour(lire(c, { sansParcelle: true })), /la zones|de les zones/);
  });

  test("loin de tout aérodrome : rien n'est affiché", () => {
    // Plateau de l'Aubrac : l'oracle vérifie qu'aucune zone n'est à moins de 5 km (emprise élargie).
    const p: [number, number] = [3.0, 44.62];
    const dLat = RAYON_VOISINAGE_M / 111_000;
    assert.ok(!jeu.peb.some(({ bbox: [x0, y0, x1, y1] }) => p[0] > x0 - dLat * 1.5 && p[0] < x1 + dLat * 1.5 && p[1] > y0 - dLat && p[1] < y1 + dLat));
    const l = lireBruitAerien(jeu, { point: p, geocodage: "housenumber", parcelle: null });
    assert.equal(l.peb.etat, "absent");
    assert.equal(rendreAutour(l), "");
    assert.equal(rendreLogement(l), "");
  });
});

// ════════════════════════════════════════════════════════════════════════════════════════════
describe("4. Panne, données absentes, dossiers antérieurs", () => {
  test("un jeu illisible ou vide est une panne, jamais une absence de zone", () => {
    for (const j of [null, undefined, {}, { meta: jeu.meta, peb: [], pgs: [] }, "texte"]) {
      const l = lireBruitAerien(j, entree("marignane-zone-c"));
      assert.equal(l.statut, "indisponible");
      const a = rendreAutour(l);
      const g = rendreLogement(l);
      assert.match(a, /n'ont pas pu être lus/);
      assert.match(g, /n'ont pas pu être lus/);
      assert.doesNotMatch(a + g, /hors des zones|aucune zone/);
    }
  });

  test("une panne est une source muette ; « hors zone » et l'absence de plan n'en sont pas", () => {
    const base = { address: { id: "x", label: "x", city: null, citycode: null, postcode: null, latitude: 43, longitude: 5 } } as LogementReport;
    assert.ok(sourcesAbsentes({ ...base, bruitAerien: lireBruitAerien(null, entree("albi-zone-d")) }).includes("bruit_aerien"));
    assert.ok(!sourcesAbsentes({ ...base, bruitAerien: lire("albi-hors-zone") }).includes("bruit_aerien"));
    assert.ok(!sourcesAbsentes(base).includes("bruit_aerien"), "un rapport antérieur ne s'invente pas de panne");
  });

  test("une actualisation pendant une panne ne remplace pas une version qui n'avait pas la lecture", () => {
    const base = { address: { id: "x", label: "x", city: null, citycode: null, postcode: null, latitude: 43, longitude: 5 } } as LogementReport;
    const ancienne: VersionLogement = { numero: 1, collecteeLe: "2026-10-01", sourcesAbsentes: sourcesAbsentes(base), synthese: null, syntheseHash: null, report: base, reportHash: "h1", syntheseDpe: null };
    assert.equal(issueActualisation({ ...base, bruitAerien: lireBruitAerien(null, entree("albi-zone-d")) }, "h2", ancienne), "refusee");
    assert.equal(issueActualisation({ ...base, bruitAerien: lire("albi-zone-d") }, "h2", ancienne), "nouvelle_version");
  });

  test("revue M3 : une lecture faite à la parcelle ne cède pas la place à une lecture au point", () => {
    const base = { address: { id: "x", label: "x", city: null, citycode: null, postcode: null, latitude: 43, longitude: 5 } } as LogementReport;
    const aParcelle = { ...base, bruitAerien: lire("albi-zone-d") };
    assert.equal(aParcelle.bruitAerien.grain, "parcelle");
    const ancienne: VersionLogement = { numero: 1, collecteeLe: "2026-10-27", sourcesAbsentes: sourcesAbsentes(aParcelle), synthese: null, syntheseHash: null, report: aParcelle, reportHash: "h1", syntheseDpe: null };
    assert.equal(issueActualisation({ ...base, bruitAerien: lire("albi-zone-d", { sansParcelle: true }) }, "h2", ancienne), "refusee");
    assert.equal(issueActualisation({ ...base, bruitAerien: lire("albi-zone-d") }, "h1", ancienne), "identique");
  });

  test("un rapport collecté avant FUT-146 n'affiche rien du bruit aérien, ni zone, ni « hors zone », ni panne", () => {
    assert.equal(rendreLogement(undefined), "");
    const t = rendreSection({ georisques: { address: { risks: { labels: [] }, pprn: { labels: [] }, regulatoryPlans: [], rga: null, seismic: null } }, heritage: { items: [], sourceStatus: "ok" } });
    assert.doesNotMatch(t, /Bruit aérien|bruit|aérodrome/i);
    const avec = rendreSection({ georisques: { address: { risks: { labels: [] }, pprn: { labels: [] }, regulatoryPlans: [], rga: null, seismic: null } }, heritage: { items: [], sourceStatus: "ok" }, bruitAerien: lire("albi-zone-d") });
    assert.match(avec, /Bruit aérien Zone D du plan d'exposition au bruit/);
  });

  test("chaque lecture porte sa convention et sa source datée", () => {
    const l = lire("marignane-zone-c-pgs");
    assert.equal(l.convention, BRUIT_AERIEN_CONVENTION);
    assert.equal(l.source?.producteur, "DGAC");
    assert.equal(l.source?.extraitLe, jeu.meta.extraitLe);
    assert.match(rendreLogement(l), /copie extraite le \d+ \w+ \d{4}/);
  });
});

// ════════════════════════════════════════════════════════════════════════════════════════════
describe("5. Ce que les textes disent, et ne disent jamais", () => {
  test("Autour : retenir, vérifier, en savoir plus ; le plan ne mesure pas le bruit", () => {
    for (const c of CAS) {
      const t = rendreAutour(lireBruitAerien(jeu, { ...entree(c), geocodage: null, parcelle: null }));
      if (!t) continue;
      sansInterdit(t);
      assert.match(t, /Ce qu'il faut retenir/);
      assert.match(t, /En savoir plus/);
      // Autour ne parle pas de la parcelle ni du document de la transaction : c'est le rôle du Logement.
      assert.doesNotMatch(t, /parcelle|état des nuisances|certificat d'urbanisme|insonorisation/);
    }
  });

  test("Logement : le document de la transaction, la portée, et jamais la visite d'Autour répétée", () => {
    for (const c of CAS) {
      const l = lire(c);
      const t = rendreLogement(l);
      if (!t) continue;
      sansInterdit(t);
      if (l.peb.retenue) {
        assert.match(t, /état des nuisances sonores aériennes/);
        assert.match(t, /certificat d'urbanisme/);
      }
      assert.doesNotMatch(t, /Passez sur place/);
    }
  });

  test("la date de l'arrêté vient du fichier, et le document officiel est proposé", () => {
    const l = lire("marignane-zone-c-pgs");
    const t = rendreLogement(l);
    const z = jeu.peb.find((x) => x.oaci === "LFML" && x.zone === l.peb.retenue!.zone)!;
    assert.ok(z.dateArrete);
    const [a, m, j] = z.dateArrete!.split("-").map(Number);
    assert.match(t, new RegExp(`Plan de l'aérodrome de Marseille-Provence approuvé le ${j === 1 ? "1er" : j} [^ ]+ ${a}`));
    void m;
    assert.equal(texteLogement(l)?.document?.url, z.document);
  });

  test("le plan de gêne sonore seul n'est jamais dit comme un droit, et Autour ne parle pas de l'aide", () => {
    const l = lire("villeneuve-le-roi");
    assert.match(texteLogement(l)!.complement!, /peut exister/);
    assert.doesNotMatch(texteAutour(l)!.complement ?? "", /aide/);
  });
});
