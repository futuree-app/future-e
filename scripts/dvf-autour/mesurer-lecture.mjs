#!/usr/bin/env node
/**
 * mesurer-lecture.mjs (FUT-138) : le COÛT et la LATENCE d'une lecture des ventes à proximité, à froid et à chaud.
 *
 * 1. Le vrai lecteur (`lireVentesAutour`) contre une imitation locale de Supabase Storage qui sert l'édition construite :
 *    requêtes, octets et temps de calcul exacts, par point de recette, instance froide puis chaude. Aucun réseau.
 * 2. La latence RÉSEAU de Supabase Storage, mesurée en LECTURE SEULE sur le bucket privé déjà en production
 *    `debroussaillement` (objets de tailles comparables : pointeur, manifeste, tuiles). Aucune écriture, aucun bucket
 *    créé. Les variables viennent de .env.local (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).
 *
 *   node scripts/dvf-autour/mesurer-lecture.mjs [--reseau]
 * Sortie : docs/audits/2026-11-03-fut138-ventes-autour-lecture.json
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { CACHE } from "../lib/logement-index.mjs";
import { POINTS } from "./recette.mjs";

const racine = pathToFileURL(`${process.cwd()}/`).href;
register(`data:text/javascript,${encodeURIComponent(`export async function resolve(s, c, n) {
  if (s === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (s.startsWith("@/")) return n(${JSON.stringify(racine)} + "src/" + s.slice(2) + ".ts", c);
  return n(s, c);
}`)}`);

const EDITION = "2026-10-20";
const DIR = path.join(CACHE, "dvf-autour");
const { FORMAT_PRIX_AUTOUR } = await import("../../src/lib/prix-autour.ts");
const { lireVentesAutour, oublierPrixAutour } = await import("../../src/lib/server/prix-autour-tuiles.ts");

// ── 1. Lecteur réel, stockage imité ──────────────────────────────────────────────────────────
const manifeste = fs.readFileSync(path.join(DIR, EDITION, "manifest.json"));
const pointeur = JSON.stringify({ format: FORMAT_PRIX_AUTOUR, edition: EDITION, manifeste: createHash("sha256").update(manifeste).digest("hex") });
let journal = [];
const serveur = http.createServer((req, res) => {
  const chemin = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/storage\/v1\/object\/prix-autour\//, "");
  const corps = chemin === "courant.json" ? Buffer.from(pointeur) : (() => {
    const f = path.resolve(DIR, chemin);
    return f.startsWith(DIR + path.sep) && fs.existsSync(f) ? fs.readFileSync(f) : null;
  })();
  if (!corps) { res.statusCode = 400; return res.end("absent"); }
  journal.push({ chemin, octets: corps.length });
  res.end(corps);
});
await new Promise((r) => serveur.listen(0, "127.0.0.1", r));
const env = { PRIX_AUTOUR_BUCKET: "prix-autour", PRIX_AUTOUR_STORAGE_URL: `http://127.0.0.1:${serveur.address().port}`, SUPABASE_SERVICE_ROLE_KEY: "local" };

const lectures = [];
for (const p of POINTS.filter((x, i, a) => a.findIndex((y) => y.lat === x.lat && y.lon === x.lon) === i)) {
  oublierPrixAutour();
  journal = [];
  let t0 = performance.now();
  const r = await lireVentesAutour(p, p.insee, env);
  const froid = { ms: Math.round(performance.now() - t0), requetes: journal.length, octets: journal.reduce((s, x) => s + x.octets, 0), objets: journal.map((x) => x.chemin.replace(/^\d{4}-\d{2}-\d{2}\//, "")) };
  journal = [];
  t0 = performance.now();
  await lireVentesAutour(p, p.insee, env);
  const chaud = { ms: +(performance.now() - t0).toFixed(1), requetes: journal.length, octets: journal.reduce((s, x) => s + x.octets, 0) };
  lectures.push({ cas: p.cas, ok: Boolean(r), froid, chaud });
}
serveur.close();
const tri = (a) => [...a].sort((x, y) => x - y);
const resume = {
  octets_a_froid: { min: Math.min(...lectures.map((l) => l.froid.octets)), max: Math.max(...lectures.map((l) => l.froid.octets)) },
  requetes_a_froid: { min: Math.min(...lectures.map((l) => l.froid.requetes)), max: Math.max(...lectures.map((l) => l.froid.requetes)) },
  requetes_a_chaud: Math.max(...lectures.map((l) => l.chaud.requetes)),
  calcul_ms_a_chaud: { mediane: tri(lectures.map((l) => l.chaud.ms))[lectures.length >> 1], max: Math.max(...lectures.map((l) => l.chaud.ms)) },
  etapes_sequentielles_a_froid: "4 : pointeur, puis manifeste, puis index de bloc et fichier communal (en parallèle), puis tuiles (en parallèle)",
};

// ── 2. Latence réseau réelle de Supabase Storage (lecture seule, bucket existant) ─────────────
let reseau = null;
if (process.argv.includes("--reseau")) {
  const envLocal = Object.fromEntries(fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8").split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]));
  const url = envLocal.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
  const cle = envLocal.SUPABASE_SERVICE_ROLE_KEY;
  const lire = async (chemin, frais) => {
    const t = performance.now();
    const res = await fetch(`${url}/storage/v1/object/debroussaillement/${chemin}${frais ? `?cacheNonce=${Date.now()}` : ""}`, { headers: { Authorization: `Bearer ${cle}`, apikey: cle }, cache: "no-store" });
    const b = Buffer.from(await res.arrayBuffer());
    return { ms: performance.now() - t, octets: b.length, statut: res.status, b };
  };
  const p = await lire("courant.json", true);
  const ed = JSON.parse(p.b.toString()).edition;
  const m = await lire(`${ed}/manifest.json`, true);
  const tuiles = Object.entries(JSON.parse(m.b.toString()).tuiles).filter(([, t]) => !("plein" in t)).slice(0, 40).map(([k]) => k);
  const series = { pointeur: [], manifeste_270ko: [], tuile: [], tuiles_4_en_parallele: [] };
  for (let i = 0; i < 12; i++) {
    series.pointeur.push((await lire("courant.json", true)).ms);
    series.manifeste_270ko.push((await lire(`${ed}/manifest.json`, true)).ms);
    series.tuile.push((await lire(`${ed}/t/${tuiles[i]}.json.gz`)).ms);
    const t = performance.now();
    await Promise.all(tuiles.slice(12 + i * 2, 16 + i * 2).map((k) => lire(`${ed}/t/${k}.json.gz`)));
    series.tuiles_4_en_parallele.push(performance.now() - t);
  }
  const med = (a) => Math.round(tri(a)[a.length >> 1]);
  const p90 = (a) => Math.round(tri(a)[Math.floor(a.length * 0.9)]);
  reseau = {
    origine: "poste local (France) vers Supabase Storage du projet de production, bucket privé « debroussaillement », lecture seule, 03/11/2026",
    octets: { pointeur: p.octets, manifeste: m.octets, tuile_exemple: (await lire(`${ed}/t/${tuiles[0]}.json.gz`)).octets },
    ms: Object.fromEntries(Object.entries(series).map(([k, v]) => [k, { mediane: med(v), p90: p90(v), max: Math.round(Math.max(...v)) }])),
  };
  // Lecture à froid estimée : 4 étapes séquentielles, chacune au coût d'une petite requête (le plus gros objet à froid
  // pèse quelques dizaines de Ko, bien moins que le manifeste de 270 Ko mesuré ici).
  reseau.estimation_lecture_a_froid_ms = {
    mediane: med(series.pointeur) + med(series.tuile) + med(series.tuiles_4_en_parallele) + med(series.tuiles_4_en_parallele),
    p90: p90(series.pointeur) + p90(series.tuile) + p90(series.tuiles_4_en_parallele) + p90(series.tuiles_4_en_parallele),
  };
}

const sortie = path.join(process.cwd(), "docs", "audits", "2026-11-03-fut138-ventes-autour-lecture.json");
fs.writeFileSync(sortie, JSON.stringify({ resume, reseau, lectures }, null, 1));
console.log(JSON.stringify({ resume, reseau }, null, 1));
