// FUT-157 : cherche des adresses réelles dont le POINT est hors d'un périmètre mais dont la PARCELLE attribuée le
// recoupe (ou le borde), à partir de lignes brutes déjà téléchargées (aucun appel Géorisques). Pour la recette.
// Usage : node scripts/fut157/chercher-traversees.mjs <fichier.json> [max]
import fs from "node:fs";
import { createJiti } from "jiti";
const racine = process.cwd() + "/";
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const { urlRechercheBan, urlReverseBan } = await jiti.import(racine + "src/lib/geocodeur-ban.ts");
const { findCadastreParcelWithGeometry } = await jiti.import(racine + "src/lib/cadastre.ts");
const T = await jiti.import(racine + "src/lib/sites-sols-terrain.ts");
const S = await jiti.import(racine + "src/lib/sites-sols.ts");
const [fichier, max = "25"] = process.argv.slice(2);
const lignes = JSON.parse(fs.readFileSync(fichier, "utf8"));
const page = { results: lignes.length, total_pages: 1, data: lignes };
const vide = { results: 0, total_pages: 0, data: [] };
const inv = /sup/.test(fichier) ? "sup" : /instructions/.test(fichier) ? "instructions" : "sis";
const categories = { sis: S.lireCategorieGeo([inv === "sis" ? page : vide]), sup: S.lireCategorieGeo([inv === "sup" ? page : vide]), instructions: S.lireCategorieGeo([inv === "instructions" ? page : vide]) };
let n = 0;
const vus = new Set();
for (const r of lignes) {
  if (n >= Number(max) || !r.geom || !/Polygon/.test(r.geom.type) || vus.has(r.identifiant_ssp)) continue;
  vus.add(r.identifiant_ssp);
  const sommets = r.geom.coordinates[0][0].filter((_, i, a) => i % Math.max(1, Math.floor(a.length / 4)) === 0).slice(0, 4);
  for (const [lon, lat] of sommets) {
    const ban = await (await fetch(urlReverseBan({ lon, lat, type: "housenumber", limit: 4 }))).json();
    for (const f of ban.features) {
      if (vus.has(f.properties.id)) continue;
      vus.add(f.properties.id);
      const [x, y] = f.geometry.coordinates;
      const lu = await findCadastreParcelWithGeometry(x, y).catch(() => null);
      const e = { point: [x, y], geocodage: "housenumber", parcelle: lu ? { geometry: lu.geometry, code: lu.parcel.parcelCode, rattachement: lu.parcel.rattachement ?? "point", candidatsAuPoint: lu.parcel.candidatsAuPoint, distanceRepliM: lu.parcel.distanceRepliM } : null };
      const l = T.lireSitesSolsTerrain(e, { categories, sansEmprise: { etat: "complet", fiches: [] } });
      for (const fi of l.fiches.filter((z) => z.id === r.identifiant_ssp && z.situation !== "point_dans")) {
        console.log(JSON.stringify({ adresse: f.properties.label, ban: f.properties.id, site: fi.nom, situation: fi.situation, part: fi.part, surfaceM2: fi.surfaceM2, parcelle: l.parcelle }));
        n++;
      }
    }
  }
}
