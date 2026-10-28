/**
 * Le fichier national cartefibre `<millésime>-Immeuble` (un ZIP de 835 Mo contenant un seul CSV de plus de
 * 4 Go), lu EN FLUX pendant son téléchargement et découpé par département. Le ZIP n'est jamais écrit sur
 * disque : on n'en garde que, par département, `imb_id <tab> imb_etat` (quelques Mo compressés).
 *
 * Le SHA-1 publié sur data.gouv.fr est calculé sur les octets reçus ; s'il ne concorde pas, les extraits
 * sont effacés et la construction s'arrête. Un extrait complet porte une méta (`immeuble.meta.json`) :
 * une reprise le réutilise sans retélécharger le ZIP.
 *
 * Le CSV n'est pas protégé par des guillemets, et quelques libellés contiennent une virgule (444 lignes au
 * T2 2026) : ces lignes sont relues par la droite, où les sept dernières colonnes n'ont jamais de virgule.
 * Une ligne qui porte des guillemets est d'abord lue selon la RFC 4180 (aucune au T2 2026, comptées).
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { createGzip, createInflateRaw } from "node:zlib";
import { Readable } from "node:stream";
import { once } from "node:events";
import { departementDe, LETTRE_ETAT } from "../../src/lib/fibre-adresse.ts";
import { champs } from "./sources.mjs";

export const ENTETE_IMMEUBLE = "x,y,imb_id,num_voie,cp_no_voie,type_voie,nom_voie,batiment,code_insee,code_poste,nom_com,catg_loc_imb,imb_etat,pm_ref,pm_etat,pm_date_mad,code_l331,type_imb,date_completude,date_completude_manquante";
const RX_INSEE = /^(?:\d{5}|2[AB]\d{3})$/;

/** Une ligne du CSV -> `{ imbId, insee, etat }`, ou `null` si elle est illisible. */
export function lireLigneImmeuble(l) {
  const p = l.includes('"') ? champs(l, ",") : l.split(",");
  if (p.length === 20) return { imbId: p[2], insee: p[8], etat: p[12] };
  if (p.length < 20) return null;
  // Une virgule dans un libellé : les sept dernières colonnes et `imb_etat` se relisent par la droite ;
  // le code INSEE est celui des deux candidats (gauche, droite) qui a la forme d'un code INSEE.
  const n = p.length;
  const insee = [p[8], p[n - 12]].find((c) => RX_INSEE.test(c));
  return insee ? { imbId: p[2], insee, etat: p[n - 8] } : null;
}

/** Le chemin de l'extrait d'un département. */
export const extraitDepartement = (dossier, dep) => path.join(dossier, "immeuble", `${dep}.tsv.gz`);
const metaExtraits = (dossier) => path.join(dossier, "immeuble", "immeuble.meta.json");

/** Les octets du flux « deflate » d'un ZIP à une seule entrée, après son en-tête local ; le SHA-1 voit tout. */
async function* fluxDeflate(corps, sha1) {
  let tete = Buffer.alloc(0);
  let enTete = true;
  for await (const morceau of corps) {
    sha1.update(morceau);
    if (!enTete) { yield morceau; continue; }
    tete = Buffer.concat([tete, morceau]);
    if (tete.length < 30) continue;
    if (tete.readUInt32LE(0) !== 0x04034b50) throw new Error("Immeuble : ce n'est pas un ZIP");
    if (tete.readUInt16LE(8) !== 8) throw new Error("Immeuble : méthode de compression inattendue");
    const debut = 30 + tete.readUInt16LE(26) + tete.readUInt16LE(28);
    if (tete.length < debut) continue;
    enTete = false;
    yield tete.subarray(debut);
  }
}

/**
 * Extrait le fichier national par département dans `<dossier>/immeuble/`. Rend les statistiques de lecture.
 * Réutilise les extraits existants s'ils viennent de la même publication (même URL, même SHA-1).
 */
export async function extraireImmeuble(ressource, dossier) {
  const metaF = metaExtraits(dossier);
  try {
    const m = JSON.parse(await fsp.readFile(metaF, "utf8"));
    if (m.url === ressource.url && m.sha1 === ressource.sha1 && m.complet) return { ...m, cache: true };
  } catch { /* à extraire */ }
  const sortie = path.join(dossier, "immeuble");
  await fsp.rm(sortie, { recursive: true, force: true });
  await fsp.mkdir(sortie, { recursive: true });

  const t0 = Date.now();
  const res = await fetch(ressource.url, { headers: { "User-Agent": "futuree-fibre-adresse/1 (FUT-156)" }, signal: AbortSignal.timeout(60 * 60_000) });
  if (!res.ok) throw new Error(`${ressource.url} : HTTP ${res.status}`);
  const sha1 = createHash("sha1");

  // Un tampon par département, vidé par blocs : peu d'écritures, et la contre-pression est respectée.
  const ecrivains = new Map();
  const tampons = new Map();
  const vider = async (dep, force = false) => {
    const t = tampons.get(dep);
    if (!t || (!force && t.length < 4096)) return;
    tampons.set(dep, []);
    let w = ecrivains.get(dep);
    if (!w) {
      w = { gz: createGzip({ level: 6 }), fichier: fs.createWriteStream(extraitDepartement(dossier, dep)) };
      w.gz.pipe(w.fichier);
      ecrivains.set(dep, w);
    }
    if (!w.gz.write(t.join(""))) await once(w.gz, "drain");
  };

  const stats = { lignes: 0, illisibles: 0, relues: 0, guillemets: 0, etats: {}, departements: {}, exemplesIllisibles: [] };
  let entete = null;
  let reste = "";
  const decoder = new TextDecoder("utf-8");
  const inflate = createInflateRaw();
  Readable.from(fluxDeflate(Readable.fromWeb(res.body), sha1)).pipe(inflate);
  for await (const b of inflate) {
    const parties = (reste + decoder.decode(b, { stream: true })).split("\n");
    reste = parties.pop();
    const touches = new Set();
    for (const brute of parties) {
      const l = brute.endsWith("\r") ? brute.slice(0, -1) : brute;
      if (entete === null) {
        entete = l.replace(/^﻿/, "");
        if (entete !== ENTETE_IMMEUBLE) throw new Error(`Immeuble : en-tête inattendu « ${entete.slice(0, 200)} »`);
        continue;
      }
      if (!l) continue;
      stats.lignes++;
      if (l.includes('"')) stats.guillemets++;
      const r = lireLigneImmeuble(l);
      if (!r) {
        stats.illisibles++;
        if (stats.exemplesIllisibles.length < 5) stats.exemplesIllisibles.push(l.slice(0, 200));
        continue;
      }
      if (!l.includes('"') && l.split(",").length !== 20) stats.relues++;
      stats.etats[r.etat] = (stats.etats[r.etat] ?? 0) + 1;
      if (r.etat && !(r.etat in LETTRE_ETAT)) throw new Error(`Immeuble : état inconnu « ${r.etat} » (${r.imbId})`);
      const dep = departementDe(r.insee);
      stats.departements[dep] = (stats.departements[dep] ?? 0) + 1;
      let t = tampons.get(dep);
      if (!t) tampons.set(dep, (t = []));
      t.push(`${r.imbId}\t${r.etat}\n`);
      touches.add(dep);
    }
    for (const dep of touches) await vider(dep);
  }
  if (reste) throw new Error("Immeuble : le fichier se termine au milieu d'une ligne");
  for (const dep of tampons.keys()) await vider(dep, true);
  await Promise.all([...ecrivains.values()].map(async ({ gz, fichier }) => {
    gz.end();
    await once(fichier, "finish");
  }));
  const empreinte = sha1.digest("hex");
  if (ressource.sha1 && empreinte !== ressource.sha1) {
    await fsp.rm(sortie, { recursive: true, force: true });
    throw new Error(`Immeuble : SHA-1 ${empreinte} différent de celui publié (${ressource.sha1})`);
  }
  const meta = { url: ressource.url, sha1: empreinte, taille: ressource.taille, date: ressource.date, complet: true, secondes: Math.round((Date.now() - t0) / 1000), ...stats };
  await fsp.writeFile(metaF, JSON.stringify(meta, null, 1));
  return { ...meta, cache: false };
}
