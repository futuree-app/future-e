// FUT-50 · PREUVE D'ÉQUIVALENCE : la lecture légère de l'accueil rend EXACTEMENT ce que rend le moteur complet.
//
// EXHAUSTIF, HORS RÉSEAU, sur les 34 791 codes métropolitains (34 788 communes de l'index + Paris, Lyon, Marseille) :
//   - identité (nom canonique) ;
//   - chaleur : intrants (verdict, valeurs, références, seuils, 30 °C) et lecture rendue (texte, mesures, méthode) ;
//   - « Petite ville » : issue du critère, phrase de taille, valeur et provenance, lecture rendue ;
//   - « Hivers doux » : issue, phrase de position, limite, température de référence, lecture rendue.
// La référence est le moteur complet : `buildModuleFacts` sur l'entrée COMPLÈTE de l'index, `loadClimatFacts` sur
// `data_climat.json`, puis `dossierDepuisFaits` (les règles du dossier payant). Les deux intrants RÉSEAU du
// dossier (Géorisques : feu déclaré ; radon) y valent `null`, comme lors d'une panne réelle : aucune des deux
// règles interrogées (`eviter_grandes_villes`, `douceur_climat`) ne les lit (vérifié dans leur code).
//
// PANEL EN LIGNE (option --reseau) : le vrai `buildCommuneDossier`, réseau compris, sur quelques communes.
// Usage : node scripts/accueil/verifier-equivalence.mjs [--reseau]
import { createJiti } from "jiti";
import { readFileSync } from "node:fs";
import zlib from "node:zlib";
import { isDeepStrictEqual } from "node:util";

const racine = process.cwd() + "/";
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const S = await jiti.import(racine + "src/lib/accueil/lecture-accueil.ts");
const TF = await jiti.import(racine + "src/lib/decision/territory-facts.ts");
const CV = await jiti.import(racine + "src/lib/comparateur-vie.ts");
const DR = await jiti.import(racine + "src/lib/drias-json.ts");

const complet = {
  nom: "completes",
  nomCommune: async (insee) => (await CV.getCommuneEntry(insee))?.nom ?? null,
  scenarios: async (insee) => (await DR.getClimatDataCommune(insee).catch(() => null))?.commune.s ?? null,
  dossier: async (insee, projet) => {
    const e = await CV.getCommuneEntry(insee);
    if (!e) return null;
    const faits = TF.buildModuleFacts(e, { hasAddress: false, climat: await TF.loadClimatFacts(insee), risquesDeclares: null, radon: null });
    return TF.dossierDepuisFaits(faits, projet);
  },
};
const leger = S.sourcesLegeres;

const sansFonctions = (o) => JSON.parse(JSON.stringify(o));
const codes = [...JSON.parse(zlib.gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8")).communes.map((c) => c.insee), "75056", "69123", "13055"].sort();
const ecarts = {};
const noter = (quoi, code, a, b) => { (ecarts[quoi] ??= []).push({ code, attendu: a, obtenu: b }); };
const compte = { identite: 0, chaleur: 0, taille: 0, hivers: 0, lectures: 0 };
const issues = { taille: {}, hivers: {}, chaleur: {} };
const debut = Date.now();
const pasGaspar = async () => { throw new Error("GASPAR n'est pas comparé ici"); };

for (const [n, code] of codes.entries()) {
  const [ia, ib] = [await S.communeCanonique(code, complet), await S.communeCanonique(code, leger)];
  if (!isDeepStrictEqual(ia, ib)) noter("identite", code, ia, ib); else compte.identite++;
  for (const [cle, f] of [["chaleur", S.entreesChaleur], ["taille", S.entreesTaille], ["hivers", S.entreesHivers]]) {
    const [a, b] = [sansFonctions(await f(code, complet)), sansFonctions(await f(code, leger))];
    if (!isDeepStrictEqual(a, b)) noter(cle, code, a, b); else compte[cle]++;
    const k = a.verdict ?? a.issue; issues[cle][k] = (issues[cle][k] ?? 0) + 1;
    const [la, lb] = [await S.lireAccueil(code, cle, { sources: complet, gaspar: pasGaspar }), await S.lireAccueil(code, cle, { sources: leger, gaspar: pasGaspar })];
    if (!isDeepStrictEqual(la, lb)) noter(`lecture-${cle}`, code, la, lb); else compte.lectures++;
  }
  if (n % 5000 === 0) console.error(`… ${n}/${codes.length} (${Math.round((Date.now() - debut) / 1000)} s)`);
}

console.log(`\nComparaison EXHAUSTIVE hors réseau, ${codes.length} codes, ${Math.round((Date.now() - debut) / 1000)} s`);
console.log(`  identité identique     : ${compte.identite}/${codes.length}`);
for (const c of ["chaleur", "taille", "hivers"]) console.log(`  intrants ${c.padEnd(8)} identiques : ${compte[c]}/${codes.length} · répartition ${JSON.stringify(issues[c])}`);
console.log(`  lectures rendues identiques : ${compte.lectures}/${codes.length * 3}`);
const nbEcarts = Object.values(ecarts).reduce((s, l) => s + l.length, 0);
for (const [q, l] of Object.entries(ecarts)) console.log(`  ✖ ${q} : ${l.length} écart(s), ex. ${JSON.stringify(l[0]).slice(0, 600)}`);

let ecartsReseau = 0;
if (process.argv.includes("--reseau")) {
  const vrai = await S.sourcesCompletes();
  const panel = ["30189", "17300", "44109", "74010", "23096", "2A004", "75111", "69381", "13201", "75056", "56260", "05023"];
  let ok = 0;
  for (const code of panel) {
    for (const f of [S.entreesTaille, S.entreesHivers]) {
      const [a, b] = [sansFonctions(await f(code, vrai)), sansFonctions(await f(code, leger))];
      if (isDeepStrictEqual(a, b)) ok++; else { ecartsReseau++; console.log(`  ✖ réseau ${code} ${f.name}`, JSON.stringify(a).slice(0, 300), JSON.stringify(b).slice(0, 300)); }
    }
  }
  console.log(`Panel EN LIGNE (vrai buildCommuneDossier, Géorisques et radon compris) : ${ok}/${panel.length * 2} identiques`);
  if (ecartsReseau) console.error(`✖ ${ecartsReseau} divergence(s) sur le panel en ligne : vérification en échec`);
}
process.exit(nbEcarts + ecartsReseau ? 1 : 0);
