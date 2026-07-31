#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════════════════════════════════
// LA COUVERTURE DPE, MESURÉE PAR STRATE.
//
// POURQUOI. Le taux connu du produit (« ~44 % des adresses sans diagnostic, intervalle 35-53 % »)
// vient de 124 adresses tirées SANS stratification, communes pondérées par la population
// (`docs/audits/2026-07-03-dpe-confort-ete-couverture.md`). Un sondage de onze adresses le
// 30/07/2026 a trouvé neuf diagnostics sur onze, ce qui ne le réfute pas (l'intervalle de deux
// absences sur onze va de 5 à 48 %) mais suggère fortement que l'absence n'est PAS répartie
// uniformément : elle paraît se concentrer en rural et en faible densité.
//
// Ce script tranche, en séparant quatre strates. Il ne décide de rien : il compte.
//
// ── LA MÉTHODE, ET SON BIAIS ASSUMÉ ───────────────────────────────────────────────────────────
// Pour chaque commune tirée, on prend un point au hasard dans sa boîte englobante et on demande à
// la BAN le numéro le plus proche (`/reverse`, filtré sur `housenumber`). C'est la MÊME méthode
// que la mesure de juillet, ce qui rend les deux comparables. Son biais est connu et il tire vers
// les centres-bourgs, donc vers les adresses les MIEUX couvertes : le vrai taux d'absence est
// probablement plus haut que ce que ce script rendra. On le dit plutôt que de le corriger avec une
// méthode dont personne n'aurait mesuré le biais.
//
// ── REJOUABLE ─────────────────────────────────────────────────────────────────────────────────
// La liste exacte des adresses tirées est écrite dans le fichier de sortie, avec leur identifiant
// BAN. Un second passage sur la même liste (option `--rejouer <fichier>`) mesure les mêmes
// adresses, ce qui permet de comparer deux dates sans re-tirer.
//
// Usage :
//   node scripts/mesure-dpe-stratifiee.mjs                    -> 40 communes par strate
//   node scripts/mesure-dpe-stratifiee.mjs --par-strate 80
//   node scripts/mesure-dpe-stratifiee.mjs --rejouer docs/audits/mesure-dpe-2026-07-31.json
//
// Écrit son résultat en JSON sur la sortie standard, ses avancements sur l'erreur standard.
// ════════════════════════════════════════════════════════════════════════════════════════════

const ARG = process.argv.slice(2);
const PAR_STRATE = Number.parseInt(ARG[ARG.indexOf("--par-strate") + 1] ?? "40", 10) || 40;
const REJOUER = ARG.includes("--rejouer") ? ARG[ARG.indexOf("--rejouer") + 1] : null;

// Les strates, définies par la population de la commune. Un découpage grossier mais reproductible,
// et qui suit la ligne d'hypothèse : la densité gouverne la couverture.
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
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (res.ok) return await res.json();
    } catch { /* on retente */ }
    await sleep(400 * (i + 1));
  }
  return null;
}

/** Toutes les communes de France avec population et boîte englobante. Un seul appel. */
async function chargerCommunes() {
  const d = await json("https://geo.api.gouv.fr/communes?fields=code,nom,population,bbox&format=json");
  if (!d) throw new Error("geo.api.gouv.fr indisponible");
  // `bbox` est un POLYGONE GeoJSON, pas un tableau de quatre nombres : on en extrait les bornes.
  // (Première version écrite en supposant un tableau : le filtre rejetait les 35 000 communes et
  // le script rendait zéro adresse sans se plaindre.)
  return d.flatMap((c) => {
    const ring = c.bbox?.coordinates?.[0];
    if (!c.population || !Array.isArray(ring) || ring.length < 4) return [];
    const lons = ring.map((p) => p[0]);
    const lats = ring.map((p) => p[1]);
    return [{
      code: c.code, nom: c.nom, population: c.population,
      bbox: [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)],
    }];
  });
}

function tirer(tableau, n) {
  const copie = [...tableau];
  const out = [];
  while (out.length < n && copie.length > 0) {
    out.push(copie.splice(Math.floor(Math.random() * copie.length), 1)[0]);
  }
  return out;
}

/** Une adresse tirée au hasard dans la commune, par reverse-géocodage. */
async function adresseAuHasard(commune) {
  const [ouest, sud, est, nord] = commune.bbox;
  for (let essai = 0; essai < 4; essai++) {
    const lon = ouest + Math.random() * (est - ouest);
    const lat = sud + Math.random() * (nord - sud);
    const d = await json(
      `https://api-adresse.data.gouv.fr/reverse/?lon=${lon.toFixed(6)}&lat=${lat.toFixed(6)}&type=housenumber&limit=1`,
    );
    const f = d?.features?.[0];
    if (f?.properties?.id && f.properties.citycode === commune.code) {
      return {
        banId: f.properties.id,
        label: f.properties.label,
        lon: f.geometry?.coordinates?.[0] ?? null,
        lat: f.geometry?.coordinates?.[1] ?? null,
        insee: commune.code,
        commune: commune.nom,
        population: commune.population,
      };
    }
    await sleep(120);
  }
  return null;
}

const ADEME = "https://data.ademe.fr/data-fair/api/v1/datasets";

/**
 * La couverture d'une adresse, mesurée SUR DEUX CHEMINS.
 *
 * `exact` est celui de la PRODUCTION : `getDpeCandidatesByBanId` et `probeDpeByBanId` cherchent
 * uniquement sur `identifiant_ban`, sur les jeux « existant » et « neuf ». La sonde refuse
 * explicitement la recherche par coordonnées, et sa doctrine est écrite : un diagnostic à 50 m est
 * un candidat à confirmer, l'annoncer avant paiement promettrait une matière que le produit
 * refuse d'affirmer après l'achat.
 *
 * `proximite` est celui de la mesure de juillet 2026, dont vient le taux de 44 % cité par la spec
 * de qualification : il INCLUT le repli géographique à 50 m. Les deux ne sont donc PAS
 * comparables, et c'est précisément pour l'établir qu'on mesure les deux ici.
 *
 * `legacy` (avant juillet 2021) est inclus dans le chemin de proximité seulement, comme dans
 * `getDpeByCoordinates`.
 */
async function couverture(a) {
  let exact = false;
  for (const ds of ["dpe03existant", "dpe02neuf"]) {
    const d = await json(`${ADEME}/${ds}/lines?size=1&select=numero_dpe&qs=identifiant_ban:%22${a.banId}%22`);
    if (d === null) return { statut: "source_indisponible", exact: null, proximite: null };
    if ((d.results?.length ?? 0) > 0) { exact = true; break; }
  }

  // Repli à 50 m, en degrés comme le fait `getDpeByCoordinates`.
  let proximite = exact;
  if (!exact && a.lat != null && a.lon != null) {
    const deg = 50 / 111_000;
    const bbox = `${a.lon - deg},${a.lat - deg},${a.lon + deg},${a.lat + deg}`;
    for (const ds of ["dpe03existant", "dpe02neuf", "dpe-france"]) {
      const d = await json(`${ADEME}/${ds}/lines?size=1&select=numero_dpe&bbox=${bbox}`);
      if (d === null) continue; // une panne sur le repli ne fausse pas la mesure exacte
      if ((d.results?.length ?? 0) > 0) { proximite = true; break; }
    }
  }

  return { statut: "lu", exact, proximite };
}

async function main() {
  let adresses;

  if (REJOUER) {
    const { readFileSync } = await import("node:fs");
    adresses = JSON.parse(readFileSync(REJOUER, "utf8")).adresses;
    console.error(`Rejeu de ${adresses.length} adresses depuis ${REJOUER}.`);
  } else {
    console.error("Chargement des communes…");
    const communes = await chargerCommunes();
    console.error(`${communes.length} communes exploitables.`);
    adresses = [];
    for (const s of STRATES) {
      const pool = communes.filter((c) => c.population >= s.min && c.population <= s.max);
      console.error(`  ${s.nom} : ${pool.length} communes, on en tire ${PAR_STRATE}.`);
      for (const c of tirer(pool, PAR_STRATE)) {
        const a = await adresseAuHasard(c);
        if (a) adresses.push({ ...a, strate: s.nom });
        await sleep(90);
      }
      console.error(`  ${s.nom} : ${adresses.filter((a) => a.strate === s.nom).length} adresses tirées.`);
    }
  }

  console.error(`\nInterrogation ADEME sur ${adresses.length} adresses…`);
  const resultats = [];
  for (const [i, a] of adresses.entries()) {
    resultats.push({ ...a, ...(await couverture(a)) });
    if ((i + 1) % 25 === 0) console.error(`  ${i + 1}/${adresses.length}`);
    await sleep(90);
  }

  const parStrate = {};
  for (const s of STRATES) {
    const lot = resultats.filter((r) => r.strate === s.nom);
    const lisibles = lot.filter((r) => r.statut === "lu");
    const sansExact = lisibles.filter((r) => !r.exact).length;
    const sansProx = lisibles.filter((r) => !r.proximite).length;
    const pct = (n) => (lisibles.length ? Math.round((1000 * n) / lisibles.length) / 10 : null);
    parStrate[s.nom] = {
      adresses: lot.length,
      lisibles: lisibles.length,
      // Le chemin de la PRODUCTION : identifiant BAN exact.
      absence_exact: sansExact,
      taux_absence_exact: pct(sansExact),
      // Le chemin de la mesure de juillet : exact, ou à moins de 50 m.
      absence_proximite: sansProx,
      taux_absence_proximite: pct(sansProx),
      source_indisponible: lot.length - lisibles.length,
    };
  }

  console.error("\n── Taux d'ABSENCE de diagnostic, par strate ──");
  console.error("                 chemin PRODUCTION      avec repli 50 m");
  for (const [nom, v] of Object.entries(parStrate)) {
    console.error(
      `  ${nom.padEnd(13)} ${String(v.taux_absence_exact ?? "?").padStart(6)} %  (${v.absence_exact}/${v.lisibles})` +
      `      ${String(v.taux_absence_proximite ?? "?").padStart(6)} %  (${v.absence_proximite}/${v.lisibles})`,
    );
  }
  console.error(
    "\nBiais connu : le tirage par reverse-géocodage penche vers les centres-bourgs, donc vers\n" +
    "les adresses les mieux couvertes. Le vrai taux d'absence est probablement plus haut.",
  );

  process.stdout.write(JSON.stringify({
    methode: "point au hasard dans la bbox communale -> BAN /reverse type=housenumber -> ADEME par identifiant_ban",
    biais: "tirage penchant vers les centres-bourgs (mesure comparable à celle du 03/07/2026)",
    par_strate: parStrate,
    adresses: resultats,
  }, null, 2));
}

await main();
