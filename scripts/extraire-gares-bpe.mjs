#!/usr/bin/env node
/**
 * extraire-gares-bpe.mjs — les gares de voyageurs de la BPE, seules (FUT-97).
 *
 * Source : les points BPE déjà versionnés dans data/bpe-points (scripts/populate-bpe.py), sans nouvelle
 * collecte. On n'en garde que les gares de voyageurs (TYPEQU E107, E108, E109 : intérêt national,
 * régional, local) avec leur position, leur nom et leur adresse.
 *
 * Pourquoi un fichier à part : `/qna` ne lit que les gares. Lire les cellules BPE complètes embarquait
 * 39 Mo dans la fonction et parsait jusqu'à 31 000 équipements par question (Paris 10e : 73 ms, 26 Mo de
 * tas). Ce fichier fait 273 Ko, et il est lu une fois par instance.
 *
 * Usage : node scripts/extraire-gares-bpe.mjs   (réécrit data/gares-bpe.json)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIR = path.join(ROOT, "data", "bpe-points");
const SORTIE = path.join(ROOT, "data", "gares-bpe.json");
const TYPES = new Set(["E107", "E108", "E109"]);

const millesimes = new Set();
const gares = [];
for (const f of fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).sort()) {
  const j = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
  if (j.millesime) millesimes.add(j.millesime);
  for (const p of j.points) {
    if (!TYPES.has(p.t)) continue;
    gares.push({ t: p.t, lat: p.lat, lon: p.lon, ...(p.n ? { n: p.n } : {}), ...(p.a ? { a: p.a } : {}) });
  }
}
if (millesimes.size !== 1) throw new Error(`millésimes BPE mêlés : ${[...millesimes].join(", ") || "aucun"}`);
gares.sort((a, b) => a.lat - b.lat || a.lon - b.lon || a.t.localeCompare(b.t));
const sortie = { millesime: [...millesimes][0], source: "data/bpe-points (BPE INSEE, TYPEQU E107, E108, E109)", gares };
fs.writeFileSync(SORTIE, JSON.stringify(sortie) + "\n");
console.log(`✓ ${gares.length} gares (BPE ${sortie.millesime}) → ${path.relative(ROOT, SORTIE)}`);
