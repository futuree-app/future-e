// FUT-157 : fige, pour quelques adresses, les RÉPONSES BRUTES qui décident de leur lecture (feature BAN, parcelle
// rattachée par le vrai code du dossier, pages Géorisques des trois inventaires au rayon que le dossier
// demande, compte communal des fiches sans géométrie). Les tests rejouent la lecture depuis ces réponses, sans
// réseau. Usage (racine du dépôt) : node scripts/fut157/capturer-cas.mjs <sortie.json> "<adresse>" [...]
import fs from "node:fs";
import { createJiti } from "jiti";
const racine = process.cwd() + "/";
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const { urlRechercheBan } = await jiti.import(racine + "src/lib/geocodeur-ban.ts");
const { findCadastreParcelWithGeometry } = await jiti.import(racine + "src/lib/cadastre.ts");
const { planDeRecherche, adresseDuLibelle } = await jiti.import(racine + "src/lib/sites-sols-terrain.ts");
const { lireSansEmprise } = await jiti.import(racine + "src/lib/server/sites-sols.ts");
const { precisionDepuisBanId } = await jiti.import(racine + "src/lib/bruit-aerien.ts");
const { EN_TETES_GEORISQUES } = await jiti.import(racine + "src/lib/georisques-http.ts");

const [sortie, ...adresses] = process.argv.slice(2);
const deja = fs.existsSync(sortie) ? JSON.parse(fs.readFileSync(sortie, "utf8")) : { capture: null, cas: [] };
const CHEMINS = { sis: "conclusions_sis", sup: "conclusions_sup", instructions: "instructions" };

// Outil de capture : un appel coupé est retenté (trois fois), pour que le cas figé soit une lecture COMPLÈTE.
async function lire(u, opts = {}) {
  for (let essai = 1; ; essai++) {
    try { return await fetch(u, { ...opts, signal: AbortSignal.timeout(30000) }); }
    catch (e) { if (essai >= 3) throw e; await new Promise((r) => setTimeout(r, 1500 * essai)); }
  }
}

async function pages(chemin, lon, lat, rayon) {
  const out = [];
  for (let n = 1; n <= 5; n++) {
    const u = `https://georisques.gouv.fr/api/v1/ssp/${chemin}?latlon=${lon},${lat}&rayon=${rayon}&page=${n}&page_size=1000`;
    const r = await lire(u, { headers: EN_TETES_GEORISQUES });
    if (!r.ok) throw new Error(`${chemin} ${r.status}`);
    const p = await r.json();
    out.push(p);
    if (!(p.total_pages > n)) break;
  }
  return out;
}

for (const q of adresses) {
  const ban = await (await lire(urlRechercheBan({ q, limit: 1 }))).json();
  const f = ban.features[0];
  const [lon, lat] = f.geometry.coordinates;
  const lu = await findCadastreParcelWithGeometry(lon, lat);
  const entree = {
    point: [lon, lat], geocodage: precisionDepuisBanId(f.properties.id),
    parcelle: lu ? { geometry: lu.geometry, code: lu.parcel.parcelCode, rattachement: lu.parcel.rattachement ?? "point", candidatsAuPoint: lu.parcel.candidatsAuPoint, distanceRepliM: lu.parcel.distanceRepliM } : null,
    adresse: adresseDuLibelle(f.properties.label, f.properties.postcode, f.properties.city),
  };
  const { rayonM } = planDeRecherche(entree);
  const reponses = {};
  for (const [k, c] of Object.entries(CHEMINS)) reponses[k] = await pages(c, lon, lat, rayonM);
  let sansEmprise = await lireSansEmprise(f.properties.citycode);
  for (let essai = 1; sansEmprise.etat !== "complet" && essai < 3; essai++) sansEmprise = await lireSansEmprise(f.properties.citycode);
  deja.cas = deja.cas.filter((x) => x.ban !== f.properties.id);
  deja.cas.push({ adresse: f.properties.label, ban: f.properties.id, insee: f.properties.citycode, entree, rayonM, reponses, sansEmprise });
  console.log(f.properties.label, rayonM, Object.fromEntries(Object.entries(reponses).map(([k, v]) => [k, v[0].results])), sansEmprise.etat, sansEmprise.fiches.length);
}
deja.capture = new Date().toISOString();
fs.writeFileSync(sortie, JSON.stringify(deja));
