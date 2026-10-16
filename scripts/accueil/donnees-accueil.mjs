// FUT-50 · LES DONNÉES LÉGÈRES DE L'ACCUEIL : dérivées, reproductibles, vérifiées au build.
//
// L'accueil lit deux fichiers compacts au lieu de l'index du comparateur (67 Mo décompressés) et de
// `data_climat.json` (63 Mo) :
//   - `src/data/accueil-communes.json` (CE SCRIPT) : identité et intrants des lectures « Petite ville » et « Hivers
//     doux », pour chaque commune de l'index (Hexagone et Corse, arrondissements compris) ;
//   - `src/data/apercu-climat-communes.json` (`scripts/build-apercu-climat.mjs`, FUT-30) : l'extrait DRIAS déjà
//     partagé avec l'aperçu du paywall, étendu aux colonnes de l'accueil. UN seul extrait climatique, pas deux.
//
// UNE SEULE SOURCE DE VÉRITÉ : rien n'est calculé ici. Chaque valeur est lue par les fonctions du produit
// (`getCommuneEntry`, `tailleVilleResolvedOf`) et recopiée telle quelle. Les règles de décision ne sont jamais
// réécrites : la lecture de l'accueil les rappelle sur ces intrants (`src/lib/accueil/lecture-accueil.ts`).
// L'outre-mer n'y figure pas : il a son propre référentiel (`@/lib/outremer`).
//
// Usage :
//   node scripts/accueil/donnees-accueil.mjs            VÉRIFIE sans rien écrire (le build l'appelle : prebuild) :
//                                                       reconstruit en mémoire et compare octet pour octet
//   node scripts/accueil/donnees-accueil.mjs --ecrire   RÉGÉNÈRE, après un changement de l'index (puis relire le diff)
// Toute anomalie fait échouer : source modifiée depuis la génération, contenu différent, effectif faux, doublon,
// code ultramarin, valeur non finie, extrait climatique périmé ou incomplet.
import { createJiti } from "jiti";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import zlib from "node:zlib";

const SCHEMA = 1;
const SORTIE = "src/data/accueil-communes.json";
const INDEX = "data/comparateur-index.json.gz";
const DRIAS = "data/data_climat.json";
const EXTRAIT = "src/data/apercu-climat-communes.json";
// Les colonnes DRIAS que lit l'accueil (chaleur : `buildClimatFacts` et la bascule 30 °C ; hiver :
// `construireFaitsCommune`), aux trois horizons : la référence 1976-2005 se reconstruit à partir des trois.
const CLES_CLIMAT_ACCUEIL = ["NORTX35D_yr", "ATX35D_yr", "NORTR_yr", "ATR_yr", "NORTX30D_yr", "ATX30D_yr", "NORTMm_seas_DJF", "ATMm_seas_DJF"];
const CHAMPS = ["nom", "dept", "lat", "lon", "uu", "population", "tailleVille", "tailleVilleSource", "douceurRang"];

const racine = process.cwd() + "/";
const ecrire = process.argv.includes("--ecrire");
const sha = (b) => createHash("sha256").update(b).digest("hex");
const echouer = (m) => { console.error(`✖ données de l'accueil : ${m}`); process.exit(1); };

// ── 1. L'extrait climatique partagé : à jour, et complet pour l'accueil ────────────────────────────────
for (const f of [INDEX, DRIAS, EXTRAIT]) if (!existsSync(f)) echouer(`fichier absent : ${f}`);
const extrait = JSON.parse(readFileSync(EXTRAIT, "utf8"));
if (extrait.source?.sha256 !== sha(readFileSync(DRIAS))) echouer(`${EXTRAIT} a été produit depuis une autre version de ${DRIAS} : lancer node scripts/build-apercu-climat.mjs`);
const manquantes = CLES_CLIMAT_ACCUEIL.filter((k) => !extrait.cles.includes(k));
if (manquantes.length) echouer(`${EXTRAIT} ne porte pas ${manquantes.join(", ")} : la lecture de l'accueil les lit`);
if (extrait.horizons.join() !== "gwl15,gwl20,gwl30") echouer(`${EXTRAIT} : horizons ${extrait.horizons.join()}, attendu gwl15,gwl20,gwl30`);

// ── 2. Les communes, par les fonctions du produit ──────────────────────────────────────────────────────
const brutIndex = readFileSync(INDEX);
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const cv = await jiti.import(racine + "src/lib/comparateur-vie.ts");
const charge = JSON.parse(zlib.gunzipSync(brutIndex).toString("utf8"));
const codes = charge.communes.map((c) => c.insee).sort();
if (codes.length !== charge.meta.count) echouer(`l'index annonce ${charge.meta.count} communes, en contient ${codes.length}`);
if (new Set(codes).size !== codes.length) echouer("codes en double dans l'index");
const outremer = codes.filter((c) => /^9[78]/.test(c));
if (outremer.length) echouer(`codes ultramarins dans l'index métropolitain : ${outremer.slice(0, 5).join(", ")}`);
const sansClimat = codes.filter((c) => !extrait.communes[c]);
if (sansClimat.length) echouer(`${sansClimat.length} communes de l'index absentes de l'extrait climatique (${sansClimat.slice(0, 5).join(", ")})`);

const fini = (v) => v == null || (typeof v === "number" && Number.isFinite(v));
const communes = {};
for (const code of codes) {
  const e = await cv.getCommuneEntry(code);
  if (!e) echouer(`getCommuneEntry(${code}) ne rend rien`);
  if (typeof e.nom !== "string" || !e.nom.trim()) echouer(`${code} : nom absent`);
  const taille = cv.tailleVilleResolvedOf(e);
  const rang = e.rankBands?.douceur_climat;
  const ligne = [e.nom, e.dept, e.lat, e.lon, e.uu ?? null, e.population ?? null, taille.value, taille.source,
    Array.isArray(rang) && rang.length === 2 ? rang : null];
  for (const [i, champ] of CHAMPS.entries()) {
    if (["lat", "lon", "population", "tailleVille"].includes(champ) && !fini(ligne[i])) echouer(`${code} : ${champ} non fini (${ligne[i]})`);
  }
  if (ligne[8] && !ligne[8].every((x) => Number.isFinite(x))) echouer(`${code} : rang de douceur non fini`);
  communes[code] = ligne;
}

const texte = JSON.stringify({
  schema: SCHEMA,
  role: "Optimisation de lecture de l'accueil (FUT-50), dérivée de l'index : jamais une source de vérité, jamais modifiée à la main.",
  genere_par: "scripts/accueil/donnees-accueil.mjs",
  source: { fichier: INDEX, sha256: sha(brutIndex), communes: codes.length },
  champs: CHAMPS,
  communes,
});

if (ecrire) {
  writeFileSync(SORTIE, texte);
  console.log(`✓ écrit : ${SORTIE} (${(Buffer.byteLength(texte) / 1048576).toFixed(2)} Mo, ${codes.length} communes)`);
} else {
  if (!existsSync(SORTIE)) echouer(`${SORTIE} absent : lancer avec --ecrire`);
  const actuel = readFileSync(SORTIE, "utf8");
  if (JSON.parse(actuel).source?.sha256 !== sha(brutIndex)) echouer(`${INDEX} a changé depuis la génération de ${SORTIE} : lancer avec --ecrire, puis relire le diff`);
  if (actuel !== texte) echouer(`${SORTIE} diffère de ce que produit l'index (modifié à la main, ou générateur changé) : lancer avec --ecrire, puis relire le diff`);
  console.log(`✓ données de l'accueil à jour : ${SORTIE} reconstruit et identique (${codes.length} communes), extrait climatique à jour`);
}
