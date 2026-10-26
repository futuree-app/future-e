// FUT-135 · AUDIT AVANT / APRÈS DE LA VIE ÉTUDIANTE, sur l'index versionné et le vrai moteur.
//
// Hors réseau, sans appel Anthropic : `subScore`, `communeToPreferences` et `matchProjects` sont déterministes.
// Deux modes :
//   node scripts/fut135/audit-vie-etudiante.mjs --photo <sortie.json>   photographie l'index courant (.gz)
//   node scripts/fut135/audit-vie-etudiante.mjs --comparer <avant.json> <apres.json>
// La photographie porte, pour chaque commune, ce que lit le lecteur (score, palier, raison favorable, identité,
// découverte, trait d'ancre), et les cartes des recherches ci-dessous (trois premières, puis rangs 4 à 6).
import { createJiti } from "jiti";
import { readFileSync, writeFileSync } from "node:fs";
import zlib from "node:zlib";

const racine = process.cwd() + "/";
const mode = process.argv[2];

// Les seuils que lisent les consommateurs (src/lib/comparateur-vie.ts) : palier (bandIndex), raison favorable,
// découverte. L'identité et le trait d'une ville de référence sont lus du moteur lui-même.
const PALIER = (s) => (s == null ? "non mesuré" : s >= 66 ? "forte" : s < 34 ? "limitée" : "intermédiaire");
const SEUIL_RAISON = 55;
const SEUIL_DECOUVERTE = 65; // strictement au-dessus
// Le trait d'ancre (seuil 70) est lu par `communeToPreferences` lui-même.

const BRETAGNE = ["22", "29", "35", "56"];
const RECHERCHES = [
  // Recherches consacrées à la vie étudiante.
  { id: "etudiante-seule", prefs: [{ key: "vie_etudiante", weight: 3 }] },
  { id: "etudiante-taille-humaine", prefs: [{ key: "vie_etudiante", weight: 3 }, { key: "eviter_grandes_villes", weight: 2 }] },
  { id: "etudiante-transports-vie-locale", prefs: [{ key: "vie_etudiante", weight: 2 }, { key: "acces_transports", weight: 2 }, { key: "vie_locale", weight: 1 }] },
  { id: "etudiante-bretagne", departements: BRETAGNE, prefs: [{ key: "vie_etudiante", weight: 3 }] },
  { id: "etudiante-nature-auvergne", departements: ["03", "15", "43", "63"], prefs: [{ key: "vie_etudiante", weight: 2 }, { key: "nature", weight: 2 }] },
  { id: "etudiante-retraite-calme", prefs: [{ key: "vie_etudiante", weight: 1 }, { key: "cadre_calme", weight: 3 }, { key: "acces_soins", weight: 2 }] },
  // Recherches sans la vie étudiante : la découverte, l'identité et les signaux peuvent la citer.
  { id: "nature-calme", prefs: [{ key: "nature", weight: 3 }, { key: "calme_sonore", weight: 2 }] },
  { id: "mer-soins", prefs: [{ key: "proximite_mer", weight: 3 }, { key: "acces_soins", weight: 2 }] },
  { id: "vie-locale-petite-17", departements: ["17"], prefs: [{ key: "vie_locale", weight: 3 }, { key: "eviter_grandes_villes", weight: 2 }] },
  { id: "fraicheur-train", prefs: [{ key: "faible_chaleur", weight: 3 }, { key: "acces_transports", weight: 2 }] },
];
// Villes de référence (« une ville comme… ») : la vie étudiante est un trait candidat de leur signature.
const ANCRES = ["29019", "86194", "35238", "81004", "74010", "54310", "26274", "17300"];

async function photographier(sortie) {
  const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
  const V = await jiti.import(racine + "src/lib/comparateur-vie.ts");
  const brut = readFileSync("data/comparateur-index.json.gz");
  const { meta, communes } = JSON.parse(zlib.gunzipSync(brut).toString("utf8"));
  await V.getCommuneEntry(communes[0].insee); // charge le moteur et le cache des unités urbaines

  const parCommune = {};
  for (const c of communes) {
    const s = V.subScore("vie_etudiante", c);
    parCommune[c.insee] = {
      nom: c.nom, population: c.population ?? null, uu: c.uu ?? null, uuPop: c.uu_pop ?? null,
      acces: c.etudes_acces ?? null, dyn: c.etudes_dyn ?? null, vie: s,
      palier: PALIER(s),
      raison: s != null && s >= SEUIL_RAISON,
      identite: V.buildIdentiteCandidates(c).includes("Pour une ville étudiante à taille humaine."),
      decouverte: s != null && s > SEUIL_DECOUVERTE,
      signature: V.communeToPreferences(c).preferences.some((p) => p.key === "vie_etudiante"),
    };
  }

  const carte = (r) => ({
    insee: r.insee, nom: r.nom, compatibility: r.compatibility, couverture: r.couverture ?? null,
    reasons: r.reasons, identite: r.identite, decouverte: r.decouverte, tradeoff: r.tradeoff,
    signaux: r.signaux ?? null,
  });
  const recherches = {};
  const lancer = async (id, hardConstraints, preferences) => {
    const o = await V.matchProjects({ reformulation: `FUT-135 ${id}`, hardConstraints, preferences });
    const ligne = o.comparaisonComplete.themes.flatMap((t) => t.lignes ?? []).find((l) => l.id === "vie_etudiante") ?? null;
    recherches[id] = {
      preferences, couverture: o.couverture ?? null, perfectMatch: o.perfectMatch,
      trio: o.results.slice(0, 3).map(carte),
      pistes: (o.pistes ?? []).map(carte),
      paliersComparaison: ligne ? ligne.cellules.map((x) => [x.insee, x.palier]) : null,
      ligneVieEtudiante: ligne,
      resume: o.comparaisonComplete.resume, arbitrage: o.comparaisonComplete.arbitrage,
      syntheses: o.comparaisonComplete.themes.map((t) => t.synthese),
      divergence: o.comparaisonComplete.divergence ?? null,
    };
  };
  for (const r of RECHERCHES) await lancer(r.id, r.departements ? { departements: r.departements } : {}, r.prefs);
  for (const insee of ANCRES) {
    const c = communes.find((x) => x.insee === insee);
    const d = V.communeToPreferences(c);
    await lancer(`comme-${c.nom}`, {}, d.preferences);
    recherches[`comme-${c.nom}`].traits = d.traits.map((t) => t.text);
  }

  const etudesDyn = meta.etudesDyn ?? null;
  writeFileSync(sortie, JSON.stringify({ indexSha: (await import("node:crypto")).createHash("sha256").update(brut).digest("hex"), etudesDyn, parCommune, recherches }));
  console.log(`photographie écrite : ${sortie} (${communes.length} communes, ${Object.keys(recherches).length} recherches)`);
}

function comparer(fa, fb) {
  const A = JSON.parse(readFileSync(fa, "utf8"));
  const B = JSON.parse(readFileSync(fb, "utf8"));
  const codes = Object.keys(A.parCommune);
  const distribution = (P, champ) => {
    const d = { "non mesuré": 0 };
    for (const k of codes) {
      const v = P.parCommune[k][champ];
      if (v == null) { d["non mesuré"]++; continue; }
      const t = v === 100 ? "100" : `${Math.floor(v / 10) * 10}-${Math.floor(v / 10) * 10 + 9}`;
      d[t] = (d[t] ?? 0) + 1;
    }
    return Object.fromEntries(Object.entries(d).sort(([x], [y]) => (x === "non mesuré" ? -1 : y === "non mesuré" ? 1 : parseInt(x) - parseInt(y))));
  };
  const compte = (P, f) => codes.filter((k) => f(P.parCommune[k])).length;
  const bascules = (champ) => ({
    perdus: codes.filter((k) => A.parCommune[k][champ] && !B.parCommune[k][champ]).length,
    gagnes: codes.filter((k) => !A.parCommune[k][champ] && B.parCommune[k][champ]).length,
  });
  const transitions = {};
  for (const k of codes) {
    const t = `${A.parCommune[k].palier} -> ${B.parCommune[k].palier}`;
    transitions[t] = (transitions[t] ?? 0) + 1;
  }
  const sansEtudiantAffiche = (P) => codes.filter((k) => {
    const c = P.parCommune[k];
    return (c.uuPop ?? c.population ?? 0) < 5000 && (c.raison || c.identite || c.palier === "forte");
  }).length;
  const out = {
    index: { avant: A.indexSha, apres: B.indexSha },
    etudesDyn: B.etudesDyn,
    distributionDyn: { avant: distribution(A, "dyn"), apres: distribution(B, "dyn") },
    distributionVie: { avant: distribution(A, "vie"), apres: distribution(B, "vie") },
    dynModifies: codes.filter((k) => A.parCommune[k].dyn !== B.parCommune[k].dyn).length,
    vieModifies: codes.filter((k) => A.parCommune[k].vie !== B.parCommune[k].vie).length,
    devenuesNonMesurees: codes.filter((k) => A.parCommune[k].vie != null && B.parCommune[k].vie == null).length,
    paliers: { avant: { forte: compte(A, (c) => c.palier === "forte") }, apres: { forte: compte(B, (c) => c.palier === "forte") }, transitions },
    raison: bascules("raison"), identite: bascules("identite"), decouverte: bascules("decouverte"), signature: bascules("signature"),
    petitsBassinsPresentesCommeEtudiants: { avant: sansEtudiantAffiche(A), apres: sansEtudiantAffiche(B) },
    exemples: Object.fromEntries(["54310", "26274", "29019", "86194", "35238", "81004"].map((k) => [k, { avant: A.parCommune[k], apres: B.parCommune[k] }])),
    recherches: {},
  };
  for (const id of Object.keys(A.recherches)) {
    const a = A.recherches[id], b = B.recherches[id];
    const noms = (r) => r.trio.map((x) => x.nom);
    const cartesChangees = b.trio.filter((x) => {
      const y = a.trio.find((z) => z.insee === x.insee);
      return !y || JSON.stringify(y) !== JSON.stringify(x);
    }).map((x) => x.nom);
    out.recherches[id] = {
      trioAvant: noms(a), trioApres: noms(b), trioIdentique: noms(a).join() === noms(b).join(),
      cartesChangees,
      pistesAvant: a.pistes.map((x) => x.nom), pistesApres: b.pistes.map((x) => x.nom),
      paliersComparaison: { avant: a.paliersComparaison, apres: b.paliersComparaison },
      ...(a.traits ? { traitsAvant: a.traits, traitsApres: b.traits, preferencesAvant: a.preferences, preferencesApres: b.preferences } : {}),
      cartesApres: b.trio.map((x) => ({ nom: x.nom, couverture: x.couverture?.etat, reasons: x.reasons, identite: x.identite, decouverte: x.decouverte })),
      cartesAvant: a.trio.map((x) => ({ nom: x.nom, couverture: x.couverture?.etat, reasons: x.reasons, identite: x.identite, decouverte: x.decouverte })),
    };
  }
  console.log(JSON.stringify(out, null, 2));
}

// FUT-135 (revue du 25/10) · Correctif ÉDITORIAL : tout ce qui est numérique ou de classement doit rester identique
// (scores, paliers numériques, couverture, composition et ordre des trios et des pistes, compatibilités) ; seuls
// les récits peuvent changer, et ils sont listés un par un.
function comparerRecits(fa, fb) {
  const A = JSON.parse(readFileSync(fa, "utf8"));
  const B = JSON.parse(readFileSync(fb, "utf8"));
  const ecarts = [];
  if (A.indexSha !== B.indexSha) ecarts.push(`index ${A.indexSha} -> ${B.indexSha}`);
  const CHAMPS = ["acces", "dyn", "vie", "palier", "raison", "decouverte", "signature"];
  for (const k of Object.keys(A.parCommune)) {
    for (const f of CHAMPS) if (A.parCommune[k][f] !== B.parCommune[k][f]) ecarts.push(`${k} ${f}`);
  }
  const numerique = (x) => ({ insee: x.insee, compatibility: x.compatibility, couverture: x.couverture });
  const recits = {};
  for (const id of Object.keys(A.recherches)) {
    const a = A.recherches[id], b = B.recherches[id];
    for (const part of ["trio", "pistes"]) {
      if (JSON.stringify(a[part].map(numerique)) !== JSON.stringify(b[part].map(numerique))) ecarts.push(`${id} ${part}`);
    }
    if (a.couverture !== b.couverture || a.perfectMatch !== b.perfectMatch) ecarts.push(`${id} couverture`);
    const bandes = (l) => l && l.cellules.map((x) => [x.insee, x.disponible]);
    if (JSON.stringify(bandes(a.ligneVieEtudiante)) !== JSON.stringify(bandes(b.ligneVieEtudiante))) ecarts.push(`${id} cellules`);
    if (JSON.stringify(a.ligneVieEtudiante?.avantage) !== JSON.stringify(b.ligneVieEtudiante?.avantage)) ecarts.push(`${id} avantage`);
    const diffs = [];
    for (const part of ["trio", "pistes"]) {
      a[part].forEach((x, i) => {
        const y = b[part][i];
        for (const f of ["reasons", "identite", "decouverte", "tradeoff", "signaux"]) {
          if (JSON.stringify(x[f]) !== JSON.stringify(y[f])) diffs.push({ carte: `${part} ${x.nom}`, champ: f, avant: x[f], apres: y[f] });
        }
      });
    }
    for (const f of ["resume", "arbitrage", "syntheses", "divergence"]) {
      if (JSON.stringify(a[f]) !== JSON.stringify(b[f])) diffs.push({ champ: f, avant: a[f], apres: b[f] });
    }
    const cel = (l) => l && l.cellules.map((x) => `${x.palier}${x.qualifier ? ` / ${x.qualifier}` : ""}`);
    if (JSON.stringify(cel(a.ligneVieEtudiante)) !== JSON.stringify(cel(b.ligneVieEtudiante)) || a.ligneVieEtudiante?.aide !== b.ligneVieEtudiante?.aide) {
      diffs.push({ champ: "comparaison vie étudiante", avant: { aide: a.ligneVieEtudiante?.aide, cellules: cel(a.ligneVieEtudiante) }, apres: { aide: b.ligneVieEtudiante?.aide, cellules: cel(b.ligneVieEtudiante) } });
    }
    if (a.traits && JSON.stringify(a.traits) !== JSON.stringify(b.traits)) diffs.push({ champ: "traits", avant: a.traits, apres: b.traits });
    if (a.traits && JSON.stringify(a.preferences) !== JSON.stringify(b.preferences)) ecarts.push(`${id} preferences`);
    if (diffs.length) recits[id] = diffs;
  }
  const identites = Object.keys(A.parCommune).filter((k) => A.parCommune[k].identite !== B.parCommune[k].identite).length;
  console.log(JSON.stringify({ ecartsNumeriques: ecarts, candidatsIdentiteEtudianteRetires: identites, recits }, null, 2));
}

if (mode === "--photo") await photographier(process.argv[3]);
else if (mode === "--comparer") comparer(process.argv[3], process.argv[4]);
else if (mode === "--recits") comparerRecits(process.argv[3], process.argv[4]);
else { console.error("usage : --photo <sortie.json> | --comparer <avant.json> <apres.json> | --recits <avant.json> <apres.json>"); process.exit(1); }
