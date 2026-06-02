#!/usr/bin/env node
/**
 * build-littoral.js
 *
 * Construit data/littoral-trait-de-cote.json à partir de la liste officielle
 * des communes inscrites au titre du recul du trait de côte (loi Climat et
 * Résilience, art. L321-15), publiée sur data.gouv.fr.
 *
 * Source CSV (371 communes, MAJ 2026-02-18) :
 *   https://www.data.gouv.fr/api/1/datasets/r/17e130fe-85df-483a-a49a-bdb0bd0ad0e5
 *
 * Aucune dépendance runtime : artefact committé, relu par src/lib/littoral.ts.
 *
 * Usage : node scripts/build-littoral.js
 */
import fs from "node:fs/promises";
import path from "node:path";

const CSV_URL =
  "https://www.data.gouv.fr/api/1/datasets/r/17e130fe-85df-483a-a49a-bdb0bd0ad0e5";

// Façade maritime par département (informatif, pour le ton narratif).
// La Bretagne (22/29/35/56) mêle Manche et Atlantique : groupée à part.
const FACADE_BY_DEPT = {
  "62": "manche", "59": "manche", "80": "manche", "76": "manche", "14": "manche", "50": "manche",
  "22": "bretagne", "29": "bretagne", "35": "bretagne", "56": "bretagne",
  "44": "atlantique", "85": "atlantique", "17": "atlantique", "33": "atlantique", "40": "atlantique", "64": "atlantique",
  "66": "mediterranee", "11": "mediterranee", "34": "mediterranee", "30": "mediterranee",
  "13": "mediterranee", "83": "mediterranee", "06": "mediterranee", "2A": "mediterranee", "2B": "mediterranee",
};

function facadeFor(codeDept) {
  if (/^97/.test(codeDept)) return "outre_mer";
  return FACADE_BY_DEPT[codeDept] || "atlantique";
}

// Parseur CSV minimal respectant les champs entre guillemets (le dernier champ,
// trait_de_cote_historique, contient des virgules).
function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else cur += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

// Le champ historique est une repr Python ('quotes', True/False/None) : on la
// rend en JSON tolérant pour extraire le décret actif. Dégrade à null en cas d'échec.
function parseActiveDecret(raw) {
  try {
    const json = raw
      .replace(/'/g, '"')
      .replace(/\bTrue\b/g, "true")
      .replace(/\bFalse\b/g, "false")
      .replace(/\bNone\b/g, "null");
    const arr = JSON.parse(json);
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const active = arr.find((d) => d.is_active) || arr[arr.length - 1];
    if (!active) return null;
    return {
      numero: active.numero_decret ?? null,
      url: active.url_decret ?? null,
      debut: active.start_date ?? null,
    };
  } catch {
    return null;
  }
}

async function main() {
  console.log("Téléchargement de la liste officielle…");
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`Téléchargement KO : HTTP ${res.status}`);
  const text = await res.text();

  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = parseCsvLine(lines[0]);
  const idx = (name) => header.indexOf(name);
  const iInsee = idx("code_commune");
  const iNom = idx("nom_commune");
  const iCodeDept = idx("code_departement");
  const iNomDept = idx("nom_departement");
  const iNomReg = idx("nom_region");
  const iActive = idx("is_currently_active");
  const iHist = idx("trait_de_cote_historique");

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const f = parseCsvLine(lines[i]);
    if (f.length <= iHist) continue;
    const insee = String(f[iInsee]).padStart(5, "0");
    records.push({
      insee,
      nom: f[iNom],
      departement: f[iNomDept],
      region: f[iNomReg],
      facade: facadeFor(f[iCodeDept]),
      concernee: String(f[iActive]).toLowerCase() === "true",
      decret: parseActiveDecret(f[iHist]),
    });
  }

  // On ne garde que les communes actuellement inscrites (concernee).
  const kept = records.filter((r) => r.concernee);

  const outPath = path.join(process.cwd(), "data", "littoral-trait-de-cote.json");
  await fs.writeFile(outPath, JSON.stringify(kept, null, 0) + "\n", "utf8");

  const byFacade = {};
  kept.forEach((r) => { byFacade[r.facade] = (byFacade[r.facade] || 0) + 1; });
  console.log(`Écrit ${kept.length} communes dans data/littoral-trait-de-cote.json`);
  console.log("Par façade :", byFacade);
  const laRochelle = kept.find((r) => r.insee === "17300");
  console.log("Contrôle La Rochelle (17300) :", laRochelle ? "présente" : "ABSENTE");
}

main().catch((e) => { console.error(e); process.exit(1); });
