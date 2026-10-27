// FUT-81, troisième revue (SHA 30333cf5) : la reproduction de Work, par le VRAI collecteur
// (`fetchUrbanismeParcelle`), face à un GPU simulé qui répond selon la géométrie reçue, puis par le
// versionnement (`issueActualisation`) contre une version N mesurée à la parcelle.
// Usage : node repro-work.mjs <racine d'un dépôt au SHA à rejouer>
import { register } from "node:module";
register(`data:text/javascript,${encodeURIComponent(`export async function resolve(s, c, n) {
  if (s === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  return n(s, c); }`)}`);
const racine = process.argv[2];
const { fetchUrbanismeParcelle } = await import(`${racine}/src/lib/gpu.ts`);
const { lireUrbanisme } = await import(`${racine}/src/lib/urbanisme-parcelle.ts`);
const { issueActualisation, jsonCanonique, sourcesAbsentes } = await import(`${racine}/src/lib/logement-report-version.ts`);

// Repère en mètres autour de 2° E / 46° N (même échelle que la production à `fut81-3` près : sans effet ici).
const xy = (x, y) => [2 + x / 77_300, 46 + y / 111_170];
const rect = (a, b, c, d) => ({ type: "Polygon", coordinates: [[xy(a, b), xy(c, b), xy(c, d), xy(a, d), xy(a, b)]] });
const DOC = "0123456789abcdef0123456789abcdef";
const f = (geometry, p) => ({ properties: { gpu_doc_id: DOC, ...p }, geometry });
const PARCELLE_INVALIDE = { type: "MultiPolygon", coordinates: [rect(0, 0, 60, 60).coordinates, rect(40, 40, 100, 100).coordinates] };
const ADRESSE = xy(-2, 10);
const REPONSES = {
  // Ce que le GPU rend pour la PARCELLE : une zone et un emplacement réservé, loin de l'adresse.
  parcelle: { "zone-urba": [f(rect(30, 30, 300, 300), { libelle: "UB", typezone: "U" })], "prescription-surf": [f(rect(50, 50, 70, 70), { typepsc: "05", stypepsc: "01", libelle: "Emplacement réservé voisin" })] },
  // Ce qu'il rend au POINT de l'adresse : la zone qui le contient.
  point: { "zone-urba": [f(rect(-500, -500, 20, 500), { libelle: "UA", typezone: "U" })] },
};
const requetes = [];
globalThis.fetch = async (url, init) => {
  const u = String(url);
  const couche = u.match(/api\/gpu\/([a-z-]+)$/)?.[1];
  if (couche) {
    const t = JSON.parse(String(init?.body)).geom.type;
    requetes.push(`${couche}:${t}`);
    const base = { municipality: [{ properties: { is_rnu: false } }], document: [{ properties: { gpu_doc_id: DOC, du_type: "PLU", name: "12345_PLU_20250101" } }], "secteur-cc": [], "prescription-surf": [], "prescription-lin": [], "prescription-pct": [] };
    return new Response(JSON.stringify({ features: { ...base, ...(t === "Point" ? REPONSES.point : REPONSES.parcelle) }[couche] ?? [] }));
  }
  if (/details$/.test(u)) return new Response(JSON.stringify({ effectiveStatus: "EN_VIGUEUR", legalStatus: "APPROVED" }));
  if (/files$/.test(u)) return new Response("[]");
  return new Response("inattendu", { status: 500 });
};
const u = await fetchUrbanismeParcelle(ADRESSE[1], ADRESSE[0], { geometry: PARCELLE_INVALIDE, contenance: 8400, rattachement: "repli", distanceM: 2 });

// La version N : la même adresse, lue à la parcelle quand son tracé était valide.
const N_lecture = lireUrbanisme({
  point: ADRESSE, parcelle: { geometry: rect(0, 0, 100, 100), contenance: 10000, rattachement: "repli", distanceM: 2 },
  municipality: [{ properties: { is_rnu: false } }], documents: [{ properties: { gpu_doc_id: DOC, du_type: "PLU", name: "12345_PLU_20250101" } }],
  zones: [f(rect(-500, -500, 500, 500), { libelle: "UA", typezone: "U" })], secteurs: [], prescriptions: { surface: [], ligne: [], point: [] },
  details: { [DOC]: { effectiveStatus: "EN_VIGUEUR", legalStatus: "APPROVED" } }, fichiers: { [DOC]: [] },
});
const rapport = (urbanisme) => ({ address: { id: "x", label: "x", city: "x", citycode: "x", postcode: "x", latitude: 46, longitude: 2 }, parcel: null, urbanisme });
const N = { numero: 1, collecteeLe: "2026-10-01T00:00:00Z", sourcesAbsentes: sourcesAbsentes(rapport(N_lecture)), synthese: null, syntheseHash: null, report: rapport(N_lecture), reportHash: "n", syntheseDpe: null };
const nouveau = rapport(u);
console.log(JSON.stringify({
  requetes: [...new Set(requetes.filter((r) => !r.startsWith("municipality")).map((r) => r.split(":")[1]))],
  statut: u.statut, grain: u.grain, interrogation: u.interrogation ?? "(absent)", rattachement: u.rattachement, ambiguites: u.ambiguites,
  zones: u.zones.map((z) => z.libelle), zonesNonMesurables: u.zonesNonMesurables,
  prescriptions: u.prescriptions.map((p) => `${p.libelle} : ${p.etendue}`),
  actualisationContreN: issueActualisation(nouveau, jsonCanonique(nouveau), N),
}, null, 1));
