// FUT-157, point 3 : Cartofriches peut-il faire refuser une actualisation ? Une version N collectée avec
// Cartofriches, puis une collecte N+1 où seul Cartofriches n'a pas répondu (`cartofriches: null`, la route attrape
// la panne), et une autre donnée qui change. Usage : node scripts/fut157/cartofriches-refus.mjs
// Relevé le 30/10/2026 sur 5ba4dcaa (avant le retrait) : {"sourcesAbsentesN1":["friches"],"issue":"refusee"}.
// Après le retrait : {"sourcesAbsentesN1":[],"issue":"nouvelle_version"}.
import { createJiti } from "jiti";
import { createHash } from "node:crypto";
const racine = process.cwd() + "/";
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const V = await jiti.import(racine + "src/lib/logement-report-version.ts");
const empreinte = (r) => createHash("sha256").update(V.jsonCanonique(r)).digest("hex");
const base = {
  address: { id: "99999_test_00001", label: "1 rue Synthétique", city: "Testville", citycode: "99999", postcode: "99000", latitude: 46, longitude: 2 },
  parcel: { parcelCode: "99999000AA0001", nomCommune: "Testville", contenance: 500 }, altitude: 12, zfe: { inZfe: false, zones: [] },
  communeData: {}, sinistralite: {}, georisques: { address: {}, parcel: null, commune: {} }, heritage: { items: [], sourceStatus: "ok" }, dpeCandidates: [],
};
const n = { ...base, cartofriches: { count: 0, tronque: false, sansCoordonnees: 0, friches: [] } };
const n1 = { ...base, cartofriches: null, altitude: 13 }; // une autre donnée a changé : l'actualisation est légitime
const ancienne = { numero: 1, collecteeLe: "2026-10-30T09:00:00.000Z", sourcesAbsentes: V.sourcesAbsentes(n), report: n, reportHash: empreinte(n), synthese: null, syntheseHash: null, syntheseDpe: null };
console.log(JSON.stringify({ sourcesAbsentesN1: V.sourcesAbsentes(n1), issue: V.issueActualisation(n1, empreinte(n1), ancienne) }));
