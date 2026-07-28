// ─── Qualité des eaux de baignade (commune) ───────────────────────────────
// Source : Ministère de la Santé, rapportage saison balnéaire (directive
// 2006/7/CE), agrégée par commune dans data/communes-baignade.json via
// scripts/populate-baignade.mjs. Donnée MODULE-AGNOSTIQUE, surfacée via le socle
// d'enrichissement. (Elle attendait un « module Santé » qui n'existera pas : le produit se lit à
// trois échelles depuis le 29/07/2026, et la qualité des eaux est une donnée de commune —
// Territoire est sa place.)
//
// Honnêteté (à rappeler au récit) : classement PLURIANNUEL (4 saisons) ≠
// baignabilité du jour J ; n'inclut PAS les algues vertes ; couverture = communes
// avec site de baignade déclaré (littoral + lacs), pas national.

import fs from "node:fs/promises";
import path from "node:path";

export type BaignadeSummary = {
  saison: number | null;
  nSites: number;
  classements: Record<string, number>; // { Excellent: 2, Bon: 1, … }
  meilleur: string | null; // meilleur classement parmi les sites classés
  pire: string | null; // pire classement parmi les sites classés
  types: string[]; // mer / lac / rivière
} | null;

type RawEntry = {
  saison: number | null;
  n_sites: number;
  classements: Record<string, number>;
  meilleur: string | null;
  pire: string | null;
  types: string[];
};

let cache: Record<string, RawEntry> | null = null;

async function load(): Promise<Record<string, RawEntry>> {
  if (cache) return cache;
  let data: Record<string, RawEntry> = {};
  try {
    const filePath = path.join(process.cwd(), "data", "communes-baignade.json");
    const raw = await fs.readFile(filePath, "utf8");
    data = JSON.parse(raw).communes ?? {};
  } catch {
    data = {}; // fichier absent (ex. build sans la donnée) : on déclare rien.
  }
  cache = data;
  return data;
}

export async function getBaignadeSummary(insee: string): Promise<BaignadeSummary> {
  const all = await load();
  const e = all[insee];
  if (!e || !e.n_sites) return null;
  return {
    saison: e.saison,
    nSites: e.n_sites,
    classements: e.classements,
    meilleur: e.meilleur,
    pire: e.pire,
    types: e.types,
  };
}
