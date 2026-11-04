#!/usr/bin/env node
/**
 * populate-logement.mjs : prix immobiliers (achat + location) de l'index, NARRATIFS, hors classement.
 *
 * POURQUOI. Première question posée dès qu'on montre le produit : « combien coûte un logement ici ? ».
 * Doctrine (LOGEMENT_TERRITORIAL.md, FUT-138) : logement = information, jamais critère de classement. Deux
 * signaux SÉPARÉS, achat et location, avec leurs chiffres, leur maille, leur période et leur source.
 *
 * SOURCES (épinglées par empreinte dans scripts/lib/logement-index.mjs).
 *  - Achat : DVF (DGFiP), version géolocalisée Etalab, livraison du 20/10/2026, ventes 2022 à 2025.
 *            Médiane des prix observés au m², ventes d'un seul logement. Trou DVF : Alsace-Moselle
 *            (57/67/68) et Mayotte, « non disponible » avec sa raison, jamais « moyen ».
 *  - Location : Carte des loyers 2025 (ANIL), loyer d'annonce charges comprises au m², avec drapeau de
 *            fiabilité (estimation communale ou maille imputée).
 *
 * GÉOGRAPHIE (FUT-138). Chaque vente est rangée sous la commune ACTUELLE (cf. scripts/lib/dvf-prix.mjs) :
 * une commune nouvelle compte les ventes de tout son territoire, une commune rétablie les siennes.
 *
 * MAILLE. Achat : commune si >= 10 ventes du type sur la période, sinon EPCI, sinon non disponible.
 * Location : commune (ANIL impute déjà les petites communes ; on porte le drapeau).
 *
 * SIGNAL. Niveau relatif en 5 paliers par percentiles nationaux, pour la phrase du comparateur (« moyen »
 * = silence). Les chiffres, la maille et les effectifs vivent dans l'index pour les autres surfaces.
 *
 * USAGE
 *   node scripts/populate-logement.mjs              recalcule et patche data/comparateur-index.json
 *   node scripts/populate-logement.mjs --verifier   recalcule SANS écrire ; exit 1 si l'index diffère
 * Reproductible : mêmes fichiers (empreintes vérifiées) => même index, octet pour octet sur `logement`.
 */
import fsp from "node:fs/promises";
import { assertIndexWorktree } from "./lib/require-index-worktree.mjs";
import { INDEX_JSON_PATH } from "./lib/index-io.mjs";
import {
  agregerDvf, ANNEES_PRODUCTION, calculerLogement, calculerVillesPLM, fichiersDvf, LIVRAISON_PRODUCTION, lireAnil,
  metaLogement, mouvementsCog, verifierGeographieCompatible,
} from "./lib/logement-index.mjs";

assertIndexWorktree();
const VERIFIER = process.argv.includes("--verifier");

async function main() {
  const file = JSON.parse(await fsp.readFile(INDEX_JSON_PATH, "utf8"));
  const codes = file.communes.map((c) => c.insee);
  const referentiel = new Set(codes);

  const { mouvements, sha256: cogSha } = await mouvementsCog();
  verifierGeographieCompatible(mouvements);
  const fichiers = await fichiersDvf(LIVRAISON_PRODUCTION, ANNEES_PRODUCTION);
  const { achat, bilan } = await agregerDvf(fichiers, { geographie: "actuelle", referentiel, mouvements });
  const anil = await lireAnil();
  const logement = calculerLogement(codes, achat, anil);
  const meta = metaLogement({ livraison: LIVRAISON_PRODUCTION, annees: ANNEES_PRODUCTION, fichiers, empreintesAnil: anil.empreintes, cogSha, bilan, villesPLM: calculerVillesPLM(achat) });

  if (VERIFIER) {
    const ecarts = file.communes.filter((c) => JSON.stringify(c.logement) !== JSON.stringify(logement[c.insee]));
    const metaOk = JSON.stringify(file.meta.logement) === JSON.stringify(meta);
    console.error(`vérification : ${ecarts.length} commune(s) diffèrent, meta ${metaOk ? "identique" : "DIFFÉRENTE"}`);
    for (const c of ecarts.slice(0, 5)) console.error(` ${c.insee} ${c.nom}\n  index ${JSON.stringify(c.logement)}\n  rejeu ${JSON.stringify(logement[c.insee])}`);
    process.exit(ecarts.length || !metaOk ? 1 : 0);
  }

  let nAchat = 0, nLoc = 0;
  for (const c of file.communes) {
    c.logement = logement[c.insee];
    if (c.logement.achat.dispo) nAchat++;
    if (c.logement.location) nLoc++;
  }
  file.meta.logement = meta;
  await fsp.writeFile(INDEX_JSON_PATH, JSON.stringify(file), "utf8");
  console.error(`✓ logement patché : ${codes.length} communes, ${nAchat} avec achat, ${nLoc} avec location.`);
  console.error(JSON.stringify(bilan));
}

main().catch((e) => { console.error(e); process.exit(1); });
