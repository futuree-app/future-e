// FUT-157 : la parcelle que le dossier rattache à un point, par le VRAI code (`findCadastreParcelWithGeometry`).
// Lecture seule. Usage (racine du dépôt) : node scripts/fut157/rattachement.mjs <lon> <lat> [<lon> <lat> ...]
import { createJiti } from "jiti";
const racine = process.cwd() + "/";
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const { findCadastreParcelWithGeometry } = await jiti.import(racine + "src/lib/cadastre.ts");
const a = process.argv.slice(2).map(Number);
for (let i = 0; i < a.length; i += 2) {
  const lu = await findCadastreParcelWithGeometry(a[i], a[i + 1]);
  console.log(JSON.stringify({ point: [a[i], a[i + 1]], parcel: lu?.parcel ?? null, geometry: lu?.geometry ?? null }));
}
