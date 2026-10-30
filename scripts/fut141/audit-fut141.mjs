// FUT-141 · AUDIT AVANT / APRÈS de la vie étudiante des communes sans établissement du supérieur.
//
// Hors réseau, sans appel Anthropic, sur l'index versionné du dossier courant et le vrai moteur. Se lance à
// l'identique sur `main` et sur la branche (le chemin de l'index est celui du moteur : data/…json.gz) :
//   node <ce script> --photo <sortie.json>
//   node <ce script> --comparer <avant.json> <apres.json>
// La photographie porte :
//   - les 487 communes de FUT-135 (vie_etudiante ≥ 55 sans établissement attesté dans le rayon), RECALCULÉES
//     depuis l'index courant, et ce que le lecteur en lit : score, palier, raison, découverte, trait d'ancre,
//     phrase de présence, cellule et avantage de la comparaison complète avec Poitiers, synthèse du thème ;
//   - des communes réellement universitaires (témoins), mêmes champs ;
//   - le contrôle du grain sur TOUTES les communes mesurées hors pôle : le niveau dit de l'agglomération
//     ne dépasse jamais le palier de sa part étudiante (etudes_dyn).
import { createJiti } from "jiti";
import { readFileSync, writeFileSync } from "node:fs";
import zlib from "node:zlib";
import { createHash } from "node:crypto";

const racine = process.cwd() + "/";
const mode = process.argv[2];
const PALIER = (s) => (s == null ? "non mesuré" : s >= 66 ? "forte" : s < 34 ? "limitée" : "intermédiaire");
const NIVEAUX = ["forte", "intermédiaire", "limitée"];
const POITIERS = "86194";
// Témoins universitaires : pôles et communes de campus (hors pôle) de grandes agglomérations étudiantes.
// Pôles dont la part étudiante est sous le palier du score (FUT-141, arbitrage du 29/10) : Montluçon, Gap, Vichy,
// Toulon, et Vidauban (aucun étudiant inscrit). Lus à part : ils CHANGENT de phrase, pas de score.
const POLES = ["03185", "05061", "03310", "83137", "83148"];
const TEMOINS = ["86194", "35238", "49007", "2B096", "33522", "69266", "38421", "91471", "59009", "33318", "63014", "34172", "69381", "67482", "31555", "43157", "15014"];

async function photographier(sortie) {
  const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
  const V = await jiti.import(racine + "src/lib/comparateur-vie.ts");
  const brut = readFileSync("data/comparateur-index.json.gz");
  const { communes } = JSON.parse(zlib.gunzipSync(brut).toString("utf8"));
  await V.getCommuneEntry(communes[0].insee);
  const parInsee = new Map(communes.map((c) => [c.insee, c]));
  const vie = (c) => V.subScore("vie_etudiante", c);

  // Les 487 sont définies sur l'index de main (FUT-135) ; on les recalcule ici avec la même règle, MAIS l'accès
  // étant corrigé, la liste « après » ne vaut plus 487 : on photographie l'UNION des deux listes en comparant.
  const definition = (c) => vie(c) != null && vie(c) >= 55 && c.etudesSup?.weightedAccess === 0;
  const liste = communes.filter(definition).map((c) => c.insee);

  const lire = async (insee) => {
    const c = parInsee.get(insee);
    const s = vie(c);
    const r = await V.seedComparaison([insee, insee === POITIERS ? "35238" : POITIERS]);
    const ligne = r.comparaison.themes.flatMap((t) => t.lignes).find((l) => l.id === "vie_etudiante");
    const cell = ligne.cellules.find((x) => x.insee === insee);
    return {
      nom: c.nom, population: c.population ?? null, acces: c.etudes_acces ?? null, dyn: c.etudes_dyn ?? null,
      etablissement: V.etatEtablissementSup(c.etudesSup), rayonKm: c.etudesSup?.radiusKm ?? null,
      vie: s, palier: PALIER(s), raison: s != null && s >= 55, decouverte: s != null && s > 65,
      signature: V.communeToPreferences(c).preferences.some((p) => p.key === "vie_etudiante"),
      identiteEtudiante: V.buildIdentiteCandidates(c).includes("Pour une ville étudiante à taille humaine."),
      phrase: s == null ? null : V.presenceEtudiante(c, s >= 66 ? 0 : s < 34 ? 2 : 1),
      comparaison: {
        palier: cell.palier, qualificatif: cell.qualifier,
        avantage: ligne.avantage.type === "avantage" ? ligne.avantage.insees.map((i) => parInsee.get(i).nom) : ligne.avantage.type,
        synthese: r.comparaison.themes.find((t) => t.lignes.some((l) => l.id === "vie_etudiante")).synthese,
      },
    };
  };

  // Contrôle du grain, sur TOUTES les communes mesurées, pôles compris : le niveau de présence dit ne dépasse pas
  // le palier de la part étudiante du bassin, et un bassin sans aucun étudiant inscrit (le vrai zéro, rang 12) ne
  // reçoit aucune « présence ».
  const grain = { mesurees: 0, horsPole: 0, auDessusDuBassin: 0, auDessusDuBassinPoles: 0, enDessousDuBassin: 0, presenceSansEtudiant: 0, exemples: [] };
  for (const c of communes) {
    const s = vie(c);
    if (s == null) continue;
    grain.mesurees++;
    const phrase = V.presenceEtudiante(c, s >= 66 ? 0 : s < 34 ? 2 : 1);
    const horsPole = /agglomération/.test(phrase);
    if (horsPole) grain.horsPole++;
    if (c.etudes_dyn === 12 && /présence/.test(phrase)) grain.presenceSansEtudiant++;
    const dit = NIVEAUX.findIndex((n) => phrase.startsWith(n === "forte" ? "forte" : `présence étudiante ${n}`));
    if (dit < 0) continue;
    const bassin = NIVEAUX.indexOf(PALIER(c.etudes_dyn));
    if (dit > bassin) grain.enDessousDuBassin++; // plafonné par le palier du score : jamais une surestimation
    if (dit < bassin) {
      grain.auDessusDuBassin++;
      if (!horsPole) grain.auDessusDuBassinPoles++;
      if (grain.exemples.length < 8) grain.exemples.push([c.insee, c.nom, c.etudes_dyn, s, phrase]);
    }
  }

  const photo = { index: createHash("sha256").update(brut).digest("hex"), liste, communes: {}, temoins: {}, grain };
  const aLire = new Set([...liste, ...(process.env.FUT141_LISTE ? JSON.parse(readFileSync(process.env.FUT141_LISTE, "utf8")).liste : [])]);
  for (const insee of aLire) photo.communes[insee] = await lire(insee);
  for (const insee of TEMOINS) if (parInsee.has(insee)) photo.temoins[insee] = await lire(insee);
  photo.poles = {};
  for (const insee of POLES) photo.poles[insee] = await lire(insee);
  writeFileSync(sortie, JSON.stringify(photo));
  console.log(`photographie écrite : ${sortie} (${liste.length} communes de la définition, ${aLire.size} lues, ${Object.keys(photo.temoins).length} témoins)`);
}

function comparer(fa, fb) {
  const A = JSON.parse(readFileSync(fa, "utf8")), B = JSON.parse(readFileSync(fb, "utf8"));
  const base = A.liste; // les 487 de main
  const compte = (P, f) => base.filter((i) => P.communes[i] && f(P.communes[i])).length;
  const champs = {
    "vie ≥ 55 (raison favorable)": (x) => x.raison,
    "palier forte": (x) => x.palier === "forte",
    "découverte (> 65)": (x) => x.decouverte,
    "trait d'ancre vie étudiante": (x) => x.signature,
    "identité ville étudiante": (x) => x.identiteEtudiante,
    "phrase « forte … »": (x) => /^forte/.test(x.phrase ?? ""),
    "à égalité avec Poitiers": (x) => x.comparaison.avantage === "egalite",
    "mène la comparaison avec Poitiers": (x) => Array.isArray(x.comparaison.avantage) && x.comparaison.avantage.includes(x.nom),
    "synthèse « se distingue par » la vie étudiante": (x) => new RegExp(`${x.nom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} se distingue par[^.]*(étudiant|supérieur)`).test(x.comparaison.synthese),
  };
  const lecteur = Object.fromEntries(Object.entries(champs).map(([k, f]) => [k, { avant: compte(A, f), apres: compte(B, f) }]));
  const transitions = {};
  for (const i of base) { const k = `${A.communes[i].palier} -> ${B.communes[i]?.palier}`; transitions[k] = (transitions[k] ?? 0) + 1; }
  const temoins = Object.fromEntries(Object.keys(A.temoins).map((i) => {
    const a = A.temoins[i], b = B.temoins[i];
    const diff = ["acces", "dyn", "vie", "palier", "raison", "identiteEtudiante", "phrase"].filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
    return [`${i} ${a.nom}`, diff.length ? Object.fromEntries(diff.map((k) => [k, [a[k], b[k]]])) : "identique"];
  }));
  const exemple = (i) => ({ avant: A.communes[i], apres: B.communes[i] });
  console.log(JSON.stringify({
    les487: { avant: base.length, definitionApres: B.liste.length, sortiesDeLaDefinition: base.filter((i) => !B.liste.includes(i)).length, entrees: B.liste.filter((i) => !base.includes(i)).length },
    lecteur, transitions, temoins,
    grain: { avant: A.grain, apres: B.grain },
    poles: Object.fromEntries(Object.keys(A.poles).map((i) => [`${i} ${A.poles[i].nom}`, ["vie", "palier", "phrase", "identiteEtudiante", "comparaison"].reduce((o, k) => ({ ...o, [k]: [A.poles[i][k], B.poles[i][k]] }), {})])),
    exemples: { "69249 Thurins": exemple("69249"), "43153 Pont-Salomon": exemple("43153") },
  }, null, 2));
}

if (mode === "--photo") await photographier(process.argv[3]);
else if (mode === "--comparer") comparer(process.argv[3], process.argv[4]);
else { console.error("usage : --photo <sortie.json> | --comparer <avant.json> <apres.json>"); process.exit(1); }
