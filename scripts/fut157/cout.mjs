// FUT-157 : le coût réseau de la lecture, à froid (aucun cache : hors de Next, `fetch` ne garde rien) : nombre
// d'appels Géorisques, octets reçus, durée de la recherche autour du point et de la lecture communale.
// Usage : node scripts/fut157/cout.mjs "<adresse>" [...]
import { createJiti } from "jiti";
const racine = process.cwd() + "/";
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const { urlRechercheBan } = await jiti.import(racine + "src/lib/geocodeur-ban.ts");
const { findCadastreParcelWithGeometry } = await jiti.import(racine + "src/lib/cadastre.ts");
const { getSitesSolsAutour, lireSansEmprise } = await jiti.import(racine + "src/lib/server/sites-sols.ts");
const { planDeRecherche } = await jiti.import(racine + "src/lib/sites-sols-terrain.ts");
const { precisionDepuisBanId } = await jiti.import(racine + "src/lib/bruit-aerien.ts");

const vrai = globalThis.fetch;
let appels = 0, octets = 0;
globalThis.fetch = async (u, o) => {
  const r = await vrai(u, o);
  if (String(u).includes("georisques")) { appels++; const b = await r.clone().arrayBuffer(); octets += b.byteLength; }
  return r;
};
for (const q of process.argv.slice(2)) {
  const f = (await (await vrai(urlRechercheBan({ q, limit: 1 }))).json()).features[0];
  const [lon, lat] = f.geometry.coordinates;
  const lu = await findCadastreParcelWithGeometry(lon, lat).catch(() => null);
  const { rayonM } = planDeRecherche({ point: [lon, lat], geocodage: precisionDepuisBanId(f.properties.id), parcelle: lu ? { geometry: lu.geometry, code: lu.parcel.parcelCode, rattachement: lu.parcel.rattachement ?? "point", candidatsAuPoint: lu.parcel.candidatsAuPoint } : null });
  appels = 0; octets = 0; let t = Date.now();
  await getSitesSolsAutour(lon, lat, rayonM);
  const autour = { appels, ko: Math.round(octets / 1024), ms: Date.now() - t };
  appels = 0; octets = 0; t = Date.now();
  await lireSansEmprise(f.properties.citycode);
  const commune = { appels, ko: Math.round(octets / 1024), ms: Date.now() - t };
  console.log(`${f.properties.label.padEnd(45)} rayon ${String(rayonM).padStart(4)} m | autour : ${autour.appels} appels, ${autour.ko} Ko, ${autour.ms} ms | commune : ${commune.appels} appels, ${commune.ko} Ko, ${commune.ms} ms`);
}
