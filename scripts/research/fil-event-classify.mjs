#!/usr/bin/env node
/**
 * Classe les evenements du crawl ICPE A1/2 selon l'ontologie du Fil (mouvement / etat /
 * critere manquant / rien / indecidable), et mesure ce que chaque categorie coute et rapporte.
 *
 * Entree  : le CSV d'evenements produit par icpe-a-half-crawl.mjs (--out X.json => X.events.csv)
 * Sortie  : compteurs sur stdout, echantillon stratifie en CSV si --sample est passe.
 *
 * Ne lit aucun PDF. Ne decide rien : il compte, pour que la doctrine soit tranchee sur des chiffres.
 *
 *   node scripts/research/fil-event-classify.mjs --events tmp/icpe-a-half-10000.events.csv
 *   node scripts/research/fil-event-classify.mjs --events tmp/... --sample tmp/fil/echantillon.csv
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a, i, all) => (a.startsWith("--") ? [[a.slice(2), all[i + 1]]] : [])),
);
if (!args.events) {
  console.error("usage: --events <fichier.events.csv> [--sample <sortie.csv>]");
  process.exit(1);
}

const strip = (s) => (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const norm = (s) => strip(s).replace(/[^a-z0-9]+/g, " ");

/** Le type_fichier est rempli a la main par les DREAL : le nom de fichier le corrige parfois. */
const isUrgence = (n) => /\bapmu\b|mesures? ?d? ?urgence/.test(n);
const isLevee = (n) => /\blev|abrog|mainlevee/.test(n);
const isSuspension = (n) => /suspension|cessation|fermeture/.test(n);

/**
 * Ontologie du Fil, en trois objets et deux rebuts :
 *   mouvement        : deplace un critere futur.e (durable, mesurable en delta)
 *   etat             : situation datee avec une fin (ouverture / cloture / danger)
 *   critere manquant : compte, mais aucun critere ne le porte encore
 *   rien             : n'entre pas dans le Fil
 *   indecidable      : le type ne suffit pas, il faudrait ouvrir le PDF
 */
export function classify(event) {
  const type = event.type_fichier ?? "";
  const name = norm(event.nom_fichier);

  if (event.kind === "inspection") {
    return event.url_pdf
      ? { objet: "indecidable", critere: "?", sansPdf: false, note: "contenu inconnu sans lire le PDF" }
      : { objet: "rien", critere: "-", sansPdf: true, note: "inspection sans rapport publie (angle mort)" };
  }

  switch (type) {
    case "AP mise en demeure":
      return isLevee(name)
        ? { objet: "etat:cloture", critere: "-", sansPdf: true, note: "levee rangee en MED" }
        : { objet: "etat:ouverture", critere: "-", sansPdf: true, note: "conformite de l'exploitant" };
    case "AP levee de mise en demeure":
    case "AP levée de mise en demeure":
      return { objet: "etat:cloture", critere: "-", sansPdf: true, note: "ferme un dossier ouvert" };
    case "AP mesures d'urgence":
      return { objet: "etat:danger", critere: "-", sansPdf: true, note: "danger immediat, date de fin" };
    case "AP mesures conservatoires":
      return isSuspension(name)
        ? { objet: "mouvement", critere: "expoIndustrielle v", sansPdf: true, note: "suspension d'activite" }
        : { objet: "etat:danger", critere: "-", sansPdf: true, note: "" };
    case "AP de mesures d'évaluations et/ou remèdes":
      return isUrgence(name)
        ? { objet: "etat:danger", critere: "-", sansPdf: true, note: "APMU mal range (81 % de cette categorie)" }
        : { objet: "mouvement", critere: "heritageIndustriel", sansPdf: false, note: "sols pollues, ampleur dans le PDF" };
    case "AP d'autorisation":
    case "AP enregistrement":
      return { objet: "mouvement", critere: "expoIndustrielle ^", sansPdf: false, note: "creation OU modification : PDF requis" };
    case "AP servitude d'utilité publique":
      return { objet: "critere manquant", critere: "servitudes (grain parcelle)", sansPdf: false, note: "greve des terrains" };
    case "AP refus":
    case "AP de rejet":
      return { objet: "rien", critere: "-", sansPdf: true, note: "projet refuse : statu quo" };
    case "AP prescriptions complémentaires":
      return isUrgence(name)
        ? { objet: "etat:danger", critere: "-", sansPdf: true, note: "APMU mal range" }
        : { objet: "rien", critere: "-", sansPdf: true, note: "exploitation encadree, rien ne bouge" };
    case "Fiche Seveso":
      return { objet: "rien", critere: "-", sansPdf: true, note: "document permanent" };
    default:
      return { objet: "rien", critere: "-", sansPdf: true, note: "" };
  }
}

/** Parseur CSV minimal, suffisant pour les sorties du crawler (guillemets doubles, pas de \n interne). */
function parseCsv(text) {
  const lines = text.split("\n").filter(Boolean);
  const split = (line) => {
    const out = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (quoted && line[i + 1] === '"') { cur += '"'; i++; } else quoted = !quoted;
      } else if (c === "," && !quoted) { out.push(cur); cur = ""; } else cur += c;
    }
    out.push(cur);
    return out;
  };
  const header = split(lines[0]);
  return lines.slice(1).map((l) => Object.fromEntries(split(l).map((v, i) => [header[i], v])));
}

const events = parseCsv(readFileSync(args.events, "utf8"));
const counts = new Map();
const criteres = new Map();
let undecidable = 0;

for (const event of events) {
  const { objet, critere, sansPdf } = classify(event);
  counts.set(objet, (counts.get(objet) ?? 0) + 1);
  if (objet === "mouvement") criteres.set(critere, (criteres.get(critere) ?? 0) + 1);
  if (!sansPdf) undecidable++;
}

const total = events.length;
console.log(`TOTAL evenements : ${total}\n`);
for (const [objet, n] of [...counts].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(6)}  ${((n / total) * 100).toFixed(1).padStart(5)}%  ${objet}`);
}
console.log(`\n  indecidables sans ouvrir un PDF : ${undecidable} (${((undecidable / total) * 100).toFixed(1)}%)`);
console.log(`  dont rapports d'inspection      : ${counts.get("indecidable") ?? 0}  <- a NE PAS lire (7 % seulement produisent un acte)`);
console.log(`  actes a lire reellement         : ${undecidable - (counts.get("indecidable") ?? 0)}`);
console.log("\ncriteres deplaces :");
for (const [critere, n] of [...criteres].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(5)}  ${critere}`);
}

if (args.sample) {
  // Echantillon stratifie : sur-represente volontairement les types rares que le filtre P0/P1 ecarte.
  const quotas = {
    "Rapport d'inspection publiable": 18, "AP prescriptions complémentaires": 14, "AP mise en demeure": 14,
    "AP levée de mise en demeure": 8, "AP enregistrement": 8, "AP d'autorisation": 8, "AP mesures d'urgence": 10,
    "AP servitude d'utilité publique": 8, "AP mesures conservatoires": 6,
    "AP de mesures d'évaluations et/ou remèdes": 6, "": 4, "AP de rejet": 2, "Fiche Seveso": 2,
  };
  const pools = new Map();
  for (const e of events) {
    const key = e.type_fichier ?? "";
    if (!pools.has(key)) pools.set(key, []);
    pools.get(key).push(e);
  }
  const rows = [];
  for (const [type, quota] of Object.entries(quotas)) {
    const pool = pools.get(type) ?? [];
    // Pas de Math.random : un pas fixe rend l'echantillon reproductible d'un run a l'autre.
    const step = Math.max(1, Math.floor(pool.length / quota));
    for (let i = 0, taken = 0; i < pool.length && taken < quota; i += step, taken++) {
      const e = pool[i];
      const { objet, critere, sansPdf, note } = classify(e);
      rows.push({ commune: e.nom, date: e.date, type: type || "(vide)", fichier: (e.nom_fichier ?? "").slice(0, 60),
        objet, critere, decidable_sans_pdf: sansPdf ? "oui" : "NON", note });
    }
  }
  const header = Object.keys(rows[0]);
  const esc = (v) => (/[",]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : v);
  mkdirSync(dirname(args.sample), { recursive: true });
  writeFileSync(args.sample, [header.join(","), ...rows.map((r) => header.map((h) => esc(r[h])).join(","))].join("\n"));
  console.log(`\nechantillon stratifie : ${rows.length} lignes -> ${args.sample}`);
}
