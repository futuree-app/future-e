// Reproduction du blocage géométrique de la 2e revue (SHA audité e73ec075). Usage : node repro.mts <racine worktree>
const racine = process.argv[2];
const G = await import(`${racine}/src/lib/geometrie-parcelle.ts`);
const U = await import(`${racine}/src/lib/urbanisme-parcelle.ts`);
const P = G.projectionAutour(2, 46);
const xy = (x, y) => [2 + x / (111_320 * Math.cos((46 * Math.PI) / 180)), 46 + y / 110_574];
const rect = (a, b, c, d) => ({ type: "Polygon", coordinates: [[xy(a, b), xy(c, b), xy(c, d), xy(a, d), xy(a, b)]] });
// Régions directement en mètres (sans projection) pour la reproduction exacte de Work.
const rm = (a, b, c, d) => [[[a, b], [c, b], [c, d], [a, d], [a, b]]];
const out = {};
const A = rm(0, 0, 100, 100);
for (const [nom, B] of [
    ["Work : bande [100,100.004] (frontière commune, 0,4 m² hors de A)", rm(100, 0, 100.004, 100)],
    ["Variante Work : chevauchement réel de 0,2 m² [99.998,100.002]", rm(99.998, 0, 100.002, 100)],
]) {
    out[nom] = { "A∩B": G.aireIntersection(A, B), "B∩A": G.aireIntersection(B, A) };
}
const DOC = "0123456789abcdef0123456789abcdef";
const entree = (presc) => ({
    point: xy(50, 50), parcelle: { geometry: rect(0, 0, 100, 100), contenance: 10000, rattachement: "point" },
    municipality: [{ properties: { is_rnu: false } }], documents: [{ properties: { gpu_doc_id: DOC, du_type: "PLU", name: "12345_PLU_20250101" } }],
    zones: [{ properties: { gpu_doc_id: DOC, libelle: "UA", typezone: "U" }, geometry: rect(-500, -500, 500, 500) }], secteurs: [],
    prescriptions: { surface: [{ properties: { gpu_doc_id: DOC, typepsc: "05", stypepsc: "01", libelle: "ER voisin" }, geometry: presc }], ligne: [], point: [] },
    details: { [DOC]: { effectiveStatus: "EN_VIGUEUR", legalStatus: "APPROVED" } }, fichiers: { [DOC]: [] },
});
for (const [nom, g] of [["GeoJSON bande voisine [100,100.004]", rect(100, 0, 100.004, 100)], ["GeoJSON chevauchement 0,2 m²", rect(99.998, 0, 100.002, 100)]]) {
    const u = U.lireUrbanisme(entree(g));
    out[`lireUrbanisme — ${nom}`] = { statut: u.statut, prescriptions: u.prescriptions.map((p) => ({ etendue: p.etendue, part: p.part, surfaceM2: p.surfaceM2 })), contact: u.prescriptionsContact };
}
console.log(JSON.stringify(out, null, 2));
