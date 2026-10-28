/**
 * Les sources officielles de la fibre à l'adresse (FUT-156) : où les trouver, comment les télécharger
 * une seule fois, et comment prouver que ce qu'on lit est bien ce qui a été publié.
 *
 *  - Ma connexion internet (Arcep) : `base_imb` et `eligibilite/actuel`, un fichier par département.
 *    La page d'index de chaque trimestre donne la taille exacte (`data-size`) et la date de chaque fichier :
 *    c'est l'empreinte publiée, vérifiée après téléchargement. Pas de somme de contrôle publiée.
 *  - cartefibre (Arcep, sur data.gouv.fr) : `<millésime>-Immeuble`, un seul ZIP national, avec un SHA-1
 *    publié dans les métadonnées de la ressource.
 *  - BAN : `adresses-<département>.csv.gz`, instantané du jour (taille et date relevées).
 *
 * Le cache : chaque fichier téléchargé est accompagné de `<fichier>.meta.json` (URL, taille, date publiée,
 * SHA-256 local). Un fichier déjà présent dont la méta concorde avec la publication n'est pas retéléchargé ;
 * un téléchargement interrompu (`.part`) reprend là où il s'est arrêté (requête `Range`).
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { createGunzip } from "node:zlib";

export const ARCEP_MCI = "https://data.arcep.fr/fixe/maconnexioninternet";
export const DATAGOUV_DEPLOIEMENTS = "https://www.data.gouv.fr/api/1/datasets/le-marche-du-haut-et-tres-haut-debit-fixe-deploiements/";
export const BAN = "https://adresse.data.gouv.fr/data/ban/adresses/latest/csv";
const UA = { "User-Agent": "futuree-fibre-adresse/1 (FUT-156)" };

/** `2026_T2` (Arcep) <-> `2026T2` (futur•e et data.gouv). */
export const versMillesime = (arcep) => arcep.replace("_", "");
export const versArcep = (millesime) => millesime.replace(/^(\d{4})T/, "$1_T");

async function texte(url) {
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`${url} : HTTP ${res.status}`);
  return res.text();
}

/**
 * La liste officielle des fichiers départementaux d'un jeu MCI pour un trimestre (`last` ou `2026_T2`).
 * Rend le millésime RÉELLEMENT servi (lu dans la page, pas déduit de l'URL) et, par département,
 * l'URL, la taille et la date publiées.
 */
export async function catalogueMci(jeu, trimestre) {
  const prefixe = jeu === "base_imb" ? "base_imb" : "actuel";
  const url = `${ARCEP_MCI}/${jeu}/${trimestre}/departement/index.html`;
  const page = await texte(url);
  const titres = [...page.matchAll(/<a href="\.\.\/index\.html">(\d{4}_T[1-4])<\/a>/g)].map((m) => m[1]);
  if (titres.length === 0) throw new Error(`${url} : millésime introuvable dans la page`);
  if (new Set(titres).size !== 1) throw new Error(`${url} : millésimes contradictoires ${titres.join(", ")}`);
  const fichiers = {};
  const rx = new RegExp(`href="(${prefixe}_([0-9AB]{2,3})\\.csv\\.gz)"[\\s\\S]*?data-size="(\\d+)"[\\s\\S]*?datetime="([^"]+)"`, "g");
  for (const m of page.matchAll(rx)) {
    fichiers[m[2]] = { url: `${ARCEP_MCI}/${jeu}/${titres[0]}/departement/${m[1]}`, taille: Number(m[3]), date: m[4] };
  }
  if (Object.keys(fichiers).length < 90) throw new Error(`${url} : ${Object.keys(fichiers).length} fichiers seulement, liste incomplète ?`);
  return { millesime: versMillesime(titres[0]), fichiers };
}

/** Le référentiel des opérateurs du trimestre (`code;code_interop;nom`). */
export async function referentielOperateurs(millesime) {
  const t = await texte(`${ARCEP_MCI}/reference/${versArcep(millesime)}/operateur/operateur.csv`);
  const lignes = t.trim().split(/\r?\n/);
  if (lignes[0] !== "code;code_interop;nom") throw new Error(`operateur.csv : en-tête inattendu « ${lignes[0]} »`);
  return new Map(lignes.slice(1).map((l) => { const [code, , nom] = l.split(";"); return [code, nom?.trim() ?? ""]; }));
}

/** La ressource cartefibre `<millésime>-Immeuble` et son SHA-1 publié. */
export async function ressourceImmeuble(millesime) {
  const d = JSON.parse(await texte(DATAGOUV_DEPLOIEMENTS));
  const r = d.resources.filter((x) => x.title === `${millesime}-Immeuble`);
  if (r.length !== 1) throw new Error(`data.gouv : ${r.length} ressource(s) « ${millesime}-Immeuble »`);
  const sha1 = r[0].checksum?.type === "sha1" ? r[0].checksum.value : null;
  return { url: r[0].url, taille: r[0].filesize, sha1, date: r[0].last_modified };
}

/** Taille et date de l'instantané BAN d'un département (`null` si la BAN ne le publie pas). */
export async function ressourceBan(dep) {
  const url = `${BAN}/adresses-${dep}.csv.gz`;
  const res = await fetch(url, { method: "HEAD", headers: UA, redirect: "follow", signal: AbortSignal.timeout(30_000) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${url} : HTTP ${res.status}`);
  return { url, taille: Number(res.headers.get("content-length")), date: new Date(res.headers.get("last-modified")).toISOString() };
}

async function sha256(fichier) {
  const h = createHash("sha256");
  await pipeline(fs.createReadStream(fichier), h);
  return h.digest("hex");
}

/**
 * Télécharge `source.url` dans `dest`, sauf si le cache le porte déjà pour la même publication (même taille,
 * même date). Reprend un `.part` interrompu. Vérifie la taille publiée et, s'il est publié, le SHA-1.
 * Rend la méta (avec le SHA-256 local, consigné dans le rapport de construction).
 */
export async function telecharger(source, dest, { essais = 4 } = {}) {
  const metaF = `${dest}.meta.json`;
  try {
    const meta = JSON.parse(await fsp.readFile(metaF, "utf8"));
    const st = await fsp.stat(dest);
    if (meta.url === source.url && meta.taille === source.taille && meta.date === source.date && st.size === source.taille) {
      return { ...meta, cache: true };
    }
  } catch { /* pas en cache */ }
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  const part = `${dest}.part`;
  for (let i = 1; ; i++) {
    try {
      const deja = await fsp.stat(part).then((s) => s.size, () => 0);
      const res = await fetch(source.url, {
        headers: { ...UA, ...(deja > 0 ? { Range: `bytes=${deja}-` } : {}) },
        redirect: "follow",
        signal: AbortSignal.timeout(30 * 60_000),
      });
      if (deja > 0 && res.status === 200) await fsp.rm(part, { force: true }); // le serveur ignore la reprise
      else if (!res.ok && res.status !== 206) throw new Error(`HTTP ${res.status}`);
      await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(part, { flags: res.status === 206 ? "a" : "w" }));
      break;
    } catch (e) {
      if (i >= essais) throw new Error(`${source.url} : ${String(e).slice(0, 200)}`);
      console.warn(`  téléchargement interrompu (${String(e).slice(0, 120)}), reprise dans ${5 * i} s`);
      await new Promise((r) => setTimeout(r, 5000 * i));
    }
  }
  const st = await fsp.stat(part);
  if (source.taille && st.size !== source.taille) {
    await fsp.rm(part, { force: true });
    throw new Error(`${source.url} : ${st.size} octets reçus, ${source.taille} publiés`);
  }
  if (source.sha1) {
    const h = createHash("sha1");
    await pipeline(fs.createReadStream(part), h);
    if (h.digest("hex") !== source.sha1) {
      await fsp.rm(part, { force: true });
      throw new Error(`${source.url} : SHA-1 différent de celui publié`);
    }
  }
  await fsp.rename(part, dest);
  const meta = { url: source.url, taille: st.size, date: source.date, sha256: await sha256(dest) };
  await fsp.writeFile(metaF, JSON.stringify(meta, null, 1));
  return { ...meta, cache: false };
}

/**
 * Les champs d'un enregistrement CSV (RFC 4180) : un champ entre guillemets peut contenir le séparateur, un
 * saut de ligne, ou un guillemet doublé. `base_imb` et la BAN en ont (« "Résidence ""Les Aigrettes""" »,
 * « "Mortessagne;Le Favet" ») : un découpage naïf décale toutes les colonnes suivantes.
 */
export function champs(ligne, sep) {
  if (!ligne.includes('"')) return ligne.split(sep);
  const out = [];
  let i = 0;
  while (i <= ligne.length) {
    if (ligne[i] === '"') {
      let v = "";
      i++;
      for (;;) {
        const j = ligne.indexOf('"', i);
        if (j < 0) throw new Error(`CSV : guillemet non fermé « ${ligne.slice(0, 200)} »`);
        v += ligne.slice(i, j);
        if (ligne[j + 1] === '"') { v += '"'; i = j + 2; continue; }
        i = j + 1;
        break;
      }
      out.push(v);
      if (i < ligne.length && ligne[i] !== sep) throw new Error(`CSV : texte après un guillemet fermant « ${ligne.slice(0, 200)} »`);
      i++;
    } else {
      const j = ligne.indexOf(sep, i);
      const fin = j < 0 ? ligne.length : j;
      out.push(ligne.slice(i, fin));
      i = fin + 1;
    }
  }
  return out;
}

/** Un nombre impair de guillemets : l'enregistrement continue sur la ligne suivante (saut de ligne dans un champ). */
const ouvert = (l) => { let n = 0; for (let i = l.indexOf('"'); i >= 0; i = l.indexOf('"', i + 1)) n++; return n % 2 === 1; };

/** Les enregistrements CSV d'un fichier, en flux, chacun déjà découpé en champs (en-tête compris). */
export async function* enregistrements(fichier, sep) {
  let attente = null;
  for await (const l of lignes(fichier)) {
    const courante = attente === null ? l : `${attente}\n${l}`;
    if (courante.includes('"') && ouvert(courante)) { attente = courante; continue; }
    attente = null;
    yield champs(courante.replace(/^\uFEFF/, ""), sep);
  }
  if (attente !== null) throw new Error(`${fichier} : guillemet non fermé en fin de fichier`);
}

/**
 * Les lignes d'un fichier texte, compressé (`.gz`) ou non, en flux : rien n'est chargé en entier.
 * Itérateur asynchrone de lignes (sans le saut de ligne final).
 */
export async function* lignes(fichier) {
  const flux = fichier.endsWith(".gz") ? fs.createReadStream(fichier).pipe(createGunzip()) : fs.createReadStream(fichier);
  flux.setEncoding("utf8");
  let reste = "";
  for await (const morceau of flux) {
    const parties = (reste + morceau).split("\n");
    reste = parties.pop();
    for (const l of parties) yield l.endsWith("\r") ? l.slice(0, -1) : l;
  }
  if (reste) yield reste;
}
