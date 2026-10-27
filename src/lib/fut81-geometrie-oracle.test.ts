import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  aireIntersection, aireRegion, ecartAdmis, longueurDans, lignesDe, projectionPour, regionDe, regionMesurable,
  MAILLE_M, type Projection, type Region,
} from "./geometrie-parcelle.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-81, DEUXIÈME REVUE INDÉPENDANTE (27/10/2026, SHA e73ec075, NO GO) : L'AIRE D'INTERSECTION
// CONFRONTÉE À UN ORACLE INDÉPENDANT.
//
// Les valeurs attendues viennent de GEOS (Shapely), calculées par `scripts/research/fut81-oracle-geos.py`
// et versionnées dans `__fixtures__/fut81/oracle-geos.json` : elles ne reproduisent pas l'algorithme
// testé. S'y ajoutent les valeurs analytiques des contre-épreuves (une bande de 2 mm sur 100 m fait 0,2 m²).
//
// ── LES TOLÉRANCES ───────────────────────────────────────────────────────────────────────────
// • Contre GEOS, sur la même projection : `ecartAdmis(a, b)`, la borne de l'arrondi à la maille du
//   micromètre (2δ × la somme des périmètres, δ = demi-diagonale de la maille). GEOS calcule en flottants
//   sans arrondi : tout écart au-delà de cette borne est un défaut de calcul, pas d'arrondi.
// • Contre GEOS dans une projection équivalente de Lambert (pyproj) : 2 × 10⁻⁴ en relatif. C'est l'erreur
//   d'échelle d'une projection équirectangulaire locale à quelques centaines de mètres de son centre
//   (mesurée au plus à 1 × 10⁻⁴ sur les relevés), doublée.
// • Lignes : 2 cm, deux fois la tolérance de contact des lignes (`TOLERANCE_M`, 1 cm) : un morceau qui
//   longe la limite à moins d'1 cm est un contact pour la production, une longueur pour GEOS.
// ════════════════════════════════════════════════════════════════════════════════════════════

type Geo = { type: string; coordinates: unknown };
type Synthetique = {
  nom: string; famille: string; a: Geo; b: Geo; valideA: boolean; valideB: boolean;
  ab: number | null; ba: number | null; aireA: number; aireB: number;
};
type Reel = {
  cas: string; couche: string; indice: number; libelle: string | null; valides: [boolean, boolean];
  aire: number | null; aireEquivalente: number | null; aireParcelle: number; aireParcelleEquivalente: number;
};
type Ligne = { cas: string; indice: number; libelle: string | null; longueur: number; longueurEquivalente: number };
const ORACLE: { geos: string; shapely: string; synthetiques: Synthetique[]; reels: Reel[]; lignes: Ligne[] } =
  JSON.parse(readFileSync("src/lib/__fixtures__/fut81/oracle-geos.json", "utf8"));

/** Le corpus synthétique est en mètres : la projection identité. */
const METRES: Projection = { lon0: 0, lat0: 0, kx: 1, ky: 1 };
const region = (g: Geo, p: Projection = METRES): Region => {
  const r = regionDe(g, p);
  assert.ok(r, "la géométrie se lit");
  return r;
};
const cas = (nom: string) => {
  const c = ORACLE.synthetiques.find((x) => x.nom === nom);
  assert.ok(c, `cas « ${nom} » dans l'oracle`);
  return c;
};
/** Une région translatée de (dx, dy) mètres : l'aire ne change pas, les coordonnées s'éloignent de l'origine. */
const translatee = (r: Region, dx: number, dy: number): Region => r.map((a) => a.map(([x, y]) => [x + dx, y + dy] as [number, number]));

/** Les invariants de toute mesure rendue, et la concordance avec GEOS. */
function verifier(a: Region, b: Region, geosAB: number, geosBA: number, ou: string) {
  const ab = aireIntersection(a, b);
  const ba = aireIntersection(b, a);
  assert.ok(ab != null && ba != null, `${ou} : mesure rendue`);
  const e = ecartAdmis(a, b);
  assert.ok(Number.isFinite(ab) && Number.isFinite(ba), `${ou} : finie`);
  assert.ok(ab >= 0 && ba >= 0, `${ou} : positive`);
  assert.ok(ab <= Math.min(aireRegion(a), aireRegion(b)) + e, `${ou} : au plus l'aire de chaque région`);
  assert.ok(Math.abs(ab - ba) <= e, `${ou} : symétrique (${ab} / ${ba})`);
  assert.ok(Math.abs(ab - geosAB) <= e, `${ou} : A ∩ B = ${ab}, GEOS ${geosAB}, écart admis ${e}`);
  assert.ok(Math.abs(ba - geosBA) <= e, `${ou} : B ∩ A = ${ba}, GEOS ${geosBA}, écart admis ${e}`);
}

test("Oracle : GEOS est bien celui annoncé, et le corpus couvre chaque famille de la revue", () => {
  assert.match(ORACLE.geos, /^3\.\d+/);
  const familles = new Set(ORACLE.synthetiques.map((c) => c.famille));
  for (const f of ["revue", "contact", "micro", "bande", "partage", "concave", "trou", "multi", "oblique", "grande", "invalide", "aleatoire"]) {
    assert.ok(familles.has(f), `famille ${f}`);
  }
  assert.ok(ORACLE.synthetiques.filter((c) => c.famille === "aleatoire").length >= 400);
  assert.ok(ORACLE.reels.length >= 50);
});

test("Revue : bande de 4 mm contre la parcelle = 0 m² dans les deux ordres (la PR rendait 5 000 et 5 000,2)", () => {
  const c = cas("revue : bande extérieure [100 ; 100,004], frontière commune");
  const [a, b] = [region(c.a), region(c.b)];
  assert.equal(c.ab, 0, "GEOS : 0");
  assert.equal(c.ba, 0, "GEOS : 0");
  assert.ok(Math.abs(aireRegion(b) - 0.4) < 1e-9, "la bande fait bien 0,4 m²");
  assert.ok(aireIntersection(a, b)! <= ecartAdmis(a, b), `A ∩ B = ${aireIntersection(a, b)}`);
  assert.ok(aireIntersection(b, a)! <= ecartAdmis(a, b), `B ∩ A = ${aireIntersection(b, a)}`);
  verifier(a, b, c.ab, c.ba, c.nom);
});

test("Revue : chevauchement réel de 0,2 m² mesuré 0,2 m² dans les deux ordres", () => {
  const c = cas("revue : chevauchement réel de 0,2 m² [99,998 ; 100,002]");
  const [a, b] = [region(c.a), region(c.b)];
  for (const v of [aireIntersection(a, b)!, aireIntersection(b, a)!]) assert.ok(Math.abs(v - 0.2) < 1e-6, `${v}`);
  verifier(a, b, c.ab!, c.ba!, c.nom);
});

test("Contacts : bande séparée de 1 mm, frontière exactement commune, coin commun : 0 m²", () => {
  for (const nom of ["bande extérieure séparée de 1 mm", "bande extérieure de 10 m, frontière exactement commune", "coin commun seulement"]) {
    const c = cas(nom);
    const [a, b] = [region(c.a), region(c.b)];
    assert.equal(c.ab, 0, `${nom} : GEOS 0`);
    assert.ok(aireIntersection(a, b)! <= ecartAdmis(a, b), `${nom} : ${aireIntersection(a, b)}`);
    verifier(a, b, c.ab!, c.ba!, nom);
  }
});

test("Microchevauchements de 2 mm, 4 mm et 2 cm : 0,2, 0,4 et 2 m², jamais la moitié de la parcelle", () => {
  for (const [mm, surface] of [[2, 0.2], [4, 0.4], [20, 2]] as const) {
    for (const forme of ["bande large", "bande de 4 mm"] as const) {
      const c = cas(`chevauchement de ${mm} mm (${forme})`);
      // Une bande de 4 mm qui entre de 20 mm est tout entière dans la parcelle : 0,4 m².
      const attendu = forme === "bande de 4 mm" ? Math.min(mm, 4) / 10 : surface;
      const [a, b] = [region(c.a), region(c.b)];
      const v = aireIntersection(a, b)!;
      assert.ok(Math.abs(v - attendu) < 1e-6, `${mm} mm (${forme}) : ${v}, attendu ${attendu}`);
      verifier(a, b, c.ab!, c.ba!, c.nom);
    }
  }
  const c = cas("intersection réelle de 0,2 m² (bande de 1 m)");
  assert.ok(Math.abs(aireIntersection(region(c.a), region(c.b))! - 0.2) < 1e-6);
});

test("Bandes étroites de la première revue : 50 et 30 m², conservées", () => {
  for (const s of [50, 30]) {
    const c = cas(`bande intérieure de ${s} m²`);
    const v = aireIntersection(region(c.a), region(c.b))!;
    assert.ok(Math.abs(v - s) < 1e-6, `${s} m² : ${v}`);
    verifier(region(c.a), region(c.b), c.ab!, c.ba!, c.nom);
  }
});

test("Zones partagées, concaves, trous et multipolygones : concordance GEOS", () => {
  for (const c of ORACLE.synthetiques.filter((x) => ["partage", "concave", "trou", "multi", "oblique"].includes(x.famille))) {
    verifier(region(c.a), region(c.b), c.ab!, c.ba!, c.nom);
  }
  // Valeurs analytiques, indépendantes de GEOS comme de Clipper.
  const v = (nom: string) => aireIntersection(region(cas(nom).a), region(cas(nom).b))!;
  const proche = (x: number, y: number, ou: string) => assert.ok(Math.abs(x - y) < 1e-6, `${ou} : ${x}, attendu ${y}`);
  proche(v("zones partagées 40/60 : UA"), 4000, "UA");
  proche(v("zones partagées 40/60 : UB"), 6000, "UB");
  proche(v("zone identique à la parcelle"), 10_000, "zone identique");
  proche(v("concave : dans l'encoche"), 0, "encoche");
  proche(v("concave : bande de 4 mm contre l'angle rentrant"), 0, "bande contre l'angle rentrant");
  proche(v("trou : zone dans le trou"), 0, "dans le trou");
  proche(v("trou : zone égale au trou (frontière commune)"), 0, "égale au trou");
  proche(v("trou : zone qui déborde du trou de 2 mm"), 0.1, "déborde de 2 mm sur 50 m");
  proche(v("trou : bande de 4 mm dans le trou, contre son bord"), 0, "bande dans le trou");
  proche(v("multipolygone : bande de 4 mm entre deux parties"), 0, "entre deux parties");
  proche(v("multipolygone : à cheval sur les deux"), 50, "à cheval");
});

test("Grandes zones (2 000 sommets, 8 km) découpées à une fenêtre autour de la parcelle : concordance GEOS", () => {
  const grandes = ORACLE.synthetiques.filter((c) => c.famille === "grande");
  assert.equal(grandes.length, 4);
  for (const c of grandes) {
    const [a, b] = [region(c.a), region(c.b)];
    // L'écart admis se calcule sur la zone découpée, plus courte : on prend la borne sur la zone entière.
    const ab = aireIntersection(a, b)!;
    assert.ok(ab != null && Math.abs(ab - c.ab!) <= ecartAdmis(a, b), `${c.nom} : ${ab}, GEOS ${c.ab}`);
    const ba = aireIntersection(b, a);
    assert.ok(ba != null && Math.abs(ba - c.ba!) <= ecartAdmis(a, b), `${c.nom} (B ∩ A) : ${ba}, GEOS ${c.ba}`);
  }
  const proche = (nom: string, v: number) => assert.ok(Math.abs(aireIntersection(region(cas(nom).a), region(cas(nom).b))! - v) < 1e-6, nom);
  proche("grande zone : la fenêtre tombe dans son trou", 0);
  proche("grande zone : son trou recoupe la parcelle", 5000);
});

test("Corpus aléatoire (400 paires aux frontières quasi communes, graine 81) : invariants et concordance GEOS", () => {
  const aleatoires = ORACLE.synthetiques.filter((c) => c.famille === "aleatoire");
  for (const c of aleatoires) verifier(region(c.a), region(c.b), c.ab!, c.ba!, c.nom);
});

test("Loin de l'origine (40 km, plage 128 bits de Clipper) : mêmes aires, mêmes invariants", () => {
  for (const c of ORACLE.synthetiques.filter((x) => x.famille !== "invalide").filter((_, i) => i % 5 === 0)) {
    const a = translatee(region(c.a), 40_000, -35_000);
    const b = translatee(region(c.b), 40_000, -35_000);
    // La translation déplace l'arrondi : on admet l'écart d'arrondi des deux positions.
    verifier(a, b, c.ab!, c.ba!, `${c.nom} (translaté)`);
  }
});

test("Géométries invalides : jamais mesurées (repli explicite, `null`)", () => {
  const invalides = ORACLE.synthetiques.filter((c) => c.famille === "invalide");
  assert.equal(invalides.length, 4);
  for (const c of invalides) {
    assert.ok(!(c.valideA && c.valideB), `${c.nom} : GEOS la dit invalide`);
    const [a, b] = [region(c.a), region(c.b)];
    assert.equal(aireIntersection(a, b), null, `${c.nom} : A ∩ B`);
    assert.equal(aireIntersection(b, a), null, `${c.nom} : B ∩ A`);
    assert.equal(regionMesurable(c.valideA ? b : a), false, `${c.nom} : région non mesurable`);
  }
  // Hors de la plage de Clipper : pas d'exception, pas de mesure.
  const loin = translatee(region(cas("zone identique à la parcelle").b), 1e10, 0);
  assert.equal(aireIntersection(loin, loin), null);
  // Non fini.
  assert.equal(regionMesurable([[[0, 0], [Number.NaN, 0], [1, 1], [0, 0]]]), false);
});

test("Relevés réels (GeoJSON, projection de production) : chaque surface concorde avec GEOS", () => {
  const fixtures = new Map<string, { ban: { lon: number; lat: number }; parcelle: { geometry: Geo }; [k: string]: unknown }>();
  for (const r of ORACLE.reels) {
    if (!fixtures.has(r.cas)) fixtures.set(r.cas, JSON.parse(readFileSync(`src/lib/__fixtures__/fut81/${r.cas}.json`, "utf8")));
    const x = fixtures.get(r.cas)!;
    const proj = projectionPour(x.parcelle.geometry as never, [x.ban.lon, x.ban.lat]);
    const p = region(x.parcelle.geometry, proj);
    const z = region((x[r.couche] as { features: { geometry: Geo }[] }).features[r.indice].geometry, proj);
    const ou = `${r.cas} · ${r.couche} ${r.indice} « ${r.libelle} »`;
    assert.ok(r.aire != null && r.aireEquivalente != null, `${ou} : GEOS a mesuré`);
    verifier(p, z, r.aire, r.aire, ou);
    // Contre la projection équivalente, indépendante de la nôtre.
    const v = aireIntersection(p, z)!;
    assert.ok(Math.abs(v - r.aireEquivalente) <= 2e-4 * r.aireEquivalente + ecartAdmis(p, z), `${ou} : ${v} m², Lambert équivalente ${r.aireEquivalente}`);
    assert.ok(Math.abs(aireRegion(p) - r.aireParcelleEquivalente) <= 2e-4 * r.aireParcelleEquivalente, `${ou} : aire de la parcelle`);
  }
});

test("Relevés réels : les lignes traversantes mesurées comme GEOS, à 2 cm près", () => {
  assert.ok(ORACLE.lignes.length > 0);
  for (const l of ORACLE.lignes) {
    const x = JSON.parse(readFileSync(`src/lib/__fixtures__/fut81/${l.cas}.json`, "utf8"));
    const proj = projectionPour(x.parcelle.geometry, [x.ban.lon, x.ban.lat]);
    const lignes = lignesDe(x.prescriptionLin.features[l.indice].geometry, proj)!;
    const { dedans } = longueurDans(lignes, region(x.parcelle.geometry, proj));
    assert.ok(Math.abs(dedans - l.longueur) <= 0.02, `${l.cas} « ${l.libelle} » : ${dedans} m, GEOS ${l.longueur}`);
    assert.ok(Math.abs(dedans - l.longueurEquivalente) <= 0.02 + 2e-4 * l.longueurEquivalente, `${l.cas} : Lambert ${l.longueurEquivalente}`);
  }
});

test("La maille est le micromètre : mille fois plus fine que le centimètre des tracés publiés", () => {
  assert.equal(MAILLE_M, 1e-6);
  // Une bande de 2 µm à l'intérieur, sur 100 m : 0,0002 m², rendue, pas confondue avec la limite.
  const a = region({ type: "Polygon", coordinates: [[[0, 0], [100, 0], [100, 100], [0, 100], [0, 0]]] });
  const b = region({ type: "Polygon", coordinates: [[[99.999998, 0], [110, 0], [110, 100], [99.999998, 100], [99.999998, 0]]] });
  assert.ok(Math.abs(aireIntersection(a, b)! - 0.0002) <= ecartAdmis(a, b));
});
