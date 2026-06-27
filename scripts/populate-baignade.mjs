#!/usr/bin/env node
/**
 * populate-baignade.mjs — qualité des eaux de baignade par commune.
 *
 * POURQUOI. Donnée demandée au dogfood Brest/Lorient, et hook déjà prêt
 * (`baignade_ici` dans tensions_catalog). Signal de SANTÉ ENVIRONNEMENTALE
 * (classement sanitaire ARS), à terme rattaché à un futur module Santé — mais
 * intégré ici comme champ MODULE-AGNOSTIQUE (la donnée se fout de sa surface).
 *
 * QUOI. Source officielle : Ministère de la Santé, « Données de rapportage de la
 * saison balnéaire » (Licence Ouverte, directive 2006/7/CE). On joint deux fichiers :
 *   - CLASSEMENT (res « classement ») : code site → classement 0–4
 *   - SITES (res « caractéristiques ») : code site → INSEE commune, nom, type d'eau
 * et on agrège par commune → data/communes-baignade.json :
 *   { insee: { saison, n_sites, classements:{Excellent,Bon,...}, meilleur, pire, types:[] } }
 *
 * Classement (codes officiels) : 1=Excellent, 2=Bon, 3=Suffisant, 4=Insuffisant,
 * 0=Non classé (prélèvements insuffisants / site récent).
 *
 * HONNÊTETÉ (à divulguer au récit) :
 *   - Le classement est PLURIANNUEL (calculé sur 4 saisons) : il dit la qualité
 *     habituelle, PAS la baignabilité du jour J (fermetures ponctuelles après pluie).
 *   - Les ALGUES VERTES ne sont PAS dans ce classement (eutrophisation, autre donnée).
 *   - Couverture = communes avec site de baignade déclaré (littoral + lacs), pas national.
 *
 * MAINTENANCE. Les ID de ressources data.gouv changent chaque saison ; pour rafraîchir,
 * récupérer les nouveaux ID « classement » et « caractéristiques » sur la page dataset.
 *   node scripts/populate-baignade.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";

// Ressources data.gouv (saison 2025). À actualiser chaque saison.
const URL_CLASSEMENT = "https://www.data.gouv.fr/api/1/datasets/r/1d23bd32-e287-4d08-a611-563f27ce0048";
const URL_SITES = "https://www.data.gouv.fr/api/1/datasets/r/27c2535a-4ba9-4f48-9ba5-e5d6ca97f750";

const LABELS = { "1": "Excellent", "2": "Bon", "3": "Suffisant", "4": "Insuffisant", "0": "Non classé" };
const RANK = { Excellent: 4, Bon: 3, Suffisant: 2, Insuffisant: 1, "Non classé": 0 };

function typeEau(raw) {
  const t = (raw || "").toLowerCase();
  if (t.includes("côtiè") || t.includes("cotiè") || t.includes("transition")) return "mer";
  if (t.includes("lac")) return "lac";
  return "rivière"; // eau douce / cours d'eau
}

async function fetchCsv(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  // Fichiers Ministère = Latin-1, séparateur ';'.
  const buf = Buffer.from(await res.arrayBuffer());
  return buf.toString("latin1").split(/\r?\n/).filter(Boolean);
}

async function main() {
  const [r3, r4] = await Promise.all([fetchCsv(URL_CLASSEMENT), fetchCsv(URL_SITES)]);

  // CLASSEMENT : 0 Saison;1 Région;2 Dept;3 Code site;4 Regroupement;5 Classement;…
  const cls = new Map();
  let saison = null;
  for (let i = 1; i < r3.length; i++) {
    const c = r3[i].split(";");
    cls.set(c[3], c[5]);
    if (!saison) saison = Number(c[0]) || null;
  }
  // SITES : 0 Saison;…;3 Code site;…;6 Nom site;7 INSEE;8 Nom commune;…;10 Type d'eau;…
  const sites = new Map();
  for (let i = 1; i < r4.length; i++) {
    const c = r4[i].split(";");
    sites.set(c[3], { insee: (c[7] || "").padStart(5, "0"), nom: c[6], type: typeEau(c[10]) });
  }

  // Agrégation par commune.
  const byInsee = new Map();
  for (const [site, info] of sites) {
    const code = cls.get(site);
    if (code == null) continue;
    const label = LABELS[code] ?? "Non classé";
    const ic = info.insee;
    if (!byInsee.has(ic)) byInsee.set(ic, { saison, n_sites: 0, classements: {}, types: new Set() });
    const e = byInsee.get(ic);
    e.n_sites += 1;
    e.classements[label] = (e.classements[label] ?? 0) + 1;
    e.types.add(info.type);
  }

  const out = {};
  for (const [ic, e] of byInsee) {
    // meilleur / pire parmi les sites CLASSÉS (on ignore « Non classé » pour les bornes).
    const classed = Object.keys(e.classements).filter((k) => k !== "Non classé");
    const sorted = classed.sort((a, b) => RANK[b] - RANK[a]);
    out[ic] = {
      saison: e.saison,
      n_sites: e.n_sites,
      classements: e.classements,
      meilleur: sorted[0] ?? null,
      pire: sorted[sorted.length - 1] ?? null,
      types: [...e.types],
    };
  }

  const meta = {
    source: "Ministère de la Santé — rapportage saison balnéaire (Licence Ouverte, directive 2006/7/CE)",
    saison,
    classement: "1=Excellent 2=Bon 3=Suffisant 4=Insuffisant 0=Non classé ; calcul PLURIANNUEL (4 saisons)",
    limites: [
      "classement pluriannuel ≠ baignabilité du jour J (fermetures ponctuelles après pluie)",
      "n'inclut PAS les algues vertes (eutrophisation, donnée distincte)",
      "couverture = communes avec site de baignade déclaré (littoral + lacs), non national",
    ],
    usage: "champ module-agnostique — graine du futur module Santé environnementale ; surface lifestyle via baignade_ici",
  };

  const outPath = path.join(process.cwd(), "data", "communes-baignade.json");
  await fs.writeFile(outPath, JSON.stringify({ meta, communes: out }));

  // Contrôle.
  const probe = { "17300": "La Rochelle", "29019": "Brest", "06088": "Nice", "22278": "Saint-Brieuc", "56121": "Lorient" };
  for (const ic in probe) {
    const e = out[ic];
    console.log(`${probe[ic].padEnd(13)} ${e ? `${e.n_sites} sites · ${JSON.stringify(e.classements)} · ${e.types.join("/")}` : "aucun site de baignade"}`);
  }
  console.log(`✓ baignade écrit : ${Object.keys(out).length} communes avec site(s) · saison ${saison} → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
