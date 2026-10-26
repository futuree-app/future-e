// Reproduction de la troisième revue de Work (commentaire FUT-135 du 26/10/2026), réécrite d'après sa description :
// copies d'Angers, Rennes, Poitiers et Corte, seule `etudesSup` remplacée par une attestation contradictoire.
// Code de sortie 1 si l'identité étudiante est accordée ou si l'état n'est pas « incertain ».
import { createJiti } from "jiti";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
const root = process.cwd() + "/";
const j = createJiti(root, { alias: { "server-only": root + "scripts/mer/etude-courbe/vide.mjs", "@/": root + "src/" } });
const V = await j.import(root + "src/lib/comparateur-vie.ts");
const idx = JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")));
await V.getCommuneEntry("49007");
const W = "Pour une ville étudiante à taille humaine.";
const sup = { measured: true, radiusKm: 5, establishmentCount: 1, weightedAccess: 2 };
const sortie = [];
for (const insee of ["49007", "35238", "86194", "2B096"]) {
  const reel = idx.communes.find((c) => c.insee === insee);
  const c = { ...reel, etudesSup: sup };
  sortie.push({
    insee, nom: reel.nom, etat: V.etatEtablissementSup(sup), identiteEtudiante: V.buildIdentiteCandidates(c).includes(W),
    identiteReelle: V.buildIdentiteCandidates(reel).includes(W), score: V.subScore("vie_etudiante", c), scoreReel: V.subScore("vie_etudiante", reel),
  });
}
const violations = sortie.filter((r) => r.etat !== "incertain" || r.identiteEtudiante || !r.identiteReelle || r.score !== r.scoreReel);
console.log(JSON.stringify({ sup, sortie, violations: violations.length }, null, 2));
if (violations.length) process.exitCode = 1;
