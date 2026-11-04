#!/usr/bin/env node
/**
 * construire.mjs (FUT-138, échelle Logement) : les tuiles des VENTES AUTOUR D'UNE ADRESSE.
 *
 * MÊME ENSEMBLE DE VENTES QUE L'INDEX DES COMMUNES. Les ventes viennent de `agregerDvf` (scripts/lib/logement-index.mjs),
 * avec les mêmes fichiers épinglés, les mêmes filtres (une vente d'un seul logement, bornes 300-20 000 €/m²), le même
 * rattachement à la géographie actuelle (métropole) : une médiane autour de l'adresse et la médiane de la commune
 * se comparent donc sans biais de méthode. Seules les ventes GÉOCODÉES (position de la parcelle) entrent ici.
 *
 * CE QUI SORT, ET CE QUI NE SORT PAS. Par carré d'environ 100 m et par type (appartement, maison), un histogramme
 * des prix au m² par classes de 2 % (`src/lib/prix-autour.ts`). Aucune date, surface, adresse, parcelle ni prix
 * exact : rien qui désigne une vente.
 *
 * SORTIE (hors du dépôt, jamais dans un bundle) :
 *   data/cache-logement/dvf-autour/<édition>/t/<tx>_<ty>.json.gz    les tuiles
 *   data/cache-logement/dvf-autour/<édition>/b/<bx>_<by>.json       les index de bloc (tuiles et empreintes, ~50 km)
 *   data/cache-logement/dvf-autour/<édition>/c/<dép>.json.gz        la référence communale par département (champ `achat` de l'index)
 *   data/cache-logement/dvf-autour/<édition>/manifest.json          couverture, empreintes
 *   data/cache-logement/dvf-autour/<édition>/diagnostic.json        mesures de la géolocalisation
 * Publication : scripts/dvf-autour/publier.mjs (Supabase Storage, bucket privé), sur GO seulement.
 *
 * Reproductible : mêmes fichiers => mêmes tuiles, octet pour octet (clés triées, gzip sans horodatage).
 *
 * Usage : node --max-old-space-size=8192 scripts/dvf-autour/construire.mjs [--revision N]
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import { createHash } from "node:crypto";
import { assertIndexWorktree } from "../lib/require-index-worktree.mjs";
import { INDEX_JSON_PATH } from "../lib/index-io.mjs";
import {
  agregerDvf, ANNEES_PRODUCTION, CACHE, fichiersDvf, LIVRAISON_PRODUCTION, LIVRAISONS_DVF, mouvementsCog, verifierGeographieCompatible,
} from "../lib/logement-index.mjs";
import {
  BLOC_TUILES, CASE_M, caseDe, classeDe, cleBlocDe, cleCase, cleTuileDe, departementDe, FORMAT_PRIX_AUTOUR, PAS_CLASSE, TUILE_CASES,
} from "../../src/lib/prix-autour.ts";
import { haversineM } from "../../src/lib/geo-distance.ts";

const args = process.argv.slice(2);
const revision = args.includes("--revision") ? Number(args[args.indexOf("--revision") + 1]) : 1;
const EDITION = revision > 1 ? `${LIVRAISON_PRODUCTION}.${revision}` : LIVRAISON_PRODUCTION;
const SORTIE = path.join(CACHE, "dvf-autour", EDITION);

/** Les centres des communes (diagnostic seulement : distance d'une vente au centre de sa commune). */
function centresCommunes() {
  const L = fs.readFileSync(path.join(process.cwd(), "data", "communes-france-coords.csv"), "utf8").split(/\r?\n/).slice(1);
  const out = new Map();
  for (const l of L) {
    if (!l) continue;
    const c = l.split(",");
    out.set(c[0], { lat: Number(c[c.length - 2]), lon: Number(c[c.length - 1]) });
  }
  return out;
}

const centile = (tri, p) => tri[Math.min(tri.length - 1, Math.floor(p * tri.length))];

async function main() {
  assertIndexWorktree();
  const file = JSON.parse(await fsp.readFile(INDEX_JSON_PATH, "utf8"));
  const referentiel = new Set(file.communes.map((c) => c.insee));
  // La référence communale publiée avec les tuiles DOIT être celle de l'index (Territoire) : même livraison, sinon refus.
  const metaAchat = file.meta?.logement?.achat;
  if (metaAchat?.livraison !== LIVRAISONS_DVF[LIVRAISON_PRODUCTION].libelle) {
    throw new Error(`l'index n'est pas celui de la livraison ${LIVRAISON_PRODUCTION} (${metaAchat?.livraison}) : lancer populate-logement.mjs d'abord`);
  }
  const { mouvements } = await mouvementsCog();
  verifierGeographieCompatible(mouvements);
  const fichiers = await fichiersDvf(LIVRAISON_PRODUCTION, ANNEES_PRODUCTION);
  const centres = centresCommunes();

  // tuile -> case -> type -> classe -> effectif
  const tuiles = new Map();
  const diag = { retenues: 0, geocodees: 0, sansPosition: 0, horsFrance: 0, distancesKm: [], parPoint: new Map() };

  const { bilan } = await agregerDvf(fichiers, {
    geographie: "actuelle", referentiel, mouvements,
    surVente: (m, code, lignes, I) => {
      diag.retenues++;
      if (m.lon === null || m.lat === null || !Number.isFinite(m.lon) || !Number.isFinite(m.lat)) { diag.sansPosition++; return; }
      // Garde-fou : une position hors de la métropole (Corse comprise) est une erreur de géocodage.
      if (m.lat < 41 || m.lat > 51.5 || m.lon < -5.5 || m.lon > 10) { diag.horsFrance++; return; }
      diag.geocodees++;
      const centre = centres.get(code);
      if (centre) diag.distancesKm.push(haversineM(centre, { lat: m.lat, lon: m.lon }) / 1000);
      // Plusieurs parcelles DIFFÉRENTES au même point trahiraient un géocodage de repli (centre de commune).
      const logement = lignes.find((c) => c[I.type] === "Maison" || c[I.type] === "Appartement");
      const point = `${m.lon},${m.lat}`;
      const parcelle = logement?.[I.parcelle] ?? "";
      // Compteur léger (la mémoire ne tiendrait pas un ensemble par point) : la première parcelle vue en ce point,
      // et le nombre de ventes situées sur une AUTRE parcelle au même point.
      const vu = diag.parPoint.get(point);
      if (!vu) diag.parPoint.set(point, [parcelle, 0]);
      else if (vu[0] !== parcelle) vu[1]++;

      const c = caseDe({ lon: m.lon, lat: m.lat });
      const kt = cleTuileDe(c), kc = cleCase(c);
      let t = tuiles.get(kt);
      if (!t) { t = new Map(); tuiles.set(kt, t); }
      let cs = t.get(kc);
      if (!cs) { cs = { a: new Map(), m: new Map() }; t.set(kc, cs); }
      const h = cs[m.type === "appart" ? "a" : "m"];
      const b = classeDe(m.eurM2);
      h.set(b, (h.get(b) ?? 0) + 1);
    },
  });

  await fsp.rm(SORTIE, { recursive: true, force: true });
  await fsp.mkdir(path.join(SORTIE, "t"), { recursive: true });
  const empreinte = (b) => ({ octets: b.length, sha256: createHash("sha256").update(b).digest("hex") });
  await fsp.mkdir(path.join(SORTIE, "b"), { recursive: true });
  await fsp.mkdir(path.join(SORTIE, "c"), { recursive: true });
  const manifeste = {
    format: FORMAT_PRIX_AUTOUR,
    edition: EDITION,
    livraison: LIVRAISON_PRODUCTION,
    periode: { debut: `${ANNEES_PRODUCTION[0]}-01-01`, fin: `${ANNEES_PRODUCTION[ANNEES_PRODUCTION.length - 1]}-12-31` },
    case_m: CASE_M,
    tuile_cases: TUILE_CASES,
    bloc_tuiles: BLOC_TUILES,
    pas_classe: PAS_CLASSE,
    blocs: {},
    communes: {},
  };
  const aplatir = (h) => [...h.entries()].sort((x, y) => x[0] - y[0]).flat();
  const tailles = [];
  const blocs = new Map(); // bloc -> { tuile: empreinte + ventes }
  for (const kt of [...tuiles.keys()].sort()) {
    const t = tuiles.get(kt);
    const cases = {};
    let ventes = 0;
    for (const kc of [...t.keys()].sort()) {
      const cs = t.get(kc);
      const e = {};
      if (cs.a.size) e.a = aplatir(cs.a);
      if (cs.m.size) e.m = aplatir(cs.m);
      for (const h of [cs.a, cs.m]) for (const n of h.values()) ventes += n;
      cases[kc] = e;
    }
    const brut = Buffer.from(JSON.stringify({ format: FORMAT_PRIX_AUTOUR, edition: EDITION, tuile: kt, cases }));
    const gz = zlib.gzipSync(brut, { level: 9 }); // l'en-tête gzip de Node ne porte pas d'horodatage : reproductible
    await fsp.writeFile(path.join(SORTIE, "t", `${kt}.json.gz`), gz);
    const kb = cleBlocDe(kt);
    if (!blocs.has(kb)) blocs.set(kb, {});
    blocs.get(kb)[kt] = { ...empreinte(gz), ventes };
    tailles.push(gz.length);
  }
  // LES INDEX DE BLOC : la liste des tuiles d'un bloc (~50 km) et leurs empreintes. Le manifeste ne liste que les blocs.
  const taillesBlocs = [];
  for (const kb of [...blocs.keys()].sort()) {
    const b = Buffer.from(JSON.stringify({ format: FORMAT_PRIX_AUTOUR, edition: EDITION, bloc: kb, tuiles: blocs.get(kb) }));
    await fsp.writeFile(path.join(SORTIE, "b", `${kb}.json`), b);
    manifeste.blocs[kb] = { ...empreinte(b), tuiles: Object.keys(blocs.get(kb)).length };
    taillesBlocs.push(b.length);
  }
  // LA RÉFÉRENCE COMMUNALE, recopiée de l'index (le champ `achat` de chaque commune, sans le niveau du comparateur), par
  // département. Elle voyage avec les tuiles pour que la fonction Autour n'embarque pas l'index national (12 Mo).
  const parDep = new Map();
  for (const c of [...file.communes].sort((x, y) => x.insee.localeCompare(y.insee))) {
    if (!c.logement?.achat) continue;
    const { niveau: _niveau, ...achat } = c.logement.achat; void _niveau;
    const dep = departementDe(c.insee);
    if (!parDep.has(dep)) parDep.set(dep, {});
    parDep.get(dep)[c.insee] = { nom: c.nom, achat };
  }
  const taillesCommunes = [];
  for (const dep of [...parDep.keys()].sort()) {
    const gz = zlib.gzipSync(Buffer.from(JSON.stringify({
      format: FORMAT_PRIX_AUTOUR, edition: EDITION, departement: dep,
      meta: { achat: { periode: metaAchat.periode, livraison: metaAchat.livraison, source: metaAchat.source } },
      communes: parDep.get(dep),
    })), { level: 9 });
    await fsp.writeFile(path.join(SORTIE, "c", `${dep}.json.gz`), gz);
    manifeste.communes[dep] = { ...empreinte(gz), nombre: Object.keys(parDep.get(dep)).length };
    taillesCommunes.push(gz.length);
  }
  const brutManifeste = Buffer.from(JSON.stringify(manifeste));
  await fsp.writeFile(path.join(SORTIE, "manifest.json"), brutManifeste);

  // ── Diagnostic de la géolocalisation ─────────────────────────────────────────────────────
  const d = diag.distancesKm.sort((x, y) => x - y);
  let pointsPartages = 0, ventesAuxPointsPartages = 0;
  for (const [, autres] of diag.parPoint.values()) if (autres >= 4) { pointsPartages++; ventesAuxPointsPartages += autres + 1; }
  tailles.sort((x, y) => x - y);
  const diagnostic = {
    edition: EDITION,
    ventes_index: bilan.retenues,
    ventes_retenues_vues: diag.retenues,
    geocodees: diag.geocodees,
    sans_position: diag.sansPosition,
    hors_metropole: diag.horsFrance,
    part_geocodee: +(diag.geocodees / diag.retenues).toFixed(4),
    distance_au_centre_de_la_commune_km: {
      mediane: +centile(d, 0.5).toFixed(2), p90: +centile(d, 0.9).toFixed(2), p99: +centile(d, 0.99).toFixed(2),
      au_dela_de_10_km: d.filter((x) => x > 10).length, au_dela_de_20_km: d.filter((x) => x > 20).length,
    },
    points_ou_au_moins_5_ventes_sont_sur_une_autre_parcelle: { points: pointsPartages, ventes: ventesAuxPointsPartages },
    tuiles: tailles.length,
    octets_total: tailles.reduce((s, x) => s + x, 0),
    octets_tuile: { mediane: centile(tailles, 0.5), p99: centile(tailles, 0.99), max: tailles[tailles.length - 1] },
    manifeste_octets: brutManifeste.length,
    blocs: taillesBlocs.length,
    octets_bloc: { mediane: centile(taillesBlocs.sort((x, y) => x - y), 0.5), max: taillesBlocs[taillesBlocs.length - 1] },
    departements: taillesCommunes.length,
    octets_communes_departement: { mediane: centile(taillesCommunes.sort((x, y) => x - y), 0.5), max: taillesCommunes[taillesCommunes.length - 1] },
  };
  await fsp.writeFile(path.join(SORTIE, "diagnostic.json"), JSON.stringify(diagnostic, null, 1));
  console.log(JSON.stringify(diagnostic, null, 1));
}

main().catch((e) => { console.error(e); process.exit(1); });
