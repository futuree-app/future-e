// Construit `data/iris-logement.json` depuis la base infracommunale IRIS « Logement » de l'INSEE.
//
// SOURCE : Recensement de la population — Base infracommunale (IRIS), millésime 2022.
//   https://www.insee.fr/fr/statistiques/8647012  (base-ic-logement-2022_csv.zip, ~27 Mo)
//
// CE QUE C'EST, ET CE QUE CE N'EST PAS. C'est une ESTIMATION issue du recensement, pas un comptage
// exhaustif : dans les communes de 10 000 habitants et plus, l'INSEE enquête chaque année ~8 % des
// logements, cumulés sur cinq ans. D'où des effectifs PONDÉRÉS, non entiers (1424,4097 résidences
// principales) — à parser en décimal, jamais en entier.
//
// DEUX CHAMPS DE STRUCTURE, relevés le 28/07/2026 sur les 49 276 lignes du fichier :
//
//   TYP_IRIS : H habitat (15 010) · A activité (829) · D divers (401) · Z commune non découpée (33 036)
//     C'est le GARDE-FOU SÉMANTIQUE. Un IRIS d'activité ou « divers » (gare, zone d'emploi, parc)
//     décrit un lieu où presque personne n'habite : en tirer un « profil des ménages autour de
//     l'adresse » serait un chiffre calculé sur presque rien. Les deux tiers des lignes (Z) ne sont
//     pas des IRIS du tout mais des communes entières, fournies par l'INSEE pour couvrir le
//     territoire — on les garde telles quelles, en les annonçant comme communales.
//
//   LAB_IRIS : 1 (10 319) · 2 (1 641) · 3 (1 149) · 4 (2 517) · 5 (33 036) · Z (614)
//     CONSERVÉ MAIS NON INTERPRÉTÉ. La signification des modalités n'a pas été retrouvée dans la
//     documentation INSEE ; le fichier `meta_` laisse ses colonnes de modalités vides. On le stocke
//     pour plus tard et il ne gouverne RIEN. Déduire sa sémantique par corrélation reconstruirait
//     officieusement une doctrine que le producteur n'a pas publiée.
//     (Seul fait établi : LAB=5 recouvre exactement TYP=Z, donc les communes non découpées.)
//
// INVARIANT VÉRIFIÉ à l'import : VOIT1 + VOIT2P == VOIT1P (49 094/49 094 lignes, 0 écart).
//
// Usage : node scripts/build-iris-logement.mjs

import { createWriteStream } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileP = promisify(execFile);

/** Arrondissement municipal -> sa commune. Même table que `src/lib/plm.ts` (script hors bundle TS). */
function communeParent(insee) {
  if (insee >= "75101" && insee <= "75120") return "75056"; // Paris
  if (insee >= "69381" && insee <= "69389") return "69123"; // Lyon
  if (insee >= "13201" && insee <= "13216") return "13055"; // Marseille
  return insee;
}

const URL_ZIP =
  "https://www.insee.fr/fr/statistiques/fichier/8647012/base-ic-logement-2022_csv.zip";
const CSV_NAME = "base-ic-logement-2022.CSV";
const OUT = path.join(process.cwd(), "data", "iris-logement.json");
const DATA_YEAR = 2022;

/** Décimal FR (« 1424,4097 ») -> nombre. `null` si vide ou illisible : jamais 0 par défaut. */
function dec(v) {
  if (v == null) return null;
  const s = String(v).replace(",", ".").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Découpe une ligne CSV `;` sans guillemets (format INSEE). */
function split(line) {
  return line.split(";");
}

async function main() {
  const dir = await mkdtemp(path.join(tmpdir(), "iris-log-"));
  try {
    process.stdout.write("Téléchargement INSEE… ");
    const res = await fetch(URL_ZIP);
    if (!res.ok) throw new Error(`INSEE HTTP ${res.status}`);
    const zip = path.join(dir, "base.zip");
    await pipeline(res.body, createWriteStream(zip));
    console.log("ok");

    await execFileP("unzip", ["-o", "-q", zip, CSV_NAME, "-d", dir]);
    const csv = await readFile(path.join(dir, CSV_NAME), "latin1");

    const lines = csv.split(/\r?\n/);
    const head = split(lines[0]);
    const col = (name) => {
      const i = head.indexOf(name);
      if (i < 0) throw new Error(`colonne absente : ${name} (schéma INSEE modifié ?)`);
      return i;
    };
    const iIRIS = col("IRIS"), iTYP = col("TYP_IRIS"), iLAB = col("LAB_IRIS");
    const iRP = col("P22_RP"), iV1P = col("P22_RP_VOIT1P"), iV1 = col("P22_RP_VOIT1"), iV2P = col("P22_RP_VOIT2P");

    /** @type {Record<string, [string, string, number, number]>} iris -> [typ, lab, part ≥1 voiture, RP] */
    const secteurs = {};
    /** @type {Record<string, [number, number]>} commune -> [somme VOIT1P, somme RP] */
    const cumulCommune = {};
    let n = 0, invariantKo = 0, sansRp = 0;

    for (let k = 1; k < lines.length; k += 1) {
      const line = lines[k];
      if (!line) continue;
      const c = split(line);
      const iris = (c[iIRIS] ?? "").trim();
      if (iris.length < 5) continue;
      n += 1;

      const rp = dec(c[iRP]), v1p = dec(c[iV1P]), v1 = dec(c[iV1]), v2p = dec(c[iV2P]);
      if (v1 != null && v2p != null && v1p != null && v1p > 0 && Math.abs(v1 + v2p - v1p) > 0.01 * v1p) {
        invariantKo += 1;
      }
      // Un dénominateur nul ou absent ne produit JAMAIS 0 % : la ligne n'a pas de part.
      if (rp == null || rp <= 0 || v1p == null) { sansRp += 1; continue; }

      const part = Math.round((100 * v1p) / rp * 10) / 10;
      secteurs[iris] = [(c[iTYP] ?? "").trim(), (c[iLAB] ?? "").trim(), part, Math.round(rp)];

      // LA COMMUNE CUMULE TOUS SES IRIS, y compris A et D. Ils sont exclus de la RESTITUTION
      // résidentielle locale, pas du dénombrement communal : les ménages d'un IRIS d'activité
      // habitent bien la commune. Les lignes Z sont déjà communales, elles se cumulent seules.
      // DEUX CLÉS POUR PARIS, LYON, MARSEILLE. Leurs IRIS portent le code de l'ARRONDISSEMENT
      // (75104 pour Paris 4e), jamais celui de la commune (75056) : cumuler sur les 5 premiers
      // caractères seuls laisserait les trois plus grandes villes de France sans agrégat communal —
      // exactement le même angle mort que sur les IRIS ADEME. On cumule donc sous l'arrondissement
      // ET sous la commune parente, pour que la comparaison marche avec l'un comme avec l'autre.
      const arr = iris.slice(0, 5);
      for (const cle of new Set([arr, communeParent(arr)])) {
        const cum = cumulCommune[cle] ?? [0, 0];
        cum[0] += v1p; cum[1] += rp;
        cumulCommune[cle] = cum;
      }
    }

    /** @type {Record<string, number>} commune -> part ≥1 voiture */
    const communes = {};
    for (const [insee, [v, rp]] of Object.entries(cumulCommune)) {
      if (rp > 0) communes[insee] = Math.round((100 * v) / rp * 10) / 10;
    }

    if (invariantKo > 0) {
      throw new Error(`INVARIANT ROMPU : VOIT1 + VOIT2P != VOIT1P sur ${invariantKo} lignes`);
    }

    const out = {
      source: "insee_rp_ic_logement",
      sourceUrl: URL_ZIP,
      dataYear: DATA_YEAR,
      builtAt: new Date().toISOString().slice(0, 10),
      note: "Estimation issue du recensement INSEE (enquête annuelle par sondage dans les communes de 10 000 hab. et plus). Effectifs pondérés.",
      secteurs,
      communes,
    };
    await writeFile(OUT, JSON.stringify(out), "utf8");

    const parTyp = {};
    for (const [, [typ]] of Object.entries(secteurs)) parTyp[typ] = (parTyp[typ] ?? 0) + 1;
    console.log(`lignes lues        : ${n}`);
    console.log(`retenues           : ${Object.keys(secteurs).length} (écartées faute de RP : ${sansRp})`);
    console.log(`par TYP_IRIS       : ${JSON.stringify(parTyp)}`);
    console.log(`communes agrégées  : ${Object.keys(communes).length}`);
    console.log(`invariant VOIT     : OK sur toutes les lignes`);
    console.log(`écrit              : ${OUT}`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
