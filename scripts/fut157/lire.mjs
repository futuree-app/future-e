// FUT-157 : la lecture des sols pollués d'une adresse, par la VRAIE chaîne du dossier (BAN, cadastre
// `findCadastreParcelWithGeometry`, Géorisques `lireSitesSolsAdresse`). Lecture seule, aucune base.
// Usage (racine du dépôt) : node scripts/fut157/lire.mjs "<adresse>" ["<adresse>" ...]
import { createJiti } from "jiti";
const racine = process.cwd() + "/";
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const { urlRechercheBan } = await jiti.import(racine + "src/lib/geocodeur-ban.ts");
const { findCadastreParcelWithGeometry } = await jiti.import(racine + "src/lib/cadastre.ts");
const { lireSitesSolsAdresse } = await jiti.import(racine + "src/lib/server/sites-sols.ts");
const { etatSitesSols, ficheDemontree } = await jiti.import(racine + "src/lib/sites-sols-etat.ts");
const { precisionDepuisBanId } = await jiti.import(racine + "src/lib/bruit-aerien.ts");
const { adresseDuLibelle } = await jiti.import(racine + "src/lib/sites-sols-terrain.ts");
const { texteSitesSols } = await jiti.import(racine + "src/lib/sites-sols-texte.ts");
const avecTexte = process.argv.includes("--texte");

for (const q of process.argv.slice(2).filter((a) => a !== "--texte")) {
  const ban = await (await fetch(urlRechercheBan({ q, limit: 1 }))).json();
  const f = ban.features[0];
  const [lon, lat] = f.geometry.coordinates;
  const lu = await findCadastreParcelWithGeometry(lon, lat).catch(() => null);
  const t0 = Date.now();
  const l = await lireSitesSolsAdresse({
    point: [lon, lat], geocodage: precisionDepuisBanId(f.properties.id),
    parcelle: lu ? { geometry: lu.geometry, code: lu.parcel.parcelCode, rattachement: lu.parcel.rattachement ?? "point", candidatsAuPoint: lu.parcel.candidatsAuPoint, distanceRepliM: lu.parcel.distanceRepliM } : null,
    adresse: adresseDuLibelle(f.properties.label, f.properties.postcode, f.properties.city),
  }, f.properties.citycode);
  console.log(JSON.stringify({
    adresse: f.properties.label, ban: f.properties.id, point: [lon, lat], ms: Date.now() - t0,
    etat: etatSitesSols(l), portee: l.portee, parcelle: l.parcelle, rayonM: l.rayonM, inventaires: l.inventaires, sansEmprise: l.sansEmprise,
    fiches: l.fiches.map((x) => ({ inv: x.inventaire, nom: x.nom, id: x.id, situation: x.situation, demontree: ficheDemontree(x, l), part: x.part, surfaceM2: x.surfaceM2, statut: x.statut, maj: x.miseAJour })),
  }));
  if (avecTexte) console.log(JSON.stringify({ texte: texteSitesSols(l) }, null, 1));
}
