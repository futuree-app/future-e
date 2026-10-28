#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-148 · TÉLÉCHARGER LES DEUX FICHIERS COMMUNAUX DE L'ARCEP D'UN TRIMESTRE, SANS RIEN INTERPRÉTER.
//
// Le jeu data.gouv.fr « Le marché du haut et très haut débit fixe (déploiements) » publie chaque
// trimestre, entre autres :
//   AAAATn-Commune                  ZIP du fichier par commune (shapefile, ~33 Mo) : la SOURCE ;
//   AAAATn-obs-hd-thd-deploiement   classeur de l'observatoire (~23 Mo) : le CONTRÔLE de concordance
//                                   (onglets « Communes » et « Arrondissements »).
// Le fichier par IMMEUBLE (~800 Mo) n'est jamais téléchargé : la table est communale.
//
// Ce script NE FAIT QUE COLLECTER, hors du dépôt et hors du build (un déploiement ne contacte jamais
// l'Arcep). Il écrit dans le cache :
//   <titre>.<ext>      les fichiers bruts, octet pour octet
//   manifeste.json     le jeu, sa licence telle que data.gouv.fr la déclare, et pour chaque fichier :
//                      titre, URL, SHA-256, taille, date de modification annoncée, date de lecture
//
//   node scripts/arcep/telecharger.mjs [--trimestre 2026T2] [--cache <dossier>] [--force]
// Sans --trimestre : le plus récent qui publie les deux fichiers.
// ════════════════════════════════════════════════════════════════════════════════════════════
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

const arg = (nom, defaut) => {
  const i = process.argv.indexOf(`--${nom}`);
  return i > 0 ? process.argv[i + 1] : defaut;
};
const CACHE = arg("cache", join(tmpdir(), "futuree-arcep"));
const FORCE = process.argv.includes("--force");
const JEU = "le-marche-du-haut-et-tres-haut-debit-fixe-deploiements";
const API = `https://www.data.gouv.fr/api/1/datasets/${JEU}/`;

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

const meta = await (await fetch(API)).json();
const trimestres = [...new Set(meta.resources.map((r) => /^(\d{4}T[1-4])-/i.exec(r.title)?.[1]?.toUpperCase()).filter(Boolean))].sort().reverse();
const ressourcesDe = (t) => ({
  commune: meta.resources.find((r) => new RegExp(`^${t}-Communes?$`, "i").test(r.title)),
  observatoire: meta.resources.find((r) => new RegExp(`^${t}-obs-hd-thd-deploiement$`, "i").test(r.title)),
});
const trimestre = arg("trimestre", trimestres.find((t) => { const r = ressourcesDe(t); return r.commune && r.observatoire; }));
const { commune, observatoire } = ressourcesDe(trimestre ?? "");
if (!commune || !observatoire) {
  console.error(`Trimestre ${trimestre} : fichier par commune ou classeur de l'observatoire introuvable sur ${API}`);
  process.exit(1);
}

mkdirSync(CACHE, { recursive: true });
const lu = { jeu: `https://www.data.gouv.fr/datasets/${JEU}`, licence: meta.license, producteur: meta.organization?.name ?? null, trimestre, fichiers: {} };
for (const [role, r] of Object.entries({ commune, observatoire })) {
  const ext = r.format?.toLowerCase() === "xlsx" ? "xlsx" : "zip";
  const chemin = join(CACHE, `${r.title}.${ext}`);
  if (!existsSync(chemin) || FORCE) {
    const rep = await fetch(r.url);
    if (!rep.ok) throw new Error(`${r.url} : HTTP ${rep.status}`);
    writeFileSync(chemin, Buffer.from(await rep.arrayBuffer()));
  }
  const buf = readFileSync(chemin);
  lu.fichiers[role] = {
    titre: r.title, url: r.url, fichier: chemin, sha256: sha256(buf), octets: buf.length,
    modifieLe: r.last_modified ?? null, luLe: new Date().toISOString().slice(0, 10),
  };
  console.log(`${role.padEnd(12)} ${r.title}  ${(buf.length / 1e6).toFixed(1)} Mo  ${lu.fichiers[role].sha256.slice(0, 16)}…`);
}
writeFileSync(join(CACHE, "manifeste.json"), `${JSON.stringify(lu, null, 2)}\n`);
console.log(`Manifeste : ${join(CACHE, "manifeste.json")}`);
