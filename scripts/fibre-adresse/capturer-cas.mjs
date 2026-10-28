#!/usr/bin/env node
/**
 * capturer-cas.mjs (FUT-156) : fige, pour quelques adresses, les LIGNES BRUTES des fichiers officiels qui
 * décident de leur lecture, dans `src/lib/__fixtures__/fut156/<dép>.json`. Les tests rejouent le classement
 * depuis ces lignes, sans réseau ni téléchargement ; le code publié par la construction est joint, pour
 * vérifier que les deux concordent.
 *
 * Usage : node scripts/fibre-adresse/capturer-cas.mjs <dossier des sources du dép.> <extrait Immeuble du dép.>
 *           <dossier des lots> <dép> <id BAN> [<id BAN>…]
 */
import fs from "node:fs/promises";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { lignes } from "./sources.mjs";
import { ENTETE_ACTUEL, ENTETE_BASE_IMB } from "./departement.mjs";
import { normaliserVoie } from "../../src/lib/fibre-adresse.ts";

const [src, extrait, lotsDir, dep, ...ids] = process.argv.slice(2);
const voulus = new Set(ids);

// La BAN : toutes les positions des adresses voulues (le test choisit comme le pipeline).
const ban = {};
let col;
for await (const l of lignes(path.join(src, `adresses-${dep}.csv.gz`))) {
  const p = l.split(";");
  if (!col) { col = p; continue; }
  if (voulus.has(p[0])) (ban[p[0]] ??= []).push(Object.fromEntries(col.filter((c) => ["id", "numero", "rep", "nom_voie", "code_insee", "nom_commune", "lon", "lat", "type_position"].includes(c)).map((c) => [c, p[col.indexOf(c)]])));
}
const libelles = new Map(Object.entries(ban).map(([id, rows]) => [`${rows[0].code_insee}|${rows[0].numero}|${rows[0].rep.toUpperCase()}|${normaliserVoie(rows[0].nom_voie)}`, id]));

// `base_imb` : les lignes sous la clé, ou au même libellé pour les immeubles fibre sans clé BAN.
const H = ENTETE_BASE_IMB.split(";");
const immeubles = {};
let entete = true;
for await (const l of lignes(path.join(src, `base_imb_${dep}.csv.gz`))) {
  if (entete) { entete = false; continue; }
  const p = l.split(";");
  const r = Object.fromEntries(H.map((c, i) => [c, p[i]]));
  const parLib = r.imb_source === "fo" && r.addr_source !== "ban"
    ? libelles.get(`${r.addr_code_insee}|${r.addr_numero}|${r.addr_rep.toUpperCase()}|${normaliserVoie(r.addr_nom_voie)}`) : undefined;
  for (const id of new Set([voulus.has(r.addr_code) ? r.addr_code : undefined, parLib].filter(Boolean))) (immeubles[id] ??= []).push(r);
}
const imbIds = new Set(Object.values(immeubles).flat().map((r) => r.imb_id));
const codes = new Set(Object.values(immeubles).flat().map((r) => r.imb_code).filter(Boolean));

const etats = {};
for await (const l of lignes(extrait)) {
  const [id, e] = l.split("\t");
  if (codes.has(id)) (etats[id] ??= []).push(e);
}
const HA = ENTETE_ACTUEL.split(";");
const actuel = {};
entete = true;
for await (const l of lignes(path.join(src, `actuel_${dep}.csv.gz`))) {
  if (entete) { entete = false; continue; }
  const p = l.split(";");
  if (imbIds.has(p[0])) (actuel[p[0]] ??= []).push(Object.fromEntries(HA.map((c, i) => [c, p[i]])));
}

// Le code publié par la construction, lu dans les lots.
const publie = {};
for (const f of (await fs.readdir(lotsDir)).filter((x) => x.startsWith(`${dep}-`))) {
  const lot = JSON.parse(gunzipSync(await fs.readFile(path.join(lotsDir, f))).toString("utf8"));
  for (const id of ids) {
    const insee = id.split("_")[0];
    const code = lot.communes[insee]?.[id.slice(insee.length + 1)];
    if (code !== undefined) publie[id] = code;
  }
}

const cas = ids.map((id) => {
  const imm = immeubles[id] ?? [];
  return {
    id, ban: ban[id] ?? [], immeubles: imm,
    etats: Object.fromEntries(imm.map((r) => r.imb_code).filter((c) => c in etats).map((c) => [c, etats[c]])),
    actuel: Object.fromEntries(imm.map((r) => r.imb_id).filter((i) => i in actuel).map((i) => [i, actuel[i]])),
    codePublie: publie[id] ?? null,
  };
});
const sortie = path.resolve(`src/lib/__fixtures__/fut156/${dep}.json`);
await fs.mkdir(path.dirname(sortie), { recursive: true });
await fs.writeFile(sortie, JSON.stringify({ capture: new Date().toISOString().slice(0, 10), departement: dep, cas }, null, 1) + "\n");
console.log(`${cas.length} cas -> ${sortie}`);
