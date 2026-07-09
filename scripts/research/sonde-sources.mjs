#!/usr/bin/env node
/**
 * Sonde d'API : teste une liste de sources ouvertes candidates sur une commune temoin,
 * et rapporte ce qui est reellement exploitable (statut, volume, grain, date).
 *
 * Ne juge pas la valeur produit. Repond a une seule question : « est-ce que ca repond,
 * et avec quoi ? ». Une source qui echoue ici n'est pas condamnee ; elle est non verifiee.
 *
 *   node scripts/research/sonde-sources.mjs
 *   node scripts/research/sonde-sources.mjs --insee 17300 --json tmp/fil/sonde.json
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a, i, all) => (a.startsWith("--") ? [[a.slice(2), all[i + 1]]] : [])),
);
const INSEE = args.insee ?? "17300"; // La Rochelle
const LAT = 46.16;
const LON = -1.152;

/**
 * `extract` recoit le corps parse et renvoie une chaine courte : ce qu'on a trouve.
 * Retourner null signifie « repond mais rien d'exploitable ».
 */
const SOURCES = [
  { nom: "DVF (ventes immobilieres)", grain: "parcelle", module: "logement",
    url: `https://apidf-preprod.cerema.fr/indicateurs/dv3f/communes/annuel/${INSEE}/`,
    extract: (j) => (j?.results?.length ? `${j.results.length} annees, ex ${j.results[0]?.annee ?? "?"}` : null) },

  { nom: "DVF (api.cquest)", grain: "parcelle", module: "logement",
    url: `http://api.cquest.org/dvf?code_commune=${INSEE}`,
    extract: (j) => (j?.resultats?.length ? `${j.nb_resultats ?? j.resultats.length} mutations` : null) },

  { nom: "IPS colleges (mixite sociale)", grain: "etablissement", module: "services",
    url: `https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-ips-colleges-ap2022/records?where=code_insee_de_la_commune%3D%22${INSEE}%22&limit=2`,
    extract: (j) => (j?.total_count ? `${j.total_count} colleges, ex IPS=${j.results?.[0]?.ips ?? "?"}` : null) },

  { nom: "APL medecins (DREES)", grain: "commune", module: "sante",
    url: `https://data.drees.solidarites-sante.gouv.fr/api/explore/v2.1/catalog/datasets/530_l-accessibilite-potentielle-localisee-apl/records?limit=1`,
    extract: (j) => (j?.total_count ? `${j.total_count} lignes` : null) },

  { nom: "Sirene (etablissements, flux quotidien)", grain: "adresse", module: "economie",
    url: `https://recherche-entreprises.api.gouv.fr/search?code_commune=${INSEE}&page=1&per_page=1`,
    extract: (j) => (j?.total_results ? `${j.total_results} entreprises` : null) },

  { nom: "ANFR Cartoradio (antennes relais)", grain: "adresse", module: "sante",
    url: `https://data.anfr.fr/api/records/2.0/1.0/search/?dataset=observatoire_2g_3g_4g&q=&rows=1&refine.code_insee=${INSEE}`,
    extract: (j) => (j?.nhits ? `${j.nhits} supports` : null) },

  { nom: "Delinquance communale (SSMSI)", grain: "commune", module: "securite",
    url: `https://tabular-api.data.gouv.fr/api/resources/8f3d7c9d-1cbb-4a4f-9e0a-c5b0e3ba1e75/data/?CODGEO__exact=${INSEE}&page_size=1`,
    extract: (j) => (j?.data?.length ? `${j.meta?.total ?? "?"} lignes` : null) },

  { nom: "ARCEP (couverture fibre)", grain: "adresse", module: "services",
    url: `https://tabular-api.data.gouv.fr/api/resources/1f6e5b1e-1c8c-4a8f-8ac3-2b02e3ad4f61/data/?page_size=1`,
    extract: (j) => (j?.data?.length ? `ok` : null) },

  { nom: "Carte des loyers", grain: "commune", module: "logement",
    url: `https://www.data.gouv.fr/api/1/datasets/?q=carte%20des%20loyers&page_size=1`,
    extract: (j) => (j?.data?.[0] ? `dataset: ${j.data[0].title.slice(0, 40)}` : null) },

  { nom: "GPU / PLU (zonage urbanisme)", grain: "parcelle", module: "logement",
    url: `https://apicarto.ign.fr/api/gpu/municipality?insee=${INSEE}`,
    extract: (j) => (j?.features?.length ? `${j.features.length} doc(s) urbanisme` : null) },

  { nom: "GPU / assiettes de servitudes (toutes categories)", grain: "parcelle", module: "logement",
    url: `https://apicarto.ign.fr/api/gpu/assiette-sup-s?insee=${INSEE}`,
    extract: (j) => (j?.features?.length ? `${j.features.length} assiettes SUP` : null) },

  { nom: "Etablissements scolaires (annuaire)", grain: "adresse", module: "services",
    url: `https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-annuaire-education/records?where=code_commune%3D%22${INSEE}%22&limit=1`,
    extract: (j) => (j?.total_count ? `${j.total_count} etablissements` : null) },

  { nom: "Bruit (cartes strategiques CNB)", grain: "adresse", module: "cadre",
    url: `https://www.data.gouv.fr/api/1/datasets/?q=cartes%20de%20bruit%20strategiques&page_size=1`,
    extract: (j) => (j?.data?.[0] ? `dataset: ${j.data[0].title.slice(0, 40)}` : null) },

  { nom: "Qualite des eaux de baignade", grain: "site", module: "cadre",
    url: `https://baignades.sante.gouv.fr/baignades/editorial/fr/actualites.html`,
    extract: () => null },

  { nom: "Pesticides / captages (Hub'Eau)", grain: "station", module: "sante",
    url: `https://hubeau.eaufrance.fr/api/v1/qualite_rivieres/station_pc?code_commune=${INSEE}&size=1`,
    extract: (j) => (j?.count ? `${j.count} stations` : null) },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
for (const s of SOURCES) {
  let statut = "erreur";
  let detail = "";
  try {
    const res = await fetch(s.url, { signal: AbortSignal.timeout(30_000), headers: { "User-Agent": "futur-e/sonde" } });
    statut = String(res.status);
    if (res.ok) {
      const txt = await res.text();
      try {
        const j = JSON.parse(txt);
        detail = s.extract(j) ?? "repond, rien d'exploitable";
      } catch {
        detail = `non-json (${txt.length} o)`;
      }
    } else {
      detail = `HTTP ${res.status}`;
    }
  } catch (e) {
    detail = String(e.name === "TimeoutError" ? "timeout" : e.message).slice(0, 46);
  }
  results.push({ ...s, statut, detail, url: undefined });
  console.log(`${statut === "200" ? "OK  " : "--  "} ${s.nom.padEnd(44)} ${detail}`);
  await sleep(300);
}

if (args.json) {
  mkdirSync(dirname(args.json), { recursive: true });
  writeFileSync(args.json, JSON.stringify({ insee: INSEE, results }, null, 1));
  console.log(`\necrit : ${args.json}`);
}
