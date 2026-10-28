#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-147 · TÉLÉCHARGER LES EXPORTS BDIFF, UNE CAMPAGNE PAR ANNÉE, SANS RIEN INTERPRÉTER.
//
// La base des incendies de forêt (bdiff.agriculture.gouv.fr, ministère de l'Agriculture, IGN) n'a
// pas d'API documentée : l'export est un ZIP que le portail sert après une recherche (formulaire GET,
// session par cookie). Une année = une recherche + un téléchargement, pause de 3 s entre années.
//
// Ce script NE FAIT QUE COLLECTER. Il écrit dans le cache (hors dépôt) :
//   bdiff-AAAA.csv          l'export brut, octet pour octet
//   manifeste.json          pour chaque année : date de lecture, critères de l'export, nombre
//                           annoncé, SHA-256 du CSV, campagnes « au nombre d'incendies inconnu »
//                           relevées sur la page de résultats (département par département)
//
// La construction de la table (`construire.mts`) relit ce cache, et refuse un export dont le nombre
// de lignes ne correspond pas au nombre annoncé.
//
// PAR CURL, ET C'EST UN CONSTAT (FUT-82, 27/10/2026) : le serveur présente une chaîne de certificats
// incomplète, qu'un `fetch` Node refuse (« unable to verify the first certificate »). curl, lui,
// complète la chaîne par le magasin du système.
//
//   node scripts/bdiff/telecharger.mjs [--de 2006] [--a 2025] [--cache data/source/bdiff] [--force]
// ════════════════════════════════════════════════════════════════════════════════════════════
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { join } from "node:path";

const arg = (nom, defaut) => {
  const i = process.argv.indexOf(`--${nom}`);
  return i > 0 ? process.argv[i + 1] : defaut;
};
const DE = Number(arg("de", 2006));
const A = Number(arg("a", 2025));
const CACHE = arg("cache", "data/source/bdiff");
const FORCE = process.argv.includes("--force");
const BASE = "https://bdiff.agriculture.gouv.fr";
const UA = "futuree-import-bdiff/1 (+https://futuree.fr)";

mkdirSync(CACHE, { recursive: true });
const cheminManifeste = join(CACHE, "manifeste.json");
const manifeste = existsSync(cheminManifeste) ? JSON.parse(readFileSync(cheminManifeste, "utf8")) : { source: BASE, annees: {} };

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/** La liste « Campagnes avec un nombre d'incendie inconnu » de la page de résultats : [{annee, departement}]. */
export function campagnesInconnues(html) {
  const i = html.indexOf("Campagnes avec un nombre");
  if (i < 0) return [];
  const bloc = html.slice(i, html.indexOf("</ul>", i));
  return [...bloc.matchAll(/<li>\s*(\d{4})\s*-\s*([0-9AB]{2,3})\s*<\/li>/g)].map((m) => ({ annee: Number(m[1]), departement: m[2] }));
}

async function exporter(annee) {
  const csv = join(CACHE, `bdiff-${annee}.csv`);
  if (existsSync(csv) && manifeste.annees[annee] && !FORCE) return false;
  const q = new URLSearchParams({
    "if[dateAlerteDeb][date]": `01/01/${annee}`, "if[dateAlerteDeb][time][hour]": "0", "if[dateAlerteDeb][time][minute]": "0",
    "if[dateAlerteFin][date]": `31/12/${annee}`, "if[dateAlerteFin][time][hour]": "23", "if[dateAlerteFin][time][minute]": "59",
    "if[fr]": "1", "if[submit]": "",
  });
  const jar = join(CACHE, `.cookies-${annee}.txt`);
  const zip = join(CACHE, `.bdiff-${annee}.zip`);
  const html = execFileSync("curl", ["-sS", "--fail", "-m", "90", "-A", UA, "-c", jar, "-b", jar, `${BASE}/incendies?${q}`], { maxBuffer: 1 << 26 }).toString("utf8");
  if (/n&#039;a pu être filtré/.test(html)) throw new Error(`${annee} : filtre refusé par le portail`);
  execFileSync("curl", ["-sS", "--fail", "-m", "180", "-A", UA, "-c", jar, "-b", jar, "-o", zip, `${BASE}/incendies/zip`]);
  const brut = execFileSync("unzip", ["-p", zip, "Incendies.csv"], { maxBuffer: 1 << 28 });
  const texte = brut.toString("utf8");
  const annonce = Number((texte.match(/Nombre d'incendies suivant les critères de sélection : (\d+)/) ?? [])[1]);
  const criteres = (texte.split(/\r?\n/).find((l) => l.includes("Critères de sélection")) ?? "").replace(/"/g, "");
  if (!criteres.includes(`${annee}-01-01`) || !criteres.includes(`${annee}-12-31`)) {
    throw new Error(`${annee} : l'export ne porte pas sur l'année demandée (${criteres})`);
  }
  writeFileSync(csv, brut);
  manifeste.annees[annee] = {
    luLe: new Date().toISOString(),
    criteres,
    annonce,
    sha256: sha256(brut),
    octets: brut.length,
    campagnesInconnues: campagnesInconnues(html).filter((c) => c.annee === annee).map((c) => c.departement),
  };
  writeFileSync(cheminManifeste, JSON.stringify(manifeste, null, 1));
  return true;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) {
  for (let annee = DE; annee <= A; annee++) {
    const lu = await exporter(annee);
    const m = manifeste.annees[annee];
    process.stderr.write(`${annee} : ${m.annonce} incendies${m.campagnesInconnues.length ? `, nombre inconnu pour ${m.campagnesInconnues.join(", ")}` : ""}${lu ? "" : " (cache)"}\n`);
    if (lu) await pause(3000);
  }
}
