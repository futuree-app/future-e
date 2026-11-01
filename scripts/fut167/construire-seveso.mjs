// FUT-167 · Construit `data/installations-seveso.json` depuis une extraction nationale des installations classées
// (`extraire-icpe.mjs`). Refuse d'écrire si l'extraction a perdu des lignes Seveso potentielles sans le dire.
// Usage : node scripts/fut167/construire-seveso.mjs <extraction.json>
//
// ACTUALISATION. Les statuts Seveso changent rarement (quelques dizaines de sites par an). Relancer les deux scripts
// chaque trimestre suffit ; la date d'extraction est affichée au lecteur, il sait donc de quand date la liste.
import { readFileSync, writeFileSync } from "node:fs";
import { construireIndexSeveso } from "../../src/lib/data/installations-seveso.ts";

const brut = JSON.parse(readFileSync(process.argv[2], "utf8"));
// Le référentiel des communes, pour placer au centre de sa commune un site dont la position publiée est absente ou fausse.
const communes = readFileSync("data/communes-france-coords.csv", "utf8").trim().split("\n").slice(1).map((l) => {
  const [insee, nom, lat, lon] = l.split(",");
  return { insee, nom, lat: Number(lat), lon: Number(lon) };
});
if (brut.total < 0.98 * brut.annonce) throw new Error(`extraction incomplète : ${brut.total} lignes sur ${brut.annonce}`);
const index = construireIndexSeveso({ extraitLe: brut.extraitLe, source: brut.source, lignes: brut.lignes, communes });
const meta = { ...index, extraction: { annonce: brut.annonce, lues: brut.total, illisibles: brut.illisibles?.length ?? 0 } };
writeFileSync("data/installations-seveso.json", JSON.stringify(meta) + "\n");
const haut = index.sites.filter((s) => s[2] === "h").length;
console.log(`${index.sites.length} sites Seveso (${haut} seuil haut, ${index.sites.length - haut} seuil bas), ${index.exclus.length} exclus, extraction du ${brut.extraitLe} : ${brut.total}/${brut.annonce} lignes, ${meta.extraction.illisibles} illisibles`);
for (const e of index.exclus) console.log(`  exclu ${e.code} ${e.nom} : ${e.motif}`);
