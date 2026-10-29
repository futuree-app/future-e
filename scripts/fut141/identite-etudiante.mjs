// FUT-141 · Contre-revue, réserve 1 : photographie de l'identité « Pour une ville étudiante à taille humaine. »
// sur TOUTES les communes de l'index courant, avec le vrai moteur (hors réseau). Se lance avant et après la
// correction, puis compare :
//   node scripts/fut141/identite-etudiante.mjs --photo <sortie.json>
//   node scripts/fut141/identite-etudiante.mjs --comparer <avant.json> <apres.json>
// Pour chaque commune : l'identité est-elle candidate, la liste complète des candidats, le premier libellé, et
// les mesures qui la gouvernent (score, part étudiante du bassin, état de l'établissement, rayon, pôle).
import { createJiti } from "jiti";
import { readFileSync, writeFileSync } from "node:fs";
import zlib from "node:zlib";

const racine = process.cwd() + "/";
const ID = "Pour une ville étudiante à taille humaine.";
const mode = process.argv[2];

async function photographier(sortie) {
  const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
  const V = await jiti.import(racine + "src/lib/comparateur-vie.ts");
  const { communes } = JSON.parse(zlib.gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8"));
  await V.getCommuneEntry(communes[0].insee);
  const photo = {};
  for (const c of communes) {
    const candidats = V.buildIdentiteCandidates(c);
    photo[c.insee] = {
      nom: c.nom, population: c.population ?? null, vie: V.subScore("vie_etudiante", c), dyn: c.etudes_dyn ?? null,
      etablissement: V.etatEtablissementSup(c.etudesSup), rayonKm: c.etudesSup?.radiusKm ?? null,
      locale: V.villeEtudianteLocale(c), candidate: candidats.includes(ID), premier: candidats[0], candidats,
    };
  }
  writeFileSync(sortie, JSON.stringify(photo));
  console.log(`${sortie} : ${Object.keys(photo).length} communes, ${Object.values(photo).filter((x) => x.candidate).length} candidates`);
}

function comparer(fa, fb) {
  const A = JSON.parse(readFileSync(fa, "utf8")), B = JSON.parse(readFileSync(fb, "utf8"));
  const insees = Object.keys(A);
  const autres = insees.filter((i) => JSON.stringify(A[i].candidats.filter((x) => x !== ID)) !== JSON.stringify(B[i].candidats.filter((x) => x !== ID)));
  const retirees = insees.filter((i) => A[i].candidate && !B[i].candidate);
  const ajoutees = insees.filter((i) => !A[i].candidate && B[i].candidate);
  const premiers = insees.filter((i) => A[i].premier !== B[i].premier);
  const ligne = (i) => ({ insee: i, nom: A[i].nom, population: A[i].population, vie: A[i].vie, dyn: A[i].dyn, etablissement: A[i].etablissement, premierAvant: A[i].premier, premierApres: B[i].premier });
  const parPalierDyn = {};
  for (const i of retirees) { const k = A[i].dyn == null ? "non mesuré" : A[i].dyn >= 34 ? "intermédiaire (34-65)" : "limitée (< 34)"; parPalierDyn[k] = (parPalierDyn[k] ?? 0) + 1; }
  // Invariants de la nouvelle règle, sur l'après.
  const fautes = insees.filter((i) => B[i].candidate && !(B[i].vie >= 55 && B[i].dyn != null && B[i].dyn >= 66 && B[i].locale && B[i].etablissement === "presence"));
  const oubliees = insees.filter((i) => !B[i].candidate && B[i].vie >= 55 && B[i].dyn != null && B[i].dyn >= 66 && B[i].locale);
  const nouveauxPremiers = {};
  for (const i of premiers) nouveauxPremiers[B[i].premier] = (nouveauxPremiers[B[i].premier] ?? 0) + 1;
  console.log(JSON.stringify({
    candidates: { avant: insees.filter((i) => A[i].candidate).length, apres: insees.filter((i) => B[i].candidate).length },
    retirees: retirees.length, ajoutees: ajoutees.length, retireesParPalierDeLaPartEtudiante: parPalierDyn,
    premiersLibellesChanges: premiers.length, premiersApres: nouveauxPremiers,
    autresCandidatsModifies: autres.length,
    invariants: { candidatesHorsRegle: fautes.length, regleSatisfaiteSansIdentite: oubliees.length },
    detailRetirees: retirees.map(ligne).sort((a, b) => (b.population ?? 0) - (a.population ?? 0)),
  }, null, 1));
  if (ajoutees.length || autres.length || fautes.length || oubliees.length) process.exit(1);
}

if (mode === "--photo") await photographier(process.argv[3]);
else if (mode === "--comparer") comparer(process.argv[3], process.argv[4]);
else { console.error("usage : --photo <sortie.json> | --comparer <avant.json> <apres.json>"); process.exit(1); }
