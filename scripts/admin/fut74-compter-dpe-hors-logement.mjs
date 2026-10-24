#!/usr/bin/env node
// FUT-74 · COMBIEN DE DOSSIERS ONT RETENU UN DIAGNOSTIC QUI NE PORTE PAS SUR UN LOGEMENT ?
//
// LECTURE SEULE, PAR CONSTRUCTION. Chaque question est une requête HTTP `HEAD` avec
// `Prefer: count=exact` : le serveur rend le nombre dans un en-tête, aucune ligne ne voyage, et une
// requête `HEAD` ne peut rien écrire. Le script refuse toute autre méthode. Il n'affiche que des
// nombres : ni adresse, ni identifiant, ni contenu de dossier.
//
// À QUOI IL SERT. Le correctif FUT-74 neutralise à la lecture un DPE d'immeuble ou de grain indéterminé
// qui aurait été retenu avant lui (`dpeDuLogement`), sans réécrire la base. Ce script dit combien de
// dossiers sont dans ce cas, avant de déployer et après : s'il rend autre chose que 0 sur les lignes
// « immeuble » et « indéterminé », ces dossiers liront une réserve et offriront une nouvelle sélection,
// et leurs artefacts figés restent tels qu'ils ont été produits (procédure dans
// docs/audits/2026-10-24-fut74-dpe-immeuble.md, § 7).
//
// Premier passage : 24/10/2026, aucun dossier concerné.
//
//   node scripts/admin/fut74-compter-dpe-hors-logement.mjs
import { existsSync, readFileSync } from "node:fs";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis (.env.local).");
  process.exit(1);
}

async function compter(table, filtres) {
  const q = new URLSearchParams([["select", "id"], ...filtres]);
  const method = "HEAD";
  if (method !== "HEAD") throw new Error("lecture seule");
  const res = await fetch(`${url}/rest/v1/${table}?${q}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact", Range: "0-0" },
  });
  if (!res.ok && res.status !== 206) throw new Error(`${table} : HTTP ${res.status}`);
  return Number((res.headers.get("content-range") ?? "").split("/").pop());
}

const RETENU = ["dpe_selection_status", "in.(auto_confirmed,user_confirmed)"];
const S = "selected_dpe_snapshot";
const QUESTIONS = [
  ["Dossiers à DPE retenu", "address_dossiers", [RETENU]],
  ["  dont DPE d'immeuble (type « immeuble »)", "address_dossiers", [RETENU, [`${S}->>type_batiment`, "eq.immeuble"]]],
  ["  dont grain indéterminé (type absent)", "address_dossiers", [RETENU, [`${S}->>type_batiment`, "is.null"]]],
  ["  dont type hors énumération", "address_dossiers", [RETENU, [`${S}->>type_batiment`, "not.in.(appartement,maison,immeuble)"]]],
  ["  dont appartement généré à partir de l'immeuble", "address_dossiers", [RETENU, [`${S}->>methode_dpe`, "ilike.*partir des donn*"]]],
  ["Versions de rapport dont un candidat est un DPE d'immeuble", "logement_report_versions", [["report->dpeCandidates", 'cs.[{"type_batiment":"immeuble"}]']]],
  ["Versions de rapport dont un candidat est un appartement généré", "logement_report_versions", [["report->>dpeCandidates", "ilike.*partir des donn*"]]],
];

for (const [libelle, table, filtres] of QUESTIONS) {
  console.log(`${String(await compter(table, filtres)).padStart(6)}  ${libelle}`);
}
