#!/usr/bin/env node
/**
 * recette.mjs (FUT-138, échelle Logement) : les ventes autour de points tests, lues dans les tuiles construites,
 * ET recomptées dans les fichiers DVF bruts (contre-épreuve indépendante des tuiles).
 *
 * Pour chaque point : par type et par rayon, le nombre de ventes lues dans les tuiles doit être EXACTEMENT celui
 * recompté dans les fichiers bruts avec la même règle d'appartenance (centre du carré à moins du rayon) ; la médiane
 * des tuiles (classes de 2 %) est comparée à la médiane exacte ; les ventes sont ventilées par commune (preuve que
 * les ventes au-delà des limites communales comptent). Puis le texte du dossier, tel que l'écran l'affichera.
 *
 * Usage : node --max-old-space-size=8192 scripts/dvf-autour/recette.mjs [--sans-brut]
 * Sortie : docs/audits/2026-11-03-fut138-ventes-autour-recette.json
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import { INDEX_JSON_PATH } from "../lib/index-io.mjs";
import {
  agregerDvf, ANNEES_PRODUCTION, CACHE, fichiersDvf, LIVRAISON_PRODUCTION, mouvementsCog,
} from "../lib/logement-index.mjs";
import {
  caseDe, casesDansRayon, cleCase, lecturePrixDe, lireAutour, RAYONS_M, tuilesPour,
} from "../../src/lib/prix-autour.ts";
import { texteVentesAutour, typeDuLogement } from "../../src/lib/prix-autour-texte.ts";

const SANS_BRUT = process.argv.includes("--sans-brut");
const EDITION = path.join(CACHE, "dvf-autour", LIVRAISON_PRODUCTION);

// Les contextes demandés par le porteur (03/11/2026). `type_batiment` : le diagnostic confirmé simulé.
export const POINTS = [
  { cas: "La Rochelle, Vieux-Port", insee: "17300", lat: 46.1580, lon: -1.1530, dpe: "appartement" },
  { cas: "La Rochelle, maison à Laleu", insee: "17300", lat: 46.1712, lon: -1.1912, dpe: "maison" },
  { cas: "Centre urbain dense, Lyon 3e (Part-Dieu)", insee: "69383", lat: 45.7605, lon: 4.8570, dpe: "appartement" },
  { cas: "Arrondissement parisien, Paris 11e (Oberkampf)", insee: "75111", lat: 48.8650, lon: 2.3780, dpe: "appartement" },
  { cas: "Arrondissement parisien, maison à Paris 11e", insee: "75111", lat: 48.8650, lon: 2.3780, dpe: "maison" },
  { cas: "Limite communale, Paris 20e / Bagnolet (porte de Bagnolet)", insee: "75120", lat: 48.8636, lon: 2.4100, dpe: "appartement" },
  { cas: "Limite communale, La Rochelle / Aytré", insee: "17300", lat: 46.1395, lon: -1.1350, dpe: "maison" },
  { cas: "Zone rurale, Royère-de-Vassivière (Creuse)", insee: "23165", lat: 45.8400, lon: 1.9100, dpe: "maison" },
  { cas: "Zone rurale, appartement à Royère-de-Vassivière", insee: "23165", lat: 45.8400, lon: 1.9100, dpe: "appartement" },
  { cas: "Absence de ventes, Saint-Christophe-en-Oisans (montagne)", insee: "38375", lat: 44.9560, lon: 6.1780, dpe: "maison" },
  { cas: "Absence de ventes, Strasbourg (Alsace-Moselle, hors DVF)", insee: "67482", lat: 48.5839, lon: 7.7455, dpe: "appartement" },
  { cas: "Intercommunalité en référence, L'Oie (appartement)", insee: "85165", lat: 46.7975, lon: -1.1300, dpe: "appartement" },
  { cas: "Type inconnu : diagnostic d'immeuble, les deux marchés", insee: "17300", lat: 46.1580, lon: -1.1530, dpe: "immeuble" },
];

function tuilesLocales(p) {
  const m = JSON.parse(fs.readFileSync(path.join(EDITION, "manifest.json"), "utf8"));
  const out = new Map();
  for (const k of tuilesPour(p)) {
    if (!m.tuiles[k]) continue;
    out.set(k, JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(EDITION, "t", `${k}.json.gz`))).toString("utf8")));
  }
  return { m, tuiles: out };
}

const medianeExacte = (a) => {
  const b = [...a].sort((x, y) => x - y), k = b.length >> 1;
  return b.length % 2 ? b[k] : (b[k - 1] + b[k]) / 2;
};

async function brut() {
  // Pour chaque point, l'ensemble des carrés à 2 km (règle de l'application) ; une vente y est comptée si son carré y est.
  const zones = POINTS.map((p) => {
    const o = caseDe(p);
    const parRayon = new Map(RAYONS_M.map((r) => [r, new Set(casesDansRayon(o, r).map(cleCase))]));
    return { p, parRayon, ventes: [] };
  });
  const file = JSON.parse(await fsp.readFile(INDEX_JSON_PATH, "utf8"));
  const { mouvements } = await mouvementsCog();
  await agregerDvf(await fichiersDvf(LIVRAISON_PRODUCTION, ANNEES_PRODUCTION), {
    geographie: "actuelle", referentiel: new Set(file.communes.map((c) => c.insee)), mouvements,
    surVente: (m, code) => {
      if (m.lon === null || m.lat === null) return;
      const k = cleCase(caseDe({ lon: m.lon, lat: m.lat }));
      for (const z of zones) if (z.parRayon.get(2000).has(k)) z.ventes.push({ k, type: m.type, eurM2: m.eurM2, code });
    },
  });
  return { zones, nomDe: new Map(file.communes.map((c) => [c.insee, c.nom])) };
}

// La référence communale publiée avec les tuiles, et sa vérification contre l'index (Territoire) : identique ?
const COMMUNES = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(EDITION, "communes.json.gz"))).toString("utf8"));
async function verifierCommunes() {
  const file = JSON.parse(await fsp.readFile(INDEX_JSON_PATH, "utf8"));
  let identiques = 0;
  const ecarts = [];
  for (const c of file.communes) {
    const { niveau: _niveau, ...achat } = c.logement?.achat ?? {}; void _niveau;
    if (JSON.stringify(COMMUNES.communes[c.insee]?.achat) === JSON.stringify(achat) && COMMUNES.communes[c.insee]?.nom === c.nom) identiques++;
    else ecarts.push(c.insee);
  }
  return { communes_index: file.communes.length, identiques, ecarts: ecarts.slice(0, 5) };
}

async function main() {
  const b = SANS_BRUT ? null : await brut();
  const resultats = [];
  for (const [i, p] of POINTS.entries()) {
    const { m, tuiles } = tuilesLocales(p);
    const autour = { edition: m.edition, livraison: m.livraison, periode: m.periode, appart: lireAutour(tuiles, p, "appart"), maison: lireAutour(tuiles, p, "maison"), commune: lecturePrixDe(COMMUNES, p.insee) };
    const type = typeDuLogement("user_confirmed", { type_batiment: p.dpe, methode_dpe: p.dpe === "immeuble" ? "dpe immeuble collectif" : `dpe ${p.dpe} individuel` });
    const texte = texteVentesAutour(autour, type);
    const r = { cas: p.cas, point: { lat: p.lat, lon: p.lon }, type_diagnostic: p.dpe, lecture: "abstention" in type ? { appart: autour.appart, maison: autour.maison } : autour[type.type], texte };
    if (b && !("abstention" in type)) {
      const z = b.zones[i];
      const controle = {};
      for (const rayon of RAYONS_M) {
        const v = z.ventes.filter((x) => x.type === type.type && z.parRayon.get(rayon).has(x.k));
        const parCommune = {};
        for (const x of v) parCommune[`${x.code} ${b.nomDe.get(x.code) ?? ""}`.trim()] = (parCommune[`${x.code} ${b.nomDe.get(x.code) ?? ""}`.trim()] ?? 0) + 1;
        controle[rayon] = { ventes_brutes: v.length, mediane_exacte: v.length ? Math.round(medianeExacte(v.map((x) => x.eurM2))) : null, par_commune: parCommune };
      }
      const l = r.lecture;
      if (l.statut === "ventes") {
        const c = controle[l.rayonM];
        r.contre_epreuve = {
          meme_effectif: c.ventes_brutes === l.ventes,
          mediane_tuiles: l.mediane, mediane_exacte: c.mediane_exacte,
          ecart_pct: +(((l.mediane - c.mediane_exacte) / c.mediane_exacte) * 100).toFixed(2),
          rayons_plus_petits_sous_10: RAYONS_M.filter((x) => x < l.rayonM).every((x) => controle[x].ventes_brutes < 10),
          par_commune: c.par_commune,
        };
      } else {
        r.contre_epreuve = { moins_de_10_a_2_km: controle[2000].ventes_brutes < 10, ventes_brutes_2_km: controle[2000].ventes_brutes };
      }
    }
    resultats.push(r);
  }
  const reference = await verifierCommunes();
  console.log(`référence communale publiée avec les tuiles vs index : ${JSON.stringify(reference)}`);
  const sortie = path.join(process.cwd(), "docs", "audits", "2026-11-03-fut138-ventes-autour-recette.json");
  await fsp.writeFile(sortie, JSON.stringify({ reference_communale_vs_index: reference, cas: resultats }, null, 1));
  for (const r of resultats) {
    console.log(`\n## ${r.cas}`);
    console.log(JSON.stringify({ lecture: r.lecture, contre_epreuve: r.contre_epreuve }));
    const t = r.texte;
    console.log([t.lead, t.absence, ...t.blocs.flatMap((b) => [t.blocs.length > 1 ? `[${b.titre}]` : null, ...b.phrases, b.avertissement])].filter(Boolean).join("\n").replace(/[\u00a0\u202f]/g, " "));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
