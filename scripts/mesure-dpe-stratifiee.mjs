#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════════════════════════════════
// LA COUVERTURE DPE, MESURÉE PAR STRATE, SUR UN TIRAGE UNIFORME PARMI LES VRAIES ADRESSES.
//
// POURQUOI CE SCRIPT. La doctrine du produit citait « 35 à 53 % des adresses sans diagnostic »,
// de l'audit du 03/07/2026. Ce taux mesurait une recherche INCLUANT un repli géographique à 50 m,
// que le produit ne fait pas : `getDpeCandidatesByBanId` et `probeDpeByBanId` cherchent sur
// l'identifiant BAN exact, et la sonde refuse explicitement les coordonnées (un diagnostic à 50 m
// est celui d'un voisin : vérifié 57 fois sur 57 le 31/07/2026, zéro jointure ratée).
//
// ── LE CADRE DE TIRAGE, ET POURQUOI LE PREMIER ÉTAIT MAUVAIS ──────────────────────────────────
// PREMIÈRE VERSION, ÉCARTÉE : un point au hasard dans la boîte englobante de la commune, puis le
// numéro le plus proche par `/reverse`. Elle échantillonne proportionnellement à la SURFACE, donc
// elle sur-représente massivement la périphérie : sur les grandes communes, elle a tiré « 320
// Chemin du Plan d'Aillane » à Aix, « 520 Chemin des Maures » à Antibes, « Allée de Livermead » à
// Caen. Adresses réelles, mais ce n'est pas « une adresse qu'un acheteur regarde ». Son propre
// commentaire affirmait d'ailleurs un biais vers les centres-bourgs, soit l'inverse de ce qu'elle
// faisait. Résultats conservés dans `docs/audits/mesure-dpe-2026-07-31.json` comme trace.
//
// VERSION ACTUELLE : tirage UNIFORME parmi les adresses de la Base Adresse Nationale, par
// échantillonnage par réservoir sur les fichiers départementaux. Une adresse de centre-ville et
// une adresse de hameau pèsent exactement pareil, ce qui est le cadre honnête pour la question
// posée : « quand quelqu'un fait analyser une adresse, y a-t-il un diagnostic ? »
//
// BIAIS RÉSIDUELS, ASSUMÉS : les départements sont choisis à la main pour couvrir la diversité de
// densité, pas tirés au sort. Et une adresse n'est pas une transaction : un acheteur regarde des
// biens en vente, dont la répartition n'est pas celle des adresses. Ce script mesure « les adresses
// analysables », jamais « les biens visités ».
//
// Usage :
//   node scripts/mesure-dpe-stratifiee.mjs                      -> 150 adresses par strate
//   node scripts/mesure-dpe-stratifiee.mjs --par-strate 60
//   node scripts/mesure-dpe-stratifiee.mjs --rejouer <fichier>   -> remesure la même liste
//
// Résultat JSON sur la sortie standard, avancement sur l'erreur standard.
// ════════════════════════════════════════════════════════════════════════════════════════════

import { createReadStream, createWriteStream, existsSync, mkdirSync, rmSync, statSync, readFileSync } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import { createInterface } from "node:readline";

const ARG = process.argv.slice(2);
const PAR_STRATE = Number.parseInt(ARG[ARG.indexOf("--par-strate") + 1] ?? "150", 10) || 150;
const REJOUER = ARG.includes("--rejouer") ? ARG[ARG.indexOf("--rejouer") + 1] : null;
const CACHE = "/tmp/ban-csv";

// Choisis pour couvrir la densité, de Paris à la Creuse. Le choix est écrit plutôt que caché.
const DEPARTEMENTS = ["75", "69", "33", "44", "59", "17", "15", "23"];

const STRATES = [
  { nom: "urbain_dense", min: 50000, max: Infinity },
  { nom: "peri_urbain", min: 10000, max: 49999 },
  { nom: "petite_ville", min: 2000, max: 9999 },
  { nom: "rural", min: 0, max: 1999 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function json(url, essais = 3) {
  for (let i = 0; i < essais; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (res.ok) return await res.json();
    } catch { /* on retente */ }
    await sleep(400 * (i + 1));
  }
  return null;
}

/** Population par code INSEE, pour affecter chaque adresse à sa strate. */
async function populations() {
  const d = await json("https://geo.api.gouv.fr/communes?fields=code,nom,population&format=json");
  if (!d) throw new Error("geo.api.gouv.fr indisponible");
  return new Map(d.filter((c) => c.population > 0).map((c) => [c.code, { nom: c.nom, pop: c.population }]));
}

async function fichierDepartement(dep) {
  mkdirSync(CACHE, { recursive: true });
  const chemin = `${CACHE}/adresses-${dep}.csv.gz`;
  if (existsSync(chemin) && statSync(chemin).size > 100_000) return chemin;
  // TÉLÉCHARGEMENT PAR `curl`, PAS PAR `fetch`. Les fichiers font des dizaines de mégaoctets et
  // le serveur coupe régulièrement en cours de transfert : `fetch` échouait trois fois de suite
  // sur la Gironde là où curl passe, parce qu'il sait REPRENDRE un transfert interrompu (`-C -`)
  // et réessayer lui-même. Le fichier partiel est effacé en cas d'échec définitif, sinon le cache
  // le prendrait pour valide au passage suivant.
  const url = `https://adresse.data.gouv.fr/data/ban/adresses/latest/csv/adresses-${dep}.csv.gz`;
  console.error(`  téléchargement du département ${dep}…`);
  const { spawnSync } = await import("node:child_process");
  const r = spawnSync("curl", [
    "-sS", "-L", "--fail", "--retry", "5", "--retry-delay", "3", "--retry-all-errors",
    "--max-time", "600", "-C", "-", "-o", chemin, url,
  ], { encoding: "utf8" });
  if (r.status !== 0 || !existsSync(chemin) || statSync(chemin).size < 100_000) {
    rmSync(chemin, { force: true });
    throw new Error(`département ${dep} : téléchargement impossible (${(r.stderr || "").trim().slice(0, 120)})`);
  }
  return chemin;
}

/**
 * Échantillonnage PAR RÉSERVOIR, une réserve par strate.
 *
 * Chaque adresse rencontrée a la même probabilité d'être retenue, sans jamais garder plus de `k`
 * lignes en mémoire : les fichiers départementaux font des centaines de milliers de lignes, les
 * charger entièrement pour en tirer 150 serait absurde.
 */
function reservoir(k) {
  const items = [];
  let vus = 0;
  return {
    offrir(x) {
      vus++;
      if (items.length < k) items.push(x);
      else {
        const j = Math.floor(Math.random() * vus);
        if (j < k) items[j] = x;
      }
    },
    get items() { return items; },
    get vus() { return vus; },
  };
}

async function tirerAdresses(pops) {
  const reserves = Object.fromEntries(STRATES.map((s) => [s.nom, reservoir(PAR_STRATE)]));
  let total = 0;

  for (const dep of DEPARTEMENTS) {
    const chemin = await fichierDepartement(dep);
    console.error(`  lecture du département ${dep}…`);
    let entete = true;
    const rl = createInterface({
      input: createReadStream(chemin).pipe(createGunzip()),
      crlfDelay: Infinity,
    });
    for await (const ligne of rl) {
      if (entete) { entete = false; continue; }
      // id;id_fantoir;numero;rep;nom_voie;code_postal;code_insee;nom_commune;…;lon;lat;…
      const c = ligne.split(";");
      const banId = c[0];
      const insee = c[6];
      if (!banId || !insee) continue;
      const info = pops.get(insee);
      if (!info) continue;
      const strate = STRATES.find((s) => info.pop >= s.min && info.pop <= s.max);
      if (!strate) continue;
      total++;
      reserves[strate.nom].offrir({
        banId,
        label: `${c[2]}${c[3] ? ` ${c[3]}` : ""} ${c[4]} ${c[5]} ${c[7]}`.trim(),
        insee,
        commune: info.nom,
        population: info.pop,
        lon: Number.parseFloat(c[12]),
        lat: Number.parseFloat(c[13]),
        departement: dep,
        strate: strate.nom,
      });
    }
  }

  console.error(`  ${total.toLocaleString("fr-FR")} adresses parcourues.`);
  for (const s of STRATES) {
    const r = reserves[s.nom];
    console.error(`    ${s.nom.padEnd(13)} ${r.vus.toLocaleString("fr-FR").padStart(9)} vues -> ${r.items.length} tirées`);
  }
  return STRATES.flatMap((s) => reserves[s.nom].items);
}

const ADEME = "https://data.ademe.fr/data-fair/api/v1/datasets";

/**
 * La couverture d'une adresse, sur DEUX chemins.
 *
 * `exact` est celui de la PRODUCTION : identifiant BAN, jeux « existant » et « neuf ».
 * `proximite` ajoute le repli à 50 m, celui de l'audit de juillet. On mesure les deux pour que la
 * comparaison reste possible, alors même qu'on a établi que ce repli ramène le diagnostic d'un
 * VOISIN et jamais celui de l'adresse sous un autre identifiant.
 */
async function couverture(a) {
  let exact = false;
  for (const ds of ["dpe03existant", "dpe02neuf"]) {
    const d = await json(`${ADEME}/${ds}/lines?size=1&select=numero_dpe&qs=identifiant_ban:%22${a.banId}%22`);
    if (d === null) return { statut: "source_indisponible", exact: null, proximite: null };
    if ((d.results?.length ?? 0) > 0) { exact = true; break; }
  }

  let proximite = exact;
  if (!exact && Number.isFinite(a.lon) && Number.isFinite(a.lat)) {
    const deg = 50 / 111_000;
    const bbox = `${a.lon - deg},${a.lat - deg},${a.lon + deg},${a.lat + deg}`;
    for (const ds of ["dpe03existant", "dpe02neuf", "dpe-france"]) {
      const d = await json(`${ADEME}/${ds}/lines?size=1&select=numero_dpe&bbox=${bbox}`);
      if (d === null) continue;
      if ((d.results?.length ?? 0) > 0) { proximite = true; break; }
    }
  }
  return { statut: "lu", exact, proximite };
}

async function main() {
  let adresses;
  if (REJOUER) {
    adresses = JSON.parse(readFileSync(REJOUER, "utf8")).adresses;
    console.error(`Rejeu de ${adresses.length} adresses depuis ${REJOUER}.`);
  } else {
    console.error("Populations communales…");
    const pops = await populations();
    console.error("Tirage uniforme parmi les adresses de la BAN…");
    adresses = await tirerAdresses(pops);
  }

  console.error(`\nInterrogation ADEME sur ${adresses.length} adresses…`);
  const resultats = [];
  for (const [i, a] of adresses.entries()) {
    resultats.push({ ...a, ...(await couverture(a)) });
    if ((i + 1) % 50 === 0) console.error(`  ${i + 1}/${adresses.length}`);
    await sleep(80);
  }

  const parStrate = {};
  for (const s of STRATES) {
    const lot = resultats.filter((r) => r.strate === s.nom);
    const lus = lot.filter((r) => r.statut === "lu");
    const sansExact = lus.filter((r) => !r.exact).length;
    const sansProx = lus.filter((r) => !r.proximite).length;
    const pct = (n) => (lus.length ? Math.round((1000 * n) / lus.length) / 10 : null);
    // Marge à 95 %. Sans elle, un taux calculé sur quelques dizaines de tirages se lit comme un
    // fait établi, ce qui est exactement l'erreur qu'on est en train de corriger.
    const p = lus.length ? sansExact / lus.length : 0;
    const marge = lus.length ? Math.round(1960 * Math.sqrt((p * (1 - p)) / lus.length)) / 10 : null;
    parStrate[s.nom] = {
      adresses: lot.length,
      lues: lus.length,
      absence_exact: sansExact,
      taux_absence_exact: pct(sansExact),
      marge_95: marge,
      absence_proximite: sansProx,
      taux_absence_proximite: pct(sansProx),
      source_indisponible: lot.length - lus.length,
    };
  }

  console.error("\n── Taux d'ABSENCE de diagnostic, par strate ──");
  console.error("                  chemin PRODUCTION          avec repli 50 m");
  for (const [nom, v] of Object.entries(parStrate)) {
    console.error(
      `  ${nom.padEnd(13)} ${String(v.taux_absence_exact ?? "?").padStart(5)} % ± ${String(v.marge_95 ?? "?").padStart(4)}  (${v.absence_exact}/${v.lues})` +
      `      ${String(v.taux_absence_proximite ?? "?").padStart(5)} %  (${v.absence_proximite}/${v.lues})`,
    );
  }

  process.stdout.write(JSON.stringify({
    methode: "tirage uniforme parmi les adresses de la BAN (réservoir sur fichiers départementaux) -> ADEME par identifiant_ban exact",
    departements: DEPARTEMENTS,
    biais: "départements choisis à la main pour couvrir la densité ; une adresse n'est pas une transaction",
    par_strate: parStrate,
    adresses: resultats,
  }, null, 2));
}

await main();
