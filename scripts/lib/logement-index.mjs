// FUT-138 · Le champ `logement` de l'index : lecture des sources (DVF, ANIL, COG) et calcul.
// Partagé par scripts/populate-logement.mjs (production) et scripts/fut138/mesurer-effets.mjs (mesure des
// effets séparés). La logique de décision est dans ./dvf-prix.mjs (pure, testée).
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import readline from "node:readline";
import crypto from "node:crypto";
import {
  departementDe, grouperMutations, HORS_DVF, indexColonnes, lireLigneCsv, median, niveauFromPct, pctRank,
  rattacheur, resoudreAchat, retenirMutation, SEUIL,
} from "./dvf-prix.mjs";
import { resolveurCog } from "../../src/lib/data/bdiff-incendies.ts";
import { arrondissementsDe, communeParent } from "../../src/lib/plm.ts";

export const CACHE = path.join(process.cwd(), "data", "cache-logement");

// LES FICHIERS SOURCES, ÉPINGLÉS. Un fichier dont l'empreinte diffère est refusé : deux exécutions sur les
// mêmes fichiers donnent le même index, et une nouvelle livraison s'ajoute ici explicitement, jamais en
// remplaçant un cache en silence.
export const LIVRAISONS_DVF = {
  "2026-10-20": {
    libelle: "livraison DGFiP d'octobre 2026, version géolocalisée Etalab du 20/10/2026",
    cog: "2026",
    geographie: "actuelle", // code_commune = commune actuelle retrouvée par la parcelle (colonnes ancien_*)
    base: "https://static.data.gouv.fr/resources/demandes-de-valeurs-foncieres-geolocalisees/",
    fichiers: {
      2022: { url: "20261020-114218/full-2022.csv.gz", sha256: "70f90b5c1d5f1e26c60b49c653214d9afdfec9cde8d695a51e7e074e2a71e008" },
      2023: { url: "20261020-114336/full-2023.csv.gz", sha256: "272480643904c8c908e16181ab3161944c3bd9ee09f1a9bff46c001c893758cb" },
      2024: { url: "20261020-114532/full-2024.csv.gz", sha256: "061a8adf779b29a799e7a753d30fe7bbc3ca393727a0ee128edc5015b5f1d52f" },
      2025: { url: "20261020-114721/full-2025.csv.gz", sha256: "85854e21f21151e94748e6bf11657f801951854179f381b7f6abfeb9d80040a9" },
    },
  },
  // Livraison d'avril 2026 (fichiers `latest` du 18/05/2026) : celle des caches d'avant FUT-138. Gardée
  // pour MESURER l'effet de l'actualisation ; jamais pour produire l'index.
  "2026-05-18": {
    libelle: "livraison DGFiP d'avril 2026, version géolocalisée Etalab (fichiers du 18/05/2026)",
    cog: null,
    geographie: "annee_de_vente",
    base: "https://files.data.gouv.fr/geo-dvf/latest/csv/",
    fichiers: {
      2021: { url: "2021/full.csv.gz", sha256: null },
      2022: { url: "2022/full.csv.gz", sha256: null },
      2023: { url: "2023/full.csv.gz", sha256: null },
      2024: { url: "2024/full.csv.gz", sha256: null },
    },
  },
};
export const LIVRAISON_PRODUCTION = "2026-10-20";
export const ANNEES_PRODUCTION = [2022, 2023, 2024, 2025];

// Carte des loyers 2025 (ANIL) : loyers d'annonce, géographie au 01/01/2025, comme l'index.
export const ANIL = {
  edition: "Carte des loyers 2025",
  appart: { id: "55b34088-0964-415f-9df7-d87dd98a09be", sha256: "eda84e03a269faff3335f7ab6061d1f1e9f45adc89c0a4c32632df20a5de4010" },
  maison: { id: "129f764d-b613-44e4-952c-5ff50a8c9b73", sha256: "fd4f5e33ec1d7c8d97deeb024bab4b4a76466f2822f83a3739d1777c3b7bd72b" },
};

// COG 2026 (Insee) : mouvements depuis 1943. Sert à suivre les fusions et à repérer les rétablissements.
export const COG_MVT = {
  url: "https://www.insee.fr/fr/statistiques/fichier/8740222/v_mvt_commune_2026.csv",
  sha256: "8b339fad8232e97233af3fd9468715af845e2cf8b14cb67b24d9a301ef8645f1",
};

const sha256 = (f) => new Promise((res, rej) => {
  const h = crypto.createHash("sha256");
  fs.createReadStream(f).on("data", (d) => h.update(d)).on("end", () => res(h.digest("hex"))).on("error", rej);
});

async function telecharger(url, dest) {
  console.error(`télécharge ${url}`);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} : HTTP ${r.status}`);
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  await fsp.writeFile(dest, Buffer.from(await r.arrayBuffer()));
}

/** Le fichier en cache, téléchargé s'il manque, REFUSÉ si son empreinte n'est pas celle épinglée. */
async function fichierEpingle(dest, url, attendu, { telechargerSiAbsent = true } = {}) {
  if (!fs.existsSync(dest)) {
    if (!telechargerSiAbsent) throw new Error(`${dest} absent`);
    await telecharger(url, dest);
  }
  const reel = await sha256(dest);
  if (attendu && reel !== attendu) throw new Error(`${dest} : empreinte ${reel}, attendue ${attendu}. Fichier d'une autre livraison ?`);
  return { chemin: dest, sha256: reel };
}

export async function fichiersDvf(livraison, annees) {
  const L = LIVRAISONS_DVF[livraison];
  if (!L) throw new Error(`livraison DVF inconnue : ${livraison}`);
  const out = [];
  for (const a of annees) {
    const f = L.fichiers[a];
    if (!f) throw new Error(`livraison ${livraison} : pas de fichier ${a}`);
    const nom = livraison === "2026-05-18" ? `dvf_${a}.csv.gz` : path.basename(f.url);
    out.push({ annee: a, ...(await fichierEpingle(path.join(CACHE, `geo-dvf-${livraison}`, nom), L.base + f.url, f.sha256)) });
  }
  return out;
}

export async function mouvementsCog() {
  const { chemin, sha256: s } = await fichierEpingle(path.join(CACHE, "cog", "v_mvt_commune_2026.csv"), COG_MVT.url, COG_MVT.sha256);
  const lignes = fs.readFileSync(chemin, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  const entete = lignes[0].split(",").map((x) => x.replace(/"/g, ""));
  const mouvements = lignes.slice(1).map((l) => {
    const v = lireLigneCsv(l);
    return Object.fromEntries(entete.map((h, i) => [h, v[i] ?? ""]));
  });
  return { mouvements, sha256: s };
}

/**
 * La géographie de la livraison et celle de l'index doivent coïncider. L'index est au COG du 01/01/2025 ; la
 * livraison du 20/10/2026 au COG 2026. Un mouvement territorial (rétablissement, fusion, changement de
 * code) daté du 01/01/2026 ou après rendrait des codes actuels faux pour l'index : REFUS.
 */
export function verifierGeographieCompatible(mouvements, apres = "2025-01-01") {
  const territoriaux = new Set(["21", "31", "32", "33", "41", "50"]);
  const genants = mouvements.filter((m) => m.DATE_EFF > apres && territoriaux.has(m.MOD));
  if (genants.length) {
    throw new Error(`${genants.length} mouvement(s) territorial(aux) après le ${apres} : la livraison et l'index n'ont plus la même géographie (ex. ${genants[0].MOD} ${genants[0].DATE_EFF} ${genants[0].COM_AV}→${genants[0].COM_AP})`);
  }
}

/**
 * Agrège les ventes : par code, les €/m² des maisons et des appartements.
 * @param {"actuelle"|"vente"|"brute"} geographie
 *   - actuelle : production. Code actuel de la livraison, suivi des fusions, abstention des rétablissements.
 *   - vente    : mesure. Le code de l'année de la vente (`ancien_code_commune` sinon `code_commune`), sans suite.
 *   - brute    : mesure. `code_commune` tel quel (le comportement d'avant FUT-138).
 * @param {"local"|"ef77afdd"} repetitions lignes répétées d'un même local (cf. locauxDistincts) ; "ef77afdd" pour la mesure.
 */
export async function agregerDvf(fichiers, { geographie, referentiel, mouvements, repetitions = "local" }) {
  const rattacher = geographie === "actuelle"
    ? rattacheur({ referentiel, mouvements, resoudre: resolveurCog(referentiel, mouvements) })
    : null;
  const achat = {};
  const bilan = { mutations: 0, retenues: 0, rejets: {}, abstentions: {}, reprises: 0, horsReferentiel: 0 };
  for (const f of fichiers) {
    const rl = readline.createInterface({ input: fs.createReadStream(f.chemin).pipe(zlib.createGunzip()), crlfDelay: Infinity });
    let I = null, g = null;
    const emettre = (lignes) => {
      bilan.mutations++;
      const m = retenirMutation(lignes, I, { repetitions });
      if (m.rejet) { bilan.rejets[m.rejet] = (bilan.rejets[m.rejet] ?? 0) + 1; return; }
      let code;
      if (rattacher) {
        const r = rattacher(m);
        if (r.abstention) { bilan.abstentions[r.abstention] = (bilan.abstentions[r.abstention] ?? 0) + 1; return; }
        code = r.code;
      } else {
        code = geographie === "vente" ? (m.ancien || m.code) : m.code;
        if (!referentiel.has(code)) { bilan.horsReferentiel++; return; }
      }
      bilan.retenues++;
      (achat[code] ??= { maison: [], appart: [] })[m.type].push(m.eurM2);
    };
    for await (const l of rl) {
      if (I === null) { I = indexColonnes(l.split(",")); g = grouperMutations(I); continue; }
      g.pousser(lireLigneCsv(l), emettre);
    }
    bilan.reprises += g.finir(emettre).reprises;
  }
  return { achat, bilan };
}

export async function lireAnil() {
  const epci = {}, loy = {};
  const empreintes = {};
  for (const key of ["appart", "maison"]) {
    const { chemin, sha256: s } = await fichierEpingle(path.join(CACHE, `loyers_${key}.csv`), `https://www.data.gouv.fr/api/1/datasets/r/${ANIL[key].id}`, ANIL[key].sha256);
    empreintes[key] = s;
    const L = fs.readFileSync(chemin, "latin1").split(/\r?\n/);
    const h = L[0].split(";").map((x) => x.replace(/"/g, ""));
    const iI = h.indexOf("INSEE_C"), iE = h.indexOf("EPCI"), iL = h.indexOf("loypredm2"), iT = h.indexOf("TYPPRED");
    for (let k = 1; k < L.length; k++) {
      if (!L[k]) continue;
      const c = L[k].split(";").map((x) => x.replace(/^"|"$/g, ""));
      const insee = c[iI];
      if (key === "appart") epci[insee] = c[iE];
      (loy[insee] ??= {})[key] = parseFloat((c[iL] || "").replace(",", ".")) || null;
      loy[insee].typ = c[iT]; // "commune" (observée) | "maille" (estimée)
    }
  }
  return { epci, loy, empreintes };
}

/**
 * Le champ `logement` de chaque commune de l'index, à partir de l'agrégat DVF et des loyers ANIL.
 * @returns {Record<string, object>} insee -> logement
 */
export function calculerLogement(codes, achat, { epci, loy }, { villePLM = true } = {}) {
  const achatEpci = {};
  for (const code of Object.keys(achat).sort()) {
    const e = epci[code];
    if (!e) continue;
    achatEpci[e] ??= { maison: [], appart: [] };
    achatEpci[e].maison.push(...achat[code].maison);
    achatEpci[e].appart.push(...achat[code].appart);
  }
  // Paris, Lyon, Marseille : les ventes de la ville entière, repli d'un arrondissement avant l'EPCI.
  const achatVille = {};
  if (villePLM) {
    for (const ville of ["75056", "69123", "13055"]) {
      achatVille[ville] = { maison: [], appart: [] };
      for (const a of arrondissementsDe(ville)) {
        achatVille[ville].maison.push(...(achat[a]?.maison ?? []));
        achatVille[ville].appart.push(...(achat[a]?.appart ?? []));
      }
    }
  }
  const resolved = {};
  for (const code of codes) {
    const ville = communeParent(code) !== code ? achatVille[communeParent(code)] ?? null : null;
    resolved[code] = {
      m: resoudreAchat(achat, epci, achatEpci, code, "maison", ville),
      a: resoudreAchat(achat, epci, achatEpci, code, "appart", ville),
      la: loy[code]?.appart ?? null,
      lm: loy[code]?.maison ?? null,
      lt: loy[code]?.typ ?? null,
    };
  }
  const vals = (sel) => Object.values(resolved).map(sel).filter((v) => v != null && !isNaN(v)).sort((x, y) => x - y);
  const dM = vals((r) => r.m.med), dA = vals((r) => r.a.med), dLA = vals((r) => r.la), dLM = vals((r) => r.lm);
  const moyenne = (ps) => (ps.length ? niveauFromPct(ps.reduce((s, x) => s + x, 0) / ps.length) : null);

  const out = {};
  for (const code of codes) {
    const r = resolved[code];
    const ps = [];
    if (r.m.med != null) ps.push(pctRank(dM, r.m.med));
    if (r.a.med != null) ps.push(pctRank(dA, r.a.med));
    const aN = moyenne(ps);
    const pl = [];
    if (r.la != null && !isNaN(r.la)) pl.push(pctRank(dLA, r.la));
    if (r.lm != null && !isNaN(r.lm)) pl.push(pctRank(dLM, r.lm));
    const lN = moyenne(pl);
    const prix = (x) => (x.med != null ? { eur_m2: x.med, maille: x.maille, ventes: x.ventes } : null);
    out[code] = {
      achat: aN != null
        ? { dispo: true, niveau: aN, maison: prix(r.m), appart: prix(r.a) }
        // « non disponible » avec sa raison, jamais « moyen ».
        : { dispo: false, motif: HORS_DVF.has(departementDe(code)) ? "hors_dvf" : "ventes_insuffisantes" },
      location: lN != null
        ? {
            niveau: lN,
            appart_eur_m2: r.la == null ? null : Math.round(r.la * 10) / 10,
            maison_eur_m2: r.lm == null ? null : Math.round(r.lm * 10) / 10,
            fiabilite: r.lt === "commune" ? "observee" : "estimee",
          }
        : null,
    };
  }
  return out;
}

/**
 * Paris, Lyon, Marseille : l'index ne connaît que les arrondissements. Le prix « de la ville » est la
 * médiane de TOUTES ses ventes (jamais une moyenne de médianes d'arrondissements). Les loyers ANIL n'existent
 * que par arrondissement : pas de loyer de ville.
 */
export function calculerVillesPLM(achat) {
  const out = {};
  for (const ville of ["75056", "69123", "13055"]) {
    const lots = { maison: [], appart: [] };
    for (const a of arrondissementsDe(ville)) {
      lots.maison.push(...(achat[a]?.maison ?? []));
      lots.appart.push(...(achat[a]?.appart ?? []));
    }
    const prix = (l) => (l.length >= SEUIL ? { eur_m2: median(l), maille: "commune", ventes: l.length } : null);
    const maison = prix(lots.maison), appart = prix(lots.appart);
    out[ville] = { achat: maison || appart ? { dispo: true, maison, appart } : { dispo: false, motif: "ventes_insuffisantes" }, location: null };
  }
  return out;
}

export function metaLogement({ livraison, annees, fichiers, empreintesAnil, cogSha, bilan, villesPLM }) {
  const L = LIVRAISONS_DVF[livraison];
  return {
    achat: {
      source: "DVF (Demandes de valeurs foncières), DGFiP ; version géolocalisée Etalab",
      livraison: L.libelle,
      periode: { debut: `${annees[0]}-01-01`, fin: `${annees[annees.length - 1]}-12-31` },
      indicateur: "médiane des prix de vente observés au m² de surface habitable, ventes d'un seul logement (dépendances comprises)",
      maille: `commune si au moins ${SEUIL} ventes du type sur la période ; pour un arrondissement de Paris, Lyon ou Marseille, sinon la ville entière ; sinon intercommunalité (EPCI) ; sinon non disponible`,
      geographie: "commune actuelle : parcelle replacée par Etalab dans le cadastre récent, fusions suivies par le COG 2026, ventes non localisables d'une commune rétablie écartées",
      fichiers: Object.fromEntries(fichiers.map((f) => [path.basename(f.chemin), f.sha256])),
      cog: { fichier: "v_mvt_commune_2026.csv", sha256: cogSha },
      bilan,
      licence: "Licence Ouverte 2.0 ; agrégats seulement, aucune vente individuelle republiée",
    },
    location: {
      source: `${ANIL.edition} (ANIL, DGALN), indicateurs de loyers d'annonce par commune`,
      // Mention exigée par les conditions d'utilisation du jeu.
      attribution: "Estimations ANIL, à partir des données du Groupe SeLoger et de leboncoin",
      indicateur: "loyer d'annonce charges comprises au m², bien type loué vide (appartement 52 m², maison 92 m²), mis en location au 3e trimestre 2025",
      fiabilite: "observee : estimation communale ; estimee : commune imputée depuis une maille plus large (peu d'annonces)",
      fichiers: empreintesAnil,
    },
    // Paris, Lyon, Marseille en ville entière (l'index ne porte que les arrondissements).
    villesPLM,
    paliers: "tres_bas/bas/moyen/haut/tres_haut par percentiles nationaux (déciles aux extrêmes, tiers au centre) ; moyen = silence au comparateur",
    limite: "achat non disponible en Alsace-Moselle (57/67/68, livre foncier hors DVF) et à Mayotte ; prix passés d'un marché local, jamais la valeur d'un bien ni un prix futur ; hors classement",
  };
}
