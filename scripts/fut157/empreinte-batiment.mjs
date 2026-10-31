// FUT-157, défaut hors périmètre B : deux collectes IDENTIQUES donnent-elles deux empreintes différentes ?
// La seule différence entre les deux rapports est l'heure de la consultation du RNB (`batiment.consulteLe`,
// posée par `rnb.ts` : `new Date().toISOString()`). L'empreinte est calculée comme `empreinteRapport`
// (`server/logement-report-versions.ts`, non importé ici : il crée un client Supabase au chargement).
// Usage : node scripts/fut157/empreinte-batiment.mjs
import { createJiti } from "jiti";
import { createHash } from "node:crypto";
import fs from "node:fs";

const racine = process.cwd() + "/";
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const V = await jiti.import(racine + "src/lib/logement-report-version.ts");
const R = await jiti.import(racine + "src/lib/batiment-rnb.ts");
const empreinte = (r) => createHash("sha256").update(V.jsonCanonique(r)).digest("hex");

const reponseRnb = JSON.parse(fs.readFileSync(racine + "src/lib/__fixtures__/fut80/la_couarde_maison.json", "utf8")).rnb;
const rapport = (consulteLe) => ({
  address: { id: "17121_0660_00012", label: "12 rue Test 17670 La Couarde-sur-Mer", city: "La Couarde-sur-Mer", citycode: "17121", postcode: "17670", latitude: 46.19, longitude: -1.42 },
  parcel: { parcelCode: "17121000AB0001", nomCommune: "La Couarde-sur-Mer", contenance: 500 },
  altitude: 4, zfe: { inZfe: false, zones: [] }, cartofriches: { count: 0, tronque: false, sansCoordonnees: 0, friches: [] },
  communeData: {}, sinistralite: {}, georisques: { address: {}, parcel: null, commune: {} },
  heritage: { items: [], sourceStatus: "ok" }, dpeCandidates: [],
  batiment: R.identiteDepuisRnb(reponseRnb, consulteLe),
});

const a = rapport("2026-10-30T09:00:00.000Z");
const b = rapport("2026-10-30T09:05:00.000Z");
const ancienne = { numero: 1, collecteeLe: "2026-10-30T09:00:00.000Z", sourcesAbsentes: V.sourcesAbsentes(a), report: a, reportHash: empreinte(a), synthese: null, syntheseHash: null, syntheseDpe: null };
let ecritures = 0;
const vu = await V.consulterOuActualiser(true, {
  lire: async () => ancienne,
  construire: async () => b,
  empreinte,
  enregistrer: async (r, h) => { ecritures++; return { ...ancienne, numero: 2, report: r, reportHash: h }; },
});
const sansDate = (r) => ({ ...r, batiment: { ...r.batiment, consulteLe: undefined } });
console.log(JSON.stringify({
  statutBatiment: a.batiment.statut,
  memesFaitsHorsDate: V.jsonCanonique(sansDate(a)) === V.jsonCanonique(sansDate(b)),
  empreinteA: empreinte(a).slice(0, 12), empreinteB: empreinte(b).slice(0, 12),
  empreintesEgales: empreinte(a) === empreinte(b),
  issue: V.issueActualisation(b, empreinte(b), ancienne),
  actualisationRendue: vu.actualisation, versionRendue: vu.version?.numero ?? null, ecritures,
}, null, 1));
