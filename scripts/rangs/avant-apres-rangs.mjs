// FUT-136 · AVANT / APRÈS D'UN RECALCUL DE RANGS, sur la vraie chaîne du dossier payant.
//
// Compare deux index (avant, après) sur TOUTES les communes :
//   1. les champs : seuls les `rankBands` des clés déclarées (--cles) ont le droit de changer ;
//   2. les bandes : modifiées, ajoutées, retirées, par clé ;
//   3. les verdicts de position (`classifyPosition`, la fonction que lisent mismatch-rules et alignment-rules) ;
//   4. les dossiers : `buildModuleFacts` + `dossierDepuisFaits` (règles, compositions, assemblage), pour un projet
//      qui place chaque clé en priorité forte (poids 3), puis un projet qui pose toutes les AUTRES clés de rang
//      (aucun mot de son dossier ne doit changer).
// Hors réseau : Géorisques et radon valent null, le climat n'est pas chargé (aucune des règles de rang ne les lit).
//
// Usage : node scripts/rangs/avant-apres-rangs.mjs <avant.json.gz> <après.json.gz> --cles a,b,c [--temoins 01033,…] [--json sortie.json]
import { createJiti } from "jiti";
import { readFileSync, writeFileSync } from "node:fs";
import zlib from "node:zlib";
import { isDeepStrictEqual } from "node:util";

const racine = process.cwd() + "/";
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const TF = await jiti.import(racine + "src/lib/decision/territory-facts.ts");
const MF = await jiti.import(racine + "src/lib/decision/mismatch-facts.ts");
const CS = await jiti.import(racine + "src/lib/comparateur-scores.ts");
const UP = await jiti.import(racine + "src/lib/user-project.ts");

const [fAvant, fApres] = process.argv.slice(2, 4);
const arg = (nom) => { const i = process.argv.indexOf(nom); return i > 0 ? process.argv[i + 1] : null; };
const CLES = (arg("--cles") ?? "").split(",").filter(Boolean);
const TEMOINS = (arg("--temoins") ?? "").split(",").filter(Boolean);
if (!fAvant || !fApres || CLES.length === 0) {
  console.error("Usage : node scripts/rangs/avant-apres-rangs.mjs <avant.json.gz> <après.json.gz> --cles a,b,c");
  process.exit(1);
}
const lire = (f) => JSON.parse(zlib.gunzipSync(readFileSync(f)).toString("utf8"));
const iAvant = lire(fAvant), iApres = lire(fApres);
const AUTRES = CS.MISMATCH_RANK_KEYS.filter((k) => !CLES.includes(k));

// ── 1. Champs ────────────────────────────────────────────────────────────────────────────────────
const sansCles = (c) => {
  const { rankBands, ...reste } = c;
  const rb = { ...(rankBands ?? {}) };
  for (const k of CLES) delete rb[k];
  return { ...reste, rankBands: rb };
};
const avantPar = new Map(iAvant.communes.map((c) => [c.insee, c]));
const apresPar = new Map(iApres.communes.map((c) => [c.insee, c]));
const champsHorsCles = [];
if (avantPar.size !== apresPar.size) champsHorsCles.push(`effectif ${avantPar.size} -> ${apresPar.size}`);
for (const [insee, a] of avantPar) {
  const b = apresPar.get(insee);
  if (!b) { champsHorsCles.push(`${insee} absente après`); continue; }
  if (!isDeepStrictEqual(sansCles(a), sansCles(b))) champsHorsCles.push(insee);
}
const metaIdentique = isDeepStrictEqual(iAvant.meta, iApres.meta);
const racineIdentique = isDeepStrictEqual(Object.keys(iAvant), Object.keys(iApres));

// ── 2 et 3. Bandes et verdicts ─────────────────────────────────────────────────────────────────────
const verdictDe = (band) => {
  const b = band ? { low: band[0] / 10000, high: band[1] / 10000 } : null;
  return MF.classifyPosition({ key: "", rawValue: b ? b.low : null, band: b, universe: "communes_france", distributionVersion: "" });
};
const FAVORABLE = "satisfied", DEFAVORABLE = "mismatch";
const parCle = {};
for (const k of CLES) {
  const r = { modifiees: 0, ajoutees: 0, retirees: 0, transitions: {}, verdictsChanges: 0, defavVersFav: 0, favVersDefav: 0, versDefav: 0, horsDefav: 0, versFav: 0, horsFav: 0, absencesScore: [] };
  for (const [insee, a] of avantPar) {
    const b = apresPar.get(insee);
    const ba = a.rankBands?.[k], bb = b.rankBands?.[k];
    if (ba && !bb) r.retirees++;
    else if (!ba && bb) r.ajoutees++;
    else if (ba && bb && (ba[0] !== bb[0] || ba[1] !== bb[1])) r.modifiees++;
    if (CS.mismatchRawScore(k, b) == null) r.absencesScore.push(insee);
    const va = verdictDe(ba), vb = verdictDe(bb);
    if (va === vb) continue;
    r.verdictsChanges++;
    const t = `${va} -> ${vb}`;
    r.transitions[t] = (r.transitions[t] ?? 0) + 1;
    if (va === DEFAVORABLE && vb === FAVORABLE) r.defavVersFav++;
    if (va === FAVORABLE && vb === DEFAVORABLE) r.favVersDefav++;
    if (vb === DEFAVORABLE) r.versDefav++;
    if (va === DEFAVORABLE) r.horsDefav++;
    if (vb === FAVORABLE) r.versFav++;
    if (va === FAVORABLE) r.horsFav++;
  }
  parCle[k] = r;
}

// ── 4. Dossiers ───────────────────────────────────────────────────────────────────────────────────
const projet = (prefs) => UP.normalizeUserProject({
  posture: "recherche", intent: null, rawText: "…", updatedAt: "2026-10-26T00:00:00.000Z",
  parsed: { reformulation: "x", hardConstraints: {}, preferences: Object.entries(prefs).map(([key, weight]) => ({ key, weight })) },
});
const PROJETS = Object.fromEntries(CLES.map((k) => [k, projet({ [k]: 3 })]));
const PROJET_AUTRES = projet(Object.fromEntries(AUTRES.map((k) => [k, 2])));
const dossierDe = async (entry, p) => {
  const faits = TF.buildModuleFacts(entry, { hasAddress: false, climat: null, risquesDeclares: null, radon: null });
  return (await TF.dossierDepuisFaits(faits, p)).dossier;
};
const cartes = (d) => d.sections.flatMap((s) => s.cards.flatMap((c) => (c.kind === "fact" ? [{ section: s.key, fact: c.fact }] : [])));
const verdictTexte = (d) => d.narrativePlan.blocks.find((b) => b.key === "verdict")?.fallbackText ?? null;
// Ce que le dossier RACONTE sur la clé : les faits qui la portent (rôle, statut, constat) et le verdict.
const recit = (d, k) => ({
  faits: cartes(d).filter((x) => x.fact.projectKey === k || x.fact.criterion?.key === k)
    .map((x) => `${x.section} · ${x.fact.role} · ${x.fact.status ?? ""} · ${x.fact.statement}`),
  verdict: verdictTexte(d),
});
const dossiers = Object.fromEntries(CLES.map((k) => [k, { textesChanges: 0, verdictTexteChange: 0, apparitions: 0, disparitions: 0, exemples: [] }]));
let autresChanges = 0;
const autresExemples = [];
const debut = Date.now();
let n = 0;
for (const [insee, a] of avantPar) {
  const b = apresPar.get(insee);
  for (const k of CLES) {
    const ba = a.rankBands?.[k], bb = b.rankBands?.[k];
    if (verdictDe(ba) === verdictDe(bb) && JSON.stringify(ba) === JSON.stringify(bb)) continue; // bande identique : rien à rejouer
    const [ra, rb] = [recit(await dossierDe(a, PROJETS[k]), k), recit(await dossierDe(b, PROJETS[k]), k)];
    if (isDeepStrictEqual(ra, rb)) continue;
    const r = dossiers[k];
    r.textesChanges++;
    if (ra.verdict !== rb.verdict) r.verdictTexteChange++;
    if (ra.faits.length < rb.faits.length) r.apparitions++;
    if (ra.faits.length > rb.faits.length) r.disparitions++;
    if (r.exemples.length < 3) r.exemples.push({ insee, nom: a.nom, avant: ra, apres: rb });
  }
  // Les autres clés : le dossier entier doit être identique. Échantillon déterministe (1 commune sur 10).
  if (n % 10 === 0) {
    const [da, db] = [await dossierDe(a, PROJET_AUTRES), await dossierDe(b, PROJET_AUTRES)];
    if (!isDeepStrictEqual(da, db)) { autresChanges++; if (autresExemples.length < 3) autresExemples.push(insee); }
  }
  if (++n % 5000 === 0) console.error(`… ${n}/${avantPar.size} (${Math.round((Date.now() - debut) / 1000)} s)`);
}

// ── Témoins : le dossier complet (projet des trois clés), avant / après ────────────────────────────
const temoins = [];
const PROJET_TROIS = projet(Object.fromEntries(CLES.map((k) => [k, 3])));
for (const insee of TEMOINS) {
  const a = avantPar.get(insee), b = apresPar.get(insee);
  if (!a) { temoins.push({ insee, absente: true }); continue; }
  const ligne = { insee, nom: a.nom, cles: {} };
  for (const k of CLES) {
    ligne.cles[k] = {
      score: CS.mismatchRawScore(k, b),
      avant: { bande: a.rankBands?.[k] ?? null, verdict: verdictDe(a.rankBands?.[k]) },
      apres: { bande: b.rankBands?.[k] ?? null, verdict: verdictDe(b.rankBands?.[k]) },
    };
  }
  const [da, db] = [await dossierDe(a, PROJET_TROIS), await dossierDe(b, PROJET_TROIS)];
  ligne.dossier = {
    avant: { verdict: verdictTexte(da), faits: CLES.flatMap((k) => recit(da, k).faits) },
    apres: { verdict: verdictTexte(db), faits: CLES.flatMap((k) => recit(db, k).faits) },
  };
  temoins.push(ligne);
}

// ── Rapport ───────────────────────────────────────────────────────────────────────────────────────
const sortie = {
  communes: avantPar.size, cles: CLES, autresCles: AUTRES,
  champs: { communesModifieesHorsCles: champsHorsCles.length, exemples: champsHorsCles.slice(0, 5), metaIdentique, racineIdentique },
  bandes: Object.fromEntries(CLES.map((k) => [k, { modifiees: parCle[k].modifiees, ajoutees: parCle[k].ajoutees, retirees: parCle[k].retirees, scoresAbsents: parCle[k].absencesScore }])),
  verdicts: Object.fromEntries(CLES.map((k) => {
    const r = parCle[k];
    return [k, { transitions: r.transitions, verdictsChanges: r.verdictsChanges, defavVersFav: r.defavVersFav, favVersDefav: r.favVersDefav, versDefav: r.versDefav, horsDefav: r.horsDefav, versFav: r.versFav, horsFav: r.horsFav }];
  })),
  dossiers, autresCles_dossiersChanges: autresChanges, autresCles_exemples: autresExemples, temoins,
  dureeS: Math.round((Date.now() - debut) / 1000),
};
console.log(JSON.stringify(sortie, null, 2));
if (arg("--json")) writeFileSync(arg("--json"), JSON.stringify(sortie, null, 2));
process.exit(champsHorsCles.length || !metaIdentique || !racineIdentique || autresChanges ? 1 : 0);
